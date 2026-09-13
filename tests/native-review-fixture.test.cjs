const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const ts = require("typescript");
const nativeRoot = path.resolve("scripts/native-review");
const { ROOT, expectedSources, sourceGraph, validateConfig } = require(
  path.join(nativeRoot, "prepare.cjs"),
);
const { buildHomebrewReviewURL, parseHomebrewReviewURL } = require(
  path.join(process.env.VESSLO_TEST_BUILD, "utils/handoff-contract.js"),
);
const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
function fixtureConfig() {
  const stateRoot = "/private/native-fixture-unit/State";
  return {
    fixtureId: "vesslo-native-review-unit-123456",
    marker: "VessloNativeReviewHarness/TestOnly/v1",
    hostBundleId: "top.hjm79.Vesslo.TestHost",
    hostPID: 12345,
    publisherSessionId: "11111111-1111-1111-1111-111111111111",
    uid: process.getuid(),
    stateRoot,
    stateDev: 1,
    stateIno: 2,
    evidenceRoot: "/private/native-fixture-unit/evidence",
    evidenceDev: 1,
    evidenceIno: 3,
    exportPath: `${stateRoot}/raycast_data.json`,
    receiptPath: `${stateRoot}/raycast_receipts.json`,
    manifestPath: `${stateRoot}/manifest.json`,
    manifestSHA256: "c".repeat(64),
    driverPath:
      "/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/script/raycast_native_review.py",
    driverSHA256: "a".repeat(64),
    transportPath: path.join(nativeRoot, "transport.py"),
    transportSHA256: "b".repeat(64),
    targets: ["Alpha", "Beta", "Gamma"].map((name, index) => ({
      appId: `${index + 2}`.repeat(8) + "-2222-2222-2222-222222222222",
      bundleId: `invalid.vesslo.nativefixture.${name.toLowerCase()}`,
      canonicalPath: `/VessloSynthetic/${name}.app`,
      caskToken: `vesslo-fixture-${name.toLowerCase()}`,
      installedVersion: "1.0.0",
      expectedTargetVersion: "2.0.0",
    })),
  };
}
function loadTemplate(file, imports) {
  const filename = path.join(nativeRoot, file);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2021,
      module: ts.ModuleKind.CommonJS,
    },
  });
  const module = { exports: {} };
  const wrapper = vm.runInNewContext(
    `(function(require,module,exports){${outputText}\n})`,
    { Buffer, Date, TextDecoder, setTimeout, clearTimeout },
    { filename },
  );
  wrapper(
    (name) => {
      if (!(name in imports))
        throw new Error(`Unexpected fixture capability: ${name}`);
      return imports[name];
    },
    module,
    module.exports,
  );
  return module.exports;
}

test("native fixture source transformation preserves all production source bytes and isolates only declared boundaries", () => {
  const config = fixtureConfig();
  const before = Object.fromEntries(
    [...sourceGraph()].map(([file, text]) => [file, sha256(text)]),
  );
  const result = expectedSources(config);
  const after = Object.fromEntries(
    [...sourceGraph()].map(([file, text]) => [file, sha256(text)]),
  );
  assert.deepEqual(after, before);
  assert.deepEqual(result.sourceHashes, before);
  const reader = result.sources["src/original/utils/data-reader.ts"];
  assert.equal(
    (reader.match(/await nativeFixtureAppStat\(path\)/g) || []).length,
    1,
  );
  assert.match(reader, /await this\.fileSystem\.stat\(this\.path\)/);
  assert.match(reader, /constants\.O_NOFOLLOW/);
  assert.ok(
    result.sources["src/original/utils/data.ts"].includes(
      JSON.stringify(config.exportPath),
    ),
  );
  assert.ok(
    result.sources["src/original/utils/receipt-reader.ts"].includes(
      JSON.stringify(config.receiptPath),
    ),
  );
  for (const name of ["handoff-contract", "receipt-contract"])
    assert.equal(
      result.sources[`src/original/utils/${name}.ts`],
      fs.readFileSync(path.join(ROOT, `src/utils/${name}.ts`), "utf8"),
    );
  assert.match(
    result.sources["src/original/utils/actions.ts"],
    /bridgeTransport/,
  );
  assert.doesNotMatch(
    result.sources["src/original/utils/actions.ts"],
    /\bopen\(url\)|NSWorkspace|\/usr\/bin\/open/,
  );
  assert.throws(
    () =>
      validateConfig({ ...config, receiptPath: "/Applications/Vesslo.app" }),
    /receiptPath/,
  );
});

test("native app probe grants only exact manifest synthetic paths and rejects unknown paths or changed state roots", async () => {
  const config = fixtureConfig();
  const seen = [];
  let metadata = {
    isDirectory: () => true,
    isSymbolicLink: () => false,
    dev: config.stateDev,
    ino: config.stateIno,
    uid: config.uid,
    mode: 0o700,
  };
  const { nativeFixtureAppStat } = loadTemplate("path-probe.ts", {
    fs: {
      promises: {
        lstat: async (path) => {
          seen.push(path);
          return metadata;
        },
      },
    },
    "./config": { config },
  });
  assert.equal(
    (await nativeFixtureAppStat("/VessloSynthetic/Alpha.app")).isDirectory(),
    true,
  );
  assert.deepEqual(seen, [config.stateRoot]);
  for (const denied of [
    "/Applications/Real.app",
    "/VessloSynthetic/Unknown.app",
    "/VessloSynthetic/Alpha.app/",
    config.exportPath,
    config.receiptPath,
  ]) {
    await assert.rejects(nativeFixtureAppStat(denied), { code: "EACCES" });
  }
  assert.equal(
    seen.length,
    1,
    "Unknown paths must fail before any file access",
  );
  metadata = { ...metadata, ino: config.stateIno + 1 };
  await assert.rejects(nativeFixtureAppStat("/VessloSynthetic/Beta.app"), {
    code: "EACCES",
  });
});

function bridgeFixture({
  execError = null,
  evidence = "missing",
  requestVersion = 2,
} = {}) {
  const config = fixtureConfig();
  const wrapperBytes = Buffer.from("synthetic test transport");
  config.transportSHA256 = sha256(wrapperBytes);
  const manifestBytes = Buffer.from("synthetic pinned manifest");
  config.manifestSHA256 = sha256(manifestBytes);
  const files = new Map([[config.manifestPath, manifestBytes]]);
  const writes = [],
    calls = [],
    toasts = [];
  const directory = {
    isDirectory: () => true,
    isSymbolicLink: () => false,
    dev: config.evidenceDev,
    ino: config.evidenceIno,
    uid: config.uid,
    mode: 0o700,
  };
  const promises = {
    async lstat(file) {
      if (
        file === config.evidenceRoot ||
        file.startsWith(config.evidenceRoot + "/")
      )
        return directory;
      if (file === config.transportPath)
        return { isFile: () => true, isSymbolicLink: () => false, nlink: 1 };
      throw new Error("Unexpected file access");
    },
    async realpath(file) {
      return file;
    },
    async readFile(file) {
      assert.equal(file, config.transportPath);
      return wrapperBytes;
    },
    async open(file, flags, mode) {
      if (flags & fs.constants.O_WRONLY) {
        const write = {
          path: file,
          flags,
          mode,
          text: null,
          synced: false,
          closed: false,
        };
        writes.push(write);
        return {
          async writeFile(text) {
            write.text = text;
          },
          async sync() {
            write.synced = true;
          },
          async close() {
            write.closed = true;
          },
        };
      }
      const content = files.get(file);
      if (!content)
        throw Object.assign(new Error("Missing evidence"), { code: "ENOENT" });
      const metadata = {
        isFile: () => true,
        nlink: 1,
        uid: config.uid,
        mode: 0o600,
        size: content.length,
        dev: 1,
        ino: 10,
        mtimeMs: 1,
        ctimeMs: 1,
      };
      return {
        async stat() {
          return metadata;
        },
        async close() {},
        async read(buffer, offset, length, position) {
          const bytesRead = Math.min(
            length,
            Math.max(0, content.length - position),
          );
          content.copy(buffer, offset, position, position + bytesRead);
          return { bytesRead };
        },
      };
    },
  };
  const exports = loadTemplate("actions.ts", {
    fs: { constants: fs.constants, promises },
    crypto: {
      ...crypto,
      randomUUID: () => "99999999-9999-9999-9999-999999999999",
    },
    path,
    child_process: {
      execFile: (file, args, options, callback) => {
        calls.push({ file, args, options });
        if (evidence !== "missing") {
          const output = args[args.indexOf("--output-dir") + 1],
            url = writes.at(-1).text;
          files.set(
            path.join(output, "delivery.json"),
            Buffer.from(
              JSON.stringify({
                schemaVersion: 1,
                hostPID:
                  evidence === "wrong-host"
                    ? config.hostPID + 1
                    : config.hostPID,
                hostSessionId: config.publisherSessionId,
                url,
              }),
            ),
          );
          files.set(
            path.join(output, "request-url.txt"),
            Buffer.from(url + "\n"),
          );
        }
        callback(execError, "", execError ? "ACK timeout after delivery" : "");
      },
    },
    "./handoff-execution": {
      createHomebrewReviewExecutor: () => async () => ({ kind: "opened" }),
    },
    "./handoff-contract": { parseHomebrewReviewURL },
    "./data-reader": {
      readCurrentVessloData: () => {
        throw new Error("Unit bridge cannot read production data");
      },
    },
    "../../native/config": { config },
    "../../native/api": {
      showToast: async (toast) => {
        toasts.push(toast);
      },
      Toast: {
        Style: { Failure: "failure", Success: "success", Animated: "animated" },
      },
    },
  });
  const request = {
    schemaVersion: requestVersion,
    requestId: "44444444-4444-4444-4444-444444444444",
    publisherSessionId: config.publisherSessionId,
    createdAt: new Date().toISOString(),
    inventoryRevision: 1,
    completedCheckRevision: 1,
    source: "homebrew",
    targets: [
      {
        ...config.targets[0],
        ...(requestVersion === 2
          ? { readinessEvidenceId: "55555555-5555-5555-5555-555555555555" }
          : {}),
      },
    ],
  };
  return {
    ...exports,
    config,
    writes,
    calls,
    toasts,
    url: buildHomebrewReviewURL(request),
  };
}

test("native action bridge retains exact sender URL bytes in a private file and uses one explicit process argument vector", async () => {
  const fixture = bridgeFixture();
  await fixture.bridgeTransport(fixture.url);
  assert.match(fixture.url, /^vesslo:\/\/review-homebrew\/v2\?payload=/);
  assert.equal(fixture.writes.length, 1);
  assert.equal(fixture.writes[0].text, fixture.url);
  assert.equal(fixture.writes[0].mode, 0o600);
  assert.equal(fixture.writes[0].synced, true);
  assert.equal(fixture.writes[0].closed, true);
  assert.ok(fixture.writes[0].flags & fs.constants.O_EXCL);
  assert.ok(fixture.writes[0].flags & fs.constants.O_NOFOLLOW);
  assert.equal(fixture.calls.length, 1);
  const call = fixture.calls[0];
  assert.equal(call.file, "/usr/bin/python3");
  assert.equal(call.options.shell, false);
  assert.equal(
    call.args[call.args.indexOf("--url-file") + 1],
    fixture.writes[0].path,
  );
  assert.equal(
    call.args[call.args.indexOf("--driver") + 1],
    fixture.config.driverPath,
  );
  assert.equal(
    call.args[call.args.indexOf("--driver-sha256") + 1],
    fixture.config.driverSHA256,
  );
  assert.equal(
    call.args[call.args.indexOf("--manifest") + 1],
    fixture.config.manifestPath,
  );
  assert.equal(
    call.args.includes(fixture.url),
    false,
    "The request must remain in its private input file, not shell text",
  );
});

test("historical native V1 URL evidence remains byte preserving without gaining V2 proof", async () => {
  const fixture = bridgeFixture({ requestVersion: 1 });
  await fixture.bridgeTransport(fixture.url);
  assert.match(fixture.url, /^vesslo:\/\/review-homebrew\/v1\?payload=/);
  assert.equal(fixture.writes[0].text, fixture.url);
  assert.equal(
    parseHomebrewReviewURL(fixture.url).targets[0].readinessEvidenceId,
    undefined,
  );
});

test("post-delivery errors retain an uncertain request only with exact bound delivery evidence and never retry", async () => {
  const uncertain = bridgeFixture({
    execError: new Error("ACK timeout"),
    evidence: "valid",
  });
  await uncertain.bridgeTransport(uncertain.url);
  assert.equal(uncertain.calls.length, 1);
  assert.equal(uncertain.writes.length, 1);
  assert.equal(
    uncertain.toasts.some((toast) =>
      /completed|accepted|not sent/i.test(toast.title ?? ""),
    ),
    false,
  );
  for (const evidence of ["missing", "wrong-host"]) {
    const rejected = bridgeFixture({
      execError: new Error("Delivery failed"),
      evidence,
    });
    await assert.rejects(
      rejected.bridgeTransport(rejected.url),
      /delivery failed/i,
    );
    assert.equal(rejected.calls.length, 1);
  }
});

test("offline native fixture verification rejects bundle or metadata tampering even when sidecar hashes are recomputed", async (t) => {
  const { execFileSync } = require("node:child_process");
  const esbuild = require("esbuild");
  const { COMMANDS, EXTERNALS, listFiles, manifestFor } = require(
    path.join(nativeRoot, "prepare.cjs"),
  );
  const { verifyNativeReview } = require(path.join(nativeRoot, "verify.cjs"));
  const config = fixtureConfig();
  config.fixtureId = `vesslo-native-review-unit-${crypto.randomBytes(6).toString("hex")}`;
  const directory = path.join(ROOT, ".ui-fixtures-native", config.fixtureId);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const write = (file, bytes) => {
    const destination = path.join(directory, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes, { mode: 0o600 });
  };
  const { sources, sourceHashes } = expectedSources(config);
  for (const [file, content] of Object.entries(sources)) write(file, content);
  const bundle = await esbuild.build({
    absWorkingDir: directory,
    entryPoints: COMMANDS.map((command) => `src/${command}.tsx`),
    outdir: "dist",
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22.22.2",
    jsx: "automatic",
    sourcemap: false,
    minify: false,
    metafile: true,
    plugins: [
      {
        name: "isolated-unit-fixture-build",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (EXTERNALS.has(args.path))
              return { path: args.path, external: true };
            const base = path.resolve(args.resolveDir, args.path);
            const file = [base, `${base}.ts`, `${base}.tsx`].find((candidate) =>
              Object.hasOwn(
                sources,
                path.relative(directory, candidate).split(path.sep).join("/"),
              ),
            );
            if (!file) throw new Error("Unexpected test build dependency");
            return { path: file };
          });
        },
      },
    ],
  });
  write(
    "dist/package.json",
    JSON.stringify(manifestFor(config), null, 2) + "\n",
  );
  write(
    "dist/assets/extension-icon.png",
    fs.readFileSync(path.join(ROOT, "assets/extension-icon.png")),
  );
  write("metafile.json", JSON.stringify(bundle.metafile, null, 2) + "\n");
  const manifest = {
    version: 1,
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim(),
    config,
    sourceHashes,
    files: Object.fromEntries(
      listFiles(directory).map((file) => [
        file,
        sha256(fs.readFileSync(path.join(directory, file))),
      ]),
    ),
  };
  const saveManifest = () =>
    write("fixture-manifest.json", JSON.stringify(manifest, null, 2));
  saveManifest();
  const baseline = await verifyNativeReview(directory, { inspect: false });
  assert.equal(baseline.verified, true);
  assert.equal(baseline.liveBindingVerified, false);
  assert.equal(baseline.launched, false);
  const target = `dist/${COMMANDS[0]}.js`,
    original = fs.readFileSync(path.join(directory, target));
  write(
    target,
    Buffer.concat([original, Buffer.from("\n// tampered compiled artifact\n")]),
  );
  await assert.rejects(
    verifyNativeReview(directory, { inspect: false }),
    /Artifact hash changed/,
  );
  manifest.files[target] = sha256(
    fs.readFileSync(path.join(directory, target)),
  );
  saveManifest();
  await assert.rejects(
    verifyNativeReview(directory, { inspect: false }),
    /canonical source compilation/,
  );
  write(target, original);
  manifest.files[target] = sha256(original);
  saveManifest();
  const pkg = JSON.parse(
    fs.readFileSync(path.join(directory, "dist/package.json")),
  );
  pkg.commands[0].title = "Tampered command";
  write("dist/package.json", JSON.stringify(pkg));
  manifest.files["dist/package.json"] = sha256(
    fs.readFileSync(path.join(directory, "dist/package.json")),
  );
  saveManifest();
  await assert.rejects(
    verifyNativeReview(directory, { inspect: false }),
    /manifest changed/,
  );
});

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const ts = require("typescript");
const esbuild = require("esbuild");
const ROOT = path.resolve(__dirname, "../..");
const COMMANDS = ["bulk-homebrew-update", "handoff-requests"];
const DEFAULT_DRIVER =
  "/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/script/raycast_native_review.py";
const NATIVE_EXPORTS = new Set([
  "Action",
  "ActionPanel",
  "Detail",
  "Color",
  "Icon",
  "List",
  "useNavigation",
  "Toast",
  "showToast",
]);
const EXTERNALS = new Set([
  "@raycast/api",
  "react",
  "react/jsx-runtime",
  "path",
  "fs",
  "os",
  "crypto",
  "child_process",
]);
const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const relativePath = (value) => value.split(path.sep).join("/");
function exactFile(file) {
  const stat = fs.lstatSync(file);
  if (
    !path.isAbsolute(file) ||
    fs.realpathSync(file) !== file ||
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.nlink !== 1
  )
    throw new Error(`Expected a canonical regular file: ${file}`);
  return stat;
}
function privateDirectory(directory) {
  const stat = fs.lstatSync(directory);
  if (
    !path.isAbsolute(directory) ||
    fs.realpathSync(directory) !== directory ||
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    stat.uid !== process.getuid() ||
    (stat.mode & 0o777) !== 0o700
  )
    throw new Error(`Expected a private canonical directory: ${directory}`);
  return stat;
}
function inspectBinding({
  transportPath,
  transportSHA256,
  driverPath,
  driverSHA256,
  manifestPath,
  manifestSHA256,
}) {
  exactFile(transportPath);
  exactFile(driverPath);
  exactFile(manifestPath);
  if (
    sha256(fs.readFileSync(transportPath)) !== transportSHA256 ||
    sha256(fs.readFileSync(driverPath)) !== driverSHA256
  )
    throw new Error("Native transport or driver changed.");
  const wrapperBytes = fs.readFileSync(transportPath);
  if (sha256(wrapperBytes) !== transportSHA256)
    throw new Error("Native transport changed while reading.");
  const wrapperSource = new TextDecoder("utf-8", { fatal: true }).decode(
    wrapperBytes,
  );
  const observedManifestSHA256 = sha256(fs.readFileSync(manifestPath));
  if (manifestSHA256 && manifestSHA256 !== observedManifestSHA256)
    throw new Error("Native host manifest changed.");
  return JSON.parse(
    execFileSync(
      "/usr/bin/python3",
      [
        "-I",
        "-B",
        "-c",
        wrapperSource,
        "--inspect",
        "--driver",
        driverPath,
        "--driver-sha256",
        driverSHA256,
        "--manifest",
        manifestPath,
        "--manifest-sha256",
        observedManifestSHA256,
      ],
      {
        encoding: "utf8",
        shell: false,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        env: {
          PATH: "/usr/bin:/bin",
          LANG: "en_US.UTF-8",
          PYTHONDONTWRITEBYTECODE: "1",
        },
      },
    ),
  );
}
function validateConfig(config) {
  if (
    !/^vesslo-native-review-[a-z0-9-]+$/.test(config.fixtureId) ||
    config.marker !== "VessloNativeReviewHarness/TestOnly/v1" ||
    config.hostBundleId !== "top.hjm79.Vesslo.TestHost" ||
    config.targets?.length !== 3 ||
    !Number.isInteger(config.hostPID) ||
    config.hostPID <= 0
  )
    throw new Error("Invalid native fixture binding.");
  for (const [key, leaf] of [
    ["exportPath", "raycast_data.json"],
    ["receiptPath", "raycast_receipts.json"],
    ["manifestPath", "manifest.json"],
  ])
    if (config[key] !== path.join(config.stateRoot, leaf))
      throw new Error(`Invalid bound ${key}.`);
  if (
    config.targets.some(
      (target) =>
        !/^\/VessloSynthetic\/(Alpha|Beta|Gamma)\.app$/.test(
          target.canonicalPath,
        ) ||
        !/^invalid\.vesslo\.nativefixture\.(alpha|beta|gamma)$/.test(
          target.bundleId,
        ) ||
        !/^vesslo-fixture-(alpha|beta|gamma)$/.test(target.caskToken),
    ) ||
    new Set(config.targets.map((target) => target.canonicalPath)).size !== 3
  )
    throw new Error("Unexpected synthetic target set.");
  for (const key of [
    "driverPath",
    "transportPath",
    "evidenceRoot",
    "stateRoot",
  ])
    if (
      !path.isAbsolute(config[key]) ||
      path.normalize(config[key]) !== config[key]
    )
      throw new Error(`Invalid canonical ${key}.`);
  for (const key of ["driverSHA256", "transportSHA256"])
    if (!/^[0-9a-f]{64}$/.test(config[key]))
      throw new Error("Invalid code hash.");
}
function replaceOnce(text, needle, replacement, name) {
  if (text.split(needle).length !== 2)
    throw new Error(`Source transform shape changed: ${name}`);
  return text.replace(needle, replacement);
}
function replaceInitializer(text, name, value, file) {
  const parsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const matches = parsed.statements.flatMap((node) =>
    ts.isVariableStatement(node)
      ? [...node.declarationList.declarations].filter(
          (decl) => ts.isIdentifier(decl.name) && decl.name.text === name,
        )
      : [],
  );
  if (matches.length !== 1 || !matches[0].initializer)
    throw new Error(`Constant transform shape changed: ${name}`);
  const init = matches[0].initializer;
  return (
    text.slice(0, init.getStart(parsed)) +
    JSON.stringify(value) +
    text.slice(init.end)
  );
}
function sourceGraph() {
  const sources = new Map();
  const pending = COMMANDS.map((command) => `${command}.tsx`);
  while (pending.length) {
    const file = pending.pop();
    if (sources.has(file)) continue;
    const original = fs.readFileSync(path.join(ROOT, "src", file), "utf8");
    sources.set(file, original);
    if (file === "utils/actions.ts") {
      pending.push("utils/handoff-execution.ts", "utils/data-reader.ts");
      continue;
    }
    const parsed = ts.createSourceFile(
      file,
      original,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    for (const node of parsed.statements)
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text.startsWith(".")
      ) {
        const base = path.posix.normalize(
          path.posix.join(path.posix.dirname(file), node.moduleSpecifier.text),
        );
        const resolved = [`${base}.ts`, `${base}.tsx`].find((candidate) =>
          fs.existsSync(path.join(ROOT, "src", candidate)),
        );
        if (!resolved || resolved.startsWith("../"))
          throw new Error(`Unexpected source dependency: ${file}`);
        pending.push(resolved);
      }
  }
  return sources;
}
function transformSource(text, file, config) {
  if (file === "utils/actions.ts")
    return fs.readFileSync(path.join(__dirname, "actions.ts"), "utf8");
  if (file === "utils/brew.ts")
    return require("../ui-fixture/common.cjs").transformSource(text, file);
  if (file === "utils/data.ts")
    text = replaceInitializer(text, "DATA_PATH", config.exportPath, file);
  if (file === "utils/receipt-reader.ts")
    text = replaceInitializer(text, "RECEIPTS_PATH", config.receiptPath, file);
  if (file === "utils/data-reader.ts") {
    text = replaceOnce(
      text,
      "await this.fileSystem.stat(path)",
      "await nativeFixtureAppStat(path)",
      "synthetic app path probe",
    );
    text =
      'import { nativeFixtureAppStat } from "../../native/path-probe";\n' +
      text;
  }
  const parsed = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const edits = [];
  for (const node of parsed.statements)
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier.text === "@raycast/api"
    ) {
      const bindings = node.importClause?.namedBindings;
      if (
        !bindings ||
        !ts.isNamedImports(bindings) ||
        bindings.elements.some(
          (element) =>
            !NATIVE_EXPORTS.has((element.propertyName ?? element.name).text),
        )
      )
        throw new Error(`Unapproved native API import: ${file}`);
      let specifier = relativePath(
        path.relative(path.dirname(`src/original/${file}`), "src/native/api"),
      );
      if (!specifier.startsWith(".")) specifier = `./${specifier}`;
      edits.push([
        node.moduleSpecifier.getStart(parsed),
        node.moduleSpecifier.end,
        JSON.stringify(specifier),
      ]);
    }
  for (const [start, end, replacement] of edits.reverse())
    text = text.slice(0, start) + replacement + text.slice(end);
  return text;
}
function expectedSources(config) {
  validateConfig(config);
  const original = sourceGraph();
  const sources = {};
  for (const [file, text] of original)
    sources[`src/original/${file}`] = transformSource(text, file, config);
  for (const file of ["api.tsx", "path-probe.ts"])
    sources[`src/native/${file}`] = fs.readFileSync(
      path.join(__dirname, file),
      "utf8",
    );
  sources["src/native/config.ts"] =
    `export const config = ${JSON.stringify(config, null, 2)} as const;\n`;
  for (const command of COMMANDS)
    sources[`src/${command}.tsx`] = fs
      .readFileSync(path.join(__dirname, "entry.tsx"), "utf8")
      .replace("__COMMAND__", command);
  return {
    sources,
    sourceHashes: Object.fromEntries(
      [...original].map(([file, text]) => [file, sha256(text)]),
    ),
  };
}
function listFiles(directory, prefix = "") {
  return fs
    .readdirSync(path.join(directory, prefix), { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.isSymbolicLink())
        throw new Error("Symlink in generated artifact.");
      const file = relativePath(path.join(prefix, entry.name));
      return entry.isDirectory() ? listFiles(directory, file) : [file];
    })
    .sort();
}
function manifestFor(config) {
  const original = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json")));
  return {
    name: config.fixtureId,
    title: `[NATIVE FIXTURE] Vesslo ${config.fixtureId.split("-").at(-1)}`,
    description:
      "Live isolated TestHost review and receipts. Synthetic app availability; no real updater execution.",
    icon: "extension-icon.png",
    author: original.author,
    version: "0.0.0",
    license: "MIT",
    categories: ["Developer Tools"],
    platforms: ["macOS"],
    commands: COMMANDS.map((name) => ({
      name,
      title: `[NATIVE FIXTURE] ${original.commands.find((command) => command.name === name).title}`,
      subtitle: config.fixtureId.split("-").at(-1),
      description:
        "Bound TestHost export and receipt IO; exact review delivery only.",
      mode: "view",
    })),
  };
}
async function prepareNativeReview({
  manifestPath,
  evidenceRoot,
  driverPath = DEFAULT_DRIVER,
}) {
  const transportPath = path.join(__dirname, "transport.py");
  exactFile(transportPath);
  exactFile(driverPath);
  const bindingArgs = {
    transportPath,
    driverPath,
    transportSHA256: sha256(fs.readFileSync(transportPath)),
    driverSHA256: sha256(fs.readFileSync(driverPath)),
    manifestPath,
  };
  const inspected = inspectBinding(bindingArgs);
  const live = inspected.manifest;
  const evidence = privateDirectory(evidenceRoot);
  const state = privateDirectory(live.stateRoot);
  const fixtureId = `vesslo-native-review-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
  const config = {
    ...bindingArgs,
    fixtureId,
    evidenceRoot,
    evidenceDev: evidence.dev,
    evidenceIno: evidence.ino,
    stateRoot: live.stateRoot,
    stateDev: state.dev,
    stateIno: state.ino,
    uid: process.getuid(),
    marker: live.marker,
    hostBundleId: live.hostBundleId,
    hostPID: live.hostPID,
    publisherSessionId: live.publisherSessionId,
    exportPath: live.exportPath,
    receiptPath: live.receiptPath,
    targets: live.targets,
    manifestSHA256: sha256(fs.readFileSync(manifestPath)),
  };
  validateConfig(config);
  const base = path.join(ROOT, ".ui-fixtures-native");
  fs.mkdirSync(base, { recursive: true });
  if (fs.realpathSync(base) !== base || fs.lstatSync(base).isSymbolicLink())
    throw new Error("Unsafe native fixture base.");
  const directory = path.join(base, fixtureId);
  fs.mkdirSync(directory, { mode: 0o700 });
  const write = (file, content) => {
    const destination = path.join(directory, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, { flag: "wx", mode: 0o600 });
  };
  const { sources, sourceHashes } = expectedSources(config);
  for (const [file, text] of Object.entries(sources)) write(file, text);
  const allowed = new Set(
    Object.keys(sources).map((file) => path.join(directory, file)),
  );
  const result = await esbuild.build({
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
        name: "native-review-boundary",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (EXTERNALS.has(args.path)) {
              if (
                args.path === "@raycast/api" &&
                args.importer !== path.join(directory, "src/native/api.tsx")
              )
                throw new Error("Native API bypass.");
              if (
                args.path === "child_process" &&
                args.importer !==
                  path.join(directory, "src/original/utils/actions.ts")
              )
                throw new Error("Process capability outside the fixed bridge.");
              return { path: args.path, external: true };
            }
            const candidate = path.resolve(args.resolveDir, args.path);
            const found = [
              candidate,
              `${candidate}.ts`,
              `${candidate}.tsx`,
            ].find((file) => allowed.has(file));
            if (!found) throw new Error(`Unapproved module: ${args.path}`);
            return { path: found };
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
  write("metafile.json", JSON.stringify(result.metafile, null, 2) + "\n");
  write(
    "fixture-manifest.json",
    JSON.stringify(
      {
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
      },
      null,
      2,
    ) + "\n",
  );
  const verified = await require("./verify.cjs").verifyNativeReview(directory);
  return { directory, ...verified };
}
module.exports = {
  ROOT,
  COMMANDS,
  EXTERNALS,
  NATIVE_EXPORTS,
  sha256,
  exactFile,
  privateDirectory,
  inspectBinding,
  validateConfig,
  sourceGraph,
  transformSource,
  expectedSources,
  listFiles,
  manifestFor,
  prepareNativeReview,
};
if (require.main === module) {
  const args = process.argv.slice(2),
    options = {};
  const keys = {
    "--manifest": "manifestPath",
    "--evidence-root": "evidenceRoot",
    "--driver": "driverPath",
  };
  for (let index = 0; index < args.length; index += 2) {
    if (!keys[args[index]] || !args[index + 1] || options[keys[args[index]]])
      throw new Error(
        "Usage: prepare.cjs --manifest <live manifest> --evidence-root <private existing directory> [--driver <app driver>]",
      );
    options[keys[args[index]]] = args[index + 1];
  }
  if (!options.manifestPath || !options.evidenceRoot)
    throw new Error("Manifest and evidence root are required.");
  prepareNativeReview(options)
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

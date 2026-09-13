const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const esbuild = require("esbuild");
const { execFileSync } = require("node:child_process");
const {
  ROOT,
  COMMANDS,
  EXTERNALS,
  NATIVE_EXPORTS,
  sha256,
  validateConfig,
  inspectBinding,
  expectedSources,
  listFiles,
  manifestFor,
} = require("./prepare.cjs");

function auditBundle(text) {
  const source = ts.createSourceFile(
    "native-review.js",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const native = new Set();
  const processes = new Set();
  let execFileCalls = 0;
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === "require"
    ) {
      if (
        node.arguments.length !== 1 ||
        !ts.isStringLiteral(node.arguments[0]) ||
        !EXTERNALS.has(node.arguments[0].text)
      )
        throw new Error("Unapproved native fixture runtime import.");
      if (["@raycast/api", "child_process"].includes(node.arguments[0].text)) {
        if (
          !ts.isVariableDeclaration(node.parent) ||
          !ts.isIdentifier(node.parent.name)
        )
          throw new Error("Unrecognized native capability binding.");
        (node.arguments[0].text === "@raycast/api" ? native : processes).add(
          node.parent.name.text,
        );
      }
    }
    if (
      ts.isIdentifier(node) &&
      [
        "eval",
        "Function",
        "fetch",
        "global",
        "globalThis",
        "XMLHttpRequest",
        "WebSocket",
      ].includes(node.text)
    )
      throw new Error(`Unexpected capability: ${node.text}`);
    if (node.kind === ts.SyntaxKind.ImportKeyword)
      throw new Error("Dynamic import is forbidden.");
    ts.forEachChild(node, visit);
  };
  visit(source);
  const check = (node) => {
    if (
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node)
    ) {
      let root = node;
      const members = [];
      let computed = false;
      while (
        ts.isPropertyAccessExpression(root) ||
        ts.isElementAccessExpression(root)
      ) {
        if (ts.isElementAccessExpression(root)) computed = true;
        else members.unshift(root.name.text);
        root = root.expression;
      }
      if (ts.isIdentifier(root) && native.has(root.text)) {
        if (
          computed ||
          !NATIVE_EXPORTS.has(members[0]) ||
          (members[0] === "Action" &&
            members.length > 1 &&
            members.slice(1).join(".") !== "Push")
        )
          throw new Error("Unapproved Raycast action capability.");
      }
      if (ts.isIdentifier(root) && processes.has(root.text)) {
        if (computed || members.join(".") !== "execFile")
          throw new Error("Unapproved process capability.");
        if (members.length === 1) execFileCalls += 1;
      }
    }
    ts.forEachChild(node, check);
  };
  check(source);
  if (
    execFileCalls > 1 ||
    /vesslo:\/\/(?:update|app)|macappstore:\/\/.*\bopen\(|showInFinder|getBrewPath|\/bin\/brew/.test(
      text,
    )
  )
    throw new Error(
      "Generic application effect leaked into the native fixture.",
    );
  return { processReferences: execFileCalls };
}
async function verifyNativeReview(directory, { inspect = true } = {}) {
  if (
    !path.isAbsolute(directory) ||
    fs.realpathSync(directory) !== directory ||
    path.dirname(directory) !== path.join(ROOT, ".ui-fixtures-native") ||
    !/^vesslo-native-review-[a-z0-9-]+$/.test(path.basename(directory))
  )
    throw new Error("Invalid native fixture output root.");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, "fixture-manifest.json"), "utf8"),
  );
  validateConfig(manifest.config);
  if (
    manifest.version !== 1 ||
    manifest.config.fixtureId !== path.basename(directory) ||
    manifest.sourceRevision !==
      execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim()
  )
    throw new Error("Native fixture source identity changed.");
  const expected = expectedSources(manifest.config);
  if (
    JSON.stringify(manifest.sourceHashes) !==
    JSON.stringify(expected.sourceHashes)
  )
    throw new Error("Production sources changed after preparation.");
  const expectedFiles = [
    ...Object.keys(expected.sources),
    ...COMMANDS.map((command) => `dist/${command}.js`),
    "dist/package.json",
    "dist/assets/extension-icon.png",
    "metafile.json",
  ].sort();
  if (
    JSON.stringify(Object.keys(manifest.files).sort()) !==
      JSON.stringify(expectedFiles) ||
    JSON.stringify(listFiles(directory)) !==
      JSON.stringify([...expectedFiles, "fixture-manifest.json"].sort())
  )
    throw new Error("Native fixture artifact set changed.");
  for (const file of expectedFiles) {
    const bytes = fs.readFileSync(path.join(directory, file));
    if (sha256(bytes) !== manifest.files[file])
      throw new Error(`Artifact hash changed: ${file}`);
    if (
      Object.hasOwn(expected.sources, file) &&
      bytes.toString("utf8") !== expected.sources[file]
    )
      throw new Error(`Unapproved source transform: ${file}`);
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(directory, "dist/package.json")),
  );
  if (JSON.stringify(pkg) !== JSON.stringify(manifestFor(manifest.config)))
    throw new Error("Native fixture manifest changed.");
  if (
    sha256(
      fs.readFileSync(path.join(directory, "dist/assets/extension-icon.png")),
    ) !== sha256(fs.readFileSync(path.join(ROOT, "assets/extension-icon.png")))
  )
    throw new Error("Native fixture icon changed.");
  const meta = JSON.parse(
    fs.readFileSync(path.join(directory, "metafile.json")),
  );
  for (const [file, detail] of Object.entries(meta.inputs)) {
    if (!Object.hasOwn(expected.sources, file))
      throw new Error(`Unapproved build input: ${file}`);
    for (const dependency of detail.imports) {
      if (dependency.path === "@raycast/api" && file !== "src/native/api.tsx")
        throw new Error("Native API bypass in build graph.");
      if (
        dependency.path === "child_process" &&
        file !== "src/original/utils/actions.ts"
      )
        throw new Error("Process capability escaped its fixed transport.");
      if (dependency.external && !EXTERNALS.has(dependency.path)) {
        const local = path.posix.normalize(
          path.posix.join(path.posix.dirname(file), dependency.path),
        );
        if (
          !dependency.path.startsWith(".") ||
          ![local, `${local}.ts`, `${local}.tsx`].some((candidate) =>
            Object.hasOwn(expected.sources, candidate),
          )
        )
          throw new Error("Unapproved external build dependency.");
      }
    }
  }
  if (
    JSON.stringify(Object.keys(meta.outputs).sort()) !==
    JSON.stringify(COMMANDS.map((command) => `dist/${command}.js`).sort())
  )
    throw new Error("Unexpected bundle output.");
  for (const details of Object.values(meta.outputs))
    for (const dependency of details.imports)
      if (!dependency.external || !EXTERNALS.has(dependency.path))
        throw new Error("Unexpected runtime dependency.");
  for (const command of COMMANDS)
    auditBundle(
      fs.readFileSync(path.join(directory, `dist/${command}.js`), "utf8"),
    );
  // The manifest hashes are not a signature: rebuild canonical sources so changing a
  // bundle and its recorded hash together cannot add another process or native effect.
  const allowedInputs = new Set(
    Object.keys(expected.sources).map((file) => path.join(directory, file)),
  );
  const rebuilt = await esbuild.build({
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
    write: false,
    plugins: [
      {
        name: "canonical-native-review-verification",
        setup(build) {
          build.onLoad({ filter: /\.(ts|tsx)$/ }, (args) => {
            const relative = path
              .relative(directory, args.path)
              .split(path.sep)
              .join("/");
            if (!Object.hasOwn(expected.sources, relative))
              throw new Error("Unexpected canonical source load.");
            return {
              contents: expected.sources[relative],
              loader: relative.endsWith(".tsx") ? "tsx" : "ts",
              resolveDir: path.dirname(args.path),
            };
          });
          build.onResolve({ filter: /.*/ }, (args) => {
            if (EXTERNALS.has(args.path)) {
              if (
                args.path === "@raycast/api" &&
                args.importer !== path.join(directory, "src/native/api.tsx")
              )
                throw new Error("Native API bypass while rebuilding.");
              if (
                args.path === "child_process" &&
                args.importer !==
                  path.join(directory, "src/original/utils/actions.ts")
              )
                throw new Error(
                  "Unexpected process capability while rebuilding.",
                );
              return { path: args.path, external: true };
            }
            const candidate = path.resolve(args.resolveDir, args.path);
            const found = [
              candidate,
              `${candidate}.ts`,
              `${candidate}.tsx`,
            ].find((file) => allowedInputs.has(file));
            if (!found)
              throw new Error(`Unexpected canonical build input: ${args.path}`);
            return { path: found };
          });
        },
      },
    ],
  });
  if (JSON.stringify(rebuilt.metafile) !== JSON.stringify(meta))
    throw new Error("Canonical build graph differs from the recorded graph.");
  for (const output of rebuilt.outputFiles)
    if (!fs.readFileSync(output.path).equals(Buffer.from(output.contents)))
      throw new Error(
        `Bundle differs from canonical source compilation: ${path.basename(output.path)}`,
      );
  if (inspect) {
    const binding = inspectBinding(manifest.config);
    if (
      binding.manifestPath !== manifest.config.manifestPath ||
      binding.manifest.publisherSessionId !==
        manifest.config.publisherSessionId ||
      binding.manifest.hostPID !== manifest.config.hostPID ||
      sha256(fs.readFileSync(binding.manifestPath)) !==
        manifest.config.manifestSHA256
    )
      throw new Error("Live native host binding changed.");
  }
  return {
    verified: true,
    liveBindingVerified: inspect,
    fixtureId: manifest.config.fixtureId,
    commands: COMMANDS,
    sourceRevision: manifest.sourceRevision,
    installed: false,
    launched: false,
    syntheticAvailabilityOnly: manifest.config.targets.map(
      (target) => target.canonicalPath,
    ),
  };
}
module.exports = {
  verifyNativeReview,
  verifyNativeReviewFixture: verifyNativeReview,
  auditBundle,
};
if (require.main === module)
  verifyNativeReview(process.argv[2])
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });

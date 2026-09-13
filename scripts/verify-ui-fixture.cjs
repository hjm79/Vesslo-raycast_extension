const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const {
  ROOT,
  BASELINE,
  sourceRevision,
  SCENARIOS,
  COMMANDS,
  SOURCES,
  UI_EXPORTS,
  sha256,
  expectedSources,
  assertSafeSource,
  fixtureRoot,
  listFiles,
} = require("./ui-fixture/common.cjs");

function auditBundle(text) {
  const source = ts.createSourceFile(
    "fixture.js",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const nativeBindings = new Set();
  const allowedRequire = new Set([
    "@raycast/api",
    "react",
    "react/jsx-runtime",
    "path",
  ]);
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === "require"
    ) {
      if (
        node.arguments.length !== 1 ||
        !ts.isStringLiteral(node.arguments[0]) ||
        !allowedRequire.has(node.arguments[0].text)
      )
        throw new Error("Forbidden runtime require in fixture bundle.");
      if (node.arguments[0].text === "@raycast/api") {
        if (
          !ts.isVariableDeclaration(node.parent) ||
          !ts.isIdentifier(node.parent.name)
        )
          throw new Error("Unrecognized native API binding.");
        nativeBindings.add(node.parent.name.text);
      }
    }
    if (
      ts.isIdentifier(node) &&
      [
        "process",
        "eval",
        "Function",
        "fetch",
        "global",
        "globalThis",
        "XMLHttpRequest",
        "WebSocket",
      ].includes(node.text)
    )
      throw new Error(`Forbidden bundle capability ${node.text}`);
    if (node.kind === ts.SyntaxKind.ImportKeyword)
      throw new Error("Dynamic import in fixture bundle.");
    ts.forEachChild(node, visit);
  };
  visit(source);
  const checkNative = (node) => {
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
      if (ts.isIdentifier(root) && nativeBindings.has(root.text)) {
        if (computed || !UI_EXPORTS.has(members[0]))
          throw new Error("Forbidden native API member in fixture bundle.");
        if (
          members[0] === "Action" &&
          members.length > 1 &&
          members.slice(1).join(".") !== "Push"
        )
          throw new Error("Forbidden native Action member in fixture bundle.");
        if (!["Icon", "Color"].includes(members[0]) && members.includes("Link"))
          throw new Error("Native navigation link in fixture bundle.");
      }
    }
    ts.forEachChild(node, checkNative);
  };
  checkNative(source);
  if (/vesslo:\/\/|raycast_data\.json|\/Applications\/|\/bin\/brew/.test(text))
    throw new Error("Production target in fixture bundle.");
}

async function verifyFixture(input) {
  const directory = fixtureRoot(input);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, "fixture-manifest.json"), "utf8"),
  );
  if (
    manifest.version !== 2 ||
    manifest.baseline !== BASELINE ||
    manifest.sourceRevision !== sourceRevision() ||
    !SCENARIOS.includes(manifest.scenario) ||
    manifest.fixtureId !== path.basename(directory) ||
    !manifest.fixtureId.startsWith(`vesslo-ui-fixture-${manifest.scenario}-`)
  )
    throw new Error("Invalid fixture identity or baseline.");
  const sources = expectedSources(manifest.scenario, manifest.fixtureId);
  const expectedFiles = [
    ...Object.keys(sources),
    ...COMMANDS.map((name) => `dist/${name}.js`),
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
    throw new Error("Unexpected or missing fixture artifact files.");
  for (const relative of SOURCES)
    if (
      manifest.sourceHashes[relative] !==
      sha256(fs.readFileSync(path.join(ROOT, "src", relative)))
    )
      throw new Error(`Source changed since fixture preparation: ${relative}`);
  for (const relative of expectedFiles) {
    const bytes = fs.readFileSync(path.join(directory, relative));
    if (sha256(bytes) !== manifest.files[relative])
      throw new Error(`Fixture artifact hash changed: ${relative}`);
    if (Object.hasOwn(sources, relative)) {
      if (bytes.toString() !== sources[relative])
        throw new Error(
          `Fixture source does not match its approved transform: ${relative}`,
        );
      assertSafeSource(bytes.toString(), relative);
    }
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(directory, "dist/package.json"), "utf8"),
  );
  const packageKeys = [
    "name",
    "title",
    "description",
    "icon",
    "author",
    "version",
    "license",
    "categories",
    "platforms",
    "commands",
  ].sort();
  const commandKeys = [
    "name",
    "title",
    "subtitle",
    "description",
    "mode",
  ].sort();
  if (
    JSON.stringify(Object.keys(pkg).sort()) !== JSON.stringify(packageKeys) ||
    !Array.isArray(pkg.commands) ||
    pkg.commands.some(
      (item) =>
        JSON.stringify(Object.keys(item).sort()) !==
        JSON.stringify(commandKeys),
    )
  )
    throw new Error("Unsafe fixture extension manifest.");
  if (
    pkg.name !== manifest.fixtureId ||
    !pkg.title.startsWith("[FIXTURE]") ||
    Object.hasOwn(pkg, "scripts") ||
    Object.hasOwn(pkg, "preferences") ||
    JSON.stringify(pkg.commands.map((item) => item.name)) !==
      JSON.stringify(COMMANDS) ||
    pkg.commands.some(
      (item) =>
        item.mode !== "view" ||
        item.preferences ||
        item.interval ||
        !item.title.startsWith("[FIXTURE]"),
    )
  )
    throw new Error("Unsafe fixture extension manifest.");
  const meta = JSON.parse(
    fs.readFileSync(path.join(directory, "metafile.json"), "utf8"),
  );
  for (const [name, details] of Object.entries(meta.inputs)) {
    if (!Object.hasOwn(sources, name))
      throw new Error(`Unexpected bundle input: ${name}`);
    for (const dependency of details.imports) {
      if (
        dependency.external &&
        !["@raycast/api", "react", "react/jsx-runtime", "path"].includes(
          dependency.path,
        )
      ) {
        const local = path.posix.normalize(
          path.posix.join(path.posix.dirname(name), dependency.path),
        );
        // esbuild lists erased TypeScript imports as external in input metadata.
        if (
          !dependency.path.startsWith(".") ||
          ![local, `${local}.ts`, `${local}.tsx`].some((candidate) =>
            Object.hasOwn(sources, candidate),
          )
        )
          throw new Error("Unexpected external dependency.");
      }
      if (dependency.path === "@raycast/api" && name !== "src/fixture/api.tsx")
        throw new Error("Native API bypass in build graph.");
    }
  }
  if (
    JSON.stringify(Object.keys(meta.outputs).sort()) !==
    JSON.stringify(COMMANDS.map((name) => `dist/${name}.js`).sort())
  )
    throw new Error("Unexpected bundle outputs.");
  for (const output of Object.values(meta.outputs)) {
    for (const dependency of output.imports)
      if (
        !dependency.external ||
        !["@raycast/api", "react", "react/jsx-runtime", "path"].includes(
          dependency.path,
        )
      )
        throw new Error("Unexpected runtime external dependency.");
  }
  const commands = [];
  for (const command of COMMANDS) {
    const code = fs.readFileSync(
      path.join(directory, `dist/${command}.js`),
      "utf8",
    );
    auditBundle(code);
    commands.push(
      await require("./ui-fixture/runtime.cjs").exerciseBundle(
        code,
        command,
        manifest.scenario,
      ),
    );
  }
  return {
    verified: true,
    scenario: manifest.scenario,
    baseline: manifest.baseline,
    sourceRevision: manifest.sourceRevision,
    commands,
    installed: false,
    launched: false,
  };
}

if (require.main === module) {
  if (process.argv.length !== 3) {
    console.error(
      "Usage: node scripts/verify-ui-fixture.cjs <fixture-directory>",
    );
    process.exitCode = 1;
  } else
    verifyFixture(process.argv[2])
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
}
module.exports = { verifyFixture, auditBundle };

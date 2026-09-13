const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");
const {
  ROOT,
  BASELINE,
  sourceRevision,
  SCENARIOS,
  COMMANDS,
  SOURCES,
  sha256,
  expectedSources,
  assertSafeSource,
  listFiles,
} = require("./ui-fixture/common.cjs");

async function prepareFixture(scenario = "ready-mixed") {
  if (!SCENARIOS.includes(scenario))
    throw new Error(`Unknown scenario. Choose: ${SCENARIOS.join(", ")}`);
  const head = sourceRevision();
  const id = `vesslo-ui-fixture-${scenario}-${Date.now().toString(36)}`;
  const sources = expectedSources(scenario, id);
  for (const [relative, text] of Object.entries(sources))
    assertSafeSource(text, relative);
  const base = path.join(ROOT, ".ui-fixtures");
  if (fs.existsSync(base) && fs.lstatSync(base).isSymbolicLink())
    throw new Error("Fixture output base must not be a symlink.");
  fs.mkdirSync(base, { recursive: true });
  const directory = path.join(base, id);
  fs.mkdirSync(directory);
  const write = (relative, content) => {
    const destination = path.join(directory, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, { flag: "wx" });
  };
  for (const [relative, text] of Object.entries(sources)) write(relative, text);
  const original = JSON.parse(
    fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
  );
  const manifest = {
    name: id,
    title: `[FIXTURE] Vesslo ${scenario} ${id.split("-").at(-1)}`,
    description:
      "Synthetic data and simulated actions only. Prepared without installation or application launch.",
    icon: "extension-icon.png",
    author: original.author,
    version: "0.0.0",
    license: original.license,
    categories: ["Developer Tools"],
    platforms: ["macOS"],
    commands: COMMANDS.map((name) => ({
      name,
      title: `[FIXTURE] ${original.commands.find((item) => item.name === name)?.title ?? name}`,
      subtitle: `${scenario} ${id.split("-").at(-1)}`,
      description:
        "Synthetic UI fixture. Every external action records intent only.",
      mode: "view",
    })),
  };
  write("dist/package.json", JSON.stringify(manifest, null, 2) + "\n");
  write(
    "dist/assets/extension-icon.png",
    fs.readFileSync(path.join(ROOT, "assets/extension-icon.png")),
  );
  const allowedInputs = new Set(
    Object.keys(sources).map((relative) => path.join(directory, relative)),
  );
  const result = await esbuild.build({
    absWorkingDir: directory,
    entryPoints: COMMANDS.map((name) => `src/${name}.tsx`),
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
        name: "fixture-capability-boundary",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (["react", "react/jsx-runtime", "path"].includes(args.path))
              return { path: args.path, external: true };
            if (args.path === "@raycast/api") {
              if (args.importer !== path.join(directory, "src/fixture/api.tsx"))
                throw new Error("Native API bypass outside fixture adapter.");
              return { path: args.path, external: true };
            }
            const candidate = path.resolve(args.resolveDir, args.path);
            const resolved = [
              candidate,
              `${candidate}.ts`,
              `${candidate}.tsx`,
            ].find((file) => allowedInputs.has(file));
            if (!resolved)
              throw new Error(`Unexpected fixture module: ${args.path}`);
            return { path: resolved };
          });
        },
      },
    ],
  });
  write("metafile.json", JSON.stringify(result.metafile, null, 2) + "\n");
  const files = Object.fromEntries(
    listFiles(directory).map((relative) => [
      relative,
      sha256(fs.readFileSync(path.join(directory, relative))),
    ]),
  );
  write(
    "fixture-manifest.json",
    JSON.stringify(
      {
        version: 2,
        baseline: BASELINE,
        sourceRevision: head,
        scenario,
        fixtureId: id,
        sourceHashes: Object.fromEntries(
          SOURCES.map((relative) => [
            relative,
            sha256(fs.readFileSync(path.join(ROOT, "src", relative))),
          ]),
        ),
        files,
      },
      null,
      2,
    ) + "\n",
  );
  const verification = await require("./verify-ui-fixture.cjs").verifyFixture(
    directory,
  );
  return { directory, ...verification };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 0 && (args.length !== 2 || args[0] !== "--scenario")) {
    console.error(
      "Usage: node scripts/prepare-ui-fixture.cjs [--scenario <name>]",
    );
    process.exitCode = 1;
  } else {
    prepareFixture(args[1])
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
module.exports = { prepareFixture };

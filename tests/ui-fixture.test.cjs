const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const { prepareFixture } = require("../scripts/prepare-ui-fixture.cjs");
const {
  verifyFixture,
  auditBundle,
} = require("../scripts/verify-ui-fixture.cjs");
const { createNativeApi } = require("../scripts/ui-fixture/runtime.cjs");
const {
  SCENARIOS,
  COMMANDS,
  transformSource,
  assertSafeSource,
  sha256,
} = require("../scripts/ui-fixture/common.cjs");

function loadFixtureTemplate(file, imports) {
  const source = fs.readFileSync(
    path.resolve("scripts/ui-fixture", file),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
    },
  });
  const module = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${outputText}\n})`, {
    Date,
  })(
    (name) => {
      assert.ok(
        Object.hasOwn(imports, name),
        `Unexpected fixture import: ${name}`,
      );
      return imports[name];
    },
    module,
    module.exports,
  );
  return module.exports;
}

function fixtureTemplates(scenario) {
  const built = (name) =>
    require(path.join(process.env.VESSLO_TEST_BUILD, "utils", `${name}.js`));
  const scenarios = loadFixtureTemplate("scenarios.ts", {
    "../original/utils/data-state": built("data-state"),
    "../original/utils/homebrew-readiness": built("homebrew-readiness"),
    "./config": { scenario },
  });
  return {
    ...scenarios,
    ...loadFixtureTemplate("receipts.ts", {
      "./receipt-contract": built("receipt-contract"),
      "./handoff-execution": built("handoff-execution"),
      "../../fixture/scenarios": scenarios,
      "../../fixture/config": { scenario },
    }),
  };
}

test("schema 3 synthetic scenarios retain the global failure while requiring exact current target proof", () => {
  const { homebrewTargetReadinessReason } = require(
    path.join(process.env.VESSLO_TEST_BUILD, "utils/homebrew-readiness.js"),
  );
  const { buildHomebrewReviewRequest } = require(
    path.join(process.env.VESSLO_TEST_BUILD, "utils/handoff-execution.js"),
  );
  for (const scenario of [
    "schema3-ready",
    "schema3-source-failed-ready-targets",
  ]) {
    const { data } = fixtureTemplates(scenario).getFixtureSnapshot();
    const app = data.apps[0];
    assert.equal(data.schemaVersion, 3);
    assert.equal(homebrewTargetReadinessReason(data, app), null);
    const request = buildHomebrewReviewRequest(
      data,
      [app],
      "88888888-8888-8888-8888-888888888888",
      Date.parse(data.exportedAt),
    );
    assert.equal(request.schemaVersion, 2);
    assert.equal(
      request.targets[0].readinessEvidenceId,
      data.homebrewReadiness[0].evidenceId,
    );
    assert.equal(
      data.homebrewReadiness[0].target.readinessEvidenceId,
      undefined,
    );
    if (scenario.includes("source-failed")) {
      assert.equal(data.checkPhase, "failed");
      assert.equal(data.checkReason, "sourceFailure");
      assert.equal(data.checkedInventoryRevision, undefined);
    }
  }
  for (const scenario of [
    "schema3-target-failed",
    "schema3-proof-missing",
    "schema3-proof-expired",
    "schema3-cohort-incomplete",
  ]) {
    const { data } = fixtureTemplates(scenario).getFixtureSnapshot();
    assert.ok(homebrewTargetReadinessReason(data, data.apps[0]), scenario);
    assert.throws(
      () =>
        buildHomebrewReviewRequest(
          data,
          [data.apps[0]],
          "88888888-8888-8888-8888-888888888888",
          Date.parse(data.exportedAt),
        ),
      undefined,
      scenario,
    );
  }
});

test("synthetic V2 receipt fixtures preserve target evidence and keep V1 history at its original version", () => {
  for (const scenario of [
    "receipts-pending",
    "receipts-completed",
    "receipts-partial-failure",
    "receipts-mixed-history",
  ]) {
    const { state } = fixtureTemplates(scenario).useHandoffReceipts();
    assert.equal(state.status, "ready");
    assert.equal(state.receipts[0].schemaVersion, 2);
    assert.equal(state.receipts[0].request.schemaVersion, 2);
    assert.ok(state.receipts[0].targets[0].target.readinessEvidenceId);
    assert.equal(
      state.receipts[0].targets[0].target.readinessEvidenceId,
      state.receipts[0].request.targets[0].readinessEvidenceId,
    );
    if (scenario === "receipts-mixed-history") {
      assert.equal(state.receipts.length, 2);
      const history = state.receipts[1];
      assert.equal(history.schemaVersion, 1);
      assert.equal(history.request.schemaVersion, 1);
      assert.equal(history.phase, "cancelled");
      assert.equal(history.request.targets[0].readinessEvidenceId, undefined);
    }
  }
});

test("fixture native boundary rejects external APIs and persisted dropdowns", () => {
  const api = createNativeApi();
  for (const property of [
    "open",
    "showInFinder",
    "launchCommand",
    "Clipboard",
    "LocalStorage",
    "getPreferenceValues",
  ]) {
    assert.throws(() => api[property], /Forbidden native API/);
  }
  for (const property of [
    "CopyToClipboard",
    "OpenInBrowser",
    "ShowInFinder",
    "Paste",
  ]) {
    assert.throws(() => api.Action[property], /Forbidden native API/);
  }
  assert.throws(() => api.List.Dropdown({ storeValue: true }), /persistence/);
  assert.doesNotThrow(() => api.List.Dropdown({ storeValue: false }));
  for (const metadata of [api.Detail.Metadata, api.List.Item.Detail.Metadata]) {
    assert.doesNotThrow(() =>
      metadata.Label({
        title: "App path",
        text: "/__vesslo_fixture__/app.app",
      }),
    );
    assert.throws(() => metadata.Link, /Forbidden native API/);
  }
  assert.throws(
    () =>
      api.List.Item.Detail({ markdown: "[remote](https://example.invalid)" }),
    /External image or Markdown/,
  );
  assert.doesNotThrow(() =>
    api.List.Item.Detail({ markdown: "`https://example.invalid`" }),
  );
  assert.throws(
    () =>
      api.List.Item.Detail({
        markdown: "`literal` [link](https://example.invalid)",
      }),
    /External image or Markdown/,
  );
  assert.throws(
    () =>
      api.List.Item.Detail({ markdown: "`unclosed https://example.invalid" }),
    /Invalid literal code span/,
  );
  assert.throws(
    () => api.List.Item({ icon: { fileIcon: "/Applications/Example.app" } }),
    /Non-synthetic native file icon/,
  );
});

test("fixture source transform refuses new capability imports and dynamic execution", () => {
  for (const source of [
    'import { open as launch } from "@raycast/api";',
    'import * as api from "@raycast/api";',
    'import api from "@raycast/api";',
  ])
    assert.throws(() => transformSource(source, "search-apps.tsx"));
  for (const source of [
    'import { open } from "@raycast/api";',
    'export { open } from "@raycast/api";',
    'import x from "@raycast/api/subpath";',
    'import x from "node:fs";',
    'import x from "fs/promises";',
    'import x from "child_process";',
    'import x from "module";',
    'import x from "worker_threads";',
    'import("./utils/actions")',
    "const x = require;",
    'eval("1")',
    'new Function("return 1")',
    'fetch("https://example.invalid")',
    'const x = <Action.OpenInBrowser url="https://example.invalid" />;',
  ])
    assert.throws(() =>
      assertSafeSource(source, "src/original/search-apps.tsx"),
    );
});

test("fixture bundle audit rejects imported and aliased native effects", () => {
  for (const source of [
    'const native = require("@raycast/api"); native.open("x");',
    'const native = require("@raycast/api"); const launch = native.open;',
    'const native = require("@raycast/api"); native["open"]("x");',
    'const { open } = require("@raycast/api");',
    'const native = require("@raycast/api"); native.Action.CopyToClipboard;',
    'require("node:fs");',
    'require("child_process");',
    "require(variable);",
    "process.mainModule;",
    'eval("1");',
    'const target = "vesslo://";',
  ])
    assert.throws(() => auditBundle(source));
});

test("all fixture builds execute actual commands with inert native effects", async (t) => {
  for (const scenario of SCENARIOS) {
    await t.test(scenario, async () => {
      const result = await prepareFixture(scenario);
      try {
        assert.equal(result.verified, true);
        assert.equal(result.installed, false);
        assert.equal(result.launched, false);
        assert.deepEqual(
          result.commands.map((item) => item.command),
          COMMANDS,
        );
        for (const item of result.commands) {
          assert.ok(item.callbacksExercised > 0);
          assert.equal(item.unchangedPollingUpdates, 0);
          assert.equal(item.timersAfterUnmount, 0);
        }
      } finally {
        fs.rmSync(result.directory, { recursive: true });
      }
    });
  }
});

test("fixture verifier rejects drift, extra files, symlinks and unsafe manifest keys", async () => {
  const { directory } = await prepareFixture("ready-mixed");
  const manifestPath = path.join(directory, "fixture-manifest.json");
  const savedManifest = fs.readFileSync(manifestPath, "utf8");
  try {
    const sourcePath = path.join(directory, "src/fixture/events.ts");
    const originalSource = fs.readFileSync(sourcePath, "utf8");
    fs.appendFileSync(sourcePath, "\n// changed\n");
    await assert.rejects(verifyFixture(directory), /hash changed/);
    const manifest = JSON.parse(savedManifest);
    manifest.files["src/fixture/events.ts"] = sha256(
      fs.readFileSync(sourcePath),
    );
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    await assert.rejects(verifyFixture(directory), /approved transform/);
    fs.writeFileSync(sourcePath, originalSource);
    fs.writeFileSync(manifestPath, savedManifest);

    const bundlePath = path.join(directory, "dist/search-apps.js");
    const originalBundle = fs.readFileSync(bundlePath, "utf8");
    fs.appendFileSync(
      bundlePath,
      '\nconst nativeLeak = require("@raycast/api"); nativeLeak.open("never");\n',
    );
    const forged = JSON.parse(savedManifest);
    forged.files["dist/search-apps.js"] = sha256(fs.readFileSync(bundlePath));
    fs.writeFileSync(manifestPath, JSON.stringify(forged));
    await assert.rejects(
      verifyFixture(directory),
      /Forbidden native API member/,
    );
    fs.writeFileSync(bundlePath, originalBundle);
    fs.writeFileSync(manifestPath, savedManifest);

    const extra = path.join(directory, "extra.ts");
    fs.writeFileSync(extra, "export const extra = true;");
    await assert.rejects(verifyFixture(directory), /artifact files/);
    fs.unlinkSync(extra);
    fs.symlinkSync("src/fixture/events.ts", extra);
    await assert.rejects(verifyFixture(directory), /Symlink/);
    fs.unlinkSync(extra);

    const pkgPath = path.join(directory, "dist/package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.scripts = { develop: "must not execute" };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg));
    const changed = JSON.parse(savedManifest);
    changed.files["dist/package.json"] = sha256(fs.readFileSync(pkgPath));
    fs.writeFileSync(manifestPath, JSON.stringify(changed));
    await assert.rejects(
      verifyFixture(directory),
      /Unsafe fixture extension manifest/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
});

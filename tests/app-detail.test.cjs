const test = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const Module = require("node:module");
const React = require("react");

function nativeComponent(name, members = {}) {
  return Object.assign((props) => React.createElement(name, props), members);
}
function nativeMetadata(name) {
  return nativeComponent(name, {
    Label: `${name}.Label`,
    Separator: `${name}.Separator`,
  });
}
const api = {
  Color: new Proxy({}, { get: (_, key) => key }),
  Icon: new Proxy({}, { get: (_, key) => key }),
  Detail: nativeComponent("Detail", {
    Metadata: nativeMetadata("Detail.Metadata"),
  }),
  List: {
    Item: {
      Detail: { Metadata: nativeMetadata("List.Item.Detail.Metadata") },
    },
  },
  Action: nativeComponent("Action", {
    CopyToClipboard: "Action.CopyToClipboard",
  }),
  ActionPanel: nativeComponent("ActionPanel"),
};
const originalLoad = Module._load;
Module._load = function (request) {
  if (request === "@raycast/api") return api;
  return originalLoad.apply(this, arguments);
};
const { AppDetail, AppDetailMetadata, appDetailMarkdown } = require(
  join(process.env.VESSLO_TEST_BUILD, "components/AppDetail.js"),
);
const { auditReviewMarkdown } = require(
  join(process.env.VESSLO_TEST_BUILD, "utils/audit-warning.js"),
);
Module._load = originalLoad;
const fixture = require("./fixtures/current-app.json");

function collect(node, type, output = []) {
  if (!node || typeof node !== "object") return output;
  if (Array.isArray(node)) {
    node.forEach((child) => collect(child, type, output));
    return output;
  }
  if (typeof node.type === "function")
    return collect(node.type(node.props), type, output);
  if (node.type === type) output.push(node.props);
  collect(node.props?.children, type, output);
  return output;
}

test("inline and full details retain app identity in native metadata without source pills or links", () => {
  const app = {
    ...fixture,
    sources: ["Brew", "Homebrew", "Sparkle"],
    developer: "Example\u202E Developer\nTeam",
    bundleId: "com.example\0.app",
    path: "/Applications/[App](https://example.invalid).app",
  };
  for (const variant of ["list", "detail"]) {
    const prefix =
      variant === "list" ? "List.Item.Detail.Metadata" : "Detail.Metadata";
    const tree = AppDetailMetadata({ app, variant });
    const labels = collect(tree, `${prefix}.Label`);
    assert.deepEqual(
      Object.fromEntries(labels.map(({ title, text }) => [title, text])),
      {
        "Installed version": "1.0",
        "Target version": "2.0",
        Sources: "Homebrew, Sparkle",
        "Homebrew cask": "fixture",
        "Bundle ID": "com.example.app",
        "App path": app.path,
        Developer: "Example Developer Team",
        Record: "Installed app",
      },
    );
    assert.equal(collect(tree, `${prefix}.TagList`).length, 0);
    assert.equal(collect(tree, `${prefix}.Link`).length, 0);
  }
});

test("native detail body keeps policy and all audit warnings visible while metadata leaves the body", () => {
  const app = {
    ...fixture,
    securityReasons: ["unsignedApp", "notNotarized"],
    updateHealthStatus: "stale",
    updateHealthReasons: ["updateCheckStale"],
    updateHealthSource: "Sparkle",
    updateHealthSourceIdentity: "com.example.source",
    managementReasons: ["noMemoOrTags"],
  };
  const reason = "Review [request](vesslo://update/all) before proceeding";
  const markdown = appDetailMarkdown(app, reason);
  assert.ok(markdown.startsWith("> `" + reason + "`"));
  for (const text of [
    "Unsigned app",
    "Not notarized",
    "Update check is stale",
    "Sparkle",
    "com.example.source",
    "No memo or tags",
  ])
    assert.ok(markdown.includes(text), text);
  assert.match(markdown, /^### `Fixture App`$/m);
  assert.doesNotMatch(markdown, /^# /m);
  for (const title of [
    "Installed version",
    "Target version",
    "Homebrew cask",
    "Bundle ID",
    "App path",
    "Developer",
    "Record",
  ])
    assert.equal(markdown.includes(`**${title}:**`), false, title);
  const legacy = auditReviewMarkdown(app);
  assert.match(legacy, /^# `Fixture App`/);
  assert.ok(legacy.includes("**App path:**"));
  assert.ok(legacy.includes("**Installed version:**"));
});

test("full app details open Vesslo and reveal accessible installed apps", () => {
  const detail = AppDetail({
    app: fixture,
    reviewReason: null,
    navigationBundleId: fixture.bundleId,
    canShowInFinder: true,
  });
  assert.deepEqual(
    collect(detail.props.actions, "Action").map(({ title }) => title),
    ["Open in Vesslo", "Show in Finder"],
  );
  const hidden = AppDetail({ app: fixture, reviewReason: null });
  assert.deepEqual(
    collect(hidden.props.actions, "Action").map(({ title }) => title),
    ["Open in Vesslo"],
  );
});

test("full app details expose only identity copying and mark deleted records as historical", () => {
  const app = { ...fixture, isDeleted: true };
  const detail = AppDetail({
    app,
    reviewReason: "The app is a deleted record.",
    navigationBundleId: app.bundleId,
    canShowInFinder: true,
  });
  const labels = collect(detail.props.metadata, "Detail.Metadata.Label");
  assert.ok(labels.some((label) => label.title === "Recorded version"));
  assert.ok(labels.some((label) => label.title === "Recorded path"));
  assert.ok(
    labels.some(
      (label) =>
        label.title === "Record" && label.text === "Deleted app history",
    ),
  );
  assert.match(detail.props.markdown, /no installed app or update action/);
  assert.deepEqual(
    collect(detail.props.actions, "Action.CopyToClipboard").map(
      ({ title, content }) => [title, content],
    ),
    [
      ["Copy Bundle ID", app.bundleId],
      ["Copy Recorded Path", app.path],
    ],
  );
  assert.equal(collect(detail.props.actions, "Action").length, 0);
  assert.equal(collect(detail.props.actions, "Action.Push").length, 0);
});

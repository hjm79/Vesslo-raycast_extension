const assert = require("node:assert/strict");
const test = require("node:test");
const Module = require("node:module");
const { join } = require("node:path");
const { readFileSync } = require("node:fs");
const React = require("react");
const { parseReceiptEnvelope, initialReceiptState } = require(
  join(process.env.VESSLO_TEST_BUILD, "utils/receipt-contract.js"),
);
const { parseVessloData } = require(
  join(process.env.VESSLO_TEST_BUILD, "utils/data.js"),
);
const {
  schema3Fixture,
  receiptV2Fixture,
} = require("./helpers/readiness-fixture.cjs");
const now = Date.parse("2026-09-10T12:00:30Z");
const parse = (file) =>
  parseReceiptEnvelope(
    readFileSync(join(__dirname, "fixtures/app-integration", file), "utf8"),
    now,
  )[0];
let state, session;
let exportData;
let exportStatus = "ready";
let reloads = 0;
const api = { Icon: new Proxy({}, { get: (_, key) => key }), Detail: "Detail" };
api.Action = Object.assign((props) => React.createElement("Action", props), {
  CopyToClipboard: "Action.CopyToClipboard",
});
api.ActionPanel = (props) => props.children;
api.List = Object.assign((props) => React.createElement("List", props), {
  Section: "List.Section",
  EmptyView: "List.EmptyView",
  Item: Object.assign((props) => React.createElement("List.Item", props), {
    Detail: "List.Item.Detail",
  }),
});
const realLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@raycast/api") return api;
  if (request === "react")
    return { ...React, useState: (initial) => [initial, () => {}] };
  if (request.endsWith("/utils/useHandoffReceipts"))
    return {
      useHandoffReceipts: () => ({
        state,
        isLoading: false,
        refresh: async () => {
          reloads++;
        },
      }),
    };
  if (request.endsWith("/utils/useVessloData"))
    return {
      useVessloData: () => ({
        state: { status: exportStatus },
        data: exportData ?? { schemaVersion: 2, publisherSessionId: session },
      }),
    };
  return realLoad.call(this, request, parent, isMain);
};
const { HandoffRequestStatus, receiptMarkdown } = require(
  join(process.env.VESSLO_TEST_BUILD, "components/HandoffRequestStatus.js"),
);
const Command = require(
  join(process.env.VESSLO_TEST_BUILD, "handoff-requests.js"),
).default;
Module._load = realLoad;
function collect(node, type, found = []) {
  if (!node || typeof node !== "object") return found;
  if (Array.isArray(node)) {
    node.forEach((child) => collect(child, type, found));
    return found;
  }
  if (typeof node.type === "function")
    return collect(node.type(node.props), type, found);
  if (node.type === type) found.push(node.props);
  collect(node.props?.children, type, found);
  collect(node.props?.actions, type, found);
  collect(node.props?.detail, type, found);
  return found;
}

test("request status distinguishes waiting, accepted and unavailable without a resend or execute action", async () => {
  const receipt = parse("receipt-accepted.json");
  state = { ...initialReceiptState(), status: "ready" };
  let tree = React.createElement(HandoffRequestStatus, {
    request: receipt.request,
  });
  assert.match(collect(tree, "Detail")[0].markdown, /Awaiting Receipt/);
  state.receipts = [receipt];
  assert.match(
    collect(tree, "Detail")[0].markdown,
    /Accepted — Awaiting Vesslo Review/,
  );
  assert.match(
    collect(tree, "Detail")[0].markdown,
    /Execution and completion are not confirmed/,
  );
  const action = collect(tree, "Action");
  assert.deepEqual(
    action.map((entry) => entry.title),
    ["Reload Receipts"],
  );
  await action[0].onAction();
  assert.equal(reloads, 1);
  state.status = "permissionDenied";
  assert.match(collect(tree, "Detail")[0].markdown, /Receipt Unavailable/);
  assert.doesNotMatch(collect(tree, "Detail")[0].markdown, /# Completed/);
});

test("partial failure details preserve both exact targets and render arbitrary reasons as literal text", () => {
  const receipt = parse("receipt-partial-failure.json");
  receipt.targets[1].reason =
    "[literal](https://example.invalid) `escape` \u202econtrol";
  const text = receiptMarkdown(receipt);
  assert.match(text, /Failed — Check Each Target/);
  assert.match(text, /Completed — Verified by Vesslo/);
  assert.match(text, /example-editor/);
  assert.match(text, /example-viewer/);
  assert.match(
    text,
    /``\[literal\]\(https:\/\/example.invalid\) `escape` control``/,
  );
  assert.doesNotMatch(text, /\u202e/);
});

test("read-only command separates older publisher history and marks cached or expired rows unconfirmed", () => {
  const current = parse("receipt-completed.json");
  const old = parse("receipt-restarted.json");
  old.request.requestId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  old.request.publisherSessionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  session = current.request.publisherSessionId;
  state = {
    ...initialReceiptState(),
    status: "ready",
    receipts: [current, old],
  };
  const tree = React.createElement(Command);
  assert.deepEqual(
    collect(tree, "List.Section").map((section) => section.title),
    ["Current Export Session", "Earlier Publisher Session — History"],
  );
  assert.ok(
    collect(tree, "List.Item.Detail").some((detail) =>
      /different or unverified export session/.test(detail.markdown),
    ),
  );
  assert.ok(
    collect(tree, "Action").every(
      (action) => action.title === "Reload Receipts",
    ),
  );
  state.status = "malformed";
  state.reason = "Malformed receipt";
  assert.ok(
    collect(tree, "List.Item")
      .filter((item) => item.id !== "receipt-read-state")
      .every((item) => item.accessories[0].text === "Cached — unconfirmed"),
  );
  assert.ok(
    collect(tree, "List.Item.Detail").every(
      (detail) => !/^# Completed/.test(detail.markdown),
    ),
  );
  state = {
    ...initialReceiptState(),
    status: "ready",
    expiredReceipts: [current],
  };
  assert.equal(
    collect(tree, "List.Item")[0].accessories[0].text,
    "Expired history",
  );
});

test("schema 3 export keeps its V2 receipt in the current session with original readiness evidence", () => {
  const raw = schema3Fixture();
  raw.checkPhase = "failed";
  raw.checkReason = "sourceFailure";
  delete raw.checkedInventoryRevision;
  exportData = parseVessloData(JSON.stringify(raw));
  const current = parseReceiptEnvelope(
    JSON.stringify(receiptV2Fixture("receipt-completed.json")),
    now,
  )[0];
  state = { ...initialReceiptState(), status: "ready", receipts: [current] };
  try {
    const tree = React.createElement(Command);
    const sections = collect(tree, "List.Section");
    assert.equal(sections[0].title, "Current Export Session");
    assert.deepEqual(
      collect(sections[0].children, "List.Item").map((item) => item.id),
      [current.request.requestId],
    );
    assert.equal(collect(sections[1].children, "List.Item").length, 0);
    const detail = collect(tree, "List.Item.Detail")[0].markdown;
    assert.doesNotMatch(detail, /different or unverified export session/);
    assert.match(detail, /Completed — Verified by Vesslo/);
    for (const target of current.request.targets)
      assert.ok(detail.includes(target.readinessEvidenceId));
    assert.deepEqual(
      collect(tree, "Action").map((item) => item.title),
      ["Reload Receipts"],
    );

    exportStatus = "permissionDenied";
    assert.equal(
      collect(tree, "List.Section")[0].title,
      "Publisher Session Unverified — History",
    );
    assert.match(
      collect(tree, "List.Item.Detail")[0].markdown,
      /different or unverified export session/,
    );
  } finally {
    exportData = undefined;
    exportStatus = "ready";
  }
});

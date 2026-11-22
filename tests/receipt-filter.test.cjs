const assert = require("node:assert/strict");
const test = require("node:test");
const Module = require("node:module");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const React = require("react");
const { RECEIPT_PHASES, initialReceiptState, parseReceiptEnvelope } = require(
  join(process.env.VESSLO_TEST_BUILD, "utils/receipt-contract.js"),
);
const { filterHandoffReceipts, RECEIPT_STATUS_FILTER_LABELS } = require(
  join(process.env.VESSLO_TEST_BUILD, "utils/receipt-filter.js"),
);

const now = Date.parse("2026-09-10T12:00:30Z");
const receipt = (file) =>
  parseReceiptEnvelope(
    readFileSync(join(__dirname, "fixtures/app-integration", file), "utf8"),
    now,
  )[0];

const examples = () =>
  [
    receipt("receipt-accepted.json"),
    receipt("receipt-running.json"),
    receipt("receipt-verification-pending.json"),
    receipt("receipt-partial-failure.json"),
    receipt("receipt-completed.json"),
    receipt("receipt-partial-rejection.json"),
    receipt("receipt-cancelled.json"),
  ].map((entry, index) => {
    entry.request.requestId = `aaaaaaaa-aaaa-aaaa-aaaa-${String(index + 1).padStart(12, "0")}`;
    return entry;
  });

test("status options cover every contract phase with distinct rejected and cancelled choices", () => {
  assert.deepEqual(
    Object.keys(RECEIPT_STATUS_FILTER_LABELS)
      .filter((value) => value !== "all")
      .sort(),
    [...RECEIPT_PHASES].sort(),
  );
  assert.equal(RECEIPT_STATUS_FILTER_LABELS.all, "All Requests");
  assert.equal(RECEIPT_STATUS_FILTER_LABELS.accepted, "Awaiting Review");
  assert.equal(RECEIPT_STATUS_FILTER_LABELS.rejected, "Rejected");
  assert.equal(RECEIPT_STATUS_FILTER_LABELS.cancelled, "Cancelled");
  const receipts = examples();
  for (const status of RECEIPT_PHASES) {
    assert.deepEqual(
      filterHandoffReceipts(receipts, { status }).map((entry) => entry.phase),
      [status],
    );
  }
});

test("mixed results filter by the aggregate request phase rather than a successful individual target", () => {
  const mixed = receipt("receipt-partial-failure.json");
  assert.ok(mixed.targets.some((entry) => entry.phase === "completed"));
  assert.equal(
    filterHandoffReceipts([mixed], { status: "completed" }).length,
    0,
  );
  assert.deepEqual(filterHandoffReceipts([mixed], { status: "failed" }), [
    mixed,
  ]);
});

test("query and recorded phase combine without losing request identity and target reason search", () => {
  const receipts = examples();
  const accepted = receipts.find((entry) => entry.phase === "accepted");
  const failed = receipts.find((entry) => entry.phase === "failed");
  for (const query of [
    accepted.request.requestId,
    accepted.request.publisherSessionId,
    accepted.targets[0].target.canonicalPath,
    accepted.targets[0].target.bundleId,
    "  AWAITING REVIEW  ",
  ]) {
    assert.deepEqual(
      filterHandoffReceipts(receipts, { query, status: "accepted" }),
      [accepted],
    );
  }
  assert.deepEqual(
    filterHandoffReceipts(receipts, {
      query: failed.targets.find((entry) => entry.phase === "failed").reason,
      status: "failed",
    }),
    [failed],
  );
  assert.deepEqual(
    filterHandoffReceipts(receipts, {
      query: "Awaiting Review",
      status: "completed",
    }),
    [],
  );
});

test("filtering sorts a new array and leaves receipt identities and input ordering unchanged", () => {
  const earlier = receipt("receipt-accepted.json");
  const later = receipt("receipt-completed.json");
  earlier.updatedAt = "2026-09-10T12:00:01Z";
  later.updatedAt = "2026-09-10T12:00:20Z";
  const receipts = Object.freeze([
    Object.freeze(earlier),
    Object.freeze(later),
  ]);
  const before = JSON.stringify(receipts);
  const result = filterHandoffReceipts(receipts);
  assert.deepEqual(result, [later, earlier]);
  assert.notEqual(result, receipts);
  assert.equal(result[0], later);
  assert.equal(JSON.stringify(receipts), before);
});

let state;
let publisherSession;
let exportStatus;
let values;
let cursor;
let reloads;
const api = { Icon: new Proxy({}, { get: (_, key) => key }), Detail: "Detail" };
api.Action = Object.assign((props) => React.createElement("Action", props), {
  Push: "Action.Push",
  CopyToClipboard: "Action.CopyToClipboard",
});
api.ActionPanel = (props) => props.children;
api.List = Object.assign((props) => React.createElement("List", props), {
  Section: "List.Section",
  EmptyView: "List.EmptyView",
  Dropdown: Object.assign(
    (props) => React.createElement("List.Dropdown", props),
    {
      Item: "List.Dropdown.Item",
    },
  ),
  Item: Object.assign((props) => React.createElement("List.Item", props), {
    Detail: "List.Item.Detail",
  }),
});
const realLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "@raycast/api") return api;
  if (request === "react")
    return {
      ...React,
      useState: (initial) => {
        const index = cursor++;
        if (!(index in values)) values[index] = initial;
        return [
          values[index],
          (next) => {
            values[index] = next;
          },
        ];
      },
    };
  if (request.endsWith("/utils/useHandoffReceipts"))
    return {
      useHandoffReceipts: () => ({
        state,
        isLoading: false,
        refresh: () => {
          reloads++;
        },
      }),
    };
  if (request.endsWith("/utils/useVessloData"))
    return {
      useVessloData: () => ({
        state: { status: exportStatus },
        data: { schemaVersion: 3, publisherSessionId: publisherSession },
      }),
    };
  return realLoad.call(this, request, parent, isMain);
};
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
  for (const name of ["children", "actions", "detail", "searchBarAccessory"]) {
    collect(node.props?.[name], type, found);
  }
  return found;
}

function setup(receipts = examples()) {
  state = { ...initialReceiptState(), status: "ready", receipts };
  publisherSession = receipts[0]?.request.publisherSessionId;
  exportStatus = "ready";
  values = [];
  reloads = 0;
}
function render() {
  cursor = 0;
  return Command();
}
const rows = (tree) =>
  collect(tree, "List.Item").filter(
    (entry) => entry.id !== "receipt-read-state",
  );

test("dropdown filters search results and clearing an empty match restores both controls and records", () => {
  setup();
  let tree = render();
  const dropdown = collect(tree, "List.Dropdown")[0];
  assert.equal(dropdown.value, "all");
  assert.equal(dropdown.storeValue, false);
  assert.deepEqual(
    collect(tree, "List.Dropdown.Item").map((entry) => entry.title),
    Object.values(RECEIPT_STATUS_FILTER_LABELS),
  );
  dropdown.onChange("completed");
  collect(tree, "List")[0].onSearchTextChange("unknown-app");
  tree = render();
  assert.equal(rows(tree).length, 0);
  assert.equal(
    collect(tree, "List.EmptyView")[0].title,
    "No Matching Requests",
  );
  const clear = collect(tree, "Action").find(
    (entry) => entry.title === "Clear Request Filters",
  );
  clear.onAction();
  tree = render();
  assert.equal(collect(tree, "List.Dropdown")[0].value, "all");
  assert.equal(collect(tree, "List")[0].searchText, "");
  assert.equal(rows(tree).length, RECEIPT_PHASES.length);
});

test("completed filter preserves current, earlier-session and expired trust distinctions", () => {
  const current = receipt("receipt-completed.json");
  const history = structuredClone(current);
  history.request.requestId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  history.request.publisherSessionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const expired = structuredClone(current);
  expired.request.requestId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
  setup([current, history, receipt("receipt-accepted.json")]);
  state.expiredReceipts = [expired];
  collect(render(), "List.Dropdown")[0].onChange("completed");
  const tree = render();
  const visible = rows(tree);
  assert.equal(visible.length, 3);
  const currentRow = visible.find(
    (entry) => entry.id === current.request.requestId,
  );
  assert.equal(currentRow.icon, "CheckCircle");
  assert.equal(currentRow.accessories[0].text, "Completed");
  const historyRow = visible.find(
    (entry) => entry.id === history.request.requestId,
  );
  assert.equal(historyRow.accessories[0].text, "History · Completed");
  const expiredRow = visible.find(
    (entry) => entry.id === expired.request.requestId,
  );
  assert.equal(expiredRow.accessories[0].text, "Expired history");
  for (const row of [historyRow, expiredRow]) {
    assert.notEqual(row.icon, "CheckCircle");
    const compact = collect(row.detail, "List.Item.Detail")[0].markdown;
    const technical = collect(
      collect(row.actions, "Action.Push")[0].target,
      "Detail",
    )[0].markdown;
    for (const text of [compact, technical]) {
      assert.match(text, /Current result unconfirmed/);
      assert.doesNotMatch(text, /Verified by Vesslo/);
    }
  }
});

test("cached and unverified-session completed records stay unconfirmed after filtering", async () => {
  const completed = receipt("receipt-completed.json");
  setup([completed]);
  collect(render(), "List.Dropdown")[0].onChange("completed");
  for (const readStatus of ["permissionDenied", "malformed", "ready"]) {
    state.status = readStatus;
    exportStatus = readStatus === "ready" ? "permissionDenied" : "ready";
    const tree = render();
    const row = rows(tree)[0];
    assert.equal(
      row.accessories[0].text,
      readStatus === "ready"
        ? "Unverified · Completed"
        : "Cached · Unconfirmed",
    );
    assert.notEqual(row.icon, "CheckCircle");
    assert.match(
      collect(row.detail, "List.Item.Detail")[0].markdown,
      /Current result unconfirmed/,
    );
    const actions = collect(row.actions, "Action");
    assert.deepEqual(
      actions.map((entry) => entry.title),
      ["Reload Receipts", "Clear Request Filters"],
    );
    assert.equal(
      collect(row.actions, "Action.Push")[0].title,
      "View Technical Details",
    );
    assert.equal(
      collect(row.actions, "Action.CopyToClipboard")[0].content,
      completed.request.requestId,
    );
    await actions[0].onAction();
  }
  assert.equal(reloads, 3);
});

test("read errors remain visible with reset available even when filters hide every cached receipt", () => {
  setup([receipt("receipt-completed.json")]);
  collect(render(), "List.Dropdown")[0].onChange("failed");
  state.status = "permissionDenied";
  state.reason = "Receipt access denied";
  const tree = render();
  assert.equal(rows(tree).length, 0);
  assert.equal(collect(tree, "List.EmptyView").length, 0);
  const notice = collect(tree, "List.Item").find(
    (entry) => entry.id === "receipt-read-state",
  );
  assert.ok(notice);
  collect(notice.actions, "Action")
    .find((entry) => entry.title === "Clear Request Filters")
    .onAction();
  assert.equal(rows(render()).length, 1);
});

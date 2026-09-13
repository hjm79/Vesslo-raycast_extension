const assert = require("node:assert/strict");
const test = require("node:test");
const { createHash } = require("node:crypto");
const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");
const Module = require("node:module");

const build = process.env.VESSLO_TEST_BUILD;
if (!build)
  throw new Error(
    "Compile with scripts/test.cjs conventions before running this test.",
  );
const { parseVessloData } = require(join(build, "utils/data.js"));
const { assessUpdateCount, reviewSnapshotReason } = require(
  join(build, "utils/data-state.js"),
);
const { buildHomebrewReviewRequest } = require(
  join(build, "utils/handoff-execution.js"),
);
const {
  buildHomebrewReviewURL,
  parseHomebrewReviewURL,
  handoffRequestReason,
  HANDOFF_REQUEST_LIFETIME_MS,
} = require(join(build, "utils/handoff-contract.js"));
const {
  parseReceiptEnvelope,
  bindReceipt,
  initialReceiptState,
  receiptTransitionReason,
  requestFingerprint,
  isTerminalReceipt,
  isExpiredReceipt,
  MalformedReceiptError,
} = require(join(build, "utils/receipt-contract.js"));

// Only the pure presentation function is loaded. Native APIs and file-reading hooks are inert.
const realLoad = Module._load;
let receiptMarkdown;
try {
  Module._load = function (request, parent, isMain) {
    if (request === "@raycast/api") return {};
    if (request.endsWith("/utils/useHandoffReceipts"))
      return {
        useHandoffReceipts: () => {
          throw new Error("Native fixture tests must not read live receipts.");
        },
      };
    return realLoad.call(this, request, parent, isMain);
  };
  ({ receiptMarkdown } = require(
    join(build, "components/HandoffRequestStatus.js"),
  ));
} finally {
  Module._load = realLoad;
}

const directory = join(__dirname, "fixtures/native-review-app");
const bytes = (name) => readFileSync(join(directory, name));
const json = (name) => JSON.parse(bytes(name).toString("utf8"));
const provenance = json("provenance.json");
const manifest = json("manifest.json");
// The native run is historical. These tests never move archived requests to today's clock.
const receiptClock = Date.parse(provenance.receiptClock);
const snapshot = () => parseVessloData(bytes("export.json").toString("utf8"));
const envelope = (name, now = receiptClock) =>
  parseReceiptEnvelope(bytes(name).toString("utf8"), now);
function receiptFor(name, request) {
  const receipt = envelope(name).find(
    (entry) =>
      entry.request.requestId.toLowerCase() === request.requestId.toLowerCase(),
  );
  assert.ok(receipt, `${name} must contain exact request ${request.requestId}`);
  return receipt;
}
function stateFor(receipts, now = receiptClock) {
  return {
    ...initialReceiptState(),
    status: "ready",
    checkedAt: now,
    receipts: receipts.filter((receipt) => !isExpiredReceipt(receipt, now)),
    expiredReceipts: receipts.filter((receipt) =>
      isExpiredReceipt(receipt, now),
    ),
  };
}
function selectedApps(data, request) {
  return request.targets.map((target) => {
    const app = data.apps.find(
      (entry) => entry.id.toLowerCase() === target.appId.toLowerCase(),
    );
    assert.ok(
      app,
      "Native request target must come from the same exported inventory",
    );
    return app;
  });
}
function builtRequest(name) {
  const original = json(name);
  const data = snapshot();
  return buildHomebrewReviewRequest(
    data,
    selectedApps(data, original),
    original.requestId,
    Date.parse(original.createdAt),
  );
}

const requests = [
  {
    request: "multiple-request.json",
    accepted: "multiple-receipts.json",
    targetCount: 2,
  },
  {
    request: "single-request.json",
    accepted: "single-receipts.json",
    targetCount: 1,
  },
];

test("native app fixtures retain the exact source bytes and one recorded delivery session", () => {
  assert.equal(provenance.historicalFixture, true);
  assert.equal(provenance.files.length, 10);
  assert.equal(provenance.publisherSessionId, manifest.publisherSessionId);
  assert.match(
    provenance.sourceRoot,
    /\/Docs\/fixtures\/native-review\/delivery-current$/,
  );
  assert.match(provenance.sourceAppHEAD, /^[0-9a-f]{40}$/);
  assert.equal(
    new Set(provenance.files.map((entry) => entry.file)).size,
    provenance.files.length,
  );
  for (const entry of provenance.files) {
    const originalBytes = bytes(entry.file);
    assert.equal(entry.copyKind, "exactBytes", entry.file);
    assert.equal(entry.sourcePath, `${provenance.sourceRoot}/${entry.file}`);
    assert.ok(
      entry.originalEvidencePath.startsWith(
        "/tmp/VessloNativeReview-20260911/",
      ),
    );
    assert.equal(originalBytes.length, entry.bytes, entry.file);
    assert.equal(
      createHash("sha256").update(originalBytes).digest("hex"),
      entry.sha256,
      entry.file,
    );
  }
  assert.deepEqual(
    readdirSync(directory)
      .filter((name) => name.endsWith(".json") && name !== "provenance.json")
      .sort(),
    provenance.files.map((entry) => entry.file).sort(),
  );
  assert.equal(
    json("closed-evidence.json").hostSessionId,
    manifest.publisherSessionId,
  );
  assert.equal(json("closed-evidence.json").executionAttempts, 0);
  assert.equal(json("closed-evidence.json").shuttingDown, true);
});

test("the native schema 2 export preserves UUIDs, session and completed-check revisions", () => {
  const data = snapshot();
  const raw = json("export.json");
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.publisherSessionId, manifest.publisherSessionId);
  for (const field of [
    "inventoryRevision",
    "exportRevision",
    "checkRevision",
    "completedCheckRevision",
    "checkedInventoryRevision",
    "lastUpdateCheckAt",
  ])
    assert.equal(data[field], manifest.metadata[field], field);
  assert.equal(data.exportedAt, provenance.exportClock);
  assert.equal(data.checkPhase, "ready");
  assert.deepEqual(data.capabilities, [
    "homebrewReviewV1",
    "requestReceiptsV1",
  ]);
  assert.equal(data.updateCount, 3);
  assert.equal(assessUpdateCount(data).status, "consistent");
  assert.equal(assessUpdateCount(data).visibleCount, 3);
  assert.deepEqual(
    data.apps.map((app) => app.id),
    raw.apps.map((app) => app.id),
  );
  assert.ok(data.apps.every((app) => app.id === app.id.toUpperCase()));
  assert.equal(
    reviewSnapshotReason(
      data,
      Date.parse(json("multiple-request.json").createdAt),
    ),
    null,
  );
});

test("TypeScript constructs exactly the app's archived single and selected multiple requests", () => {
  for (const example of requests) {
    const original = json(example.request);
    const built = builtRequest(example.request);
    assert.deepEqual(built, original, example.request);
    assert.equal(built.targets.length, example.targetCount);
    assert.equal(built.publisherSessionId, manifest.publisherSessionId);
    assert.equal(built.inventoryRevision, manifest.metadata.inventoryRevision);
    assert.equal(
      built.completedCheckRevision,
      manifest.metadata.completedCheckRevision,
    );
    assert.equal(built.source, "homebrew");
    assert.equal(
      handoffRequestReason(built, Date.parse(original.createdAt)),
      null,
    );
    assert.ok(
      !built.targets.some(
        (target) => target.caskToken === "vesslo-fixture-gamma",
      ),
    );
    const url = buildHomebrewReviewURL(built);
    assert.match(
      url,
      /^vesslo:\/\/review-homebrew\/v1\?payload=[A-Za-z0-9_-]+$/,
    );
    assert.equal(new URL(url).searchParams.size, 1);
    assert.deepEqual(parseHomebrewReviewURL(url), original);
  }
});

test("selected target order remains exact through URL encoding and receipt correlation", () => {
  const original = json("multiple-request.json");
  const data = snapshot();
  const reversed = buildHomebrewReviewRequest(
    data,
    selectedApps(data, original).reverse(),
    original.requestId,
    Date.parse(original.createdAt),
  );
  assert.deepEqual(reversed.targets, [...original.targets].reverse());
  assert.deepEqual(
    parseHomebrewReviewURL(buildHomebrewReviewURL(reversed)),
    reversed,
  );
  const accepted = stateFor(envelope("multiple-receipts.json"));
  assert.equal(bindReceipt(accepted, original).status, "current");
  assert.equal(bindReceipt(accepted, reversed).status, "conflict");
  assert.notEqual(requestFingerprint(original), requestFingerprint(reversed));
  const alteredEnvelope = json("multiple-receipts.json");
  alteredEnvelope.receipts[0].targets.reverse();
  assert.throws(
    () => parseReceiptEnvelope(JSON.stringify(alteredEnvelope), receiptClock),
    MalformedReceiptError,
  );
});

test("UUID case and equivalent ISO offsets bind without normalizing app identity strings", () => {
  const original = json("multiple-request.json");
  const data = snapshot();
  data.publisherSessionId = data.publisherSessionId.toLowerCase();
  const selected = selectedApps(data, original).map((app) => ({
    ...app,
    id: app.id.toLowerCase(),
  }));
  const lower = buildHomebrewReviewRequest(
    data,
    selected,
    original.requestId.toLowerCase(),
    Date.parse(original.createdAt),
  );
  assert.ok(
    lower.targets.every(
      (target) => target.appId === target.appId.toLowerCase(),
    ),
  );
  lower.createdAt = lower.createdAt.replace("Z", "+00:00");
  const roundTrip = parseHomebrewReviewURL(buildHomebrewReviewURL(lower));
  assert.equal(requestFingerprint(roundTrip), requestFingerprint(original));
  const accepted = stateFor(envelope("multiple-receipts.json"));
  assert.equal(bindReceipt(accepted, roundTrip).status, "current");
  for (const mutate of [
    (request) => {
      request.publisherSessionId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    },
    (request) => {
      request.inventoryRevision += 1;
    },
    (request) => {
      request.completedCheckRevision += 1;
    },
    (request) => {
      request.targets[0].bundleId = request.targets[0].bundleId.toUpperCase();
    },
    (request) => {
      request.targets[0].canonicalPath = "/VessloSynthetic/Elsewhere.app";
    },
    (request) => {
      request.targets[0].caskToken = "vesslo-fixture-other";
    },
    (request) => {
      request.targets[0].expectedTargetVersion = "3.0.0";
    },
  ]) {
    const changed = structuredClone(roundTrip);
    mutate(changed);
    const bound = bindReceipt(accepted, changed);
    assert.equal(bound.status, "conflict");
    assert.equal(bound.receipt, null);
  }
});

test("actual accepted receipts bind to generated requests and never display verified completion", () => {
  for (const example of requests) {
    const request = parseHomebrewReviewURL(
      buildHomebrewReviewURL(builtRequest(example.request)),
    );
    const bound = bindReceipt(stateFor(envelope(example.accepted)), request);
    assert.equal(bound.status, "current", example.accepted);
    assert.equal(bound.receipt.phase, "accepted");
    assert.equal(isTerminalReceipt(bound.receipt.phase), false);
    assert.equal(bound.receipt.targets.length, example.targetCount);
    assert.ok(
      bound.receipt.targets.every((target) => target.phase === "accepted"),
    );
    assert.deepEqual(
      bound.receipt.targets.map((entry) => entry.target),
      request.targets,
    );
    const rendered = receiptMarkdown(bound.receipt);
    assert.match(rendered, /^# Accepted — Awaiting Vesslo Review/);
    assert.match(rendered, /Execution and completion are not confirmed/);
    assert.doesNotMatch(rendered, /Completed — Verified by Vesslo/);
  }
});

test("Return leaves actual accepted bytes unchanged and cancellation advances monotonically", () => {
  assert.deepEqual(
    bytes("multiple-receipts.json"),
    bytes("after-return-receipts.json"),
  );
  const request = json("multiple-request.json");
  const sequence = [
    "multiple-receipts.json",
    "after-return-receipts.json",
    "cancelled-receipts.json",
    "closed-receipts.json",
  ].map((file) => receiptFor(file, request));
  assert.deepEqual(
    sequence.map((receipt) => receipt.phase),
    ["accepted", "accepted", "cancelled", "cancelled"],
  );
  assert.deepEqual(
    sequence.map((receipt) => receipt.revision),
    [1, 1, 2, 2],
  );
  for (let index = 1; index < sequence.length; index++)
    assert.equal(
      receiptTransitionReason(sequence[index - 1], sequence[index]),
      null,
    );
  assert.match(receiptTransitionReason(sequence[2], sequence[0]), /backwards/);
  const changedWithoutRevision = structuredClone(sequence[2]);
  changedWithoutRevision.reason = "changedReason";
  assert.match(
    receiptTransitionReason(sequence[2], changedWithoutRevision),
    /without increasing/,
  );
  const rewrittenTerminal = structuredClone(sequence[2]);
  rewrittenTerminal.revision += 1;
  rewrittenTerminal.phase = "completed";
  rewrittenTerminal.targets.forEach((target) => {
    target.phase = "completed";
  });
  assert.match(
    receiptTransitionReason(sequence[2], rewrittenTerminal),
    /terminal receipt/,
  );
});

test("closed receipts preserve cancellation for both requests and do not imply installed updates", () => {
  const closed = envelope("closed-receipts.json");
  assert.equal(closed.length, 2);
  for (const example of requests) {
    const request = builtRequest(example.request);
    const accepted = receiptFor(example.accepted, request);
    const bound = bindReceipt(stateFor(closed), request);
    assert.equal(bound.status, "current");
    assert.equal(receiptTransitionReason(accepted, bound.receipt), null);
    assert.equal(bound.receipt.phase, "cancelled");
    assert.equal(bound.receipt.reason, "userCancelled");
    assert.ok(
      bound.receipt.targets.every(
        (target) =>
          target.phase === "cancelled" &&
          target.reason === "userCancelled" &&
          target.verificationRecordId === undefined,
      ),
    );
    assert.deepEqual(
      bound.receipt.targets.map((entry) => entry.target),
      request.targets,
    );
    const rendered = receiptMarkdown(bound.receipt);
    assert.match(rendered, /^# Cancelled/);
    assert.doesNotMatch(rendered, /Completed — Verified by Vesslo/);
  }
});

test("historical clocks distinguish expired request admission from retained terminal history", () => {
  const original = json("multiple-request.json");
  const requestClock = Date.parse(original.createdAt);
  assert.equal(
    handoffRequestReason(original, requestClock + HANDOFF_REQUEST_LIFETIME_MS),
    null,
  );
  assert.equal(
    handoffRequestReason(
      original,
      requestClock + HANDOFF_REQUEST_LIFETIME_MS + 1,
    ),
    "expired",
  );
  const closed = envelope("closed-receipts.json");
  const afterRetention =
    Math.max(...closed.map((receipt) => Date.parse(receipt.expiresAt))) + 1;
  const historical = stateFor(
    envelope("closed-receipts.json", afterRetention),
    afterRetention,
  );
  assert.equal(historical.receipts.length, 0);
  assert.equal(historical.expiredReceipts.length, 2);
  const bound = bindReceipt(historical, original);
  assert.equal(bound.status, "expired");
  assert.equal(bound.receipt.phase, "cancelled");
  const rendered = receiptMarkdown(bound.receipt, false);
  assert.match(rendered, /^# Historical Receipt — Current Result Unconfirmed/);
  assert.doesNotMatch(rendered, /^# Completed/);
});

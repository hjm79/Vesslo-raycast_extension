const assert = require("node:assert/strict");
const test = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const build = process.env.VESSLO_TEST_BUILD;
const { parseVessloData } = require(join(build, "utils/data.js"));
const {
  summarizeUpdates,
  summarizeRequests,
  menuBarTitle,
  rootSearchSubtitle,
  requestLabel,
  UNVERIFIED_TITLE,
} = require(join(build, "utils/menu-bar-summary.js"));

const directory = join(__dirname, "fixtures/app-integration");
const manifest = JSON.parse(
  readFileSync(join(directory, "manifest.json"), "utf8"),
);
const now = Date.parse(manifest.fixtureClock);
const raw = (name) => JSON.parse(readFileSync(join(directory, name), "utf8"));

function readyState(data) {
  return {
    status: "ready",
    data,
    reason: null,
    checkedAt: now,
    pathAvailability: Object.fromEntries(
      data.apps.map((app) => [app.path, "available"]),
    ),
  };
}

test("a current completed check shows its update count and the same apps as View Updates", () => {
  const summary = summarizeUpdates(
    readyState(parseVessloData(JSON.stringify(raw("ready.json")))),
    now,
  );
  assert.equal(summary.verified, true);
  assert.equal(summary.count, 2);
  assert.deepEqual(
    summary.apps.map((app) => app.name),
    ["ExampleEditor", "ExampleViewer"],
  );
  assert.equal(menuBarTitle(summary), "2");
  assert.equal(rootSearchSubtitle(summary), "Vesslo · 2 updates");
});

test("zero updates is shown only after a current completed check", () => {
  const source = raw("ready.json");
  const data = parseVessloData(
    JSON.stringify({
      ...source,
      updateCount: 0,
      apps: source.apps.map((app) => ({
        ...app,
        isVisibleInUpdates: false,
        eligibilityKind: "none",
        primaryActionKind: "none",
      })),
    }),
  );
  const summary = summarizeUpdates(readyState(data), now);
  assert.equal(summary.verified, true);
  assert.equal(menuBarTitle(summary), "0");
  assert.equal(rootSearchSubtitle(summary), "Vesslo · 0 updates");
});

test("unfinished, failed, unverified and old checks read as Unverified instead of a count", () => {
  for (const name of [
    "checking.json",
    "failed.json",
    "unverified-startup.json",
  ]) {
    const summary = summarizeUpdates(
      readyState(parseVessloData(JSON.stringify(raw(name)))),
      now,
    );
    assert.equal(summary.verified, false, name);
    assert.equal(summary.count, null, name);
    assert.equal(menuBarTitle(summary), UNVERIFIED_TITLE, name);
    assert.equal(rootSearchSubtitle(summary), "Vesslo · Updates unverified");
    assert.ok(summary.reason.length > 0, name);
  }
  const old = summarizeUpdates(
    readyState(parseVessloData(JSON.stringify(raw("ready.json")))),
    now + 25 * 60 * 60 * 1000,
  );
  assert.equal(old.verified, false);
  assert.match(old.reason, /24 hours/);
});

test("missing, unreadable, mismatched and loading exports never look like zero updates", () => {
  for (const status of [
    "loading",
    "missing",
    "malformed",
    "permissionDenied",
    "ioError",
    "stale",
    "contractMismatch",
  ]) {
    const summary = summarizeUpdates(
      {
        status,
        data: null,
        reason: status === "loading" ? null : `reason ${status}`,
        checkedAt: now,
        pathAvailability: {},
      },
      now,
    );
    assert.equal(summary.verified, false, status);
    assert.equal(menuBarTitle(summary), UNVERIFIED_TITLE, status);
    assert.ok(summary.reason, status);
  }
});

test("only current-session requests still in progress are listed", () => {
  const session = manifest.fixtureSessionId;
  const receipt = (name) => raw(name).receipts[0];
  const running = receipt("receipt-running.json");
  const pending = receipt("receipt-verification-pending.json");
  const completed = receipt("receipt-completed.json");
  const otherSession = {
    ...running,
    request: {
      ...running.request,
      requestId: "99999999-9999-4999-8999-999999999999",
      publisherSessionId: "22222222-2222-4222-8222-222222222222",
    },
  };
  const state = {
    status: "ready",
    receipts: [running, pending, completed, otherSession],
    expiredReceipts: [receipt("receipt-accepted.json")],
    reason: null,
    checkedAt: now,
  };
  const summary = summarizeRequests(state, session.toUpperCase());
  assert.equal(summary.available, true);
  assert.deepEqual(summary.active.map((item) => item.phase).sort(), [
    "running",
    "verificationPending",
  ]);
  assert.match(requestLabel(running), /^\d+ apps? · Running$/);
  assert.equal(summarizeRequests(state, undefined).active.length, 0);
  assert.deepEqual(
    summarizeRequests({ ...state, status: "missing", receipts: [] }, session),
    { available: true, active: [] },
  );
  const unreadable = summarizeRequests(
    { ...state, status: "permissionDenied", reason: "No access." },
    session,
  );
  assert.equal(unreadable.available, false);
  assert.equal(unreadable.reason, "No access.");
});

test("the menu bar command only reads data and refreshes on a long interval", () => {
  const manifestJson = JSON.parse(
    readFileSync(join(__dirname, "../package.json"), "utf8"),
  );
  const command = manifestJson.commands.find(
    (item) => item.name === "menu-bar-updates",
  );
  assert.equal(command.mode, "menu-bar");
  const minutes = Number(/^(\d+)m$/.exec(command.interval)?.[1]);
  assert.ok(minutes >= 30 && minutes <= 60, command.interval);
  const source = readFileSync(
    join(__dirname, "../src/menu-bar-updates.tsx"),
    "utf8",
  );
  for (const forbidden of [
    "performAppAction",
    "requestHomebrewReview",
    "vesslo://update",
    "Check for Updates",
    "Reload",
  ])
    assert.equal(source.includes(forbidden), false, forbidden);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function (request) {
  if (request === "@raycast/api")
    return {
      Color: { Red: "red", Orange: "orange", SecondaryText: "secondary" },
      Icon: { Warning: "Warning" },
    };
  return originalLoad.apply(this, arguments);
};
const {
  REASON_LABELS,
  UNKNOWN_REASON_LABEL,
  reasonLabel,
  auditReviewSearchTerms,
} = require(join(process.env.VESSLO_TEST_BUILD, "utils/audit-review.js"));
const { auditWarningAccessory, auditReviewMarkdown } = require(
  join(process.env.VESSLO_TEST_BUILD, "utils/audit-warning.js"),
);
Module._load = originalLoad;
const fixture = require("./fixtures/current-app.json");

// Copy of Vesslo's AppAuditReason cases (Sources/Vesslo/Core/AppAuditModels.swift,
// 2026-11-22). Update this list and REASON_LABELS together when Vesslo adds a reason.
const VESSLO_AUDIT_REASONS = [
  "noMemoOrTags",
  "updateAvailable",
  "subscriptionApp",
  "largeApp",
  "unusedApp",
  "homebrewAdoptionAvailable",
  "noUpdateSource",
  "previouslyDeletedBundleIDMatch",
  "unsignedApp",
  "invalidSignature",
  "notNotarized",
  "signatureVerificationUnavailable",
  "updateCheckStale",
  "updateSourceRepeatedFailure",
  "updateSourceUnavailable",
  "suspectedUpdateEnded",
  "userConfirmedUpdateEnded",
  "userConfirmedUpdateSupported",
  "intelOnlyApp",
];

test("every Vesslo audit reason has a label and no label is left over", () => {
  assert.deepEqual(
    Object.keys(REASON_LABELS).sort(),
    [...VESSLO_AUDIT_REASONS].sort(),
  );
  for (const reason of VESSLO_AUDIT_REASONS) {
    assert.notEqual(reasonLabel(reason), reason, reason);
    assert.notEqual(reasonLabel(reason), UNKNOWN_REASON_LABEL, reason);
  }
});

test("new health-check reasons read as words in every warning surface", () => {
  const app = {
    ...fixture,
    managementReasons: ["intelOnlyApp", "unusedApp"],
  };
  const warning = auditWarningAccessory(app);
  assert.equal(warning.text, "Review");
  assert.equal(warning.icon.tintColor, "secondary");
  for (const surface of [warning.tooltip, auditReviewMarkdown(app, "review")]) {
    assert.ok(surface.includes("Intel-only app (Rosetta)"));
    assert.ok(surface.includes("Not used recently"));
    assert.equal(surface.includes("intelOnlyApp"), false);
  }
  assert.ok(auditReviewSearchTerms(app).includes("Intel-only app (Rosetta)"));
});

test("unknown future reasons show a generic label but stay searchable by code", () => {
  const app = { ...fixture, managementReasons: ["someFutureReason"] };
  assert.equal(reasonLabel("someFutureReason"), UNKNOWN_REASON_LABEL);
  const warning = auditWarningAccessory(app);
  assert.ok(warning.tooltip.includes(UNKNOWN_REASON_LABEL));
  assert.equal(warning.tooltip.includes("someFutureReason"), false);
  assert.equal(
    auditReviewMarkdown(app, "review").includes("someFutureReason"),
    false,
  );
  assert.ok(auditReviewSearchTerms(app).includes("someFutureReason"));
});

test("an unavailable signature check keeps the Security badge without the red signing alert", () => {
  const unavailable = {
    ...fixture,
    securityReasons: ["signatureVerificationUnavailable"],
  };
  const warning = auditWarningAccessory(unavailable);
  assert.equal(warning.text, "Security");
  assert.equal(warning.icon.tintColor, "secondary");
  assert.ok(warning.tooltip.includes("Security verification unavailable"));
  assert.equal(
    auditWarningAccessory({
      ...unavailable,
      securityReasons: ["notNotarized", "signatureVerificationUnavailable"],
    }).icon.tintColor,
    "red",
  );
  assert.equal(
    auditWarningAccessory(unavailable, "Reload required").icon.tintColor,
    "orange",
  );
});

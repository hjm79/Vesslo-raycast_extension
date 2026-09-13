import { VessloApp, VessloData } from "../original/types";
import {
  assessUpdateCount,
  VessloDataState,
} from "../original/utils/data-state";
import { readyHomebrewTargetCount } from "../original/utils/homebrew-readiness";
import { scenario } from "./config";

const startedAt = Date.now();
let elapsedOverride: number | null = null;
let fixtureIdentity = 0;
function app(id: string, overrides: Partial<VessloApp> = {}): VessloApp {
  return {
    id: `22222222-2222-2222-2222-${String(++fixtureIdentity).padStart(12, "0")}`,
    name: `Fixture ${id}`,
    bundleId: `com.example.vesslofixture.${id}`,
    path: `/__vesslo_fixture__/${id}.app`,
    version: "1.0",
    targetVersion: "2.0",
    developer: "Fixture Developer",
    icon: null,
    tags: ["Fixture", "Work"],
    memo: "Synthetic memo for search verification",
    sources: ["Brew"],
    appStoreId: null,
    homebrewCask: `fixture-${id}`,
    isVisibleInUpdates: true,
    eligibilityKind: "executableUpdate.homebrew",
    primaryActionKind: "runBrew",
    exportContract: "current",
    currentTargetSkipped: false,
    hasAnySkippedVersion: false,
    auditGroups: [],
    securityReasons: [],
    managementReasons: [],
    updateHealthStatus: null,
    updateHealthReasons: [],
    lastUpdateSourceAttemptAt: null,
    lastUpdateSourceSuccessAt: null,
    updateHealthSource: null,
    updateHealthSourceIdentity: null,
    updateHealthSuppressedUntil: null,
    isDeleted: false,
    isSkipped: false,
    isIgnored: false,
    ...overrides,
  };
}
const mixed = [
  app("brew"),
  app("sparkle", {
    sources: ["Sparkle"],
    homebrewCask: null,
    primaryActionKind: "runSparkle",
    eligibilityKind: "executableUpdate.sparkle",
  }),
  app("store", {
    sources: ["App Store"],
    homebrewCask: null,
    appStoreId: "100000001",
    primaryActionKind: "runAppStore",
    eligibilityKind: "executableUpdate.appStore",
  }),
  app("manual", {
    sources: ["App Store"],
    homebrewCask: null,
    appStoreId: "100000002",
    primaryActionKind: "openAppStore",
    eligibilityKind: "appStoreManualUpdate",
  }),
  app("historical", { isSkipped: true, hasAnySkippedVersion: true }),
  app("skipped", {
    isSkipped: true,
    currentTargetSkipped: true,
    hasAnySkippedVersion: true,
    isVisibleInUpdates: false,
  }),
  app("deleted", {
    isDeleted: true,
    isVisibleInUpdates: false,
    tags: ["DeletedOnly"],
  }),
  app("security", {
    auditGroups: ["security"],
    securityReasons: ["unsignedApp", "notNotarized"],
  }),
  app("source", {
    auditGroups: ["updateHealth"],
    updateHealthStatus: "stale",
    updateHealthReasons: ["updateCheckStale"],
    updateHealthSource: "Fixture Feed",
    updateHealthSourceIdentity: "Synthetic Feed Identity",
  }),
  app("management", {
    auditGroups: ["management"],
    managementReasons: ["subscriptionApp", "homebrewAdoptionAvailable"],
  }),
];
const review = [
  app("refresh", {
    primaryActionKind: "refreshRequired",
    eligibilityKind: "reviewRequiredCandidate",
    updateHealthStatus: "unavailable",
    updateHealthReasons: ["updateSourceUnavailable"],
  }),
  app("unknown", {
    primaryActionKind: "unknown",
    eligibilityKind: "unknown",
    rawPrimaryActionKind: "futureAction",
    rawEligibilityKind: "futureEligibility",
  }),
  app("legacy", {
    primaryActionKind: null,
    eligibilityKind: null,
    isVisibleInUpdates: null,
    exportContract: "legacy",
  }),
  ...mixed.filter((item) => item.auditGroups.length > 0),
];
const large = Array.from({ length: 240 }, (_, index) =>
  app(`large${index}`, { tags: ["Fixture", index % 2 ? "Work" : "Personal"] }),
);
const displayEdgeCases = [
  app("edge", {
    name: "Fixture \u202eName\u202c **literal**",
    tags: ["Work", "Work Extra"],
    developer: "Fixture\u0000Developer",
    auditGroups: ["security"],
    securityReasons: [
      "[literal](https://example.invalid)\n\u202econtrol\u202c",
      "x".repeat(900),
    ],
    memo: "Synthetic multiline\n memo and Bundle ID match",
  }),
  app("work-exact", { tags: ["Work"] }),
  app("work-prefix", { tags: ["Work Extra"] }),
  app("deleted", {
    isDeleted: true,
    isVisibleInUpdates: false,
    tags: ["DeletedOnly"],
  }),
];
const selected =
  scenario === "review-actions"
    ? review
    : scenario === "display-edge-cases"
      ? displayEdgeCases
      : scenario === "unchanged-polling-large"
        ? large
        : mixed;
const usesTargetReadiness =
  scenario.startsWith("schema3-") || scenario.startsWith("receipts-");
const data: VessloData = {
  schemaVersion: usesTargetReadiness ? 3 : 2,
  producerVersion: "fixture",
  producerBuild: "fixture",
  publisherSessionId: "11111111-1111-1111-1111-111111111111",
  inventoryRevision: 42,
  exportRevision: 100,
  checkRevision: 11,
  completedCheckRevision: 11,
  ...(usesTargetReadiness ? { completedInventoryRevision: 42 } : {}),
  checkedInventoryRevision: 42,
  lastUpdateCheckAt: new Date(startedAt).toISOString(),
  checkPhase:
    scenario === "schema2-checking"
      ? "checking"
      : scenario === "schema3-source-failed-ready-targets" ||
          scenario === "schema3-target-failed"
        ? "failed"
        : "ready",
  capabilities: usesTargetReadiness
    ? ["homebrewReviewV2", "homebrewTargetReadinessV1", "requestReceiptsV2"]
    : ["homebrewReviewV1", "requestReceiptsV1"],
  exportedAt: new Date(startedAt).toISOString(),
  updateCount:
    scenario === "count-unverifiable"
      ? null
      : selected.filter((item) => item.isVisibleInUpdates).length +
        (scenario === "count-mismatch" ? 1 : 0),
  apps: selected,
};
if (usesTargetReadiness) {
  if (data.checkPhase === "failed") {
    data.checkReason = "sourceFailure";
    delete data.checkedInventoryRevision;
  }
  data.homebrewReadiness = selected
    .filter(
      (item) =>
        item.primaryActionKind === "runBrew" &&
        item.isVisibleInUpdates === true &&
        item.currentTargetSkipped === false &&
        !item.isDeleted,
    )
    .map((item, index) => {
      const target = {
        appId: item.id,
        bundleId: item.bundleId!,
        canonicalPath: item.path,
        caskToken: item.homebrewCask!,
        installedVersion: item.version!,
        expectedTargetVersion: item.targetVersion!,
      };
      const epoch = {
        target,
        source: "homebrew" as const,
        publisherSessionId: data.publisherSessionId!,
        checkRevision: data.checkRevision!,
        inventoryRevision: data.inventoryRevision!,
      };
      if (scenario === "schema3-target-failed" && index === 0)
        return { ...epoch, state: "failed" as const, reason: "sourceFailed" };
      return {
        ...epoch,
        state: "ready" as const,
        evidenceId: `55555555-5555-5555-5555-${String(index + 1).padStart(12, "0")}`,
        checkedAt: new Date(
          startedAt - (scenario === "schema3-proof-expired" ? 901000 : 0),
        ).toISOString(),
        expiresAt: new Date(
          startedAt + (scenario === "schema3-proof-expired" ? -1000 : 900000),
        ).toISOString(),
      };
    });
  if (scenario === "schema3-proof-missing") delete data.homebrewReadiness;
  if (scenario === "schema3-cohort-incomplete") {
    data.completedInventoryRevision = 41;
    delete data.checkedInventoryRevision;
  }
}
const emptyData: VessloData = { ...data, updateCount: 0, apps: [] };
const errors: Record<string, VessloDataState["status"]> = {
  "stale-retained": "stale",
  "missing-empty": "missing",
  "malformed-retained": "malformed",
  "permission-denied-retained": "permissionDenied",
  "count-mismatch": "contractMismatch",
};

export function setFixtureElapsed(milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0)
    throw new Error("Invalid fixture time.");
  elapsedOverride = milliseconds;
}

export function getFixtureSnapshot(): VessloDataState {
  const elapsed = elapsedOverride ?? Date.now() - startedAt;
  const status = errors[scenario] ?? "ready";
  const snapshot =
    scenario === "missing-empty"
      ? null
      : scenario === "tag-becomes-empty" && elapsed >= 9000
        ? emptyData
        : data;
  const pathAvailability: Record<
    string,
    "available" | "missing" | "permissionDenied" | "unknown"
  > = {};
  snapshot?.apps
    .filter((item) => !item.isDeleted)
    .forEach((item, index) => {
      pathAvailability[item.path] =
        scenario === "path-unavailable"
          ? (["missing", "permissionDenied", "unknown"] as const)[index % 3]
          : "available";
    });
  return {
    status,
    data: snapshot,
    checkedAt: startedAt + elapsed,
    reason:
      status === "ready"
        ? null
        : `Fixture: simulated ${status}; actions only record intent.`,
    pathAvailability,
    updateCountAssessment: snapshot ? assessUpdateCount(snapshot) : undefined,
    homebrewReadyTargetCount: snapshot
      ? readyHomebrewTargetCount(snapshot, startedAt + elapsed)
      : 0,
  };
}

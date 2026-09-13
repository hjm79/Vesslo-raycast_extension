import { HandoffRequest } from "./handoff-contract";
import { ReceiptReadState, parseReceiptEnvelope } from "./receipt-contract";
import { buildHomebrewReviewRequest } from "./handoff-execution";
import { getFixtureSnapshot } from "../../fixture/scenarios";
import { scenario } from "../../fixture/config";
let sent: HandoffRequest | null = null;
export function setFixtureRequest(request: HandoffRequest) {
  sent = request;
}
function getState(): ReceiptReadState {
  const snapshot = getFixtureSnapshot();
  if (!snapshot.data || snapshot.status !== "ready")
    return {
      status: "missing",
      receipts: [],
      expiredReceipts: [],
      reason: "Fixture: receipt unavailable; acceptance unconfirmed.",
      checkedAt: Date.now(),
    };
  let request = sent;
  if (!request) {
    const candidates = snapshot.data.apps
      .filter(
        (app) =>
          app.primaryActionKind === "runBrew" &&
          app.currentTargetSkipped === false &&
          !app.isDeleted &&
          app.isVisibleInUpdates === true,
      )
      .slice(0, 2);
    try {
      request = buildHomebrewReviewRequest(
        snapshot.data,
        candidates,
        "44444444-4444-4444-4444-444444444444",
        Date.parse(snapshot.data.exportedAt),
      );
    } catch {
      return {
        status: "ready",
        receipts: [],
        expiredReceipts: [],
        reason: null,
        checkedAt: Date.now(),
      };
    }
  }
  const phase =
    scenario === "receipts-pending"
      ? "verificationPending"
      : scenario === "receipts-completed"
        ? "completed"
        : scenario === "receipts-partial-failure"
          ? "failed"
          : "accepted";
  const targets = request.targets.map((target, index) => ({
    target,
    phase:
      phase === "failed" && index === 0 && request!.targets.length > 1
        ? "completed"
        : phase,
    reason: phase === "failed" ? "Synthetic target result" : undefined,
  }));
  const receipt = {
    schemaVersion: request.schemaVersion,
    request,
    phase,
    targets,
    receivedAt: request.createdAt,
    updatedAt: request.createdAt,
    expiresAt: new Date(Date.parse(request.createdAt) + 86400000).toISOString(),
    revision: 1,
  };
  const receipts = [receipt];
  if (scenario === "receipts-mixed-history") {
    const historicalRequest: HandoffRequest = {
      ...request,
      schemaVersion: 1,
      requestId: "66666666-6666-6666-6666-666666666666",
      targets: request.targets.map(
        ({ readinessEvidenceId: _evidenceId, ...target }) => target,
      ),
    };
    receipts.push({
      ...receipt,
      schemaVersion: 1,
      request: historicalRequest,
      phase: "cancelled",
      targets: historicalRequest.targets.map((target) => ({
        target,
        phase: "cancelled",
        reason: "Synthetic historical request; never executable",
      })),
    });
  }
  return {
    status: "ready",
    receipts: parseReceiptEnvelope(
      JSON.stringify({ schemaVersion: 2, receipts }),
    ),
    expiredReceipts: [],
    reason: null,
    checkedAt: Date.now(),
  };
}
export function useHandoffReceipts() {
  return {
    state: getState(),
    isLoading: false,
    refresh: async () => getState(),
  };
}

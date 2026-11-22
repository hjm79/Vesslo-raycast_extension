import { VessloApp } from "../types";
import { VessloDataState, reviewSnapshotReason } from "./data-state";
import { filterUpdates } from "./updates-filter";
import { HandoffReceipt, ReceiptReadState } from "./receipt-contract";
import { RECEIPT_STATUS_FILTER_LABELS } from "./receipt-filter";

export const UNVERIFIED_TITLE = "Unverified";

export type UpdateSummary =
  | { verified: true; count: number; apps: VessloApp[]; reason: null }
  | { verified: false; count: null; apps: []; reason: string };

/**
 * A count is shown only for a readable, current, fully checked export.
 * Anything else reads as unverified so a missing or old export never looks like
 * "no updates". Reading the export file is not an update check.
 */
export function summarizeUpdates(
  state: VessloDataState,
  now: number = Date.now(),
): UpdateSummary {
  if (state.status !== "ready" || !state.data) {
    return {
      verified: false,
      count: null,
      apps: [],
      reason:
        state.reason ??
        (state.status === "loading"
          ? "Vesslo data is still loading."
          : "Vesslo data is unavailable. Open Vesslo to refresh it."),
    };
  }
  const reason = reviewSnapshotReason(state.data, now);
  if (reason) return { verified: false, count: null, apps: [], reason };
  const apps = filterUpdates(state.data.apps, state, { sortBy: "name" });
  return { verified: true, count: apps.length, apps, reason: null };
}

export function menuBarTitle(summary: UpdateSummary): string {
  return summary.verified ? String(summary.count) : UNVERIFIED_TITLE;
}

export function rootSearchSubtitle(summary: UpdateSummary): string {
  if (!summary.verified) return "Vesslo · Updates unverified";
  return `Vesslo · ${summary.count} update${summary.count === 1 ? "" : "s"}`;
}

const ACTIVE_PHASES = new Set(["accepted", "running", "verificationPending"]);

export type RequestSummary =
  | { available: true; active: HandoffReceipt[] }
  | { available: false; active: []; reason: string };

/**
 * Lists requests Vesslo still reports as in progress for the current export
 * session. Expired receipts and other sessions are history, as in Homebrew Requests.
 */
export function summarizeRequests(
  state: ReceiptReadState,
  publisherSessionId: string | undefined,
): RequestSummary {
  if (state.status === "missing") return { available: true, active: [] };
  if (state.status !== "ready") {
    return {
      available: false,
      active: [],
      reason: state.reason ?? "Request status is unavailable.",
    };
  }
  return {
    available: true,
    active: state.receipts
      .filter(
        (receipt) =>
          ACTIVE_PHASES.has(receipt.phase) &&
          publisherSessionId !== undefined &&
          receipt.request.publisherSessionId.toLowerCase() ===
            publisherSessionId.toLowerCase(),
      )
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
      ),
  };
}

export function requestLabel(receipt: HandoffReceipt): string {
  const count = receipt.targets.length;
  return `${count} app${count === 1 ? "" : "s"} · ${RECEIPT_STATUS_FILTER_LABELS[receipt.phase]}`;
}

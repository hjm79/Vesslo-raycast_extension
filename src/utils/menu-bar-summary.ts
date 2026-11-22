import { VessloApp } from "../types";
import {
  homebrewReviewSnapshotReason,
  reviewSnapshotReason,
  VessloDataState,
} from "./data-state";
import { filterUpdates } from "./updates-filter";
import { HandoffReceipt, ReceiptReadState } from "./receipt-contract";
import { RECEIPT_STATUS_FILTER_LABELS } from "./receipt-filter";

export const UNVERIFIED_TITLE = "Unverified";
export const SOURCE_FAILURE_NOTICE =
  "Some update sources failed in the last Vesslo check";

export type UpdateSummary =
  | {
      verified: true;
      count: number;
      apps: VessloApp[];
      reason: null;
      /** The check completed, but at least one update source failed. */
      sourcesFailed: boolean;
    }
  | { verified: false; count: null; apps: []; reason: string };

/**
 * A count is shown only for a readable, current, fully checked export. A schema 3
 * check that completed with failed sources counts too, marked, under the same rule
 * Vesslo and the Homebrew review use (homebrewReviewSnapshotReason).
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
  const data = state.data;
  const sourceFailureCheck =
    data.schemaVersion === 3 &&
    data.checkPhase === "failed" &&
    data.checkReason === "sourceFailure";
  // A source-failure check is judged by the Homebrew rule so the reason shown is
  // the condition that actually blocks it (for example an old export).
  const reason = sourceFailureCheck
    ? homebrewReviewSnapshotReason(data, now)
    : reviewSnapshotReason(data, now);
  if (reason) return { verified: false, count: null, apps: [], reason };
  const sourcesFailed = sourceFailureCheck;
  const apps = filterUpdates(data.apps, state, { sortBy: "name" });
  return {
    verified: true,
    count: apps.length,
    apps,
    reason: null,
    sourcesFailed,
  };
}

export function menuBarTitle(summary: UpdateSummary): string {
  if (!summary.verified) return UNVERIFIED_TITLE;
  return `${summary.count}${summary.sourcesFailed ? "*" : ""}`;
}

export function rootSearchSubtitle(summary: UpdateSummary): string {
  if (!summary.verified) return "Vesslo · Updates unverified";
  return `Vesslo · ${summary.count} update${summary.count === 1 ? "" : "s"}${summary.sourcesFailed ? " (some sources failed)" : ""}`;
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

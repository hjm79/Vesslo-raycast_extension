import { VessloApp } from "../types";
import type { VessloData } from "../types";
import { buildHomebrewReviewRequest } from "./handoff-execution";
import { setFixtureRequest } from "./useHandoffReceipts";
import { recordIntent } from "../../fixture/events";

export async function openInVesslo(bundleId?: string | null) {
  recordIntent("review", bundleId ?? null);
}

export async function performAppAction(
  app: VessloApp,
  intent: "update" | "open" | "finder",
) {
  recordIntent(intent, app.id);
}

export async function requestHomebrewReview(
  data: VessloData,
  apps: readonly VessloApp[],
) {
  const request = buildHomebrewReviewRequest(
    data,
    apps,
    "44444444-4444-4444-4444-444444444444",
    Date.now(),
  );
  setFixtureRequest(request);
  recordIntent("review", request.requestId);
  return { kind: "opened" as const, request, url: "fixture-inert-review" };
}

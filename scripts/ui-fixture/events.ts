import { fixtureId, scenario } from "./config";

type Intent = "review" | "update" | "open" | "finder" | "copy";
const events: { kind: Intent; target: string | null }[] = [];

export function recordIntent(kind: Intent, target: string | null) {
  const event = { kind, target };
  if (events.length >= 100) events.shift();
  events.push(event);
  console.info(
    "[VESSLO UI FIXTURE: SIMULATED]",
    JSON.stringify({ fixtureId, scenario, ...event }),
  );
}

export function getFixtureEvents() {
  return events.map((event) => ({ ...event }));
}

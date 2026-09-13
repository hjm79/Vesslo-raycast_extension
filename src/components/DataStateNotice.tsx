import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import {
  assessUpdateCount,
  reviewSnapshotReason,
  VessloDataState,
} from "../utils/data-state";
import { openInVesslo } from "../utils/actions";
import { displayText } from "../utils/display-format";
import { readyHomebrewTargetCount } from "../utils/homebrew-readiness";

const labels: Record<VessloDataState["status"], string> = {
  loading: "Loading Vesslo Data",
  ready: "Vesslo Data Ready",
  stale: "Vesslo Data Needs Refresh",
  missing: "Vesslo Data File Missing",
  malformed: "Vesslo Data Is Invalid",
  permissionDenied: "Cannot Read Vesslo Data",
  ioError: "Cannot Read Vesslo Data",
  contractMismatch: "Vesslo Update Counts Do Not Match",
};

export function ReloadDataAction({
  refresh,
}: {
  refresh: () => unknown | Promise<unknown>;
}) {
  return (
    <Action
      title="Reload Vesslo Data"
      icon={Icon.ArrowClockwise}
      shortcut={{ modifiers: ["cmd"], key: "r" }}
      onAction={async () => {
        await refresh();
      }}
    />
  );
}

export function DataStateNotice({
  state,
  refresh,
}: {
  state: VessloDataState;
  refresh: () => unknown | Promise<unknown>;
}) {
  const countAssessment =
    state.updateCountAssessment ??
    (state.data ? assessUpdateCount(state.data) : null);
  const countUnverified =
    state.status === "ready" && countAssessment?.status === "unverifiable";
  const snapshotReason = state.data
    ? reviewSnapshotReason(state.data, state.checkedAt || Date.now())
    : null;
  const homebrewReadyCount =
    state.status === "ready" &&
    countAssessment?.status === "consistent" &&
    state.data?.schemaVersion === 3
      ? (state.homebrewReadyTargetCount ??
        readyHomebrewTargetCount(state.data, state.checkedAt || Date.now()))
      : 0;
  const reason =
    (countUnverified
      ? countAssessment?.reason
      : (state.reason ?? snapshotReason)) ??
    "Waiting for the exported app list";
  if (state.status === "ready" && !countUnverified && !snapshotReason)
    return null;
  return (
    <List.Section
      title={
        state.data
          ? homebrewReadyCount > 0
            ? "Snapshot · Source Check Status"
            : "Snapshot · Review Only"
          : "Data Status"
      }
    >
      <List.Item
        id="vesslo-data-status"
        icon={{ source: Icon.Warning, tintColor: Color.Orange }}
        title={
          countUnverified
            ? "Vesslo Update Count Cannot Be Verified"
            : state.status === "ready" && snapshotReason
              ? state.data?.checkPhase === "checking"
                ? "Vesslo Is Checking for Updates"
                : state.data?.checkPhase === "failed"
                  ? "Vesslo Update Check Failed"
                  : "Vesslo Update Check Required"
              : labels[state.status]
        }
        subtitle={displayText(
          homebrewReadyCount > 0
            ? `${state.data?.checkPhase === "failed" ? "The full-inventory update check failed. Other update routes remain blocked." : reason} ${homebrewReadyCount} target${homebrewReadyCount === 1 ? " has" : "s have"} current Homebrew source evidence; available targets can be reviewed in Vesslo.`
            : reason,
        )}
        accessories={
          state.data
            ? [
                {
                  tag: {
                    value:
                      homebrewReadyCount > 0
                        ? `HOMEBREW CHECKED: ${homebrewReadyCount}`
                        : "REVIEW ONLY",
                    color: homebrewReadyCount > 0 ? Color.Blue : Color.Orange,
                  },
                },
              ]
            : []
        }
        actions={
          <ActionPanel>
            <Action
              title="Open Vesslo"
              icon={Icon.AppWindow}
              onAction={() => openInVesslo()}
            />
            <ReloadDataAction refresh={refresh} />
          </ActionPanel>
        }
      />
    </List.Section>
  );
}

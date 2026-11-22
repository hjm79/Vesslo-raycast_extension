import {
  Icon,
  launchCommand,
  LaunchType,
  MenuBarExtra,
  updateCommandMetadata,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { readCurrentVessloData } from "./utils/data-reader";
import { HandoffReceiptReader } from "./utils/receipt-reader";
import { resolveAppActions } from "./utils/action-policy";
import { openInVesslo } from "./utils/actions";
import { displayText } from "./utils/display-format";
import {
  menuBarTitle,
  RequestSummary,
  requestLabel,
  rootSearchSubtitle,
  SOURCE_FAILURE_NOTICE,
  summarizeRequests,
  summarizeUpdates,
  UpdateSummary,
} from "./utils/menu-bar-summary";
import { initialVessloDataState, VessloDataState } from "./utils/data-state";

const MAX_LISTED_APPS = 10;

type Snapshot = {
  state: VessloDataState;
  updates: UpdateSummary;
  requests: RequestSummary;
};

async function readSnapshot(): Promise<Snapshot> {
  const state = await readCurrentVessloData({ force: true });
  const reader = new HandoffReceiptReader();
  try {
    const receipts = await reader.read({ force: true });
    return {
      state,
      updates: summarizeUpdates(state),
      requests: summarizeRequests(receipts, state.data?.publisherSessionId),
    };
  } finally {
    reader.dispose();
  }
}

function openCommand(name: string) {
  return launchCommand({ name, type: LaunchType.UserInitiated }).catch(
    () => undefined,
  );
}

/** Reads Vesslo's export and receipts only. It never checks for or runs updates. */
export default function MenuBarUpdates() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  useEffect(() => {
    let active = true;
    readSnapshot()
      .catch(
        (): Snapshot => ({
          state: { ...initialVessloDataState(), status: "ioError" },
          updates: summarizeUpdates({
            ...initialVessloDataState(),
            status: "ioError",
            reason: "Vesslo data could not be read.",
          }),
          requests: {
            available: false,
            active: [],
            reason: "Request status could not be read.",
          },
        }),
      )
      .then(async (next) => {
        await updateCommandMetadata({
          subtitle: rootSearchSubtitle(next.updates),
        }).catch(() => undefined);
        if (active) setSnapshot(next);
      });
    return () => {
      active = false;
    };
  }, []);

  const updates = snapshot?.updates;
  const requests = snapshot?.requests;
  return (
    <MenuBarExtra
      isLoading={snapshot === null}
      icon={Icon.ArrowDownCircle}
      title={updates ? menuBarTitle(updates) : undefined}
      tooltip={
        updates
          ? updates.verified
            ? rootSearchSubtitle(updates)
            : `Vesslo updates unverified: ${displayText(updates.reason, 200)}`
          : "Vesslo Updates"
      }
    >
      {updates && !updates.verified && (
        <MenuBarExtra.Section title="Updates Unverified">
          <MenuBarExtra.Item
            icon={Icon.Warning}
            title={displayText(updates.reason, 120)}
            onAction={() => openInVesslo()}
          />
        </MenuBarExtra.Section>
      )}
      {updates?.verified && updates.sourcesFailed && (
        <MenuBarExtra.Section>
          <MenuBarExtra.Item
            icon={Icon.Warning}
            title={SOURCE_FAILURE_NOTICE}
            tooltip="Counts marked with * may miss updates from the failed sources. Review sources in Vesslo."
            onAction={() => openInVesslo()}
          />
        </MenuBarExtra.Section>
      )}
      {updates?.verified && snapshot && (
        <MenuBarExtra.Section
          title={
            updates.count === 0
              ? "No Updates in the Last Vesslo Check"
              : `${updates.count} Update${updates.count === 1 ? "" : "s"}`
          }
        >
          {updates.apps.slice(0, MAX_LISTED_APPS).map((app) => (
            <MenuBarExtra.Item
              key={app.id}
              title={displayText(app.name, 60)}
              subtitle={displayText(
                `${app.version ?? "?"} → ${app.targetVersion ?? "?"}`,
                60,
              )}
              tooltip="Open in Vesslo"
              onAction={() =>
                openInVesslo(
                  resolveAppActions(app, snapshot.state).navigationBundleId,
                )
              }
            />
          ))}
          {updates.count > MAX_LISTED_APPS && (
            <MenuBarExtra.Item
              title={`${updates.count - MAX_LISTED_APPS} more…`}
              onAction={() => openCommand("updates")}
            />
          )}
        </MenuBarExtra.Section>
      )}
      {requests && (
        <MenuBarExtra.Section title="Homebrew Requests">
          {requests.available ? (
            requests.active.length === 0 ? (
              <MenuBarExtra.Item title="No requests in progress" />
            ) : (
              requests.active
                .slice(0, 5)
                .map((receipt) => (
                  <MenuBarExtra.Item
                    key={receipt.request.requestId}
                    title={requestLabel(receipt)}
                    onAction={() => openCommand("handoff-requests")}
                  />
                ))
            )
          ) : (
            <MenuBarExtra.Item
              icon={Icon.Warning}
              title={displayText(requests.reason, 120)}
              onAction={() => openCommand("handoff-requests")}
            />
          )}
        </MenuBarExtra.Section>
      )}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="View Updates"
          icon={Icon.List}
          onAction={() => openCommand("updates")}
        />
        <MenuBarExtra.Item
          title="Homebrew Requests"
          icon={Icon.CheckList}
          onAction={() => openCommand("handoff-requests")}
        />
        <MenuBarExtra.Item
          title="Open Vesslo"
          icon={Icon.Link}
          onAction={() => openInVesslo()}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}

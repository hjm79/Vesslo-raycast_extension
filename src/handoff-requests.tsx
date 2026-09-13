import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useState } from "react";
import {
  RECEIPT_PHASE_LABELS,
  receiptMarkdown,
  ReloadReceiptsAction,
} from "./components/HandoffRequestStatus";
import { HandoffReceipt } from "./utils/receipt-contract";
import { displayText, formatDate } from "./utils/display-format";
import { useHandoffReceipts } from "./utils/useHandoffReceipts";
import { useVessloData } from "./utils/useVessloData";

export default function HandoffRequests() {
  const { state, isLoading, refresh } = useHandoffReceipts();
  const { data, state: exportState } = useVessloData();
  const [query, setQuery] = useState("");
  const publisherSession =
    exportState.status === "ready" &&
    (data?.schemaVersion === 2 || data?.schemaVersion === 3)
      ? data.publisherSessionId?.toLowerCase()
      : undefined;
  const match = (receipt: HandoffReceipt) =>
    [
      receipt.request.requestId,
      receipt.request.publisherSessionId,
      receipt.phase,
      receipt.reason,
      ...receipt.targets.flatMap((entry) => [
        entry.target.bundleId,
        entry.target.canonicalPath,
        entry.target.caskToken,
        entry.phase,
        entry.reason,
      ]),
    ].some((value) =>
      value?.toLowerCase().includes(query.trim().toLowerCase()),
    );
  const records = state.receipts
    .filter(match)
    .sort(
      (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
    );
  const groups = publisherSession
    ? [
        {
          title: "Current Export Session",
          records: records.filter(
            (receipt) =>
              receipt.request.publisherSessionId.toLowerCase() ===
              publisherSession,
          ),
        },
        {
          title: "Earlier Publisher Session — History",
          records: records.filter(
            (receipt) =>
              receipt.request.publisherSessionId.toLowerCase() !==
              publisherSession,
          ),
        },
      ]
    : [{ title: "Publisher Session Unverified — History", records }];
  const expired = state.expiredReceipts.filter(match);
  const item = (receipt: HandoffReceipt, expired: boolean) => {
    const current = state.status === "ready" && !expired;
    return (
      <List.Item
        key={receipt.request.requestId}
        id={receipt.request.requestId}
        title={displayText(
          receipt.targets.map((entry) => entry.target.caskToken).join(", "),
          160,
        )}
        subtitle={displayText(receipt.request.requestId, 36)}
        icon={
          current && receipt.phase === "completed"
            ? Icon.CheckCircle
            : Icon.Document
        }
        accessories={[
          {
            text: !current
              ? expired
                ? "Expired history"
                : "Cached — unconfirmed"
              : RECEIPT_PHASE_LABELS[receipt.phase],
            tooltip: formatDate(receipt.updatedAt) ?? "Unknown time",
          },
        ]}
        detail={
          <List.Item.Detail
            markdown={`${state.status !== "ready" ? `> ${state.reason ?? "Receipt read is unavailable."} Cached results are not current confirmation.\n\n` : ""}${receipt.request.publisherSessionId.toLowerCase() !== publisherSession ? "> This request belongs to a different or unverified export session. It is request history and must not authorize a new request.\n\n" : ""}${receiptMarkdown(receipt, current)}\n\nThis read-only history never retries, deletes, or executes requests.`}
          />
        }
        actions={
          <ActionPanel>
            <ReloadReceiptsAction refresh={refresh} />
            <Action.CopyToClipboard
              title="Copy Request ID"
              content={receipt.request.requestId}
            />
          </ActionPanel>
        }
      />
    );
  };
  return (
    <List
      isLoading={isLoading}
      isShowingDetail={records.length + expired.length > 0}
      filtering={false}
      searchText={query}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Search Vesslo request receipts by ID, target, result, or reason"
    >
      {state.status !== "ready" && state.status !== "loading" && (
        <List.Item
          id="receipt-read-state"
          title="Receipt Read Unavailable"
          subtitle={state.reason ?? "Results are unconfirmed"}
          icon={Icon.Warning}
          detail={
            <List.Item.Detail
              markdown={`# Receipt Read Unavailable\n\n${state.reason}\n\nPreviously observed results, if shown, are cached history. Missing receipts do not mean acceptance or completion.`}
            />
          }
          actions={
            <ActionPanel>
              <ReloadReceiptsAction refresh={refresh} />
            </ActionPanel>
          }
        />
      )}
      {groups.map((group) => (
        <List.Section
          key={group.title}
          title={group.title}
          subtitle={`${group.records.length} requests · Read-only`}
        >
          {group.records.map((receipt) => item(receipt, false))}
        </List.Section>
      ))}
      {expired.length > 0 && (
        <List.Section title="Expired Terminal Receipts — History Only">
          {expired.map((receipt) => item(receipt, true))}
        </List.Section>
      )}
      {records.length + expired.length === 0 && state.status === "ready" && (
        <List.EmptyView
          title={query ? "No Matching Request Receipts" : "No Request Receipts"}
          description="Only app-owned receipts appear here. URL opening alone does not prove acceptance or completion."
          icon={Icon.Document}
          actions={
            <ActionPanel>
              <ReloadReceiptsAction refresh={refresh} />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

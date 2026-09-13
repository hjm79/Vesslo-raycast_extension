import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { HandoffRequest } from "../utils/handoff-contract";
import { HandoffReceipt, ReceiptPhase } from "../utils/receipt-contract";
import { bindReceipt } from "../utils/receipt-contract";
import { formatDate, markdownText } from "../utils/display-format";
import { useHandoffReceipts } from "../utils/useHandoffReceipts";

export const RECEIPT_PHASE_LABELS: Record<ReceiptPhase, string> = {
  accepted: "Accepted — Awaiting Vesslo Review",
  rejected: "Rejected",
  running: "Running — Completion Unconfirmed",
  verificationPending: "Verification Pending",
  completed: "Completed — Verified by Vesslo",
  failed: "Failed — Check Each Target",
  cancelled: "Cancelled",
};
const PHASE_EXPLANATIONS: Record<ReceiptPhase, string> = {
  accepted:
    "Vesslo has received the request. Execution and completion are not confirmed; review and confirmation occur in Vesslo.",
  rejected:
    "Vesslo rejected admission. Check each original target's reason; this is not an execution result.",
  running:
    "Vesslo has entered the execution flow after confirmation. Terminal waiting and process exit do not prove completion.",
  verificationPending:
    "The actual outcome is awaiting Vesslo's authoritative verification. Do not assume completion or resend the request.",
  completed:
    "Vesslo reports authoritative verification for every original target. This confirms this request's result, not the app's current installed version indefinitely.",
  failed:
    "At least one target failed, or results are mixed. A completed target must not hide another target's failure.",
  cancelled:
    "Vesslo reports cancellation before execution or cancellation that its engine determined was safe.",
};
export function requestIdentityMarkdown(request: HandoffRequest): string {
  const text = markdownText;
  return `**Request:** ${text(request.requestId)}\n\n**Request schema:** ${request.schemaVersion}${request.schemaVersion === 1 ? "\n\n**Legacy request record:** Read-only. This V1 record cannot authorize a new target-readiness review." : ""}\n\n**Publisher session:** ${text(request.publisherSessionId)}\n\n**Created:** ${text(formatDate(request.createdAt))}\n\n**Inventory / completed check revision:** ${request.inventoryRevision} / ${request.completedCheckRevision}\n\n**Source:** Homebrew`;
}
export function receiptMarkdown(
  receipt: HandoffReceipt,
  current = true,
): string {
  const text = markdownText;
  const targets = receipt.targets
    .map((entry, index) => {
      const target = entry.target;
      return `### Target ${index + 1}: ${text(target.caskToken)}\n\n**${current ? "Result" : "Last recorded result"}:** ${RECEIPT_PHASE_LABELS[entry.phase]}\n\n${entry.reason ? `**Reason:** ${text(entry.reason)}\n\n` : ""}**App ID:** ${text(target.appId)}\n\n**Bundle ID:** ${text(target.bundleId)}\n\n**Path:** ${text(target.canonicalPath)}\n\n**Requested version change:** ${text(target.installedVersion)} → ${text(target.expectedTargetVersion)}${target.readinessEvidenceId ? `\n\n**Readiness evidence:** ${text(target.readinessEvidenceId)}` : ""}${entry.verificationRecordId ? `\n\n**Verification record:** ${text(entry.verificationRecordId)}` : ""}`;
    })
    .join("\n\n---\n\n");
  return `# ${current ? RECEIPT_PHASE_LABELS[receipt.phase] : "Historical Receipt — Current Result Unconfirmed"}\n\n${current ? PHASE_EXPLANATIONS[receipt.phase] : "These are previously recorded results. They are not current confirmation."}\n\n${receipt.reason ? `**Request reason:** ${text(receipt.reason)}\n\n` : ""}${requestIdentityMarkdown(receipt.request)}\n\n**Receipt revision:** ${receipt.revision}\n\n**Received:** ${text(formatDate(receipt.receivedAt))}\n\n**Updated:** ${text(formatDate(receipt.updatedAt))}\n\n**Terminal retention expires:** ${text(formatDate(receipt.expiresAt))}\n\n${targets}`;
}
export function ReloadReceiptsAction({
  refresh,
}: {
  refresh: () => unknown | Promise<unknown>;
}) {
  return (
    <Action
      title="Reload Receipts"
      icon={Icon.ArrowClockwise}
      shortcut={{ modifiers: ["cmd"], key: "r" }}
      onAction={async () => {
        await refresh();
      }}
    />
  );
}
export function HandoffRequestStatus({ request }: { request: HandoffRequest }) {
  const { state, isLoading, refresh } = useHandoffReceipts();
  const bound = bindReceipt(state, request);
  const markdown = bound.receipt
    ? `${bound.reason ? `> ${bound.reason}\n\n` : ""}${receiptMarkdown(bound.receipt, bound.status === "current")}`
    : `# ${bound.status === "conflict" ? "Request Conflict" : bound.status === "unavailable" ? "Receipt Unavailable" : "Awaiting Receipt"}\n\n${bound.reason}\n\n${requestIdentityMarkdown(request)}\n\n${request.targets.map((target, index) => `### Requested Target ${index + 1}\n\n${markdownText(target.caskToken)} · ${markdownText(target.bundleId)}\n\n${markdownText(target.canonicalPath)}\n\n${markdownText(target.installedVersion)} → ${markdownText(target.expectedTargetVersion)}${target.readinessEvidenceId ? `\n\n**Readiness evidence:** ${markdownText(target.readinessEvidenceId)}` : ""}`).join("\n\n")}\n\nThis view never resends or executes a request.`;
  return (
    <Detail
      navigationTitle="Vesslo Request Status"
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <ReloadReceiptsAction refresh={refresh} />
          <Action.CopyToClipboard
            title="Copy Request ID"
            content={request.requestId}
          />
        </ActionPanel>
      }
    />
  );
}

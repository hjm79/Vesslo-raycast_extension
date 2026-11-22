import { Action, ActionPanel, Detail, List } from "@raycast/api";
import { VessloApp } from "../types";
import { auditReviewMarkdown } from "../utils/audit-warning";
import {
  displayText,
  markdownText,
  sourceLabel,
} from "../utils/display-format";

export function AppDetailMetadata({
  app,
  variant = "detail",
}: {
  app: VessloApp;
  variant?: "list" | "detail";
}) {
  const Metadata =
    variant === "list" ? List.Item.Detail.Metadata : Detail.Metadata;
  return (
    <Metadata>
      <Metadata.Label
        title={app.isDeleted ? "Recorded version" : "Installed version"}
        text={displayText(app.version ?? "Unknown", 120)}
      />
      <Metadata.Label
        title="Target version"
        text={displayText(app.targetVersion ?? "Unknown", 120)}
      />
      <Metadata.Label
        title="Sources"
        text={displayText(
          [...new Set(app.sources.slice(0, 20).map(sourceLabel))].join(", ") ||
            "Unknown",
          360,
        )}
      />
      <Metadata.Label
        title="Homebrew cask"
        text={displayText(app.homebrewCask ?? "Not provided", 240)}
      />
      <Metadata.Separator />
      <Metadata.Label
        title="Bundle ID"
        text={displayText(app.bundleId ?? "Not provided", 320)}
      />
      <Metadata.Label
        title={app.isDeleted ? "Recorded path" : "App path"}
        text={displayText(app.path || "Not provided", 1024)}
      />
      <Metadata.Label
        title="Developer"
        text={displayText(app.developer ?? "Unknown", 200)}
      />
      <Metadata.Label
        title="Record"
        text={app.isDeleted ? "Deleted app history" : "Installed app"}
      />
    </Metadata>
  );
}

export function appDetailMarkdown(
  app: VessloApp,
  reviewReason: string | null,
): string {
  return `${reviewReason ? `> ${markdownText(reviewReason, 640)}\n\n` : ""}${auditReviewMarkdown(app, "review", "nativeMetadata")}`;
}

export function AppDetail({
  app,
  reviewReason,
}: {
  app: VessloApp;
  reviewReason: string | null;
}) {
  return (
    <Detail
      navigationTitle={displayText(app.name, 200) || "App Details"}
      markdown={appDetailMarkdown(app, reviewReason)}
      metadata={<AppDetailMetadata app={app} />}
      actions={
        <ActionPanel>
          {app.bundleId && (
            <Action.CopyToClipboard
              title="Copy Bundle ID"
              content={app.bundleId}
            />
          )}
          <Action.CopyToClipboard
            title={app.isDeleted ? "Copy Recorded Path" : "Copy App Path"}
            content={app.path}
          />
        </ActionPanel>
      }
    />
  );
}

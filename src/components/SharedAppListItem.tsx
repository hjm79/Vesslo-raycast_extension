import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { VessloApp } from "../types";
import { isUpdatableApp } from "../utils/update-filter";
import {
  auditReviewMarkdown,
  auditWarningAccessory,
} from "../utils/audit-warning";
import { resolveAppActions } from "../utils/action-policy";
import { VessloDataState } from "../utils/data-state";
import { AppActions } from "./AppActions";
import {
  displayText,
  installedAppIconPath,
  markdownText,
  sourceLabel,
} from "../utils/display-format";

interface SharedAppListItemProps {
  app: VessloApp;
  matchedFields?: string[];
  searchMatchDescription?: string;
  extraActions?: React.ReactNode;
  leadingActions?: React.ReactNode;
  selectedForReview?: boolean;
  onTagClick?: (tag: string) => void;
  tagNavigation?: (tag: string) => React.ReactElement;
  onRefresh?: () => unknown | Promise<unknown>;
  state: VessloDataState;
  showUpdateDetails?: boolean;
  showReviewDetails?: boolean;
  reviewOnly?: boolean;
}

export function SharedAppListItem({
  app,
  matchedFields = [],
  searchMatchDescription,
  extraActions,
  leadingActions,
  selectedForReview,
  onTagClick,
  tagNavigation,
  onRefresh,
  state,
  showUpdateDetails = false,
  showReviewDetails = false,
  reviewOnly = false,
}: SharedAppListItemProps) {
  const subtitle = [
    app.version,
    app.developer,
    ...app.tags.slice(0, 20).map((t) => `#${t}`),
  ]
    .filter(Boolean)
    .join(" • ");

  const accessories: List.Item.Accessory[] = [];
  if (selectedForReview)
    accessories.push({ tag: { value: "SELECTED", color: Color.Blue } });
  const hasUpdate = isUpdatableApp(app);
  const policy = resolveAppActions(app, state);
  if (showUpdateDetails) {
    accessories.push({
      text: `${displayText(app.version ?? "Unknown", 80)} → ${displayText(app.targetVersion ?? "Review", 80)}`,
    });
  }
  if (policy.reviewReason) {
    accessories.push({
      tag: { value: "REVIEW", color: Color.Orange },
      tooltip: displayText(policy.reviewReason, 640),
    });
  }

  // Show matched field indicators
  matchedFields.forEach((field) => {
    let icon: Icon;
    let color: Color;
    let tooltip: string;

    switch (field) {
      case "name":
        icon = Icon.AppWindow;
        color = Color.SecondaryText;
        tooltip = "Matched: Name";
        break;
      case "bundleId":
        icon = Icon.Code;
        color = Color.SecondaryText;
        tooltip = `Matched Bundle ID: ${displayText(app.bundleId, 320)}`;
        break;
      case "developer":
        icon = Icon.Person;
        color = Color.Blue;
        tooltip = "Matched: Developer";
        break;
      case "memo":
        icon = Icon.Document;
        color = Color.Orange;
        tooltip = "Matched: Memo";
        break;
      case "tag":
        icon = Icon.Tag;
        color = Color.Purple;
        tooltip = "Matched: Tag";
        break;
      default:
        icon = Icon.Circle;
        color = Color.SecondaryText;
        tooltip = "Matched";
    }

    accessories.push({ icon: { source: icon, tintColor: color }, tooltip });
  });

  // Update badge
  if (hasUpdate && !reviewOnly) {
    accessories.push({ tag: { value: "UPDATE", color: Color.Green } });
  }

  const auditAccessory = auditWarningAccessory(app);
  if (auditAccessory) {
    accessories.push(auditAccessory);
  }

  // Source badges
  [
    ...new Set((reviewOnly ? [] : app.sources.slice(0, 20)).map(sourceLabel)),
  ].forEach((source) => {
    const color =
      source === "Homebrew"
        ? Color.Orange
        : source === "App Store"
          ? Color.Blue
          : source === "Sparkle"
            ? Color.Green
            : Color.SecondaryText;
    accessories.push({ tag: { value: source, color } });
  });

  // Icon
  const iconPath = installedAppIconPath(app, state);
  const icon = iconPath ? { fileIcon: iconPath } : Icon.AppWindow;

  return (
    <List.Item
      id={app.id}
      icon={icon}
      title={displayText(app.name, 200) || "Unnamed App"}
      subtitle={
        reviewOnly
          ? undefined
          : showUpdateDetails || showReviewDetails
            ? displayText(app.developer)
            : displayText(searchMatchDescription ?? subtitle, 360)
      }
      accessories={accessories}
      detail={
        showUpdateDetails || showReviewDetails ? (
          <List.Item.Detail
            markdown={`${policy.reviewReason ? `> ${markdownText(policy.reviewReason, 640)}\n\n` : ""}${auditReviewMarkdown(app, showReviewDetails ? "review" : "metadata")}`}
          />
        ) : undefined
      }
      actions={
        <ActionPanel>
          {leadingActions}
          <AppActions
            app={app}
            state={state}
            reviewOnly={reviewOnly}
            onRefresh={onRefresh}
          />

          {/* Tags Navigation Actions */}
          <ActionPanel.Section title="Tags">
            {(tagNavigation || onTagClick) &&
              [...new Set(app.tags)].map((tag) =>
                tagNavigation ? (
                  <Action.Push
                    key={tag}
                    title={`Browse #${displayText(tag, 80)}`}
                    icon={Icon.Tag}
                    target={tagNavigation(tag)}
                  />
                ) : (
                  <Action
                    key={tag}
                    title={`Browse #${displayText(tag, 80)}`}
                    icon={Icon.Tag}
                    onAction={() => onTagClick?.(tag)}
                  />
                ),
              )}
          </ActionPanel.Section>

          {extraActions && (
            <ActionPanel.Section>{extraActions}</ActionPanel.Section>
          )}
        </ActionPanel>
      }
    />
  );
}

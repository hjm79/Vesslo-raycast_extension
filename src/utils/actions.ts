import { open, showToast, Toast, closeMainWindow } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

const execAsync = promisify(exec);

// Detect Homebrew path (Apple Silicon vs Intel)
function getBrewPath(): string {
  if (existsSync("/opt/homebrew/bin/brew")) {
    return "/opt/homebrew/bin/brew";
  }
  return "/usr/local/bin/brew";
}

export const VESSLO_URL_SCHEME = "vesslo://";

export async function openInVesslo(bundleId: string) {
  try {
    await closeMainWindow();
    await open(`${VESSLO_URL_SCHEME}app/${bundleId}`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open in Vesslo",
      message: String(error),
    });
  }
}

export function getAppStoreUrl(appStoreId: string): string {
  return `macappstore://apps.apple.com/app/id${appStoreId}`;
}

export async function runBrewUpgrade(caskName: string, appName: string) {
  const brewPath = getBrewPath();

  try {
    await showToast({
      style: Toast.Style.Animated,
      title: `Updating ${appName}...`,
    });

    const { stdout } = await execAsync(
      `${brewPath} upgrade --cask ${JSON.stringify(caskName)}`,
    );

    await showToast({
      style: Toast.Style.Success,
      title: `${appName} updated!`,
      message: stdout || "Update complete",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await showToast({
      style: Toast.Style.Failure,
      title: `Failed to update ${appName}`,
      message: errorMessage,
    });
  }
}

export async function runBrewUpgradeInTerminal(caskName: string) {
  const brewPath = getBrewPath();
  const command = `${brewPath} upgrade --cask ${caskName}`;

  try {
    await closeMainWindow();
    // Activate Terminal first, then run the command in a new window
    await execAsync(
      `osascript -e 'tell application "Terminal"' -e 'activate' -e 'do script "${command}"' -e 'end tell'`,
    );
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open Terminal",
      message: String(error),
    });
  }
}

export async function runMasUpgradeInTerminal(appStoreId: string) {
  const command = `mas upgrade ${appStoreId}`;

  try {
    await closeMainWindow();
    // Activate Terminal first, then run the command in a new window
    await execAsync(
      `osascript -e 'tell application "Terminal"' -e 'activate' -e 'do script "${command}"' -e 'end tell'`,
    );
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open Terminal",
      message: String(error),
    });
  }
}

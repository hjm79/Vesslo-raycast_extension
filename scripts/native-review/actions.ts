import { constants, promises as fs } from "fs";
import { createHash, randomUUID } from "crypto";
import { execFile } from "child_process";
import { join } from "path";
import { VessloApp, VessloData } from "../types";
import { createHomebrewReviewExecutor } from "./handoff-execution";
import { parseHomebrewReviewURL } from "./handoff-contract";
import { readCurrentVessloData } from "./data-reader";
import { config } from "../../native/config";
import { showToast, Toast } from "../../native/api";

async function privateEvidence(path: string, maximum: number): Promise<string> {
  const handle = await fs.open(
    path,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  try {
    const before = await handle.stat();
    if (
      !before.isFile() ||
      before.nlink !== 1 ||
      before.uid !== config.uid ||
      (before.mode & 0o777) !== 0o600 ||
      before.size > maximum
    )
      throw new Error("Invalid private delivery evidence.");
    const buffer = Buffer.alloc(maximum + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        length,
        buffer.length - length,
        length,
      );
      if (!bytesRead) break;
      length += bytesRead;
    }
    const after = await handle.stat();
    if (
      length > maximum ||
      before.ino !== after.ino ||
      before.dev !== after.dev ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs
    )
      throw new Error("Delivery evidence changed.");
    return new TextDecoder("utf-8", { fatal: true }).decode(
      buffer.subarray(0, length),
    );
  } finally {
    await handle.close();
  }
}

/** Evidence records a possible delivery attempt, never receipt acceptance or completion. */
export async function hasBoundDeliveryEvidence(
  url: string,
  outputDirectory: string,
): Promise<boolean> {
  try {
    if (
      !outputDirectory.startsWith(config.evidenceRoot + "/") ||
      (await fs.realpath(outputDirectory)) !== outputDirectory
    )
      return false;
    const directory = await fs.lstat(outputDirectory);
    if (
      !directory.isDirectory() ||
      directory.isSymbolicLink() ||
      directory.uid !== config.uid ||
      (directory.mode & 0o777) !== 0o700
    )
      return false;
    const delivery = JSON.parse(
      await privateEvidence(join(outputDirectory, "delivery.json"), 64 * 1024),
    );
    const recordedURL = await privateEvidence(
      join(outputDirectory, "request-url.txt"),
      32 * 1024 + 1,
    );
    return (
      delivery.schemaVersion === 1 &&
      delivery.hostPID === config.hostPID &&
      delivery.hostSessionId === config.publisherSessionId &&
      delivery.url === url &&
      (recordedURL === url || recordedURL === url + "\n")
    );
  } catch {
    return false;
  }
}

/** This is the only process capability in the generated extension. It cannot open an OS URL. */
export async function bridgeTransport(url: string): Promise<void> {
  const request = parseHomebrewReviewURL(url);
  if (
    !request ||
    request.publisherSessionId.toLowerCase() !==
      config.publisherSessionId.toLowerCase()
  )
    throw new Error(
      "Native fixture request does not belong to the bound host.",
    );
  const manifestText = await privateEvidence(config.manifestPath, 64 * 1024);
  if (
    createHash("sha256").update(manifestText, "utf8").digest("hex") !==
    config.manifestSHA256
  )
    throw new Error("Native fixture host manifest changed.");
  const root = await fs.lstat(config.evidenceRoot);
  if (
    !root.isDirectory() ||
    root.isSymbolicLink() ||
    root.dev !== config.evidenceDev ||
    root.ino !== config.evidenceIno ||
    root.uid !== config.uid ||
    (root.mode & 0o777) !== 0o700 ||
    (await fs.realpath(config.evidenceRoot)) !== config.evidenceRoot
  )
    throw new Error("Native fixture evidence root changed.");
  const wrapper = await fs.lstat(config.transportPath);
  const wrapperBytes = await fs.readFile(config.transportPath);
  if (
    !wrapper.isFile() ||
    wrapper.isSymbolicLink() ||
    wrapper.nlink !== 1 ||
    createHash("sha256").update(wrapperBytes).digest("hex") !==
      config.transportSHA256
  )
    throw new Error("Native fixture transport changed.");
  const wrapperSource = new TextDecoder("utf-8", { fatal: true }).decode(
    wrapperBytes,
  );
  const nonce = randomUUID();
  const urlPath = join(config.evidenceRoot, `${nonce}.url`);
  const handle = await fs.open(
    urlPath,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      constants.O_NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(url, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  const outputDirectory = join(config.evidenceRoot, `${nonce}-delivery`);
  const args = [
    "-I",
    "-B",
    "-c",
    wrapperSource,
    "--driver",
    config.driverPath,
    "--driver-sha256",
    config.driverSHA256,
    "--manifest",
    config.manifestPath,
    "--manifest-sha256",
    config.manifestSHA256,
    "--url-file",
    urlPath,
    "--output-dir",
    outputDirectory,
  ];
  try {
    await new Promise<void>((resolve, reject) => {
      execFile(
        "/usr/bin/python3",
        args,
        {
          shell: false,
          timeout: 30000,
          maxBuffer: 1024 * 1024,
          encoding: "utf8",
          env: {
            PATH: "/usr/bin:/bin",
            LANG: "en_US.UTF-8",
            PYTHONDONTWRITEBYTECODE: "1",
          },
        },
        (error, _stdout, stderr) => {
          if (error)
            reject(
              new Error(
                `Native review delivery failed: ${String(stderr || error.message).slice(0, 400)}`,
              ),
            );
          else resolve();
        },
      );
    });
  } catch (error) {
    if (!(await hasBoundDeliveryEvidence(url, outputDirectory))) throw error;
  }
}
const reviewHomebrew = createHomebrewReviewExecutor({
  read: () => readCurrentVessloData({ force: true }),
  open: bridgeTransport,
  now: Date.now,
  uuid: randomUUID,
});
export async function requestHomebrewReview(
  data: VessloData,
  apps: readonly VessloApp[],
) {
  return reviewHomebrew(data, apps);
}
async function blocked() {
  await showToast({
    style: Toast.Style.Failure,
    title: "Action Disabled in Native Review Fixture",
    message: "Only exact review delivery to the bound TestHost is enabled.",
  });
}
export async function openInVesslo(_bundleId?: string | null) {
  await blocked();
}
export async function performAppAction(
  _app: VessloApp,
  _intent: "update" | "open" | "finder",
) {
  await blocked();
}

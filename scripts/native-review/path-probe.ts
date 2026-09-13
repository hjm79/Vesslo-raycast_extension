import { promises as fs } from "fs";
import { config } from "./config";

/** Synthetic installation availability only; all export IO remains the real bounded reader. */
export async function nativeFixtureAppStat(path: string) {
  if (!config.targets.some((target) => target.canonicalPath === path))
    throw Object.assign(new Error("App path is outside this native fixture."), {
      code: "EACCES",
    });
  const root = await fs.lstat(config.stateRoot);
  if (
    !root.isDirectory() ||
    root.isSymbolicLink() ||
    root.dev !== config.stateDev ||
    root.ino !== config.stateIno ||
    root.uid !== config.uid ||
    (root.mode & 0o777) !== 0o700
  )
    throw Object.assign(new Error("Native fixture state root changed."), {
      code: "EACCES",
    });
  return { isDirectory: () => true };
}

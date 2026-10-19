import { execFileSync } from "node:child_process";
import path from "node:path";
import { EXPECTED_TRACK_IDS, GENERATED_DIRECTORY, RELEASE_LOCK_RELATIVE_PATH, SUCCESSOR_LEDGER_FILE_NAME } from "./syncBundledContentRelease.mjs";

export const DERIVED_CURRENT_CONTENT_PATHS = Object.freeze([
  ...EXPECTED_TRACK_IDS.map((trackId) => `${GENERATED_DIRECTORY}/${trackId}.json`),
  `${GENERATED_DIRECTORY}/content-lock.json`,
  `${GENERATED_DIRECTORY}/${SUCCESSOR_LEDGER_FILE_NAME}`,
  RELEASE_LOCK_RELATIVE_PATH,
].sort());

const ALLOWED_DERIVED_PATHS = new Set(DERIVED_CURRENT_CONTENT_PATHS);

export function currentContentWorktreeStatus(applicationRoot) {
  let output;
  try {
    output = execFileSync("git", ["-C", path.resolve(applicationRoot), "status", "--porcelain=v1", "--untracked-files=all"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return { status: "unavailable", changedPathCount: 0, changedPaths: [], error: "application worktree status unavailable" };
  }
  const changedPaths = output.split("\n").filter(Boolean).map((entry) => entry.slice(3));
  const unexpectedPaths = changedPaths.filter((changedPath) => !ALLOWED_DERIVED_PATHS.has(changedPath));
  return {
    status: unexpectedPaths.length > 0 ? "dirty" : changedPaths.length > 0 ? "derived_content" : "clean",
    changedPathCount: changedPaths.length,
    changedPaths: changedPaths.filter((changedPath) => ALLOWED_DERIVED_PATHS.has(changedPath)).sort(),
    unexpectedPaths: unexpectedPaths.sort(),
  };
}

export function assertOnlyDerivedCurrentContentChanges(applicationRoot) {
  const status = currentContentWorktreeStatus(applicationRoot);
  if (status.status === "unavailable") throw new Error(status.error);
  if (status.status === "dirty") throw new Error(`Application worktree contains changes outside generated current-content outputs: ${status.unexpectedPaths.join(", ")}`);
  return status;
}

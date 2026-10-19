import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { assertOnlyDerivedCurrentContentChanges } from "./currentContentWorktree.mjs";
import { syncCanonicalContent } from "./syncBundledContentRelease.mjs";

const appRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

export async function verifyDerivedContentWorkspace({ applicationRoot = appRoot, contentRoot = process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content"), expectedContentCommit = process.env.PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA } = {}) {
  const actualCommit = execFileSync("git", ["-C", contentRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (expectedContentCommit && actualCommit !== expectedContentCommit) throw new Error("Selected content checkout HEAD differs from the expected exact SHA.");
  const result = await syncCanonicalContent({ mode: "check", appRoot: applicationRoot, producerRoot: contentRoot });
  const worktree = assertOnlyDerivedCurrentContentChanges(applicationRoot);
  return {
    sourceRepositoryCommit: actualCommit,
    sourceInputFingerprint: result.currentIdentity.sourceInputFingerprint,
    artifactDigests: result.currentIdentity.tracks.map(({ trackId, artifactSha256, artifactBytes }) => ({ trackId, sha256: artifactSha256, bytes: artifactBytes })),
    derivedPaths: worktree.changedPaths,
    inventory: result.inventory,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await verifyDerivedContentWorkspace();
    process.stdout.write(`CURRENT_CONTENT_WORKSPACE=verified sourceCommit=${result.sourceRepositoryCommit} fingerprint=${result.sourceInputFingerprint} tracks=${result.inventory.trackCount} questions=${result.inventory.questionCount}\n`);
    for (const artifact of result.artifactDigests) process.stdout.write(`CONTENT_ARTIFACT=${artifact.trackId} sha256=${artifact.sha256} bytes=${artifact.bytes}\n`);
    for (const derivedPath of result.derivedPaths) process.stdout.write(`DERIVED_APP_PATH=${derivedPath}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

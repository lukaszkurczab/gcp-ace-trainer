import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

type Options = Readonly<{
  appRoot: string;
  repositoryRoot: string;
  trackId: string;
  after: (cleanup: () => void | Promise<void>) => void;
}>;
type ReleaseArtifact = Readonly<{
  trackId: string;
  contentVersion: string;
  checksumSha256: string;
  producerCommit: string;
  sourceRepositoryCommit: string;
}>;
type ContentLockEntry = Readonly<{ trackId: string; contentVersion: string; sha256: string }>;

/**
 * Creates a disposable producer checkout at the exact source commit already
 * admitted by this app's release lock. This keeps historical integration
 * fixtures independent of whichever producer worktree happens to be current.
 */
export async function lockedContentProducer({ appRoot, repositoryRoot, trackId, after }: Options): Promise<string> {
  const [releaseLock, contentLock] = await Promise.all([
    readFile(path.join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8").then((bytes) => JSON.parse(bytes) as { artifacts: readonly ReleaseArtifact[] }),
    readFile(path.join(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8").then((bytes) => JSON.parse(bytes) as { tracks: readonly ContentLockEntry[] }),
  ]);
  const releaseEntries = releaseLock.artifacts.filter((entry) => entry.trackId === trackId);
  const contentEntries = contentLock.tracks.filter((entry) => entry.trackId === trackId);
  assert.equal(releaseEntries.length, 1, `${trackId} has exactly one admitted release artifact`);
  assert.equal(contentEntries.length, 1, `${trackId} has exactly one bundled content lock`);
  const release = releaseEntries[0]!;
  const content = contentEntries[0]!;
  assert.match(release.producerCommit, /^[a-f0-9]{40}$/u, `${trackId} has an exact producer commit`);
  assert.equal(release.sourceRepositoryCommit, release.producerCommit, `${trackId} source and producer commits agree`);
  assert.equal(content.contentVersion, release.contentVersion, `${trackId} bundled version matches its admitted release`);
  assert.equal(content.sha256, release.checksumSha256, `${trackId} bundled bytes match its admitted release`);

  const temporaryRoot = await realpath(await mkdtemp(path.join(tmpdir(), "patternly-locked-producer-")));
  const root = path.join(temporaryRoot, "content");
  after(() => rm(temporaryRoot, { recursive: true, force: true }));
  execFileSync("git", ["clone", "--shared", "--no-checkout", "--quiet", repositoryRoot, root], { stdio: "pipe" });
  execFileSync("git", ["checkout", "--quiet", "--detach", release.producerCommit], { cwd: root, stdio: "pipe" });
  assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), release.producerCommit);
  return root;
}

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { TestContext } from "node:test";

// QLE handoff: the immutable local-only acceptance fingerprints this producer.
const ACCEPTED_QLE_PRODUCER_SHA = "71b0096f99a0afef8891e8e1b3d591575661ad88";

export async function acceptedQleProducer(t: TestContext, repositoryRoot: string): Promise<string> {
  // Node resolves module URLs through symlinks; the historical CLI entry guard
  // compares that URL with argv[1], so both must use the same physical path.
  const temporaryRoot = await realpath(await mkdtemp(path.join(tmpdir(), "patternly-accepted-qle-")));
  t.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const root = path.join(temporaryRoot, "content");
  execFileSync("git", ["clone", "--shared", "--no-checkout", "--quiet", repositoryRoot, root], { stdio: "pipe" });
  execFileSync("git", ["checkout", "--quiet", "--detach", ACCEPTED_QLE_PRODUCER_SHA], { cwd: root, stdio: "pipe" });
  assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), ACCEPTED_QLE_PRODUCER_SHA);
  return root;
}

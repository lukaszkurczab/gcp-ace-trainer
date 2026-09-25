import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createCandidateContentReleaseLock } from "./candidateContentReleaseLock.mjs";

const appRoot = path.resolve(import.meta.dirname, "..");
const contentRoot = path.resolve(appRoot, "../patternly-content");

test("candidate lock binds the exact nine bundled artifacts", async () => {
  const lock = await createCandidateContentReleaseLock({ appRoot, contentRoot });
  assert.equal(lock.schemaVersion, 3);
  assert.equal(lock.artifacts.length, 9);
  assert.equal(new Set(lock.artifacts.map((artifact) => artifact.trackId)).size, 9);
  assert.match(lock.candidateId, /^[a-f0-9]{64}$/u);
  assert.match(lock.bundledContentLockSha256, /^[a-f0-9]{64}$/u);
});

test("candidate lock rejects bundled bytes outside the candidate", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "patternly-candidate-lock-"));
  try {
    const target = path.join(fixture, "src/content/generated/canonical-content");
    await mkdir(target, { recursive: true });
    const bundled = JSON.parse(await readFile(path.join(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8"));
    bundled.tracks[0].sha256 = "0".repeat(64);
    await writeFile(path.join(target, "content-lock.json"), `${JSON.stringify(bundled)}\n`);
    await assert.rejects(createCandidateContentReleaseLock({ appRoot: fixture, contentRoot }), /Bundled content differs/);
  } finally { await rm(fixture, { recursive: true, force: true }); }
});

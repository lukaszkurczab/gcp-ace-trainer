import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const APP_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const BUNDLED_ROOT = path.join(APP_ROOT, "src/content/generated/canonical-content");
const SCRIPT = path.join(APP_ROOT, "scripts/qa/contentCandidateRuntimeConsume.mjs");

test("candidate consumer CLI validates the real APP runtime catalog and emits aggregate output only", async (t) => {
  const candidateRoot = await mkdtemp(path.join(os.tmpdir(), "patternly-content-runtime-consumer-"));
  t.after(() => rm(candidateRoot, { recursive: true, force: true }));
  const lockPath = path.join(BUNDLED_ROOT, "content-lock.json");
  const lock = JSON.parse(await readFile(lockPath, "utf8"));
  const artifactNames = lock.tracks.map(({ trackId }) => `${trackId}.json`);
  for (const filename of [...artifactNames, "content-lock.json"]) {
    await cp(path.join(BUNDLED_ROOT, filename), path.join(candidateRoot, filename));
  }
  assert.deepEqual((await readdir(candidateRoot)).sort(), [...artifactNames, "content-lock.json"].sort());
  const output = execFileSync(process.execPath, ["--import", "tsx", SCRIPT, "--candidate-dir", candidateRoot], { cwd: APP_ROOT, encoding: "utf8" });
  assert.deepEqual(JSON.parse(output), { status: "consumed", trackCount: 9, questionCount: 16_749 });
  assert.doesNotMatch(output, /trackId|contentVersion|sha256|questionId/u);
});

test("candidate consumer rejects a changed artifact without printing its contents", async (t) => {
  const candidateRoot = await mkdtemp(path.join(os.tmpdir(), "patternly-content-runtime-invalid-"));
  t.after(() => rm(candidateRoot, { recursive: true, force: true }));
  const lock = JSON.parse(await readFile(path.join(BUNDLED_ROOT, "content-lock.json"), "utf8"));
  const artifactNames = lock.tracks.map(({ trackId }) => `${trackId}.json`);
  for (const filename of [...artifactNames, "content-lock.json"]) await cp(path.join(BUNDLED_ROOT, filename), path.join(candidateRoot, filename));
  const changedPath = path.join(candidateRoot, artifactNames[0]);
  const artifact = JSON.parse(await readFile(changedPath, "utf8"));
  artifact.contentVersion = "untrusted-candidate-version";
  await writeFile(changedPath, JSON.stringify(artifact));
  assert.throws(
    () => execFileSync(process.execPath, ["--import", "tsx", SCRIPT, "--candidate-dir", candidateRoot], { cwd: APP_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    (error) => {
      assert.equal(error.status, 1);
      assert.equal(String(error.stderr).trim(), JSON.stringify({ status: "blocked", stage: "canonical_app_consume" }));
      return true;
    }
  );
});

test("candidate consumer CLI refuses malformed arguments with a bounded stage", () => {
  assert.throws(
    () => execFileSync(process.execPath, ["--import", "tsx", SCRIPT, "--candidate-dir"], { cwd: APP_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    (error) => {
      assert.equal(error.status, 1);
      assert.equal(String(error.stderr).trim(), JSON.stringify({ status: "blocked", stage: "arguments" }));
      return true;
    }
  );
});

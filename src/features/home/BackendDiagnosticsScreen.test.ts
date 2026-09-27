import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/BackendDiagnosticsScreen.tsx", "utf8");

test("backend diagnostics records prerequisite and sync preparation failures before final status", () => {
  assert.match(source, /const run = async <T,>\([\s\S]*?try \{[\s\S]*?return \{ kind: "passed", value \};[\s\S]*?catch \(error\) \{[\s\S]*?results\.push\(\{ code: errorCode\(error\), id, label, status: "failed" \}\);[\s\S]*?return \{ kind: "failed" \}/);
  assert.match(source, /const progressRead = await run\("progress-read", text\.progressRead,[\s\S]*?client\.getProgress\(\)/);
  assert.match(source, /if \(progressRead\.kind === "failed"\) \{\s*results\.push\(\{ code: "dependency_failed", id: "sync-preflight", label: text\.syncPreflight, status: "failed" \}\)/);
  assert.match(source, /const setup = await run\("sync-preflight", text\.syncPreflight,[\s\S]*?accountDataRecordFingerprint/);
  assert.match(source, /if \(setup\.kind === "passed"\) \{[\s\S]*?run\("sync-apply"[\s\S]*?run\("sync-duplicate"[\s\S]*?run\("sync-conflict"[\s\S]*?run\("progress-after-sync"/);
  assert.doesNotMatch(source, /const beforeSync = await client\.getProgress\(\)/);
  assert.match(source, /setRunState\(\{ results: Object\.freeze\(results\), status: results\.every\(\(result\) => result\.status === "passed"\) \? "passed" : "failed" \}\)/);
});

test("successful backend diagnostics still verify sync apply, deduplication, conflict, and read-after", () => {
  for (const id of ["sync-apply", "sync-duplicate", "sync-conflict", "progress-after-sync"]) {
    assert.match(source, new RegExp(`run\\("${id}"`));
  }
  assert.match(source, /response\.applied\.length !== 1/);
  assert.match(source, /response\.duplicates\[0\] !== mutationId/);
  assert.match(source, /response\.conflicts\.length !== 0/);
  assert.match(source, /record\.targetId === targetId && record\.version === 1/);
  assert.match(source, /batchId: `ios-simulator-backend:\$\{attempt\}:\$\{requestMutation\.mutationId\}`/);
  assert.match(source, /run\("sync-apply"[\s\S]*?syncRequest\(beforeSync\.accountRevision, mutation, "apply"\)/);
  assert.match(source, /run\("sync-duplicate"[\s\S]*?syncRequest\(beforeSync\.accountRevision, mutation, "duplicate"\)/);
});

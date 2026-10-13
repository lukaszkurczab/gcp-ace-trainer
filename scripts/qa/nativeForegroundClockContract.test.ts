import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createProfileScopedStorage } from "../../src/infrastructure/storage/profileStorageRouter";
import { STORAGE_KEYS } from "../../src/storage/keys";
import { createForegroundTimerState } from "../../src/domain/learning/foregroundTimerState";

// Actual host Foundation/C++ execution tests the delivered codec/segment, not
// Nitro/MMKV/UIKit fidelity, scheduler latency or PERSIST-11 recovery loss.
test("native foreground contract preserves the TS timer schema and monotonic checkpoint accounting", { skip: process.platform !== "darwin" }, () => {
  const directory = mkdtempSync(join(tmpdir(), "patternly-native-clock-contract-"));
  try {
    const binary = join(directory, "clock-contract");
    const compile = spawnSync("xcrun", ["--sdk", "macosx", "clang++", "-std=c++20", "-fobjc-arc", "-framework", "Foundation",
      "-fmodules-cache-path=" + join(directory, "module-cache"),
      resolve("native/foreground-clock/ForegroundTimerRecord.mm"), resolve("scripts/qa/nativeForegroundClockContract.mm"), "-o", binary],
    { encoding: "utf8", timeout: 60_000, maxBuffer: 512 * 1024 });
    assert.equal(compile.status, 0, compile.error?.message ?? compile.stderr);
    const payload = createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: "coding_interview", sessionId: 'session/"😀',
      trackId: "coding-interview-dsa-problem-solving", accumulatedForegroundMs: 1234, checkpointRevision: 17,
      lastCheckpointAt: "2026-10-13T12:34:56.789Z", running: true });
    const envelope = { schemaIdentity: "patternly:canonical:v1", revision: 23, payload };
    const valid = [envelope, { ...envelope, payload: { ...payload, accumulatedForegroundMs: Number.MAX_SAFE_INTEGER, running: false } }];
    const invalid = ["{", "null", "[]", ...[
      { ...envelope, extra: true }, { ...envelope, revision: true }, { ...envelope, revision: 0 },
      { ...envelope, revision: Number.MAX_SAFE_INTEGER + 1 }, { ...envelope, schemaIdentity: "other" },
      ...[{ timerVersion: 2 }, { schemaVersion: true }, { accumulatedForegroundMs: -1 }, { accumulatedForegroundMs: 1.5 },
        { checkpointRevision: 0 }, { checkpointRevision: "17" }, { running: 1 }, { sessionId: " \n" }, { familyId: null }, { trackId: [] },
        { lastCheckpointAt: "" }, { extra: true }].map(change => ({ ...envelope, payload: { ...payload, ...change } })),
    ].map(value => JSON.stringify(value))];
    const segments = [
      { durableMs: 1234, startedNs: null, nowNs: 9_000_000_000, countdownMs: null }, // cold running marker cannot count closed time
      { durableMs: 1234, startedNs: 0, nowNs: 1_000_999, countdownMs: null },
      { durableMs: 1234, startedNs: 0, nowNs: 9_000_000, countdownMs: 1240 },
      { durableMs: 2000, startedNs: 0, nowNs: 9_000_000, countdownMs: 1240 }, // retain an older valid overrun
      { durableMs: 1234, startedNs: 100, nowNs: 99, countdownMs: null },
      { durableMs: Number.MAX_SAFE_INTEGER, startedNs: 0, nowNs: 1_000_000, countdownMs: null },
    ];
    const profile = { id: "native-clock-test-profile", kind: "guest" as const, accountId: null };
    let physicalKey = "";
    const scoped = createProfileScopedStorage({
      getString(key) { physicalKey = key; return undefined; }, setString() {}, remove() {}, contains() { return false; }, getAllKeys() { return []; },
    }, profile);
    scoped.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
    const keys = [
      { kind: "key", physicalKey, profileId: profile.id },
      { kind: "key", physicalKey, profileId: "other-profile" },
      { kind: "key", physicalKey: STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, profileId: profile.id },
    ];
    scoped.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
    keys.push({ kind: "key", physicalKey, profileId: profile.id });
    const input = [...valid.map(value => ({ kind: "record", raw: JSON.stringify(value) })), ...invalid.map(raw => ({ kind: "record", raw })),
      ...segments.map(value => ({ kind: "segment", ...value })), { kind: "fractional-sequence" }, ...keys];
    const run = spawnSync(binary, [], { input: JSON.stringify(input), encoding: "utf8", timeout: 10_000, maxBuffer: 128 * 1024 });
    assert.equal(run.status, 0, run.error?.message ?? run.stderr);
    const results = JSON.parse(run.stdout) as Array<{ ok: boolean; raw?: string; accumulatedMs?: number; anchorNs?: number | null }>;
    assert.equal(results.length, input.length);
    valid.forEach((value, index) => {
      assert.equal(results[index]!.ok, true);
      const decoded = JSON.parse(results[index]!.raw!);
      assert.deepEqual(decoded, value);
      assert.deepEqual(createForegroundTimerState(decoded.payload), value.payload);
    });
    for (const result of results.slice(valid.length, valid.length + invalid.length)) assert.equal(result.ok, false);
    assert.deepEqual(results.slice(valid.length + invalid.length, valid.length + invalid.length + segments.length), [
      { ok: true, accumulatedMs: 1234, anchorNs: null }, { ok: true, accumulatedMs: 1235, anchorNs: 1_000_000 },
      { ok: true, accumulatedMs: 1240, anchorNs: 6_000_000 }, { ok: true, accumulatedMs: 2000, anchorNs: 0 },
      { ok: false, stage: "contract_rejected" }, { ok: false, stage: "contract_rejected" },
    ]);
    assert.deepEqual(results[valid.length + invalid.length + segments.length], { ok: true, accumulatedMs: Number(10000n * 1003000999n / 1000000n), anchorNs: Number(10000n * 1003000999n / 1000000n * 1000000n) });
    assert.deepEqual(results.slice(-4), [{ ok: true }, { ok: false }, { ok: false }, { ok: false }]);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

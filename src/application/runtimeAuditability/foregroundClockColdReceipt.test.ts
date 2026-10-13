import test from "node:test";
import assert from "node:assert/strict";
import type { ForegroundTimerState, TrainingSession } from "../../domain";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { createForegroundClockColdReceipt } from "./foregroundClockColdReceipt";

const runId = "12345678-1234-4234-8234-123456789abc";
const timer = { sessionId: "session-private", trackId: "track", accumulatedForegroundMs: 900, checkpointRevision: 3, running: true } as ForegroundTimerState;
const session = { id: "session-private", trackId: "track", status: "active", activeForegroundMs: 100, configurationSnapshot: { timer: "elapsedForeground" } } as unknown as TrainingSession;
const identity = [runId, sha256Utf8("profile-private"), sha256Utf8(session.id)] as const;
function context() { return { development: true, smoke: true, runId, captureProfile: () => ({ id: "profile-private", isCurrent: () => true }) }; }

test("disabled gates never inspect profile or create a receipt", () => {
  for (const patch of [{ development: false }, { smoke: false }, { runId: undefined }, { runId: "invalid" }]) {
    let captures = 0;
    const collector = createForegroundClockColdReceipt({ ...context(), ...patch, captureProfile: () => { captures += 1; throw Error("unexpected"); } });
    collector.record(timer, session);
    assert.equal(captures, 0);
    assert.equal(collector.read(...identity), null);
  }
});

test("first snapshot is immutable, allowlisted and fenced to run/profile/session", () => {
  let current = true;
  const collector = createForegroundClockColdReceipt({ ...context(), captureProfile: () => ({ id: "profile-private", isCurrent: () => current }) });
  collector.record(timer, session);
  const receipt = collector.read(...identity)!;
  assert.equal(receipt.durableElapsedMs, 900);
  assert.equal(receipt.sessionElapsedMs, 100);
  assert.equal(Object.isFrozen(receipt), true);
  assert.deepEqual(Object.keys(receipt).sort(), ["protocol", "runId", "profileIdSha256", "sessionIdSha256", "durableElapsedMs", "sessionElapsedMs", "checkpointRevision", "running"].sort());
  assert.equal(JSON.stringify(receipt).includes("private"), false);
  collector.record({ ...timer, accumulatedForegroundMs: 1200 }, session);
  assert.equal(collector.read(...identity), receipt);
  assert.equal(collector.read("other-run", identity[1], identity[2]), null);
  assert.equal(collector.read(runId, "other-profile", identity[2]), null);
  assert.equal(collector.read(runId, identity[1], "other-session"), null);
  current = false;
  assert.equal(collector.read(...identity), null);
});

test("failed observation stays unavailable without throwing or a later replacement", () => {
  const collector = createForegroundClockColdReceipt({ ...context(), captureProfile: () => { throw Error("private failure"); } });
  assert.doesNotThrow(() => collector.record(timer, session));
  collector.record(timer, session);
  assert.equal(collector.read(...identity), null);
  const mismatched = createForegroundClockColdReceipt(context());
  mismatched.record({ ...timer, sessionId: "other" }, session);
  mismatched.record(timer, session);
  assert.equal(mismatched.read(...identity), null);
});

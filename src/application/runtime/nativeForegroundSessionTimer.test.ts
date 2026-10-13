import test from "node:test";
import assert from "node:assert/strict";
import { ForegroundSessionTimer, selectForegroundSessionClock, type NativeForegroundTimerPort } from "./ForegroundSessionTimer";
import { createForegroundTimerState } from "../../domain";

function fixture() {
  let state = createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: "coding_interview", sessionId: "synthetic-session",
    trackId: "coding-interview-dsa-problem-solving", accumulatedForegroundMs: 1000, checkpointRevision: 1, running: true, lastCheckpointAt: "2026-10-13T12:00:00.000Z" });
  const events: string[] = [];
  const port: NativeForegroundTimerPort = {
    readState() { events.push("read"); return state; }, elapsed() { events.push("elapsed"); return 1500; },
    enter() { events.push("enter"); return state; }, checkpoint() { events.push("checkpoint"); return state; }, pause() { events.push("pause"); return state; },
  };
  return { timer: new ForegroundSessionTimer(port), events, update() { state = createForegroundTimerState({ ...state, accumulatedForegroundMs: 2000, checkpointRevision: 2 }); } };
}

test("JS projection refresh reads the native authority without scheduling or writing a checkpoint", async () => {
  const f = fixture();
  assert.equal((await f.timer.checkpointIfDue()).accumulatedForegroundMs, 1000);
  f.update(); // synthetic native checkpoint arrives independently of JS
  assert.equal((await f.timer.checkpointIfDue()).accumulatedForegroundMs, 2000);
  assert.equal(f.timer.getAccumulatedForegroundMs(), 1500);
  assert.deepEqual(f.events, ["read", "read", "elapsed"]);
});

test("AppState reconciliation preserves native run intent while route exit explicitly pauses", async () => {
  const f = fixture();
  await f.timer.leaveForeground("app_background");
  await f.timer.leaveForeground("session_exit");
  assert.deepEqual(f.events, ["checkpoint", "pause"]);
});

test("terminal boundaries pause native work before finalization or completion can capture T", async () => {
  const f = fixture();
  await f.timer.checkpointForDraftSave();
  await f.timer.checkpointForFinalization();
  await f.timer.checkpointForPracticeCompletion();
  await f.timer.checkpointForExpiry();
  assert.deepEqual(f.events, ["checkpoint", "pause", "pause", "pause"]);
});

test("Android selects its existing authority and an absent iOS owner never selects JS", () => {
  const f = fixture();
  const selections: string[] = [];
  const native = () => { selections.push("native"); throw new Error("foreground_clock_native_owner_unavailable"); };
  const android = () => { selections.push("android"); return f.timer; };
  assert.equal(selectForegroundSessionClock("android-js", native, android), f.timer);
  assert.throws(() => selectForegroundSessionClock("ios-native", native, android), /native_owner_unavailable/);
  assert.deepEqual(selections, ["android", "native"]);
});

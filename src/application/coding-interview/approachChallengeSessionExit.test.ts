import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { TrainingApplicationFailure } from "../trainingLifecycle/contracts";

function fixture() {
  const session = { id: "confirmed-acm", status: "active", trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-approach-challenge" };
  let active: typeof session | null = session;
  let current = true, pending: any = null, operation: any = { kind: "feedback" };
  let reconciliation = "verified";
  const calls: string[] = [];
  const finish = () => { active = null; pending = null; return { ...session, status: "abandoned" }; };
  const timer = {
    async leaveForeground() { calls.push("checkpoint"); },
    async retryLeaveForegroundAfterCheckpointFailure() { calls.push("retry_checkpoint"); },
    releaseAfterVerifiedSessionEnd(id: string) { assert.equal(id, session.id); calls.push("release"); },
  };
  const lifecycle = {
    async abandonActiveSession(owner: { sessionId: string; assertCurrent(): void }) { owner.assertCurrent(); assert.equal(owner.sessionId, session.id); calls.push("abandon"); return finish(); },
    async retryExpectedSessionAbandonment(id: string) { assert.equal(id, session.id); calls.push("retry_command"); return finish(); },
    async recoverExpectedSessionAbandonment(id: string) { assert.equal(id, session.id); calls.push("recover_abandonment"); return finish(); },
    async reconcileUncertainMutation() { calls.push("reconcile"); if (reconciliation === "conflict") operation = { kind: "abandonment_recovery_required", error: { allowedAction: "none" } }; return reconciliation; },
    async recoverActiveTrainingOperation() { calls.push("recover_checkpoint"); pending = null; },
    async getExpectedSessionPendingMutation() { return pending; },
    async getPracticeOperationState() { return operation; },
  };
  const dependencies: Record<string, unknown> = {
    "../../content/canonical/approachChallengeProblem": { APPROACH_CHALLENGE_TRACK_ID: session.trackId },
    "../../tracks/coding-interview/domain/algorithmModes": { APPROACH_CHALLENGE_MODE_ID: session.modeId },
    "../learningReadModels": { loadActiveTrainingSession: async () => active },
    "../profileReadFence": { captureProfileReadFence: () => () => { if (!current) throw Error("profile_changed"); } },
    "../trainingLifecycle": { getForegroundSessionTimerFacade: () => timer, TrainingApplicationFailure },
    "../trainingLifecycle/applicationLifecycle": { getTrainingLifecycleUseCases: () => lifecycle },
  };
  const source = ts.transpileModule(readFileSync(new URL("./approachChallengeSessionExit.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} as { endApproachChallengeSession: (id: string, action?: string) => Promise<any>; pauseApproachChallengeSession: (id: string, action?: string) => Promise<any> } };
  vm.runInNewContext(source, { module, exports: module.exports, require: (name: string) => { if (!(name in dependencies)) throw Error(`unexpected_dependency:${name}`); return dependencies[name]; } });
  return { session, timer, lifecycle, calls, end: (action?: string, id = session.id) => module.exports.endApproachChallengeSession(id, action),
    pause: (action?: string, id = session.id) => module.exports.pauseApproachChallengeSession(id, action), active: () => active,
    setActive: (value: typeof active) => { active = value; }, setCurrent: (value: boolean) => { current = value; }, setPending: (value: any) => { pending = value; }, setOperation: (value: any) => { operation = value; }, setReconciliation: (value: string) => { reconciliation = value; } };
}

test("end checkpoints, abandons the confirmed session, and releases its timer only after success", async () => {
  const f = fixture();
  assert.equal((await f.end()).kind, "ended");
  assert.deepEqual(f.calls, ["checkpoint", "abandon", "release"]);
});

test("stale session, mode and profile cannot end another session", async () => {
  for (const change of ["id", "mode", "profile"] as const) {
    const f = fixture();
    if (change === "id") f.setActive({ ...f.session, id: "another-session" });
    if (change === "mode") f.setActive({ ...f.session, modeId: "coding-interview-guided-practice" });
    if (change === "profile") f.setCurrent(false);
    await assert.rejects(f.end());
    assert.deepEqual(f.calls, []);
  }
  const f = fixture();
  f.timer.leaveForeground = async () => { f.calls.push("checkpoint"); f.setCurrent(false); };
  await assert.rejects(f.end(), /profile_changed/);
  assert.deepEqual(f.calls, ["checkpoint"]);
});

test("failed timer checkpoint is retried before any abandonment", async () => {
  const f = fixture();
  f.timer.leaveForeground = async () => { f.calls.push("checkpoint"); throw Error("timer_checkpoint_failed"); };
  assert.equal((await f.end()).nextAction, "retry_checkpoint");
  assert.deepEqual(f.calls, ["checkpoint"]);
  assert.equal((await f.end("retry_checkpoint")).kind, "ended");
  assert.deepEqual(f.calls, ["checkpoint", "retry_checkpoint", "abandon", "release"]);
});

test("pending foreground checkpoint recovers its journal before retrying the timer", async () => {
  const f = fixture();
  f.timer.leaveForeground = async () => { f.calls.push("checkpoint"); f.setPending({ operation: "advance_training_session" }); throw Error("checkpoint_pending"); };
  assert.equal((await f.end()).nextAction, "recover_checkpoint");
  assert.equal((await f.end("recover_checkpoint")).kind, "ended");
  assert.deepEqual(f.calls, ["checkpoint", "recover_checkpoint", "retry_checkpoint", "abandon", "release"]);
});

test("prewrite abandonment retries only its frozen command", async () => {
  const f = fixture();
  f.lifecycle.abandonActiveSession = async () => { f.calls.push("abandon"); f.setOperation({ kind: "abandonment_failed_before_journal", error: { allowedAction: "retry_same_command" } }); throw Error("prewrite_failure"); };
  assert.equal((await f.end()).nextAction, "retry_command");
  assert.equal((await f.end("retry_command")).kind, "ended");
  assert.deepEqual(f.calls, ["checkpoint", "abandon", "retry_command", "release"]);
});

test("pending and unknown abandonments recover without creating a second abandonment", async () => {
  for (const unknown of [false, true]) {
    const f = fixture();
    f.lifecycle.abandonActiveSession = async () => {
      f.calls.push("abandon");
      if (unknown) f.setOperation({ kind: "abandonment_recovery_required", error: { allowedAction: "reconcile" } });
      else f.setPending({ operation: "abandon_training_session" });
      throw Error("unverified_end");
    };
    const action = unknown ? "reconcile_abandonment" : "recover_abandonment";
    assert.equal((await f.end()).nextAction, action);
    assert.equal(f.calls.includes("release"), false);
    if (unknown) {
      f.setReconciliation("unknown");
      assert.equal((await f.end(action)).nextAction, action);
      assert.equal(f.calls.includes("recover_abandonment"), false);
      f.setReconciliation("verified");
    }
    assert.equal((await f.end(action)).kind, "ended");
    assert.equal(f.calls.filter(call => call === "abandon").length, 1);
    assert.equal(f.calls.at(-1), "release");
  }
});

test("unrelated pending saves and irreconcilable ends stay blocked without releasing the timer", async () => {
  for (const pending of [true, false]) {
    const f = fixture();
    f.lifecycle.abandonActiveSession = async () => {
      f.calls.push("abandon");
      if (pending) f.setPending({ operation: "submit_training_outcome" });
      else f.setOperation({ kind: "abandonment_recovery_required", error: { allowedAction: "none" } });
      throw Error("blocked");
    };
    await assert.rejects(f.end(), /blocked/);
    assert.deepEqual(f.calls, ["checkpoint", "abandon"]);
  }
  const f = fixture();
  f.setReconciliation("conflict");
  await assert.rejects(f.end("reconcile_abandonment"), /could not be reconciled/);
  assert.deepEqual(f.calls, ["reconcile"]);
});

test("pause and its checkpoint retries never abandon or release a resumable session", async () => {
  for (const failure of ["none", "checkpoint", "pending"] as const) {
    const f = fixture();
    if (failure !== "none") f.timer.leaveForeground = async () => {
      f.calls.push("checkpoint");
      if (failure === "pending") f.setPending({ operation: "advance_training_session" });
      throw Error("checkpoint_unverified");
    };
    const first = await f.pause();
    if (failure !== "none") {
      assert.equal(first.kind, "not_paused");
      assert.equal(first.nextAction, failure === "pending" ? "recover_checkpoint" : "retry_checkpoint");
      assert.equal((await f.pause(first.nextAction)).kind, "paused");
    } else assert.equal(first.kind, "paused");
    assert.equal(f.active()?.status, "active");
    assert.equal(f.calls.some(call => ["abandon", "retry_command", "recover_abandonment", "reconcile", "release"].includes(call)), false,
      "pause must not reach any terminal-session operation");
  }
});

test("pause rejects stale ownership and an unrelated pending abandonment", async () => {
  for (const change of ["id", "mode", "profile", "during_checkpoint"] as const) {
    const f = fixture();
    if (change === "id") f.setActive({ ...f.session, id: "another-session" });
    if (change === "mode") f.setActive({ ...f.session, modeId: "another-mode" });
    if (change === "profile") f.setCurrent(false);
    if (change === "during_checkpoint") f.timer.leaveForeground = async () => { f.setCurrent(false); };
    await assert.rejects(f.pause());
    assert.deepEqual(f.calls, []);
  }
  const f = fixture();
  f.timer.leaveForeground = async () => { f.setPending({ operation: "abandon_training_session" }); throw Error("other_operation_pending"); };
  await assert.rejects(f.pause(), /other_operation_pending/);
  assert.deepEqual(f.calls, [], "pause never converts an unrelated ending into success");
});

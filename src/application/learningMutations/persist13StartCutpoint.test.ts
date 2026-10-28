import assert from "node:assert/strict";
import test from "node:test";
import { buildTrainingSessionStartJournal, commitTrainingSessionStart } from "./commitTrainingSessionStart";
import { commitMutation } from "./commitMutation";
import { installMemoryStorage, session, timestamp } from "../../testing/journalTestSupport";
import { captureMutationJournalLease, getActiveMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { getAccountSyncState } from "../../storage/repositories/accountDataRepository";
import { getActiveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { productionLearningDataAdmissionContext as context, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { installPersist13StartPauseHook, pausePersist13Start, isPersist13ResetPauseHookCold, type Persist13StartStage } from "../runtimeAuditability/persist13ResetPauseHook";
import { STORAGE_KEYS } from "../../storage/keys";
import { MutationCommitFailure } from "../mutationBoundary";

const runId = "921c535a-011e-42dc-b452-bd6f912eb1a3";
const pre = "before_start_journal_write";
const post = "after_start_journal_durable_before_materialization";
const names = ["EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO", "EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE"];
function authority(stage: Persist13StartStage) {
  Object.defineProperty(globalThis, "__DEV__", { value: true, configurable: true });
  Object.assign(process.env, { EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: "seed", EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID: runId, EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO: "start_cutpoint", EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE: stage });
}
async function setup() {
  const storage = installMemoryStorage();
  setActiveProfileLeaseForTests({ id: runId, kind: "guest", accountId: null });
  await getAccountSyncState(context);
  const input = { session: session(), draft: null, createdAt: timestamp };
  const plan = await buildTrainingSessionStartJournal(input);
  const lease = captureMutationJournalLease()!;
  const binding = { commandFingerprint: plan.commandIdentity.fingerprint, planFingerprint: plan.planFingerprint, lease };
  const snapshot = () => [...storage.getAllKeys()].sort().map(key => [key, storage.getString(key)] as const);
  return { storage, input, plan, lease, binding, snapshot };
}

test("exact start cutpoints use production start commit and canonical journal boundaries", async t => {
  const prior = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const dev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  try {
    for (const stage of [pre, post] as const) await t.test(stage, async () => {
      authority(stage);
      const { input, plan, binding, snapshot } = await setup();
      const before = snapshot(); let calls = 0;
      installPersist13StartPauseHook(binding, stage, async actual => {
        calls++; assert.equal(actual, stage);
        const j = await getActiveMutationJournal(context);
        assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
        if (stage === pre) { assert.equal(j, null); assert.deepEqual(snapshot(), before); }
        else { assert.deepEqual(j, plan); assert.equal(j?.status, "journal_durable");
          const old = new Map(before); const delta = snapshot().filter(([key, value]) => old.get(key) !== value);
          assert.equal(delta.length, 1); assert.match(delta[0]![0]!, /active.*journal/iu);
        }
        throw new Error("exact_start_test_pause");
      });
      await assert.rejects(commitTrainingSessionStart(input), e => e instanceof MutationCommitFailure && e.phase === (stage === pre ? "journal_write" : "materialization") && e.durableState === (stage === pre ? "not_durable" : "journal_durable"));
      assert.equal(calls, 1); assert.equal(isPersist13ResetPauseHookCold(), true);
      await commitTrainingSessionStart(input); // same command may finish only after the one-shot was consumed
      assert.equal(calls, 1);
      assert.equal(await getActiveMutationJournal(context), null);
      assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.id, input.session.id);
    });
    await t.test("failed journal write cannot reach post-durable hook", async () => {
      authority(post); const { storage, input, plan, binding, lease } = await setup(); let calls = 0;
      installPersist13StartPauseHook(binding, post, async () => { calls++; throw Error("cleanup_hook"); });
      storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
      await assert.rejects(commitTrainingSessionStart(input), e => e instanceof MutationCommitFailure && e.phase === "journal_write");
      assert.equal(calls, 0); assert.equal(await getActiveMutationJournal(context), null);
      storage.setFailurePlan(null);
      await assert.rejects(pausePersist13Start(plan, lease, post, () => true)!, /cleanup_hook/u);
      assert.equal(calls, 1);
    });
    await t.test("cold dispatcher is synchronous undefined and no-hook start succeeds", async () => {
      authority(pre); const { input, plan, lease } = await setup();
      assert.equal(pausePersist13Start(plan, lease, pre, () => true), undefined);
      assert.equal(isPersist13ResetPauseHookCold(), true);
      await commitTrainingSessionStart(input);
      assert.equal(await getActiveMutationJournal(context), null);
    });
    await t.test("installation rejects each runtime/scenario/run/profile guard", async () => {
      authority(pre); const { binding } = await setup();
      for (const [key, value] of [[names[0], "regular"], [names[1], "recover"], [names[2], "bad"], [names[3], "journal"], [names[4], post]] as const) {
        authority(pre); process.env[key!] = value;
        assert.throws(() => installPersist13StartPauseHook(binding, pre, async () => { throw Error("unexpected"); }), /authority_invalid/u);
      }
      authority(pre); Object.defineProperty(globalThis, "__DEV__", { value: false, configurable: true });
      assert.throws(() => installPersist13StartPauseHook(binding, pre, async () => { throw Error("unexpected"); }), /authority_invalid/u);
      authority(pre);
      assert.throws(() => installPersist13StartPauseHook({ ...binding, lease: { ...binding.lease, profile: { id: "other", kind: "guest", accountId: null } } }, pre, async () => { throw Error("unexpected"); }), /authority_invalid/u);
    });
    await t.test("other operation/stage/command/plan/profile/generation cannot consume authority; stale runtime fails closed", async () => {
      authority(pre); const { plan, binding, lease } = await setup(); let calls = 0;
      installPersist13StartPauseHook(binding, pre, async () => { calls++; throw Error("consumed"); });
      assert.throws(() => installPersist13StartPauseHook(binding, pre, async () => { throw Error("unexpected"); }), /already_installed/u);
      assert.equal(pausePersist13Start({ ...plan, sessionId: inputSessionId(plan), operation: "advance_training_session" }, lease, pre, () => true), undefined);
      assert.equal(pausePersist13Start(plan, lease, post, () => true), undefined);
      assert.equal(pausePersist13Start({ ...plan, commandIdentity: { version: 1, fingerprint: "a".repeat(64) } }, lease, pre, () => true), undefined);
      assert.equal(pausePersist13Start({ ...plan, planFingerprint: "a".repeat(64) }, lease, pre, () => true), undefined);
      assert.equal(pausePersist13Start(plan, { ...lease, generation: lease.generation + 1 }, pre, () => true), undefined);
      assert.equal(pausePersist13Start(plan, { ...lease, profile: { ...lease.profile, id: "foreign" } }, pre, () => true), undefined);
      assert.throws(() => pausePersist13Start(plan, lease, pre, () => false), /authority_changed/u);
      process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = "e0817d24-f02e-4355-af5c-65e7953f1657";
      await assert.rejects(commitMutation(plan, lease), e => e instanceof MutationCommitFailure && e.durableState === "not_durable");
      assert.equal(await getActiveMutationJournal(context), null); assert.equal(calls, 0);
      authority(pre);
      await assert.rejects(pausePersist13Start(plan, lease, pre, () => true)!, /consumed/u);
      assert.equal(calls, 1); assert.equal(isPersist13ResetPauseHookCold(), true);
      assert.equal(pausePersist13Start(plan, lease, pre, () => true), undefined);
    });
  } finally {
    if (dev) Object.defineProperty(globalThis, "__DEV__", dev); else Reflect.deleteProperty(globalThis, "__DEV__");
    for (const [name, value] of Object.entries(prior)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
});

function inputSessionId(plan: Awaited<ReturnType<typeof buildTrainingSessionStartJournal>>): string { return "sessionId" in plan ? plan.sessionId : "session-1"; }

import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { performance } from "node:perf_hooks";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getForegroundSessionTimerFacade, TrainingApplicationFailure } from "../trainingLifecycle";
import { getActiveTrainingSession, getTrainingAttempts, getActiveMutationJournal, getActiveForegroundTimer } from "../../storage/repositories";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { initializeStorageMetadata } from "../../storage/repositories/storageMetadataRepository";
import { productionTrackAdmissionContext as admission, productionLearningDataAdmissionContext as learningAdmission } from "../tracks/trackAdmissionContext";
import { STORAGE_KEYS } from "../../storage/keys";
import { withLocalLearningWriteOperation } from "../learningMutations/localLearningWriteOperation";
import { commitTrainingSessionAdvance } from "../learningMutations/commitTrainingSessionAdvance";
import { createAttemptId } from "../identity/trainingIdentity";
import { startAlgorithmsSession, submitAlgorithmsPracticeResponse, submitAlgorithmsPracticeInteractionResponse, getAlgorithmsPracticeProjection, abandonAlgorithmsSession, advanceAlgorithmsPracticeSession } from "./codingInterviewSessionFacade";
import { provisionGuestInstallation, bindGuestInstallationToAccount } from "../../storage/repositories/guestInstallationRepository";
import { getAccountSyncState, saveAccountSyncState } from "../../storage/repositories/accountDataRepository";
import { retryPendingAccountDataSync } from "../account/accountDataService";
import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { allowsPracticeResponseEditing, getPracticePrimaryAction } from "../../features/practice/practiceSessionPresentation";

const PROFILE = { id: "quiz-submit-isolated-profile", kind: "guest" as const, accountId: null };
const RESPONSE = { kind: "choice" as const, selectedOptionIds: ["sequence_average"] };
const CANONICAL = { type: "choice_single", optionId: "sequence_average" };

/** Faults model the real codec's write/readback boundary, not native MMKV behavior. */
class ProbeStorage extends MemoryKeyValueStorage {
  fault: "none" | "journal_unknown" | "timer_readback" = "none";
  blocked: string | null = null;
  journalPlans: Record<string, any>[] = [];
  override getString(key: string): string | undefined {
    if (this.blocked === key) throw Error("isolated_readback_unavailable");
    return super.getString(key);
  }
  override setString(key: string, value: string): void {
    if (key === STORAGE_KEYS.ACTIVE_JOURNAL) this.journalPlans.push(JSON.parse(value).payload);
    super.setString(key, value);
    if (this.fault === "journal_unknown" && key === STORAGE_KEYS.ACTIVE_JOURNAL) {
      this.blocked = key;
      throw Error("isolated_write_then_readback_unavailable");
    }
    if (this.fault === "timer_readback" && key === STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER) this.blocked = key;
  }
  clearFault() { this.fault = "none"; this.blocked = null; this.setFailurePlan(null); }
}

let sequence = 0;
const pause = () => new Promise<void>(resolve => setTimeout(resolve, 5));
async function bounded<T>(operation: Promise<T>, stage: string): Promise<T> {
  let handle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => { handle = setTimeout(() => reject(Error(stage)), 5_000); })]);
  } finally { clearTimeout(handle); }
}
async function fixture(t: TestContext) {
  const storage = new ProbeStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE);
  initializeStorageMetadata();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const dependencies = { sessionIds: { create: async () => `quiz-submit-${++sequence}` }, premiumSessionAdmission: { authorize: async () => "allowed" as const } };
  const lifecycle = composeTrainingLifecycleUseCases(dependencies);
  const { session } = await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10 });
  assert.equal(session.itemOrder[0]?.item.questionId, "alg-complexity-amortized-001");
  const timer = getForegroundSessionTimerFacade();
  t.after(() => timer.runLocalLearningReset(async () => {}));
  await timer.enterForeground(session);
  await pause();
  storage.resetCounters(); storage.journalPlans = [];
  return { storage, lifecycle, timer, session, dependencies };
}
function operations(storage: MemoryKeyValueStorage) {
  const count = (kind: string, key?: string) => storage.operations.filter(op => op.kind === kind && (key === undefined || op.key === key)).length;
  return { reads: count("read"), writes: count("write"), removes: count("remove"), journalWrites: count("write", STORAGE_KEYS.ACTIVE_JOURNAL), journalClears: count("remove", STORAGE_KEYS.ACTIVE_JOURNAL), timerWrites: count("write", STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER) };
}
async function accepted() {
  const projection = await getAlgorithmsPracticeProjection();
  assert.equal(projection.operation.kind, "feedback");
  assert.equal(projection.feedback?.correctness, "correct");
  assert.equal(projection.response?.source, "materialized");
  assert.equal((await getTrainingAttempts(admission)).value.length, 1);
  assert.equal(getActiveMutationJournal(learningAdmission), null);
  return (await getActiveTrainingSession(admission))!;
}

test("production Learn Approach saves durable time and answer in one journal before feedback", async t => {
  const f = await fixture(t);
  const revisions = (f.timer as unknown as { synchronizedTimerRevisions: Map<string, number> }).synchronizedTimerRevisions;
  const beforeRevision = revisions.get(f.session.id);
  const started = performance.now();
  await submitAlgorithmsPracticeResponse(RESPONSE);
  const submitMs = performance.now() - started;
  const counts = operations(f.storage);
  assert.equal(counts.journalWrites, 3);
  assert.equal(counts.journalClears, 1);
  assert.equal(counts.timerWrites, 1);
  assert.deepEqual([...new Set(f.storage.journalPlans.map(plan => plan.operation))], ["submit_training_outcome"]);
  const current = await accepted();
  const durableT = await getActiveForegroundTimer(admission);
  assert.ok(current.activeForegroundMs > 0);
  assert.equal(current.activeForegroundMs, durableT?.accumulatedForegroundMs);
  assert.equal(revisions.get(f.session.id), beforeRevision, "answer ACK does not claim a synchronized clock revision");
  if (process.env.PATTERNLY_QUIZ_SAVE_MEASURE === "1") console.log(JSON.stringify({ scope: "host_memory_only", submitMs, ...counts }));
});

test("opaque completeness remains pre-checkpoint; a complete opaque answer uses one journal", async t => {
  const f = await fixture(t);
  await assert.rejects(submitAlgorithmsPracticeInteractionResponse({ type: "choice_single", optionId: "missing" }), /incomplete or invalid/u);
  assert.equal(operations(f.storage).timerWrites, 0);
  assert.equal(operations(f.storage).journalWrites, 0);
  await submitAlgorithmsPracticeInteractionResponse(CANONICAL);
  assert.equal(operations(f.storage).journalClears, 1);
  await accepted();
});

for (const [name, response] of [["adapter", { kind: "ordering", orderedSubgoalIds: [] }], ["family", { kind: "choice", selectedOptionIds: ["missing"] }]] as const) {
  test(`${name} rejection persists time only before returning the validation error`, async t => {
    const f = await fixture(t);
    await assert.rejects(submitAlgorithmsPracticeResponse(response as never), error => error instanceof TrainingApplicationFailure && error.code === "invalid_response");
    assert.equal(operations(f.storage).journalClears, 1);
    assert.deepEqual([...new Set(f.storage.journalPlans.map(plan => plan.operation))], ["advance_training_session"]);
    assert.ok((await getActiveTrainingSession(admission))!.activeForegroundMs > 0);
    assert.equal((await getTrainingAttempts(admission)).value.length, 0);
    assert.equal((await getAlgorithmsPracticeProjection()).operation.kind, "unanswered");
  });
}

test("failed time-only rejection reports persistence failure and creates no answer", async t => {
  const f = await fixture(t);
  f.storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  await assert.rejects(submitAlgorithmsPracticeResponse({ kind: "ordering", orderedSubgoalIds: [] }));
  f.storage.clearFault();
  assert.equal((await getTrainingAttempts(admission)).value.length, 0);
  assert.equal((await f.lifecycle.getPracticeOperationState(f.session, false)).kind, "recovery_required");
  assert.equal(getActiveMutationJournal(learningAdmission), null);
  assert.equal((await getActiveTrainingSession(admission))!.activeForegroundMs, f.session.activeForegroundMs);
});

for (const fault of ["write", "readback"] as const) test(`durable T ${fault} failure never starts an answer or time-only journal`, async t => {
  const f = await fixture(t);
  if (fault === "write") f.storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER });
  else f.storage.fault = "timer_readback";
  await assert.rejects(submitAlgorithmsPracticeResponse(RESPONSE));
  f.storage.clearFault();
  assert.equal(operations(f.storage).journalWrites, 0);
  assert.equal((await getTrainingAttempts(admission)).value.length, 0);
  assert.equal((await getActiveTrainingSession(admission))!.activeForegroundMs, f.session.activeForegroundMs);
});

for (const reject of [false, true]) test(`unknown ${reject ? "time-only" : "answer"} journal outcome reconciles the original plan without fallback`, async t => {
  const f = await fixture(t);
  const revisions = (f.timer as unknown as { synchronizedTimerRevisions: Map<string, number> }).synchronizedTimerRevisions;
  const beforeRevision = revisions.get(f.session.id);
  f.storage.fault = "journal_unknown";
  await assert.rejects(submitAlgorithmsPracticeResponse(reject ? { kind: "ordering", orderedSubgoalIds: [] } : RESPONSE));
  assert.deepEqual([...new Set(f.storage.journalPlans.map(plan => plan.operation))], [reject ? "advance_training_session" : "submit_training_outcome"]);
  f.storage.clearFault();
  assert.equal(revisions.get(f.session.id), beforeRevision, "unknown outcome cannot acknowledge a clock revision");
  const pending = getActiveMutationJournal(learningAdmission)!;
  const expectedTime = pending.writes.find(write => write.kind === "put_session")!.record.activeForegroundMs;
  await f.lifecycle.recoverActiveTrainingOperation();
  assert.equal(getActiveMutationJournal(learningAdmission), null);
  assert.equal((await getTrainingAttempts(admission)).value.length, reject ? 0 : 1);
  assert.equal((await getActiveTrainingSession(admission))!.activeForegroundMs, expectedTime);
  await f.lifecycle.recoverActiveTrainingOperation();
  assert.equal((await getTrainingAttempts(admission)).value.length, reject ? 0 : 1);
});

for (const phase of ["materialization", "clear"] as const) test(`${phase} failure recovers the same answer and time exactly once`, async t => {
  const f = await fixture(t);
  const id = await createAttemptId(f.session.id, f.session.itemOrder[0]!.occurrenceId, CANONICAL);
  f.storage.setFailurePlan(phase === "clear" ? { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL } : { kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(id) });
  await assert.rejects(submitAlgorithmsPracticeResponse(RESPONSE));
  f.storage.clearFault();
  const pending = getActiveMutationJournal(learningAdmission)!;
  assert.equal(pending.operation, "submit_training_outcome");
  const time = pending.writes.find(write => write.kind === "put_session")!.record.activeForegroundMs;
  assert.notEqual((await getAlgorithmsPracticeProjection()).operation.kind, "feedback");
  await f.lifecycle.recoverActiveTrainingOperation();
  assert.equal((await accepted()).activeForegroundMs, time);
  await f.lifecycle.recoverActiveTrainingOperation();
  assert.equal((await getTrainingAttempts(admission)).value.length, 1);
});

test("prewrite retry retains the exact answer and checkpoint, without capturing T again", async t => {
  const f = await fixture(t);
  f.storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 3 });
  await assert.rejects(submitAlgorithmsPracticeResponse(RESPONSE));
  f.storage.clearFault();
  const state = await f.lifecycle.getPracticeOperationState(f.session, false);
  assert.equal("error" in state ? state.error.allowedAction : null, "retry_same_command");
  const time = (await getActiveForegroundTimer(admission))!.accumulatedForegroundMs;
  f.storage.resetCounters();
  await f.lifecycle.retryPracticeSubmission();
  assert.equal(operations(f.storage).timerWrites, 0);
  assert.equal((await accepted()).activeForegroundMs, time);
  await assert.rejects(f.lifecycle.retryPracticeSubmission());
});

test("fresh compositions recover the journal's answer and time without the transient handoff", async t => {
  const f = await fixture(t);
  f.storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  await assert.rejects(submitAlgorithmsPracticeResponse(RESPONSE));
  f.storage.clearFault();
  const pending = getActiveMutationJournal(learningAdmission)!;
  const time = pending.writes.find(write => write.kind === "put_session")!.record.activeForegroundMs;
  const originalAttempt = (await getTrainingAttempts(admission)).value[0]!;
  const attemptBytes = f.storage.snapshot().get(STORAGE_KEYS.trainingAttempt(originalAttempt.id));
  await f.timer.runLocalLearningReset(async () => {});
  for (let boot = 0; boot < 2; boot++) {
    const fresh = composeTrainingLifecycleUseCases(f.dependencies);
    const timer = getForegroundSessionTimerFacade();
    const before = f.storage.snapshot();
    await fresh.recoverActiveTrainingOperation();
    assert.equal((await accepted()).activeForegroundMs, time);
    const projection = await getAlgorithmsPracticeProjection();
    assert.equal(allowsPracticeResponseEditing(projection.operation.kind), false);
    assert.equal(getPracticePrimaryAction({ feedbackTiming: "afterEachAnswer", hasLocalResponse: true, isFinalPosition: false, phase: projection.operation.kind })?.label, "Next");
    assert.equal(f.storage.snapshot().get(STORAGE_KEYS.trainingAttempt(originalAttempt.id)), attemptBytes);
    if (boot === 1) assert.deepEqual(f.storage.snapshot(), before, "recovery without a pending journal is read-only");
    await timer.runLocalLearningReset(async () => {});
  }
  f.storage.resetCounters();
  await advanceAlgorithmsPracticeSession();
  const next = await getAlgorithmsPracticeProjection();
  assert.equal(next.position.current, 2);
  assert.equal(next.operation.kind, "unanswered");
  assert.equal(next.response, null);
  assert.equal((await getTrainingAttempts(admission)).value.length, 1);
  assert.equal(f.storage.snapshot().get(STORAGE_KEYS.trainingAttempt(originalAttempt.id)), attemptBytes);
  assert.ok((await getActiveTrainingSession(admission))!.activeForegroundMs >= time);
});

test("the facade freezes the original response before its first await", async t => {
  await fixture(t);
  const response = { kind: "choice" as const, selectedOptionIds: ["sequence_average"] };
  const submit = submitAlgorithmsPracticeResponse(response);
  response.selectedOptionIds[0] = "missing";
  await submit;
  await accepted();
});

test("profile change during the facade's first await rejects before any checkpoint", async t => {
  const f = await fixture(t);
  const submit = submitAlgorithmsPracticeResponse(RESPONSE);
  setActiveProfileLeaseForTests({ ...PROFILE, id: "replacement-profile" });
  await assert.rejects(submit, /original profile/u);
  assert.equal(operations(f.storage).timerWrites, 0);
  assert.equal(operations(f.storage).journalWrites, 0);
});

test("the original lease survives timer-lane release and is rechecked in the local-write lane", async t => {
  const f = await fixture(t);
  const checkpoint = await f.timer.capturePracticeResponseCheckpoint(f.session, f.lifecycle.capturePracticeProfileLease());
  let release!: () => void;
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  const hold = withLocalLearningWriteOperation(async () => { started(); await new Promise<void>(resolve => { release = resolve; }); });
  await ready;
  f.storage.resetCounters();
  const submit = f.lifecycle.submitPracticeResponse(CANONICAL, checkpoint);
  let settled = false;
  void submit.then(() => { settled = true; }, () => { settled = true; });
  const rejected = assert.rejects(submit);
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(settled, false, "the actual commit is waiting on the held local-write lane");
  setActiveProfileLeaseForTests({ ...PROFILE, id: "away" });
  setActiveProfileLeaseForTests(PROFILE);
  release(); await hold; await rejected;
  assert.equal(operations(f.storage).journalWrites, 0);
  assert.equal((await getTrainingAttempts(admission)).value.length, 0);
});

test("a captured occurrence cannot submit after another durable position transition", async t => {
  const f = await fixture(t);
  const checkpoint = await f.timer.capturePracticeResponseCheckpoint(f.session, f.lifecycle.capturePracticeProfileLease());
  await commitTrainingSessionAdvance({ ...f.session, currentItemIndex: 1 }, new Date().toISOString());
  f.storage.resetCounters();
  await assert.rejects(f.lifecycle.submitPracticeResponse(CANONICAL, checkpoint), /occurrence/u);
  assert.equal(operations(f.storage).journalWrites, 0);
});

test("a background checkpoint between capture and submit never rolls S backward", async t => {
  const f = await fixture(t);
  const checkpoint = await f.timer.capturePracticeResponseCheckpoint(f.session, f.lifecycle.capturePracticeProfileLease());
  await pause(); await f.timer.leaveForeground(f.session, "app_background");
  const newer = (await getActiveTrainingSession(admission))!.activeForegroundMs;
  assert.ok(newer >= checkpoint.cumulativeT);
  f.storage.resetCounters();
  await f.lifecycle.submitPracticeResponse(CANONICAL, checkpoint);
  assert.equal((await accepted()).activeForegroundMs, newer);
  assert.equal(operations(f.storage).journalClears, 1);
});

test("concurrent facade submissions cannot apply the occurrence twice", async t => {
  const f = await fixture(t);
  const results = await Promise.allSettled([submitAlgorithmsPracticeResponse(RESPONSE), submitAlgorithmsPracticeResponse(RESPONSE)]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  await accepted();
  assert.equal(operations(f.storage).journalClears, 1);
});

test("a cold timer owner folds already durable T into the answer without a restore journal", async t => {
  const f = await fixture(t);
  await f.timer.capturePracticeResponseCheckpoint(f.session, f.lifecycle.capturePracticeProfileLease());
  await f.timer.runLocalLearningReset(async () => {});
  composeTrainingLifecycleUseCases(f.dependencies);
  const fresh = getForegroundSessionTimerFacade();
  t.after(() => fresh.runLocalLearningReset(async () => {}));
  f.storage.resetCounters(); f.storage.journalPlans = [];
  await submitAlgorithmsPracticeResponse(RESPONSE);
  assert.equal(operations(f.storage).journalClears, 1);
  assert.deepEqual([...new Set(f.storage.journalPlans.map(plan => plan.operation))], ["submit_training_outcome"]);
  await accepted();
});

for (const phase of ["upload", "download"] as const) test(`production submit and feedback finish while account ${phase} remains held`, async t => {
  const f = await fixture(t);
  const accountId = "55555555-5555-4555-8555-555555555555";
  await provisionGuestInstallation({ create: async () => ({ installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }) });
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(learningAdmission), accountId, status: "synced" }, learningAdmission);
  await submitAlgorithmsPracticeResponse(RESPONSE);
  await f.timer.leaveForeground((await getActiveTrainingSession(admission))!);
  await abandonAlgorithmsSession();
  let release!: () => void;
  let notify!: () => void;
  const ready = new Promise<void>(resolve => { notify = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  let released = false;
  const wait = async () => { notify(); await gate; throw Error("isolated_network_held_then_failed"); };
  const client = {
    async syncProgress(input: Parameters<PatternlyApiClient["syncProgress"]>[0]) {
      if (phase === "upload") return wait();
      return { accountRevision: 1, applied: input.mutations.map(mutation => ({ kind: mutation.kind, recordType: mutation.recordType, trackId: mutation.trackId, targetId: mutation.targetId, state: mutation.state, fingerprint: mutation.fingerprint, version: (mutation.expectedVersion ?? 0) + 1, lastMutationId: mutation.mutationId, updatedAt: new Date().toISOString() })), duplicates: [], conflicts: [] };
    },
    async getProgress() { return wait(); },
  } as unknown as PatternlyApiClient;
  const network = retryPendingAccountDataSync(client, accountId);
  let submit: Promise<void> | null = null;
  try {
    await bounded(ready, "account_network_did_not_enter_the_held_stage");
    const { session } = await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10 });
    await f.timer.enterForeground(session); await pause();
    f.storage.resetCounters();
    const question = (await loadCanonicalRuntimeCatalog()).getTrack(session.trackId).getQuestion(session.itemOrder[0]!.item.questionId)!;
    submit = submitAlgorithmsPracticeInteractionResponse(question.answer);
    await bounded(submit, "local_answer_waited_for_held_account_network");
    const projection = await getAlgorithmsPracticeProjection();
    assert.equal(projection.operation.kind, "feedback");
    assert.equal(projection.response?.source, "materialized");
    assert.equal((await getTrainingAttempts(admission)).value.filter(attempt => attempt.sessionId === session.id).length, 1);
    assert.equal(getActiveMutationJournal(learningAdmission), null);
    assert.equal(operations(f.storage).journalClears, 1);
    assert.equal(released, false, "the local ACK and feedback do not depend on releasing network work");
  } finally { released = true; release(); await network; await submit?.catch(() => {}); }
});

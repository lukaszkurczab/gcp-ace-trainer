import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  createFamilyEnvelope,
  createTrainingSession,
  createTrainingSessionResult,
  type TrainingSession,
} from "../../domain";
import {
  TrainingApplicationFailure,
  TrainingLifecycleUseCases,
  type PendingMutationProjection,
  type PreparedSession,
  type TrainingFamilyRuntime,
  type TrainingLifecyclePorts,
} from "./";
import { MutationCommitFailure } from "../mutationBoundary";
import { canonicalFingerprintPayload } from "../../infrastructure/identity/canonicalSerialization";

function testPackage(trackId: string) {
  return {
    familyId: "coding_interview", packagePin: TEST_CONTENT_PACKAGE_PIN, trackId, freeNodeId: "test-node",
    contentVersion: "v1", taxonomyVersion: "test-taxonomy", minimumAppVersion: "0.1.0",
    catalog: { itemIds: ["one", "two"], items: [], assets: [] },
    profile: { profileId: "test", profileVersion: "1", primaryEntry: { modeId: "practice", requestedLength: 2 }, modes: [], configurations: [] },
  } as never;
}

function session(status: "active" | "completed" | "abandoned" = "active", id = "session-1"): TrainingSession {
  return identifySession(createTrainingSession({ id, trackId: "test-track", modeId: "practice", configurationSnapshot: { kind: "test" }, requestedLength: 2, actualLength: 2, currentItemIndex: status === "completed" ? 1 : 0, itemOrder: ["one", "two"].map((itemId, index) => ({ occurrenceId: `occurrence-${index}`, item: { trackId: "test-track", itemId, contentVersion: "v1" , packagePin: TEST_CONTENT_PACKAGE_PIN} })), optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v1", packagePin: TEST_CONTENT_PACKAGE_PIN, status, startedAt: "2026-07-16T12:00:00.000Z", ...(status === "completed" ? { completedAt: "2026-07-16T12:01:00.000Z" } : {}) }));
}

function identifySession(value: TrainingSession): TrainingSession {
  const withoutIdentity = createTrainingSession({ ...value, taxonomyVersion: undefined, planFingerprint: undefined });
  const identified = { ...withoutIdentity, taxonomyVersion: "test-taxonomy" };
  const planFingerprint = createHash("sha256").update(canonicalFingerprintPayload({
    trackId: identified.trackId,
    modeId: identified.modeId,
    contentVersion: identified.contentVersion,
    packagePin: identified.packagePin,
    taxonomyVersion: identified.taxonomyVersion,
    configurationSnapshot: identified.configurationSnapshot,
    itemOrder: identified.itemOrder,
    optionOrderByOccurrence: identified.optionOrderByOccurrence,
    conditionalReinsertSlots: identified.conditionalReinsertSlots ?? [],
  }), "utf8").digest("hex");
  return createTrainingSession({ ...identified, planFingerprint });
}

function fixture() {
  const calls: string[] = [];
  let active: TrainingSession | null = null;
  let dashboardActiveSession: TrainingSession | null = null;
  let pending: PendingMutationProjection | null = null;
  let persisted: TrainingSession | null = null;
  let result = null as ReturnType<typeof createTrainingSessionResult> | null;
  let attempts: readonly import("../../domain").TrainingAttempt<unknown>[] = [];
  let preparedRequest: unknown = null;
  const runtime: TrainingFamilyRuntime = {
    familyId: "coding_interview",
    async prepare(input) { calls.push(`prepare:${input.trackId}:${input.modeId}`); preparedRequest = input.request; const value = session("active", (input.request as { sessionId: string }).sessionId); return { session: value, firstOccurrence: value.itemOrder[0]!.item, draft: null }; },
    async validateResume() { calls.push("resume"); },
    async submitPractice(input) { const occurrence = input.session.itemOrder[input.session.currentItemIndex]!; calls.push(`submit:${String(input.response)}`); return { attempt: { id: `attempt-${input.session.currentItemIndex + 1}`, sessionId: input.session.id, trackId: input.session.trackId, modeId: input.session.modeId, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: { value: input.response }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [] }, answeredAt: "2026-07-16T12:00:01.000Z", committedAt: "2026-07-16T12:00:01.000Z" }, session: input.session, reviewMutations: [] }; },
    async finalizePractice(input) { calls.push("finalize-practice"); const completed = createTrainingSession({ ...input.session, status: "completed", currentItemIndex: 1, completedAt: "2026-07-16T12:01:00.000Z" }); return { session: completed, result: createTrainingSessionResult({ id: "result-1", sessionId: completed.id, trackId: completed.trackId, totalOccurrences: 2, answeredOccurrenceIds: ["occurrence-0", "occurrence-1"], unansweredOccurrenceIds: [], completedAt: completed.completedAt!, evidence: createFamilyEnvelope({ familyId: "test-family", details: {} }) }) }; },
    async finalizeSimulation(input) { calls.push("finalize"); const completed = createTrainingSession({ ...input.session, status: "completed", currentItemIndex: 1, completedAt: "2026-07-16T12:01:00.000Z" }); return { session: completed, result: createTrainingSessionResult({ id: "result-1", sessionId: completed.id, trackId: completed.trackId, totalOccurrences: 2, answeredOccurrenceIds: [], unansweredOccurrenceIds: ["occurrence-0", "occurrence-1"], completedAt: completed.completedAt!, evidence: createFamilyEnvelope({ familyId: "test-family", details: {} }) }), attempts: [], reviewMutations: [], frozenDraft: input.draft }; },
    async validateDraftCommand() { calls.push("validate-draft"); },
    async queryDashboard(input) { calls.push("dashboard"); dashboardActiveSession = input.activeSession; return { kind: "dashboard" }; },
    async queryProgress() { calls.push("progress"); return { kind: "progress" }; },
    async queryReview() { calls.push("review"); return { kind: "review" }; },
  };
  const prepared: PreparedSession = { session: session(), firstOccurrence: session().itemOrder[0]!.item, draft: null };
  const ports: TrainingLifecyclePorts = {
    clock: { now: () => "2026-07-16T12:00:00.000Z" },
    sessionIds: { async create({ trackId, modeId }) { return `${trackId}:${modeId}:00000000-0000-4000-8000-000000000001`; } },
    tracks: { getTrackRegistration(trackId) { if (trackId !== "test-track") throw new Error("unknown"); return { id: trackId, familyId: "coding_interview" }; } },
    packages: {
      async resolveForPreparation({ trackId, modeId }) { calls.push(`content:${trackId}:${modeId}`); calls.push("resolve:coding_interview"); return { runtime, package: testPackage(trackId) }; },
      async resolveExact() { calls.push("content-resume"); return { runtime, package: testPackage("test-track") }; },
      async resolveForDiscovery(trackId) { calls.push("resolve:coding_interview"); return { runtime, package: testPackage(trackId) }; },
    },
    repositories: {
      async getActiveSession() { calls.push("get-active"); return active; }, async getSession(id) { calls.push(`get-session:${id}`); return persisted; }, async getHistory() { calls.push("history"); return [session("completed"), session("abandoned")]; }, async getAttempts() { calls.push("attempts"); return attempts; }, async getReviews() { calls.push("reviews"); return []; }, async getDraft() { calls.push("draft"); return null; }, async getResult() { calls.push("result"); return result; }, async saveDraft() { calls.push("save-draft"); }, async getPendingMutation() { calls.push("pending"); return pending; },
    },
    mutations: {
      async start(input) { calls.push("start"); persisted = input.session; active = input.session; }, async submitPractice() { calls.push("commit-submit"); }, async advance(value) { calls.push("advance"); active = value; persisted = value; }, async completeWithResult(value) { calls.push("complete-with-result"); persisted = value.session; result = value.result; active = null; }, async finalize(input) { calls.push("commit-finalize"); persisted = input.session; result = input.result; active = null; }, async abandon(value) { calls.push("abandon"); persisted = value; active = null; }, async recover() { calls.push("recover"); pending = null; }, async reset() { calls.push("reset"); },
    },
  };
  return { calls, dashboardActiveSession: () => dashboardActiveSession, ports, prepared, preparedRequest: () => preparedRequest, setActive(value: TrainingSession | null) { active = value; }, setAttempts(value: typeof attempts) { attempts = value; }, setPending(value: PendingMutationProjection | null) { pending = value; }, setPersisted(value: TrainingSession | null) { persisted = value; }, setResult(value: typeof result) { result = value; }, useCases: new TrainingLifecycleUseCases(ports) };
}

test("start resolves the exact family and exposes its first item only after active-session verification", async () => {
  const f = fixture(); const started = await f.useCases.startSession({ trackId: "test-track", modeId: "practice", request: { sessionId: "caller-must-not-own-this" } });
  assert.equal(started.firstOccurrence.itemId, "one");
  assert.deepEqual(f.preparedRequest(), { sessionId: "test-track:practice:00000000-0000-4000-8000-000000000001" });
  assert.deepEqual(f.calls.slice(0, 8), ["get-active", "content:test-track:practice", "resolve:coding_interview", "attempts", "reviews", "prepare:test-track:practice", "start", "get-active"]);
});

test("start fails explicitly when the session identity authority fails", async () => {
  const f = fixture();
  f.ports.sessionIds.create = async () => { throw new Error("uuid unavailable"); };
  await assert.rejects(
    () => f.useCases.startSession({ trackId: "test-track", modeId: "practice", request: {} }),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "persistence_failure",
  );
  assert.equal(f.calls.some((call) => call.startsWith("prepare:") || call === "start"), false);
});

test("one active session and unknown identifiers fail explicitly without a substitute", async () => {
  const f = fixture(); f.setActive(session());
  await assert.rejects(() => f.useCases.startSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "active_session_conflict");
  await assert.rejects(() => f.useCases.prepareSession({ trackId: "missing", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_track");
});

test("missing track content blocks preparation and start without selecting another track or mutating a session", async () => {
  const f = fixture();
  f.ports.packages.resolveForPreparation = async () => { throw new Error("missing_artifact"); };
  await assert.rejects(() => f.useCases.prepareSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "missing_content");
  await assert.rejects(() => f.useCases.startSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "missing_content");
  assert.equal(f.calls.some((call) => call.startsWith("prepare:") || call === "start"), false);
});

test("a prepared or active session with a mismatched artifact identity is never persisted or resumed", async () => {
  const prepared = fixture();
  prepared.ports.packages.resolveForPreparation = async () => { throw new Error("plan fingerprint mismatch"); };
  await assert.rejects(() => prepared.useCases.startSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "missing_content");
  assert.equal(prepared.calls.includes("start"), false);
  const active = fixture(); active.setActive(session());
  active.ports.packages.resolveExact = async () => { throw new Error("content version mismatch"); };
  await assert.rejects(() => active.useCases.resumeActiveSession(), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable");
  assert.equal(active.calls.includes("resume"), false);
});

test("runtime resolution rejects an unknown or mismatched family without substituting another runtime", async () => {
  const missing = fixture();
  missing.ports.packages.resolveForPreparation = async () => { throw new Error("missing family"); };
  await assert.rejects(() => missing.useCases.prepareSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "missing_content");
  const mismatched = fixture();
  const original = mismatched.ports.packages.resolveForPreparation.bind(mismatched.ports.packages);
  mismatched.ports.packages.resolveForPreparation = async (input) => { const value = await original(input); return { ...value, runtime: { ...value.runtime, familyId: "certification" } }; };
  await assert.rejects(() => mismatched.useCases.prepareSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_family");
});

test("practice response is handed to the family runtime and only its deterministic outcome reaches the coordinator", async () => {
  const f = fixture(); f.setActive(session()); await f.useCases.submitPracticeResponse({ selected: "a" });
  assert.deepEqual(f.calls, ["get-active", "content-resume", "get-active", "content-resume", "pending", "content-resume", "attempts", "reviews", "submit:[object Object]", "commit-submit"]);
});

test("submitting the final practice occurrence materializes feedback without completing the session", async () => {
  const f = fixture();
  const finalActive = identifySession(createTrainingSession({
    ...session(),
    currentItemIndex: 1,
    configurationSnapshot: { ...session().configurationSnapshot, submission: "perItem" },
  }));
  f.setActive(finalActive);

  await f.useCases.submitPracticeResponse({ selected: "a" });

  assert.equal(f.calls.filter((call) => call === "commit-submit").length, 1);
  assert.equal(f.calls.filter((call) => call === "complete-with-result").length, 0);
  assert.equal((await f.ports.repositories.getActiveSession())?.id, finalActive.id);
  assert.equal(await f.ports.repositories.getResult(finalActive.id), null);
  assert.equal(f.useCases.getOperationProjection(finalActive.id)?.kind, "feedback");
});

test("a non-submit durable journal requires recovery before practice can accept another answer", async () => {
  const f = fixture(); const active = session(); f.setActive(active);
  f.setPending({ operation: "start_training_session", status: "verified_pending_clear", sessionId: active.id, trackId: active.trackId, commandFingerprint: "journal-1", planFingerprint: "plan-1" });

  const blocked = await f.useCases.getPracticeOperationState(active, false);
  assert.equal(blocked.kind, "recovery_required");
  assert.equal(blocked.error.operation, "practice_resume");
  assert.equal(blocked.error.allowedAction, "recover");

  await f.useCases.recoverActiveTrainingOperation();
  assert.equal((await f.useCases.getPracticeOperationState(active, false)).kind, "unanswered");
  assert.ok(f.calls.includes("recover"));
});

test("reconstruction restores feedback when the current practice occurrence already has a materialized attempt", async () => {
  const f = fixture();
  const active = session();
  f.setActive(active);
  f.setAttempts([{
    id: "attempt-1", sessionId: active.id, trackId: active.trackId, modeId: active.modeId,
    occurrenceId: active.itemOrder[0]!.occurrenceId, item: active.itemOrder[0]!.item,
    response: { value: "wrong" }, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: active.itemOrder[0]!.item, taxonomyOrSkillRefs: [] },
    answeredAt: "2026-07-16T12:00:01.000Z", committedAt: "2026-07-16T12:00:01.000Z",
  }]);

  const reconstructed = await f.useCases.reconstructOperationProjection(active);

  assert.equal(reconstructed.kind, "feedback");
  assert.equal((await f.useCases.getPracticeOperationState(active, true)).kind, "feedback");
});

test("advance verifies the new durable position and no active-session command defaults", async () => {
  const f = fixture(); f.setActive(session()); const advanced = await f.useCases.advancePracticeSession(); assert.equal(advanced.currentItemIndex, 1);
  const none = fixture(); await assert.rejects(() => none.useCases.advancePracticeSession(), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "no_active_session");
});

test("simulation finalization withholds summary until a canonical completed result exists", async () => {
  const simulation = fixture(); simulation.setActive(session()); await assert.rejects(() => simulation.useCases.finalizeSimulation(), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable");
});

test("practice completion retries only a non-durable Finish and returns one verified result", async () => {
  const f = fixture();
  const finalActive = identifySession(createTrainingSession({
    ...session(),
    currentItemIndex: 1,
    configurationSnapshot: { ...session().configurationSnapshot, submission: "perItem" },
  }));
  f.setActive(finalActive);
  const complete = f.ports.mutations.completeWithResult;
  let commands = 0;
  f.ports.mutations.completeWithResult = async (value) => {
    commands += 1;
    if (commands === 1) {
      f.calls.push("complete-with-result");
      throw new MutationCommitFailure("journal_write", "not_durable");
    }
    await complete(value);
  };

  await assert.rejects(() => f.useCases.completeActivePracticeSession(finalActive.id));
  const failed = f.useCases.getOperationProjection(finalActive.id);
  assert.equal(failed?.family, "practice");
  assert.equal(failed?.kind, "completion_failed");
  if (failed?.family === "practice" && failed.kind === "completion_failed") {
    assert.equal(failed.error.durableState, "not_durable");
    assert.equal(failed.error.allowedAction, "retry_same_command");
  }
  assert.equal((await f.ports.repositories.getActiveSession())?.id, finalActive.id);

  const verified = await f.useCases.completeActivePracticeSession(finalActive.id);
  assert.equal(verified.session.id, finalActive.id);
  assert.equal(verified.result.sessionId, finalActive.id);
  assert.equal(commands, 2);
  assert.equal(f.useCases.getOperationProjection(finalActive.id)?.kind, "completed");
});

test("exact completion recovery supports every durable phase without an active pointer", async () => {
  for (const status of ["journal_durable", "materialized", "verified_pending_clear"] as const) {
    const f = fixture();
    const completed = session("completed");
    const result = createTrainingSessionResult({ id: "result-1", sessionId: completed.id, trackId: completed.trackId, totalOccurrences: 2, answeredOccurrenceIds: ["occurrence-0", "occurrence-1"], unansweredOccurrenceIds: [], completedAt: completed.completedAt!, evidence: createFamilyEnvelope({ familyId: "test-family", details: {} }) });
    f.setPersisted(completed);
    f.setResult(result);
    f.setPending({ operation: "complete_training_session", status, sessionId: completed.id, trackId: completed.trackId, commandFingerprint: "command-1", planFingerprint: "plan-1", practiceCompletion: { resultId: result.id } });
    f.ports.mutations.recover = async () => { f.calls.push("recover"); f.setPending(null); };

    const reconstructed = await f.useCases.reconstructOperationProjection(createTrainingSession({ ...completed, status: "active", completedAt: undefined }));
    assert.equal(reconstructed.kind, "completion_failed", status);
    if (reconstructed.family === "practice" && reconstructed.kind === "completion_failed") {
      assert.equal(reconstructed.error.durableState, status, status);
      assert.equal(reconstructed.error.allowedAction, "recover", status);
    }
    const recovered = await f.useCases.recoverExpectedSessionCompletion(completed.id);
    assert.equal(recovered.session.id, completed.id, status);
    assert.equal(recovered.result.id, result.id, status);
    assert.equal(f.calls.filter((call) => call === "recover").length, 1, status);
    assert.equal(f.useCases.getOperationProjection(completed.id)?.kind, "completed", status);
  }
});

test("completion recovery rejects mismatched ownership and unverified terminal facts", async () => {
  const mismatch = fixture();
  mismatch.setPending({ operation: "abandon_training_session", status: "journal_durable", sessionId: "session-1", trackId: "test-track", commandFingerprint: "command-1", planFingerprint: "plan-1" });
  await assert.rejects(() => mismatch.useCases.recoverExpectedSessionCompletion("session-1"), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable");
  assert.equal(mismatch.calls.includes("recover"), false);

  const completed = session("completed");
  const result = createTrainingSessionResult({ id: "result-1", sessionId: completed.id, trackId: completed.trackId, totalOccurrences: 2, answeredOccurrenceIds: ["occurrence-0", "occurrence-1"], unansweredOccurrenceIds: [], completedAt: completed.completedAt!, evidence: createFamilyEnvelope({ familyId: "test-family", details: {} }) });
  for (const [name, configure] of [
    ["missing result", (f: ReturnType<typeof fixture>) => f.setPersisted(completed)],
    ["non-completed session", (f: ReturnType<typeof fixture>) => { f.setPersisted(session()); f.setResult(result); }],
    ["still-active exact session", (f: ReturnType<typeof fixture>) => { f.setPersisted(completed); f.setResult(result); f.setActive(session()); }],
  ] as const) {
    const f = fixture();
    configure(f);
    await assert.rejects(() => f.useCases.recoverExpectedSessionCompletion(completed.id), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "verification_failure", name);
    assert.equal(f.calls.includes("recover"), false, name);
  }
});

test("abandonment removes resumability and history excludes abandoned sessions while committed records are untouched", async () => {
  const f = fixture(); f.setActive(session()); const abandoned = await f.useCases.abandonActiveSession();
  assert.equal(abandoned.status, "abandoned"); assert.deepEqual((await f.useCases.queryHistory()).map((entry) => entry.status), ["completed"]); assert.ok(f.calls.includes("abandon"));
});

test("expected abandonment recovery replays only the exact matching journal and verifies terminal facts", async () => {
  const f = fixture();
  f.setActive(session());
  f.setPersisted(session());
  f.setPending({ operation: "abandon_training_session", status: "journal_durable", sessionId: "session-1", trackId: "test-track", commandFingerprint: "command-1", planFingerprint: "plan-1" });
  f.ports.mutations.recover = async () => {
    f.calls.push("recover");
    f.setPending(null);
    f.setPersisted(session("abandoned"));
    f.setActive(null);
  };

  const recovered = await f.useCases.recoverExpectedSessionAbandonment("session-1");

  assert.equal(recovered.status, "abandoned");
  assert.equal(f.calls.filter((call) => call === "recover").length, 1);
  assert.ok(f.calls.includes("get-session:session-1"));
});

test("expected abandonment recovery rejects mismatched journals and accepts only already-terminal facts without replay", async () => {
  const mismatch = fixture();
  mismatch.setPending({ operation: "complete_training_session", status: "journal_durable", sessionId: "session-1", trackId: "test-track", commandFingerprint: "command-1", planFingerprint: "plan-1" });
  await assert.rejects(
    () => mismatch.useCases.recoverExpectedSessionAbandonment("session-1"),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable",
  );
  assert.equal(mismatch.calls.includes("recover"), false);

  const terminal = fixture();
  terminal.setPersisted(session("abandoned"));
  assert.equal((await terminal.useCases.recoverExpectedSessionAbandonment("session-1")).status, "abandoned");
  assert.equal(terminal.calls.includes("recover"), false);

  const notTerminal = fixture();
  notTerminal.setPersisted(session());
  await assert.rejects(
    () => notTerminal.useCases.recoverExpectedSessionAbandonment("session-1"),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "verification_failure",
  );
  assert.equal(notTerminal.calls.includes("recover"), false);
});

test("recovery, reset, family queries, resume, and draft commands remain application entry points", async () => {
  const f = fixture(); f.setActive(session());
  await f.useCases.recoverPendingJournal(); await f.useCases.resetLearningState(); await f.useCases.resumeActiveSession();
  await f.useCases.saveSimulationDraft({ draft: { schemaVersion: 1, familyId: "coding_interview", draftVersion: 1, revision: 1, sessionId: "session-1", trackId: "test-track", responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: "2026-07-16T12:00:00.000Z" }, expectedPreviousRevision: 0 });
  assert.deepEqual(await f.useCases.queryDashboard("test-track"), { kind: "dashboard" }); assert.deepEqual(await f.useCases.queryProgress("test-track"), { kind: "progress" }); assert.deepEqual(await f.useCases.queryReview("test-track"), { kind: "review" });
  assert.ok(f.calls.includes("recover") && f.calls.includes("reset") && f.calls.includes("validate-draft") && f.calls.includes("save-draft"));
});

test("dashboard receives the active session only when it belongs to the queried track", async () => {
  const f = fixture(); const current = session(); f.setActive(current);
  await f.useCases.queryDashboard("test-track");
  assert.equal(f.dashboardActiveSession()?.id, current.id);
});

test("an expired absolute-deadline simulation finalizes once before it can be resumed", async () => {
  const f = fixture();
  const expired = identifySession(createTrainingSession({
    ...session(),
    modeId: "certification-exam-simulation",
    configurationSnapshot: {
      kind: "certificationSimulation",
      navigation: "free",
      submission: "manualOrForegroundTimeout",
      feedbackMode: "atSessionEnd",
      answerChanges: "untilFinalSubmission",
      timer: "absoluteDeadline",
      timerDeadlineAt: "2026-07-16T11:59:59.999Z",
      timerDurationMs: 120 * 60 * 1000,
    },
  }));
  f.setActive(expired);
  f.ports.repositories.getDraft = async () => ({
    schemaVersion: 1,
    familyId: "certification",
    draftVersion: 1,
    revision: 1,
    sessionId: expired.id,
    trackId: expired.trackId,
    responsesByOccurrenceId: {},
    flaggedOccurrenceIds: [],
    updatedAt: "2026-07-16T11:00:00.000Z",
  });

  assert.equal(await f.useCases.finalizeExpiredSimulationIfDue(), expired.id);
  assert.equal(f.calls.filter((call) => call === "commit-finalize").length, 1);
  assert.equal(await f.useCases.finalizeExpiredSimulationIfDue(), null);
  await assert.rejects(() => f.useCases.resumeActiveSession(), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "no_active_session");
});

test("manual finalization and expiry share one durable simulation finalization", async () => {
  const f = fixture();
  const expired = identifySession(createTrainingSession({
    ...session(),
    modeId: "certification-exam-simulation",
    configurationSnapshot: {
      kind: "certificationSimulation", navigation: "free", submission: "manualOrForegroundTimeout", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
      timer: "absoluteDeadline", timerDeadlineAt: "2026-07-16T11:59:59.999Z", timerDurationMs: 120 * 60 * 1000,
    },
  }));
  f.setActive(expired);
  f.ports.repositories.getDraft = async () => ({ schemaVersion: 1, familyId: "certification", draftVersion: 1, revision: 1, sessionId: expired.id, trackId: expired.trackId, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: "2026-07-16T11:00:00.000Z" });

  await Promise.all([f.useCases.finalizeExpiredSimulationIfDue(), f.useCases.finalizeSimulation()]);
  assert.equal(f.calls.filter((call) => call === "commit-finalize").length, 1);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  createFamilyEnvelope,
  createTrainingSession,
  createTrainingSessionResult,
  type TrainingSession,
} from "../src/domain";
import {
  TrainingApplicationFailure,
  TrainingLifecycleUseCases,
  type PendingMutationProjection,
  type PreparedSession,
  type TrainingFamilyRuntime,
  type TrainingLifecyclePorts,
} from "../src/application/trainingLifecycle";

function session(status: "active" | "completed" | "abandoned" = "active"): TrainingSession {
  return createTrainingSession({ id: "session-1", trackId: "test-track", modeId: "practice", configurationSnapshot: { kind: "test" }, requestedLength: 2, actualLength: 2, currentItemIndex: status === "completed" ? 1 : 0, itemOrder: ["one", "two"].map((itemId, index) => ({ occurrenceId: `occurrence-${index}`, item: { trackId: "test-track", itemId, contentVersion: "v1" } })), optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v1", status, startedAt: "2026-07-16T12:00:00.000Z", ...(status === "completed" ? { completedAt: "2026-07-16T12:01:00.000Z" } : {}) });
}

function fixture() {
  const calls: string[] = [];
  let active: TrainingSession | null = null;
  let dashboardActiveSession: TrainingSession | null = null;
  let pending: PendingMutationProjection | null = null;
  let persisted: TrainingSession | null = null;
  let result = null as ReturnType<typeof createTrainingSessionResult> | null;
  let attempts: readonly import("../src/domain").TrainingAttempt<unknown>[] = [];
  const runtime: TrainingFamilyRuntime = {
    familyId: "test-family",
    async prepare(input) { calls.push(`prepare:${input.trackId}:${input.modeId}`); const value = session(); return { session: value, firstOccurrence: value.itemOrder[0]!.item, draft: null }; },
    async validateResume() { calls.push("resume"); },
    async submitPractice(input) { calls.push(`submit:${String(input.response)}`); return { attempt: { id: "attempt-1", sessionId: input.session.id, trackId: input.session.trackId, modeId: input.session.modeId, occurrenceId: "occurrence-0", item: input.session.itemOrder[0]!.item, response: { value: input.response }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: input.session.itemOrder[0]!.item, taxonomyOrSkillRefs: [] }, answeredAt: "2026-07-16T12:00:01.000Z", committedAt: "2026-07-16T12:00:01.000Z" }, session: input.session, reviewMutations: [] }; },
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
    tracks: { getTrackRegistration(trackId) { if (trackId !== "test-track") throw new Error("unknown"); return { id: trackId, familyId: "test-family" }; } },
    runtimes: { resolve(familyId) { if (familyId !== "test-family") throw new Error("unknown family"); calls.push(`resolve:${familyId}`); return runtime; } },
    content: { async requireAvailable(trackId, modeId) { calls.push(`content:${trackId}:${modeId}`); }, async assertPreparedSession() { calls.push("content-prepared"); }, async assertActiveSession() { calls.push("content-resume"); } },
    repositories: {
      async getActiveSession() { calls.push("get-active"); return active; }, async getSession(id) { calls.push(`get-session:${id}`); return persisted; }, async getHistory() { calls.push("history"); return [session("completed"), session("abandoned")]; }, async getAttempts() { calls.push("attempts"); return attempts; }, async getReviews() { calls.push("reviews"); return []; }, async getDraft() { calls.push("draft"); return null; }, async getResult() { calls.push("result"); return result; }, async saveDraft() { calls.push("save-draft"); }, async getPendingMutation() { calls.push("pending"); return pending; },
    },
    mutations: {
      async start(input) { calls.push("start"); persisted = input.session; active = input.session; }, async submitPractice() { calls.push("commit-submit"); }, async advance(value) { calls.push("advance"); active = value; persisted = value; }, async complete(value) { calls.push("complete"); persisted = value; result = createTrainingSessionResult({ id: "result-1", sessionId: value.id, trackId: value.trackId, totalOccurrences: 2, answeredOccurrenceIds: [], unansweredOccurrenceIds: ["occurrence-0", "occurrence-1"], completedAt: "2026-07-16T12:01:00.000Z", evidence: createFamilyEnvelope({ familyId: "test-family", details: {} }) }); active = null; }, async completeWithResult(value) { calls.push("complete-with-result"); persisted = value.session; result = value.result; active = null; }, async finalize(input) { calls.push("commit-finalize"); persisted = input.session; result = input.result; active = null; }, async abandon(value) { calls.push("abandon"); persisted = value; active = null; }, async recover() { calls.push("recover"); pending = null; }, async reset() { calls.push("reset"); },
    },
  };
  return { calls, dashboardActiveSession: () => dashboardActiveSession, ports, prepared, setActive(value: TrainingSession | null) { active = value; }, setAttempts(value: typeof attempts) { attempts = value; }, setPending(value: PendingMutationProjection | null) { pending = value; }, setResult(value: typeof result) { result = value; }, useCases: new TrainingLifecycleUseCases(ports) };
}

test("start resolves the exact family and exposes its first item only after active-session verification", async () => {
  const f = fixture(); const started = await f.useCases.startSession({ trackId: "test-track", modeId: "practice", request: {} });
  assert.equal(started.firstOccurrence.itemId, "one");
  assert.deepEqual(f.calls.slice(0, 9), ["get-active", "content:test-track:practice", "resolve:test-family", "attempts", "reviews", "prepare:test-track:practice", "content-prepared", "start", "get-active"]);
});

test("one active session and unknown identifiers fail explicitly without a substitute", async () => {
  const f = fixture(); f.setActive(session());
  await assert.rejects(() => f.useCases.startSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "active_session_conflict");
  await assert.rejects(() => f.useCases.prepareSession({ trackId: "missing", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_track");
});

test("missing track content blocks preparation and start without selecting another track or mutating a session", async () => {
  const f = fixture();
  f.ports.content.requireAvailable = async () => { throw new Error("missing_artifact"); };
  await assert.rejects(() => f.useCases.prepareSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "missing_content");
  await assert.rejects(() => f.useCases.startSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "missing_content");
  assert.equal(f.calls.some((call) => call.startsWith("prepare:") || call === "start"), false);
});

test("a prepared or active session with a mismatched artifact identity is never persisted or resumed", async () => {
  const prepared = fixture();
  prepared.ports.content.assertPreparedSession = async () => { throw new Error("plan fingerprint mismatch"); };
  await assert.rejects(() => prepared.useCases.startSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "missing_content");
  assert.equal(prepared.calls.includes("start"), false);
  const active = fixture(); active.setActive(session());
  active.ports.content.assertActiveSession = async () => { throw new Error("content version mismatch"); };
  await assert.rejects(() => active.useCases.resumeActiveSession(), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable");
  assert.equal(active.calls.includes("resume"), false);
});

test("runtime resolution rejects an unknown or mismatched family without substituting another runtime", async () => {
  const missing = fixture();
  (missing.ports.runtimes as { resolve(familyId: string): TrainingFamilyRuntime }).resolve = () => { throw new Error("missing family"); };
  await assert.rejects(() => missing.useCases.prepareSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_family");
  const mismatched = fixture();
  const resolve = mismatched.ports.runtimes.resolve.bind(mismatched.ports.runtimes);
  (mismatched.ports.runtimes as { resolve(familyId: string): TrainingFamilyRuntime }).resolve = () => ({ ...resolve("test-family"), familyId: "another-family" });
  await assert.rejects(() => mismatched.useCases.prepareSession({ trackId: "test-track", modeId: "practice", request: {} }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_family");
});

test("practice response is handed to the family runtime and only its deterministic outcome reaches the coordinator", async () => {
  const f = fixture(); f.setActive(session()); await f.useCases.submitPracticeResponse({ selected: "a" });
  assert.deepEqual(f.calls, ["get-active", "content-resume", "get-active", "content-resume", "pending", "resolve:test-family", "attempts", "reviews", "submit:[object Object]", "commit-submit"]);
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

test("completion and finalization withhold summary until a canonical completed result exists", async () => {
  const f = fixture(); const completed = session("completed");
  await f.useCases.completeOrdinarySession(completed); assert.deepEqual(await f.useCases.loadSummary(completed.id), await f.ports.repositories.getResult(completed.id));
  const simulation = fixture(); simulation.setActive(session()); await assert.rejects(() => simulation.useCases.finalizeSimulation(), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "resume_unavailable");
});

test("abandonment removes resumability and history excludes abandoned sessions while committed records are untouched", async () => {
  const f = fixture(); f.setActive(session()); const abandoned = await f.useCases.abandonActiveSession();
  assert.equal(abandoned.status, "abandoned"); assert.deepEqual((await f.useCases.queryHistory()).map((entry) => entry.status), ["completed"]); assert.ok(f.calls.includes("abandon"));
});

test("recovery, reset, family queries, resume, and draft commands remain application entry points", async () => {
  const f = fixture(); f.setActive(session());
  await f.useCases.recoverPendingJournal(); await f.useCases.resetLearningState(); await f.useCases.resumeActiveSession();
  await f.useCases.saveSimulationDraft({ draft: { schemaVersion: 1, familyId: "algorithms", draftVersion: 1, revision: 1, sessionId: "session-1", trackId: "test-track", responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: "2026-07-16T12:00:00.000Z" }, expectedPreviousRevision: 0 });
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
  const expired = createTrainingSession({
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
  });
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
  const expired = createTrainingSession({
    ...session(),
    modeId: "certification-exam-simulation",
    configurationSnapshot: {
      kind: "certificationSimulation", navigation: "free", submission: "manualOrForegroundTimeout", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
      timer: "absoluteDeadline", timerDeadlineAt: "2026-07-16T11:59:59.999Z", timerDurationMs: 120 * 60 * 1000,
    },
  });
  f.setActive(expired);
  f.ports.repositories.getDraft = async () => ({ schemaVersion: 1, familyId: "certification", draftVersion: 1, revision: 1, sessionId: expired.id, trackId: expired.trackId, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: "2026-07-16T11:00:00.000Z" });

  await Promise.all([f.useCases.finalizeExpiredSimulationIfDue(), f.useCases.finalizeSimulation()]);
  assert.equal(f.calls.filter((call) => call === "commit-finalize").length, 1);
});

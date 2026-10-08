import assert from "node:assert/strict";
import test from "node:test";

import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { abandonTrainingSession, createTrainingSession, type ReviewQueueEntry, type TrainingSession } from "../../domain";
import { createResolvedContentRef } from "../../domain";
import { canonicalFingerprintPayload } from "../../infrastructure/identity/canonicalSerialization";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { commitTrainingOutcome, commitTrainingSessionStart, commitSessionAbandonment, recoverPendingMutation } from "../learningMutations";
import { MutationCommitFailure } from "../mutationBoundary";
import { addReviewQueueItems, getActiveMutationJournal, getReviewQueueItems, getTrainingAttempts } from "../../storage/repositories";
import { applyRemoteAccountData, buildAccountDataSnapshot } from "../../storage/repositories/accountDataRepository";
import { provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { STORAGE_KEYS } from "../../storage/keys";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const STARTED_AT = "2026-10-01T12:00:00.000Z";
const catalogPromise = loadCanonicalRuntimeCatalog();

async function submit(runtime: CanonicalTrainingRuntime, input: Readonly<{ sessionId: string; at: string; commitAt?: string; review?: ReviewQueueEntry; reviewSource?: "due_queue" | "manual_request"; incorrect?: boolean; response?: unknown; interrupt?: boolean }>) {
  const commitAt = input.commitAt ?? input.at;
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const mode = input.review ? track.getMode("coding-interview-weak-area-review") : track.getMode("coding-interview-learn-approach");
  const reviews = input.review ? [input.review] : [];
  const prepared = await runtime.prepare({ trackId: TRACK_ID, modeId: mode.modeId, request: { sessionId: input.sessionId, requestedLength: mode.requestedLengths[0]!, ...(input.review ? { reviewSource: input.reviewSource ?? "due_queue" } : {}) }, attempts: (await getTrainingAttempts()).value, reviews, now: input.at });
  const occurrence = prepared.session.itemOrder[0]!;
  const question = track.getQuestion(occurrence.item.questionId)!;
  assert.equal(input.review ? occurrence.reviewSourceSnapshot?.reviewEntryId : undefined, input.review?.id, "due work must be admitted with an exact runtime-generated source snapshot");
  await commitTrainingSessionStart({ session: prepared.session, draft: null, createdAt: input.at });
  const outcome = await runtime.submitPractice({ session: prepared.session, response: input.response ?? (input.incorrect ? wrongResponse(question) : question.answer), attempts: (await getTrainingAttempts()).value, reviews, now: input.at });
  const reviewMutations = outcome.reviewMutations;
  const command = () => commitTrainingOutcome({
    attempt: outcome.attempt,
    session: outcome.session,
    reviews: reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry),
    resolvedReviews: reviewMutations.filter((mutation) => mutation.kind === "remove").map((mutation) => mutation.entry),
    reviewBaseline: outcome.reviewBaseline,
    reviewSnapshotConflict: outcome.reviewSnapshotConflict,
    createdAt: commitAt,
  });
  if (input.interrupt) {
    const reviewId = reviewMutations.find((mutation) => mutation.kind === "upsert")?.entry.id;
    assert.ok(reviewId);
    installStorageFailure({ kind: "fail_on_key_write", key: STORAGE_KEYS.reviewEntry(reviewId) });
    await assert.rejects(command(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization" && error.durableState === "journal_durable");
    installStorageFailure(null);
    assert.notEqual(await getActiveMutationJournal(), null);
    await recoverPendingMutation();
    await recoverPendingMutation();
  } else {
    await command();
  }
  await commitSessionAbandonment(abandonTrainingSession(outcome.session, commitAt), commitAt);
  return { outcome, reviewMutations };
}

async function preSnapshotPlanFingerprint(session: TrainingSession): Promise<string> {
  return contentHasher.sha256(canonicalFingerprintPayload({
    trackId: session.trackId,
    modeId: session.modeId,
    contentVersion: session.contentVersion,
    artifactSha256: session.artifactSha256,
    taxonomyVersion: session.taxonomyVersion,
    configurationSnapshot: session.configurationSnapshot,
    itemOrder: session.itemOrder.map((occurrence) => ({ occurrenceId: occurrence.occurrenceId, item: createResolvedContentRef(occurrence.item) })),
    optionOrderByOccurrence: session.optionOrderByOccurrence,
    conditionalReinsertSlots: (session.conditionalReinsertSlots ?? []).map((slot) => ({
      slotId: slot.slotId,
      sourceOccurrenceId: slot.sourceOccurrenceId,
      ordinaryBranch: { occurrence: { occurrenceId: slot.ordinaryBranch.occurrence.occurrenceId, item: createResolvedContentRef(slot.ordinaryBranch.occurrence.item) }, optionOrder: [...slot.ordinaryBranch.optionOrder] },
      ...(slot.reviewedVariantBranch ? { reviewedVariantBranch: { occurrence: { occurrenceId: slot.reviewedVariantBranch.occurrence.occurrenceId, item: createResolvedContentRef(slot.reviewedVariantBranch.occurrence.item) }, optionOrder: [...slot.reviewedVariantBranch.optionOrder] } } : {}),
      ...(slot.exactSourceBranch ? { exactSourceBranch: { occurrence: { occurrenceId: slot.exactSourceBranch.occurrence.occurrenceId, item: createResolvedContentRef(slot.exactSourceBranch.occurrence.item) }, optionOrder: [...slot.exactSourceBranch.optionOrder] } } : {}),
      resolutionRule: slot.resolutionRule,
    })),
  }));
}

let setFailure: ((plan: { kind: "fail_on_key_write"; key: string } | null) => void) | undefined;
function installStorageFailure(plan: { kind: "fail_on_key_write"; key: string } | null): void {
  if (!setFailure) throw new Error("The review-cycle storage fixture is not initialized.");
  setFailure(plan);
}

function wrongResponse(question: import("../../content/canonical/questionTypes").Question) {
  const answer = question.answer;
  if (answer.type === "choice_single" && question.interaction.type === "choice_single") return { type: "choice_single" as const, optionId: question.interaction.options.find((option) => option.optionId !== answer.optionId)!.optionId };
  if (answer.type === "choice_multiple" && question.interaction.type === "choice_multiple") return { type: "choice_multiple" as const, optionIds: [question.interaction.options.find((option) => !answer.optionIds.includes(option.optionId))!.optionId] };
  if (answer.type === "ordering" && question.interaction.type === "ordering") return { type: "ordering" as const, orderedElementIds: [...answer.orderedElementIds].reverse() };
  if ((question.interaction.type === "complexity" || question.interaction.type === "decision_matrix") && (answer.type === "complexity" || answer.type === "decision_matrix")) {
    return { type: answer.type, selectedValueIdsByDimension: Object.fromEntries(question.interaction.dimensions.map((dimension) => [dimension.dimensionId, [dimension.values[0]!.valueId]])) };
  }
  throw new Error("The canonical question answer and interaction types must match.");
}

test("canonical repair and retention cycles use due snapshots, canonical answer time, and terminal history", async () => {
  const storage = installMemoryStorage();
  setFailure = (plan) => storage.setFailurePlan(plan);
  const catalog = await catalogPromise;
  const runtime = new CanonicalTrainingRuntime(catalog.getTrack(TRACK_ID));

  const initial = await submit(runtime, { sessionId: "cycle-error", at: STARTED_AT, incorrect: true });
  assert.equal(initial.outcome.attempt.answeredAt, STARTED_AT);
  let entries = (await getReviewQueueItems()).value;
  assert.equal(entries.length, 1);
  assert.deepEqual([entries[0]!.stage, entries[0]!.status, entries[0]!.dueAt], ["repair24", "active", "2026-10-02T12:00:00.000Z"]);
  const cycleId = entries[0]!.id;

  const transitions = [
    { at: "2026-10-02T12:00:00.000Z", stage: "repair7", dueAt: "2026-10-09T12:00:00.000Z" },
    { at: "2026-10-09T12:00:00.000Z", stage: "retention14", dueAt: "2026-10-23T12:00:00.000Z" },
    { at: "2026-10-23T12:00:00.000Z", stage: "retention28", dueAt: "2026-11-20T12:00:00.000Z" },
  ] as const;
  let previous = entries[0]!;
  for (const [index, transition] of transitions.entries()) {
    const submitted = await submit(runtime, { sessionId: `cycle-due-${index}`, at: transition.at, review: previous });
    assert.equal(submitted.outcome.attempt.result.kind, "correct");
    assert.equal(submitted.outcome.attempt.answeredAt, transition.at);
    assert.deepEqual(submitted.outcome.session.itemOrder[0]!.reviewSourceSnapshot, {
      source: "due_queue", reviewEntryId: previous.id, sourceAttemptId: previous.sourceAttemptId, dueAt: previous.dueAt,
      policyVersion: previous.policyVersion ?? "legacy-unqualified", stage: previous.stage ?? "legacy_active_unqualified",
    });
    entries = (await getReviewQueueItems()).value;
    assert.equal(entries.length, 1);
    previous = entries[0]!;
    assert.equal(previous.id, cycleId);
    assert.deepEqual([previous.stage, previous.dueAt, previous.status], [transition.stage, transition.dueAt, "active"]);
  }

  const pastDue = await runtime.queryReview({ trackId: TRACK_ID, reviews: entries, now: "2026-12-20T12:00:00.000Z" }) as { due: readonly ReviewQueueEntry[] };
  assert.deepEqual(pastDue.due.map((entry) => entry.id), [cycleId], "the elapsed retention28 deadline makes work due but does not complete it");
  assert.deepEqual((await getReviewQueueItems()).value, entries, "reading after the due instant does not mutate or complete the active cycle");

  const terminal = await submit(runtime, { sessionId: "cycle-terminal", at: "2026-11-20T12:00:00.000Z", review: previous, interrupt: true });
  assert.equal(terminal.outcome.attempt.result.kind, "correct");
  entries = (await getReviewQueueItems()).value;
  assert.equal(entries.length, 1, "terminal cycle remains as history");
  assert.deepEqual([entries[0]!.id, entries[0]!.status, entries[0]!.stage, entries[0]!.dueAt, entries[0]!.completedAt, entries[0]!.completedByAttemptId], [cycleId, "completed", "retention28", undefined, "2026-11-20T12:00:00.000Z", terminal.outcome.attempt.id]);
  assert.equal((await getTrainingAttempts()).value.length, 5, "journal recovery contributes each canonical answer exactly once");
  assert.equal(await getActiveMutationJournal(), null);

  const [completed] = (await getReviewQueueItems()).value;
  const ordinaryCorrect = await submit(runtime, { sessionId: "cycle-after-terminal-correct", at: "2026-11-21T12:00:00.000Z" });
  assert.equal(ordinaryCorrect.outcome.attempt.result.kind, "correct");
  assert.deepEqual((await getReviewQueueItems()).value.find((entry) => entry.id === cycleId), completed, "ordinary correct practice cannot revive or rewrite terminal history");

  const newError = await submit(runtime, { sessionId: "cycle-after-terminal-error", at: "2026-11-22T12:00:00.000Z", incorrect: true });
  const newRepair = newError.reviewMutations.find((mutation) => mutation.kind === "upsert")?.entry;
  assert.ok(newRepair, "new incorrect ordinary work starts a repair cycle after terminal history");
  assert.equal(newRepair.status, "active");
  assert.equal(newRepair.stage, "repair24");
  assert.notEqual(newRepair.id, cycleId);
  const afterNewError = (await getReviewQueueItems()).value;
  assert.deepEqual(afterNewError.find((entry) => entry.id === cycleId), completed, "the old terminal record remains immutable beside the new repair");
  assert.deepEqual(afterNewError.find((entry) => entry.id === newRepair.id), newRepair);
  setFailure = undefined;
});

test("twenty ordinary correct submissions leave an unrelated active error cycle byte-for-byte unchanged", async () => {
  installMemoryStorage();
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const runtime = new CanonicalTrainingRuntime(track);
  await submit(runtime, { sessionId: "ordinary-matrix-error", at: STARTED_AT, incorrect: true });
  const [errorCycle] = (await getReviewQueueItems()).value;
  assert.ok(errorCycle);

  const mode = track.getMode("coding-interview-learn-approach");
  assert.ok(mode.requestedLengths.includes(10), "the real normal mode supports ten-item sessions");
  let priorAttempts = (await getTrainingAttempts()).value;
  let completed = 0;
  for (let batch = 0; batch < 2; batch += 1) {
    const createdAt = new Date(Date.parse("2026-10-02T12:00:00.000Z") + batch * 60_000).toISOString();
    const currentReviews = (await getReviewQueueItems()).value;
    const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: `ordinary-matrix-${batch}`, requestedLength: 10 }, attempts: priorAttempts, reviews: currentReviews, now: createdAt });
    assert.equal(prepared.session.actualLength, 10);
    await commitTrainingSessionStart({ session: prepared.session, draft: null, createdAt });
    let session = prepared.session;
    for (let index = 0; index < 10; index += 1) {
      const taxonomyVersion = session.taxonomyVersion;
      assert.ok(taxonomyVersion);
      const base = createTrainingSession({ ...session, currentItemIndex: index, taxonomyVersion: undefined, planFingerprint: undefined });
      const planFingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion });
      const indexedSession = createTrainingSession({ ...base, taxonomyVersion, planFingerprint });
      const occurrence = indexedSession.itemOrder[index]!;
      assert.ok(occurrence);
      const question = track.getQuestion(occurrence.item.questionId)!;
      const answerAt = new Date(Date.parse(createdAt) + index * 1_000).toISOString();
      const reviews = (await getReviewQueueItems()).value;
      const outcome = await runtime.submitPractice({ session: indexedSession, response: question.answer, attempts: priorAttempts, reviews, now: answerAt });
      assert.equal(outcome.attempt.result.kind, "correct");
      const writes = outcome.reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry);
      const removals = outcome.reviewMutations.filter((mutation) => mutation.kind === "remove").map((mutation) => mutation.entry);
      await commitTrainingOutcome({ attempt: outcome.attempt, session: outcome.session, reviews: writes, resolvedReviews: removals, reviewBaseline: reviews, reviewSnapshotConflict: outcome.reviewSnapshotConflict, createdAt: answerAt });
      priorAttempts = [...priorAttempts, outcome.attempt];
      session = outcome.session;
      completed += 1;
      const currentCycle: ReviewQueueEntry | undefined = (await getReviewQueueItems()).value.find((entry) => entry.id === errorCycle.id);
      assert.deepEqual(currentCycle, errorCycle, `ordinary correct #${completed} cannot change the active error deadline, reason, or count`);
    }
    const finishedAt = new Date(Date.parse(createdAt) + 20_000).toISOString();
    await commitSessionAbandonment(abandonTrainingSession(session, finishedAt), finishedAt);
  }
  assert.equal(completed, 20);
  assert.equal((await getTrainingAttempts()).value.filter((attempt) => ["ordinary-matrix-0", "ordinary-matrix-1"].includes(attempt.sessionId)).length, 20);
});

test("incorrect or partial due answers at every retention stage restart the same need at repair24", async () => {
  const track = (await catalogPromise).getTrack(TRACK_ID);
  const mode = track.getMode("coding-interview-weak-area-review");
  const partialQuestion = track.getPool(mode.modeId).find((question) => question.interaction.type === "choice_multiple" && question.answer.type === "choice_multiple" && question.answer.optionIds.length > 1);
  assert.ok(partialQuestion);
  if (partialQuestion.interaction.type !== "choice_multiple" || partialQuestion.answer.type !== "choice_multiple") throw new Error("Expected a multi-select question for partial-score coverage.");
  const partial = { type: "choice_multiple", optionIds: partialQuestion.answer.optionIds.slice(0, -1) };

  for (const stage of ["retention7", "retention14", "retention28"] as const) {
    for (const outcomeKind of ["incorrect", "partial"] as const) {
      installMemoryStorage();
      const runtime = new CanonicalTrainingRuntime(track);
      const sourceItem = createResolvedContentRef({ trackId: track.trackId, questionId: partialQuestion.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 });
      const prior: ReviewQueueEntry = {
        id: `cycle:${stage}:${outcomeKind}`, trackId: track.trackId, sourceAttemptId: `source:${stage}:${outcomeKind}`, sourceSessionId: "source-session",
        sourceItem, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt: STARTED_AT, createdAt: STARTED_AT,
        consecutiveAfterDueSuccesses: 0, persistent: false, policyVersion: "bizq04-v1", stage, status: "active",
      };
      await addReviewQueueItems([prior]);
      const result = await submit(runtime, {
        sessionId: `stage-reset:${stage}:${outcomeKind}`, at: STARTED_AT, review: prior,
        ...(outcomeKind === "incorrect" ? { incorrect: true } : { response: partial }),
      });
      assert.equal(result.outcome.attempt.result.kind, outcomeKind, `${stage}/${outcomeKind} fixture must produce the named graded result`);
      const [updated] = (await getReviewQueueItems()).value;
      assert.ok(updated);
      assert.equal(updated.id, prior.id, "a new error updates this active cycle rather than creating a duplicate");
      assert.deepEqual([updated.status, updated.stage, updated.dueAt, updated.consecutiveAfterDueSuccesses, updated.persistent, ...updated.reasons], ["active", "repair24", "2026-10-02T12:00:00.000Z", 0, true, outcomeKind]);
      assert.equal(updated.completedAt, undefined);
      assert.equal(updated.completedByAttemptId, undefined);
      if (outcomeKind === "incorrect") assert.deepEqual(updated.reasons, ["incorrect"]);
    }
  }
});

test("answers to a future manual request cannot earn early due credit when journaled after the due instant", async () => {
  const track = (await catalogPromise).getTrack(TRACK_ID);
  const mode = track.getMode("coding-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const sourceItem = createResolvedContentRef({ trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 });
  const answerAt = STARTED_AT;
  const dueAt = "2026-10-08T12:00:00.000Z";
  const journalAt = "2026-10-09T12:00:00.000Z";

  for (const stage of ["retention7", "retention14", "retention28"] as const) {
    installMemoryStorage();
    const runtime = new CanonicalTrainingRuntime(track);
    const prior: ReviewQueueEntry = {
      id: `manual-late-materialization:${stage}`, trackId: track.trackId, sourceAttemptId: `source:${stage}`, sourceSessionId: "source-session",
      sourceItem, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval", "manual_mark"], dueAt, createdAt: STARTED_AT,
      consecutiveAfterDueSuccesses: 0, persistent: false, policyVersion: "bizq04-v1", stage, status: "active", manualRequestId: `manual:${"f".repeat(64)}`,
    };
    await addReviewQueueItems([prior]);
    const submitted = await submit(runtime, { sessionId: `manual-before-due:${stage}`, at: answerAt, commitAt: journalAt, review: prior, reviewSource: "manual_request" });
    assert.equal(submitted.outcome.attempt.result.kind, "correct");
    assert.ok(Date.parse(submitted.outcome.attempt.answeredAt) < Date.parse(dueAt));
    assert.ok(Date.parse(journalAt) > Date.parse(dueAt));
    const [updated] = (await getReviewQueueItems()).value;
    assert.ok(updated);
    assert.equal(updated.id, prior.id);
    assert.deepEqual([updated.reasons, updated.manualRequestId, updated.dueAt, updated.stage, updated.consecutiveAfterDueSuccesses, updated.status], [["scheduled_retrieval"], undefined, dueAt, stage, 0, "active"]);
    assert.equal(updated.completedAt, undefined, "late materialization does not convert a pre-due answer into stage-28 completion");
  }
});

test("real completed and new repair cycles survive account snapshot materialization unchanged", async () => {
  installMemoryStorage();
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  const track = (await catalogPromise).getTrack(TRACK_ID);
  const runtime = new CanonicalTrainingRuntime(track);
  const mode = track.getMode("coding-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const sourceItem = createResolvedContentRef({ trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 });
  const previous: ReviewQueueEntry = {
    id: "cycle:before-account-materialization", trackId: track.trackId, sourceAttemptId: "attempt:before-account-materialization", sourceSessionId: "session:before-account-materialization",
    sourceItem, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt: STARTED_AT, createdAt: STARTED_AT,
    consecutiveAfterDueSuccesses: 0, persistent: false, policyVersion: "bizq04-v1", stage: "retention28", status: "active",
  };
  await addReviewQueueItems([previous]);
  const terminal = await submit(runtime, { sessionId: "account-materialize-terminal", at: STARTED_AT, review: previous });
  assert.equal(terminal.outcome.reviewMutations[0]?.kind, "upsert");
  const [completed] = (await getReviewQueueItems()).value;
  assert.ok(completed);
  assert.deepEqual([completed.status, completed.stage, completed.dueAt, completed.completedByAttemptId], ["completed", "retention28", undefined, terminal.outcome.attempt.id]);

  await submit(runtime, { sessionId: "account-materialize-new-error", at: "2026-10-02T12:00:00.000Z", incorrect: true });
  const beforeSync = (await getReviewQueueItems()).value;
  assert.equal(beforeSync.filter((entry) => entry.status === "completed").length, 1);
  assert.equal(beforeSync.filter((entry) => entry.status === "active" && entry.stage === "repair24").length, 1);
  const snapshot = await buildAccountDataSnapshot();
  const reviewRecords = snapshot.records.filter((record) => record.recordType === "review_queue_entry");
  assert.equal(reviewRecords.length, 2);

  installMemoryStorage();
  await provisionGuestInstallation({ async create() { return { installationId: "88888888-8888-4888-8888-888888888888", localDatasetId: "99999999-9999-4999-8999-999999999999" }; } });
  await applyRemoteAccountData(reviewRecords);
  const afterSync = (await getReviewQueueItems()).value;
  assert.deepEqual(afterSync, beforeSync);
  assert.equal(afterSync.find((entry) => entry.id === completed.id)?.completedByAttemptId, terminal.outcome.attempt.id);
  assert.equal(afterSync.find((entry) => entry.status === "active")?.stage, "repair24");
});

test("a persisted legacy due session keeps its pre-snapshot fingerprint but cannot earn due credit", async () => {
  installMemoryStorage();
  const track = (await catalogPromise).getTrack(TRACK_ID);
  const runtime = new CanonicalTrainingRuntime(track);
  const question = track.getPool("coding-interview-weak-area-review")[0]!;
  const prior: ReviewQueueEntry = {
    id: "review:legacy-paused-source",
    trackId: track.trackId,
    sourceAttemptId: "attempt:legacy-paused-source",
    sourceSessionId: "session:legacy-source",
    sourceItem: { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    taxonomyOrSkillRefs: [],
    reasons: ["scheduled_retrieval"],
    dueAt: STARTED_AT,
    createdAt: STARTED_AT,
    consecutiveAfterDueSuccesses: 0,
    persistent: false,
  };
  await addReviewQueueItems([prior]);
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId: "coding-interview-weak-area-review",
    request: { sessionId: "legacy-paused-review-session", requestedLength: 10, reviewSource: "due_queue" },
    attempts: [],
    reviews: [prior],
    now: STARTED_AT,
  });
  const legacyBase = {
    ...prepared.session,
    itemOrder: prepared.session.itemOrder.map(({ occurrenceId, item }) => ({ occurrenceId, item })),
  } as TrainingSession;
  const legacy = createTrainingSession({ ...legacyBase, planFingerprint: await preSnapshotPlanFingerprint(legacyBase) });
  assert.equal(legacy.itemOrder[0]?.reviewSourceSnapshot, undefined);
  await commitTrainingSessionStart({ session: legacy, draft: null, createdAt: STARTED_AT });
  await runtime.validateResume({ session: legacy, draft: null });

  const occurrence = legacy.itemOrder[0]!;
  const exactQuestion = track.getQuestion(occurrence.item.questionId)!;
  const outcome = await runtime.submitPractice({ session: legacy, response: exactQuestion.answer, attempts: [], reviews: [prior], now: STARTED_AT });
  assert.equal(outcome.reviewSnapshotConflict, true);
  assert.deepEqual(outcome.reviewMutations, []);
  await commitTrainingOutcome({
    attempt: outcome.attempt,
    session: outcome.session,
    reviews: [],
    reviewBaseline: [prior],
    reviewSnapshotConflict: outcome.reviewSnapshotConflict,
    createdAt: STARTED_AT,
  });
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.deepEqual((await getReviewQueueItems()).value, [prior]);
});

test("a completed retention28 transition consumes its manual overlay through the real journal and repository", async () => {
  installMemoryStorage();
  const track = (await catalogPromise).getTrack(TRACK_ID);
  const runtime = new CanonicalTrainingRuntime(track);
  const mode = track.getMode("coding-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const sourceItem = createResolvedContentRef({ trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 });
  const dueAt = STARTED_AT;
  const prior: ReviewQueueEntry = {
    id: "review:terminal-manual-overlay",
    trackId: track.trackId,
    sourceAttemptId: "attempt:terminal-manual-overlay-source",
    sourceSessionId: "session:terminal-manual-overlay-source",
    sourceItem,
    taxonomyOrSkillRefs: [],
    reasons: ["scheduled_retrieval", "manual_mark"],
    dueAt,
    createdAt: "2026-09-01T12:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: false,
    manualRequestId: `manual:${"8".repeat(64)}`,
    policyVersion: "bizq04-v1",
    stage: "retention28",
    status: "active",
  };
  await addReviewQueueItems([prior]);

  const finalized = await submit(runtime, { sessionId: "terminal-manual-overlay-due-success", at: dueAt, review: prior, response: question.answer });
  assert.equal(finalized.outcome.attempt.result.kind, "correct");
  const [completed] = (await getReviewQueueItems()).value;
  assert.ok(completed);
  assert.deepEqual([completed.id, completed.status, completed.stage, completed.dueAt, completed.persistent, completed.consecutiveAfterDueSuccesses, completed.completedByAttemptId], [prior.id, "completed", "retention28", undefined, false, 0, finalized.outcome.attempt.id]);
  assert.deepEqual(completed.reasons, ["scheduled_retrieval"]);
  assert.equal(completed.manualRequestId, undefined);
  assert.equal(await getActiveMutationJournal(), null);
});

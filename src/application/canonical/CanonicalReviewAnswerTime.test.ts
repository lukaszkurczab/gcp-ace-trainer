import assert from "node:assert/strict";
import test from "node:test";

import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createTrainingSessionDraft, type ReviewQueueEntry } from "../../domain";
import { commitTrainingSessionFinalization } from "../learningMutations";
import { MutationCommitFailure } from "../mutationBoundary";
import {
  getActiveMutationJournal,
  addReviewQueueItems,
  getReviewQueueItems,
  getTrainingAttempts,
  saveTrainingSession,
  saveTrainingSessionDraft,
} from "../../storage/repositories";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { recoverPendingMutation } from "../learningMutations";
import { STORAGE_KEYS } from "../../storage/keys";

const TRACK_ID = "google-cloud-associate-cloud-engineer";
const STARTED_AT = "2026-10-02T09:50:00.000Z";
const COMMITTED_AT = "2026-10-02T10:05:00.000Z";
const catalogPromise = loadCanonicalRuntimeCatalog();

type FinalizedScenario = Readonly<{
  finalized: Awaited<ReturnType<CanonicalTrainingRuntime["finalizeSimulation"]>>;
  priorReview: ReviewQueueEntry;
  persistedReviews: readonly ReviewQueueEntry[];
  persistedAttempts: Awaited<ReturnType<typeof getTrainingAttempts>>["value"];
}>;

async function finalizeScenario(input: Readonly<{
  name: string;
  answeredAt: string;
  dueAt: string;
  consecutiveAfterDueSuccesses: number;
  sourceSessionId?: string;
  interruptAndRecover?: boolean;
}>): Promise<FinalizedScenario> {
  const storage = installMemoryStorage();
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const runtime = new CanonicalTrainingRuntime(track);
  const prepared = await runtime.prepare({
    trackId: TRACK_ID,
    modeId: "certification-exam-simulation",
    request: { sessionId: `answer-time-${input.name}` },
    attempts: [],
    reviews: [],
    now: STARTED_AT,
  });
  const occurrence = prepared.session.itemOrder[0]!;
  const question = track.getQuestion(occurrence.item.questionId)!;
  const initialDraft = createTrainingSessionDraft({
    sessionId: prepared.session.id,
    trackId: TRACK_ID,
    familyId: "certification",
    responsesByOccurrenceId: { [occurrence.occurrenceId]: question.answer },
    updatedAt: input.answeredAt,
  });
  await saveTrainingSession(prepared.session);
  const draft = await saveTrainingSessionDraft(initialDraft, null);
  const priorReview: ReviewQueueEntry = {
    id: `review:older-session-exact-ref:${input.name}`,
    trackId: TRACK_ID,
    sourceAttemptId: `attempt:older-session:${input.name}`,
    sourceSessionId: input.sourceSessionId ?? "older-session",
    sourceItem: occurrence.item,
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect"],
    dueAt: input.dueAt,
    createdAt: "2026-10-01T09:00:00.000Z",
    consecutiveAfterDueSuccesses: input.consecutiveAfterDueSuccesses,
    persistent: true,
  };
  await addReviewQueueItems([priorReview]);

  const finalized = await runtime.finalizeSimulation({
    session: prepared.session,
    draft,
    attempts: [],
    reviews: [priorReview],
    now: COMMITTED_AT,
  });
  assert.equal(finalized.attempts.length, 1);
  assert.equal(finalized.attempts[0]!.answeredAt, input.answeredAt);
  assert.equal(finalized.attempts[0]!.committedAt, COMMITTED_AT);
  assert.equal(finalized.attempts[0]!.result.kind, "correct");

  const reviewMutations = finalized.reviewMutations.map((mutation) => {
    if (!mutation.transitionAttemptId) throw new Error("A finalization review mutation must identify its answer transition.");
    return {
      action: mutation.kind === "remove" ? "delete" as const : "update" as const,
      record: mutation.entry,
      transitionAttemptId: mutation.transitionAttemptId,
    };
  });
  const commit = () => commitTrainingSessionFinalization({
    session: finalized.session,
    attempts: finalized.attempts,
    reviewMutations,
    result: finalized.result,
    cleanup: { kind: "training_session_draft", draft, submittedOccurrenceIds: finalized.attempts.map((attempt) => attempt.occurrenceId) },
    createdAt: COMMITTED_AT,
  });
  if (input.interruptAndRecover) {
    storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT });
    await assert.rejects(commit(), (error: unknown) => error instanceof MutationCommitFailure && error.phase === "materialization" && error.durableState === "journal_durable");
    assert.notEqual(await getActiveMutationJournal(), null, "the durable finalization journal must remain for recovery");
    storage.setFailurePlan(null);
    await recoverPendingMutation();
    await recoverPendingMutation();
    assert.equal(await getActiveMutationJournal(), null);
  } else {
    await commit();
  }

  return {
    finalized,
    priorReview,
    persistedReviews: (await getReviewQueueItems()).value,
    persistedAttempts: (await getTrainingAttempts()).value,
  };
}

function assertOriginalAttemptPreserved(scenario: FinalizedScenario, answeredAt: string): void {
  const attempt = scenario.finalized.attempts[0]!;
  const persisted = scenario.persistedAttempts[0]!;
  assert.equal(scenario.persistedAttempts.length, 1);
  assert.equal(persisted.id, attempt.id);
  assert.equal(persisted.answeredAt, answeredAt);
  assert.equal(persisted.committedAt, COMMITTED_AT);
  assert.equal(JSON.stringify(persisted.result), JSON.stringify(attempt.result), "canonical wire persistence preserves the scored result");
}

test("a correct GCP simulation answer recorded before due time does not advance older review evidence at finalization", async () => {
  const answeredAt = "2026-10-02T09:59:00.000Z";
  const scenario = await finalizeScenario({ name: "before-due-counter-one", answeredAt, dueAt: "2026-10-02T10:00:00.000Z", consecutiveAfterDueSuccesses: 1 });
  assert.deepEqual(scenario.finalized.reviewMutations, [], "finalization time must not turn a pre-due answer into a due success");
  assert.deepEqual(scenario.persistedReviews, [scenario.priorReview]);
  assertOriginalAttemptPreserved(scenario, answeredAt);
});

test("due-answer boundaries preserve the two-success rule and the exact-current-session guard", async t => {
  const cases = [
    { name: "before-counter-zero", answeredAt: "2026-10-02T09:59:00.000Z", counter: 0, kind: "unchanged" as const },
    { name: "before-counter-one", answeredAt: "2026-10-02T09:59:00.000Z", counter: 1, kind: "unchanged" as const },
    { name: "equal-counter-zero", answeredAt: "2026-10-02T10:00:00.000Z", counter: 0, kind: "increment" as const },
    { name: "equal-counter-one", answeredAt: "2026-10-02T10:00:00.000Z", counter: 1, kind: "remove" as const },
    { name: "after-counter-zero", answeredAt: "2026-10-02T10:01:00.000Z", counter: 0, kind: "increment" as const },
    { name: "after-counter-one", answeredAt: "2026-10-02T10:01:00.000Z", counter: 1, kind: "remove" as const },
  ];
  for (const scenarioCase of cases) {
    await t.test(scenarioCase.name, async () => {
      const scenario = await finalizeScenario({
        name: scenarioCase.name,
        answeredAt: scenarioCase.answeredAt,
        dueAt: "2026-10-02T10:00:00.000Z",
        consecutiveAfterDueSuccesses: scenarioCase.counter,
      });
      if (scenarioCase.kind === "unchanged") {
        assert.deepEqual(scenario.finalized.reviewMutations, []);
        assert.deepEqual(scenario.persistedReviews, [scenario.priorReview]);
      } else if (scenarioCase.kind === "increment") {
        const mutation = scenario.finalized.reviewMutations[0];
        assert.equal(scenario.finalized.reviewMutations.length, 1);
        assert.equal(mutation?.kind, "upsert");
        if (mutation?.kind !== "upsert") return;
        assert.equal(mutation.entry.id, scenario.priorReview.id);
        assert.equal(mutation.entry.consecutiveAfterDueSuccesses, 1);
        assert.equal(mutation.entry.dueAt, scenario.priorReview.dueAt);
        assert.equal(mutation.entry.lastReviewedAt, scenarioCase.answeredAt);
        assert.deepEqual(scenario.persistedReviews, [mutation.entry]);
      } else {
        const mutation = scenario.finalized.reviewMutations[0];
        assert.equal(scenario.finalized.reviewMutations.length, 1);
        assert.equal(mutation?.kind, "remove");
        assert.equal(mutation?.entry.id, scenario.priorReview.id);
        assert.deepEqual(scenario.persistedReviews, []);
      }
      assertOriginalAttemptPreserved(scenario, scenarioCase.answeredAt);
    });
  }

  await t.test("persistent exact-reference review from the same session remains unchanged", async () => {
    const name = "same-session-exact-reference";
    const scenario = await finalizeScenario({
      name,
      answeredAt: "2026-10-02T10:01:00.000Z",
      dueAt: "2026-10-02T09:55:00.000Z",
      consecutiveAfterDueSuccesses: 1,
      sourceSessionId: `answer-time-${name}`,
    });
    assert.deepEqual(scenario.finalized.reviewMutations, []);
    assert.deepEqual(scenario.persistedReviews, [scenario.priorReview]);
    assertOriginalAttemptPreserved(scenario, "2026-10-02T10:01:00.000Z");
  });
});

test("journal replay applies one eligible due success exactly once after draft-cleanup interruption", async () => {
  const answeredAt = "2026-10-02T10:01:00.000Z";
  const scenario = await finalizeScenario({
    name: "after-due-recover-first-success",
    answeredAt,
    dueAt: "2026-10-02T10:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    interruptAndRecover: true,
  });
  assert.equal(scenario.finalized.reviewMutations.length, 1);
  const mutation = scenario.finalized.reviewMutations[0];
  assert.equal(mutation?.kind, "upsert");
  if (mutation?.kind !== "upsert") return;
  assert.equal(mutation.entry.id, scenario.priorReview.id);
  assert.equal(mutation.entry.sourceAttemptId, scenario.priorReview.sourceAttemptId);
  assert.equal(mutation.entry.sourceSessionId, scenario.priorReview.sourceSessionId);
  assert.equal(mutation.entry.dueAt, scenario.priorReview.dueAt);
  assert.equal(mutation.entry.consecutiveAfterDueSuccesses, 1);
  assert.equal(mutation.entry.lastReviewedAt, answeredAt);
  assert.deepEqual(scenario.persistedReviews, [mutation.entry]);
  assertOriginalAttemptPreserved(scenario, answeredAt);
});

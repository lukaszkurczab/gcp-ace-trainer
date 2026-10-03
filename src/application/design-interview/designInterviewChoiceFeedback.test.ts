import assert from "node:assert/strict";
import test from "node:test";

import { CanonicalTrainingRuntime } from "../canonical/CanonicalTrainingRuntime";
import { prepareCanonicalOptionOrder } from "../canonical/canonicalOptionOrder";
import { projectCanonicalChoiceFeedbackMessages } from "../canonical/canonicalInteractionPresentation";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import {
  getDesignInterviewPracticeProjection,
  submitDesignInterviewPracticeResponse,
} from "./designInterviewSessionFacade";
import { getForegroundSessionTimerFacade, getTrainingLifecycleUseCases, TrainingApplicationFailure } from "../trainingLifecycle";
import { commitTrainingSessionStart } from "../learningMutations";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createTrainingSession } from "../../domain";
import { loadCanonicalRuntimeCatalog, type CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import type { CanonicalQuestionResponse, Question } from "../../content/canonical/questionTypes";
import { getReviewQueueItems, getTrainingAttempts } from "../../storage/repositories";
import { STORAGE_KEYS } from "../../storage/keys";
import { installMemoryStorage } from "../../testing/journalTestSupport";

const NOW = "2026-10-03T12:00:00.000Z";
const MODE_ID = "design-interview-learn-framework";
const TRACK_IDS = Object.freeze([
  "backend-system-design-interview",
  "frontend-system-design-interview",
  "object-oriented-design-interview",
] as const);

function choiceQuestion(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

async function startPinnedSession(track: CanonicalTrackRuntime, question: Extract<Question, { interaction: { type: "choice_single" } }>, sessionId: string) {
  const runtime = new CanonicalTrainingRuntime(track);
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId: MODE_ID,
    request: { sessionId, requestedLength: 1 },
    attempts: [],
    reviews: [],
    now: NOW,
  });
  assert.ok(track.getPool(MODE_ID).some((candidate) => candidate.questionId === question.questionId));
  const first = prepared.session.itemOrder[0];
  assert.ok(first);
  const itemOrder = prepared.session.itemOrder.map((entry, index) => index === 0
    ? { ...entry, item: { ...entry.item, questionId: question.questionId } }
    : entry);
  const optionOrderByOccurrence = {
    ...prepared.session.optionOrderByOccurrence,
    [first.occurrenceId]: prepareCanonicalOptionOrder(question, first.occurrenceId, first.item),
  };
  const unpinned = createTrainingSession({ ...prepared.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined });
  const session = createTrainingSession({
    ...unpinned,
    taxonomyVersion: "canonical-content-v1",
    planFingerprint: await createContentSessionPlanFingerprint({ ...unpinned, taxonomyVersion: "canonical-content-v1" }),
  });
  await runtime.validateResume({ session, draft: null });
  await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
  const dependencies = {
    wallClock: { now: () => NOW },
    sessionIds: { create: async () => sessionId },
    // Memory-backed family tests do not exercise or claim provider Premium authorization.
    premiumSessionAdmission: { authorize: async () => "allowed" as const },
  };
  composeTrainingLifecycleUseCases(dependencies);
  await getForegroundSessionTimerFacade().initialize(session);
  return { runtime, session, dependencies };
}

function responseFor(question: Extract<Question, { interaction: { type: "choice_single" } }>, correct: boolean): CanonicalQuestionResponse {
  const optionId = correct
    ? question.answer.optionId
    : question.feedback.messages?.find((message) => message.kind === "wrong_option")?.targetId;
  assert.ok(optionId);
  return { type: "choice_single", optionId };
}

test("all three actual Design pools deliver exact authored wrong-option feedback after durable submit and rebind", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  for (const trackId of TRACK_IDS) {
    const track = catalog.getTrack(trackId);
    const question = track.getPool(MODE_ID).find((candidate) => choiceQuestion(candidate) && candidate.feedback.messages?.some((message) => message.kind === "wrong_option"));
    assert.ok(question && choiceQuestion(question), `eligible authored choice question exists in ${trackId}`);

    for (const correct of [false, true]) {
      const storage = installMemoryStorage();
      const sessionId = `bizq01-design-choice-delivery:${trackId}:${correct ? "correct" : "wrong"}`;
      const { session, dependencies } = await startPinnedSession(track, question, sessionId);
      const before = await getDesignInterviewPracticeProjection();
      assert.equal(before.feedback, null, "no answer feedback is exposed before durable submission");
      const response = responseFor(question, correct);
      const expected: readonly Readonly<{ kind: string; targetId: string; text: string }>[] = projectCanonicalChoiceFeedbackMessages(question, response) ?? Object.freeze([]);
      if (correct) assert.deepEqual(expected, [], "the correct response has no wrong-option explanation");
      else {
        assert.equal(expected.length, 1);
        assert.equal(expected[0]?.text, question.feedback.messages?.find((message) => message.kind === "wrong_option" && message.targetId === (response as { optionId: string }).optionId)?.text);
      }

      await submitDesignInterviewPracticeResponse(response);
      const attempts = (await getTrainingAttempts()).value;
      assert.equal(attempts.length, 1);
      assert.equal(attempts[0]?.sessionId, sessionId);
      assert.deepEqual(attempts[0]?.response, response);
      assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);

      composeTrainingLifecycleUseCases(dependencies);
      const after = await getDesignInterviewPracticeProjection();
      assert.equal(after.session.id, session.id);
      assert.ok(after.feedback);
      assert.ok(after.feedback.messages);
      assert.deepEqual(after.feedback.messages, expected);
      assert.equal(Object.isFrozen(after.feedback.messages), true);
      assert.equal(after.feedback.result, correct ? "correct" : "incorrect");
    }
  }
});

test("Design choice diagnostics stay hidden for a failed journal write and committed-only response", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK_IDS[0]);
  const question = track.getPool(MODE_ID).find((candidate) => choiceQuestion(candidate) && candidate.feedback.messages?.some((message) => message.kind === "wrong_option"));
  assert.ok(question && choiceQuestion(question));
  const response = responseFor(question, false);

  {
    const storage = installMemoryStorage();
    const { session } = await startPinnedSession(track, question, "bizq01-design-choice-journal-failure");
    await getForegroundSessionTimerFacade().checkpointForResponseSave(session);
    storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
    await assert.rejects(() => getTrainingLifecycleUseCases().submitPracticeResponse(response), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "submit_journal_failed");
    storage.setFailurePlan(null);
    const projection = await getDesignInterviewPracticeProjection();
    assert.equal(projection.feedback, null);
    assert.equal(projection.response, null);
    assert.equal((await getTrainingAttempts()).value.length, 0);
    assert.equal((await getReviewQueueItems()).value.length, 0);
    assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
  }

  {
    const storage = installMemoryStorage();
    const sessionId = "bizq01-design-choice-committed-only";
    const { runtime, session } = await startPinnedSession(track, question, sessionId);
    await getForegroundSessionTimerFacade().checkpointForResponseSave(session);
    const outcome = await runtime.submitPractice({ session, response, attempts: [], reviews: [], now: NOW });
    storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(outcome.attempt.id) });
    await assert.rejects(() => getTrainingLifecycleUseCases().submitPracticeResponse(response), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "commit_materialization_failed");
    storage.setFailurePlan(null);
    const pending = await getDesignInterviewPracticeProjection();
    assert.equal(pending.feedback, null, "durable journal response cannot reveal authored feedback before materialization");
    assert.equal(pending.response?.source, "committed");
    assert.equal((await getTrainingAttempts()).value.length, 0);
    assert.equal((await getReviewQueueItems()).value.length, 0);
    assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true);

    await getTrainingLifecycleUseCases().recoverActiveTrainingOperation();
    const recovered = await getDesignInterviewPracticeProjection();
    const expected = projectCanonicalChoiceFeedbackMessages(question, response) ?? Object.freeze([]);
    assert.deepEqual(recovered.feedback?.messages, expected);
    assert.equal(Object.isFrozen(recovered.feedback?.messages), true);
    assert.equal((await getTrainingAttempts()).value.length, 1);
    assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
  }
});

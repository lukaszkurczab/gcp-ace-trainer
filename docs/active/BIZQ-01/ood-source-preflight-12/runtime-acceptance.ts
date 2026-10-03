import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CanonicalTrainingRuntime } from "../../../../src/application/canonical/CanonicalTrainingRuntime";
import { prepareCanonicalOptionOrder } from "../../../../src/application/canonical/canonicalOptionOrder";
import { projectCanonicalChoiceFeedbackMessages } from "../../../../src/application/canonical/canonicalInteractionPresentation";
import { composeTrainingLifecycleUseCases } from "../../../../src/application/bootstrap/trainingLifecycleComposition";
import { getDesignInterviewPracticeProjection, submitDesignInterviewPracticeResponse } from "../../../../src/application/design-interview/designInterviewSessionFacade";
import { getForegroundSessionTimerFacade } from "../../../../src/application/trainingLifecycle";
import { commitTrainingSessionStart } from "../../../../src/application/learningMutations";
import { scoreCanonicalQuestion } from "../../../../src/content/canonical/questionScoring";
import { loadCanonicalRuntimeCatalog } from "../../../../src/content/canonical/runtimeCatalog";
import type { CanonicalTrackRuntime } from "../../../../src/content/canonical/runtimeCatalog";
import { createContentSessionPlanFingerprint } from "../../../../src/content/application/contentSessionIdentity";
import { createTrainingSession } from "../../../../src/domain";
import type { CanonicalQuestionResponse, Question } from "../../../../src/content/canonical/questionTypes";
import { getTrainingAttempts } from "../../../../src/storage/repositories";
import { STORAGE_KEYS } from "../../../../src/storage/keys";
import { installMemoryStorage } from "../../../../src/testing/journalTestSupport";

const TRACK_ID = "object-oriented-design-interview";
const MODE_ID = "design-interview-learn-framework";
const REPLACEMENT_ID = "ood-n01-b01-i019";
const RETIRED_ID = "ood-n01-b01-i002";
const PRESERVED_ID = "ood-n01-b01-i018";
const PREVIOUS_VERSION = "object-oriented-design-interview-authoring-v2026.10.03-bizq01-11";
const PREVIOUS_ARTIFACT_SHA256 = "49e1bce7fe393145e04d46e4c3220b991c3f869be705e12cccdc2026490b08c4";
const NOW = "2026-10-03T12:00:00.000Z";

function choice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

async function preparedPinnedSession(track: CanonicalTrackRuntime, sessionId: string, question: Extract<Question, { interaction: { type: "choice_single" } }>) {
  const runtime = new CanonicalTrainingRuntime(track);
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: MODE_ID, request: { sessionId, requestedLength: 1 }, attempts: [], reviews: [], now: NOW });
  assert.ok(track.getPool(MODE_ID).some((candidate) => candidate.questionId === question.questionId));
  const first = prepared.session.itemOrder[0];
  assert.ok(first);
  const itemOrder = prepared.session.itemOrder.map((entry, index) => index === 0
    ? { ...entry, item: { ...entry.item, questionId: question.questionId } }
    : entry);
  const optionOrderByOccurrence = {
    ...prepared.session.optionOrderByOccurrence,
    [first.occurrenceId]: prepareCanonicalOptionOrder(question, first.occurrenceId, itemOrder[0]!.item),
  };
  const unpinned = createTrainingSession({ ...prepared.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined });
  const session = createTrainingSession({
    ...unpinned,
    taxonomyVersion: "canonical-content-v1",
    planFingerprint: await createContentSessionPlanFingerprint({ ...unpinned, taxonomyVersion: "canonical-content-v1" }),
  });
  await runtime.validateResume({ session, draft: null });
  return { runtime, session };
}

async function runResponse(track: CanonicalTrackRuntime, question: Extract<Question, { interaction: { type: "choice_single" } }>, optionId: string, index: number) {
  const storage = installMemoryStorage();
  const sessionId = `bizq01-ood-source12-${index}`;
  const { session } = await preparedPinnedSession(track, sessionId, question);
  const occurrenceId = session.itemOrder[0]?.occurrenceId;
  assert.ok(occurrenceId);
  const visibleOptionOrder = session.optionOrderByOccurrence[occurrenceId];
  assert.deepEqual(new Set(visibleOptionOrder), new Set(question.interaction.options.map((option) => option.optionId)));
  const dependencies = {
    wallClock: { now: () => NOW },
    sessionIds: { create: async () => sessionId },
    // The probe verifies memory-backed lifecycle delivery, not provider Premium authorization.
    premiumSessionAdmission: { authorize: async () => "allowed" as const },
  };
  await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
  composeTrainingLifecycleUseCases(dependencies);
  await getForegroundSessionTimerFacade().initialize(session);
  const before = await getDesignInterviewPracticeProjection();
  assert.equal(before.feedback, null, "authored feedback is absent before submission");
  assert.equal(before.question.questionId, REPLACEMENT_ID);

  const response: CanonicalQuestionResponse = { type: "choice_single", optionId };
  const score = scoreCanonicalQuestion(question, response);
  const expected = projectCanonicalChoiceFeedbackMessages(question, response) ?? Object.freeze([]);
  await submitDesignInterviewPracticeResponse(response);
  const attempts = (await getTrainingAttempts()).value;
  assert.equal(attempts.length, 1);
  assert.deepEqual(attempts[0]?.response, response);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);

  composeTrainingLifecycleUseCases(dependencies);
  const after = await getDesignInterviewPracticeProjection();
  assert.equal(after.session.contentVersion, track.contentVersion);
  assert.equal(after.session.artifactSha256, track.artifactSha256);
  assert.equal(after.question.questionId, REPLACEMENT_ID, "rebind resolves the exact new item identity");
  assert.equal(after.feedback?.result, score.kind);
  assert.equal(after.feedback?.reason, question.feedback.reason, "facade retains the exact authored Reason after materialization/rebind");
  assert.deepEqual(after.feedback?.details, question.feedback.details, "facade retains the exact authored Details after materialization/rebind");
  assert.deepEqual(after.feedback?.messages, expected);
  if (optionId === question.answer.optionId) assert.deepEqual(after.feedback?.messages, []);
  else {
    const authored = question.feedback.messages?.find((message) => message.kind === "wrong_option" && message.targetId === optionId);
    assert.ok(authored);
    assert.equal(after.feedback?.messages?.[0]?.text, authored.text);
  }
  return Object.freeze({ optionId, visibleOptionOrder, score: score.kind, exactMessages: after.feedback?.messages, exactReason: after.feedback?.reason, exactDetails: after.feedback?.details, sessionVersion: after.session.contentVersion, artifactSha256: after.session.artifactSha256 });
}

async function main(): Promise<void> {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK_ID);
  const question = track.getQuestion(REPLACEMENT_ID);
  assert.ok(question && choice(question), `app consumer contains ${REPLACEMENT_ID}`);
  assert.equal(track.getQuestion(RETIRED_ID), undefined);
  assert.ok(track.getQuestion(PRESERVED_ID), "accepted source11 replacement remains alongside i019");
  assert.ok(track.getPool(MODE_ID).some((candidate) => candidate.questionId === REPLACEMENT_ID));
  assert.ok(!track.getPool(MODE_ID).some((candidate) => candidate.questionId === RETIRED_ID));
  assert.notEqual(track.contentVersion, PREVIOUS_VERSION, "source replacement has an immutable new content version");
  assert.notEqual(track.artifactSha256, PREVIOUS_ARTIFACT_SHA256, "source replacement changes the exact artifact identity");

  const optionIds = question.interaction.options.map((option) => option.optionId);
  const wrongIds = optionIds.filter((id) => id !== question.answer.optionId);
  assert.equal(optionIds.length, 4);
  assert.equal(wrongIds.length, 3);
  assert.deepEqual(new Set(question.feedback.messages?.filter((message) => message.kind === "wrong_option").map((message) => message.targetId)), new Set(wrongIds));
  const cases = [];
  for (const optionId of [question.answer.optionId, ...wrongIds]) cases.push(await runResponse(track, question, optionId, cases.length + 1));

  const runtime = new CanonicalTrainingRuntime(track);
  const staleStorage = installMemoryStorage();
  const staleAttemptsBefore = (await getTrainingAttempts()).value;
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: MODE_ID, request: { sessionId: "bizq01-ood-source12-retired-pin", requestedLength: 1 }, attempts: [], reviews: [], now: NOW });
  const first = prepared.session.itemOrder[0];
  assert.ok(first);
  const staleUnpinned = createTrainingSession({
    ...prepared.session,
    contentVersion: PREVIOUS_VERSION,
    artifactSha256: PREVIOUS_ARTIFACT_SHA256,
    itemOrder: prepared.session.itemOrder.map((entry, index) => index === 0 ? {
      ...entry,
      item: { ...entry.item, questionId: RETIRED_ID, contentVersion: PREVIOUS_VERSION, artifactSha256: PREVIOUS_ARTIFACT_SHA256 },
    } : entry),
    planFingerprint: undefined,
    taxonomyVersion: undefined,
  });
  const staleSession = createTrainingSession({
    ...staleUnpinned,
    taxonomyVersion: "canonical-content-v1",
    planFingerprint: await createContentSessionPlanFingerprint({ ...staleUnpinned, taxonomyVersion: "canonical-content-v1" }),
  });
  await assert.rejects(() => runtime.validateResume({ session: staleSession, draft: null }), /Canonical session content identity is unavailable/u);
  assert.deepEqual((await getTrainingAttempts()).value, staleAttemptsBefore, "retired exact-pin rejection writes no attempt");
  assert.equal(staleStorage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false, "retired exact-pin rejection creates no active journal");

  const sourcePath = path.resolve("../patternly-content/content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json");
  const sourceQuestions = JSON.parse(readFileSync(sourcePath, "utf8")) as readonly Question[];
  assert.ok(sourceQuestions.some((item) => item.questionId === REPLACEMENT_ID));
  assert.ok(!sourceQuestions.some((item) => item.questionId === RETIRED_ID));
  assert.ok(sourceQuestions.some((item) => item.questionId === PRESERVED_ID));

  console.log(JSON.stringify({
    evidence: "actual app bundled loader, canonical runtime prepare/resume, memory journal, Design facade submit, repository materialization, lifecycle rebind",
    trackId: TRACK_ID,
    modeId: MODE_ID,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
    replacementId: REPLACEMENT_ID,
    retiredIdAbsent: true,
    existingImmediatePoolEligible: true,
    staleVersionArtifactQuestionPinRejected: true,
    cases,
    boundaries: ["memory repositories; no native store/provider claim", "Premium authorizer is an explicit test stub", "existing N01-scoped eligible pool; direct pinned fixture does not establish random automatic selection", "denied Premium-before-prepare behavior is covered by existing premiumProductModeLifecycle tests"],
  }, null, 2));
}

void main();

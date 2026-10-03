import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { CanonicalTrainingRuntime } from "../../../../src/application/canonical/CanonicalTrainingRuntime";
import { prepareCanonicalOptionOrder } from "../../../../src/application/canonical/canonicalOptionOrder";
import { composeTrainingLifecycleUseCases } from "../../../../src/application/bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../../../../src/application/contentPackageRuntimeOwner";
import {
  getDesignInterviewPracticeProjection,
  submitDesignInterviewPracticeResponse,
} from "../../../../src/application/design-interview/designInterviewSessionFacade";
import { getForegroundSessionTimerFacade } from "../../../../src/application/trainingLifecycle";
import { commitTrainingSessionStart } from "../../../../src/application/learningMutations";
import { projectCanonicalChoiceFeedbackMessages } from "../../../../src/application/canonical/canonicalInteractionPresentation";
import { scoreCanonicalQuestion } from "../../../../src/content/canonical/questionScoring";
import { createContentSessionPlanFingerprint } from "../../../../src/content/application/contentSessionIdentity";
import { createTrainingSession } from "../../../../src/domain";
import type { CanonicalTrackRuntime } from "../../../../src/content/canonical/runtimeCatalog";
import type { CanonicalQuestionResponse, Question } from "../../../../src/content/canonical/questionTypes";
import { getTrainingAttempts } from "../../../../src/storage/repositories";
import { STORAGE_KEYS } from "../../../../src/storage/keys";
import { installMemoryStorage } from "../../../../src/testing/journalTestSupport";

const NOW = "2026-10-03T12:00:00.000Z";
const TRACK_ID = "backend-system-design-interview";
const MODE_ID = "design-interview-learn-framework";
const QUESTION_ID = "besd-n01-b01-i001";
const DIRECT_REPLACEMENTS = Object.freeze(["besd-n02-b01-i017", "besd-n04-b01-i019"]);
const DESIGN_TRACK_IDS = Object.freeze([
  "backend-system-design-interview",
  "frontend-system-design-interview",
  "object-oriented-design-interview",
]);
const DESIGN_MODE_IDS = Object.freeze([
  "design-interview-learn-framework",
  "design-interview-tradeoff-practice",
  "design-interview-weak-area-review",
]);
const SOURCE_PATHS = Object.freeze([
  "src/application/canonical/CanonicalTrainingRuntime.ts",
  "src/application/canonical/canonicalInteractionPresentation.ts",
  "src/application/design-interview/designInterviewSessionFacade.ts",
  "src/features/practice/DesignInterviewPracticeScreen.tsx",
  "src/content/canonical/productModeConfig.ts",
  "src/content/generated/canonical-content/backend-system-design-interview.json",
  "src/content/generated/canonical-content/frontend-system-design-interview.json",
  "src/content/generated/canonical-content/object-oriented-design-interview.json",
]);

type AuthoredMessage = Readonly<{ kind: string; targetId: string; text: string }>;

function messagePayload(feedback: unknown): Readonly<{ present: boolean; messages: readonly AuthoredMessage[] }> {
  if (!feedback || typeof feedback !== "object" || !("messages" in feedback)) return Object.freeze({ present: false, messages: Object.freeze([]) });
  const value = (feedback as { messages?: unknown }).messages;
  return Object.freeze({ present: true, messages: Array.isArray(value) ? value as AuthoredMessage[] : Object.freeze([]) });
}

function sourceHashes(): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(SOURCE_PATHS.map((relativePath) => [
    relativePath,
    createHash("sha256").update(readFileSync(path.resolve(process.cwd(), relativePath))).digest("hex"),
  ])));
}

function countChoiceMessages(questions: readonly Question[]) {
  const single = questions.filter((question) => question.interaction.type === "choice_single");
  const multiple = questions.filter((question) => question.interaction.type === "choice_multiple");
  const countKind = (items: readonly Question[], kind: string) => items.reduce((count, question) => count + (question.feedback.messages ?? []).filter((message) => message.kind === kind).length, 0);
  return Object.freeze({
    choiceSingle: single.length,
    singleWithMessages: single.filter((question) => Boolean(question.feedback.messages?.length)).length,
    wrongOptionMessages: countKind(single, "wrong_option"),
    choiceMultiple: multiple.length,
    multipleWithMessages: multiple.filter((question) => Boolean(question.feedback.messages?.length)).length,
    omittedOptionMessages: countKind(multiple, "omitted_option"),
  });
}

function countTrackMessages(track: CanonicalTrackRuntime) {
  return Object.freeze({
    trackId: track.trackId,
    contentVersion: track.contentVersion,
    ...countChoiceMessages(track.questions),
  });
}

function countPool(track: CanonicalTrackRuntime, modeId: string) {
  const pool = track.getPool(modeId);
  return Object.freeze({
    modeId,
    selection: track.getMode(modeId).selection,
    poolSize: pool.length,
    ...countChoiceMessages(pool),
    includedProbe: pool.some((question) => question.questionId === QUESTION_ID),
    includesN02Replacement: pool.some((question) => question.questionId === DIRECT_REPLACEMENTS[0]),
    includesN04Replacement: pool.some((question) => question.questionId === DIRECT_REPLACEMENTS[1]),
  });
}

async function runCase(track: CanonicalTrackRuntime, modeId: string, question: Question, label: "wrong-option" | "correct", index: number) {
  const storage = installMemoryStorage();
  const sessionId = `bizq01-design-choice-10-${index}`;
  const runtime = new CanonicalTrainingRuntime(track);
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId,
    request: { sessionId, requestedLength: 1 },
    attempts: [],
    reviews: [],
    now: NOW,
  });
  const pool = track.getPool(modeId);
  assert.ok(pool.some((candidate) => candidate.questionId === question.questionId), "the probe question must be eligible in the actual Design mode pool");
  const first = prepared.session.itemOrder[0];
  assert.ok(first, "the actual canonical runtime must prepare an occurrence");
  const itemOrder = prepared.session.itemOrder.map((entry, occurrenceIndex) => occurrenceIndex === 0
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
  assert.equal(session.trackId, track.trackId);
  assert.equal(session.contentVersion, track.contentVersion);
  assert.equal(session.artifactSha256, track.artifactSha256);
  assert.equal(session.itemOrder[0]?.item.questionId, question.questionId);
  await runtime.validateResume({ session, draft: null });

  await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
  const dependencies = {
    wallClock: { now: () => NOW },
    sessionIds: { create: async () => sessionId },
    // This memory-only probe does not exercise or claim provider Premium authorization.
    premiumSessionAdmission: { authorize: async () => "allowed" as const },
  };
  composeTrainingLifecycleUseCases(dependencies);
  await getForegroundSessionTimerFacade().initialize(session);
  const before = await getDesignInterviewPracticeProjection();
  assert.equal(before.session.id, sessionId);
  assert.equal(before.feedback, null, "feedback must remain absent before durable submission");

  if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("The current Design probe item must be choice_single.");
  const optionId = label === "correct"
    ? question.answer.optionId
    : question.feedback.messages?.find((message) => message.kind === "wrong_option")?.targetId;
  assert.ok(optionId, "the actual current item must contain an authored wrong-option target");
  const response: CanonicalQuestionResponse = { type: "choice_single", optionId };
  const expected = projectCanonicalChoiceFeedbackMessages(question, response) ?? Object.freeze([]);
  const score = scoreCanonicalQuestion(question, response);
  assert.equal(score.kind, label === "correct" ? "correct" : "incorrect");
  assert.equal(score.earnedPoints, label === "correct" ? 1 : 0);

  await submitDesignInterviewPracticeResponse(response);
  const attempts = (await getTrainingAttempts()).value;
  assert.equal(attempts.length, 1, "the Design facade submission must materialize one actual memory-backed attempt");
  assert.equal(attempts[0]?.sessionId, sessionId);
  assert.deepEqual(attempts[0]?.response, response);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false, "the submit journal must be cleared after materialization");

  composeTrainingLifecycleUseCases(dependencies);
  const after = await getDesignInterviewPracticeProjection();
  assert.equal(after.session.id, sessionId);
  assert.equal(after.feedback?.result, score.kind);
  const received = messagePayload(after.feedback);
  return Object.freeze({
    label,
    optionId,
    score,
    preSubmitFeedbackWasNull: before.feedback === null,
    persistedAttemptsAfterRebind: attempts.length,
    activeJournalAfterRebind: storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL),
    authoredHelperMessages: expected,
    facadeFeedbackKeys: after.feedback ? Object.keys(after.feedback).sort() : [],
    facadeMessagesFieldPresent: received.present,
    facadeMessages: received.messages,
    exactExistingHelperResultReachedFacade: expected.length === 0
      ? received.messages.length === 0
      : received.present && JSON.stringify(received.messages) === JSON.stringify(expected),
  });
}

async function main(): Promise<void> {
  const expectDelivered = process.argv.includes("--expect-delivered");
  assert.deepEqual(process.argv.slice(2).filter((argument) => argument !== "--expect-delivered"), [], "Only --expect-delivered is supported.");
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const { loadCanonicalRuntimeCatalog } = await import("../../../../src/content/canonical/runtimeCatalog");
  const catalog = await loadCanonicalRuntimeCatalog();
  const targetTrack = catalog.getTrack(TRACK_ID);
  const question = targetTrack.getQuestion(QUESTION_ID);
  assert.ok(question, `Missing bundled Backend N01 choice item ${QUESTION_ID}`);
  if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("The current probe item must be single choice.");
  assert.equal(targetTrack.getPool(MODE_ID).some((candidate) => candidate.questionId === QUESTION_ID), true);

  const inventories = DESIGN_TRACK_IDS.map((trackId) => {
    const track = catalog.getTrack(trackId);
    return Object.freeze({
      track: countTrackMessages(track),
      pools: Object.freeze(DESIGN_MODE_IDS.map((modeId) => countPool(track, modeId))),
    });
  });
  const directReplacementReachability = DIRECT_REPLACEMENTS.map((questionId) => {
    const replacement = targetTrack.getQuestion(questionId);
    assert.ok(replacement, `Missing admitted Backend replacement ${questionId} from the current app bundle`);
    return Object.freeze({
      questionId,
      mentalUnitId: replacement.mentalUnitId,
      interactionType: replacement.interaction.type,
      authoredMessageCount: replacement.feedback.messages?.length ?? 0,
      includedInDesignModes: Object.freeze(Object.fromEntries(DESIGN_MODE_IDS.map((modeId) => [modeId, targetTrack.getPool(modeId).some((candidate) => candidate.questionId === questionId)]))),
    });
  });

  const cases: Awaited<ReturnType<typeof runCase>>[] = [];
  for (const trackId of DESIGN_TRACK_IDS) {
    const track = catalog.getTrack(trackId);
    const eligibleChoice = track.getPool(MODE_ID).find((candidate) => candidate.interaction.type === "choice_single" && candidate.feedback.messages?.some((message) => message.kind === "wrong_option"));
    assert.ok(eligibleChoice, `Missing an eligible authored wrong-option question in ${trackId} / ${MODE_ID}`);
    cases.push(await runCase(track, MODE_ID, eligibleChoice, "wrong-option", cases.length + 1));
    cases.push(await runCase(track, MODE_ID, eligibleChoice, "correct", cases.length + 1));
  }
  const expectedRed = cases.flatMap((result) => result.exactExistingHelperResultReachedFacade
    ? []
    : [`${result.label}: Design facade did not preserve the existing choice helper payload after materialization`]);
  const report = Object.freeze({
    fixture: "first currently eligible authored wrong-option single-choice item in each of the three Design canonical pools; actual runtime-prepared occurrence pinned with canonical order and recomputed fingerprint, resume-validated, memory-journal-started, submitted through Design facade, and read after lifecycle rebind",
    mode: expectDelivered ? "acceptance: Design materialized feedback must equal the existing stable-ID choice helper result" : "observation only: baseline absence is historical evidence, not acceptance",
    designTracks: inventories,
    directBESDReplacementReachability: directReplacementReachability,
    probe: {
      trackId: targetTrack.trackId,
      contentVersion: targetTrack.contentVersion,
      artifactSha256: targetTrack.artifactSha256,
      modeId: MODE_ID,
      questionsByTrack: DESIGN_TRACK_IDS.map((trackId) => {
        const track = catalog.getTrack(trackId);
        const eligibleChoice = track.getPool(MODE_ID).find((candidate) => candidate.interaction.type === "choice_single" && candidate.feedback.messages?.some((message) => message.kind === "wrong_option"));
        assert.ok(eligibleChoice);
        return Object.freeze({
          trackId,
          contentVersion: track.contentVersion,
          artifactSha256: track.artifactSha256,
          modeId: MODE_ID,
          selection: track.getMode(MODE_ID).selection,
          poolSize: track.getPool(MODE_ID).length,
          questionId: eligibleChoice.questionId,
          mentalUnitId: eligibleChoice.mentalUnitId,
          authoredWrongOptionTargets: eligibleChoice.feedback.messages?.filter((message) => message.kind === "wrong_option").map((message) => message.targetId) ?? [],
        });
      }),
    },
    cases,
    sourceSha256: sourceHashes(),
    expectedRed,
  });
  console.log(JSON.stringify(report, null, 2));
  if (expectDelivered && expectedRed.length > 0) process.exitCode = 1;
}

void main();

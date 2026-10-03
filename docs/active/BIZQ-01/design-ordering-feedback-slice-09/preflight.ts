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
import { getForegroundSessionTimerFacade, getTrainingLifecycleUseCases, TrainingApplicationFailure } from "../../../../src/application/trainingLifecycle";
import { commitTrainingSessionStart } from "../../../../src/application/learningMutations";
import { scoreCanonicalQuestion } from "../../../../src/content/canonical/questionScoring";
import { createContentSessionPlanFingerprint } from "../../../../src/content/application/contentSessionIdentity";
import { createTrainingSession } from "../../../../src/domain";
import type { CanonicalTrackRuntime } from "../../../../src/content/canonical/runtimeCatalog";
import { getTrainingAttempts, getReviewQueueItems } from "../../../../src/storage/repositories";
import { STORAGE_KEYS } from "../../../../src/storage/keys";
import { installMemoryStorage } from "../../../../src/testing/journalTestSupport";
import type { CanonicalQuestionResponse, Question } from "../../../../src/content/canonical/questionTypes";

const NOW = "2026-10-03T12:00:00.000Z";
const TRACK_ID = "frontend-system-design-interview";
const QUESTION_ID = "fesd-n01-b01-i003";
const MODE_ID = "design-interview-learn-framework";
const EXPECTED_ORDER = Object.freeze(["observe", "preserve", "expose", "recover"]);
const SOURCE_PATHS = Object.freeze([
  "src/application/canonical/CanonicalTrainingRuntime.ts",
  "src/application/design-interview/designInterviewSessionFacade.ts",
  "src/features/practice/DesignInterviewPracticeScreen.tsx",
  "src/content/generated/canonical-content/frontend-system-design-interview.json",
]);

type AuthoredMessage = Readonly<{ kind: string; targetId: string; text: string }>;
type ProbeCase = Readonly<{ name: string; orderedElementIds: readonly string[]; expectedEarnedPoints: number; reject?: boolean; failure?: "journal" | "attempt" }>;

const cases: readonly ProbeCase[] = Object.freeze([
  { name: "correct", orderedElementIds: EXPECTED_ORDER, expectedEarnedPoints: 3 },
  { name: "swap-last-two", orderedElementIds: ["observe", "preserve", "recover", "expose"], expectedEarnedPoints: 1 },
  { name: "shift-preserved-block", orderedElementIds: ["expose", "recover", "observe", "preserve"], expectedEarnedPoints: 2 },
]);

function pairs(order: readonly string[]): ReadonlySet<string> {
  return new Set(order.slice(0, -1).map((left, index) => `${left}->${order[index + 1]}`));
}

function expectedMessages(question: Question, response: CanonicalQuestionResponse): readonly AuthoredMessage[] {
  if (response.type !== "ordering") throw new Error("The probe response must be an ordering response.");
  const preserved = pairs(response.orderedElementIds);
  return Object.freeze((question.feedback.messages ?? []).filter((message) =>
    message.kind === "broken_relation" && !preserved.has(message.targetId),
  ));
}

function sourceHashes(): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(SOURCE_PATHS.map((relativePath) => {
    const bytes = readFileSync(path.resolve(process.cwd(), relativePath));
    return [relativePath, createHash("sha256").update(bytes).digest("hex")];
  })));
}

function actualMessages(feedback: unknown): readonly AuthoredMessage[] {
  if (!feedback || typeof feedback !== "object" || !("messages" in feedback)) return Object.freeze([]);
  const messages = (feedback as { messages?: unknown }).messages;
  return Array.isArray(messages) ? messages as AuthoredMessage[] : Object.freeze([]);
}

async function runCase(
  track: CanonicalTrackRuntime,
  question: Question,
  testCase: ProbeCase,
  index: number,
): Promise<Readonly<Record<string, unknown>>> {
  const storage = installMemoryStorage();
  const sessionId = `bizq01-design-ordering-09-${index}`;
  const runtime = new CanonicalTrainingRuntime(track);
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId: MODE_ID,
    request: { sessionId, requestedLength: 1 },
    attempts: [],
    reviews: [],
    now: NOW,
  });
  const pool = track.getPool(MODE_ID);
  assert.ok(pool.some((candidate) => candidate.questionId === question.questionId), "the loaded question must be eligible in the actual Design mode pool");
  const first = prepared.session.itemOrder[0];
  assert.ok(first, "the actual canonical runtime must prepare an item occurrence");
  const itemOrder = prepared.session.itemOrder.map((entry, itemIndex) => itemIndex === 0
    ? { ...entry, item: { ...entry.item, questionId: question.questionId } }
    : entry);
  const optionOrderByOccurrence = {
    ...prepared.session.optionOrderByOccurrence,
    [first.occurrenceId]: prepareCanonicalOptionOrder(question, first.occurrenceId, first.item),
  };
  const unpinned = createTrainingSession({
    ...prepared.session,
    itemOrder,
    optionOrderByOccurrence,
    planFingerprint: undefined,
    taxonomyVersion: undefined,
  });
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
    // The fixture does not exercise or claim provider Premium authorization.
    premiumSessionAdmission: { authorize: async () => "allowed" as const },
  };
  composeTrainingLifecycleUseCases(dependencies);
  await getForegroundSessionTimerFacade().initialize(session);

  const before = await getDesignInterviewPracticeProjection();
  assert.equal(before.session.id, sessionId);
  assert.equal(before.feedback, null, "feedback must remain absent before a durable answer");

  const response: CanonicalQuestionResponse = { type: "ordering", orderedElementIds: testCase.orderedElementIds };
  if (testCase.reject) {
    await assert.rejects(() => submitDesignInterviewPracticeResponse(response), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "invalid_response");
    assert.equal((await getTrainingAttempts()).value.length, 0, "invalid facade submit must not materialize an attempt");
    assert.equal((await getReviewQueueItems()).value.length, 0, "invalid facade submit must not mutate review evidence");
    assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false, "invalid submit leaves no active outcome journal");
    const rejected = await getDesignInterviewPracticeProjection();
    assert.equal(rejected.feedback, null, "invalid submit cannot reveal authored diagnostics");
    assert.equal(rejected.response, null, "invalid submit cannot become a committed response");
    assert.equal(rejected.session.currentItemIndex, session.currentItemIndex);
    return Object.freeze({ name: testCase.name, stage: "actual Design facade invalid submission", rejected: true, persistedAttempts: 0, reviewEntries: 0, activeJournal: false, response: null, feedback: null, expectedMessagesDelivered: true, scope: "foreground-time checkpoint may change; no whole-store preservation claim" });
  }
  const score = scoreCanonicalQuestion(question, response);
  assert.equal(score.earnedPoints, testCase.expectedEarnedPoints, "the actual canonical scorer must demonstrate the intended relation-preservation case");
  if (testCase.failure) {
    // Isolate the outcome boundary after the same foreground checkpoint used by the facade.
    await getForegroundSessionTimerFacade().checkpointForResponseSave(session);
    const projectedOutcome = await runtime.submitPractice({ session, response, attempts: [], reviews: [], now: NOW });
    const key = testCase.failure === "journal" ? STORAGE_KEYS.ACTIVE_JOURNAL : STORAGE_KEYS.trainingAttempt(projectedOutcome.attempt.id);
    storage.setFailurePlan({ kind: "fail_on_key_write", key });
    const category = testCase.failure === "journal" ? "submit_journal_failed" : "commit_materialization_failed";
    await assert.rejects(() => getTrainingLifecycleUseCases().submitPracticeResponse(response), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === category);
    storage.setFailurePlan(null);
    const failed = await getDesignInterviewPracticeProjection();
    assert.equal(failed.feedback, null, "outcome journal alone or failed write cannot reveal feedback");
    assert.equal((await getTrainingAttempts()).value.length, 0);
    assert.equal((await getReviewQueueItems()).value.length, 0);
    const durable = testCase.failure === "attempt";
    assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), durable);
    assert.equal(failed.response?.source ?? null, durable ? "committed" : null);
    assert.equal(failed.operation.kind, category);
    let recoveredMessages: readonly AuthoredMessage[] | null = null;
    if (durable) {
      await getTrainingLifecycleUseCases().recoverActiveTrainingOperation();
      const recovered = await getDesignInterviewPracticeProjection();
      recoveredMessages = actualMessages(recovered.feedback);
      assert.deepEqual(recoveredMessages, expectedMessages(question, response));
      assert.equal((await getTrainingAttempts()).value.length, 1);
      assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
    }
    return Object.freeze({ name: testCase.name, stage: category, beforeMaterialization: { attemptCount: 0, reviewCount: 0, feedback: null, responseSource: durable ? "committed" : null, activeJournal: durable }, afterRecovery: durable ? { attemptCount: 1, activeJournal: false, messages: recoveredMessages } : null, expectedMessagesDelivered: true, scope: "composed lifecycle outcome boundary after actual facade foreground checkpoint; memory fault injection, not SDK/native interruption" });
  }
  await submitDesignInterviewPracticeResponse(response);
  const attempts = (await getTrainingAttempts()).value;
  assert.equal(attempts.length, 1, "the Design facade submission must materialize one memory-backed attempt");
  assert.equal(attempts[0]?.sessionId, sessionId);
  assert.deepEqual(attempts[0]?.response, response);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false, "the submit journal must be cleared after materialization");

  // Reinstall the lifecycle read model over the same in-memory repositories, as on a local rebind.
  composeTrainingLifecycleUseCases(dependencies);
  const after = await getDesignInterviewPracticeProjection();
  assert.equal(after.session.id, sessionId);
  assert.equal(after.feedback?.result, score.kind);
  const expected = expectedMessages(question, response);
  const actual = actualMessages(after.feedback);
  return Object.freeze({
    name: testCase.name,
    response: testCase.orderedElementIds,
    preservedRelations: [...pairs(testCase.orderedElementIds)],
    expectedEarnedPoints: testCase.expectedEarnedPoints,
    actualScore: score,
    persistedAttemptsAfterRebind: attempts.length,
    activeJournalAfterRebind: storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL),
    authoredBrokenRelationMessages: expected,
    facadeFeedbackKeys: after.feedback ? Object.keys(after.feedback).sort() : [],
    facadeMessages: actual,
    expectedMessagesDelivered: JSON.stringify(actual) === JSON.stringify(expected),
  });
}

async function main(): Promise<void> {
  const expectDelivered = process.argv.includes("--expect-delivered");
  const unsupportedArguments = process.argv.slice(2).filter((argument) => argument !== "--expect-delivered");
  assert.deepEqual(unsupportedArguments, [], "Only --expect-delivered is supported.");

  await contentPackageRuntimeOwner.verifyBundledPackages();
  const { loadCanonicalRuntimeCatalog } = await import("../../../../src/content/canonical/runtimeCatalog");
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK_ID);
  const question = track.getQuestion(QUESTION_ID);
  assert.ok(question, `Missing current frontend Design question ${QUESTION_ID}`);
  if (question.interaction.type !== "ordering" || question.answer.type !== "ordering") throw new Error("The current Design probe item must be ordering.");
  assert.deepEqual(question.answer.orderedElementIds, EXPECTED_ORDER);
  assert.ok(question.feedback.messages?.some((message) => message.kind === "broken_relation" && message.targetId === "preserve->expose"));
  const mode = track.getMode(MODE_ID);
  assert.equal(mode.selection.kind, "node");
  assert.equal(track.getPool(MODE_ID).some((candidate) => candidate.questionId === QUESTION_ID), true);

  const collected: Readonly<Record<string, unknown>>[] = [];
  for (const [index, testCase] of cases.entries()) collected.push(await runCase(track, question, testCase, index + 1));
  if (expectDelivered) {
    const sparse = [...EXPECTED_ORDER];
    delete sparse[1];
    const inherited = [...EXPECTED_ORDER];
    delete inherited[1];
    Object.setPrototypeOf(inherited, Object.assign(Object.create(Array.prototype), { 1: EXPECTED_ORDER[1] }));
    for (const [index, entry] of [{ name: "reject-sparse", orderedElementIds: sparse }, { name: "reject-inherited-hole", orderedElementIds: inherited }].entries()) {
      collected.push(await runCase(track, question, { ...entry, expectedEarnedPoints: 0, reject: true }, cases.length + index + 1));
    }
  }
  if (expectDelivered) {
    for (const [index, failure] of (["journal", "attempt"] as const).entries()) {
      collected.push(await runCase(track, question, { name: `fail-${failure}-write`, orderedElementIds: ["expose", "recover", "observe", "preserve"], expectedEarnedPoints: 2, failure }, cases.length + 3 + index));
    }
  }
  const results: readonly Readonly<Record<string, unknown>>[] = Object.freeze(collected);
  const expectedRed = results.flatMap((result) => {
    const expected = result.expectedMessagesDelivered === true;
    return expected || result.name === "correct" ? [] : [`${String(result.name)}: Design facade omitted selected authored broken_relation messages`];
  });
  const report = Object.freeze({
    fixture: "current locked frontend Design canonical artifact; exact pool-eligible question pinned into a canonical-runtime-prepared session, resume-validated, memory-journal-started, submitted through Design facade, then read after lifecycle rebind",
    mode: expectDelivered ? "acceptance: selected authored broken_relation messages must reach materialized Design feedback" : "observation only: baseline absence is historical evidence, not acceptance",
    track: { trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    question: { questionId: question.questionId, nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, correctOrder: question.answer.orderedElementIds },
    eligibleMode: { modeId: mode.modeId, selection: mode.selection, poolSize: track.getPool(MODE_ID).length, containsQuestion: true },
    cases: results,
    sourceSha256: sourceHashes(),
    expectedRed,
  });

  console.log(JSON.stringify(report, null, 2));
  if (expectDelivered && expectedRed.length > 0) process.exitCode = 1;
}

void main();

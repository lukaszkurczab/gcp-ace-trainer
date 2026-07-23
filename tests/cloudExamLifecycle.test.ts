import assert from "node:assert/strict";
import test from "node:test";

import {
  completeCertificationPracticeSession,
  finalizeCertificationExam,
  getCertificationExamProjection,
  getCertificationPracticeProjection,
  navigateCertificationExamTo,
  saveCertificationExamResponse,
  startCertificationExam,
  startCertificationSession,
  submitCertificationPracticeResponse,
} from "../src/application/certification";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { validateBundledContent } from "../src/content/application";
import { getCertificationContentCatalog } from "../src/content/catalogRepository";
import { getActiveTrainingSession, getActiveTrainingSessionDraft, getReviewQueueItems, getTrainingAttempts, getTrainingSessionResult } from "../src/storage/repositories";
import { installMemoryStorage } from "./journalTestSupport";

class MutableClock {
  constructor(private value: string) {}
  now = () => this.value;
  set(value: string) { this.value = value; }
}

function response(question: Awaited<ReturnType<typeof getCertificationExamProjection>>["question"], correct: boolean) {
  const selectedOptionIds = correct
    ? question.correctOptionIds
    : [question.options.find((option) => !question.correctOptionIds.includes(option.id))?.id ?? (() => { throw new Error(`No explicitly incorrect option exists for ${question.id}.`); })()];
  return { kind: "option_selection" as const, selectedOptionIds };
}

async function prepare(clock = new MutableClock("2026-07-23T10:00:00.000Z")) {
  await validateBundledContent();
  installMemoryStorage();
  const lifecycle = composeTrainingLifecycleUseCases({ wallClock: clock });
  return { clock, lifecycle };
}

async function answerExamThrough(lastOrdinal: number, expectedCorrect: (ordinal: number) => boolean, firstOrdinal = 1) {
  for (let ordinal = firstOrdinal; ordinal <= lastOrdinal; ordinal += 1) {
    const projection = await getCertificationExamProjection();
    assert.equal(projection.ordinal, ordinal);
    await saveCertificationExamResponse({ occurrenceId: projection.occurrenceId, response: response(projection.question, expectedCorrect(ordinal)) });
    if (ordinal < lastOrdinal) await navigateCertificationExamTo(ordinal);
  }
}

test("Cloud Exam uses the pinned 360-item artifact for a durable exact 50-item mixed-score finalization", async () => {
  await prepare();
  const started = await startCertificationExam("cloud-exam-lifecycle-test");
  const catalog = getCertificationContentCatalog();
  const expected = ["setup_environment", "planning_implementation", "access_security", "operations"].flatMap((domain) =>
    [...catalog.getItems()].filter((question) => question.domain === domain).sort((left, right) => left.id.localeCompare(right.id)).slice(0, ({ setup_environment: 12, planning_implementation: 15, access_security: 13, operations: 10 } as const)[domain as "setup_environment" | "planning_implementation" | "access_security" | "operations"]),
  ).map((question) => question.id);

  assert.equal(started.session.actualLength, 50);
  assert.deepEqual(started.session.itemOrder.map((occurrence) => occurrence.item.itemId), expected);
  assert.equal(new Set(expected).size, 50);
  assert.equal(started.session.configurationSnapshot.timerDurationMs, 120 * 60 * 1000);
  const deadline = started.session.configurationSnapshot.timerDeadlineAt;
  assert.equal(typeof deadline, "string");

  await answerExamThrough(50, (ordinal) => ordinal <= 25);
  assert.equal((await getCertificationExamProjection()).session.configurationSnapshot.timerDeadlineAt, deadline);
  const sessionId = await finalizeCertificationExam();
  assert.equal(sessionId, started.session.id);

  const attempts = (await getTrainingAttempts()).value.filter((attempt) => attempt.sessionId === sessionId);
  const result = await getTrainingSessionResult(sessionId);
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(attempts.length, 50);
  assert.equal(new Set(attempts.map((attempt) => attempt.occurrenceId)).size, 50);
  assert.equal(attempts.filter((attempt) => attempt.result.kind === "correct").length, 25);
  assert.equal(attempts.filter((attempt) => attempt.result.kind === "incorrect").length, 25);
  assert.deepEqual(result?.answeredOccurrenceIds, started.session.itemOrder.map((occurrence) => occurrence.occurrenceId));
  assert.deepEqual(result?.unansweredOccurrenceIds, []);
  assert.equal((await getReviewQueueItems()).value.filter((entry) => entry.sourceSessionId === sessionId).length, 25);
});

test("Cloud Exam early, mid, and late recovery preserves immutable selection, deadline, draft, and ordinal", async () => {
  for (const checkpoint of [4, 25, 48]) {
    const { clock } = await prepare();
    const started = await startCertificationExam(`recovery-${checkpoint}`);
    await answerExamThrough(checkpoint, () => true);
    const before = await getCertificationExamProjection();
    const beforeDraft = await getActiveTrainingSessionDraft();

    const resumedLifecycle = composeTrainingLifecycleUseCases({ wallClock: clock });
    const resumed = await resumedLifecycle.resumeActiveSession();
    const after = await getCertificationExamProjection();
    const afterDraft = await getActiveTrainingSessionDraft();
    assert.equal(resumed.id, started.session.id);
    assert.equal(after.ordinal, checkpoint);
    assert.equal(after.session.configurationSnapshot.timerDeadlineAt, before.session.configurationSnapshot.timerDeadlineAt);
    assert.deepEqual(after.session.itemOrder, before.session.itemOrder);
    assert.deepEqual(afterDraft?.responsesByOccurrenceId, beforeDraft?.responsesByOccurrenceId);

    await answerExamThrough(50, () => true, checkpoint);
    assert.equal(await finalizeCertificationExam(), started.session.id);
  }
});

test("Cloud Exam expiry finalizes persisted answers once and never leaves an active resume", async () => {
  const { clock, lifecycle } = await prepare();
  const started = await startCertificationExam("expiry-test");
  await answerExamThrough(3, () => true);
  const deadline = String(started.session.configurationSnapshot.timerDeadlineAt);
  clock.set(new Date(Date.parse(deadline) + 1).toISOString());

  assert.equal(await lifecycle.finalizeExpiredSimulationIfDue(), started.session.id);
  assert.equal(await lifecycle.finalizeExpiredSimulationIfDue(), null);
  const result = await getTrainingSessionResult(started.session.id);
  const attempts = (await getTrainingAttempts()).value.filter((attempt) => attempt.sessionId === started.session.id);
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(attempts.length, 3);
  assert.equal(result?.unansweredOccurrenceIds.length, 47);
});

test("Cloud Due Review removes a due entry only after a correct due response and retains it after failure", async () => {
  const { clock } = await prepare();
  const first = await startCertificationSession({ modeId: "cloud-practice", requestedLength: 1, source: "due-review-test" });
  const firstProjection = await getCertificationPracticeProjection();
  await submitCertificationPracticeResponse(response(firstProjection.question, false));
  await completeCertificationPracticeSession();
  const dueAt = (await getReviewQueueItems()).value[0]?.dueAt;
  assert.ok(dueAt);
  clock.set(dueAt!);

  const dueSuccess = await startCertificationSession({ modeId: "cloud-review", source: "due-review-success" });
  const successProjection = await getCertificationPracticeProjection();
  assert.equal(successProjection.question.id, firstProjection.question.id);
  await submitCertificationPracticeResponse(response(successProjection.question, true));
  await completeCertificationPracticeSession();
  assert.equal((await getReviewQueueItems()).value.some((entry) => entry.sourceItem.itemId === firstProjection.question.id), false);

  const failedSource = await startCertificationSession({ modeId: "cloud-practice", requestedLength: 1, source: "due-review-failure" });
  const failedSourceProjection = await getCertificationPracticeProjection();
  await submitCertificationPracticeResponse(response(failedSourceProjection.question, false));
  await completeCertificationPracticeSession();
  const failedDueAt = (await getReviewQueueItems()).value.find((entry) => entry.sourceSessionId === failedSource.session.id)?.dueAt;
  assert.ok(failedDueAt);
  clock.set(failedDueAt!);
  const dueFailure = await startCertificationSession({ modeId: "cloud-review", source: "due-review-failure-run" });
  const failureProjection = await getCertificationPracticeProjection();
  await submitCertificationPracticeResponse(response(failureProjection.question, false));
  await completeCertificationPracticeSession();
  assert.equal(dueFailure.session.modeId, "cloud-review");
  assert.equal((await getReviewQueueItems()).value.some((entry) => entry.sourceItem.itemId === failedSourceProjection.question.id), true);
});

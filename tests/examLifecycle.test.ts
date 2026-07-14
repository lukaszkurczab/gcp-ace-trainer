import AsyncStorage from "@react-native-async-storage/async-storage";
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createExamSession, getRemainingSeconds, isExamExpired, submitCertificationExam, toggleExamFlag, updateCurrentQuestionIndex, updateExamAnswer } from "../src/features/exam/examService";
import { getAttempts, getCertificationExam, getTrainingAttempts, getTrainingSessions } from "../src/storage";

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  Object.assign(AsyncStorage, {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => { memory.set(key, value); },
    removeItem: async (key: string) => { memory.delete(key); },
  });
});

async function create() {
  const result = await createExamSession();
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("Exam fixture could not be created.");
  return result.session;
}

test("exam creation persists canonical session, absolute deadline, item/option order, and resume position", async () => {
  const runtime = await create();
  assert.equal(runtime.session.status, "active");
  assert.equal(runtime.session.currentItemIndex, 0);
  assert.equal(runtime.session.itemOrder.length, 50);
  assert.equal(Object.keys(runtime.session.optionOrderByItem).length, 50);
  assert.equal(typeof runtime.examState.deadlineAt, "string");
  assert.equal((await getCertificationExam())?.session.id, runtime.session.id);
});

test("exam stores answer changes, flags, and canonical current position", async () => {
  const runtime = await create();
  const first = runtime.session.itemOrder[0]!.itemId;
  assert.deepEqual((await updateExamAnswer(first, ["A"]))?.examState.responsesByItemId[first]?.selectedOptionIds, ["A"]);
  assert.deepEqual((await updateExamAnswer(first, ["B"]))?.examState.responsesByItemId[first]?.selectedOptionIds, ["B"]);
  assert.equal((await toggleExamFlag(first))?.examState.flaggedItemIds.includes(first), true);
  assert.equal((await updateCurrentQuestionIndex(2))?.session.currentItemIndex, 2);
  assert.equal((await getCertificationExam())?.session.currentItemIndex, 2);
});

test("exam timeout uses persisted absolute deadline", async () => {
  const runtime = await create();
  const deadline = Date.parse(runtime.examState.deadlineAt);
  assert.equal(getRemainingSeconds(runtime, deadline - 1500), 2);
  assert.equal(isExamExpired(runtime, deadline), true);
});

test("an expired exam can follow the automatic final-submission path", async () => {
  const runtime = await create();
  assert.equal(isExamExpired(runtime, Date.parse(runtime.examState.deadlineAt)), true);
  const summary = await submitCertificationExam(true);
  assert.ok(summary);
  assert.equal(summary.unansweredQuestionIds.length, 50);
  assert.equal((await getTrainingSessions()).value.find((session) => session.id === runtime.session.id)?.status, "completed");
});

test("final submission preserves unanswered diagnostics, answer review projection, attempts, and completed session without pass inference", async () => {
  const runtime = await create();
  const first = runtime.session.itemOrder[0]!.itemId;
  await updateExamAnswer(first, [runtime.session.optionOrderByItem[first]![0]!]);
  await toggleExamFlag(first);
  const summary = await submitCertificationExam();
  assert.ok(summary);
  assert.equal(summary.questionCount, 50);
  assert.equal(summary.answers.length, 50);
  assert.equal(summary.unansweredQuestionIds.length, 49);
  assert.equal(summary.flaggedQuestionIds.includes(first), true);
  assert.equal("passedTrainingThreshold" in summary, false);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal((await getTrainingSessions()).value.find((session) => session.id === runtime.session.id)?.status, "completed");
  const restoredSummary = (await getAttempts()).find((item) => item.id === runtime.session.id);
  assert.equal(restoredSummary?.flaggedQuestionIds.includes(first), true);
  assert.equal(restoredSummary?.answers.find((answer) => answer.questionId === first)?.wasFlagged, true);
  assert.equal(await getCertificationExam(), null);
});

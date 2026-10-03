import assert from "node:assert/strict";
import test from "node:test";

import { loadCanonicalRuntimeCatalog, isCanonicalResponseComplete, scoreCanonicalQuestion, type Question } from "../../content/canonical";
import { projectCanonicalOrderingFeedbackMessages } from "./canonicalInteractionPresentation";

const target = Object.freeze({
  questionId: "fesd-n01-b01-i003",
  trackId: "frontend-system-design-interview",
});
const correctOrder = ["observe", "preserve", "expose", "recover"];
const catalogPromise = loadCanonicalRuntimeCatalog();

function permutations<T>(values: readonly T[]): T[][] {
  return values.length === 0 ? [[]] : values.flatMap((value, index) => permutations(values.filter((_, position) => position !== index)).map((tail) => [value, ...tail]));
}

function expectedBrokenMessages(question: Question, orderedElementIds: readonly string[]) {
  const adjacent = new Set(orderedElementIds.slice(0, -1).map((id, index) => `${id}->${orderedElementIds[index + 1]}`));
  return question.feedback.messages?.filter((message) => message.kind === "broken_relation" && !adjacent.has(message.targetId));
}

test("actual Frontend Design ordering feedback follows missing adjacent relations across all legal permutations", async () => {
  const question = (await catalogPromise).getTrack(target.trackId).getQuestion(target.questionId)!;
  assert.ok(question && question.interaction.type === "ordering");
  const orderingQuestion = question as Extract<Question, { interaction: { type: "ordering" } }>;
  assert.deepEqual(orderingQuestion.answer.orderedElementIds, correctOrder);
  const authoredRelations = question.feedback.messages?.filter((message) => message.kind === "broken_relation") ?? [];
  assert.deepEqual(authoredRelations.map((message) => message.targetId), ["expose->recover", "observe->preserve", "preserve->expose"]);
  const orders = permutations(question.interaction.elements.map((element) => element.elementId));
  assert.equal(orders.length, 24);
  for (const orderedElementIds of orders) {
    const response = { type: "ordering" as const, orderedElementIds };
    assert.equal(isCanonicalResponseComplete(question, response), true);
    assert.deepEqual(projectCanonicalOrderingFeedbackMessages(question, response), expectedBrokenMessages(question, orderedElementIds));
  }
  assert.deepEqual(projectCanonicalOrderingFeedbackMessages(question, { type: "ordering", orderedElementIds: correctOrder }), []);
  assert.equal(Object.isFrozen(projectCanonicalOrderingFeedbackMessages(question, { type: "ordering", orderedElementIds: correctOrder })), true);

  const swappedLastTwo = ["observe", "preserve", "recover", "expose"];
  assert.deepEqual(scoreCanonicalQuestion(question, { type: "ordering", orderedElementIds: swappedLastTwo }), { kind: "partial", earnedPoints: 1, maxPoints: 3, components: undefined });
  assert.deepEqual(projectCanonicalOrderingFeedbackMessages(question, { type: "ordering", orderedElementIds: swappedLastTwo })?.map((message) => message.targetId), ["expose->recover", "preserve->expose"]);

  const shiftedPreservedBlock = ["expose", "recover", "observe", "preserve"];
  assert.deepEqual(scoreCanonicalQuestion(question, { type: "ordering", orderedElementIds: shiftedPreservedBlock }), { kind: "partial", earnedPoints: 2, maxPoints: 3, components: undefined });
  assert.deepEqual(projectCanonicalOrderingFeedbackMessages(question, { type: "ordering", orderedElementIds: shiftedPreservedBlock }), [authoredRelations[2]]);
  assert.deepEqual(projectCanonicalOrderingFeedbackMessages(question, { type: "ordering", orderedElementIds: [...correctOrder].reverse() })?.map((message) => message.targetId), authoredRelations.map((message) => message.targetId));
});

test("ordering message projection is absent outside ordering or when authored messages are absent", async () => {
  const track = (await catalogPromise).getTrack(target.trackId);
  const choice = track.questions.find((question) => question.interaction.type === "choice_single")!;
  assert.equal(projectCanonicalOrderingFeedbackMessages(choice, null), undefined);
  const question = track.getQuestion(target.questionId)!;
  const withoutMessages = { ...question, feedback: { ...question.feedback, messages: undefined } } as Question;
  assert.equal(projectCanonicalOrderingFeedbackMessages(withoutMessages, { type: "ordering", orderedElementIds: correctOrder }), undefined);
});

test("invalid ordering responses are rejected before authored diagnostics are inferred", async () => {
  const question = (await catalogPromise).getTrack(target.trackId).getQuestion(target.questionId)!;
  assert.ok(question.interaction.type === "ordering");
  const sparse = [...correctOrder];
  delete sparse[1];
  const inheritedHole = [...correctOrder];
  delete inheritedHole[1];
  Object.setPrototypeOf(inheritedHole, Object.assign(Object.create(Array.prototype), { 1: correctOrder[1] }));
  const invalidResponses: unknown[] = [
    { type: "ordering", orderedElementIds: sparse },
    { type: "ordering", orderedElementIds: inheritedHole },
    { type: "ordering", orderedElementIds: ["observe", "observe", "expose", "recover"] },
    { type: "ordering", orderedElementIds: ["observe", "preserve", "expose", "foreign"] },
    { type: "ordering", orderedElementIds: ["observe", "preserve", "expose"] },
    { type: "choice_single", optionId: "observe" },
    null,
  ];
  for (const response of invalidResponses) {
    assert.equal(isCanonicalResponseComplete(question, response), false);
    assert.throws(() => projectCanonicalOrderingFeedbackMessages(question, response), /incomplete or invalid/u);
  }
});

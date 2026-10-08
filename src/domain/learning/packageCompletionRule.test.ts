import assert from "node:assert/strict";
import test from "node:test";
import { createPackageCompletionRuleV2, evaluatePackageCompletion, minimumAttemptsForMentalUnits, type TrainingAttempt } from "..";

const artifactSha256 = "a".repeat(64);
const rule = createPackageCompletionRuleV2({ ruleVersion: 2, chapters: [
  { nodeId: "chapter-a", mentalUnitCount: 1, minimumAttemptCount: 20, rollingWindowSize: 20, qualityThreshold: 0.8 },
  { nodeId: "chapter-b", mentalUnitCount: 2, minimumAttemptCount: 20, rollingWindowSize: 20, qualityThreshold: 0.8 },
] });
const profile = Object.freeze({ trackId: "track", contentVersion: "content-v2", artifactSha256, completionRule: rule });
const questionById = new Map([["question-a", { nodeId: "chapter-a", mentalUnitId: "unit-a" }], ["question-b", { nodeId: "chapter-b", mentalUnitId: "unit-b" }]]);

function attempt(id: string, questionId: string, index: number, kind: "correct" | "partial" | "incorrect" = "correct", overrides: Partial<TrainingAttempt<unknown>> = {}): TrainingAttempt<unknown> {
  const answeredAt = new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString();
  const result = kind === "correct" ? { kind, earnedPoints: 1, maxPoints: 1 } : kind === "partial" ? { kind, earnedPoints: 0.5, maxPoints: 1 } : { kind, earnedPoints: 0, maxPoints: 1 };
  const item = { trackId: "track", questionId, contentVersion: "content-v2", artifactSha256 };
  return { id, sessionId: `session-${id}`, occurrenceId: `occurrence-${id}`, trackId: "track", modeId: "mode", item, response: {}, result, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt, ...overrides } as TrainingAttempt<unknown>;
}

function evaluate(attempts: readonly TrainingAttempt<unknown>[], completionRule = rule) {
  return evaluatePackageCompletion({ ...profile, completionRule }, attempts, (questionId) => questionById.get(questionId));
}

test("v2 validates exact chapter fields, distinct unit thresholds, and safe integer bounds", () => {
  assert.equal(minimumAttemptsForMentalUnits(1), 20);
  assert.equal(minimumAttemptsForMentalUnits(6), 40);
  assert.equal(minimumAttemptsForMentalUnits(7), 40);
  assert.throws(() => minimumAttemptsForMentalUnits(Number.MAX_SAFE_INTEGER), /safe integer range/);
  for (const invalid of [
    null,
    { ruleVersion: 1, chapters: rule.chapters },
    { ...rule, extra: true },
    { ruleVersion: 2, chapters: [] },
    { ruleVersion: 2, chapters: [{ ...rule.chapters[0], nodeId: "" }] },
    { ruleVersion: 2, chapters: [rule.chapters[0], rule.chapters[0]] },
    { ruleVersion: 2, chapters: [{ ...rule.chapters[0], minimumAttemptCount: 40 }] },
    { ruleVersion: 2, chapters: [{ ...rule.chapters[0], mentalUnitCount: Number.MAX_SAFE_INTEGER }] },
  ]) assert.throws(() => createPackageCompletionRuleV2(invalid));
});

test("completion stays unknown without a rule and otherwise requires every chapter independently", () => {
  assert.deepEqual(evaluatePackageCompletion({ ...profile, completionRule: undefined }, [], () => undefined), { kind: "unknown" });
  const attempts = [...Array.from({ length: 40 }, (_, index) => attempt(`a-${index}`, "question-a", index)), ...Array.from({ length: 20 }, (_, index) => attempt(`b-${index}`, "question-b", 40 + index))];
  const result = evaluate(attempts);
  assert.equal(result.kind, "completed");
  if (result.kind !== "completed") return;
  assert.equal(result.completedChapterCount, 2);
  assert.equal(result.requiredChapterCount, 2);
  assert.equal(result.requiredAttemptCount, 40);
  assert.equal(result.remainingAttemptCount, 0);
  assert.deepEqual(result.chapters.map(({ nodeId, status }) => [nodeId, status]), [["chapter-a", "completed"], ["chapter-b", "completed"]]);
});

test("attempt overage in one chapter cannot compensate another and partial results count as attempts, not correct answers", () => {
  const attempts = [...Array.from({ length: 40 }, (_, index) => attempt(`a-${index}`, "question-a", index)), ...Array.from({ length: 10 }, (_, index) => attempt(`b-${index}`, "question-b", 40 + index, index === 9 ? "partial" : "correct"))];
  const result = evaluate(attempts);
  assert.equal(result.kind, "in_progress");
  if (result.kind !== "in_progress") return;
  assert.equal(result.qualifyingAttemptCount, 50);
  assert.equal(result.remainingAttemptCount, 10);
  assert.equal(result.chapters[1]?.qualifyingAttemptCount, 10);
  assert.equal(result.chapters[1]?.quality, null);
});

test("latest 20 quality regression remains in progress with no fabricated remaining volume", () => {
  const attempts = [...Array.from({ length: 20 }, (_, index) => attempt(`a-${index}`, "question-a", index, index < 5 ? "incorrect" : "correct")), ...Array.from({ length: 20 }, (_, index) => attempt(`b-${index}`, "question-b", 20 + index))];
  const result = evaluate(attempts);
  assert.equal(result.kind, "in_progress");
  if (result.kind !== "in_progress") return;
  assert.equal(result.chapters[0]?.reason, "quality_unmet");
  assert.equal(result.chapters[0]?.quality, 0.75);
  assert.equal(result.remainingAttemptCount, 0);
});

test("exact package identity, retry deduplication, conflict detection, and unresolved node mappings are enforced", () => {
  const valid = attempt("same", "question-a", 0);
  const foreignItem = { ...valid.item, contentVersion: "other" };
  const foreign = attempt("foreign", "question-a", 1, "correct", { item: foreignItem, reviewEvidence: { ...valid.reviewEvidence, sourceItem: foreignItem } });
  const result = evaluate([valid, valid, foreign]);
  assert.equal(result.kind, "in_progress");
  if (result.kind === "in_progress") assert.equal(result.qualifyingAttemptCount, 1);
  assert.throws(() => evaluate([valid, { ...valid, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } }]), /Conflicting/);
  assert.throws(() => evaluate([attempt("unresolved", "not-in-artifact", 2)]), /absent from its verified package/);
  assert.throws(() => evaluate([attempt("bad-time", "question-a", 0, "correct", { answeredAt: "not-a-date" })]), /invalid/);
});

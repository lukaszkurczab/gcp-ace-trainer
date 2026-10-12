import assert from "node:assert/strict";
import test from "node:test";
import { assertPackageCompletionRuleMatchesQuestions, createPackageCompletionRuleV2, createPackageCompletionRuleV3, evaluatePackageCompletion, minimumAttemptsForMentalUnits, type TrainingAttempt } from "..";

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

const v3Rule = createPackageCompletionRuleV3({ ruleVersion: 3, chapters: [
  { nodeId: "chapter-a", mentalUnitCount: 1, minimumAttemptCount: 20, rollingWindowSize: 20, qualityThreshold: 0.8, units: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4 }] },
] });
const v3QuestionById = new Map(Array.from({ length: 5 }, (_, index) => [`unit-a-q${index + 1}`, { nodeId: "chapter-a", mentalUnitId: "unit-a" }]));
function evaluateV3(attempts: readonly TrainingAttempt<unknown>[]) {
  return evaluatePackageCompletion({ ...profile, completionRule: v3Rule }, attempts, (questionId) => v3QuestionById.get(questionId));
}

test("v3 validates exact unit inventory and the required four distinct questions", () => {
  for (const invalid of [
    null,
    { ...v3Rule, extra: true },
    { ruleVersion: 3, chapters: [{ ...v3Rule.chapters[0], mentalUnitCount: 2 }] },
    { ruleVersion: 3, chapters: [{ ...v3Rule.chapters[0], units: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 3 }] }] },
    { ruleVersion: 3, chapters: [{ ...v3Rule.chapters[0], units: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4 }, { mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4 }] }] },
    { ruleVersion: 3, chapters: [v3Rule.chapters[0], { ...v3Rule.chapters[0], nodeId: "chapter-b" }] },
  ]) assert.throws(() => createPackageCompletionRuleV3(invalid));

  const inventory = [...v3QuestionById].map(([questionId, identity]) => ({ questionId, ...identity }));
  assert.doesNotThrow(() => assertPackageCompletionRuleMatchesQuestions(v3Rule, inventory));
  assert.throws(() => assertPackageCompletionRuleMatchesQuestions(v3Rule, inventory.slice(0, 3)), /fewer distinct questions/);
  assert.throws(() => assertPackageCompletionRuleMatchesQuestions(v3Rule, [...inventory.slice(0, 3), { questionId: "foreign", nodeId: "chapter-a", mentalUnitId: "other-unit" }]), /chapter differs|unit inventory/);
  assert.throws(() => assertPackageCompletionRuleMatchesQuestions(v3Rule, [...inventory.slice(0, 3), { ...inventory[0]! }]), /duplicated/);
});

test("v3 blocks a green volume and quality result until four distinct latest-correct questions cover the unit", () => {
  const repeated = Array.from({ length: 20 }, (_, index) => attempt(`repeat-${index}`, "unit-a-q1", index));
  const partialCoverage = evaluateV3(repeated);
  assert.equal(partialCoverage.kind, "in_progress");
  if (partialCoverage.kind !== "in_progress") return;
  assert.equal(partialCoverage.remainingAttemptCount, 0);
  assert.equal(partialCoverage.coverageDeficit, 3);
  assert.equal(partialCoverage.minimumAdditionalAttemptCount, 3);
  assert.equal(partialCoverage.chapters[0]?.coverage[0]?.latestCorrectQuestionCount, 1);
  assert.equal(partialCoverage.chapters[0]?.reason, "coverage_unmet");
  assert.equal(partialCoverage.chapters[0]?.quality, 1);

  const covered = evaluateV3([...repeated, ...[2, 3, 4].map((questionNumber, offset) => attempt(`new-${questionNumber}`, `unit-a-q${questionNumber}`, 20 + offset))]);
  assert.equal(covered.kind, "completed");
  if (covered.kind === "completed") {
    assert.equal(covered.coverageDeficit, 0);
    assert.equal(covered.minimumAdditionalAttemptCount, 0);
    assert.equal(covered.chapters[0]?.coverage[0]?.latestCorrectQuestionCount, 4);
  }
});

test("v3 uses only each question's latest exact-package result and the attempt id tie-break", () => {
  const firstTwenty = Array.from({ length: 20 }, (_, index) => attempt(`base-${index}`, `unit-a-q${(index % 4) + 1}`, index));
  const regression = attempt("regression", "unit-a-q4", 30, "incorrect");
  const afterRegression = evaluateV3([...firstTwenty, regression]);
  assert.equal(afterRegression.kind, "in_progress");
  if (afterRegression.kind !== "in_progress") return;
  assert.equal(afterRegression.chapters[0]?.coverage[0]?.latestCorrectQuestionCount, 3);
  assert.equal(afterRegression.coverageDeficit, 1);
  assert.equal(afterRegression.chapters[0]?.quality, 0.95);

  const tieCorrect = attempt("q4-a", "unit-a-q4", 40);
  const tieIncorrect = attempt("q4-z", "unit-a-q4", 40, "partial", { answeredAt: tieCorrect.answeredAt });
  const tied = evaluateV3([...firstTwenty, tieCorrect, tieIncorrect]);
  assert.equal(tied.kind, "in_progress");
  if (tied.kind === "in_progress") assert.equal(tied.chapters[0]?.coverage[0]?.latestCorrectQuestionCount, 3);
});

test("v3 exposes actual rolling quality even while attempt volume remains unmet", () => {
  const sixUnits = Array.from({ length: 6 }, (_, index) => ({ mentalUnitId: `unit-${index + 1}`, requiredCorrectQuestionCount: 4 }));
  const largeRule = createPackageCompletionRuleV3({ ruleVersion: 3, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 6, minimumAttemptCount: 40, rollingWindowSize: 20, qualityThreshold: 0.8, units: sixUnits }] });
  const largeQuestions = new Map<string, { nodeId: string; mentalUnitId: string }>();
  for (const unit of sixUnits) for (let index = 1; index <= 4; index += 1) largeQuestions.set(`${unit.mentalUnitId}-q${index}`, { nodeId: "chapter-a", mentalUnitId: unit.mentalUnitId });
  const attempts = Array.from({ length: 20 }, (_, index) => attempt(`quality-${index}`, `${sixUnits[index % sixUnits.length]!.mentalUnitId}-q${(index % 4) + 1}`, index, index < 5 ? "incorrect" : "correct"));
  const result = evaluatePackageCompletion({ ...profile, completionRule: largeRule }, attempts, (questionId) => largeQuestions.get(questionId));
  assert.equal(result.kind, "in_progress");
  if (result.kind !== "in_progress") return;
  assert.equal(result.remainingAttemptCount, 20);
  assert.equal(result.chapters[0]?.quality, 0.75);
  assert.equal(result.chapters[0]?.qualityRequirementUnmet, true);
  assert.equal(result.chapters[0]?.reason, "minimum_attempts_unmet");
});

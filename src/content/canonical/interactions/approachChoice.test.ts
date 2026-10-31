import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { createAttemptResult } from "../../../domain/learning/attemptResult";
import { canonicalInteractionRegistry } from "./registry";
import type { ApproachChoiceQuestion } from "./approachChoice";

const fixtureRoot = path.resolve(process.cwd(), "../patternly-content/tests/fixtures/approach-challenge");
const loadProblem = (name: string): Record<string, any> => {
  assert.ok(existsSync(path.join(fixtureRoot, name)), `shared producer fixture is missing: ${name}`);
  return JSON.parse(readFileSync(path.join(fixtureRoot, name), "utf8"));
};

test("approach_choice reuses the radio renderer without presenting grade or feedback before submit", () => {
  const question = loadProblem("W03.json").approachQuestion as ApproachChoiceQuestion;
  assert.deepEqual(canonicalInteractionRegistry.validate(question), []);
  const presented = canonicalInteractionRegistry.present(question, null);
  assert.equal((presented.model as { renderer: { kind: string } }).renderer.kind, "choice");
  assert.equal(JSON.stringify(presented).includes("correct"), false);
  assert.equal(JSON.stringify(presented).includes("heap is unnecessary"), false);
  assert.equal(JSON.stringify(presented).includes("grade"), false);
});

test("option grades are fixed to option IDs and preserve multiple correct methods after reordering", () => {
  const question = loadProblem("W03.json").approachQuestion as ApproachChoiceQuestion;
  const correctIds = question.interaction.options.filter((option) => option.grade === "correct").map((option) => option.optionId).sort();
  assert.deepEqual(correctIds, ["A", "D"]);
  for (const optionId of correctIds) {
    const result = canonicalInteractionRegistry.score(question, { type: "approach_choice", optionId });
    assert.deepEqual({ kind: result.kind, earnedPoints: result.earnedPoints, maxPoints: result.maxPoints }, { kind: "correct", earnedPoints: 1, maxPoints: 1 });
    const reversed = { ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() } };
    assert.deepEqual(canonicalInteractionRegistry.score(reversed, { type: "approach_choice", optionId }), result);
  }
});

test("partial and incorrect grades retain their category and receive zero local points", () => {
  const question = loadProblem("W02.json").approachQuestion as ApproachChoiceQuestion;
  const partial = canonicalInteractionRegistry.evaluate(question, { type: "approach_choice", optionId: "B" });
  assert.equal(partial.complete, true);
  assert.deepEqual(partial.result && { kind: partial.result.kind, earnedPoints: partial.result.earnedPoints, maxPoints: partial.result.maxPoints }, { kind: "partial", earnedPoints: 0, maxPoints: 1 });
  assert.equal(partial.feedback?.reason, "Monotonicity is used, but repeated searches do extra work.");
  assert.deepEqual(partial.diagnostics, question.interaction.options.map((option) => ({ id: option.optionId, state: option.grade })));
  const incorrect = canonicalInteractionRegistry.score(question, { type: "approach_choice", optionId: "C" });
  assert.deepEqual({ kind: incorrect.kind, earnedPoints: incorrect.earnedPoints, maxPoints: incorrect.maxPoints }, { kind: "incorrect", earnedPoints: 0, maxPoints: 1 });
});

test("all four supplied approach patterns preserve correct, partial, and incorrect outcomes including W03D", () => {
  for (const name of ["W01.json", "W02.json", "W03.json", "W04.json"]) {
    const question = loadProblem(name).approachQuestion as ApproachChoiceQuestion;
    for (const grade of ["correct", "partial", "incorrect"] as const) {
      const option = question.interaction.options.find((candidate) => candidate.grade === grade);
      assert.ok(option, `${name} must include ${grade}`);
      const result = canonicalInteractionRegistry.score(question, { type: "approach_choice", optionId: option.optionId });
      assert.equal(result.kind, grade, `${name}:${option.optionId}`);
      assert.equal(result.maxPoints, 1, `${name}:${option.optionId}`);
      assert.equal(result.earnedPoints, grade === "correct" ? 1 : 0, `${name}:${option.optionId}`);
    }
  }
  const w03 = loadProblem("W03.json").approachQuestion as ApproachChoiceQuestion;
  assert.equal(canonicalInteractionRegistry.score(w03, { type: "approach_choice", optionId: "D" }).kind, "correct");
});

test("unknown options are incomplete, duplicate IDs and absent grade/feedback are rejected", () => {
  const question = loadProblem("W01.json").approachQuestion as ApproachChoiceQuestion;
  assert.equal(canonicalInteractionRegistry.isComplete(question, { type: "approach_choice", optionId: "missing" }), false);
  const duplicate = structuredClone(question) as any;
  duplicate.interaction.options[1].optionId = duplicate.interaction.options[0].optionId;
  assert.notDeepEqual(canonicalInteractionRegistry.validate(duplicate), []);
  const noGrade = structuredClone(question) as any;
  delete noGrade.interaction.options[0].grade;
  assert.notDeepEqual(canonicalInteractionRegistry.validate(noGrade), []);
  const noFeedback = structuredClone(question) as any;
  delete noFeedback.interaction.options[0].feedback;
  assert.notDeepEqual(canonicalInteractionRegistry.validate(noFeedback), []);
});

test("zero-point partial requires explicit opt-in and does not alter the legacy constructor contract", () => {
  assert.throws(() => createAttemptResult({ kind: "partial", earnedPoints: 0, maxPoints: 1 }), /partial result must earn/u);
  assert.deepEqual(createAttemptResult({ kind: "partial", earnedPoints: 0, maxPoints: 1 }, { allowZeroPointPartial: true }), { kind: "partial", earnedPoints: 0, maxPoints: 1, components: undefined });
});

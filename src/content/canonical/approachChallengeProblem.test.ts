import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  validateApproachChallengeProblem,
  validateApproachChallengeProblemRef,
  type ApproachChallengeProblem,
} from "./approachChallengeProblem";

const fixtureRoot = path.resolve(process.cwd(), "../patternly-content/tests/fixtures/approach-challenge");
function problem(name: string): ApproachChallengeProblem {
  return JSON.parse(readFileSync(path.join(fixtureRoot, name), "utf8")) as ApproachChallengeProblem;
}

test("all four producer examples satisfy the paired two-stage contract", () => {
  for (const name of ["W01.json", "W02.json", "W03.json", "W04.json"]) {
    assert.deepEqual(validateApproachChallengeProblem(problem(name)), [], name);
  }
});

test("problem contract rejects a foreign stage, mismatched identity, and pre-stage complexity disclosure", () => {
  const valid = problem("W01.json");
  const foreignStage = structuredClone(valid) as any;
  foreignStage.complexityQuestion.trackId = "foreign-track";
  assert.ok(validateApproachChallengeProblem(foreignStage).some((error) => error.includes("foreign track")));

  const duplicateId = structuredClone(valid) as any;
  duplicateId.complexityQuestion.questionId = duplicateId.approachQuestion.questionId;
  assert.ok(validateApproachChallengeProblem(duplicateId).some((error) => error.includes("must differ")));

  const disclosed = structuredClone(valid) as any;
  disclosed.methodReveal.description = "This takes O(n) time.";
  assert.ok(validateApproachChallengeProblem(disclosed).some((error) => error.includes("must not reveal Big-O")));
});

test("analyzed approach must target a correct option, not a partial or incorrect option", () => {
  const valid = problem("W01.json");
  for (const grade of ["partial", "incorrect"] as const) {
    const changed = structuredClone(valid) as any;
    const target = changed.approachQuestion.interaction.options.find((option: any) => option.grade === grade);
    assert.ok(target, `fixture must include a ${grade} option`);
    changed.analyzedApproachId = target.approachId;
    assert.ok(validateApproachChallengeProblem(changed).some((error) => error.includes("must reference a correct approach option")), grade);
  }
});

test("problem references bind exact problem, stage, target, content version, and artifact pin", () => {
  const value = problem("W01.json");
  const pin = { contentVersion: "coding-2026-10", artifactSha256: "a".repeat(64) };
  const ref = {
    trackId: value.trackId,
    problemId: value.problemId,
    problemVersion: value.problemVersion,
    contentVersion: pin.contentVersion,
    artifactSha256: pin.artifactSha256,
    approachQuestionId: value.approachQuestion.questionId,
    complexityQuestionId: value.complexityQuestion.questionId,
    analyzedApproachId: value.analyzedApproachId,
  };
  assert.deepEqual(validateApproachChallengeProblemRef(ref, value, pin), []);
  assert.ok(validateApproachChallengeProblemRef({ ...ref, problemVersion: "latest" }, value, pin).some((error) => error.includes("foreign problem")));
  assert.ok(validateApproachChallengeProblemRef({ ...ref, artifactSha256: "b".repeat(64) }, value, pin).some((error) => error.includes("does not match")));
});

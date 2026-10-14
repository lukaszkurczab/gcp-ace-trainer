import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical";
import { indexCaseRecipes } from "../../content/canonical/caseRecipe";
import { createCanonicalTrainingFamilyComposition } from "../canonicalTrainingFamilyComposition";
import { selectCaseBlocks } from "./caseBlockSelector";

const data = (async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("claude-certified-architect-professional-certification");
  const catalog = createCanonicalTrainingFamilyComposition(track).catalog;
  const recipe = indexCaseRecipes(catalog.questions).find(caseRecipe => caseRecipe.caseId.includes("policy"))!;
  const pool = catalog.questions.filter(question => question.mentalUnitId === "CCARP-D01-O01");
  return { catalog, recipe, pool, targets: new Set(recipe.steps.map(step => step.questionId)) };
})();

test("10/20/40 pack an ordered complete case and distinct standalone fillers, with truthful shortage", async () => {
  const { catalog, recipe, pool, targets } = await data;
  for (const requestedLength of [10, 20, 40]) {
    const result = selectCaseBlocks({ catalog, pool, attempts: [], requestedLength, coverageTargets: targets });
    assert.equal(result.questions.length, Math.min(requestedLength, pool.length));
    assert.equal(new Set(result.questions.map(question => question.questionId)).size, result.questions.length);
    assert.deepEqual(result.questions.slice(0, 3).map(question => question.questionId), recipe.steps.map(step => step.questionId));
    assert.deepEqual(result.recipes.map(selected => selected.caseId), [recipe.caseId]);
  }
});

test("a block that cannot fit, or lacks an eligible member, never leaks standalone case steps", async () => {
  const { catalog, recipe, pool, targets } = await data;
  const standalone = pool.filter(question => !targets.has(question.questionId));
  const first = new Set(standalone.slice(0, 3).map(question => question.questionId));
  const short = selectCaseBlocks({ catalog, pool: [...standalone.slice(0,3), ...pool.filter(question => targets.has(question.questionId))], attempts: [], requestedLength: 4, coverageTargets: first });
  assert.equal(short.questions.length, 3);
  assert.equal(short.recipes.length, 0);
  assert.ok(short.questions.every(question => !targets.has(question.questionId)));
  const incomplete = selectCaseBlocks({ catalog, pool: pool.filter(question => question.questionId !== recipe.steps[2]!.questionId), attempts: [], requestedLength: 40, coverageTargets: targets });
  assert.equal(incomplete.questions.length, standalone.length);
  assert.equal(incomplete.recipes.length, 0);
});

test("ranking a contrast first still emits baseline and contrasts in authored order", async () => {
  const { catalog, recipe, pool } = await data;
  const result = selectCaseBlocks({ catalog, pool: [...pool].reverse(), attempts: [], requestedLength: 3, coverageTargets: new Set([recipe.steps[2]!.questionId]) });
  assert.deepEqual(result.questions.map(question => question.questionId), recipe.steps.map(step => step.questionId));
});

test("multiple cases remain distinct atomic blocks and a second block is skipped as a whole", async () => {
  const { catalog, recipe, pool, targets } = await data;
  const second = { ...recipe, caseId: "qle-test-second-block", steps: recipe.steps.map((step, index) => ({ ...step, stepId: `second-step-${index}`, questionId: `second-question-${index}`, ...(index ? { baseStepId: "second-step-0" } : {}) })) };
  const secondQuestions = recipe.steps.map((step, index) => ({ ...catalog.getQuestion(step.questionId)!, questionId: second.steps[index]!.questionId, caseRecipe: index === 0 ? second : undefined }));
  const source = [...pool.filter(question => targets.has(question.questionId)), ...secondQuestions, ...pool.filter(question => !targets.has(question.questionId)).slice(0, 2)];
  const multiple = { ...catalog, questions: [...catalog.questions, ...secondQuestions] };
  const coverageTargets = new Set([...targets, ...second.steps.map(step => step.questionId)]);
  for (const requestedLength of [5, 8]) {
    const result = selectCaseBlocks({ catalog: multiple, pool: source, attempts: [], requestedLength, coverageTargets });
    assert.equal(result.questions.length, requestedLength);
    assert.deepEqual(result.recipes.map(block => block.caseId), requestedLength === 8 ? [recipe.caseId, second.caseId] : [recipe.caseId]);
    assert.deepEqual(result.questions.slice(0, 3).map(question => question.questionId), recipe.steps.map(step => step.questionId));
    if (requestedLength === 8) assert.deepEqual(result.questions.slice(3, 6).map(question => question.questionId), second.steps.map(step => step.questionId));
    else assert.ok(result.questions.every(question => !question.questionId.startsWith("second-question")));
  }
});

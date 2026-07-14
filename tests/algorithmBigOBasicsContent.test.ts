import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ALGORITHM_SKILL_ATOMS } from "../src/tracks/algorithms/algorithmTaxonomy";
import { validateAlgorithmQuestion } from "../src/tracks/algorithms/content";
import { bigOBasicsQuestions } from "../src/tracks/algorithms/content/items/complexity-and-constraints/big-o-basics";

const removedItemIds = new Set([
  "alg-complexity-big-o-basics-011-check",
  "alg-complexity-big-o-basics-017-check",
  "alg-complexity-big-o-basics-018-check",
  "alg-complexity-big-o-basics-020-check",
  "alg-complexity-big-o-basics-021-check",
  "alg-complexity-big-o-basics-022-check",
  "alg-complexity-big-o-basics-023-check",
  "alg-complexity-big-o-basics-024-check",
  "alg-complexity-big-o-basics-025-check",
]);

const reviewArtifact = JSON.parse(
  readFileSync(
    "recovery/content-review/algorithms-big-o-basics-review.json",
    "utf8",
  ),
) as { afterItemCount: number };

test("big_o_basics has one canonical, fully explained choice contract", () => {
  const ids = bigOBasicsQuestions.map((question) => question.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(reviewArtifact.afterItemCount, bigOBasicsQuestions.length);

  const normalizedPromptAndOptions = new Set<string>();
  const validSkillAtomIds = new Set(ALGORITHM_SKILL_ATOMS.map((skillAtom) => skillAtom.id));

  for (const question of bigOBasicsQuestions) {
    validateAlgorithmQuestion(question);
    assert.equal(question.roadmapNodeId, "complexity_and_constraints", question.id);
    assert.equal(validSkillAtomIds.has(question.primarySkillAtomId), true, question.id);
    assert.equal(
      question.taxonomyRefs.some(
        (reference) => reference.axisId === "pattern_variant" && reference.nodeId === "big_o_basics",
      ),
      true,
      question.id,
    );
    assert.ok(question.feedbackModel.decisionSignal.trim(), question.id);
    assert.ok(question.feedbackModel.details?.trim(), question.id);
    assert.ok(question.feedbackModel.mentalModelCorrection.trim(), question.id);
    assert.ok(question.answerFeedback?.trim(), question.id);
    assert.ok(question.options.length >= 2, question.id);
    assert.ok(question.options.some((option) => option.isCorrect), question.id);
    assert.equal(new Set(question.options.map((option) => option.id)).size, question.options.length, question.id);

    const wrongOptionIds = question.options
      .filter((option) => !option.isCorrect)
      .map((option) => option.id)
      .sort();
    const explanationIds = Object.keys(question.feedbackModel.distractorExplanations ?? {}).sort();
    assert.deepEqual(explanationIds, wrongOptionIds, question.id);
    assert.equal(
      Object.values(question.feedbackModel.distractorExplanations ?? {}).every((explanation) => explanation.trim().length > 0),
      true,
      question.id,
    );

    const normalized = [question.prompt, ...question.options.map((option) => option.text).sort()]
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, " ");
    assert.equal(normalizedPromptAndOptions.has(normalized), false, question.id);
    normalizedPromptAndOptions.add(normalized);
  }

  assert.equal(ids.some((id) => removedItemIds.has(id)), false);
});

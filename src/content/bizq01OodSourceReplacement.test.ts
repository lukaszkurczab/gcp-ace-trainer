import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { projectCanonicalChoiceFeedbackMessages } from "../application/canonical/canonicalInteractionPresentation";
import { scoreCanonicalQuestion } from "./canonical/questionScoring";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
import type { CanonicalFeedbackMessage, Question } from "./canonical/questionTypes";

const TRACK_ID = "object-oriented-design-interview";
const MODE_ID = "design-interview-learn-framework";
const REPLACEMENT_ID = "ood-n01-b01-i018";
const RETIRED_ID = "ood-n01-b01-i001";

function isChoice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

test("OOD source replacement is the exact bundled and eligible canonical item with new scored option identities", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK_ID);
  const replacement = track.getQuestion(REPLACEMENT_ID);
  assert.ok(replacement, `bundled artifact contains ${REPLACEMENT_ID}`);
  const sourcePath = path.resolve("../patternly-content/content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json");
  const sourceQuestions = JSON.parse(readFileSync(sourcePath, "utf8")) as readonly Question[];
  const sourceReplacement = sourceQuestions.find((question) => question.questionId === REPLACEMENT_ID);
  assert.ok(sourceReplacement, `canonical source contains ${REPLACEMENT_ID}`);
  assert.deepEqual(replacement, sourceReplacement, "app consumer and canonical producer expose identical replacement payloads");
  assert.ok(!sourceQuestions.some((question) => question.questionId === RETIRED_ID));
  assert.equal(track.getQuestion(RETIRED_ID), undefined, "retired source identity is not silently substituted");
  assert.ok(isChoice(replacement));
  assert.equal(replacement.nodeId, "requirements_use_cases_domain_vocabulary_and_model_boundaries");
  assert.equal(replacement.mentalUnitId, "OOD-N01-B01");
  assert.ok(track.getPool(MODE_ID).some((question) => question.questionId === REPLACEMENT_ID), "existing immediate Design selector includes the replacement");
  assert.ok(!track.getPool(MODE_ID).some((question) => question.questionId === RETIRED_ID));

  const optionIds = replacement.interaction.options.map((option) => option.optionId);
  assert.equal(new Set(optionIds).size, optionIds.length);
  assert.equal(optionIds.length, 5, "replacement has one correct option and four authored distractors");
  assert.ok(!optionIds.some((id) => ["owner_preserves_contract", "coordinator_exports_state", "inheritance_for_reuse", "representation_leaks", "speculative_indirection"].includes(id)), "option meanings use new stable identities");
  const wrongMessages: readonly CanonicalFeedbackMessage[] = replacement.feedback.messages?.filter((message) => message.kind === "wrong_option") ?? [];
  assert.deepEqual(new Set(wrongMessages.map((message) => message.targetId)), new Set(optionIds.filter((id) => id !== replacement.answer.optionId)));

  for (const optionId of optionIds) {
    const response = { type: "choice_single", optionId } as const;
    const score = scoreCanonicalQuestion(replacement, response);
    assert.equal(score.kind, optionId === replacement.answer.optionId ? "correct" : "incorrect");
    const projected = projectCanonicalChoiceFeedbackMessages(replacement, response);
    if (optionId === replacement.answer.optionId) {
      assert.deepEqual(projected, []);
    } else {
      const authored: CanonicalFeedbackMessage | undefined = wrongMessages.find((message) => message.targetId === optionId);
      assert.ok(authored, `authored feedback exists for ${optionId}`);
      assert.deepEqual(projected, [authored]);
      assert.equal(projected?.[0]?.text, authored.text);
    }
  }
});

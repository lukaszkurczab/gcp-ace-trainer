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
const REPLACEMENT_ID = "ood-n01-b01-i019";
const RETIRED_ID = "ood-n01-b01-i002";
const PRESERVED_ID = "ood-n01-b01-i018";
const EXPECTED_OPTION_IDS = ["completed_switch_outcomes", "supervisor_runs_protocol", "accepted_request_is_success", "provider_ready_is_success"];

function isChoice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

test("OOD12 consumer resolves only the source-bound completed switch outcomes replacement in the existing learning pool", async () => {
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
  assert.ok(sourceQuestions.some((question) => question.questionId === PRESERVED_ID), "accepted source11 replacement remains present");
  const preservedSourceQuestion = sourceQuestions.find((question) => question.questionId === PRESERVED_ID);
  assert.ok(preservedSourceQuestion);
  assert.deepEqual(track.getQuestion(PRESERVED_ID), preservedSourceQuestion, "accepted source11 replacement remains unchanged across the source12 package");
  assert.ok(isChoice(replacement));
  assert.equal(replacement.nodeId, "requirements_use_cases_domain_vocabulary_and_model_boundaries");
  assert.equal(replacement.mentalUnitId, "OOD-N01-B01");
  assert.ok(track.getPool(MODE_ID).some((question) => question.questionId === REPLACEMENT_ID), "existing immediate Design selector includes the replacement");
  assert.ok(!track.getPool(MODE_ID).some((question) => question.questionId === RETIRED_ID));

  const optionIds = replacement.interaction.options.map((option) => option.optionId);
  assert.deepEqual(optionIds, EXPECTED_OPTION_IDS);
  assert.equal(new Set(optionIds).size, 4);
  assert.equal(replacement.answer.optionId, "completed_switch_outcomes");
  const optionText = new Map(replacement.interaction.options.map(({ optionId, text }) => [optionId, text]));
  assert.match(optionText.get("completed_switch_outcomes") ?? "", /requested ready provider is active and the stream contract still holds/u);
  assert.match(optionText.get("supervisor_runs_protocol") ?? "", /supervisor prepares the provider and invokes the handover steps in order/u);
  assert.match(optionText.get("accepted_request_is_success") ?? "", /accepts the request and reports the requested provider as selected/u);
  assert.match(optionText.get("provider_ready_is_success") ?? "", /provider reports ready while the current provider continues the stream/u);
  const wrongMessages: readonly CanonicalFeedbackMessage[] = replacement.feedback.messages?.filter((message) => message.kind === "wrong_option") ?? [];
  assert.deepEqual(new Set(wrongMessages.map((message) => message.targetId)), new Set(optionIds.filter((id) => id !== replacement.answer.optionId)));
  assert.match(replacement.prompt, /current provider remains active and the stream retains its timing and error contract/u);
  assert.match(replacement.prompt, /returns a completed switch result, not just an acknowledgement/u);
  assert.match(replacement.prompt, /failed preparation must be reported as retryable/u);

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

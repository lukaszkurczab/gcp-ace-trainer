import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";

import {
  buildCanonicalInteractionViewModel,
  composeCanonicalFeedback,
  projectCanonicalChoiceFeedbackControls,
} from "../application/canonical/canonicalInteractionPresentation";
import { toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
import { scoreCanonicalQuestion } from "./canonical/questionScoring";
import type { CanonicalFeedbackMessage, Question } from "./canonical/questionTypes";

const PACKET = "docs/active/BIZQ-01/ood-node-closure-19";
const TRACK = "object-oriented-design-interview";
const N01_NODE = "requirements_use_cases_domain_vocabulary_and_model_boundaries";
const N02_NODE = "objects_responsibilities_encapsulation_and_invariants";
const NODE = "relationships_composition_ownership_lifecycle_and_dependencies";
const MODES = [
  "design-interview-learn-framework",
  "design-interview-tradeoff-practice",
  "design-interview-weak-area-review",
] as const;

// Fixed bindings to the reviewed, plain-array proposal payloads.
const UNITS = [
  { id: "OOD-N03-B01", proposal: "proposals/OOD-N03-B01.json", sha256: "c23224df332377b45f718bc10d903a7c9fe645954dd9778f30af503bbabef58b", source: "OOD-N03-B01.json" },
  { id: "OOD-N03-B02", proposal: "proposals/OOD-N03-B02.json", sha256: "d70ee871a3ee7087c1b5d3d03f2feaedf041fd1d1cbb6267df2439a953abd237", source: "OOD-N03-B02.json" },
  { id: "OOD-N03-B03", proposal: "proposals/OOD-N03-B03.json", sha256: "830a1fb12385d084279054f3d32db5261af24e7501700847b75e25f1c83ef0de", source: "OOD-N03-B03.json" },
  { id: "OOD-N03-B04", proposal: "proposals/OOD-N03-B04.json", sha256: "25c09577a8ebcb0116dd1bf5ce2a763eaa011e8f58f42ebeb3e00f0591126360", source: "OOD-N03-B04.json" },
  { id: "OOD-N03-B05", proposal: "proposals/OOD-N03-B05.json", sha256: "19912a8a5278b7fe5a88ac1864aca04327ff255ee46dd04b29c68ed0c21d7d32", source: "OOD-N03-B05.json" },
  { id: "OOD-N03-B06", proposal: "proposals/OOD-N03-B06.json", sha256: "c7fc7970481fadc0795617e64af14e8cbcce8452d01bb3c45ca65fd6d75952ad", source: "OOD-N03-B06.json" },
  { id: "OOD-N03-B07", proposal: "proposals/OOD-N03-B07.json", sha256: "846d741c52339153cf0ad2b72813ce2672908de733591aaf6afcd7dd42b00fc0", source: "OOD-N03-B07.json" },
  { id: "OOD-N03-B08", proposal: "proposals/OOD-N03-B08.json", sha256: "68ca04a4849f4d1c7e20ff9592c4dbd2a028f7be86e51241015f91d3f7e56058", source: "OOD-N03-B08.json" },
  { id: "OOD-N03-B09", proposal: "proposals/OOD-N03-B09.json", sha256: "d3327d2c3e1d42ca3079ac9a74dd05aba9e684bd2fee39115324b46cd84bbb19", source: "OOD-N03-B09.json" },
] as const;

type BoundQuestion = Readonly<{ beforeQuestionId: string; question: Question }>;
type UnitPayload = (typeof UNITS)[number];

function unitSuffix(unit: UnitPayload): string {
  return unit.id.slice(-3).toLowerCase();
}

function oldQuestionId(unit: UnitPayload, index: number): string {
  return `ood-n03-${unitSuffix(unit)}-i${String(index + 1).padStart(3, "0")}`;
}

function newQuestionId(unit: UnitPayload, index: number): string {
  return `ood-n03-${unitSuffix(unit)}-i${String(index + 19).padStart(3, "0")}`;
}

function readFrozenQuestions(unit: UnitPayload): readonly Question[] {
  const bytes = readFileSync(path.resolve(PACKET, unit.proposal));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), unit.sha256, `${unit.id} frozen proposal bytes`);
  const questions = JSON.parse(bytes.toString("utf8")) as readonly Question[];
  assert.equal(questions.length, 18, `${unit.id} replacement count`);
  for (const [index, question] of questions.entries()) {
    assert.equal(question.questionId, newQuestionId(unit, index));
    assert.equal(question.mentalUnitId, unit.id);
    assert.equal(question.nodeId, NODE);
    assert.equal(question.interaction.type, "choice_single");
    assert.equal(question.answer.type, "choice_single");
  }
  return questions;
}

function sourceQuestions(file: string): readonly Question[] {
  const sourcePath = path.resolve("../patternly-content/content/object-oriented-design-interview", NODE, file);
  return JSON.parse(readFileSync(sourcePath, "utf8")) as readonly Question[];
}

function isSingleChoice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

function sourcePath(relativePath: string): string {
  return path.resolve("../patternly-content", relativePath);
}

const ACCEPTED_N01 = [
  ["content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json", "224c0d2d9fd5c367a0c8a7a8c0e139ca827d308d7d60fdce7d18c627ba1dbfa0"],
  ["content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B02.json", "215397c1609b3f058dee249c6ef54c43a4a0696e9aa94c80c673a046b6b8b5a9"],
  ["content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B03.json", "3fe8c393ee1d336cd1ea2fb39ceae7c9eb891184ab0e4dc26b07285a26b70575"],
  ["content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B04.json", "24ff127bcf9b1a1e9eae5e0ac51e048a590661ff16e67c3469fee78cd8e153a5"],
  ["content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B05.json", "9a8bc00943bf65ea36223f9d5513c7cfa26df7357e77e99848faf3c88235556d"],
  ["content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B06.json", "d09097dc78773ac03587b649e4d4e78f672208ef554b21eb76dfb801d7393c7b"],
  ["content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B07.json", "a3e7964e959f710e2d2029e8b98c7f3b9135deaee7f98ada02f3862fa60a5e43"],
  ["content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B08.json", "0c1053f6c6e722dc6954c4dc56cfbeed407d9ad9082ed3550129acb565612319"],
] as const;

const ACCEPTED_N02 = [
  ["content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B01.json", "8d858a2491ea8c320d687efc7d427fa469df6bc227fd238b02fc19af0f8fcddf"],
  ["content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B02.json", "03fa49cfcb122f03241f16b826716c8221fd809b3ff5e21706927245208f54f3"],
  ["content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B03.json", "6a1ce440ba1ce098ebeb4decd991d8d270dd275c0c4f51bf78403ac9d77d89b1"],
  ["content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B04.json", "17d4027ea20cab4946d0a10508798ed4db3f9cc264769f3bafb75bdbe44ab622"],
  ["content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B05.json", "17907deacb33b6f1d6dac02c33e30625feef5f13fcf2f8ab2225f5160dc48f1e"],
  ["content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B06.json", "ed0c5d818f351713fd891c0c470927e1515f120342be2a6e1d12491cb87be638"],
  ["content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B07.json", "e71e17e0366922a268d536518917c9e6a8692a495b30cc88c4a9c042d0fab14f"],
  ["content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B08.json", "a7187fd7159997b338285a732eb436cf799953d78a527ef1ce45b2612ed8e4b1"],
] as const;

test("OOD19 frozen bindings cover all nine reviewed 18-item payloads", () => {
  let count = 0;
  for (const unit of UNITS) count += readFrozenQuestions(unit).length;
  assert.equal(count, 162);
});

test("OOD19 preserves all 136 accepted N01 and 152 accepted N02 source and runtime objects", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  for (const [accepted, expectedCount] of [[ACCEPTED_N01, 136], [ACCEPTED_N02, 152]] as const) {
    let count = 0;
    for (const [relativePath, sha256] of accepted) {
      const bytes = readFileSync(sourcePath(relativePath));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), sha256, `${relativePath} accepted source bytes`);
      const questions = JSON.parse(bytes.toString("utf8")) as readonly Question[];
      count += questions.length;
      for (const question of questions) assert.deepEqual(track.getQuestion(question.questionId), question);
    }
    assert.equal(count, expectedCount);
  }
});

for (const unit of UNITS) {
  test(`OOD19 ${unit.id} source and runtime match frozen payload; predecessors are retired`, async () => {
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
    const reviewed = readFrozenQuestions(unit);
    const source = sourceQuestions(unit.source);
    assert.equal(source.length, 18, `${unit.id} source question count`);
    for (const [index, question] of reviewed.entries()) {
      const predecessorId = oldQuestionId(unit, index);
      const sourceQuestion = source.find((candidate) => candidate.questionId === question.questionId);
      assert.ok(sourceQuestion, `${unit.id} source contains ${question.questionId}`);
      assert.deepEqual(sourceQuestion, question, `${question.questionId} is the frozen reviewed whole object`);
      assert.deepEqual(track.getQuestion(question.questionId), question, `${question.questionId} runtime artifact matches source`);
      assert.equal(source.some((candidate) => candidate.questionId === predecessorId), false, `${predecessorId} is retired from source`);
      assert.equal(track.getQuestion(predecessorId), undefined, `${predecessorId} is retired from runtime`);
    }
  });

  test(`OOD19 ${unit.id} real scoring, reversed-option invariance and learner feedback use stable IDs`, async () => {
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
    for (const reviewed of readFrozenQuestions(unit)) {
      const question = track.getQuestion(reviewed.questionId);
      assert.ok(question, `current runtime contains ${reviewed.questionId}`);
      assert.ok(isSingleChoice(question));
      assert.ok(isSingleChoice(reviewed));
      const optionIds = reviewed.interaction.options.map((option) => option.optionId);
      const answerId = reviewed.answer.optionId;
      assert.deepEqual(question.interaction.options.map((option) => option.optionId), optionIds);
      assert.equal(question.answer.optionId, answerId);
      assert.deepEqual(
        (question.feedback.messages ?? []).filter((message) => message.kind === "wrong_option").map((message) => message.targetId).sort(),
        optionIds.filter((optionId) => optionId !== answerId).sort(),
        `${reviewed.questionId} has exact per-distractor feedback targets`,
      );

      const preAnswer = toCanonicalQuestionViewModel(question);
      assert.deepEqual(Object.keys(preAnswer).sort(), ["constraints", "interaction", "itemId", "prompt"]);
      assert.equal(preAnswer.itemId, question.questionId);
      assert.equal(preAnswer.prompt, question.prompt);
      assert.deepEqual(preAnswer.constraints, question.constraints ?? []);
      assert.equal("answer" in preAnswer, false);
      assert.equal("feedback" in preAnswer, false);
      assert.deepEqual(preAnswer.interaction, {
        kind: "choice",
        options: question.interaction.options.map((option) => ({ id: option.optionId, selected: false, text: option.text })),
      });
      // Visible option text may equal Reason. Changing hidden fields must never
      // change the pre-answer projection or mark a correct option as selected.
      const hiddenFieldsChanged = {
        ...question,
        answer: { ...question.answer, optionId: optionIds.find((id) => id !== answerId)! },
        feedback: {
          ...question.feedback,
          reason: `hidden-reason-sentinel:${question.questionId}`,
          details: { hiddenDetailsSentinel: question.questionId },
        },
      };
      assert.deepEqual(toCanonicalQuestionViewModel(hiddenFieldsChanged), preAnswer, "answer, Reason and Details are excluded from the pre-answer projection");

      const displayOrder = [...optionIds].reverse();
      const controls = buildCanonicalInteractionViewModel(question, null, displayOrder);
      assert.equal(controls.renderer.kind, "choice");
      assert.deepEqual(controls.renderer.kind === "choice" ? controls.renderer.options.map((option) => option.id) : [], displayOrder);
      assert.equal(controls.accessibility.label, question.prompt);
      assert.deepEqual(controls.accessibility.controls.map((control) => control.id), displayOrder);
      for (const control of controls.accessibility.controls) {
        assert.equal(control.role, "radio");
        assert.equal(control.checked, false);
        assert.equal(control.label, question.interaction.options.find((option) => option.optionId === control.id)?.text);
      }

      const reversed: Extract<Question, { interaction: { type: "choice_single" } }> = {
        ...question,
        interaction: { ...question.interaction, options: [...question.interaction.options].reverse() },
      };
      for (const optionId of optionIds) {
        const response = { type: "choice_single", optionId } as const;
        const correct = optionId === answerId;
        const score = scoreCanonicalQuestion(question, response);
        assert.equal(score.kind, correct ? "correct" : "incorrect", `${reviewed.questionId}/${optionId}`);
        assert.equal(score.earnedPoints, correct ? 1 : 0);
        assert.deepEqual(scoreCanonicalQuestion(reversed, response), score, "score follows option identity regardless of order");
        const feedback = composeCanonicalFeedback(question, response);
        assert.equal(feedback.correctness, correct ? "correct" : "incorrect");
        assert.equal(feedback.reason, question.feedback.reason);
        assert.deepEqual(feedback.details, question.feedback.details);
        if (correct) {
          assert.deepEqual(feedback.messages, []);
          continue;
        }
        const authored: CanonicalFeedbackMessage | undefined = question.feedback.messages?.find((message) => message.kind === "wrong_option" && message.targetId === optionId);
        assert.ok(authored, `${reviewed.questionId}/${optionId} has authored stable-ID feedback`);
        assert.deepEqual(feedback.messages, [authored]);
        assert.deepEqual(projectCanonicalChoiceFeedbackControls(question, response).find((control) => control.id === optionId), { id: optionId, state: "incorrect" });
      }
    }
  });
}

test("OOD19 leaves three ordinary N01 pools at 136 and does not grant N03 eligibility", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  const acceptedN01Ids = track.getQuestionsForNode(N01_NODE).map((question) => question.questionId).sort();
  assert.equal(acceptedN01Ids.length, 136);
  assert.equal(track.getQuestionsForNode(N02_NODE).length, 152);
  const candidateIds = UNITS.flatMap((unit) => readFrozenQuestions(unit).map((question) => question.questionId));
  for (const modeId of MODES) {
    const poolIds = track.getPool(modeId).map((question) => question.questionId).sort();
    assert.deepEqual(poolIds, acceptedN01Ids, `${modeId} retains the exact N01 pool`);
    for (const questionId of candidateIds) assert.equal(poolIds.includes(questionId), false, `${modeId} does not grant N03 eligibility to ${questionId}`);
  }
});

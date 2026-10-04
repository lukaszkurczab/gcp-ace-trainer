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

const PACKET = "docs/active/BIZQ-01/ood-node-closure-17";
const TRACK = "object-oriented-design-interview";
const NODE = "objects_responsibilities_encapsulation_and_invariants";
const MODES = [
  "design-interview-learn-framework",
  "design-interview-tradeoff-practice",
  "design-interview-weak-area-review",
] as const;

// Fixed proposal bindings; semantic acceptance is recorded separately.
const UNITS = [
  { id: "OOD-N02-B01", proposal: "REVIEWED-B01-v3.json", sha256: "9ce1b243551a97356bcab6ae093df0a463dc2f9e978d96456329b555e8efff58", source: "OOD-N02-B01.json" },
  { id: "OOD-N02-B02", proposal: "REVIEWED-B02-v5.json", sha256: "2990cbe047af3761b107b19460346b8020747a0b5621521c08f32a5d6189b8bf", source: "OOD-N02-B02.json" },
  { id: "OOD-N02-B03", proposal: "REVIEWED-B03-v4.json", sha256: "1e2ffd502acc9ee098e51c80633151ec2b9009590455b2726701a733c97fe795", source: "OOD-N02-B03.json" },
  { id: "OOD-N02-B04", proposal: "REVIEWED-B04-v3.json", sha256: "61b729c8d159391deef0a1d0cebd17b3e19e5ee339fde49c9a586d579819fd33", source: "OOD-N02-B04.json" },
  { id: "OOD-N02-B05", proposal: "REVIEWED-B05-v6.json", sha256: "ac6e20b5eb4d2602ddf294185809d49465de9444d1f725330e5793dcfe4b455c", source: "OOD-N02-B05.json" },
  { id: "OOD-N02-B06", proposal: "REVIEWED-B06-v2.json", sha256: "46ba770ef4ebeb58c0f4a7e0dc312afb89c4d5efd17474612276276b6975249b", source: "OOD-N02-B06.json" },
  { id: "OOD-N02-B07", proposal: "REVIEWED-B07-v4.json", sha256: "781ed817fdddc5e6533e46136ecbae1aef116ab53ae7b4ed2f3c9cf7d198881e", source: "OOD-N02-B07.json" },
  { id: "OOD-N02-B08", proposal: "REVIEWED-B08-v5.json", sha256: "d0e6d4dce12cbb74caf50d7fc41d7637abd4f133e6fe22016a0555c355a17169", source: "OOD-N02-B08.json" },
] as const;

type ProposalEntry = Readonly<{
  beforeQuestionId: string;
  questionId: string;
  question: Question;
}>;

function readFrozenEntries(unit: (typeof UNITS)[number]): readonly ProposalEntry[] {
  const bytes = readFileSync(path.resolve(PACKET, unit.proposal));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), unit.sha256, `${unit.id} frozen proposal bytes`);
  const entries = JSON.parse(bytes.toString("utf8")) as readonly ProposalEntry[];
  assert.equal(entries.length, 19, `${unit.id} replacement count`);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    const suffix = String(index + 20).padStart(3, "0");
    assert.equal(entry.questionId, `ood-n02-${unit.id.slice(-3).toLowerCase()}-i${suffix}`);
    const predecessorId = `ood-n02-${unit.id.slice(-3).toLowerCase()}-i${String(index + 1).padStart(3, "0")}`;
    assert.equal(entry.beforeQuestionId, predecessorId);
    assert.equal(entry.question.questionId, entry.questionId);
    assert.equal(entry.question.mentalUnitId, unit.id);
    assert.equal(entry.question.nodeId, NODE);
    assert.equal(entry.question.interaction.type, "choice_single");
    assert.equal(entry.question.answer.type, "choice_single");
  }
  return entries;
}

function sourceQuestions(file: string): readonly Question[] {
  const sourcePath = path.resolve("../patternly-content/content/object-oriented-design-interview", NODE, file);
  return JSON.parse(readFileSync(sourcePath, "utf8")) as readonly Question[];
}

function isSingleChoice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

test("OOD17 frozen bindings cover the eight frozen 19-item payloads", () => {
  let count = 0;
  for (const unit of UNITS) {
    const entries = readFrozenEntries(unit);
    count += entries.length;
  }
  assert.equal(count, 152);
});

const ACCEPTED_N01 = [
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json",
    "sha256": "224c0d2d9fd5c367a0c8a7a8c0e139ca827d308d7d60fdce7d18c627ba1dbfa0"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B02.json",
    "sha256": "215397c1609b3f058dee249c6ef54c43a4a0696e9aa94c80c673a046b6b8b5a9"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B03.json",
    "sha256": "3fe8c393ee1d336cd1ea2fb39ceae7c9eb891184ab0e4dc26b07285a26b70575"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B04.json",
    "sha256": "24ff127bcf9b1a1e9eae5e0ac51e048a590661ff16e67c3469fee78cd8e153a5"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B05.json",
    "sha256": "9a8bc00943bf65ea36223f9d5513c7cfa26df7357e77e99848faf3c88235556d"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B06.json",
    "sha256": "d09097dc78773ac03587b649e4d4e78f672208ef554b21eb76dfb801d7393c7b"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B07.json",
    "sha256": "a3e7964e959f710e2d2029e8b98c7f3b9135deaee7f98ada02f3862fa60a5e43"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B08.json",
    "sha256": "0c1053f6c6e722dc6954c4dc56cfbeed407d9ad9082ed3550129acb565612319"
  }
] as const;

test("OOD17 preserves all 136 accepted N01 source and artifact objects", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  let count = 0;
  for (const source of ACCEPTED_N01) {
    const bytes = readFileSync(path.resolve("../patternly-content", source.path));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256);
    const questions = JSON.parse(bytes.toString("utf8")) as readonly Question[];
    count += questions.length;
    for (const question of questions) assert.deepEqual(track.getQuestion(question.questionId), question);
  }
  assert.equal(count, 136);
});

for (const unit of UNITS) {
  test(`OOD17 ${unit.id} source payloads, replacement identities and retired IDs are exact`, async () => {
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
    const entries = readFrozenEntries(unit);
    const source = sourceQuestions(unit.source);
    assert.equal(source.length, 19, `${unit.id} current source count`);
    for (const [index, entry] of entries.entries()) {
      const predecessorId = `ood-n02-${unit.id.slice(-3).toLowerCase()}-i${String(index + 1).padStart(3, "0")}`;
      const sourceQuestion = source.find((question) => question.questionId === entry.questionId);
      assert.ok(sourceQuestion, `${unit.id} current source contains ${entry.questionId}`);
      assert.deepEqual(sourceQuestion, entry.question, `${entry.questionId} source is the frozen reviewed payload`);
      assert.deepEqual(track.getQuestion(entry.questionId), sourceQuestion, `${entry.questionId} bundled artifact matches source`);
      assert.equal(source.some((question) => question.questionId === predecessorId), false, `${predecessorId} is retired from source`);
      assert.equal(track.getQuestion(predecessorId), undefined, `${predecessorId} is retired from the current artifact`);
    }
  });

  test(`OOD17 ${unit.id} real choice scoring, accessibility and submitted feedback follow fixed option IDs`, async () => {
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
    const entries = readFrozenEntries(unit);
    for (const entry of entries) {
      const question = track.getQuestion(entry.questionId);
      assert.ok(question, `current artifact contains ${entry.questionId}`);
      assert.ok(isSingleChoice(question));
      const reviewed = entry.question;
      assert.ok(isSingleChoice(reviewed));
      const optionIds = reviewed.interaction.options.map((option) => option.optionId);
      const answerId = reviewed.answer.optionId;
      assert.deepEqual(question.interaction.options.map((option) => option.optionId), optionIds);
      assert.equal(question.answer.optionId, answerId);
      assert.deepEqual(
        (question.feedback.messages ?? []).filter((message) => message.kind === "wrong_option").map((message) => message.targetId).sort(),
        optionIds.filter((optionId) => optionId !== answerId).sort(),
        `${entry.questionId} feedback targets each distractor exactly once`,
      );

      const preAnswer = toCanonicalQuestionViewModel(question);
      assert.deepEqual(Object.keys(preAnswer).sort(), ["constraints", "interaction", "itemId", "prompt"]);
      assert.equal(preAnswer.itemId, question.questionId);
      assert.equal(preAnswer.prompt, question.prompt);
      assert.deepEqual(preAnswer.constraints, question.constraints ?? []);
      assert.equal("answer" in preAnswer, false, "pre-answer renderer model has no answer field");
      assert.equal("feedback" in preAnswer, false, "pre-answer renderer model has no feedback field");
      assert.equal(JSON.stringify(preAnswer).includes(question.feedback.reason), false, "pre-answer renderer model does not expose Reason");
      assert.equal(JSON.stringify(preAnswer).includes(JSON.stringify(question.feedback.details)), false, "pre-answer renderer model does not expose Details");

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
        assert.equal(score.kind, correct ? "correct" : "incorrect", `${entry.questionId}/${optionId}`);
        assert.equal(score.earnedPoints, correct ? 1 : 0);
        assert.deepEqual(scoreCanonicalQuestion(reversed, response), score, "answer identity is independent of display order");

        const feedback = composeCanonicalFeedback(question, response);
        assert.equal(feedback.correctness, correct ? "correct" : "incorrect");
        assert.equal(feedback.reason, question.feedback.reason);
        assert.deepEqual(feedback.details, question.feedback.details);
        if (correct) {
          assert.deepEqual(feedback.messages, []);
          continue;
        }
        const authored: CanonicalFeedbackMessage | undefined = question.feedback.messages?.find((message) => message.kind === "wrong_option" && message.targetId === optionId);
        assert.ok(authored, `${entry.questionId}/${optionId} has authored stable-ID feedback`);
        assert.deepEqual(feedback.messages, [authored]);
        assert.deepEqual(projectCanonicalChoiceFeedbackControls(question, response).find((control) => control.id === optionId), { id: optionId, state: "incorrect" });
      }
    }
  });
}

test("OOD17 N02 source quality does not widen the three ordinary N01 mode pools", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  const nodeIds = track.getQuestionsForNode(NODE).map((question) => question.questionId).sort();
  assert.equal(nodeIds.length, 152);
  const acceptedNodeIds = track.getQuestionsForNode("requirements_use_cases_domain_vocabulary_and_model_boundaries").map((question) => question.questionId).sort();
  assert.equal(acceptedNodeIds.length, 136);
  for (const modeId of MODES) {
    const poolIds = track.getPool(modeId).map((question) => question.questionId).sort();
    assert.deepEqual(poolIds, acceptedNodeIds, `${modeId} retains exact accepted N01 pool`);
    for (const questionId of nodeIds) assert.equal(poolIds.includes(questionId), false, `${modeId} has no N02 eligibility grant`);
  }
});

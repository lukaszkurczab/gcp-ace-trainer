import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test, { before } from "node:test";
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
import { currentContentProducer } from "../../scripts/fixtures/currentContentProducer";

const PACKET = "src/content/__fixtures__/release-acceptance/ood-node-closure-19";
const REASON_AMENDMENT = `${PACKET}/reason-amendment-19a/PROPOSED-REASONS.json`;
const REASON_AMENDMENT_SHA256 = "76fd88c540bd1b6ffe83eb2034cbf565b2ac030454e80511e56a341555edfa15";
const TRACK = "object-oriented-design-interview";
const N01_NODE = "requirements_use_cases_domain_vocabulary_and_model_boundaries";
const N02_NODE = "objects_responsibilities_encapsulation_and_invariants";
const NODE = "relationships_composition_ownership_lifecycle_and_dependencies";
const MODES = [
  "design-interview-learn-framework",
  "design-interview-tradeoff-practice",
  "design-interview-weak-area-review",
] as const;
let currentContentRoot = "";

before(async () => {
  currentContentRoot = await currentContentProducer({
    appRoot: process.cwd(),
    contentRoot: process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve("../patternly-content"),
    trackId: TRACK,
  });
});

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
type ReasonAmendment = Readonly<{ questionId: string; beforeReason: string; reason: string }>;

function readReasonAmendment(): readonly ReasonAmendment[] {
  const bytes = readFileSync(path.resolve(REASON_AMENDMENT));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), REASON_AMENDMENT_SHA256, "fixed 19a proposal bytes");
  const entries = JSON.parse(bytes.toString("utf8")) as readonly ReasonAmendment[];
  assert.equal(entries.length, 25, "fixed 19a Reason-only amendment count");
  assert.equal(new Set(entries.map((entry) => entry.questionId)).size, entries.length, "19a question IDs are unique");
  return entries;
}

const REASON_AMENDMENTS = readReasonAmendment();

function currentExpectedQuestion(question: Question): Question {
  const amendment = REASON_AMENDMENTS.find((entry) => entry.questionId === question.questionId);
  if (!amendment) return question;
  assert.ok(isSingleChoice(question), `${question.questionId} Reason amendment is single-choice`);
  assert.equal(question.feedback.type, "choice_single", `${question.questionId} feedback matches its single-choice contract`);
  assert.equal(question.feedback.reason, amendment.beforeReason, `${question.questionId} frozen v19 Reason baseline`);
  return {
    ...question,
    feedback: { ...question.feedback, reason: amendment.reason },
  };
}

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
  const sourcePath = path.resolve(currentContentRoot, "content/object-oriented-design-interview", NODE, file);
  return JSON.parse(readFileSync(sourcePath, "utf8")) as readonly Question[];
}

function isSingleChoice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

function sourcePath(relativePath: string): string {
  return path.resolve(currentContentRoot, relativePath);
}

const ACCEPTED_N01 = [
  "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json",
  "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B02.json",
  "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B03.json",
  "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B04.json",
  "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B05.json",
  "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B06.json",
  "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B07.json",
  "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B08.json",
] as const;

const ACCEPTED_N02 = [
  "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B01.json",
  "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B02.json",
  "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B03.json",
  "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B04.json",
  "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B05.json",
  "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B06.json",
  "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B07.json",
  "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B08.json",
] as const;

test("OOD19 frozen bindings cover all nine reviewed 18-item payloads", () => {
  let count = 0;
  for (const unit of UNITS) count += readFrozenQuestions(unit).length;
  assert.equal(count, 162);
});

test("OOD19 keeps all current N01 and N02 source objects byte-identical in runtime", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  for (const [accepted, expectedCount, nodeId] of [[ACCEPTED_N01, 136, N01_NODE], [ACCEPTED_N02, 152, N02_NODE]] as const) {
    let count = 0;
    const ids = new Set<string>();
    for (const relativePath of accepted) {
      const bytes = readFileSync(sourcePath(relativePath));
      const questions = JSON.parse(bytes.toString("utf8")) as readonly Question[];
      count += questions.length;
      for (const question of questions) {
        assert.equal(question.nodeId, nodeId, `${question.questionId} belongs to its source node`);
        assert.equal(ids.has(question.questionId), false, `${question.questionId} is unique across source files`);
        ids.add(question.questionId);
        assert.deepEqual(track.getQuestion(question.questionId), question, `${question.questionId} current APP runtime matches selected source`);
      }
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
      const expectedCurrent = currentExpectedQuestion(question);
      const sourceQuestion = source.find((candidate) => candidate.questionId === question.questionId);
      assert.ok(sourceQuestion, `${unit.id} source contains ${question.questionId}`);
      assert.deepEqual(sourceQuestion, expectedCurrent, `${question.questionId} source matches the frozen payload with only the fixed 19a Reason overlay`);
      assert.deepEqual(track.getQuestion(question.questionId), expectedCurrent, `${question.questionId} runtime artifact matches source`);
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
      assert.equal(question.feedback.reason, currentExpectedQuestion(reviewed).feedback.reason, `${reviewed.questionId} uses its current fixed Reason expectation`);
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
      assert.equal(preAnswer.interaction.interactionType, "choice_single");
      assert.deepEqual((preAnswer.interaction.model as { renderer: { kind: string; options: readonly { id: string; selected: boolean; text: string }[] } }).renderer, {
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
      const model = controls.model as { renderer: { kind: string; options: readonly { id: string }[] }; accessibility: { label: string; controls: readonly { id: string; role: string; checked: boolean; label: string }[] } };
      assert.equal(model.renderer.kind, "choice");
      assert.deepEqual(model.renderer.options.map((option) => option.id), displayOrder);
      assert.equal(model.accessibility.label, question.prompt);
      assert.deepEqual(model.accessibility.controls.map((control) => control.id), displayOrder);
      for (const control of model.accessibility.controls) {
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
        const feedback = composeCanonicalFeedback(question, response, scoreCanonicalQuestion(question, response));
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

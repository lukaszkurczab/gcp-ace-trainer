import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";

import {
  composeCanonicalFeedback,
  projectCanonicalChoiceFeedbackControls,
} from "../application/canonical/canonicalInteractionPresentation";
import { toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import { canonicalSerialize } from "../infrastructure/identity/canonicalSerialization";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
import { scoreCanonicalQuestion } from "./canonical/questionScoring";
import type { CanonicalFeedbackMessage, Question } from "./canonical/questionTypes";

const PACKET = "src/content/__fixtures__/release-acceptance/ood-remaining-closure-22";
const MAP_PATH = `${PACKET}/ROOT-N06-PRODUCER-MAP.json`;
const MAP_SHA256 = "9369a886d8c091b4ee68bbb34818ec2001f1ff42698e59721548074729ef9e68";
const PROOF_PATH = "../patternly-content/evidence/business-quality/bizq-01-ood-node-closure-22.json";
const TRACK = "object-oriented-design-interview";
const NODE = "behavior_state_commands_events_and_workflows";
const N01_NODE = "requirements_use_cases_domain_vocabulary_and_model_boundaries";
const N02_NODE = "objects_responsibilities_encapsulation_and_invariants";
const N03_NODE = "relationships_composition_ownership_lifecycle_and_dependencies";
const N04_NODE = "interfaces_polymorphism_substitution_and_extensibility";
const ORDINARY_N01_MODES = [
  "design-interview-learn-framework",
  "design-interview-tradeoff-practice",
  "design-interview-weak-area-review",
] as const;

type SourceBinding = Readonly<{
  sourceFile: string;
  beforeSourceSha256: string;
  sourceSha256: string;
  nodeId: string;
  mentalUnitId: string;
}>;
type SameIdCorrection = Readonly<{
  sourceFile: string;
  beforeSourceSha256: string;
  sourceSha256: string;
  beforeQuestionId: string;
  questionId: string;
  nodeId: string;
  mentalUnitId: string;
  learningObjective: string;
  acceptedOptionId: string;
  currentQuestion: Question;
}>;
type ProducerMap = Readonly<{
  result: string;
  registrySha256: string;
  beforeContentVersion: string;
  contentVersion: string;
  beforeQuestionSetSha256: string;
  questionSetSha256: string;
  sourceFiles: readonly SourceBinding[];
  replacements: readonly unknown[];
  sameIdCorrections: readonly SameIdCorrection[];
}>;
type Proof = Readonly<{
  schemaVersion: string;
  trackId: string;
  beforeContentVersion: string;
  contentVersion: string;
  beforeQuestionSetSha256: string;
  questionSetSha256: string;
  sourceFiles: readonly SourceBinding[];
  replacements: readonly unknown[];
  sameIdCorrections: readonly SameIdCorrection[];
}>;
type SingleChoiceQuestion = Extract<Question, { interaction: { type: "choice_single" } }>;

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function isSingleChoice(question: Question): question is SingleChoiceQuestion {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

function readMap(): ProducerMap {
  const bytes = readFileSync(path.resolve(MAP_PATH));
  assert.equal(sha256(bytes), MAP_SHA256, "root-frozen N06 producer-map bytes");
  const map = JSON.parse(bytes.toString("utf8")) as ProducerMap;
  assert.equal(map.result, "PASS");
  assert.equal(map.registrySha256, "fe693c44f41e3f923764d44eb587ad97ce95a9fc3e1293b96c08bfd72e046a9c");
  assert.equal(map.beforeContentVersion, "object-oriented-design-interview-authoring-v2026.10.04-bizq01-21");
  assert.equal(map.contentVersion, "object-oriented-design-interview-authoring-v2026.10.04-bizq01-22");
  assert.equal(map.beforeQuestionSetSha256, "6d19a75e8eae86869b3ce31b63ad57a6be13fc30532c22e993db6fbc3d0d4d12");
  assert.equal(map.questionSetSha256, "c6cf903178b823fb71ac29040f3c5fa5f72c619d3adbb525fc7791756654ac3e");
  assert.deepEqual(map.replacements, [], "the accepted N06 map retains all question IDs");
  assert.equal(map.sourceFiles.length, 10);
  assert.equal(map.sameIdCorrections.length, 180);
  assert.equal(new Set(map.sameIdCorrections.map((entry) => entry.questionId)).size, 180);
  for (const entry of map.sameIdCorrections) {
    assert.equal(entry.beforeQuestionId, entry.questionId, `${entry.questionId} retains its question identity`);
    assert.equal(entry.nodeId, NODE);
    assert.match(entry.mentalUnitId, /^OOD-N06-B(?:0[1-9]|10)$/u);
    assert.ok(entry.learningObjective.length > 0);
    assert.equal(entry.currentQuestion.questionId, entry.questionId);
    assert.equal(entry.currentQuestion.mentalUnitId, entry.mentalUnitId);
    assert.equal(entry.currentQuestion.nodeId, NODE);
    assert.equal(entry.currentQuestion.trackId, TRACK);
  }
  return map;
}

function readProof(): Proof {
  const bytes = readFileSync(path.resolve(PROOF_PATH));
  const proof = JSON.parse(bytes.toString("utf8")) as Proof;
  assert.equal(sha256(bytes), "5987128d427d0362b2fe83f6ab62bf2483169374c51941bf23fc3b192f0e089c", "exact fixed22 proof bytes");
  assert.equal(proof.schemaVersion, "patternly-bizq-semantic-replacement-v1");
  assert.equal(proof.trackId, TRACK);
  return proof;
}

function sourcePath(sourceFile: string): string {
  return path.resolve("../patternly-content", sourceFile);
}

test("OOD22 producer proof binds the frozen 180-item same-ID map and exact source files", () => {
  const map = readMap();
  const proof = readProof();
  assert.equal(proof.beforeContentVersion, map.beforeContentVersion);
  assert.equal(proof.contentVersion, map.contentVersion);
  assert.equal(proof.beforeQuestionSetSha256, map.beforeQuestionSetSha256);
  assert.equal(proof.questionSetSha256, map.questionSetSha256);
  assert.deepEqual(proof.sourceFiles, map.sourceFiles, "the activated proof preserves every fixed source binding");
  assert.deepEqual(proof.replacements, []);
  assert.equal(proof.sameIdCorrections.length, 180);

  const proofById = new Map(proof.sameIdCorrections.map((entry) => [entry.questionId, entry]));
  const fileBindings = new Map(map.sourceFiles.map((binding) => [binding.sourceFile, binding]));
  for (const [file, binding] of fileBindings) {
    const bytes = readFileSync(sourcePath(file));
    assert.equal(sha256(bytes), binding.sourceSha256, `${file} current raw source hash`);
    const questions = JSON.parse(bytes.toString("utf8")) as readonly Question[];
    assert.equal(questions.length, 18, `${file} item count`);
    const expectedForFile = map.sameIdCorrections.filter((entry) => entry.sourceFile === file);
    assert.equal(expectedForFile.length, 18, `${file} fixed map size`);
    for (const expected of expectedForFile) {
      const source = questions.find((question) => question.questionId === expected.questionId);
      assert.ok(source, `${file} contains ${expected.questionId}`);
      assert.deepEqual(source, expected.currentQuestion, `${expected.questionId} source matches the fixed map`);
      const proofEntry = proofById.get(expected.questionId);
      assert.ok(proofEntry, `proof contains ${expected.questionId}`);
      assert.equal(proofEntry.sourceFile, expected.sourceFile);
      assert.equal(proofEntry.sourceSha256, expected.sourceSha256);
      assert.equal(proofEntry.beforeSourceSha256, expected.beforeSourceSha256);
      assert.equal(proofEntry.acceptedOptionId, expected.acceptedOptionId);
      assert.deepEqual(proofEntry.currentQuestion, expected.currentQuestion, `${expected.questionId} proof binds the reviewed whole object`);
    }
  }
});

test("OOD22 loaded runtime matches every fixed same-ID question object", async () => {
  const map = readMap();
  const runtime = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  assert.equal(runtime.contentVersion, "object-oriented-design-interview-authoring-v2026.10.05-bizq01-24");
  assert.equal(runtime.questions.length, 1413);
  assert.equal(sha256(Buffer.from(canonicalSerialize([...runtime.questions].sort((a, b) => a.questionId.localeCompare(b.questionId))))), "c92a9f04488efb4ef7a5fa8b3257495c21e6c62125123df8073141c60000b2d8", "whole current v24 runtime QSet matches producer; historical22 map stays fixed");
  const questions = runtime.getQuestionsForNode(NODE);
  assert.equal(questions.length, 180);
  assert.deepEqual(
    questions.map((question) => question.questionId).sort(),
    map.sameIdCorrections.map((entry) => entry.questionId).sort(),
    "runtime has exactly the fixed 180 retained question IDs",
  );
  for (const expected of map.sameIdCorrections) {
    assert.deepEqual(runtime.getQuestion(expected.questionId), expected.currentQuestion, `${expected.questionId} runtime matches frozen proposal`);
  }
});

test("OOD22 scoring, option-order reversal, feedback targets and pre-answer view use fixed IDs", () => {
  const map = readMap();
  for (const entry of map.sameIdCorrections) {
    const expected = entry.currentQuestion;
    assert.ok(isSingleChoice(expected), `${entry.questionId} remains a single-choice item`);
    // Exercise the application scorer/presentation against the exact fixed
    // source object. Runtime equality is independently checked above so this
    // behavioral check remains useful in the pre-sync source22 window.
    const question = expected;
    assert.equal(expected.answer.optionId, entry.acceptedOptionId);

    const optionIds = expected.interaction.options.map((option) => option.optionId);
    assert.equal(new Set(optionIds).size, optionIds.length, `${entry.questionId} option IDs are unique within the question`);
    assert.deepEqual(
      (expected.feedback.messages ?? []).filter((message) => message.kind === "wrong_option").map((message) => message.targetId).sort(),
      optionIds.filter((id) => id !== expected.answer.optionId).sort(),
      `${entry.questionId} diagnoses each actual wrong option ID exactly once`,
    );

    const beforeAnswer = toCanonicalQuestionViewModel(question);
    assert.deepEqual(Object.keys(beforeAnswer).sort(), ["constraints", "interaction", "itemId", "prompt"]);
    assert.equal(beforeAnswer.itemId, entry.questionId);
    assert.equal("answer" in beforeAnswer, false);
    assert.equal("feedback" in beforeAnswer, false);
    assert.deepEqual(beforeAnswer.interaction, {
      kind: "choice",
      options: expected.interaction.options.map((option) => ({ id: option.optionId, selected: false, text: option.text })),
    });

    const reversed: SingleChoiceQuestion = {
      ...question,
      interaction: { ...question.interaction, options: [...question.interaction.options].reverse() },
    };
    for (const optionId of optionIds) {
      const response = { type: "choice_single", optionId } as const;
      const correct: boolean = optionId === expected.answer.optionId;
      const score = scoreCanonicalQuestion(question, response);
      assert.equal(score.kind, correct ? "correct" : "incorrect", `${entry.questionId}/${optionId}`);
      assert.equal(score.earnedPoints, correct ? 1 : 0);
      assert.deepEqual(scoreCanonicalQuestion(reversed, response), score, "score follows option ID when presentation order changes");

      const feedback = composeCanonicalFeedback(question, response);
      assert.equal(feedback.correctness, correct ? "correct" : "incorrect");
      assert.equal(feedback.reason, expected.feedback.reason);
      assert.deepEqual(feedback.details, expected.feedback.details);
      if (correct) {
        assert.deepEqual(feedback.messages, []);
      } else {
        const expectedMessage: CanonicalFeedbackMessage | undefined = expected.feedback.messages?.find((message) => message.kind === "wrong_option" && message.targetId === optionId);
        assert.ok(expectedMessage, `${entry.questionId}/${optionId} has exact feedback`);
        assert.deepEqual(feedback.messages, [expectedMessage]);
      }
      const controls = projectCanonicalChoiceFeedbackControls(question, response);
      assert.equal(controls.find((control) => control.id === optionId)?.state, correct ? "correct" : "incorrect");
    }
  }
});

test("OOD22 preserves accepted N01-N05 node counts and the exact ordinary N01 pools", async () => {
  const map = readMap();
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  const expectedN01 = track.getQuestionsForNode(N01_NODE).map((question) => question.questionId).sort();
  assert.equal(expectedN01.length, 136);
  assert.equal(track.getQuestionsForNode(N02_NODE).length, 152);
  assert.equal(track.getQuestionsForNode(N03_NODE).length, 162);
  assert.equal(track.getQuestionsForNode(N04_NODE).length, 162);
  assert.equal(track.getQuestionsForNode("object_creation_configuration_and_structural_patterns").length, 153);
  assert.equal(track.getQuestionsForNode(NODE).length, 180);
  for (const modeId of ORDINARY_N01_MODES) {
    const poolIds = track.getPool(modeId).map((question) => question.questionId).sort();
    assert.deepEqual(poolIds, expectedN01, `${modeId} remains the exact accepted N01 pool`);
    for (const entry of map.sameIdCorrections) {
      assert.equal(poolIds.includes(entry.questionId), false, `${modeId} excludes N06 ${entry.questionId}`);
    }
  }
});

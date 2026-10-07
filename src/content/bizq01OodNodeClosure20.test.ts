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
import type { Question } from "./canonical/questionTypes";

const PACKET = "src/content/__fixtures__/release-acceptance/ood-node-closure-20";
const TRACK = "object-oriented-design-interview";
const NODE = "interfaces_polymorphism_substitution_and_extensibility";
const N01_NODE = "requirements_use_cases_domain_vocabulary_and_model_boundaries";
const N02_NODE = "objects_responsibilities_encapsulation_and_invariants";
const N03_NODE = "relationships_composition_ownership_lifecycle_and_dependencies";
const ORDINARY_N01_MODES = [
  "design-interview-learn-framework",
  "design-interview-tradeoff-practice",
  "design-interview-weak-area-review",
] as const;

// Fixed proposal hashes from ROOT-FINAL-BINDINGS-v2.json. B05 preserves its
// 18 existing identities; the other eight units replace i001–i018 with i019–i036.
const UNITS = [
  { id: "OOD-N04-B01", proposal: "proposals/OOD-N04-B01.json", source: "OOD-N04-B01.json", sha256: "ad156610a40fedb29d0bb14022703b15e19806ac3aaa7d26dfd4258e68c160c5", sourceSha256: "14689bf58bc6b5fc92e19b58f3ea6c030d0d876b9d7f7d0226639f1078b1a3ab", replaces: true },
  { id: "OOD-N04-B02", proposal: "proposals/OOD-N04-B02.json", source: "OOD-N04-B02.json", sha256: "ee5b26078ae2af3f1221ca2370425d89882fcbac8f598d22ba5dc82e5bb9fa9d", sourceSha256: "07dc546ab1fe0b27faf59b90415dce6d19c5f84fb3d9e0b5d9b9367089540027", replaces: true },
  { id: "OOD-N04-B03", proposal: "proposals/OOD-N04-B03.json", source: "OOD-N04-B03.json", sha256: "76011c4b1ba9440b126af651a84aae1925c06d4f9955784ebf6f2067562b1e28", sourceSha256: "df3d74abef8658fe3a038af2975644dea70240e549da3c84d0b6358dc27cd770", replaces: true },
  { id: "OOD-N04-B04", proposal: "proposals/OOD-N04-B04.json", source: "OOD-N04-B04.json", sha256: "f5a3005b9acaccf1c15f4bd6aef56af2a13ebfcfd3d65c5c85f58ef94f8e435e", sourceSha256: "111104dbb3d8b2c1d09c49d824a23719808a194bd4d53842cc573724df003f55", replaces: true },
  { id: "OOD-N04-B05", proposal: "proposals/OOD-N04-B05.json", source: "OOD-N04-B05.json", sha256: "4e3082cf3cfbe54d3249182d8716c2617957345612a7244841087b83e7b32be7", sourceSha256: "87d3159243ad32fcf4739799478a69b2f8d9eb22994a9a2b701ecaa2752e5950", replaces: false },
  { id: "OOD-N04-B06", proposal: "proposals/OOD-N04-B06.json", source: "OOD-N04-B06.json", sha256: "5337a01630671e66befadf3fdb51256ede430769b2ea2c4cac12f7288a79ee47", sourceSha256: "ae0a8306d017225a899a8aa7b4038eca836550c51c702a9c9e3c49fd1c30eef0", replaces: true },
  { id: "OOD-N04-B07", proposal: "proposals/OOD-N04-B07.json", source: "OOD-N04-B07.json", sha256: "dcb09dd65116aede41d068a293ffa25408547df9dd39bb2721112efea61e20df", sourceSha256: "17e336e71bc3690f9c2bf6d0783099261662fb5551f8e2d942df22948bee217f", replaces: true },
  { id: "OOD-N04-B08", proposal: "proposals/OOD-N04-B08.json", source: "OOD-N04-B08.json", sha256: "568fc311163050145b8b7fa16e5956160c83852da5c7228070f7ce1d711b5c33", sourceSha256: "431555e485c0362703faa4bcd660ad8627774bd6d02619d12520d35d53caf183", replaces: true },
  { id: "OOD-N04-B09", proposal: "proposals/OOD-N04-B09.json", source: "OOD-N04-B09.json", sha256: "a99275dda3ff1492654aa7777ee3ea56a227926b3730536f5ac6aaea95fa4506", sourceSha256: "f51418182cf1beee23a947de3f67771bddfd023a5e6599350c6be63e9b15a87c", replaces: true },
] as const;

type Unit = (typeof UNITS)[number];
type SingleChoiceQuestion = Extract<Question, { interaction: { type: "choice_single" } }>;

function isSingleChoice(question: Question): question is SingleChoiceQuestion {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

function sourcePath(relativePath: string): string {
  return path.resolve("../patternly-content", relativePath);
}

function unitSourcePath(unit: Unit): string {
  return sourcePath(`content/object-oriented-design-interview/${NODE}/${unit.source}`);
}

function oldId(unit: Unit, index: number): string {
  return `ood-n04-${unit.id.slice(-3).toLowerCase()}-i${String(index + 1).padStart(3, "0")}`;
}

function expectedId(unit: Unit, index: number): string {
  return unit.replaces
    ? `ood-n04-${unit.id.slice(-3).toLowerCase()}-i${String(index + 19).padStart(3, "0")}`
    : oldId(unit, index);
}

function readProposal(unit: Unit): readonly SingleChoiceQuestion[] {
  const bytes = readFileSync(path.resolve(PACKET, unit.proposal));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), unit.sha256, `${unit.id} frozen proposal bytes`);
  const questions = JSON.parse(bytes.toString("utf8")) as readonly Question[];
  assert.equal(questions.length, 18, `${unit.id} proposal question count`);
  for (const [index, question] of questions.entries()) {
    assert.ok(isSingleChoice(question), `${question.questionId} uses the reviewed single-choice contract`);
    assert.equal(question.questionId, expectedId(unit, index), `${unit.id} fixed question identity at index ${index}`);
    assert.equal(question.mentalUnitId, unit.id);
    assert.equal(question.nodeId, NODE);
    assert.ok(question.interaction.options.length >= 2);
    assert.ok(question.interaction.options.some((option) => option.optionId === question.answer.optionId));
    assert.deepEqual(
      (question.feedback.messages ?? []).filter((message) => message.kind === "wrong_option").map((message) => message.targetId).sort(),
      question.interaction.options.map((option) => option.optionId).filter((id) => id !== question.answer.optionId).sort(),
      `${question.questionId} has exactly one stable-ID diagnostic per incorrect option`,
    );
  }
  return questions as readonly SingleChoiceQuestion[];
}

function readSourceQuestions(unit: Unit): readonly Question[] {
  const bytes = readFileSync(unitSourcePath(unit));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), unit.sourceSha256, `${unit.id} exact source bytes`);
  return JSON.parse(bytes.toString("utf8")) as readonly Question[];
}

test("OOD20 frozen bindings cover the nine reviewed N04 payloads and exact identity map", () => {
  const questions = UNITS.flatMap(readProposal);
  assert.equal(questions.length, 162);
  assert.equal(new Set(questions.map((question) => question.questionId)).size, 162);
  assert.equal(questions.filter((question) => question.mentalUnitId === "OOD-N04-B05").length, 18, "B05 retains its 18 reviewed IDs");
  assert.equal(questions.filter((question) => /-i(?:0(?:19|2\d|3[0-6]))$/u.test(question.questionId)).length, 144, "the other eight units use their reserved replacement IDs");
  assert.equal(UNITS.filter((unit) => unit.replaces).length * 18, 144);
  assert.equal(UNITS.filter((unit) => !unit.replaces).length * 18, 18);
});

for (const unit of UNITS) {
  test(`OOD20 ${unit.id} source and loaded runtime match the fixed payload and retired identities`, async () => {
    const proposal = readProposal(unit);
    const source = readSourceQuestions(unit);
    assert.equal(source.length, 18, `${unit.id} source count`);
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
    for (const [index, expected] of proposal.entries()) {
      const sourceQuestion = source.find((question) => question.questionId === expected.questionId);
      assert.ok(sourceQuestion, `source contains ${expected.questionId}`);
      assert.deepEqual(sourceQuestion, expected, `${expected.questionId} source matches fixed proposal`);
      assert.deepEqual(track.getQuestion(expected.questionId), expected, `${expected.questionId} loaded artifact matches source`);
      if (unit.replaces) {
        const predecessor = oldId(unit, index);
        assert.equal(source.some((question) => question.questionId === predecessor), false, `${predecessor} is retired from source`);
        assert.equal(track.getQuestion(predecessor), undefined, `${predecessor} is retired from runtime`);
      }
    }
  });
}

for (const unit of UNITS) {
  test(`OOD20 ${unit.id} scoring, option order, feedback and pre-answer presentation use stable IDs`, async () => {
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
    for (const expected of readProposal(unit)) {
      const question = track.getQuestion(expected.questionId);
      assert.ok(question, `runtime contains ${expected.questionId}`);
      assert.deepEqual(question, expected);
      assert.equal(question.feedback.reason, expected.feedback.reason);
      assert.deepEqual(question.feedback.details, expected.feedback.details);

      const optionIds = expected.interaction.options.map((option) => option.optionId);
      const answerId = expected.answer.optionId;
      const preAnswer = toCanonicalQuestionViewModel(question);
      assert.deepEqual(Object.keys(preAnswer).sort(), ["constraints", "interaction", "itemId", "prompt"]);
      assert.equal(preAnswer.itemId, question.questionId);
      assert.equal(preAnswer.prompt, question.prompt);
      assert.deepEqual(preAnswer.constraints, question.constraints ?? []);
      assert.equal("answer" in preAnswer, false);
      assert.equal("feedback" in preAnswer, false);
      assert.deepEqual(preAnswer.interaction, {
        kind: "choice",
        options: expected.interaction.options.map((option) => ({ id: option.optionId, selected: false, text: option.text })),
      });
      const controls = buildCanonicalInteractionViewModel(question, null, [...optionIds].reverse());
      assert.equal(controls.renderer.kind, "choice");
      assert.deepEqual(controls.renderer.kind === "choice" ? controls.renderer.options.map((option) => option.id) : [], [...optionIds].reverse());
      assert.equal(controls.accessibility.label, question.prompt);
      assert.deepEqual(controls.accessibility.controls.map((control) => control.id), [...optionIds].reverse());
      for (const control of controls.accessibility.controls) {
        assert.equal(control.role, "radio");
        assert.equal(control.checked, false);
        assert.equal(control.label, expected.interaction.options.find((option) => option.optionId === control.id)?.text);
      }

      const reversed: SingleChoiceQuestion = {
        ...question,
        interaction: { ...question.interaction, options: [...question.interaction.options].reverse() },
      };
      for (const optionId of optionIds) {
        const response = { type: "choice_single", optionId } as const;
        const correct = optionId === answerId;
        const score = scoreCanonicalQuestion(question, response);
        assert.equal(score.kind, correct ? "correct" : "incorrect", `${question.questionId}/${optionId}`);
        assert.equal(score.earnedPoints, correct ? 1 : 0);
        assert.deepEqual(scoreCanonicalQuestion(reversed, response), score, "scoring follows the option ID regardless of order");

        const feedback = composeCanonicalFeedback(question, response);
        assert.equal(feedback.correctness, correct ? "correct" : "incorrect");
        assert.equal(feedback.reason, expected.feedback.reason);
        assert.deepEqual(feedback.details, expected.feedback.details);
        const controlsAfterAnswer = projectCanonicalChoiceFeedbackControls(question, response);
        assert.equal(controlsAfterAnswer.find((control) => control.id === optionId)?.state, correct ? "correct" : "incorrect");
        if (correct) {
          assert.deepEqual(feedback.messages, []);
        } else {
          const authored = expected.feedback.messages?.find((message) => message.kind === "wrong_option" && message.targetId === optionId);
          assert.ok(authored, `${question.questionId}/${optionId} has authored stable-ID feedback`);
          assert.deepEqual(feedback.messages, [authored]);
        }
      }
    }
  });
}

test("OOD20 leaves accepted node counts and the three ordinary N01 pools unchanged", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  const n01Ids = track.getQuestionsForNode(N01_NODE).map((question) => question.questionId).sort();
  assert.equal(n01Ids.length, 136);
  assert.equal(track.getQuestionsForNode(N02_NODE).length, 152);
  assert.equal(track.getQuestionsForNode(N03_NODE).length, 162);
  const candidateIds = UNITS.flatMap((unit) => readProposal(unit).map((question) => question.questionId));
  for (const modeId of ORDINARY_N01_MODES) {
    const poolIds = track.getPool(modeId).map((question) => question.questionId).sort();
    assert.deepEqual(poolIds, n01Ids, `${modeId} retains the exact accepted N01 pool`);
    for (const questionId of candidateIds) assert.equal(poolIds.includes(questionId), false, `${modeId} does not grant N04 eligibility to ${questionId}`);
  }
});

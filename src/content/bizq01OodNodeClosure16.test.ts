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

const PACKET = "src/content/__fixtures__/release-acceptance/ood-node-closure-16";
const TRACK = "object-oriented-design-interview";
const NODE = "requirements_use_cases_domain_vocabulary_and_model_boundaries";
const MODES = [
  "design-interview-learn-framework",
  "design-interview-tradeoff-practice",
  "design-interview-weak-area-review",
] as const;

// Hashes freeze the seven independently reviewed payload inputs. Bindings are
// derived only after each complete proposal matches its reviewed SHA-256.
const UNITS = [
  { id: "OOD-N01-B02", proposal: "PROPOSED-B02.json", sha256: "7d22a87115311693ffd644abaf587dc88a998cf9cd1a314aed126f5672ef03ec", source: "OOD-N01-B02.json" },
  { id: "OOD-N01-B03", proposal: "PROPOSED-B03.json", sha256: "d12d12454103c7ec897a331b9ac1200b4cb8ee6be9e7324bd886f639625ce374", source: "OOD-N01-B03.json" },
  { id: "OOD-N01-B04", proposal: "PROPOSED-B04.json", sha256: "2d48ef31dccbfee7e5b16f7c835bb663ac3a4bae64f6f3cdb3c694d35f3bfec4", source: "OOD-N01-B04.json" },
  { id: "OOD-N01-B05", proposal: "PROPOSED-B05.json", sha256: "9a8bc00943bf65ea36223f9d5513c7cfa26df7357e77e99848faf3c88235556d", source: "OOD-N01-B05.json" },
  { id: "OOD-N01-B06", proposal: "PROPOSED-B06.json", sha256: "d09097dc78773ac03587b649e4d4e78f672208ef554b21eb76dfb801d7393c7b", source: "OOD-N01-B06.json" },
  { id: "OOD-N01-B07", proposal: "PROPOSED-B07.json", sha256: "a3e7964e959f710e2d2029e8b98c7f3b9135deaee7f98ada02f3862fa60a5e43", source: "OOD-N01-B07.json" },
  { id: "OOD-N01-B08", proposal: "PROPOSED-B08.json", sha256: "0c1053f6c6e722dc6954c4dc56cfbeed407d9ad9082ed3550129acb565612319", source: "OOD-N01-B08.json" },
] as const;

type ProposalEntry = Readonly<{
  beforeQuestionId?: string;
  questionId: string;
  question: Question;
}>;

function readFrozenEntries(unit: (typeof UNITS)[number]): readonly ProposalEntry[] {
  const bytes = readFileSync(path.resolve(PACKET, unit.proposal));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), unit.sha256, `${unit.id} frozen proposal bytes`);
  const rawEntries = JSON.parse(bytes.toString("utf8")) as readonly (Omit<ProposalEntry, "question"> & { question?: Question } & Partial<Question>)[];
  const entries: readonly ProposalEntry[] = rawEntries.map((entry) => ({
    beforeQuestionId: entry.beforeQuestionId,
    questionId: entry.questionId!,
    question: entry.question ?? entry as Question,
  }));
  assert.equal(entries.length, 17, `${unit.id} replacement count`);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    const suffix = String(index + 18).padStart(3, "0");
    assert.equal(entry.questionId, `ood-n01-${unit.id.slice(-3).toLowerCase()}-i${suffix}`);
    const predecessorId = `ood-n01-${unit.id.slice(-3).toLowerCase()}-i${String(index + 1).padStart(3, "0")}`;
    if (entry.beforeQuestionId !== undefined) assert.equal(entry.beforeQuestionId, predecessorId);
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

test("OOD16 frozen bindings cover the seven final 17-item payloads", () => {
  let count = 0;
  for (const unit of UNITS) {
    const entries = readFrozenEntries(unit);
    count += entries.length;
  }
  assert.equal(count, 119);
});

test("OOD16 preserves the complete B01 source unit in the current artifact", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  const source = sourceQuestions("OOD-N01-B01.json");
  assert.equal(source.length, 17);
  assert.deepEqual(source.map((question) => question.questionId), Array.from({ length: 17 }, (_, index) => `ood-n01-b01-i${String(index + 18).padStart(3, "0")}`));
  for (const question of source) assert.deepEqual(track.getQuestion(question.questionId), question);
});

for (const unit of UNITS) {
  test(`OOD16 ${unit.id} source payloads, replacement identities and retired IDs are exact`, async () => {
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
    const entries = readFrozenEntries(unit);
    const source = sourceQuestions(unit.source);
    assert.equal(source.length, 17, `${unit.id} current source count`);
    for (const [index, entry] of entries.entries()) {
      const predecessorId = `ood-n01-${unit.id.slice(-3).toLowerCase()}-i${String(index + 1).padStart(3, "0")}`;
      const sourceQuestion = source.find((question) => question.questionId === entry.questionId);
      assert.ok(sourceQuestion, `${unit.id} current source contains ${entry.questionId}`);
      assert.deepEqual(sourceQuestion, entry.question, `${entry.questionId} source is the frozen reviewed payload`);
      assert.deepEqual(track.getQuestion(entry.questionId), sourceQuestion, `${entry.questionId} bundled artifact matches source`);
      assert.equal(source.some((question) => question.questionId === predecessorId), false, `${predecessorId} is retired from source`);
      assert.equal(track.getQuestion(predecessorId), undefined, `${predecessorId} is retired from the current artifact`);
    }
  });

  test(`OOD16 ${unit.id} real choice scoring, accessibility and submitted feedback follow fixed option IDs`, async () => {
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

test("OOD16 all three actual canonical mode pools contain the full current 136-question node", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  const nodeIds = track.getQuestionsForNode(NODE).map((question) => question.questionId).sort();
  assert.equal(nodeIds.length, 136);
  for (const modeId of MODES) {
    const poolIds = track.getPool(modeId).map((question) => question.questionId).sort();
    assert.equal(poolIds.length, 136, `${modeId} actual configured pool size`);
    assert.deepEqual(poolIds, nodeIds, `${modeId} resolves to the whole canonical node pool`);
    for (const unit of UNITS) for (const entry of readFrozenEntries(unit)) assert.ok(poolIds.includes(entry.questionId), `${modeId} contains ${entry.questionId}`);
  }
});

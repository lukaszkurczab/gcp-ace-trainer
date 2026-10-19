import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { composeCanonicalFeedback, projectCanonicalChoiceFeedbackControls } from "../../application/canonical/canonicalInteractionPresentation";
import { toCanonicalQuestionViewModel } from "../../features/practice/canonicalQuestionViewModel";
import { loadCanonicalRuntimeCatalog } from "../canonical/runtimeCatalog";
import { scoreCanonicalQuestion } from "../canonical/questionScoring";
import type { CanonicalFeedbackMessage, Question } from "../canonical/questionTypes";
import successorLedger from "../generated/canonical-content/content-successor-ledger.json";

const TRACK = "object-oriented-design-interview";
const N01_NODE = "requirements_use_cases_domain_vocabulary_and_model_boundaries";
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sourceRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.join(appRoot, "../patternly-content"), "content", TRACK);
const modes = ["design-interview-learn-framework", "design-interview-tradeoff-practice", "design-interview-weak-area-review"];
type SingleChoiceQuestion = Extract<Question, { interaction: { type: "choice_single" } }>;
function isSingleChoice(question: Question): question is SingleChoiceQuestion {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}

export function registerCurrentOodCases(label: string, nodes: readonly string[], answers: readonly (readonly [string, string])[], retired: readonly string[]) {
  const load = async () => {
    const runtime = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
    const source: Question[] = [];
    for (const node of nodes) {
      const directory = path.join(sourceRoot, node);
      for (const file of (await readdir(directory)).filter(name => name.endsWith(".json")).sort()) {
        source.push(...JSON.parse(await readFile(path.join(directory, file), "utf8")) as Question[]);
      }
    }
    assert.ok(source.length > 0, "targeted current source is nonempty");
    return { runtime, source };
  };

  test(`${label}: current source objects and derived identities reach the production runtime`, async () => {
    const { runtime, source } = await load();
    const successor = successorLedger.tracks.find(entry => entry.trackId === TRACK);
    assert.ok(successor);
    assert.deepEqual(runtime.trainingIdentity, { contentVersion: successor.training.contentVersion, artifactSha256: successor.training.artifactSha256 });
    assert.equal(runtime.questions.length, successor.training.questionCount);
    assert.deepEqual(runtime.planningPolicyIdentity, successor.planningPolicy);
    assert.equal(runtime.contentVersion, successor.planningPolicy.contentVersion);
    assert.equal(runtime.artifactSha256, successor.planningPolicy.artifactSha256);
    const current = nodes.flatMap(node => runtime.getQuestionsForNode(node));
    assert.deepEqual(current.map(question => question.questionId).sort(), source.map(question => question.questionId).sort());
    for (const question of source) assert.deepEqual(runtime.getQuestion(question.questionId), question, question.questionId);
    assert.equal(new Set(answers.map(([id]) => id)).size, answers.length);
    for (const [id, optionId] of answers) {
      const question = runtime.getQuestion(id);
      assert.ok(question, `${id}: independent regression case exists`);
      assert.equal(question.answer.type, "choice_single");
      if (question.answer.type === "choice_single") assert.equal(question.answer.optionId, optionId, `${id}: independently expected answer`);
    }
    for (const id of retired) assert.equal(runtime.getQuestion(id), undefined, `${id}: retired identity is not reassigned`);
  });

  test(`${label}: all current options keep score, feedback and pre-answer projection through reversal`, async () => {
    const { runtime, source } = await load();
    const expectedAnswers = new Map(answers);
    for (const authored of source) {
      const question = runtime.getQuestion(authored.questionId)!;
      assert.ok(isSingleChoice(question), "Expected OOD single choice");
      const expectedId = expectedAnswers.get(question.questionId) ?? question.answer.optionId;
      const optionIds = question.interaction.options.map(option => option.optionId);
      assert.equal(new Set(optionIds).size, optionIds.length);
      assert.deepEqual((question.feedback.messages ?? []).filter(message => message.kind === "wrong_option").map(message => message.targetId).sort(), optionIds.filter(id => id !== expectedId).sort());
      const view = toCanonicalQuestionViewModel(question);
      assert.deepEqual(Object.keys(view).sort(), ["constraints", "interaction", "itemId", "prompt"]);
      assert.equal(view.itemId, question.questionId);
      assert.equal("answer" in view, false);
      assert.equal("feedback" in view, false);
      assert.equal(view.interaction.interactionType, "choice_single");
      assert.deepEqual((view.interaction.model as { renderer: unknown }).renderer, {
        kind: "choice", options: question.interaction.options.map(option => ({ id: option.optionId, selected: false, text: option.text })),
      });
      const reversed = { ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() } };
      for (const optionId of optionIds) {
        const response = { type: "choice_single", optionId } as const;
        const correct = optionId === expectedId;
        const score = scoreCanonicalQuestion(question, response);
        assert.equal(score.kind, correct ? "correct" : "incorrect");
        assert.equal(score.earnedPoints, correct ? 1 : 0);
        assert.deepEqual(scoreCanonicalQuestion(reversed, response), score);
        const feedback = composeCanonicalFeedback(question, response, score);
        assert.equal(feedback.correctness, correct ? "correct" : "incorrect");
        assert.equal(feedback.reason, question.feedback.reason);
        assert.deepEqual(feedback.details, question.feedback.details);
        if (correct) assert.deepEqual(feedback.messages, []);
        else {
          const message: CanonicalFeedbackMessage | undefined = question.feedback.messages?.find(entry => entry.kind === "wrong_option" && entry.targetId === optionId);
          assert.ok(message);
          assert.deepEqual(feedback.messages, [message]);
        }
        assert.equal(projectCanonicalChoiceFeedbackControls(question, response).find(control => control.id === optionId)?.state, correct ? "correct" : "incorrect");
      }
    }
  });

  test(`${label}: ordinary N01 pools preserve their current node boundary`, async () => {
    const { runtime, source } = await load();
    const expectedN01 = runtime.getQuestionsForNode(N01_NODE).map(question => question.questionId).sort();
    assert.ok(expectedN01.length > 0);
    for (const modeId of modes) {
      const ids = runtime.getPool(modeId).map(question => question.questionId).sort();
      assert.deepEqual(ids, expectedN01, modeId);
      for (const question of source) assert.equal(ids.includes(question.questionId), false, `${modeId}: excludes other-node question ${question.questionId}`);
    }
  });
}

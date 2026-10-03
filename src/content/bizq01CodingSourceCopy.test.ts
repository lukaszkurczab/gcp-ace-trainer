import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadCanonicalRuntimeCatalog, scoreCanonicalQuestion, type Question } from "./canonical";
import { toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import { detailLines } from "../features/practice/feedbackDetails";
import { buildCanonicalInteractionViewModel, composeCanonicalFeedback, projectCanonicalChoiceFeedbackMessages } from "../application/canonical/canonicalInteractionPresentation";
import { CanonicalTrainingRuntime } from "../application/canonical/CanonicalTrainingRuntime";

const trackId = "coding-interview-dsa-problem-solving";
const questionId = "alg-contrast-binary-scan-correctness-006";
const version = "coding-interview-dsa-problem-solving-authoring-v2026.10.02-bizq01-04";
const trackPromise = loadCanonicalRuntimeCatalog().then((catalog) => catalog.getTrack(trackId));
const source = JSON.parse(readFileSync(new URL("../../../patternly-content/content/coding-interview-dsa-problem-solving/contrast_binary_search_vs_linear_scan/correctness_before_asymptotic_speed.json", import.meta.url), "utf8")) as Question[];

function permutations(ids: readonly string[]): string[][] {
  return ids.length === 0 ? [[]] : ids.flatMap((id, index) => permutations(ids.filter((_, position) => position !== index)).map((tail) => [id, ...tail]));
}

test("current canonical bundle carries the exact reviewed source while pre-submit hides authored feedback", async () => {
  const track = await trackPromise, question = track.getQuestion(questionId)!;
  assert.equal(track.contentVersion, version);
  assert.deepEqual(question, source.find((question) => question.questionId === questionId));
  const view = toCanonicalQuestionViewModel(question);
  assert.deepEqual(Object.keys(view).sort(), ["constraints", "interaction", "itemId", "prompt"]);
  assert.doesNotMatch(view.prompt, /\bOption\s+[AB]\b/);
  assert.ok(!JSON.stringify(view).includes(question.feedback.reason));
  assert.ok(!JSON.stringify(view).includes(JSON.stringify(question.feedback.details)));
  const lines = detailLines(question.feedback.details);
  assert.ok(lines.some((line) => line.includes("Sorting a copy before binary search")));
  assert.ok(lines.some((line) => line.includes("preprocessing required")));
  assert.doesNotMatch(lines.join("\n"), /\bStrategy\s+[AB]\b/);
  assert.deepEqual(track.modes.filter((mode) => track.getPool(mode.modeId).some((question) => question.questionId === questionId)), []);
  assert.ok((track.simulationProfiles ?? []).every((profile) => profile.familyId !== "coding_interview" || !profile.familyConfig.eligibleQuestionIds.includes(questionId)));
});

test("all24 saved legal permutations preserve every selected stable ID, score and authored feedback", async () => {
  const track = await trackPromise, question = track.getQuestion(questionId)!;
  if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Expected reviewed single-choice contract.");
  const orders = permutations(question.interaction.options.map((option) => option.optionId));
  assert.equal(orders.length, 24);
  for (const order of orders) for (const option of question.interaction.options) {
    const response = { type: "choice_single" as const, optionId: option.optionId };
    const vm = buildCanonicalInteractionViewModel(question, response, order);
    assert.equal(vm.renderer.kind, "choice");
    if (vm.renderer.kind !== "choice") throw new Error("Expected real choice VM.");
    assert.deepEqual(vm.renderer.options.map((option) => option.id), order);
    assert.deepEqual(vm.renderer.options.filter((option) => option.selected).map((option) => option.id), [option.optionId]);
    assert.deepEqual(vm.accessibility.controls.filter((control) => control.checked).map((control) => control.id), [option.optionId]);
    const score = scoreCanonicalQuestion(question, response);
    assert.equal(score.kind, option.optionId === "scan" ? "correct" : "incorrect");
    assert.deepEqual(composeCanonicalFeedback(question, response), { correctness: score.kind, reason: question.feedback.reason, details: question.feedback.details, messages: projectCanonicalChoiceFeedbackMessages(question, response) });
    if (option.optionId !== "scan") assert.equal(question.feedback.messages?.filter((message) => message.targetId === option.optionId).length, 1);
  }
});

test("real current Coding practice rejects an old-package active session instead of substituting new content", async () => {
  const track = await trackPromise, runtime = new CanonicalTrainingRuntime(track);
  const { session, draft } = await runtime.prepare({ trackId, modeId: "coding-interview-learn-approach", request: { sessionId: "bizq04-current-pin", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-10-02T12:00:00.000Z" });
  await runtime.validateResume({ session, draft });
  await assert.rejects(runtime.validateResume({ session: { ...session, contentVersion: "coding-interview-dsa-problem-solving-0004" }, draft }));
  await assert.rejects(runtime.validateResume({ session: { ...session, artifactSha256: "30b4b587c747b9768bbe92dc1b58b8da060417f32ff8a870960015ed3ef4face" }, draft }));
});

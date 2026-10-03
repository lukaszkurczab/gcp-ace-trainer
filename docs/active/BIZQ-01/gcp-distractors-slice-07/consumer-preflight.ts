import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadCanonicalRuntimeCatalog, scoreCanonicalQuestion, type Question } from "../../../../src/content/canonical";
import { toCanonicalQuestionViewModel } from "../../../../src/features/practice/canonicalQuestionViewModel";
import { detailLines } from "../../../../src/features/practice/feedbackDetails";
import { buildCanonicalInteractionViewModel, composeCanonicalFeedback } from "../../../../src/application/canonical/canonicalInteractionPresentation";
import { CanonicalTrainingRuntime } from "../../../../src/application/canonical/CanonicalTrainingRuntime";

const trackId = "google-cloud-associate-cloud-engineer";
const questionId = "gcp-ace-gcpace-n01-b02-001";
const version = "google-cloud-associate-cloud-engineer-authoring-v2026.10.03-bizq01-07";
const trackPromise = loadCanonicalRuntimeCatalog().then((catalog) => catalog.getTrack(trackId));
const source = JSON.parse(readFileSync(new URL("../../../../../patternly-content/content/google-cloud-associate-cloud-engineer/organization_projects_policies_services_quotas_and_assets/GCPACE-N01-B02.json", import.meta.url), "utf8")) as Question[];

function permutations(ids: readonly string[]): string[][] {
  return ids.length === 0 ? [[]] : ids.flatMap((id, index) => permutations(ids.filter((_, position) => position !== index)).map((tail) => [id, ...tail]));
}

test("current GCP bundle carries the reviewed source and derived domain; pre-submit hides authored feedback", async () => {
  const track = await trackPromise, question = track.getQuestion(questionId)!;
  assert.equal(track.contentVersion, version);
  const { contentDomainId, ...authored } = question;
  assert.equal(contentDomainId, "gcp-ace-standard-domain-1");
  assert.deepEqual(authored, source.find((entry) => entry.questionId === questionId));
  const view = toCanonicalQuestionViewModel(question);
  assert.deepEqual(Object.keys(view).sort(), ["constraints", "interaction", "itemId", "prompt"]);
  assert.match(view.prompt, /domain-managed hierarchy/);
  assert.deepEqual(view.constraints, ["Departments need folder-level grouping and policy boundaries."]);
  assert.ok(!JSON.stringify(view).includes(question.feedback.reason));
  assert.ok(!JSON.stringify(view).includes(JSON.stringify(question.feedback.details)));
  const lines = detailLines(question.feedback.details).join("\n");
  assert.match(lines, /organization or another folder/);
  assert.match(lines, /billing account/);
  assert.match(lines, /Enabling an API/);
  assert.match(lines, /Folder Creator or Folder Admin/);
  assert.ok(track.getPool("certification-focus-practice").some((entry) => entry.questionId === questionId));
  assert.equal(track.getPool("certification-diagnostic-baseline")[0]!.questionId, questionId);
});

test("all24 legal permutations retain stable response and accessibility IDs, scoring and authored feedback", async () => {
  const question = (await trackPromise).getQuestion(questionId)!;
  if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Expected reviewed single-choice contract.");
  assert.deepEqual(question.interaction.options.map((option) => option.optionId), ["A", "billing_parent", "project_parent", "api_only"]);
  const orders = permutations(question.interaction.options.map((option) => option.optionId));
  assert.equal(orders.length, 24);
  for (const order of orders) for (const option of question.interaction.options) {
    const response = { type: "choice_single" as const, optionId: option.optionId };
    const vm = buildCanonicalInteractionViewModel(question, response, order);
    if (vm.renderer.kind !== "choice") throw new Error("Expected real choice VM.");
    assert.deepEqual(vm.renderer.options.map((entry) => entry.id), order);
    assert.deepEqual(vm.renderer.options.filter((entry) => entry.selected).map((entry) => entry.id), [option.optionId]);
    assert.deepEqual(vm.accessibility.controls.filter((control) => control.checked).map((control) => control.id), [option.optionId]);
    const score = scoreCanonicalQuestion(question, response);
    assert.equal(score.kind, option.optionId === "A" ? "correct" : "incorrect");
    assert.equal(score.earnedPoints, option.optionId === "A" ? 1 : 0);
    assert.deepEqual(composeCanonicalFeedback(question, response), { correctness: score.kind, reason: question.feedback.reason, details: question.feedback.details });
    if (option.optionId !== "A") assert.equal(question.feedback.messages?.filter((message) => message.targetId === option.optionId).length, 1);
  }
});

test("actual GCP diagnostic selects this first item, submits new IDs and rejects old package/option IDs", async () => {
  const track = await trackPromise, runtime = new CanonicalTrainingRuntime(track);
  const { session, draft } = await runtime.prepare({ trackId, modeId: "certification-diagnostic-baseline", request: { sessionId: "bizq07-gcp-diagnostic", requestedLength: 40 }, attempts: [], reviews: [], now: "2026-10-03T12:00:00.000Z" });
  assert.equal(session.itemOrder[0]!.item.questionId, questionId);
  await runtime.validateResume({ session, draft });
  for (const optionId of ["A", "billing_parent", "project_parent", "api_only"]) {
    const submitted = await runtime.submitPractice({ session, response: { type: "choice_single", optionId }, attempts: [], reviews: [], now: "2026-10-03T12:01:00.000Z" });
    assert.equal(submitted.attempt.result.kind, optionId === "A" ? "correct" : "incorrect");
    assert.equal(submitted.attempt.result.earnedPoints, optionId === "A" ? 1 : 0);
    assert.equal(submitted.reviewMutations.length, optionId === "A" ? 0 : 1);
  }
  for (const optionId of ["B", "C", "D"]) await assert.rejects(runtime.submitPractice({ session, response: { type: "choice_single", optionId }, attempts: [], reviews: [], now: "2026-10-03T12:01:00.000Z" }), /invalid/);
  await assert.rejects(runtime.validateResume({ session: { ...session, contentVersion: "google-cloud-associate-cloud-engineer-authoring-v2026.08.11" }, draft }));
  await assert.rejects(runtime.validateResume({ session: { ...session, artifactSha256: "eea751e977cbfb468577ff4ea47702b914e1de6ad7fa06519a4e919889f0a6f9" }, draft }));
});

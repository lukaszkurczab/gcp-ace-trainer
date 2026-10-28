import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { CanonicalSimulationProfile, Question } from "../../content/canonical/questionTypes";
import type { CompletedTrainingSession } from "../../domain";
import { createCanonicalTrainingFamilyComposition } from "../canonicalTrainingFamilyComposition";
import { projectCertificationExamReview } from "./certificationExamReviewProjection";

const TRACK = "claude-certified-architect-professional-certification";
const NOW = "2026-10-26T12:00:00.000Z";

test("CCAR-P exam profile selects coverage and immutable history preserves partials without scoring them", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  const profile = track.simulationProfiles?.[0] as CanonicalSimulationProfile | undefined;
  assert.ok(profile?.familyConfig.examCoverage);
  const { catalog, presentation, runtime } = createCanonicalTrainingFamilyComposition(track);
  const declaredNearVariantIds = ["CCARP-D04-O02-expansion-25", "CCARP-D04-O02-scenario-04", "CCARP-D04-O02-scenario-06"] as const;
  const familyQuestions = new Set(declaredNearVariantIds.map((questionId) => {
    const question = catalog.getQuestion(questionId);
    assert.ok(question, `${questionId} is in the CCAR-P source pool`);
    return question;
  }));
  const familyIds = [...familyQuestions].map((question) => question.examMetadata?.scenarioFamilyId);
  assert.ok(familyIds[0], "the authored near-variant set has a declared family ID");
  assert.ok(familyIds.every((id) => id === familyIds[0]), "all three authored near-variants share one declared family ID");
  const familyId = familyIds[0];
  const { selectCertificationExamQuestions } = await import("./certificationExamSelection");
  const familySelection = selectCertificationExamQuestions(catalog.questions, profile!);
  assert.equal(familySelection.length, 63, "the family constraint preserves the exact configured exam length");
  assert.ok(familySelection.some((question) => question.examMetadata?.scenarioFamilyId === familyId));
  assert.equal(familySelection.filter((question) => question.examMetadata?.scenarioFamilyId === familyId).length, 1,
    "at most one item from a declared near-variant family can be selected");

  const prepared = await runtime.prepare({ trackId: TRACK, modeId: "certification-exam-simulation", request: { sessionId: "ccarp-lifecycle-fixture" }, attempts: [], reviews: [], now: NOW });
  assert.ok(prepared.draft);
  assert.equal(prepared.session.actualLength, 63);
  assert.equal(track.questions.length, 982, "the deterministic plan baseline is bound to the reviewed current CCAR-P bank");
  const selectedQuestionIds = prepared.session.itemOrder.map(({ item }) => item.questionId);
  assert.equal(createHash("sha256").update(JSON.stringify(selectedQuestionIds)).digest("hex"), "ac7f4a0a91358476d435c8e3b4e7a2d1901f8b47e753f756c0f837d670d276c6",
    "runtime optimization must preserve the exact deterministic 63-item plan for the current bank");
  assert.equal(prepared.session.configurationSnapshot.scoringPolicyId, "patternly-ccarp-complete-item-v1");
  const selected = prepared.session.itemOrder.map(({ item }) => track.getQuestion(item.questionId)!);
  const formats = ["choice_single", "choice_multiple", "decision_matrix"] as const;
  for (const format of formats) assert.ok(selected.filter((question) => question.interaction.type === format).length >= profile.familyConfig.examCoverage.formatMinimums[format]);
  for (const skill of ["knowledge", "diagnosis", "prerequisite", "next_action", "contextual_choice"] as const) assert.ok(selected.filter((question) => question.examMetadata?.decisionSkill === skill).length >= profile.familyConfig.examCoverage.skillMinimums[skill]);
  const selectedScenarioFamilies = selected.map((question) => question.examMetadata?.scenarioFamilyId).filter((value): value is string => Boolean(value));
  assert.equal(new Set(selectedScenarioFamilies).size, selectedScenarioFamilies.length, "no declared scenario family is repeated in one exam");
  const matrixForReview = selected.find((question) => question.interaction.type === "decision_matrix");
  assert.ok(matrixForReview && matrixForReview.interaction.type === "decision_matrix");
  const completeMatrixReview = presentation.presentReview(matrixForReview.questionId, matrixForReview.answer);
  assert.ok(completeMatrixReview.statementRows?.every((row) => typeof row.explanation === "string" && row.explanation.length > 0),
    "authored CCAR-P matrix explanations are present for every correct row");
  const firstMatrixDimension = matrixForReview.interaction.dimensions[0]!;
  const wrongMatrixTerminalValue = firstMatrixDimension.values.find((value) => !firstMatrixDimension.acceptedValueIds.includes(value.valueId));
  assert.ok(wrongMatrixTerminalValue);
  const partialMatrixTerminalReview = presentation.presentReview(matrixForReview.questionId, {
    type: "decision_matrix", selectedValueIdsByDimension: { [firstMatrixDimension.dimensionId]: [wrongMatrixTerminalValue.valueId] },
  });
  assert.ok(partialMatrixTerminalReview.statementRows?.[0]?.messages?.some((message) => message.targetId === `${firstMatrixDimension.dimensionId}|${wrongMatrixTerminalValue.valueId}`),
    "partial matrix row retains its specific authored wrong-value feedback");
  assert.equal(selected.some((question) => question.questionRelation && selected.some((other) => other.questionId === question.questionRelation?.counterpartQuestionId)), false);
  let formatRun = 1, maximumFormatRun = 1;
  for (let index = 1; index < selected.length; index += 1) {
    formatRun = selected[index]!.interaction.type === selected[index - 1]!.interaction.type ? formatRun + 1 : 1;
    maximumFormatRun = Math.max(maximumFormatRun, formatRun);
  }
  assert.ok(maximumFormatRun <= 2, "answer formats are interleaved across the exam plan");

  const occurrences = prepared.session.itemOrder;
  const occurrenceFor = (type: Question["interaction"]["type"], skip = new Set<string>()) => {
    const occurrence = occurrences.find((entry) => !skip.has(entry.occurrenceId) && track.getQuestion(entry.item.questionId)?.interaction.type === type);
    assert.ok(occurrence);
    return { occurrence, question: track.getQuestion(occurrence.item.questionId)! };
  };
  const used = new Set<string>();
  const correct = occurrenceFor("choice_single"); used.add(correct.occurrence.occurrenceId);
  const incorrect = occurrenceFor("choice_single", used); used.add(incorrect.occurrence.occurrenceId);
  const correctMultiple = occurrenceFor("choice_multiple", used); used.add(correctMultiple.occurrence.occurrenceId);
  const incorrectMultiple = occurrenceFor("choice_multiple", used); used.add(incorrectMultiple.occurrence.occurrenceId);
  const partialMultiple = occurrenceFor("choice_multiple", used); used.add(partialMultiple.occurrence.occurrenceId);
  const correctMatrix = occurrenceFor("decision_matrix", used); used.add(correctMatrix.occurrence.occurrenceId);
  const incorrectMatrix = occurrenceFor("decision_matrix", used); used.add(incorrectMatrix.occurrence.occurrenceId);
  const partialMatrix = occurrenceFor("decision_matrix", used);
  assert.equal(correct.question.interaction.type, "choice_single");
  assert.equal(incorrect.question.interaction.type, "choice_single");
  assert.equal(correctMultiple.question.interaction.type, "choice_multiple");
  assert.equal(incorrectMultiple.question.interaction.type, "choice_multiple");
  assert.equal(partialMultiple.question.interaction.type, "choice_multiple");
  assert.equal(correctMatrix.question.interaction.type, "decision_matrix");
  assert.equal(incorrectMatrix.question.interaction.type, "decision_matrix");
  assert.equal(partialMatrix.question.interaction.type, "decision_matrix");
  const incorrectCorrectOptionId = (incorrect.question.answer as Extract<Question["answer"], { type: "choice_single" }>).optionId;
  const wrongOption = incorrect.question.interaction.type === "choice_single" ? incorrect.question.interaction.options.find((option) => option.optionId !== incorrectCorrectOptionId) : undefined;
  assert.ok(wrongOption);
  const correctMultipleResponse = correctMultiple.question.answer as Extract<Question["answer"], { type: "choice_multiple" }>;
  const incorrectMultipleAnswer = incorrectMultiple.question.answer as Extract<Question["answer"], { type: "choice_multiple" }>;
  const incorrectMultipleOptions = incorrectMultiple.question.interaction.type === "choice_multiple" ? incorrectMultiple.question.interaction.options.filter((option) => !incorrectMultipleAnswer.optionIds.includes(option.optionId)) : [];
  const requiredMultipleCount = incorrectMultiple.question.interaction.type === "choice_multiple" ? incorrectMultiple.question.interaction.requiredSelectionCount ?? incorrectMultipleAnswer.optionIds.length : 1;
  const incorrectMultipleResponse = { type: "choice_multiple" as const, optionIds: incorrectMultipleOptions.slice(0, requiredMultipleCount).map((option) => option.optionId) };
  const partialMultipleResponse = { type: "choice_multiple" as const, optionIds: [partialMultiple.question.interaction.type === "choice_multiple" ? partialMultiple.question.interaction.options[0]!.optionId : ""] };
  const completeMatrixResponse = (question: Question) => {
    assert.equal(question.interaction.type, "decision_matrix");
    assert.equal(question.answer.type, "decision_matrix");
    return question.answer as Extract<Question["answer"], { type: "decision_matrix" }>;
  };
  const correctMatrixResponse = completeMatrixResponse(correctMatrix.question);
  const incorrectMatrixAnswer = completeMatrixResponse(incorrectMatrix.question);
  const firstIncorrectDimension = incorrectMatrix.question.interaction.type === "decision_matrix" ? incorrectMatrix.question.interaction.dimensions[0]! : undefined;
  assert.ok(firstIncorrectDimension);
  const wrongMatrixValue = firstIncorrectDimension.values.find((value) => !firstIncorrectDimension.acceptedValueIds.includes(value.valueId));
  assert.ok(wrongMatrixValue);
  const incorrectMatrixResponse = { type: "decision_matrix" as const, selectedValueIdsByDimension: { ...incorrectMatrixAnswer.selectedValueIdsByDimension, [firstIncorrectDimension.dimensionId]: [wrongMatrixValue.valueId] } };
  const partialMatrixDimension = partialMatrix.question.interaction.type === "decision_matrix" ? partialMatrix.question.interaction.dimensions[0]! : undefined;
  assert.ok(partialMatrixDimension);
  const partialMatrixResponse = { type: "decision_matrix" as const, selectedValueIdsByDimension: { [partialMatrixDimension.dimensionId]: [partialMatrixDimension.values.find((value) => !partialMatrixDimension.acceptedValueIds.includes(value.valueId))?.valueId ?? partialMatrixDimension.values[0]!.valueId] } };
  const responsesByOccurrenceId = {
    [correct.occurrence.occurrenceId]: correct.question.answer,
    [incorrect.occurrence.occurrenceId]: { type: "choice_single" as const, optionId: wrongOption.optionId },
    [correctMultiple.occurrence.occurrenceId]: correctMultipleResponse,
    [incorrectMultiple.occurrence.occurrenceId]: incorrectMultipleResponse,
    [partialMultiple.occurrence.occurrenceId]: partialMultipleResponse,
    [correctMatrix.occurrence.occurrenceId]: correctMatrixResponse,
    [incorrectMatrix.occurrence.occurrenceId]: incorrectMatrixResponse,
    [partialMatrix.occurrence.occurrenceId]: partialMatrixResponse,
  };
  const draft = { ...prepared.draft, responsesByOccurrenceId, updatedAt: "2026-10-26T12:01:00.000Z" };
  await runtime.validateResume({ session: prepared.session, draft });
  const finalized = await runtime.finalizeSimulation({ session: prepared.session, draft, attempts: [], reviews: [], now: "2026-10-26T12:02:00.000Z" });
  assert.equal(finalized.attempts.length, 6);
  assert.deepEqual(finalized.attempts.map((attempt) => attempt.result.earnedPoints).sort(), [0, 0, 0, 1, 1, 1]);
  assert.ok(finalized.attempts.every((attempt) => attempt.result.maxPoints === 1 && [0, 1].includes(attempt.result.earnedPoints)));
  const evidence = finalized.result.evidence.details as Record<string, unknown>;
  assert.equal(evidence.scoringPolicyId, "patternly-ccarp-complete-item-v1");
  assert.equal(evidence.pointsEarned, 3);
  assert.equal(evidence.maxPoints, 63, "the exam denominator includes unanswered and partial items");
  assert.deepEqual(evidence.partialResponsesByOccurrenceId, {
    [partialMultiple.occurrence.occurrenceId]: partialMultipleResponse,
    [partialMatrix.occurrence.occurrenceId]: partialMatrixResponse,
  });
  assert.equal(finalized.result.answeredOccurrenceIds.length, 6);
  assert.ok(finalized.result.unansweredOccurrenceIds.includes(partialMultiple.occurrence.occurrenceId));
  assert.ok(finalized.result.unansweredOccurrenceIds.includes(partialMatrix.occurrence.occurrenceId));
  const review = await projectCertificationExamReview({
    attempts: finalized.attempts, profile, result: finalized.result, session: finalized.session as CompletedTrainingSession,
    questionsById: new Map(catalog.questions.map((question) => [question.questionId, question])),
    resolveItem: async (item) => ({ question: catalog.getQuestion(item.questionId)!, interactions: presentation }),
  });
  const partialMultipleReview = review.items.find((item) => item.occurrenceId === partialMultiple.occurrence.occurrenceId)!;
  const partialMatrixReview = review.items.find((item) => item.occurrenceId === partialMatrix.occurrence.occurrenceId)!;
  assert.equal(partialMultipleReview.answerState, "incomplete");
  assert.equal(partialMatrixReview.answerState, "incomplete");
  assert.equal(partialMatrixReview.statementRows?.[0]?.selectedValueIds.length, 1);
  assert.equal(review.answeredCount, 6);
  assert.equal(review.unansweredCount, 57);
  assert.equal(review.maxPoints, 63);

  const emptyPrepared = await runtime.prepare({ trackId: TRACK, modeId: "certification-exam-simulation", request: { sessionId: "ccarp-empty-lifecycle-fixture" }, attempts: [], reviews: [], now: NOW });
  assert.ok(emptyPrepared.draft);
  const emptyFinalized = await runtime.finalizeSimulation({ session: emptyPrepared.session, draft: emptyPrepared.draft, attempts: [], reviews: [], now: "2026-10-26T12:02:00.000Z" });
  const emptyEvidence = emptyFinalized.result.evidence.details as Record<string, unknown>;
  assert.equal(emptyFinalized.attempts.length, 0);
  assert.equal(emptyEvidence.pointsEarned, 0);
  assert.equal(emptyEvidence.maxPoints, 63);
  assert.equal(emptyFinalized.result.answeredOccurrenceIds.length, 0);
  assert.equal(emptyFinalized.result.unansweredOccurrenceIds.length, 63);
  const emptyReview = await projectCertificationExamReview({
    attempts: emptyFinalized.attempts, profile, result: emptyFinalized.result, session: emptyFinalized.session as CompletedTrainingSession,
    questionsById: new Map(catalog.questions.map((question) => [question.questionId, question])),
    resolveItem: async (item) => ({ question: catalog.getQuestion(item.questionId)!, interactions: presentation }),
  });
  assert.equal(emptyReview.maxPoints, 63);
  assert.equal(emptyReview.pointsEarned, 0);
  assert.equal(emptyReview.answeredCount, 0);
  assert.equal(emptyReview.unansweredCount, 63);
});

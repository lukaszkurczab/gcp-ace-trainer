import assert from "node:assert/strict";
import test from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../src/infrastructure/storage/mmkvClient";
import { abandonTrainingSession, createTrainingSession } from "../src/domain";
import { commitSessionAbandonment } from "../src/application/learningMutations";
import { savePracticeAnswer } from "../src/application/certificationPracticeUseCases";
import { installCertificationCatalog } from "../src/content/catalogRepository";
import { getReviewQueueItems, getTrainingAttempts } from "../src/storage";
import { buildCertificationExamSummaries, scoreCertificationQuestion } from "../src/tracks/cloud-certification";
import { makeCompletedExamProjectionInputs, makeQuestion } from "./fixtures";

const practiceOnlyExamProfile = {
  schemaVersion: "exam-experience-profile-v2",
  profileId: "fixture-profile",
  profileVersion: "1",
  source: { url: "https://example.test/exam-guide", checkedDate: "2026-07-24", guideVersion: "fixture" },
  durationMinutes: 30,
  questionCount: { kind: "range", minimum: 1, maximum: 1 },
  blueprint: { kind: "weighted_sections", sections: [{ id: "setup_environment", contentDomainId: "setup_environment", weightPercent: 100 }] },
  interactionPolicy: { schemaVersion: "patternly-certification-simulation-policy-v1", policyId: "patternly-certification-simulation-v1", policyVersion: "1", owner: "patternly_product", navigation: "free", answerChanges: "until_final_submission", flagging: "available", navigator: "available", sections: "blueprint_visible", timeout: "absolute_deadline", feedbackTiming: "after_verified_finalization" },
} as const;

test("Certification single-choice scores correct, incorrect, and unanswered responses", () => {
  const question = makeQuestion();
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["a"] }).kind, "correct");
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["b"] }).kind, "incorrect");
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: [] }).kind, "incorrect");
});

test("Certification multiple-choice distinguishes exact, proper subset, and wrong-option responses", () => {
  const question = makeQuestion({ type: "multiple", correctOptionIds: ["a", "c"] });
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["c", "a"] }).kind, "correct");
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["a"] }).kind, "partial");
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["a", "b"] }).kind, "incorrect");
});

test("exam scoring reports raw count and percentage with unanswered diagnostics and no pass inference", () => {
  const questions = [makeQuestion({ id: "one" }), makeQuestion({ id: "two" }), makeQuestion({ id: "three" })];
  const { session, attempts } = makeCompletedExamProjectionInputs(questions, { one: ["a"], two: ["b"] });
  const summary = buildCertificationExamSummaries([session], attempts)[0]!;
  assert.equal(summary.correctCount, 1);
  assert.equal(summary.questionCount, 3);
  assert.equal(summary.scorePercent, 33);
  assert.deepEqual(summary.unansweredQuestionIds, ["three"]);
  assert.equal("passedTrainingThreshold" in summary, false);
});

test("Certification practice submission writes one canonical typed attempt and remediation review directly", async (context) => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const question = makeQuestion({ id: "fixture-practice" });
  const catalog = installCertificationCatalog({ formatVersion: 1, trackId: "cloud-certification", familyId: "certification", contentVersion: "fixture", examExperienceProfile: practiceOnlyExamProfile, items: [question] });
  const ref = catalog.toContentItemRef(question);
  const session = createTrainingSession({ id: "practice-session", trackId: "cloud-certification", modeId: "certification-focus-practice", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ occurrenceId: "occurrence-1", item: ref }], optionOrderByOccurrence: { "occurrence-1": question.options.map((option) => option.id) }, activeForegroundMs: 0, contentVersion: ref.contentVersion, status: "active", startedAt: "2026-01-01T00:00:00.000Z" });
  const wrongOption = question.options.find((option) => !question.correctOptionIds.includes(option.id));
  assert.ok(wrongOption);
  await savePracticeAnswer({ session, question, selectedOptionIds: [wrongOption.id] });
  const attempts = (await getTrainingAttempts()).value;
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0]?.response && typeof attempts[0].response === "object" && "kind" in attempts[0].response ? attempts[0].response.kind : undefined, "option_selection");
  assert.equal((await getReviewQueueItems()).value[0]?.sourceSessionId, session.id);
});

test("repeated Certification remediation retains one durable review identity", async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const question = makeQuestion({ id: "fixture-repeat" });
  const catalog = installCertificationCatalog({ formatVersion: 1, trackId: "cloud-certification", familyId: "certification", contentVersion: "fixture", examExperienceProfile: practiceOnlyExamProfile, items: [question] });
  const ref = catalog.toContentItemRef(question);
  const makePracticeSession = (id: string) => createTrainingSession({ id, trackId: "cloud-certification", modeId: "certification-focus-practice", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ occurrenceId: "occurrence-1", item: ref }], optionOrderByOccurrence: { "occurrence-1": question.options.map((option) => option.id) }, activeForegroundMs: 0, contentVersion: ref.contentVersion, status: "active", startedAt: "2026-01-01T00:00:00.000Z" });
  const wrongOption = question.options.find((option) => !question.correctOptionIds.includes(option.id));
  assert.ok(wrongOption);
  const firstSession = makePracticeSession("practice-first");
  await savePracticeAnswer({ session: firstSession, question, selectedOptionIds: [wrongOption.id] });
  const firstReview = (await getReviewQueueItems()).value[0]!;
  const abandonedAt = "2026-01-01T00:01:00.000Z";
  await commitSessionAbandonment(abandonTrainingSession(firstSession, abandonedAt), abandonedAt);
  await savePracticeAnswer({ session: makePracticeSession("practice-second"), question, selectedOptionIds: [wrongOption.id] });
  const reviews = (await getReviewQueueItems()).value;
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]?.id, firstReview.id);
  assert.equal(reviews[0]?.sourceSessionId, firstReview.sourceSessionId);
});

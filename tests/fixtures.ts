import { GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, completeTrainingSession, createTrainingAttempt, createTrainingSession, type TrainingAttempt, type TrainingSession } from "../src/domain";
import { installCertificationCatalog } from "../src/content/catalogRepository";
import { scoreCertificationQuestion, type CertificationQuestion } from "../src/tracks/certification";

export function makeQuestion(overrides: Partial<CertificationQuestion> = {}): CertificationQuestion {
  const id = overrides.id ?? "q-1";
  return { id, domain: overrides.domain ?? "setup_environment", difficulty: overrides.difficulty ?? "easy", type: overrides.type ?? "single", question: overrides.question ?? `Question ${id}?`, options: overrides.options ?? [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }], correctOptionIds: overrides.correctOptionIds ?? ["a"], feedback: overrides.feedback ?? { reason: "Because A is correct.", details: { blocks: [{ type: "paragraph", text: "Fixture details." }] }, wrongOptionExplanationsByOptionId: { b: "B is incorrect.", c: "C is incorrect." }, omittedCorrectExplanationsByOptionId: { a: "A is required." } }, tags: overrides.tags ?? ["iam"], examSignals: overrides.examSignals };
}

export function makeCompletedExamProjectionInputs(questions: readonly CertificationQuestion[], selected: Record<string, string[]> = {}): Readonly<{ session: TrainingSession; attempts: readonly TrainingAttempt<unknown>[] }> {
  const startedAt = "2026-01-01T10:00:00.000Z";
  installCertificationCatalog({ formatVersion: 1, trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, familyId: "certification", contentVersion: "test", examExperienceProfile: fixtureProfile, items: questions });
  const active = createTrainingSession({ id: "exam-1", trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, modeId: "certification-exam-simulation", configurationSnapshot: { kind: "certificationSimulation" }, requestedLength: questions.length, actualLength: questions.length, currentItemIndex: 0, itemOrder: questions.map((question, index) => ({ occurrenceId: `occurrence-${index}`, item: { trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, itemId: question.id, contentVersion: "test" } })), optionOrderByOccurrence: Object.fromEntries(questions.map((question, index) => [`occurrence-${index}`, question.options.map((option) => option.id).reverse()])), activeForegroundMs: 0, contentVersion: "test", status: "active", startedAt });
  const session = completeTrainingSession(active, "2026-01-01T12:00:00.000Z");
  const attempts = session.itemOrder.flatMap((occurrence, index) => {
    const question = questions[index]!;
    const selectedOptionIds = selected[question.id];
    if (!selectedOptionIds) return [];
    const response = { kind: "option_selection" as const, selectedOptionIds };
    return [createTrainingAttempt({ id: `attempt-${index}`, sessionId: session.id, trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, modeId: session.modeId, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response, result: scoreCertificationQuestion(question, response), reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: index === 0 ? [{ axisId: "exam-state", nodeId: "flagged" }] : [] }, answeredAt: session.completedAt!, committedAt: session.completedAt! })];
  });
  return { session, attempts };
}

const fixtureProfile = {
  schemaVersion: "exam-experience-profile-v2",
  profileId: "fixture-profile",
  profileVersion: "1",
  source: { url: "https://example.test/exam-guide", checkedDate: "2026-07-24", guideVersion: "fixture" },
  durationMinutes: 30,
  questionCount: { kind: "range", minimum: 1, maximum: 60 },
  blueprint: { kind: "weighted_sections", sections: [{ id: "setup_environment", contentDomainId: "setup_environment", weightPercent: 100 }] },
  interactionPolicy: { schemaVersion: "patternly-certification-simulation-policy-v1", policyId: "patternly-certification-simulation-v1", policyVersion: "1", owner: "patternly_product", navigation: "free", answerChanges: "until_final_submission", flagging: "available", navigator: "available", sections: "blueprint_visible", timeout: "absolute_deadline", feedbackTiming: "after_verified_finalization" },
} as const;

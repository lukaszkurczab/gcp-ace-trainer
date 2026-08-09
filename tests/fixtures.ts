import { TEST_CONTENT_PACKAGE_PIN } from "./contentPackagePinFixture";
import { GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, completeTrainingSession, createTrainingAttempt, createTrainingSession, type TrainingAttempt, type TrainingSession } from "../src/domain";
import { scoreCertificationQuestion, type CertificationQuestion } from "../src/tracks/certification";

export function makeQuestion(overrides: Partial<CertificationQuestion> = {}): CertificationQuestion {
  const id = overrides.id ?? "q-1";
  return { id, domain: overrides.domain ?? "setup_environment", difficulty: overrides.difficulty ?? "easy", type: overrides.type ?? "single", question: overrides.question ?? `Question ${id}?`, options: overrides.options ?? [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }], correctOptionIds: overrides.correctOptionIds ?? ["a"], feedback: overrides.feedback ?? { reason: "Because A is correct.", details: { blocks: [{ type: "paragraph", text: "Fixture details." }] }, wrongOptionExplanationsByOptionId: { b: "B is incorrect.", c: "C is incorrect." }, omittedCorrectExplanationsByOptionId: { a: "A is required." } }, tags: overrides.tags ?? ["iam"], examSignals: overrides.examSignals };
}

export function makeCompletedExamProjectionInputs(questions: readonly CertificationQuestion[], selected: Record<string, string[]> = {}) {
  const startedAt = "2026-01-01T10:00:00.000Z";
  const active = createTrainingSession({ id: "exam-1", trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, modeId: "certification-exam-simulation", configurationSnapshot: { kind: "certificationSimulation" }, requestedLength: questions.length, actualLength: questions.length, currentItemIndex: 0, itemOrder: questions.map((question, index) => ({ occurrenceId: `occurrence-${index}`, item: { trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, itemId: question.id, contentVersion: "test" , packagePin: TEST_CONTENT_PACKAGE_PIN} })), optionOrderByOccurrence: Object.fromEntries(questions.map((question, index) => [`occurrence-${index}`, question.options.map((option) => option.id).reverse()])), activeForegroundMs: 0, contentVersion: "test", packagePin: TEST_CONTENT_PACKAGE_PIN, status: "active", startedAt });
  const session = completeTrainingSession(active, "2026-01-01T12:00:00.000Z");
  const attempts = session.itemOrder.flatMap((occurrence, index) => {
    const question = questions[index]!;
    const selectedOptionIds = selected[question.id];
    if (!selectedOptionIds) return [];
    const response = { kind: "option_selection" as const, selectedOptionIds };
    return [createTrainingAttempt({ id: `attempt-${index}`, sessionId: session.id, trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, modeId: session.modeId, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response, result: scoreCertificationQuestion(question, response), reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: index === 0 ? [{ axisId: "exam-state", nodeId: "flagged" }] : [] }, answeredAt: session.completedAt!, committedAt: session.completedAt! })];
  });
  const byId = new Map(questions.map((question) => [question.id, question]));
  return {
    session,
    attempts,
    resolveItem: async (ref: { itemId: string }) => {
      const question = byId.get(ref.itemId);
      if (!question) throw new Error(`Fixture certification item ${ref.itemId} is unavailable.`);
      return question;
    },
  };
}

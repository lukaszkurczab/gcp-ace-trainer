import { CLOUD_CERTIFICATION_TRACK_ID, createTrainingSession } from "../src/domain";
import type { CertificationExamViewModel, CertificationQuestion } from "../src/tracks/cloud-certification";

export function makeQuestion(overrides: Partial<CertificationQuestion> = {}): CertificationQuestion {
  const id = overrides.id ?? "q-1";
  return { id, domain: overrides.domain ?? "setup_environment", difficulty: overrides.difficulty ?? "easy", type: overrides.type ?? "single", question: overrides.question ?? `Question ${id}?`, options: overrides.options ?? [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }], correctOptionIds: overrides.correctOptionIds ?? ["a"], explanation: overrides.explanation ?? "Because A is correct.", whyOthersAreWrong: overrides.whyOthersAreWrong, watchOutFor: overrides.watchOutFor, tags: overrides.tags ?? ["iam"], examSignals: overrides.examSignals };
}

export function makeQuestionBank(): CertificationQuestion[] {
  const counts = { setup_environment: 12, planning_implementation: 15, operations: 13, access_security: 10 } as const;
  return Object.entries(counts).flatMap(([domain, count]) => Array.from({ length: count }, (_, index) => makeQuestion({ id: `${domain}-${index + 1}`, domain: domain as CertificationQuestion["domain"], tags: [domain, index % 2 === 0 ? "iam" : "networking"] })));
}

export function makeSession(questions: readonly CertificationQuestion[], selected: Record<string, string[]> = {}): CertificationExamViewModel {
  const startedAt = "2026-01-01T10:00:00.000Z";
  const session = createTrainingSession({ id: "exam-1", trackId: CLOUD_CERTIFICATION_TRACK_ID, modeId: "cloud-exam-simulation", configurationSnapshot: { kind: "certificationSimulation" }, requestedLength: questions.length, actualLength: questions.length, currentItemIndex: 0, itemOrder: questions.map((question, index) => ({ occurrenceId: `occurrence-${index}`, item: { trackId: CLOUD_CERTIFICATION_TRACK_ID, itemId: question.id, contentVersion: "test" } })), optionOrderByOccurrence: Object.fromEntries(questions.map((question, index) => [`occurrence-${index}`, question.options.map((option) => option.id).reverse()])), activeForegroundMs: 0, contentVersion: "test", status: "active", startedAt });
  return { session, examState: { sessionId: session.id, deadlineAt: "2026-01-01T12:00:00.000Z", responsesByItemId: Object.fromEntries(Object.entries(selected).map(([itemId, selectedOptionIds]) => [itemId, { kind: "option_selection", selectedOptionIds }])), flaggedItemIds: questions[0] ? [questions[0].id] : [] } };
}

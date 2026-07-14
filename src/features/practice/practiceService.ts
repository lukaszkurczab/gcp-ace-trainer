import { CLOUD_CERTIFICATION_TRACK_ID, createTrainingAttempt, type TrainingAttempt, type TrainingSession } from "../../domain";
import { addReviewQueueItems, getReviewQueueItems, removeReviewQueueItem } from "../../storage";
import { commitTrainingOutcome } from "../../application/learningMutations";
import { getCertificationContentCatalog } from "../../content/catalogRepository";
import { createCertificationReviewEntry, scoreCertificationQuestion, type CertificationDomain, type CertificationPracticeAnswerViewModel, type CertificationQuestion, type CertificationResponse } from "../../tracks/cloud-certification";
import { shuffleArray } from "../../utils";

export type PracticeQuestionCount = 10 | 20 | 40 | "all";
export type PracticeDomainCount = { domain: CertificationDomain; count: number };
const domains: CertificationDomain[] = ["setup_environment", "planning_implementation", "operations", "access_security"];

export function getPracticeDomainCounts(questions: readonly CertificationQuestion[]): PracticeDomainCount[] { return domains.map((domain) => ({ domain, count: questions.filter((question) => question.domain === domain).length })); }
export async function loadPracticeQuestions(domain: CertificationDomain, questionCount: PracticeQuestionCount): Promise<CertificationQuestion[]> {
  const shuffled = shuffleArray(getCertificationContentCatalog().getItems().filter((question) => question.domain === domain)).map(shuffleQuestionOptions);
  return questionCount === "all" ? shuffled : shuffled.slice(0, questionCount);
}
export function shuffleQuestionOptions(question: CertificationQuestion): CertificationQuestion { return { ...question, options: shuffleArray(question.options) }; }

export async function savePracticeAnswer(input: { session: TrainingSession; question: CertificationQuestion; selectedOptionIds: string[] }): Promise<CertificationPracticeAnswerViewModel> {
  const answeredAt = new Date().toISOString();
  const response: CertificationResponse = { kind: "option_selection", selectedOptionIds: [...input.selectedOptionIds] };
  const result = scoreCertificationQuestion(input.question, response);
  const attempt: TrainingAttempt<CertificationResponse> = createTrainingAttempt({ id: `practice:${input.session.id}:${input.question.id}:${[...input.selectedOptionIds].sort().join(",")}`, sessionId: input.session.id, trackId: CLOUD_CERTIFICATION_TRACK_ID, modeId: input.session.modeId, item: getCertificationContentCatalog().toContentItemRef(input.question), response, result, reviewEvidence: { sourceItem: getCertificationContentCatalog().toContentItemRef(input.question), taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: input.question.domain }, ...input.question.tags.map((tag) => ({ axisId: "tag", nodeId: tag }))] }, answeredAt, committedAt: answeredAt });
  const review = createCertificationReviewEntry(attempt);
  await commitTrainingOutcome({ attempt, session: input.session, reviews: review ? [review] : [], createdAt: answeredAt });
  return { id: attempt.id, questionId: input.question.id, questionSnapshot: input.question, domain: input.question.domain, tags: input.question.tags, selectedOptionIds: input.selectedOptionIds, correctOptionIds: input.question.correctOptionIds, isCorrect: result.kind === "correct", answeredAt };
}

export async function setQuestionNeedsReview(question: CertificationQuestion, needsReview: boolean): Promise<void> {
  if (!needsReview) { await removeReviewQueueItem(CLOUD_CERTIFICATION_TRACK_ID, question.id); return; }
  const now = new Date().toISOString();
  await addReviewQueueItems([{ id: `review:manual:${question.id}`, trackId: CLOUD_CERTIFICATION_TRACK_ID, sourceAttemptId: `manual-mark:${question.id}:${now}`, sourceSessionId: `manual-mark:${question.id}`, reasons: ["manual_mark"], dueAt: now, createdAt: now, consecutiveAfterDueSuccesses: 0, persistent: true, sourceItem: getCertificationContentCatalog().toContentItemRef(question), taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }] }]);
}

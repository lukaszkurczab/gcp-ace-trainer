import { CLOUD_CERTIFICATION_TRACK_ID, createTrainingAttempt, retainReviewQueueEntryIdentity, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession } from "../../domain";
import { getReviewQueueItems } from "../../storage";
import { commitReviewEntryChange, commitReviewEntryRemoval, commitTrainingOutcome } from "../../application/learningMutations";
import { createAttemptId } from "../../application/learningMutations/identity";
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
  const occurrence = input.session.itemOrder[input.session.currentItemIndex];
  if (!occurrence || occurrence.item.itemId !== input.question.id) throw new Error("The submitted question does not match the current session occurrence.");
  const attempt: TrainingAttempt<CertificationResponse> = createTrainingAttempt({ id: await createAttemptId(input.session.id, occurrence.occurrenceId, response), occurrenceId: occurrence.occurrenceId, sessionId: input.session.id, trackId: CLOUD_CERTIFICATION_TRACK_ID, modeId: input.session.modeId, item: getCertificationContentCatalog().toContentItemRef(input.question), response, result, reviewEvidence: { sourceItem: getCertificationContentCatalog().toContentItemRef(input.question), taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: input.question.domain }, ...input.question.tags.map((tag) => ({ axisId: "tag", nodeId: tag }))] }, answeredAt, committedAt: answeredAt });
  const review = createCertificationReviewEntry(attempt);
  const existingReview = review ? (await getReviewQueueItems()).value.find((entry) => entry.trackId === review.trackId && entry.sourceItem.itemId === review.sourceItem.itemId) : undefined;
  const durableReview = review && existingReview ? retainReviewQueueEntryIdentity(existingReview, review) : review;
  await commitTrainingOutcome({ attempt, session: input.session, reviews: durableReview ? [durableReview] : [], createdAt: answeredAt });
  return { id: attempt.id, questionId: input.question.id, questionSnapshot: input.question, domain: input.question.domain, tags: input.question.tags, selectedOptionIds: input.selectedOptionIds, correctOptionIds: input.question.correctOptionIds, isCorrect: result.kind === "correct", answeredAt };
}

export async function setQuestionNeedsReview(question: CertificationQuestion, needsReview: boolean): Promise<void> {
  const now = new Date().toISOString();
  const existing = (await getReviewQueueItems()).value.find((entry) => entry.trackId === CLOUD_CERTIFICATION_TRACK_ID && entry.sourceItem.itemId === question.id);
  if (!needsReview) { if (existing) await commitReviewEntryRemoval(existing, now); return; }
  const created = { id: `review:manual:${question.id}`, trackId: CLOUD_CERTIFICATION_TRACK_ID, sourceAttemptId: `manual-mark:${question.id}:${now}`, sourceSessionId: `manual-mark:${question.id}`, reasons: ["manual_mark"], dueAt: now, createdAt: now, consecutiveAfterDueSuccesses: 0, persistent: true, sourceItem: getCertificationContentCatalog().toContentItemRef(question), taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }] } satisfies ReviewQueueEntry;
  const record = existing ? { ...existing, reasons: [...new Set([...existing.reasons, "manual_mark" as const])], dueAt: now, consecutiveAfterDueSuccesses: 0, persistent: true } : created;
  await commitReviewEntryChange({ record, isUpdate: Boolean(existing), transitionId: `manual-review:${question.id}:${now}`, createdAt: now });
}

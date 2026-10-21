import type { ReviewEvidence, ReviewQueueEntry, TrainingAttempt } from "../../domain";
import type { TrainingCatalog, TrainingQuestionSummary } from "../trainingLifecycle/contracts";
import { createResolvedContentRef, resolvedContentRefKey } from "../../domain/learning/resolvedContentRef";
import type { ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import type { TrainingSession, ReviewSourceSnapshot } from "../../domain";
import { createReviewSourceSnapshot } from "../../domain/learning/reviewQueueEntry";
import { createAttemptId } from "../identity/trainingIdentity";
import { createTrainingAttempt } from "../../domain/learning/trainingAttempt";
import { createLegacyReviewUnitProof, reviewEvidenceMatchesAttempt, learningUnitIdentity, learningUnitInCurrentCatalog } from "../../domain/learning/mentalUnitEvidence";

export async function createCanonicalAttempt(input: Readonly<{
  session: TrainingSession;
  occurrenceId: string;
  item: ResolvedContentRef;
  response: unknown;
  result: TrainingAttempt<unknown>["result"];
  reviewEvidence: TrainingAttempt<unknown>["reviewEvidence"];
  answeredAt: string;
  committedAt: string;
}>): Promise<TrainingAttempt<unknown>> {
  return createTrainingAttempt({
    id: await createAttemptId(input.session.id, input.occurrenceId, input.response),
    sessionId: input.session.id,
    trackId: input.session.trackId,
    modeId: input.session.modeId,
    occurrenceId: input.occurrenceId,
    item: input.item,
    response: input.response,
    result: input.result,
    reviewEvidence: input.reviewEvidence,
    answeredAt: input.answeredAt,
    committedAt: input.committedAt,
  });
}

/** Active learning totals follow durable unit attribution across canonical content revisions. */
export function scopeAttemptsToLearningTrack(attempts: readonly TrainingAttempt<unknown>[], catalog: TrainingCatalog): readonly TrainingAttempt<unknown>[] {
  return attempts.filter((attempt) => attempt.trackId === catalog.trackId && attempt.item.trackId === catalog.trackId && learningUnitInCurrentCatalog(attempt.reviewEvidence, catalog) !== undefined);
}

/** Queue identity is durable; exact source content is retained for history and audit only. */
export function scopeReviewsToLearningTrack(reviews: readonly ReviewQueueEntry[], catalog: TrainingCatalog): readonly ReviewQueueEntry[] {
  return reviews.filter((entry) => entry.trackId === catalog.trackId && entry.sourceItem.trackId === catalog.trackId);
}

/** Concurrency covers every active record for an attributed unit; legacy rows fall back to their exact retained ref. */
export function reviewConcurrencyKey(entry: ReviewQueueEntry): string {
  const unit = learningUnitIdentity(entry);
  return unit ? JSON.stringify([entry.trackId, "unit", unit.nodeId, unit.mentalUnitId]) : JSON.stringify([entry.trackId, "item", resolvedContentRefKey(entry.sourceItem)]);
}

/** A recorded review need admits one current question; duplicate old question refs do not fan out to an entire unit bank. */
export function limitQuestionsToReviewNeeds(candidates: readonly TrainingQuestionSummary[], reviews: readonly ReviewQueueEntry[], catalog: TrainingCatalog): readonly TrainingQuestionSummary[] {
  const remaining = new Map<string, number>();
  for (const entry of reviews) {
    const unit = learningUnitInCurrentCatalog(entry, catalog);
    if (!unit) continue;
    const key = `unit:${unit.nodeId}:${unit.mentalUnitId}`;
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }
  return candidates.filter((question) => {
    const evidence = canonicalQuestionReviewEvidence(catalog, question);
    const unit = learningUnitIdentity(evidence);
    if (!unit) return false;
    const key = `unit:${unit.nodeId}:${unit.mentalUnitId}`;
    const count = remaining.get(key) ?? 0;
    if (!count) return false;
    remaining.set(key, count - 1);
    return true;
  });
}

/** Assign each admitted current question a distinct original queue record in stable due/id order. */
export function reviewNeedForQuestion(question: TrainingQuestionSummary, candidates: readonly TrainingQuestionSummary[], reviews: readonly ReviewQueueEntry[], catalog: TrainingCatalog): ReviewQueueEntry | undefined {
  const evidence = canonicalQuestionReviewEvidence(catalog, question);
  const unit = learningUnitIdentity(evidence);
  const group = unit ? candidates.filter((candidate) => sameCurrentReviewUnit(canonicalQuestionReviewEvidence(catalog, candidate), evidence, catalog)) : candidates.filter((candidate) => candidate.questionId === question.questionId);
  const index = group.findIndex((candidate) => candidate.questionId === question.questionId);
  const matching = reviews.filter((entry) => sameCurrentReviewUnit(entry, evidence, catalog))
    .sort((left, right) => Date.parse(left.dueAt ?? "") - Date.parse(right.dueAt ?? "") || left.id.localeCompare(right.id));
  return index >= 0 ? matching[index] : undefined;
}

export function sameCurrentReviewUnit(review: ReviewEvidence, questionEvidence: ReviewEvidence, catalog: TrainingCatalog): boolean {
  const reviewUnit = learningUnitInCurrentCatalog(review, catalog);
  const questionUnit = learningUnitIdentity(questionEvidence);
  return reviewUnit !== undefined && questionUnit !== undefined && review.sourceItem.trackId === questionEvidence.sourceItem.trackId &&
    reviewUnit.nodeId === questionUnit.nodeId && reviewUnit.mentalUnitId === questionUnit.mentalUnitId;
}

/** Resolves a selected question to the active package's exact pin; callers own selection. */
export function exactCanonicalQuestionRef(catalog: TrainingCatalog, questionId: string): ResolvedContentRef {
  const question = catalog.getQuestion(questionId);
  if (!question || question.trackId !== catalog.trackId) throw new Error("Selected canonical question is unavailable in the exact catalog.");
  return createResolvedContentRef({ trackId: catalog.trackId, questionId: question.questionId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 });
}

/** Evidence for the question as authored in this exact discovery catalog. */
export function canonicalQuestionReviewEvidence(catalog: TrainingCatalog, question: TrainingQuestionSummary): import("../../domain").ReviewEvidence {
  return {
    sourceItem: exactCanonicalQuestionRef(catalog, question.questionId),
    taxonomyOrSkillRefs: [
      { axisId: "node", nodeId: question.nodeId, role: "primary" },
      { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" },
    ],
  };
}

/** Capture exact legacy attribution once, before session fingerprinting; resume never infers it. */
export function createCanonicalReviewSourceSnapshot(entry: ReviewQueueEntry, catalog: TrainingCatalog, source: ReviewSourceSnapshot["source"], now: string): ReviewSourceSnapshot {
  const snapshot = createReviewSourceSnapshot(entry, source, now);
  const legacyUnitProof = createLegacyReviewUnitProof(entry, catalog);
  return legacyUnitProof ? Object.freeze({ ...snapshot, legacyUnitProof }) : snapshot;
}

/** Validate only captured attribution against this session's exact artifact; never infer absent proof on resume. */
export function assertCanonicalReviewSourceProofs(session: TrainingSession, catalog: TrainingCatalog): void {
  const branches = (session.conditionalReinsertSlots ?? []).flatMap(slot => [slot.ordinaryBranch, slot.reviewedVariantBranch, slot.exactSourceBranch].filter(branch => branch !== undefined).map(branch => branch.occurrence));
  for (const occurrence of [...session.itemOrder, ...branches]) {
    const proof = occurrence.reviewSourceSnapshot?.legacyUnitProof;
    if (proof === undefined) continue;
    const question = catalog.getQuestion(occurrence.item.questionId);
    if (!question || !reviewEvidenceMatchesAttempt({ sourceItem: proof.sourceItem, taxonomyOrSkillRefs: [] }, canonicalQuestionReviewEvidence(catalog, question), proof, catalog)) throw new Error("Canonical review source proof is unavailable in the exact session catalog.");
  }
}

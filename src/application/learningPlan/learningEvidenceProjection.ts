import type { TrainingCatalog } from "../trainingLifecycle/contracts";
import { isActiveReviewQueueEntry, type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import { createArtifactSha256 } from "../../domain/learning/contentItemRef";
import {
  createPackageCompletionRule, evaluatePackageCompletion, qualifyPackageAttempts,
  type VerifiedPackageCompletionProfile, type PackageCompletionState,
} from "../../domain/learning/packageCompletionRule";
import type { ImmutableCompletedFacts } from "../../domain/learning/paceForecast";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";

export type LearningEvidenceProjection = Readonly<{
  identity: Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }>;
  capturedAt: string;
  activityAttempts: readonly TrainingAttempt<unknown>[];
  completion: PackageCompletionState;
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
  recordedReviews: readonly ReviewQueueEntry[];
  dueReviews: readonly ReviewQueueEntry[];
  completedFacts: ImmutableCompletedFacts;
}>;

/** One interpretation of verified, durable current-profile evidence for Home and proposals. */
export function projectLearningEvidence(input: Readonly<{
  profile: VerifiedPackageCompletionProfile & Pick<TrainingCatalog, "getQuestion">;
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
  now: string;
}>): LearningEvidenceProjection {
  const { profile } = input;
  if (!profile.trackId.trim() || !profile.contentVersion.trim()) throw new Error("Learning evidence package identity is invalid.");
  createArtifactSha256(profile.artifactSha256);
  if (Object.hasOwn(profile, "completionRule")) createPackageCompletionRule(profile.completionRule);
  const nowMs = Date.parse(input.now);
  if (!Number.isFinite(nowMs)) throw new Error("Learning evidence clock is invalid.");
  const uniqueAttempts = uniqueRecords(input.attempts);
  const qualifyingIds = new Set(qualifyPackageAttempts(profile, uniqueAttempts).map(attempt => attempt.id));
  // Preserve source evidence order for the existing proposal freshness contract;
  // the canonical evaluator owns deterministic rolling-window time/ID ordering.
  const activityAttempts = Object.freeze(uniqueAttempts.filter(attempt => attempt.trackId === profile.trackId && attempt.item.trackId === profile.trackId && attempt.item.contentVersion === profile.contentVersion && attempt.item.artifactSha256 === profile.artifactSha256));
  const attempts = Object.freeze(activityAttempts.filter(attempt => qualifyingIds.has(attempt.id)));
  if (activityAttempts.some(attempt => !profile.getQuestion(attempt.item.questionId))) throw new Error("Learning evidence item is absent from its verified package.");
  for (const attempt of activityAttempts) {
    const answeredAtMs = Date.parse(attempt.answeredAt);
    if (!Number.isFinite(answeredAtMs) || answeredAtMs > nowMs) throw new Error("Learning evidence answer time is invalid for its captured clock.");
  }
  const recordedReviews = uniqueRecords(input.reviews);
  const reviews = Object.freeze(recordedReviews.filter(entry => entry.trackId === profile.trackId &&
    entry.sourceItem.trackId === profile.trackId && entry.sourceItem.contentVersion === profile.contentVersion && entry.sourceItem.artifactSha256 === profile.artifactSha256));
  if (reviews.some(entry => !profile.getQuestion(entry.sourceItem.questionId))) throw new Error("Learning review item is absent from its verified package.");
  const dueReviews = Object.freeze(reviews.filter(entry => {
    if (!isActiveReviewQueueEntry(entry) || entry.dueAt === undefined) return false;
    const dueMs = Date.parse(entry.dueAt);
    if (!Number.isFinite(dueMs)) throw new Error("Learning review due date is invalid.");
    return dueMs <= nowMs;
  }));
  return Object.freeze({
    identity: Object.freeze({ trackId: profile.trackId, contentVersion: profile.contentVersion, artifactSha256: profile.artifactSha256 }), capturedAt: input.now, activityAttempts,
    completion: evaluatePackageCompletion(profile, attempts, profile.getQuestion), attempts, reviews, recordedReviews, dueReviews,
    completedFacts: Object.freeze({
      // Session requested/actual lengths are calendar/activity facts, not committed attempt volume.
      sessions: Object.freeze([]),
      attempts: Object.freeze(attempts.map(attempt => Object.freeze({ answeredAt: attempt.answeredAt, countsTowardCompletion: true }))),
    }),
  });
}

function uniqueRecords<T extends Readonly<{ id: string }>>(records: readonly T[]): readonly T[] {
  const byId = new Map<string, T>();
  const serializedById = new Map<string, string>();
  for (const record of records) {
    if (!record || typeof record.id !== "string" || !record.id.trim()) throw new Error("Learning evidence record identity is invalid.");
    const serialized = canonicalSerialize(record);
    if (byId.has(record.id)) {
      if (serializedById.get(record.id) !== serialized) throw new Error("Learning evidence has conflicting record identities.");
      continue;
    }
    byId.set(record.id, record); serializedById.set(record.id, serialized);
  }
  return Object.freeze([...byId.values()]);
}

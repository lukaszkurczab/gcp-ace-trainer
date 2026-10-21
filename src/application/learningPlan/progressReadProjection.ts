import type { ActivitySessionRecord } from "../activityReadModels";
import { CODING_INTERVIEW_TRACK_ID, GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, isActiveReviewQueueEntry, manualRequestIdForEntry, type TrackId, type TrainingAttempt, type ReviewQueueEntry } from "../../domain";
import { findTrackDescriptor, resolveTrackDomainMetadata } from "../../domain/tracks/trackAdmission";
import type { TrainingCatalog } from "../trainingLifecycle/contracts";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { projectCanonicalNodePerformance } from "../canonical/canonicalProgressEvidence";
import { buildCloudCertificationProgressViewModel, type CloudCertificationProgressViewModel } from "../../tracks/certification";
import { projectLearningEvidence, type LearningEvidenceProjection } from "./learningEvidenceProjection";
import { projectCodingProgress } from "../coding-interview/codingProgressProjection";
import { LearningProjectionUnavailableError } from "../learningProjectionFailure";
import type { ProgressEvidenceModel } from "./progressProjectionContracts";
export * from "./progressProjectionContracts";

export function projectProgressEvidence(input: Readonly<{ activeTrackId: TrackId; trainingAttempts: readonly TrainingAttempt[]; reviewQueueItems: readonly ReviewQueueEntry[]; activityRecords?: readonly ActivitySessionRecord[]; now: string }>): ProgressEvidenceModel {
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(input.activeTrackId).track;
  const evidence = projectLearningEvidence({ profile: track, attempts: input.trainingAttempts, reviews: input.reviewQueueItems, now: input.now });
  try {
    const model = input.activeTrackId === CODING_INTERVIEW_TRACK_ID
      ? projectCodingProgress(track, evidence, input.now)
      : input.activeTrackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID
        ? buildCloudProgressTabModel(buildCloudCertificationProgressViewModel({ attempts: evidence.attempts, reviewQueueItems: evidence.reviews, now: input.now, artifactSha256: track.artifactSha256 }))
        : buildInstalledPackageProgressTabModel(input.activeTrackId, track, evidence, input.now);
    const descriptor = findTrackDescriptor(input.activeTrackId);
    const performanceScores = model.performanceScores.map(score => {
      const resolution = resolveTrackDomainMetadata(descriptor, score.id);
      return { ...score, label: resolution.kind === "available" ? resolution.metadata.title : "Domain metadata unavailable", ...(resolution.kind === "available" && !resolution.metadata.description ? {} : { description: resolution.kind === "available" ? resolution.metadata.description : "Domain metadata is unavailable for this evidence." }) };
    });
    const hasRecordedActivity = input.trainingAttempts.some(attempt => attempt.trackId === input.activeTrackId)
      || input.reviewQueueItems.some(review => review.trackId === input.activeTrackId)
      || (input.activityRecords ?? []).some(record => record.session.trackId === input.activeTrackId);
    const emptyConfig = descriptor?.presentation.progressEmptyState;
    const emptyState = Object.freeze({
      title: emptyConfig?.title ?? "No learning evidence yet",
      description: emptyConfig && hasRecordedActivity ? emptyConfig.recordedActivityDescription : "Complete a Practice session to begin building Progress.",
      reviewAction: emptyConfig?.reviewAction === true && model.reviewAction !== undefined,
    });
    return Object.freeze({ ...model, performanceScores, emptyState, identity: evidence.identity, capturedAt: evidence.capturedAt, hasRecordedActivity });
  } catch (cause) {
    // No repositories, profile transitions or asynchronous reads occur in this pure stage.
    throw new LearningProjectionUnavailableError("progress", cause);
  }
}

function buildInstalledPackageProgressTabModel(
  trackId: TrackId,
  track: TrainingCatalog,
  evidence: LearningEvidenceProjection,
  now: string,
): Omit<ProgressEvidenceModel, "identity" | "capturedAt" | "hasRecordedActivity" | "emptyState"> {
  const currentAttempts = evidence.activityAttempts;
  const scopedReviews = evidence.reviews;
  const isDue = (entry: ReviewQueueEntry) => entry.dueAt !== undefined && Date.parse(entry.dueAt) <= Date.parse(now);
  const isFuture = (entry: ReviewQueueEntry) => entry.dueAt !== undefined && Date.parse(entry.dueAt) > Date.parse(now);
  const dueReviewCount = scopedReviews.filter((entry) => isActiveReviewQueueEntry(entry) && isDue(entry)).length;
  const manualReviewCount = scopedReviews.filter((entry) => isActiveReviewQueueEntry(entry) && isFuture(entry) && entry.reasons.includes("manual_mark") && manualRequestIdForEntry(entry) !== undefined).length;
  const scores = projectCanonicalNodePerformance(track, evidence.attempts);

  return {
    hasData: currentAttempts.length > 0,
    metrics: [
      { label: "Answered", tone: "info", value: currentAttempts.length },
      { label: "Due review", tone: dueReviewCount > 0 ? "warning" : "neutral", value: dueReviewCount },
      { label: "Manual review ready", tone: manualReviewCount > 0 ? "primary" : "neutral", value: manualReviewCount },
      { label: "Saved review", tone: "primary", value: scopedReviews.length },
    ],
    performanceScores: scores.map((score) => {
      const nodeId = score.nodeId;
      return {
        correct: score.correct,
        detail: `${score.earned}/${score.max} points`,
        id: nodeId,
        label: nodeId,
        percent: score.percent,
        total: score.total,
      };
    }),
    performanceSectionTitle: "Performance areas",
    reviewAction: dueReviewCount + manualReviewCount > 0 ? { kind: "canonicalReviewQueue" } : undefined,
    reviewActionEnabled: dueReviewCount + manualReviewCount > 0,
    reviewActionLabel: "Open review queue",
    reviewQueueCount: dueReviewCount + manualReviewCount,
    reviewQueueCopy: formatCanonicalReviewQueueCopy(dueReviewCount, scopedReviews.filter((entry) => entry.reasons.includes("repeated_mistake")).length, scopedReviews.length, manualReviewCount),
    ...(dueReviewCount > 0 && manualReviewCount > 0 ? { reviewQueueCopyParams: { dueCount: dueReviewCount, manualCount: manualReviewCount } } : {}),
    ...(dueReviewCount === 0 && manualReviewCount > 0 ? { reviewQueueCopyParams: { count: manualReviewCount } } : {}),
  };
}

function buildCloudProgressTabModel(
  progress: CloudCertificationProgressViewModel,
): Omit<ProgressEvidenceModel, "identity" | "capturedAt" | "hasRecordedActivity" | "emptyState"> {
  return {
    hasData: progress.totalAttempts > 0,
    metrics: [
      {
        label: "Total attempts",
        tone: "info",
        value: progress.totalAttempts,
      },
      {
        label: "Practice answers",
        tone: "primary",
        value: progress.practiceAttemptCount,
      },
      { label: "Manual review ready", tone: progress.manualReviewCount > 0 ? "primary" : "neutral", value: progress.manualReviewCount },
      {
        label: "Exam answers",
        tone: "neutral",
        value: progress.examAttemptCount,
      },
    ],
    performanceScores: progress.taxonomyPerformance
      .filter((score) => score.axisId === "cloud-domain" && score.totalAttempts > 0)
      .map((score) => {

        return {
          correct: score.correctCount,
          
          id: score.nodeId,
          label: score.nodeId,
          percent: score.percent,
          total: score.totalAttempts,
        };
      }),
    performanceSectionTitle: "Performance by domain",
    reviewAction: progress.dueReviewCount + progress.manualReviewCount > 0 ? { kind: "canonicalReviewQueue" } : undefined,
    reviewActionEnabled: progress.dueReviewCount + progress.manualReviewCount > 0,
    reviewActionLabel: "Open review queue",
    reviewQueueCount: progress.dueReviewCount + progress.manualReviewCount,
    reviewQueueCopy: formatCanonicalReviewQueueCopy(
      progress.dueReviewCount,
      progress.highPriorityReviewCount,
      progress.scheduledReviewCount,
      progress.manualReviewCount,
    ),
    ...(progress.dueReviewCount > 0 && progress.manualReviewCount > 0 ? { reviewQueueCopyParams: { dueCount: progress.dueReviewCount, manualCount: progress.manualReviewCount } } : {}),
    ...(progress.dueReviewCount === 0 && progress.manualReviewCount > 0 ? { reviewQueueCopyParams: { count: progress.manualReviewCount } } : {}),

  };
}

function formatCanonicalReviewQueueCopy(
  dueCount: number,
  highPriorityCount: number,
  scheduledCount: number,
  manualCount = 0,
): string {
  if (dueCount === 0) {
    if (manualCount > 0) return "home.review.manualReady";
    if (scheduledCount > 0) {
      return `${scheduledCount} scheduled ${scheduledCount === 1 ? "item is" : "items are"} not due yet.`;
    }

    return "No due review items right now.";
  }

  const dueCopy = highPriorityCount > 0
    ? `${dueCount} due ${dueCount === 1 ? "item" : "items"}, ${highPriorityCount} high priority`
    : `${dueCount} due review ${dueCount === 1 ? "item" : "items"}`;
  if (manualCount > 0) return "home.review.dueAndManual";
  return `${dueCopy}.`;
}


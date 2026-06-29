import type { TrackId } from "../tracks";
import type { TrainingItemTaxonomyRef } from "./trainingItem";

export type ProgressEvidenceLevel =
  | "insufficient"
  | "emerging"
  | "supported"
  | "strong";

export type ProgressEvidenceSignal =
  | {
      count: number;
      type: "attempts_count";
    }
  | {
      correct: number;
      total: number;
      type: "first_attempt_accuracy";
    }
  | {
      correct: number;
      total: number;
      type: "recent_accuracy";
      windowAttemptCount: number;
    }
  | {
      count: number;
      type: "due_review_count";
    }
  | {
      coveredItemCount: number;
      totalItemCount: number;
      type: "coverage";
    }
  | {
      evidenceLevel?: ProgressEvidenceLevel;
      taxonomyRef: TrainingItemTaxonomyRef;
      type: "weak_taxonomy_node";
    }
  | {
      count: number;
      mistakeTypeRef: TrainingItemTaxonomyRef;
      type: "repeated_mistake_type";
    };

export type ReviewQueueSummary = {
  dueCount: number;
  highPriorityDueCount: number;
  nextDueAt?: string;
  overdueCount: number;
  upcomingCount: number;
};

export type TaxonomyProgress = {
  attemptsCount: number;
  dueReviewCount: number;
  evidenceLevel: ProgressEvidenceLevel;
  firstAttemptCorrectCount?: number;
  firstAttemptTotalCount?: number;
  recentCorrectCount?: number;
  recentTotalCount?: number;
  repeatedMistakeTypeRefs?: TrainingItemTaxonomyRef[];
  taxonomyRef: TrainingItemTaxonomyRef;
  updatedAt: string;
};

export type UserProgress = {
  completedSessionCount: number;
  evidenceSignals: ProgressEvidenceSignal[];
  reviewQueue: ReviewQueueSummary;
  taxonomyProgress: TaxonomyProgress[];
  trackId: TrackId;
  updatedAt: string;
  userId: string;
};

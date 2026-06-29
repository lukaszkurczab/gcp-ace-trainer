import type { TrainingAttemptId } from "./trainingAttempt";
import type { TrainingItemId, TrainingItemTaxonomyRef } from "./trainingItem";

export type TrainingFeedbackId = string;

export type FeedbackSignal =
  | "correct"
  | "incorrect"
  | "partially_correct"
  | "strong_strategy"
  | "weak_strategy"
  | "misconception"
  | "review_recommended"
  | "neutral";

export type TrainingFeedbackNextAction = {
  itemId?: TrainingItemId;
  label: string;
  type: "review" | "retry" | "study_taxonomy" | "continue";
};

export type TrainingFeedback = {
  alternativeRationales?: Record<string, string>;
  attemptId?: TrainingAttemptId;
  distractorRationales?: Record<string, string>;
  explanation: string;
  id: TrainingFeedbackId;
  itemId: TrainingItemId;
  mistakeTypeRefs?: TrainingItemTaxonomyRef[];
  nextAction?: TrainingFeedbackNextAction;
  rationale?: string;
  signals: FeedbackSignal[];
};

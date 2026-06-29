import type { TrackId, TrainingItemType as TrackTrainingItemType } from "../tracks";

export type TrainingItemId = string;
export type TrainingItemType = TrackTrainingItemType;

export type TrainingItemDifficulty =
  | "introductory"
  | "easy"
  | "medium"
  | "hard"
  | "advanced";

export type TrainingItemTaxonomyRef = {
  axisId: string;
  nodeId: string;
  role?: "primary" | "secondary" | "prerequisite" | "mistake_type";
  trackId?: TrackId;
  weight?: number;
};

export type TrainingItemOption = {
  id: string;
  label?: string;
  text: string;
};

export type TrainingChoiceResponseSpec = {
  kind: "option_selection";
  maxSelections: number;
  minSelections: number;
  options: TrainingItemOption[];
};

export type TrainingPatternResponseSpec = {
  kind: "pattern_selection";
  patterns: TrainingItemOption[];
};

export type TrainingStrategyResponseSpec = {
  kind: "strategy_selection";
  strategies: TrainingItemOption[];
};

export type TrainingComplexityDimension = "time" | "space";

export type TrainingComplexityResponseSpec = {
  kind: "complexity_analysis";
  answerFormat: "big_o" | "classification" | "freeform";
  dimensions: TrainingComplexityDimension[];
  choices?: TrainingItemOption[];
};

export type TrainingSolutionComparisonResponseSpec = {
  kind: "solution_comparison";
  comparisonCriteria?: string[];
  solutions: TrainingItemOption[];
};

export type TrainingFreeformResponseSpec = {
  kind: "freeform";
  maxLength?: number;
  placeholder?: string;
};

export type TrainingItemBase = {
  contentVersion: string;
  difficulty?: TrainingItemDifficulty;
  estimatedTimeSeconds?: number;
  id: TrainingItemId;
  learningObjective?: string;
  prompt: string;
  taxonomyRefs: TrainingItemTaxonomyRef[];
  trackId: TrackId;
  type: TrainingItemType;
};

export type CertificationSingleChoiceTrainingItem = TrainingItemBase & {
  responseSpec: TrainingChoiceResponseSpec & {
    maxSelections: 1;
    minSelections: 1;
  };
  type: "single_choice_question";
};

export type CertificationMultipleChoiceTrainingItem = TrainingItemBase & {
  responseSpec: TrainingChoiceResponseSpec;
  type: "multiple_choice_question";
};

export type AlgorithmsPatternIdentificationTrainingItem = TrainingItemBase & {
  responseSpec: TrainingPatternResponseSpec;
  type: "pattern_identification";
};

export type AlgorithmsStrategyChoiceTrainingItem = TrainingItemBase & {
  responseSpec: TrainingStrategyResponseSpec;
  type: "strategy_choice";
};

export type AlgorithmsComplexityAnalysisTrainingItem = TrainingItemBase & {
  responseSpec: TrainingComplexityResponseSpec;
  type: "complexity_analysis";
};

export type AlgorithmsSolutionComparisonTrainingItem = TrainingItemBase & {
  responseSpec: TrainingSolutionComparisonResponseSpec;
  type: "solution_comparison";
};

export type MistakeReviewTrainingItem = TrainingItemBase & {
  responseSpec: TrainingFreeformResponseSpec;
  type: "mistake_review";
};

export type FreeformReflectionTrainingItem = TrainingItemBase & {
  responseSpec: TrainingFreeformResponseSpec;
  type: "freeform_reflection";
};

export type TrainingItem =
  | CertificationSingleChoiceTrainingItem
  | CertificationMultipleChoiceTrainingItem
  | AlgorithmsPatternIdentificationTrainingItem
  | AlgorithmsStrategyChoiceTrainingItem
  | AlgorithmsComplexityAnalysisTrainingItem
  | AlgorithmsSolutionComparisonTrainingItem
  | MistakeReviewTrainingItem
  | FreeformReflectionTrainingItem;

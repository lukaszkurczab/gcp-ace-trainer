import type { TrackId, TrainingItemType } from "../tracks";
import type { FeedbackSignal } from "./trainingFeedback";
import type { TrainingItemId, TrainingItemTaxonomyRef } from "./trainingItem";
import type { TrainingSessionId, TrainingSessionModeId } from "./trainingSession";

export type TrainingAttemptId = string;

export type TrainingAttemptConfidence = "low" | "medium" | "high" | "unsure";

export type ComplexityAnswer = {
  rationale?: string;
  space?: string;
  time?: string;
};

export type TrainingAttemptResponse =
  | {
      kind: "option_selection";
      selectedOptionIds: string[];
    }
  | {
      kind: "pattern_selection";
      selectedPatternId: string;
    }
  | {
      kind: "strategy_selection";
      selectedStrategyId: string;
    }
  | {
      kind: "complexity_analysis";
      selectedComplexityAnswer: ComplexityAnswer;
    }
  | {
      kind: "solution_comparison";
      rationale?: string;
      selectedSolutionId: string;
    }
  | {
      kind: "freeform";
      text: string;
    };

export type TrainingAttemptResult =
  | {
      isCorrect: boolean;
      kind: "correctness";
    }
  | {
      earnedPoints: number;
      isCorrect?: boolean;
      kind: "partial_credit";
      maxPoints: number;
    }
  | {
      components: TrainingAttemptResult[];
      isCorrect?: boolean;
      kind: "mixed";
      score?: number;
    };

export type TrainingAttempt = {
  answeredAt: string;
  confidence?: TrainingAttemptConfidence;
  durationSeconds?: number;
  feedbackSignals?: FeedbackSignal[];
  id: TrainingAttemptId;
  itemId: TrainingItemId;
  itemType: TrainingItemType;
  mistakeTypeRefs?: TrainingItemTaxonomyRef[];
  modeId: TrainingSessionModeId;
  response: TrainingAttemptResponse;
  result?: TrainingAttemptResult;
  sessionId?: TrainingSessionId;
  trackId: TrackId;
};

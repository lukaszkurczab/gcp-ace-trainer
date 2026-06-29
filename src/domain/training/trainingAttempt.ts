import type { TrackId, TrainingItemType } from "../tracks";
import type { TrainingItemId } from "./trainingItem";
import type { TrainingSessionId } from "./trainingSession";

export type TrainingAttemptId = string;

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
      kind: "strategy_quality";
      quality: "strong" | "acceptable" | "weak" | "unsafe";
      score?: number;
    }
  | {
      components: TrainingAttemptResult[];
      isCorrect?: boolean;
      kind: "mixed";
      score?: number;
    };

export type TrainingAttempt = {
  durationSeconds?: number;
  id: TrainingAttemptId;
  itemId: TrainingItemId;
  itemType: TrainingItemType;
  response: TrainingAttemptResponse;
  result?: TrainingAttemptResult;
  sessionId?: TrainingSessionId;
  submittedAt: string;
  trackId: TrackId;
};

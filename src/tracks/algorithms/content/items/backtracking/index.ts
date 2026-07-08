import { chooseRecursionStateQuestions } from "./choose-recursion-state";
import { enumerateChoicesQuestions } from "./enumerate-choices";
import { baseCaseAndResultContractQuestions } from "./base-case-and-result-contract";
import { pathStateAndUndoQuestions } from "./path-state-and-undo";
import { constraintPruningQuestions } from "./constraint-pruning";
import { duplicateControlQuestions } from "./duplicate-control";
import { gridSearchBacktrackingQuestions } from "./grid-search-backtracking";
import { partitioningAndSegmentationQuestions } from "./partitioning-and-segmentation";
import { backtrackingVsOtherPatternsQuestions } from "./backtracking-vs-other-patterns";
import { placementBacktrackingQuestions } from "./placement-backtracking";
import { backtrackingVsMemoizedSearchQuestions } from "./backtracking-vs-memoized-search";
import { backtrackingComplexityQuestions } from "./backtracking-complexity";
import type {
  AlgorithmMistakeType,
  AlgorithmTrainingItem,
} from "../../../algorithmContentTypes";

type RawBacktrackingQuestion = {
  contentVersion: string;
  correctAnswerId: string;
  difficulty: string;
  feedbackModel: {
    decisionSignal: string;
    details?: string;
    distractorExplanations?: Record<string, string | undefined>;
    mentalModelCorrection: string;
    mistakeTypes: readonly string[];
    nextAction: string;
    result: string;
  };
  id: string;
  learningStage: string;
  options: readonly { id: string; text: string }[];
  primarySkillAtomId: string;
  prompt: string;
  secondarySkillAtomIds?: readonly string[];
  title?: string;
  type: string;
};

type BacktrackingQuestion = AlgorithmTrainingItem & {
  correctAnswerId: string;
  options: readonly { id: string; text: string }[];
  type: "single_choice";
};

function defineBacktrackingQuestions(
  questions: readonly RawBacktrackingQuestion[],
): readonly BacktrackingQuestion[] {
  return questions.map((question) => {
    const mistakeTypes = question.feedbackModel.mistakeTypes as readonly AlgorithmMistakeType[];
    const distractorExplanations = Object.fromEntries(
      Object.entries(question.feedbackModel.distractorExplanations ?? {}).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    const feedbackModel = {
      ...question.feedbackModel,
      distractorExplanations,
      mistakeTypes,
      result: question.feedbackModel.result as AlgorithmTrainingItem["feedbackModel"]["result"],
    };

    return {
      ...question,
      contentVersion: question.contentVersion as AlgorithmTrainingItem["contentVersion"],
      difficulty: question.difficulty as AlgorithmTrainingItem["difficulty"],
      feedbackModel,
      learningStage: question.learningStage as AlgorithmTrainingItem["learningStage"],
      roadmapNodeId: "backtracking",
      status: "active",
      type: "single_choice",
      staticMicroChecks: [
        {
          correctAnswer: question.correctAnswerId,
          feedback: question.feedbackModel.decisionSignal,
          id: `${question.id}-check`,
          mistakeTypes,
          options: question.options,
          prompt: question.prompt,
          status: "active",
          testedSkillAtomIds: [question.primarySkillAtomId],
          type: "single_choice",
        },
      ],
      taxonomyRefs: [
        { axisId: "pattern_family", nodeId: "backtracking", role: "primary" },
        { axisId: "skill_atom", nodeId: question.primarySkillAtomId, role: "primary" },
        ...mistakeTypes.map((mistakeType) => ({
          axisId: "mistake_type" as const,
          nodeId: mistakeType,
          role: "mistake_type" as const,
        })),
      ],
      title: question.title ?? makeQuestionTitle(question.id),
      trackId: "algorithms",
    };
  });
}

function makeQuestionTitle(id: string): string {
  return id
    .replace(/^alg-backtracking-/, "")
    .replace(/-\d+$/, "")
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

const rawBacktrackingQuestions = [
  ...chooseRecursionStateQuestions,
  ...enumerateChoicesQuestions,
  ...baseCaseAndResultContractQuestions,
  ...pathStateAndUndoQuestions,
  ...constraintPruningQuestions,
  ...duplicateControlQuestions,
  ...gridSearchBacktrackingQuestions,
  ...partitioningAndSegmentationQuestions,
  ...backtrackingVsOtherPatternsQuestions,
  ...placementBacktrackingQuestions,
  ...backtrackingVsMemoizedSearchQuestions,
  ...backtrackingComplexityQuestions,
];

export const backtrackingQuestions = defineBacktrackingQuestions(rawBacktrackingQuestions);

export default backtrackingQuestions;

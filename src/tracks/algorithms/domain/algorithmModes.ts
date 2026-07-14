import { ALGORITHM_QUESTION_TYPES, type AlgorithmQuestionType } from "../algorithmQuestionTypes";

export type AlgorithmModeDefinition = Readonly<{
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  itemTypes: readonly AlgorithmQuestionType[];
}>;

export const ALGORITHM_MODES: readonly AlgorithmModeDefinition[] = [
  { id: "algorithms-roadmap-basics", title: "Pattern basics", enabled: true, order: 1, itemTypes: ALGORITHM_QUESTION_TYPES },
  { id: "algorithms-learn", title: "Learn", enabled: true, order: 2, itemTypes: ["single_choice", "approach_naming", "code_reading"] },
  { id: "algorithms-drill", title: "Drill", enabled: true, order: 3, itemTypes: ALGORITHM_QUESTION_TYPES },
  { id: "algorithms-review", title: "Review", enabled: true, order: 4, itemTypes: ALGORITHM_QUESTION_TYPES },
  { id: "algorithms-weak-area", title: "Weak area", enabled: true, order: 5, itemTypes: ALGORITHM_QUESTION_TYPES },
  { id: "algorithms-mixed-practice", title: "Mixed practice", enabled: true, order: 6, itemTypes: ALGORITHM_QUESTION_TYPES },
];

export function getAlgorithmMode(modeId: string): AlgorithmModeDefinition {
  const mode = ALGORITHM_MODES.find((candidate) => candidate.id === modeId);
  if (!mode) throw new Error(`Unknown Algorithms mode id: ${modeId}`);
  return mode;
}

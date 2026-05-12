export type ExamDomain =
  | "setup_environment"
  | "planning_implementation"
  | "operations"
  | "access_security";

export type QuestionType = "single" | "multiple";

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionOption = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  domain: ExamDomain;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  options: QuestionOption[];
  correctOptionIds: string[];
  explanation: string;
  whyOthersAreWrong?: Record<string, string>;
  watchOutFor?: string[];
  tags: string[];
  examSignals?: string[];
};

export type ExamBlueprint = Record<ExamDomain, number>;

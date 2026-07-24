export type CertificationDomain =
  | "setup_environment"
  | "planning_implementation"
  | "operations"
  | "access_security";

export type CertificationQuestionType = "single" | "multiple";
export type CertificationDifficulty = "easy" | "medium" | "hard";

export type CertificationQuestionOption = Readonly<{ id: string; text: string }>;

export type CertificationQuestion = Readonly<{
  id: string;
  domain: CertificationDomain;
  type: CertificationQuestionType;
  difficulty: CertificationDifficulty;
  question: string;
  options: readonly CertificationQuestionOption[];
  correctOptionIds: readonly string[];
  explanation: string;
  whyOthersAreWrong?: Readonly<Record<string, string>>;
  watchOutFor?: string | readonly string[];
  tags: readonly string[];
  examSignals?: readonly string[];
}>;

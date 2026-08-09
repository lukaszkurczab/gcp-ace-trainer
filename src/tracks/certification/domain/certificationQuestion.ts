export type CertificationDomain =
  | "setup_environment"
  | "planning_implementation"
  | "operations"
  | "access_security";

export type CertificationQuestionType = "single" | "multiple";
export type CertificationDifficulty = "easy" | "medium" | "hard";

export type CertificationQuestionOption = Readonly<{ id: string; text: string }>;
export type CertificationFeedback = Readonly<{
  reason: string;
  details: import("../../../content/contracts").FeedbackDocument;
  wrongOptionExplanationsByOptionId: Readonly<Record<string, string>>;
  omittedCorrectExplanationsByOptionId?: Readonly<Record<string, string>>;
}>;

export type CertificationQuestion = Readonly<{
  id: string;
  domain: CertificationDomain;
  type: CertificationQuestionType;
  difficulty: CertificationDifficulty;
  question: string;
  options: readonly CertificationQuestionOption[];
  correctOptionIds: readonly string[];
  feedback: CertificationFeedback;
  tags: readonly string[];
  examSignals?: readonly string[];
}>;

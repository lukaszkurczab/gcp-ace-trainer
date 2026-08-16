/** Provider/exam-specific domains are content-owned and may expand per certification track. */
export type CertificationDomain = string;

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
  nodeId?: string;
  domain: CertificationDomain;
  type: CertificationQuestionType;
  difficulty?: CertificationDifficulty;
  question: string;
  options: readonly CertificationQuestionOption[];
  correctOptionIds: readonly string[];
  feedback: CertificationFeedback;
  tags: readonly string[];
  examSignals?: readonly string[];
}>;

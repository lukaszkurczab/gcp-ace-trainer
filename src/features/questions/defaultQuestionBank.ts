import seedQuestions from "../../../data/question-bank/ace-foundation-320.json";

import type {
  CertificationDifficulty,
  CertificationDomain,
  CertificationQuestion,
  CertificationQuestionType,
} from "../../tracks/cloud-certification/domain";

export const DEFAULT_QUESTION_BANK: CertificationQuestion[] = seedQuestions.map((question) => ({
  ...question,
  difficulty: parseDifficulty(question.difficulty),
  domain: parseDomain(question.domain),
  options: question.options.map((option) => ({ ...option })),
  type: parseQuestionType(question.type),
  whyOthersAreWrong: question.whyOthersAreWrong
    ? Object.fromEntries(Object.entries(question.whyOthersAreWrong).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
    : undefined,
}));

const defaultQuestionsById = new Map(DEFAULT_QUESTION_BANK.map((question) => [question.id, question]));

export function mergeWithDefaultQuestionBank(localQuestions: readonly CertificationQuestion[]): CertificationQuestion[] {
  const questionsById = new Map(defaultQuestionsById);

  localQuestions.forEach((question) => {
    questionsById.set(question.id, question);
  });

  return [...questionsById.values()];
}

function parseDomain(value: string): CertificationDomain {
  if (value === "setup_environment" || value === "planning_implementation" || value === "operations" || value === "access_security") return value;
  throw new Error(`Unknown Certification domain: ${value}`);
}

function parseDifficulty(value: string): CertificationDifficulty {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  throw new Error(`Unknown Certification difficulty: ${value}`);
}

function parseQuestionType(value: string): CertificationQuestionType {
  if (value === "single" || value === "multiple") return value;
  throw new Error(`Unknown Certification question type: ${value}`);
}

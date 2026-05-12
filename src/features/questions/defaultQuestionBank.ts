import seedQuestions from "../../../data/question-bank/ace-foundation-320.json";

import type { Question } from "../../types";

export const DEFAULT_QUESTION_BANK = seedQuestions as unknown as Question[];

const defaultQuestionsById = new Map(DEFAULT_QUESTION_BANK.map((question) => [question.id, question]));

export function mergeWithDefaultQuestionBank(localQuestions: readonly Question[]): Question[] {
  const questionsById = new Map(defaultQuestionsById);

  localQuestions.forEach((question) => {
    questionsById.set(question.id, question);
  });

  return [...questionsById.values()];
}

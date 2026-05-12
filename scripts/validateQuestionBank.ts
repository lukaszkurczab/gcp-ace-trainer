import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { Difficulty, ExamDomain, QuestionType } from "../src/types";

const domains: readonly ExamDomain[] = ["setup_environment", "planning_implementation", "operations", "access_security"];
const difficulties: readonly Difficulty[] = ["easy", "medium", "hard"];
const questionTypes: readonly QuestionType[] = ["single", "multiple"];
const optionIds = ["A", "B", "C", "D"] as const;

type OptionId = (typeof optionIds)[number];

type ValidationSummary = {
  total: number;
  byDomain: Record<ExamDomain, number>;
  byDifficulty: Record<Difficulty, number>;
  byType: Record<QuestionType, number>;
  errors: string[];
};

type QuestionRecord = {
  id?: unknown;
  domain?: unknown;
  type?: unknown;
  difficulty?: unknown;
  question?: unknown;
  options?: unknown;
  correctOptionIds?: unknown;
  explanation?: unknown;
  whyOthersAreWrong?: unknown;
  watchOutFor?: unknown;
  tags?: unknown;
  examSignals?: unknown;
};

function emptySummary(): ValidationSummary {
  return {
    total: 0,
    byDomain: {
      setup_environment: 0,
      planning_implementation: 0,
      operations: 0,
      access_security: 0
    },
    byDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0
    },
    byType: {
      single: 0,
      multiple: 0
    },
    errors: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasKebabCaseItems(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item));
}

function hasNonEmptyStringItems(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function push(errors: string[], label: string, message: string) {
  errors.push(`${label}: ${message}`);
}

export function validateQuestionBankFile(filePath = "data/question-bank/ace-foundation-240.json"): ValidationSummary {
  const summary = emptySummary();
  const absolutePath = resolve(filePath);
  const parsed = JSON.parse(readFileSync(absolutePath, "utf8")) as unknown;

  if (!Array.isArray(parsed)) {
    summary.errors.push("Top-level JSON value must be an array.");
    return summary;
  }

  summary.total = parsed.length;
  const seenIds = new Set<string>();
  const seenQuestions = new Set<string>();

  parsed.forEach((item, index) => {
    const label = `Question ${index + 1}`;

    if (!isRecord(item)) {
      push(summary.errors, label, "item must be an object.");
      return;
    }

    const question = item as QuestionRecord;
    const expectedId = `ace-q-${String(index + 1).padStart(4, "0")}`;

    if (question.id !== expectedId) {
      push(summary.errors, label, `id must be ${expectedId}.`);
    }

    if (typeof question.id === "string") {
      if (seenIds.has(question.id)) {
        push(summary.errors, label, `duplicate id ${question.id}.`);
      }

      seenIds.add(question.id);
    }

    if (!domains.includes(question.domain as ExamDomain)) {
      push(summary.errors, label, "domain is invalid.");
    } else {
      summary.byDomain[question.domain as ExamDomain] += 1;
    }

    if (!difficulties.includes(question.difficulty as Difficulty)) {
      push(summary.errors, label, "difficulty is invalid.");
    } else {
      summary.byDifficulty[question.difficulty as Difficulty] += 1;
    }

    if (!questionTypes.includes(question.type as QuestionType)) {
      push(summary.errors, label, "type is invalid.");
    } else {
      summary.byType[question.type as QuestionType] += 1;
    }

    if (!isNonEmptyString(question.question)) {
      push(summary.errors, label, "question must be a non-empty string.");
    } else if (seenQuestions.has(question.question)) {
      push(summary.errors, label, "question text must be unique.");
    } else {
      seenQuestions.add(question.question);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      push(summary.errors, label, "options must contain exactly 4 entries.");
    }

    const optionIdSet = new Set<string>();

    if (Array.isArray(question.options)) {
      question.options.forEach((option, optionIndex) => {
        const expectedOptionId = optionIds[optionIndex];

        if (!isRecord(option)) {
          push(summary.errors, label, `option ${optionIndex + 1} must be an object.`);
          return;
        }

        if (option.id !== expectedOptionId) {
          push(summary.errors, label, `option ${optionIndex + 1} id must be ${expectedOptionId}.`);
        }

        if (typeof option.id === "string") {
          optionIdSet.add(option.id);
        }

        if (!isNonEmptyString(option.text)) {
          push(summary.errors, label, `option ${expectedOptionId ?? optionIndex + 1} text must be non-empty.`);
        }
      });
    }

    const correctOptionIds = Array.isArray(question.correctOptionIds) ? question.correctOptionIds : [];

    if (!Array.isArray(question.correctOptionIds) || correctOptionIds.length === 0) {
      push(summary.errors, label, "correctOptionIds must be a non-empty array.");
    }

    const uniqueCorrectOptionIds = new Set(correctOptionIds);

    if (uniqueCorrectOptionIds.size !== correctOptionIds.length) {
      push(summary.errors, label, "correctOptionIds must not contain duplicates.");
    }

    correctOptionIds.forEach((correctOptionId) => {
      if (typeof correctOptionId !== "string" || !optionIdSet.has(correctOptionId)) {
        push(summary.errors, label, "every correctOptionId must reference an option id.");
      }
    });

    if (question.type === "single" && correctOptionIds.length !== 1) {
      push(summary.errors, label, "single questions must have exactly one correct answer.");
    }

    if (question.type === "multiple") {
      if (correctOptionIds.length < 2 || correctOptionIds.length > 3) {
        push(summary.errors, label, "multiple questions must have 2 or 3 correct answers.");
      }

      const chooseText = `Choose ${correctOptionIds.length} answers.`;

      if (typeof question.question !== "string" || !question.question.includes(chooseText)) {
        push(summary.errors, label, `multiple questions must include "${chooseText}".`);
      }
    }

    if (!isNonEmptyString(question.explanation)) {
      push(summary.errors, label, "explanation must be a non-empty string.");
    }

    if (!isRecord(question.whyOthersAreWrong)) {
      push(summary.errors, label, "whyOthersAreWrong must be an object.");
    } else {
      const whyOthersAreWrong = question.whyOthersAreWrong;
      const incorrectOptionIds = optionIds.filter((optionId) => !uniqueCorrectOptionIds.has(optionId));

      incorrectOptionIds.forEach((optionId) => {
        if (!isNonEmptyString(whyOthersAreWrong[optionId])) {
          push(summary.errors, label, `whyOthersAreWrong must explain option ${optionId}.`);
        }
      });

      Object.keys(whyOthersAreWrong).forEach((optionId) => {
        if (!optionIds.includes(optionId as OptionId) || uniqueCorrectOptionIds.has(optionId)) {
          push(summary.errors, label, `whyOthersAreWrong contains unexpected option ${optionId}.`);
        }
      });
    }

    if (!isNonEmptyString(question.watchOutFor)) {
      push(summary.errors, label, "watchOutFor must be a non-empty string.");
    }

    if (!hasKebabCaseItems(question.tags)) {
      push(summary.errors, label, "tags must be a non-empty lowercase kebab-case string array.");
    }

    if (!hasNonEmptyStringItems(question.examSignals)) {
      push(summary.errors, label, "examSignals must be a non-empty string array.");
    }
  });

  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const summary = validateQuestionBankFile(process.argv[2]);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors.length > 0) {
    process.exitCode = 1;
  }
}

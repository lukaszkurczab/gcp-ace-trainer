import type { Difficulty, ExamDomain, Question, QuestionOption, QuestionType } from "../../types";
import { buildQuestionBankSummary, type QuestionBankSummaryData } from "../questions/questionBankStats";

export type ImportMode = "append" | "replace";

export type QuestionImportValidationResult = {
  parsed: boolean;
  canImport: boolean;
  parseError?: string;
  totalParsedQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  duplicateIds: string[];
  domainCoverage: QuestionBankSummaryData["domainCoverage"];
  examReady: boolean;
  questions: Question[];
  errors: string[];
};

const validDomains: readonly ExamDomain[] = ["setup_environment", "planning_implementation", "operations", "access_security"];
const validDifficulties: readonly Difficulty[] = ["easy", "medium", "hard"];
const validQuestionTypes: readonly QuestionType[] = ["single", "multiple"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateOption(value: unknown): QuestionOption | null {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.text)) {
    return null;
  }

  return {
    id: value.id,
    text: value.text
  };
}

function normalizeQuestion(value: unknown, index: number): { question?: Question; errors: string[] } {
  const label = `Question ${index + 1}`;
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { errors: [`${label}: item must be an object.`] };
  }

  if (!isNonEmptyString(value.id)) {
    errors.push(`${label}: id must be a non-empty string.`);
  }

  if (!validDomains.includes(value.domain as ExamDomain)) {
    errors.push(`${label}: domain is invalid.`);
  }

  if (!validDifficulties.includes(value.difficulty as Difficulty)) {
    errors.push(`${label}: difficulty is invalid.`);
  }

  if (!validQuestionTypes.includes(value.type as QuestionType)) {
    errors.push(`${label}: type must be single or multiple.`);
  }

  if (!isNonEmptyString(value.question)) {
    errors.push(`${label}: question must be a non-empty string.`);
  }

  const options = Array.isArray(value.options) ? value.options.map(validateOption) : [];
  const validOptions = options.filter((option): option is QuestionOption => option !== null);

  if (!Array.isArray(value.options) || validOptions.length !== value.options.length || validOptions.length < 2) {
    errors.push(`${label}: options must include at least two valid options with id and text.`);
  }

  if (!isStringArray(value.correctOptionIds) || value.correctOptionIds.length === 0) {
    errors.push(`${label}: correctOptionIds must be a non-empty string array.`);
  }

  const optionIds = new Set(validOptions.map((option) => option.id));
  const correctOptionIds = isStringArray(value.correctOptionIds) ? value.correctOptionIds : [];
  const missingCorrectIds = correctOptionIds.filter((optionId) => !optionIds.has(optionId));

  if (missingCorrectIds.length > 0) {
    errors.push(`${label}: every correctOptionId must match an option id.`);
  }

  if (value.type === "single" && correctOptionIds.length !== 1) {
    errors.push(`${label}: single choice questions must have exactly one correct option.`);
  }

  if (!isNonEmptyString(value.explanation)) {
    errors.push(`${label}: explanation must be a non-empty string.`);
  }

  if (errors.length > 0) {
    return { errors };
  }

  const source = value as Question;

  return {
    question: {
      ...source,
      id: value.id as string,
      domain: value.domain as ExamDomain,
      difficulty: value.difficulty as Difficulty,
      type: value.type as QuestionType,
      question: value.question as string,
      options: validOptions,
      correctOptionIds,
      explanation: value.explanation as string,
      tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string") : [],
      watchOutFor: isNonEmptyString(value.watchOutFor)
        ? value.watchOutFor
        : Array.isArray(value.watchOutFor)
          ? value.watchOutFor.filter((item): item is string => typeof item === "string")
          : undefined,
      examSignals: Array.isArray(value.examSignals)
        ? value.examSignals.filter((item): item is string => typeof item === "string")
        : undefined
    },
    errors: []
  };
}

function findDuplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  ids.forEach((id) => {
    if (seen.has(id)) {
      duplicates.add(id);
    }

    seen.add(id);
  });

  return [...duplicates];
}

export function validateQuestionImport(
  input: string,
  existingQuestions: readonly Question[],
  mode: ImportMode
): QuestionImportValidationResult {
  const emptySummary = buildQuestionBankSummary(existingQuestions);

  if (input.trim().length === 0) {
    return {
      parsed: false,
      canImport: false,
      parseError: "Input is empty.",
      totalParsedQuestions: 0,
      validQuestions: 0,
      invalidQuestions: 0,
      duplicateIds: [],
      domainCoverage: emptySummary.domainCoverage,
      examReady: emptySummary.examReady,
      questions: [],
      errors: ["Input is empty."]
    };
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(input);
  } catch {
    return {
      parsed: false,
      canImport: false,
      parseError: "Input must be valid JSON.",
      totalParsedQuestions: 0,
      validQuestions: 0,
      invalidQuestions: 0,
      duplicateIds: [],
      domainCoverage: emptySummary.domainCoverage,
      examReady: emptySummary.examReady,
      questions: [],
      errors: ["Input must be valid JSON."]
    };
  }

  if (!Array.isArray(parsedValue)) {
    return {
      parsed: true,
      canImport: false,
      parseError: "Top-level JSON value must be an array.",
      totalParsedQuestions: 0,
      validQuestions: 0,
      invalidQuestions: 0,
      duplicateIds: [],
      domainCoverage: emptySummary.domainCoverage,
      examReady: emptySummary.examReady,
      questions: [],
      errors: ["Top-level JSON value must be an array."]
    };
  }

  const normalized = parsedValue.map(normalizeQuestion);
  const questions = normalized.flatMap((item) => (item.question ? [item.question] : []));
  const errors = normalized.flatMap((item) => item.errors);
  const rawIds = parsedValue.flatMap((item) => (isRecord(item) && typeof item.id === "string" ? [item.id] : []));
  const importDuplicateIds = findDuplicateIds(rawIds);
  const existingIds = new Set(existingQuestions.map((question) => question.id));
  const existingDuplicateIds = mode === "append" ? questions.filter((question) => existingIds.has(question.id)).map((question) => question.id) : [];
  const duplicateIds = [...new Set([...importDuplicateIds, ...existingDuplicateIds])];
  const invalidQuestions = parsedValue.length - questions.length;
  const resultingQuestions = mode === "append" ? [...existingQuestions, ...questions] : questions;
  const summary = buildQuestionBankSummary(resultingQuestions);

  return {
    parsed: true,
    canImport: errors.length === 0 && duplicateIds.length === 0 && questions.length > 0,
    totalParsedQuestions: parsedValue.length,
    validQuestions: questions.length,
    invalidQuestions,
    duplicateIds,
    domainCoverage: summary.domainCoverage,
    examReady: summary.examReady,
    questions,
    errors
  };
}

/*
Sample valid import item:
[
  {
    "id": "sample-ace-001",
    "domain": "setup_environment",
    "difficulty": "easy",
    "type": "single",
    "question": "Which Google Cloud tool is commonly used to initialize local CLI access?",
    "options": [
      { "id": "a", "text": "gcloud init" },
      { "id": "b", "text": "kubectl apply" }
    ],
    "correctOptionIds": ["a"],
    "explanation": "gcloud init initializes the Google Cloud CLI configuration for local use."
  }
]
*/

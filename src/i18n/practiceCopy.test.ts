import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import test, { before } from "node:test";
import * as ts from "typescript";

import { contentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";
import type { DurableOperationError, PracticeDurableOperationState } from "../application/trainingLifecycle";
import { getTrackDisplays } from "../domain";
import { buildPracticeModes } from "../features/practice/practiceFlowModel";
import {
  getPracticePrimaryAction,
  noticeForPracticeCompletionCheckpoint,
  noticeForPracticeOperation,
  practiceOptionCorrectnessValue,
  type PracticeOptionState,
  type PracticeSurfacePhase,
} from "../features/practice/practiceSessionPresentation";

type Locale = "en" | "pl";
type TranslationDictionary = Readonly<Record<string, unknown>>;

const locales = ["en", "pl"] as const;
const dictionaries: Readonly<Record<Locale, TranslationDictionary>> = {
  en: JSON.parse(readFileSync(resolve("src/locales/en/common.json"), "utf8")) as TranslationDictionary,
  pl: JSON.parse(readFileSync(resolve("src/locales/pl/common.json"), "utf8")) as TranslationDictionary,
};

function assertTranslationKey(key: string, context: string): void {
  for (const locale of locales) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(dictionaries[locale], key),
      `${locale} is missing ${JSON.stringify(key)} (${context})`,
    );
  }
}

function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return collectTsxFiles(entryPath);
    return entry.name.endsWith(".tsx") ? [entryPath] : [];
  });
}

function collectFirstArgumentTranslationKeys(source: string): string[] {
  const file = ts.createSourceFile("translation-scan.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const keys = new Set<string>();

  function collectLiteral(expression: ts.Expression): void {
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
      keys.add(expression.text);
      return;
    }
    if (ts.isParenthesizedExpression(expression)) {
      collectLiteral(expression.expression);
      return;
    }
    if (ts.isConditionalExpression(expression)) {
      collectLiteral(expression.whenTrue);
      collectLiteral(expression.whenFalse);
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t") {
      const firstArgument = node.arguments[0];
      if (firstArgument) collectLiteral(firstArgument);
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  return [...keys].sort();
}

const practiceSources = [
  ...collectTsxFiles(resolve("src/features/practice")),
  resolve("src/components/SessionResultOverview.tsx"),
  resolve("src/features/reports/ContentReportSheet.tsx"),
  resolve("src/features/exam/ResultScreen.tsx"),
  resolve("src/features/exam/ExamReviewScreen.tsx"),
  resolve("src/features/coding-interview/session/SessionShell.tsx"),
].sort();

const operationError = (
  allowedAction: DurableOperationError["allowedAction"],
  operation: DurableOperationError["operation"],
): DurableOperationError => ({
  operation,
  durableState: "journal_durable",
  retrySafety: "recovery_only",
  allowedAction,
  prohibitedFallback: "No fallback.",
});

const practiceOperations = [
  { family: "practice", kind: "unanswered" },
  { family: "practice", kind: "submitting_before_journal" },
  { family: "practice", kind: "submit_journal_failed", error: operationError("submit_again", "practice_submit") },
  { family: "practice", kind: "commit_pending", error: operationError("recover", "practice_submit") },
  { family: "practice", kind: "commit_materialization_failed", error: operationError("recover", "practice_submit") },
  { family: "practice", kind: "commit_verification_failed", error: operationError("recover", "practice_submit") },
  { family: "practice", kind: "verified_pending_clear", error: operationError("recover", "practice_submit") },
  { family: "practice", kind: "recovery_required", error: operationError("recover", "practice_resume") },
  { family: "practice", kind: "feedback" },
  { family: "practice", kind: "advancing" },
  { family: "practice", kind: "advance_failed", error: operationError("retry_same_command", "practice_advance") },
  { family: "practice", kind: "completing" },
  { family: "practice", kind: "completion_failed", error: operationError("recover", "practice_complete") },
  { family: "practice", kind: "completion_failed", error: operationError("retry_same_command", "practice_complete") },
  { family: "practice", kind: "completed" },
  { family: "practice", kind: "abandoning" },
  { family: "practice", kind: "abandonment_failed_before_journal", error: operationError("return_to_summary", "practice_abandon") },
  { family: "practice", kind: "abandonment_recovery_required", error: operationError("none", "practice_abandon") },
  { family: "practice", kind: "abandoned" },
] satisfies readonly PracticeDurableOperationState[];

const practicePhases = [
  "preparing", "unanswered", "submitting_before_journal", "submit_journal_failed",
  "commit_pending", "commit_materialization_failed", "commit_verification_failed",
  "verified_pending_clear", "recovery_required", "feedback", "advancing", "advance_failed",
  "completing", "completion_failed", "completed", "abandoning", "abandonment_failed_before_journal",
  "abandonment_recovery_required", "abandoned",
] as const satisfies readonly PracticeSurfacePhase[];

const feedbackTimings = ["afterEachAnswer", "atSessionEnd"] as const;

before(async () => { await contentPackageRuntimeOwner.verifyBundledPackages(); });

test("translation AST collection stays on literal first arguments", () => {
  assert.deepEqual(
    collectFirstArgumentTranslationKeys(`
      const branch = t(condition ? "True branch" : ("False branch"), { defaultValue: "Ignore this option" });
      const authored = t(question.prompt);
      const interpolated = t(\`Authored text \${question.prompt}\`);
    `),
    ["False branch", "True branch"],
  );
});

test("scoped Practice, result, review, and session-shell literals exist in both locales", () => {
  const sourcesByKey = new Map<string, string[]>();
  for (const sourcePath of practiceSources) {
    for (const key of collectFirstArgumentTranslationKeys(readFileSync(sourcePath, "utf8"))) {
      sourcesByKey.set(key, [...(sourcesByKey.get(key) ?? []), sourcePath]);
    }
  }
  for (const [key, sources] of sourcesByKey) assertTranslationKey(key, sources.join(", "));
});

test("practice presentation output strings are keys in both locales", () => {
  for (const operation of practiceOperations) {
    const notice = noticeForPracticeOperation(operation);
    if (notice) assertTranslationKey(notice.message, `noticeForPracticeOperation:${operation.kind}`);
  }
  for (const kind of ["recover", "retry"] as const) {
    assertTranslationKey(noticeForPracticeCompletionCheckpoint(kind).message, `completionCheckpoint:${kind}`);
  }
  for (const state of ["neutral", "selected", "correct", "incorrect", "omitted_correct"] as const satisfies readonly PracticeOptionState[]) {
    const correctness = practiceOptionCorrectnessValue(state);
    if (correctness) assertTranslationKey(correctness, `practiceOptionCorrectnessValue:${state}`);
  }
  for (const feedbackTiming of feedbackTimings) {
    for (const phase of practicePhases) {
      for (const hasLocalResponse of [false, true]) {
        for (const isFinalPosition of [false, true]) {
          const action = getPracticePrimaryAction({ hasLocalResponse, isFinalPosition, phase, feedbackTiming });
          if (action) assertTranslationKey(action.label, `getPracticePrimaryAction:${phase}:${feedbackTiming}`);
        }
      }
    }
  }
});

test("admitted practice mode titles, details, and unavailable reasons are locale keys", () => {
  for (const track of getTrackDisplays()) {
    for (const mode of buildPracticeModes(track)) {
      const context = `${track.id}:${mode.mode}`;
      assertTranslationKey(mode.title, `${context}:title`);
      if (mode.detail) assertTranslationKey(mode.detail, `${context}:detail`);
      if (mode.unavailableReason) assertTranslationKey(mode.unavailableReason, `${context}:unavailableReason`);
    }
  }
});

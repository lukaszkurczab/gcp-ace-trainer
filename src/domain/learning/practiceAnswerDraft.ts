import type { AttemptResult, AttemptResultKind } from "./attemptResult";

/**
 * T2.2 (optimistic practice feedback, Plan D6 = (a) "draft before render").
 *
 * The grade shown before the practice command commits comes from the same
 * pure evaluation the command uses (`TrainingInteractionPort.evaluate` of the
 * exact pinned question). This module only reduces that evaluation to the
 * shown grade and owns the durable answer draft codec; it does no I/O.
 */
export type PracticeAnswerGrade = Readonly<{ kind: AttemptResultKind; earnedPoints: number; maxPoints: number }>;

/** The evaluation shape returned by `TrainingInteractionPort.evaluate`. */
export type PracticeAnswerEvaluation = Readonly<{ complete: boolean; result: AttemptResult | null }>;

/** Null when the response is incomplete or invalid: the command rejects it, so nothing may be shown. */
export function gradePracticeAnswer(evaluation: PracticeAnswerEvaluation): PracticeAnswerGrade | null {
  if (!evaluation.complete || !evaluation.result) return null;
  return toPracticeAnswerGrade(evaluation.result);
}

export function toPracticeAnswerGrade(result: Pick<AttemptResult, "kind" | "earnedPoints" | "maxPoints">): PracticeAnswerGrade {
  return Object.freeze({ kind: result.kind, earnedPoints: result.earnedPoints, maxPoints: result.maxPoints });
}

export function samePracticeAnswerGrade(left: PracticeAnswerGrade, right: PracticeAnswerGrade): boolean {
  return left.kind === right.kind && left.earnedPoints === right.earnedPoints && left.maxPoints === right.maxPoints;
}

/** The exact occurrence an answer belongs to; a draft never applies to any other. */
export type PracticeAnswerTarget = Readonly<{
  sessionId: string;
  occurrenceId: string;
  questionId: string;
  contentVersion: string;
  artifactSha256: string;
}>;

/**
 * Durable record of a submitted answer whose feedback is already on screen
 * but whose practice command has not committed yet. `response` is the
 * command input (UI-level response), replayed through the same command.
 */
export type PracticeAnswerDraft = Readonly<{
  schema: 1;
  target: PracticeAnswerTarget;
  response: PracticeAnswerDraftValue;
  grade: PracticeAnswerGrade;
  capturedAt: string;
}>;

export type PracticeAnswerDraftValue =
  | null
  | boolean
  | number
  | string
  | readonly PracticeAnswerDraftValue[]
  | Readonly<{ [key: string]: PracticeAnswerDraftValue }>;

const RESULT_KINDS: readonly AttemptResultKind[] = ["correct", "partial", "incorrect"];
const TARGET_KEYS = ["sessionId", "occurrenceId", "questionId", "contentVersion", "artifactSha256"] as const;

export function createPracticeAnswerDraft(input: Readonly<{ target: PracticeAnswerTarget; response: unknown; grade: PracticeAnswerGrade; capturedAt: string }>): PracticeAnswerDraft {
  const response = JSON.parse(JSON.stringify(input.response)) as unknown;
  if (!isDraftValue(response) || response === null || typeof response !== "object" || Array.isArray(response)) throw new Error("A practice answer draft requires a JSON object response.");
  const draft = { schema: 1 as const, target: Object.freeze(pickTarget(input.target)), response: deepFreeze(response), grade: toPracticeAnswerGrade(input.grade), capturedAt: input.capturedAt };
  if (!isPracticeAnswerDraft(draft)) throw new Error("The practice answer draft is invalid.");
  return Object.freeze(draft);
}

export function encodePracticeAnswerDraft(draft: PracticeAnswerDraft): string {
  return JSON.stringify(draft);
}

/** Strict: anything that is not exactly a v1 draft is treated as absent (and removed by the owner). */
export function decodePracticeAnswerDraft(raw: string | undefined | null): PracticeAnswerDraft | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  if (!isPracticeAnswerDraft(parsed)) return null;
  return deepFreeze(parsed) as PracticeAnswerDraft;
}

export function practiceAnswerDraftMatches(draft: PracticeAnswerDraft, target: PracticeAnswerTarget): boolean {
  return TARGET_KEYS.every((key) => draft.target[key] === target[key]);
}

function isPracticeAnswerDraft(value: unknown): value is PracticeAnswerDraft {
  if (!isPlainObject(value) || !hasExactKeys(value, ["schema", "target", "response", "grade", "capturedAt"])) return false;
  if (value.schema !== 1 || typeof value.capturedAt !== "string" || !Number.isFinite(Date.parse(value.capturedAt))) return false;
  const target = value.target;
  if (!isPlainObject(target) || !hasExactKeys(target, TARGET_KEYS) || TARGET_KEYS.some((key) => typeof target[key] !== "string" || (target[key] as string).length === 0)) return false;
  const grade = value.grade;
  if (!isPlainObject(grade) || !hasExactKeys(grade, ["kind", "earnedPoints", "maxPoints"])) return false;
  if (!RESULT_KINDS.includes(grade.kind as AttemptResultKind) || !isFiniteNumber(grade.earnedPoints) || !isFiniteNumber(grade.maxPoints)) return false;
  if (grade.maxPoints <= 0 || grade.earnedPoints < 0 || grade.earnedPoints > grade.maxPoints) return false;
  return isPlainObject(value.response) && isDraftValue(value.response);
}

function pickTarget(target: PracticeAnswerTarget): PracticeAnswerTarget {
  return { sessionId: target.sessionId, occurrenceId: target.occurrenceId, questionId: target.questionId, contentVersion: target.contentVersion, artifactSha256: target.artifactSha256 };
}

function isDraftValue(value: unknown): value is PracticeAnswerDraftValue {
  if (value === null || typeof value === "boolean" || typeof value === "string") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isDraftValue);
  return isPlainObject(value) && Object.values(value).every(isDraftValue);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const own = Object.keys(value);
  return own.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

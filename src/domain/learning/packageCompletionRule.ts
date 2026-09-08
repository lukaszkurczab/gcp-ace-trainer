import type { ContentPackagePin } from "./contentPackagePin";
import { contentPackagePinsEqual, createContentPackagePin } from "./contentPackagePin";
import type { TrainingAttempt } from "./trainingAttempt";
import { createTrainingAttempt } from "./trainingAttempt";
import { createAttemptResult } from "./attemptResult";

export type PackageCompletionRuleV1 = Readonly<{
  ruleVersion: 1;
  minimumAttemptCount: number;
  rollingWindowSize: number;
  qualityThreshold: number;
}>;

export type VerifiedPackageCompletionProfile = Readonly<{
  trackId: string;
  contentVersion: string;
  packagePin: ContentPackagePin;
  completionRule?: PackageCompletionRuleV1;
}>;

export type PackageCompletionState =
  | Readonly<{ kind: "unknown" }>
  | Readonly<{ kind: "in_progress"; qualifyingAttemptCount: number; requiredAttemptCount: number; rollingWindowSize: number }>
  | Readonly<{ kind: "completed"; qualifyingAttemptCount: number; rollingWindowSize: number; quality: number }>;

export function createPackageCompletionRuleV1(value: unknown): PackageCompletionRuleV1 {
  if (!isRecord(value) || !exactKeys(value, ["ruleVersion", "minimumAttemptCount", "rollingWindowSize", "qualityThreshold"]) || value.ruleVersion !== 1 || !positiveInteger(value.minimumAttemptCount) || !positiveInteger(value.rollingWindowSize) || value.minimumAttemptCount < value.rollingWindowSize || typeof value.qualityThreshold !== "number" || !Number.isFinite(value.qualityThreshold) || value.qualityThreshold < 0 || value.qualityThreshold > 1) {
    throw new Error("Package completion rule v1 is invalid.");
  }
  return Object.freeze({ ruleVersion: 1, minimumAttemptCount: value.minimumAttemptCount, rollingWindowSize: value.rollingWindowSize, qualityThreshold: value.qualityThreshold });
}

export function evaluatePackageCompletion(profile: VerifiedPackageCompletionProfile, attempts: readonly TrainingAttempt<unknown>[]): PackageCompletionState {
  const rule = profile.completionRule;
  if (rule === undefined) return Object.freeze({ kind: "unknown" });
  createPackageCompletionRuleV1(rule);
  const byId = new Map<string, TrainingAttempt<unknown>>();
  for (const attempt of attempts) {
    assertDurableAttempt(attempt);
    const previous = byId.get(attempt.id);
    if (previous !== undefined && JSON.stringify(previous) !== JSON.stringify(attempt)) throw new Error(`Conflicting durable attempts share id ${attempt.id}.`);
    byId.set(attempt.id, attempt);
  }
  const qualifying = [...byId.values()].filter((attempt) => attempt.trackId === profile.trackId && attempt.item.trackId === profile.trackId && attempt.item.contentVersion === profile.contentVersion && contentPackagePinsEqual(attempt.item.packagePin, profile.packagePin)).sort((left, right) => left.answeredAt.localeCompare(right.answeredAt) || left.id.localeCompare(right.id));
  if (qualifying.length < rule.minimumAttemptCount || qualifying.length < rule.rollingWindowSize) return Object.freeze({ kind: "in_progress", qualifyingAttemptCount: qualifying.length, requiredAttemptCount: rule.minimumAttemptCount, rollingWindowSize: rule.rollingWindowSize });
  const window = qualifying.slice(-rule.rollingWindowSize);
  const quality = window.filter((attempt) => attempt.result.kind === "correct").length / rule.rollingWindowSize;
  return quality >= rule.qualityThreshold
    ? Object.freeze({ kind: "completed", qualifyingAttemptCount: qualifying.length, rollingWindowSize: rule.rollingWindowSize, quality })
    : Object.freeze({ kind: "in_progress", qualifyingAttemptCount: qualifying.length, requiredAttemptCount: rule.minimumAttemptCount, rollingWindowSize: rule.rollingWindowSize });
}

function assertDurableAttempt(attempt: TrainingAttempt<unknown>): void {
  if (!attempt || typeof attempt.id !== "string" || !attempt.id.trim() || typeof attempt.sessionId !== "string" || !attempt.sessionId.trim() || typeof attempt.modeId !== "string" || !attempt.modeId.trim() || typeof attempt.occurrenceId !== "string" || !attempt.occurrenceId.trim() || typeof attempt.trackId !== "string" || !attempt.trackId.trim() || !attempt.item || typeof attempt.item.itemId !== "string" || !attempt.item.itemId.trim() || typeof attempt.item.trackId !== "string" || typeof attempt.item.contentVersion !== "string" || !attempt.item.trackId.trim() || !attempt.item.contentVersion.trim() || !attempt.item.packagePin || !validIsoInstant(attempt.answeredAt) || !validIsoInstant(attempt.committedAt) || !attempt.result) throw new Error("Durable training attempt is invalid for completion evaluation.");
  try { createContentPackagePin(attempt.item.packagePin); createAttemptResult(attempt.result); createTrainingAttempt(attempt); } catch { throw new Error("Durable training attempt is invalid for completion evaluation."); }
}

function validIsoInstant(value: unknown): value is string { if (typeof value !== "string") return false; const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/u.exec(value); if (!match) return false; const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]); const hour = Number(match[4]); const minute = Number(match[5]); const second = Number(match[6]); const millisecond = Number(match[7]); const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second && date.getUTCMilliseconds() === millisecond; }
function positiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { const actual = Object.keys(value); return actual.length === keys.length && actual.every((key) => keys.includes(key)); }

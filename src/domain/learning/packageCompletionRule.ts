import type { TrainingAttempt } from "./trainingAttempt";
import { createTrainingAttempt } from "./trainingAttempt";
import { createAttemptResult } from "./attemptResult";
import { createArtifactSha256 } from "./contentItemRef";
import { isResolvedContentRef } from "./resolvedContentRef";

export type ChapterCompletionRequirement = Readonly<{
  nodeId: string;
  mentalUnitCount: number;
  minimumAttemptCount: number;
  rollingWindowSize: 20;
  qualityThreshold: 0.8;
}>;

export type PackageCompletionRuleV2 = Readonly<{
  ruleVersion: 2;
  chapters: readonly ChapterCompletionRequirement[];
}>;

export type CompletionQuestionIdentity = Readonly<{ nodeId: string; mentalUnitId: string }>;

export type VerifiedPackageCompletionProfile = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  completionRule?: PackageCompletionRuleV2;
}>;

export type ChapterCompletionStatus = Readonly<{
  nodeId: string;
  mentalUnitCount: number;
  qualifyingAttemptCount: number;
  requiredAttemptCount: number;
  rollingWindowSize: 20;
  qualityThreshold: 0.8;
  quality: number | null;
  status: "in_progress" | "completed";
  reason: "minimum_attempts_unmet" | "quality_unmet" | null;
}>;

export type PackageCompletionState =
  | Readonly<{ kind: "unknown" }>
  | Readonly<{
      kind: "in_progress";
      chapters: readonly ChapterCompletionStatus[];
      completedChapterCount: number;
      requiredChapterCount: number;
      qualifyingAttemptCount: number;
      requiredAttemptCount: number;
      remainingAttemptCount: number;
    }>
  | Readonly<{
      kind: "completed";
      chapters: readonly ChapterCompletionStatus[];
      completedChapterCount: number;
      requiredChapterCount: number;
      qualifyingAttemptCount: number;
      requiredAttemptCount: number;
      remainingAttemptCount: 0;
    }>;

const CHAPTER_WINDOW = 20 as const;
const CHAPTER_QUALITY = 0.8 as const;

export function createPackageCompletionRuleV2(value: unknown): PackageCompletionRuleV2 {
  if (!isRecord(value) || !exactKeys(value, ["ruleVersion", "chapters"]) || value.ruleVersion !== 2 || !Array.isArray(value.chapters) || value.chapters.length === 0) {
    throw new Error("Package completion rule v2 is invalid.");
  }
  const seen = new Set<string>();
  const chapters = value.chapters.map((candidate) => {
    if (!isRecord(candidate) || !exactKeys(candidate, ["nodeId", "mentalUnitCount", "minimumAttemptCount", "rollingWindowSize", "qualityThreshold"]) ||
      typeof candidate.nodeId !== "string" || !candidate.nodeId.trim() || !positiveInteger(candidate.mentalUnitCount) ||
      !positiveInteger(candidate.minimumAttemptCount) || candidate.rollingWindowSize !== CHAPTER_WINDOW || candidate.qualityThreshold !== CHAPTER_QUALITY) {
      throw new Error("Package completion rule v2 chapter is invalid.");
    }
    const expectedMinimum = minimumAttemptsForMentalUnits(candidate.mentalUnitCount);
    if (candidate.minimumAttemptCount !== expectedMinimum || seen.has(candidate.nodeId)) throw new Error("Package completion rule v2 chapter identity or minimum is invalid.");
    seen.add(candidate.nodeId);
    return Object.freeze({
      nodeId: candidate.nodeId,
      mentalUnitCount: candidate.mentalUnitCount,
      minimumAttemptCount: candidate.minimumAttemptCount,
      rollingWindowSize: CHAPTER_WINDOW,
      qualityThreshold: CHAPTER_QUALITY,
    });
  });
  const totalMinimum = chapters.reduce((total, chapter) => total + chapter.minimumAttemptCount, 0);
  if (!Number.isSafeInteger(totalMinimum)) throw new Error("Package chapter minimum total exceeds the safe integer range.");
  return Object.freeze({ ruleVersion: 2, chapters: Object.freeze(chapters) });
}

export function minimumAttemptsForMentalUnits(mentalUnitCount: number): number {
  if (!positiveInteger(mentalUnitCount)) throw new Error("Chapter mental-unit count must be a positive safe integer.");
  const required = Math.max(CHAPTER_WINDOW, Math.ceil((4 * mentalUnitCount) / CHAPTER_WINDOW) * CHAPTER_WINDOW);
  if (!Number.isSafeInteger(required)) throw new Error("Chapter minimum attempt count exceeds the safe integer range.");
  return required;
}

/** Validates the explicit rule inventory against every question in the exact artifact. */
export function assertPackageCompletionRuleMatchesQuestions(rule: PackageCompletionRuleV2, questions: readonly CompletionQuestionIdentity[]): void {
  const parsed = createPackageCompletionRuleV2(rule);
  if (!Array.isArray(questions) || questions.length === 0) throw new Error("Package completion artifact question inventory is empty.");
  const unitsByNode = new Map<string, Set<string>>();
  for (const question of questions) {
    if (!question || typeof question.nodeId !== "string" || !question.nodeId.trim() || typeof question.mentalUnitId !== "string" || !question.mentalUnitId.trim()) {
      throw new Error("Package completion artifact question identity is invalid.");
    }
    const units = unitsByNode.get(question.nodeId) ?? new Set<string>();
    units.add(question.mentalUnitId);
    unitsByNode.set(question.nodeId, units);
  }
  if (unitsByNode.size !== parsed.chapters.length) throw new Error("Package completion rule does not declare the complete artifact node inventory.");
  for (const chapter of parsed.chapters) {
    const units = unitsByNode.get(chapter.nodeId);
    if (!units || units.size !== chapter.mentalUnitCount) throw new Error("Package completion rule chapter differs from the complete artifact question inventory.");
  }
}

export function evaluatePackageCompletion(
  profile: VerifiedPackageCompletionProfile,
  attempts: readonly TrainingAttempt<unknown>[],
  resolveQuestion: (questionId: string) => CompletionQuestionIdentity | undefined,
): PackageCompletionState {
  const rule = profile.completionRule;
  if (rule === undefined) return Object.freeze({ kind: "unknown" });
  const validRule = createPackageCompletionRuleV2(rule);
  const requirementsByNode = new Map(validRule.chapters.map((chapter) => [chapter.nodeId, chapter]));
  const attemptsByNode = new Map(validRule.chapters.map((chapter) => [chapter.nodeId, [] as TrainingAttempt<unknown>[]]));
  for (const attempt of qualifyPackageAttempts(profile, attempts)) {
    const question = resolveQuestion(attempt.item.questionId);
    if (!question) throw new Error("Qualified completion attempt is absent from its verified package.");
    const bucket = attemptsByNode.get(question.nodeId);
    if (!bucket || !requirementsByNode.has(question.nodeId)) throw new Error("Qualified completion attempt resolves to a node outside the completion inventory.");
    bucket.push(attempt);
  }
  const chapters = validRule.chapters.map((requirement): ChapterCompletionStatus => {
    const chapterAttempts = attemptsByNode.get(requirement.nodeId)!;
    const qualifyingAttemptCount = chapterAttempts.length;
    const commonChapter = { nodeId: requirement.nodeId, mentalUnitCount: requirement.mentalUnitCount, qualifyingAttemptCount, requiredAttemptCount: requirement.minimumAttemptCount, rollingWindowSize: CHAPTER_WINDOW, qualityThreshold: CHAPTER_QUALITY };
    if (qualifyingAttemptCount < requirement.minimumAttemptCount) return Object.freeze({
      ...commonChapter,
      quality: null, status: "in_progress", reason: "minimum_attempts_unmet",
    });
    const window = chapterAttempts.slice(-requirement.rollingWindowSize);
    const quality = window.filter((attempt) => attempt.result.kind === "correct").length / requirement.rollingWindowSize;
    return quality >= requirement.qualityThreshold
      ? Object.freeze({ ...commonChapter, quality, status: "completed", reason: null })
      : Object.freeze({ ...commonChapter, quality, status: "in_progress", reason: "quality_unmet" });
  });
  const completedChapterCount = chapters.filter((chapter) => chapter.status === "completed").length;
  const requiredChapterCount = chapters.length;
  const qualifyingAttemptCount = chapters.reduce((total, chapter) => total + chapter.qualifyingAttemptCount, 0);
  const requiredAttemptCount = chapters.reduce((total, chapter) => total + chapter.requiredAttemptCount, 0);
  const remainingAttemptCount = chapters.reduce((total, chapter) => total + Math.max(0, chapter.requiredAttemptCount - chapter.qualifyingAttemptCount), 0);
  const common = { chapters: Object.freeze(chapters), completedChapterCount, requiredChapterCount, qualifyingAttemptCount, requiredAttemptCount };
  return completedChapterCount === requiredChapterCount
    ? Object.freeze({ kind: "completed", ...common, remainingAttemptCount: 0 })
    : Object.freeze({ kind: "in_progress", ...common, remainingAttemptCount });
}

/** Exact package qualification shared by completion and its application evidence projection. */
export function qualifyPackageAttempts(profile: VerifiedPackageCompletionProfile, attempts: readonly TrainingAttempt<unknown>[]): readonly TrainingAttempt<unknown>[] {
  if (typeof profile.trackId !== "string" || !profile.trackId.trim() || typeof profile.contentVersion !== "string" || !profile.contentVersion.trim()) {
    throw new Error("Package completion profile content identity is invalid.");
  }
  createArtifactSha256(profile.artifactSha256);
  const byId = new Map<string, TrainingAttempt<unknown>>();
  for (const attempt of attempts) {
    assertDurableAttempt(attempt);
    const previous = byId.get(attempt.id);
    if (previous !== undefined && JSON.stringify(previous) !== JSON.stringify(attempt)) throw new Error(`Conflicting durable attempts share id ${attempt.id}.`);
    byId.set(attempt.id, attempt);
  }
  return Object.freeze([...byId.values()].filter((attempt) => attempt.trackId === profile.trackId && isResolvedContentRef(attempt.item) && attempt.item.trackId === profile.trackId && attempt.item.contentVersion === profile.contentVersion && attempt.item.artifactSha256 === profile.artifactSha256).sort((left, right) => left.answeredAt.localeCompare(right.answeredAt) || left.id.localeCompare(right.id)));
}

function assertDurableAttempt(attempt: TrainingAttempt<unknown>): void {
  if (!attempt || typeof attempt.id !== "string" || !attempt.id.trim() || typeof attempt.sessionId !== "string" || !attempt.sessionId.trim() || typeof attempt.modeId !== "string" || !attempt.modeId.trim() || typeof attempt.occurrenceId !== "string" || !attempt.occurrenceId.trim() || typeof attempt.trackId !== "string" || !attempt.trackId.trim() || !isResolvedContentRef(attempt.item) || !validIsoInstant(attempt.answeredAt) || !validIsoInstant(attempt.committedAt) || !attempt.result) throw new Error("Durable training attempt is invalid for completion evaluation.");
  try { createArtifactSha256(attempt.item.artifactSha256); createAttemptResult(attempt.result); createTrainingAttempt(attempt); } catch { throw new Error("Durable training attempt is invalid for completion evaluation."); }
}

function validIsoInstant(value: unknown): value is string { if (typeof value !== "string") return false; const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/u.exec(value); if (!match) return false; const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]); const hour = Number(match[4]); const minute = Number(match[5]); const second = Number(match[6]); const millisecond = Number(match[7]); const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second && date.getUTCMilliseconds() === millisecond; }
function positiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { const actual = Object.keys(value); return actual.length === keys.length && actual.every((key) => keys.includes(key)); }

import type { TrainingAttempt } from "./trainingAttempt";
import { createTrainingAttempt } from "./trainingAttempt";
import { createAttemptResult } from "./attemptResult";
import { createArtifactSha256 } from "./contentItemRef";
import { isResolvedContentRef } from "./resolvedContentRef";

export type ChapterCompletionRequirementV2 = Readonly<{
  nodeId: string;
  mentalUnitCount: number;
  minimumAttemptCount: number;
  rollingWindowSize: 20;
  qualityThreshold: 0.8;
}>;

export type PackageCompletionRuleV2 = Readonly<{
  ruleVersion: 2;
  chapters: readonly ChapterCompletionRequirementV2[];
}>;

export type UnitCoverageRequirement = Readonly<{ mentalUnitId: string; requiredCorrectQuestionCount: 4 }>;
export type ChapterCompletionRequirementV3 = ChapterCompletionRequirementV2 & Readonly<{ units: readonly UnitCoverageRequirement[] }>;
export type PackageCompletionRuleV3 = Readonly<{ ruleVersion: 3; chapters: readonly ChapterCompletionRequirementV3[] }>;
export type PackageCompletionRule = PackageCompletionRuleV2 | PackageCompletionRuleV3;
export type ChapterCompletionRequirement = ChapterCompletionRequirementV2 | ChapterCompletionRequirementV3;

export type CompletionQuestionIdentity = Readonly<{ nodeId: string; mentalUnitId: string }>;
export type CompletionQuestionInventoryIdentity = CompletionQuestionIdentity & Readonly<{ questionId: string }>;

export type VerifiedPackageCompletionProfile = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  completionRule?: PackageCompletionRule;
}>;

export type MentalUnitCompletionStatus = Readonly<{
  mentalUnitId: string;
  requiredCorrectQuestionCount: number;
  latestCorrectQuestionCount: number;
  deficit: number;
}>;

export type ChapterCompletionStatus = Readonly<{
  nodeId: string;
  mentalUnitCount: number;
  qualifyingAttemptCount: number;
  requiredAttemptCount: number;
  /** Deficit against the chapter's attempt-volume minimum. */
  remainingAttemptCount: number;
  /** Sum of per-unit distinct latest-correct-question deficits. */
  coverageDeficit: number;
  /** Lower bound: max(volume deficit, coverage deficit). */
  minimumAdditionalAttemptCount: number;
  coverage: readonly MentalUnitCompletionStatus[];
  rollingWindowSize: 20;
  qualityThreshold: 0.8;
  quality: number | null;
  qualityRequirementUnmet: boolean | null;
  status: "in_progress" | "completed";
  reason: "minimum_attempts_unmet" | "coverage_unmet" | "quality_unmet" | null;
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
      coverageDeficit: number;
      minimumAdditionalAttemptCount: number;
      remainingAttemptCount: number;
    }>
  | Readonly<{
      kind: "completed";
      chapters: readonly ChapterCompletionStatus[];
      completedChapterCount: number;
      requiredChapterCount: number;
      qualifyingAttemptCount: number;
      requiredAttemptCount: number;
      coverageDeficit: 0;
      minimumAdditionalAttemptCount: 0;
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

/** Parses the exact v3 completion contract while leaving v2 semantics intact. */
export function createPackageCompletionRuleV3(value: unknown): PackageCompletionRuleV3 {
  if (!isRecord(value) || !exactKeys(value, ["ruleVersion", "chapters"]) || value.ruleVersion !== 3 || !Array.isArray(value.chapters) || value.chapters.length === 0) {
    throw new Error("Package completion rule v3 is invalid.");
  }
  const seenNodes = new Set<string>();
  const seenMentalUnitIds = new Set<string>();
  const chapters = value.chapters.map((candidate) => {
    if (!isRecord(candidate) || !exactKeys(candidate, ["nodeId", "mentalUnitCount", "minimumAttemptCount", "rollingWindowSize", "qualityThreshold", "units"]) ||
      typeof candidate.nodeId !== "string" || !candidate.nodeId.trim() || !positiveInteger(candidate.mentalUnitCount) ||
      !positiveInteger(candidate.minimumAttemptCount) || candidate.rollingWindowSize !== CHAPTER_WINDOW || candidate.qualityThreshold !== CHAPTER_QUALITY ||
      !Array.isArray(candidate.units) || candidate.units.length !== candidate.mentalUnitCount) {
      throw new Error("Package completion rule v3 chapter is invalid.");
    }
    const seenUnits = new Set<string>();
    const units = candidate.units.map((unit) => {
      if (!isRecord(unit) || !exactKeys(unit, ["mentalUnitId", "requiredCorrectQuestionCount"]) || typeof unit.mentalUnitId !== "string" || !unit.mentalUnitId.trim() || unit.requiredCorrectQuestionCount !== 4 || seenUnits.has(unit.mentalUnitId) || seenMentalUnitIds.has(unit.mentalUnitId)) {
        throw new Error("Package completion rule v3 unit requirement is invalid.");
      }
      seenUnits.add(unit.mentalUnitId);
      seenMentalUnitIds.add(unit.mentalUnitId);
      return Object.freeze({ mentalUnitId: unit.mentalUnitId, requiredCorrectQuestionCount: 4 as const });
    });
    const expectedMinimum = minimumAttemptsForMentalUnits(candidate.mentalUnitCount);
    if (candidate.minimumAttemptCount !== expectedMinimum || seenNodes.has(candidate.nodeId)) throw new Error("Package completion rule v3 chapter identity or minimum is invalid.");
    seenNodes.add(candidate.nodeId);
    return Object.freeze({ nodeId: candidate.nodeId, mentalUnitCount: candidate.mentalUnitCount, minimumAttemptCount: candidate.minimumAttemptCount, rollingWindowSize: CHAPTER_WINDOW, qualityThreshold: CHAPTER_QUALITY, units: Object.freeze(units) });
  });
  const totalMinimum = chapters.reduce((total, chapter) => total + chapter.minimumAttemptCount, 0);
  if (!Number.isSafeInteger(totalMinimum)) throw new Error("Package chapter minimum total exceeds the safe integer range.");
  return Object.freeze({ ruleVersion: 3, chapters: Object.freeze(chapters) });
}

export function createPackageCompletionRule(value: unknown): PackageCompletionRule {
  if (isRecord(value) && value.ruleVersion === 3) return createPackageCompletionRuleV3(value);
  return createPackageCompletionRuleV2(value);
}

export function minimumAttemptsForMentalUnits(mentalUnitCount: number): number {
  if (!positiveInteger(mentalUnitCount)) throw new Error("Chapter mental-unit count must be a positive safe integer.");
  const required = Math.max(CHAPTER_WINDOW, Math.ceil((4 * mentalUnitCount) / CHAPTER_WINDOW) * CHAPTER_WINDOW);
  if (!Number.isSafeInteger(required)) throw new Error("Chapter minimum attempt count exceeds the safe integer range.");
  return required;
}

/** Validates the explicit rule inventory against every question in the exact artifact. */
export function assertPackageCompletionRuleMatchesQuestions(rule: PackageCompletionRule, questions: readonly CompletionQuestionInventoryIdentity[]): void {
  const parsed = createPackageCompletionRule(rule);
  if (!Array.isArray(questions) || questions.length === 0) throw new Error("Package completion artifact question inventory is empty.");
  const unitsByNode = new Map<string, Map<string, Set<string>>>();
  const seenQuestionIds = new Set<string>();
  for (const question of questions) {
    if (!question || typeof question.nodeId !== "string" || !question.nodeId.trim() || typeof question.mentalUnitId !== "string" || !question.mentalUnitId.trim() || typeof question.questionId !== "string" || !question.questionId.trim()) {
      throw new Error("Package completion artifact question identity is invalid.");
    }
    if (seenQuestionIds.has(question.questionId)) throw new Error("Package completion artifact question identity is duplicated.");
    seenQuestionIds.add(question.questionId);
    const units = unitsByNode.get(question.nodeId) ?? new Map<string, Set<string>>();
    const questionIds = units.get(question.mentalUnitId) ?? new Set<string>();
    questionIds.add(question.questionId);
    units.set(question.mentalUnitId, questionIds);
    unitsByNode.set(question.nodeId, units);
  }
  if (unitsByNode.size !== parsed.chapters.length) throw new Error("Package completion rule does not declare the complete artifact node inventory.");
  for (const chapter of parsed.chapters) {
    const units = unitsByNode.get(chapter.nodeId);
    if (!units || units.size !== chapter.mentalUnitCount) throw new Error("Package completion rule chapter differs from the complete artifact question inventory.");
    if (parsed.ruleVersion === 3) {
      const v3Chapter = parsed.chapters.find((candidate) => candidate.nodeId === chapter.nodeId)!;
      const requiredUnits = new Map(v3Chapter.units.map((unit) => [unit.mentalUnitId, unit.requiredCorrectQuestionCount]));
      if (requiredUnits.size !== units.size || [...requiredUnits.keys()].some((unitId) => !units.has(unitId))) throw new Error("Package completion rule v3 unit inventory differs from the complete artifact question inventory.");
      for (const [unitId, requiredCount] of requiredUnits) if ((units.get(unitId)?.size ?? 0) < requiredCount) throw new Error("Package completion rule v3 unit has fewer distinct questions than its required coverage.");
    }
  }
}

export function evaluatePackageCompletion(
  profile: VerifiedPackageCompletionProfile,
  attempts: readonly TrainingAttempt<unknown>[],
  resolveQuestion: (questionId: string) => CompletionQuestionIdentity | undefined,
): PackageCompletionState {
  const rule = profile.completionRule;
  if (rule === undefined) return Object.freeze({ kind: "unknown" });
  const validRule = createPackageCompletionRule(rule);
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
    const remainingAttemptCount = Math.max(0, requirement.minimumAttemptCount - qualifyingAttemptCount);
    const v3Requirement = validRule.ruleVersion === 3 ? validRule.chapters.find((candidate) => candidate.nodeId === requirement.nodeId) : undefined;
    const unitRequirements = v3Requirement?.units ?? [];
    const latestAttemptByQuestion = new Map<string, { question: CompletionQuestionIdentity; attempt: TrainingAttempt<unknown> }>();
    if (validRule.ruleVersion === 3) for (const attempt of chapterAttempts) {
      const question = resolveQuestion(attempt.item.questionId)!;
      const previous = latestAttemptByQuestion.get(attempt.item.questionId);
      if (!previous || compareAttempts(previous.attempt, attempt) < 0) latestAttemptByQuestion.set(attempt.item.questionId, { question, attempt });
    }
    const coverage: MentalUnitCompletionStatus[] = unitRequirements.map((unit) => {
      const latestCorrectQuestionCount = [...latestAttemptByQuestion].filter(([questionId, value]) => value.question.mentalUnitId === unit.mentalUnitId && value.attempt.result.kind === "correct" && questionId.length > 0).length;
      return Object.freeze({ mentalUnitId: unit.mentalUnitId, requiredCorrectQuestionCount: unit.requiredCorrectQuestionCount, latestCorrectQuestionCount, deficit: Math.max(0, unit.requiredCorrectQuestionCount - latestCorrectQuestionCount) });
    });
    const coverageDeficit = coverage.reduce((total, unit) => total + unit.deficit, 0);
    const minimumAdditionalAttemptCount = Math.max(remainingAttemptCount, coverageDeficit);
    const qualityAvailable = validRule.ruleVersion === 3 ? qualifyingAttemptCount >= requirement.rollingWindowSize : qualifyingAttemptCount >= requirement.minimumAttemptCount;
    const quality = qualityAvailable
      ? chapterAttempts.slice(-requirement.rollingWindowSize).filter((attempt) => attempt.result.kind === "correct").length / requirement.rollingWindowSize
      : null;
    const qualityRequirementUnmet = quality === null ? null : quality < requirement.qualityThreshold;
    const commonChapter = { nodeId: requirement.nodeId, mentalUnitCount: requirement.mentalUnitCount, qualifyingAttemptCount, requiredAttemptCount: requirement.minimumAttemptCount, remainingAttemptCount, coverageDeficit, minimumAdditionalAttemptCount, coverage: Object.freeze(coverage), rollingWindowSize: CHAPTER_WINDOW, qualityThreshold: CHAPTER_QUALITY, quality, qualityRequirementUnmet };
    if (remainingAttemptCount > 0) return Object.freeze({ ...commonChapter, status: "in_progress", reason: "minimum_attempts_unmet" });
    if (coverageDeficit > 0) return Object.freeze({ ...commonChapter, status: "in_progress", reason: "coverage_unmet" });
    if (quality === null || qualityRequirementUnmet === true) return Object.freeze({ ...commonChapter, status: "in_progress", reason: "quality_unmet" });
    return Object.freeze({ ...commonChapter, status: "completed", reason: null });
  });
  const completedChapterCount = chapters.filter((chapter) => chapter.status === "completed").length;
  const requiredChapterCount = chapters.length;
  const qualifyingAttemptCount = chapters.reduce((total, chapter) => total + chapter.qualifyingAttemptCount, 0);
  const requiredAttemptCount = chapters.reduce((total, chapter) => total + chapter.requiredAttemptCount, 0);
  const remainingAttemptCount = chapters.reduce((total, chapter) => total + Math.max(0, chapter.requiredAttemptCount - chapter.qualifyingAttemptCount), 0);
  const coverageDeficit = chapters.reduce((total, chapter) => total + chapter.coverageDeficit, 0);
  const minimumAdditionalAttemptCount = chapters.reduce((total, chapter) => total + chapter.minimumAdditionalAttemptCount, 0);
  const common = { chapters: Object.freeze(chapters), completedChapterCount, requiredChapterCount, qualifyingAttemptCount, requiredAttemptCount, coverageDeficit, minimumAdditionalAttemptCount };
  return completedChapterCount === requiredChapterCount
    ? Object.freeze({ kind: "completed", ...common, coverageDeficit: 0, minimumAdditionalAttemptCount: 0, remainingAttemptCount: 0 })
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

function compareAttempts(left: TrainingAttempt<unknown>, right: TrainingAttempt<unknown>): number {
  return left.answeredAt.localeCompare(right.answeredAt) || left.id.localeCompare(right.id);
}

function validIsoInstant(value: unknown): value is string { if (typeof value !== "string") return false; const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/u.exec(value); if (!match) return false; const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]); const hour = Number(match[4]); const minute = Number(match[5]); const second = Number(match[6]); const millisecond = Number(match[7]); const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second && date.getUTCMilliseconds() === millisecond; }
function positiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { const actual = Object.keys(value); return actual.length === keys.length && actual.every((key) => keys.includes(key)); }

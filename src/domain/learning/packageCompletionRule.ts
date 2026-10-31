import { learningUnitIdentity, learningUnitInCurrentCatalog } from "./mentalUnitEvidence";
import { isIndependentCaseAttempt } from "./caseEvidence";
import type { TrainingAttempt } from "./trainingAttempt";
import { createTrainingAttempt } from "./trainingAttempt";
import { createAttemptResult } from "./attemptResult";
import { createArtifactSha256 } from "./contentItemRef";
import { isResolvedContentRef, type ResolvedContentRef } from "./resolvedContentRef";
import { classifyTrainingAttemptMode, isApproachChallengeTrainingAttempt } from "../../tracks/coding-interview/domain/algorithmModes";

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
  completionSources?: readonly VerifiedCompletionSource[];
}>;

/** Exact, already admitted source. Historical rules never accept successor attempts. */
export type VerifiedCompletionSource = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  completionRule?: PackageCompletionRule;
  getQuestion: (questionId: string) => CompletionQuestionIdentity | undefined;
}>;
export type ChapterCompletionSource = Readonly<{
  contentVersion: string;
  artifactSha256: string;
  ruleVersion: 2 | 3;
  completedAt: string;
  attemptId: string;
}>;

export function createChapterCompletionSource(value: unknown): ChapterCompletionSource {
  if (!isRecord(value) || !exactKeys(value, ["contentVersion", "artifactSha256", "ruleVersion", "completedAt", "attemptId"]) ||
    typeof value.contentVersion !== "string" || !value.contentVersion.trim() || typeof value.attemptId !== "string" || !value.attemptId.trim() ||
    (value.ruleVersion !== 2 && value.ruleVersion !== 3) || !validIsoInstant(value.completedAt)) throw new Error("Chapter completion source is invalid.");
  createArtifactSha256(value.artifactSha256);
  return Object.freeze({ contentVersion: value.contentVersion, artifactSha256: value.artifactSha256 as string, ruleVersion: value.ruleVersion, completedAt: value.completedAt as string, attemptId: value.attemptId });
}

export type MentalUnitCompletionStatus = Readonly<{
  mentalUnitId: string;
  requiredCorrectQuestionCount: number;
  latestCorrectQuestionCount: number;
  deficit: number;
}>;

export type ChapterCompletionStatus = Readonly<{
  /** Metrics below describe the earning rule when a first completion is retained. */
  completionSource?: ChapterCompletionSource;
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
  const milestones = new Map<string, ChapterCompletionStatus>();
  const sources: readonly VerifiedCompletionSource[] = [{ ...profile, getQuestion: resolveQuestion }, ...(profile.completionSources ?? [])];
  for (const source of sources) {
    if (source.trackId !== profile.trackId) throw new Error("Completion source belongs to another track.");
    if (!source.completionRule) continue;
    const exact = { trackId: source.trackId, contentVersion: source.contentVersion, artifactSha256: source.artifactSha256, completionRule: source.completionRule };
    const projected = projectChapters(exact, qualifyPackageAttempts(exact, attempts.filter(attempt => matchesPackage(exact, attempt.item)), source.getQuestion), source.getQuestion, true);
    for (const chapter of projected) if (chapter.completionSource) {
      const previous = milestones.get(chapter.nodeId);
      const left = chapter.completionSource;
      const right = previous?.completionSource;
      const order = right ? left.completedAt.localeCompare(right.completedAt) || left.attemptId.localeCompare(right.attemptId) ||
        left.contentVersion.localeCompare(right.contentVersion) || left.artifactSha256.localeCompare(right.artifactSha256) : -1;
      if (order < 0) milestones.set(chapter.nodeId, chapter);
    }
  }
  const current = projectChapters(profile, qualifyPackageAttempts(profile, attempts, resolveQuestion), resolveQuestion, true);
  const chapters = current.map(chapter => {
    const previous = milestones.get(chapter.nodeId);
    if (!previous) return chapter;
    const now = chapter.completionSource, old = previous.completionSource!;
    return now && (now.completedAt.localeCompare(old.completedAt) || now.attemptId.localeCompare(old.attemptId)) < 0 ? chapter : previous;
  });
  const completedChapterCount = chapters.filter((chapter) => chapter.status === "completed").length;
  const requiredChapterCount = chapters.length;
  const qualifyingAttemptCount = chapters.reduce((total, chapter) => total + chapter.qualifyingAttemptCount, 0);
  const requiredAttemptCount = chapters.reduce((total, chapter) => total + chapter.requiredAttemptCount, 0);
  const remainingAttemptCount = chapters.reduce((total, chapter) => total + Math.max(0, chapter.requiredAttemptCount - chapter.qualifyingAttemptCount), 0);
  const coverageDeficit = chapters.reduce((total, chapter) => total + chapter.coverageDeficit, 0);
  const minimumAdditionalAttemptCount = chapters.reduce((total, chapter) => total + chapter.minimumAdditionalAttemptCount, 0);
  const common = { chapters: Object.freeze(chapters), completedChapterCount, requiredChapterCount, qualifyingAttemptCount, requiredAttemptCount, coverageDeficit, minimumAdditionalAttemptCount };
  // A record without saved attribution can use its exact available source only.
  // Missing historical evidence never resets known progress or invents a unit.
  const unavailableHistory = attempts.some(attempt => classifyTrainingAttemptMode(attempt.trackId, attempt.modeId) === "legacy" && isIndependentCaseAttempt(attempt) && attempt.trackId === profile.trackId && attempt.item.trackId === profile.trackId &&
    !completionAttemptIdentity(profile, attempt, resolveQuestion));
  if (completedChapterCount !== requiredChapterCount && unavailableHistory) return Object.freeze({ kind: "unknown" });
  return completedChapterCount === requiredChapterCount
    ? Object.freeze({ kind: "completed", ...common, coverageDeficit: 0, minimumAdditionalAttemptCount: 0, remainingAttemptCount: 0 })
    : Object.freeze({ kind: "in_progress", ...common, remainingAttemptCount });
}

/** One incremental reducer for live metrics and first-achievement snapshots. */
function projectChapters(
  profile: VerifiedPackageCompletionProfile,
  attempts: readonly TrainingAttempt<unknown>[],
  resolveQuestion: (questionId: string) => CompletionQuestionIdentity | undefined,
  retainFirst: boolean,
): readonly ChapterCompletionStatus[] {
  const rule = createPackageCompletionRule(profile.completionRule);
  const buckets = new Map(rule.chapters.map(requirement => [requirement.nodeId, {
    requirement, count: 0, window: [] as boolean[], latest: new Map<string, { unit: string; correct: boolean }>(),
    correctByUnit: new Map<string, number>(), milestone: undefined as ChapterCompletionStatus | undefined,
  }]));
  function snapshot(bucket: (typeof buckets extends Map<string, infer V> ? V : never)): ChapterCompletionStatus {
    const { requirement, count, window, correctByUnit } = bucket;
    const remainingAttemptCount = Math.max(0, requirement.minimumAttemptCount - count);
    const coverage = Object.freeze(("units" in requirement ? requirement.units : []).map(unit => {
      const latestCorrectQuestionCount = correctByUnit.get(unit.mentalUnitId) ?? 0;
      return Object.freeze({ ...unit, latestCorrectQuestionCount, deficit: Math.max(0, unit.requiredCorrectQuestionCount - latestCorrectQuestionCount) });
    }));
    const coverageDeficit = coverage.reduce((total, unit) => total + unit.deficit, 0);
    const quality = count >= (rule.ruleVersion === 3 ? requirement.rollingWindowSize : requirement.minimumAttemptCount)
      ? window.filter(Boolean).length / requirement.rollingWindowSize : null;
    const qualityRequirementUnmet = quality === null ? null : quality < requirement.qualityThreshold;
    const reason = remainingAttemptCount > 0 ? "minimum_attempts_unmet" : coverageDeficit > 0 ? "coverage_unmet" : quality === null || qualityRequirementUnmet ? "quality_unmet" : null;
    return Object.freeze({ nodeId: requirement.nodeId, mentalUnitCount: requirement.mentalUnitCount, qualifyingAttemptCount: count,
      requiredAttemptCount: requirement.minimumAttemptCount, remainingAttemptCount, coverageDeficit,
      minimumAdditionalAttemptCount: Math.max(remainingAttemptCount, coverageDeficit), coverage,
      rollingWindowSize: CHAPTER_WINDOW, qualityThreshold: CHAPTER_QUALITY, quality, qualityRequirementUnmet,
      status: reason === null ? "completed" : "in_progress", reason });
  }
  for (const attempt of attempts) {
    const question = completionAttemptIdentity(profile, attempt, resolveQuestion);
    if (!question) continue;
    const bucket = buckets.get(question.nodeId);
    if (!bucket || ("units" in bucket.requirement && !bucket.requirement.units.some(unit => unit.mentalUnitId === question.mentalUnitId))) continue;
    if (retainFirst && bucket.milestone) continue;
    bucket.count++;
    const correct = attempt.result.kind === "correct";
    bucket.window.push(correct);
    if (bucket.window.length > CHAPTER_WINDOW) bucket.window.shift();
    const questionKey = `${question.mentalUnitId}\0${attempt.item.questionId}`;
    const previous = bucket.latest.get(questionKey);
    if (previous?.correct) bucket.correctByUnit.set(previous.unit, (bucket.correctByUnit.get(previous.unit) ?? 0) - 1);
    bucket.latest.set(questionKey, { unit: question.mentalUnitId, correct });
    if (correct) bucket.correctByUnit.set(question.mentalUnitId, (bucket.correctByUnit.get(question.mentalUnitId) ?? 0) + 1);
    if (retainFirst && bucket.count >= bucket.requirement.minimumAttemptCount) {
      const chapter = snapshot(bucket);
      if (chapter.status === "completed") bucket.milestone = Object.freeze({ ...chapter, completionSource: createChapterCompletionSource({
        contentVersion: profile.contentVersion, artifactSha256: profile.artifactSha256, ruleVersion: rule.ruleVersion, completedAt: attempt.answeredAt, attemptId: attempt.id,
      }) });
    }
  }
  return Object.freeze([...buckets.values()].map(bucket => bucket.milestone ?? snapshot(bucket)));
}

/** Durable unit evidence spans bank versions; original records remain immutable. */
export function qualifyPackageAttempts(
  profile: VerifiedPackageCompletionProfile,
  attempts: readonly TrainingAttempt<unknown>[],
  resolveQuestion: (questionId: string) => CompletionQuestionIdentity | undefined,
): readonly TrainingAttempt<unknown>[] {
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
  return Object.freeze([...byId.values()].filter((attempt) => isIndependentCaseAttempt(attempt) && attempt.trackId === profile.trackId && attempt.item.trackId === profile.trackId && completionAttemptIdentity(profile, attempt, resolveQuestion) !== undefined).sort((left, right) => left.answeredAt.localeCompare(right.answeredAt) || left.id.localeCompare(right.id)));
}

/** Exact legacy lookup is allowed only against the record's own available package. */
export function completionAttemptIdentity(profile: VerifiedPackageCompletionProfile, attempt: TrainingAttempt<unknown>, resolveQuestion: (questionId: string) => CompletionQuestionIdentity | undefined): CompletionQuestionIdentity | undefined {
  if (classifyTrainingAttemptMode(attempt.trackId, attempt.modeId) !== "legacy") return undefined;
  const saved = learningUnitIdentity(attempt.reviewEvidence);
  if (saved) return saved;
  // Conflicting or incomplete saved attribution must not be replaced by a lookup.
  if (attempt.reviewEvidence.taxonomyOrSkillRefs.some(ref => ref.axisId === "mental_unit")) return undefined;
  if (matchesPackage(profile, attempt.item)) return learningUnitInCurrentCatalog(attempt.reviewEvidence, { ...profile, getQuestion: resolveQuestion });
  const source = profile.completionSources?.find(source => source.trackId === attempt.trackId && matchesPackage(source, attempt.item));
  return source && learningUnitInCurrentCatalog(attempt.reviewEvidence, source);
}

function matchesPackage(profile: VerifiedPackageCompletionProfile, item: ResolvedContentRef): boolean {
  return item.contentVersion === profile.contentVersion && item.artifactSha256 === profile.artifactSha256;
}

function assertDurableAttempt(attempt: TrainingAttempt<unknown>): void {
  if (!attempt || typeof attempt.id !== "string" || !attempt.id.trim() || typeof attempt.sessionId !== "string" || !attempt.sessionId.trim() || typeof attempt.modeId !== "string" || !attempt.modeId.trim() || typeof attempt.occurrenceId !== "string" || !attempt.occurrenceId.trim() || typeof attempt.trackId !== "string" || !attempt.trackId.trim() || !isResolvedContentRef(attempt.item) || !validIsoInstant(attempt.answeredAt) || !validIsoInstant(attempt.committedAt) || !attempt.result) throw new Error("Durable training attempt is invalid for completion evaluation.");
  try {
    createArtifactSha256(attempt.item.artifactSha256);
    createAttemptResult(attempt.result, { allowZeroPointPartial: isApproachChallengeTrainingAttempt(attempt.trackId, attempt.modeId) });
    createTrainingAttempt(attempt);
  } catch { throw new Error("Durable training attempt is invalid for completion evaluation."); }
}

function validIsoInstant(value: unknown): value is string { if (typeof value !== "string") return false; const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/u.exec(value); if (!match) return false; const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]); const hour = Number(match[4]); const minute = Number(match[5]); const second = Number(match[6]); const millisecond = Number(match[7]); const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second && date.getUTCMilliseconds() === millisecond; }
function positiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { const actual = Object.keys(value); return actual.length === keys.length && actual.every((key) => keys.includes(key)); }

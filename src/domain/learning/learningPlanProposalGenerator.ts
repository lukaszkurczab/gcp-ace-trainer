import type { GoalDay, GoalRecord } from "../goals/goalContracts";
import { GOAL_DAY_IDS, isGoalDay, isGoalRecordForTrack, normalizeGoalRecord } from "../goals/goalContracts";
import { projectGoalTargetDate } from "../goals/goalTargetDateSemantics";
import { createArtifactSha256 } from "./contentItemRef";
import { minimumAttemptsForMentalUnits, type ChapterCompletionStatus, type PackageCompletionState } from "./packageCompletionRule";
import { createProposalSlotId, type ProposalSlotId } from "./slotIdentity";
import type { LearningPlanExecutionPolicy, LearningPlanPolicyIdentity } from "./learningPlan";
import type { TrackId } from "./trackIdentity";

export type ProposalSessionCapacity =
  | Readonly<{ kind: "exact"; actualLength: number }>
  | Readonly<{ kind: "shortened"; actualLength: number; requestedLength: number }>
  | Readonly<{ kind: "shortfall"; requestedLength: number; eligibleItemCount: number; missingItemCount: number }>;

/** A stable, recurring local-time slot in a generated proposal. */
export type ProposalSlot = Readonly<{
  slotId: ProposalSlotId;
  day: GoalDay;
  localTime: string;
  sessionLength: number;
}>;

/** The context that must remain equal before a proposal can be consumed. */
export type ProposalIdentity = Readonly<{
  trackId: TrackId;
  /** Null means the goal is a draft and no canonical goal exists yet. */
  goalRevision: number | null;
  contentVersion: string;
  artifactSha256: string;
  planningPolicyIdentity: LearningPlanPolicyIdentity;
  timezone: string;
}>;

/** Material selection is a semantic scope, never a list of content item IDs. */
export type MaterialPriority =
  | Readonly<{ kind: "due_review" }>
  | Readonly<{ kind: "package_primary_scope"; label: string }>;

export type TargetAssessment =
  | Readonly<{ kind: "unavailable_due_to_shortfall" }>
  | Readonly<{ kind: "open_ended" }>
  | Readonly<{ kind: "unknown_completion_rule" }>
  | Readonly<{ kind: "quality_requirement_unmet" }>
  | Readonly<{
      kind: "minimum_volume_fits" | "minimum_volume_exceeds_capacity";
      occurrences: number;
      actualLength: number;
      remainingAttempts: number;
    }>;

/** All facts needed by the proposal screen and by the future coordinator. */
export type ProposalOutcome = Readonly<{
  kind: "ready" | "shortened" | "shortfall";
  identity: ProposalIdentity;
  goal: GoalRecord;
  minutesPerStudyDay: number;
  executionPolicy: LearningPlanExecutionPolicy;
  nextSession: Readonly<{ kind: "diagnosis" | "practice" | "review"; modeId: string; requestedLength: number }> |
    Readonly<{ kind: "continue_existing"; modeId: string; requestedLength: number; sessionId: string }>;
  diagnosisStatus: "scheduled" | "active" | "completed" | "abandoned" | "not_available";
  primaryModeId: string;
  requestedLength: number;
  sessionCapacity: ProposalSessionCapacity;
  completionState: PackageCompletionState;
  materialPriority: MaterialPriority;
  targetAssessment: TargetAssessment;
  slots: readonly ProposalSlot[];
}>;

/** Inputs are read-only by contract; the generator defensively clones every value it returns. */
export type GeneratorInput = Readonly<{
  goalRecord: GoalRecord;
  expectedGoalRevision: number | null;
  minutesPerStudyDay: number;
  executionPolicy: LearningPlanExecutionPolicy;
  nextSession: Readonly<{ kind: "diagnosis" | "practice" | "review"; modeId: string; requestedLength: number }> |
    Readonly<{ kind: "continue_existing"; modeId: string; requestedLength: number; sessionId: string }>;
  diagnosisStatus: "scheduled" | "active" | "completed" | "abandoned" | "not_available";
  artifactSha256: string;
  planningPolicyIdentity: LearningPlanPolicyIdentity;
  contentVersion: string;
  primaryModeId: string;
  requestedLength: number;
  sessionCapacity: ProposalSessionCapacity;
  completionState: PackageCompletionState;
  dueReviewCount: number;
  primaryScopeLabel: string;
  localToday: string;
  timezone: string;
}>;

export type InvalidLearningPlanProposalInputCode =
  | "invalid_input"
  | "invalid_goal_snapshot"
  | "invalid_track_identity"
  | "invalid_artifact_sha256"
  | "invalid_content_version"
  | "invalid_mode"
  | "invalid_requested_length"
  | "invalid_session_capacity"
  | "invalid_completion_state"
  | "invalid_due_review_count"
  | "invalid_primary_scope_label"
  | "invalid_local_today"
  | "invalid_target_date"
  | "invalid_timezone";

/** All generator validation failures use this one machine-readable error type. */
export class InvalidLearningPlanProposalInputError extends Error {
  readonly code: InvalidLearningPlanProposalInputCode;

  constructor(code: InvalidLearningPlanProposalInputCode) {
    super("Invalid learning plan proposal input.");
    this.name = "InvalidLearningPlanProposalInputError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Builds a deterministic proposal from already-resolved package and C3 facts.
 *
 * No current time, random value, locale, or device timezone is consulted. Date
 * arithmetic is performed on UTC-midnight values solely as a calendar-day
 * representation, so daylight-saving transitions cannot change the result.
 */
export function generateLearningPlanProposal(input: GeneratorInput): ProposalOutcome {
  try {
    return generate(input);
  } catch (error) {
    if (error instanceof InvalidLearningPlanProposalInputError) throw error;
    throw new InvalidLearningPlanProposalInputError("invalid_input");
  }
}

function generate(input: GeneratorInput): ProposalOutcome {
  const value = asRecord(input);
  if (!hasOnlyKeys(value, ["goalRecord", "expectedGoalRevision", "minutesPerStudyDay", "executionPolicy", "nextSession", "diagnosisStatus", "artifactSha256", "planningPolicyIdentity", "contentVersion", "primaryModeId", "requestedLength", "sessionCapacity", "completionState", "dueReviewCount", "primaryScopeLabel", "localToday", "timezone"])) fail("invalid_input");
  const goalRecord = validateGoalRecord(value.goalRecord);
  const expectedGoalRevision = value.expectedGoalRevision === null ? null : validatePositiveInteger(value.expectedGoalRevision, "invalid_goal_snapshot");
  const minutesPerStudyDay = validatePositiveInteger(value.minutesPerStudyDay, "invalid_input");
  if (minutesPerStudyDay > 1440) fail("invalid_input");
  const artifactSha256 = validateArtifactSha256(value.artifactSha256);
  const planningPolicyIdentity = validatePlanningPolicyIdentity(value.planningPolicyIdentity);
  const contentVersion = validateNonEmptyText(value.contentVersion, "invalid_content_version");
  const primaryModeId = validateNonEmptyText(value.primaryModeId, "invalid_mode");
  const requestedLength = validatePositiveInteger(value.requestedLength, "invalid_requested_length");
  const executionPolicy = validateExecutionPolicy(value.executionPolicy, primaryModeId, requestedLength);
  const nextSession = validateNextSession(value.nextSession);
  if (!(["scheduled", "active", "completed", "abandoned", "not_available"] as const).includes(value.diagnosisStatus)) fail("invalid_input");
  const diagnosisStatus = value.diagnosisStatus as ProposalOutcome["diagnosisStatus"];
  if (nextSession.kind === "diagnosis" && (executionPolicy.initialDiagnosis?.modeId !== nextSession.modeId || executionPolicy.initialDiagnosis.requestedLength !== nextSession.requestedLength)) fail("invalid_input");
  if (nextSession.kind !== "diagnosis" && nextSession.kind !== "continue_existing" && (nextSession.modeId !== executionPolicy.practice.modeId && nextSession.kind !== "review")) fail("invalid_input");
  const sessionCapacity = validateSessionCapacity(value.sessionCapacity, requestedLength);
  const completionState = validateCompletionState(value.completionState);
  const dueReviewCount = validateNonNegativeInteger(value.dueReviewCount, "invalid_due_review_count");
  const primaryScopeLabel = validateNonEmptyText(value.primaryScopeLabel, "invalid_primary_scope_label");
  const localToday = validateIsoDate(value.localToday, "invalid_local_today");
  const timezone = validateTimezone(value.timezone);

  // GoalRecord validation already checks targetDate shape. Keeping this check
  // separate gives callers one explicit code for a malformed legacy snapshot.
  const targetDateValue = goalRecord.targetDate;
  if (targetDateValue !== undefined && !isStrictIsoDate(targetDateValue)) fail("invalid_target_date");

  const identity: ProposalIdentity = Object.freeze({
    trackId: goalRecord.trackId,
    goalRevision: expectedGoalRevision,
    contentVersion,
    artifactSha256,
    planningPolicyIdentity,
    timezone,
  });

  const materialPriority: MaterialPriority = dueReviewCount > 0
    ? Object.freeze({ kind: "due_review" })
    : Object.freeze({ kind: "package_primary_scope", label: primaryScopeLabel });

  const resolution = resolveCapacity(sessionCapacity);
  const targetAssessment = buildTargetAssessment(goalRecord, completionState, localToday, resolution);
  const slots = resolution.kind === "shortfall"
    ? Object.freeze([] as readonly ProposalSlot[])
    : createSlots(goalRecord.preferredDays, resolution.actualLength);

  return Object.freeze({
    kind: sessionCapacity.kind === "shortfall" ? "shortfall" : sessionCapacity.kind === "shortened" ? "shortened" : "ready",
    identity,
    goal: Object.freeze({ ...goalRecord, preferredDays: Object.freeze([...goalRecord.preferredDays]) }),
    minutesPerStudyDay,
    executionPolicy,
    nextSession,
    diagnosisStatus,
    primaryModeId,
    requestedLength,
    sessionCapacity: cloneCapacity(sessionCapacity),
    completionState: cloneCompletionState(completionState),
    materialPriority,
    targetAssessment,
    slots,
  });
}

function validatePlanningPolicyIdentity(value: unknown): LearningPlanPolicyIdentity {
  const record = asRecord(value, "invalid_input");
  if (!hasOnlyKeys(record, ["contentVersion", "artifactSha256", "policyVersion"]) || typeof record.contentVersion !== "string" || !record.contentVersion.trim() || typeof record.policyVersion !== "string" || !record.policyVersion.trim()) fail("invalid_input");
  return Object.freeze({ contentVersion: record.contentVersion, artifactSha256: validateArtifactSha256(record.artifactSha256), policyVersion: record.policyVersion });
}

function validateExecutionPolicy(value: unknown, primaryModeId: unknown, requestedLength: unknown): LearningPlanExecutionPolicy {
  const policy = asRecord(value, "invalid_input");
  if (!hasOnlyKeys(policy, ["policyVersion", "initialDiagnosis", "practice"]) || policy.policyVersion !== "patternly-learning-execution-v1") fail("invalid_input");
  const mode = (candidate: unknown) => {
    const record = asRecord(candidate, "invalid_input");
    if (!hasOnlyKeys(record, ["modeId", "requestedLength"]) || typeof record.modeId !== "string" || !record.modeId.trim() || !positiveInteger(record.requestedLength)) fail("invalid_input");
    return Object.freeze({ modeId: record.modeId, requestedLength: record.requestedLength });
  };
  const practice = mode(policy.practice);
  const initialDiagnosis = policy.initialDiagnosis === null ? null : mode(policy.initialDiagnosis);
  if (practice.modeId !== primaryModeId || practice.requestedLength !== requestedLength) fail("invalid_input");
  return Object.freeze({ policyVersion: "patternly-learning-execution-v1", initialDiagnosis, practice });
}

function validateNextSession(value: unknown): ProposalOutcome["nextSession"] {
  const record = asRecord(value, "invalid_input");
  if (!hasOnlyKeys(record, ["kind", "modeId", "requestedLength", ...(record.kind === "continue_existing" ? ["sessionId"] : [])]) ||
    !["diagnosis", "practice", "review", "continue_existing"].includes(String(record.kind)) || typeof record.modeId !== "string" || !record.modeId.trim() || !positiveInteger(record.requestedLength)) fail("invalid_input");
  if (record.kind === "continue_existing") {
    if (typeof record.sessionId !== "string" || !record.sessionId.trim()) fail("invalid_input");
    return Object.freeze({ kind: "continue_existing", modeId: record.modeId, requestedLength: record.requestedLength, sessionId: record.sessionId });
  }
  return Object.freeze({ kind: record.kind as "diagnosis" | "practice" | "review", modeId: record.modeId, requestedLength: record.requestedLength });
}

function validateGoalRecord(value: unknown): GoalRecord {
  const record = asRecord(value, "invalid_goal_snapshot");
  if (typeof record.trackId !== "string" || !record.trackId.trim()) fail("invalid_track_identity");

  let normalized: GoalRecord;
  try {
    normalized = normalizeGoalRecord(record as GoalRecord);
  } catch {
    fail("invalid_goal_snapshot");
  }
  // The generator requires a usable normalized goal. In particular, a legacy
  // empty-day record cannot silently become a proposal with no slots.
  if (!isGoalRecordForTrack(normalized, normalized.trackId) || normalized.preferredDays.length === 0 || normalized.status !== "active") fail("invalid_goal_snapshot");
  if (normalized.preferredDays.some((day) => !isGoalDay(day))) fail("invalid_goal_snapshot");
  return normalized;
}

function validateArtifactSha256(value: unknown): string {
  try {
    return createArtifactSha256(value);
  } catch {
    fail("invalid_artifact_sha256");
  }
}

function validateSessionCapacity(value: unknown, requestedLength: number): ProposalSessionCapacity {
  const capacity = asRecord(value, "invalid_session_capacity");
  if (capacity.kind === "exact") {
    if (!hasOnlyKeys(capacity, ["kind", "actualLength"]) || !positiveInteger(capacity.actualLength) || capacity.actualLength !== requestedLength) fail("invalid_session_capacity");
    return Object.freeze({ kind: "exact", actualLength: capacity.actualLength });
  }
  if (capacity.kind === "shortened") {
    if (!hasOnlyKeys(capacity, ["kind", "actualLength", "requestedLength"]) || !positiveInteger(capacity.actualLength) || !positiveInteger(capacity.requestedLength) || capacity.requestedLength !== requestedLength || capacity.actualLength >= capacity.requestedLength) fail("invalid_session_capacity");
    return Object.freeze({ kind: "shortened", actualLength: capacity.actualLength, requestedLength: capacity.requestedLength });
  }
  if (capacity.kind === "shortfall") {
    if (!hasOnlyKeys(capacity, ["kind", "requestedLength", "eligibleItemCount", "missingItemCount"]) || !positiveInteger(capacity.requestedLength) || capacity.requestedLength !== requestedLength || !nonNegativeInteger(capacity.eligibleItemCount) || !nonNegativeInteger(capacity.missingItemCount) || capacity.eligibleItemCount >= capacity.requestedLength || capacity.missingItemCount !== capacity.requestedLength - capacity.eligibleItemCount) fail("invalid_session_capacity");
    return Object.freeze({ kind: "shortfall", requestedLength: capacity.requestedLength, eligibleItemCount: capacity.eligibleItemCount, missingItemCount: capacity.missingItemCount });
  }
  fail("invalid_session_capacity");
}

function validateCompletionState(value: unknown): PackageCompletionState {
  const completion = asRecord(value, "invalid_completion_state");
  if (completion.kind === "unknown") {
    if (!hasOnlyKeys(completion, ["kind"])) fail("invalid_completion_state");
    return Object.freeze({ kind: "unknown" });
  }
  if (completion.kind === "in_progress") {
    const chapters = validateChapterStatuses(completion.chapters);
    if (!hasOnlyKeys(completion, ["kind", "chapters", "completedChapterCount", "requiredChapterCount", "qualifyingAttemptCount", "requiredAttemptCount", "remainingAttemptCount"]) ||
      !nonNegativeInteger(completion.completedChapterCount) || !positiveInteger(completion.requiredChapterCount) ||
      completion.requiredChapterCount !== chapters.length || completion.completedChapterCount !== chapters.filter(chapter => chapter.status === "completed").length ||
      completion.completedChapterCount >= completion.requiredChapterCount || completion.qualifyingAttemptCount !== chapters.reduce((sum, chapter) => sum + chapter.qualifyingAttemptCount, 0) ||
      completion.requiredAttemptCount !== chapters.reduce((sum, chapter) => sum + chapter.requiredAttemptCount, 0) ||
      completion.remainingAttemptCount !== chapters.reduce((sum, chapter) => sum + Math.max(0, chapter.requiredAttemptCount - chapter.qualifyingAttemptCount), 0)) fail("invalid_completion_state");
    return Object.freeze({ kind: "in_progress", chapters, completedChapterCount: completion.completedChapterCount, requiredChapterCount: completion.requiredChapterCount, qualifyingAttemptCount: completion.qualifyingAttemptCount, requiredAttemptCount: completion.requiredAttemptCount, remainingAttemptCount: completion.remainingAttemptCount });
  }
  if (completion.kind === "completed") {
    const chapters = validateChapterStatuses(completion.chapters);
    if (!hasOnlyKeys(completion, ["kind", "chapters", "completedChapterCount", "requiredChapterCount", "qualifyingAttemptCount", "requiredAttemptCount", "remainingAttemptCount"]) ||
      !positiveInteger(completion.requiredChapterCount) || completion.requiredChapterCount !== chapters.length || completion.completedChapterCount !== chapters.length ||
      chapters.some(chapter => chapter.status !== "completed") || completion.qualifyingAttemptCount !== chapters.reduce((sum, chapter) => sum + chapter.qualifyingAttemptCount, 0) ||
      completion.requiredAttemptCount !== chapters.reduce((sum, chapter) => sum + chapter.requiredAttemptCount, 0) || completion.remainingAttemptCount !== 0) fail("invalid_completion_state");
    return Object.freeze({ kind: "completed", chapters, completedChapterCount: completion.completedChapterCount, requiredChapterCount: completion.requiredChapterCount, qualifyingAttemptCount: completion.qualifyingAttemptCount, requiredAttemptCount: completion.requiredAttemptCount, remainingAttemptCount: 0 });
  }
  fail("invalid_completion_state");
}

function validateChapterStatuses(value: unknown): readonly ChapterCompletionStatus[] {
  if (!Array.isArray(value) || value.length === 0) fail("invalid_completion_state");
  const seen = new Set<string>();
  return Object.freeze(value.map((candidate) => {
    const chapter = asRecord(candidate, "invalid_completion_state");
    if (!hasOnlyKeys(chapter, ["nodeId", "mentalUnitCount", "qualifyingAttemptCount", "requiredAttemptCount", "rollingWindowSize", "qualityThreshold", "quality", "status", "reason"]) ||
      typeof chapter.nodeId !== "string" || !chapter.nodeId.trim() || seen.has(chapter.nodeId) || !positiveInteger(chapter.mentalUnitCount) ||
      !nonNegativeInteger(chapter.qualifyingAttemptCount) || !positiveInteger(chapter.requiredAttemptCount) || chapter.requiredAttemptCount !== minimumAttemptsForMentalUnits(chapter.mentalUnitCount) || chapter.rollingWindowSize !== 20 || chapter.qualityThreshold !== 0.8 ||
      !["in_progress", "completed"].includes(String(chapter.status)) || ![null, "minimum_attempts_unmet", "quality_unmet"].includes(chapter.reason as null | string) ||
      (chapter.quality !== null && (typeof chapter.quality !== "number" || !Number.isFinite(chapter.quality) || chapter.quality < 0 || chapter.quality > 1)) ||
      (chapter.status === "completed" && (chapter.reason !== null || chapter.quality === null || chapter.qualifyingAttemptCount < chapter.requiredAttemptCount || chapter.quality < chapter.qualityThreshold)) ||
      (chapter.status === "in_progress" && chapter.reason === "minimum_attempts_unmet" && chapter.qualifyingAttemptCount >= chapter.requiredAttemptCount) ||
      (chapter.status === "in_progress" && chapter.reason === "quality_unmet" && (chapter.qualifyingAttemptCount < chapter.requiredAttemptCount || chapter.quality === null || chapter.quality >= chapter.qualityThreshold))) fail("invalid_completion_state");
    seen.add(chapter.nodeId);
    return Object.freeze({ nodeId: chapter.nodeId, mentalUnitCount: chapter.mentalUnitCount, qualifyingAttemptCount: chapter.qualifyingAttemptCount, requiredAttemptCount: chapter.requiredAttemptCount, rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality: chapter.quality, status: chapter.status as "in_progress" | "completed", reason: chapter.reason as "minimum_attempts_unmet" | "quality_unmet" | null });
  }));
}

function buildTargetAssessment(record: GoalRecord, completion: PackageCompletionState, localToday: string, capacity: ResolvedCapacity): TargetAssessment {
  if (capacity.kind === "shortfall") return Object.freeze({ kind: "unavailable_due_to_shortfall" });

  const target = projectGoalTargetDate(record);
  // No target takes precedence over C3 unknown and over a legacy own-pace date.
  if (target.targetDate === undefined || target.meaning === "none") return Object.freeze({ kind: "open_ended" });
  if (completion.kind === "unknown") return Object.freeze({ kind: "unknown_completion_rule" });

  if (completion.kind === "in_progress" && completion.remainingAttemptCount === 0) {
    return Object.freeze({ kind: "quality_requirement_unmet" });
  }

  const remainingAttempts = completion.kind === "completed"
    ? 0
    : completion.remainingAttemptCount;
  const boundary = target.sessionBoundary === "strictly_before"
    ? addCalendarDays(target.targetDate, -1)
    : target.targetDate;
  const occurrences = countPreferredDayOccurrences(localToday, boundary, record.preferredDays);
  const minimumVolumeFits = occurrences * capacity.actualLength >= remainingAttempts;
  return Object.freeze({ kind: minimumVolumeFits ? "minimum_volume_fits" : "minimum_volume_exceeds_capacity", occurrences, actualLength: capacity.actualLength, remainingAttempts });
}

type ResolvedCapacity =
  | Readonly<{ kind: "exact" | "shortened"; actualLength: number }>
  | Readonly<{ kind: "shortfall" }>;

function resolveCapacity(capacity: ProposalSessionCapacity): ResolvedCapacity {
  if (capacity.kind === "shortfall") return Object.freeze({ kind: "shortfall" });
  return Object.freeze({ kind: capacity.kind, actualLength: capacity.actualLength });
}

function createSlots(days: readonly GoalDay[], actualLength: number): readonly ProposalSlot[] {
  return Object.freeze(days.map((day) => Object.freeze({ slotId: createProposalSlotId(`proposal-slot:v1:${day}:18-00`), day, localTime: "18:00", sessionLength: actualLength })));
}

function cloneCapacity(capacity: ProposalSessionCapacity): ProposalSessionCapacity {
  return capacity.kind === "exact"
    ? Object.freeze({ kind: "exact", actualLength: capacity.actualLength })
    : capacity.kind === "shortened"
      ? Object.freeze({ kind: "shortened", actualLength: capacity.actualLength, requestedLength: capacity.requestedLength })
      : Object.freeze({ kind: "shortfall", requestedLength: capacity.requestedLength, eligibleItemCount: capacity.eligibleItemCount, missingItemCount: capacity.missingItemCount });
}

function cloneCompletionState(state: PackageCompletionState): PackageCompletionState {
  return state.kind === "unknown"
    ? Object.freeze({ kind: "unknown" })
    : Object.freeze({ ...state, chapters: Object.freeze(state.chapters.map(chapter => Object.freeze({ ...chapter }))) });
}

function validateIsoDate(value: unknown, code: InvalidLearningPlanProposalInputCode): string {
  if (!isStrictIsoDate(value)) fail(code);
  return value;
}

function isStrictIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = utcMidnight(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function addCalendarDays(value: string, amount: number): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) fail("invalid_target_date");
  const date = utcMidnight(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setUTCDate(date.getUTCDate() + amount);
  return date;
}

function countPreferredDayOccurrences(startValue: string, endValue: Date | string, preferredDays: readonly GoalDay[]): number {
  const startMatch = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(startValue);
  if (!startMatch) fail("invalid_local_today");
  const start = utcMidnight(Number(startMatch[1]), Number(startMatch[2]) - 1, Number(startMatch[3]));
  const end = typeof endValue === "string"
    ? parseDate(endValue, "invalid_target_date")
    : endValue;
  const daySpan = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (daySpan <= 0) return 0;

  const selected = new Set<GoalDay>(preferredDays);
  const fullWeeks = Math.floor(daySpan / 7);
  const remainder = daySpan % 7;
  let count = fullWeeks * selected.size;
  const startDay = utcDayToGoalDay(start.getUTCDay());
  for (let offset = 0; offset < remainder; offset += 1) {
    const day = GOAL_DAY_IDS[(GOAL_DAY_IDS.indexOf(startDay) + offset) % GOAL_DAY_IDS.length]!;
    if (selected.has(day)) count += 1;
  }
  return count;
}

function parseDate(value: string, code: InvalidLearningPlanProposalInputCode): Date {
  if (!isStrictIsoDate(value)) fail(code);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value)!;
  return utcMidnight(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function utcMidnight(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, monthIndex, day);
  return date;
}

function utcDayToGoalDay(day: number): GoalDay {
  const values: readonly GoalDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return values[day] ?? "sun";
}

function validateTimezone(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) fail("invalid_timezone");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
  } catch {
    fail("invalid_timezone");
  }
  return value;
}

function validateNonEmptyText(value: unknown, code: InvalidLearningPlanProposalInputCode): string {
  if (typeof value !== "string" || !value.trim()) fail(code);
  return value;
}

function validatePositiveInteger(value: unknown, code: InvalidLearningPlanProposalInputCode): number {
  if (!positiveInteger(value)) fail(code);
  return value;
}

function validateNonNegativeInteger(value: unknown, code: InvalidLearningPlanProposalInputCode): number {
  if (!nonNegativeInteger(value)) fail(code);
  return value;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function asRecord(value: unknown, code: InvalidLearningPlanProposalInputCode = "invalid_input"): Record<string, any> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(code);
  return value as Record<string, any>;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function fail(code: InvalidLearningPlanProposalInputCode): never {
  throw new InvalidLearningPlanProposalInputError(code);
}

const DAY_MS = 86_400_000;

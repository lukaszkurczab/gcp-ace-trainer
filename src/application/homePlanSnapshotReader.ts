import {
  calculatePaceForecast,
  contentPackagePinsEqual,
  evaluatePackageCompletion,
  isIsoDate,
  normalizeGoalRecord,
  normalizeLearningPlan,
  type AcceptedTargetSnapshot,
  type ContentPackagePin,
  type GoalDay,
  type GoalSnapshot,
  type LearningPlan,
  type LearningPlanSnapshot,
  type PackageCompletionState,
  type ReviewQueueEntry,
  type TrainingAttempt,
  type TrainingSession,
  type TrackId,
  isRegisteredTrackId,
} from "../domain";
import type { PaceForecast, ImmutableCompletedFacts } from "../domain/learning/paceForecast";
import {
  getActiveTrainingSession,
  getGoalSnapshot,
  getLearningPlanSnapshot,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessions,
} from "../storage/repositories";
import type { StorageRepositoryResult } from "../storage/repositories/result";
import { isReviewQueueEntryArray, isTrainingAttemptArray, isTrainingSessionArray } from "../storage/repositories/trainingModelGuards";
import { canonicalSerialize } from "../infrastructure/identity/canonicalSerialization";
import { contentPackageRuntimeOwner, type ResolvedPackageRuntime } from "./contentPackageRuntimeOwner";
import {
  projectTargetDateGuidance,
  type TargetDateGuidance,
} from "./learningPlan/targetDateGuidance";

/** Explicit Home failure categories. The Home surface must not invent a fallback. */
export type HomePlanUnavailableReason =
  | "invalid_request"
  | "concurrent_change"
  | "storage_error"
  | "corrupt_record"
  | "identity_mismatch"
  | "package_error"
  | "package_unavailable"
  | "calculation_error"
  | "unsupported_action";

export type HomePlanDayStatus = "scheduled" | "completed" | "skipped" | "rest";

export type HomePlanDay = Readonly<{
  date: string;
  day: GoalDay;
  status: HomePlanDayStatus;
  slot: LearningPlan["slots"][number] | null;
  terminalSessionId: string | null;
}>;

/** The complete identity used by Home activity matching and retry-safe reads. */
export type HomePlanIdentity = Readonly<{
  trackId: TrackId;
  goalRevision: number;
  planId: string;
  planRevision: number;
  planStorageRevision: number;
  contentVersion: string;
  contentPackagePin: ContentPackagePin;
  timezone: string;
}>;

export type HomePlanReady = Readonly<{
  kind: "ready";
  trackId: TrackId;
  identity: HomePlanIdentity;
  goal: GoalSnapshot;
  plan: LearningPlan;
  planSnapshot: LearningPlanSnapshot;
  today: string;
  day: HomePlanDay;
  activeSession: TrainingSession | null;
  dueReviewCount: number;
  dueReviewIds: readonly string[];
  completion: PackageCompletionState;
  session: Readonly<{
    modeId: string;
    topicId: string;
    sessionLength: number;
    areaLabel: string;
  }>;
  paceForecast: PaceForecast;
  guidance: TargetDateGuidance;
}>;

export type HomePlanSnapshot =
  | HomePlanReady
  | Readonly<{
    kind: "none";
    trackId: TrackId;
    goal: GoalSnapshot | null;
    guidance: TargetDateGuidance;
  }>
  | Readonly<{ kind: "unavailable"; trackId: TrackId; reason: HomePlanUnavailableReason }>;

export type HomePlanReadInput = Readonly<{
  trackId: TrackId;
  /** Home is the only consumer that supplies the wall clock. Tests should inject it. */
  now?: string | number | Date;
  /** Optional explicit local day for deterministic composition tests. */
  today?: string;
}>;

type Awaitable<T> = T | Promise<T>;
type ReadCollection<T> = readonly T[] | StorageRepositoryResult<T[]>;

export type HomePlanSnapshotReaderDependencies = Readonly<{
  getGoalSnapshot(trackId: TrackId): Awaitable<GoalSnapshot | null>;
  getLearningPlanSnapshot(trackId: TrackId): Awaitable<LearningPlanSnapshot | null>;
  getActiveTrainingSession(): Awaitable<TrainingSession | null>;
  getTrainingSessions(): Awaitable<ReadCollection<TrainingSession>>;
  getTrainingAttempts(): Awaitable<ReadCollection<TrainingAttempt<unknown>>>;
  getReviewQueueItems(): Awaitable<ReadCollection<ReviewQueueEntry>>;
  resolveExact(pin: ContentPackagePin): Promise<ResolvedPackageRuntime>;
}>;

type HomeReadGeneration = Readonly<{
  goal: GoalSnapshot | null;
  plan: LearningPlanSnapshot | null;
  activeSession: TrainingSession | null;
  sessions: readonly TrainingSession[];
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
}>;

const defaultDependencies: HomePlanSnapshotReaderDependencies = {
  getGoalSnapshot,
  getLearningPlanSnapshot,
  getActiveTrainingSession,
  getTrainingSessions: async () => (await getTrainingSessions()),
  getTrainingAttempts: async () => (await getTrainingAttempts()),
  getReviewQueueItems: async () => (await getReviewQueueItems()),
  resolveExact: (pin) => contentPackageRuntimeOwner.resolveExact(pin),
};

const EMPTY_GUIDANCE_PIN: ContentPackagePin = Object.freeze({
  packageIdentity: "0".repeat(64),
  packageVersion: "none",
  contentReleaseId: "none",
});

const EMPTY_COMPLETED_FACTS: ImmutableCompletedFacts = Object.freeze({
  sessions: Object.freeze([]),
  attempts: Object.freeze([]),
});

/**
 * Reads all Home learning facts twice and only publishes the generation if the
 * two canonical snapshots agree. This keeps a concurrent MMKV mutation from
 * producing a mixed goal/plan/activity projection.
 */
export class HomePlanSnapshotReader {
  constructor(private readonly dependencies: HomePlanSnapshotReaderDependencies = defaultDependencies) {}

  async read(input: HomePlanReadInput): Promise<HomePlanSnapshot> {
    if (!isTrackId(input.trackId)) return unavailable(input.trackId, "invalid_request");
    const instant = normalizeNow(input.now);
    if (instant === null) return unavailable(input.trackId, "invalid_request");

    let first: HomeReadGeneration;
    let second: HomeReadGeneration;
    try {
      first = await this.readGeneration(input.trackId);
      second = await this.readGeneration(input.trackId);
    } catch (error) {
      return unavailable(input.trackId, error instanceof HomePlanReadFailure ? error.reason : "storage_error");
    }
    if (!generationsEqual(first, second)) return unavailable(input.trackId, "concurrent_change");

    return this.project(input.trackId, first, instant, input.today);
  }

  private async readGeneration(trackId: TrackId): Promise<HomeReadGeneration> {
    const [goal, plan, activeSession, sessionsRead, attemptsRead, reviewsRead] = await Promise.all([
      this.dependencies.getGoalSnapshot(trackId),
      this.dependencies.getLearningPlanSnapshot(trackId),
      this.dependencies.getActiveTrainingSession(),
      this.dependencies.getTrainingSessions(),
      this.dependencies.getTrainingAttempts(),
      this.dependencies.getReviewQueueItems(),
    ]);
    return Object.freeze({
      goal: goal ?? null,
      plan: plan ?? null,
      activeSession: activeSession ?? null,
      sessions: validateCollection(unwrapCollection(sessionsRead, "training sessions"), isTrainingSessionArray, "training sessions"),
      attempts: validateCollection(unwrapCollection(attemptsRead, "training attempts"), isTrainingAttemptArray, "training attempts"),
      reviews: validateCollection(unwrapCollection(reviewsRead, "review queue"), isReviewQueueEntryArray, "review queue"),
    });
  }

  private async project(trackId: TrackId, generation: HomeReadGeneration, instant: string, requestedToday?: string): Promise<HomePlanSnapshot> {
    if (generation.plan === null) {
      let goal: GoalSnapshot | null = null;
      if (generation.goal !== null) {
        try {
          goal = normalizeGoalSnapshot(generation.goal, trackId);
        } catch {
          return unavailable(trackId, "corrupt_record");
        }
      }
      const guidance = projectTargetDateGuidance({
        currentGoal: goal,
        acceptedPlan: null,
        currentVerifiedPackagePin: EMPTY_GUIDANCE_PIN,
        c3Result: "unknown",
        today: instant.slice(0, 10),
        completedFacts: EMPTY_COMPLETED_FACTS,
        paceForecast: Object.freeze({ kind: "unavailable", reason: "no_target" }),
      });
      return Object.freeze({ kind: "none", trackId, goal, guidance });
    }
    if (generation.goal === null) return unavailable(trackId, "identity_mismatch");

    let goal: GoalSnapshot;
    let planSnapshot: LearningPlanSnapshot;
    try {
      goal = normalizeGoalSnapshot(generation.goal, trackId);
      planSnapshot = normalizePlanSnapshot(generation.plan, trackId);
    } catch {
      return unavailable(trackId, "corrupt_record");
    }

    const plan = planSnapshot.plan;
    let resolved: ResolvedPackageRuntime;
    try {
      resolved = await this.dependencies.resolveExact(plan.contentPackagePin);
    } catch (error) {
      return unavailable(trackId, isPackageUnavailable(error) ? "package_unavailable" : "package_error");
    }
    if (!isResolvedPackageForPlan(resolved, plan)) return unavailable(trackId, "identity_mismatch");

    const primary = resolved.package.profile.primaryEntry;
    let primaryMode: ReturnType<ResolvedPackageRuntime["profile"]["getMode"]>;
    try { primaryMode = resolved.profile.getMode(primary.modeId); }
    catch { return unavailable(trackId, "unsupported_action"); }
    if (plan.slots.some((slot) => !primaryMode.requestedLengths.includes(slot.sessionLength))) {
      return unavailable(trackId, "unsupported_action");
    }

    const identity = freezeIdentity(planSnapshot, plan);
    const sessions = deduplicateById(generation.sessions, "session");
    const attempts = deduplicateById(generation.attempts, "attempt");
    const reviews = deduplicateById(generation.reviews, "review");
    if (sessions === null || attempts === null || reviews === null) return unavailable(trackId, "corrupt_record");

    const matchingSessions = sessions.filter((session) => matchesSessionIdentity(session, identity));
    const matchingAttempts = attempts.filter((attempt) => matchesAttemptIdentity(attempt, identity));
    const matchingReviews = reviews.filter((entry) => matchesReviewIdentity(entry, identity));
    const activeSession = selectActiveSession(generation.activeSession, identity, matchingSessions);
    if (activeSession === "corrupt") return unavailable(trackId, "corrupt_record");

    const nowMs = Date.parse(instant);
    let today: string;
    try {
      today = requestedToday ?? localDateForInstant(instant, plan.timezone);
    } catch {
      return unavailable(trackId, "invalid_request");
    }
    if (!isIsoDate(today)) return unavailable(trackId, "invalid_request");

    const dueReviews = matchingReviews.filter((entry) => isDueReview(entry, nowMs));
    let paceForecast: PaceForecast;
    let c3Result: "unknown" | "in_progress" | "completed";
    let completion: PackageCompletionState;
    let completedFacts: ImmutableCompletedFacts;
    try {
      const completionRule = resolved.package.profile.completionRule;
      completedFacts = buildCompletedFacts(matchingSessions, matchingAttempts);
      if (completionRule === undefined) {
        completion = Object.freeze({ kind: "unknown" });
        c3Result = "unknown";
        paceForecast = Object.freeze({ kind: "unavailable", reason: "unknown_completion_rule" });
      } else {
        completion = evaluatePackageCompletion({
          trackId: plan.trackId,
          contentVersion: plan.contentVersion,
          packagePin: plan.contentPackagePin,
          completionRule,
        }, matchingAttempts);
        c3Result = completion.kind === "completed" ? "completed" : "in_progress";
        paceForecast = calculatePaceForecast({
          acceptedPlan: plan,
          c3Result,
          requiredAttemptCount: completionRule.minimumAttemptCount,
          today,
          timezone: plan.timezone,
          completedFacts,
        });
      }
    } catch {
      return unavailable(trackId, "calculation_error");
    }

    let guidance: TargetDateGuidance;
    try {
      guidance = projectTargetDateGuidance({
        currentGoal: goal,
        acceptedPlan: plan,
        currentVerifiedPackagePin: plan.contentPackagePin,
        c3Result,
        today,
        completedFacts,
        paceForecast,
      });
    } catch {
      return unavailable(trackId, "calculation_error");
    }
    if (!isSupportedHomeAction(guidance.home.primary)) return unavailable(trackId, "unsupported_action");

    let day: HomePlanDay;
    try { day = buildHomeDay(plan, today, matchingSessions); }
    catch { return unavailable(trackId, "calculation_error"); }
    return Object.freeze({
      kind: "ready",
      trackId,
      identity,
      goal,
      plan,
      planSnapshot,
      today,
      day,
      activeSession: activeSession ?? null,
      dueReviewCount: dueReviews.length,
      dueReviewIds: Object.freeze(dueReviews.map((entry) => entry.id)),
      completion,
      session: Object.freeze({
        modeId: primary.modeId,
        topicId: resolved.package.freeNodeId,
        sessionLength: day.slot?.sessionLength ?? primary.requestedLength,
        areaLabel: humanizeScope(resolved.package.freeNodeId),
      }),
      paceForecast,
      guidance,
    });
  }
}

export const homePlanSnapshotReader = new HomePlanSnapshotReader();

export async function readHomePlanSnapshot(input: HomePlanReadInput, dependencies?: HomePlanSnapshotReaderDependencies): Promise<HomePlanSnapshot> {
  return new HomePlanSnapshotReader(dependencies).read(input);
}

class HomePlanReadFailure extends Error {
  constructor(readonly reason: HomePlanUnavailableReason, message: string) {
    super(message);
    this.name = "HomePlanReadFailure";
  }
}

function unwrapCollection<T>(value: ReadCollection<T>, source: string): readonly T[] {
  if (Array.isArray(value)) return Object.freeze([...value]);
  if (!isRepositoryResult(value) || !Array.isArray(value.value)) throw new HomePlanReadFailure("storage_error", `${source} could not be read.`);
  if (value.issues && value.issues.length > 0) throw new HomePlanReadFailure("storage_error", `${source} has read issues.`);
  return Object.freeze([...value.value]);
}

function isRepositoryResult<T>(value: ReadCollection<T>): value is StorageRepositoryResult<T[]> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && (value as { ok?: unknown }).ok === true;
}

function validateCollection<T>(value: readonly T[], guard: (candidate: unknown) => candidate is T[], source: string): readonly T[] {
  if (!guard(value)) throw new HomePlanReadFailure("corrupt_record", `${source} contains an invalid record.`);
  return value;
}

function normalizeGoalSnapshot(value: GoalSnapshot, trackId: TrackId): GoalSnapshot {
  if (!Number.isSafeInteger(value.revision) || value.revision < 1 || value.record.trackId !== trackId) throw new Error("Goal identity is invalid.");
  return Object.freeze({ record: normalizeGoalRecord(value.record), revision: value.revision });
}

function normalizePlanSnapshot(value: LearningPlanSnapshot, trackId: TrackId): LearningPlanSnapshot {
  if (!Number.isSafeInteger(value.revision) || value.revision < 1 || value.plan.trackId !== trackId) throw new Error("Plan identity is invalid.");
  const plan = normalizeLearningPlan(value.plan);
  return Object.freeze({ plan, revision: value.revision });
}

function freezeIdentity(snapshot: LearningPlanSnapshot, plan: LearningPlan): HomePlanIdentity {
  return Object.freeze({
    trackId: plan.trackId,
    goalRevision: plan.goalRevision,
    planId: plan.planId,
    planRevision: plan.planRevision,
    planStorageRevision: snapshot.revision,
    contentVersion: plan.contentVersion,
    contentPackagePin: Object.freeze({ ...plan.contentPackagePin }),
    timezone: plan.timezone,
  });
}

function isResolvedPackageForPlan(resolved: ResolvedPackageRuntime, plan: LearningPlan): boolean {
  return resolved.package.trackId === plan.trackId &&
    resolved.package.contentVersion === plan.contentVersion &&
    contentPackagePinsEqual(resolved.package.packagePin, plan.contentPackagePin) &&
    resolved.package.profile !== undefined;
}

function isSupportedHomeAction(action: TargetDateGuidance["home"]["primary"]): boolean {
  return action.destination === "GoalCadence" ||
    action.destination === "LearningPlanProposal" ||
    action.destination === "LearningPlanEditor" ||
    action.destination === "Progress" ||
    action.destination === "Practice";
}

function selectActiveSession(
  active: TrainingSession | null,
  identity: HomePlanIdentity,
  sessions: readonly TrainingSession[],
): TrainingSession | null | "corrupt" {
  if (active === null || active.status !== "active") return null;
  if (!matchesSessionIdentity(active, identity)) return null;
  if (!sessions.some((session) => session.id === active.id)) return "corrupt";
  const stored = sessions.find((session) => session.id === active.id)!;
  try { if (canonicalSerialize(stored) !== canonicalSerialize(active)) return "corrupt"; }
  catch { return "corrupt"; }
  return active;
}

function matchesSessionIdentity(session: TrainingSession, identity: HomePlanIdentity): boolean {
  return session.trackId === identity.trackId && session.contentVersion === identity.contentVersion && contentPackagePinsEqual(session.packagePin, identity.contentPackagePin) && matchesOptionalIdentity(session, identity);
}

function matchesAttemptIdentity(attempt: TrainingAttempt<unknown>, identity: HomePlanIdentity): boolean {
  return attempt.trackId === identity.trackId && attempt.item.trackId === identity.trackId && attempt.item.contentVersion === identity.contentVersion && contentPackagePinsEqual(attempt.item.packagePin, identity.contentPackagePin) && matchesOptionalIdentity(attempt, identity) && matchesOptionalIdentity(attempt.item, identity);
}

function matchesReviewIdentity(entry: ReviewQueueEntry, identity: HomePlanIdentity): boolean {
  return entry.trackId === identity.trackId && entry.sourceItem.trackId === identity.trackId && entry.sourceItem.contentVersion === identity.contentVersion && contentPackagePinsEqual(entry.sourceItem.packagePin, identity.contentPackagePin) && matchesOptionalIdentity(entry, identity) && matchesOptionalIdentity(entry.sourceItem, identity);
}

function matchesOptionalIdentity(value: unknown, identity: HomePlanIdentity): boolean {
  if (!isRecord(value)) return false;
  const candidate = value as Record<string, unknown>;
  const snapshot = isRecord(candidate.configurationSnapshot) ? candidate.configurationSnapshot : null;
  return optionalEqual(candidate, snapshot, "trackId", identity.trackId) &&
    optionalEqual(candidate, snapshot, "goalRevision", identity.goalRevision) &&
    optionalEqual(candidate, snapshot, "planId", identity.planId) &&
    optionalEqual(candidate, snapshot, "planRevision", identity.planRevision) &&
    optionalEqual(candidate, snapshot, "planStorageRevision", identity.planStorageRevision) &&
    optionalEqual(candidate, snapshot, "contentVersion", identity.contentVersion) &&
    optionalPinEqual(candidate, snapshot, identity.contentPackagePin) &&
    optionalEqual(candidate, snapshot, "timezone", identity.timezone);
}

function optionalEqual(value: Record<string, unknown>, nested: Record<string, unknown> | null, key: string, expected: unknown): boolean {
  const direct = value[key];
  const nestedValue = nested?.[key];
  return (direct === undefined || direct === expected) && (nestedValue === undefined || nestedValue === expected);
}

function optionalPinEqual(value: Record<string, unknown>, nested: Record<string, unknown> | null, expected: ContentPackagePin): boolean {
  const direct = value.contentPackagePin ?? value.packagePin;
  const nestedPin = nested?.contentPackagePin ?? nested?.packagePin;
  return (direct === undefined || isPinEqual(direct, expected)) && (nestedPin === undefined || isPinEqual(nestedPin, expected));
}

function isPinEqual(value: unknown, expected: ContentPackagePin): boolean {
  return isRecord(value) && contentPackagePinsEqual(value as ContentPackagePin, expected);
}

function buildCompletedFacts(sessions: readonly TrainingSession[], attempts: readonly TrainingAttempt<unknown>[]): ImmutableCompletedFacts {
  return Object.freeze({
    sessions: Object.freeze(sessions.filter((session) => session.status === "completed" && session.completedAt !== undefined).map((session) => Object.freeze({
      completedAt: session.completedAt!,
      completedQuestions: session.actualLength,
      plannedQuestions: session.requestedLength,
    }))),
    attempts: Object.freeze(attempts.map((attempt) => Object.freeze({ answeredAt: attempt.answeredAt, countsTowardCompletion: true }))),
  });
}

function buildHomeDay(plan: LearningPlan, today: string, sessions: readonly TrainingSession[]): HomePlanDay {
  const day = dayForDate(today);
  const slot = plan.slots.find((candidate) => candidate.day === day) ?? null;
  const terminal = sessions
    .filter((session) => session.status !== "active" && session.completedAt !== undefined && localDateForInstant(session.completedAt, plan.timezone) === today)
    .sort((left, right) => (right.completedAt ?? "").localeCompare(left.completedAt ?? ""));
  const completed = terminal.find((session) => session.status === "completed");
  const skipped = terminal.find((session) => session.status === "abandoned");
  const status: HomePlanDayStatus = completed ? "completed" : skipped ? "skipped" : slot ? "scheduled" : "rest";
  return Object.freeze({ date: today, day, status, slot, terminalSessionId: completed?.id ?? skipped?.id ?? null });
}

function isDueReview(entry: ReviewQueueEntry, nowMs: number): boolean {
  const dueAt = Date.parse(entry.dueAt);
  return Number.isFinite(dueAt) && dueAt <= nowMs;
}

function deduplicateById<T extends { id: string }>(values: readonly T[], source: string): readonly T[] | null {
  const byId = new Map<string, T>();
  for (const value of values) {
    if (!value || typeof value.id !== "string" || value.id.length === 0) return null;
    const previous = byId.get(value.id);
    if (previous !== undefined) {
      try {
        if (canonicalSerialize(previous) !== canonicalSerialize(value)) return null;
      } catch {
        return null;
      }
      continue;
    }
    byId.set(value.id, value);
  }
  return Object.freeze([...byId.values()]);
}

function generationsEqual(left: HomeReadGeneration, right: HomeReadGeneration): boolean {
  try { return canonicalSerialize(left) === canonicalSerialize(right); } catch { return false; }
}

function normalizeNow(value: HomePlanReadInput["now"]): string | null {
  const candidate = value instanceof Date ? value : value === undefined ? new Date() : new Date(value);
  if (Number.isNaN(candidate.getTime())) return null;
  return candidate.toISOString();
}

function localDateForInstant(value: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new Error("Local date is unavailable.");
  return `${year}-${month}-${day}`;
}

function dayForDate(value: string): GoalDay {
  const day = new Date(`${value}T00:00:00.000Z`).getUTCDay();
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[day]!;
}

function unavailable(trackId: TrackId, reason: HomePlanUnavailableReason): HomePlanSnapshot {
  return Object.freeze({ kind: "unavailable", trackId, reason });
}

function isTrackId(value: unknown): value is TrackId {
  return typeof value === "string" && isRegisteredTrackId(value);
}

function isPackageUnavailable(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && typeof (error as { code?: unknown }).code === "string" && String((error as { code: string }).code).startsWith("package_"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeScope(value: string): string {
  const label = value.replaceAll("_", " ").replaceAll("-", " ").trim();
  if (!label) throw new Error("The plan area is unavailable.");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

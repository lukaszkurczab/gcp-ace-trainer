import { projectLearningEvidence } from "./learningPlan/learningEvidenceProjection";
import { readLearningPlanInputSnapshot, type LearningPlanInputSnapshot } from "../storage/repositories/learningPlanInputSnapshot";
import { calculatePaceForecast } from "../domain/learning/paceForecast";
import {
  isIsoDate,
  normalizeGoalRecord,
  normalizeLearningPlan,
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
import type { ResolvedContentRef } from "../domain/learning/resolvedContentRef";
import type { PaceForecast, ImmutableCompletedFacts } from "../domain/learning/paceForecast";
import {
  getActiveTrainingSession,
  getTrainingSessions,
} from "../storage/repositories";
import type { StorageRepositoryResult } from "../storage/repositories/result";
import { isTrainingSessionArray } from "../storage/repositories/trainingModelGuards";
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
  artifactSha256: string;
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
  readInputs(trackId: TrackId): LearningPlanInputSnapshot;
  getActiveTrainingSession(): Awaitable<TrainingSession | null>;
  getTrainingSessions(): Awaitable<ReadCollection<TrainingSession>>;
  resolveExactArtifact(identity: Pick<ResolvedContentRef, "trackId" | "contentVersion" | "artifactSha256">): Promise<ResolvedPackageRuntime>;
}>;

type HomeReadGeneration = Readonly<{
  storageScope: object;
  goal: GoalSnapshot | null;
  plan: LearningPlanSnapshot | null;
  activeSession: TrainingSession | null;
  sessions: readonly TrainingSession[];
  attempts: readonly TrainingAttempt<unknown>[];
  reviews: readonly ReviewQueueEntry[];
}>;

const defaultDependencies: HomePlanSnapshotReaderDependencies = {
  readInputs: readLearningPlanInputSnapshot,
  getActiveTrainingSession,
  getTrainingSessions: async () => (await getTrainingSessions()),
  resolveExactArtifact: (identity) => contentPackageRuntimeOwner.resolveExactArtifact(identity),
};

const EMPTY_GUIDANCE_ARTIFACT_SHA256 = "0".repeat(64);

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
    const inputs = this.dependencies.readInputs(trackId);
    const [activeSession, sessionsRead] = await Promise.all([
      this.dependencies.getActiveTrainingSession(), this.dependencies.getTrainingSessions(),
    ]);
    if (!learningInputsEqual(inputs, this.dependencies.readInputs(trackId))) throw new HomePlanReadFailure("concurrent_change", "Home inputs changed while reading sessions.");
    return Object.freeze({
      storageScope: inputs.storageScope, goal: inputs.goal, plan: inputs.plan,
      activeSession: activeSession ?? null,
      sessions: validateCollection(unwrapCollection(sessionsRead, "training sessions"), isTrainingSessionArray, "training sessions"),
      attempts: inputs.attempts, reviews: inputs.reviews,
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
        currentVerifiedArtifactSha256: EMPTY_GUIDANCE_ARTIFACT_SHA256,
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
      resolved = await this.dependencies.resolveExactArtifact({ trackId: plan.trackId, contentVersion: plan.contentVersion, artifactSha256: plan.artifactSha256 });
    } catch (error) {
      return unavailable(trackId, isPackageUnavailable(error) ? "package_unavailable" : "package_error");
    }
    // The awaited package read is inside the snapshot boundary, including the opaque A→B→A lease.
    try {
      const finalGeneration = await this.readGeneration(trackId);
      if (!generationsEqual(generation, finalGeneration)) return unavailable(trackId, "concurrent_change");
    } catch (error) {
      return unavailable(trackId, error instanceof HomePlanReadFailure ? error.reason : "storage_error");
    }
    if (!isResolvedPackageForPlan(resolved, plan)) return unavailable(trackId, "identity_mismatch");

    const primary = resolved.track.modes[0];
    if (!primary) return unavailable(trackId, "unsupported_action");
    let primaryMode: ReturnType<ResolvedPackageRuntime["track"]["getMode"]>;
    try { primaryMode = resolved.track.getMode(primary.modeId); }
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
    const activeSession = selectActiveSession(generation.activeSession, identity, matchingSessions);
    if (activeSession === "corrupt") return unavailable(trackId, "corrupt_record");

    let today: string;
    try {
      today = requestedToday ?? localDateForInstant(instant, plan.timezone);
    } catch {
      return unavailable(trackId, "invalid_request");
    }
    if (!isIsoDate(today)) return unavailable(trackId, "invalid_request");

    let dueReviews: readonly ReviewQueueEntry[] = [];
    let paceForecast: PaceForecast;
    let c3Result: "unknown" | "in_progress" | "completed";
    let completion: PackageCompletionState;
    let completedFacts: ImmutableCompletedFacts;
    try {
      const evidence = projectLearningEvidence({ profile: resolved.track, attempts, reviews, now: instant });
      completedFacts = evidence.completedFacts;
      completion = evidence.completion;
      c3Result = completion.kind;
      dueReviews = evidence.dueReviews;
      paceForecast = calculatePaceForecast({
        acceptedPlan: plan, c3Result, requiredAttemptCount: resolved.track.completionRule?.minimumAttemptCount ?? 0,
        today, timezone: plan.timezone, completedFacts,
      });
    } catch {
      return unavailable(trackId, "calculation_error");
    }

    let guidance: TargetDateGuidance;
    try {
      guidance = projectTargetDateGuidance({
        currentGoal: goal,
        acceptedPlan: plan,
        currentVerifiedArtifactSha256: plan.artifactSha256,
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
    try {
      if (!learningInputsEqual(generation, this.dependencies.readInputs(trackId))) return unavailable(trackId, "concurrent_change");
    } catch { return unavailable(trackId, "storage_error"); }
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
        topicId: primary.selection.kind === "node" ? primary.selection.nodeId : "",
        sessionLength: day.slot?.sessionLength ?? primary.defaultRequestedLength,
        areaLabel: humanizeScope(primary.selection.kind === "node" ? primary.selection.nodeId : "track"),
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
    artifactSha256: plan.artifactSha256,
    timezone: plan.timezone,
  });
}

function isResolvedPackageForPlan(resolved: ResolvedPackageRuntime, plan: LearningPlan): boolean {
  return resolved.track.trackId === plan.trackId &&
    resolved.track.contentVersion === plan.contentVersion &&
    resolved.track.artifactSha256 === plan.artifactSha256;
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
  return session.trackId === identity.trackId && session.contentVersion === identity.contentVersion && session.artifactSha256 === identity.artifactSha256 && matchesOptionalIdentity(session, identity);
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
    optionalEqual(candidate, snapshot, "artifactSha256", identity.artifactSha256) &&
    optionalEqual(candidate, snapshot, "timezone", identity.timezone);
}

function optionalEqual(value: Record<string, unknown>, nested: Record<string, unknown> | null, key: string, expected: unknown): boolean {
  const direct = value[key];
  const nestedValue = nested?.[key];
  return (direct === undefined || direct === expected) && (nestedValue === undefined || nestedValue === expected);
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

function learningInputsEqual(left: Pick<LearningPlanInputSnapshot, "storageScope" | "goal" | "plan" | "attempts" | "reviews">, right: LearningPlanInputSnapshot): boolean {
  if (left.storageScope !== right.storageScope) return false;
  try {
    return canonicalSerialize({ goal: left.goal, plan: left.plan, attempts: left.attempts, reviews: left.reviews }) ===
      canonicalSerialize({ goal: right.goal, plan: right.plan, attempts: right.attempts, reviews: right.reviews });
  } catch { return false; }
}

function generationsEqual(left: HomeReadGeneration, right: HomeReadGeneration): boolean {
  if (left.storageScope !== right.storageScope) return false;
  const { storageScope: _leftScope, ...leftFacts } = left;
  const { storageScope: _rightScope, ...rightFacts } = right;
  try { return canonicalSerialize(leftFacts) === canonicalSerialize(rightFacts); } catch { return false; }
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

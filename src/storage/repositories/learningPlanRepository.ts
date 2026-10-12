import type { LearningPlan, LearningPlanSnapshot, TrackId } from "../../domain";
import { normalizeLearningPlan, learningPlansEqual } from "../../domain";
import { isGoalPolicyForTrack, type GoalPolicy } from "../../domain/goals/goalPolicy";
import { readCanonicalEnvelope, writeCanonicalJsonUnlocked, withCanonicalWriteLocks, type CanonicalRecordEnvelope } from "./canonicalRecordCodec";
import { STORAGE_KEYS } from "../keys";
import { CanonicalWriteConflictError, UnsupportedStoredRecordError } from "../errors";
import { StaleGoalRevisionError } from "./goalRepository";
import { assertGoalPlanPairReadable } from "./mutationJournalRepository";

export type { LearningPlanSnapshot } from "../../domain";

export class StaleLearningPlanStorageRevisionError extends Error {
  constructor(readonly expectedRevision: number | null, readonly actualRevision: number | null) {
    super("Learning plan storage revision is stale.");
    this.name = "StaleLearningPlanStorageRevisionError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LearningPlanCommandConflictError extends Error {
  constructor(readonly commandId: string) {
    super("A different learning plan is already persisted for this command.");
    this.name = "LearningPlanCommandConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type SaveLearningPlanAtomicallyInput = Readonly<{
  trackId?: TrackId;
  policy: GoalPolicy;
  plan: LearningPlan;
  expectedGoalRevision: number | null;
  expectedPlanStorageRevision: number | null;
}>;

/** Reads the plan envelope revision; absence is a valid first-run state. */
export function getLearningPlanSnapshot(trackId: TrackId, policy: GoalPolicy): LearningPlanSnapshot | null {
  assertGoalPlanPairReadable();
  if (!isGoalPolicyForTrack(policy, trackId)) throw new Error("A matching goal policy is required to read a learning plan.");
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.learningPlan(trackId), (value): value is LearningPlan => isPlanForPolicy(value, policy));
  return envelope ? freezeSnapshot(envelope) : null;
}

export function getLearningPlan(trackId: TrackId, policy: GoalPolicy): LearningPlan | null {
  return getLearningPlanSnapshot(trackId, policy)?.plan ?? null;
}

/** Small per-track facade for callers that prefer a repository instance. */
export class LearningPlanRepository {
  constructor(readonly trackId: TrackId, readonly policy: GoalPolicy) {}

  getSnapshot(): LearningPlanSnapshot | null {
    return getLearningPlanSnapshot(this.trackId, this.policy);
  }

  get(): LearningPlan | null {
    return this.getSnapshot()?.plan ?? null;
  }

  saveAtomically(plan: LearningPlan, expectedGoalRevision: number | null, expectedPlanStorageRevision: number | null): LearningPlanSnapshot {
    return saveLearningPlanAtomically({ trackId: this.trackId, policy: this.policy, plan, expectedGoalRevision, expectedPlanStorageRevision });
  }
}

export function saveLearningPlanAtomically(input: SaveLearningPlanAtomicallyInput): LearningPlanSnapshot;
export function saveLearningPlanAtomically(trackId: TrackId, plan: LearningPlan, expectedGoalRevision: number | null, expectedPlanStorageRevision: number | null, policy: GoalPolicy): LearningPlanSnapshot;
export function saveLearningPlanAtomically(
  inputOrTrackId: SaveLearningPlanAtomicallyInput | TrackId,
  positionalPlan?: LearningPlan,
  positionalExpectedGoalRevision?: number | null,
  positionalExpectedPlanStorageRevision?: number | null,
  positionalPolicy?: GoalPolicy,
): LearningPlanSnapshot {
  assertGoalPlanPairReadable();
  const input: SaveLearningPlanAtomicallyInput = typeof inputOrTrackId === "string"
    ? { trackId: inputOrTrackId, plan: positionalPlan!, expectedGoalRevision: positionalExpectedGoalRevision!, expectedPlanStorageRevision: positionalExpectedPlanStorageRevision!, policy: positionalPolicy! }
    : inputOrTrackId;
  const normalizedTrackId = input.trackId ?? input.plan.trackId;
  if (!isGoalPolicyForTrack(input.policy, normalizedTrackId)) throw new Error("A matching goal policy is required to save a learning plan.");
  const normalized = normalizeLearningPlan(input.plan);
  const trackId = input.trackId ?? normalized.trackId;
  if (trackId !== normalized.trackId) throw new Error("Learning plan track identity does not match its storage key.");
  assertExpectedRevision(input.expectedGoalRevision, "goal");
  assertExpectedRevision(input.expectedPlanStorageRevision, "plan");

  const goalKey = STORAGE_KEYS.goal(trackId);
  const planKey = STORAGE_KEYS.learningPlan(trackId);
  return withCanonicalWriteLocks([goalKey, planKey], () => {
    const currentPlanRaw = readCanonicalEnvelope(planKey, (value): value is LearningPlan => isPlanForPolicy(value, input.policy));
    const currentPlanEnvelope = currentPlanRaw ? Object.freeze({ ...currentPlanRaw, payload: normalizeLearningPlan(currentPlanRaw.payload) }) : null;
    const actualGoalRevision = readCanonicalEnvelope(goalKey, (_value): _value is unknown => true)?.revision ?? null;
    if (actualGoalRevision !== input.expectedGoalRevision) throw new StaleGoalRevisionError(input.expectedGoalRevision, actualGoalRevision);

    // The same durable command is an idempotent success, including after a
    // caller lost the response between MMKV write and verification.
    if (currentPlanEnvelope?.payload.commandId === normalized.commandId) {
      if (!learningPlansEqual(currentPlanEnvelope.payload, normalized)) throw new LearningPlanCommandConflictError(normalized.commandId);
      return freezeSnapshot(currentPlanEnvelope);
    }

    const actualPlanRevision = currentPlanEnvelope?.revision ?? null;
    if (actualPlanRevision !== input.expectedPlanStorageRevision) throw new StaleLearningPlanStorageRevisionError(input.expectedPlanStorageRevision, actualPlanRevision);

    try {
      const saved = writeCanonicalJsonUnlocked(planKey, normalized, input.expectedPlanStorageRevision);
      return freezeSnapshot(saved);
    } catch (error) {
      if (error instanceof UnsupportedStoredRecordError || error instanceof CanonicalWriteConflictError) {
        const raced = readCanonicalEnvelope(planKey, (value): value is LearningPlan => isPlanForPolicy(value, input.policy));
        throw new StaleLearningPlanStorageRevisionError(input.expectedPlanStorageRevision, raced?.revision ?? null);
      }
      throw error;
    }
  });
}

function freezeSnapshot(envelope: CanonicalRecordEnvelope<LearningPlan>): LearningPlanSnapshot {
  return Object.freeze({ plan: normalizeLearningPlan(envelope.payload), revision: envelope.revision });
}

function isPlanForPolicy(value: unknown, policy: GoalPolicy): value is LearningPlan {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    isGoalPolicyForTrack(policy, String((value as { trackId?: unknown }).trackId)) &&
    normalizePlanSafely(value);
}

function normalizePlanSafely(value: unknown): value is LearningPlan {
  try { normalizeLearningPlan(value); return true; } catch { return false; }
}

function assertExpectedRevision(value: number | null, label: string): void {
  if (value !== null && (!Number.isSafeInteger(value) || value < 1)) throw new RangeError(`Expected ${label} revision must be a positive integer or null.`);
}

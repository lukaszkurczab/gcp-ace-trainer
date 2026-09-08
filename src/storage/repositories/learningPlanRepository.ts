import type { LearningPlan, LearningPlanSnapshot, TrackId } from "../../domain";
import { isLearningPlanV1ForTrack, normalizeLearningPlan, learningPlansEqual } from "../../domain";
import { readCanonicalEnvelope, writeCanonicalJsonUnlocked, withCanonicalWriteLocks, type CanonicalRecordEnvelope } from "./canonicalRecordCodec";
import { STORAGE_KEYS } from "../keys";
import { CanonicalWriteConflictError, UnsupportedStoredRecordError } from "../errors";
import { StaleGoalRevisionError } from "./goalRepository";

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
  plan: LearningPlan;
  expectedGoalRevision: number | null;
  expectedPlanStorageRevision: number | null;
}>;

/** Reads the plan envelope revision; absence is a valid first-run state. */
export function getLearningPlanSnapshot(trackId: TrackId): LearningPlanSnapshot | null {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.learningPlan(trackId), (value): value is LearningPlan => isLearningPlanV1ForTrack(value, trackId));
  return envelope ? freezeSnapshot(envelope) : null;
}

export function getLearningPlan(trackId: TrackId): LearningPlan | null {
  return getLearningPlanSnapshot(trackId)?.plan ?? null;
}

/** Small per-track facade for callers that prefer a repository instance. */
export class LearningPlanRepository {
  constructor(readonly trackId: TrackId) {}

  getSnapshot(): LearningPlanSnapshot | null {
    return getLearningPlanSnapshot(this.trackId);
  }

  get(): LearningPlan | null {
    return this.getSnapshot()?.plan ?? null;
  }

  saveAtomically(plan: LearningPlan, expectedGoalRevision: number | null, expectedPlanStorageRevision: number | null): LearningPlanSnapshot {
    return saveLearningPlanAtomically({ trackId: this.trackId, plan, expectedGoalRevision, expectedPlanStorageRevision });
  }
}

export function saveLearningPlanAtomically(input: SaveLearningPlanAtomicallyInput): LearningPlanSnapshot;
export function saveLearningPlanAtomically(trackId: TrackId, plan: LearningPlan, expectedGoalRevision: number | null, expectedPlanStorageRevision: number | null): LearningPlanSnapshot;
export function saveLearningPlanAtomically(
  inputOrTrackId: SaveLearningPlanAtomicallyInput | TrackId,
  positionalPlan?: LearningPlan,
  positionalExpectedGoalRevision?: number | null,
  positionalExpectedPlanStorageRevision?: number | null,
): LearningPlanSnapshot {
  const input: SaveLearningPlanAtomicallyInput = typeof inputOrTrackId === "string"
    ? { trackId: inputOrTrackId, plan: positionalPlan!, expectedGoalRevision: positionalExpectedGoalRevision!, expectedPlanStorageRevision: positionalExpectedPlanStorageRevision! }
    : inputOrTrackId;
  const normalized = normalizeLearningPlan(input.plan);
  const trackId = input.trackId ?? normalized.trackId;
  if (trackId !== normalized.trackId) throw new Error("Learning plan track identity does not match its storage key.");
  assertExpectedRevision(input.expectedGoalRevision, "goal");
  assertExpectedRevision(input.expectedPlanStorageRevision, "plan");

  const goalKey = STORAGE_KEYS.goal(trackId);
  const planKey = STORAGE_KEYS.learningPlan(trackId);
  return withCanonicalWriteLocks([goalKey, planKey], () => {
    const currentPlanRaw = readCanonicalEnvelope(planKey, (value): value is LearningPlan => isLearningPlanV1ForTrack(value, trackId));
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
        const raced = readCanonicalEnvelope(planKey, (value): value is LearningPlan => isLearningPlanV1ForTrack(value, trackId));
        throw new StaleLearningPlanStorageRevisionError(input.expectedPlanStorageRevision, raced?.revision ?? null);
      }
      throw error;
    }
  });
}

function freezeSnapshot(envelope: CanonicalRecordEnvelope<LearningPlan>): LearningPlanSnapshot {
  return Object.freeze({ plan: normalizeLearningPlan(envelope.payload), revision: envelope.revision });
}

function assertExpectedRevision(value: number | null, label: string): void {
  if (value !== null && (!Number.isSafeInteger(value) || value < 1)) throw new RangeError(`Expected ${label} revision must be a positive integer or null.`);
}

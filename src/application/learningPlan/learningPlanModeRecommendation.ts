import type { ProductModeConfig } from "../../content/canonical/productModeConfig";
import type { LearningPlanExecutionPolicy } from "../../domain/learning/learningPlan";
import type { TrainingSession } from "../../domain/learning/trainingSession";
import type { FamilyPlanningModeBinding } from "../trainingLifecycle/contracts";
import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";

export type LearningPlanModeRecommendation = Readonly<{
  mode: ProductModeConfig;
  requestedLength: number;
  continuation: Readonly<{ kind: "continue_existing"; sessionId: string; requestedLength: number }> | null;
  /** Canonical due-queue request, retained for horizon planning even before an entry is due. */
  reviewMode: ProductModeConfig | null;
  executionPolicy: LearningPlanExecutionPolicy;
  phase: "diagnosis" | "practice" | "review";
  diagnosis: "scheduled" | "active" | "completed" | "abandoned" | "not_available";
}>;

export class ActiveSessionPlanningError extends Error {
  constructor(readonly reason: "another_track_active" | "active_session_not_indexed" | "active_session_mode_unavailable" | "active_session_length_unavailable") {
    super("An active session cannot be used for this learning-plan request.");
  }
}

/**
 * Resolves one Home/proposal request from the exact canonical product modes.
 * Diagnosis history is track-level so replanning or content-cost versioning
 * cannot silently schedule the one-off diagnosis again.
 */
export function recommendLearningPlanMode(input: Readonly<{
  binding: FamilyPlanningModeBinding;
  trackId: string;
  modes: readonly ProductModeConfig[];
  sessions: readonly TrainingSession[];
  activeSession?: TrainingSession | null;
  dueReviewCount: number;
}>): LearningPlanModeRecommendation {
  assertPlanningModeBinding(input.binding, input.trackId);
  if (input.modes.length === 0 || !Number.isSafeInteger(input.dueReviewCount) || input.dueReviewCount < 0 || input.modes.some((mode) => mode.trackId !== input.trackId)) throw new RangeError("Canonical planning modes are invalid.");
  const byId = new Map(input.modes.map((mode) => [mode.modeId, mode]));
  if (byId.size !== input.modes.length) throw new RangeError("Canonical planning modes contain duplicate identities.");
  const indexedActive = input.sessions.filter((session) => session.status === "active");
  const active = input.activeSession ?? null;
  if (indexedActive.length > 1 || ((input.activeSession === undefined || active === null) && indexedActive.length > 0)) {
    throw new ActiveSessionPlanningError("active_session_not_indexed");
  }
  if (active) {
    if (active.status !== "active" || active.trackId !== input.trackId) throw new ActiveSessionPlanningError("another_track_active");
    const indexed = indexedActive.find((session) => session.id === active.id);
    if (!indexed || canonicalSerialize(indexed) !== canonicalSerialize(active)) throw new ActiveSessionPlanningError("active_session_not_indexed");
  }
  const diagnostic = input.binding.diagnosticModeId === null ? null : byId.get(input.binding.diagnosticModeId) ?? null;
  if (input.binding.diagnosticModeId !== null && (!diagnostic || diagnostic.trackId !== input.trackId || diagnostic.availability !== "immediate" || diagnostic.selection.kind !== "exact_ordered_questions" || !diagnostic.requestedLengths.includes(diagnostic.defaultRequestedLength))) {
    throw new Error("The family planning binding has no legal diagnostic mode for this canonical track.");
  }
  const practice = byId.get(input.binding.practiceModeId);
  if (!practice || practice.trackId !== input.trackId || practice.availability !== "immediate" || practice.selection.kind !== "node" || !practice.requestedLengths.includes(practice.defaultRequestedLength)) throw new Error("The family planning binding has no legal recurring practice request for this canonical track.");
  const reviewMode = input.binding.dueReviewModeId === null ? null : byId.get(input.binding.dueReviewModeId) ?? null;
  if (input.binding.dueReviewModeId !== null && (!reviewMode || reviewMode.trackId !== input.trackId || reviewMode.availability !== "evidence_conditioned" || reviewMode.selection.kind !== "evidence_conditioned" || !reviewMode.selection.evidenceSources.includes("due_queue") || !reviewMode.requestedLengths.includes(reviewMode.defaultRequestedLength))) {
    throw new Error("The family planning binding has no legal due-review mode for this canonical track.");
  }

  const diagnosticSessions = diagnostic ? input.sessions.filter((session) => session.trackId === input.trackId && session.modeId === diagnostic.modeId) : [];
  const diagnosis = !diagnostic ? "not_available" as const
    : diagnosticSessions.some((session) => session.status === "active") ? "active" as const
      : diagnosticSessions.some((session) => session.status === "completed") ? "completed" as const
        : diagnosticSessions.some((session) => session.status === "abandoned") ? "abandoned" as const
          : "scheduled" as const;
  const selectedReview = input.dueReviewCount > 0 ? reviewMode ?? undefined : undefined;
  const activeMode = active ? byId.get(active.modeId) : undefined;
  if (active && (!activeMode || activeMode.availability !== "immediate" && activeMode.availability !== "evidence_conditioned" || activeMode.timer.kind !== "elapsed_foreground")) {
    throw new ActiveSessionPlanningError("active_session_mode_unavailable");
  }
  if (active && (!activeMode!.requestedLengths.includes(active.requestedLength) || active.actualLength !== active.itemOrder.length ||
    active.actualLength < 1 || active.actualLength > active.requestedLength)) {
    throw new ActiveSessionPlanningError("active_session_length_unavailable");
  }
  const mode = activeMode ?? (diagnosis === "active" ? diagnostic : selectedReview ?? (diagnosis === "scheduled" ? diagnostic : undefined) ?? practice);
  if (!mode) throw new Error("This canonical track has no legal next request.");
  const requestedLength = active?.requestedLength ?? mode.defaultRequestedLength;
  if (!mode.requestedLengths.includes(requestedLength)) throw new Error("The canonical next request has an unsupported length.");
  return Object.freeze({
    mode,
    requestedLength,
    continuation: active ? Object.freeze({ kind: "continue_existing", sessionId: active.id, requestedLength: active.requestedLength }) : null,
    reviewMode,
    executionPolicy: Object.freeze({
      policyVersion: "patternly-learning-execution-v1",
      initialDiagnosis: diagnostic ? Object.freeze({ modeId: diagnostic.modeId, requestedLength: diagnostic.defaultRequestedLength }) : null,
      practice: Object.freeze({ modeId: practice.modeId, requestedLength: practice.defaultRequestedLength }),
    }),
    phase: mode === diagnostic ? "diagnosis" : mode.selection.kind === "evidence_conditioned" ? "review" : "practice",
    diagnosis,
  });
}

function assertPlanningModeBinding(value: FamilyPlanningModeBinding, trackId: string): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RangeError("A family planning-mode binding is required.");
  const keys = Object.keys(value).sort();
  if (keys.join("|") !== "diagnosticModeId|dueReviewModeId|practiceModeId|trackId" || value.trackId !== trackId ||
    typeof value.practiceModeId !== "string" || value.practiceModeId.trim().length === 0 ||
    !(value.diagnosticModeId === null || typeof value.diagnosticModeId === "string" && value.diagnosticModeId.trim().length > 0) ||
    !(value.dueReviewModeId === null || typeof value.dueReviewModeId === "string" && value.dueReviewModeId.trim().length > 0)) {
    throw new RangeError("The family planning-mode binding is malformed or belongs to a different track.");
  }
  const roles = [value.diagnosticModeId, value.practiceModeId, value.dueReviewModeId].filter((modeId): modeId is string => modeId !== null);
  if (new Set(roles).size !== roles.length) throw new RangeError("The family planning-mode binding reuses a mode across roles.");
}

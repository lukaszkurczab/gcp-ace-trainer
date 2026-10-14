import type { TrainingSession } from "../../domain/learning/trainingSession";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";
import { isTrainingSession } from "../repositories/trainingModelGuards";
import { isAccountWireState } from "../../domain/account/accountWireState";

type TerminalSessionWire = Omit<TrainingSession, "currentItemIndex" | "activeForegroundMs" | "actualLength" | "status"> & Readonly<{
  schemaVersion: "terminal-session-v1";
  status: "completed" | "abandoned";
  durationMs: number;
}>;

/** Explicit projection: prepared-plan evidence stays lossless; mutable runtime state never travels. */
export function projectTerminalSession(session: TrainingSession): TerminalSessionWire {
  if (session.status === "active") throw new Error("active_session_not_syncable");
  return {
    schemaVersion: "terminal-session-v1", id: session.id, trackId: session.trackId, modeId: session.modeId,
    status: session.status, startedAt: session.startedAt, requestedLength: session.requestedLength,
    durationMs: session.activeForegroundMs,
    contentVersion: session.contentVersion, artifactSha256: session.artifactSha256,
    configurationSnapshot: session.configurationSnapshot, itemOrder: session.itemOrder,
    optionOrderByOccurrence: session.optionOrderByOccurrence, conditionalReinsertSlots: session.conditionalReinsertSlots,
    ...(session.completedAt === undefined ? {} : { completedAt: session.completedAt }),
    ...(session.taxonomyVersion === undefined ? {} : { taxonomyVersion: session.taxonomyVersion }),
    ...(session.planFingerprint === undefined ? {} : { planFingerprint: session.planFingerprint }),
    ...(session.caseState === undefined ? {} : { caseState: session.caseState }),
    ...(session.caseStates === undefined ? {} : { caseStates: session.caseStates }),
  };
}

/** Existing-store adapter only. A terminal record never owns an active pointer or resumable position. */
export function materializeTerminalSession(state: Readonly<Record<string, unknown>>, admission: TrackAdmissionContext): TrainingSession | null {
  if (typeof state.id !== "string" || typeof state.trackId !== "string" || !isAccountWireState("training_session_summary", state.id, state.trackId, state)) return null;
  const { schemaVersion: _wireVersion, durationMs, ...facts } = state as TerminalSessionWire;
  const actualLength = facts.itemOrder.length;
  const session = { ...facts, actualLength, currentItemIndex: actualLength - 1, activeForegroundMs: durationMs };
  return isTrainingSession(session, admission) ? session : null;
}

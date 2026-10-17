import type { TrainingSession } from "../../domain/learning/trainingSession";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";
import { isTrainingSession } from "../repositories/trainingModelGuards";
import { isAccountWireState } from "../../domain/account/accountWireState";
import type { TerminalSessionWire } from "../../domain/account/terminalSessionWire";
export { projectTerminalSession } from "../../domain/account/terminalSessionWire";

/** Existing-store adapter only. A terminal record never owns an active pointer or resumable position. */
export function materializeTerminalSession(state: Readonly<Record<string, unknown>>, admission: TrackAdmissionContext): TrainingSession | null {
  if (typeof state.id !== "string" || typeof state.trackId !== "string" || !isAccountWireState("training_session_summary", state.id, state.trackId, state)) return null;
  const { schemaVersion: _wireVersion, durationMs, ...facts } = state as TerminalSessionWire;
  const actualLength = facts.itemOrder.length;
  const session = { ...facts, actualLength, currentItemIndex: actualLength - 1, activeForegroundMs: durationMs };
  return isTrainingSession(session, admission) ? session : null;
}

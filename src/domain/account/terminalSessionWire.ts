import { createTrainingSession, type TrainingSession } from "../learning/trainingSession";
import { accountDataRecordFingerprint } from "../identity/recordFingerprint";
import { isAccountWireState } from "./accountWireState";

export type TerminalSessionWire = Omit<TrainingSession, "currentItemIndex" | "activeForegroundMs" | "actualLength" | "status"> & Readonly<{
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

type RemoteRecord = Readonly<{
  recordType: string;
  targetId: string;
  trackId: string;
  state: Readonly<Record<string, unknown>>;
  fingerprint: string;
}>;

/** GET-only compatibility for persisted terminal runtime summaries. New writes stay strict. */
export function normalizeLegacyTerminalSessionRead<T extends RemoteRecord>(record: T): T {
  if (record.recordType !== "training_session_summary" || Object.hasOwn(record.state, "schemaVersion")) return record;
  const state = record.state;
  if (Object.hasOwn(state, "durationMs")) throw new Error("legacy_terminal_session_invalid");
  const { currentItemIndex, activeForegroundMs, actualLength, ...facts } = state;
  const projected = { ...facts, schemaVersion: "terminal-session-v1", durationMs: activeForegroundMs };
  // Projecting first into the closed wire shape rejects every unknown legacy field,
  // active status, missing fact and malformed nested record without stripping it.
  if (!isAccountWireState(record.recordType, record.targetId, record.trackId, projected)) throw new Error("legacy_terminal_session_invalid");
  const original = { recordId: record.targetId, recordType: "training_session_summary" as const, trackId: record.trackId, state };
  if (record.fingerprint !== accountDataRecordFingerprint(original)) throw new Error("legacy_terminal_session_fingerprint_invalid");
  const session = createTrainingSession({ ...facts, currentItemIndex, activeForegroundMs, actualLength } as TrainingSession);
  const canonical = projectTerminalSession(session);
  return { ...record, state: canonical, fingerprint: accountDataRecordFingerprint({ ...original, state: canonical }) };
}

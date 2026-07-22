export type SimulationTraceOperationKind = "submit_save" | "navigation" | "timer_tick" | "projection_emission" | "screen_render" | "selector_render" | "recovery_replay";
export type SimulationTraceResult = "started" | "succeeded" | "rejected";

/** Development-only, append-only observation stream. It never participates in product state. */
export type SimulationTraceRecord = Readonly<{
  sessionId: string;
  operationId: string;
  operationKind: SimulationTraceOperationKind;
  idempotencyKey: string;
  interactionType: string | null;
  itemId: string | null;
  ordinalBefore: number | null;
  ordinalAfter: number | null;
  currentItemIdBefore: string | null;
  currentItemIdAfter: string | null;
  draftStatus: "missing" | "present" | "saved" | "rejected";
  responseIdentity: string | null;
  journalRevisionBefore: number | null;
  journalRevisionAfter: number | null;
  aggregateRevisionBefore: number | null;
  aggregateRevisionAfter: number | null;
  projectionRevisionBefore: number | null;
  projectionRevisionAfter: number | null;
  queueSequence: number;
  timerRevision: number | null;
  navigationRevision: number | null;
  routeKey: string | null;
  screenItemId: string | null;
  selectorItemId: string | null;
  result: SimulationTraceResult;
  typedError: string | null;
  timestamp: string;
}>;

const MAX_RECORDS = 2_000;
let sequence = 0;
const records: SimulationTraceRecord[] = [];

export function recordSimulationTrace(input: Omit<SimulationTraceRecord, "queueSequence" | "timestamp">): SimulationTraceRecord | null {
  if (typeof __DEV__ !== "undefined" && !__DEV__) return null;
  const record = Object.freeze({ ...input, queueSequence: ++sequence, timestamp: new Date().toISOString() });
  records.push(record);
  if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
  return record;
}

export function readSimulationTrace(): readonly SimulationTraceRecord[] { return Object.freeze([...records]); }
export function clearSimulationTrace(): void { records.length = 0; sequence = 0; }

export function simulationTraceIdentity(input: Readonly<{ sessionId: string; operationKind: SimulationTraceOperationKind; ordinal: number | null; itemId: string | null; revision: number | null }>): string {
  return [input.sessionId, input.operationKind, input.ordinal ?? "none", input.itemId ?? "none", input.revision ?? "none"].join(":");
}

import { prepareContentReportDescription, type ContentReportInput, type ContentReportOutboxEntry, type ContentReportOutboxStatus } from "../../domain";
import { PatternlyApiClientError, type CreateContentReportDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { getPatternlyAppCheckToken } from "../../infrastructure/clients/patternlyAppCheckToken";
import { createContentReportSubmissionId } from "../../infrastructure/identity/contentReportSubmissionIdentity";
import { getContentReportOutbox, removeContentReportOutboxEntry, updateContentReportOutboxStatus, upsertContentReportOutboxEntry } from "../../storage/repositories/contentReportOutboxRepository";

export type ContentReportTransport = Readonly<{ create: (input: CreateContentReportDto, appCheckToken: string) => Promise<Readonly<{ duplicate: boolean }>> }>;
export type ContentReportSubmissionResult = Readonly<{ status: ContentReportOutboxStatus; entry: ContentReportOutboxEntry; reason?: string }>;

type RuntimeRegistration = Readonly<{ generation: number; transport: ContentReportTransport }>;
export type ContentReportRuntimeRegistration = Readonly<{
  ready: Promise<readonly ContentReportOutboxEntry[]>;
  unregister: () => void;
}>;

let submissionLane: Promise<void> = Promise.resolve();
let runtimeRegistration: RuntimeRegistration | null = null;
let registrationGeneration = 0;

function runSerialized<T>(operation: () => Promise<T>): Promise<T> {
  const run = submissionLane.then(operation);
  submissionLane = run.then(() => undefined, () => undefined);
  return run;
}

function isCurrentRegistration(generation: number | null): boolean {
  return generation === null || runtimeRegistration?.generation === generation;
}

function generationForTransport(transport: ContentReportTransport): number | null {
  return runtimeRegistration?.transport === transport ? runtimeRegistration.generation : null;
}

/** Installs the sole transport after account API and App Check composition are ready.
 * The returned handle can only unregister its own generation. */
export function registerContentReportRuntimeTransport(transport: ContentReportTransport): ContentReportRuntimeRegistration {
  const generation = ++registrationGeneration;
  runtimeRegistration = Object.freeze({ generation, transport });
  const ready = runSerialized(() => flushContentReportOutboxUnlocked(transport, generation));
  return Object.freeze({
    ready,
    unregister: () => {
      if (runtimeRegistration?.generation !== generation) return;
      runtimeRegistration = null;
      registrationGeneration += 1;
    },
  });
}

export function createContentReportTransport(client: Readonly<{ createContentReport: (input: CreateContentReportDto, appCheckToken: string) => Promise<Readonly<{ duplicate: boolean }>> }>): ContentReportTransport {
  return Object.freeze({ create: (input, appCheckToken) => client.createContentReport(input, appCheckToken) });
}

export function createQueuedContentReport(input: Omit<ContentReportInput, "clientSubmissionId"> & Partial<Pick<ContentReportInput, "clientSubmissionId">>): ContentReportOutboxEntry {
  const now = new Date().toISOString();
  const safeInput = { ...input, description: prepareContentReportDescription(input.description) };
  const entry: ContentReportOutboxEntry = {
    input: { ...safeInput, clientSubmissionId: input.clientSubmissionId ?? createContentReportSubmissionId() },
    status: "queued",
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
    lastErrorCode: null,
  };
  const existing = getContentReportOutbox().find((candidate) => candidate.input.clientSubmissionId === entry.input.clientSubmissionId);
  if (existing) {
    if (JSON.stringify(existing.input) !== JSON.stringify(entry.input)) throw new Error("Content report submission identity was reused with different data.");
    return existing;
  }
  return upsertContentReportOutboxEntry(entry);
}

export async function submitContentReport(input: Omit<ContentReportInput, "clientSubmissionId"> & Partial<Pick<ContentReportInput, "clientSubmissionId">>, transport?: ContentReportTransport): Promise<ContentReportSubmissionResult> {
  const entry = createQueuedContentReport(input);
  if (!transport) return Object.freeze({ status: entry.status, entry });
  const generation = generationForTransport(transport);
  return runSerialized(() => submitOutboxEntry(entry.input.clientSubmissionId, transport, generation, entry));
}

export async function retryContentReport(clientSubmissionId: string, transport?: ContentReportTransport): Promise<ContentReportSubmissionResult> {
  if (!transport) {
    const entry = getContentReportOutbox().find((candidate) => candidate.input.clientSubmissionId === clientSubmissionId);
    if (!entry) throw new Error("Content report outbox entry is unavailable.");
    if (entry.status === "accepted") return Object.freeze({ status: entry.status, entry });
    const queued = updateContentReportOutboxStatus(clientSubmissionId, "queued", { updatedAt: new Date().toISOString(), lastErrorCode: null });
    return Object.freeze({ status: queued.status, entry: queued });
  }
  const generation = generationForTransport(transport);
  return runSerialized(async () => {
    const entry = getContentReportOutbox().find((candidate) => candidate.input.clientSubmissionId === clientSubmissionId);
    if (!entry) throw new Error("Content report outbox entry is unavailable.");
    if (entry.status === "accepted") return Object.freeze({ status: entry.status, entry });
    if (!isCurrentRegistration(generation)) return Object.freeze({ status: entry.status, entry, reason: "runtime_unavailable" });
    updateContentReportOutboxStatus(clientSubmissionId, "queued", { updatedAt: new Date().toISOString(), lastErrorCode: null });
    return submitOutboxEntry(clientSubmissionId, transport, generation);
  });
}

export async function flushContentReportOutbox(transport?: ContentReportTransport): Promise<readonly ContentReportOutboxEntry[]> {
  if (!transport) return getContentReportOutbox();
  return runSerialized(() => flushContentReportOutboxUnlocked(transport, generationForTransport(transport)));
}

async function flushContentReportOutboxUnlocked(transport: ContentReportTransport, generation: number | null): Promise<readonly ContentReportOutboxEntry[]> {
  for (const entry of getContentReportOutbox()) {
    if (!isCurrentRegistration(generation)) return getContentReportOutbox();
    if (entry.status === "accepted") continue;
    await submitOutboxEntry(entry.input.clientSubmissionId, transport, generation);
  }
  return getContentReportOutbox();
}

export function readContentReportTransport(): Readonly<{ kind: "available"; transport: ContentReportTransport } | { kind: "unavailable"; reason: "backend_unconfigured" }> {
  if (runtimeRegistration) return Object.freeze({ kind: "available" as const, transport: runtimeRegistration.transport });
  return Object.freeze({ kind: "unavailable", reason: "backend_unconfigured" as const });
}

export async function submitContentReportFromConfiguredRuntime(input: Omit<ContentReportInput, "clientSubmissionId"> & Partial<Pick<ContentReportInput, "clientSubmissionId">>): Promise<ContentReportSubmissionResult> {
  const runtime = readContentReportTransport();
  if (runtime.kind !== "available") return submitContentReport(input);
  return submitContentReport(input, runtime.transport);
}

async function submitOutboxEntry(clientSubmissionId: string, transport: ContentReportTransport, generation: number | null, completedConcurrentEntry?: ContentReportOutboxEntry): Promise<ContentReportSubmissionResult> {
  const entry = getContentReportOutbox().find((candidate) => candidate.input.clientSubmissionId === clientSubmissionId);
  if (!entry) {
    if (completedConcurrentEntry) return Object.freeze({ status: "accepted", entry: Object.freeze({ ...completedConcurrentEntry, status: "accepted", lastErrorCode: null }) });
    throw new Error("Content report outbox entry is unavailable.");
  }
  if (entry.status === "accepted") return Object.freeze({ status: entry.status, entry });
  if (!isCurrentRegistration(generation)) return Object.freeze({ status: entry.status, entry, reason: "runtime_unavailable" });
  const attemptCount = entry.attemptCount + 1;
  const retrying = updateContentReportOutboxStatus(clientSubmissionId, "retrying", { attemptCount, updatedAt: new Date().toISOString(), lastErrorCode: null });
  const appCheckToken = await getPatternlyAppCheckToken();
  if (!isCurrentRegistration(generation)) return Object.freeze({ status: retrying.status, entry: retrying, reason: "runtime_unavailable" });
  if (!appCheckToken) {
    const failed = updateContentReportOutboxStatus(clientSubmissionId, "failed", { updatedAt: new Date().toISOString(), lastErrorCode: "app_check_unavailable" });
    return Object.freeze({ status: failed.status, entry: failed, reason: "app_check_unavailable" });
  }
  try {
    await transport.create(toApiInput(retrying.input), appCheckToken);
    if (!isCurrentRegistration(generation)) return Object.freeze({ status: retrying.status, entry: retrying, reason: "runtime_unavailable" });
    const accepted: ContentReportOutboxEntry = Object.freeze({ ...retrying, status: "accepted", updatedAt: new Date().toISOString(), lastErrorCode: null });
    try {
      removeContentReportOutboxEntry(clientSubmissionId);
      return Object.freeze({ status: accepted.status, entry: accepted });
    } catch {
      return Object.freeze({ status: retrying.status, entry: retrying, reason: "local_cleanup_failed" });
    }
  } catch (error) {
    if (!isCurrentRegistration(generation)) return Object.freeze({ status: retrying.status, entry: retrying, reason: "runtime_unavailable" });
    const failed = updateContentReportOutboxStatus(clientSubmissionId, "failed", { updatedAt: new Date().toISOString(), lastErrorCode: reportErrorCode(error) });
    return Object.freeze({ status: failed.status, entry: failed, reason: failed.lastErrorCode ?? undefined });
  }
}

function toApiInput(input: ContentReportInput): CreateContentReportDto {
  return input;
}

function reportErrorCode(error: unknown): string {
  if (error instanceof PatternlyApiClientError) return error.serverCode ?? error.code;
  return "transport_failed";
}

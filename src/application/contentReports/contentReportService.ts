import type { ContentReportInput, ContentReportOutboxEntry, ContentReportOutboxStatus } from "../../domain";
import { PatternlyApiClientError, type CreateContentReportDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { getPatternlyAppCheckToken } from "../../infrastructure/clients/patternlyAppCheckToken";
import { readPatternlyBackendRuntime } from "../../infrastructure/clients/patternlyBackendRuntime";
import { createContentReportSubmissionId } from "../../infrastructure/identity/contentReportSubmissionIdentity";
import { getContentReportOutbox, updateContentReportOutboxStatus, upsertContentReportOutboxEntry } from "../../storage/repositories/contentReportOutboxRepository";

export type ContentReportTransport = Readonly<{ create: (input: CreateContentReportDto, appCheckToken: string) => Promise<Readonly<{ duplicate: boolean }>> }>;
export type ContentReportSubmissionResult = Readonly<{ status: ContentReportOutboxStatus; entry: ContentReportOutboxEntry; reason?: string }>;

let flushLane: Promise<readonly ContentReportOutboxEntry[]> = Promise.resolve([]);

export function createQueuedContentReport(input: Omit<ContentReportInput, "clientSubmissionId"> & Partial<Pick<ContentReportInput, "clientSubmissionId">>): ContentReportOutboxEntry {
  const now = new Date().toISOString();
  const entry: ContentReportOutboxEntry = {
    input: { ...input, clientSubmissionId: input.clientSubmissionId ?? createContentReportSubmissionId() },
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
  return submitOutboxEntry(entry.input.clientSubmissionId, transport);
}

export async function retryContentReport(clientSubmissionId: string, transport?: ContentReportTransport): Promise<ContentReportSubmissionResult> {
  const entry = getContentReportOutbox().find((candidate) => candidate.input.clientSubmissionId === clientSubmissionId);
  if (!entry) throw new Error("Content report outbox entry is unavailable.");
  if (entry.status === "accepted") return Object.freeze({ status: entry.status, entry });
  const queued = updateContentReportOutboxStatus(clientSubmissionId, "queued", { updatedAt: new Date().toISOString(), lastErrorCode: null });
  if (!transport) return Object.freeze({ status: queued.status, entry: queued });
  return submitOutboxEntry(clientSubmissionId, transport);
}

export async function flushContentReportOutbox(transport?: ContentReportTransport): Promise<readonly ContentReportOutboxEntry[]> {
  if (!transport) return getContentReportOutbox();
  const operation = flushLane.then(async () => {
    for (const entry of getContentReportOutbox()) {
      if (entry.status === "accepted") continue;
      await submitOutboxEntry(entry.input.clientSubmissionId, transport);
    }
    return getContentReportOutbox();
  });
  flushLane = operation.catch(() => getContentReportOutbox());
  return operation;
}

export function readContentReportTransport(): Readonly<{ kind: "available"; transport: ContentReportTransport } | { kind: "unavailable"; reason: "backend_unconfigured" }> {
  const runtime = readPatternlyBackendRuntime();
  if (runtime.kind !== "configured") return Object.freeze({ kind: "unavailable", reason: "backend_unconfigured" as const });
  return Object.freeze({ kind: "available" as const, transport: { create: async (input: CreateContentReportDto, appCheckToken: string) => runtime.client.createContentReport(input, appCheckToken) } });
}

export async function submitContentReportFromConfiguredRuntime(input: Omit<ContentReportInput, "clientSubmissionId"> & Partial<Pick<ContentReportInput, "clientSubmissionId">>): Promise<ContentReportSubmissionResult> {
  const runtime = readContentReportTransport();
  if (runtime.kind !== "available") return submitContentReport(input);
  return submitContentReport(input, runtime.transport);
}

async function submitOutboxEntry(clientSubmissionId: string, transport: ContentReportTransport): Promise<ContentReportSubmissionResult> {
  const entry = getContentReportOutbox().find((candidate) => candidate.input.clientSubmissionId === clientSubmissionId);
  if (!entry) throw new Error("Content report outbox entry is unavailable.");
  if (entry.status === "accepted") return Object.freeze({ status: entry.status, entry });
  const attemptCount = entry.attemptCount + 1;
  const retrying = updateContentReportOutboxStatus(clientSubmissionId, "retrying", { attemptCount, updatedAt: new Date().toISOString(), lastErrorCode: null });
  const appCheckToken = await getPatternlyAppCheckToken();
  if (!appCheckToken) {
    const failed = updateContentReportOutboxStatus(clientSubmissionId, "failed", { updatedAt: new Date().toISOString(), lastErrorCode: "app_check_unavailable" });
    return Object.freeze({ status: failed.status, entry: failed, reason: "app_check_unavailable" });
  }
  try {
    await transport.create(toApiInput(retrying.input), appCheckToken);
    const accepted = updateContentReportOutboxStatus(clientSubmissionId, "accepted", { updatedAt: new Date().toISOString(), lastErrorCode: null });
    return Object.freeze({ status: accepted.status, entry: accepted });
  } catch (error) {
    const failed = updateContentReportOutboxStatus(clientSubmissionId, "failed", { updatedAt: new Date().toISOString(), lastErrorCode: reportErrorCode(error) });
    return Object.freeze({ status: failed.status, entry: failed, reason: failed.lastErrorCode ?? undefined });
  }
}

function toApiInput(input: ContentReportInput): CreateContentReportDto {
  return input;
}

function reportErrorCode(error: unknown): string {
  if (error instanceof PatternlyApiClientError) return error.serverCode ?? error.code;
  if (error instanceof Error && error.message.trim()) return error.message;
  return "transport_failed";
}

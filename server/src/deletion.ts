import { createHash } from "node:crypto";

import type { AccountLifecyclePort } from "./accountLifecycle.js";
import type { DeletionProof } from "./firebaseAdapters.js";

export interface AccountDeletionPort extends AccountLifecyclePort {
  deleteIdentity(uid: string): Promise<void>;
  deleteRemoteData(uid: string): Promise<void>;
  readDeletionProof(requestId: string): Promise<DeletionProof | undefined>;
  recordDeletionProof(proof: DeletionProof): Promise<void>;
  revokeSessions(uid: string): Promise<void>;
}

export async function deleteAccountRemotely(input: Readonly<{
  now: () => Date;
  port: AccountDeletionPort;
  requestId: string;
  requestedAt: string;
  uid: string;
}>): Promise<DeletionProof> {
  if (!/^[A-Za-z0-9_-]{16,128}$/u.test(input.requestId)) throw new Error("invalid_request_id");
  if (input.uid.length === 0 || input.uid.length > 128 || /[\u0000-\u001f\u007f]/u.test(input.uid)) {
    throw new Error("invalid_uid");
  }
  const operationStartedAt = input.now();
  if (Number.isNaN(operationStartedAt.valueOf())) throw new Error("invalid_operation_time");
  const requestedAt = new Date(input.requestedAt);
  if (Number.isNaN(requestedAt.valueOf()) || requestedAt.toISOString() !== input.requestedAt || requestedAt > operationStartedAt) {
    throw new Error("invalid_requested_at");
  }
  const irreversibleAccountIdHash = createHash("sha256").update(input.uid).digest("hex");
  const existingProof = await input.port.readDeletionProof(input.requestId);
  if (existingProof) {
    const completedAt = new Date(existingProof.completedAt);
    const identicalRequest = existingProof.requestId === input.requestId
      && existingProof.irreversibleAccountIdHash === irreversibleAccountIdHash
      && existingProof.requestedAt === input.requestedAt
      && existingProof.resultCode === "account_deleted"
      && !Number.isNaN(completedAt.valueOf())
      && completedAt.toISOString() === existingProof.completedAt
      && completedAt >= requestedAt
      && completedAt <= operationStartedAt
      && Object.keys(existingProof).length === 5;
    if (!identicalRequest) throw new Error("deletion_proof_collision");
    return existingProof;
  }
  await input.port.writeDeletionIntent(input.uid, input.requestId, requestedAt.toISOString());
  await input.port.revokeSessions(input.uid);
  await input.port.deleteRemoteData(input.uid);
  await input.port.deleteIdentity(input.uid);
  const completedAt = input.now();
  if (Number.isNaN(completedAt.valueOf()) || completedAt < operationStartedAt) throw new Error("invalid_operation_time");
  const proof: DeletionProof = {
    requestId: input.requestId,
    irreversibleAccountIdHash,
    requestedAt: requestedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    resultCode: "account_deleted",
  };
  await input.port.recordDeletionProof(proof);
  return proof;
}

export type DeletionProofCleanupCursor = Readonly<{ completedAt: string; documentId: string }>;

export interface DeletionProofCleanupPort {
  cleanupExpiredProofs(
    expiryIso: string,
    cursor: DeletionProofCleanupCursor | undefined,
    limit: number,
  ): Promise<Readonly<{ cursor?: DeletionProofCleanupCursor; deleted: number }>>;
  hasExpiredProof(expiryIso: string): Promise<boolean>;
}

export type DeletionProofCleanupResult = Readonly<{
  attempts: number;
  deleted: number;
  outcome: "complete" | "cleanup_incomplete_retryable";
}>;

const RETENTION_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000;
const PAGE_SIZE = 100;
const MAX_ATTEMPTS = 20;
const MAX_DELETIONS = 2_000;
const TIME_BUDGET_MILLISECONDS = 240_000;
const REQUIRED_REMAINING_MILLISECONDS = 10_000;

export async function cleanupDeletionProofs(input: Readonly<{
  clockMilliseconds: () => number;
  now: Date;
  port: DeletionProofCleanupPort;
}>): Promise<DeletionProofCleanupResult> {
  const startedAt = input.clockMilliseconds();
  const expiryIso = new Date(input.now.valueOf() - RETENTION_MILLISECONDS).toISOString();
  let attempts = 0;
  let deleted = 0;
  let cursor: DeletionProofCleanupCursor | undefined;

  const hasRequiredTime = (): boolean =>
    TIME_BUDGET_MILLISECONDS - (input.clockMilliseconds() - startedAt) >= REQUIRED_REMAINING_MILLISECONDS;

  try {
    while (attempts < MAX_ATTEMPTS && deleted < MAX_DELETIONS && hasRequiredTime()) {
      attempts += 1;
      const page = await input.port.cleanupExpiredProofs(expiryIso, cursor, PAGE_SIZE);
      if (!Number.isInteger(page.deleted) || page.deleted < 0 || page.deleted > PAGE_SIZE) {
        return { attempts, deleted, outcome: "cleanup_incomplete_retryable" };
      }
      if (page.deleted > 0 && page.cursor === undefined) {
        return { attempts, deleted, outcome: "cleanup_incomplete_retryable" };
      }
      deleted += page.deleted;
      cursor = page.cursor;
      if (page.deleted === 0) break;
    }
  } catch {
    return { attempts, deleted, outcome: "cleanup_incomplete_retryable" };
  }

  if (!hasRequiredTime()) return { attempts, deleted, outcome: "cleanup_incomplete_retryable" };
  try {
    const incomplete = await input.port.hasExpiredProof(expiryIso);
    return { attempts, deleted, outcome: incomplete ? "cleanup_incomplete_retryable" : "complete" };
  } catch {
    return { attempts, deleted, outcome: "cleanup_incomplete_retryable" };
  }
}

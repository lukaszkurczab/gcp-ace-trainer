import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";

export type AccountSignOutState = Readonly<{
  accountId: string;
  operationId: string;
  status: "pending" | "remoteRevoked" | "localCleanupPending";
  lastFailureCode: string | null;
}>;

export type AccountDeletionState = Readonly<{
  accountId: string;
  accountUidHash: string;
  operationId: string;
  status: "remotePending" | "remoteDeleted" | "localCleanupPending" | "complete" | "failed";
  proofId: string | null;
  lastFailureCode: string | null;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
const isSignOutState = (value: unknown): value is AccountSignOutState => isRecord(value) && typeof value.accountId === "string" && isUuid(value.operationId) && ["pending", "remoteRevoked", "localCleanupPending"].includes(String(value.status)) && (value.lastFailureCode === null || typeof value.lastFailureCode === "string");
const isDeletionState = (value: unknown): value is AccountDeletionState => isRecord(value) && typeof value.accountId === "string" && typeof value.accountUidHash === "string" && isUuid(value.operationId) && ["remotePending", "remoteDeleted", "localCleanupPending", "complete", "failed"].includes(String(value.status)) && (value.proofId === null || typeof value.proofId === "string") && (value.lastFailureCode === null || typeof value.lastFailureCode === "string");

function operationId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  try {
    const crypto = require("expo-crypto") as typeof import("expo-crypto");
    return crypto.randomUUID();
  } catch {
    throw new Error("secure_operation_id_unavailable");
  }
}

export function getAccountSignOutState(): AccountSignOutState | null { return readCanonicalJson(STORAGE_KEYS.ACCOUNT_SIGN_OUT, isSignOutState); }
export function beginAccountSignOut(accountId: string): AccountSignOutState {
  const state: AccountSignOutState = { accountId, operationId: operationId(), status: "pending", lastFailureCode: null };
  writeCanonicalJson(STORAGE_KEYS.ACCOUNT_SIGN_OUT, state);
  return state;
}
export function updateAccountSignOutState(state: AccountSignOutState, values: Partial<Pick<AccountSignOutState, "status" | "lastFailureCode">>): AccountSignOutState {
  const next = { ...state, ...values };
  writeCanonicalJson(STORAGE_KEYS.ACCOUNT_SIGN_OUT, next);
  return next;
}
export function clearAccountSignOutState(): void { removeCanonicalValue(STORAGE_KEYS.ACCOUNT_SIGN_OUT); }

export function getAccountDeletionState(): AccountDeletionState | null { return readCanonicalJson(STORAGE_KEYS.ACCOUNT_DELETION, isDeletionState); }
export function beginAccountDeletion(accountId: string, uid: string): AccountDeletionState {
  const state: AccountDeletionState = { accountId, accountUidHash: sha256Utf8(uid), operationId: operationId(), status: "remotePending", proofId: null, lastFailureCode: null };
  writeCanonicalJson(STORAGE_KEYS.ACCOUNT_DELETION, state);
  return state;
}
export function updateAccountDeletionState(state: AccountDeletionState, values: Partial<Pick<AccountDeletionState, "status" | "proofId" | "lastFailureCode">>): AccountDeletionState {
  const next = { ...state, ...values };
  writeCanonicalJson(STORAGE_KEYS.ACCOUNT_DELETION, next);
  return next;
}
export function clearAccountDeletionState(): void { removeCanonicalValue(STORAGE_KEYS.ACCOUNT_DELETION); }
export function markAccountDeletionComplete(state: AccountDeletionState): AccountDeletionState { return updateAccountDeletionState(state, { status: "complete", lastFailureCode: null }); }

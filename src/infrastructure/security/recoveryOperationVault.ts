export type RecoveryOperationStatus = "in_progress" | "result_available" | "acknowledged" | "delivery_unconfirmed" | "superseded" | "expired_or_invalid" | "provider_retryable";

export type RecoveryIssueVaultBaseRecord = Readonly<{
  version: 1;
  kind: "issue";
  operationId: string;
  firebaseUid: string;
  authorizationGeneration: number;
  status: RecoveryOperationStatus;
  generationId: string | null;
  codes: readonly string[] | null;
  savedIntent: boolean;
}>;

/** A single previous issue may be retained while a replacement is unresolved. */
export type RecoveryIssueVaultRecord = RecoveryIssueVaultBaseRecord & Readonly<{
  previousIssue?: RecoveryIssueVaultBaseRecord;
  /** Account selected by the user to continue while this older issue stays unresolved. */
  deferredFor?: Readonly<{ firebaseUid: string; authorizationGeneration: number }>;
}>;

export type RecoveryConsumeVaultRecord = Readonly<{
  version: 1;
  kind: "consume";
  operationId: string;
  code: string;
  status: RecoveryOperationStatus;
  expectedFirebaseUid: string | null;
  expectedAuthorizationGeneration: number | null;
}>;

export type RecoveryOperationVaultRecord = RecoveryIssueVaultRecord | RecoveryConsumeVaultRecord;

export type RecoveryOperationVault = Readonly<{
  load: () => Promise<RecoveryOperationVaultRecord | null>;
  save: (record: RecoveryOperationVaultRecord) => Promise<void>;
  clear: () => Promise<void>;
}>;

export type RecoveryOperationSecureStore = Readonly<{
  deleteItemAsync: (key: string, options?: Readonly<Record<string, unknown>>) => Promise<void>;
  getItemAsync: (key: string, options?: Readonly<Record<string, unknown>>) => Promise<string | null>;
  setItemAsync: (key: string, value: string, options?: Readonly<Record<string, unknown>>) => Promise<void>;
}>;

export const RECOVERY_OPERATION_VAULT_KEY = "patternly.security.recovery-operation.v1";
const RECOVERY_CODE_PATTERN = /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u;
const OPERATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const STATUSES = new Set<RecoveryOperationStatus>([
  "in_progress", "result_available", "acknowledged", "delivery_unconfirmed", "superseded", "expired_or_invalid", "provider_retryable",
]);

export class RecoveryOperationVaultError extends Error {
  public constructor(readonly code: "recovery_operation_vault_corrupt" | "recovery_operation_vault_unavailable" | "recovery_operation_vault_write_failed" | "recovery_operation_vault_clear_failed") {
    super(code);
    this.name = "RecoveryOperationVaultError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[], optional: readonly string[] = []): boolean {
  const actual = Object.keys(value).sort();
  const allowed = new Set([...keys, ...optional]);
  return keys.every((key) => Object.hasOwn(value, key)) && actual.every((key) => allowed.has(key));
}

function validUid(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128 && value.trim() === value && !/[\u0000-\u001f\u007f]/u.test(value);
}

function validGeneration(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function validNullableGeneration(value: unknown): value is number | null {
  return value === null || validGeneration(value);
}

function validStatus(value: unknown): value is RecoveryOperationStatus {
  return typeof value === "string" && STATUSES.has(value as RecoveryOperationStatus);
}

function parseIssueBase(value: unknown, allowPreviousIssue: boolean, allowDeferredFor = false): RecoveryIssueVaultBaseRecord & { previousIssue?: RecoveryIssueVaultBaseRecord; deferredFor?: Readonly<{ firebaseUid: string; authorizationGeneration: number }> } {
  const issueKeys = ["version", "kind", "operationId", "firebaseUid", "authorizationGeneration", "status", "generationId", "codes", "savedIntent"];
  const optionalKeys = [...(allowPreviousIssue ? ["previousIssue"] : []), ...(allowDeferredFor ? ["deferredFor"] : [])];
  if (!isRecord(value) || !hasExactKeys(value, issueKeys, optionalKeys) || value.version !== 1 || value.kind !== "issue" || !OPERATION_ID_PATTERN.test(String(value.operationId)) || !validStatus(value.status) || !validUid(value.firebaseUid) || !validGeneration(value.authorizationGeneration) || !(value.generationId === null || (typeof value.generationId === "string" && value.generationId.length > 0)) || !(value.codes === null || (Array.isArray(value.codes) && value.codes.length === 10 && value.codes.every((code) => typeof code === "string" && RECOVERY_CODE_PATTERN.test(code)) && new Set(value.codes).size === value.codes.length)) || typeof value.savedIntent !== "boolean") {
    throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
  }
  if ((value.codes === null) !== (value.generationId === null) || (value.savedIntent && value.codes === null)) throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
  const base: RecoveryIssueVaultBaseRecord = Object.freeze({
    version: 1,
    kind: "issue",
    operationId: value.operationId as string,
    firebaseUid: value.firebaseUid,
    authorizationGeneration: value.authorizationGeneration,
    status: value.status,
    generationId: value.generationId,
    codes: value.codes === null ? null : Object.freeze([...value.codes] as string[]),
    savedIntent: value.savedIntent,
  });
  let deferredFor: Readonly<{ firebaseUid: string; authorizationGeneration: number }> | undefined;
  if (Object.hasOwn(value, "deferredFor")) {
    const candidate = value.deferredFor;
    if (!allowDeferredFor || !isRecord(candidate) || !hasExactKeys(candidate, ["firebaseUid", "authorizationGeneration"]) || !validUid(candidate.firebaseUid) || !validGeneration(candidate.authorizationGeneration) || (candidate.firebaseUid === base.firebaseUid && candidate.authorizationGeneration === base.authorizationGeneration)) {
      throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
    }
    deferredFor = Object.freeze({ firebaseUid: candidate.firebaseUid, authorizationGeneration: candidate.authorizationGeneration });
  }
  if (!Object.hasOwn(value, "previousIssue")) return deferredFor ? Object.freeze({ ...base, deferredFor }) : base;

  const previousIssue = parseIssueBase(value.previousIssue, false);
  if (previousIssue.operationId === base.operationId
    || previousIssue.firebaseUid !== base.firebaseUid
    || previousIssue.authorizationGeneration !== base.authorizationGeneration
    || previousIssue.status !== "delivery_unconfirmed"
    || base.codes !== null
    || base.savedIntent) {
    throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
  }
  return Object.freeze({ ...base, previousIssue, ...(deferredFor ? { deferredFor } : {}) });
}

function parseRecord(value: unknown): RecoveryOperationVaultRecord {
  if (!isRecord(value) || value.version !== 1 || typeof value.kind !== "string" || !OPERATION_ID_PATTERN.test(String(value.operationId)) || !validStatus(value.status)) {
    throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
  }
  if (value.kind === "issue") {
    return parseIssueBase(value, true, true);
  }
  if (value.kind === "consume" && hasExactKeys(value, ["version", "kind", "operationId", "code", "status", "expectedFirebaseUid", "expectedAuthorizationGeneration"]) && typeof value.code === "string" && RECOVERY_CODE_PATTERN.test(value.code) && (value.expectedFirebaseUid === null || validUid(value.expectedFirebaseUid)) && validNullableGeneration(value.expectedAuthorizationGeneration)) {
    if ((value.expectedFirebaseUid === null) !== (value.expectedAuthorizationGeneration === null)) throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
    if (value.status === "result_available" && value.expectedFirebaseUid === null) throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
    return Object.freeze({
      version: 1,
      kind: "consume",
      operationId: value.operationId as string,
      code: value.code,
      status: value.status,
      expectedFirebaseUid: value.expectedFirebaseUid,
      expectedAuthorizationGeneration: value.expectedAuthorizationGeneration,
    });
  }
  throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
}

function parseSerializedRecord(serialized: string): RecoveryOperationVaultRecord {
  try { return parseRecord(JSON.parse(serialized) as unknown); }
  catch (error) {
    if (error instanceof RecoveryOperationVaultError) throw error;
    throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
  }
}

function secureStorePort(): Readonly<{ store: RecoveryOperationSecureStore; options: Readonly<Record<string, unknown>> }> {
  try {
    const module = require("expo-secure-store") as Partial<typeof import("expo-secure-store")>;
    if (typeof module.getItemAsync !== "function" || typeof module.setItemAsync !== "function" || typeof module.deleteItemAsync !== "function" || module.WHEN_UNLOCKED_THIS_DEVICE_ONLY === undefined) {
      throw new Error("secure_store_unavailable");
    }
    return Object.freeze({
      store: module as RecoveryOperationSecureStore,
      options: Object.freeze({
        keychainAccessible: module.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        keychainService: "com.lkurczab.patternly.recovery-operation",
      }),
    });
  } catch {
    throw new RecoveryOperationVaultError("recovery_operation_vault_unavailable");
  }
}

export function createRecoveryOperationVault(store: RecoveryOperationSecureStore, options?: Readonly<Record<string, unknown>>): RecoveryOperationVault {
  const load = async (): Promise<RecoveryOperationVaultRecord | null> => {
    let serialized: string | null;
    try { serialized = await store.getItemAsync(RECOVERY_OPERATION_VAULT_KEY, options); }
    catch { throw new RecoveryOperationVaultError("recovery_operation_vault_unavailable"); }
    return serialized === null ? null : parseSerializedRecord(serialized);
  };

  return Object.freeze({
    load,
    async save(record: RecoveryOperationVaultRecord): Promise<void> {
      let serialized: string;
      try { serialized = JSON.stringify(parseRecord(record)); }
      catch (error) {
        if (error instanceof RecoveryOperationVaultError) throw error;
        throw new RecoveryOperationVaultError("recovery_operation_vault_corrupt");
      }
      try { await store.setItemAsync(RECOVERY_OPERATION_VAULT_KEY, serialized, options); }
      catch { throw new RecoveryOperationVaultError("recovery_operation_vault_write_failed"); }
    },
    async clear(): Promise<void> {
      try {
        await store.deleteItemAsync(RECOVERY_OPERATION_VAULT_KEY, options);
        if (await store.getItemAsync(RECOVERY_OPERATION_VAULT_KEY, options) !== null) throw new Error("not_cleared");
      } catch { throw new RecoveryOperationVaultError("recovery_operation_vault_clear_failed"); }
    },
  });
}

export function createSecureRecoveryOperationVault(): RecoveryOperationVault {
  const secureStore = secureStorePort();
  return createRecoveryOperationVault(secureStore.store, secureStore.options);
}

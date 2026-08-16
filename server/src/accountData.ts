import { Sha256Accumulator } from "./sha256.js";

export const ACCOUNT_RECORD_TYPES = [
  "activeTrack",
  "trainingSession",
  "trainingSessionResult",
  "trainingAttempt",
  "reviewQueueEntry",
] as const;

export type AccountRecordType = (typeof ACCOUNT_RECORD_TYPES)[number];

export type AccountRecord = Readonly<{
  fingerprint: string;
  id: string;
  payload: Readonly<Record<string, unknown>>;
  revision?: number;
  type: AccountRecordType;
}>;

export type AccountDataset = Readonly<{
  records: readonly AccountRecord[];
}>;

export const MAX_CANONICAL_ACCOUNT_RECORD_BYTES = 512 * 1024;

export type AdoptionCase =
  | "emptyLocalEmptyRemote"
  | "populatedLocalEmptyRemote"
  | "emptyLocalPopulatedRemote"
  | "populatedLocalPopulatedRemote"
  | "divergentRecord";

export type AdoptionResult =
  | "createBoundEmptyDataset"
  | "previewThenUploadExactLocalDataset"
  | "previewThenRestoreExactRemoteDataset"
  | "previewThenReconcileByRecordPolicy"
  | "applyRecordPolicyOrBlockWithoutMutation";

export type AdoptionConflict = Readonly<{
  code: "immutable_integrity_conflict" | "revision_conflict";
  recordId: string;
  recordType: AccountRecordType;
}>;

export type AdoptionPreview = Readonly<{
  caseId: AdoptionCase;
  conflicts: readonly AdoptionConflict[];
  localFingerprint: string;
  planId: string;
  remoteFingerprint: string;
  result: AdoptionResult;
}>;

export type AdoptionConfirmation = Readonly<{
  confirmed: boolean;
  planId: string;
}>;

const IMMUTABLE_TYPES = new Set<AccountRecordType>(["trainingSessionResult", "trainingAttempt"]);

const canonicalize = (value: unknown): unknown => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  throw new Error("invalid_record_payload");
};

export const computeCanonicalSha256 = (value: unknown): string =>
  Sha256Accumulator.create()
    .update(new TextEncoder().encode(JSON.stringify(canonicalize(value))))
    .digestHex();

export const computeRecordFingerprint = (record: Omit<AccountRecord, "fingerprint">): string =>
  computeCanonicalSha256({
    id: record.id,
    payload: record.payload,
    ...(record.revision === undefined ? {} : { revision: record.revision }),
    type: record.type,
  });

export const validateAccountRecord = (record: AccountRecord): void => {
  const expected = computeRecordFingerprint(record);
  if (record.fingerprint !== expected) throw new Error("record_fingerprint_mismatch");
  if (record.type === "trainingSession" && record.payload.status !== "completed" && record.payload.status !== "abandoned") {
    throw new Error("active_training_session_remote_sync_forbidden");
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const recordKey = (record: AccountRecord): string => `${record.type}:${record.id}`;

export const compareAccountRecordUtf8Bytes = (left: string, right: string): number => {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const sharedLength = Math.min(leftBytes.length, rightBytes.length);
  for (let index = 0; index < sharedLength; index += 1) {
    if (leftBytes[index] !== rightBytes[index]) return leftBytes[index]! < rightBytes[index]! ? -1 : 1;
  }
  return leftBytes.length < rightBytes.length ? -1 : leftBytes.length > rightBytes.length ? 1 : 0;
};

type AccountRecordIdentity = Pick<AccountRecord, "id" | "type">;

export const compareAccountRecordIdentity = (left: AccountRecordIdentity, right: AccountRecordIdentity): number =>
  compareAccountRecordUtf8Bytes(left.type, right.type)
  || compareAccountRecordUtf8Bytes(left.id, right.id);

const compareAdoptionConflicts = (left: AdoptionConflict, right: AdoptionConflict): number =>
  compareAccountRecordUtf8Bytes(left.recordType, right.recordType)
  || compareAccountRecordUtf8Bytes(left.recordId, right.recordId)
  || compareAccountRecordUtf8Bytes(left.code, right.code);

export const isWellFormedUnicodeScalarString = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
};

export function validateAccountDataset(value: unknown): asserts value is AccountDataset {
  if (!isObject(value) || Object.keys(value).join(":") !== "records" || !Array.isArray(value.records)) {
    throw new Error("invalid_account_dataset");
  }
  const keys = new Set<string>();
  for (const candidate of value.records) {
    if (!isObject(candidate)) throw new Error("invalid_account_record");
    const allowedKeys = candidate.revision === undefined
      ? ["fingerprint", "id", "payload", "type"]
      : ["fingerprint", "id", "payload", "revision", "type"];
    if (Object.keys(candidate).sort().join(":") !== allowedKeys.join(":")) throw new Error("invalid_account_record");
    if (
      typeof candidate.fingerprint !== "string"
      || !/^[a-f0-9]{64}$/u.test(candidate.fingerprint)
      || typeof candidate.id !== "string"
      || candidate.id.length === 0
      || candidate.id.length > 256
      || !isWellFormedUnicodeScalarString(candidate.id)
      || !isObject(candidate.payload)
      || typeof candidate.type !== "string"
      || !ACCOUNT_RECORD_TYPES.includes(candidate.type as AccountRecordType)
      || (candidate.revision !== undefined && (!Number.isInteger(candidate.revision) || (candidate.revision as number) < 1))
    ) {
      throw new Error("invalid_account_record");
    }
    const record = candidate as AccountRecord;
    validateAccountRecord(record);
    const key = recordKey(record);
    if (keys.has(key)) throw new Error("duplicate_account_record_key");
    keys.add(key);
  }
}

const canonicalRecord = (record: AccountRecord) => ({
  fingerprint: record.fingerprint,
  id: record.id,
  payload: canonicalize(record.payload),
  ...(record.revision === undefined ? {} : { revision: record.revision }),
  type: record.type,
});

export const encodeCanonicalAccountRecord = (record: AccountRecord): Uint8Array => {
  validateAccountDataset({ records: [record] });
  const encoded = Buffer.from(JSON.stringify(canonicalRecord(record)), "utf8");
  if (encoded.byteLength > MAX_CANONICAL_ACCOUNT_RECORD_BYTES) {
    throw new Error("account_record_too_large");
  }
  return encoded;
};

export const decodeCanonicalAccountRecord = (encoded: Uint8Array): AccountRecord => {
  if (!(encoded instanceof Uint8Array) || encoded.byteLength > MAX_CANONICAL_ACCOUNT_RECORD_BYTES) {
    throw new Error("invalid_canonical_account_record");
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(encoded));
  } catch {
    throw new Error("invalid_canonical_account_record");
  }
  const dataset: unknown = { records: [decoded] };
  validateAccountDataset(dataset);
  const record = dataset.records[0]!;
  const canonical = encodeCanonicalAccountRecord(record);
  if (!Buffer.from(canonical).equals(Buffer.from(encoded))) {
    throw new Error("noncanonical_account_record_bytes");
  }
  return record;
};

export const canonicalAccountDatasetValue = (dataset: AccountDataset): unknown => {
  validateAccountDataset(dataset);
  return { records: [...dataset.records]
    .map(canonicalRecord)
    .sort(compareAccountRecordIdentity) };
};

export const fingerprintDataset = (dataset: AccountDataset): string =>
  computeCanonicalSha256(canonicalAccountDatasetValue(dataset));

const compareRecords = (
  local: AccountDataset,
  remote: AccountDataset,
): Readonly<{ conflicts: readonly AdoptionConflict[]; merged: AccountDataset }> => {
  const byKey = new Map<string, AccountRecord>();
  for (const record of remote.records) byKey.set(recordKey(record), record);
  const conflicts: AdoptionConflict[] = [];

  for (const localRecord of local.records) {
    const key = recordKey(localRecord);
    const remoteRecord = byKey.get(key);
    if (!remoteRecord) {
      byKey.set(key, localRecord);
      continue;
    }
    if (remoteRecord.fingerprint === localRecord.fingerprint) continue;
    if (IMMUTABLE_TYPES.has(localRecord.type)) {
      conflicts.push({
        code: "immutable_integrity_conflict",
        recordId: localRecord.id,
        recordType: localRecord.type,
      });
      continue;
    }
    conflicts.push({ code: "revision_conflict", recordId: localRecord.id, recordType: localRecord.type });
  }

  return {
    conflicts: conflicts.sort(compareAdoptionConflicts),
    merged: { records: [...byKey.values()].sort(compareAccountRecordIdentity) },
  };
};

export function previewAdoption(local: AccountDataset, remote: AccountDataset): AdoptionPreview {
  validateAccountDataset(local);
  validateAccountDataset(remote);
  const localFingerprint = fingerprintDataset(local);
  const remoteFingerprint = fingerprintDataset(remote);
  const comparison = compareRecords(local, remote);
  const localEmpty = local.records.length === 0;
  const remoteEmpty = remote.records.length === 0;
  let caseId: AdoptionCase;
  let result: AdoptionResult;
  if (comparison.conflicts.length > 0) {
    caseId = "divergentRecord";
    result = "applyRecordPolicyOrBlockWithoutMutation";
  } else if (localEmpty && remoteEmpty) {
    caseId = "emptyLocalEmptyRemote";
    result = "createBoundEmptyDataset";
  } else if (!localEmpty && remoteEmpty) {
    caseId = "populatedLocalEmptyRemote";
    result = "previewThenUploadExactLocalDataset";
  } else if (localEmpty) {
    caseId = "emptyLocalPopulatedRemote";
    result = "previewThenRestoreExactRemoteDataset";
  } else {
    caseId = "populatedLocalPopulatedRemote";
    result = "previewThenReconcileByRecordPolicy";
  }

  const planId = computeCanonicalSha256({
    caseId,
    conflicts: comparison.conflicts,
    localFingerprint,
    remoteFingerprint,
    result,
  });

  return { caseId, conflicts: comparison.conflicts, localFingerprint, planId, remoteFingerprint, result };
}

export function confirmAdoption(
  local: AccountDataset,
  remote: AccountDataset,
  confirmation: AdoptionConfirmation,
): AccountDataset {
  const preview = previewAdoption(local, remote);
  if (!confirmation.confirmed || confirmation.planId !== preview.planId) throw new Error("adoption_not_confirmed");
  if (preview.conflicts.length > 0) {
    throw new Error("adoption_conflict");
  }

  const comparison = compareRecords(local, remote);
  validateAccountDataset(comparison.merged);
  return comparison.merged;
}

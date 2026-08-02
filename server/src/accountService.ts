import { createHash } from "node:crypto";

import {
  ACCOUNT_RECORD_TYPES,
  canonicalAccountDatasetValue,
  compareAccountRecordIdentity,
  computeCanonicalSha256,
  decodeCanonicalAccountRecord,
  encodeCanonicalAccountRecord,
  fingerprintDataset,
  isWellFormedUnicodeScalarString,
  type AccountDataset,
  type AccountRecord,
  type AccountRecordType,
  type AdoptionConfirmation,
  type AdoptionCase,
  type AdoptionConflict,
  type AdoptionResult,
  validateAccountDataset,
} from "./accountData.js";
import { Sha256Accumulator, type Sha256State } from "./sha256.js";

export const ACCOUNT_RECORD_PAGE_SIZE = 100;
export const MAX_SYNC_MUTATIONS = 100;
export const MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES = 2 * 1024 * 1024;
export const MAX_ADOPTION_CLEANUP_PAGES = 20;
export const MAX_ADOPTION_PAGE_RECORDS = 20;
export const TRANSITION_LEASE_MS = 15 * 60 * 1000;

const MAX_OPERATION_FINGERPRINTS = 100;
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const REMOVABLE_RECORD_TYPES = new Set<AccountRecordType>([
  "activeSessionReference",
  "foregroundTimer",
  "reviewQueueEntry",
  "simulationDraft",
]);

export type AccountDatasetManifest = Readonly<{
  fingerprint: string;
  recordCount: number;
}>;

export type AccountDatasetHead = Readonly<{
  accountRevision: number;
  activeGeneration: string | null;
  manifest: AccountDatasetManifest;
  operationFingerprints: readonly string[];
}>;

export type PersistedAccountRecordDocument = Readonly<{
  canonicalByteLength: number;
  canonicalBytes: Uint8Array;
  fingerprint: string;
  id: string;
  keyHash: string;
  revision?: number;
  type: AccountRecordType;
}>;

export type AccountRecordSemanticCursor = Readonly<{
  documentId: string;
  id: string;
  type: AccountRecordType;
}>;

export type AccountRecordDescriptor = Readonly<{
  canonicalByteLength: number;
  documentId: string;
  fingerprint: string;
  id: string;
  revision?: number;
  type: AccountRecordType;
}>;

export type AdoptionLocalRecordDocument = Readonly<{
  record: PersistedAccountRecordDocument;
  sequenceId: string;
}>;

export type AdoptionConflictDocument = Readonly<{
  conflict: AdoptionConflict;
  sequenceId: string;
}>;

type AdoptionStage =
  | "uploading" | "preparing" | "hashingPlan" | "previewReady"
  | "hashingConfirmation" | "buildingCandidate" | "checkingCandidate"
  | "hashingCandidateManifest" | "activatedCleaning" | "discarding";

export type AdoptionAdvanceReceipt = Readonly<{
  adoptionId: string;
  result: "advanced";
  stage: AdoptionStage | "completed" | "cancelled" | "discarded";
  stepToken: string;
}>;

type AdoptionLastAdvance = Readonly<{
  expectedStepToken: string;
  receipt: AdoptionAdvanceReceipt;
}> | null;

type AdoptionUploadReceipt = Readonly<{
  acceptedNextRecordIndex: number;
  adoptionId: string;
  pageFingerprint: string;
  result: "accepted";
  stage: AdoptionStage;
  stepToken: string;
}>;

type AdoptionLastUpload = Readonly<{
  pageFingerprint: string;
  receipt: AdoptionUploadReceipt;
  recordCount: number;
  startRecordIndex: number;
}> | null;

type ActiveSessionSummary = Readonly<{ fingerprint: string; id: string }> | null;
type CleanupCursor = Readonly<{ documentId: string }> | null;
type DiscardCleanup = Readonly<{
  cursor: CleanupCursor;
  phase: "localRecords" | "conflicts" | "candidateRecords" | "finalize";
}>;
type ActivatedCleanup = Readonly<{
  cursor: CleanupCursor;
  phase: "previousGenerationRecords" | "localRecords" | "conflicts" | "finalize";
}>;

type AdoptionBase = Readonly<{
  adoptionId: string;
  lastAdvance: AdoptionLastAdvance;
  lastUpload: AdoptionLastUpload;
  leaseExpiresAt: string;
  localDatasetFingerprint: string;
  localRecordCount: number;
  remoteAccountRevision: number;
  remoteDatasetFingerprint: string;
  remoteGeneration: string | null;
  remoteRecordCount: number;
  stepNumber: number;
  stepToken: string;
  version: 1;
}>;

export type ActiveAdoptionOperation = AdoptionBase & (
  | Readonly<{ stage: "uploading"; nextRecordIndex: number; lastRecordType: AccountRecordType | null; lastRecordId: string | null; localDigestState: Sha256State }>
  | Readonly<{ stage: "preparing"; localAfterSequenceId: string | null; remoteAfterCursor: AccountRecordSemanticCursor | null; localProcessedCount: number; remoteProcessedCount: number; nextConflictIndex: number; localActiveSessionSummary: ActiveSessionSummary; remoteActiveSessionSummary: ActiveSessionSummary }>
  | Readonly<{ stage: "hashingPlan"; conflictAfterSequenceId: string | null; planDigestState: Sha256State; conflictCount: number; caseId: AdoptionCase; result: AdoptionResult; localFingerprint: string; remoteFingerprint: string; localActiveSessionSummary: ActiveSessionSummary; remoteActiveSessionSummary: ActiveSessionSummary }>
  | Readonly<{ stage: "previewReady"; conflictCount: number; caseId: AdoptionCase; result: AdoptionResult; localFingerprint: string; remoteFingerprint: string; planId: string; localActiveSessionSummary: ActiveSessionSummary; remoteActiveSessionSummary: ActiveSessionSummary }>
  | Readonly<{ stage: "hashingConfirmation"; conflictCount: number; caseId: AdoptionCase; result: AdoptionResult; localFingerprint: string; remoteFingerprint: string; planId: string; localActiveSessionSummary: ActiveSessionSummary; remoteActiveSessionSummary: ActiveSessionSummary; confirmation: AdoptionConfirmation; confirmationFingerprint: string; localAfterSequenceId: string | null; operationDigestState: Sha256State }>
  | Readonly<{ stage: "buildingCandidate"; conflictCount: number; caseId: AdoptionCase; result: AdoptionResult; localFingerprint: string; remoteFingerprint: string; planId: string; confirmation: AdoptionConfirmation; confirmationFingerprint: string; operationFingerprint: string; localAfterSequenceId: string | null; remoteAfterCursor: AccountRecordSemanticCursor | null; localProcessedCount: number; remoteProcessedCount: number; candidateRecordCount: number; candidateDigestState: Sha256State; rejectedActiveSessionId: string | null }>
  | Readonly<{ stage: "checkingCandidate"; conflictCount: number; caseId: AdoptionCase; result: AdoptionResult; localFingerprint: string; remoteFingerprint: string; planId: string; confirmationFingerprint: string; operationFingerprint: string; candidateManifestFingerprint: string; candidateRecordCount: number; candidateAfterDocumentId: string | null; candidateObservedDocumentCount: number }>
  | Readonly<{ stage: "hashingCandidateManifest"; conflictCount: number; caseId: AdoptionCase; result: AdoptionResult; localFingerprint: string; remoteFingerprint: string; planId: string; confirmationFingerprint: string; operationFingerprint: string; candidateManifestFingerprint: string; candidateRecordCount: number; candidateAfterCursor: AccountRecordSemanticCursor | null; candidateVerifiedRecordCount: number; candidateVerificationDigestState: Sha256State }>
  | Readonly<{ stage: "activatedCleaning"; caseId: AdoptionCase; adoptionResult: AdoptionResult; confirmationFingerprint: string; operationFingerprint: string; committedAccountRevision: number; previousGeneration: string | null; cleanup: ActivatedCleanup }>
  | Readonly<{ stage: "discarding"; reason: "cancelled" | "expired" | "snapshotChanged"; candidateGeneration: string | null; cleanup: DiscardCleanup }>
);

type TerminalLastAdvance = Exclude<AdoptionLastAdvance, null>;
export type TerminalAdoptionOperation =
  | Readonly<{ version: 1; stage: "completed"; adoptionId: string; confirmationFingerprint: string; operationFingerprint: string; committedAccountRevision: number; caseId: AdoptionCase; adoptionResult: AdoptionResult; stepNumber: number; stepToken: string; lastAdvance: TerminalLastAdvance }>
  | Readonly<{ version: 1; stage: "cancelled"; adoptionId: string; result: "cancelled"; stepNumber: number; stepToken: string; lastAdvance: TerminalLastAdvance }>
  | Readonly<{ version: 1; stage: "discarded"; adoptionId: string; result: "discarded"; reason: "expired" | "snapshotChanged"; stepNumber: number; stepToken: string; lastAdvance: TerminalLastAdvance }>;

export type AdoptionOperation = ActiveAdoptionOperation | TerminalAdoptionOperation;

export type AccountRecordPageDocument = Readonly<{
  documentId: string;
  value: PersistedAccountRecordDocument;
}>;

export type AccountRecordPhysicalDescriptor = Readonly<{
  canonicalByteLength: number;
  documentId: string;
}>;

export interface AccountDatasetTransaction {
  deleteAdoptionConflict(sequenceId: string): void;
  deleteAdoptionLocalRecord(sequenceId: string): void;
  deleteRecord(generationId: string, documentId: string): void;
  putAdoptionConflict(value: AdoptionConflictDocument): void;
  putAdoptionLocalRecord(value: AdoptionLocalRecordDocument): void;
  putRecord(generationId: string, documentId: string, value: PersistedAccountRecordDocument): void;
  readAdoptionConflict(sequenceId: string): Promise<AdoptionConflictDocument | undefined>;
  readAdoptionLocalRecord(sequenceId: string): Promise<AdoptionLocalRecordDocument | undefined>;
  readAdoptionOperation(): Promise<AdoptionOperation | undefined>;
  readHead(): Promise<AccountDatasetHead | undefined>;
  readRecord(generationId: string, documentId: string): Promise<PersistedAccountRecordDocument | undefined>;
  readRecordExists(generationId: string, documentId: string): Promise<boolean>;
  writeAdoptionOperation(value: AdoptionOperation): void;
  writeHead(value: AccountDatasetHead): void;
}

export interface AccountDatasetStore {
  readAdoptionConflictPage(uid: string, afterSequenceId: string | null, limit: number): Promise<readonly AdoptionConflictDocument[]>;
  readAdoptionLocalRecordPage(uid: string, afterSequenceId: string | null, limit: number): Promise<readonly AdoptionLocalRecordDocument[]>;
  readAdoptionOperation(uid: string): Promise<AdoptionOperation | undefined>;
  readHead(uid: string): Promise<AccountDatasetHead | undefined>;
  readRecordPhysicalDescriptorPage(
    uid: string,
    generationId: string,
    afterDocumentId: string | null,
    limit: number,
  ): Promise<readonly AccountRecordPhysicalDescriptor[]>;
  readRecordDescriptorPage(
    uid: string,
    generationId: string,
    after: AccountRecordSemanticCursor | null,
    limit: number,
  ): Promise<readonly AccountRecordDescriptor[]>;
  readRecordPage(
    uid: string,
    generationId: string,
    afterDocumentId: string | undefined,
    limit: number,
  ): Promise<readonly AccountRecordPageDocument[]>;
  readOwnedDocumentIdPage(
    uid: string,
    owner: "localRecords" | "conflicts" | Readonly<{ generationId: string }>,
    afterDocumentId: string | null,
    limit: number,
  ): Promise<readonly string[]>;
  runTransaction<T>(uid: string, operation: (transaction: AccountDatasetTransaction) => Promise<T>): Promise<T>;
}

export type RemoteAccountDataset = Readonly<{
  accountRevision: number;
  dataset: AccountDataset;
  operationFingerprints: readonly string[];
}>;

export type SyncPutMutation = Readonly<{
  expectedRecordRevision: number | null;
  kind: "put";
  record: AccountRecord;
}>;

export type SyncDeleteMutation = Readonly<{
  expectedFingerprint: string;
  expectedRecordRevision: number;
  id: string;
  kind: "delete";
  type: AccountRecordType;
}>;

export type SyncMutation = SyncPutMutation | SyncDeleteMutation;

export type AdoptionOperationSemanticInput = Readonly<{
  confirmation: AdoptionConfirmation;
  expectedAccountRevision: number;
  local: AccountDataset;
}>;

export type SyncOperationSemanticInput = Readonly<{
  expectedAccountRevision: number;
  mutations: readonly SyncMutation[];
}>;

export type AccountSnapshotPageInput = Readonly<{
  cursor: string | null;
  expectedAccountRevision: number | null;
  expectedDatasetFingerprint: string | null;
}>;

export type AccountSnapshotPage = Readonly<{
  accountRevision: number;
  datasetFingerprint: string;
  entries: readonly Readonly<{
    cursor: string;
    record: AccountRecord;
  }>[];
  recordCount: number;
}>;

type StableSnapshot = Readonly<{
  documents: readonly AccountRecordPageDocument[];
  head: AccountDatasetHead | undefined;
  remote: RemoteAccountDataset;
}>;

const EMPTY_DATASET: AccountDataset = { records: [] };
const EMPTY_MANIFEST: AccountDatasetManifest = {
  fingerprint: fingerprintDataset(EMPTY_DATASET),
  recordCount: 0,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const exactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean =>
  Object.keys(value).sort().join(":") === [...expected].sort().join(":");

const recordKey = (type: AccountRecordType, id: string): string => `${type}:${id}`;

export const computeAccountRecordKeyHash = (type: AccountRecordType, id: string): string =>
  createHash("sha256").update(recordKey(type, id), "utf8").digest("hex");

export const accountRecordDocumentPath = (
  uid: string,
  generationId: string,
  documentId: string,
): string => `accounts/${uid}/generations/${generationId}/records/${documentId}`;

const manifestFor = (dataset: AccountDataset): AccountDatasetManifest => ({
  fingerprint: fingerprintDataset(dataset),
  recordCount: dataset.records.length,
});

const validateManifest = (value: unknown): value is AccountDatasetManifest =>
  isObject(value)
  && exactKeys(value, ["fingerprint", "recordCount"])
  && typeof value.fingerprint === "string"
  && HASH_PATTERN.test(value.fingerprint)
  && Number.isInteger(value.recordCount)
  && (value.recordCount as number) >= 0;

const canonicalIso = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
};

export function validateAccountDatasetHead(value: unknown): asserts value is AccountDatasetHead {
  if (!isObject(value) || !exactKeys(value, [
    "accountRevision", "activeGeneration", "manifest", "operationFingerprints",
  ])) {
    throw new Error("corrupt_account_dataset_head");
  }
  if (
    !Number.isInteger(value.accountRevision)
    || (value.accountRevision as number) < 0
    || (value.activeGeneration !== null
      && (typeof value.activeGeneration !== "string" || !HASH_PATTERN.test(value.activeGeneration)))
    || !validateManifest(value.manifest)
    || !Array.isArray(value.operationFingerprints)
    || value.operationFingerprints.length > MAX_OPERATION_FINGERPRINTS
    || new Set(value.operationFingerprints).size !== value.operationFingerprints.length
    || value.operationFingerprints.some((fingerprint) => typeof fingerprint !== "string" || !HASH_PATTERN.test(fingerprint))
  ) {
    throw new Error("corrupt_account_dataset_head");
  }
  const head = value as AccountDatasetHead;
  if (head.activeGeneration === null && (
    head.accountRevision !== 0
    || head.manifest.recordCount !== EMPTY_MANIFEST.recordCount
    || head.manifest.fingerprint !== EMPTY_MANIFEST.fingerprint
  )) throw new Error("corrupt_account_dataset_head");
}

export const createPersistedAccountRecordDocument = (record: AccountRecord): PersistedAccountRecordDocument => {
  const canonicalBytes = encodeCanonicalAccountRecord(record);
  return {
    canonicalByteLength: canonicalBytes.byteLength,
    canonicalBytes,
    fingerprint: record.fingerprint,
    id: record.id,
    keyHash: computeAccountRecordKeyHash(record.type, record.id),
    ...(record.revision === undefined ? {} : { revision: record.revision }),
    type: record.type,
  };
};

export const decodePersistedAccountRecordDocument = (
  value: unknown,
  documentId: string,
): AccountRecord => {
  if (!isObject(value)) throw new Error("corrupt_account_record_document");
  const hasRevision = Object.hasOwn(value, "revision");
  if (!exactKeys(value, hasRevision
    ? ["canonicalByteLength", "canonicalBytes", "fingerprint", "id", "keyHash", "revision", "type"]
    : ["canonicalByteLength", "canonicalBytes", "fingerprint", "id", "keyHash", "type"])) {
    throw new Error("corrupt_account_record_document");
  }
  if (
    !Number.isInteger(value.canonicalByteLength)
    || (value.canonicalByteLength as number) < 1
    || !(value.canonicalBytes instanceof Uint8Array)
    || value.canonicalByteLength !== value.canonicalBytes.byteLength
    || typeof value.fingerprint !== "string"
    || !HASH_PATTERN.test(value.fingerprint)
    || typeof value.id !== "string"
    || typeof value.keyHash !== "string"
    || !HASH_PATTERN.test(value.keyHash)
    || typeof value.type !== "string"
    || (hasRevision && (!Number.isInteger(value.revision) || (value.revision as number) < 1))
  ) throw new Error("corrupt_account_record_document");
  const record = decodeCanonicalAccountRecord(value.canonicalBytes);
  const expectedKeyHash = computeAccountRecordKeyHash(record.type, record.id);
  if (
    documentId !== expectedKeyHash
    || value.keyHash !== expectedKeyHash
    || value.type !== record.type
    || value.id !== record.id
    || value.fingerprint !== record.fingerprint
    || value.revision !== record.revision
  ) throw new Error("corrupt_account_record_document");
  return record;
};

export const estimatePersistedAccountRecordBytes = (
  documentPath: string,
  value: PersistedAccountRecordDocument,
): number => value.canonicalBytes.byteLength
  + Buffer.byteLength(documentPath, "utf8")
  + Buffer.byteLength(value.keyHash, "utf8")
  + Buffer.byteLength(value.type, "utf8")
  + Buffer.byteLength(value.id, "utf8")
  + Buffer.byteLength(value.fingerprint, "utf8")
  + Buffer.byteLength(String(value.canonicalByteLength), "utf8")
  + (value.revision === undefined ? 0 : Buffer.byteLength(String(value.revision), "utf8"));

const sameManifest = (left: AccountDatasetManifest, right: AccountDatasetManifest): boolean =>
  left.fingerprint === right.fingerprint && left.recordCount === right.recordCount;

const sameHeadAuthority = (left: AccountDatasetHead | undefined, right: AccountDatasetHead | undefined): boolean => {
  if (!left || !right) return left === right;
  return left.accountRevision === right.accountRevision
    && left.activeGeneration === right.activeGeneration
    && sameManifest(left.manifest, right.manifest);
};

const sameHeadExact = (left: AccountDatasetHead | undefined, right: AccountDatasetHead | undefined): boolean => {
  if (!sameHeadAuthority(left, right) || !left || !right) return left === right;
  return left.operationFingerprints.length === right.operationFingerprints.length
    && left.operationFingerprints.every((fingerprint, index) => fingerprint === right.operationFingerprints[index]);
};

const samePersistedRecord = (
  left: PersistedAccountRecordDocument | undefined,
  right: PersistedAccountRecordDocument | undefined,
): boolean => {
  if (!left || !right) return left === right;
  return left.fingerprint === right.fingerprint
    && left.id === right.id
    && left.keyHash === right.keyHash
    && left.revision === right.revision
    && left.type === right.type
    && Buffer.from(left.canonicalBytes).equals(Buffer.from(right.canonicalBytes));
};

const SEQUENCE_PATTERN = /^[0-9]{16}$/u;
const MAX_SAFE_SEQUENCE_ID = Number.MAX_SAFE_INTEGER.toString(10).padStart(16, "0");

export const adoptionSequenceId = (value: number): string => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("invalid_adoption_sequence_id");
  return value.toString(10).padStart(16, "0");
};

const validSequenceId = (value: unknown): value is string =>
  typeof value === "string" && SEQUENCE_PATTERN.test(value) && value <= MAX_SAFE_SEQUENCE_ID;

const validSemanticCursor = (value: unknown): value is AccountRecordSemanticCursor => {
  if (!isObject(value) || !exactKeys(value, ["documentId", "id", "type"])) return false;
  return typeof value.documentId === "string" && HASH_PATTERN.test(value.documentId)
    && typeof value.id === "string" && value.id.length > 0 && value.id.length <= 256
    && isWellFormedUnicodeScalarString(value.id)
    && typeof value.type === "string"
    && (ACCOUNT_RECORD_TYPES as readonly string[]).includes(value.type);
};

const validShaState = (value: unknown): value is Sha256State => {
  try {
    Sha256Accumulator.restore(value);
    return true;
  } catch {
    return false;
  }
};

const validActiveSummary = (value: unknown): value is ActiveSessionSummary => value === null || (
  isObject(value)
  && exactKeys(value, ["fingerprint", "id"])
  && typeof value.fingerprint === "string"
  && HASH_PATTERN.test(value.fingerprint)
  && typeof value.id === "string"
  && value.id.length > 0
  && value.id.length <= 256
  && isWellFormedUnicodeScalarString(value.id)
);

const validAdvanceReceipt = (value: unknown): value is AdoptionAdvanceReceipt => isObject(value)
  && exactKeys(value, ["adoptionId", "result", "stage", "stepToken"])
  && typeof value.adoptionId === "string" && HASH_PATTERN.test(value.adoptionId)
  && value.result === "advanced"
  && typeof value.stage === "string"
  && ["uploading", "preparing", "hashingPlan", "previewReady", "hashingConfirmation", "buildingCandidate", "checkingCandidate", "hashingCandidateManifest", "activatedCleaning", "discarding", "completed", "cancelled", "discarded"].includes(value.stage)
  && typeof value.stepToken === "string" && HASH_PATTERN.test(value.stepToken);

const validLastAdvance = (value: unknown): value is AdoptionLastAdvance => value === null || (
  isObject(value)
  && exactKeys(value, ["expectedStepToken", "receipt"])
  && typeof value.expectedStepToken === "string" && HASH_PATTERN.test(value.expectedStepToken)
  && validAdvanceReceipt(value.receipt)
);

const validLastUpload = (value: unknown): value is AdoptionLastUpload => value === null || (
  isObject(value)
  && exactKeys(value, ["pageFingerprint", "receipt", "recordCount", "startRecordIndex"])
  && typeof value.pageFingerprint === "string" && HASH_PATTERN.test(value.pageFingerprint)
  && Number.isSafeInteger(value.recordCount) && (value.recordCount as number) >= 1 && (value.recordCount as number) <= MAX_ADOPTION_PAGE_RECORDS
  && Number.isSafeInteger(value.startRecordIndex) && (value.startRecordIndex as number) >= 0
  && isObject(value.receipt)
  && exactKeys(value.receipt, ["acceptedNextRecordIndex", "adoptionId", "pageFingerprint", "result", "stage", "stepToken"])
  && Number.isSafeInteger(value.receipt.acceptedNextRecordIndex)
  && value.receipt.acceptedNextRecordIndex === (value.startRecordIndex as number) + (value.recordCount as number)
  && typeof value.receipt.adoptionId === "string" && HASH_PATTERN.test(value.receipt.adoptionId)
  && value.receipt.pageFingerprint === value.pageFingerprint
  && value.receipt.result === "accepted"
  && typeof value.receipt.stage === "string"
  && ["uploading", "preparing"].includes(value.receipt.stage)
  && typeof value.receipt.stepToken === "string" && HASH_PATTERN.test(value.receipt.stepToken)
);

const validConfirmation = (value: unknown): value is AdoptionConfirmation => {
  if (!isObject(value)) return false;
  const allowed = ["abandonOtherActiveSessionConfirmed", "confirmed", "planId", "selectedActiveSessionSide"];
  if (!Object.keys(value).every((key) => allowed.includes(key))
    || !Object.prototype.hasOwnProperty.call(value, "confirmed")
    || !Object.prototype.hasOwnProperty.call(value, "planId")
    || typeof value.confirmed !== "boolean"
    || typeof value.planId !== "string"
    || !HASH_PATTERN.test(value.planId)) return false;
  if (Object.prototype.hasOwnProperty.call(value, "abandonOtherActiveSessionConfirmed")
    && typeof value.abandonOtherActiveSessionConfirmed !== "boolean") return false;
  return !Object.prototype.hasOwnProperty.call(value, "selectedActiveSessionSide")
    || value.selectedActiveSessionSide === "local"
    || value.selectedActiveSessionSide === "remote";
};

const canonicalConfirmationFingerprint = (confirmation: AdoptionConfirmation): string => computeCanonicalSha256({
  abandonOtherActiveSessionConfirmed: confirmation.abandonOtherActiveSessionConfirmed ?? false,
  confirmed: confirmation.confirmed,
  planId: confirmation.planId,
  selectedActiveSessionSide: confirmation.selectedActiveSessionSide ?? null,
});

const ACTIVE_COMMON_KEYS = [
  "adoptionId", "lastAdvance", "lastUpload", "leaseExpiresAt", "localDatasetFingerprint",
  "localRecordCount", "remoteAccountRevision", "remoteDatasetFingerprint", "remoteGeneration",
  "remoteRecordCount", "stage", "stepNumber", "stepToken", "version",
] as const;

const ADOPTION_STAGE_KEYS: Readonly<Record<AdoptionStage, readonly string[]>> = {
  uploading: ["lastRecordId", "lastRecordType", "localDigestState", "nextRecordIndex"],
  preparing: ["localActiveSessionSummary", "localAfterSequenceId", "localProcessedCount", "nextConflictIndex", "remoteActiveSessionSummary", "remoteAfterCursor", "remoteProcessedCount"],
  hashingPlan: ["caseId", "conflictAfterSequenceId", "conflictCount", "localActiveSessionSummary", "localFingerprint", "planDigestState", "remoteActiveSessionSummary", "remoteFingerprint", "result"],
  previewReady: ["caseId", "conflictCount", "localActiveSessionSummary", "localFingerprint", "planId", "remoteActiveSessionSummary", "remoteFingerprint", "result"],
  hashingConfirmation: ["caseId", "confirmation", "confirmationFingerprint", "conflictCount", "localActiveSessionSummary", "localAfterSequenceId", "localFingerprint", "operationDigestState", "planId", "remoteActiveSessionSummary", "remoteFingerprint", "result"],
  buildingCandidate: ["candidateDigestState", "candidateRecordCount", "caseId", "confirmation", "confirmationFingerprint", "conflictCount", "localAfterSequenceId", "localFingerprint", "localProcessedCount", "operationFingerprint", "planId", "rejectedActiveSessionId", "remoteAfterCursor", "remoteFingerprint", "remoteProcessedCount", "result"],
  checkingCandidate: ["candidateAfterDocumentId", "candidateManifestFingerprint", "candidateObservedDocumentCount", "candidateRecordCount", "caseId", "confirmationFingerprint", "conflictCount", "localFingerprint", "operationFingerprint", "planId", "remoteFingerprint", "result"],
  hashingCandidateManifest: ["candidateAfterCursor", "candidateManifestFingerprint", "candidateRecordCount", "candidateVerificationDigestState", "candidateVerifiedRecordCount", "caseId", "confirmationFingerprint", "conflictCount", "localFingerprint", "operationFingerprint", "planId", "remoteFingerprint", "result"],
  activatedCleaning: ["adoptionResult", "caseId", "cleanup", "committedAccountRevision", "confirmationFingerprint", "operationFingerprint", "previousGeneration"],
  discarding: ["candidateGeneration", "cleanup", "reason"],
};

const validCase = (value: unknown): value is AdoptionCase => typeof value === "string" && [
  "emptyLocalEmptyRemote", "populatedLocalEmptyRemote", "emptyLocalPopulatedRemote",
  "populatedLocalPopulatedRemote", "activeSessionOnOneSide", "divergentActiveSessions", "divergentRecord",
].includes(value);
const validResult = (value: unknown): value is AdoptionResult => typeof value === "string" && [
  "createBoundEmptyDataset", "previewThenUploadExactLocalDataset", "previewThenRestoreExactRemoteDataset",
  "previewThenReconcileByRecordPolicy", "preserveThatSessionAndRejectSecondActiveSession",
  "requireExplicitSessionChoiceAndConfirmedAbandonmentOfOtherDraft", "applyRecordPolicyOrBlockWithoutMutation",
].includes(value);

const adoptionStepToken = (adoptionId: string, stepNumber: number, stage: string): string =>
  computeCanonicalSha256({ adoptionId, kind: "adoptionStep", stage, stepNumber });

export function validateAdoptionOperation(value: unknown): asserts value is AdoptionOperation {
  if (!isObject(value) || value.version !== 1 || typeof value.stage !== "string") {
    throw new Error("corrupt_adoption_operation");
  }
  if (value.stage === "completed") {
    if (!exactKeys(value, ["adoptionId", "adoptionResult", "caseId", "committedAccountRevision", "confirmationFingerprint", "lastAdvance", "operationFingerprint", "stage", "stepNumber", "stepToken", "version"])
      || !validCase(value.caseId) || !validResult(value.adoptionResult)
      || !Number.isSafeInteger(value.committedAccountRevision) || (value.committedAccountRevision as number) < 1
      || typeof value.confirmationFingerprint !== "string" || !HASH_PATTERN.test(value.confirmationFingerprint)
      || typeof value.operationFingerprint !== "string" || !HASH_PATTERN.test(value.operationFingerprint)
      || value.lastAdvance === null || !validLastAdvance(value.lastAdvance)) throw new Error("corrupt_adoption_operation");
  } else if (value.stage === "cancelled") {
    if (!exactKeys(value, ["adoptionId", "lastAdvance", "result", "stage", "stepNumber", "stepToken", "version"])
      || value.result !== "cancelled" || value.lastAdvance === null || !validLastAdvance(value.lastAdvance)) throw new Error("corrupt_adoption_operation");
  } else if (value.stage === "discarded") {
    if (!exactKeys(value, ["adoptionId", "lastAdvance", "reason", "result", "stage", "stepNumber", "stepToken", "version"])
      || value.result !== "discarded" || (value.reason !== "expired" && value.reason !== "snapshotChanged")
      || value.lastAdvance === null || !validLastAdvance(value.lastAdvance)) throw new Error("corrupt_adoption_operation");
  } else {
    if (!(value.stage in ADOPTION_STAGE_KEYS)
      || !exactKeys(value, [...ACTIVE_COMMON_KEYS, ...ADOPTION_STAGE_KEYS[value.stage as AdoptionStage]!])
      || !canonicalIso(value.leaseExpiresAt)
      || typeof value.localDatasetFingerprint !== "string" || !HASH_PATTERN.test(value.localDatasetFingerprint)
      || !Number.isSafeInteger(value.localRecordCount) || (value.localRecordCount as number) < 0
      || !Number.isSafeInteger(value.remoteAccountRevision) || (value.remoteAccountRevision as number) < 0
      || typeof value.remoteDatasetFingerprint !== "string" || !HASH_PATTERN.test(value.remoteDatasetFingerprint)
      || (value.remoteGeneration !== null && (typeof value.remoteGeneration !== "string" || !HASH_PATTERN.test(value.remoteGeneration)))
      || !Number.isSafeInteger(value.remoteRecordCount) || (value.remoteRecordCount as number) < 0
      || !validLastAdvance(value.lastAdvance) || !validLastUpload(value.lastUpload)) {
      throw new Error("corrupt_adoption_operation");
    }
    if (value.remoteGeneration === null && (
      value.remoteAccountRevision !== 0
      || value.remoteRecordCount !== 0
      || value.remoteDatasetFingerprint !== EMPTY_MANIFEST.fingerprint
    )) throw new Error("corrupt_adoption_operation");
    if (value.lastUpload !== null && (
      value.lastUpload.receipt.adoptionId !== value.adoptionId
      || value.lastUpload.receipt.acceptedNextRecordIndex > (value.localRecordCount as number)
    )) throw new Error("corrupt_adoption_operation");
    const active = value as unknown as ActiveAdoptionOperation;
    switch (active.stage) {
      case "uploading":
        if (!Number.isSafeInteger(active.nextRecordIndex) || active.nextRecordIndex < 0
          || active.nextRecordIndex > active.localRecordCount
          || (active.lastRecordType === null) !== (active.lastRecordId === null)
          || (active.lastRecordType !== null && !(ACCOUNT_RECORD_TYPES as readonly unknown[]).includes(active.lastRecordType))
          || (active.lastRecordId !== null && active.lastRecordId.length === 0)
          || (active.nextRecordIndex === 0) !== (active.lastRecordType === null)
          || (active.nextRecordIndex === 0) !== (active.lastUpload === null)
          || !validShaState(active.localDigestState)) throw new Error("corrupt_adoption_operation");
        break;
      case "preparing":
        if ((active.localAfterSequenceId !== null && !validSequenceId(active.localAfterSequenceId))
          || (active.remoteAfterCursor !== null && !validSemanticCursor(active.remoteAfterCursor))
          || !Number.isSafeInteger(active.localProcessedCount) || active.localProcessedCount < 0 || active.localProcessedCount > active.localRecordCount
          || !Number.isSafeInteger(active.remoteProcessedCount) || active.remoteProcessedCount < 0 || active.remoteProcessedCount > active.remoteRecordCount
          || (active.localProcessedCount === 0) !== (active.localAfterSequenceId === null)
          || (active.localAfterSequenceId !== null && Number(active.localAfterSequenceId) + 1 !== active.localProcessedCount)
          || (active.remoteProcessedCount === 0) !== (active.remoteAfterCursor === null)
          || !Number.isSafeInteger(active.nextConflictIndex) || active.nextConflictIndex < 0 || !validActiveSummary(active.localActiveSessionSummary)
          || !validActiveSummary(active.remoteActiveSessionSummary)) throw new Error("corrupt_adoption_operation");
        break;
      case "hashingPlan": case "previewReady": case "hashingConfirmation":
        if (!validCase(active.caseId) || !validResult(active.result)
          || !Number.isSafeInteger(active.conflictCount) || active.conflictCount < 0
          || !validActiveSummary(active.localActiveSessionSummary) || !validActiveSummary(active.remoteActiveSessionSummary)
          || typeof active.localFingerprint !== "string" || !HASH_PATTERN.test(active.localFingerprint)
          || typeof active.remoteFingerprint !== "string" || !HASH_PATTERN.test(active.remoteFingerprint)) throw new Error("corrupt_adoption_operation");
        if (active.stage === "hashingPlan" && ((active.conflictAfterSequenceId !== null && !validSequenceId(active.conflictAfterSequenceId)) || !validShaState(active.planDigestState))) throw new Error("corrupt_adoption_operation");
        if (active.stage === "previewReady" && (typeof active.planId !== "string" || !HASH_PATTERN.test(active.planId))) throw new Error("corrupt_adoption_operation");
        if (active.stage === "hashingConfirmation" && (
          (active.localAfterSequenceId !== null && !validSequenceId(active.localAfterSequenceId))
          || !validShaState(active.operationDigestState)
          || !validConfirmation(active.confirmation)
          || typeof active.confirmationFingerprint !== "string"
          || active.confirmationFingerprint !== canonicalConfirmationFingerprint(active.confirmation)
          || active.confirmation.planId !== active.planId
        )) throw new Error("corrupt_adoption_operation");
        break;
      case "buildingCandidate":
        if (!validCase(active.caseId) || !validResult(active.result) || !validShaState(active.candidateDigestState)
          || !Number.isSafeInteger(active.candidateRecordCount) || active.candidateRecordCount < 0
          || !Number.isSafeInteger(active.localProcessedCount) || active.localProcessedCount < 0 || active.localProcessedCount > active.localRecordCount
          || !Number.isSafeInteger(active.remoteProcessedCount) || active.remoteProcessedCount < 0 || active.remoteProcessedCount > active.remoteRecordCount
          || (active.localAfterSequenceId !== null && !validSequenceId(active.localAfterSequenceId))
          || (active.remoteAfterCursor !== null && !validSemanticCursor(active.remoteAfterCursor))
          || (active.localProcessedCount === 0) !== (active.localAfterSequenceId === null)
          || (active.localAfterSequenceId !== null && Number(active.localAfterSequenceId) + 1 !== active.localProcessedCount)
          || (active.remoteProcessedCount === 0) !== (active.remoteAfterCursor === null)
          || !validConfirmation(active.confirmation)
          || typeof active.confirmationFingerprint !== "string"
          || active.confirmationFingerprint !== canonicalConfirmationFingerprint(active.confirmation)
          || active.confirmation.planId !== active.planId
          || typeof active.operationFingerprint !== "string" || !HASH_PATTERN.test(active.operationFingerprint)
          || (active.rejectedActiveSessionId !== null && (
            typeof active.rejectedActiveSessionId !== "string" || active.rejectedActiveSessionId.length === 0
          ))
          || (active.caseId === "divergentActiveSessions") !== (active.rejectedActiveSessionId !== null)) throw new Error("corrupt_adoption_operation");
        break;
      case "checkingCandidate":
        if (!validCase(active.caseId) || !validResult(active.result)
          || !Number.isSafeInteger(active.conflictCount) || active.conflictCount < 0
          || typeof active.localFingerprint !== "string" || !HASH_PATTERN.test(active.localFingerprint)
          || typeof active.remoteFingerprint !== "string" || !HASH_PATTERN.test(active.remoteFingerprint)
          || typeof active.planId !== "string" || !HASH_PATTERN.test(active.planId)
          || typeof active.confirmationFingerprint !== "string" || !HASH_PATTERN.test(active.confirmationFingerprint)
          || typeof active.operationFingerprint !== "string" || !HASH_PATTERN.test(active.operationFingerprint)
          || typeof active.candidateManifestFingerprint !== "string" || !HASH_PATTERN.test(active.candidateManifestFingerprint)
          || !Number.isSafeInteger(active.candidateRecordCount) || active.candidateRecordCount < 0
          || !Number.isSafeInteger(active.candidateObservedDocumentCount) || active.candidateObservedDocumentCount < 0
          || active.candidateObservedDocumentCount > active.candidateRecordCount
          || (active.candidateObservedDocumentCount === 0) !== (active.candidateAfterDocumentId === null)
          || (active.candidateAfterDocumentId !== null && (
            typeof active.candidateAfterDocumentId !== "string" || !HASH_PATTERN.test(active.candidateAfterDocumentId)
          ))) throw new Error("corrupt_adoption_operation");
        break;
      case "hashingCandidateManifest":
        if (!validCase(active.caseId) || !validResult(active.result)
          || !Number.isSafeInteger(active.conflictCount) || active.conflictCount < 0
          || typeof active.localFingerprint !== "string" || !HASH_PATTERN.test(active.localFingerprint)
          || typeof active.remoteFingerprint !== "string" || !HASH_PATTERN.test(active.remoteFingerprint)
          || typeof active.planId !== "string" || !HASH_PATTERN.test(active.planId)
          || typeof active.confirmationFingerprint !== "string" || !HASH_PATTERN.test(active.confirmationFingerprint)
          || typeof active.operationFingerprint !== "string" || !HASH_PATTERN.test(active.operationFingerprint)
          || typeof active.candidateManifestFingerprint !== "string" || !HASH_PATTERN.test(active.candidateManifestFingerprint)
          || !Number.isSafeInteger(active.candidateRecordCount) || active.candidateRecordCount < 0
          || !Number.isSafeInteger(active.candidateVerifiedRecordCount) || active.candidateVerifiedRecordCount < 0
          || active.candidateVerifiedRecordCount > active.candidateRecordCount
          || (active.candidateVerifiedRecordCount === 0) !== (active.candidateAfterCursor === null)
          || (active.candidateAfterCursor !== null && !validSemanticCursor(active.candidateAfterCursor))
          || !validShaState(active.candidateVerificationDigestState)) throw new Error("corrupt_adoption_operation");
        break;
      case "activatedCleaning":
        if (!exactKeys(active.cleanup, ["cursor", "phase"])
          || !["previousGenerationRecords", "localRecords", "conflicts", "finalize"].includes(active.cleanup.phase)
          || !validCase(active.caseId) || !validResult(active.adoptionResult)
          || typeof active.confirmationFingerprint !== "string" || !HASH_PATTERN.test(active.confirmationFingerprint)
          || typeof active.operationFingerprint !== "string" || !HASH_PATTERN.test(active.operationFingerprint)
          || !Number.isSafeInteger(active.committedAccountRevision) || active.committedAccountRevision !== active.remoteAccountRevision + 1
          || active.previousGeneration !== active.remoteGeneration
          || (active.cleanup.cursor !== null && (!exactKeys(active.cleanup.cursor, ["documentId"])
            || active.cleanup.cursor.documentId.length === 0))) throw new Error("corrupt_adoption_operation");
        break;
      case "discarding":
        if (!exactKeys(active.cleanup, ["cursor", "phase"])
          || !["localRecords", "conflicts", "candidateRecords", "finalize"].includes(active.cleanup.phase)
          || !["cancelled", "expired", "snapshotChanged"].includes(active.reason)
          || (active.candidateGeneration !== null && (
            typeof active.candidateGeneration !== "string" || !HASH_PATTERN.test(active.candidateGeneration)
          ))
          || (active.cleanup.phase === "candidateRecords" && active.candidateGeneration === null)
          || (active.cleanup.cursor !== null && (!exactKeys(active.cleanup.cursor, ["documentId"])
            || active.cleanup.cursor.documentId.length === 0))) throw new Error("corrupt_adoption_operation");
        break;
    }
  }
  if (typeof value.adoptionId !== "string" || !HASH_PATTERN.test(value.adoptionId)
    || !Number.isSafeInteger(value.stepNumber) || (value.stepNumber as number) < 0
    || value.stepToken !== adoptionStepToken(value.adoptionId, value.stepNumber as number, value.stage)) {
    throw new Error("corrupt_adoption_operation");
  }
  if (value.lastAdvance !== null && (
    value.lastAdvance.receipt.adoptionId !== value.adoptionId
    || value.lastAdvance.receipt.stage !== value.stage
    || value.lastAdvance.receipt.stepToken !== value.stepToken
    || value.lastAdvance.expectedStepToken === value.stepToken
  )) throw new Error("corrupt_adoption_operation");
  if (value.stage === "completed" || value.stage === "cancelled" || value.stage === "discarded") {
    if ((value.stepNumber as number) < 1) throw new Error("corrupt_adoption_operation");
    const predecessorStage = value.stage === "completed" ? "activatedCleaning" : "discarding";
    if (value.lastAdvance!.expectedStepToken !== adoptionStepToken(
      value.adoptionId as string,
      (value.stepNumber as number) - 1,
      predecessorStage,
    )) throw new Error("corrupt_adoption_operation");
  }
}

export const validateAdoptionLocalRecordDocument = (value: unknown): AdoptionLocalRecordDocument => {
  if (!isObject(value) || !exactKeys(value, ["record", "sequenceId"]) || !validSequenceId(value.sequenceId) || !isObject(value.record)) {
    throw new Error("corrupt_adoption_local_record");
  }
  decodePersistedAccountRecordDocument(value.record, value.record.keyHash as string);
  return value as AdoptionLocalRecordDocument;
};

export const validateAdoptionConflictDocument = (value: unknown): AdoptionConflictDocument => {
  if (!isObject(value) || !exactKeys(value, ["conflict", "sequenceId"]) || !validSequenceId(value.sequenceId)
    || !isObject(value.conflict) || !exactKeys(value.conflict, ["code", "recordId", "recordType"])
    || (value.conflict.code !== "immutable_integrity_conflict" && value.conflict.code !== "revision_conflict")
    || typeof value.conflict.recordId !== "string" || value.conflict.recordId.length === 0 || value.conflict.recordId.length > 256
    || !isWellFormedUnicodeScalarString(value.conflict.recordId)
    || typeof value.conflict.recordType !== "string"
    || !(ACCOUNT_RECORD_TYPES as readonly string[]).includes(value.conflict.recordType)) {
    throw new Error("corrupt_adoption_conflict");
  }
  return value as AdoptionConflictDocument;
};

const appendOperationFingerprint = (current: readonly string[], fingerprint: string): readonly string[] =>
  [...current.slice(-(MAX_OPERATION_FINGERPRINTS - 1)), fingerprint];

const validateExpectedAccountRevision = (value: number): void => {
  if (!Number.isInteger(value) || value < 0) throw new Error("invalid_expected_account_revision");
};

const invalidSyncMutation = (_mutation: never): never => {
  throw new Error("invalid_sync_operation");
};

function validateSyncMutation(value: unknown): asserts value is SyncMutation {
  if (!isObject(value) || typeof value.kind !== "string") throw new Error("invalid_sync_operation");
  switch (value.kind) {
    case "put": {
      if (!exactKeys(value, ["expectedRecordRevision", "kind", "record"])) {
        throw new Error("invalid_sync_operation");
      }
      const expectedRecordRevision = value.expectedRecordRevision;
      if (expectedRecordRevision !== null
        && (!Number.isInteger(expectedRecordRevision) || (expectedRecordRevision as number) < 0)) {
        throw new Error("invalid_sync_operation");
      }
      createPersistedAccountRecordDocument(value.record as AccountRecord);
      return;
    }
    case "delete": {
      if (!exactKeys(value, ["expectedFingerprint", "expectedRecordRevision", "id", "kind", "type"])) {
        throw new Error("invalid_sync_operation");
      }
      const removable = typeof value.type === "string"
        && REMOVABLE_RECORD_TYPES.has(value.type as AccountRecordType);
      if (!removable) throw new Error("record_delete_not_allowed");
      if (
        typeof value.id !== "string"
        || value.id.length === 0
        || value.id.length > 256
        || !Number.isInteger(value.expectedRecordRevision)
        || (value.expectedRecordRevision as number) < 1
        || typeof value.expectedFingerprint !== "string"
        || !HASH_PATTERN.test(value.expectedFingerprint)
      ) throw new Error("invalid_sync_operation");
      return;
    }
    default:
      throw new Error("invalid_sync_operation");
  }
}

const mutationIdentity = (mutation: SyncMutation): Readonly<{ id: string; type: AccountRecordType }> => {
  switch (mutation.kind) {
    case "put": return mutation.record;
    case "delete": return mutation;
    default: return invalidSyncMutation(mutation);
  }
};

function validateSyncMutations(value: unknown): asserts value is readonly SyncMutation[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_SYNC_MUTATIONS) {
    throw new Error("invalid_sync_operation");
  }
  for (const mutation of value) validateSyncMutation(mutation);
  const keys = new Set<string>();
  for (const mutation of value) {
    const identity = mutationIdentity(mutation);
    const key = recordKey(identity.type, identity.id);
    if (keys.has(key)) throw new Error("duplicate_sync_mutation_key");
    keys.add(key);
  }
}

const canonicalSyncMutation = (mutation: SyncMutation): Readonly<Record<string, unknown>> => {
  switch (mutation.kind) {
    case "put":
      return { expectedRecordRevision: mutation.expectedRecordRevision, kind: "put", record: mutation.record };
    case "delete":
      return {
        expectedFingerprint: mutation.expectedFingerprint,
        expectedRecordRevision: mutation.expectedRecordRevision,
        id: mutation.id,
        kind: "delete",
        type: mutation.type,
      };
    default:
      return invalidSyncMutation(mutation);
  }
};

const canonicalConfirmation = (confirmation: AdoptionConfirmation): Readonly<Record<string, unknown>> => ({
  abandonOtherActiveSessionConfirmed: confirmation.abandonOtherActiveSessionConfirmed ?? false,
  confirmed: confirmation.confirmed,
  planId: confirmation.planId,
  selectedActiveSessionSide: confirmation.selectedActiveSessionSide ?? null,
});

export const computeAdoptionOperationFingerprint = (input: AdoptionOperationSemanticInput): string => {
  validateExpectedAccountRevision(input.expectedAccountRevision);
  validateAccountDataset(input.local);
  for (const record of input.local.records) encodeCanonicalAccountRecord(record);
  return computeCanonicalSha256({
    confirmation: canonicalConfirmation(input.confirmation),
    expectedAccountRevision: input.expectedAccountRevision,
    kind: "adoptionConfirmation",
    local: canonicalAccountDatasetValue(input.local),
  });
};

export const computeSyncOperationFingerprint = (input: SyncOperationSemanticInput): string => {
  validateExpectedAccountRevision(input.expectedAccountRevision);
  validateSyncMutations(input.mutations);
  return computeCanonicalSha256({
    expectedAccountRevision: input.expectedAccountRevision,
    kind: "syncMutationBatch",
    mutations: [...input.mutations]
      .sort((left, right) => {
        const a = mutationIdentity(left);
        const b = mutationIdentity(right);
        return compareAccountRecordIdentity(a, b);
      })
      .map(canonicalSyncMutation),
  });
};

const requireMatchingOperationFingerprint = (supplied: string, expected: string): void => {
  if (!HASH_PATTERN.test(supplied) || supplied !== expected) throw new Error("invalid_operation_fingerprint");
};

const readGeneration = async (
  store: AccountDatasetStore,
  uid: string,
  generationId: string,
): Promise<Readonly<{
  documents: readonly AccountRecordPageDocument[];
  records: readonly AccountRecord[];
}>> => {
  const documents: AccountRecordPageDocument[] = [];
  const records: AccountRecord[] = [];
  let afterDocumentId: string | undefined;
  while (true) {
    const page = await store.readRecordPage(uid, generationId, afterDocumentId, ACCOUNT_RECORD_PAGE_SIZE);
    if (page.length > ACCOUNT_RECORD_PAGE_SIZE) throw new Error("corrupt_account_record_page");
    let previous = afterDocumentId;
    for (const document of page) {
      if (!HASH_PATTERN.test(document.documentId) || (previous !== undefined && document.documentId <= previous)) {
        throw new Error("corrupt_account_record_page");
      }
      records.push(decodePersistedAccountRecordDocument(document.value, document.documentId));
      documents.push(document);
      previous = document.documentId;
    }
    if (page.length < ACCOUNT_RECORD_PAGE_SIZE) break;
    afterDocumentId = page.at(-1)!.documentId;
  }
  const dataset = { records };
  validateAccountDataset(dataset);
  return { documents, records };
};

const readStableSnapshot = async (store: AccountDatasetStore, uid: string): Promise<StableSnapshot> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const before = await store.readHead(uid);
    if (before) validateAccountDatasetHead(before);
    if (!before) {
      const after = await store.readHead(uid);
      if (!after) return {
        documents: [],
        head: undefined,
        remote: { accountRevision: 0, dataset: EMPTY_DATASET, operationFingerprints: [] },
      };
      validateAccountDatasetHead(after);
      continue;
    }
    const generation = before.activeGeneration === null
      ? { documents: [], records: [] }
      : await readGeneration(store, uid, before.activeGeneration);
    const after = await store.readHead(uid);
    if (after) validateAccountDatasetHead(after);
    if (!sameHeadAuthority(before, after)) continue;
    const dataset: AccountDataset = { records: generation.records };
    const manifest = manifestFor(dataset);
    if (!sameManifest(manifest, before.manifest)) throw new Error("account_dataset_manifest_mismatch");
    return {
      documents: generation.documents,
      head: after,
      remote: {
        accountRevision: before.accountRevision,
        dataset,
        operationFingerprints: before.operationFingerprints,
      },
    };
  }
  throw new Error("account_snapshot_changed_retryable");
};

const validateSnapshotPageInput = (input: AccountSnapshotPageInput): void => {
  const initial = input.cursor === null
    && input.expectedAccountRevision === null
    && input.expectedDatasetFingerprint === null;
  const bound = (input.cursor === null || HASH_PATTERN.test(input.cursor))
    && Number.isInteger(input.expectedAccountRevision)
    && (input.expectedAccountRevision as number) >= 0
    && typeof input.expectedDatasetFingerprint === "string"
    && HASH_PATTERN.test(input.expectedDatasetFingerprint);
  if (!initial && !bound) throw new Error("invalid_snapshot_request");
};

const snapshotAuthority = (head: AccountDatasetHead | undefined): Readonly<{
  accountRevision: number;
  activeGeneration: string | null;
  manifest: AccountDatasetManifest;
}> => head === undefined
  ? { accountRevision: 0, activeGeneration: null, manifest: EMPTY_MANIFEST }
  : { accountRevision: head.accountRevision, activeGeneration: head.activeGeneration, manifest: head.manifest };

const matchesSnapshotBinding = (
  input: AccountSnapshotPageInput,
  authority: ReturnType<typeof snapshotAuthority>,
): boolean => input.expectedAccountRevision === null || (
  input.expectedAccountRevision === authority.accountRevision
  && input.expectedDatasetFingerprint === authority.manifest.fingerprint
);

const readStableSnapshotPage = async (
  store: AccountDatasetStore,
  uid: string,
  input: AccountSnapshotPageInput,
): Promise<AccountSnapshotPage> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const before = await store.readHead(uid);
    if (before) validateAccountDatasetHead(before);
    const authority = snapshotAuthority(before);
    if (!matchesSnapshotBinding(input, authority)) throw new Error("snapshot_changed");

    const documents = authority.activeGeneration === null
      ? []
      : await store.readRecordPage(
        uid,
        authority.activeGeneration,
        input.cursor ?? undefined,
        21,
      );
    if (documents.length > 21) throw new Error("corrupt_account_record_page");
    const entries: Array<Readonly<{ cursor: string; record: AccountRecord }>> = [];
    let previous = input.cursor ?? undefined;
    for (const document of documents) {
      if (!HASH_PATTERN.test(document.documentId) || (previous !== undefined && document.documentId <= previous)) {
        throw new Error("corrupt_account_record_page");
      }
      entries.push({
        cursor: document.documentId,
        record: decodePersistedAccountRecordDocument(document.value, document.documentId),
      });
      previous = document.documentId;
    }
    if (entries.length > authority.manifest.recordCount) throw new Error("account_dataset_manifest_mismatch");

    const after = await store.readHead(uid);
    if (after) validateAccountDatasetHead(after);
    if (!sameHeadAuthority(before, after)) {
      if (input.expectedAccountRevision !== null) throw new Error("snapshot_changed");
      continue;
    }
    if (input.cursor === null && documents.length < 21) {
      const completeDataset: AccountDataset = { records: entries.map((entry) => entry.record) };
      const manifest = manifestFor(completeDataset);
      if (!sameManifest(manifest, authority.manifest)) throw new Error("account_dataset_manifest_mismatch");
    }
    return {
      accountRevision: authority.accountRevision,
      datasetFingerprint: authority.manifest.fingerprint,
      entries,
      recordCount: authority.manifest.recordCount,
    };
  }
  throw new Error("account_snapshot_changed_retryable");
};

const preflightSyncEnvelope = (
  uid: string,
  generationId: string,
  mutations: readonly SyncMutation[],
  existingByKey: ReadonlyMap<string, AccountRecordPageDocument>,
): void => {
  let bytes = 0;
  for (const mutation of mutations) {
    const identity = mutationIdentity(mutation);
    const keyHash = computeAccountRecordKeyHash(identity.type, identity.id);
    switch (mutation.kind) {
      case "put": {
        const document = createPersistedAccountRecordDocument(mutation.record);
        bytes += estimatePersistedAccountRecordBytes(accountRecordDocumentPath(uid, generationId, keyHash), document);
        break;
      }
      case "delete": {
        const existing = existingByKey.get(recordKey(identity.type, identity.id));
        if (!existing) throw new Error("record_revision_conflict");
        bytes += estimatePersistedAccountRecordBytes(
          accountRecordDocumentPath(uid, generationId, existing.documentId),
          existing.value,
        );
        break;
      }
      default:
        invalidSyncMutation(mutation);
    }
  }
  if (bytes > MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES) throw new Error("sync_operation_too_large");
};

const applyMutations = (
  records: ReadonlyMap<string, AccountRecord>,
  mutations: readonly SyncMutation[],
): Map<string, AccountRecord> => {
  const updated = new Map(records);
  for (const mutation of mutations) {
    const identity = mutationIdentity(mutation);
    const key = recordKey(identity.type, identity.id);
    const existing = updated.get(key);
    switch (mutation.kind) {
      case "delete":
        if (
          !existing
          || existing.revision !== mutation.expectedRecordRevision
          || existing.fingerprint !== mutation.expectedFingerprint
        ) throw new Error("record_revision_conflict");
        updated.delete(key);
        break;
      case "put": {
        const immutable = mutation.record.type === "trainingAttempt" || mutation.record.type === "trainingSessionResult";
        if (immutable) {
          if (mutation.expectedRecordRevision !== null) throw new Error("record_revision_conflict");
          if (existing && existing.fingerprint !== mutation.record.fingerprint) throw new Error("immutable_integrity_conflict");
          if (!existing) updated.set(key, mutation.record);
          break;
        }
        if (!existing) {
          if (mutation.expectedRecordRevision !== null || mutation.record.revision !== 1) {
            throw new Error("record_revision_conflict");
          }
          updated.set(key, mutation.record);
          break;
        }
        if (
          existing.revision === undefined
          || mutation.expectedRecordRevision === null
          || mutation.expectedRecordRevision !== existing.revision
          || mutation.record.revision !== existing.revision + 1
        ) {
          throw new Error("record_revision_conflict");
        }
        updated.set(key, mutation.record);
        break;
      }
      default:
        invalidSyncMutation(mutation);
    }
  }
  const dataset = { records: [...updated.values()] };
  validateAccountDataset(dataset);
  return updated;
};

export type StartAdoptionInput = Readonly<{
  adoptionId: string;
  expectedAccountRevision: number;
  expectedDatasetFingerprint: string;
  localDatasetFingerprint: string;
  localRecordCount: number;
  restartCancelled: boolean;
  restartDiscarded: boolean;
}>;

export type UploadAdoptionPageInput = Readonly<{
  adoptionId: string;
  pageFingerprint: string;
  records: readonly AccountRecord[];
  startRecordIndex: number;
}>;

export type AdoptionTerminalReceipt =
  | Readonly<{ adoptionId: string; adoptionResult: AdoptionResult; caseId: AdoptionCase; committedAccountRevision: number; operationFingerprint: string; result: "completed" }>
  | Readonly<{ adoptionId: string; result: "cancelled" }>
  | Readonly<{ adoptionId: string; reason: "expired" | "snapshotChanged"; result: "discarded" }>;

const leaseExpiry = (now: number): string => new Date(now + TRANSITION_LEASE_MS).toISOString();
const canonicalBytes = (value: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(value));
const textBytes = (value: string): Uint8Array => new TextEncoder().encode(value);

const computeAdoptionId = (input: Omit<StartAdoptionInput, "adoptionId" | "restartCancelled" | "restartDiscarded">): string =>
  computeCanonicalSha256({
    expectedAccountRevision: input.expectedAccountRevision,
    expectedDatasetFingerprint: input.expectedDatasetFingerprint,
    kind: "accountAdoption",
    localDatasetFingerprint: input.localDatasetFingerprint,
    localRecordCount: input.localRecordCount,
  });

const operationBindingMatchesHead = (operation: ActiveAdoptionOperation, head: AccountDatasetHead | undefined): boolean => {
  const authority = snapshotAuthority(head);
  return operation.remoteAccountRevision === authority.accountRevision
    && operation.remoteGeneration === authority.activeGeneration
    && operation.remoteDatasetFingerprint === authority.manifest.fingerprint
    && operation.remoteRecordCount === authority.manifest.recordCount;
};

const terminalReceipt = (operation: TerminalAdoptionOperation): AdoptionTerminalReceipt => {
  switch (operation.stage) {
    case "completed": return {
      adoptionId: operation.adoptionId,
      adoptionResult: operation.adoptionResult,
      caseId: operation.caseId,
      committedAccountRevision: operation.committedAccountRevision,
      operationFingerprint: operation.operationFingerprint,
      result: "completed",
    };
    case "cancelled": return { adoptionId: operation.adoptionId, result: "cancelled" };
    case "discarded": return { adoptionId: operation.adoptionId, reason: operation.reason, result: "discarded" };
  }
};

const activeOperation = (value: AdoptionOperation): value is ActiveAdoptionOperation =>
  value.stage !== "completed" && value.stage !== "cancelled" && value.stage !== "discarded";

const nextAdvanceState = <T extends ActiveAdoptionOperation>(
  previous: ActiveAdoptionOperation,
  value: Omit<T, keyof AdoptionBase | "stage"> & Readonly<{ stage: T["stage"] }>,
  expectedStepToken: string,
  now: number,
): T => {
  const stepNumber = previous.stepNumber + 1;
  const stepToken = adoptionStepToken(previous.adoptionId, stepNumber, value.stage);
  const receipt: AdoptionAdvanceReceipt = {
    adoptionId: previous.adoptionId,
    result: "advanced",
    stage: value.stage,
    stepToken,
  };
  return {
    ...value,
    adoptionId: previous.adoptionId,
    lastAdvance: { expectedStepToken, receipt },
    lastUpload: previous.lastUpload,
    leaseExpiresAt: leaseExpiry(now),
    localDatasetFingerprint: previous.localDatasetFingerprint,
    localRecordCount: previous.localRecordCount,
    remoteAccountRevision: previous.remoteAccountRevision,
    remoteDatasetFingerprint: previous.remoteDatasetFingerprint,
    remoteGeneration: previous.remoteGeneration,
    remoteRecordCount: previous.remoteRecordCount,
    stepNumber,
    stepToken,
    version: 1,
  } as T;
};

const nextCommandState = <T extends ActiveAdoptionOperation>(
  previous: ActiveAdoptionOperation,
  value: Omit<T, keyof AdoptionBase | "stage"> & Readonly<{ stage: T["stage"] }>,
  now: number,
): T => {
  const stepNumber = previous.stepNumber + 1;
  return {
    ...value,
    adoptionId: previous.adoptionId,
    lastAdvance: null,
    lastUpload: previous.lastUpload,
    leaseExpiresAt: leaseExpiry(now),
    localDatasetFingerprint: previous.localDatasetFingerprint,
    localRecordCount: previous.localRecordCount,
    remoteAccountRevision: previous.remoteAccountRevision,
    remoteDatasetFingerprint: previous.remoteDatasetFingerprint,
    remoteGeneration: previous.remoteGeneration,
    remoteRecordCount: previous.remoteRecordCount,
    stepNumber,
    stepToken: adoptionStepToken(previous.adoptionId, stepNumber, value.stage),
    version: 1,
  } as T;
};

const terminalAdvance = (
  previous: ActiveAdoptionOperation,
  stage: "completed" | "cancelled" | "discarded",
  expectedStepToken: string,
): Readonly<{ lastAdvance: TerminalLastAdvance; stepNumber: number; stepToken: string }> => {
  const stepNumber = previous.stepNumber + 1;
  const stepToken = adoptionStepToken(previous.adoptionId, stepNumber, stage);
  return {
    lastAdvance: {
      expectedStepToken,
      receipt: { adoptionId: previous.adoptionId, result: "advanced", stage, stepToken },
    },
    stepNumber,
    stepToken,
  };
};

const classifyAdoption = (input: Readonly<{
  conflictCount: number;
  localActive: ActiveSessionSummary;
  localCount: number;
  remoteActive: ActiveSessionSummary;
  remoteCount: number;
}>): Readonly<{ caseId: AdoptionCase; result: AdoptionResult }> => {
  if (input.localActive !== null && input.remoteActive !== null
    && input.localActive.fingerprint !== input.remoteActive.fingerprint) {
    return { caseId: "divergentActiveSessions", result: "requireExplicitSessionChoiceAndConfirmedAbandonmentOfOtherDraft" };
  }
  if ((input.localActive !== null) !== (input.remoteActive !== null)) {
    return { caseId: "activeSessionOnOneSide", result: "preserveThatSessionAndRejectSecondActiveSession" };
  }
  if (input.conflictCount > 0) return { caseId: "divergentRecord", result: "applyRecordPolicyOrBlockWithoutMutation" };
  if (input.localCount === 0 && input.remoteCount === 0) return { caseId: "emptyLocalEmptyRemote", result: "createBoundEmptyDataset" };
  if (input.localCount > 0 && input.remoteCount === 0) return { caseId: "populatedLocalEmptyRemote", result: "previewThenUploadExactLocalDataset" };
  if (input.localCount === 0) return { caseId: "emptyLocalPopulatedRemote", result: "previewThenRestoreExactRemoteDataset" };
  return { caseId: "populatedLocalPopulatedRemote", result: "previewThenReconcileByRecordPolicy" };
};

const confirmationValue = (confirmation: AdoptionConfirmation): Readonly<Record<string, unknown>> => ({
  abandonOtherActiveSessionConfirmed: confirmation.abandonOtherActiveSessionConfirmed ?? false,
  confirmed: confirmation.confirmed,
  planId: confirmation.planId,
  selectedActiveSessionSide: confirmation.selectedActiveSessionSide ?? null,
});

const compareDescriptorIdentity = (
  left: Pick<AccountRecordDescriptor, "id" | "type">,
  right: Pick<AccountRecordDescriptor, "id" | "type">,
): number => compareAccountRecordIdentity(left, right);

const descriptorMatchesDocument = (
  descriptor: AccountRecordDescriptor,
  document: PersistedAccountRecordDocument | undefined,
): document is PersistedAccountRecordDocument => document !== undefined
  && descriptor.documentId === document.keyHash
  && descriptor.canonicalByteLength === document.canonicalByteLength
  && descriptor.fingerprint === document.fingerprint
  && descriptor.id === document.id
  && descriptor.revision === document.revision
  && descriptor.type === document.type;

const selectProofDescriptors = <T extends Readonly<{ canonicalByteLength: number; documentId: string }>>(
  page: readonly T[],
): readonly T[] => {
  const selected: T[] = [];
  let rawBytes = 0;
  let descriptorBytes = 0;
  for (const descriptor of page.slice(0, MAX_ADOPTION_PAGE_RECORDS)) {
    const nextRawBytes = rawBytes + descriptor.canonicalByteLength;
    const nextDescriptorBytes = descriptorBytes + Buffer.byteLength(JSON.stringify(descriptor), "utf8");
    if (nextRawBytes > MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES || nextDescriptorBytes > 128 * 1024) break;
    selected.push(descriptor);
    rawBytes = nextRawBytes;
    descriptorBytes = nextDescriptorBytes;
  }
  if (page.length > 0 && selected.length === 0) throw new Error("candidate_proof_step_too_large");
  return selected;
};

const sameOperation = (left: AdoptionOperation | undefined, right: AdoptionOperation): boolean =>
  left !== undefined && computeCanonicalSha256(left) === computeCanonicalSha256(right);

const sameLocalDocument = (left: AdoptionLocalRecordDocument | undefined, right: AdoptionLocalRecordDocument): boolean =>
  left !== undefined && left.sequenceId === right.sequenceId && samePersistedRecord(left.record, right.record);

const conflictCodeFor = (record: AccountRecord): AdoptionConflict["code"] =>
  record.type === "trainingAttempt" || record.type === "trainingSessionResult"
    ? "immutable_integrity_conflict"
    : "revision_conflict";

const canonicalConflictBytes = (conflict: AdoptionConflict): Uint8Array => canonicalBytes({
  code: conflict.code,
  recordId: conflict.recordId,
  recordType: conflict.recordType,
});

export class AccountDataService {
  constructor(
    private readonly store: AccountDatasetStore,
    private readonly now: () => number = Date.now,
  ) {}

  async readSnapshotPage(uid: string, input: AccountSnapshotPageInput): Promise<AccountSnapshotPage> {
    validateSnapshotPageInput(input);
    return readStableSnapshotPage(this.store, uid, input);
  }

  async startAdoption(uid: string, input: StartAdoptionInput): Promise<
    | Readonly<{ adoptionId: string; result: "started" | "resumed"; stage: AdoptionStage; stepToken: string }>
    | Readonly<{ adoptionId: string; result: "cleanupRequired"; stage: "discarding" | "activatedCleaning"; stepToken: string }>
    | AdoptionTerminalReceipt
  > {
    if (!isObject(input) || !exactKeys(input, [
      "adoptionId", "expectedAccountRevision", "expectedDatasetFingerprint", "localDatasetFingerprint",
      "localRecordCount", "restartCancelled", "restartDiscarded",
    ]) || !Number.isSafeInteger(input.expectedAccountRevision) || input.expectedAccountRevision < 0
      || !HASH_PATTERN.test(input.expectedDatasetFingerprint) || !HASH_PATTERN.test(input.localDatasetFingerprint)
      || !Number.isSafeInteger(input.localRecordCount) || input.localRecordCount < 0
      || typeof input.restartCancelled !== "boolean" || typeof input.restartDiscarded !== "boolean"
      || input.adoptionId !== computeAdoptionId(input)) throw new Error("invalid_adoption_start");
    const commandNow = this.now();
    const existing = await this.store.readAdoptionOperation(uid);
    if (existing) validateAdoptionOperation(existing);
    if (existing && existing.adoptionId === input.adoptionId && !activeOperation(existing)) {
      if (existing.stage === "completed"
        || (existing.stage === "cancelled" && !input.restartCancelled)
        || (existing.stage === "discarded" && !input.restartDiscarded)) return terminalReceipt(existing);
    }
    if (existing && activeOperation(existing)
      && (existing.stage === "discarding" || existing.stage === "activatedCleaning")) {
      return { adoptionId: existing.adoptionId, result: "cleanupRequired", stage: existing.stage, stepToken: existing.stepToken };
    }
    if (existing && activeOperation(existing)) {
      const before = await this.store.readHead(uid);
      if (before) validateAccountDatasetHead(before);
      const after = await this.store.readHead(uid);
      if (after) validateAccountDatasetHead(after);
      if (!sameHeadExact(before, after)) throw new Error("account_snapshot_changed_retryable");
      const authority = snapshotAuthority(after);
      if (authority.accountRevision !== input.expectedAccountRevision
        || authority.manifest.fingerprint !== input.expectedDatasetFingerprint) throw new Error("snapshot_changed");
      if (existing.adoptionId === input.adoptionId && Date.parse(existing.leaseExpiresAt) > commandNow) {
        return { adoptionId: existing.adoptionId, result: "resumed", stage: existing.stage, stepToken: existing.stepToken };
      }
      if (Date.parse(existing.leaseExpiresAt) > commandNow) throw new Error("adoption_in_progress");
      return this.store.runTransaction(uid, async (transaction) => {
        const current = await transaction.readAdoptionOperation();
        const head = await transaction.readHead();
        if (!sameOperation(current, existing) || !sameHeadExact(head, after)) throw new Error("adoption_step_changed");
        const candidateGeneration = existing.stage === "buildingCandidate"
          || existing.stage === "checkingCandidate"
          || existing.stage === "hashingCandidateManifest"
          ? existing.operationFingerprint : null;
        const discarding = nextCommandState<Extract<ActiveAdoptionOperation, { stage: "discarding" }>>(
          existing,
          { stage: "discarding", reason: "expired", candidateGeneration, cleanup: { phase: "localRecords", cursor: null } },
          commandNow,
        );
        transaction.writeAdoptionOperation(discarding);
        return { adoptionId: existing.adoptionId, result: "cleanupRequired" as const, stage: "discarding" as const, stepToken: discarding.stepToken };
      });
    }

    return this.store.runTransaction(uid, async (transaction) => {
      const current = await transaction.readAdoptionOperation();
      const head = await transaction.readHead();
      if (existing === undefined ? current !== undefined : !sameOperation(current, existing)) throw new Error("adoption_in_progress");
      const authority = snapshotAuthority(head);
      if (authority.accountRevision !== input.expectedAccountRevision
        || authority.manifest.fingerprint !== input.expectedDatasetFingerprint) throw new Error("snapshot_changed");
      const stage = input.localRecordCount === 0 ? "preparing" : "uploading";
      if (stage === "preparing" && input.localDatasetFingerprint !== EMPTY_MANIFEST.fingerprint) throw new Error("invalid_adoption_start");
      const stepToken = adoptionStepToken(input.adoptionId, 0, stage);
      const base: AdoptionBase = {
        adoptionId: input.adoptionId,
        lastAdvance: null,
        lastUpload: null,
        leaseExpiresAt: leaseExpiry(commandNow),
        localDatasetFingerprint: input.localDatasetFingerprint,
        localRecordCount: input.localRecordCount,
        remoteAccountRevision: authority.accountRevision,
        remoteDatasetFingerprint: authority.manifest.fingerprint,
        remoteGeneration: authority.activeGeneration,
        remoteRecordCount: authority.manifest.recordCount,
        stepNumber: 0,
        stepToken,
        version: 1,
      };
      const created: ActiveAdoptionOperation = stage === "uploading" ? {
        ...base, stage, nextRecordIndex: 0, lastRecordType: null, lastRecordId: null,
        localDigestState: Sha256Accumulator.create().update(canonicalBytes({ records: [] }).slice(0, 12)).exportState(),
      } : {
        ...base, stage, localAfterSequenceId: null, remoteAfterCursor: null, localProcessedCount: 0,
        remoteProcessedCount: 0, nextConflictIndex: 0, localActiveSessionSummary: null, remoteActiveSessionSummary: null,
      };
      transaction.writeAdoptionOperation(created);
      return { adoptionId: created.adoptionId, result: "started" as const, stage: created.stage, stepToken: created.stepToken };
    });
  }

  async uploadAdoptionPage(uid: string, input: UploadAdoptionPageInput): Promise<AdoptionUploadReceipt> {
    if (!isObject(input) || !exactKeys(input, ["adoptionId", "pageFingerprint", "records", "startRecordIndex"])
      || typeof input.adoptionId !== "string" || !HASH_PATTERN.test(input.adoptionId)
      || typeof input.pageFingerprint !== "string" || !HASH_PATTERN.test(input.pageFingerprint)
      || !Array.isArray(input.records) || input.records.length < 1 || input.records.length > MAX_ADOPTION_PAGE_RECORDS
      || !Number.isSafeInteger(input.startRecordIndex) || input.startRecordIndex < 0) throw new Error("invalid_adoption_page");
    const documents = input.records.map(createPersistedAccountRecordDocument);
    const rawBytes = documents.reduce((total, entry) => total + entry.canonicalByteLength, 0);
    if (rawBytes > MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES) throw new Error("adoption_page_too_large");
    for (let index = 1; index < input.records.length; index += 1) {
      if (compareAccountRecordIdentity(input.records[index - 1]!, input.records[index]!) >= 0) throw new Error("adoption_page_conflict");
    }
    const expectedPageFingerprint = computeCanonicalSha256({
      adoptionId: input.adoptionId,
      kind: "adoptionUploadPage",
      records: input.records.map((record) => canonicalAccountDatasetValue({ records: [record] }) as never).map((value) => (value as { records: unknown[] }).records[0]),
      startRecordIndex: input.startRecordIndex,
    });
    if (expectedPageFingerprint !== input.pageFingerprint) throw new Error("invalid_adoption_page_fingerprint");
    const commandNow = this.now();
    const operation = await this.store.readAdoptionOperation(uid);
    if (!operation) throw new Error("adoption_not_ready");
    validateAdoptionOperation(operation);
    if (operation.adoptionId !== input.adoptionId) throw new Error("adoption_step_changed");
    if (activeOperation(operation) && operation.lastUpload
      && operation.lastUpload.startRecordIndex === input.startRecordIndex
      && operation.lastUpload.recordCount === documents.length
      && operation.lastUpload.pageFingerprint === input.pageFingerprint) return operation.lastUpload.receipt;
    if (operation.stage !== "uploading" || operation.nextRecordIndex !== input.startRecordIndex) throw new Error("adoption_page_conflict");
    if (operation.lastRecordType !== null && compareAccountRecordIdentity(
      { type: operation.lastRecordType, id: operation.lastRecordId! }, input.records[0]!,
    ) >= 0) throw new Error("adoption_page_conflict");
    const nextIndex = input.startRecordIndex + documents.length;
    if (nextIndex > operation.localRecordCount) throw new Error("adoption_page_conflict");
    const localDocs = documents.map((recordDocument, index): AdoptionLocalRecordDocument => ({
      record: recordDocument,
      sequenceId: adoptionSequenceId(input.startRecordIndex + index),
    }));
    const minimumWriteEnvelopeBytes = localDocs.reduce((total, entry) => total + estimatePersistedAccountRecordBytes(
      `accounts/${uid}/adoptionOperations/current/localRecords/${entry.sequenceId}`, entry.record,
    ), 0);
    if (minimumWriteEnvelopeBytes > MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES) throw new Error("adoption_page_too_large");
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      const existing = await Promise.all(localDocs.map((entry) => transaction.readAdoptionLocalRecord(entry.sequenceId)));
      if (!sameOperation(current, operation)) throw new Error("adoption_page_conflict");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      if (existing.some((entry) => entry !== undefined)) throw new Error("adoption_page_conflict");
      const digest = Sha256Accumulator.restore(operation.localDigestState);
      for (let index = 0; index < documents.length; index += 1) {
        if (input.startRecordIndex + index > 0) digest.update(textBytes(","));
        digest.update(documents[index]!.canonicalBytes);
      }
      const final = nextIndex === operation.localRecordCount;
      if (final) {
        digest.update(textBytes("]}"));
        if (digest.digestHex() !== operation.localDatasetFingerprint) throw new Error("adoption_dataset_fingerprint_mismatch");
      }
      const nextStage: "preparing" | "uploading" = final ? "preparing" : "uploading";
      const stepNumber = final ? operation.stepNumber + 1 : operation.stepNumber;
      const stepToken = final ? adoptionStepToken(operation.adoptionId, stepNumber, nextStage) : operation.stepToken;
      const receipt: AdoptionUploadReceipt = {
        acceptedNextRecordIndex: nextIndex, adoptionId: operation.adoptionId, pageFingerprint: input.pageFingerprint,
        result: "accepted", stage: nextStage, stepToken,
      };
      const lastUpload: Exclude<AdoptionLastUpload, null> = {
        pageFingerprint: input.pageFingerprint, receipt, recordCount: documents.length, startRecordIndex: input.startRecordIndex,
      };
      const next: ActiveAdoptionOperation = final ? {
        adoptionId: operation.adoptionId, lastAdvance: null, lastUpload, leaseExpiresAt: leaseExpiry(commandNow),
        localDatasetFingerprint: operation.localDatasetFingerprint, localRecordCount: operation.localRecordCount,
        remoteAccountRevision: operation.remoteAccountRevision, remoteDatasetFingerprint: operation.remoteDatasetFingerprint,
        remoteGeneration: operation.remoteGeneration, remoteRecordCount: operation.remoteRecordCount,
        stage: "preparing", stepNumber, stepToken, version: 1, localAfterSequenceId: null,
        remoteAfterCursor: null, localProcessedCount: 0, remoteProcessedCount: 0, nextConflictIndex: 0,
        localActiveSessionSummary: null, remoteActiveSessionSummary: null,
      } : {
        ...operation, leaseExpiresAt: leaseExpiry(commandNow), localDigestState: digest.exportState(),
        nextRecordIndex: nextIndex, lastRecordType: input.records.at(-1)!.type,
        lastRecordId: input.records.at(-1)!.id, lastUpload,
      };
      const writeEnvelopeBytes = localDocs.reduce((total, entry) => total + estimatePersistedAccountRecordBytes(
        `accounts/${uid}/adoptionOperations/current/localRecords/${entry.sequenceId}`, entry.record,
      ), Buffer.byteLength(JSON.stringify(next), "utf8"));
      if (writeEnvelopeBytes > MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES) throw new Error("adoption_page_too_large");
      for (const entry of localDocs) transaction.putAdoptionLocalRecord(entry);
      transaction.writeAdoptionOperation(next);
      return receipt;
    });
  }

  async readAdoptionPreviewPage(uid: string, input: Readonly<{
    adoptionId: string;
    afterSequenceId: string | null;
  }>): Promise<Readonly<{
    adoptionId: string;
    caseId: AdoptionCase;
    conflictCount: number;
    conflicts: readonly AdoptionConflict[];
    localFingerprint: string;
    nextCursor: string | null;
    planId: string;
    remoteFingerprint: string;
    result: AdoptionResult;
  }>> {
    if (!isObject(input) || !exactKeys(input, ["adoptionId", "afterSequenceId"])
      || typeof input.adoptionId !== "string" || !HASH_PATTERN.test(input.adoptionId)
      || (input.afterSequenceId !== null && !validSequenceId(input.afterSequenceId))) throw new Error("invalid_adoption_preview_page");
    const commandNow = this.now();
    const operation = await this.store.readAdoptionOperation(uid);
    if (!operation) throw new Error("adoption_not_ready");
    validateAdoptionOperation(operation);
    if (operation.adoptionId !== input.adoptionId) throw new Error("adoption_step_changed");
    if (operation.stage !== "previewReady" && operation.stage !== "hashingConfirmation" && operation.stage !== "buildingCandidate"
      && operation.stage !== "checkingCandidate" && operation.stage !== "hashingCandidateManifest") {
      throw new Error("adoption_not_ready");
    }
    const page = await this.store.readAdoptionConflictPage(uid, input.afterSequenceId, MAX_ADOPTION_PAGE_RECORDS + 1);
    const selected = page.slice(0, MAX_ADOPTION_PAGE_RECORDS);
    const nextCursor = page.length > MAX_ADOPTION_PAGE_RECORDS ? selected.at(-1)!.sequenceId : null;
    await this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      transaction.writeAdoptionOperation({ ...operation, leaseExpiresAt: leaseExpiry(commandNow) });
    });
    return {
      adoptionId: operation.adoptionId,
      caseId: operation.caseId,
      conflictCount: operation.conflictCount,
      conflicts: selected.map((entry) => entry.conflict),
      localFingerprint: operation.localFingerprint,
      nextCursor,
      planId: operation.planId,
      remoteFingerprint: operation.remoteFingerprint,
      result: operation.result,
    };
  }

  async confirmAdoptionOperation(uid: string, input: Readonly<{
    adoptionId: string;
    confirmation: AdoptionConfirmation;
  }>): Promise<Readonly<{ adoptionId: string; result: "accepted"; stage: AdoptionStage; stepToken: string }> | AdoptionTerminalReceipt> {
    if (!isObject(input) || !exactKeys(input, ["adoptionId", "confirmation"])
      || typeof input.adoptionId !== "string" || !HASH_PATTERN.test(input.adoptionId)
      || !validConfirmation(input.confirmation)) throw new Error("invalid_adoption_confirmation");
    const commandNow = this.now();
    const operation = await this.store.readAdoptionOperation(uid);
    if (!operation) throw new Error("adoption_not_ready");
    validateAdoptionOperation(operation);
    if (operation.adoptionId !== input.adoptionId) throw new Error("adoption_step_changed");
    const fingerprint = computeCanonicalSha256(confirmationValue(input.confirmation));
    if (!activeOperation(operation)) {
      if (operation.stage === "completed" && operation.confirmationFingerprint === fingerprint) return terminalReceipt(operation);
      throw new Error("adoption_not_ready");
    }
    if (operation.stage === "hashingConfirmation" || operation.stage === "buildingCandidate"
      || operation.stage === "checkingCandidate" || operation.stage === "hashingCandidateManifest"
      || operation.stage === "activatedCleaning") {
      if (operation.confirmationFingerprint !== fingerprint) throw new Error("adoption_not_ready");
      return { adoptionId: operation.adoptionId, result: "accepted", stage: operation.stage, stepToken: operation.stepToken };
    }
    if (operation.stage !== "previewReady") throw new Error("adoption_not_ready");
    if (!input.confirmation.confirmed || input.confirmation.planId !== operation.planId) throw new Error("adoption_not_ready");
    if (operation.caseId !== "divergentActiveSessions" && operation.conflictCount > 0) throw new Error("adoption_conflict");
    if (operation.caseId === "divergentActiveSessions" && (
      input.confirmation.abandonOtherActiveSessionConfirmed !== true
      || (input.confirmation.selectedActiveSessionSide !== "local" && input.confirmation.selectedActiveSessionSide !== "remote")
    )) throw new Error("active_session_conflict");
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      const prefix = `{"confirmation":${JSON.stringify(confirmationValue(input.confirmation))},"expectedAccountRevision":${operation.remoteAccountRevision},"kind":"adoptionConfirmation","local":{"records":[`;
      const next = nextCommandState<Extract<ActiveAdoptionOperation, { stage: "hashingConfirmation" }>>(
        operation,
        {
          stage: "hashingConfirmation", conflictCount: operation.conflictCount, caseId: operation.caseId,
          result: operation.result, localFingerprint: operation.localFingerprint, remoteFingerprint: operation.remoteFingerprint,
          planId: operation.planId, localActiveSessionSummary: operation.localActiveSessionSummary,
          remoteActiveSessionSummary: operation.remoteActiveSessionSummary, confirmation: input.confirmation,
          confirmationFingerprint: fingerprint, localAfterSequenceId: null,
          operationDigestState: Sha256Accumulator.create().update(textBytes(prefix)).exportState(),
        },
        commandNow,
      );
      transaction.writeAdoptionOperation(next);
      return { adoptionId: next.adoptionId, result: "accepted" as const, stage: next.stage, stepToken: next.stepToken };
    });
  }

  async cancelAdoption(uid: string, input: Readonly<{ adoptionId: string }>): Promise<
    Readonly<{ adoptionId: string; result: "discarding"; stage: "discarding"; stepToken: string }> | AdoptionTerminalReceipt
  > {
    if (!isObject(input) || !exactKeys(input, ["adoptionId"]) || typeof input.adoptionId !== "string" || !HASH_PATTERN.test(input.adoptionId)) {
      throw new Error("invalid_adoption_cancel");
    }
    const commandNow = this.now();
    const operation = await this.store.readAdoptionOperation(uid);
    if (!operation) throw new Error("adoption_not_ready");
    validateAdoptionOperation(operation);
    if (operation.adoptionId !== input.adoptionId) throw new Error("adoption_step_changed");
    if (!activeOperation(operation)) return terminalReceipt(operation);
    if (operation.stage === "activatedCleaning") throw new Error("adoption_not_ready");
    if (operation.stage === "discarding") {
      return { adoptionId: operation.adoptionId, result: "discarding", stage: "discarding", stepToken: operation.stepToken };
    }
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      const candidateGeneration = operation.stage === "buildingCandidate"
        || operation.stage === "checkingCandidate"
        || operation.stage === "hashingCandidateManifest"
        ? operation.operationFingerprint : null;
      const next = nextCommandState<Extract<ActiveAdoptionOperation, { stage: "discarding" }>>(
        operation,
        { stage: "discarding", reason: "cancelled", candidateGeneration, cleanup: { phase: "localRecords", cursor: null } },
        commandNow,
      );
      transaction.writeAdoptionOperation(next);
      return { adoptionId: next.adoptionId, result: "discarding" as const, stage: "discarding" as const, stepToken: next.stepToken };
    });
  }

  async advanceAdoption(uid: string, input: Readonly<{
    adoptionId: string;
    expectedStepToken: string;
  }>): Promise<AdoptionAdvanceReceipt | AdoptionTerminalReceipt> {
    if (!isObject(input) || !exactKeys(input, ["adoptionId", "expectedStepToken"])
      || typeof input.adoptionId !== "string" || !HASH_PATTERN.test(input.adoptionId)
      || typeof input.expectedStepToken !== "string" || !HASH_PATTERN.test(input.expectedStepToken)) {
      throw new Error("invalid_adoption_advance");
    }
    const commandNow = this.now();
    const operation = await this.store.readAdoptionOperation(uid);
    if (!operation) throw new Error("adoption_not_ready");
    validateAdoptionOperation(operation);
    if (operation.adoptionId !== input.adoptionId) throw new Error("adoption_step_changed");
    if (operation.lastAdvance?.expectedStepToken === input.expectedStepToken) return operation.lastAdvance.receipt;
    if (operation.stepToken !== input.expectedStepToken) throw new Error("adoption_step_changed");
    if (!activeOperation(operation)) return terminalReceipt(operation);
    const head = await this.store.readHead(uid);
    if (head) validateAccountDatasetHead(head);
    if (operation.stage !== "activatedCleaning" && operation.stage !== "discarding" && !operationBindingMatchesHead(operation, head)) {
      await this.store.runTransaction(uid, async (transaction) => {
        const currentHead = await transaction.readHead();
        const current = await transaction.readAdoptionOperation();
        if (!sameOperation(current, operation) || sameHeadExact(currentHead, head) === false) throw new Error("adoption_step_changed");
        const candidateGeneration = operation.stage === "buildingCandidate"
          || operation.stage === "checkingCandidate"
          || operation.stage === "hashingCandidateManifest"
          ? operation.operationFingerprint : null;
        const next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "discarding" }>>(
          operation,
          { stage: "discarding", reason: "snapshotChanged", candidateGeneration, cleanup: { phase: "localRecords", cursor: null } },
          input.expectedStepToken,
          commandNow,
        );
        transaction.writeAdoptionOperation(next);
      });
      throw new Error("snapshot_changed");
    }
    switch (operation.stage) {
      case "uploading": throw new Error("adoption_not_ready");
      case "preparing": return this.advancePreparing(uid, operation, input.expectedStepToken, commandNow);
      case "hashingPlan": return this.advancePlanHash(uid, operation, input.expectedStepToken, commandNow);
      case "previewReady": throw new Error("adoption_not_ready");
      case "hashingConfirmation": return this.advanceConfirmationHash(uid, operation, input.expectedStepToken, commandNow);
      case "buildingCandidate": return this.advanceCandidate(uid, operation, input.expectedStepToken, commandNow);
      case "checkingCandidate": return this.advanceCandidatePhysicalProof(uid, operation, input.expectedStepToken, commandNow);
      case "hashingCandidateManifest": return this.advanceCandidateManifestProof(uid, operation, input.expectedStepToken, commandNow);
      case "activatedCleaning": case "discarding": return this.advanceCleanup(uid, operation, input.expectedStepToken, commandNow);
    }
  }

  private async advancePreparing(
    uid: string,
    operation: Extract<ActiveAdoptionOperation, { stage: "preparing" }>,
    expectedStepToken: string,
    commandNow: number,
  ): Promise<AdoptionAdvanceReceipt> {
    const localLookahead = await this.store.readAdoptionLocalRecordPage(uid, operation.localAfterSequenceId, 2);
    const remoteLookahead = operation.remoteGeneration === null ? [] : await this.store.readRecordDescriptorPage(
      uid, operation.remoteGeneration, operation.remoteAfterCursor, 2,
    );
    if ((operation.localProcessedCount < operation.localRecordCount) !== (localLookahead.length > 0)
      || (operation.remoteProcessedCount < operation.remoteRecordCount) !== (remoteLookahead.length > 0)
      || localLookahead.length > operation.localRecordCount - operation.localProcessedCount
      || remoteLookahead.length > operation.remoteRecordCount - operation.remoteProcessedCount) {
      throw new Error("corrupt_adoption_source_count");
    }
    if (localLookahead.some((entry, offset) =>
      entry.sequenceId !== adoptionSequenceId(operation.localProcessedCount + offset))) {
      throw new Error("corrupt_adoption_source_count");
    }
    const localPage = localLookahead.slice(0, 1);
    const remotePage = remoteLookahead.slice(0, 1);
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      const localRecords = await Promise.all(localPage.map((entry) => transaction.readAdoptionLocalRecord(entry.sequenceId)));
      const remoteRecords = operation.remoteGeneration === null ? [] : await Promise.all(
        remotePage.map((entry) => transaction.readRecord(operation.remoteGeneration!, entry.documentId)),
      );
      const prospectiveConflictIds = Array.from({ length: Math.min(localPage.length, remotePage.length) }, (_, index) =>
        adoptionSequenceId(operation.nextConflictIndex + index));
      const existingConflicts = await Promise.all(prospectiveConflictIds.map((id) => transaction.readAdoptionConflict(id)));
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      if (localRecords.some((entry, index) => !sameLocalDocument(entry, localPage[index]!))) throw new Error("corrupt_adoption_local_record");
      if (remoteRecords.some((entry, index) => !descriptorMatchesDocument(remotePage[index]!, entry))) throw new Error("corrupt_account_record_document");
      if (existingConflicts.some((entry) => entry !== undefined)) throw new Error("adoption_conflict_collision");
      let localIndex = 0;
      let remoteIndex = 0;
      let consumed = 0;
      let localActive = operation.localActiveSessionSummary;
      let remoteActive = operation.remoteActiveSessionSummary;
      const consumedLocal: AdoptionLocalRecordDocument[] = [];
      const consumedRemote: AccountRecordDescriptor[] = [];
      const conflicts: AdoptionConflictDocument[] = [];
      while (consumed < MAX_ADOPTION_PAGE_RECORDS && (localIndex < localPage.length || remoteIndex < remotePage.length)) {
        const local = localPage[localIndex];
        const remote = remotePage[remoteIndex];
        const comparison = local === undefined ? 1 : remote === undefined ? -1 : compareDescriptorIdentity(local.record, remote);
        const stepCost = (comparison <= 0 && local ? 1 : 0) + (comparison >= 0 && remote ? 1 : 0);
        if (consumed + stepCost > MAX_ADOPTION_PAGE_RECORDS) break;
        if (comparison <= 0 && local) {
          consumedLocal.push(local);
          localIndex += 1;
          if (local.record.type === "activeSessionReference") {
            const summary = { id: local.record.id, fingerprint: local.record.fingerprint };
            if (localActive && localActive.fingerprint !== summary.fingerprint) throw new Error("multiple_active_session_references");
            localActive = summary;
          }
        }
        if (comparison >= 0 && remote) {
          consumedRemote.push(remote);
          remoteIndex += 1;
          if (remote.type === "activeSessionReference") {
            const summary = { id: remote.id, fingerprint: remote.fingerprint };
            if (remoteActive && remoteActive.fingerprint !== summary.fingerprint) throw new Error("multiple_active_session_references");
            remoteActive = summary;
          }
        }
        if (comparison === 0 && local && remote && local.record.fingerprint !== remote.fingerprint) {
          const conflict: AdoptionConflict = {
            code: conflictCodeFor(decodePersistedAccountRecordDocument(local.record, local.record.keyHash)),
            recordId: local.record.id,
            recordType: local.record.type,
          };
          conflicts.push({ conflict, sequenceId: adoptionSequenceId(operation.nextConflictIndex + conflicts.length) });
        }
        consumed += stepCost;
      }
      if (consumed === 0 && (operation.localProcessedCount < operation.localRecordCount
        || operation.remoteProcessedCount < operation.remoteRecordCount)) throw new Error("corrupt_adoption_source_count");
      const localProcessedCount = operation.localProcessedCount + consumedLocal.length;
      const remoteProcessedCount = operation.remoteProcessedCount + consumedRemote.length;
      if (localProcessedCount > operation.localRecordCount || remoteProcessedCount > operation.remoteRecordCount) throw new Error("corrupt_adoption_operation");
      const localDone = localProcessedCount === operation.localRecordCount;
      const remoteDone = remoteProcessedCount === operation.remoteRecordCount;
      const next: ActiveAdoptionOperation = localDone && remoteDone
        ? nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "hashingPlan" }>>(
          operation,
          {
            stage: "hashingPlan",
            conflictAfterSequenceId: null,
            planDigestState: Sha256Accumulator.create().update(textBytes(`{"caseId":${JSON.stringify(classifyAdoption({ conflictCount: operation.nextConflictIndex + conflicts.length, localActive, localCount: operation.localRecordCount, remoteActive, remoteCount: operation.remoteRecordCount }).caseId)},"conflicts":[`)).exportState(),
            conflictCount: operation.nextConflictIndex + conflicts.length,
            ...classifyAdoption({ conflictCount: operation.nextConflictIndex + conflicts.length, localActive, localCount: operation.localRecordCount, remoteActive, remoteCount: operation.remoteRecordCount }),
            localFingerprint: operation.localDatasetFingerprint,
            remoteFingerprint: operation.remoteDatasetFingerprint,
            localActiveSessionSummary: localActive,
            remoteActiveSessionSummary: remoteActive,
          }, expectedStepToken, commandNow,
        )
        : nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "preparing" }>>(
          operation,
          {
            stage: "preparing",
            localAfterSequenceId: consumedLocal.at(-1)?.sequenceId ?? operation.localAfterSequenceId,
            remoteAfterCursor: consumedRemote.length === 0 ? operation.remoteAfterCursor : {
              type: consumedRemote.at(-1)!.type, id: consumedRemote.at(-1)!.id, documentId: consumedRemote.at(-1)!.documentId,
            },
            localProcessedCount, remoteProcessedCount,
            nextConflictIndex: operation.nextConflictIndex + conflicts.length,
            localActiveSessionSummary: localActive, remoteActiveSessionSummary: remoteActive,
          }, expectedStepToken, commandNow,
        );
      for (const conflict of conflicts) transaction.putAdoptionConflict(conflict);
      transaction.writeAdoptionOperation(next);
      return next.lastAdvance!.receipt;
    });
  }

  private async advancePlanHash(
    uid: string,
    operation: Extract<ActiveAdoptionOperation, { stage: "hashingPlan" }>,
    expectedStepToken: string,
    commandNow: number,
  ): Promise<AdoptionAdvanceReceipt> {
    const page = await this.store.readAdoptionConflictPage(uid, operation.conflictAfterSequenceId, MAX_ADOPTION_PAGE_RECORDS);
    const processed = page.length === 0
      ? operation.conflictAfterSequenceId === null ? 0 : Number(operation.conflictAfterSequenceId) + 1
      : Number(page.at(-1)!.sequenceId) + 1;
    if (processed > operation.conflictCount) throw new Error("corrupt_adoption_operation");
    const finished = processed === operation.conflictCount;
    if (!finished && page.length === 0) throw new Error("corrupt_adoption_conflict");
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      const currentConflicts = await Promise.all(page.map((entry) => transaction.readAdoptionConflict(entry.sequenceId)));
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      if (currentConflicts.some((entry, index) => computeCanonicalSha256(entry) !== computeCanonicalSha256(page[index]))) {
        throw new Error("corrupt_adoption_conflict");
      }
      const digest = Sha256Accumulator.restore(operation.planDigestState);
      for (const entry of page) {
        if (Number(entry.sequenceId) > 0) digest.update(textBytes(","));
        digest.update(canonicalConflictBytes(entry.conflict));
      }
      const next: ActiveAdoptionOperation = finished
        ? (() => {
          digest.update(textBytes(`],"localFingerprint":${JSON.stringify(operation.localFingerprint)},"remoteFingerprint":${JSON.stringify(operation.remoteFingerprint)},"result":${JSON.stringify(operation.result)}}`));
          return nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "previewReady" }>>(
            operation,
            {
              stage: "previewReady", conflictCount: operation.conflictCount, caseId: operation.caseId,
              result: operation.result, localFingerprint: operation.localFingerprint,
              remoteFingerprint: operation.remoteFingerprint, planId: digest.digestHex(),
              localActiveSessionSummary: operation.localActiveSessionSummary,
              remoteActiveSessionSummary: operation.remoteActiveSessionSummary,
            }, expectedStepToken, commandNow,
          );
        })()
        : nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "hashingPlan" }>>(
          operation,
          { ...operation, stage: "hashingPlan", conflictAfterSequenceId: page.at(-1)!.sequenceId, planDigestState: digest.exportState() },
          expectedStepToken, commandNow,
        );
      transaction.writeAdoptionOperation(next);
      return next.lastAdvance!.receipt;
    });
  }

  private async advanceConfirmationHash(
    uid: string,
    operation: Extract<ActiveAdoptionOperation, { stage: "hashingConfirmation" }>,
    expectedStepToken: string,
    commandNow: number,
  ): Promise<AdoptionAdvanceReceipt> {
    const page = await this.store.readAdoptionLocalRecordPage(uid, operation.localAfterSequenceId, 2);
    const processed = page.length === 0
      ? operation.localAfterSequenceId === null ? 0 : Number(operation.localAfterSequenceId) + 1
      : Number(page.at(-1)!.sequenceId) + 1;
    if (processed > operation.localRecordCount) throw new Error("corrupt_adoption_operation");
    const finished = processed === operation.localRecordCount;
    if (!finished && page.length === 0) throw new Error("corrupt_adoption_local_record");
    if (finished && page.length > 0 && processed > operation.localRecordCount) throw new Error("corrupt_adoption_local_record");
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      const local = await Promise.all(page.map((entry) => transaction.readAdoptionLocalRecord(entry.sequenceId)));
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      if (local.some((entry, index) => !sameLocalDocument(entry, page[index]!))) throw new Error("corrupt_adoption_local_record");
      const digest = Sha256Accumulator.restore(operation.operationDigestState);
      for (const entry of page) {
        if (Number(entry.sequenceId) > 0) digest.update(textBytes(","));
        digest.update(entry.record.canonicalBytes);
      }
      let next: ActiveAdoptionOperation;
      if (finished) {
        digest.update(textBytes("]}}"));
        const operationFingerprint = digest.digestHex();
        const rejectedActiveSessionId = operation.caseId === "divergentActiveSessions"
          ? operation.confirmation.selectedActiveSessionSide === "local"
            ? operation.remoteActiveSessionSummary?.id ?? null
            : operation.localActiveSessionSummary?.id ?? null
          : null;
        if (operation.caseId === "divergentActiveSessions" && rejectedActiveSessionId === null) throw new Error("corrupt_adoption_operation");
        next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "buildingCandidate" }>>(
          operation,
          {
            stage: "buildingCandidate", conflictCount: operation.conflictCount, caseId: operation.caseId,
            result: operation.result, localFingerprint: operation.localFingerprint, remoteFingerprint: operation.remoteFingerprint,
            planId: operation.planId, confirmation: operation.confirmation,
            confirmationFingerprint: operation.confirmationFingerprint, operationFingerprint,
            localAfterSequenceId: null, remoteAfterCursor: null, localProcessedCount: 0, remoteProcessedCount: 0,
            candidateRecordCount: 0,
            candidateDigestState: Sha256Accumulator.create().update(textBytes("{\"records\":[")).exportState(),
            rejectedActiveSessionId,
          }, expectedStepToken, commandNow,
        );
      } else {
        next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "hashingConfirmation" }>>(
          operation,
          { ...operation, stage: "hashingConfirmation", localAfterSequenceId: page.at(-1)!.sequenceId, operationDigestState: digest.exportState() },
          expectedStepToken, commandNow,
        );
      }
      transaction.writeAdoptionOperation(next);
      return next.lastAdvance!.receipt;
    });
  }

  private async advanceCandidate(
    uid: string,
    operation: Extract<ActiveAdoptionOperation, { stage: "buildingCandidate" }>,
    expectedStepToken: string,
    commandNow: number,
  ): Promise<AdoptionAdvanceReceipt> {
    const localLookahead = await this.store.readAdoptionLocalRecordPage(uid, operation.localAfterSequenceId, 2);
    const remoteLookahead = operation.remoteGeneration === null ? [] : await this.store.readRecordDescriptorPage(
      uid, operation.remoteGeneration, operation.remoteAfterCursor, 2,
    );
    if ((operation.localProcessedCount < operation.localRecordCount) !== (localLookahead.length > 0)
      || (operation.remoteProcessedCount < operation.remoteRecordCount) !== (remoteLookahead.length > 0)
      || localLookahead.length > operation.localRecordCount - operation.localProcessedCount
      || remoteLookahead.length > operation.remoteRecordCount - operation.remoteProcessedCount) {
      throw new Error("corrupt_adoption_source_count");
    }
    if (localLookahead.some((entry, offset) =>
      entry.sequenceId !== adoptionSequenceId(operation.localProcessedCount + offset))) {
      throw new Error("corrupt_adoption_source_count");
    }
    const localPage = localLookahead.slice(0, 1);
    const remotePage = remoteLookahead.slice(0, 1);
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      const localRecords = await Promise.all(localPage.map((entry) => transaction.readAdoptionLocalRecord(entry.sequenceId)));
      const remoteDocuments = operation.remoteGeneration === null ? [] : await Promise.all(
        remotePage.map((entry) => transaction.readRecord(operation.remoteGeneration!, entry.documentId)),
      );
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      if (localRecords.some((entry, index) => !sameLocalDocument(entry, localPage[index]!))) throw new Error("corrupt_adoption_local_record");
      if (remoteDocuments.some((entry, index) => !descriptorMatchesDocument(remotePage[index]!, entry))) throw new Error("corrupt_account_record_document");
      const remoteRecords = remoteDocuments.map((entry, index) => decodePersistedAccountRecordDocument(entry!, remotePage[index]!.documentId));
      const localDecoded = localPage.map((entry) => decodePersistedAccountRecordDocument(entry.record, entry.record.keyHash));
      const selectedSide = operation.confirmation.selectedActiveSessionSide;
      const skipRejected = (record: AccountRecord, side: "local" | "remote"): boolean => {
        if (operation.caseId !== "divergentActiveSessions" || side === selectedSide) return false;
        if (record.type === "activeSessionReference") return true;
        return record.type === "simulationDraft" && record.payload.sessionId === operation.rejectedActiveSessionId;
      };
      let localIndex = 0;
      let remoteIndex = 0;
      let consumed = 0;
      const output: AccountRecord[] = [];
      while (consumed < MAX_ADOPTION_PAGE_RECORDS && (localIndex < localDecoded.length || remoteIndex < remoteRecords.length)) {
        while (localIndex < localDecoded.length && skipRejected(localDecoded[localIndex]!, "local")) {
          localIndex += 1;
          consumed += 1;
          if (consumed === MAX_ADOPTION_PAGE_RECORDS) break;
        }
        while (consumed < MAX_ADOPTION_PAGE_RECORDS && remoteIndex < remoteRecords.length && skipRejected(remoteRecords[remoteIndex]!, "remote")) {
          remoteIndex += 1;
          consumed += 1;
        }
        if (consumed === MAX_ADOPTION_PAGE_RECORDS) break;
        const local = localDecoded[localIndex];
        const remote = remoteRecords[remoteIndex];
        if (!local && !remote) break;
        const comparison = local === undefined ? 1 : remote === undefined ? -1 : compareAccountRecordIdentity(local, remote);
        if (comparison < 0 && local) {
          output.push(local);
          localIndex += 1;
        } else if (comparison > 0 && remote) {
          output.push(remote);
          remoteIndex += 1;
        } else if (local && remote) {
          if (local.fingerprint !== remote.fingerprint) throw new Error("adoption_conflict");
          output.push(remote);
          localIndex += 1;
          remoteIndex += 1;
        }
        consumed += 1;
      }
      const candidateDocuments = output.map(createPersistedAccountRecordDocument);
      const existing = await Promise.all(candidateDocuments.map((entry) => transaction.readRecord(operation.operationFingerprint, entry.keyHash)));
      if (existing.some((entry, index) => entry !== undefined && !samePersistedRecord(entry, candidateDocuments[index]))) {
        throw new Error("candidate_record_collision");
      }
      const digest = Sha256Accumulator.restore(operation.candidateDigestState);
      for (let index = 0; index < candidateDocuments.length; index += 1) {
        if (operation.candidateRecordCount + index > 0) digest.update(textBytes(","));
        digest.update(candidateDocuments[index]!.canonicalBytes);
      }
      const candidateRecordCount = operation.candidateRecordCount + candidateDocuments.length;
      const localProcessedCount = operation.localProcessedCount + localIndex;
      const remoteProcessedCount = operation.remoteProcessedCount + remoteIndex;
      if (localProcessedCount > operation.localRecordCount || remoteProcessedCount > operation.remoteRecordCount) {
        throw new Error("corrupt_adoption_source_count");
      }
      if (localIndex + remoteIndex === 0 && (localProcessedCount < operation.localRecordCount
        || remoteProcessedCount < operation.remoteRecordCount)) throw new Error("corrupt_adoption_source_count");
      const localDone = localProcessedCount === operation.localRecordCount;
      const remoteDone = remoteProcessedCount === operation.remoteRecordCount;
      const localAfterSequenceId = localIndex === 0 ? operation.localAfterSequenceId : localPage[localIndex - 1]!.sequenceId;
      const remoteAfterCursor = remoteIndex === 0 ? operation.remoteAfterCursor : {
        type: remotePage[remoteIndex - 1]!.type,
        id: remotePage[remoteIndex - 1]!.id,
        documentId: remotePage[remoteIndex - 1]!.documentId,
      };
      let next: ActiveAdoptionOperation;
      if (localDone && remoteDone) {
        digest.update(textBytes("]}"));
        next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "checkingCandidate" }>>(
          operation,
          {
            stage: "checkingCandidate",
            conflictCount: operation.conflictCount,
            caseId: operation.caseId,
            result: operation.result,
            localFingerprint: operation.localFingerprint,
            remoteFingerprint: operation.remoteFingerprint,
            planId: operation.planId,
            confirmationFingerprint: operation.confirmationFingerprint,
            operationFingerprint: operation.operationFingerprint,
            candidateManifestFingerprint: digest.digestHex(),
            candidateRecordCount,
            candidateAfterDocumentId: null,
            candidateObservedDocumentCount: 0,
          },
          expectedStepToken,
          commandNow,
        );
      } else {
        next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "buildingCandidate" }>>(
          operation,
          {
            ...operation,
            stage: "buildingCandidate",
            localAfterSequenceId,
            remoteAfterCursor,
            localProcessedCount,
            remoteProcessedCount,
            candidateRecordCount,
            candidateDigestState: digest.exportState(),
          },
          expectedStepToken,
          commandNow,
        );
      }
      const writeEnvelopeBytes = candidateDocuments.reduce((total, entry) => total + estimatePersistedAccountRecordBytes(
        accountRecordDocumentPath(uid, operation.operationFingerprint, entry.keyHash),
        entry,
      ), Buffer.byteLength(JSON.stringify(next), "utf8") + Buffer.byteLength(JSON.stringify(head ?? {}), "utf8"));
      if (writeEnvelopeBytes > MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES) throw new Error("adoption_candidate_step_too_large");
      for (let index = 0; index < candidateDocuments.length; index += 1) {
        if (existing[index] === undefined) {
          const entry = candidateDocuments[index]!;
          transaction.putRecord(operation.operationFingerprint, entry.keyHash, entry);
        }
      }
      transaction.writeAdoptionOperation(next);
      return next.lastAdvance!.receipt;
    });
  }

  private async advanceCandidatePhysicalProof(
    uid: string,
    operation: Extract<ActiveAdoptionOperation, { stage: "checkingCandidate" }>,
    expectedStepToken: string,
    commandNow: number,
  ): Promise<AdoptionAdvanceReceipt> {
    const page = await this.store.readRecordPhysicalDescriptorPage(
      uid, operation.operationFingerprint, operation.candidateAfterDocumentId, MAX_ADOPTION_PAGE_RECORDS + 1,
    );
    const selected = selectProofDescriptors(page);
    const atEnd = page.length <= MAX_ADOPTION_PAGE_RECORDS && selected.length === page.length;
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      const documents = await Promise.all(selected.map((entry) => transaction.readRecord(operation.operationFingerprint, entry.documentId)));
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      for (let index = 0; index < selected.length; index += 1) {
        const descriptor = selected[index]!;
        const document = documents[index];
        if (document === undefined || document.canonicalByteLength !== descriptor.canonicalByteLength) {
          throw new Error("candidate_generation_mismatch");
        }
        try {
          decodePersistedAccountRecordDocument(document, descriptor.documentId);
        } catch {
          throw new Error("candidate_generation_mismatch");
        }
      }
      const candidateObservedDocumentCount = operation.candidateObservedDocumentCount + selected.length;
      if (candidateObservedDocumentCount > operation.candidateRecordCount) throw new Error("candidate_generation_mismatch");
      let next: ActiveAdoptionOperation;
      if (atEnd) {
        if (candidateObservedDocumentCount !== operation.candidateRecordCount) throw new Error("candidate_generation_mismatch");
        next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "hashingCandidateManifest" }>>(
          operation,
          {
            stage: "hashingCandidateManifest", conflictCount: operation.conflictCount, caseId: operation.caseId,
            result: operation.result, localFingerprint: operation.localFingerprint, remoteFingerprint: operation.remoteFingerprint,
            planId: operation.planId, confirmationFingerprint: operation.confirmationFingerprint,
            operationFingerprint: operation.operationFingerprint,
            candidateManifestFingerprint: operation.candidateManifestFingerprint,
            candidateRecordCount: operation.candidateRecordCount,
            candidateAfterCursor: null, candidateVerifiedRecordCount: 0,
            candidateVerificationDigestState: Sha256Accumulator.create().update(textBytes("{\"records\":[")).exportState(),
          }, expectedStepToken, commandNow,
        );
      } else {
        next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "checkingCandidate" }>>(
          operation,
          {
            ...operation, stage: "checkingCandidate",
            candidateAfterDocumentId: selected.at(-1)!.documentId,
            candidateObservedDocumentCount,
          }, expectedStepToken, commandNow,
        );
      }
      transaction.writeAdoptionOperation(next);
      return next.lastAdvance!.receipt;
    });
  }

  private async advanceCandidateManifestProof(
    uid: string,
    operation: Extract<ActiveAdoptionOperation, { stage: "hashingCandidateManifest" }>,
    expectedStepToken: string,
    commandNow: number,
  ): Promise<AdoptionAdvanceReceipt> {
    const page = await this.store.readRecordDescriptorPage(
      uid, operation.operationFingerprint, operation.candidateAfterCursor, MAX_ADOPTION_PAGE_RECORDS + 1,
    );
    const selected = selectProofDescriptors(page);
    const atEnd = page.length <= MAX_ADOPTION_PAGE_RECORDS && selected.length === page.length;
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      const documents = await Promise.all(selected.map((entry) => transaction.readRecord(operation.operationFingerprint, entry.documentId)));
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (!operationBindingMatchesHead(operation, head)) throw new Error("snapshot_changed");
      if (documents.some((entry, index) => !descriptorMatchesDocument(selected[index]!, entry))) {
        throw new Error("candidate_generation_mismatch");
      }
      const digest = Sha256Accumulator.restore(operation.candidateVerificationDigestState);
      for (let index = 0; index < documents.length; index += 1) {
        const descriptor = selected[index]!;
        const document = documents[index]!;
        try {
          decodePersistedAccountRecordDocument(document, descriptor.documentId);
        } catch {
          throw new Error("candidate_generation_mismatch");
        }
        if (operation.candidateVerifiedRecordCount + index > 0) digest.update(textBytes(","));
        digest.update(document.canonicalBytes);
      }
      const candidateVerifiedRecordCount = operation.candidateVerifiedRecordCount + selected.length;
      if (candidateVerifiedRecordCount > operation.candidateRecordCount) throw new Error("candidate_generation_mismatch");
      let next: ActiveAdoptionOperation;
      if (atEnd) {
        digest.update(textBytes("]}"));
        if (candidateVerifiedRecordCount !== operation.candidateRecordCount
          || digest.digestHex() !== operation.candidateManifestFingerprint) throw new Error("candidate_generation_mismatch");
        const committedAccountRevision = operation.remoteAccountRevision + 1;
        next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "activatedCleaning" }>>(
          operation,
          {
            stage: "activatedCleaning", caseId: operation.caseId, adoptionResult: operation.result,
            confirmationFingerprint: operation.confirmationFingerprint, operationFingerprint: operation.operationFingerprint,
            committedAccountRevision, previousGeneration: operation.remoteGeneration,
            cleanup: { phase: operation.remoteGeneration === null ? "localRecords" : "previousGenerationRecords", cursor: null },
          }, expectedStepToken, commandNow,
        );
        transaction.writeHead({
          accountRevision: committedAccountRevision,
          activeGeneration: operation.operationFingerprint,
          manifest: { fingerprint: operation.candidateManifestFingerprint, recordCount: operation.candidateRecordCount },
          operationFingerprints: appendOperationFingerprint(head?.operationFingerprints ?? [], operation.operationFingerprint),
        });
      } else {
        const last = selected.at(-1)!;
        next = nextAdvanceState<Extract<ActiveAdoptionOperation, { stage: "hashingCandidateManifest" }>>(
          operation,
          {
            ...operation, stage: "hashingCandidateManifest",
            candidateAfterCursor: { type: last.type, id: last.id, documentId: last.documentId },
            candidateVerifiedRecordCount,
            candidateVerificationDigestState: digest.exportState(),
          }, expectedStepToken, commandNow,
        );
      }
      transaction.writeAdoptionOperation(next);
      return next.lastAdvance!.receipt;
    });
  }

  private async advanceCleanup(
    uid: string,
    operation: Extract<ActiveAdoptionOperation, { stage: "activatedCleaning" | "discarding" }>,
    expectedStepToken: string,
    commandNow: number,
  ): Promise<AdoptionAdvanceReceipt | AdoptionTerminalReceipt> {
    const phaseOwner = (): "localRecords" | "conflicts" | Readonly<{ generationId: string }> | null => {
      if (operation.stage === "discarding") {
        if (operation.cleanup.phase === "localRecords" || operation.cleanup.phase === "conflicts") return operation.cleanup.phase;
        if (operation.cleanup.phase === "candidateRecords" && operation.candidateGeneration !== null) {
          return { generationId: operation.candidateGeneration };
        }
        return null;
      }
      if (operation.cleanup.phase === "localRecords" || operation.cleanup.phase === "conflicts") return operation.cleanup.phase;
      if (operation.cleanup.phase === "previousGenerationRecords" && operation.previousGeneration !== null) {
        return { generationId: operation.previousGeneration };
      }
      return null;
    };
    const owner = phaseOwner();
    if (operation.cleanup.phase !== "finalize") {
      const ids = owner === null ? [] : await this.store.readOwnedDocumentIdPage(
        uid, owner, operation.cleanup.cursor?.documentId ?? null, ACCOUNT_RECORD_PAGE_SIZE,
      );
      if (ids.length > 0) {
        return this.store.runTransaction(uid, async (transaction) => {
          const head = await transaction.readHead();
          const current = await transaction.readAdoptionOperation();
          const documents = owner === "localRecords"
            ? await Promise.all(ids.map((id) => transaction.readAdoptionLocalRecord(id)))
            : owner === "conflicts"
              ? await Promise.all(ids.map((id) => transaction.readAdoptionConflict(id)))
              : owner === null
                ? []
                : await Promise.all(ids.map((id) => transaction.readRecordExists(owner.generationId, id)));
          if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
          if (operation.stage === "activatedCleaning" && head?.activeGeneration !== operation.operationFingerprint) {
            throw new Error("active_generation_changed");
          }
          if (documents.some((entry) => entry === undefined || entry === false)) throw new Error("account_data_retryable");
          if (owner !== null && typeof owner === "object" && head?.activeGeneration === owner.generationId) throw new Error("active_generation_cleanup_forbidden");
          const next = nextAdvanceState(operation, {
            ...operation,
            stage: operation.stage,
            cleanup: { ...operation.cleanup, cursor: { documentId: ids.at(-1)! } },
          } as never, expectedStepToken, commandNow);
          if (owner === "localRecords") for (const id of ids) transaction.deleteAdoptionLocalRecord(id);
          else if (owner === "conflicts") for (const id of ids) transaction.deleteAdoptionConflict(id);
          else if (owner !== null) for (const id of ids) transaction.deleteRecord(owner.generationId, id);
          transaction.writeAdoptionOperation(next);
          return next.lastAdvance!.receipt;
        });
      }
      const nextPhase = operation.stage === "discarding"
        ? operation.cleanup.phase === "localRecords" ? "conflicts"
          : operation.cleanup.phase === "conflicts" ? (operation.candidateGeneration === null ? "finalize" : "candidateRecords")
            : "finalize"
        : operation.cleanup.phase === "previousGenerationRecords" ? "localRecords"
          : operation.cleanup.phase === "localRecords" ? "conflicts" : "finalize";
      return this.store.runTransaction(uid, async (transaction) => {
        const head = await transaction.readHead();
        const current = await transaction.readAdoptionOperation();
        if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
        if (operation.stage === "activatedCleaning" && head?.activeGeneration !== operation.operationFingerprint) {
          throw new Error("active_generation_changed");
        }
        if (owner !== null && typeof owner === "object" && head?.activeGeneration === owner.generationId) throw new Error("active_generation_cleanup_forbidden");
        const next = nextAdvanceState(operation, {
          ...operation,
          stage: operation.stage,
          cleanup: { phase: nextPhase, cursor: null },
        } as never, expectedStepToken, commandNow);
        transaction.writeAdoptionOperation(next);
        return next.lastAdvance!.receipt;
      });
    }

    const owners: Array<"localRecords" | "conflicts" | Readonly<{ generationId: string }>> = ["localRecords", "conflicts"];
    if (operation.stage === "discarding" && operation.candidateGeneration !== null) owners.push({ generationId: operation.candidateGeneration });
    if (operation.stage === "activatedCleaning" && operation.previousGeneration !== null) owners.unshift({ generationId: operation.previousGeneration });
    for (const probeOwner of owners) {
      if ((await this.store.readOwnedDocumentIdPage(uid, probeOwner, null, 1)).length > 0) throw new Error("account_data_retryable");
    }
    return this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      const current = await transaction.readAdoptionOperation();
      if (!sameOperation(current, operation)) throw new Error("adoption_step_changed");
      if (operation.stage === "activatedCleaning" && head?.activeGeneration !== operation.operationFingerprint) {
        throw new Error("active_generation_changed");
      }
      for (const ownerEntry of owners) {
        if (typeof ownerEntry === "object" && head?.activeGeneration === ownerEntry.generationId) throw new Error("active_generation_cleanup_forbidden");
      }
      let terminal: TerminalAdoptionOperation;
      if (operation.stage === "activatedCleaning") {
        terminal = {
          version: 1,
          stage: "completed",
          adoptionId: operation.adoptionId,
          confirmationFingerprint: operation.confirmationFingerprint,
          operationFingerprint: operation.operationFingerprint,
          committedAccountRevision: operation.committedAccountRevision,
          caseId: operation.caseId,
          adoptionResult: operation.adoptionResult,
          ...terminalAdvance(operation, "completed", expectedStepToken),
        };
      } else if (operation.reason === "cancelled") {
        terminal = {
          version: 1,
          stage: "cancelled",
          adoptionId: operation.adoptionId,
          result: "cancelled",
          ...terminalAdvance(operation, "cancelled", expectedStepToken),
        };
      } else {
        terminal = {
          version: 1,
          stage: "discarded",
          adoptionId: operation.adoptionId,
          result: "discarded",
          reason: operation.reason,
          ...terminalAdvance(operation, "discarded", expectedStepToken),
        };
      }
      transaction.writeAdoptionOperation(terminal);
      return terminalReceipt(terminal);
    });
  }

  async applySync(uid: string, input: Readonly<{
    expectedAccountRevision: number;
    mutations: readonly SyncMutation[];
    operationFingerprint: string;
  }>): Promise<RemoteAccountDataset> {
    const expectedFingerprint = computeSyncOperationFingerprint(input);
    requireMatchingOperationFingerprint(input.operationFingerprint, expectedFingerprint);
    const snapshot = await readStableSnapshot(this.store, uid);
    if (snapshot.remote.operationFingerprints.includes(input.operationFingerprint)) return snapshot.remote;
    if (snapshot.remote.accountRevision !== input.expectedAccountRevision) throw new Error("stale_account_revision");

    const generationId = snapshot.head?.activeGeneration ?? input.operationFingerprint;
    const existingRecords = new Map(snapshot.remote.dataset.records.map((record) => [recordKey(record.type, record.id), record]));
    const resultingRecords = applyMutations(existingRecords, input.mutations);
    const resultingDataset: AccountDataset = {
      records: [...resultingRecords.values()].sort(compareAccountRecordIdentity),
    };
    const existingDocuments = new Map(snapshot.documents.map((document) => {
      const record = decodePersistedAccountRecordDocument(document.value, document.documentId);
      return [recordKey(record.type, record.id), document] as const;
    }));
    preflightSyncEnvelope(uid, generationId, input.mutations, existingDocuments);

    await this.store.runTransaction(uid, async (transaction) => {
      const head = await transaction.readHead();
      if (head) validateAccountDatasetHead(head);
      if (!sameHeadExact(head, snapshot.head)) throw new Error("stale_account_revision");
      const transactionGeneration = head?.activeGeneration ?? generationId;
      let transactionBytes = 0;
      for (const mutation of input.mutations) {
        const identity = mutationIdentity(mutation);
        const key = recordKey(identity.type, identity.id);
        const keyHash = computeAccountRecordKeyHash(identity.type, identity.id);
        const expectedDocument = existingDocuments.get(key);
        const currentDocument = await transaction.readRecord(transactionGeneration, keyHash);
        if (!samePersistedRecord(currentDocument, expectedDocument?.value)) throw new Error("record_revision_conflict");
        switch (mutation.kind) {
          case "put": {
            const document = createPersistedAccountRecordDocument(mutation.record);
            transactionBytes += estimatePersistedAccountRecordBytes(
              accountRecordDocumentPath(uid, transactionGeneration, keyHash),
              document,
            );
            break;
          }
          case "delete":
            if (!currentDocument) throw new Error("record_revision_conflict");
            transactionBytes += estimatePersistedAccountRecordBytes(
              accountRecordDocumentPath(uid, transactionGeneration, keyHash),
              currentDocument,
            );
            break;
          default:
            invalidSyncMutation(mutation);
        }
      }
      if (transactionBytes > MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES) throw new Error("sync_operation_too_large");
      for (const mutation of input.mutations) {
        const identity = mutationIdentity(mutation);
        const keyHash = computeAccountRecordKeyHash(identity.type, identity.id);
        switch (mutation.kind) {
          case "put":
            transaction.putRecord(transactionGeneration, keyHash, createPersistedAccountRecordDocument(mutation.record));
            break;
          case "delete":
            transaction.deleteRecord(transactionGeneration, keyHash);
            break;
          default:
            invalidSyncMutation(mutation);
        }
      }
      transaction.writeHead({
        accountRevision: (head?.accountRevision ?? 0) + 1,
        activeGeneration: transactionGeneration,
        manifest: manifestFor(resultingDataset),
        operationFingerprints: appendOperationFingerprint(head?.operationFingerprints ?? [], input.operationFingerprint),
      });
    });
    const completed = await readStableSnapshot(this.store, uid);
    return completed.remote;
  }
}

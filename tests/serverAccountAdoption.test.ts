import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalAccountDatasetValue,
  compareAccountRecordUtf8Bytes,
  confirmAdoption,
  computeCanonicalSha256,
  decodeCanonicalAccountRecord,
  encodeCanonicalAccountRecord,
  fingerprintDataset,
  MAX_CANONICAL_ACCOUNT_RECORD_BYTES,
  computeRecordFingerprint,
  previewAdoption,
  type AccountDataset,
  type AccountRecord,
} from "../server/src/accountData.js";
import {
  ACCOUNT_RECORD_PAGE_SIZE,
  AccountDataService,
  accountRecordDocumentPath,
  computeAccountRecordKeyHash,
  computeAdoptionOperationFingerprint,
  computeSyncOperationFingerprint,
  createPersistedAccountRecordDocument,
  decodePersistedAccountRecordDocument,
  estimatePersistedAccountRecordBytes,
  MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES,
  MAX_SYNC_MUTATIONS,
  TRANSITION_LEASE_MS,
  validateAccountDatasetHead,
  validateAdoptionOperation,
  type AccountDatasetHead,
  type AccountDatasetStore,
  type AccountRecordDescriptor,
  type AccountRecordPhysicalDescriptor,
  type AccountRecordPageDocument,
  type AccountRecordSemanticCursor,
  type AdoptionConflictDocument,
  type AdoptionLocalRecordDocument,
  type AdoptionOperation,
  type PersistedAccountRecordDocument,
  type SyncOperationSemanticInput,
} from "../server/src/accountService.js";

const record = (
  type: AccountRecord["type"],
  id: string,
  fingerprint: string,
  revision?: number,
): AccountRecord => {
  const value = { id, payload: { nested: { value: fingerprint } }, ...(revision === undefined ? {} : { revision }), type };
  return { ...value, fingerprint: computeRecordFingerprint(value) };
};

const recordWithCanonicalSize = (id: string, canonicalSize: number, revision = 1): AccountRecord => {
  const baseValue = { id, payload: { data: "" }, revision, type: "reviewQueueEntry" as const };
  const base = { ...baseValue, fingerprint: computeRecordFingerprint(baseValue) };
  const baseSize = Buffer.byteLength(JSON.stringify({
    fingerprint: base.fingerprint,
    id: base.id,
    payload: base.payload,
    revision: base.revision,
    type: base.type,
  }), "utf8");
  const dataLength = canonicalSize - baseSize;
  if (dataLength < 0) throw new Error("requested_record_size_too_small");
  const value = { ...baseValue, payload: { data: "x".repeat(dataLength) } };
  return { ...value, fingerprint: computeRecordFingerprint(value) };
};
const dataset = (...records: readonly AccountRecord[]): AccountDataset => ({ records });
const empty = dataset();
const attempt = record("trainingAttempt", "attempt-1", "attempt-a");
const remoteAttempt = record("trainingAttempt", "attempt-2", "attempt-b");
const localActive = record("activeSessionReference", "local-session", "local-session", 1);
const remoteActive = record("activeSessionReference", "remote-session", "remote-session", 1);

const adoptionInput = (input: Parameters<typeof computeAdoptionOperationFingerprint>[0]) => ({
  ...input,
  operationFingerprint: computeAdoptionOperationFingerprint(input),
});

const syncInput = (input: SyncOperationSemanticInput) => ({
  ...input,
  operationFingerprint: computeSyncOperationFingerprint(input),
});

test("classifies all seven canonical adoption cases with their exact results", () => {
  const cases = [
    [empty, empty, "emptyLocalEmptyRemote", "createBoundEmptyDataset"],
    [dataset(attempt), empty, "populatedLocalEmptyRemote", "previewThenUploadExactLocalDataset"],
    [empty, dataset(remoteAttempt), "emptyLocalPopulatedRemote", "previewThenRestoreExactRemoteDataset"],
    [dataset(attempt), dataset(remoteAttempt), "populatedLocalPopulatedRemote", "previewThenReconcileByRecordPolicy"],
    [dataset(localActive), empty, "activeSessionOnOneSide", "preserveThatSessionAndRejectSecondActiveSession"],
    [dataset(localActive), dataset(remoteActive), "divergentActiveSessions", "requireExplicitSessionChoiceAndConfirmedAbandonmentOfOtherDraft"],
    [
      dataset(record("trainingAttempt", "same", "local")),
      dataset(record("trainingAttempt", "same", "remote")),
      "divergentRecord",
      "applyRecordPolicyOrBlockWithoutMutation",
    ],
  ] as const;

  for (const [local, remote, caseId, result] of cases) {
    const preview = previewAdoption(local, remote);
    assert.equal(preview.caseId, caseId);
    assert.equal(preview.result, result);
  }
});

test("requires preview confirmation and preserves both inputs on cancel, stale preview, conflict, or missing abandonment", () => {
  const local = dataset(localActive, attempt);
  const remote = dataset(remoteActive, remoteAttempt);
  const localBefore = structuredClone(local);
  const remoteBefore = structuredClone(remote);
  const plan = previewAdoption(local, remote);

  for (const confirmation of [
    { confirmed: false, planId: plan.planId },
    { confirmed: true, planId: "different-plan" },
    { confirmed: true, planId: plan.planId, selectedActiveSessionSide: "local" as const },
  ]) {
    assert.throws(() => confirmAdoption(local, remote, confirmation));
    assert.deepEqual(local, localBefore);
    assert.deepEqual(remote, remoteBefore);
  }
});

test("does not treat an unreferenced draft as an active session and rejects spoofed or shallow payload fingerprints", () => {
  const draftOnly = record("simulationDraft", "draft-1", "draft", 1);
  assert.equal(previewAdoption(dataset(draftOnly), empty).caseId, "populatedLocalEmptyRemote");

  const original = record("reviewQueueEntry", "review-1", "original", 1);
  const spoofed: AccountRecord = {
    ...original,
    payload: { nested: { value: "different-deep-payload" } },
  };
  assert.throws(() => previewAdoption(dataset(spoofed), empty), /record_fingerprint_mismatch/u);
});

test("deduplicates exact records and blocks every divergent same-key record without inventing ancestry", () => {
  const exact = record("reviewQueueEntry", "exact", "same", 2);
  const exactPreview = previewAdoption(dataset(exact), dataset(exact));
  assert.deepEqual(
    confirmAdoption(dataset(exact), dataset(exact), { confirmed: true, planId: exactPreview.planId }).records,
    [exact],
  );

  for (const [local, remote, code] of [
    [
      record("reviewQueueEntry", "review", "newer", 2),
      record("reviewQueueEntry", "review", "older", 1),
      "revision_conflict",
    ],
    [
      record("trainingAttempt", "same", "left"),
      record("trainingAttempt", "same", "right"),
      "immutable_integrity_conflict",
    ],
  ] as const) {
    const preview = previewAdoption(dataset(local), dataset(remote));
    assert.equal(preview.caseId, "divergentRecord");
    assert.equal(preview.conflicts[0]?.code, code);
    assert.throws(
      () => confirmAdoption(dataset(local), dataset(remote), { confirmed: true, planId: preview.planId }),
      /adoption_conflict/u,
    );
  }

  const immutableLocal = record("trainingAttempt", "local", "a");
  const immutableRemote = record("trainingAttempt", "remote", "b");
  const unionPreview = previewAdoption(dataset(immutableLocal), dataset(immutableRemote));
  assert.deepEqual(
    confirmAdoption(dataset(immutableLocal), dataset(immutableRemote), {
      confirmed: true,
      planId: unionPreview.planId,
    }).records,
    [immutableLocal, immutableRemote],
  );
});

test("blocks unrelated revisioned or immutable conflicts when only one side has an active session", () => {
  for (const [localConflict, remoteConflict, code] of [
    [
      record("reviewQueueEntry", "mixed-review", "local", 2),
      record("reviewQueueEntry", "mixed-review", "remote", 1),
      "revision_conflict",
    ],
    [
      record("trainingAttempt", "mixed-attempt", "local"),
      record("trainingAttempt", "mixed-attempt", "remote"),
      "immutable_integrity_conflict",
    ],
  ] as const) {
    const local = dataset(localActive, localConflict);
    const remote = dataset(remoteConflict);
    const localBefore = structuredClone(local);
    const remoteBefore = structuredClone(remote);
    const preview = previewAdoption(local, remote);
    assert.equal(preview.caseId, "activeSessionOnOneSide");
    assert.equal(preview.conflicts[0]?.code, code);
    assert.throws(
      () => confirmAdoption(local, remote, { confirmed: true, planId: preview.planId }),
      /adoption_conflict/u,
    );
    assert.deepEqual(local, localBefore);
    assert.deepEqual(remote, remoteBefore);
  }
});

test("preserves explicit selection for two divergent active-session references", () => {
  const local = dataset(record("activeSessionReference", "shared-session", "local", 1));
  const remote = dataset(record("activeSessionReference", "shared-session", "remote", 1));
  const preview = previewAdoption(local, remote);
  assert.equal(preview.caseId, "divergentActiveSessions");
  assert.deepEqual(
    confirmAdoption(local, remote, {
      abandonOtherActiveSessionConfirmed: true,
      confirmed: true,
      planId: preview.planId,
      selectedActiveSessionSide: "local",
    }),
    local,
  );
});

test("rejects duplicate dataset keys and more than one active-session reference on either side", () => {
  const duplicate = record("reviewQueueEntry", "duplicate", "same", 1);
  const secondActive = record("activeSessionReference", "second-session", "second-session", 1);

  for (const [local, remote, error] of [
    [dataset(duplicate, duplicate), empty, /duplicate_account_record_key/u],
    [empty, dataset(duplicate, duplicate), /duplicate_account_record_key/u],
    [dataset(localActive, secondActive), empty, /multiple_active_session_references/u],
    [empty, dataset(remoteActive, secondActive), /multiple_active_session_references/u],
  ] as const) {
    assert.throws(() => previewAdoption(local, remote), error);
  }
});

class MemoryStore implements AccountDatasetStore {
  readonly heads = new Map<string, AccountDatasetHead>();
  readonly records = new Map<string, Map<string, Map<string, PersistedAccountRecordDocument>>>();
  readonly adoptionOperations = new Map<string, AdoptionOperation>();
  readonly adoptionLocalRecords = new Map<string, Map<string, AdoptionLocalRecordDocument>>();
  readonly adoptionConflicts = new Map<string, Map<string, AdoptionConflictDocument>>();
  transactions = 0;
  transactionCommits = 0;
  headWrites = 0;
  headReads = 0;
  recordDeletes = 0;
  recordPuts = 0;
  readonly committedDeleteBatchSizes: number[] = [];
  readonly pageReadLimits: number[] = [];
  readonly physicalDescriptorReadLimits: number[] = [];
  readonly semanticDescriptorReadLimits: number[] = [];
  readonly putObservedRecordIds: string[] = [];
  readonly semanticHiddenDocumentIds = new Set<string>();
  afterCommit?: (head: AccountDatasetHead | undefined, deleted: number, put: number) => void;
  beforeTransaction?: () => void;
  nextTransactionFault?: "beforeCommit" | "afterCommit";

  private recordsFor(uid: string, generationId: string): Map<string, PersistedAccountRecordDocument> {
    let generations = this.records.get(uid);
    if (!generations) {
      generations = new Map();
      this.records.set(uid, generations);
    }
    let records = generations.get(generationId);
    if (!records) {
      records = new Map();
      generations.set(generationId, records);
    }
    return records;
  }

  seed(uid: string, remote: Readonly<{
    accountRevision: number;
    dataset: AccountDataset;
    operationFingerprints?: readonly string[];
  }>, generationId = "f".repeat(64)): void {
    this.seedGeneration(uid, generationId, remote.dataset);
    this.heads.set(uid, {
      accountRevision: remote.accountRevision,
      activeGeneration: generationId,
      manifest: {
        fingerprint: fingerprintDataset(remote.dataset),
        recordCount: remote.dataset.records.length,
      },
      operationFingerprints: remote.operationFingerprints ?? [],
    });
  }

  seedGeneration(uid: string, generationId: string, value: AccountDataset): void {
    const documents = this.recordsFor(uid, generationId);
    for (const entry of value.records) {
      const document = createPersistedAccountRecordDocument(entry);
      documents.set(document.keyHash, structuredClone(document));
    }
  }

  async readHead(uid: string): Promise<AccountDatasetHead | undefined> {
    this.headReads += 1;
    const value = this.heads.get(uid);
    return value === undefined ? undefined : structuredClone(value);
  }

  async readAdoptionOperation(uid: string): Promise<AdoptionOperation | undefined> {
    const value = this.adoptionOperations.get(uid);
    return value === undefined ? undefined : structuredClone(value);
  }

  async readAdoptionLocalRecordPage(uid: string, after: string | null, limit: number): Promise<readonly AdoptionLocalRecordDocument[]> {
    return [...(this.adoptionLocalRecords.get(uid)?.values() ?? [])]
      .filter((entry) => after === null || entry.sequenceId > after)
      .sort((left, right) => left.sequenceId.localeCompare(right.sequenceId))
      .slice(0, limit).map((entry) => structuredClone(entry));
  }

  async readAdoptionConflictPage(uid: string, after: string | null, limit: number): Promise<readonly AdoptionConflictDocument[]> {
    return [...(this.adoptionConflicts.get(uid)?.values() ?? [])]
      .filter((entry) => after === null || entry.sequenceId > after)
      .sort((left, right) => left.sequenceId.localeCompare(right.sequenceId))
      .slice(0, limit).map((entry) => structuredClone(entry));
  }

  async readRecordDescriptorPage(
    uid: string,
    generationId: string,
    after: AccountRecordSemanticCursor | null,
    limit: number,
  ): Promise<readonly AccountRecordDescriptor[]> {
    this.semanticDescriptorReadLimits.push(limit);
    const compare = (left: AccountRecordSemanticCursor, right: AccountRecordSemanticCursor) =>
      compareAccountRecordUtf8Bytes(left.type, right.type)
      || compareAccountRecordUtf8Bytes(left.id, right.id)
      || left.documentId.localeCompare(right.documentId);
    return [...(this.records.get(uid)?.get(generationId)?.entries() ?? [])]
      .map(([documentId, value]) => ({
        canonicalByteLength: value.canonicalByteLength,
        documentId,
        fingerprint: value.fingerprint,
        id: value.id,
        ...(value.revision === undefined ? {} : { revision: value.revision }),
        type: value.type,
      }))
      .filter((entry) => !this.semanticHiddenDocumentIds.has(entry.documentId))
      .filter((entry) => after === null || compare(entry, after) > 0)
      .sort(compare)
      .slice(0, limit)
      .map((entry) => structuredClone(entry));
  }

  async readRecordPhysicalDescriptorPage(
    uid: string,
    generationId: string,
    after: string | null,
    limit: number,
  ): Promise<readonly AccountRecordPhysicalDescriptor[]> {
    this.physicalDescriptorReadLimits.push(limit);
    return [...(this.records.get(uid)?.get(generationId)?.entries() ?? [])]
      .filter(([documentId]) => after === null || documentId > after)
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(0, limit)
      .map(([documentId, value]) => ({ canonicalByteLength: value.canonicalByteLength, documentId }));
  }

  async readOwnedDocumentIdPage(
    uid: string,
    owner: "localRecords" | "conflicts" | Readonly<{ generationId: string }>,
    after: string | null,
    limit: number,
  ): Promise<readonly string[]> {
    const ids = owner === "localRecords" ? [...(this.adoptionLocalRecords.get(uid)?.keys() ?? [])]
      : owner === "conflicts" ? [...(this.adoptionConflicts.get(uid)?.keys() ?? [])]
        : [...(this.records.get(uid)?.get(owner.generationId)?.keys() ?? [])];
    return ids.filter((id) => after === null || id > after).sort().slice(0, limit);
  }

  async readRecordPage(
    uid: string,
    generationId: string,
    afterDocumentId: string | undefined,
    limit: number,
  ): Promise<readonly AccountRecordPageDocument[]> {
    this.pageReadLimits.push(limit);
    return [...(this.records.get(uid)?.get(generationId)?.entries() ?? [])]
      .sort(([left], [right]) => left.localeCompare(right))
      .filter(([documentId]) => afterDocumentId === undefined || documentId > afterDocumentId)
      .slice(0, limit)
      .map(([documentId, value]) => ({ documentId, value: structuredClone(value) }));
  }

  async runTransaction<T>(uid: string, operation: (transaction: import("../server/src/accountService.js").AccountDatasetTransaction) => Promise<T>): Promise<T> {
    this.transactions += 1;
    const beforeTransaction = this.beforeTransaction;
    this.beforeTransaction = undefined;
    beforeTransaction?.();
    let head = structuredClone(this.heads.get(uid));
    let adoptionOperation = structuredClone(this.adoptionOperations.get(uid));
    const localRecords = new Map([...this.adoptionLocalRecords.get(uid)?.entries() ?? []].map(([id, value]) => [id, structuredClone(value)]));
    const conflicts = new Map([...this.adoptionConflicts.get(uid)?.entries() ?? []].map(([id, value]) => [id, structuredClone(value)]));
    const generations = new Map<string, Map<string, PersistedAccountRecordDocument>>(
      [...(this.records.get(uid)?.entries() ?? [])].map(([generationId, values]) => [
        generationId,
        new Map([...values.entries()].map(([documentId, value]) => [documentId, structuredClone(value)])),
      ]),
    );
    const generation = (generationId: string) => {
      let values = generations.get(generationId);
      if (!values) {
        values = new Map();
        generations.set(generationId, values);
      }
      return values;
    };
    let mutated = false;
    let deleted = 0;
    let put = 0;
    let wroteHead = 0;
    const result = await operation({
      deleteAdoptionConflict: (sequenceId) => { conflicts.delete(sequenceId); mutated = true; deleted += 1; },
      deleteAdoptionLocalRecord: (sequenceId) => { localRecords.delete(sequenceId); mutated = true; deleted += 1; },
      deleteRecord: (generationId, documentId) => {
        generation(generationId).delete(documentId);
        mutated = true;
        deleted += 1;
      },
      putAdoptionConflict: (value) => { conflicts.set(value.sequenceId, structuredClone(value)); mutated = true; put += 1; },
      putAdoptionLocalRecord: (value) => { localRecords.set(value.sequenceId, structuredClone(value)); mutated = true; put += 1; },
      putRecord: (generationId, documentId, value) => {
        this.putObservedRecordIds.push(value.id);
        generation(generationId).set(documentId, structuredClone(value));
        mutated = true;
        put += 1;
      },
      readAdoptionConflict: async (sequenceId) => structuredClone(conflicts.get(sequenceId)),
      readAdoptionLocalRecord: async (sequenceId) => structuredClone(localRecords.get(sequenceId)),
      readAdoptionOperation: async () => structuredClone(adoptionOperation),
      readHead: async () => {
        this.headReads += 1;
        return head === undefined ? undefined : structuredClone(head);
      },
      readRecord: async (generationId, documentId) => {
        const value = generation(generationId).get(documentId);
        return value === undefined ? undefined : structuredClone(value);
      },
      readRecordExists: async (generationId, documentId) => generation(generationId).has(documentId),
      writeAdoptionOperation: (value) => { adoptionOperation = structuredClone(value); mutated = true; },
      writeHead: (value) => {
        head = structuredClone(value);
        mutated = true;
        wroteHead += 1;
      },
    });
    if (mutated) {
      if (this.nextTransactionFault === "beforeCommit") {
        this.nextTransactionFault = undefined;
        throw new Error("simulated_crash_before_commit");
      }
      if (head !== undefined) this.heads.set(uid, head);
      this.records.set(uid, generations);
      if (adoptionOperation !== undefined) this.adoptionOperations.set(uid, adoptionOperation);
      this.adoptionLocalRecords.set(uid, localRecords);
      this.adoptionConflicts.set(uid, conflicts);
      this.transactionCommits += 1;
      this.recordDeletes += deleted;
      this.recordPuts += put;
      this.headWrites += wroteHead;
      if (deleted > 0) this.committedDeleteBatchSizes.push(deleted);
      this.afterCommit?.(head, deleted, put);
      if (this.nextTransactionFault === "afterCommit") {
        this.nextTransactionFault = undefined;
        throw new Error("simulated_crash_after_commit");
      }
    }
    return result;
  }
}

class RetryingMemoryStore extends MemoryStore {
  override async runTransaction<T>(
    uid: string,
    operation: (transaction: import("../server/src/accountService.js").AccountDatasetTransaction) => Promise<T>,
  ): Promise<T> {
    const cloneGenerationMap = () => new Map(
      [...(this.records.get(uid)?.entries() ?? [])].map(([generationId, values]) => [
        generationId,
        new Map([...values.entries()].map(([id, value]) => [id, structuredClone(value)])),
      ]),
    );
    const snapshot = {
      head: structuredClone(this.heads.get(uid)),
      operation: structuredClone(this.adoptionOperations.get(uid)),
      local: new Map([...this.adoptionLocalRecords.get(uid)?.entries() ?? []].map(([id, value]) => [id, structuredClone(value)])),
      conflicts: new Map([...this.adoptionConflicts.get(uid)?.entries() ?? []].map(([id, value]) => [id, structuredClone(value)])),
      generations: cloneGenerationMap(),
      transactionCommits: this.transactionCommits,
      headWrites: this.headWrites,
      recordDeletes: this.recordDeletes,
      recordPuts: this.recordPuts,
      deleteBatchCount: this.committedDeleteBatchSizes.length,
      observedPutCount: this.putObservedRecordIds.length,
    };
    await super.runTransaction(uid, operation);
    if (snapshot.head === undefined) this.heads.delete(uid); else this.heads.set(uid, snapshot.head);
    if (snapshot.operation === undefined) this.adoptionOperations.delete(uid); else this.adoptionOperations.set(uid, snapshot.operation);
    this.adoptionLocalRecords.set(uid, snapshot.local);
    this.adoptionConflicts.set(uid, snapshot.conflicts);
    this.records.set(uid, snapshot.generations);
    this.transactionCommits = snapshot.transactionCommits;
    this.headWrites = snapshot.headWrites;
    this.recordDeletes = snapshot.recordDeletes;
    this.recordPuts = snapshot.recordPuts;
    this.committedDeleteBatchSizes.length = snapshot.deleteBatchCount;
    this.putObservedRecordIds.length = snapshot.observedPutCount;
    return super.runTransaction(uid, operation);
  }
}

type AdoptionCrashTarget =
  | "start" | "upload" | "prepareAdvance" | "planHashAdvance" | "confirm"
  | "confirmationHashAdvance" | "candidateWrite" | "physicalProof" | "activationCas" | "cleanupDelete" | "terminal";

const adoptionStoreSnapshot = (store: MemoryStore, uid: string): unknown => {
  const sortedEntries = <T>(entries: Iterable<readonly [string, T]>) => [...entries]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, value] as const);
  return {
    adoptionConflicts: sortedEntries(store.adoptionConflicts.get(uid)?.entries() ?? []),
    adoptionLocalRecords: sortedEntries(store.adoptionLocalRecords.get(uid)?.entries() ?? []),
    adoptionOperation: store.adoptionOperations.get(uid),
    head: store.heads.get(uid),
    records: sortedEntries([...(store.records.get(uid)?.entries() ?? [])].map(([generationId, values]) => [
      generationId,
      sortedEntries(values.entries()),
    ] as const)),
  };
};

const prepareAdoptionCrashTarget = async (target: AdoptionCrashTarget): Promise<Readonly<{
  adoptionId: string;
  command: () => Promise<unknown>;
  service: AccountDataService;
  store: MemoryStore;
  uid: string;
}>> => {
  const uid = `uid-crash-${target}`;
  const local = dataset(
    record("reviewQueueEntry", "crash-a", "a", 1),
    record("reviewQueueEntry", "crash-b", "b", 1),
  );
  const store = new MemoryStore();
  const service = new AccountDataService(store, () => Date.parse("2026-08-02T12:00:00.000Z"));
  const localDatasetFingerprint = fingerprintDataset(local);
  const startInput = {
    adoptionId: computeCanonicalSha256({
      expectedAccountRevision: 0,
      expectedDatasetFingerprint: fingerprintDataset(empty),
      kind: "accountAdoption",
      localDatasetFingerprint,
      localRecordCount: local.records.length,
    }),
    expectedAccountRevision: 0,
    expectedDatasetFingerprint: fingerprintDataset(empty),
    localDatasetFingerprint,
    localRecordCount: local.records.length,
    restartCancelled: false,
    restartDiscarded: false,
  };
  const adoptionId = startInput.adoptionId;
  if (target === "start") return { adoptionId, command: () => service.startAdoption(uid, startInput), service, store, uid };
  await service.startAdoption(uid, startInput);
  const records = (canonicalAccountDatasetValue(local) as { records: AccountRecord[] }).records;
  const pageFingerprint = computeCanonicalSha256({ adoptionId, kind: "adoptionUploadPage", records, startRecordIndex: 0 });
  const upload = () => service.uploadAdoptionPage(uid, { adoptionId, pageFingerprint, records, startRecordIndex: 0 });
  if (target === "upload") return { adoptionId, command: upload, service, store, uid };
  await upload();

  const advanceCurrent = () => {
    const operation = store.adoptionOperations.get(uid)!;
    return service.advanceAdoption(uid, { adoptionId, expectedStepToken: operation.stepToken });
  };
  const fixedAdvance = () => {
    const expectedStepToken = store.adoptionOperations.get(uid)!.stepToken;
    return () => service.advanceAdoption(uid, { adoptionId, expectedStepToken });
  };
  if (target === "prepareAdvance") return { adoptionId, command: fixedAdvance(), service, store, uid };
  while (store.adoptionOperations.get(uid)!.stage !== "hashingPlan") await advanceCurrent();
  if (target === "planHashAdvance") return { adoptionId, command: fixedAdvance(), service, store, uid };
  while (store.adoptionOperations.get(uid)!.stage !== "previewReady") await advanceCurrent();
  const plan = previewAdoption(local, empty);
  const confirmation = { confirmed: true, planId: plan.planId };
  const confirm = () => service.confirmAdoptionOperation(uid, { adoptionId, confirmation });
  if (target === "confirm") return { adoptionId, command: confirm, service, store, uid };
  await confirm();
  if (target === "confirmationHashAdvance") return { adoptionId, command: fixedAdvance(), service, store, uid };
  while (store.adoptionOperations.get(uid)!.stage !== "buildingCandidate") await advanceCurrent();
  if (target === "candidateWrite") return { adoptionId, command: fixedAdvance(), service, store, uid };
  while (store.adoptionOperations.get(uid)!.stage === "buildingCandidate") await advanceCurrent();
  if (target === "physicalProof") return { adoptionId, command: fixedAdvance(), service, store, uid };
  while (store.adoptionOperations.get(uid)!.stage === "checkingCandidate") await advanceCurrent();
  if (target === "activationCas") return { adoptionId, command: fixedAdvance(), service, store, uid };
  while (store.adoptionOperations.get(uid)!.stage !== "activatedCleaning") await advanceCurrent();
  const cleaning = store.adoptionOperations.get(uid)!;
  if (cleaning.stage !== "activatedCleaning" || cleaning.cleanup.phase !== "localRecords") throw new Error("unexpected_cleanup_state");
  if (target === "cleanupDelete") return { adoptionId, command: fixedAdvance(), service, store, uid };
  while (true) {
    const operation = store.adoptionOperations.get(uid)!;
    if (operation.stage === "activatedCleaning" && operation.cleanup.phase === "finalize") break;
    await advanceCurrent();
  }
  return { adoptionId, command: fixedAdvance(), service, store, uid };
};

test("converges after crashes before and after every adoption transaction category", async () => {
  const targets: readonly AdoptionCrashTarget[] = [
    "start", "upload", "prepareAdvance", "planHashAdvance", "confirm",
    "confirmationHashAdvance", "candidateWrite", "physicalProof", "activationCas", "cleanupDelete", "terminal",
  ];
  for (const target of targets) {
    const reference = await prepareAdoptionCrashTarget(target);
    await reference.command();
    const expected = adoptionStoreSnapshot(reference.store, reference.uid);
    for (const fault of ["beforeCommit", "afterCommit"] as const) {
      const scenario = await prepareAdoptionCrashTarget(target);
      const before = adoptionStoreSnapshot(scenario.store, scenario.uid);
      scenario.store.nextTransactionFault = fault;
      await assert.rejects(scenario.command(), new RegExp(`simulated_crash_${fault === "beforeCommit" ? "before" : "after"}_commit`, "u"), `${target}/${fault}`);
      if (fault === "beforeCommit") assert.deepEqual(adoptionStoreSnapshot(scenario.store, scenario.uid), before, `${target} changed before commit`);
      else assert.deepEqual(adoptionStoreSnapshot(scenario.store, scenario.uid), expected, `${target} lost an after-commit write`);
      await scenario.command();
      assert.deepEqual(adoptionStoreSnapshot(scenario.store, scenario.uid), expected, `${target}/${fault} did not converge on replay`);
    }
  }
});

test("replays matching terminal adoption before any head read and keeps stale restart terminal authoritative", async () => {
  const completed = await prepareAdoptionCrashTarget("terminal");
  await completed.command();
  const local = dataset(
    record("reviewQueueEntry", "crash-a", "a", 1),
    record("reviewQueueEntry", "crash-b", "b", 1),
  );
  const startInput = {
    adoptionId: completed.adoptionId,
    expectedAccountRevision: 0,
    expectedDatasetFingerprint: fingerprintDataset(empty),
    localDatasetFingerprint: fingerprintDataset(local),
    localRecordCount: 2,
    restartCancelled: false,
    restartDiscarded: false,
  };
  completed.store.heads.set(completed.uid, {
    accountRevision: 99,
    activeGeneration: "e".repeat(64),
    manifest: { fingerprint: fingerprintDataset(empty), recordCount: 0 },
    operationFingerprints: [],
  });
  const readsBefore = completed.store.headReads;
  const replay = await completed.service.startAdoption(completed.uid, startInput);
  assert.equal(replay.result, "completed");
  assert.equal(completed.store.headReads, readsBefore);

  const cancelled = await prepareAdoptionCrashTarget("upload");
  await cancelled.service.cancelAdoption(cancelled.uid, { adoptionId: cancelled.adoptionId });
  while (cancelled.store.adoptionOperations.get(cancelled.uid)!.stage !== "cancelled") {
    const current = cancelled.store.adoptionOperations.get(cancelled.uid)!;
    await cancelled.service.advanceAdoption(cancelled.uid, { adoptionId: cancelled.adoptionId, expectedStepToken: current.stepToken });
  }
  const terminalBefore = structuredClone(cancelled.store.adoptionOperations.get(cancelled.uid)!);
  cancelled.store.heads.set(cancelled.uid, {
    accountRevision: 1,
    activeGeneration: "d".repeat(64),
    manifest: { fingerprint: fingerprintDataset(empty), recordCount: 0 },
    operationFingerprints: [],
  });
  await assert.rejects(
    cancelled.service.startAdoption(cancelled.uid, { ...startInput, adoptionId: cancelled.adoptionId, restartCancelled: true }),
    /snapshot_changed/u,
  );
  assert.deepEqual(cancelled.store.adoptionOperations.get(cancelled.uid), terminalBefore);

  const freshStore = new MemoryStore();
  const freshService = new AccountDataService(freshStore);
  const freshFingerprint = fingerprintDataset(empty);
  const freshAdoptionId = computeCanonicalSha256({
    expectedAccountRevision: 0, expectedDatasetFingerprint: freshFingerprint, kind: "accountAdoption",
    localDatasetFingerprint: freshFingerprint, localRecordCount: 0,
  });
  await freshService.startAdoption("uid-fresh-cas", {
    adoptionId: freshAdoptionId, expectedAccountRevision: 0, expectedDatasetFingerprint: freshFingerprint,
    localDatasetFingerprint: freshFingerprint, localRecordCount: 0, restartCancelled: false, restartDiscarded: false,
  });
  assert.equal(freshStore.transactions, 1);
  assert.equal(freshStore.headReads, 1);

  const replacementStore = new MemoryStore();
  replacementStore.adoptionOperations.set("uid-replacement-race", terminalBefore);
  const competing = structuredClone(completed.store.adoptionOperations.get(completed.uid)!);
  replacementStore.beforeTransaction = () => replacementStore.adoptionOperations.set("uid-replacement-race", competing);
  const replacementService = new AccountDataService(replacementStore);
  await assert.rejects(replacementService.startAdoption("uid-replacement-race", {
    adoptionId: freshAdoptionId, expectedAccountRevision: 0, expectedDatasetFingerprint: freshFingerprint,
    localDatasetFingerprint: freshFingerprint, localRecordCount: 0, restartCancelled: false, restartDiscarded: false,
  }), /adoption_in_progress/u);
  assert.deepEqual(replacementStore.adoptionOperations.get("uid-replacement-race"), competing);
  assert.equal(replacementStore.transactions, 1);
  assert.equal(replacementStore.headReads, 1);
});

test("retries every adoption transaction with one command clock read and deterministic discarded first writes", async () => {
  const uid = "uid-callback-retry";
  const store = new RetryingMemoryStore();
  let clockReads = 0;
  const service = new AccountDataService(store, () => {
    clockReads += 1;
    if (clockReads > 1) throw new Error("clock_read_inside_transaction_callback");
    return Date.parse("2026-08-02T12:00:00.000Z");
  });
  const runCommand = async <T>(command: () => Promise<T>): Promise<T> => {
    clockReads = 0;
    const result = await command();
    assert.equal(clockReads, 1);
    return result;
  };
  const expectedDatasetFingerprint = fingerprintDataset(empty);
  const adoptionId = computeCanonicalSha256({
    expectedAccountRevision: 0, expectedDatasetFingerprint, kind: "accountAdoption",
    localDatasetFingerprint: expectedDatasetFingerprint, localRecordCount: 0,
  });
  await runCommand(() => service.startAdoption(uid, {
    adoptionId, expectedAccountRevision: 0, expectedDatasetFingerprint,
    localDatasetFingerprint: expectedDatasetFingerprint, localRecordCount: 0,
    restartCancelled: false, restartDiscarded: false,
  }));
  let operation = store.adoptionOperations.get(uid)!;
  while (operation.stage !== "previewReady") {
    await runCommand(() => service.advanceAdoption(uid, { adoptionId, expectedStepToken: operation.stepToken }));
    operation = store.adoptionOperations.get(uid)!;
  }
  const preview = previewAdoption(empty, empty);
  await runCommand(() => service.readAdoptionPreviewPage(uid, { adoptionId, afterSequenceId: null }));
  await runCommand(() => service.confirmAdoptionOperation(uid, {
    adoptionId, confirmation: { confirmed: true, planId: preview.planId },
  }));
  operation = store.adoptionOperations.get(uid)!;
  while (operation.stage !== "completed") {
    await runCommand(() => service.advanceAdoption(uid, { adoptionId, expectedStepToken: operation.stepToken }));
    operation = store.adoptionOperations.get(uid)!;
  }
  assert.equal(store.headWrites, 1);
});

test("validates every persisted adoption stage as one closed exact union", async () => {
  const operations: AdoptionOperation[] = [];
  for (const target of [
    "upload", "prepareAdvance", "planHashAdvance", "confirm", "confirmationHashAdvance",
    "candidateWrite", "physicalProof", "activationCas", "cleanupDelete",
  ] as const) {
    const scenario = await prepareAdoptionCrashTarget(target);
    operations.push(structuredClone(scenario.store.adoptionOperations.get(scenario.uid)!));
  }
  const terminal = await prepareAdoptionCrashTarget("terminal");
  await terminal.command();
  operations.push(structuredClone(terminal.store.adoptionOperations.get(terminal.uid)!));

  const cancelled = await prepareAdoptionCrashTarget("upload");
  await cancelled.service.cancelAdoption(cancelled.uid, { adoptionId: cancelled.adoptionId });
  operations.push(structuredClone(cancelled.store.adoptionOperations.get(cancelled.uid)!));
  while (cancelled.store.adoptionOperations.get(cancelled.uid)!.stage !== "cancelled") {
    const operation = cancelled.store.adoptionOperations.get(cancelled.uid)!;
    await cancelled.service.advanceAdoption(cancelled.uid, {
      adoptionId: cancelled.adoptionId,
      expectedStepToken: operation.stepToken,
    });
  }
  operations.push(structuredClone(cancelled.store.adoptionOperations.get(cancelled.uid)!));

  for (const operation of operations) {
    assert.doesNotThrow(() => validateAdoptionOperation(operation), operation.stage);
    assert.throws(() => validateAdoptionOperation({ ...operation, unknownField: true }), /corrupt_adoption_operation/u, `${operation.stage}/extra`);
    const missing = { ...operation } as Record<string, unknown>;
    delete missing.stepToken;
    assert.throws(() => validateAdoptionOperation(missing), /corrupt_adoption_operation/u, `${operation.stage}/missing`);
    assert.throws(() => validateAdoptionOperation({ ...operation, stepToken: "0".repeat(64) }), /corrupt_adoption_operation/u, `${operation.stage}/token`);
    if (operation.stage === "completed" || operation.stage === "cancelled" || operation.stage === "discarded") {
      assert.throws(() => validateAdoptionOperation({
        ...operation,
        lastAdvance: { ...operation.lastAdvance, expectedStepToken: "1".repeat(64) },
      }), /corrupt_adoption_operation/u, `${operation.stage}/predecessor`);
      assert.throws(() => validateAdoptionOperation({ ...operation, stepNumber: 0 }), /corrupt_adoption_operation/u, `${operation.stage}/step-zero`);
    }
    if (operation.stage === "checkingCandidate") {
      assert.throws(() => validateAdoptionOperation({
        ...operation, candidateAfterDocumentId: null, candidateObservedDocumentCount: 1,
      }), /corrupt_adoption_operation/u, "checkingCandidate/count-without-cursor");
    }
    if (operation.stage === "hashingCandidateManifest") {
      assert.throws(() => validateAdoptionOperation({
        ...operation, candidateAfterCursor: null, candidateVerifiedRecordCount: 1,
      }), /corrupt_adoption_operation/u, "hashingCandidateManifest/count-without-cursor");
    }
  }
});

test("requires physical and semantic candidate proof and cleans every rejected candidate without decoding it", async () => {
  const cases = ["extra", "unindexed", "missing", "wrongKey", "wrongLength", "wrongBytes", "wrongDigest"] as const;
  for (const kind of cases) {
    const scenario = await prepareAdoptionCrashTarget("physicalProof");
    const operation = scenario.store.adoptionOperations.get(scenario.uid)!;
    assert.equal(operation.stage, "checkingCandidate");
    if (operation.stage !== "checkingCandidate") throw new Error("unexpected_candidate_stage");
    const canonicalLocal = dataset(
      record("reviewQueueEntry", "crash-a", "a", 1),
      record("reviewQueueEntry", "crash-b", "b", 1),
    );
    const confirmation = { confirmed: true, planId: previewAdoption(canonicalLocal, empty).planId };
    if (kind === "extra") {
      const confirmationReplay = await scenario.service.confirmAdoptionOperation(scenario.uid, { adoptionId: scenario.adoptionId, confirmation });
      assert.equal(confirmationReplay.result, "accepted");
      if (confirmationReplay.result !== "accepted") throw new Error("unexpected_confirmation_replay");
      assert.equal(confirmationReplay.stage, "checkingCandidate");
      assert.equal((await scenario.service.readAdoptionPreviewPage(scenario.uid, { adoptionId: scenario.adoptionId, afterSequenceId: null })).planId, confirmation.planId);
    }
    const generation = scenario.store.records.get(scenario.uid)!.get(operation.operationFingerprint)!;
    const first = generation.entries().next().value as [string, PersistedAccountRecordDocument];
    if (kind === "extra" || kind === "unindexed") {
      const foreign = createPersistedAccountRecordDocument(record("reviewQueueEntry", `foreign-${kind}`, kind, 1));
      generation.set(foreign.keyHash, foreign);
      if (kind === "unindexed") scenario.store.semanticHiddenDocumentIds.add(foreign.keyHash);
    } else if (kind === "missing") {
      generation.delete(first[0]);
    } else if (kind === "wrongKey") {
      generation.delete(first[0]);
      generation.set("a".repeat(64), first[1]);
    } else if (kind === "wrongLength") {
      generation.set(first[0], { ...first[1], canonicalByteLength: first[1].canonicalByteLength + 1 });
    } else if (kind === "wrongBytes") {
      const bytes = new Uint8Array(first[1].canonicalBytes);
      bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 1;
      generation.set(first[0], { ...first[1], canonicalBytes: bytes });
    } else {
      generation.delete(first[0]);
      const replacement = createPersistedAccountRecordDocument(record("reviewQueueEntry", "same-count-replacement", "different", 1));
      generation.set(replacement.keyHash, replacement);
    }
    const headBefore = structuredClone(scenario.store.heads.get(scenario.uid));
    const advance = async () => {
      const current = scenario.store.adoptionOperations.get(scenario.uid)!;
      return scenario.service.advanceAdoption(scenario.uid, { adoptionId: scenario.adoptionId, expectedStepToken: current.stepToken });
    };
    if (kind === "wrongDigest") {
      await advance();
      const confirmationReplay = await scenario.service.confirmAdoptionOperation(scenario.uid, { adoptionId: scenario.adoptionId, confirmation });
      assert.equal(confirmationReplay.result, "accepted");
      if (confirmationReplay.result !== "accepted") throw new Error("unexpected_confirmation_replay");
      assert.equal(confirmationReplay.stage, "hashingCandidateManifest");
      assert.equal((await scenario.service.readAdoptionPreviewPage(scenario.uid, { adoptionId: scenario.adoptionId, afterSequenceId: null })).planId, confirmation.planId);
    }
    await assert.rejects(advance(), /(candidate_generation_mismatch|corrupt_account_record_document)/u, kind);
    assert.deepEqual(scenario.store.heads.get(scenario.uid), headBefore, `${kind} changed head`);
    await scenario.service.cancelAdoption(scenario.uid, { adoptionId: scenario.adoptionId });
    while (scenario.store.adoptionOperations.get(scenario.uid)!.stage !== "cancelled") await advance();
    assert.equal(
      scenario.store.records.get(scenario.uid)?.get(operation.operationFingerprint)?.size ?? 0,
      0,
      `${kind} candidate was not cleaned`,
    );
  }
});

test("expires both pre-activation proof stages into candidate-generation discard", async () => {
  for (const targetStage of ["checkingCandidate", "hashingCandidateManifest"] as const) {
    const scenario = await prepareAdoptionCrashTarget("physicalProof");
    if (targetStage === "hashingCandidateManifest") {
      const current = scenario.store.adoptionOperations.get(scenario.uid)!;
      await scenario.service.advanceAdoption(scenario.uid, { adoptionId: scenario.adoptionId, expectedStepToken: current.stepToken });
    }
    const current = scenario.store.adoptionOperations.get(scenario.uid)!;
    assert.equal(current.stage, targetStage);
    if (current.stage !== "checkingCandidate" && current.stage !== "hashingCandidateManifest") throw new Error("unexpected_proof_stage");
    const local = dataset(
      record("reviewQueueEntry", "crash-a", "a", 1),
      record("reviewQueueEntry", "crash-b", "b", 1),
    );
    const expiringService = new AccountDataService(scenario.store, () => Date.parse("2026-08-02T13:00:00.000Z"));
    const result = await expiringService.startAdoption(scenario.uid, {
      adoptionId: scenario.adoptionId, expectedAccountRevision: 0,
      expectedDatasetFingerprint: fingerprintDataset(empty), localDatasetFingerprint: fingerprintDataset(local),
      localRecordCount: 2, restartCancelled: false, restartDiscarded: false,
    });
    assert.equal(result.result, "cleanupRequired");
    const discarding = scenario.store.adoptionOperations.get(scenario.uid)!;
    assert.equal(discarding.stage, "discarding");
    if (discarding.stage !== "discarding") throw new Error("unexpected_discard_stage");
    assert.equal(discarding.candidateGeneration, current.operationFingerprint);
    while (scenario.store.adoptionOperations.get(scenario.uid)!.stage !== "discarded") {
      const operation = scenario.store.adoptionOperations.get(scenario.uid)!;
      await expiringService.advanceAdoption(scenario.uid, { adoptionId: scenario.adoptionId, expectedStepToken: operation.stepToken });
    }
  }
});

test("rejects missing and extra declared source records in both prepare and candidate build without progress", async () => {
  for (const target of ["prepareAdvance", "candidateWrite"] as const) {
    for (const fault of ["missing", "extra"] as const) {
      const scenario = await prepareAdoptionCrashTarget(target);
      const localRecords = scenario.store.adoptionLocalRecords.get(scenario.uid)!;
      if (fault === "missing") {
        localRecords.clear();
      } else {
        localRecords.delete("0000000000000001");
        const extraRecord = createPersistedAccountRecordDocument(record("reviewQueueEntry", `extra-${target}`, fault, 1));
        localRecords.set("0000000000000002", { record: extraRecord, sequenceId: "0000000000000002" });
      }
      const before = structuredClone(scenario.store.adoptionOperations.get(scenario.uid)!);
      await assert.rejects(scenario.command(), /corrupt_adoption_source_count/u, `${target}/${fault}`);
      assert.deepEqual(scenario.store.adoptionOperations.get(scenario.uid), before);
    }
  }
});

test("enforces adoption upload raw two-MiB minus, equal, plus-one and its separate encoded envelope", async () => {
  const max = MAX_CANONICAL_ACCOUNT_RECORD_BYTES;
  const pages = [
    { delta: -1, sizes: [max, max, max, max - 1] },
    { delta: 0, sizes: [max, max, max, max] },
    { delta: 1, sizes: [max, max, max, max, 1] },
  ] as const;
  for (const { delta, sizes } of pages) {
    const minimum = 256;
    const normalizationOverhead = sizes.reduce((total, size) => total + Math.max(0, minimum - size), 0);
    const normalizedSizes = sizes.map((size) => Math.max(minimum, size));
    normalizedSizes[0] = normalizedSizes[0]! - normalizationOverhead;
    const records = normalizedSizes.map((size, index) => recordWithCanonicalSize(`raw-${delta}-${index}`, size));
    const documents = records.map(createPersistedAccountRecordDocument);
    assert.equal(documents.reduce((total, value) => total + value.canonicalByteLength, 0), MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES + delta);
    assert.ok(documents.every((value) => value.canonicalByteLength <= MAX_CANONICAL_ACCOUNT_RECORD_BYTES));
    const local = dataset(...records);
    const store = new MemoryStore();
    const service = new AccountDataService(store);
    const localDatasetFingerprint = fingerprintDataset(local);
    const semantic = {
      expectedAccountRevision: 0,
      expectedDatasetFingerprint: fingerprintDataset(empty),
      kind: "accountAdoption",
      localDatasetFingerprint,
      localRecordCount: records.length,
    };
    const adoptionId = computeCanonicalSha256(semantic);
    await service.startAdoption(`uid-upload-boundary-${delta}`, {
      adoptionId,
      expectedAccountRevision: 0,
      expectedDatasetFingerprint: semantic.expectedDatasetFingerprint,
      localDatasetFingerprint,
      localRecordCount: records.length,
      restartCancelled: false,
      restartDiscarded: false,
    });
    const pageFingerprint = computeCanonicalSha256({ adoptionId, kind: "adoptionUploadPage", records, startRecordIndex: 0 });
    await assert.rejects(
      service.uploadAdoptionPage(`uid-upload-boundary-${delta}`, { adoptionId, pageFingerprint, records, startRecordIndex: 0 }),
      /adoption_page_too_large/u,
    );
    assert.equal(store.transactions, 1, `boundary ${delta} must reject before the upload transaction`);
  }

  const acceptedRecords = [
    recordWithCanonicalSize("encoded-accepted-a", MAX_CANONICAL_ACCOUNT_RECORD_BYTES),
    recordWithCanonicalSize("encoded-accepted-b", MAX_CANONICAL_ACCOUNT_RECORD_BYTES),
  ];
  const acceptedDataset = dataset(...acceptedRecords);
  const store = new MemoryStore();
  const service = new AccountDataService(store);
  const localDatasetFingerprint = fingerprintDataset(acceptedDataset);
  const semantic = {
    expectedAccountRevision: 0,
    expectedDatasetFingerprint: fingerprintDataset(empty),
    kind: "accountAdoption",
    localDatasetFingerprint,
    localRecordCount: acceptedRecords.length,
  };
  const adoptionId = computeCanonicalSha256(semantic);
  await service.startAdoption("uid-upload-within-envelope", {
    adoptionId,
    expectedAccountRevision: 0,
    expectedDatasetFingerprint: semantic.expectedDatasetFingerprint,
    localDatasetFingerprint,
    localRecordCount: acceptedRecords.length,
    restartCancelled: false,
    restartDiscarded: false,
  });
  const pageFingerprint = computeCanonicalSha256({ adoptionId, kind: "adoptionUploadPage", records: acceptedRecords, startRecordIndex: 0 });
  assert.equal((await service.uploadAdoptionPage("uid-upload-within-envelope", {
    adoptionId,
    pageFingerprint,
    records: acceptedRecords,
    startRecordIndex: 0,
  })).acceptedNextRecordIndex, 2);
});



test("runs bounded durable adoption for 0, 1, 20, 21 and Unicode records with exact semantic identities", async () => {
  const cases: readonly AccountDataset[] = [
    empty,
    dataset(record("reviewQueueEntry", "only", "one", 1)),
    dataset(...Array.from({ length: 20 }, (_, index) => record("reviewQueueEntry", `id-${index.toString().padStart(2, "0")}`, `v-${index}`, 1))),
    dataset(...Array.from({ length: 21 }, (_, index) => record("reviewQueueEntry", `id-${index.toString().padStart(2, "0")}`, `v-${index}`, 1))),
    dataset(...["B", "a", "ä", "\uE000", "😀"].map((id) => record("reviewQueueEntry", id, `unicode-${id}`, 1))),
  ];
  for (const [caseIndex, local] of cases.entries()) {
    const uid = `uid-durable-${caseIndex}`;
    const store = new MemoryStore();
    const service = new AccountDataService(store, () => Date.parse("2026-08-02T12:00:00.000Z"));
    const localDatasetFingerprint = fingerprintDataset(local);
    const semanticStart = {
      expectedAccountRevision: 0,
      expectedDatasetFingerprint: fingerprintDataset(empty),
      kind: "accountAdoption",
      localDatasetFingerprint,
      localRecordCount: local.records.length,
    };
    const adoptionId = computeCanonicalSha256(semanticStart);
    const started = await service.startAdoption(uid, {
      adoptionId,
      expectedAccountRevision: 0,
      expectedDatasetFingerprint: semanticStart.expectedDatasetFingerprint,
      localDatasetFingerprint,
      localRecordCount: local.records.length,
      restartCancelled: false,
      restartDiscarded: false,
    });
    assert.equal(started.result, "started");
    const ordered = (canonicalAccountDatasetValue(local) as { records: AccountRecord[] }).records;
    for (let startRecordIndex = 0; startRecordIndex < ordered.length; startRecordIndex += 20) {
      const records = ordered.slice(startRecordIndex, startRecordIndex + 20);
      const pageFingerprint = computeCanonicalSha256({ adoptionId, kind: "adoptionUploadPage", records, startRecordIndex });
      const receipt = await service.uploadAdoptionPage(uid, { adoptionId, pageFingerprint, records, startRecordIndex });
      assert.equal(receipt.acceptedNextRecordIndex, startRecordIndex + records.length);
      assert.deepEqual(await service.uploadAdoptionPage(uid, { adoptionId, pageFingerprint, records, startRecordIndex }), receipt);
    }
    let operation = store.adoptionOperations.get(uid)!;
    for (let step = 0; operation.stage !== "previewReady" && step < 100; step += 1) {
      await service.advanceAdoption(uid, { adoptionId, expectedStepToken: operation.stepToken });
      operation = store.adoptionOperations.get(uid)!;
    }
    assert.equal(operation.stage, "previewReady");
    const purePreview = previewAdoption(local, empty);
    const previewPage = await service.readAdoptionPreviewPage(uid, { adoptionId, afterSequenceId: null });
    assert.deepEqual({
      caseId: previewPage.caseId,
      conflicts: previewPage.conflicts,
      localFingerprint: previewPage.localFingerprint,
      planId: previewPage.planId,
      remoteFingerprint: previewPage.remoteFingerprint,
      result: previewPage.result,
    }, purePreview);
    const confirmation = { confirmed: true, planId: purePreview.planId };
    await service.confirmAdoptionOperation(uid, { adoptionId, confirmation });
    operation = store.adoptionOperations.get(uid)!;
    for (let step = 0; operation.stage !== "completed" && step < 100; step += 1) {
      await service.advanceAdoption(uid, { adoptionId, expectedStepToken: operation.stepToken });
      operation = store.adoptionOperations.get(uid)!;
    }
    assert.equal(operation.stage, "completed");
    if (operation.stage !== "completed") throw new Error("unreachable");
    assert.equal(operation.operationFingerprint, computeAdoptionOperationFingerprint({ confirmation, expectedAccountRevision: 0, local }));
    assert.equal((await service.confirmAdoptionOperation(uid, { adoptionId, confirmation })).result, "completed");
    await assert.rejects(service.confirmAdoptionOperation(uid, {
      adoptionId,
      confirmation: { ...confirmation, abandonOtherActiveSessionConfirmed: true },
    }), /adoption_not_ready/u);
    const active = store.heads.get(uid)?.activeGeneration;
    const result = dataset(...[...(active ? store.records.get(uid)?.get(active)?.values() ?? [] : [])]
      .map((entry) => decodePersistedAccountRecordDocument(entry, entry.keyHash)));
    assert.deepEqual(canonicalAccountDatasetValue(result), canonicalAccountDatasetValue(confirmAdoption(local, empty, confirmation)));
    assert.equal(store.adoptionLocalRecords.get(uid)?.size ?? 0, 0);
    assert.equal(store.adoptionConflicts.get(uid)?.size ?? 0, 0);
    assert.ok(store.physicalDescriptorReadLimits.length > 0);
    assert.ok(store.physicalDescriptorReadLimits.every((limit) => limit <= 21));
    assert.ok(store.semanticDescriptorReadLimits.every((limit) => limit <= 21));
  }
});

test("matches all remote, conflict, and active-session adoption cases without whole-dataset service input", async () => {
  const divergentLocal = record("reviewQueueEntry", "same", "local", 1);
  const divergentRemote = record("reviewQueueEntry", "same", "remote", 1);
  const remoteDraft = (() => {
    const value = { id: "remote-draft", payload: { sessionId: remoteActive.id }, revision: 1, type: "simulationDraft" as const };
    return { ...value, fingerprint: computeRecordFingerprint(value) };
  })();
  const cases = [
    { local: empty, remote: dataset(remoteAttempt), confirmation: undefined },
    { local: dataset(attempt), remote: dataset(remoteAttempt), confirmation: undefined },
    { local: dataset(localActive), remote: empty, confirmation: undefined },
    { local: dataset(divergentLocal), remote: dataset(divergentRemote), blocked: true, confirmation: undefined },
    { local: dataset(localActive, attempt), remote: dataset(remoteActive, remoteDraft, remoteAttempt), confirmation: "local" as const },
  ];
  for (const [index, scenario] of cases.entries()) {
    const uid = `uid-durable-remote-${index}`;
    const store = new MemoryStore();
    const revision = scenario.remote.records.length === 0 ? 0 : 3;
    if (scenario.remote.records.length > 0) store.seed(uid, { accountRevision: revision, dataset: scenario.remote });
    const service = new AccountDataService(store);
    const localFingerprint = fingerprintDataset(scenario.local);
    const remoteFingerprint = fingerprintDataset(scenario.remote);
    const startSemantic = {
      expectedAccountRevision: revision,
      expectedDatasetFingerprint: remoteFingerprint,
      kind: "accountAdoption",
      localDatasetFingerprint: localFingerprint,
      localRecordCount: scenario.local.records.length,
    };
    const adoptionId = computeCanonicalSha256(startSemantic);
    await service.startAdoption(uid, {
      adoptionId,
      expectedAccountRevision: revision,
      expectedDatasetFingerprint: remoteFingerprint,
      localDatasetFingerprint: localFingerprint,
      localRecordCount: scenario.local.records.length,
      restartCancelled: false,
      restartDiscarded: false,
    });
    const ordered = (canonicalAccountDatasetValue(scenario.local) as { records: AccountRecord[] }).records;
    if (ordered.length > 0) {
      const pageFingerprint = computeCanonicalSha256({ adoptionId, kind: "adoptionUploadPage", records: ordered, startRecordIndex: 0 });
      await service.uploadAdoptionPage(uid, { adoptionId, pageFingerprint, records: ordered, startRecordIndex: 0 });
    }
    let operation = store.adoptionOperations.get(uid)!;
    while (operation.stage !== "previewReady") {
      await service.advanceAdoption(uid, { adoptionId, expectedStepToken: operation.stepToken });
      operation = store.adoptionOperations.get(uid)!;
    }
    const pure = previewAdoption(scenario.local, scenario.remote);
    assert.equal(operation.caseId, pure.caseId);
    if (scenario.blocked) {
      await assert.rejects(
        service.confirmAdoptionOperation(uid, { adoptionId, confirmation: { confirmed: true, planId: pure.planId } }),
        /adoption_conflict/u,
      );
      assert.equal(store.heads.get(uid)?.activeGeneration, scenario.remote.records.length === 0 ? undefined : "f".repeat(64));
      continue;
    }
    const confirmation = scenario.confirmation === "local"
      ? { abandonOtherActiveSessionConfirmed: true, confirmed: true, planId: pure.planId, selectedActiveSessionSide: "local" as const }
      : { confirmed: true, planId: pure.planId };
    await service.confirmAdoptionOperation(uid, { adoptionId, confirmation });
    operation = store.adoptionOperations.get(uid)!;
    while (operation.stage !== "completed") {
      await service.advanceAdoption(uid, { adoptionId, expectedStepToken: operation.stepToken });
      operation = store.adoptionOperations.get(uid)!;
    }
    const active = store.heads.get(uid)!.activeGeneration!;
    const actual = dataset(...[...store.records.get(uid)!.get(active)!.values()]
      .map((entry) => decodePersistedAccountRecordDocument(entry, entry.keyHash)));
    assert.deepEqual(canonicalAccountDatasetValue(actual), canonicalAccountDatasetValue(confirmAdoption(scenario.local, scenario.remote, confirmation)));
  }
});

test("replays the immediately preceding step and rejects a divergent candidate collision without progress", async () => {
  const local = dataset(record("reviewQueueEntry", "candidate", "canonical", 1));
  const store = new MemoryStore();
  const service = new AccountDataService(store);
  const localDatasetFingerprint = fingerprintDataset(local);
  const semantic = {
    expectedAccountRevision: 0,
    expectedDatasetFingerprint: fingerprintDataset(empty),
    kind: "accountAdoption",
    localDatasetFingerprint,
    localRecordCount: 1,
  };
  const adoptionId = computeCanonicalSha256(semantic);
  await service.startAdoption("uid-collision", {
    adoptionId,
    expectedAccountRevision: 0,
    expectedDatasetFingerprint: semantic.expectedDatasetFingerprint,
    localDatasetFingerprint,
    localRecordCount: 1,
    restartCancelled: false,
    restartDiscarded: false,
  });
  const records = [...local.records];
  const pageFingerprint = computeCanonicalSha256({ adoptionId, kind: "adoptionUploadPage", records, startRecordIndex: 0 });
  await service.uploadAdoptionPage("uid-collision", { adoptionId, pageFingerprint, records, startRecordIndex: 0 });
  let operation = store.adoptionOperations.get("uid-collision")!;
  const replayToken = operation.stepToken;
  const first = await service.advanceAdoption("uid-collision", { adoptionId, expectedStepToken: replayToken });
  const commits = store.transactionCommits;
  assert.deepEqual(await service.advanceAdoption("uid-collision", { adoptionId, expectedStepToken: replayToken }), first);
  assert.equal(store.transactionCommits, commits);
  operation = store.adoptionOperations.get("uid-collision")!;
  while (operation.stage !== "previewReady") {
    await service.advanceAdoption("uid-collision", { adoptionId, expectedStepToken: operation.stepToken });
    operation = store.adoptionOperations.get("uid-collision")!;
  }
  const preview = previewAdoption(local, empty);
  await service.confirmAdoptionOperation("uid-collision", { adoptionId, confirmation: { confirmed: true, planId: preview.planId } });
  operation = store.adoptionOperations.get("uid-collision")!;
  while (operation.stage !== "buildingCandidate") {
    await service.advanceAdoption("uid-collision", { adoptionId, expectedStepToken: operation.stepToken });
    operation = store.adoptionOperations.get("uid-collision")!;
  }
  if (operation.stage !== "buildingCandidate") throw new Error("unreachable");
  const divergent = record("reviewQueueEntry", "candidate", "different", 1);
  const divergentDocument = createPersistedAccountRecordDocument(divergent);
  store.records.set("uid-collision", new Map([[operation.operationFingerprint, new Map([[divergentDocument.keyHash, divergentDocument]])]]));
  const before = structuredClone(operation);
  await assert.rejects(
    service.advanceAdoption("uid-collision", { adoptionId, expectedStepToken: operation.stepToken }),
    /candidate_record_collision/u,
  );
  assert.deepEqual(store.adoptionOperations.get("uid-collision"), before);
  assert.equal(store.heads.has("uid-collision"), false);
});

test("cancels, expires, restarts, and discards snapshot-changed adoption with exact terminal replay", async () => {
  const local = dataset(record("reviewQueueEntry", "durable", "durable", 1));
  const startFor = async (uid: string, store: MemoryStore, service: AccountDataService, restartCancelled = false) => {
    const localDatasetFingerprint = fingerprintDataset(local);
    const semantic = {
      expectedAccountRevision: 0,
      expectedDatasetFingerprint: fingerprintDataset(empty),
      kind: "accountAdoption",
      localDatasetFingerprint,
      localRecordCount: 1,
    };
    const adoptionId = computeCanonicalSha256(semantic);
    const result = await service.startAdoption(uid, {
      adoptionId,
      expectedAccountRevision: 0,
      expectedDatasetFingerprint: semantic.expectedDatasetFingerprint,
      localDatasetFingerprint,
      localRecordCount: 1,
      restartCancelled,
      restartDiscarded: false,
    });
    return { adoptionId, result };
  };
  const upload = async (uid: string, service: AccountDataService, adoptionId: string) => {
    const records = [...local.records];
    const pageFingerprint = computeCanonicalSha256({ adoptionId, kind: "adoptionUploadPage", records, startRecordIndex: 0 });
    await service.uploadAdoptionPage(uid, { adoptionId, pageFingerprint, records, startRecordIndex: 0 });
  };

  const cancelStore = new MemoryStore();
  const cancelService = new AccountDataService(cancelStore);
  const cancelledStart = await startFor("uid-cancel", cancelStore, cancelService);
  await upload("uid-cancel", cancelService, cancelledStart.adoptionId);
  await cancelService.cancelAdoption("uid-cancel", { adoptionId: cancelledStart.adoptionId });
  let operation = cancelStore.adoptionOperations.get("uid-cancel")!;
  let finalInputToken = "";
  while (operation.stage !== "cancelled") {
    finalInputToken = operation.stepToken;
    await cancelService.advanceAdoption("uid-cancel", { adoptionId: operation.adoptionId, expectedStepToken: finalInputToken });
    operation = cancelStore.adoptionOperations.get("uid-cancel")!;
  }
  assert.deepEqual(
    await cancelService.advanceAdoption("uid-cancel", { adoptionId: operation.adoptionId, expectedStepToken: operation.stepToken }),
    { adoptionId: operation.adoptionId, result: "cancelled" },
  );
  assert.equal((await cancelService.advanceAdoption("uid-cancel", { adoptionId: operation.adoptionId, expectedStepToken: finalInputToken })).result, "advanced");
  assert.equal((await startFor("uid-cancel", cancelStore, cancelService, true)).result.result, "started");

  let now = Date.parse("2026-08-02T00:00:00.000Z");
  const expiryStore = new MemoryStore();
  const expiryService = new AccountDataService(expiryStore, () => now);
  const expiredStart = await startFor("uid-expiry", expiryStore, expiryService);
  now += TRANSITION_LEASE_MS;
  const cleanupRequired = await startFor("uid-expiry", expiryStore, expiryService);
  assert.equal(cleanupRequired.result.result, "cleanupRequired");
  assert.equal(expiryStore.adoptionOperations.get("uid-expiry")!.lastAdvance, null);

  const raceStore = new MemoryStore();
  const raceService = new AccountDataService(raceStore);
  const raceStart = await startFor("uid-race", raceStore, raceService);
  await upload("uid-race", raceService, raceStart.adoptionId);
  const remoteMutation = record("reviewQueueEntry", "remote-sync", "remote", 1);
  await raceService.applySync("uid-race", syncInput({
    expectedAccountRevision: 0,
    mutations: [{ expectedRecordRevision: null, kind: "put", record: remoteMutation }],
  }));
  const beforeRace = raceStore.adoptionOperations.get("uid-race")!;
  await assert.rejects(
    raceService.advanceAdoption("uid-race", { adoptionId: raceStart.adoptionId, expectedStepToken: beforeRace.stepToken }),
    /snapshot_changed/u,
  );
  assert.equal(raceStore.adoptionOperations.get("uid-race")!.stage, "discarding");
  assert.equal(raceStore.heads.get("uid-race")!.manifest.fingerprint, fingerprintDataset(dataset(remoteMutation)));
});

test("remote sync during upload or candidate build never publishes the stale adoption", async () => {
  for (const target of ["upload", "candidateWrite"] as const) {
    const scenario = await prepareAdoptionCrashTarget(target);
    if (target === "candidateWrite") await scenario.command();
    const syncRecord = record("reviewQueueEntry", `sync-${target}`, `sync-${target}`, 1);
    const sync = syncInput({
      expectedAccountRevision: 0,
      mutations: [{ expectedRecordRevision: null, kind: "put" as const, record: syncRecord }],
    });
    await scenario.service.applySync(scenario.uid, sync);
    const syncedHead = structuredClone(scenario.store.heads.get(scenario.uid)!);
    const operation = scenario.store.adoptionOperations.get(scenario.uid)!;
    const staleCandidateGeneration = operation.stage === "buildingCandidate" ? operation.operationFingerprint : null;
    if (target === "upload") {
      await assert.rejects(scenario.command(), /snapshot_changed/u);
    }
    await assert.rejects(scenario.service.advanceAdoption(scenario.uid, {
      adoptionId: scenario.adoptionId,
      expectedStepToken: operation.stepToken,
    }), /snapshot_changed/u);
    assert.equal(scenario.store.adoptionOperations.get(scenario.uid)!.stage, "discarding");
    assert.deepEqual(scenario.store.heads.get(scenario.uid), syncedHead);
    if (staleCandidateGeneration !== null) assert.notEqual(syncedHead.activeGeneration, staleCandidateGeneration);
  }
});

test("allows sync on the adopted generation throughout cleanup and rejects a changed active generation without progress", async () => {
  const scenario = await prepareAdoptionCrashTarget("activationCas");
  await scenario.command();
  let operation = scenario.store.adoptionOperations.get(scenario.uid)!;
  assert.equal(operation.stage, "activatedCleaning");
  const committedRevision = operation.stage === "activatedCleaning" ? operation.committedAccountRevision : 0;
  const syncedIds: string[] = [];
  for (const expectedPhase of ["localRecords", "conflicts", "finalize"] as const) {
    operation = scenario.store.adoptionOperations.get(scenario.uid)!;
    while (operation.stage === "activatedCleaning" && operation.cleanup.phase !== expectedPhase) {
      await scenario.service.advanceAdoption(scenario.uid, { adoptionId: scenario.adoptionId, expectedStepToken: operation.stepToken });
      operation = scenario.store.adoptionOperations.get(scenario.uid)!;
    }
    assert.equal(operation.stage, "activatedCleaning");
    if (operation.stage !== "activatedCleaning") throw new Error("unexpected_cleanup_stage");
    assert.equal(operation.cleanup.phase, expectedPhase);
    const syncRecord = record("reviewQueueEntry", `cleanup-sync-${expectedPhase}`, expectedPhase, 1);
    syncedIds.push(syncRecord.id);
    const head = scenario.store.heads.get(scenario.uid)!;
    await scenario.service.applySync(scenario.uid, syncInput({
      expectedAccountRevision: head.accountRevision,
      mutations: [{ expectedRecordRevision: null, kind: "put", record: syncRecord }],
    }));
    operation = scenario.store.adoptionOperations.get(scenario.uid)!;
    await scenario.service.advanceAdoption(scenario.uid, { adoptionId: scenario.adoptionId, expectedStepToken: operation.stepToken });
  }
  operation = scenario.store.adoptionOperations.get(scenario.uid)!;
  assert.equal(operation.stage, "completed");
  if (operation.stage !== "completed") throw new Error("unexpected_terminal_stage");
  assert.equal(operation.committedAccountRevision, committedRevision);
  const activeGeneration = scenario.store.heads.get(scenario.uid)!.activeGeneration!;
  const activeIds = [...scenario.store.records.get(scenario.uid)!.get(activeGeneration)!.values()].map((entry) => entry.id);
  for (const id of syncedIds) assert.ok(activeIds.includes(id));

  const changed = await prepareAdoptionCrashTarget("activationCas");
  await changed.command();
  const changedOperation = changed.store.adoptionOperations.get(changed.uid)!;
  const foreignGeneration = "c".repeat(64);
  changed.store.heads.set(changed.uid, {
    ...changed.store.heads.get(changed.uid)!,
    activeGeneration: foreignGeneration,
  });
  const before = adoptionStoreSnapshot(changed.store, changed.uid);
  await assert.rejects(changed.service.advanceAdoption(changed.uid, {
    adoptionId: changed.adoptionId, expectedStepToken: changedOperation.stepToken,
  }), /active_generation_changed/u);
  assert.deepEqual(adoptionStoreSnapshot(changed.store, changed.uid), before);
});

test("applies exact null-create and existing-revision sync semantics with stale, replay, and collision safety", async () => {
  const store = new MemoryStore();
  const service = new AccountDataService(store);
  const created = record("reviewQueueEntry", "review-create", "created", 1);

  const createInput = syncInput({
    expectedAccountRevision: 0,
    mutations: [{ expectedRecordRevision: null, kind: "put", record: created }],
  });
  const first = await service.applySync("uid-sync", createInput);
  assert.equal(first.accountRevision, 1);
  assert.equal(store.transactionCommits, 1);

  const replay = await service.applySync("uid-sync", createInput);
  assert.deepEqual(replay, first);
  assert.equal(store.transactionCommits, 1);

  for (const [label, expectedRecordRevision, revision] of [
    ["invented zero create", 0, 1],
    ["non-one create revision", null, 2],
  ] as const) {
    const isolated = new AccountDataService(new MemoryStore());
    await assert.rejects(isolated.applySync("uid-new", syncInput({
      expectedAccountRevision: 0,
      mutations: [{ expectedRecordRevision, kind: "put", record: record("reviewQueueEntry", `review-${label}`, label, revision) }],
    })), /record_revision_conflict/u, label);
  }

  const updated = record("reviewQueueEntry", "review-create", "updated", 2);
  await assert.rejects(service.applySync("uid-sync", syncInput({
    expectedAccountRevision: 1,
    mutations: [{ expectedRecordRevision: null, kind: "put", record: updated }],
  })), /record_revision_conflict/u);
  const second = await service.applySync("uid-sync", syncInput({
    expectedAccountRevision: 1,
    mutations: [{ expectedRecordRevision: 1, kind: "put", record: updated }],
  }));
  assert.equal(second.accountRevision, 2);
  await assert.rejects(service.applySync("uid-sync", syncInput({
    expectedAccountRevision: 2,
    mutations: [{ expectedRecordRevision: 1, kind: "put", record: record("reviewQueueEntry", "review-create", "stale", 2) }],
  })), /record_revision_conflict/u);

  const immutableStore = new MemoryStore();
  const immutableService = new AccountDataService(immutableStore);
  const immutable = record("trainingAttempt", "attempt-sync", "immutable");
  await immutableService.applySync("uid-immutable", syncInput({
    expectedAccountRevision: 0,
    mutations: [{ expectedRecordRevision: null, kind: "put", record: immutable }],
  }));
  await assert.rejects(immutableService.applySync("uid-immutable", syncInput({
    expectedAccountRevision: 1,
    mutations: [{ expectedRecordRevision: null, kind: "put", record: record("trainingAttempt", "attempt-sync", "collision") }],
  })), /immutable_integrity_conflict/u);
});

test("computes deterministic fingerprints from the complete canonical semantic envelope", () => {
  const first = record("reviewQueueEntry", "first", "first", 1);
  const second = record("reviewQueueEntry", "second", "second", 1);
  const confirmation = { confirmed: true, planId: "plan" } as const;

  assert.equal(
    computeAdoptionOperationFingerprint({ confirmation, expectedAccountRevision: 4, local: dataset(first, second) }),
    computeAdoptionOperationFingerprint({ confirmation, expectedAccountRevision: 4, local: dataset(second, first) }),
  );
  assert.notEqual(
    computeAdoptionOperationFingerprint({ confirmation, expectedAccountRevision: 4, local: dataset(first) }),
    computeAdoptionOperationFingerprint({ confirmation, expectedAccountRevision: 5, local: dataset(first) }),
  );

  const left = { expectedRecordRevision: null, kind: "put", record: first } as const;
  const right = { expectedRecordRevision: null, kind: "put", record: second } as const;
  assert.equal(
    computeSyncOperationFingerprint({ expectedAccountRevision: 0, mutations: [left, right] }),
    computeSyncOperationFingerprint({ expectedAccountRevision: 0, mutations: [right, left] }),
  );
  assert.notEqual(
    computeSyncOperationFingerprint({ expectedAccountRevision: 0, mutations: [left] }),
    computeSyncOperationFingerprint({ expectedAccountRevision: 0, mutations: [{ ...left, expectedRecordRevision: 1 }] }),
  );
  const deletion = {
    expectedFingerprint: first.fingerprint,
    expectedRecordRevision: 1,
    id: first.id,
    kind: "delete" as const,
    type: first.type,
  };
  assert.notEqual(
    computeSyncOperationFingerprint({ expectedAccountRevision: 0, mutations: [deletion] }),
    computeSyncOperationFingerprint({
      expectedAccountRevision: 0,
      mutations: [{ ...deletion, expectedFingerprint: "0".repeat(64) }],
    }),
  );
  assert.notEqual(
    computeSyncOperationFingerprint({ expectedAccountRevision: 0, mutations: [deletion] }),
    computeSyncOperationFingerprint({ expectedAccountRevision: 0, mutations: [{ ...deletion, expectedRecordRevision: 2 }] }),
  );
});

test("canonicalizes adoption conflicts and preserves the fixed plan and operation identities", () => {
  const identityRecord = (id: string, value: string): AccountRecord => {
    const base = { id, payload: { v: value }, revision: 1, type: "reviewQueueEntry" as const };
    return { ...base, fingerprint: computeRecordFingerprint(base) };
  };
  const localA = identityRecord("a", "local-a");
  const localB = identityRecord("b", "local-b");
  const remoteA = identityRecord("a", "remote-a");
  const remoteB = identityRecord("b", "remote-b");
  const expectedPlanId = "0410bb712f3025403c7a4e9e1f4bedcc5fe978d7bf0254dab06a0c66bc532bdd";
  const expectedOperationFingerprint = "a0462bac9073e2c35b50aa95192a86adace821a00e0175975899dd8d27570aa2";
  const expectedConflicts = [
    { code: "revision_conflict", recordId: "a", recordType: "reviewQueueEntry" },
    { code: "revision_conflict", recordId: "b", recordType: "reviewQueueEntry" },
  ];

  for (const localRecords of [[localA, localB], [localB, localA]]) {
    for (const remoteRecords of [[remoteA, remoteB], [remoteB, remoteA]]) {
      const local = dataset(...localRecords);
      const preview = previewAdoption(local, dataset(...remoteRecords));
      assert.equal(preview.planId, expectedPlanId);
      assert.deepEqual(preview.conflicts, expectedConflicts);
      assert.equal(computeAdoptionOperationFingerprint({
        confirmation: { confirmed: true, planId: preview.planId },
        expectedAccountRevision: 7,
        local,
      }), expectedOperationFingerprint);
    }
  }

  const immutableLocal = record("trainingAttempt", "z", "local-z");
  const immutableRemote = record("trainingAttempt", "z", "remote-z");
  const ordered = previewAdoption(
    dataset(immutableLocal, localB, localA),
    dataset(remoteB, remoteA, immutableRemote),
  );
  assert.deepEqual(ordered.conflicts, [
    ...expectedConflicts,
    { code: "immutable_integrity_conflict", recordId: "z", recordType: "trainingAttempt" },
  ]);
});

test("orders Unicode record identity exactly like Firestore UTF-8 bytes across all permutations", () => {
  const ids = ["B", "a", "ä", "😀", "\uE000"] as const;
  const expectedIds = ["B", "a", "ä", "\uE000", "😀"];
  const unicodeRecord = (id: string, side: "local" | "remote"): AccountRecord => {
    const base = {
      id,
      payload: { value: `${side}-${id}` },
      revision: 1,
      type: "reviewQueueEntry" as const,
    };
    return { ...base, fingerprint: computeRecordFingerprint(base) };
  };
  const permutations = <T,>(values: readonly T[]): readonly (readonly T[])[] => {
    if (values.length <= 1) return [[...values]];
    return values.flatMap((value, index) => permutations([
      ...values.slice(0, index),
      ...values.slice(index + 1),
    ]).map((suffix) => [value, ...suffix]));
  };
  const oracle = (left: string, right: string): number => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
  for (const left of [...ids, "aa", "a😀"]) {
    for (const right of [...ids, "aa", "a😀"]) {
      assert.equal(
        Math.sign(compareAccountRecordUtf8Bytes(left, right)),
        Math.sign(oracle(left, right)),
        `${JSON.stringify(left)}:${JSON.stringify(right)}`,
      );
    }
  }
  assert.deepEqual([...ids].sort(compareAccountRecordUtf8Bytes), expectedIds);

  const localCanonical = expectedIds.map((id) => unicodeRecord(id, "local"));
  const remoteCanonical = expectedIds.map((id) => unicodeRecord(id, "remote"));
  const expectedConflicts = expectedIds.map((recordId) => ({
    code: "revision_conflict" as const,
    recordId,
    recordType: "reviewQueueEntry" as const,
  }));
  const expectedLocalFingerprint = "b230c7013098d0e2d8a90c1014e99ebaffa208898d547405cf15e076b09267ff";
  const expectedRemoteFingerprint = "a300d1280d79f082032f4cb3e5ad59b82b497069b18a53cdea63127051674552";
  const expectedPlanId = "1b9287f23f3f7b6d038c025753140ea75202aa9660063974f729ba6e56c835ec";
  const localPermutations = permutations(localCanonical);
  const remotePermutations = permutations(remoteCanonical);
  assert.equal(localPermutations.length, 120);
  for (const [localRecords, remoteRecords] of [
    ...localPermutations.map((records) => [records, remoteCanonical] as const),
    ...remotePermutations.map((records) => [localCanonical, records] as const),
  ]) {
    const local = dataset(...localRecords);
    const remote = dataset(...remoteRecords);
    assert.equal(fingerprintDataset(local), expectedLocalFingerprint);
    assert.equal(fingerprintDataset(remote), expectedRemoteFingerprint);
    const preview = previewAdoption(local, remote);
    assert.equal(preview.planId, expectedPlanId);
    assert.deepEqual(preview.conflicts, expectedConflicts);
    assert.throws(
      () => confirmAdoption(local, remote, { confirmed: true, planId: preview.planId }),
      /adoption_conflict/u,
    );
  }

  const canonicalValue = canonicalAccountDatasetValue(dataset(...[...localCanonical].reverse())) as {
    records: readonly AccountRecord[];
  };
  assert.deepEqual(canonicalValue.records.map((entry) => entry.id), expectedIds);

  const disjointLocal = dataset(...localCanonical.filter((_entry, index) => index % 2 === 0).reverse());
  const disjointRemote = dataset(...remoteCanonical.filter((_entry, index) => index % 2 === 1).reverse());
  const mergePreview = previewAdoption(disjointLocal, disjointRemote);
  const merged = confirmAdoption(disjointLocal, disjointRemote, { confirmed: true, planId: mergePreview.planId });
  assert.deepEqual(merged.records.map((entry) => entry.id), expectedIds);
});


test("accepts paired non-BMP record IDs and rejects every lone surrogate form", () => {
  const valid = record("reviewQueueEntry", "paired-😀-id", "valid", 1);
  assert.doesNotThrow(() => previewAdoption(dataset(valid), empty));

  for (const invalidId of ["\uD800", "\uDBFF", "\uDC00", "\uDFFF", "high-\uD800-x", "\uD800\uD800", "\uDC00\uD800"]) {
    const base = {
      id: invalidId,
      payload: { nested: { value: "invalid" } },
      revision: 1,
      type: "reviewQueueEntry" as const,
    };
    const invalid = { ...base, fingerprint: computeRecordFingerprint(base) };
    assert.throws(() => previewAdoption(dataset(invalid), empty), /invalid_account_record/u, JSON.stringify(invalidId));
  }
});


test("rejects unknown, hybrid, or extra-field sync mutations before fingerprinting or store access", async () => {
  const existing = record("reviewQueueEntry", "runtime-union", "existing", 1);
  const put = { expectedRecordRevision: 1, kind: "put", record: record("reviewQueueEntry", existing.id, "updated", 2) };
  const deletion = {
    expectedFingerprint: existing.fingerprint,
    expectedRecordRevision: 1,
    id: existing.id,
    kind: "delete",
    type: existing.type,
  };
  const invalidMutations: readonly unknown[] = [
    { ...put, kind: "unknown" },
    { ...put, expectedFingerprint: existing.fingerprint, id: existing.id, type: existing.type },
    { ...deletion, record: put.record },
    { ...put, extra: true },
  ];

  for (const [index, invalidMutation] of invalidMutations.entries()) {
    const mutations = [invalidMutation] as unknown as SyncOperationSemanticInput["mutations"];
    assert.throws(
      () => computeSyncOperationFingerprint({ expectedAccountRevision: 3, mutations }),
      /invalid_sync_operation/u,
    );

    const uid = `uid-invalid-runtime-union-${index}`;
    const store = new MemoryStore();
    store.seed(uid, { accountRevision: 3, dataset: dataset(existing) });
    const headBefore = structuredClone(store.heads.get(uid));
    const recordsBefore = structuredClone(store.records.get(uid));
    await assert.rejects(new AccountDataService(store).applySync(uid, {
      expectedAccountRevision: 3,
      mutations,
      operationFingerprint: "0".repeat(64),
    }), /invalid_sync_operation/u);
    assert.equal(store.transactions, 0);
    assert.equal(store.transactionCommits, 0);
    assert.deepEqual(store.heads.get(uid), headBefore);
    assert.deepEqual(store.records.get(uid), recordsBefore);
  }
});

test("rejects duplicate mutation keys before transaction and multiple active references after sync", async () => {
  const duplicateStore = new MemoryStore();
  const duplicateService = new AccountDataService(duplicateStore);
  const first = record("reviewQueueEntry", "duplicate", "first", 1);
  const second = record("reviewQueueEntry", "duplicate", "second", 1);
  await assert.rejects(
    duplicateService.applySync("uid-duplicate-mutation", {
      expectedAccountRevision: 0,
      mutations: [
        { expectedRecordRevision: null, kind: "put", record: first },
        { expectedRecordRevision: null, kind: "put", record: second },
      ],
      operationFingerprint: "0".repeat(64),
    }),
    /duplicate_sync_mutation_key/u,
  );
  assert.equal(duplicateStore.transactions, 0);
  assert.equal(duplicateStore.transactionCommits, 0);

  const activeStore = new MemoryStore();
  const activeService = new AccountDataService(activeStore);
  const semantic = {
    expectedAccountRevision: 0,
    mutations: [
      { expectedRecordRevision: null, kind: "put", record: localActive },
      { expectedRecordRevision: null, kind: "put", record: remoteActive },
    ],
  } as const;
  await assert.rejects(
    activeService.applySync("uid-two-active", syncInput(semantic)),
    /multiple_active_session_references/u,
  );
  assert.equal(activeStore.transactionCommits, 0);
});



test("stores only fixed scalar metadata plus exact canonical bytes and enforces the 512-KiB boundary", () => {
  const atLimit = recordWithCanonicalSize("record-at-limit", MAX_CANONICAL_ACCOUNT_RECORD_BYTES);
  const encoded = encodeCanonicalAccountRecord(atLimit);
  assert.equal(encoded.byteLength, MAX_CANONICAL_ACCOUNT_RECORD_BYTES);
  assert.deepEqual(decodeCanonicalAccountRecord(encoded), atLimit);
  assert.throws(
    () => encodeCanonicalAccountRecord(recordWithCanonicalSize("record-over-limit", MAX_CANONICAL_ACCOUNT_RECORD_BYTES + 1)),
    /account_record_too_large/u,
  );

  const highCardinalityValue = {
    id: "high-cardinality",
    payload: Object.fromEntries(Array.from({ length: 1_000 }, (_, index) => [`field-${index}`, { nested: index }])),
    revision: 1,
    type: "reviewQueueEntry" as const,
  };
  const highCardinality = { ...highCardinalityValue, fingerprint: computeRecordFingerprint(highCardinalityValue) };
  const persisted = createPersistedAccountRecordDocument(highCardinality);
  assert.deepEqual(Object.keys(persisted).sort(), ["canonicalByteLength", "canonicalBytes", "fingerprint", "id", "keyHash", "revision", "type"]);
  assert.equal(Object.hasOwn(persisted, "payload"), false);
  assert.deepEqual(decodePersistedAccountRecordDocument(persisted, persisted.keyHash), highCardinality);

  assert.throws(
    () => decodePersistedAccountRecordDocument({ ...persisted, id: "different" }, persisted.keyHash),
    /corrupt_account_record_document/u,
  );
  assert.throws(
    () => decodePersistedAccountRecordDocument(persisted, "0".repeat(64)),
    /corrupt_account_record_document/u,
  );
  const corruptBytes = Uint8Array.from(persisted.canonicalBytes);
  corruptBytes[0] = "[".charCodeAt(0);
  assert.throws(
    () => decodePersistedAccountRecordDocument({ ...persisted, canonicalBytes: corruptBytes }, persisted.keyHash),
    /invalid_canonical_account_record|corrupt_account_record_document/u,
  );
});


test("accepts 100 sync mutations and rejects 101 before opening a transaction", async () => {
  const hundred = Array.from({ length: MAX_SYNC_MUTATIONS }, (_, index) => ({
    expectedRecordRevision: null,
    kind: "put" as const,
    record: record("reviewQueueEntry", `batch-${index.toString().padStart(3, "0")}`, `value-${index}`, 1),
  }));
  const store = new MemoryStore();
  const service = new AccountDataService(store);
  const result = await service.applySync("uid-batch-100", syncInput({ expectedAccountRevision: 0, mutations: hundred }));
  assert.equal(result.dataset.records.length, 100);
  assert.equal(store.recordPuts, 100);

  const oversizedStore = new MemoryStore();
  await assert.rejects(
    new AccountDataService(oversizedStore).applySync("uid-batch-101", {
      expectedAccountRevision: 0,
      mutations: [...hundred, {
        expectedRecordRevision: null,
        kind: "put",
        record: record("reviewQueueEntry", "batch-100", "value-100", 1),
      }],
      operationFingerprint: "0".repeat(64),
    }),
    /invalid_sync_operation/u,
  );
  assert.equal(oversizedStore.transactions, 0);
});


test("enforces the exact two-MiB put-and-delete envelope before persistence", async () => {
  const uid = "uid-two-mib";
  const generationId = "e".repeat(64);
  const deleted = recordWithCanonicalSize("delete-large", 350_000);
  const fixedPuts = [
    recordWithCanonicalSize("put-large-a", 420_000),
    recordWithCanonicalSize("put-large-b", 420_000),
    recordWithCanonicalSize("put-large-c", 420_000),
  ];
  const deletedDocument = createPersistedAccountRecordDocument(deleted);
  const fixedBytes = estimatePersistedAccountRecordBytes(
    accountRecordDocumentPath(uid, generationId, deletedDocument.keyHash),
    deletedDocument,
  ) + fixedPuts.reduce((total, entry) => {
    const document = createPersistedAccountRecordDocument(entry);
    return total + estimatePersistedAccountRecordBytes(
      accountRecordDocumentPath(uid, generationId, document.keyHash),
      document,
    );
  }, 0);
  const baseLast = recordWithCanonicalSize("put-adjusted", 1_000);
  const baseLastDocument = createPersistedAccountRecordDocument(baseLast);
  const lastOverheadWithoutLength = estimatePersistedAccountRecordBytes(
    accountRecordDocumentPath(uid, generationId, baseLastDocument.keyHash),
    baseLastDocument,
  ) - baseLastDocument.canonicalBytes.byteLength - String(baseLastDocument.canonicalByteLength).length;
  let exactLastCanonicalSize = MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES - fixedBytes - lastOverheadWithoutLength;
  while (exactLastCanonicalSize + lastOverheadWithoutLength + String(exactLastCanonicalSize).length + fixedBytes !== MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES) {
    exactLastCanonicalSize = MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES - fixedBytes - lastOverheadWithoutLength - String(exactLastCanonicalSize).length;
  }
  const build = (delta: number) => {
    const adjusted = recordWithCanonicalSize("put-adjusted", exactLastCanonicalSize + delta);
    const mutations = [
      {
        expectedFingerprint: deleted.fingerprint,
        expectedRecordRevision: deleted.revision!,
        id: deleted.id,
        kind: "delete" as const,
        type: deleted.type,
      },
      ...fixedPuts.map((entry) => ({ expectedRecordRevision: null, kind: "put" as const, record: entry })),
      { expectedRecordRevision: null, kind: "put" as const, record: adjusted },
    ];
    const adjustedDocument = createPersistedAccountRecordDocument(adjusted);
    const estimated = fixedBytes + estimatePersistedAccountRecordBytes(
      accountRecordDocumentPath(uid, generationId, adjustedDocument.keyHash),
      adjustedDocument,
    );
    return { estimated, mutations };
  };
  assert.equal(build(-1).estimated, MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES - 1);
  assert.equal(build(0).estimated, MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES);
  assert.equal(build(1).estimated, MAX_FIRESTORE_OPERATION_ENVELOPE_BYTES + 1);

  for (const delta of [-1, 0] as const) {
    const store = new MemoryStore();
    store.seed(uid, { accountRevision: 0, dataset: dataset(deleted) }, generationId);
    const result = await new AccountDataService(store).applySync(uid, syncInput({
      expectedAccountRevision: 0,
      mutations: build(delta).mutations,
    }));
    assert.equal(result.dataset.records.length, 4);
    assert.equal(store.transactionCommits, 1);
  }
  const rejectedStore = new MemoryStore();
  rejectedStore.seed(uid, { accountRevision: 0, dataset: dataset(deleted) }, generationId);
  await assert.rejects(new AccountDataService(rejectedStore).applySync(uid, syncInput({
    expectedAccountRevision: 0,
    mutations: build(1).mutations,
  })), /sync_operation_too_large/u);
  assert.equal(rejectedStore.transactionCommits, 0);
});

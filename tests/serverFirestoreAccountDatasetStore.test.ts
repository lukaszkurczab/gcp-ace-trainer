import assert from "node:assert/strict";
import test from "node:test";

import { computeCanonicalSha256, computeRecordFingerprint } from "../server/src/accountData.js";
import {
  adoptionSequenceId,
  computeAccountRecordKeyHash,
  createPersistedAccountRecordDocument,
  type AdoptionConflictDocument,
  type AdoptionLocalRecordDocument,
  type AdoptionOperation,
  type AccountDatasetHead,
} from "../server/src/accountService.js";
import { FirestoreAccountDatasetStore } from "../server/src/firebaseAdapters.js";

type StoredValue = Readonly<Record<string, unknown>>;

class FakeSnapshot {
  constructor(readonly id: string, private readonly value: StoredValue | undefined) {}
  get exists(): boolean { return this.value !== undefined; }
  data(): StoredValue | undefined { return this.value === undefined ? undefined : structuredClone(this.value); }
  get(field: string): unknown { return this.value?.[field]; }
}

class FakeDocumentReference {
  constructor(
    readonly path: string,
    private readonly values: Map<string, StoredValue>,
    private readonly queries: QueryTrace[],
    private readonly reverseQueryResults: () => boolean,
  ) {}
  collection(name: string): FakeCollectionReference {
    return new FakeCollectionReference(`${this.path}/${name}`, this.values, this.queries, this.reverseQueryResults);
  }
  async get(): Promise<FakeSnapshot> { return new FakeSnapshot(this.path.split("/").at(-1)!, this.values.get(this.path)); }
}

type QueryTrace = {
  after: unknown[] | null;
  limit: number | null;
  orders: Array<Readonly<{ field: string; direction: string }>>;
  path: string;
  selected: string[] | null;
};

const compareFirestoreText = (left: string, right: string): number =>
  Math.sign(Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")));

class FakeQuery {
  private after: unknown[] | null = null;
  private maximum = Number.MAX_SAFE_INTEGER;
  private readonly orders: Array<Readonly<{ field: string; direction: string }>> = [];
  private selected: string[] | null = null;
  constructor(
    protected readonly queryPath: string,
    protected readonly values: Map<string, StoredValue>,
    private readonly queries: QueryTrace[],
    private readonly reverseQueryResults: () => boolean,
  ) {}
  limit(value: number): this { this.maximum = value; return this; }
  orderBy(field: unknown, direction: string): this {
    this.orders.push({ field: typeof field === "string" ? field : "__name__", direction });
    return this;
  }
  select(...fields: string[]): this { this.selected = fields; return this; }
  startAfter(...values: unknown[]): this { this.after = values; return this; }
  async get(): Promise<Readonly<{ docs: readonly FakeSnapshot[] }>> {
    const prefix = `${this.queryPath}/`;
    const orderedValues = [...this.values.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes("/"))
      .map(([path, value]) => ({ id: path.slice(prefix.length), value }));
    const fieldValue = (entry: { id: string; value: StoredValue }, field: string): unknown =>
      field === "__name__" ? entry.id : entry.value[field];
    const compareValue = (left: unknown, right: unknown): number => {
      if (typeof left === "string" && typeof right === "string") return compareFirestoreText(left, right);
      if (typeof left === "number" && typeof right === "number") return Math.sign(left - right);
      return left === right ? 0 : left === undefined ? -1 : 1;
    };
    const compareEntry = (left: { id: string; value: StoredValue }, right: { id: string; value: StoredValue }): number => {
      for (const order of this.orders) {
        const comparison = compareValue(fieldValue(left, order.field), fieldValue(right, order.field));
        if (comparison !== 0) return order.direction === "desc" ? -comparison : comparison;
      }
      return 0;
    };
    const afterEntry = this.after === null ? null : {
      id: String(this.after.at(-1)),
      value: Object.fromEntries(this.orders.map((order, index) => [order.field, this.after![index]])),
    };
    this.queries.push({
      after: this.after,
      limit: this.maximum === Number.MAX_SAFE_INTEGER ? null : this.maximum,
      orders: [...this.orders],
      path: this.queryPath,
      selected: this.selected === null ? null : [...this.selected],
    });
    const docs = orderedValues
      .filter((entry) => afterEntry === null || compareEntry(entry, afterEntry) > 0)
      .sort(compareEntry)
      .slice(0, this.maximum)
      .map(({ id, value }) => new FakeSnapshot(id, this.selected === null
        ? value
        : Object.fromEntries(this.selected.flatMap((field) => value[field] === undefined ? [] : [[field, value[field]]]))));
    return { docs: this.reverseQueryResults() ? docs.reverse() : docs };
  }
}

class FakeCollectionReference extends FakeQuery {
  constructor(
    readonly path: string,
    private readonly storedValues: Map<string, StoredValue>,
    private readonly queryTraces: QueryTrace[],
    private readonly reverseResults: () => boolean,
  ) {
    super(path, storedValues, queryTraces, reverseResults);
  }
  doc(id: string): FakeDocumentReference {
    return new FakeDocumentReference(`${this.path}/${id}`, this.storedValues, this.queryTraces, this.reverseResults);
  }
}

class FakeFirestore {
  readonly queries: QueryTrace[] = [];
  reverseQueryResults = false;
  readonly values = new Map<string, StoredValue>();
  collection(name: string): FakeCollectionReference {
    return new FakeCollectionReference(name, this.values, this.queries, () => this.reverseQueryResults);
  }
  async runTransaction<T>(operation: (transaction: Readonly<{
    delete(reference: FakeDocumentReference): void;
    get(reference: FakeDocumentReference): Promise<FakeSnapshot>;
    set(reference: FakeDocumentReference, value: StoredValue): void;
  }>) => Promise<T>): Promise<T> {
    const pending = new Map(this.values);
    const result = await operation({
      delete: (reference) => { pending.delete(reference.path); },
      get: async (reference) => new FakeSnapshot(reference.path.split("/").at(-1)!, pending.get(reference.path)),
      set: (reference, value) => { pending.set(reference.path, structuredClone(value)); },
    });
    this.values.clear();
    for (const [path, value] of pending) this.values.set(path, value);
    return result;
  }
}

test("Firestore account store persists a small head and fixed record envelope at the normalized path", async () => {
  const firestore = new FakeFirestore();
  const store = new FirestoreAccountDatasetStore(firestore as never);
  const generationId = "a".repeat(64);
  const value = {
    id: "normalized-record",
    payload: { nested: { learner: "data" } },
    revision: 1,
    type: "reviewQueueEntry" as const,
  };
  const record = { ...value, fingerprint: computeRecordFingerprint(value) };
  const document = createPersistedAccountRecordDocument(record);
  const head: AccountDatasetHead = {
    accountRevision: 1,
    activeGeneration: generationId,
    manifest: {
      fingerprint: "b".repeat(64),
      recordCount: 1,
    },
    operationFingerprints: ["c".repeat(64)],
  };

  await store.runTransaction("uid-normalized", async (transaction) => {
    assert.equal(await transaction.readHead(), undefined);
    assert.equal(await transaction.readRecord(generationId, document.keyHash), undefined);
    transaction.putRecord(generationId, document.keyHash, document);
    transaction.writeHead(head);
  });

  const headPath = "accounts/uid-normalized";
  const recordPath = `${headPath}/generations/${generationId}/records/${computeAccountRecordKeyHash(record.type, record.id)}`;
  assert.deepEqual(Object.keys(firestore.values.get(headPath)!).sort(), [
    "accountRevision",
    "activeGeneration",
    "manifest",
    "operationFingerprints",
  ]);
  assert.equal(Object.hasOwn(firestore.values.get(headPath)!, "dataset"), false);
  assert.deepEqual(Object.keys(firestore.values.get(recordPath)!).sort(), [
    "canonicalByteLength",
    "canonicalBytes",
    "fingerprint",
    "id",
    "keyHash",
    "revision",
    "type",
  ]);
  assert.equal(Object.hasOwn(firestore.values.get(recordPath)!, "payload"), false);
  assert.deepEqual(await store.readHead("uid-normalized"), head);
  const page = await store.readRecordPage("uid-normalized", generationId, undefined, 100);
  assert.equal(page.length, 1);
  assert.equal(page[0]?.documentId, document.keyHash);
  assert.deepEqual({ ...page[0]?.value, canonicalBytes: undefined }, { ...document, canonicalBytes: undefined });
  assert.ok(Buffer.from(page[0]!.value.canonicalBytes).equals(Buffer.from(document.canonicalBytes)));

  firestore.values.set("accounts/uid-old-shape", {
    accountRevision: 0,
    dataset: { records: [] },
    operationIds: [],
  });
  await assert.rejects(store.readHead("uid-old-shape"), /corrupt_account_dataset_head/u);
});

const makeRecord = (id: string, value: string) => {
  const semantic = {
    id,
    payload: { value },
    revision: 1,
    type: "reviewQueueEntry" as const,
  };
  return { ...semantic, fingerprint: computeRecordFingerprint(semantic) };
};

test("Firestore account store uses the exact semantic descriptor query, UTF-8 order, and tuple cursor", async () => {
  const firestore = new FakeFirestore();
  const store = new FirestoreAccountDatasetStore(firestore as never);
  const generationId = "d".repeat(64);
  const documents = [makeRecord("😀", "emoji"), makeRecord("B", "ascii"), makeRecord("\uE000", "private")]
    .map(createPersistedAccountRecordDocument);
  for (const document of documents) {
    firestore.values.set(`accounts/uid-semantic/generations/${generationId}/records/${document.keyHash}`, document);
  }

  const first = await store.readRecordDescriptorPage("uid-semantic", generationId, null, 1);
  assert.deepEqual(first.map((entry) => entry.id), ["B"]);
  const cursor = {
    documentId: first[0]!.documentId,
    id: first[0]!.id,
    type: first[0]!.type,
  };
  const second = await store.readRecordDescriptorPage("uid-semantic", generationId, cursor, 2);
  assert.deepEqual(second.map((entry) => entry.id), ["\uE000", "😀"]);
  assert.deepEqual(firestore.queries.map(({ path, selected, orders, after, limit }) => ({ path, selected, orders, after, limit })), [
    {
      path: `accounts/uid-semantic/generations/${generationId}/records`,
      selected: ["canonicalByteLength", "fingerprint", "id", "revision", "type"],
      orders: [
        { field: "type", direction: "asc" },
        { field: "id", direction: "asc" },
        { field: "__name__", direction: "asc" },
      ],
      after: null,
      limit: 1,
    },
    {
      path: `accounts/uid-semantic/generations/${generationId}/records`,
      selected: ["canonicalByteLength", "fingerprint", "id", "revision", "type"],
      orders: [
        { field: "type", direction: "asc" },
        { field: "id", direction: "asc" },
        { field: "__name__", direction: "asc" },
      ],
      after: [cursor.type, cursor.id, cursor.documentId],
      limit: 2,
    },
  ]);

  await assert.rejects(store.readRecordDescriptorPage("uid-semantic", generationId, {
    ...cursor,
    documentId: "f".repeat(64),
  }, 1), /invalid_account_record_cursor/u);
  await assert.rejects(store.readRecordDescriptorPage("uid-semantic", generationId, null, 0), /invalid_account_record_page_limit/u);
  await assert.rejects(store.readRecordDescriptorPage("uid-semantic", generationId, null, 101), /invalid_account_record_page_limit/u);
  firestore.reverseQueryResults = true;
  await assert.rejects(
    store.readRecordDescriptorPage("uid-semantic", generationId, null, 3),
    /corrupt_account_record_descriptor_page/u,
  );
});

test("Firestore account store uses a document-ID physical projection that includes semantically unindexed leaves", async () => {
  const firestore = new FakeFirestore();
  const store = new FirestoreAccountDatasetStore(firestore as never);
  const generationId = "9".repeat(64);
  const firstId = "1".repeat(64);
  const hiddenId = "2".repeat(64);
  firestore.values.set(`accounts/uid-physical/generations/${generationId}/records/${firstId}`, { canonicalByteLength: 17 });
  firestore.values.set(`accounts/uid-physical/generations/${generationId}/records/${hiddenId}`, { canonicalByteLength: 23 });
  assert.deepEqual(await store.readRecordPhysicalDescriptorPage("uid-physical", generationId, null, 21), [
    { canonicalByteLength: 17, documentId: firstId },
    { canonicalByteLength: 23, documentId: hiddenId },
  ]);
  assert.deepEqual(await store.readRecordPhysicalDescriptorPage("uid-physical", generationId, firstId, 21), [
    { canonicalByteLength: 23, documentId: hiddenId },
  ]);
  assert.deepEqual(firestore.queries.slice(-2).map(({ selected, orders, after, limit }) => ({ selected, orders, after, limit })), [
    { selected: ["canonicalByteLength"], orders: [{ field: "__name__", direction: "asc" }], after: null, limit: 21 },
    { selected: ["canonicalByteLength"], orders: [{ field: "__name__", direction: "asc" }], after: [firstId], limit: 21 },
  ]);
});

test("Firestore account store persists and pages the one account-owned adoption operation tree", async () => {
  const firestore = new FakeFirestore();
  const store = new FirestoreAccountDatasetStore(firestore as never);
  const adoptionId = "a".repeat(64);
  const stepNumber = 1;
  const stepToken = computeCanonicalSha256({ adoptionId, kind: "adoptionStep", stage: "cancelled", stepNumber });
  const operation: AdoptionOperation = {
    version: 1,
    stage: "cancelled",
    adoptionId,
    result: "cancelled",
    stepNumber,
    stepToken,
    lastAdvance: {
      expectedStepToken: computeCanonicalSha256({ adoptionId, kind: "adoptionStep", stage: "discarding", stepNumber: 0 }),
      receipt: { adoptionId, result: "advanced", stage: "cancelled", stepToken },
    },
  };
  const firstSequence = adoptionSequenceId(0);
  const secondSequence = adoptionSequenceId(1);
  const firstLocal: AdoptionLocalRecordDocument = {
    record: createPersistedAccountRecordDocument(makeRecord("local-B", "first")),
    sequenceId: firstSequence,
  };
  const secondLocal: AdoptionLocalRecordDocument = {
    record: createPersistedAccountRecordDocument(makeRecord("local-ä", "second")),
    sequenceId: secondSequence,
  };
  const conflict: AdoptionConflictDocument = {
    conflict: { code: "revision_conflict", recordId: "local-B", recordType: "reviewQueueEntry" },
    sequenceId: firstSequence,
  };

  await store.runTransaction("uid-adoption", async (transaction) => {
    assert.equal(await transaction.readAdoptionOperation(), undefined);
    assert.equal(await transaction.readAdoptionLocalRecord(firstSequence), undefined);
    assert.equal(await transaction.readAdoptionConflict(firstSequence), undefined);
    transaction.writeAdoptionOperation(operation);
    transaction.putAdoptionLocalRecord(secondLocal);
    transaction.putAdoptionLocalRecord(firstLocal);
    transaction.putAdoptionConflict(conflict);
  });

  assert.deepEqual(await store.readAdoptionOperation("uid-adoption"), operation);
  assert.deepEqual((await store.readAdoptionLocalRecordPage("uid-adoption", null, 100)).map((entry) => entry.sequenceId), [
    firstSequence,
    secondSequence,
  ]);
  assert.deepEqual(await store.readAdoptionConflictPage("uid-adoption", null, 100), [conflict]);
  assert.deepEqual(await store.readOwnedDocumentIdPage("uid-adoption", "localRecords", null, 1), [firstSequence]);
  assert.deepEqual(await store.readOwnedDocumentIdPage("uid-adoption", "localRecords", firstSequence, 100), [secondSequence]);
  assert.deepEqual(await store.readOwnedDocumentIdPage("uid-adoption", "conflicts", null, 100), [firstSequence]);

  const operationPath = "accounts/uid-adoption/adoptionOperations/current";
  assert.ok(firestore.values.has(operationPath));
  assert.ok(firestore.values.has(`${operationPath}/localRecords/${firstSequence}`));
  assert.ok(firestore.values.has(`${operationPath}/conflicts/${firstSequence}`));

  await store.runTransaction("uid-adoption", async (transaction) => {
    assert.deepEqual(await transaction.readAdoptionOperation(), operation);
    const storedLocal = await transaction.readAdoptionLocalRecord(firstSequence);
    assert.deepEqual(
      { ...storedLocal, record: { ...storedLocal?.record, canonicalBytes: undefined } },
      { ...firstLocal, record: { ...firstLocal.record, canonicalBytes: undefined } },
    );
    assert.ok(Buffer.from(storedLocal!.record.canonicalBytes).equals(Buffer.from(firstLocal.record.canonicalBytes)));
    assert.deepEqual(await transaction.readAdoptionConflict(firstSequence), conflict);
    transaction.deleteAdoptionLocalRecord(firstSequence);
    transaction.deleteAdoptionConflict(firstSequence);
  });
  assert.deepEqual((await store.readAdoptionLocalRecordPage("uid-adoption", null, 100)).map((entry) => entry.sequenceId), [secondSequence]);
  assert.deepEqual(await store.readAdoptionConflictPage("uid-adoption", null, 100), []);

  await assert.rejects(store.readAdoptionLocalRecordPage("uid-adoption", "1", 1), /invalid_adoption_sequence_id/u);
  await assert.rejects(store.readOwnedDocumentIdPage("uid-adoption", "conflicts", "9".repeat(16), 101), /invalid_account_record_page_limit/u);
});

test("Firestore account store exposes ID-only generation cleanup pages and rejects corrupt adoption documents", async () => {
  const firestore = new FakeFirestore();
  const store = new FirestoreAccountDatasetStore(firestore as never);
  const generationId = "e".repeat(64);
  const document = createPersistedAccountRecordDocument(makeRecord("cleanup", "value"));
  firestore.values.set(`accounts/uid-cleanup/generations/${generationId}/records/${document.keyHash}`, document);
  assert.deepEqual(await store.readOwnedDocumentIdPage("uid-cleanup", { generationId }, null, 1), [document.keyHash]);
  assert.deepEqual(firestore.queries.at(-1)?.selected, []);
  const corruptId = "7".repeat(64);
  firestore.values.set(`accounts/uid-cleanup/generations/${generationId}/records/${corruptId}`, { broken: true });
  await store.runTransaction("uid-cleanup", async (transaction) => {
    assert.equal(await transaction.readRecordExists(generationId, corruptId), true);
  });
  await assert.rejects(store.runTransaction("uid-cleanup", async (transaction) => {
    await transaction.readRecord(generationId, corruptId);
  }), /corrupt_account_record_document/u);

  const sequenceId = adoptionSequenceId(0);
  firestore.values.set(`accounts/uid-corrupt/adoptionOperations/current/localRecords/${sequenceId}`, {
    sequenceId: adoptionSequenceId(1),
    record: document,
  });
  await assert.rejects(store.readAdoptionLocalRecordPage("uid-corrupt", null, 1), /corrupt_adoption_local_record_page/u);
});

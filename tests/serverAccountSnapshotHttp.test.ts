import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import test from "node:test";

import {
  computeRecordFingerprint,
  fingerprintDataset,
  type AccountDataset,
  type AccountRecord,
} from "../server/src/accountData.js";
import {
  AccountDataService,
  computeAccountRecordKeyHash,
  createPersistedAccountRecordDocument,
  type AccountDatasetHead,
  type AccountDatasetStore,
  type AccountDatasetTransaction,
  type AccountRecordPageDocument,
  type AccountSnapshotPage,
  type AccountSnapshotPageInput,
  type PersistedAccountRecordDocument,
} from "../server/src/accountService.js";
import type { FirebaseIdTokenVerifier, VerifiedFirebaseIdToken } from "../server/src/authentication.js";
import {
  createAccountHttpHandler,
  MAX_SNAPSHOT_HTTP_BODY_BYTES,
  MAX_SNAPSHOT_HTTP_RESPONSE_BYTES,
  type AccountHttpDependencies,
  type AccountHttpService,
} from "../server/src/http.js";

const PROJECT_ID = "patternly-app-sandbox";
const UID = "snapshot-user";
const NOW_SECONDS = 1_785_700_000;
const GENERATION = "a".repeat(64);
const INITIAL_REQUEST: AccountSnapshotPageInput = {
  cursor: null,
  expectedAccountRevision: null,
  expectedDatasetFingerprint: null,
};

const claims: VerifiedFirebaseIdToken = {
  aud: PROJECT_ID,
  auth_time: NOW_SECONDS - 60,
  email_verified: true,
  exp: NOW_SECONDS + 3_600,
  iss: `https://securetoken.google.com/${PROJECT_ID}`,
  sub: UID,
  uid: UID,
};

const verifier = (verify: FirebaseIdTokenVerifier["verifyIdToken"] = async () => claims): FirebaseIdTokenVerifier => ({
  verifyIdToken: verify,
});

const makeRecord = (index: number, value = `value-${index}`): AccountRecord => {
  const input = {
    id: `snapshot-record-${String(index).padStart(3, "0")}`,
    payload: { value },
    revision: 1,
    type: "reviewQueueEntry" as const,
  };
  return { ...input, fingerprint: computeRecordFingerprint(input) };
};

const headFor = (records: readonly AccountRecord[], accountRevision = 1): AccountDatasetHead => ({
  accountRevision,
  activeGeneration: GENERATION,
  manifest: { fingerprint: fingerprintDataset({ records }), recordCount: records.length },
  operationFingerprints: [],
});

class SnapshotStore implements AccountDatasetStore {
  head: AccountDatasetHead | undefined;
  documents: AccountRecordPageDocument[] = [];
  headReads = 0;
  readonly pageReads: Array<Readonly<{ after: string | undefined; generationId: string; limit: number; uid: string }>> = [];
  headSequence: Array<AccountDatasetHead | undefined | Error> | undefined;
  pageOverride: ((after: string | undefined, limit: number) => readonly AccountRecordPageDocument[]) | undefined;

  constructor(records: readonly AccountRecord[] = [], accountRevision = 1) {
    if (records.length > 0) this.seed(records, accountRevision);
  }

  async readAdoptionConflictPage(): Promise<never[]> { return []; }
  async readAdoptionLocalRecordPage(): Promise<never[]> { return []; }
  async readAdoptionOperation(): Promise<undefined> { return undefined; }
  async readRecordDescriptorPage(): Promise<never[]> { return []; }
  async readRecordPhysicalDescriptorPage(): Promise<never[]> { return []; }
  async readOwnedDocumentIdPage(): Promise<never[]> { return []; }

  seed(records: readonly AccountRecord[], accountRevision = 1): void {
    this.head = headFor(records, accountRevision);
    this.documents = records
      .map((record) => {
        const value = createPersistedAccountRecordDocument(record);
        return { documentId: value.keyHash, value };
      })
      .sort((left, right) => left.documentId.localeCompare(right.documentId));
  }

  async readHead(): Promise<AccountDatasetHead | undefined> {
    this.headReads += 1;
    const selected = this.headSequence?.shift();
    if (selected instanceof Error) throw selected;
    const value = selected ?? this.head;
    return value === undefined ? undefined : structuredClone(value);
  }

  async readRecordPage(
    uid: string,
    generationId: string,
    after: string | undefined,
    limit: number,
  ): Promise<readonly AccountRecordPageDocument[]> {
    this.pageReads.push({ after, generationId, limit, uid });
    if (this.pageOverride) return this.pageOverride(after, limit);
    return this.documents
      .filter((document) => after === undefined || document.documentId > after)
      .slice(0, limit)
      .map((document) => structuredClone(document));
  }

  async runTransaction<T>(_uid: string, _operation: (transaction: AccountDatasetTransaction) => Promise<T>): Promise<T> {
    throw new Error("unexpected_snapshot_transaction");
  }
}

type HttpResult = Readonly<{
  body: Buffer;
  headers: import("node:http").IncomingHttpHeaders;
  status: number;
}>;

const sendRequest = (
  port: number,
  body: Buffer | string | readonly Buffer[],
  headers: Readonly<Record<string, string>> = {
    authorization: "Bearer snapshot-token",
    "content-type": "application/json",
  },
): Promise<HttpResult> => new Promise((resolvePromise, rejectPromise) => {
  const outgoing = request({
    headers,
    host: "127.0.0.1",
    method: "POST",
    path: "/v1/account/snapshot/page",
    port,
  }, (incoming) => {
    const chunks: Buffer[] = [];
    incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
    incoming.once("end", () => resolvePromise({
      body: Buffer.concat(chunks),
      headers: incoming.headers,
      status: incoming.statusCode ?? 0,
    }));
  });
  outgoing.once("error", rejectPromise);
  if (Array.isArray(body)) {
    for (const chunk of body) outgoing.write(chunk);
    outgoing.end();
  } else {
    outgoing.end(body);
  }
});

const withServer = async (service: AccountHttpService, operation: (port: number) => Promise<void>, tokenVerifier = verifier()): Promise<void> => {
  const dependencies: AccountHttpDependencies = {
    expectedProjectId: PROJECT_ID,
    nowSeconds: () => NOW_SECONDS,
    service,
    verifier: tokenVerifier,
  };
  const server = createServer(createAccountHttpHandler(dependencies));
  await new Promise<void>((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    await operation(address.port);
  } finally {
    await new Promise<void>((resolvePromise, rejectPromise) => server.close((error) => {
      if (error) rejectPromise(error);
      else resolvePromise();
    }));
  }
};

const asHttpService = (
  readSnapshotPage: AccountHttpService["readSnapshotPage"],
): AccountHttpService => ({
  advanceAdoption: async () => { throw new Error("unexpected_adoption_advance_call"); },
  applySync: async () => { throw new Error("unexpected_sync_call"); },
  cancelAdoption: async () => { throw new Error("unexpected_adoption_cancel_call"); },
  confirmAdoptionOperation: async () => { throw new Error("unexpected_adoption_confirm_call"); },
  readAdoptionPreviewPage: async () => { throw new Error("unexpected_adoption_preview_call"); },
  readSnapshotPage,
  startAdoption: async () => { throw new Error("unexpected_adoption_start_call"); },
  uploadAdoptionPage: async () => { throw new Error("unexpected_adoption_upload_call"); },
});

const parseJson = (result: HttpResult): Record<string, unknown> => JSON.parse(result.body.toString("utf8")) as Record<string, unknown>;

test("service returns canonical empty and bounded populated pages with exact store calls", async () => {
  const absent = new SnapshotStore();
  const emptyPage = await new AccountDataService(absent).readSnapshotPage(UID, INITIAL_REQUEST);
  assert.deepEqual(emptyPage, {
    accountRevision: 0,
    datasetFingerprint: fingerprintDataset({ records: [] }),
    entries: [],
    recordCount: 0,
  });
  assert.equal(absent.headReads, 2);
  assert.equal(absent.pageReads.length, 0);

  const records = Array.from({ length: 22 }, (_, index) => makeRecord(index));
  const store = new SnapshotStore(records, 7);
  const service = new AccountDataService(store);
  const first = await service.readSnapshotPage(UID, INITIAL_REQUEST);
  assert.equal(first.entries.length, 21);
  assert.equal(first.accountRevision, 7);
  assert.equal(first.recordCount, 22);
  assert.equal(first.datasetFingerprint, fingerprintDataset({ records }));
  assert.deepEqual(Object.keys(first).sort(), ["accountRevision", "datasetFingerprint", "entries", "recordCount"]);
  assert.ok(first.entries.every((entry) => Object.keys(entry).sort().join(":") === "cursor:record"));
  assert.deepEqual(store.pageReads, [{ after: undefined, generationId: GENERATION, limit: 21, uid: UID }]);
  assert.equal(store.headReads, 2);

  const repeated = await service.readSnapshotPage(UID, {
    cursor: null,
    expectedAccountRevision: first.accountRevision,
    expectedDatasetFingerprint: first.datasetFingerprint,
  });
  assert.deepEqual(repeated, first);
  assert.equal(store.headReads, 4);
  assert.equal(store.pageReads.length, 2);

  const nearMaximum = makeRecord(999, "n".repeat(511 * 1024));
  const nearMaximumDocument = createPersistedAccountRecordDocument(nearMaximum);
  assert.ok(nearMaximumDocument.canonicalBytes.length > 511 * 1024);
  const nearMaximumPage = await new AccountDataService(new SnapshotStore([nearMaximum], 1))
    .readSnapshotPage(UID, INITIAL_REQUEST);
  assert.deepEqual(nearMaximumPage.entries.map((entry) => entry.record), [nearMaximum]);
});

test("service distinguishes stale binding and bounded races while rejecting corrupt pages", async () => {
  const records = Array.from({ length: 22 }, (_, index) => makeRecord(index));
  const stale = new SnapshotStore(records, 2);
  await assert.rejects(new AccountDataService(stale).readSnapshotPage(UID, {
    cursor: null,
    expectedAccountRevision: 1,
    expectedDatasetFingerprint: fingerprintDataset({ records }),
  }), /snapshot_changed/u);
  assert.equal(stale.headReads, 1);
  assert.equal(stale.pageReads.length, 0);

  const boundRace = new SnapshotStore(records, 2);
  const changed = headFor(records, 3);
  boundRace.headSequence = [boundRace.head, changed];
  await assert.rejects(new AccountDataService(boundRace).readSnapshotPage(UID, {
    cursor: null,
    expectedAccountRevision: 2,
    expectedDatasetFingerprint: fingerprintDataset({ records }),
  }), /snapshot_changed/u);
  assert.equal(boundRace.headReads, 2);
  assert.equal(boundRace.pageReads.length, 1);

  const racing = new SnapshotStore(records, 2);
  const headTwo = racing.head!;
  const headThree = headFor(records, 3);
  racing.headSequence = [headTwo, headThree, headThree, headTwo, headTwo, headThree];
  await assert.rejects(
    new AccountDataService(racing).readSnapshotPage(UID, INITIAL_REQUEST),
    /account_snapshot_changed_retryable/u,
  );
  assert.equal(racing.headReads, 6);
  assert.equal(racing.pageReads.length, 3);
  assert.ok(racing.pageReads.every((read) => read.limit === 21));

  const reversed = new SnapshotStore(records, 2);
  reversed.pageOverride = (_after, limit) => [...reversed.documents].reverse().slice(0, limit);
  await assert.rejects(new AccountDataService(reversed).readSnapshotPage(UID, INITIAL_REQUEST), /corrupt_account_record_page/u);

  const corrupt = new SnapshotStore(records, 2);
  corrupt.documents[0] = {
    ...corrupt.documents[0]!,
    value: { ...corrupt.documents[0]!.value, fingerprint: "0".repeat(64) },
  };
  await assert.rejects(new AccountDataService(corrupt).readSnapshotPage(UID, INITIAL_REQUEST), /corrupt_account_record_document/u);

  const corruptManifest = new SnapshotStore(records, 2);
  corruptManifest.head = { ...corruptManifest.head!, manifest: { fingerprint: "invalid", recordCount: records.length } };
  await assert.rejects(new AccountDataService(corruptManifest).readSnapshotPage(UID, INITIAL_REQUEST), /corrupt_account_dataset_head/u);

  const codedProviderError = Object.assign(new Error("snapshot_changed"), { code: 14 });
  const provider = new SnapshotStore(records, 2);
  provider.headSequence = [codedProviderError];
  await assert.rejects(
    new AccountDataService(provider).readSnapshotPage(UID, INITIAL_REQUEST),
    (error: unknown) => error === codedProviderError,
  );
});

test("HTTP authenticates first and enforces exact snapshot input plus the 4-KiB raw limit", async () => {
  let verifierCalls = 0;
  let serviceCalls = 0;
  const service = asHttpService(async (_uid, input) => {
    serviceCalls += 1;
    assert.deepEqual(input, INITIAL_REQUEST);
    return {
      accountRevision: 0,
      datasetFingerprint: fingerprintDataset({ records: [] }),
      entries: [],
      recordCount: 0,
    };
  });
  await withServer(service, async (port) => {
    const unauthenticated = await sendRequest(port, Buffer.alloc(MAX_SNAPSHOT_HTTP_BODY_BYTES + 1, 0x20), {
      "content-type": "application/json",
    });
    assert.equal(unauthenticated.status, 401);
    assert.equal(serviceCalls, 0);

    const base = Buffer.from(JSON.stringify(INITIAL_REQUEST));
    for (const size of [MAX_SNAPSHOT_HTTP_BODY_BYTES - 1, MAX_SNAPSHOT_HTTP_BODY_BYTES]) {
      const body = Buffer.concat([base, Buffer.alloc(size - base.length, 0x20)], size);
      const result = await sendRequest(port, [body.subarray(0, 2_047), body.subarray(2_047)]);
      assert.equal(result.status, 200, String(size));
      assert.equal(Number(result.headers["content-length"]), result.body.length);
      assert.deepEqual(Object.keys(parseJson(result)).sort(), [
        "accountRevision",
        "datasetFingerprint",
        "nextCursor",
        "recordCount",
        "records",
      ]);
    }
    const oversizedBody = Buffer.concat([
      base,
      Buffer.alloc(MAX_SNAPSHOT_HTTP_BODY_BYTES + 1 - base.length, 0x20),
    ]);
    const oversized = await sendRequest(port, [
      oversizedBody.subarray(0, 2_047),
      oversizedBody.subarray(2_047),
    ]);
    assert.equal(oversized.status, 413);

    for (const invalid of [
      { ...INITIAL_REQUEST, uid: "caller-selected" },
      { cursor: null, expectedAccountRevision: 0, expectedDatasetFingerprint: null },
      { cursor: "g".repeat(64), expectedAccountRevision: 0, expectedDatasetFingerprint: "0".repeat(64) },
      { cursor: "0".repeat(64), expectedAccountRevision: null, expectedDatasetFingerprint: null },
    ]) {
      const result = await sendRequest(port, JSON.stringify(invalid));
      assert.equal(result.status, 400);
    }
  }, verifier(async () => { verifierCalls += 1; return claims; }));
  assert.equal(verifierCalls, 7);
  assert.equal(serviceCalls, 2);
});

const cursorFor = (index: number): string => (index + 1).toString(16).padStart(64, "0");

const sizedPage = (targetBytes: number): AccountSnapshotPage => {
  const make = (index: number, length: number): AccountRecord => makeRecord(index, "x".repeat(length));
  let records = Array.from({ length: 4 }, (_, index) => make(index, 0));
  const encode = (selected: readonly AccountRecord[]) => Buffer.from(JSON.stringify({
    accountRevision: 9,
    datasetFingerprint: "f".repeat(64),
    recordCount: 4,
    records: selected,
    nextCursor: null,
  }));
  let remaining = targetBytes - encode(records).length;
  assert.ok(remaining > 0);
  const lengths = [0, 0, 0, 0];
  for (let index = 0; index < lengths.length; index += 1) {
    const share = Math.floor(remaining / (lengths.length - index));
    lengths[index] = share;
    remaining -= share;
  }
  records = lengths.map((length, index) => make(index, length));
  assert.equal(encode(records).length, targetBytes);
  assert.ok(records.every((record) => createPersistedAccountRecordDocument(record).canonicalBytes.length <= 512 * 1024));
  assert.ok(records.some((record) => createPersistedAccountRecordDocument(record).canonicalBytes.length > 511 * 1024));
  return {
    accountRevision: 9,
    datasetFingerprint: "f".repeat(64),
    entries: records.map((record, index) => ({ cursor: cursorFor(index), record })),
    recordCount: 4,
  };
};

test("HTTP selects the exact two-MiB minus/equal prefix and defers the plus-one record", async () => {
  for (const target of [
    MAX_SNAPSHOT_HTTP_RESPONSE_BYTES - 1,
    MAX_SNAPSHOT_HTTP_RESPONSE_BYTES,
    MAX_SNAPSHOT_HTTP_RESPONSE_BYTES + 1,
  ]) {
    const page = sizedPage(target);
    await withServer(asHttpService(async () => page), async (port) => {
      const result = await sendRequest(port, JSON.stringify(INITIAL_REQUEST));
      assert.equal(result.status, 200);
      assert.ok(result.body.length <= MAX_SNAPSHOT_HTTP_RESPONSE_BYTES);
      assert.equal(Number(result.headers["content-length"]), result.body.length);
      const body = parseJson(result);
      const records = body.records as readonly unknown[];
      if (target <= MAX_SNAPSHOT_HTTP_RESPONSE_BYTES) {
        assert.equal(result.body.length, target);
        assert.equal(records.length, 4);
        assert.equal(body.nextCursor, null);
      } else {
        assert.equal(records.length, 3);
        assert.equal(body.nextCursor, cursorFor(2));
      }
    });
  }
});

test("HTTP uses the 21st document for continuation and reassembles a full stable snapshot", async () => {
  const records = Array.from({ length: 45 }, (_, index) => makeRecord(index));
  const store = new SnapshotStore(records, 11);
  const service = new AccountDataService(store);
  await withServer(service, async (port) => {
    let requestBody: AccountSnapshotPageInput = INITIAL_REQUEST;
    const assembled: AccountRecord[] = [];
    const bodies: Buffer[] = [];
    let declaredFingerprint: string | undefined;
    let declaredCount: number | undefined;
    while (true) {
      const result = await sendRequest(port, JSON.stringify(requestBody));
      assert.equal(result.status, 200);
      bodies.push(result.body);
      const body = parseJson(result);
      assert.deepEqual(Object.keys(body).sort(), ["accountRevision", "datasetFingerprint", "nextCursor", "recordCount", "records"]);
      assert.equal(Object.hasOwn(body, "activeGeneration"), false);
      assert.equal(Object.hasOwn(body, "operationFingerprints"), false);
      const pageRecords = body.records as AccountRecord[];
      assert.ok(pageRecords.length <= 20);
      assembled.push(...pageRecords);
      declaredFingerprint = String(body.datasetFingerprint);
      declaredCount = Number(body.recordCount);
      if (body.nextCursor === null) break;
      requestBody = {
        cursor: String(body.nextCursor),
        expectedAccountRevision: Number(body.accountRevision),
        expectedDatasetFingerprint: declaredFingerprint,
      };
    }
    assert.equal(assembled.length, declaredCount);
    assert.equal(fingerprintDataset({ records: assembled }), declaredFingerprint);
    assert.equal((parseJson({ body: bodies[0]!, headers: {}, status: 200 }).records as unknown[]).length, 20);
    assert.equal(
      parseJson({ body: bodies[0]!, headers: {}, status: 200 }).nextCursor,
      store.documents[19]!.documentId,
    );

    const repeated = await sendRequest(port, JSON.stringify({
      cursor: null,
      expectedAccountRevision: 11,
      expectedDatasetFingerprint: declaredFingerprint,
    }));
    assert.ok(repeated.body.equals(bodies[0]!));

    const invented = await sendRequest(port, JSON.stringify({
      cursor: "f".repeat(64),
      expectedAccountRevision: 11,
      expectedDatasetFingerprint: declaredFingerprint,
    }));
    assert.equal(invented.status, 200);
    const inventedBody = parseJson(invented);
    assert.equal((inventedBody.records as unknown[]).length, 0);
    assert.equal(inventedBody.nextCursor, null);
    assert.notEqual((inventedBody.records as unknown[]).length, inventedBody.recordCount);
    assert.notEqual(fingerprintDataset({ records: inventedBody.records as AccountRecord[] }), inventedBody.datasetFingerprint);
  });
  assert.ok(store.pageReads.every((read) => read.limit === 21));
});

test("snapshot HTTP maps only uncoded snapshot conflicts and retryable races while hiding corruption and coded providers", async () => {
  const cases = [
    { error: new Error("snapshot_changed"), status: 409, code: "snapshot_changed" },
    { error: new Error("account_snapshot_changed_retryable"), status: 503, code: "account_data_retryable" },
    { error: new Error("stale_account_revision"), status: 500, code: "internal_error" },
    { error: new Error("corrupt_account_record_document:private"), status: 500, code: "internal_error" },
    { error: Object.assign(new Error("snapshot_changed"), { code: 14 }), status: 500, code: "internal_error" },
  ] as const;
  const logged: unknown[] = [];
  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...values: unknown[]) => { logged.push(values); };
  console.log = (...values: unknown[]) => { logged.push(values); };
  try {
    for (const entry of cases) {
      await withServer(asHttpService(async () => { throw entry.error; }), async (port) => {
        const result = await sendRequest(port, JSON.stringify(INITIAL_REQUEST));
        assert.equal(result.status, entry.status);
        assert.deepEqual(parseJson(result), { error: { code: entry.code } });
        assert.equal(result.body.includes(Buffer.from("private")), false);
        assert.equal(result.body.includes(Buffer.from("14")), false);
      });
    }
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
  assert.deepEqual(logged, []);
});

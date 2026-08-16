import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer, request, type RequestListener } from "node:http";
import { resolve } from "node:path";
import test from "node:test";

import {
  computeRecordFingerprint,
  type AccountDataset,
  type AccountRecord,
} from "../server/src/accountData.js";
import {
  AccountDataService,
  computeSyncOperationFingerprint,
  type AccountDatasetHead,
  type AccountDatasetStore,
  type AccountDatasetTransaction,
  type AccountRecordPageDocument,
  type PersistedAccountRecordDocument,
  type SyncOperationSemanticInput,
} from "../server/src/accountService.js";
import type { FirebaseIdTokenVerifier, VerifiedFirebaseIdToken } from "../server/src/authentication.js";
import { loadServerEnvironment } from "../server/src/environment.js";
import {
  initializeFirebaseAdminAccountRuntime,
  type FirebaseAdminInitializationDependencies,
} from "../server/src/firebaseAdapters.js";
import {
  createAccountHttpHandler,
  MAX_SYNC_HTTP_BODY_BYTES,
  type AccountHttpDependencies,
  type AccountHttpService,
} from "../server/src/http.js";
import { startServer, type ServerStartupDependencies } from "../server/src/index.js";

const PROJECT_ID = "patternly-app-sandbox";
const APP_ID = "test-app-id";
const NOW_SECONDS = 1_785_700_000;
const UID = "verified-http-user";

const validClaims: VerifiedFirebaseIdToken = {
  aud: PROJECT_ID,
  auth_time: NOW_SECONDS - 60,
  email_verified: true,
  exp: NOW_SECONDS + 3_600,
  iss: `https://securetoken.google.com/${PROJECT_ID}`,
  sub: UID,
  uid: UID,
};

const verifier = (verify: FirebaseIdTokenVerifier["verifyIdToken"] = async () => validClaims): FirebaseIdTokenVerifier => ({
  verifyIdToken: verify,
});
const appCheckVerifier = { verifyToken: async () => ({ appId: APP_ID }) };
const lifecycle = { assertWritable: async () => undefined, writeDeletionIntent: async () => undefined };

const httpService = (
  applySync: (...parameters: Parameters<AccountHttpService["applySync"]>) => Promise<unknown>,
): AccountHttpService => ({
  advanceAdoption: async () => { throw new Error("unexpected_adoption_advance_call"); },
  applySync: async (...parameters) => {
    await applySync(...parameters);
    return { accountRevision: 0, dataset: { records: [] }, operationFingerprints: [] };
  },
  cancelAdoption: async () => { throw new Error("unexpected_adoption_cancel_call"); },
  confirmAdoptionOperation: async () => { throw new Error("unexpected_adoption_confirm_call"); },
  readAdoptionPreviewPage: async () => { throw new Error("unexpected_adoption_preview_call"); },
  readSnapshotPage: async () => { throw new Error("unexpected_snapshot_page_call"); },
  startAdoption: async () => { throw new Error("unexpected_adoption_start_call"); },
  uploadAdoptionPage: async () => { throw new Error("unexpected_adoption_upload_call"); },
});

const record = (id: string, value: string, revision: number): AccountRecord => {
  const input = { id, payload: { value }, revision, type: "reviewQueueEntry" as const };
  return { ...input, fingerprint: computeRecordFingerprint(input) };
};

const putSemantic = (expectedAccountRevision = 0, value = record("http-record", "created", 1)) => ({
  expectedAccountRevision,
  mutations: [{ expectedRecordRevision: expectedAccountRevision === 0 ? null : value.revision! - 1, kind: "put" as const, record: value }],
});

const requestBody = (semantic: SyncOperationSemanticInput): Readonly<Record<string, unknown>> => ({
  ...semantic,
  operationFingerprint: computeSyncOperationFingerprint(semantic),
});

type HttpResult = Readonly<{
  body: Buffer;
  headers: import("node:http").IncomingHttpHeaders;
  status: number;
}>;

const sendRequest = (
  port: number,
  options: Readonly<{
    body?: Buffer | string;
    chunks?: readonly Buffer[];
    headers?: Readonly<Record<string, string>>;
    method?: string;
    path?: string;
  }> = {},
): Promise<HttpResult> => new Promise((resolvePromise, rejectPromise) => {
  const outgoing = request({
    headers: options.headers,
    host: "127.0.0.1",
    method: options.method ?? "POST",
    path: options.path ?? "/v1/account/sync",
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
  for (const chunk of options.chunks ?? []) outgoing.write(chunk);
  outgoing.end(options.body);
});

const withLoopbackServer = async (
  dependencies: AccountHttpDependencies,
  operation: (port: number) => Promise<void>,
): Promise<void> => {
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

const jsonHeaders = (authorization = "Bearer valid-token"): Readonly<Record<string, string>> => ({
  authorization,
  "content-type": "application/json",
  "x-firebase-appcheck": "valid-app-check",
});

const parseJson = (result: HttpResult): unknown => JSON.parse(result.body.toString("utf8")) as unknown;

const assertProtectedJsonHeaders = (result: HttpResult): void => {
  assert.equal(result.headers["cache-control"], "no-store");
  assert.equal(result.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(result.headers["x-content-type-options"], "nosniff");
};

test("exposes only the exact account routes and their POST method", async () => {
  let verifierCalls = 0;
  let serviceCalls = 0;
  const dependencies: AccountHttpDependencies = {
    appCheckVerifier,
    lifecycle,
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    service: httpService(async () => { serviceCalls += 1; }),
    verifier: verifier(async () => { verifierCalls += 1; return validClaims; }),
  };
  await withLoopbackServer(dependencies, async (port) => {
    const missing = await sendRequest(port, { method: "GET", path: "/health" });
    assert.equal(missing.status, 404);
    assert.deepEqual(parseJson(missing), { error: { code: "not_found" } });
    assertProtectedJsonHeaders(missing);

    const method = await sendRequest(port, { method: "GET" });
    assert.equal(method.status, 405);
    assert.equal(method.headers.allow, "POST");
    assert.deepEqual(parseJson(method), { error: { code: "method_not_allowed" } });
    assertProtectedJsonHeaders(method);
  });
  assert.equal(verifierCalls, 0);
  assert.equal(serviceCalls, 0);
});

test("authenticates before entity parsing and routes only the verified UID", async () => {
  const routedUids: string[] = [];
  let verifierCalls = 0;
  const semantic = putSemantic();
  await withLoopbackServer({
    appCheckVerifier,
    lifecycle,
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    service: httpService(async (uid) => { routedUids.push(uid); }),
    verifier: verifier(async (_token, checkRevoked) => {
      verifierCalls += 1;
      assert.equal(checkRevoked, false);
      return validClaims;
    }),
  }, async (port) => {
    const unauthenticated = await sendRequest(port, {
      body: "not-json",
      headers: { "content-type": "text/plain" },
    });
    assert.equal(unauthenticated.status, 401);
    assert.deepEqual(parseJson(unauthenticated), { error: { code: "authentication_required" } });

    const selectedUid = await sendRequest(port, {
      body: JSON.stringify({ ...requestBody(semantic), uid: "caller-selected-user" }),
      headers: jsonHeaders(),
    });
    assert.equal(selectedUid.status, 400);
    assert.deepEqual(parseJson(selectedUid), { error: { code: "invalid_request" } });

    const accepted = await sendRequest(port, {
      body: JSON.stringify(requestBody(semantic)),
      headers: jsonHeaders(),
    });
    assert.equal(accepted.status, 200);
    assert.deepEqual(routedUids, [UID]);
    assert.deepEqual(parseJson(accepted), {
      committedAccountRevision: 1,
      operationFingerprint: computeSyncOperationFingerprint(semantic),
      result: "synchronized",
    });
    assert.deepEqual(Object.keys(parseJson(accepted) as object).sort(), [
      "committedAccountRevision",
      "operationFingerprint",
      "result",
    ]);
    assertProtectedJsonHeaders(accepted);
  });
  assert.equal(verifierCalls, 2);
});

test("rejects a tombstoned account before reading the request body", async () => {
  let serviceCalls = 0;
  await withLoopbackServer({
    appCheckVerifier,
    lifecycle: { ...lifecycle, assertWritable: async () => { throw new Error("account_tombstoned"); } },
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    service: httpService(async () => { serviceCalls += 1; }),
    verifier: verifier(),
  }, async (port) => {
    const result = await sendRequest(port, {
      body: "not-json",
      headers: jsonHeaders(),
    });
    assert.equal(result.status, 410);
    assert.deepEqual(parseJson(result), { error: { code: "account_tombstoned" } });
  });
  assert.equal(serviceCalls, 0);
});

test("enforces the raw streamed four-MiB boundary at minus one, equal, and plus one byte", async () => {
  let serviceCalls = 0;
  const base = Buffer.from(JSON.stringify(requestBody(putSemantic())));
  const bodyAt = (size: number): Buffer => Buffer.concat([base, Buffer.alloc(size - base.length, 0x20)], size);
  const streamed = (body: Buffer): readonly Buffer[] => {
    const chunks: Buffer[] = [];
    for (let offset = 0; offset < body.length; offset += 65_537) chunks.push(body.subarray(offset, offset + 65_537));
    return chunks;
  };
  await withLoopbackServer({
    appCheckVerifier,
    lifecycle,
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    service: httpService(async () => { serviceCalls += 1; }),
    verifier: verifier(),
  }, async (port) => {
    for (const size of [MAX_SYNC_HTTP_BODY_BYTES - 1, MAX_SYNC_HTTP_BODY_BYTES]) {
      const result = await sendRequest(port, { chunks: streamed(bodyAt(size)), headers: jsonHeaders() });
      assert.equal(result.status, 200, String(size));
    }
    const oversized = await sendRequest(port, {
      chunks: streamed(bodyAt(MAX_SYNC_HTTP_BODY_BYTES + 1)),
      headers: jsonHeaders(),
    });
    assert.equal(oversized.status, 413);
    assert.deepEqual(parseJson(oversized), { error: { code: "request_too_large" } });
    assertProtectedJsonHeaders(oversized);

    const declared = await sendRequest(port, {
      headers: { ...jsonHeaders(), "content-length": String(MAX_SYNC_HTTP_BODY_BYTES + 1) },
    });
    assert.equal(declared.status, 413);
    assert.deepEqual(parseJson(declared), { error: { code: "request_too_large" } });
  });
  assert.equal(serviceCalls, 2);
});

test("rejects unsupported entity forms, fatal UTF-8, BOM, malformed JSON and invalid exact input before service", async () => {
  let serviceCalls = 0;
  const valid = requestBody(putSemantic());
  const duplicateRecord = record("duplicate-http-record", "same", 1);
  const cases = [
    { body: JSON.stringify(valid), headers: { authorization: "Bearer valid-token", "content-type": "text/json", "x-firebase-appcheck": "valid-app-check" }, status: 415, code: "unsupported_media_type" },
    { body: JSON.stringify(valid), headers: { ...jsonHeaders(), "content-encoding": "gzip" }, status: 415, code: "unsupported_content_encoding" },
    { body: Buffer.from([0xc3, 0x28]), headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(JSON.stringify(valid))]), headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: "", headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: "{", headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: "[]", headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: JSON.stringify({ ...valid, extra: true }), headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: JSON.stringify({ ...valid, operationFingerprint: "0".repeat(64) }), headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: JSON.stringify({ ...valid, mutations: [{ kind: "unknown" }] }), headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: JSON.stringify({ ...valid, expectedAccountRevision: -1 }), headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: JSON.stringify({
      ...valid,
      mutations: [
        { expectedRecordRevision: null, kind: "put", record: duplicateRecord },
        { expectedRecordRevision: null, kind: "put", record: duplicateRecord },
      ],
    }), headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: JSON.stringify({
      ...valid,
      mutations: [{
        expectedFingerprint: "0".repeat(64),
        expectedRecordRevision: 1,
        id: "immutable-delete",
        kind: "delete",
        type: "trainingAttempt",
      }],
    }), headers: jsonHeaders(), status: 400, code: "invalid_request" },
    { body: JSON.stringify({
      ...valid,
      mutations: [{
        expectedRecordRevision: null,
        kind: "put",
        record: { ...record("bad-fingerprint", "value", 1), fingerprint: "0".repeat(64) },
      }],
    }), headers: jsonHeaders(), status: 400, code: "invalid_request" },
  ] as const;
  await withLoopbackServer({
    appCheckVerifier,
    lifecycle,
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    service: httpService(async () => { serviceCalls += 1; }),
    verifier: verifier(),
  }, async (port) => {
    for (const [index, entry] of cases.entries()) {
      const result = await sendRequest(port, { body: entry.body, headers: entry.headers });
      assert.equal(result.status, entry.status, String(index));
      assert.deepEqual(parseJson(result), { error: { code: entry.code } }, String(index));
      assertProtectedJsonHeaders(result);
    }
  });
  assert.equal(serviceCalls, 0);
});

test("maps every authentication row without allowing service access", async () => {
  const localCases = [
    { claims: { ...validClaims, exp: NOW_SECONDS }, status: 401, code: "id_token_expired" },
    { claims: { ...validClaims, aud: "wrong-project" }, status: 401, code: "invalid_id_token" },
    { claims: { ...validClaims, iss: "https://issuer.invalid" }, status: 401, code: "invalid_id_token" },
    { claims: { ...validClaims, sub: "wrong-subject" }, status: 401, code: "invalid_id_token" },
    { claims: { ...validClaims, email_verified: false }, status: 403, code: "identity_unverified" },
  ] as const;
  const providerCases = [
    { error: { code: "auth/id-token-expired" }, status: 401, code: "id_token_expired" },
    { error: { code: "auth/id-token-revoked" }, status: 401, code: "id_token_revoked" },
    { error: { code: "auth/argument-error" }, status: 401, code: "invalid_id_token" },
    { error: { code: "auth/invalid-id-token" }, status: 401, code: "invalid_id_token" },
    { error: new Error("recent_authentication_required"), status: 403, code: "authorization_required" },
    { error: { code: "auth/provider-outage", message: "provider secret" }, status: 500, code: "internal_error" },
  ] as const;
  let serviceCalls = 0;
  const payload = JSON.stringify(requestBody(putSemantic()));
  for (const malformed of [undefined, "Token invalid"]) {
    await withLoopbackServer({
      appCheckVerifier,
      lifecycle,
      expectedProjectId: PROJECT_ID,
      expectedAppCheckAppIds: [APP_ID],
      nowSeconds: () => NOW_SECONDS,
      service: httpService(async () => { serviceCalls += 1; }),
      verifier: verifier(),
    }, async (port) => {
      const headers = malformed === undefined ? { "content-type": "application/json" } : jsonHeaders(malformed);
      const result = await sendRequest(port, { body: payload, headers });
      assert.equal(result.status, 401);
      assert.deepEqual(parseJson(result), { error: { code: "authentication_required" } });
    });
  }
  for (const entry of localCases) {
    await withLoopbackServer({
      appCheckVerifier,
      lifecycle,
      expectedProjectId: PROJECT_ID,
      expectedAppCheckAppIds: [APP_ID],
      nowSeconds: () => NOW_SECONDS,
      service: httpService(async () => { serviceCalls += 1; }),
      verifier: verifier(async () => entry.claims),
    }, async (port) => {
      const result = await sendRequest(port, { body: payload, headers: jsonHeaders() });
      assert.equal(result.status, entry.status);
      assert.deepEqual(parseJson(result), { error: { code: entry.code } });
    });
  }
  for (const entry of providerCases) {
    await withLoopbackServer({
      appCheckVerifier,
      lifecycle,
      expectedProjectId: PROJECT_ID,
      expectedAppCheckAppIds: [APP_ID],
      nowSeconds: () => NOW_SECONDS,
      service: httpService(async () => { serviceCalls += 1; }),
      verifier: verifier(async () => { throw entry.error; }),
    }, async (port) => {
      const result = await sendRequest(port, { body: payload, headers: jsonHeaders() });
      assert.equal(result.status, entry.status);
      assert.deepEqual(parseJson(result), { error: { code: entry.code } });
      assert.equal(result.body.includes(Buffer.from("provider secret")), false);
    });
  }
  assert.equal(serviceCalls, 0);
});

test("an unknown coded Auth error cannot borrow the local expired-token message", async () => {
  const rawCode = "auth/provider-outage";
  const rawMessage = "expired_id_token";
  const providerError = Object.assign(new Error(rawMessage), { code: rawCode });
  let serviceCalls = 0;
  const logged: unknown[] = [];
  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...values: unknown[]) => { logged.push(values); };
  console.log = (...values: unknown[]) => { logged.push(values); };
  try {
    await withLoopbackServer({
      appCheckVerifier,
      lifecycle,
      expectedProjectId: PROJECT_ID,
      expectedAppCheckAppIds: [APP_ID],
      nowSeconds: () => NOW_SECONDS,
      service: httpService(async () => { serviceCalls += 1; }),
      verifier: verifier(async () => { throw providerError; }),
    }, async (port) => {
      const result = await sendRequest(port, {
        body: JSON.stringify(requestBody(putSemantic())),
        headers: jsonHeaders(),
      });
      assert.equal(result.status, 500);
      assert.deepEqual(parseJson(result), { error: { code: "internal_error" } });
      assert.equal(result.body.includes(Buffer.from(rawCode)), false);
      assert.equal(result.body.includes(Buffer.from(rawMessage)), false);
    });
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
  assert.equal(serviceCalls, 0);
  assert.deepEqual(logged, []);
});

test("keeps service error mapping closed, non-leaking, and phase-sensitive", async () => {
  const cases = [
    { message: "sync_operation_too_large", status: 413, code: "request_too_large" },
    { message: "stale_account_revision", status: 409, code: "stale_account_revision" },
    { message: "record_revision_conflict", status: 409, code: "record_revision_conflict" },
    { message: "immutable_integrity_conflict", status: 409, code: "immutable_integrity_conflict" },
    { message: "multiple_active_session_references", status: 409, code: "active_session_conflict" },
    { message: "account_snapshot_changed_retryable", status: 503, code: "account_data_retryable" },
    { message: "account_record_too_large", status: 500, code: "internal_error" },
    { message: "corrupt_account_dataset_head:secret", status: 500, code: "internal_error" },
    { message: "staged_record_collision", status: 500, code: "internal_error" },
    { message: "invalid_sync_operation", status: 500, code: "internal_error" },
  ] as const;
  const payload = JSON.stringify(requestBody(putSemantic()));
  const logged: unknown[] = [];
  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...values: unknown[]) => { logged.push(values); };
  console.log = (...values: unknown[]) => { logged.push(values); };
  try {
    for (const entry of cases) {
      const service = httpService(async () => { throw new Error(entry.message); });
      await withLoopbackServer({
        appCheckVerifier,
        lifecycle,
        expectedProjectId: PROJECT_ID,
        expectedAppCheckAppIds: [APP_ID],
        nowSeconds: () => NOW_SECONDS,
        service,
        verifier: verifier(),
      }, async (port) => {
        const result = await sendRequest(port, { body: payload, headers: jsonHeaders() });
        assert.equal(result.status, entry.status, entry.message);
        assert.deepEqual(parseJson(result), { error: { code: entry.code } }, entry.message);
        assert.equal(result.body.includes(Buffer.from(entry.message)), entry.message === entry.code);
      });
    }
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
  assert.deepEqual(logged, []);
});

test("a coded Firestore error cannot borrow the local stale-revision message", async () => {
  const rawCode = 14;
  const rawMessage = "stale_account_revision";
  const providerError = Object.assign(new Error(rawMessage), { code: rawCode });
  let serviceCalls = 0;
  const logged: unknown[] = [];
  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...values: unknown[]) => { logged.push(values); };
  console.log = (...values: unknown[]) => { logged.push(values); };
  try {
    await withLoopbackServer({
      appCheckVerifier,
      lifecycle,
      expectedProjectId: PROJECT_ID,
      expectedAppCheckAppIds: [APP_ID],
      nowSeconds: () => NOW_SECONDS,
      service: httpService(async () => {
        serviceCalls += 1;
        throw providerError;
      }),
      verifier: verifier(),
    }, async (port) => {
      const result = await sendRequest(port, {
        body: JSON.stringify(requestBody(putSemantic())),
        headers: jsonHeaders(),
      });
      assert.equal(result.status, 500);
      assert.deepEqual(parseJson(result), { error: { code: "internal_error" } });
      assert.equal(result.body.includes(Buffer.from(String(rawCode))), false);
      assert.equal(result.body.includes(Buffer.from(rawMessage)), false);
    });
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
  assert.equal(serviceCalls, 1);
  assert.deepEqual(logged, []);
});

test("maps a boundary-valid oversized record to 413 before service", async () => {
  let serviceCalls = 0;
  const largeInput = {
    id: "large-http-record",
    payload: { value: "x".repeat(512 * 1024) },
    revision: 1,
    type: "reviewQueueEntry" as const,
  };
  const largeRecord = { ...largeInput, fingerprint: computeRecordFingerprint(largeInput) };
  const semantic = putSemantic(0, largeRecord);
  await withLoopbackServer({
    appCheckVerifier,
    lifecycle,
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    service: httpService(async () => { serviceCalls += 1; }),
    verifier: verifier(),
  }, async (port) => {
    const result = await sendRequest(port, {
      body: JSON.stringify({ ...semantic, operationFingerprint: "0".repeat(64) }),
      headers: jsonHeaders(),
    });
    assert.equal(result.status, 413);
    assert.deepEqual(parseJson(result), { error: { code: "request_too_large" } });
  });
  assert.equal(serviceCalls, 0);
});

class MemoryStore implements AccountDatasetStore {
  private readonly heads = new Map<string, AccountDatasetHead>();
  private readonly records = new Map<string, Map<string, Map<string, PersistedAccountRecordDocument>>>();

  async readAdoptionConflictPage(): Promise<never[]> { return []; }
  async readAdoptionLocalRecordPage(): Promise<never[]> { return []; }
  async readAdoptionOperation(): Promise<undefined> { return undefined; }
  async readRecordDescriptorPage(): Promise<never[]> { return []; }
  async readRecordPhysicalDescriptorPage(): Promise<never[]> { return []; }
  async readOwnedDocumentIdPage(): Promise<never[]> { return []; }

  async readHead(uid: string): Promise<AccountDatasetHead | undefined> {
    const head = this.heads.get(uid);
    return head === undefined ? undefined : structuredClone(head);
  }

  async readRecordPage(uid: string, generationId: string, after: string | undefined, limit: number): Promise<readonly AccountRecordPageDocument[]> {
    return [...(this.records.get(uid)?.get(generationId)?.entries() ?? [])]
      .filter(([id]) => after === undefined || id > after)
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(0, limit)
      .map(([documentId, value]) => ({ documentId, value: structuredClone(value) }));
  }

  async runTransaction<T>(uid: string, operation: (transaction: AccountDatasetTransaction) => Promise<T>): Promise<T> {
    let head = structuredClone(this.heads.get(uid));
    const generations = new Map(
      [...(this.records.get(uid)?.entries() ?? [])].map(([generationId, values]) => [
        generationId,
        new Map([...values.entries()].map(([id, value]) => [id, structuredClone(value)])),
      ]),
    );
    const generation = (generationId: string): Map<string, PersistedAccountRecordDocument> => {
      let values = generations.get(generationId);
      if (!values) {
        values = new Map();
        generations.set(generationId, values);
      }
      return values;
    };
    const result = await operation({
      deleteAdoptionConflict: () => { throw new Error("unexpected_adoption_transaction"); },
      deleteAdoptionLocalRecord: () => { throw new Error("unexpected_adoption_transaction"); },
      deleteRecord: (generationId, documentId) => { generation(generationId).delete(documentId); },
      putAdoptionConflict: () => { throw new Error("unexpected_adoption_transaction"); },
      putAdoptionLocalRecord: () => { throw new Error("unexpected_adoption_transaction"); },
      putRecord: (generationId, documentId, value) => { generation(generationId).set(documentId, structuredClone(value)); },
      readAdoptionConflict: async () => { throw new Error("unexpected_adoption_transaction"); },
      readAdoptionLocalRecord: async () => { throw new Error("unexpected_adoption_transaction"); },
      readAdoptionOperation: async () => { throw new Error("unexpected_adoption_transaction"); },
      readHead: async () => head === undefined ? undefined : structuredClone(head),
      readRecord: async (generationId, documentId) => {
        const value = generation(generationId).get(documentId);
        return value === undefined ? undefined : structuredClone(value);
      },
      readRecordExists: async (generationId, documentId) => generation(generationId).has(documentId),
      writeAdoptionOperation: () => { throw new Error("unexpected_adoption_transaction"); },
      writeHead: (value) => { head = structuredClone(value); },
    });
    if (head !== undefined) this.heads.set(uid, head);
    this.records.set(uid, generations);
    return result;
  }

  async dataset(uid: string): Promise<AccountDataset> {
    const head = this.heads.get(uid);
    if (!head?.activeGeneration) return { records: [] };
    const records = [...(this.records.get(uid)?.get(head.activeGeneration)?.values() ?? [])]
      .map((document) => JSON.parse(Buffer.from(document.canonicalBytes).toString("utf8")) as AccountRecord);
    return { records };
  }

  replaceRetainedOperationFingerprints(uid: string, operationFingerprints: readonly string[]): void {
    const head = this.heads.get(uid);
    assert.ok(head);
    this.heads.set(uid, {
      ...head,
      accountRevision: head.accountRevision + operationFingerprints.length,
      operationFingerprints,
    });
  }
}

test("supports exact put, delete, immediate replay, and replay after an intervening operation", async () => {
  const store = new MemoryStore();
  const service = new AccountDataService(store);
  const firstRecord = record("replay-record", "first", 1);
  const firstSemantic = putSemantic(0, firstRecord);
  const firstBody = JSON.stringify(requestBody(firstSemantic));
  const secondRecord = record(firstRecord.id, "second", 2);
  const secondSemantic = putSemantic(1, secondRecord);
  const secondBody = JSON.stringify(requestBody(secondSemantic));
  const deleteSemantic = {
    expectedAccountRevision: 2,
    mutations: [{
      expectedFingerprint: secondRecord.fingerprint,
      expectedRecordRevision: 2,
      id: secondRecord.id,
      kind: "delete" as const,
      type: secondRecord.type,
    }],
  };
  await withLoopbackServer({
    appCheckVerifier,
    lifecycle,
    expectedProjectId: PROJECT_ID,
    expectedAppCheckAppIds: [APP_ID],
    nowSeconds: () => NOW_SECONDS,
    service,
    verifier: verifier(),
  }, async (port) => {
    const first = await sendRequest(port, { body: firstBody, headers: jsonHeaders() });
    const immediateReplay = await sendRequest(port, { body: firstBody, headers: jsonHeaders() });
    assert.equal(first.status, 200);
    assert.ok(first.body.equals(immediateReplay.body));

    const second = await sendRequest(port, { body: secondBody, headers: jsonHeaders("Bearer another-valid-token") });
    assert.equal(second.status, 200);
    const interleavedReplay = await sendRequest(port, { body: firstBody, headers: jsonHeaders() });
    assert.ok(first.body.equals(interleavedReplay.body));

    const deletion = await sendRequest(port, {
      body: JSON.stringify(requestBody(deleteSemantic)),
      headers: { authorization: "Bearer valid-token", "content-type": "application/json; charset=UTF-8", "x-firebase-appcheck": "valid-app-check" },
    });
    assert.equal(deletion.status, 200);
    assert.deepEqual(parseJson(deletion), {
      committedAccountRevision: 3,
      operationFingerprint: computeSyncOperationFingerprint(deleteSemantic),
      result: "synchronized",
    });

    store.replaceRetainedOperationFingerprints(
      UID,
      Array.from({ length: 100 }, (_, index) => (index + 1).toString(16).padStart(64, "0")),
    );
    const agedOutReplay = await sendRequest(port, { body: firstBody, headers: jsonHeaders() });
    assert.equal(agedOutReplay.status, 409);
    assert.deepEqual(parseJson(agedOutReplay), { error: { code: "stale_account_revision" } });
  });
  assert.deepEqual(await store.dataset(UID), { records: [] });
});

test("Firebase initialization is explicit, project-bound, single-app, and rejects any pre-existing app", () => {
  const calls: string[] = [];
  const app = { name: "[DEFAULT]", options: { projectId: PROJECT_ID } } as never;
  const dependencies: FirebaseAdminInitializationDependencies = {
    getApps: () => { calls.push("getApps"); return []; },
    getAppCheck: (received) => { assert.equal(received, app); calls.push("app-check"); return {} as never; },
    initializeApp: (options) => { calls.push(`initialize:${options.projectId}`); return app; },
    getAuth: (received) => { assert.equal(received, app); calls.push("auth"); return {} as never; },
    getFirestore: (received) => { assert.equal(received, app); calls.push("firestore"); return {} as never; },
  };
  const runtime = initializeFirebaseAdminAccountRuntime(PROJECT_ID, dependencies);
  assert.ok(runtime.store);
  assert.ok(runtime.verifier);
  assert.ok(runtime.lifecycle);
  assert.deepEqual(calls, ["getApps", `initialize:${PROJECT_ID}`, "firestore", "auth", "app-check"]);

  let initializes = 0;
  assert.throws(() => initializeFirebaseAdminAccountRuntime(PROJECT_ID, {
    ...dependencies,
    getApps: () => [app],
    initializeApp: () => { initializes += 1; return app; },
  }), /firebase_admin_app_already_initialized/u);
  assert.equal(initializes, 0);
});

test("startup validates environment before one Firebase initialization and one listener call", () => {
  const store: AccountDatasetStore = {
    readAdoptionConflictPage: async () => [],
    readAdoptionLocalRecordPage: async () => [],
    readAdoptionOperation: async () => undefined,
    readHead: async () => undefined,
    readOwnedDocumentIdPage: async () => [],
    readRecordDescriptorPage: async () => [],
    readRecordPhysicalDescriptorPage: async () => [],
    readRecordPage: async () => [],
    runTransaction: async () => { throw new Error("unused"); },
  };
  let initializations = 0;
  let listeners = 0;
  const base: ServerStartupDependencies = {
    loadEnvironment: loadServerEnvironment,
    createFirebaseRuntime: () => { initializations += 1; return { appCheckVerifier, lifecycle, store, verifier: verifier() }; },
    createHttpServer: () => ({ listen: () => { listeners += 1; } }),
    nowSeconds: () => NOW_SECONDS,
  };
  assert.throws(() => startServer({ NODE_ENV: "test" }, base), /invalid_environment:PATTERNLY_ENVIRONMENT/u);
  assert.equal(initializations, 0);
  assert.equal(listeners, 0);

  const order: string[] = [];
  const valid: ServerStartupDependencies = {
    ...base,
    loadEnvironment: () => {
      order.push("environment");
      return {
        apiOrigin: "https://sandbox.patternly.invalid",
        appCheckAppIds: [APP_ID],
        appCheckMode: "debug",
        environment: "sandbox",
        firebaseProjectId: PROJECT_ID,
        port: 8_765,
        schedulerAudience: "https://sandbox.patternly.invalid",
        schedulerEmail: `patternly-scheduler@${PROJECT_ID}.iam.gserviceaccount.com`,
        schedulerSubject: "1234567890",
      };
    },
    createFirebaseRuntime: (projectId) => {
      order.push(`firebase:${projectId}`);
      return { appCheckVerifier, lifecycle, store, verifier: verifier() };
    },
    createHttpServer: (handler: RequestListener) => {
      assert.equal(typeof handler, "function");
      order.push("server");
      return { listen: (port, host) => { order.push(`listen:${host}:${port}`); } };
    },
  };
  startServer({ NODE_ENV: "test" }, valid);
  assert.deepEqual(order, ["environment", `firebase:${PROJECT_ID}`, "server", "listen:0.0.0.0:8765"]);
});

test("server environment requires explicit App Check IDs and gates debug mode to sandbox", () => {
  const source = {
    NODE_ENV: "test",
    PATTERNLY_ENVIRONMENT: "sandbox",
    FIREBASE_PROJECT_ID: PROJECT_ID,
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    PATTERNLY_API_ORIGIN: "https://sandbox.patternly.invalid",
    PATTERNLY_SCHEDULER_AUDIENCE: "https://sandbox.patternly.invalid",
    PATTERNLY_SCHEDULER_EMAIL: `patternly-scheduler@${PROJECT_ID}.iam.gserviceaccount.com`,
    PATTERNLY_SCHEDULER_SUBJECT: "1234567890",
    PATTERNLY_APPCHECK_MODE: "debug",
    PATTERNLY_APPCHECK_APP_IDS: APP_ID,
  } as const;
  const environment = loadServerEnvironment(source);
  assert.deepEqual(environment.appCheckAppIds, [APP_ID]);
  assert.equal(environment.appCheckMode, "debug");
  assert.throws(() => loadServerEnvironment({
    ...source,
    PATTERNLY_ENVIRONMENT: "production",
    FIREBASE_PROJECT_ID: "patternly-app-production",
    PATTERNLY_APPCHECK_MODE: "debug",
    K_SERVICE: "patternly-api",
  }), /production_app_check_debug_prohibited/u);
  assert.throws(() => loadServerEnvironment({ ...source, PATTERNLY_APPCHECK_APP_IDS: `${APP_ID},${APP_ID}` }), /invalid_environment:PATTERNLY_APPCHECK_APP_IDS/u);
});

test("production scripts build and start only the emitted JavaScript entrypoint", () => {
  const serverDirectory = resolve("server");
  const packageJson = JSON.parse(readFileSync(resolve(serverDirectory, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  assert.equal(packageJson.scripts.build, "tsc -p tsconfig.build.json");
  assert.equal(packageJson.scripts.start, "node dist/index.js");
  const build = spawnSync("npm", ["run", "build"], {
    cwd: serverDirectory,
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "test" },
    timeout: 30_000,
  });
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
  assert.equal(build.signal, null);
  const emittedEntrypoint = resolve(serverDirectory, "dist/index.js");
  assert.equal(existsSync(emittedEntrypoint), true);
  const smoke = spawnSync(process.execPath, [emittedEntrypoint], {
    cwd: serverDirectory,
    encoding: "utf8",
    env: { NODE_ENV: "test", PATH: process.env.PATH ?? "" },
    timeout: 5_000,
  });
  assert.notEqual(smoke.status, 0);
  assert.equal(smoke.signal, null);
  assert.match(smoke.stderr, /invalid_environment:PATTERNLY_ENVIRONMENT/u);
});

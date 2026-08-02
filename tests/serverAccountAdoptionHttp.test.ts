import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import test from "node:test";

import { computeRecordFingerprint, type AccountRecord } from "../server/src/accountData.js";
import { AccountDataService, type AccountDatasetStore } from "../server/src/accountService.js";
import type { FirebaseIdTokenVerifier, VerifiedFirebaseIdToken } from "../server/src/authentication.js";
import {
  createAccountHttpHandler,
  MAX_ADOPTION_HTTP_BODY_BYTES,
  MAX_ADOPTION_PREVIEW_HTTP_RESPONSE_BYTES,
  MAX_ADOPTION_UPLOAD_HTTP_BODY_BYTES,
  type AccountHttpDependencies,
  type AccountHttpService,
} from "../server/src/http.js";

const PROJECT_ID = "patternly-app-sandbox";
const NOW_SECONDS = 1_785_700_000;
const UID = "verified-adoption-http-user";
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);

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

const unexpected = (name: string): (() => Promise<never>) => async () => { throw new Error(`unexpected_${name}_call`); };

const serviceFor = (overrides: Partial<AccountHttpService> = {}): AccountHttpService => ({
  advanceAdoption: unexpected("adoption_advance"),
  applySync: unexpected("sync"),
  cancelAdoption: unexpected("adoption_cancel"),
  confirmAdoptionOperation: unexpected("adoption_confirm"),
  readAdoptionPreviewPage: unexpected("adoption_preview"),
  readSnapshotPage: unexpected("snapshot_page"),
  startAdoption: unexpected("adoption_start"),
  uploadAdoptionPage: unexpected("adoption_upload"),
  ...overrides,
});

class FailFastCountedStore implements AccountDatasetStore {
  calls = 0;

  private fail(): never {
    this.calls += 1;
    throw new Error("unexpected_account_store_call");
  }

  async readAdoptionConflictPage(): Promise<never> { return this.fail(); }
  async readAdoptionLocalRecordPage(): Promise<never> { return this.fail(); }
  async readAdoptionOperation(): Promise<never> { return this.fail(); }
  async readHead(): Promise<never> { return this.fail(); }
  async readOwnedDocumentIdPage(): Promise<never> { return this.fail(); }
  async readRecordDescriptorPage(): Promise<never> { return this.fail(); }
  async readRecordPage(): Promise<never> { return this.fail(); }
  async readRecordPhysicalDescriptorPage(): Promise<never> { return this.fail(); }
  async runTransaction<T>(): Promise<T> { return this.fail(); }
}

const recordInput = {
  id: "uploaded-record",
  payload: { value: "canonical" },
  revision: 1,
  type: "reviewQueueEntry" as const,
};
const uploadedRecord: AccountRecord = { ...recordInput, fingerprint: computeRecordFingerprint(recordInput) };

const startBody = {
  adoptionId: HASH_A,
  expectedAccountRevision: 0,
  expectedDatasetFingerprint: HASH_B,
  localDatasetFingerprint: HASH_C,
  localRecordCount: 1,
  restartCancelled: false,
  restartDiscarded: false,
};
const uploadBody = { adoptionId: HASH_A, pageFingerprint: HASH_B, records: [uploadedRecord], startRecordIndex: 0 };
const advanceBody = { adoptionId: HASH_A, expectedStepToken: HASH_B };
const previewBody = { adoptionId: HASH_A, afterSequenceId: null };
const confirmBody = { adoptionId: HASH_A, confirmation: { confirmed: true, planId: HASH_B } };
const cancelBody = { adoptionId: HASH_A };

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
    path: string;
  }>,
): Promise<HttpResult> => new Promise((resolvePromise, rejectPromise) => {
  const outgoing = request({
    headers: options.headers ?? { authorization: "Bearer valid-token", "content-type": "application/json" },
    host: "127.0.0.1",
    method: options.method ?? "POST",
    path: options.path,
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

const withServer = async (
  service: AccountHttpService,
  operation: (port: number) => Promise<void>,
  tokenVerifier = verifier(),
): Promise<void> => {
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

const parseJson = (result: HttpResult): unknown => JSON.parse(result.body.toString("utf8")) as unknown;

const assertProtectedJsonHeaders = (result: HttpResult): void => {
  assert.equal(result.headers["cache-control"], "no-store");
  assert.equal(result.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(result.headers["content-length"], String(result.body.length));
  assert.equal(result.headers["x-content-type-options"], "nosniff");
};

type RouteCase = Readonly<{
  body: Readonly<Record<string, unknown>>;
  createOverride: (calls: Array<Readonly<{ input: unknown; uid: string }>>) => Partial<AccountHttpService>;
  expected: unknown;
  malformedBody: Readonly<Record<string, unknown>>;
  path: string;
}>;

const routeCases: readonly RouteCase[] = [
  {
    body: startBody,
    createOverride: (calls) => ({ startAdoption: async (uid, input) => {
      calls.push({ input, uid });
      return { adoptionId: HASH_A, result: "started", stage: "uploading", stepToken: HASH_C };
    } }),
    expected: { adoptionId: HASH_A, result: "started", stage: "uploading", stepToken: HASH_C },
    malformedBody: { ...startBody, localRecordCount: "1" },
    path: "/v1/account/adoption/start",
  },
  {
    body: uploadBody,
    createOverride: (calls) => ({ uploadAdoptionPage: async (uid, input) => {
      calls.push({ input, uid });
      return { acceptedNextRecordIndex: 1, adoptionId: HASH_A, pageFingerprint: HASH_B, result: "accepted", stage: "preparing", stepToken: HASH_C };
    } }),
    expected: { acceptedNextRecordIndex: 1, adoptionId: HASH_A, pageFingerprint: HASH_B, result: "accepted", stage: "preparing", stepToken: HASH_C },
    malformedBody: { ...uploadBody, records: {} },
    path: "/v1/account/adoption/upload/page",
  },
  {
    body: advanceBody,
    createOverride: (calls) => ({ advanceAdoption: async (uid, input) => {
      calls.push({ input, uid });
      return { adoptionId: HASH_A, result: "advanced", stage: "previewReady", stepToken: HASH_C };
    } }),
    expected: { adoptionId: HASH_A, result: "advanced", stage: "previewReady", stepToken: HASH_C },
    malformedBody: { ...advanceBody, expectedStepToken: 1 },
    path: "/v1/account/adoption/advance",
  },
  {
    body: previewBody,
    createOverride: (calls) => ({ readAdoptionPreviewPage: async (uid, input) => {
      calls.push({ input, uid });
      return {
        adoptionId: HASH_A,
        caseId: "populatedLocalEmptyRemote",
        conflictCount: 0,
        conflicts: [],
        localFingerprint: HASH_B,
        nextCursor: null,
        planId: HASH_C,
        remoteFingerprint: HASH_A,
        result: "previewThenUploadExactLocalDataset",
      };
    } }),
    expected: {
      adoptionId: HASH_A,
      caseId: "populatedLocalEmptyRemote",
      conflictCount: 0,
      conflicts: [],
      localFingerprint: HASH_B,
      nextCursor: null,
      planId: HASH_C,
      remoteFingerprint: HASH_A,
      result: "previewThenUploadExactLocalDataset",
    },
    malformedBody: { ...previewBody, afterSequenceId: 1 },
    path: "/v1/account/adoption/preview/page",
  },
  {
    body: confirmBody,
    createOverride: (calls) => ({ confirmAdoptionOperation: async (uid, input) => {
      calls.push({ input, uid });
      return { adoptionId: HASH_A, result: "accepted", stage: "hashingConfirmation", stepToken: HASH_C };
    } }),
    expected: { adoptionId: HASH_A, result: "accepted", stage: "hashingConfirmation", stepToken: HASH_C },
    malformedBody: { ...confirmBody, confirmation: [] },
    path: "/v1/account/adoption/confirm",
  },
  {
    body: cancelBody,
    createOverride: (calls) => ({ cancelAdoption: async (uid, input) => {
      calls.push({ input, uid });
      return { adoptionId: HASH_A, result: "discarding", stage: "discarding", stepToken: HASH_C };
    } }),
    expected: { adoptionId: HASH_A, result: "discarding", stage: "discarding", stepToken: HASH_C },
    malformedBody: { adoptionId: 1 },
    path: "/v1/account/adoption/cancel",
  },
];

test("exposes exactly the six adoption POST routes and dispatches verified UID with literal service results", async () => {
  for (const route of routeCases) {
    const calls: Array<Readonly<{ input: unknown; uid: string }>> = [];
    await withServer(serviceFor(route.createOverride(calls)), async (port) => {
      const response = await sendRequest(port, { body: JSON.stringify(route.body), path: route.path });
      assert.equal(response.status, 200, route.path);
      assert.deepEqual(parseJson(response), route.expected, route.path);
      assertProtectedJsonHeaders(response);
      assert.deepEqual(calls, [{ input: route.body, uid: UID }], route.path);

      const wrongMethod = await sendRequest(port, { method: "GET", path: route.path });
      assert.equal(wrongMethod.status, 405, route.path);
      assert.equal(wrongMethod.headers.allow, "POST", route.path);
      assert.deepEqual(parseJson(wrongMethod), { error: { code: "method_not_allowed" } }, route.path);
    });
  }

  await withServer(serviceFor(), async (port) => {
    for (const path of ["/v1/account/adoption", "/v1/account/adoption/start?retry=true", "/v1/account/adoption/upload"]) {
      const response = await sendRequest(port, { path });
      assert.equal(response.status, 404, path);
      assert.deepEqual(parseJson(response), { error: { code: "not_found" } }, path);
    }
  });
});

test("preserves every reachable adoption response union as byte-exact JSON.stringify output", async () => {
  const completed = {
    adoptionId: HASH_A,
    adoptionResult: "previewThenUploadExactLocalDataset" as const,
    caseId: "populatedLocalEmptyRemote" as const,
    committedAccountRevision: 4,
    operationFingerprint: HASH_B,
    result: "completed" as const,
  };
  const cancelled = { adoptionId: HASH_A, result: "cancelled" as const };
  const discarded = { adoptionId: HASH_A, reason: "expired" as const, result: "discarded" as const };
  const snapshotDiscarded = { adoptionId: HASH_A, reason: "snapshotChanged" as const, result: "discarded" as const };
  const preview = {
    adoptionId: HASH_A,
    caseId: "populatedLocalPopulatedRemote" as const,
    conflictCount: 1,
    conflicts: [{ code: "revision_conflict" as const, recordId: "record-1", recordType: "reviewQueueEntry" as const }],
    localFingerprint: HASH_B,
    nextCursor: "0000000000000001",
    planId: HASH_C,
    remoteFingerprint: HASH_A,
    result: "previewThenReconcileByRecordPolicy" as const,
  };
  const rows = [
    { body: startBody, path: "/v1/account/adoption/start", response: { adoptionId: HASH_A, result: "started", stage: "uploading", stepToken: HASH_B } },
    { body: startBody, path: "/v1/account/adoption/start", response: { adoptionId: HASH_A, result: "resumed", stage: "preparing", stepToken: HASH_B } },
    { body: startBody, path: "/v1/account/adoption/start", response: { adoptionId: HASH_A, result: "cleanupRequired", stage: "discarding", stepToken: HASH_B } },
    { body: startBody, path: "/v1/account/adoption/start", response: { adoptionId: HASH_A, result: "cleanupRequired", stage: "activatedCleaning", stepToken: HASH_B } },
    { body: startBody, path: "/v1/account/adoption/start", response: completed },
    { body: startBody, path: "/v1/account/adoption/start", response: cancelled },
    { body: startBody, path: "/v1/account/adoption/start", response: discarded },
    { body: startBody, path: "/v1/account/adoption/start", response: snapshotDiscarded },
    { body: advanceBody, path: "/v1/account/adoption/advance", response: { adoptionId: HASH_A, result: "advanced", stage: "previewReady", stepToken: HASH_B } },
    { body: advanceBody, path: "/v1/account/adoption/advance", response: completed },
    { body: advanceBody, path: "/v1/account/adoption/advance", response: cancelled },
    { body: advanceBody, path: "/v1/account/adoption/advance", response: discarded },
    { body: advanceBody, path: "/v1/account/adoption/advance", response: snapshotDiscarded },
    { body: confirmBody, path: "/v1/account/adoption/confirm", response: { adoptionId: HASH_A, result: "accepted", stage: "hashingConfirmation", stepToken: HASH_B } },
    { body: confirmBody, path: "/v1/account/adoption/confirm", response: completed },
    { body: cancelBody, path: "/v1/account/adoption/cancel", response: { adoptionId: HASH_A, result: "discarding", stage: "discarding", stepToken: HASH_B } },
    { body: cancelBody, path: "/v1/account/adoption/cancel", response: completed },
    { body: cancelBody, path: "/v1/account/adoption/cancel", response: cancelled },
    { body: cancelBody, path: "/v1/account/adoption/cancel", response: discarded },
    { body: cancelBody, path: "/v1/account/adoption/cancel", response: snapshotDiscarded },
    { body: uploadBody, path: "/v1/account/adoption/upload/page", response: { acceptedNextRecordIndex: 1, adoptionId: HASH_A, pageFingerprint: HASH_B, result: "accepted", stage: "preparing", stepToken: HASH_C } },
    { body: previewBody, path: "/v1/account/adoption/preview/page", response: preview },
  ] as const;

  let literalResponse: unknown;
  const literalService = serviceFor({
    advanceAdoption: async () => literalResponse as Awaited<ReturnType<AccountHttpService["advanceAdoption"]>>,
    cancelAdoption: async () => literalResponse as Awaited<ReturnType<AccountHttpService["cancelAdoption"]>>,
    confirmAdoptionOperation: async () => literalResponse as Awaited<ReturnType<AccountHttpService["confirmAdoptionOperation"]>>,
    readAdoptionPreviewPage: async () => literalResponse as Awaited<ReturnType<AccountHttpService["readAdoptionPreviewPage"]>>,
    startAdoption: async () => literalResponse as Awaited<ReturnType<AccountHttpService["startAdoption"]>>,
    uploadAdoptionPage: async () => literalResponse as Awaited<ReturnType<AccountHttpService["uploadAdoptionPage"]>>,
  });

  await withServer(literalService, async (port) => {
    for (const row of rows) {
      literalResponse = row.response;
      const response = await sendRequest(port, { body: JSON.stringify(row.body), path: row.path });
      assert.equal(response.status, 200, `${row.path}/${row.response.result}`);
      assert.deepEqual(response.body, Buffer.from(JSON.stringify(row.response)), `${row.path}/${row.response.result}`);
      assertProtectedJsonHeaders(response);
    }
  });
});

test("authenticates before entity parsing on every adoption route", async () => {
  let verifierCalls = 0;
  await withServer(serviceFor(), async (port) => {
    for (const route of routeCases) {
      const response = await sendRequest(port, {
        body: "not-json",
        headers: { "content-type": "text/plain" },
        path: route.path,
      });
      assert.equal(response.status, 401, route.path);
      assert.deepEqual(parseJson(response), { error: { code: "authentication_required" } }, route.path);
      assertProtectedJsonHeaders(response);
    }
  }, verifier(async () => {
    verifierCalls += 1;
    throw new Error("missing_authorization");
  }));
  assert.equal(verifierCalls, 0);
});

test("rejects missing, extra, caller-selected UID and malformed top-level command shells", async () => {
  for (const route of routeCases) {
    const calls: Array<Readonly<{ input: unknown; uid: string }>> = [];
    await withServer(serviceFor(route.createOverride(calls)), async (port) => {
      for (const invalid of [{}, { ...route.body, uid: "caller-selected-user" }, route.malformedBody]) {
        const response = await sendRequest(port, { body: JSON.stringify(invalid), path: route.path });
        assert.equal(response.status, 400, route.path);
        assert.deepEqual(parseJson(response), { error: { code: "invalid_request" } }, route.path);
      }
    });
    assert.equal(calls.length, 0, route.path);
  }
});

test("delegates nested adoption validation to the real service before any store access", async () => {
  const store = new FailFastCountedStore();
  const realService = new AccountDataService(store, () => NOW_SECONDS * 1_000);
  let uploadCalls = 0;
  let confirmationCalls = 0;
  const service = serviceFor({
    confirmAdoptionOperation: async (uid, input) => {
      confirmationCalls += 1;
      return realService.confirmAdoptionOperation(uid, input);
    },
    uploadAdoptionPage: async (uid, input) => {
      uploadCalls += 1;
      return realService.uploadAdoptionPage(uid, input);
    },
  });

  await withServer(service, async (port) => {
    const wrongFingerprint = await sendRequest(port, {
      body: JSON.stringify({
        ...uploadBody,
        records: [{ ...uploadedRecord, fingerprint: "0".repeat(64) }],
      }),
      path: "/v1/account/adoption/upload/page",
    });
    assert.equal(wrongFingerprint.status, 400);
    assert.deepEqual(parseJson(wrongFingerprint), { error: { code: "invalid_request" } });

    const malformedConfirmations = [
      { confirmed: true },
      { confirmed: true, planId: HASH_B, selectedActiveSessionSide: "device" },
      { confirmed: true, planId: HASH_B, unknown: true },
    ];
    for (const confirmation of malformedConfirmations) {
      const response = await sendRequest(port, {
        body: JSON.stringify({ adoptionId: HASH_A, confirmation }),
        path: "/v1/account/adoption/confirm",
      });
      assert.equal(response.status, 400);
      assert.deepEqual(parseJson(response), { error: { code: "invalid_request" } });
    }
  });

  assert.equal(uploadCalls, 1);
  assert.equal(confirmationCalls, 3);
  assert.equal(store.calls, 0);
});

test("enforces exact four-KiB control and two-MiB upload streamed request limits", async () => {
  for (const route of routeCases) {
    const maximum = route.path === "/v1/account/adoption/upload/page"
      ? MAX_ADOPTION_UPLOAD_HTTP_BODY_BYTES
      : MAX_ADOPTION_HTTP_BODY_BYTES;
    const encoded = Buffer.from(JSON.stringify(route.body));
    const exact = Buffer.concat([encoded, Buffer.alloc(maximum - encoded.length, 0x20)], maximum);
    const calls: Array<Readonly<{ input: unknown; uid: string }>> = [];
    await withServer(serviceFor(route.createOverride(calls)), async (port) => {
      const accepted = await sendRequest(port, { body: exact, path: route.path });
      assert.equal(accepted.status, 200, `${route.path}/exact`);

      const oversized = Buffer.concat([exact, Buffer.from(" ")]);
      const rejected = await sendRequest(port, {
        chunks: [oversized.subarray(0, maximum), oversized.subarray(maximum)],
        path: route.path,
      });
      assert.equal(rejected.status, 413, `${route.path}/plus-one`);
      assert.deepEqual(parseJson(rejected), { error: { code: "request_too_large" } }, route.path);
    });
    assert.equal(calls.length, 1, route.path);
  }
});

test("reuses strict media, encoding, BOM and fatal UTF-8 boundaries", async () => {
  await withServer(serviceFor(), async (port) => {
    const cases = [
      { body: JSON.stringify(startBody), headers: { authorization: "Bearer valid-token", "content-type": "text/plain" }, status: 415, code: "unsupported_media_type" },
      { body: JSON.stringify(startBody), headers: { authorization: "Bearer valid-token", "content-encoding": "gzip", "content-type": "application/json" }, status: 415, code: "unsupported_content_encoding" },
      { body: Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(JSON.stringify(startBody))]), headers: { authorization: "Bearer valid-token", "content-type": "application/json" }, status: 400, code: "invalid_request" },
      { body: Buffer.from([0xc3, 0x28]), headers: { authorization: "Bearer valid-token", "content-type": "application/json" }, status: 400, code: "invalid_request" },
    ] as const;
    for (const boundary of cases) {
      const response = await sendRequest(port, {
        body: boundary.body,
        headers: boundary.headers,
        path: "/v1/account/adoption/start",
      });
      assert.equal(response.status, boundary.status);
      assert.deepEqual(parseJson(response), { error: { code: boundary.code } });
    }
  });
});

test("uses the closed adoption service error map without leaking provider or exception details", async () => {
  const rows = [
    ["invalid_adoption_start", 400, "invalid_request"],
    ["invalid_adoption_page", 400, "invalid_request"],
    ["invalid_adoption_page_fingerprint", 400, "invalid_request"],
    ["invalid_adoption_preview_page", 400, "invalid_request"],
    ["invalid_adoption_confirmation", 400, "invalid_request"],
    ["invalid_adoption_cancel", 400, "invalid_request"],
    ["invalid_adoption_advance", 400, "invalid_request"],
    ["invalid_account_dataset", 400, "invalid_request"],
    ["invalid_account_record", 400, "invalid_request"],
    ["invalid_record_payload", 400, "invalid_request"],
    ["record_fingerprint_mismatch", 400, "invalid_request"],
    ["account_record_too_large", 413, "request_too_large"],
    ["adoption_page_too_large", 413, "request_too_large"],
    ["snapshot_changed", 409, "snapshot_changed"],
    ["active_generation_changed", 409, "snapshot_changed"],
    ["adoption_in_progress", 409, "adoption_in_progress"],
    ["adoption_page_conflict", 409, "adoption_page_conflict"],
    ["adoption_dataset_fingerprint_mismatch", 409, "adoption_page_conflict"],
    ["adoption_step_changed", 409, "adoption_step_changed"],
    ["adoption_not_ready", 409, "adoption_not_ready"],
    ["adoption_conflict", 409, "adoption_conflict"],
    ["active_session_conflict", 409, "active_session_conflict"],
    ["multiple_active_session_references", 409, "active_session_conflict"],
    ["account_data_retryable", 503, "account_data_retryable"],
    ["account_snapshot_changed_retryable", 503, "account_data_retryable"],
    ["candidate_generation_mismatch", 500, "internal_error"],
    ["corrupt_adoption_source_count", 500, "internal_error"],
    ["adoption_conflict_collision", 500, "internal_error"],
    ["adoption_candidate_step_too_large", 500, "internal_error"],
    ["adoption_expired", 500, "internal_error"],
    ["unknown_sensitive_message", 500, "internal_error"],
  ] as const;

  for (const [message, status, code] of rows) {
    await withServer(serviceFor({ startAdoption: async () => { throw new Error(message); } }), async (port) => {
      const response = await sendRequest(port, {
        body: JSON.stringify(startBody),
        path: "/v1/account/adoption/start",
      });
      assert.equal(response.status, status, message);
      assert.deepEqual(parseJson(response), { error: { code } }, message);
      assertProtectedJsonHeaders(response);
    });
  }

  const providerError = Object.assign(new Error("adoption_in_progress"), { code: "firestore/unavailable" });
  await withServer(serviceFor({ startAdoption: async () => { throw providerError; } }), async (port) => {
    const response = await sendRequest(port, { body: JSON.stringify(startBody), path: "/v1/account/adoption/start" });
    assert.equal(response.status, 500);
    assert.deepEqual(parseJson(response), { error: { code: "internal_error" } });
    assert.equal(response.body.includes(Buffer.from("firestore")), false);
  });
});

const sizedPreview = (targetBytes: number): Awaited<ReturnType<AccountHttpService["readAdoptionPreviewPage"]>> => {
  const create = (recordId: string) => ({
    adoptionId: HASH_A,
    caseId: "divergentRecord" as const,
    conflictCount: 1,
    conflicts: [{ code: "revision_conflict" as const, recordId, recordType: "reviewQueueEntry" as const }],
    localFingerprint: HASH_B,
    nextCursor: null,
    planId: HASH_C,
    remoteFingerprint: HASH_A,
    result: "applyRecordPolicyOrBlockWithoutMutation" as const,
  });
  const fixedBytes = Buffer.byteLength(JSON.stringify(create("")));
  assert.ok(targetBytes >= fixedBytes);
  return create("x".repeat(targetBytes - fixedBytes));
};

test("encodes preview once, accepts the exact two-MiB boundary and rejects plus one without truncation", async () => {
  const exact = sizedPreview(MAX_ADOPTION_PREVIEW_HTTP_RESPONSE_BYTES);
  await withServer(serviceFor({ readAdoptionPreviewPage: async () => exact }), async (port) => {
    const response = await sendRequest(port, { body: JSON.stringify(previewBody), path: "/v1/account/adoption/preview/page" });
    assert.equal(response.status, 200);
    assert.equal(response.body.length, MAX_ADOPTION_PREVIEW_HTTP_RESPONSE_BYTES);
    assert.deepEqual(parseJson(response), exact);
    assertProtectedJsonHeaders(response);
  });

  const oversized = sizedPreview(MAX_ADOPTION_PREVIEW_HTTP_RESPONSE_BYTES + 1);
  await withServer(serviceFor({ readAdoptionPreviewPage: async () => oversized }), async (port) => {
    const response = await sendRequest(port, { body: JSON.stringify(previewBody), path: "/v1/account/adoption/preview/page" });
    assert.equal(response.status, 500);
    assert.deepEqual(parseJson(response), { error: { code: "internal_error" } });
    assert.equal(response.body.includes(Buffer.from("x".repeat(128))), false);
    assertProtectedJsonHeaders(response);
  });
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  PatternlyApiClientError,
  createPatternlyApiClient,
  type ProgressMutationDto,
} from "./PatternlyApiClientAdapter";

const API_ORIGIN = "https://api.sandbox.patternly.invalid";
const DEVICE_ID = "00000000-0000-4000-8000-000000000000";
const FINGERPRINT = "a".repeat(64);
const RECOVERY_OPERATION_ID = "00000000-0000-4000-8000-000000000101";
const DELETION_OPERATION_ID = "00000000-0000-4000-8000-000000000202";
const DELETION_PROOF_ID = "proof_abcdefghijklmnopqrstuvwx";
const RECOVERY_CODE = "ABCD-EFGH-IJKL-MNOP";
const RECOVERY_CODES = [
  "ABCD-EFGH-IJKL-MNOP", "BCDE-FGHI-JKLM-NPQR", "CDEF-GHIJ-KLMN-PQRS", "DEFG-HIJK-LMNO-QRST", "EFGH-IJKL-MNOP-RSTU",
  "FGHI-JKLM-NOPQ-STUV", "GHIJ-KLMN-OPQR-TUVW", "HIJK-LMNO-PQRS-UVWX", "IJKL-MNOP-QRST-VWXY", "JKLM-NOPQ-RSTU-WXYZ",
];

function createTestClient(input: Partial<Parameters<typeof createPatternlyApiClient>[0]> & Pick<Parameters<typeof createPatternlyApiClient>[0], "fetchImplementation">): ReturnType<typeof createPatternlyApiClient> {
  return createPatternlyApiClient({
    apiOrigin: API_ORIGIN,
    getIdToken: async () => "id-token",
    getAppCheckToken: async () => "app-check-token",
    ...input,
  });
}

test("registration preserves edge HTTP failures and Retry-After even without a readable JSON body", async () => {
  for (const status of [429, 503]) {
    for (const body of ["plain text", "empty", "stalled"] as const) {
      let calls = 0;
      const client = createTestClient({
        timeoutMs: 25,
        fetchImplementation: async () => {
          calls++;
          const response = new Response(body === "empty" ? null : "No instances", { status, headers: { "retry-after": "12" } });
          if (body === "stalled") response.json = () => new Promise(() => undefined);
          return response;
        },
      });
      await assert.rejects(client.registerAccount({
        termsVersion: "terms-v1", termsLocale: "en", privacyPolicyVersion: "privacy-v1", privacyPolicyLocale: "en", privacyPolicyAcknowledged: true,
      }), (error: unknown) => error instanceof PatternlyApiClientError
        && error.code === "server_error" && error.status === status && error.retryAfterSeconds === 12 && error.serverCode === undefined,
      `${status}: ${body}`);
      assert.equal(calls, 1, "registration mutations are never retried automatically");
    }
  }
});

test("a deadline before HTTP headers remains a timeout and a malformed successful response stays invalid", async () => {
  let calls = 0;
  const timedOut = createTestClient({ timeoutMs: 25, fetchImplementation: () => { calls++; return new Promise(() => undefined); } });
  await assert.rejects(timedOut.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "request_timeout" && error.status === undefined);
  assert.equal(calls, 1);
  const malformed = createTestClient({ fetchImplementation: async () => new Response("not JSON", { status: 200 }) });
  await assert.rejects(malformed.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response" && error.status === 200);
});

function activeTrackMutation(overrides: Partial<ProgressMutationDto> = {}): ProgressMutationDto {
  return {
    mutationId: "mutation-canonical-0001",
    kind: "node",
    recordType: "active_track",
    trackId: "coding-interview-dsa-problem-solving",
    targetId: "current",
    expectedVersion: null,
    fingerprint: FINGERPRINT,
    state: { trackId: "coding-interview-dsa-problem-solving" },
    ...overrides,
  };
}

function canonicalSyncRequest(mutation = activeTrackMutation()) {
  return {
    canonicalVersion: "canonical-json-v1" as const,
    expectedAccountRevision: 0,
    deviceId: DEVICE_ID,
    sessionId: "session-canonical",
    batchId: "session-canonical:batch:1",
    highWatermark: 1,
    mutations: [mutation],
  };
}

function deletionResponse(status: string, operationId = DELETION_OPERATION_ID, proofId: unknown = DELETION_PROOF_ID) {
  return { status, operationId, proofId };
}

test("getMe validates the complete canonical profile and preserves nullable fields", async () => {
  const user = {
    id: "00000000-0000-4000-8000-000000000303",
    createdAt: "2026-10-04T10:20:30.000Z",
    acceptedTermsVersion: null,
    identity: { provider: "apple", subject: "provider-subject-distinct-from-account-and-firebase-uid", email: null, emailVerified: false },
  };
  const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ user }), { status: 200 }) });
  assert.deepEqual(await client.getMe(), { user });

  const withNullableValues = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({
    user: { ...user, createdAt: "2026-10-04t12:20:30.123+02:30", acceptedTermsVersion: "", identity: { ...user.identity, email: "person@example.test", emailVerified: true } },
  }), { status: 200 }) });
  const accepted = await withNullableValues.getMe();
  assert.equal(accepted.user.createdAt, "2026-10-04t12:20:30.123+02:30");
  assert.equal(accepted.user.acceptedTermsVersion, "", "the wire schema permits any string or null for acceptedTermsVersion");
  assert.equal(accepted.user.identity.email, "person@example.test");

  for (const email of [`${"a".repeat(65)}@example.test`, `person@${"a".repeat(64)}.test`]) {
    const longEmailClient = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({
      user: { ...user, identity: { ...user.identity, email } },
    }), { status: 200 }) });
    assert.equal((await longEmailClient.getMe()).user.identity.email, email, "mirror the installed backend email format without adding absent length bounds");
  }
});

test("getMe rejects incomplete, mistyped, malformed, and extended account profiles", async () => {
  const canonical = {
    id: "00000000-0000-4000-8000-000000000303",
    createdAt: "2026-10-04T10:20:30.000Z",
    acceptedTermsVersion: null,
    identity: { provider: "firebase", subject: "provider-subject", email: null, emailVerified: true },
  };
  const invalidUsers = [
    {},
    { ...canonical, id: "not-an-account-id" },
    { ...canonical, createdAt: "2026-02-31T10:20:30.000Z" },
    { ...canonical, createdAt: "2026-10-04T24:00:00Z" },
    { ...canonical, acceptedTermsVersion: 4 },
    { ...canonical, identity: { ...canonical.identity, provider: "" } },
    { ...canonical, identity: { ...canonical.identity, subject: "" } },
    { ...canonical, identity: { ...canonical.identity, email: 4 } },
    { ...canonical, identity: { ...canonical.identity, email: "" } },
    { ...canonical, identity: { ...canonical.identity, email: "not-an-email" } },
    { ...canonical, identity: { ...canonical.identity, email: "person@@example.test" } },
    { ...canonical, identity: { ...canonical.identity, email: "person@-example.test" } },
    { ...canonical, identity: { ...canonical.identity, emailVerified: "true" } },
    { ...canonical, identity: { ...canonical.identity, unexpected: true } },
    { ...canonical, unexpected: true },
  ];
  for (const user of invalidUsers) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ user }), { status: 200 }) });
    await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }
});

test("deletion response methods bind exact proof and operation identity while preserving nullable pending proofs", async () => {
  const expectedDeletion = deletionResponse("deleted");
  const deletionClient = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(expectedDeletion), { status: 200 }) });
  assert.deepEqual(await deletionClient.deleteAccount(DELETION_OPERATION_ID, "a".repeat(64)), expectedDeletion);

  for (const malformed of [
    deletionResponse("pending"),
    deletionResponse("deleted", "00000000-0000-4000-8000-000000000999"),
    deletionResponse("deleted", DELETION_OPERATION_ID, 123),
    deletionResponse("deleted", DELETION_OPERATION_ID, "proof_too-short"),
    { ...expectedDeletion, extra: true },
  ]) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(malformed), { status: 200 }) });
    await assert.rejects(client.deleteAccount(DELETION_OPERATION_ID, "a".repeat(64)), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }

  const proofClient = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(deletionResponse("deleted")), { status: 200 }) });
  assert.deepEqual(await proofClient.getDeletionProof(DELETION_PROOF_ID), deletionResponse("deleted"));
  for (const malformed of [
    deletionResponse("pending"),
    deletionResponse("deleted", DELETION_OPERATION_ID, "proof_zyxwvutsrqponmlkjihgfedc"),
    deletionResponse("deleted", "not-a-uuid"),
    { ...deletionResponse("deleted"), extra: true },
  ]) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(malformed), { status: 200 }) });
    await assert.rejects(client.getDeletionProof(DELETION_PROOF_ID), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }

  const statusResponses = [
    deletionResponse("pending", DELETION_OPERATION_ID, null),
    deletionResponse("pending"),
    deletionResponse("remote_deleted"),
    deletionResponse("complete"),
  ];
  let statusIndex = 0;
  const statusClient = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(statusResponses[statusIndex++]), { status: 200 }) });
  for (const expected of statusResponses) assert.deepEqual(await statusClient.getDeletionOperationStatus(DELETION_OPERATION_ID, "a".repeat(64)), expected);

  for (const malformed of [
    deletionResponse("failed"),
    deletionResponse("pending", "00000000-0000-4000-8000-000000000999"),
    deletionResponse(["pending"] as unknown as string),
    deletionResponse(1 as unknown as string),
    deletionResponse("remote_deleted", DELETION_OPERATION_ID, null),
    deletionResponse("complete", DELETION_OPERATION_ID, null),
    deletionResponse("pending", DELETION_OPERATION_ID, 123),
    { status: "pending", operationId: DELETION_OPERATION_ID },
    { ...deletionResponse("pending", DELETION_OPERATION_ID, null), extra: true },
  ]) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(malformed), { status: 200 }) });
    await assert.rejects(client.getDeletionOperationStatus(DELETION_OPERATION_ID, "a".repeat(64)), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }
});

test("account and deletion parsers preserve the existing route, method, body, and auth modes", async () => {
  const captured: Array<{ body: string | undefined; headers: Headers; method: string; url: string }> = [];
  const client = createTestClient({ fetchImplementation: async (url, init) => {
    captured.push({ body: init?.body === undefined ? undefined : String(init.body), headers: new Headers(init?.headers), method: init?.method ?? "", url: String(url) });
    const path = new URL(String(url)).pathname;
    if (path === "/v1/me") return new Response(JSON.stringify({ user: {
      id: "00000000-0000-4000-8000-000000000303",
      createdAt: "2026-10-04T10:20:30.000Z",
      acceptedTermsVersion: null,
      identity: { provider: "firebase", subject: "provider-subject", email: null, emailVerified: true },
    } }), { status: 200 });
    if (path === "/v1/account/deletion") return new Response(JSON.stringify(deletionResponse("deleted")), { status: 200 });
    if (path === `/v1/public/deletion-proofs/${DELETION_PROOF_ID}`) return new Response(JSON.stringify(deletionResponse("deleted")), { status: 200 });
    if (path === "/v1/public/deletion-operations/status") return new Response(JSON.stringify(deletionResponse("pending", DELETION_OPERATION_ID, null)), { status: 200 });
    throw new Error(`unexpected path: ${path}`);
  } });

  await client.getMe();
  await client.deleteAccount(DELETION_OPERATION_ID, "a".repeat(64));
  await client.getDeletionProof(DELETION_PROOF_ID);
  await client.getDeletionOperationStatus(DELETION_OPERATION_ID, "a".repeat(64));

  assert.deepEqual(captured.map(({ method, url, body }) => ({ method, url, body })), [
    { method: "GET", url: `${API_ORIGIN}/v1/me`, body: undefined },
    { method: "POST", url: `${API_ORIGIN}/v1/account/deletion`, body: JSON.stringify({ operationId: DELETION_OPERATION_ID, operationSecret: "a".repeat(64) }) },
    { method: "GET", url: `${API_ORIGIN}/v1/public/deletion-proofs/${DELETION_PROOF_ID}`, body: undefined },
    { method: "POST", url: `${API_ORIGIN}/v1/public/deletion-operations/status`, body: JSON.stringify({ operationId: DELETION_OPERATION_ID, operationSecret: "a".repeat(64) }) },
  ]);
  assert.equal(captured[0]?.headers.get("authorization"), "Bearer id-token");
  assert.equal(captured[0]?.headers.get("x-firebase-appcheck"), "app-check-token");
  assert.equal(captured[1]?.headers.get("authorization"), "Bearer id-token");
  assert.equal(captured[1]?.headers.get("x-firebase-appcheck"), "app-check-token");
  assert.equal(captured[2]?.headers.get("authorization"), null);
  assert.equal(captured[2]?.headers.get("x-firebase-appcheck"), "app-check-token");
  assert.equal(captured[3]?.headers.get("authorization"), null);
  assert.equal(captured[3]?.headers.get("x-firebase-appcheck"), "app-check-token");
});

test("client rejects an unconfigured environment and missing authentication", async () => {
  assert.throws(() => createPatternlyApiClient({ apiOrigin: "http://127.0.0.1:8080", getIdToken: async () => "token" }), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "client_unconfigured");
  const client = createTestClient({ getIdToken: async () => null, fetchImplementation: async () => new Response("{}") });
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "authentication_required");
});

test("account session exchange sends an empty authenticated request and parses its custom token", async () => {
  const captured: Array<{ body: string | undefined; headers: Headers; method: string; url: string }> = [];
  const client = createTestClient({ fetchImplementation: async (url, init) => {
    captured.push({ body: init?.body === undefined ? undefined : String(init.body), headers: new Headers(init?.headers), method: init?.method ?? "", url: String(url) });
    return new Response(JSON.stringify({ customToken: "session-custom-token" }), { status: 200 });
  } });

  assert.deepEqual(await client.exchangeAccountSession(), { customToken: "session-custom-token" });
  assert.deepEqual(captured[0] && { body: captured[0].body, method: captured[0].method, url: captured[0].url }, {
    body: undefined,
    method: "POST",
    url: `${API_ORIGIN}/v1/account/session/exchange`,
  });
  assert.equal(captured[0]?.headers.get("authorization"), "Bearer id-token");
  assert.equal(captured[0]?.headers.get("x-firebase-appcheck"), "app-check-token");
});

test("account session exchange rejects a missing custom token", async () => {
  const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({}), { status: 200 }) });
  await assert.rejects(client.exchangeAccountSession(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("account registration validates and preserves distinct Terms and Privacy evidence", async () => {
  const acceptance = {
    termsVersion: "terms-v1",
    termsLocale: "en",
    privacyPolicyVersion: "privacy-v2",
    privacyPolicyLocale: "pl",
    privacyPolicyAcknowledged: true,
    acceptedAt: "2026-09-27T10:00:00.000Z",
  };
  const user = {
    id: "account-id",
    createdAt: "2026-09-27T10:00:00.000Z",
    acceptedTermsVersion: "terms-v1",
    identity: { provider: "apple", subject: "synthetic-subject", email: null, emailVerified: true },
  };
  const createdClient = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ registration: { created: true, user, acceptance } }), { status: 201 }) });
  assert.deepEqual((await createdClient.registerAccount({
    termsVersion: "terms-v1",
    termsLocale: "en",
    privacyPolicyVersion: "privacy-v2",
    privacyPolicyLocale: "pl",
    privacyPolicyAcknowledged: true,
  })).registration.acceptance, acceptance);

  const existingClient = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ registration: { created: false, user, acceptance: null } }), { status: 200 }) });
  assert.deepEqual(await existingClient.registerAccount({
    termsVersion: "terms-v1",
    termsLocale: "en",
    privacyPolicyVersion: "privacy-v2",
    privacyPolicyLocale: "pl",
    privacyPolicyAcknowledged: true,
  }), { registration: { created: false, user, acceptance: null } });

  const malformedClient = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ registration: { created: true, user, acceptance: { ...acceptance, privacyPolicyAcknowledged: false } } }), { status: 201 }) });
  await assert.rejects(malformedClient.registerAccount({
    termsVersion: "terms-v1",
    termsLocale: "en",
    privacyPolicyVersion: "privacy-v2",
    privacyPolicyLocale: "pl",
    privacyPolicyAcknowledged: true,
  }), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("session revocation accepts only the exact operation and a nonempty replacement token", async () => {
  const operationId = "00000000-0000-4000-8000-000000000001";
  const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ status: "revoked", operationId, customToken: "replacement-token" }), { status: 200 }) });
  assert.deepEqual(await client.revokeSessions(operationId), { status: "revoked", operationId, customToken: "replacement-token" });

  for (const response of [
    { status: "revoked", operationId },
    { status: "revoked", operationId: "00000000-0000-4000-8000-000000000002", customToken: "replacement-token" },
    { status: "pending", operationId, customToken: "replacement-token" },
  ]) {
    const invalid = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(response), { status: 200 }) });
    await assert.rejects(invalid.revokeSessions(operationId), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }
});

test("recovery operation methods use the canonical paths, proof body, and authentication modes", async () => {
  const requests: Array<{ body: unknown; headers: Headers; method: string; url: URL }> = [];
  const responses: readonly unknown[] = [
    { operationId: RECOVERY_OPERATION_ID, status: "result_available", generationId: "generation-recovery-1", authorizationGeneration: 4, codes: RECOVERY_CODES },
    { operationId: RECOVERY_OPERATION_ID, status: "provider_retryable", authorizationGeneration: 4 },
    { operationId: RECOVERY_OPERATION_ID, status: "acknowledged", authorizationGeneration: 4 },
    { operationId: RECOVERY_OPERATION_ID, status: "result_available", firebaseUid: "firebase-uid", authorizationGeneration: 5, customToken: "recovery-custom-token" },
    { operationId: RECOVERY_OPERATION_ID, status: "in_progress" },
    { operationId: RECOVERY_OPERATION_ID, status: "acknowledged", authorizationGeneration: 5 },
  ];
  let responseIndex = 0;
  const client = createTestClient({ fetchImplementation: async (url, init) => {
    const requestUrl = new URL(String(url));
    const text = init?.body === undefined ? undefined : String(init.body);
    requests.push({ body: text === undefined ? undefined : JSON.parse(text) as unknown, headers: new Headers(init?.headers), method: init?.method ?? "", url: requestUrl });
    const response = responses[responseIndex++];
    return new Response(JSON.stringify(response), { status: 200 });
  } });

  assert.deepEqual(await client.issueRecoveryCodes(RECOVERY_OPERATION_ID), responses[0]);
  assert.deepEqual(await client.getRecoveryCodeIssueStatus(RECOVERY_OPERATION_ID), responses[1]);
  assert.deepEqual(await client.acknowledgeRecoveryCodesSaved(RECOVERY_OPERATION_ID), responses[2]);
  assert.deepEqual(await client.consumeRecoveryCode(RECOVERY_OPERATION_ID, RECOVERY_CODE), responses[3]);
  assert.deepEqual(await client.getRecoveryCodeConsumeStatus(RECOVERY_OPERATION_ID, RECOVERY_CODE), responses[4]);
  assert.deepEqual(await client.acknowledgeRecoveryCodeConsumption(RECOVERY_OPERATION_ID), responses[5]);

  assert.deepEqual(requests.map(({ method, url }) => [method, `${url.pathname}${url.search}`]), [
    ["POST", "/v1/account/recovery-codes"],
    ["GET", `/v1/account/recovery-codes/issue/status?operationId=${RECOVERY_OPERATION_ID}`],
    ["POST", "/v1/account/recovery-codes/issue/saved-ack"],
    ["POST", "/v1/public/recovery-codes/consume"],
    ["POST", "/v1/public/recovery-codes/consume/status"],
    ["POST", "/v1/account/recovery-codes/consume/ack"],
  ]);
  assert.deepEqual(requests.map(({ body }) => body), [
    { operationId: RECOVERY_OPERATION_ID },
    undefined,
    { operationId: RECOVERY_OPERATION_ID },
    { operationId: RECOVERY_OPERATION_ID, code: RECOVERY_CODE },
    { operationId: RECOVERY_OPERATION_ID, code: RECOVERY_CODE },
    { operationId: RECOVERY_OPERATION_ID },
  ]);
  for (const request of requests) assert.equal(request.headers.get("x-firebase-appcheck"), "app-check-token");
  for (const request of [requests[0], requests[1], requests[2], requests[5]]) assert.equal(request?.headers.get("authorization"), "Bearer id-token");
  for (const request of [requests[3], requests[4]]) assert.equal(request?.headers.has("authorization"), false, "public proof calls do not send a bearer token");
  assert.equal(requests[4]?.url.search, "", "recovery proof is never placed in the status URL");
});

test("recovery operation parsers reject malformed, mismatched, and extended server results", async () => {
  const invalidIssueResults: readonly unknown[] = [
    { operationId: "00000000-0000-4000-8000-000000000102", status: "provider_retryable" },
    { operationId: RECOVERY_OPERATION_ID, status: "result_available", generationId: "generation-1", authorizationGeneration: 0, codes: RECOVERY_CODES },
    { operationId: RECOVERY_OPERATION_ID, status: "result_available", generationId: "generation-1", authorizationGeneration: 2, codes: RECOVERY_CODES.slice(0, 9) },
    { operationId: RECOVERY_OPERATION_ID, status: "result_available", generationId: "generation-1", authorizationGeneration: 2, codes: ["bad-code", ...RECOVERY_CODES.slice(1)] },
    { operationId: RECOVERY_OPERATION_ID, status: "unexpected_status" },
    { operationId: RECOVERY_OPERATION_ID, status: "provider_retryable", customToken: "must-not-be-accepted" },
  ];
  for (const payload of invalidIssueResults) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(payload), { status: 200 }) });
    await assert.rejects(client.issueRecoveryCodes(RECOVERY_OPERATION_ID), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }

  const invalidConsumeResults: readonly unknown[] = [
    { operationId: "00000000-0000-4000-8000-000000000102", status: "in_progress" },
    { operationId: RECOVERY_OPERATION_ID, status: "result_available", firebaseUid: "", authorizationGeneration: 1, customToken: "secret-token" },
    { operationId: RECOVERY_OPERATION_ID, status: "result_available", firebaseUid: "uid", authorizationGeneration: 0, customToken: "secret-token" },
    { operationId: RECOVERY_OPERATION_ID, status: "result_available", firebaseUid: "uid", authorizationGeneration: 1, customToken: "secret-token", recoveryCodes: RECOVERY_CODES },
    { operationId: RECOVERY_OPERATION_ID, status: "delivery_unconfirmed", authorizationGeneration: 1, customToken: "must-not-be-accepted" },
  ];
  for (const payload of invalidConsumeResults) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(payload), { status: 200 }) });
    await assert.rejects(client.getRecoveryCodeConsumeStatus(RECOVERY_OPERATION_ID, RECOVERY_CODE), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }

  for (const payload of [
    { operationId: "00000000-0000-4000-8000-000000000102", status: "acknowledged", authorizationGeneration: 1 },
    { operationId: RECOVERY_OPERATION_ID, status: "in_progress", authorizationGeneration: 1 },
    { operationId: RECOVERY_OPERATION_ID, status: "acknowledged", authorizationGeneration: 0 },
    { operationId: RECOVERY_OPERATION_ID, status: "acknowledged", authorizationGeneration: 1, customToken: "must-not-be-accepted" },
  ]) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(payload), { status: 200 }) });
    await assert.rejects(client.acknowledgeRecoveryCodesSaved(RECOVERY_OPERATION_ID), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }
});

test("recovery calls reject invalid operation IDs and proofs before token acquisition or network use", async () => {
  let tokenCalls = 0;
  let requests = 0;
  const client = createTestClient({
    getIdToken: async () => { tokenCalls += 1; return "id-token"; },
    fetchImplementation: async () => { requests += 1; return new Response("{}", { status: 200 }); },
  });
  await assert.rejects(client.issueRecoveryCodes("not-an-operation-id"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  await assert.rejects(client.getRecoveryCodeIssueStatus("not-an-operation-id"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  await assert.rejects(client.consumeRecoveryCode("not-an-operation-id", RECOVERY_CODE), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  await assert.rejects(client.getRecoveryCodeConsumeStatus(RECOVERY_OPERATION_ID, "bad-proof"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  assert.equal(tokenCalls, 0);
  assert.equal(requests, 0);
});

test("recovery calls preserve typed server failures and Retry-After", async () => {
  const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ error: { code: "recovery_operation_pending" } }), { status: 503, headers: { "retry-after": "12" } }) });
  await assert.rejects(client.getRecoveryCodeIssueStatus(RECOVERY_OPERATION_ID), (error: unknown) => error instanceof PatternlyApiClientError
    && error.code === "server_error" && error.status === 503 && error.serverCode === "recovery_operation_pending" && error.retryAfterSeconds === 12);
});

function packageDescriptor(trackId = "coding-interview-dsa-problem-solving", nodeId = "package-test-node") {
  const now = Math.floor(Date.now() / 1000) * 1000;
  const path = `packages/${trackId}/${nodeId}/${"a".repeat(64)}.gzip`;
  const params = new URLSearchParams({ generation: "12345678901234567", "X-Goog-Algorithm": "GOOG4-RSA-SHA256", "X-Goog-Date": new Date(now).toISOString().replace(/[-:]/gu, "").replace(".000", ""), "X-Goog-Expires": "60", "X-Goog-Signature": "fixture" });
  return { schemaVersion: "patternly-content-download-v1", manifest: { schemaVersion: "patternly-content-node-package-v1", trackId, nodeId, contentVersion: "v1", artifactSha256: "b".repeat(64), packageSha256: "a".repeat(64), contentReleaseId: "release-1", minimumAppVersion: "0.1.0", packageFormat: "gzip", compressedSizeBytes: 3, artifactSizeBytes: 10, packagePath: path }, object: { bucket: "patternly-contract", path, generation: "12345678901234567" }, downloadUrl: `https://storage.googleapis.com/patternly-contract/${path}?${params}`, expiresAt: new Date(now + 60000).toISOString() };
}

test("content package descriptor authenticates only the API; object GET has no credentials and preserves verification metadata", async () => {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const descriptor = packageDescriptor();
  const client = createTestClient({ fetchImplementation: async (url, init) => {
    calls.push({ url: String(url), init });
    return calls.length === 1 ? Response.json(descriptor) : new Response(new Uint8Array([0x1f, 0x8b, 0x00]), { headers: { "content-type": "application/gzip" } });
  } });
  const response = await client.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node");
  assert.equal(calls[0]?.url, `${API_ORIGIN}/v1/content/packages/coding-interview-dsa-problem-solving/package-test-node`);
  assert.equal(new Headers(calls[0]?.init?.headers).get("authorization"), "Bearer id-token");
  assert.equal(new Headers(calls[0]?.init?.headers).get("x-firebase-appcheck"), "app-check-token");
  assert.equal(calls[1]?.url, descriptor.downloadUrl);
  assert.equal(calls[1]?.init?.headers, undefined);
  assert.equal(calls[1]?.init?.credentials, "omit");
  assert.equal(calls[1]?.init?.redirect, "error");
  assert.deepEqual([...response.bytes], [0x1f, 0x8b, 0x00]);
  assert.equal(response.headers.get("x-content-package-sha256"), "a".repeat(64));
  await assert.rejects(client.getContentPackage("track", "../escape"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("content package transport caps descriptor and downloaded bytes and rejects transformed objects", async () => {
  for (const mode of ["descriptor", "bytes", "encoding", "redirect", "expired_object", "offline"] as const) {
    let calls = 0;
    const client = createTestClient({ fetchImplementation: async () => {
      if (++calls === 1) return mode === "descriptor" ? new Response(new Uint8Array(16 * 1024 + 1)) : Response.json(packageDescriptor());
      if (mode === "offline") throw new Error("offline");
      if (mode === "expired_object") return new Response("expired", { status: 403 });
      const response = new Response(new Uint8Array(mode === "bytes" ? 2 * 1024 * 1024 + 1 : 3), { headers: { "content-type": "application/gzip", ...(mode === "encoding" ? { "content-encoding": "gzip" } : {}) } });
      if (mode === "redirect") Object.defineProperty(response, "redirected", { value: true });
      return response;
    } });
    await assert.rejects(client.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node"), (error: unknown) => error instanceof PatternlyApiClientError && ["invalid_response", "transport_failed"].includes(error.code), mode);
  }
});

test("invalid descriptor identity, URL, expiry and legacy stream never dispatch an object request", async () => {
  for (const change of [
    (v: ReturnType<typeof packageDescriptor>) => { v.downloadUrl = v.downloadUrl.replace("storage.googleapis.com", "attacker.example"); },
    (v: ReturnType<typeof packageDescriptor>) => { v.object.generation = "7"; },
    (v: ReturnType<typeof packageDescriptor>) => { v.manifest.nodeId = "other-node"; },
    (v: ReturnType<typeof packageDescriptor>) => { v.expiresAt = "2000-01-01T00:00:00.000Z"; },
    (v: ReturnType<typeof packageDescriptor>) => { v.downloadUrl += "#fragment"; },
    (v: ReturnType<typeof packageDescriptor>) => { v.manifest.compressedSizeBytes = 2097153; },
  ]) {
    let calls = 0; const descriptor = packageDescriptor(); change(descriptor);
    const client = createTestClient({ fetchImplementation: async () => { calls++; return Response.json(descriptor); } });
    await assert.rejects(client.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
    assert.equal(calls, 1);
  }
  const legacy = createTestClient({ fetchImplementation: async () => new Response(new Uint8Array([31,139]), { headers: { "content-type": "application/gzip" } }) });
  await assert.rejects(legacy.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("profile guard cancels after credentials, descriptor or object await with no stale success", async () => {
  for (const stage of ["token", "descriptor", "object"] as const) {
    let current = true, calls = 0;
    const client = createTestClient({ getIdToken: async () => { if (stage === "token") current = false; return "id-token"; }, fetchImplementation: async () => {
      calls++; if (stage === "descriptor" || stage === "object" && calls === 2) current = false;
      return calls === 1 ? Response.json(packageDescriptor()) : new Response(new Uint8Array(3), { headers: { "content-type": "application/gzip" } });
    } });
    await assert.rejects(client.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node", () => current), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "profile_changed");
    assert.equal(calls, stage === "token" ? 0 : stage === "descriptor" ? 1 : 2);
  }
});

test("content package transport preserves typed backend admission codes", async () => {
  for (const [status, code] of [[401, "authorization_generation_stale"], [403, "entitlement_required"], [404, "not_found"], [503, "entitlement_unavailable"]] as const) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ error: { code } }), { status }) });
    await assert.rejects(client.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "server_error" && error.status === status && error.serverCode === code);
  }
});

test("mobile requests fail before transport when App Check is unavailable", async () => {
  let calls = 0;
  const client = createPatternlyApiClient({
    apiOrigin: API_ORIGIN,
    getIdToken: async () => "id-token",
    getAppCheckToken: async () => null,
    fetchImplementation: async () => { calls += 1; return new Response("{}"); },
  });
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "app_check_unavailable");
  assert.equal(calls, 0);
});

test("canonical progress transport has no protocol query or version labels", async () => {
  const calls: Array<{ body: unknown; method: string; url: string }> = [];
  const client = createTestClient({
    fetchImplementation: async (url, init) => {
      calls.push({ body: init?.body ? JSON.parse(String(init.body)) : undefined, method: init?.method ?? "", url: String(url) });
      if (String(url).includes("/v1/progress?")) return new Response(JSON.stringify({ accountRevision: 0, generation: 0, snapshotToken: FINGERPRINT, snapshotScope: FINGERPRINT, records: [], nextPageToken: null }), { status: 200 });
      if (String(url).endsWith("/v1/progress/sync")) return new Response(JSON.stringify({ accountRevision: 1, applied: [], duplicates: [], conflicts: [] }), { status: 200 });
      return new Response(JSON.stringify({ status: "ok", service: "patternly-backend" }), { status: 200 });
    },
  });

  await client.getProgress();
  await client.syncProgress(canonicalSyncRequest());
  assert.deepEqual(calls.map(({ method, url }) => [method, url]), [
    ["GET", `${API_ORIGIN}/v1/progress?pageSize=100&conditional=1`],
    ["POST", `${API_ORIGIN}/v1/progress/sync`],
  ]);
  const body = calls[1]?.body as Record<string, unknown>;
  assert.equal(Object.prototype.hasOwnProperty.call(body, "protocolVersion"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(body, "contentIdentitySchema"), false);
  assert.equal(body.canonicalVersion, "canonical-json-v1");
});

test("client rejects removed protocol fields before sending a sync request", async () => {
  let calls = 0;
  const client = createTestClient({ fetchImplementation: async () => { calls += 1; return new Response("{}"); } });
  const legacy = { ...canonicalSyncRequest(), protocolVersion: 4 } as never;
  await assert.rejects(client.syncProgress(legacy), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  assert.equal(calls, 0);
});

test("client accepts canonical identity lengths supported by content", async () => {
  const longTrackId = "t".repeat(129);
  const longQuestionId = "q".repeat(257);
  const calls: unknown[] = [];
  const client = createTestClient({ fetchImplementation: async (_url, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ accountRevision: 1, applied: [], duplicates: [], conflicts: [] }), { status: 200 });
  } });
  const item = { trackId: longTrackId, questionId: longQuestionId, contentVersion: "release", artifactSha256: FINGERPRINT };
  await client.syncProgress(canonicalSyncRequest(activeTrackMutation({
    kind: "item", recordType: "training_attempt", trackId: longTrackId, targetId: longQuestionId,
    state: { id: longQuestionId, sessionId: "session", trackId: longTrackId, modeId: "mode", occurrenceId: "occurrence", item,
      response: { type: "choice_single", optionId: "a" }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
      reviewEvidence: { sourceItem: { ...item }, taxonomyOrSkillRefs: [] }, answeredAt: "2026-10-14T10:00:00.000Z", committedAt: "2026-10-14T10:00:00.000Z" },
  })));
  assert.equal(calls.length, 1);
});

test("client turns removed identity metadata in a response into a schema conflict", async () => {
  const record = {
    kind: "node",
    recordType: "active_track",
    trackId: "coding-interview-dsa-problem-solving",
    targetId: "current",
    version: 1,
    fingerprint: FINGERPRINT,
    state: { trackId: "coding-interview-dsa-problem-solving", protocolVersion: 4 },
    lastMutationId: "mutation-canonical-0001",
    updatedAt: "2026-09-12T10:00:00.000Z",
  };
  const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ accountRevision: 1, generation: 0, snapshotToken: FINGERPRINT, snapshotScope: FINGERPRINT, records: [record], nextPageToken: null }), { status: 200 }) });
  await assert.rejects(client.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "server_error" && error.serverCode === "content_identity_schema_conflict");
});

test("progress sweep preserves opaque tokens and returns only the complete dataset", async () => {
  const record = { ...activeTrackMutation(), version: 1, lastMutationId: "mutation-canonical-0001", updatedAt: "2026-10-12T00:00:00.000Z" };
  const { mutationId: _mutationId, expectedVersion: _expectedVersion, ...first } = record;
  const second = { ...first, trackId: "backend-system-design-interview", state: { trackId: "backend-system-design-interview" } };
  const urls: string[] = [];
  const opaque = "cursor/+?=";
  const client = createTestClient({ fetchImplementation: async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ accountRevision: 2, generation: 3, snapshotToken: FINGERPRINT, snapshotScope: FINGERPRINT, records: urls.length === 1 ? [first] : [second], nextPageToken: urls.length === 1 ? opaque : null }), { status: 200 });
  } });
  const response = await client.getProgress();
  assert.deepEqual(response.records, [first, second]);
  assert.equal(response.accountRevision, 2);
  assert.equal(response.generation, 3);
  assert.deepEqual(urls, [`${API_ORIGIN}/v1/progress?pageSize=100&conditional=1`, `${API_ORIGIN}/v1/progress?pageSize=100&conditional=1&pageToken=${encodeURIComponent(opaque)}`]);
});

test("progress sweep rejects a later-page conflict instead of returning partial facts", async () => {
  for (const scenario of ["revision", "generation", "serverConflict"] as const) {
    let pages = 0;
    const client = createTestClient({ fetchImplementation: async () => {
      pages++;
      if (pages === 2 && scenario === "serverConflict") return new Response(JSON.stringify({ error: { code: "progress_generation_conflict" } }), { status: 409 });
      return new Response(JSON.stringify({ accountRevision: pages === 2 && scenario === "revision" ? 2 : 1, generation: pages === 2 && scenario === "generation" ? 1 : 0, snapshotToken: FINGERPRINT, snapshotScope: FINGERPRINT, records: [], nextPageToken: pages === 1 ? "opaque-next-page" : null }), { status: 200 });
    } });
    await assert.rejects(client.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "server_error" && error.status === 409 && error.serverCode === "progress_generation_conflict");
    assert.equal(pages, 2);
  }
});

test("sync 409 uses one error envelope and preserves revision and schema issues", async () => {
  const bodies = [
    { code: "version_conflict" },
    { code: "account_revision_conflict", currentAccountRevision: 8 },
    { code: "content_identity_schema_conflict" },
    { code: "content_identity_schema_conflict", issues: ["mutations.0.state"] },
    { code: "mutation_id_reuse" },
    { code: "progress_generation_conflict" },
    { code: "authorization_generation_conflict" },
  ];
  for (const body of bodies) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ error: body }), { status: 409 }) });
    await assert.rejects(client.syncProgress(canonicalSyncRequest()), (error: unknown) => {
      assert.ok(error instanceof PatternlyApiClientError);
      assert.equal(error.code, "server_error");
      assert.equal(error.status, 409);
      assert.equal(error.serverCode, body.code);
      assert.equal(error.details?.currentAccountRevision, body.currentAccountRevision);
      assert.deepEqual(error.details?.issues, body.issues);
      return true;
    });
  }
});

test("sync rejects legacy, malformed, ambiguous and disguised-success conflict payloads", async () => {
  const rawConflict = { accountRevision: 1, applied: [], duplicates: [], conflicts: [{ mutationId: "mutation-canonical-0001", code: "version_conflict", current: null }] };
  const cases = [
    { status: 409, body: rawConflict },
    { status: 409, body: { error: { code: "account_revision_conflict" } } },
    { status: 409, body: { error: { code: "account_revision_conflict", currentAccountRevision: -1 } } },
    { status: 409, body: { error: { code: "account_revision_conflict", currentAccountRevision: "8" } } },
    { status: 409, body: { error: { code: "account_revision_conflict", currentAccountRevision: 1.5 } } },
    { status: 409, body: { error: { code: "account_revision_conflict", currentAccountRevision: Number.MAX_SAFE_INTEGER + 1 } } },
    { status: 409, body: { error: { code: "version_conflict", current: null } } },
    { status: 409, body: { error: { code: "version_conflict", currentAccountRevision: 8 } } },
    { status: 409, body: { error: { code: "content_identity_schema_conflict", issues: [1] } } },
    { status: 409, body: { error: { code: "unknown_conflict" } } },
    { status: 409, body: { error: { code: "version_conflict" }, ...rawConflict } },
    { status: 409, body: null },
    { status: 200, body: rawConflict },
    { status: 200, body: { accountRevision: 1, applied: [], duplicates: [], conflicts: [], accountRevisionConflict: { code: "account_revision_conflict", currentAccountRevision: 8 } } },
    { status: 200, body: { error: { code: "version_conflict" } } },
  ];
  for (const { status, body } of cases) {
    const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify(body), { status }) });
    await assert.rejects(client.syncProgress(canonicalSyncRequest()), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response", JSON.stringify({ status, body }));
  }
  const malformedJson = createTestClient({ fetchImplementation: async () => new Response("{", { status: 409 }) });
  await assert.rejects(malformedJson.syncProgress(canonicalSyncRequest()), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("purchase attempt transport validates exact ID, claim permission and bounded case state", async () => {
  const attemptId = RECOVERY_OPERATION_ID;
  const attempt = { attemptId, outcome: "initiated", acceptedAt: "2026-10-15T10:00:00.000Z", startExpiresAt: "2026-10-15T10:15:00.000Z", initiatedAt: "2026-10-15T10:01:00.000Z", transactionKey: null, resolutionReason: null, dispatchAllowed: true };
  let body: unknown = { attempt };
  const requests: Array<{ path: string; method: string }> = [];
  const client = createTestClient({ fetchImplementation: async (url, init) => { requests.push({ path: String(url), method: String(init?.method) }); return new Response(JSON.stringify(body), { status: 200 }); } });
  assert.equal((await client.commandPurchaseAttempt(attemptId, { action: "claim" })).attempt.dispatchAllowed, true);
  for (const invalid of [{ ...attempt, attemptId: DELETION_OPERATION_ID }, { ...attempt, outcome: "bound" }, { ...attempt, initiatedAt: attempt.startExpiresAt }, { ...attempt, outcome: "fake_success" }]) {
    body = { attempt: invalid };
    await assert.rejects(client.getPurchaseAttempt(attemptId), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }
  body = { items: [{ transactionKey: "a".repeat(64), revision: 1, status: "reconciliation_required", resolutionReason: "outside_confirmation_window", confirmationId: null, receiptId: null }], truncated: false };
  assert.equal((await client.getPurchaseCases()).items[0]?.resolutionReason, "outside_confirmation_window");
  body = { items: [], truncated: "false" };
  await assert.rejects(client.getPurchaseCases(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  assert.equal(requests[0]?.method, "POST"); assert.match(requests[0]!.path, /purchase-attempts/);
});


test("package descriptor and object requests share a bounded deadline with no automatic retry", async () => {
  for (const stage of ["descriptor", "object"] as const) {
    let calls = 0;
    const client = createTestClient({ timeoutMs: 15, fetchImplementation: async () => {
      calls++;
      if (stage === "descriptor" || calls === 2) return new Promise<Response>(() => {});
      return Response.json(packageDescriptor());
    } });
    await assert.rejects(client.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "request_timeout");
    assert.equal(calls, stage === "descriptor" ? 1 : 2);
  }
});


test("profile change wins over rejected credential or network awaits before failure classification", async () => {
  for (const stage of ["token", "appcheck", "descriptor", "object"] as const) {
    let current = true, calls = 0;
    const rejectStale = () => { current = false; throw new Error("offline"); };
    const client = createTestClient({ getIdToken: async () => stage === "token" ? rejectStale() : "id-token", getAppCheckToken: async () => stage === "appcheck" ? rejectStale() : "app-check-token", fetchImplementation: async () => {
      calls++;
      if (stage === "descriptor" || stage === "object" && calls === 2) return rejectStale();
      return Response.json(packageDescriptor());
    } });
    await assert.rejects(client.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node", () => current), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "profile_changed", stage);
    assert.equal(calls, stage === "token" || stage === "appcheck" ? 0 : stage === "descriptor" ? 1 : 2);
  }
});

function conditionalProgressRecord(trackId = "coding-interview-dsa-problem-solving") {
  const { mutationId: _mutationId, expectedVersion: _expectedVersion, ...record } = activeTrackMutation();
  return { ...record, trackId, state: { trackId }, version: 1, lastMutationId: "conditional-mutation-0001", updatedAt: "2026-10-12T00:00:00.000Z" };
}
const jsonResponse = (value: unknown) => new Response(JSON.stringify(value), { status: 200 });

test("conditional progress isolates nested cached facts and still requests fresh authorization", async () => {
  const token = "a".repeat(64); const urls: string[] = []; let authCalls = 0;
  const client = createTestClient({ getIdToken: async () => { authCalls++; return "id-token"; }, fetchImplementation: async (url) => {
    urls.push(String(url));
    return jsonResponse(urls.length === 1
      ? { accountRevision: 1, generation: 0, snapshotToken: token, snapshotScope: token, records: [conditionalProgressRecord()], nextPageToken: null }
      : { accountRevision: 1, generation: 0, snapshotToken: token, snapshotScope: token, unchanged: true });
  } });
  const first = await client.getProgress();
  (first.records[0]!.state as { trackId: string }).trackId = "consumer-corruption";
  const second = await client.getProgress();
  assert.equal(second.records[0]!.state.trackId, "coding-interview-dsa-problem-solving");
  (second.records[0]!.state as { trackId: string }).trackId = "second-corruption";
  assert.equal((await client.getProgress()).records[0]!.state.trackId, "coding-interview-dsa-problem-solving");
  assert.equal(new URL(urls[1]!).searchParams.get("knownSnapshot"), token);
  assert.equal(authCalls, 3);
});

test("conditional progress rejects unseeded, mismatched and malformed unchanged responses", async () => {
  for (const patch of [{ snapshotToken: "b".repeat(64) }, { snapshotScope: "b".repeat(64) }, { accountRevision: 2 }, { generation: 2 }, { records: [] }]) {
    let calls = 0; const urls: string[] = []; const token = "a".repeat(64);
    const client = createTestClient({ fetchImplementation: async (url) => {
      urls.push(String(url)); calls++;
      return jsonResponse(calls === 1 || calls === 3
        ? { accountRevision: 1, generation: 0, snapshotToken: token, snapshotScope: token, records: [], nextPageToken: null }
        : { accountRevision: 1, generation: 0, snapshotToken: token, snapshotScope: token, unchanged: true, ...patch });
    } });
    await client.getProgress();
    await assert.rejects(client.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
    await client.getProgress();
    assert.equal(new URL(urls[2]!).searchParams.has("knownSnapshot"), false, "failed reads discard their cache without fallback");
  }
  const unseeded = createTestClient({ fetchImplementation: async () => jsonResponse({ accountRevision: 0, generation: 0, snapshotToken: "a".repeat(64), snapshotScope: FINGERPRINT, unchanged: true }) });
  await assert.rejects(unseeded.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("incomplete or mixed snapshot sweeps never become a conditional baseline", async () => {
  for (const failure of ["transport", "snapshot", "unchanged"]) {
    let calls = 0; const urls: string[] = [];
    const client = createTestClient({ fetchImplementation: async (url) => {
      calls++; urls.push(String(url));
      if (calls === 2 && failure === "transport") throw new Error("offline");
      if (calls === 2 && failure === "unchanged") return jsonResponse({ accountRevision: 1, generation: 0, snapshotToken: "a".repeat(64), snapshotScope: FINGERPRINT, unchanged: true });
      return jsonResponse({ accountRevision: 1, generation: 0, snapshotToken: (calls === 2 ? "b" : "a").repeat(64), snapshotScope: FINGERPRINT, records: [], nextPageToken: calls === 1 ? "next" : null });
    } });
    await assert.rejects(client.getProgress());
    await client.getProgress();
    assert.equal(new URL(urls[2]!).searchParams.has("knownSnapshot"), false);
  }
});

test("one adapter cannot reuse account A facts for account B at the same revision and generation", async () => {
  let actor = "a"; const seen: string[] = [];
  const client = createTestClient({ getIdToken: async () => actor, fetchImplementation: async (url, init) => {
    const subject = new Headers(init?.headers).get("authorization")!.slice(7);
    const token = subject.repeat(64); seen.push(subject);
    const common = { accountRevision: 1, generation: 0, snapshotToken: token, snapshotScope: token };
    return jsonResponse(new URL(String(url)).searchParams.get("knownSnapshot") === token
      ? { ...common, unchanged: true }
      : { ...common, records: [conditionalProgressRecord(subject === "a" ? "coding-interview-dsa-problem-solving" : "backend-system-design-interview")], nextPageToken: null });
  } });
  assert.equal((await client.getProgress()).records[0]!.trackId, "coding-interview-dsa-problem-solving");
  actor = "b";
  assert.equal((await client.getProgress()).records[0]!.trackId, "backend-system-design-interview");
  assert.equal((await client.getProgress()).records[0]!.trackId, "backend-system-design-interview");
  assert.deepEqual(seen, ["a", "b", "b"]);
});

test("concurrent completion can only cause a cache miss after a newer revision", async () => {
  let release!: (response: Response) => void; let dispatched!: () => void;
  const dispatchedPromise = new Promise<void>((resolve) => { dispatched = resolve; });
  let calls = 0; const urls: string[] = [];
  const full = (revision: number) => jsonResponse({ accountRevision: revision, generation: 0, snapshotToken: String(revision).repeat(64), snapshotScope: FINGERPRINT, records: [], nextPageToken: null });
  const client = createTestClient({ fetchImplementation: async (url) => {
    calls++; urls.push(String(url));
    if (calls === 1) { dispatched(); return new Promise<Response>((resolve) => { release = resolve; }); }
    return full(2);
  } });
  const old = client.getProgress(); await dispatchedPromise;
  assert.equal((await client.getProgress()).accountRevision, 2);
  release(full(1)); assert.equal((await old).accountRevision, 1);
  assert.equal((await client.getProgress()).accountRevision, 2);
  assert.equal(new URL(urls[2]!).searchParams.get("knownSnapshot"), "1".repeat(64));
});


test("conditional reads reject tokenless full pages instead of downgrading the contract", async () => {
  const client = createTestClient({ fetchImplementation: async () => jsonResponse({ accountRevision: 0, generation: 0, records: [], nextPageToken: null }) });
  await assert.rejects(client.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("oversize cache and serialization failure preserve a complete validated read without seeding cache", async () => {
  for (const failure of ["oversize", "serialization"] as const) {
    const record = conditionalProgressRecord(failure === "oversize" ? "x".repeat(1024) : undefined);
    const pages = failure === "oversize" ? 100 : 1;
    const pageRecords = Array.from({ length: failure === "oversize" ? 100 : 1 }, () => record);
    const urls: string[] = [];
    const client = createTestClient({ fetchImplementation: async (url) => {
      urls.push(String(url));
      return jsonResponse({ accountRevision: 1, generation: 0, snapshotToken: FINGERPRINT, snapshotScope: FINGERPRINT, records: pageRecords, nextPageToken: urls.length % pages === 0 ? null : `page-${urls.length}` });
    } });
    const original = JSON.stringify;
    if (failure === "serialization") JSON.stringify = ((value: unknown, ...args: unknown[]) => {
      if (Array.isArray(value) && value[0]?.targetId === "current") throw new Error("cache-serialization-fixture");
      return Reflect.apply(original, JSON, [value, ...args]);
    }) as typeof JSON.stringify;
    try {
      for (let read = 0; read < 2; read++) {
        const result = await client.getProgress();
        assert.equal(result.records.length, pages * pageRecords.length);
        assert.deepEqual(result.records[0], record);
        assert.deepEqual(result.records.at(-1), record);
      }
      assert.equal(new URL(urls[pages]!).searchParams.has("knownSnapshot"), false);
    } finally { JSON.stringify = original; }
  }
});

test("a fresh same-scope exact ACK composes history but still requires backend revision confirmation", async () => {
  const scope = FINGERPRINT; const token = "b".repeat(64); const requests: URL[] = [];
  const record = { ...conditionalProgressRecord(), lastMutationId: "mutation-canonical-0001" };
  let progressReads = 0;
  const client = createTestClient({ fetchImplementation: async (url, init) => {
    const parsed = new URL(String(url)); requests.push(parsed);
    if (parsed.pathname.endsWith("/sync")) {
      assert.equal(new Headers(init?.headers).get("x-patternly-progress-cache"), "1");
      return jsonResponse({ accountRevision: 1, applied: [record], duplicates: [], conflicts: [], snapshotScope: scope });
    }
    if (++progressReads === 1) return jsonResponse({ accountRevision: 0, generation: 0, snapshotToken: token, snapshotScope: scope, records: [], nextPageToken: null });
    return jsonResponse({ accountRevision: 1, generation: 0, snapshotToken: "c".repeat(64), snapshotScope: scope, unchanged: true });
  } });
  await client.getProgress();
  const ack = await client.syncProgress(canonicalSyncRequest());
  assert.deepEqual(Object.keys(ack).sort(), ["accountRevision", "applied", "conflicts", "duplicates"], "ephemeral transport proof never becomes a durable ACK field");
  assert.deepEqual((await client.getProgress()).records, [record]);
  assert.equal(requests[2]!.searchParams.get("knownScope"), scope);
  assert.equal(requests[2]!.searchParams.get("knownRevision"), "1");
  await client.getProgress();
  assert.equal(requests[3]!.searchParams.get("knownSnapshot"), "c".repeat(64), "confirmed compositions return to exact metadata validators");
});

test("unproven, partial or inconsistent ACKs cannot promote cached progress", async () => {
  const record = { ...conditionalProgressRecord(), lastMutationId: "mutation-canonical-0001" };
  const patches = [
    { snapshotScope: undefined }, { snapshotScope: "b".repeat(64) }, { accountRevision: 2 },
    { applied: [] }, { duplicates: [record.lastMutationId] },
    { applied: [{ ...record, version: 2 }] }, { applied: [{ ...record, fingerprint: "b".repeat(64) }] },
    { applied: [{ ...record, lastMutationId: "mutation-another-0001" }] },
  ];
  for (const patch of patches) {
    let reads = 0; const urls: URL[] = [];
    const client = createTestClient({ fetchImplementation: async (url) => {
      const parsed = new URL(String(url)); urls.push(parsed);
      if (parsed.pathname.endsWith("/sync")) return jsonResponse({ accountRevision: 1, applied: [record], duplicates: [], conflicts: [], snapshotScope: FINGERPRINT, ...patch });
      return jsonResponse({ accountRevision: reads++ === 0 ? 0 : 1, generation: 0, snapshotToken: FINGERPRINT, snapshotScope: FINGERPRINT, records: reads === 1 ? [] : [record], nextPageToken: null });
    } });
    await client.getProgress(); await client.syncProgress(canonicalSyncRequest());
    assert.deepEqual((await client.getProgress()).records, [record]);
    assert.equal(urls[2]!.searchParams.has("knownScope"), false, "full read is required when ACK provenance/completeness fails");
  }
});

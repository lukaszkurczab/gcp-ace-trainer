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

test("content package transport uses the authenticated App Check API and returns binary response headers", async () => {
  let request: { url: string; headers: Headers } | undefined;
  const client = createTestClient({ fetchImplementation: async (url, init) => {
    request = { url: String(url), headers: new Headers(init?.headers) };
    return new Response(new Uint8Array([0x1f, 0x8b, 0x00]), { status: 200, headers: { "content-type": "application/gzip", "content-length": "3" } });
  } });
  const response = await client.getContentPackage("coding-interview-dsa-problem-solving", "package-test-node");
  assert.equal(request?.url, `${API_ORIGIN}/v1/content/packages/coding-interview-dsa-problem-solving/package-test-node`);
  assert.equal(request?.headers.get("authorization"), "Bearer id-token");
  assert.equal(request?.headers.get("x-firebase-appcheck"), "app-check-token");
  assert.deepEqual([...response.bytes], [0x1f, 0x8b, 0x00]);
  assert.equal(response.headers.get("content-type"), "application/gzip");
  await assert.rejects(client.getContentPackage("track", "../escape"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("content package transport caps streamed response bodies at two MiB", async () => {
  const client = createTestClient({ fetchImplementation: async () => new Response(new Uint8Array(2 * 1024 * 1024 + 1), { status: 200 }) });
  await assert.rejects(client.getContentPackage("track", "node"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
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
      if (String(url).includes("/v1/progress?")) return new Response(JSON.stringify({ accountRevision: 0, generation: 0, records: [], nextPageToken: null }), { status: 200 });
      if (String(url).endsWith("/v1/progress/sync")) return new Response(JSON.stringify({ accountRevision: 1, applied: [], duplicates: [], conflicts: [] }), { status: 200 });
      return new Response(JSON.stringify({ status: "ok", service: "patternly-backend" }), { status: 200 });
    },
  });

  await client.getProgress();
  await client.syncProgress(canonicalSyncRequest());
  assert.deepEqual(calls.map(({ method, url }) => [method, url]), [
    ["GET", `${API_ORIGIN}/v1/progress?pageSize=100`],
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
  await client.syncProgress(canonicalSyncRequest(activeTrackMutation({
    trackId: longTrackId,
    targetId: longQuestionId,
    state: { identity: { kind: "resolved", ref: { trackId: longTrackId, questionId: longQuestionId, contentVersion: "release", artifactSha256: FINGERPRINT } } },
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
  const client = createTestClient({ fetchImplementation: async () => new Response(JSON.stringify({ accountRevision: 1, generation: 0, records: [record], nextPageToken: null }), { status: 200 }) });
  await assert.rejects(client.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "server_error" && error.serverCode === "content_identity_schema_conflict");
});

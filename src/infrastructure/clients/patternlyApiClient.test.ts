import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTENT_IDENTITY_SCHEMA,
  PatternlyApiClientError,
  createPatternlyApiClient,
  type SyncRequestDto,
} from "./";
import { LOCAL_SAFE_PUBLIC_ENVIRONMENT, parseConfiguredPublicEnvironment } from "./publicEnvironment";

function createTestClient(input: Parameters<typeof createPatternlyApiClient>[0]) {
  return createPatternlyApiClient({ getAppCheckToken: async () => "app-check-test-token", ...input });
}

const environment = parseConfiguredPublicEnvironment({
  apiOrigin: "https://api.sandbox.patternly.invalid",
  androidAppLinkHost: "patternly-app-sandbox.firebaseapp.com",
  authActionOrigin: "https://patternly-app-sandbox.firebaseapp.com",
  authRedirectDomain: "patternly-app-sandbox.firebaseapp.com",
  environment: "sandbox",
  iosAssociatedDomain: "applinks:patternly-app-sandbox.firebaseapp.com",
  privacyUrl: "https://patternly-app-sandbox.firebaseapp.com/privacy",
  publicWebOrigin: "https://patternly-app-sandbox.firebaseapp.com",
  supportUrl: "https://patternly-app-sandbox.firebaseapp.com/support",
  termsUrl: "https://patternly-app-sandbox.firebaseapp.com/terms",
  transactionalSenderDomain: "patternly-app-sandbox.firebaseapp.com",
});

test("generated client refuses an unconfigured environment and missing token", async () => {
  assert.throws(() => createTestClient({ apiOrigin: "http://127.0.0.1:8080", getIdToken: async () => "token" }), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "client_unconfigured");
  const localClient = createTestClient({ allowLocalHttpForSimulator: true, apiOrigin: "http://127.0.0.1:8080", getIdToken: async () => "token", fetchImplementation: async () => new Response(JSON.stringify({ status: "ok", service: "patternly-backend" })) });
  assert.deepEqual(await localClient.getHealth(), { status: "ok", service: "patternly-backend" });
  const client = createTestClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => null, fetchImplementation: async () => new Response("{}") });
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "authentication_required");
});

test("mobile requests fail before transport when App Check is unavailable", async () => {
  let calls = 0;
  const client = createPatternlyApiClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    getAppCheckToken: async () => null,
    fetchImplementation: async () => { calls += 1; return new Response("{}"); },
  });
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "app_check_unavailable");
  await assert.rejects(client.consumeRecoveryCode("code"), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "app_check_unavailable");
  await assert.rejects(client.createContentReport({} as never, ""), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "app_check_unavailable");
  assert.equal(calls, 0);
  const failingProvider = createPatternlyApiClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    getAppCheckToken: async () => { throw new Error("attestation_failed"); },
    fetchImplementation: async () => { calls += 1; return new Response("{}"); },
  });
  await assert.rejects(failingProvider.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "app_check_unavailable");
  assert.equal(calls, 0);
});

test("an explicit retry reaches transport after App Check becomes available", async () => {
  let token: string | null = null;
  const sentHeaders: HeadersInit[] = [];
  const client = createPatternlyApiClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    getAppCheckToken: async () => token,
    fetchImplementation: async (_url, options) => {
      sentHeaders.push(options?.headers ?? {});
      return new Response(JSON.stringify({ error: { code: "account_not_found" } }), { status: 404 });
    },
  });
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "app_check_unavailable");
  assert.equal(sentHeaders.length, 0);
  token = "available-app-check-token";
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.serverCode === "account_not_found");
  assert.equal(sentHeaders.length, 1);
  assert.equal(new Headers(sentHeaders[0]).get("x-firebase-appcheck"), token);
});

test("infrastructure and local admin requests never ask for mobile App Check", async () => {
  const paths: string[] = [];
  let providerCalls = 0;
  const client = createPatternlyApiClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "admin-token",
    getAppCheckToken: async () => { providerCalls += 1; return null; },
    fetchImplementation: async (url) => { paths.push(new URL(String(url)).pathname); return new Response("{}"); },
  });
  await client.getHealth();
  await client.getReady();
  await client.getOpenApi();
  await client.getAdminContentReports();
  assert.deepEqual(paths, ["/health", "/ready", "/openapi.json", "/v1/admin/content-reports"]);
  assert.equal(providerCalls, 0);
});

test("generated client uses typed REST paths, bearer auth, timeout and bounded errors", async () => {
  const calls: Array<{ body: unknown; headers: HeadersInit; method: string; url: string }> = [];
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async (url, init) => {
      calls.push({ body: init?.body ? JSON.parse(String(init.body)) : undefined, headers: init?.headers ?? {}, method: init?.method ?? "", url: String(url) });
      const path = String(url);
      if (path.includes("/v1/progress?")) return new Response(JSON.stringify({ accountRevision: 0, generation: 0, records: [], nextPageToken: null }), { status: 200 });
      if (path.endsWith("/v1/progress/sync")) return new Response(JSON.stringify({ accountRevision: 0, applied: [], duplicates: [], conflicts: [] }), { status: 200 });
      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    },
  });
  await client.getProgress();
  await client.exportAccountData();
  await client.syncProgress({ protocolVersion: 2, expectedAccountRevision: 0, mutations: [{
    mutationId: "mutation-0000000001",
    kind: "node",
    recordType: "active_track",
    trackId: "track",
    targetId: "target",
    expectedVersion: null,
    fingerprint: "a".repeat(64),
    state: {},
  }] });
  await client.getReady();
  await client.getOpenApi();
  assert.deepEqual(calls.map((call) => [call.method, call.url]), [
    ["GET", "https://api.sandbox.patternly.invalid/v1/progress?protocolVersion=2&pageSize=100"],
    ["GET", "https://api.sandbox.patternly.invalid/v1/account-data/export"],
    ["POST", "https://api.sandbox.patternly.invalid/v1/progress/sync"],
    ["GET", "https://api.sandbox.patternly.invalid/ready"],
    ["GET", "https://api.sandbox.patternly.invalid/openapi.json"],
  ]);
  assert.deepEqual(calls[0]?.headers, { "x-firebase-appcheck": "app-check-test-token", authorization: "Bearer id-token" });
  assert.deepEqual(calls[1]?.headers, { "x-firebase-appcheck": "app-check-test-token", authorization: "Bearer id-token" });
  assert.deepEqual(calls[2]?.headers, { "x-firebase-appcheck": "app-check-test-token", authorization: "Bearer id-token", "content-type": "application/json" });
  assert.deepEqual(calls[3]?.headers, {});
  const failing = createTestClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => "id-token", fetchImplementation: async () => new Response(JSON.stringify({ error: { code: "version_conflict" } }), { status: 409 }) });
  await assert.rejects(failing.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "server_error" && error.status === 409 && error.serverCode === "version_conflict");
});

test("generated client deadline includes token acquisition", async () => {
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: () => new Promise<string | null>(() => undefined),
    timeoutMs: 20,
    fetchImplementation: async () => new Response("{}"),
  });
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "request_timeout");
});

test("account registration uses the explicit bearer endpoint and preserves complete legal evidence", async () => {
  let call: { body: unknown; headers: HeadersInit; method: string; url: string } | null = null;
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async (url, init) => {
      call = { body: JSON.parse(String(init?.body)), headers: init?.headers ?? {}, method: init?.method ?? "", url: String(url) };
      return new Response(JSON.stringify({ registration: { created: true, user: { id: "user", createdAt: "2026-01-01T00:00:00.000Z", acceptedTermsVersion: "2026-09-05", identity: { provider: "firebase", subject: "uid", email: null, emailVerified: true } }, acceptance: null } }), { status: 201 });
    },
  });
  await client.registerAccount({ termsVersion: "2026-09-05", termsLocale: "pl", privacyPolicyVersion: "2026-09-05", privacyPolicyLocale: "pl", privacyPolicyAcknowledged: true });
  assert.deepEqual(call, {
    method: "POST",
    url: "https://api.sandbox.patternly.invalid/v1/account/registration",
    headers: { "x-firebase-appcheck": "app-check-test-token", authorization: "Bearer id-token", "content-type": "application/json" },
    body: { termsVersion: "2026-09-05", termsLocale: "pl", privacyPolicyVersion: "2026-09-05", privacyPolicyLocale: "pl", privacyPolicyAcknowledged: true },
  });
});

test("account export preserves a bounded Retry-After value from rate limiting", async () => {
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async () => new Response(JSON.stringify({ error: { code: "data_export_rate_limited" } }), {
      status: 429,
      headers: { "retry-after": "120" },
    }),
  });
  await assert.rejects(client.exportAccountData(), (error: unknown) => error instanceof PatternlyApiClientError
    && error.code === "server_error"
    && error.status === 429
    && error.serverCode === "data_export_rate_limited"
    && error.retryAfterSeconds === 120);
});

test("malformed 5xx response remains a server failure instead of a client payload failure", async () => {
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async () => new Response("not-json", { status: 503 }),
  });
  await assert.rejects(client.exportAccountData(), (error: unknown) => error instanceof PatternlyApiClientError
    && error.code === "server_error"
    && error.status === 503);
});

test("generated client preserves token provider failures", async () => {
  const tokenError = { code: "auth/user-token-expired" };
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => { throw tokenError; },
    timeoutMs: 20,
    fetchImplementation: async () => new Response("{}"),
  });
  await assert.rejects(client.getMe(), (error: unknown) => error === tokenError);
});

test("generated client deadline includes response body parsing and aborts the request", async () => {
  let aborted = false;
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    timeoutMs: 20,
    fetchImplementation: async (_url, init) => {
      init?.signal?.addEventListener("abort", () => { aborted = true; }, { once: true });
      return { ok: true, status: 200, json: () => new Promise<unknown>(() => undefined) } as Response;
    },
  });
  await assert.rejects(client.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "request_timeout");
  assert.equal(aborted, true);
});

test("content reports send App Check and keep bearer identity optional", async () => {
  let observedHeaders: HeadersInit | undefined;
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => null,
    fetchImplementation: async (_url, init) => {
      observedHeaders = init?.headers;
      return new Response(JSON.stringify({ report: {}, duplicate: false }), { status: 201 });
    },
  });
  await client.createContentReport({
    clientSubmissionId: "7f61e3f3-f23e-467c-b92a-9b8fd0514f25",
    trackId: "coding-interview-dsa-problem-solving",
    contentVersion: "2026.08.25",
    itemId: "two-sum-001",
    reason: "unclear_explanation",
    description: "The explanation does not identify why the invariant is safe.",
    context: {
      releasePackageId: "patternly-launch-2026-08-25-01",
      trackNode: "complexity_and_constraints",
      modeRoute: "practice_feedback_details",
      locale: "en",
      appBuild: "0.1.0",
      platform: "ios",
      occurredAt: "2026-08-25T10:00:00.000Z",
    },
  }, "app-check-token");
  assert.deepEqual(observedHeaders, { "x-firebase-appcheck": "app-check-token", "content-type": "application/json" });
});

test("local-safe environment stays explicitly unavailable", () => {
  assert.equal(LOCAL_SAFE_PUBLIC_ENVIRONMENT.kind, "unconfigured");
});

test("privacy request methods use their canonical paths and reject malformed payloads", async () => {
  const calls: string[] = [];
  const valid = { requestId: "pr_1", right: "access", channel: "account", status: "received", outcome: null, receivedAt: "2026-09-06T10:00:00.000Z", deadlineAt: "2026-10-06T10:00:00.000Z", deliveredAt: null, extendedAt: null, revision: 0 };
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async (url) => {
      calls.push(String(url));
      if (String(url).endsWith("/v1/privacy-requests/pr_1")) return new Response(JSON.stringify({ request: valid, response: null, responseAvailableUntil: null, extensionReason: null, complaintInformationIncluded: false }));
      if (calls.length === 1) return new Response(JSON.stringify({ request: valid }));
      return new Response(JSON.stringify({ requests: [valid] }));
    },
  });
  assert.deepEqual((await client.createPrivacyRequest("access")).request, valid);
  assert.deepEqual((await client.getPrivacyRequests()).requests, [valid]);
  assert.equal((await client.getPrivacyRequest("pr_1")).request.requestId, "pr_1");
  assert.deepEqual(calls, [
    "https://api.sandbox.patternly.invalid/v1/privacy-requests",
    "https://api.sandbox.patternly.invalid/v1/privacy-requests",
    "https://api.sandbox.patternly.invalid/v1/privacy-requests/pr_1",
  ]);

  const malformed = createTestClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => "id-token", fetchImplementation: async () => new Response(JSON.stringify({ requests: [{ ...valid, deadlineAt: "2026-10-06" }] })) });
  await assert.rejects(malformed.getPrivacyRequests(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("guest privacy requests remain in the mobile client with App Check and no account bearer", async () => {
  const requestId = "pr_75347222-8b93-4d78-9232-36b053107c46";
  const calls: Array<{ path: string; headers: Headers }> = [];
  const request = { requestId, right: "access", channel: "public", status: "received", outcome: null, receivedAt: "2026-09-06T10:00:00.000Z", deadlineAt: "2026-10-06T10:00:00.000Z", deliveredAt: null, extendedAt: null, revision: 1 };
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => { throw new Error("guest must not request bearer"); },
    fetchImplementation: async (url, options) => {
      const path = new URL(String(url)).pathname;
      calls.push({ path, headers: new Headers(options?.headers) });
      if (path.endsWith("/resend")) return new Response(JSON.stringify({ status: "pending_verification" }), { status: 202 });
      if (path.endsWith("/verify")) return new Response(JSON.stringify({ requestId, sessionToken: "s".repeat(43) }));
      if (path.endsWith("/response")) return new Response(JSON.stringify({ request, response: null, responseAvailableUntil: null, extensionReason: null, complaintInformationIncluded: false }));
      return new Response(JSON.stringify({ status: "pending_verification", requestId }), { status: 202 });
    },
  });
  assert.equal((await client.createGuestPrivacyRequest({ clientRequestId: "d39fbfd9-33dc-47f5-9d1c-48e630da2b43", email: "guest@example.com", right: "access", reportSubmissionIds: [] })).requestId, requestId);
  assert.equal((await client.resendGuestPrivacyCode(requestId, "guest@example.com")).status, "pending_verification");
  assert.equal((await client.verifyGuestPrivacyCode(`${requestId}.${"x".repeat(43)}`)).requestId, requestId);
  assert.equal((await client.readGuestPrivacyResponse(requestId, "s".repeat(43))).request.requestId, requestId);
  assert.deepEqual(calls.map(({ path }) => path), ["/v1/guest/privacy-requests", `/v1/guest/privacy-requests/${requestId}/resend`, "/v1/guest/privacy-requests/verify", `/v1/guest/privacy-requests/${requestId}/response`]);
  for (const { headers } of calls) { assert.equal(headers.get("x-firebase-appcheck"), "app-check-test-token"); assert.equal(headers.get("authorization"), null); }
});

test("legal request methods use authenticated canonical paths and validate the response contract", async () => {
  const calls: Array<Readonly<{ body: unknown; url: string }>> = [];
  const valid = { requestId: "lr_1", kind: "withdrawal", status: "received", receivedAt: "2026-09-07T10:00:00.000Z", responseDueAt: null, answeredAt: null, retentionUntil: null, response: null };
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async (url, init) => {
      calls.push({ body: init?.body ? JSON.parse(String(init.body)) : undefined, url: String(url) });
      if (String(url).endsWith("/v1/legal-requests/lr_1")) return new Response(JSON.stringify({ request: valid }));
      if (calls.length === 1) return new Response(JSON.stringify({ request: valid }));
      return new Response(JSON.stringify({ requests: [valid] }));
    },
  });
  assert.deepEqual((await client.createLegalRequest({ kind: "withdrawal", transactionId: "transaction-1" })).request, valid);
  assert.deepEqual((await client.getLegalRequests()).requests, [valid]);
  assert.equal((await client.getLegalRequest("lr_1")).request.requestId, "lr_1");
  assert.deepEqual(calls, [
    { body: { kind: "withdrawal", transactionId: "transaction-1" }, url: "https://api.sandbox.patternly.invalid/v1/legal-requests" },
    { body: undefined, url: "https://api.sandbox.patternly.invalid/v1/legal-requests" },
    { body: undefined, url: "https://api.sandbox.patternly.invalid/v1/legal-requests/lr_1" },
  ]);

  const malformed = createTestClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => "id-token", fetchImplementation: async () => new Response(JSON.stringify({ requests: [{ ...valid, status: "unknown" }] })) });
  await assert.rejects(malformed.getLegalRequests(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("public legal requests use App Check with optional bearer authentication", async () => {
  let headers: HeadersInit | undefined;
  let body: unknown;
  const valid = { requestId: "lr_public", kind: "complaint", status: "received", receivedAt: "2026-09-07T10:00:00.000Z", responseDueAt: "2026-09-21T10:00:00.000Z", answeredAt: null, retentionUntil: null, response: null };
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => null,
    fetchImplementation: async (url, init) => {
      assert.equal(String(url), "https://api.sandbox.patternly.invalid/v1/public/legal-requests");
      headers = init?.headers;
      body = init?.body ? JSON.parse(String(init.body)) : undefined;
      return new Response(JSON.stringify({ request: valid }), { status: 201 });
    },
  });
  assert.deepEqual(await client.createPublicLegalRequest({ email: "guest@example.com", kind: "complaint", narrative: "The service did not start." }, "app-check-token"), { request: valid });
  assert.deepEqual(headers, { "x-firebase-appcheck": "app-check-token", "content-type": "application/json" });
  assert.deepEqual(body, { email: "guest@example.com", kind: "complaint", narrative: "The service did not start." });
});

test("account data protocol defaults to stable v3 and samples the mode getter once", async () => {
  let selected: "v3" | "v4" = "v3";
  let getterCalls = 0;
  const urls: string[] = [];
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    getAccountDataProtocolMode: () => {
      getterCalls += 1;
      return selected;
    },
    fetchImplementation: async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify({ accountRevision: 0, generation: 0, records: [], nextPageToken: null }));
    },
  });

  assert.equal(client.accountDataProtocolMode, "v3");
  selected = "v4";
  await client.getProgress();
  assert.equal(getterCalls, 1);
  assert.deepEqual(urls, ["https://api.sandbox.patternly.invalid/v1/progress?protocolVersion=2&pageSize=100"]);
});

test("explicit v4 uses strict paged reads and carries the schema on sync and adoption bodies", async () => {
  const fingerprint = "a".repeat(64);
  const progressRecord = {
    kind: "node" as const,
    recordType: "active_track" as const,
    trackId: "coding-interview-dsa-problem-solving",
    targetId: "current",
    version: 1,
    fingerprint,
    state: {},
    lastMutationId: "mutation-0000000001",
    updatedAt: "2026-09-12T10:00:00.000Z",
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
  };
  const guestRecord = {
    fingerprint,
    recordId: "current",
    recordType: "active_track" as const,
    state: {},
    trackId: "coding-interview-dsa-problem-solving",
    version: 1,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
  };
  const snapshot = {
    protocolVersion: 4 as const,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    guestSnapshotVersion: 1,
    guestUserId: "00000000-0000-4000-8000-000000000001",
    records: [guestRecord],
    activeSession: false,
    pendingJournal: false,
  };
  const preview = {
    accountSnapshotVersion: 3,
    accountUserId: "00000000-0000-4000-8000-000000000002",
    conflicts: [],
    fingerprint,
    guestSnapshotVersion: 1,
    guestUserId: "00000000-0000-4000-8000-000000000001",
    operationId: "00000000-0000-4000-8000-000000000003",
    protocolVersion: 4 as const,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    goalPlanConflictGroups: [],
  };
  const plan = {
    caseId: "emptyLocalPopulatedRemote" as const,
    localRecordCount: 1,
    remoteRecordCount: 1,
    uploadRecordIds: [],
    restoreRecordIds: ["current"],
    deduplicatedRecordIds: [],
    conflictRecordIds: [],
    blockingReason: null,
  };
  const calls: Array<Readonly<{ body: unknown; url: string }>> = [];
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    accountDataProtocolMode: "v4",
    getIdToken: async () => "id-token",
    fetchImplementation: async (url, init) => {
      const value = String(url);
      const body = init?.body === undefined ? undefined : JSON.parse(String(init.body));
      calls.push({ body, url: value });
      if (value.includes("/v1/progress?")) {
        const pageToken = new URL(value).searchParams.get("pageToken");
        return new Response(JSON.stringify({
          accountRevision: 7,
          generation: 4,
          records: [progressRecord],
          nextPageToken: pageToken === null ? "next-page" : null,
        }));
      }
      if (value.endsWith("/v1/progress/sync")) return new Response(JSON.stringify({ accountRevision: 8, applied: [progressRecord], duplicates: [], conflicts: [] }));
      if (value.endsWith("/v1/account-data/adoption/preview")) return new Response(JSON.stringify({ preview, plan, remoteRecords: [guestRecord] }));
      if (value.endsWith("/v1/account-data/adoption/confirm")) return new Response(JSON.stringify({ accountRevision: 9, operationId: "00000000-0000-4000-8000-000000000003", mutationIds: [], records: [guestRecord] }));
      throw new Error(`unexpected URL ${value}`);
    },
  });

  const syncRequest = {
    protocolVersion: 4 as const,
    canonicalVersion: "canonical-json-v1" as const,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    expectedAccountRevision: 7,
    deviceId: "00000000-0000-4000-8000-000000000004",
    sessionId: "session-1",
    batchId: "batch-1",
    planVersion: 4 as const,
    highWatermark: 1,
    mutations: [{
      mutationId: "mutation-0000000001",
      kind: "node" as const,
      recordType: "active_track" as const,
      trackId: "coding-interview-dsa-problem-solving",
      targetId: "current",
      expectedVersion: 1,
      fingerprint,
      state: {},
      contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    }],
  };
  const confirmation = {
    operationId: "00000000-0000-4000-8000-000000000003",
    previewFingerprint: fingerprint,
    protocolVersion: 4 as const,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    resolutions: [],
    groupChoices: [],
  };

  const progress = await client.getProgress();
  await client.syncProgress(syncRequest);
  await client.previewAccountAdoption(snapshot);
  await client.confirmAccountAdoption({ deviceId: "00000000-0000-4000-8000-000000000004", snapshot, confirmation });

  assert.equal(client.accountDataProtocolMode, "v4");
  assert.equal(progress.records.length, 2);
  assert.deepEqual(calls.map((call) => call.url), [
    "https://api.sandbox.patternly.invalid/v1/progress?protocolVersion=4&pageSize=100",
    "https://api.sandbox.patternly.invalid/v1/progress?protocolVersion=4&pageSize=100&pageToken=next-page",
    "https://api.sandbox.patternly.invalid/v1/progress/sync",
    "https://api.sandbox.patternly.invalid/v1/account-data/adoption/preview",
    "https://api.sandbox.patternly.invalid/v1/account-data/adoption/confirm",
  ]);
  assert.equal((calls[2]?.body as { contentIdentitySchema: string }).contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
  assert.equal((calls[3]?.body as { protocolVersion: number; contentIdentitySchema: string }).protocolVersion, 4);
  assert.equal((calls[3]?.body as { contentIdentitySchema: string }).contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
  assert.equal((calls[4]?.body as { confirmation: { protocolVersion: number; contentIdentitySchema: string } }).confirmation.protocolVersion, 4);
  assert.equal((calls[4]?.body as { confirmation: { contentIdentitySchema: string } }).confirmation.contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
});

test("v4 schema mismatch surfaces a conflict without a v3 fallback", async () => {
  const calls: string[] = [];
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    accountDataProtocolMode: "v4",
    getIdToken: async () => "id-token",
    fetchImplementation: async (url) => {
      calls.push(String(url));
      return new Response(JSON.stringify({
        accountRevision: 1,
        generation: 1,
        records: [{
          kind: "node",
          recordType: "active_track",
          trackId: "coding-interview-dsa-problem-solving",
          targetId: "current",
          version: 1,
          fingerprint: "a".repeat(64),
          state: {},
          lastMutationId: "mutation-0000000001",
          updatedAt: "2026-09-12T10:00:00.000Z",
          contentIdentitySchema: "patternly:content-identity:v1",
        }],
        nextPageToken: null,
      }));
    },
  });

  await assert.rejects(client.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError
    && error.code === "server_error"
    && error.status === 409
    && error.serverCode === "content_identity_schema_conflict");
  assert.deepEqual(calls, ["https://api.sandbox.patternly.invalid/v1/progress?protocolVersion=4&pageSize=100"]);
});

test("v3 rejects v4 sync and adoption payloads before transport", async () => {
  const fingerprint = "a".repeat(64);
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async () => { throw new Error("transport should not be called"); },
  });
  const v4Mutation = {
    mutationId: "mutation-0000000001",
    kind: "node" as const,
    recordType: "active_track" as const,
    trackId: "coding-interview-dsa-problem-solving",
    targetId: "current",
    expectedVersion: null,
    fingerprint,
    state: {},
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
  };
  const v4Request = {
    protocolVersion: 4 as const,
    canonicalVersion: "canonical-json-v1" as const,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    expectedAccountRevision: 0,
    deviceId: "00000000-0000-4000-8000-000000000004",
    sessionId: "session-1",
    batchId: "batch-1",
    planVersion: 4 as const,
    highWatermark: 0,
    mutations: [v4Mutation],
  };
  const v4Snapshot = {
    protocolVersion: 4 as const,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    guestSnapshotVersion: 0,
    guestUserId: "00000000-0000-4000-8000-000000000001",
    records: [],
    activeSession: false,
    pendingJournal: false,
  };
  const conflict = (error: unknown) => error instanceof PatternlyApiClientError
    && error.code === "server_error"
    && error.status === 409
    && error.serverCode === "content_identity_schema_conflict";
  await assert.rejects(client.syncProgress(v4Request), conflict);
  await assert.rejects(client.previewAccountAdoption(v4Snapshot), conflict);
});

test("transport codec enforces v2 optional deviceId and strict v4 sync metadata", async () => {
  let calls = 0;
  const v3Client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async () => {
      calls += 1;
      return new Response(JSON.stringify({ accountRevision: 1, applied: [], duplicates: [], conflicts: [] }));
    },
  });
  const v2Request = {
    protocolVersion: 2 as const,
    expectedAccountRevision: 0,
    deviceId: "00000000-0000-4000-8000-000000000005",
    mutations: [{
      mutationId: "mutation-0000000002",
      kind: "node" as const,
      recordType: "active_track" as const,
      trackId: "track",
      targetId: "target",
      expectedVersion: null,
      fingerprint: "b".repeat(64),
      state: {},
    }],
  };
  await v3Client.syncProgress(v2Request);
  assert.equal(calls, 1);
  await assert.rejects(v3Client.syncProgress({ ...v2Request, deviceId: "short" }), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  await assert.rejects(v3Client.syncProgress({ ...v2Request, mutations: [{ ...v2Request.mutations[0], mutationId: "too-short" }] } as unknown as SyncRequestDto), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");

  const v4Client = createTestClient({
    apiOrigin: environment.apiOrigin,
    accountDataProtocolMode: "v4",
    getIdToken: async () => "id-token",
    fetchImplementation: async () => new Response(JSON.stringify({ accountRevision: 1, applied: [], duplicates: [], conflicts: [] })),
  });
  const v4Request = {
    protocolVersion: 4 as const,
    canonicalVersion: "canonical-json-v1" as const,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    expectedAccountRevision: 0,
    deviceId: "00000000-0000-4000-8000-000000000006",
    sessionId: "session-2",
    batchId: "batch-2",
    planVersion: 4 as const,
    highWatermark: 0,
    mutations: [{
      mutationId: "mutation-0000000003",
      kind: "node" as const,
      recordType: "active_track" as const,
      trackId: "track",
      targetId: "target",
      expectedVersion: null,
      fingerprint: "c".repeat(64),
      state: {},
      contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
    }],
  };
  await v4Client.syncProgress(v4Request);
  await assert.rejects(v4Client.syncProgress({ ...v4Request, canonicalVersion: "canonical-json-v2" } as unknown as SyncRequestDto), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  await assert.rejects(v4Client.syncProgress({ ...v4Request, planVersion: 3 } as unknown as SyncRequestDto), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  await assert.rejects(v4Client.syncProgress({ ...v4Request, mutations: [{ ...v4Request.mutations[0], extra: true }] } as unknown as SyncRequestDto), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  await assert.rejects(v4Client.syncProgress({ ...v4Request, mutations: [{ ...v4Request.mutations[0], state: { blob: "x".repeat(128 * 1024) } }] } as unknown as SyncRequestDto), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("adoption codec parses legacy v1 previews and caps group identity lists", async () => {
  const accountUserId = "00000000-0000-4000-8000-000000000007";
  const guestUserId = "00000000-0000-4000-8000-000000000008";
  const operationId = "00000000-0000-4000-8000-000000000009";
  const snapshot = {
    protocolVersion: 1 as const,
    guestSnapshotVersion: 0,
    guestUserId,
    records: [],
    activeSession: false,
    pendingJournal: false,
  };
  const plan = { caseId: "emptyLocalEmptyRemote" as const, localRecordCount: 0, remoteRecordCount: 0, uploadRecordIds: [], restoreRecordIds: [], deduplicatedRecordIds: [], conflictRecordIds: [], blockingReason: null };
  const client = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async () => new Response(JSON.stringify({
      preview: { accountSnapshotVersion: 0, accountUserId, conflicts: [], fingerprint: "d".repeat(64), guestSnapshotVersion: 0, guestUserId, operationId, protocolVersion: 1 },
      plan,
      remoteRecords: [],
    })),
  });
  const parsed = await client.previewAccountAdoption(snapshot);
  assert.deepEqual(parsed.preview.goalPlanConflictGroups, []);

  const invalidGroupsClient = createTestClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async () => new Response(JSON.stringify({
      preview: {
        accountSnapshotVersion: 0,
        accountUserId,
        conflicts: [],
        fingerprint: "d".repeat(64),
        guestSnapshotVersion: 0,
        guestUserId,
        operationId,
        protocolVersion: 2,
        goalPlanConflictGroups: [{ groupId: "track:track", trackId: "track", localRecordIds: ["a", "b", "c"], accountRecordIds: [] }],
      },
      plan,
      remoteRecords: [],
    })),
  });
  await assert.rejects(invalidGroupsClient.previewAccountAdoption({ ...snapshot, protocolVersion: 2 }), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  PatternlyApiClientError,
  createPatternlyApiClient,
} from "./";
import { LOCAL_SAFE_PUBLIC_ENVIRONMENT, parseConfiguredPublicEnvironment } from "./publicEnvironment";

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
  assert.throws(() => createPatternlyApiClient({ apiOrigin: "http://127.0.0.1:8080", getIdToken: async () => "token" }), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "client_unconfigured");
  const localClient = createPatternlyApiClient({ allowLocalHttpForSimulator: true, apiOrigin: "http://127.0.0.1:8080", getIdToken: async () => "token", fetchImplementation: async () => new Response(JSON.stringify({ status: "ok", service: "patternly-backend" })) });
  assert.deepEqual(await localClient.getHealth(), { status: "ok", service: "patternly-backend" });
  const client = createPatternlyApiClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => null, fetchImplementation: async () => new Response("{}") });
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "authentication_required");
});

test("generated client uses typed REST paths, bearer auth, timeout and bounded errors", async () => {
  const calls: Array<{ body: unknown; headers: HeadersInit; method: string; url: string }> = [];
  const client = createPatternlyApiClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => "id-token",
    fetchImplementation: async (url, init) => {
      calls.push({ body: init?.body ? JSON.parse(String(init.body)) : undefined, headers: init?.headers ?? {}, method: init?.method ?? "", url: String(url) });
      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    },
  });
  await client.getProgress();
  await client.exportAccountData();
  await client.syncProgress({ protocolVersion: 2, expectedAccountRevision: 0, mutations: [] });
  await client.getReady();
  await client.getOpenApi();
  assert.deepEqual(calls.map((call) => [call.method, call.url]), [
    ["GET", "https://api.sandbox.patternly.invalid/v1/progress?protocolVersion=2&pageSize=100"],
    ["GET", "https://api.sandbox.patternly.invalid/v1/account-data/export"],
    ["POST", "https://api.sandbox.patternly.invalid/v1/progress/sync"],
    ["GET", "https://api.sandbox.patternly.invalid/ready"],
    ["GET", "https://api.sandbox.patternly.invalid/openapi.json"],
  ]);
  assert.deepEqual(calls[0]?.headers, { authorization: "Bearer id-token" });
  assert.deepEqual(calls[1]?.headers, { authorization: "Bearer id-token" });
  assert.deepEqual(calls[2]?.headers, { authorization: "Bearer id-token", "content-type": "application/json" });
  assert.deepEqual(calls[3]?.headers, {});
  const failing = createPatternlyApiClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => "id-token", fetchImplementation: async () => new Response(JSON.stringify({ error: { code: "version_conflict" } }), { status: 409 }) });
  await assert.rejects(failing.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "server_error" && error.status === 409 && error.serverCode === "version_conflict");
});

test("generated client deadline includes token acquisition", async () => {
  const client = createPatternlyApiClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: () => new Promise<string | null>(() => undefined),
    timeoutMs: 20,
    fetchImplementation: async () => new Response("{}"),
  });
  await assert.rejects(client.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "request_timeout");
});

test("account export preserves a bounded Retry-After value from rate limiting", async () => {
  const client = createPatternlyApiClient({
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
  const client = createPatternlyApiClient({
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
  const client = createPatternlyApiClient({
    apiOrigin: environment.apiOrigin,
    getIdToken: async () => { throw tokenError; },
    timeoutMs: 20,
    fetchImplementation: async () => new Response("{}"),
  });
  await assert.rejects(client.getMe(), (error: unknown) => error === tokenError);
});

test("generated client deadline includes response body parsing and aborts the request", async () => {
  let aborted = false;
  const client = createPatternlyApiClient({
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
  const client = createPatternlyApiClient({
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
  const client = createPatternlyApiClient({
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

  const malformed = createPatternlyApiClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => "id-token", fetchImplementation: async () => new Response(JSON.stringify({ requests: [{ ...valid, deadlineAt: "not-a-date" }] })) });
  await assert.rejects(malformed.getPrivacyRequests(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("legal request methods use authenticated canonical paths and validate the response contract", async () => {
  const calls: Array<Readonly<{ body: unknown; url: string }>> = [];
  const valid = { requestId: "lr_1", kind: "withdrawal", status: "received", receivedAt: "2026-09-07T10:00:00.000Z", responseDueAt: null, answeredAt: null, retentionUntil: null, response: null };
  const client = createPatternlyApiClient({
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

  const malformed = createPatternlyApiClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => "id-token", fetchImplementation: async () => new Response(JSON.stringify({ requests: [{ ...valid, status: "unknown" }] })) });
  await assert.rejects(malformed.getLegalRequests(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
});

test("public legal requests use App Check with optional bearer authentication", async () => {
  let headers: HeadersInit | undefined;
  let body: unknown;
  const valid = { requestId: "lr_public", kind: "complaint", status: "received", receivedAt: "2026-09-07T10:00:00.000Z", responseDueAt: "2026-09-21T10:00:00.000Z", answeredAt: null, retentionUntil: null, response: null };
  const client = createPatternlyApiClient({
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

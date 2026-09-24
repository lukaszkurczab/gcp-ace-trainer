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

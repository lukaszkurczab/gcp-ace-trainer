import assert from "node:assert/strict";
import test from "node:test";

import {
  PatternlyApiClientError,
  createPatternlyApiClient,
} from "../src/infrastructure/clients";
import { LOCAL_SAFE_PUBLIC_ENVIRONMENT, parseConfiguredPublicEnvironment } from "../src/infrastructure/clients/publicEnvironment";

const environment = parseConfiguredPublicEnvironment({
  apiOrigin: "https://api.sandbox.patternly.invalid",
  androidAppLinkHost: "patternly-app-sandbox.firebaseapp.com",
  authActionOrigin: "https://patternly-app-sandbox.firebaseapp.com",
  authRedirectDomain: "patternly-app-sandbox.firebaseapp.com",
  environment: "sandbox",
  iosAssociatedDomain: "applinks:patternly-app-sandbox.firebaseapp.com",
  privacyUrl: "https://patternly-app-sandbox.firebaseapp.com/privacy",
  publicDeletionUrl: "https://patternly-app-sandbox.firebaseapp.com/delete",
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
  await client.syncProgress({ expectedAccountRevision: 0, mutations: [] });
  await client.getReady();
  await client.getOpenApi();
  assert.deepEqual(calls.map((call) => [call.method, call.url]), [
    ["GET", "https://api.sandbox.patternly.invalid/v1/progress"],
    ["POST", "https://api.sandbox.patternly.invalid/v1/progress/sync"],
    ["GET", "https://api.sandbox.patternly.invalid/ready"],
    ["GET", "https://api.sandbox.patternly.invalid/openapi.json"],
  ]);
  assert.deepEqual(calls[0]?.headers, { authorization: "Bearer id-token" });
  assert.deepEqual(calls[1]?.headers, { authorization: "Bearer id-token", "content-type": "application/json" });
  assert.deepEqual(calls[2]?.headers, {});
  const failing = createPatternlyApiClient({ apiOrigin: environment.apiOrigin, getIdToken: async () => "id-token", fetchImplementation: async () => new Response(JSON.stringify({ error: { code: "version_conflict" } }), { status: 409 }) });
  await assert.rejects(failing.getProgress(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "server_error" && error.status === 409 && error.serverCode === "version_conflict");
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

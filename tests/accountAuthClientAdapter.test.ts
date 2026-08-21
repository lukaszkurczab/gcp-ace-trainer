import assert from "node:assert/strict";
import test from "node:test";

import {
  AccountClientError,
  createAccountAuthClientAdapter,
} from "../src/infrastructure/clients";
import { LOCAL_SAFE_PUBLIC_ENVIRONMENT, parseConfiguredPublicEnvironment } from "../src/infrastructure/clients/publicEnvironment";

const environment = {
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
} as const;

const credentials = {
  getAppCheckToken: async () => "app-check-token",
  getIdToken: async () => "id-token",
};

test("account client refuses an unconfigured public environment before composing transport", () => {
  assert.throws(() => createAccountAuthClientAdapter({ credentials, environment: LOCAL_SAFE_PUBLIC_ENVIRONMENT }), (error: unknown) => {
    assert.ok(error instanceof AccountClientError);
    assert.equal(error.code, "account_client_unconfigured");
    return true;
  });
});

test("account client binds auth headers and exact account routes for sync and deletion", async () => {
  const calls: Array<{ body: unknown; headers: HeadersInit; url: string }> = [];
  const responses = [
    new Response(JSON.stringify({ committedAccountRevision: 2, operationFingerprint: "f".repeat(64), result: "synchronized" }), { status: 200 }),
    new Response(JSON.stringify({ completedAt: "2026-08-21T10:00:00.000Z", requestId: "request_123456789", result: "account_deleted" }), { status: 200 }),
  ];
  const client = createAccountAuthClientAdapter({
    credentials,
    environment: { kind: "configured", value: parseConfiguredPublicEnvironment(environment) },
    fetchImplementation: async (url, init) => {
      calls.push({ body: JSON.parse(String(init?.body)), headers: init?.headers ?? {}, url: String(url) });
      return responses.shift()!;
    },
  });

  await client.sync({ expectedAccountRevision: 1, mutations: [], operationFingerprint: "f".repeat(64) });
  await client.deleteAccount({ requestedAt: "2026-08-21T09:59:00.000Z", requestId: "request_123456789" });

  assert.deepEqual(calls.map((call) => call.url), [
    "https://api.sandbox.patternly.invalid/v1/account/sync",
    "https://api.sandbox.patternly.invalid/v1/account/deletion",
  ]);
  assert.deepEqual(calls.map((call) => call.headers), [
    { authorization: "Bearer id-token", "content-type": "application/json", "x-firebase-appcheck": "app-check-token" },
    { authorization: "Bearer id-token", "content-type": "application/json", "x-firebase-appcheck": "app-check-token" },
  ]);
});

test("account client surfaces missing credentials and malformed provider responses as bounded codes", async () => {
  let fetchCalls = 0;
  const noToken = createAccountAuthClientAdapter({
    credentials: { getAppCheckToken: async () => "app-check", getIdToken: async () => null },
    environment: { kind: "configured", value: parseConfiguredPublicEnvironment(environment) },
    fetchImplementation: async () => { fetchCalls += 1; return new Response("{}"); },
  });
  await assert.rejects(noToken.sync({ expectedAccountRevision: 0, mutations: [], operationFingerprint: "f".repeat(64) }), (error: unknown) => {
    assert.ok(error instanceof AccountClientError);
    assert.equal(error.code, "account_authentication_required");
    return true;
  });
  assert.equal(fetchCalls, 0);

  const malformed = createAccountAuthClientAdapter({
    credentials,
    environment: { kind: "configured", value: parseConfiguredPublicEnvironment(environment) },
    fetchImplementation: async () => new Response(JSON.stringify({ result: "synchronized" }), { status: 200 }),
  });
  await assert.rejects(malformed.sync({ expectedAccountRevision: 0, mutations: [], operationFingerprint: "f".repeat(64) }), (error: unknown) => {
    assert.ok(error instanceof AccountClientError);
    assert.equal(error.code, "account_invalid_response");
    return true;
  });
});

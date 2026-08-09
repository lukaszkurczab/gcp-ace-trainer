import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  APPROVED_CLIENT_IDS,
  APPROVED_CLIENT_ADAPTERS,
  createApprovedClientRegistry,
  LOCAL_SAFE_PUBLIC_ENVIRONMENT,
  parseConfiguredPublicEnvironment,
} from "../src/infrastructure/clients";

const sandboxConfiguration = {
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

test("local remote-client boundary is explicit and has no implicit endpoint", () => {
  const registry = createApprovedClientRegistry(LOCAL_SAFE_PUBLIC_ENVIRONMENT);
  assert.deepEqual(Object.keys(registry), [...APPROVED_CLIENT_IDS]);
  assert.deepEqual(Object.values(registry).map((client) => client.availability), APPROVED_CLIENT_IDS.map(() => "unconfigured"));
  assert.deepEqual(Object.keys(APPROVED_CLIENT_ADAPTERS), [...APPROVED_CLIENT_IDS]);
});

test("public environment accepts the complete sandbox-only Firebase domain configuration", () => {
  const environment = parseConfiguredPublicEnvironment(sandboxConfiguration);
  assert.equal(environment.environment, "sandbox");
  assert.deepEqual(Object.values(createApprovedClientRegistry({ kind: "configured", value: environment })).map((client) => client.availability), APPROVED_CLIENT_IDS.map(() => "provider_not_composed"));
});

test("public environment rejects extra keys, incomplete values, unsafe URLs, and production Firebase defaults", () => {
  assert.throws(() => parseConfiguredPublicEnvironment({ ...sandboxConfiguration, accidental: "value" }), /invalid_public_environment:shape/u);
  assert.throws(() => parseConfiguredPublicEnvironment({ ...sandboxConfiguration, privacyUrl: "http://unsafe.invalid/privacy" }), /invalid_public_environment:privacyUrl/u);
  assert.throws(() => parseConfiguredPublicEnvironment({ ...sandboxConfiguration, environment: "production" }), /invalid_public_environment:production_default_firebase_domain/u);
});

const runtimePrivacyValidator = resolve("scripts/validateRuntimePrivacyBoundary.mjs");
const fixtureApprovedRegistry = `export const APPROVED_CLIENT_ADAPTERS = Object.freeze({
  account_auth: Object.freeze({ exportName: "createAccountAuthClientAdapter", fileName: "AccountAuthClientAdapter.ts" }),
  entitlement: Object.freeze({ exportName: "createEntitlementClientAdapter", fileName: "EntitlementClientAdapter.ts" }),
  package_delivery: Object.freeze({ exportName: "createPackageDeliveryClientAdapter", fileName: "PackageDeliveryClientAdapter.ts" }),
  analytics_crash: Object.freeze({ exportName: "createAnalyticsCrashClientAdapter", fileName: "AnalyticsCrashClientAdapter.ts" }),
  content_report: Object.freeze({ exportName: "createContentReportClientAdapter", fileName: "ContentReportClientAdapter.ts" }),
} satisfies Record<string, unknown>);
export const clients = ["account_auth", "entitlement", "package_delivery", "analytics_crash", "content_report"];
`;

function validatePrivacyFixture(files: Readonly<Record<string, string>>): ReturnType<typeof spawnSync> {
  const fixture = mkdtempSync(join(tmpdir(), "patternly-runtime-privacy-"));
  try {
    const sourceFiles: Record<string, string> = {
      "src/application/operationalDiagnostics.ts": "export function describeOperationalFailure() {}\n",
      "src/infrastructure/clients/approvedClientRegistry.ts": fixtureApprovedRegistry,
      ...files,
    };
    for (const [relativePath, source] of Object.entries(sourceFiles)) {
      const path = join(fixture, relativePath);
      mkdirSync(resolve(path, ".."), { recursive: true });
      writeFileSync(path, source);
    }
    return spawnSync(process.execPath, [runtimePrivacyValidator], { cwd: fixture, encoding: "utf8" });
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
}

test("runtime privacy keeps console and raw errors forbidden inside adapters and rejects sibling client paths", () => {
  const cleanAdapter = validatePrivacyFixture({
    "src/infrastructure/clients/AccountAuthClientAdapter.ts": "export function createAccountAuthClientAdapter() { return fetch(\"https://example.invalid\"); }\n",
  });
  assert.equal(cleanAdapter.status, 0, String(cleanAdapter.stderr ?? ""));

  const adapterConsole = validatePrivacyFixture({
    "src/infrastructure/clients/AccountAuthClientAdapter.ts": "console.error(\"leak\");\nexport function createAccountAuthClientAdapter() { return fetch(\"https://example.invalid\"); }\n",
  });
  assert.equal(adapterConsole.status, 1);
  assert.match(String(adapterConsole.stderr ?? ""), /production console diagnostic/u);

  const adapterRawError = validatePrivacyFixture({
    "src/infrastructure/clients/AccountAuthClientAdapter.ts": "export function createAccountAuthClientAdapter(error: Error) { return error.message + fetch(\"https://example.invalid\"); }\n",
  });
  assert.equal(adapterRawError.status, 1);
  assert.match(String(adapterRawError.stderr ?? ""), /raw operational error message/u);

  const unregisteredTransport = validatePrivacyFixture({
    "src/infrastructure/clients/EvilClientAdapter.ts": "export function createEvilClientAdapter() { return fetch(\"https://example.invalid\"); }\n",
  });
  assert.equal(unregisteredTransport.status, 1);
  assert.match(String(unregisteredTransport.stderr ?? ""), /network client outside approved adapter boundary/u);
});

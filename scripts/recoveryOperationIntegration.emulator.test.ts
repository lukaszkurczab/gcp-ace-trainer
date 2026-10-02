import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { createRecoveryOperationCoordinator } from "../src/application/account/recoveryOperationCoordinator";
import { ensureRecoveryIssueSignInSession } from "../src/application/account/accountSessionExchange";
import { createPatternlyApiClient, PatternlyApiClientError } from "../src/infrastructure/clients/PatternlyApiClientAdapter";
import { createRecoveryOperationVault, RECOVERY_OPERATION_VAULT_KEY } from "../src/infrastructure/security/recoveryOperationVault";

const enabled = process.env.AUD08_RECOVERY_MOBILE_INTEGRATION === "1";
const projectId = process.env.FIREBASE_PROJECT_ID ?? "";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "";
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST ?? "";
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = resolve(appRoot, "../patternly-backend");
const appRequire = createRequire(resolve(appRoot, "package.json"));
const firebaseApp = appRequire("firebase/app") as {
  initializeApp(options: Record<string, unknown>, name: string): unknown;
  deleteApp(app: unknown): Promise<void>;
};
type FirebaseUser = Readonly<{
  uid: string;
  email: string | null;
  emailVerified: boolean;
  getIdToken(forceRefresh?: boolean): Promise<string>;
}>;
type FirebaseAuth = {
  currentUser: FirebaseUser | null;
  _delete(): Promise<void>;
};
const firebaseAuth = appRequire("firebase/auth") as {
  EmailAuthProvider: { credential(email: string, password: string): unknown };
  connectAuthEmulator(auth: FirebaseAuth, url: string, options: { disableWarnings: boolean }): void;
  createUserWithEmailAndPassword(auth: FirebaseAuth, email: string, password: string): Promise<{ user: FirebaseUser }>;
  getIdTokenResult(user: FirebaseUser, forceRefresh?: boolean): Promise<{ claims: Record<string, unknown> }>;
  inMemoryPersistence: unknown;
  initializeAuth(app: unknown, options: { persistence: unknown }): FirebaseAuth;
  reauthenticateWithCredential(user: FirebaseUser, credential: unknown): Promise<unknown>;
  signInWithCustomToken(auth: FirebaseAuth, token: string): Promise<{ user: FirebaseUser }>;
  signOut(auth: FirebaseAuth): Promise<void>;
};

type BackendSnapshot = Readonly<{ exists: boolean; get(field: string): unknown }>;
type BackendDocument = Readonly<{
  collection(name: string): BackendCollection;
  delete(): Promise<unknown>;
  get(): Promise<BackendSnapshot>;
  id: string;
  set(value: Readonly<Record<string, unknown>>): Promise<unknown>;
  update(value: Readonly<Record<string, unknown>>): Promise<unknown>;
}>;
type BackendQuery = Readonly<{ get(): Promise<Readonly<{ empty: boolean; docs: readonly Readonly<{ ref: BackendDocument }>[] }>> }>;
type BackendCollection = BackendDocument & Readonly<{
  doc(id: string): BackendDocument;
  where(field: string, comparison: "==", value: string): BackendQuery;
}>;
type BackendFirestore = Readonly<{
  batch(): Readonly<{ delete(reference: BackendDocument): void; commit(): Promise<unknown> }>;
  collection(name: string): BackendCollection;
}>;
type BackendRuntime = Readonly<{ app: unknown; db: BackendFirestore; close(): Promise<void> }>;
type BackendApplication = Readonly<{
  close(): Promise<void>;
  listen(options: Readonly<{ host: string; port: number }>): Promise<string>;
}>;
type BackendVerifiedIdentity = Readonly<{ authTime: number }>;
type BackendTokenVerifier = Readonly<{ verify(idToken: string): Promise<BackendVerifiedIdentity> }>;
type BackendTestEnvironment = Readonly<{
  deletionPseudonymKeysJson: string;
  firebaseAuthIssuer: string | null;
  firebaseProjectId: string | null;
  recoveryOperationRateLimitMax: number;
  recoveryOperationRateLimitWindowSeconds: number;
}>;
type CollectionNames = Readonly<{
  accountDeletionOperations: string;
  accountRecoveryOperations: string;
  accountRecoveryOperationResults: string;
  deletionProofs: string;
  deletedIdentities: string;
  identityMappings: string;
  rateLimitBuckets: string;
  recoveryCodeIndex: string;
  sessionRevocationOperations: string;
  users: string;
}>;
type PseudonymValue = Readonly<{ documentId: string; keyVersion: string; subjectHmac: string }>;
type PseudonymKeyRingConstructor = new (configuration: readonly Readonly<{ version: string; status: "active" | "verify_only"; keyBase64: string }>[]) => Readonly<{
  active(provider: string, subject: string): PseudonymValue;
}>;
type CompletedHttpPair = Readonly<{ method: string; status: number }>;

function createBackendHttpLogProbe() {
  const chunks: string[] = [];
  const knownSecrets = new Set<string>();
  const completedFetches: CompletedHttpPair[] = [];
  const knownSecretKeys = new Set(["authorization", "cookie", "x-firebase-appcheck", "appchecktoken", "customtoken", "codes", "recoverycode", "email", "firebaseuid", "uid", "password", "operationsecret", "token", "proofid", "deletionproofid"]);
  const forbiddenLogKeys = new Set(["authorization", "cookie", "x-firebase-appcheck", "appchecktoken", "customtoken", "codes", "recoverycode", "email", "firebaseuid", "uid", "password", "operationsecret", "token", "proofid", "deletionproofid"]);
  const safeEvents = new Set(["account_sync_rejected", "app_check_rejected", "request_failed", "bootstrap_failed", "shutting_down", "shutdown_failed"]);
  const safeStages = new Set(["sync", "preview", "confirm"]);
  const safeSignals = new Set(["SIGINT", "SIGTERM"]);
  const safeCodes = new Set([
    "invalid_request", "version_conflict", "account_revision_conflict", "progress_fingerprint_mismatch", "mutation_id_reuse",
    "merge_preview_mismatch", "merge_resolution_incomplete", "merge_resolution_mismatch", "merge_conflict_requires_manual_resolution",
    "active_session_adoption_blocked", "journal_recovery_required", "firestore_not_ready", "authentication_required",
    "recent_reauthentication_required", "recovery_code_invalid", "recovery_code_used", "account_deleted",
    "remote_deletion_pending", "session_revocation_failed", "session_revocation_operation_conflict",
    "recovery_session_revocation_failed", "app_check_required", "app_check_invalid", "app_check_not_configured", "content_report_not_found",
    "content_report_transition_invalid", "data_export_rate_limited", "data_export_too_large", "internal_error", "unknown",
  ]);
  const safeMessages = new Set(["incoming request", "request completed", "request errored", "account_sync_rejected", "app_check_rejected", "request_failed", "bootstrap_failed", "shutting_down", "shutdown_failed", "suppressed_log_message"]);
  const recoveryCodePattern = /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
  const stream = Object.freeze({
    write(chunk: string) {
      chunks.push(chunk);
      return true;
    },
  });
  const rememberSecret = (value: unknown): void => {
    if (typeof value === "string" && value.length >= 4) knownSecrets.add(value);
  };
  rememberSecret("aud08-explicit-app-check-fixture");
  const rememberKnownValues = (value: unknown, parentKey = ""): void => {
    if (Array.isArray(value)) {
      for (const entry of value) rememberKnownValues(entry, parentKey);
      return;
    }
    if (typeof value !== "object" || value === null) {
      if (knownSecretKeys.has(parentKey.toLowerCase()) || (parentKey.toLowerCase() === "code" && typeof value === "string" && recoveryCodePattern.test(value))) rememberSecret(value);
      return;
    }
    for (const [key, child] of Object.entries(value)) rememberKnownValues(child, key);
  };
  const hasForbiddenKey = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.some(hasForbiddenKey);
    if (typeof value !== "object" || value === null) return false;
    return Object.entries(value).some(([key, child]) => forbiddenLogKeys.has(key.toLowerCase()) || hasForbiddenKey(child));
  };
  return Object.freeze({
    stream,
    rememberSecret,
    observeRequest(headers: Headers, body: unknown): void {
      const authorization = headers.get("authorization");
      rememberSecret(authorization);
      rememberSecret(authorization?.replace(/^Bearer\s+/iu, ""));
      rememberSecret(headers.get("cookie"));
      rememberSecret(headers.get("x-firebase-appcheck"));
      rememberKnownValues(body);
    },
    async observeResponse(method: string, status: number, response: Response): Promise<void> {
      completedFetches.push(Object.freeze({ method, status }));
      try { rememberKnownValues(await response.clone().json()); } catch { /* Non-JSON HTTP responses have no known response fields to inspect. */ }
    },
    verify(label: string, expectedNegativeStatuses: readonly number[] = []): Readonly<{ requests: number; positive: number; negative: number }> {
      const records = chunks.join("").split("\n").filter((line) => line.length > 0).map((line) => {
        try {
          const parsed: unknown = JSON.parse(line);
          return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
        } catch { return null; }
      });
      let safeShape = records.length > 0 && records.every((record) => record !== null);
      const allowedTopLevelKeys = new Set(["level", "time", "reqId", "req", "res", "err", "responseTime", "msg", "event", "stage", "signal", "code", "correlationId"]);
      const incomingById = new Map<string, string>();
      const completedIds = new Set<string>();
      const completions: Array<Readonly<{ method: string; status: number }>> = [];
      const requestId = (record: Record<string, unknown>): string | null => typeof record.reqId === "string" && record.reqId.length > 0 ? record.reqId : null;
      for (const value of records) {
        if (!value) continue;
        if (!Object.keys(value).every((key) => allowedTopLevelKeys.has(key)) || hasForbiddenKey(value)
          || typeof value.level !== "number" || typeof value.time !== "number"
          || typeof value.msg !== "string" || !safeMessages.has(value.msg)
          || ("reqId" in value && (typeof value.reqId !== "string" || !uuidPattern.test(value.reqId)))
          || ("event" in value && !safeEvents.has(String(value.event)))
          || ("stage" in value && !safeStages.has(String(value.stage)))
          || ("signal" in value && !safeSignals.has(String(value.signal)))
          || ("code" in value && !safeCodes.has(String(value.code)))
          || ("correlationId" in value && (typeof value.correlationId !== "string" || !uuidPattern.test(value.correlationId)))
          || ("responseTime" in value && (typeof value.responseTime !== "number" || !Number.isFinite(value.responseTime) || value.responseTime < 0))) safeShape = false;
        if ("err" in value && (typeof value.err !== "object" || value.err === null || Array.isArray(value.err)
          || Object.keys(value.err).length !== 1 || (value.err as Record<string, unknown>).code !== "internal_error")) safeShape = false;
        const id = requestId(value);
        if ("req" in value) {
          const request = value.req;
          if (!id || !uuidPattern.test(id) || typeof request !== "object" || request === null || Array.isArray(request)
            || Object.keys(request).length !== 1 || typeof (request as Record<string, unknown>).method !== "string"
            || incomingById.has(id)) safeShape = false;
          else incomingById.set(id, (request as { method: string }).method);
        }
        if ("res" in value) {
          const response = value.res;
          if (!id || !uuidPattern.test(id) || typeof response !== "object" || response === null || Array.isArray(response)
            || Object.keys(response).length !== 1 || typeof (response as Record<string, unknown>).statusCode !== "number"
            || completedIds.has(id)) safeShape = false;
          else {
            const method = incomingById.get(id);
            if (!method) safeShape = false;
            else {
              completedIds.add(id);
              completions.push(Object.freeze({ method, status: (response as { statusCode: number }).statusCode }));
            }
          }
        }
      }
      const pairKey = ({ method, status }: CompletedHttpPair) => `${method}:${status}`;
      const expectedCounts = new Map<string, number>();
      const actualCounts = new Map<string, number>();
      for (const pair of completedFetches) expectedCounts.set(pairKey(pair), (expectedCounts.get(pairKey(pair)) ?? 0) + 1);
      for (const pair of completions) actualCounts.set(pairKey(pair), (actualCounts.get(pairKey(pair)) ?? 0) + 1);
      const completeCorrelation = incomingById.size === completedFetches.length && completedIds.size === incomingById.size && completions.length === completedFetches.length;
      const pairMatch = expectedCounts.size === actualCounts.size && [...expectedCounts].every(([key, count]) => actualCounts.get(key) === count);
      const hasPositive = completedFetches.some(({ status }) => status >= 200 && status < 300);
      const hasExpectedNegativeStatuses = expectedNegativeStatuses.every((status) => completedFetches.some((pair) => pair.status === status));
      const rawLogs = chunks.join("");
      const noKnownSecrets = [...knownSecrets].every((secret) => !rawLogs.includes(secret));
      const noCredentialPatterns = !/\b[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}\b/u.test(rawLogs)
        && !/\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{1,}\.[A-Za-z0-9_-]{1,}\b/u.test(rawLogs);
      assert.ok(safeShape, `${label}: backend log records must keep the allowlisted shape`);
      assert.ok(completeCorrelation && pairMatch && completedFetches.length > 0, `${label}: backend log method/status pairs must match completed HTTP fetches`);
      assert.ok(hasPositive && hasExpectedNegativeStatuses, `${label}: expected HTTP success and negative statuses must be represented`);
      assert.ok(noKnownSecrets && noCredentialPatterns, `${label}: backend log records must not contain known secrets or credential patterns`);
      return Object.freeze({ requests: completedFetches.length, positive: completedFetches.filter(({ status }) => status >= 200 && status < 300).length, negative: completedFetches.filter(({ status }) => status >= 400).length });
    },
  });
}

async function importBackendModule(relativePath: string): Promise<Record<string, unknown>> {
  return await import(pathToFileURL(resolve(backendRoot, relativePath)).href) as Record<string, unknown>;
}

function requireBackendExport<T>(moduleValue: Record<string, unknown>, name: string): T {
  if (!(name in moduleValue)) throw new Error(`aud08_backend_export_missing:${name}`);
  return moduleValue[name] as T;
}

async function loadBackendBootstrap() {
  const [pathsModule, appModule, firestoreClientModule, firestoreStoresModule, verifierModule, adminAuthModule, pseudonymModule, supportModule] = await Promise.all([
    importBackendModule("src/infrastructure/firestore/paths.js"),
    importBackendModule("src/api/app.js"),
    importBackendModule("src/infrastructure/firestore/client.js"),
    importBackendModule("src/infrastructure/firestore/stores.js"),
    importBackendModule("src/infrastructure/firebase/verifier.js"),
    importBackendModule("src/infrastructure/firebase/adminAuth.js"),
    importBackendModule("src/infrastructure/security/pseudonymKeyRing.js"),
    importBackendModule("tests/support.js"),
  ]);
  return Object.freeze({
    COLLECTIONS: requireBackendExport<CollectionNames>(pathsModule, "COLLECTIONS"),
    identityDocumentId: requireBackendExport<(provider: string, subject: string) => string>(pathsModule, "identityDocumentId"),
    buildApplication: requireBackendExport<(dependencies: Readonly<Record<string, unknown>>) => BackendApplication>(appModule, "buildApplication"),
    createFirestoreRuntime: requireBackendExport<(environment: unknown) => BackendRuntime>(firestoreClientModule, "createFirestoreRuntime"),
    createFirestoreStores: requireBackendExport<(runtime: BackendRuntime, environment: unknown, authOverride?: Readonly<{
      createCustomToken(userId: string, claims?: Readonly<Record<string, unknown>>): Promise<string>;
      revokeRefreshTokens(userId: string): Promise<void>;
      deleteUser(userId: string): Promise<void>;
    }>) => unknown>(firestoreStoresModule, "createFirestoreStores"),
    createFirebaseTokenVerifier: requireBackendExport<(environment: unknown) => unknown>(verifierModule, "createFirebaseTokenVerifier"),
    createFirebaseAdminAuth: requireBackendExport<(app: unknown) => Readonly<{
      createCustomToken(userId: string, claims?: Readonly<Record<string, unknown>>): Promise<string>;
      revokeRefreshTokens(userId: string): Promise<void>;
      deleteUser(userId: string): Promise<void>;
    }>>(adminAuthModule, "createFirebaseAdminAuth"),
    PseudonymKeyRing: requireBackendExport<PseudonymKeyRingConstructor>(pseudonymModule, "PseudonymKeyRing"),
    testEnvironment: requireBackendExport<BackendTestEnvironment>(supportModule, "testEnvironment"),
  });
}

function requireIsolatedPins(): void {
  if (!enabled || projectId !== "demo-patternly-aud08-mobile" || authHost !== "127.0.0.1:19119" || firestoreHost !== "127.0.0.1:18119") {
    throw new Error("aud08_mobile_integration_isolated_emulator_required");
  }
}

async function ensureRecoveryRequestRateBudget(runtime: BackendRuntime, collections: CollectionNames, environment: BackendTestEnvironment, requiredCalls: number): Promise<void> {
  const maximum = environment.recoveryOperationRateLimitMax;
  const windowSeconds = environment.recoveryOperationRateLimitWindowSeconds;
  if (!Number.isSafeInteger(maximum) || maximum < 6 || !Number.isSafeInteger(windowSeconds) || windowSeconds < 1 || windowSeconds > 60) {
    throw new Error("aud08_recovery_rate_budget_configuration_unexpected");
  }
  const windowMs = windowSeconds * 1_000;
  const initialWindowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const deadline = initialWindowStart + windowMs + 5_000;
  while (true) {
    const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs;
    const buckets = await runtime.db.collection(collections.rateLimitBuckets).where("purpose", "==", "recovery_request").get();
    const currentBuckets = await Promise.all(buckets.docs.map(async ({ ref }) => {
      const snapshot = await ref.get();
      return Object.freeze({ windowStartMs: snapshot.get("windowStartMs"), count: snapshot.get("count") });
    })).then((entries) => entries.filter((entry) => entry.windowStartMs === windowStartMs));
    if (currentBuckets.some(({ count }) => typeof count !== "number" || !Number.isSafeInteger(count) || count < 1 || count > maximum)) {
      throw new Error("aud08_recovery_rate_budget_counter_invalid");
    }
    const count = currentBuckets.reduce((total, entry) => total + (entry.count as number), 0);
    if (count > maximum) throw new Error("aud08_recovery_rate_budget_counter_over_limit");
    if (maximum - count >= requiredCalls) return;
    if (Date.now() >= deadline) {
      throw new Error("aud08_recovery_rate_budget_window_timeout");
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, Math.min(250, Math.max(1, deadline - Date.now()))));
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const segments = token.split(".");
  if (segments.length !== 3) throw new Error("firebase_id_token_invalid");
  return JSON.parse(Buffer.from(segments[1]!, "base64url").toString("utf8")) as Record<string, unknown>;
}

function installRecentAuthenticationClockFixture(installCount: { value: number }): () => void {
  const originalNow = Date.now;
  installCount.value += 1;
  Date.now = () => originalNow() + 301_000;
  return () => { Date.now = originalNow; };
}

test("mobile recovery coordinator, secure-store fixture and adapter complete real HTTP recovery operations", { skip: !enabled }, async (context) => {
  requireIsolatedPins();
  const backendRequire = createRequire(resolve(appRoot, "../patternly-backend/package.json"));
  const firebaseAdminApp = backendRequire("firebase-admin/app") as { deleteApp(app: unknown): Promise<void> };
  const firebaseAdminAuth = backendRequire("firebase-admin/auth") as { getAuth(app: unknown): { deleteUser(uid: string): Promise<void> } };
  const { COLLECTIONS, identityDocumentId, buildApplication, createFirestoreRuntime, createFirestoreStores, createFirebaseTokenVerifier, createFirebaseAdminAuth, PseudonymKeyRing, testEnvironment } = await loadBackendBootstrap();
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;

  const logProbe = createBackendHttpLogProbe();
  const environment = Object.freeze({
    ...testEnvironment,
    firebaseProjectId: projectId,
    firebaseAuthIssuer: `https://securetoken.google.com/${projectId}`,
    logLevel: "info",
  });
  const runtime = createFirestoreRuntime(environment);
  const actualAdmin = createFirebaseAdminAuth(runtime.app);
  const observedAdmin = Object.freeze({
    createCustomToken: async (uid: string, claims?: Readonly<Record<string, unknown>>) => {
      const token = await actualAdmin.createCustomToken(uid, claims);
      logProbe.rememberSecret(token);
      return token;
    },
    revokeRefreshTokens: (uid: string) => actualAdmin.revokeRefreshTokens(uid),
    deleteUser: (uid: string) => actualAdmin.deleteUser(uid),
  });
  const stores = createFirestoreStores(runtime, environment, observedAdmin);
  const realTokenVerifier = createFirebaseTokenVerifier(environment) as BackendTokenVerifier;
  const recentAuthClockFixtureInstalls = { value: 0 };
  const requestClock = { restore: null as (() => void) | null };
  const backend = buildApplication({
    environment,
    firestore: runtime,
    verifier: {
      async verify(idToken: string) {
        const identity = await realTokenVerifier.verify(idToken);
        return identity;
      },
    },
    appCheckVerifier: { verify: async (token: string) => { if (token !== "aud08-explicit-app-check-fixture") throw new Error("app_check_invalid"); } },
    stores,
    logStream: logProbe.stream,
  });
  let firebaseAppInstance: unknown;
  let clientAuth: FirebaseAuth | null = null;
  let apiOrigin = "";
  const vaultData = new Map<string, string>();
  const durableVaultWriteValues: string[] = [];
  let rejectNextIssueResultVaultSave = false;
  let rejectConsumeBindingVaultSavesRemaining = 0;
  let issueResultVaultSaveFailures = 0;
  let consumeBindingVaultSaveFailures = 0;
  const issueResultVaultValuesPreservedOnFailure: Array<string | null> = [];
  const consumeBindingVaultValuesPreservedOnFailure: Array<string | null> = [];
  const recoverySignInVaultEvidence: Array<Readonly<{
    firebaseUid: string;
    operationId: unknown;
    expectedFirebaseUid: unknown;
    expectedAuthorizationGeneration: unknown;
    tokenPersisted: boolean;
  }>> = [];
  const vault = createRecoveryOperationVault({
    getItemAsync: async (key) => vaultData.get(key) ?? null,
    setItemAsync: async (key, value) => {
      const next = JSON.parse(value) as Record<string, unknown>;
      if (rejectNextIssueResultVaultSave && next.kind === "issue" && next.status === "result_available" && Array.isArray(next.codes)) {
        rejectNextIssueResultVaultSave = false;
        issueResultVaultSaveFailures += 1;
        issueResultVaultValuesPreservedOnFailure.push(vaultData.get(key) ?? null);
        throw new Error("fixture_issue_result_secure_store_write_failure");
      }
      if (rejectConsumeBindingVaultSavesRemaining > 0 && next.kind === "consume" && next.status === "result_available"
        && typeof next.expectedFirebaseUid === "string" && typeof next.expectedAuthorizationGeneration === "number") {
        rejectConsumeBindingVaultSavesRemaining -= 1;
        consumeBindingVaultSaveFailures += 1;
        consumeBindingVaultValuesPreservedOnFailure.push(vaultData.get(key) ?? null);
        throw new Error("fixture_consume_binding_secure_store_write_failure");
      }
      vaultData.set(key, value);
      durableVaultWriteValues.push(value);
    },
    deleteItemAsync: async (key) => { vaultData.delete(key); },
  });
  const attemptedRequests: Array<Readonly<{ method: string; path: string }>> = [];
  const actualRequests: Array<Readonly<{ method: string; path: string; authorization: boolean; appCheck: boolean }>> = [];
  const issueOperationIds: string[] = [];
  const issueStatusOperationIds: string[] = [];
  const durableIssueOperationIdsBeforePost: string[] = [];
  const durablePreviousIssueIdsBeforePost: string[] = [];
  const issuePostResponsesLostAfterCommit: string[] = [];
  const issueAckResponsesLostAfterCommit: string[] = [];
  const issueAckOperationIds: string[] = [];
  const consumeOperationIds: string[] = [];
  const consumeOperationIdsDurableBeforePost: string[] = [];
  const consumePostResponsesLostAfterCommit: string[] = [];
  const consumeStatusResponsesLostBeforeDelivery: Array<Readonly<{ operationId: string; code: string }>> = [];
  const consumeStatusProofsReceived: Array<Readonly<{ operationId: string; code: string; status: unknown }>> = [];
  const consumeAckResponsesLostAfterCommit: string[] = [];
  let issuedCodes: readonly string[] = [];
  let createdFirebaseUid = "";
  let createdUserId = "";
  let issueCodeHash = "";
  let failFirstConsumeAck = true;
  let loseNextConsumePostResponseAfterCommit = false;
  let loseNextConsumeStatusResponseBeforeDelivery = false;
  let loseNextConsumeAckResponseAfterCommit = false;
  let loseNextIssuePostResponseAfterCommit = false;
  let loseNextIssueAckResponseAfterCommit = false;
  let issueAckSavedIntentObserved = false;
  let expectStaleIssue = false;
  let staleOperationId = "";
  let signInCalls = 0;
  const requireMemorySavedIntentBeforeIssueAck = () => {
    const serialized = vaultData.get(RECOVERY_OPERATION_VAULT_KEY);
    if (!serialized) return false;
    try {
      const record = JSON.parse(serialized) as { kind?: unknown; savedIntent?: unknown };
      return record.kind === "issue" && record.savedIntent === true;
    } catch { return false; }
  };
  const fetchImplementation: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const method = (init?.method ?? "GET").toUpperCase();
    attemptedRequests.push(Object.freeze({ method, path: url.pathname }));
    const headers = new Headers(init?.headers);
    const requestBody = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : null;
    if (url.pathname === "/v1/account/recovery-codes/issue/status" && method === "GET") {
      const operationId = url.searchParams.get("operationId");
      if (operationId) issueStatusOperationIds.push(operationId);
    }
    if (url.pathname === "/v1/account/recovery-codes" && method === "POST") {
      const token = headers.get("authorization")?.replace(/^Bearer\s+/iu, "") ?? "";
      const claims = decodeJwtPayload(token);
      const authTime = claims.auth_time;
      const actualAgeSeconds = typeof authTime === "number" ? Math.floor(Date.now() / 1_000) - authTime : Number.POSITIVE_INFINITY;
      const requestAgeSeconds = actualAgeSeconds + (expectStaleIssue ? 301 : 0);
      if (actualAgeSeconds < 0 || actualAgeSeconds >= 300 || (expectStaleIssue ? requestAgeSeconds < 300 : requestAgeSeconds >= 300)) {
        throw new Error("recovery_issue_token_age_unexpected");
      }
      if (typeof requestBody?.operationId === "string" && requestBody.operationId !== staleOperationId) {
        issueOperationIds.push(requestBody.operationId);
        if (loseNextIssuePostResponseAfterCommit || rejectNextIssueResultVaultSave) {
          const serialized = vaultData.get(RECOVERY_OPERATION_VAULT_KEY);
          if (!serialized) throw new Error("issue_operation_not_durable_before_post");
          const savedRecord = JSON.parse(serialized) as { kind?: unknown; operationId?: unknown; previousIssue?: unknown };
          if (savedRecord.kind !== "issue" || savedRecord.operationId !== requestBody.operationId) throw new Error("issue_operation_id_not_durable_before_post");
          durableIssueOperationIdsBeforePost.push(savedRecord.operationId);
          if (typeof savedRecord.previousIssue === "object" && savedRecord.previousIssue !== null
            && "operationId" in savedRecord.previousIssue && typeof savedRecord.previousIssue.operationId === "string") {
            durablePreviousIssueIdsBeforePost.push(savedRecord.previousIssue.operationId);
          }
        }
      }
    }
    if (url.pathname === "/v1/account/recovery-codes/issue/saved-ack" && method === "POST") {
      if (!requireMemorySavedIntentBeforeIssueAck()) throw new Error("issue_saved_intent_not_durable_before_ack");
      issueAckSavedIntentObserved = true;
      if (typeof requestBody?.operationId === "string") issueAckOperationIds.push(requestBody.operationId);
    }
    if (url.pathname === "/v1/public/recovery-codes/consume" && method === "POST" && typeof requestBody?.operationId === "string") {
      consumeOperationIds.push(requestBody.operationId);
      if (loseNextConsumePostResponseAfterCommit || rejectConsumeBindingVaultSavesRemaining > 0) {
        const serialized = vaultData.get(RECOVERY_OPERATION_VAULT_KEY);
        if (!serialized) throw new Error("consume_operation_not_durable_before_post");
        const savedRecord = JSON.parse(serialized) as { kind?: unknown; operationId?: unknown; code?: unknown };
        if (savedRecord.kind !== "consume" || savedRecord.operationId !== requestBody.operationId || savedRecord.code !== requestBody.code) {
          throw new Error("consume_operation_and_code_not_durable_before_post");
        }
        consumeOperationIdsDurableBeforePost.push(savedRecord.operationId);
      }
    }
    if (url.pathname === "/v1/account/recovery-codes/consume/ack" && method === "POST" && failFirstConsumeAck) {
      failFirstConsumeAck = false;
      throw new TypeError("simulated_ack_response_loss_before_send");
    }
    if (expectStaleIssue) requestClock.restore = installRecentAuthenticationClockFixture(recentAuthClockFixtureInstalls);
    try {
      logProbe.observeRequest(headers, requestBody);
      const response = await fetch(input, init);
      await logProbe.observeResponse(method, response.status, response);
      if (url.pathname === "/v1/account/session/exchange" && !response.ok) {
        const allowedSessionErrorCodes = new Set([
          "internal_error", "invalid_request", "account_deleted", "account_not_found",
          "recent_reauthentication_required", "authentication_required", "app_check_invalid",
        ]);
        let errorCode = "unrecognized_error_code";
        try {
          const diagnosticBody = await response.clone().json() as { error?: { code?: unknown } };
          const candidate = diagnosticBody?.error?.code;
          if (typeof candidate === "string" && allowedSessionErrorCodes.has(candidate)) errorCode = candidate;
        } catch { /* Diagnostics must preserve the original response and test behavior. */ }
        context.diagnostic(`session exchange refused: HTTP ${response.status}; code=${errorCode}`);
      }
      actualRequests.push(Object.freeze({
        method,
        path: url.pathname,
        authorization: headers.has("authorization"),
        appCheck: headers.has("x-firebase-appcheck"),
      }));
      if (url.pathname === "/v1/account/recovery-codes" && method === "POST" && response.ok) {
        const body = await response.clone().json() as { codes?: unknown };
        if (Array.isArray(body.codes) && body.codes.every((value) => typeof value === "string")) issuedCodes = Object.freeze([...body.codes] as string[]);
        if (loseNextIssuePostResponseAfterCommit) {
          const operationId = typeof requestBody?.operationId === "string" ? requestBody.operationId : "";
          if (!operationId) throw new Error("issue_operation_id_missing_after_commit");
          const operation = await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(operationId).get();
          const result = await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(operationId).get();
          assert.equal(operation.exists, true, "issue POST must commit the operation before its response is lost");
          assert.equal(operation.get("status"), "result_available");
          assert.equal(result.exists, true, "issue POST must commit its encrypted result before its response is lost");
          issuePostResponsesLostAfterCommit.push(operationId);
          loseNextIssuePostResponseAfterCommit = false;
          throw new TypeError("simulated_issue_response_loss_after_commit");
        }
      }
      if (url.pathname === "/v1/account/recovery-codes/issue/saved-ack" && method === "POST" && response.ok && loseNextIssueAckResponseAfterCommit) {
        const operationId = typeof requestBody?.operationId === "string" ? requestBody.operationId : "";
        if (!operationId) throw new Error("issue_ack_operation_id_missing_after_commit");
        const body = await response.clone().json() as { operationId?: unknown; status?: unknown };
        assert.equal(body.operationId, operationId);
        assert.equal(body.status, "acknowledged");
        const operation = await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(operationId).get();
        const result = await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(operationId).get();
        assert.equal(operation.get("status"), "acknowledged", "saved ACK must commit before its response is lost");
        assert.equal(result.exists, false, "saved ACK must remove the encrypted result before its response is lost");
        issueAckResponsesLostAfterCommit.push(operationId);
        loseNextIssueAckResponseAfterCommit = false;
        throw new TypeError("simulated_issue_ack_response_loss_after_commit");
      }
      if (url.pathname === "/v1/public/recovery-codes/consume" && method === "POST" && response.ok) {
        const body = await response.clone().json() as { operationId?: unknown };
        if (typeof body.operationId === "string" && !consumeOperationIds.includes(body.operationId)) consumeOperationIds.push(body.operationId);
        if (loseNextConsumePostResponseAfterCommit) {
          const operationId = typeof body.operationId === "string" ? body.operationId : "";
          const code = typeof requestBody?.code === "string" ? requestBody.code : "";
          if (!operationId || !code) throw new Error("consume_response_commit_identity_missing");
          const operation = await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(operationId).get();
          const result = await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(operationId).get();
          const user = await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get();
          const codeHash = createHash("sha256").update(code, "utf8").digest("hex");
          const codeIndex = await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(codeHash).get();
          const securityOperation = user.get("securityOperation") as Record<string, unknown> | undefined;
          assert.equal(operation.get("kind"), "recovery");
          assert.equal(operation.get("status"), "result_available");
          assert.equal(operation.get("expectedAuthorizationGeneration"), 1);
          assert.equal(operation.get("resultingAuthorizationGeneration"), 2);
          assert.equal(result.exists, true, "consume POST must commit its encrypted result before its response is lost");
          assert.equal(user.get("authorizationGeneration"), 2);
          assert.equal(securityOperation?.operationId, operationId);
          const usedAt = codeIndex.get("usedAt");
          assert.ok(usedAt !== null && usedAt !== undefined, "consume POST must mark the proof index used before its response is lost");
          consumePostResponsesLostAfterCommit.push(operationId);
          loseNextConsumePostResponseAfterCommit = false;
          throw new TypeError("simulated_consume_response_loss_after_commit");
        }
      }
      if (url.pathname === "/v1/public/recovery-codes/consume/status" && method === "POST" && response.ok) {
        const requestOperationId = typeof requestBody?.operationId === "string" ? requestBody.operationId : "";
        const requestCode = typeof requestBody?.code === "string" ? requestBody.code : "";
        const body = await response.clone().json() as { operationId?: unknown; status?: unknown };
        if (!requestOperationId || !requestCode || body.operationId !== requestOperationId) throw new Error("consume_status_proof_mismatch");
        const proof = Object.freeze({ operationId: requestOperationId, code: requestCode, status: body.status });
        if (loseNextConsumeStatusResponseBeforeDelivery) {
          assert.equal(body.status, "result_available");
          consumeStatusResponsesLostBeforeDelivery.push(Object.freeze({ operationId: requestOperationId, code: requestCode }));
          loseNextConsumeStatusResponseBeforeDelivery = false;
          throw new TypeError("simulated_consume_status_response_loss_before_delivery");
        }
        consumeStatusProofsReceived.push(proof);
      }
      if (url.pathname === "/v1/account/recovery-codes/consume/ack" && method === "POST" && response.ok && loseNextConsumeAckResponseAfterCommit) {
        const operationId = typeof requestBody?.operationId === "string" ? requestBody.operationId : "";
        if (!operationId) throw new Error("consume_ack_operation_id_missing_after_commit");
        const body = await response.clone().json() as { operationId?: unknown; status?: unknown; authorizationGeneration?: unknown };
        assert.equal(body.operationId, operationId);
        assert.equal(body.status, "acknowledged");
        assert.equal(body.authorizationGeneration, 2);
        const operation = await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(operationId).get();
        const result = await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(operationId).get();
        const user = await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get();
        assert.equal(operation.get("status"), "acknowledged", "consume ACK must commit before its response is lost");
        assert.equal(result.exists, false, "consume ACK must delete the encrypted result before its response is lost");
        assert.equal(user.get("authorizationGeneration"), 2);
        assert.equal(user.get("securityOperation"), undefined);
        consumeAckResponsesLostAfterCommit.push(operationId);
        loseNextConsumeAckResponseAfterCommit = false;
        throw new TypeError("simulated_consume_ack_response_loss_after_commit");
      }
      return response;
    } finally {
      if (requestClock.restore) {
        requestClock.restore();
        requestClock.restore = null;
      }
    }
  };

  let client: ReturnType<typeof createPatternlyApiClient>;

  const makeCoordinator = (generationOverride?: number | null, coordinatorVault = vault) => createRecoveryOperationCoordinator({
    api: client,
    auth: {
      getSnapshot: () => clientAuth?.currentUser ? Object.freeze({
        uid: clientAuth.currentUser.uid,
        email: clientAuth.currentUser.email,
        emailVerified: clientAuth.currentUser.emailVerified,
        providers: Object.freeze(["password"] as const),
      }) : null,
      getAuthorizationGeneration: async () => {
        if (generationOverride !== undefined) return generationOverride;
        const user = clientAuth?.currentUser;
        if (!user) return null;
        const claims = (await firebaseAuth.getIdTokenResult(user, true)).claims;
        return typeof claims.authorizationGeneration === "number" ? claims.authorizationGeneration : null;
      },
      signInWithRecoveryToken: async (token) => {
        signInCalls += 1;
        const serializedBeforeSignIn = vaultData.get(RECOVERY_OPERATION_VAULT_KEY) ?? "";
        const recordBeforeSignIn = serializedBeforeSignIn ? JSON.parse(serializedBeforeSignIn) as Record<string, unknown> : {};
        const signedIn = await firebaseAuth.signInWithCustomToken(clientAuth!, token);
        recoverySignInVaultEvidence.push(Object.freeze({
          firebaseUid: signedIn.user.uid,
          operationId: recordBeforeSignIn.operationId,
          expectedFirebaseUid: recordBeforeSignIn.expectedFirebaseUid,
          expectedAuthorizationGeneration: recordBeforeSignIn.expectedAuthorizationGeneration,
          tokenPersisted: durableVaultWriteValues.some((serialized) => serialized.includes(token)),
        }));
        return Object.freeze({
          uid: signedIn.user.uid,
          email: signedIn.user.email,
          emailVerified: signedIn.user.emailVerified,
          providers: Object.freeze(["password"] as const),
        });
      },
    },
    newOperationId: randomUUID,
    vault: coordinatorVault,
  });

  try {
    apiOrigin = await backend.listen({ host: "127.0.0.1", port: 0 });
    const address = new URL(apiOrigin);
    apiOrigin = `${address.protocol}//${address.host}`;
    client = createPatternlyApiClient({
      apiOrigin,
      allowLocalHttpForSimulator: true,
      getIdToken: async () => clientAuth?.currentUser ? clientAuth.currentUser.getIdToken() : null,
      getAppCheckToken: async () => "aud08-explicit-app-check-fixture",
      fetchImplementation,
      timeoutMs: 10_000,
    });
    firebaseAppInstance = firebaseApp.initializeApp({
      apiKey: "aud08-emulator-api-key",
      appId: `1:1234567890:web:${randomUUID().replaceAll("-", "")}`,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
    }, `aud08-mobile-${randomUUID()}`);
    clientAuth = firebaseAuth.initializeAuth(firebaseAppInstance, { persistence: firebaseAuth.inMemoryPersistence });
    firebaseAuth.connectAuthEmulator(clientAuth, `http://${authHost}`, { disableWarnings: true });
    const email = `aud08-${randomUUID()}@example.com`;
    const password = "Patternly-test-123!";
    logProbe.rememberSecret(email);
    logProbe.rememberSecret(password);
    const created = await firebaseAuth.createUserWithEmailAndPassword(clientAuth, email, password);
    createdFirebaseUid = created.user.uid;
    logProbe.rememberSecret(createdFirebaseUid);

    createdUserId = randomUUID();
    logProbe.rememberSecret(createdUserId);
    const ring = new PseudonymKeyRing(JSON.parse(environment.deletionPseudonymKeysJson));
    const pseudonym = ring.active("firebase", createdFirebaseUid);
    await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).set({ authorizationGeneration: 1, authorizationState: "active" });
    await runtime.db.collection(COLLECTIONS.identityMappings).doc(pseudonym.documentId).set({
      keyVersion: pseudonym.keyVersion,
      provider: "firebase",
      subject: createdFirebaseUid,
      subjectHmac: pseudonym.subjectHmac,
      userId: createdUserId,
    });
    const identityMappingId = identityDocumentId("firebase", createdFirebaseUid);
    await runtime.db.collection(COLLECTIONS.identityMappings).doc(identityMappingId).set({
      provider: "firebase",
      subject: createdFirebaseUid,
      userId: createdUserId,
      email: email,
      emailVerified: false,
    });

    const bootstrapSession = await client.exchangeAccountSession();
    const bootstrapped = await firebaseAuth.signInWithCustomToken(clientAuth, bootstrapSession.customToken);
    assert.equal(bootstrapped.user.uid, createdFirebaseUid);
    const bootstrapClaims = await firebaseAuth.getIdTokenResult(bootstrapped.user, true);
    assert.equal(bootstrapClaims.claims.authorizationGeneration, 1);
    const generationBeforeReauth = bootstrapClaims.claims.authorizationGeneration;
    await firebaseAuth.reauthenticateWithCredential(bootstrapped.user, firebaseAuth.EmailAuthProvider.credential(email, password));
    const reauthenticatedUser = clientAuth.currentUser;
    assert.equal(reauthenticatedUser?.uid, createdFirebaseUid);
    const reauthClaims = reauthenticatedUser ? await firebaseAuth.getIdTokenResult(reauthenticatedUser, true) : { claims: {} };
    const reauthGeneration = reauthClaims.claims.authorizationGeneration;
    const reauthGenerationPresent = typeof reauthGeneration === "number" && Number.isSafeInteger(reauthGeneration);
    context.diagnostic(`Firebase SDK password reauth: sameUid=${reauthenticatedUser?.uid === createdFirebaseUid} generationBefore=${typeof generationBeforeReauth === "number" ? generationBeforeReauth : "absent"} generationAfter=${reauthGenerationPresent ? reauthGeneration : "absent"}`);
    assert.equal(reauthGenerationPresent, false, "Firebase SDK password reauth must be shown to drop the per-session generation claim");

    const issueSignInIntent = Object.freeze({ operationId: randomUUID(), firebaseUid: createdFirebaseUid, authorizationGeneration: 1 });
    let currentIssueSignInIntent: Readonly<{ operationId: string; firebaseUid: string; authorizationGeneration: number }> | null = issueSignInIntent;
    let exchangeStartingUid: string | null = null;
    const recoveryIssueAuth = Object.freeze({
      getSnapshot: () => clientAuth?.currentUser ? Object.freeze({
        uid: clientAuth.currentUser.uid,
        email: clientAuth.currentUser.email,
        emailVerified: clientAuth.currentUser.emailVerified,
        providers: Object.freeze(["password"] as const),
      }) : null,
      getAuthorizationGeneration: async () => {
        const user = clientAuth?.currentUser;
        if (!user) return null;
        const claims = (await firebaseAuth.getIdTokenResult(user, true)).claims;
        return typeof claims.authorizationGeneration === "number" ? claims.authorizationGeneration : null;
      },
      signInWithSessionToken: async (token: string) => {
        const signedIn = await firebaseAuth.signInWithCustomToken(clientAuth!, token);
        return Object.freeze({
          uid: signedIn.user.uid,
          email: signedIn.user.email,
          emailVerified: signedIn.user.emailVerified,
          providers: Object.freeze(["password"] as const),
        });
      },
    });
    const sessionExchangeCountBeforeRestore = actualRequests.filter((request) => request.path === "/v1/account/session/exchange").length;
    const attemptedSessionExchangesBeforeRestore = attemptedRequests.filter((request) => request.path === "/v1/account/session/exchange").length;
    const restoredGeneration = await ensureRecoveryIssueSignInSession({
      api: client,
      auth: recoveryIssueAuth,
      canContinue: () => clientAuth?.currentUser?.uid === issueSignInIntent.firebaseUid,
      isExplicitSignInCurrent: () => currentIssueSignInIntent === issueSignInIntent
        && currentIssueSignInIntent.firebaseUid === issueSignInIntent.firebaseUid
        && currentIssueSignInIntent.authorizationGeneration === issueSignInIntent.authorizationGeneration,
      onExchangeStarting: () => { exchangeStartingUid = clientAuth?.currentUser?.uid ?? null; },
      user: Object.freeze({ uid: createdFirebaseUid, email, emailVerified: false, providers: Object.freeze(["password"] as const) }),
      requiredAuthorizationGeneration: 1,
    });
    assert.equal(restoredGeneration, 1);
    assert.equal(exchangeStartingUid, createdFirebaseUid);
    assert.equal(clientAuth.currentUser?.uid, createdFirebaseUid);
    const restoredClaims = await firebaseAuth.getIdTokenResult(clientAuth.currentUser!, true);
    assert.equal(restoredClaims.claims.authorizationGeneration, 1);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/session/exchange").length, sessionExchangeCountBeforeRestore + 1);
    assert.equal(attemptedRequests.filter((request) => request.path === "/v1/account/session/exchange").length, attemptedSessionExchangesBeforeRestore + 1);
    context.diagnostic("ensureRecoveryIssueSignInSession restored the exact generation via real adapter exchange and Firebase custom-token sign-in after SDK credential reauth");

    const exchangeCountBeforeWrongGeneration = actualRequests.filter((request) => request.path === "/v1/account/session/exchange").length;
    const issuePostCountBeforeWrongGeneration = attemptedRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    await assert.rejects(ensureRecoveryIssueSignInSession({
      api: client,
      auth: Object.freeze({ ...recoveryIssueAuth, getAuthorizationGeneration: async () => 2 }),
      canContinue: () => clientAuth?.currentUser?.uid === issueSignInIntent.firebaseUid,
      isExplicitSignInCurrent: () => currentIssueSignInIntent === issueSignInIntent,
      onExchangeStarting: () => { throw new Error("wrong_generation_must_not_exchange"); },
      user: Object.freeze({ uid: createdFirebaseUid, email, emailVerified: false, providers: Object.freeze(["password"] as const) }),
      requiredAuthorizationGeneration: 1,
    }), (error: unknown) => typeof error === "object" && error !== null && "code" in error
      && (error as { code?: unknown }).code === "auth/authorization-generation-invalid");
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/session/exchange").length, exchangeCountBeforeWrongGeneration);
    assert.equal(attemptedRequests.filter((request) => request.path === "/v1/account/session/exchange").length, attemptedSessionExchangesBeforeRestore + 1);
    assert.equal(attemptedRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, issuePostCountBeforeWrongGeneration);
    context.diagnostic("wrong-generation rejection is helper-only with a controlled claim fixture; zero exchange and zero issue POST");
    currentIssueSignInIntent = null;

    const unknownOperationId = randomUUID();
    await assert.rejects(client.getRecoveryCodeIssueStatus(unknownOperationId), (error: unknown) =>
      typeof error === "object" && error !== null && "status" in error && (error as { status?: unknown }).status === 404,
    );
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(unknownOperationId).get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(unknownOperationId).get()).exists, false);

    const readRecoveryRateLimitState = async () => {
      const buckets = await runtime.db.collection(COLLECTIONS.rateLimitBuckets).where("purpose", "==", "recovery_request").get();
      return Promise.all(buckets.docs.map(async ({ ref }) => {
        const snapshot = await ref.get();
        return Object.freeze({
          id: ref.id,
          purpose: snapshot.get("purpose"),
          count: snapshot.get("count"),
          windowStartMs: snapshot.get("windowStartMs"),
        });
      })).then((items) => items.sort((left, right) => left.id.localeCompare(right.id)));
    };
    const rateLimitStateBeforeStaleIssue = await readRecoveryRateLimitState();
    staleOperationId = randomUUID();
    expectStaleIssue = true;
    try {
      await assert.rejects(client.issueRecoveryCodes(staleOperationId), (error: unknown) =>
        typeof error === "object" && error !== null && "status" in error && (error as { status?: unknown }).status === 401
          && "serverCode" in error && (error as { serverCode?: unknown }).serverCode === "recent_reauthentication_required",
      );
    } finally {
      expectStaleIssue = false;
      if (requestClock.restore) {
        requestClock.restore();
        requestClock.restore = null;
      }
    }
    assert.equal(recentAuthClockFixtureInstalls.value, 1);
    context.diagnostic("stale recovery issue uses a process-global +301s Date.now fixture only during its single awaited HTTP request (test concurrency=1); SDK sign-in and backend verifier remain real, while token auth_time itself is recent");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(staleOperationId).get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(staleOperationId).get()).exists, false);
    assert.deepEqual(await readRecoveryRateLimitState(), rateLimitStateBeforeStaleIssue);

    const initialIssuePostCount = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    const initialIssueStatusCount = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const coordinator = makeCoordinator();
    const firstGeneration = await coordinator.getSnapshot();
    assert.equal(firstGeneration.kind, "loading");
    loseNextIssuePostResponseAfterCommit = true;
    const issuePostInterrupted = await coordinator.startIssue({ firebaseUid: createdFirebaseUid, authorizationGeneration: 1 }, { replaceUnavailable: true });
    assert.equal(loseNextIssuePostResponseAfterCommit, false);
    assert.equal(issuePostInterrupted.kind, "issue");
    if (issuePostInterrupted.kind !== "issue") throw new Error("recovery_issue_missing");
    assert.equal(issuePostInterrupted.status, "in_progress");
    assert.equal(issuePostInterrupted.failure, "unavailable");
    assert.equal(issuePostInterrupted.codes, null);
    assert.equal(durableIssueOperationIdsBeforePost.length, 1);
    assert.equal(issuePostResponsesLostAfterCommit.length, 1);
    const issueOperationId = issuePostResponsesLostAfterCommit[0]!;
    assert.equal(durableIssueOperationIdsBeforePost[0], issueOperationId);
    assert.equal(issueOperationIds.length, 1);
    assert.equal(issueOperationIds[0], issueOperationId);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, initialIssuePostCount + 1);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(issueOperationId).get()).get("status"), "result_available");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(issueOperationId).get()).exists, true);

    // This is a same-process cold coordinator over the same memory vault, not a process restart or native secure-store test.
    const restoredIssueCoordinator = makeCoordinator();
    const issueRestoredFromVault = await restoredIssueCoordinator.load();
    assert.equal(issueRestoredFromVault.kind, "issue");
    const issuePostCountBeforeColdReconcile = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    const issueStatusCountBeforeColdReconcile = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const issued = await restoredIssueCoordinator.reconcilePending({ firebaseUid: createdFirebaseUid, authorizationGeneration: 1 });
    assert.equal(issued.kind, "issue");
    if (issued.kind !== "issue") throw new Error("recovery_issue_reconciliation_missing");
    assert.equal(issued.status, "result_available");
    assert.equal(issued.codes?.length, 10);
    assert.equal(issued.savedIntent, false);
    assert.equal(issued.replacementPending, false);
    assert.equal(issued.authorizationGeneration, 1);
    assert.equal(issuedCodes.length, 10);
    assert.equal(issueOperationIds.length, 1);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, issuePostCountBeforeColdReconcile);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length, issueStatusCountBeforeColdReconcile + 1);
    assert.equal(issueStatusOperationIds.at(-1), issueOperationId);
    assert.equal(issueStatusCountBeforeColdReconcile, initialIssueStatusCount);
    assert.equal(issueOperationIds[0], issueOperationId);
    issueCodeHash = createHash("sha256").update(issued.codes![0]!, "utf8").digest("hex");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(issueOperationId).get()).exists, true);

    const replacementVaultData = new Map<string, string>();
    const replacementVault = createRecoveryOperationVault({
      getItemAsync: async (key) => replacementVaultData.get(key) ?? null,
      setItemAsync: async (key, value) => { replacementVaultData.set(key, value); },
      deleteItemAsync: async (key) => { replacementVaultData.delete(key); },
    });
    const previousIssueId = randomUUID();
    await replacementVault.save({
      version: 1,
      kind: "issue",
      operationId: issueOperationId,
      firebaseUid: createdFirebaseUid,
      authorizationGeneration: 1,
      status: "provider_retryable",
      generationId: null,
      codes: null,
      savedIntent: false,
      previousIssue: {
        version: 1,
        kind: "issue",
        operationId: previousIssueId,
        firebaseUid: createdFirebaseUid,
        authorizationGeneration: 1,
        status: "delivery_unconfirmed",
        generationId: "prior-generation-fixture",
        codes: issued.codes!,
        savedIntent: false,
      },
    });
    const issuePostCountBeforeRetry = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    const issueStatusCountBeforeRetry = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const retriedReplacement = await makeCoordinator(undefined, replacementVault).retryRecoveryOperation();
    assert.equal(retriedReplacement.kind, "issue");
    if (retriedReplacement.kind !== "issue") throw new Error("replacement_status_missing");
    assert.equal(retriedReplacement.replacementPending, false);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, issuePostCountBeforeRetry);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length, issueStatusCountBeforeRetry + 1);

    const issueStatusCountBeforeSavedAck = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const savedAckCountBeforeCommitLoss = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length;
    loseNextIssueAckResponseAfterCommit = true;
    const saved = await restoredIssueCoordinator.confirmRecoveryCodesSaved();
    assert.equal(loseNextIssueAckResponseAfterCommit, false);
    assert.equal(saved.kind, "terminal");
    if (saved.kind !== "terminal") throw new Error("recovery_issue_ack_missing");
    assert.equal(saved.status, "acknowledged");
    assert.equal(issueAckSavedIntentObserved, true);
    assert.deepEqual(issueAckResponsesLostAfterCommit, [issueOperationId]);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length, savedAckCountBeforeCommitLoss + 1);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length, issueStatusCountBeforeSavedAck + 1);
    assert.equal(vaultData.has(RECOVERY_OPERATION_VAULT_KEY), false, "status reconciliation after committed saved ACK must clear the vault");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(issueOperationId).get()).get("status"), "acknowledged");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(issueOperationId).get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).collection("security").doc("recoveryCodes").get()).exists, true);

    await firebaseAuth.signOut(clientAuth);
    const requestCountBeforeConsume = actualRequests.length;
    const attemptedCountBeforeConsume = attemptedRequests.length;
    const consumePostCountBefore = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/public/recovery-codes/consume").length;
    const consumeCoordinator = makeCoordinator();
    loseNextConsumePostResponseAfterCommit = true;
    loseNextConsumeStatusResponseBeforeDelivery = true;
    const consumeInterrupted = await consumeCoordinator.startConsume(issued.codes![0]!);
    assert.equal(loseNextConsumePostResponseAfterCommit, false);
    assert.equal(loseNextConsumeStatusResponseBeforeDelivery, false);
    assert.equal(consumeInterrupted.kind, "consume");
    if (consumeInterrupted.kind !== "consume") throw new Error("recovery_consume_missing");
    assert.equal(consumeInterrupted.status, "in_progress");
    assert.equal(consumeInterrupted.expectedFirebaseUid, null);
    assert.equal(consumeInterrupted.expectedAuthorizationGeneration, null);
    assert.equal(consumeInterrupted.needsAccountResolution, true);
    assert.equal(clientAuth.currentUser, null, "both lost responses must leave the initial coordinator signed out");
    assert.equal(signInCalls, 0);
    assert.equal(consumeOperationIds.length, 1);
    assert.equal(consumeOperationIdsDurableBeforePost.length, 1);
    const consumeOperationId = consumeOperationIdsDurableBeforePost[0]!;
    assert.equal(consumePostResponsesLostAfterCommit.length, 1);
    assert.equal(consumePostResponsesLostAfterCommit[0], consumeOperationId);
    assert.equal(consumeOperationIds[0], consumeOperationId);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/public/recovery-codes/consume").length, consumePostCountBefore + 1);
    const consumeVaultRecord = JSON.parse(vaultData.get(RECOVERY_OPERATION_VAULT_KEY)!) as { kind?: unknown; operationId?: unknown; code?: unknown };
    assert.equal(consumeVaultRecord.kind, "consume");
    assert.equal(consumeVaultRecord.operationId, consumeOperationId);
    assert.equal(consumeVaultRecord.code, issued.codes![0]);
    assert.equal(consumeStatusResponsesLostBeforeDelivery.length, 1);
    assert.deepEqual(consumeStatusResponsesLostBeforeDelivery[0], { operationId: consumeOperationId, code: issued.codes![0] });
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(consumeOperationId).get()).get("status"), "result_available");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(consumeOperationId).get()).exists, true);
    assert.equal((await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get()).get("authorizationGeneration"), 2);
    const usedCodeAt = (await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(issueCodeHash).get()).get("usedAt");
    assert.ok(usedCodeAt !== null && usedCodeAt !== undefined);
    context.diagnostic("consume POST committed once and its response plus the initial automatic status response were lost; operation ID/code remain in the memory vault for cold-coordinator recovery");

    assert.equal(consumeOperationIds.length, 1);

    // This is a same-process cold coordinator over the same memory vault, not a process restart or native secure-store test.
    const coldCoordinator = makeCoordinator();
    const restored = await coldCoordinator.load();
    assert.equal(restored.kind, "consume");
    if (restored.kind !== "consume") throw new Error("cold_consume_restore_missing");
    assert.equal(restored.status, "in_progress");
    assert.equal(restored.expectedFirebaseUid, null);
    const consumed = await coldCoordinator.resumePendingRecovery();
    assert.equal(consumed.kind, "consume");
    if (consumed.kind !== "consume") throw new Error("cold_consume_status_recovery_missing");
    assert.equal(consumed.status, "result_available");
    assert.equal(consumed.expectedFirebaseUid, createdFirebaseUid);
    assert.equal(consumed.expectedAuthorizationGeneration, 2);
    assert.equal(consumed.needsAccountResolution, false);
    assert.equal(signInCalls, 1);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(consumeOperationId).get()).get("status"), "result_available");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(consumeOperationId).get()).exists, true, "the retained before-send ACK fixture must leave the committed result available");
    assert.deepEqual(consumeStatusProofsReceived.slice(0, 2), [
      { operationId: consumeOperationId, code: issued.codes![0], status: "result_available" },
      { operationId: consumeOperationId, code: issued.codes![0], status: "result_available" },
    ]);

    const beforeMismatchChecks = actualRequests.length;
    const attemptedBeforeMismatchChecks = attemptedRequests.length;
    const wrongUid = await coldCoordinator.reconcilePending({ firebaseUid: "another-emulator-user", authorizationGeneration: null });
    assert.equal(wrongUid.kind, "consume");
    if (wrongUid.kind !== "consume") throw new Error("wrong_uid_state_missing");
    assert.equal(wrongUid.needsAccountResolution, true);
    const missingGeneration = await coldCoordinator.reconcilePending({ firebaseUid: createdFirebaseUid, authorizationGeneration: null });
    assert.equal(missingGeneration.kind, "consume");
    if (missingGeneration.kind !== "consume") throw new Error("missing_generation_state_missing");
    assert.equal(missingGeneration.needsAccountResolution, true);
    assert.equal(actualRequests.length, beforeMismatchChecks);
    assert.equal(attemptedRequests.length, attemptedBeforeMismatchChecks);
    assert.equal(signInCalls, 1);

    const exactIdentity = await firebaseAuth.getIdTokenResult(clientAuth.currentUser!, true);
    assert.equal(exactIdentity.claims.sub, createdFirebaseUid);
    assert.equal(exactIdentity.claims.authorizationGeneration, 2);
    const actualConsumeAckCountBeforeLoss = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length;
    const attemptedConsumeAckCountBeforeLoss = attemptedRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length;
    assert.equal(actualConsumeAckCountBeforeLoss, 0);
    assert.equal(attemptedConsumeAckCountBeforeLoss, 1, "the retained first ACK fixture must fail before sending");
    const consumeStatusCountBeforeAckLoss = actualRequests.filter((request) => request.path === "/v1/public/recovery-codes/consume/status").length;
    loseNextConsumeAckResponseAfterCommit = true;
    const acknowledged = await coldCoordinator.reconcilePending({ firebaseUid: createdFirebaseUid, authorizationGeneration: 2 });
    assert.equal(loseNextConsumeAckResponseAfterCommit, false);
    assert.equal(acknowledged.kind, "terminal");
    if (acknowledged.kind !== "terminal") throw new Error("recovery_consume_ack_missing");
    assert.equal(acknowledged.status, "acknowledged");
    assert.equal(signInCalls, 1, "restored coordinator must ACK the persisted SDK identity without signing in again");
    assert.deepEqual(consumeAckResponsesLostAfterCommit, [consumeOperationId]);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length, actualConsumeAckCountBeforeLoss + 1);
    assert.equal(attemptedRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length, attemptedConsumeAckCountBeforeLoss + 1);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length, 1);
    assert.equal(attemptedRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length, 2);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/public/recovery-codes/consume").length, consumePostCountBefore + 1);
    assert.equal(attemptedRequests.filter((request) => request.method === "POST" && request.path === "/v1/public/recovery-codes/consume").length, 1);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/public/recovery-codes/consume/status").length, consumeStatusCountBeforeAckLoss + 1);
    assert.deepEqual(consumeStatusProofsReceived.at(-1), { operationId: consumeOperationId, code: issued.codes![0], status: "acknowledged" });
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(consumeOperationId).get()).get("status"), "acknowledged");
    assert.equal((await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get()).get("authorizationGeneration"), 2);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(consumeOperationId).get()).exists, false);
    const acknowledgedCodeUsedAt = (await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(issueCodeHash).get()).get("usedAt");
    assert.ok(acknowledgedCodeUsedAt !== null && acknowledgedCodeUsedAt !== undefined);
    assert.equal(vaultData.has(RECOVERY_OPERATION_VAULT_KEY), false);

    // Keep the added real HTTP attempts in the existing dedicated per-IP bucket without resetting it.
    const rateLimitWindowMs = environment.recoveryOperationRateLimitWindowSeconds * 1_000;
    const activeRateLimitWindowStartMs = Math.floor(Date.now() / rateLimitWindowMs) * rateLimitWindowMs;
    const rateLimitStateBeforeStorageFailures = await readRecoveryRateLimitState();
    const activeRateLimitCount = rateLimitStateBeforeStorageFailures.reduce((total, entry) =>
      total + (entry.windowStartMs === activeRateLimitWindowStartMs && typeof entry.count === "number" ? entry.count : 0), 0);
    assert.ok(activeRateLimitCount + 7 <= environment.recoveryOperationRateLimitMax, "storage failure cases must fit the isolated rate-limit budget without resetting it");

    const storageConsumeCode = issued.codes![1]!;
    const storageConsumeCodeHash = createHash("sha256").update(storageConsumeCode, "utf8").digest("hex");
    await firebaseAuth.signOut(clientAuth);
    const consumePostsBeforeVaultFailure = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/public/recovery-codes/consume").length;
    const consumeStatusBeforeVaultFailure = actualRequests.filter((request) => request.path === "/v1/public/recovery-codes/consume/status").length;
    const consumeAcksBeforeVaultFailure = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length;
    const attemptedConsumeAcksBeforeVaultFailure = attemptedRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length;
    const signInCallsBeforeVaultFailure = signInCalls;
    rejectConsumeBindingVaultSavesRemaining = 2;
    const consumeStorageFailureCoordinator = makeCoordinator();
    const consumeStorageFailed = await consumeStorageFailureCoordinator.startConsume(storageConsumeCode);
    assert.equal(rejectConsumeBindingVaultSavesRemaining, 0);
    assert.equal(consumeBindingVaultSaveFailures, 2, "both POST and automatic-status generation-binding writes must fail at the selected vault boundary");
    assert.equal(consumeStorageFailed.kind, "consume");
    if (consumeStorageFailed.kind !== "consume") throw new Error("consume_storage_failure_state_missing");
    assert.equal(consumeStorageFailed.status, "in_progress");
    assert.equal(consumeStorageFailed.expectedFirebaseUid, null);
    assert.equal(consumeStorageFailed.expectedAuthorizationGeneration, null);
    assert.equal(consumeStorageFailed.needsAccountResolution, true);
    assert.equal(signInCalls, signInCallsBeforeVaultFailure);
    assert.equal(clientAuth.currentUser, null, "failed consume binding persistence must not sign in");
    assert.equal(consumeOperationIds.length, 2);
    const storageConsumeOperationId = consumeOperationIds[1]!;
    assert.equal(consumeOperationIdsDurableBeforePost[1], storageConsumeOperationId);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/public/recovery-codes/consume").length, consumePostsBeforeVaultFailure + 1);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/public/recovery-codes/consume/status").length, consumeStatusBeforeVaultFailure + 1);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length, consumeAcksBeforeVaultFailure);
    assert.equal(attemptedRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length, attemptedConsumeAcksBeforeVaultFailure);
    assert.equal(consumeBindingVaultValuesPreservedOnFailure.length, 2);
    assert.equal(consumeBindingVaultValuesPreservedOnFailure[0], consumeBindingVaultValuesPreservedOnFailure[1]);
    assert.equal(vaultData.get(RECOVERY_OPERATION_VAULT_KEY), consumeBindingVaultValuesPreservedOnFailure[0], "failed binding writes must preserve the earlier operation ID/code record");
    const pendingConsumeVaultValue = JSON.parse(vaultData.get(RECOVERY_OPERATION_VAULT_KEY)!) as Record<string, unknown>;
    assert.equal(pendingConsumeVaultValue.kind, "consume");
    assert.equal(pendingConsumeVaultValue.operationId, storageConsumeOperationId);
    assert.equal(pendingConsumeVaultValue.code, storageConsumeCode);
    assert.equal(pendingConsumeVaultValue.status, "in_progress");
    assert.equal(pendingConsumeVaultValue.expectedFirebaseUid, null);
    assert.equal(pendingConsumeVaultValue.expectedAuthorizationGeneration, null);
    const storageConsumeOperation = await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(storageConsumeOperationId).get();
    const storageConsumeResult = await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(storageConsumeOperationId).get();
    const userAfterStorageConsume = await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get();
    const consumeSecurityOperation = userAfterStorageConsume.get("securityOperation") as Record<string, unknown> | undefined;
    const storageConsumeUsedAt = (await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(storageConsumeCodeHash).get()).get("usedAt");
    assert.equal(storageConsumeOperation.get("status"), "result_available");
    assert.equal(storageConsumeOperation.get("expectedAuthorizationGeneration"), 2);
    assert.equal(storageConsumeOperation.get("resultingAuthorizationGeneration"), 3);
    assert.equal(storageConsumeResult.exists, true);
    assert.equal(userAfterStorageConsume.get("authorizationGeneration"), 3);
    assert.equal(consumeSecurityOperation?.operationId, storageConsumeOperationId);
    assert.ok(storageConsumeUsedAt !== null && storageConsumeUsedAt !== undefined);

    // Retry from the retained code proof only after storage writes recover; generation binding must persist before SDK sign-in.
    const coldConsumeStorageCoordinator = makeCoordinator();
    const coldConsumeStorageRecord = await coldConsumeStorageCoordinator.load();
    assert.equal(coldConsumeStorageRecord.kind, "consume");
    const storageConsumeAcksBeforeRecovery = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length;
    const recoveredStorageConsume = await coldConsumeStorageCoordinator.resumePendingRecovery();
    assert.equal(recoveredStorageConsume.kind, "terminal");
    if (recoveredStorageConsume.kind !== "terminal") throw new Error("consume_storage_recovery_ack_missing");
    assert.equal(recoveredStorageConsume.status, "acknowledged");
    assert.equal(signInCalls, signInCallsBeforeVaultFailure + 1);
    const storageConsumeSignInEvidence = recoverySignInVaultEvidence.at(-1);
    assert.deepEqual(storageConsumeSignInEvidence, {
      firebaseUid: createdFirebaseUid,
      operationId: storageConsumeOperationId,
      expectedFirebaseUid: createdFirebaseUid,
      expectedAuthorizationGeneration: 3,
      tokenPersisted: false,
    });
    const storageConsumeSdkIdentity = await firebaseAuth.getIdTokenResult(clientAuth.currentUser!, true);
    assert.equal(storageConsumeSdkIdentity.claims.sub, createdFirebaseUid);
    assert.equal(storageConsumeSdkIdentity.claims.authorizationGeneration, 3);
    assert.deepEqual(consumeStatusProofsReceived.slice(-2), [
      { operationId: storageConsumeOperationId, code: storageConsumeCode, status: "result_available" },
      { operationId: storageConsumeOperationId, code: storageConsumeCode, status: "result_available" },
    ]);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/consume/ack").length, storageConsumeAcksBeforeRecovery + 1);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(storageConsumeOperationId).get()).get("status"), "acknowledged");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(storageConsumeOperationId).get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get()).get("authorizationGeneration"), 3);
    assert.equal(vaultData.has(RECOVERY_OPERATION_VAULT_KEY), false);

    // The first issue result was acknowledged before this second cycle, and the second consume moved the same user to generation 3.
    // Use the remaining per-user request allowance and keep the new operation serialized after both terminal ACKs.
    const storageIssueIdentity = await firebaseAuth.getIdTokenResult(clientAuth.currentUser!, true);
    assert.equal(storageIssueIdentity.claims.sub, createdFirebaseUid);
    assert.equal(storageIssueIdentity.claims.authorizationGeneration, 3);
    const issuePostsBeforeVaultFailure = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    const issueStatusesBeforeVaultFailure = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const issueAcksBeforeVaultFailure = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length;
    const issuePostIdsBeforeVaultFailure = issueOperationIds.length;
    const issueResultWriteFailuresBefore = issueResultVaultSaveFailures;
    rejectNextIssueResultVaultSave = true;
    const issueStorageFailureCoordinator = makeCoordinator();
    const issueStorageFailed = await issueStorageFailureCoordinator.startIssue({ firebaseUid: createdFirebaseUid, authorizationGeneration: 3 });
    assert.equal(rejectNextIssueResultVaultSave, false);
    assert.equal(issueResultVaultSaveFailures, issueResultWriteFailuresBefore + 1);
    assert.equal(issueStorageFailed.kind, "issue");
    if (issueStorageFailed.kind !== "issue") throw new Error("issue_storage_failure_state_missing");
    assert.equal(issueStorageFailed.status, "in_progress");
    assert.equal(issueStorageFailed.codes, null);
    assert.equal(issueStorageFailed.savedIntent, false);
    assert.equal(issueStorageFailed.failure, "unavailable");
    assert.equal(issueOperationIds.length, issuePostIdsBeforeVaultFailure + 1);
    const storageIssueOperationId = issueOperationIds.at(-1)!;
    assert.equal(durableIssueOperationIdsBeforePost.at(-1), storageIssueOperationId, "the issue operation ID must be durable before the POST can commit");
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, issuePostsBeforeVaultFailure + 1);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length, issueStatusesBeforeVaultFailure, "a failed result save must not issue an implicit status request");
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length, issueAcksBeforeVaultFailure);
    assert.equal(issueResultVaultValuesPreservedOnFailure.length, 1);
    assert.equal(vaultData.get(RECOVERY_OPERATION_VAULT_KEY), issueResultVaultValuesPreservedOnFailure[0], "failed code-result persistence must preserve the initial durable operation ID record");
    const pendingIssueVaultValue = JSON.parse(vaultData.get(RECOVERY_OPERATION_VAULT_KEY)!) as Record<string, unknown>;
    assert.equal(pendingIssueVaultValue.kind, "issue");
    assert.equal(pendingIssueVaultValue.operationId, storageIssueOperationId);
    assert.equal(pendingIssueVaultValue.status, "in_progress");
    assert.equal(pendingIssueVaultValue.codes, null);
    assert.equal(pendingIssueVaultValue.savedIntent, false);
    const storageIssueOperation = await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(storageIssueOperationId).get();
    const storageIssueResult = await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(storageIssueOperationId).get();
    const userAfterStorageIssue = await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get();
    const issueSecurityOperation = userAfterStorageIssue.get("securityOperation") as Record<string, unknown> | undefined;
    assert.equal(storageIssueOperation.get("kind"), "reissue");
    assert.equal(storageIssueOperation.get("status"), "result_available");
    assert.equal(storageIssueOperation.get("expectedAuthorizationGeneration"), 3);
    assert.equal(storageIssueResult.exists, true);
    assert.equal(userAfterStorageIssue.get("authorizationGeneration"), 3);
    assert.equal(issueSecurityOperation?.operationId, storageIssueOperationId);

    const coldIssueStorageCoordinator = makeCoordinator();
    const coldIssueStorageRecord = await coldIssueStorageCoordinator.load();
    assert.equal(coldIssueStorageRecord.kind, "issue");
    const issuePostsBeforeStorageReconcile = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    const issueStatusesBeforeStorageReconcile = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const recoveredStorageIssue = await coldIssueStorageCoordinator.reconcilePending({ firebaseUid: createdFirebaseUid, authorizationGeneration: 3 });
    assert.equal(recoveredStorageIssue.kind, "issue");
    if (recoveredStorageIssue.kind !== "issue") throw new Error("issue_storage_recovery_result_missing");
    assert.equal(recoveredStorageIssue.status, "result_available");
    assert.equal(recoveredStorageIssue.codes?.length, 10);
    assert.equal(recoveredStorageIssue.savedIntent, false);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, issuePostsBeforeStorageReconcile);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length, issueStatusesBeforeStorageReconcile + 1);
    assert.equal(issueStatusOperationIds.at(-1), storageIssueOperationId);
    const issueAcksBeforeStorageRecovery = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length;
    const savedStorageIssue = await coldIssueStorageCoordinator.confirmRecoveryCodesSaved();
    assert.equal(savedStorageIssue.kind, "terminal");
    if (savedStorageIssue.kind !== "terminal") throw new Error("issue_storage_recovery_ack_missing");
    assert.equal(savedStorageIssue.status, "acknowledged");
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length, issueAcksBeforeStorageRecovery + 1);
    assert.equal(issueAckOperationIds.at(-1), storageIssueOperationId);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(storageIssueOperationId).get()).get("status"), "acknowledged");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(storageIssueOperationId).get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get()).get("authorizationGeneration"), 3);
    assert.equal(vaultData.has(RECOVERY_OPERATION_VAULT_KEY), false);

    // Confirm an expired real issue before replacing it, preserving its backup until the replacement result is durable.
    const attemptedCountBeforeReplacement = attemptedRequests.length;
    const requestCountBeforeReplacement = actualRequests.length;
    const rateLimitStateBeforeReplacement = await readRecoveryRateLimitState();
    const replacementRateLimitCount = rateLimitStateBeforeReplacement.reduce((total, entry) =>
      total + (entry.windowStartMs === activeRateLimitWindowStartMs && typeof entry.count === "number" ? entry.count : 0), 0);
    assert.ok(replacementRateLimitCount + 6 <= environment.recoveryOperationRateLimitMax, "replacement recovery calls must fit the remaining isolated rate-limit budget without resetting it");

    const replacementSessionBarrier = (await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get()).get("authorizationRotatedAtSeconds");
    assert.ok(typeof replacementSessionBarrier === "number" && Number.isSafeInteger(replacementSessionBarrier) && replacementSessionBarrier >= 0);
    if (typeof replacementSessionBarrier !== "number") throw new Error("replacement_session_barrier_invalid");
    // Recovery rounds its barrier up, while SDK auth_time has whole-second precision.
    // Wait in real time before the explicit reauthentication; never alter the security fence.
    const replacementSessionWaitMs = Math.max(0, (replacementSessionBarrier + 1) * 1_000 - Date.now());
    assert.ok(replacementSessionWaitMs <= 3_000, "replacement session barrier must be within the bounded real-time wait");
    context.diagnostic(`replacement session barrier requires real-time wait=${replacementSessionWaitMs > 0}`);
    if (replacementSessionWaitMs > 0) await new Promise((accept) => setTimeout(accept, replacementSessionWaitMs));
    assert.ok(Math.floor(Date.now() / 1_000) > replacementSessionBarrier);
    await firebaseAuth.reauthenticateWithCredential(clientAuth.currentUser!, firebaseAuth.EmailAuthProvider.credential(email, password));
    const activeAuthAfterReauth = clientAuth as FirebaseAuth;
    const postReauthUser = activeAuthAfterReauth.currentUser;
    assert.equal(postReauthUser?.uid, createdFirebaseUid);
    const postReauthClaims = postReauthUser ? await firebaseAuth.getIdTokenResult(postReauthUser, true) : { claims: {} };
    assert.ok(typeof postReauthClaims.claims.auth_time === "number" && postReauthClaims.claims.auth_time > replacementSessionBarrier,
      "real SDK reauthentication must be strictly newer than the recovery rotation barrier");
    assert.equal(typeof postReauthClaims.claims.authorizationGeneration, "undefined", "password reauthentication must drop the per-session generation claim before canonical restoration");
    const replacementSignInIntent = Object.freeze({ operationId: randomUUID(), firebaseUid: createdFirebaseUid, authorizationGeneration: 3 });
    currentIssueSignInIntent = replacementSignInIntent;
    exchangeStartingUid = null;
    const replacementRestoredGeneration = await ensureRecoveryIssueSignInSession({
      api: client,
      auth: recoveryIssueAuth,
      canContinue: () => clientAuth?.currentUser?.uid === replacementSignInIntent.firebaseUid,
      isExplicitSignInCurrent: () => currentIssueSignInIntent === replacementSignInIntent
        && currentIssueSignInIntent.firebaseUid === replacementSignInIntent.firebaseUid
        && currentIssueSignInIntent.authorizationGeneration === replacementSignInIntent.authorizationGeneration,
      onExchangeStarting: () => { exchangeStartingUid = clientAuth?.currentUser?.uid ?? null; },
      user: Object.freeze({ uid: createdFirebaseUid, email, emailVerified: false, providers: Object.freeze(["password"] as const) }),
      requiredAuthorizationGeneration: 3,
    });
    assert.equal(replacementRestoredGeneration, 3);
    assert.equal(exchangeStartingUid, createdFirebaseUid);
    const replacementAuthIdentity = await firebaseAuth.getIdTokenResult(clientAuth.currentUser!, true);
    assert.equal(replacementAuthIdentity.claims.sub, createdFirebaseUid);
    assert.equal(replacementAuthIdentity.claims.authorizationGeneration, 3);
    context.diagnostic("replacement issue uses real password reauthentication followed by the canonical explicit-intent exchange/custom-token helper to restore exact generation 3");

    const expiredIssueCoordinator = makeCoordinator();
    const expiredIssue = await expiredIssueCoordinator.startIssue({ firebaseUid: createdFirebaseUid, authorizationGeneration: 3 });
    assert.equal(expiredIssue.kind, "issue");
    if (expiredIssue.kind !== "issue") throw new Error("replacement_prior_issue_missing");
    assert.equal(expiredIssue.status, "result_available");
    assert.equal(expiredIssue.replacementPending, false);
    assert.equal(expiredIssue.codes?.length, 10);
    const priorIssueId = expiredIssue.operationId;
    const priorCodes = Object.freeze([...expiredIssue.codes!]);
    const priorCodeHashes = priorCodes.map((code) => createHash("sha256").update(code, "utf8").digest("hex"));
    const priorIssueRef = runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(priorIssueId);
    const priorIssueResultRef = runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(priorIssueId);
    const explicitExpiredDeadline = new Date(Date.now() - 1_000);
    await priorIssueRef.update({ retryDeadline: explicitExpiredDeadline, resultExpiresAt: explicitExpiredDeadline });
    await priorIssueResultRef.update({ expiresAt: explicitExpiredDeadline });

    const issuePostsBeforeExpiryStatus = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    const issueStatusesBeforeExpiryStatus = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const expiredPriorIssue = await expiredIssueCoordinator.retryRecoveryOperation();
    assert.equal(expiredPriorIssue.kind, "issue");
    if (expiredPriorIssue.kind !== "issue") throw new Error("replacement_prior_expiry_status_missing");
    assert.equal(expiredPriorIssue.operationId, priorIssueId);
    assert.equal(expiredPriorIssue.status, "delivery_unconfirmed");
    assert.equal(expiredPriorIssue.codes?.length, 10, "prior codes remain visible until a replacement result is durably accepted");
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, issuePostsBeforeExpiryStatus);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length, issueStatusesBeforeExpiryStatus + 1);
    assert.equal(issueStatusOperationIds.at(-1), priorIssueId);
    assert.equal((await priorIssueRef.get()).get("status"), "delivery_unconfirmed");
    assert.equal((await priorIssueResultRef.get()).exists, false);
    const userAfterPriorExpiry = await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get();
    assert.equal(userAfterPriorExpiry.get("securityOperation"), undefined);
    const priorRecoverySet = await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).collection("security").doc("recoveryCodes").get();
    const priorGenerationId = priorRecoverySet.get("generationId");
    assert.equal(priorRecoverySet.get("count"), 10);
    for (const hash of priorCodeHashes) assert.equal((await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(hash).get()).exists, true);

    const issuePostsBeforeReplacement = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    const issueStatusesBeforeReplacement = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const replacementAcksBeforeReplacement = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length;
    const priorOperationIdsBeforeReplacement = issueOperationIds.length;
    const durableIssueIdsBeforeReplacement = durableIssueOperationIdsBeforePost.length;
    const durablePreviousIssueIdsBeforeReplacement = durablePreviousIssueIdsBeforePost.length;
    const lostIssueResponsesBeforeReplacement = issuePostResponsesLostAfterCommit.length;
    loseNextIssuePostResponseAfterCommit = true;
    const replacementPostLost = await expiredIssueCoordinator.startIssue(
      { firebaseUid: createdFirebaseUid, authorizationGeneration: 3 },
      { replaceUnavailable: true },
    );
    assert.equal(loseNextIssuePostResponseAfterCommit, false);
    assert.equal(replacementPostLost.kind, "issue");
    if (replacementPostLost.kind !== "issue") throw new Error("replacement_post_loss_state_missing");
    assert.equal(replacementPostLost.status, "in_progress");
    assert.equal(replacementPostLost.codes, null);
    assert.equal(replacementPostLost.savedIntent, false);
    assert.equal(replacementPostLost.replacementPending, true);
    assert.equal(issueOperationIds.length, priorOperationIdsBeforeReplacement + 1);
    const replacementIssueId = issueOperationIds.at(-1)!;
    assert.notEqual(replacementIssueId, priorIssueId);
    assert.equal(durableIssueOperationIdsBeforePost.length, durableIssueIdsBeforeReplacement + 1);
    assert.equal(durableIssueOperationIdsBeforePost.at(-1), replacementIssueId, "replacement ID and prior backup must be durable before the actual POST");
    assert.equal(durablePreviousIssueIdsBeforePost.length, durablePreviousIssueIdsBeforeReplacement + 1);
    assert.equal(durablePreviousIssueIdsBeforePost.at(-1), priorIssueId, "the prior issue backup must be in SecureStore before the replacement POST");
    assert.equal(issuePostResponsesLostAfterCommit.length, lostIssueResponsesBeforeReplacement + 1);
    assert.equal(issuePostResponsesLostAfterCommit.at(-1), replacementIssueId);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, issuePostsBeforeReplacement + 1);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length, issueStatusesBeforeReplacement + 1);
    assert.equal(issueStatusOperationIds.at(-1), priorIssueId, "the replacement POST follows a real status confirmation of the prior issue");
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length, replacementAcksBeforeReplacement);
    assert.equal(issueOperationIds.length, priorOperationIdsBeforeReplacement + 1, "replacement must make exactly one issue POST");
    const replacementPendingVaultValue = JSON.parse(vaultData.get(RECOVERY_OPERATION_VAULT_KEY)!) as Record<string, unknown>;
    assert.equal(replacementPendingVaultValue.operationId, replacementIssueId);
    assert.equal(replacementPendingVaultValue.status, "in_progress");
    assert.equal(replacementPendingVaultValue.codes, null);
    const retainedPriorIssue = replacementPendingVaultValue.previousIssue as Record<string, unknown>;
    assert.equal(retainedPriorIssue.operationId, priorIssueId);
    assert.deepEqual(retainedPriorIssue.codes, priorCodes);
    const replacementOperation = await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(replacementIssueId).get();
    const replacementResult = await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(replacementIssueId).get();
    assert.equal(replacementOperation.get("status"), "result_available");
    assert.equal(replacementOperation.get("expectedAuthorizationGeneration"), 3);
    assert.equal(replacementResult.exists, true);
    const replacementGenerationId = replacementOperation.get("generationId");
    assert.equal(typeof replacementGenerationId, "string");
    assert.notEqual(replacementGenerationId, priorGenerationId);
    const userAfterReplacementPost = await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get();
    assert.equal(userAfterReplacementPost.get("authorizationGeneration"), 3);
    assert.equal((userAfterReplacementPost.get("securityOperation") as Record<string, unknown> | undefined)?.operationId, replacementIssueId);
    const replacementRecoverySet = await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).collection("security").doc("recoveryCodes").get();
    assert.equal(replacementRecoverySet.get("generationId"), replacementGenerationId);
    assert.equal(replacementRecoverySet.get("count"), 10);
    assert.equal(issuedCodes.length, 10);
    const replacementCodeHashes = issuedCodes.map((code) => createHash("sha256").update(code, "utf8").digest("hex"));
    for (const hash of priorCodeHashes) assert.equal((await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(hash).get()).exists, false);
    for (const hash of replacementCodeHashes) {
      const index = await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(hash).get();
      assert.equal(index.exists, true);
      assert.equal(index.get("userId"), createdUserId);
      assert.equal(index.get("generationId"), replacementGenerationId);
    }

    const coldReplacementCoordinator = makeCoordinator();
    const coldReplacementRecord = await coldReplacementCoordinator.load();
    assert.equal(coldReplacementRecord.kind, "issue");
    if (coldReplacementRecord.kind !== "issue") throw new Error("replacement_cold_record_missing");
    assert.equal(coldReplacementRecord.operationId, replacementIssueId);
    assert.equal(coldReplacementRecord.replacementPending, true);
    const issuePostsBeforeReplacementRecovery = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length;
    const issueStatusesBeforeReplacementRecovery = actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length;
    const recoveredReplacement = await coldReplacementCoordinator.reconcilePending({ firebaseUid: createdFirebaseUid, authorizationGeneration: 3 });
    assert.equal(recoveredReplacement.kind, "issue");
    if (recoveredReplacement.kind !== "issue") throw new Error("replacement_result_recovery_missing");
    assert.equal(recoveredReplacement.operationId, replacementIssueId);
    assert.equal(recoveredReplacement.status, "result_available");
    assert.equal(recoveredReplacement.codes?.length, 10);
    assert.equal(recoveredReplacement.replacementPending, false);
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes").length, issuePostsBeforeReplacementRecovery);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/issue/status").length, issueStatusesBeforeReplacementRecovery + 1);
    assert.equal(issueStatusOperationIds.at(-1), replacementIssueId);
    const durableRecoveredReplacement = JSON.parse(vaultData.get(RECOVERY_OPERATION_VAULT_KEY)!) as Record<string, unknown>;
    assert.equal(durableRecoveredReplacement.operationId, replacementIssueId);
    assert.equal(durableRecoveredReplacement.previousIssue, undefined, "the durable prior-operation backup is dropped only after replacement codes are persisted");
    const replacementAckCountBeforeConfirm = actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length;
    const confirmedReplacement = await coldReplacementCoordinator.confirmRecoveryCodesSaved();
    assert.equal(confirmedReplacement.kind, "terminal");
    if (confirmedReplacement.kind !== "terminal") throw new Error("replacement_saved_ack_missing");
    assert.equal(confirmedReplacement.status, "acknowledged");
    assert.equal(actualRequests.filter((request) => request.method === "POST" && request.path === "/v1/account/recovery-codes/issue/saved-ack").length, replacementAckCountBeforeConfirm + 1);
    assert.equal(issueAckOperationIds.at(-1), replacementIssueId);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(replacementIssueId).get()).get("status"), "acknowledged");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(replacementIssueId).get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).get()).get("authorizationGeneration"), 3);
    assert.equal(vaultData.has(RECOVERY_OPERATION_VAULT_KEY), false);
    for (const hash of replacementCodeHashes) {
      const index = await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(hash).get();
      assert.equal(index.exists, true, "saved ACK removes the encrypted result without removing the newly issued code indexes");
      assert.equal(index.get("generationId"), replacementGenerationId);
    }

    const finalActiveRateLimitCount = (await readRecoveryRateLimitState()).reduce((total, entry) =>
      total + (entry.windowStartMs === activeRateLimitWindowStartMs && typeof entry.count === "number" ? entry.count : 0), 0);
    assert.ok(finalActiveRateLimitCount <= environment.recoveryOperationRateLimitMax);

    const issueRequest = actualRequests.find((request) => request.path === "/v1/account/recovery-codes");
    const issueStatus = actualRequests.find((request) => request.path === "/v1/account/recovery-codes/issue/status");
    const issueAck = actualRequests.find((request) => request.path === "/v1/account/recovery-codes/issue/saved-ack");
    const consumeRequest = actualRequests.find((request) => request.path === "/v1/public/recovery-codes/consume");
    const consumeAck = actualRequests.find((request) => request.path === "/v1/account/recovery-codes/consume/ack");
    const consumeStatus = actualRequests.find((request) => request.path === "/v1/public/recovery-codes/consume/status");
    assert.ok(issueRequest?.authorization && issueRequest.appCheck);
    assert.ok(issueStatus?.authorization && issueStatus.appCheck);
    assert.ok(issueAck?.authorization && issueAck.appCheck);
    assert.ok(consumeRequest?.appCheck);
    assert.equal(consumeRequest?.authorization, false);
    assert.ok(consumeStatus?.appCheck);
    assert.equal(consumeStatus?.authorization, false);
    assert.ok(consumeAck?.authorization && consumeAck.appCheck);
    const exchangesBeforeConsume = actualRequests.slice(0, requestCountBeforeConsume)
      .filter((request) => request.path === "/v1/account/session/exchange").length;
    assert.ok(exchangesBeforeConsume >= 1 && exchangesBeforeConsume <= 2);
    assert.equal(attemptedRequests.slice(attemptedCountBeforeConsume, attemptedCountBeforeReplacement).some((request) => request.path.includes("/session") || request.path.endsWith("/me")), false);
    assert.equal(actualRequests.slice(requestCountBeforeConsume, requestCountBeforeReplacement).some((request) => request.path.includes("/session") || request.path.endsWith("/me")), false);
    assert.equal(actualRequests.slice(requestCountBeforeReplacement).filter((request) => request.path === "/v1/account/session/exchange").length, 1);
    assert.equal(attemptedRequests.slice(attemptedCountBeforeReplacement).some((request) => request.path.endsWith("/me")), false);
    assert.equal(actualRequests.filter((request) => request.path === "/v1/account/recovery-codes/consume/ack").length, 2);
    const backendLogStatusCounts = logProbe.verify("coordinator fixture", [404, 401]);
    context.diagnostic(`backendLogRedaction=pass; requests=${backendLogStatusCounts.requests}; positive=${backendLogStatusCounts.positive}; negative=${backendLogStatusCounts.negative}`);
  } finally {
    if (clientAuth?.currentUser) await firebaseAuth.signOut(clientAuth).catch(() => undefined);
    if (createdUserId) {
      const ownedUser = runtime.db.collection(COLLECTIONS.users).doc(createdUserId);
      for (const collection of [COLLECTIONS.accountRecoveryOperations, COLLECTIONS.accountRecoveryOperationResults, COLLECTIONS.recoveryCodeIndex]) {
        const page = await runtime.db.collection(collection).where("userId", "==", createdUserId).get().catch(() => null);
        if (page && !page.empty) {
          const batch = runtime.db.batch();
          for (const document of page.docs) batch.delete(document.ref);
          await batch.commit().catch(() => undefined);
        }
      }
      await ownedUser.collection("security").doc("recoveryCodes").delete().catch(() => undefined);
      await ownedUser.delete().catch(() => undefined);
      if (createdFirebaseUid) {
        const ring = new PseudonymKeyRing(JSON.parse(environment.deletionPseudonymKeysJson));
        const mapping = ring.active("firebase", createdFirebaseUid);
        await runtime.db.collection(COLLECTIONS.identityMappings).doc(mapping.documentId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.identityMappings).doc(identityDocumentId("firebase", createdFirebaseUid)).delete().catch(() => undefined);
      }
    }
    if (createdFirebaseUid) await firebaseAdminAuth.getAuth(runtime.app).deleteUser(createdFirebaseUid).catch(() => undefined);
    if (clientAuth) await clientAuth._delete().catch(() => undefined);
    if (firebaseAppInstance) await firebaseApp.deleteApp(firebaseAppInstance).catch(() => undefined);
    await backend.close().catch(() => undefined);
    await runtime.close().catch(() => undefined);
    await firebaseAdminApp.deleteApp(runtime.app).catch(() => undefined);
  }
});

test("HTTP session revoke conflicts with an unacknowledged recovery result and succeeds after its ACK", { skip: !enabled }, async (context) => {
  requireIsolatedPins();
  const backendRequire = createRequire(resolve(appRoot, "../patternly-backend/package.json"));
  const firebaseAdminApp = backendRequire("firebase-admin/app") as { deleteApp(app: unknown): Promise<void> };
  const firebaseAdminAuth = backendRequire("firebase-admin/auth") as {
    getAuth(app: unknown): {
      createCustomToken(uid: string, claims?: Readonly<Record<string, unknown>>): Promise<string>;
      revokeRefreshTokens(uid: string): Promise<void>;
      deleteUser(uid: string): Promise<void>;
    };
  };
  const { COLLECTIONS, identityDocumentId, buildApplication, createFirestoreRuntime, createFirestoreStores, createFirebaseTokenVerifier, createFirebaseAdminAuth, PseudonymKeyRing, testEnvironment } = await loadBackendBootstrap();
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;

  const logProbe = createBackendHttpLogProbe();
  const environment = Object.freeze({
    ...testEnvironment,
    firebaseProjectId: projectId,
    firebaseAuthIssuer: `https://securetoken.google.com/${projectId}`,
    logLevel: "info",
  });
  const runtime = createFirestoreRuntime(environment);
  const actualAdmin = createFirebaseAdminAuth(runtime.app);
  let revokeRefreshTokensCalls = 0;
  const callThroughAdmin = Object.freeze({
    createCustomToken: async (uid: string, claims?: Readonly<Record<string, unknown>>) => {
      const token = await actualAdmin.createCustomToken(uid, claims);
      logProbe.rememberSecret(token);
      return token;
    },
    revokeRefreshTokens: async (uid: string) => {
      revokeRefreshTokensCalls += 1;
      await actualAdmin.revokeRefreshTokens(uid);
    },
    deleteUser: (uid: string) => actualAdmin.deleteUser(uid),
  });
  const stores = createFirestoreStores(runtime, environment, callThroughAdmin);
  const realTokenVerifier = createFirebaseTokenVerifier(environment) as BackendTokenVerifier;
  const backend = buildApplication({
    environment,
    firestore: runtime,
    verifier: { verify: (idToken: string) => realTokenVerifier.verify(idToken) },
    appCheckVerifier: { verify: async (token: string) => { if (token !== "aud08-explicit-app-check-fixture") throw new Error("app_check_invalid"); } },
    stores,
    logStream: logProbe.stream,
  });
  let firebaseAppInstance: unknown;
  let clientAuth: FirebaseAuth | null = null;
  let apiOrigin = "";
  let createdFirebaseUid = "";
  let createdUserId = "";
  const operationIds = new Set<string>();
  const consumeCodeHashes = new Set<string>();
  const requestObservations: Array<Readonly<{ method: string; path: string; authorization: boolean; appCheck: boolean }>> = [];

  try {
    await ensureRecoveryRequestRateBudget(runtime, COLLECTIONS, environment, 4);
    apiOrigin = await backend.listen({ host: "127.0.0.1", port: 0 });
    const address = new URL(apiOrigin);
    apiOrigin = `${address.protocol}//${address.host}`;
    const fetchImplementation: typeof fetch = async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      const headers = new Headers(init?.headers);
      let requestBody: unknown = null;
      try { if (typeof init?.body === "string") requestBody = JSON.parse(init.body) as unknown; } catch { /* Keep diagnostics independent of malformed request content. */ }
      logProbe.observeRequest(headers, requestBody);
      requestObservations.push(Object.freeze({
        method: (init?.method ?? "GET").toUpperCase(),
        path: url.pathname,
        authorization: headers.has("authorization"),
        appCheck: headers.has("x-firebase-appcheck"),
      }));
      const response = await fetch(input, init);
      await logProbe.observeResponse((init?.method ?? "GET").toUpperCase(), response.status, response);
      return response;
    };
    const client = createPatternlyApiClient({
      apiOrigin,
      allowLocalHttpForSimulator: true,
      getIdToken: async () => clientAuth?.currentUser ? clientAuth.currentUser.getIdToken() : null,
      getAppCheckToken: async () => "aud08-explicit-app-check-fixture",
      fetchImplementation,
      timeoutMs: 10_000,
    });
    firebaseAppInstance = firebaseApp.initializeApp({
      apiKey: "aud08-emulator-api-key",
      appId: `1:1234567890:web:${randomUUID().replaceAll("-", "")}`,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
    }, `aud08-revoke-${randomUUID()}`);
    clientAuth = firebaseAuth.initializeAuth(firebaseAppInstance, { persistence: firebaseAuth.inMemoryPersistence });
    firebaseAuth.connectAuthEmulator(clientAuth, `http://${authHost}`, { disableWarnings: true });
    const email = `aud08-revoke-${randomUUID()}@example.com`;
    logProbe.rememberSecret(email);
    logProbe.rememberSecret("Patternly-test-123!");
    const created = await firebaseAuth.createUserWithEmailAndPassword(clientAuth, email, "Patternly-test-123!");
    createdFirebaseUid = created.user.uid;
    logProbe.rememberSecret(createdFirebaseUid);
    createdUserId = randomUUID();
    logProbe.rememberSecret(createdUserId);
    const pseudonym = new PseudonymKeyRing(JSON.parse(environment.deletionPseudonymKeysJson)).active("firebase", createdFirebaseUid);
    await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).set({ authorizationGeneration: 1, authorizationState: "active" });
    await runtime.db.collection(COLLECTIONS.identityMappings).doc(pseudonym.documentId).set({
      keyVersion: pseudonym.keyVersion,
      provider: "firebase",
      subject: createdFirebaseUid,
      subjectHmac: pseudonym.subjectHmac,
      userId: createdUserId,
    });
    await runtime.db.collection(COLLECTIONS.identityMappings).doc(identityDocumentId("firebase", createdFirebaseUid)).set({
      provider: "firebase",
      subject: createdFirebaseUid,
      userId: createdUserId,
      email,
      emailVerified: false,
    });

    const bootstrap = await client.exchangeAccountSession();
    const signedIn = await firebaseAuth.signInWithCustomToken(clientAuth, bootstrap.customToken);
    assert.ok(signedIn.user.uid === createdFirebaseUid, "bootstrap custom token must identify the fixture user");
    assert.equal((await firebaseAuth.getIdTokenResult(signedIn.user, true)).claims.authorizationGeneration, 1);

    const issueId = randomUUID();
    operationIds.add(issueId);
    const issued = await client.issueRecoveryCodes(issueId);
    if (issued.status !== "result_available") throw new Error("revoke_case_recovery_codes_unavailable");
    assert.equal(issued.codes.length, 10);
    for (const code of issued.codes) {
      assert.ok(/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u.test(code), "issued recovery code must match the public format");
      consumeCodeHashes.add(createHash("sha256").update(code, "utf8").digest("hex"));
    }
    const issueAck = await client.acknowledgeRecoveryCodesSaved(issueId);
    assert.equal(issueAck.status, "acknowledged");
    assert.equal((await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(issueId).get()).exists, false);

    const consumeId = randomUUID();
    operationIds.add(consumeId);
    const code = issued.codes[0]!;
    const consumed = await client.consumeRecoveryCode(consumeId, code);
    if (consumed.status !== "result_available") throw new Error("revoke_case_recovery_result_unavailable");
    assert.ok(consumed.firebaseUid === createdFirebaseUid, "recovery result must identify the fixture user");
    assert.equal(consumed.authorizationGeneration, 2);
    const recoverySignedIn = await firebaseAuth.signInWithCustomToken(clientAuth, consumed.customToken);
    assert.ok(recoverySignedIn.user.uid === createdFirebaseUid, "recovery custom token must identify the fixture user");
    assert.equal((await firebaseAuth.getIdTokenResult(recoverySignedIn.user, true)).claims.authorizationGeneration, 2);
    const consumeOperation = runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(consumeId);
    const consumeResult = runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(consumeId);
    const userRef = runtime.db.collection(COLLECTIONS.users).doc(createdUserId);
    assert.equal((await consumeOperation.get()).get("status"), "result_available");
    assert.equal((await consumeResult.get()).exists, true);
    assert.equal((await userRef.get()).get("authorizationGeneration"), 2);
    const slotBeforeConflict = (await userRef.get()).get("securityOperation") as Record<string, unknown>;
    assert.ok(slotBeforeConflict.operationId === consumeId, "recovery operation must own the account slot");
    assert.equal(revokeRefreshTokensCalls, 0);

    const conflictRevokeId = randomUUID();
    operationIds.add(conflictRevokeId);
    await assert.rejects(client.revokeSessions(conflictRevokeId), (error: unknown) =>
      error instanceof PatternlyApiClientError
      && error.code === "server_error"
      && error.status === 409
      && error.serverCode === "session_revocation_operation_conflict",
    );
    assert.equal(revokeRefreshTokensCalls, 0);
    assert.equal((await runtime.db.collection(COLLECTIONS.sessionRevocationOperations).doc(conflictRevokeId).get()).exists, false);
    assert.equal((await consumeOperation.get()).get("status"), "result_available");
    assert.equal((await consumeResult.get()).exists, true);
    const slotAfterConflict = (await userRef.get()).get("securityOperation") as Record<string, unknown>;
    assert.ok(slotAfterConflict.operationId === consumeId, "conflicting revoke must preserve recovery slot ownership");
    assert.equal((await userRef.get()).get("authorizationGeneration"), 2);

    const consumeAck = await client.acknowledgeRecoveryCodeConsumption(consumeId);
    assert.equal(consumeAck.status, "acknowledged");
    assert.equal((await consumeOperation.get()).get("status"), "acknowledged");
    assert.equal((await consumeResult.get()).exists, false);
    assert.equal((await userRef.get()).get("securityOperation"), undefined);
    assert.equal((await userRef.get()).get("authorizationGeneration"), 2);

    const revokeId = randomUUID();
    operationIds.add(revokeId);
    const revoked = await client.revokeSessions(revokeId);
    assert.equal(revoked.status, "revoked");
    assert.ok(revoked.operationId === revokeId, "successful revoke response must match its request");
    assert.equal(revokeRefreshTokensCalls, 1);
    assert.equal((await runtime.db.collection(COLLECTIONS.sessionRevocationOperations).doc(revokeId).get()).get("status"), "revoked");
    assert.equal((await userRef.get()).get("securityOperation"), undefined);
    assert.equal((await userRef.get()).get("authorizationGeneration"), 2);

    const replacement = await firebaseAuth.signInWithCustomToken(clientAuth, revoked.customToken);
    assert.ok(replacement.user.uid === createdFirebaseUid, "replacement custom token must identify the fixture user");
    const replacementClaims = (await firebaseAuth.getIdTokenResult(replacement.user, true)).claims;
    assert.equal(replacementClaims.authorizationGeneration, 2);
    assert.ok(replacementClaims.sub === createdFirebaseUid, "replacement session subject must remain the fixture user");
    const revokeRequest = requestObservations.filter(({ method, path }) => method === "POST" && path === "/v1/account/session/revoke");
    assert.equal(revokeRequest.length, 2);
    assert.ok(revokeRequest.every(({ authorization, appCheck }) => authorization && appCheck));
    const publicConsume = requestObservations.find(({ method, path }) => method === "POST" && path === "/v1/public/recovery-codes/consume");
    assert.ok(publicConsume?.appCheck);
    assert.equal(publicConsume?.authorization, false);
    const backendLogStatusCounts = logProbe.verify("session revoke fixture", [409]);
    context.diagnostic(`real HTTP revoke was refused while a recovery result owned the slot, then revoked one Firebase session after the exact consume ACK; replacement SDK session retained generation 2; backendLogRedaction=pass; requests=${backendLogStatusCounts.requests}; positive=${backendLogStatusCounts.positive}; negative=${backendLogStatusCounts.negative}`);
  } finally {
    if (clientAuth?.currentUser) await firebaseAuth.signOut(clientAuth).catch(() => undefined);
    if (createdUserId) {
      const ownedUser = runtime.db.collection(COLLECTIONS.users).doc(createdUserId);
      const cleanupCollections = [COLLECTIONS.accountRecoveryOperations, COLLECTIONS.accountRecoveryOperationResults, COLLECTIONS.sessionRevocationOperations];
      for (const collection of cleanupCollections) {
        const snapshots = await runtime.db.collection(collection).where("userId", "==", createdUserId).get().catch(() => null);
        if (snapshots && !snapshots.empty) {
          const batch = runtime.db.batch();
          for (const { ref } of snapshots.docs) batch.delete(ref);
          await batch.commit().catch(() => undefined);
        }
      }
      for (const hash of consumeCodeHashes) await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(hash).delete().catch(() => undefined);
      for (const operationId of operationIds) {
        await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(operationId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(operationId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.sessionRevocationOperations).doc(operationId).delete().catch(() => undefined);
      }
      await ownedUser.collection("security").doc("recoveryCodes").delete().catch(() => undefined);
      await ownedUser.delete().catch(() => undefined);
      if (createdFirebaseUid) {
        const ring = new PseudonymKeyRing(JSON.parse(environment.deletionPseudonymKeysJson));
        const mapping = ring.active("firebase", createdFirebaseUid);
        await runtime.db.collection(COLLECTIONS.identityMappings).doc(mapping.documentId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.identityMappings).doc(identityDocumentId("firebase", createdFirebaseUid)).delete().catch(() => undefined);
      }
    }
    if (createdFirebaseUid) await actualAdmin.deleteUser(createdFirebaseUid).catch(() => undefined);
    if (clientAuth) await clientAuth._delete().catch(() => undefined);
    if (firebaseAppInstance) await firebaseApp.deleteApp(firebaseAppInstance).catch(() => undefined);
    await backend.close().catch(() => undefined);
    await runtime.close().catch(() => undefined);
    await firebaseAdminApp.deleteApp(runtime.app).catch(() => undefined);
  }
});

test("same-operation concurrent HTTP recovery consumes return the persisted real Admin winner", { skip: !enabled }, async (context) => {
  requireIsolatedPins();
  const backendRequire = createRequire(resolve(appRoot, "../patternly-backend/package.json"));
  const firebaseAdminApp = backendRequire("firebase-admin/app") as { deleteApp(app: unknown): Promise<void> };
  const { COLLECTIONS, identityDocumentId, buildApplication, createFirestoreRuntime, createFirestoreStores, createFirebaseTokenVerifier, createFirebaseAdminAuth, PseudonymKeyRing, testEnvironment } = await loadBackendBootstrap();
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;

  const logProbe = createBackendHttpLogProbe();
  const environment = Object.freeze({
    ...testEnvironment,
    firebaseProjectId: projectId,
    firebaseAuthIssuer: `https://securetoken.google.com/${projectId}`,
    logLevel: "info",
  });
  const runtime = createFirestoreRuntime(environment);
  let releaseFirstMint!: () => void;
  let signalFirstMint: (() => void) | null = null;
  const firstMintGate = new Promise<void>((resolveGate) => { releaseFirstMint = resolveGate; });
  const firstMintEntered = new Promise<void>((resolveEntered) => { signalFirstMint = resolveEntered; });
  const actualAdmin = createFirebaseAdminAuth(runtime.app);
  let actualMintCalls = 0;
  let raceMintCalls = 0;
  let pauseFirstRaceMint = false;
  let raceIsActive = false;
  const callThroughAdmin = Object.freeze({
    createCustomToken: async (uid: string, claims?: Readonly<Record<string, unknown>>) => {
      const token = await actualAdmin.createCustomToken(uid, claims);
      actualMintCalls += 1;
      logProbe.rememberSecret(token);
      if (raceIsActive) {
        raceMintCalls += 1;
        if (pauseFirstRaceMint) {
          pauseFirstRaceMint = false;
          signalFirstMint?.();
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            await Promise.race([
              firstMintGate,
              new Promise<never>((_resolveTimeout, rejectTimeout) => {
                timer = setTimeout(() => rejectTimeout(new Error("recovery_first_mint_gate_timeout")), 30_000);
              }),
            ]);
          } finally {
            if (timer) clearTimeout(timer);
          }
        }
      }
      return token;
    },
    revokeRefreshTokens: (uid: string) => actualAdmin.revokeRefreshTokens(uid),
    deleteUser: (uid: string) => actualAdmin.deleteUser(uid),
  });
  const stores = createFirestoreStores(runtime, environment, callThroughAdmin);
  const consumeServerPromises: Promise<unknown>[] = [];
  const observedStores = Object.freeze({
    ...(stores as Record<string, unknown>),
    accountLifecycle: new Proxy((stores as { accountLifecycle: object }).accountLifecycle, {
      get(target, property) {
        const value = Reflect.get(target, property, target);
        if (property === "consumeRecoveryCode" && typeof value === "function") {
          return (...args: unknown[]) => {
            try {
              const operation = Reflect.apply(value, target, args) as Promise<unknown>;
              consumeServerPromises.push(Promise.resolve(operation));
              return operation;
            } catch (error) {
              consumeServerPromises.push(Promise.resolve());
              throw error;
            }
          };
        }
        return typeof value === "function" ? value.bind(target) : value;
      },
    }),
  });
  const realTokenVerifier = createFirebaseTokenVerifier(environment) as BackendTokenVerifier;
  const backend = buildApplication({
    environment,
    firestore: runtime,
    verifier: { verify: (idToken: string) => realTokenVerifier.verify(idToken) },
    appCheckVerifier: { verify: async (token: string) => { if (token !== "aud08-explicit-app-check-fixture") throw new Error("app_check_invalid"); } },
    stores: observedStores,
    logStream: logProbe.stream,
  });
  let firebaseAppInstance: unknown;
  let clientAuth: FirebaseAuth | null = null;
  let createdFirebaseUid = "";
  let createdUserId = "";
  let apiOrigin = "";
  let raceOperationId = "";
  const operationIds = new Set<string>();
  const consumeCodeHashes = new Set<string>();
  const requestObservations: Array<Readonly<{ method: string; path: string; authorization: boolean; appCheck: boolean }>> = [];
  let firstConsume: Promise<Awaited<ReturnType<ReturnType<typeof createPatternlyApiClient>["consumeRecoveryCode"]>>> | null = null;
  let secondConsume: Promise<Awaited<ReturnType<ReturnType<typeof createPatternlyApiClient>["consumeRecoveryCode"]>>> | null = null;
  let unconfirmedConsumeCleanup = false;
  const sdkAdmin = backendRequire("firebase-admin/auth") as { getAuth(app: unknown): { deleteUser(uid: string): Promise<void> } };

  try {
    await ensureRecoveryRequestRateBudget(runtime, COLLECTIONS, environment, 6);
    apiOrigin = await backend.listen({ host: "127.0.0.1", port: 0 });
    const address = new URL(apiOrigin);
    apiOrigin = `${address.protocol}//${address.host}`;
    const fetchImplementation: typeof fetch = async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      const headers = new Headers(init?.headers);
      let requestBody: unknown = null;
      try { if (typeof init?.body === "string") requestBody = JSON.parse(init.body) as unknown; } catch { /* Keep diagnostics independent of malformed request content. */ }
      logProbe.observeRequest(headers, requestBody);
      requestObservations.push(Object.freeze({
        method: (init?.method ?? "GET").toUpperCase(),
        path: url.pathname,
        authorization: headers.has("authorization"),
        appCheck: headers.has("x-firebase-appcheck"),
      }));
      const response = await fetch(input, init);
      await logProbe.observeResponse((init?.method ?? "GET").toUpperCase(), response.status, response);
      return response;
    };
    const client = createPatternlyApiClient({
      apiOrigin,
      allowLocalHttpForSimulator: true,
      getIdToken: async () => clientAuth?.currentUser ? clientAuth.currentUser.getIdToken() : null,
      getAppCheckToken: async () => "aud08-explicit-app-check-fixture",
      fetchImplementation,
      timeoutMs: 30_000,
    });
    firebaseAppInstance = firebaseApp.initializeApp({
      apiKey: "aud08-emulator-api-key",
      appId: `1:1234567890:web:${randomUUID().replaceAll("-", "")}`,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
    }, `aud08-concurrent-${randomUUID()}`);
    clientAuth = firebaseAuth.initializeAuth(firebaseAppInstance, { persistence: firebaseAuth.inMemoryPersistence });
    firebaseAuth.connectAuthEmulator(clientAuth, `http://${authHost}`, { disableWarnings: true });
    const email = `aud08-concurrent-${randomUUID()}@example.com`;
    logProbe.rememberSecret(email);
    logProbe.rememberSecret("Patternly-test-123!");
    const created = await firebaseAuth.createUserWithEmailAndPassword(clientAuth, email, "Patternly-test-123!");
    createdFirebaseUid = created.user.uid;
    logProbe.rememberSecret(createdFirebaseUid);
    createdUserId = randomUUID();
    logProbe.rememberSecret(createdUserId);
    const pseudonym = new PseudonymKeyRing(JSON.parse(environment.deletionPseudonymKeysJson)).active("firebase", createdFirebaseUid);
    await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).set({ authorizationGeneration: 1, authorizationState: "active" });
    await runtime.db.collection(COLLECTIONS.identityMappings).doc(pseudonym.documentId).set({
      keyVersion: pseudonym.keyVersion,
      provider: "firebase",
      subject: createdFirebaseUid,
      subjectHmac: pseudonym.subjectHmac,
      userId: createdUserId,
    });
    await runtime.db.collection(COLLECTIONS.identityMappings).doc(identityDocumentId("firebase", createdFirebaseUid)).set({
      provider: "firebase",
      subject: createdFirebaseUid,
      userId: createdUserId,
      email,
      emailVerified: false,
    });

    const bootstrap = await client.exchangeAccountSession();
    const initialSession = await firebaseAuth.signInWithCustomToken(clientAuth, bootstrap.customToken);
    assert.ok(initialSession.user.uid === createdFirebaseUid, "bootstrap token must identify the owned fixture user");
    assert.equal((await firebaseAuth.getIdTokenResult(initialSession.user, true)).claims.authorizationGeneration, 1);
    const mintsBeforeRace = actualMintCalls;

    const issueId = randomUUID();
    operationIds.add(issueId);
    const issued = await client.issueRecoveryCodes(issueId);
    if (issued.status !== "result_available") throw new Error("concurrent_case_recovery_codes_unavailable");
    assert.equal(issued.codes.length, 10);
    for (const code of issued.codes) {
      assert.ok(/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u.test(code), "issued recovery code must match the public format");
      consumeCodeHashes.add(createHash("sha256").update(code, "utf8").digest("hex"));
    }
    assert.equal((await client.acknowledgeRecoveryCodesSaved(issueId)).status, "acknowledged");

    raceOperationId = randomUUID();
    operationIds.add(raceOperationId);
    const code = issued.codes[0]!;
    const consumeObservationStart = requestObservations.length;
    raceIsActive = true;
    pauseFirstRaceMint = true;
    firstConsume = client.consumeRecoveryCode(raceOperationId, code);
    let gateTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        firstMintEntered,
        new Promise<never>((_resolveTimeout, rejectTimeout) => {
          gateTimer = setTimeout(() => rejectTimeout(new Error("recovery_first_mint_entry_timeout")), 10_000);
        }),
      ]);
    } finally {
      if (gateTimer) clearTimeout(gateTimer);
    }
    const operationRef = runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(raceOperationId);
    const resultRef = runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(raceOperationId);
    const userRef = runtime.db.collection(COLLECTIONS.users).doc(createdUserId);
    const firstOperationSnapshot = await operationRef.get();
    assert.equal(firstOperationSnapshot.get("status"), "in_progress");
    assert.equal(firstOperationSnapshot.get("resultingAuthorizationGeneration"), 2);
    assert.equal((await resultRef.get()).exists, false);
    const firstSlot = (await userRef.get()).get("securityOperation") as Record<string, unknown>;
    assert.equal(firstSlot.kind, "account_recovery");
    assert.ok(firstSlot.operationId === raceOperationId, "first HTTP consume must own the recovery slot");
    assert.equal(firstSlot.fence, firstOperationSnapshot.get("fence"));
    assert.equal((await userRef.get()).get("authorizationGeneration"), 2);

    secondConsume = client.consumeRecoveryCode(raceOperationId, code);
    const secondResponse = await secondConsume;
    if (secondResponse.status !== "result_available") throw new Error("concurrent_case_winner_unavailable");
    assert.equal(secondResponse.authorizationGeneration, 2);
    assert.ok(secondResponse.firebaseUid === createdFirebaseUid, "second HTTP consume must identify the owned fixture user");
    const winnerOperationSnapshot = await operationRef.get();
    const winnerResultSnapshot = await resultRef.get();
    const winnerSlot = (await userRef.get()).get("securityOperation") as Record<string, unknown>;
    assert.equal(winnerOperationSnapshot.get("status"), "result_available");
    assert.equal(winnerOperationSnapshot.get("resultingAuthorizationGeneration"), 2);
    assert.equal(winnerResultSnapshot.exists, true);
    assert.equal(winnerResultSnapshot.get("authorizationGeneration"), 2);
    assert.notEqual(winnerOperationSnapshot.get("fence"), firstOperationSnapshot.get("fence"));
    assert.equal(winnerSlot.operationId, raceOperationId);
    assert.equal(winnerSlot.fence, winnerOperationSnapshot.get("fence"));
    assert.equal((await userRef.get()).get("authorizationGeneration"), 2);
    const usedCodeIndex = await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(createHash("sha256").update(code, "utf8").digest("hex")).get();
    assert.ok(usedCodeIndex.get("usedAt") !== null && usedCodeIndex.get("usedAt") !== undefined, "the raced recovery code must be marked used");
    assert.equal(raceMintCalls, 2);
    assert.equal(actualMintCalls - mintsBeforeRace, 2);

    releaseFirstMint();
    const firstResponse = await firstConsume;
    if (firstResponse.status !== "result_available") throw new Error("concurrent_case_stale_response_missing_winner");
    assert.equal(firstResponse.operationId, raceOperationId);
    assert.equal(secondResponse.operationId, raceOperationId);
    assert.equal(firstResponse.authorizationGeneration, 2);
    assert.ok(firstResponse.firebaseUid === createdFirebaseUid, "first HTTP consume must identify the owned fixture user");
    const statusWinner = await client.getRecoveryCodeConsumeStatus(raceOperationId, code);
    if (statusWinner.status !== "result_available") throw new Error("concurrent_case_proof_status_winner_missing");
    assert.equal(statusWinner.authorizationGeneration, 2);
    assert.ok(statusWinner.firebaseUid === createdFirebaseUid, "proof status must identify the owned fixture user");
    assert.ok(firstResponse.customToken === secondResponse.customToken, "both HTTP consumes must return the same winner token");
    assert.ok(firstResponse.customToken === statusWinner.customToken, "first HTTP consume must return the persisted winner token");
    assert.ok(secondResponse.customToken === statusWinner.customToken, "second HTTP consume must return the persisted winner token");
    assert.equal(raceMintCalls, 2, "proof status must not mint another custom token");

    const recoverySession = await firebaseAuth.signInWithCustomToken(clientAuth, statusWinner.customToken);
    assert.ok(recoverySession.user.uid === createdFirebaseUid, "winning custom token must identify the owned fixture user");
    assert.equal((await firebaseAuth.getIdTokenResult(recoverySession.user)).claims.authorizationGeneration, 2);
    assert.equal((await firebaseAuth.getIdTokenResult(recoverySession.user, true)).claims.authorizationGeneration, 2);
    assert.equal((await operationRef.get()).get("status"), "result_available");
    assert.equal((await resultRef.get()).exists, true);
    const ack = await client.acknowledgeRecoveryCodeConsumption(raceOperationId);
    assert.equal(ack.status, "acknowledged");
    const acknowledgedCodeIndex = await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(createHash("sha256").update(code, "utf8").digest("hex")).get();
    assert.ok(acknowledgedCodeIndex.get("usedAt") !== null && acknowledgedCodeIndex.get("usedAt") !== undefined, "ACK must leave the recovery code used");
    assert.equal((await operationRef.get()).get("status"), "acknowledged");
    assert.equal((await resultRef.get()).exists, false);
    assert.equal((await userRef.get()).get("securityOperation"), undefined);
    assert.equal((await userRef.get()).get("authorizationGeneration"), 2);
    const consumeScopeObservations = requestObservations.slice(consumeObservationStart);
    const publicConsumeRequests = consumeScopeObservations.filter(({ method, path }) => method === "POST" && path === "/v1/public/recovery-codes/consume");
    assert.equal(publicConsumeRequests.length, 2);
    assert.ok(publicConsumeRequests.every(({ appCheck, authorization }) => appCheck && !authorization));
    assert.equal(consumeScopeObservations.filter(({ path }) => path === "/v1/account/session/exchange" || path === "/v1/me").length, 0);
    const backendLogStatusCounts = logProbe.verify("concurrent recovery fixture");
    context.diagnostic(`two real HTTP consumes raced the same fenced operation; both returned the persisted Admin-minted winner and exact ACK cleared the result at generation 2; backendLogRedaction=pass; requests=${backendLogStatusCounts.requests}; positive=${backendLogStatusCounts.positive}; negative=${backendLogStatusCounts.negative}`);
  } finally {
    raceIsActive = false;
    releaseFirstMint();
    if (firstConsume || secondConsume) {
      let cleanupWaitTimer: ReturnType<typeof setTimeout> | undefined;
      unconfirmedConsumeCleanup = await Promise.race([
        Promise.all([
          ...[firstConsume, secondConsume].filter((operation): operation is NonNullable<typeof operation> => operation !== null).map((operation) => operation.then(() => undefined, () => undefined)),
          ...consumeServerPromises.map((operation) => operation.then(() => undefined, () => undefined)),
        ]).then(() => false),
        new Promise<boolean>((resolveTimeout) => { cleanupWaitTimer = setTimeout(() => resolveTimeout(true), 35_000); }),
      ]).finally(() => { if (cleanupWaitTimer) clearTimeout(cleanupWaitTimer); });
    }
    if (unconfirmedConsumeCleanup) {
      let teardownTimer: ReturnType<typeof setTimeout> | undefined;
      const teardownTimedOut = await Promise.race([
        Promise.allSettled([
          clientAuth?._delete(),
          firebaseAppInstance ? firebaseApp.deleteApp(firebaseAppInstance) : undefined,
          backend.close(),
          runtime.close(),
          firebaseAdminApp.deleteApp(runtime.app),
        ]).then(() => false),
        new Promise<boolean>((resolveTimeout) => { teardownTimer = setTimeout(() => resolveTimeout(true), 5_000); }),
      ]).finally(() => { if (teardownTimer) clearTimeout(teardownTimer); });
      if (teardownTimedOut) {
        process.stderr.write("recovery_http_cleanup_unconfirmed\n");
        process.exit(1);
      }
      throw new Error("recovery_http_cleanup_unconfirmed");
    }
    if (clientAuth?.currentUser) await firebaseAuth.signOut(clientAuth).catch(() => undefined);
    if (createdUserId) {
      const ownedUser = runtime.db.collection(COLLECTIONS.users).doc(createdUserId);
      for (const collection of [COLLECTIONS.accountRecoveryOperations, COLLECTIONS.accountRecoveryOperationResults]) {
        const snapshots = await runtime.db.collection(collection).where("userId", "==", createdUserId).get().catch(() => null);
        if (snapshots && !snapshots.empty) {
          const batch = runtime.db.batch();
          for (const { ref } of snapshots.docs) batch.delete(ref);
          await batch.commit().catch(() => undefined);
        }
      }
      for (const codeHash of consumeCodeHashes) await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(codeHash).delete().catch(() => undefined);
      for (const operationId of operationIds) {
        await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(operationId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(operationId).delete().catch(() => undefined);
      }
      await ownedUser.collection("security").doc("recoveryCodes").delete().catch(() => undefined);
      await ownedUser.delete().catch(() => undefined);
      if (createdFirebaseUid) {
        const ring = new PseudonymKeyRing(JSON.parse(environment.deletionPseudonymKeysJson));
        const mapping = ring.active("firebase", createdFirebaseUid);
        await runtime.db.collection(COLLECTIONS.identityMappings).doc(mapping.documentId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.identityMappings).doc(identityDocumentId("firebase", createdFirebaseUid)).delete().catch(() => undefined);
      }
    }
    if (createdFirebaseUid) await actualAdmin.deleteUser(createdFirebaseUid).catch(() => undefined);
    if (clientAuth) await clientAuth._delete().catch(() => undefined);
    if (firebaseAppInstance) await firebaseApp.deleteApp(firebaseAppInstance).catch(() => undefined);
    await backend.close().catch(() => undefined);
    await runtime.close().catch(() => undefined);
    await firebaseAdminApp.deleteApp(runtime.app).catch(() => undefined);
  }
});

test("HTTP account deletion supersedes an unacknowledged recovery result and removes its proof-bound data", { skip: !enabled }, async (context) => {
  requireIsolatedPins();
  const backendRequire = createRequire(resolve(appRoot, "../patternly-backend/package.json"));
  const firebaseAdminApp = backendRequire("firebase-admin/app") as { deleteApp(app: unknown): Promise<void> };
  const firebaseAdminAuth = backendRequire("firebase-admin/auth") as {
    getAuth(app: unknown): {
      getUser(uid: string): Promise<unknown>;
      deleteUser(uid: string): Promise<void>;
    };
  };
  const { COLLECTIONS, identityDocumentId, buildApplication, createFirestoreRuntime, createFirestoreStores, createFirebaseTokenVerifier, createFirebaseAdminAuth, PseudonymKeyRing, testEnvironment } = await loadBackendBootstrap();
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;

  const logProbe = createBackendHttpLogProbe();
  const environment = Object.freeze({
    ...testEnvironment,
    firebaseProjectId: projectId,
    firebaseAuthIssuer: `https://securetoken.google.com/${projectId}`,
    logLevel: "info",
  });
  const runtime = createFirestoreRuntime(environment);
  let releaseRevokeGate!: () => void;
  let signalRevokeGateEntered: (() => void) | null = null;
  const revokeGate = new Promise<void>((resolveGate) => { releaseRevokeGate = resolveGate; });
  const revokeGateEntered = new Promise<void>((resolveEntered) => { signalRevokeGateEntered = resolveEntered; });
  let actualAdminRevokeCalls = 0;
  let actualAdminDeleteCalls = 0;
  let actualAdminCustomTokenCalls = 0;
  const actualAdmin = createFirebaseAdminAuth(runtime.app);
  const callThroughAdmin = Object.freeze({
    createCustomToken: async (uid: string, claims?: Readonly<Record<string, unknown>>) => {
      actualAdminCustomTokenCalls += 1;
      const token = await actualAdmin.createCustomToken(uid, claims);
      logProbe.rememberSecret(token);
      return token;
    },
    revokeRefreshTokens: async (uid: string) => {
      signalRevokeGateEntered?.();
      await revokeGate;
      actualAdminRevokeCalls += 1;
      await actualAdmin.revokeRefreshTokens(uid);
    },
    deleteUser: async (uid: string) => {
      actualAdminDeleteCalls += 1;
      await actualAdmin.deleteUser(uid);
    },
  });
  const stores = createFirestoreStores(runtime, environment, callThroughAdmin);
  let deletionServerInvoked = false;
  let resolveDeletionServerSettled!: () => void;
  const deletionServerSettled = new Promise<void>((resolveSettled) => { resolveDeletionServerSettled = resolveSettled; });
  const lifecycleStores = Object.freeze({
    ...(stores as Record<string, unknown>),
    accountLifecycle: new Proxy((stores as { accountLifecycle: object }).accountLifecycle, {
      get(target, property) {
        const value = Reflect.get(target, property, target);
        if (property === "deleteAccount" && typeof value === "function") {
          return (...args: unknown[]) => {
            deletionServerInvoked = true;
            try {
              const operation = Reflect.apply(value, target, args) as Promise<unknown>;
              void Promise.resolve(operation).then(undefined, () => resolveDeletionServerSettled());
              return operation;
            } catch (error) {
              resolveDeletionServerSettled();
              throw error;
            }
          };
        }
        if (property === "completeDeletion" && typeof value === "function") {
          return (...args: unknown[]) => {
            try {
              const operation = Reflect.apply(value, target, args) as Promise<unknown>;
              void Promise.resolve(operation).then(() => resolveDeletionServerSettled(), () => resolveDeletionServerSettled());
              return operation;
            } catch (error) {
              resolveDeletionServerSettled();
              throw error;
            }
          };
        }
        return typeof value === "function" ? value.bind(target) : value;
      },
    }),
  });
  const realTokenVerifier = createFirebaseTokenVerifier(environment) as BackendTokenVerifier;
  const backend = buildApplication({
    environment,
    firestore: runtime,
    verifier: { verify: (idToken: string) => realTokenVerifier.verify(idToken) },
    appCheckVerifier: { verify: async (token: string) => { if (token !== "aud08-explicit-app-check-fixture") throw new Error("app_check_invalid"); } },
    stores: lifecycleStores,
    logStream: logProbe.stream,
  });
  let firebaseAppInstance: unknown;
  let clientAuth: FirebaseAuth | null = null;
  let apiOrigin = "";
  let createdFirebaseUid = "";
  let createdUserId = "";
  let pseudonymDocumentId = "";
  let recoveryIssueId = "";
  let consumeOperationId = "";
  let deletionOperationId = "";
  let deletionSecret = "";
  let deletionProofId = "";
  let deletionPromise: Promise<Readonly<{ status: "deleted"; operationId: string; proofId: string }>> | null = null;
  const ownedOperationIds = new Set<string>();
  const ownedCodeHashes = new Set<string>();
  const ownedTombstoneIds = new Set<string>();
  const requestObservations: Array<Readonly<{ method: string; path: string; authorization: boolean; appCheck: boolean }>> = [];
  const responseObservations: Array<Readonly<{ method: string; path: string; status: number }>> = [];
  const sdkAdmin = firebaseAdminAuth.getAuth(runtime.app);
  let unconfirmedDeletionCleanup = false;

  try {
    await ensureRecoveryRequestRateBudget(runtime, COLLECTIONS, environment, 6);
    apiOrigin = await backend.listen({ host: "127.0.0.1", port: 0 });
    const address = new URL(apiOrigin);
    apiOrigin = `${address.protocol}//${address.host}`;
    const fetchImplementation: typeof fetch = async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      const headers = new Headers(init?.headers);
      let requestBody: unknown = null;
      try { if (typeof init?.body === "string") requestBody = JSON.parse(init.body) as unknown; } catch { /* Keep diagnostics independent of malformed request content. */ }
      logProbe.observeRequest(headers, requestBody);
      requestObservations.push(Object.freeze({
        method: (init?.method ?? "GET").toUpperCase(),
        path: url.pathname,
        authorization: headers.has("authorization"),
        appCheck: headers.has("x-firebase-appcheck"),
      }));
      const response = await fetch(input, init);
      await logProbe.observeResponse((init?.method ?? "GET").toUpperCase(), response.status, response);
      responseObservations.push(Object.freeze({ method: (init?.method ?? "GET").toUpperCase(), path: url.pathname, status: response.status }));
      return response;
    };
    const client = createPatternlyApiClient({
      apiOrigin,
      allowLocalHttpForSimulator: true,
      getIdToken: async () => clientAuth?.currentUser ? clientAuth.currentUser.getIdToken() : null,
      getAppCheckToken: async () => "aud08-explicit-app-check-fixture",
      fetchImplementation,
      timeoutMs: 30_000,
    });
    firebaseAppInstance = firebaseApp.initializeApp({
      apiKey: "aud08-emulator-api-key",
      appId: `1:1234567890:web:${randomUUID().replaceAll("-", "")}`,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
    }, `aud08-delete-${randomUUID()}`);
    clientAuth = firebaseAuth.initializeAuth(firebaseAppInstance, { persistence: firebaseAuth.inMemoryPersistence });
    firebaseAuth.connectAuthEmulator(clientAuth, `http://${authHost}`, { disableWarnings: true });
    const email = `aud08-delete-${randomUUID()}@example.com`;
    logProbe.rememberSecret(email);
    logProbe.rememberSecret("Patternly-test-123!");
    const created = await firebaseAuth.createUserWithEmailAndPassword(clientAuth, email, "Patternly-test-123!");
    createdFirebaseUid = created.user.uid;
    logProbe.rememberSecret(createdFirebaseUid);
    createdUserId = randomUUID();
    logProbe.rememberSecret(createdUserId);
    const pseudonym = new PseudonymKeyRing(JSON.parse(environment.deletionPseudonymKeysJson)).active("firebase", createdFirebaseUid);
    pseudonymDocumentId = pseudonym.documentId;
    ownedTombstoneIds.add(pseudonymDocumentId);
    await runtime.db.collection(COLLECTIONS.users).doc(createdUserId).set({ authorizationGeneration: 1, authorizationState: "active" });
    await runtime.db.collection(COLLECTIONS.identityMappings).doc(pseudonym.documentId).set({
      keyVersion: pseudonym.keyVersion,
      provider: "firebase",
      subject: createdFirebaseUid,
      subjectHmac: pseudonym.subjectHmac,
      userId: createdUserId,
    });
    await runtime.db.collection(COLLECTIONS.identityMappings).doc(identityDocumentId("firebase", createdFirebaseUid)).set({
      provider: "firebase",
      subject: createdFirebaseUid,
      userId: createdUserId,
      email,
      emailVerified: false,
    });

    const bootstrap = await client.exchangeAccountSession();
    const initialSession = await firebaseAuth.signInWithCustomToken(clientAuth, bootstrap.customToken);
    assert.ok(initialSession.user.uid === createdFirebaseUid, "bootstrap token must identify the owned fixture user");
    assert.equal((await firebaseAuth.getIdTokenResult(initialSession.user, true)).claims.authorizationGeneration, 1);

    recoveryIssueId = randomUUID();
    ownedOperationIds.add(recoveryIssueId);
    const issued = await client.issueRecoveryCodes(recoveryIssueId);
    if (issued.status !== "result_available") throw new Error("deletion_case_recovery_codes_unavailable");
    assert.equal(issued.codes.length, 10);
    for (const code of issued.codes) {
      assert.ok(/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u.test(code), "issued recovery code must match the public format");
      ownedCodeHashes.add(createHash("sha256").update(code, "utf8").digest("hex"));
    }
    assert.equal((await client.acknowledgeRecoveryCodesSaved(recoveryIssueId)).status, "acknowledged");
    const issueOperationRef = runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(recoveryIssueId);
    const issueResultRef = runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(recoveryIssueId);
    assert.equal((await issueOperationRef.get()).get("status"), "acknowledged");
    assert.equal((await issueResultRef.get()).exists, false);

    consumeOperationId = randomUUID();
    ownedOperationIds.add(consumeOperationId);
    const recoveryCode = issued.codes[0]!;
    const consumed = await client.consumeRecoveryCode(consumeOperationId, recoveryCode);
    if (consumed.status !== "result_available") throw new Error("deletion_case_recovery_result_unavailable");
    assert.ok(consumed.firebaseUid === createdFirebaseUid, "recovery result must identify the owned fixture user");
    assert.equal(consumed.authorizationGeneration, 2);
    const recoverySession = await firebaseAuth.signInWithCustomToken(clientAuth, consumed.customToken);
    assert.ok(recoverySession.user.uid === createdFirebaseUid, "recovery custom token must identify the owned fixture user");
    assert.equal((await firebaseAuth.getIdTokenResult(recoverySession.user, true)).claims.authorizationGeneration, 2);
    const recoveryOperationRef = runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(consumeOperationId);
    const recoveryResultRef = runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(consumeOperationId);
    const ownedUserRef = runtime.db.collection(COLLECTIONS.users).doc(createdUserId);
    assert.equal((await recoveryOperationRef.get()).get("status"), "result_available");
    assert.equal((await recoveryResultRef.get()).exists, true);
    const customTokensBeforeDeletion = actualAdminCustomTokenCalls;

    deletionOperationId = randomUUID();
    ownedOperationIds.add(deletionOperationId);
    deletionSecret = randomBytes(32).toString("hex");
    logProbe.rememberSecret(deletionSecret);
    deletionPromise = client.deleteAccount(deletionOperationId, deletionSecret);
    let gateTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        revokeGateEntered,
        new Promise<never>((_resolveTimeout, rejectTimeout) => {
          gateTimer = setTimeout(() => rejectTimeout(new Error("deletion_revoke_gate_timeout")), 10_000);
        }),
      ]);
    } finally {
      if (gateTimer) clearTimeout(gateTimer);
    }
    const deletingUser = await ownedUserRef.get();
    assert.equal(deletingUser.get("authorizationState"), "deleting");
    assert.equal(deletingUser.get("authorizationGeneration"), 3);
    const deletionSlot = deletingUser.get("securityOperation") as Record<string, unknown>;
    assert.equal(deletionSlot.kind, "account_delete");
    assert.equal(deletionSlot.phase, "sessions_revoking");
    assert.ok(deletionSlot.operationId === deletionOperationId, "deletion operation must own the account slot");
    const deletionDocument = await runtime.db.collection(COLLECTIONS.accountDeletionOperations).doc(deletionOperationId).get();
    assert.equal(deletionDocument.get("phase"), "sessions_revoking");
    deletionProofId = String(deletionDocument.get("proofId") ?? "");
    assert.ok(deletionProofId.length > 0, "deletion operation must hold its proof identifier");
    logProbe.rememberSecret(deletionProofId);
    assert.equal((await recoveryOperationRef.get()).get("status"), "superseded");
    assert.equal((await recoveryResultRef.get()).exists, false);
    assert.equal(actualAdminRevokeCalls, 0, "Admin revocation must remain behind the explicit gate");
    assert.equal(actualAdminDeleteCalls, 0, "Auth deletion must wait for the explicit revocation gate");

    await assert.rejects(client.acknowledgeRecoveryCodeConsumption(consumeOperationId), (error: unknown) =>
      error instanceof PatternlyApiClientError
      && error.code === "server_error"
      && error.status === 401
      && error.serverCode === "account_deleted",
    );
    assert.ok(responseObservations.some(({ method, path, status }) => method === "POST" && path === "/v1/account/recovery-codes/consume/ack" && status === 401));
    assert.equal((await recoveryOperationRef.get()).get("status"), "superseded");
    assert.equal((await recoveryResultRef.get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountDeletionOperations).doc(deletionOperationId).get()).get("phase"), "sessions_revoking");

    const supersededStatus = await client.getRecoveryCodeConsumeStatus(consumeOperationId, recoveryCode);
    assert.equal(supersededStatus.status, "superseded");
    assert.equal("customToken" in supersededStatus, false);
    assert.equal(actualAdminCustomTokenCalls, customTokensBeforeDeletion, "status lookup must not mint another custom token");

    releaseRevokeGate();
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const deletionResult = await Promise.race([
      deletionPromise,
      new Promise<never>((_resolveTimeout, rejectTimeout) => {
        settleTimer = setTimeout(() => rejectTimeout(new Error("deletion_http_settle_timeout")), 35_000);
      }),
    ]).finally(() => { if (settleTimer) clearTimeout(settleTimer); });
    deletionPromise = null;
    assert.ok(responseObservations.some(({ method, path, status }) => method === "POST" && path === "/v1/account/deletion" && status === 200));
    assert.equal(deletionResult.status, "deleted");
    assert.ok(deletionResult.operationId === deletionOperationId, "deletion response must match its operation");
    assert.ok(deletionResult.proofId === deletionProofId, "deletion response must match its bound proof");
    assert.equal(actualAdminRevokeCalls, 1);
    assert.equal(actualAdminDeleteCalls, 1);
    assert.equal((await runtime.db.collection(COLLECTIONS.accountDeletionOperations).doc(deletionOperationId).get()).get("phase"), "complete");
    const publicProof = await client.getDeletionProof(deletionProofId);
    assert.ok(responseObservations.some(({ method, path, status }) => method === "GET" && path === `/v1/public/deletion-proofs/${deletionProofId}` && status === 200));
    assert.equal(publicProof.status, "deleted");
    assert.ok(publicProof.operationId === deletionOperationId, "public proof must match the completed deletion");
    assert.ok(publicProof.proofId === deletionProofId, "public proof must match the deletion response");
    assert.equal((await ownedUserRef.get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.identityMappings).where("userId", "==", createdUserId).get()).empty, true);
    assert.equal((await recoveryOperationRef.get()).exists, false);
    assert.equal((await recoveryResultRef.get()).exists, false);
    for (const codeHash of ownedCodeHashes) assert.equal((await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(codeHash).get()).exists, false);
    assert.equal((await runtime.db.collection(COLLECTIONS.deletedIdentities).doc(pseudonymDocumentId).get()).exists, true);
    await assert.rejects(sdkAdmin.getUser(createdFirebaseUid), (error: unknown) =>
      typeof error === "object" && error !== null && "code" in error
      && ((error as { code?: unknown }).code === "auth/user-not-found" || (error as { code?: unknown }).code === "user-not-found"),
    );

    const purgedStatus = await client.getRecoveryCodeConsumeStatus(consumeOperationId, recoveryCode);
    assert.equal(purgedStatus.status, "expired_or_invalid");
    assert.equal("customToken" in purgedStatus, false);
    assert.equal(actualAdminCustomTokenCalls, customTokensBeforeDeletion, "post-purge status lookup must not mint another custom token");
    for (const path of [
      "/v1/account/recovery-codes",
      "/v1/account/recovery-codes/issue/saved-ack",
      "/v1/public/recovery-codes/consume",
      "/v1/public/recovery-codes/consume/status",
      "/v1/account/recovery-codes/consume/ack",
      "/v1/account/deletion",
    ]) {
      const request = requestObservations.find((entry) => entry.path === path);
      assert.ok(request?.appCheck, "every recovery and deletion request must carry the explicit App Check fixture");
    }
    assert.ok(requestObservations.filter(({ path }) => path === "/v1/account/recovery-codes" || path === "/v1/account/recovery-codes/issue/saved-ack" || path === "/v1/account/recovery-codes/consume/ack" || path === "/v1/account/deletion")
      .every(({ authorization }) => authorization));
    assert.ok(requestObservations.filter(({ path }) => path === "/v1/public/recovery-codes/consume" || path === "/v1/public/recovery-codes/consume/status")
      .every(({ authorization }) => !authorization));
    const proofRequest = requestObservations.find(({ method, path }) => method === "GET" && path === `/v1/public/deletion-proofs/${deletionProofId}`);
    assert.ok(proofRequest?.appCheck);
    assert.equal(proofRequest?.authorization, false);
    const backendLogStatusCounts = logProbe.verify("account deletion fixture", [401]);
    context.diagnostic(`real HTTP deletion superseded the pending recovery result, rejected its stale ACK as account_deleted, completed the public proof, removed Auth and owned Firestore records, and left public consume status non-minting; backendLogRedaction=pass; requests=${backendLogStatusCounts.requests}; positive=${backendLogStatusCounts.positive}; negative=${backendLogStatusCounts.negative}`);
  } finally {
    releaseRevokeGate();
    if (deletionServerInvoked) {
      let cleanupWaitTimer: ReturnType<typeof setTimeout> | undefined;
      const clientCompletion = deletionPromise?.then(() => undefined, () => undefined) ?? Promise.resolve();
      const serverCompletion = deletionServerSettled;
      unconfirmedDeletionCleanup = await Promise.race([
        Promise.all([clientCompletion, serverCompletion]).then(() => false),
        new Promise<boolean>((resolveTimeout) => { cleanupWaitTimer = setTimeout(() => resolveTimeout(true), 35_000); }),
      ]).finally(() => { if (cleanupWaitTimer) clearTimeout(cleanupWaitTimer); });
    }
    if (unconfirmedDeletionCleanup) {
      let teardownTimer: ReturnType<typeof setTimeout> | undefined;
      const teardownTimedOut = await Promise.race([
        Promise.allSettled([
          clientAuth?._delete(),
          firebaseAppInstance ? firebaseApp.deleteApp(firebaseAppInstance) : undefined,
          backend.close(),
          runtime.close(),
          firebaseAdminApp.deleteApp(runtime.app),
        ]).then(() => false),
        new Promise<boolean>((resolveTimeout) => { teardownTimer = setTimeout(() => resolveTimeout(true), 5_000); }),
      ]).finally(() => { if (teardownTimer) clearTimeout(teardownTimer); });
      if (teardownTimedOut) {
        process.stderr.write("deletion_server_cleanup_unconfirmed\n");
        process.exit(1);
      }
      throw new Error("deletion_server_cleanup_unconfirmed");
    }
    if (!unconfirmedDeletionCleanup && clientAuth?.currentUser) await firebaseAuth.signOut(clientAuth).catch(() => undefined);
    if (!unconfirmedDeletionCleanup && createdUserId) {
      const ownedUserRef = runtime.db.collection(COLLECTIONS.users).doc(createdUserId);
      for (const collection of [COLLECTIONS.accountRecoveryOperations, COLLECTIONS.accountRecoveryOperationResults, COLLECTIONS.recoveryCodeIndex, COLLECTIONS.sessionRevocationOperations]) {
        const snapshots = await runtime.db.collection(collection).where("userId", "==", createdUserId).get().catch(() => null);
        if (snapshots && !snapshots.empty) {
          const batch = runtime.db.batch();
          for (const { ref } of snapshots.docs) batch.delete(ref);
          await batch.commit().catch(() => undefined);
        }
      }
      for (const codeHash of ownedCodeHashes) await runtime.db.collection(COLLECTIONS.recoveryCodeIndex).doc(codeHash).delete().catch(() => undefined);
      for (const operationId of ownedOperationIds) {
        await runtime.db.collection(COLLECTIONS.accountRecoveryOperations).doc(operationId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.accountRecoveryOperationResults).doc(operationId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.sessionRevocationOperations).doc(operationId).delete().catch(() => undefined);
      }
      if (deletionOperationId) {
        const deletionRef = runtime.db.collection(COLLECTIONS.accountDeletionOperations).doc(deletionOperationId);
        const deletion = await deletionRef.get().catch(() => null);
        const persistedProofId = deletion?.get("proofId");
        if (typeof persistedProofId === "string") deletionProofId = persistedProofId;
        await deletionRef.delete().catch(() => undefined);
      }
      if (deletionProofId) await runtime.db.collection(COLLECTIONS.deletionProofs).doc(deletionProofId).delete().catch(() => undefined);
      for (const tombstoneId of ownedTombstoneIds) await runtime.db.collection(COLLECTIONS.deletedIdentities).doc(tombstoneId).delete().catch(() => undefined);
      await ownedUserRef.collection("security").doc("recoveryCodes").delete().catch(() => undefined);
      await ownedUserRef.delete().catch(() => undefined);
      if (createdFirebaseUid) {
        const ring = new PseudonymKeyRing(JSON.parse(environment.deletionPseudonymKeysJson));
        const mapping = ring.active("firebase", createdFirebaseUid);
        await runtime.db.collection(COLLECTIONS.identityMappings).doc(mapping.documentId).delete().catch(() => undefined);
        await runtime.db.collection(COLLECTIONS.identityMappings).doc(identityDocumentId("firebase", createdFirebaseUid)).delete().catch(() => undefined);
      }
    }
    if (!unconfirmedDeletionCleanup && createdFirebaseUid) await sdkAdmin.deleteUser(createdFirebaseUid).catch(() => undefined);
    if (clientAuth) await clientAuth._delete().catch(() => undefined);
    if (firebaseAppInstance) await firebaseApp.deleteApp(firebaseAppInstance).catch(() => undefined);
    await backend.close().catch(() => undefined);
    await runtime.close().catch(() => undefined);
    await firebaseAdminApp.deleteApp(runtime.app).catch(() => undefined);
  }
});

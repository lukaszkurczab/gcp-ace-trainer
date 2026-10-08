import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runQ13LocalActor, safeQ13ErrorCode } from "./prepareQ13LocalActor.mjs";

const APP_CHECK = "a".repeat(64);
const ENVIRONMENT = Object.freeze({ PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke" });

async function fixture() {
  const rootDir = await mkdtemp(join(tmpdir(), "patternly-q13-actor-"));
  const backendSecretsPath = join(rootDir, "backend-secrets.json");
  const profile = [
    "EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE=smoke",
    "EXPO_PUBLIC_PATTERNLY_BACKEND_E2E=true",
    "EXPO_PUBLIC_PATTERNLY_API_ORIGIN=http://127.0.0.1:8080",
    "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN=http://127.0.0.1:19099",
    "EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY=q13-test-api-key",
    "EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID=local-admin",
    "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN=localhost",
    "EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID=patternly-app-sandbox",
    "EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID=android-client",
    "EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID=ios-client",
    "EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID=web-client",
    `EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN=${APP_CHECK}`,
  ].join("\n");
  await writeFile(join(rootDir, ".env.smoke.local"), profile, { mode: 0o600 });
  await writeFile(backendSecretsPath, JSON.stringify({ appCheckToken: APP_CHECK }), { mode: 0o600 });
  await mkdir(join(rootDir, ".temp"), { mode: 0o700 });
  return { rootDir, backendSecretsPath };
}

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, async json() { return body; } };
}

function createFetch({ uid, registration = "success", statusResolution = "unregistered", guard = "valid", counters = {} } = {}) {
  return async (input, init = {}) => {
    const url = new URL(input);
    counters.calls = (counters.calls ?? 0) + 1;
    if (url.pathname.endsWith("/emulator/v1/projects/patternly-app-sandbox/config")) return response(200, { signIn: { allowDuplicateEmails: false } });
    if (url.pathname === "/ready") return response(200, { status: "ready", checks: { database: true, authentication: true, providerReader: true } });
    if (url.pathname === "/v1/account/session/exchange" && !init.headers?.authorization) {
      assert.equal(init.method, "POST");
      assert.equal(init.headers["x-firebase-appcheck"], APP_CHECK);
      assert.equal(init.headers.authorization, undefined);
      assert.deepEqual(JSON.parse(init.body), {});
      if (guard === "timeout") throw new Error(`synthetic failure ${APP_CHECK}`);
      if (guard === "malformed") return { ok: false, status: 401, async json() { throw new Error(APP_CHECK); } };
      if (guard === "wrong") return response(401, { error: { code: "app_check_invalid" } });
      return response(401, { error: { code: "authentication_required" } });
    }
    if (url.pathname.endsWith("/accounts:signInWithPassword")) return response(200, { idToken: "opaque-id-token", localId: uid });
    if (url.pathname === "/v1/me" && init.method === "GET") {
      counters.meReads = (counters.meReads ?? 0) + 1;
      if (statusResolution === "registered") return response(200, { user: { identity: { subject: uid } } });
      if (statusResolution === "me-mismatch") return response(200, { user: { identity: { subject: "different-planned-identity" } } });
      return response(404, { error: { code: "account_not_found" } });
    }
    if (url.pathname === "/v1/account/registration") {
      counters.registrationPosts = (counters.registrationPosts ?? 0) + 1;
      assert.equal(init.headers.authorization, "Bearer opaque-id-token");
      assert.equal(init.headers["x-firebase-appcheck"], APP_CHECK);
      assert.equal(init.method, "POST");
      assert.deepEqual(JSON.parse(init.body), {
        termsVersion: "2026-09-05", termsLocale: "en", privacyPolicyVersion: "2026-09-05", privacyPolicyLocale: "en", privacyPolicyAcknowledged: true,
      });
      if (registration === "timeout") throw new Error("synthetic transport failure");
      if (registration === "created-false") return response(200, { registration: { created: false, user: { identity: { subject: uid } } } });
      return response(201, { registration: { created: true, user: { identity: { subject: uid } } } });
    }
    if (url.pathname === "/v1/account/session/exchange") {
      assert.equal(init.headers.authorization, "Bearer opaque-id-token");
      if (statusResolution === "registered" || statusResolution === "me-mismatch") return response(200, { customToken: "opaque-custom-token" });
      return response(404, { error: { code: "account_not_found" } });
    }
    if (url.pathname.endsWith("/accounts:signInWithCustomToken")) return response(200, { idToken: "opaque-pinned-token" });
    if (url.pathname === "/v1/me" && init.headers.authorization === "Bearer opaque-pinned-token") {
      return response(200, { user: { identity: { subject: uid } } });
    }
    throw new Error(`Unexpected test request ${url.pathname}`);
  };
}

function createAuth({ exists = false, verifyUidOverride, verifyFails = false } = {}) {
  const users = new Map();
  const calls = { creates: 0, verifications: 0 };
  if (exists) users.set("existing", { uid: "existing", email: "existing@example.test", emailVerified: true });
  const missing = () => Object.assign(new Error("not found"), { code: "auth/user-not-found" });
  const authAdminFactory = () => ({
    async getUser(uid) {
      if (exists) return users.get("existing");
      const user = users.get(uid);
      if (!user) throw missing();
      return user;
    },
    async getUserByEmail(email) {
      const user = [...users.values()].find((candidate) => candidate.email === email);
      if (!user) throw missing();
      return user;
    },
    async verifyIdToken(token) {
      calls.verifications += 1;
      if (verifyFails || token !== "opaque-pinned-token") throw Object.assign(new Error("synthetic verifier error"), { code: "auth/argument-error" });
      const created = [...users.values()].find((user) => user.uid.startsWith("q13-"));
      return { uid: verifyUidOverride ?? created?.uid, aud: "patternly-app-sandbox", iss: "https://securetoken.google.com/patternly-app-sandbox" };
    },
    async createUser(user) {
      calls.creates += 1;
      if (users.has(user.uid) || [...users.values()].some((candidate) => candidate.email === user.email)) throw Object.assign(new Error("collision"), { code: "auth/email-already-exists" });
      users.set(user.uid, user);
      return user;
    },
    users,
    calls,
  });
  return { authAdminFactory, users, calls };
}

test("prepare binds one fresh verified Auth identity to created backend registration and keeps secrets out of manifest", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const auth = createAuth();
  let createdUid;
  const result = await runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: async () => {
    const client = auth.authAdminFactory();
    return {
      ...client,
      async createUser(user) { await client.createUser(user); createdUid = user.uid; return user; },
    };
  }, fetchImpl: async (input, init) => {
    return createFetch({ uid: createdUid })(input, init);
  } });
  assert.deepEqual(result, { status: "registered", stage: "registered", identity: "created_for_planned_actor", credentialFile: ".temp/q13-local-actor/credentials.json" });
  assert.equal(auth.calls.creates, 1);
  const privateDir = join(files.rootDir, ".temp/q13-local-actor");
  const credentialsText = await readFile(join(privateDir, "credentials.json"), "utf8");
  const credentials = JSON.parse(credentialsText);
  const manifestText = await readFile(join(privateDir, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestText);
  assert.match(credentials.email, /^q13-[a-f0-9]{32}@example\.test$/u);
  assert.equal(credentials.emailVerified, undefined);
  assert.equal(auth.users.get(credentials.uid).emailVerified, true);
  assert.equal(credentials.password.length, 43);
  assert.equal(manifest.stage, "registered");
  assert.equal(manifest.projectId, "patternly-app-sandbox");
  assert.deepEqual(Object.keys(manifest).sort(), ["createdAt", "credentialSha256", "emailSha256", "operationId", "projectId", "schemaVersion", "stage", "uidSha256"].sort());
  assert.ok(!manifestText.includes(credentials.email));
  assert.ok(!manifestText.includes(credentials.uid));
  assert.ok(!manifestText.includes(credentials.password));
  assert.equal((await stat(privateDir)).mode & 0o777, 0o700);
  assert.equal((await stat(join(privateDir, "credentials.json"))).mode & 0o777, 0o600);
  assert.equal((await stat(join(privateDir, "manifest.json"))).mode & 0o777, 0o600);
});

test("pinned configuration failures stop before network or private writes", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const text = await readFile(join(files.rootDir, ".env.smoke.local"), "utf8");
  await writeFile(join(files.rootDir, ".env.smoke.local"), text.replace("127.0.0.1:19099", "127.0.0.1:19098"), { mode: 0o600 });
  let calls = 0;
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, fetchImpl: async () => { calls += 1; return response(200, {}); } }), (error) => error.code === "pinned_local_configuration_mismatch");
  assert.equal(calls, 0);
  await assert.rejects(stat(join(files.rootDir, ".temp/q13-local-actor")), { code: "ENOENT" });
});

test("wrong Firebase project and unready API block before local actor mutation", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const text = await readFile(join(files.rootDir, ".env.smoke.local"), "utf8");
  await writeFile(join(files.rootDir, ".env.smoke.local"), text.replace("patternly-app-sandbox", "wrong-patternly-project"), { mode: 0o600 });
  let calls = 0;
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, fetchImpl: async () => { calls += 1; return response(200, {}); } }), (error) => error.code === "smoke_profile_invalid");
  assert.equal(calls, 0);
  await writeFile(join(files.rootDir, ".env.smoke.local"), text, { mode: 0o600 });
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, fetchImpl: async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/config")) return response(200, { signIn: { allowDuplicateEmails: false } });
    return response(503, { status: "not_ready", checks: { database: false, authentication: true, providerReader: true } });
  } }), (error) => error.code === "smoke_api_unavailable");
  await assert.rejects(stat(join(files.rootDir, ".temp/q13-local-actor")), { code: "ENOENT" });
});

test("App Check mismatch blocks before network", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  await writeFile(files.backendSecretsPath, JSON.stringify({ appCheckToken: "b".repeat(64) }), { mode: 0o600 });
  let calls = 0;
  await assert.rejects(runQ13LocalActor("preflight", { ...files, environment: ENVIRONMENT, fetchImpl: async () => { calls += 1; return response(200, {}); } }), (error) => error.code === "local_app_check_binding_invalid");
  assert.equal(calls, 0);
});

test("stale inherited App Check token blocks before network and private writes", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  let calls = 0;
  await assert.rejects(runQ13LocalActor("prepare", {
    ...files,
    environment: { ...ENVIRONMENT, EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "c".repeat(64) },
    fetchImpl: async () => { calls += 1; return response(200, {}); },
  }), (error) => error.code === "local_app_check_process_binding_invalid");
  assert.equal(calls, 0);
  await assert.rejects(stat(join(files.rootDir, ".temp/q13-local-actor")), { code: "ENOENT" });
});

test("API App Check guard must return exact unauthenticated response before any actor artifact or create", async (t) => {
  for (const [guard, reason] of [["wrong", "smoke_api_auth_guard_unexpected"], ["malformed", "smoke_api_auth_guard_invalid"], ["timeout", "smoke_api_auth_guard_unavailable"]]) {
    const files = await fixture();
    t.after(() => rm(files.rootDir, { recursive: true, force: true }));
    let adminCalls = 0;
    const error = await runQ13LocalActor("prepare", {
      ...files,
      environment: ENVIRONMENT,
      authAdminFactory: () => { adminCalls += 1; throw new Error("must not initialize Auth before attestation guard"); },
      fetchImpl: createFetch({ guard }),
    }).then(() => null, (caught) => caught);
    assert.equal(error.code, reason);
    assert.equal(error.message, reason);
    assert.ok(!error.message.includes(APP_CHECK));
    assert.equal(adminCalls, 0);
    await assert.rejects(stat(join(files.rootDir, ".temp/q13-local-actor")), { code: "ENOENT" });
  }
});

test("Auth collision stops before create and registration", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const auth = createAuth({ exists: true });
  const counters = {};
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: auth.authAdminFactory, fetchImpl: createFetch({ counters }) }), (error) => error.code === "auth_uid_collision");
  assert.equal(auth.calls.creates, 0);
  assert.equal(counters.registrationPosts ?? 0, 0);
  const manifest = JSON.parse(await readFile(join(files.rootDir, ".temp/q13-local-actor/manifest.json"), "utf8"));
  assert.equal(manifest.stage, "planned");
});

test("Auth create timeout stays pending; status does not create a replacement identity", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const auth = createAuth();
  let creates = 0;
  const authFactory = async () => {
    const base = auth.authAdminFactory();
    return { ...base, async createUser() { creates += 1; throw new Error("indeterminate SDK error"); } };
  };
  const createError = await runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: createFetch() }).then(() => null, (error) => error);
  assert.equal(createError.code, "auth_create_outcome_unknown");
  assert.equal(createError.message, "auth_create_outcome_unknown");
  const credentials = JSON.parse(await readFile(join(files.rootDir, ".temp/q13-local-actor/credentials.json"), "utf8"));
  assert.ok(!createError.message.includes(credentials.password));
  assert.ok(!createError.message.includes(credentials.email));
  const manifest = JSON.parse(await readFile(join(files.rootDir, ".temp/q13-local-actor/manifest.json"), "utf8"));
  assert.equal(manifest.stage, "auth_create_pending");
  const status = await runQ13LocalActor("status", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: createFetch() });
  assert.equal(status.status, "unknown");
  assert.equal(status.auth, "not_found");
  assert.equal(creates, 1);
});

test("private directory symlinks and relaxed file modes are rejected", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const outside = join(files.rootDir, "outside");
  await mkdir(outside, { mode: 0o700 });
  await rm(join(files.rootDir, ".temp"), { recursive: true });
  await symlink(outside, join(files.rootDir, ".temp"));
  await assert.rejects(runQ13LocalActor("status", { ...files, environment: ENVIRONMENT, fetchImpl: createFetch() }), (error) => error.code === "private_directory_parent_invalid");

  await rm(join(files.rootDir, ".temp"));
  await mkdir(join(files.rootDir, ".temp"), { mode: 0o700 });
  await mkdir(join(files.rootDir, ".temp/q13-local-actor"), { mode: 0o700 });
  await chmod(join(files.rootDir, ".temp/q13-local-actor"), 0o755);
  await assert.rejects(runQ13LocalActor("status", { ...files, environment: ENVIRONMENT, fetchImpl: createFetch() }), (error) => error.code === "private_directory_permissions_invalid");
});

test("uncertain registration is reconciled read-only and never POSTed twice", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const auth = createAuth();
  const counters = {};
  let uid;
  const authFactory = async () => {
    const base = auth.authAdminFactory();
    return { ...base, async createUser(user) { uid = user.uid; return base.createUser(user); } };
  };
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: async (input, init) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/accounts:signInWithPassword") && uid) return response(200, { idToken: "opaque-id-token", localId: uid });
    return createFetch({ uid, registration: "timeout", counters })(input, init);
  } }), (error) => error.code === "registration_outcome_unknown");
  const status = await runQ13LocalActor("status", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: async (input, init) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/accounts:signInWithPassword")) return response(200, { idToken: "opaque-id-token", localId: uid });
    return createFetch({ uid, statusResolution: "unregistered", counters })(input, init);
  } });
  assert.equal(status.status, "registration_not_confirmed");
  assert.equal(status.registration, "not_found");
  assert.equal(counters.registrationPosts, 1);
});

test("status recognizes a completed registration after a lost response without replaying POST", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const auth = createAuth();
  let uid;
  let registrationPosts = 0;
  const authFactory = async () => {
    const base = auth.authAdminFactory();
    return { ...base, async createUser(user) { uid = user.uid; return base.createUser(user); } };
  };
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: async (input, init) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/accounts:signInWithPassword") && uid) return response(200, { idToken: "opaque-id-token", localId: uid });
    if (url.pathname === "/v1/account/registration") { registrationPosts += 1; throw new Error("response lost after server commit"); }
    return createFetch({ uid })(input, init);
  } }), (error) => error.code === "registration_outcome_unknown");
  const status = await runQ13LocalActor("status", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: async (input, init) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/accounts:signInWithPassword")) return response(200, { idToken: "opaque-id-token", localId: uid });
    return createFetch({ uid, statusResolution: "registered" })(input, init);
  } });
  assert.equal(status.status, "registered");
  assert.equal(auth.calls.verifications, 1);
  assert.equal(registrationPosts, 1);
});

test("status rejects an invalid or differently bound custom sign-in token before /me", async (t) => {
  for (const authOptions of [{ verifyFails: true }, { verifyUidOverride: "another-uid" }]) {
    const files = await fixture();
    t.after(() => rm(files.rootDir, { recursive: true, force: true }));
    const auth = createAuth(authOptions);
    let uid;
    const authFactory = async () => {
      const base = auth.authAdminFactory();
      return { ...base, async createUser(user) { uid = user.uid; return base.createUser(user); } };
    };
    const prepareCounters = {};
    await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: async (input, init) => {
      const url = new URL(input);
      if (url.pathname.endsWith("/accounts:signInWithPassword") && uid) return response(200, { idToken: "opaque-id-token", localId: uid });
      return createFetch({ uid, registration: "timeout", counters: prepareCounters })(input, init);
    } }), (error) => error.code === "registration_outcome_unknown");

    const statusCounters = {};
    const status = await runQ13LocalActor("status", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: async (input, init) => {
      const url = new URL(input);
      if (url.pathname.endsWith("/accounts:signInWithPassword")) return response(200, { idToken: "opaque-id-token", localId: uid });
      return createFetch({ uid, statusResolution: "registered", counters: statusCounters })(input, init);
    } });
    assert.equal(status.status, "unknown");
    assert.equal(status.registration, "unavailable");
    assert.equal(statusCounters.meReads ?? 0, 0);
    assert.equal(statusCounters.registrationPosts ?? 0, 0);
    assert.equal(auth.calls.verifications, 1);
  }
});

test("status still requires exact /me identity after Admin token verification", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const auth = createAuth();
  let uid;
  const authFactory = async () => {
    const base = auth.authAdminFactory();
    return { ...base, async createUser(user) { uid = user.uid; return base.createUser(user); } };
  };
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: async (input, init) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/accounts:signInWithPassword") && uid) return response(200, { idToken: "opaque-id-token", localId: uid });
    return createFetch({ uid, registration: "timeout" })(input, init);
  } }), (error) => error.code === "registration_outcome_unknown");

  const statusCounters = {};
  const status = await runQ13LocalActor("status", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl: async (input, init) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/accounts:signInWithPassword")) return response(200, { idToken: "opaque-id-token", localId: uid });
    return createFetch({ uid, statusResolution: "me-mismatch", counters: statusCounters })(input, init);
  } });
  assert.equal(status.status, "unknown");
  assert.equal(status.registration, "unavailable");
  assert.equal(statusCounters.meReads, 1);
  assert.equal(statusCounters.registrationPosts ?? 0, 0);
  assert.equal(auth.calls.verifications, 1);
});

test("created:false is a hard conflict and private operation cannot be prepared twice", async (t) => {
  const files = await fixture();
  t.after(() => rm(files.rootDir, { recursive: true, force: true }));
  const auth = createAuth();
  let uid;
  const authFactory = async () => {
    const base = auth.authAdminFactory();
    return { ...base, async createUser(user) { uid = user.uid; return base.createUser(user); } };
  };
  const fetchImpl = async (input, init) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/accounts:signInWithPassword") && uid) return response(200, { idToken: "opaque-id-token", localId: uid });
    if (url.pathname === "/v1/account/registration") return createFetch({ uid, registration: "created-false" })(input, init);
    return createFetch({ uid })(input, init);
  };
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl }), (error) => error.code === "registration_not_created_for_planned_identity");
  const manifest = JSON.parse(await readFile(join(files.rootDir, ".temp/q13-local-actor/manifest.json"), "utf8"));
  assert.equal(manifest.stage, "registration_pending");
  await assert.rejects(runQ13LocalActor("prepare", { ...files, environment: ENVIRONMENT, authAdminFactory: authFactory, fetchImpl }), (error) => error.code === "private_operation_already_exists");
});

test("safe errors expose only static codes, never SDK or secret text", () => {
  assert.equal(safeQ13ErrorCode(Object.assign(new Error("private-token-value"), { code: "private-token-value" })), "q13_operation_failed");
  assert.equal(safeQ13ErrorCode(Object.assign(new Error("secret"), { code: "auth_create_outcome_unknown" })), "auth_create_outcome_unknown");
});

import { createHash, randomBytes as cryptoRandomBytes } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { mkdir, open, readFile, readdir, rename, lstat, unlink } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDotenv, validateLocalProfile } from "./runLocalProfile.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { legalVariablesLocalFixture } = createRequire(import.meta.url)("../src/legal/legalVariablesLocalFixture.ts");
const PROJECT = "patternly-app-sandbox";
const AUTH_ORIGIN = "http://127.0.0.1:19099";
const API_ORIGIN = "http://127.0.0.1:8080";
const AUTH_HOST = "127.0.0.1:19099";
const PROFILE = ".env.smoke.local";
const BACKEND_SECRETS = "../patternly-backend/.local/smoke/secrets.json";
const PRIVATE_DIRECTORY = ".temp/q13-local-actor";
const CREDENTIALS_FILE = "credentials.json";
const MANIFEST_FILE = "manifest.json";
const SCHEMA_VERSION = 1;
const MODE_DIRECTORY = 0o700;
const MODE_FILE = 0o600;
const MANIFEST_KEYS = Object.freeze([
  "schemaVersion", "operationId", "projectId", "stage", "createdAt", "uidSha256", "emailSha256", "credentialSha256",
]);
const STAGES = new Set(["planned", "auth_create_pending", "auth_created", "registration_pending", "registered"]);
const SAFE_ERROR_CODES = new Set([
  "usage", "local_smoke_configuration_unavailable", "smoke_profile_invalid", "pinned_local_configuration_mismatch",
  "local_app_check_binding_invalid", "auth_emulator_unavailable", "auth_emulator_response_invalid", "smoke_api_unavailable",
  "local_app_check_process_binding_invalid", "smoke_api_auth_guard_unavailable", "smoke_api_auth_guard_invalid", "smoke_api_auth_guard_unexpected",
  "smoke_api_response_invalid", "private_operation_already_exists", "private_directory_contains_unexpected_files",
  "private_state_invalid", "auth_create_outcome_unknown", "auth_uid_collision", "auth_uid_check_failed",
  "auth_email_collision", "auth_email_check_failed", "auth_status_unavailable", "auth_sign_in_failed",
  "auth_sign_in_response_invalid", "registration_precheck_unavailable", "registration_precheck_invalid",
  "registration_precheck_not_unregistered", "registration_outcome_unknown", "registration_not_created_for_planned_identity",
  "registration_status_unavailable", "private_manifest_create_failed", "private_manifest_update_failed",
  "manifest_stage_invalid", "private_directory_parent_invalid", "private_directory_create_failed",
  "private_directory_invalid", "private_directory_permissions_invalid", "private_file_missing", "private_file_invalid",
  "private_file_permissions_invalid", "private_file_create_failed", "private_credentials_invalid", "auth_created_identity_mismatch", "q13_operation_failed",
]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const codedError = (code) => Object.assign(new Error(code), { code });

export async function runQ13LocalActor(command, options = {}) {
  const rootDir = resolve(options.rootDir ?? ROOT);
  const environment = options.environment ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const random = options.randomBytes ?? cryptoRandomBytes;
  const paths = {
    directory: join(rootDir, PRIVATE_DIRECTORY),
    credentials: join(rootDir, PRIVATE_DIRECTORY, CREDENTIALS_FILE),
    manifest: join(rootDir, PRIVATE_DIRECTORY, MANIFEST_FILE),
  };

  if (!["preflight", "prepare", "status"].includes(command)) throw codedError("usage");
  const config = await readAndValidateConfiguration(rootDir, environment, options);
  await preflight(config, fetchImpl);
  if (command === "preflight") return Object.freeze({ status: "ready", project: PROJECT, auth: "ready", api: "ready", appCheck: "matched" });
  if (command === "status") return inspectExistingOperation({ paths, config, fetchImpl, options, random });

  const directoryState = await inspectPrivateDirectory(paths.directory, { allowMissing: true });
  if (directoryState === "missing") await createPrivateDirectory(rootDir, paths.directory);
  else await assertPrivateDirectory(paths.directory);
  const entries = await readdir(paths.directory);
  if (entries.length !== 0) throw codedError("private_operation_already_exists");

  const operationId = random(16).toString("hex");
  const uid = `q13-${random(16).toString("hex")}`;
  const email = `q13-${random(16).toString("hex")}@example.test`;
  const password = random(32).toString("base64url");
  const credentials = Object.freeze({ schemaVersion: SCHEMA_VERSION, uid, email, password });
  const serializedCredentials = `${JSON.stringify(credentials)}\n`;
  const manifest = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    operationId,
    projectId: PROJECT,
    stage: "planned",
    createdAt: now().toISOString(),
    uidSha256: sha256(uid),
    emailSha256: sha256(email),
    credentialSha256: sha256(serializedCredentials),
  });

  await createExclusivePrivateFile(paths.credentials, serializedCredentials);
  try {
    await createExclusivePrivateFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
  } catch {
    throw codedError("private_manifest_create_failed");
  }

  const auth = await createLocalAuthClient(PROJECT, options);
  await assertAuthIdentityAbsent(auth, uid, email);
  const admin = await loadCredentials(paths.credentials);
  await updateManifest(paths.manifest, manifest, "auth_create_pending");
  try {
    const created = await auth.createUser({ uid: admin.uid, email: admin.email, password: admin.password, emailVerified: true });
    if (created?.uid !== admin.uid || created?.email !== admin.email || created?.emailVerified !== true) throw codedError("auth_created_identity_mismatch");
  } catch (error) {
    if (error?.code === "auth_created_identity_mismatch") throw error;
    throw codedError("auth_create_outcome_unknown");
  }
  let current = await updateManifest(paths.manifest, manifest, "auth_created");

  const idToken = await signInWithPassword(config, admin, fetchImpl);
  await assertRegistrationNotMapped(config, idToken, fetchImpl);
  current = await updateManifest(paths.manifest, current, "registration_pending");
  const registration = await registerIdentity(config, idToken, admin.uid, fetchImpl);
  current = await updateManifest(paths.manifest, current, "registered");
  return Object.freeze({ status: "registered", stage: current.stage, identity: registration.identity, credentialFile: PRIVATE_DIRECTORY + "/" + CREDENTIALS_FILE });
}

async function readAndValidateConfiguration(rootDir, environment, options) {
  let appProfile;
  let backendSecrets;
  const appProfilePath = join(rootDir, PROFILE);
  const backendSecretsPath = options.backendSecretsPath ?? resolve(rootDir, BACKEND_SECRETS);
  try {
    await assertPrivateFile(appProfilePath);
    await assertPrivateFile(backendSecretsPath);
    appProfile = parseDotenv(await readFile(appProfilePath, "utf8"));
    backendSecrets = JSON.parse(await readFile(backendSecretsPath, "utf8"));
  } catch {
    throw codedError("local_smoke_configuration_unavailable");
  }
  try {
    validateLocalProfile("smoke", { ...environment, ...appProfile });
  } catch {
    throw codedError("smoke_profile_invalid");
  }
  if (appProfile.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID !== PROJECT
    || appProfile.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN !== AUTH_ORIGIN
    || appProfile.EXPO_PUBLIC_PATTERNLY_API_ORIGIN !== API_ORIGIN
    || environment.PATTERNLY_RUNTIME_MODE !== "smoke"
    || environment.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE !== "smoke") throw codedError("pinned_local_configuration_mismatch");
  const appCheckToken = appProfile.EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN;
  if (typeof appCheckToken !== "string" || !/^[a-f0-9]{64}$/u.test(appCheckToken)
    || backendSecrets?.appCheckToken !== appCheckToken) throw codedError("local_app_check_binding_invalid");
  if (environment.EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN !== undefined
    && environment.EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN !== appCheckToken) throw codedError("local_app_check_process_binding_invalid");
  return Object.freeze({ project: PROJECT, authOrigin: AUTH_ORIGIN, apiOrigin: API_ORIGIN, apiKey: appProfile.EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY, appCheckToken });
}

async function preflight(config, fetchImpl) {
  const auth = await safeFetch(fetchImpl, new URL(`/emulator/v1/projects/${PROJECT}/config`, config.authOrigin), { method: "GET" }, "auth_emulator_unavailable");
  if (!auth.ok) throw codedError("auth_emulator_unavailable");
  let authBody;
  try { authBody = await auth.json(); } catch { throw codedError("auth_emulator_response_invalid"); }
  if (typeof authBody?.signIn?.allowDuplicateEmails !== "boolean") throw codedError("auth_emulator_response_invalid");

  const api = await safeFetch(fetchImpl, new URL("/ready", config.apiOrigin), { method: "GET" }, "smoke_api_unavailable");
  if (!api.ok) throw codedError("smoke_api_unavailable");
  let apiBody;
  try { apiBody = await api.json(); } catch { throw codedError("smoke_api_response_invalid"); }
  if (apiBody?.status !== "ready" || apiBody?.checks?.database !== true
    || apiBody?.checks?.authentication !== true || apiBody?.checks?.providerReader !== true) throw codedError("smoke_api_unavailable");

  const guard = await safeFetch(fetchImpl, new URL("/v1/account/session/exchange", config.apiOrigin), {
    method: "POST",
    headers: { "content-type": "application/json", "x-firebase-appcheck": config.appCheckToken },
    body: "{}",
  }, "smoke_api_auth_guard_unavailable");
  const guardBody = await safeJson(guard, "smoke_api_auth_guard_invalid");
  if (guard.status !== 401 || guardBody?.error?.code !== "authentication_required") throw codedError("smoke_api_auth_guard_unexpected");
}

async function safeFetch(fetchImpl, url, init, failureCode) {
  try {
    return await fetchImpl(url, { ...init, redirect: "error", signal: AbortSignal.timeout(4_000) });
  } catch {
    throw codedError(failureCode);
  }
}

async function inspectExistingOperation({ paths, config, fetchImpl, options }) {
  const directoryState = await inspectPrivateDirectory(paths.directory, { allowMissing: true });
  if (directoryState === "missing") return Object.freeze({ status: "absent" });
  await assertPrivateDirectory(paths.directory);
  const entries = await readdir(paths.directory);
  if (entries.length === 0) return Object.freeze({ status: "absent" });
  if (entries.some((entry) => entry !== CREDENTIALS_FILE && entry !== MANIFEST_FILE)) throw codedError("private_directory_contains_unexpected_files");
  const { manifest, credentials } = await readPrivateOperation(paths);
  const auth = await createLocalAuthClient(PROJECT, options);
  const identity = await findAuthIdentity(auth, credentials.uid, credentials.email);
  if (!identity) return Object.freeze({ status: "unknown", stage: manifest.stage, auth: "not_found", registration: "not_checked" });
  if (identity.uid !== credentials.uid || identity.email !== credentials.email || identity.emailVerified !== true) {
    return Object.freeze({ status: "unknown", stage: manifest.stage, auth: "identity_mismatch", registration: "not_checked" });
  }
  const registration = await inspectRegistration(config, credentials, auth, fetchImpl);
  if (registration === "registered") return Object.freeze({ status: "registered", stage: manifest.stage, auth: "verified", registration: "verified" });
  if (registration === "unregistered") {
    const status = manifest.stage === "auth_created" ? "auth_created_unregistered"
      : manifest.stage === "auth_create_pending" ? "auth_present_registration_unmapped"
        : "registration_not_confirmed";
    return Object.freeze({ status, stage: manifest.stage, auth: "verified", registration: "not_found" });
  }
  return Object.freeze({ status: "unknown", stage: manifest.stage, auth: "verified", registration: "unavailable" });
}

async function readPrivateOperation(paths) {
  await assertPrivateFile(paths.credentials);
  await assertPrivateFile(paths.manifest);
  let manifest;
  let credentials;
  try {
    const rawManifest = await readFile(paths.manifest, "utf8");
    const rawCredentials = await readFile(paths.credentials, "utf8");
    manifest = JSON.parse(rawManifest);
    credentials = JSON.parse(rawCredentials);
    if (rawManifest !== `${JSON.stringify(manifest, null, 2)}\n` || rawCredentials !== `${JSON.stringify(credentials)}\n`) throw codedError("private_state_invalid");
  } catch (error) {
    if (error?.code === "private_state_invalid") throw error;
    throw codedError("private_state_invalid");
  }
  if (!isStrictManifest(manifest) || !isStrictCredentials(credentials)
    || manifest.projectId !== PROJECT || !STAGES.has(manifest.stage)
    || manifest.uidSha256 !== sha256(credentials.uid) || manifest.emailSha256 !== sha256(credentials.email)
    || manifest.credentialSha256 !== sha256(`${JSON.stringify(credentials)}\n`)) throw codedError("private_state_invalid");
  return Object.freeze({ manifest, credentials });
}

function isStrictManifest(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === MANIFEST_KEYS.length && Object.keys(value).every((key) => MANIFEST_KEYS.includes(key))
    && value.schemaVersion === SCHEMA_VERSION && typeof value.operationId === "string" && /^[a-f0-9]{32}$/u.test(value.operationId)
    && typeof value.createdAt === "string" && Number.isFinite(Date.parse(value.createdAt))
    && [value.uidSha256, value.emailSha256, value.credentialSha256].every((entry) => typeof entry === "string" && /^[a-f0-9]{64}$/u.test(entry));
}

function isStrictCredentials(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === 4 && Object.keys(value).every((key) => ["schemaVersion", "uid", "email", "password"].includes(key))
    && value.schemaVersion === SCHEMA_VERSION && typeof value.uid === "string" && /^q13-[a-f0-9]{32}$/u.test(value.uid)
    && typeof value.email === "string" && /^q13-[a-f0-9]{32}@example\.test$/u.test(value.email)
    && typeof value.password === "string" && /^[A-Za-z0-9_-]{43}$/u.test(value.password);
}

async function createLocalAuthClient(projectId, options) {
  if (options.authAdminFactory) return options.authAdminFactory(projectId, AUTH_HOST);
  process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;
  const backendRoot = resolve(ROOT, "../patternly-backend");
  const backendRequire = createRequire(join(backendRoot, "package.json"));
  const { getApps, initializeApp } = backendRequire("firebase-admin/app");
  const { getAuth } = backendRequire("firebase-admin/auth");
  const appName = `patternly-q13-local-${process.pid}`;
  const app = getApps().find((item) => item.name === appName) ?? initializeApp({ projectId }, appName);
  return getAuth(app);
}

async function assertAuthIdentityAbsent(auth, uid, email) {
  try { await auth.getUser(uid); throw codedError("auth_uid_collision"); }
  catch (error) { if (error?.code === "auth_uid_collision") throw error; if (error?.code !== "auth/user-not-found") throw codedError("auth_uid_check_failed"); }
  try { await auth.getUserByEmail(email); throw codedError("auth_email_collision"); }
  catch (error) { if (error?.code === "auth_email_collision") throw error; if (error?.code !== "auth/user-not-found") throw codedError("auth_email_check_failed"); }
}

async function findAuthIdentity(auth, uid, email) {
  let byUid = null;
  let byEmail = null;
  try { byUid = await auth.getUser(uid); } catch (error) { if (error?.code !== "auth/user-not-found") throw codedError("auth_status_unavailable"); }
  try { byEmail = await auth.getUserByEmail(email); } catch (error) { if (error?.code !== "auth/user-not-found") throw codedError("auth_status_unavailable"); }
  if (!byUid && !byEmail) return null;
  if (!byUid || !byEmail || byUid.uid !== byEmail.uid) return Object.freeze({ uid: "mismatch", email: "mismatch", emailVerified: false });
  return Object.freeze({ uid: byUid.uid, email: byUid.email, emailVerified: byUid.emailVerified === true });
}

async function signInWithPassword(config, credentials, fetchImpl) {
  const url = new URL(`/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`, config.authOrigin);
  const response = await safeFetch(fetchImpl, url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: credentials.email, password: credentials.password, returnSecureToken: true }) }, "auth_sign_in_failed");
  const body = await safeJson(response, "auth_sign_in_response_invalid");
  if (!response.ok || typeof body.idToken !== "string" || body.localId !== credentials.uid) throw codedError("auth_sign_in_failed");
  return body.idToken;
}

async function assertRegistrationNotMapped(config, idToken, fetchImpl) {
  const response = await apiFetch(config, "/v1/me", { method: "GET", headers: authHeaders(config, idToken) }, fetchImpl, "registration_precheck_unavailable");
  const body = await safeJson(response, "registration_precheck_invalid");
  if (response.status !== 404 || body?.error?.code !== "account_not_found") throw codedError("registration_precheck_not_unregistered");
}

async function registerIdentity(config, idToken, uid, fetchImpl) {
  const version = legalVariablesLocalFixture.documentVersion.en;
  const body = {
    termsVersion: version,
    termsLocale: "en",
    privacyPolicyVersion: version,
    privacyPolicyLocale: "en",
    privacyPolicyAcknowledged: true,
  };
  const response = await apiFetch(config, "/v1/account/registration", { method: "POST", headers: { ...authHeaders(config, idToken), "content-type": "application/json" }, body: JSON.stringify(body) }, fetchImpl, "registration_outcome_unknown");
  const payload = await safeJson(response, "registration_outcome_unknown");
  if (response.status !== 201 || payload?.registration?.created !== true
    || payload?.registration?.user?.identity?.subject !== uid) throw codedError("registration_not_created_for_planned_identity");
  return Object.freeze({ identity: "created_for_planned_actor" });
}

async function inspectRegistration(config, credentials, auth, fetchImpl) {
  let idToken;
  try { idToken = await signInWithPassword(config, credentials, fetchImpl); } catch { return "unavailable"; }
  const exchange = await apiFetch(config, "/v1/account/session/exchange", { method: "POST", headers: { ...authHeaders(config, idToken), "content-type": "application/json" }, body: "{}" }, fetchImpl, "registration_status_unavailable");
  const exchangeBody = await safeJson(exchange, "registration_status_unavailable");
  if (exchange.status === 404 && exchangeBody?.error?.code === "account_not_found") return "unregistered";
  if (!exchange.ok || typeof exchangeBody.customToken !== "string") return "unavailable";
  const customIdToken = await signInWithCustomToken(config, exchangeBody.customToken, fetchImpl);
  let verifiedIdentity;
  try { verifiedIdentity = await auth.verifyIdToken(customIdToken); } catch { return "unavailable"; }
  if (verifiedIdentity?.uid !== credentials.uid) return "mismatch";
  const me = await apiFetch(config, "/v1/me", { method: "GET", headers: authHeaders(config, customIdToken) }, fetchImpl, "registration_status_unavailable");
  const meBody = await safeJson(me, "registration_status_unavailable");
  if (!me.ok) return "unavailable";
  return meBody?.user?.identity?.subject === credentials.uid ? "registered" : "mismatch";
}

async function signInWithCustomToken(config, customToken, fetchImpl) {
  const url = new URL(`/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(config.apiKey)}`, config.authOrigin);
  const response = await safeFetch(fetchImpl, url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: customToken, returnSecureToken: true }) }, "registration_status_unavailable");
  const body = await safeJson(response, "registration_status_unavailable");
  if (!response.ok || typeof body.idToken !== "string") throw codedError("registration_status_unavailable");
  return body.idToken;
}

function authHeaders(config, idToken) {
  return { authorization: `Bearer ${idToken}`, "x-firebase-appcheck": config.appCheckToken };
}

async function apiFetch(config, path, init, fetchImpl, failureCode) {
  return safeFetch(fetchImpl, new URL(path, config.apiOrigin), { ...init, headers: { ...(init.headers ?? {}), "x-firebase-appcheck": config.appCheckToken } }, failureCode);
}

async function safeJson(response, failureCode) {
  try { return await response.json(); } catch { throw codedError(failureCode); }
}

async function updateManifest(path, current, stage) {
  if (!STAGES.has(stage)) throw codedError("manifest_stage_invalid");
  const next = Object.freeze({ ...current, stage });
  await assertPrivateFile(path);
  const tempPath = `${path}.${cryptoRandomBytes(8).toString("hex")}.tmp`;
  await createExclusivePrivateFile(tempPath, `${JSON.stringify(next, null, 2)}\n`);
  try { await rename(tempPath, path); } catch {
    await unlink(tempPath).catch(() => undefined);
    throw codedError("private_manifest_update_failed");
  }
  await assertPrivateFile(path);
  return next;
}

async function createPrivateDirectory(rootDir, directory) {
  const tempRoot = join(rootDir, ".temp");
  try {
    const parent = await lstat(tempRoot);
    if (parent.isSymbolicLink() || !parent.isDirectory()) throw codedError("private_directory_parent_invalid");
  } catch (error) {
    if (error?.code === "ENOENT") await mkdir(tempRoot, { mode: MODE_DIRECTORY });
    else if (error?.code === "private_directory_parent_invalid") throw error;
    else throw codedError("private_directory_parent_invalid");
  }
  try { await mkdir(directory, { mode: MODE_DIRECTORY }); } catch { throw codedError("private_directory_create_failed"); }
  await assertPrivateDirectory(directory);
}

async function inspectPrivateDirectory(directory, { allowMissing }) {
  const parentPath = dirname(directory);
  try {
    const parent = await lstat(parentPath);
    if (parent.isSymbolicLink() || !parent.isDirectory()) throw codedError("private_directory_parent_invalid");
  } catch (error) {
    if (error?.code === "ENOENT" && allowMissing) return "missing";
    if (error?.code === "private_directory_parent_invalid") throw error;
    throw codedError("private_directory_parent_invalid");
  }
  try {
    const stat = await lstat(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw codedError("private_directory_invalid");
    assertOwnerAndMode(stat, MODE_DIRECTORY, "private_directory_permissions_invalid");
    return "present";
  } catch (error) {
    if (error?.code === "ENOENT" && allowMissing) return "missing";
    if (error?.code?.startsWith?.("private_")) throw error;
    throw codedError("private_directory_invalid");
  }
}

async function assertPrivateDirectory(directory) {
  await inspectPrivateDirectory(directory, { allowMissing: false });
}

async function assertPrivateFile(path) {
  let stat;
  try { stat = await lstat(path); } catch { throw codedError("private_file_missing"); }
  if (stat.isSymbolicLink() || !stat.isFile()) throw codedError("private_file_invalid");
  assertOwnerAndMode(stat, MODE_FILE, "private_file_permissions_invalid");
}

function assertOwnerAndMode(stat, expectedMode, code) {
  const uid = process.getuid?.();
  if ((uid !== undefined && stat.uid !== uid) || (stat.mode & 0o777) !== expectedMode) throw codedError(code);
}

async function createExclusivePrivateFile(path, contents) {
  let handle;
  let created = false;
  try {
    handle = await open(path, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | (fsConstants.O_NOFOLLOW ?? 0), MODE_FILE);
    created = true;
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } catch {
    if (created) await unlink(path).catch(() => undefined);
    throw codedError("private_file_create_failed");
  } finally {
    await handle?.close().catch(() => undefined);
  }
  await assertPrivateFile(path);
}

async function loadCredentials(path) {
  await assertPrivateFile(path);
  try {
    const value = JSON.parse(await readFile(path, "utf8"));
    if (!isStrictCredentials(value)) throw codedError("private_credentials_invalid");
    return value;
  } catch (error) {
    if (error?.code === "private_credentials_invalid") throw error;
    throw codedError("private_credentials_invalid");
  }
}

export function safeQ13ErrorCode(error) {
  const code = error?.code;
  return SAFE_ERROR_CODES.has(code) ? code : "q13_operation_failed";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  runQ13LocalActor(command).then((result) => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }).catch((error) => {
    process.stderr.write(`${JSON.stringify({ status: "blocked", reason: safeQ13ErrorCode(error) })}\n`);
    process.exitCode = 1;
  });
}

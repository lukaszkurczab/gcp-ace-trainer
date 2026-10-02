import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BINDING_PATH = "/private/tmp/aud08-owned-fixture-binding.json";
const PROJECT_ID = "patternly-app-sandbox";
const AUTH_EMULATOR_HOST = "127.0.0.1:19099";
const MAX_PRIVATE_FILE_SIZE = 16 * 1024;

class SafeRefusal extends Error {
  constructor(stage, reason) {
    super("safe_refusal");
    this.stage = stage;
    this.reason = reason;
  }
}

function refuse(stage, reason) {
  throw new SafeRefusal(stage, reason);
}

function readPrivateJson(filePath, stage, { bindingFile = false } = {}) {
  if (!path.isAbsolute(filePath)) refuse(stage, "PATH_REFUSED");
  let before;
  let parent;
  try {
    before = fs.lstatSync(filePath);
    parent = fs.lstatSync(path.dirname(filePath));
  } catch {
    refuse(stage, "FILE_UNAVAILABLE");
  }
  const privateParent = bindingFile && path.dirname(filePath) === "/private/tmp";
  if (!parent.isDirectory() || parent.isSymbolicLink()
    || (!privateParent && (parent.uid !== process.getuid() || (parent.mode & 0o777) !== 0o700))
    || !before.isFile() || before.isSymbolicLink() || before.uid !== process.getuid() || before.nlink !== 1
    || (before.mode & 0o777) !== 0o600 || before.size > MAX_PRIVATE_FILE_SIZE) {
    refuse(stage, "FILE_REFUSED");
  }

  let descriptor;
  try {
    descriptor = fs.openSync(filePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile() || opened.uid !== process.getuid() || opened.nlink !== 1 || (opened.mode & 0o777) !== 0o600
      || opened.ino !== before.ino || opened.dev !== before.dev || opened.size !== before.size
      || opened.mtimeMs !== before.mtimeMs || opened.ctimeMs !== before.ctimeMs) refuse(stage, "FILE_CHANGED");
    const contents = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor);
    const current = fs.lstatSync(filePath);
    const identityMatches = (stat) => stat.ino === opened.ino && stat.dev === opened.dev && stat.size === opened.size
      && stat.mtimeMs === opened.mtimeMs && stat.ctimeMs === opened.ctimeMs;
    if (!identityMatches(after) || !identityMatches(current)) refuse(stage, "FILE_CHANGED");
    try {
      const parsed = JSON.parse(contents.toString("utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) refuse(stage, "JSON_REFUSED");
      return parsed;
    } catch (error) {
      if (error instanceof SafeRefusal) throw error;
      refuse(stage, "JSON_REFUSED");
    }
  } catch (error) {
    if (error instanceof SafeRefusal) throw error;
    refuse(stage, "FILE_READ_FAILED");
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function validateBinding(binding) {
  if (typeof binding.uid !== "string" || binding.uid.length < 1 || binding.uid.length > 128
    || typeof binding.credentialPath !== "string" || !path.isAbsolute(binding.credentialPath)) {
    refuse("BINDING_VALIDATE", "BINDING_INVALID");
  }
  return Object.freeze({ uid: binding.uid, credentialPath: binding.credentialPath });
}

function validateCredentials(credentials) {
  if (typeof credentials.alias !== "string" || credentials.alias.trim().length === 0 || credentials.alias.length > 160
    || typeof credentials.email !== "string" || credentials.email.trim().length === 0 || credentials.email.length > 254
    || typeof credentials.password !== "string" || credentials.password.length < 8 || credentials.password.length > 1024) {
    refuse("CREDENTIALS_VALIDATE", "CREDENTIALS_INVALID");
  }
  return Object.freeze({ alias: credentials.alias, email: credentials.email, password: credentials.password });
}

async function restoreOwnedAuthFixture() {
  let stage = "BINDING_READ";
  let app;
  try {
    if (process.argv.length !== 2) refuse("ARGUMENTS", "ARGUMENTS_REFUSED");
    const binding = validateBinding(readPrivateJson(BINDING_PATH, stage, { bindingFile: true }));
    stage = "CREDENTIALS_READ";
    const credentials = validateCredentials(readPrivateJson(binding.credentialPath, stage));

    // Fix the SDK target before creating an Admin app. Never inherit a caller-selected project or host.
    process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
    stage = "ADMIN_LOAD";
    const backendRequire = createRequire(path.join(ROOT, "../patternly-backend/package.json"));
    const { initializeApp, deleteApp } = backendRequire("firebase-admin/app");
    const { getAuth } = backendRequire("firebase-admin/auth");

    stage = "EMULATOR_CONNECT";
    app = initializeApp({ projectId: PROJECT_ID }, `aud08-owned-auth-restore-${process.pid}`);
    const auth = getAuth(app);
    let user;
    stage = "EXACT_UID_LOOKUP";
    try {
      user = await auth.getUser(binding.uid);
    } catch (error) {
      if (error?.code !== "auth/user-not-found") refuse(stage, "AUTH_LOOKUP_FAILED");
      stage = "CREATE_EXACT_UID";
      try {
        await auth.createUser({ uid: binding.uid, email: credentials.email, password: credentials.password });
      } catch {
        // An ambiguous creation result is never retried here. A later invocation must start with exact-UID lookup.
        refuse(stage, "CREATE_UNVERIFIED");
      }
      stage = "VERIFY_CREATED_UID";
      try {
        user = await auth.getUser(binding.uid);
      } catch {
        refuse(stage, "CREATION_READBACK_FAILED");
      }
      if (user.uid !== binding.uid || user.email !== credentials.email || user.disabled === true) {
        refuse(stage, "CREATION_READBACK_MISMATCH");
      }
      stage = "CREATED_VERIFIED";
    }

    if (user.uid !== binding.uid) refuse(stage, "UID_MISMATCH");
    if (user.email !== credentials.email) refuse(stage, "EMAIL_MISMATCH");
    if (user.disabled === true) refuse(stage, "ACCOUNT_DISABLED");
    if (stage === "EXACT_UID_LOOKUP") stage = "EXISTING_VERIFIED";

    console.log(JSON.stringify({ status: "VERIFIED", stage, exactUid: true, emailMatches: true, enabled: true, project: PROJECT_ID, authEmulator: AUTH_EMULATOR_HOST }));
    await deleteApp(app);
    app = undefined;
  } catch (error) {
    const safeError = error instanceof SafeRefusal ? error : new SafeRefusal(stage, "EMULATOR_OR_ADMIN_FAILED");
    console.log(JSON.stringify({ status: "REFUSED", stage: safeError.stage, reason: safeError.reason }));
    process.exitCode = 1;
  } finally {
    if (app) {
      try {
        const backendRequire = createRequire(path.join(ROOT, "../patternly-backend/package.json"));
        await backendRequire("firebase-admin/app").deleteApp(app);
      } catch {
        // Cleanup details can contain provider errors; they are intentionally not emitted.
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await restoreOwnedAuthFixture();
}

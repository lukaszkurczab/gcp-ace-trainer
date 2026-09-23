import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const PROFILE_NAMES = Object.freeze(["smoke", "sandbox"]);
const SMOKE_PROJECT_ID = "patternly-app-sandbox";
const SMOKE_REQUIRED_KEYS = Object.freeze([
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID",
  "EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID",
  "EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID",
]);
const LOCAL_OVERRIDE_KEYS = Object.freeze([
  "EXPO_PUBLIC_PATTERNLY_BACKEND_E2E",
  "EXPO_PUBLIC_PATTERNLY_API_ORIGIN",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN",
  "EXPO_PUBLIC_PATTERNLY_E2E_EMAIL",
  "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD",
  "EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN",
]);
const ACTIONS = Object.freeze({
  start: ["start", "--localhost"],
  web: ["start", "--web", "--localhost"],
  ios: ["run:ios"],
  android: ["run:android"],
});

export function parseDotenv(source) {
  const result = {};
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line);
    if (!match) throw new Error("Local profile contains an invalid dotenv assignment.");
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    result[match[1]] = value;
  }
  return Object.freeze(result);
}

export function isLoopbackHttpOrigin(value) {
  try {
    const origin = new URL(value);
    return origin.protocol === "http:" && origin.hostname === "127.0.0.1" && origin.pathname === "/" && origin.search === "" && origin.hash === "";
  } catch {
    return false;
  }
}

export function validateLocalProfile(profile, environment) {
  if (!PROFILE_NAMES.includes(profile)) throw new Error(`Unknown local profile ${profile}.`);
  if (environment.PATTERNLY_RUNTIME_MODE !== profile || environment.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE !== profile) {
    throw new Error(`${profile} profile must set matching PATTERNLY_RUNTIME_MODE and EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE.`);
  }
  if (profile === "smoke") {
    for (const key of SMOKE_REQUIRED_KEYS) {
      if (typeof environment[key] !== "string" || environment[key].trim() === "") {
        throw new Error(`smoke profile requires ${key} before Expo starts.`);
      }
    }
    if (environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID !== SMOKE_PROJECT_ID) {
      throw new Error(`smoke profile requires EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID=${SMOKE_PROJECT_ID}.`);
    }
    const localAppCheckToken = environment.EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN;
    if (localAppCheckToken && (!/^[a-f0-9]{64}$/u.test(localAppCheckToken)
      || environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID !== SMOKE_PROJECT_ID)) {
      throw new Error("smoke local App Check requires the generated token and matching emulator project.");
    }
    if (environment.EXPO_PUBLIC_PATTERNLY_BACKEND_E2E !== "true") throw new Error("smoke profile requires EXPO_PUBLIC_PATTERNLY_BACKEND_E2E=true.");
    for (const key of ["EXPO_PUBLIC_PATTERNLY_API_ORIGIN", "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN"]) {
      if (!isLoopbackHttpOrigin(environment[key])) throw new Error(`smoke profile requires ${key} to be an http://127.0.0.1 origin.`);
    }
  }
  if (profile === "sandbox") {
    for (const key of LOCAL_OVERRIDE_KEYS) {
      if (environment[key] !== undefined && environment[key] !== "") throw new Error(`sandbox profile must not set ${key}.`);
    }
  }
  return Object.freeze({ ...environment, EXPO_NO_DOTENV: "1" });
}

export function localProfilePath(profile, repositoryRoot = process.cwd()) {
  if (!PROFILE_NAMES.includes(profile)) throw new Error(`Unknown local profile ${profile}.`);
  return resolve(repositoryRoot, `.env.${profile}.local`);
}

export async function probeSmokeAuthEmulator(
  origin,
  projectId,
  fetchImplementation = fetch,
  remediation = "start Firebase Auth emulator, then rerun npm run start:smoke",
) {
  try {
    const response = await fetchImplementation(new URL(`/emulator/v1/projects/${encodeURIComponent(projectId)}/config`, origin), {
      method: "GET", signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok || typeof (await response.json())?.signIn?.allowDuplicateEmails !== "boolean") throw new Error("unexpected response");
  } catch {
    throw new Error(`smoke auth-emulator probe failed (profile=smoke origin=${origin} action=${remediation}).`);
  }
}

export async function probeSmokeApiReady(origin, fetchImplementation = fetch, options = {}) {
  const timeoutMs = options.timeoutMs ?? 5_000;
  const delayMs = options.delayMs ?? 200;
  const deadline = Date.now() + timeoutMs;
  do {
    try {
      const response = await fetchImplementation(new URL("/ready", origin), {
        method: "GET", signal: AbortSignal.timeout(Math.max(1, Math.min(1_000, deadline - Date.now()))),
      });
      const body = await response.json();
      if (response.ok && body?.status === "ready" && ["database", "authentication", "providerReader"].every((key) => body.checks?.[key] === true)) return;
    } catch { /* A dependency may still be starting; retry until the deadline. */ }
    if (Date.now() >= deadline) break;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, Math.min(delayMs, deadline - Date.now())));
  } while (Date.now() < deadline);
  throw new Error(`smoke API is not ready (profile=smoke origin=${origin} action=start local backend and emulators, then rerun npm run start:smoke).`);
}

export async function runLocalProfile(argv = process.argv.slice(2), options = {}) {
  const [profile, action, ...extraArgs] = argv;
  if (!(action in ACTIONS)) throw new Error("Usage: runLocalProfile.mjs <smoke|sandbox> <start|web|ios|android> [Expo arguments]");
  const repositoryRoot = options.repositoryRoot ?? process.cwd();
  const profilePath = localProfilePath(profile, repositoryRoot);
  let profileEnvironment;
  try {
    profileEnvironment = parseDotenv(readFileSync(profilePath, "utf8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot load local ${profile} profile at ${profilePath}: ${reason}`);
  }
  const environment = validateLocalProfile(profile, { ...process.env, ...profileEnvironment });
  if (profile === "smoke") {
    await probeSmokeAuthEmulator(environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN, environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID, options.fetchImplementation);
    await probeSmokeApiReady(environment.EXPO_PUBLIC_PATTERNLY_API_ORIGIN, options.fetchImplementation);
  }
  const child = spawn(options.command ?? "npx", ["expo", ...ACTIONS[action], ...extraArgs], {
    cwd: repositoryRoot,
    env: environment,
    stdio: "inherit",
  });
  return await new Promise((resolveProcess, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolveProcess({ code: code ?? 1, signal }));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runLocalProfile().then(({ code }) => process.exitCode = code).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

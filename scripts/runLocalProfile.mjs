import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const PROFILE_NAMES = Object.freeze(["smoke", "sandbox"]);
const LOCAL_OVERRIDE_KEYS = Object.freeze([
  "EXPO_PUBLIC_PATTERNLY_BACKEND_E2E",
  "EXPO_PUBLIC_PATTERNLY_API_ORIGIN",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN",
  "EXPO_PUBLIC_PATTERNLY_E2E_EMAIL",
  "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD",
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
  fetchImplementation = fetch,
  remediation = "start Firebase Auth emulator, then rerun npm run start:smoke",
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);
  try {
    await fetchImplementation(new URL("/", origin), { method: "GET", signal: controller.signal });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`smoke auth-emulator probe failed (profile=smoke origin=${origin} action=${remediation}): ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
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
  if (profile === "smoke") await probeSmokeAuthEmulator(environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN, options.fetchImplementation);
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

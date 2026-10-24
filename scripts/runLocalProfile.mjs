import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

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
  "android-local": ["run:android"],
  "android-local-start": ["start", "--localhost", "--port", "8081"],
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
  let failedChecks = [];
  do {
    try {
      const response = await fetchImplementation(new URL("/ready", origin), {
        method: "GET", signal: AbortSignal.timeout(Math.max(1, Math.min(1_000, deadline - Date.now()))),
      });
      const body = await response.json();
      const coreChecks = ["database", "authentication", "providerReader"];
      failedChecks = [...coreChecks, "contentPackages"].filter((key) => body?.checks?.[key] !== true);
      const coreReady = coreChecks.every((key) => body?.checks?.[key] === true);
      if (response.status === 200 && body?.status === "ready" && coreReady && body.checks.contentPackages === true) return;
      // Smoke uses current bundled content; the production readiness gate stays strict.
      if (response.status === 503 && body?.status === "not_ready" && coreReady && body.checks.contentPackages === false) {
        console.info("Local smoke: core API ready; online content packages unavailable. Using current bundled app content.");
        return;
      }
    } catch { /* A dependency may still be starting; retry until the deadline. */ }
    if (Date.now() >= deadline) break;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, Math.min(delayMs, deadline - Date.now())));
  } while (Date.now() < deadline);
  throw new Error(`smoke API is not ready (profile=smoke origin=${origin} checks=${failedChecks.join(",") || "invalid_response_or_unreachable"} action=start local backend and emulators, then rerun npm run start:smoke).`);
}

export async function runLocalProfile(argv = process.argv.slice(2), options = {}) {
  const [profile, action, ...extraArgs] = argv;
  if (!(action in ACTIONS)) throw new Error("Usage: runLocalProfile.mjs <smoke|sandbox> <start|web|ios|android|android-local|android-local-start> [Expo arguments]");
  const isAndroidLocalAction = action === "android-local" || action === "android-local-start";
  if (action === "android-local-start" && extraArgs.length > 0) {
    throw new Error("android-local-start does not accept Expo arguments; it always starts the local packager on port 8081.");
  }
  if (isAndroidLocalAction) {
    const targetOverride = extraArgs.find((argument) => /^(?:--device|--app-id|--binary|--variant)(?:=|$)|^-d(?:=|$)/u.test(argument));
    if (targetOverride) throw new Error(`android-local does not allow the Expo target override ${targetOverride.split("=", 1)[0]}.`);
  }
  const repositoryRoot = options.repositoryRoot ?? process.cwd();
  const profilePath = localProfilePath(profile, repositoryRoot);
  let profileEnvironment;
  try {
    profileEnvironment = parseDotenv(readFileSync(profilePath, "utf8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot load local ${profile} profile at ${profilePath}: ${reason}`);
  }
  let environment = validateLocalProfile(profile, { ...process.env, ...profileEnvironment });
  if (!isAndroidLocalAction && environment.PATTERNLY_ANDROID_LOCAL_APP) {
    throw new Error("PATTERNLY_ANDROID_LOCAL_APP is reserved for the android-local action.");
  }
  if (isAndroidLocalAction) {
    if (profile !== "smoke") throw new Error("android-local requires the smoke profile.");
    if (!/^[a-f0-9]{64}$/u.test(environment.EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN ?? "")) {
      throw new Error("android-local requires EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN with 64 lowercase hex characters.");
    }
    if (!environment.ANDROID_SERIAL || environment.ANDROID_SERIAL.trim() !== environment.ANDROID_SERIAL) {
      throw new Error("android-local requires ANDROID_SERIAL so endpoint forwarding targets exactly one connected Android device.");
    }
    if (!environment.ANDROID_HOME) throw new Error("android-local requires ANDROID_HOME to locate ADB.");
    if (action === "android-local-start" && (environment.EXPO_PUBLIC_PATTERNLY_API_ORIGIN !== "http://127.0.0.1:8080"
      || environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN !== "http://127.0.0.1:19099")) {
      throw new Error("android-local-start requires the local API on port 8080 and Auth emulator on port 19099.");
    }
    environment = Object.freeze({ ...environment, EAS_BUILD_PLATFORM: "android", PATTERNLY_ANDROID_LOCAL_APP: "true", REACT_NATIVE_PACKAGER_HOSTNAME: "127.0.0.1" });
    assertExistingAndroidTreeIsLocal(repositoryRoot);
  }
  await (options.prepareCurrentContent ?? (() => prepareCurrentContent(repositoryRoot)))();
  if (profile === "smoke") {
    await probeSmokeAuthEmulator(environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN, environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID, options.fetchImplementation);
    await probeSmokeApiReady(environment.EXPO_PUBLIC_PATTERNLY_API_ORIGIN, options.fetchImplementation);
  }
  let androidDeviceName;
  if (isAndroidLocalAction) {
    androidDeviceName = resolveAndroidLocalDeviceName(environment, options);
    ensureAndroidLocalLoopbackAccess(environment, options, action === "android-local-start" ? [8081, 8080, 19099, 18081] : undefined);
  }
  const actionArguments = [
    ...ACTIONS[action],
    ...(action === "android-local" ? ["--device", androidDeviceName] : []),
    ...extraArgs,
  ];
  const child = (options.spawn ?? spawn)(options.command ?? "npx", ["expo", ...actionArguments], {
    cwd: repositoryRoot,
    env: environment,
    stdio: "inherit",
  });
  return await new Promise((resolveProcess, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolveProcess({ code: code ?? 1, signal }));
  });
}

function assertExistingAndroidTreeIsLocal(repositoryRoot) {
  const androidRoot = resolve(repositoryRoot, "android");
  if (!existsSync(androidRoot)) return;
  const reject = (reason) => {
    throw new Error(`android-local refused the existing Android native tree (${reason}). Preserve that tree, regenerate Android only from the local smoke profile, then retry npm run android:local.`);
  };
  const gradlePath = resolve(androidRoot, "app", "build.gradle");
  const manifestPath = resolve(androidRoot, "app", "src", "main", "AndroidManifest.xml");
  let gradle;
  let manifest;
  try {
    gradle = readFileSync(gradlePath, "utf8");
    manifest = readFileSync(manifestPath, "utf8");
  } catch {
    reject("unsupported or incomplete generated project files");
  }
  const declaresExactly = (source, key, value) => {
    const declarations = source.match(new RegExp(`^\\s*${key}\\b[^\\r\\n]*$`, "gmu")) ?? [];
    const declaration = declarations.length === 1
      ? new RegExp(`^\\s*${key}\\s+(['"])([^'"]+)\\1\\s*$`, "u").exec(declarations[0])
      : null;
    return declaration?.[2] === value;
  };
  if (!declaresExactly(gradle, "namespace", "com.lkurczab.patternly.local")) reject("namespace is not the exact local Android identity");
  if (!declaresExactly(gradle, "applicationId", "com.lkurczab.patternly.local")) reject("applicationId is not the exact local Android identity");
  const schemes = [...manifest.matchAll(/\bandroid:scheme\s*=\s*["']([^"']+)["']/gu)].map((match) => match[1]);
  if (!schemes.includes("com.lkurczab.patternly.local") || schemes.includes("com.lkurczab.patternly")) reject("manifest does not declare only the local app scheme");
  if (containsGoogleServicesJson(androidRoot)) reject("a native google-services.json is present");
}

function containsGoogleServicesJson(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "google-services.json") return true;
    if (entry.isDirectory() && !["build", ".cxx", ".gradle"].includes(entry.name)
      && containsGoogleServicesJson(resolve(directory, entry.name))) return true;
  }
  return false;
}

function resolveAndroidLocalDeviceName(environment, options = {}) {
  // Use the installed Expo CLI's own inventory: --device resolves names, not ADB serials.
  const require = createRequire(import.meta.url);
  const expoRequire = createRequire(require.resolve("expo/package.json"));
  const inventoryPath = resolve(dirname(expoRequire.resolve("@expo/cli/package.json")), "build/src/start/platforms/android/getDevices.js");
  const result = (options.spawnSync ?? spawnSync)(process.execPath, ["-e",
    "require(process.argv[1]).getDevicesAsync().then(devices => process.stdout.write(JSON.stringify(devices))).catch(() => process.exit(1))", inventoryPath,
  ], { encoding: "utf8", env: environment });
  let devices;
  try { devices = JSON.parse(result.stdout); } catch { /* Report only the safe stage below. */ }
  if (result.error || result.status !== 0 || !Array.isArray(devices)) throw new Error("android-local Expo device inventory failed.");
  const selected = devices.filter((device) => device.pid === environment.ANDROID_SERIAL);
  if (selected.length !== 1 || !selected[0].isAuthorized || !selected[0].isBooted || !selected[0].name) {
    throw new Error("android-local selected serial is not one authorized, booted Expo device.");
  }
  if (devices.filter((device) => device.name === selected[0].name).length !== 1) {
    throw new Error("android-local selected Expo device name is ambiguous; disconnect other devices with the same name.");
  }
  return selected[0].name;
}

function ensureAndroidLocalLoopbackAccess(environment, options = {}, requiredPorts) {
  const serial = environment.ANDROID_SERIAL;
  if (!serial || serial.trim() !== serial) throw new Error("android-local requires ANDROID_SERIAL so endpoint forwarding targets exactly one connected Android device.");
  const sdkRoot = environment.ANDROID_HOME;
  if (!sdkRoot) throw new Error("android-local requires ANDROID_HOME to locate ADB.");
  const adb = resolve(sdkRoot, "platform-tools", "adb");
  const run = options.spawnSync ?? spawnSync;
  const execute = (args, stage) => {
    const result = run(adb, ["-s", serial, ...args], { encoding: "utf8" });
    if (result.error || result.status !== 0) throw new Error(`android-local ${stage} failed for the selected device.`);
    return result.stdout ?? "";
  };
  if (execute(["get-state"], "device check").trim() !== "device") throw new Error("android-local selected device is not online.");
  const mappings = execute(["reverse", "--list"], "reverse-map check")
    .split(/\r?\n/u)
    .map((line) => line.trim().split(/\s+/u).slice(-2))
    .filter((parts) => parts.length === 2 && parts[0].startsWith("tcp:") && parts[1].startsWith("tcp:"));
  const activeMappings = [...mappings];
  const ports = requiredPorts ?? [environment.EXPO_PUBLIC_PATTERNLY_API_ORIGIN, environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN]
    .map(originValue => Number(new URL(originValue).port || "80"));
  if (!Array.isArray(ports) || ports.some(port => !Number.isInteger(port) || port < 1 || port > 65535) || new Set(ports).size !== ports.length) {
    throw new Error("android-local endpoint forwarding configuration is invalid.");
  }
  const missingPorts = [];
  for (const port of ports) {
    const deviceEndpoint = `tcp:${port}`;
    const existing = activeMappings.filter(([devicePort]) => devicePort === deviceEndpoint);
    if (existing.some(([, hostPort]) => hostPort !== deviceEndpoint)) {
      throw new Error(`android-local found a conflicting ADB reverse mapping for ${deviceEndpoint} on the selected device.`);
    }
    if (existing.length === 0) missingPorts.push(deviceEndpoint);
  }
  for (const deviceEndpoint of missingPorts) {
    execute(["reverse", deviceEndpoint, deviceEndpoint], "loopback forwarding setup");
    activeMappings.push([deviceEndpoint, deviceEndpoint]);
  }
}

function prepareCurrentContent(repositoryRoot) {
  return new Promise((resolvePreparation, rejectPreparation) => {
    const child = spawn(process.execPath, [resolve(repositoryRoot, "scripts/syncBundledContentRelease.mjs"), "sync"], {
      cwd: repositoryRoot,
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", rejectPreparation);
    child.once("exit", (code, signal) => code === 0
      ? resolvePreparation()
      : rejectPreparation(new Error(`Current content sync failed before Expo start (exit=${code ?? "signal"}, signal=${signal ?? "none"}).`)));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runLocalProfile().then(({ code }) => process.exitCode = code).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

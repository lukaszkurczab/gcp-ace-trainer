import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { AUD02D_CUSTOM_PRACTICE, AUD02D_ENTITLEMENT_SUITES, AUD02D_FEEDBACK_REFERENCES, AUD02D_TRACK_IDS, AUD02D_UDID, canonicalHash, hash, readAud02dBindings } from "./aud02dMatrix.mjs";
import { createGenerationPinnedSmokeSession, safeHttpErrorCode } from "./aud02dAuthEvidence.mjs";
import { validateAud02dExpoManifest } from "./aud02dExpoManifest.mjs";
import { parseDotenv, validateLocalProfile } from "./runLocalProfile.mjs";
import { waitForContentPreparationState } from "./waitForContentPreparationState.mjs";

const APP_ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const CONTENT_ROOT = path.resolve(process.env.PATTERNLY_CONTENT_ROOT ?? path.resolve(APP_ROOT, "../patternly-content"));
const BACKEND_ROOT = path.resolve(APP_ROOT, "../patternly-backend");
const APP_ID = "com.lkurczab.patternly";
const METRO_PORT = 8081;
const METRO_ORIGIN = `http://[::1]:${METRO_PORT}`;
const DEV_CLIENT_URL = `exp+patternly://expo-development-client/?url=${encodeURIComponent(METRO_ORIGIN)}`;
const OUTPUT_ROOT = required("MAESTRO_TEST_OUTPUT_DIR");
const [flag, suppliedUdid] = process.argv.slice(2);
if (flag !== "--udid" || suppliedUdid?.toUpperCase() !== AUD02D_UDID) throw new Error(`Usage: MAESTRO_TEST_OUTPUT_DIR=<directory> node scripts/runAud02dIos.mjs --udid ${AUD02D_UDID}`);
await mkdir(OUTPUT_ROOT, { recursive: true });
let activeCaseDirectory = OUTPUT_ROOT;
let activeCaseRecord;
const manifest = { schemaVersion: "patternly-aud02d-local-rc-v1", udid: AUD02D_UDID, cases: [] };
let bindings;
let baselineRepos;
let nativeApp;
let credentials;
let smokeEnvironment;
let metro;
let expoManifest;
let sharedBackend;
let failed = false;

try {
  bindings = await readAud02dBindings(APP_ROOT, CONTENT_ROOT);
  baselineRepos = await repositoryState();
  assertSimulatorAndInstall();
  nativeApp = nativeAppIdentity();
  smokeEnvironment = loadSmokeEnvironment();
  credentials = Object.fromEntries(["EXPO_PUBLIC_PATTERNLY_E2E_EMAIL", "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD"].map((key) => [key, smokeEnvironment[key]]));
  if (Object.values(credentials).some((value) => typeof value !== "string" || !value.trim())) throw new Error(".env.smoke.local must define the local E2E account credentials.");
  Object.assign(manifest, { candidateId: bindings.candidateId, appLockSha256: bindings.appLockSha256, bundledContentLockSha256: bindings.bundledContentLockSha256, contentBindings: bindings.contentBindings, nativeApp, repositories: baselineRepos });
  await writeManifest();
  metro = await startOwnedMetro();
  expoManifest = await fetchExpoManifest();
  manifest.metro = { manifestUrl: METRO_ORIGIN, responseIdentity: expoManifest.responseIdentity, runtimeVersion: expoManifest.runtimeVersion, launchAsset: expoManifest.launchAsset };
  sharedBackend = startBackend("active");
  const sharedBackendReady = await waitForBackendReady(sharedBackend);
  const sharedAuth = await smokeAuthContext();
  const sharedObservation = await readBackendEvidence(sharedAuth);
  if (!sharedObservation || sharedObservation.entitlement.state !== "active") throw new Error("The AUD-02D shared backend did not expose observed active Premium entitlement before runtime cases.");
  manifest.sharedBackend = { startupReadiness: sharedBackendReady, startupEntitlement: sharedObservation };
  await writeManifest();
  await launchBundledApp();
  for (const trackId of AUD02D_TRACK_IDS) {
    await runCase(`track-readiness-${trackId}`, {
      trackId,
      flows: [".maestro/aud02d-track-readiness.yaml"],
    }, async () => maestro(".maestro/aud02d-track-readiness.yaml", { TRACK_ID: trackId }));
  }

  for (const selection of AUD02D_CUSTOM_PRACTICE) {
    const feedbackTimingId = selection.feedbackTiming === "afterEachAnswer" ? "after-each-answer" : "at-session-end";
    await runCase(`custom-${selection.length}-${selection.feedbackTiming}`, {
      selection,
      flows: [".maestro/aud02d-custom-practice-configuration.yaml"],
    }, async () => {
      await resetState();
      await ensureTrack("coding-interview-dsa-problem-solving");
      await maestro(".maestro/aud02d-custom-practice-configuration.yaml", { LENGTH: selection.length, FEEDBACK_TIMING: feedbackTimingId, FEEDBACK_TIMING_ID: feedbackTimingId });
      await resetState();
    });
  }

  for (const flow of AUD02D_FEEDBACK_REFERENCES) {
    const feedbackTiming = flow.includes("after-each-answer") ? "after-each-answer" : "at-session-end";
    await runCase(`feedback-${path.basename(flow, ".yaml")}`, { flows: [flow], feedbackTiming }, async () => {
      await resetState();
      await ensureTrack("coding-interview-dsa-problem-solving");
      await maestro(flow, { FEEDBACK_TIMING: feedbackTiming });
      await resetState();
    });
  }

  await stopBackend(sharedBackend);
  sharedBackend = undefined;
  await waitForPortAvailable();

  for (const suite of AUD02D_ENTITLEMENT_SUITES) {
    await runCase(`premium-suite-${suite.id}`, {
      tracks: suite.tracks,
      flows: [suite.free, ...suite.premiumFlows],
    }, async () => {
      if (suite.id === "exam") await runExamFreeAndPremium(activeCaseRecord, suite);
      else await runObservedNode(path.resolve(APP_ROOT, suite.premiumRunner), ["--udid", AUD02D_UDID], caseEnvironment(), activeCaseRecord, suite.flows);
    });
  }
} catch (error) {
  failed = true;
  manifest.failure = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  manifest.finishedAt = new Date().toISOString();
  manifest.finalCanonicalSha256 = canonicalHash({ ...manifest, finalCanonicalSha256: undefined });
  await writeFile(path.join(OUTPUT_ROOT, "aud02d-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  try { if (sharedBackend) await stopBackend(sharedBackend); }
  finally { if (metro) await stopMetro(metro); }
  if (failed) process.exitCode = 1;
}

async function runCase(id, inputs, execute) {
  const caseDirectory = path.join(OUTPUT_ROOT, "cases", id.replace(/[^a-zA-Z0-9._-]/gu, "-"));
  await mkdir(caseDirectory, { recursive: true });
  const artifactsBefore = await inventoryArtifacts(caseDirectory);
  let before;
  try { before = await caseSnapshot(); }
  catch (error) {
    const record = {
      id,
      inputs,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      result: "BLOCKED",
      preflightError: error instanceof Error ? error.message : String(error),
      artifactDirectory: caseDirectory,
      artifactsBefore,
      artifactsAfter: await inventoryArtifacts(caseDirectory),
      artifactPaths: [],
    };
    manifest.cases.push(record);
    await writeManifest();
    throw error;
  }
  const record = { id, inputs, startedAt: new Date().toISOString(), before, artifactDirectory: caseDirectory, artifactsBefore, maestroExecutions: [], runnerExecutions: [], backendObservations: [], entitlementTransitions: [] };
  manifest.cases.push(record);
  await writeManifest();
  activeCaseDirectory = caseDirectory;
  activeCaseRecord = record;
  try {
    if (sharedBackend) {
      const observation = await readBackendEvidence(await smokeAuthContext());
      if (!observation || observation.entitlement.state !== "active") throw new Error(`AUD-02D shared active backend is unavailable before case ${id}.`);
      observation.phase = "shared-active-case-start";
      record.backendObservations.push(observation);
      record.entitlementTransitions.push({ observedAt: observation.observedAt, phase: observation.phase, state: observation.entitlement.state, source: observation.entitlement.source });
    }
    await execute(record);
    const after = await caseSnapshot();
    record.finishedAt = new Date().toISOString();
    record.after = after;
    record.artifactsAfter = await inventoryArtifacts(caseDirectory);
    record.artifactPaths = record.artifactsAfter.filter(({ path: artifactPath }) => !artifactsBefore.some((prior) => prior.path === artifactPath)).map(({ path: artifactPath }) => artifactPath);
    if (record.artifactPaths.length === 0) throw new Error(`AUD-02D case ${id} created no evidence artifacts under ${caseDirectory}.`);
    record.result = before.launchAssetSha256 === after.launchAssetSha256 ? "PASS" : "FAIL";
    if (record.result !== "PASS") throw new Error(`AUD-02D case ${id} changed Expo launchAsset bytes (${before.launchAssetSha256} -> ${after.launchAssetSha256}).`);
  } catch (error) {
    record.finishedAt = new Date().toISOString();
    record.result = "FAIL";
    record.error = error instanceof Error ? error.message : String(error);
    try { record.after = await caseSnapshot(); } catch (snapshotError) { record.afterError = snapshotError instanceof Error ? snapshotError.message : String(snapshotError); }
    record.artifactsAfter = await inventoryArtifacts(caseDirectory);
    record.artifactPaths = record.artifactsAfter.map(({ path: artifactPath }) => artifactPath);
    await writeManifest();
    throw error;
  } finally {
    activeCaseDirectory = OUTPUT_ROOT;
    activeCaseRecord = undefined;
  }
  await writeManifest();
}

async function caseSnapshot() {
  const repos = await repositoryState();
  for (const role of ["app", "content"]) {
    const expected = baselineRepos[role];
    if (repos[role].head !== expected.head || repos[role].branch !== expected.branch || repos[role].upstream !== expected.upstream || repos[role].dirty || repos[role].ahead !== 0 || repos[role].behind !== 0) throw new Error(`AUD-02D ${role} checkout changed or diverged during the RC.`);
  }
  assertSimulatorAndInstall();
  const app = nativeAppIdentity();
  if (canonicalHash(app) !== canonicalHash(nativeApp)) throw new Error("AUD-02D native app identity changed during the RC.");
  const currentManifest = await fetchExpoManifest();
  if (canonicalHash(currentManifest) !== canonicalHash(expoManifest)) throw new Error("AUD-02D Expo manifest identity or launchAsset changed during RC.");
  const bundle = await fetchBundle(currentManifest.launchAsset.url);
  const currentBindings = await readAud02dBindings(APP_ROOT, CONTENT_ROOT);
  if (canonicalHash(currentBindings) !== canonicalHash(bindings)) throw new Error("AUD-02D candidate, content lock, or admission evidence bytes changed during RC.");
  return { capturedAt: new Date().toISOString(), repositories: repos, app, candidateId: bindings.candidateId, appLockSha256: bindings.appLockSha256, bundledContentLockSha256: bindings.bundledContentLockSha256, contentBindings: bindings.contentBindings, expoManifestIdentity: currentManifest.responseIdentity, launchAssetUrl: currentManifest.launchAsset.url, launchAssetSha256: hash(bundle), launchAssetBytes: bundle.byteLength };
}

async function repositoryState() {
  const state = {};
  for (const [role, root, branch] of [["app", APP_ROOT, "main"], ["content", CONTENT_ROOT, "master"]]) {
    const currentBranch = git(root, ["branch", "--show-current"]).trim();
    const upstream = git(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]).trim();
    const status = git(root, ["status", "--porcelain=v1"]).trim();
    const head = git(root, ["rev-parse", "HEAD"]).trim();
    const [ahead, behind] = git(root, ["rev-list", "--left-right", "--count", `${upstream}...HEAD`]).trim().split(/\s+/u).map(Number);
    if (currentBranch !== branch || upstream !== `origin/${branch}` || status || ahead !== 0 || behind !== 0) throw new Error(`AUD-02D requires ${role} on clean ${branch} exactly at ${upstream}.`);
    state[role] = { root, branch: currentBranch, upstream, head, dirty: Boolean(status), ahead, behind };
  }
  return state;
}

function assertSimulatorAndInstall() {
  const payload = JSON.parse(run("xcrun", ["simctl", "list", "devices", "available", "--json"]));
  const booted = Object.values(payload.devices ?? {}).flat().filter((device) => device.state === "Booted");
  if (booted.length !== 1 || booted[0]?.udid?.toUpperCase() !== AUD02D_UDID || booted[0]?.name !== "iPhone 17" || booted[0]?.deviceTypeIdentifier !== "com.apple.CoreSimulator.SimDeviceType.iPhone-17") throw new Error(`AUD-02D requires only the existing booted iPhone 17 (${AUD02D_UDID}).`);
  run("xcrun", ["simctl", "get_app_container", AUD02D_UDID, APP_ID, "app"]);
}

function nativeAppIdentity() {
  const container = run("xcrun", ["simctl", "get_app_container", AUD02D_UDID, APP_ID, "app"]).trim();
  const plist = path.join(container, "Info.plist");
  const bundleId = run("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleIdentifier", plist]).trim();
  const version = run("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleShortVersionString", plist]).trim();
  const build = run("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleVersion", plist]).trim();
  if (bundleId !== APP_ID) throw new Error(`Installed iOS bundle ID was ${bundleId}, expected ${APP_ID}.`);
  return { bundleId, version, build, container };
}

async function startOwnedMetro() {
  const listener = listenerPid();
  if (listener) {
    const info = listenerInfo(listener);
    const isKnownMetro = info.cwd === APP_ROOT
      && /expo/u.test(info.command)
      && info.command.includes("start")
      && info.command.includes("--localhost")
      && info.command.includes("--no-dev")
      && info.command.includes("--minify")
      && info.command.includes(String(METRO_PORT));
    if (!isKnownMetro) throw new Error(`AUD-02D port ${METRO_PORT} is occupied by an unverified process (pid ${listener}); refusing to stop it.`);
    process.kill(listener, "SIGTERM");
    await waitPortClosed();
  }
  const child = spawn("npx", ["expo", "start", "--localhost", "--no-dev", "--minify", "--port", String(METRO_PORT)], { cwd: APP_ROOT, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"], env: smokeEnvironment });
  child.stdout.setEncoding("utf8").on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.setEncoding("utf8").on("data", (chunk) => process.stderr.write(chunk));
  try { await waitForMetro(child); return child; }
  catch (error) { await stopMetro(child); throw error; }
}

function listenerPid() {
  const result = spawnSync("lsof", ["-nP", `-iTCP:${METRO_PORT}`, "-sTCP:LISTEN", "-t"], { encoding: "utf8" });
  if (result.status === 1) return null;
  if (result.status !== 0) throw new Error("Could not verify the current Metro listener.");
  const pids = result.stdout.trim().split(/\s+/u).filter(Boolean);
  if (pids.length > 1) throw new Error(`AUD-02D found multiple listeners on ${METRO_PORT}; refusing to stop them.`);
  return pids[0] ? Number(pids[0]) : null;
}

function listenerInfo(pid) {
  const command = run("ps", ["-p", String(pid), "-o", "command="]).trim();
  const cwdOutput = run("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"]);
  const cwd = cwdOutput.split("\n").find((line) => line.startsWith("n"))?.slice(1) ?? "";
  return { command, cwd };
}

async function waitForMetro(child) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error("Owned Patternly Metro exited before bundle readiness.");
    try { expoManifest = await fetchExpoManifest(); await fetchBundle(expoManifest.launchAsset.url); return; } catch { await delay(500); }
  }
  throw new Error("Owned Patternly Metro did not serve the iOS bundle within 90000ms.");
}

async function stopMetro(child) {
  if (process.platform === "win32") child.kill("SIGTERM");
  else if (child.pid) { try { process.kill(-child.pid, "SIGTERM"); } catch (error) { if (error?.code !== "ESRCH") throw error; } }
  await waitForMetroPortAvailable();
}

async function waitForMetroPortAvailable(timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  do { if (!listenerPid()) return; await delay(100); } while (Date.now() < deadline);
  throw new Error(`Owned AUD-02D Metro did not stop on port ${METRO_PORT}.`);
}

async function waitPortClosed(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!listenerPid()) return;
    await delay(100);
  }
  throw new Error(`Known Patternly Metro listener did not stop on port ${METRO_PORT}.`);
}

async function fetchExpoManifest() {
  const response = await fetch(`${METRO_ORIGIN}/`, { headers: { "expo-platform": "ios", accept: "application/expo+json, application/json" }, signal: AbortSignal.timeout(5000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new Error(`Expo iOS manifest fetch failed with HTTP ${response.status}.`);
  let body;
  try { body = JSON.parse(bytes.toString("utf8")); }
  catch { throw new Error("Expo iOS manifest response was not valid JSON."); }
  const validated = validateAud02dExpoManifest(body, `${METRO_ORIGIN}/`, METRO_PORT);
  return {
    ...validated,
    responseIdentity: {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      etag: response.headers.get("etag"),
      sha256: hash(bytes),
    },
  };
}

async function fetchBundle(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok || bytes.byteLength < 1000 || !(response.headers.get("content-type") ?? "").includes("javascript")) throw new Error(`Metro iOS bundle fetch failed with HTTP ${response.status}.`);
  return bytes;
}

async function launchBundledApp() {
  run("xcrun", ["simctl", "terminate", AUD02D_UDID, APP_ID], { allowFailure: true });
  run("xcrun", ["simctl", "openurl", AUD02D_UDID, DEV_CLIENT_URL]);
  await maestro(".maestro/rc-auth-preflight.yaml", credentials);
  await waitForContentPreparationState();
}

async function ensureTrack(trackId) {
  await maestro(".maestro/aud02d-track-readiness.yaml", { TRACK_ID: trackId });
}

async function resetState() {
  run("xcrun", ["simctl", "openurl", AUD02D_UDID, "com.lkurczab.patternly://audit/reset-learning-state"]);
  await maestro(".maestro/rc-runtime-audit-reset-complete.yaml");
}

async function runExamFreeAndPremium(record, suite) {
  let backend;
  try {
    backend = startBackend("expired");
    const expiredReady = await waitForBackendReady(backend);
    await captureEntitlementPhase(record, "exam-expired", expiredReady, "expired");
    await runNode(path.join(APP_ROOT, "scripts/runCertificationExamFreeRcIos.mjs"), ["--udid", AUD02D_UDID], caseEnvironment(), record, [suite.free]);
    await stopBackend(backend);
    backend = undefined;
    await waitForPortAvailable();
    backend = startBackend("active");
    const activeReady = await waitForBackendReady(backend);
    await captureEntitlementPhase(record, "exam-active", activeReady, "active");
    await runNode(path.join(APP_ROOT, "scripts/runCertificationExamRcIos.mjs"), ["--udid", AUD02D_UDID], caseEnvironment(), record, suite.premiumFlows);
  } finally {
    if (backend) { await stopBackend(backend); await waitForPortAvailable(); }
  }
}

function startBackend(entitlementState) {
  assertBackendPortAvailable();
  const child = spawn("npm", ["run", "dev:smoke"], {
    cwd: BACKEND_ROOT,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      FIREBASE_PROJECT_ID: "patternly-app-sandbox",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:19099",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:18081",
      PATTERNLY_LOCAL_SMOKE_ENTITLEMENT_STATE: entitlementState,
    },
  });
  for (const stream of [child.stdout, child.stderr]) stream.setEncoding("utf8").on("data", (chunk) => process.stdout.write(chunk));
  child.once("error", (error) => { child.spawnError = error; });
  return child;
}

async function waitForBackendReady(child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.spawnError || child.exitCode !== null || child.signalCode !== null) throw new Error("The owned local AUD-02D backend exited before readiness.");
    try {
      const response = await fetch("http://127.0.0.1:8080/ready", { signal: AbortSignal.timeout(1000) });
      const body = await response.json();
      if (response.ok && body.status === "ready" && ["database", "authentication", "providerReader"].every((key) => body.checks?.[key] === true)) return { status: response.status, body, observedAt: new Date().toISOString() };
    } catch { /* Retry until the owned local backend reports readiness. */ }
    await delay(200);
  }
  throw new Error("The owned local AUD-02D backend did not become ready within 60000ms.");
}

async function smokeAuthContext() {
  const smokeSecrets = JSON.parse(await readFile(path.join(BACKEND_ROOT, ".local/smoke/secrets.json"), "utf8"));
  const appCheck = smokeSecrets.appCheckToken;
  if (typeof appCheck !== "string" || !/^[a-f0-9]{64}$/u.test(appCheck)) throw new Error("The local backend App Check fixture is missing or malformed.");
  return createGenerationPinnedSmokeSession({
    email: credentials.EXPO_PUBLIC_PATTERNLY_E2E_EMAIL,
    password: credentials.EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD,
    appCheck,
    apiOrigin: smokeEnvironment.EXPO_PUBLIC_PATTERNLY_API_ORIGIN,
    authOrigin: smokeEnvironment.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN,
  });
}

async function readBackendEvidence(auth) {
  const response = await fetch("http://127.0.0.1:8080/ready", { signal: AbortSignal.timeout(1000) });
  let readyBody;
  try { readyBody = await response.json(); } catch { return null; }
  if (!response.ok || readyBody.status !== "ready" || !["database", "authentication", "providerReader"].every((key) => readyBody.checks?.[key] === true)) return null;
  const entitlementResponse = await fetch("http://127.0.0.1:8080/v1/entitlements", {
    headers: { authorization: "Bearer " + auth.idToken, "x-firebase-appcheck": auth.appCheck },
    signal: AbortSignal.timeout(3000),
  });
  const entitlementBody = await entitlementResponse.json();
  const entitlement = entitlementBody.entitlements?.[0];
  if (!entitlementResponse.ok || entitlementBody.entitlements?.length !== 1 || entitlement?.entitlement !== "premium" || entitlement?.productId !== "com.lkurczab.patternly.premium.monthly" || !["expired", "active"].includes(entitlement?.state) || entitlement?.source !== "revenuecat") {
    const code = safeHttpErrorCode(entitlementBody);
    throw new Error(`The local /v1/entitlements evidence response was invalid (HTTP ${entitlementResponse.status}${code ? `, error.code=${code}` : ""}).`);
  }
  return {
    observedAt: new Date().toISOString(),
    ready: { httpStatus: response.status, body: readyBody },
    auth: auth.evidence,
    entitlement: {
      httpStatus: entitlementResponse.status,
      state: entitlement.state,
      entitlement: entitlement.entitlement,
      productId: entitlement.productId,
      providerExpiresAt: entitlement.providerExpiresAt,
      providerGraceExpiresAt: entitlement.providerGraceExpiresAt,
      providerObservedAt: entitlement.providerObservedAt,
      serverObservedAt: entitlementBody.serverObservedAt,
      source: entitlement.source,
    },
  };
}

async function captureEntitlementPhase(record, phase, readiness, expectedState) {
  const auth = await smokeAuthContext();
  const observation = await readBackendEvidence(auth);
  if (!observation || observation.entitlement.state !== expectedState) throw new Error("Expected observed local entitlement " + expectedState + " during " + phase + ".");
  observation.phase = phase;
  observation.readinessStartup = readiness;
  record.backendObservations.push(observation);
  record.entitlementTransitions.push({ observedAt: observation.observedAt, phase, state: observation.entitlement.state, source: observation.entitlement.source });
}

function observeBackendTransitions(record, auth) {
  let stopping = false;
  const completion = (async () => {
    while (!stopping) {
      try {
        const observation = await readBackendEvidence(auth);
        const prior = record.entitlementTransitions.at(-1)?.state;
        if (observation && observation.entitlement.state !== prior) {
          record.backendObservations.push(observation);
          record.entitlementTransitions.push({ observedAt: observation.observedAt, state: observation.entitlement.state, source: observation.entitlement.source });
        }
      } catch (error) {
        record.backendObserverErrors ??= [];
        record.backendObserverErrors.push(error instanceof Error ? error.message : String(error));
      }
      if (!stopping) await delay(500);
    }
  })();
  return { stop: async () => { stopping = true; await completion; } };
}

async function stopBackend(child) {
  if (process.platform === "win32") child.kill("SIGTERM");
  else if (child.pid) { try { process.kill(-child.pid, "SIGTERM"); } catch (error) { if (error?.code !== "ESRCH") throw error; } }
  await waitForPortAvailable();
}

function assertBackendPortAvailable() {
  const result = spawnSync("lsof", ["-nP", "-iTCP:8080", "-sTCP:LISTEN", "-t"], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status === 0 && result.stdout.trim()) throw new Error("AUD-02D needs 127.0.0.1:8080 free to own its entitlement backend; no existing process was stopped.");
  if (result.status !== 0 && result.status !== 1) throw new Error("AUD-02D could not verify that backend port 8080 is free.");
}

async function waitForPortAvailable(timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  do { try { await probePort(8080); return; } catch { await delay(100); } } while (Date.now() < deadline);
  throw new Error("The owned AUD-02D backend stopped, but port 8080 stayed occupied.");
}

function probePort(port) {
  return new Promise((resolveProbe, rejectProbe) => {
    const server = createServer();
    server.once("error", rejectProbe);
    server.listen(port, "127.0.0.1", () => server.close((error) => error ? rejectProbe(error) : resolveProbe()));
  });
}

function caseEnvironment() {
  return { ...smokeEnvironment, PATTERNLY_DEV_CLIENT_URL: DEV_CLIENT_URL, MAESTRO_TEST_OUTPUT_DIR: activeCaseDirectory };
}

async function maestro(flow, variables = {}) {
  const args = ["test", "--udid", AUD02D_UDID, "--test-output-dir", activeCaseDirectory];
  const merged = { ...credentials, ...variables };
  for (const [key, value] of Object.entries(merged)) args.push("-e", `${key}=${value}`);
  args.push(flow);
  const assertions = await collectFlowAssertions(flow);
  if (assertions.length === 0) throw new Error(`AUD-02D flow ${flow} has no executable Maestro assertions.`);
  await streamProcess("maestro", args, { cwd: APP_ROOT, env: { ...smokeEnvironment, ...credentials } }, `Maestro flow ${flow} failed.`);
  activeCaseRecord?.maestroExecutions.push({ flow, exitCode: 0, executedAssertions: assertions.map((assertion) => ({ ...assertion, passed: true })) });
}

async function runNode(script, args, env, record, flows) {
  await streamProcess(process.execPath, [script, ...args], { cwd: APP_ROOT, env }, `AUD-02D child runner ${path.basename(script)} failed.`);
  record.runnerExecutions.push({ script: path.relative(APP_ROOT, script), exitCode: 0 });
  for (const flow of flows) {
    const assertions = await collectFlowAssertions(flow);
    if (assertions.length === 0) throw new Error(`AUD-02D child flow ${flow} has no executable Maestro assertions.`);
    record.maestroExecutions.push({ flow, runner: path.basename(script), exitCode: 0, executedAssertions: assertions.map((assertion) => ({ ...assertion, passed: true })) });
  }
}

async function runObservedNode(script, args, env, record, flows) {
  const auth = await smokeAuthContext();
  const observer = observeBackendTransitions(record, auth);
  let failure;
  try { await runNode(script, args, env, record, flows); }
  catch (error) { failure = error; }
  await observer.stop();
  if (failure) throw failure;
  const states = record.entitlementTransitions.map(({ state }) => state);
  if (states[0] !== "expired" || !states.includes("active")) throw new Error(`AUD-02D did not observe the child's backend entitlement transition expired -> active (observed ${states.join(" -> ") || "none"}).`);
}

async function streamProcess(command, args, options, failureMessage) {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
  const redact = (chunk) => Object.values(credentials).reduce((text, secret) => text.split(secret).join("[redacted]"), chunk.toString());
  child.stdout.setEncoding("utf8").on("data", (chunk) => process.stdout.write(redact(chunk)));
  child.stderr.setEncoding("utf8").on("data", (chunk) => process.stderr.write(redact(chunk)));
  await new Promise((resolveChild, rejectChild) => {
    child.once("error", rejectChild);
    child.once("close", (code, signal) => code === 0 ? resolveChild() : rejectChild(new Error(`${failureMessage} Exit status: ${code ?? signal ?? "unknown"}.`)));
  });
}

async function collectFlowAssertions(flow) {
  const assertions = [];
  const visited = new Set();
  async function visit(relativePath) {
    const absolute = path.resolve(APP_ROOT, relativePath);
    if (visited.has(absolute)) return;
    visited.add(absolute);
    const lines = (await readFile(absolute, "utf8")).split(/\r?\n/u);
    for (let index = 0; index < lines.length; index += 1) {
      const assertion = lines[index].match(/^\s*-\s*(assertVisible|assertNotVisible|assertTrue|assertCondition):\s*(.*)$/u);
      if (assertion) {
        let target = assertion[2].replace(/^['"]|['"]$/gu, "");
        if (!target) {
          for (let next = index + 1; next < Math.min(lines.length, index + 8); next += 1) {
            const id = lines[next].match(/^\s*id:\s*['"]?([^'"]+)['"]?\s*$/u);
            const text = lines[next].match(/^\s*text:\s*['"]?([^'"]+)['"]?\s*$/u);
            if (id || text) { target = (id ?? text)[1].trim(); break; }
            if (/^\s*-\s/u.test(lines[next])) break;
          }
        }
        assertions.push({ file: path.relative(APP_ROOT, absolute), line: index + 1, command: assertion[1], target });
      }
      const reference = lines[index].match(/^\s*-\s*runFlow:\s*([\w./-]+\.yaml)\s*$/u);
      if (reference) {
        const sibling = path.resolve(path.dirname(absolute), reference[1]);
        const rootRelative = path.resolve(APP_ROOT, reference[1]);
        const child = existsSync(sibling) ? sibling : rootRelative;
        await visit(path.relative(APP_ROOT, child));
      }
    }
  }
  await visit(flow);
  return assertions;
}

async function inventoryArtifacts(directory) {
  const output = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile()) output.push({ path: absolute, bytes: (await stat(absolute)).size });
    }
  }
  await walk(directory);
  return output.sort((left, right) => left.path.localeCompare(right.path));
}

function loadSmokeEnvironment() {
  let profile;
  try { profile = parseDotenv(readFileSync(path.join(APP_ROOT, ".env.smoke.local"), "utf8")); }
  catch { throw new Error("AUD-02D requires local smoke credentials in .env.smoke.local."); }
  return validateLocalProfile("smoke", { ...process.env, ...profile });
}

async function writeManifest() {
  manifest.finalCanonicalSha256 = canonicalHash({ ...manifest, finalCanonicalSha256: undefined });
  await writeFile(path.join(OUTPUT_ROOT, "aud02d-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

function git(root, args) { return run("git", args, { cwd: root }); }
function required(name) { const value = process.env[name]; if (!value) throw new Error(`${name} is required; AUD-02D does not guess evidence destinations.`); return path.resolve(value); }
function run(command, args, options = {}) {
  const { allowFailure = false, ...spawnOptions } = options;
  const result = spawnSync(command, args, { encoding: "utf8", ...spawnOptions });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  return result.stdout ?? "";
}

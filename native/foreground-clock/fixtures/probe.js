import React, { useEffect, useState } from "react";
import { AppRegistry, AppState, Platform, Text, View } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import { createNativeEncryptedStoragePlatform, claimNativeForegroundClock } from "../../../src/infrastructure/storage/encryptedStorageNative";
import { foregroundTimerPhysicalKey } from "../../../src/infrastructure/storage/profileStorageRouter";
import { createForegroundTimerState } from "../../../src/domain/learning/foregroundTimerState";
import { sha256Utf8 } from "../../../src/infrastructure/identity/sha256";
import { isPatternlySmokeRuntime } from "../../../src/infrastructure/runtime/runtimeMode";

const PROTOCOL = "patternly.native-clock-fixture.v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const TRACK = "coding-interview-dsa-problem-solving";
const FAMILY = "coding_interview";
const SCHEMA = "patternly:canonical:v1";

export function resolveConfiguration(development, smoke, mode, runId, scenario, operatingSystem) {
  if (!development || !smoke || operatingSystem !== "ios" || !["seed", "recover", "cleanup"].includes(mode)
    || !UUID.test(runId ?? "") || !["countdown", "cap", "overrun"].includes(scenario)) return null;
  return Object.freeze({ mode, runId, scenario, storeId: `patternly-clock-fixture-${runId}`,
    physicalKey: foregroundTimerPhysicalKey(runId), sessionId: `clock-fixture-${scenario}-${runId}`,
    countdownMs: 60_000, initialElapsedMs: scenario === "cap" ? 59_500 : scenario === "overrun" ? 61_000 : 0,
    // PUBLIC synthetic fixture material, not a secret or user encryption key.
    // Never use this derivation for a production store or confidentiality claim.
    publicTestKey: sha256Utf8(`patternly-public-clock-fixture:${runId}`).slice(0, 32) });
}
const configuration = resolveConfiguration(typeof __DEV__ !== "undefined" && __DEV__, isPatternlySmokeRuntime(),
  process.env.EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_MODE,
  process.env.EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_RUN_ID,
  process.env.EXPO_PUBLIC_PATTERNLY_CLOCK_FIXTURE_SCENARIO, Platform.OS);
let stage = configuration ? "preflight" : "disabled";
let errorCategory = configuration ? null : "configuration_rejected";
let platform = null;
let slot = null;
let clock = null;
let current = false;
let bootAttempted = false;
let cleanupVerified = false;
const lifecycleReceipts = [];

function reject(category) { const error = new Error(category); error.fixtureCategory = category; throw error; }
function ownedDiskFiles() {
  // Pinned iOS SDK default root, verified with a read-only real-device probe.
  // MMKV.exists alone returns false for a partial data/CRC pair.
  return new Directory(Paths.document, "mmkv").list()
    .filter(entry => entry.name === configuration.storeId || entry.name.startsWith(`${configuration.storeId}.`));
}
function assertDiskNamespaceBeforeOpen() {
  const files = ownedDiskFiles();
  if (configuration.mode === "seed" && files.length !== 0) reject("fixture_store_collision");
  if (configuration.mode !== "seed" && (files.length !== 2 || !files.some(entry => entry.name === configuration.storeId) || !files.some(entry => entry.name === `${configuration.storeId}.crc`) || files.some(entry => !(entry instanceof File)))) reject("fixture_store_missing");
}
function assertKeyInventory() {
  const keys = slot.getAllKeys();
  if (keys.length !== 1 || keys[0] !== configuration.physicalKey) reject("fixture_namespace_rejected");
}
function decode(raw) {
  let envelope;
  try { envelope = JSON.parse(raw); } catch { reject("fixture_record_rejected"); }
  if (!envelope || Object.keys(envelope).sort().join(",") !== "payload,revision,schemaIdentity"
    || envelope.schemaIdentity !== SCHEMA || !Number.isSafeInteger(envelope.revision) || envelope.revision < 1) reject("fixture_record_rejected");
  const timer = createForegroundTimerState(envelope.payload);
  if (timer.familyId !== FAMILY || timer.trackId !== TRACK || timer.sessionId !== configuration.sessionId
    || timer.accumulatedForegroundMs < configuration.initialElapsedMs) reject("fixture_record_rejected");
  return timer;
}
function requireReady() { if (stage !== "ready" || !clock || !current) reject("fixture_not_ready"); }
function read() {
  const base = { protocol: PROTOCOL, stage, runId: configuration?.runId ?? null,
    mode: configuration?.mode ?? null, scenario: configuration?.scenario ?? null, errorCategory, cleanupVerified };
  if (stage !== "ready") return base;
  try {
    const state = decode(clock.read());
    return { ...base, countdownMs: configuration.countdownMs, initialElapsedMs: configuration.initialElapsedMs,
      durableElapsedMs: state.accumulatedForegroundMs, checkpointRevision: state.checkpointRevision,
      running: state.running, elapsedMs: clock.elapsed(), metrics: clock.metrics(), encrypted: slot.isEncrypted };
  } catch {
    stage = "failed"; errorCategory = "native_read_failed";
    return { ...base, stage, errorCategory };
  }
}
const marker = Object.freeze({
  read,
  lifecycle() { return JSON.parse(JSON.stringify(lifecycleReceipts)); },
  enter() { requireReady(); const state = decode(clock.enter()); return { checkpointRevision: state.checkpointRevision, running: state.running }; },
  elapsed() { requireReady(); return clock.elapsed(); },
  metrics() { requireReady(); return clock.metrics(); },
  checkpoint() { requireReady(); const state = decode(clock.checkpoint()); return { checkpointRevision: state.checkpointRevision, running: state.running }; },
  pause() { requireReady(); const state = decode(clock.pause()); return { checkpointRevision: state.checkpointRevision, running: state.running }; },
});
globalThis.__patternlyNativeClockFixture = marker;

export async function runClockFixture() {
  if (!configuration || bootAttempted) return;
  bootAttempted = true;
  try {
    assertDiskNamespaceBeforeOpen();
    platform = createNativeEncryptedStoragePlatform();
    const exists = platform.exists(configuration.storeId);
    if (configuration.mode === "seed" && exists) reject("fixture_store_collision");
    if (configuration.mode !== "seed" && !exists) reject("fixture_store_missing");
    stage = "opening";
    // The canonical SDK recovery strategy remains recover-on-error. This owned
    // synthetic store does not establish CRC/torn-file or Keychain recovery.
    slot = platform.open(configuration.storeId, configuration.publicTestKey);
    if (!slot.isEncrypted) reject("fixture_encryption_rejected");
    const keys = slot.getAllKeys();
    if (configuration.mode === "seed" && keys.length !== 0) reject("fixture_namespace_rejected");
    if (configuration.mode !== "seed") assertKeyInventory();
    current = true;
    clock = claimNativeForegroundClock(slot, { profileId: configuration.runId, physicalKey: configuration.physicalKey,
      generation: 0, isCurrent: () => current });
    if (configuration.mode === "seed") {
      const payload = createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: FAMILY,
        sessionId: configuration.sessionId, trackId: TRACK, accumulatedForegroundMs: configuration.initialElapsedMs,
        checkpointRevision: 1, lastCheckpointAt: new Date().toISOString(), running: false });
      clock.apply(undefined, JSON.stringify({ schemaIdentity: SCHEMA, revision: 1, payload }));
    }
    const raw = clock.read(); decode(raw);
    clock.arm({ expectedRaw: raw, familyId: FAMILY, sessionId: configuration.sessionId, trackId: TRACK,
      countdownMs: configuration.countdownMs });
    assertKeyInventory();
    if (configuration.mode === "cleanup") {
      stage = "cleanup";
      clock.revoke(); current = false;
      assertKeyInventory();
      clock = null; slot = null;
      platform.delete(configuration.storeId);
      if (platform.exists(configuration.storeId) || ownedDiskFiles().length !== 0) reject("fixture_cleanup_unverified");
      cleanupVerified = true; stage = "complete";
    } else {
      stage = "ready";
      // Observe only: UIKit/native owner remains the sole cutoff/resume owner.
      // Numeric snapshots are retained in memory, never written to app files.
      AppState.addEventListener("change", state => {
        if (stage !== "ready" || !["active", "background"].includes(state) || lifecycleReceipts.length >= 8) return;
        lifecycleReceipts.push(Object.freeze({ state, atMs: performance.now(), clock: Object.freeze(read()) }));
      });
    }
  } catch (error) {
    stage = "failed";
    const allowed = ["fixture_store_collision", "fixture_store_missing", "fixture_namespace_rejected", "fixture_encryption_rejected", "fixture_record_rejected", "fixture_cleanup_unverified"];
    errorCategory = allowed.includes(error?.fixtureCategory) ? error.fixtureCategory : "native_operation_failed";
    // Do not repair, delete or retry here. Uncertain native effects remain
    // unaccepted; retain whatever owned diagnostic state remains.
  }
}
function ClockFixtureApp() {
  const [receipt, setReceipt] = useState(read);
  useEffect(() => { void runClockFixture().then(() => setReceipt(read())); }, []);
  return React.createElement(View, { style: { padding: 32 }, accessibilityRole: "summary" },
    React.createElement(Text, { testID: "native-clock-fixture-stage" }, `Native clock fixture: ${receipt.stage}`),
    receipt.errorCategory ? React.createElement(Text, null, receipt.errorCategory) : null);
}
AppRegistry.registerComponent("main", () => ClockFixtureApp);

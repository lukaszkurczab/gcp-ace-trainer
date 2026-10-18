import { AppState } from "react-native";
import { androidClockProbeFailure } from "./androidClockProbeReadiness";
import { enabled, runId, receipt, captureAndroidClockProbeInventory } from "./androidClockProbeRuntime";
import { createNativeEncryptedStoragePlatform, claimNativeForegroundClock, readNativeForegroundClockStorageProbe } from "../../infrastructure/storage/encryptedStorageNative";
import { foregroundTimerPhysicalKey } from "../../infrastructure/storage/profileStorageRouter";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent, getActiveForegroundClock } from "../../infrastructure/storage/mmkvClient";
import { readActiveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { readActiveForegroundTimer } from "../../storage/repositories/foregroundTimerRepository";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { createForegroundTimerState, type ForegroundTimerState } from "../../domain";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import type { ForegroundClockCapability } from "../../infrastructure/storage/foregroundClockCapability";
import type { EncryptedStoragePlatform, StorageSlot } from "../../infrastructure/storage/encryptedStorageBootstrap";

const TRACK = "coding-interview-dsa-problem-solving";
const FAMILY = "coding_interview";
const SCENARIOS = ["countdown", "cap", "overrun", "elapsed"] as const;
type Scenario = typeof SCENARIOS[number];
type Configuration = Readonly<{ runId: string; scenario: Scenario; startedAt: string; originProfileSha256: string }>;
let configuration: Configuration | null = null;
let platform: EncryptedStoragePlatform | null = null;
let slot: StorageSlot | null = null;
let clock: ForegroundClockCapability | null = null;
let current = false;

function files() {
  const { Directory, File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
  return { Directory, File, root: new Directory(Paths.document, `android-clock-probe-${runId}`), mmkv: new Directory(Paths.document, "mmkv") };
}
function configFile() { const { File, root } = files(); return new File(root, "fixture-owner.json"); }
function cleanupFile() { const { File, root } = files(); return new File(root, "fixture-cleanup-pending.json"); }
const storeId = () => `patternly-android-clock-fixture-${runId}`;
const key = () => foregroundTimerPhysicalKey(runId!);
const sessionId = () => `android-clock-fixture-${configuration!.scenario}-${runId}`;
const initialElapsed = () => configuration!.scenario === "cap" ? 59_500 : configuration!.scenario === "overrun" ? 61_000 : 0;
function ownedFiles() {
  const { mmkv } = files();
  return mmkv.exists ? mmkv.list().filter(file => file.name === storeId() || file.name.startsWith(`${storeId()}.`)) : [];
}
function profileSha() {
  const lease = captureActiveProfileStorageLease();
  if (!lease || !isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_profile_unavailable");
  return sha256Utf8(lease.profile.id);
}
function decode(raw: string | undefined): ForegroundTimerState {
  if (!raw) throw androidClockProbeFailure("fixture_record_rejected");
  const envelope = JSON.parse(raw);
  if (envelope.schemaIdentity !== "patternly:canonical:v1" || !Number.isSafeInteger(envelope.revision) || envelope.revision < 1) throw androidClockProbeFailure("fixture_record_rejected");
  const state = createForegroundTimerState(envelope.payload);
  if (state.familyId !== FAMILY || state.trackId !== TRACK || state.sessionId !== sessionId()
    || state.accumulatedForegroundMs < initialElapsed()) throw androidClockProbeFailure("fixture_record_rejected");
  return state;
}
function requireNamespace() {
  const keys = slot!.getAllKeys();
  if (keys.length !== 1 || keys[0] !== key()) throw androidClockProbeFailure("fixture_namespace_rejected");
}
function arm() {
  const raw = clock!.read(); decode(raw); requireNamespace();
  clock!.arm({ expectedRaw: raw!, familyId: FAMILY, trackId: TRACK, sessionId: sessionId(), countdownMs: configuration!.scenario === "elapsed" ? undefined : 60_000 });
}
function open() {
  platform = createNativeEncryptedStoragePlatform();
  // Public synthetic material, only for this empty diagnostic store. Never a
  // user key, confidentiality claim or another authority for a product session.
  slot = platform.open(storeId(), sha256Utf8(`patternly-public-android-clock-fixture:${runId}`).slice(0, 32));
  if (!slot.isEncrypted) throw androidClockProbeFailure("fixture_encryption_rejected");
  current = true;
  clock = claimNativeForegroundClock(slot, { physicalKey: key(), profileId: runId!, generation: 0, isCurrent: () => current });
}


/** Persisted running may describe a cold arm. Admit only a stable, actually
 * paused original owner; never pause or rewrite a production record here. */
async function requirePausedProductionOwner() {
  const lease = captureActiveProfileStorageLease();
  if (!lease || !isActiveProfileStorageLeaseCurrent(lease) || AppState.currentState !== "active") throw androidClockProbeFailure("probe_foreground_unavailable");
  const session = readActiveTrainingSession(productionTrackAdmissionContext);
  const timer = readActiveForegroundTimer(productionTrackAdmissionContext);
  if (!session && !timer) return;
  if (!session || !timer || timer.sessionId !== session.id || timer.trackId !== session.trackId) throw androidClockProbeFailure("probe_scope_unavailable");
  const owner = getActiveForegroundClock(), raw = owner.read(), elapsed = owner.elapsed();
  let lifecycleChanged = false;
  const subscription = AppState.addEventListener("change", () => { lifecycleChanged = true; });
  try {
    await new Promise<void>(resolve => setTimeout(resolve, 100));
    if (lifecycleChanged || AppState.currentState !== "active" || !isActiveProfileStorageLeaseCurrent(lease) || getActiveForegroundClock() !== owner
      || JSON.stringify(readActiveTrainingSession(productionTrackAdmissionContext)) !== JSON.stringify(session) || owner.read() !== raw) throw androidClockProbeFailure("probe_scope_unavailable");
    const after = owner.elapsed();
    if (!Number.isSafeInteger(elapsed) || elapsed !== timer.accumulatedForegroundMs || after !== elapsed) throw androidClockProbeFailure("fixture_requires_session_exit");
  } finally { subscription.remove(); }
}

/** Separate SDK fixture, never substitutes for the selected user's T/S. */
export async function seedAndroidClockFixture(scenario: Scenario) {
  if (!enabled || !SCENARIOS.includes(scenario) || configuration || configFile().exists || cleanupFile().exists || ownedFiles().length) throw androidClockProbeFailure("fixture_store_collision");
  await requirePausedProductionOwner();
  configuration = { runId: runId!, scenario, startedAt: new Date().toISOString(), originProfileSha256: profileSha() };
  const { root } = files(); root.create({ intermediates: true, idempotent: true });
  configFile().write(JSON.stringify(configuration));
  open();
  if (slot!.getAllKeys().length) throw androidClockProbeFailure("fixture_namespace_rejected");
  const payload = createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: FAMILY, trackId: TRACK, sessionId: sessionId(),
    accumulatedForegroundMs: initialElapsed(), checkpointRevision: 1, lastCheckpointAt: configuration.startedAt, running: false });
  clock!.apply(undefined, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload }));
  // SDK write/readback through both native and original JS accessors, before
  // arm/enter. No production store or second handle participates.
  const alias = readNativeForegroundClockStorageProbe(sha256Utf8(runId!));
  if (!alias?.aliasReadMatched || !alias.bindReadMatched || !alias.encrypted || alias.checkpointCount !== 0) throw androidClockProbeFailure("foreground_clock_shared_handle_mismatch");
  arm();
  return captureAndroidClockFixture();
}

function validateConfiguration(value: Configuration): void {
  if (!value || value.runId !== runId || !SCENARIOS.includes(value.scenario) || !Number.isFinite(Date.parse(value.startedAt))
    || !/^[a-f0-9]{64}$/u.test(value.originProfileSha256) || Object.keys(value).length !== 4) throw androidClockProbeFailure("fixture_configuration_rejected");
}

export function restoreAndroidClockFixture() {
  if (!enabled || configuration) return;
  // A cleanup marker is never interpreted as permission to reopen the handle.
  // configuration stays non-null in the requesting JS runtime, so this branch
  // can run only after the driver has confirmed process death and cold launch.
  if (cleanupFile().exists) {
    const pending = JSON.parse(cleanupFile().textSync());
    const value = pending.configuration as Configuration;
    if (pending.runId !== runId || Object.keys(pending).length !== 3
      || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(pending.caseId ?? "")) throw androidClockProbeFailure("fixture_cleanup_unverified");
    validateConfiguration(value);
    if (value.originProfileSha256 !== profileSha() || (configFile().exists && JSON.stringify(JSON.parse(configFile().textSync())) !== JSON.stringify(value))) throw androidClockProbeFailure("fixture_cleanup_unverified");
    const owned = ownedFiles();
    if (owned.length !== 0 && (owned.length !== 2 || !owned.some(file => file.name === storeId()) || !owned.some(file => file.name === `${storeId()}.crc`))) throw androidClockProbeFailure("fixture_namespace_rejected");
    if (!configFile().exists && owned.length) throw androidClockProbeFailure("fixture_cleanup_unverified");
    const coldPlatform = createNativeEncryptedStoragePlatform();
    coldPlatform.delete(storeId());
    if (coldPlatform.exists(storeId()) || ownedFiles().length) throw androidClockProbeFailure("fixture_cleanup_unverified");
    if (configFile().exists) configFile().delete();
    cleanupFile().delete();
    receipt(`fixture-cleanup-${pending.caseId}.json`, { stage: "fixture_cleanup_verified", caseId: pending.caseId, fixture: true, cleanupVerified: true, originProfileSha256: value.originProfileSha256, inventory: captureAndroidClockProbeInventory() });
    return;
  }
  if (!configFile().exists) return;
  const value = JSON.parse(configFile().textSync()) as Configuration;
  validateConfiguration(value);
  configuration = value;
  if (configuration.originProfileSha256 !== profileSha() || ownedFiles().length !== 2) throw androidClockProbeFailure("fixture_namespace_rejected");
  open(); arm();
  receipt("fixture-cold.json", { stage: "cold_before_sync", ...captureAndroidClockFixture() });
}

export function captureAndroidClockFixture() {
  if (!enabled || !configuration || !clock || !current || configuration.originProfileSha256 !== profileSha()) throw androidClockProbeFailure("fixture_not_ready");
  const state = decode(clock.read());
  const elapsedMs = clock.elapsed();
  return { profileSha256: sha256Utf8(runId!), sessionSha256: sha256Utf8(sessionId()), timerKind: configuration.scenario === "elapsed" ? "elapsedForeground" : "countdownForeground",
    configurationSha256: sha256Utf8(JSON.stringify({ scenario: configuration.scenario, countdownMs: configuration.scenario === "elapsed" ? undefined : 60_000 })), startedAt: configuration.startedAt,
    countdownMs: configuration.scenario === "elapsed" ? undefined : 60_000, durableElapsedMs: state.accumulatedForegroundMs, elapsedMs, checkpointRevision: state.checkpointRevision,
    running: state.running, lastCheckpointAt: state.lastCheckpointAt, metrics: clock.metrics(),
    storageProbe: readNativeForegroundClockStorageProbe(sha256Utf8(runId!)), inventory: captureAndroidClockProbeInventory(), fixture: true, scenario: configuration.scenario, observedWallMs: Date.now(), observedMonotonicMs: performance.now() };
}
export function enterAndroidClockFixture() { if (!clock) throw androidClockProbeFailure("fixture_not_ready"); clock.enter(); return captureAndroidClockFixture(); }
export function pauseAndroidClockFixture() { if (!clock) throw androidClockProbeFailure("fixture_not_ready"); clock.pause(); return captureAndroidClockFixture(); }
export function conflictAndroidClockFixture() {
  if (!clock) throw androidClockProbeFailure("fixture_not_ready");
  clock.pause(); const before = clock.read();
  let rejected = false;
  try { clock.apply("synthetic-stale-before", undefined); } catch { rejected = true; }
  if (!rejected || clock.read() !== before) throw androidClockProbeFailure("fixture_cas_unverified");
  return { ...captureAndroidClockFixture(), conflictRejected: true, exactUnchanged: true };
}
export function cleanupAndroidClockFixture(caseId: string) {
  if (!configuration || !clock || !platform || !slot || configuration.originProfileSha256 !== profileSha()
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(caseId)) throw androidClockProbeFailure("fixture_not_ready");
  requireNamespace(); clock.revoke(); current = false; clock = null; slot = null;
  // SDK AppState listeners can retain a HybridMMKV after JS references drop.
  // Keep its files valid for this process; never dispose/delete a live handle.
  cleanupFile().write(JSON.stringify({ runId, caseId, configuration }));
  platform = null;
  return { fixture: true, cleanupPendingColdRestart: true, inventory: captureAndroidClockProbeInventory() };
}

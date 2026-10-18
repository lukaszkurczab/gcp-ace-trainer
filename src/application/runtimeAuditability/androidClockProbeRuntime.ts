import { captureForegroundClockProbeStorage } from "../../storage/repositories/foregroundClockProbeRepository";
import { PREPARED_STALL_TTL_MS, requireAndroidClockProbePreparationCurrent, androidClockProbeFailure, androidClockProbeErrorCategory, waitForAndroidClockProbe, requireAndroidClockProbeAdvance, observeAndroidClockProbeSession, requireAndroidClockProbeSessionAdvance, observeAndroidClockProbePremiumCache } from "./androidClockProbeReadiness";
import { androidClockProbeEnabled } from "./androidClockProbeProtocol";
import { readActiveForegroundTimer, getActiveForegroundClockForProbe } from "../../storage/repositories/foregroundTimerRepository";
import { readActiveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent, readActiveAccountIdentityBinding } from "../../storage/repositories/profileStorageRepository";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import type { ForegroundTimerState, TrainingSession } from "../../domain";
import { getTrackRegistration } from "../../domain";
import { STORAGE_KEYS } from "../../storage/keys";
import { readNativeForegroundClockStorageProbe } from "../../infrastructure/storage/encryptedStorageNative";
import { hasPendingMutationJournal } from "../../storage/repositories/mutationJournalRepository";

export const runId = process.env.EXPO_PUBLIC_PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID;
export const enabled = Boolean(runId) && androidClockProbeEnabled(runId, process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE, (require("react-native") as typeof import("react-native")).Platform.OS);
let restored = false;
let earlyObservationAttempted = false;

// Deliberately lazy: normal builds neither load file APIs nor inspect storage.
export function receipt(name: string, value: unknown): void {
  if (!enabled) return;
  const { Directory, File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
  const directory = new Directory(Paths.document, `android-clock-probe-${runId}`);
  directory.create({ intermediates: true, idempotent: true });
  new File(directory, name).write(JSON.stringify({ protocol: "patternly.android-clock-probe.v1", runId, ...value as object }));
}

function identity(timer: ForegroundTimerState, session: TrainingSession) {
  const lease = captureActiveProfileStorageLease();
  if (!lease || !isActiveProfileStorageLeaseCurrent(lease) || timer.sessionId !== session.id || timer.trackId !== session.trackId || timer.familyId !== getTrackRegistration(session.trackId).familyId
    || session.status !== "active" || (session.configurationSnapshot.timer !== "elapsedForeground" && session.configurationSnapshot.timer !== "countdownForeground")) throw androidClockProbeFailure("probe_scope_unavailable");
  return { profileSha256: sha256Utf8(lease.profile.id), sessionSha256: sha256Utf8(session.id),
    timerKind: session.configurationSnapshot.timer, countdownMs: session.configurationSnapshot.timerDurationMs, durableElapsedMs: timer.accumulatedForegroundMs,
    checkpointRevision: timer.checkpointRevision, running: timer.running,
    sessionElapsedMs: session.activeForegroundMs, configurationSha256: sha256Utf8(JSON.stringify(session.configurationSnapshot)),
    startedAt: session.startedAt, lastCheckpointAt: timer.lastCheckpointAt,
    timerEnvelopeSha256: sha256Utf8(captureForegroundClockProbeStorage().getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER) ?? "") };
}

export function captureAndroidClockProbeInventory() {
  const lease = captureActiveProfileStorageLease();
  if (!lease || !isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_profile_unavailable");
  const store = captureForegroundClockProbeStorage();
  const active = readActiveTrainingSession(productionTrackAdmissionContext);
  return [...store.getAllKeys()].sort().map(key => {
    const raw = store.getString(key) ?? "";
    // S may reconcile active time after cold recovery. All other session fields,
    // including answers, pins, configuration and startedAt, must remain exact.
    let sessionContentSha256: string | undefined;
    if (active && key === STORAGE_KEYS.trainingSession(active.id)) {
      sessionContentSha256 = observeAndroidClockProbeSession(raw).contentSha256;
    }
    const premiumObservation = key === "patternly:premium-cache:v2"
      ? observeAndroidClockProbePremiumCache(raw, lease.profile.id, lease.profile.accountId, Date.now()) : undefined;
    if (!isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_profile_unavailable");
    return { key, sha256: sha256Utf8(raw), sessionContentSha256, premiumObservation };
  });
}

/** Separate async preservation evidence for fixture faults only. This never
 * delays production early-T recovery or relaxes prepared-stall byte fences. */
export async function captureAndroidClockFaultPreservation() {
  const lease = captureActiveProfileStorageLease();
  if (!lease || !isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_profile_unavailable");
  const value = lease.profile.kind === "account" ? await readActiveAccountIdentityBinding(lease) : null;
  if (!isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_profile_unavailable");
  const binding = value?.kind === "verified" && value.binding.verified && value.binding.schema === "patternly.account-binding.v1"
    && value.binding.profileKind === "account" && value.binding.profileId === lease.profile.id
    && value.binding.accountId === lease.profile.accountId ? {
      profileSha256: sha256Utf8(lease.profile.id), accountSha256: sha256Utf8(value.binding.accountId), uidSha256: sha256Utf8(value.binding.firebaseUid),
      schema: value.binding.schema, profileKind: value.binding.profileKind, verificationRevision: value.binding.verificationRevision, checksum: value.binding.checksum,
    } : null;
  const inventory = captureAndroidClockProbeInventory();
  if (!isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_profile_unavailable");
  return { inventory, preservationBinding: binding };
}

/** First admitted T read before facade reconciliation. Never used for recovery. */
export function observeAndroidClockProbeRestore(timer: ForegroundTimerState, session: TrainingSession): void {
  if (!enabled || restored || earlyObservationAttempted) return;
  restored = true;
  receipt("cold.json", { stage: "cold_before_sync", snapshotPhase: "facade_before_sync", ...identity(timer, session), inventory: captureAndroidClockProbeInventory(), observedWallMs: Date.now() });
}

/** Called synchronously at the storage-ready notification, before the account
 * bootstrap publishes profilePreparing. A refusal closes this attempt;
 * a later facade callback must not masquerade as this earlier observation. */
export function observeAndroidClockProbeProfileReady(): void {
  if (!enabled || restored || earlyObservationAttempted) return;
  earlyObservationAttempted = true;
  const save = (value: object) => {
    try { receipt("cold.json", value); }
    catch { /* Missing diagnostic output must never close the published profile. */ }
  };
  try {
    const lease = captureActiveProfileStorageLease();
    if (!lease || !isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_cold_profile_unavailable");
    if (hasPendingMutationJournal()) throw androidClockProbeFailure("probe_cold_journal_pending");
    const session = readActiveTrainingSession(productionTrackAdmissionContext);
    const timer = readActiveForegroundTimer(productionTrackAdmissionContext);
    if (!session || !timer) throw androidClockProbeFailure("probe_scope_unavailable");
    const observed = { ...identity(timer, session), inventory: captureAndroidClockProbeInventory() };
    if (!isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_cold_profile_unavailable");
    save({ stage: "cold_before_sync", snapshotPhase: "profile_ready_before_lifecycle", ...observed, observedWallMs: Date.now() });
    restored = true;
  } catch (error) {
    save({ stage: "cold_probe_refused", snapshotPhase: "profile_ready_before_lifecycle", category: androidClockProbeErrorCategory(error) });
  }
}

export function capture() {
  const session = readActiveTrainingSession(productionTrackAdmissionContext);
  if (!session) throw androidClockProbeFailure("probe_session_unavailable");
  const lease = captureActiveProfileStorageLease();
  // Read durable T before elapsed. Native can checkpoint between calls; this
  // order keeps the sampled elapsed >= the reported durable lower baseline.
  const timer = readActiveForegroundTimer(productionTrackAdmissionContext);
  if (!timer || !timer.running) throw androidClockProbeFailure("probe_timer_not_running");
  const elapsedMs = getActiveForegroundClockForProbe().elapsed();
  const duration = session.configurationSnapshot.timerDurationMs;
  if (!Number.isSafeInteger(elapsedMs) || elapsedMs < timer.accumulatedForegroundMs
    || (session.configurationSnapshot.timer === "countdownForeground" && (typeof duration !== "number" || duration - elapsedMs < 30_000))) throw androidClockProbeFailure("probe_countdown_or_owner_unavailable");
  if ((require("react-native") as typeof import("react-native")).AppState.currentState !== "active" || !lease || !isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_foreground_unavailable");
  return { ...identity(timer, session), elapsedMs,
    countdownMs: session.configurationSnapshot.timerDurationMs,
    storageProbe: readNativeForegroundClockStorageProbe(sha256Utf8(lease.profile.id)), metrics: getActiveForegroundClockForProbe().metrics(),
    inventory: captureAndroidClockProbeInventory(), observedMonotonicMs: performance.now(), observedWallMs: Date.now() };
}


/** A persisted running flag can survive cold arm without a live segment.
 * Verify actual native advancement before admitting a production stall. */
export async function captureAdvancing() {
  const lease = captureActiveProfileStorageLease();
  const owner = getActiveForegroundClockForProbe();
  const sample = () => {
    if (!lease || !isActiveProfileStorageLeaseCurrent(lease) || getActiveForegroundClockForProbe() !== owner) throw androidClockProbeFailure("probe_scope_unavailable");
    return capture();
  };
  const { AppState } = require("react-native") as typeof import("react-native");
  let lifecycleChanged = false;
  const subscription = AppState.addEventListener("change", () => { lifecycleChanged = true; });
  try {
    const before = await waitForAndroidClockProbe(sample);
    await new Promise<void>(resolve => setTimeout(resolve, 100));
    const after = await waitForAndroidClockProbe(sample);
    if (lifecycleChanged) throw androidClockProbeFailure("probe_foreground_unavailable");
    requireAndroidClockProbeAdvance(before, after);
    return after;
  } finally { subscription.remove(); }
}

type PreparedStall = Readonly<{
  caseId: string; expiresAt: number; lease: NonNullable<ReturnType<typeof captureActiveProfileStorageLease>>;
  owner: ReturnType<typeof getActiveForegroundClockForProbe>; session: TrainingSession; baselineElapsedMs: number;
  sessionObservation: ReturnType<typeof observeAndroidClockProbeSession>;
  inventory: ReturnType<typeof captureAndroidClockProbeInventory>; cancel: () => void;
}>;
let preparedStall: PreparedStall | null = null;
let invalidatedStall: { caseId: string; category: string } | null = null;
function clearPreparedStall() { const old = preparedStall; preparedStall = null; old?.cancel(); }
function invalidatePreparedStall(category: string) {
  if (preparedStall) invalidatedStall = { caseId: preparedStall.caseId, category };
  clearPreparedStall();
}

/** Expensive domain validation/inventory happens before the timed request. */
export async function prepareAndroidClockProbeStall(caseId: string) {
  clearPreparedStall();
  invalidatedStall = null;
  const lease = captureActiveProfileStorageLease(), owner = getActiveForegroundClockForProbe();
  const readiness = await captureAdvancing();
  const session = readActiveTrainingSession(productionTrackAdmissionContext);
  if (!lease || !session || !isActiveProfileStorageLeaseCurrent(lease) || getActiveForegroundClockForProbe() !== owner || sha256Utf8(session.id) !== readiness.sessionSha256) throw androidClockProbeFailure("probe_scope_unavailable");
  const inventory = captureAndroidClockProbeInventory();
  const observation = observeAndroidClockProbeSession(captureForegroundClockProbeStorage().getString(STORAGE_KEYS.trainingSession(session.id)) ?? "");
  const timer = readActiveForegroundTimer(productionTrackAdmissionContext);
  if (!timer) throw androidClockProbeFailure("probe_scope_unavailable");
  const currentIdentity = identity(timer, session);
  if (["profileSha256", "sessionSha256", "configurationSha256", "startedAt", "timerKind"].some(key =>
    currentIdentity[key as keyof typeof currentIdentity] !== readiness[key as keyof typeof readiness])
    || readiness.inventory.find(item => item.key === STORAGE_KEYS.trainingSession(session.id))?.sessionContentSha256 !== observation.contentSha256) throw androidClockProbeFailure("probe_scope_unavailable");
  const { AppState } = require("react-native") as typeof import("react-native");
  if (AppState.currentState !== "active" || !isActiveProfileStorageLeaseCurrent(lease) || hasPendingMutationJournal()) throw androidClockProbeFailure("probe_scope_unavailable");
  const subscription = AppState.addEventListener("change", state => {
    if (state !== "active") invalidatePreparedStall("probe_foreground_unavailable");
  });
  const expiresAt = performance.now() + PREPARED_STALL_TTL_MS;
  const timeout = setTimeout(() => invalidatePreparedStall("probe_preparation_expired"), PREPARED_STALL_TTL_MS);
  preparedStall = { caseId, expiresAt, lease, owner, session, baselineElapsedMs: readiness.elapsedMs,
    sessionObservation: observation, inventory, cancel: () => { clearTimeout(timeout); subscription.remove(); } };
  return { preparedCaseId: caseId, sessionSha256: readiness.sessionSha256, expiresInMs: PREPARED_STALL_TTL_MS, inventory };
}

/** One-shot, cheap scope check and final native sample. Never reopens storage,
 * reconciles S or retries a mutation when a preparation has become stale. */
export function capturePreparedAndroidClockProbeStall(caseId: string) {
  const prepared = preparedStall;
  const invalidation = invalidatedStall;
  invalidatedStall = null;
  clearPreparedStall();
  if (!prepared || prepared.caseId !== caseId) throw androidClockProbeFailure(invalidation?.caseId === caseId ? invalidation.category : "probe_preparation_required");
  requireAndroidClockProbePreparationCurrent(prepared.expiresAt, performance.now());
  const { AppState } = require("react-native") as typeof import("react-native");
  if (AppState.currentState !== "active" || !isActiveProfileStorageLeaseCurrent(prepared.lease) || getActiveForegroundClockForProbe() !== prepared.owner || hasPendingMutationJournal()) throw androidClockProbeFailure("probe_prepared_owner_changed");
  const store = captureForegroundClockProbeStorage(), sessionKey = STORAGE_KEYS.trainingSession(prepared.session.id);
  const observation = observeAndroidClockProbeSession(store.getString(sessionKey) ?? "");
  try { requireAndroidClockProbeSessionAdvance(prepared.sessionObservation, observation); }
  catch { throw androidClockProbeFailure("probe_prepared_session_changed"); }
  const keys = [...store.getAllKeys()].sort();
  if (JSON.stringify(keys) !== JSON.stringify(prepared.inventory.map(item => item.key))) throw androidClockProbeFailure("probe_prepared_keys_changed");
  const inventory = prepared.inventory.map(item => {
    const raw = store.getString(item.key) ?? "", digest = sha256Utf8(raw);
    if (item.key !== STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER && item.key !== sessionKey && digest !== item.sha256) throw androidClockProbeFailure("probe_prepared_value_changed");
    return { ...item, sha256: digest };
  });
  const storageProbe = readNativeForegroundClockStorageProbe(sha256Utf8(prepared.lease.profile.id));
  const metrics = prepared.owner.metrics();
  const timer = readActiveForegroundTimer(productionTrackAdmissionContext);
  if (!timer || !timer.running || timer.accumulatedForegroundMs < observation.elapsedMs) throw androidClockProbeFailure("probe_timer_not_running");
  const details = identity(timer, prepared.session);
  const elapsedMs = prepared.owner.elapsed();
  const countdownMs = prepared.session.configurationSnapshot.timerDurationMs;
  if (!Number.isSafeInteger(elapsedMs) || elapsedMs < timer.accumulatedForegroundMs || elapsedMs <= prepared.baselineElapsedMs
    || (details.timerKind === "countdownForeground" && (typeof countdownMs !== "number" || countdownMs - elapsedMs < 30_000))) throw androidClockProbeFailure("probe_not_advancing");
  return { ...details, sessionElapsedMs: observation.elapsedMs, elapsedMs, countdownMs, storageProbe, metrics, inventory,
    preparedCaseId: caseId, observedMonotonicMs: performance.now(), observedWallMs: Date.now() };
}

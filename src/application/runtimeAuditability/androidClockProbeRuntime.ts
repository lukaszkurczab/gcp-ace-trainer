import { captureForegroundClockProbeStorage } from "../../storage/repositories/foregroundClockProbeRepository";
import { androidClockProbeFailure, waitForAndroidClockProbe, requireAndroidClockProbeAdvance } from "./androidClockProbeReadiness";
import { androidClockProbeEnabled } from "./androidClockProbeProtocol";
import { readActiveForegroundTimer, getActiveForegroundClockForProbe } from "../../storage/repositories/foregroundTimerRepository";
import { readActiveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent } from "../../storage/repositories/profileStorageRepository";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import type { ForegroundTimerState, TrainingSession } from "../../domain";
import { STORAGE_KEYS } from "../../storage/keys";
import { readNativeForegroundClockStorageProbe } from "../../infrastructure/storage/encryptedStorageNative";

export const runId = process.env.EXPO_PUBLIC_PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID;
export const enabled = Boolean(runId) && androidClockProbeEnabled(runId, process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE, (require("react-native") as typeof import("react-native")).Platform.OS);
let restored = false;

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
  if (!lease || !isActiveProfileStorageLeaseCurrent(lease) || timer.sessionId !== session.id || timer.trackId !== session.trackId
    || session.status !== "active" || (session.configurationSnapshot.timer !== "elapsedForeground" && session.configurationSnapshot.timer !== "countdownForeground")) throw androidClockProbeFailure("probe_scope_unavailable");
  return { profileSha256: sha256Utf8(lease.profile.id), sessionSha256: sha256Utf8(session.id),
    timerKind: session.configurationSnapshot.timer, durableElapsedMs: timer.accumulatedForegroundMs,
    checkpointRevision: timer.checkpointRevision, running: timer.running,
    sessionElapsedMs: session.activeForegroundMs, configurationSha256: sha256Utf8(JSON.stringify(session.configurationSnapshot)),
    startedAt: session.startedAt, lastCheckpointAt: timer.lastCheckpointAt,
    timerEnvelopeSha256: sha256Utf8(captureForegroundClockProbeStorage().getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER) ?? "") };
}

export function captureAndroidClockProbeInventory() {
  const store = captureForegroundClockProbeStorage();
  const active = readActiveTrainingSession(productionTrackAdmissionContext);
  return [...store.getAllKeys()].sort().map(key => {
    const raw = store.getString(key) ?? "";
    // S may reconcile active time after cold recovery. All other session fields,
    // including answers, pins, configuration and startedAt, must remain exact.
    let sessionContentSha256: string | undefined;
    if (active && key === STORAGE_KEYS.trainingSession(active.id)) {
      const envelope = JSON.parse(raw);
      const { revision: _revision, ...metadata } = envelope;
      const { activeForegroundMs: _elapsed, ...content } = envelope.payload;
      sessionContentSha256 = sha256Utf8(JSON.stringify({ ...metadata, payload: content }));
    }
    return { key, sha256: sha256Utf8(raw), sessionContentSha256 };
  });
}

/** First admitted T read before facade reconciliation. Never used for recovery. */
export function observeAndroidClockProbeRestore(timer: ForegroundTimerState, session: TrainingSession): void {
  if (!enabled || restored) return;
  restored = true;
  receipt("cold.json", { stage: "cold_before_sync", ...identity(timer, session), inventory: captureAndroidClockProbeInventory(), observedWallMs: Date.now() });
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

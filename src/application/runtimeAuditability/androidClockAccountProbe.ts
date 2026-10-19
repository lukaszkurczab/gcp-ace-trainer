import { captureForegroundClockProbeStorage } from "../../storage/repositories/foregroundClockProbeRepository";
import { enabled } from "./androidClockProbeRuntime";
import { androidClockProbeFailure, requireAndroidClockProbeIdentitySettled, waitForAndroidClockProbe } from "./androidClockProbeReadiness";
import { captureActiveProfileStorageLease, getActiveStorageProfileOrNull, isActiveProfileStorageLeaseCurrent, readActiveAccountIdentityBinding } from "../../storage/repositories/profileStorageRepository";
import { createNativeEncryptedStoragePlatform } from "../../infrastructure/storage/encryptedStorageNative";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { getGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { getAccountSyncState } from "../../storage/repositories/accountDataRepository";
import { readTrainingSessions, readTrainingSessionEnvelopeProof, readActiveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { readActiveForegroundTimer } from "../../storage/repositories/foregroundTimerRepository";
import { readTrainingSessionResult } from "../../storage/repositories/trainingSessionResultRepository";
import { hasPendingMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { STORAGE_KEYS } from "../../storage/keys";
import { readStartupTrace } from "../../infrastructure/diagnostics/startupTrace";
import { premiumIdentityForAccount } from "../account/premiumEntitlementIdentity";
import { readCachedPremiumSnapshot } from "../../storage/repositories/premiumEntitlementCacheRepository";

// The same six SecureStore slots hashed by inspectQ13ControlInventory. These
// are read only; no MMKV handle, binding or account operation is created.
const CONTROL_SLOTS = [
  ["registry-a", "patternly.profile-root.v1.a"], ["registry-b", "patternly.profile-root.v1.b"],
  ["binding-a", "patternly.account-binding.v1.a"], ["binding-b", "patternly.account-binding.v1.b"],
  ["guest-removal", "patternly.profile-removal.v1"], ["logout", "patternly.local-logout-control.v2"],
] as const;
const hash = (value: string | null | undefined) => value == null ? null : sha256Utf8(value);

/** Passive discriminator for a failed bootstrap. No raw identities, account
 * payloads, secure values or SDK errors leave this UUID-gated diagnostic. */
export async function captureAndroidClockAccountProbe() {
  if (!enabled) throw androidClockProbeFailure("probe_scope_unavailable");
  await waitForAndroidClockProbe(() => requireAndroidClockProbeIdentitySettled(readStartupTrace()), 5_000);
  const lease = captureActiveProfileStorageLease(), profile = getActiveStorageProfileOrNull();
  if (!lease || !profile || !isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_profile_unavailable");
  return waitForAndroidClockProbe(async () => {
    if (!isActiveProfileStorageLeaseCurrent(lease)) throw androidClockProbeFailure("probe_scope_unavailable");
    const storage = captureForegroundClockProbeStorage();
    const stableKeys = [STORAGE_KEYS.ACCOUNT_SYNC, STORAGE_KEYS.GUEST_INSTALLATION, STORAGE_KEYS.ACTIVE_TRAINING_SESSION, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, STORAGE_KEYS.ACTIVE_JOURNAL, "patternly:premium-cache:v2"];
    const before = stableKeys.map(key => storage.getString(key));
    const control = createNativeEncryptedStoragePlatform().manifestStore;
    const readSlots = () => Promise.all(CONTROL_SLOTS.map(([, key]) => control.get(key)));
    const first = await readSlots();
    const installation = await getGuestInstallation();
    const sync = await getAccountSyncState(productionLearningDataAdmissionContext);
    const binding = profile.kind === "account" ? await readActiveAccountIdentityBinding(lease) : null;
    const session = readActiveTrainingSession(productionTrackAdmissionContext);
    const timer = readActiveForegroundTimer(productionTrackAdmissionContext);
    const pendingJournal = hasPendingMutationJournal();
    const history = readTrainingSessions(productionTrackAdmissionContext);
    if (!history.ok) throw androidClockProbeFailure("probe_scope_unavailable");
    const simulations = history.value.filter(item => item.modeId === "coding-interview-simulation").map(item => {
      const proof = readTrainingSessionEnvelopeProof(item.id, productionTrackAdmissionContext);
      const result = readTrainingSessionResult(item.id, productionTrackAdmissionContext);
      if (!proof) throw androidClockProbeFailure("probe_scope_unavailable");
      return { idSha256: hash(item.id), status: item.status, startedAt: item.startedAt, completedAt: item.completedAt,
        configurationSha256: hash(JSON.stringify(item.configurationSnapshot)), activeForegroundMs: item.activeForegroundMs,
        countdownMs: item.configurationSnapshot.timerDurationMs, revision: proof.revision, digest: proof.digest,
        result: result ? { digest: hash(JSON.stringify(result)), totalOccurrences: result.totalOccurrences,
          answeredCount: result.answeredOccurrenceIds.length, unansweredCount: result.unansweredOccurrenceIds.length,
          completedAt: result.completedAt } : null };
    });
    const premiumIdentity = profile.accountId ? premiumIdentityForAccount(profile.accountId) : null;
    const deadlineSessions = history.value.filter(item => item.configurationSnapshot.timer === "absoluteDeadline").map(item => {
      const proof = readTrainingSessionEnvelopeProof(item.id, productionTrackAdmissionContext);
      const result = readTrainingSessionResult(item.id, productionTrackAdmissionContext);
      if (!proof) throw androidClockProbeFailure("probe_scope_unavailable");
      return { idSha256: hash(item.id), modeId: item.modeId, status: item.status, startedAt: item.startedAt, completedAt: item.completedAt,
        configurationSha256: hash(JSON.stringify(item.configurationSnapshot)), timerKind: item.configurationSnapshot.timer,
        timerDeadlineAt: item.configurationSnapshot.timerDeadlineAt, timerDurationMs: item.configurationSnapshot.timerDurationMs,
        revision: proof.revision, digest: proof.digest,
        result: result ? { digest: hash(JSON.stringify(result)), totalOccurrences: result.totalOccurrences,
          answeredCount: result.answeredOccurrenceIds.length, unansweredCount: result.unansweredOccurrenceIds.length, completedAt: result.completedAt } : null };
    });
    const premium = premiumIdentity ? readCachedPremiumSnapshot(premiumIdentity) : null;
    const second = await readSlots();
    requireAndroidClockProbeIdentitySettled(readStartupTrace());
    if (!isActiveProfileStorageLeaseCurrent(lease) || getActiveStorageProfileOrNull()?.id !== profile.id) throw androidClockProbeFailure("probe_scope_unavailable");
    if (before.some((value, index) => storage.getString(stableKeys[index]!) !== value)
      || first.some((value, index) => value !== second[index])) throw androidClockProbeFailure("probe_observation_changed");
    return {
      profile: { kind: profile.kind, idSha256: hash(profile.id), accountSha256: hash(profile.accountId) },
      installation: installation ? { bindingState: installation.bindingState, accountSha256: hash(installation.accountId),
        datasetMatchesProfile: installation.localDatasetId === profile.id, installationSha256: hash(installation.installationId) } : null,
      binding: binding?.kind === "verified" ? { kind: binding.kind, accountSha256: hash(binding.binding.accountId),
        uidSha256: hash(binding.binding.firebaseUid), verificationRevision: binding.binding.verificationRevision, checksum: binding.binding.checksum } : { kind: binding?.kind ?? "not-account" },
      sync: { status: sync.status, accountSha256: hash(sync.accountId), pendingMutationCount: sync.pendingMutationCount,
        materialization: sync.materialization ? ("kind" in sync.materialization ? sync.materialization.kind : "guestMerge") : null,
        pendingConfirmation: sync.pendingConfirmation !== null, resetGuard: sync.resetGuard !== null,
        // Persisted failure strings are deliberately hashed rather than copied.
        failureSha256: hash(sync.lastFailureCode), conflictSha256: hash(sync.blockingConflictCode) },
      session: session ? { idSha256: hash(session.id), status: session.status, startedAt: session.startedAt,
        configurationSha256: hash(JSON.stringify(session.configurationSnapshot)), countdownMs: session.configurationSnapshot.timerDurationMs,
        timerKind: session.configurationSnapshot.timer, timerDeadlineAt: session.configurationSnapshot.timerDeadlineAt, activeForegroundMs: session.activeForegroundMs } : null,
      timer: timer ? { sessionSha256: hash(timer.sessionId), accumulatedForegroundMs: timer.accumulatedForegroundMs,
        checkpointRevision: timer.checkpointRevision, running: timer.running } : null,
      pendingJournal, simulations, deadlineSessions,
      premium: premium ? { state: premium.state, reason: premium.reason, mapVersion: premium.mapVersion, environment: premium.environment,
        sourceCount: premium.sources.length, providerExpiresAt: premium.providerExpiresAt, providerObservedAt: premium.providerObservedAt,
        serverObservedAt: premium.serverObservedAt } : null,
      startupTrace: readStartupTrace(),
      controlSlots: CONTROL_SLOTS.map(([name], index) => ({ name, present: first[index] !== null, sha256: hash(first[index]) })),
    };
  }, 5_000);
}

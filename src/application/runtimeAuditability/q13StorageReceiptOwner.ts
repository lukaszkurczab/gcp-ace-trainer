import { inspectExpoNodePackageInventory, inspectExpoNodePackageRootReadiness, type NodePackageRootReadiness, type Q13NodePackageInventory } from "../../content/runtime/nodePackageStorage";
import { isPatternlySmokeRuntime } from "../../infrastructure/runtime/runtimeMode";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { getActiveTrainingSessionDraft } from "../../storage/repositories/trainingSessionDraftRepository";
import { readActiveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { readTrainingAttempts } from "../../storage/repositories/trainingAttemptRepository";
import type { Q13ActorFence } from "../account/AccountSessionProvider";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { inspectQ13SecureAuthPersistence } from "../../infrastructure/firebase/secureAuthPersistence";
import { inspectQ13RecoveryOperationVault } from "../../infrastructure/security/recoveryOperationVault";
import { inspectQ13RecoveryCodeClipboard } from "../../infrastructure/security/recoveryCodeClipboard";
import { inspectQ13GuestPrivacyDraft } from "../../features/home/guestPrivacyDraft";
import { inspectPreparedQ13StorageInventory, inspectPreparedQ13StorageReadiness, type Q13StorageInventorySnapshot, type Q13StorageReadiness } from "../../storage/repositories/profileStorageRepository";

export type Q13FullStorageReceipt = Readonly<{
  kind: "observed" | "unavailable";
  storageReadiness: Q13StorageReadiness;
  inventory: Omit<Q13StorageInventorySnapshot, "packagePointerSources">;
  packageRoot: NodePackageRootReadiness;
  packages: Q13NodePackageInventory;
  actor: Readonly<{ kind: "ready" | "denied"; accountIdSha256?: string; profileIdSha256?: string; uidSha256?: string; activeSessionCount?: number; activeSessionSha256?: string; activeAnswerRecordCount?: number; activeAnswerRecordsSha256?: string } | { kind: "unavailable"; reason: Q13ActorUnavailableReason }>;
  secureStoreInventory: Readonly<{ kind: "observed"; slotCount: number; inventorySha256: string; authUserAffinity: "not_checked" | "absent" | "matches_current_sdk_uid" | "different_or_unavailable"; dynamicFirebaseNamespace: "unavailable" } | { kind: "unavailable"; reason: "storage_inventory_unavailable" | "profile_control_unavailable" | "encrypted_control_unavailable" | "secure_slot_unavailable" | "storage_changed" }>;
}>;

export type Q13ActorUnavailableReason =
  | "session_unavailable"
  | "actor_changed"
  | "premium_denied"
  | "premium_unavailable"
  | "profile_transition_pending"
  | "inventory_unavailable"
  | "control_unavailable"
  | "journal_present"
  | "logout_pending"
  | "session_fingerprint_unavailable"
  | "session_read_error";

type Q13ActorPremiumDecision = Readonly<{ kind: "allowed" } | { kind: "unavailable"; reason: Q13ActorUnavailableReason }>;

export function q13LogoutActorUnavailableReason(status: "clear" | "pending" | "unavailable"): Q13ActorUnavailableReason | null {
  if (status === "pending") return "logout_pending";
  if (status === "unavailable") return "control_unavailable";
  return null;
}

export type Q13CapabilityProbeReceipt = Readonly<
  | { kind: "unavailable"; reason: "runtime_not_enabled" }
  | (Q13FullStorageReceipt & { kind: "observed" })
>;

export function isQ13PremiumActorCurrent(
  actorFence: Q13ActorFence,
  readCurrentPremiumAccess: () => "allowed" | "denied" | "unavailable",
): boolean {
  return evaluateQ13PremiumActorFence(actorFence, readCurrentPremiumAccess).kind === "allowed";
}

function evaluateQ13PremiumActorFence(
  actorFence: Q13ActorFence,
  readCurrentPremiumAccess: () => "allowed" | "denied" | "unavailable",
): Q13ActorPremiumDecision {
  if (actorFence.kind !== "ready") return Object.freeze({ kind: "unavailable", reason: "session_unavailable" });
  if (!actorFence.isCurrent()) return Object.freeze({ kind: "unavailable", reason: "actor_changed" });
  const before = readCurrentPremiumAccess();
  if (before !== "allowed") return Object.freeze({ kind: "unavailable", reason: before === "denied" ? "premium_denied" : "premium_unavailable" });
  if (!actorFence.isCurrent()) return Object.freeze({ kind: "unavailable", reason: "actor_changed" });
  const after = readCurrentPremiumAccess();
  if (after !== "allowed") return Object.freeze({ kind: "unavailable", reason: after === "denied" ? "premium_denied" : "premium_unavailable" });
  return actorFence.isCurrent()
    ? Object.freeze({ kind: "allowed" })
    : Object.freeze({ kind: "unavailable", reason: "actor_changed" });
}

export function finalizeQ13StorageInventory(
  initial: Q13StorageInventorySnapshot,
  after: Q13StorageInventorySnapshot,
  readiness: Q13StorageReadiness,
  stable: boolean,
): Q13StorageInventorySnapshot {
  if (initial.kind === "unavailable") return initial;
  if (readiness.kind === "unavailable") return Object.freeze({ kind: "unavailable", complete: false, reason: readiness.reason });
  if (stable) return initial;
  if (after.kind === "unavailable") return after;
  return Object.freeze({ kind: "unavailable", complete: false, reason: "prepared_storage_changed" });
}

export function finalizeQ13PackageInventory(
  initial: Q13NodePackageInventory,
  after: Q13NodePackageInventory,
  stable: boolean,
): Q13NodePackageInventory {
  if (initial.kind === "unavailable") return initial;
  if (stable) return initial;
  if (after.kind === "unavailable") return after;
  return Object.freeze({ kind: "unavailable", reason: "file_inventory_invalid" });
}

export function fingerprintQ13ActiveSession(input: Readonly<{ session: unknown | null; draft: unknown | null; attempts: readonly Readonly<{ sessionId?: unknown }>[] }>): Readonly<{ activeSessionCount: number; activeSessionSha256: string; activeAnswerRecordCount: number; activeAnswerRecordsSha256: string }> | null {
  const sessionId = typeof input.session === "object" && input.session !== null && "id" in input.session && typeof input.session.id === "string" ? input.session.id : null;
  const sessionTrackId = typeof input.session === "object" && input.session !== null && "trackId" in input.session && typeof input.session.trackId === "string" ? input.session.trackId : null;
  if (input.draft !== null) {
    if (typeof input.draft !== "object" || input.draft === null || !sessionId || !sessionTrackId || !("sessionId" in input.draft) || !("trackId" in input.draft)
      || input.draft.sessionId !== sessionId || input.draft.trackId !== sessionTrackId) return null;
  }
  const attempts = sessionId ? input.attempts.filter((attempt) => attempt.sessionId === sessionId) : [];
  return Object.freeze({
    activeSessionCount: sessionId ? 1 : 0,
    activeSessionSha256: sha256Utf8(canonicalSerialize(input.session)),
    activeAnswerRecordCount: attempts.length + (input.draft ? 1 : 0),
    activeAnswerRecordsSha256: sha256Utf8(canonicalSerialize({ draft: input.draft, attempts })),
  });
}

/** The only Q13 probe owner; production and non-smoke builds never touch storage or the filesystem. */
export async function inspectQ13CapabilityProbe(
  actorFence: Q13ActorFence,
  readCurrentPremiumAccess: () => "allowed" | "denied" | "unavailable",
): Promise<Q13CapabilityProbeReceipt> {
  if (typeof __DEV__ === "undefined" || !__DEV__ || !isPatternlySmokeRuntime()) {
    return Object.freeze({ kind: "unavailable", reason: "runtime_not_enabled" });
  }
  const actorUidSha256 = actorFence.kind === "ready" ? actorFence.uidSha256 : null;
  const [readiness, storage, packageRoot] = await Promise.all([
    Promise.resolve().then(() => inspectPreparedQ13StorageReadiness()),
    Promise.resolve().then(() => inspectPreparedQ13StorageInventory(actorUidSha256)),
    Promise.resolve().then(() => inspectExpoNodePackageRootReadiness()),
  ]);
  const packageSources = storage.kind === "observed" ? storage.packagePointerSources ?? [] : null;
  const packages = packageSources
    ? await inspectExpoNodePackageInventory(packageSources)
    : Object.freeze({ kind: "unavailable" as const, reason: "pointer_source_unavailable" as const });
  const [authSlot, recoveryOperationSlot, clipboardSlot, guestPrivacySlot] = await Promise.all([
    inspectQ13SecureAuthPersistence(undefined, actorFence.kind === "ready" ? actorFence.isCurrentSdkUid : undefined), inspectQ13RecoveryOperationVault(), inspectQ13RecoveryCodeClipboard(), inspectQ13GuestPrivacyDraft(),
  ]);
  const secureStoreInventory = [authSlot, recoveryOperationSlot, clipboardSlot, guestPrivacySlot].every((entry) => entry.kind === "observed")
    && storage.kind === "observed" && storage.secureControl?.kind === "observed" && storage.control?.kind === "observed"
    ? Object.freeze({
        kind: "observed" as const,
        slotCount: 4 + storage.secureControl.slotCount + storage.control.slotCount,
        authUserAffinity: authSlot.kind === "observed" ? authSlot.userRecordAffinity : "not_checked",
        inventorySha256: sha256Utf8(JSON.stringify([
          ["firebase-auth-user", authSlot.kind === "observed" ? authSlot.userRecordSha256 : null, authSlot.kind === "observed" ? authSlot.userRecord : null, authSlot.kind === "observed" ? authSlot.userRecordAffinity : null],
          ["recovery-operation", recoveryOperationSlot.kind === "observed" ? recoveryOperationSlot.recordSha256 : null, recoveryOperationSlot.kind === "observed" ? recoveryOperationSlot.record : null],
          ["recovery-clipboard-marker", clipboardSlot.kind === "observed" ? clipboardSlot.markerSha256 : null, clipboardSlot.kind === "observed" ? clipboardSlot.marker : null],
          ["guest-privacy-draft", guestPrivacySlot.kind === "observed" ? guestPrivacySlot.draftSha256 : null, guestPrivacySlot.kind === "observed" ? guestPrivacySlot.draft : null],
          storage.secureControl,
          storage.control.slotInventorySha256,
        ])),
        dynamicFirebaseNamespace: "unavailable" as const,
      })
    : Object.freeze({
        kind: "unavailable" as const,
        reason: storage.kind !== "observed" ? "storage_inventory_unavailable" as const
          : storage.control?.kind !== "observed" ? "profile_control_unavailable" as const
            : storage.secureControl?.kind !== "observed" ? "encrypted_control_unavailable" as const
              : "secure_slot_unavailable" as const,
      });
  let actor: Q13FullStorageReceipt["actor"];
  if (actorFence.kind === "denied") actor = Object.freeze({ kind: "denied" });
  else {
    const premiumDecision = evaluateQ13PremiumActorFence(actorFence, readCurrentPremiumAccess);
    if (premiumDecision.kind === "unavailable") actor = Object.freeze({ kind: "unavailable", reason: premiumDecision.reason });
    else if (actorFence.kind !== "ready") actor = Object.freeze({ kind: "unavailable", reason: "session_unavailable" });
    else if (readiness.kind === "unavailable" && readiness.reason === "profile_transition_active") actor = Object.freeze({ kind: "unavailable", reason: "profile_transition_pending" });
    else if (storage.kind !== "observed") actor = Object.freeze({ kind: "unavailable", reason: "inventory_unavailable" });
    else if (storage.control?.kind !== "observed") actor = Object.freeze({ kind: "unavailable", reason: "control_unavailable" });
    else if (storage.control.journalState !== "absent") actor = Object.freeze({ kind: "unavailable", reason: "journal_present" });
    else {
      const logoutReason = q13LogoutActorUnavailableReason(storage.control.logoutActorStatus);
      if (logoutReason) actor = Object.freeze({ kind: "unavailable", reason: logoutReason });
      else {
        try {
          const session = readActiveTrainingSession();
          const draft = await getActiveTrainingSessionDraft();
          const attempts = readTrainingAttempts().value;
          const fingerprint = fingerprintQ13ActiveSession({ session, draft, attempts });
          if (!fingerprint) actor = Object.freeze({ kind: "unavailable", reason: "session_fingerprint_unavailable" });
          else {
            const afterSessionDecision = evaluateQ13PremiumActorFence(actorFence, readCurrentPremiumAccess);
            if (afterSessionDecision.kind === "unavailable") actor = Object.freeze({ kind: "unavailable", reason: afterSessionDecision.reason });
            else actor = Object.freeze({
              kind: "ready", accountIdSha256: actorFence.accountIdSha256, profileIdSha256: actorFence.profileIdSha256, uidSha256: actorFence.uidSha256,
              ...fingerprint,
            });
          }
        } catch { actor = Object.freeze({ kind: "unavailable", reason: "session_read_error" }); }
      }
    }
  }
  const [storageAfter, packagesAfter] = await Promise.all([
    inspectPreparedQ13StorageInventory(actorUidSha256),
    packageSources ? inspectExpoNodePackageInventory(packageSources) : Promise.resolve(packages),
  ]);
  const storageStable = storage.kind === "observed" && storageAfter.kind === "observed"
    && storage.physicalInventorySha256 === storageAfter.physicalInventorySha256
    && storage.profileInventorySha256 === storageAfter.profileInventorySha256
    && storage.registryGeneration === storageAfter.registryGeneration
    && storage.registryChecksumSha256 === storageAfter.registryChecksumSha256
    && storage.control?.kind === "observed" && storageAfter.control?.kind === "observed"
    && storage.control.slotInventorySha256 === storageAfter.control.slotInventorySha256
    && storage.control.accountBindingState === storageAfter.control.accountBindingState
    && storage.secureControl?.kind === "observed" && storageAfter.secureControl?.kind === "observed"
    && storage.secureControl.inventorySha256 === storageAfter.secureControl.inventorySha256;
  const packagesStable = packages.kind === "observed" && packagesAfter.kind === "observed"
    && packages.pointerInventorySha256 === packagesAfter.pointerInventorySha256
    && packages.physicalFileInventorySha256 === packagesAfter.physicalFileInventorySha256;
  const finalStorage = finalizeQ13StorageInventory(storage, storageAfter, readiness, storageStable);
  const finalPackages = finalizeQ13PackageInventory(packages, packagesAfter, packagesStable);
  const finalSecureStoreInventory = storageStable ? secureStoreInventory
    : Object.freeze({ kind: "unavailable" as const, reason: storage.kind === "observed" ? "storage_changed" as const : "storage_inventory_unavailable" as const });
  if (actor.kind === "ready") {
    const finalDecision = evaluateQ13PremiumActorFence(actorFence, readCurrentPremiumAccess);
    if (finalDecision.kind === "unavailable") actor = Object.freeze({ kind: "unavailable", reason: finalDecision.reason });
  }
  const { packagePointerSources: _privateSources, ...publicStorage } = finalStorage;
  return Object.freeze({ kind: "observed", storageReadiness: readiness, inventory: Object.freeze(publicStorage), packageRoot, packages: finalPackages, actor, secureStoreInventory: finalSecureStoreInventory });
}

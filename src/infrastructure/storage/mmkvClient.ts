export interface KeyValueStorage {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  remove(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): readonly string[];
}

import { openProfileStorageRouter, ProfileStorageError, ProfileTransitionActiveError, type GuestRemoval34ExpectedState, type GuestRemoval34Receipt, type ProfileStorageRouter, type StorageProfile } from "./profileStorageRouter";
import { STORAGE_KEYS } from "../../storage/keys";
import { sha256Utf8 } from "../identity/sha256";

let client: KeyValueStorage | null = null;
let profileRouter: ProfileStorageRouter | null = null;
type OpenedProfileStorage = Readonly<{ base: KeyValueStorage; router: ProfileStorageRouter }>;
type PreparedProfileStorage = OpenedProfileStorage & Readonly<{ generation: number }>;
let preparedStorage: PreparedProfileStorage | null = null;
let activePreparedStorage: PreparedProfileStorage | null = null;
let preparation: Promise<PreparedProfileStorage> | null = null;
let testPreparationFactory: (() => Promise<Readonly<{ base: KeyValueStorage; router: ProfileStorageRouter }>>) | null = null;
let testProfileTransitionReload: (() => Promise<void>) | null = null;
let profileStorageGeneration = 0;
const readyListeners = new Set<() => void>();
const profileTransitionListeners = new Set<() => void>();
let profileTransitionActive = false;
let profileStorageReadyNotified = false;
const MODERN_PROFILE_PREFIX = "patternly:profile:v1:";
const BIZQ01_CANARY_FAMILY_PREFIX = `${MODERN_PROFILE_PREFIX}bizq01-canary-`;
const BIZQ01_REMOVED_GUEST_ID_SHA256 = "b880a3a8d1530601f6f1ed2f244078468f09f51f9d68ba5f6d3cec95cfa5e52d";

export type GuestRemovalPostcoldPrefixReceipt = Readonly<{
  schemaVersion: "bizq01-guest-removal-postcold-prefix-v1";
  result: "observed" | "failed";
  stage: string;
  oldPrefixKeyCount?: number;
}>;

export type GuestRemovalCanaryReceipt = Readonly<{
  schemaVersion: "bizq01-guest-removal-canary-v1";
  result: "passed" | "failed";
  stage: string;
  canaryValueSha256?: string;
  accountStateSha256?: string;
  globalStateSha256?: string;
  protectedAdapterStateSha256?: string;
  protectedStateUnchanged?: boolean;
  cleanupVerified?: boolean;
}>;

export type GuestRemovalReconciliationReceipt = Readonly<{
  schemaVersion: "bizq01-guest-removal-reconciliation-v1";
  result: "observed" | "failed";
  stage: string;
  profileTransitionActive?: boolean;
  activeLearningWorkPresent?: boolean;
  guestKind?: string;
  selectedGuestMatches?: boolean;
  installationIdSha256?: string;
  datasetIdSha256?: string;
  accountProfileCount?: number;
  guestProfileCount?: number;
  profileIdentityInventorySha256?: string;
  guestKeyCount?: number;
  guestRecordCount?: number;
  guestMetadataKeyCount?: number;
  guestKeyInventorySha256?: string;
  canaryFamilyKeyCount?: number;
  canaryFamilyKeyInventorySha256?: string;
  accountStateSha256?: string;
  globalStateSha256?: string;
  protectedAdapterStateSha256?: string;
}>;

type GuestRemovalCanaryBaseline = Readonly<{
  accountStateSha256: string;
  globalStateSha256: string;
  protectedAdapterStateSha256: string;
}>;

function hashStorageEntries(base: KeyValueStorage, keys: readonly string[]): string {
  const entries = [...keys].sort().map((key) => {
    const value = base.getString(key);
    if (value === undefined) throw new Error("guest_removal_canary_snapshot_unreadable");
    return [sha256Utf8(key), sha256Utf8(value)];
  });
  return sha256Utf8(JSON.stringify(entries));
}

function snapshotGuestRemovalCanaryState(base: KeyValueStorage, router: ProfileStorageRouter, namespace: string): GuestRemovalCanaryBaseline {
  const keys = [...base.getAllKeys()];
  if (keys.some((key) => typeof key !== "string") || new Set(keys).size !== keys.length) throw new Error("guest_removal_canary_key_inventory_invalid");
  if (keys.some((key) => key.startsWith(namespace))) throw new Error("guest_removal_canary_namespace_occupied");
  const accountPrefixes = router.registry.profiles.filter((profile) => profile.kind === "account")
    .map((profile) => `${MODERN_PROFILE_PREFIX}${profile.id}:`);
  const accountKeys = keys.filter((key) => accountPrefixes.some((prefix) => key.startsWith(prefix)));
  const globalKeys = keys.filter((key) => !key.startsWith(MODERN_PROFILE_PREFIX));
  return Object.freeze({
    accountStateSha256: hashStorageEntries(base, accountKeys),
    globalStateSha256: hashStorageEntries(base, globalKeys),
    protectedAdapterStateSha256: hashStorageEntries(base, keys),
  });
}

function guestRemovalCanaryFailure(
  stage: string,
  facts: Partial<GuestRemovalCanaryBaseline> = {},
  extra: Pick<GuestRemovalCanaryReceipt, "canaryValueSha256" | "protectedStateUnchanged" | "cleanupVerified"> = {},
): GuestRemovalCanaryReceipt {
  return Object.freeze({ schemaVersion: "bizq01-guest-removal-canary-v1", result: "failed", stage, ...facts, ...extra });
}

function activeLearningWorkPresent(router: ProfileStorageRouter): boolean {
  const workKeys = [
    STORAGE_KEYS.ACTIVE_TRAINING_SESSION,
    STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT,
    STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER,
    STORAGE_KEYS.ACTIVE_JOURNAL,
  ];
  return workKeys.some((key) => router.storage.getString(key) !== undefined);
}

function guestProfileIdentityInventory(router: ProfileStorageRouter): Readonly<{
  accountProfileCount: number;
  guestProfileCount: number;
  profileIdentityInventorySha256: string;
}> {
  const identities = router.registry.profiles.map((profile) => ({
    idSha256: sha256Utf8(profile.id),
    kind: profile.kind,
    accountIdSha256: profile.accountId === null ? null : sha256Utf8(profile.accountId),
  })).sort((left, right) => left.idSha256.localeCompare(right.idSha256));
  return Object.freeze({
    accountProfileCount: identities.filter((profile) => profile.kind === "account").length,
    guestProfileCount: identities.filter((profile) => profile.kind === "guest" || profile.kind === "legacy_guest").length,
    profileIdentityInventorySha256: sha256Utf8(JSON.stringify(identities)),
  });
}

function snapshotGuestRemovalReconciliationState(base: KeyValueStorage, router: ProfileStorageRouter): GuestRemovalCanaryBaseline & Readonly<{
  canaryFamilyKeyCount: number;
  canaryFamilyKeyInventorySha256: string;
  guestKeyCount: number;
  guestRecordCount: number;
  guestMetadataKeyCount: number;
  guestKeyInventorySha256: string;
}> {
  const keys = [...base.getAllKeys()];
  if (keys.some((key) => typeof key !== "string") || new Set(keys).size !== keys.length) throw new Error("guest_removal_reconciliation_key_inventory_invalid");
  const canaryFamilyKeys = keys.filter((key) => key.startsWith(BIZQ01_CANARY_FAMILY_PREFIX)).sort();
  const accountPrefixes = router.registry.profiles.filter((profile) => profile.kind === "account")
    .map((profile) => `${MODERN_PROFILE_PREFIX}${profile.id}:`);
  const accountKeys = keys.filter((key) => accountPrefixes.some((prefix) => key.startsWith(prefix)));
  const globalKeys = keys.filter((key) => !key.startsWith(MODERN_PROFILE_PREFIX));
  const guestLogicalKeys = [...router.storage.getAllKeys()].sort();
  if (guestLogicalKeys.some((key) => typeof key !== "string") || new Set(guestLogicalKeys).size !== guestLogicalKeys.length) throw new Error("guest_removal_reconciliation_guest_inventory_invalid");
  const metadataNames = new Set<string>([STORAGE_KEYS.GUEST_INSTALLATION, STORAGE_KEYS.GUEST_ACCESS, STORAGE_KEYS.METADATA]);
  const guestMetadataKeys = guestLogicalKeys.filter((key) => metadataNames.has(key));
  const recordKeys = guestLogicalKeys.filter((key) => !metadataNames.has(key));
  const knownRecord = (key: string) => key === STORAGE_KEYS.ACTIVE_TRACK
    || key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION || key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT
    || key === STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER || key === STORAGE_KEYS.ACTIVE_JOURNAL
    || key === STORAGE_KEYS.TRAINING_SESSION_INDEX || key.startsWith(STORAGE_KEYS.trainingSession(""))
    || (key.startsWith(STORAGE_KEYS.trainingSessionResult("")) && key.length > STORAGE_KEYS.trainingSessionResult("").length)
    || key === STORAGE_KEYS.TRAINING_ATTEMPT_INDEX || key.startsWith("patternly:canonical:v1:training-attempt:")
    || key === STORAGE_KEYS.REVIEW_INDEX || key.startsWith("patternly:canonical:v1:review-entry:")
    || key === STORAGE_KEYS.SETTINGS || key.startsWith("patternly:canonical:v1:goal:")
    || key.startsWith("patternly:canonical:v1:learning-plan:") || key === STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES
    || key === STORAGE_KEYS.NOTIFICATION_SETTINGS || key === STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL
    || key === STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX || key.startsWith("patternly:canonical:v1:archival-history:")
    || key === STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX || key.startsWith("patternly:canonical:v1:unavailable-active:")
    || key === STORAGE_KEYS.UNAVAILABLE_REVIEW_INDEX || key.startsWith("patternly:canonical:v1:unavailable-review:")
    || key === STORAGE_KEYS.ACCOUNT_SYNC || key === STORAGE_KEYS.ACCOUNT_SIGN_OUT || key === STORAGE_KEYS.ACCOUNT_DELETION;
  if (recordKeys.some((key) => !knownRecord(key))) throw new Error("guest_removal_reconciliation_guest_inventory_invalid");
  return Object.freeze({
    accountStateSha256: hashStorageEntries(base, accountKeys),
    globalStateSha256: hashStorageEntries(base, globalKeys),
    protectedAdapterStateSha256: hashStorageEntries(base, keys),
    canaryFamilyKeyCount: canaryFamilyKeys.length,
    canaryFamilyKeyInventorySha256: sha256Utf8(JSON.stringify(canaryFamilyKeys.map(sha256Utf8))),
    guestKeyCount: guestLogicalKeys.length,
    guestRecordCount: recordKeys.length,
    guestMetadataKeyCount: guestMetadataKeys.length,
    guestKeyInventorySha256: sha256Utf8(JSON.stringify(guestLogicalKeys.map(sha256Utf8))),
  });
}

export type PreparedStorage = Readonly<{ base: KeyValueStorage; router: ProfileStorageRouter }>;
export type PreparedProfileState = Readonly<{
  profiles: readonly StorageProfile[];
  selectedProfile: StorageProfile;
  isFreshInstallation: boolean;
}>;

function closePublishedProfileStorage(): void {
  profileStorageGeneration += 1;
  client = null;
  profileRouter = null;
  activePreparedStorage = null;
  profileStorageReadyNotified = false;
}

async function openProductionProfileStorage(generation: number): Promise<PreparedProfileStorage> {
  const { openEncryptedStorage, STORAGE_MIGRATION_MARKER_KEY } = await import("./encryptedStorageBootstrap");
  const { createNativeEncryptedStoragePlatform } = await import("./encryptedStorageNative");
  const platform = createNativeEncryptedStoragePlatform();
  const result = await openEncryptedStorage(platform);
  const base: KeyValueStorage = {
    getString: (key) => result.storage.getString(key),
    setString: (key, value) => { result.storage.setString(key, value); },
    remove: (key) => { result.storage.remove(key); },
    contains: (key) => key !== STORAGE_MIGRATION_MARKER_KEY && result.storage.getString(key) !== undefined,
    getAllKeys: () => result.storage.getAllKeys().filter((key) => key !== STORAGE_MIGRATION_MARKER_KEY),
  };
  profileTransitionActive = false;
  const router = await openProfileStorageRouter(base, platform.manifestStore, {
    isTransitionActive: () => profileTransitionActive || profileStorageGeneration !== generation,
    onBeforeProfileCommit: beginProfileTransition,
  });
  return { base, router, generation };
}

async function ensurePreparedStorage(): Promise<PreparedProfileStorage> {
  if (preparedStorage) return preparedStorage;
  if (!preparation) {
    const generation = profileStorageGeneration;
    const open = testPreparationFactory
      ? () => testPreparationFactory!()
      : () => openProductionProfileStorage(generation);
    preparation = open().then((opened) => {
      const prepared = { ...opened, generation };
      preparedStorage = prepared;
      return prepared;
    }).catch((error) => {
      preparedStorage = null;
      preparation = null;
      closePublishedProfileStorage();
      throw error;
    });
  }
  return preparation;
}

async function preparedStorageForDecision(): Promise<PreparedProfileStorage> {
  const prepared = preparedStorage ?? await ensurePreparedStorage();
  if (prepared !== preparedStorage || prepared.generation !== profileStorageGeneration) {
    closePublishedProfileStorage();
    preparedStorage = null;
    preparation = null;
    throw new Error("prepared_profile_stale");
  }
  return prepared;
}

async function refreshPreparedAfterSelection(
  prepared: PreparedProfileStorage,
  canContinue: () => boolean,
): Promise<void> {
  let router: ProfileStorageRouter;
  try {
    router = await prepared.router.refresh();
  } catch (error) {
    if (preparedStorage === prepared) {
      preparedStorage = null;
      preparation = null;
      closePublishedProfileStorage();
    }
    throw error;
  }
  if (preparedStorage !== prepared || prepared.generation !== profileStorageGeneration || client) {
    throw new Error("prepared_profile_stale");
  }
  const refreshed = { ...prepared, router };
  preparedStorage = refreshed;
  preparation = Promise.resolve(refreshed);
  profileTransitionActive = false;
  if (!canContinue()) throw new Error("profile_transition_cancelled");
}

/** Opens encrypted storage and its control registry without publishing profile-scoped storage. */
export async function prepareProfileStorage(): Promise<StorageProfile> {
  if (!preparedStorage && !preparation) closePublishedProfileStorage();
  try {
    return (await ensurePreparedStorage()).router.profile;
  } catch (error) {
    closePublishedProfileStorage();
    throw error;
  }
}

/** Reads only the prepared router registry and never opens a profile-scoped client. */
export async function inspectPreparedProfileState(): Promise<PreparedProfileState> {
  const { router } = await preparedStorageForDecision();
  const selectedProfile = router.registry.profiles.find((profile) => profile.id === router.registry.selectedProfileId);
  if (!selectedProfile) throw new Error("profile_registry_corrupt");
  return Object.freeze({
    profiles: router.registry.profiles,
    selectedProfile,
    isFreshInstallation: router.isFreshInstallation,
  });
}

/** Validates only the exact selected guest's access and installation markers before publication. */
export async function validatePreparedGuestAccess(profileId: string): Promise<boolean> {
  const { router } = await preparedStorageForDecision();
  if (client || router.registry.selectedProfileId !== profileId) return false;
  return router.hasValidGuestAccess(profileId);
}

/** Selects the authenticated backend account profile while storage remains closed. */
export async function selectPreparedAccountProfile(
  accountId: string,
  canContinue: () => boolean = () => true,
  options: Readonly<{ recoverBoundGuest?: boolean }> = {},
): Promise<Readonly<{ profile: StorageProfile; changed: boolean }>> {
  const prepared = await preparedStorageForDecision();
  const { router } = prepared;
  if (client || !canContinue()) throw new Error("profile_transition_cancelled");
  const previous = router.registry.profiles.find((profile) => profile.id === router.registry.selectedProfileId);
  if (!previous) throw new Error("profile_registry_corrupt");
  const profile = (options.recoverBoundGuest ? await router.promoteSelectedBoundGuest(accountId, canContinue) : null)
    ?? await router.selectAccount(accountId, canContinue);
  const changed = profile.id !== previous.id || profile.kind !== previous.kind;
  if (!canContinue() && !changed) throw new Error("profile_transition_cancelled");
  if (changed) await refreshPreparedAfterSelection(prepared, canContinue);
  return Object.freeze({ profile, changed });
}

/**
 * Reopens a preserved guest without reading its payload. An implicit choice is
 * allowed only when the selected profile is a guest or exactly one guest exists.
 */
export async function selectPreparedGuestProfile(
  profileId?: string,
  canContinue: () => boolean = () => true,
): Promise<Readonly<{ profile: StorageProfile; changed: boolean }>> {
  const prepared = await preparedStorageForDecision();
  const { router } = prepared;
  if (client || !canContinue()) throw new Error("profile_transition_cancelled");
  const previous = router.registry.profiles.find((profile) => profile.id === router.registry.selectedProfileId);
  if (!previous) throw new Error("profile_registry_corrupt");
  const guests = router.registry.profiles.filter((profile) => profile.kind === "guest" || profile.kind === "legacy_guest");
  const selectedIsGuest = previous.kind === "guest" || previous.kind === "legacy_guest";
  let targetId = profileId;
  if (targetId === undefined) {
    if (selectedIsGuest) targetId = previous.id;
    else if (guests.length === 1) targetId = guests[0]!.id;
    else if (guests.length > 1) throw new ProfileStorageError("prepared_guest_choice_required");
  }
  const profile = targetId === undefined
    ? await router.selectGuest(canContinue)
    : await router.selectExistingGuest(targetId, canContinue);
  const changed = profile.id !== previous.id || profile.kind !== previous.kind;
  if (!canContinue() && !changed) throw new Error("profile_transition_cancelled");
  if (changed) await refreshPreparedAfterSelection(prepared, canContinue);
  return Object.freeze({ profile, changed });
}

/** Closes published storage and restores its router metadata for another safe decision. */
export function closeActiveProfileStorage(): void {
  if (!client) return;
  const retained = activePreparedStorage;
  client = null;
  profileRouter = null;
  activePreparedStorage = null;
  if (retained && retained.generation === profileStorageGeneration) {
    preparedStorage = retained;
    preparation = Promise.resolve(retained);
  }
}

/** Purpose-bound one-time maintenance operation; publication resumes only after journaled removal completes. */
export async function removeOriginalGuest34(expected: GuestRemoval34ExpectedState): Promise<GuestRemoval34Receipt> {
  const prepared = activePreparedStorage;
  const router = profileRouter;
  if (!client || !prepared || !router || prepared.router !== router || profileTransitionActive) {
    return Object.freeze({ schemaVersion: "bizq01-guest-removal-34-v1", result: "failed", stage: "active_profile_unavailable" });
  }
  let receipt: GuestRemoval34Receipt;
  try { receipt = await router.removeOriginalGuest34(expected); }
  catch { receipt = Object.freeze({ schemaVersion: "bizq01-guest-removal-34-v1", result: "failed", stage: "transaction_unavailable" }); }
  if (receipt.result !== "passed") {
    if (profileTransitionActive) closeActiveProfileStorage();
    return receipt;
  }
  closeActiveProfileStorage();
  try {
    const refreshed = await router.refresh();
    if (refreshed.profile.kind !== "guest" || refreshed.profile.id === router.profile.id || refreshed.registry.profiles.length !== 10
      || refreshed.registry.profiles.filter((profile) => profile.kind === "account").length !== 9
      || refreshed.registry.profiles.some((profile) => profile.id === router.profile.id)) throw new Error("replacement_profile_invalid");
    const next = { ...prepared, router: refreshed };
    preparedStorage = next;
    preparation = Promise.resolve(next);
    profileTransitionActive = false;
    activatePreparedProfile(refreshed.profile.id, refreshed.profile.kind);
    return receipt;
  } catch {
    beginProfileTransition();
    closeActiveProfileStorage();
    return Object.freeze({ schemaVersion: "bizq01-guest-removal-34-v1", result: "failed", stage: "replacement_publication_failed" });
  }
}

/** Publishes only the exact profile prepared by the router. A mismatch leaves storage closed. */
export function activatePreparedProfile(profileId: string, kind: StorageProfile["kind"], options: Readonly<{ deferReadyNotification?: boolean }> = {}): KeyValueStorage {
  if (profileTransitionActive) throw new ProfileTransitionActiveError();
  const prepared = preparedStorage;
  const profile = prepared?.router.profile;
  if (!prepared || prepared.generation !== profileStorageGeneration || !profile || profile.id !== profileId || profile.kind !== kind) {
    preparedStorage = null;
    preparation = null;
    closePublishedProfileStorage();
    throw new Error("prepared_profile_mismatch");
  }
  profileTransitionActive = false;
  profileRouter = prepared.router;
  activePreparedStorage = prepared;
  const generation = prepared.generation;
  const checkPublished = () => {
    if (profileStorageGeneration !== generation || profileTransitionActive || client !== publishedStorage) throw new ProfileTransitionActiveError();
  };
  const scopedStorage = prepared.router.storage;
  const publishedStorage: KeyValueStorage = {
    getString(key) { checkPublished(); return scopedStorage.getString(key); },
    setString(key, value) { checkPublished(); scopedStorage.setString(key, value); },
    remove(key) { checkPublished(); scopedStorage.remove(key); },
    contains(key) { checkPublished(); return scopedStorage.contains(key); },
    getAllKeys() { checkPublished(); return scopedStorage.getAllKeys(); },
  };
  client = Object.freeze(publishedStorage);
  preparedStorage = null;
  preparation = null;
  profileStorageReadyNotified = false;
  if (!options.deferReadyNotification) notifyProfileStorageReady();
  return client;
}

/** Notifies preferences/content listeners after the account access gate has approved the active scope. */
export function notifyProfileStorageReady(): void {
  if (!client || profileStorageReadyNotified) return;
  profileStorageReadyNotified = true;
  try {
    for (const listener of readyListeners) listener();
  } catch (error) {
    closePublishedProfileStorage();
    throw error;
  }
}

export function onKeyValueStorageReady(listener: () => void): () => void {
  readyListeners.add(listener);
  if (client && profileStorageReadyNotified) listener();
  return () => { readyListeners.delete(listener); };
}

export function getActiveStorageProfile(): StorageProfile {
  if (!profileRouter) throw new Error("encrypted_storage_not_initialized");
  return profileRouter.profile;
}

export function getActiveStorageProfileOrNull(): StorageProfile | null { return profileRouter?.profile ?? null; }

export function beginProfileTransition(): void {
  if (profileTransitionActive) return;
  profileTransitionActive = true;
  for (const listener of profileTransitionListeners) listener();
}

export function isProfileTransitionActive(): boolean { return profileTransitionActive; }

/** Stage 1 bounded canary and read-only reconciliation for the reviewed BIZQ-01 Guest removal. */
export function inspectBizq01GuestRemoval34Canary(
  expectedDatasetIdSha256: string,
  expectedInstallationIdSha256: string,
): GuestRemovalReconciliationReceipt {
  const fail = (stage: string, extra: Partial<GuestRemovalReconciliationReceipt> = {}): GuestRemovalReconciliationReceipt =>
    Object.freeze({ schemaVersion: "bizq01-guest-removal-reconciliation-v1", result: "failed", stage, ...extra });
  if (!/^[a-f0-9]{64}$/u.test(expectedDatasetIdSha256) || !/^[a-f0-9]{64}$/u.test(expectedInstallationIdSha256)) return fail("input_invalid");
  const prepared = activePreparedStorage;
  const router = profileRouter;
  if (!client || !prepared || !router || prepared.router !== router) return fail("active_profile_unavailable");
  const profile = router.profile;
  const guests = router.registry.profiles.filter((candidate) => candidate.kind === "guest" || candidate.kind === "legacy_guest");
  if (profile.kind !== "guest" || profile.accountId !== null || router.registry.selectedProfileId !== profile.id || guests.length !== 1
    || !router.hasExactUnboundModernGuest(profile.id, expectedInstallationIdSha256, expectedDatasetIdSha256)) {
    return fail("expected_guest_mismatch", { profileTransitionActive });
  }
  let workPresent: boolean;
  try { workPresent = activeLearningWorkPresent(router); }
  catch { return fail("active_learning_state_unavailable", { profileTransitionActive, guestKind: profile.kind, selectedGuestMatches: true }); }
  if (workPresent) return fail("active_learning_work_present", { profileTransitionActive, activeLearningWorkPresent: true, guestKind: profile.kind, selectedGuestMatches: true });
  let snapshot: ReturnType<typeof snapshotGuestRemovalReconciliationState>;
  try { snapshot = snapshotGuestRemovalReconciliationState(prepared.base, router); }
  catch { return fail("protected_state_unavailable", { profileTransitionActive, activeLearningWorkPresent: false, guestKind: profile.kind, selectedGuestMatches: true }); }
  const identities = guestProfileIdentityInventory(router);
  return Object.freeze({
    schemaVersion: "bizq01-guest-removal-reconciliation-v1",
    result: "observed",
    stage: snapshot.canaryFamilyKeyCount === 0 ? "complete" : "canary_family_nonempty",
    profileTransitionActive,
    activeLearningWorkPresent: false,
    guestKind: profile.kind,
    selectedGuestMatches: true,
    installationIdSha256: expectedInstallationIdSha256,
    datasetIdSha256: expectedDatasetIdSha256,
    ...identities,
    ...snapshot,
  });
}

/** Read-only, purpose-bound check for residual physical keys under the exact removed Guest ID. */
export function inspectRemovedOriginalGuest34(
  expectedReplacementDatasetIdSha256: string,
  expectedInstallationIdSha256: string,
): GuestRemovalPostcoldPrefixReceipt {
  const fail = (stage: string): GuestRemovalPostcoldPrefixReceipt =>
    Object.freeze({ schemaVersion: "bizq01-guest-removal-postcold-prefix-v1", result: "failed", stage });
  if (!/^[a-f0-9]{64}$/u.test(expectedReplacementDatasetIdSha256)
    || !/^[a-f0-9]{64}$/u.test(expectedInstallationIdSha256)) return fail("input_invalid");

  const reconciliation = inspectBizq01GuestRemoval34Canary(expectedReplacementDatasetIdSha256, expectedInstallationIdSha256);
  if (reconciliation.result !== "observed") return fail("guest_reconciliation_failed");
  if (reconciliation.profileTransitionActive !== false) return fail("profile_transition_active");
  if (reconciliation.activeLearningWorkPresent !== false || reconciliation.guestKind !== "guest"
    || reconciliation.selectedGuestMatches !== true || reconciliation.datasetIdSha256 !== expectedReplacementDatasetIdSha256
    || reconciliation.accountProfileCount !== 9 || reconciliation.guestProfileCount !== 1) return fail("guest_reconciliation_failed");

  const prepared = activePreparedStorage;
  const router = profileRouter;
  if (!client || !prepared || !router || prepared.router !== router) return fail("active_profile_unavailable");
  try {
    const keys = prepared.base.getAllKeys();
    if (keys.some((key) => typeof key !== "string") || new Set(keys).size !== keys.length) return fail("protected_state_unavailable");
    const profileIdPattern = /^patternly:profile:v1:([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}):/iu;
    let oldPrefixKeyCount = 0;
    for (const key of keys) {
      const match = profileIdPattern.exec(key);
      if (match && sha256Utf8(match[1]!) === BIZQ01_REMOVED_GUEST_ID_SHA256) oldPrefixKeyCount += 1;
    }
    return Object.freeze({
      schemaVersion: "bizq01-guest-removal-postcold-prefix-v1",
      result: "observed",
      stage: oldPrefixKeyCount === 0 ? "complete" : "old_prefix_present",
      oldPrefixKeyCount,
    });
  } catch {
    return fail("protected_state_unavailable");
  }
}

export function runBizq01GuestRemoval34Canary(
  expectedDatasetIdSha256: string,
  expectedInstallationIdSha256: string,
  nonce: string,
): GuestRemovalCanaryReceipt {
  if (!/^[a-f0-9]{64}$/u.test(expectedDatasetIdSha256) || !/^[a-f0-9]{64}$/u.test(expectedInstallationIdSha256)
    || !/^[a-f0-9]{64}$/u.test(nonce)) return guestRemovalCanaryFailure("input_invalid");
  const prepared = activePreparedStorage;
  const router = profileRouter;
  if (!client || !prepared || !router || prepared.router !== router || profileTransitionActive) return guestRemovalCanaryFailure("active_profile_unavailable");
  const profile = router.profile;
  const guests = router.registry.profiles.filter((candidate) => candidate.kind === "guest" || candidate.kind === "legacy_guest");
  if (profile.kind !== "guest" || profile.accountId !== null || router.registry.selectedProfileId !== profile.id || guests.length !== 1
    || !router.hasExactUnboundModernGuest(profile.id, expectedInstallationIdSha256, expectedDatasetIdSha256)) {
    return guestRemovalCanaryFailure("expected_guest_mismatch");
  }
  try { if (activeLearningWorkPresent(router)) return guestRemovalCanaryFailure("active_learning_work_present"); }
  catch { return guestRemovalCanaryFailure("active_learning_state_unavailable"); }
  try { beginProfileTransition(); } catch { return guestRemovalCanaryFailure("transition_barrier_failed"); }

  const base = prepared.base;
  const namespace = `${BIZQ01_CANARY_FAMILY_PREFIX}${nonce}:`;
  const key = `${namespace}adapter-check:${nonce}`;
  const value = JSON.stringify({ schemaVersion: "bizq01-guest-removal-canary-value-v1", nonce });
  const canaryValueSha256 = sha256Utf8(value);
  let baseline: GuestRemovalCanaryBaseline;
  try { baseline = snapshotGuestRemovalCanaryState(base, router, namespace); }
  catch { return guestRemovalCanaryFailure("protected_baseline_unavailable"); }

  let writeAttempted = false;
  let operationFailure: string | null = null;
  let cleanupFailed = false;
  try {
    writeAttempted = true;
    base.setString(key, value);
    if (!base.getAllKeys().includes(key)) operationFailure = "canary_enumeration_failed";
    else if (base.getString(key) !== value) operationFailure = "canary_readback_failed";
  } catch { operationFailure = "canary_adapter_operation_failed"; }
  finally {
    if (writeAttempted) {
      try { base.remove(key); } catch { cleanupFailed = true; }
    }
  }

  let cleanupVerified = false;
  let after: GuestRemovalCanaryBaseline | null = null;
  try {
    cleanupVerified = !base.getAllKeys().includes(key) && base.getString(key) === undefined;
    if (cleanupVerified) after = snapshotGuestRemovalCanaryState(base, router, namespace);
  } catch { cleanupVerified = false; }
  const protectedStateUnchanged = after !== null
    && after.accountStateSha256 === baseline.accountStateSha256
    && after.globalStateSha256 === baseline.globalStateSha256
    && after.protectedAdapterStateSha256 === baseline.protectedAdapterStateSha256;
  const facts = { ...baseline, canaryValueSha256, protectedStateUnchanged, cleanupVerified: cleanupVerified && !cleanupFailed };
  if (cleanupFailed || !cleanupVerified) return guestRemovalCanaryFailure("canary_cleanup_failed", facts);
  if (operationFailure) return guestRemovalCanaryFailure(operationFailure, facts);
  if (!protectedStateUnchanged) return guestRemovalCanaryFailure("protected_state_changed", facts);
  return Object.freeze({ schemaVersion: "bizq01-guest-removal-canary-v1", result: "passed", stage: "complete", ...facts });
}

export function onProfileTransitionChanged(listener: () => void): () => void {
  profileTransitionListeners.add(listener);
  return () => { profileTransitionListeners.delete(listener); };
}

export async function continueAsGuestInNewProfile(): Promise<void> {
  if (!profileRouter) throw new Error("encrypted_storage_not_initialized");
  await profileRouter.selectGuest();
  await reloadForProfileTransition();
}

export async function selectAccountProfileAndRestart(
  accountId: string,
  canContinue: () => boolean = () => true,
  options: Readonly<{ recoverBoundGuest?: boolean }> = {},
): Promise<boolean> {
  if (!profileRouter) throw new Error("encrypted_storage_not_initialized");
  const selected = (options.recoverBoundGuest ? await profileRouter.promoteSelectedBoundGuest(accountId, canContinue) : null)
    ?? await profileRouter.selectAccount(accountId, canContinue);
  const changed = selected.id !== profileRouter.profile.id || selected.kind !== profileRouter.profile.kind;
  if (!changed) return false;
  await reloadForProfileTransition();
  return true;
}

export async function reloadForProfileTransition(): Promise<void> {
  if (!profileTransitionActive) throw new Error("profile_transition_not_started");
  if (testProfileTransitionReload) {
    await testProfileTransitionReload();
    return;
  }
  const { reloadAppAsync } = await import("expo");
  await reloadAppAsync("Patternly local data profile changed");
}

export function getKeyValueStorage(): KeyValueStorage {
  if (!client) {
    throw new Error("encrypted_storage_not_initialized");
  }
  return client;
}

/** Destructive recovery used only after the user confirms an unrecoverable key loss. */
export async function removeUnavailableEncryptedStorage(): Promise<void> {
  const { resetUnavailableEncryptedStorage } = await import("./encryptedStorageBootstrap");
  const { createNativeEncryptedStoragePlatform } = await import("./encryptedStorageNative");
  await resetUnavailableEncryptedStorage(createNativeEncryptedStoragePlatform());
  closePublishedProfileStorage();
  preparedStorage = null;
  preparation = null;
  profileTransitionActive = false;
}

/** Test infrastructure. Production always uses the one MMKV instance above. */
export class MemoryKeyValueStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();
  private failurePlan: FailurePlan | null = null;
  readonly operations: { kind: "read" | "write" | "remove"; key: string }[] = [];
  private reads = 0; private writes = 0; private removes = 0;
  getString(key: string): string | undefined { this.reads += 1; this.operations.push({ kind: "read", key }); this.fail("read", key, this.reads); return this.values.get(key); }
  setString(key: string, value: string): void { this.writes += 1; this.operations.push({ kind: "write", key }); this.fail("write", key, this.writes); this.values.set(key, value); }
  remove(key: string): void { this.removes += 1; this.operations.push({ kind: "remove", key }); this.fail("remove", key, this.removes); this.values.delete(key); }
  contains(key: string): boolean { return this.values.has(key); }
  getAllKeys(): readonly string[] { return [...this.values.keys()]; }
  setFailurePlan(plan: FailurePlan | null): void { this.failurePlan = plan; }
  resetCounters(): void { this.reads = 0; this.writes = 0; this.removes = 0; this.operations.length = 0; }
  snapshot(): ReadonlyMap<string, string> { return new Map(this.values); }
  private fail(kind: "read" | "write" | "remove", key: string, number: number): void { const plan = this.failurePlan; if (!plan) return; const matchingKeyWrites = kind === "write" ? this.operations.filter((operation) => operation.kind === "write" && operation.key === key).length : 0; const fail = (plan.kind === "fail_on_write_number" && kind === "write" && plan.writeNumber === number) || (plan.kind === "fail_on_key_write" && kind === "write" && plan.key === key) || (plan.kind === "fail_on_key_write_occurrence" && kind === "write" && plan.key === key && plan.occurrence === matchingKeyWrites) || (plan.kind === "fail_on_read_number" && kind === "read" && plan.readNumber === number) || (plan.kind === "fail_on_key_read" && kind === "read" && plan.key === key) || (plan.kind === "fail_on_remove_number" && kind === "remove" && plan.removeNumber === number) || (plan.kind === "fail_on_key_remove" && kind === "remove" && plan.key === key); if (fail) throw new Error(`Injected ${kind} failure for ${key}.`); }
}
export type FailurePlan =
  | { kind: "fail_on_write_number"; writeNumber: number }
  | { kind: "fail_on_key_write"; key: string }
  | { kind: "fail_on_key_write_occurrence"; key: string; occurrence: number }
  | { kind: "fail_on_read_number"; readNumber: number }
  | { kind: "fail_on_key_read"; key: string }
  | { kind: "fail_on_remove_number"; removeNumber: number }
  | { kind: "fail_on_key_remove"; key: string };

export function installKeyValueStorageForTests(storage: KeyValueStorage): void {
  closePublishedProfileStorage();
  client = storage;
  profileRouter = null;
  preparedStorage = null;
  activePreparedStorage = null;
  preparation = null;
  profileTransitionActive = false;
}

/** Test-only bootstrap seam for exercising the prepare/activate boundary. */
export function setProfileStoragePreparationFactoryForTests(factory: (() => Promise<PreparedStorage>) | null): void {
  closePublishedProfileStorage();
  preparedStorage = null;
  preparation = null;
  testPreparationFactory = factory;
}

/** Test-only seam that prevents selection tests from reloading the app process. */
export function setProfileTransitionReloadForTests(reload: (() => Promise<void>) | null): void {
  testProfileTransitionReload = reload;
}

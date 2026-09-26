export interface KeyValueStorage {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  remove(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): readonly string[];
}

import { openProfileStorageRouter, ProfileStorageError, ProfileTransitionActiveError, type ProfileStorageRouter, type StorageProfile } from "./profileStorageRouter";

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

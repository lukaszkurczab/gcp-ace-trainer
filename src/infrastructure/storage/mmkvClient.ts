export interface KeyValueStorage {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  remove(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): readonly string[];
}

import { openProfileStorageRouter, type ProfileStorageRouter, type StorageProfile } from "./profileStorageRouter";
import { installOwnerPreservationSource } from "../testing/ownerPreservationSourceRuntime";

let client: KeyValueStorage | null = null;
let profileRouter: ProfileStorageRouter | null = null;
let productionInitialization: Promise<KeyValueStorage> | null = null;
const readyListeners = new Set<() => void>();
const profileTransitionListeners = new Set<() => void>();
let profileTransitionActive = false;

/** Initializes the one native client before repositories are opened. */
export async function initializeKeyValueStorage(): Promise<KeyValueStorage> {
  if (client) return client;
  if (!productionInitialization) {
    productionInitialization = (async () => {
      const { openEncryptedStorage, STORAGE_MIGRATION_MARKER_KEY } = await import("./encryptedStorageBootstrap");
      const { createNativeEncryptedStoragePlatform } = await import("./encryptedStorageNative");
      const platform = createNativeEncryptedStoragePlatform();
      const result = await openEncryptedStorage(platform);
      const storage: KeyValueStorage = {
        getString: (key) => result.storage.getString(key),
        setString: (key, value) => { result.storage.setString(key, value); },
        remove: (key) => { result.storage.remove(key); },
        contains: (key) => key !== STORAGE_MIGRATION_MARKER_KEY && result.storage.getString(key) !== undefined,
        getAllKeys: () => result.storage.getAllKeys().filter((key) => key !== STORAGE_MIGRATION_MARKER_KEY),
      };
      profileTransitionActive = false;
      profileRouter = await openProfileStorageRouter(storage, platform.manifestStore, {
        isTransitionActive: () => profileTransitionActive,
        onBeforeProfileCommit: beginProfileTransition,
      });
      installOwnerPreservationSource(storage, profileRouter);
      client = profileRouter.storage;
      for (const listener of readyListeners) listener();
      return storage;
    })().catch((error) => { productionInitialization = null; throw error; });
  }
  return productionInitialization;
}

export function onKeyValueStorageReady(listener: () => void): () => void {
  readyListeners.add(listener);
  if (client) listener();
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

export async function selectAccountProfileAndRestart(accountId: string, canContinue: () => boolean = () => true): Promise<boolean> {
  if (!profileRouter) throw new Error("encrypted_storage_not_initialized");
  const selected = await profileRouter.selectAccount(accountId, canContinue);
  const changed = selected.id !== profileRouter.profile.id;
  if (!changed) return false;
  await reloadForProfileTransition();
  return true;
}

export async function reloadForProfileTransition(): Promise<void> {
  if (!profileTransitionActive) throw new Error("profile_transition_not_started");
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
  client = null;
  installOwnerPreservationSource(null, null);
  profileRouter = null;
  profileTransitionActive = false;
  productionInitialization = null;
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
  client = storage;
  installOwnerPreservationSource(null, null);
  profileRouter = null;
  profileTransitionActive = false;
  productionInitialization = null;
}

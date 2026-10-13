import { createForegroundClockCapability, type ForegroundClockCapability, type ForegroundClockScope, type BoundForegroundClockDriver } from "./foregroundClockCapability";
import type { HybridObject } from "react-native-nitro-modules";
import type { EncryptedStoragePlatform, StorageManifestStore, StorageSlot } from "./encryptedStorageBootstrap";

type SecureStoreModule = typeof import("expo-secure-store");
type MmkvModule = typeof import("react-native-mmkv");

function base64Url(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]!;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const value = (first << 16) | (second << 8) | third;
    output += alphabet[(value >>> 18) & 63]! + alphabet[(value >>> 12) & 63]!;
    if (index + 1 < bytes.length) output += alphabet[(value >>> 6) & 63]!;
    if (index + 2 < bytes.length) output += alphabet[value & 63]!;
  }
  return output;
}

type NativeForegroundClock = HybridObject<{ ios: "c++" }> & BoundForegroundClockDriver & Readonly<{
  bind(instance: ReturnType<MmkvModule["createMMKV"]>, physicalKey: string, profileId: string, token: string): void;
}>;
const foregroundClockFactories = new WeakMap<StorageSlot, (scope: ForegroundClockScope) => ForegroundClockCapability>();

/** The explicit storage-owner grant. Only the original opened slot is accepted;
 * no wrapper reflection, second MMKV instance or encryption-key reader. */
export function claimNativeForegroundClock(storage: StorageSlot, scope: ForegroundClockScope): ForegroundClockCapability {
  const claim = foregroundClockFactories.get(storage);
  if (!claim) throw new Error("foreground_clock_storage_owner_unavailable");
  if (!scope.isCurrent()) throw new Error("foreground_clock_lease_stale");
  return claim(scope);
}

function wrap(instance: ReturnType<MmkvModule["createMMKV"]>, createToken: () => string): StorageSlot {
  let activeCapability: ForegroundClockCapability | null = null;
  let activePhysicalKey: string | null = null;
  const assertNoActiveClock = () => { if (activeCapability) throw new Error("foreground_clock_storage_operation_requires_revoke"); };
  const slot: StorageSlot = {
    id: instance.id,
    get isEncrypted() { return instance.isEncrypted; },
    getString: (key) => key === activePhysicalKey ? activeCapability!.read() : instance.getString(key),
    setString: (key, value) => {
      if (key === activePhysicalKey) throw new Error("foreground_clock_mutation_requires_owner");
      instance.set(key, value);
    },
    remove: (key) => {
      if (key === activePhysicalKey) throw new Error("foreground_clock_mutation_requires_owner");
      instance.remove(key);
    },
    getAllKeys: () => instance.getAllKeys(),
    clearAll: () => { assertNoActiveClock(); instance.clearAll(); },
    encrypt: (key) => { assertNoActiveClock(); instance.encrypt(key, "AES-256"); },
    trim: () => { instance.trim(); },
  };
  foregroundClockFactories.set(slot, (scope) => {
    if (activeCapability) throw new Error("foreground_clock_owner_already_claimed");
    if (!instance.isEncrypted) throw new Error("foreground_clock_encrypted_storage_required");
    if (!Number.isSafeInteger(scope.generation) || scope.generation < 0 || !scope.profileId || !scope.physicalKey) throw new Error("foreground_clock_grant_invalid");
    const { NitroModules } = require("react-native-nitro-modules") as typeof import("react-native-nitro-modules");
    let native: NativeForegroundClock;
    try { native = NitroModules.createHybridObject<NativeForegroundClock>("PatternlyForegroundClock"); }
    catch { throw new Error("foreground_clock_native_owner_unavailable"); }
    const token = `${scope.generation}:${createToken()}`;
    native.bind(instance, scope.physicalKey, scope.profileId, token);
    const bound = createForegroundClockCapability(native, token, scope);
    let revokeFailed = false;
    const capability: ForegroundClockCapability = Object.freeze({
      ...bound,
      revoke() {
        if (revokeFailed) throw new Error("foreground_clock_revoke_unknown");
        try { bound.revoke(); }
        catch (error) { revokeFailed = true; throw error; }
        if (activeCapability === capability) { activeCapability = null; activePhysicalKey = null; }
      },
    });
    activeCapability = capability;
    activePhysicalKey = scope.physicalKey;
    return capability;
  });
  return slot;
}

export function createNativeEncryptedStoragePlatform(): EncryptedStoragePlatform {
  const secureStore = require("expo-secure-store") as SecureStoreModule;
  const crypto = require("expo-crypto") as typeof import("expo-crypto");
  const mmkv = require("react-native-mmkv") as MmkvModule;
  const secureStoreOptions = Object.freeze({
    keychainAccessible: secureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    keychainService: "com.lkurczab.patternly.encrypted-storage",
  });
  const manifestStore: StorageManifestStore = {
    get: (key) => secureStore.getItemAsync(key, secureStoreOptions),
    set: (key, value) => secureStore.setItemAsync(key, value, secureStoreOptions),
    remove: (key) => secureStore.deleteItemAsync(key, secureStoreOptions),
  };
  const currentBootId = crypto.randomUUID();
  return {
    manifestStore,
    async createKey() { return base64Url(await crypto.getRandomBytesAsync(24)); },
    exists: (id) => mmkv.existsMMKV(id),
    open: (id, key) => wrap(mmkv.createMMKV({ id, ...(key ? { encryptionKey: key, encryptionType: "AES-256" as const } : {}), recoveryStrategy: "recover-on-error" }), () => crypto.randomUUID()),
    delete: (id) => { if (mmkv.existsMMKV(id) && !mmkv.deleteMMKV(id)) throw new Error(`mmkv_delete_failed:${id}`); },
    bootId: () => currentBootId,
  };
}

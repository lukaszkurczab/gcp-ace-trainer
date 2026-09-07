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

function wrap(instance: ReturnType<MmkvModule["createMMKV"]>): StorageSlot {
  return {
    id: instance.id,
    get isEncrypted() { return instance.isEncrypted; },
    getString: (key) => instance.getString(key),
    setString: (key, value) => { instance.set(key, value); },
    remove: (key) => { instance.remove(key); },
    getAllKeys: () => instance.getAllKeys(),
    clearAll: () => { instance.clearAll(); },
    encrypt: (key) => { instance.encrypt(key, "AES-256"); },
    trim: () => { instance.trim(); },
  };
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
    open: (id, key) => wrap(mmkv.createMMKV({ id, ...(key ? { encryptionKey: key, encryptionType: "AES-256" as const } : {}), recoveryStrategy: "recover-on-error" })),
    delete: (id) => { if (mmkv.existsMMKV(id) && !mmkv.deleteMMKV(id)) throw new Error(`mmkv_delete_failed:${id}`); },
    bootId: () => currentBootId,
  };
}

export interface KeyValueStorage {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  remove(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): readonly string[];
}

let client: KeyValueStorage | null = null;

export function getKeyValueStorage(): KeyValueStorage {
  if (!client) {
    // Native code is intentionally loaded only by the production client. Node tests install memory storage first.
    const { createMMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
    const mmkv = createMMKV({ id: "patternly" });
    client = {
      getString: (key) => mmkv.getString(key),
      setString: (key, value) => { mmkv.set(key, value); },
      remove: (key) => { mmkv.remove(key); },
      contains: (key) => mmkv.contains(key),
      getAllKeys: () => mmkv.getAllKeys(),
    };
  }
  return client;
}

/** Test infrastructure. Production always uses the one MMKV instance above. */
export class MemoryKeyValueStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();
  getString(key: string): string | undefined { return this.values.get(key); }
  setString(key: string, value: string): void { this.values.set(key, value); }
  remove(key: string): void { this.values.delete(key); }
  contains(key: string): boolean { return this.values.has(key); }
  getAllKeys(): readonly string[] { return [...this.values.keys()]; }
}

export function installKeyValueStorageForTests(storage: KeyValueStorage): void { client = storage; }

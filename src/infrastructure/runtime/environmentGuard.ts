export const ENVIRONMENT_FINGERPRINT_KEY = "patternly.environment-fingerprint.v1";
export const ENVIRONMENT_KEYCHAIN_SERVICE = "com.lkurczab.patternly.environment";

export type EnvironmentGuardState = "ready" | "unassigned" | "mismatch";
export type EnvironmentMarkerStore = Readonly<{
  get: () => Promise<string | null>;
  set: (value: string) => Promise<void>;
}>;

export class EnvironmentGuardError extends Error {
  constructor(readonly code: "environment_marker_corrupt" | "environment_marker_unavailable" | "environment_marker_write_unconfirmed" | "environment_configuration_mismatch") {
    super(code);
    this.name = "EnvironmentGuardError";
  }
}

/** Missing markers carry no provenance. Only an explicit owner assignment can enroll them.
 * No delete/replace operation exists. This guard reads only its own marker, never user data. */
export function createEnvironmentGuard(store: EnvironmentMarkerStore, fingerprint: string) {
  if (!/^[a-f0-9]{64}$/u.test(fingerprint)) throw new EnvironmentGuardError("environment_configuration_mismatch");
  const inspect = async (): Promise<EnvironmentGuardState> => {
    let raw: string | null;
    try { raw = await store.get(); }
    catch { throw new EnvironmentGuardError("environment_marker_unavailable"); }
    if (raw === null) return "unassigned";
    let value: unknown;
    try { value = JSON.parse(raw) as unknown; }
    catch { throw new EnvironmentGuardError("environment_marker_corrupt"); }
    if (typeof value !== "object" || value === null || Array.isArray(value)
      || Object.keys(value).sort().join(",") !== "fingerprint,version"
      || !("version" in value) || value.version !== 1
      || !("fingerprint" in value) || typeof value.fingerprint !== "string" || !/^[a-f0-9]{64}$/u.test(value.fingerprint)) throw new EnvironmentGuardError("environment_marker_corrupt");
    return value.fingerprint === fingerprint ? "ready" : "mismatch";
  };
  let assignment: Promise<EnvironmentGuardState> | null = null;
  return Object.freeze({
    inspect,
    assign(): Promise<EnvironmentGuardState> {
      if (assignment) return assignment;
      assignment = (async () => {
        const state = await inspect();
        if (state !== "unassigned") return state;
        const marker = JSON.stringify({ version: 1, fingerprint });
        try {
          await store.set(marker);
          if (await store.get() !== marker) throw new Error("readback_mismatch");
        } catch { throw new EnvironmentGuardError("environment_marker_write_unconfirmed"); }
        return "ready";
      })().finally(() => { assignment = null; });
      return assignment;
    },
  });
}

/** Same native location across builds is intentional: B must observe A's fence. */
export function createNativeEnvironmentMarkerStore(): EnvironmentMarkerStore {
  const secureStore = require("expo-secure-store") as typeof import("expo-secure-store");
  const { Platform } = require("react-native") as typeof import("react-native");
  if ((Platform.OS !== "ios" && Platform.OS !== "android")
    || typeof secureStore.getItemAsync !== "function" || typeof secureStore.setItemAsync !== "function"
    || (Platform.OS === "ios" && secureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY === undefined)) throw new EnvironmentGuardError("environment_marker_unavailable");
  const options = Object.freeze({ keychainService: ENVIRONMENT_KEYCHAIN_SERVICE,
    ...(Platform.OS === "ios" ? { keychainAccessible: secureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY } : {}) });
  return Object.freeze({
    get: () => secureStore.getItemAsync(ENVIRONMENT_FINGERPRINT_KEY, options),
    set: (value: string) => secureStore.setItemAsync(ENVIRONMENT_FINGERPRINT_KEY, value, options),
  });
}

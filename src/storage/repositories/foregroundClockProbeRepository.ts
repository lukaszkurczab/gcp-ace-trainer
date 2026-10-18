import { captureActiveProfileStorageLease, getKeyValueStorage, isActiveProfileStorageLeaseCurrent } from "../../infrastructure/storage/mmkvClient";

/** Passive diagnostic reads, fenced to the profile that owns this observation.
 * No write operations or underlying storage handle cross this boundary. */
export function captureForegroundClockProbeStorage() {
  const lease = captureActiveProfileStorageLease();
  const requireCurrent = () => {
    if (!lease || !isActiveProfileStorageLeaseCurrent(lease)) {
      throw Object.assign(new Error("probe_profile_unavailable"), { code: "probe_profile_unavailable" });
    }
  };
  requireCurrent();
  const storage = getKeyValueStorage();
  const read = <T>(operation: () => T): T => {
    requireCurrent();
    const value = operation();
    requireCurrent();
    return value;
  };
  return Object.freeze({
    getString: (key: string): string | undefined => read(() => storage.getString(key)),
    getAllKeys: (): readonly string[] => read(() => [...storage.getAllKeys()]),
  });
}

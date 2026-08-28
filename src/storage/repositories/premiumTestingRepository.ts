import { getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { isPatternlyPremiumTestingRuntime } from "../../infrastructure/runtime/runtimeMode";

const PREMIUM_TESTING_ACCESS_KEY = "patternly:test-runtime:v1:premium-access";

/**
 * This override is deliberately outside the canonical user-data namespace:
 * it is a device-local test control and must never be synchronised to an
 * account or considered by release builds.
 */
export function hasPremiumTestingAccess(): boolean {
  return isPatternlyPremiumTestingRuntime() && getKeyValueStorage().getString(PREMIUM_TESTING_ACCESS_KEY) === "enabled";
}

export function setPremiumTestingAccess(enabled: boolean): void {
  if (!isPatternlyPremiumTestingRuntime()) throw new Error("Premium testing access is unavailable in this runtime.");
  const storage = getKeyValueStorage();
  if (enabled) storage.setString(PREMIUM_TESTING_ACCESS_KEY, "enabled");
  else storage.remove(PREMIUM_TESTING_ACCESS_KEY);
}

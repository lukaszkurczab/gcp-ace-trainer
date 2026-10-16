import { isPatternlyPremiumTestingRuntime } from "../infrastructure/runtime/runtimeMode";
import { readPremiumTestingAccess, writePremiumTestingAccess } from "../storage/repositories/premiumTestingRepository";

/** Application alone decides whether the device-local test override can be used. */
export function hasPremiumTestingAccess(): boolean {
  return isPatternlyPremiumTestingRuntime() && readPremiumTestingAccess();
}

export function setPremiumTestingAccess(enabled: boolean): void {
  if (!isPatternlyPremiumTestingRuntime()) throw new Error("Premium testing access is unavailable in this runtime.");
  writePremiumTestingAccess(enabled);
}

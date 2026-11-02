import { isPatternlyPremiumTestingRuntime } from "../infrastructure/runtime/runtimeMode";
import { readPremiumTestingAccess, writePremiumTestingAccess } from "../storage/repositories/premiumTestingRepository";

/** Application alone decides whether the device-local test override can be used. */
export function hasPremiumTestingAccess(): boolean {
  return isPatternlyPremiumTestingRuntime() && readPremiumTestingAccess();
}

/** Null means inactive; an unreadable permitted control must never grant access. */
export function readPremiumTestingDecision(): "allowed" | "unavailable" | null {
  try { return hasPremiumTestingAccess() ? "allowed" : null; }
  catch { return "unavailable"; }
}

export function setPremiumTestingAccess(enabled: boolean): void {
  if (!isPatternlyPremiumTestingRuntime()) throw new Error("Premium testing access is unavailable in this runtime.");
  writePremiumTestingAccess(enabled);
}

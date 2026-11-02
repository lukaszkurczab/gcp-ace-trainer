import type { AccountDataSession } from "./accountDataService";
import { readPremiumTestingDecision } from "../premiumTesting";
import { isPatternlyPremiumTestingRuntime } from "../../infrastructure/runtime/runtimeMode";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent } from "../../storage/repositories/profileStorageRepository";

/** Call only after the normal account actor and binding fences have passed. */
export function readAccountPremiumTestingAccess(status: AccountDataSession["status"]): "allowed" | "unavailable" | null {
  if (!isPatternlyPremiumTestingRuntime()) return null;
  const decision = readPremiumTestingDecision();
  if (decision === "allowed" && (status === "remoteDeletionPending" || status === "localCleanupPending" || status === "signOutPending")) return "unavailable";
  return decision;
}

/** Guest testing never opens an account profile or crosses a profile transition. */
export function readGuestPremiumTestingAccess(isCurrentGuest: () => boolean): "allowed" | "unavailable" | null {
  if (!isPatternlyPremiumTestingRuntime()) return null;
  const lease = captureActiveProfileStorageLease();
  const decision = readPremiumTestingDecision();
  if (decision === null) return null;
  return lease && lease.profile.kind === "guest" && isCurrentGuest() && isActiveProfileStorageLeaseCurrent(lease) ? decision : "unavailable";
}

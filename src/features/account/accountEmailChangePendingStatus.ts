import type { AccountFailure, AccountState } from "../../application/account/AccountSessionProvider";

export type AccountEmailChangePendingStatus = "waiting" | "confirmed" | "refreshError" | "unavailable";

export function normalizeAccountEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function getAccountEmailChangePendingStatus(input: Readonly<{
  currentState: AccountState;
  expectedUid: string;
  requestedEmail: string;
  refreshFailure: AccountFailure | null;
}>): AccountEmailChangePendingStatus {
  if (input.currentState.kind !== "authenticated" || input.currentState.user.uid !== input.expectedUid) return "unavailable";
  if (input.refreshFailure !== null) return "refreshError";

  const requestedEmail = normalizeAccountEmail(input.requestedEmail);
  const firebaseEmail = normalizeAccountEmail(input.currentState.user.email);
  const backendEmail = normalizeAccountEmail(input.currentState.backendUser.identity.email);
  const confirmed = requestedEmail !== null
    && requestedEmail === firebaseEmail
    && requestedEmail === backendEmail
    && input.currentState.user.emailVerified
    && input.currentState.backendUser.identity.emailVerified;

  return confirmed ? "confirmed" : "waiting";
}

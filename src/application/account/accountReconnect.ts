/** Unknown reachability never establishes either side of a reconnect transition. */
export function observeReachability(previous: boolean | null, current: boolean | null): Readonly<{ next: boolean | null; reconnected: boolean }> {
  return { next: current, reconnected: previous === false && current === true };
}

/** Run the initial reachability probe once per uninterrupted local-offline actor state. */
export function claimLocalOfflineInitialRefresh(input: Readonly<{
  stateKind: string;
  uid: string | null;
  attemptedUid: string | null;
}>): Readonly<{ shouldRefresh: boolean; attemptedUid: string | null }> {
  if (input.stateKind === "authenticated") {
    return { shouldRefresh: false, attemptedUid: null };
  }
  if (["signedOut", "guest", "guestAccessBlocked", "verificationPending", "signOutPending", "signingOut", "deleting", "deletionPending", "revokedSession"].includes(input.stateKind)) {
    return { shouldRefresh: false, attemptedUid: null };
  }
  if (input.stateKind !== "localOffline" || !input.uid) {
    return { shouldRefresh: false, attemptedUid: input.attemptedUid };
  }
  if (input.attemptedUid === input.uid) {
    return { shouldRefresh: false, attemptedUid: input.attemptedUid };
  }
  return { shouldRefresh: true, attemptedUid: input.uid };
}

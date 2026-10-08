import assert from "node:assert/strict";
import test from "node:test";

import { claimLocalOfflineInitialRefresh, observeReachability } from "./accountReconnect";

test("only confirmed offline to confirmed online is a reconnect", () => {
  assert.deepEqual(observeReachability(null, true), { next: true, reconnected: false });
  assert.deepEqual(observeReachability(null, false), { next: false, reconnected: false });
  assert.deepEqual(observeReachability(false, null), { next: null, reconnected: false });
  assert.deepEqual(observeReachability(null, true), { next: true, reconnected: false });
  assert.deepEqual(observeReachability(false, true), { next: true, reconnected: true });
  assert.deepEqual(observeReachability(true, true), { next: true, reconnected: false });
});

test("a failed initial local-offline probe does not rearm on its own preparation transitions", () => {
  let attemptedUid: string | null = null;
  const initial = claimLocalOfflineInitialRefresh({ stateKind: "localOffline", uid: "uid-a", attemptedUid });
  assert.equal(initial.shouldRefresh, true);
  attemptedUid = initial.attemptedUid;

  // The refresh itself advances generation and may publish preparation/error states before
  // returning to the same local actor. Those transitions must not trigger another NetInfo probe.
  for (const stateKind of ["profilePreparing", "backendUnavailable", "profilePreparing"]) {
    const transition = claimLocalOfflineInitialRefresh({ stateKind, uid: null, attemptedUid });
    assert.equal(transition.shouldRefresh, false);
    attemptedUid = transition.attemptedUid;
  }
  const failedRetry = claimLocalOfflineInitialRefresh({ stateKind: "localOffline", uid: "uid-a", attemptedUid });
  assert.equal(failedRetry.shouldRefresh, false);

  // A verified online session or an actual actor exit starts a new local-offline episode.
  const verifiedOnline = claimLocalOfflineInitialRefresh({ stateKind: "authenticated", uid: "uid-a", attemptedUid });
  assert.equal(verifiedOnline.attemptedUid, null);
  const afterOnline = claimLocalOfflineInitialRefresh({ stateKind: "localOffline", uid: "uid-a", attemptedUid: verifiedOnline.attemptedUid });
  assert.equal(afterOnline.shouldRefresh, true);
});

import assert from "node:assert/strict";
import test from "node:test";

import { isHomeSnapshotOwnerCurrent } from "./homeSnapshotOwner";

test("Home snapshots are usable only for the exact active profile lease and track", () => {
  const guestLease = {};
  const accountLease = {};
  const snapshot = { scope: guestLease, trackId: "frontend-system-design-interview" as const };

  assert.equal(isHomeSnapshotOwnerCurrent(snapshot, guestLease, snapshot.trackId), true);
  assert.equal(isHomeSnapshotOwnerCurrent(snapshot, guestLease, "aws-solutions-architect-associate"), false);
  assert.equal(isHomeSnapshotOwnerCurrent(snapshot, accountLease, snapshot.trackId), false);
  assert.equal(isHomeSnapshotOwnerCurrent(null, guestLease, snapshot.trackId), false);
});

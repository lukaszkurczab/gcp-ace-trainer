import assert from "node:assert/strict";
import test from "node:test";

import { isPracticeReadOwnerCurrent } from "./practiceReadOwner";

test("practice snapshots remain actionable only for the matching profile and selected track", () => {
  const profileA = {};
  const profileB = {};
  const owner = {
    currentScope: profileA,
    loadedScope: profileA,
    currentTrackId: "frontend-system-design-interview" as const,
    loadedTrackId: "frontend-system-design-interview" as const,
  };
  assert.equal(isPracticeReadOwnerCurrent(owner), true);
  assert.equal(isPracticeReadOwnerCurrent({ ...owner, currentTrackId: "backend" }), false);
  assert.equal(isPracticeReadOwnerCurrent({ ...owner, currentScope: profileB }), false);
  assert.equal(isPracticeReadOwnerCurrent({ ...owner, requestedTrackId: "backend" }), false);
  assert.equal(isPracticeReadOwnerCurrent({ ...owner, requestedTrackId: "frontend-system-design-interview" }), true);
});

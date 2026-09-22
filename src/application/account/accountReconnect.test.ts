import assert from "node:assert/strict";
import test from "node:test";

import { observeReachability } from "./accountReconnect";

test("only confirmed offline to confirmed online is a reconnect", () => {
  assert.deepEqual(observeReachability(null, true), { next: true, reconnected: false });
  assert.deepEqual(observeReachability(null, false), { next: false, reconnected: false });
  assert.deepEqual(observeReachability(false, null), { next: null, reconnected: false });
  assert.deepEqual(observeReachability(null, true), { next: true, reconnected: false });
  assert.deepEqual(observeReachability(false, true), { next: true, reconnected: true });
  assert.deepEqual(observeReachability(true, true), { next: true, reconnected: false });
});

import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { grantGuestAccess, hasGuestAccess, revokeGuestAccess } from "./guestAccessRepository";

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("guest access is an explicit durable decision and can be cleared for account entry", () => {
  assert.equal(hasGuestAccess(), false);

  grantGuestAccess();
  assert.equal(hasGuestAccess(), true);

  grantGuestAccess();
  assert.equal(hasGuestAccess(), true);

  revokeGuestAccess();
  assert.equal(hasGuestAccess(), false);
});

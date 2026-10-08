import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_USER_STORAGE_KEY, inspectQ13SecureAuthPersistence, type SecureAuthPersistenceStore } from "./secureAuthPersistence";

test("Q13 secure auth receipt reads only the exact user slot and does not expose its token record", async () => {
  const secret = JSON.stringify({ uid: "private-user", refreshToken: "private-refresh-token" });
  const reads: string[] = [];
  let mutations = 0;
  const store: SecureAuthPersistenceStore = {
    getItemAsync: async (key) => { reads.push(key); return secret; },
    setItemAsync: async () => { mutations += 1; },
    deleteItemAsync: async () => { mutations += 1; },
  };

  const receipt = await inspectQ13SecureAuthPersistence(store, (uid) => uid === "private-user");

  assert.deepEqual(reads, [AUTH_USER_STORAGE_KEY]);
  assert.equal(receipt.kind, "observed");
  assert.equal(receipt.userRecord, "present");
  assert.equal(receipt.userRecordAffinity, "matches_current_sdk_uid");
  assert.equal(receipt.userRecordSha256?.length, 64);
  assert.equal(receipt.dynamicFirebaseNamespace, "unavailable");
  assert.equal(JSON.stringify(receipt).includes("private-refresh-token"), false);
  assert.equal(JSON.stringify(receipt).includes("private-user"), false);
  assert.equal(mutations, 0);
});

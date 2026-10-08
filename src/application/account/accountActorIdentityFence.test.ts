import assert from "node:assert/strict";
import test from "node:test";

import { matchesAccountActorIdentity, type AccountActorIdentity, type AccountActorIdentityObservation } from "./accountActorIdentityFence";

const profile = Object.freeze({ id: "account-profile", kind: "account" as const, accountId: "account-id" });
const identity: AccountActorIdentity = Object.freeze({
  stateKind: "authenticated",
  uid: "firebase-uid",
  accountId: "account-id",
  generation: Object.freeze({ uid: "firebase-uid", generation: 8 }),
  profile,
});
const observation: AccountActorIdentityObservation = Object.freeze({
  stateKind: "authenticated",
  uid: "firebase-uid",
  accountId: "account-id",
  sdkUid: "firebase-uid",
  generation: Object.freeze({ uid: "firebase-uid", generation: 8 }),
  generationCurrent: true,
  profile,
});

test("account identity fence accepts a benign AccountState replacement with the same current identity", () => {
  assert.equal(matchesAccountActorIdentity(identity, { ...observation, profile: { ...profile } }), true);
});

test("account identity fence rejects SDK UID, backend account, generation, profile, and state transitions", () => {
  const mutations: readonly AccountActorIdentityObservation[] = [
    { ...observation, uid: "other-uid" },
    { ...observation, sdkUid: "other-uid" },
    { ...observation, accountId: "other-account" },
    { ...observation, generation: { uid: "firebase-uid", generation: 9 } },
    { ...observation, generationCurrent: false },
    { ...observation, profile: { ...profile, id: "other-profile" } },
    { ...observation, profile: { ...profile, kind: "legacy_owner" as const } },
    { ...observation, profile: { ...profile, accountId: "other-account" } },
    { ...observation, stateKind: "signingOut" },
  ];
  for (const current of mutations) assert.equal(matchesAccountActorIdentity(identity, current), false);
});

test("local offline account identity uses the same strict SDK, account, generation, and profile fence", () => {
  const offlineIdentity: AccountActorIdentity = Object.freeze({ ...identity, stateKind: "localOffline" });
  assert.equal(matchesAccountActorIdentity(offlineIdentity, { ...observation, stateKind: "localOffline" }), true);
  assert.equal(matchesAccountActorIdentity(offlineIdentity, observation), false);
  assert.equal(matchesAccountActorIdentity(offlineIdentity, { ...observation, stateKind: "localOffline", sdkUid: "other-uid" }), false);
  assert.equal(matchesAccountActorIdentity(offlineIdentity, { ...observation, stateKind: "localOffline", generationCurrent: false }), false);
});

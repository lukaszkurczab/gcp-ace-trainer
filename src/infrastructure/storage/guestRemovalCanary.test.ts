import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { STORAGE_KEYS } from "../../storage/keys";
import { sha256Utf8 } from "../identity/sha256";
import { openProfileStorageRouter } from "./profileStorageRouter";
import type { StorageManifestStore } from "./encryptedStorageBootstrap";
import {
  activatePreparedProfile,
  getKeyValueStorage,
  inspectBizq01GuestRemoval34Canary,
  inspectRemovedOriginalGuest34,
  installKeyValueStorageForTests,
  isProfileTransitionActive,
  MemoryKeyValueStorage,
  prepareProfileStorage,
  runBizq01GuestRemoval34Canary,
  setProfileStoragePreparationFactoryForTests,
} from "./mmkvClient";

const GUEST_ID = "00000000-0000-4000-8000-000000000031";
const INSTALLATION_ID = "00000000-0000-4000-8000-000000000032";
const ACCOUNT_PROFILE_ID = "00000000-0000-4000-8000-000000000033";
const ACCOUNT_ID = "canary-protected-account";
const NONCE = "a".repeat(64);

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
}

afterEach(() => {
  setProfileStoragePreparationFactoryForTests(null);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
});

async function activeGuestFixture(accountCount = 1) {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const generatedIds = [GUEST_ID, "00000000-0000-4000-8000-000000000034", ACCOUNT_PROFILE_ID,
    ...Array.from({ length: 8 }, (_, index) => `00000000-0000-4000-8000-${String(index + 40).padStart(12, "0")}`)];
  let generatedIndex = 0;
  const identity = {
    async create() {
      return { installationId: INSTALLATION_ID, localDatasetId: generatedIds[generatedIndex++]! };
    },
  };
  const initial = await openProfileStorageRouter(base, control, { identity });
  await initial.selectExistingGuest(GUEST_ID);
  const afterGuest = await openProfileStorageRouter(base, control, { identity });
  await afterGuest.selectAccount(ACCOUNT_ID);
  const afterAccount = await openProfileStorageRouter(base, control, { identity });
  await afterAccount.selectExistingGuest(GUEST_ID);
  let router = await openProfileStorageRouter(base, control, { identity });
  for (let index = 1; index < accountCount; index += 1) {
    await router.selectAccount(`canary-protected-account-${index}`);
    router = await openProfileStorageRouter(base, control, { identity });
  }
  if (accountCount > 1) {
    await router.selectExistingGuest(GUEST_ID);
    router = await openProfileStorageRouter(base, control, { identity });
  }
  const accountKey = `patternly:profile:v1:${ACCOUNT_PROFILE_ID}:${encodeURIComponent(STORAGE_KEYS.SETTINGS)}`;
  base.setString(accountKey, "protected-account-value");
  base.setString("patternly:global:canary-test", "protected-global-value");
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  await prepareProfileStorage();
  activatePreparedProfile(GUEST_ID, "guest");
  base.resetCounters();
  return { base, control, router, accountKey };
}

const expectedTarget = () => ({ datasetHash: sha256Utf8(GUEST_ID), installationHash: sha256Utf8(INSTALLATION_ID) });

test("native adapter canary leaves registered profiles and global state byte-for-byte unchanged", async () => {
  const fixture = await activeGuestFixture();
  const before = fixture.base.snapshot();
  const expected = expectedTarget();

  const receipt = runBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash, NONCE);

  assert.equal(typeof (receipt as unknown as { then?: unknown }).then, "undefined");
  assert.equal(receipt.result, "passed");
  assert.equal(receipt.stage, "complete");
  assert.equal(receipt.protectedStateUnchanged, true);
  assert.equal(receipt.cleanupVerified, true);
  assert.match(receipt.canaryValueSha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.match(receipt.accountStateSha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.match(receipt.globalStateSha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.equal(JSON.stringify(receipt).includes(GUEST_ID), false);
  assert.equal(JSON.stringify(receipt).includes(INSTALLATION_ID), false);
  assert.deepEqual(fixture.base.snapshot(), before);
  assert.equal(fixture.base.operations.some((operation) => operation.key.includes(NONCE)), true);
  assert.equal(fixture.base.operations.some((operation) => operation.key === fixture.accountKey && operation.kind === "write"), false);
  assert.equal(isProfileTransitionActive(), true);
  assert.throws(() => getKeyValueStorage().setString(STORAGE_KEYS.SETTINGS, "blocked"), /profile_transition_active/u);
});

test("a wrong target hash refuses before transition or canary writes", async () => {
  const fixture = await activeGuestFixture();
  fixture.base.resetCounters();
  const expected = expectedTarget();

  const receipt = runBizq01GuestRemoval34Canary("0".repeat(64), expected.installationHash, NONCE);

  assert.equal(receipt.result, "failed");
  assert.equal(receipt.stage, "expected_guest_mismatch");
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);
  assert.equal(isProfileTransitionActive(), false);
});

test("an active learning session refuses before transition or canary writes", async () => {
  const fixture = await activeGuestFixture();
  const scoped = getKeyValueStorage();
  scoped.setString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, "active-session");
  fixture.base.resetCounters();
  const expected = expectedTarget();

  const receipt = runBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash, NONCE);

  assert.equal(receipt.result, "failed");
  assert.equal(receipt.stage, "active_learning_work_present");
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);
  assert.equal(isProfileTransitionActive(), false);
});

test("canary removes its exact unregistered key even when adapter readback fails", async () => {
  const fixture = await activeGuestFixture();
  const key = `patternly:profile:v1:bizq01-canary-${NONCE}:adapter-check:${NONCE}`;
  const getString = fixture.base.getString.bind(fixture.base);
  let failReadOnce = true;
  fixture.base.getString = (candidate) => {
    if (candidate === key && failReadOnce) {
      failReadOnce = false;
      throw new Error("injected_readback_failure");
    }
    return getString(candidate);
  };
  const expected = expectedTarget();

  const receipt = runBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash, NONCE);

  assert.equal(receipt.result, "failed");
  assert.equal(receipt.stage, "canary_adapter_operation_failed");
  assert.equal(receipt.cleanupVerified, true);
  assert.equal(fixture.base.getAllKeys().includes(key), false);
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "remove" && operation.key === key), true);
});

test("canary reports cleanup failure without claiming a preserved-state pass", async () => {
  const fixture = await activeGuestFixture();
  const key = `patternly:profile:v1:bizq01-canary-${NONCE}:adapter-check:${NONCE}`;
  fixture.base.setFailurePlan({ kind: "fail_on_key_remove", key });
  const expected = expectedTarget();

  const receipt = runBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash, NONCE);

  assert.equal(receipt.result, "failed");
  assert.equal(receipt.stage, "canary_cleanup_failed");
  assert.equal(receipt.cleanupVerified, false);
  assert.equal(receipt.protectedStateUnchanged, false);
  assert.equal(fixture.base.getAllKeys().includes(key), true);
});

test("read-only reconciliation reports exact Guest and clean empty canary family without writes", async () => {
  const fixture = await activeGuestFixture();
  const expected = expectedTarget();
  fixture.base.resetCounters();

  const receipt = inspectBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash);

  assert.equal(receipt.result, "observed");
  assert.equal(typeof (receipt as unknown as { then?: unknown }).then, "undefined");
  assert.equal(receipt.stage, "complete");
  assert.equal(receipt.profileTransitionActive, false);
  assert.equal(receipt.activeLearningWorkPresent, false);
  assert.equal(receipt.selectedGuestMatches, true);
  assert.equal(receipt.guestKind, "guest");
  assert.equal(receipt.canaryFamilyKeyCount, 0);
  assert.equal(receipt.accountProfileCount, 1);
  assert.equal(receipt.guestProfileCount, 1);
  assert.match(receipt.profileIdentityInventorySha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.match(receipt.protectedAdapterStateSha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.equal(JSON.stringify(receipt).includes(GUEST_ID), false);
  assert.equal(JSON.stringify(receipt).includes(INSTALLATION_ID), false);
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);
});

test("read-only reconciliation recognizes canonical training-session results while refusing unknown keys", async () => {
  const fixture = await activeGuestFixture();
  const expected = expectedTarget();
  const resultKey = STORAGE_KEYS.trainingSessionResult("session-result-fixture");
  getKeyValueStorage().setString(resultKey, "opaque canonical training result");
  assert.equal(getKeyValueStorage().getAllKeys().includes(resultKey), true);
  assert.equal(fixture.router.storage.getAllKeys().includes(resultKey), true);
  fixture.base.resetCounters();

  const receipt = inspectBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash);

  assert.equal(receipt.result, "observed");
  assert.equal(receipt.stage, "complete");
  assert.equal(receipt.guestKeyCount, 3);
  assert.equal(receipt.guestRecordCount, 1);
  assert.equal(receipt.guestMetadataKeyCount, 2);
  assert.equal(JSON.stringify(receipt).includes(resultKey), false);
  assert.equal(JSON.stringify(receipt).includes("opaque canonical training result"), false);
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);

  getKeyValueStorage().setString("patternly:canonical:v1:unknown-record:fixture", "unknown value");
  fixture.base.resetCounters();
  const unknown = inspectBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash);
  assert.equal(unknown.result, "failed");
  assert.equal(unknown.stage, "protected_state_unavailable");
  assert.equal(JSON.stringify(unknown).includes("unknown-record"), false);
  assert.equal(JSON.stringify(unknown).includes("unknown value"), false);
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);
});

test("read-only reconciliation observes canary-family keys without removing them and reports transition state", async () => {
  const fixture = await activeGuestFixture();
  const expected = expectedTarget();
  const first = runBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash, NONCE);
  assert.equal(first.result, "passed");
  assert.equal(isProfileTransitionActive(), true);
  fixture.base.resetCounters();

  const receipt = inspectBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash);

  assert.equal(receipt.result, "observed");
  assert.equal(receipt.stage, "complete");
  assert.equal(receipt.profileTransitionActive, true);
  assert.equal(receipt.canaryFamilyKeyCount, 0);
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);
});

test("read-only reconciliation reports but never cleans a pre-existing canary-family key", async () => {
  const fixture = await activeGuestFixture();
  const expected = expectedTarget();
  const key = `patternly:profile:v1:bizq01-canary-${NONCE}:adapter-check:${NONCE}`;
  fixture.base.setString(key, "unresolved-canary-value");
  fixture.base.resetCounters();

  const receipt = inspectBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash);

  assert.equal(receipt.result, "observed");
  assert.equal(receipt.stage, "canary_family_nonempty");
  assert.equal(receipt.canaryFamilyKeyCount, 1);
  assert.match(receipt.canaryFamilyKeyInventorySha256 ?? "", /^[a-f0-9]{64}$/u);
  assert.equal(JSON.stringify(receipt).includes(NONCE), false);
  assert.equal(fixture.base.getAllKeys().includes(key), true);
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);
});

test("post-cold prefix inspection counts no exact removed-Guest keys and never mutates storage", async () => {
  const fixture = await activeGuestFixture(9);
  const expected = expectedTarget();
  const unrelatedProfileId = "00000000-0000-4000-8000-000000000099";
  const unrelatedKey = `patternly:profile:v1:${unrelatedProfileId}:opaque-record`;
  fixture.base.setString(unrelatedKey, "private value");
  fixture.base.resetCounters();

  const receipt = inspectRemovedOriginalGuest34(expected.datasetHash, expected.installationHash);

  assert.deepEqual(receipt, {
    schemaVersion: "bizq01-guest-removal-postcold-prefix-v1",
    result: "observed",
    stage: "complete",
    oldPrefixKeyCount: 0,
  });
  assert.equal(JSON.stringify(receipt).includes(unrelatedProfileId), false);
  assert.equal(JSON.stringify(receipt).includes(unrelatedKey), false);
  assert.equal(JSON.stringify(receipt).includes("private value"), false);
  assert.equal(fixture.base.getAllKeys().includes(unrelatedKey), true);
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);
});

test("post-cold prefix inspection refuses wrong Guest identity and active transition", async () => {
  const fixture = await activeGuestFixture(9);
  const expected = expectedTarget();
  fixture.base.resetCounters();

  const wrongGuest = inspectRemovedOriginalGuest34("0".repeat(64), expected.installationHash);
  assert.deepEqual(wrongGuest, {
    schemaVersion: "bizq01-guest-removal-postcold-prefix-v1",
    result: "failed",
    stage: "guest_reconciliation_failed",
  });
  assert.equal(fixture.base.operations.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);

  runBizq01GuestRemoval34Canary(expected.datasetHash, expected.installationHash, NONCE);
  const transitioning = inspectRemovedOriginalGuest34(expected.datasetHash, expected.installationHash);
  assert.equal(transitioning.result, "failed");
  assert.equal(transitioning.stage, "profile_transition_active");
  assert.equal(JSON.stringify(transitioning).includes(GUEST_ID), false);
});

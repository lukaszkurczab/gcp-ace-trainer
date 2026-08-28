import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { bootstrapApplication } from "../../application/bootstrap";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { getGuestInstallation, provisionGuestInstallation } from "./";
import { writeCanonicalJson } from "./canonicalRecordCodec";

const firstIdentity = Object.freeze({ installationId: "11111111-1111-4111-8111-111111111111", localDatasetId: "22222222-2222-4222-8222-222222222222" });
const secondIdentity = Object.freeze({ installationId: "33333333-3333-4333-8333-333333333333", localDatasetId: "44444444-4444-4444-8444-444444444444" });

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("provisions one validated guest installation and preserves it across repeated bootstrap", async () => {
  let calls = 0;
  const identity = { async create() { calls += 1; return firstIdentity; } };
  const first = await bootstrapApplication(async () => undefined, async () => undefined, undefined, { repositories: { guestInstallationIdentity: identity } });
  const second = await bootstrapApplication(async () => undefined, async () => undefined, undefined, { repositories: { guestInstallationIdentity: { async create() { return secondIdentity; } } } });

  assert.deepEqual(first, { kind: "ready", activeSessionId: null });
  assert.deepEqual(second, { kind: "ready", activeSessionId: null });
  assert.equal(calls, 1);
  assert.deepEqual(await getGuestInstallation(), { ...firstIdentity, accountId: null, bindingState: "guest" });
});

test("corrupt or unsupported guest installation records block without replacement", async () => {
  const storage = new MemoryKeyValueStorage();
  storage.setString(STORAGE_KEYS.GUEST_INSTALLATION, "{");
  installKeyValueStorageForTests(storage);
  const corrupt = await bootstrapApplication(async () => undefined, async () => undefined);
  assert.equal(corrupt.kind, "blocking");
  assert.equal(storage.getString(STORAGE_KEYS.GUEST_INSTALLATION), "{");

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, { installationId: firstIdentity.installationId, localDatasetId: firstIdentity.localDatasetId, bindingState: "not-a-binding-state" });
  const unsupported = await bootstrapApplication(async () => undefined, async () => undefined);
  assert.equal(unsupported.kind, "blocking");
  await assert.rejects(getGuestInstallation(), /is unsupported/);
});

test("guest installation blocks coercible identifiers and non-v4 UUID records", async () => {
  for (const record of [
    { installationId: [firstIdentity.installationId], localDatasetId: firstIdentity.localDatasetId, bindingState: "guest", accountId: null },
    { installationId: "11111111-1111-1111-8111-111111111111", localDatasetId: firstIdentity.localDatasetId, bindingState: "guest", accountId: null },
  ]) {
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
    writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, record);
    const result = await bootstrapApplication(async () => undefined, async () => undefined);
    assert.equal(result.kind, "blocking");
    await assert.rejects(getGuestInstallation(), /is unsupported/);
  }
});

test("valid later binding states are preserved without adopting or regenerating an installation", async () => {
  for (const bindingState of ["adoption_pending", "account_bound"] as const) {
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
    writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, { ...firstIdentity, accountId: bindingState === "account_bound" ? "55555555-5555-4555-8555-555555555555" : null, bindingState });
    let identityCalls = 0;
    const result = await bootstrapApplication(
      async () => undefined,
      async () => undefined,
      undefined,
      { repositories: { guestInstallationIdentity: { async create() { identityCalls += 1; return secondIdentity; } } } },
    );
    assert.deepEqual(result, { kind: "ready", activeSessionId: null });
    assert.equal(identityCalls, 0);
    assert.deepEqual(await getGuestInstallation(), { ...firstIdentity, accountId: bindingState === "account_bound" ? "55555555-5555-4555-8555-555555555555" : null, bindingState });
  }
});

test("identity or write failure blocks before recovery/content and leaves no partial guest record", async () => {
  const events: string[] = [];
  const generationFailure = await bootstrapApplication(
    async () => { events.push("content"); },
    async () => undefined,
    undefined,
    { repositories: { guestInstallationIdentity: { async create() { throw new Error("identity unavailable"); } } } },
  );
  assert.equal(generationFailure.kind, "blocking");
  assert.equal(events.length, 0);
  assert.equal(await getGuestInstallation(), null);

  const storage = new MemoryKeyValueStorage();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.GUEST_INSTALLATION });
  installKeyValueStorageForTests(storage);
  const writeFailure = await bootstrapApplication(
    async () => { events.push("content"); },
    async () => undefined,
    undefined,
    { repositories: { guestInstallationIdentity: { async create() { return firstIdentity; } } } },
  );
  assert.equal(writeFailure.kind, "blocking");
  assert.equal(events.length, 0);
  assert.equal(storage.getString(STORAGE_KEYS.GUEST_INSTALLATION), undefined);
});

test("guest installation rejects malformed generated identities without writing", async () => {
  await assert.rejects(
    () => provisionGuestInstallation({ async create() { return { installationId: "not-opaque", localDatasetId: "also-not-opaque" }; } }),
    /Guest installation identity is invalid/,
  );
  assert.equal(await getGuestInstallation(), null);
});

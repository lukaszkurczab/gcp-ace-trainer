import assert from "node:assert/strict";
import test from "node:test";

import { LocalLogoutControlError, createLocalLogoutControl, type LocalLogoutControlSnapshot } from "./localLogoutControl";
import type { StorageManifestStore } from "./encryptedStorageBootstrap";

const KEY = "patternly.local-logout-control.v1";

class MemoryManifestStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  gets = 0;
  sets = 0;
  failGet = false;
  failSet = false;
  persistThenFailSet = false;
  wrongReadBack = false;

  async get(key: string) {
    this.gets += 1;
    if (this.failGet) throw new Error("injected_get_failure");
    if (this.wrongReadBack && this.sets > 0) return "{}";
    return this.values.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.sets += 1;
    if (this.persistThenFailSet) {
      this.values.set(key, value);
      throw new Error("interrupted_after_persist");
    }
    if (this.failSet) throw new Error("injected_set_failure");
    this.values.set(key, value);
  }
  async remove(key: string) { this.values.delete(key); }
}

function memoryStore(): MemoryManifestStore { return new MemoryManifestStore(); }

function expected(blocked: { uid: string; operationId: string } | null, pending: { uid: string; operationId: string }[] = []): LocalLogoutControlSnapshot {
  return { blocked, pending, version: 1 };
}

test("stores one strict, versioned record with only block and pending identity metadata", async () => {
  const store = memoryStore();
  const control = createLocalLogoutControl(store);

  assert.deepEqual(await control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001"), expected({ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }]));
  assert.deepEqual([...store.values.keys()], [KEY]);
  const raw = store.values.get(KEY)!;
  assert.deepEqual(JSON.parse(raw), {
    blocked: { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" },
    pending: [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }],
    version: 1,
  });
  assert.equal(/token|password|payload|outbox/i.test(raw), false);
});

test("duplicate UID and operation ID remains one pending entry and verified state", async () => {
  const store = memoryStore();
  const control = createLocalLogoutControl(store);
  await control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001");
  const duplicate = await control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001");

  assert.deepEqual(duplicate, expected({ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }]));
  assert.equal((JSON.parse(store.values.get(KEY)!).pending as unknown[]).length, 1);
});

test("operation IDs must be UUIDv4 both on writes and when loading persisted records", async () => {
  const store = memoryStore();
  const control = createLocalLogoutControl(store);
  await assert.rejects(control.blockAndQueueRevoke("uid-A", "not-a-uuid"), (error: unknown) => error instanceof LocalLogoutControlError && error.code === "local_logout_control_unavailable");
  assert.equal(store.sets, 0);

  store.values.set(KEY, JSON.stringify({
    blocked: null,
    pending: [{ uid: "uid-A", operationId: "00000000-0000-1000-8000-000000000001" }],
    version: 1,
  }));
  await assert.rejects(control.read(), (error: unknown) => error instanceof LocalLogoutControlError && error.code === "local_logout_control_corrupt");
});

test("a stale UID or operation cannot clear a newer block", async () => {
  const store = memoryStore();
  const control = createLocalLogoutControl(store);
  await control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001");
  const current = await control.blockAndQueueRevoke("uid-B", "00000000-0000-4000-8000-000000000002");

  assert.deepEqual(await control.clearBlockForAuth("uid-A", "00000000-0000-4000-8000-000000000001"), current);
  assert.deepEqual(await control.clearBlockForAuth("uid-B", "00000000-0000-4000-8000-000000000001"), current);
  assert.deepEqual(await control.read(), current);
});

test("verified UID or null Auth can clear the matching block while retaining pending work", async () => {
  const store = memoryStore();
  const control = createLocalLogoutControl(store);
  const pending = [
    { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" },
    { uid: "uid-B", operationId: "00000000-0000-4000-8000-000000000002" },
  ];
  await control.blockAndQueueRevoke(...[pending[0]!.uid, pending[0]!.operationId]);
  await control.blockAndQueueRevoke(pending[1]!.uid, pending[1]!.operationId);

  assert.deepEqual(await control.clearBlockForAuth("uid-B", "00000000-0000-4000-8000-000000000002"), expected(null, pending));
  await control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001");
  assert.deepEqual(await control.clearBlockForAuth(null, "00000000-0000-4000-8000-000000000001"), expected(null, pending));
});

test("a queued null-Auth clear rechecks its guard inside the serialized mutation", async () => {
  const store = memoryStore();
  let releaseFirstGet!: () => void;
  let markFirstGetStarted!: () => void;
  let firstGet = true;
  const firstGetStarted = new Promise<void>((resolve) => { markFirstGetStarted = resolve; });
  const firstGetBarrier = new Promise<void>((resolve) => { releaseFirstGet = resolve; });
  const delayedStore: StorageManifestStore = {
    get: async (key) => {
      if (firstGet) {
        firstGet = false;
        markFirstGetStarted();
        await firstGetBarrier;
      }
      return store.get(key);
    },
    set: (key, value) => store.set(key, value),
    remove: (key) => store.remove(key),
  };
  const control = createLocalLogoutControl(delayedStore);
  const operationId = "00000000-0000-4000-8000-000000000001";
  const blockWrite = control.blockAndQueueRevoke("uid-A", operationId);
  await firstGetStarted;
  let canClear = true;
  const clear = control.clearBlockForAuth(null, operationId, () => canClear);
  canClear = false;
  releaseFirstGet();

  const blocked = await blockWrite;
  assert.deepEqual(await clear, blocked);
  assert.deepEqual(await control.read(), blocked);
});

test("another UID cannot alter a different UID's pending operation", async () => {
  const store = memoryStore();
  const control = createLocalLogoutControl(store);
  await control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-00000000000a");
  await control.blockAndQueueRevoke("uid-B", "00000000-0000-4000-8000-00000000000b");
  await control.clearBlockForAuth("uid-B", "00000000-0000-4000-8000-00000000000b");

  assert.deepEqual(await control.read(), expected(null, [
    { uid: "uid-A", operationId: "00000000-0000-4000-8000-00000000000a" },
    { uid: "uid-B", operationId: "00000000-0000-4000-8000-00000000000b" },
  ]));
});

test("corrupt or unknown-version records fail closed without being overwritten", async () => {
  for (const raw of [
    "{",
    JSON.stringify({ blocked: null, pending: [], version: 2 }),
    JSON.stringify({ blocked: null, pending: [], version: 1, payload: { uid: "uid-A" } }),
    JSON.stringify({ blocked: { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, pending: [], version: 1 }),
    JSON.stringify({ blocked: null, pending: [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001", payload: "secret" }], version: 1 }),
  ]) {
    const store = memoryStore();
    store.values.set(KEY, raw);
    const control = createLocalLogoutControl(store);
    await assert.rejects(control.read(), (error: unknown) => error instanceof LocalLogoutControlError && error.code === "local_logout_control_corrupt");
    await assert.rejects(control.blockAndQueueRevoke("uid-B", "00000000-0000-4000-8000-000000000002"), LocalLogoutControlError);
    assert.equal(store.values.get(KEY), raw);
    assert.equal(store.sets, 0);
  }
});

test("read and write errors fail closed; an interrupted persisted write is safe to retry", async () => {
  const readFailureStore = memoryStore();
  readFailureStore.failGet = true;
  await assert.rejects(createLocalLogoutControl(readFailureStore).blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001"), (error: unknown) => error instanceof LocalLogoutControlError && error.code === "local_logout_control_unavailable");
  assert.equal(readFailureStore.sets, 0);

  const writeFailureStore = memoryStore();
  writeFailureStore.failSet = true;
  await assert.rejects(createLocalLogoutControl(writeFailureStore).blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001"), (error: unknown) => error instanceof LocalLogoutControlError && error.code === "local_logout_control_unavailable");
  assert.equal(writeFailureStore.values.has(KEY), false);

  const interruptedStore = memoryStore();
  interruptedStore.persistThenFailSet = true;
  const control = createLocalLogoutControl(interruptedStore);
  await assert.rejects(control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001"), LocalLogoutControlError);
  interruptedStore.persistThenFailSet = false;
  assert.deepEqual(await control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001"), expected({ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }]));
});

test("a write is not accepted until read-back matches exactly", async () => {
  const store = memoryStore();
  store.wrongReadBack = true;
  await assert.rejects(createLocalLogoutControl(store).blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001"), (error: unknown) => error instanceof LocalLogoutControlError && error.code === "local_logout_control_verification_failed");
});

test("snapshots are deeply immutable and independent of later mutations", async () => {
  const store = memoryStore();
  const control = createLocalLogoutControl(store);
  const snapshot = await control.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-000000000001");
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.blocked), true);
  assert.equal(Object.isFrozen(snapshot.pending), true);
  assert.equal(Object.isFrozen(snapshot.pending[0]), true);
  assert.throws(() => { (snapshot.pending[0] as { uid: string }).uid = "uid-B"; }, TypeError);
  await control.clearBlockForAuth("uid-A", "00000000-0000-4000-8000-000000000001");
  assert.deepEqual(snapshot, expected({ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }]));
});

test("transactions serialize across control instances in the JavaScript runtime", async () => {
  const store = memoryStore();
  const first = createLocalLogoutControl(store);
  const second = createLocalLogoutControl(store);
  await Promise.all([
    first.blockAndQueueRevoke("uid-A", "00000000-0000-4000-8000-00000000000a"),
    second.blockAndQueueRevoke("uid-B", "00000000-0000-4000-8000-00000000000b"),
  ]);

  assert.deepEqual(await first.read(), expected({ uid: "uid-B", operationId: "00000000-0000-4000-8000-00000000000b" }, [
    { uid: "uid-A", operationId: "00000000-0000-4000-8000-00000000000a" },
    { uid: "uid-B", operationId: "00000000-0000-4000-8000-00000000000b" },
  ]));
});

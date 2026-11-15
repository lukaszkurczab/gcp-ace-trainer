import assert from "node:assert/strict";
import test from "node:test";


class MemoryKeyValueStorage {
  private readonly values = new Map<string, string>();
  getAllKeys(): readonly string[] { return [...this.values.keys()]; }
  getString(key: string): string | undefined { return this.values.get(key); }
  setString(key: string, value: string): void { this.values.set(key, value); }
  remove(key: string): void { this.values.delete(key); }
}
import { STORAGE_KEYS } from "../../storage/keys";
import { TODAY_SNAPSHOT_FRESH_MS, TODAY_SNAPSHOT_KEY, clearTodaySnapshotMemory, computeTodayStoreRevision, invalidateTodaySnapshot, isTodayInputKey, readTodaySnapshot, writeTodaySnapshot } from "./todaySnapshot";
import { notifyActorBoundary } from "../bootstrap/parallelBoot";

test.afterEach(() => clearTodaySnapshotMemory());

function seeded(): MemoryKeyValueStorage {
  const storage = new MemoryKeyValueStorage();
  storage.setString(STORAGE_KEYS.ACTIVE_TRACK, "{\"track\":\"a\"}");
  storage.setString(STORAGE_KEYS.trainingAttempt("a1"), "{\"attempt\":1}");
  storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, "[\"a1\"]");
  storage.setString(STORAGE_KEYS.reviewEntry("r1"), "{\"due\":\"x\"}");
  storage.setString(STORAGE_KEYS.ACCOUNT_SYNC, "{\"lastSuccessfulSyncAt\":\"t1\"}");
  storage.setString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, "{\"draft\":1}");
  return storage;
}

test("the store revision follows every Today input and ignores sync bookkeeping, drafts and the snapshot itself", () => {
  const storage = seeded();
  const base = computeTodayStoreRevision(storage);
  assert.equal(computeTodayStoreRevision(storage), base, "deterministic");

  storage.setString(STORAGE_KEYS.ACCOUNT_SYNC, "{\"lastSuccessfulSyncAt\":\"t2\"}");
  storage.setString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, "{\"draft\":2}");
  storage.setString(TODAY_SNAPSHOT_KEY, "{}");
  assert.equal(computeTodayStoreRevision(storage), base, "an unchanged sync, an answer draft or the cache do not invalidate Today");

  storage.setString(STORAGE_KEYS.reviewEntry("r1"), "{\"due\":\"y\"}");
  const updated = computeTodayStoreRevision(storage);
  assert.notEqual(updated, base, "an in-place record update");
  storage.setString(STORAGE_KEYS.trainingAttempt("a2"), "{\"attempt\":2}");
  assert.notEqual(computeTodayStoreRevision(storage), updated, "a new record");
  storage.remove(STORAGE_KEYS.trainingAttempt("a2"));
  assert.equal(computeTodayStoreRevision(storage), updated, "removal restores the earlier revision only with identical records");
  storage.setString(STORAGE_KEYS.goal("track"), "{\"goal\":1}");
  assert.notEqual(computeTodayStoreRevision(storage), updated, "goal");

  assert.equal(isTodayInputKey(STORAGE_KEYS.learningPlan("t")), true);
  assert.equal(isTodayInputKey(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), false);
  assert.equal(isTodayInputKey(STORAGE_KEYS.SETTINGS), false);
});

test("a snapshot is reused only for the same revision and owner; a mismatching persisted copy is removed", () => {
  const storage = seeded();
  const revision = computeTodayStoreRevision(storage);
  const owner = { profileKey: "account:p1:acc-1|premium:allowed|content:x", trackId: "track-a" };
  const now = Date.parse("2026-11-13T10:00:00.000Z");
  writeTodaySnapshot({ revision, owner, capturedAt: "2026-11-13T10:00:00.000Z", data: { value: 1 }, storage, persisted: true });
  assert.ok(storage.getString(TODAY_SNAPSHOT_KEY));

  const memory = readTodaySnapshot<{ value: number }>({ revision, owner, nowMs: now + 1_000, storage, persisted: true });
  assert.equal(memory?.source, "memory");
  assert.equal(memory?.fresh, true);
  assert.deepEqual(memory?.snapshot.data, { value: 1 });

  clearTodaySnapshotMemory(); // cold start
  const persisted = readTodaySnapshot<{ value: number }>({ revision, owner, nowMs: now + TODAY_SNAPSHOT_FRESH_MS + 1, storage, persisted: true });
  assert.equal(persisted?.source, "persisted");
  assert.equal(persisted?.fresh, false, "an old snapshot is shown, then revalidated");

  clearTodaySnapshotMemory();
  assert.equal(readTodaySnapshot({ revision, owner: { ...owner, trackId: "track-b" }, nowMs: now, storage, persisted: true }), null, "another track");
  assert.equal(storage.getString(TODAY_SNAPSHOT_KEY), undefined, "no derived copy outlives a mismatch");

  writeTodaySnapshot({ revision, owner, capturedAt: "2026-11-13T10:00:00.000Z", data: { value: 1 }, storage, persisted: true });
  clearTodaySnapshotMemory();
  assert.equal(readTodaySnapshot({ revision, owner: { ...owner, profileKey: "account:p2:acc-2|premium:allowed|content:x" }, nowMs: now, storage, persisted: true }), null, "another profile or account");
  writeTodaySnapshot({ revision, owner, capturedAt: "2026-11-13T10:00:00.000Z", data: { value: 1 }, storage, persisted: true });
  clearTodaySnapshotMemory();
  assert.equal(readTodaySnapshot({ revision: "other", owner, nowMs: now, storage, persisted: true }), null, "a changed store");
  storage.setString(TODAY_SNAPSHOT_KEY, "{not json");
  assert.equal(readTodaySnapshot({ revision, owner, nowMs: now, storage, persisted: true }), null, "a corrupt copy");
  assert.equal(storage.getString(TODAY_SNAPSHOT_KEY), undefined);
});

test("persisting is on by default; PERSIST=0 keeps only the memory layer", () => {
  const defaultStorage = seeded();
  writeTodaySnapshot({ revision: "r", owner: { profileKey: "k", trackId: null }, capturedAt: "2026-11-13T10:00:00.000Z", data: {}, storage: defaultStorage });
  assert.ok(defaultStorage.getString(TODAY_SNAPSHOT_KEY), "owner decision 2026-11-13: on by default");
  const storage = seeded();
  const revision = computeTodayStoreRevision(storage);
  const owner = { profileKey: "guest|guest:g1:", trackId: null };
  writeTodaySnapshot({ revision, owner, capturedAt: "2026-11-13T10:00:00.000Z", data: { v: 2 }, storage, persisted: false });
  assert.equal(storage.getString(TODAY_SNAPSHOT_KEY), undefined);
  assert.equal(readTodaySnapshot({ revision, owner, nowMs: Date.parse("2026-11-13T10:00:01.000Z"), storage, persisted: false })?.source, "memory");
  clearTodaySnapshotMemory();
  assert.equal(readTodaySnapshot({ revision, owner, nowMs: 0, storage, persisted: false }), null);
});

test("foreign actor or lease, an old revision and a corrupt entry are ignored, removed and never throw", () => {
  const storage = seeded();
  const revision = computeTodayStoreRevision(storage);
  const mine = { profileKey: "uid:a|account:p1:acc-1|premium:allowed|content:x", trackId: "t" };
  const now = Date.parse("2026-11-13T10:00:00.000Z");
  const write = () => { writeTodaySnapshot({ revision, owner: mine, capturedAt: "2026-11-13T10:00:00.000Z", data: { v: 1 }, storage }); clearTodaySnapshotMemory(); };
  write();
  assert.equal(readTodaySnapshot({ revision, owner: { ...mine, profileKey: "uid:b|account:p1:acc-1|premium:allowed|content:x" }, nowMs: now, storage }), null, "another actor on the same profile");
  assert.equal(storage.getString(TODAY_SNAPSHOT_KEY), undefined);
  write();
  assert.equal(readTodaySnapshot({ revision, owner: { ...mine, profileKey: "uid:a|account:p2:acc-1|premium:allowed|content:x" }, nowMs: now, storage }), null, "another profile lease");
  write();
  storage.setString(STORAGE_KEYS.trainingAttempt("new"), "{\"attempt\":3}");
  assert.equal(readTodaySnapshot({ revision: computeTodayStoreRevision(storage), owner: mine, nowMs: now, storage }), null, "old revision after a new attempt");
  for (const corrupt of ["", "null", "[]", "{\"schema\":2}", JSON.stringify({ schema: 1, revision, owner: mine, capturedAt: "not a date", data: {} }), JSON.stringify({ schema: 1, revision, owner: mine, capturedAt: "2026-11-13T10:00:00.000Z", data: null })]) {
    storage.setString(TODAY_SNAPSHOT_KEY, corrupt);
    assert.doesNotThrow(() => assert.equal(readTodaySnapshot({ revision, owner: mine, nowMs: now, storage }), null, corrupt));
    assert.equal(storage.getString(TODAY_SNAPSHOT_KEY), undefined, corrupt);
  }
  const throwing = { getString: () => { throw new Error("store closed"); }, remove: () => { throw new Error("store closed"); } };
  assert.equal(readTodaySnapshot({ revision, owner: mine, nowMs: now, storage: throwing }), null, "an unreadable store never blocks the start");
});

test("sign-out, deletion or actor change drops both layers (account provider boundary)", () => {
  const storage = seeded();
  const revision = computeTodayStoreRevision(storage);
  const owner = { profileKey: "uid:a|account:p1:acc-1|premium:allowed|content:x", trackId: "t" };
  writeTodaySnapshot({ revision, owner, capturedAt: "2026-11-13T10:00:00.000Z", data: { v: 1 }, storage });
  notifyActorBoundary(storage);
  assert.equal(storage.getString(TODAY_SNAPSHOT_KEY), undefined, "removed by the provider boundary even if Home never loaded");
  writeTodaySnapshot({ revision, owner, capturedAt: "2026-11-13T10:00:00.000Z", data: { v: 1 }, storage });
  invalidateTodaySnapshot(null);
  assert.equal(readTodaySnapshot({ revision, owner, nowMs: Date.parse("2026-11-13T10:00:01.000Z"), storage: null }), null, "memory dropped too");
});

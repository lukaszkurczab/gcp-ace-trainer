import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  PROGRESS_SNAPSHOT_CACHE_KEY,
  PatternlyApiClientError,
  createPatternlyApiClient,
} from "./PatternlyApiClientAdapter";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../storage/mmkvClient";
import { PROGRESS_SNAPSHOT_STORE_KEY, notifyActorBoundary } from "../../application/bootstrap/parallelBoot";

/*
 * T3.3a: the sweep cache survives a cold start and is only ever used after
 * the server confirms its validator.
 */

const API_ORIGIN = "https://api.sandbox.patternly.invalid";
const TOKEN = "c".repeat(64);
const SCOPE = "d".repeat(64);
const record = {
  kind: "node", recordType: "active_track", trackId: "coding-interview-dsa-problem-solving", targetId: "current",
  fingerprint: "a".repeat(64), state: { trackId: "coding-interview-dsa-problem-solving" },
  version: 1, lastMutationId: "persisted-mutation-0001", updatedAt: "2026-11-14T00:00:00.000Z",
};
const page = { accountRevision: 1, generation: 0, snapshotToken: TOKEN, snapshotScope: SCOPE, records: [record], nextPageToken: null };
const unchanged = { accountRevision: 1, generation: 0, snapshotToken: TOKEN, snapshotScope: SCOPE, unchanged: true };
const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200 });
const flushPersist = () => new Promise((resolve) => setTimeout(resolve, 1_100));

let storage: MemoryKeyValueStorage;
beforeEach(() => { storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); });

function client(answer: (url: URL) => unknown, urls: URL[], apiOrigin = API_ORIGIN) {
  return createPatternlyApiClient({
    apiOrigin, getIdToken: async () => "id-token", getAppCheckToken: async () => "app-check-token",
    fetchImplementation: async (url) => { const parsed = new URL(String(url)); urls.push(parsed); return json(answer(parsed)); },
  });
}

async function persistedSweep(): Promise<void> {
  const urls: URL[] = [];
  await client(() => page, urls).getProgressSnapshot(null);
  await flushPersist();
  assert.ok(storage.getString(PROGRESS_SNAPSHOT_CACHE_KEY), "a full sweep is persisted after the deferred write");
}

test("T3.3a: a cold start revalidates the persisted sweep: one request, then compositions work as in a warm process", async () => {
  await persistedSweep();
  const urls: URL[] = [];
  const cold = client((url) => (url.searchParams.get("knownSnapshot") === TOKEN || url.searchParams.get("knownRevision") === "1" ? unchanged : page), urls);
  assert.deepEqual(await cold.getProgressSnapshot(TOKEN), { kind: "unchanged", accountRevision: 1, generation: 0, snapshotToken: TOKEN });
  assert.equal(urls.length, 1);
  assert.equal(urls[0]!.searchParams.get("knownSnapshot"), TOKEN);
  // Without its own validator the caller gets the copy, served from the persisted sweep.
  const read = await cold.getProgressSnapshot(null);
  assert.equal(urls.length, 2);
  assert.equal(read.kind === "full" && read.progress.records[0]!.lastMutationId, "persisted-mutation-0001");
});

test("T3.3a: a damaged, foreign-origin or wrong-schema persisted sweep is never used", async () => {
  await persistedSweep();
  const raw = storage.getString(PROGRESS_SNAPSHOT_CACHE_KEY)!;
  for (const damaged of [raw.replace("persisted-mutation-0001", "persisted-mutation-0002"), raw.replace(`"schema":1`, `"schema":2`), "garbage", raw.split("\n")[0]!]) {
    storage.setString(PROGRESS_SNAPSHOT_CACHE_KEY, damaged);
    const urls: URL[] = [];
    const read = await client(() => page, urls).getProgressSnapshot(null);
    assert.equal(urls[0]!.searchParams.has("knownSnapshot"), false, "no validator from a rejected cache");
    assert.equal(read.kind, "full");
    await flushPersist();
    assert.equal(storage.getString(PROGRESS_SNAPSHOT_CACHE_KEY), raw, "the fresh full sweep replaces it");
  }
  const urls: URL[] = [];
  await client(() => page, urls, "https://other.patternly.invalid").getProgressSnapshot(null);
  assert.equal(urls[0]!.searchParams.has("knownSnapshot"), false, "another API origin never reuses the sweep");
});

test("T3.3a: a changed account answers in full and replaces the persisted sweep; a failed read drops it", async () => {
  await persistedSweep();
  const changed = { ...page, accountRevision: 2, snapshotToken: "e".repeat(64), records: [{ ...record, version: 2, lastMutationId: "persisted-mutation-0002" }] };
  const urls: URL[] = [];
  const read = await client(() => changed, urls).getProgressSnapshot(TOKEN);
  assert.equal(urls[0]!.searchParams.get("knownSnapshot"), TOKEN);
  assert.equal(read.kind === "full" && read.snapshotToken, "e".repeat(64));
  await flushPersist();
  assert.match(storage.getString(PROGRESS_SNAPSHOT_CACHE_KEY)!, /persisted-mutation-0002/u);
  const failing = createPatternlyApiClient({ apiOrigin: API_ORIGIN, getIdToken: async () => "id-token", getAppCheckToken: async () => "app-check-token",
    fetchImplementation: async () => json({ ...unchanged, snapshotToken: "f".repeat(64) }) });
  await assert.rejects(failing.getProgressSnapshot(null), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  assert.equal(storage.getString(PROGRESS_SNAPSHOT_CACHE_KEY), undefined, "a rejected revalidation drops the persisted sweep");
});

test("T3.3a: the actor boundary removes the persisted sweep", async () => {
  assert.equal(PROGRESS_SNAPSHOT_STORE_KEY, PROGRESS_SNAPSHOT_CACHE_KEY);
  await persistedSweep();
  notifyActorBoundary(storage);
  assert.equal(storage.getString(PROGRESS_SNAPSHOT_CACHE_KEY), undefined);
});

import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { PROGRESS_SNAPSHOT_CACHE_KEY, PatternlyApiClientError, createPatternlyApiClient } from "./PatternlyApiClientAdapter";
import { installProgressSnapshotPersistence } from "../../application/account/progressSnapshotPersistence";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../storage/mmkvClient";

/*
 * T3.2: `/me` and the first conditional progress page arrive in one
 * `GET /v1/bootstrap`; the next progress read of the start uses that page.
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
const me = { user: {
  id: "00000000-0000-4000-8000-000000000303", createdAt: "2026-10-04T10:20:30.000Z", acceptedTermsVersion: null,
  identity: { provider: "firebase", subject: "provider-subject", email: null, emailVerified: true },
} };
const envelope = (components: Record<string, unknown>) => ({ bootstrapVersion: 1, serverObservedAt: "2026-11-20T00:00:00.000Z", components });
const flushPersist = () => new Promise((resolve) => setTimeout(resolve, 1_100));

let storage: MemoryKeyValueStorage;
beforeEach(() => { storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); installProgressSnapshotPersistence(); });

function client(answer: (url: URL) => unknown, urls: URL[]) {
  return createPatternlyApiClient({
    apiOrigin: API_ORIGIN, getIdToken: async () => "id-token", getAppCheckToken: async () => "app-check-token",
    fetchImplementation: async (url) => { const parsed = new URL(String(url)); urls.push(parsed); return new Response(JSON.stringify(answer(parsed)), { status: 200 }); },
  });
}

async function persistedSweep(): Promise<void> {
  await client(() => page, []).getProgressSnapshot(null);
  await flushPersist();
  assert.ok(storage.getString(PROGRESS_SNAPSHOT_CACHE_KEY));
}

test("T3.2: without a cached sweep /me is one bootstrap request for `me` only", async () => {
  const urls: URL[] = [];
  const api = client(() => envelope({ me: { status: 200, body: me } }), urls);
  assert.equal((await api.getMe()).user.id, me.user.id);
  assert.deepEqual(urls.map((url) => `${url.pathname}${url.search}`), ["/v1/bootstrap?include=me"]);
});

test("T3.2: a restart reads /me and the unchanged progress validator in one request", async () => {
  await persistedSweep();
  const urls: URL[] = [];
  const api = client((url) => {
    assert.equal(url.pathname, "/v1/bootstrap", "the start window makes no other request");
    return envelope({ me: { status: 200, body: me }, progress: { status: 200, body: unchanged } });
  }, urls);
  await api.getMe();
  assert.equal(urls[0]!.searchParams.get("include"), "me,progress");
  assert.equal(urls[0]!.searchParams.get("progressKnownSnapshot"), TOKEN);
  assert.deepEqual(await api.getProgressSnapshot(TOKEN), { kind: "unchanged", accountRevision: 1, generation: 0, snapshotToken: TOKEN });
  assert.equal(urls.length, 1, "the progress read used the bootstrap page");
});

test("T3.2: the bootstrap page is used once, and only for the same first-page request", async () => {
  await persistedSweep();
  const urls: URL[] = [];
  const api = client((url) => url.pathname === "/v1/bootstrap"
    ? envelope({ me: { status: 200, body: me }, progress: { status: 200, body: { ...page, accountRevision: 2, snapshotToken: "e".repeat(64) } } })
    : { ...unchanged, accountRevision: 2, snapshotToken: "e".repeat(64) }, urls);
  await api.getMe();
  const full = await api.getProgressSnapshot(null);
  assert.equal(full.kind === "full" && full.snapshotToken, "e".repeat(64));
  assert.equal(urls.length, 1);
  await api.getProgressSnapshot(null);
  assert.equal(urls.length, 2, "a second read goes to the network");
  assert.equal(urls[1]!.pathname, "/v1/progress");
});

test("T3.2: a failed component maps like its own route; a malformed envelope is invalid", async () => {
  const failing = client(() => envelope({ me: { status: 404, body: { error: { code: "user_not_found" } } } }), []);
  await assert.rejects(failing.getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "server_error" && error.status === 404 && error.serverCode === "user_not_found");
  for (const body of [
    { ...envelope({ me: { status: 200, body: me } }), bootstrapVersion: 2 },
    envelope({ me: { status: 200, body: me }, tracks: { status: 200, body: {} } }),
    envelope({ me: { status: 200, body: me, extra: true } }),
    { components: { me: { status: 200, body: me } } },
  ]) {
    await assert.rejects(client(() => body, []).getMe(), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }
});

test("T3.2: a progress component failure surfaces on the progress read, not on /me", async () => {
  await persistedSweep();
  const api = client(() => envelope({ me: { status: 200, body: me }, progress: { status: 409, body: { error: { code: "progress_generation_conflict" } } } }), []);
  await api.getMe();
  await assert.rejects(api.getProgressSnapshot(TOKEN), (error: unknown) => error instanceof PatternlyApiClientError && error.status === 409 && error.serverCode === "progress_generation_conflict");
});

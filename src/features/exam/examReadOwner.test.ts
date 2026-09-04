import assert from "node:assert/strict";
import test from "node:test";

import { createExamReadOwner } from "./examReadOwner";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function ownerFor(getProjection: () => Promise<{ id: string }>, start: () => Promise<void> = async () => undefined) {
  return createExamReadOwner({
    expiredSessionId: (cause) => cause === "expired" ? "expired-session" : null,
    getProjection,
    resumeExpected: async () => ({ kind: "ready" as const, projection: { id: "expected" } }),
    start,
  });
}

test("a request change makes an in-flight interval refresh stale before publication", async () => {
  const read = deferred<{ id: string }>();
  const owner = ownerFor(() => read.promise);
  const firstToken = owner.begin("first");
  const pending = owner.refresh(firstToken, "interval");

  owner.begin("second");
  read.resolve({ id: "first" });

  assert.deepEqual(await pending, { kind: "stale" });
});

test("a newer same-request refresh wins over an older success", async () => {
  const olderRead = deferred<{ id: string }>();
  const newerRead = deferred<{ id: string }>();
  let reads = 0;
  const owner = ownerFor(() => {
    reads += 1;
    return reads === 1 ? olderRead.promise : newerRead.promise;
  });
  const token = owner.begin("exam");
  const older = owner.refresh(token, "interval");
  const newer = owner.refresh(token, "interval");

  newerRead.resolve({ id: "newer" });
  assert.deepEqual(await newer, { kind: "ready", projection: { id: "newer" } });
  olderRead.resolve({ id: "older" });

  assert.deepEqual(await older, { kind: "stale" });
});

test("slow overlapping interval reads keep publishing when they complete in order", async () => {
  const firstRead = deferred<{ id: string }>();
  const secondRead = deferred<{ id: string }>();
  let reads = 0;
  const owner = ownerFor(() => ++reads === 1 ? firstRead.promise : secondRead.promise);
  const token = owner.begin("exam");
  const first = owner.refresh(token, "interval");
  const second = owner.refresh(token, "interval");

  firstRead.resolve({ id: "first" });
  assert.deepEqual(await first, { kind: "ready", projection: { id: "first" } });
  secondRead.resolve({ id: "second" });
  assert.deepEqual(await second, { kind: "ready", projection: { id: "second" } });
});

for (const cause of [new Error("old read failed"), "expired"]) {
  test(`a newer successful refresh suppresses an older ${cause === "expired" ? "expiry" : "error"}`, async () => {
    const olderRead = deferred<{ id: string }>();
    const newerRead = deferred<{ id: string }>();
    let reads = 0;
    const owner = ownerFor(() => ++reads === 1 ? olderRead.promise : newerRead.promise);
    const token = owner.begin("exam");
    const older = owner.refresh(token, "interval");
    const newer = owner.refresh(token, "interval");

    newerRead.resolve({ id: "newer" });
    assert.deepEqual(await newer, { kind: "ready", projection: { id: "newer" } });
    olderRead.reject(cause);
    assert.deepEqual(await older, { kind: "stale" });
  });
}

test("a newer same-request rejection wins over an older success", async () => {
  const olderRead = deferred<{ id: string }>();
  const newerRead = deferred<{ id: string }>();
  let reads = 0;
  const owner = ownerFor(() => {
    reads += 1;
    return reads === 1 ? olderRead.promise : newerRead.promise;
  });
  const token = owner.begin("exam");
  const older = owner.refresh(token, "interval");
  const newer = owner.refresh(token, "interval");
  const cause = new Error("newer refresh failed");

  newerRead.reject(cause);
  assert.deepEqual(await newer, { kind: "unavailable", cause, source: "interval" });
  olderRead.resolve({ id: "older" });

  assert.deepEqual(await older, { kind: "stale" });
});

test("a newer same-request expiry wins over an older success", async () => {
  const olderRead = deferred<{ id: string }>();
  const newerRead = deferred<{ id: string }>();
  let reads = 0;
  const owner = ownerFor(() => {
    reads += 1;
    return reads === 1 ? olderRead.promise : newerRead.promise;
  });
  const token = owner.begin("exam");
  const older = owner.refresh(token, "interval");
  const newer = owner.refresh(token, "interval");

  newerRead.reject("expired");
  assert.deepEqual(await newer, { kind: "expired", sessionId: "expired-session" });
  olderRead.resolve({ id: "older" });

  assert.deepEqual(await older, { kind: "stale" });
});

test("unmount cleanup invalidates an in-flight expiry read before publication", async () => {
  const read = deferred<{ id: string }>();
  const owner = ownerFor(() => read.promise);
  const token = owner.begin("exam");
  const pending = owner.refresh(token, "interval");

  owner.invalidate(token);
  read.reject("expired");

  assert.deepEqual(await pending, { kind: "stale" });
  assert.equal(owner.isCurrent(token), false);
});

test("request change during start-on-miss prevents starting or rereading a replacement exam", async () => {
  const initialRead = deferred<{ id: string }>();
  let starts = 0;
  const owner = ownerFor(() => initialRead.promise, async () => { starts += 1; });
  const firstToken = owner.begin("first");
  const pending = owner.load(firstToken);

  owner.begin("second");
  initialRead.reject(new Error("missing exam"));

  assert.deepEqual(await pending, { kind: "stale" });
  assert.equal(starts, 0);
});

test("unmount cleanup during start-on-miss prevents the after-start interval read", async () => {
  const initialRead = deferred<{ id: string }>();
  const start = deferred<void>();
  let reads = 0;
  let starts = 0;
  const owner = ownerFor(() => {
    reads += 1;
    return initialRead.promise;
  }, async () => {
    starts += 1;
    await start.promise;
  });
  const token = owner.begin("exam");
  const pending = owner.load(token);

  initialRead.reject(new Error("missing exam"));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(starts, 1);
  owner.invalidate(token);
  start.resolve();

  assert.deepEqual(await pending, { kind: "stale" });
  assert.equal(starts, 1);
  assert.equal(reads, 1);
});

test("current start-on-miss refreshes after the new exam is started", async () => {
  const firstRead = deferred<{ id: string }>();
  const secondRead = deferred<{ id: string }>();
  let reads = 0;
  let starts = 0;
  const owner = ownerFor(() => {
    reads += 1;
    return reads === 1 ? firstRead.promise : secondRead.promise;
  }, async () => { starts += 1; });
  const token = owner.begin("exam");
  const pending = owner.load(token);

  firstRead.reject(new Error("missing exam"));
  await Promise.resolve();
  secondRead.resolve({ id: "started" });

  assert.deepEqual(await pending, { kind: "ready", projection: { id: "started" } });
  assert.equal(starts, 1);
  assert.equal(reads, 2);
});

test("request change during expected resume prevents the old session from publishing", async () => {
  const resume = deferred<{ kind: "ready"; projection: { id: string } }>();
  const owner = createExamReadOwner({
    expiredSessionId: () => null,
    getProjection: async () => ({ id: "unused" }),
    resumeExpected: async () => resume.promise,
    start: async () => undefined,
  });
  const firstToken = owner.begin("first");
  const pending = owner.load(firstToken, "expected-first");

  owner.begin("second");
  resume.resolve({ kind: "ready", projection: { id: "first" } });

  assert.deepEqual(await pending, { kind: "stale" });
});

test("the current expiry outcome carries its session id for guarded navigation", async () => {
  const read = deferred<{ id: string }>();
  const owner = ownerFor(() => read.promise);
  const token = owner.begin("exam");
  const pending = owner.refresh(token, "interval");

  read.reject("expired");

  assert.deepEqual(await pending, { kind: "expired", sessionId: "expired-session" });
});

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createRetiredAccountSecretsCleanup } from "./retiredAccountSecrets";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const operationKey = "patternly.security.recovery-operation.v1";
const markerKey = "patternly.security.recovery-code-clipboard.v1";
const operationOptions = { keychainAccessible: 6, keychainService: "com.lkurczab.patternly.recovery-operation" };

function harness() {
  let now = 1_000;
  let clipboard = "";
  const store = new Map<string, string>();
  const events: unknown[][] = [];
  const timers: Array<{ callback: () => void; delay: number }> = [];
  let failOperationDelete = false;
  let failMarkerRead = false;
  let failClipboardRead = false;
  let failClipboardWrite = false;
  let failMarkerDelete = false;
  const cleanup = createRetiredAccountSecretsCleanup({
    secureStoreOptions: operationOptions,
    secureStore: {
      getItemAsync: async (key) => {
        const options = undefined;
        events.push(["get", key, options]);
        if (failMarkerRead) throw new Error("secure_store_unavailable");
        return store.get(key) ?? null;
      },
      deleteItemAsync: async (key, options) => {
        events.push(["delete", key, options]);
        if (key === operationKey && failOperationDelete) throw new Error("secure_store_unavailable");
        if (key === markerKey && failMarkerDelete) throw new Error("secure_store_unavailable");
        store.delete(key);
      },
    },
    clipboard: {
      getStringAsync: async () => {
        events.push(["clipboard-get"]);
        if (failClipboardRead) throw new Error("clipboard_unavailable");
        return clipboard;
      },
      setStringAsync: async (value) => {
        events.push(["clipboard-set", value]);
        if (failClipboardWrite) throw new Error("clipboard_unavailable");
        clipboard = value;
      },
    },
    now: () => now,
    schedule: (callback, delay) => { timers.push({ callback, delay }); return timers.length as unknown as ReturnType<typeof setTimeout>; },
    cancel: () => undefined,
  });
  return {
    cleanup,
    events,
    timers,
    store,
    clipboard: () => clipboard,
    setClipboard: (value: string) => { clipboard = value; },
    setMarker: (record: unknown) => { store.set(markerKey, JSON.stringify(record)); },
    advance: (milliseconds: number) => { now += milliseconds; },
    failOperationDelete: () => { failOperationDelete = true; },
    allowOperationDelete: () => { failOperationDelete = false; },
    failMarkerRead: () => { failMarkerRead = true; },
    failClipboardRead: () => { failClipboardRead = true; },
    failClipboardWrite: () => { failClipboardWrite = true; },
    failMarkerDelete: () => { failMarkerDelete = true; },
  };
}

test("retirement deletes the exact old operation slot without reading its secret bytes", async () => {
  const state = harness();
  state.store.set(operationKey, "synthetic legacy payload containing secret bytes");
  await state.cleanup.reconcile();
  assert.deepEqual(state.events.slice(0, 2), [
    ["delete", operationKey, operationOptions],
    ["get", markerKey, undefined],
  ]);
  assert.equal(state.store.has(operationKey), false);
  assert.equal(state.cleanup.getSnapshot().kind, "complete");
  assert.equal(JSON.stringify(state.events).includes("synthetic legacy payload"), false);
});

test("future clipboard marker keeps the approved expiry and schedules without inspecting clipboard early", async () => {
  const state = harness();
  state.setMarker({ version: 1, clearAfter: 9_000, digest: digest("owned old value") });
  await state.cleanup.reconcile();
  assert.equal(state.events.some(([kind]) => kind === "clipboard-get"), false);
  assert.equal(state.store.has(markerKey), true);
  assert.deepEqual(state.cleanup.getSnapshot(), { kind: "pending", retryAt: 9_000 });
  assert.equal(state.timers.at(-1)?.delay, 8_000);
});

test("expired matching marker clears only owned clipboard content and removes its marker", async () => {
  const state = harness();
  state.setClipboard("owned old value");
  state.setMarker({ version: 1, clearAfter: 1_000, digest: digest("owned old value") });
  await state.cleanup.reconcile();
  assert.equal(state.clipboard(), "");
  assert.equal(state.store.has(markerKey), false);
  assert.equal(state.cleanup.getSnapshot().kind, "complete");
});

test("different clipboard content is preserved and only the obsolete marker is removed", async () => {
  const state = harness();
  state.setClipboard("unrelated current text");
  state.setMarker({ version: 1, clearAfter: 1_000, digest: digest("old owned text") });
  await state.cleanup.reconcile();
  assert.equal(state.clipboard(), "unrelated current text");
  assert.equal(state.events.some(([kind, value]) => kind === "clipboard-set" && value === ""), false);
  assert.equal(state.store.has(markerKey), false);
});

test("storage and clipboard failures preserve retryable state without exposing details", async () => {
  for (const fail of ["operation-delete", "marker-read", "clipboard-read", "clipboard-write", "marker-delete"] as const) {
    const state = harness();
    state.setClipboard("owned old value");
    state.setMarker({ version: 1, clearAfter: 1_000, digest: digest("owned old value") });
    if (fail === "operation-delete") state.failOperationDelete();
    if (fail === "marker-read") state.failMarkerRead();
    if (fail === "clipboard-read") state.failClipboardRead();
    if (fail === "clipboard-write") state.failClipboardWrite();
    if (fail === "marker-delete") state.failMarkerDelete();

    await state.cleanup.reconcile();

    assert.equal(state.cleanup.getSnapshot().kind, "pending", fail);
    const retryState = state.cleanup.getSnapshot();
    assert.equal(retryState.kind === "pending" ? retryState.retryAt : null, 61_000, fail);
    assert.equal(JSON.stringify(state.events).includes("secure_store_unavailable"), false, fail);
    assert.equal(JSON.stringify(state.events).includes("clipboard_unavailable"), false, fail);
    if (fail !== "operation-delete") assert.equal(state.store.has(markerKey), true, fail);
  }
});

test("retry completes retirement once transient failures clear", async () => {
  const state = harness();
  state.failOperationDelete();
  await state.cleanup.reconcile();
  assert.equal(state.cleanup.getSnapshot().kind, "pending");
  state.allowOperationDelete();
  await state.cleanup.reconcile();
  assert.equal(state.cleanup.getSnapshot().kind, "complete");
});

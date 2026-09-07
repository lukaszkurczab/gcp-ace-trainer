import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createRecoveryCodeClipboard, RECOVERY_CODE_CLIPBOARD_RETENTION_MS } from "./recoveryCodeClipboard";

const digest = async (value: string) => createHash("sha256").update(value).digest("hex");

function harness() {
  let now = 1_000;
  let clipboard = "";
  const storage = new Map<string, string>();
  const timers: Array<{ callback: () => void; delay: number }> = [];
  const writes: string[] = [];
  const service = createRecoveryCodeClipboard({
    clipboard: {
      getStringAsync: async () => clipboard,
      setStringAsync: async (value) => { clipboard = value; writes.push(value); return true; },
    },
    secureStore: {
      getItemAsync: async (key) => storage.get(key) ?? null,
      setItemAsync: async (key, value) => { storage.set(key, value); },
      deleteItemAsync: async (key) => { storage.delete(key); },
    },
    digest,
    now: () => now,
    schedule: (callback, delay) => { timers.push({ callback, delay }); return timers.length as unknown as ReturnType<typeof setTimeout>; },
    cancel: () => undefined,
  });
  return {
    service,
    storage,
    timers,
    writes,
    clipboard: () => clipboard,
    setClipboard: (value: string) => { clipboard = value; },
    advance: (milliseconds: number) => { now += milliseconds; },
  };
}

test("copy stores only a digest and schedules cleanup for five minutes", async () => {
  const state = harness();
  await state.service.copy(["ONE", "TWO"]);
  assert.equal(state.clipboard(), "ONE\nTWO");
  assert.equal(state.timers.at(-1)?.delay, RECOVERY_CODE_CLIPBOARD_RETENTION_MS);
  const record = [...state.storage.values()][0] ?? "";
  assert.doesNotMatch(record, /ONE|TWO/u);
  assert.match(record, /"digest":"[a-f0-9]{64}"/u);
});

test("expired unchanged recovery codes are cleared", async () => {
  const state = harness();
  await state.service.copy(["ONE", "TWO"]);
  state.advance(RECOVERY_CODE_CLIPBOARD_RETENTION_MS);
  await state.service.reconcile();
  assert.equal(state.clipboard(), "");
  assert.equal(state.storage.size, 0);
});

test("scheduled timer callback performs the due cleanup", async () => {
  const state = harness();
  await state.service.copy(["ONE"]);
  state.advance(RECOVERY_CODE_CLIPBOARD_RETENTION_MS);
  state.timers.at(-1)?.callback();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(state.clipboard(), "");
  assert.equal(state.storage.size, 0);
});

test("later clipboard content is never removed", async () => {
  const state = harness();
  await state.service.copy(["ONE", "TWO"]);
  state.setClipboard("user copied this later");
  state.advance(RECOVERY_CODE_CLIPBOARD_RETENTION_MS);
  await state.service.reconcile();
  assert.equal(state.clipboard(), "user copied this later");
  assert.equal(state.writes.at(-1), "ONE\nTWO");
  assert.equal(state.storage.size, 0);
});

test("restart reconciliation schedules a pending cleanup without reading the clipboard early", async () => {
  const state = harness();
  await state.service.copy(["ONE"]);
  const restarted = createRecoveryCodeClipboard({
    clipboard: { getStringAsync: async () => { throw new Error("clipboard_read_too_early"); }, setStringAsync: async () => true },
    secureStore: { getItemAsync: async (key) => state.storage.get(key) ?? null, setItemAsync: async () => undefined, deleteItemAsync: async () => undefined },
    digest,
    now: () => 1_000,
    schedule: (callback, delay) => { state.timers.push({ callback, delay }); return state.timers.length as unknown as ReturnType<typeof setTimeout>; },
    cancel: () => undefined,
  });
  await restarted.reconcile();
  assert.equal(state.timers.at(-1)?.delay, RECOVERY_CODE_CLIPBOARD_RETENTION_MS);
});

test("copy failure rolls back unchanged clipboard content instead of leaving an unmanaged secret", async () => {
  let clipboard = "";
  const service = createRecoveryCodeClipboard({
    clipboard: { getStringAsync: async () => clipboard, setStringAsync: async (value) => { clipboard = value; return true; } },
    secureStore: { getItemAsync: async () => null, setItemAsync: async () => { throw new Error("secure_store_unavailable"); }, deleteItemAsync: async () => undefined },
    digest,
    now: () => 1_000,
    schedule: () => 1 as unknown as ReturnType<typeof setTimeout>,
    cancel: () => undefined,
  });
  await assert.rejects(service.copy(["ONE"]), /secure_store_unavailable/u);
  assert.equal(clipboard, "");
});

test("durable marker is written before recovery codes reach the clipboard", async () => {
  const events: string[] = [];
  const service = createRecoveryCodeClipboard({
    clipboard: { getStringAsync: async () => "", setStringAsync: async () => { events.push("clipboard"); return true; } },
    secureStore: { getItemAsync: async () => null, setItemAsync: async () => { events.push("marker"); }, deleteItemAsync: async () => undefined },
    digest,
    now: () => 1_000,
    schedule: () => 1 as unknown as ReturnType<typeof setTimeout>,
    cancel: () => undefined,
  });
  await service.copy(["ONE"]);
  assert.deepEqual(events, ["marker", "clipboard"]);
});

test("failed system cleanup keeps the marker and schedules a retry", async () => {
  let now = 1_000;
  let clipboard = "ONE";
  const storage = new Map<string, string>();
  const delays: number[] = [];
  let writes = 0;
  const service = createRecoveryCodeClipboard({
    clipboard: { getStringAsync: async () => clipboard, setStringAsync: async (value) => { writes += 1; if (value === "") return false; clipboard = value; return true; } },
    secureStore: { getItemAsync: async (key) => storage.get(key) ?? null, setItemAsync: async (key, value) => { storage.set(key, value); }, deleteItemAsync: async (key) => { storage.delete(key); } },
    digest,
    now: () => now,
    schedule: (_callback, delay) => { delays.push(delay); return delays.length as unknown as ReturnType<typeof setTimeout>; },
    cancel: () => undefined,
  });
  await service.copy(["ONE"]);
  now += RECOVERY_CODE_CLIPBOARD_RETENTION_MS;
  await service.reconcile();
  assert.equal(writes, 2);
  assert.equal(storage.size, 1);
  assert.equal(delays.at(-1), 60_000);
});

test("an uncertain rejected clipboard write preserves recovery when the written value cannot be cleared", async () => {
  let clipboard = "";
  const storage = new Map<string, string>();
  const delays: number[] = [];
  const service = createRecoveryCodeClipboard({
    clipboard: {
      getStringAsync: async () => clipboard,
      setStringAsync: async (value) => {
        if (value === "") return false;
        clipboard = value;
        throw new Error("uncertain_clipboard_write");
      },
    },
    secureStore: { getItemAsync: async (key) => storage.get(key) ?? null, setItemAsync: async (key, value) => { storage.set(key, value); }, deleteItemAsync: async (key) => { storage.delete(key); } },
    digest,
    now: () => 1_000,
    schedule: (_callback, delay) => { delays.push(delay); return delays.length as unknown as ReturnType<typeof setTimeout>; },
    cancel: () => undefined,
  });
  await assert.rejects(service.copy(["ONE"]), /uncertain_clipboard_write/u);
  assert.equal(clipboard, "ONE");
  assert.equal(storage.size, 1);
  assert.equal(delays.at(-1), RECOVERY_CODE_CLIPBOARD_RETENTION_MS);
});

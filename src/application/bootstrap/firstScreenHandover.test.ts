import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  decideFirstScreenTodayAction,
  handOverFirstScreenToAccount,
  handOverFirstScreenToToday,
  installFirstScreenHandover,
  resetFirstScreenHandoverForTests,
} from "./firstScreenHandover";
import { resetFirstScreenRecordForTests, writeFirstScreenWelcome } from "./firstScreenRecord";
import { notifyStartupFirstUsableFrame, resetParallelBootForTests } from "./parallelBoot";
import {
  hasReportedFirstScreenReady,
  readFirstScreenShown,
  reportFirstScreenReady,
  setFirstScreenNativeForTests,
  takeFirstScreenPendingAction,
} from "../../infrastructure/runtime/firstScreenNative";

function fakeNative(options: Readonly<{ shown?: string; pending?: string[] }> = {}) {
  const calls: string[] = [];
  const pending = [...(options.pending ?? [])];
  let stored: string | null = null;
  return {
    calls,
    get stored() { return stored; },
    native: {
      write(json: string) { calls.push("write"); stored = json; return true; },
      clear() { calls.push("clear"); stored = null; },
      shownSnapshot() { return options.shown ?? ""; },
      markRnReady(surface: string, profileId: string, revision: string) { calls.push(`ready:${surface}:${profileId}:${revision}`); },
      takePendingAction() { calls.push("take"); return pending.shift() ?? ""; },
    },
  };
}

const action = (name: string, profileId: string | null = "p1", revision: string | null = "4:abc") =>
  JSON.stringify({ id: "a-1", action: name, profileId, revision, capturedAtMs: 1 });

afterEach(() => {
  setFirstScreenNativeForTests(undefined);
  resetFirstScreenHandoverForTests();
  resetFirstScreenRecordForTests();
  resetParallelBootForTests();
});

test("without the native module every call is a no-op", () => {
  setFirstScreenNativeForTests(null);
  reportFirstScreenReady("today", { profileId: "p1", revision: "r" });
  assert.equal(hasReportedFirstScreenReady(), false);
  assert.equal(readFirstScreenShown(), null);
  assert.equal(takeFirstScreenPendingAction(), null);
  assert.deepEqual(handOverFirstScreenToToday({ profileId: "p1", revision: "r" }), { kind: "none" });
});

test("the first report wins; null values cross the boundary as empty strings", () => {
  const fake = fakeNative();
  setFirstScreenNativeForTests(fake.native);
  reportFirstScreenReady("account");
  reportFirstScreenReady("today", { profileId: "p1", revision: "r" });
  assert.deepEqual(fake.calls, ["ready:account::"]);
});

test("shown snapshot and pending action are parsed defensively", () => {
  const fake = fakeNative({ shown: JSON.stringify({ kind: "today", profileId: "p1", revision: "4:abc" }), pending: ["{bad", action("primary")] });
  setFirstScreenNativeForTests(fake.native);
  assert.deepEqual(readFirstScreenShown(), { kind: "today", profileId: "p1", revision: "4:abc" });
  assert.equal(takeFirstScreenPendingAction(), null);
  assert.deepEqual(takeFirstScreenPendingAction(), { id: "a-1", action: "primary", profileId: "p1", revision: "4:abc", capturedAtMs: 1 });
  setFirstScreenNativeForTests(fakeNative({ shown: JSON.stringify({ kind: "progress" }) }).native);
  assert.equal(readFirstScreenShown(), null);
});

test("a tapped Today action runs only for the same profile and revision; anything else is stale", () => {
  const current = { profileId: "p1", revision: "4:abc" };
  const pending = (name: string, profileId: string | null = "p1", revision: string | null = "4:abc") => ({ id: "a-1", action: name, profileId, revision, capturedAtMs: 1 });
  assert.deepEqual(decideFirstScreenTodayAction(null, current), { kind: "none" });
  assert.deepEqual(decideFirstScreenTodayAction(pending("primary"), current), { kind: "run", id: "a-1", action: "primary" });
  assert.deepEqual(decideFirstScreenTodayAction(pending("open_tab:settings"), current), { kind: "run", id: "a-1", action: "open_tab:settings" });
  assert.deepEqual(decideFirstScreenTodayAction(pending("primary", "p2"), current), { kind: "stale", id: "a-1" });
  assert.deepEqual(decideFirstScreenTodayAction(pending("primary", "p1", "5:def"), current), { kind: "stale", id: "a-1" });
  assert.deepEqual(decideFirstScreenTodayAction(pending("sign_in", null, null), current), { kind: "stale", id: "a-1" });
  assert.deepEqual(decideFirstScreenTodayAction(pending("delete_everything"), current), { kind: "stale", id: "a-1" });
});

test("Today reports with its token before it takes the action, once", () => {
  const fake = fakeNative({ pending: [action("change_track")] });
  setFirstScreenNativeForTests(fake.native);
  assert.deepEqual(handOverFirstScreenToToday({ profileId: "p1", revision: "4:abc" }), { kind: "run", id: "a-1", action: "change_track" });
  assert.deepEqual(handOverFirstScreenToToday({ profileId: "p1", revision: "4:abc" }), { kind: "none" });
  assert.deepEqual(fake.calls, ["ready:today:p1:4:abc", "take", "take"]);
});

test("the signed-out entry runs only welcome actions", () => {
  setFirstScreenNativeForTests(fakeNative({ pending: [action("create_account", null, null)] }).native);
  assert.equal(handOverFirstScreenToAccount(), "create_account");
  setFirstScreenNativeForTests(fakeNative({ pending: [action("primary")] }).native);
  assert.equal(handOverFirstScreenToAccount(), null);
});

test("install connects the record writer to the keychain sink and reports `other` after the first usable frame", async () => {
  const fake = fakeNative();
  setFirstScreenNativeForTests(fake.native);
  installFirstScreenHandover();
  assert.equal(writeFirstScreenWelcome({ capturedAt: "2026-11-15T09:00:00.000Z", locale: "en", appearance: "system", view: { brand: "Patternly", title: "t", detail: "d", signIn: { label: "s", action: "sign_in" }, register: { label: "r", action: "create_account" }, guest: { label: "g", action: "continue_guest" }, loading: "l" } }), "written");
  assert.match(fake.stored ?? "", /"kind":"welcome"/u);
  notifyStartupFirstUsableFrame();
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(fake.calls.filter((call) => call.startsWith("ready:")), ["ready:other::"]);
});

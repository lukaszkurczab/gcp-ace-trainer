import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  FIRST_SCREEN_MAX_BYTES,
  FIRST_SCREEN_SCHEMA,
  captureFirstScreenInputEpoch,
  clearFirstScreenRecord,
  firstScreenValidUntil,
  noteProfileKeyWrite,
  resetFirstScreenRecordForTests,
  setFirstScreenInputKeyFilter,
  setFirstScreenSink,
  writeFirstScreenToday,
  writeFirstScreenWelcome,
  type FirstScreenTodayView,
} from "./firstScreenRecord";
import { setProfileKeyWriteObserver } from "../../infrastructure/storage/profileStorageRouter";
import { createProfileScopedStorage } from "../../infrastructure/storage/profileStorageRouter";
import { noteProfileKeyWrite as observer } from "./firstScreenRecord";
import { notifyActorBoundary } from "./parallelBoot";
import { isTodayInputKey } from "../home/todaySnapshot";
import { STORAGE_NAMESPACE } from "../../storage/keys";

function fakeSink() {
  const calls: string[] = [];
  let value: string | null = null;
  let fail = false;
  return {
    calls,
    get value() { return value; },
    failNext() { fail = true; },
    sink: {
      write(json: string) {
        calls.push("write");
        if (fail) { fail = false; return false; }
        value = json;
        return true;
      },
      clear() { calls.push("clear"); value = null; },
    },
  };
}

const view: FirstScreenTodayView = Object.freeze({
  title: "Dziś",
  track: { label: "Coding interview", icon: "code-brackets", change: { label: "Zmień", action: "change_track" } },
  decision: { icon: "route", title: "Sesja w toku", detail: "Algorytmy", primary: { label: "Wznów sesję", action: "primary" }, enabled: true, muted: false, secondary: null },
  secondaryPlan: null,
  goalInvitation: null,
  firstUse: null,
  overview: { label: "Przegląd", rows: [{ label: "Powtórki", value: "3 do zrobienia" }] },
  focus: { label: "Bieżący temat", title: "Two pointers", button: { label: "Otwórz praktykę", action: "open_practice_topic" } },
  activity: { label: "Ostatnia aktywność", title: "Szybka praktyka", empty: "Brak aktywności", button: { label: "Zobacz aktywność", action: "open_activity" } },
  tabs: [{ id: "home", label: "Dziś", icon: "home" }],
  loading: "Ładowanie Dziś",
}) as FirstScreenTodayView;

function today(epoch: number, extra: Partial<Parameters<typeof writeFirstScreenToday>[0]> = {}) {
  return writeFirstScreenToday({ inputEpoch: epoch, profileId: "p1", actor: "uid:u1", revision: "3:abc", capturedAt: "2026-11-14T10:00:00.000Z", locale: "pl", appearance: "system", view, ...extra });
}

afterEach(() => {
  resetFirstScreenRecordForTests();
  setProfileKeyWriteObserver(observer);
});

test("writes a schema-2 today record with the rendered view and a next-midnight expiry", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  assert.equal(today(captureFirstScreenInputEpoch()), "written");
  const record = JSON.parse(fake.value!);
  assert.equal(record.schema, FIRST_SCREEN_SCHEMA);
  assert.equal(record.kind, "today");
  assert.equal(record.profileId, "p1");
  assert.equal(record.revision, "3:abc");
  assert.deepEqual(record.view, JSON.parse(JSON.stringify(view)));
  assert.equal(record.validUntilMs, firstScreenValidUntil("2026-11-14T10:00:00.000Z"));
  assert.ok(record.validUntilMs > Date.parse("2026-11-14T10:00:00.000Z"));
  assert.ok(record.validUntilMs - Date.parse("2026-11-14T10:00:00.000Z") <= 24 * 60 * 60 * 1000);
});

test("an identical view is not written twice", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  const epoch = captureFirstScreenInputEpoch();
  assert.equal(today(epoch), "written");
  assert.equal(today(epoch), "unchanged");
  assert.deepEqual(fake.calls, ["write"]);
});

test("a Today input write drops the record once and makes an older read stale", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  setFirstScreenInputKeyFilter(isTodayInputKey);
  const epoch = captureFirstScreenInputEpoch();
  assert.equal(today(epoch), "written");
  noteProfileKeyWrite(`${STORAGE_NAMESPACE}training-attempt:a1`);
  noteProfileKeyWrite(`${STORAGE_NAMESPACE}training-attempt:a2`);
  assert.equal(fake.value, null);
  assert.deepEqual(fake.calls, ["write", "clear"]);
  // The view rendered from the read before the write must not come back.
  assert.equal(today(epoch), "stale");
  assert.equal(today(captureFirstScreenInputEpoch()), "written");
});

test("non-input profile keys leave the record alone once the filter is registered", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  setFirstScreenInputKeyFilter(isTodayInputKey);
  const epoch = captureFirstScreenInputEpoch();
  today(epoch);
  noteProfileKeyWrite(`${STORAGE_NAMESPACE}active-training-session-draft`);
  noteProfileKeyWrite(`${STORAGE_NAMESPACE}account-sync`);
  assert.notEqual(fake.value, null);
  assert.equal(captureFirstScreenInputEpoch(), epoch);
});

test("before the filter is registered every profile write counts, and a record from the last launch is dropped", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  noteProfileKeyWrite("anything");
  assert.deepEqual(fake.calls, ["clear"]);
});

test("the profile-scoped storage reports set and remove before the value lands", () => {
  const seen: string[] = [];
  setProfileKeyWriteObserver((key) => seen.push(key));
  const values = new Map<string, string>();
  const base = {
    getString: (key: string) => values.get(key),
    setString: (key: string, value: string) => { assert.ok(seen.length > 0); values.set(key, value); },
    remove: (key: string) => { values.delete(key); },
    contains: (key: string) => values.has(key),
    getAllKeys: () => [...values.keys()],
  };
  const scoped = createProfileScopedStorage(base as never, { id: "p1", kind: "guest", accountId: null } as never);
  scoped.setString(`${STORAGE_NAMESPACE}goal:t1`, "{}");
  scoped.remove(`${STORAGE_NAMESPACE}goal:t1`);
  assert.deepEqual(seen, [`${STORAGE_NAMESPACE}goal:t1`, `${STORAGE_NAMESPACE}goal:t1`]);
});

test("an observer failure never blocks the write", () => {
  setProfileKeyWriteObserver(() => { throw new Error("boom"); });
  const values = new Map<string, string>();
  const base = { getString: (k: string) => values.get(k), setString: (k: string, v: string) => { values.set(k, v); }, remove: (k: string) => { values.delete(k); }, contains: (k: string) => values.has(k), getAllKeys: () => [...values.keys()] };
  const scoped = createProfileScopedStorage(base as never, { id: "p1", kind: "guest", accountId: null } as never);
  scoped.setString("k", "v");
  assert.equal(scoped.getString("k"), "v");
});

test("an actor boundary (sign-out, deletion, actor change) clears the record", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  today(captureFirstScreenInputEpoch());
  notifyActorBoundary(null);
  assert.equal(fake.value, null);
});

test("a failed native write clears instead of leaving an older record", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  today(captureFirstScreenInputEpoch());
  fake.failNext();
  assert.equal(today(captureFirstScreenInputEpoch(), { revision: "4:def" }), "unavailable");
  assert.equal(fake.value, null);
});

test("an oversized view is not written and drops the old record", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  today(captureFirstScreenInputEpoch());
  const big = { ...view, decision: { ...view.decision, detail: "x".repeat(FIRST_SCREEN_MAX_BYTES) } };
  assert.equal(today(captureFirstScreenInputEpoch(), { view: big }), "too_large");
  assert.equal(fake.value, null);
});

test("without a native sink nothing is written", () => {
  assert.equal(today(captureFirstScreenInputEpoch()), "unavailable");
  clearFirstScreenRecord();
});

test("a welcome record carries no profile data and expires after a week", () => {
  const fake = fakeSink();
  setFirstScreenSink(fake.sink);
  assert.equal(writeFirstScreenWelcome({ capturedAt: "2026-11-14T10:00:00.000Z", locale: "en", appearance: "dark", view: { brand: "Patternly", title: "Welcome", detail: "Practice", signIn: { label: "Sign in", action: "sign_in" }, register: { label: "Create account", action: "create_account" }, guest: { label: "Continue without account", action: "continue_guest" }, loading: "Loading" } }), "written");
  const record = JSON.parse(fake.value!);
  assert.equal(record.kind, "welcome");
  assert.equal(record.profileId, undefined);
  assert.equal(record.actor, undefined);
  assert.equal(record.validUntilMs, Date.parse("2026-11-14T10:00:00.000Z") + 7 * 86_400_000);
});

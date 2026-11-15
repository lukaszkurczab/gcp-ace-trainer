/**
 * T2.5 stage 2: the native first-screen gate (`native/first-screen/swift/FirstScreenGate.swift`) decides on
 * values produced by the real TS storage code (profile router, local logout control, record writer).
 * The Swift files are compiled with `swiftc` into a small CLI; on hosts without `swiftc` the parity cases skip.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { createLocalLogoutControl } from "../../infrastructure/storage/localLogoutControl";
import { MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { commitProfileSelection, openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import {
  FIRST_SCREEN_SCHEMA,
  resetFirstScreenRecordForTests,
  setFirstScreenSink,
  writeFirstScreenToday,
  writeFirstScreenWelcome,
  type FirstScreenTodayView,
} from "./firstScreenRecord";

const ROOT = path.resolve(__dirname, "../../..");
const SWIFT_SOURCES = ["native/first-screen/swift/FirstScreenRecord.swift", "native/first-screen/swift/FirstScreenGate.swift", "native/first-screen/test/main.swift"]
  .map((file) => path.join(ROOT, file));
const swiftAvailable = process.platform === "darwin" && spawnSync("swiftc", ["--version"], { stdio: "ignore" }).status === 0;

class MemoryControlStore implements StorageManifestStore {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
}

const view: FirstScreenTodayView = Object.freeze({
  title: "Dziś",
  track: { label: "Coding interview", icon: "code-brackets", change: { label: "Zmień", action: "change_track" } },
  decision: { icon: "route", title: "Sesja w toku", detail: "Algorytmy", primary: { label: "Wznów sesję", action: "primary" }, enabled: true, muted: false, secondary: { label: "Plan", action: "secondary", chevron: true } },
  secondaryPlan: null,
  goalInvitation: { title: "Cel", detail: null, primary: { label: "Ustaw", action: "goal_set" }, notNow: { label: "Nie teraz", action: "goal_not_now" } },
  firstUse: null,
  overview: { label: "Przegląd", rows: [{ label: "Powtórki", value: "3 do zrobienia" }] },
  focus: null,
  activity: { label: "Ostatnia aktywność", title: null, empty: "Brak aktywności", button: { label: "Zobacz aktywność", action: "open_activity" } },
  tabs: [{ id: "home", label: "Dziś", icon: "home" }, { id: "settings", label: "Ustawienia", icon: "settings" }],
  loading: "Ładowanie Dziś",
}) as FirstScreenTodayView;

const MANIFEST_BODY = { version: 1, generation: 3, stage: "complete", activeSlot: "b", targetKeyVersion: 1, sourceKind: "encrypted", sourceSlot: "a",
  commitment: "c", activationBootId: "boot", quarantinePresent: false, quarantineSlot: null, quarantineKeyVersion: null, quarantineGeneration: null };
const manifest = (overrides: Record<string, unknown> = {}) => JSON.stringify({ ...MANIFEST_BODY, ...overrides, checksum: "not-verified-natively" });

let work = "";
let binary = "";
type Values = Partial<Record<"record" | "logoutControl" | "registryA" | "registryB" | "manifestA" | "manifestB", string | null>>;
type GateCase = { name: string; nowMs: number; values: Values; slots: string[] };
type GateResult = { name: string; kind: "today" | "welcome" | "neutral"; reason: string | null; profileId: string | null; primary: string | null };

function runGate(cases: GateCase[]): Map<string, GateResult> {
  const file = path.join(work, `cases-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  writeFileSync(file, JSON.stringify(cases.map((item) => ({ ...item, values: { record: null, logoutControl: null, registryA: null, registryB: null, manifestA: null, manifestB: null, ...item.values } }))));
  const out = execFileSync(binary, [file], { encoding: "utf8" });
  return new Map((JSON.parse(out) as GateResult[]).map((row) => [row.name, row]));
}

async function fixture() {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const installationId = "00000000-0000-4000-8000-0000000000a1";
  const profileId = "00000000-0000-4000-8000-0000000000a2";
  const router = await openProfileStorageRouter(base, control, { identity: { async create() { return { installationId, localDatasetId: profileId }; } } });
  await router.selectExistingGuest(profileId);
  await commitProfileSelection(control, router.registry, profileId);
  let stored: string | null = null;
  resetFirstScreenRecordForTests();
  setFirstScreenSink({ write(json) { stored = json; return true; }, clear() { stored = null; } });
  const capturedAt = new Date(2026, 10, 15, 9, 30).toISOString();
  assert.equal(writeFirstScreenToday({ inputEpoch: 0, profileId, actor: "guest", revision: "4:abc", capturedAt, locale: "pl", appearance: "dark", view }), "written");
  const today = stored as string | null;
  assert.equal(writeFirstScreenWelcome({ capturedAt, locale: "pl", appearance: "system", view: { brand: "Patternly", title: "Witaj", detail: "Ucz się", signIn: { label: "Zaloguj się", action: "sign_in" }, register: { label: "Załóż konto", action: "create_account" }, guest: { label: "Kontynuuj jako gość", action: "continue_guest" }, loading: "Wczytywanie…" } }), "written");
  const welcome = stored as string | null;
  resetFirstScreenRecordForTests();
  assert.ok(today && welcome);
  const values: Values = {
    record: today,
    registryA: control.values.get("patternly.profile-root.v1.a") ?? null,
    registryB: control.values.get("patternly.profile-root.v1.b") ?? null,
    manifestA: manifest({ generation: 2, activeSlot: "a" }),
    manifestB: manifest(),
  };
  assert.ok(values.registryA && values.registryB, "the router keeps both registry slots");
  const now = Date.parse(capturedAt) + 60_000;
  return { control, profileId, today, welcome, values, now, validUntilMs: (JSON.parse(today) as { validUntilMs: number }).validUntilMs };
}

before(() => {
  if (!swiftAvailable) return;
  work = mkdtempSync(path.join(tmpdir(), "first-screen-gate-"));
  binary = path.join(work, "gate");
  execFileSync("swiftc", ["-O", "-o", binary, ...SWIFT_SOURCES], { stdio: "pipe" });
});
after(() => { if (work) rmSync(work, { recursive: true, force: true }); });

test("a registry commit drops the record before the new registry is visible", async () => {
  const { control, profileId } = await fixture();
  const registry = () => ["a", "b"].map((slot) => control.values.get(`patternly.profile-root.v1.${slot}`) ?? null).join("|");
  const seen: string[] = [];
  const router = await openProfileStorageRouter(new MemoryKeyValueStorage(), control, { identity: { async create() { throw new Error("unused"); } } });
  resetFirstScreenRecordForTests();
  setFirstScreenSink({ write() { return true; }, clear() { seen.push(registry()); } });
  const beforeCommit = registry();
  await commitProfileSelection(control, router.registry, profileId);
  assert.deepEqual(seen, [beforeCommit]);
  assert.notEqual(registry(), beforeCommit);
  resetFirstScreenRecordForTests();
});

test("native gate accepts the record written by TS for the selected profile", { skip: !swiftAvailable && "swiftc not available" }, async () => {
  const f = await fixture();
  const results = runGate([
    { name: "today", nowMs: f.now, values: f.values, slots: ["patternly-secure-b"] },
    { name: "today-logout-completed", nowMs: f.now, values: { ...f.values, logoutControl: JSON.stringify({ version: 2, blocked: null, pending: [], completed: [{ operationId: "00000000-0000-4000-8000-0000000000c1", uid: "u1" }] }) }, slots: ["patternly-secure-b"] },
    { name: "welcome", nowMs: f.now, values: { record: f.welcome }, slots: [] },
  ]);
  assert.deepEqual(results.get("today"), { name: "today", kind: "today", reason: null, profileId: f.profileId, primary: "Wznów sesję" });
  assert.equal(results.get("today-logout-completed")?.kind, "today");
  assert.deepEqual(results.get("welcome"), { name: "welcome", kind: "welcome", reason: null, profileId: null, primary: "Zaloguj się" });
});

test("native gate shows the neutral screen for every unsafe state, never an error", { skip: !swiftAvailable && "swiftc not available" }, async () => {
  const f = await fixture();
  const pending = createLocalLogoutControl(f.control);
  await pending.blockAndQueueRevoke("u1", "00000000-0000-4000-8000-0000000000c1");
  const logoutPending = f.control.values.get("patternly.local-logout-control.v2") ?? null;
  assert.ok(logoutPending);
  const record = JSON.parse(f.today) as Record<string, unknown>;
  const slots = ["patternly-secure-b"];
  const cases: Array<[string, Values, number, string[], string]> = [
    ["absent", { ...f.values, record: null }, f.now, slots, "record_absent"],
    ["empty", { ...f.values, record: "" }, f.now, slots, "record_absent"],
    ["garbage", { ...f.values, record: "{not json" }, f.now, slots, "record_malformed"],
    ["old-schema", { ...f.values, record: JSON.stringify({ ...record, schema: FIRST_SCREEN_SCHEMA - 1 }) }, f.now, slots, "record_schema"],
    ["unknown-kind", { ...f.values, record: JSON.stringify({ ...record, kind: "progress" }) }, f.now, slots, "record_malformed"],
    ["missing-view-field", { ...f.values, record: JSON.stringify({ ...record, view: { ...view, tabs: undefined } }) }, f.now, slots, "record_malformed"],
    ["too-large", { ...f.values, record: JSON.stringify({ ...record, pad: "x".repeat(17 * 1024) }) }, f.now, slots, "record_too_large"],
    ["expired-at-midnight", f.values, f.validUntilMs, slots, "record_expired"],
    ["logout-pending", { ...f.values, logoutControl: logoutPending }, f.now, slots, "logout_pending"],
    ["logout-corrupt", { ...f.values, logoutControl: "{\"version\":1}" }, f.now, slots, "logout_control_unreadable"],
    ["other-profile", { ...f.values, record: JSON.stringify({ ...record, profileId: "00000000-0000-4000-8000-0000000000ff" }) }, f.now, slots, "profile_mismatch"],
    ["no-registry", { ...f.values, registryA: null, registryB: null }, f.now, slots, "registry_absent"],
    ["registry-corrupt", { ...f.values, registryB: "{}" }, f.now, slots, "registry_unreadable"],
    ["registry-same-generation", { ...f.values, registryB: f.values.registryA }, f.now, slots, "registry_unreadable"],
    ["no-manifest", { ...f.values, manifestA: null, manifestB: null }, f.now, slots, "storage_absent"],
    ["manifest-building", { ...f.values, manifestB: manifest({ stage: "building" }) }, f.now, slots, "storage_slot_missing"],
    ["reinstalled", f.values, f.now, [], "storage_slot_missing"],
    ["inactive-slot-only", f.values, f.now, ["patternly-secure-a"], "storage_slot_missing"],
  ];
  const results = runGate(cases.map(([name, values, nowMs, existing]) => ({ name, nowMs, values, slots: existing })));
  for (const [name, , , , reason] of cases) {
    assert.deepEqual([name, results.get(name)?.kind, results.get(name)?.reason], [name, "neutral", reason]);
  }
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createACMNativeFixtureManifest,
  createACMNativeFixtureStoreIds,
  deriveACMNativeFixtureProfileIdentity,
  inspectACMNativeFixtureStorageInventory,
  isMatchingACMNativeFixtureManifest,
  resolveACMNativeFixtureEntry,
  type ACMNativeFixtureNativeIdentity,
} from "./acmNativeFixtureProtocol";

const runUUID = "123e4567-e89b-42d3-a456-426614174000";
const identity = (overrides: Partial<ACMNativeFixtureNativeIdentity> = {}): ACMNativeFixtureNativeIdentity => ({
  fixtureRequested: true,
  fixtureMarked: true,
  fixtureValid: true,
  debugBuild: true,
  runtimeMode: "smoke",
  runUUID,
  operation: "create",
  storagePath: "/app/Library/Application Support/Patternly/ACMNative/test/mmkv",
  storageReady: true,
  storageInventoryReady: true,
  storageEntries: [],
  ...overrides,
});
const resolve = (native: ACMNativeFixtureNativeIdentity | null = identity(), overrides: Record<string, unknown> = {}) => resolveACMNativeFixtureEntry({
  jsEnabled: "1",
  jsRuntimeMode: "smoke",
  jsRunUUID: runUUID,
  jsOperation: "create",
  development: true,
  native,
  environment: {},
  ...overrides,
} as Parameters<typeof resolveACMNativeFixtureEntry>[0]);

test("ACM native fixture entry requires matching native and JavaScript debug smoke identity", () => {
  assert.deepEqual(resolve(), {
    kind: "fixture", runUUID, operation: "create", storagePath: identity().storagePath,
    storageInventoryReady: true, storageEntries: [],
  });
  assert.equal(resolve(null).kind, "unavailable");
  assert.equal(resolve(identity({ debugBuild: false })).kind, "unavailable");
  assert.equal(resolve(identity({ runtimeMode: "sandbox" })).kind, "unavailable");
  assert.equal(resolve(identity({ runUUID: "123e4567-e89b-42d3-a456-426614174001" })).kind, "unavailable");
  assert.equal(resolve(identity({ operation: "resume" })).kind, "unavailable");
  assert.equal(resolve(identity({ storageReady: false })).kind, "unavailable");
  assert.equal(resolve(identity({ storageInventoryReady: false })).kind, "unavailable");
  assert.equal(resolve(identity({ fixtureRequested: false })).kind, "unavailable");
  assert.equal(resolve(identity({ fixtureMarked: false, fixtureValid: false })).kind, "unavailable");
  assert.equal(resolve(identity({ fixtureValid: false })).kind, "unavailable");
  assert.equal(resolve(identity(), { development: false }).kind, "unavailable");
  assert.equal(resolve(identity(), { jsEnabled: undefined }).kind, "unavailable");
  assert.equal(resolve(identity(), { jsRunUUID: undefined }).kind, "unavailable");
  assert.equal(resolve(identity(), { jsOperation: "resume" }).kind, "unavailable");
});

test("partial or false native fixture markers fail closed while marker absence stays regular", () => {
  const jsAbsent = { jsEnabled: undefined, jsRuntimeMode: undefined, jsRunUUID: undefined, jsOperation: undefined };
  assert.equal(resolve(identity(), jsAbsent).kind, "unavailable");
  assert.deepEqual(resolve(identity({ fixtureRequested: false, fixtureMarked: false, fixtureValid: false }), jsAbsent), { kind: "regular" });
  assert.equal(resolve(identity({ fixtureRequested: true, fixtureMarked: false, fixtureValid: false }), jsAbsent).kind, "unavailable");
  assert.equal(resolve(identity({ fixtureRequested: true, fixtureMarked: true, fixtureValid: false }), jsAbsent).kind, "unavailable");
  assert.equal(resolve(null, { ...jsAbsent, jsEnabled: "0" }).kind, "unavailable");
  assert.equal(resolve(null, { ...jsAbsent, jsOperation: "create" }).kind, "unavailable");
});

test("unavailable ACM marker returns before loading the regular application root or its providers", () => {
  const appSource = readFileSync(new URL("../../../App.tsx", import.meta.url), "utf8");
  const unavailableReturn = appSource.indexOf("if (acmEntry.kind === \"unavailable\")");
  const regularResolution = appSource.indexOf("const entry = resolvePersist13Entry(");
  const regularRootLoad = appSource.indexOf("require(\"./src/RegularApplicationRoot\")");
  assert.ok(unavailableReturn >= 0 && regularResolution > unavailableReturn && regularRootLoad > regularResolution);
  assert.match(appSource, /if \(acmEntry\.kind === "unavailable"\) \{\s*return <UnavailableFixtureRoot/u);
  assert.match(appSource, /function UnavailableFixtureRoot[\s\S]*?ACM native fixture unavailable/u);
});

test("ACM custom-path inventory accepts only an empty create directory or the exact persisted MMKV files", () => {
  const { dataStoreId, controlStoreId } = createACMNativeFixtureStoreIds(runUUID);
  assert.deepEqual(inspectACMNativeFixtureStorageInventory({ operation: "create", dataStoreId, controlStoreId, ready: true, entries: [] }), { kind: "ready" });
  const resumeFiles = [dataStoreId, `${dataStoreId}.crc`, controlStoreId, `${controlStoreId}.crc`];
  assert.deepEqual(inspectACMNativeFixtureStorageInventory({ operation: "resume", dataStoreId, controlStoreId, ready: true, entries: resumeFiles }), { kind: "ready" });

  for (const invalid of [
    { operation: "create" as const, ready: true, entries: ["unrelated"] },
    { operation: "resume" as const, ready: true, entries: resumeFiles.slice(0, -1) },
    { operation: "resume" as const, ready: true, entries: [...resumeFiles, "unrelated"] },
    { operation: "resume" as const, ready: true, entries: [...resumeFiles, resumeFiles[0]!] },
    { operation: "resume" as const, ready: false, entries: resumeFiles },
  ]) {
    const storeBytes = new Map(resumeFiles.map((name) => [name, `bytes:${name}`]));
    const before = new Map(storeBytes);
    const result = inspectACMNativeFixtureStorageInventory({ dataStoreId, controlStoreId, ...invalid });
    assert.equal(result.kind, "unavailable");
    assert.deepEqual(storeBytes, before, "inventory mismatches are read-only and cannot alter either store");
  }
});

test("custom-path inventory validation runs before any MMKV instance opens and bypasses default-root exists checks", () => {
  const rootSource = readFileSync(new URL("./ACMNativeFixtureRoot.tsx", import.meta.url), "utf8");
  const nativeSource = readFileSync(new URL("../../../native/foreground-clock/ACMNativeFixtureIdentity.mm", import.meta.url), "utf8");
  const checkIndex = rootSource.indexOf("inspectACMNativeFixtureStorageInventory({");
  const firstOpenIndex = rootSource.indexOf("mmkv.createMMKV(");
  assert.ok(checkIndex >= 0 && firstOpenIndex > checkIndex, "custom-path inventory preflight precedes both opens");
  assert.doesNotMatch(rootSource, /mmkv\.existsMMKV\(/u, "SDK existsMMKV has no path argument and checks only the default root");
  assert.match(nativeSource, /contentsOfDirectoryAtPath:storagePath/u, "the native inventory reads the configured custom MMKV directory");
  assert.match(nativeSource, /NSFileTypeRegular/u, "the native inventory rejects directories, symlinks and other nonregular entries");
  assert.match(nativeSource, /fixtureRequested/u, "native identity reports marker presence separately from marker validity");
  assert.match(nativeSource, /fixtureValid/u, "native identity reports strict validated fixture metadata");
  assert.match(nativeSource, /CFBooleanGetTypeID/u, "native identity accepts only an actual plist Boolean marker");
});

test("ACM fixture selectors conflict closed and absence of all selectors stays regular", () => {
  const absent = resolve(null, { jsEnabled: undefined, jsRuntimeMode: undefined, jsRunUUID: undefined, jsOperation: undefined });
  assert.deepEqual(absent, { kind: "regular" });
  assert.equal(resolve(identity(), { environment: { EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: "1" } }).kind, "unavailable");
  assert.equal(resolve(identity(), { environment: { EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE: "false" } }).kind, "unavailable");
  assert.equal(resolve(identity(), { environment: { EXPO_PUBLIC_PATTERNLY_STARTUP_PREVIEW: "" } }).kind, "fixture");
  assert.equal(resolve(null, { jsEnabled: "1" }).kind, "unavailable");
});

test("ACM fixture IDs, deterministic guest identity, and persisted manifest are exact", () => {
  const ids = createACMNativeFixtureStoreIds(runUUID);
  assert.deepEqual(ids, {
    dataStoreId: `patternly-acm-native-data-${runUUID}`,
    controlStoreId: `patternly-acm-native-control-${runUUID}`,
  });
  assert.deepEqual(deriveACMNativeFixtureProfileIdentity(runUUID), deriveACMNativeFixtureProfileIdentity(runUUID));
  const profile = deriveACMNativeFixtureProfileIdentity(runUUID);
  const manifest = createACMNativeFixtureManifest({
    runUUID,
    ...ids,
    profile: { id: profile.localDatasetId, kind: "guest", accountId: null },
  });
  assert.equal(isMatchingACMNativeFixtureManifest(manifest, { runUUID, ...ids }), true);
  assert.equal(isMatchingACMNativeFixtureManifest({ ...manifest, ignored: true }, { runUUID, ...ids }), false);
  assert.equal(isMatchingACMNativeFixtureManifest({ ...manifest, profile: { ...manifest.profile, accountId: "account" } }, { runUUID, ...ids }), false);
  assert.throws(() => createACMNativeFixtureManifest({ runUUID, ...ids, profile: { id: profile.localDatasetId, kind: "account", accountId: null } }), /profile_mismatch/);
});

import { sha256Utf8 } from "../../infrastructure/identity/sha256";

export const ACM_NATIVE_FIXTURE_MANIFEST_KEY = "patternly:acm-native-fixture:manifest:v1";
export const ACM_NATIVE_FIXTURE_MANIFEST_SCHEMA = "patternly.acm-native-fixture-manifest.v1" as const;

export type ACMNativeFixtureOperation = "create" | "resume";
export type ACMNativeFixtureNativeIdentity = Readonly<{
  fixtureRequested: boolean;
  fixtureMarked: boolean;
  fixtureValid: boolean;
  debugBuild: boolean;
  runtimeMode: string | null;
  runUUID: string | null;
  operation: string | null;
  storagePath: string | null;
  storageReady: boolean;
  storageInventoryReady: boolean;
  storageEntries: readonly string[];
}>;
export type ACMNativeFixtureEntry = Readonly<{
  kind: "fixture";
  runUUID: string;
  operation: ACMNativeFixtureOperation;
  storagePath: string;
  storageInventoryReady: boolean;
  storageEntries: readonly string[];
}>;
export type ACMNativeFixtureResolution = ACMNativeFixtureEntry | Readonly<{ kind: "regular" }> | Readonly<{ kind: "unavailable"; reason: string }>;
export type ACMNativeFixtureProfileIdentity = Readonly<{
  installationId: string;
  localDatasetId: string;
  profileId: string;
  profileKind: "guest";
  accountId: null;
}>;
export type ACMNativeFixtureManifest = Readonly<{
  schema: typeof ACM_NATIVE_FIXTURE_MANIFEST_SCHEMA;
  runtimeMode: "smoke";
  runUUID: string;
  dataStoreId: string;
  controlStoreId: string;
  profile: ACMNativeFixtureProfileIdentity;
  state: "ready";
}>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const OTHER_FIXTURE_SELECTORS = Object.freeze([
  "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE",
  "EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE",
  "EXPO_PUBLIC_PATTERNLY_STARTUP_PREVIEW",
]);

export function isACMNativeFixtureRunUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}

export function createACMNativeFixtureStoreIds(runUUID: string): Readonly<{ dataStoreId: string; controlStoreId: string }> {
  if (!isACMNativeFixtureRunUUID(runUUID)) throw new Error("acm_fixture_run_uuid_invalid");
  const scope = runUUID.toLowerCase();
  return Object.freeze({
    dataStoreId: `patternly-acm-native-data-${scope}`,
    controlStoreId: `patternly-acm-native-control-${scope}`,
  });
}

/**
 * Validate the installed MMKVCore iOS path layout before opening either store.
 * These IDs contain no special path characters, so MMKV maps each ID to its
 * literal leaf name and its CRC sidecar to `<id>.crc` in the supplied root.
 */
export function inspectACMNativeFixtureStorageInventory(input: Readonly<{
  operation: ACMNativeFixtureOperation;
  dataStoreId: string;
  controlStoreId: string;
  ready: boolean;
  entries: readonly string[];
}>): Readonly<{ kind: "ready" }> | Readonly<{ kind: "unavailable"; reason: string }> {
  if (!input.ready || !Array.isArray(input.entries) || input.entries.some((entry) => typeof entry !== "string")
    || new Set(input.entries).size !== input.entries.length) {
    return Object.freeze({ kind: "unavailable", reason: "storage_inventory_unavailable" });
  }
  const expected = input.operation === "create"
    ? []
    : [input.dataStoreId, `${input.dataStoreId}.crc`, input.controlStoreId, `${input.controlStoreId}.crc`].sort();
  const actual = [...input.entries].sort();
  if (actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
    return Object.freeze({ kind: "unavailable", reason: input.operation === "create" ? "create_directory_not_empty" : "resume_storage_files_mismatch" });
  }
  return Object.freeze({ kind: "ready" });
}

export function deriveACMNativeFixtureProfileIdentity(runUUID: string): Readonly<{ installationId: string; localDatasetId: string }> {
  if (!isACMNativeFixtureRunUUID(runUUID)) throw new Error("acm_fixture_run_uuid_invalid");
  const installationId = runUUID.toLowerCase();
  const digest = sha256Utf8(`patternly.acm-native-fixture.local-dataset.v1:${installationId}`);
  const bytes = digest.slice(0, 32).split("");
  bytes[12] = "4";
  bytes[16] = ((parseInt(bytes[16]!, 16) & 0x3) | 0x8).toString(16);
  const localDatasetId = `${bytes.slice(0, 8).join("")}-${bytes.slice(8, 12).join("")}-${bytes.slice(12, 16).join("")}-${bytes.slice(16, 20).join("")}-${bytes.slice(20, 32).join("")}`;
  if (localDatasetId === installationId) throw new Error("acm_fixture_profile_identity_collision");
  return Object.freeze({ installationId, localDatasetId });
}

export function resolveACMNativeFixtureEntry(input: Readonly<{
  jsEnabled: string | undefined;
  jsRuntimeMode: string | undefined;
  jsRunUUID: string | undefined;
  jsOperation: string | undefined;
  development: boolean;
  native: ACMNativeFixtureNativeIdentity | null;
  environment: Readonly<Record<string, string | undefined>>;
}>): ACMNativeFixtureResolution {
  const markerRequested = input.native?.fixtureRequested === true
    || input.native?.fixtureMarked === true || input.native?.fixtureValid === true;
  const jsRequested = input.jsEnabled !== undefined || input.jsRunUUID !== undefined || input.jsOperation !== undefined;
  if (!markerRequested && !jsRequested) return Object.freeze({ kind: "regular" });
  if (!input.native?.fixtureRequested || !input.native.fixtureMarked || !input.native.fixtureValid) {
    return Object.freeze({ kind: "unavailable", reason: "native_fixture_marker_invalid" });
  }
  if (!input.native.debugBuild || !input.development || input.native.runtimeMode !== "smoke"
    || input.jsRuntimeMode !== "smoke" || input.jsEnabled !== "1"
    || !isACMNativeFixtureRunUUID(input.native.runUUID) || input.native.runUUID !== input.jsRunUUID
    || (input.native.operation !== "create" && input.native.operation !== "resume")
    || input.native.operation !== input.jsOperation || !input.native.storagePath || !input.native.storageReady) {
    return Object.freeze({ kind: "unavailable", reason: "native_js_fixture_identity_mismatch" });
  }
  if (!input.native.storageInventoryReady || !Array.isArray(input.native.storageEntries)) {
    return Object.freeze({ kind: "unavailable", reason: "native_storage_inventory_unavailable" });
  }
  if (OTHER_FIXTURE_SELECTORS.some((key) => input.environment[key] !== undefined && input.environment[key] !== "")) {
    return Object.freeze({ kind: "unavailable", reason: "fixture_selector_conflict" });
  }
  return Object.freeze({
    kind: "fixture",
    runUUID: input.native.runUUID,
    operation: input.native.operation,
    storagePath: input.native.storagePath,
    storageInventoryReady: input.native.storageInventoryReady,
    storageEntries: Object.freeze([...input.native.storageEntries]),
  });
}

export function createACMNativeFixtureManifest(input: Readonly<{
  runUUID: string;
  dataStoreId: string;
  controlStoreId: string;
  profile: Readonly<{ id: string; kind: string; accountId: string | null }>;
}>): ACMNativeFixtureManifest {
  if (!isACMNativeFixtureRunUUID(input.runUUID)) throw new Error("acm_fixture_run_uuid_invalid");
  const ids = createACMNativeFixtureStoreIds(input.runUUID);
  const expectedIdentity = deriveACMNativeFixtureProfileIdentity(input.runUUID);
  if (input.dataStoreId !== ids.dataStoreId || input.controlStoreId !== ids.controlStoreId
    || input.profile.id !== expectedIdentity.localDatasetId || input.profile.kind !== "guest" || input.profile.accountId !== null) {
    throw new Error("acm_fixture_manifest_profile_mismatch");
  }
  return Object.freeze({
    schema: ACM_NATIVE_FIXTURE_MANIFEST_SCHEMA,
    runtimeMode: "smoke",
    runUUID: input.runUUID.toLowerCase(),
    dataStoreId: input.dataStoreId,
    controlStoreId: input.controlStoreId,
    profile: Object.freeze({
      installationId: expectedIdentity.installationId,
      localDatasetId: expectedIdentity.localDatasetId,
      profileId: input.profile.id,
      profileKind: "guest",
      accountId: null,
    }),
    state: "ready",
  });
}

export function isMatchingACMNativeFixtureManifest(value: unknown, expected: Readonly<{
  runUUID: string;
  dataStoreId: string;
  controlStoreId: string;
}>): value is ACMNativeFixtureManifest {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isACMNativeFixtureRunUUID(expected.runUUID)) return false;
  const candidate = value as Record<string, unknown>;
  const profile = candidate.profile;
  if (Object.keys(candidate).sort().join(",") !== "controlStoreId,dataStoreId,profile,runUUID,runtimeMode,schema,state"
    || candidate.schema !== ACM_NATIVE_FIXTURE_MANIFEST_SCHEMA || candidate.runtimeMode !== "smoke"
    || candidate.runUUID !== expected.runUUID.toLowerCase() || candidate.dataStoreId !== expected.dataStoreId
    || candidate.controlStoreId !== expected.controlStoreId || candidate.state !== "ready"
    || typeof profile !== "object" || profile === null || Array.isArray(profile)) return false;
  const identity = profile as Record<string, unknown>;
  const expectedIdentity = deriveACMNativeFixtureProfileIdentity(expected.runUUID);
  return Object.keys(identity).sort().join(",") === "accountId,installationId,localDatasetId,profileId,profileKind"
    && identity.installationId === expectedIdentity.installationId
    && identity.localDatasetId === expectedIdentity.localDatasetId
    && identity.profileId === expectedIdentity.localDatasetId
    && identity.profileKind === "guest" && identity.accountId === null;
}

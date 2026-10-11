import { isPersist13RunId, type Persist13FixtureMode, type Persist13FixtureScenario } from "./persist13Entry";
import { PROFILE_STORAGE_REGISTRY_CONTROL_KEYS } from "../../infrastructure/storage/profileStorageRouter";

export const PERSIST13_FIXTURE_SCHEMA = "patternly:persist13-reset-fixture.v1" as const;
export const PERSIST13_FIXTURE_OWNER = "persist13-reset-fixture" as const;
export const PERSIST13_FIXTURE_MANIFEST_KEY = "patternly:persist13:manifest:v1" as const;
export const PERSIST13_SCENARIO_SIDECAR_KEY = "patternly:persist13:scenario:v1" as const;
export const PERSIST13_SCENARIO_SIDECAR_SCHEMA = "patternly:persist13-scenario-assertions.v2" as const;
export const PERSIST13_DATA_ID_PREFIX = "patternly-persist13-data-" as const;
export const PERSIST13_CONTROL_ID_PREFIX = "patternly-persist13-control-" as const;
export const PERSIST13_FIXTURE_CACHE_PREFIXES = Object.freeze(["patternly-guest-local-data-", "patternly-account-data-"] as const);

export type Persist13FixtureEntry = Readonly<{ key: string; sha256: string }>;
export type Persist13PhysicalSnapshot = ReadonlyArray<readonly [key: string, rawValue: string | undefined]>;
export type Persist13HashedPhysicalSnapshot = readonly Readonly<{ key: string; sha256: string }>[];
export type Persist13ScenarioSidecar = Readonly<{
  schema: typeof PERSIST13_SCENARIO_SIDECAR_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: Exclude<Persist13FixtureScenario, "reset">;
  phase: "faulted" | "recovering" | "recovered";
  dataStoreId: string;
  controlStoreId: string;
  fixtureProfileId: string;
  faultLogicalKey: string;
  faultPhysicalKey: string;
  before: Persist13HashedPhysicalSnapshot;
  after: Persist13HashedPhysicalSnapshot;
  sessionIdSha256: string;
  occurrenceIdSha256?: string;
  responseSha256?: string;
  expectedAttemptSha256?: string;
  expectedSessionSha256?: string;
  expectedReviewSha256?: readonly string[];
  baselineAttemptCount: number;
  baselineSessionIndex: number;
  expectedDraftRevision?: number;
  expectedDraftPayloadSha256?: string;
  expectedDraftEnvelopeSha256?: string;
}>;
export type Persist13FixtureManifest = Readonly<{
  schema: typeof PERSIST13_FIXTURE_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  dataStoreId: string;
  controlStoreId: string;
  fixtureProfileId: string;
  state: "allocating" | "allocated" | "paused" | "recovering" | "recovered";
  targets: readonly Persist13FixtureEntry[];
  preserved: readonly Persist13FixtureEntry[];
}>;

export function fixtureStoreIds(runId: string): Readonly<{ dataStoreId: string; controlStoreId: string }> {
  if (!isPersist13RunId(runId)) throw new Error("persist13_invalid_run_id");
  return Object.freeze({ dataStoreId: `${PERSIST13_DATA_ID_PREFIX}${runId.toLowerCase()}`, controlStoreId: `${PERSIST13_CONTROL_ID_PREFIX}${runId.toLowerCase()}` });
}

export function isPersist13ControlNamespace(keys: readonly string[], scenario: Persist13FixtureScenario): boolean {
  const allowed = new Set<string>([PERSIST13_FIXTURE_MANIFEST_KEY, ...PROFILE_STORAGE_REGISTRY_CONTROL_KEYS]);
  if (scenario !== "reset") allowed.add(PERSIST13_SCENARIO_SIDECAR_KEY);
  const actual = new Set(keys);
  return actual.size === keys.length && actual.has(PERSIST13_FIXTURE_MANIFEST_KEY)
    && PROFILE_STORAGE_REGISTRY_CONTROL_KEYS.some((key) => actual.has(key))
    && (scenario === "reset" ? !actual.has(PERSIST13_SCENARIO_SIDECAR_KEY) : actual.has(PERSIST13_SCENARIO_SIDECAR_KEY))
    && keys.every((key) => allowed.has(key));
}

export function fixtureInstallationId(runId: string): string {
  if (!isPersist13RunId(runId)) throw new Error("persist13_invalid_run_id");
  const first = Number.parseInt(runId[0]!, 16);
  return `${((first + 1) % 16).toString(16)}${runId.slice(1).toLowerCase()}`;
}

/** This is the exact modern-profile key mapping used by profileStorageRouter. */
export function persist13FixturePhysicalKey(profileId: string, logicalKey: string): string {
  if (!isPersist13RunId(profileId) || !logicalKey.startsWith("patternly:canonical:v1:")) throw new Error("persist13_invalid_physical_key_scope");
  return `patternly:profile:v1:${profileId.toLowerCase()}:${encodeURIComponent(logicalKey)}`;
}

export function isPersist13ScenarioSidecar(value: unknown, runId: string, scenario: Exclude<Persist13FixtureScenario, "reset">): value is Persist13ScenarioSidecar {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const common = ["after", "baselineAttemptCount", "baselineSessionIndex", "before", "controlStoreId", "dataStoreId", "faultLogicalKey", "faultPhysicalKey", "fixtureProfileId", "owner", "phase", "runId", "scenario", "schema", "sessionIdSha256"];
  const expected = scenario === "draft" ? [...common, "expectedDraftEnvelopeSha256", "expectedDraftPayloadSha256", "expectedDraftRevision"]
    : scenario === "journal" ? [...common, "expectedAttemptSha256", "expectedReviewSha256", "expectedSessionSha256", "occurrenceIdSha256", "responseSha256"] : common;
  if (Object.keys(row).sort().join("\u0000") !== expected.sort().join("\u0000")) return false;
  const stores = fixtureStoreIds(runId);
  if (row.schema !== PERSIST13_SCENARIO_SIDECAR_SCHEMA || row.owner !== PERSIST13_FIXTURE_OWNER || row.runId !== runId.toLowerCase()
    || row.scenario !== scenario || !["faulted", "recovering", "recovered"].includes(String(row.phase))
    || row.dataStoreId !== stores.dataStoreId || row.controlStoreId !== stores.controlStoreId || row.fixtureProfileId !== runId.toLowerCase()
    || typeof row.faultLogicalKey !== "string" || !row.faultLogicalKey.startsWith("patternly:canonical:v1:")
    || row.faultPhysicalKey !== persist13FixturePhysicalKey(runId, row.faultLogicalKey)
    || typeof row.sessionIdSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(row.sessionIdSha256)
    || !Number.isSafeInteger(row.baselineAttemptCount) || Number(row.baselineAttemptCount) < 0
    || !Number.isSafeInteger(row.baselineSessionIndex) || Number(row.baselineSessionIndex) < 0) return false;
  if (scenario === "draft" && (!Number.isSafeInteger(row.expectedDraftRevision) || Number(row.expectedDraftRevision) < 1
    || typeof row.expectedDraftPayloadSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(row.expectedDraftPayloadSha256)
    || typeof row.expectedDraftEnvelopeSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(row.expectedDraftEnvelopeSha256))) return false;
  if (scenario === "journal" && (typeof row.occurrenceIdSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(row.occurrenceIdSha256)
    || typeof row.responseSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(row.responseSha256)
    || typeof row.expectedAttemptSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(row.expectedAttemptSha256)
    || typeof row.expectedSessionSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(row.expectedSessionSha256)
    || !Array.isArray(row.expectedReviewSha256) || !row.expectedReviewSha256.every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash)))) return false;
  if (!isHashedSnapshot(row.before) || !isHashedSnapshot(row.after) || !row.after.some((entry) => entry.key === row.faultPhysicalKey)) return false;
  const beforeTarget = row.before.find((entry) => entry.key === row.faultPhysicalKey);
  const afterTarget = row.after.find((entry) => entry.key === row.faultPhysicalKey);
  return areHashedSnapshotsEqual(row.before, row.after, row.faultPhysicalKey)
    && afterTarget !== undefined && (beforeTarget === undefined || beforeTarget.sha256 !== afterTarget.sha256);
}

export function hashPersist13PhysicalSnapshot(snapshot: Persist13PhysicalSnapshot, sha256: (value: string) => string): Persist13HashedPhysicalSnapshot {
  return Object.freeze(snapshot.map(([key, rawValue]) => {
    if (rawValue === undefined) throw new Error("persist13_snapshot_contains_absent_key");
    return Object.freeze({ key, sha256: sha256(rawValue) });
  }));
}

export function areHashedSnapshotsEqual(left: Persist13HashedPhysicalSnapshot, right: Persist13HashedPhysicalSnapshot, ignoredKey?: string): boolean {
  const leftRows = left.filter((entry) => entry.key !== ignoredKey);
  const rightRows = right.filter((entry) => entry.key !== ignoredKey);
  return leftRows.length === rightRows.length && leftRows.every((entry, index) => entry.key === rightRows[index]?.key && entry.sha256 === rightRows[index]?.sha256);
}

function isHashedSnapshot(value: unknown): value is Persist13HashedPhysicalSnapshot {
  if (!Array.isArray(value)) return false;
  const keys = new Set<string>();
  return value.every((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return false;
    const row = entry as Record<string, unknown>;
    if (Object.keys(row).sort().join(",") !== "key,sha256" || typeof row.key !== "string" || !row.key.startsWith("patternly:profile:v1:")
      || typeof row.sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(row.sha256) || keys.has(row.key)) return false;
    keys.add(row.key);
    return true;
  }) && value.every((entry, index) => index === 0 || value[index - 1]!.key < entry.key);
}

export function createPersist13Manifest(runId: string, state: Persist13FixtureManifest["state"]): Persist13FixtureManifest {
  const stores = fixtureStoreIds(runId);
  return Object.freeze({
    schema: PERSIST13_FIXTURE_SCHEMA,
    owner: PERSIST13_FIXTURE_OWNER,
    runId: runId.toLowerCase(),
    ...stores,
    fixtureProfileId: runId.toLowerCase(),
    state,
    targets: Object.freeze([]),
    preserved: Object.freeze([]),
  });
}

export function withPersist13ManifestState(
  manifest: Persist13FixtureManifest,
  state: Persist13FixtureManifest["state"],
  plan?: Readonly<{ targets: readonly Persist13FixtureEntry[]; preserved: readonly Persist13FixtureEntry[] }>,
): Persist13FixtureManifest {
  return Object.freeze({
    ...manifest,
    state,
    targets: Object.freeze([...(plan?.targets ?? manifest.targets)]),
    preserved: Object.freeze([...(plan?.preserved ?? manifest.preserved)]),
  });
}

export function isPersist13Manifest(value: unknown, runId: string): value is Persist13FixtureManifest {
  if (!isPersist13RunId(runId) || typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const exact = ["schema", "owner", "runId", "dataStoreId", "controlStoreId", "fixtureProfileId", "state", "targets", "preserved"].sort();
  if (Object.keys(record).sort().join("\u0000") !== exact.join("\u0000")) return false;
  const stores = fixtureStoreIds(runId);
  if (record.schema !== PERSIST13_FIXTURE_SCHEMA || record.owner !== PERSIST13_FIXTURE_OWNER
    || record.runId !== runId.toLowerCase() || record.dataStoreId !== stores.dataStoreId
    || record.controlStoreId !== stores.controlStoreId || record.fixtureProfileId !== runId.toLowerCase()
    || !["allocating", "allocated", "paused", "recovering", "recovered"].includes(String(record.state))) return false;
  const entries = (input: unknown): input is Persist13FixtureEntry[] => Array.isArray(input) && input.every((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return false;
    const row = entry as Record<string, unknown>;
    return Object.keys(row).sort().join(",") === "key,sha256" && typeof row.key === "string"
      && row.key.startsWith("patternly:canonical:v1:") && /^[a-f0-9]{64}$/u.test(String(row.sha256));
  }) && new Set(input.map((entry) => (entry as Persist13FixtureEntry).key)).size === input.length;
  return entries(record.targets) && entries(record.preserved)
    && (record.state === "allocating" || record.state === "allocated"
      ? record.targets.length === 0 && record.preserved.length === 0
      : record.targets.length > 0 && record.preserved.length > 0);
}

export function arePersist13PhysicalSnapshotsEqual(left: Persist13PhysicalSnapshot, right: Persist13PhysicalSnapshot): boolean {
  return left.length === right.length && left.every(([key, rawValue], index) => right[index]?.[0] === key && right[index]?.[1] === rawValue);
}

export function fixtureModeAllowsManifest(mode: Persist13FixtureMode, state: Persist13FixtureManifest["state"]): boolean {
  return mode === "seed" ? state === "allocated" : state === "paused" || state === "recovering" || state === "recovered";
}

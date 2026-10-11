import { isPersist13RunId, type Persist13FixtureMode } from "./persist13Entry";

export const PERSIST13_FIXTURE_SCHEMA = "patternly:persist13-reset-fixture.v1" as const;
export const PERSIST13_FIXTURE_OWNER = "persist13-reset-fixture" as const;
export const PERSIST13_FIXTURE_MANIFEST_KEY = "patternly:persist13:manifest:v1" as const;
export const PERSIST13_DATA_ID_PREFIX = "patternly-persist13-data-" as const;
export const PERSIST13_CONTROL_ID_PREFIX = "patternly-persist13-control-" as const;
export const PERSIST13_FIXTURE_CACHE_PREFIXES = Object.freeze(["patternly-guest-local-data-", "patternly-account-data-"] as const);

export type Persist13FixtureEntry = Readonly<{ key: string; sha256: string }>;
export type Persist13PhysicalSnapshot = ReadonlyArray<readonly [key: string, rawValue: string | undefined]>;
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

export function fixtureInstallationId(runId: string): string {
  if (!isPersist13RunId(runId)) throw new Error("persist13_invalid_run_id");
  const first = Number.parseInt(runId[0]!, 16);
  return `${((first + 1) % 16).toString(16)}${runId.slice(1).toLowerCase()}`;
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

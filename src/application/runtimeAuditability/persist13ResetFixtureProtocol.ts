import { isPersist13RunId, type Persist13FixtureMode, type Persist13FixtureScenario } from "./persist13Entry";
import { PROFILE_STORAGE_REGISTRY_CONTROL_KEYS } from "../../infrastructure/storage/profileStorageRouter";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_KEYS } from "../../storage/keys";

export const PERSIST13_FIXTURE_SCHEMA = "patternly:persist13-reset-fixture.v1" as const;
export const PERSIST13_FIXTURE_OWNER = "persist13-reset-fixture" as const;
export const PERSIST13_FIXTURE_MANIFEST_KEY = "patternly:persist13:manifest:v1" as const;
export const PERSIST13_SCENARIO_SIDECAR_KEY = "patternly:persist13:scenario:v1" as const;
export const PERSIST13_SCENARIO_SIDECAR_SCHEMA = "patternly:persist13-scenario-assertions.v2" as const;
export const PERSIST13_MATERIALIZED_JOURNAL_SIDECAR_SCHEMA = "patternly:persist13-journal-materialized.v1" as const;
export const PERSIST13_VERIFY_CLEAR_SIDECAR_SCHEMA = "patternly:persist13-journal-verify-clear.v1" as const;
export const PERSIST13_SUBMIT_CLEAR_NEXT_SIDECAR_SCHEMA = "patternly:persist13-submit-clear-next.v1" as const;
export const PERSIST13_ADVANCE_MATERIALIZED_SIDECAR_SCHEMA = "patternly:persist13-advance-materialized.v1" as const;
export const PERSIST13_PRACTICE_UI_PROBE_SIDECAR_SCHEMA = "patternly:persist13-practice-ui-probe.v1" as const;
export const PERSIST13_PRACTICE_UI_NEXT_SIDECAR_SCHEMA = "patternly:persist13-practice-ui-next.v1" as const;
export const PERSIST13_PRACTICE_UI_NEXT_OBSERVATION_SCHEMA = "patternly:persist13-practice-ui-next-observation.v1" as const;
export const PERSIST13_DATA_ID_PREFIX = "patternly-persist13-data-" as const;
export const PERSIST13_CONTROL_ID_PREFIX = "patternly-persist13-control-" as const;
export const PERSIST13_FIXTURE_CACHE_PREFIXES = Object.freeze(["patternly-guest-local-data-", "patternly-account-data-"] as const);

export type Persist13FixtureEntry = Readonly<{ key: string; sha256: string }>;
export type Persist13PhysicalSnapshot = ReadonlyArray<readonly [key: string, rawValue: string | undefined]>;
export type Persist13HashedPhysicalSnapshot = readonly Readonly<{ key: string; sha256: string }>[];
type Persist13FaultScenarioSidecar = Readonly<{
  schema: typeof PERSIST13_SCENARIO_SIDECAR_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: "journal" | "draft";
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
export type Persist13MaterializedJournalSidecar = Readonly<{
  schema: typeof PERSIST13_MATERIALIZED_JOURNAL_SIDECAR_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: "journal_materialized";
  phase: "materialized" | "recovering" | "recovered";
  dataStoreId: string;
  controlStoreId: string;
  fixtureProfileId: string;
  before: Persist13HashedPhysicalSnapshot;
  after: Persist13HashedPhysicalSnapshot;
  sessionIdSha256: string;
  occurrenceIdSha256: string;
  responseSha256: string;
  expectedAttemptSha256: string;
  expectedSessionSha256: string;
  expectedReviewSha256: readonly string[];
  expectedReviewCount: number;
  baselineAttemptCount: number;
  baselineSessionIndex: number;
}>;
export type Persist13VerifyClearSidecar = Readonly<{
  schema: typeof PERSIST13_VERIFY_CLEAR_SIDECAR_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: "verify_clear";
  phase: "verified_pending_clear" | "recovering" | "recovered";
  dataStoreId: string;
  controlStoreId: string;
  fixtureProfileId: string;
  before: Persist13HashedPhysicalSnapshot;
  after: Persist13HashedPhysicalSnapshot;
  sessionIdSha256: string;
  occurrenceIdSha256: string;
  responseSha256: string;
  expectedAttemptSha256: string;
  expectedSessionSha256: string;
  expectedReviewSha256: readonly string[];
  expectedReviewCount: number;
  baselineAttemptCount: number;
  baselineSessionIndex: number;
}>;
export type Persist13SubmitClearNextSidecar = Readonly<{
  schema: typeof PERSIST13_SUBMIT_CLEAR_NEXT_SIDECAR_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: "submit_clear_next";
  phase: "postclear" | "recovering" | "bootstrap_verified" | "advance_started" | "advanced";
  dataStoreId: string;
  controlStoreId: string;
  fixtureProfileId: string;
  before: Persist13HashedPhysicalSnapshot;
  after: Persist13HashedPhysicalSnapshot;
  sessionIdSha256: string;
  occurrenceIdSha256: string;
  responseSha256: string;
  expectedAttemptSha256: string;
  expectedSessionSha256: string;
  sessionPinsSha256: string;
  expectedReviewSha256: readonly string[];
  expectedReviewCount: number;
  baselineAttemptCount: number;
  baselineReviewCount: number;
  baselineSessionIndex: number;
  timerSha256: string;
  expectedAdvancedSessionSha256: string;
}>;
export type Persist13AdvanceMaterializedSidecar = Readonly<{
  schema: typeof PERSIST13_ADVANCE_MATERIALIZED_SIDECAR_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: "advance_materialized";
  phase: "materialized" | "recovering" | "recovered";
  dataStoreId: string;
  controlStoreId: string;
  fixtureProfileId: string;
  before: Persist13HashedPhysicalSnapshot;
  after: Persist13HashedPhysicalSnapshot;
  sessionIdSha256: string;
  expectedSessionSha256: string;
  expectedSessionsSha256: string;
  sessionPinsSha256: string;
  attemptSetSha256: string;
  reviewSetSha256: string;
  timerSha256: string;
  attemptCount: number;
  reviewCount: number;
}>;
export type Persist13PracticeUiProbeSidecar = Readonly<{
  schema: typeof PERSIST13_PRACTICE_UI_PROBE_SIDECAR_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: "practice_ui_probe";
  phase: "ready" | "ui_armed";
  dataStoreId: string;
  controlStoreId: string;
  fixtureProfileId: string;
  readySnapshot: Persist13HashedPhysicalSnapshot;
  sessionIdSha256: string;
  occurrenceIdSha256: string;
  expectedFeedbackSha256: string;
  sessionPinsSha256: string;
  sessionStateSha256: string;
  otherSessionsSha256: string;
  attemptSetSha256: string;
  reviewSetSha256: string;
  resultSetSha256: string;
  timerIdentitySha256: string;
  sessionCount: number;
  attemptCount: number;
  reviewCount: number;
  resultCount: number;
  currentItemIndex: 0;
  initialSessionElapsedMs: number;
  initialTimerAccumulatedMs: number;
  initialTimerCheckpointRevision: number;
}>;
export type Persist13PracticeUiNextSidecar = Readonly<{
  schema: typeof PERSIST13_PRACTICE_UI_NEXT_SIDECAR_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: "practice_ui_next";
  phase: "ready" | "ui_armed";
  dataStoreId: string;
  controlStoreId: string;
  fixtureProfileId: string;
  readySnapshot: Persist13HashedPhysicalSnapshot;
  sessionIdSha256: string;
  sessionPhysicalKeySha256: string;
  occurrenceIdSha256: string;
  nextOccurrenceIdSha256: string;
  expectedFeedbackSha256: string;
  sessionPinsSha256: string;
  expectedSessionZeroSha256: string;
  expectedSessionOneSha256: string;
  otherSessionsSha256: string;
  attemptSetSha256: string;
  reviewSetSha256: string;
  resultSetSha256: string;
  timerIdentitySha256: string;
  sessionCount: number;
  attemptCount: number;
  reviewCount: number;
  resultCount: number;
  currentItemIndex: 0;
  initialSessionElapsedMs: number;
  initialTimerAccumulatedMs: number;
  initialTimerCheckpointRevision: number;
}>;
export type Persist13PracticeUiNextObservation = Readonly<{
  schema: typeof PERSIST13_PRACTICE_UI_NEXT_OBSERVATION_SCHEMA;
  owner: typeof PERSIST13_FIXTURE_OWNER;
  runId: string;
  scenario: "practice_ui_next";
  phase: "ui_armed";
  sessionIdSha256: string;
  sessionPhysicalKeySha256: string;
  occurrenceIdSha256: string;
  sessionStableSha256: string;
  otherSessionsSha256: string;
  attemptSetSha256: string;
  reviewSetSha256: string;
  resultSetSha256: string;
  timerIdentitySha256: string;
  sessionCount: number;
  attemptCount: number;
  reviewCount: number;
  resultCount: number;
  currentItemIndex: 1;
  projectionKind: "unanswered";
  sessionElapsedMs: number;
  timerAccumulatedMs: number;
  timerCheckpointRevision: number;
  beforeSnapshot: Persist13HashedPhysicalSnapshot;
  afterSnapshot: Persist13HashedPhysicalSnapshot;
  authCold: true;
}>;
export type Persist13PracticeUiNextObservationCore = Omit<Persist13PracticeUiNextObservation, "authCold">;
export type Persist13ScenarioSidecar = Persist13FaultScenarioSidecar | Persist13MaterializedJournalSidecar | Persist13VerifyClearSidecar | Persist13SubmitClearNextSidecar | Persist13AdvanceMaterializedSidecar | Persist13PracticeUiProbeSidecar | Persist13PracticeUiNextSidecar;
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
  if (scenario === "start_cutpoint") {
    allowed.add(PERSIST13_START_CAPABILITY_KEY); allowed.add(PERSIST13_START_RECOVERY_KEY);
    return keys.length === new Set(keys).size && keys.includes(PERSIST13_FIXTURE_MANIFEST_KEY) && keys.includes(PERSIST13_START_CAPABILITY_KEY)
      && PROFILE_STORAGE_REGISTRY_CONTROL_KEYS.some(key => keys.includes(key)) && keys.every(key => allowed.has(key));
  }
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

export function hasPersist13PhysicalJournal(snapshot: Persist13PhysicalSnapshot, runId: string): boolean {
  const physicalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  return snapshot.some(([key, rawValue]) => key === physicalKey && rawValue !== undefined);
}

export function arePersist13JournalPhysicalWriteTargetsExact(expectedTargets: ReadonlySet<string>, actualTargets: readonly string[]): boolean {
  const actual = new Set(actualTargets);
  return actual.size === actualTargets.length && actual.size === expectedTargets.size
    && [...actual].every((key) => expectedTargets.has(key));
}

export function isExactPersist13SessionCollectionAdvance<T extends Readonly<{ id: string }>>(
  before: readonly T[],
  after: readonly T[],
  sessionId: string,
  expectedCurrent: T,
  equal: (left: T, right: T) => boolean,
): boolean {
  if (!sessionId || expectedCurrent.id !== sessionId || before.length !== after.length) return false;
  const beforeById = new Map(before.map((session) => [session.id, session]));
  const afterById = new Map(after.map((session) => [session.id, session]));
  if (beforeById.size !== before.length || afterById.size !== after.length || beforeById.size !== afterById.size) return false;
  for (const [id, prior] of beforeById) {
    const actual = afterById.get(id);
    if (!actual || !equal(id === sessionId ? expectedCurrent : prior, actual)) return false;
  }
  return afterById.has(sessionId);
}

export function arePersist13JournalTargetDeltasScoped(
  before: Persist13HashedPhysicalSnapshot,
  after: Persist13HashedPhysicalSnapshot,
  allowedTargets: ReadonlySet<string>,
): boolean {
  const beforeRows = new Map(before.map((entry) => [entry.key, entry.sha256]));
  const afterRows = new Map(after.map((entry) => [entry.key, entry.sha256]));
  const allKeys = new Set([...beforeRows.keys(), ...afterRows.keys()]);
  const changed = [...allKeys].filter((key) => beforeRows.get(key) !== afterRows.get(key));
  if (changed.length === 0 || changed.some((key) => !allowedTargets.has(key))) return false;
  const beforeUnchanged = before.filter((entry) => !allowedTargets.has(entry.key));
  const afterUnchanged = after.filter((entry) => !allowedTargets.has(entry.key));
  return beforeUnchanged.length === afterUnchanged.length
    && beforeUnchanged.every((entry, index) => entry.key === afterUnchanged[index]?.key && entry.sha256 === afterUnchanged[index]?.sha256);
}

export function isPersist13ScenarioSidecar(value: unknown, runId: string, scenario: "journal" | "draft"): value is Persist13FaultScenarioSidecar {
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

export function isPersist13MaterializedJournalSidecar(value: unknown, runId: string): value is Persist13MaterializedJournalSidecar {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const exact = ["after", "baselineAttemptCount", "baselineSessionIndex", "before", "controlStoreId", "dataStoreId", "expectedAttemptSha256", "expectedReviewCount", "expectedReviewSha256", "expectedSessionSha256", "fixtureProfileId", "occurrenceIdSha256", "owner", "phase", "responseSha256", "runId", "scenario", "schema", "sessionIdSha256"];
  const stores = fixtureStoreIds(runId);
  if (Object.keys(row).sort().join("\u0000") !== exact.sort().join("\u0000")
    || row.schema !== PERSIST13_MATERIALIZED_JOURNAL_SIDECAR_SCHEMA || row.owner !== PERSIST13_FIXTURE_OWNER
    || row.runId !== runId.toLowerCase() || row.scenario !== "journal_materialized"
    || !["materialized", "recovering", "recovered"].includes(String(row.phase))
    || row.dataStoreId !== stores.dataStoreId || row.controlStoreId !== stores.controlStoreId || row.fixtureProfileId !== runId.toLowerCase()
    || ![row.sessionIdSha256, row.occurrenceIdSha256, row.responseSha256, row.expectedAttemptSha256, row.expectedSessionSha256].every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    || !Number.isSafeInteger(row.baselineAttemptCount) || Number(row.baselineAttemptCount) < 0
    || !Number.isSafeInteger(row.expectedReviewCount) || Number(row.expectedReviewCount) < 0
    || !Number.isSafeInteger(row.baselineSessionIndex) || Number(row.baselineSessionIndex) < 0
    || !Array.isArray(row.expectedReviewSha256) || row.expectedReviewSha256.length === 0
    || !row.expectedReviewSha256.every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    || !isHashedSnapshot(row.before) || !isHashedSnapshot(row.after) || areHashedSnapshotsEqual(row.before, row.after)) return false;
  return true;
}

export function isPersist13VerifyClearSidecar(value: unknown, runId: string): value is Persist13VerifyClearSidecar {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const exact = ["after", "baselineAttemptCount", "baselineSessionIndex", "before", "controlStoreId", "dataStoreId", "expectedAttemptSha256", "expectedReviewCount", "expectedReviewSha256", "expectedSessionSha256", "fixtureProfileId", "occurrenceIdSha256", "owner", "phase", "responseSha256", "runId", "scenario", "schema", "sessionIdSha256"];
  const stores = fixtureStoreIds(runId);
  if (Object.keys(row).sort().join("\u0000") !== exact.sort().join("\u0000")
    || row.schema !== PERSIST13_VERIFY_CLEAR_SIDECAR_SCHEMA || row.owner !== PERSIST13_FIXTURE_OWNER
    || row.runId !== runId.toLowerCase() || row.scenario !== "verify_clear"
    || !["verified_pending_clear", "recovering", "recovered"].includes(String(row.phase))
    || row.dataStoreId !== stores.dataStoreId || row.controlStoreId !== stores.controlStoreId || row.fixtureProfileId !== runId.toLowerCase()
    || ![row.sessionIdSha256, row.occurrenceIdSha256, row.responseSha256, row.expectedAttemptSha256, row.expectedSessionSha256].every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    || !Number.isSafeInteger(row.baselineAttemptCount) || Number(row.baselineAttemptCount) < 0
    || !Number.isSafeInteger(row.expectedReviewCount) || Number(row.expectedReviewCount) < 0
    || !Number.isSafeInteger(row.baselineSessionIndex) || Number(row.baselineSessionIndex) < 0
    || !Array.isArray(row.expectedReviewSha256) || row.expectedReviewSha256.length === 0
    || !row.expectedReviewSha256.every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    || !isHashedSnapshot(row.before) || !isHashedSnapshot(row.after) || areHashedSnapshotsEqual(row.before, row.after)
    || !row.after.some((entry) => entry.key === persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL))) return false;
  return true;
}

export function isPersist13SubmitClearNextSidecar(value: unknown, runId: string): value is Persist13SubmitClearNextSidecar {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const exact = ["after", "baselineAttemptCount", "baselineReviewCount", "baselineSessionIndex", "before", "controlStoreId", "dataStoreId", "expectedAdvancedSessionSha256", "expectedAttemptSha256", "expectedReviewCount", "expectedReviewSha256", "expectedSessionSha256", "fixtureProfileId", "occurrenceIdSha256", "owner", "phase", "responseSha256", "runId", "scenario", "schema", "sessionIdSha256", "sessionPinsSha256", "timerSha256"];
  const stores = fixtureStoreIds(runId);
  if (Object.keys(row).sort().join("\u0000") !== exact.sort().join("\u0000")
    || row.schema !== PERSIST13_SUBMIT_CLEAR_NEXT_SIDECAR_SCHEMA || row.owner !== PERSIST13_FIXTURE_OWNER
    || row.runId !== runId.toLowerCase() || row.scenario !== "submit_clear_next"
    || !["postclear", "recovering", "bootstrap_verified", "advance_started", "advanced"].includes(String(row.phase))
    || row.dataStoreId !== stores.dataStoreId || row.controlStoreId !== stores.controlStoreId || row.fixtureProfileId !== runId.toLowerCase()
    || ![row.sessionIdSha256, row.occurrenceIdSha256, row.responseSha256, row.expectedAttemptSha256, row.expectedSessionSha256, row.expectedAdvancedSessionSha256, row.sessionPinsSha256, row.timerSha256].every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    || !Number.isSafeInteger(row.baselineAttemptCount) || Number(row.baselineAttemptCount) < 0
    || !Number.isSafeInteger(row.baselineReviewCount) || Number(row.baselineReviewCount) < 0
    || !Number.isSafeInteger(row.expectedReviewCount) || Number(row.expectedReviewCount) < 0
    || !Number.isSafeInteger(row.baselineSessionIndex) || Number(row.baselineSessionIndex) !== 0
    || !Array.isArray(row.expectedReviewSha256) || row.expectedReviewSha256.length === 0
    || !row.expectedReviewSha256.every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    || !isHashedSnapshot(row.before) || !isHashedSnapshot(row.after)
    || hasPersist13PhysicalJournal(row.after.map(({ key }) => [key, "present"] as const), runId)) return false;
  return !areHashedSnapshotsEqual(row.before, row.after);
}

export function isPersist13AdvanceMaterializedSidecar(value: unknown, runId: string): value is Persist13AdvanceMaterializedSidecar {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const exact = ["after", "attemptCount", "attemptSetSha256", "before", "controlStoreId", "dataStoreId", "expectedSessionSha256", "expectedSessionsSha256", "fixtureProfileId", "owner", "phase", "reviewCount", "reviewSetSha256", "runId", "scenario", "schema", "sessionIdSha256", "sessionPinsSha256", "timerSha256"];
  const stores = fixtureStoreIds(runId);
  if (Object.keys(row).sort().join("\u0000") !== exact.sort().join("\u0000")
    || row.schema !== PERSIST13_ADVANCE_MATERIALIZED_SIDECAR_SCHEMA || row.owner !== PERSIST13_FIXTURE_OWNER
    || row.runId !== runId.toLowerCase() || row.scenario !== "advance_materialized"
    || !["materialized", "recovering", "recovered"].includes(String(row.phase))
    || row.dataStoreId !== stores.dataStoreId || row.controlStoreId !== stores.controlStoreId || row.fixtureProfileId !== runId.toLowerCase()
    || ![row.sessionIdSha256, row.expectedSessionSha256, row.expectedSessionsSha256, row.sessionPinsSha256, row.attemptSetSha256, row.reviewSetSha256, row.timerSha256].every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    || !Number.isSafeInteger(row.attemptCount) || Number(row.attemptCount) < 0
    || !Number.isSafeInteger(row.reviewCount) || Number(row.reviewCount) < 0
    || !isHashedSnapshot(row.before) || !isHashedSnapshot(row.after)
    || row.before.some((entry) => entry.key === persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL))
    || !row.after.some((entry) => entry.key === persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL))) return false;
  const journalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  const before = row.before.find((entry) => entry.key === journalKey);
  const after = row.after.find((entry) => entry.key === journalKey);
  return after !== undefined && (!before || before.sha256 !== after.sha256)
    && !areHashedSnapshotsEqual(row.before, row.after);
}

export function isPersist13PracticeUiProbeSidecar(value: unknown, runId: string): value is Persist13PracticeUiProbeSidecar {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const exact = ["attemptCount", "attemptSetSha256", "controlStoreId", "currentItemIndex", "dataStoreId", "expectedFeedbackSha256", "fixtureProfileId", "initialSessionElapsedMs", "initialTimerAccumulatedMs", "initialTimerCheckpointRevision", "occurrenceIdSha256", "otherSessionsSha256", "owner", "phase", "readySnapshot", "resultCount", "resultSetSha256", "reviewCount", "reviewSetSha256", "runId", "scenario", "schema", "sessionCount", "sessionIdSha256", "sessionPinsSha256", "sessionStateSha256", "timerIdentitySha256"];
  const stores = fixtureStoreIds(runId);
  return Object.keys(row).sort().join("\u0000") === exact.sort().join("\u0000")
    && row.schema === PERSIST13_PRACTICE_UI_PROBE_SIDECAR_SCHEMA && row.owner === PERSIST13_FIXTURE_OWNER
    && row.runId === runId.toLowerCase() && row.scenario === "practice_ui_probe"
    && (row.phase === "ready" || row.phase === "ui_armed")
    && row.dataStoreId === stores.dataStoreId && row.controlStoreId === stores.controlStoreId
    && row.fixtureProfileId === runId.toLowerCase() && row.currentItemIndex === 0
    && isHashedSnapshot(row.readySnapshot)
    && !hasPersist13PhysicalJournal(row.readySnapshot.map(({ key }) => [key, "present"] as const), runId)
    && [row.sessionIdSha256, row.occurrenceIdSha256, row.expectedFeedbackSha256, row.sessionPinsSha256, row.sessionStateSha256, row.otherSessionsSha256,
      row.attemptSetSha256, row.reviewSetSha256, row.resultSetSha256, row.timerIdentitySha256]
      .every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    && [row.sessionCount, row.attemptCount, row.reviewCount, row.resultCount, row.initialSessionElapsedMs,
      row.initialTimerAccumulatedMs, row.initialTimerCheckpointRevision]
      .every((count) => Number.isSafeInteger(count) && Number(count) >= 0)
    && Number(row.initialTimerCheckpointRevision) >= 1;
}

export function arePersist13HashedSnapshotsEqualExceptKeys(left: Persist13HashedPhysicalSnapshot, right: Persist13HashedPhysicalSnapshot, allowedKeys: ReadonlySet<string>): boolean {
  const a = left.filter((entry) => !allowedKeys.has(entry.key));
  const b = right.filter((entry) => !allowedKeys.has(entry.key));
  return a.length === b.length && a.every((entry, index) => entry.key === b[index]?.key && entry.sha256 === b[index]?.sha256);
}

/** Allow only the current session record and foreground timer to vary from an observed Next checkpoint. */
export function arePersist13PracticeUiNextSnapshotsPreserved(
  expected: Persist13HashedPhysicalSnapshot,
  actual: Persist13HashedPhysicalSnapshot,
  runId: string,
  sessionPhysicalKeySha256: string,
): boolean {
  if (!isPersist13RunId(runId) || !/^[a-f0-9]{64}$/u.test(sessionPhysicalKeySha256)
    || !isHashedSnapshot(expected) || !isHashedSnapshot(actual)) return false;
  const sessionPrefix = persist13FixturePhysicalKey(runId, STORAGE_KEYS.trainingSession(""));
  const sessionKey = expected.filter((entry) => entry.key.startsWith(sessionPrefix) && sha256Utf8(entry.key) === sessionPhysicalKeySha256);
  const actualSessionKey = actual.filter((entry) => entry.key.startsWith(sessionPrefix) && sha256Utf8(entry.key) === sessionPhysicalKeySha256);
  if (sessionKey.length !== 1 || actualSessionKey.length !== 1 || sessionKey[0]!.key !== actualSessionKey[0]!.key) return false;
  const timerKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
  const journalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  const indexKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.TRAINING_SESSION_INDEX);
  const pointerKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
  if (expected.some((entry) => entry.key === journalKey) || actual.some((entry) => entry.key === journalKey)
    || !expected.some((entry) => entry.key === timerKey) || !actual.some((entry) => entry.key === timerKey)) return false;
  for (const stableKey of [indexKey, pointerKey]) {
    const before = expected.find((entry) => entry.key === stableKey);
    const after = actual.find((entry) => entry.key === stableKey);
    if (!before || !after || before.sha256 !== after.sha256) return false;
  }
  return arePersist13HashedSnapshotsEqualExceptKeys(expected, actual, new Set([sessionKey[0]!.key, timerKey]));
}

export function isPersist13PracticeUiNextSidecar(value: unknown, runId: string): value is Persist13PracticeUiNextSidecar {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const exact = ["attemptCount", "attemptSetSha256", "controlStoreId", "currentItemIndex", "dataStoreId", "expectedFeedbackSha256", "expectedSessionOneSha256", "expectedSessionZeroSha256", "fixtureProfileId", "initialSessionElapsedMs", "initialTimerAccumulatedMs", "initialTimerCheckpointRevision", "nextOccurrenceIdSha256", "occurrenceIdSha256", "otherSessionsSha256", "owner", "phase", "readySnapshot", "resultCount", "resultSetSha256", "reviewCount", "reviewSetSha256", "runId", "scenario", "schema", "sessionCount", "sessionIdSha256", "sessionPhysicalKeySha256", "sessionPinsSha256", "timerIdentitySha256"].sort();
  const stores = fixtureStoreIds(runId);
  const journalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  return Object.keys(row).sort().join("\u0000") === exact.join("\u0000")
    && row.schema === PERSIST13_PRACTICE_UI_NEXT_SIDECAR_SCHEMA && row.owner === PERSIST13_FIXTURE_OWNER
    && row.runId === runId.toLowerCase() && row.scenario === "practice_ui_next"
    && (row.phase === "ready" || row.phase === "ui_armed")
    && row.dataStoreId === stores.dataStoreId && row.controlStoreId === stores.controlStoreId
    && row.fixtureProfileId === runId.toLowerCase() && row.currentItemIndex === 0
    && isHashedSnapshot(row.readySnapshot) && row.readySnapshot.every((entry) => entry.key !== journalKey)
    && [row.sessionIdSha256, row.sessionPhysicalKeySha256, row.occurrenceIdSha256, row.nextOccurrenceIdSha256, row.expectedFeedbackSha256, row.sessionPinsSha256,
      row.expectedSessionZeroSha256, row.expectedSessionOneSha256, row.otherSessionsSha256, row.attemptSetSha256, row.reviewSetSha256,
      row.resultSetSha256, row.timerIdentitySha256].every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    && [row.sessionCount, row.attemptCount, row.reviewCount, row.resultCount, row.initialSessionElapsedMs,
      row.initialTimerAccumulatedMs, row.initialTimerCheckpointRevision].every((count) => Number.isSafeInteger(count) && Number(count) >= 0)
    && Number(row.initialTimerCheckpointRevision) >= 1;
}

export function isPersist13PracticeUiNextObservation(value: unknown, runId: string): value is Persist13PracticeUiNextObservation {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const { authCold, ...core } = row;
  return authCold === true && isPersist13PracticeUiNextObservationCore(core, runId);
}

export function isPersist13PracticeUiNextObservationCore(value: unknown, runId: string): value is Persist13PracticeUiNextObservationCore {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !isPersist13RunId(runId)) return false;
  const row = value as Record<string, unknown>;
  const exact = ["afterSnapshot", "attemptCount", "attemptSetSha256", "beforeSnapshot", "currentItemIndex", "occurrenceIdSha256", "otherSessionsSha256", "owner", "phase", "projectionKind", "resultCount", "resultSetSha256", "reviewCount", "reviewSetSha256", "runId", "scenario", "schema", "sessionCount", "sessionElapsedMs", "sessionIdSha256", "sessionPhysicalKeySha256", "sessionStableSha256", "timerAccumulatedMs", "timerCheckpointRevision", "timerIdentitySha256"].sort();
  if (Object.keys(row).sort().join("\u0000") !== exact.join("\u0000")) return false;
  if (row.schema !== PERSIST13_PRACTICE_UI_NEXT_OBSERVATION_SCHEMA || row.owner !== PERSIST13_FIXTURE_OWNER
    || row.runId !== runId.toLowerCase() || row.scenario !== "practice_ui_next" || row.phase !== "ui_armed"
    || row.currentItemIndex !== 1 || row.projectionKind !== "unanswered"
    || ![row.sessionIdSha256, row.sessionPhysicalKeySha256, row.occurrenceIdSha256, row.sessionStableSha256, row.otherSessionsSha256, row.attemptSetSha256,
      row.reviewSetSha256, row.resultSetSha256, row.timerIdentitySha256].every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))
    || ![row.sessionCount, row.attemptCount, row.reviewCount, row.resultCount, row.sessionElapsedMs,
      row.timerAccumulatedMs, row.timerCheckpointRevision].every((count) => Number.isSafeInteger(count) && Number(count) >= 0)
    || Number(row.timerCheckpointRevision) < 1 || !isHashedSnapshot(row.beforeSnapshot) || !isHashedSnapshot(row.afterSnapshot)) return false;
  const sessionKeyPrefix = `patternly:profile:v1:${runId.toLowerCase()}:${encodeURIComponent(`${STORAGE_KEYS.trainingSession("")}`)}`;
  const sessionKeys = row.afterSnapshot.filter((entry) => entry.key.startsWith(sessionKeyPrefix) && sha256Utf8(entry.key) === row.sessionPhysicalKeySha256);
  const dynamic = new Set([...(sessionKeys.length === 1 ? [sessionKeys[0]!.key] : []), persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER)]);
  const journalKey = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  return sessionKeys.length === 1 && row.beforeSnapshot.every((entry) => entry.key !== journalKey)
    && row.afterSnapshot.every((entry) => entry.key !== journalKey)
    && row.beforeSnapshot.some((entry) => entry.key === persist13FixturePhysicalKey(runId, STORAGE_KEYS.TRAINING_SESSION_INDEX))
    && row.afterSnapshot.some((entry) => entry.key === persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_TRAINING_SESSION))
    && arePersist13HashedSnapshotsEqualExceptKeys(row.beforeSnapshot, row.afterSnapshot, dynamic);
}

export function writeAndVerifyPersist13PracticeUiNextSidecar(
  control: Readonly<{ getString(key: string): string | undefined; set(key: string, value: string): void }>,
  sidecar: Persist13PracticeUiNextSidecar,
): boolean {
  if (!isPersist13PracticeUiNextSidecar(sidecar, sidecar.runId)) return false;
  const raw = control.getString(PERSIST13_SCENARIO_SIDECAR_KEY);
  if (sidecar.phase === "ready") {
    if (raw !== undefined) return false;
  } else {
    if (raw === undefined) return false;
    try {
      const current: unknown = JSON.parse(raw);
      if (!isPersist13PracticeUiNextSidecar(current, sidecar.runId) || current.phase !== "ready"
        || JSON.stringify({ ...current, phase: "ui_armed" }) !== JSON.stringify(sidecar)) return false;
    } catch { return false; }
  }
  control.set(PERSIST13_SCENARIO_SIDECAR_KEY, JSON.stringify(sidecar));
  try {
    const written: unknown = JSON.parse(control.getString(PERSIST13_SCENARIO_SIDECAR_KEY) ?? "null");
    return isPersist13PracticeUiNextSidecar(written, sidecar.runId)
      && written.phase === sidecar.phase && JSON.stringify(written) === JSON.stringify(sidecar);
  } catch { return false; }
}

export function writeAndVerifyPersist13PracticeUiProbeSidecar(
  control: Readonly<{ getString(key: string): string | undefined; set(key: string, value: string): void }>,
  sidecar: Persist13PracticeUiProbeSidecar,
): boolean {
  if (!isPersist13PracticeUiProbeSidecar(sidecar, sidecar.runId)) return false;
  const currentRaw = control.getString(PERSIST13_SCENARIO_SIDECAR_KEY);
  if (sidecar.phase === "ready") {
    if (currentRaw !== undefined) return false;
  } else {
    if (currentRaw === undefined) return false;
    try {
      const current: unknown = JSON.parse(currentRaw);
      if (!isPersist13PracticeUiProbeSidecar(current, sidecar.runId) || current.phase !== "ready") return false;
      if (JSON.stringify({ ...current, phase: "ui_armed" }) !== JSON.stringify(sidecar)) return false;
    } catch { return false; }
  }
  control.set(PERSIST13_SCENARIO_SIDECAR_KEY, JSON.stringify(sidecar));
  try {
    const written: unknown = JSON.parse(control.getString(PERSIST13_SCENARIO_SIDECAR_KEY) ?? "null");
    return isPersist13PracticeUiProbeSidecar(written, sidecar.runId)
      && written.phase === sidecar.phase && JSON.stringify(written) === JSON.stringify(sidecar);
  } catch { return false; }
}

export function writeAndVerifyPersist13AdvanceMaterializedSidecar(
  control: Readonly<{ getString(key: string): string | undefined; set(key: string, value: string): void }>,
  sidecar: Persist13AdvanceMaterializedSidecar,
): boolean {
  if (!isPersist13AdvanceMaterializedSidecar(sidecar, sidecar.runId)) return false;
  control.set(PERSIST13_SCENARIO_SIDECAR_KEY, JSON.stringify(sidecar));
  let parsed: unknown;
  try { parsed = JSON.parse(control.getString(PERSIST13_SCENARIO_SIDECAR_KEY) ?? "null"); }
  catch { return false; }
  return isPersist13AdvanceMaterializedSidecar(parsed, sidecar.runId)
    && parsed.phase === sidecar.phase && JSON.stringify(parsed) === JSON.stringify(sidecar);
}

/** Persist and read back a one-shot advance barrier before invoking production Next. */
export function writeAndVerifyPersist13SubmitClearNextPhase(
  control: Readonly<{ getString(key: string): string | undefined; set(key: string, value: string): void }>,
  sidecar: Persist13SubmitClearNextSidecar,
): boolean {
  if (!isPersist13SubmitClearNextSidecar(sidecar, sidecar.runId)) return false;
  control.set(PERSIST13_SCENARIO_SIDECAR_KEY, JSON.stringify(sidecar));
  let parsed: unknown;
  try { parsed = JSON.parse(control.getString(PERSIST13_SCENARIO_SIDECAR_KEY) ?? "null"); }
  catch { return false; }
  return isPersist13SubmitClearNextSidecar(parsed, sidecar.runId)
    && parsed.phase === sidecar.phase && JSON.stringify(parsed) === JSON.stringify(sidecar);
}

/** A possibly-issued Next is terminal unless a future reviewed contract adds exact outcome reconciliation. */
export function beginPersist13SubmitClearNextRecovery(
  control: Readonly<{ getString(key: string): string | undefined; set(key: string, value: string): void }>,
  sidecar: Persist13SubmitClearNextSidecar,
  currentSessionIndex: number,
): boolean {
  if (!isPersist13SubmitClearNextSidecar(sidecar, sidecar.runId) || currentSessionIndex !== 0) return false;
  if (sidecar.phase === "advance_started" || sidecar.phase === "advanced") {
    let current: unknown;
    try { current = JSON.parse(control.getString(PERSIST13_SCENARIO_SIDECAR_KEY) ?? "null"); }
    catch { return false; }
    if (!isPersist13SubmitClearNextSidecar(current, sidecar.runId) || current.phase !== sidecar.phase
      || JSON.stringify(current) !== JSON.stringify(sidecar)) return false;
    return false;
  }
  const recovering = Object.freeze({ ...sidecar, phase: "recovering" as const });
  return writeAndVerifyPersist13SubmitClearNextPhase(control, recovering);
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

export function hashPersist13PracticeUiSessionState(session: object, hash: (value: unknown) => string): string {
  const { activeForegroundMs: _elapsedForegroundMs, ...stableState } = session as Record<string, unknown>;
  return hash(stableState);
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

export const PERSIST13_START_CAPABILITY_KEY = "patternly:persist13:start-capability:v1";
export const PERSIST13_START_RECOVERY_KEY = "patternly:persist13:start-recovery:v1";
export type Persist13StartBoundary = "before_start_journal_write" | "after_start_journal_durable_before_materialization";
export type Persist13StartCapability = Readonly<{
  schema: "patternly:persist13-start-capability.v2"; resumeValidated: true; requestedLength: 10;
  runId: string; stage: Persist13StartBoundary; dataStoreId: string; controlStoreId: string;
  profile: Readonly<{ id: string; kind: "guest"; accountId: null }>; leaseGeneration: number;
  commandFingerprint: string; planFingerprint: string; baseline: Persist13HashedPhysicalSnapshot; sessionIdSha256: string;
  capability: "production_start_commit_raw_mmkv"; recoveryRun: false; phase: "paused";
  journalStatus: "absent" | "journal_durable"; journalSha256: string | null; after: Persist13HashedPhysicalSnapshot;
  changedPhysicalKeys: readonly string[]; targetsAbsent: true; callbackPending: true;
}>;
export type Persist13StartRecovery = Readonly<{
  schema: "patternly:persist13-start-recovery.v1"; runId: string; stage: Persist13StartBoundary;
  phase: "prepared" | "boot1_complete" | "complete"; commandFingerprint: string; planFingerprint: string;
  before: Persist13HashedPhysicalSnapshot; expectedAfter: Persist13HashedPhysicalSnapshot;
  firstAfter: Persist13HashedPhysicalSnapshot | null; secondAfter: Persist13HashedPhysicalSnapshot | null;
}>;
const START_CAPABILITY_FIELDS = "schema resumeValidated requestedLength runId stage dataStoreId controlStoreId profile leaseGeneration commandFingerprint planFingerprint baseline sessionIdSha256 capability recoveryRun phase journalStatus journalSha256 after changedPhysicalKeys targetsAbsent callbackPending".split(" ");
const START_RECOVERY_FIELDS = "schema runId stage phase commandFingerprint planFingerprint before expectedAfter firstAfter secondAfter".split(" ");
function startObject(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function startFields(value: Record<string, unknown>, fields: readonly string[]): boolean { return Object.keys(value).length === fields.length && fields.every(key => Object.hasOwn(value, key)); }
function startHash(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function startSnapshot(value: unknown): value is Persist13HashedPhysicalSnapshot {
  return Array.isArray(value) && value.length <= 10000 && value.every((row, index) => startObject(row) && startFields(row, ["key", "sha256"])
    && typeof row.key === "string" && startHash(row.sha256) && (index === 0 || value[index - 1].key < row.key));
}
export function isPersist13StartCapability(value: unknown, runId: string, stage: Persist13StartBoundary): value is Persist13StartCapability {
  if (!startObject(value) || !isPersist13RunId(runId) || !startFields(value, START_CAPABILITY_FIELDS)) return false;
  const ids = fixtureStoreIds(runId); const profile = value.profile;
  if (value.schema !== "patternly:persist13-start-capability.v2" || value.resumeValidated !== true || value.requestedLength !== 10
    || value.runId !== runId || value.stage !== stage || value.dataStoreId !== ids.dataStoreId || value.controlStoreId !== ids.controlStoreId
    || !startObject(profile) || !startFields(profile, ["id", "kind", "accountId"]) || profile.id !== runId || profile.kind !== "guest" || profile.accountId !== null
    || !Number.isSafeInteger(value.leaseGeneration) || Number(value.leaseGeneration) < 1 || !startHash(value.commandFingerprint) || !startHash(value.planFingerprint)
    || !startHash(value.sessionIdSha256) || value.capability !== "production_start_commit_raw_mmkv" || value.recoveryRun !== false || value.phase !== "paused"
    || value.targetsAbsent !== true || value.callbackPending !== true || !startSnapshot(value.baseline) || !startSnapshot(value.after) || !Array.isArray(value.changedPhysicalKeys)) return false;
  const j = persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL);
  if (stage === "before_start_journal_write") return value.journalStatus === "absent" && value.journalSha256 === null && value.changedPhysicalKeys.length === 0
    && !value.after.some(row => row.key === j) && areHashedSnapshotsEqual(value.baseline, value.after);
  return value.journalStatus === "journal_durable" && startHash(value.journalSha256) && value.changedPhysicalKeys.length === 1 && value.changedPhysicalKeys[0] === j
    && !value.baseline.some(row => row.key === j) && value.after.some(row => row.key === j) && areHashedSnapshotsEqual(value.baseline, value.after, j);
}
export function isPersist13StartRecovery(value: unknown, capability: Persist13StartCapability): value is Persist13StartRecovery {
  if (!startObject(value) || !startFields(value, START_RECOVERY_FIELDS) || value.schema !== "patternly:persist13-start-recovery.v1"
    || value.runId !== capability.runId || value.stage !== capability.stage || value.commandFingerprint !== capability.commandFingerprint || value.planFingerprint !== capability.planFingerprint
    || !startSnapshot(value.before) || !areHashedSnapshotsEqual(value.before, capability.after) || !startSnapshot(value.expectedAfter)) return false;
  if (value.phase === "prepared") return value.secondAfter === null && (value.firstAfter === null || startSnapshot(value.firstAfter) && areHashedSnapshotsEqual(value.expectedAfter, value.firstAfter));
  if (!startSnapshot(value.firstAfter) || !areHashedSnapshotsEqual(value.expectedAfter, value.firstAfter)) return false;
  return value.phase === "boot1_complete" ? value.secondAfter === null : value.phase === "complete" && startSnapshot(value.secondAfter) && areHashedSnapshotsEqual(value.firstAfter, value.secondAfter);
}
/** Pure expected bytes from the already frozen canonical J, not a fresh session prepare. */
export function expectedPersist13StartRecoverySnapshot(before: Persist13HashedPhysicalSnapshot, runId: string, journal: import("../../storage/repositories/mutationJournalRepository").MutationJournalRecord | null): Persist13HashedPhysicalSnapshot {
  const expected = new Map(before.map(row => [row.key, row.sha256]));
  expected.delete(persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL));
  if (journal) {
    if (journal.operation !== "start_training_session" || journal.status !== "journal_durable") throw new Error("persist13_start_recovery_wrong_journal");
    for (const write of journal.physicalWrites) {
      const key = persist13FixturePhysicalKey(runId, write.key);
      if (write.after.kind === "absent") expected.delete(key); else expected.set(key, write.after.digest);
    }
  }
  return [...expected].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, sha256]) => ({ key, sha256 }));
}
/** Guard before opening router or calling any production recovery. Prepared is fail-stop. */
export function assertPersist13StartRecoveryEntry(capability: unknown, evidence: unknown, actual: Persist13HashedPhysicalSnapshot, runId: string, stage: Persist13StartBoundary): { capability: Persist13StartCapability; evidence: Persist13StartRecovery | null } {
  if (!isPersist13StartCapability(capability, runId, stage)) throw new Error("persist13_start_fixture_version_or_scope_invalid");
  if (evidence === null) {
    if (!areHashedSnapshotsEqual(actual, capability.after)) throw new Error("persist13_start_before_snapshot_mismatch");
    return { capability, evidence: null };
  }
  if (!isPersist13StartRecovery(evidence, capability) || evidence.phase === "prepared") throw new Error("persist13_start_recovery_evidence_unresolved");
  if (!areHashedSnapshotsEqual(actual, evidence.firstAfter!)) throw new Error("persist13_start_recovery_snapshot_changed");
  return { capability, evidence };
}

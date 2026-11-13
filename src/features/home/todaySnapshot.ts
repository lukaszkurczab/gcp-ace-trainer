/**
 * T2.3: Today projections keyed by a revision of the local learning store.
 *
 * Over a large history the Home shell spends most of its time in projections
 * (plan, practice recommendation, progress, the coding dashboard), not in the
 * reads. The projections are a pure function of the learning records, the
 * active track and the clock, so they are reused while the store revision and
 * the owner (profile + track) are unchanged:
 * - in memory, for refocus and for the reload after an unchanged sync;
 * - persisted in the active profile's own storage, for the next cold start.
 *
 * A snapshot is stale-while-revalidate: it is shown at once and recomputed in
 * the background when it is older than `TODAY_SNAPSHOT_FRESH_MS`, so
 * clock-dependent parts (due reviews, today's plan) catch up within a frame or
 * two. It is never read across profiles: the owner key carries the profile id,
 * kind and account, and the caller's profile/source fences still guard the
 * commit.
 *
 * Kill-switch: `EXPO_PUBLIC_PATTERNLY_PERF_OPT_PARALLEL_BOOT=0` disables both
 * layers (the snapshot is part of the parallel start).
 */
import { STORAGE_NAMESPACE } from "../../storage/keys";

/** The slice of the active profile store this module uses. */
export type TodaySnapshotStorage = Readonly<{
  getAllKeys(): readonly string[];
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  remove(key: string): void;
}>;
type KeyValueStorage = TodaySnapshotStorage;
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

/** Derived, rebuildable cache; outside the canonical namespace and never exported or synced. */
export const TODAY_SNAPSHOT_KEY = "patternly:derived:v1:today-snapshot";
const SNAPSHOT_SCHEMA = 1;
/** A reused projection older than this is recomputed in the background. */
export const TODAY_SNAPSHOT_FRESH_MS = 60_000;
/**
 * Persisting is opt-in (`EXPO_PUBLIC_PATTERNLY_PERF_OPT_TODAY_SNAPSHOT_PERSIST=1`)
 * until account deletion and learning-history reset also remove this derived
 * key: today they clear only the canonical learning namespace, so a persisted
 * copy of derived progress could outlive the records it was built from.
 * The in-memory layer is always on with the parallel start.
 */
export const TODAY_SNAPSHOT_PERSISTED = process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_TODAY_SNAPSHOT_PERSIST === "1";

/**
 * Canonical families that Home reads or projects. Excluded on purpose: account
 * sync bookkeeping (it changes on every sync without changing Today), the
 * in-session draft and foreground timer, settings, notifications, premium,
 * content reports and lifecycle markers.
 */
const TODAY_INPUT_PREFIXES: readonly string[] = Object.freeze([
  "active-track",
  "active-training-session",
  "training-session:",
  "training-session-result:",
  "training-session-index",
  "training-attempt:",
  "training-attempt-index",
  "review-entry:",
  "review-index",
  "goal:",
  "learning-plan:",
  "goal-onboarding-preferences",
  "journal:active",
  "unavailable-active",
  "unavailable-review",
].map((suffix) => `${STORAGE_NAMESPACE}${suffix}`));
const EXCLUDED_KEYS: ReadonlySet<string> = new Set([`${STORAGE_NAMESPACE}active-training-session-draft`]);

export function isTodayInputKey(key: string): boolean {
  return !EXCLUDED_KEYS.has(key) && TODAY_INPUT_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Digest of every Today input record as stored (key and raw value), in key
 * order. Any write, removal or re-creation of an input changes it. Raw values
 * are hashed without parsing or validation, so the cost is a key scan and one
 * SHA-256 (native on device).
 */
export function computeTodayStoreRevision(storage: Pick<KeyValueStorage, "getAllKeys" | "getString">, hash: (value: string) => string = sha256Utf8): string {
  const keys = storage.getAllKeys().filter(isTodayInputKey).sort();
  const parts: string[] = [];
  for (const key of keys) {
    const value = storage.getString(key);
    if (value === undefined) continue;
    parts.push(key, String(value.length), value);
  }
  return `${keys.length}:${hash(parts.join("\u0000"))}`;
}

export type TodaySnapshotOwner = Readonly<{ profileKey: string; trackId: string | null }>;

export type TodaySnapshot<Data> = Readonly<{
  schema: typeof SNAPSHOT_SCHEMA;
  revision: string;
  owner: TodaySnapshotOwner;
  capturedAt: string;
  data: Data;
}>;

let memory: TodaySnapshot<unknown> | null = null;

function sameOwner(left: TodaySnapshotOwner, right: TodaySnapshotOwner): boolean {
  return left.profileKey === right.profileKey && left.trackId === right.trackId;
}

function isSnapshot(value: unknown): value is TodaySnapshot<unknown> {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const owner = candidate.owner as Record<string, unknown> | undefined;
  return candidate.schema === SNAPSHOT_SCHEMA && typeof candidate.revision === "string"
    && typeof candidate.capturedAt === "string" && !Number.isNaN(Date.parse(candidate.capturedAt))
    && typeof owner === "object" && owner !== null && typeof owner.profileKey === "string"
    && (owner.trackId === null || typeof owner.trackId === "string")
    && typeof candidate.data === "object" && candidate.data !== null;
}

export type TodaySnapshotRead<Data> = Readonly<{ snapshot: TodaySnapshot<Data>; source: "memory" | "persisted"; fresh: boolean }>;

/**
 * Returns the snapshot for exactly this revision and owner, from memory or the
 * profile store. A persisted snapshot that does not match is removed, so no
 * derived copy outlives the records it was built from.
 */
export function readTodaySnapshot<Data>(input: Readonly<{
  revision: string;
  owner: TodaySnapshotOwner;
  nowMs: number;
  storage: Pick<KeyValueStorage, "getString" | "remove"> | null;
  persisted?: boolean;
}>): TodaySnapshotRead<Data> | null {
  const freshness = (snapshot: TodaySnapshot<unknown>) => {
    const age = input.nowMs - Date.parse(snapshot.capturedAt);
    return age >= 0 && age < TODAY_SNAPSHOT_FRESH_MS;
  };
  if (memory && memory.revision === input.revision && sameOwner(memory.owner, input.owner)) {
    return { snapshot: memory as TodaySnapshot<Data>, source: "memory", fresh: freshness(memory) };
  }
  if (!(input.persisted ?? TODAY_SNAPSHOT_PERSISTED) || !input.storage) return null;
  let raw: string | undefined;
  try { raw = input.storage.getString(TODAY_SNAPSHOT_KEY); } catch { return null; }
  if (raw === undefined) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { parsed = null; }
  if (!isSnapshot(parsed) || parsed.revision !== input.revision || !sameOwner(parsed.owner, input.owner)) {
    try { input.storage.remove(TODAY_SNAPSHOT_KEY); } catch { /* A stale cache is ignored either way. */ }
    return null;
  }
  memory = parsed;
  return { snapshot: parsed as TodaySnapshot<Data>, source: "persisted", fresh: freshness(parsed) };
}

/** Keeps the latest projection in memory and, when enabled, in the profile store. */
export function writeTodaySnapshot<Data>(input: Readonly<{
  revision: string;
  owner: TodaySnapshotOwner;
  capturedAt: string;
  data: Data;
  storage: Pick<KeyValueStorage, "setString"> | null;
  persisted?: boolean;
}>): void {
  const snapshot: TodaySnapshot<Data> = Object.freeze({ schema: SNAPSHOT_SCHEMA, revision: input.revision, owner: Object.freeze({ ...input.owner }), capturedAt: input.capturedAt, data: input.data });
  memory = snapshot;
  if (!(input.persisted ?? TODAY_SNAPSHOT_PERSISTED) || !input.storage) return;
  try { input.storage.setString(TODAY_SNAPSHOT_KEY, JSON.stringify(snapshot)); } catch { /* Best effort: the next start recomputes. */ }
}

/** Drops the in-memory layer (profile change, tests). */
export function clearTodaySnapshotMemory(): void {
  memory = null;
}

/**
 * T2.3: Today projections keyed by a revision of the local learning store.
 *
 * Over a large history the Home shell spends most of its time in projections
 * (plan, practice recommendation, progress, the coding dashboard), not in the
 * reads. The projections are a pure function of the learning records, the
 * active track and the clock, so they are reused while the store revision and
 * the owner (profile + track) are unchanged:
 * - in memory, for refocus and for the reload after an unchanged sync;
 * - persisted in the active profile's own (encrypted) storage, for the next
 *   cold start. Owner decision 2026-11-13: on by default, with kill-switches.
 *
 * A snapshot is stale-while-revalidate: it is shown at once and recomputed in
 * the background when it is older than `TODAY_SNAPSHOT_FRESH_MS`, so
 * clock-dependent parts (due reviews, today's plan) catch up within a frame or
 * two. It is never read across profiles: the owner key carries the profile id,
 * kind and account, and the caller's profile/source fences still guard the
 * commit.
 *
 * Kill-switches: `EXPO_PUBLIC_PATTERNLY_PERF_OPT_PARALLEL_BOOT=0` disables
 * both layers, reads included; `EXPO_PUBLIC_PATTERNLY_PERF_OPT_TODAY_SNAPSHOT_PERSIST=0`
 * disables only the persisted one.
 *
 * Stored format (stable input for T2.5, which reads it natively): one JSON
 * value under `TODAY_SNAPSHOT_KEY`:
 *   { schema: 1, revision: "<token from TODAY_REVISION_KEY>", owner: { profileKey, trackId },
 *     capturedAt: ISO-8601, data: TodayProjectionData }
 * `profileKey` = "<actor>|<profile kind>:<profile id>:<account id>|premium:<access>|content:<lock sha>:<ledger sha>".
 * Any change to this shape or to `data` bumps `schema` (and the key's v1).
 * A missing, corrupt, foreign or outdated entry is ignored, removed and
 * recomputed; it never blocks the start.
 */
import { STORAGE_NAMESPACE } from "../../storage/keys";
import { TODAY_SNAPSHOT_STORE_KEY } from "../bootstrap/parallelBoot";
import { setFirstScreenInputKeyFilter, setTodayInputWriteListener } from "../bootstrap/firstScreenRecord";

/** The slice of the active profile store this module uses. */
export type TodaySnapshotStorage = Readonly<{
  getAllKeys(): readonly string[];
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  remove(key: string): void;
}>;
type KeyValueStorage = TodaySnapshotStorage;

/** Derived, rebuildable cache; outside the canonical namespace and never exported or synced. */
export const TODAY_SNAPSHOT_KEY = TODAY_SNAPSHOT_STORE_KEY;
const SNAPSHOT_SCHEMA = 1;
/** A reused projection older than this is recomputed in the background. */
export const TODAY_SNAPSHOT_FRESH_MS = 60_000;
/**
 * On by default. Account deletion and history reset clear only the canonical
 * namespace, so this derived key is removed separately: at sign-out, deletion
 * and actor change (`invalidateTodaySnapshot`, via the account provider) and on
 * any read that does not match the current owner and revision.
 */
export const TODAY_SNAPSHOT_PERSISTED = process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_TODAY_SNAPSHOT_PERSIST !== "0";

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

// T2.5: a write of any Today input drops the native first-screen record.
setFirstScreenInputKeyFilter(isTodayInputKey);

/**
 * T27: derived key holding the revision token of the Today inputs in this profile store.
 * Outside the canonical namespace, so writing it is not a Today input write.
 */
export const TODAY_REVISION_KEY = "patternly:derived:v1:today-revision";

/** Profiles whose token is known to be absent since their last Today input write (this launch). */
const revisionDropped = new Set<string>();
let tokenCounter = 0;

/**
 * Called before every Today input write in a profile store (`createProfileScopedStorage` →
 * `noteProfileKeyWrite`): the store's revision token is dropped, so the next read issues a new one
 * and no snapshot taken under the old token matches again. Only the first write after a token was
 * issued pays for the removal.
 */
export function noteTodayInputWrite(scope: Readonly<{ profileId: string; dropDerived(key: string): void }>): void {
  if (revisionDropped.has(scope.profileId)) return;
  scope.dropDerived(TODAY_REVISION_KEY);
  revisionDropped.add(scope.profileId);
}

setTodayInputWriteListener(noteTodayInputWrite);

function newRevisionToken(): string {
  tokenCounter += 1;
  return `t:${Date.now().toString(36)}:${tokenCounter.toString(36)}:${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Revision of the Today inputs in this profile store: a token that stays the same until a Today
 * input is written or removed, then is replaced. O(1) at start, whatever the history size.
 * (Before T27 the revision was a SHA-256 over every input record, which grew with the history.)
 *
 * Trust model: as for the native first-screen record (T2.5), every write of a Today input goes
 * through the profile-scoped store, whose observer drops the token before the write lands.
 */
export function readTodayStoreRevision(profileId: string, storage: Pick<KeyValueStorage, "getString" | "setString">): string {
  const existing = storage.getString(TODAY_REVISION_KEY);
  if (existing !== undefined && existing.length > 0) {
    revisionDropped.delete(profileId);
    return existing;
  }
  const token = newRevisionToken();
  storage.setString(TODAY_REVISION_KEY, token);
  revisionDropped.delete(profileId);
  return token;
}

/** Tests only. */
export function resetTodayRevisionForTests(): void {
  revisionDropped.clear();
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

/**
 * Removes both layers for the given (still open) profile store: sign-out,
 * account deletion, actor change. Never throws.
 */
export function invalidateTodaySnapshot(storage: Pick<KeyValueStorage, "remove"> | null): void {
  memory = null;
  if (!storage) return;
  try { storage.remove(TODAY_SNAPSHOT_KEY); } catch { /* A closed store has nothing left to read it. */ }
}

/** Drops the in-memory layer (profile change, tests). */
export function clearTodaySnapshotMemory(): void {
  memory = null;
}

/**
 * T2.3 (Plan §T2.3, variant A4): parallel start and Today from local state.
 *
 * - Bundled content is verified while auth and the account bootstrap run, not
 *   after them (`startBundledContentPrefetch`). The content gate still awaits
 *   the same verification before it reports `ready`.
 * - A bound account profile starts from its local copy (the existing
 *   `localOffline` path) without waiting for `/me` or the account sync. The
 *   online identity proof and the sync run after the first usable frame
 *   (`whenStartupFirstUsableFrame`), through the ordinary local-offline
 *   refresh, which upgrades the session to `authenticated`.
 *
 * Kill-switch: `EXPO_PUBLIC_PATTERNLY_PERF_OPT_PARALLEL_BOOT=0` restores the
 * linear start (content after the account, `/me` and sync before Today).
 *
 * The module has no React Native imports so Node tests can load it.
 */
import { clearFirstScreenRecord } from "./firstScreenRecord";
export function isParallelBootEnabled(): boolean {
  return process.env.EXPO_PUBLIC_PATTERNLY_PERF_OPT_PARALLEL_BOOT !== "0";
}

/**
 * Fallback after the content gate settled: Today may never draw (a resumed
 * session, the track picker), and deferred start work must still run.
 */
export const STARTUP_FIRST_FRAME_FALLBACK_MS = 3_000;

type FirstFrameState = { reported: boolean; waiters: Set<() => void>; fallback: ReturnType<typeof setTimeout> | null };
const firstFrame: FirstFrameState = { reported: false, waiters: new Set(), fallback: null };

/** Today (or a terminal startup surface) reached its first usable frame in this process. Idempotent. */
export function notifyStartupFirstUsableFrame(): void {
  if (firstFrame.reported) return;
  firstFrame.reported = true;
  if (firstFrame.fallback !== null) { clearTimeout(firstFrame.fallback); firstFrame.fallback = null; }
  const waiters = [...firstFrame.waiters];
  firstFrame.waiters.clear();
  for (const waiter of waiters) {
    try { waiter(); } catch { /* A waiter never changes the frame that was reported. */ }
  }
}

/**
 * The content gate reached `ready`: report the first frame after `ms` even if
 * no screen reports it. Never armed before the gate settles, so deferred work
 * (the account sync) cannot overlap the startup integrity checks.
 */
export function armStartupFirstFrameFallback(ms: number = STARTUP_FIRST_FRAME_FALLBACK_MS): void {
  if (firstFrame.reported || firstFrame.fallback !== null) return;
  firstFrame.fallback = setTimeout(() => { firstFrame.fallback = null; notifyStartupFirstUsableFrame(); }, ms);
}

export function hasStartupFirstUsableFrame(): boolean {
  return firstFrame.reported;
}

/**
 * Resolves after the first usable frame, then one more macrotask so the frame
 * commit and `today_interactive` are not competing with the deferred work.
 * `cancel` resolves it at once; the caller's own fences decide whether the
 * work is still wanted.
 */
export function whenStartupFirstUsableFrame(
  timers: Readonly<{ set: (task: () => void, ms: number) => unknown; clear: (handle: unknown) => void }> = defaultTimers,
): Readonly<{ promise: Promise<void>; cancel: () => void }> {
  let settle!: () => void;
  const promise = new Promise<void>((resolve) => { settle = resolve; });
  let done = false;
  let hop: unknown = null;
  const finish = () => {
    if (done) return;
    done = true;
    firstFrame.waiters.delete(onFrame);
    settle();
  };
  const onFrame = () => {
    if (done) return;
    hop = timers.set(finish, 0);
  };
  if (firstFrame.reported) onFrame();
  else firstFrame.waiters.add(onFrame);
  return Object.freeze({
    promise,
    cancel: () => {
      if (hop !== null) timers.clear(hop);
      finish();
    },
  });
}

const defaultTimers = Object.freeze({
  set: (task: () => void, ms: number): unknown => setTimeout(task, ms),
  clear: (handle: unknown): void => { clearTimeout(handle as ReturnType<typeof setTimeout>); },
});

/**
 * Startup online revalidation of a local-first account start. The account
 * provider marks it when it publishes the local session and settles it when
 * the deferred refresh ends, whatever the result.
 */
let startupRevalidation: StartupRevalidationOwner | null = null;

export function markStartupRevalidationPending(owner: StartupRevalidationOwner): void {
  startupRevalidation = Object.freeze({ uid: owner.uid, accountId: owner.accountId, ...(owner.handoff ? { handoff: owner.handoff } : {}) });
}

export function readStartupRevalidationPending(): StartupRevalidationOwner | null {
  return startupRevalidation;
}

export function settleStartupRevalidation(owner?: StartupRevalidationOwner): void {
  if (!owner || (startupRevalidation?.uid === owner.uid && startupRevalidation.accountId === owner.accountId)) startupRevalidation = null;
}

/** `handoff`: the profile-preparation token of the local-first start, so a later preparation never matches it. */
export type StartupRevalidationOwner = Readonly<{ uid: string; accountId: string; handoff?: object }>;

/**
 * One deferred online revalidation per local-first start. Callers that arrive
 * for the same actor (the provider effect, the sidecar's initial refresh) join
 * it; any other call goes straight to `refreshNow`. The refresh starts only
 * after the first usable frame and only while the same local actor is shown.
 */
export function createStartupRevalidation<Result>(dependencies: Readonly<{
  readOwner: () => StartupRevalidationOwner | null;
  /** The local actor on screen now, or null when it is not a local-first session. */
  readLocalActor: () => StartupRevalidationOwner | null;
  waitForFirstFrame: () => Promise<void>;
  refreshNow: () => Promise<Result>;
  superseded: () => Result;
  onActive: (owner: StartupRevalidationOwner | null) => void;
  settle: (owner: StartupRevalidationOwner) => void;
}>): () => Promise<Result> {
  let inFlight: Readonly<{ owner: StartupRevalidationOwner; promise: Promise<Result>; token: object }> | null = null;
  const same = (left: StartupRevalidationOwner | null, right: StartupRevalidationOwner | null) =>
    left !== null && right !== null && left.uid === right.uid && left.accountId === right.accountId;
  return () => {
    const owner = dependencies.readOwner();
    if (!owner || !same(owner, dependencies.readLocalActor())) return dependencies.refreshNow();
    if (inFlight && same(inFlight.owner, owner)) return inFlight.promise;
    const token = {};
    const promise = (async (): Promise<Result> => {
      try {
        await dependencies.waitForFirstFrame();
        if (!same(owner, dependencies.readLocalActor())) return dependencies.superseded();
        dependencies.onActive(owner);
        try { return await dependencies.refreshNow(); }
        finally { dependencies.onActive(null); }
      } finally {
        dependencies.settle(owner);
        if (inFlight?.token === token) inFlight = null;
      }
    })();
    inFlight = Object.freeze({ owner, promise, token });
    return promise;
  };
}

/**
 * Actor boundary (sign-out, deletion, actor change): derived per-actor caches
 * registered here are dropped while the profile store is still open. The
 * account provider reports the boundary; Home's Today snapshot registers.
 */
export type StartupCacheStore = Readonly<{ remove(key: string): void }>;
/** Persisted Today snapshot (derived, per actor; format in `application/home/todaySnapshot.ts`). */
export const TODAY_SNAPSHOT_STORE_KEY = "patternly:derived:v1:today-snapshot";
/** T3.3a: the persisted account-progress sweep (owned by the API client adapter; same key). */
export const PROGRESS_SNAPSHOT_STORE_KEY = "patternly:derived:v1:progress-snapshot-cache";
const actorBoundaryListeners = new Set<(store: StartupCacheStore | null) => void>();

export function onActorBoundary(listener: (store: StartupCacheStore | null) => void): () => void {
  actorBoundaryListeners.add(listener);
  return () => { actorBoundaryListeners.delete(listener); };
}

export function notifyActorBoundary(store: StartupCacheStore | null): void {
  // Removed here directly, so it never depends on Home having been loaded.
  if (store) { try { store.remove(TODAY_SNAPSHOT_STORE_KEY); } catch { /* closed store */ } }
  // T3.3a: the persisted account-progress sweep is per actor too.
  if (store) { try { store.remove(PROGRESS_SNAPSHOT_STORE_KEY); } catch { /* closed store */ } }
  // T2.5: the native first-screen record belongs to the actor too.
  clearFirstScreenRecord();
  for (const listener of [...actorBoundaryListeners]) {
    try { listener(store); } catch { /* A cache drop never blocks sign-out. */ }
  }
}

type ContentPrefetch = Readonly<{ promise: Promise<void> }>;
let contentPrefetch: ContentPrefetch | null = null;

/**
 * Starts bundled content verification once per process. Failures are not
 * cached here: the catalog owner drops a failed build, so the gate's own call
 * repeats the verification and reports the real error.
 */
export function startBundledContentPrefetch(verify: () => Promise<void>): Promise<void> {
  if (contentPrefetch) return contentPrefetch.promise;
  const promise = (async () => {
    try { await verify(); } catch { /* The gate repeats the call and owns the failure. */ }
  })();
  contentPrefetch = Object.freeze({ promise });
  return promise;
}

/** Test-only reset of the process-wide startup signals. */
export function resetParallelBootForTests(): void {
  firstFrame.reported = false;
  firstFrame.waiters.clear();
  if (firstFrame.fallback !== null) clearTimeout(firstFrame.fallback);
  firstFrame.fallback = null;
  startupRevalidation = null;
  contentPrefetch = null;
}

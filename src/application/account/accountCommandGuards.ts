export const DELETION_AUTHORIZATION_TTL_MS = 5 * 60 * 1_000;

export type MonotonicClock = () => number;

export type DeletionAuthorizationVault = Readonly<{
  consume: (uid: string, generation: number) => boolean;
  isLive: (uid: string, generation: number) => boolean;
  issue: (uid: string, generation: number) => void;
  revoke: () => void;
}>;

export function isLiveDeletionAuthorization<TToken extends Readonly<{ generation: number; uid: string }>>(input: Readonly<{
  isCurrent: (token: TToken) => boolean;
  token: TToken | null;
  uid: string;
  vault: Pick<DeletionAuthorizationVault, "isLive">;
}>): boolean {
  const token = input.token;
  return token !== null && token.uid === input.uid && input.isCurrent(token) && input.vault.isLive(token.uid, token.generation);
}

export class DeletionAuthorizationClockError extends Error {
  public readonly code = "auth/monotonic-clock-invalid";

  public constructor() {
    super("auth/monotonic-clock-invalid");
    this.name = "DeletionAuthorizationClockError";
  }
}

export type DeletionPreparationResult = Readonly<{ ok: true } | { error: unknown; ok: false }>;

export type ReauthenticatedMutationResult<T> = Readonly<{ ok: true; value: T } | { error: unknown; ok: false }>;

type DeletionAuthorization = Readonly<{
  expiresAt: number;
  generation: number;
  uid: string;
}>;

/**
 * Keeps the deletion grant inside a closure. Callers receive operations only;
 * there is no grant-shaped value that can be constructed or passed back in.
 */
export function createDeletionAuthorizationVault(
  now: MonotonicClock = monotonicNow,
  ttlMs = DELETION_AUTHORIZATION_TTL_MS,
): DeletionAuthorizationVault {
  let authorization: DeletionAuthorization | null = null;
  let previousRead: number | null = null;
  const duration = ttlMs;

  const readClock = (): number | null => {
    let value: number;
    try {
      value = now();
    } catch {
      authorization = null;
      return null;
    }
    if (!Number.isFinite(value) || (previousRead !== null && value < previousRead)) {
      authorization = null;
      return null;
    }
    previousRead = value;
    return value;
  };

  return Object.freeze({
    consume: (uid: string, generation: number): boolean => {
      const current = authorization;
      authorization = null;
      if (!current || current.uid !== uid || current.generation !== generation) return false;
      const readAt = readClock();
      return readAt !== null && readAt < current.expiresAt;
    },
    isLive: (uid: string, generation: number): boolean => {
      const current = authorization;
      if (!current || current.uid !== uid || current.generation !== generation) return false;
      const readAt = readClock();
      if (readAt === null || readAt >= current.expiresAt) {
        authorization = null;
        return false;
      }
      return true;
    },
    issue: (uid: string, generation: number): void => {
      const issuedAt = readClock();
      const expiresAt = issuedAt === null ? Number.NaN : issuedAt + duration;
      if (issuedAt === null || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(expiresAt)) {
        authorization = null;
        throw new DeletionAuthorizationClockError();
      }
      authorization = Object.freeze({ uid, generation, expiresAt });
    },
    revoke: (): void => {
      authorization = null;
    },
  });
}

export async function prepareDeletionAuthorization<TCredentials>(input: Readonly<{
  credentials: TCredentials;
  generation: number;
  isCurrent: () => boolean;
  reauthenticate: (credentials: TCredentials) => Promise<unknown>;
  uid: string;
  vault: DeletionAuthorizationVault;
}>): Promise<DeletionPreparationResult> {
  const result = await runReauthenticatedMutation({
    credentials: input.credentials,
    isCurrent: input.isCurrent,
    mutation: async () => {
      input.vault.issue(input.uid, input.generation);
    },
    reauthenticate: input.reauthenticate,
  });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function runReauthenticatedMutation<TCredentials, TValue>(input: Readonly<{
  credentials: TCredentials;
  isCurrent: () => boolean;
  mutation: () => Promise<TValue>;
  reauthenticate: (credentials: TCredentials) => Promise<unknown>;
}>): Promise<ReauthenticatedMutationResult<TValue>> {
  try {
    await input.reauthenticate(input.credentials);
    if (!input.isCurrent()) return { ok: false, error: new Error("account_session_generation_stale") };
    const value = await input.mutation();
    if (!input.isCurrent()) return { ok: false, error: new Error("account_session_generation_stale") };
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error };
  }
}

export type SensitiveCommandLane = Readonly<{
  holdRefresh: () => () => void;
  run: <T>(operation: () => Promise<T>) => Promise<T>;
  runWhenIdle: <T>(operation: () => Promise<T>) => Promise<T>;
}>;

export type RefreshHoldLifecycle = Readonly<{
  acquire: () => void;
  release: () => void;
}>;

export function createRefreshHoldLifecycle(holdRefresh: () => () => void): RefreshHoldLifecycle {
  let releaseHold: (() => void) | null = null;
  return Object.freeze({
    acquire: (): void => {
      if (releaseHold === null) releaseHold = holdRefresh();
    },
    release: (): void => {
      const release = releaseHold;
      releaseHold = null;
      release?.();
    },
  });
}

export class SensitiveCommandInFlightError extends Error {
  public readonly code = "auth/command-in-flight";

  public constructor() {
    super("account_sensitive_command_in_flight");
    this.name = "SensitiveCommandInFlightError";
  }
}

/**
 * Serializes security-sensitive commands as a single flight. A concurrent
 * command is rejected so it cannot observe or mis-type another command's
 * result.
 */
export function createSensitiveCommandLane(): SensitiveCommandLane {
  type ActiveCommand = Readonly<{
    kind: "command" | "refresh";
    settled: Promise<void>;
  }>;
  let active: ActiveCommand | null = null;
  let refreshHoldCount = 0;
  let refreshHoldRelease: (() => void) | null = null;
  let refreshHoldReleasePromise: Promise<void> | null = null;

  const waitForRefreshHoldRelease = (): Promise<void> => {
    if (refreshHoldCount === 0) return Promise.resolve();
    if (!refreshHoldReleasePromise) {
      refreshHoldReleasePromise = new Promise<void>((resolve) => { refreshHoldRelease = resolve; });
    }
    return refreshHoldReleasePromise;
  };

  const holdRefresh = (): (() => void) => {
    refreshHoldCount += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      refreshHoldCount -= 1;
      if (refreshHoldCount !== 0) return;
      const release = refreshHoldRelease;
      refreshHoldRelease = null;
      refreshHoldReleasePromise = null;
      release?.();
    };
  };

  const start = <T>(kind: ActiveCommand["kind"], operation: () => Promise<T>): Promise<T> => {
    const promise = Promise.resolve().then(operation);
    let entry: ActiveCommand;
    const settled = promise.then(
      () => {
        if (active === entry) active = null;
      },
      () => {
        if (active === entry) active = null;
      },
    );
    entry = Object.freeze({ kind, settled });
    active = entry;
    return promise;
  };

  const run = <T>(operation: () => Promise<T>): Promise<T> => {
    const current = active;
    if (!current) return start("command", operation);
    if (current.kind === "command") return Promise.reject(new SensitiveCommandInFlightError());
    return current.settled.then(() => run(operation), () => run(operation));
  };

  const runWhenIdle = <T>(operation: () => Promise<T>): Promise<T> => {
    const current = active;
    if (current) return current.settled.then(() => runWhenIdle(operation), () => runWhenIdle(operation));
    if (refreshHoldCount > 0) return waitForRefreshHoldRelease().then(() => runWhenIdle(operation));
    return start("refresh", operation);
  };

  return Object.freeze({
    holdRefresh,
    run,
    runWhenIdle,
  });
}

export function monotonicNow(): number {
  const runtime = globalThis as typeof globalThis & { performance?: Readonly<{ now: () => number }> };
  const value = runtime.performance?.now?.();
  if (!Number.isFinite(value)) throw new Error("monotonic_clock_unavailable");
  return value!;
}

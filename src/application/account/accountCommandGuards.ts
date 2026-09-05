export const DELETION_AUTHORIZATION_TTL_MS = 5 * 60 * 1_000;

export type MonotonicClock = () => number;

export type DeletionAuthorizationVault = Readonly<{
  consume: (uid: string, generation: number) => boolean;
  issue: (uid: string, generation: number) => void;
  revoke: () => void;
}>;

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
  run: <T>(operation: () => Promise<T>) => Promise<T>;
}>;

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
  let active: Promise<unknown> | null = null;

  return Object.freeze({
    run: <T>(operation: () => Promise<T>): Promise<T> => {
      if (active) return Promise.reject(new SensitiveCommandInFlightError());
      const current = Promise.resolve().then(operation);
      active = current;
      void current.then(
        () => {
          if (active === current) active = null;
        },
        () => {
          if (active === current) active = null;
        },
      );
      return current;
    },
  });
}

export function monotonicNow(): number {
  const runtime = globalThis as typeof globalThis & { performance?: Readonly<{ now: () => number }> };
  const value = runtime.performance?.now?.();
  if (!Number.isFinite(value)) throw new Error("monotonic_clock_unavailable");
  return value!;
}

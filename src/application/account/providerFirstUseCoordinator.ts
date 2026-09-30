import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";

export type ProviderFirstUseGeneration = Readonly<{ generation: number; uid: string }>;

export type ProviderFirstUseResult<T> = Readonly<
  | { kind: "existing"; value: T }
  | { kind: "provisional" }
  | { kind: "cancelled" }
>;

export type ProviderFirstUseCoordinator<T> = Readonly<{
  run: (generation: ProviderFirstUseGeneration) => Promise<ProviderFirstUseResult<T>>;
  cancel: (generation: ProviderFirstUseGeneration) => Promise<ProviderFirstUseResult<T>>;
}>;

/**
 * Resolves a provider identity through the existing session-exchange boundary.
 * An unmapped Firebase UID remains provisional until explicit registration;
 * this helper never registers accounts or persists session tokens.
 */
export function createProviderFirstUseCoordinator<T>(dependencies: Readonly<{
  exchange: () => Promise<Readonly<{ customToken: string }>>;
  signInWithSessionToken: (customToken: string) => Promise<Readonly<{ uid: string }>>;
  finalize: () => Promise<T>;
  getAuthUid: () => string | null;
  isCurrentGeneration: (generation: ProviderFirstUseGeneration) => boolean;
  isAccountNotFound: (error: unknown) => boolean;
  signOut: () => Promise<void>;
}>): ProviderFirstUseCoordinator<T> {
  let attempt = 0;
  let inFlight: Readonly<{
    attempt: number;
    generation: ProviderFirstUseGeneration;
    promise: Promise<ProviderFirstUseResult<T>>;
  }> | null = null;

  const isCurrent = (generation: ProviderFirstUseGeneration, expectedAttempt: number): boolean =>
    attempt === expectedAttempt
      && dependencies.getAuthUid() === generation.uid
      && dependencies.isCurrentGeneration(generation);

  const run = (generation: ProviderFirstUseGeneration): Promise<ProviderFirstUseResult<T>> => {
    if (inFlight?.generation.uid === generation.uid
      && inFlight.generation.generation === generation.generation
      && inFlight.attempt === attempt) return inFlight.promise;

    const currentAttempt = ++attempt;
    const promise = (async (): Promise<ProviderFirstUseResult<T>> => {
      const assertCurrent = (): void => {
        if (!isCurrent(generation, currentAttempt)) throw new AccountSessionGenerationStaleError();
      };
      assertCurrent();

      let exchanged: Readonly<{ customToken: string }>;
      try {
        exchanged = await dependencies.exchange();
      } catch (error) {
        assertCurrent();
        if (dependencies.isAccountNotFound(error)) return { kind: "provisional" };
        throw error;
      }
      assertCurrent();

      const sessionUser = await dependencies.signInWithSessionToken(exchanged.customToken);
      assertCurrent();
      if (sessionUser.uid !== generation.uid) throw new AccountSessionGenerationStaleError();

      const value = await dependencies.finalize();
      assertCurrent();
      return { kind: "existing", value };
    })();

    inFlight = Object.freeze({ attempt: currentAttempt, generation, promise });
    void promise.finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    }).catch(() => undefined);
    return promise;
  };

  const cancel = async (generation: ProviderFirstUseGeneration): Promise<ProviderFirstUseResult<T>> => {
    if (dependencies.getAuthUid() !== generation.uid || !dependencies.isCurrentGeneration(generation)) {
      throw new AccountSessionGenerationStaleError();
    }
    attempt += 1;
    inFlight = null;
    await dependencies.signOut();
    return { kind: "cancelled" };
  };

  return Object.freeze({ run, cancel });
}

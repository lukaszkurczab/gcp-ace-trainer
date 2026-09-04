export type SimulationResultReadOutcome<Result> =
  | Readonly<{ kind: "ready"; result: Result }>
  | Readonly<{ kind: "error"; error: unknown }>
  | Readonly<{ kind: "stale" }>;

export type SimulationResultReadToken = Readonly<{ generation: number; requestKey: string }>;

/** Owns one keyed result read and invalidates late completions before publication. */
export function createSimulationResultReadOwner<Result>(read: (requestKey: string) => Promise<Result>) {
  let currentGeneration = 0;
  let currentRequestKey: string | null = null;

  function begin(requestKey: string): SimulationResultReadToken {
    currentGeneration += 1;
    currentRequestKey = requestKey;
    return Object.freeze({ generation: currentGeneration, requestKey });
  }

  function isCurrent(token: SimulationResultReadToken): boolean {
    return token.generation === currentGeneration && token.requestKey === currentRequestKey;
  }

  function invalidate(token: SimulationResultReadToken): void {
    if (isCurrent(token)) currentGeneration += 1;
  }

  async function resolve(token: SimulationResultReadToken): Promise<SimulationResultReadOutcome<Result>> {
    if (!isCurrent(token)) return { kind: "stale" };
    try {
      const result = await read(token.requestKey);
      return isCurrent(token) ? { kind: "ready", result } : { kind: "stale" };
    } catch (error) {
      return isCurrent(token) ? { error, kind: "error" } : { kind: "stale" };
    }
  }

  return Object.freeze({ begin, invalidate, isCurrent, resolve });
}

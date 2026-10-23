import { useCallback, useRef, useState } from "react";

export type ScopedReadSnapshot<T, E> =
  | Readonly<{ kind: "loading"; owner: object | null }>
  | Readonly<{ kind: "ready"; owner: object; value: T }>
  | Readonly<{ kind: "unavailable"; owner: object; error: E }>;

/** Retains a committed value only for its exact in-memory owner lease while a refresh runs. */
export function useScopedReadSnapshot<T, E>(input: Readonly<{
  owner: object | null;
  classifyError: (error: unknown) => E;
}>): Readonly<{
  snapshot: ScopedReadSnapshot<T, E>;
  refresh: (read: () => Promise<T>) => Promise<void>;
  invalidate: () => void;
}> {
  const [stored, setStored] = useState<ScopedReadSnapshot<T, E>>({ kind: "loading", owner: input.owner });
  const ownerRef = useRef(input.owner);
  ownerRef.current = input.owner;
  const generationRef = useRef(0);

  const refresh = useCallback(async (read: () => Promise<T>) => {
    const owner = ownerRef.current;
    if (owner === null) return;
    const generation = ++generationRef.current;
    setStored((current) => current.kind === "ready" && current.owner === owner
      ? current
      : { kind: "loading", owner });
    try {
      const value = await read();
      if (generation === generationRef.current && ownerRef.current === owner) setStored({ kind: "ready", owner, value });
    } catch (error) {
      if (generation === generationRef.current && ownerRef.current === owner) {
        setStored({ kind: "unavailable", owner, error: input.classifyError(error) });
      }
    }
  }, [input.classifyError]);

  const invalidate = useCallback(() => { generationRef.current += 1; }, []);
  const snapshot = stored.owner === input.owner ? stored : { kind: "loading" as const, owner: input.owner };
  return { snapshot, refresh, invalidate };
}

export type ExamReadOwnerResumeResult<Projection> =
  | Readonly<{ kind: "ready"; projection: Projection }>
  | Readonly<{ kind: "active_session_conflict"; session: unknown }>;

export type ExamReadOwnerToken = Readonly<{
  generation: number;
  requestKey: string;
}>;

export type ExamReadOwnerOutcome<Projection> =
  | Readonly<{ kind: "ready"; projection: Projection }>
  | Readonly<{ kind: "active_session_conflict"; session: unknown }>
  | Readonly<{ kind: "expired"; sessionId: string }>
  | Readonly<{ kind: "unavailable"; cause: unknown; source: "expected" | "initial" | "start" | "interval" | "after-start" }>
  | Readonly<{ kind: "stale" }>;

type ExamReadOwnerDependencies<Projection> = Readonly<{
  getProjection: () => Promise<Projection>;
  resumeExpected: (expectedSessionId: string) => Promise<ExamReadOwnerResumeResult<Projection>>;
  start: () => Promise<unknown>;
  expiredSessionId: (cause: unknown) => string | null;
}>;

export type ExamReadOwner<Projection> = Readonly<{
  begin: (requestKey: string) => ExamReadOwnerToken;
  invalidate: (token: ExamReadOwnerToken) => void;
  isCurrent: (token: ExamReadOwnerToken) => boolean;
  load: (token: ExamReadOwnerToken, expectedSessionId?: string) => Promise<ExamReadOwnerOutcome<Projection>>;
  refresh: (token: ExamReadOwnerToken, source: "interval" | "initial" | "after-start") => Promise<ExamReadOwnerOutcome<Projection>>;
}>;

/**
 * Owns only the Certification Exam read boundary. Every async branch carries
 * its route generation so old reads cannot publish, navigate, or start a new
 * exam after a route change or unmount.
 */
export function createExamReadOwner<Projection>(dependencies: ExamReadOwnerDependencies<Projection>): ExamReadOwner<Projection> {
  let generation = 0;
  let currentRequestKey = "";
  let refreshSequence = 0;
  let publishedRefreshSequence = 0;

  const begin = (requestKey: string): ExamReadOwnerToken => {
    generation += 1;
    currentRequestKey = requestKey;
    return Object.freeze({ generation, requestKey });
  };

  const isCurrent = (token: ExamReadOwnerToken): boolean =>
    token.generation === generation && token.requestKey === currentRequestKey;

  const invalidate = (token: ExamReadOwnerToken): void => {
    if (!isCurrent(token)) return;
    generation += 1;
  };

  const refresh = async (
    token: ExamReadOwnerToken,
    source: "interval" | "initial" | "after-start",
  ): Promise<ExamReadOwnerOutcome<Projection>> => {
    if (!isCurrent(token)) return { kind: "stale" };
    const currentRefreshSequence = ++refreshSequence;
    try {
      const projection = await dependencies.getProjection();
      if (!isCurrent(token) || currentRefreshSequence <= publishedRefreshSequence) return { kind: "stale" };
      publishedRefreshSequence = currentRefreshSequence;
      return { kind: "ready", projection };
    } catch (cause) {
      if (!isCurrent(token) || currentRefreshSequence <= publishedRefreshSequence) return { kind: "stale" };
      publishedRefreshSequence = currentRefreshSequence;
      const sessionId = dependencies.expiredSessionId(cause);
      return sessionId ? { kind: "expired", sessionId } : { kind: "unavailable", cause, source };
    }
  };

  const load = async (
    token: ExamReadOwnerToken,
    expectedSessionId?: string,
  ): Promise<ExamReadOwnerOutcome<Projection>> => {
    if (!isCurrent(token)) return { kind: "stale" };

    if (expectedSessionId) {
      try {
        const resumed = await dependencies.resumeExpected(expectedSessionId);
        if (!isCurrent(token)) return { kind: "stale" };
        return resumed.kind === "ready"
          ? { kind: "ready", projection: resumed.projection }
          : { kind: "active_session_conflict", session: resumed.session };
      } catch (cause) {
        if (!isCurrent(token)) return { kind: "stale" };
        const sessionId = dependencies.expiredSessionId(cause);
        return sessionId
          ? { kind: "expired", sessionId }
          : { kind: "unavailable", cause, source: "expected" };
      }
    }

    const initial = await refresh(token, "initial");
    if (initial.kind !== "unavailable") return initial;
    if (!isCurrent(token)) return { kind: "stale" };

    try {
      await dependencies.start();
    } catch (cause) {
      return isCurrent(token) ? { kind: "unavailable", cause, source: "start" } : { kind: "stale" };
    }

    if (!isCurrent(token)) return { kind: "stale" };
    const afterStart = await refresh(token, "after-start");
    return afterStart.kind === "unavailable"
      ? { ...afterStart, source: "start" }
      : afterStart;
  };

  return Object.freeze({ begin, invalidate, isCurrent, load, refresh });
}

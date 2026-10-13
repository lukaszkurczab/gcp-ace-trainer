/** The profile router derives the physical key; the native storage owner alone
 * receives the underlying encrypted handle. No capability exposes either. */
export type ForegroundClockScope = Readonly<{
  physicalKey: string;
  profileId: string;
  generation: number;
  isCurrent(): boolean;
}>;
export type ForegroundClockArm = Readonly<{
  expectedRaw: string;
  familyId: string;
  sessionId: string;
  trackId: string;
  countdownMs?: number;
}>;
export type ForegroundClockMetrics = Readonly<{ maxOutstandingMs: number; maxWriteMs: number; checkpointCount: number }>;
export type ForegroundClockCapability = Readonly<{
  read(): string | undefined;
  apply(before: string | undefined, after: string | undefined): string | undefined;
  arm(input: ForegroundClockArm): void;
  enter(): string;
  checkpoint(): string;
  pause(): string;
  quiesce(): string | undefined;
  elapsed(): number;
  metrics(): ForegroundClockMetrics;
  /** Revokes even when its final checkpoint has an uncertain IO result. */
  revoke(): void;
}>;

/** Internal driver contract: the public capability has no bind method, raw
 * storage handle, arbitrary key, token or native object. */
export type BoundForegroundClockDriver = Readonly<{
  read(token: string): string | undefined;
  apply(token: string, before: string | undefined, after: string | undefined): string | undefined;
  arm(token: string, expectedRaw: string, familyId: string, sessionId: string, trackId: string, countdownMs: number | undefined): void;
  enter(token: string): string;
  checkpoint(token: string): string;
  pause(token: string): string;
  quiesce(token: string): string | undefined;
  elapsed(token: string): number;
  metrics(token: string): string;
  revoke(token: string): void;
}>;

export function createForegroundClockCapability(driver: BoundForegroundClockDriver, token: string, scope: ForegroundClockScope): ForegroundClockCapability {
  if (!token || !scope.physicalKey || !scope.profileId || !Number.isSafeInteger(scope.generation) || scope.generation < 0) throw new Error("foreground_clock_grant_invalid");
  let revoked = false;
  const check = () => {
    if (revoked || !scope.isCurrent()) throw new Error("foreground_clock_lease_stale");
  };
  return Object.freeze({
    read() { check(); return driver.read(token); },
    apply(before, after) { check(); return driver.apply(token, before, after); },
    arm(input) { check(); driver.arm(token, input.expectedRaw, input.familyId, input.sessionId, input.trackId, input.countdownMs); },
    enter() { check(); return driver.enter(token); },
    checkpoint() { check(); return driver.checkpoint(token); },
    pause() { check(); return driver.pause(token); },
    quiesce() { check(); return driver.quiesce(token); },
    elapsed() { check(); return driver.elapsed(token); },
    metrics() {
      check();
      let value: unknown;
      try { value = JSON.parse(driver.metrics(token)); }
      catch { throw new Error("foreground_clock_metrics_unavailable"); }
      if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("foreground_clock_metrics_invalid");
      const fields = value as Record<string, unknown>;
      if (Object.keys(fields).length !== 3 || !Number.isSafeInteger(fields.checkpointCount) || Number(fields.checkpointCount) < 0
        || typeof fields.maxOutstandingMs !== "number" || !Number.isFinite(fields.maxOutstandingMs) || fields.maxOutstandingMs < 0
        || typeof fields.maxWriteMs !== "number" || !Number.isFinite(fields.maxWriteMs) || fields.maxWriteMs < 0) throw new Error("foreground_clock_metrics_invalid");
      return Object.freeze({ maxOutstandingMs: fields.maxOutstandingMs, maxWriteMs: fields.maxWriteMs, checkpointCount: Number(fields.checkpointCount) });
    },
    revoke() {
      if (revoked) return;
      // Revoke/drain must remain available after the JS lease was fenced. A
      // failed native ACK still closes this capability; no second clock starts.
      revoked = true;
      driver.revoke(token);
    },
  });
}

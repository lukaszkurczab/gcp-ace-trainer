export type PatternlyRuntimeMode = "sandbox" | "smoke" | "release";

export function parsePatternlyRuntimeMode(mode: unknown): PatternlyRuntimeMode | undefined {
  if (mode === "sandbox" || mode === "smoke" || mode === "release") return mode;
  return undefined;
}

/** The runtime mode is compiled into the bundle; development never implies smoke. */
export function readPatternlyRuntimeMode(environment: NodeJS.ProcessEnv = process.env): PatternlyRuntimeMode | undefined {
  const mode = parsePatternlyRuntimeMode(environment.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE);
  // Production bundles inline only direct `process.env.EXPO_PUBLIC_*` reads, so the
  // indirect read above is empty there. Only the local perf build recovers "smoke".
  if (mode !== undefined || environment !== process.env) return mode;
  return isPatternlyPerfBuild() ? "smoke" : undefined;
}

/**
 * Local Release "perf" build (Plan T0.1): Release JS against the local smoke
 * backend, with the trace written to a file. app.config.js accepts the flag only
 * for local, non-EAS, loopback smoke builds. Direct reads keep it compile-time.
 */
export function isPatternlyPerfBuild(): boolean {
  return process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD === "1"
    && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke";
}

/** Local smoke integrations (local backend, Auth emulator, local App Check) run in development or in the perf build. */
export function isPatternlyLocalSmokeBuild(development: boolean = typeof __DEV__ !== "undefined" && __DEV__): boolean {
  return (development || isPatternlyPerfBuild()) && isPatternlySmokeRuntime();
}

export function isPatternlySmokeRuntime(): boolean {
  return readPatternlyRuntimeMode() === "smoke";
}

/**
 * Email/password verification is skipped only in the explicit local smoke
 * runtime. Every remotely configured, release, missing, or unknown runtime
 * keeps the identity requirement.
 */
export function requiresVerifiedPasswordIdentity(runtimeMode: PatternlyRuntimeMode | undefined): boolean {
  return runtimeMode !== "smoke";
}

/**
 * Sandbox and local development builds may expose controls that simulate an
 * account entitlement. Release builds must always use the account-backed
 * entitlement path instead.
 */
export function isPatternlyPremiumTestingRuntime(): boolean {
  const mode = readPatternlyRuntimeMode();
  return mode === "sandbox" || mode === "smoke";
}

export type PatternlyRuntimeMode = "sandbox" | "smoke" | "release";

export function readPatternlyRuntimeMode(): PatternlyRuntimeMode | undefined {
  const mode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  if (mode === "sandbox" || mode === "smoke" || mode === "release") return mode;
  return typeof __DEV__ !== "undefined" && __DEV__ ? "smoke" : undefined;
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

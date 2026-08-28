export type PatternlyRuntimeMode = "sandbox" | "smoke" | "release";

export function readPatternlyRuntimeMode(): PatternlyRuntimeMode | undefined {
  const mode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  if (mode === "sandbox" || mode === "smoke" || mode === "release") return mode;
  return typeof __DEV__ !== "undefined" && __DEV__ ? "smoke" : undefined;
}

export function isPatternlySmokeRuntime(): boolean {
  return readPatternlyRuntimeMode() === "smoke";
}

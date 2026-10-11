export const PERSIST13_RESET_PAUSE_STAGE = "after_materialization_before_phase_write" as const;

type ResetPauseHook = (stage: typeof PERSIST13_RESET_PAUSE_STAGE) => Promise<never>;
let installed: ResetPauseHook | null = null;

function enabledFixtureRuntime(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__
    && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"
    && (process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed" || process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "recover")
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID ?? "");
}

function enabledSeedFixture(): boolean {
  return enabledFixtureRuntime() && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE === "seed";
}

/** Test-only one-shot pause authority; installation is impossible in the ordinary app. */
export function installPersist13ResetPauseHook(hook: ResetPauseHook): void {
  if (!enabledSeedFixture()) throw new Error("persist13_fixture_disabled");
  if (installed !== null) throw new Error("persist13_hook_already_installed");
  installed = hook;
}

/** Read-only startup assertion for a fixture-only pause hook. */
export function isPersist13ResetPauseHookCold(): boolean {
  return enabledFixtureRuntime() && installed === null;
}

/** Called only after production reset materialization and before its journal phase write. */
export async function pausePersist13ResetAfterMaterialization(operation: string): Promise<void> {
  if (operation !== "reset_learning_state" || !installed) return;
  if (!enabledSeedFixture()) throw new Error("persist13_fixture_disabled");
  const hook = installed;
  installed = null;
  await hook(PERSIST13_RESET_PAUSE_STAGE);
}

import type { BootstrapRecoveryStepObserver } from "../../application/operationalDiagnostics";

export async function prepareLifecycleAfterProfileCompletion<T>(
  completeProfilePreparation: () => Promise<void>,
  prepareLifecycle: () => Promise<T>,
  observeRecoveryStep?: BootstrapRecoveryStepObserver,
): Promise<T> {
  observeRecoveryStep?.("profile_completion");
  await completeProfilePreparation();
  observeRecoveryStep?.("lifecycle_composition");
  const lifecycle = await prepareLifecycle();
  observeRecoveryStep?.(null);
  return lifecycle;
}

import type { BootstrapRecoveryStepObserver } from "../../application/operationalDiagnostics";

export type ProfilePreparationHandoff = Readonly<{ isCurrent(): boolean }>;

export class ProfilePreparationHandoffSupersededError extends Error {
  constructor() {
    super("Profile preparation was superseded before lifecycle composition.");
    this.name = "ProfilePreparationHandoffSupersededError";
  }
}

export async function prepareLifecycleAfterProfileCompletion<T>(
  handoff: ProfilePreparationHandoff | null,
  completeProfilePreparation: (token: ProfilePreparationHandoff) => Promise<void>,
  prepareLifecycle: () => Promise<T>,
  observeRecoveryStep?: BootstrapRecoveryStepObserver,
): Promise<T> {
  if (handoff) {
    if (!handoff.isCurrent()) throw new ProfilePreparationHandoffSupersededError();
    observeRecoveryStep?.("profile_completion");
    await completeProfilePreparation(handoff);
    if (!handoff.isCurrent()) throw new ProfilePreparationHandoffSupersededError();
  }
  observeRecoveryStep?.("lifecycle_composition");
  const lifecycle = await prepareLifecycle();
  observeRecoveryStep?.(null);
  return lifecycle;
}

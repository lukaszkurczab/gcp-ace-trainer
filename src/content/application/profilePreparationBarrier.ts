export async function prepareLifecycleAfterProfileCompletion<T>(
  completeProfilePreparation: () => Promise<void>,
  prepareLifecycle: () => Promise<T>,
): Promise<T> {
  await completeProfilePreparation();
  return prepareLifecycle();
}

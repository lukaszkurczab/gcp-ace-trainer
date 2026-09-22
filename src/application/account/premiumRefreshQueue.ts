/** Serializes provider reads so a response started earlier cannot overwrite a newer result. */
export function createPremiumRefreshQueue() {
  let tail: Promise<void> = Promise.resolve();
  return Object.freeze({
    request<T>(work: () => Promise<T>): Promise<T> {
      const result = tail.then(work, work);
      tail = result.then(() => undefined, () => undefined);
      return result;
    },
  });
}

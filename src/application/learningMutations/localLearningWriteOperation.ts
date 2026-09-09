let localLearningWriteLane: Promise<void> = Promise.resolve();

/** Serializes local learning commits with account materialization in this app process. */
export function withLocalLearningWriteOperation<T>(operation: () => Promise<T>): Promise<T> {
  const previous = localLearningWriteLane;
  const current = previous.then(operation, operation);
  localLearningWriteLane = current.then(() => undefined, () => undefined);
  return current;
}

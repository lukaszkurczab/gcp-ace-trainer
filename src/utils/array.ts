export function shuffleArray<T>(items: readonly T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    const replacement = shuffled[swapIndex];

    if (current !== undefined && replacement !== undefined) {
      shuffled[index] = replacement;
      shuffled[swapIndex] = current;
    }
  }

  return shuffled;
}

export function areOptionSetsEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((optionId) => rightSet.has(optionId));
}

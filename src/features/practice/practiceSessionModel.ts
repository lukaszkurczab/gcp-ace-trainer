export function canCheckAnswer(
  selectedOptionIds: readonly string[],
  isSubmitted: boolean,
): boolean {
  return selectedOptionIds.length > 0 && !isSubmitted;
}

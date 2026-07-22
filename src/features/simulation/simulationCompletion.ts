export function willAnswerEverySimulationOccurrence(
  occurrences: readonly Readonly<{ occurrenceId: string; answered: boolean }>[],
  savedOccurrenceId: string,
): boolean {
  return occurrences.every((occurrence) => occurrence.answered || occurrence.occurrenceId === savedOccurrenceId);
}

/** Stable IDs, never display indices. Reaching the limit preserves prior choices. */
export function toggleExamOption(selected: readonly string[], optionId: string, requiredCount?: number): readonly string[] {
  if (selected.includes(optionId)) return selected.filter((id) => id !== optionId);
  if (requiredCount !== undefined && selected.length >= requiredCount) return selected;
  return [...selected, optionId];
}

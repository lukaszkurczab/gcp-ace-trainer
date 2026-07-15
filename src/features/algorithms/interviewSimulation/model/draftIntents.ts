type ChoiceDraft = Readonly<{ kind: "choice"; selectedOptionIds: readonly string[] }>;
type ComplexityDraft = Readonly<{ kind: "complexity"; selectedValuesByDimension: Readonly<Record<string, string>> }>;
type OrderingDraft = Readonly<{ kind: "ordering"; orderedSubgoalIds: readonly string[] }>;

/** Pure presentation intent composition. It never reads correctness or scoring. */
export function composeChoiceDraft(
  current: ChoiceDraft | null,
  optionId: string,
  multiple: boolean,
): ChoiceDraft {
  const selected = current?.selectedOptionIds ?? [];
  return Object.freeze({
    kind: "choice",
    selectedOptionIds: multiple
      ? (selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId])
      : [optionId],
  });
}

export function composeComplexityDraft(
  current: ComplexityDraft | null,
  dimensionId: "time" | "space",
  value: string,
): ComplexityDraft {
  return Object.freeze({
    kind: "complexity",
    selectedValuesByDimension: Object.freeze({
      ...(current?.selectedValuesByDimension ?? {}),
      [dimensionId]: value,
    }),
  });
}

export function moveOrderingDraft(
  orderedSubgoalIds: readonly string[],
  targetId: string,
  delta: number,
): OrderingDraft {
  const index = orderedSubgoalIds.indexOf(targetId);
  const destination = index + delta;
  if (index < 0 || destination < 0 || destination >= orderedSubgoalIds.length) {
    return Object.freeze({ kind: "ordering", orderedSubgoalIds: [...orderedSubgoalIds] });
  }
  const next = [...orderedSubgoalIds];
  [next[index], next[destination]] = [next[destination]!, next[index]!];
  return Object.freeze({ kind: "ordering", orderedSubgoalIds: next });
}

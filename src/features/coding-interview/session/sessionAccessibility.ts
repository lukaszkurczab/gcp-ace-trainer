export type SessionMetricPresentation = Readonly<{
  accessibilityLabel: string;
  label: string;
}>;

export function orderingMoveAccessibilityLabel(
  elementLabel: string,
  index: number,
  total: number,
  direction: "up" | "down",
): string {
  return `Move ${elementLabel}, position ${index + 1} of ${total}, ${direction}`;
}

export function complexityValueAccessibilityLabel(dimensionLabel: string, value: string): string {
  return `${dimensionLabel}: ${value}`;
}

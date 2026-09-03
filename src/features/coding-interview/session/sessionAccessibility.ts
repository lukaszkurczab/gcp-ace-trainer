export type SessionMetricPresentation = Readonly<{
  accessibilityLabel: string;
  label: string;
}>;

export function orderingMoveAccessibilityLabel(
  elementLabel: string,
  index: number,
  total: number,
  direction: "up" | "down",
  translate: (key: string, values?: Record<string, string | number>) => string,
): string {
  return translate(direction === "up" ? "Move {{element}}, position {{position}} of {{total}}, up" : "Move {{element}}, position {{position}} of {{total}}, down", { element: elementLabel, position: index + 1, total });
}

export function complexityValueAccessibilityLabel(dimensionLabel: string, value: string): string {
  return `${dimensionLabel}: ${value}`;
}

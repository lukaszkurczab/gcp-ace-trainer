export type DesignResponse =
  | Readonly<{ kind: "choice"; selectedOptionIds: readonly string[] }>
  | Readonly<{ kind: "ordering"; orderedElementIds: readonly string[] }>
  | Readonly<{ kind: "decision_matrix"; selectedValueIdsByDimension: Readonly<Record<string, string>> }>;

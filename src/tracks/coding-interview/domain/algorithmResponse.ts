export type AlgorithmResponse =
  | Readonly<{ kind: "choice"; selectedOptionIds: readonly string[] }>
  | Readonly<{ kind: "ordering"; orderedSubgoalIds: readonly string[] }>
  | Readonly<{ kind: "complexity"; selectedValuesByDimension: Readonly<Record<string, string>> }>;

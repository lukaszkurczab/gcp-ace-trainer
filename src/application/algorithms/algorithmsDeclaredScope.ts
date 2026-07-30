import { getBundledContentAvailability } from "../../content/application/validateBundledContent";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import { getAlgorithmSessionNodeById } from "../../tracks/algorithms";
import type { AlgorithmSelectionScope } from "../../tracks/algorithms/algorithmSessionSelection";
import { ALGORITHM_MODE_IDS } from "../../tracks/algorithms/domain";

export type AlgorithmsDeclaredScopeMode =
  | typeof ALGORITHM_MODE_IDS.recognizePatterns
  | typeof ALGORITHM_MODE_IDS.contrastPractice
  | typeof ALGORITHM_MODE_IDS.independentPractice;

export type AlgorithmsDeclaredScopeOption = Readonly<{
  detail: string;
  scope: AlgorithmSelectionScope;
  title: string;
  topicId: string;
}>;

/** Application-owned declared-scope read. Presentation receives choices, never the content catalog. */
export function getAlgorithmsDeclaredScopeOptions(input: Readonly<{
  modeId: AlgorithmsDeclaredScopeMode;
  targetMentalUnitId?: string;
}>): readonly AlgorithmsDeclaredScopeOption[] {
  const availability = getBundledContentAvailability("algorithms");
  if (availability.kind !== "available" || !availability.declaredModes.includes(input.modeId)) {
    throw new Error("Algorithms practice content is unavailable.");
  }
  const catalog = getAlgorithmContentCatalog();
  const option = (
    itemIds: readonly string[],
    scope: AlgorithmSelectionScope,
    detail: string,
  ): AlgorithmsDeclaredScopeOption => {
    const topicIds = [
      ...new Set(
        itemIds.map((itemId) => catalog.getItemById(itemId).taxonomy.roadmapNodeId),
      ),
    ];
    if (topicIds.length !== 1) {
      throw new Error(
        "A declared Algorithms practice scope must belong to exactly one roadmap topic.",
      );
    }
    const topicId = topicIds[0]!;
    return Object.freeze({
      detail,
      scope: Object.freeze(scope),
      title: getAlgorithmSessionNodeById(topicId).label,
      topicId,
    });
  };

  if (input.modeId === ALGORITHM_MODE_IDS.recognizePatterns) {
    return Object.freeze(
      catalog.bank.recognitionSets
        .filter(
          (set) =>
            !input.targetMentalUnitId ||
            [
              ...(set.taxonomyScope.mentalUnitIds ?? []),
              ...(set.taxonomyScope.primaryMentalUnitIds ?? []),
            ].includes(input.targetMentalUnitId),
        )
        .map((set) =>
          option(
            set.itemIds,
            { recognitionSetId: set.setId },
            "Identify the pattern from its declared signals and constraints.",
          ),
        ),
    );
  }

  if (input.modeId === ALGORITHM_MODE_IDS.contrastPractice) {
    const scopes = new Map<string, Set<string>>();
    for (const set of catalog.bank.contrastSets.filter(
      (entry) =>
        !input.targetMentalUnitId ||
        entry.primaryMentalUnitId === input.targetMentalUnitId ||
        entry.contrastedMentalUnitIds.includes(input.targetMentalUnitId),
    )) {
      const topicIds = new Set(
        set.itemIds.map(
          (itemId) => catalog.getItemById(itemId).taxonomy.roadmapNodeId,
        ),
      );
      if (topicIds.size !== 1) {
        throw new Error(
          "A declared Algorithms contrast set must belong to exactly one roadmap topic.",
        );
      }
      const topicId = [...topicIds][0]!;
      const itemIds = scopes.get(topicId) ?? new Set<string>();
      set.itemIds.forEach((itemId) => itemIds.add(itemId));
      scopes.set(topicId, itemIds);
    }
    return Object.freeze(
      [...scopes.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([topicId, itemIds]) =>
          option(
            [...itemIds].sort(),
            { contrastRoadmapNodeId: topicId },
            "Compare the declared decision rules, counterexamples, and transfer boundaries for this topic.",
          ),
        ),
    );
  }

  return Object.freeze(
    catalog.bank.interleavedScopes.map((scope) =>
      option(
        scope.itemIds,
        { interleavedScopeId: scope.scopeId },
        "Practice a mix of skills from this topic without hints or immediate repetition.",
      ),
    ),
  );
}

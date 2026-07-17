import { algorithmTaxonomyStructure } from "./generated/algorithmTaxonomyStructure.generated";

/**
 * Structural taxonomy is generated from patternly-content. This module remains
 * only as the Algorithms runtime's derived lookup surface.
 */
export type AlgorithmMentalUnit = Readonly<{
  id: string;
  primaryPatternFamilyId: string;
  primarySkillAtomId: string;
  roadmapNodeId: string;
  unitKind: "direct" | "strategy" | "contrast";
  legalPatternFamilyIds: readonly string[];
  secondarySkillAtomIds: readonly string[];
  skillAtomIds: readonly string[];
  learningStage: string;
  patternVariantIds: readonly string[];
  problemArchetypeIds: readonly string[];
  contrastedMentalUnitIds?: readonly string[];
}>;

export const ALGORITHM_MENTAL_UNITS: readonly AlgorithmMentalUnit[] = algorithmTaxonomyStructure.mentalUnits.map((unit) => ({
  ...unit,
  contrastedMentalUnitIds:
    "contrastedMentalUnitIds" in unit ? unit.contrastedMentalUnitIds : undefined,
  skillAtomIds: [unit.primarySkillAtomId, ...unit.secondarySkillAtomIds],
}));

export const ALGORITHM_MENTAL_UNIT_BY_ID: ReadonlyMap<string, AlgorithmMentalUnit> = new Map(
  ALGORITHM_MENTAL_UNITS.map((mentalUnit) => [mentalUnit.id, mentalUnit]),
);

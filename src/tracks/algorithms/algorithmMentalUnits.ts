import type { AlgorithmLearningStage, AlgorithmPatternFamilyId } from "./algorithmContentTypes";

/**
 * The learner-facing roadmap is intentionally broader than a diagnostic mental
 * unit. These records are the canonical parent-child links used by published
 * Algorithms content; no relationship is derived from an identifier format.
 */
export type AlgorithmMentalUnit = Readonly<{
  id: string;
  roadmapNodeId: string;
  primaryPatternFamilyId: AlgorithmPatternFamilyId;
  legalPatternFamilyIds: readonly AlgorithmPatternFamilyId[];
  skillAtomIds: readonly string[];
  problemArchetypeIds: readonly string[];
  learningStage: AlgorithmLearningStage;
  contrastedMentalUnitIds?: readonly string[];
}>;

export const ALGORITHM_MENTAL_UNITS = [
  {
    id: "assess_scaling_constraints",
    roadmapNodeId: "complexity_and_constraints",
    primaryPatternFamilyId: "complexity_and_constraints",
    legalPatternFamilyIds: ["complexity_and_constraints"],
    skillAtomIds: ["derive_time_complexity", "derive_space_complexity", "evaluate_time_space_tradeoff"],
    problemArchetypeIds: ["analyze_scaling_limit"],
    learningStage: "foundations",
  },
  {
    id: "reason_about_indexed_scans",
    roadmapNodeId: "arrays_and_strings",
    primaryPatternFamilyId: "arrays_and_strings",
    legalPatternFamilyIds: ["arrays_and_strings"],
    skillAtomIds: ["track_index_boundary", "recognize_adjacent_scan", "diagnose_off_by_one"],
    problemArchetypeIds: ["scan_indexed_sequence"],
    learningStage: "foundations",
  },
  {
    id: "recognize_binary_search_signal",
    roadmapNodeId: "binary_search",
    primaryPatternFamilyId: "binary_search",
    legalPatternFamilyIds: ["binary_search"],
    skillAtomIds: ["recognize_binary_search_signal", "identify_monotonic_predicate", "identify_legal_half_discard_rule"],
    problemArchetypeIds: ["find_index_in_sorted_input"],
    learningStage: "pattern_mechanics",
  },
  {
    id: "boundaries_and_loop_invariants",
    roadmapNodeId: "binary_search",
    primaryPatternFamilyId: "binary_search",
    legalPatternFamilyIds: ["binary_search"],
    skillAtomIds: ["identify_legal_half_discard_rule", "classic_binary_search_discard_rule", "classic_binary_search_found_not_found_contract"],
    problemArchetypeIds: ["find_index_in_sorted_input"],
    learningStage: "pattern_mechanics",
  },
  {
    id: "contrast_binary_search_vs_linear_scan",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    primaryPatternFamilyId: "binary_search",
    legalPatternFamilyIds: ["binary_search", "arrays_and_strings"],
    skillAtomIds: ["identify_monotonic_predicate", "track_index_boundary"],
    problemArchetypeIds: ["find_index_in_sorted_input", "scan_indexed_sequence"],
    learningStage: "contrast_practice",
    contrastedMentalUnitIds: ["recognize_binary_search_signal", "boundaries_and_loop_invariants", "reason_about_indexed_scans"],
  },
] as const satisfies readonly AlgorithmMentalUnit[];

export const ALGORITHM_MENTAL_UNIT_BY_ID: ReadonlyMap<string, AlgorithmMentalUnit> = new Map(
  ALGORITHM_MENTAL_UNITS.map((mentalUnit) => [mentalUnit.id, mentalUnit]),
);

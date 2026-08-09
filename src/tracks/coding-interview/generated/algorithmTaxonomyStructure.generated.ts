/* GENERATED FILE — DO NOT EDIT MANUALLY
 * Source: patternly-content/config/taxonomy/algorithms.json
 */

export const taxonomyVersion = "algorithms-taxonomy-v2" as const;
export const taxonomyFingerprint = "ec4a6874714e907299366412613dd1725a777964855be44d59769824bcccc046" as const;
export const algorithmTaxonomyStructure = {
  "taxonomyVersion": "algorithms-taxonomy-v2",
  "learningStages": [
    "foundations",
    "pattern_mechanics",
    "guided_application",
    "strategy_selection",
    "contrast_practice",
    "independent_attempt",
    "mixed_interview_practice"
  ],
  "roadmapNodes": [
    {
      "id": "complexity_and_constraints",
      "order": 1,
      "contentOwnership": "direct",
      "defaultLearningStage": "foundations",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "complexity_and_constraints"
    },
    {
      "id": "arrays_and_strings",
      "order": 2,
      "contentOwnership": "direct",
      "defaultLearningStage": "foundations",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "arrays_and_strings"
    },
    {
      "id": "hash_map_and_set",
      "order": 3,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "hash_map_and_set"
    },
    {
      "id": "two_pointers",
      "order": 4,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "two_pointers"
    },
    {
      "id": "sliding_window",
      "order": 5,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "sliding_window"
    },
    {
      "id": "prefix_sums",
      "order": 6,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "prefix_sums"
    },
    {
      "id": "sorting_based",
      "order": 7,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "sorting_based"
    },
    {
      "id": "stack",
      "order": 8,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "stack"
    },
    {
      "id": "binary_search",
      "order": 9,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "binary_search"
    },
    {
      "id": "strategy_selection_core",
      "order": 10,
      "contentOwnership": "cross_family",
      "defaultLearningStage": "strategy_selection",
      "prerequisiteNodeIds": [],
      "involvedPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ]
    },
    {
      "id": "contrast_hash_map_vs_sorting",
      "order": 11,
      "contentOwnership": "cross_family",
      "defaultLearningStage": "contrast_practice",
      "prerequisiteNodeIds": [],
      "involvedPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ]
    },
    {
      "id": "contrast_two_pointers_vs_sliding_window",
      "order": 12,
      "contentOwnership": "cross_family",
      "defaultLearningStage": "contrast_practice",
      "prerequisiteNodeIds": [],
      "involvedPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ]
    },
    {
      "id": "contrast_sliding_window_vs_prefix_sums",
      "order": 13,
      "contentOwnership": "cross_family",
      "defaultLearningStage": "contrast_practice",
      "prerequisiteNodeIds": [],
      "involvedPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ]
    },
    {
      "id": "contrast_stack_vs_monotonic_stack_intro",
      "order": 14,
      "contentOwnership": "cross_family",
      "defaultLearningStage": "contrast_practice",
      "prerequisiteNodeIds": [],
      "involvedPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ]
    },
    {
      "id": "contrast_binary_search_vs_linear_scan",
      "order": 15,
      "contentOwnership": "cross_family",
      "defaultLearningStage": "contrast_practice",
      "prerequisiteNodeIds": [],
      "involvedPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ]
    },
    {
      "id": "linked_list",
      "order": 16,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "linked_list"
    },
    {
      "id": "recursion_basics",
      "order": 17,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "recursion_basics"
    },
    {
      "id": "tree_traversal",
      "order": 18,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "tree_traversal"
    },
    {
      "id": "heap_priority_queue",
      "order": 19,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "heap_priority_queue"
    },
    {
      "id": "intervals",
      "order": 20,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "intervals"
    },
    {
      "id": "backtracking",
      "order": 21,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "backtracking"
    },
    {
      "id": "graph_traversal",
      "order": 22,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "graph_traversal"
    },
    {
      "id": "greedy_intro",
      "order": 23,
      "contentOwnership": "direct",
      "defaultLearningStage": "strategy_selection",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "greedy_intro"
    },
    {
      "id": "dynamic_programming_intro",
      "order": 24,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "dynamic_programming_intro"
    },
    {
      "id": "bit_manipulation",
      "order": 25,
      "contentOwnership": "direct",
      "defaultLearningStage": "pattern_mechanics",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "bit_manipulation"
    },
    {
      "id": "math_and_geometry",
      "order": 26,
      "contentOwnership": "direct",
      "defaultLearningStage": "foundations",
      "prerequisiteNodeIds": [],
      "primaryPatternFamilyId": "math_and_geometry"
    }
  ],
  "mentalUnits": [
    {
      "id": "assess_scaling_constraints",
      "primarySkillAtomId": "translate_constraints_to_operation_budget",
      "roadmapNodeId": "complexity_and_constraints",
      "unitKind": "direct",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [],
      "problemArchetypeIds": [
        "analyze_scaling_limit",
        "compare_solution_costs",
        "repeated_query_cost_model",
        "output_sensitive_analysis"
      ]
    },
    {
      "id": "reject_infeasible_bruteforce",
      "primarySkillAtomId": "reject_infeasible_complexity",
      "roadmapNodeId": "complexity_and_constraints",
      "unitKind": "direct",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [],
      "problemArchetypeIds": [
        "analyze_scaling_limit",
        "compare_solution_costs",
        "repeated_query_cost_model",
        "output_sensitive_analysis"
      ]
    },
    {
      "id": "derive_time_complexity",
      "primarySkillAtomId": "derive_time_complexity",
      "roadmapNodeId": "complexity_and_constraints",
      "unitKind": "direct",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [],
      "problemArchetypeIds": [
        "analyze_scaling_limit",
        "compare_solution_costs",
        "repeated_query_cost_model",
        "output_sensitive_analysis"
      ]
    },
    {
      "id": "derive_space_complexity",
      "primarySkillAtomId": "derive_space_complexity",
      "roadmapNodeId": "complexity_and_constraints",
      "unitKind": "direct",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [],
      "problemArchetypeIds": [
        "analyze_scaling_limit",
        "compare_solution_costs",
        "repeated_query_cost_model",
        "output_sensitive_analysis"
      ]
    },
    {
      "id": "amortized_complexity",
      "primarySkillAtomId": "distinguish_amortized_from_worst_case",
      "roadmapNodeId": "complexity_and_constraints",
      "unitKind": "direct",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [],
      "problemArchetypeIds": [
        "analyze_scaling_limit",
        "compare_solution_costs",
        "repeated_query_cost_model",
        "output_sensitive_analysis"
      ]
    },
    {
      "id": "preprocessing_and_query_tradeoffs",
      "primarySkillAtomId": "compare_preprocessing_and_query_cost",
      "roadmapNodeId": "complexity_and_constraints",
      "unitKind": "direct",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [],
      "problemArchetypeIds": [
        "analyze_scaling_limit",
        "compare_solution_costs",
        "repeated_query_cost_model",
        "output_sensitive_analysis"
      ]
    },
    {
      "id": "output_sensitive_and_lower_bounds",
      "primarySkillAtomId": "recognize_output_sensitive_lower_bound",
      "roadmapNodeId": "complexity_and_constraints",
      "unitKind": "direct",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [],
      "problemArchetypeIds": [
        "analyze_scaling_limit",
        "compare_solution_costs",
        "repeated_query_cost_model",
        "output_sensitive_analysis"
      ]
    },
    {
      "id": "complexity_explanation_and_mistake_review",
      "primarySkillAtomId": "explain_complexity_from_executed_operations",
      "roadmapNodeId": "complexity_and_constraints",
      "unitKind": "direct",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [],
      "problemArchetypeIds": [
        "analyze_scaling_limit",
        "compare_solution_costs",
        "repeated_query_cost_model",
        "output_sensitive_analysis"
      ]
    },
    {
      "id": "reason_about_indexed_scans",
      "primarySkillAtomId": "track_index_boundary",
      "roadmapNodeId": "arrays_and_strings",
      "unitKind": "direct",
      "primaryPatternFamilyId": "arrays_and_strings",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "linear_scan",
        "adjacent_scan",
        "frequency_table",
        "stable_compaction",
        "in_place_duplicate_collapse"
      ],
      "problemArchetypeIds": [
        "scan_indexed_sequence",
        "normalize_and_compare_sequences",
        "remove_or_compact_in_place",
        "count_or_group_values"
      ]
    },
    {
      "id": "frequency_and_seen_state",
      "primarySkillAtomId": "choose_frequency_state",
      "roadmapNodeId": "arrays_and_strings",
      "unitKind": "direct",
      "primaryPatternFamilyId": "arrays_and_strings",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "linear_scan",
        "adjacent_scan",
        "frequency_table",
        "stable_compaction",
        "in_place_duplicate_collapse"
      ],
      "problemArchetypeIds": [
        "scan_indexed_sequence",
        "normalize_and_compare_sequences",
        "remove_or_compact_in_place",
        "count_or_group_values"
      ]
    },
    {
      "id": "normalization_and_comparison",
      "primarySkillAtomId": "apply_sequence_normalization",
      "roadmapNodeId": "arrays_and_strings",
      "unitKind": "direct",
      "primaryPatternFamilyId": "arrays_and_strings",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "linear_scan",
        "adjacent_scan",
        "frequency_table",
        "stable_compaction",
        "in_place_duplicate_collapse"
      ],
      "problemArchetypeIds": [
        "scan_indexed_sequence",
        "normalize_and_compare_sequences",
        "remove_or_compact_in_place",
        "count_or_group_values"
      ]
    },
    {
      "id": "stable_in_place_compaction",
      "primarySkillAtomId": "maintain_read_write_boundary",
      "roadmapNodeId": "arrays_and_strings",
      "unitKind": "direct",
      "primaryPatternFamilyId": "arrays_and_strings",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "linear_scan",
        "adjacent_scan",
        "frequency_table",
        "stable_compaction",
        "in_place_duplicate_collapse"
      ],
      "problemArchetypeIds": [
        "scan_indexed_sequence",
        "normalize_and_compare_sequences",
        "remove_or_compact_in_place",
        "count_or_group_values"
      ]
    },
    {
      "id": "duplicate_handling",
      "primarySkillAtomId": "preserve_duplicate_contract",
      "roadmapNodeId": "arrays_and_strings",
      "unitKind": "direct",
      "primaryPatternFamilyId": "arrays_and_strings",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "linear_scan",
        "adjacent_scan",
        "frequency_table",
        "stable_compaction",
        "in_place_duplicate_collapse"
      ],
      "problemArchetypeIds": [
        "scan_indexed_sequence",
        "normalize_and_compare_sequences",
        "remove_or_compact_in_place",
        "count_or_group_values"
      ]
    },
    {
      "id": "sequence_shape_and_edge_cases",
      "primarySkillAtomId": "diagnose_sequence_shape_edge_case",
      "roadmapNodeId": "arrays_and_strings",
      "unitKind": "direct",
      "primaryPatternFamilyId": "arrays_and_strings",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "linear_scan",
        "adjacent_scan",
        "frequency_table",
        "stable_compaction",
        "in_place_duplicate_collapse"
      ],
      "problemArchetypeIds": [
        "scan_indexed_sequence",
        "normalize_and_compare_sequences",
        "remove_or_compact_in_place",
        "count_or_group_values"
      ]
    },
    {
      "id": "output_contract_and_space",
      "primarySkillAtomId": "distinguish_output_from_auxiliary_space",
      "roadmapNodeId": "arrays_and_strings",
      "unitKind": "direct",
      "primaryPatternFamilyId": "arrays_and_strings",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "linear_scan",
        "adjacent_scan",
        "frequency_table",
        "stable_compaction",
        "in_place_duplicate_collapse"
      ],
      "problemArchetypeIds": [
        "scan_indexed_sequence",
        "normalize_and_compare_sequences",
        "remove_or_compact_in_place",
        "count_or_group_values"
      ]
    },
    {
      "id": "recognize_hash_lookup_signal",
      "primarySkillAtomId": "identify_lookup_state_signal",
      "roadmapNodeId": "hash_map_and_set",
      "unitKind": "direct",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "lookup_by_value",
        "complement_lookup",
        "seen_set",
        "frequency_map",
        "grouping_map"
      ],
      "problemArchetypeIds": [
        "find_pair_with_condition",
        "detect_duplicate_or_membership",
        "group_or_count_values",
        "preserve_original_index"
      ]
    },
    {
      "id": "choose_set_vs_map_state",
      "primarySkillAtomId": "distinguish_set_from_map_state",
      "roadmapNodeId": "hash_map_and_set",
      "unitKind": "direct",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "lookup_by_value",
        "complement_lookup",
        "seen_set",
        "frequency_map",
        "grouping_map"
      ],
      "problemArchetypeIds": [
        "find_pair_with_condition",
        "detect_duplicate_or_membership",
        "group_or_count_values",
        "preserve_original_index"
      ]
    },
    {
      "id": "complement_lookup",
      "primarySkillAtomId": "derive_complement_lookup",
      "roadmapNodeId": "hash_map_and_set",
      "unitKind": "direct",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "lookup_by_value",
        "complement_lookup",
        "seen_set",
        "frequency_map",
        "grouping_map"
      ],
      "problemArchetypeIds": [
        "find_pair_with_condition",
        "detect_duplicate_or_membership",
        "group_or_count_values",
        "preserve_original_index"
      ]
    },
    {
      "id": "frequency_counting",
      "primarySkillAtomId": "maintain_frequency_map",
      "roadmapNodeId": "hash_map_and_set",
      "unitKind": "direct",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "lookup_by_value",
        "complement_lookup",
        "seen_set",
        "frequency_map",
        "grouping_map"
      ],
      "problemArchetypeIds": [
        "find_pair_with_condition",
        "detect_duplicate_or_membership",
        "group_or_count_values",
        "preserve_original_index"
      ]
    },
    {
      "id": "grouping_and_bucket_state",
      "primarySkillAtomId": "choose_grouping_key",
      "roadmapNodeId": "hash_map_and_set",
      "unitKind": "direct",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "lookup_by_value",
        "complement_lookup",
        "seen_set",
        "frequency_map",
        "grouping_map"
      ],
      "problemArchetypeIds": [
        "find_pair_with_condition",
        "detect_duplicate_or_membership",
        "group_or_count_values",
        "preserve_original_index"
      ]
    },
    {
      "id": "preserve_indices_and_provenance",
      "primarySkillAtomId": "preserve_original_index_in_lookup_state",
      "roadmapNodeId": "hash_map_and_set",
      "unitKind": "direct",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "lookup_by_value",
        "complement_lookup",
        "seen_set",
        "frequency_map",
        "grouping_map"
      ],
      "problemArchetypeIds": [
        "find_pair_with_condition",
        "detect_duplicate_or_membership",
        "group_or_count_values",
        "preserve_original_index"
      ]
    },
    {
      "id": "expected_complexity_and_hash_assumptions",
      "primarySkillAtomId": "explain_expected_hash_lookup_complexity",
      "roadmapNodeId": "hash_map_and_set",
      "unitKind": "direct",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "lookup_by_value",
        "complement_lookup",
        "seen_set",
        "frequency_map",
        "grouping_map"
      ],
      "problemArchetypeIds": [
        "find_pair_with_condition",
        "detect_duplicate_or_membership",
        "group_or_count_values",
        "preserve_original_index"
      ]
    },
    {
      "id": "hash_state_mistake_review",
      "primarySkillAtomId": "diagnose_hash_state_mismatch",
      "roadmapNodeId": "hash_map_and_set",
      "unitKind": "direct",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "lookup_by_value",
        "complement_lookup",
        "seen_set",
        "frequency_map",
        "grouping_map"
      ],
      "problemArchetypeIds": [
        "find_pair_with_condition",
        "detect_duplicate_or_membership",
        "group_or_count_values",
        "preserve_original_index"
      ]
    },
    {
      "id": "recognize_two_pointer_signal",
      "primarySkillAtomId": "identify_coordinated_boundary_signal",
      "roadmapNodeId": "two_pointers",
      "unitKind": "direct",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "opposite_ends",
        "same_direction_read_write",
        "partition_scan",
        "duplicate_skip"
      ],
      "problemArchetypeIds": [
        "find_pair_in_sorted_input",
        "compact_sequence_in_place",
        "partition_sequence",
        "compare_from_both_ends"
      ]
    },
    {
      "id": "opposite_ends_pair_search",
      "primarySkillAtomId": "move_decisive_pointer",
      "roadmapNodeId": "two_pointers",
      "unitKind": "direct",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "opposite_ends",
        "same_direction_read_write",
        "partition_scan",
        "duplicate_skip"
      ],
      "problemArchetypeIds": [
        "find_pair_in_sorted_input",
        "compact_sequence_in_place",
        "partition_sequence",
        "compare_from_both_ends"
      ]
    },
    {
      "id": "same_direction_read_write",
      "primarySkillAtomId": "maintain_read_write_pointer_invariant",
      "roadmapNodeId": "two_pointers",
      "unitKind": "direct",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "opposite_ends",
        "same_direction_read_write",
        "partition_scan",
        "duplicate_skip"
      ],
      "problemArchetypeIds": [
        "find_pair_in_sorted_input",
        "compact_sequence_in_place",
        "partition_sequence",
        "compare_from_both_ends"
      ]
    },
    {
      "id": "converging_boundaries_and_proof",
      "primarySkillAtomId": "justify_candidate_elimination_by_pointer_move",
      "roadmapNodeId": "two_pointers",
      "unitKind": "direct",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "opposite_ends",
        "same_direction_read_write",
        "partition_scan",
        "duplicate_skip"
      ],
      "problemArchetypeIds": [
        "find_pair_in_sorted_input",
        "compact_sequence_in_place",
        "partition_sequence",
        "compare_from_both_ends"
      ]
    },
    {
      "id": "duplicate_skipping",
      "primarySkillAtomId": "skip_duplicates_without_losing_solutions",
      "roadmapNodeId": "two_pointers",
      "unitKind": "direct",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "opposite_ends",
        "same_direction_read_write",
        "partition_scan",
        "duplicate_skip"
      ],
      "problemArchetypeIds": [
        "find_pair_in_sorted_input",
        "compact_sequence_in_place",
        "partition_sequence",
        "compare_from_both_ends"
      ]
    },
    {
      "id": "partitioning_by_predicate",
      "primarySkillAtomId": "partition_sequence_with_pointers",
      "roadmapNodeId": "two_pointers",
      "unitKind": "direct",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "opposite_ends",
        "same_direction_read_write",
        "partition_scan",
        "duplicate_skip"
      ],
      "problemArchetypeIds": [
        "find_pair_in_sorted_input",
        "compact_sequence_in_place",
        "partition_sequence",
        "compare_from_both_ends"
      ]
    },
    {
      "id": "sorted_input_precondition",
      "primarySkillAtomId": "validate_sorted_input_dependency",
      "roadmapNodeId": "two_pointers",
      "unitKind": "direct",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "opposite_ends",
        "same_direction_read_write",
        "partition_scan",
        "duplicate_skip"
      ],
      "problemArchetypeIds": [
        "find_pair_in_sorted_input",
        "compact_sequence_in_place",
        "partition_sequence",
        "compare_from_both_ends"
      ]
    },
    {
      "id": "pointer_movement_mistake_review",
      "primarySkillAtomId": "diagnose_invalid_pointer_movement",
      "roadmapNodeId": "two_pointers",
      "unitKind": "direct",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "opposite_ends",
        "same_direction_read_write",
        "partition_scan",
        "duplicate_skip"
      ],
      "problemArchetypeIds": [
        "find_pair_in_sorted_input",
        "compact_sequence_in_place",
        "partition_sequence",
        "compare_from_both_ends"
      ]
    },
    {
      "id": "recognize_sliding_window_signal",
      "primarySkillAtomId": "identify_contiguous_window_signal",
      "roadmapNodeId": "sliding_window",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "fixed_size_window",
        "variable_size_positive_numbers",
        "frequency_constraint",
        "at_most_k_window"
      ],
      "problemArchetypeIds": [
        "contiguous_range_optimum",
        "longest_valid_window",
        "shortest_threshold_window",
        "fixed_length_aggregate"
      ]
    },
    {
      "id": "fixed_size_window",
      "primarySkillAtomId": "maintain_fixed_size_window_state",
      "roadmapNodeId": "sliding_window",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "fixed_size_window",
        "variable_size_positive_numbers",
        "frequency_constraint",
        "at_most_k_window"
      ],
      "problemArchetypeIds": [
        "contiguous_range_optimum",
        "longest_valid_window",
        "shortest_threshold_window",
        "fixed_length_aggregate"
      ]
    },
    {
      "id": "variable_size_monotonic_window",
      "primarySkillAtomId": "maintain_monotonic_shrink_rule",
      "roadmapNodeId": "sliding_window",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "fixed_size_window",
        "variable_size_positive_numbers",
        "frequency_constraint",
        "at_most_k_window"
      ],
      "problemArchetypeIds": [
        "contiguous_range_optimum",
        "longest_valid_window",
        "shortest_threshold_window",
        "fixed_length_aggregate"
      ]
    },
    {
      "id": "frequency_constrained_window",
      "primarySkillAtomId": "maintain_frequency_constrained_window",
      "roadmapNodeId": "sliding_window",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "fixed_size_window",
        "variable_size_positive_numbers",
        "frequency_constraint",
        "at_most_k_window"
      ],
      "problemArchetypeIds": [
        "contiguous_range_optimum",
        "longest_valid_window",
        "shortest_threshold_window",
        "fixed_length_aggregate"
      ]
    },
    {
      "id": "expand_shrink_update_order",
      "primarySkillAtomId": "order_window_state_updates",
      "roadmapNodeId": "sliding_window",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "fixed_size_window",
        "variable_size_positive_numbers",
        "frequency_constraint",
        "at_most_k_window"
      ],
      "problemArchetypeIds": [
        "contiguous_range_optimum",
        "longest_valid_window",
        "shortest_threshold_window",
        "fixed_length_aggregate"
      ]
    },
    {
      "id": "answer_update_and_boundaries",
      "primarySkillAtomId": "update_window_answer_at_legal_state",
      "roadmapNodeId": "sliding_window",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "fixed_size_window",
        "variable_size_positive_numbers",
        "frequency_constraint",
        "at_most_k_window"
      ],
      "problemArchetypeIds": [
        "contiguous_range_optimum",
        "longest_valid_window",
        "shortest_threshold_window",
        "fixed_length_aggregate"
      ]
    },
    {
      "id": "invalid_window_signals",
      "primarySkillAtomId": "detect_simple_window_failure_signal",
      "roadmapNodeId": "sliding_window",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "fixed_size_window",
        "variable_size_positive_numbers",
        "frequency_constraint",
        "at_most_k_window"
      ],
      "problemArchetypeIds": [
        "contiguous_range_optimum",
        "longest_valid_window",
        "shortest_threshold_window",
        "fixed_length_aggregate"
      ]
    },
    {
      "id": "window_complexity_and_mistake_review",
      "primarySkillAtomId": "explain_linear_window_complexity",
      "roadmapNodeId": "sliding_window",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "fixed_size_window",
        "variable_size_positive_numbers",
        "frequency_constraint",
        "at_most_k_window"
      ],
      "problemArchetypeIds": [
        "contiguous_range_optimum",
        "longest_valid_window",
        "shortest_threshold_window",
        "fixed_length_aggregate"
      ]
    },
    {
      "id": "recognize_prefix_accumulation_signal",
      "primarySkillAtomId": "identify_reusable_prefix_state",
      "roadmapNodeId": "prefix_sums",
      "unitKind": "direct",
      "primaryPatternFamilyId": "prefix_sums",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "one_dimensional_prefix",
        "range_sum_query",
        "prefix_hash_frequency",
        "difference_array",
        "two_dimensional_prefix"
      ],
      "problemArchetypeIds": [
        "range_query",
        "count_subarrays_by_prefix",
        "batch_range_updates",
        "matrix_region_sum"
      ]
    },
    {
      "id": "build_one_dimensional_prefix",
      "primarySkillAtomId": "construct_prefix_accumulation",
      "roadmapNodeId": "prefix_sums",
      "unitKind": "direct",
      "primaryPatternFamilyId": "prefix_sums",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "one_dimensional_prefix",
        "range_sum_query",
        "prefix_hash_frequency",
        "difference_array",
        "two_dimensional_prefix"
      ],
      "problemArchetypeIds": [
        "range_query",
        "count_subarrays_by_prefix",
        "batch_range_updates",
        "matrix_region_sum"
      ]
    },
    {
      "id": "answer_range_queries",
      "primarySkillAtomId": "derive_range_from_prefix_difference",
      "roadmapNodeId": "prefix_sums",
      "unitKind": "direct",
      "primaryPatternFamilyId": "prefix_sums",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "one_dimensional_prefix",
        "range_sum_query",
        "prefix_hash_frequency",
        "difference_array",
        "two_dimensional_prefix"
      ],
      "problemArchetypeIds": [
        "range_query",
        "count_subarrays_by_prefix",
        "batch_range_updates",
        "matrix_region_sum"
      ]
    },
    {
      "id": "prefix_sum_with_hash_state",
      "primarySkillAtomId": "match_required_prior_prefix",
      "roadmapNodeId": "prefix_sums",
      "unitKind": "direct",
      "primaryPatternFamilyId": "prefix_sums",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "one_dimensional_prefix",
        "range_sum_query",
        "prefix_hash_frequency",
        "difference_array",
        "two_dimensional_prefix"
      ],
      "problemArchetypeIds": [
        "range_query",
        "count_subarrays_by_prefix",
        "batch_range_updates",
        "matrix_region_sum"
      ]
    },
    {
      "id": "difference_array_updates",
      "primarySkillAtomId": "encode_range_updates_by_differences",
      "roadmapNodeId": "prefix_sums",
      "unitKind": "direct",
      "primaryPatternFamilyId": "prefix_sums",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "one_dimensional_prefix",
        "range_sum_query",
        "prefix_hash_frequency",
        "difference_array",
        "two_dimensional_prefix"
      ],
      "problemArchetypeIds": [
        "range_query",
        "count_subarrays_by_prefix",
        "batch_range_updates",
        "matrix_region_sum"
      ]
    },
    {
      "id": "two_dimensional_prefix",
      "primarySkillAtomId": "derive_matrix_region_from_prefixes",
      "roadmapNodeId": "prefix_sums",
      "unitKind": "direct",
      "primaryPatternFamilyId": "prefix_sums",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "one_dimensional_prefix",
        "range_sum_query",
        "prefix_hash_frequency",
        "difference_array",
        "two_dimensional_prefix"
      ],
      "problemArchetypeIds": [
        "range_query",
        "count_subarrays_by_prefix",
        "batch_range_updates",
        "matrix_region_sum"
      ]
    },
    {
      "id": "prefix_index_conventions",
      "primarySkillAtomId": "maintain_prefix_boundary_convention",
      "roadmapNodeId": "prefix_sums",
      "unitKind": "direct",
      "primaryPatternFamilyId": "prefix_sums",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "one_dimensional_prefix",
        "range_sum_query",
        "prefix_hash_frequency",
        "difference_array",
        "two_dimensional_prefix"
      ],
      "problemArchetypeIds": [
        "range_query",
        "count_subarrays_by_prefix",
        "batch_range_updates",
        "matrix_region_sum"
      ]
    },
    {
      "id": "prefix_vs_window_tradeoff",
      "primarySkillAtomId": "choose_prefix_over_moving_window",
      "roadmapNodeId": "prefix_sums",
      "unitKind": "direct",
      "primaryPatternFamilyId": "prefix_sums",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "one_dimensional_prefix",
        "range_sum_query",
        "prefix_hash_frequency",
        "difference_array",
        "two_dimensional_prefix"
      ],
      "problemArchetypeIds": [
        "range_query",
        "count_subarrays_by_prefix",
        "batch_range_updates",
        "matrix_region_sum"
      ]
    },
    {
      "id": "recognize_sorting_as_preprocessing",
      "primarySkillAtomId": "identify_structure_revealed_by_sorting",
      "roadmapNodeId": "sorting_based",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sorting_based",
      "legalPatternFamilyIds": [
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "sort_then_scan",
        "sort_then_two_pointers",
        "grouping_after_sort",
        "custom_key_sort"
      ],
      "problemArchetypeIds": [
        "reveal_ordered_structure",
        "group_equal_values",
        "pair_search_after_sort",
        "process_by_priority_key"
      ]
    },
    {
      "id": "sort_then_scan",
      "primarySkillAtomId": "exploit_adjacent_order_after_sort",
      "roadmapNodeId": "sorting_based",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sorting_based",
      "legalPatternFamilyIds": [
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "sort_then_scan",
        "sort_then_two_pointers",
        "grouping_after_sort",
        "custom_key_sort"
      ],
      "problemArchetypeIds": [
        "reveal_ordered_structure",
        "group_equal_values",
        "pair_search_after_sort",
        "process_by_priority_key"
      ]
    },
    {
      "id": "sort_then_two_pointers",
      "primarySkillAtomId": "combine_sorting_with_pointer_search",
      "roadmapNodeId": "sorting_based",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sorting_based",
      "legalPatternFamilyIds": [
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "sort_then_scan",
        "sort_then_two_pointers",
        "grouping_after_sort",
        "custom_key_sort"
      ],
      "problemArchetypeIds": [
        "reveal_ordered_structure",
        "group_equal_values",
        "pair_search_after_sort",
        "process_by_priority_key"
      ]
    },
    {
      "id": "group_equal_values_after_sort",
      "primarySkillAtomId": "process_equal_value_runs",
      "roadmapNodeId": "sorting_based",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sorting_based",
      "legalPatternFamilyIds": [
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "sort_then_scan",
        "sort_then_two_pointers",
        "grouping_after_sort",
        "custom_key_sort"
      ],
      "problemArchetypeIds": [
        "reveal_ordered_structure",
        "group_equal_values",
        "pair_search_after_sort",
        "process_by_priority_key"
      ]
    },
    {
      "id": "custom_key_and_tie_breaking",
      "primarySkillAtomId": "define_total_sort_order",
      "roadmapNodeId": "sorting_based",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sorting_based",
      "legalPatternFamilyIds": [
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "sort_then_scan",
        "sort_then_two_pointers",
        "grouping_after_sort",
        "custom_key_sort"
      ],
      "problemArchetypeIds": [
        "reveal_ordered_structure",
        "group_equal_values",
        "pair_search_after_sort",
        "process_by_priority_key"
      ]
    },
    {
      "id": "preserve_original_positions",
      "primarySkillAtomId": "preserve_original_identity_through_sorting",
      "roadmapNodeId": "sorting_based",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sorting_based",
      "legalPatternFamilyIds": [
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "sort_then_scan",
        "sort_then_two_pointers",
        "grouping_after_sort",
        "custom_key_sort"
      ],
      "problemArchetypeIds": [
        "reveal_ordered_structure",
        "group_equal_values",
        "pair_search_after_sort",
        "process_by_priority_key"
      ]
    },
    {
      "id": "sorting_cost_and_side_effects",
      "primarySkillAtomId": "account_for_sorting_cost_and_mutation",
      "roadmapNodeId": "sorting_based",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sorting_based",
      "legalPatternFamilyIds": [
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "sort_then_scan",
        "sort_then_two_pointers",
        "grouping_after_sort",
        "custom_key_sort"
      ],
      "problemArchetypeIds": [
        "reveal_ordered_structure",
        "group_equal_values",
        "pair_search_after_sort",
        "process_by_priority_key"
      ]
    },
    {
      "id": "sorting_based_mistake_review",
      "primarySkillAtomId": "diagnose_invalid_sorting_assumption",
      "roadmapNodeId": "sorting_based",
      "unitKind": "direct",
      "primaryPatternFamilyId": "sorting_based",
      "legalPatternFamilyIds": [
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "sort_then_scan",
        "sort_then_two_pointers",
        "grouping_after_sort",
        "custom_key_sort"
      ],
      "problemArchetypeIds": [
        "reveal_ordered_structure",
        "group_equal_values",
        "pair_search_after_sort",
        "process_by_priority_key"
      ]
    },
    {
      "id": "recognize_lifo_signal",
      "primarySkillAtomId": "identify_last_unresolved_state",
      "roadmapNodeId": "stack",
      "unitKind": "direct",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "nested_structure_validation",
        "undo_or_previous_state",
        "monotonic_increasing_stack",
        "monotonic_decreasing_stack",
        "next_greater_smaller"
      ],
      "problemArchetypeIds": [
        "validate_nested_structure",
        "nearest_greater_or_smaller",
        "deferred_resolution",
        "undo_previous_state"
      ]
    },
    {
      "id": "push_pop_top_mechanics",
      "primarySkillAtomId": "trace_stack_operation",
      "roadmapNodeId": "stack",
      "unitKind": "direct",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "nested_structure_validation",
        "undo_or_previous_state",
        "monotonic_increasing_stack",
        "monotonic_decreasing_stack",
        "next_greater_smaller"
      ],
      "problemArchetypeIds": [
        "validate_nested_structure",
        "nearest_greater_or_smaller",
        "deferred_resolution",
        "undo_previous_state"
      ]
    },
    {
      "id": "nested_structure_validation",
      "primarySkillAtomId": "match_nested_structure_with_stack",
      "roadmapNodeId": "stack",
      "unitKind": "direct",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "nested_structure_validation",
        "undo_or_previous_state",
        "monotonic_increasing_stack",
        "monotonic_decreasing_stack",
        "next_greater_smaller"
      ],
      "problemArchetypeIds": [
        "validate_nested_structure",
        "nearest_greater_or_smaller",
        "deferred_resolution",
        "undo_previous_state"
      ]
    },
    {
      "id": "undo_and_previous_state",
      "primarySkillAtomId": "restore_previous_state_from_stack",
      "roadmapNodeId": "stack",
      "unitKind": "direct",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "nested_structure_validation",
        "undo_or_previous_state",
        "monotonic_increasing_stack",
        "monotonic_decreasing_stack",
        "next_greater_smaller"
      ],
      "problemArchetypeIds": [
        "validate_nested_structure",
        "nearest_greater_or_smaller",
        "deferred_resolution",
        "undo_previous_state"
      ]
    },
    {
      "id": "recognize_monotonic_stack_signal",
      "primarySkillAtomId": "identify_dominated_candidate_signal",
      "roadmapNodeId": "stack",
      "unitKind": "direct",
      "primaryPatternFamilyId": "monotonic_stack",
      "legalPatternFamilyIds": [
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "nested_structure_validation",
        "undo_or_previous_state",
        "monotonic_increasing_stack",
        "monotonic_decreasing_stack",
        "next_greater_smaller"
      ],
      "problemArchetypeIds": [
        "validate_nested_structure",
        "nearest_greater_or_smaller",
        "deferred_resolution",
        "undo_previous_state"
      ]
    },
    {
      "id": "maintain_monotonic_stack_invariant",
      "primarySkillAtomId": "maintain_monotonic_stack_order",
      "roadmapNodeId": "stack",
      "unitKind": "direct",
      "primaryPatternFamilyId": "monotonic_stack",
      "legalPatternFamilyIds": [
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "nested_structure_validation",
        "undo_or_previous_state",
        "monotonic_increasing_stack",
        "monotonic_decreasing_stack",
        "next_greater_smaller"
      ],
      "problemArchetypeIds": [
        "validate_nested_structure",
        "nearest_greater_or_smaller",
        "deferred_resolution",
        "undo_previous_state"
      ]
    },
    {
      "id": "next_greater_smaller_boundaries",
      "primarySkillAtomId": "resolve_nearest_greater_or_smaller",
      "roadmapNodeId": "stack",
      "unitKind": "direct",
      "primaryPatternFamilyId": "monotonic_stack",
      "legalPatternFamilyIds": [
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "nested_structure_validation",
        "undo_or_previous_state",
        "monotonic_increasing_stack",
        "monotonic_decreasing_stack",
        "next_greater_smaller"
      ],
      "problemArchetypeIds": [
        "validate_nested_structure",
        "nearest_greater_or_smaller",
        "deferred_resolution",
        "undo_previous_state"
      ]
    },
    {
      "id": "stack_complexity_and_mistake_review",
      "primarySkillAtomId": "explain_amortized_stack_processing",
      "roadmapNodeId": "stack",
      "unitKind": "direct",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "nested_structure_validation",
        "undo_or_previous_state",
        "monotonic_increasing_stack",
        "monotonic_decreasing_stack",
        "next_greater_smaller"
      ],
      "problemArchetypeIds": [
        "validate_nested_structure",
        "nearest_greater_or_smaller",
        "deferred_resolution",
        "undo_previous_state"
      ]
    },
    {
      "id": "recognize_binary_search_signal",
      "primarySkillAtomId": "identify_legal_half_discard_rule",
      "roadmapNodeId": "binary_search",
      "unitKind": "direct",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "classic_index_search",
        "lower_bound",
        "upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ],
      "problemArchetypeIds": [
        "find_index_in_sorted_input",
        "find_first_valid_position",
        "find_last_valid_position",
        "minimize_feasible_answer",
        "maximize_feasible_answer",
        "search_rotated_sequence"
      ]
    },
    {
      "id": "classic_index_search",
      "primarySkillAtomId": "maintain_classic_search_invariant",
      "roadmapNodeId": "binary_search",
      "unitKind": "direct",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "classic_index_search",
        "lower_bound",
        "upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ],
      "problemArchetypeIds": [
        "find_index_in_sorted_input",
        "find_first_valid_position",
        "find_last_valid_position",
        "minimize_feasible_answer",
        "maximize_feasible_answer",
        "search_rotated_sequence"
      ]
    },
    {
      "id": "boundaries_and_loop_invariants",
      "primarySkillAtomId": "preserve_binary_search_boundary_contract",
      "roadmapNodeId": "binary_search",
      "unitKind": "direct",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "classic_index_search",
        "lower_bound",
        "upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ],
      "problemArchetypeIds": [
        "find_index_in_sorted_input",
        "find_first_valid_position",
        "find_last_valid_position",
        "minimize_feasible_answer",
        "maximize_feasible_answer",
        "search_rotated_sequence"
      ]
    },
    {
      "id": "lower_and_upper_bound",
      "primarySkillAtomId": "find_first_or_last_valid_boundary",
      "roadmapNodeId": "binary_search",
      "unitKind": "direct",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "classic_index_search",
        "lower_bound",
        "upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ],
      "problemArchetypeIds": [
        "find_index_in_sorted_input",
        "find_first_valid_position",
        "find_last_valid_position",
        "minimize_feasible_answer",
        "maximize_feasible_answer",
        "search_rotated_sequence"
      ]
    },
    {
      "id": "binary_search_on_answer",
      "primarySkillAtomId": "search_feasible_answer_space",
      "roadmapNodeId": "binary_search",
      "unitKind": "direct",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "classic_index_search",
        "lower_bound",
        "upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ],
      "problemArchetypeIds": [
        "find_index_in_sorted_input",
        "find_first_valid_position",
        "find_last_valid_position",
        "minimize_feasible_answer",
        "maximize_feasible_answer",
        "search_rotated_sequence"
      ]
    },
    {
      "id": "monotonic_predicate_search",
      "primarySkillAtomId": "identify_monotonic_predicate",
      "roadmapNodeId": "binary_search",
      "unitKind": "direct",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "classic_index_search",
        "lower_bound",
        "upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ],
      "problemArchetypeIds": [
        "find_index_in_sorted_input",
        "find_first_valid_position",
        "find_last_valid_position",
        "minimize_feasible_answer",
        "maximize_feasible_answer",
        "search_rotated_sequence"
      ]
    },
    {
      "id": "rotated_array_search",
      "primarySkillAtomId": "identify_ordered_half_in_rotated_input",
      "roadmapNodeId": "binary_search",
      "unitKind": "direct",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "classic_index_search",
        "lower_bound",
        "upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ],
      "problemArchetypeIds": [
        "find_index_in_sorted_input",
        "find_first_valid_position",
        "find_last_valid_position",
        "minimize_feasible_answer",
        "maximize_feasible_answer",
        "search_rotated_sequence"
      ]
    },
    {
      "id": "linked_list_structure_and_node_identity",
      "primarySkillAtomId": "distinguish_node_identity_from_node_value",
      "roadmapNodeId": "linked_list",
      "unitKind": "direct",
      "primaryPatternFamilyId": "linked_list",
      "legalPatternFamilyIds": [
        "linked_list"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "pointer_rewiring",
        "reverse_list",
        "fast_slow_pointer",
        "merge_lists",
        "dummy_head"
      ],
      "problemArchetypeIds": [
        "reverse_linked_structure",
        "detect_cycle",
        "merge_ordered_lists",
        "remove_or_rewire_node",
        "find_middle_node"
      ]
    },
    {
      "id": "pointer_rewiring",
      "primarySkillAtomId": "preserve_reachable_nodes_during_rewire",
      "roadmapNodeId": "linked_list",
      "unitKind": "direct",
      "primaryPatternFamilyId": "linked_list",
      "legalPatternFamilyIds": [
        "linked_list"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "pointer_rewiring",
        "reverse_list",
        "fast_slow_pointer",
        "merge_lists",
        "dummy_head"
      ],
      "problemArchetypeIds": [
        "reverse_linked_structure",
        "detect_cycle",
        "merge_ordered_lists",
        "remove_or_rewire_node",
        "find_middle_node"
      ]
    },
    {
      "id": "reverse_list_iterative",
      "primarySkillAtomId": "reverse_link_direction_iteratively",
      "roadmapNodeId": "linked_list",
      "unitKind": "direct",
      "primaryPatternFamilyId": "linked_list",
      "legalPatternFamilyIds": [
        "linked_list"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "pointer_rewiring",
        "reverse_list",
        "fast_slow_pointer",
        "merge_lists",
        "dummy_head"
      ],
      "problemArchetypeIds": [
        "reverse_linked_structure",
        "detect_cycle",
        "merge_ordered_lists",
        "remove_or_rewire_node",
        "find_middle_node"
      ]
    },
    {
      "id": "fast_and_slow_pointers",
      "primarySkillAtomId": "maintain_relative_pointer_speed",
      "roadmapNodeId": "linked_list",
      "unitKind": "direct",
      "primaryPatternFamilyId": "linked_list",
      "legalPatternFamilyIds": [
        "linked_list"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "pointer_rewiring",
        "reverse_list",
        "fast_slow_pointer",
        "merge_lists",
        "dummy_head"
      ],
      "problemArchetypeIds": [
        "reverse_linked_structure",
        "detect_cycle",
        "merge_ordered_lists",
        "remove_or_rewire_node",
        "find_middle_node"
      ]
    },
    {
      "id": "cycle_detection",
      "primarySkillAtomId": "detect_cycle_by_pointer_convergence",
      "roadmapNodeId": "linked_list",
      "unitKind": "direct",
      "primaryPatternFamilyId": "linked_list",
      "legalPatternFamilyIds": [
        "linked_list"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "pointer_rewiring",
        "reverse_list",
        "fast_slow_pointer",
        "merge_lists",
        "dummy_head"
      ],
      "problemArchetypeIds": [
        "reverse_linked_structure",
        "detect_cycle",
        "merge_ordered_lists",
        "remove_or_rewire_node",
        "find_middle_node"
      ]
    },
    {
      "id": "merge_and_splice_lists",
      "primarySkillAtomId": "merge_nodes_without_losing_links",
      "roadmapNodeId": "linked_list",
      "unitKind": "direct",
      "primaryPatternFamilyId": "linked_list",
      "legalPatternFamilyIds": [
        "linked_list"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "pointer_rewiring",
        "reverse_list",
        "fast_slow_pointer",
        "merge_lists",
        "dummy_head"
      ],
      "problemArchetypeIds": [
        "reverse_linked_structure",
        "detect_cycle",
        "merge_ordered_lists",
        "remove_or_rewire_node",
        "find_middle_node"
      ]
    },
    {
      "id": "dummy_and_sentinel_nodes",
      "primarySkillAtomId": "simplify_head_boundary_with_sentinel",
      "roadmapNodeId": "linked_list",
      "unitKind": "direct",
      "primaryPatternFamilyId": "linked_list",
      "legalPatternFamilyIds": [
        "linked_list"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "pointer_rewiring",
        "reverse_list",
        "fast_slow_pointer",
        "merge_lists",
        "dummy_head"
      ],
      "problemArchetypeIds": [
        "reverse_linked_structure",
        "detect_cycle",
        "merge_ordered_lists",
        "remove_or_rewire_node",
        "find_middle_node"
      ]
    },
    {
      "id": "linked_list_edge_cases_and_mistakes",
      "primarySkillAtomId": "diagnose_linked_list_rewiring_error",
      "roadmapNodeId": "linked_list",
      "unitKind": "direct",
      "primaryPatternFamilyId": "linked_list",
      "legalPatternFamilyIds": [
        "linked_list"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "pointer_rewiring",
        "reverse_list",
        "fast_slow_pointer",
        "merge_lists",
        "dummy_head"
      ],
      "problemArchetypeIds": [
        "reverse_linked_structure",
        "detect_cycle",
        "merge_ordered_lists",
        "remove_or_rewire_node",
        "find_middle_node"
      ]
    },
    {
      "id": "recognize_recursive_structure",
      "primarySkillAtomId": "identify_self_similar_subproblem",
      "roadmapNodeId": "recursion_basics",
      "unitKind": "direct",
      "primaryPatternFamilyId": "recursion_basics",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "base_case_recognition",
        "recursive_decomposition",
        "divide_and_combine",
        "tail_recursion_intro"
      ],
      "problemArchetypeIds": [
        "traverse_recursive_structure",
        "compute_from_smaller_input",
        "divide_problem",
        "generate_recursive_result"
      ]
    },
    {
      "id": "recursion_base_case_and_result_contract",
      "primarySkillAtomId": "define_recursive_base_and_return_contract",
      "roadmapNodeId": "recursion_basics",
      "unitKind": "direct",
      "primaryPatternFamilyId": "recursion_basics",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "base_case_recognition",
        "recursive_decomposition",
        "divide_and_combine",
        "tail_recursion_intro"
      ],
      "problemArchetypeIds": [
        "traverse_recursive_structure",
        "compute_from_smaller_input",
        "divide_problem",
        "generate_recursive_result"
      ]
    },
    {
      "id": "choose_recursive_state",
      "primarySkillAtomId": "choose_minimal_recursive_state",
      "roadmapNodeId": "recursion_basics",
      "unitKind": "direct",
      "primaryPatternFamilyId": "recursion_basics",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "base_case_recognition",
        "recursive_decomposition",
        "divide_and_combine",
        "tail_recursion_intro"
      ],
      "problemArchetypeIds": [
        "traverse_recursive_structure",
        "compute_from_smaller_input",
        "divide_problem",
        "generate_recursive_result"
      ]
    },
    {
      "id": "make_progress_toward_base_case",
      "primarySkillAtomId": "prove_recursive_progress",
      "roadmapNodeId": "recursion_basics",
      "unitKind": "direct",
      "primaryPatternFamilyId": "recursion_basics",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "base_case_recognition",
        "recursive_decomposition",
        "divide_and_combine",
        "tail_recursion_intro"
      ],
      "problemArchetypeIds": [
        "traverse_recursive_structure",
        "compute_from_smaller_input",
        "divide_problem",
        "generate_recursive_result"
      ]
    },
    {
      "id": "combine_subproblem_results",
      "primarySkillAtomId": "combine_recursive_return_values",
      "roadmapNodeId": "recursion_basics",
      "unitKind": "direct",
      "primaryPatternFamilyId": "recursion_basics",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "base_case_recognition",
        "recursive_decomposition",
        "divide_and_combine",
        "tail_recursion_intro"
      ],
      "problemArchetypeIds": [
        "traverse_recursive_structure",
        "compute_from_smaller_input",
        "divide_problem",
        "generate_recursive_result"
      ]
    },
    {
      "id": "recursion_stack_and_complexity",
      "primarySkillAtomId": "account_for_recursive_call_stack",
      "roadmapNodeId": "recursion_basics",
      "unitKind": "direct",
      "primaryPatternFamilyId": "recursion_basics",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "base_case_recognition",
        "recursive_decomposition",
        "divide_and_combine",
        "tail_recursion_intro"
      ],
      "problemArchetypeIds": [
        "traverse_recursive_structure",
        "compute_from_smaller_input",
        "divide_problem",
        "generate_recursive_result"
      ]
    },
    {
      "id": "recursion_mistake_review",
      "primarySkillAtomId": "diagnose_nonterminating_or_incomplete_recursion",
      "roadmapNodeId": "recursion_basics",
      "unitKind": "direct",
      "primaryPatternFamilyId": "recursion_basics",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "base_case_recognition",
        "recursive_decomposition",
        "divide_and_combine",
        "tail_recursion_intro"
      ],
      "problemArchetypeIds": [
        "traverse_recursive_structure",
        "compute_from_smaller_input",
        "divide_problem",
        "generate_recursive_result"
      ]
    },
    {
      "id": "tree_structure_and_recursive_contract",
      "primarySkillAtomId": "define_tree_subproblem_contract",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "dfs_preorder",
      "primarySkillAtomId": "apply_preorder_processing",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "dfs_inorder",
      "primarySkillAtomId": "apply_inorder_processing",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "dfs_postorder",
      "primarySkillAtomId": "apply_postorder_processing",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "bfs_level_order",
      "primarySkillAtomId": "process_tree_by_levels",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "carry_path_and_aggregate_state",
      "primarySkillAtomId": "carry_state_along_tree_path",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "subtree_return_values",
      "primarySkillAtomId": "derive_parent_result_from_subtrees",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "tree_boundaries_and_null_cases",
      "primarySkillAtomId": "handle_empty_and_leaf_boundaries",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "traversal_choice_and_complexity",
      "primarySkillAtomId": "choose_tree_traversal_order",
      "roadmapNodeId": "tree_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "tree_traversal",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "path_accumulation",
        "subtree_aggregation"
      ],
      "problemArchetypeIds": [
        "traverse_tree",
        "compute_subtree_property",
        "root_to_leaf_path",
        "level_order_processing",
        "validate_tree_property"
      ]
    },
    {
      "id": "recognize_repeated_extreme_signal",
      "primarySkillAtomId": "identify_repeated_extreme_requirement",
      "roadmapNodeId": "heap_priority_queue",
      "unitKind": "direct",
      "primaryPatternFamilyId": "heap_priority_queue",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "top_k",
        "running_extreme",
        "k_way_merge",
        "bounded_heap"
      ],
      "problemArchetypeIds": [
        "choose_repeated_extreme",
        "maintain_top_k",
        "merge_sorted_sources",
        "schedule_by_priority"
      ]
    },
    {
      "id": "heap_push_pop_peek_mechanics",
      "primarySkillAtomId": "trace_heap_operation",
      "roadmapNodeId": "heap_priority_queue",
      "unitKind": "direct",
      "primaryPatternFamilyId": "heap_priority_queue",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "top_k",
        "running_extreme",
        "k_way_merge",
        "bounded_heap"
      ],
      "problemArchetypeIds": [
        "choose_repeated_extreme",
        "maintain_top_k",
        "merge_sorted_sources",
        "schedule_by_priority"
      ]
    },
    {
      "id": "top_k_selection",
      "primarySkillAtomId": "maintain_bounded_top_k_heap",
      "roadmapNodeId": "heap_priority_queue",
      "unitKind": "direct",
      "primaryPatternFamilyId": "heap_priority_queue",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "top_k",
        "running_extreme",
        "k_way_merge",
        "bounded_heap"
      ],
      "problemArchetypeIds": [
        "choose_repeated_extreme",
        "maintain_top_k",
        "merge_sorted_sources",
        "schedule_by_priority"
      ]
    },
    {
      "id": "k_way_merge",
      "primarySkillAtomId": "merge_sorted_sources_with_heap",
      "roadmapNodeId": "heap_priority_queue",
      "unitKind": "direct",
      "primaryPatternFamilyId": "heap_priority_queue",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "top_k",
        "running_extreme",
        "k_way_merge",
        "bounded_heap"
      ],
      "problemArchetypeIds": [
        "choose_repeated_extreme",
        "maintain_top_k",
        "merge_sorted_sources",
        "schedule_by_priority"
      ]
    },
    {
      "id": "running_extreme_and_streaming",
      "primarySkillAtomId": "maintain_streaming_extreme",
      "roadmapNodeId": "heap_priority_queue",
      "unitKind": "direct",
      "primaryPatternFamilyId": "heap_priority_queue",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "top_k",
        "running_extreme",
        "k_way_merge",
        "bounded_heap"
      ],
      "problemArchetypeIds": [
        "choose_repeated_extreme",
        "maintain_top_k",
        "merge_sorted_sources",
        "schedule_by_priority"
      ]
    },
    {
      "id": "min_heap_vs_max_heap_choice",
      "primarySkillAtomId": "choose_heap_orientation",
      "roadmapNodeId": "heap_priority_queue",
      "unitKind": "direct",
      "primaryPatternFamilyId": "heap_priority_queue",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "top_k",
        "running_extreme",
        "k_way_merge",
        "bounded_heap"
      ],
      "problemArchetypeIds": [
        "choose_repeated_extreme",
        "maintain_top_k",
        "merge_sorted_sources",
        "schedule_by_priority"
      ]
    },
    {
      "id": "heap_complexity_and_size_k",
      "primarySkillAtomId": "derive_heap_cost_from_heap_size",
      "roadmapNodeId": "heap_priority_queue",
      "unitKind": "direct",
      "primaryPatternFamilyId": "heap_priority_queue",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "top_k",
        "running_extreme",
        "k_way_merge",
        "bounded_heap"
      ],
      "problemArchetypeIds": [
        "choose_repeated_extreme",
        "maintain_top_k",
        "merge_sorted_sources",
        "schedule_by_priority"
      ]
    },
    {
      "id": "heap_mistake_review",
      "primarySkillAtomId": "diagnose_heap_state_mismatch",
      "roadmapNodeId": "heap_priority_queue",
      "unitKind": "direct",
      "primaryPatternFamilyId": "heap_priority_queue",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "top_k",
        "running_extreme",
        "k_way_merge",
        "bounded_heap"
      ],
      "problemArchetypeIds": [
        "choose_repeated_extreme",
        "maintain_top_k",
        "merge_sorted_sources",
        "schedule_by_priority"
      ]
    },
    {
      "id": "interval_representation_and_endpoint_semantics",
      "primarySkillAtomId": "define_interval_endpoint_contract",
      "roadmapNodeId": "intervals",
      "unitKind": "direct",
      "primaryPatternFamilyId": "intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "merge_overlaps",
        "insert_interval",
        "sweep_line_intro",
        "interval_resource_count"
      ],
      "problemArchetypeIds": [
        "merge_or_compare_intervals",
        "detect_schedule_conflict",
        "count_concurrent_intervals",
        "insert_into_merged_intervals"
      ]
    },
    {
      "id": "sort_intervals_for_processing",
      "primarySkillAtomId": "choose_interval_sort_key",
      "roadmapNodeId": "intervals",
      "unitKind": "direct",
      "primaryPatternFamilyId": "intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "merge_overlaps",
        "insert_interval",
        "sweep_line_intro",
        "interval_resource_count"
      ],
      "problemArchetypeIds": [
        "merge_or_compare_intervals",
        "detect_schedule_conflict",
        "count_concurrent_intervals",
        "insert_into_merged_intervals"
      ]
    },
    {
      "id": "detect_overlap",
      "primarySkillAtomId": "evaluate_interval_overlap",
      "roadmapNodeId": "intervals",
      "unitKind": "direct",
      "primaryPatternFamilyId": "intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "merge_overlaps",
        "insert_interval",
        "sweep_line_intro",
        "interval_resource_count"
      ],
      "problemArchetypeIds": [
        "merge_or_compare_intervals",
        "detect_schedule_conflict",
        "count_concurrent_intervals",
        "insert_into_merged_intervals"
      ]
    },
    {
      "id": "merge_overlaps",
      "primarySkillAtomId": "merge_overlapping_intervals",
      "roadmapNodeId": "intervals",
      "unitKind": "direct",
      "primaryPatternFamilyId": "intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "merge_overlaps",
        "insert_interval",
        "sweep_line_intro",
        "interval_resource_count"
      ],
      "problemArchetypeIds": [
        "merge_or_compare_intervals",
        "detect_schedule_conflict",
        "count_concurrent_intervals",
        "insert_into_merged_intervals"
      ]
    },
    {
      "id": "insert_interval",
      "primarySkillAtomId": "insert_interval_into_merged_sequence",
      "roadmapNodeId": "intervals",
      "unitKind": "direct",
      "primaryPatternFamilyId": "intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "merge_overlaps",
        "insert_interval",
        "sweep_line_intro",
        "interval_resource_count"
      ],
      "problemArchetypeIds": [
        "merge_or_compare_intervals",
        "detect_schedule_conflict",
        "count_concurrent_intervals",
        "insert_into_merged_intervals"
      ]
    },
    {
      "id": "meeting_rooms_and_resource_count",
      "primarySkillAtomId": "count_concurrent_intervals",
      "roadmapNodeId": "intervals",
      "unitKind": "direct",
      "primaryPatternFamilyId": "intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "merge_overlaps",
        "insert_interval",
        "sweep_line_intro",
        "interval_resource_count"
      ],
      "problemArchetypeIds": [
        "merge_or_compare_intervals",
        "detect_schedule_conflict",
        "count_concurrent_intervals",
        "insert_into_merged_intervals"
      ]
    },
    {
      "id": "sweep_line_intro",
      "primarySkillAtomId": "process_interval_events_in_order",
      "roadmapNodeId": "intervals",
      "unitKind": "direct",
      "primaryPatternFamilyId": "intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "merge_overlaps",
        "insert_interval",
        "sweep_line_intro",
        "interval_resource_count"
      ],
      "problemArchetypeIds": [
        "merge_or_compare_intervals",
        "detect_schedule_conflict",
        "count_concurrent_intervals",
        "insert_into_merged_intervals"
      ]
    },
    {
      "id": "interval_boundary_mistake_review",
      "primarySkillAtomId": "diagnose_interval_endpoint_error",
      "roadmapNodeId": "intervals",
      "unitKind": "direct",
      "primaryPatternFamilyId": "intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "merge_overlaps",
        "insert_interval",
        "sweep_line_intro",
        "interval_resource_count"
      ],
      "problemArchetypeIds": [
        "merge_or_compare_intervals",
        "detect_schedule_conflict",
        "count_concurrent_intervals",
        "insert_into_merged_intervals"
      ]
    },
    {
      "id": "recognize_backtracking_signal",
      "primarySkillAtomId": "identify_choice_tree_search",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "backtracking_base_case_and_result_contract",
      "primarySkillAtomId": "define_backtracking_completion_contract",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "choose_backtracking_state",
      "primarySkillAtomId": "choose_backtracking_state",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "enumerate_choices",
      "primarySkillAtomId": "enumerate_legal_next_choices",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "path_state_and_undo",
      "primarySkillAtomId": "restore_path_state_after_branch",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "constraint_pruning",
      "primarySkillAtomId": "prune_impossible_partial_solution",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "duplicate_control",
      "primarySkillAtomId": "prevent_duplicate_search_results",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "grid_search_backtracking",
      "primarySkillAtomId": "maintain_grid_search_visited_state",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "partitioning_and_segmentation",
      "primarySkillAtomId": "choose_partition_boundary",
      "roadmapNodeId": "backtracking",
      "unitKind": "direct",
      "primaryPatternFamilyId": "backtracking",
      "legalPatternFamilyIds": [
        "backtracking"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "choice_tree",
        "constraints_and_pruning",
        "duplicate_control",
        "grid_search",
        "partition_search"
      ],
      "problemArchetypeIds": [
        "enumerate_combinations",
        "enumerate_permutations",
        "search_grid_paths",
        "partition_sequence",
        "construct_valid_assignment"
      ]
    },
    {
      "id": "graph_representation",
      "primarySkillAtomId": "choose_graph_representation",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "recognize_graph_traversal_signal",
      "primarySkillAtomId": "identify_connected_state_search",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "graph_dfs",
      "primarySkillAtomId": "traverse_graph_depth_first",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "graph_bfs",
      "primarySkillAtomId": "traverse_graph_breadth_first",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "visited_state_and_cycles",
      "primarySkillAtomId": "maintain_graph_visited_state",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "connected_components",
      "primarySkillAtomId": "count_connected_components",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "multi_source_bfs",
      "primarySkillAtomId": "initialize_multi_source_frontier",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "grid_as_graph",
      "primarySkillAtomId": "map_grid_cells_to_graph_state",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "topological_order_intro",
      "primarySkillAtomId": "process_dependency_order",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "graph_complexity_and_mistakes",
      "primarySkillAtomId": "derive_graph_traversal_complexity",
      "roadmapNodeId": "graph_traversal",
      "unitKind": "direct",
      "primaryPatternFamilyId": "graph_traversal",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "adjacency_list",
        "graph_dfs",
        "graph_bfs",
        "multi_source_bfs",
        "connected_components",
        "topological_order_intro",
        "grid_graph"
      ],
      "problemArchetypeIds": [
        "traverse_connected_state",
        "shortest_unweighted_path",
        "count_components",
        "propagate_from_multiple_sources",
        "order_dependencies"
      ]
    },
    {
      "id": "recognize_greedy_candidate",
      "primarySkillAtomId": "identify_greedy_choice_structure",
      "roadmapNodeId": "greedy_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "greedy_intro",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [
        "sort_then_greedy",
        "interval_greedy",
        "running_best_choice",
        "greedy_with_heap"
      ],
      "problemArchetypeIds": [
        "choose_non_overlapping_set",
        "minimize_or_maximize_local_cost",
        "schedule_by_deadline",
        "construct_optimal_sequence"
      ]
    },
    {
      "id": "define_local_choice",
      "primarySkillAtomId": "define_local_optimization_rule",
      "roadmapNodeId": "greedy_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "greedy_intro",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [
        "sort_then_greedy",
        "interval_greedy",
        "running_best_choice",
        "greedy_with_heap"
      ],
      "problemArchetypeIds": [
        "choose_non_overlapping_set",
        "minimize_or_maximize_local_cost",
        "schedule_by_deadline",
        "construct_optimal_sequence"
      ]
    },
    {
      "id": "prove_safe_choice",
      "primarySkillAtomId": "justify_greedy_choice_safety",
      "roadmapNodeId": "greedy_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "greedy_intro",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [
        "sort_then_greedy",
        "interval_greedy",
        "running_best_choice",
        "greedy_with_heap"
      ],
      "problemArchetypeIds": [
        "choose_non_overlapping_set",
        "minimize_or_maximize_local_cost",
        "schedule_by_deadline",
        "construct_optimal_sequence"
      ]
    },
    {
      "id": "exchange_argument_intro",
      "primarySkillAtomId": "construct_basic_exchange_argument",
      "roadmapNodeId": "greedy_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "greedy_intro",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [
        "sort_then_greedy",
        "interval_greedy",
        "running_best_choice",
        "greedy_with_heap"
      ],
      "problemArchetypeIds": [
        "choose_non_overlapping_set",
        "minimize_or_maximize_local_cost",
        "schedule_by_deadline",
        "construct_optimal_sequence"
      ]
    },
    {
      "id": "sort_then_greedy",
      "primarySkillAtomId": "choose_sort_key_for_greedy_process",
      "roadmapNodeId": "greedy_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "greedy_intro",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [
        "sort_then_greedy",
        "interval_greedy",
        "running_best_choice",
        "greedy_with_heap"
      ],
      "problemArchetypeIds": [
        "choose_non_overlapping_set",
        "minimize_or_maximize_local_cost",
        "schedule_by_deadline",
        "construct_optimal_sequence"
      ]
    },
    {
      "id": "interval_greedy",
      "primarySkillAtomId": "choose_interval_greedy_boundary",
      "roadmapNodeId": "greedy_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "greedy_intro",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [
        "sort_then_greedy",
        "interval_greedy",
        "running_best_choice",
        "greedy_with_heap"
      ],
      "problemArchetypeIds": [
        "choose_non_overlapping_set",
        "minimize_or_maximize_local_cost",
        "schedule_by_deadline",
        "construct_optimal_sequence"
      ]
    },
    {
      "id": "greedy_failure_signals",
      "primarySkillAtomId": "detect_missing_greedy_choice_property",
      "roadmapNodeId": "greedy_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "greedy_intro",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [
        "sort_then_greedy",
        "interval_greedy",
        "running_best_choice",
        "greedy_with_heap"
      ],
      "problemArchetypeIds": [
        "choose_non_overlapping_set",
        "minimize_or_maximize_local_cost",
        "schedule_by_deadline",
        "construct_optimal_sequence"
      ]
    },
    {
      "id": "greedy_mistake_review",
      "primarySkillAtomId": "diagnose_unsupported_greedy_reasoning",
      "roadmapNodeId": "greedy_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "greedy_intro",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [
        "sort_then_greedy",
        "interval_greedy",
        "running_best_choice",
        "greedy_with_heap"
      ],
      "problemArchetypeIds": [
        "choose_non_overlapping_set",
        "minimize_or_maximize_local_cost",
        "schedule_by_deadline",
        "construct_optimal_sequence"
      ]
    },
    {
      "id": "recognize_overlapping_subproblems",
      "primarySkillAtomId": "identify_reused_subproblem",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "define_dp_state",
      "primarySkillAtomId": "define_sufficient_dp_state",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "define_transition",
      "primarySkillAtomId": "derive_dp_transition",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "base_cases_and_initialization",
      "primarySkillAtomId": "initialize_dp_base_cases",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "memoization_top_down",
      "primarySkillAtomId": "memoize_recursive_subproblem",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "tabulation_bottom_up",
      "primarySkillAtomId": "tabulate_subproblems_bottom_up",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "iteration_order",
      "primarySkillAtomId": "choose_dependency_safe_iteration_order",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "optimize_state_space",
      "primarySkillAtomId": "compress_dp_state_safely",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "one_dimensional_dp",
      "primarySkillAtomId": "model_one_dimensional_dp",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "two_dimensional_dp_intro",
      "primarySkillAtomId": "model_two_dimensional_dp",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "reconstruct_solution_intro",
      "primarySkillAtomId": "reconstruct_choice_from_dp_state",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "dp_mistake_review",
      "primarySkillAtomId": "diagnose_incomplete_dp_state_or_transition",
      "roadmapNodeId": "dynamic_programming_intro",
      "unitKind": "direct",
      "primaryPatternFamilyId": "dynamic_programming_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "memoization",
        "tabulation",
        "one_dimensional_dp",
        "two_dimensional_dp",
        "state_compression"
      ],
      "problemArchetypeIds": [
        "count_ways",
        "optimize_prefix_or_suffix",
        "choose_or_skip",
        "grid_path_dp",
        "sequence_alignment_intro"
      ]
    },
    {
      "id": "binary_representation_and_masks",
      "primarySkillAtomId": "interpret_integer_bit_representation",
      "roadmapNodeId": "bit_manipulation",
      "unitKind": "direct",
      "primaryPatternFamilyId": "bit_manipulation",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "bit_mask",
        "xor_cancellation",
        "lowest_set_bit",
        "subset_mask"
      ],
      "problemArchetypeIds": [
        "encode_boolean_state",
        "find_unique_element",
        "enumerate_subsets_by_mask",
        "count_set_bits"
      ]
    },
    {
      "id": "test_set_clear_toggle_bits",
      "primarySkillAtomId": "manipulate_selected_bit",
      "roadmapNodeId": "bit_manipulation",
      "unitKind": "direct",
      "primaryPatternFamilyId": "bit_manipulation",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "bit_mask",
        "xor_cancellation",
        "lowest_set_bit",
        "subset_mask"
      ],
      "problemArchetypeIds": [
        "encode_boolean_state",
        "find_unique_element",
        "enumerate_subsets_by_mask",
        "count_set_bits"
      ]
    },
    {
      "id": "shifts_and_sign_behavior",
      "primarySkillAtomId": "reason_about_bit_shift_behavior",
      "roadmapNodeId": "bit_manipulation",
      "unitKind": "direct",
      "primaryPatternFamilyId": "bit_manipulation",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "bit_mask",
        "xor_cancellation",
        "lowest_set_bit",
        "subset_mask"
      ],
      "problemArchetypeIds": [
        "encode_boolean_state",
        "find_unique_element",
        "enumerate_subsets_by_mask",
        "count_set_bits"
      ]
    },
    {
      "id": "xor_cancellation",
      "primarySkillAtomId": "apply_xor_cancellation",
      "roadmapNodeId": "bit_manipulation",
      "unitKind": "direct",
      "primaryPatternFamilyId": "bit_manipulation",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "bit_mask",
        "xor_cancellation",
        "lowest_set_bit",
        "subset_mask"
      ],
      "problemArchetypeIds": [
        "encode_boolean_state",
        "find_unique_element",
        "enumerate_subsets_by_mask",
        "count_set_bits"
      ]
    },
    {
      "id": "count_bits_and_lowest_set_bit",
      "primarySkillAtomId": "remove_lowest_set_bit",
      "roadmapNodeId": "bit_manipulation",
      "unitKind": "direct",
      "primaryPatternFamilyId": "bit_manipulation",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "bit_mask",
        "xor_cancellation",
        "lowest_set_bit",
        "subset_mask"
      ],
      "problemArchetypeIds": [
        "encode_boolean_state",
        "find_unique_element",
        "enumerate_subsets_by_mask",
        "count_set_bits"
      ]
    },
    {
      "id": "subset_mask_enumeration_intro",
      "primarySkillAtomId": "enumerate_subset_by_bitmask",
      "roadmapNodeId": "bit_manipulation",
      "unitKind": "direct",
      "primaryPatternFamilyId": "bit_manipulation",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "bit_mask",
        "xor_cancellation",
        "lowest_set_bit",
        "subset_mask"
      ],
      "problemArchetypeIds": [
        "encode_boolean_state",
        "find_unique_element",
        "enumerate_subsets_by_mask",
        "count_set_bits"
      ]
    },
    {
      "id": "bitmask_state_representation",
      "primarySkillAtomId": "encode_boolean_state_in_mask",
      "roadmapNodeId": "bit_manipulation",
      "unitKind": "direct",
      "primaryPatternFamilyId": "bit_manipulation",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "bit_mask",
        "xor_cancellation",
        "lowest_set_bit",
        "subset_mask"
      ],
      "problemArchetypeIds": [
        "encode_boolean_state",
        "find_unique_element",
        "enumerate_subsets_by_mask",
        "count_set_bits"
      ]
    },
    {
      "id": "bit_manipulation_mistake_review",
      "primarySkillAtomId": "diagnose_bit_width_or_sign_assumption",
      "roadmapNodeId": "bit_manipulation",
      "unitKind": "direct",
      "primaryPatternFamilyId": "bit_manipulation",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "pattern_mechanics",
      "patternVariantIds": [
        "bit_mask",
        "xor_cancellation",
        "lowest_set_bit",
        "subset_mask"
      ],
      "problemArchetypeIds": [
        "encode_boolean_state",
        "find_unique_element",
        "enumerate_subsets_by_mask",
        "count_set_bits"
      ]
    },
    {
      "id": "integer_arithmetic_and_overflow",
      "primarySkillAtomId": "avoid_integer_overflow_in_computation",
      "roadmapNodeId": "math_and_geometry",
      "unitKind": "direct",
      "primaryPatternFamilyId": "math_and_geometry",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "euclidean_algorithm",
        "modular_arithmetic",
        "prime_factorization",
        "vector_orientation",
        "coordinate_transform"
      ],
      "problemArchetypeIds": [
        "divisibility_and_cycles",
        "compute_gcd_lcm",
        "count_or_generate_primes",
        "compare_geometric_orientation",
        "normalize_coordinates"
      ]
    },
    {
      "id": "gcd_lcm_and_divisibility",
      "primarySkillAtomId": "apply_euclidean_algorithm",
      "roadmapNodeId": "math_and_geometry",
      "unitKind": "direct",
      "primaryPatternFamilyId": "math_and_geometry",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "euclidean_algorithm",
        "modular_arithmetic",
        "prime_factorization",
        "vector_orientation",
        "coordinate_transform"
      ],
      "problemArchetypeIds": [
        "divisibility_and_cycles",
        "compute_gcd_lcm",
        "count_or_generate_primes",
        "compare_geometric_orientation",
        "normalize_coordinates"
      ]
    },
    {
      "id": "modular_arithmetic",
      "primarySkillAtomId": "preserve_modular_equivalence",
      "roadmapNodeId": "math_and_geometry",
      "unitKind": "direct",
      "primaryPatternFamilyId": "math_and_geometry",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "euclidean_algorithm",
        "modular_arithmetic",
        "prime_factorization",
        "vector_orientation",
        "coordinate_transform"
      ],
      "problemArchetypeIds": [
        "divisibility_and_cycles",
        "compute_gcd_lcm",
        "count_or_generate_primes",
        "compare_geometric_orientation",
        "normalize_coordinates"
      ]
    },
    {
      "id": "primes_and_factorization",
      "primarySkillAtomId": "derive_prime_factorization_or_sieve",
      "roadmapNodeId": "math_and_geometry",
      "unitKind": "direct",
      "primaryPatternFamilyId": "math_and_geometry",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "euclidean_algorithm",
        "modular_arithmetic",
        "prime_factorization",
        "vector_orientation",
        "coordinate_transform"
      ],
      "problemArchetypeIds": [
        "divisibility_and_cycles",
        "compute_gcd_lcm",
        "count_or_generate_primes",
        "compare_geometric_orientation",
        "normalize_coordinates"
      ]
    },
    {
      "id": "coordinate_and_vector_basics",
      "primarySkillAtomId": "represent_geometric_relation_with_vectors",
      "roadmapNodeId": "math_and_geometry",
      "unitKind": "direct",
      "primaryPatternFamilyId": "math_and_geometry",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "euclidean_algorithm",
        "modular_arithmetic",
        "prime_factorization",
        "vector_orientation",
        "coordinate_transform"
      ],
      "problemArchetypeIds": [
        "divisibility_and_cycles",
        "compute_gcd_lcm",
        "count_or_generate_primes",
        "compare_geometric_orientation",
        "normalize_coordinates"
      ]
    },
    {
      "id": "distance_and_slope_without_precision_loss",
      "primarySkillAtomId": "compare_geometric_quantities_without_unsafe_division",
      "roadmapNodeId": "math_and_geometry",
      "unitKind": "direct",
      "primaryPatternFamilyId": "math_and_geometry",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "euclidean_algorithm",
        "modular_arithmetic",
        "prime_factorization",
        "vector_orientation",
        "coordinate_transform"
      ],
      "problemArchetypeIds": [
        "divisibility_and_cycles",
        "compute_gcd_lcm",
        "count_or_generate_primes",
        "compare_geometric_orientation",
        "normalize_coordinates"
      ]
    },
    {
      "id": "interval_and_angle_normalization",
      "primarySkillAtomId": "normalize_cyclic_or_coordinate_value",
      "roadmapNodeId": "math_and_geometry",
      "unitKind": "direct",
      "primaryPatternFamilyId": "math_and_geometry",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "euclidean_algorithm",
        "modular_arithmetic",
        "prime_factorization",
        "vector_orientation",
        "coordinate_transform"
      ],
      "problemArchetypeIds": [
        "divisibility_and_cycles",
        "compute_gcd_lcm",
        "count_or_generate_primes",
        "compare_geometric_orientation",
        "normalize_coordinates"
      ]
    },
    {
      "id": "geometry_boundary_and_precision_mistakes",
      "primarySkillAtomId": "diagnose_degenerate_or_precision_case",
      "roadmapNodeId": "math_and_geometry",
      "unitKind": "direct",
      "primaryPatternFamilyId": "math_and_geometry",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "foundations",
      "patternVariantIds": [
        "euclidean_algorithm",
        "modular_arithmetic",
        "prime_factorization",
        "vector_orientation",
        "coordinate_transform"
      ],
      "problemArchetypeIds": [
        "divisibility_and_cycles",
        "compute_gcd_lcm",
        "count_or_generate_primes",
        "compare_geometric_orientation",
        "normalize_coordinates"
      ]
    },
    {
      "id": "extract_constraints_and_output_contract",
      "primarySkillAtomId": "extract_strategy_decision_signals",
      "roadmapNodeId": "strategy_selection_core",
      "unitKind": "strategy",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [],
      "problemArchetypeIds": []
    },
    {
      "id": "generate_candidate_strategies",
      "primarySkillAtomId": "generate_plausible_algorithmic_approaches",
      "roadmapNodeId": "strategy_selection_core",
      "unitKind": "strategy",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [],
      "problemArchetypeIds": []
    },
    {
      "id": "reject_illegal_strategies",
      "primarySkillAtomId": "reject_strategy_without_required_invariant",
      "roadmapNodeId": "strategy_selection_core",
      "unitKind": "strategy",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [],
      "problemArchetypeIds": []
    },
    {
      "id": "compare_time_space_and_preprocessing",
      "primarySkillAtomId": "compare_candidate_cost_models",
      "roadmapNodeId": "strategy_selection_core",
      "unitKind": "strategy",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [],
      "problemArchetypeIds": []
    },
    {
      "id": "choose_for_single_vs_repeated_queries",
      "primarySkillAtomId": "choose_strategy_for_query_volume",
      "roadmapNodeId": "strategy_selection_core",
      "unitKind": "strategy",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [],
      "problemArchetypeIds": []
    },
    {
      "id": "correctness_before_optimization",
      "primarySkillAtomId": "prioritize_correctness_before_asymptotic_speed",
      "roadmapNodeId": "strategy_selection_core",
      "unitKind": "strategy",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [],
      "problemArchetypeIds": []
    },
    {
      "id": "justify_strategy_choice",
      "primarySkillAtomId": "justify_strategy_with_constraints_and_invariants",
      "roadmapNodeId": "strategy_selection_core",
      "unitKind": "strategy",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [],
      "problemArchetypeIds": []
    },
    {
      "id": "transfer_to_unfamiliar_problem",
      "primarySkillAtomId": "transfer_strategy_selection_to_new_surface_form",
      "roadmapNodeId": "strategy_selection_core",
      "unitKind": "strategy",
      "primaryPatternFamilyId": "complexity_and_constraints",
      "legalPatternFamilyIds": [
        "complexity_and_constraints",
        "arrays_and_strings",
        "hash_map_and_set",
        "two_pointers",
        "sliding_window",
        "prefix_sums",
        "sorting_based",
        "stack",
        "monotonic_stack",
        "binary_search"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "strategy_selection",
      "patternVariantIds": [],
      "problemArchetypeIds": []
    },
    {
      "id": "lookup_vs_ordering_signal",
      "primarySkillAtomId": "distinguish_lookup_from_ordering_signal",
      "roadmapNodeId": "contrast_hash_map_vs_sorting",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "expected_linear_vs_n_log_n_cost",
      "primarySkillAtomId": "compare_expected_hash_and_sorting_cost",
      "roadmapNodeId": "contrast_hash_map_vs_sorting",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "memory_vs_mutation_tradeoff",
      "primarySkillAtomId": "compare_hash_memory_with_sort_mutation",
      "roadmapNodeId": "contrast_hash_map_vs_sorting",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "duplicates_and_grouping_boundary",
      "primarySkillAtomId": "choose_hash_or_sort_for_duplicates_and_grouping",
      "roadmapNodeId": "contrast_hash_map_vs_sorting",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "preservation_of_order_and_indices",
      "primarySkillAtomId": "preserve_order_and_indices_across_strategy_choice",
      "roadmapNodeId": "contrast_hash_map_vs_sorting",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "single_pass_vs_repeated_queries",
      "primarySkillAtomId": "choose_hash_or_sort_for_query_volume",
      "roadmapNodeId": "contrast_hash_map_vs_sorting",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "reject_hash_map_always_faster",
      "primarySkillAtomId": "reject_hash_map_always_faster_heuristic",
      "roadmapNodeId": "contrast_hash_map_vs_sorting",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "transfer_hash_map_vs_sorting",
      "primarySkillAtomId": "transfer_hash_vs_sorting_decision",
      "roadmapNodeId": "contrast_hash_map_vs_sorting",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "hash_map_and_set",
      "legalPatternFamilyIds": [
        "hash_map_and_set",
        "sorting_based"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "pair_relation_vs_contiguous_range",
      "primarySkillAtomId": "distinguish_pair_relation_from_contiguous_window",
      "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "global_pair_search_vs_running_window",
      "primarySkillAtomId": "distinguish_global_pair_search_from_running_window",
      "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "pointer_movement_rule_vs_window_validity_rule",
      "primarySkillAtomId": "compare_pointer_move_and_window_validity_invariants",
      "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "fixed_state_vs_variable_window_state",
      "primarySkillAtomId": "distinguish_fixed_pointer_state_from_window_state",
      "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "shrink_legality_and_monotonicity",
      "primarySkillAtomId": "validate_window_shrink_monotonicity",
      "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "sorted_input_vs_contiguity",
      "primarySkillAtomId": "distinguish_sorted_input_signal_from_contiguity_signal",
      "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "reject_two_indices_means_two_pointers",
      "primarySkillAtomId": "reject_two_indices_implies_two_pointers_heuristic",
      "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "transfer_two_pointers_vs_sliding_window",
      "primarySkillAtomId": "transfer_two_pointers_vs_window_decision",
      "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "two_pointers",
      "legalPatternFamilyIds": [
        "two_pointers",
        "sliding_window"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "positive_monotonic_window_boundary",
      "primarySkillAtomId": "identify_positive_monotonic_window_boundary",
      "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "negative_values_break_simple_window",
      "primarySkillAtomId": "detect_negative_value_window_failure",
      "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "moving_state_vs_precomputed_state",
      "primarySkillAtomId": "distinguish_moving_window_from_precomputed_prefix",
      "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "one_query_vs_many_queries",
      "primarySkillAtomId": "choose_window_or_prefix_for_query_volume",
      "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "threshold_objective_vs_exact_sum",
      "primarySkillAtomId": "distinguish_threshold_window_from_exact_sum_prefix",
      "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "prefix_hash_state_boundary",
      "primarySkillAtomId": "identify_prefix_hash_state_requirement",
      "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "time_space_tradeoff",
      "primarySkillAtomId": "compare_window_and_prefix_time_space_tradeoff",
      "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "transfer_sliding_window_vs_prefix_sums",
      "primarySkillAtomId": "transfer_window_vs_prefix_decision",
      "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "sliding_window",
      "legalPatternFamilyIds": [
        "sliding_window",
        "prefix_sums"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "ordinary_lifo_vs_ordered_candidate_stack",
      "primarySkillAtomId": "distinguish_lifo_stack_from_monotonic_candidate_stack",
      "roadmapNodeId": "contrast_stack_vs_monotonic_stack_intro",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "unresolved_state_vs_dominated_candidate",
      "primarySkillAtomId": "distinguish_recent_unresolved_from_dominated_candidate",
      "roadmapNodeId": "contrast_stack_vs_monotonic_stack_intro",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "ordinary_push_pop_vs_monotonic_pop_rule",
      "primarySkillAtomId": "compare_stack_pop_rules",
      "roadmapNodeId": "contrast_stack_vs_monotonic_stack_intro",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "nested_structure_vs_nearest_greater_problem",
      "primarySkillAtomId": "distinguish_nested_validation_from_nearest_boundary",
      "roadmapNodeId": "contrast_stack_vs_monotonic_stack_intro",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "correctness_invariant_comparison",
      "primarySkillAtomId": "compare_stack_and_monotonic_stack_invariants",
      "roadmapNodeId": "contrast_stack_vs_monotonic_stack_intro",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "amortized_complexity_comparison",
      "primarySkillAtomId": "compare_stack_variant_amortized_complexity",
      "roadmapNodeId": "contrast_stack_vs_monotonic_stack_intro",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "reject_every_stack_is_monotonic",
      "primarySkillAtomId": "reject_every_stack_is_monotonic_heuristic",
      "roadmapNodeId": "contrast_stack_vs_monotonic_stack_intro",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "transfer_stack_variant_choice",
      "primarySkillAtomId": "transfer_stack_variant_choice",
      "roadmapNodeId": "contrast_stack_vs_monotonic_stack_intro",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "stack",
      "legalPatternFamilyIds": [
        "stack",
        "monotonic_stack"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "legal_half_discard_rule",
      "primarySkillAtomId": "compare_half_discard_rule_with_linear_scan",
      "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "sorted_input_is_not_sufficient",
      "primarySkillAtomId": "reject_sorted_input_alone_as_binary_search_proof",
      "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "single_query_cost_comparison",
      "primarySkillAtomId": "compare_single_query_binary_and_linear_cost",
      "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "repeated_queries_and_preprocessing",
      "primarySkillAtomId": "compare_preprocessing_and_repeated_query_cost",
      "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "monotonic_predicate_vs_arbitrary_condition",
      "primarySkillAtomId": "distinguish_monotonic_predicate_from_arbitrary_condition",
      "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "correctness_before_asymptotic_speed",
      "primarySkillAtomId": "prioritize_correctness_in_binary_vs_scan_choice",
      "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "reject_keywords_and_variable_names",
      "primarySkillAtomId": "reject_keyword_based_binary_search_classification",
      "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "transfer_binary_search_vs_linear_scan",
      "primarySkillAtomId": "transfer_binary_search_vs_scan_decision",
      "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
      "unitKind": "contrast",
      "primaryPatternFamilyId": "binary_search",
      "legalPatternFamilyIds": [
        "binary_search",
        "arrays_and_strings"
      ],
      "secondarySkillAtomIds": [],
      "learningStage": "contrast_practice",
      "patternVariantIds": [],
      "problemArchetypeIds": [],
      "contrastedMentalUnitIds": [
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    }
  ],
  "patternFamilies": [
    {
      "id": "complexity_and_constraints",
      "primaryMentalUnitId": "assess_scaling_constraints",
      "roadmapNodeId": "complexity_and_constraints"
    },
    {
      "id": "arrays_and_strings",
      "primaryMentalUnitId": "reason_about_indexed_scans",
      "roadmapNodeId": "arrays_and_strings"
    },
    {
      "id": "hash_map_and_set",
      "primaryMentalUnitId": "recognize_hash_lookup_signal",
      "roadmapNodeId": "hash_map_and_set"
    },
    {
      "id": "two_pointers",
      "primaryMentalUnitId": "recognize_two_pointer_signal",
      "roadmapNodeId": "two_pointers"
    },
    {
      "id": "sliding_window",
      "primaryMentalUnitId": "recognize_sliding_window_signal",
      "roadmapNodeId": "sliding_window"
    },
    {
      "id": "prefix_sums",
      "primaryMentalUnitId": "recognize_prefix_accumulation_signal",
      "roadmapNodeId": "prefix_sums"
    },
    {
      "id": "sorting_based",
      "primaryMentalUnitId": "recognize_sorting_as_preprocessing",
      "roadmapNodeId": "sorting_based"
    },
    {
      "id": "stack",
      "primaryMentalUnitId": "recognize_lifo_signal",
      "roadmapNodeId": "stack"
    },
    {
      "id": "monotonic_stack",
      "primaryMentalUnitId": "recognize_monotonic_stack_signal",
      "roadmapNodeId": "stack"
    },
    {
      "id": "binary_search",
      "primaryMentalUnitId": "recognize_binary_search_signal",
      "roadmapNodeId": "binary_search"
    },
    {
      "id": "linked_list",
      "primaryMentalUnitId": "linked_list_structure_and_node_identity",
      "roadmapNodeId": "linked_list"
    },
    {
      "id": "recursion_basics",
      "primaryMentalUnitId": "recognize_recursive_structure",
      "roadmapNodeId": "recursion_basics"
    },
    {
      "id": "tree_traversal",
      "primaryMentalUnitId": "tree_structure_and_recursive_contract",
      "roadmapNodeId": "tree_traversal"
    },
    {
      "id": "heap_priority_queue",
      "primaryMentalUnitId": "recognize_repeated_extreme_signal",
      "roadmapNodeId": "heap_priority_queue"
    },
    {
      "id": "intervals",
      "primaryMentalUnitId": "interval_representation_and_endpoint_semantics",
      "roadmapNodeId": "intervals"
    },
    {
      "id": "backtracking",
      "primaryMentalUnitId": "recognize_backtracking_signal",
      "roadmapNodeId": "backtracking"
    },
    {
      "id": "graph_traversal",
      "primaryMentalUnitId": "recognize_graph_traversal_signal",
      "roadmapNodeId": "graph_traversal"
    },
    {
      "id": "greedy_intro",
      "primaryMentalUnitId": "recognize_greedy_candidate",
      "roadmapNodeId": "greedy_intro"
    },
    {
      "id": "dynamic_programming_intro",
      "primaryMentalUnitId": "recognize_overlapping_subproblems",
      "roadmapNodeId": "dynamic_programming_intro"
    },
    {
      "id": "bit_manipulation",
      "primaryMentalUnitId": "binary_representation_and_masks",
      "roadmapNodeId": "bit_manipulation"
    },
    {
      "id": "math_and_geometry",
      "primaryMentalUnitId": "integer_arithmetic_and_overflow",
      "roadmapNodeId": "math_and_geometry"
    }
  ],
  "patternVariants": [
    {
      "id": "linear_scan",
      "patternFamilyId": "arrays_and_strings"
    },
    {
      "id": "adjacent_scan",
      "patternFamilyId": "arrays_and_strings"
    },
    {
      "id": "frequency_table",
      "patternFamilyId": "arrays_and_strings"
    },
    {
      "id": "stable_compaction",
      "patternFamilyId": "arrays_and_strings"
    },
    {
      "id": "in_place_duplicate_collapse",
      "patternFamilyId": "arrays_and_strings"
    },
    {
      "id": "lookup_by_value",
      "patternFamilyId": "hash_map_and_set"
    },
    {
      "id": "complement_lookup",
      "patternFamilyId": "hash_map_and_set"
    },
    {
      "id": "seen_set",
      "patternFamilyId": "hash_map_and_set"
    },
    {
      "id": "frequency_map",
      "patternFamilyId": "hash_map_and_set"
    },
    {
      "id": "grouping_map",
      "patternFamilyId": "hash_map_and_set"
    },
    {
      "id": "opposite_ends",
      "patternFamilyId": "two_pointers"
    },
    {
      "id": "same_direction_read_write",
      "patternFamilyId": "two_pointers"
    },
    {
      "id": "partition_scan",
      "patternFamilyId": "two_pointers"
    },
    {
      "id": "duplicate_skip",
      "patternFamilyId": "two_pointers"
    },
    {
      "id": "fixed_size_window",
      "patternFamilyId": "sliding_window"
    },
    {
      "id": "variable_size_positive_numbers",
      "patternFamilyId": "sliding_window"
    },
    {
      "id": "frequency_constraint",
      "patternFamilyId": "sliding_window"
    },
    {
      "id": "at_most_k_window",
      "patternFamilyId": "sliding_window"
    },
    {
      "id": "one_dimensional_prefix",
      "patternFamilyId": "prefix_sums"
    },
    {
      "id": "range_sum_query",
      "patternFamilyId": "prefix_sums"
    },
    {
      "id": "prefix_hash_frequency",
      "patternFamilyId": "prefix_sums"
    },
    {
      "id": "difference_array",
      "patternFamilyId": "prefix_sums"
    },
    {
      "id": "two_dimensional_prefix",
      "patternFamilyId": "prefix_sums"
    },
    {
      "id": "sort_then_scan",
      "patternFamilyId": "sorting_based"
    },
    {
      "id": "sort_then_two_pointers",
      "patternFamilyId": "sorting_based"
    },
    {
      "id": "grouping_after_sort",
      "patternFamilyId": "sorting_based"
    },
    {
      "id": "custom_key_sort",
      "patternFamilyId": "sorting_based"
    },
    {
      "id": "nested_structure_validation",
      "patternFamilyId": "stack"
    },
    {
      "id": "undo_or_previous_state",
      "patternFamilyId": "stack"
    },
    {
      "id": "monotonic_increasing_stack",
      "patternFamilyId": "monotonic_stack"
    },
    {
      "id": "monotonic_decreasing_stack",
      "patternFamilyId": "monotonic_stack"
    },
    {
      "id": "next_greater_smaller",
      "patternFamilyId": "monotonic_stack"
    },
    {
      "id": "classic_index_search",
      "patternFamilyId": "binary_search"
    },
    {
      "id": "lower_bound",
      "patternFamilyId": "binary_search"
    },
    {
      "id": "upper_bound",
      "patternFamilyId": "binary_search"
    },
    {
      "id": "binary_search_on_answer",
      "patternFamilyId": "binary_search"
    },
    {
      "id": "monotonic_predicate_search",
      "patternFamilyId": "binary_search"
    },
    {
      "id": "rotated_array_search",
      "patternFamilyId": "binary_search"
    },
    {
      "id": "pointer_rewiring",
      "patternFamilyId": "linked_list"
    },
    {
      "id": "reverse_list",
      "patternFamilyId": "linked_list"
    },
    {
      "id": "fast_slow_pointer",
      "patternFamilyId": "linked_list"
    },
    {
      "id": "merge_lists",
      "patternFamilyId": "linked_list"
    },
    {
      "id": "dummy_head",
      "patternFamilyId": "linked_list"
    },
    {
      "id": "base_case_recognition",
      "patternFamilyId": "recursion_basics"
    },
    {
      "id": "recursive_decomposition",
      "patternFamilyId": "recursion_basics"
    },
    {
      "id": "divide_and_combine",
      "patternFamilyId": "recursion_basics"
    },
    {
      "id": "tail_recursion_intro",
      "patternFamilyId": "recursion_basics"
    },
    {
      "id": "dfs_preorder",
      "patternFamilyId": "tree_traversal"
    },
    {
      "id": "dfs_inorder",
      "patternFamilyId": "tree_traversal"
    },
    {
      "id": "dfs_postorder",
      "patternFamilyId": "tree_traversal"
    },
    {
      "id": "bfs_level_order",
      "patternFamilyId": "tree_traversal"
    },
    {
      "id": "path_accumulation",
      "patternFamilyId": "tree_traversal"
    },
    {
      "id": "subtree_aggregation",
      "patternFamilyId": "tree_traversal"
    },
    {
      "id": "top_k",
      "patternFamilyId": "heap_priority_queue"
    },
    {
      "id": "running_extreme",
      "patternFamilyId": "heap_priority_queue"
    },
    {
      "id": "k_way_merge",
      "patternFamilyId": "heap_priority_queue"
    },
    {
      "id": "bounded_heap",
      "patternFamilyId": "heap_priority_queue"
    },
    {
      "id": "merge_overlaps",
      "patternFamilyId": "intervals"
    },
    {
      "id": "insert_interval",
      "patternFamilyId": "intervals"
    },
    {
      "id": "sweep_line_intro",
      "patternFamilyId": "intervals"
    },
    {
      "id": "interval_resource_count",
      "patternFamilyId": "intervals"
    },
    {
      "id": "choice_tree",
      "patternFamilyId": "backtracking"
    },
    {
      "id": "constraints_and_pruning",
      "patternFamilyId": "backtracking"
    },
    {
      "id": "duplicate_control",
      "patternFamilyId": "backtracking"
    },
    {
      "id": "grid_search",
      "patternFamilyId": "backtracking"
    },
    {
      "id": "partition_search",
      "patternFamilyId": "backtracking"
    },
    {
      "id": "adjacency_list",
      "patternFamilyId": "graph_traversal"
    },
    {
      "id": "graph_dfs",
      "patternFamilyId": "graph_traversal"
    },
    {
      "id": "graph_bfs",
      "patternFamilyId": "graph_traversal"
    },
    {
      "id": "multi_source_bfs",
      "patternFamilyId": "graph_traversal"
    },
    {
      "id": "connected_components",
      "patternFamilyId": "graph_traversal"
    },
    {
      "id": "topological_order_intro",
      "patternFamilyId": "graph_traversal"
    },
    {
      "id": "grid_graph",
      "patternFamilyId": "graph_traversal"
    },
    {
      "id": "sort_then_greedy",
      "patternFamilyId": "greedy_intro"
    },
    {
      "id": "interval_greedy",
      "patternFamilyId": "greedy_intro"
    },
    {
      "id": "running_best_choice",
      "patternFamilyId": "greedy_intro"
    },
    {
      "id": "greedy_with_heap",
      "patternFamilyId": "greedy_intro"
    },
    {
      "id": "memoization",
      "patternFamilyId": "dynamic_programming_intro"
    },
    {
      "id": "tabulation",
      "patternFamilyId": "dynamic_programming_intro"
    },
    {
      "id": "one_dimensional_dp",
      "patternFamilyId": "dynamic_programming_intro"
    },
    {
      "id": "two_dimensional_dp",
      "patternFamilyId": "dynamic_programming_intro"
    },
    {
      "id": "state_compression",
      "patternFamilyId": "dynamic_programming_intro"
    },
    {
      "id": "bit_mask",
      "patternFamilyId": "bit_manipulation"
    },
    {
      "id": "xor_cancellation",
      "patternFamilyId": "bit_manipulation"
    },
    {
      "id": "lowest_set_bit",
      "patternFamilyId": "bit_manipulation"
    },
    {
      "id": "subset_mask",
      "patternFamilyId": "bit_manipulation"
    },
    {
      "id": "euclidean_algorithm",
      "patternFamilyId": "math_and_geometry"
    },
    {
      "id": "modular_arithmetic",
      "patternFamilyId": "math_and_geometry"
    },
    {
      "id": "prime_factorization",
      "patternFamilyId": "math_and_geometry"
    },
    {
      "id": "vector_orientation",
      "patternFamilyId": "math_and_geometry"
    },
    {
      "id": "coordinate_transform",
      "patternFamilyId": "math_and_geometry"
    }
  ],
  "problemArchetypes": [
    {
      "id": "analyze_scaling_limit",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ]
    },
    {
      "id": "compare_solution_costs",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ]
    },
    {
      "id": "repeated_query_cost_model",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ]
    },
    {
      "id": "output_sensitive_analysis",
      "legalPatternFamilyIds": [
        "complexity_and_constraints"
      ]
    },
    {
      "id": "scan_indexed_sequence",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ]
    },
    {
      "id": "normalize_and_compare_sequences",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ]
    },
    {
      "id": "remove_or_compact_in_place",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ]
    },
    {
      "id": "count_or_group_values",
      "legalPatternFamilyIds": [
        "arrays_and_strings"
      ]
    },
    {
      "id": "find_pair_with_condition",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ]
    },
    {
      "id": "detect_duplicate_or_membership",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ]
    },
    {
      "id": "group_or_count_values",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ]
    },
    {
      "id": "preserve_original_index",
      "legalPatternFamilyIds": [
        "hash_map_and_set"
      ]
    },
    {
      "id": "find_pair_in_sorted_input",
      "legalPatternFamilyIds": [
        "two_pointers"
      ]
    },
    {
      "id": "compact_sequence_in_place",
      "legalPatternFamilyIds": [
        "two_pointers"
      ]
    },
    {
      "id": "partition_sequence",
      "legalPatternFamilyIds": [
        "two_pointers",
        "backtracking"
      ]
    },
    {
      "id": "compare_from_both_ends",
      "legalPatternFamilyIds": [
        "two_pointers"
      ]
    },
    {
      "id": "contiguous_range_optimum",
      "legalPatternFamilyIds": [
        "sliding_window"
      ]
    },
    {
      "id": "longest_valid_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ]
    },
    {
      "id": "shortest_threshold_window",
      "legalPatternFamilyIds": [
        "sliding_window"
      ]
    },
    {
      "id": "fixed_length_aggregate",
      "legalPatternFamilyIds": [
        "sliding_window"
      ]
    },
    {
      "id": "range_query",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ]
    },
    {
      "id": "count_subarrays_by_prefix",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ]
    },
    {
      "id": "batch_range_updates",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ]
    },
    {
      "id": "matrix_region_sum",
      "legalPatternFamilyIds": [
        "prefix_sums"
      ]
    },
    {
      "id": "reveal_ordered_structure",
      "legalPatternFamilyIds": [
        "sorting_based"
      ]
    },
    {
      "id": "group_equal_values",
      "legalPatternFamilyIds": [
        "sorting_based"
      ]
    },
    {
      "id": "pair_search_after_sort",
      "legalPatternFamilyIds": [
        "sorting_based"
      ]
    },
    {
      "id": "process_by_priority_key",
      "legalPatternFamilyIds": [
        "sorting_based"
      ]
    },
    {
      "id": "validate_nested_structure",
      "legalPatternFamilyIds": [
        "stack"
      ]
    },
    {
      "id": "nearest_greater_or_smaller",
      "legalPatternFamilyIds": [
        "stack"
      ]
    },
    {
      "id": "deferred_resolution",
      "legalPatternFamilyIds": [
        "stack"
      ]
    },
    {
      "id": "undo_previous_state",
      "legalPatternFamilyIds": [
        "stack"
      ]
    },
    {
      "id": "find_index_in_sorted_input",
      "legalPatternFamilyIds": [
        "binary_search"
      ]
    },
    {
      "id": "find_first_valid_position",
      "legalPatternFamilyIds": [
        "binary_search"
      ]
    },
    {
      "id": "find_last_valid_position",
      "legalPatternFamilyIds": [
        "binary_search"
      ]
    },
    {
      "id": "minimize_feasible_answer",
      "legalPatternFamilyIds": [
        "binary_search"
      ]
    },
    {
      "id": "maximize_feasible_answer",
      "legalPatternFamilyIds": [
        "binary_search"
      ]
    },
    {
      "id": "search_rotated_sequence",
      "legalPatternFamilyIds": [
        "binary_search"
      ]
    },
    {
      "id": "reverse_linked_structure",
      "legalPatternFamilyIds": [
        "linked_list"
      ]
    },
    {
      "id": "detect_cycle",
      "legalPatternFamilyIds": [
        "linked_list"
      ]
    },
    {
      "id": "merge_ordered_lists",
      "legalPatternFamilyIds": [
        "linked_list"
      ]
    },
    {
      "id": "remove_or_rewire_node",
      "legalPatternFamilyIds": [
        "linked_list"
      ]
    },
    {
      "id": "find_middle_node",
      "legalPatternFamilyIds": [
        "linked_list"
      ]
    },
    {
      "id": "traverse_recursive_structure",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ]
    },
    {
      "id": "compute_from_smaller_input",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ]
    },
    {
      "id": "divide_problem",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ]
    },
    {
      "id": "generate_recursive_result",
      "legalPatternFamilyIds": [
        "recursion_basics"
      ]
    },
    {
      "id": "traverse_tree",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ]
    },
    {
      "id": "compute_subtree_property",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ]
    },
    {
      "id": "root_to_leaf_path",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ]
    },
    {
      "id": "level_order_processing",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ]
    },
    {
      "id": "validate_tree_property",
      "legalPatternFamilyIds": [
        "tree_traversal"
      ]
    },
    {
      "id": "choose_repeated_extreme",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ]
    },
    {
      "id": "maintain_top_k",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ]
    },
    {
      "id": "merge_sorted_sources",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ]
    },
    {
      "id": "schedule_by_priority",
      "legalPatternFamilyIds": [
        "heap_priority_queue"
      ]
    },
    {
      "id": "merge_or_compare_intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ]
    },
    {
      "id": "detect_schedule_conflict",
      "legalPatternFamilyIds": [
        "intervals"
      ]
    },
    {
      "id": "count_concurrent_intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ]
    },
    {
      "id": "insert_into_merged_intervals",
      "legalPatternFamilyIds": [
        "intervals"
      ]
    },
    {
      "id": "enumerate_combinations",
      "legalPatternFamilyIds": [
        "backtracking"
      ]
    },
    {
      "id": "enumerate_permutations",
      "legalPatternFamilyIds": [
        "backtracking"
      ]
    },
    {
      "id": "search_grid_paths",
      "legalPatternFamilyIds": [
        "backtracking"
      ]
    },
    {
      "id": "construct_valid_assignment",
      "legalPatternFamilyIds": [
        "backtracking"
      ]
    },
    {
      "id": "traverse_connected_state",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ]
    },
    {
      "id": "shortest_unweighted_path",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ]
    },
    {
      "id": "count_components",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ]
    },
    {
      "id": "propagate_from_multiple_sources",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ]
    },
    {
      "id": "order_dependencies",
      "legalPatternFamilyIds": [
        "graph_traversal"
      ]
    },
    {
      "id": "choose_non_overlapping_set",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ]
    },
    {
      "id": "minimize_or_maximize_local_cost",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ]
    },
    {
      "id": "schedule_by_deadline",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ]
    },
    {
      "id": "construct_optimal_sequence",
      "legalPatternFamilyIds": [
        "greedy_intro"
      ]
    },
    {
      "id": "count_ways",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ]
    },
    {
      "id": "optimize_prefix_or_suffix",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ]
    },
    {
      "id": "choose_or_skip",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ]
    },
    {
      "id": "grid_path_dp",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ]
    },
    {
      "id": "sequence_alignment_intro",
      "legalPatternFamilyIds": [
        "dynamic_programming_intro"
      ]
    },
    {
      "id": "encode_boolean_state",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ]
    },
    {
      "id": "find_unique_element",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ]
    },
    {
      "id": "enumerate_subsets_by_mask",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ]
    },
    {
      "id": "count_set_bits",
      "legalPatternFamilyIds": [
        "bit_manipulation"
      ]
    },
    {
      "id": "divisibility_and_cycles",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ]
    },
    {
      "id": "compute_gcd_lcm",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ]
    },
    {
      "id": "count_or_generate_primes",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ]
    },
    {
      "id": "compare_geometric_orientation",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ]
    },
    {
      "id": "normalize_coordinates",
      "legalPatternFamilyIds": [
        "math_and_geometry"
      ]
    }
  ],
  "skillAtoms": [
    {
      "id": "translate_constraints_to_operation_budget",
      "primaryMentalUnitId": "assess_scaling_constraints"
    },
    {
      "id": "reject_infeasible_complexity",
      "primaryMentalUnitId": "reject_infeasible_bruteforce"
    },
    {
      "id": "derive_time_complexity",
      "primaryMentalUnitId": "derive_time_complexity"
    },
    {
      "id": "derive_space_complexity",
      "primaryMentalUnitId": "derive_space_complexity"
    },
    {
      "id": "distinguish_amortized_from_worst_case",
      "primaryMentalUnitId": "amortized_complexity"
    },
    {
      "id": "compare_preprocessing_and_query_cost",
      "primaryMentalUnitId": "preprocessing_and_query_tradeoffs"
    },
    {
      "id": "recognize_output_sensitive_lower_bound",
      "primaryMentalUnitId": "output_sensitive_and_lower_bounds"
    },
    {
      "id": "explain_complexity_from_executed_operations",
      "primaryMentalUnitId": "complexity_explanation_and_mistake_review"
    },
    {
      "id": "track_index_boundary",
      "primaryMentalUnitId": "reason_about_indexed_scans"
    },
    {
      "id": "choose_frequency_state",
      "primaryMentalUnitId": "frequency_and_seen_state"
    },
    {
      "id": "apply_sequence_normalization",
      "primaryMentalUnitId": "normalization_and_comparison"
    },
    {
      "id": "maintain_read_write_boundary",
      "primaryMentalUnitId": "stable_in_place_compaction"
    },
    {
      "id": "preserve_duplicate_contract",
      "primaryMentalUnitId": "duplicate_handling"
    },
    {
      "id": "diagnose_sequence_shape_edge_case",
      "primaryMentalUnitId": "sequence_shape_and_edge_cases"
    },
    {
      "id": "distinguish_output_from_auxiliary_space",
      "primaryMentalUnitId": "output_contract_and_space"
    },
    {
      "id": "identify_lookup_state_signal",
      "primaryMentalUnitId": "recognize_hash_lookup_signal"
    },
    {
      "id": "distinguish_set_from_map_state",
      "primaryMentalUnitId": "choose_set_vs_map_state"
    },
    {
      "id": "derive_complement_lookup",
      "primaryMentalUnitId": "complement_lookup"
    },
    {
      "id": "maintain_frequency_map",
      "primaryMentalUnitId": "frequency_counting"
    },
    {
      "id": "choose_grouping_key",
      "primaryMentalUnitId": "grouping_and_bucket_state"
    },
    {
      "id": "preserve_original_index_in_lookup_state",
      "primaryMentalUnitId": "preserve_indices_and_provenance"
    },
    {
      "id": "explain_expected_hash_lookup_complexity",
      "primaryMentalUnitId": "expected_complexity_and_hash_assumptions"
    },
    {
      "id": "diagnose_hash_state_mismatch",
      "primaryMentalUnitId": "hash_state_mistake_review"
    },
    {
      "id": "identify_coordinated_boundary_signal",
      "primaryMentalUnitId": "recognize_two_pointer_signal"
    },
    {
      "id": "move_decisive_pointer",
      "primaryMentalUnitId": "opposite_ends_pair_search"
    },
    {
      "id": "maintain_read_write_pointer_invariant",
      "primaryMentalUnitId": "same_direction_read_write"
    },
    {
      "id": "justify_candidate_elimination_by_pointer_move",
      "primaryMentalUnitId": "converging_boundaries_and_proof"
    },
    {
      "id": "skip_duplicates_without_losing_solutions",
      "primaryMentalUnitId": "duplicate_skipping"
    },
    {
      "id": "partition_sequence_with_pointers",
      "primaryMentalUnitId": "partitioning_by_predicate"
    },
    {
      "id": "validate_sorted_input_dependency",
      "primaryMentalUnitId": "sorted_input_precondition"
    },
    {
      "id": "diagnose_invalid_pointer_movement",
      "primaryMentalUnitId": "pointer_movement_mistake_review"
    },
    {
      "id": "identify_contiguous_window_signal",
      "primaryMentalUnitId": "recognize_sliding_window_signal"
    },
    {
      "id": "maintain_fixed_size_window_state",
      "primaryMentalUnitId": "fixed_size_window"
    },
    {
      "id": "maintain_monotonic_shrink_rule",
      "primaryMentalUnitId": "variable_size_monotonic_window"
    },
    {
      "id": "maintain_frequency_constrained_window",
      "primaryMentalUnitId": "frequency_constrained_window"
    },
    {
      "id": "order_window_state_updates",
      "primaryMentalUnitId": "expand_shrink_update_order"
    },
    {
      "id": "update_window_answer_at_legal_state",
      "primaryMentalUnitId": "answer_update_and_boundaries"
    },
    {
      "id": "detect_simple_window_failure_signal",
      "primaryMentalUnitId": "invalid_window_signals"
    },
    {
      "id": "explain_linear_window_complexity",
      "primaryMentalUnitId": "window_complexity_and_mistake_review"
    },
    {
      "id": "identify_reusable_prefix_state",
      "primaryMentalUnitId": "recognize_prefix_accumulation_signal"
    },
    {
      "id": "construct_prefix_accumulation",
      "primaryMentalUnitId": "build_one_dimensional_prefix"
    },
    {
      "id": "derive_range_from_prefix_difference",
      "primaryMentalUnitId": "answer_range_queries"
    },
    {
      "id": "match_required_prior_prefix",
      "primaryMentalUnitId": "prefix_sum_with_hash_state"
    },
    {
      "id": "encode_range_updates_by_differences",
      "primaryMentalUnitId": "difference_array_updates"
    },
    {
      "id": "derive_matrix_region_from_prefixes",
      "primaryMentalUnitId": "two_dimensional_prefix"
    },
    {
      "id": "maintain_prefix_boundary_convention",
      "primaryMentalUnitId": "prefix_index_conventions"
    },
    {
      "id": "choose_prefix_over_moving_window",
      "primaryMentalUnitId": "prefix_vs_window_tradeoff"
    },
    {
      "id": "identify_structure_revealed_by_sorting",
      "primaryMentalUnitId": "recognize_sorting_as_preprocessing"
    },
    {
      "id": "exploit_adjacent_order_after_sort",
      "primaryMentalUnitId": "sort_then_scan"
    },
    {
      "id": "combine_sorting_with_pointer_search",
      "primaryMentalUnitId": "sort_then_two_pointers"
    },
    {
      "id": "process_equal_value_runs",
      "primaryMentalUnitId": "group_equal_values_after_sort"
    },
    {
      "id": "define_total_sort_order",
      "primaryMentalUnitId": "custom_key_and_tie_breaking"
    },
    {
      "id": "preserve_original_identity_through_sorting",
      "primaryMentalUnitId": "preserve_original_positions"
    },
    {
      "id": "account_for_sorting_cost_and_mutation",
      "primaryMentalUnitId": "sorting_cost_and_side_effects"
    },
    {
      "id": "diagnose_invalid_sorting_assumption",
      "primaryMentalUnitId": "sorting_based_mistake_review"
    },
    {
      "id": "identify_last_unresolved_state",
      "primaryMentalUnitId": "recognize_lifo_signal"
    },
    {
      "id": "trace_stack_operation",
      "primaryMentalUnitId": "push_pop_top_mechanics"
    },
    {
      "id": "match_nested_structure_with_stack",
      "primaryMentalUnitId": "nested_structure_validation"
    },
    {
      "id": "restore_previous_state_from_stack",
      "primaryMentalUnitId": "undo_and_previous_state"
    },
    {
      "id": "identify_dominated_candidate_signal",
      "primaryMentalUnitId": "recognize_monotonic_stack_signal"
    },
    {
      "id": "maintain_monotonic_stack_order",
      "primaryMentalUnitId": "maintain_monotonic_stack_invariant"
    },
    {
      "id": "resolve_nearest_greater_or_smaller",
      "primaryMentalUnitId": "next_greater_smaller_boundaries"
    },
    {
      "id": "explain_amortized_stack_processing",
      "primaryMentalUnitId": "stack_complexity_and_mistake_review"
    },
    {
      "id": "identify_legal_half_discard_rule",
      "primaryMentalUnitId": "recognize_binary_search_signal"
    },
    {
      "id": "maintain_classic_search_invariant",
      "primaryMentalUnitId": "classic_index_search"
    },
    {
      "id": "preserve_binary_search_boundary_contract",
      "primaryMentalUnitId": "boundaries_and_loop_invariants"
    },
    {
      "id": "find_first_or_last_valid_boundary",
      "primaryMentalUnitId": "lower_and_upper_bound"
    },
    {
      "id": "search_feasible_answer_space",
      "primaryMentalUnitId": "binary_search_on_answer"
    },
    {
      "id": "identify_monotonic_predicate",
      "primaryMentalUnitId": "monotonic_predicate_search"
    },
    {
      "id": "identify_ordered_half_in_rotated_input",
      "primaryMentalUnitId": "rotated_array_search"
    },
    {
      "id": "distinguish_node_identity_from_node_value",
      "primaryMentalUnitId": "linked_list_structure_and_node_identity"
    },
    {
      "id": "preserve_reachable_nodes_during_rewire",
      "primaryMentalUnitId": "pointer_rewiring"
    },
    {
      "id": "reverse_link_direction_iteratively",
      "primaryMentalUnitId": "reverse_list_iterative"
    },
    {
      "id": "maintain_relative_pointer_speed",
      "primaryMentalUnitId": "fast_and_slow_pointers"
    },
    {
      "id": "detect_cycle_by_pointer_convergence",
      "primaryMentalUnitId": "cycle_detection"
    },
    {
      "id": "merge_nodes_without_losing_links",
      "primaryMentalUnitId": "merge_and_splice_lists"
    },
    {
      "id": "simplify_head_boundary_with_sentinel",
      "primaryMentalUnitId": "dummy_and_sentinel_nodes"
    },
    {
      "id": "diagnose_linked_list_rewiring_error",
      "primaryMentalUnitId": "linked_list_edge_cases_and_mistakes"
    },
    {
      "id": "identify_self_similar_subproblem",
      "primaryMentalUnitId": "recognize_recursive_structure"
    },
    {
      "id": "define_recursive_base_and_return_contract",
      "primaryMentalUnitId": "recursion_base_case_and_result_contract"
    },
    {
      "id": "choose_minimal_recursive_state",
      "primaryMentalUnitId": "choose_recursive_state"
    },
    {
      "id": "prove_recursive_progress",
      "primaryMentalUnitId": "make_progress_toward_base_case"
    },
    {
      "id": "combine_recursive_return_values",
      "primaryMentalUnitId": "combine_subproblem_results"
    },
    {
      "id": "account_for_recursive_call_stack",
      "primaryMentalUnitId": "recursion_stack_and_complexity"
    },
    {
      "id": "diagnose_nonterminating_or_incomplete_recursion",
      "primaryMentalUnitId": "recursion_mistake_review"
    },
    {
      "id": "define_tree_subproblem_contract",
      "primaryMentalUnitId": "tree_structure_and_recursive_contract"
    },
    {
      "id": "apply_preorder_processing",
      "primaryMentalUnitId": "dfs_preorder"
    },
    {
      "id": "apply_inorder_processing",
      "primaryMentalUnitId": "dfs_inorder"
    },
    {
      "id": "apply_postorder_processing",
      "primaryMentalUnitId": "dfs_postorder"
    },
    {
      "id": "process_tree_by_levels",
      "primaryMentalUnitId": "bfs_level_order"
    },
    {
      "id": "carry_state_along_tree_path",
      "primaryMentalUnitId": "carry_path_and_aggregate_state"
    },
    {
      "id": "derive_parent_result_from_subtrees",
      "primaryMentalUnitId": "subtree_return_values"
    },
    {
      "id": "handle_empty_and_leaf_boundaries",
      "primaryMentalUnitId": "tree_boundaries_and_null_cases"
    },
    {
      "id": "choose_tree_traversal_order",
      "primaryMentalUnitId": "traversal_choice_and_complexity"
    },
    {
      "id": "identify_repeated_extreme_requirement",
      "primaryMentalUnitId": "recognize_repeated_extreme_signal"
    },
    {
      "id": "trace_heap_operation",
      "primaryMentalUnitId": "heap_push_pop_peek_mechanics"
    },
    {
      "id": "maintain_bounded_top_k_heap",
      "primaryMentalUnitId": "top_k_selection"
    },
    {
      "id": "merge_sorted_sources_with_heap",
      "primaryMentalUnitId": "k_way_merge"
    },
    {
      "id": "maintain_streaming_extreme",
      "primaryMentalUnitId": "running_extreme_and_streaming"
    },
    {
      "id": "choose_heap_orientation",
      "primaryMentalUnitId": "min_heap_vs_max_heap_choice"
    },
    {
      "id": "derive_heap_cost_from_heap_size",
      "primaryMentalUnitId": "heap_complexity_and_size_k"
    },
    {
      "id": "diagnose_heap_state_mismatch",
      "primaryMentalUnitId": "heap_mistake_review"
    },
    {
      "id": "define_interval_endpoint_contract",
      "primaryMentalUnitId": "interval_representation_and_endpoint_semantics"
    },
    {
      "id": "choose_interval_sort_key",
      "primaryMentalUnitId": "sort_intervals_for_processing"
    },
    {
      "id": "evaluate_interval_overlap",
      "primaryMentalUnitId": "detect_overlap"
    },
    {
      "id": "merge_overlapping_intervals",
      "primaryMentalUnitId": "merge_overlaps"
    },
    {
      "id": "insert_interval_into_merged_sequence",
      "primaryMentalUnitId": "insert_interval"
    },
    {
      "id": "count_concurrent_intervals",
      "primaryMentalUnitId": "meeting_rooms_and_resource_count"
    },
    {
      "id": "process_interval_events_in_order",
      "primaryMentalUnitId": "sweep_line_intro"
    },
    {
      "id": "diagnose_interval_endpoint_error",
      "primaryMentalUnitId": "interval_boundary_mistake_review"
    },
    {
      "id": "identify_choice_tree_search",
      "primaryMentalUnitId": "recognize_backtracking_signal"
    },
    {
      "id": "define_backtracking_completion_contract",
      "primaryMentalUnitId": "backtracking_base_case_and_result_contract"
    },
    {
      "id": "choose_backtracking_state",
      "primaryMentalUnitId": "choose_backtracking_state"
    },
    {
      "id": "enumerate_legal_next_choices",
      "primaryMentalUnitId": "enumerate_choices"
    },
    {
      "id": "restore_path_state_after_branch",
      "primaryMentalUnitId": "path_state_and_undo"
    },
    {
      "id": "prune_impossible_partial_solution",
      "primaryMentalUnitId": "constraint_pruning"
    },
    {
      "id": "prevent_duplicate_search_results",
      "primaryMentalUnitId": "duplicate_control"
    },
    {
      "id": "maintain_grid_search_visited_state",
      "primaryMentalUnitId": "grid_search_backtracking"
    },
    {
      "id": "choose_partition_boundary",
      "primaryMentalUnitId": "partitioning_and_segmentation"
    },
    {
      "id": "choose_graph_representation",
      "primaryMentalUnitId": "graph_representation"
    },
    {
      "id": "identify_connected_state_search",
      "primaryMentalUnitId": "recognize_graph_traversal_signal"
    },
    {
      "id": "traverse_graph_depth_first",
      "primaryMentalUnitId": "graph_dfs"
    },
    {
      "id": "traverse_graph_breadth_first",
      "primaryMentalUnitId": "graph_bfs"
    },
    {
      "id": "maintain_graph_visited_state",
      "primaryMentalUnitId": "visited_state_and_cycles"
    },
    {
      "id": "count_connected_components",
      "primaryMentalUnitId": "connected_components"
    },
    {
      "id": "initialize_multi_source_frontier",
      "primaryMentalUnitId": "multi_source_bfs"
    },
    {
      "id": "map_grid_cells_to_graph_state",
      "primaryMentalUnitId": "grid_as_graph"
    },
    {
      "id": "process_dependency_order",
      "primaryMentalUnitId": "topological_order_intro"
    },
    {
      "id": "derive_graph_traversal_complexity",
      "primaryMentalUnitId": "graph_complexity_and_mistakes"
    },
    {
      "id": "identify_greedy_choice_structure",
      "primaryMentalUnitId": "recognize_greedy_candidate"
    },
    {
      "id": "define_local_optimization_rule",
      "primaryMentalUnitId": "define_local_choice"
    },
    {
      "id": "justify_greedy_choice_safety",
      "primaryMentalUnitId": "prove_safe_choice"
    },
    {
      "id": "construct_basic_exchange_argument",
      "primaryMentalUnitId": "exchange_argument_intro"
    },
    {
      "id": "choose_sort_key_for_greedy_process",
      "primaryMentalUnitId": "sort_then_greedy"
    },
    {
      "id": "choose_interval_greedy_boundary",
      "primaryMentalUnitId": "interval_greedy"
    },
    {
      "id": "detect_missing_greedy_choice_property",
      "primaryMentalUnitId": "greedy_failure_signals"
    },
    {
      "id": "diagnose_unsupported_greedy_reasoning",
      "primaryMentalUnitId": "greedy_mistake_review"
    },
    {
      "id": "identify_reused_subproblem",
      "primaryMentalUnitId": "recognize_overlapping_subproblems"
    },
    {
      "id": "define_sufficient_dp_state",
      "primaryMentalUnitId": "define_dp_state"
    },
    {
      "id": "derive_dp_transition",
      "primaryMentalUnitId": "define_transition"
    },
    {
      "id": "initialize_dp_base_cases",
      "primaryMentalUnitId": "base_cases_and_initialization"
    },
    {
      "id": "memoize_recursive_subproblem",
      "primaryMentalUnitId": "memoization_top_down"
    },
    {
      "id": "tabulate_subproblems_bottom_up",
      "primaryMentalUnitId": "tabulation_bottom_up"
    },
    {
      "id": "choose_dependency_safe_iteration_order",
      "primaryMentalUnitId": "iteration_order"
    },
    {
      "id": "compress_dp_state_safely",
      "primaryMentalUnitId": "optimize_state_space"
    },
    {
      "id": "model_one_dimensional_dp",
      "primaryMentalUnitId": "one_dimensional_dp"
    },
    {
      "id": "model_two_dimensional_dp",
      "primaryMentalUnitId": "two_dimensional_dp_intro"
    },
    {
      "id": "reconstruct_choice_from_dp_state",
      "primaryMentalUnitId": "reconstruct_solution_intro"
    },
    {
      "id": "diagnose_incomplete_dp_state_or_transition",
      "primaryMentalUnitId": "dp_mistake_review"
    },
    {
      "id": "interpret_integer_bit_representation",
      "primaryMentalUnitId": "binary_representation_and_masks"
    },
    {
      "id": "manipulate_selected_bit",
      "primaryMentalUnitId": "test_set_clear_toggle_bits"
    },
    {
      "id": "reason_about_bit_shift_behavior",
      "primaryMentalUnitId": "shifts_and_sign_behavior"
    },
    {
      "id": "apply_xor_cancellation",
      "primaryMentalUnitId": "xor_cancellation"
    },
    {
      "id": "remove_lowest_set_bit",
      "primaryMentalUnitId": "count_bits_and_lowest_set_bit"
    },
    {
      "id": "enumerate_subset_by_bitmask",
      "primaryMentalUnitId": "subset_mask_enumeration_intro"
    },
    {
      "id": "encode_boolean_state_in_mask",
      "primaryMentalUnitId": "bitmask_state_representation"
    },
    {
      "id": "diagnose_bit_width_or_sign_assumption",
      "primaryMentalUnitId": "bit_manipulation_mistake_review"
    },
    {
      "id": "avoid_integer_overflow_in_computation",
      "primaryMentalUnitId": "integer_arithmetic_and_overflow"
    },
    {
      "id": "apply_euclidean_algorithm",
      "primaryMentalUnitId": "gcd_lcm_and_divisibility"
    },
    {
      "id": "preserve_modular_equivalence",
      "primaryMentalUnitId": "modular_arithmetic"
    },
    {
      "id": "derive_prime_factorization_or_sieve",
      "primaryMentalUnitId": "primes_and_factorization"
    },
    {
      "id": "represent_geometric_relation_with_vectors",
      "primaryMentalUnitId": "coordinate_and_vector_basics"
    },
    {
      "id": "compare_geometric_quantities_without_unsafe_division",
      "primaryMentalUnitId": "distance_and_slope_without_precision_loss"
    },
    {
      "id": "normalize_cyclic_or_coordinate_value",
      "primaryMentalUnitId": "interval_and_angle_normalization"
    },
    {
      "id": "diagnose_degenerate_or_precision_case",
      "primaryMentalUnitId": "geometry_boundary_and_precision_mistakes"
    },
    {
      "id": "extract_strategy_decision_signals",
      "primaryMentalUnitId": "extract_constraints_and_output_contract"
    },
    {
      "id": "generate_plausible_algorithmic_approaches",
      "primaryMentalUnitId": "generate_candidate_strategies"
    },
    {
      "id": "reject_strategy_without_required_invariant",
      "primaryMentalUnitId": "reject_illegal_strategies"
    },
    {
      "id": "compare_candidate_cost_models",
      "primaryMentalUnitId": "compare_time_space_and_preprocessing"
    },
    {
      "id": "choose_strategy_for_query_volume",
      "primaryMentalUnitId": "choose_for_single_vs_repeated_queries"
    },
    {
      "id": "prioritize_correctness_before_asymptotic_speed",
      "primaryMentalUnitId": "correctness_before_optimization"
    },
    {
      "id": "justify_strategy_with_constraints_and_invariants",
      "primaryMentalUnitId": "justify_strategy_choice"
    },
    {
      "id": "transfer_strategy_selection_to_new_surface_form",
      "primaryMentalUnitId": "transfer_to_unfamiliar_problem"
    },
    {
      "id": "distinguish_lookup_from_ordering_signal",
      "primaryMentalUnitId": "lookup_vs_ordering_signal"
    },
    {
      "id": "compare_expected_hash_and_sorting_cost",
      "primaryMentalUnitId": "expected_linear_vs_n_log_n_cost"
    },
    {
      "id": "compare_hash_memory_with_sort_mutation",
      "primaryMentalUnitId": "memory_vs_mutation_tradeoff"
    },
    {
      "id": "choose_hash_or_sort_for_duplicates_and_grouping",
      "primaryMentalUnitId": "duplicates_and_grouping_boundary"
    },
    {
      "id": "preserve_order_and_indices_across_strategy_choice",
      "primaryMentalUnitId": "preservation_of_order_and_indices"
    },
    {
      "id": "choose_hash_or_sort_for_query_volume",
      "primaryMentalUnitId": "single_pass_vs_repeated_queries"
    },
    {
      "id": "reject_hash_map_always_faster_heuristic",
      "primaryMentalUnitId": "reject_hash_map_always_faster"
    },
    {
      "id": "transfer_hash_vs_sorting_decision",
      "primaryMentalUnitId": "transfer_hash_map_vs_sorting"
    },
    {
      "id": "distinguish_pair_relation_from_contiguous_window",
      "primaryMentalUnitId": "pair_relation_vs_contiguous_range"
    },
    {
      "id": "distinguish_global_pair_search_from_running_window",
      "primaryMentalUnitId": "global_pair_search_vs_running_window"
    },
    {
      "id": "compare_pointer_move_and_window_validity_invariants",
      "primaryMentalUnitId": "pointer_movement_rule_vs_window_validity_rule"
    },
    {
      "id": "distinguish_fixed_pointer_state_from_window_state",
      "primaryMentalUnitId": "fixed_state_vs_variable_window_state"
    },
    {
      "id": "validate_window_shrink_monotonicity",
      "primaryMentalUnitId": "shrink_legality_and_monotonicity"
    },
    {
      "id": "distinguish_sorted_input_signal_from_contiguity_signal",
      "primaryMentalUnitId": "sorted_input_vs_contiguity"
    },
    {
      "id": "reject_two_indices_implies_two_pointers_heuristic",
      "primaryMentalUnitId": "reject_two_indices_means_two_pointers"
    },
    {
      "id": "transfer_two_pointers_vs_window_decision",
      "primaryMentalUnitId": "transfer_two_pointers_vs_sliding_window"
    },
    {
      "id": "identify_positive_monotonic_window_boundary",
      "primaryMentalUnitId": "positive_monotonic_window_boundary"
    },
    {
      "id": "detect_negative_value_window_failure",
      "primaryMentalUnitId": "negative_values_break_simple_window"
    },
    {
      "id": "distinguish_moving_window_from_precomputed_prefix",
      "primaryMentalUnitId": "moving_state_vs_precomputed_state"
    },
    {
      "id": "choose_window_or_prefix_for_query_volume",
      "primaryMentalUnitId": "one_query_vs_many_queries"
    },
    {
      "id": "distinguish_threshold_window_from_exact_sum_prefix",
      "primaryMentalUnitId": "threshold_objective_vs_exact_sum"
    },
    {
      "id": "identify_prefix_hash_state_requirement",
      "primaryMentalUnitId": "prefix_hash_state_boundary"
    },
    {
      "id": "compare_window_and_prefix_time_space_tradeoff",
      "primaryMentalUnitId": "time_space_tradeoff"
    },
    {
      "id": "transfer_window_vs_prefix_decision",
      "primaryMentalUnitId": "transfer_sliding_window_vs_prefix_sums"
    },
    {
      "id": "distinguish_lifo_stack_from_monotonic_candidate_stack",
      "primaryMentalUnitId": "ordinary_lifo_vs_ordered_candidate_stack"
    },
    {
      "id": "distinguish_recent_unresolved_from_dominated_candidate",
      "primaryMentalUnitId": "unresolved_state_vs_dominated_candidate"
    },
    {
      "id": "compare_stack_pop_rules",
      "primaryMentalUnitId": "ordinary_push_pop_vs_monotonic_pop_rule"
    },
    {
      "id": "distinguish_nested_validation_from_nearest_boundary",
      "primaryMentalUnitId": "nested_structure_vs_nearest_greater_problem"
    },
    {
      "id": "compare_stack_and_monotonic_stack_invariants",
      "primaryMentalUnitId": "correctness_invariant_comparison"
    },
    {
      "id": "compare_stack_variant_amortized_complexity",
      "primaryMentalUnitId": "amortized_complexity_comparison"
    },
    {
      "id": "reject_every_stack_is_monotonic_heuristic",
      "primaryMentalUnitId": "reject_every_stack_is_monotonic"
    },
    {
      "id": "transfer_stack_variant_choice",
      "primaryMentalUnitId": "transfer_stack_variant_choice"
    },
    {
      "id": "compare_half_discard_rule_with_linear_scan",
      "primaryMentalUnitId": "legal_half_discard_rule"
    },
    {
      "id": "reject_sorted_input_alone_as_binary_search_proof",
      "primaryMentalUnitId": "sorted_input_is_not_sufficient"
    },
    {
      "id": "compare_single_query_binary_and_linear_cost",
      "primaryMentalUnitId": "single_query_cost_comparison"
    },
    {
      "id": "compare_preprocessing_and_repeated_query_cost",
      "primaryMentalUnitId": "repeated_queries_and_preprocessing"
    },
    {
      "id": "distinguish_monotonic_predicate_from_arbitrary_condition",
      "primaryMentalUnitId": "monotonic_predicate_vs_arbitrary_condition"
    },
    {
      "id": "prioritize_correctness_in_binary_vs_scan_choice",
      "primaryMentalUnitId": "correctness_before_asymptotic_speed"
    },
    {
      "id": "reject_keyword_based_binary_search_classification",
      "primaryMentalUnitId": "reject_keywords_and_variable_names"
    },
    {
      "id": "transfer_binary_search_vs_scan_decision",
      "primaryMentalUnitId": "transfer_binary_search_vs_linear_scan"
    }
  ],
  "falseHeuristics": [
    {
      "id": "nested_loops_always_quadratic",
      "relevantRoadmapNodeIds": [
        "complexity_and_constraints"
      ],
      "relevantMentalUnitIds": [
        "assess_scaling_constraints",
        "reject_infeasible_bruteforce",
        "derive_time_complexity",
        "derive_space_complexity",
        "amortized_complexity",
        "preprocessing_and_query_tradeoffs",
        "output_sensitive_and_lower_bounds",
        "complexity_explanation_and_mistake_review"
      ]
    },
    {
      "id": "variable_names_determine_big_o",
      "relevantRoadmapNodeIds": [
        "complexity_and_constraints"
      ],
      "relevantMentalUnitIds": [
        "assess_scaling_constraints",
        "reject_infeasible_bruteforce",
        "derive_time_complexity",
        "derive_space_complexity",
        "amortized_complexity",
        "preprocessing_and_query_tradeoffs",
        "output_sensitive_and_lower_bounds",
        "complexity_explanation_and_mistake_review"
      ]
    },
    {
      "id": "amortized_equals_worst_case",
      "relevantRoadmapNodeIds": [
        "complexity_and_constraints"
      ],
      "relevantMentalUnitIds": [
        "assess_scaling_constraints",
        "reject_infeasible_bruteforce",
        "derive_time_complexity",
        "derive_space_complexity",
        "amortized_complexity",
        "preprocessing_and_query_tradeoffs",
        "output_sensitive_and_lower_bounds",
        "complexity_explanation_and_mistake_review"
      ]
    },
    {
      "id": "ignore_preprocessing_cost",
      "relevantRoadmapNodeIds": [
        "complexity_and_constraints"
      ],
      "relevantMentalUnitIds": [
        "assess_scaling_constraints",
        "reject_infeasible_bruteforce",
        "derive_time_complexity",
        "derive_space_complexity",
        "amortized_complexity",
        "preprocessing_and_query_tradeoffs",
        "output_sensitive_and_lower_bounds",
        "complexity_explanation_and_mistake_review"
      ]
    },
    {
      "id": "ignore_output_size",
      "relevantRoadmapNodeIds": [
        "complexity_and_constraints"
      ],
      "relevantMentalUnitIds": [
        "assess_scaling_constraints",
        "reject_infeasible_bruteforce",
        "derive_time_complexity",
        "derive_space_complexity",
        "amortized_complexity",
        "preprocessing_and_query_tradeoffs",
        "output_sensitive_and_lower_bounds",
        "complexity_explanation_and_mistake_review"
      ]
    },
    {
      "id": "one_pass_means_constant_space",
      "relevantRoadmapNodeIds": [
        "arrays_and_strings"
      ],
      "relevantMentalUnitIds": [
        "reason_about_indexed_scans",
        "frequency_and_seen_state",
        "normalization_and_comparison",
        "stable_in_place_compaction",
        "duplicate_handling",
        "sequence_shape_and_edge_cases",
        "output_contract_and_space"
      ]
    },
    {
      "id": "sorting_can_ignore_original_order",
      "relevantRoadmapNodeIds": [
        "arrays_and_strings"
      ],
      "relevantMentalUnitIds": [
        "reason_about_indexed_scans",
        "frequency_and_seen_state",
        "normalization_and_comparison",
        "stable_in_place_compaction",
        "duplicate_handling",
        "sequence_shape_and_edge_cases",
        "output_contract_and_space"
      ]
    },
    {
      "id": "duplicate_handling_is_automatic",
      "relevantRoadmapNodeIds": [
        "arrays_and_strings"
      ],
      "relevantMentalUnitIds": [
        "reason_about_indexed_scans",
        "frequency_and_seen_state",
        "normalization_and_comparison",
        "stable_in_place_compaction",
        "duplicate_handling",
        "sequence_shape_and_edge_cases",
        "output_contract_and_space"
      ]
    },
    {
      "id": "output_space_is_auxiliary_space",
      "relevantRoadmapNodeIds": [
        "arrays_and_strings"
      ],
      "relevantMentalUnitIds": [
        "reason_about_indexed_scans",
        "frequency_and_seen_state",
        "normalization_and_comparison",
        "stable_in_place_compaction",
        "duplicate_handling",
        "sequence_shape_and_edge_cases",
        "output_contract_and_space"
      ]
    },
    {
      "id": "hash_lookup_is_worst_case_constant",
      "relevantRoadmapNodeIds": [
        "hash_map_and_set"
      ],
      "relevantMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "choose_set_vs_map_state",
        "complement_lookup",
        "frequency_counting",
        "grouping_and_bucket_state",
        "preserve_indices_and_provenance",
        "expected_complexity_and_hash_assumptions",
        "hash_state_mistake_review"
      ]
    },
    {
      "id": "set_and_map_are_interchangeable",
      "relevantRoadmapNodeIds": [
        "hash_map_and_set"
      ],
      "relevantMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "choose_set_vs_map_state",
        "complement_lookup",
        "frequency_counting",
        "grouping_and_bucket_state",
        "preserve_indices_and_provenance",
        "expected_complexity_and_hash_assumptions",
        "hash_state_mistake_review"
      ]
    },
    {
      "id": "check_after_insert_is_always_safe",
      "relevantRoadmapNodeIds": [
        "hash_map_and_set"
      ],
      "relevantMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "choose_set_vs_map_state",
        "complement_lookup",
        "frequency_counting",
        "grouping_and_bucket_state",
        "preserve_indices_and_provenance",
        "expected_complexity_and_hash_assumptions",
        "hash_state_mistake_review"
      ]
    },
    {
      "id": "frequency_and_presence_are_equivalent",
      "relevantRoadmapNodeIds": [
        "hash_map_and_set"
      ],
      "relevantMentalUnitIds": [
        "recognize_hash_lookup_signal",
        "choose_set_vs_map_state",
        "complement_lookup",
        "frequency_counting",
        "grouping_and_bucket_state",
        "preserve_indices_and_provenance",
        "expected_complexity_and_hash_assumptions",
        "hash_state_mistake_review"
      ]
    },
    {
      "id": "two_indices_means_two_pointers",
      "relevantRoadmapNodeIds": [
        "two_pointers"
      ],
      "relevantMentalUnitIds": [
        "recognize_two_pointer_signal",
        "opposite_ends_pair_search",
        "same_direction_read_write",
        "converging_boundaries_and_proof",
        "duplicate_skipping",
        "partitioning_by_predicate",
        "sorted_input_precondition",
        "pointer_movement_mistake_review"
      ]
    },
    {
      "id": "move_both_pointers_on_every_step",
      "relevantRoadmapNodeIds": [
        "two_pointers"
      ],
      "relevantMentalUnitIds": [
        "recognize_two_pointer_signal",
        "opposite_ends_pair_search",
        "same_direction_read_write",
        "converging_boundaries_and_proof",
        "duplicate_skipping",
        "partitioning_by_predicate",
        "sorted_input_precondition",
        "pointer_movement_mistake_review"
      ]
    },
    {
      "id": "sorting_cost_is_free",
      "relevantRoadmapNodeIds": [
        "two_pointers"
      ],
      "relevantMentalUnitIds": [
        "recognize_two_pointer_signal",
        "opposite_ends_pair_search",
        "same_direction_read_write",
        "converging_boundaries_and_proof",
        "duplicate_skipping",
        "partitioning_by_predicate",
        "sorted_input_precondition",
        "pointer_movement_mistake_review"
      ]
    },
    {
      "id": "pointer_movement_needs_no_correctness_argument",
      "relevantRoadmapNodeIds": [
        "two_pointers"
      ],
      "relevantMentalUnitIds": [
        "recognize_two_pointer_signal",
        "opposite_ends_pair_search",
        "same_direction_read_write",
        "converging_boundaries_and_proof",
        "duplicate_skipping",
        "partitioning_by_predicate",
        "sorted_input_precondition",
        "pointer_movement_mistake_review"
      ]
    },
    {
      "id": "every_subarray_problem_is_sliding_window",
      "relevantRoadmapNodeIds": [
        "sliding_window"
      ],
      "relevantMentalUnitIds": [
        "recognize_sliding_window_signal",
        "fixed_size_window",
        "variable_size_monotonic_window",
        "frequency_constrained_window",
        "expand_shrink_update_order",
        "answer_update_and_boundaries",
        "invalid_window_signals",
        "window_complexity_and_mistake_review"
      ]
    },
    {
      "id": "negative_values_never_break_window",
      "relevantRoadmapNodeIds": [
        "sliding_window"
      ],
      "relevantMentalUnitIds": [
        "recognize_sliding_window_signal",
        "fixed_size_window",
        "variable_size_monotonic_window",
        "frequency_constrained_window",
        "expand_shrink_update_order",
        "answer_update_and_boundaries",
        "invalid_window_signals",
        "window_complexity_and_mistake_review"
      ]
    },
    {
      "id": "shrink_until_answer_changes",
      "relevantRoadmapNodeIds": [
        "sliding_window"
      ],
      "relevantMentalUnitIds": [
        "recognize_sliding_window_signal",
        "fixed_size_window",
        "variable_size_monotonic_window",
        "frequency_constrained_window",
        "expand_shrink_update_order",
        "answer_update_and_boundaries",
        "invalid_window_signals",
        "window_complexity_and_mistake_review"
      ]
    },
    {
      "id": "answer_updates_only_during_shrink",
      "relevantRoadmapNodeIds": [
        "sliding_window"
      ],
      "relevantMentalUnitIds": [
        "recognize_sliding_window_signal",
        "fixed_size_window",
        "variable_size_monotonic_window",
        "frequency_constrained_window",
        "expand_shrink_update_order",
        "answer_update_and_boundaries",
        "invalid_window_signals",
        "window_complexity_and_mistake_review"
      ]
    },
    {
      "id": "prefix_sum_requires_sorted_input",
      "relevantRoadmapNodeIds": [
        "prefix_sums"
      ],
      "relevantMentalUnitIds": [
        "recognize_prefix_accumulation_signal",
        "build_one_dimensional_prefix",
        "answer_range_queries",
        "prefix_sum_with_hash_state",
        "difference_array_updates",
        "two_dimensional_prefix",
        "prefix_index_conventions",
        "prefix_vs_window_tradeoff"
      ]
    },
    {
      "id": "prefix_and_window_are_equivalent",
      "relevantRoadmapNodeIds": [
        "prefix_sums"
      ],
      "relevantMentalUnitIds": [
        "recognize_prefix_accumulation_signal",
        "build_one_dimensional_prefix",
        "answer_range_queries",
        "prefix_sum_with_hash_state",
        "difference_array_updates",
        "two_dimensional_prefix",
        "prefix_index_conventions",
        "prefix_vs_window_tradeoff"
      ]
    },
    {
      "id": "prefix_hash_requires_no_auxiliary_space",
      "relevantRoadmapNodeIds": [
        "prefix_sums"
      ],
      "relevantMentalUnitIds": [
        "recognize_prefix_accumulation_signal",
        "build_one_dimensional_prefix",
        "answer_range_queries",
        "prefix_sum_with_hash_state",
        "difference_array_updates",
        "two_dimensional_prefix",
        "prefix_index_conventions",
        "prefix_vs_window_tradeoff"
      ]
    },
    {
      "id": "prefix_boundaries_are_interchangeable",
      "relevantRoadmapNodeIds": [
        "prefix_sums"
      ],
      "relevantMentalUnitIds": [
        "recognize_prefix_accumulation_signal",
        "build_one_dimensional_prefix",
        "answer_range_queries",
        "prefix_sum_with_hash_state",
        "difference_array_updates",
        "two_dimensional_prefix",
        "prefix_index_conventions",
        "prefix_vs_window_tradeoff"
      ]
    },
    {
      "id": "sorting_is_linear",
      "relevantRoadmapNodeIds": [
        "sorting_based"
      ],
      "relevantMentalUnitIds": [
        "recognize_sorting_as_preprocessing",
        "sort_then_scan",
        "sort_then_two_pointers",
        "group_equal_values_after_sort",
        "custom_key_and_tie_breaking",
        "preserve_original_positions",
        "sorting_cost_and_side_effects",
        "sorting_based_mistake_review"
      ]
    },
    {
      "id": "original_positions_never_matter",
      "relevantRoadmapNodeIds": [
        "sorting_based"
      ],
      "relevantMentalUnitIds": [
        "recognize_sorting_as_preprocessing",
        "sort_then_scan",
        "sort_then_two_pointers",
        "group_equal_values_after_sort",
        "custom_key_and_tie_breaking",
        "preserve_original_positions",
        "sorting_cost_and_side_effects",
        "sorting_based_mistake_review"
      ]
    },
    {
      "id": "custom_comparator_needs_no_tie_break",
      "relevantRoadmapNodeIds": [
        "sorting_based"
      ],
      "relevantMentalUnitIds": [
        "recognize_sorting_as_preprocessing",
        "sort_then_scan",
        "sort_then_two_pointers",
        "group_equal_values_after_sort",
        "custom_key_and_tie_breaking",
        "preserve_original_positions",
        "sorting_cost_and_side_effects",
        "sorting_based_mistake_review"
      ]
    },
    {
      "id": "sorting_always_improves_solution",
      "relevantRoadmapNodeIds": [
        "sorting_based"
      ],
      "relevantMentalUnitIds": [
        "recognize_sorting_as_preprocessing",
        "sort_then_scan",
        "sort_then_two_pointers",
        "group_equal_values_after_sort",
        "custom_key_and_tie_breaking",
        "preserve_original_positions",
        "sorting_cost_and_side_effects",
        "sorting_based_mistake_review"
      ]
    },
    {
      "id": "stack_means_recursion",
      "relevantRoadmapNodeIds": [
        "stack"
      ],
      "relevantMentalUnitIds": [
        "recognize_lifo_signal",
        "push_pop_top_mechanics",
        "nested_structure_validation",
        "undo_and_previous_state",
        "recognize_monotonic_stack_signal",
        "maintain_monotonic_stack_invariant",
        "next_greater_smaller_boundaries",
        "stack_complexity_and_mistake_review"
      ]
    },
    {
      "id": "monotonic_stack_stores_every_item",
      "relevantRoadmapNodeIds": [
        "stack"
      ],
      "relevantMentalUnitIds": [
        "recognize_lifo_signal",
        "push_pop_top_mechanics",
        "nested_structure_validation",
        "undo_and_previous_state",
        "recognize_monotonic_stack_signal",
        "maintain_monotonic_stack_invariant",
        "next_greater_smaller_boundaries",
        "stack_complexity_and_mistake_review"
      ]
    },
    {
      "id": "each_item_can_be_popped_many_times",
      "relevantRoadmapNodeIds": [
        "stack"
      ],
      "relevantMentalUnitIds": [
        "recognize_lifo_signal",
        "push_pop_top_mechanics",
        "nested_structure_validation",
        "undo_and_previous_state",
        "recognize_monotonic_stack_signal",
        "maintain_monotonic_stack_invariant",
        "next_greater_smaller_boundaries",
        "stack_complexity_and_mistake_review"
      ]
    },
    {
      "id": "queue_and_stack_order_are_equivalent",
      "relevantRoadmapNodeIds": [
        "stack"
      ],
      "relevantMentalUnitIds": [
        "recognize_lifo_signal",
        "push_pop_top_mechanics",
        "nested_structure_validation",
        "undo_and_previous_state",
        "recognize_monotonic_stack_signal",
        "maintain_monotonic_stack_invariant",
        "next_greater_smaller_boundaries",
        "stack_complexity_and_mistake_review"
      ]
    },
    {
      "id": "sorted_input_alone_justifies_binary_search",
      "relevantRoadmapNodeIds": [
        "binary_search"
      ],
      "relevantMentalUnitIds": [
        "recognize_binary_search_signal",
        "classic_index_search",
        "boundaries_and_loop_invariants",
        "lower_and_upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ]
    },
    {
      "id": "using_mid_makes_complexity_logarithmic",
      "relevantRoadmapNodeIds": [
        "binary_search"
      ],
      "relevantMentalUnitIds": [
        "recognize_binary_search_signal",
        "classic_index_search",
        "boundaries_and_loop_invariants",
        "lower_and_upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ]
    },
    {
      "id": "binary_search_is_always_faster",
      "relevantRoadmapNodeIds": [
        "binary_search"
      ],
      "relevantMentalUnitIds": [
        "recognize_binary_search_signal",
        "classic_index_search",
        "boundaries_and_loop_invariants",
        "lower_and_upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ]
    },
    {
      "id": "boundary_choice_is_only_style",
      "relevantRoadmapNodeIds": [
        "binary_search"
      ],
      "relevantMentalUnitIds": [
        "recognize_binary_search_signal",
        "classic_index_search",
        "boundaries_and_loop_invariants",
        "lower_and_upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ]
    },
    {
      "id": "monotonic_predicate_can_change_back_and_forth",
      "relevantRoadmapNodeIds": [
        "binary_search"
      ],
      "relevantMentalUnitIds": [
        "recognize_binary_search_signal",
        "classic_index_search",
        "boundaries_and_loop_invariants",
        "lower_and_upper_bound",
        "binary_search_on_answer",
        "monotonic_predicate_search",
        "rotated_array_search"
      ]
    },
    {
      "id": "node_value_identity_equals_node_identity",
      "relevantRoadmapNodeIds": [
        "linked_list"
      ],
      "relevantMentalUnitIds": [
        "linked_list_structure_and_node_identity",
        "pointer_rewiring",
        "reverse_list_iterative",
        "fast_and_slow_pointers",
        "cycle_detection",
        "merge_and_splice_lists",
        "dummy_and_sentinel_nodes",
        "linked_list_edge_cases_and_mistakes"
      ]
    },
    {
      "id": "pointer_update_order_never_matters",
      "relevantRoadmapNodeIds": [
        "linked_list"
      ],
      "relevantMentalUnitIds": [
        "linked_list_structure_and_node_identity",
        "pointer_rewiring",
        "reverse_list_iterative",
        "fast_and_slow_pointers",
        "cycle_detection",
        "merge_and_splice_lists",
        "dummy_and_sentinel_nodes",
        "linked_list_edge_cases_and_mistakes"
      ]
    },
    {
      "id": "linked_list_supports_random_access",
      "relevantRoadmapNodeIds": [
        "linked_list"
      ],
      "relevantMentalUnitIds": [
        "linked_list_structure_and_node_identity",
        "pointer_rewiring",
        "reverse_list_iterative",
        "fast_and_slow_pointers",
        "cycle_detection",
        "merge_and_splice_lists",
        "dummy_and_sentinel_nodes",
        "linked_list_edge_cases_and_mistakes"
      ]
    },
    {
      "id": "dummy_node_changes_the_logical_answer",
      "relevantRoadmapNodeIds": [
        "linked_list"
      ],
      "relevantMentalUnitIds": [
        "linked_list_structure_and_node_identity",
        "pointer_rewiring",
        "reverse_list_iterative",
        "fast_and_slow_pointers",
        "cycle_detection",
        "merge_and_splice_lists",
        "dummy_and_sentinel_nodes",
        "linked_list_edge_cases_and_mistakes"
      ]
    },
    {
      "id": "recursion_terminates_automatically",
      "relevantRoadmapNodeIds": [
        "recursion_basics"
      ],
      "relevantMentalUnitIds": [
        "recognize_recursive_structure",
        "recursion_base_case_and_result_contract",
        "choose_recursive_state",
        "make_progress_toward_base_case",
        "combine_subproblem_results",
        "recursion_stack_and_complexity",
        "recursion_mistake_review"
      ]
    },
    {
      "id": "base_case_only_handles_empty_input",
      "relevantRoadmapNodeIds": [
        "recursion_basics"
      ],
      "relevantMentalUnitIds": [
        "recognize_recursive_structure",
        "recursion_base_case_and_result_contract",
        "choose_recursive_state",
        "make_progress_toward_base_case",
        "combine_subproblem_results",
        "recursion_stack_and_complexity",
        "recursion_mistake_review"
      ]
    },
    {
      "id": "every_call_has_identical_state",
      "relevantRoadmapNodeIds": [
        "recursion_basics"
      ],
      "relevantMentalUnitIds": [
        "recognize_recursive_structure",
        "recursion_base_case_and_result_contract",
        "choose_recursive_state",
        "make_progress_toward_base_case",
        "combine_subproblem_results",
        "recursion_stack_and_complexity",
        "recursion_mistake_review"
      ]
    },
    {
      "id": "recursive_code_is_always_exponential",
      "relevantRoadmapNodeIds": [
        "recursion_basics"
      ],
      "relevantMentalUnitIds": [
        "recognize_recursive_structure",
        "recursion_base_case_and_result_contract",
        "choose_recursive_state",
        "make_progress_toward_base_case",
        "combine_subproblem_results",
        "recursion_stack_and_complexity",
        "recursion_mistake_review"
      ]
    },
    {
      "id": "traversal_order_never_matters",
      "relevantRoadmapNodeIds": [
        "tree_traversal"
      ],
      "relevantMentalUnitIds": [
        "tree_structure_and_recursive_contract",
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "carry_path_and_aggregate_state",
        "subtree_return_values",
        "tree_boundaries_and_null_cases",
        "traversal_choice_and_complexity"
      ]
    },
    {
      "id": "null_children_need_no_contract",
      "relevantRoadmapNodeIds": [
        "tree_traversal"
      ],
      "relevantMentalUnitIds": [
        "tree_structure_and_recursive_contract",
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "carry_path_and_aggregate_state",
        "subtree_return_values",
        "tree_boundaries_and_null_cases",
        "traversal_choice_and_complexity"
      ]
    },
    {
      "id": "global_state_is_always_simpler",
      "relevantRoadmapNodeIds": [
        "tree_traversal"
      ],
      "relevantMentalUnitIds": [
        "tree_structure_and_recursive_contract",
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "carry_path_and_aggregate_state",
        "subtree_return_values",
        "tree_boundaries_and_null_cases",
        "traversal_choice_and_complexity"
      ]
    },
    {
      "id": "tree_dfs_and_graph_dfs_are_identical",
      "relevantRoadmapNodeIds": [
        "tree_traversal"
      ],
      "relevantMentalUnitIds": [
        "tree_structure_and_recursive_contract",
        "dfs_preorder",
        "dfs_inorder",
        "dfs_postorder",
        "bfs_level_order",
        "carry_path_and_aggregate_state",
        "subtree_return_values",
        "tree_boundaries_and_null_cases",
        "traversal_choice_and_complexity"
      ]
    },
    {
      "id": "heap_is_fully_sorted",
      "relevantRoadmapNodeIds": [
        "heap_priority_queue"
      ],
      "relevantMentalUnitIds": [
        "recognize_repeated_extreme_signal",
        "heap_push_pop_peek_mechanics",
        "top_k_selection",
        "k_way_merge",
        "running_extreme_and_streaming",
        "min_heap_vs_max_heap_choice",
        "heap_complexity_and_size_k",
        "heap_mistake_review"
      ]
    },
    {
      "id": "heap_operations_are_constant",
      "relevantRoadmapNodeIds": [
        "heap_priority_queue"
      ],
      "relevantMentalUnitIds": [
        "recognize_repeated_extreme_signal",
        "heap_push_pop_peek_mechanics",
        "top_k_selection",
        "k_way_merge",
        "running_extreme_and_streaming",
        "min_heap_vs_max_heap_choice",
        "heap_complexity_and_size_k",
        "heap_mistake_review"
      ]
    },
    {
      "id": "top_k_requires_heap_of_n",
      "relevantRoadmapNodeIds": [
        "heap_priority_queue"
      ],
      "relevantMentalUnitIds": [
        "recognize_repeated_extreme_signal",
        "heap_push_pop_peek_mechanics",
        "top_k_selection",
        "k_way_merge",
        "running_extreme_and_streaming",
        "min_heap_vs_max_heap_choice",
        "heap_complexity_and_size_k",
        "heap_mistake_review"
      ]
    },
    {
      "id": "min_heap_and_max_heap_are_interchangeable",
      "relevantRoadmapNodeIds": [
        "heap_priority_queue"
      ],
      "relevantMentalUnitIds": [
        "recognize_repeated_extreme_signal",
        "heap_push_pop_peek_mechanics",
        "top_k_selection",
        "k_way_merge",
        "running_extreme_and_streaming",
        "min_heap_vs_max_heap_choice",
        "heap_complexity_and_size_k",
        "heap_mistake_review"
      ]
    },
    {
      "id": "touching_endpoints_always_overlap",
      "relevantRoadmapNodeIds": [
        "intervals"
      ],
      "relevantMentalUnitIds": [
        "interval_representation_and_endpoint_semantics",
        "sort_intervals_for_processing",
        "detect_overlap",
        "merge_overlaps",
        "insert_interval",
        "meeting_rooms_and_resource_count",
        "sweep_line_intro",
        "interval_boundary_mistake_review"
      ]
    },
    {
      "id": "sorting_by_end_is_always_correct",
      "relevantRoadmapNodeIds": [
        "intervals"
      ],
      "relevantMentalUnitIds": [
        "interval_representation_and_endpoint_semantics",
        "sort_intervals_for_processing",
        "detect_overlap",
        "merge_overlaps",
        "insert_interval",
        "meeting_rooms_and_resource_count",
        "sweep_line_intro",
        "interval_boundary_mistake_review"
      ]
    },
    {
      "id": "interval_length_determines_overlap",
      "relevantRoadmapNodeIds": [
        "intervals"
      ],
      "relevantMentalUnitIds": [
        "interval_representation_and_endpoint_semantics",
        "sort_intervals_for_processing",
        "detect_overlap",
        "merge_overlaps",
        "insert_interval",
        "meeting_rooms_and_resource_count",
        "sweep_line_intro",
        "interval_boundary_mistake_review"
      ]
    },
    {
      "id": "sweep_events_need_no_tie_rule",
      "relevantRoadmapNodeIds": [
        "intervals"
      ],
      "relevantMentalUnitIds": [
        "interval_representation_and_endpoint_semantics",
        "sort_intervals_for_processing",
        "detect_overlap",
        "merge_overlaps",
        "insert_interval",
        "meeting_rooms_and_resource_count",
        "sweep_line_intro",
        "interval_boundary_mistake_review"
      ]
    },
    {
      "id": "backtracking_is_bruteforce_without_invariants",
      "relevantRoadmapNodeIds": [
        "backtracking"
      ],
      "relevantMentalUnitIds": [
        "recognize_backtracking_signal",
        "backtracking_base_case_and_result_contract",
        "choose_backtracking_state",
        "enumerate_choices",
        "path_state_and_undo",
        "constraint_pruning",
        "duplicate_control",
        "grid_search_backtracking",
        "partitioning_and_segmentation"
      ]
    },
    {
      "id": "undo_is_optional",
      "relevantRoadmapNodeIds": [
        "backtracking"
      ],
      "relevantMentalUnitIds": [
        "recognize_backtracking_signal",
        "backtracking_base_case_and_result_contract",
        "choose_backtracking_state",
        "enumerate_choices",
        "path_state_and_undo",
        "constraint_pruning",
        "duplicate_control",
        "grid_search_backtracking",
        "partitioning_and_segmentation"
      ]
    },
    {
      "id": "pruning_can_remove_any_unpromising_choice",
      "relevantRoadmapNodeIds": [
        "backtracking"
      ],
      "relevantMentalUnitIds": [
        "recognize_backtracking_signal",
        "backtracking_base_case_and_result_contract",
        "choose_backtracking_state",
        "enumerate_choices",
        "path_state_and_undo",
        "constraint_pruning",
        "duplicate_control",
        "grid_search_backtracking",
        "partitioning_and_segmentation"
      ]
    },
    {
      "id": "duplicate_values_need_no_special_handling",
      "relevantRoadmapNodeIds": [
        "backtracking"
      ],
      "relevantMentalUnitIds": [
        "recognize_backtracking_signal",
        "backtracking_base_case_and_result_contract",
        "choose_backtracking_state",
        "enumerate_choices",
        "path_state_and_undo",
        "constraint_pruning",
        "duplicate_control",
        "grid_search_backtracking",
        "partitioning_and_segmentation"
      ]
    },
    {
      "id": "tree_visited_rules_apply_unchanged",
      "relevantRoadmapNodeIds": [
        "graph_traversal"
      ],
      "relevantMentalUnitIds": [
        "graph_representation",
        "recognize_graph_traversal_signal",
        "graph_dfs",
        "graph_bfs",
        "visited_state_and_cycles",
        "connected_components",
        "multi_source_bfs",
        "grid_as_graph",
        "topological_order_intro",
        "graph_complexity_and_mistakes"
      ]
    },
    {
      "id": "bfs_is_always_faster_than_dfs",
      "relevantRoadmapNodeIds": [
        "graph_traversal"
      ],
      "relevantMentalUnitIds": [
        "graph_representation",
        "recognize_graph_traversal_signal",
        "graph_dfs",
        "graph_bfs",
        "visited_state_and_cycles",
        "connected_components",
        "multi_source_bfs",
        "grid_as_graph",
        "topological_order_intro",
        "graph_complexity_and_mistakes"
      ]
    },
    {
      "id": "adjacency_matrix_is_always_wrong",
      "relevantRoadmapNodeIds": [
        "graph_traversal"
      ],
      "relevantMentalUnitIds": [
        "graph_representation",
        "recognize_graph_traversal_signal",
        "graph_dfs",
        "graph_bfs",
        "visited_state_and_cycles",
        "connected_components",
        "multi_source_bfs",
        "grid_as_graph",
        "topological_order_intro",
        "graph_complexity_and_mistakes"
      ]
    },
    {
      "id": "marking_visited_on_dequeue_is_always_equivalent",
      "relevantRoadmapNodeIds": [
        "graph_traversal"
      ],
      "relevantMentalUnitIds": [
        "graph_representation",
        "recognize_graph_traversal_signal",
        "graph_dfs",
        "graph_bfs",
        "visited_state_and_cycles",
        "connected_components",
        "multi_source_bfs",
        "grid_as_graph",
        "topological_order_intro",
        "graph_complexity_and_mistakes"
      ]
    },
    {
      "id": "locally_best_always_means_globally_best",
      "relevantRoadmapNodeIds": [
        "greedy_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_greedy_candidate",
        "define_local_choice",
        "prove_safe_choice",
        "exchange_argument_intro",
        "sort_then_greedy",
        "interval_greedy",
        "greedy_failure_signals",
        "greedy_mistake_review"
      ]
    },
    {
      "id": "greedy_needs_no_proof",
      "relevantRoadmapNodeIds": [
        "greedy_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_greedy_candidate",
        "define_local_choice",
        "prove_safe_choice",
        "exchange_argument_intro",
        "sort_then_greedy",
        "interval_greedy",
        "greedy_failure_signals",
        "greedy_mistake_review"
      ]
    },
    {
      "id": "dynamic_programming_and_greedy_are_interchangeable",
      "relevantRoadmapNodeIds": [
        "greedy_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_greedy_candidate",
        "define_local_choice",
        "prove_safe_choice",
        "exchange_argument_intro",
        "sort_then_greedy",
        "interval_greedy",
        "greedy_failure_signals",
        "greedy_mistake_review"
      ]
    },
    {
      "id": "greedy_sort_key_is_obvious",
      "relevantRoadmapNodeIds": [
        "greedy_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_greedy_candidate",
        "define_local_choice",
        "prove_safe_choice",
        "exchange_argument_intro",
        "sort_then_greedy",
        "interval_greedy",
        "greedy_failure_signals",
        "greedy_mistake_review"
      ]
    },
    {
      "id": "overlapping_subproblems_alone_are_sufficient",
      "relevantRoadmapNodeIds": [
        "dynamic_programming_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_overlapping_subproblems",
        "define_dp_state",
        "define_transition",
        "base_cases_and_initialization",
        "memoization_top_down",
        "tabulation_bottom_up",
        "iteration_order",
        "optimize_state_space",
        "one_dimensional_dp",
        "two_dimensional_dp_intro",
        "reconstruct_solution_intro",
        "dp_mistake_review"
      ]
    },
    {
      "id": "dp_state_is_always_only_the_index",
      "relevantRoadmapNodeIds": [
        "dynamic_programming_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_overlapping_subproblems",
        "define_dp_state",
        "define_transition",
        "base_cases_and_initialization",
        "memoization_top_down",
        "tabulation_bottom_up",
        "iteration_order",
        "optimize_state_space",
        "one_dimensional_dp",
        "two_dimensional_dp_intro",
        "reconstruct_solution_intro",
        "dp_mistake_review"
      ]
    },
    {
      "id": "transition_order_never_matters",
      "relevantRoadmapNodeIds": [
        "dynamic_programming_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_overlapping_subproblems",
        "define_dp_state",
        "define_transition",
        "base_cases_and_initialization",
        "memoization_top_down",
        "tabulation_bottom_up",
        "iteration_order",
        "optimize_state_space",
        "one_dimensional_dp",
        "two_dimensional_dp_intro",
        "reconstruct_solution_intro",
        "dp_mistake_review"
      ]
    },
    {
      "id": "memoization_is_always_faster",
      "relevantRoadmapNodeIds": [
        "dynamic_programming_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_overlapping_subproblems",
        "define_dp_state",
        "define_transition",
        "base_cases_and_initialization",
        "memoization_top_down",
        "tabulation_bottom_up",
        "iteration_order",
        "optimize_state_space",
        "one_dimensional_dp",
        "two_dimensional_dp_intro",
        "reconstruct_solution_intro",
        "dp_mistake_review"
      ]
    },
    {
      "id": "state_compression_never_changes_correctness",
      "relevantRoadmapNodeIds": [
        "dynamic_programming_intro"
      ],
      "relevantMentalUnitIds": [
        "recognize_overlapping_subproblems",
        "define_dp_state",
        "define_transition",
        "base_cases_and_initialization",
        "memoization_top_down",
        "tabulation_bottom_up",
        "iteration_order",
        "optimize_state_space",
        "one_dimensional_dp",
        "two_dimensional_dp_intro",
        "reconstruct_solution_intro",
        "dp_mistake_review"
      ]
    },
    {
      "id": "shifts_equal_division_for_all_signed_values",
      "relevantRoadmapNodeIds": [
        "bit_manipulation"
      ],
      "relevantMentalUnitIds": [
        "binary_representation_and_masks",
        "test_set_clear_toggle_bits",
        "shifts_and_sign_behavior",
        "xor_cancellation",
        "count_bits_and_lowest_set_bit",
        "subset_mask_enumeration_intro",
        "bitmask_state_representation",
        "bit_manipulation_mistake_review"
      ]
    },
    {
      "id": "xor_is_general_arithmetic_addition",
      "relevantRoadmapNodeIds": [
        "bit_manipulation"
      ],
      "relevantMentalUnitIds": [
        "binary_representation_and_masks",
        "test_set_clear_toggle_bits",
        "shifts_and_sign_behavior",
        "xor_cancellation",
        "count_bits_and_lowest_set_bit",
        "subset_mask_enumeration_intro",
        "bitmask_state_representation",
        "bit_manipulation_mistake_review"
      ]
    },
    {
      "id": "bit_tricks_need_no_integer_width_model",
      "relevantRoadmapNodeIds": [
        "bit_manipulation"
      ],
      "relevantMentalUnitIds": [
        "binary_representation_and_masks",
        "test_set_clear_toggle_bits",
        "shifts_and_sign_behavior",
        "xor_cancellation",
        "count_bits_and_lowest_set_bit",
        "subset_mask_enumeration_intro",
        "bitmask_state_representation",
        "bit_manipulation_mistake_review"
      ]
    },
    {
      "id": "masks_are_only_performance_optimizations",
      "relevantRoadmapNodeIds": [
        "bit_manipulation"
      ],
      "relevantMentalUnitIds": [
        "binary_representation_and_masks",
        "test_set_clear_toggle_bits",
        "shifts_and_sign_behavior",
        "xor_cancellation",
        "count_bits_and_lowest_set_bit",
        "subset_mask_enumeration_intro",
        "bitmask_state_representation",
        "bit_manipulation_mistake_review"
      ]
    },
    {
      "id": "floating_point_equality_is_exact",
      "relevantRoadmapNodeIds": [
        "math_and_geometry"
      ],
      "relevantMentalUnitIds": [
        "integer_arithmetic_and_overflow",
        "gcd_lcm_and_divisibility",
        "modular_arithmetic",
        "primes_and_factorization",
        "coordinate_and_vector_basics",
        "distance_and_slope_without_precision_loss",
        "interval_and_angle_normalization",
        "geometry_boundary_and_precision_mistakes"
      ]
    },
    {
      "id": "slope_division_is_always_safe",
      "relevantRoadmapNodeIds": [
        "math_and_geometry"
      ],
      "relevantMentalUnitIds": [
        "integer_arithmetic_and_overflow",
        "gcd_lcm_and_divisibility",
        "modular_arithmetic",
        "primes_and_factorization",
        "coordinate_and_vector_basics",
        "distance_and_slope_without_precision_loss",
        "interval_and_angle_normalization",
        "geometry_boundary_and_precision_mistakes"
      ]
    },
    {
      "id": "modulo_behaves_identically_for_negative_values",
      "relevantRoadmapNodeIds": [
        "math_and_geometry"
      ],
      "relevantMentalUnitIds": [
        "integer_arithmetic_and_overflow",
        "gcd_lcm_and_divisibility",
        "modular_arithmetic",
        "primes_and_factorization",
        "coordinate_and_vector_basics",
        "distance_and_slope_without_precision_loss",
        "interval_and_angle_normalization",
        "geometry_boundary_and_precision_mistakes"
      ]
    },
    {
      "id": "geometry_needs_no_degenerate_cases",
      "relevantRoadmapNodeIds": [
        "math_and_geometry"
      ],
      "relevantMentalUnitIds": [
        "integer_arithmetic_and_overflow",
        "gcd_lcm_and_divisibility",
        "modular_arithmetic",
        "primes_and_factorization",
        "coordinate_and_vector_basics",
        "distance_and_slope_without_precision_loss",
        "interval_and_angle_normalization",
        "geometry_boundary_and_precision_mistakes"
      ]
    },
    {
      "id": "hash_map_is_always_faster_than_sorting",
      "relevantRoadmapNodeIds": [
        "contrast_hash_map_vs_sorting"
      ],
      "relevantMentalUnitIds": [
        "reject_hash_map_always_faster",
        "recognize_hash_lookup_signal",
        "recognize_sorting_as_preprocessing"
      ]
    },
    {
      "id": "any_solution_with_two_indices_is_two_pointers",
      "relevantRoadmapNodeIds": [
        "contrast_two_pointers_vs_sliding_window"
      ],
      "relevantMentalUnitIds": [
        "reject_two_indices_means_two_pointers",
        "recognize_two_pointer_signal",
        "recognize_sliding_window_signal"
      ]
    },
    {
      "id": "every_contiguous_sum_problem_is_sliding_window",
      "relevantRoadmapNodeIds": [
        "contrast_sliding_window_vs_prefix_sums"
      ],
      "relevantMentalUnitIds": [
        "negative_values_break_simple_window",
        "recognize_sliding_window_signal",
        "recognize_prefix_accumulation_signal"
      ]
    },
    {
      "id": "every_problem_using_a_stack_is_a_monotonic_stack_problem",
      "relevantRoadmapNodeIds": [
        "contrast_stack_vs_monotonic_stack_intro"
      ],
      "relevantMentalUnitIds": [
        "reject_every_stack_is_monotonic",
        "recognize_lifo_signal",
        "recognize_monotonic_stack_signal"
      ]
    },
    {
      "id": "sorted_input_always_requires_binary_search",
      "relevantRoadmapNodeIds": [
        "contrast_binary_search_vs_linear_scan"
      ],
      "relevantMentalUnitIds": [
        "sorted_input_is_not_sufficient",
        "recognize_binary_search_signal",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "binary_search_is_always_better_than_linear_scan",
      "relevantRoadmapNodeIds": [
        "contrast_binary_search_vs_linear_scan"
      ],
      "relevantMentalUnitIds": [
        "single_query_cost_comparison",
        "recognize_binary_search_signal",
        "reason_about_indexed_scans"
      ]
    },
    {
      "id": "using_left_right_mid_proves_logarithmic_complexity",
      "relevantRoadmapNodeIds": [
        "contrast_binary_search_vs_linear_scan"
      ],
      "relevantMentalUnitIds": [
        "reject_keywords_and_variable_names",
        "boundaries_and_loop_invariants",
        "reason_about_indexed_scans"
      ]
    }
  ]
} as const;

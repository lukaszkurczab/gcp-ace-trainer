import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const windowBoundariesLengthAndStateQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-boundaries-length-state-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_inclusive_window_boundaries",
    "secondarySkillAtomIds": [
      "identify_contained_window_indexes",
      "distinguish_inclusive_endpoints"
    ],
    "type": "single_choice",
    "prompt": "A window uses inclusive boundaries:\n\n[left, right]\n\nIf left = 2 and right = 5, which indexes belong to the window?",
    "options": [
      {
        "id": "two_through_five",
        "text": "2, 3, 4, and 5.",
        "isCorrect": true
      },
      {
        "id": "two_through_four",
        "text": "2, 3, and 4.",
        "isCorrect": false
      },
      {
        "id": "three_through_five",
        "text": "3, 4, and 5.",
        "isCorrect": false
      },
      {
        "id": "only_endpoints",
        "text": "Only 2 and 5.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Both endpoints are included under the inclusive convention.",
      "mentalModelCorrection": "An inclusive window contains every index from left through right.",
      "mistakeTypes": [
        "inclusive_right_boundary_treated_as_exclusive"
      ],
      "nextAction": "Enumerate the concrete indexes represented by the interval before deriving formulas.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-boundaries-length-state-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_inclusive_window_length",
    "secondarySkillAtomIds": [
      "apply_inclusive_length_formula",
      "avoid_window_length_off_by_one"
    ],
    "type": "single_choice",
    "prompt": "A window contains indexes [left, right] inclusively.\n\nWhich formula gives its length?",
    "options": [
      {
        "id": "right_minus_left_plus_one",
        "text": "right - left + 1",
        "isCorrect": true
      },
      {
        "id": "right_minus_left",
        "text": "right - left",
        "isCorrect": false
      },
      {
        "id": "right_plus_left",
        "text": "right + left",
        "isCorrect": false
      },
      {
        "id": "right_minus_left_minus_one",
        "text": "right - left - 1",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The interval includes both its first and final index.",
      "mentalModelCorrection": "The difference measures gaps between indexes; the additional one counts the starting position.",
      "mistakeTypes": [
        "inclusive_window_length_missing_one"
      ],
      "nextAction": "Test the formula on a one-element window where left === right.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-boundaries-length-state-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_half_open_window_boundaries",
    "secondarySkillAtomIds": [
      "identify_half_open_contained_indexes",
      "interpret_exclusive_right_boundary"
    ],
    "type": "single_choice",
    "prompt": "A window uses the half-open convention:\n\n[left, right)\n\nIf left = 2 and right = 5, which indexes belong to the window?",
    "options": [
      {
        "id": "two_through_four",
        "text": "2, 3, and 4.",
        "isCorrect": true
      },
      {
        "id": "two_through_five",
        "text": "2, 3, 4, and 5.",
        "isCorrect": false
      },
      {
        "id": "three_through_five",
        "text": "3, 4, and 5.",
        "isCorrect": false
      },
      {
        "id": "only_three_and_four",
        "text": "Only 3 and 4.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "left is included, while right is the first position outside the window.",
      "mentalModelCorrection": "A half-open interval stops immediately before its right boundary.",
      "mistakeTypes": [
        "half_open_right_boundary_treated_as_inclusive"
      ],
      "nextAction": "Translate [left, right) into indexes from left through right - 1.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-boundaries-length-state-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_half_open_window_length",
    "secondarySkillAtomIds": [
      "apply_half_open_length_formula",
      "avoid_window_length_off_by_one"
    ],
    "type": "single_choice",
    "prompt": "A window contains indexes [left, right).\n\nWhich formula gives its length?",
    "options": [
      {
        "id": "right_minus_left",
        "text": "right - left",
        "isCorrect": true
      },
      {
        "id": "right_minus_left_plus_one",
        "text": "right - left + 1",
        "isCorrect": false
      },
      {
        "id": "right_minus_left_minus_one",
        "text": "right - left - 1",
        "isCorrect": false
      },
      {
        "id": "right_plus_one",
        "text": "right + 1",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The exclusive right boundary is also the position immediately after the final contained element.",
      "mentalModelCorrection": "Half-open intervals encode their length directly as end minus start.",
      "mistakeTypes": [
        "half_open_window_length_uses_inclusive_formula"
      ],
      "nextAction": "Check that [k, k) correctly produces length zero.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-boundaries-length-state-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "represent_single_element_windows",
    "secondarySkillAtomIds": [
      "compare_boundary_conventions",
      "derive_singleton_window_length"
    ],
    "type": "solution_comparison",
    "prompt": "A window contains only the element at index 4.\n\nWhich representations are correct?",
    "options": [
      {
        "id": "inclusive_four_four_half_open_four_five",
        "text": "Inclusive: [4, 4]. Half-open: [4, 5).",
        "isCorrect": true
      },
      {
        "id": "inclusive_four_five_half_open_four_four",
        "text": "Inclusive: [4, 5]. Half-open: [4, 4).",
        "isCorrect": false
      },
      {
        "id": "both_four_four",
        "text": "Both conventions use [4, 4].",
        "isCorrect": false
      },
      {
        "id": "both_four_five",
        "text": "Both conventions use [4, 5].",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "An inclusive singleton has equal endpoints, while a half-open singleton has boundaries one position apart.",
      "mentalModelCorrection": "The same logical window has different endpoint values under different boundary conventions.",
      "mistakeTypes": [
        "singleton_window_boundary_conventions_conflated"
      ],
      "nextAction": "Apply each convention's length formula and confirm that the result is one.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "represent_empty_windows",
    "secondarySkillAtomIds": [
      "compare_empty_window_boundaries",
      "distinguish_empty_from_singleton_window"
    ],
    "type": "solution_comparison",
    "prompt": "Which statement correctly compares a canonical empty window under inclusive and half-open conventions?",
    "options": [
      {
        "id": "inclusive_left_greater_half_open_equal",
        "text": "An inclusive empty window may have left > right, while a half-open empty window is represented by left === right.",
        "isCorrect": true
      },
      {
        "id": "both_equal_singleton",
        "text": "left === right represents an empty window under both conventions.",
        "isCorrect": false
      },
      {
        "id": "both_left_greater",
        "text": "Both conventions require left > right for an empty window.",
        "isCorrect": false
      },
      {
        "id": "empty_window_impossible",
        "text": "Neither convention can represent an empty window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Equal inclusive endpoints contain one element, while equal half-open boundaries contain none.",
      "mentalModelCorrection": "Emptiness must be derived from the interval convention rather than from pointer equality alone.",
      "mistakeTypes": [
        "empty_window_representation_conflated"
      ],
      "nextAction": "Compute the length implied by each convention when left === right.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_inclusive_length_off_by_one",
    "secondarySkillAtomIds": [
      "review_window_length_formula",
      "maintain_inclusive_boundary_consistency"
    ],
    "type": "mistake_review",
    "prompt": "An algorithm declares that its current window is inclusive:\n\n[left, right]\n\nbut computes:\n\nconst length = right - left;\n\nWhat is wrong?",
    "options": [
      {
        "id": "singleton_becomes_zero",
        "text": "The formula omits one contained position, so a singleton window incorrectly has length zero.",
        "isCorrect": true
      },
      {
        "id": "formula_overcounts",
        "text": "The formula overcounts the window by one.",
        "isCorrect": false
      },
      {
        "id": "inclusive_windows_have_no_length",
        "text": "Inclusive windows cannot use an arithmetic length formula.",
        "isCorrect": false
      },
      {
        "id": "right_must_be_exclusive",
        "text": "The only valid correction is to reinterpret right as exclusive without changing any other logic.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Both boundary positions belong to the represented window.",
      "mentalModelCorrection": "An inclusive interval requires right - left + 1.",
      "mistakeTypes": [
        "inclusive_window_length_off_by_one"
      ],
      "nextAction": "Test the formula when both boundaries point to the same element.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_half_open_length_off_by_one",
    "secondarySkillAtomIds": [
      "review_window_length_formula",
      "maintain_half_open_boundary_consistency"
    ],
    "type": "mistake_review",
    "prompt": "An algorithm declares that its current window is half-open:\n\n[left, right)\n\nbut computes:\n\nconst length = right - left + 1;\n\nWhat is wrong?",
    "options": [
      {
        "id": "exclusive_end_counted",
        "text": "The formula counts the excluded right boundary as though it were contained in the window.",
        "isCorrect": true
      },
      {
        "id": "left_boundary_missing",
        "text": "The formula fails to count the included left boundary.",
        "isCorrect": false
      },
      {
        "id": "half_open_requires_minus_one",
        "text": "The correct formula is right - left - 1.",
        "isCorrect": false
      },
      {
        "id": "formula_is_correct",
        "text": "The formula is correct because all windows include both boundaries.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "right identifies the first position outside the logical window.",
      "mentalModelCorrection": "The half-open length is exactly right - left.",
      "mistakeTypes": [
        "half_open_window_length_off_by_one"
      ],
      "nextAction": "Check that an empty interval [k, k) produces length zero.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-boundaries-length-state-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "synchronize_inclusive_expansion_state",
    "secondarySkillAtomIds": [
      "add_incoming_right_element",
      "maintain_exact_window_membership"
    ],
    "type": "subgoal_ordering",
    "prompt": "An inclusive window currently represents [left, right].\n\nThe algorithm expands by incrementing right. Which update sequence keeps a running sum synchronized?",
    "options": [
      {
        "id": "increment_right_add_new_right",
        "text": "Increment right, then add values[right] to the sum.",
        "isCorrect": true
      },
      {
        "id": "add_old_right_increment",
        "text": "Add values[right], then increment right without adding the new element.",
        "isCorrect": false
      },
      {
        "id": "increment_right_remove_new_right",
        "text": "Increment right, then subtract values[right].",
        "isCorrect": false
      },
      {
        "id": "increment_without_state",
        "text": "Increment right without changing the sum.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "After the increment, the new right index becomes part of the inclusive window.",
      "mentalModelCorrection": "The incoming contribution must match the element newly included by the boundary movement.",
      "mistakeTypes": [
        "inclusive_expansion_state_not_synchronized"
      ],
      "nextAction": "Identify the membership difference between the old and new intervals.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "synchronize_half_open_expansion_state",
    "secondarySkillAtomIds": [
      "add_element_at_exclusive_boundary",
      "advance_exclusive_right_boundary"
    ],
    "type": "subgoal_ordering",
    "prompt": "A half-open window represents [left, right), so values[right] is currently outside the window.\n\nWhich expansion sequence is coherent?",
    "options": [
      {
        "id": "add_right_then_increment",
        "text": "Add values[right] to the maintained state, then increment right.",
        "isCorrect": true
      },
      {
        "id": "increment_then_add_new_right",
        "text": "Increment right, then add values[right], skipping the element that actually entered.",
        "isCorrect": false
      },
      {
        "id": "remove_right_then_increment",
        "text": "Remove values[right], then increment right.",
        "isCorrect": false
      },
      {
        "id": "increment_without_add",
        "text": "Increment right without adding any incoming contribution.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The old exclusive boundary identifies the next element that will enter.",
      "mentalModelCorrection": "For [left, right), add the element at right before moving the exclusive boundary past it.",
      "mistakeTypes": [
        "half_open_expansion_uses_wrong_incoming_index"
      ],
      "nextAction": "Compare the old interval [left, right) with the expanded interval [left, right + 1).",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "synchronize_left_contraction_state",
    "secondarySkillAtomIds": [
      "remove_old_left_element",
      "advance_left_boundary_safely"
    ],
    "type": "subgoal_ordering",
    "prompt": "Under either inclusive or half-open conventions, which sequence correctly shrinks a non-empty window from the left?",
    "options": [
      {
        "id": "remove_old_left_then_increment",
        "text": "Remove values[left] from the maintained state, then increment left.",
        "isCorrect": true
      },
      {
        "id": "increment_then_remove_new_left",
        "text": "Increment left, then remove values[left].",
        "isCorrect": false
      },
      {
        "id": "remove_right_then_increment_left",
        "text": "Remove the rightmost element, then increment left.",
        "isCorrect": false
      },
      {
        "id": "increment_without_remove",
        "text": "Increment left without updating the maintained state.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The outgoing element is located at the old left boundary.",
      "mentalModelCorrection": "State mutation must describe the membership change caused by the boundary update.",
      "mistakeTypes": [
        "left_contraction_removes_wrong_element"
      ],
      "nextAction": "Remove the element before changing the index that identifies it.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_window_state_boundary_mismatch",
    "secondarySkillAtomIds": [
      "maintain_exact_window_sum",
      "detect_stale_outgoing_contribution"
    ],
    "type": "mistake_review",
    "prompt": "The boundaries describe the inclusive window [2, 4], but the maintained sum still includes values[1].\n\nWhat is the correct review?",
    "options": [
      {
        "id": "state_describes_larger_region",
        "text": "The sum and boundaries describe different element sets, so validity and answer decisions based on that sum are unreliable.",
        "isCorrect": true
      },
      {
        "id": "extra_prefix_is_allowed",
        "text": "The state may include any processed prefix as long as left and right are correct.",
        "isCorrect": false
      },
      {
        "id": "boundaries_override_state",
        "text": "The boundaries automatically remove values[1] from the numeric sum.",
        "isCorrect": false
      },
      {
        "id": "only_length_is_affected",
        "text": "The mismatch can affect only the length formula, never validity.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The aggregate contains an element outside the represented interval.",
      "mentalModelCorrection": "Window-local state must describe exactly the elements currently between the boundaries.",
      "mistakeTypes": [
        "window_state_contains_stale_prefix_element"
      ],
      "nextAction": "Audit every boundary movement for a matching incoming or outgoing state update.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_missing_incoming_window_state",
    "secondarySkillAtomIds": [
      "synchronize_right_boundary_and_state",
      "avoid_underrepresented_window_state"
    ],
    "type": "mistake_review",
    "prompt": "The boundaries describe [left, right] inclusively, but the frequency map has not yet counted values[right].\n\nWhat invariant is broken?",
    "options": [
      {
        "id": "state_excludes_contained_element",
        "text": "The map describes [left, right) while the boundaries describe [left, right], so duplicate or distinct-count checks use stale state.",
        "isCorrect": true
      },
      {
        "id": "right_is_never_part_of_window",
        "text": "No invariant is broken because right is always excluded.",
        "isCorrect": false
      },
      {
        "id": "frequency_maps_need_only_left",
        "text": "A frequency map needs to track only values[left].",
        "isCorrect": false
      },
      {
        "id": "length_updates_map",
        "text": "Computing right - left + 1 automatically inserts values[right] into the map.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The endpoint convention includes right, but the state update does not.",
      "mentalModelCorrection": "Boundary semantics and state membership must use the same convention at every observation point.",
      "mistakeTypes": [
        "incoming_right_value_missing_from_window_state"
      ],
      "nextAction": "Add the incoming endpoint before evaluating window validity.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-boundaries-length-state-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_window_boundaries_from_independent_pointers",
    "secondarySkillAtomIds": [
      "recognize_contiguous_window_membership",
      "reject_endpoint_only_state"
    ],
    "type": "mistake_review",
    "prompt": "A reviewer says:\n\n\"left and right are independent candidates, so only values[left] and values[right] belong to the current sliding window.\"\n\nWhat is the best correction?",
    "options": [
      {
        "id": "all_between_boundaries_belong",
        "text": "A sliding window is one contiguous region, so every index between its boundaries belongs according to the chosen interval convention.",
        "isCorrect": true
      },
      {
        "id": "only_endpoints_belong",
        "text": "The statement is correct because window state uses only endpoint values.",
        "isCorrect": false
      },
      {
        "id": "interior_belongs_only_when_sorted",
        "text": "Interior elements belong only when the input is sorted.",
        "isCorrect": false
      },
      {
        "id": "pointers_have_no_region",
        "text": "Sliding-window boundaries do not define any collection of elements.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The candidate evaluated by a sliding window is the complete contiguous interval.",
      "mentalModelCorrection": "Window boundaries jointly define membership; they are not independent selected positions.",
      "mistakeTypes": [
        "sliding_window_boundaries_treated_as_independent_candidates"
      ],
      "nextAction": "List every index whose contribution must be represented by the current state.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "maintain_one_boundary_convention",
    "secondarySkillAtomIds": [
      "avoid_mixed_window_formulas",
      "synchronize_iteration_and_length_logic"
    ],
    "type": "mistake_review",
    "prompt": "A loop treats right as exclusive when adding elements:\n\nadd(values[right]);\nright++;\n\nbut later computes the window length as:\n\nright - left + 1\n\nWhat is the problem?",
    "options": [
      {
        "id": "mixed_half_open_and_inclusive_logic",
        "text": "The update logic represents [left, right), but the length formula treats right as included and overcounts by one.",
        "isCorrect": true
      },
      {
        "id": "right_should_never_increment",
        "text": "The only issue is that right must remain fixed.",
        "isCorrect": false
      },
      {
        "id": "add_should_use_left",
        "text": "The incoming contribution should always be values[left].",
        "isCorrect": false
      },
      {
        "id": "formula_matches_exclusive",
        "text": "The formula is correct because exclusive boundaries require +1.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The membership updates and length calculation assume different meanings for right.",
      "mentalModelCorrection": "Choose one interval convention and derive all accesses, updates, lengths, and termination rules from it.",
      "mistakeTypes": [
        "window_boundary_conventions_mixed"
      ],
      "nextAction": "Document the interval notation and verify every formula against it.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-boundaries-length-state-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_complete_window_boundary_invariant",
    "secondarySkillAtomIds": [
      "connect_boundaries_length_and_membership",
      "prove_synchronized_window_state"
    ],
    "type": "invariant_identification",
    "prompt": "Which invariant most completely supports a sliding-window implementation?",
    "options": [
      {
        "id": "boundaries_and_state_describe_same_region",
        "text": "The chosen boundary convention defines exactly which contiguous indexes belong to the window; the length formula follows that convention; and every state entry or aggregate equals the contribution of exactly those contained elements.",
        "isCorrect": true
      },
      {
        "id": "pointers_move_independently",
        "text": "left and right may describe unrelated positions as long as both move forward.",
        "isCorrect": false
      },
      {
        "id": "state_may_include_processed_prefix",
        "text": "The maintained state may include any previously processed element even after it leaves the window.",
        "isCorrect": false
      },
      {
        "id": "length_formula_is_universal",
        "text": "right - left + 1 is valid regardless of whether right is inclusive or exclusive.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Correctness requires one coherent definition of membership shared by boundaries, state, length, and updates.",
      "mentalModelCorrection": "A window is not correct when its pointers, aggregate, and formulas each describe different regions.",
      "mistakeTypes": [
        "window_boundary_state_invariant_incomplete"
      ],
      "nextAction": "After every expansion or contraction, verify the represented indexes, computed length, and maintained state together.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];

import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const edgeCasesTiesAndOutputContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sliding-window-edge-contract-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_empty_window_input",
    "secondarySkillAtomIds": [
      "recognize_no_window_exists",
      "avoid_invalid_initial_boundaries"
    ],
    "type": "edge_case_drill",
    "prompt": "A function must return the maximum sum of any contiguous window of width k.\n\nvalues = []\nk = 3\n\nWhat result is correct under a contract that returns null when no valid window exists?",
    "options": [
      {
        "id": "return_null",
        "text": "Return null because the input contains no width-3 window.",
        "isCorrect": true
      },
      {
        "id": "return_zero",
        "text": "Return 0 because an empty input always has sum 0.",
        "isCorrect": false
      },
      {
        "id": "return_negative_infinity",
        "text": "Return -Infinity as the final public result without consulting the contract.",
        "isCorrect": false
      },
      {
        "id": "return_empty_window",
        "text": "Return an empty window because it may represent any requested width.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A width-k result requires exactly k source elements, and the contract explicitly defines the no-result representation.",
      "mentalModelCorrection": "Do not confuse an empty aggregate identity with the existence of a valid fixed-width window.",
      "mistakeTypes": [
        "empty_input_treated_as_valid_window"
      ],
      "nextAction": "Check whether a valid candidate exists before returning an aggregate value.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sliding-window-edge-contract-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_positive_window_width",
    "secondarySkillAtomIds": [
      "reject_zero_width_window",
      "apply_invalid_parameter_contract"
    ],
    "type": "output_contract_analysis",
    "prompt": "A fixed-width sliding-window function requires k to be a positive integer.\n\nWhat should happen for:\n\nk = 0",
    "options": [
      {
        "id": "reject_invalid_k",
        "text": "Follow the invalid-argument contract, such as throwing an error or returning a documented invalid-input result.",
        "isCorrect": true
      },
      {
        "id": "treat_as_empty_window",
        "text": "Silently treat every position as a valid zero-width window.",
        "isCorrect": false
      },
      {
        "id": "replace_with_one",
        "text": "Automatically change k to 1 without informing the caller.",
        "isCorrect": false
      },
      {
        "id": "return_first_value",
        "text": "Return the first input value because zero and one are interchangeable window widths.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The parameter violates the stated positive-width precondition.",
      "mentalModelCorrection": "Invalid input and a valid search with no result are separate contract states.",
      "mistakeTypes": [
        "zero_window_width_not_rejected"
      ],
      "nextAction": "Validate k before initializing boundaries or window state.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sliding-window-edge-contract-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_window_width_larger_than_input",
    "secondarySkillAtomIds": [
      "recognize_missing_fixed_width_candidate",
      "distinguish_invalid_k_from_no_result"
    ],
    "type": "edge_case_drill",
    "prompt": "A fixed-width function accepts positive k values but returns null when no complete window exists.\n\nvalues = [4, 7]\nk = 3\n\nWhat should it return?",
    "options": [
      {
        "id": "return_null",
        "text": "null, because no contiguous window contains exactly three elements.",
        "isCorrect": true
      },
      {
        "id": "return_full_input",
        "text": "[4, 7], because the largest available partial window is sufficient.",
        "isCorrect": false
      },
      {
        "id": "pad_with_zero",
        "text": "[4, 7, 0], because missing positions should be synthesized.",
        "isCorrect": false
      },
      {
        "id": "return_seven",
        "text": "7, because a single maximum element replaces an unavailable window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The requested width is valid as a parameter but cannot be realized by this input.",
      "mentalModelCorrection": "Do not silently weaken an exact-width output contract to accept partial windows.",
      "mistakeTypes": [
        "partial_window_returned_for_k_greater_than_n"
      ],
      "nextAction": "Separate parameter validity from candidate existence.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sliding-window-edge-contract-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_earliest_optimal_window",
    "secondarySkillAtomIds": [
      "apply_strict_best_update",
      "implement_earliest_tie_breaking"
    ],
    "type": "single_choice",
    "prompt": "A width-2 maximum-sum function must return the earliest optimal window.\n\nvalues = [4, 1, 4, 1]\n\nBoth windows [4, 1] have sum 5. Which best-update rule preserves the required result?",
    "options": [
      {
        "id": "update_on_greater_only",
        "text": "Update the stored boundaries only when currentSum > bestSum.",
        "isCorrect": true
      },
      {
        "id": "update_on_greater_or_equal",
        "text": "Update whenever currentSum >= bestSum.",
        "isCorrect": false
      },
      {
        "id": "always_update",
        "text": "Replace the stored result after every complete window.",
        "isCorrect": false
      },
      {
        "id": "compare_window_length",
        "text": "Prefer the window with greater length even though every window has width 2.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The first optimum must remain stored when a later equal optimum appears.",
      "mentalModelCorrection": "The comparison operator used for best-state updates encodes the tie contract.",
      "mistakeTypes": [
        "latest_window_returned_under_earliest_tie_contract"
      ],
      "nextAction": "Use a strict improvement check when encounter order already visits candidates from earliest to latest.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sliding-window-edge-contract-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_latest_optimal_window",
    "secondarySkillAtomIds": [
      "apply_non_strict_best_update",
      "implement_latest_tie_breaking"
    ],
    "type": "single_choice",
    "prompt": "A width-2 maximum-sum function must return the latest optimal window.\n\nvalues = [4, 1, 4, 1]\n\nWhich best-update rule matches that contract during a left-to-right scan?",
    "options": [
      {
        "id": "update_on_greater_or_equal",
        "text": "Update the stored boundaries when currentSum >= bestSum.",
        "isCorrect": true
      },
      {
        "id": "update_on_greater_only",
        "text": "Update only when currentSum > bestSum.",
        "isCorrect": false
      },
      {
        "id": "keep_first_window",
        "text": "Never replace the initial complete window.",
        "isCorrect": false
      },
      {
        "id": "choose_smallest_left",
        "text": "Prefer the candidate with the smallest left boundary.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Later equal optima must replace earlier stored candidates.",
      "mentalModelCorrection": "Earliest and latest optimum contracts require different equality handling.",
      "mistakeTypes": [
        "earliest_window_returned_under_latest_tie_contract"
      ],
      "nextAction": "Define explicitly whether equality preserves or replaces the stored best candidate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sliding-window-edge-contract-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_inclusive_window_boundaries",
    "secondarySkillAtomIds": [
      "compute_window_length",
      "avoid_boundary_off_by_one"
    ],
    "type": "single_choice",
    "prompt": "A current window uses inclusive boundaries:\n\nleft = 3\nright = 6\n\nWhat is its length?",
    "options": [
      {
        "id": "length_four",
        "text": "4, using right - left + 1.",
        "isCorrect": true
      },
      {
        "id": "length_three",
        "text": "3, using right - left.",
        "isCorrect": false
      },
      {
        "id": "length_six",
        "text": "6, using right alone.",
        "isCorrect": false
      },
      {
        "id": "length_seven",
        "text": "7, because index 0 must also be counted.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Both endpoint indexes belong to an inclusive window.",
      "mentalModelCorrection": "Boundary formulas must match the declared inclusive or half-open representation.",
      "mistakeTypes": [
        "inclusive_window_length_off_by_one"
      ],
      "nextAction": "Enumerate the concrete included indexes before selecting a formula.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sliding-window-edge-contract-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "capture_best_window_boundaries_at_update_time",
    "secondarySkillAtomIds": [
      "avoid_stale_window_boundaries",
      "separate_current_from_best_state"
    ],
    "type": "mistake_review",
    "prompt": "A scan correctly stores bestSum whenever it finds an improved window, but it returns the final values of left and right after the scan.\n\nWhat is wrong?",
    "options": [
      {
        "id": "final_boundaries_not_best_boundaries",
        "text": "The final current boundaries may describe a different window; bestLeft and bestRight must be captured when bestSum is updated.",
        "isCorrect": true
      },
      {
        "id": "best_sum_is_unnecessary",
        "text": "Storing bestSum prevents correct boundary output.",
        "isCorrect": false
      },
      {
        "id": "final_window_is_always_best",
        "text": "Nothing is wrong because the final window is necessarily optimal.",
        "isCorrect": false
      },
      {
        "id": "boundaries_should_reset_zero",
        "text": "Both returned boundaries should always be reset to zero.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Current traversal state continues changing after the optimum may have been observed.",
      "mentalModelCorrection": "Optimization algorithms need separate state for the current candidate and the best candidate.",
      "mistakeTypes": [
        "current_window_boundaries_returned_as_best"
      ],
      "nextAction": "Update best value and best identity atomically.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sliding-window-edge-contract-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "return_explicit_no_result_for_window_search",
    "secondarySkillAtomIds": [
      "avoid_uninitialized_best_boundaries",
      "recognize_unsatisfied_window_condition"
    ],
    "type": "mistake_review",
    "prompt": "A variable-size window must return the shortest range whose sum is at least target.\n\nNo qualifying range exists, but bestLeft and bestRight remain initialized to 0, and the function returns [0, 0].\n\nWhat is the bug?",
    "options": [
      {
        "id": "fabricated_result",
        "text": "The function returns a fabricated range instead of the contract's explicit no-result value.",
        "isCorrect": true
      },
      {
        "id": "zero_zero_always_empty",
        "text": "[0, 0] always represents an empty range, so the result is correct.",
        "isCorrect": false
      },
      {
        "id": "target_should_be_lowered",
        "text": "The algorithm should reduce target until some range becomes valid.",
        "isCorrect": false
      },
      {
        "id": "last_window_should_return",
        "text": "The final inspected window should be returned even when it fails the condition.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "No successful candidate ever established valid best boundaries.",
      "mentalModelCorrection": "Default indexes are not evidence that a result exists.",
      "mistakeTypes": [
        "missing_no_result_state"
      ],
      "nextAction": "Track whether any qualifying candidate has been found or use a sentinel that cannot be mistaken for a valid range.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sliding-window-edge-contract-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "return_requested_window_representation",
    "secondarySkillAtomIds": [
      "distinguish_boundaries_from_values",
      "align_result_shape_with_contract"
    ],
    "type": "output_contract_analysis",
    "prompt": "A function contract says:\n\n\"Return the inclusive boundaries [start, end] of the optimal window.\"\n\nThe implementation returns values.slice(start, end + 1).\n\nWhat is the problem?",
    "options": [
      {
        "id": "returns_values_not_boundaries",
        "text": "It returns a copied sequence of values rather than the requested pair of source indexes.",
        "isCorrect": true
      },
      {
        "id": "slice_must_exclude_end",
        "text": "The only problem is that slice should use end instead of end + 1.",
        "isCorrect": false
      },
      {
        "id": "boundaries_and_values_equivalent",
        "text": "There is no problem because window values and boundaries are interchangeable.",
        "isCorrect": false
      },
      {
        "id": "must_return_sum",
        "text": "Every window function must return only the aggregate sum.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The public result shape is defined as coordinates in the original input.",
      "mentalModelCorrection": "Finding the correct window does not compensate for returning the wrong representation.",
      "mistakeTypes": [
        "window_values_returned_instead_of_boundaries"
      ],
      "nextAction": "Match the returned data structure to the exact contract noun.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sliding-window-edge-contract-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "materialize_requested_window_values",
    "secondarySkillAtomIds": [
      "distinguish_boundaries_from_copied_output",
      "preserve_inclusive_end_when_slicing"
    ],
    "type": "solution_comparison",
    "prompt": "A function finds inclusive boundaries [bestLeft, bestRight].\n\nIts contract requires a new array containing the optimal window values. Which return statement satisfies the contract?",
    "options": [
      {
        "id": "slice_inclusive_window",
        "text": "return values.slice(bestLeft, bestRight + 1);",
        "isCorrect": true
      },
      {
        "id": "return_boundaries",
        "text": "return [bestLeft, bestRight];",
        "isCorrect": false
      },
      {
        "id": "slice_excludes_last",
        "text": "return values.slice(bestLeft, bestRight);",
        "isCorrect": false
      },
      {
        "id": "return_original_array",
        "text": "return values;",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Array.prototype.slice excludes its second argument, while bestRight is part of the inclusive window.",
      "mentalModelCorrection": "Boundary convention and output representation must both be translated correctly.",
      "mistakeTypes": [
        "inclusive_window_copy_drops_last_value"
      ],
      "nextAction": "Convert the inclusive end into the exclusive end required by slice.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sliding-window-edge-contract-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "respect_non_mutating_window_contract",
    "secondarySkillAtomIds": [
      "avoid_unnecessary_input_mutation",
      "distinguish_read_only_scan_from_reordering"
    ],
    "type": "mistake_review",
    "prompt": "A sliding-window function is required to leave the input unchanged.\n\nBefore scanning, the implementation sorts values in place to make the data easier to process.\n\nWhat is the main issue?",
    "options": [
      {
        "id": "mutation_and_contiguity_violation",
        "text": "It mutates caller-visible input and changes which elements are contiguous, so it may violate both the mutation and window semantics.",
        "isCorrect": true
      },
      {
        "id": "sorting_required_for_windows",
        "text": "There is no issue because every sliding window requires sorted input.",
        "isCorrect": false
      },
      {
        "id": "only_complexity_changes",
        "text": "Sorting affects only Big-O and cannot affect correctness.",
        "isCorrect": false
      },
      {
        "id": "reverse_after_scan",
        "text": "Reversing the array afterward always restores the original input.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sliding windows depend on original adjacency, and in-place sorting is observable mutation.",
      "mentalModelCorrection": "Preprocessing must preserve every input property and side-effect constraint required by the contract.",
      "mistakeTypes": [
        "window_algorithm_mutates_read_only_input",
        "sorting_destroys_contiguous_window_identity"
      ],
      "nextAction": "Avoid reordering preprocessing when the problem is defined over original contiguous positions.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sliding-window-edge-contract-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_window_edge_and_output_contract_invariant",
    "secondarySkillAtomIds": [
      "preserve_best_candidate_identity",
      "represent_no_result_and_ties_correctly"
    ],
    "type": "invariant_identification",
    "prompt": "Which invariant most completely supports a sliding-window function with explicit no-result behavior and a defined tie rule?",
    "options": [
      {
        "id": "current_state_and_best_contract_aligned",
        "text": "The maintained state exactly represents the current boundaries; stored best boundaries refer to a previously valid candidate; ties update according to the specified earliest or latest rule; and no boundaries are returned unless a valid candidate has been found.",
        "isCorrect": true
      },
      {
        "id": "final_boundaries_are_best",
        "text": "The final current boundaries always identify the optimum.",
        "isCorrect": false
      },
      {
        "id": "default_zero_is_result",
        "text": "Initializing bestLeft and bestRight to zero guarantees a valid result for every input.",
        "isCorrect": false
      },
      {
        "id": "representation_is_optional",
        "text": "Returning indexes, values, a sum, or a mutated prefix are equivalent once the correct window was visited.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Correctness includes candidate validity, synchronized state, best-result identity, tie behavior, existence, and output representation.",
      "mentalModelCorrection": "Window mechanics are only one part of the observable function contract.",
      "mistakeTypes": [
        "window_edge_output_contract_invariant_incomplete"
      ],
      "nextAction": "Verify existence, identity, tie-breaking, boundary convention, representation, and mutation behavior separately.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];

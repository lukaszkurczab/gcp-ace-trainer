export const stringNormalizationQuestions = [
  {
    "acceptableApproachIds": [],
    "constraintSignal": "The comparison should ignore spaces and letter case before deciding whether the phrases match.",
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedApproachIds": [
      "normalize_then_compare"
    ],
    "feedbackModel": {
      "decisionSignal": "Transformation rules define the comparable representation, so they must run before equality is checked.",
      "distractorExplanations": {
        "raw_compare": "Raw comparison checks the wrong representation because it has not applied the stated transformations.",
        "compare_then_normalize": "Normalizing only after a failed comparison lets raw differences decide too early.",
        "sort_characters": "Sorting changes sequence order and is not part of the stated transformation rules."
      },
      "mentalModelCorrection": "Separate preprocessing from final comparison. Normalize first, then compare the normalized sequences.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "List transformation rules before choosing the comparison operation.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "normalization_before_comparison",
    "prompt": "A phrase comparison has two kinds of rules: transformation rules such as ignoring spaces and case, and a final equality check. What should happen first?",
    "reasonSignal": "Apply the same transformation rules to both inputs before comparing the transformed sequences.",
    "rejectedApproachIds": [
      "raw_compare",
      "compare_then_normalize",
      "sort_characters"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "transform_then_compare",
        "feedback": "The transformation rules must be applied to both inputs first; then the transformed sequences can be compared.",
        "id": "alg-prod-array-string-004-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "transform_then_compare",
            "text": "Apply the transformation rules to both inputs, then compare the transformed sequences."
          },
          {
            "id": "raw_compare",
            "text": "Compare the raw strings directly."
          },
          {
            "id": "compare_then_normalize",
            "text": "Compare first, then normalize only if they differ."
          },
          {
            "id": "sort_characters",
            "text": "Sort both strings before applying the stated rules."
          }
        ],
        "prompt": "Choose the correct pipeline order.",
        "status": "active",
        "testedSkillAtomIds": [
          "normalization_before_comparison"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "normalization_before_comparison",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Order transformation rules before equality",
    "trackId": "algorithms",
    "type": "strategy_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Sorting after normalization changes normalized sequence equality into an anagram-style comparison.",
      "distractorExplanations": {
        "normalization_unneeded": "The stated rules still require spaces and case to be normalized; sorting is the extra wrong step.",
        "counts_required": "Character counts also discard order, so they make the same kind of mistake as sorting.",
        "raw_lengths_enough": "Raw lengths do not account for ignored spaces or case."
      },
      "mentalModelCorrection": "Normalization changes which characters are comparable; it does not remove order unless the prompt says order does not matter.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "After normalization, ask whether the transformed sequence order is still part of the contract.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_string_normalization",
    "prompt": "A learner removes spaces and lowercases both phrases, then sorts the remaining characters before comparing. Why is this wrong when phrase order still matters?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "normalization_before_comparison",
      "diagnose_order_destroying_transform"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "turns_into_anagram",
        "feedback": "Sorting discards the normalized sequence order, so it accepts anagram-style matches that semantic equality should reject.",
        "id": "alg-prod-array-string-009-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "turns_into_anagram",
            "text": "It turns normalized sequence equality into an anagram-style comparison."
          },
          {
            "id": "normalization_unneeded",
            "text": "The mistake is that spaces and case should not be normalized."
          },
          {
            "id": "counts_required",
            "text": "The correct solution must compare only character counts."
          },
          {
            "id": "raw_lengths_enough",
            "text": "The correct solution should compare only raw lengths."
          }
        ],
        "prompt": "Choose the flaw in the learner's approach.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_string_normalization"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_string_normalization",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "diagnose_order_destroying_transform",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose sorting after normalization",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Materializing normalized copies can allocate memory proportional to input size, while streaming keeps only small pointer/current-character state.",
      "distractorExplanations": {
        "streaming_changes_semantics": "Streaming can preserve the same normalized sequence comparison if it applies the same rules incrementally.",
        "sorting_required": "Sorting is not required for normalized sequence equality and would change the comparison meaning.",
        "counts_required": "Frequency counts discard order, while normalized phrase equality still compares sequence order."
      },
      "mentalModelCorrection": "The semantic rule can stay the same while the implementation style changes the space cost.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Ask whether the normalized representation must be stored or can be compared as it is produced.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "streaming_normalization_tradeoff",
    "prompt": "Two very large strings should be compared while ignoring spaces and case. A learner builds full normalized copies first. What is the memory drawback compared with streaming the comparison?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "copies_use_linear_memory",
        "feedback": "Full normalized copies can use O(n + m) memory, while streaming can compare with constant auxiliary state.",
        "id": "alg-prod-array-string-015-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "copies_use_linear_memory",
            "text": "The normalized copies can use memory proportional to the input size."
          },
          {
            "id": "streaming_changes_semantics",
            "text": "Streaming cannot preserve normalized sequence equality."
          },
          {
            "id": "sorting_required",
            "text": "Sorting is required before either approach can compare strings."
          },
          {
            "id": "counts_required",
            "text": "Frequency counts are the only memory-efficient semantic comparison."
          }
        ],
        "prompt": "Choose the memory drawback.",
        "status": "active",
        "testedSkillAtomIds": [
          "streaming_normalization_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "streaming_normalization_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Explain the memory drawback of materialized normalization",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "acceptableApproachIds": [],
    "rejectedApproachIds": [
      "frequency_counting",
      "raw_compare",
      "length_only"
    ],
    "constraintSignal": "The prompt asks for normalized phrase equality, so order still matters after spaces and case are ignored.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedApproachIds": [
      "streaming_normalized_compare"
    ],
    "feedbackModel": {
      "decisionSignal": "The two approaches can both transform characters, but frequency counting changes the question from equality of sequence to equality of multiset.",
      "distractorExplanations": {
        "frequency_counting": "Frequency counting can be useful for anagram-style equality, but phrase equality still requires normalized order to match.",
        "raw_compare": "Raw comparison ignores none of the prompt's transformation rules.",
        "length_only": "Equal normalized length is necessary but not sufficient for equality."
      },
      "mentalModelCorrection": "Do not let normalization erase the comparison contract. Equality after normalization still compares a sequence, not just counts.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Ask whether the final comparison cares about order, multiplicity, or only presence.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-030",
    "learningStage": "foundations",
    "primarySkillAtomId": "streaming_normalization_tradeoff",
    "prompt": "Two strings should be equal after ignoring spaces and case, but their character order still matters. Which approach preserves the correct comparison meaning?",
    "reasonSignal": "Streaming normalized comparison keeps sequence order while avoiding full normalized copies.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization",
      "normalization_before_comparison"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "streaming_normalized_compare",
        "feedback": "A streaming normalized comparison skips ignored characters and compares normalized characters in order. Counts would answer an anagram-like question instead.",
        "id": "alg-prod-array-string-030-check",
        "mistakeTypes": [
          "wrong_approach",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "streaming_normalized_compare",
            "text": "Skip spaces and compare lowercased characters in order."
          },
          {
            "id": "frequency_counting",
            "text": "Count lowercased non-space characters and compare the counts."
          },
          {
            "id": "raw_compare",
            "text": "Compare the original strings directly."
          },
          {
            "id": "length_only",
            "text": "Compare only the number of non-space characters."
          }
        ],
        "prompt": "Choose the approach that preserves normalized equality.",
        "status": "active",
        "testedSkillAtomIds": [
          "streaming_normalization_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "streaming_normalization_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Do not turn normalized equality into frequency comparison",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "The comparison should ignore spaces and letter case, so raw string equality is too strict.",
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedApproachIds": [
      "normalize_then_compare"
    ],
    "feedbackModel": {
      "decisionSignal": "Ignore spaces and case is an explicit normalization signal before comparison.",
      "distractorExplanations": {
        "raw_compare": "Raw comparison treats spaces and case as meaningful, which contradicts the prompt.",
        "sort_characters": "Sorting changes sequence order and turns equality into an anagram-style problem.",
        "frequency_counts": "Counts ignore order, but semantic phrase equality still compares the normalized sequence."
      },
      "mentalModelCorrection": "Apply the stated transformations first, then compare under the original equality contract.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Separate transformation rules from the final comparison rule before choosing the loop.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-083",
    "learningStage": "foundations",
    "primarySkillAtomId": "normalization_before_comparison",
    "prompt": "A comparison should treat `New York` and `newyork` as equal. Which approach matches the rule?",
    "reasonSignal": "Both strings need the same normalization: remove spaces and apply consistent casing before comparing.",
    "rejectedApproachIds": [
      "raw_compare",
      "sort_characters",
      "frequency_counts"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "normalize_then_compare",
        "feedback": "Removing spaces and using consistent casing makes the two phrases comparable under the stated rule.",
        "id": "alg-prod-array-string-083-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "normalize_then_compare",
            "text": "Remove spaces, apply consistent casing, then compare the resulting strings."
          },
          {
            "id": "raw_compare",
            "text": "Compare the original strings directly."
          },
          {
            "id": "sort_characters",
            "text": "Sort the characters in both strings before comparing."
          },
          {
            "id": "frequency_counts",
            "text": "Count characters and compare only the counts."
          }
        ],
        "prompt": "Choose the approach that follows the comparison rule.",
        "status": "active",
        "testedSkillAtomIds": [
          "normalization_before_comparison"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "normalization_before_comparison",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Normalize spaces and case before phrase equality",
    "trackId": "algorithms",
    "type": "strategy_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Normalization changes the characters being compared, but it does not automatically remove order from the contract.",
      "distractorExplanations": {
        "sort_after_normalizing": "Sorting can make anagrams look equal, but semantic equality still requires the normalized sequence order to match.",
        "count_after_normalizing": "Counts ignore sequence order and answer an anagram-style question.",
        "compare_lengths_only": "Equal normalized length is necessary but not sufficient for equality."
      },
      "mentalModelCorrection": "Normalization defines the representation; it does not change equality into multiset comparison unless the prompt says so.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "After applying transformations, ask whether order still matters.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-084",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_string_normalization",
    "prompt": "Two phrases should be equal after removing spaces and ignoring case. The order of the remaining characters still matters. Which comparison is correct?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "normalization_before_comparison"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "normalized_sequence_compare",
        "feedback": "The correct comparison transforms both phrases, then compares the normalized sequences in order.",
        "id": "alg-prod-array-string-084-check",
        "mistakeTypes": [
          "wrong_approach",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "normalized_sequence_compare",
            "text": "Compare the normalized character sequences in order."
          },
          {
            "id": "sort_after_normalizing",
            "text": "Sort the normalized characters before comparing."
          },
          {
            "id": "count_after_normalizing",
            "text": "Compare only the counts of normalized characters."
          },
          {
            "id": "compare_lengths_only",
            "text": "Compare only the normalized lengths."
          }
        ],
        "prompt": "Choose the comparison that preserves the intended meaning.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_string_normalization"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_string_normalization",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Keep sequence equality after normalization",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Both strings must be normalized with the same transformation rules before their results are compared.",
      "distractorExplanations": {
        "normalize_first_only": "Normalizing only one input creates an unfair comparison between different representations.",
        "normalize_second_only": "The same rule must be applied to both inputs, not just the second one.",
        "compare_raw_then_normalize": "A raw mismatch may be irrelevant under the normalization rules, so normalizing after comparison is too late."
      },
      "mentalModelCorrection": "Semantic comparison requires symmetric preprocessing.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Check whether every input passed through the same normalization pipeline.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-085",
    "learningStage": "foundations",
    "primarySkillAtomId": "normalization_before_comparison",
    "prompt": "A learner lowercases only the first string before comparing two case-insensitive strings. What is the main mistake?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "normalize_both",
        "feedback": "Case-insensitive comparison requires applying the same casing rule to both strings.",
        "id": "alg-prod-array-string-085-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "normalize_both",
            "text": "Both strings must be normalized by the same rule."
          },
          {
            "id": "normalize_first_only",
            "text": "Only the first string should be normalized."
          },
          {
            "id": "normalize_second_only",
            "text": "Only the second string should be normalized."
          },
          {
            "id": "compare_raw_then_normalize",
            "text": "Raw comparison should happen before normalization."
          }
        ],
        "prompt": "Choose the mistake.",
        "status": "active",
        "testedSkillAtomIds": [
          "normalization_before_comparison"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "normalization_before_comparison",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Apply normalization symmetrically",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Only leading and trailing trim is weaker than ignoring spaces throughout the string.",
      "distractorExplanations": {
        "trim_enough": "Trimming removes edge spaces only, but the prompt says spaces anywhere should be ignored.",
        "case_only": "Lowercasing handles case, but not embedded spaces.",
        "sort_needed": "Sorting changes order and solves a different problem.",
        "edge_space": "Trimming handles this case, so it does not expose that trim is too weak for middle spaces.",
        "same_raw": "Identical raw strings do not test whether normalization is strong enough."
      },
      "mentalModelCorrection": "Match the transformation strength to the exact rule in the prompt.",
      "mistakeTypes": [
        "constraint_ignored",
        "edge_case_missed"
      ],
      "nextAction": "Check whether the ignored characters can appear in the middle, not just at the edges.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-086",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_string_normalization",
    "prompt": "A comparison should ignore all spaces. A learner only trims leading and trailing spaces. Which case exposes the bug?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "normalization_before_comparison"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "middle_space",
        "feedback": "`ab c` and `abc` should match when all spaces are ignored, but trimming alone leaves the middle space.",
        "id": "alg-prod-array-string-086-check",
        "mistakeTypes": [
          "constraint_ignored",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "middle_space",
            "text": "`ab c` and `abc`"
          },
          {
            "id": "edge_space",
            "text": "` abc ` and `abc`"
          },
          {
            "id": "same_raw",
            "text": "`abc` and `abc`"
          },
          {
            "id": "case_only",
            "text": "`ABC` and `abc`"
          }
        ],
        "prompt": "Choose the test case that exposes trimming as too weak.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_string_normalization"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_string_normalization",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Expose trimming as weaker than removing all spaces",
    "trackId": "algorithms",
    "type": "test_case_selection"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Memory pressure changes the implementation style, not the semantic rule being applied.",
      "distractorExplanations": {
        "build_copies": "Building normalized copies is logically valid, but it stores O(n + m) output when memory is constrained.",
        "sort_both": "Sorting changes semantic equality into an anagram-style comparison.",
        "frequency_counts": "Counting ignores order, but semantic equality after normalization still cares about sequence order."
      },
      "mentalModelCorrection": "Apply the same normalization rules incrementally when materializing full normalized strings is too expensive.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Ask whether the normalized representation has to be stored, or can be compared as it is produced.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-087",
    "learningStage": "foundations",
    "primarySkillAtomId": "streaming_normalization_tradeoff",
    "prompt": "Two huge strings should be compared while ignoring spaces and case. Memory is constrained. Which approach best preserves the semantic comparison?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "streaming_compare",
        "feedback": "A streaming normalized comparison skips ignored characters and compares normalized characters in order without storing full normalized copies.",
        "id": "alg-prod-array-string-087-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "streaming_compare",
            "text": "Compare normalized characters incrementally while scanning."
          },
          {
            "id": "build_copies",
            "text": "Always build full normalized copies first."
          },
          {
            "id": "sort_both",
            "text": "Sort both strings after removing spaces."
          },
          {
            "id": "frequency_counts",
            "text": "Count normalized characters and compare only counts."
          }
        ],
        "prompt": "Choose the memory-aware semantic comparison.",
        "status": "active",
        "testedSkillAtomIds": [
          "streaming_normalization_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "streaming_normalization_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose streaming normalized equality under memory pressure",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "complexityExplanation": "Building normalized copies scans both inputs and can allocate new strings proportional to the normalized output size.",
    "complexityVariables": {
      "m": "length of the second string",
      "n": "length of the first string"
    },
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(n + m)",
    "expectedTimeComplexity": "O(n + m)",
    "feedbackModel": {
      "decisionSignal": "Materializing normalized strings uses memory proportional to the transformed outputs.",
      "mentalModelCorrection": "A linear transformation is still linear-time, but storing its result changes the space claim.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Separate scan cost from the memory used by normalized copies.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-088",
    "learningStage": "foundations",
    "primarySkillAtomId": "streaming_normalization_tradeoff",
    "prompt": "You build normalized copies of two strings by removing spaces and lowercasing before comparing. What time and extra space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n + m)",
          "space": "O(n + m)"
        },
        "feedback": "The inputs are scanned once, and the normalized copies can grow with the total input size.",
        "id": "alg-prod-array-string-088-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and output-copy space.",
        "status": "active",
        "testedSkillAtomIds": [
          "streaming_normalization_tradeoff"
        ],
        "type": "complexity_pair"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "streaming_normalization_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Estimate materialized normalization cost",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "complexityExplanation": "A streaming normalized comparison scans through both strings and keeps only indexes or current characters as auxiliary state.",
    "complexityVariables": {
      "m": "length of the second string",
      "n": "length of the first string"
    },
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n + m)",
    "feedbackModel": {
      "decisionSignal": "Streaming applies normalization while scanning, so it avoids storing transformed copies.",
      "mentalModelCorrection": "The same semantic rule can have different space costs depending on whether the normalized representation is materialized.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Check whether normalized output is stored or compared incrementally.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-089",
    "learningStage": "foundations",
    "primarySkillAtomId": "streaming_normalization_tradeoff",
    "prompt": "You compare two strings while skipping spaces and lowercasing characters on the fly, without building normalized copies. What time and auxiliary space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n + m)",
          "space": "O(1)"
        },
        "feedback": "The scan may inspect both strings fully, but it only needs constant auxiliary state such as indexes and current normalized characters.",
        "id": "alg-prod-array-string-089-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and auxiliary space.",
        "status": "active",
        "testedSkillAtomIds": [
          "streaming_normalization_tradeoff"
        ],
        "type": "complexity_pair"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "streaming_normalization_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Estimate streaming normalization cost",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Ignored characters should be skipped, not compared as mismatches.",
      "distractorExplanations": {
        "return_false_on_space": "A space is ignored by the comparison rule, so it should not directly cause failure.",
        "count_space": "Counting spaces contradicts the ignore-spaces rule.",
        "sort_remaining": "Sorting is unrelated and changes sequence equality."
      },
      "mentalModelCorrection": "In streaming normalization, move past ignored characters before comparing meaningful characters.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "constraint_ignored"
      ],
      "nextAction": "When a pointer lands on an ignored character, advance that pointer before comparing.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-090",
    "learningStage": "foundations",
    "primarySkillAtomId": "streaming_normalization_tradeoff",
    "prompt": "In a streaming comparison that ignores spaces, one pointer currently points at a space. What should happen before comparing characters?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "skip_space",
        "feedback": "The pointer should advance past ignored spaces before comparing meaningful characters.",
        "id": "alg-prod-array-string-090-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "skip_space",
            "text": "Advance past the space because it is ignored."
          },
          {
            "id": "return_false_on_space",
            "text": "Return false immediately."
          },
          {
            "id": "count_space",
            "text": "Treat the space as a normal comparable character."
          },
          {
            "id": "sort_remaining",
            "text": "Sort the remaining characters."
          }
        ],
        "prompt": "Choose the next streaming step.",
        "status": "active",
        "testedSkillAtomIds": [
          "streaming_normalization_tradeoff"
        ],
        "type": "trace_next_step"
      }
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "Because spaces are ignored, the pointer moves until it reaches a non-space character or the end.",
        "id": "alg-prod-array-string-090-trace-001",
        "order": 1,
        "state": [
          "Pointer is currently on an ignored space character."
        ]
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "streaming_normalization_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace skipped spaces in streaming comparison",
    "trackId": "algorithms",
    "type": "trace_next_step"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Case-insensitive comparison means casing must be normalized before equality is checked.",
      "distractorExplanations": {
        "case_sensitive_raw": "Raw comparison treats `A` and `a` as different, which violates the prompt.",
        "remove_case_chars": "Ignoring case does not mean removing letters; it means comparing them under consistent casing.",
        "sort_letters": "Sorting changes order and solves a different problem."
      },
      "mentalModelCorrection": "Ignoring case is a transformation rule, not a deletion rule.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Translate case-insensitive into lowercasing or uppercasing both sides consistently.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-091",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_string_normalization",
    "prompt": "A comparison should be case-insensitive. How should `A` and `a` be handled?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "normalization_before_comparison"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "same_after_case_normalization",
        "feedback": "`A` and `a` should compare equal after applying consistent casing.",
        "id": "alg-prod-array-string-091-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "same_after_case_normalization",
            "text": "Treat them as equal after applying consistent casing."
          },
          {
            "id": "case_sensitive_raw",
            "text": "Treat them as different because the raw characters differ."
          },
          {
            "id": "remove_case_chars",
            "text": "Remove both letters from the comparison."
          },
          {
            "id": "sort_letters",
            "text": "Sort both strings before comparing them."
          }
        ],
        "prompt": "Choose the case-insensitive behavior.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_string_normalization"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_string_normalization",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Apply case-insensitive character comparison",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Removing punctuation is a normalization rule; ignoring case is a separate normalization rule.",
      "distractorExplanations": {
        "punctuation_only": "Removing punctuation alone still leaves uppercase and lowercase differences.",
        "case_only": "Lowercasing alone still leaves punctuation differences.",
        "raw_compare": "Raw comparison ignores none of the stated rules."
      },
      "mentalModelCorrection": "When multiple normalization rules are stated, every rule must be applied consistently.",
      "mistakeTypes": [
        "constraint_ignored",
        "edge_case_missed"
      ],
      "nextAction": "List all ignored or transformed character classes before comparing.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-092",
    "learningStage": "foundations",
    "primarySkillAtomId": "normalization_before_comparison",
    "prompt": "A comparison should ignore punctuation and case. Which preprocessing matches the contract?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "remove_punctuation_and_casefold",
        "feedback": "Both punctuation and case must be normalized before comparison.",
        "id": "alg-prod-array-string-092-check",
        "mistakeTypes": [
          "constraint_ignored",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "remove_punctuation_and_casefold",
            "text": "Remove punctuation and apply consistent casing to both strings."
          },
          {
            "id": "punctuation_only",
            "text": "Remove punctuation but keep original casing."
          },
          {
            "id": "case_only",
            "text": "Lowercase both strings but keep punctuation."
          },
          {
            "id": "raw_compare",
            "text": "Compare the raw strings directly."
          }
        ],
        "prompt": "Choose the preprocessing that applies all stated rules.",
        "status": "active",
        "testedSkillAtomIds": [
          "normalization_before_comparison"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "normalization_before_comparison",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Apply multiple normalization rules",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "The comparison ignores punctuation and case, so every stated normalization rule must be applied before comparing.",
    "expectedApproachIds": [
      "normalize_then_compare"
    ],
    "reasonSignal": "Normalize punctuation and case symmetrically before comparing the resulting strings.",
    "rejectedApproachIds": [
      "punctuation_only",
      "case_only",
      "raw_compare"
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A raw length mismatch can disappear after ignored characters are removed.",
      "distractorExplanations": {
        "reject_raw_length": "Raw length can differ because one string contains ignored characters.",
        "sort_first": "Sorting is unrelated to the length mismatch caused by ignored characters.",
        "count_raw": "Raw counts include ignored characters and violate the semantic comparison rule."
      },
      "mentalModelCorrection": "Do not use raw length as a final decision when normalization can remove characters.",
      "mistakeTypes": [
        "constraint_ignored",
        "edge_case_missed"
      ],
      "nextAction": "Apply normalization before using length as evidence.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-093",
    "learningStage": "foundations",
    "primarySkillAtomId": "normalization_before_comparison",
    "prompt": "A comparison ignores spaces. Why is it unsafe to reject immediately because the raw string lengths differ?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "normalized_lengths_may_match",
        "feedback": "Ignored spaces can make raw lengths differ even when the normalized strings are equal.",
        "id": "alg-prod-array-string-093-check",
        "mistakeTypes": [
          "constraint_ignored",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "normalized_lengths_may_match",
            "text": "The normalized lengths may still match after spaces are removed."
          },
          {
            "id": "reject_raw_length",
            "text": "Raw length mismatch always proves semantic mismatch."
          },
          {
            "id": "sort_first",
            "text": "The strings must be sorted before length can be checked."
          },
          {
            "id": "count_raw",
            "text": "Raw character counts are enough even when spaces are ignored."
          }
        ],
        "prompt": "Choose why raw length is not enough.",
        "status": "active",
        "testedSkillAtomIds": [
          "normalization_before_comparison"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "normalization_before_comparison",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Do not reject on raw length before normalization",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "After all ignored characters are skipped, both streams must end together for equality.",
      "distractorExplanations": {
        "first_end_is_enough": "One stream ending is not enough if the other still has meaningful characters.",
        "raw_lengths_equal": "Raw lengths are not decisive after normalization rules.",
        "sort_remaining": "Sorting remaining characters changes sequence equality."
      },
      "mentalModelCorrection": "Streaming equality must compare all meaningful characters and verify no meaningful characters remain on either side.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "edge_case_missed"
      ],
      "nextAction": "After the main comparison loop, skip trailing ignored characters and check both ends.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-094",
    "learningStage": "foundations",
    "primarySkillAtomId": "streaming_normalization_tradeoff",
    "prompt": "In a streaming comparison that ignores spaces, what must be true after all comparable characters have matched?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "both_meaningful_streams_end",
        "feedback": "After skipping ignored spaces, both strings must have no remaining meaningful characters.",
        "id": "alg-prod-array-string-094-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "both_meaningful_streams_end",
            "text": "Both normalized streams must be exhausted."
          },
          {
            "id": "first_end_is_enough",
            "text": "It is enough that the first raw string ends."
          },
          {
            "id": "raw_lengths_equal",
            "text": "Only the raw lengths must be equal."
          },
          {
            "id": "sort_remaining",
            "text": "Any remaining characters should be sorted."
          }
        ],
        "prompt": "Choose the final streaming equality check.",
        "status": "active",
        "testedSkillAtomIds": [
          "streaming_normalization_tradeoff"
        ],
        "type": "trace_next_step"
      }
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "Once matched characters are consumed, trailing ignored spaces can be skipped, then both streams must be at the end.",
        "id": "alg-prod-array-string-094-trace-001",
        "order": 1,
        "state": [
          "Comparable characters matched so far in a streaming normalized comparison."
        ]
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "streaming_normalization_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Check both normalized streams end together",
    "trackId": "algorithms",
    "type": "trace_next_step"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Normalization rules can make two raw-different strings semantically equal.",
      "distractorExplanations": {
        "raw_difference": "Raw difference is expected when ignored characters or case differ.",
        "frequency_only": "Frequency equality is weaker than normalized sequence equality.",
        "adjacency_only": "Neighbor relationships are unrelated to this semantic comparison."
      },
      "mentalModelCorrection": "Semantic equality compares transformed meaning, not raw bytes or raw characters.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Explain equality using the normalized representations.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-095",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_string_normalization",
    "prompt": "Why should `A b` and `ab` match when the comparison ignores spaces and case?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "normalization_before_comparison"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "same_normalized_sequence",
        "feedback": "Both inputs normalize to the same sequence, `ab`.",
        "id": "alg-prod-array-string-095-check",
        "mistakeTypes": [
          "constraint_ignored",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "same_normalized_sequence",
            "text": "They become the same normalized sequence."
          },
          {
            "id": "raw_difference",
            "text": "They should not match because the raw strings differ."
          },
          {
            "id": "frequency_only",
            "text": "They match only because the character counts match."
          },
          {
            "id": "adjacency_only",
            "text": "They match because adjacent characters are equal."
          }
        ],
        "prompt": "Choose the semantic-equality explanation.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_string_normalization"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_string_normalization",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Explain semantic equality from normalized form",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Counting normalized characters loses order, so it can accept anagrams that semantic equality should reject.",
      "distractorExplanations": {
        "ab_ba": "`ab` and `ba` have the same counts but different normalized sequence order.",
        "a_space_b_ab": "This should match after removing spaces.",
        "case_pair": "This should match after case normalization.",
        "same_raw": "This is a passing case for both raw and normalized equality."
      },
      "mentalModelCorrection": "Pick counterexamples that isolate the exact property the wrong approach forgets.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "To expose frequency misuse, use same counts with different order.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-096",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_string_normalization",
    "prompt": "A learner uses frequency counts for normalized phrase equality where order still matters. Which test case exposes the bug?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "normalization_before_comparison"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "ab_ba",
        "feedback": "`ab` and `ba` have the same counts, but they are not the same sequence.",
        "id": "alg-prod-array-string-096-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "ab_ba",
            "text": "`ab` and `ba`"
          },
          {
            "id": "a_space_b_ab",
            "text": "`a b` and `ab`"
          },
          {
            "id": "case_pair",
            "text": "`A` and `a`"
          },
          {
            "id": "same_raw",
            "text": "`abc` and `abc`"
          }
        ],
        "prompt": "Choose the counterexample.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_string_normalization"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_string_normalization",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Pick a counterexample for frequency misuse in normalized equality",
    "trackId": "algorithms",
    "type": "test_case_selection"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The comparison contract asks for normalized equality, not an anagram relation.",
      "distractorExplanations": {
        "anagram_contract": "Anagram comparison ignores order, but normalized equality preserves order after transformations.",
        "raw_contract": "Raw equality ignores none of the stated normalization rules.",
        "length_contract": "Length alone cannot prove equality."
      },
      "mentalModelCorrection": "Name the semantic contract before choosing whether to compare sequence, set, or counts.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Classify the final comparison as raw equality, normalized sequence equality, or multiset equality.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-097",
    "learningStage": "foundations",
    "primarySkillAtomId": "normalization_before_comparison",
    "prompt": "A prompt says two phrases match if they are equal after removing spaces and ignoring case. What comparison contract is this?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "normalized_sequence_equality",
        "feedback": "The contract is normalized sequence equality: transform both phrases, then compare order-preserving sequences.",
        "id": "alg-prod-array-string-097-check",
        "mistakeTypes": [
          "wrong_approach",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "normalized_sequence_equality",
            "text": "Normalized sequence equality."
          },
          {
            "id": "anagram_contract",
            "text": "Anagram equality."
          },
          {
            "id": "raw_contract",
            "text": "Raw string equality."
          },
          {
            "id": "length_contract",
            "text": "Length-only equality."
          }
        ],
        "prompt": "Choose the comparison contract.",
        "status": "active",
        "testedSkillAtomIds": [
          "normalization_before_comparison"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "normalization_before_comparison",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Name normalized sequence equality",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A normalized mismatch should be reported only after ignored characters are skipped and comparable characters are normalized.",
      "distractorExplanations": {
        "raw_mismatch": "Raw characters can differ because of case or ignored characters.",
        "skip_meaningful": "Only ignored characters should be skipped; meaningful mismatches matter.",
        "count_instead": "Counting loses order and does not preserve semantic sequence equality."
      },
      "mentalModelCorrection": "Compare meaningful normalized characters, not raw characters and not only counts.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "constraint_ignored"
      ],
      "nextAction": "Trace each pointer to the next meaningful character, normalize both, then compare.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-098",
    "learningStage": "foundations",
    "primarySkillAtomId": "streaming_normalization_tradeoff",
    "prompt": "In a streaming case-insensitive comparison, the next meaningful characters are `B` and `b`. What should the comparison do?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "apply_string_normalization"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "normalize_and_match",
        "feedback": "`B` and `b` match after applying consistent casing.",
        "id": "alg-prod-array-string-098-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "normalize_and_match",
            "text": "Normalize casing and treat them as matching."
          },
          {
            "id": "raw_mismatch",
            "text": "Return false because the raw characters differ."
          },
          {
            "id": "skip_meaningful",
            "text": "Skip both characters because letters are ignored."
          },
          {
            "id": "count_instead",
            "text": "Stop sequence comparison and compare only counts."
          }
        ],
        "prompt": "Choose the correct streaming comparison step.",
        "status": "active",
        "testedSkillAtomIds": [
          "streaming_normalization_tradeoff"
        ],
        "type": "trace_next_step"
      }
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "Case-insensitive comparison maps both characters to the same casing before equality is checked.",
        "id": "alg-prod-array-string-098-trace-001",
        "order": 1,
        "state": [
          "Next meaningful characters are `B` and `b`."
        ]
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "streaming_normalization_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace case-insensitive streaming comparison",
    "trackId": "algorithms",
    "type": "trace_next_step"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The normalized strings differ in sequence order, so semantic equality should reject them even though counts match.",
      "distractorExplanations": {
        "accept_counts": "Matching counts are not enough for normalized sequence equality.",
        "accept_sets": "Matching unique characters are weaker than matching counts and still ignore order.",
        "reject_raw_only": "The reason is not merely raw mismatch; the normalized sequences still differ."
      },
      "mentalModelCorrection": "For semantic equality, compare the normalized sequence itself.",
      "mistakeTypes": [
        "wrong_approach",
        "cannot_explain_why"
      ],
      "nextAction": "Write both normalized forms and compare them directly.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-099",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_string_normalization",
    "prompt": "`A b` normalizes to `ab`, and `ba` normalizes to `ba`. What should normalized sequence equality decide?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "normalization_before_comparison"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "reject_sequence_differs",
        "feedback": "The normalized sequences are `ab` and `ba`, so order differs and semantic equality should reject.",
        "id": "alg-prod-array-string-099-check",
        "mistakeTypes": [
          "wrong_approach",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "reject_sequence_differs",
            "text": "Reject because the normalized sequences differ."
          },
          {
            "id": "accept_counts",
            "text": "Accept because the character counts match."
          },
          {
            "id": "accept_sets",
            "text": "Accept because the unique characters match."
          },
          {
            "id": "reject_raw_only",
            "text": "Reject only because the raw strings differ."
          }
        ],
        "prompt": "Choose the normalized equality decision.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_string_normalization"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_string_normalization",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "string_normalization",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Reject equal counts when normalized order differs",
    "trackId": "algorithms",
    "type": "solution_comparison"
  }
];

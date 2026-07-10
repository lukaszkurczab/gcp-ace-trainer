// Planning target: complement lookup, lookup-before-insert order, avoiding self-pairing, original-index recovery, and duplicate values.
// It should teach that Map entries represent prior candidates available to pair with the current item.
// Target question count: 18.
// Prefer code review, ordering, and small lookup traces.
export const complementLookupAndIndexRecoveryQuestions = [
  {
    "approachId": "hash_map_complement_lookup",
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A complement can be checked against values already scanned.",
      "mentalModelCorrection": "Check prior state before storing the current value when one element cannot be reused.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "data_structure_mismatch"
      ],
      "nextAction": "Trace the check-before-store order on a small pair example.",
      "result": "diagnostic",
      "distractorExplanations": {
        "store_current_first": "This option leans on \"Store the current value before checking the complement\", but the useful rule is: Check prior state before storing the current value when one element cannot be reused.",
        "sort_then_lookup": "This option leans on \"Sort the input before every lookup\", but the useful rule is: Check prior state before storing the current value when one element cannot be reused."
      }
    },
    "id": "alg-hash-map-primer-001",
    "invariant": {
      "description": "The remembered values represent only the part of the input already scanned.",
      "id": "seen-values-invariant",
      "label": "Seen values are available for lookup"
    },
    "learningStage": "pattern_mechanics",
    "mechanicsSummary": "For each value, derive the needed complement, check prior lookup state, then store the current value for later positions.",
    "pitfalls": [
      {
        "description": "Checking the current value after storing it can accidentally reuse the same element.",
        "id": "reuse-current-element",
        "mistakeTypes": [
          "duplicate_handling_error",
          "edge_case_missed"
        ]
      },
      {
        "description": "Using lookup without explaining why average lookup changes the complexity.",
        "id": "lookup-without-complexity-reasoning",
        "mistakeTypes": [
          "cannot_explain_why",
          "complexity_mismatch"
        ]
      }
    ],
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "For target pair lookup, which action order prevents reusing the same input element?",
    "pseudocodeTemplate": {
      "id": "hash-map-complement-lookup-pseudocode",
      "language": "pseudocode",
      "lines": [
        {
          "id": "line-1",
          "indentationLevel": 0,
          "order": 1,
          "text": "create empty lookup structure"
        },
        {
          "id": "line-2",
          "indentationLevel": 0,
          "order": 2,
          "text": "for each value and position in input"
        },
        {
          "id": "line-3",
          "indentationLevel": 1,
          "order": 3,
          "text": "derive the value needed to satisfy the condition"
        },
        {
          "id": "line-4",
          "indentationLevel": 1,
          "order": 4,
          "text": "if needed value exists in lookup, return or record answer"
        },
        {
          "id": "line-5",
          "indentationLevel": 1,
          "order": 5,
          "text": "store current value for later checks"
        },
        {
          "id": "line-6",
          "indentationLevel": 0,
          "order": 6,
          "text": "return no-answer result if no match is found"
        }
      ]
    },
    "roadmapNodeId": "hash_map_and_set",
    "secondarySkillAtomIds": [
      "derive_time_complexity"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "check_complement_first",
        "feedback": "Check the complement against prior values first, then store the current value.",
        "id": "alg-check-hash-primer-001",
        "mistakeTypes": [
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "check_complement_first",
            "text": "Check the complement before storing the current value."
          },
          {
            "id": "store_current_first",
            "text": "Store the current value before checking the complement."
          },
          {
            "id": "sort_then_lookup",
            "text": "Sort the input before every lookup."
          }
        ],
        "prompt": "Choose the safe order for one-pass complement lookup.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "problem_archetype",
        "nodeId": "find_pair_with_condition",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      }
    ],
    "title": "Hash map complement lookup primer",
    "trackId": "algorithms",
    "type": "approach_primer",
    "whenNotToUseSignals": [
      "The input is already sorted and only a pair boundary needs to move.",
      "The task requires contiguous range state rather than membership or complement lookup."
    ],
    "whenToUseSignals": [
      "The task needs fast membership, count, or complement checks.",
      "A nested pair scan would be too slow for the input limit."
    ],
    "difficulty": "intro"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Complement lookup needs a fixed order of state updates.",
      "mentalModelCorrection": "Write the mechanics as ordered steps before translating them into code.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "duplicate_handling_error"
      ],
      "nextAction": "Place lookup before storing the current value.",
      "result": "diagnostic"
    },
    "id": "alg-hash-map-pseudocode-order-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Order the pseudocode for one-pass complement lookup.",
    "pseudocodeTemplate": {
      "id": "hash-map-complement-lookup-pseudocode",
      "language": "pseudocode",
      "lines": [
        {
          "id": "line-1",
          "indentationLevel": 0,
          "order": 1,
          "text": "create empty lookup structure"
        },
        {
          "id": "line-2",
          "indentationLevel": 0,
          "order": 2,
          "text": "for each value and position in input"
        },
        {
          "id": "line-3",
          "indentationLevel": 1,
          "order": 3,
          "text": "derive the value needed to satisfy the condition"
        },
        {
          "id": "line-4",
          "indentationLevel": 1,
          "order": 4,
          "text": "if needed value exists in lookup, return or record answer"
        },
        {
          "id": "line-5",
          "indentationLevel": 1,
          "order": 5,
          "text": "store current value for later checks"
        },
        {
          "id": "line-6",
          "indentationLevel": 0,
          "order": 6,
          "text": "return no-answer result if no match is found"
        }
      ]
    },
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "create_lookup",
          "scan_values",
          "derive_complement",
          "check_lookup",
          "store_current",
          "return_none"
        ],
        "feedback": "The lookup must exist before scanning, and the current value is stored only after its complement is checked.",
        "id": "alg-check-hash-pseudocode-order-001",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "create_lookup",
            "text": "Create an empty lookup."
          },
          {
            "id": "scan_values",
            "text": "Scan each value in the input."
          },
          {
            "id": "derive_complement",
            "text": "Compute the needed complement."
          },
          {
            "id": "check_lookup",
            "text": "Check whether the complement was seen earlier."
          },
          {
            "id": "store_current",
            "text": "Store the current value for later checks."
          },
          {
            "id": "return_none",
            "text": "Return no pair if the scan finishes."
          }
        ],
        "prompt": "Tap the steps in the correct order.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "order_steps"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      }
    ],
    "title": "Order complement lookup pseudocode",
    "trackId": "algorithms",
    "type": "pseudocode_ordering",
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "The needed complement is already present in prior lookup state.",
      "mentalModelCorrection": "At each value, inspect the lookup before changing it.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "duplicate_handling_error"
      ],
      "nextAction": "Trace one more value and name the lookup state before the update.",
      "result": "diagnostic",
      "distractorExplanations": {
        "store_7": "This option leans on \"Store 7 and continue without checking 2\", but the useful rule is: At each value, inspect the lookup before changing it.",
        "move_right_pointer": "This option leans on \"Move a right boundary inward\", but the useful rule is: At each value, inspect the lookup before changing it."
      }
    },
    "id": "alg-hash-map-trace-next-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Target is 9. Seen values are {2}. The current value is 7. What happens next?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "return_pair",
        "feedback": "The complement for 7 is 2, and 2 is already in the lookup, so the pair is found.",
        "id": "alg-check-hash-trace-next-001",
        "mistakeTypes": [
          "cannot_trace_algorithm"
        ],
        "options": [
          {
            "id": "return_pair",
            "text": "Return or record the pair because 2 was already seen."
          },
          {
            "id": "store_7",
            "text": "Store 7 and continue without checking 2."
          },
          {
            "id": "move_right_pointer",
            "text": "Move a right boundary inward."
          }
        ],
        "prompt": "Choose the next trace step.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "trace_next_step"
      }
    ],
    "stepByStepTrace": [
      {
        "description": "The scan has stored 2 from an earlier position.",
        "id": "hash-trace-seen-2",
        "order": 1,
        "state": [
          "seen = {2}",
          "current = 7",
          "target = 9"
        ]
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      }
    ],
    "title": "Trace the next complement lookup step",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "difficulty": "easy"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Worked example: badges are [4, 11, 6, 2], target is 8. Which step proves the pair is found without reusing one badge?",
      "mentalModelCorrection": "At value 2, the needed value 6 is already in seen state from an earlier position.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "cannot_explain_why"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Store 2 first and pair it with itself\", but the useful rule is: At value 2, the needed value 6 is already in seen state from an earlier position.",
        "wrong_2": "This option leans on \"Sort the badges before checking whether original positions still matter\", but the useful rule is: At value 2, the needed value 6 is already in seen state from an earlier position."
      }
    },
    "id": "alg-hash-map-worked-badge-pair-001",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Worked example: badges are [4, 11, 6, 2], target is 8. Which step proves the pair is found without reusing one badge?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "At value 2, the needed value 6 is already in seen state from an earlier position.",
        "id": "alg-hash-map-worked-badge-pair-001-check",
        "mistakeTypes": [
          "duplicate_handling_error",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "At value 2, the needed value 6 is already in seen state from an earlier position."
          },
          {
            "id": "wrong_1",
            "text": "Store 2 first and pair it with itself."
          },
          {
            "id": "wrong_2",
            "text": "Sort the badges before checking whether original positions still matter."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "complement_lookup",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Worked example: badge pair lookup",
    "trackId": "algorithms",
    "type": "worked_example",
    "approachChoiceReason": "Each badge needs a fast check for the value that completes the target while preserving different positions.",
    "approachId": "hash_map_complement_lookup",
    "commonMistakes": [
      "duplicate_handling_error",
      "cannot_explain_why"
    ],
    "complexityExplanation": "Each badge is scanned once, and seen state can store every earlier badge.",
    "constraints": [
      "Badge count can be large.",
      "A badge cannot pair with itself."
    ],
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "problemStatement": "Given badge values and a target, identify whether two different badges can sum to the target.",
    "pseudocodeTemplate": {
      "id": "hash-map-complement-lookup-pseudocode",
      "language": "pseudocode",
      "lines": [
        {
          "id": "line-1",
          "indentationLevel": 0,
          "order": 1,
          "text": "create empty lookup structure"
        },
        {
          "id": "line-2",
          "indentationLevel": 0,
          "order": 2,
          "text": "for each value and position in input"
        },
        {
          "id": "line-3",
          "indentationLevel": 1,
          "order": 3,
          "text": "derive the value needed to satisfy the condition"
        },
        {
          "id": "line-4",
          "indentationLevel": 1,
          "order": 4,
          "text": "if needed value exists in lookup, return or record answer"
        },
        {
          "id": "line-5",
          "indentationLevel": 1,
          "order": 5,
          "text": "store current value for later checks"
        },
        {
          "id": "line-6",
          "indentationLevel": 0,
          "order": 6,
          "text": "return no-answer result if no match is found"
        }
      ]
    },
    "solution": {
      "approachId": "hash_map_complement_lookup",
      "complexityExplanation": "Each badge is scanned once, and seen state can store every earlier badge.",
      "id": "alg-hash-map-worked-badge-pair-001-solution",
      "pseudocode": [
        "create empty lookup structure",
        "for each value and position in input",
        "derive the value needed to satisfy the condition",
        "if needed value exists in lookup, return or record answer",
        "store current value for later checks",
        "return no-answer result if no match is found"
      ],
      "spaceComplexity": "O(n)",
      "subgoalIds": [
        "derive-needed-value",
        "check-before-store",
        "store-current-value"
      ],
      "summary": "At value 2, the needed value 6 is already in seen state from an earlier position.",
      "timeComplexity": "O(n)",
      "title": "Worked example: badge pair lookup solution"
    },
    "stepByStepTrace": [
      {
        "description": "At value 2, the needed value 6 is already in seen state from an earlier position.",
        "id": "alg-hash-map-worked-badge-pair-001-trace-001",
        "order": 1,
        "state": [
          "Worked example: badges are [4, 11, 6, 2], target is 8. Which step proves the pair is found without reusing one badge?"
        ]
      }
    ],
    "subgoals": [
      {
        "description": "Identify what value or fact must be found quickly for each scanned value.",
        "id": "derive-needed-value",
        "label": "Derive lookup target",
        "order": 1
      },
      {
        "description": "Check previously scanned values before storing the current value when reuse is not allowed.",
        "id": "check-before-store",
        "label": "Check prior state",
        "order": 2
      },
      {
        "description": "Store the current value, count, or position for later checks.",
        "id": "store-current-value",
        "label": "Update lookup state",
        "order": 3
      }
    ],
    "whyNotAlternatives": [
      {
        "approachId": "label_only",
        "reason": "A pattern label without the decision signal does not justify the mechanics."
      }
    ],
    "difficulty": "easy"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A pair-sum scan cannot reuse the same entry twice. Which update order protects that rule?",
      "mentalModelCorrection": "Check the needed complement against prior values before storing the current value.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Store the current value first, then immediately pair it with itself\", but the useful rule is: Check the needed complement against prior values before storing the current value.",
        "wrong_2": "This option leans on \"Clear prior values after every failed complement check\", but the useful rule is: Check the needed complement against prior values before storing the current value."
      }
    },
    "id": "alg-exp-hash-strategy-003",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A pair-sum scan cannot reuse the same entry twice. Which update order protects that rule?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Check the needed complement against prior values before storing the current value.",
        "id": "alg-exp-hash-strategy-003-check",
        "mistakeTypes": [
          "duplicate_handling_error",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Check the needed complement against prior values before storing the current value."
          },
          {
            "id": "wrong_1",
            "text": "Store the current value first, then immediately pair it with itself."
          },
          {
            "id": "wrong_2",
            "text": "Clear prior values after every failed complement check."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "complement_lookup",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Choose safe complement order",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A pair-sum scan cannot reuse the same entry twice. Which update order protects that rule?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Check the needed complement against prior values before storing the current value.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Check the needed complement against prior values before storing the current value."
        },
        {
          "id": "wrong_1",
          "text": "Store the current value first, then immediately pair it with itself."
        },
        {
          "id": "wrong_2",
          "text": "Clear prior values after every failed complement check."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A pair task asks whether the current value has a prior complement. The input can be large. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Check the needed complement in prior state before storing the current value.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Check the needed complement in prior state before storing the current value.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Check the needed complement in prior state before storing the current value."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A pair task asks whether the current value has a prior complement. The input can be large. Which strategy signal should guide the choice?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Check the needed complement in prior state before storing the current value.",
        "id": "alg-prod-hash-001-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Check the needed complement in prior state before storing the current value."
          },
          {
            "id": "wrong_1",
            "text": "Choose the most familiar label before checking the constraint."
          },
          {
            "id": "wrong_2",
            "text": "Start with implementation details before naming the required state."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "complement_lookup",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 1",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A pair task asks whether the current value has a prior complement. The input can be large. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Check the needed complement in prior state before storing the current value.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Check the needed complement in prior state before storing the current value."
        },
        {
          "id": "wrong_1",
          "text": "Choose the most familiar label before checking the constraint."
        },
        {
          "id": "wrong_2",
          "text": "Start with implementation details before naming the required state."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A pair task asks whether the current value has a prior complement. Extra memory is acceptable only if it changes scaling. What time and extra space should you expect?",
      "mentalModelCorrection": "Each value is scanned once and lookup state can grow to n values.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-006",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A pair task asks whether the current value has a prior complement. Extra memory is acceptable only if it changes scaling. What time and extra space should you expect?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Each value is scanned once and lookup state can grow to n values.",
        "id": "alg-prod-hash-006-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "complement_lookup",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 6",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Each value is scanned once and lookup state can grow to n values.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A pair task asks whether the current value has a prior complement. Duplicate values are allowed. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Check the needed complement in prior state before storing the current value.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Check the needed complement in prior state before storing the current value.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Check the needed complement in prior state before storing the current value."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-011",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A pair task asks whether the current value has a prior complement. Duplicate values are allowed. Which strategy signal should guide the choice?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Check the needed complement in prior state before storing the current value.",
        "id": "alg-prod-hash-011-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Check the needed complement in prior state before storing the current value."
          },
          {
            "id": "wrong_1",
            "text": "Choose the most familiar label before checking the constraint."
          },
          {
            "id": "wrong_2",
            "text": "Start with implementation details before naming the required state."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "complement_lookup",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 11",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A pair task asks whether the current value has a prior complement. Duplicate values are allowed. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Check the needed complement in prior state before storing the current value.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Check the needed complement in prior state before storing the current value."
        },
        {
          "id": "wrong_1",
          "text": "Choose the most familiar label before checking the constraint."
        },
        {
          "id": "wrong_2",
          "text": "Start with implementation details before naming the required state."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A pair task asks whether the current value has a prior complement. The edge case appears at the first or last position. What time and extra space should you expect?",
      "mentalModelCorrection": "Each value is scanned once and lookup state can grow to n values.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-016",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A pair task asks whether the current value has a prior complement. The edge case appears at the first or last position. What time and extra space should you expect?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Each value is scanned once and lookup state can grow to n values.",
        "id": "alg-prod-hash-016-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "complement_lookup",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 16",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Each value is scanned once and lookup state can grow to n values.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A pair task asks whether the current value has a prior complement. The same input is queried many times. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Check the needed complement in prior state before storing the current value.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Check the needed complement in prior state before storing the current value.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Check the needed complement in prior state before storing the current value."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-021",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A pair task asks whether the current value has a prior complement. The same input is queried many times. Which strategy signal should guide the choice?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Check the needed complement in prior state before storing the current value.",
        "id": "alg-prod-hash-021-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Check the needed complement in prior state before storing the current value."
          },
          {
            "id": "wrong_1",
            "text": "Choose the most familiar label before checking the constraint."
          },
          {
            "id": "wrong_2",
            "text": "Start with implementation details before naming the required state."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "complement_lookup",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 21",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A pair task asks whether the current value has a prior complement. The same input is queried many times. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Check the needed complement in prior state before storing the current value.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Check the needed complement in prior state before storing the current value."
        },
        {
          "id": "wrong_1",
          "text": "Choose the most familiar label before checking the constraint."
        },
        {
          "id": "wrong_2",
          "text": "Start with implementation details before naming the required state."
        }
      ]
    }
  }
];


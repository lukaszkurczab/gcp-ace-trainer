import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const sortedDuplicateCollapseQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The first sorted value has no previous neighbor, so careless duplicate checks often skip it.",
      "distractorExplanations": {
        "sort_needed": "The array is already sorted in the prompt, so sorting is not the missing step.",
        "counts_required": "You only need one copy of each value, not the full frequency table.",
        "nested_required": "Sorted adjacency removes the need to compare every pair."
      },
      "mentalModelCorrection": "Accept the first value or initialize the write boundary before applying duplicate checks to later elements.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "off_by_one"
      ],
      "nextAction": "When collapsing sorted duplicates, decide how the first element enters the result before the main loop starts.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_duplicate_collapse",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one"
    ],
    "prompt": "Choose the most likely bug.",
    "roadmapNodeId": "arrays_and_strings",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "diagnose_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose the first-value duplicate-collapse bug",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A sorted array `[1, 1, 2, 2, 3]` should be collapsed into `[1, 2, 3]`. A learner only writes a value when it differs from the previous value, but starts checking at index 0. What mistake is most likely?",
    "answerFeedback": "Index 0 has no previous value to compare against, so the first unique element is easy to lose unless it is initialized separately.",
    "options": [
      {
        "id": "first_value_skipped",
        "text": "The first value may be skipped because there is no previous value to compare against.",
        "isCorrect": true
      },
      {
        "id": "sort_needed",
        "text": "The array must be sorted first.",
        "isCorrect": false
      },
      {
        "id": "counts_required",
        "text": "The algorithm must store the full frequency of each value.",
        "isCorrect": false
      },
      {
        "id": "nested_required",
        "text": "The algorithm needs a nested loop to compare all pairs.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The first sorted element is the first unique element when the array is non-empty, so the safest plan initializes it before scanning.",
      "distractorExplanations": {
        "compare_first_previous": "Index -1 is not a valid previous array element in this reasoning model, so this creates a boundary bug immediately.",
        "skip_first": "Skipping the first value drops a legitimate unique element from the result.",
        "start_middle": "Starting in the middle avoids nothing and leaves earlier values unprocessed."
      },
      "mentalModelCorrection": "Initialize the first accepted value before duplicate comparisons begin, then scan from index 1.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "off_by_one"
      ],
      "nextAction": "Whenever an algorithm compares with a previous accepted value, ask how that first accepted value is created.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "initialize_duplicate_collapse",
    "prompt": "Choose the safest initialization.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
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
        "nodeId": "initialize_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Initialize duplicate collapse safely",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "You collapse duplicates in a sorted array using a write boundary. Which initialization is safest?",
    "answerFeedback": "If the array is non-empty, accepting the first value before the loop avoids a bogus previous-value read at index 0.",
    "options": [
      {
        "id": "accept_first_then_scan",
        "text": "Accept the first element if the array is non-empty, then scan from the second element.",
        "isCorrect": true
      },
      {
        "id": "compare_first_previous",
        "text": "Start at index 0 and compare it with index -1.",
        "isCorrect": false
      },
      {
        "id": "skip_first",
        "text": "Skip the first element because duplicates are checked later.",
        "isCorrect": false
      },
      {
        "id": "start_middle",
        "text": "Start from the middle to avoid boundary cases.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Sorted duplicate collapse only needs boundary comparison. Full frequency storage is stronger than the problem requires.",
      "distractorExplanations": {
        "frequency_map": "A frequency map records more information than needed when the goal is only to keep one copy of each sorted value.",
        "write_boundary": "A write boundary is part of the intended in-place collapse because it marks where the next unique value should go.",
        "previous_value": "Comparing with the previous read or kept value is exactly how sorted duplicate collapse recognizes repeated values.",
        "scan_index": "A scan index is necessary because the algorithm still has to visit each element in order.",
        "sort_again": "The input is already sorted, so sorting again is unnecessary work.",
        "all_pairs": "Sorted adjacency already exposes duplicates without comparing every pair."
      },
      "mentalModelCorrection": "Use the sorted order that is already given instead of layering heavier state on top of it.",
      "mistakeTypes": [
        "wrong_approach",
        "complexity_mismatch"
      ],
      "nextAction": "Ask whether the prompt already provides enough structure to avoid a heavier data structure.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-024-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "avoid_unnecessary_state",
    "prompt": "Choose the state that is unnecessary here.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_duplicate_collapse"
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
        "nodeId": "avoid_unnecessary_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Avoid unnecessary frequency state in sorted collapse",
    "trackId": "algorithms",
    "type": "state_selection",
    "instruction": "A sorted array should be collapsed so each value appears once. Which extra state is unnecessary for the intended solution?",
    "answerFeedback": "Because equal values are already adjacent, a boundary comparison can collapse duplicates without storing full counts.",
    "options": [
      {
        "id": "frequency_map",
        "text": "A frequency map of every value.",
        "isCorrect": true
      },
      {
        "id": "write_boundary",
        "text": "A write boundary for the next unique slot.",
        "isCorrect": false
      },
      {
        "id": "previous_value",
        "text": "The previous kept or previous read value.",
        "isCorrect": false
      },
      {
        "id": "scan_index",
        "text": "A scan index moving left to right.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The wrong implementation forgets to seed the first run before later duplicate checks begin.",
      "distractorExplanations": {
        "empty_array": "An empty array checks empty-input handling, not whether the first non-empty run is initialized.",
        "unsorted_input": "The duplicate-collapse contract assumes sorted input, so an unsorted case mixes in a different issue.",
        "single_run_only": "A single run can reveal the missing first value, but it does not also check that later unique runs are still processed."
      },
      "mentalModelCorrection": "For sorted duplicate collapse, the first run must enter the result before comparisons against previous values can safely control later writes.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "cannot_explain_why"
      ],
      "nextAction": "Use counterexamples that isolate both initialization of the first run and continued processing of later unique values.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-028-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_duplicate_collapse",
    "prompt": "Choose the test case that best targets the missing-first-run bug.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "initialize_duplicate_collapse"
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
        "nodeId": "diagnose_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Pick a counterexample for the missing first run",
    "trackId": "algorithms",
    "type": "test_case_selection",
    "instruction": "A sorted-duplicate collapse writes later unique values when they differ from the previous value, but it forgets to seed the first run before the loop. Which test case best checks both the missing first run and a later unique run?",
    "answerFeedback": "`[1, 1, 2]` checks that the first run contributes `1` and that the later unique value `2` is still kept.",
    "options": [
      {
        "id": "one_then_duplicate_then_new",
        "text": "`[1, 1, 2]`",
        "isCorrect": true
      },
      {
        "id": "empty_array",
        "text": "`[]`",
        "isCorrect": false
      },
      {
        "id": "unsorted_input",
        "text": "`[2, 1, 1]`",
        "isCorrect": false
      },
      {
        "id": "single_run_only",
        "text": "`[2, 2, 2]`",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Sorted duplicates become adjacent, so one scan can collapse repeated runs.",
      "distractorExplanations": {
        "frequency_map": "A frequency map stores more information than needed when the input is already sorted and only one copy should remain.",
        "nested_pairs": "Sorted adjacency removes the need to compare every pair.",
        "sort_again": "The prompt already says the array is sorted, so sorting again is unnecessary."
      },
      "mentalModelCorrection": "Use the sorted order as structure: equal values form runs that can be collapsed by comparing with the previous kept or previous read value.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "When the input is sorted, ask whether duplicate handling can be reduced to adjacent-run reasoning.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-122-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_duplicate_collapse",
    "prompt": "Choose the property that enables the collapse.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "avoid_unnecessary_state"
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
        "nodeId": "diagnose_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Use sorted adjacency for duplicate collapse",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A sorted array should be collapsed so each value appears once. Which property makes a one-pass duplicate collapse possible?",
    "answerFeedback": "In a sorted array, equal values appear next to each other, so a scan can keep the first value of each run.",
    "options": [
      {
        "id": "duplicates_adjacent",
        "text": "Equal values are adjacent in the sorted input.",
        "isCorrect": true
      },
      {
        "id": "frequency_map",
        "text": "A frequency map is always required.",
        "isCorrect": false
      },
      {
        "id": "nested_pairs",
        "text": "Every pair of values must be compared.",
        "isCorrect": false
      },
      {
        "id": "sort_again",
        "text": "The array must be sorted again inside the algorithm.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The first element has no previous element, so it must be handled before previous-value comparisons begin.",
      "distractorExplanations": {
        "start_at_zero_compare_previous": "At index 0, there is no previous value to compare safely.",
        "skip_first_run": "Skipping the first run drops a valid unique value.",
        "count_all_values": "Counting every frequency is stronger than needed for keeping one copy of each sorted value."
      },
      "mentalModelCorrection": "Seed the result with the first value when the array is non-empty, then scan later values for new runs.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "off_by_one"
      ],
      "nextAction": "Before writing duplicate-collapse logic, decide how the first run enters the output.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-123-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "initialize_duplicate_collapse",
    "prompt": "Choose why first-value initialization matters.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_duplicate_collapse"
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
        "nodeId": "initialize_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Explain first-run initialization",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "When collapsing duplicates in a non-empty sorted array, why is the first value usually accepted before the main duplicate check?",
    "answerFeedback": "The first value starts the first run and has no previous value to compare against.",
    "options": [
      {
        "id": "first_has_no_previous",
        "text": "It starts the first run and has no previous value.",
        "isCorrect": true
      },
      {
        "id": "start_at_zero_compare_previous",
        "text": "It should be compared with index -1.",
        "isCorrect": false
      },
      {
        "id": "skip_first_run",
        "text": "The first run should be skipped.",
        "isCorrect": false
      },
      {
        "id": "count_all_values",
        "text": "Every value's full frequency must be stored first.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A new run starts exactly when the current sorted value differs from the previous kept value.",
      "distractorExplanations": {
        "same_as_previous": "If the value equals the previous kept value, it is still part of the same duplicate run.",
        "always_write": "Writing every value keeps duplicates instead of collapsing them.",
        "count_required": "A full count is unnecessary when sorted adjacency reveals runs directly."
      },
      "mentalModelCorrection": "Duplicate collapse keeps one representative per run, not every occurrence.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "cannot_trace_algorithm"
      ],
      "nextAction": "Trace each value as either same run or new run.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-124-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_duplicate_collapse",
    "prompt": "Choose when a value starts a new run.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
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
        "nodeId": "diagnose_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Write only the first value of each sorted run",
    "trackId": "algorithms",
    "type": "state_selection",
    "instruction": "In sorted duplicate collapse, when should the current value be written to the next unique slot?",
    "answerFeedback": "A different value starts a new sorted run, so it should be kept.",
    "options": [
      {
        "id": "different_from_previous_kept",
        "text": "When it differs from the previous kept value.",
        "isCorrect": true
      },
      {
        "id": "same_as_previous",
        "text": "When it equals the previous kept value.",
        "isCorrect": false
      },
      {
        "id": "always_write",
        "text": "Every time, regardless of duplicates.",
        "isCorrect": false
      },
      {
        "id": "count_required",
        "text": "Only after a full frequency table is built.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The duplicate run of `1`s collapses to one kept value, and `2` starts the next run.",
      "distractorExplanations": {
        "write_second_one": "The second `1` is still part of the existing run and should not be written as a new unique value.",
        "skip_two": "`2` differs from the previous kept value, so it starts a new run.",
        "need_count_first": "The sorted order already exposes the runs without counting every frequency."
      },
      "mentalModelCorrection": "Trace sorted collapse by runs: keep the first value of a run and skip the rest of that run.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "duplicate_handling_error"
      ],
      "nextAction": "For each read value, ask whether it starts a new run.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-125-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_duplicate_collapse",
    "prompt": "Choose the next duplicate-collapse step.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "trace_write_boundary",
      "initialize_duplicate_collapse"
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "`2` starts a new run after the run of `1`s, so it is written to the next unique slot.",
        "id": "alg-prod-array-string-125-trace-001",
        "order": 1,
        "state": [
          "Input: [1, 1, 2]",
          "First 1 already kept."
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
        "nodeId": "diagnose_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace a new run after duplicates",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "instruction": "You collapse sorted array `[1, 1, 2]`. After keeping the first `1`, what should happen when the scan reaches `2`?",
    "answerFeedback": "`2` differs from the previous kept value `1`, so it starts a new run and should be written.",
    "options": [
      {
        "id": "write_two",
        "text": "Write `2` as the next unique value.",
        "isCorrect": true
      },
      {
        "id": "write_second_one",
        "text": "Write the second `1` as another unique value first.",
        "isCorrect": false
      },
      {
        "id": "skip_two",
        "text": "Skip `2` because a duplicate was seen earlier.",
        "isCorrect": false
      },
      {
        "id": "need_count_first",
        "text": "Build a full frequency table before deciding.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "An empty sorted array has no first value to seed, so duplicate collapse should return an empty result.",
      "distractorExplanations": {
        "read_index_zero": "Reading index 0 is unsafe because no element exists.",
        "write_one": "No value was accepted, so the logical length cannot become 1.",
        "need_dummy": "A dummy value would pollute the result unless the contract explicitly asks for one."
      },
      "mentalModelCorrection": "First-value initialization must be guarded by a non-empty check.",
      "mistakeTypes": [
        "edge_case_missed",
        "off_by_one"
      ],
      "nextAction": "Handle empty input before seeding the first unique value.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-126-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "initialize_duplicate_collapse",
    "prompt": "Choose the empty-input behavior.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one"
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
        "nodeId": "initialize_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Guard first-value initialization on empty input",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A sorted duplicate-collapse routine normally accepts the first value before scanning from index 1. What should happen for an empty array?",
    "answerFeedback": "There is no first value to seed, so the result should remain empty or the logical length should be 0.",
    "options": [
      {
        "id": "return_empty",
        "text": "Return an empty result or logical length 0.",
        "isCorrect": true
      },
      {
        "id": "read_index_zero",
        "text": "Read index 0 and accept it.",
        "isCorrect": false
      },
      {
        "id": "write_one",
        "text": "Return logical length 1.",
        "isCorrect": false
      },
      {
        "id": "need_dummy",
        "text": "Insert a dummy value as the first unique value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A single-element sorted array contains exactly one unique run.",
      "distractorExplanations": {
        "zero_length": "A single existing value should be kept.",
        "compare_previous": "There is no previous value to compare against at index 0.",
        "need_second_value": "A second value is not needed to decide that the first run exists."
      },
      "mentalModelCorrection": "Short inputs are handled by the same first-run initialization guard.",
      "mistakeTypes": [
        "edge_case_missed",
        "duplicate_handling_error"
      ],
      "nextAction": "Test empty and single-element arrays separately.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-127-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "initialize_duplicate_collapse",
    "prompt": "Choose the single-element behavior.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_duplicate_collapse"
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
        "nodeId": "initialize_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Handle single-element duplicate collapse",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "What should sorted duplicate collapse return for a single-element array like `[7]`?",
    "answerFeedback": "`[7]` has one unique run, so the kept result is `[7]` or logical length 1.",
    "options": [
      {
        "id": "one_unique",
        "text": "Keep `[7]` with logical length 1.",
        "isCorrect": true
      },
      {
        "id": "zero_length",
        "text": "Return logical length 0.",
        "isCorrect": false
      },
      {
        "id": "compare_previous",
        "text": "Compare `7` with a previous element first.",
        "isCorrect": false
      },
      {
        "id": "need_second_value",
        "text": "Reject it because there is no second value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The sorted-input precondition is what makes adjacent duplicate collapse valid.",
      "distractorExplanations": {
        "works_unsorted": "In unsorted input, equal values can be separated, so comparing only adjacent values can miss duplicates.",
        "frequency_unneeded_always": "A count table may be needed if the input is not sorted and the task still depends on duplicates anywhere.",
        "sort_destroys_contract": "Sorting can be invalid for tasks requiring original order, but sorted duplicate collapse explicitly depends on sorted order."
      },
      "mentalModelCorrection": "Do not apply sorted-run logic unless the input is sorted or you are allowed to sort first.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Check whether sortedness is a stated precondition before using previous-value duplicate collapse.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-128-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_duplicate_collapse",
    "prompt": "Choose why sortedness matters.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "avoid_unnecessary_state"
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
        "nodeId": "diagnose_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Respect the sorted-input precondition",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "Why does sorted duplicate-collapse logic not automatically work on an unsorted array?",
    "answerFeedback": "Without sorted order, equal values can be separated, so adjacent-run logic can miss duplicates.",
    "options": [
      {
        "id": "duplicates_may_be_separated",
        "text": "Equal values may be separated rather than adjacent.",
        "isCorrect": true
      },
      {
        "id": "works_unsorted",
        "text": "It works the same on every unsorted array.",
        "isCorrect": false
      },
      {
        "id": "frequency_unneeded_always",
        "text": "Frequency or seen-state is never useful for unsorted input.",
        "isCorrect": false
      },
      {
        "id": "sort_destroys_contract",
        "text": "Sorted duplicate collapse never depends on sorted order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A good test for duplicate collapse includes repeated runs and later distinct runs.",
      "distractorExplanations": {
        "all_unique": "All unique values do not test whether duplicates are skipped.",
        "empty_array": "Empty input tests initialization but not duplicate-run handling.",
        "unsorted_case": "Unsorted input tests a different precondition issue."
      },
      "mentalModelCorrection": "Choose tests that exercise the actual run-collapse behavior under the sorted-input contract.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "cannot_explain_why"
      ],
      "nextAction": "Use sorted inputs with multiple runs to test both skipping duplicates and keeping new values.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-130-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_duplicate_collapse",
    "prompt": "Choose the strongest sorted-run test case.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "initialize_duplicate_collapse"
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
        "nodeId": "diagnose_duplicate_collapse",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "duplicate_handling",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Pick a strong sorted-run collapse test",
    "trackId": "algorithms",
    "type": "test_case_selection",
    "instruction": "Which sorted input best tests that duplicate collapse skips repeats but keeps later new values?",
    "answerFeedback": "`[1, 1, 2, 2, 3]` tests duplicate skipping across multiple runs and keeping later distinct values.",
    "options": [
      {
        "id": "multiple_runs",
        "text": "`[1, 1, 2, 2, 3]`",
        "isCorrect": true
      },
      {
        "id": "all_unique",
        "text": "`[1, 2, 3]`",
        "isCorrect": false
      },
      {
        "id": "empty_array",
        "text": "`[]`",
        "isCorrect": false
      },
      {
        "id": "unsorted_case",
        "text": "`[2, 1, 2]`",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];

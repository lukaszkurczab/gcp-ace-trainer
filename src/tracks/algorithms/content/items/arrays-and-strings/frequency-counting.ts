import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const frequencyCountingQuestions = [
  {
    "acceptableApproachIds": [],
    "constraintSignal": "Two strings should match only if each character appears the same number of times in both strings.",
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedApproachIds": [
      "character_frequency_state"
    ],
    "feedbackModel": {
      "decisionSignal": "The phrase same number of times is a frequency signal, so multiplicity has to be stored.",
      "distractorExplanations": {
        "seen_characters": "A set only tracks presence, so it treats `aab` and `ab` as if they were equivalent.",
        "first_last_characters": "First and last characters are only tiny positional samples. They do not describe the full content.",
        "adjacent_pairs": "Adjacent pairs describe local order, not total multiplicity across the whole string."
      },
      "mentalModelCorrection": "When the prompt cares about how many times each value appears, presence alone is not strong enough.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "edge_case_missed"
      ],
      "nextAction": "Separate membership checks from multiplicity checks before picking a data structure.",
      "result": "diagnostic"
    },
    "id": "alg-array-string-frequency-signal-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Choose the state that matches the requirement.",
    "reasonSignal": "Use a count for each character because multiplicity, not just presence, decides the answer.",
    "rejectedApproachIds": [
      "presence_only",
      "positional_sample",
      "adjacent_pair_tracking"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
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
        "nodeId": "choose_frequency_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose frequency state when counts matter",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "instruction": "Two strings should match only if each character appears the same number of times in both strings. Which state is necessary?",
    "answerFeedback": "Multiplicity requires counts, not just membership or a few positional samples.",
    "options": [
      {
        "id": "character_counts",
        "text": "A count for each character.",
        "isCorrect": true
      },
      {
        "id": "seen_characters",
        "text": "A set of characters seen in each string.",
        "isCorrect": false
      },
      {
        "id": "first_last_characters",
        "text": "Only the first and last character of each string.",
        "isCorrect": false
      },
      {
        "id": "adjacent_pairs",
        "text": "A list of adjacent character pairs.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "When duplicate counts matter, frequency comparison is stronger than a presence-only check.",
      "distractorExplanations": {
        "set_presence": "A set can match this specific pair, but it fails on cases like `ab` versus `aab` because it loses multiplicity.",
        "first_last": "Matching the ends says almost nothing about whether the full strings have the same multiset of characters.",
        "adjacent_duplicates": "Adjacent duplicates depend on order, but frequency equality does not require the same arrangement."
      },
      "mentalModelCorrection": "Presence is weaker than multiplicity. Use counts when the prompt says same frequencies, not just same characters.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Test whether a proposed check would still work on a string pair with the same letters but different counts.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Choose the stronger comparison.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
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
        "nodeId": "distinguish_presence_from_count",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Compare presence checks with frequency checks",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "You need an approach that accepts `aab` and `aba` as same-frequency strings, but rejects `ab` and `aab`. Which comparison is strong enough?",
    "answerFeedback": "Frequency counts preserve both presence and multiplicity, which is exactly what the prompt asks for.",
    "options": [
      {
        "id": "frequency_counts",
        "text": "Compare frequency counts for each character.",
        "isCorrect": true
      },
      {
        "id": "set_presence",
        "text": "Compare the set of characters present in each string.",
        "isCorrect": false
      },
      {
        "id": "first_last",
        "text": "Compare only the first and last characters.",
        "isCorrect": false
      },
      {
        "id": "adjacent_duplicates",
        "text": "Check whether each string has adjacent duplicates.",
        "isCorrect": false
      }
    ]
  },
  {
    "acceptableApproachIds": [
      "sort_both"
    ],
    "constraintSignal": "Two strings should match if they contain the same characters with the same frequencies. Large inputs make direct linear counting preferable when sorted output is not needed.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedApproachIds": [
      "frequency_counting"
    ],
    "feedbackModel": {
      "decisionSignal": "Same frequencies is a multiplicity problem, so counting stores the needed property directly. Sorting can be logically valid, but it pays extra ordering cost when no sorted output is required.",
      "distractorExplanations": {
        "sort_both": "Sorting can produce a correct comparison, but it is less direct for large inputs because it spends O(n log n) time arranging data that only needs counts.",
        "set_compare": "A set loses duplicate counts, so it cannot distinguish `ab` from `aab`.",
        "first_mismatch": "Position-by-position comparison is too strict because equal frequencies do not require the same order."
      },
      "mentalModelCorrection": "Separate logically valid from preferred under constraints. Here sorting can work, but counting matches the requested property more directly.",
      "mistakeTypes": [
        "cannot_explain_why",
        "complexity_mismatch"
      ],
      "nextAction": "When two approaches can both be correct, compare the information each one stores and the cost paid to get it.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Choose the more direct comparison under the stated constraint.",
    "reasonSignal": "Counting directly stores multiplicity without paying the sorting cost.",
    "rejectedApproachIds": [
      "set_compare",
      "first_mismatch"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "compare_complexity_tradeoffs"
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
        "nodeId": "distinguish_presence_from_count",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Prefer counting over sorting when counts are the signal",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Two strings should match if they contain the same characters with the same frequencies. Which comparison is more direct for large inputs when you do not need sorted output?",
    "answerFeedback": "Counting directly stores the multiplicity the prompt asks for. Sorting can also compare frequencies, but it is less direct for large inputs when sorted output is unnecessary.",
    "options": [
      {
        "id": "frequency_counting",
        "text": "Count characters and compare counts.",
        "isCorrect": true
      },
      {
        "id": "sort_both",
        "text": "Sort both strings and compare the sorted strings.",
        "isCorrect": false
      },
      {
        "id": "set_compare",
        "text": "Compare only the set of characters in each string.",
        "isCorrect": false
      },
      {
        "id": "first_mismatch",
        "text": "Return false at the first position where the strings differ.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "To expose a set-versus-count bug, you need inputs with the same unique characters but different multiplicities.",
      "distractorExplanations": {
        "ab_ba": "Both sets and true frequency counts agree on this pair, so it does not reveal the flaw.",
        "abc_abc": "This is a clean passing case for both the wrong and the right approach.",
        "empty_empty": "This checks empty-input handling rather than whether duplicate information was lost."
      },
      "mentalModelCorrection": "Pick a counterexample that isolates the exact information the wrong structure throws away.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Build test cases that keep one property the same and change only the property your structure forgets.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_data_structure_mismatch",
    "prompt": "Choose the test case that reveals the bug.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
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
        "nodeId": "diagnose_data_structure_mismatch",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Pick a counterexample for set misuse",
    "trackId": "algorithms",
    "type": "test_case_selection",
    "instruction": "A learner checks whether two strings have the same frequencies by converting both strings to sets. Which test case exposes the bug?",
    "answerFeedback": "The set of characters matches, but the multiplicities do not, so the bug becomes visible immediately.",
    "options": [
      {
        "id": "ab_aab",
        "text": "`ab` and `aab`",
        "isCorrect": true
      },
      {
        "id": "ab_ba",
        "text": "`ab` and `ba`",
        "isCorrect": false
      },
      {
        "id": "abc_abc",
        "text": "`abc` and `abc`",
        "isCorrect": false
      },
      {
        "id": "empty_empty",
        "text": "`\"\"` and `\"\"`",
        "isCorrect": false
      }
    ]
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "Two inputs match only if each value appears the same number of times in both inputs.",
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedApproachIds": [
      "frequency_counting"
    ],
    "feedbackModel": {
      "decisionSignal": "The phrase same number of times is a multiplicity signal, so the algorithm needs counts.",
      "distractorExplanations": {
        "presence_set": "A set remembers whether a value appears, but it forgets how many times it appears.",
        "sort_by_first_value": "Looking at the first value only ignores most of the input.",
        "adjacent_scan": "Adjacency checks local neighbors, not total multiplicity."
      },
      "mentalModelCorrection": "When equality depends on counts, choose state that stores counts, not just membership.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Underline phrases like same number of times, frequency, and multiplicity before choosing the data structure.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-060-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Choose the state that preserves the required information.",
    "reasonSignal": "Use frequency counts because the answer depends on multiplicity.",
    "rejectedApproachIds": [
      "presence_only",
      "first_value_sample",
      "adjacent_scan"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
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
        "nodeId": "choose_frequency_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose counts when multiplicity matters",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "instruction": "Two arrays should match only if every value appears the same number of times in both arrays. Which state best matches the requirement?",
    "answerFeedback": "A count per value preserves both presence and multiplicity.",
    "options": [
      {
        "id": "value_counts",
        "text": "A count for each value.",
        "isCorrect": true
      },
      {
        "id": "presence_set",
        "text": "A set of values that appear at least once.",
        "isCorrect": false
      },
      {
        "id": "sort_by_first_value",
        "text": "Only the first value of each array.",
        "isCorrect": false
      },
      {
        "id": "adjacent_scan",
        "text": "Only whether equal values are adjacent.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The pair has the same unique characters but different counts, so presence-only state fails.",
      "distractorExplanations": {
        "same_set": "This is the trap: both strings contain `a` and `b`, but the number of `a` characters differs.",
        "same_length": "The lengths differ, but the deeper reason is still lost multiplicity.",
        "same_order": "The strings do not need to have the same order for frequency equality.",
        "adjacent_difference": "Adjacency is not the property being compared."
      },
      "mentalModelCorrection": "Presence equality is weaker than frequency equality because it collapses duplicate information.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Use `ab` versus `aab` as the minimal counterexample for set misuse.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-061-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Choose the reason set comparison fails.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
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
        "nodeId": "distinguish_presence_from_count",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Explain why set equality loses counts",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Why does comparing sets give the wrong answer for `ab` and `aab` when the task asks for same character frequencies?",
    "answerFeedback": "Both strings have the same set of characters, but `aab` has one extra `a`, so counts are different.",
    "options": [
      {
        "id": "same_set_lost_count",
        "text": "The set is the same, but the character counts are different.",
        "isCorrect": true
      },
      {
        "id": "same_length",
        "text": "The strings have the same length.",
        "isCorrect": false
      },
      {
        "id": "same_order",
        "text": "The strings have the same order.",
        "isCorrect": false
      },
      {
        "id": "adjacent_difference",
        "text": "The strings differ only by adjacent duplicates.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The two examples isolate multiplicity: `aab` and `aba` match, but `ab` and `aab` do not.",
      "distractorExplanations": {
        "presence_only": "Presence-only comparison accepts both pairs, so it cannot reject `ab` versus `aab`.",
        "same_order": "Frequency equality allows different order, so `aab` and `aba` should still match.",
        "adjacent_only": "Adjacent duplicate structure is order-dependent and irrelevant to total counts."
      },
      "mentalModelCorrection": "Frequency equality compares multisets, not raw sequences and not sets.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Classify the target relation: sequence equality, set equality, or multiset equality.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-064-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Choose the relation these examples define.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
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
        "nodeId": "distinguish_presence_from_count",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize multiset equality from examples",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "An approach should accept `aab` and `aba`, but reject `ab` and `aab`. What relation is being tested?",
    "answerFeedback": "The relation is same frequency: order can differ, but duplicate counts must match.",
    "options": [
      {
        "id": "same_frequency",
        "text": "Same frequency of each character.",
        "isCorrect": true
      },
      {
        "id": "presence_only",
        "text": "Same set of unique characters.",
        "isCorrect": false
      },
      {
        "id": "same_order",
        "text": "Exactly the same character sequence.",
        "isCorrect": false
      },
      {
        "id": "adjacent_only",
        "text": "Same adjacent duplicate positions.",
        "isCorrect": false
      }
    ]
  },
  {
    "acceptableApproachIds": [
      "sort_both"
    ],
    "constraintSignal": "Same-frequency comparison does not require sorted output, so sorting may compute more structure than the task needs.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedApproachIds": [
      "frequency_counting"
    ],
    "feedbackModel": {
      "decisionSignal": "Sorting can be logically valid, but it pays O(n log n) ordering cost when the task only needs multiplicity.",
      "distractorExplanations": {
        "sorting_always_invalid": "Sorting both inputs can be logically valid for same-frequency comparison; the issue is the extra ordering cost.",
        "set_is_enough": "A set loses duplicate counts, so it is too weak for frequency equality.",
        "same_index_required": "Same-frequency strings do not need matching characters at the same positions."
      },
      "mentalModelCorrection": "Separate correctness from cost fit. Sorting may answer the question, but counting stores the required property more directly.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "When two approaches are correct, compare what extra information each approach computes.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-065-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_complexity_tradeoffs",
    "prompt": "Choose the missing tradeoff.",
    "reasonSignal": "Sorting can be correct, but it pays ordering cost for information that counting can store directly.",
    "rejectedApproachIds": [
      "presence_set",
      "same_index_compare"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count",
      "reason_about_frequency_counting_complexity"
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
        "nodeId": "compare_complexity_tradeoffs",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_presence_from_count",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Explain the sorting tradeoff for frequency comparison",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A learner says sorting both strings is always the best way to compare character frequencies because it avoids a hash table. What tradeoff are they missing for large inputs when sorted output is not needed?",
    "answerFeedback": "Sorting can compare frequencies after ordering, but it pays O(n log n) cost for sorted order that the prompt does not need.",
    "options": [
      {
        "id": "sorting_pays_ordering_cost",
        "text": "Sorting can be correct, but it pays ordering cost that counting avoids.",
        "isCorrect": true
      },
      {
        "id": "sorting_always_invalid",
        "text": "Sorting is always logically invalid for same-frequency comparison.",
        "isCorrect": false
      },
      {
        "id": "set_is_enough",
        "text": "A set is enough because duplicate counts do not matter.",
        "isCorrect": false
      },
      {
        "id": "same_index_required",
        "text": "The strings must have the same character at every index.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A counterexample for set misuse should keep unique values the same while changing multiplicities.",
      "distractorExplanations": {
        "same_counts_different_order": "This pair has the same counts, so both the correct frequency approach and the wrong set approach accept it.",
        "different_presence": "This changes presence, so even a set comparison can reject it.",
        "empty_empty": "Empty inputs do not expose duplicate loss."
      },
      "mentalModelCorrection": "A set preserves presence, but frequency equality needs counts.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Build counterexamples that change only the information the wrong structure forgets.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-066-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_data_structure_mismatch",
    "prompt": "Choose the counterexample.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
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
        "nodeId": "diagnose_data_structure_mismatch",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Pick an array counterexample for set misuse",
    "trackId": "algorithms",
    "type": "test_case_selection",
    "instruction": "A learner uses sets to test whether two arrays have the same value frequencies. Which test case best exposes the bug?",
    "answerFeedback": "Both arrays contain the same unique values, 2 and 4, but the multiplicities differ: one has two 4s, the other has two 2s.",
    "options": [
      {
        "id": "same_values_different_counts",
        "text": "`[4, 4, 2]` and `[4, 2, 2]`",
        "isCorrect": true
      },
      {
        "id": "same_counts_different_order",
        "text": "`[4, 2]` and `[2, 4]`",
        "isCorrect": false
      },
      {
        "id": "different_presence",
        "text": "`[4, 2]` and `[4, 3]`",
        "isCorrect": false
      },
      {
        "id": "empty_empty",
        "text": "`[]` and `[]`",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "An anagram-style requirement cares about character multiplicity, not original order.",
      "distractorExplanations": {
        "same_index": "That is exact sequence equality, which is too strict for anagram-style matching.",
        "unique_only": "Unique characters ignore duplicate counts.",
        "neighbor_only": "Neighbor checks describe local positions, not total character inventory."
      },
      "mentalModelCorrection": "Anagram-style equality means same multiset of characters.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "When order can change but counts cannot, choose frequency comparison.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-067-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Choose the comparison that fits the contract.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
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
        "nodeId": "choose_frequency_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Map anagram-style wording to counts",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "Order can differ, but duplicate counts must match.",
    "expectedApproachIds": [
      "frequency_counting"
    ],
    "reasonSignal": "Use frequency comparison because the contract ignores order but preserves multiplicity.",
    "rejectedApproachIds": [
      "same_index_compare",
      "unique_only",
      "adjacent_scan"
    ],
    "instruction": "Two strings should be treated as matching even if their characters appear in different order, but duplicate counts must match. What should the comparison use?",
    "answerFeedback": "Different order is allowed, but duplicate counts must match, so frequency comparison fits.",
    "options": [
      {
        "id": "frequency_comparison",
        "text": "Compare character frequencies.",
        "isCorrect": true
      },
      {
        "id": "same_index",
        "text": "Compare characters at the same indexes.",
        "isCorrect": false
      },
      {
        "id": "unique_only",
        "text": "Compare only unique characters.",
        "isCorrect": false
      },
      {
        "id": "neighbor_only",
        "text": "Check only adjacent equal characters.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A frequency table starts from zero counts and changes as each value is scanned.",
      "distractorExplanations": {
        "only_presence": "Presence would only record that `a` appeared, not how many times.",
        "sort_required": "Sorting is not needed to update counts.",
        "adjacent_required": "The two `a` characters do not need to be adjacent to increase the same counter.",
        "a_count_one": "A key appearing once in the table is not the same as count 1; the value `a` appears twice in the scan."
      },
      "mentalModelCorrection": "Frequency state is updated by the value, not by the value's position.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "data_structure_mismatch"
      ],
      "nextAction": "Trace each character as an increment to its bucket.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-068-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Choose the traced frequency state.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "`a` is seen twice, so the count table stores `a: 2` after the scan.",
        "id": "alg-prod-array-string-068-trace-001",
        "order": 1,
        "state": [
          "Scanned characters: a, b, c, a."
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
        "nodeId": "choose_frequency_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace a repeated character count",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "instruction": "You scan `abca` and update a frequency table. What should the count for `a` be after the full scan?",
    "answerFeedback": "`a` appears at the first and last positions, so its count is 2.",
    "options": [
      {
        "id": "a_count_two",
        "text": "`a` has count 2.",
        "isCorrect": true
      },
      {
        "id": "a_count_one",
        "text": "`a` has count 1 because it is stored once as a key.",
        "isCorrect": false
      },
      {
        "id": "sort_required",
        "text": "The count cannot be known without sorting.",
        "isCorrect": false
      },
      {
        "id": "adjacent_required",
        "text": "The count increases only if `a` is adjacent to another `a`.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The length mismatch alone proves the frequency tables cannot be identical.",
      "distractorExplanations": {
        "must_count_all": "Counting all characters can work, but it is unnecessary once lengths differ for same-frequency strings.",
        "sets_enough": "Sets can still be equal even when frequencies differ.",
        "sort_needed": "Sorting is not required to discover this early impossibility."
      },
      "mentalModelCorrection": "For same-frequency comparison, total length is a cheap necessary condition.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Check simple necessary conditions before building heavier state.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-069-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Choose the valid early conclusion.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_frequency_counting_complexity"
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
        "nodeId": "choose_frequency_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Use length as a necessary frequency check",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "Two strings must have exactly the same character frequencies. What can you conclude immediately if their lengths are different?",
    "answerFeedback": "If total lengths differ, at least one total count differs, so the strings cannot have identical frequencies.",
    "options": [
      {
        "id": "cannot_match",
        "text": "They cannot have identical character frequencies.",
        "isCorrect": true
      },
      {
        "id": "must_count_all",
        "text": "You must still count every character before deciding.",
        "isCorrect": false
      },
      {
        "id": "sets_enough",
        "text": "Equal sets would still prove they match.",
        "isCorrect": false
      },
      {
        "id": "sort_needed",
        "text": "They must be sorted before any conclusion is possible.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A missing key is equivalent to a zero count before increments or decrements.",
      "distractorExplanations": {
        "error_immediately": "A missing key can be treated as zero in a count table.",
        "presence_true": "Missing means the value has not been seen, not that it is present.",
        "sort_first": "Sorting is unrelated to initializing a count."
      },
      "mentalModelCorrection": "Frequency tables usually default unseen values to zero.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "edge_case_missed"
      ],
      "nextAction": "State the default count before updating a bucket.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-070-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Choose the default count behavior.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
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
        "nodeId": "choose_frequency_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Initialize unseen frequency buckets",
    "trackId": "algorithms",
    "type": "state_selection",
    "instruction": "While building a frequency table, you encounter a value that is not yet in the table. What count should it be treated as before incrementing?",
    "answerFeedback": "An unseen value has count 0 before its first increment.",
    "options": [
      {
        "id": "zero_before_increment",
        "text": "0, then increment to 1.",
        "isCorrect": true
      },
      {
        "id": "error_immediately",
        "text": "Throw an error because the key is missing.",
        "isCorrect": false
      },
      {
        "id": "presence_true",
        "text": "Treat it as already present with count 1 before incrementing.",
        "isCorrect": false
      },
      {
        "id": "sort_first",
        "text": "Sort the input before assigning any count.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A negative count means the second input used a value more times than the first input provided it.",
      "distractorExplanations": {
        "still_possible": "Once a count goes negative during a subtract pass, the current prefix already violates available multiplicity.",
        "order_problem": "Negative count is about multiplicity, not ordering.",
        "adjacency_problem": "Nothing about a negative count refers to neighboring positions."
      },
      "mentalModelCorrection": "In decrement-based comparison, negative counts are evidence of overuse.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "data_structure_mismatch"
      ],
      "nextAction": "When subtracting counts, check whether any bucket drops below zero.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-071-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Choose what the negative count signals.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "Subtracting below zero means the second input has consumed more copies of that value than were available.",
        "id": "alg-prod-array-string-071-trace-001",
        "order": 1,
        "state": [
          "A count table is being decremented while scanning the second string."
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
        "nodeId": "choose_frequency_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Interpret a negative frequency count",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "instruction": "You count characters from the first string, then subtract while scanning the second string. What does it mean if a count becomes negative?",
    "answerFeedback": "A negative count means the second string contains that character more times than the first string did.",
    "options": [
      {
        "id": "second_uses_too_many",
        "text": "The second string uses that character too many times.",
        "isCorrect": true
      },
      {
        "id": "still_possible",
        "text": "The strings may still have identical frequencies.",
        "isCorrect": false
      },
      {
        "id": "order_problem",
        "text": "Only the character order is wrong.",
        "isCorrect": false
      },
      {
        "id": "adjacency_problem",
        "text": "Only adjacent duplicate handling is wrong.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "All counts returning to zero means the same multiplicities were added and removed.",
      "distractorExplanations": {
        "same_order": "Zero counts prove multiplicity balance, not original order.",
        "same_set_only": "Zero counts are stronger than set equality because they include duplicates.",
        "adjacent_match": "Frequency balance says nothing about adjacent positions."
      },
      "mentalModelCorrection": "Balanced counts prove multiset equality, not sequence equality.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "After decrementing, check whether every stored count is zero.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-072-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Choose what balanced counts prove.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
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
        "nodeId": "distinguish_presence_from_count",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Explain balanced frequency counts",
    "trackId": "algorithms",
    "type": "state_selection",
    "instruction": "After counting the first string and subtracting the second string, every count is zero. What does that prove?",
    "answerFeedback": "Every count returning to zero proves the two strings have the same frequency for every stored character.",
    "options": [
      {
        "id": "same_frequencies",
        "text": "The strings have the same character frequencies.",
        "isCorrect": true
      },
      {
        "id": "same_order",
        "text": "The strings have the same character order.",
        "isCorrect": false
      },
      {
        "id": "same_set_only",
        "text": "Only the unique character sets match.",
        "isCorrect": false
      },
      {
        "id": "adjacent_match",
        "text": "Adjacent duplicates match at the same positions.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A frequency table is stronger than a seen set when the final answer depends on exact counts.",
      "distractorExplanations": {
        "seen_set": "A seen set can detect whether a value repeated, but not whether it appeared exactly three times.",
        "adjacent_scan": "Adjacent checks miss separated copies.",
        "length_only": "Length does not identify which value has which count."
      },
      "mentalModelCorrection": "Choose the weakest state that still preserves the property the prompt asks for.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Decide whether the answer needs exact counts, a repeat flag, or only presence.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-074-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Choose why counts are required.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
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
        "nodeId": "distinguish_presence_from_count",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Use exact counts for exact-frequency queries",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A task asks which values appear exactly three times. Why is a set of seen values not enough?",
    "answerFeedback": "A set only stores presence. The task needs the exact count for each value.",
    "options": [
      {
        "id": "needs_exact_counts",
        "text": "The task needs exact counts for each value.",
        "isCorrect": true
      },
      {
        "id": "seen_set",
        "text": "A seen set stores exact counts automatically.",
        "isCorrect": false
      },
      {
        "id": "adjacent_scan",
        "text": "Only adjacent values can appear exactly three times.",
        "isCorrect": false
      },
      {
        "id": "length_only",
        "text": "The array length alone gives each value's count.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "If the prompt asks for the most frequent value, the algorithm must preserve counts and compare them.",
      "distractorExplanations": {
        "presence_set": "Presence cannot distinguish a value seen once from a value seen many times.",
        "first_value": "The first value may not be the most frequent.",
        "adjacent_count": "Adjacent runs do not capture total frequency when equal values are separated."
      },
      "mentalModelCorrection": "Most frequent means aggregate counts across the whole input.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "For max-frequency tasks, track both the count table and the best count seen so far.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-077-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Choose the state needed for most-frequent reasoning.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
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
        "nodeId": "choose_frequency_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose counts for most-frequent value",
    "trackId": "algorithms",
    "type": "state_selection",
    "instruction": "A task asks for the value that appears most often in an array. Which state is necessary?",
    "answerFeedback": "To know which value appears most often, you need counts for values, not just whether they appeared.",
    "options": [
      {
        "id": "count_table",
        "text": "A count table by value.",
        "isCorrect": true
      },
      {
        "id": "presence_set",
        "text": "A set of values seen.",
        "isCorrect": false
      },
      {
        "id": "first_value",
        "text": "Only the first value.",
        "isCorrect": false
      },
      {
        "id": "adjacent_count",
        "text": "Only adjacent repeated runs.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Separated repeats require aggregate frequency, not run-length or adjacency logic.",
      "distractorExplanations": {
        "adjacent_runs": "Runs only count consecutive copies and miss separated repeats.",
        "first_last": "The endpoints do not summarize total frequency.",
        "sort_not_needed": "Sorting can group values, but a count table answers directly without requiring sorted output.",
        "single_run": "A single run does not expose the flaw because adjacent-run counting can count consecutive copies correctly.",
        "all_unique": "All values appear once, so there are no separated repeats to undercount.",
        "empty_array": "Empty input checks boundary behavior, not whether separated repeats are aggregated."
      },
      "mentalModelCorrection": "Frequency means total occurrences across the whole input, regardless of position.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Check whether repeated values must be adjacent or can be separated.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-078-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_data_structure_mismatch",
    "prompt": "Choose the test case that exposes separated multiplicity.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
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
        "nodeId": "diagnose_data_structure_mismatch",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Expose run-counting as weak frequency logic",
    "trackId": "algorithms",
    "type": "test_case_selection",
    "instruction": "A learner counts only adjacent runs to find the most frequent value. Which input exposes the flaw?",
    "answerFeedback": "`[1, 2, 1, 2, 1]` has separated repeats of `1`, so adjacent-run counting undercounts the true frequency.",
    "options": [
      {
        "id": "separated_repeats",
        "text": "`[1, 2, 1, 2, 1]`",
        "isCorrect": true
      },
      {
        "id": "single_run",
        "text": "`[1, 1, 1, 2]`",
        "isCorrect": false
      },
      {
        "id": "all_unique",
        "text": "`[1, 2, 3, 4]`",
        "isCorrect": false
      },
      {
        "id": "empty_array",
        "text": "`[]`",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Exact sequence comparison is too strict because same frequencies can appear in different order.",
      "distractorExplanations": {
        "first_mismatch_false": "Returning false at the first positional mismatch rejects valid same-frequency pairs like `abc` and `bca`.",
        "set_compare": "Set comparison is too weak because it loses counts.",
        "adjacent_compare": "Adjacency is unrelated to total frequency equality.",
        "needs_normalization": "The failure is not case or whitespace normalization; it is treating frequency equality as positional equality."
      },
      "mentalModelCorrection": "Same-frequency equality ignores order but preserves multiplicity.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Ask whether order is part of the contract before using index-by-index comparison.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-079-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Choose the flaw.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
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
        "nodeId": "distinguish_presence_from_count",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Reject position equality for frequency equality",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A learner compares two same-frequency strings index by index and returns false at the first mismatch. What is the mistake?",
    "answerFeedback": "Same-frequency strings can have different order, so index-by-index equality is too strict.",
    "options": [
      {
        "id": "order_too_strict",
        "text": "The approach incorrectly requires the same order.",
        "isCorrect": true
      },
      {
        "id": "set_compare",
        "text": "The approach compares only unique characters.",
        "isCorrect": false
      },
      {
        "id": "adjacent_compare",
        "text": "The approach checks only adjacent duplicates.",
        "isCorrect": false
      },
      {
        "id": "needs_normalization",
        "text": "The approach only needs case normalization.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A frequency table can be updated in one pass while tracking the current best count.",
      "distractorExplanations": {
        "nested_recount": "Recounting the whole array for each value repeats work unnecessarily.",
        "sort_required": "Sorting can help, but it is not required for counting frequencies.",
        "presence_only": "Presence cannot identify the largest count."
      },
      "mentalModelCorrection": "Update aggregate state incrementally instead of recomputing counts from scratch.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "For each scanned value, increment its count and compare the new count with the best count.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-080-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_complexity_tradeoffs",
    "prompt": "Choose the better reasoning.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_frequency_counting_complexity",
      "choose_frequency_state"
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
        "nodeId": "compare_complexity_tradeoffs",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_frequency_counting_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Avoid nested recounting for frequency queries",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "To find the most frequent value, a learner recounts the entire array for every distinct value. What is the better reasoning?",
    "answerFeedback": "Incremental frequency counting avoids repeated full scans and keeps the needed aggregate state.",
    "options": [
      {
        "id": "incremental_counting",
        "text": "Scan once, update counts, and track the best count.",
        "isCorrect": true
      },
      {
        "id": "nested_recount",
        "text": "Recount the full array for each distinct value.",
        "isCorrect": false
      },
      {
        "id": "sort_required",
        "text": "Sorting is the only valid solution.",
        "isCorrect": false
      },
      {
        "id": "presence_only",
        "text": "A set of seen values is enough to find the most frequent value.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];

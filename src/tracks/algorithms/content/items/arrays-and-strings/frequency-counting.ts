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
    "id": "alg-array-string-frequency-signal-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Two strings should match only if each character appears the same number of times in both strings. Which state is necessary?",
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
    "staticMicroChecks": [
      {
        "correctAnswer": "character_counts",
        "feedback": "Multiplicity requires counts, not just membership or a few positional samples.",
        "id": "alg-array-string-frequency-signal-001-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "character_counts",
            "text": "A count for each character."
          },
          {
            "id": "seen_characters",
            "text": "A set of characters seen in each string."
          },
          {
            "id": "first_last_characters",
            "text": "Only the first and last character of each string."
          },
          {
            "id": "adjacent_pairs",
            "text": "A list of adjacent character pairs."
          }
        ],
        "prompt": "Choose the state that matches the requirement.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_frequency_state"
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
    "type": "strategy_choice"
  },
  {
    "complexityExplanation": "Frequency counting scans both strings once, so time is linear in the combined input length. Extra space is proportional to the number of distinct characters unless the alphabet is fixed and bounded.",
    "complexityVariables": {
      "k": "number of distinct characters stored in the count table",
      "m": "length of the second string",
      "n": "length of the first string"
    },
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(k)",
    "expectedTimeComplexity": "O(n + m)",
    "feedbackModel": {
      "decisionSignal": "The time is linear in the combined input size, but the space claim depends on whether the alphabet is bounded.",
      "mentalModelCorrection": "Use O(k) for distinct-character state unless the prompt gives you a fixed small alphabet.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "When you see a count table, ask what limits the number of buckets before calling it constant space.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_frequency_counting_complexity",
    "prompt": "You compare two strings by counting each character in both strings. The character set is not guaranteed to be fixed or small. What time and extra space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(k)",
          "time": "O(n + m)"
        },
        "feedback": "The scan is linear in total input length, O(n + m), and the count table uses O(k) extra space for distinct characters rather than O(1).",
        "id": "alg-prod-array-string-003-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "reason_about_frequency_counting_complexity"
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
        "nodeId": "reason_about_frequency_counting_complexity",
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
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Reason about frequency-counting space",
    "trackId": "algorithms",
    "type": "complexity_check"
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
    "id": "alg-prod-array-string-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "You need an approach that accepts `aab` and `aba` as same-frequency strings, but rejects `ab` and `aab`. Which comparison is strong enough?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "frequency_counts",
        "feedback": "Frequency counts preserve both presence and multiplicity, which is exactly what the prompt asks for.",
        "id": "alg-prod-array-string-008-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "frequency_counts",
            "text": "Compare frequency counts for each character."
          },
          {
            "id": "set_presence",
            "text": "Compare the set of characters present in each string."
          },
          {
            "id": "first_last",
            "text": "Compare only the first and last characters."
          },
          {
            "id": "adjacent_duplicates",
            "text": "Check whether each string has adjacent duplicates."
          }
        ],
        "prompt": "Choose the stronger comparison.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_presence_from_count"
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
    "type": "solution_comparison"
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
    "id": "alg-prod-array-string-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Two strings should match if they contain the same characters with the same frequencies. Which comparison is more direct for large inputs when you do not need sorted output?",
    "reasonSignal": "Counting directly stores multiplicity without paying the sorting cost.",
    "rejectedApproachIds": [
      "set_compare",
      "first_mismatch"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "compare_complexity_tradeoffs"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "frequency_counting",
        "feedback": "Counting directly stores the multiplicity the prompt asks for. Sorting can also compare frequencies, but it is less direct for large inputs when sorted output is unnecessary.",
        "id": "alg-prod-array-string-014-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "frequency_counting",
            "text": "Count characters and compare counts."
          },
          {
            "id": "sort_both",
            "text": "Sort both strings and compare the sorted strings."
          },
          {
            "id": "set_compare",
            "text": "Compare only the set of characters in each string."
          },
          {
            "id": "first_mismatch",
            "text": "Return false at the first position where the strings differ."
          }
        ],
        "prompt": "Choose the more direct comparison under the stated constraint.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_presence_from_count"
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
    "type": "solution_comparison"
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
    "id": "alg-prod-array-string-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_data_structure_mismatch",
    "prompt": "A learner checks whether two strings have the same frequencies by converting both strings to sets. Which test case exposes the bug?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "ab_aab",
        "feedback": "The set of characters matches, but the multiplicities do not, so the bug becomes visible immediately.",
        "id": "alg-prod-array-string-016-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "ab_aab",
            "text": "`ab` and `aab`"
          },
          {
            "id": "ab_ba",
            "text": "`ab` and `ba`"
          },
          {
            "id": "abc_abc",
            "text": "`abc` and `abc`"
          },
          {
            "id": "empty_empty",
            "text": "`\"\"` and `\"\"`"
          }
        ],
        "prompt": "Choose the test case that reveals the bug.",
        "status": "active",
        "testedSkillAtomIds": [
          "diagnose_data_structure_mismatch"
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
    "type": "test_case_selection"
  },
  {
    "complexityExplanation": "With a fixed bounded alphabet such as lowercase English letters, the count table size is capped, so the extra space can be treated as constant.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)",
    "feedbackModel": {
      "decisionSignal": "The alphabet bound is what changes the space claim, not the counting idea itself.",
      "mentalModelCorrection": "Call the space O(1) only when the prompt truly fixes the number of possible buckets.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Check whether the value domain is fixed before compressing O(k) into O(1).",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-018",
    "learningStage": "foundations",
    "primarySkillAtomId": "fixed_alphabet_complexity",
    "prompt": "You count letter frequencies in a string made only of lowercase English letters. What time and extra space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_frequency_counting_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(1)",
          "time": "O(n)"
        },
        "feedback": "The scan is still linear, and the number of counters is capped by the fixed alphabet.",
        "id": "alg-prod-array-string-018-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "fixed_alphabet_complexity"
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
        "nodeId": "fixed_alphabet_complexity",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_frequency_counting_complexity",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
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
    "title": "Use the fixed-alphabet space caveat correctly",
    "trackId": "algorithms",
    "type": "complexity_check"
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
    "id": "alg-prod-array-string-060",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Two arrays should match only if every value appears the same number of times in both arrays. Which state best matches the requirement?",
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
    "staticMicroChecks": [
      {
        "correctAnswer": "value_counts",
        "feedback": "A count per value preserves both presence and multiplicity.",
        "id": "alg-prod-array-string-060-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "value_counts",
            "text": "A count for each value."
          },
          {
            "id": "presence_set",
            "text": "A set of values that appear at least once."
          },
          {
            "id": "sort_by_first_value",
            "text": "Only the first value of each array."
          },
          {
            "id": "adjacent_scan",
            "text": "Only whether equal values are adjacent."
          }
        ],
        "prompt": "Choose the state that preserves the required information.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_frequency_state"
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
    "type": "strategy_choice"
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
    "id": "alg-prod-array-string-061",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Why does comparing sets give the wrong answer for `ab` and `aab` when the task asks for same character frequencies?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "same_set_lost_count",
        "feedback": "Both strings have the same set of characters, but `aab` has one extra `a`, so counts are different.",
        "id": "alg-prod-array-string-061-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "same_set_lost_count",
            "text": "The set is the same, but the character counts are different."
          },
          {
            "id": "same_length",
            "text": "The strings have the same length."
          },
          {
            "id": "same_order",
            "text": "The strings have the same order."
          },
          {
            "id": "adjacent_difference",
            "text": "The strings differ only by adjacent duplicates."
          }
        ],
        "prompt": "Choose the reason set comparison fails.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_presence_from_count"
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
    "type": "solution_comparison"
  },
  {
    "complexityExplanation": "Counting each input once gives linear time in the combined input size. Extra space depends on the number of distinct values stored.",
    "complexityVariables": {
      "k": "number of distinct values stored in the frequency table",
      "m": "length of the second input",
      "n": "length of the first input"
    },
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(k)",
    "expectedTimeComplexity": "O(n + m)",
    "feedbackModel": {
      "decisionSignal": "Two scans plus a count table give O(n + m) time and O(k) extra space.",
      "mentalModelCorrection": "Do not call frequency-table space constant unless the value domain is fixed and small.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Name the input lengths and the number of distinct stored keys before writing the complexity.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-062",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_frequency_counting_complexity",
    "prompt": "You compare two arrays by counting values from both arrays. The value range is not fixed. What time and extra space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n + m)",
          "space": "O(k)"
        },
        "feedback": "The algorithm scans both arrays once, and the table can store up to `k` distinct values.",
        "id": "alg-prod-array-string-062-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "reason_about_frequency_counting_complexity"
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
        "nodeId": "reason_about_frequency_counting_complexity",
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
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Estimate unbounded frequency-table cost",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "complexityExplanation": "A fixed lowercase English alphabet caps the number of counters at 26, so frequency-table space is constant.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n + m)",
    "feedbackModel": {
      "decisionSignal": "The fixed alphabet bound turns the count table into constant-size state.",
      "mentalModelCorrection": "The same counting idea can be O(k) or O(1) space depending on the value domain.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Before giving space complexity, check whether the prompt fixes the alphabet.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-063",
    "learningStage": "foundations",
    "primarySkillAtomId": "fixed_alphabet_complexity",
    "prompt": "You compare two strings made only of lowercase English letters by counting characters. What time and extra space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_frequency_counting_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n + m)",
          "space": "O(1)"
        },
        "feedback": "The scans are linear in total input length, and the count table has a fixed maximum size of 26.",
        "id": "alg-prod-array-string-063-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and bounded-alphabet space.",
        "status": "active",
        "testedSkillAtomIds": [
          "fixed_alphabet_complexity"
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
        "nodeId": "fixed_alphabet_complexity",
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
    "title": "Apply the fixed-alphabet space exception",
    "trackId": "algorithms",
    "type": "complexity_check"
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
    "id": "alg-prod-array-string-064",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "An approach should accept `aab` and `aba`, but reject `ab` and `aab`. What relation is being tested?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "same_frequency",
        "feedback": "The relation is same frequency: order can differ, but duplicate counts must match.",
        "id": "alg-prod-array-string-064-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "same_frequency",
            "text": "Same frequency of each character."
          },
          {
            "id": "presence_only",
            "text": "Same set of unique characters."
          },
          {
            "id": "same_order",
            "text": "Exactly the same character sequence."
          },
          {
            "id": "adjacent_only",
            "text": "Same adjacent duplicate positions."
          }
        ],
        "prompt": "Choose the relation these examples define.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_presence_from_count"
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
    "type": "approach_naming"
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
    "id": "alg-prod-array-string-065",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_complexity_tradeoffs",
    "prompt": "A learner says sorting both strings is always the best way to compare character frequencies because it avoids a hash table. What tradeoff are they missing for large inputs when sorted output is not needed?",
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
    "staticMicroChecks": [
      {
        "correctAnswer": "sorting_pays_ordering_cost",
        "feedback": "Sorting can compare frequencies after ordering, but it pays O(n log n) cost for sorted order that the prompt does not need.",
        "id": "alg-prod-array-string-065-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "sorting_pays_ordering_cost",
            "text": "Sorting can be correct, but it pays ordering cost that counting avoids."
          },
          {
            "id": "sorting_always_invalid",
            "text": "Sorting is always logically invalid for same-frequency comparison."
          },
          {
            "id": "set_is_enough",
            "text": "A set is enough because duplicate counts do not matter."
          },
          {
            "id": "same_index_required",
            "text": "The strings must have the same character at every index."
          }
        ],
        "prompt": "Choose the missing tradeoff.",
        "status": "active",
        "testedSkillAtomIds": [
          "compare_complexity_tradeoffs"
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
    "type": "solution_comparison"
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
    "id": "alg-prod-array-string-066",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_data_structure_mismatch",
    "prompt": "A learner uses sets to test whether two arrays have the same value frequencies. Which test case best exposes the bug?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "same_values_different_counts",
        "feedback": "Both arrays contain the same unique values, 2 and 4, but the multiplicities differ: one has two 4s, the other has two 2s.",
        "id": "alg-prod-array-string-066-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "same_values_different_counts",
            "text": "`[4, 4, 2]` and `[4, 2, 2]`"
          },
          {
            "id": "same_counts_different_order",
            "text": "`[4, 2]` and `[2, 4]`"
          },
          {
            "id": "different_presence",
            "text": "`[4, 2]` and `[4, 3]`"
          },
          {
            "id": "empty_empty",
            "text": "`[]` and `[]`"
          }
        ],
        "prompt": "Choose the counterexample.",
        "status": "active",
        "testedSkillAtomIds": [
          "diagnose_data_structure_mismatch"
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
    "type": "test_case_selection"
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
    "id": "alg-prod-array-string-067",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Two strings should be treated as matching even if their characters appear in different order, but duplicate counts must match. What should the comparison use?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "frequency_comparison",
        "feedback": "Different order is allowed, but duplicate counts must match, so frequency comparison fits.",
        "id": "alg-prod-array-string-067-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "frequency_comparison",
            "text": "Compare character frequencies."
          },
          {
            "id": "same_index",
            "text": "Compare characters at the same indexes."
          },
          {
            "id": "unique_only",
            "text": "Compare only unique characters."
          },
          {
            "id": "neighbor_only",
            "text": "Check only adjacent equal characters."
          }
        ],
        "prompt": "Choose the comparison that fits the contract.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_frequency_state"
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
    "id": "alg-prod-array-string-068",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "You scan `abca` and update a frequency table. What should the count for `a` be after the full scan?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "a_count_two",
        "feedback": "`a` appears at the first and last positions, so its count is 2.",
        "id": "alg-prod-array-string-068-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "a_count_two",
            "text": "`a` has count 2."
          },
          {
            "id": "a_count_one",
            "text": "`a` has count 1 because it is stored once as a key."
          },
          {
            "id": "sort_required",
            "text": "The count cannot be known without sorting."
          },
          {
            "id": "adjacent_required",
            "text": "The count increases only if `a` is adjacent to another `a`."
          }
        ],
        "prompt": "Choose the traced frequency state.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_frequency_state"
        ],
        "type": "trace_next_step"
      }
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
    "type": "trace_next_step"
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
    "id": "alg-prod-array-string-069",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "Two strings must have exactly the same character frequencies. What can you conclude immediately if their lengths are different?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_frequency_counting_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "cannot_match",
        "feedback": "If total lengths differ, at least one total count differs, so the strings cannot have identical frequencies.",
        "id": "alg-prod-array-string-069-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "cannot_match",
            "text": "They cannot have identical character frequencies."
          },
          {
            "id": "must_count_all",
            "text": "You must still count every character before deciding."
          },
          {
            "id": "sets_enough",
            "text": "Equal sets would still prove they match."
          },
          {
            "id": "sort_needed",
            "text": "They must be sorted before any conclusion is possible."
          }
        ],
        "prompt": "Choose the valid early conclusion.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_frequency_state"
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
    "type": "edge_case_drill"
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
    "id": "alg-prod-array-string-070",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "While building a frequency table, you encounter a value that is not yet in the table. What count should it be treated as before incrementing?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "zero_before_increment",
        "feedback": "An unseen value has count 0 before its first increment.",
        "id": "alg-prod-array-string-070-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "zero_before_increment",
            "text": "0, then increment to 1."
          },
          {
            "id": "error_immediately",
            "text": "Throw an error because the key is missing."
          },
          {
            "id": "presence_true",
            "text": "Treat it as already present with count 1 before incrementing."
          },
          {
            "id": "sort_first",
            "text": "Sort the input before assigning any count."
          }
        ],
        "prompt": "Choose the default count behavior.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_frequency_state"
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
    "type": "state_selection"
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
    "id": "alg-prod-array-string-071",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "You count characters from the first string, then subtract while scanning the second string. What does it mean if a count becomes negative?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "second_uses_too_many",
        "feedback": "A negative count means the second string contains that character more times than the first string did.",
        "id": "alg-prod-array-string-071-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "second_uses_too_many",
            "text": "The second string uses that character too many times."
          },
          {
            "id": "still_possible",
            "text": "The strings may still have identical frequencies."
          },
          {
            "id": "order_problem",
            "text": "Only the character order is wrong."
          },
          {
            "id": "adjacency_problem",
            "text": "Only adjacent duplicate handling is wrong."
          }
        ],
        "prompt": "Choose what the negative count signals.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_frequency_state"
        ],
        "type": "trace_next_step"
      }
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
    "type": "trace_next_step"
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
    "id": "alg-prod-array-string-072",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "After counting the first string and subtracting the second string, every count is zero. What does that prove?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "same_frequencies",
        "feedback": "Every count returning to zero proves the two strings have the same frequency for every stored character.",
        "id": "alg-prod-array-string-072-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "same_frequencies",
            "text": "The strings have the same character frequencies."
          },
          {
            "id": "same_order",
            "text": "The strings have the same character order."
          },
          {
            "id": "same_set_only",
            "text": "Only the unique character sets match."
          },
          {
            "id": "adjacent_match",
            "text": "Adjacent duplicates match at the same positions."
          }
        ],
        "prompt": "Choose what balanced counts prove.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_presence_from_count"
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
    "type": "state_selection"
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
    "id": "alg-prod-array-string-074",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "A task asks which values appear exactly three times. Why is a set of seen values not enough?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "needs_exact_counts",
        "feedback": "A set only stores presence. The task needs the exact count for each value.",
        "id": "alg-prod-array-string-074-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "needs_exact_counts",
            "text": "The task needs exact counts for each value."
          },
          {
            "id": "seen_set",
            "text": "A seen set stores exact counts automatically."
          },
          {
            "id": "adjacent_scan",
            "text": "Only adjacent values can appear exactly three times."
          },
          {
            "id": "length_only",
            "text": "The array length alone gives each value's count."
          }
        ],
        "prompt": "Choose why counts are required.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_presence_from_count"
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
    "type": "solution_comparison"
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
    "id": "alg-prod-array-string-077",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_frequency_state",
    "prompt": "A task asks for the value that appears most often in an array. Which state is necessary?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_presence_from_count"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "count_table",
        "feedback": "To know which value appears most often, you need counts for values, not just whether they appeared.",
        "id": "alg-prod-array-string-077-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "count_table",
            "text": "A count table by value."
          },
          {
            "id": "presence_set",
            "text": "A set of values seen."
          },
          {
            "id": "first_value",
            "text": "Only the first value."
          },
          {
            "id": "adjacent_count",
            "text": "Only adjacent repeated runs."
          }
        ],
        "prompt": "Choose the state needed for most-frequent reasoning.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_frequency_state"
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
    "type": "state_selection"
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
    "id": "alg-prod-array-string-078",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_data_structure_mismatch",
    "prompt": "A learner counts only adjacent runs to find the most frequent value. Which input exposes the flaw?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "separated_repeats",
        "feedback": "`[1, 2, 1, 2, 1]` has separated repeats of `1`, so adjacent-run counting undercounts the true frequency.",
        "id": "alg-prod-array-string-078-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "separated_repeats",
            "text": "`[1, 2, 1, 2, 1]`"
          },
          {
            "id": "single_run",
            "text": "`[1, 1, 1, 2]`"
          },
          {
            "id": "all_unique",
            "text": "`[1, 2, 3, 4]`"
          },
          {
            "id": "empty_array",
            "text": "`[]`"
          }
        ],
        "prompt": "Choose the test case that exposes separated multiplicity.",
        "status": "active",
        "testedSkillAtomIds": [
          "diagnose_data_structure_mismatch"
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
    "type": "test_case_selection"
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
    "id": "alg-prod-array-string-079",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "A learner compares two same-frequency strings index by index and returns false at the first mismatch. What is the mistake?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "order_too_strict",
        "feedback": "Same-frequency strings can have different order, so index-by-index equality is too strict.",
        "id": "alg-prod-array-string-079-check",
        "mistakeTypes": [
          "wrong_approach",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "order_too_strict",
            "text": "The approach incorrectly requires the same order."
          },
          {
            "id": "set_compare",
            "text": "The approach compares only unique characters."
          },
          {
            "id": "adjacent_compare",
            "text": "The approach checks only adjacent duplicates."
          },
          {
            "id": "needs_normalization",
            "text": "The approach only needs case normalization."
          }
        ],
        "prompt": "Choose the flaw.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_presence_from_count"
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
    "type": "common_mistake_diagnosis"
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
    "id": "alg-prod-array-string-080",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_complexity_tradeoffs",
    "prompt": "To find the most frequent value, a learner recounts the entire array for every distinct value. What is the better reasoning?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_frequency_counting_complexity",
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "incremental_counting",
        "feedback": "Incremental frequency counting avoids repeated full scans and keeps the needed aggregate state.",
        "id": "alg-prod-array-string-080-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "incremental_counting",
            "text": "Scan once, update counts, and track the best count."
          },
          {
            "id": "nested_recount",
            "text": "Recount the full array for each distinct value."
          },
          {
            "id": "sort_required",
            "text": "Sorting is the only valid solution."
          },
          {
            "id": "presence_only",
            "text": "A set of seen values is enough to find the most frequent value."
          }
        ],
        "prompt": "Choose the better reasoning.",
        "status": "active",
        "testedSkillAtomIds": [
          "compare_complexity_tradeoffs"
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
    "type": "solution_comparison"
  },
  {
    "complexityExplanation": "A nested recount for each distinct value can scan the array many times. In the worst case, that becomes quadratic work.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n^2)",
    "feedbackModel": {
      "decisionSignal": "The mistaken approach repeats a full scan for many values, so the cost can grow quadratically.",
      "mentalModelCorrection": "Measure what the code actually does, not what the intended frequency-counting solution would do.",
      "mistakeTypes": [
        "complexity_mismatch",
        "wrong_approach"
      ],
      "nextAction": "Contrast repeated recounting with one-pass count-table construction.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-081",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_frequency_counting_complexity",
    "prompt": "A mistaken solution counts how often each value appears by scanning the whole array once per value. In the worst case, what time and auxiliary space does that mistaken approach use?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n^2)",
          "space": "O(1)"
        },
        "feedback": "Repeated full scans can create O(n^2) time. If it only keeps counters while rescanning, auxiliary space can remain O(1).",
        "id": "alg-prod-array-string-081-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "wrong_approach"
        ],
        "prompt": "Choose the cost of the mistaken recounting approach.",
        "status": "active",
        "testedSkillAtomIds": [
          "reason_about_frequency_counting_complexity"
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
        "nodeId": "reason_about_frequency_counting_complexity",
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
        "nodeId": "frequency_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Measure mistaken nested frequency recounting",
    "trackId": "algorithms",
    "type": "complexity_reasoning"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "If the value domain is fixed to digits 0 through 9, the count table has only 10 buckets.",
      "distractorExplanations": {
        "o_k_unbounded": "That would be appropriate when the number of possible values is not fixed.",
        "o_n_space": "The table does not grow with input length when there are only 10 possible keys.",
        "sort_needed": "Sorting is not required to count fixed-domain values."
      },
      "mentalModelCorrection": "A fixed small domain caps frequency state.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Use the domain bound, not the input length, to size the count table.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-082",
    "learningStage": "foundations",
    "primarySkillAtomId": "fixed_alphabet_complexity",
    "prompt": "An array contains only digits from 0 to 9. You count digit frequencies. What time and extra space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_frequency_counting_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(1)"
        },
        "feedback": "The scan is O(n), and the count table has at most 10 buckets, so extra space is O(1).",
        "id": "alg-prod-array-string-082-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the time and fixed-domain space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "fixed_alphabet_complexity"
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
        "nodeId": "fixed_alphabet_complexity",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
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
    "title": "Use constant space for fixed digit counts",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Counting scans the input once. A fixed digit domain caps the count table at 10 buckets, so the extra space is constant.",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)"
  }
];

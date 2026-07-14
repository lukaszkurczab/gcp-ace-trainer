import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const partitioningAndSegmentationQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-partition-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_partitioning_segmentation",
    "secondarySkillAtomIds": [
      "backtracking_segment_boundary_choice",
      "string_segmentation"
    ],
    "type": "single_choice",
    "prompt": "A function partitions a string into valid pieces. At index start, what kind of choice should the current recursion frame make?",
    "feedbackModel": {
      "decisionSignal": "String partitioning consumes the input in order by choosing the next contiguous segment boundary.",
      "distractorExplanations": {
        "choose_any_unused_chars": "That models subsequence or subset-style selection, not ordered segmentation.",
        "permute_remaining": "Partitioning preserves original order; it does not rearrange characters.",
        "sort_remaining": "Sorting destroys the original order and segment boundaries."
      },
      "mentalModelCorrection": "In segmentation, the next choice is a cut boundary, not an arbitrary character selection.",
      "mistakeTypes": [
        "choice_enumeration_misread",
        "string_partition_misread"
      ],
      "nextAction": "At each frame, identify the first unconsumed index and enumerate possible segment ends from there.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_partitioning_segmentation",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "choice_enumeration_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "string_partition_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "String partitioning consumes the input in order by choosing the next contiguous segment boundary.",
    "options": [
      {
        "id": "choose_next_segment",
        "text": "Choose the next contiguous segment starting at start.",
        "isCorrect": true
      },
      {
        "id": "choose_any_unused_chars",
        "text": "Choose any unused characters from anywhere in the string.",
        "isCorrect": false
      },
      {
        "id": "permute_remaining",
        "text": "Permute all remaining characters before choosing a segment.",
        "isCorrect": false
      },
      {
        "id": "sort_remaining",
        "text": "Sort the remaining characters and take the first group.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_partitioning_segmentation",
    "secondarySkillAtomIds": [
      "subsequence_vs_substring",
      "string_segmentation"
    ],
    "type": "single_choice",
    "prompt": "A prompt asks for all ways to split a string into valid dictionary words. Which interpretation matches segmentation backtracking?",
    "feedbackModel": {
      "decisionSignal": "Segmentation preserves order and partitions the entire input into contiguous pieces.",
      "distractorExplanations": {
        "unordered_set": "A set loses order, positions, and segment boundaries.",
        "all_permutations": "Permuting characters changes the string being segmented.",
        "longest_window": "A sliding window finds one range; segmentation builds a sequence of cuts covering the input."
      },
      "mentalModelCorrection": "Partitioning is ordered coverage of the input, not arbitrary selection or one-window optimization.",
      "mistakeTypes": [
        "string_partition_misread",
        "wrong_pattern_selected"
      ],
      "nextAction": "Check whether the problem asks to cover the whole string with consecutive pieces.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_partitioning_segmentation",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "string_partition_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_pattern_selected",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "Segmentation preserves order and partitions the entire input into contiguous pieces.",
    "options": [
      {
        "id": "ordered_cover",
        "text": "Build an ordered list of contiguous words that covers the string from left to right.",
        "isCorrect": true
      },
      {
        "id": "unordered_set",
        "text": "Pick an unordered set of characters that appear in dictionary words.",
        "isCorrect": false
      },
      {
        "id": "all_permutations",
        "text": "Generate every permutation of the characters and check dictionary membership.",
        "isCorrect": false
      },
      {
        "id": "longest_window",
        "text": "Maintain one longest sliding window and return it.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-partition-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_next_unconsumed_index",
    "secondarySkillAtomIds": [
      "string_segmentation",
      "backtracking_recursion_state"
    ],
    "type": "single_choice",
    "prompt": "In string partitioning, dfs(index, segments) is called after several pieces have been chosen. What does index usually represent?",
    "feedbackModel": {
      "decisionSignal": "The recursion needs to know where the next segment begins; that is the first unconsumed character.",
      "distractorExplanations": {
        "last_chosen_char": "The next segment starts after the previous segment, not at the last consumed character.",
        "number_of_results": "Result count does not describe input progress.",
        "sorted_position": "Sorting is unrelated to ordered segmentation progress."
      },
      "mentalModelCorrection": "Segmentation state is anchored at the boundary between consumed and unconsumed input.",
      "mistakeTypes": [
        "state_model_misread",
        "full_input_consumption_missed"
      ],
      "nextAction": "Track the next unconsumed index, not an arbitrary previous position.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_next_unconsumed_index",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "full_input_consumption_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "The recursion needs to know where the next segment begins; that is the first unconsumed character.",
    "options": [
      {
        "id": "first_unconsumed",
        "text": "The first character not yet covered by the chosen segments.",
        "isCorrect": true
      },
      {
        "id": "last_chosen_char",
        "text": "The last character included in any previous segment.",
        "isCorrect": false
      },
      {
        "id": "number_of_results",
        "text": "The number of complete partitions saved so far.",
        "isCorrect": false
      },
      {
        "id": "sorted_position",
        "text": "The position of this character in the sorted string.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_next_unconsumed_index",
    "secondarySkillAtomIds": [
      "backtracking_segment_boundary_choice",
      "string_segmentation"
    ],
    "type": "single_choice",
    "prompt": "A partitioning frame chooses segment = s.slice(index, end), consuming characters index through end - 1. What should the next recursive index usually be?",
    "feedbackModel": {
      "decisionSignal": "Once s[index:end] is chosen, the next segment must begin at the first character after that segment.",
      "distractorExplanations": {
        "index_plus_one_always": "That only works for one-character segments and breaks longer segment choices.",
        "zero": "Restarting from zero reuses already consumed characters.",
        "end_minus_one": "Starting at end - 1 overlaps segments by reusing the last character."
      },
      "mentalModelCorrection": "The segment end becomes the next start boundary.",
      "mistakeTypes": [
        "state_progress_error",
        "string_partition_misread"
      ],
      "nextAction": "After choosing a segment, advance by the full segment length.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_next_unconsumed_index",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_progress_error",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "string_partition_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "Once s[index:end] is chosen, the next segment must begin at the first character after that segment.",
    "options": [
      {
        "id": "end",
        "text": "end, because characters before end are now consumed.",
        "isCorrect": true
      },
      {
        "id": "index_plus_one_always",
        "text": "index + 1, regardless of the chosen segment length.",
        "isCorrect": false
      },
      {
        "id": "zero",
        "text": "0, so the next segment can start from the beginning again.",
        "isCorrect": false
      },
      {
        "id": "end_minus_one",
        "text": "end - 1, so the last character is reused.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-partition-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_segment_boundary_choice",
    "secondarySkillAtomIds": [
      "string_segmentation",
      "backtracking_enumerate_choices"
    ],
    "type": "single_choice",
    "prompt": "A palindrome partitioning search is at index start. What should the loop enumerate before validating palindromes?",
    "feedbackModel": {
      "decisionSignal": "The branch chooses the next contiguous substring by selecting where it ends.",
      "distractorExplanations": {
        "unused_characters": "Partitioning does not skip around the string; it consumes a contiguous next piece.",
        "all_sorted_prefixes": "Sorting changes substring content and order.",
        "left_right_swaps": "Swapping mutates the string; partitioning chooses cuts."
      },
      "mentalModelCorrection": "For partitioning, alternatives are cut positions from the current start index.",
      "mistakeTypes": [
        "choice_enumeration_misread",
        "string_partition_misread"
      ],
      "nextAction": "Model each branch as choosing one next substring boundary.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_segment_boundary_choice",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "choice_enumeration_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "string_partition_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "The branch chooses the next contiguous substring by selecting where it ends.",
    "options": [
      {
        "id": "end_boundaries",
        "text": "Possible end positions for the next substring starting at start.",
        "isCorrect": true
      },
      {
        "id": "unused_characters",
        "text": "Any unused characters from anywhere in the string.",
        "isCorrect": false
      },
      {
        "id": "all_sorted_prefixes",
        "text": "Sorted versions of every prefix.",
        "isCorrect": false
      },
      {
        "id": "left_right_swaps",
        "text": "Pairs of characters to swap from both ends.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_segment_boundary_choice",
    "secondarySkillAtomIds": [
      "backtracking_segment_validation",
      "exact_segment_count_contract"
    ],
    "type": "single_choice",
    "prompt": "A restore-IP style search is choosing the next segment from the current index. Each segment may contain 1 to 3 characters. What should this frame enumerate?",
    "feedbackModel": {
      "decisionSignal": "The segment-size rule limits the legal next segment lengths to 1, 2, or 3.",
      "distractorExplanations": {
        "all_lengths": "Lengths greater than 3 violate the segment contract.",
        "only_three": "Segments of length 1 and 2 are also legal candidates.",
        "all_digit_permutations": "IP restoration preserves digit order and chooses segment lengths, not permutations."
      },
      "mentalModelCorrection": "Segment-choice enumeration should reflect the allowed segment shape.",
      "mistakeTypes": [
        "choice_range_misread",
        "constraint_ignored"
      ],
      "nextAction": "Translate segment constraints into the exact candidate lengths or end boundaries.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_segment_boundary_choice",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "choice_range_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "The segment-size rule limits the legal next segment lengths to 1, 2, or 3.",
    "options": [
      {
        "id": "lengths_one_to_three",
        "text": "Candidate segment lengths 1, 2, and 3, subject to staying inside the string.",
        "isCorrect": true
      },
      {
        "id": "all_lengths",
        "text": "Every length from 1 to the end of the string.",
        "isCorrect": false
      },
      {
        "id": "only_three",
        "text": "Only length 3, because IP segments can have at most three characters.",
        "isCorrect": false
      },
      {
        "id": "all_digit_permutations",
        "text": "All permutations of the remaining digits.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_segment_validation",
    "secondarySkillAtomIds": [
      "palindrome_partitioning",
      "string_segmentation"
    ],
    "type": "single_choice",
    "prompt": "A palindrome partitioning branch considers segment = s[start:end]. The segment is not a palindrome. What should happen?",
    "feedbackModel": {
      "decisionSignal": "A segment’s palindrome validity is local to that segment; later segments cannot repair it.",
      "distractorExplanations": {
        "recurse_anyway": "Later cuts do not change the content of the already chosen segment.",
        "sort_segment": "Sorting changes the original substring and violates partitioning order.",
        "save_path": "A non-palindrome segment does not satisfy the partition contract."
      },
      "mentalModelCorrection": "Validate a candidate segment before committing it to the path.",
      "mistakeTypes": [
        "segment_validation_missed",
        "constraint_ignored"
      ],
      "nextAction": "For each candidate cut, check whether that specific segment is valid before recursion.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_segment_validation",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "segment_validation_missed",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "A segment’s palindrome validity is local to that segment; later segments cannot repair it.",
    "options": [
      {
        "id": "skip_segment",
        "text": "Skip this candidate segment and try another end boundary.",
        "isCorrect": true
      },
      {
        "id": "recurse_anyway",
        "text": "Recurse anyway because later segments may make this segment a palindrome.",
        "isCorrect": false
      },
      {
        "id": "sort_segment",
        "text": "Sort the segment so it may become a palindrome.",
        "isCorrect": false
      },
      {
        "id": "save_path",
        "text": "Save the current path because a non-palindrome ends the branch.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_segment_validation",
    "secondarySkillAtomIds": [
      "word_break_segmentation",
      "string_segmentation"
    ],
    "type": "single_choice",
    "prompt": "A word-break enumeration search chooses segment = s[index:end]. The segment is not in the dictionary. What should happen?",
    "feedbackModel": {
      "decisionSignal": "If the next segment itself is not a valid token, no later segmentation can make that token valid.",
      "distractorExplanations": {
        "add_anyway": "The full segmentation requires every segment to be valid, not just the suffix.",
        "permute_letters": "Word break preserves the original substring order.",
        "clear_dictionary": "Changing the dictionary changes the problem constraints."
      },
      "mentalModelCorrection": "In segmentation, local segment validity is checked before moving the start index forward.",
      "mistakeTypes": [
        "segment_validation_missed",
        "constraint_ignored"
      ],
      "nextAction": "Treat dictionary membership as a candidate-segment filter.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_segment_validation",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "segment_validation_missed",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "If the next segment itself is not a valid token, no later segmentation can make that token valid.",
    "options": [
      {
        "id": "skip_non_word",
        "text": "Do not recurse with this segment; try a different end boundary.",
        "isCorrect": true
      },
      {
        "id": "add_anyway",
        "text": "Add it to segments because a later word may make the full sentence valid.",
        "isCorrect": false
      },
      {
        "id": "permute_letters",
        "text": "Permute the segment’s letters until it becomes a dictionary word.",
        "isCorrect": false
      },
      {
        "id": "clear_dictionary",
        "text": "Clear the dictionary and accept the segment.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-partition-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_full_string_consumption",
    "secondarySkillAtomIds": [
      "string_segmentation",
      "backtracking_result_collection"
    ],
    "type": "single_choice",
    "prompt": "A partitioning search has built several valid segments, but index is not yet s.length. Why should it not save the result yet?",
    "feedbackModel": {
      "decisionSignal": "A complete partition must cover the whole input, not only produce some valid prefix segments.",
      "distractorExplanations": {
        "segments_valid": "Valid segment lists can be saved when they cover the full string and meet all constraints.",
        "must_sort_segments": "Sorting segments would destroy their input order.",
        "needs_duplicate_set": "Deduping is separate from the full-consumption requirement."
      },
      "mentalModelCorrection": "A valid prefix partition is not a complete partition until the input is fully consumed.",
      "mistakeTypes": [
        "partial_solution_saved",
        "full_input_consumption_missed"
      ],
      "nextAction": "Before saving a segmentation result, check whether index has reached the end of the string.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_full_string_consumption",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "partial_solution_saved",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "full_input_consumption_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "A complete partition must cover the whole input, not only produce some valid prefix segments.",
    "options": [
      {
        "id": "input_not_fully_consumed",
        "text": "Because some characters of the original string are still uncovered.",
        "isCorrect": true
      },
      {
        "id": "segments_valid",
        "text": "Because valid segments are never saved in partitioning problems.",
        "isCorrect": false
      },
      {
        "id": "must_sort_segments",
        "text": "Because segments must be sorted before they can be saved.",
        "isCorrect": false
      },
      {
        "id": "needs_duplicate_set",
        "text": "Because every partition must first be deduped with a Set.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_exact_segment_count",
    "secondarySkillAtomIds": [
      "restore_ip_segmentation",
      "backtracking_full_string_consumption"
    ],
    "type": "single_choice",
    "prompt": "A restore-IP search needs exactly 4 valid segments and must consume the whole string. Which condition describes a complete result?",
    "feedbackModel": {
      "decisionSignal": "IP restoration has both an exact segment-count contract and a full-input-consumption contract.",
      "distractorExplanations": {
        "four_only": "Four segments are not enough if some characters remain uncovered.",
        "consumed_only": "Full consumption is not enough if the number of segments is wrong.",
        "first_valid": "A valid first segment is only a prefix decision."
      },
      "mentalModelCorrection": "Segmented outputs often require multiple completion conditions at the same time.",
      "mistakeTypes": [
        "output_contract_misread",
        "full_input_consumption_missed"
      ],
      "nextAction": "List every condition that must be true before a segmented result is complete.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_exact_segment_count",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "full_input_consumption_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "IP restoration has both an exact segment-count contract and a full-input-consumption contract.",
    "options": [
      {
        "id": "four_and_consumed",
        "text": "segments.length === 4 and index === s.length.",
        "isCorrect": true
      },
      {
        "id": "four_only",
        "text": "segments.length === 4, even if characters remain unused.",
        "isCorrect": false
      },
      {
        "id": "consumed_only",
        "text": "index === s.length, regardless of segment count.",
        "isCorrect": false
      },
      {
        "id": "first_valid",
        "text": "The first segment is valid.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_exact_segment_count",
    "secondarySkillAtomIds": [
      "restore_ip_segmentation",
      "partial_solution_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A restore-IP branch has built 4 valid segments, but index < s.length. What is wrong with saving this branch?",
    "feedbackModel": {
      "decisionSignal": "Exact segment count does not override the requirement that all input characters must be consumed.",
      "distractorExplanations": {
        "too_few_segments": "The branch has exactly 4 segments; the issue is uncovered input.",
        "invalid_first_segment": "Remaining characters do not imply the first segment is invalid.",
        "needs_permutation": "Partitioning does not rearrange unused characters into earlier segments."
      },
      "mentalModelCorrection": "A segmentation can have the right number of parts and still be incomplete if it does not cover the full input.",
      "mistakeTypes": [
        "full_input_consumption_missed",
        "partial_solution_saved"
      ],
      "nextAction": "Check segment count and consumed index independently.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_exact_segment_count",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "full_input_consumption_missed",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "partial_solution_saved",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "Exact segment count does not override the requirement that all input characters must be consumed.",
    "options": [
      {
        "id": "unused_chars",
        "text": "It leaves some input characters unused, so it is not a full segmentation.",
        "isCorrect": true
      },
      {
        "id": "too_few_segments",
        "text": "It has too few segments.",
        "isCorrect": false
      },
      {
        "id": "invalid_first_segment",
        "text": "The first segment must be invalid if characters remain.",
        "isCorrect": false
      },
      {
        "id": "needs_permutation",
        "text": "The remaining characters should be permuted into the existing segments.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_segment_capacity_pruning",
    "secondarySkillAtomIds": [
      "restore_ip_segmentation",
      "remaining_capacity_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A fixed-count segmentation needs 3 remaining segments, but only 2 characters remain. What should the search conclude?",
    "feedbackModel": {
      "decisionSignal": "Remaining input length must be enough to allocate at least one character per remaining segment.",
      "distractorExplanations": {
        "save_now": "A shorter leftover does not satisfy the fixed segment-count contract.",
        "reuse_chars": "Segmentation consumes characters in order without reuse.",
        "ignore_count": "The exact segment count is part of the problem constraints."
      },
      "mentalModelCorrection": "Segment feasibility depends on both remaining characters and remaining required parts.",
      "mistakeTypes": [
        "capacity_pruning_missed",
        "constraint_ignored"
      ],
      "nextAction": "Before recursing, compare remaining characters with the minimum required by remaining segments.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_segment_capacity_pruning",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "capacity_pruning_missed",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "Remaining input length must be enough to allocate at least one character per remaining segment.",
    "options": [
      {
        "id": "too_few_chars",
        "text": "Prune this branch because each remaining segment needs at least one character.",
        "isCorrect": true
      },
      {
        "id": "save_now",
        "text": "Save the current segments because fewer characters make the result shorter.",
        "isCorrect": false
      },
      {
        "id": "reuse_chars",
        "text": "Reuse earlier characters to fill the missing segment.",
        "isCorrect": false
      },
      {
        "id": "ignore_count",
        "text": "Ignore the segment count and continue.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_segment_capacity_pruning",
    "secondarySkillAtomIds": [
      "restore_ip_segmentation",
      "remaining_capacity_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A restore-IP search has 2 remaining segments. Each segment can contain at most 3 characters, but 7 characters remain. What should the search conclude?",
    "feedbackModel": {
      "decisionSignal": "The remaining characters exceed the maximum capacity of the remaining segment slots.",
      "distractorExplanations": {
        "always_valid": "Segmentation must consume the whole input; extra characters cannot be ignored.",
        "merge_all": "One segment of length 7 violates the max segment length.",
        "sort_remaining": "Sorting does not change how many characters the remaining segments can hold."
      },
      "mentalModelCorrection": "Fixed-count segmentation has both minimum and maximum remaining-capacity checks.",
      "mistakeTypes": [
        "capacity_pruning_missed",
        "constraint_ignored"
      ],
      "nextAction": "Check whether remaining input length fits within min/max capacity of remaining segments.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_segment_capacity_pruning",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "capacity_pruning_missed",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "The remaining characters exceed the maximum capacity of the remaining segment slots.",
    "options": [
      {
        "id": "too_many_chars",
        "text": "Prune this branch because 2 segments can cover at most 6 remaining characters.",
        "isCorrect": true
      },
      {
        "id": "always_valid",
        "text": "Continue because extra characters can always be ignored.",
        "isCorrect": false
      },
      {
        "id": "merge_all",
        "text": "Put all 7 characters into one segment.",
        "isCorrect": false
      },
      {
        "id": "sort_remaining",
        "text": "Sort the remaining characters to fit them into 2 segments.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-partition-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_ordered_segment_path",
    "secondarySkillAtomIds": [
      "string_segmentation",
      "backtracking_result_collection"
    ],
    "type": "single_choice",
    "prompt": "A partitioning result is represented as a path of segments. Which output shape preserves the meaning of the segmentation?",
    "feedbackModel": {
      "decisionSignal": "A segmentation result is defined by ordered contiguous pieces that cover the original input.",
      "distractorExplanations": {
        "sorted_segments": "Sorting segments destroys the order of the partition.",
        "set_of_chars": "A character set loses segment boundaries, duplicates, and order.",
        "segment_lengths_only": "Lengths alone do not preserve the actual segment values unless the prompt asks only for lengths."
      },
      "mentalModelCorrection": "The path in segmentation stores ordered pieces, not unordered selections.",
      "mistakeTypes": [
        "output_contract_misread",
        "string_partition_misread"
      ],
      "nextAction": "Preserve both segment boundaries and original order in partition outputs.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_ordered_segment_path",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "string_partition_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Partition",
    "trackId": "algorithms",
    "answerFeedback": "A segmentation result is defined by ordered contiguous pieces that cover the original input.",
    "options": [
      {
        "id": "ordered_segments",
        "text": "An ordered list of segments in the same order they appear in the input.",
        "isCorrect": true
      },
      {
        "id": "sorted_segments",
        "text": "A sorted list of segments, regardless of original order.",
        "isCorrect": false
      },
      {
        "id": "set_of_chars",
        "text": "A set of unique characters used by the partition.",
        "isCorrect": false
      },
      {
        "id": "segment_lengths_only",
        "text": "Only the lengths of segments, with no segment content.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];

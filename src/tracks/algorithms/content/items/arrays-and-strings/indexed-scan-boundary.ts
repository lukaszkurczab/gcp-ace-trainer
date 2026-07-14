import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const indexedScanBoundaryQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The work is a left-to-right neighbor scan with a boundary around the first index.",
      "distractorExplanations": {
        "nested_pair_enumeration": "All-pairs comparison solves a broader problem than the prompt asks for. Only the previous neighbor matters at each step.",
        "global_sorting": "Sorting changes the original order, so it destroys the neighbor relationships you are trying to inspect.",
        "frequency_counting": "Counts tell you how often a character appears, but not whether equal characters sit next to each other."
      },
      "mentalModelCorrection": "Name the local movement first: scan forward and guard the first index before reading a previous neighbor.",
      "mistakeTypes": [
        "constraint_ignored",
        "edge_case_missed"
      ],
      "nextAction": "Practice separating local adjacency from global reorderings such as sorting or all-pairs checks.",
      "result": "diagnostic"
    },
    "id": "alg-check-array-naming-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "secondarySkillAtomIds": [
      "recognize_adjacent_scan"
    ],
    "prompt": "Select every mechanic that matches the task.",
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize a neighbor scan",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks you to scan a string and compare each character with the character immediately before it. Which mechanics best describe the work?",
    "answerFeedback": "Neighbor comparison is local, so one forward scan plus a boundary guard is enough.",
    "options": [
      {
        "id": "linear_scan",
        "text": "A linear scan over the string.",
        "isCorrect": true
      },
      {
        "id": "index_boundary",
        "text": "A boundary guard for the first character or a loop starting at index 1.",
        "isCorrect": true
      },
      {
        "id": "nested_pair_enumeration",
        "text": "A nested comparison of every character with every other character.",
        "isCorrect": false
      },
      {
        "id": "global_sorting",
        "text": "Sorting the characters first so equal values group together.",
        "isCorrect": false
      },
      {
        "id": "frequency_counting",
        "text": "Counting how many times each character appears.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A left-to-right neighbor scan processes the next safe current index after each comparison.",
      "distractorExplanations": {
        "index_4": "Jumping to the last index skips unprocessed work. Nothing in the prompt lets you discard index 3.",
        "index_1": "Index 1 was used as context for the comparison, but it is not the next active position.",
        "stop": "Using the previous character does not finish the scan. Later positions can still change the answer."
      },
      "mentalModelCorrection": "Trace local scans one current index at a time unless the algorithm has a stated reason to skip a range.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "Practice tracing what the next live index is after each comparison step.",
      "result": "diagnostic"
    },
    "id": "alg-array-string-trace-index-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_scan_index",
    "secondarySkillAtomIds": [
      "track_index_boundary"
    ],
    "prompt": "Choose the next trace step.",
    "roadmapNodeId": "arrays_and_strings",
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "Process current index 3 next because index 2 has already been handled and 3 is still within the safe range.",
        "id": "alg-array-string-trace-index-001-trace-001",
        "order": 1,
        "state": [
          "Compared s[2] with s[1] in a 5-character string."
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
        "nodeId": "trace_scan_index",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace the next scan index",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "instruction": "You are scanning a 5-character string with indexes 0 through 4. The loop has just compared `s[2]` with `s[1]`. What is the next safe index to process?",
    "answerFeedback": "After processing current index 2, the next unprocessed safe current index in a left-to-right scan is 3.",
    "options": [
      {
        "id": "index_3",
        "text": "Move to index 3.",
        "isCorrect": true
      },
      {
        "id": "index_4",
        "text": "Jump to index 4 because it is the last valid index.",
        "isCorrect": false
      },
      {
        "id": "index_1",
        "text": "Move back to index 1 because it was used in the comparison.",
        "isCorrect": false
      },
      {
        "id": "stop",
        "text": "Stop because a previous character has already been checked.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Previous-index access is unsafe at the first position unless the loop guards it.",
      "distractorExplanations": {
        "middle_duplicate": "Repeated letters may affect the answer, but they do not cause a logical out-of-range read on their own.",
        "uppercase_letters": "Case matters in normalization tasks, not in whether reading s[i - 1] is safe.",
        "long_input": "Input size affects performance expectations, not whether index -1 is outside the valid logical index range."
      },
      "mentalModelCorrection": "Boundary bugs come from where the scan starts, not from the character values inside the string.",
      "mistakeTypes": [
        "edge_case_missed",
        "off_by_one"
      ],
      "nextAction": "Check whether neighbor access can happen at index 0 before thinking about larger optimizations.",
      "result": "diagnostic"
    },
    "id": "alg-array-string-edge-neighbor-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one"
    ],
    "prompt": "Choose the boundary case that creates the real risk.",
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Catch the neighbor-access boundary bug",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A routine reads `s[i - 1]` while scanning a string. Which input case is most likely to break a careless implementation?",
    "answerFeedback": "If the loop starts at index 0, reading the previous character uses a non-existent previous element.",
    "options": [
      {
        "id": "first_index_access",
        "text": "The loop starts at `i = 0` and tries to read `s[-1]`.",
        "isCorrect": true
      },
      {
        "id": "middle_duplicate",
        "text": "The string contains the same character twice in the middle.",
        "isCorrect": false
      },
      {
        "id": "uppercase_letters",
        "text": "The string contains uppercase letters.",
        "isCorrect": false
      },
      {
        "id": "long_input",
        "text": "The string is very long.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Original adjacency is positional evidence, so sorting is invalid even before you compare runtimes.",
      "distractorExplanations": {
        "sorting_too_slow_only": "Runtime is not the main problem. The deeper issue is that sorting changes which characters are neighbors.",
        "needs_hash_map": "A hash map tracks counts or lookup state. It does not preserve original adjacency by itself.",
        "needs_nested_loop": "All-pairs comparison is unnecessary because only adjacent positions affect the answer."
      },
      "mentalModelCorrection": "When a question depends on original positions, preserve the order and inspect those positions directly.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Ask whether the task depends on the original sequence before considering any reordering step.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_adjacent_scan",
    "prompt": "Choose the real flaw in the learner's approach.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "diagnose_order_destroying_transform"
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
        "nodeId": "recognize_adjacent_scan",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "track_index_boundary",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "diagnose_order_destroying_transform",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Explain why sorting breaks adjacency questions",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A learner solves \"count how many positions have the same character as the previous position\" by sorting the string first. What is the main mistake?",
    "answerFeedback": "The task is about original neighboring positions, so sorting changes the very evidence you are supposed to inspect.",
    "options": [
      {
        "id": "sorting_destroys_position",
        "text": "Sorting destroys the original neighbor relationships.",
        "isCorrect": true
      },
      {
        "id": "sorting_too_slow_only",
        "text": "Sorting is wrong only because it is slower than scanning.",
        "isCorrect": false
      },
      {
        "id": "needs_hash_map",
        "text": "The task always requires a hash map.",
        "isCorrect": false
      },
      {
        "id": "needs_nested_loop",
        "text": "The task requires every pair of characters to be compared.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The loop reads both before the string at index 0 and past the string at index `s.length`.",
      "distractorExplanations": {
        "sorting_missing": "Sorting would change the original neighbor relationships and does not fix the boundary reads.",
        "frequency_map_missing": "A frequency map solves a different multiplicity problem and does not repair out-of-range neighbor reads.",
        "nested_loop_missing": "The task is local adjacency, so a nested loop would add irrelevant work."
      },
      "mentalModelCorrection": "When code reads `s[i - 1]`, inspect the loop start. When code reads `s[i]`, inspect the loop end.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "Trace the first and last loop iterations before judging the algorithm idea.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-026-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "prompt": "Choose the bug that actually follows from the loop bounds.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "recognize_adjacent_scan"
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose both ends of a neighbor loop",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A learner writes: `for (let i = 0; i <= s.length; i++) { if (s[i] === s[i - 1]) return false; }`. What is the main bug?",
    "answerFeedback": "At `i = 0`, the code reads `s[-1]`, outside the valid logical index range. At `i = s.length`, it reads past the last character. The loop boundaries are wrong.",
    "options": [
      {
        "id": "invalid_boundary_reads",
        "text": "The loop reads `s[-1]` on the first iteration and reads past the end on the last iteration.",
        "isCorrect": true
      },
      {
        "id": "sorting_missing",
        "text": "The code should sort the string before checking neighbors.",
        "isCorrect": false
      },
      {
        "id": "frequency_map_missing",
        "text": "The code needs a frequency map to compare duplicate counts.",
        "isCorrect": false
      },
      {
        "id": "nested_loop_missing",
        "text": "The code needs a nested loop to compare every pair.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Reading `s[i - 1]` means the first safe current index is 1.",
      "distractorExplanations": {
        "start_zero": "Starting at 0 makes the first iteration read a non-existent previous element.",
        "start_two": "Starting at 2 skips the valid adjacent pair at indexes 0 and 1.",
        "start_last": "Starting at the last index skips earlier adjacent pairs."
      },
      "mentalModelCorrection": "Choose the loop start from the farthest previous-index expression used inside the loop.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "Before writing the loop, name the first index where every indexed read is valid.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-032-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the safe loop start.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one",
      "recognize_adjacent_scan"
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Choose the first safe previous-neighbor index",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A loop compares `s[i]` with `s[i - 1]`. Which loop start is boundary-safe without adding a separate guard inside the loop?",
    "answerFeedback": "Starting at `i = 1` makes both `s[i]` and `s[i - 1]` inside the valid logical index range for the first comparison.",
    "options": [
      {
        "id": "start_one",
        "text": "Start at `i = 1`.",
        "isCorrect": true
      },
      {
        "id": "start_zero",
        "text": "Start at `i = 0`.",
        "isCorrect": false
      },
      {
        "id": "start_two",
        "text": "Start at `i = 2`.",
        "isCorrect": false
      },
      {
        "id": "start_last",
        "text": "Start at the last index.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "For a next-neighbor read, the current index must stop before the final array position.",
      "distractorExplanations": {
        "inclusive_last": "At `i = arr.length - 1`, `arr[i + 1]` reads past the array.",
        "start_at_one": "Starting at 1 skips the valid adjacent pair at indexes 0 and 1 for a next-neighbor scan.",
        "all_pairs": "Nested all-pairs comparison is broader than checking adjacent next-neighbor pairs."
      },
      "mentalModelCorrection": "The last safe current index is `arr.length - 2`, so `i < arr.length - 1` checks the final pair without reading past the end.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "When the body reads `arr[i + 1]`, choose a loop condition that keeps `i + 1` inside the valid index range.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-033-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one",
      "recognize_adjacent_scan"
    ],
    "prompt": "Choose the safe and complete loop condition.",
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Choose a safe next-neighbor bound",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A loop compares `arr[i]` with `arr[i + 1]` while scanning adjacent pairs. Which loop condition keeps the next-neighbor read safe and still checks the final valid pair?",
    "answerFeedback": "Use `i < arr.length - 1`. The last safe current index is `arr.length - 2`, so the final valid pair is checked without reading past the end.",
    "options": [
      {
        "id": "stop_before_last",
        "text": "`i < arr.length - 1`",
        "isCorrect": true
      },
      {
        "id": "inclusive_last",
        "text": "`i <= arr.length - 1`",
        "isCorrect": false
      },
      {
        "id": "start_at_one",
        "text": "`i = 1; i < arr.length`",
        "isCorrect": false
      },
      {
        "id": "all_pairs",
        "text": "Use nested loops to compare every pair.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The loop starts safely for `i - 1`, but the `<=` condition still creates a past-the-end read.",
      "distractorExplanations": {
        "start_boundary_only": "Starting at 1 protects `s[i - 1]`, but it does not protect `s[i]` when `i === s.length`.",
        "needs_sorting": "Sorting changes the original neighbor relationships and does not repair the loop bound.",
        "needs_nested_loop": "The condition is local adjacency, so nested comparison is not required."
      },
      "mentalModelCorrection": "A loop can have one boundary correct and the other boundary wrong. Check both first and last iterations.",
      "mistakeTypes": [
        "off_by_one",
        "cannot_trace_algorithm"
      ],
      "nextAction": "Trace the first valid iteration and the final attempted iteration separately.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-034-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "prompt": "Choose the remaining boundary bug.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "recognize_adjacent_scan"
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Catch the unsafe inclusive end bound",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A learner writes `for (let i = 1; i <= s.length; i++)` before comparing `s[i]` with `s[i - 1]`. What boundary bug remains?",
    "answerFeedback": "The loop start is safe, but `i <= s.length` eventually makes the code read `s[s.length]`, outside the valid logical string index range.",
    "options": [
      {
        "id": "past_end_read",
        "text": "The loop still reads `s[s.length]` on the final iteration.",
        "isCorrect": true
      },
      {
        "id": "start_boundary_only",
        "text": "There is no bug because starting at 1 fixes every boundary.",
        "isCorrect": false
      },
      {
        "id": "needs_sorting",
        "text": "The remaining bug is that the string was not sorted first.",
        "isCorrect": false
      },
      {
        "id": "needs_nested_loop",
        "text": "The loop still needs to compare every pair of characters.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "For length 0 or 1, the previous-neighbor loop has no safe current index to process.",
      "distractorExplanations": {
        "throws_empty": "The loop does not need to throw unless the problem contract forbids empty input.",
        "reads_negative": "Starting at 1 avoids reading `s[-1]`.",
        "needs_manual_special_case": "A special branch can work, but the loop boundary already handles these short inputs naturally."
      },
      "mentalModelCorrection": "Trace whether the loop runs before reasoning about a neighbor read. A safe loop can skip short inputs without a special case.",
      "mistakeTypes": [
        "edge_case_missed",
        "off_by_one"
      ],
      "nextAction": "Check whether the loop runs at all for the smallest valid inputs.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-035-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_scan_index",
    "prompt": "Choose the boundary behavior for short strings.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary",
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
        "nodeId": "trace_scan_index",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Trace short inputs through a safe loop",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "stepByStepTrace": [
      {
        "id": "alg-prod-array-string-035-trace-001",
        "order": 1,
        "state": [
          "Loop starts with i = 1 and condition i < s.length."
        ],
        "description": "For length 0 or 1, the condition is false immediately, so there is no current index to process."
      }
    ],
    "instruction": "A function uses `for (let i = 1; i < s.length; i++)` to compare `s[i]` with `s[i - 1]`. What happens for strings of length 0 or 1?",
    "answerFeedback": "For length 0 or 1, `i = 1` is not less than `s.length`, so the loop does not run and no invalid previous-neighbor read occurs.",
    "options": [
      {
        "id": "loop_skips_safely",
        "text": "The loop skips, so no neighbor access occurs.",
        "isCorrect": true
      },
      {
        "id": "throws_empty",
        "text": "The loop must throw on empty input.",
        "isCorrect": false
      },
      {
        "id": "reads_negative",
        "text": "The first iteration reads `s[-1]`.",
        "isCorrect": false
      },
      {
        "id": "needs_manual_special_case",
        "text": "The loop is unsafe unless both cases are manually special-cased.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The condition `i > 0` is the guard that makes previous-neighbor access safe at index 0.",
      "distractorExplanations": {
        "i_less_than_length": "This protects the current index from the end, but it does not protect `i - 1` at the start.",
        "s_i_exists": "Checking the current character does not prove the previous character exists.",
        "s_previous_equals_current": "This is the comparison, not the guard that makes the comparison safe."
      },
      "mentalModelCorrection": "A guard should protect the specific index expression that could go out of bounds.",
      "mistakeTypes": [
        "edge_case_missed",
        "off_by_one"
      ],
      "nextAction": "Pair each guarded expression with the boundary that can break it.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-036-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the guard that protects `s[i - 1]`.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one",
      "recognize_adjacent_scan"
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Choose the guard for previous-neighbor access",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A scan starts at `i = 0`, but only reads `s[i - 1]` inside an `if` guard. Which guard protects the previous-neighbor read?",
    "answerFeedback": "`i > 0` means the previous index exists before `s[i - 1]` is read.",
    "options": [
      {
        "id": "i_greater_than_zero",
        "text": "`i > 0`",
        "isCorrect": true
      },
      {
        "id": "i_less_than_length",
        "text": "`i < s.length`",
        "isCorrect": false
      },
      {
        "id": "s_i_exists",
        "text": "`s[i]` is not empty.",
        "isCorrect": false
      },
      {
        "id": "s_previous_equals_current",
        "text": "`s[i - 1] === s[i]`",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The condition `i < arr.length - 1` is the guard that makes next-neighbor access safe.",
      "distractorExplanations": {
        "i_greater_than_zero": "This protects previous-neighbor access, not `i + 1` at the end.",
        "i_less_equal_length": "This permits positions outside the array.",
        "arr_i_exists": "The current element can exist while the next element does not."
      },
      "mentalModelCorrection": "The boundary guard depends on the direction of the neighbor access.",
      "mistakeTypes": [
        "edge_case_missed",
        "off_by_one"
      ],
      "nextAction": "For `i + 1`, trace what happens at the last valid index.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-037-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the guard that protects `arr[i + 1]`.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one",
      "recognize_adjacent_scan"
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Choose the guard for next-neighbor access",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A scan starts at `i = 0`, but only reads `arr[i + 1]` inside an `if` guard. Which guard protects the next-neighbor read?",
    "answerFeedback": "`i < arr.length - 1` ensures there is a next element before `arr[i + 1]` is read.",
    "options": [
      {
        "id": "i_less_than_length_minus_one",
        "text": "`i < arr.length - 1`",
        "isCorrect": true
      },
      {
        "id": "i_greater_than_zero",
        "text": "`i > 0`",
        "isCorrect": false
      },
      {
        "id": "i_less_equal_length",
        "text": "`i <= arr.length`",
        "isCorrect": false
      },
      {
        "id": "arr_i_exists",
        "text": "`arr[i]` exists.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Comparing with `i - 2` requires starting at index 2, not index 1.",
      "distractorExplanations": {
        "start_one": "At index 1, `i - 2` is -1, so the read is unsafe.",
        "start_zero": "At index 0, `i - 2` is -2, so the read is even farther before the array.",
        "start_three": "Starting at 3 is safe but skips the valid comparison at index 2."
      },
      "mentalModelCorrection": "The loop start must account for the largest backward offset used in the loop body.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "Find the most negative index expression and choose the first `i` that makes it zero or greater.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-038-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the first safe index.",
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Choose the boundary for a two-step previous read",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A loop compares each value with the value two positions before it using `arr[i - 2]`. What is the first safe index for `i`?",
    "answerFeedback": "At `i = 2`, `arr[i - 2]` becomes `arr[0]`, the first valid read for that expression.",
    "options": [
      {
        "id": "start_two",
        "text": "Start at `i = 2`.",
        "isCorrect": true
      },
      {
        "id": "start_one",
        "text": "Start at `i = 1`.",
        "isCorrect": false
      },
      {
        "id": "start_zero",
        "text": "Start at `i = 0`.",
        "isCorrect": false
      },
      {
        "id": "start_three",
        "text": "Start at `i = 3`.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Reading `arr[i + 2]` requires stopping before the final two indexes as current positions.",
      "distractorExplanations": {
        "length_minus_one": "This still lets `i` reach the second-to-last index, where `i + 2` is past the end.",
        "length": "This allows current positions at or beyond the end.",
        "length_minus_three": "This is safe but skips the last valid current index."
      },
      "mentalModelCorrection": "The loop end must account for the largest forward offset used in the loop body.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "Find the largest forward index expression and choose the final `i` that keeps it within bounds.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-039-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the correct loop condition.",
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Choose the boundary for a two-step next read",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A loop compares each value with the value two positions after it using `arr[i + 2]`. Which condition keeps the read boundary-safe while checking every valid pair?",
    "answerFeedback": "The last safe current index is `arr.length - 3`, so the condition should be `i < arr.length - 2`.",
    "options": [
      {
        "id": "i_less_than_length_minus_two",
        "text": "`i < arr.length - 2`",
        "isCorrect": true
      },
      {
        "id": "length_minus_one",
        "text": "`i < arr.length - 1`",
        "isCorrect": false
      },
      {
        "id": "length",
        "text": "`i < arr.length`",
        "isCorrect": false
      },
      {
        "id": "length_minus_three",
        "text": "`i < arr.length - 3`",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The code uses the previous index, so an empty array and a first-index iteration are the important risks.",
      "distractorExplanations": {
        "large_array": "A large array affects performance but does not create a boundary error by itself.",
        "negative_values": "Negative values are data values, not invalid indexes.",
        "duplicates_late": "Later duplicates affect the answer, but not whether the first previous-index read is safe."
      },
      "mentalModelCorrection": "Boundary bugs come from index expressions and loop bounds, not from ordinary values stored in the array.",
      "mistakeTypes": [
        "edge_case_missed",
        "off_by_one"
      ],
      "nextAction": "When checking a boundary bug, choose a test that forces the dangerous index expression to execute.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-040-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "prompt": "Choose the test case that targets the first-index boundary.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary"
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Pick a test for first-index previous access",
    "trackId": "algorithms",
    "type": "test_case_selection",
    "instruction": "A learner scans an array from index 0 and compares `arr[i]` with `arr[i - 1]`. Which test case most directly exposes the boundary bug?",
    "answerFeedback": "A one-element array still enters a careless `i = 0` loop and immediately reads `arr[-1]`, outside the valid logical array index range.",
    "options": [
      {
        "id": "single_element",
        "text": "`[7]`",
        "isCorrect": true
      },
      {
        "id": "large_array",
        "text": "An array with one million values.",
        "isCorrect": false
      },
      {
        "id": "negative_values",
        "text": "`[-3, -2, -1]`",
        "isCorrect": false
      },
      {
        "id": "duplicates_late",
        "text": "`[1, 2, 3, 3]`",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A next-neighbor loop that reaches the last index will read past the end.",
      "distractorExplanations": {
        "empty_array": "An empty array may skip the loop depending on the condition, so it may not expose the last-index next read.",
        "all_same": "Equal values affect the predicate result, not whether the end boundary is safe.",
        "sorted_values": "Sorted order is unrelated to protecting `i + 1`."
      },
      "mentalModelCorrection": "To expose a next-neighbor end bug, pick the smallest input where the loop reaches a last element and tries to read one more.",
      "mistakeTypes": [
        "edge_case_missed",
        "off_by_one"
      ],
      "nextAction": "Trace the final iteration, not only the first one.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-041-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "prompt": "Choose the smallest direct boundary test.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary"
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Pick a test for last-index next access",
    "trackId": "algorithms",
    "type": "test_case_selection",
    "instruction": "A learner scans with `i < arr.length` and compares `arr[i]` with `arr[i + 1]`. Which test case most directly exposes the end-boundary bug?",
    "answerFeedback": "With `[7]`, the loop reaches `i = 0` and immediately reads `arr[1]`, which is past the end.",
    "options": [
      {
        "id": "single_element",
        "text": "`[7]`",
        "isCorrect": true
      },
      {
        "id": "empty_array",
        "text": "`[]`",
        "isCorrect": false
      },
      {
        "id": "all_same",
        "text": "`[2, 2, 2]`",
        "isCorrect": false
      },
      {
        "id": "sorted_values",
        "text": "`[1, 2, 3]`",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "When scanning backward and reading `i - 1`, the loop must stop before `i` reaches 0.",
      "distractorExplanations": {
        "i_greater_equal_zero": "At `i = 0`, `arr[i - 1]` reads before the array.",
        "i_less_than_length": "This is an upper-bound check, not the lower-bound needed in a backward scan.",
        "i_greater_than_one": "This is safe but skips the valid comparison at `i = 1`."
      },
      "mentalModelCorrection": "Backward scans still need the lower boundary protected when reading previous indexes.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "For reverse loops, trace the final iteration near index 0.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-044-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the safe reverse-loop condition.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one",
      "trace_scan_index"
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Protect index zero in a reverse previous-neighbor scan",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A reverse loop compares `arr[i]` with `arr[i - 1]`. Which condition lets it stop safely while still checking the pair at indexes 0 and 1?",
    "answerFeedback": "The loop can run down to `i = 1`, where `arr[i - 1]` is `arr[0]`. It must not run at `i = 0`.",
    "options": [
      {
        "id": "i_greater_than_zero",
        "text": "Continue while `i > 0`.",
        "isCorrect": true
      },
      {
        "id": "i_greater_equal_zero",
        "text": "Continue while `i >= 0`.",
        "isCorrect": false
      },
      {
        "id": "i_less_than_length",
        "text": "Continue while `i < arr.length`.",
        "isCorrect": false
      },
      {
        "id": "i_greater_than_one",
        "text": "Continue while `i > 1`.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A while loop with manual index updates has the same boundary risk as a for loop.",
      "distractorExplanations": {
        "increment_missing": "The snippet increments `i`; the issue is the out-of-range first previous read.",
        "needs_sorting": "Sorting is unrelated to protecting `i - 1`.",
        "nested_loop_missing": "A nested loop would add irrelevant comparisons."
      },
      "mentalModelCorrection": "Loop syntax does not change boundary reasoning. Inspect the first and last index values actually used.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "Apply the same boundary checklist to `for`, `while`, and manual pointer loops.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-045-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "prompt": "Choose the real bug in the while loop.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "recognize_adjacent_scan"
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose previous access in a while loop",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A learner writes `let i = 0; while (i < s.length) { if (s[i] === s[i - 1]) return false; i++; }`. What is the main bug?",
    "answerFeedback": "The first loop iteration uses `i = 0`, so `s[i - 1]` reads `s[-1]`, outside the valid logical string index range.",
    "options": [
      {
        "id": "unsafe_first_previous_read",
        "text": "The first iteration reads `s[-1]`.",
        "isCorrect": true
      },
      {
        "id": "increment_missing",
        "text": "The loop never increments `i`.",
        "isCorrect": false
      },
      {
        "id": "needs_sorting",
        "text": "The string must be sorted before the loop.",
        "isCorrect": false
      },
      {
        "id": "nested_loop_missing",
        "text": "The code needs a nested loop to compare all pairs.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A safe refactor can either start at 1 or keep index 0 and guard the previous-neighbor comparison.",
      "distractorExplanations": {
        "sort_first": "Sorting changes the original adjacency evidence instead of fixing the boundary.",
        "use_frequency_map": "A frequency map solves multiplicity questions, not local previous-neighbor safety.",
        "skip_last": "Skipping the last index protects the wrong end for `i - 1` access."
      },
      "mentalModelCorrection": "Fix the boundary that the indexed expression actually threatens. For `i - 1`, protect the start.",
      "mistakeTypes": [
        "off_by_one",
        "wrong_approach"
      ],
      "nextAction": "When refactoring boundary bugs, prefer the smallest loop-bound or guard change that preserves the original task.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-046-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "prompt": "Choose the boundary-preserving refactor.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "recognize_adjacent_scan"
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Refactor a previous-neighbor boundary bug",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A loop starts at `i = 0` and reads `s[i - 1]`. Which refactor fixes the boundary bug while preserving the same adjacent-scan task?",
    "answerFeedback": "Starting the comparison loop at `i = 1` preserves every adjacent pair and avoids reading a non-existent previous character.",
    "options": [
      {
        "id": "start_at_one",
        "text": "Start the comparison loop at `i = 1`.",
        "isCorrect": true
      },
      {
        "id": "sort_first",
        "text": "Sort the string first.",
        "isCorrect": false
      },
      {
        "id": "use_frequency_map",
        "text": "Build a frequency map before scanning.",
        "isCorrect": false
      },
      {
        "id": "skip_last",
        "text": "Stop the loop before the last character.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Skipping the last index is the correct refactor for a next-neighbor read.",
      "distractorExplanations": {
        "start_at_one": "Starting at 1 protects previous-neighbor reads and skips the first valid next-neighbor pair.",
        "sort_first": "Sorting changes the original adjacency relationships.",
        "use_frequency_map": "Counting values does not repair the end boundary for `i + 1`."
      },
      "mentalModelCorrection": "For `i + 1`, the unsafe boundary is the end of the array, not the beginning.",
      "mistakeTypes": [
        "off_by_one",
        "wrong_approach"
      ],
      "nextAction": "Tie each refactor to the exact boundary threatened by the index expression.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-047-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "prompt": "Choose the boundary-preserving refactor.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "recognize_adjacent_scan"
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Refactor a next-neighbor boundary bug",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A loop scans with `i < arr.length` and reads `arr[i + 1]`. Which refactor fixes the boundary bug while preserving every valid adjacent comparison?",
    "answerFeedback": "Using `i < arr.length - 1` makes the last safe current index `arr.length - 2`, so the final adjacent pair is checked without reading past the end.",
    "options": [
      {
        "id": "stop_before_last",
        "text": "Change the condition to `i < arr.length - 1`.",
        "isCorrect": true
      },
      {
        "id": "start_at_one",
        "text": "Start at `i = 1`.",
        "isCorrect": false
      },
      {
        "id": "sort_first",
        "text": "Sort the array before scanning.",
        "isCorrect": false
      },
      {
        "id": "use_frequency_map",
        "text": "Build a frequency map before the loop.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The phrase immediately after means the algorithm needs next-neighbor access and an end boundary.",
      "distractorExplanations": {
        "previous_boundary": "Previous-neighbor access is used for `immediately before`, not `immediately after`.",
        "frequency_counting": "Counts do not preserve which character sits immediately after another character.",
        "global_sorting": "Sorting changes the original next-neighbor relationships."
      },
      "mentalModelCorrection": "Map directional words in the prompt to the index expression and boundary they imply.",
      "mistakeTypes": [
        "constraint_ignored",
        "edge_case_missed"
      ],
      "nextAction": "When a prompt says before or after, translate it into `i - 1` or `i + 1` before choosing loop bounds.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-048-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the boundary signal in the prompt.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "recognize_adjacent_scan",
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Map immediately-after wording to the end boundary",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks whether any character is the same as the character immediately after it. Which boundary matters most?",
    "answerFeedback": "Immediately after maps to `s[i + 1]`, so the loop must protect the end of the string.",
    "options": [
      {
        "id": "next_neighbor_end_boundary",
        "text": "A next-neighbor read with an end boundary.",
        "isCorrect": true
      },
      {
        "id": "previous_boundary",
        "text": "A previous-neighbor read with a start boundary.",
        "isCorrect": false
      },
      {
        "id": "frequency_counting",
        "text": "A count table for each character.",
        "isCorrect": false
      },
      {
        "id": "global_sorting",
        "text": "Sorting first so equal characters group together.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The loop body reads both `i - 1` and `i + 1`, so both ends must be protected.",
      "distractorExplanations": {
        "start_one_only": "Starting at 1 protects `i - 1`, but the loop must also stop before the last index to protect `i + 1`.",
        "stop_before_last_only": "Stopping before the last index protects `i + 1`, but starting at 0 still breaks `i - 1`.",
        "full_range": "Scanning every index from 0 through the last index makes both boundary reads unsafe."
      },
      "mentalModelCorrection": "When a loop reads neighbors on both sides, the safe current indexes are the interior positions only.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "List every indexed expression in the loop body and intersect their safe ranges.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-049-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the safe current-index range.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one",
      "trace_scan_index"
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Intersect both-side neighbor boundaries",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A loop compares `arr[i]` with both `arr[i - 1]` and `arr[i + 1]`. Which range is safe for `i`?",
    "answerFeedback": "The current index must be at least 1 for `i - 1` and at most `arr.length - 2` for `i + 1`, so only interior indexes are safe.",
    "options": [
      {
        "id": "interior_only",
        "text": "`i` from 1 through `arr.length - 2`.",
        "isCorrect": true
      },
      {
        "id": "start_one_only",
        "text": "`i` from 1 through `arr.length - 1`.",
        "isCorrect": false
      },
      {
        "id": "stop_before_last_only",
        "text": "`i` from 0 through `arr.length - 2`.",
        "isCorrect": false
      },
      {
        "id": "full_range",
        "text": "Every index from 0 through `arr.length - 1`.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "For a 5-element array, indexes 1, 2, and 3 are the only positions with both a previous and next neighbor.",
      "distractorExplanations": {
        "index_four": "Index 4 has a previous neighbor but no next neighbor.",
        "index_zero": "Index 0 has a next neighbor but no previous neighbor.",
        "stop": "The scan is not finished after index 2 because index 3 is still an interior index."
      },
      "mentalModelCorrection": "Interior scans advance through positions that have all required neighbor reads available.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "Mark the safe current-index range first, then trace movement inside that range.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-050-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_scan_index",
    "prompt": "Choose the next safe trace step.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "diagnose_off_by_one"
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "The safe interior range for a 5-element array is indexes 1 through 3. After processing index 2, the next safe current index is 3.",
        "id": "alg-prod-array-string-050-trace-001",
        "order": 1,
        "state": [
          "Processed index 2 while reading both arr[i - 1] and arr[i + 1]."
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
        "nodeId": "trace_scan_index",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace an interior-neighbor scan",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "instruction": "You scan a 5-element array and at each current index read both `arr[i - 1]` and `arr[i + 1]`. You just processed index 2. What is the next safe current index?",
    "answerFeedback": "For a 5-element array, the safe current indexes with both neighbors are 1, 2, and 3. After index 2, index 3 is next.",
    "options": [
      {
        "id": "index_three",
        "text": "Move to index 3.",
        "isCorrect": true
      },
      {
        "id": "index_four",
        "text": "Move to index 4.",
        "isCorrect": false
      },
      {
        "id": "index_zero",
        "text": "Move back to index 0.",
        "isCorrect": false
      },
      {
        "id": "stop",
        "text": "Stop because index 2 has both neighbors.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Neighboring pair means local adjacency: scan left to right, compare adjacent values, and protect one boundary.",
      "distractorExplanations": {
        "all_pairs": "Comparing every pair solves a broader problem than neighboring pairs and includes non-adjacent values.",
        "sort_first": "Sorting changes the original neighbor relationships the task asks you to inspect.",
        "frequency_table": "A frequency table tracks counts, not whether two matching values are next to each other."
      },
      "mentalModelCorrection": "Translate neighboring pair into a local scan before choosing data structures or broader comparisons.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Name the movement first: compare current value with the adjacent value and guard the boundary at one end.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-051-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_adjacent_scan",
    "secondarySkillAtomIds": [
      "track_index_boundary"
    ],
    "prompt": "Select every mechanic that matches the task.",
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
        "nodeId": "recognize_adjacent_scan",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize neighboring-pair traversal",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks you to inspect every neighboring pair in an array and count how many pairs match a condition. Which mechanics best describe the work?",
    "answerFeedback": "A neighboring-pair task uses one left-to-right scan, compares adjacent values, and protects the boundary where the adjacent value would be outside the array.",
    "options": [
      {
        "id": "left_to_right_scan",
        "text": "Use a single left-to-right scan.",
        "isCorrect": true
      },
      {
        "id": "compare_adjacent",
        "text": "Compare the current value with an adjacent value.",
        "isCorrect": true
      },
      {
        "id": "protect_boundary",
        "text": "Protect the boundary at one end of the array.",
        "isCorrect": true
      },
      {
        "id": "all_pairs",
        "text": "Compare every pair of values.",
        "isCorrect": false
      },
      {
        "id": "sort_first",
        "text": "Sort the array first.",
        "isCorrect": false
      },
      {
        "id": "frequency_table",
        "text": "Build a frequency table.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A frequency map detects repeated values anywhere, but adjacency depends on original neighboring positions.",
      "distractorExplanations": {
        "always_slower": "The main issue is correctness, not a blanket performance claim.",
        "cannot_store_numbers": "Frequency maps can store numeric keys; the problem is that counts lose position adjacency.",
        "sort_required": "Sorting changes the original order and can create neighbors that were not adjacent in the input."
      },
      "mentalModelCorrection": "Do not replace a local order constraint with a global count unless the prompt stops caring about original positions.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Ask whether the prompt means duplicate anywhere or immediately next to it in the original order.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-052-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_adjacent_scan",
    "secondarySkillAtomIds": [
      "diagnose_order_destroying_transform"
    ],
    "prompt": "Choose the correctness reason.",
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
        "nodeId": "recognize_adjacent_scan",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Separate adjacent duplicates from duplicates anywhere",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A task asks whether any value is equal to the value immediately next to it. Why is a frequency map not the direct solution?",
    "answerFeedback": "A frequency map can detect repeated values anywhere, but it does not preserve whether the repeats are adjacent in the original order.",
    "options": [
      {
        "id": "loses_adjacency",
        "text": "It can detect repeated values anywhere, but not whether repeats are adjacent in the original order.",
        "isCorrect": true
      },
      {
        "id": "always_slower",
        "text": "It is always slower than scanning.",
        "isCorrect": false
      },
      {
        "id": "cannot_store_numbers",
        "text": "It cannot store numbers.",
        "isCorrect": false
      },
      {
        "id": "sort_required",
        "text": "Adjacency requires sorting first.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Adjacent pairs are formed by each valid current index that still has a next neighbor.",
      "distractorExplanations": {
        "n_pairs": "The last element has no next neighbor, so it cannot start a next-neighbor pair.",
        "n_plus_one_pairs": "Boundary-safe scanning never creates more pairs than elements.",
        "n_squared_pairs": "That is all-pairs reasoning, not adjacent-pair reasoning.",
        "zero_pairs": "Boundary safety does not mean skipping valid adjacent pairs."
      },
      "mentalModelCorrection": "For next-neighbor scans, the last safe current index is `n - 2`, so there are `n - 1` valid adjacent pairs when `n > 0`.",
      "mistakeTypes": [
        "off_by_one",
        "constraint_ignored"
      ],
      "nextAction": "Distinguish valid pairs from all indexes: the last element can be the neighbor, but not the current index for `i + 1`.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-053-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_adjacent_scan",
    "secondarySkillAtomIds": [
      "track_index_boundary"
    ],
    "prompt": "Choose the number of adjacent pairs.",
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
        "nodeId": "recognize_adjacent_scan",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Count adjacent pairs from length",
    "trackId": "algorithms",
    "type": "state_selection",
    "instruction": "An array has length `n`. A loop compares each element with the next element. How many adjacent pairs exist?",
    "answerFeedback": "There are `n - 1` adjacent pairs when `n > 0`. The boundary-safe loop does not lose a pair; it simply avoids using the last element as the current index for `i + 1`.",
    "options": [
      {
        "id": "n_minus_one",
        "text": "`n - 1` pairs, when `n > 0`.",
        "isCorrect": true
      },
      {
        "id": "n_pairs",
        "text": "`n` pairs.",
        "isCorrect": false
      },
      {
        "id": "n_plus_one_pairs",
        "text": "`n + 1` pairs.",
        "isCorrect": false
      },
      {
        "id": "n_squared_pairs",
        "text": "`n * n` pairs.",
        "isCorrect": false
      },
      {
        "id": "zero_pairs",
        "text": "Always 0 pairs for boundary safety.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A next-neighbor scan advances the current index by one while it remains inside the safe current-index range.",
      "distractorExplanations": {
        "jump_to_last": "Index 5 is the last element, but it is not a safe current index for reading `arr[i + 1]`.",
        "stop_after_reading_neighbor": "Reading index 3 as a neighbor does not mean index 3 has been processed as the current index.",
        "move_back": "The loop moves forward; nothing in the prompt says to rescan earlier indexes."
      },
      "mentalModelCorrection": "Separate values read as context from the current index that the loop processes next.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "After processing `i`, advance to `i + 1` if that next current index is still safe.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-054-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_scan_index",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "recognize_adjacent_scan"
    ],
    "prompt": "Choose the next current index.",
    "roadmapNodeId": "arrays_and_strings",
    "status": "active",
    "stepByStepTrace": [
      {
        "id": "alg-prod-array-string-054-trace-001",
        "order": 1,
        "state": [
          "Processed i = 2 while comparing arr[i] with arr[i + 1]."
        ],
        "description": "The scan advances to current index 3; index 3 is safe because the next-neighbor read is arr[4]."
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
        "nodeId": "trace_scan_index",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace the next-neighbor current index",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "instruction": "You scan a 6-element array with `i < arr.length - 1` and compare `arr[i]` with `arr[i + 1]`. You just processed `i = 2`. What is the next current index?",
    "answerFeedback": "After processing current index 2, the next current index is 3. In a 6-element array, 3 is still safe because `arr[4]` exists.",
    "options": [
      {
        "id": "index_three",
        "text": "Move to `i = 3`.",
        "isCorrect": true
      },
      {
        "id": "jump_to_last",
        "text": "Jump to `i = 5`.",
        "isCorrect": false
      },
      {
        "id": "stop_after_reading_neighbor",
        "text": "Stop because `i + 1` was already read.",
        "isCorrect": false
      },
      {
        "id": "move_back",
        "text": "Move back to `i = 1`.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A reverse scan moves the current index backward while keeping `i > 0` so `arr[i - 1]` exists.",
      "distractorExplanations": {
        "move_to_four": "That moves in the wrong direction for a reverse loop.",
        "stop_after_previous": "Reading a previous value does not finish the reverse scan; lower safe current indexes remain.",
        "move_to_zero": "Index 0 is not safe as the current index for reading `arr[i - 1]`."
      },
      "mentalModelCorrection": "Trace the loop direction and the safe current-index condition together.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "For reverse previous-neighbor scans, decrement the current index but stop before `i = 0`.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-055-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_scan_index",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one"
    ],
    "prompt": "Choose the next safe current index.",
    "roadmapNodeId": "arrays_and_strings",
    "status": "active",
    "stepByStepTrace": [
      {
        "id": "alg-prod-array-string-055-trace-001",
        "order": 1,
        "state": [
          "Reverse loop processed i = 3 with condition i > 0."
        ],
        "description": "The next reverse current index is 2, and it still satisfies `i > 0`."
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
        "nodeId": "trace_scan_index",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace reverse adjacent movement",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "instruction": "A reverse loop checks adjacent pairs by comparing `arr[i]` with `arr[i - 1]` and continues while `i > 0`. In a 5-element array, it just processed `i = 3`. What is the next safe current index?",
    "answerFeedback": "After processing `i = 3`, a reverse scan moves to `i = 2`. Index 2 is safe because `arr[1]` exists.",
    "options": [
      {
        "id": "index_two",
        "text": "Move to `i = 2`.",
        "isCorrect": true
      },
      {
        "id": "move_to_four",
        "text": "Move to `i = 4`.",
        "isCorrect": false
      },
      {
        "id": "stop_after_previous",
        "text": "Stop because a previous value was read.",
        "isCorrect": false
      },
      {
        "id": "move_to_zero",
        "text": "Move to `i = 0`.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The loop is safe but incomplete: it stops before the last valid current index.",
      "distractorExplanations": {
        "reads_past_end": "`i < arr.length - 2` is too strict, not too loose, so it does not read past the end.",
        "compares_every_pair": "The code still compares only adjacent next-neighbor pairs.",
        "needs_frequency_map": "A frequency map would not fix a skipped adjacent pair in the original order."
      },
      "mentalModelCorrection": "Boundary bugs can be unsafe reads or skipped valid work. Check both safety and completeness.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "Find the last valid current index for `arr[i + 1]` and compare it with the loop condition.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-056-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "recognize_adjacent_scan"
    ],
    "prompt": "Choose the actual boundary bug.",
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose a skipped final adjacent pair",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A loop compares `arr[i]` with `arr[i + 1]`, but uses `i < arr.length - 2`. What bug does this create?",
    "answerFeedback": "The loop is safe, but it skips the final valid adjacent pair. For `arr[i + 1]`, the last safe current index is `arr.length - 2`.",
    "options": [
      {
        "id": "skips_final_pair",
        "text": "It is safe, but it skips the final valid adjacent pair.",
        "isCorrect": true
      },
      {
        "id": "reads_past_end",
        "text": "It reads past the end.",
        "isCorrect": false
      },
      {
        "id": "compares_every_pair",
        "text": "It compares every pair.",
        "isCorrect": false
      },
      {
        "id": "needs_frequency_map",
        "text": "It requires a frequency map.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Starting a next-neighbor scan at 1 is safe, but it skips the valid pair beginning at index 0.",
      "distractorExplanations": {
        "skips_last_pair": "The start index controls the first pair, not the final pair.",
        "reads_before_array": "`arr[i + 1]` at `i = 1` reads forward, not before the array.",
        "all_pairs_checked": "The pair at indexes 0 and 1 is never checked."
      },
      "mentalModelCorrection": "A safe start is not automatically a complete start; match the start index to the first valid pair.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "For `arr[i]` with `arr[i + 1]`, ask whether current index 0 is a valid pair start.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-057-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_off_by_one",
    "secondarySkillAtomIds": [
      "track_index_boundary",
      "recognize_adjacent_scan"
    ],
    "prompt": "Choose the skipped work.",
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
        "nodeId": "diagnose_off_by_one",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose a skipped first adjacent pair",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A loop compares `arr[i]` with `arr[i + 1]`, but starts at `i = 1`. What work is skipped?",
    "answerFeedback": "The adjacent pair at indexes 0 and 1 is skipped. Starting at 1 is correct for previous-neighbor reads, but too late for this next-neighbor scan.",
    "options": [
      {
        "id": "skips_zero_one",
        "text": "The adjacent pair at indexes 0 and 1 is skipped.",
        "isCorrect": true
      },
      {
        "id": "skips_last_pair",
        "text": "The last pair is skipped.",
        "isCorrect": false
      },
      {
        "id": "reads_before_array",
        "text": "The loop reads before the array.",
        "isCorrect": false
      },
      {
        "id": "all_pairs_checked",
        "text": "Every pair is still checked.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Both-side neighbor reads require an interior current index, and a length-2 array has no interior index.",
      "distractorExplanations": {
        "process_zero": "Index 0 has no previous neighbor, so `arr[i - 1]` is outside the valid range.",
        "process_one": "Index 1 has no next neighbor, so `arr[i + 1]` is outside the valid range.",
        "remove_guards": "Removing guards makes invalid neighbor reads more likely, not safer.",
        "sort_first": "Sorting does not create an interior current index."
      },
      "mentalModelCorrection": "For both-side reads, intersect all safe ranges before running the loop.",
      "mistakeTypes": [
        "edge_case_missed",
        "off_by_one"
      ],
      "nextAction": "Check whether any index satisfies both `i >= 1` and `i <= arr.length - 2`.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-058-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "secondarySkillAtomIds": [
      "trace_scan_index"
    ],
    "prompt": "Choose the safe behavior.",
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Handle too-short input for both-side neighbors",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A loop needs to read both `arr[i - 1]` and `arr[i + 1]`. What should happen for an array of length 2?",
    "answerFeedback": "There is no safe interior current index in a length-2 array, so the loop should not run.",
    "options": [
      {
        "id": "no_safe_index",
        "text": "There is no safe interior current index, so the loop should not run.",
        "isCorrect": true
      },
      {
        "id": "process_zero",
        "text": "Process index 0.",
        "isCorrect": false
      },
      {
        "id": "process_one",
        "text": "Process index 1.",
        "isCorrect": false
      },
      {
        "id": "remove_guards",
        "text": "Process both indexes with guards removed.",
        "isCorrect": false
      },
      {
        "id": "sort_first",
        "text": "Sort first.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The safe current-index range must satisfy every indexed expression used by the loop body.",
      "distractorExplanations": {
        "only_length": "Array length matters, but it is not enough without knowing whether the body reads `i - 1`, `i`, `i + 1`, or another offset.",
        "only_first_value": "The first value does not define which indexes the loop body reads.",
        "sorted_values": "Sortedness is unrelated to the safe index range unless the prompt also changes order constraints.",
        "duplicates_only": "Duplicate presence does not tell you which index offsets must be protected."
      },
      "mentalModelCorrection": "Choose bounds after listing all index expressions, then intersect their safe current-index ranges.",
      "mistakeTypes": [
        "off_by_one",
        "edge_case_missed"
      ],
      "nextAction": "Write down every indexed expression in the loop body before selecting start and stop conditions.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-059-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "secondarySkillAtomIds": [
      "diagnose_off_by_one"
    ],
    "prompt": "Choose what to inspect first.",
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
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "off_by_one",
        "role": "mistake_type"
      }
    ],
    "title": "List indexed expressions before bounds",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "Before choosing loop bounds for a scan, what should you inspect in the loop body?",
    "answerFeedback": "Inspect every indexed expression, such as `i - 1`, `i`, and `i + 1`, because the safe current-index range must satisfy all of them.",
    "options": [
      {
        "id": "all_indexed_expressions",
        "text": "Every indexed expression, such as `i - 1`, `i`, and `i + 1`.",
        "isCorrect": true
      },
      {
        "id": "only_length",
        "text": "Only the array length.",
        "isCorrect": false
      },
      {
        "id": "only_first_value",
        "text": "Only the first value.",
        "isCorrect": false
      },
      {
        "id": "sorted_values",
        "text": "Only whether values are sorted.",
        "isCorrect": false
      },
      {
        "id": "duplicates_only",
        "text": "Only whether duplicates exist.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];

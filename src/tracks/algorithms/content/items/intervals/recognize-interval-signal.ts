// Planning target: recognize starts and ends on a line or timeline and choose interval-specific reasoning for overlap, union, insertion, gaps, coverage, concurrency, or selection.
// It should distinguish intervals from arbitrary pairs, points, sliding windows, prefix sums, and generic scheduling.
// Target question count: 14.
// Prefer strategy and signal-recognition items; avoid detailed endpoint, merge, sweep, and complexity mechanics.
export const recognizeIntervalSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Each item is a range with start and end boundaries, and ordering reveals overlaps or gaps.",
      "distractorExplanations": {
        "frequency_map": "Counts do not preserve range boundaries.",
        "plain_stack": "A stack does not by itself order interval starts and ends.",
        "ignore_boundaries": "Ignoring start and end loses the overlap condition."
      },
      "mentalModelCorrection": "Intervals are about ordering boundaries, then comparing the active or previous range.",
      "mistakeTypes": ["wrong_approach", "edge_case_missed"],
      "nextAction": "Practice stating which boundary is sorted and what overlap comparison follows.",
      "result": "diagnostic"
    },
    "id": "alg-intervals-naming-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "reason_about_interval_overlap",
    "prompt": "A task gives meeting start and end times and asks whether any meetings overlap. Which reasoning signal matters?",
    "roadmapNodeId": "intervals",
    "staticMicroChecks": [
      {
        "correctAnswer": "ordered_boundaries",
        "feedback": "Interval overlap is exposed by ordering starts and comparing boundaries.",
        "id": "alg-intervals-naming-001-check",
        "mistakeTypes": ["wrong_approach", "edge_case_missed"],
        "options": [
          { "id": "ordered_boundaries", "text": "Order start/end boundaries and compare neighboring ranges." },
          { "id": "frequency_map", "text": "Count each time value without boundaries." },
          { "id": "plain_stack", "text": "Push every interval and pop arbitrarily." },
          { "id": "ignore_boundaries", "text": "Use only the number of intervals." }
        ],
        "prompt": "Choose the interval signal.",
        "status": "active",
        "testedSkillAtomIds": ["reason_about_interval_overlap"],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      { "axisId": "pattern_family", "nodeId": "intervals", "role": "primary" },
      { "axisId": "skill_atom", "nodeId": "reason_about_interval_overlap", "role": "primary" },
      { "axisId": "pattern_variant", "nodeId": "merge_overlaps", "role": "secondary" },
      { "axisId": "mistake_type", "nodeId": "edge_case_missed", "role": "mistake_type" }
    ],
    "title": "Name interval overlap",
    "trackId": "algorithms",
    "type": "approach_naming"
  }
];

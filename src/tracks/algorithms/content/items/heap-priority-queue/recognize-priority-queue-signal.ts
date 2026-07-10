// Planning target: recognize repeated smallest, largest, earliest, cheapest, or highest-priority candidate extraction; changing frontiers; and bounded best-k state.
// It should distinguish priority queues from full sorting, FIFO queues, stacks, linear scans, and one-time extreme selection.
// Target question count: 14.
// Prefer strategy and signal-recognition items; avoid comparator, top-k, stale-entry, and full-complexity mechanics.
export const recognizePriorityQueueSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The next operation repeatedly needs the current smallest, largest, or highest-priority item.",
      "distractorExplanations": {
        "full_resort": "Resorting after every update repeats too much work.",
        "single_scan": "A single scan cannot handle repeated priority updates.",
        "stack_order": "Last-in-first-out order is not the same as priority order."
      },
      "mentalModelCorrection": "A heap is useful when priority must be updated and queried repeatedly.",
      "mistakeTypes": ["data_structure_mismatch", "complexity_mismatch"],
      "nextAction": "Practice separating one-time sorting from repeated priority queries.",
      "result": "diagnostic"
    },
    "id": "alg-heap-priority-queue-naming-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_priority_queue_state",
    "prompt": "A scheduler repeatedly needs the currently shortest available job after each completion. Which signal points to the right data structure?",
    "roadmapNodeId": "heap_priority_queue",
    "staticMicroChecks": [
      {
        "correctAnswer": "repeated_priority_query",
        "feedback": "Repeated access to the current extreme or priority is the heap signal.",
        "id": "alg-heap-priority-queue-naming-001-check",
        "mistakeTypes": ["data_structure_mismatch", "complexity_mismatch"],
        "options": [
          { "id": "repeated_priority_query", "text": "Repeatedly query and update the current priority item." },
          { "id": "full_resort", "text": "Sort the entire collection after every update." },
          { "id": "single_scan", "text": "Scan once and never update state." },
          { "id": "stack_order", "text": "Use only the most recently added item." }
        ],
        "prompt": "Choose the heap signal.",
        "status": "active",
        "testedSkillAtomIds": ["choose_priority_queue_state"],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      { "axisId": "pattern_family", "nodeId": "heap_priority_queue", "role": "primary" },
      { "axisId": "skill_atom", "nodeId": "choose_priority_queue_state", "role": "primary" },
      { "axisId": "pattern_variant", "nodeId": "running_extreme", "role": "secondary" },
      { "axisId": "mistake_type", "nodeId": "data_structure_mismatch", "role": "mistake_type" }
    ],
    "title": "Name priority queue signal",
    "trackId": "algorithms",
    "type": "approach_naming"
  }
];

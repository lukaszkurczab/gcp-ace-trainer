// Planning target: this file should contain questions about recognizing graph-traversal structure:
// entities connected by relationships; states reachable through legal transitions; explicit or implicit graphs; reachability; components; and exhaustive source exploration.
// It should distinguish graph traversal from linear scans, tree-only recursion, dynamic programming, union-find, and weighted shortest-path algorithms.
// It should diagnose word-only graph recognition, missed implicit state graphs, premature BFS/DFS choice, nonexistent connectivity relations, and needless full traversal.
// Target question count: 14.
// Prefer single_choice, strategy_choice, solution_comparison, implicit-graph recognition, and mistake-review style items.
// Avoid detailed queue or stack mechanics, visited timing, grid boundaries, and full complexity calculations.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeGraphTraversalSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Entities are connected by edges, so traversal must represent neighbors and avoid revisiting nodes.",
      "distractorExplanations": {
        "sort_values": "Sorting values does not represent connectivity.",
        "ignore_visited": "Ignoring visited state risks repeated work or cycles.",
        "single_index": "A single array index does not describe graph neighbors."
      },
      "mentalModelCorrection": "Graph traversal starts with adjacency representation and visited state.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_trace_algorithm"
      ],
      "nextAction": "Practice stating the adjacency structure and visited rule before choosing BFS or DFS.",
      "result": "diagnostic"
    },
    "id": "alg-graph-traversal-naming-001-check",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "track_graph_visited_state",
    "prompt": "Choose the graph traversal signal.",
    "roadmapNodeId": "graph_traversal",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "graph_traversal",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "track_graph_visited_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "visited_state",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Name graph visited state",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task gives roads between cities and asks which cities are reachable from a start city. Which signal matters first?",
    "answerFeedback": "Reachability requires neighbor representation and visited state.",
    "options": [
      {
        "id": "adjacency_and_visited",
        "text": "Represent neighbors and track visited nodes.",
        "isCorrect": true
      },
      {
        "id": "sort_values",
        "text": "Sort city names alphabetically.",
        "isCorrect": false
      },
      {
        "id": "ignore_visited",
        "text": "Traverse without marking visited nodes.",
        "isCorrect": false
      },
      {
        "id": "single_index",
        "text": "Use only one numeric index as the state.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];

// Planning target: this file should contain questions about recognizing hierarchical parent-child traversal, recursive subtrees, all-node visits, depth/path state, and descendant aggregation.
// Distinguish tree traversal from array scans, graph traversal, BST pruning, heaps, and generic recursion.
// Target question count: 14.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeTreeTraversalSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The input is hierarchical, and the needed answer depends on carrying path or depth state through traversal.",
      "distractorExplanations": {
        "flat_scan": "A flat scan ignores parent-child structure.",
        "frequency_count": "Counting values alone does not preserve path or depth context.",
        "sort_nodes": "Sorting node values removes the traversal relationship."
      },
      "mentalModelCorrection": "Choose traversal order together with the state carried into each child.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_trace_algorithm"
      ],
      "nextAction": "Practice naming whether path, depth, or subtree state is carried.",
      "result": "diagnostic"
    },
    "id": "alg-tree-traversal-naming-001-check",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "carry_tree_traversal_state",
    "prompt": "Choose the tree-traversal signal.",
    "roadmapNodeId": "tree_traversal",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "tree_traversal",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "carry_tree_traversal_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "path_accumulation",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Name tree traversal state",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A binary-tree task asks for the sum along each root-to-leaf path. Which signal should guide the approach?",
    "answerFeedback": "Root-to-leaf work requires traversal while carrying path state.",
    "options": [
      {
        "id": "carry_path_state",
        "text": "Traverse children while carrying the current path state.",
        "isCorrect": true
      },
      {
        "id": "flat_scan",
        "text": "Treat nodes as an unordered flat list.",
        "isCorrect": false
      },
      {
        "id": "frequency_count",
        "text": "Count each value without path context.",
        "isCorrect": false
      },
      {
        "id": "sort_nodes",
        "text": "Sort node values before traversing.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];

import type { TrackDefinition, TrackId } from "./types";

export const CLOUD_CERTIFICATION_TRACK_ID: TrackId = "cloud-certification";
export const ALGORITHMS_TRACK_ID: TrackId = "algorithms";
export const DEFAULT_TRACK_ID = CLOUD_CERTIFICATION_TRACK_ID;

const cloudCertificationTrack: TrackDefinition = {
  accentColor: "#0369A1",
  accentMutedColor: "#E7F5FD",
  category: "cloud_certification",
  contentManifest: {
    itemCount: 360,
    source: "local_static",
    supportedItemTypes: ["single_choice_question", "multiple_choice_question"],
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
    version: "ace-foundation-320",
  },
  defaultSessionModeId: "cloud-practice",
  description:
    "Scenario-based cloud certification practice with domain review and exam simulation.",
  id: CLOUD_CERTIFICATION_TRACK_ID,
  legalNote:
    "Independent study content. Not affiliated with or endorsed by Google.",
  nextActionLabel: "Continue cloud practice",
  sessionModes: [
    {
      defaultQuestionCount: 10,
      description: "Focused domain practice with immediate feedback.",
      enabled: true,
      feedbackTiming: "immediate",
      id: "cloud-practice",
      order: 1,
      scoringType: "correctness",
      supportedItemTypes: ["single_choice_question", "multiple_choice_question"],
      title: "Practice",
      type: "practice",
    },
    {
      defaultQuestionCount: 50,
      description: "Timed assessment-style session with feedback after submit.",
      enabled: true,
      feedbackTiming: "session_summary_only",
      id: "cloud-exam-simulation",
      order: 2,
      scoringType: "correctness",
      supportedItemTypes: ["single_choice_question", "multiple_choice_question"],
      title: "Exam simulation",
      type: "exam_simulation",
    },
    {
      description: "Revisit missed and marked questions.",
      enabled: true,
      feedbackTiming: "immediate",
      id: "cloud-review",
      order: 3,
      scoringType: "correctness",
      supportedItemTypes: ["single_choice_question", "multiple_choice_question"],
      title: "Review",
      type: "review",
    },
  ],
  shortTitle: "Cloud",
  status: "active",
  subtitle: "Certification track",
  taxonomy: {
    primaryAxis: {
      id: "cloud-domain",
      label: "Domain",
      nodes: [
        { id: "setup_environment", label: "Setup environment", order: 1 },
        { id: "planning_implementation", label: "Planning and implementation", order: 2 },
        { id: "operations", label: "Operations", order: 3 },
        { id: "access_security", label: "Access and security", order: 4 },
      ],
      type: "exam_domain",
    },
    secondaryAxes: [
      {
        id: "cloud-topic",
        label: "Topic",
        nodes: [],
        type: "topic",
      },
    ],
  },
  title: "Cloud Certification",
};

const algorithmsTrack: TrackDefinition = {
  accentColor: "#7C3AED",
  accentMutedColor: "#F1ECFF",
  category: "algorithms",
  contentManifest: {
    itemCount: 0,
    source: "local_static",
    supportedItemTypes: [
      "pattern_identification",
      "strategy_choice",
      "complexity_analysis",
      "solution_comparison",
    ],
    trackId: ALGORITHMS_TRACK_ID,
    version: "algorithms-core-draft",
  },
  defaultSessionModeId: "algorithms-pattern-drill",
  description:
    "Pattern recognition, strategy choice, and complexity reasoning for algorithmic problem solving.",
  id: ALGORITHMS_TRACK_ID,
  legalNote:
    "Original training content. Not affiliated with LeetCode or any coding platform.",
  nextActionLabel: "Set up algorithm drills",
  sessionModes: [
    {
      description: "Recognize the likely pattern or strategy for a problem.",
      enabled: false,
      feedbackTiming: "immediate",
      id: "algorithms-pattern-drill",
      order: 1,
      scoringType: "strategy_quality",
      supportedItemTypes: ["pattern_identification", "strategy_choice"],
      title: "Pattern drill",
      type: "pattern_drill",
    },
    {
      description: "Compare approaches and reason about complexity.",
      enabled: false,
      feedbackTiming: "after_submit",
      id: "algorithms-strategy-practice",
      order: 2,
      scoringType: "mixed",
      supportedItemTypes: [
        "strategy_choice",
        "complexity_analysis",
        "solution_comparison",
      ],
      title: "Strategy practice",
      type: "strategy_practice",
    },
  ],
  shortTitle: "Algorithms",
  status: "draft",
  subtitle: "Problem-solving track",
  taxonomy: {
    primaryAxis: {
      id: "algorithm-pattern",
      label: "Pattern",
      nodes: [
        { id: "two_pointers", label: "Two pointers", order: 1 },
        { id: "sliding_window", label: "Sliding window", order: 2 },
        { id: "hash_map", label: "Hash map", order: 3 },
        { id: "binary_search", label: "Binary search", order: 4 },
        { id: "dfs_bfs", label: "DFS / BFS", order: 5 },
        { id: "dynamic_programming", label: "Dynamic programming", order: 6 },
      ],
      type: "algorithm_pattern",
    },
    secondaryAxes: [
      {
        id: "algorithm-difficulty",
        label: "Difficulty",
        nodes: [
          { id: "easy", label: "Easy", order: 1 },
          { id: "medium", label: "Medium", order: 2 },
          { id: "hard", label: "Hard", order: 3 },
        ],
        type: "difficulty",
      },
    ],
  },
  title: "Algorithm Patterns",
};

export const TRACK_DEFINITIONS = [
  cloudCertificationTrack,
  algorithmsTrack,
] as const satisfies readonly TrackDefinition[];

export function getTrackDefinitions(): readonly TrackDefinition[] {
  return TRACK_DEFINITIONS;
}

export function isTrackId(value: string): value is TrackId {
  return TRACK_DEFINITIONS.some((track) => track.id === value);
}

export function getTrackDefinition(trackId: TrackId): TrackDefinition {
  const track = TRACK_DEFINITIONS.find((item) => item.id === trackId);

  if (!track) {
    throw new Error(`Unknown track id: ${trackId}`);
  }

  return track;
}

export function getEnabledSessionModes(trackId: TrackId) {
  return getTrackDefinition(trackId).sessionModes.filter((mode) => mode.enabled);
}

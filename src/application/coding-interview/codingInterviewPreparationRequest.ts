export type AlgorithmReviewSource = "due_queue" | "session_misses";

/** Route-owned learner scope passed to the canonical ProductModeConfig runtime. */
export type AlgorithmSelectionScope = Readonly<{
  mentalUnitId?: string;
  roadmapNodeId?: string;
  recognitionSetId?: string;
  contrastRoadmapNodeId?: string;
  interleavedScopeId?: string;
  simulationProfileId?: string;
}>;

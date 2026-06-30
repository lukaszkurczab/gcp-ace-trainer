export type TrackId = "cloud-certification" | "algorithms";

export type TrackCategory =
  | "cloud_certification"
  | "algorithms"
  | "system_design"
  | "language"
  | "other";

export type TrackStatus = "active" | "draft" | "archived";

export type SessionModeType =
  | "practice"
  | "exam_simulation"
  | "review"
  | "pattern_drill"
  | "strategy_practice"
  | "timed_challenge"
  | "weak_areas";

export type FeedbackTiming =
  | "immediate"
  | "after_submit"
  | "session_summary_only";

export type ScoringType =
  | "correctness"
  | "partial_credit"
  | "self_assessment"
  | "mixed";

export type TrainingItemType =
  | "single_choice_question"
  | "multiple_choice_question"
  | "approach_primer"
  | "approach_naming"
  | "worked_example"
  | "trace_drill"
  | "trace_next_step"
  | "strategy_choice"
  | "complexity_check"
  | "edge_case_drill"
  | "subgoal_identification"
  | "subgoal_ordering"
  | "pseudocode_parsons"
  | "pseudocode_ordering"
  | "faded_solution"
  | "fill_missing_step"
  | "independent_attempt"
  | "interview_simulation_problem"
  | "full_code_editor"
  | "pattern_identification"
  | "complexity_analysis"
  | "solution_comparison"
  | "mistake_review"
  | "freeform_reflection";

export type TaxonomyAxisType =
  | "exam_domain"
  | "topic"
  | "concept"
  | "algorithm_pattern"
  | "data_structure"
  | "difficulty"
  | "mistake_type";

export type TaxonomyNode = {
  id: string;
  label: string;
  description?: string;
  order?: number;
  parentId?: string;
  weight?: number;
};

export type TaxonomyAxis = {
  id: string;
  label: string;
  nodes: TaxonomyNode[];
  type: TaxonomyAxisType;
};

export type TrackTaxonomy = {
  primaryAxis: TaxonomyAxis;
  secondaryAxes?: TaxonomyAxis[];
};

export type ContentManifest = {
  itemCount: number;
  source: "local_static" | "remote_static" | "manual_import";
  supportedItemTypes: TrainingItemType[];
  trackId: TrackId;
  version: string;
};

export type SessionModeDefinition = {
  defaultQuestionCount?: number;
  description?: string;
  enabled: boolean;
  feedbackTiming: FeedbackTiming;
  id: string;
  order: number;
  scoringType: ScoringType;
  supportedItemTypes: TrainingItemType[];
  title: string;
  type: SessionModeType;
};

export type TrackDefinition = {
  accentColor: string;
  accentMutedColor: string;
  category: TrackCategory;
  contentManifest: ContentManifest;
  defaultSessionModeId: string;
  description: string;
  id: TrackId;
  legalNote?: string;
  nextActionLabel: string;
  sessionModes: SessionModeDefinition[];
  shortTitle: string;
  status: TrackStatus;
  subtitle: string;
  taxonomy: TrackTaxonomy;
  title: string;
};

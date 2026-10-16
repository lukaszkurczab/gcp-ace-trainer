import type { TrackId } from "../../domain";
import type { CanonicalPracticeModeId } from "../practice/practiceModeContract";
export type ProgressPracticeRequest = Readonly<{ mode: CanonicalPracticeModeId; reviewSource?: "due_queue" | "manual_request"; source: "modeShortcut"; topicId: string; trackId: TrackId }>;
type MetricTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
type LearningTone = "danger" | "warning" | "info" | "success" | "muted";

export type ProgressTabMetric = {
  label: string;
  tone: MetricTone;
  value: number;
};


export type ProgressTabPerformanceScore = {
  correct: number;
  description?: string;
  detail?: string;
  id: string;
  label: string;
  percent: number;
  total: number;
};

export type AlgorithmProgressEvidenceState = "no_evidence" | "building" | "established";

export type AlgorithmProgressEvidenceSummary = {
  buildingCopy?: string;
  currentFocus: {
    detail: string;
    label: "No evidence yet" | "Building evidence" | "Recent effectiveness";
    percent?: number;
    responseCount: number;
    state: AlgorithmProgressEvidenceState;
  };
  state: AlgorithmProgressEvidenceState;
};

export type AlgorithmProgressEffectivenessTrend = {
  available: boolean;
  copy: string;
  points: readonly number[];
  responseCount: number;
};

export type AlgorithmProgressTrackNode = {
  detail: string;
  effectivenessPercent?: number;
  id: string;
  isFocus: boolean;
  responseCount: number;
  state: AlgorithmProgressEvidenceState;
  title: string;
};

export type LearningPriorityModel = {
  detail: string;
  label: string;
  primaryAction: ProgressAction;
  primaryActionLabel: string;
  primaryActionMode: CanonicalPracticeModeId;
  secondaryAction?: ProgressAction;
  secondaryActionLabel?: string;
  secondaryActionMode?: CanonicalPracticeModeId;
  title: string;
  tone: LearningTone;
};

export type CurrentFocusModel = {
  explanation: string;
  nodeId: string;
  practicedLabel: string;
  progressPercent: number;
  showProgress: boolean;
  statusLabel: string;
  statusTone: LearningTone;
  title: string;
};

export type AvailableTopicModel = {
  detail: string;
  nodeId: string;
  title: string;
};

export type RoadmapSummaryNodeModel = {
  id: string;
  label: string;
  progressPercent: number;
  showProgress: boolean;
  title: string;
  tone: LearningTone;
};

export type RoadmapSummaryModel = {
  allNodes: readonly RoadmapSummaryNodeModel[];
  nodes: readonly RoadmapSummaryNodeModel[];
  showAllActionLabel: string;
};

export type ProgressDiagnosticFact = {
  label: string;
  value: number | string;
};

export type ProgressDiagnosticsModel = {
  collapsedByDefault: true;
  hideActionLabel: string;
  mistakePatterns: readonly string[] | null;
  outcomeSummary: readonly ProgressDiagnosticFact[];
  roadmapFacts: readonly ProgressDiagnosticFact[];
  showActionLabel: string;
  subtitle: string;
  title: string;
};

export type AlgorithmsProgressScreenModel = {
  currentFocus: CurrentFocusModel;
  diagnostics: ProgressDiagnosticsModel;
  evidenceSummary: AlgorithmProgressEvidenceSummary;
  effectivenessTrend: AlgorithmProgressEffectivenessTrend;
  nextTopic: AvailableTopicModel | null;
  priority: LearningPriorityModel;
  roadmapSummary: RoadmapSummaryModel;
  trackNodes: readonly AlgorithmProgressTrackNode[];
};

export type ProgressEvidenceModel = {
  identity: Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }>;
  capturedAt: string;
  hasRecordedActivity: boolean;
  emptyState: Readonly<{ title: string; description: string; reviewAction: boolean }>;
  algorithmsProgress?: AlgorithmsProgressScreenModel;
  hasData: boolean;
  metrics: ProgressTabMetric[];
  performanceScores: ProgressTabPerformanceScore[];
  performanceSectionTitle: "Performance by domain" | "Performance areas" | "Roadmap nodes";
  reviewAction?: ProgressAction;
  reviewActionEnabled: boolean;
  reviewActionLabel: string;
  reviewQueueCount: number;
  reviewQueueCopy: string;
  reviewQueueCopyParams?: Readonly<{ count?: number; dueCount?: number; manualCount?: number }>;
  warning?: string;
};

export type ProgressAction =
  | {
      kind: "canonicalReviewQueue";
    }
  | {
      kind: "practiceSession";
      params: ProgressPracticeRequest;
    };


import {
  CODING_INTERVIEW_TRACK_ID,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  type TrackDisplay,
} from "../../../domain";
import { contentPackagePinsEqual, type ContentPackagePin, type ReviewQueueEntry, type TrainingAttempt } from "../../../domain";
import {
  ALGORITHM_MODE_IDS,
  buildAlgorithmProgressFacts,
  buildAlgorithmWeakAreaRecommendation,
  type AlgorithmModeId,
  type AlgorithmRoadmapNodeProgressStatus,
} from "../../../tracks/coding-interview";
import type { CloudCertificationProgressViewModel } from "../../../tracks";
import type { CertificationDomain, CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../../tracks/certification";
import { getDomainLabel } from "../../../utils";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import type { AlgorithmQuestion } from "../../../tracks/coding-interview/algorithmQuestionTypes";
import {
  buildPracticeSessionConfig,
  type PracticeSessionMode,
  type PracticeSessionRouteParams,
} from "../../practice/sessionConfig";
import type { ActivitySessionRecord } from "../../../application/activityReadModels";
import { buildActivityModel, type ActivityItem } from "./activityModel";

type MetricTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
type LearningTone = "danger" | "warning" | "info" | "success" | "muted";

export type ProgressTabMetric = {
  label: string;
  tone: MetricTone;
  value: number;
};

export type ProgressTabActivitySummary = {
  detail: string;
  label: string;
  value: number;
};

export type ProgressTabActivityItem = ActivityItem;

export type ProgressTabPerformanceScore = {
  correct: number;
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
  primaryActionMode: PracticeSessionMode;
  secondaryAction?: ProgressAction;
  secondaryActionLabel?: string;
  secondaryActionMode?: PracticeSessionMode;
  title: string;
  tone: LearningTone;
};

export type CurrentFocusModel = {
  explanation: string;
  nodeId: string;
  practicedLabel: string;
  progressPercent: number;
  showProgress: boolean;
  skillEvidenceLabel: string;
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
  mistakePatterns: readonly string[];
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

export type ProgressTabModel = {
  activity: readonly ProgressTabActivityItem[];
  activitySummary: ProgressTabActivitySummary;
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
  warning?: string;
};

export type ProgressAction =
  | {
      kind: "canonicalReviewQueue";
    }
  | {
      kind: "practiceSession";
      params: PracticeSessionRouteParams;
    };

export type BuildProgressTabModelInput = {
  activeTrackId: TrackDisplay["id"];
  analytics: AnalyticsData;
  attempts: readonly CertificationExamSummaryViewModel[];
  cloudProgress?: CloudCertificationProgressViewModel | null;
  now?: string;
  activityRecords?: readonly ActivitySessionRecord[];
  practiceHistory: readonly CertificationPracticeAnswerViewModel[];
  reviewQueueItems?: readonly ReviewQueueEntry[];
  trainingAttempts?: readonly TrainingAttempt[];
};

export function buildProgressTabModel(input: BuildProgressTabModelInput): ProgressTabModel {
  if (input.activeTrackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID && input.cloudProgress) {
    return buildCloudProgressTabModel(input.cloudProgress, input.activityRecords ?? [], input.now ?? new Date().toISOString());
  }

  if (input.activeTrackId === CODING_INTERVIEW_TRACK_ID) {
    return buildAlgorithmsProgressTabModel(
      input.trainingAttempts ?? [],
      input.reviewQueueItems ?? [],
      input.activityRecords ?? [],
      input.now ?? new Date().toISOString(),
    );
  }

  return buildInstalledPackageProgressTabModel(
    input.activeTrackId,
    input.trainingAttempts ?? [],
    input.reviewQueueItems ?? [],
    input.activityRecords ?? [],
    input.now ?? new Date().toISOString(),
  );
}

type PackageProgressItem = Readonly<{
  domain?: unknown;
  id: string;
  taxonomy?: Readonly<{ roadmapNodeId?: unknown }>;
}>;

function buildInstalledPackageProgressTabModel(
  trackId: TrackDisplay["id"],
  trainingAttempts: readonly TrainingAttempt[],
  reviewQueueItems: readonly ReviewQueueEntry[],
  activityRecords: readonly ActivitySessionRecord[],
  now: string,
): ProgressTabModel {
  const packageResolution = contentPackageRuntimeOwner.getPreparedDiscovery(trackId);
  const packageItems = packageResolution.profile.items as readonly PackageProgressItem[];
  const packageItemIds = new Set(packageItems.map((item) => item.id));
  const currentAttempts = trainingAttempts.filter((attempt) =>
    attempt.trackId === trackId &&
    attempt.item.trackId === trackId &&
    attempt.item.contentVersion === packageResolution.package.contentVersion &&
    contentPackagePinsEqual(attempt.item.packagePin, packageResolution.package.packagePin) &&
    packageItemIds.has(attempt.item.itemId),
  );
  const currentReviews = reviewQueueItems.filter((entry) =>
    entry.trackId === trackId &&
    entry.sourceItem.trackId === trackId &&
    entry.sourceItem.contentVersion === packageResolution.package.contentVersion &&
    contentPackagePinsEqual(entry.sourceItem.packagePin, packageResolution.package.packagePin) &&
    packageItemIds.has(entry.sourceItem.itemId),
  );
  const dueReviewCount = currentReviews.filter((entry) => entry.dueAt <= now).length;
  const scores = new Map<string, { correct: number; earned: number; max: number; total: number }>();

  for (const attempt of currentAttempts) {
    const item = packageItems.find((candidate) => candidate.id === attempt.item.itemId);
    const nodeId = typeof item?.domain === "string"
      ? item.domain
      : typeof item?.taxonomy?.roadmapNodeId === "string"
        ? item.taxonomy.roadmapNodeId
        : packageResolution.profile.freeNodeId;
    const score = scores.get(nodeId) ?? { correct: 0, earned: 0, max: 0, total: 0 };
    scores.set(nodeId, {
      correct: score.correct + (attempt.result.kind === "correct" ? 1 : 0),
      earned: score.earned + attempt.result.earnedPoints,
      max: score.max + attempt.result.maxPoints,
      total: score.total + 1,
    });
  }

  const freeNodeLabel = getDomainLabel(packageResolution.profile.freeNodeId as CertificationDomain);
  return {
    activity: buildActivityItems(activityRecords, trackId, now),
    activitySummary: {
      detail: currentAttempts.length > 0
        ? `Current Free node: ${freeNodeLabel}.`
        : `Start the ${freeNodeLabel} Free node to record local practice.`,
      label: "Answered",
      value: currentAttempts.length,
    },
    hasData: currentAttempts.length > 0,
    metrics: [
      { label: "Answered", tone: "info", value: currentAttempts.length },
      { label: "Due review", tone: dueReviewCount > 0 ? "warning" : "neutral", value: dueReviewCount },
      { label: "Saved review", tone: "primary", value: currentReviews.length },
    ],
    performanceScores: [...scores.entries()].map(([nodeId, score]) => ({
      correct: score.correct,
      detail: `${score.earned}/${score.max} points`,
      id: nodeId,
      label: getDomainLabel(nodeId as CertificationDomain),
      percent: score.max > 0 ? Math.round((score.earned / score.max) * 100) : 0,
      total: score.total,
    })),
    performanceSectionTitle: "Performance areas",
    reviewAction: dueReviewCount > 0 ? { kind: "canonicalReviewQueue" } : undefined,
    reviewActionEnabled: dueReviewCount > 0,
    reviewActionLabel: "Open review queue",
    reviewQueueCount: dueReviewCount,
    reviewQueueCopy: formatCanonicalReviewQueueCopy(dueReviewCount, currentReviews.filter((entry) => entry.reasons.includes("repeated_mistake")).length, currentReviews.length),
  };
}

function buildCloudProgressTabModel(
  progress: CloudCertificationProgressViewModel,
  activityRecords: readonly ActivitySessionRecord[],
  now: string,
): ProgressTabModel {
  return {
    activity: buildActivityItems(activityRecords, GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, now),
    activitySummary: {
      detail:
        progress.totalAttempts > 0
          ? `${progress.practiceAttemptCount} practice answers and ${progress.examAttemptCount} exam answers recorded.`
          : "Practice activity appears after local sessions are completed.",
      label: "Local attempts",
      value: progress.totalAttempts,
    },
    hasData: progress.totalAttempts > 0,
    metrics: [
      {
        label: "Total attempts",
        tone: "info",
        value: progress.totalAttempts,
      },
      {
        label: "Practice answers",
        tone: "primary",
        value: progress.practiceAttemptCount,
      },
      {
        label: "Exam answers",
        tone: "neutral",
        value: progress.examAttemptCount,
      },
    ],
    performanceScores: progress.taxonomyPerformance
      .filter((score) => score.axisId === "cloud-domain" && score.totalAttempts > 0)
      .map((score) => ({
        correct: score.correctCount,
        id: score.nodeId,
        label: getCloudDomainLabel(score.nodeId),
        percent: score.percent,
        total: score.totalAttempts,
      })),
    performanceSectionTitle: "Performance by domain",
    reviewAction: progress.dueReviewCount > 0 ? { kind: "canonicalReviewQueue" } : undefined,
    reviewActionEnabled: progress.dueReviewCount > 0,
    reviewActionLabel: "Open review queue",
    reviewQueueCount: progress.dueReviewCount,
    reviewQueueCopy: formatCanonicalReviewQueueCopy(
      progress.dueReviewCount,
      progress.highPriorityReviewCount,
      progress.scheduledReviewCount,
    ),
    warning: progress.degraded ? "Some local progress data may be incomplete." : undefined,
  };
}

function buildAlgorithmsProgressTabModel(
  trainingAttempts: readonly TrainingAttempt[],
  reviewQueueItems: readonly ReviewQueueEntry[],
  activityRecords: readonly ActivitySessionRecord[],
  now: string,
): ProgressTabModel {
  const packageResolution = contentPackageRuntimeOwner.getPreparedDiscovery(CODING_INTERVIEW_TRACK_ID);
  const packageItems = packageResolution.profile.items as readonly AlgorithmQuestion[];
  const facts = buildAlgorithmProgressFacts({
    attempts: trainingAttempts,
    content: {
      contentVersion: packageResolution.package.contentVersion,
      items: packageItems,
      packagePin: packageResolution.package.packagePin,
    },
    now,
    reviewQueueItems,
  });
  const algorithmsReviewItems = reviewQueueItems.filter((item) =>
    item.trackId === CODING_INTERVIEW_TRACK_ID &&
    item.sourceItem.trackId === CODING_INTERVIEW_TRACK_ID &&
    item.sourceItem.contentVersion === facts.contentVersion &&
    contentPackagePinsEqual(item.sourceItem.packagePin, packageResolution.package.packagePin),
  );
  const dueReviewItems = algorithmsReviewItems.filter((item) => item.dueAt <= now);
  const dueReviewCount = dueReviewItems.length;
  const currentAttempts = trainingAttempts.filter((attempt) =>
    attempt.trackId === CODING_INTERVIEW_TRACK_ID &&
    attempt.item.trackId === CODING_INTERVIEW_TRACK_ID &&
    attempt.item.contentVersion === packageResolution.package.contentVersion &&
    contentPackagePinsEqual(attempt.item.packagePin, packageResolution.package.packagePin) &&
    packageItems.some((item) => item.id === attempt.item.itemId),
  );
  const algorithmsProgress = buildAlgorithmsProgressScreenModel({
    dueReviewItems,
    facts,
    packageContentVersion: packageResolution.package.contentVersion,
    packageItems,
    packagePin: packageResolution.package.packagePin,
    trainingAttempts: currentAttempts,
  });

  return {
    activity: buildActivityItems(activityRecords, CODING_INTERVIEW_TRACK_ID, now),
    activitySummary: {
      detail: `Current roadmap node: ${facts.activeRoadmapNode.label}.`,
      label: "Items practiced",
      value: facts.itemsCompleted,
    },
    algorithmsProgress,
    hasData: facts.itemsCompleted > 0,
    metrics: [],
    performanceScores: [],
    performanceSectionTitle: "Roadmap nodes",
    reviewAction: dueReviewCount > 0
      ? {
          kind: "practiceSession",
          params: buildPracticeSessionConfig({
            mode: ALGORITHM_MODE_IDS.weakAreaReview,
            reviewSource: "due_queue",
            source: "modeShortcut",
            topicId: facts.activeRoadmapNode.id,
            trackId: CODING_INTERVIEW_TRACK_ID,
          }),
        }
      : undefined,
    reviewActionEnabled: dueReviewCount > 0,
    reviewActionLabel: "Review weak areas",
    reviewQueueCount: dueReviewCount,
    reviewQueueCopy: formatAlgorithmsReviewQueueCopy(dueReviewCount, algorithmsReviewItems.length),
  };
}

function buildActivityItems(
  records: readonly ActivitySessionRecord[],
  trackId: TrackDisplay["id"],
  now: string,
): readonly ProgressTabActivityItem[] {
  return buildActivityModel(records, trackId, new Date(now)).items.slice(0, 12);
}

type AlgorithmsRemediationState = {
  attentionNodeId?: string;
  attentionNodeLabel?: string;
  criticalRemediationCount: number;
  dueNodeLabels: readonly string[];
  remediationCount: number;
  remediationNodeLabels: readonly string[];
};

function getAlgorithmsRemediationState(input: {
  dueReviewItems: readonly ReviewQueueEntry[];
  nodeProgress: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"];
}): AlgorithmsRemediationState {
  const remediationItems = input.dueReviewItems.filter(
    (item) => item.persistent,
  );
  const dueNodes = input.nodeProgress.filter((node) => node.dueReviewCount > 0);
  const remediationNodes = input.nodeProgress.filter((node) => node.remediationDueCount > 0);
  const criticalRemediationCount = remediationItems.filter(
    (item) =>
      item.reasons.includes("repeated_mistake"),
  ).length;
  const attentionNode = criticalRemediationCount > 0
    ? input.nodeProgress.find((node) => node.criticalRemediationDueCount > 0)
    : input.nodeProgress.find((node) => node.remediationDueCount > 0) ??
      input.nodeProgress.find((node) => node.dueReviewCount > 0);

  return {
    attentionNodeId: attentionNode?.nodeId,
    attentionNodeLabel: attentionNode?.label,
    criticalRemediationCount,
    dueNodeLabels: dueNodes.map((node) => node.label),
    remediationCount: remediationItems.length,
    remediationNodeLabels: remediationNodes.map((node) => node.label),
  };
}

function buildAlgorithmsProgressScreenModel(input: {
  dueReviewItems: readonly ReviewQueueEntry[];
  facts: ReturnType<typeof buildAlgorithmProgressFacts>;
  packageContentVersion: string;
  packageItems: readonly AlgorithmQuestion[];
  packagePin: ContentPackagePin;
  trainingAttempts: readonly TrainingAttempt[];
}): AlgorithmsProgressScreenModel {
  const activeIndex = input.facts.nodeProgress.findIndex(
    (node) => node.nodeId === input.facts.activeRoadmapNode.id,
  );
  const activeNode = input.facts.nodeProgress[activeIndex] ?? input.facts.nodeProgress[0];

  if (!activeNode) {
    throw new Error("No Algorithms roadmap progress is available.");
  }

  const focusNode = activeNode;
  const focusIndex = input.facts.nodeProgress.indexOf(focusNode);
  const nextNode = input.facts.nodeProgress[focusIndex + 1];
  const remediationState = getAlgorithmsRemediationState({
    dueReviewItems: input.dueReviewItems,
    nodeProgress: input.facts.nodeProgress,
  });
  const weakRecommendation = buildAlgorithmWeakAreaRecommendation(
    input.trainingAttempts,
    input.packageItems,
    input.packageContentVersion,
    input.packagePin,
    undefined,
    focusNode.nodeId,
  );
  const focusStatus = getCurrentFocusStatus(focusNode);
  return {
    priority: buildLearningPriority({
      dueReviewItems: input.dueReviewItems,
      focusNode,
      nextNode,
      remediationState,
    }),
    currentFocus: {
      explanation: buildFocusExplanation(focusNode),
      nodeId: focusNode.nodeId,
      practicedLabel: focusNode.uniquePracticedItemCount === 0
        ? "No attempts"
        : `${focusNode.uniquePracticedItemCount} of ${focusNode.itemCount}`,
      progressPercent: focusNode.itemCoveragePercent,
      showProgress: focusNode.uniquePracticedItemCount > 0,
      skillEvidenceLabel: focusNode.uniquePracticedItemCount === 0
        ? "No attempts"
        : `${focusNode.sampledCoreSkillAtomCount} of ${focusNode.coreSkillAtomCount}`,
      statusLabel: focusStatus.label,
      statusTone: focusStatus.tone,
      title: focusNode.label,
    },
    nextTopic: nextNode
      ? {
          detail: "All roadmap topics are available. Choose this topic whenever it fits your practice goal.",
          nodeId: nextNode.nodeId,
          title: nextNode.label,
        }
      : null,
    roadmapSummary: {
      allNodes: buildRoadmapNodes(input.facts.nodeProgress, focusIndex),
      nodes: buildRoadmapSummary(input.facts.nodeProgress, focusIndex),
      showAllActionLabel: "View all roadmap nodes",
    },
    ...buildAlgorithmEvidenceModel({
      facts: input.facts,
      focusNode,
      packageItems: input.packageItems,
      trainingAttempts: input.trainingAttempts,
    }),
    diagnostics: {
      collapsedByDefault: true,
      hideActionLabel: "Hide details",
      mistakePatterns: weakRecommendation.selectedMistakeTypes.map(formatAlgorithmSignalLabel),
      outcomeSummary: [
        { label: "Correct", value: input.facts.correctCount },
        { label: "Partial", value: input.facts.partialCount },
        { label: "Incorrect", value: input.facts.incorrectCount },
      ],
      roadmapFacts: [
        { label: "Nodes started", value: input.facts.roadmapNodesStarted },
        { label: "Items practiced", value: input.facts.itemsCompleted },
      ],
      showActionLabel: "Show details",
      subtitle: "Evidence behind this priority.",
      title: "Why this recommendation?",
    },
  };
}

const ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW = 20;
const ALGORITHM_NODE_EFFECTIVENESS_MIN_RESPONSES = 10;
const ALGORITHM_TREND_MIN_RESPONSES = 20;
const ALGORITHM_TREND_WINDOW = 40;
const ALGORITHM_TREND_POINT_COUNT = 4;

function buildAlgorithmEvidenceModel(input: {
  facts: ReturnType<typeof buildAlgorithmProgressFacts>;
  focusNode: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number];
  packageItems: readonly AlgorithmQuestion[];
  trainingAttempts: readonly TrainingAttempt[];
}): Pick<AlgorithmsProgressScreenModel, "effectivenessTrend" | "evidenceSummary" | "trackNodes"> {
  const attemptsByNode = groupScoredAlgorithmAttemptsByNode(input.trainingAttempts, input.packageItems);
  const focusAttempts = attemptsByNode.get(input.focusNode.nodeId) ?? [];
  const focusWindow = takeLatestAttempts(focusAttempts, ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW);
  const focusState = getEvidenceState(focusAttempts.length, ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW);
  const focusPercent = focusState === "established" ? calculateEffectiveness(focusWindow) : undefined;
  const scoredAttempts = sortAttemptsChronologically([...attemptsByNode.values()].flat());
  const trendWindow = takeLatestAttempts(scoredAttempts, ALGORITHM_TREND_WINDOW);
  const trendAvailable = scoredAttempts.length >= ALGORITHM_TREND_MIN_RESPONSES;

  return {
    evidenceSummary: {
      ...(focusState === "building"
        ? { buildingCopy: "More practice is needed before recurring patterns can be identified." }
        : {}),
      currentFocus: {
        detail: focusState === "established"
          ? `Last ${focusWindow.length} responses`
          : focusState === "building"
            ? `${focusAttempts.length} scored responses`
            : "No evidence yet",
        label: focusState === "established"
          ? "Recent effectiveness"
          : focusState === "building"
            ? "Building evidence"
            : "No evidence yet",
        ...(focusPercent === undefined ? {} : { percent: focusPercent }),
        responseCount: focusState === "established" ? focusWindow.length : focusAttempts.length,
        state: focusState,
      },
      state: focusState,
    },
    effectivenessTrend: {
      available: trendAvailable,
      copy: trendAvailable
        ? `Last ${trendWindow.length} scored responses`
        : "More scored responses are needed before a trend can be shown.",
      points: trendAvailable ? buildEffectivenessTrendPoints(trendWindow) : [],
      responseCount: trendAvailable ? trendWindow.length : scoredAttempts.length,
    },
    trackNodes: input.facts.nodeProgress.map((node) => {
      const nodeAttempts = attemptsByNode.get(node.nodeId) ?? [];
      const nodeState = getEvidenceState(nodeAttempts.length, ALGORITHM_NODE_EFFECTIVENESS_MIN_RESPONSES);
      const nodeWindow = takeLatestAttempts(nodeAttempts, ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW);
      const effectivenessPercent = nodeState === "established" ? calculateEffectiveness(nodeWindow) : undefined;
      return {
        detail: formatTrackNodeEvidence(nodeState, nodeAttempts.length, effectivenessPercent, nodeWindow.length),
        ...(effectivenessPercent === undefined ? {} : { effectivenessPercent }),
        id: node.nodeId,
        isFocus: node.nodeId === input.focusNode.nodeId,
        responseCount: nodeAttempts.length,
        state: nodeState,
        title: node.label,
      };
    }),
  };
}

function groupScoredAlgorithmAttemptsByNode(
  attempts: readonly TrainingAttempt[],
  packageItems: readonly AlgorithmQuestion[],
): Map<string, TrainingAttempt[]> {
  const itemById = new Map(packageItems.map((item) => [item.id, item]));
  const attemptsByNode = new Map<string, TrainingAttempt[]>();

  for (const attempt of sortAttemptsChronologically(attempts)) {
    if (attempt.result.maxPoints <= 0) continue;
    const nodeId = itemById.get(attempt.item.itemId)?.taxonomy.roadmapNodeId;
    if (!nodeId) continue;
    const nodeAttempts = attemptsByNode.get(nodeId) ?? [];
    nodeAttempts.push(attempt);
    attemptsByNode.set(nodeId, nodeAttempts);
  }

  return attemptsByNode;
}

function sortAttemptsChronologically(attempts: readonly TrainingAttempt[]): TrainingAttempt[] {
  return [...attempts].sort((left, right) =>
    left.answeredAt.localeCompare(right.answeredAt) || left.id.localeCompare(right.id),
  );
}

function takeLatestAttempts(attempts: readonly TrainingAttempt[], count: number): TrainingAttempt[] {
  return sortAttemptsChronologically(attempts).slice(-count);
}

function getEvidenceState(
  responseCount: number,
  establishedResponseCount: number,
): AlgorithmProgressEvidenceState {
  if (responseCount === 0) return "no_evidence";
  return responseCount >= establishedResponseCount ? "established" : "building";
}

function calculateEffectiveness(attempts: readonly TrainingAttempt[]): number | undefined {
  const maxPoints = attempts.reduce((total, attempt) => total + attempt.result.maxPoints, 0);
  if (maxPoints <= 0) return undefined;
  const earnedPoints = attempts.reduce((total, attempt) => total + attempt.result.earnedPoints, 0);
  return Math.round((earnedPoints / maxPoints) * 100);
}

function buildEffectivenessTrendPoints(attempts: readonly TrainingAttempt[]): number[] {
  return Array.from({ length: ALGORITHM_TREND_POINT_COUNT }, (_, index) => {
    const start = Math.floor((index * attempts.length) / ALGORITHM_TREND_POINT_COUNT);
    const end = Math.floor(((index + 1) * attempts.length) / ALGORITHM_TREND_POINT_COUNT);
    return calculateEffectiveness(attempts.slice(start, end)) ?? 0;
  });
}

function formatTrackNodeEvidence(
  state: AlgorithmProgressEvidenceState,
  responseCount: number,
  effectivenessPercent: number | undefined,
  windowCount: number,
): string {
  if (state === "no_evidence") return "No evidence yet";
  if (state === "building") return `Building evidence · ${responseCount} responses`;
  return `${effectivenessPercent ?? 0}% · ${windowCount === ALGORITHM_FOCUS_EFFECTIVENESS_WINDOW ? `Last ${windowCount} responses` : `${windowCount} responses`}`;
}

function buildLearningPriority(input: {
  dueReviewItems: readonly ReviewQueueEntry[];
  focusNode: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number];
  nextNode?: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number];
  remediationState: AlgorithmsRemediationState;
}): LearningPriorityModel {
  if (input.remediationState.remediationCount > 0) {
    const remediationCount = input.remediationState.remediationCount;
    const remediationNodeId = input.remediationState.attentionNodeId ?? input.focusNode.nodeId;
    const remediationNodeLabel = input.remediationState.attentionNodeLabel ?? input.focusNode.label;
    const spansMultipleTopics = input.remediationState.remediationNodeLabels.length > 1;
    return {
      detail: spansMultipleTopics
        ? `${remediationCount} due ${remediationCount === 1 ? "review item comes" : "review items come"} from earlier practice across multiple topics. Review is recommended; every topic remains available.`
        : `Recent ${remediationNodeLabel} attempts created ${remediationCount} due ${remediationCount === 1 ? "review item" : "review items"}. Review is recommended; every topic remains available.`,
      label: input.remediationState.criticalRemediationCount > 0 ? "Repeated mistake" : "Review due",
      primaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.weakAreaReview, remediationNodeId, "due_queue"),
      primaryActionLabel: "Review due items",
      primaryActionMode: ALGORITHM_MODE_IDS.weakAreaReview,
      secondaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.focusNode.nodeId),
      secondaryActionLabel: "Continue practice",
      secondaryActionMode: ALGORITHM_MODE_IDS.guidedPractice,
      title: spansMultipleTopics ? "Review due items" : `Review ${remediationNodeLabel}`,
      tone: input.remediationState.criticalRemediationCount > 0 ? "danger" : "warning",
    };
  }

  if (input.dueReviewItems.length > 0) {
    const reviewNodeId = input.remediationState.attentionNodeId ?? input.focusNode.nodeId;
    const reviewNodeLabel = input.remediationState.attentionNodeLabel ?? input.focusNode.label;
    const spansMultipleTopics = input.remediationState.dueNodeLabels.length > 1;
    return {
      detail: spansMultipleTopics
        ? `${input.dueReviewItems.length} review items are due from earlier practice across multiple topics. Review is recommended; every topic remains available.`
        : `${input.dueReviewItems.length} ${input.dueReviewItems.length === 1 ? "item is" : "items are"} due from earlier ${reviewNodeLabel} practice. Review is recommended; every topic remains available.`,
      label: "Review due",
      primaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.weakAreaReview, reviewNodeId, "due_queue"),
      primaryActionLabel: "Review due items",
      primaryActionMode: ALGORITHM_MODE_IDS.weakAreaReview,
      secondaryAction: input.nextNode
        ? buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.nextNode.nodeId)
        : buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.focusNode.nodeId),
      secondaryActionLabel: input.nextNode ? `Practice ${input.nextNode.label}` : "Continue practice",
      secondaryActionMode: ALGORITHM_MODE_IDS.guidedPractice,
      title: "Return to due review",
      tone: "info",
    };
  }

  if (input.focusNode.uniquePracticedItemCount > 0) {
    return {
      detail: buildContinuePriorityDetail(input.focusNode),
      label: "Recommended from recent practice",
      primaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.focusNode.nodeId),
      primaryActionLabel: `Continue ${input.focusNode.label}`,
      primaryActionMode: ALGORITHM_MODE_IDS.guidedPractice,
      secondaryAction: input.nextNode
        ? buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.nextNode.nodeId)
        : undefined,
      secondaryActionLabel: input.nextNode ? `Practice ${input.nextNode.label}` : undefined,
      secondaryActionMode: input.nextNode ? ALGORITHM_MODE_IDS.guidedPractice : undefined,
      title: `Continue ${input.focusNode.label}`,
      tone: "info",
    };
  }

  return {
    detail: `No attempts are recorded yet. Start with ${input.focusNode.label}, or choose any other available topic.`,
    label: "Get started",
    primaryAction: buildAlgorithmsAction(ALGORITHM_MODE_IDS.guidedPractice, input.focusNode.nodeId),
    primaryActionLabel: "Start practice",
    primaryActionMode: ALGORITHM_MODE_IDS.guidedPractice,
    title: "Start your first Coding Interview session",
    tone: "info",
  };
}

function buildAlgorithmsAction(
  mode: AlgorithmModeId,
  topicId: string,
  reviewSource?: "due_queue",
): ProgressAction {
  return {
    kind: "practiceSession",
    params: buildPracticeSessionConfig({
      mode,
      reviewSource,
      source: "modeShortcut",
      topicId,
      trackId: CODING_INTERVIEW_TRACK_ID,
    }),
  };
}

function buildContinuePriorityDetail(
  node: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number],
): string {
  return `${node.uniquePracticedItemCount} ${node.uniquePracticedItemCount === 1 ? "item records" : "items record"} evidence across ${node.sampledCoreSkillAtomCount} ${node.sampledCoreSkillAtomCount === 1 ? "core skill" : "core skills"}. Continue here for more varied practice, or choose another topic.`;
}

function buildFocusExplanation(
  node: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number],
): string {
  if (node.remediationDueCount > 0) {
    return `${node.remediationDueCount} ${node.remediationDueCount === 1 ? "review item is" : "review items are"} due from this topic. This does not restrict other topics.`;
  }

  if (node.uniquePracticedItemCount === 0) {
    return "No attempts are recorded for this topic yet.";
  }

  return `${node.uniquePracticedItemCount} distinct ${node.uniquePracticedItemCount === 1 ? "item has" : "items have"} been practiced in this topic.`;
}

function buildRoadmapSummary(
  nodes: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"],
  focusIndex: number,
): RoadmapSummaryNodeModel[] {
  const startIndex = Math.max(0, focusIndex - 1);
  return buildRoadmapNodes(nodes, focusIndex)
    .slice(startIndex, focusIndex + 3);
}

function buildRoadmapNodes(
  nodes: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"],
  focusIndex: number,
): RoadmapSummaryNodeModel[] {
  return nodes.map((node, index) => {
    if (index === focusIndex) {
      return {
        id: node.nodeId,
        label: getNodeEvidenceLabel(node),
        progressPercent: node.itemCoveragePercent,
        showProgress: node.itemCoveragePercent > 0,
        title: node.label,
        tone: getNodeTone(node.status),
      };
    }

    return {
      id: node.nodeId,
      label: node.uniquePracticedItemCount > 0 ? getNodeEvidenceLabel(node) : "Available",
      progressPercent: node.itemCoveragePercent,
      showProgress: node.itemCoveragePercent > 0,
      title: node.label,
      tone: getNodeTone(node.status),
    };
  });
}

function getNodeTone(status: AlgorithmRoadmapNodeProgressStatus): LearningTone {
  if (status === "review_due") return "warning";
  if (status === "practicing") return "info";
  return "muted";
}

function getCurrentFocusStatus(
  node: ReturnType<typeof buildAlgorithmProgressFacts>["nodeProgress"][number],
): { label: CurrentFocusModel["statusLabel"]; tone: LearningTone } {
  if (node.remediationDueCount > 0) {
    return {
      label: "Needs remediation",
      tone: node.criticalRemediationDueCount > 0 ? "danger" : "warning",
    };
  }

  return {
    label: getNodeEvidenceLabel(node),
    tone: getNodeTone(node.status),
  };
}

function getNodeEvidenceLabel(node: {
  status: AlgorithmRoadmapNodeProgressStatus;
}): CurrentFocusModel["statusLabel"] {
  const labels: Record<AlgorithmRoadmapNodeProgressStatus, CurrentFocusModel["statusLabel"]> = {
    not_started: "Not started",
    practicing: "Practicing",
    review_due: "Review due",
  };
  return labels[node.status];
}

function formatAlgorithmSignalLabel(value: string): string {
  return value.split("_").map(capitalize).join(" ");
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatAlgorithmsReviewQueueCopy(dueCount: number, totalCount: number): string {
  if (dueCount === 0 && totalCount === 0) {
    return "No Coding Interview review items right now.";
  }

  if (dueCount === 0) {
    return `${totalCount} scheduled Coding Interview ${totalCount === 1 ? "item is" : "items are"} not due yet.`;
  }

  return `${dueCount} due Coding Interview ${dueCount === 1 ? "item needs" : "items need"} review.`;
}

function formatCanonicalReviewQueueCopy(
  dueCount: number,
  highPriorityCount: number,
  scheduledCount: number,
): string {
  if (dueCount === 0) {
    if (scheduledCount > 0) {
      return `${scheduledCount} scheduled ${scheduledCount === 1 ? "item is" : "items are"} not due yet.`;
    }

    return "No due review items right now.";
  }

  if (highPriorityCount > 0) {
    return `${dueCount} due ${dueCount === 1 ? "item" : "items"}, ${highPriorityCount} high priority.`;
  }

  return `${dueCount} due review ${dueCount === 1 ? "item" : "items"}.`;
}

function getCloudDomainLabel(nodeId: string): string {
  if (isExamDomain(nodeId)) {
    return getDomainLabel(nodeId);
  }

  return nodeId;
}

function isExamDomain(value: string): value is CertificationDomain {
  return (
    value === "setup_environment" ||
    value === "planning_implementation" ||
    value === "operations" ||
    value === "access_security"
  );
}

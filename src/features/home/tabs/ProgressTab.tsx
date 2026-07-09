import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconTile,
  MetricCard,
  ProgressBar,
  SectionHeader,
} from "../../../components";
import {
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";
import type { ReviewQueueItem, TrainingAttempt } from "../../../domain/training";
import type { CloudCertificationProgressViewModel } from "../../../tracks";
import { colors, spacing, typography } from "../../../theme";
import type {
  AttemptSummary,
  PracticeAnswerRecord,
} from "../../../types";
import type { AnalyticsData } from "../../analytics/analyticsService";
import {
  buildProgressTabModel,
  type AlgorithmsProgressScreenModel,
  type ProgressAction,
} from "./progressTabModel";

type ProgressTabProps = {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
  attempts: AttemptSummary[];
  cloudProgress?: CloudCertificationProgressViewModel | null;
  practiceHistory: PracticeAnswerRecord[];
  reviewQueueItems?: readonly ReviewQueueItem[];
  trainingAttempts?: TrainingAttempt[];
  onProgressAction?: (action: ProgressAction) => void;
};

export function ProgressTab({
  activeTrack,
  analytics,
  attempts,
  cloudProgress,
  practiceHistory,
  reviewQueueItems = [],
  trainingAttempts = [],
  onProgressAction,
}: ProgressTabProps) {
  const progress = buildProgressTabModel({
    activeTrackId: activeTrack.id,
    analytics,
    attempts,
    cloudProgress,
    practiceHistory,
    reviewQueueItems,
    trainingAttempts,
  });
  const reviewAction = progress.reviewAction;

  if (progress.algorithmsProgress) {
    return (
      <AlgorithmsProgressContent
        model={progress.algorithmsProgress}
        onProgressAction={onProgressAction}
      />
    );
  }

  return (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.screenTitle}>Focus overview</Text>
        <Text style={styles.screenSubtitle}>
          Review what needs attention and track recent local practice.
        </Text>
      </View>

      <Card variant="tonal" style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewCopy}>
            <Text style={styles.reviewTitle}>Due review</Text>
            <Text style={styles.mutedText}>
              {progress.reviewQueueCopy}
            </Text>
          </View>
          <Text style={styles.reviewNumber}>{progress.reviewQueueCount}</Text>
        </View>
        {progress.warning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{progress.warning}</Text>
          </View>
        ) : null}
        {progress.reviewActionEnabled && reviewAction && onProgressAction ? (
          <Button onPress={() => onProgressAction(reviewAction)} variant="secondary">
            {progress.reviewActionLabel}
          </Button>
        ) : (
          <View style={styles.unavailableAction}>
            <Text style={styles.unavailableActionText}>
              {progress.reviewActionLabel}
            </Text>
          </View>
        )}
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Practice activity"
          action={<Badge label="Local data" tone="neutral" />}
          tight
        />
        <Card>
          <View style={styles.activityHeader}>
            <IconTile name="practice" tone="primary" />
            <View style={styles.activityCopy}>
              <Text style={styles.activityValue}>
                {progress.activitySummary.value}
              </Text>
              <Text style={styles.performanceTitle}>
                {progress.activitySummary.label}
              </Text>
              <Text style={styles.mutedText}>
                {progress.activitySummary.detail}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={progress.performanceSectionTitle} tight />
        {progress.performanceScores.length > 0 ? (
          <View style={styles.actionList}>
            {progress.performanceScores.map((score) => (
              <View key={score.id} style={styles.performanceRow}>
                <View style={styles.performanceHeader}>
                  <IconTile
                    name={activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID ? "cloud" : "route"}
                    tone="info"
                  />
                  <View style={styles.performanceCopy}>
                    <Text style={styles.performanceTitle}>{score.label}</Text>
                    <Text style={styles.mutedText}>
                      {score.detail ?? `${score.correct}/${score.total} correct`}
                    </Text>
                  </View>
                  <View style={styles.performanceMeta}>
                    <Text style={styles.performanceValue}>{score.percent}%</Text>
                  </View>
                </View>
                <ProgressBar progress={score.percent / 100} tone="primary" />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title={getProgressEmptyTitle(activeTrack.id)}
            description={getProgressEmptyDescription(activeTrack.id, progress.hasData)}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Concrete metrics" tight />
        <View style={styles.metricRow}>
          {progress.metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              tone={metric.tone}
              value={metric.value}
            />
          ))}
        </View>
      </View>
    </>
  );
}

function AlgorithmsProgressContent({
  model,
  onProgressAction,
}: {
  model: AlgorithmsProgressScreenModel;
  onProgressAction?: (action: ProgressAction) => void;
}) {
  const [showAllRoadmapNodes, setShowAllRoadmapNodes] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(!model.diagnostics.collapsedByDefault);
  const roadmapNodes = showAllRoadmapNodes
    ? model.roadmapSummary.allNodes
    : model.roadmapSummary.nodes;

  return (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.screenTitle}>Learning priority</Text>
        <Text style={styles.screenSubtitle}>
          Use your current evidence to choose the next learning action.
        </Text>
      </View>

      <Card variant="tonal" style={styles.priorityCard}>
        <Badge label={model.priority.label} tone={getBadgeTone(model.priority.tone)} />
        <Text style={styles.priorityTitle}>{model.priority.title}</Text>
        <Text style={styles.mutedText}>{model.priority.detail}</Text>
        <Button
          disabled={!onProgressAction}
          onPress={() => onProgressAction?.(model.priority.primaryAction)}
        >
          {model.priority.primaryActionLabel}
        </Button>
        {model.priority.secondaryAction && model.priority.secondaryActionLabel ? (
          <Button
            disabled={!onProgressAction}
            onPress={() => onProgressAction?.(model.priority.secondaryAction!)}
            variant="ghost"
          >
            {model.priority.secondaryActionLabel}
          </Button>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Current focus" tight />
        <Card style={styles.focusCard}>
          <View style={styles.cardHeading}>
            <Text style={styles.activityValue}>{model.currentFocus.title}</Text>
            <Badge
              label={model.currentFocus.statusLabel}
              tone={getBadgeTone(model.currentFocus.statusTone)}
            />
          </View>
          <View style={styles.focusMetrics}>
            <FocusMetric
              label="Practiced"
              showDivider
              value={model.currentFocus.practicedLabel}
            />
            <FocusMetric
              label="Core skills"
              showDivider
              value={model.currentFocus.coreSkillsLabel}
            />
            <FocusMetric label="Score" value={model.currentFocus.scoreLabel} />
          </View>
          <ProgressBar progress={model.currentFocus.progressPercent / 100} tone="primary" />
          <Text style={styles.mutedText}>{model.currentFocus.explanation}</Text>
        </Card>
      </View>

      {model.nextTopic ? (
        <View style={styles.section}>
          <SectionHeader title="Next topic" tight />
          <Card style={styles.focusCard}>
            <View style={styles.cardHeading}>
              <Text style={styles.activityValue}>{model.nextTopic.title}</Text>
              <Badge
                label={getNextTopicStateLabel(model.nextTopic.state)}
                tone={model.nextTopic.state === "locked" ? "neutral" : "success"}
              />
            </View>
            <Text style={styles.mutedText}>{model.nextTopic.detail}</Text>
            {model.nextTopic.requirements.length > 0 ? (
              <View style={styles.requirementList}>
                <Text style={styles.performanceTitle}>To unlock</Text>
                {model.nextTopic.requirements.map((requirement) => (
                  <View key={requirement.label} style={styles.requirementRow}>
                    <Text style={requirement.met ? styles.metMark : styles.unmetMark}>
                      {requirement.met ? "✓" : "○"}
                    </Text>
                    <Text style={styles.mutedText}>{requirement.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Roadmap summary" tight />
        <Card style={styles.roadmapCard}>
          {roadmapNodes.map((node) => (
            <View key={node.id} style={styles.roadmapRow}>
              <View style={styles.roadmapCopy}>
                <Text style={styles.performanceTitle}>{node.title}</Text>
                {node.showProgress ? (
                  <ProgressBar progress={node.progressPercent / 100} tone="primary" />
                ) : null}
              </View>
              <Badge label={node.label} tone={getBadgeTone(node.tone)} />
            </View>
          ))}
          {model.roadmapSummary.allNodes.length > model.roadmapSummary.nodes.length ? (
            <Button
              onPress={() => setShowAllRoadmapNodes((current) => !current)}
              variant="ghost"
            >
              {showAllRoadmapNodes ? "Show roadmap summary" : model.roadmapSummary.showAllActionLabel}
            </Button>
          ) : null}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Detailed diagnostics" tight />
        <Card style={styles.diagnosticsCard}>
          <Button onPress={() => setShowDiagnostics((current) => !current)} variant="secondary">
            {showDiagnostics ? "Hide detailed diagnostics" : "Show detailed diagnostics"}
          </Button>
          {showDiagnostics ? (
            <>
              <View style={styles.metricRow}>
                {model.diagnostics.metrics.map((metric) => (
                  <MetricCard
                    key={metric.label}
                    label={metric.label}
                    tone={metric.tone}
                    value={metric.value}
                  />
                ))}
              </View>
              {model.diagnostics.mistakeSummary ? (
                <Text style={styles.mutedText}>{model.diagnostics.mistakeSummary}</Text>
              ) : null}
            </>
          ) : null}
        </Card>
      </View>
    </>
  );
}

function FocusMetric({
  label,
  showDivider = false,
  value,
}: {
  label: string;
  showDivider?: boolean;
  value: string;
}) {
  return (
    <View style={[styles.focusMetric, showDivider ? styles.focusMetricDivider : null]}>
      <Text style={styles.focusMetricValue}>{value}</Text>
      <Text style={styles.focusMetricLabel}>{label}</Text>
    </View>
  );
}

function getBadgeTone(
  tone: "danger" | "warning" | "info" | "success" | "muted",
): "danger" | "warning" | "info" | "success" | "neutral" {
  return tone === "muted" ? "neutral" : tone;
}

function getNextTopicStateLabel(state: "locked" | "available" | "ready"): string {
  if (state === "locked") return "Locked for now";
  if (state === "ready") return "Ready now";
  return "Available now";
}

function getProgressEmptyTitle(trackId: TrackDefinition["id"]): string {
  return trackId === CLOUD_CERTIFICATION_TRACK_ID
    ? "No topic samples yet"
    : "No algorithm progress yet";
}

function getProgressEmptyDescription(
  trackId: TrackDefinition["id"],
  hasData: boolean,
): string {
  if (trackId !== CLOUD_CERTIFICATION_TRACK_ID) {
    return "Start an Algorithms session to record local roadmap progress.";
  }

  return hasData
    ? "Topic performance appears after answers have domain-level scoring data."
    : "Start a focused practice session to build track-aware performance data.";
}

const styles = StyleSheet.create({
  pageIntro: {
    gap: spacing.md,
  },
  screenTitle: {
    ...typography.heading,
    color: colors.dark.textPrimary,
  },
  screenSubtitle: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  reviewCard: {
    gap: spacing.lg,
  },
  reviewHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  reviewCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  reviewTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  reviewNumber: {
    ...typography.display,
    color: colors.dark.info,
    fontVariant: ["tabular-nums"],
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  unavailableAction: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  unavailableActionText: {
    ...typography.small,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  section: {
    gap: spacing.md,
  },
  activityHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  activityCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  activityValue: {
    ...typography.heading,
    color: colors.dark.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  priorityCard: {
    gap: spacing.lg,
  },
  priorityTitle: {
    ...typography.heading,
    color: colors.dark.textPrimary,
  },
  focusCard: {
    gap: spacing.lg,
  },
  cardHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  focusMetrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  focusMetric: {
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  focusMetricDivider: {
    borderColor: colors.dark.border,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  focusMetricValue: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  focusMetricLabel: {
    ...typography.caption,
    color: colors.dark.textSecondary,
  },
  mutedText: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  requirementList: {
    gap: spacing.md,
  },
  requirementRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  metMark: {
    ...typography.bodyStrong,
    color: colors.dark.success,
  },
  unmetMark: {
    ...typography.bodyStrong,
    color: colors.dark.textMuted,
  },
  roadmapCard: {
    gap: spacing.lg,
  },
  roadmapRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  roadmapCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  diagnosticsCard: {
    gap: spacing.lg,
  },
  warningBanner: {
    backgroundColor: colors.dark.warningSoft,
    borderRadius: 8,
    padding: spacing.md,
  },
  warningText: {
    ...typography.small,
    color: colors.dark.textPrimary,
  },
  actionList: {
    gap: spacing.md,
  },
  performanceRow: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  performanceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  performanceCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  performanceTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
    flexShrink: 1,
  },
  performanceMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  performanceValue: {
    ...typography.bodyStrong,
    color: colors.dark.primary,
    flexShrink: 0,
    fontVariant: ["tabular-nums"],
  },
});

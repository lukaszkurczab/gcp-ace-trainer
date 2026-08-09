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
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  type TrackDisplay,
} from "../../../domain";
import type { ReviewQueueEntry, TrainingAttempt } from "../../../domain";
import type { CloudCertificationProgressViewModel } from "../../../tracks";
import { spacing, typography } from "../../../theme";
import type { CertificationExamSummaryViewModel, CertificationPracticeAnswerViewModel } from "../../../tracks/certification";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { useAppPreferences, useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";
import { runtimeSelectors } from "../../../testing/runtimeSelectors";

import {
  buildProgressTabModel,
  type AlgorithmsProgressScreenModel,
  type ProgressAction,
} from "./progressTabModel";

type ProgressTabProps = {
  activeTrack: TrackDisplay;
  analytics: AnalyticsData;
  attempts: CertificationExamSummaryViewModel[];
  cloudProgress?: CloudCertificationProgressViewModel | null;
  practiceHistory: CertificationPracticeAnswerViewModel[];
  reviewQueueItems?: readonly ReviewQueueEntry[];
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
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
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
  const isCertificationTrack = activeTrack.id === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID;

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
        <Text style={styles.screenTitle}>{t("Focus overview")}</Text>
        <Text style={styles.screenSubtitle}>
          {t("Review what needs attention and track recent local practice.")}
        </Text>
      </View>

      <Card variant="layered" style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewCopy}>
            <Text style={styles.reviewTitle}>{t("Due review")}</Text>
            <Text style={styles.mutedText}>
              {t(progress.reviewQueueCopy)}
            </Text>
          </View>
          <Text style={styles.reviewNumber}>{progress.reviewQueueCount}</Text>
        </View>
        {progress.warning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{t(progress.warning)}</Text>
          </View>
        ) : null}
        {progress.reviewActionEnabled && reviewAction && onProgressAction ? (
          <Button onPress={() => onProgressAction(reviewAction)} variant="secondary">
            {t(progress.reviewActionLabel)}
          </Button>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title={t("Practice activity")}
          action={<Badge label={t("Local data")} tone="neutral" />}
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
                {t(progress.activitySummary.label)}
              </Text>
              <Text style={styles.mutedText}>
                {t(progress.activitySummary.detail)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t(progress.performanceSectionTitle)} tight />
        {progress.performanceScores.length > 0 ? (
          <View style={styles.actionList}>
            {progress.performanceScores.map((score) => (
              <View key={score.id} style={styles.performanceRow}>
                <View style={styles.performanceHeader}>
                  <IconTile
                    name={isCertificationTrack ? "cloud" : "route"}
                    tone="info"
                  />
                  <View style={styles.performanceCopy}>
                    <Text style={styles.performanceTitle}>{t(score.label)}</Text>
                    <Text style={styles.mutedText}>
                      {score.detail ? t(score.detail) : `${score.correct}/${score.total} ${t("correct")}`}
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
            title={t(getProgressEmptyTitle(activeTrack.id))}
            description={t(getProgressEmptyDescription(activeTrack.id, progress.hasData))}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title={t("Concrete metrics")} tight />
        <View style={styles.metricRow}>
          {progress.metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={t(metric.label)}
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
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [showAllRoadmapNodes, setShowAllRoadmapNodes] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(!model.diagnostics.collapsedByDefault);
  const roadmapNodes = showAllRoadmapNodes
    ? model.roadmapSummary.allNodes
    : model.roadmapSummary.nodes;

  return (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.screenTitle} testID={runtimeSelectors.progress.root()}>{t("Learning priority")}</Text>
        <Text style={styles.screenSubtitle}>
          {t("Use your current evidence to choose the next learning action.")}
        </Text>
      </View>

      <Card variant="layered" style={styles.priorityCard}>
        <Badge label={t(model.priority.label)} tone={getBadgeTone(model.priority.tone)} />
        <Text style={styles.priorityTitle}>{t(model.priority.title)}</Text>
        <Text style={styles.mutedText}>{t(model.priority.detail)}</Text>
        <Button
          disabled={!onProgressAction}
          onPress={() => onProgressAction?.(model.priority.primaryAction)}
        >
          {t(model.priority.primaryActionLabel)}
        </Button>
        {model.priority.secondaryAction && model.priority.secondaryActionLabel ? (
          <Button
            disabled={!onProgressAction}
            onPress={() => onProgressAction?.(model.priority.secondaryAction!)}
            variant="ghost"
          >
            {t(model.priority.secondaryActionLabel)}
          </Button>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionHeader title={t("Current focus")} tight />
        <Card style={styles.focusCard}>
          <View style={styles.cardHeading}>
            <Text style={styles.activityValue}>{model.currentFocus.title}</Text>
            <Badge
              label={t(model.currentFocus.statusLabel)}
              tone={getBadgeTone(model.currentFocus.statusTone)}
            />
          </View>
          <View style={styles.focusMetrics}>
            <FocusMetric
              label={t("Items practiced")}
              showDivider
              value={t(model.currentFocus.practicedLabel)}
            />
            <FocusMetric
              label={t("Skills tried")}
              value={t(model.currentFocus.skillEvidenceLabel)}
            />
          </View>
          {model.currentFocus.showProgress ? (
            <ProgressBar progress={model.currentFocus.progressPercent / 100} tone="primary" />
          ) : null}
          <Text style={styles.mutedText}>{t(model.currentFocus.explanation)}</Text>
        </Card>
      </View>

      {model.nextTopic ? (
        <View style={styles.section}>
          <SectionHeader title={t("Another topic")} tight />
          <Card style={styles.focusCard}>
            <View style={styles.cardHeading}>
              <Text style={styles.activityValue}>{model.nextTopic.title}</Text>
              <Badge label={t("Available")} tone="info" />
            </View>
            <Text style={styles.mutedText}>{t(model.nextTopic.detail)}</Text>
          </Card>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={t("Roadmap summary")} tight />
        <Card style={styles.roadmapCard}>
          {roadmapNodes.map((node) => (
            <View key={node.id} style={styles.roadmapRow} testID={runtimeSelectors.progress.node(node.id)}>
              <View style={styles.roadmapCopy}>
                <Text style={styles.performanceTitle}>{node.title}</Text>
                {node.showProgress ? (
                  <ProgressBar progress={node.progressPercent / 100} tone="primary" />
                ) : null}
              </View>
              <Badge label={t(node.label)} tone={getBadgeTone(node.tone)} />
            </View>
          ))}
          {model.roadmapSummary.allNodes.length > model.roadmapSummary.nodes.length ? (
            <Button
              onPress={() => setShowAllRoadmapNodes((current) => !current)}
              variant="ghost"
            >
              {showAllRoadmapNodes ? t("Show roadmap summary") : t(model.roadmapSummary.showAllActionLabel)}
            </Button>
          ) : null}
        </Card>
      </View>

      <View style={styles.explanationDisclosure}>
        <View style={styles.explanationHeader}>
          <View style={styles.explanationCopy}>
            <Text style={styles.explanationTitle}>{t(model.diagnostics.title)}</Text>
            <Text style={styles.explanationSubtitle}>{t(model.diagnostics.subtitle)}</Text>
          </View>
          <Button onPress={() => setShowDiagnostics((current) => !current)} variant="ghost">
            {showDiagnostics ? t(model.diagnostics.hideActionLabel) : t(model.diagnostics.showActionLabel)}
          </Button>
        </View>
        {showDiagnostics ? (
          <View style={styles.explanationDetails}>
            <ExplanationBlock
              label={t("Attempt outcomes")}
              text={formatDiagnosticFacts(model.diagnostics.outcomeSummary)}
            />
            <ExplanationBlock
              label={t("Detected mistake patterns")}
              text={
                model.diagnostics.mistakePatterns.length > 0
                  ? model.diagnostics.mistakePatterns.join(" · ")
                  : t("No repeated mistake patterns detected yet.")
              }
            />
            <ExplanationBlock
              label={t("Roadmap state")}
              text={formatDiagnosticFacts(model.diagnostics.roadmapFacts)}
            />
          </View>
        ) : null}
      </View>
    </>
  );
}

function ExplanationBlock({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.explanationBlock}>
      <Text style={styles.explanationLabel}>{label}</Text>
      <Text style={styles.explanationText}>{text}</Text>
    </View>
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
  const styles = useThemedStyles(createStyles);
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

function formatDiagnosticFacts(
  facts: AlgorithmsProgressScreenModel["diagnostics"]["outcomeSummary"],
): string {
  return facts.map((fact) => `${fact.label}: ${fact.value}`).join(" · ");
}

function getProgressEmptyTitle(trackId: TrackDisplay["id"]): string {
  return trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID
    ? "No topic samples yet"
    : "No algorithm progress yet";
}

function getProgressEmptyDescription(
  trackId: TrackDisplay["id"],
  hasData: boolean,
): string {
  if (trackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID) {
    return "Start a Coding Interview session to record local roadmap progress.";
  }

  return hasData
    ? "Topic performance appears after answers have domain-level scoring data."
    : "Start a focused practice session to build track-aware performance data.";
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  pageIntro: {
    gap: spacing.md,
  },
  screenTitle: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  screenSubtitle: {
    ...typography.small,
    color: palette.textSecondary,
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
    color: palette.textPrimary,
  },
  reviewNumber: {
    ...typography.display,
    color: palette.info,
    fontVariant: ["tabular-nums"],
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
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
    color: palette.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  priorityCard: {
    gap: spacing.lg,
  },
  priorityTitle: {
    ...typography.heading,
    color: palette.textPrimary,
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
    borderColor: palette.border,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  focusMetricValue: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  focusMetricLabel: {
    ...typography.caption,
    color: palette.textSecondary,
  },
  mutedText: {
    ...typography.small,
    color: palette.textSecondary,
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
  explanationDisclosure: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.md,
  },
  explanationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  explanationCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  explanationTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  explanationSubtitle: {
    ...typography.caption,
    color: palette.textMuted,
  },
  explanationDetails: {
    borderColor: palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  explanationBlock: {
    gap: spacing.xs,
  },
  explanationLabel: {
    ...typography.caption,
    color: palette.textSecondary,
  },
  explanationText: {
    ...typography.small,
    color: palette.textPrimary,
  },
  warningBanner: {
    backgroundColor: palette.warningSoft,
    borderRadius: 8,
    padding: spacing.md,
  },
  warningText: {
    ...typography.small,
    color: palette.textPrimary,
  },
  actionList: {
    gap: spacing.md,
  },
  performanceRow: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
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
    color: palette.textPrimary,
    flexShrink: 1,
  },
  performanceMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  performanceValue: {
    ...typography.bodyStrong,
    color: palette.primary,
    flexShrink: 0,
    fontVariant: ["tabular-nums"],
  },
});

import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
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
import type { TrainingAttempt } from "../../../domain/training";
import type { CloudCertificationProgressViewModel } from "../../../tracks";
import { colors, spacing, typography } from "../../../theme";
import type {
  AttemptSummary,
  PracticeAnswerRecord,
} from "../../../types";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { buildProgressTabModel } from "./progressTabModel";

type ProgressTabProps = {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
  attempts: AttemptSummary[];
  cloudProgress?: CloudCertificationProgressViewModel | null;
  practiceHistory: PracticeAnswerRecord[];
  trainingAttempts?: TrainingAttempt[];
};

export function ProgressTab({
  activeTrack,
  analytics,
  attempts,
  cloudProgress,
  practiceHistory,
  trainingAttempts = [],
}: ProgressTabProps) {
  const progress = buildProgressTabModel({
    activeTrackId: activeTrack.id,
    analytics,
    attempts,
    cloudProgress,
    practiceHistory,
    trainingAttempts,
  });

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
            <Text style={styles.reviewTitle}>Review queue</Text>
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
        <View style={styles.unavailableAction}>
          <Text style={styles.unavailableActionText}>
            {progress.reviewActionLabel}
          </Text>
        </View>
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
  mutedText: {
    ...typography.small,
    color: colors.dark.textSecondary,
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

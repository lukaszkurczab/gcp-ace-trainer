import { StyleSheet, Text, View } from "react-native";

import {
  Card,
  EmptyState,
  Icon,
  IconTile,
  MetricCard,
  ProgressBar,
  SectionHeader,
} from "../../../components";
import {
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";
import { colors, spacing, typography } from "../../../theme";
import type {
  AttemptSummary,
  PracticeAnswerRecord,
} from "../../../types";
import type { AnalyticsData } from "../../analytics/analyticsService";

type ProgressTabProps = {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
  attempts: AttemptSummary[];
  practiceHistory: PracticeAnswerRecord[];
};

export function ProgressTab({
  activeTrack,
  analytics,
  attempts,
  practiceHistory,
}: ProgressTabProps) {
  const hasData = attempts.length > 0 || practiceHistory.length > 0;
  const domainScoresWithData =
    activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID
      ? analytics.domainPerformance.filter((score) => score.total > 0)
      : [];
  const reviewQueueCount = analytics.summary.totalPracticeQuestionsAnswered;

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
              {formatReviewQueueCopy(reviewQueueCount)}
            </Text>
          </View>
          <Text style={styles.reviewNumber}>{reviewQueueCount}</Text>
        </View>
        <View style={styles.metricRow}>
          <MetricCard
            label="Completed exams"
            tone="info"
            value={analytics.summary.totalCompletedExams}
          />
          <MetricCard
            label="Practice answers"
            tone="primary"
            value={analytics.summary.totalPracticeQuestionsAnswered}
          />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Performance by topic" tight />
        {domainScoresWithData.length > 0 ? (
          <View style={styles.actionList}>
            {domainScoresWithData.map((score) => (
              <View key={score.id} style={styles.performanceRow}>
                <View style={styles.performanceHeader}>
                  <IconTile name="cloud" tone="info" />
                  <View style={styles.performanceCopy}>
                    <Text style={styles.performanceTitle}>{score.label}</Text>
                    <Text style={styles.mutedText}>
                      {score.correct}/{score.total} correct
                    </Text>
                  </View>
                  <View style={styles.performanceMeta}>
                    <Text style={styles.performanceValue}>{score.percent}%</Text>
                    <Icon name="chevron-right" size={20} />
                  </View>
                </View>
                <ProgressBar progress={score.percent / 100} tone="primary" />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title={getProgressEmptyTitle(activeTrack.id)}
            description={getProgressEmptyDescription(activeTrack.id, hasData)}
          />
        )}
      </View>
    </>
  );
}

function formatReviewQueueCopy(count: number): string {
  if (count === 0) {
    return "No local practice records yet.";
  }

  return `${count} local practice ${count === 1 ? "record" : "records"} available for review.`;
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
    return "Pattern, strategy, and complexity metrics will appear after Algorithms sessions are implemented.";
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
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  mutedText: {
    ...typography.small,
    color: colors.dark.textSecondary,
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

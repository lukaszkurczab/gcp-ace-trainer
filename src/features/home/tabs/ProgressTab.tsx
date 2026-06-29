import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Card,
  EmptyState,
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

  return (
    <>
      <Card variant="elevated">
        <SectionHeader
          title="Focus overview"
          subtitle={`Track-aware progress for ${activeTrack.title}.`}
          action={
            <Badge
              label={hasData ? "Local data" : "No data"}
              tone={hasData ? "info" : "neutral"}
            />
          }
        />
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

      <Card>
        <SectionHeader
          title="Review queue"
          subtitle="Review becomes track-aware as session records are migrated."
        />
        <View style={styles.reviewMetric}>
          <Text style={styles.largeNumber}>
            {analytics.summary.totalPracticeQuestionsAnswered}
          </Text>
          <Text style={styles.mutedText}>local practice records available</Text>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Performance by topic" tight />
        {activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID ? (
          <View style={styles.actionList}>
            {analytics.domainPerformance.map((score) => (
              <View key={score.id} style={styles.performanceRow}>
                <View style={styles.performanceHeader}>
                  <Text style={styles.performanceTitle}>{score.label}</Text>
                  <Text style={styles.performanceValue}>{score.percent}%</Text>
                </View>
                <ProgressBar progress={score.percent / 100} tone="primary" />
                <Text style={styles.mutedText}>
                  {score.correct}/{score.total} correct
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No algorithm progress yet"
            description="Pattern, strategy, and complexity metrics will appear after Algorithms sessions are implemented."
          />
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  reviewMetric: {
    gap: spacing.xs,
  },
  largeNumber: {
    ...typography.display,
    color: colors.dark.primary,
    fontVariant: ["tabular-nums"],
  },
  mutedText: {
    ...typography.small,
    color: colors.dark.textSecondary,
  },
  actionList: {
    gap: spacing.md,
  },
  performanceRow: {
    gap: spacing.sm,
  },
  performanceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  performanceTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  performanceValue: {
    ...typography.bodyStrong,
    color: colors.dark.primary,
    flexShrink: 0,
    fontVariant: ["tabular-nums"],
  },
});

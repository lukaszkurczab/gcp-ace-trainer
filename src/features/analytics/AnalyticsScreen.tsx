import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Badge, Card, EmptyState, Screen, SectionHeader } from "../../components";
import { getAttempts, getPracticeHistory } from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import { DomainPerformanceChart, ScoreTrendChart } from "./AnalyticsCharts";
import { buildAnalyticsData, type AnalyticsData, type ConfidenceAccuracy, type MistakeReasonDistribution, type PerformanceScore } from "./analyticsService";

export function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadAnalytics() {
        const [attempts, practiceHistory] = await Promise.all([getAttempts(), getPracticeHistory()]);

        if (isActive) {
          setAnalytics(buildAnalyticsData(attempts, practiceHistory));
        }
      }

      void loadAnalytics();

      return () => {
        isActive = false;
      };
    }, [])
  );

  if (!analytics) {
    return (
      <Screen>
        <EmptyState title="Analytics loading" description="Reading local attempts and practice history." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <SectionHeader title="Analytics" subtitle="Local diagnostics from saved exams and practice answers." />
        <Text style={styles.note}>No backend, network calls, or user tracking.</Text>
      </Card>

      <View style={styles.summaryGrid}>
        <SummaryMetric label="Completed Exams" value={analytics.summary.totalCompletedExams} />
        <SummaryMetric label="Average Score" value={`${analytics.summary.averageExamScore}%`} />
        <SummaryMetric label="Best Score" value={`${analytics.summary.bestExamScore}%`} />
        <SummaryMetric label="Training Pass Rate" value={`${analytics.summary.trainingPassRate}%`} />
        <SummaryMetric label="Practice Answered" value={analytics.summary.totalPracticeQuestionsAnswered} />
      </View>

      <Card>
        <SectionHeader title="Score Trend" subtitle="Completed exam score over time." />
        <ScoreTrendChart points={analytics.scoreTrend} />
      </Card>

      <Card>
        <SectionHeader title="Domain Performance" subtitle="Exam and practice records combined." />
        <DomainPerformanceChart scores={analytics.domainPerformance} />
      </Card>

      <Card>
        <SectionHeader title="Weakest Tags" subtitle="Tags with at least 3 answers, weakest first." />
        {analytics.weakestTags.length > 0 ? (
          <View style={styles.list}>
            {analytics.weakestTags.map((score) => (
              <PerformanceRow key={score.id} score={score} />
            ))}
          </View>
        ) : (
          <EmptyState title="Not enough tag data" description="Answer at least 3 questions for a tag to include it here." />
        )}
      </Card>

      <Card>
        <SectionHeader title="Confidence Accuracy" subtitle="Accuracy by self-rated confidence." />
        {analytics.confidenceAccuracy.some((item) => item.total > 0) ? (
          <View style={styles.list}>
            {analytics.confidenceAccuracy.map((item) => (
              <ConfidenceRow key={item.confidence} item={item} />
            ))}
          </View>
        ) : (
          <EmptyState title="No confidence data" description="Rate confidence during practice to build this section." />
        )}
      </Card>

      <Card>
        <SectionHeader
          title="Mistake Reasons"
          subtitle={analytics.mostCommonMistakeReason ? `Most common: ${formatLabel(analytics.mostCommonMistakeReason)}` : undefined}
        />
        {analytics.mistakeReasons.length > 0 ? (
          <View style={styles.list}>
            {analytics.mistakeReasons.map((item) => (
              <MistakeReasonRow key={item.reason} item={item} />
            ))}
          </View>
        ) : (
          <EmptyState title="No mistake reasons yet" description="Select mistake reasons after incorrect practice answers." />
        )}
      </Card>

      <Card>
        <SectionHeader title="Weakness Summary" />
        <View style={styles.list}>
          {analytics.weaknessSummary.map((message) => (
            <Text key={message} style={styles.summaryText}>
              {message}
            </Text>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

type SummaryMetricProps = {
  label: string;
  value: string | number;
};

function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

type PerformanceRowProps = {
  score: PerformanceScore;
};

function PerformanceRow({ score }: PerformanceRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{score.label}</Text>
      <Text style={styles.rowValue}>
        {score.correct}/{score.total} · {score.percent}%
      </Text>
    </View>
  );
}

type ConfidenceRowProps = {
  item: ConfidenceAccuracy;
};

function ConfidenceRow({ item }: ConfidenceRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{formatLabel(item.confidence)}</Text>
        {item.warning ? <Badge label={item.warning} tone="warning" /> : null}
      </View>
      <Text style={styles.rowValue}>
        {item.correct}/{item.total} · {item.percent}%
      </Text>
    </View>
  );
}

type MistakeReasonRowProps = {
  item: MistakeReasonDistribution;
};

function MistakeReasonRow({ item }: MistakeReasonRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{formatLabel(item.reason)}</Text>
      <Text style={styles.rowValue}>
        {item.count} · {item.percent}%
      </Text>
    </View>
  );
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  note: {
    ...typography.caption,
    color: colors.light.textMuted
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  summaryCard: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    minWidth: "46%",
    padding: spacing.lg
  },
  metricValue: {
    ...typography.heading,
    color: colors.light.text
  },
  metricLabel: {
    ...typography.caption,
    color: colors.light.textMuted
  },
  list: {
    gap: spacing.md
  },
  row: {
    gap: spacing.xs
  },
  rowHeader: {
    alignItems: "flex-start",
    gap: spacing.sm
  },
  rowLabel: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  rowValue: {
    ...typography.caption,
    color: colors.light.textMuted
  },
  summaryText: {
    ...typography.body,
    color: colors.light.text
  }
});

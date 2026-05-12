import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Badge, Card, EmptyState, MetricCard, ProgressBar, Screen, SectionHeader } from "../../components";
import { TRAINING_PASS_THRESHOLD } from "../../constants";
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

  const hasCompletedExams = analytics.summary.totalCompletedExams > 0;
  const hasPracticeAnswers = analytics.summary.totalPracticeQuestionsAnswered > 0;
  const hasAnyAnalytics = hasCompletedExams || hasPracticeAnswers;

  return (
    <Screen>
      <Card variant="elevated">
        <SectionHeader
          title="Analytics"
          subtitle="Local diagnostics from completed exams and practice answers."
          action={<Badge label={hasAnyAnalytics ? "Local data" : "No data yet"} tone={hasAnyAnalytics ? "info" : "neutral"} />}
        />
        <Text style={styles.note}>No backend, network calls, account sync, or sample metrics.</Text>
      </Card>

      <View style={styles.summaryGrid}>
        <MetricCard helper={hasCompletedExams ? "Timed attempts" : "Submit an exam"} label="Completed Exams" value={analytics.summary.totalCompletedExams} tone="info" />
        <MetricCard
          helper={hasCompletedExams ? "Across completed exams" : "Unavailable until first exam"}
          label="Average Score"
          progress={hasCompletedExams ? analytics.summary.averageExamScore / 100 : undefined}
          tone={getPercentTone(analytics.summary.averageExamScore, hasCompletedExams)}
          value={hasCompletedExams ? `${analytics.summary.averageExamScore}%` : "—"}
        />
        <MetricCard
          helper={hasCompletedExams ? "Best completed exam" : "Unavailable until first exam"}
          label="Best Score"
          progress={hasCompletedExams ? analytics.summary.bestExamScore / 100 : undefined}
          tone={getPercentTone(analytics.summary.bestExamScore, hasCompletedExams)}
          value={hasCompletedExams ? `${analytics.summary.bestExamScore}%` : "—"}
        />
        <MetricCard
          helper={hasCompletedExams ? `Against local ${TRAINING_PASS_THRESHOLD}% threshold` : "Unavailable until first exam"}
          label="Training Pass Rate"
          progress={hasCompletedExams ? analytics.summary.trainingPassRate / 100 : undefined}
          tone={getPercentTone(analytics.summary.trainingPassRate, hasCompletedExams)}
          value={hasCompletedExams ? `${analytics.summary.trainingPassRate}%` : "—"}
        />
        <MetricCard
          helper={hasPracticeAnswers ? "Practice records" : "Answer practice questions"}
          label="Practice Answered"
          tone={hasPracticeAnswers ? "primary" : "neutral"}
          value={analytics.summary.totalPracticeQuestionsAnswered}
        />
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
        {hasAnyAnalytics ? (
          <View style={styles.list}>
            {analytics.weaknessSummary.map((message) => (
              <View key={message} style={styles.summaryRow}>
                <View style={styles.summaryDot} />
                <Text style={styles.summaryText}>{message}</Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState title="No analytics yet" description="Complete an exam or answer practice questions to build a diagnostic summary." />
        )}
      </Card>
    </Screen>
  );
}

type PerformanceRowProps = {
  score: PerformanceScore;
};

function PerformanceRow({ score }: PerformanceRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{score.label}</Text>
        <Badge label={getStrengthLabel(score)} tone={getPerformanceBadgeTone(score)} />
      </View>
      <ProgressBar progress={score.percent / 100} tone={getPerformanceProgressTone(score)} />
      <Text style={styles.rowValue}>
        {score.correct}/{score.total} correct · {score.percent}%
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
        {item.warning ? <Badge label={item.warning} tone="warning" /> : <Badge label={item.total >= 3 ? "Calibrated" : "Low sample"} tone={item.total >= 3 ? "success" : "neutral"} />}
      </View>
      <ProgressBar progress={item.percent / 100} tone={item.total < 3 ? "info" : getPercentProgressTone(item.percent)} />
      <Text style={styles.rowValue}>
        {item.total > 0 ? `${item.correct}/${item.total} correct · ${item.percent}%` : "No answers recorded for this confidence level."}
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
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{formatLabel(item.reason)}</Text>
        <Badge label={`${item.percent}%`} tone="warning" />
      </View>
      <ProgressBar progress={item.percent / 100} tone="warning" />
      <Text style={styles.rowValue}>{item.count} recorded incorrect answer{item.count === 1 ? "" : "s"}</Text>
    </View>
  );
}

function getPercentTone(percent: number, hasData: boolean) {
  if (!hasData) {
    return "neutral";
  }

  return percent >= TRAINING_PASS_THRESHOLD ? "success" : "warning";
}

function getPercentProgressTone(percent: number) {
  return percent >= TRAINING_PASS_THRESHOLD ? "success" : "warning";
}

function getPerformanceProgressTone(score: PerformanceScore) {
  if (score.total < 3) {
    return "info";
  }

  return score.percent >= TRAINING_PASS_THRESHOLD ? "success" : "warning";
}

function getPerformanceBadgeTone(score: PerformanceScore) {
  if (score.total < 3) {
    return "neutral";
  }

  return score.percent >= TRAINING_PASS_THRESHOLD ? "success" : "warning";
}

function getStrengthLabel(score: PerformanceScore): string {
  if (score.total < 3) {
    return "Low sample";
  }

  return score.percent >= TRAINING_PASS_THRESHOLD ? "Strong" : "Weak";
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
    color: colors.light.textSecondary
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  list: {
    gap: spacing.md
  },
  row: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md
  },
  rowHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  rowLabel: {
    ...typography.bodyStrong,
    color: colors.light.textPrimary
  },
  rowValue: {
    ...typography.caption,
    color: colors.light.textSecondary
  },
  summaryText: {
    ...typography.small,
    color: colors.light.textSecondary,
    flex: 1
  },
  summaryRow: {
    alignItems: "flex-start",
    backgroundColor: colors.light.elevatedSurface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  summaryDot: {
    backgroundColor: colors.light.primary,
    borderRadius: radius.pill,
    height: 8,
    marginTop: spacing.sm,
    width: 8
  }
});

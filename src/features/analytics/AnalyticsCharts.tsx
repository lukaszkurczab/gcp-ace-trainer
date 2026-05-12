import { Dimensions, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

import { EmptyState } from "../../components";
import { colorWithOpacity, colors, radius, spacing, typography } from "../../theme";
import type { PerformanceScore, ScoreTrendPoint } from "./analyticsService";

type ScoreTrendChartProps = {
  points: readonly ScoreTrendPoint[];
};

type DomainPerformanceChartProps = {
  scores: readonly PerformanceScore[];
};

const chartWidth = Math.max(280, Dimensions.get("window").width - spacing.lg * 4);
const chartConfig = {
  backgroundGradientFrom: colors.light.surface,
  backgroundGradientTo: colors.light.surface,
  color: (opacity = 1) => colorWithOpacity(colors.light.primary, opacity),
  decimalPlaces: 0,
  labelColor: () => colors.light.textMuted,
  propsForBackgroundLines: {
    stroke: colors.light.border
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: colors.light.primary
  }
};

export function ScoreTrendChart({ points }: ScoreTrendChartProps) {
  if (points.length === 0) {
    return <EmptyState title="No exam attempts yet" description="Submit a timed exam to begin tracking score trend." />;
  }

  if (points.length < 2) {
    return <EmptyState title="Not enough trend data" description="Complete one more exam to compare score movement over time." />;
  }

  return (
    <View style={styles.chartFrame}>
      <LineChart
        bezier
        chartConfig={chartConfig}
        data={{
          labels: points.map((point) => point.label),
          datasets: [{ data: points.map((point) => point.scorePercent) }]
        }}
        fromZero
        height={220}
        segments={4}
        style={styles.chart}
        width={chartWidth}
        withOuterLines={false}
        yAxisSuffix="%"
      />
    </View>
  );
}

export function DomainPerformanceChart({ scores }: DomainPerformanceChartProps) {
  const hasData = scores.some((score) => score.total > 0);

  if (!hasData) {
    return <EmptyState title="No domain data yet" description="Complete exams or practice questions to see domain performance." />;
  }

  return (
    <View style={styles.chartStack}>
      <View style={styles.chartFrame}>
        <BarChart
          chartConfig={chartConfig}
          data={{
            labels: ["Setup", "Plan", "Ops", "IAM"],
            datasets: [{ data: scores.map((score) => score.percent) }]
          }}
          fromZero
          height={220}
          segments={4}
          showValuesOnTopOfBars
          style={styles.chart}
          width={chartWidth}
          yAxisLabel=""
          yAxisSuffix="%"
        />
      </View>
      {scores.map((score) => (
        <View key={score.id} style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>{score.label}</Text>
          <Text style={styles.scoreValue}>
            {score.correct}/{score.total} · {score.percent}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chartFrame: {
    overflow: "hidden"
  },
  chart: {
    borderRadius: radius.md,
    marginLeft: -spacing.md
  },
  chartStack: {
    gap: spacing.md
  },
  scoreRow: {
    gap: spacing.xs
  },
  scoreLabel: {
    ...typography.bodyStrong,
    color: colors.light.textPrimary
  },
  scoreValue: {
    ...typography.caption,
    color: colors.light.textSecondary
  }
});

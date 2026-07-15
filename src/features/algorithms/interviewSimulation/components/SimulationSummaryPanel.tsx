import { StyleSheet, Text, View } from "react-native";

import { Card, ProgressBar, SectionHeader } from "../../../../components";
import type { AlgorithmsInterviewSimulationBreakdown, AlgorithmsInterviewSimulationReviewRow, AlgorithmsInterviewSimulationTerminalProjection } from "../../../../application/algorithms";
import { colors, spacing, typography } from "../../../../theme";
import type { SimulationCompletionKind } from "../model";
import { simulationCompletionLabel } from "../model";

type SimulationSummaryPanelProps = {
  completionKind: SimulationCompletionKind;
  projection: AlgorithmsInterviewSimulationTerminalProjection;
};

/** Renders values already projected from immutable submitted outcomes. */
export function SimulationSummaryPanel({ completionKind, projection }: SimulationSummaryPanelProps) {
  const accuracy = projection.submittedAnswerAccuracy;
  const completion = projection.completionRate;
  return (
    <View style={styles.content}>
      <Card variant="tonal">
        <SectionHeader title="Simulation complete" subtitle={simulationCompletionLabel(completionKind)} />
        <View style={styles.metricGrid}>
          <Metric label="Correct" value={String(projection.outcomes.correct)} tone="success" />
          <Metric label="Partial" value={String(projection.outcomes.partial)} tone="warning" />
          <Metric label="Incorrect" value={String(projection.outcomes.incorrect)} tone="danger" />
          <Metric label="Unanswered" value={String(projection.outcomes.unanswered)} />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Submitted outcomes" subtitle="Immutable final responses" />
        <MetricRow label="Points" value={`${projection.points.earned} / ${projection.points.max}`} />
        <MetricRow label="Submitted answer accuracy" value={accuracy.ratio === null ? "No submitted answers" : `${formatPercent(accuracy.ratio)} (${accuracy.correct} / ${accuracy.submitted})`} />
        <MetricRow label="Completion rate" value={`${formatPercent(completion.ratio)} (${completion.answered} / ${completion.total})`} />
        <MetricRow label="Foreground time used" value={formatForegroundDuration(projection.foregroundDurationMs)} />
        <MetricRow label="Flagged" value={String(projection.flags.length)} />
        <MetricRow label="Answer changes" value="Not recorded for this session" />
      </Card>

      <BreakdownPanel title="Mental units" rows={projection.mentalUnitBreakdown} />
      <BreakdownPanel title="Primary skill atoms" rows={projection.primarySkillBreakdown} />
      <TerminalRows title="Missed" rows={projection.missedRows} />
      <TerminalRows title="Unanswered" rows={projection.unansweredRows} />

      <Card variant="tonal">
        <SectionHeader title="Recommended next step" subtitle={recommendationLabel(projection)} />
        {projection.recommendation.nextAction ? <Text style={styles.body}>{projection.recommendation.nextAction}</Text> : null}
      </Card>
    </View>
  );
}

function Metric({ label, tone = "neutral", value }: { label: string; tone?: "neutral" | "success" | "warning" | "danger"; value: string }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, tone === "success" ? styles.success : null, tone === "warning" ? styles.warning : null, tone === "danger" ? styles.danger : null]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.metricRow}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

function BreakdownPanel({ rows, title }: { rows: readonly AlgorithmsInterviewSimulationBreakdown[]; title: string }) {
  return (
    <Card>
      <SectionHeader title={title} subtitle={rows.length ? "Finalized outcome breakdown" : "No finalized entries"} />
      {rows.map((row) => <View key={row.id} style={styles.breakdownRow}><View style={styles.breakdownHeading}><Text style={styles.breakdownId}>{row.id}</Text><Text style={styles.breakdownValue}>{row.points.earned} / {row.points.max}</Text></View><ProgressBar progress={row.points.max === 0 ? 0 : row.points.earned / row.points.max} /><Text style={styles.breakdownMeta}>{row.correct} correct · {row.partial} partial · {row.incorrect} incorrect · {row.unanswered} unanswered</Text></View>)}
    </Card>
  );
}

/** These rows are finalized outcome pointers, not a second scoring or review path. */
function TerminalRows({ rows, title }: { rows: readonly AlgorithmsInterviewSimulationReviewRow[]; title: string }) {
  return (
    <Card>
      <SectionHeader title={title} subtitle={rows.length ? `${rows.length} finalized item${rows.length === 1 ? "" : "s"}` : "None"} />
      {rows.map((row) => <View key={row.occurrenceId} style={styles.terminalRow}><View style={styles.breakdownHeading}><Text style={styles.breakdownId}>Question {row.index + 1}{row.flagged ? " · Flagged" : ""}</Text><Text style={row.result === "unanswered" ? styles.unansweredLabel : styles.missedLabel}>{row.result === "partial" ? "Partial" : row.result === "incorrect" ? "Incorrect" : "Unanswered"}</Text></View><Text numberOfLines={2} style={styles.terminalPrompt}>{row.prompt}</Text></View>)}
    </Card>
  );
}

function recommendationLabel(projection: AlgorithmsInterviewSimulationTerminalProjection): string {
  const recommendation = projection.recommendation;
  if (recommendation.kind === "review_missed_primary_skill") return `Review ${recommendation.primarySkillAtomId ?? "the selected skill"}`;
  if (recommendation.kind === "complete_unanswered") return "Complete the unanswered items in a later practice session";
  return "Continue the roadmap";
}

export function formatForegroundDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: { backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.border, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, flexGrow: 1, minWidth: 120, padding: spacing.md },
  metricValue: { ...typography.heading, color: colors.dark.textPrimary },
  metricLabel: { ...typography.caption, color: colors.dark.textSecondary },
  success: { color: colors.dark.success },
  warning: { color: colors.dark.warning },
  danger: { color: colors.dark.danger },
  metricRow: { alignItems: "baseline", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  rowLabel: { ...typography.small, color: colors.dark.textSecondary, flex: 1 },
  rowValue: { ...typography.bodyStrong, color: colors.dark.textPrimary, textAlign: "right" },
  breakdownRow: { gap: spacing.sm },
  breakdownHeading: { alignItems: "baseline", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  breakdownId: { ...typography.small, color: colors.dark.textPrimary, flex: 1 },
  breakdownValue: { ...typography.small, color: colors.dark.textSecondary },
  breakdownMeta: { ...typography.caption, color: colors.dark.textSecondary },
  terminalRow: { borderTopColor: colors.dark.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.xs, paddingTop: spacing.sm },
  terminalPrompt: { ...typography.small, color: colors.dark.textPrimary },
  missedLabel: { ...typography.caption, color: colors.dark.danger },
  unansweredLabel: { ...typography.caption, color: colors.dark.textMuted },
  body: { ...typography.body, color: colors.dark.textPrimary },
});

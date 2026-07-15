import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from "../../../components";
import type { AlgorithmsInterviewSimulationReviewDetail, AlgorithmsInterviewSimulationReviewFilter, AlgorithmsInterviewSimulationReviewRow } from "../../../application/algorithms";
import { colors, radius, spacing, typography } from "../../../theme";
import type { SimulationTerminalController } from "./model";
import { readSimulationReviewDetail, readSimulationReviewRows, SIMULATION_REVIEW_FILTERS } from "./model";

type AlgorithmsInterviewSimulationReviewScreenProps = {
  controller: SimulationTerminalController;
  initialFilter?: AlgorithmsInterviewSimulationReviewFilter;
  onBackToSummary: () => void;
  onReturnHome: () => void;
};

/** Terminal answer review backed exclusively by finalized controller reads. */
export function AlgorithmsInterviewSimulationReviewScreen({
  controller,
  initialFilter = "all",
  onBackToSummary,
  onReturnHome,
}: AlgorithmsInterviewSimulationReviewScreenProps) {
  const [filter, setFilter] = useState<AlgorithmsInterviewSimulationReviewFilter>(initialFilter);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const rows = readSimulationReviewRows(controller, filter);
  const detail = selectedOccurrenceId ? readSimulationReviewDetail(controller, selectedOccurrenceId) : null;

  if (rows.kind === "unavailable") return <Screen><EmptyState title="Answer review unavailable" description={rows.message} /></Screen>;
  if (detail?.kind === "unavailable") return <Screen><EmptyState title="Answer detail unavailable" description={detail.message} /></Screen>;
  if (detail?.kind === "ready") return <SimulationReviewDetail detail={detail.value} onBack={() => setSelectedOccurrenceId(null)} />;

  return (
    <Screen footer={<Card variant="tonal"><Button onPress={onBackToSummary} variant="secondary">Back to summary</Button><Button onPress={onReturnHome} variant="ghost">Return home</Button></Card>}>
      <Card>
        <SectionHeader title="Answer review" subtitle="Submitted final responses" />
        <View accessibilityRole="tablist" style={styles.filterRow}>
          {SIMULATION_REVIEW_FILTERS.map((value) => <FilterChip active={filter === value} key={value} label={filterLabel(value)} onPress={() => setFilter(value)} />)}
        </View>
      </Card>
      {rows.value.length ? <View style={styles.list}>{rows.value.map((row) => <SimulationReviewRow key={row.occurrenceId} onPress={() => setSelectedOccurrenceId(row.occurrenceId)} row={row} />)}</View> : <Card><EmptyState title="No answers in this view" description="Choose another finalized-outcome filter." /></Card>}
    </Screen>
  );
}

type SimulationReviewDetailProps = {
  detail: AlgorithmsInterviewSimulationReviewDetail;
  onBack: () => void;
};

/** Details are local presentation state only; expansion never mutates evidence. */
export function SimulationReviewDetail({ detail, onBack }: SimulationReviewDetailProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  return (
    <Screen footer={<Card variant="tonal"><Button onPress={onBack} variant="secondary">Back to review</Button></Card>}>
      <Card>
        <SectionHeader title={`Question ${detail.index + 1}`} subtitle={resultLabel(detail.result)} action={<ResultBadge result={detail.result} />} />
        {detail.title ? <Text style={styles.title}>{detail.title}</Text> : null}
        <Text style={styles.prompt}>{detail.prompt}</Text>
        {detail.mentalUnitId ? <Text style={styles.mentalUnit}>Mental unit: {detail.mentalUnitId}</Text> : null}
        {detail.flagged ? <Badge label="Flagged" tone="warning" /> : null}
      </Card>
      <ResponsePanel label="Your submitted answer" response={detail.selectedResponse} tone="selected" />
      <ResponsePanel label="Correct answer" response={detail.correctResponse} tone="correct" />
      <Card variant="tonal"><Text accessibilityRole="header" style={styles.detailHeading}>Reason</Text><Text style={styles.reason}>{detail.reason}</Text></Card>
      {detail.details ? <Card><Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsExpanded }} onPress={() => setDetailsExpanded((value) => !value)} style={({ pressed }) => [styles.detailsTrigger, pressed ? styles.pressed : null]}><Text accessibilityRole="header" style={styles.detailHeading}>Details</Text><Text style={styles.disclosure}>{detailsExpanded ? "Hide" : "Show"}</Text></Pressable>{detailsExpanded ? <Text style={styles.reason}>{detail.details}</Text> : null}</Card> : null}
    </Screen>
  );
}

function SimulationReviewRow({ onPress, row }: { onPress: () => void; row: AlgorithmsInterviewSimulationReviewRow }) {
  return <Card onPress={onPress} variant="interactive"><View style={styles.rowHeading}><Text style={styles.questionNumber}>Question {row.index + 1}</Text><View style={styles.badges}><ResultBadge result={row.result} />{row.flagged ? <Badge label="Flagged" tone="warning" /> : null}</View></View>{row.title ? <Text style={styles.rowTitle}>{row.title}</Text> : null}<Text numberOfLines={2} style={styles.rowPrompt}>{row.prompt}</Text><Text style={styles.mentalUnit}>{row.mentalUnitId ? `Mental unit: ${row.mentalUnitId}` : "Mental unit unavailable"}</Text></Card>;
}

function ResponsePanel({ label, response, tone }: { label: string; response: AlgorithmsInterviewSimulationReviewDetail["correctResponse"] | null; tone: "selected" | "correct" }) {
  return <Card style={tone === "selected" ? styles.selectedResponse : styles.correctResponse}><Text accessibilityRole="header" style={styles.detailHeading}>{label}</Text>{response ? <ResponseValues response={response} /> : <Text style={styles.unanswered}>No answer submitted</Text>}</Card>;
}

function ResponseValues({ response }: { response: NonNullable<AlgorithmsInterviewSimulationReviewDetail["selectedResponse"]> }) {
  if (response.kind === "choice") return <Text style={styles.responseValue}>Selected option IDs: {response.optionIds.join(", ") || "None"}</Text>;
  if (response.kind === "ordering") return <View style={styles.responseList}>{response.subgoalIds.map((id, index) => <Text key={`${id}:${index}`} style={styles.responseValue}>{index + 1}. {id}</Text>)}</View>;
  return <View style={styles.responseList}>{Object.entries(response.valuesByDimension).sort(([left], [right]) => left.localeCompare(right)).map(([dimension, value]) => <Text key={dimension} style={styles.responseValue}>{dimension}: {value}</Text>)}</View>;
}

function ResultBadge({ result }: { result: AlgorithmsInterviewSimulationReviewRow["result"] }) {
  return <Badge label={resultLabel(result)} tone={result === "correct" ? "success" : result === "partial" ? "warning" : result === "incorrect" ? "danger" : "neutral"} />;
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.filterChip, active ? styles.filterChipActive : null, pressed ? styles.pressed : null]}><Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>{label}</Text></Pressable>;
}

function filterLabel(filter: AlgorithmsInterviewSimulationReviewFilter): string {
  return filter === "all" ? "All" : filter === "incorrect" ? "Incorrect" : filter === "partial" ? "Partial" : filter === "unanswered" ? "Unanswered" : "Flagged";
}

function resultLabel(result: AlgorithmsInterviewSimulationReviewRow["result"]): string {
  return result === "correct" ? "Correct" : result === "partial" ? "Partial" : result === "incorrect" ? "Incorrect" : "Unanswered";
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filterChip: { borderColor: colors.dark.border, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, minHeight: 38, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterChipActive: { backgroundColor: colors.dark.primarySoft, borderColor: colors.dark.primary },
  filterLabel: { ...typography.caption, color: colors.dark.textSecondary },
  filterLabelActive: { color: colors.dark.textPrimary },
  list: { gap: spacing.md },
  rowHeading: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  badges: { alignItems: "flex-end", flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, justifyContent: "flex-end" },
  questionNumber: { ...typography.caption, color: colors.dark.textSecondary, textTransform: "uppercase" },
  rowTitle: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  rowPrompt: { ...typography.small, color: colors.dark.textPrimary },
  mentalUnit: { ...typography.caption, color: colors.dark.textSecondary },
  title: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  prompt: { ...typography.heading, color: colors.dark.textPrimary },
  detailHeading: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  selectedResponse: { borderColor: colors.dark.info, backgroundColor: colors.dark.infoSoft },
  correctResponse: { borderColor: colors.dark.success, backgroundColor: colors.dark.successSoft },
  responseValue: { ...typography.body, color: colors.dark.textPrimary },
  responseList: { gap: spacing.xs },
  unanswered: { ...typography.body, color: colors.dark.textMuted },
  reason: { ...typography.body, color: colors.dark.textPrimary },
  detailsTrigger: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 44 },
  disclosure: { ...typography.caption, color: colors.dark.primary },
  pressed: { opacity: 0.8 },
});

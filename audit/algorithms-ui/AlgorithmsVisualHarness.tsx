import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PracticeSessionSurface, type PracticeSessionSurfaceProps } from "../../src/features/practice/PracticeSessionSurface";
import { SimulationSessionSurface } from "../../src/features/simulation/SimulationSessionSurface";
import type { SimulationSurfaceProjection } from "../../src/features/simulation/simulationProjection";
import type { PublishedAlgorithmComplexityInteraction } from "../../src/content/contracts";
import { colors, spacing, typography } from "../../src/theme";
import { APPROVED_ALGORITHMS_AUDIT_STATES, buildAlgorithmsVisualFixtures, getAlgorithmsAuditItem, type AlgorithmsVisualFixture } from "./fixtureCatalog";

const noop = () => undefined;

/**
 * Development-audit host only. It receives no production navigation, storage,
 * lifecycle, timer, or mutation dependency; every state is an immutable view
 * projection constructed from the pinned artifact.
 */
export function AlgorithmsVisualHarness() {
  const fixtures = useMemo(buildAlgorithmsVisualFixtures, []);
  const [stateId, setStateId] = useState<(typeof APPROVED_ALGORITHMS_AUDIT_STATES)[number]>("P-01");
  const stateIndex = APPROVED_ALGORITHMS_AUDIT_STATES.indexOf(stateId);
  const fixture = fixtures.find((entry) => entry.id === stateId)!;
  return (
    <View style={styles.root} testID="algorithms-audit-host">
      <View style={styles.pager}>
        <Pressable accessibilityLabel="Previous audit state" accessibilityRole="button" disabled={stateIndex === 0} onPress={() => setStateId(APPROVED_ALGORITHMS_AUDIT_STATES[stateIndex - 1]!)} style={stateIndex === 0 ? styles.disabledPagerButton : styles.pagerButton} testID="algorithms-audit-previous"><Text style={styles.optionText}>Previous</Text></Pressable>
        <Text accessibilityLiveRegion="polite" style={styles.stateLabel} testID={`algorithms-audit-current-${stateId}`}>{stateId}</Text>
        <Pressable accessibilityLabel="Next audit state" accessibilityRole="button" disabled={stateIndex === fixtures.length - 1} onPress={() => setStateId(APPROVED_ALGORITHMS_AUDIT_STATES[stateIndex + 1]!)} style={stateIndex === fixtures.length - 1 ? styles.disabledPagerButton : styles.pagerButton} testID="algorithms-audit-next"><Text style={styles.optionText}>Next</Text></Pressable>
      </View>
      <ScrollView horizontal style={styles.selectorScroll} contentContainerStyle={styles.selector} accessibilityLabel="Algorithms visual audit state selector">
        {fixtures.map((entry) => <Pressable key={entry.id} accessibilityRole="button" accessibilityState={{ selected: entry.id === stateId }} onPress={() => setStateId(entry.id)} style={entry.id === stateId ? styles.selected : styles.option}><Text style={styles.optionText}>{entry.id}</Text></Pressable>)}
      </ScrollView>
      {fixture.surface === "practice" ? <PracticeSessionSurface {...practiceProjection(fixture)} /> : <SimulationSessionSurface projection={simulationProjection(fixture)} />}
    </View>
  );
}

function practiceProjection(fixture: AlgorithmsVisualFixture): PracticeSessionSurfaceProps {
  const item = getAlgorithmsAuditItem(fixture.interaction, fixture.id);
  const phase = fixture.operation === "preparing" ? "preparing" : fixture.operation === "leave" || fixture.operation === "abandon_confirmation" ? "unanswered" : fixture.operation === "abandonment_failed_before_journal" ? "submit_journal_failed" : fixture.operation as PracticeSessionSurfaceProps["phase"];
  const feedback = fixture.id === "P-06" || fixture.id === "P-07" || fixture.id === "P-08" || fixture.id === "P-10" ? { reason: item.feedback.reason, details: item.feedback.details } : undefined;
  return {
    exit: fixture.operation === "leave" ? { kind: "leave" } : fixture.operation === "abandon_confirmation" ? { kind: "abandon_confirmation" } : { kind: "none" },
    feedback, isFinalPosition: fixture.id === "P-11", modeLabel: "Guided Practice", positionLabel: "1 of 20", progress: 0.05, timerLabel: "Active time 12:34",
    notice: notice(fixture.operation), phase: phase === "completed" ? "completed" : phase,
    primaryAction: { enabled: fixture.operation === "unanswered" || fixture.operation === "feedback" || fixture.operation === "advance_failed" || fixture.operation === "completed", label: fixture.operation === "feedback" ? "Next" : fixture.operation === "completed" ? "View session result" : "Check answer", loading: fixture.operation === "submitting_before_journal" || fixture.operation === "advancing" },
    question: phase === "preparing" ? undefined : { prompt: item.prompt, constraints: item.constraints, responseControl: practiceControl(item, fixture.id) },
    onAbandon: noop, onChoicePress: noop, onComplexityValuePress: noop, onConfirmLeave: noop, onDismissExit: noop, onOrderingMove: noop, onPrimaryAction: noop, onRequestAbandon: noop, onRequestLeave: noop, onRetry: fixture.operation.includes("failed") ? noop : undefined, retryLabel: fixture.operation.includes("failed") ? "Retry safely" : undefined,
  };
}

function practiceControl(item: ReturnType<typeof getAlgorithmsAuditItem>, id: string): NonNullable<PracticeSessionSurfaceProps["question"]>["responseControl"] {
  if (item.interaction.type === "choice") return { kind: "choice", selectionMode: item.interaction.selectionMode, options: item.interaction.options.map((option, index) => ({ id: option.id, text: option.text, state: id === "P-08" && index === 0 ? "incorrect" : id === "P-08" && index === 1 ? "omitted_correct" : id === "P-07" && index === 0 ? "correct" : index === 0 ? "selected" : "neutral" })) };
  if (item.interaction.type === "ordering") return { kind: "ordering", elements: item.interaction.elements.map((element) => ({ id: element.id, text: element.text })) };
  if (item.interaction.type === "complexity") { const interaction = item.interaction as PublishedAlgorithmComplexityInteraction; return { kind: "complexity", dimensions: interaction.checkedDimensions.map((dimension) => ({ id: dimension, values: interaction.availableValuesByDimension[dimension] ?? [], selectedValue: interaction.availableValuesByDimension[dimension]?.[0] })) }; }
  throw new Error("Unsupported bundled interaction for audit host.");
}

function simulationProjection(fixture: AlgorithmsVisualFixture): SimulationSurfaceProjection {
  const item = getAlgorithmsAuditItem(fixture.interaction, fixture.id);
  const unavailable = ["insufficient_content", "missing_draft", "version_mismatch", "corrupt_state"].includes(fixture.operation);
  const frozen = ["expired", "frozen", "finalization_journal_pending", "finalization_journal_failed", "materializing", "materialization_failed", "verification_failed", "recovery_required", "recovered_finalizing", "timer_recovery_failed"].includes(fixture.operation);
  const state: SimulationSurfaceProjection["state"] = fixture.operation === "preparing" ? "preparing" : fixture.operation === "insufficient_content" ? "insufficient_content" : fixture.operation === "saving" ? "saving" : fixture.operation === "save_failed" ? "save_failed" : fixture.operation === "stale_revision" ? "stale_revision" : fixture.operation === "finish_confirmation" ? "finish_confirmation" : fixture.operation === "leave_confirmation" ? "leave_confirmation" : fixture.operation === "abandon_confirmation" ? "abandon_confirmation" : fixture.operation === "abandoning" ? "abandoning" : fixture.operation === "abandonment_failed" ? "abandon_failed" : fixture.operation === "expired" ? "expired" : fixture.operation === "frozen" ? "frozen" : fixture.operation === "finalization_journal_pending" ? "finalization_journal_pending" : fixture.operation === "finalization_journal_failed" ? "finalization_journal_failed" : fixture.operation === "materializing" || fixture.operation === "recovered_finalizing" ? "finalizing" : fixture.operation === "completed" ? "completed" : fixture.operation === "timer_recovery_failed" ? "timer_recovery_failed" : fixture.operation === "missing_draft" ? "missing_draft" : fixture.operation === "version_mismatch" ? "version_mismatch" : fixture.operation === "corrupt_state" ? "corrupt_state" : fixture.operation.includes("failed") ? "recovering" : "editable";
  const positions = Array.from({ length: 40 }, (_, index) => ({ occurrenceId: `audit-${index + 1}`, state: frozen ? "frozen" as const : index === 0 ? "current" as const : index % 3 === 0 ? "answered" as const : "unanswered" as const }));
  const base = { state, title: unavailable ? "Interview Simulation unavailable" : "Interview Simulation", modeLabel: "Interview Simulation", positionLabel: unavailable || fixture.operation === "preparing" ? undefined : "1 of 40", progress: unavailable || fixture.operation === "preparing" ? undefined : 0.025, timerLabel: fixture.operation === "preparing" ? undefined : fixture.operation === "expired" ? "00:00" : "31:42", notice: { tone: unavailable || fixture.operation.includes("failed") || fixture.operation === "stale_revision" ? "error" as const : "neutral" as const, message: unavailable ? "The canonical simulation state is unavailable; no substitute session was created." : fixture.operation === "editable_unsaved" ? "Not saved yet" : fixture.operation === "editable_saved" ? "Saved" : fixture.operation === "saving" ? "Saving…" : fixture.operation === "expired" ? "Time expired. Freezing your latest saved draft." : "Immutable application projection fixture." }, navigator: unavailable || fixture.operation === "preparing" ? undefined : positions };
  const question = !unavailable && !frozen && !["finish_confirmation", "leave_confirmation", "abandon_confirmation"].includes(fixture.operation) ? { question: simulationQuestion(item) } : {};
  const completion = fixture.operation === "completed" ? { completion: { answeredCount: 32, unansweredCount: 8, correctCount: 20, partialCount: 5, incorrectCount: 7, earnedPoints: 25, maxPoints: 40 } } : {};
  const confirmation = ["finish_confirmation", "leave_confirmation", "abandon_confirmation"].includes(fixture.operation) ? { confirmation: { title: fixture.operation === "finish_confirmation" ? "Finish with unanswered questions?" : fixture.operation === "abandon_confirmation" ? "Abandon this simulation?" : "Leave and resume later?", description: "This audit fixture does not mutate canonical state.", secondary: { label: "Keep working", onPress: noop, variant: "secondary" as const }, primary: { label: "Continue", onPress: noop } } } : {};
  return { ...base, ...question, ...completion, ...confirmation };
}

function simulationQuestion(item: ReturnType<typeof getAlgorithmsAuditItem>): NonNullable<SimulationSurfaceProjection["question"]> {
  if (item.interaction.type === "choice") return { prompt: item.prompt, control: { kind: "choice", selectionMode: item.interaction.selectionMode, options: item.interaction.options.map((option, index) => ({ id: option.id, label: option.text, selected: index === 0 })) } };
  if (item.interaction.type === "ordering") return { prompt: item.prompt, control: { kind: "ordering", elements: item.interaction.elements.map((element) => ({ id: element.id, label: element.text })) } };
  if (item.interaction.type === "complexity") { const interaction = item.interaction as PublishedAlgorithmComplexityInteraction; return { prompt: item.prompt, control: { kind: "complexity", dimensions: interaction.checkedDimensions.map((dimension) => ({ id: dimension, label: dimension, values: interaction.availableValuesByDimension[dimension] ?? [] })) } }; }
  throw new Error("Unsupported bundled interaction for audit host.");
}

function notice(operation: string) { return operation.includes("failed") || operation.includes("pending") ? { tone: "error" as const, message: "The canonical operation requires its explicit safe recovery path." } : undefined; }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.dark.background, paddingTop: 54 }, pager: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.sm, paddingTop: spacing.sm }, pagerButton: { borderColor: colors.dark.border, borderWidth: 1, minWidth: 84, padding: spacing.sm }, disabledPagerButton: { borderColor: colors.dark.border, borderWidth: 1, minWidth: 84, opacity: 0.45, padding: spacing.sm }, stateLabel: { ...typography.caption, color: colors.dark.textPrimary }, selectorScroll: { flexGrow: 0, flexShrink: 0, maxHeight: 52 }, selector: { alignItems: "center", gap: spacing.xs, padding: spacing.sm }, option: { borderColor: colors.dark.border, borderWidth: 1, padding: spacing.sm }, selected: { backgroundColor: colors.dark.primarySoft, borderColor: colors.dark.primary, borderWidth: 1, padding: spacing.sm }, optionText: { ...typography.caption, color: colors.dark.textPrimary } });

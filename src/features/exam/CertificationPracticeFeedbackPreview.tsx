import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, EmptyState, Screen } from "../../components";
import { buildPracticeResponseControl } from "../practice/practiceSessionPresentation";
import { PracticeSessionSurface } from "../practice/PracticeSessionSurface";
import type { CertificationPracticeAnswerPreview } from "../../testing/certificationPracticeAnswerFixture";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { spacing, typography } from "../../theme";

export function CertificationPracticeFeedbackPreview({
  index,
  loadPreviews,
  onBackToResults,
  onExit,
  onNext,
  onPrevious,
}: Readonly<{
  index: number;
  loadPreviews: () => Promise<readonly CertificationPracticeAnswerPreview[]>;
  onBackToResults: () => void;
  onExit: () => void;
  onNext: () => void;
  onPrevious: () => void;
}>) {
  const styles = useThemedStyles(createStyles);
  const [state, setState] = useState<Readonly<{ kind: "pending" }> | Readonly<{ kind: "ready"; previews: readonly CertificationPracticeAnswerPreview[] }> | Readonly<{ kind: "unavailable" }>>({ kind: "pending" });
  useEffect(() => {
    let live = true;
    void loadPreviews().then((previews) => { if (live) setState({ kind: "ready", previews }); }).catch(() => { if (live) setState({ kind: "unavailable" }); });
    return () => { live = false; };
  }, [loadPreviews]);
  if (state.kind === "pending") return <Screen edges={["top", "bottom"]}><Text style={styles.notice}>Loading local practice preview…</Text></Screen>;
  if (state.kind === "unavailable" || !state.previews[index]) return <Screen edges={["top", "bottom"]}><EmptyState title="Practice preview unavailable" description="The local practice fixture could not load this answer." actionLabel="Back to results" onActionPress={onBackToResults} /></Screen>;
  const preview = state.previews[index]!;
  const responseControl = buildPracticeResponseControl({
    choiceSelectionMode: preview.question.interaction.type === "choice_multiple" ? "multiple" : "single",
    feedbackControls: preview.feedbackControls,
    localResponse: null,
    renderer: { kind: "choice", options: preview.question.interaction.options.map((option) => ({ id: option.optionId, selected: false, text: option.text })) },
  });
  const headerAction = <View style={styles.headerAction} testID="patternly:aud15:practice-preview:notice">
    <Text maxFontSizeMultiplier={2} style={styles.noticeText}>Local read-only preview · first five of ten completed answers · no saved result</Text>
    <View style={styles.headerButtons}>
      <Button accessibilityLabel="Back to results" onPress={onBackToResults} style={styles.headerButton} testID="patternly:aud15:practice-preview:results" variant="secondary">Results</Button>
      <Button accessibilityLabel="Exit fixture" onPress={onExit} style={styles.headerButton} testID="patternly:aud15:practice-preview:exit" variant="ghost">Exit</Button>
    </View>
  </View>;
  const actionBar = <View style={styles.toolbar}>
    <View style={styles.positionRow}><Text maxFontSizeMultiplier={2} style={styles.position}>Question {preview.ordinal} / {preview.runtimeIdentity.actualLength}</Text></View>
    <View style={styles.navigationRow}>
      <Button disabled={index === 0} onPress={onPrevious} style={styles.navigationButton} testID="patternly:aud15:practice-preview:previous" variant="secondary">Previous</Button>
      <Button disabled={index === state.previews.length - 1} onPress={onNext} style={styles.navigationButton} testID="patternly:aud15:practice-preview:next">Next</Button>
    </View>
  </View>;
  return <PracticeSessionSurface
      allowLeave={false}
      actionBar={actionBar}
      exit={{ kind: "none" }}
      feedback={preview.feedback}
      feedbackItem={preview.feedbackItem}
      isFinalPosition={false}
      onAbandon={noop}
      onChoicePress={noop}
      onComplexityValuePress={noop}
      onConfirmLeave={noop}
      onDismissExit={noop}
      onOrderingMove={noop}
      onRequestLeave={noop}
      phase="feedback"
      headerAction={headerAction}
      position={{ label: `${preview.ordinal} / ${preview.runtimeIdentity.actualLength}`, accessibilityLabel: `Question ${preview.ordinal} / ${preview.runtimeIdentity.actualLength}` }}
      progress={preview.ordinal / preview.runtimeIdentity.actualLength}
      question={{ constraints: preview.question.constraints, itemId: preview.question.questionId, prompt: preview.question.prompt, responseControl }}
      runtimeIdentity={preview.runtimeIdentity}
    />;
}

function noop() {}

const createStyles = (palette: AppColors) => StyleSheet.create({
  headerAction: { alignItems: "stretch", alignSelf: "stretch", gap: spacing.xs, width: "100%" },
  headerButton: { flex: 1, minWidth: 0, paddingHorizontal: spacing.md },
  headerButtons: { flexDirection: "row", gap: spacing.xs, width: "100%" },
  navigationButton: { flex: 1, minWidth: 0 },
  navigationRow: { flexDirection: "row", gap: spacing.sm },
  notice: { ...typography.body, color: palette.textSecondary, padding: spacing.lg },
  noticeText: { ...typography.caption, color: palette.textSecondary },
  position: { ...typography.bodyStrong, color: palette.textPrimary, textAlign: "center" },
  positionRow: { alignItems: "center", marginBottom: spacing.xs },
  toolbar: { gap: spacing.xs, marginBottom: spacing.sm },
});

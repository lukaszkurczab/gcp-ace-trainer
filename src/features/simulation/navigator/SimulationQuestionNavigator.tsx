import { useEffect, useState } from "react";
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { Button, Icon } from "../../../components";
import { useAppPreferences, useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";
import { radius, spacing, typography } from "../../../theme";
import type { SimulationNavigatorPosition, SimulationNavigatorSelectionResult } from "../simulationProjection";
import { hasCanonicalSimulationNavigator } from "../simulationViewModel";
import { navigatorCellLabel, navigatorGridColumns, navigatorStateLabel } from "./navigatorPresentation";

type NavigatorFeedback = Readonly<{ kind: "incomplete_response" | "save_failed"; occurrenceId: string }> | null;

type SimulationQuestionNavigatorProps = Readonly<{
  onDismiss: () => void;
  onOccurrencePress: (occurrenceId: string) => Promise<SimulationNavigatorSelectionResult>;
  positions?: readonly SimulationNavigatorPosition[];
  visible: boolean;
}>;

/** The navigator is a separate modal surface; it only asks its owning route to perform a canonical jump. */
export function SimulationQuestionNavigator({ onDismiss, onOccurrencePress, positions, visible }: SimulationQuestionNavigatorProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const { colors: palette, t } = useAppPreferences();
  const [feedback, setFeedback] = useState<NavigatorFeedback>(null);
  const [savingOccurrenceId, setSavingOccurrenceId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const columns = navigatorGridColumns(fontScale);
  const validPositions = hasCanonicalSimulationNavigator(positions) ? positions : [];

  async function select(occurrenceId: string) {
    setFeedback(null);
    setSavingOccurrenceId(occurrenceId);
    const result = await onOccurrencePress(occurrenceId);
    setSavingOccurrenceId(null);
    if (result === "navigated") {
      onDismiss();
      return;
    }
    setFeedback({ kind: result, occurrenceId });
  }

  return (
    <Modal animationType={reduceMotion ? "none" : "slide"} onRequestClose={onDismiss} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel={t("Close question navigator")} accessibilityRole="button" onPress={onDismiss} style={styles.dismissArea} />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View><Text style={styles.title}>{t("Question navigator")}</Text><Text style={styles.summary}>{`${validPositions.filter((position) => position.state === "answered").length} ${t("answered")} · ${validPositions.filter((position) => position.state !== "answered").length} ${t("unanswered")}`}</Text></View>
            <Pressable accessibilityLabel={t("Close question navigator")} accessibilityRole="button" onPress={onDismiss} style={styles.close}><Icon color={palette.textPrimary} name="close" size={20} /></Pressable>
          </View>
          {feedback ? <NavigatorFeedbackBanner feedback={feedback} onRetry={() => void select(feedback.occurrenceId)} /> : null}
          {savingOccurrenceId ? <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.saving}><Text style={styles.savingText}>{t("Saving response…")}</Text></View> : null}
          <ScrollView contentContainerStyle={styles.grid} style={styles.gridScroll}>
            {validPositions.map((position, index) => <NavigatorCell columns={columns} disabled={Boolean(savingOccurrenceId)} index={index} key={position.occurrenceId} onPress={() => void select(position.occurrenceId)} position={position} />)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function NavigatorFeedbackBanner({ feedback, onRetry }: Readonly<{ feedback: Exclude<NavigatorFeedback, null>; onRetry: () => void }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const saveFailed = feedback.kind === "save_failed";
  return <View style={[styles.feedback, saveFailed ? styles.feedbackError : styles.feedbackWarning]}><View accessible accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.feedbackMessage}><Text style={styles.feedbackText}>{t(saveFailed ? "Couldn't save this response." : "Complete the response before leaving this question.")}</Text></View>{saveFailed ? <Button onPress={onRetry} variant="secondary">{t("Try again")}</Button> : null}</View>;
}

function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let subscribed = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (subscribed) setReduceMotion(enabled); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { subscribed = false; subscription.remove(); };
  }, []);
  return reduceMotion;
}

function NavigatorCell({ columns, disabled, index, onPress, position }: Readonly<{ columns: number; disabled: boolean; index: number; onPress: () => void; position: SimulationNavigatorPosition }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const isAnswered = position.state === "answered";
  const isCurrent = position.state === "current";
  return <Pressable accessibilityLabel={t(navigatorCellLabel(position, index))} accessibilityRole="button" accessibilityState={{ disabled, selected: isCurrent }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.cell, { flexBasis: columns === 5 ? "18.4%" : "23.5%" }, isAnswered ? styles.answeredCell : null, isCurrent ? styles.currentCell : null, pressed && !disabled ? styles.pressedCell : null]}><Text style={[styles.cellText, isCurrent ? styles.currentCellText : null]}>{index + 1}</Text>{isAnswered ? <View accessible={false} style={styles.savedDot} /> : null}<Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.stateMarker}>{navigatorStateLabel(position)}</Text></Pressable>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  answeredCell: { borderColor: palette.success, borderWidth: 1 },
  backdrop: { backgroundColor: "rgba(2, 6, 23, 0.56)", flex: 1, justifyContent: "flex-end" },
  cell: { alignItems: "center", borderColor: palette.borderStrong, borderRadius: radius.md, borderWidth: 1, justifyContent: "center", minHeight: 48, overflow: "hidden", position: "relative" },
  cellText: { ...typography.bodyStrong, color: palette.textPrimary },
  close: { alignItems: "center", justifyContent: "center", minHeight: 48, minWidth: 48 },
  currentCell: { backgroundColor: palette.primary, borderColor: palette.primary },
  currentCellText: { color: palette.background },
  dismissArea: { ...StyleSheet.absoluteFillObject },
  feedback: { alignItems: "center", borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, justifyContent: "space-between", padding: spacing.sm },
  feedbackError: { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
  feedbackText: { ...typography.small, color: palette.textPrimary, flex: 1 },
  feedbackMessage: { flex: 1 },
  feedbackWarning: { backgroundColor: palette.warningSoft, borderColor: palette.warning },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  gridScroll: { flexShrink: 1 },
  handle: { alignSelf: "center", backgroundColor: palette.borderStrong, borderRadius: radius.pill, height: 4, width: 48 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  pressedCell: { opacity: 0.78 },
  savedDot: { backgroundColor: palette.success, borderColor: palette.surface, borderRadius: radius.pill, borderWidth: 1, height: 10, position: "absolute", right: spacing.xs, top: spacing.xs, width: 10 },
  saving: { backgroundColor: palette.primarySoft, borderRadius: radius.md, padding: spacing.sm },
  savingText: { ...typography.small, color: palette.primary },
  sheet: { backgroundColor: palette.elevatedSurface, borderColor: palette.borderStrong, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, gap: spacing.md, maxHeight: "86%", padding: spacing.lg },
  stateMarker: { height: 0, opacity: 0, width: 0 },
  summary: { ...typography.small, color: palette.textSecondary },
  title: { ...typography.heading, color: palette.textPrimary },
});

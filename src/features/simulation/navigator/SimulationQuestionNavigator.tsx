import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { Button, Icon, IconButton } from "../../../components";
import { useAppPreferences, useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";
import { effects, radius, spacing, typography } from "../../../theme";
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
  const { t } = useTranslation("common");
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
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <Text maxFontSizeMultiplier={2} style={styles.title}>{t("Question navigator")}</Text>
            <IconButton accessibilityLabel={t("Close question navigator")} icon="close" onPress={onDismiss} />
          </View>
          <View style={styles.summaryRow}>
            <Text maxFontSizeMultiplier={2} style={styles.answeredSummary}>{`${validPositions.filter((position) => position.state === "answered").length} ${t("answered")}`}</Text>
            <View accessible={false} style={styles.summaryDot} />
            <Text maxFontSizeMultiplier={2} style={styles.unansweredSummary}>{`${validPositions.filter((position) => position.state !== "answered").length} ${t("unanswered")}`}</Text>
          </View>
          {feedback ? <NavigatorFeedbackBanner feedback={feedback} onRetry={() => void select(feedback.occurrenceId)} /> : null}
          {savingOccurrenceId ? <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.saving}><Text maxFontSizeMultiplier={2} style={styles.savingText}>{t("Saving response…")}</Text></View> : null}
          <ScrollView contentContainerStyle={styles.grid} style={styles.gridScroll}>
            {validPositions.map((position, index) => <NavigatorCell columns={columns} disabled={Boolean(savingOccurrenceId) || feedback?.kind === "save_failed"} frozen={feedback?.kind === "save_failed"} index={index} key={position.occurrenceId} onPress={() => void select(position.occurrenceId)} position={position} />)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function NavigatorFeedbackBanner({ feedback, onRetry }: Readonly<{ feedback: Exclude<NavigatorFeedback, null>; onRetry: () => void }>) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const saveFailed = feedback.kind === "save_failed";
  if (saveFailed) {
    return <View style={styles.saveFailureStack}>
      <View accessible accessibilityLabel={t("Couldn't save this response. Your current answer is still here.")} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.operationNotice}>
        <Icon color={palette.warning} name="alert-triangle" size={20} />
        <Text maxFontSizeMultiplier={2} style={styles.operationNoticeText}>{t("Couldn't save this response. Your current answer is still here.")}</Text>
      </View>
      <Button onPress={onRetry} style={styles.fullWidthAction}>{t("Try again")}</Button>
    </View>;
  }
  return <View style={[styles.feedback, styles.feedbackWarning]}><View accessible accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.feedbackMessage}><Text maxFontSizeMultiplier={2} style={styles.feedbackText}>{t("Complete the response before leaving this question.")}</Text></View></View>;
}

export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let subscribed = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (subscribed) setReduceMotion(enabled); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { subscribed = false; subscription.remove(); };
  }, []);
  return reduceMotion;
}

function NavigatorCell({ columns, disabled, frozen = false, index, onPress, position }: Readonly<{ columns: number; disabled: boolean; frozen?: boolean; index: number; onPress: () => void; position: SimulationNavigatorPosition }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const isAnswered = position.state === "answered";
  const isCurrent = position.state === "current";
  const effectiveDisabled = disabled || frozen;
  return <Pressable accessibilityLabel={t(navigatorCellLabel(position, index, frozen))} accessibilityRole="button" accessibilityState={{ disabled: effectiveDisabled, selected: frozen ? false : isCurrent }} disabled={effectiveDisabled} onPress={onPress} style={({ pressed }) => [styles.cell, { height: columns === 5 ? 56 : 48, width: columns === 5 ? 56 : 48 }, frozen ? styles.frozenCell : null, !frozen && isAnswered ? styles.answeredCell : null, !frozen && isCurrent ? styles.currentCell : null, pressed && !effectiveDisabled ? styles.pressedCell : null]}><Text maxFontSizeMultiplier={2} style={[styles.cellText, frozen ? styles.frozenCellText : null, !frozen && isCurrent ? styles.currentCellText : null]}>{index + 1}</Text><Text maxFontSizeMultiplier={2} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.stateMarker}>{navigatorStateLabel(position, frozen)}</Text></Pressable>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  answeredCell: { borderColor: palette.primary, borderWidth: 1.5 },
  backdrop: { backgroundColor: effects.reviewScrim, flex: 1, justifyContent: "flex-end" },
  cell: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, justifyContent: "center", overflow: "hidden", position: "relative" },
  cellText: { color: palette.textPrimary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  currentCell: { backgroundColor: palette.primary, borderColor: palette.primary },
  currentCellText: { color: palette.background },
  dismissArea: { ...StyleSheet.absoluteFill },
  feedback: { alignItems: "center", borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, justifyContent: "space-between", padding: spacing.sm },
  feedbackText: { ...typography.small, color: palette.textPrimary, flex: 1 },
  feedbackMessage: { flex: 1 },
  feedbackWarning: { backgroundColor: palette.warningSoft, borderColor: palette.warning },
  fullWidthAction: { alignSelf: "stretch" },
  grid: { columnGap: spacing.sm, flexDirection: "row", flexWrap: "wrap", paddingBottom: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.md, rowGap: spacing.sm },
  gridScroll: { flexShrink: 1, width: "100%" },
  handle: { alignSelf: "center", backgroundColor: palette.borderStrong, borderRadius: radius.pill, height: 4, width: 40 },
  handleWrap: { alignItems: "center", height: 20, justifyContent: "center", width: "100%" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  pressedCell: { opacity: 0.78 },
  frozenCell: { borderColor: palette.border },
  frozenCellText: { color: palette.textMuted },
  operationNotice: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderColor: palette.warning, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  operationNoticeText: { ...typography.small, color: palette.warning, flex: 1 },
  saveFailureStack: { gap: spacing.md, paddingHorizontal: spacing.xl },
  saving: { backgroundColor: palette.primarySoft, borderRadius: radius.md, padding: spacing.sm },
  savingText: { ...typography.small, color: palette.primary },
  sheet: { backgroundColor: palette.elevatedSurface, borderColor: palette.borderStrong, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, gap: 0, maxHeight: "88%", padding: 0 },
  stateMarker: { height: 0, opacity: 0, width: 0 },
  summaryDot: { backgroundColor: palette.textSecondary, borderRadius: radius.pill, height: 3, width: 3 },
  summaryRow: { alignItems: "center", flexDirection: "row", gap: spacing.lg, paddingBottom: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  title: { color: palette.textPrimary, fontSize: 16, fontWeight: "600", lineHeight: 20 },
  answeredSummary: { color: palette.primary, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  unansweredSummary: { color: palette.textSecondary, fontSize: 12, fontWeight: "500", lineHeight: 16 },
});

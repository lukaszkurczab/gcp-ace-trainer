import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AnswerOption, Button, Card, Icon, Screen } from "../../components";
import { radius, spacing, typography } from "../../theme";
import { complexityValueAccessibilityLabel, orderingMoveAccessibilityLabel } from "../coding-interview/session/sessionAccessibility";
import { SessionShell } from "../coding-interview/session/SessionShell";
import type { SimulationAction, SimulationResponseChange, SimulationResponseControl, SimulationSurfaceProjection } from "./simulationProjection";
import { mayRenderSimulationCompletion } from "./simulationViewModel";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { isRuntimeSelectorId, runtimeSelectors } from "../../testing/runtimeSelectors";
import { SimulationQuestionNavigator, useReducedMotion } from "./navigator/SimulationQuestionNavigator";
import { SimulationOperationPanel } from "./operation/SimulationOperationPanel";


type SimulationSessionSurfaceProps = Readonly<{ projection: SimulationSurfaceProjection }>;

/**
 * Stateless Simulation renderer. Its caller is the application projection
 * facade; no local timer, selection, persistence, scoring, or recovery logic
 * exists in this component.
 */
export function SimulationSessionSurface({ projection }: SimulationSessionSurfaceProps) {
  const styles = useThemedStyles(createStyles);
  const [navigatorVisible, setNavigatorVisible] = useState(false);
  const runtimeIdentity = projection.runtimeIdentity;
  if (mayRenderSimulationCompletion(projection)) {
    return <CompletedSurface projection={projection} sessionId={runtimeIdentity?.sessionId} />;
  }
  const actionBar = projection.confirmation ? undefined : projection.actions ? <ActionBar sessionId={runtimeIdentity?.sessionId} {...projection.actions} /> : undefined;
  const interactionLocked = projection.state !== "editable";
  const savedResponse = projection.state === "editable" && projection.notice?.message === "Saved";

  return (
    <View style={styles.root} testID={runtimeIdentity ? runtimeSelectors.simulation.root(runtimeIdentity.sessionId) : undefined}>
      <SessionShell
        actionBar={actionBar}
        layout={savedResponse ? "simulationSaved" : "simulation"}
        modeLabel={projection.modeLabel}
        onPositionPress={projection.state === "editable" ? () => setNavigatorVisible(true) : undefined}
        position={projection.position}
        positionAccessibilityLabel={projection.position ? `Open question navigator, ${projection.position.label}` : undefined}
        progress={projection.progress}
        timer={projection.timer}
      >
        {projection.state !== "editable" ? <Text style={styles.title}>{projection.title}</Text> : null}
        {savedResponse ? <SavedQuestionContext onNavigator={() => setNavigatorVisible(true)} /> : null}
        {savedResponse ? <SavedStatus /> : null}
        {projection.notice && projection.state !== "editable" ? <Notice notice={projection.notice} /> : null}
        {projection.question ? <Question itemId={runtimeIdentity?.itemId} question={projection.question} locked={interactionLocked} onChange={projection.onResponseChange} sessionId={runtimeIdentity?.sessionId} variant={savedResponse ? "simulationSaved" : "simulation"} /> : null}
        {projection.operation ? <SimulationOperationPanel operation={projection.operation} /> : null}
      </SessionShell>
      {projection.state === "editable" && projection.onOccurrencePress ? <SimulationQuestionNavigator onDismiss={() => setNavigatorVisible(false)} onOccurrencePress={projection.onOccurrencePress} positions={projection.navigator} visible={navigatorVisible} /> : null}
      {projection.confirmation ? <ConfirmationActionSheet confirmation={projection.confirmation} sessionId={runtimeIdentity?.sessionId} /> : null}
    </View>
  );
}

function ActionBar({ primary, secondary, sessionId, tertiary }: NonNullable<SimulationSurfaceProjection["actions"]> & Readonly<{ sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.actionBar}>
      {primary ? <View style={styles.actionSlot}><Action action={primary} fullWidth sessionId={sessionId} /></View> : null}
      {secondary ? <View style={styles.actionSlot}><Action action={secondary} fullWidth sessionId={sessionId} /></View> : null}
      {tertiary ? <View style={styles.actionSlot}><Action action={tertiary} fullWidth sessionId={sessionId} /></View> : null}
    </View>
  );
}

function Action({ action, fullWidth = false, sessionId }: Readonly<{ action: SimulationAction; fullWidth?: boolean; sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return <Button accessibilityLabel={action.accessibilityLabel ? t(action.accessibilityLabel) : undefined} disabled={action.disabled} loading={action.loading} onPress={action.onPress} style={fullWidth ? styles.fullWidthAction : undefined} testID={sessionId && action.id ? runtimeSelectors.simulation.action(sessionId, action.id) : undefined} variant={action.variant}>{t(action.label)}</Button>;
}

function Notice({ notice }: Readonly<{ notice: NonNullable<SimulationSurfaceProjection["notice"]> }>) {
  const styles = useThemedStyles(createStyles);
  return <View accessible accessibilityLabel={notice.message} accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.notice, styles[notice.tone]]}><Text style={styles.noticeText}>{notice.message}</Text></View>;
}

function SavedQuestionContext({ onNavigator }: Readonly<{ onNavigator: () => void }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return <View style={styles.savedQuestionContext}><Text maxFontSizeMultiplier={2} style={styles.savedQuestionContextLabel}>{t("Question")}</Text><View style={styles.savedQuestionContextSpacer} /><Pressable accessibilityLabel={t("Open question navigator")} accessibilityRole="button" onPress={onNavigator} style={styles.savedNavigator}><Icon color={styles.savedNavigatorLabel.color} name="grid" size={14} /><Text maxFontSizeMultiplier={2} style={styles.savedNavigatorLabel}>{t("Navigator")}</Text></Pressable></View>;
}

function SavedStatus() {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return <View accessible accessibilityLabel={t("Saved")} style={styles.savedStatus}><View accessibilityElementsHidden style={styles.savedStatusDot} /><Text maxFontSizeMultiplier={2} style={styles.savedStatusLabel}>{t("Saved")}</Text></View>;
}

function Question({ itemId, locked, onChange, question, sessionId, variant }: Readonly<{ itemId?: string; locked: boolean; onChange?: (change: SimulationResponseChange) => void; question: NonNullable<SimulationSurfaceProjection["question"]>; sessionId?: string; variant?: "simulation" | "simulationSaved" }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return (
    <Card style={styles.questionCard} testID={itemId ? runtimeSelectors.simulation.question(itemId) : undefined}>
      {variant ? <Text maxFontSizeMultiplier={2} style={[styles.questionLabel, variant === "simulationSaved" ? styles.savedQuestionLabel : null]}>{t("QUESTION")}</Text> : null}
      <Text maxFontSizeMultiplier={2} style={[styles.prompt, variant === "simulation" ? styles.simulationPrompt : null, variant === "simulationSaved" ? styles.savedPrompt : null]}>{question.prompt}</Text>
      {question.code ? <Text accessibilityLabel={t("Code sample")} style={styles.code}>{question.code}</Text> : null}
      <ResponseControl control={question.control} disabled={locked || !onChange} itemId={itemId} onChange={onChange} sessionId={sessionId} variant={variant} />
    </Card>
  );
}

function ResponseControl({ control, disabled, itemId, onChange, sessionId, variant }: Readonly<{ control: SimulationResponseControl; disabled: boolean; itemId?: string; onChange?: (change: SimulationResponseChange) => void; sessionId?: string; variant?: "simulation" | "simulationSaved" }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  if (control.kind === "choice") {
    const role = control.selectionMode === "single" ? "radio" : "checkbox";
    return <View style={[styles.controls, variant === "simulation" ? styles.simulationControls : null, variant === "simulationSaved" ? styles.savedControls : null]}>{control.options.map((option, index) => <AnswerOption accessibilityLabel={option.label} accessibilityRole={role} accessibilityState={{ checked: option.selected }} disabled={disabled} key={option.id} letter={String.fromCharCode(65 + index)} onPress={() => onChange?.({ kind: "choice", optionId: option.id, selected: !option.selected })} state={option.selected ? "selected" : "default"} testID={simulationOptionSelector(itemId, option.id)} text={option.label} />)}</View>;
  }
  if (control.kind === "ordering") {
    return <View style={[styles.controls, variant === "simulation" ? styles.simulationControls : null, variant === "simulationSaved" ? styles.savedControls : null]}>{control.elements.map((element, index) => <View key={element.id} style={styles.orderRow} testID={simulationOptionSelector(itemId, element.id)}><Text style={styles.orderLabel}>{`${index + 1}. ${element.label}`}</Text><View style={styles.orderActions}><Button accessibilityLabel={orderingMoveAccessibilityLabel(element.label, index, control.elements.length, "up")} disabled={disabled || index === 0} onPress={() => onChange?.({ elementId: element.id, kind: "ordering", movement: "up" })} testID={sessionId ? runtimeSelectors.simulation.action(sessionId, `${element.id}:move:up`) : undefined} variant="secondary">{t("Up")}</Button><Button accessibilityLabel={orderingMoveAccessibilityLabel(element.label, index, control.elements.length, "down")} disabled={disabled || index === control.elements.length - 1} onPress={() => onChange?.({ elementId: element.id, kind: "ordering", movement: "down" })} testID={sessionId ? runtimeSelectors.simulation.action(sessionId, `${element.id}:move:down`) : undefined} variant="secondary">{t("Down")}</Button></View></View>)}</View>;
  }
  return <View style={[styles.controls, variant === "simulation" ? styles.simulationControls : null, variant === "simulationSaved" ? styles.savedControls : null]}>{control.dimensions.map((dimension) => <View key={dimension.id} style={styles.dimension}><Text style={styles.dimensionLabel}>{dimension.label}</Text><View style={styles.valueRow}>{dimension.values.map((value) => { const selected = dimension.selectedValue === value; return <Button accessibilityLabel={complexityValueAccessibilityLabel(dimension.label, value)} accessibilityRole="radio" accessibilityState={{ checked: selected }} disabled={disabled} key={value} onPress={() => onChange?.({ dimensionId: dimension.id, kind: "complexity", value })} testID={simulationOptionSelector(itemId, value)} variant={selected ? "primary" : "secondary"}>{value}</Button>; })}</View></View>)}</View>;
}

function simulationOptionSelector(itemId: string | undefined, optionId: string): string | undefined {
  if (!itemId) return undefined;
  const candidate = `patternly:simulation:option:${itemId}:${optionId}`;
  return isRuntimeSelectorId(candidate) ? runtimeSelectors.simulation.option(itemId, optionId) : undefined;
}

function ConfirmationActionSheet({ confirmation, sessionId }: Readonly<{ confirmation: NonNullable<SimulationSurfaceProjection["confirmation"]>; sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const reduceMotion = useReducedMotion();
  return <Modal animationType={reduceMotion ? "none" : "slide"} onRequestClose={confirmation.secondary.onPress} statusBarTranslucent transparent visible><View style={styles.confirmationRoot}><Pressable accessibilityLabel="Keep working" accessibilityRole="button" onPress={confirmation.secondary.onPress} style={styles.confirmationBackdrop} /><View accessibilityViewIsModal style={styles.confirmationSheet}><Text maxFontSizeMultiplier={2} style={styles.confirmationTitle}>{t(confirmation.title)}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{t(confirmation.description)}</Text><Action action={confirmation.primary} fullWidth sessionId={sessionId} /><Action action={confirmation.secondary} fullWidth sessionId={sessionId} /></View></View></Modal>;
}

function CompletedSurface({ projection, sessionId }: Readonly<{ projection: SimulationSurfaceProjection; sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const completion = projection.completion!;
  const missedCount = completion.partialCount + completion.incorrectCount;
  return (
    <View style={styles.root} testID={sessionId ? runtimeSelectors.summary.root(sessionId) : undefined}>
      <Screen edges={["top", "bottom"]} scroll={false} style={styles.summaryScreen}>
        <View style={styles.summaryShell}>
          <View style={styles.summaryHeaderBar} />
          <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false} style={styles.summaryContentScroll}>
            <View style={styles.summaryHeader}>
              <Text maxFontSizeMultiplier={2} style={styles.summaryTitle}>{t(projection.title)}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.summaryMode}>{t(projection.modeLabel ?? "Coding Interview")}</Text>
            </View>
            <View style={styles.summaryMetrics}>
              <SummaryStat label={t("Answered")} value={`${completion.answeredCount} ${t("of")} ${completion.answeredCount + completion.unansweredCount}`} />
              <View style={styles.summarySeparator} />
              <SummaryStat label={t("Active time")} value={completion.activeTime ?? "—"} />
              <View style={styles.summarySeparator} />
            </View>
            <View style={styles.outcomeSection}>
              <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Results")}</Text>
              <View style={styles.outcomeRow}><OutcomeStat label={t("Correct")} value={completion.correctCount} tone="success" /><OutcomeStat label={t("Partial")} value={completion.partialCount} tone="warning" /><OutcomeStat label={t("Incorrect")} value={completion.incorrectCount} tone="warning" /></View>
              <Text style={styles.body}>{completion.correctCount} {t("correct")} · {missedCount} {t("Missed")} · {completion.earnedPoints} / {completion.maxPoints} {t("points")}</Text>
            </View>
          </ScrollView>
          <View style={styles.summaryFooter}>
            {completion.reviewAvailable && completion.reviewAction ? <Action action={completion.reviewAction} fullWidth sessionId={sessionId} /> : null}
            {projection.actions?.primary ? <Action action={projection.actions.primary} fullWidth sessionId={sessionId} /> : null}
          </View>
        </View>
      </Screen>
    </View>
  );
}

function SummaryStat({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.summaryStat}><Text style={styles.summaryStatLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

function OutcomeStat({ label, tone, value }: Readonly<{ label: string; tone: "danger" | "success" | "warning"; value: number }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.outcomeStat}><View style={[styles.outcomeDot, styles[`${tone}Dot`]]} /><Text style={styles.outcomeLabel}>{label}</Text><Text style={styles.outcomeValue}>{value}</Text></View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  body: { ...typography.small, color: palette.textSecondary },
  code: { backgroundColor: palette.background, borderColor: palette.border, borderRadius: radius.sm, borderWidth: 1, color: palette.textSecondary, fontFamily: "monospace", padding: spacing.md },
  confirmationTitle: { ...typography.heading, color: palette.textPrimary },
  confirmationBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0, 0, 0, 0.48)" },
  confirmationRoot: { flex: 1, justifyContent: "flex-end" },
  confirmationSheet: { backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1, gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, shadowColor: "#000000", shadowOffset: { height: -4, width: 0 }, shadowOpacity: 0.48, shadowRadius: 12, elevation: 8 },
  summaryScreen: { gap: 0, padding: 0 },
  summaryShell: { backgroundColor: palette.surface, borderRadius: 24, flex: 1, overflow: "hidden" },
  summaryHeaderBar: { height: 52 },
  summaryHeader: { gap: spacing.xs },
  summaryContent: { gap: 28, padding: 24, paddingBottom: 28 },
  summaryContentScroll: { flex: 1 },
  summaryFooter: { gap: spacing.md, padding: spacing.xl },
  eyebrow: { ...typography.caption, color: palette.accentPurple, letterSpacing: 0.7, textTransform: "uppercase" },
  summaryMetrics: { gap: spacing.lg },
  summarySeparator: { backgroundColor: palette.surface, height: 1, width: "100%" },
  summaryStat: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md },
  summaryStatLabel: { ...typography.body, color: palette.textSecondary },
  summaryValue: { ...typography.bodyStrong, color: palette.textPrimary },
  summaryTitle: { color: palette.textPrimary, fontSize: 22, fontWeight: "600", lineHeight: 28 },
  summaryMode: { color: palette.textSecondary, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  outcomeSection: { gap: spacing.md },
  sectionTitle: { color: palette.textSecondary, fontSize: 13, fontWeight: "700", lineHeight: 16 },
  outcomeRow: { gap: spacing.sm },
  outcomeStat: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingHorizontal: 0, paddingVertical: spacing.sm },
  outcomeDot: { borderRadius: 4, height: 8, width: 8 },
  successDot: { backgroundColor: palette.success },
  warningDot: { backgroundColor: palette.warning },
  dangerDot: { backgroundColor: palette.danger },
  outcomeLabel: { ...typography.body, color: palette.textPrimary, flex: 1 },
  outcomeValue: { color: palette.textPrimary, fontSize: 16, fontWeight: "600", lineHeight: 20 },
  controls: { gap: spacing.sm },
  dimension: { gap: spacing.xs },
  dimensionLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  error: { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
  actionBar: { gap: spacing.sm, width: "100%" },
  actionSlot: { alignSelf: "stretch" },
  fullWidthAction: { alignSelf: "stretch" },
  notice: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  noticeText: { ...typography.small, color: palette.textPrimary },
  pressed: { opacity: 0.78 },
  neutral: { backgroundColor: palette.elevatedSurface, borderColor: palette.border },
  orderActions: { flexDirection: "row", flexShrink: 0, gap: spacing.xs },
  orderLabel: { ...typography.small, color: palette.textPrimary, flex: 1 },
  orderRow: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  prompt: { ...typography.body, color: palette.textPrimary },
  questionCard: { backgroundColor: "transparent", borderWidth: 0, padding: 0 },
  questionLabel: { color: palette.primary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  root: { flex: 1 },
  success: { backgroundColor: palette.successSoft, borderColor: palette.success },
  title: { ...typography.title, color: palette.textPrimary },
  simulationControls: { gap: 14 },
  simulationPrompt: { fontSize: 22, fontWeight: "600", letterSpacing: -0.3, lineHeight: 28 },
  savedControls: { gap: spacing.md },
  savedNavigator: { alignItems: "center", flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  savedNavigatorLabel: { color: palette.textSecondary, fontSize: 11, fontWeight: "500", lineHeight: 15 },
  savedPrompt: { fontSize: 16, fontWeight: "500", lineHeight: 22 },
  savedQuestionContext: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 21, width: "100%" },
  savedQuestionContextLabel: { color: palette.textPrimary, fontSize: 13, fontWeight: "600", lineHeight: 17 },
  savedQuestionContextSpacer: { flex: 1, minHeight: 20 },
  savedQuestionLabel: { color: palette.primary, fontSize: 10, fontWeight: "700", lineHeight: 12, opacity: 0.5 },
  savedStatus: { alignItems: "center", flexDirection: "row", gap: 6, minHeight: 17 },
  savedStatusDot: { backgroundColor: palette.primary, borderRadius: radius.pill, height: 6, width: 6 },
  savedStatusLabel: { color: palette.primary, fontSize: 12, fontWeight: "500", lineHeight: 17 },
  valueRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnswerOption, Button, Card, Screen } from "../../components";
import { radius, spacing, typography } from "../../theme";
import { complexityValueAccessibilityLabel, orderingMoveAccessibilityLabel } from "../coding-interview/session/sessionAccessibility";
import { SessionShell } from "../coding-interview/session/SessionShell";
import type { SimulationAction, SimulationResponseChange, SimulationResponseControl, SimulationSurfaceProjection } from "./simulationProjection";
import { mayRenderSimulationCompletion } from "./simulationViewModel";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { isRuntimeSelectorId, runtimeSelectors } from "../../testing/runtimeSelectors";
import { SimulationQuestionNavigator } from "./navigator/SimulationQuestionNavigator";
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
  const actionBar = projection.confirmation
    ? <ConfirmationActionBar confirmation={projection.confirmation} sessionId={runtimeIdentity?.sessionId} />
    : projection.actions ? <ActionBar sessionId={runtimeIdentity?.sessionId} {...projection.actions} /> : undefined;
  const interactionLocked = projection.state !== "editable";

  return (
    <View style={styles.root} testID={runtimeIdentity ? runtimeSelectors.simulation.root(runtimeIdentity.sessionId) : undefined}>
      <SessionShell
        actionBar={actionBar}
        modeLabel={projection.modeLabel}
        position={projection.position}
        progress={projection.progress}
        timer={projection.timer}
      >
        <Pressable accessibilityLabel={projection.state === "editable" ? `Open question navigator, ${activeQuestionLabel(projection.position?.label)}` : undefined} accessibilityRole={projection.state === "editable" ? "button" : "header"} disabled={projection.state !== "editable"} onPress={() => setNavigatorVisible(true)} style={styles.heading}>
          <Text style={projection.state === "editable" ? styles.questionLabel : styles.title}>
            {projection.state === "editable" ? activeQuestionLabel(projection.position?.label) : projection.title}
          </Text>
        </Pressable>
        {projection.notice ? <Notice notice={projection.notice} /> : null}
        {projection.question ? <Question itemId={runtimeIdentity?.itemId} question={projection.question} locked={interactionLocked} onChange={projection.onResponseChange} sessionId={runtimeIdentity?.sessionId} /> : null}
        {projection.operation ? <SimulationOperationPanel operation={projection.operation} /> : null}
        {projection.confirmation ? <Confirmation confirmation={projection.confirmation} /> : null}
      </SessionShell>
      {projection.state === "editable" && projection.onOccurrencePress ? <SimulationQuestionNavigator onDismiss={() => setNavigatorVisible(false)} onFinish={projection.onFinish} onOccurrencePress={projection.onOccurrencePress} positions={projection.navigator} visible={navigatorVisible} /> : null}
    </View>
  );
}

function activeQuestionLabel(position: string | undefined): string {
  const current = position?.match(/^(\d+) of \d+$/)?.[1];
  return current ? `Question ${current}` : "Question";
}

function ActionBar({ primary, secondary, sessionId }: NonNullable<SimulationSurfaceProjection["actions"]> & Readonly<{ sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.actionBar}>
      {secondary ? <View style={styles.actionSlot}><Action action={secondary} sessionId={sessionId} /></View> : null}
      {primary ? <View style={styles.actionSlot}><Action action={primary} sessionId={sessionId} /></View> : null}
    </View>
  );
}

function Action({ action, sessionId }: Readonly<{ action: SimulationAction; sessionId?: string }>) {
  const { t } = useAppPreferences();
  return <Button accessibilityLabel={action.accessibilityLabel ? t(action.accessibilityLabel) : undefined} disabled={action.disabled} loading={action.loading} onPress={action.onPress} testID={sessionId && action.id ? runtimeSelectors.simulation.action(sessionId, action.id) : undefined} variant={action.variant}>{t(action.label)}</Button>;
}

function Notice({ notice }: Readonly<{ notice: NonNullable<SimulationSurfaceProjection["notice"]> }>) {
  const styles = useThemedStyles(createStyles);
  return <View accessible accessibilityLabel={notice.message} accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.notice, styles[notice.tone]]}><Text style={styles.noticeText}>{notice.message}</Text></View>;
}

function Question({ itemId, locked, onChange, question, sessionId }: Readonly<{ itemId?: string; locked: boolean; onChange?: (change: SimulationResponseChange) => void; question: NonNullable<SimulationSurfaceProjection["question"]>; sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return (
    <Card style={styles.questionCard} testID={itemId ? runtimeSelectors.simulation.question(itemId) : undefined}>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {question.code ? <Text accessibilityLabel={t("Code sample")} style={styles.code}>{question.code}</Text> : null}
      <ResponseControl control={question.control} disabled={locked || !onChange} itemId={itemId} onChange={onChange} sessionId={sessionId} />
    </Card>
  );
}

function ResponseControl({ control, disabled, itemId, onChange, sessionId }: Readonly<{ control: SimulationResponseControl; disabled: boolean; itemId?: string; onChange?: (change: SimulationResponseChange) => void; sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  if (control.kind === "choice") {
    const role = control.selectionMode === "single" ? "radio" : "checkbox";
    return <View style={styles.controls}>{control.options.map((option, index) => <AnswerOption accessibilityLabel={option.label} accessibilityRole={role} accessibilityState={{ checked: option.selected }} disabled={disabled} key={option.id} letter={String.fromCharCode(65 + index)} onPress={() => onChange?.({ kind: "choice", optionId: option.id, selected: !option.selected })} state={option.selected ? "selected" : "default"} testID={simulationOptionSelector(itemId, option.id)} text={option.label} />)}</View>;
  }
  if (control.kind === "ordering") {
    return <View style={styles.controls}>{control.elements.map((element, index) => <View key={element.id} style={styles.orderRow} testID={simulationOptionSelector(itemId, element.id)}><Text style={styles.orderLabel}>{`${index + 1}. ${element.label}`}</Text><View style={styles.orderActions}><Button accessibilityLabel={orderingMoveAccessibilityLabel(element.label, index, control.elements.length, "up")} disabled={disabled || index === 0} onPress={() => onChange?.({ elementId: element.id, kind: "ordering", movement: "up" })} testID={sessionId ? runtimeSelectors.simulation.action(sessionId, `${element.id}:move:up`) : undefined} variant="secondary">{t("Up")}</Button><Button accessibilityLabel={orderingMoveAccessibilityLabel(element.label, index, control.elements.length, "down")} disabled={disabled || index === control.elements.length - 1} onPress={() => onChange?.({ elementId: element.id, kind: "ordering", movement: "down" })} testID={sessionId ? runtimeSelectors.simulation.action(sessionId, `${element.id}:move:down`) : undefined} variant="secondary">{t("Down")}</Button></View></View>)}</View>;
  }
  return <View style={styles.controls}>{control.dimensions.map((dimension) => <View key={dimension.id} style={styles.dimension}><Text style={styles.dimensionLabel}>{dimension.label}</Text><View style={styles.valueRow}>{dimension.values.map((value) => { const selected = dimension.selectedValue === value; return <Button accessibilityLabel={complexityValueAccessibilityLabel(dimension.label, value)} accessibilityRole="radio" accessibilityState={{ checked: selected }} disabled={disabled} key={value} onPress={() => onChange?.({ dimensionId: dimension.id, kind: "complexity", value })} testID={simulationOptionSelector(itemId, value)} variant={selected ? "primary" : "secondary"}>{value}</Button>; })}</View></View>)}</View>;
}

function simulationOptionSelector(itemId: string | undefined, optionId: string): string | undefined {
  if (!itemId) return undefined;
  const candidate = `patternly:simulation:option:${itemId}:${optionId}`;
  return isRuntimeSelectorId(candidate) ? runtimeSelectors.simulation.option(itemId, optionId) : undefined;
}

function Confirmation({ confirmation }: Readonly<{ confirmation: NonNullable<SimulationSurfaceProjection["confirmation"]> }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return <Card variant="tonal"><Text style={styles.confirmationTitle}>{t(confirmation.title)}</Text><Text style={styles.body}>{t(confirmation.description)}</Text></Card>;
}

function ConfirmationActionBar({ confirmation, sessionId }: Readonly<{ confirmation: NonNullable<SimulationSurfaceProjection["confirmation"]>; sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.actionBar}><Action action={confirmation.secondary} sessionId={sessionId} /><Action action={confirmation.primary} sessionId={sessionId} /></View>;
}

function CompletedSurface({ projection, sessionId }: Readonly<{ projection: SimulationSurfaceProjection; sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const completion = projection.completion!;
  const missedCount = completion.partialCount + completion.incorrectCount;
  return (
    <View style={styles.root} testID={sessionId ? runtimeSelectors.summary.root(sessionId) : undefined}>
      <Screen edges={["top", "bottom"]} footer={<View style={styles.summaryActions}>{completion.reviewAction ? <Action action={completion.reviewAction} sessionId={sessionId} /> : null}{projection.actions?.primary ? <Action action={projection.actions.primary} sessionId={sessionId} /> : null}</View>}>
        <View style={styles.summaryShell}>
          <View style={styles.summaryHeader}>
            <Text style={styles.eyebrow}>{t("Learn approach")} / {t(projection.modeLabel ?? "Coding Interview")}</Text>
            <Text style={styles.title}>{t(projection.title)}</Text>
            <Text style={styles.body}>{t("You completed this focused interview simulation.")}</Text>
          </View>
          <Card style={styles.summaryStats} variant="layered">
            <SummaryStat label={t("Completed items")} value={`${completion.answeredCount} ${t("of")} ${completion.answeredCount + completion.unansweredCount}`} />
            <SummaryStat label={t("Active time")} value={completion.activeTime ?? "—"} />
            {completion.configuration ? <Text style={styles.caption}>{t(completion.configuration)}</Text> : null}
          </Card>
          <View style={styles.outcomeSection}>
            <Text style={styles.sectionTitle}>{t("Outcome distribution")}</Text>
            <View style={styles.outcomeRow}><OutcomeStat label={t("Correct")} value={completion.correctCount} tone="success" /><OutcomeStat label={t("Partial")} value={completion.partialCount} tone="warning" /><OutcomeStat label={t("Incorrect")} value={completion.incorrectCount} tone="danger" /></View>
            <Text style={styles.body}>{completion.correctCount} {t("correct")} · {missedCount} {t("Missed")} · {completion.earnedPoints} / {completion.maxPoints} {t("points")}</Text>
          </View>
          {completion.reviewAvailable ? <Card style={styles.reviewBanner} variant="success"><Text style={styles.confirmationTitle}>{t("Answer review available")}</Text><Text style={styles.body}>{t("Review the saved explanations before leaving this session.")}</Text></Card> : null}
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
  actionBar: { flexDirection: "row", gap: spacing.sm },
  actionSlot: { flex: 1 },
  body: { ...typography.small, color: palette.textSecondary },
  code: { backgroundColor: palette.background, borderColor: palette.border, borderRadius: radius.sm, borderWidth: 1, color: palette.textSecondary, fontFamily: "monospace", padding: spacing.md },
  confirmationTitle: { ...typography.heading, color: palette.textPrimary },
  summaryActions: { gap: spacing.sm },
  summaryShell: { gap: spacing.xl },
  summaryHeader: { gap: spacing.sm },
  eyebrow: { ...typography.caption, color: palette.accentPurple, letterSpacing: 0.7, textTransform: "uppercase" },
  summaryStats: { borderRadius: 24, gap: spacing.lg, padding: spacing.xl, shadowOpacity: 0 },
  summaryStat: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 36 },
  summaryStatLabel: { ...typography.body, color: palette.textSecondary },
  summaryValue: { ...typography.bodyStrong, color: palette.textPrimary },
  outcomeSection: { gap: spacing.md },
  sectionTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  outcomeRow: { gap: spacing.sm },
  outcomeStat: { alignItems: "center", backgroundColor: palette.surface, borderRadius: 10, flexDirection: "row", gap: spacing.sm, minHeight: 44, padding: spacing.md },
  outcomeDot: { borderRadius: 4, height: 8, width: 8 },
  successDot: { backgroundColor: palette.success },
  warningDot: { backgroundColor: palette.warning },
  dangerDot: { backgroundColor: palette.danger },
  outcomeLabel: { ...typography.body, color: palette.textPrimary, flex: 1 },
  outcomeValue: { ...typography.bodyStrong, color: palette.textPrimary },
  reviewBanner: { borderColor: palette.success, borderRadius: radius.md, borderWidth: 1 },
  caption: { ...typography.caption, color: palette.textSecondary },
  controls: { gap: spacing.sm },
  dimension: { gap: spacing.xs },
  dimensionLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  error: { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
  heading: { gap: spacing.xs, justifyContent: "center", minHeight: 48 },
  notice: { borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  noticeText: { ...typography.small, color: palette.textPrimary },
  pressed: { opacity: 0.78 },
  neutral: { backgroundColor: palette.elevatedSurface, borderColor: palette.border },
  orderActions: { flexDirection: "row", flexShrink: 0, gap: spacing.xs },
  orderLabel: { ...typography.small, color: palette.textPrimary, flex: 1 },
  orderRow: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  prompt: { ...typography.body, color: palette.textPrimary },
  questionCard: { backgroundColor: "transparent", borderWidth: 0, padding: 0 },
  questionLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  root: { flex: 1 },
  success: { backgroundColor: palette.successSoft, borderColor: palette.success },
  title: { ...typography.title, color: palette.textPrimary },
  valueRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});

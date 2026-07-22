import { StyleSheet, Text, View } from "react-native";

import { Button, Card } from "../../components";
import { radius, spacing, typography } from "../../theme";
import { complexityValueAccessibilityLabel, orderingMoveAccessibilityLabel } from "../algorithms/session/sessionAccessibility";
import { SessionShell } from "../algorithms/session/SessionShell";
import type { SimulationAction, SimulationResponseChange, SimulationResponseControl, SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationNavigator } from "./SimulationNavigator";
import { mayRenderSimulationCompletion } from "./simulationViewModel";
import { PracticeFeedbackBlock } from "../practice/PracticeFeedbackBlock";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { isRuntimeSelectorId, runtimeSelectors } from "../../testing/runtimeSelectors";


type SimulationSessionSurfaceProps = Readonly<{ projection: SimulationSurfaceProjection }>;

/**
 * Stateless Simulation renderer. Its caller is the application projection
 * facade; no local timer, selection, persistence, scoring, or recovery logic
 * exists in this component.
 */
export function SimulationSessionSurface({ projection }: SimulationSessionSurfaceProps) {
  const styles = useThemedStyles(createStyles);
  const runtimeIdentity = projection.runtimeIdentity;
  const actionBar = projection.confirmation
    ? <ConfirmationActionBar confirmation={projection.confirmation} sessionId={runtimeIdentity?.sessionId} />
    : projection.actions ? <ActionBar sessionId={runtimeIdentity?.sessionId} {...projection.actions} /> : undefined;
  const interactionLocked = projection.state !== "editable";

  return (
    <SessionShell
      actionBar={actionBar}
      modeLabel={projection.modeLabel}
      position={projection.position}
      progress={projection.progress}
      rootTestID={runtimeIdentity ? runtimeSelectors.simulation.root(runtimeIdentity.sessionId) : undefined}
      timer={projection.timer}
    >
        <View accessible accessibilityRole="header" style={styles.heading}>
          <Text style={styles.title}>{projection.title}</Text>
        </View>
        {projection.notice ? <Notice notice={projection.notice} /> : null}
        {projection.question ? <Question itemId={runtimeIdentity?.itemId} question={projection.question} locked={interactionLocked} onChange={projection.onResponseChange} sessionId={runtimeIdentity?.sessionId} /> : null}
        {projection.navigator ? <SimulationNavigator onOccurrencePress={interactionLocked ? undefined : projection.onOccurrencePress} positions={projection.navigator} /> : null}
        {projection.confirmation ? <Confirmation confirmation={projection.confirmation} /> : null}
        {mayRenderSimulationCompletion(projection) ? <Completion completion={projection.completion!} sessionId={runtimeIdentity?.sessionId} /> : null}
    </SessionShell>
  );
}

function ActionBar({ primary, secondary, sessionId }: NonNullable<SimulationSurfaceProjection["actions"]> & Readonly<{ sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.actionBar}>
      {secondary ? <Action action={secondary} sessionId={sessionId} /> : null}
      {primary ? <Action action={primary} sessionId={sessionId} /> : null}
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
    <Card testID={itemId ? runtimeSelectors.simulation.question(itemId) : undefined}>
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
    return <View style={styles.controls}>{control.options.map((option) => <Button accessibilityLabel={option.label} accessibilityRole={role} accessibilityState={{ checked: option.selected }} disabled={disabled} key={option.id} onPress={() => onChange?.({ kind: "choice", optionId: option.id, selected: !option.selected })} testID={simulationOptionSelector(itemId, option.id)} variant={option.selected ? "primary" : "secondary"}>{option.label}</Button>)}</View>;
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

function Completion({ completion, sessionId }: Readonly<{ completion: NonNullable<SimulationSurfaceProjection["completion"]>; sessionId?: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return <View style={styles.completion}><Card variant="success"><Text style={styles.confirmationTitle}>{t("Verified session result")}</Text><Text style={styles.body}>{`${completion.answeredCount} ${t("answered")} · ${completion.unansweredCount} ${t("unanswered")}`}</Text><Text style={styles.body}>{`${completion.correctCount} ${t("correct")} · ${completion.partialCount} ${t("partial")} · ${completion.incorrectCount} ${t("incorrect")}`}</Text><Text style={styles.body}>{`${completion.earnedPoints} ${t("of")} ${completion.maxPoints} ${t("points")}`}</Text>{completion.reviewAction ? <Action action={completion.reviewAction} sessionId={sessionId} /> : null}</Card>{completion.reviewItems?.map((item) => <View key={item.occurrenceId} style={styles.reviewItem} testID={sessionId ? runtimeSelectors.summary.feedbackItem(sessionId, item.occurrenceId) : undefined}><Text style={styles.body}>{`${item.ordinal}. ${item.prompt}`}</Text><PracticeFeedbackBlock feedback={{ details: item.details, reason: item.reason, result: item.correctness }} itemId={item.occurrenceId} /></View>)}</View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  actionBar: { gap: spacing.sm },
  body: { ...typography.small, color: palette.textSecondary },
  code: { backgroundColor: palette.background, borderColor: palette.border, borderRadius: radius.sm, borderWidth: 1, color: palette.textSecondary, fontFamily: "monospace", padding: spacing.md },
  completion: { gap: spacing.lg },
  confirmationTitle: { ...typography.heading, color: palette.textPrimary },
  controls: { gap: spacing.sm },
  dimension: { gap: spacing.xs },
  dimensionLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  error: { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
  heading: { gap: spacing.xs },
  notice: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  noticeText: { ...typography.small, color: palette.textPrimary },
  neutral: { backgroundColor: palette.elevatedSurface, borderColor: palette.border },
  orderActions: { flexDirection: "row", flexShrink: 0, gap: spacing.xs },
  orderLabel: { ...typography.small, color: palette.textPrimary, flex: 1 },
  orderRow: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  prompt: { ...typography.body, color: palette.textPrimary },
  reviewItem: { gap: spacing.sm },
  success: { backgroundColor: palette.successSoft, borderColor: palette.success },
  title: { ...typography.title, color: palette.textPrimary },
  valueRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});

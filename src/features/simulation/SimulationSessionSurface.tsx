import { StyleSheet, Text, View } from "react-native";

import { Button, Card } from "../../components";
import { colors, radius, spacing, typography } from "../../theme";
import { SessionShell } from "../algorithms/session/SessionShell";
import type { SimulationAction, SimulationResponseChange, SimulationResponseControl, SimulationSurfaceProjection } from "./simulationProjection";
import { SimulationNavigator } from "./SimulationNavigator";
import { mayRenderSimulationCompletion } from "./simulationViewModel";

type SimulationSessionSurfaceProps = Readonly<{ projection: SimulationSurfaceProjection }>;

/**
 * Stateless Simulation renderer. Its caller is the application projection
 * facade; no local timer, selection, persistence, scoring, or recovery logic
 * exists in this component.
 */
export function SimulationSessionSurface({ projection }: SimulationSessionSurfaceProps) {
  const actionBar = projection.confirmation
    ? <ConfirmationActionBar confirmation={projection.confirmation} />
    : projection.actions ? <ActionBar {...projection.actions} /> : undefined;
  const interactionLocked = projection.state !== "editable";

  return (
    <SessionShell
      actionBar={actionBar}
      modeLabel={projection.modeLabel}
      positionLabel={projection.positionLabel}
      progress={projection.progress}
      timerLabel={projection.timerLabel}
    >
      <View accessible accessibilityRole="header" style={styles.heading}>
        <Text style={styles.title}>{projection.title}</Text>
      </View>
      {projection.notice ? <Notice notice={projection.notice} /> : null}
      {projection.question ? <Question question={projection.question} locked={interactionLocked} onChange={projection.onResponseChange} /> : null}
      {projection.navigator ? <SimulationNavigator onOccurrencePress={interactionLocked ? undefined : projection.onOccurrencePress} positions={projection.navigator} /> : null}
      {projection.confirmation ? <Confirmation confirmation={projection.confirmation} /> : null}
      {mayRenderSimulationCompletion(projection) ? <Completion completion={projection.completion!} /> : null}
    </SessionShell>
  );
}

function ActionBar({ primary, secondary }: NonNullable<SimulationSurfaceProjection["actions"]>) {
  return (
    <View style={styles.actionBar}>
      {secondary ? <Action action={secondary} /> : null}
      {primary ? <Action action={primary} /> : null}
    </View>
  );
}

function Action({ action }: Readonly<{ action: SimulationAction }>) {
  return <Button disabled={action.disabled} loading={action.loading} onPress={action.onPress} variant={action.variant}>{action.label}</Button>;
}

function Notice({ notice }: Readonly<{ notice: NonNullable<SimulationSurfaceProjection["notice"]> }>) {
  return <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.notice, styles[notice.tone]]}><Text style={styles.noticeText}>{notice.message}</Text></View>;
}

function Question({ locked, onChange, question }: Readonly<{ locked: boolean; onChange?: (change: SimulationResponseChange) => void; question: NonNullable<SimulationSurfaceProjection["question"]> }>) {
  return (
    <Card>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {question.code ? <Text accessibilityLabel="Code sample" style={styles.code}>{question.code}</Text> : null}
      <ResponseControl control={question.control} disabled={locked || !onChange} onChange={onChange} />
    </Card>
  );
}

function ResponseControl({ control, disabled, onChange }: Readonly<{ control: SimulationResponseControl; disabled: boolean; onChange?: (change: SimulationResponseChange) => void }>) {
  if (control.kind === "choice") {
    return <View style={styles.controls}>{control.options.map((option) => <Button disabled={disabled} key={option.id} onPress={() => onChange?.({ kind: "choice", optionId: option.id, selected: !option.selected })} variant={option.selected ? "primary" : "secondary"}>{option.label}</Button>)}</View>;
  }
  if (control.kind === "ordering") {
    return <View style={styles.controls}>{control.elements.map((element, index) => <View key={element.id} style={styles.orderRow}><Text style={styles.orderLabel}>{`${index + 1}. ${element.label}`}</Text><View style={styles.orderActions}><Button disabled={disabled || index === 0} onPress={() => onChange?.({ elementId: element.id, kind: "ordering", movement: "up" })} variant="secondary">Up</Button><Button disabled={disabled || index === control.elements.length - 1} onPress={() => onChange?.({ elementId: element.id, kind: "ordering", movement: "down" })} variant="secondary">Down</Button></View></View>)}</View>;
  }
  return <View style={styles.controls}>{control.dimensions.map((dimension) => <View key={dimension.id} style={styles.dimension}><Text style={styles.dimensionLabel}>{dimension.label}</Text><View style={styles.valueRow}>{dimension.values.map((value) => <Button disabled={disabled} key={value} onPress={() => onChange?.({ dimensionId: dimension.id, kind: "complexity", value })} variant={dimension.selectedValue === value ? "primary" : "secondary"}>{value}</Button>)}</View></View>)}</View>;
}

function Confirmation({ confirmation }: Readonly<{ confirmation: NonNullable<SimulationSurfaceProjection["confirmation"]> }>) {
  return <Card variant="tonal"><Text style={styles.confirmationTitle}>{confirmation.title}</Text><Text style={styles.body}>{confirmation.description}</Text></Card>;
}

function ConfirmationActionBar({ confirmation }: Readonly<{ confirmation: NonNullable<SimulationSurfaceProjection["confirmation"]> }>) {
  return <View style={styles.actionBar}><Action action={confirmation.secondary} /><Action action={confirmation.primary} /></View>;
}

function Completion({ completion }: Readonly<{ completion: NonNullable<SimulationSurfaceProjection["completion"]> }>) {
  return <Card variant="success"><Text style={styles.confirmationTitle}>Verified session result</Text><Text style={styles.body}>{`${completion.answeredCount} answered · ${completion.unansweredCount} unanswered`}</Text><Text style={styles.body}>{`${completion.correctCount} correct · ${completion.partialCount} partial · ${completion.incorrectCount} incorrect`}</Text><Text style={styles.body}>{`${completion.earnedPoints} of ${completion.maxPoints} points`}</Text>{completion.reviewAction ? <Action action={completion.reviewAction} /> : null}</Card>;
}

const styles = StyleSheet.create({
  actionBar: { gap: spacing.sm },
  body: { ...typography.small, color: colors.dark.textSecondary },
  code: { backgroundColor: colors.dark.background, borderColor: colors.dark.border, borderRadius: radius.sm, borderWidth: 1, color: colors.dark.textSecondary, fontFamily: "monospace", padding: spacing.md },
  confirmationTitle: { ...typography.heading, color: colors.dark.textPrimary },
  controls: { gap: spacing.sm },
  dimension: { gap: spacing.xs },
  dimensionLabel: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  error: { backgroundColor: colors.dark.dangerSoft, borderColor: colors.dark.danger },
  heading: { gap: spacing.xs },
  notice: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  noticeText: { ...typography.small, color: colors.dark.textPrimary },
  neutral: { backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.border },
  orderActions: { flexDirection: "row", flexShrink: 0, gap: spacing.xs },
  orderLabel: { ...typography.small, color: colors.dark.textPrimary, flex: 1 },
  orderRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  prompt: { ...typography.body, color: colors.dark.textPrimary },
  success: { backgroundColor: colors.dark.successSoft, borderColor: colors.dark.success },
  title: { ...typography.title, color: colors.dark.textPrimary },
  valueRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});

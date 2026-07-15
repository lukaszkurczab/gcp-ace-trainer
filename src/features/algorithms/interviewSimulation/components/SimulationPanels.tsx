import { StyleSheet, Text, View } from "react-native";

import { Button, Card, Icon, ProgressBar } from "../../../../components";
import { colors, spacing, typography } from "../../../../theme";
import type { SimulationFinalizationStep, SimulationQuestionCounts } from "../model";
import { formatSimulationQuestionCounts } from "../model";

type SimulationExitPanelProps = {
  disabled?: boolean;
  onContinue: () => void;
  onLeave: () => void;
  pending?: boolean;
  remainingTimeLabel: string;
  title?: string;
};

export function SimulationExitPanel({ disabled = false, onContinue, onLeave, pending = false, remainingTimeLabel, title = "Leave this simulation?" }: SimulationExitPanelProps) {
  return (
    <Card variant="tonal" style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.body}>Your saved responses and remaining foreground time will be restored when you return.</Text>
      <Text style={styles.meta}>{remainingTimeLabel} remaining</Text>
      <Button onPress={onContinue}>Continue simulation</Button>
      <Button disabled={disabled} loading={pending} onPress={onLeave} variant="destructive">Leave simulation</Button>
    </Card>
  );
}

type SimulationSubmissionPanelProps = {
  counts: SimulationQuestionCounts;
  disabled?: boolean;
  onReturn: () => void;
  onSubmit: () => void;
  pending?: boolean;
};

export function SimulationSubmissionPanel({ counts, disabled = false, onReturn, onSubmit, pending = false }: SimulationSubmissionPanelProps) {
  const hasUnanswered = counts.unanswered > 0;
  return (
    <Card variant="tonal" style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>{hasUnanswered ? "Submit with unanswered questions?" : "Submit simulation?"}</Text>
      <Text style={styles.body}>{hasUnanswered ? `${formatSimulationQuestionCounts(counts)}. Unanswered questions will remain unanswered in the final result.` : `${formatSimulationQuestionCounts(counts)}. Your submitted answers will be finalized.`}</Text>
      <Button onPress={onReturn} variant="secondary">Return to simulation</Button>
      <Button disabled={disabled} loading={pending} onPress={onSubmit} variant={hasUnanswered ? "destructive" : "primary"}>{hasUnanswered ? "Submit anyway" : "Submit simulation"}</Button>
    </Card>
  );
}

type SimulationFinalizationPanelProps = {
  progress: number;
  steps: readonly SimulationFinalizationStep[];
  title?: string;
};

export function SimulationFinalizationPanel({ progress, steps, title = "Finalizing simulation" }: SimulationFinalizationPanelProps) {
  return (
    <Card variant="tonal" style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.body}>Please wait while we securely finalize your submitted outcomes.</Text>
      <View accessibilityRole="progressbar" style={styles.stepList}>
        {steps.map((step) => (
          <View key={step.id} style={styles.step}>
            <Icon color={getStepColor(step.state)} name={step.state === "failed" ? "alert-triangle" : step.state === "complete" ? "shield-check" : "route"} size={18} />
            <Text style={[styles.stepLabel, step.state === "failed" ? styles.failedStepLabel : null]}>{step.label}</Text>
          </View>
        ))}
      </View>
      <ProgressBar progress={progress} tone={steps.some((step) => step.state === "failed") ? "danger" : "primary"} />
    </Card>
  );
}

function getStepColor(state: SimulationFinalizationStep["state"]): string {
  if (state === "failed") return colors.dark.danger;
  if (state === "complete") return colors.dark.success;
  if (state === "active") return colors.dark.primary;
  return colors.dark.textMuted;
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md },
  title: { ...typography.heading, color: colors.dark.textPrimary },
  body: { ...typography.small, color: colors.dark.textSecondary },
  meta: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  stepList: { gap: spacing.sm },
  step: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  stepLabel: { ...typography.small, color: colors.dark.textSecondary },
  failedStepLabel: { color: colors.dark.danger },
});

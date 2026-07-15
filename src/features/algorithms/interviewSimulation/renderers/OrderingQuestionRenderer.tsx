import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../../../components";
import { colors, radius, spacing, typography } from "../../../../theme";
import type { SimulationOrderingStep } from "../model";

type OrderingQuestionRendererProps = {
  disabled?: boolean;
  onMoveDown: (stepId: string) => void;
  onMoveUp: (stepId: string) => void;
  onReset: () => void;
  steps: readonly SimulationOrderingStep[];
};

export function OrderingQuestionRenderer({
  disabled = false,
  onMoveDown,
  onMoveUp,
  onReset,
  steps,
}: OrderingQuestionRendererProps) {
  return (
    <View accessibilityLabel="Ordered steps" accessibilityRole="list" style={styles.list}>
      {steps.map((step, index) => {
        const canMoveUp = !disabled && index > 0;
        const canMoveDown = !disabled && index < steps.length - 1;

        return (
          <View key={step.id} style={styles.step}>
            <Text accessibilityLabel={`Position ${index + 1}`} style={styles.position}>{index + 1}</Text>
            <Text style={styles.stepText}>{step.text}</Text>
            <View accessibilityRole="toolbar" style={styles.actions}>
              <Pressable
                accessibilityLabel={`Move ${step.text} up`}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canMoveUp }}
                disabled={!canMoveUp}
                onPress={() => onMoveUp(step.id)}
                style={({ pressed }) => [styles.moveButton, !canMoveUp ? styles.disabled : null, pressed && canMoveUp ? styles.pressed : null]}
              >
                <Text style={styles.moveLabel}>↑</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Move ${step.text} down`}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canMoveDown }}
                disabled={!canMoveDown}
                onPress={() => onMoveDown(step.id)}
                style={({ pressed }) => [styles.moveButton, !canMoveDown ? styles.disabled : null, pressed && canMoveDown ? styles.pressed : null]}
              >
                <Text style={styles.moveLabel}>↓</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      <Button disabled={disabled} onPress={onReset} variant="ghost">Reset order</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  step: { alignItems: "center", backgroundColor: colors.dark.surface, borderColor: colors.dark.border, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.sm, minHeight: 54, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  position: { ...typography.caption, color: colors.dark.textSecondary, textAlign: "center", width: 20 },
  stepText: { ...typography.small, color: colors.dark.textPrimary, flex: 1 },
  actions: { flexDirection: "row", gap: spacing.xs },
  moveButton: { alignItems: "center", backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.border, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth, height: 36, justifyContent: "center", width: 36 },
  moveLabel: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
});

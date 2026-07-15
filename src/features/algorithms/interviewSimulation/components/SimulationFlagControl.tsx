import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, typography } from "../../../../theme";

type SimulationFlagControlProps = {
  disabled?: boolean;
  isFlagged: boolean;
  onPress: () => void;
  pending?: boolean;
};

export function SimulationFlagControl({ disabled = false, isFlagged, onPress, pending = false }: SimulationFlagControlProps) {
  const label = pending ? "Saving question flag" : isFlagged ? "Remove flag from question" : "Flag question for review";

  return (
    <Pressable
      accessibilityHint="Flags this question in the session navigator."
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: pending, checked: isFlagged, disabled: disabled || pending }}
      disabled={disabled || pending}
      onPress={onPress}
      style={({ pressed }) => [styles.button, isFlagged ? styles.flagged : null, disabled || pending ? styles.disabled : null, pressed && !disabled && !pending ? styles.pressed : null]}
    >
      <Text style={[styles.icon, isFlagged ? styles.flaggedLabel : null]}>{isFlagged ? "⚑" : "⚐"}</Text>
      <Text style={[styles.label, isFlagged ? styles.flaggedLabel : null]}>{pending ? "Saving…" : isFlagged ? "Flagged" : "Flag"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", borderRadius: radius.sm, flexDirection: "row", gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.sm },
  flagged: { backgroundColor: colors.dark.accentPurpleSoft },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78 },
  icon: { ...typography.bodyStrong, color: colors.dark.textSecondary },
  label: { ...typography.small, color: colors.dark.textSecondary },
  flaggedLabel: { color: colors.dark.accentPurple },
});

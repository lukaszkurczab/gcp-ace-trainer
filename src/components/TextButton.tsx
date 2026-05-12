import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type TextButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export function TextButton({ children, disabled = false, onPress, style }: TextButtonProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, style]}>
      {({ pressed }) => (
        <Text style={[styles.label, pressed && !disabled ? styles.pressed : null, disabled ? styles.disabled : null]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  label: {
    ...typography.bodyStrong,
    color: colors.light.primary
  },
  pressed: {
    color: colors.light.primaryPressed
  },
  disabled: {
    color: colors.light.textMuted
  }
});

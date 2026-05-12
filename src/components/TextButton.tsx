import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, spacing, typography } from "../theme";

type TextButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
};

export function TextButton({ children, disabled = false, onPress }: TextButtonProps) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.button}>
      {({ pressed }) => (
        <Text style={[styles.label, pressed && !disabled ? styles.pressed : null, disabled ? styles.disabled : null]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs
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

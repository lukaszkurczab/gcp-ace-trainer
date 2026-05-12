import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  variant?: ButtonVariant;
};

export function Button({ children, disabled = false, loading = false, onPress, style, variant = "primary" }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={getActivityColor(variant)} size="small" style={styles.spinner} /> : null}
      <Text style={[styles.label, styles[`${variant}Label`], isDisabled ? styles.disabledLabel : null]}>{children}</Text>
    </Pressable>
  );
}

function getActivityColor(variant: ButtonVariant): string {
  return variant === "primary" || variant === "destructive" ? colors.light.surface : colors.light.primary;
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primary: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary
  },
  secondary: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border
  },
  ghost: {
    backgroundColor: colors.light.primarySoft,
    borderColor: colors.light.primarySoft
  },
  destructive: {
    backgroundColor: colors.light.danger,
    borderColor: colors.light.danger
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    backgroundColor: colors.light.elevatedSurface,
    borderColor: colors.light.border
  },
  spinner: {
    marginLeft: -spacing.xs
  },
  label: {
    ...typography.bodyStrong,
    flexShrink: 1,
    textAlign: "center"
  },
  primaryLabel: {
    color: colors.light.surface
  },
  secondaryLabel: {
    color: colors.light.textPrimary
  },
  ghostLabel: {
    color: colors.light.primary
  },
  destructiveLabel: {
    color: colors.light.surface
  },
  disabledLabel: {
    color: colors.light.textMuted
  }
});

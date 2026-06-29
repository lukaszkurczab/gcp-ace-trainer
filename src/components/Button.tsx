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
  return variant === "primary" || variant === "destructive" ? colors.dark.textPrimary : colors.dark.primary;
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
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary
  },
  secondary: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border
  },
  ghost: {
    backgroundColor: colors.dark.primarySoft,
    borderColor: colors.dark.primarySoft
  },
  destructive: {
    backgroundColor: colors.dark.danger,
    borderColor: colors.dark.danger
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border
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
    color: colors.dark.textPrimary
  },
  secondaryLabel: {
    color: colors.dark.textPrimary
  },
  ghostLabel: {
    color: colors.dark.primary
  },
  destructiveLabel: {
    color: colors.dark.textPrimary
  },
  disabledLabel: {
    color: colors.dark.textMuted
  }
});

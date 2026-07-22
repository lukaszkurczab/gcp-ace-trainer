import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type AccessibilityRole,
  type AccessibilityState,
  type ViewStyle,
} from "react-native";

import { radius, spacing, typography } from "../theme";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = {
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: Omit<AccessibilityState, "busy" | "disabled">;
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
  variant?: ButtonVariant;
};

export function Button({
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  children,
  disabled = false,
  loading = false,
  onPress,
  style,
  testID,
  variant = "primary",
}: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style
      ]}
      testID={testID}
    >
      {loading ? <ActivityIndicator color={getActivityColor(variant, palette)} size="small" style={styles.spinner} /> : null}
      <Text style={[styles.label, styles[`${variant}Label`], isDisabled ? styles.disabledLabel : null]}>{children}</Text>
    </Pressable>
  );
}

function getActivityColor(variant: ButtonVariant, palette: AppColors): string {
  return variant === "primary" || variant === "destructive" ? palette.textPrimary : palette.primary;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primary: {
    backgroundColor: palette.primary,
    borderColor: palette.primary
  },
  secondary: {
    backgroundColor: palette.surface,
    borderColor: palette.border
  },
  ghost: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primarySoft
  },
  destructive: {
    backgroundColor: palette.danger,
    borderColor: palette.danger
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border
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
    color: palette.textPrimary
  },
  secondaryLabel: {
    color: palette.textPrimary
  },
  ghostLabel: {
    color: palette.primary
  },
  destructiveLabel: {
    color: palette.textPrimary
  },
  disabledLabel: {
    color: palette.textMuted
  }
});

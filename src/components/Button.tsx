import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  useWindowDimensions,
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
  labelStyle?: StyleProp<TextStyle>;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
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
  labelStyle,
  onPress,
  style,
  testID,
  variant = "primary",
}: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const isDisabled = disabled || loading;
  const disabledStyle = variant === "primary" ? styles.primaryDisabled : variant === "secondary" ? styles.secondaryDisabled : variant === "destructive" ? styles.destructiveDisabled : styles.ghostDisabled;
  const disabledLabelStyle = variant === "primary" ? styles.primaryDisabledLabel : variant === "secondary" ? styles.secondaryDisabledLabel : variant === "destructive" ? styles.destructiveDisabledLabel : styles.ghostDisabledLabel;

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
        pressed && !isDisabled ? [styles.pressed, styles[`${variant}Pressed`]] : null,
        style,
        isDisabled ? disabledStyle : null,
      ]}
      testID={testID}
    >
      {loading ? <ActivityIndicator accessibilityElementsHidden color={getActivityColor(variant, palette, isDisabled)} importantForAccessibility="no" size="small" style={styles.spinner} /> : null}
      <ButtonLabel style={[styles.label, styles[`${variant}Label`], labelStyle, isDisabled ? disabledLabelStyle : null]}>{children}</ButtonLabel>
    </Pressable>
  );
}

function ButtonLabel({ children, style }: Readonly<{ children: ReactNode; style: StyleProp<TextStyle> }>) {
  const { fontScale } = useWindowDimensions();
  return <Text maxFontSizeMultiplier={2} key={fontScale} style={style}>{children}</Text>;
}

function getActivityColor(variant: ButtonVariant, palette: AppColors, isDisabled: boolean): string {
  if (variant === "destructive") return palette.onDanger;
  if (isDisabled) return variant === "primary" ? palette.textPrimary : variant === "secondary" ? palette.textMuted : palette.textSecondary;
  return variant === "primary" ? palette.onPrimary : palette.primary;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: 15
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
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  destructive: {
    backgroundColor: palette.danger,
    borderColor: palette.danger
  },
  pressed: {
    opacity: 1
  },
  primaryPressed: {
    backgroundColor: palette.primaryPressed,
  },
  secondaryPressed: {
    backgroundColor: palette.elevatedSurface,
  },
  ghostPressed: {
    backgroundColor: palette.effects.ghostPressed,
  },
  destructivePressed: {
    backgroundColor: palette.danger,
    borderColor: palette.danger,
  },
  primaryDisabled: {
    backgroundColor: palette.surfaceInput,
    borderColor: palette.textMuted,
  },
  secondaryDisabled: {
    backgroundColor: palette.surfaceInput,
    borderColor: palette.border,
  },
  destructiveDisabled: {
    backgroundColor: palette.danger,
    borderColor: palette.danger,
  },
  ghostDisabled: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  spinner: {
    marginLeft: -spacing.xs
  },
  label: {
    ...typography.button,
    flexShrink: 1,
    textAlign: "center"
  },
  primaryLabel: {
    color: palette.onPrimary
  },
  secondaryLabel: {
    color: palette.textPrimary
  },
  ghostLabel: {
    color: palette.textSecondary
  },
  destructiveLabel: {
    color: palette.onDanger
  },
  primaryDisabledLabel: {
    color: palette.textMuted,
  },
  secondaryDisabledLabel: {
    color: palette.textMuted,
  },
  destructiveDisabledLabel: {
    color: palette.onDanger,
  },
  ghostDisabledLabel: {
    color: palette.textSecondary,
    opacity: 0.55,
  }
});

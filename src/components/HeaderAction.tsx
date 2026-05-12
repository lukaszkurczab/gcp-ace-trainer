import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type HeaderActionSymbol = "plus" | "close" | "more" | "next";

type HeaderActionProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  label?: string;
  onPress: () => void;
  style?: ViewStyle;
  symbol?: HeaderActionSymbol;
};

export function HeaderAction({ accessibilityLabel, disabled = false, label, onPress, style, symbol = "next" }: HeaderActionProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, label ? styles.actionWithLabel : null, pressed && !disabled ? styles.pressed : null, disabled ? styles.disabled : null, style]}
    >
      {label ? <Text style={[styles.label, disabled ? styles.disabledText : null]}>{label}</Text> : null}
      <Text style={[styles.symbol, disabled ? styles.disabledText : null]}>{getSymbolText(symbol)}</Text>
    </Pressable>
  );
}

function getSymbolText(symbol: HeaderActionSymbol): string {
  switch (symbol) {
    case "plus":
      return "+";
    case "close":
      return "x";
    case "more":
      return "...";
    case "next":
      return ">";
  }
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: colors.light.elevatedSurface,
    borderColor: colors.light.border,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md
  },
  actionWithLabel: {
    paddingLeft: spacing.lg
  },
  pressed: {
    opacity: 0.78
  },
  disabled: {
    opacity: 0.56
  },
  label: {
    ...typography.caption,
    color: colors.light.textSecondary
  },
  symbol: {
    ...typography.bodyStrong,
    color: colors.light.textPrimary
  },
  disabledText: {
    color: colors.light.textMuted
  }
});

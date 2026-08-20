import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";

type ChoiceRowProps = {
  detail: string;
  disabled?: boolean;
  onPress: () => void;
  selected: boolean;
  testID?: string;
  title: string;
};

/** Canonical comfortable radio row from Figma's Choice Group pattern. */
export function ChoiceRow({ detail, disabled = false, onPress, selected, testID, title }: ChoiceRowProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, selected ? styles.selected : styles.unselected, disabled ? styles.disabled : null]}
      testID={testID}
    >
      <View style={[styles.radio, selected ? styles.radioSelected : styles.radioUnselected]}>
        {selected ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.content}>
        <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.detail}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
  },
  selected: {
    backgroundColor: palette.choice.surface,
    borderColor: palette.choice.active,
  },
  unselected: {
    backgroundColor: palette.choice.surface,
    borderColor: palette.choice.border,
  },
  disabled: {
    opacity: 0.6,
  },
  radio: {
    alignItems: "center",
    borderRadius: radius.lg - 2,
    borderWidth: 2,
    flexShrink: 0,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  radioSelected: {
    borderColor: palette.choice.active,
  },
  radioUnselected: {
    borderColor: palette.choice.border,
  },
  dot: {
    backgroundColor: palette.choice.active,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  title: {
    ...typography.listRowTitle,
    color: palette.choice.textPrimary,
  },
  detail: {
    ...typography.listRowDetail,
    color: palette.choice.textSecondary,
  },
});

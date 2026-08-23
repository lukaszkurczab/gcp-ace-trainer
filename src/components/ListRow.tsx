import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type ListRowProps = {
  detail?: string;
  disabled?: boolean;
  leading?: ReactNode;
  meta?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  title: string;
  trailing?: ReactNode;
  variant?: "card" | "grouped" | "settings";
};

export function ListRow({
  detail,
  disabled = false,
  leading,
  meta,
  onPress,
  style,
  testID,
  title,
  trailing,
  variant = "card",
}: ListRowProps) {
  const styles = useThemedStyles(createStyles);
  const rowStyle = [
    styles.row,
    variant === "grouped" ? styles.groupedRow : variant === "settings" ? styles.settingsRow : styles.cardRow,
    disabled ? styles.disabled : null,
    style,
  ];
  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={[styles.copy, variant === "card" ? null : styles.groupedCopy]}>
        <View style={[styles.titleRow, variant === "grouped" ? styles.groupedTitleRow : null]}>
          <Text maxFontSizeMultiplier={2} numberOfLines={2} style={[styles.title, variant === "grouped" ? styles.groupedTitle : variant === "settings" ? styles.settingsTitle : null]}>
            {title}
          </Text>
          {meta ? <Text maxFontSizeMultiplier={2} style={styles.meta}>{meta}</Text> : null}
        </View>
        {detail ? <Text maxFontSizeMultiplier={2} style={[styles.detail, variant === "grouped" ? styles.groupedDetail : variant === "settings" ? styles.settingsDetail : null, disabled ? styles.disabledDetail : null]}>{detail}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [rowStyle, pressed ? styles.pressed : null]}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle} testID={testID}>{content}</View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardRow: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  groupedRow: {
    backgroundColor: palette.listRow.surface,
    borderRadius: radius.lg,
    minHeight: 63,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  settingsRow: {
    backgroundColor: palette.listRow.surface,
    borderRadius: radius.button,
    minHeight: 63,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.84
  },
  disabled: {
    backgroundColor: palette.surfaceInput,
  },
  disabledDetail: {
    color: palette.textSecondary,
  },
  leading: {
    alignItems: "center",
    justifyContent: "center"
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  titleRow: {
    alignItems: "flex-start",
    gap: spacing.xs
  },
  groupedTitleRow: {
    gap: spacing.xxs,
  },
  groupedCopy: {
    gap: spacing.xxs,
  },
  title: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
    flexShrink: 1,
  },
  detail: {
    ...typography.small,
    color: palette.textSecondary
  },
  groupedTitle: {
    ...typography.listRowTitle,
    color: palette.listRow.textPrimary,
  },
  groupedDetail: {
    ...typography.listRowDetail,
    color: palette.listRow.textSecondary,
  },
  settingsTitle: {
    color: palette.listRow.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  settingsDetail: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 16,
  },
  meta: {
    ...typography.caption,
    color: palette.textMuted
  },
  trailing: {
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "center"
  }
});

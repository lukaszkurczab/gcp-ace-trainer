import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type ListRowProps = {
  detail?: string;
  leading?: ReactNode;
  meta?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  title: string;
  trailing?: ReactNode;
  variant?: "card" | "grouped";
};

export function ListRow({
  detail,
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
    variant === "grouped" ? styles.groupedRow : styles.cardRow,
    style,
  ];
  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
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
    backgroundColor: palette.elevatedSurface,
    borderBottomColor: palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.84
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
  title: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
    flexShrink: 1,
  },
  detail: {
    ...typography.small,
    color: palette.textSecondary
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

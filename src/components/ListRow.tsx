import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type ListRowProps = {
  detail?: string;
  leading?: ReactNode;
  meta?: string;
  onPress?: () => void;
  style?: ViewStyle;
  title: string;
  trailing?: ReactNode;
};

export function ListRow({ detail, leading, meta, onPress, style, title, trailing }: ListRowProps) {
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
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null, style]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
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
    color: colors.light.textPrimary
  },
  detail: {
    ...typography.small,
    color: colors.light.textSecondary
  },
  meta: {
    ...typography.caption,
    color: colors.light.textMuted
  },
  trailing: {
    alignItems: "center",
    flexShrink: 1,
    justifyContent: "center"
  }
});

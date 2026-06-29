import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type SettingsGroupProps = {
  children: ReactNode;
  title: string;
};

export function SettingsGroup({ children, title }: SettingsGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  title: {
    ...typography.caption,
    color: colors.dark.textMuted,
    paddingHorizontal: spacing.sm,
    textTransform: "uppercase",
  },
  rows: {
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});

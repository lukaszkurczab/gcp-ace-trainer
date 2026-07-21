import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type SettingsGroupProps = {
  children: ReactNode;
  title: string;
};

export function SettingsGroup({ children, title }: SettingsGroupProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.group}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  title: {
    ...typography.caption,
    color: palette.textMuted,
    paddingHorizontal: spacing.sm,
    textTransform: "uppercase",
  },
  rows: {
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});

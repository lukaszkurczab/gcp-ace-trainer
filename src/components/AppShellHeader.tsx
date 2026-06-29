import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type AppShellHeaderProps = {
  action?: ReactNode;
  subtitle: string;
  title: string;
};

export function AppShellHeader({ action, subtitle, title }: AppShellHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.brandMark}>
          <View style={styles.brandMarkCell} />
          <View style={styles.brandMarkCell} />
          <View style={styles.brandMarkCell} />
          <View style={styles.brandMarkCell} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.brandTitle}>{title}</Text>
          <Text style={styles.headerMeta}>{subtitle}</Text>
        </View>
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  brandMark: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
    height: 28,
    width: 28,
  },
  brandMarkCell: {
    backgroundColor: colors.light.primary,
    borderRadius: radius.xs,
    height: 12,
    width: 12,
  },
  headerCopy: {
    gap: spacing.xxs,
  },
  brandTitle: {
    ...typography.heading,
    color: colors.light.textPrimary,
  },
  headerMeta: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
});

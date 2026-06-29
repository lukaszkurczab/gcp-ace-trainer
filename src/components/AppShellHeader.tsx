import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";
import { Icon } from "./Icon";

type AppShellHeaderProps = {
  action?: ReactNode;
  subtitle: string;
  title: string;
};

export function AppShellHeader({ action, subtitle, title }: AppShellHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Icon color={colors.dark.primary} name="grid" size={30} />
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
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  headerCopy: {
    gap: spacing.xxs,
  },
  brandTitle: {
    ...typography.heading,
    color: colors.dark.textPrimary,
  },
  headerMeta: {
    ...typography.caption,
    color: colors.dark.textSecondary,
  },
});

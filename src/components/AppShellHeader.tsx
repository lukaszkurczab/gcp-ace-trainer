import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../theme";
import { Icon } from "./Icon";
import { useAppPreferences, useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type AppShellHeaderProps = {
  action?: ReactNode;
  subtitle?: string;
  title: string;
};

export function AppShellHeader({ action, subtitle, title }: AppShellHeaderProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Icon color={palette.primary} name="grid" size={30} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.brandTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerMeta}>{subtitle}</Text> : null}
        </View>
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brandRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minWidth: 0,
  },
  brandMark: {
    alignItems: "center",
    flexShrink: 0,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  brandTitle: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  headerMeta: {
    ...typography.caption,
    color: palette.textSecondary,
    flexShrink: 1,
  },
});

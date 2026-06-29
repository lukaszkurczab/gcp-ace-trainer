import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";

type SectionHeaderProps = {
  action?: React.ReactNode;
  subtitle?: string;
  title: string;
  tight?: boolean;
};

export function SectionHeader({ action, subtitle, tight = false, title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.copy, tight ? styles.copyTight : null]}>
        <Text style={[styles.title, tight ? styles.titleTight : null]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  copyTight: {
    gap: spacing.xxs
  },
  title: {
    ...typography.heading,
    color: colors.dark.textPrimary
  },
  titleTight: {
    ...typography.bodyStrong
  },
  subtitle: {
    ...typography.small,
    color: colors.dark.textSecondary
  }
});

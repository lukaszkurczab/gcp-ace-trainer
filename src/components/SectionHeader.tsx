import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";

type SectionHeaderProps = {
  action?: React.ReactNode;
  subtitle?: string;
  title: string;
};

export function SectionHeader({ action, subtitle, title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
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
  title: {
    ...typography.heading,
    color: colors.light.text
  },
  subtitle: {
    ...typography.body,
    color: colors.light.textMuted
  }
});

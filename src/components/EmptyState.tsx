import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";
import { Button } from "./Button";

type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  onActionPress?: () => void;
  title: string;
};

export function EmptyState({ actionLabel, description, onActionPress, title }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onActionPress ? <Button onPress={onActionPress}>{actionLabel}</Button> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg
  },
  title: {
    ...typography.heading,
    color: colors.dark.textPrimary
  },
  description: {
    ...typography.body,
    color: colors.dark.textSecondary
  }
});

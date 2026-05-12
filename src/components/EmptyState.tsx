import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";
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
    gap: spacing.md
  },
  title: {
    ...typography.heading,
    color: colors.light.text
  },
  description: {
    ...typography.body,
    color: colors.light.textMuted
  }
});

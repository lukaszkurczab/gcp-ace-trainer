import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { Button } from "./Button";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  onActionPress?: () => void;
  title: string;
};

export function EmptyState({ actionLabel, description, onActionPress, title }: EmptyStateProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onActionPress ? <Button onPress={onActionPress}>{actionLabel}</Button> : null}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: {
    alignItems: "flex-start",
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary
  },
  description: {
    ...typography.body,
    color: palette.textSecondary
  }
});

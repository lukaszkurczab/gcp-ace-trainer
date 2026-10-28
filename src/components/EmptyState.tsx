import { StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "../theme";
import { Button } from "./Button";
import { useThemedStyles } from "../preferences/appPreferencesContext";
import type { AppColors } from "../theme";


type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  descriptionTone?: "muted" | "secondary";
  onActionPress?: () => void;
  title: string;
};

export function EmptyState({ actionLabel, description, onActionPress, title, descriptionTone = "muted" }: EmptyStateProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text>
      <Text maxFontSizeMultiplier={2} style={[styles.description, descriptionTone === "secondary" ? styles.descriptionSecondary : null]}>{description}</Text>
      {actionLabel && onActionPress ? <Button onPress={onActionPress} style={styles.action}>{actionLabel}</Button> : null}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: 20,
    paddingVertical: spacing.xxxl,
    width: "100%"
  },
  action: {
    width: "100%"
  },
  title: {
    ...typography.statusTitle,
    color: palette.emptyState.textPrimary,
    flexShrink: 1,
    textAlign: "center"
  },
  descriptionSecondary: { color: palette.textSecondary },
  description: {
    ...typography.statusDescription,
    color: palette.emptyState.textMuted,
    flexShrink: 1,
    textAlign: "center"
  }
});

import { StyleSheet, Text, View } from "react-native";

import { Button, Card, Icon } from "../../../../components";
import { colors, spacing, typography } from "../../../../theme";

type SimulationPersistenceErrorPanelProps = {
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
};

export function SimulationPersistenceErrorPanel({
  detail = "Your draft remains available. Retry saving before you continue.",
  onRetry,
  retryLabel = "Retry",
  title = "Unable to save your answer",
}: SimulationPersistenceErrorPanelProps) {
  return (
    <Card variant="warning" style={styles.card}>
      <View style={styles.heading}>
        <Icon color={colors.dark.warning} name="alert-triangle" size={20} />
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.detail}>{detail}</Text>
      {onRetry ? <Button onPress={onRetry} variant="secondary">{retryLabel}</Button> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  heading: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  title: { ...typography.bodyStrong, color: colors.dark.textPrimary, flex: 1 },
  detail: { ...typography.small, color: colors.dark.textSecondary },
});

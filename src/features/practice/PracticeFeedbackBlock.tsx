import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { colors, radius, spacing, typography } from "../../theme";
import type { PracticeFeedback } from "./practiceSessionPresentation";

export function PracticeFeedbackBlock({ feedback }: Readonly<{ feedback: PracticeFeedback }>) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <View accessibilityLabel="Verified answer explanation" style={styles.container}>
      <Text style={styles.reason}>{feedback.reason}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: detailsOpen }}
        onPress={() => setDetailsOpen((current) => !current)}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsLabel}>Details</Text>
        <Text style={styles.detailsIndicator}>{detailsOpen ? "−" : "+"}</Text>
      </Pressable>
      {detailsOpen ? <Text style={styles.details}>{feedback.details}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.dark.elevatedSurface, borderColor: colors.dark.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  details: { ...typography.small, color: colors.dark.textSecondary },
  detailsIndicator: { ...typography.bodyStrong, color: colors.dark.accentPurple },
  detailsLabel: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  detailsToggle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 40 },
  reason: { ...typography.bodyStrong, color: colors.dark.textPrimary },
});

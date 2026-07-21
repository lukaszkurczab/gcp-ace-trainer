import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { radius, spacing, typography } from "../../theme";
import type { PracticeFeedback } from "./practiceSessionPresentation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";


export function PracticeFeedbackBlock({ feedback }: Readonly<{ feedback: PracticeFeedback }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <View style={styles.container}>
      <Text accessibilityLabel={`${t("Verified answer explanation.")} ${feedback.reason}`} style={styles.reason}>{feedback.reason}</Text>
      <Pressable
        accessibilityLabel={t(detailsOpen ? "Hide answer details" : "Show answer details")}
        accessibilityRole="button"
        accessibilityState={{ expanded: detailsOpen }}
        onPress={() => setDetailsOpen((current) => !current)}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsLabel}>{t("Details")}</Text>
        <Text style={styles.detailsIndicator}>{detailsOpen ? "−" : "+"}</Text>
      </Pressable>
      {detailsOpen ? <Text style={styles.details}>{feedback.details}</Text> : null}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: { backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  details: { ...typography.small, color: palette.textSecondary },
  detailsIndicator: { ...typography.bodyStrong, color: palette.accentPurple },
  detailsLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  detailsToggle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 48 },
  reason: { ...typography.bodyStrong, color: palette.textPrimary },
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { radius, spacing, typography } from "../../theme";
import type { PracticeFeedback } from "./practiceSessionPresentation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { AlgorithmFeedbackDocumentBlock } from "./AlgorithmFeedbackDocumentBlock";
import type { ContentItemRef } from "../../domain";


export function PracticeFeedbackBlock({ feedback, item, itemId }: Readonly<{ feedback: PracticeFeedback; item: ContentItemRef; itemId: string }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <View style={styles.container} testID={runtimeSelectors.session.feedback(itemId)}>
      <Text style={styles.result} testID={runtimeSelectors.session.result(itemId, feedback.result)}>
        {feedback.result === "correct" ? t("Correct") : t("Incorrect")}
      </Text>
      <Text accessibilityLabel={`${t("Verified answer explanation.")} ${feedback.reason}`} style={styles.reason} testID={runtimeSelectors.session.reason(itemId)}>{feedback.reason}</Text>
      <Pressable
        accessibilityLabel={t(detailsOpen ? "Hide answer details" : "Show answer details")}
        accessibilityRole="button"
        accessibilityState={{ expanded: detailsOpen }}
        onPress={() => setDetailsOpen((current) => !current)}
        style={styles.detailsToggle}
        testID={runtimeSelectors.session.detailsToggle(itemId)}
      >
        <Text style={styles.detailsLabel}>{t("Details")}</Text>
        <Text style={styles.detailsIndicator}>{detailsOpen ? "−" : "+"}</Text>
      </Pressable>
      {detailsOpen ? <View style={styles.details} testID={runtimeSelectors.session.details(itemId)}><AlgorithmFeedbackDocumentBlock document={feedback.details} item={item} /></View> : null}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: { backgroundColor: palette.elevatedSurface, borderColor: palette.borderStrong, borderRadius: radius.xl, borderWidth: 1, gap: spacing.lg, padding: spacing.xxl },
  details: { gap: spacing.md },
  detailsIndicator: { ...typography.bodyStrong, color: palette.accentPurple },
  detailsLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  detailsToggle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 48 },
  reason: { ...typography.bodyStrong, color: palette.textPrimary },
  result: { ...typography.caption, color: palette.accentPurple, letterSpacing: 0.7, textTransform: "uppercase" },
});

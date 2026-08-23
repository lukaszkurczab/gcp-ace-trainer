import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { DetailsDisclosure } from "../../components";
import { radius, spacing, typography } from "../../theme";
import type { PracticeFeedback } from "./practiceSessionPresentation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { AlgorithmFeedbackDocumentBlock } from "./AlgorithmFeedbackDocumentBlock";
import type { ContentItemRef } from "../../domain";


export function PracticeFeedbackBlock({ feedback, item, itemId }: Readonly<{ feedback: PracticeFeedback; item: ContentItemRef; itemId: string }>) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <View style={styles.container} testID={runtimeSelectors.session.feedback(itemId)}>
      <View accessible accessibilityLabel={`${t("Answer result")}: ${t(formatFeedbackResult(feedback.result))}`}>
        <Text style={styles.result} testID={runtimeSelectors.session.result(itemId, feedback.result)}>{t(formatFeedbackResult(feedback.result))}</Text>
      </View>
      <View style={styles.reasonPanel}>
        <Text style={styles.reasonLabel}>{t("Reason")}</Text>
        <Text accessibilityLabel={`${t("Verified answer explanation.")} ${feedback.reason}`} style={styles.reason} testID={runtimeSelectors.session.reason(itemId)}>{feedback.reason}</Text>
      </View>
      <DetailsDisclosure expanded={detailsOpen} onPress={() => setDetailsOpen((current) => !current)} testID={runtimeSelectors.session.detailsToggle(itemId)} />
      {detailsOpen ? <View style={styles.details} testID={runtimeSelectors.session.details(itemId)}><AlgorithmFeedbackDocumentBlock document={feedback.details} item={item} /></View> : null}
    </View>
  );
}

function formatFeedbackResult(result: PracticeFeedback["result"]): string {
  switch (result) {
    case "correct":
      return "Correct";
    case "partial":
      return "Partial";
    case "incorrect":
      return "Incorrect";
  }
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: { gap: spacing.md },
  details: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.md, paddingTop: spacing.md },
  reason: { ...typography.body, color: palette.textSecondary },
  reasonLabel: { ...typography.caption, color: palette.textSecondary, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  reasonPanel: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  result: { ...typography.caption, alignSelf: "flex-start", color: palette.accentPurple, letterSpacing: 0.7, textTransform: "uppercase" },
});

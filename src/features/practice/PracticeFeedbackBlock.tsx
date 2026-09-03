import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { DetailsDisclosure } from "../../components";
import { radius, spacing, typography } from "../../theme";
import type { PracticeFeedback } from "./practiceSessionPresentation";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { AlgorithmFeedbackDocumentBlock } from "./AlgorithmFeedbackDocumentBlock";
import type { ContentItemRef } from "../../domain";
import { ContentReportSheet, type ContentReportSurfaceContext } from "../reports/ContentReportSheet";


export function PracticeFeedbackBlock({ feedback, item, itemId, reportSurface }: Readonly<{ feedback: PracticeFeedback; item: ContentItemRef; itemId: string; reportSurface: ContentReportSurfaceContext }>) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const { t } = useTranslation("common");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsDisclosure = <DetailsDisclosure expanded={detailsOpen} onPress={() => setDetailsOpen((current) => !current)} testID={runtimeSelectors.session.detailsToggle(itemId)} />;
  return (
    <View style={styles.feedbackCard} testID={runtimeSelectors.session.feedback(itemId)}>
      <View style={styles.reasonPanel} testID={runtimeSelectors.session.result(itemId, feedback.result)}>
        <Text key={`reason-label:${fontScale}`} maxFontSizeMultiplier={2} style={styles.reasonLabel}>{t("Reason")}</Text>
        <Text key={`reason:${fontScale}`} accessibilityLabel={`${t("Answer explanation.")} ${feedback.reason}`} maxFontSizeMultiplier={2} style={styles.reason} testID={runtimeSelectors.session.reason(itemId)}>{feedback.reason}</Text>
      </View>
      <View style={styles.detailsSection}>
        <View style={styles.detailsDivider} />
        {detailsDisclosure}
        {detailsOpen ? <View style={styles.details} testID={runtimeSelectors.session.details(itemId)}><AlgorithmFeedbackDocumentBlock document={feedback.details} item={item} /><ContentReportSheet item={item} surface={reportSurface} /></View> : null}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  details: { gap: spacing.md, paddingTop: spacing.xs },
  detailsDivider: { backgroundColor: palette.border, height: StyleSheet.hairlineWidth, width: "100%" },
  detailsSection: { gap: spacing.md },
  feedbackCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xl, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  reason: { ...typography.body, color: palette.textSecondary },
  reasonLabel: { color: palette.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  reasonPanel: { gap: spacing.sm },
});

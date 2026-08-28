import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { DetailsDisclosure } from "../../components";
import { radius, spacing, typography } from "../../theme";
import type { PracticeFeedback } from "./practiceSessionPresentation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { AlgorithmFeedbackDocumentBlock } from "./AlgorithmFeedbackDocumentBlock";
import type { ContentItemRef } from "../../domain";
import { ContentReportSheet, type ContentReportSurfaceContext } from "../reports/ContentReportSheet";


export function PracticeFeedbackBlock({ feedback, item, itemId, reportSurface }: Readonly<{ feedback: PracticeFeedback; item: ContentItemRef; itemId: string; reportSurface: ContentReportSurfaceContext }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsDisclosure = <DetailsDisclosure expanded={detailsOpen} onPress={() => setDetailsOpen((current) => !current)} testID={runtimeSelectors.session.detailsToggle(itemId)} />;
  return (
    <View style={styles.container} testID={runtimeSelectors.session.feedback(itemId)}>
      <View style={styles.reasonPanel} testID={runtimeSelectors.session.result(itemId, feedback.result)}>
        <Text maxFontSizeMultiplier={2} style={[styles.reasonLabel, detailsOpen ? styles.reasonLabelExpanded : null]}>{t("Reason")}</Text>
        <Text accessibilityLabel={`${t("Verified answer explanation.")} ${feedback.reason}`} maxFontSizeMultiplier={2} style={styles.reason} testID={runtimeSelectors.session.reason(itemId)}>{feedback.reason}</Text>
      </View>
      {detailsOpen ? (
        <View style={styles.detailsSection}>
          {detailsDisclosure}
          <View style={styles.details} testID={runtimeSelectors.session.details(itemId)}><AlgorithmFeedbackDocumentBlock document={feedback.details} item={item} /><ContentReportSheet item={item} surface={reportSurface} /></View>
        </View>
      ) : detailsDisclosure}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: { gap: spacing.md },
  details: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.md, paddingTop: spacing.md },
  detailsSection: { backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  reason: { ...typography.body, color: palette.textSecondary },
  reasonLabel: { color: palette.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  reasonLabelExpanded: { textTransform: "uppercase" },
  reasonPanel: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
});

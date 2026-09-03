import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { DetailsDisclosure } from "../../components";
import type { ContentItemRef } from "../../domain";
import type { AlgorithmFeedbackDocument } from "../../content/contracts";
import { useThemedStyles } from "../../preferences";
import { colorWithOpacity, radius, spacing, typography, type AppColors } from "../../theme";
import { AlgorithmFeedbackDocumentBlock } from "../practice/AlgorithmFeedbackDocumentBlock";
import { ContentReportSheet, type ContentReportSurfaceContext } from "../reports/ContentReportSheet";

type ReviewFeedbackBlockProps = Readonly<{
  feedback: Readonly<{ details: AlgorithmFeedbackDocument; reason: string }>;
  item: ContentItemRef;
  reportSurface: ContentReportSurfaceContext;
}>;

/** Figma review feedback: a plain reason section and an expandable details disclosure. */
export function ReviewFeedbackBlock({ feedback, item, reportSurface }: ReviewFeedbackBlockProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.reasonSection}>
        <Text maxFontSizeMultiplier={2} style={styles.reasonLabel}>{t("Reason")}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.reason}>{feedback.reason}</Text>
      </View>
      <View style={styles.detailsSection}>
        <View style={styles.detailsDivider} />
        <DetailsDisclosure expanded={detailsOpen} onPress={() => setDetailsOpen((current) => !current)} />
        {detailsOpen ? <View style={styles.details}><AlgorithmFeedbackDocumentBlock document={feedback.details} item={item} /><ContentReportSheet item={item} surface={reportSurface} /></View> : null}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  details: { gap: spacing.lg, paddingTop: spacing.xs },
  detailsSection: { gap: spacing.md },
  detailsDivider: { backgroundColor: palette.effects.divider, height: StyleSheet.hairlineWidth, width: "100%" },
  feedbackCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xl, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  reason: { ...typography.body, color: palette.textSecondary, fontWeight: "500" },
  reasonLabel: { ...typography.caption, color: colorWithOpacity(palette.ambient.review, 0.6), fontWeight: "600", letterSpacing: 0.8, lineHeight: 13, textTransform: "uppercase" },
  reasonSection: { gap: spacing.sm },
});

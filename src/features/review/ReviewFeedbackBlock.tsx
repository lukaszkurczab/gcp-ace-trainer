import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DetailsDisclosure } from "../../components";
import type { ContentItemRef } from "../../domain";
import type { AlgorithmFeedbackDocument } from "../../content/contracts";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { colorWithOpacity, spacing, typography, type AppColors } from "../../theme";
import { AlgorithmFeedbackDocumentBlock } from "../practice/AlgorithmFeedbackDocumentBlock";

type ReviewFeedbackBlockProps = Readonly<{
  feedback: Readonly<{ details: AlgorithmFeedbackDocument; reason: string }>;
  item: ContentItemRef;
}>;

/** Figma review feedback: a plain reason section and an expandable details disclosure. */
export function ReviewFeedbackBlock({ feedback, item }: ReviewFeedbackBlockProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <View style={styles.feedback}>
      <View style={styles.reasonSection}>
        <View style={styles.reasonDivider} />
        <View style={styles.reasonSpacer} />
        <Text maxFontSizeMultiplier={2} style={styles.reasonLabel}>{t("Reason")}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.reason}>{feedback.reason}</Text>
      </View>
      <View style={[styles.detailsSection, detailsOpen ? styles.detailsSectionExpanded : null]}>
        {detailsOpen ? <View style={styles.detailsDivider} /> : null}
        <DetailsDisclosure expanded={detailsOpen} onPress={() => setDetailsOpen((current) => !current)} />
        {detailsOpen ? <View style={styles.details}><AlgorithmFeedbackDocumentBlock document={feedback.details} item={item} /></View> : null}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  details: { gap: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.xs },
  detailsSection: { gap: spacing.xl },
  detailsSectionExpanded: { gap: 0 },
  detailsDivider: { backgroundColor: colorWithOpacity("#FFFFFF", 0.06), height: StyleSheet.hairlineWidth, width: "100%" },
  feedback: { gap: spacing.xl },
  reason: { ...typography.body, color: palette.textSecondary, fontWeight: "500" },
  reasonDivider: { backgroundColor: colorWithOpacity("#FFFFFF", 0.06), height: StyleSheet.hairlineWidth, width: "100%" },
  reasonLabel: { ...typography.caption, color: colorWithOpacity(palette.primary, 0.6), fontWeight: "600", letterSpacing: 0.8, lineHeight: 13, textTransform: "uppercase" },
  reasonSection: { gap: spacing.sm },
  reasonSpacer: { height: spacing.xs },
});

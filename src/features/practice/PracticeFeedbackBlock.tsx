import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { DetailsDisclosure } from "../../components";
import { openCanonicalSourceLink } from "../../application/canonical/canonicalSourceLinks";
import { radius, spacing, typography } from "../../theme";
import type { PracticeFeedback } from "./practiceSessionPresentation";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import type { ResolvedContentRef } from "../../domain";
import { ContentReportSheet, type ContentReportSurfaceContext } from "../reports/ContentReportSheet";
import { detailLines } from "./feedbackDetails";


export function PracticeFeedbackBlock({ feedback, item, itemId, reportSurface }: Readonly<{ feedback: PracticeFeedback; item: ResolvedContentRef; itemId: string; reportSurface: ContentReportSurfaceContext }>) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const { t } = useTranslation("common");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sourceError, setSourceError] = useState(false);
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
        {detailsOpen ? <View style={styles.details} testID={runtimeSelectors.session.details(itemId)}>{feedback.messages?.map((message) => <Text key={`${message.kind}:${message.targetId}`} style={styles.detailText}>{message.text}</Text>)}{detailLines(feedback.details).filter((line) => !feedback.sources?.some((source) => source.url === line)).map((line, index) => <Text key={`detail:${index}`} maxFontSizeMultiplier={2} style={styles.detailText}>{line}</Text>)}<View style={styles.sources}><Text maxFontSizeMultiplier={2} style={styles.sourceLabel}>{t("Source")}</Text>{feedback.sources?.length ? feedback.sources.map((source, index) => <Pressable accessibilityLabel={`${t("Open source")} ${source.host}`} accessibilityRole="link" key={source.url} onPress={() => { setSourceError(false); void openCanonicalSourceLink(source, Linking.openURL).then((result) => setSourceError(result === "failed")); }} testID={`question-source-link-${itemId}-${index}`}><Text maxFontSizeMultiplier={2} style={styles.sourceLink}>{source.host}</Text></Pressable>) : <Text maxFontSizeMultiplier={2} style={styles.sourceUnavailable}>{t("Source unavailable")}</Text>}{sourceError ? <Text accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.sourceError}>{t("The source could not be opened.")}</Text> : null}</View><ContentReportSheet item={item} surface={reportSurface} /></View> : null}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  details: { gap: spacing.md, paddingTop: spacing.xs },
  detailText: { ...typography.body, color: palette.textSecondary },
  detailsDivider: { backgroundColor: palette.border, height: StyleSheet.hairlineWidth, width: "100%" },
  detailsSection: { gap: spacing.md },
  feedbackCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.xl, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  reason: { ...typography.body, color: palette.textSecondary },
  reasonLabel: { color: palette.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  reasonPanel: { gap: spacing.sm },
  sourceError: { ...typography.caption, color: palette.danger },
  sourceLabel: { ...typography.bodyStrong, color: palette.textPrimary },
  sourceLink: { ...typography.bodyStrong, color: palette.primary, textDecorationLine: "underline" },
  sources: { gap: spacing.sm },
  sourceUnavailable: { ...typography.body, color: palette.textMuted },
});

import { useTranslation } from "react-i18next";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { useThemedStyles } from "../preferences";
import { radius, spacing, type AppColors } from "../theme";
import { IconButton } from "./IconButton";
import { Screen } from "./Screen";
import { SkeletonShape, useSkeletonGlassMotion } from "./SkeletonShape";

export type ReviewLoadingSkeletonProps = Readonly<{
  onBack: () => void;
}>;

/** Neutral review anatomy shared by answer-level and simulation review reads. */
export function ReviewLoadingSkeleton({ onBack }: ReviewLoadingSkeletonProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={(
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.footer}>
          <SkeletonShape motion={motion} style={[styles.footerAction, { minHeight: 48 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.footerAction, { minHeight: 48 * textScale }]} />
        </View>
      )}
      footerVariant="review"
      header={(
        <View style={styles.header}>
          <IconButton accessibilityLabel={t("Go back")} icon="chevron-left" onPress={onBack} />
          <Text maxFontSizeMultiplier={2} style={styles.headerTitle}>{t("Answer review")}</Text>
        </View>
      )}
      style={styles.screen}
    >
      <View
        accessibilityLabel={t("Loading review…")}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessible
        style={styles.content}
        testID="review-loading-skeleton"
      >
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.shapes}>
          <View style={styles.context} testID="review-loading-header">
            <SkeletonShape motion={motion} style={[styles.line, styles.contextLine, { height: 16 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.contextLineShort, { height: 13 * textScale }]} />
          </View>
          <View style={[styles.filter, largeLayout ? styles.filterLarge : null]} testID="review-loading-filter">
            <SkeletonShape motion={motion} style={[styles.line, styles.filterTab, { height: 34 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.filterTab, { height: 34 * textScale }]} />
          </View>
          <View style={styles.question} testID="review-loading-question">
            <SkeletonShape motion={motion} style={[styles.line, styles.questionEyebrow, { height: 12 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.questionLine, { height: 22 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.questionLineShort, { height: 17 * textScale }]} />
          </View>
          <View style={styles.response} testID="review-loading-response">
            <SkeletonShape motion={motion} style={[styles.line, styles.responseLine, { height: 48 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.responseLine, { height: 48 * textScale }]} />
          </View>
          <View style={styles.feedback} testID="review-loading-feedback">
            <SkeletonShape motion={motion} style={[styles.line, styles.feedbackTitle, { height: 16 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.feedbackLine, { height: 14 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.line, styles.feedbackLineShort, { height: 14 * textScale }]} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  content: { flex: 1, gap: spacing.xl },
  context: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  contextLine: { width: "56%" },
  contextLineShort: { width: "32%" },
  feedback: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  feedbackLine: { width: "82%" },
  feedbackLineShort: { width: "59%" },
  feedbackTitle: { width: "36%" },
  filter: { flexDirection: "row", gap: spacing.sm },
  filterLarge: { flexWrap: "wrap" },
  filterTab: { backgroundColor: palette.surfaceInput, borderRadius: radius.md, flex: 1 },
  footer: { flexDirection: "row", gap: spacing.sm, width: "100%" },
  footerAction: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.md, flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  headerTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: "600", lineHeight: 19 },
  line: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1 },
  question: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  questionEyebrow: { width: "24%" },
  questionLine: { width: "92%" },
  questionLineShort: { width: "68%" },
  response: { gap: spacing.sm },
  responseLine: { backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, flex: 1 },
  screen: { gap: 0, paddingBottom: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  shapes: { gap: spacing.xl },
});

import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Button, Card, Icon, IconTile } from "../../../components";
import type { TrackDisplay, TrainingSession } from "../../../domain";
import type { TrainingAttempt } from "../../../domain";
import type { CodingInterviewDashboard } from "../../../application/coding-interview";
import { spacing, typography } from "../../../theme";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { buildHomeTabModel, type HomeRecommendationAction } from "./homeTabModel";
import { useAppPreferences, useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";
import { runtimeSelectors } from "../../../testing/runtimeSelectors";
import {
  formatPracticeTopicDetail,
  formatPracticeTopicTitle,
} from "../../practice/practiceFlowPresentation";


type HomeTabProps = {
  activeTrack: TrackDisplay;
  activeSession: TrainingSession | null;
  analytics: AnalyticsData;
  algorithmsDashboard: CodingInterviewDashboard | null;
  dashboardError: string | null;
  onChangeTrack: () => void;
  onChooseTopic: () => void;
  onRecommendationAction: (action: HomeRecommendationAction) => void;
  onStartLearning: (topicId: string) => void;
  trainingAttempts: readonly TrainingAttempt[];
};

export function HomeTab({
  activeTrack,
  activeSession,
  analytics,
  algorithmsDashboard,
  dashboardError,
  onChangeTrack,
  onChooseTopic,
  onRecommendationAction,
  onStartLearning,
  trainingAttempts,
}: HomeTabProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  const model = buildHomeTabModel({ activeSession, activeTrack, algorithmsDashboard, analytics, dashboardError, trainingAttempts });
  const recommendation = model.recommendations[0];
  const resumeSessionId = recommendation?.action.kind === "resume_active_session" || recommendation?.action.kind === "resume_certification_practice"
    ? recommendation.action.sessionId
    : undefined;
  const decisionTitle = recommendation?.title ?? formatPracticeTopicTitle(model.heroTitle, t);
  const decisionDetail = recommendation
    ? t(recommendation.unavailableReason ?? recommendation.detail)
    : formatPracticeTopicDetail(model.heroSubtitle, t);
  const decisionLabel = recommendation?.primaryLabel ?? model.primaryLabel;
  const isCodingInterviewTrack = activeTrack.id === "coding-interview-dsa-problem-solving";
  const decisionIcon = recommendation?.icon ?? (isCodingInterviewTrack ? "route" : "cloud");
  const decisionTone = recommendation?.enabled === false ? "muted" : "primary";
  const decisionEnabled = recommendation?.enabled ?? true;

  return (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>{t("Your next practice")}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onChangeTrack}
          style={({ pressed }) => [
            styles.trackContext,
            largeText ? styles.trackContextLargeText : null,
            pressed ? styles.pressed : null,
          ]}
          testID={runtimeSelectors.home.changeTrack()}
        >
          <View style={styles.trackContextCopy}>
            <View style={styles.trackDot} />
            <View style={styles.trackLabels}>
              <Text style={styles.eyebrow}>{t("Current track")}</Text>
              <Text style={styles.focusTitle} testID={runtimeSelectors.home.trackCard(activeTrack.id)}>
                {t(model.focusTitle)}
              </Text>
            </View>
          </View>
          <Icon color={palette.accentPurple} name="chevron-right" size={18} />
        </Pressable>
      </View>

      <Card variant="layered" style={styles.decisionCard}>
        <Text style={styles.heroEyebrow}>{t(recommendation?.label ?? "Recommended for you")}</Text>
        <View
          style={[styles.decisionHeading, largeText ? styles.decisionHeadingLargeText : null]}
          testID={resumeSessionId
            ? runtimeSelectors.resume.card(resumeSessionId)
            : undefined}
        >
          <IconTile name={decisionIcon} size={48} tone={decisionTone} />
          <Text
            style={styles.decisionTitle}
            testID={resumeSessionId
              ? runtimeSelectors.resume.title(resumeSessionId)
              : undefined}
          >
            {t(decisionTitle)}
          </Text>
        </View>
        <View style={styles.divider} />
        <Text
          style={styles.decisionDetail}
          testID={resumeSessionId
            ? runtimeSelectors.resume.status(resumeSessionId)
            : undefined}
        >
          {decisionDetail}
        </Text>
        <Button
          disabled={!decisionEnabled}
          onPress={() => {
            if (recommendation) {
              onRecommendationAction(recommendation.action);
              return;
            }
            onStartLearning(model.topicId);
          }}
          testID={resumeSessionId
            ? runtimeSelectors.resume.continue(resumeSessionId)
            : undefined}
        >
          {t(decisionLabel)}
        </Button>
        <View style={styles.alternativeDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.orLabel}>{t("or")}</Text>
          <View style={styles.dividerLine} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onChooseTopic}
          style={({ pressed }) => [styles.secondaryAction, pressed ? styles.pressed : null]}
        >
          <Text style={styles.secondaryActionText}>{t("Choose another topic")}</Text>
          <Icon color={palette.accentPurple} name="chevron-right" size={18} />
        </Pressable>
      </Card>
    </>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  pageIntro: {
    gap: spacing.lg,
  },
  pageTitle: {
    ...typography.title,
    color: palette.textPrimary,
  },
  trackContext: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 48,
    paddingVertical: spacing.xs,
  },
  trackContextLargeText: {
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  trackContextCopy: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minWidth: 0,
  },
  trackDot: {
    backgroundColor: palette.primary,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  trackLabels: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  focusTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  pressed: {
    opacity: 0.78,
  },
  eyebrow: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  decisionCard: {
    gap: spacing.xl,
  },
  heroEyebrow: {
    ...typography.caption,
    color: palette.accentPurple,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  decisionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
  },
  decisionHeadingLargeText: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  decisionTitle: {
    ...typography.heading,
    color: palette.textPrimary,
    flex: 1,
  },
  divider: {
    backgroundColor: palette.border,
    height: StyleSheet.hairlineWidth,
  },
  decisionDetail: {
    ...typography.body,
    color: palette.textSecondary,
  },
  alternativeDivider: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dividerLine: {
    backgroundColor: palette.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  orLabel: {
    ...typography.caption,
    color: palette.textMuted,
  },
  secondaryAction: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  secondaryActionText: {
    ...typography.bodyStrong,
    color: palette.accentPurple,
  },
});

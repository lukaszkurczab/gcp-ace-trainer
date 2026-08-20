import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Button, Card, Icon } from "../../../components";
import type { TrackDisplay, TrainingSession } from "../../../domain";
import type { TrainingAttempt } from "../../../domain";
import type { CodingInterviewDashboard } from "../../../application/coding-interview";
import { colorWithOpacity, spacing, typography } from "../../../theme";
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
            <View style={styles.trackIconContainer}>
              <Icon color={palette.accentTeal} name={isCodingInterviewTrack ? "code-brackets" : "cloud"} size={12} />
            </View>
            <Text style={styles.focusTitle} testID={runtimeSelectors.home.trackCard(activeTrack.id)}>
              {t(activeTrack.shortTitle)}
            </Text>
          </View>
          <Text style={styles.changeTrack}>{t("Change")}</Text>
        </Pressable>
      </View>

      <Card variant="layered" style={styles.decisionCard}>
        <View style={styles.cardRail} />
        <View
          style={[styles.decisionHeading, largeText ? styles.decisionHeadingLargeText : null]}
          testID={resumeSessionId
            ? runtimeSelectors.resume.card(resumeSessionId)
            : undefined}
        >
          <View style={styles.decisionIconTile}>
            <Icon color={decisionTone === "muted" ? palette.textMuted : palette.accentTeal} name={decisionIcon} size={24} />
          </View>
          <View style={styles.decisionCopy}>
            <Text
              style={styles.decisionTitle}
              testID={resumeSessionId
                ? runtimeSelectors.resume.title(resumeSessionId)
                : undefined}
            >
              {t(decisionTitle)}
            </Text>
            <Text
              style={styles.decisionDetail}
              testID={resumeSessionId
                ? runtimeSelectors.resume.status(resumeSessionId)
                : undefined}
            >
              {decisionDetail}
            </Text>
          </View>
        </View>
        <Button
          disabled={!decisionEnabled}
          onPress={() => {
            if (recommendation) {
              onRecommendationAction(recommendation.action);
              return;
            }
            onStartLearning(model.topicId);
          }}
          style={styles.startButton}
          testID={resumeSessionId
            ? runtimeSelectors.resume.continue(resumeSessionId)
            : undefined}
          variant="secondary"
        >
          {t(decisionLabel)}
        </Button>
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
    gap: 18,
  },
  pageTitle: {
    ...typography.title,
    color: palette.textPrimary,
  },
  trackContext: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 44,
  },
  trackContextLargeText: {
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  trackContextCopy: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
  },
  trackIconContainer: {
    alignItems: "center",
    backgroundColor: colorWithOpacity(palette.accentTeal, 0.08),
    borderRadius: 6,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  focusTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    color: palette.textPrimary,
    flex: 1,
  },
  changeTrack: {
    color: palette.accentTeal,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
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
    backgroundColor: palette.navigation.surface,
    borderColor: palette.navigation.active,
    borderRadius: 22,
    elevation: 0,
    gap: spacing.lg,
    padding: spacing.xl,
    position: "relative",
    shadowOpacity: 0,
  },
  cardRail: {
    backgroundColor: palette.navigation.active,
    borderRadius: 2,
    height: 44,
    left: -1,
    position: "absolute",
    top: 19,
    width: 3,
  },
  decisionHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  decisionHeadingLargeText: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  decisionTitle: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 28,
  },
  decisionCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  decisionIconTile: {
    alignItems: "center",
    backgroundColor: palette.choice.surface,
    borderColor: palette.choice.active,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  startButton: {
    backgroundColor: palette.navigation.active,
    borderColor: palette.navigation.active,
    minHeight: 49,
    paddingVertical: 15,
  },
  decisionDetail: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  secondaryAction: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  secondaryActionText: {
    color: palette.accentTeal,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
  },
});

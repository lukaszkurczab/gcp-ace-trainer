import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button, Card, Icon } from "../../../components";
import type { ReviewQueueEntry, TrackDisplay, TrainingAttempt, TrainingSession } from "../../../domain";
import type { CodingInterviewDashboard } from "../../../application/coding-interview";
import { colorWithOpacity, spacing, typography } from "../../../theme";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { activityCompletionLabel, modeLabel, relativeDay } from "./activityPresentation";
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
  onOpenActivity: () => void;
  onOpenSettings: () => void;
  onRecommendationAction: (action: HomeRecommendationAction) => void;
  onStartLearning: (topicId: string) => void;
  reviewQueueItems: readonly ReviewQueueEntry[];
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
  onOpenActivity,
  onOpenSettings,
  onRecommendationAction,
  onStartLearning,
  reviewQueueItems,
  trainingAttempts,
}: HomeTabProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  const model = buildHomeTabModel({ activeSession, activeTrack, algorithmsDashboard, analytics, dashboardError, trainingAttempts });
  const recommendation = model.recommendations[0];
  const hasActiveSession = activeSession?.status === "active" && activeSession.trackId === activeTrack.id;
  const isReviewRecommendation = recommendation?.action.kind === "start_practice" &&
    recommendation.action.reviewSource !== undefined;
  const isRecommendationSettingsAction = !hasActiveSession && recommendation !== undefined;
  const resumeSessionId = recommendation?.action.kind === "resume_active_session" || recommendation?.action.kind === "resume_certification_practice"
    ? recommendation.action.sessionId
    : undefined;
  const decisionTitle = hasActiveSession
    ? "Session in progress"
    : isReviewRecommendation
      ? "Review weak areas"
      : recommendation?.title ?? formatPracticeTopicTitle(model.heroTitle, t);
  const decisionDetail = hasActiveSession
    ? t(modeLabel(activeSession.modeId))
    : isReviewRecommendation
      ? t("Review due items before they become stale.")
    : recommendation
      ? t(recommendation.unavailableReason ?? recommendation.detail)
    : formatPracticeTopicDetail(model.heroSubtitle, t);
  const decisionLabel = hasActiveSession ? "Resume session" : recommendation?.primaryLabel ?? model.primaryLabel;
  const isCodingInterviewTrack = activeTrack.id === "coding-interview-dsa-problem-solving";
  const decisionIcon = recommendation?.icon ?? (isCodingInterviewTrack ? "route" : "cloud");
  const decisionTone = recommendation?.enabled === false ? "muted" : "primary";
  const decisionEnabled = recommendation?.enabled ?? true;
  const recentAttempts = trainingAttempts
    .filter((attempt) => attempt.trackId === activeTrack.id && attempt.sessionId !== activeSession?.id)
    .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt));
  const recentAttempt = recentAttempts[0];
  const overview = buildOverviewMetrics(activeTrack.id, reviewQueueItems, trainingAttempts, activeSession?.id);
  const isFirstUse = !hasActiveSession && trainingAttempts.length === 0 && reviewQueueItems.length === 0;

  return (
    <>
      <View style={styles.pageIntro}>
        <Text maxFontSizeMultiplier={2} style={styles.pageTitle}>{t("Home")}</Text>
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
            <Text maxFontSizeMultiplier={2} style={styles.focusTitle} testID={runtimeSelectors.home.trackCard(activeTrack.id)}>
              {t(activeTrack.shortTitle)}
            </Text>
          </View>
          <Text maxFontSizeMultiplier={2} style={styles.changeTrack}>{t("Change")}</Text>
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
              maxFontSizeMultiplier={2}
              style={styles.decisionTitle}
              testID={resumeSessionId
                ? runtimeSelectors.resume.title(resumeSessionId)
                : undefined}
            >
              {t(decisionTitle)}
            </Text>
            <Text
              maxFontSizeMultiplier={2}
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
          variant="primary"
        >
          {t(decisionLabel)}
        </Button>
        {hasActiveSession || isFirstUse ? null : (
          <Pressable
            accessibilityRole="button"
            onPress={isRecommendationSettingsAction ? onOpenSettings : onChooseTopic}
            style={({ pressed }) => [styles.secondaryAction, pressed ? styles.pressed : null]}
          >
            <Text maxFontSizeMultiplier={2} style={styles.secondaryActionText}>{t(isRecommendationSettingsAction ? "Manage settings" : "Choose another topic")}</Text>
            {isRecommendationSettingsAction ? null : <Icon color={palette.accentPurple} name="chevron-right" size={18} />}
          </Pressable>
        )}
      </Card>
      {isFirstUse ? (
        <View style={styles.firstUseState}>
          <View style={styles.firstUseIcon}>
            <Icon color={palette.accentTeal} name="route" size={20} />
          </View>
          <View style={styles.firstUseCopy}>
            <Text maxFontSizeMultiplier={2} style={styles.firstUseTitle}>{t("Your learning starts here")}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.firstUseDetail}>{t("Complete your first session to see progress and activity here.")}</Text>
          </View>
        </View>
      ) : null}
      {!isFirstUse ? <View style={styles.overviewSection} testID="home-overview">
        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{t("Overview")}</Text>
        {overview.map((metric, index) => (
          <View key={metric.label} style={[styles.overviewRow, index < overview.length - 1 ? styles.overviewRowDivider : null]} accessibilityLabel={`${t(metric.label)}: ${t(metric.value)}`}>
            <Text maxFontSizeMultiplier={2} style={styles.overviewLabel}>{t(metric.label)}</Text>
            <View style={styles.overviewValueGroup}>
              <View style={styles.overviewTrack}>
                <View style={[styles.overviewFill, { width: `${metric.progress * 100}%` }]} />
              </View>
              <Text maxFontSizeMultiplier={2} style={styles.overviewValue}>{t(metric.value)}</Text>
            </View>
          </View>
        ))}
      </View> : null}
      {!isFirstUse ? <View style={styles.detailSection}>
        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{t("Current focus")}</Text>
        <View style={[styles.focusRow, largeText ? styles.focusRowLargeText : null]}>
          <Text maxFontSizeMultiplier={2} style={styles.currentFocusTitle}>{formatPracticeTopicTitle(model.heroTitle, t)}</Text>
          <Button labelStyle={styles.focusActionLabel} onPress={onChooseTopic} variant="ghost">{t("Open Practice")}</Button>
        </View>
      </View> : null}
      {!isFirstUse ? <View style={styles.detailSection}>
        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{t("Recent activity")}</Text>
        <View style={styles.activityRow}>
          {recentAttempt ? (
            <View style={styles.activityCopy}>
              <Text maxFontSizeMultiplier={2} style={styles.activityTitle}>{t(modeLabel(recentAttempt.modeId))}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.activityDetail}>{activityCompletionLabel(recentAttempt.answeredAt, t)}</Text>
            </View>
          ) : (
            <Text maxFontSizeMultiplier={2} style={styles.activityEmpty}>{t("No activity yet")}</Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onOpenActivity}
            style={({ pressed }) => [styles.activityAction, pressed ? styles.pressed : null]}
            testID={runtimeSelectors.home.activity()}
          >
            <Text maxFontSizeMultiplier={2} style={styles.activityActionText}>{t("View activity")}</Text>
          </Pressable>
        </View>
      </View> : null}
    </>
  );
}

type HomeOverviewMetric = Readonly<{ label: string; progress: number; value: string }>;

function buildOverviewMetrics(
  trackId: TrackDisplay["id"],
  reviewQueueItems: readonly ReviewQueueEntry[],
  trainingAttempts: readonly TrainingAttempt[],
  activeSessionId?: string,
): readonly HomeOverviewMetric[] {
  const trackAttempts = trainingAttempts.filter((attempt) => attempt.trackId === trackId && attempt.sessionId !== activeSessionId);
  const weekStart = startOfUtcWeek(new Date());
  const weekAttempts = trackAttempts.filter((attempt) => new Date(attempt.answeredAt).getTime() >= weekStart.getTime());
  const dueReviews = reviewQueueItems.filter((entry) => entry.trackId === trackId && Date.parse(entry.dueAt) <= Date.now()).length;
  const latestAttempt = [...trackAttempts].sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))[0];

  return [
    { label: "This week", progress: Math.min(1, weekAttempts.length / 10), value: weekAttempts.length ? `${weekAttempts.length} answered` : "No activity yet" },
    { label: "Review", progress: dueReviews ? 1 : 0, value: dueReviews ? `${dueReviews} due` : "Nothing due" },
    { label: "Last session", progress: latestAttempt ? 1 : 0, value: latestAttempt ? `${modeLabel(latestAttempt.modeId)} · ${relativeDay(latestAttempt.answeredAt)}` : "No activity yet" },
  ];
}

function startOfUtcWeek(now: Date): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
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
    alignItems: "flex-start",
    alignSelf: "stretch",
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
  changeTrack: {
    color: palette.primary,
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
    backgroundColor: palette.surface,
    borderColor: palette.navigation.active,
    borderRadius: 22,
    elevation: 0,
    gap: spacing.lg,
    overflow: "hidden",
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
    alignItems: "center",
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
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  decisionCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  decisionIconTile: {
    alignItems: "center",
    backgroundColor: palette.surfaceInput,
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
  firstUseState: {
    alignItems: "flex-start",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  firstUseIcon: {
    alignItems: "center",
    backgroundColor: colorWithOpacity(palette.accentTeal, 0.08),
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  firstUseCopy: { flex: 1, gap: spacing.xxs, minWidth: 0 },
  firstUseTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  firstUseDetail: { ...typography.body, color: palette.textSecondary },
  overviewSection: {
    gap: 2,
  },
  sectionLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  overviewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 10,
  },
  overviewRowDivider: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
  },
  overviewTrack: {
    backgroundColor: palette.textPrimary,
    borderRadius: 100,
    height: 4,
    overflow: "hidden",
    width: 40,
  },
  overviewFill: {
    backgroundColor: palette.primary,
    borderRadius: 100,
    height: 4,
  },
  overviewLabel: {
    color: palette.textSecondary,
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    minWidth: 0,
  },
  overviewValueGroup: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm,
  },
  overviewValue: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
    flexShrink: 1,
    textAlign: "right",
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
    color: palette.primary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  detailSection: {
    gap: spacing.sm,
  },
  focusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  focusRowLargeText: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  focusTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  currentFocusTitle: {
    color: palette.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18,
    minWidth: 0,
  },
  focusActionLabel: {
    color: palette.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  activityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 44,
  },
  activityCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  activityTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  activityDetail: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 18,
  },
  activityEmpty: {
    ...typography.small,
    color: palette.textSecondary,
  },
  activityAction: {
    alignItems: "center",
    flexShrink: 0,
    minHeight: 44,
    paddingHorizontal: spacing.xs,
  },
  activityActionText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});

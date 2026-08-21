import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Button, Card, Icon } from "../../../components";
import type { ReviewQueueEntry, TrackDisplay, TrainingAttempt, TrainingSession } from "../../../domain";
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
  onRecommendationAction,
  onStartLearning,
  reviewQueueItems,
  trainingAttempts,
}: HomeTabProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= 1.3;
  const model = buildHomeTabModel({ activeSession, activeTrack, algorithmsDashboard, analytics, dashboardError, trainingAttempts });
  const recommendation = model.recommendations[0];
  const hasActiveSession = activeSession?.status === "active" && activeSession.trackId === activeTrack.id;
  const isReviewRecommendation = recommendation?.action.kind === "start_practice" &&
    recommendation.action.reviewSource !== undefined;
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
    : recommendation
      ? t(recommendation.unavailableReason ?? recommendation.detail)
    : formatPracticeTopicDetail(model.heroSubtitle, t);
  const decisionLabel = hasActiveSession ? "Resume session" : recommendation?.primaryLabel ?? model.primaryLabel;
  const isCodingInterviewTrack = activeTrack.id === "coding-interview-dsa-problem-solving";
  const decisionIcon = recommendation?.icon ?? (isCodingInterviewTrack ? "route" : "cloud");
  const decisionTone = recommendation?.enabled === false ? "muted" : "primary";
  const decisionEnabled = recommendation?.enabled ?? true;
  const overview = buildOverviewMetrics(activeTrack.id, reviewQueueItems, trainingAttempts);

  return (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>{t("Home")}</Text>
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
          variant="primary"
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
      <View style={styles.overviewSection} testID="home-overview">
        <Text style={styles.sectionLabel}>{t("Overview")}</Text>
        {overview.map((metric) => (
          <View key={metric.label} style={styles.overviewRow} accessibilityLabel={`${t(metric.label)}: ${t(metric.value)}`}>
            <Text maxFontSizeMultiplier={2} style={styles.overviewLabel}>{t(metric.label)}</Text>
            <View style={styles.overviewValueGroup}>
              <View style={styles.overviewTrack}>
                <View style={[styles.overviewFill, { width: `${metric.progress * 100}%` }]} />
              </View>
              <Text maxFontSizeMultiplier={2} style={styles.overviewValue}>{t(metric.value)}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.sectionLabel}>{t("Current focus")}</Text>
        <Card style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <View style={styles.focusCopy}>
              <Text maxFontSizeMultiplier={2} style={styles.focusTitle}>{formatPracticeTopicTitle(model.heroTitle, t)}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.focusDetail}>{formatPracticeTopicDetail(model.heroSubtitle, t)}</Text>
            </View>
            <Icon color={palette.accentTeal} name={isCodingInterviewTrack ? "route" : "cloud"} size={20} />
          </View>
          <Button onPress={onChooseTopic} variant="ghost">{t("Open focus")}</Button>
        </Card>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.sectionLabel}>{t("Recent activity")}</Text>
        {trainingAttempts.length > 0 ? (
          <View style={styles.activityList}>
            {trainingAttempts.slice(0, 3).map((attempt) => (
              <View key={attempt.id} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={styles.activityCopy}>
                  <Text style={styles.activityTitle}>{t(modeLabel(attempt.modeId))}</Text>
                  <Text style={styles.activityDetail}>{`${relativeDay(attempt.answeredAt)} · ${attempt.result.kind}`}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Card style={styles.emptyActivityCard}><Text style={styles.activityDetail}>{t("No activity yet")}</Text></Card>
        )}
      </View>
    </>
  );
}

type HomeOverviewMetric = Readonly<{ label: string; progress: number; value: string }>;

function buildOverviewMetrics(
  trackId: TrackDisplay["id"],
  reviewQueueItems: readonly ReviewQueueEntry[],
  trainingAttempts: readonly TrainingAttempt[],
): readonly HomeOverviewMetric[] {
  const trackAttempts = trainingAttempts.filter((attempt) => attempt.trackId === trackId);
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

function modeLabel(modeId: string): string {
  const labels: Record<string, string> = {
    "coding-interview-guided-practice": "Guided Practice",
    "coding-interview-learn-approach": "Learn Approach",
    "certification-focus-practice": "Focus Practice",
    "certification-quick-review": "Quick Review",
    "design-interview-learn-framework": "Learn Framework",
    "design-interview-tradeoff-practice": "Tradeoff Practice",
    "design-interview-weak-area-review": "Weak Area Review",
  };
  return labels[modeId] ?? modeId.replace(/^(?:coding-interview|certification|design-interview)-/, "").replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function relativeDay(answeredAt: string): string {
  const day = new Date(answeredAt);
  const today = new Date();
  const dayKey = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const todayKey = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const difference = Math.round((todayKey - dayKey) / 86_400_000);
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  return `${difference} days ago`;
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
    backgroundColor: palette.surface,
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
  overviewSection: {
    gap: 0,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    lineHeight: 18,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  overviewRow: {
    alignItems: "center",
    borderBottomColor: palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingVertical: spacing.xs,
  },
  overviewTrack: {
    backgroundColor: palette.border,
    borderRadius: 100,
    height: 4,
    overflow: "hidden",
    width: 40,
  },
  overviewFill: {
    backgroundColor: palette.accentTeal,
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
    gap: spacing.xs,
  },
  overviewValue: {
    color: palette.textPrimary,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
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
    color: palette.accentTeal,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
  },
  detailSection: {
    gap: spacing.sm,
  },
  focusCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  focusHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  focusCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  focusTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  focusDetail: {
    ...typography.small,
    color: palette.textSecondary,
  },
  activityList: {
    gap: spacing.sm,
  },
  activityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
  },
  activityDot: {
    backgroundColor: palette.accentTeal,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  activityCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  activityTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  activityDetail: {
    ...typography.caption,
    color: palette.textSecondary,
  },
  emptyActivityCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    padding: spacing.lg,
  },
});

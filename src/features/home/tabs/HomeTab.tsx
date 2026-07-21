import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import {
  Badge,
  Button,
  Card,
  Icon,
  IconTile,
  ListRow,
  SectionHeader,
} from "../../../components";
import type { TrackDisplay } from "../../../domain";
import type { TrainingAttempt } from "../../../domain";
import type { AlgorithmsRecommendationAction, AlgorithmsDashboard } from "../../../application/algorithms";
import { spacing, typography } from "../../../theme";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { buildHomeTabModel } from "./homeTabModel";
import { useAppPreferences, useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";
import { runtimeSelectors } from "../../../testing/runtimeSelectors";


type HomeTabProps = {
  activeTrack: TrackDisplay;
  analytics: AnalyticsData;
  algorithmsDashboard: AlgorithmsDashboard | null;
  dashboardError: string | null;
  onChangeTrack: () => void;
  onRecommendationAction: (action: AlgorithmsRecommendationAction) => void;
  onStartLearning: (topicId: string) => void;
  trainingAttempts: readonly TrainingAttempt[];
};

export function HomeTab({
  activeTrack,
  analytics,
  algorithmsDashboard,
  dashboardError,
  onChangeTrack,
  onRecommendationAction,
  onStartLearning,
  trainingAttempts,
}: HomeTabProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const model = buildHomeTabModel({ activeTrack, algorithmsDashboard, analytics, dashboardError, trainingAttempts });

  return (
    <>
      <Card style={styles.focusStrip}>
        <View style={styles.focusCopy}>
          <Text style={styles.eyebrow}>{t("Current track")}</Text>
          <Text style={styles.focusTitle} testID={runtimeSelectors.home.trackCard(activeTrack.id)}>{t(model.focusTitle)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onChangeTrack}
          style={({ pressed }) => [styles.changeFocusButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.changeFocusText}>{t("Change track")}</Text>
          <Icon color={palette.accentPurple} name="chevron-right" size={18} />
        </Pressable>
      </Card>

      <Card variant="tonal" style={styles.hero}>
        <Text style={styles.heroEyebrow}>{t(model.heroEyebrow)}</Text>
        <SectionHeader
          title={t(model.heroTitle)}
          subtitle={t(model.heroSubtitle)}
          tight
        />
        <Button onPress={() => onStartLearning(model.topicId)}>
          {t(model.primaryLabel)}
        </Button>
      </Card>

      {model.recommendations.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={t("Recommended today")} tight />
          {model.recommendations.map((item, index) => (
            item.action.kind === "resume_active_session" ? (
              <ResumeRecommendation
                action={item.action}
                detail={t(item.detail)}
                key={item.action.sessionId}
                label={t(item.label)}
                onContinue={onRecommendationAction}
                style={index === 0 ? styles.recommendedPrimary : undefined}
                title={t(item.title)}
              />
            ) : (
              <ListRow
                detail={t(item.unavailableReason ?? item.detail)}
                key={item.title}
                leading={<IconTile name={item.icon} tone={item.enabled ? item.tone : "muted"} />}
                onPress={item.enabled ? () => onRecommendationAction(item.action) : undefined}
                style={[
                  index === 0 ? styles.recommendedPrimary : undefined,
                  item.enabled ? undefined : styles.unavailableRow,
                ]}
                title={t(item.title)}
                trailing={<Badge label={t(item.label)} tone={item.enabled ? "info" : "neutral"} />}
              />
            )
          ))}
        </View>
      ) : null}
    </>
  );
}

function ResumeRecommendation({
  action,
  detail,
  label,
  onContinue,
  style,
  title,
}: Readonly<{
  action: Extract<AlgorithmsRecommendationAction, { kind: "resume_active_session" }>;
  detail: string;
  label: string;
  onContinue: (action: AlgorithmsRecommendationAction) => void;
  style?: ViewStyle;
  title: string;
}>) {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={style ? { ...styles.resumeCard, ...style } : styles.resumeCard} testID={runtimeSelectors.resume.card(action.sessionId)}>
      <View style={styles.resumeHeading}>
        <Text style={styles.resumeTitle} testID={runtimeSelectors.resume.title(action.sessionId)}>{title}</Text>
        <View testID={runtimeSelectors.resume.status(action.sessionId)}>
          <Badge label={label} tone="info" />
        </View>
      </View>
      <Text style={styles.resumeDetail}>{detail}</Text>
      <Button onPress={() => onContinue(action)} testID={runtimeSelectors.resume.continue(action.sessionId)}>
        {label}
      </Button>
    </Card>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  focusStrip: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  focusCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  focusTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
  },
  changeFocusButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  changeFocusText: {
    ...typography.bodyStrong,
    color: palette.accentPurple,
  },
  pressed: {
    opacity: 0.78,
  },
  hero: {
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  heroEyebrow: {
    ...typography.caption,
    color: palette.accentPurple,
    textTransform: "uppercase",
  },
  section: {
    gap: spacing.md,
  },
  recommendedPrimary: {
    borderColor: palette.primary,
  },
  resumeCard: {
    gap: spacing.md,
  },
  resumeHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  resumeTitle: {
    ...typography.bodyStrong,
    color: palette.textPrimary,
    flex: 1,
  },
  resumeDetail: {
    ...typography.small,
    color: palette.textSecondary,
  },
  unavailableRow: {
    opacity: 0.62,
  },
});

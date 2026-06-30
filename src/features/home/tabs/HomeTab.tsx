import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  Icon,
  IconTile,
  ListRow,
  SectionHeader,
} from "../../../components";
import { colors, spacing, typography } from "../../../theme";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { HOME_PRIMARY_CTA, HOME_RECOMMENDATIONS } from "../shellModel";

type HomeTabProps = {
  analytics: AnalyticsData;
  onChangeFocus: () => void;
  onStartLearning: () => void;
};

export function HomeTab({
  analytics,
  onChangeFocus,
  onStartLearning,
}: HomeTabProps) {
  const hasPractice = analytics.summary.totalPracticeQuestionsAnswered > 0;
  const hasExams = analytics.summary.totalCompletedExams > 0;

  return (
    <>
      <Card style={styles.focusStrip}>
        <View style={styles.focusCopy}>
          <Text style={styles.eyebrow}>Current focus</Text>
          <Text style={styles.focusTitle}>Cloud Certification</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onChangeFocus}
          style={({ pressed }) => [styles.changeFocusButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.changeFocusText}>Change focus</Text>
          <Icon color={colors.dark.accentPurple} name="chevron-right" size={18} />
        </Pressable>
      </Card>

      <Card variant="tonal" style={styles.hero}>
        <Text style={styles.heroEyebrow}>Continue learning</Text>
        <SectionHeader
          title="IAM policies"
          subtitle="Resume your last Cloud Certification topic or choose another area before starting."
          tight
        />
        <Button onPress={onStartLearning}>
          {HOME_PRIMARY_CTA.label}
        </Button>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Recommended today" tight />
        {HOME_RECOMMENDATIONS.map((item, index) => (
          <ListRow
            detail={getRecommendationDetail(item.detail, index, hasPractice, hasExams)}
            key={item.title}
            leading={<IconTile name={index === 1 ? "rotate-ccw" : "cloud"} tone={getRecommendationTone(index)} />}
            style={index === 0 ? styles.recommendedPrimary : undefined}
            title={item.title}
            trailing={<Badge label={item.label} tone={index === 0 ? "info" : "neutral"} />}
          />
        ))}
      </View>
    </>
  );
}

function getRecommendationDetail(
  baseDetail: string,
  index: number,
  hasPractice: boolean,
  hasExams: boolean,
): string {
  if (index === 0 && (hasPractice || hasExams)) {
    return "Suggested from local attempts and practice records.";
  }

  return baseDetail;
}

function getRecommendationTone(index: number): "primary" | "info" | "warning" {
  if (index === 0) {
    return "primary";
  }

  if (index === 1) {
    return "info";
  }

  return "warning";
}

const styles = StyleSheet.create({
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
    color: colors.dark.textPrimary,
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
    color: colors.dark.accentPurple,
  },
  pressed: {
    opacity: 0.78,
  },
  hero: {
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  heroEyebrow: {
    ...typography.caption,
    color: colors.dark.accentPurple,
    textTransform: "uppercase",
  },
  section: {
    gap: spacing.md,
  },
  recommendedPrimary: {
    borderColor: colors.dark.primary,
  },
});

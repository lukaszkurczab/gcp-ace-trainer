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
import type { TrackDefinition } from "../../../domain";
import { colors, spacing, typography } from "../../../theme";
import type { AnalyticsData } from "../../analytics/analyticsService";
import {
  buildHomeTabModel,
  isCloudHomePracticeAction,
} from "./homeTabModel";

type HomeTabProps = {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
  onChangeFocus: () => void;
  onOpenPractice: () => void;
  onStartLearning: () => void;
};

export function HomeTab({
  activeTrack,
  analytics,
  onChangeFocus,
  onOpenPractice,
  onStartLearning,
}: HomeTabProps) {
  const model = buildHomeTabModel({ activeTrack, analytics });
  const onPrimaryPress = isCloudHomePracticeAction(model)
    ? onStartLearning
    : onOpenPractice;

  return (
    <>
      <Card style={styles.focusStrip}>
        <View style={styles.focusCopy}>
          <Text style={styles.eyebrow}>Current focus</Text>
          <Text style={styles.focusTitle}>{model.focusTitle}</Text>
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
        <Text style={styles.heroEyebrow}>{model.heroEyebrow}</Text>
        <SectionHeader
          title={model.heroTitle}
          subtitle={model.heroSubtitle}
          tight
        />
        <Button onPress={onPrimaryPress}>
          {model.primaryLabel}
        </Button>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Recommended today" tight />
        {model.recommendations.map((item, index) => (
          <ListRow
            detail={item.detail}
            key={item.title}
            leading={<IconTile name={item.icon} tone={item.tone} />}
            style={index === 0 ? styles.recommendedPrimary : undefined}
            title={item.title}
            trailing={<Badge label={item.label} tone={index === 0 ? "info" : "neutral"} />}
          />
        ))}
      </View>
    </>
  );
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

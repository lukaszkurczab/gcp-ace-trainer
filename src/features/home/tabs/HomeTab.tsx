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
import type { TrainingAttempt } from "../../../domain/training";
import { colors, spacing, typography } from "../../../theme";
import type { AnalyticsData } from "../../analytics/analyticsService";
import type { PracticeSessionMode } from "../../practice/sessionConfig";
import { buildHomeTabModel } from "./homeTabModel";

type HomeTabProps = {
  activeTrack: TrackDefinition;
  analytics: AnalyticsData;
  onChangeTrack: () => void;
  onStartLearning: (topicId: string) => void;
  onStartMode: (mode: PracticeSessionMode, topicId: string) => void;
  trainingAttempts: readonly TrainingAttempt[];
};

export function HomeTab({
  activeTrack,
  analytics,
  onChangeTrack,
  onStartLearning,
  onStartMode,
  trainingAttempts,
}: HomeTabProps) {
  const model = buildHomeTabModel({ activeTrack, analytics, trainingAttempts });

  return (
    <>
      <Card style={styles.focusStrip}>
        <View style={styles.focusCopy}>
          <Text style={styles.eyebrow}>Current track</Text>
          <Text style={styles.focusTitle}>{model.focusTitle}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onChangeTrack}
          style={({ pressed }) => [styles.changeFocusButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.changeFocusText}>Change track</Text>
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
        <Button onPress={() => onStartLearning(model.topicId)}>
          {model.primaryLabel}
        </Button>
      </Card>

      {model.recommendations.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Recommended today" tight />
          {model.recommendations.map((item, index) => (
            <ListRow
              detail={item.unavailableReason ?? item.detail}
              key={item.title}
              leading={<IconTile name={item.icon} tone={item.enabled ? item.tone : "muted"} />}
              onPress={item.enabled ? () => onStartMode(item.mode, model.topicId) : undefined}
              style={[
                index === 0 ? styles.recommendedPrimary : undefined,
                item.enabled ? undefined : styles.unavailableRow,
              ]}
              title={item.title}
              trailing={<Badge label={item.label} tone={item.enabled ? "info" : "neutral"} />}
            />
          ))}
        </View>
      ) : null}
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
  unavailableRow: {
    opacity: 0.62,
  },
});

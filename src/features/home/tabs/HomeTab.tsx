import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  Icon,
  IconTile,
  ListRow,
  SectionHeader,
  TrackCard,
} from "../../../components";
import {
  ALGORITHMS_TRACK_ID,
  getTrackDefinitions,
  type TrackDefinition,
  type TrackId,
} from "../../../domain";
import { colors, spacing, typography } from "../../../theme";
import type { AnalyticsData } from "../../analytics/analyticsService";

type HomeTabProps = {
  activeTrack: TrackDefinition;
  activeTrackId: TrackId;
  analytics: AnalyticsData;
  onSelectTrack: (trackId: TrackId) => Promise<void>;
};

export function HomeTab({
  activeTrack,
  activeTrackId,
  analytics,
  onSelectTrack,
}: HomeTabProps) {
  const hasPractice = analytics.summary.totalPracticeQuestionsAnswered > 0;
  const hasExams = analytics.summary.totalCompletedExams > 0;
  const isActiveTrackReady = activeTrack.status === "active";

  return (
    <>
      <Card variant="tonal" style={styles.hero}>
        <View style={styles.heroHeader}>
          <Text style={styles.eyebrow}>Continue learning</Text>
          <Badge
            label={isActiveTrackReady ? "Ready" : "Draft"}
            tone={isActiveTrackReady ? "ready" : "warning"}
          />
        </View>
        <SectionHeader
          title={getHomeTitle(activeTrackId)}
          subtitle={getHomeSubtitle(activeTrackId)}
          tight
        />
        <Button onPress={() => void onSelectTrack(activeTrack.id)}>
          {activeTrack.nextActionLabel}
        </Button>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Recommended today" tight />
        <ListRow
          detail={getRecommendationDetail(activeTrackId, hasPractice, hasExams)}
          leading={<IconTile name="cloud" tone="primary" />}
          style={styles.recommendedPrimary}
          title={getRecommendationTitle(activeTrackId)}
          trailing={<Icon name="chevron-right" />}
        />
        <ListRow
          detail="Review suggestions become richer as real attempts and practice records are added."
          leading={<IconTile name="rotate-ccw" tone="info" />}
          meta={`${analytics.summary.totalPracticeQuestionsAnswered} local`}
          title="Review queue"
          trailing={<Badge label="Local" tone="info" />}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Choose track"
          subtitle="Switch context before starting a session."
          tight
        />
        <View style={styles.trackList}>
          {getTrackDefinitions().map((track) => (
            <TrackCard
              isActive={track.id === activeTrackId}
              key={track.id}
              onPress={() => void onSelectTrack(track.id)}
              track={track}
            />
          ))}
        </View>
      </View>
    </>
  );
}

function getHomeTitle(trackId: TrackId): string {
  return trackId === ALGORITHMS_TRACK_ID
    ? "Algorithm Patterns"
    : "Cloud Certification";
}

function getHomeSubtitle(trackId: TrackId): string {
  return trackId === ALGORITHMS_TRACK_ID
    ? "Recognize patterns, compare strategies, and reason about complexity."
    : "Resume certification practice or review weak cloud domains.";
}

function getRecommendationTitle(trackId: TrackId): string {
  return trackId === ALGORITHMS_TRACK_ID
    ? "Prepare Pattern Drill"
    : "Review cloud weak areas";
}

function getRecommendationDetail(
  trackId: TrackId,
  hasPractice: boolean,
  hasExams: boolean,
): string {
  if (trackId === ALGORITHMS_TRACK_ID) {
    return "Algorithms is visible as a draft track; content and scoring are next.";
  }

  if (hasPractice || hasExams) {
    return "Suggested from local attempts and practice records.";
  }

  return "Start a practice session to build diagnostics.";
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.lg,
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    ...typography.caption,
    color: colors.dark.primary,
    textTransform: "uppercase",
  },
  section: {
    gap: spacing.md,
  },
  recommendedPrimary: {
    borderColor: colors.dark.primary,
  },
  trackList: {
    gap: spacing.md,
  },
});

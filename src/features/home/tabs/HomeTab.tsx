import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  Icon,
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

  return (
    <>
      <Card style={styles.focusStrip}>
        <View style={styles.focusCopy}>
          <Text style={styles.eyebrow}>Current focus</Text>
          <Text style={styles.focusTitle}>{activeTrack.title}</Text>
        </View>
        <Badge
          label={activeTrack.status === "active" ? "Ready" : "Draft"}
          tone={activeTrack.status === "active" ? "ready" : "warning"}
        />
      </Card>

      <Card variant="tonal" style={styles.hero}>
        <SectionHeader
          title={getHomeTitle(activeTrackId)}
          subtitle={getHomeSubtitle(activeTrackId)}
          tight
        />
        <Button onPress={() => void onSelectTrack(activeTrack.id)}>
          {activeTrack.nextActionLabel}
        </Button>
      </Card>

      <Card>
        <SectionHeader
          title="Tracks"
          subtitle="Choose the context before starting a session."
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
      </Card>

      <Card>
        <SectionHeader title="Recommended today" tight />
        <View style={styles.actionList}>
          <ListRow
            detail={getRecommendationDetail(activeTrackId, hasPractice, hasExams)}
            leading={<View style={[styles.leadingMark, styles.leadingMarkPrimary]} />}
            title={getRecommendationTitle(activeTrackId)}
            trailing={<Icon name="chevron-right" />}
          />
          <ListRow
            detail="Items and weak areas become richer as track-aware attempts are added."
            leading={<View style={[styles.leadingMark, styles.leadingMarkInfo]} />}
            meta={String(analytics.summary.totalPracticeQuestionsAnswered)}
            title="Review queue"
            trailing={<Badge label="Local" tone="info" />}
          />
        </View>
      </Card>
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
  focusStrip: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  focusCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  focusTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  hero: {
    gap: spacing.lg,
  },
  trackList: {
    gap: spacing.md,
  },
  actionList: {
    gap: spacing.md,
  },
  leadingMark: {
    borderRadius: 8,
    height: 40,
    width: 6,
  },
  leadingMarkPrimary: {
    backgroundColor: colors.dark.primary,
  },
  leadingMarkInfo: {
    backgroundColor: colors.dark.info,
  },
});

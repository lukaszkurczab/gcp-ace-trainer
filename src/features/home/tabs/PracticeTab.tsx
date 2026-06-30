import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  Icon,
  IconTile,
  ListRow,
  SectionHeader,
} from "../../../components";
import {
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";
import { ROUTES } from "../../../constants/routes";
import { colors, spacing, typography } from "../../../theme";
import type { ActiveExamSession } from "../../../types";
import type { HomeNavigation } from "../types";
import { PRACTICE_PRIMARY_CTA, PRACTICE_REVIEW_CTA } from "../shellModel";

type PracticeTabProps = {
  activeSession: ActiveExamSession | null;
  activeTrack: TrackDefinition;
  bankReady: boolean;
  navigation: HomeNavigation;
  onDiscardExam: () => void;
  onStartExam: () => Promise<void>;
};

export function PracticeTab({
  activeSession,
  activeTrack,
  bankReady,
  navigation,
  onDiscardExam,
  onStartExam,
}: PracticeTabProps) {
  const isCloud = activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID;

  return (
    <>
      <Card style={styles.activeTrackStrip}>
        <View style={styles.activeTrackCopy}>
          <Text style={styles.eyebrow}>Active track</Text>
          <Text style={styles.activeTrackTitle}>{activeTrack.title}</Text>
        </View>
        <Badge
          label={activeTrack.status === "active" ? "Ready" : "Draft"}
          tone={activeTrack.status === "active" ? "ready" : "warning"}
        />
      </Card>

      {isCloud ? (
        <>
          <Card variant="tonal" style={styles.practiceHero}>
            <Text style={styles.heroEyebrow}>
              {activeSession ? "Continue practice" : "Continue practice"}
            </Text>
            <SectionHeader
              title={activeSession ? "Exam in progress" : "IAM review session"}
              subtitle={
                activeSession
                  ? "Resume or discard the saved assessment session."
                  : "Focus: Scenario-based questions"
              }
            />
            {activeSession ? (
              <>
                <Button onPress={() => navigation.navigate(ROUTES.EXAM)}>
                  Resume Exam
                </Button>
                <Button variant="destructive" onPress={onDiscardExam}>
                  Discard Active Exam
                </Button>
              </>
            ) : (
              <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_SETUP)}>
                {PRACTICE_PRIMARY_CTA.label}
              </Button>
            )}
          </Card>

          <View style={styles.section}>
            <SectionHeader title="Other practice modes" tight />
            <ListRow
              detail="Full assessment-style session with feedback after submit."
              leading={<IconTile name="clipboard" tone="info" />}
              onPress={() => void onStartExam()}
              title="Exam simulation"
              trailing={
                <Badge
                  label={bankReady ? "Ready" : "Locked"}
                  tone={bankReady ? "ready" : "warning"}
                />
              }
            />
            <ListRow
              detail="Revisit missed and marked questions."
              leading={<IconTile name="rotate-ccw" tone="warning" />}
              onPress={() => navigation.navigate(ROUTES.MISTAKES_REVIEW)}
              title={PRACTICE_REVIEW_CTA.label}
              trailing={<Icon name="chevron-right" />}
            />
          </View>
        </>
      ) : (
        <Card variant="tonal">
          <SectionHeader
            title="Algorithms unavailable"
            subtitle="Pattern Drill and Strategy Practice stay disabled until original content and scoring are implemented."
            action={<Badge label="Draft" tone="warning" />}
          />
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  activeTrackStrip: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activeTrackCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
  },
  activeTrackTitle: {
    ...typography.bodyStrong,
    color: colors.dark.textPrimary,
  },
  practiceHero: {
    gap: spacing.lg,
  },
  heroEyebrow: {
    ...typography.caption,
    color: colors.dark.primary,
    textTransform: "uppercase",
  },
  section: {
    gap: spacing.md,
  },
});

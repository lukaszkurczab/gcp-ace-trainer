import { StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
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
          <Card variant="tonal">
            <SectionHeader
              title={activeSession ? "Exam in progress" : "Cloud practice"}
              subtitle={
                activeSession
                  ? "Resume or discard the saved assessment session."
                  : "Start from focused practice before using exam simulation."
              }
              action={<Badge label={activeSession ? "Active" : "Ready"} tone="ready" />}
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
                Start focused practice
              </Button>
            )}
          </Card>

          <Card>
            <SectionHeader title="Other modes" tight />
            <View style={styles.actionList}>
              <ListRow
                detail="Work through one domain with immediate feedback."
                leading={<View style={[styles.leadingMark, styles.leadingMarkInfo]} />}
                onPress={() => navigation.navigate(ROUTES.PRACTICE_SETUP)}
                title="Practice by domain"
                trailing={<Icon name="chevron-right" />}
              />
              <ListRow
                detail="Full assessment-style session with feedback after submit."
                leading={<View style={[styles.leadingMark, styles.leadingMarkPrimary]} />}
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
                leading={<View style={[styles.leadingMark, styles.leadingMarkWarning]} />}
                onPress={() => navigation.navigate(ROUTES.MISTAKES_REVIEW)}
                title="Review missed items"
                trailing={<Icon name="chevron-right" />}
              />
            </View>
          </Card>
        </>
      ) : (
        <Card>
          <SectionHeader
            title="Algorithms is registered"
            subtitle="Pattern Drill and Strategy Practice stay disabled until original content and scoring are implemented."
            action={<Badge label="Draft" tone="warning" />}
          />
          <EmptyState
            title="No algorithm sessions yet"
            description="The next implementation slice should add original algorithm items, scoring, and feedback."
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
  actionList: {
    gap: spacing.md,
  },
  leadingMark: {
    borderRadius: 8,
    height: 40,
    width: 6,
  },
  leadingMarkInfo: {
    backgroundColor: colors.dark.info,
  },
  leadingMarkPrimary: {
    backgroundColor: colors.dark.primary,
  },
  leadingMarkWarning: {
    backgroundColor: colors.dark.warning,
  },
});

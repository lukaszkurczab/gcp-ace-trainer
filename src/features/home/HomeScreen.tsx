import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, ListRow, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import { colors, radius, spacing, typography } from "../../theme";
import { clearActiveExamSession, getActiveExamSession, getQuestions } from "../../storage";
import type { ActiveExamSession, Question } from "../../types";
import type { RootStackParamList } from "../../navigation";
import { createExamSession } from "../exam/examService";
import { DEFAULT_QUESTION_BANK } from "../questions/defaultQuestionBank";
import { buildQuestionBankSummary } from "../questions/questionBankStats";

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.HOME>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTION_BANK);
  const [activeSession, setActiveSession] = useState<ActiveExamSession | null>(null);
  const [isStartingExam, setIsStartingExam] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadQuestions() {
        const [savedQuestions, savedSession] = await Promise.all([getQuestions(), getActiveExamSession()]);

        if (isActive) {
          setQuestions(savedQuestions);
          setActiveSession(savedSession);
        }
      }

      void loadQuestions();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const bankSummary = buildQuestionBankSummary(questions);

  async function handleStartExam() {
    if (!bankSummary.examReady || isStartingExam) {
      return;
    }

    setIsStartingExam(true);
    const result = await createExamSession();
    setIsStartingExam(false);

    if (!result.ok) {
      Alert.alert("Exam not ready", result.reason);
      return;
    }

    setActiveSession(result.session);
    navigation.navigate(ROUTES.EXAM);
  }

  function handleDiscardExam() {
    Alert.alert("Discard active exam?", "This will remove the saved in-progress exam session.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          void clearActiveExamSession().then(() => setActiveSession(null));
        }
      }
    ]);
  }

  return (
    <Screen>
      <Card variant="elevated" style={styles.hero}>
        <View style={styles.heroTopRow}>
          <StudyMark />
          <Badge label="Local study workspace" tone="info" />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>GCP ACE Trainer</Text>
          <Text style={styles.subtitle}>Focused local exam preparation with diagnostic practice, review, and analytics.</Text>
        </View>
      </Card>

      <Card>
        {activeSession ? (
          <>
            <SectionHeader
              title="Exam in progress"
              subtitle="Resume the saved timed session or discard it before starting another."
              action={<Badge label="Active" tone="ready" />}
            />
            <Button onPress={() => navigation.navigate(ROUTES.EXAM)}>Resume Exam</Button>
            <Button variant="destructive" onPress={handleDiscardExam}>
              Discard Active Exam
            </Button>
          </>
        ) : (
          <>
            <SectionHeader
              title="Ready for exam mode"
              subtitle={
                bankSummary.examReady
                  ? "Start a timed local training session from the current question bank."
                  : "The built-in question bank is unavailable or incomplete."
              }
              action={<Badge label={bankSummary.examReady ? "Ready" : "Locked"} tone={bankSummary.examReady ? "ready" : "warning"} />}
            />
            <Button disabled={!bankSummary.examReady} loading={isStartingExam} onPress={handleStartExam}>
              Start Exam
            </Button>
          </>
        )}
      </Card>

      <Card>
        <SectionHeader title="Next Actions" subtitle="Choose the shortest path for the current study state." tight />
        <View style={styles.actionList}>
          <DashboardAction
            detail="Work through one domain with immediate feedback."
            label="Practice by Domain"
            onPress={() => navigation.navigate(ROUTES.PRACTICE_SETUP)}
            tone="primary"
          />
          <DashboardAction
            detail="Revisit incorrect and marked questions."
            label="Review Mistakes"
            onPress={() => navigation.navigate(ROUTES.MISTAKES_REVIEW)}
            tone="danger"
          />
          <DashboardAction
            detail="Inspect score trends, weak domains, and confidence."
            label="Analytics"
            onPress={() => navigation.navigate(ROUTES.ANALYTICS)}
            tone="info"
          />
        </View>
      </Card>

      <Card>
        <SectionHeader title="Workspace" tight />
        <View style={styles.actionList}>
          <DashboardAction
            detail="Review completed local attempts."
            label="Attempt History"
            onPress={() => navigation.navigate(ROUTES.ATTEMPT_HISTORY)}
            tone="neutral"
          />
          <DashboardAction detail="Manage local data and training settings." label="Settings" onPress={() => navigation.navigate(ROUTES.SETTINGS)} tone="neutral" />
        </View>
      </Card>
    </Screen>
  );
}

type DashboardActionTone = "neutral" | "primary" | "warning" | "danger" | "info";

type DashboardActionProps = {
  detail: string;
  label: string;
  onPress: () => void;
  tone: DashboardActionTone;
};

function DashboardAction({ detail, label, onPress, tone }: DashboardActionProps) {
  return (
    <ListRow
      detail={detail}
      leading={<ActionGlyph tone={tone} />}
      onPress={onPress}
      title={label}
      trailing={<Text style={styles.actionArrow}>{">"}</Text>}
    />
  );
}

function StudyMark() {
  return (
    <View style={styles.markFrame}>
      <View style={styles.markColumnTall} />
      <View style={styles.markColumnShort} />
      <View style={styles.markDot} />
    </View>
  );
}

function ActionGlyph({ tone }: { tone: DashboardActionTone }) {
  return (
    <View style={[styles.actionGlyph, styles[`${tone}Glyph`]]}>
      <View style={[styles.actionGlyphLine, styles[`${tone}GlyphLine`]]} />
      <View style={[styles.actionGlyphDot, styles[`${tone}GlyphLine`]]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.lg
  },
  heroTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroCopy: {
    gap: spacing.sm
  },
  title: {
    ...typography.title,
    color: colors.light.textPrimary
  },
  subtitle: {
    ...typography.body,
    color: colors.light.textSecondary
  },
  actionList: {
    gap: spacing.md
  },
  actionArrow: {
    ...typography.bodyStrong,
    color: colors.light.textMuted
  },
  markFrame: {
    alignItems: "flex-end",
    backgroundColor: colors.light.primarySoft,
    borderColor: colors.light.border,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.xs,
    height: 44,
    justifyContent: "center",
    padding: spacing.sm,
    width: 44
  },
  markColumnTall: {
    backgroundColor: colors.light.primary,
    borderRadius: radius.pill,
    height: 24,
    width: 6
  },
  markColumnShort: {
    backgroundColor: colors.light.info,
    borderRadius: radius.pill,
    height: 16,
    width: 6
  },
  markDot: {
    backgroundColor: colors.light.accentTeal,
    borderRadius: radius.pill,
    height: 6,
    width: 6
  },
  actionGlyph: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  actionGlyphLine: {
    borderRadius: radius.pill,
    height: 14,
    width: 4
  },
  actionGlyphDot: {
    borderRadius: radius.pill,
    height: 6,
    marginTop: spacing.xxs,
    width: 6
  },
  neutralGlyph: {
    backgroundColor: colors.light.elevatedSurface
  },
  primaryGlyph: {
    backgroundColor: colors.light.primarySoft
  },
  warningGlyph: {
    backgroundColor: colors.light.warningSoft
  },
  dangerGlyph: {
    backgroundColor: colors.light.dangerSoft
  },
  infoGlyph: {
    backgroundColor: colors.light.infoSoft
  },
  neutralGlyphLine: {
    backgroundColor: colors.light.textMuted
  },
  primaryGlyphLine: {
    backgroundColor: colors.light.primary
  },
  warningGlyphLine: {
    backgroundColor: colors.light.warning
  },
  dangerGlyphLine: {
    backgroundColor: colors.light.danger
  },
  infoGlyphLine: {
    backgroundColor: colors.light.info
  }
});

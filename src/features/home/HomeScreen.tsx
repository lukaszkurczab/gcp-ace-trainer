import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Button, Card, Screen } from "../../components";
import { ROUTES } from "../../constants/routes";
import { colors, spacing, typography } from "../../theme";
import { QuestionBankSummary } from "../questions";
import { clearActiveExamSession, getActiveExamSession, getQuestions } from "../../storage";
import type { ActiveExamSession, Question } from "../../types";
import type { RootStackParamList } from "../../navigation";
import { createExamSession } from "../exam/examService";
import { buildQuestionBankSummary } from "../questions/questionBankStats";

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.HOME>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
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
      <View style={styles.header}>
        <Text style={styles.title}>GCP ACE Trainer</Text>
        <Text style={styles.subtitle}>Focused local study workspace for Associate Cloud Engineer preparation.</Text>
      </View>

      <QuestionBankSummary questions={questions} />

      <Card>
        {activeSession ? (
          <>
            <Button onPress={() => navigation.navigate(ROUTES.EXAM)}>Resume Exam</Button>
            <Button variant="secondary" onPress={handleDiscardExam}>
              Discard Active Exam
            </Button>
          </>
        ) : (
          <>
            <Button disabled={!bankSummary.examReady || isStartingExam} onPress={handleStartExam}>
              Start Exam
            </Button>
            {!bankSummary.examReady ? (
              <Text style={styles.helperText}>
                Exam mode unlocks when the local question bank has enough questions for every domain.
              </Text>
            ) : null}
          </>
        )}
        <Button variant="secondary" onPress={() => navigation.navigate(ROUTES.PRACTICE_SETUP)}>
          Practice by Domain
        </Button>
        <Button variant="secondary" onPress={() => navigation.navigate(ROUTES.MISTAKES_REVIEW)}>
          Review Mistakes
        </Button>
        <Button variant="secondary" onPress={() => navigation.navigate(ROUTES.ANALYTICS)}>
          Analytics
        </Button>
        <Button variant="secondary" onPress={() => navigation.navigate(ROUTES.IMPORT_QUESTIONS)}>
          Import Questions
        </Button>
        <Button variant="secondary" onPress={() => navigation.navigate(ROUTES.ATTEMPT_HISTORY)}>
          Attempt History
        </Button>
        <Button variant="secondary" onPress={() => navigation.navigate(ROUTES.SETTINGS)}>
          Settings
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm
  },
  title: {
    ...typography.title,
    color: colors.light.text
  },
  subtitle: {
    ...typography.body,
    color: colors.light.textMuted
  },
  helperText: {
    ...typography.caption,
    color: colors.light.textMuted
  }
});

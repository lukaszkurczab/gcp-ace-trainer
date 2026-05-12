import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { getActiveExamSession, getQuestions } from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import type { ActiveExamSession } from "../../types";
import { formatDuration } from "../../utils";
import {
  buildExamQuestionViews,
  getRemainingSeconds,
  submitActiveExamSession,
  type ExamQuestionView
} from "./examService";

type ExamReviewScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM_REVIEW>;

export function ExamReviewScreen({ navigation }: ExamReviewScreenProps) {
  const [session, setSession] = useState<ActiveExamSession | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionView[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const loadReview = useCallback(async () => {
    const [savedSession, bankQuestions] = await Promise.all([getActiveExamSession(), getQuestions()]);

    if (!savedSession) {
      setSession(null);
      setQuestions([]);
      return;
    }

    setSession(savedSession);
    setQuestions(buildExamQuestionViews(savedSession, bankQuestions));
    setRemainingSeconds(getRemainingSeconds(savedSession));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReview();
    }, [loadReview])
  );

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        return undefined;
      }

      const intervalId = setInterval(() => {
        const nextRemainingSeconds = getRemainingSeconds(session);
        setRemainingSeconds(nextRemainingSeconds);

        if (nextRemainingSeconds <= 0) {
          clearInterval(intervalId);
          void submitActiveExamSession(true).then((attempt) => {
            Alert.alert("Time expired", "Your exam was submitted automatically.");
            navigation.replace(ROUTES.RESULT, { attemptId: attempt?.id, autoSubmitted: true });
          });
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }, [navigation, session])
  );

  async function submitExam() {
    const attempt = await submitActiveExamSession(false);
    navigation.replace(ROUTES.RESULT, { attemptId: attempt?.id });
  }

  function handleSubmit() {
    const unansweredCount = questions.filter((question) => (session?.selectedOptionIdsByQuestionId[question.id] ?? []).length === 0).length;

    if (unansweredCount > 0) {
      Alert.alert("Submit with unanswered questions?", `${unansweredCount} question${unansweredCount === 1 ? " is" : "s are"} unanswered.`, [
        { text: "Keep reviewing", style: "cancel" },
        { text: "Submit Exam", style: "destructive", onPress: () => void submitExam() }
      ]);
      return;
    }

    void submitExam();
  }

  if (!session) {
    return (
      <Screen>
        <EmptyState title="No active exam" description="There is no in-progress exam to review." />
      </Screen>
    );
  }

  const answeredCount = questions.filter((question) => (session.selectedOptionIdsByQuestionId[question.id] ?? []).length > 0).length;
  const flaggedCount = session.flaggedQuestionIds.length;

  return (
    <Screen>
      <Card>
        <SectionHeader title="Review Before Submit" subtitle={`Time left: ${formatDuration(remainingSeconds)}`} />
        <View style={styles.summaryRow}>
          <Badge label={`${answeredCount}/${questions.length} answered`} tone="primary" />
          <Badge label={`${flaggedCount} flagged`} tone={flaggedCount > 0 ? "warning" : "neutral"} />
        </View>
      </Card>

      <View style={styles.list}>
        {questions.map((question, index) => {
          const isAnswered = (session.selectedOptionIdsByQuestionId[question.id] ?? []).length > 0;
          const isFlagged = session.flaggedQuestionIds.includes(question.id);

          return (
            <Pressable
              accessibilityRole="button"
              key={question.id}
              onPress={() => navigation.navigate(ROUTES.EXAM, { questionIndex: index })}
              style={({ pressed }) => [styles.reviewItem, pressed ? styles.reviewItemPressed : null]}
            >
              <Text style={styles.reviewTitle}>Question {index + 1}</Text>
              <View style={styles.statusRow}>
                <Badge label={isAnswered ? "Answered" : "Unanswered"} tone={isAnswered ? "success" : "danger"} />
                {isFlagged ? <Badge label="Flagged" tone="warning" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button onPress={handleSubmit}>Submit Exam</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  list: {
    gap: spacing.md
  },
  reviewItem: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  reviewItemPressed: {
    opacity: 0.82
  },
  reviewTitle: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});

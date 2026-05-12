import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Card, EmptyState, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { clearActiveExamSession, getActiveExamSession, getQuestions } from "../../storage";
import { colors, radius, spacing, typography } from "../../theme";
import type { ActiveExamSession } from "../../types";
import { formatDuration, getDomainLabel } from "../../utils";
import {
  buildExamQuestionViews,
  getRemainingSeconds,
  submitActiveExamSession,
  toggleExamFlag,
  updateCurrentQuestionIndex,
  updateExamAnswer,
  type ExamQuestionView
} from "./examService";

type ExamScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM>;

export function ExamScreen({ navigation, route }: ExamScreenProps) {
  const [session, setSession] = useState<ActiveExamSession | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionView[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const loadExam = useCallback(async () => {
    const [savedSession, bankQuestions] = await Promise.all([getActiveExamSession(), getQuestions()]);

    if (!savedSession) {
      setSession(null);
      setQuestions([]);
      return;
    }

    const requestedIndex = route.params?.questionIndex;
    const nextSession =
      typeof requestedIndex === "number" ? await updateCurrentQuestionIndex(requestedIndex) : savedSession;
    const activeSession = nextSession ?? savedSession;

    setSession(activeSession);
    setQuestions(buildExamQuestionViews(activeSession, bankQuestions));
    setRemainingSeconds(getRemainingSeconds(activeSession));
  }, [route.params?.questionIndex]);

  useFocusEffect(
    useCallback(() => {
      void loadExam();
    }, [loadExam])
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

  const currentQuestion = session ? questions[session.currentQuestionIndex] : undefined;
  const selectedOptionIds = useMemo(() => {
    if (!session || !currentQuestion) {
      return [];
    }

    return session.selectedOptionIdsByQuestionId[currentQuestion.id] ?? [];
  }, [currentQuestion, session]);

  async function handleSelectOption(optionId: string) {
    if (!session || !currentQuestion) {
      return;
    }

    const nextSelected =
      currentQuestion.type === "single"
        ? [optionId]
        : selectedOptionIds.includes(optionId)
          ? selectedOptionIds.filter((selectedId) => selectedId !== optionId)
          : [...selectedOptionIds, optionId];
    const nextSession = await updateExamAnswer(currentQuestion.id, nextSelected);

    if (nextSession) {
      setSession(nextSession);
    }
  }

  async function handleMove(nextIndex: number) {
    const nextSession = await updateCurrentQuestionIndex(nextIndex);

    if (nextSession) {
      setSession(nextSession);
    }
  }

  async function handleToggleFlag() {
    if (!currentQuestion) {
      return;
    }

    const nextSession = await toggleExamFlag(currentQuestion.id);

    if (nextSession) {
      setSession(nextSession);
    }
  }

  if (!session) {
    return (
      <Screen>
        <EmptyState
          title="No active exam"
          description="Start a new exam from Home once the question bank is ready."
          actionLabel="Go Home"
          onActionPress={() => navigation.navigate(ROUTES.HOME)}
        />
      </Screen>
    );
  }

  if (!currentQuestion) {
    return (
      <Screen>
        <EmptyState
          title="Exam session unavailable"
          description="The saved exam references questions that are no longer available locally."
          actionLabel="Clear Session"
          onActionPress={() => {
            void clearActiveExamSession().then(() => navigation.navigate(ROUTES.HOME));
          }}
        />
      </Screen>
    );
  }

  const isFlagged = session.flaggedQuestionIds.includes(currentQuestion.id);
  const isFirstQuestion = session.currentQuestionIndex === 0;
  const isLastQuestion = session.currentQuestionIndex === session.questionIds.length - 1;
  const chooseLabel = currentQuestion.type === "single" ? "Choose one" : `Choose ${currentQuestion.correctOptionIds.length}`;

  return (
    <Screen>
      <Card>
        <SectionHeader
          title={`Question ${session.currentQuestionIndex + 1} / ${session.questionIds.length}`}
          subtitle={`Time left: ${formatDuration(remainingSeconds)}`}
        />
        <Text style={styles.domainLabel}>{getDomainLabel(currentQuestion.domain)}</Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        <Text style={styles.chooseText}>{chooseLabel}</Text>
      </Card>

      <View style={styles.options}>
        {currentQuestion.shuffledOptions.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id);

          return (
            <Pressable
              accessibilityRole={currentQuestion.type === "single" ? "radio" : "checkbox"}
              key={option.id}
              onPress={() => void handleSelectOption(option.id)}
              style={({ pressed }) => [styles.optionCard, isSelected ? styles.optionSelected : null, pressed ? styles.optionPressed : null]}
            >
              <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>{option.text}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button variant="secondary" onPress={handleToggleFlag}>
          {isFlagged ? "Unflag" : "Flag"}
        </Button>
        <Button variant="secondary" disabled={isFirstQuestion} onPress={() => void handleMove(session.currentQuestionIndex - 1)}>
          Previous
        </Button>
        {isLastQuestion ? (
          <Button onPress={() => navigation.navigate(ROUTES.EXAM_REVIEW)}>Review</Button>
        ) : (
          <Button onPress={() => void handleMove(session.currentQuestionIndex + 1)}>Next</Button>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  domainLabel: {
    ...typography.caption,
    color: colors.light.primary
  },
  questionText: {
    ...typography.heading,
    color: colors.light.text
  },
  chooseText: {
    ...typography.body,
    color: colors.light.textMuted
  },
  options: {
    gap: spacing.md
  },
  optionCard: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg
  },
  optionSelected: {
    backgroundColor: colors.light.primarySoft,
    borderColor: colors.light.primary
  },
  optionPressed: {
    opacity: 0.82
  },
  optionText: {
    ...typography.body,
    color: colors.light.text
  },
  optionTextSelected: {
    ...typography.bodyStrong,
    color: colors.light.text
  },
  actions: {
    gap: spacing.md
  }
});

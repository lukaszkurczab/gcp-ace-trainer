import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { loadTrainingAttempts } from "../../application/learningReadModels";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { Button, Card, EmptyState, LoadingState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { spacing, typography, type AppColors } from "../../theme";
import type { CertificationQuestion } from "../../tracks/certification";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM_REVIEW>;

type ReviewRow = Readonly<{
  id: string;
  question: string;
  correct: boolean;
  reason: string;
}>;

type ExamReviewReadState =
  | Readonly<{ kind: "pending"; requestKey: string }>
  | Readonly<{ kind: "ready"; requestKey: string; rows: readonly ReviewRow[] }>
  | Readonly<{ kind: "unavailable"; requestKey: string; reason: string }>;

export function ExamReviewScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const requestKey = route.params.sessionId;
  const [readState, setReadState] = useState<ExamReviewReadState>({ kind: "pending", requestKey });

  useEffect(() => {
    const capturedRequestKey = requestKey;
    let live = true;
    setReadState({ kind: "pending", requestKey: capturedRequestKey });

    void loadTrainingAttempts()
      .then(async ({ value }) => {
        if (!live) return;
        const rows = await Promise.all(value
          .filter((attempt) => attempt.sessionId === capturedRequestKey)
          .map(async (attempt) => {
            const question = await contentPackageRuntimeOwner.resolveItem<CertificationQuestion>(attempt.item);
            return {
              id: attempt.id,
              question: question.question,
              correct: attempt.result.kind === "correct",
              reason: question.feedback.reason,
            };
          }));
        if (!live) return;
        setReadState({ kind: "ready", requestKey: capturedRequestKey, rows });
      })
      .catch((error) => {
        if (!live) return;
        setReadState({
          kind: "unavailable",
          requestKey: capturedRequestKey,
          reason: describeOperationalFailure(error, "Exam review data is unavailable."),
        });
      });

    return () => { live = false; };
  }, [requestKey]);

  if (readState.requestKey !== requestKey || readState.kind === "pending") {
    return <Screen><LoadingState title={t("Loading review…")} /></Screen>;
  }
  if (readState.kind === "unavailable") {
    return (
      <Screen>
        <EmptyState
          title={t("Exam review is unavailable")}
          description={t(readState.reason)}
          actionLabel={t("Back to practice")}
          onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
        />
      </Screen>
    );
  }
  const rows = readState.rows;
  if (!rows.length) return <Screen><EmptyState title={t("No submitted answers")} description={t("This exam was finalized without answered questions.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;

  return (
    <Screen style={styles.screen}>
      <Text testID={runtimeSelectors.examReview.root(route.params.sessionId)} />
      {rows.map((row) => (
        <Card key={row.id} style={styles.card}>
          <Text maxFontSizeMultiplier={2} style={row.correct ? styles.correct : styles.incorrect}>{t(row.correct ? "Correct" : "Review")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.question}>{row.question}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.explanation}>{row.reason}</Text>
        </Card>
      ))}
      <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} testID={runtimeSelectors.examReview.backToPractice(route.params.sessionId)}>{t("Back to practice")}</Button>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  screen: { gap: spacing.md },
  card: { gap: spacing.sm },
  correct: { ...typography.small, color: palette.success },
  incorrect: { ...typography.small, color: palette.danger },
  question: { ...typography.bodyStrong, color: palette.textPrimary },
  explanation: { ...typography.body, color: palette.textSecondary },
});

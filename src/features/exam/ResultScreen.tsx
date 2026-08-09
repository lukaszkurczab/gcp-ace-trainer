import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { getTrainingLifecycleUseCases } from "../../application/trainingLifecycle";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, Card, EmptyState, LoadingState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.RESULT>;
const GOOGLE_CLOUD_TRACK_ID = "google-cloud-associate-cloud-engineer";

export function ResultScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [result, setResult] = useState<Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSummary"]>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void getTrainingLifecycleUseCases().loadSummary(route.params.sessionId).then(setResult).catch((cause) => setError(describeOperationalFailure(cause, "Session summary unavailable.")));
  }, [route.params.sessionId]);
  if (error) return <Screen><EmptyState title={t("Session summary unavailable")} description={t(error)} /></Screen>;
  if (!result) return <Screen><LoadingState title={t("Verifying session summary…")} /></Screen>;
  const details = result.evidence.details as Record<string, unknown>;
  const certification = result.trackId === GOOGLE_CLOUD_TRACK_ID;
  return <Screen style={styles.screen}><Card style={styles.card}><Text style={styles.title}>{t(certification ? "Session complete" : "Exam complete")}</Text><Text style={styles.score}>{String(details.correctCount ?? 0)} {t("correct")}</Text><Text style={styles.detail}>{t("Points")}: {String(details.pointsEarned ?? 0)} / {String(details.maxPoints ?? 0)}</Text><Text style={styles.detail}>{t("Unanswered")}: {result.unansweredOccurrenceIds.length}</Text></Card><Button onPress={() => navigation.navigate(ROUTES.EXAM_REVIEW, { sessionId: route.params.sessionId })} testID={runtimeSelectors.summary.reviewAnswers(route.params.sessionId)}>{t("Review answers")}</Button><Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} variant="secondary">{t("Back to practice")}</Button></Screen>;
}
const createStyles = (palette: AppColors) => StyleSheet.create({ screen: { gap: spacing.md }, card: { gap: spacing.sm }, title: { ...typography.heading, color: palette.textPrimary }, score: { ...typography.display, color: palette.primary }, detail: { ...typography.body, color: palette.textSecondary } });

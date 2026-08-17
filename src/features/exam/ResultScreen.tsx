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
type Summary = Readonly<{
  result: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSummary"]>>;
  session: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSessionRecord"]>>;
}>;

export function ResultScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const useCases = getTrainingLifecycleUseCases();
    void Promise.all([useCases.loadSummary(route.params.sessionId), useCases.loadSessionRecord(route.params.sessionId)])
      .then(([result, session]) => setSummary({ result, session }))
      .catch((cause) => setError(describeOperationalFailure(cause, "Session summary unavailable.")));
  }, [route.params.sessionId]);
  if (error) return <Screen><EmptyState title={t("Session summary unavailable")} description={t(error)} /></Screen>;
  if (!summary) return <Screen><LoadingState title={t("Verifying session summary…")} /></Screen>;
  const { result, session } = summary;
  const details = result.evidence.details as Record<string, unknown>;
  const certification = result.trackId === GOOGLE_CLOUD_TRACK_ID;
  const answeredCount = result.answeredOccurrenceIds.length;
  const noAnswersSubmitted = answeredCount === 0;
  return <Screen style={styles.screen}>
    <Card style={styles.card}>
      <Text style={styles.title}>{t(noAnswersSubmitted ? "Session ended without answers" : certification ? "Session complete" : "Exam complete")}</Text>
      <Text style={styles.status}>{t("Status")}: {t(noAnswersSubmitted ? "No answers submitted" : "Completed")}</Text>
      <Text style={styles.score}>{String(details.correctCount ?? 0)} {t("correct")}</Text>
      <Text style={styles.detail}>{t("Points")}: {String(details.pointsEarned ?? 0)} / {String(details.maxPoints ?? 0)}</Text>
      <Text style={styles.detail}>{t("Requested")}: {session.requestedLength} · {t("Questions")}: {session.actualLength}</Text>
      <Text style={styles.detail}>{t("Answered")}: {answeredCount} · {t("Unanswered")}: {result.unansweredOccurrenceIds.length}</Text>
      <Text style={styles.detail}>{t("Active time")}: {formatElapsed(session.activeForegroundMs)}</Text>
      <Text style={styles.detail}>{t("Mode")}: {formatMode(session.modeId)}</Text>
      <Text style={styles.detail}>{t("Domains")}: {formatDomains(session.configurationSnapshot.sectionPresentation)}</Text>
    </Card>
    <Button onPress={() => navigation.navigate(ROUTES.EXAM_REVIEW, { sessionId: route.params.sessionId })} testID={runtimeSelectors.summary.reviewAnswers(route.params.sessionId)}>{t("Review answers")}</Button>
    <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} variant="secondary">{t("Back to practice")}</Button>
  </Screen>;
}

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatMode(modeId: string): string {
  return modeId.replace(/^certification-/, "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDomains(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string")) return "Not recorded";
  return value.map((entry) => entry.replaceAll("_", " ")).join(", ");
}

const createStyles = (palette: AppColors) => StyleSheet.create({ screen: { gap: spacing.md }, card: { gap: spacing.sm }, title: { ...typography.heading, color: palette.textPrimary }, status: { ...typography.bodyStrong, color: palette.warning }, score: { ...typography.display, color: palette.primary }, detail: { ...typography.body, color: palette.textSecondary } });

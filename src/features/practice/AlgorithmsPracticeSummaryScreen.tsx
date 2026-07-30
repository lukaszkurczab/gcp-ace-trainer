import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  getAlgorithmsPracticeSummaryProjection,
  type AlgorithmsSessionResultProjection,
} from "../../application/algorithms";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, Card, EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { PracticeFeedbackBlock } from "./PracticeFeedbackBlock";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_PRACTICE_SUMMARY>;
type ViewState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; result: AlgorithmsSessionResultProjection }>
  | Readonly<{ kind: "unavailable"; reason: string }>;

/** Renders only the immutable completed-session result addressed by the route. */
export function AlgorithmsPracticeSummaryScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const sessionId = route.params.sessionId;
  const load = useCallback(async () => {
    try {
      setState({ kind: "ready", result: await getAlgorithmsPracticeSummaryProjection(sessionId) });
    } catch (error) {
      setState({ kind: "unavailable", reason: describeOperationalFailure(error, "The completed session result is unavailable.") });
    }
  }, [sessionId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (state.kind === "loading") {
    return <Screen><EmptyState title={t("Loading session result")} description={t("Reading the verified completed-session result.")} /></Screen>;
  }
  if (state.kind === "unavailable") {
    return <Screen><EmptyState title={t("Session result unavailable")} description={t(state.reason)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  }

  const { result } = state;
  const missedCount = result.score ? result.score.partialCount + result.score.incorrectCount : null;
  return (
    <Screen
      edges={["top", "bottom"]}
      footer={<Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} testID={runtimeSelectors.summary.backToPractice(result.sessionId)}>{t("Back to practice")}</Button>}
    >
      <Card style={styles.result} variant="layered">
        <Text style={styles.eyebrow}>{t(result.completionKind === "completed" ? "Session complete" : "Session ended early")}</Text>
        <Text style={styles.resultTitle} testID={runtimeSelectors.summary.root(result.sessionId)}>{t(result.completionKind === "completed" ? "Session result" : "Partial summary")}</Text>
        <View style={styles.divider} />
        <Text style={styles.resultText} testID={runtimeSelectors.summary.configuration(result.sessionId, result.configuration.actualLength, result.configuration.feedbackTiming)}>{result.configuration.actualLength} {t("items")} · {t(result.configuration.feedbackTiming === "atSessionEnd" ? "Feedback at session end" : "Feedback after each answer")}</Text>
        <Text style={styles.resultText}>{result.answeredOccurrenceIds.length} {t("answered")} · {result.unansweredOccurrenceIds.length} {t("unanswered")}</Text>
        <Text style={styles.resultText}>{t("Active time")} {formatElapsed(result.elapsedForegroundMs)}</Text>
        {result.score ? <Text style={styles.resultText}>{result.score.correctCount} {t("correct")} · {missedCount} {t("Missed")} · {result.score.pointsEarned} / {result.score.maxPoints} {t("points")}</Text> : result.completionKind === "abandoned" ? <Text style={styles.resultText}>{t("Score is shown only after a completed session.")}</Text> : <Text style={styles.resultText}>{t("Verified result details are unavailable.")}</Text>}
        {result.feedbackItems.length > 0 ? (
          <View style={styles.feedbackItems}>
            <Text style={styles.feedbackTitle}>{t("Answer review")}</Text>
            {result.feedbackItems.map((item) => (
              <View key={item.occurrenceId} style={styles.feedbackItem} testID={runtimeSelectors.summary.feedbackItem(result.sessionId, item.occurrenceId)}>
                <Text style={styles.feedbackPrompt}>{item.ordinal}. {item.prompt}</Text>
                <PracticeFeedbackBlock itemId={item.occurrenceId} feedback={{ details: item.details, reason: item.reason, result: item.correctness }} />
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  divider: { backgroundColor: palette.border, height: StyleSheet.hairlineWidth },
  eyebrow: { ...typography.caption, color: palette.accentPurple, letterSpacing: 0.7, textTransform: "uppercase" },
  feedbackItem: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.md, paddingTop: spacing.lg },
  feedbackItems: { gap: spacing.lg },
  feedbackPrompt: { ...typography.bodyStrong, color: palette.textPrimary },
  feedbackTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  result: { gap: spacing.xl },
  resultText: { ...typography.body, color: palette.textSecondary },
  resultTitle: { ...typography.heading, color: palette.textPrimary },
});

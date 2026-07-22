import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  getAlgorithmsPracticeResultProjection,
  type AlgorithmsSessionResultProjection,
} from "../../application/algorithms";
import { Button, EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
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
      setState({ kind: "ready", result: await getAlgorithmsPracticeResultProjection(sessionId) });
    } catch (error) {
      setState({ kind: "unavailable", reason: error instanceof Error ? error.message : "The completed session result is unavailable." });
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
    <Screen edges={["top", "bottom"]}>
      <View style={styles.result}>
        <Text style={styles.resultTitle} testID={runtimeSelectors.summary.root(result.sessionId)}>{t("Session result")}</Text>
        <Text style={styles.resultText} testID={runtimeSelectors.summary.configuration(result.sessionId, result.configuration.actualLength, result.configuration.feedbackTiming)}>{result.configuration.actualLength} {t("items")} · {t(result.configuration.feedbackTiming === "atSessionEnd" ? "Feedback at session end" : "Feedback after each answer")}</Text>
        <Text style={styles.resultText}>{result.answeredOccurrenceIds.length} {t("answered")} · {result.unansweredOccurrenceIds.length} {t("unanswered")}</Text>
        {result.score ? <Text style={styles.resultText}>{result.score.correctCount} {t("correct")} · {missedCount} {t("Missed")} · {result.score.pointsEarned} / {result.score.maxPoints} {t("points")}</Text> : <Text style={styles.resultText}>{t("Verified result details are unavailable.")}</Text>}
        {result.feedbackItems.length > 0 ? (
          <View style={styles.feedbackItems}>
            <Text style={styles.feedbackTitle}>{t("Answer review")}</Text>
            {result.feedbackItems.map((item) => (
              <View key={item.occurrenceId} style={styles.feedbackItem} testID={runtimeSelectors.summary.feedbackItem(result.sessionId, item.occurrenceId)}>
                <Text style={styles.feedbackPrompt}>{item.ordinal}. {item.prompt}</Text>
                <PracticeFeedbackBlock itemId={`${result.sessionId}:${item.occurrenceId}`} feedback={{ details: item.details, reason: item.reason, result: item.correctness }} />
              </View>
            ))}
          </View>
        ) : null}
        <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} testID={runtimeSelectors.summary.backToPractice(result.sessionId)}>{t("Back to practice")}</Button>
      </View>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  feedbackItem: { gap: spacing.sm },
  feedbackItems: { gap: spacing.lg },
  feedbackPrompt: { ...typography.bodyStrong, color: palette.textPrimary },
  feedbackTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  result: { backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg, margin: spacing.xl, padding: spacing.xl },
  resultText: { ...typography.body, color: palette.textSecondary },
  resultTitle: { ...typography.heading, color: palette.textPrimary },
});

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  abandonCertificationSession,
  advanceCertificationPracticeSession,
  completeCertificationPracticeSession,
  getCertificationPracticeProjection,
  startCertificationSession,
  submitCertificationPracticeResponse,
  type CertificationPracticeProjection,
} from "../../application/certification";
import { Button, Card, EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { scoreCertificationQuestion } from "../../tracks/cloud-certification";
import { spacing, typography } from "../../theme";
import type { AppColors } from "../../theme";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import type { PracticeSessionRouteParams } from "./sessionConfig";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;

/** Cloud Practice and due-review runner backed solely by the generic lifecycle facade. */
export function CertificationPracticeSessionScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [projection, setProjection] = useState<CertificationPracticeProjection | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mode = route.params.mode === "cloud-review" ? "cloud-review" : "cloud-practice";

  const refresh = async () => {
    const next = await getCertificationPracticeProjection();
    setProjection(next);
    setSubmitted(Boolean(next.committedResponse));
    setSelected(next.committedResponse ? [...next.committedResponse.selectedOptionIds] : []);
  };
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const active = await getCertificationPracticeProjection().catch(() => null);
        if (!active) await startCertificationSession({ modeId: mode, requestedLength: route.params.sessionLength, domain: route.params.topicId as never, source: route.params.source });
        if (live) await refresh();
      } catch (cause) { if (live) setError(cause instanceof Error ? cause.message : "Cloud practice is unavailable."); }
    })();
    return () => { live = false; };
  }, [mode, route.params]);

  if (error) return <Screen><EmptyState title={t("Cloud Practice unavailable")} description={t(error)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (!projection) return <Screen><Text style={styles.loading}>{t("Preparing immutable Cloud session…")}</Text></Screen>;
  const multiple = projection.question.type === "multiple";
  const feedback = submitted ? scoreCertificationQuestion(projection.question, { kind: "option_selection", selectedOptionIds: selected }) : null;
  const toggle = (id: string) => setSelected((current) => multiple ? (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) : [id]);
  const submit = async () => {
    if (!selected.length) { setError("Select an answer before submitting."); return; }
    try { await submitCertificationPracticeResponse({ kind: "option_selection", selectedOptionIds: selected }); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The answer was not saved."); }
  };
  const next = async () => {
    try {
      if (projection.ordinal === projection.total) { await completeCertificationPracticeSession(); navigation.replace(ROUTES.RESULT, { sessionId: projection.session.id }); }
      else { await advanceCertificationPracticeSession(); await refresh(); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The next question could not be opened."); }
  };
  return <Screen style={styles.screen}><View testID={runtimeSelectors.session.root(projection.session.id)}>
    <Text style={styles.progress} testID={runtimeSelectors.session.counter(projection.session.id, projection.ordinal, projection.total)}>{t("Question")} {projection.ordinal} {t("of")} {projection.total}</Text>
    <Text testID={runtimeSelectors.session.track(projection.session.trackId)} />
    <Text testID={runtimeSelectors.session.mode(projection.session.modeId)} />
    <Card style={styles.card}>
      <Text style={styles.domain}>{t(projection.question.domain.replaceAll("_", " "))}</Text>
      <Text style={styles.question} testID={runtimeSelectors.session.question(projection.question.id)}>{projection.question.question}</Text>
      <View style={styles.options}>{projection.question.options.map((option) => <Pressable key={option.id} accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityState={{ checked: selected.includes(option.id) }} disabled={submitted} onPress={() => toggle(option.id)} style={[styles.option, selected.includes(option.id) && styles.optionSelected]} testID={runtimeSelectors.session.option(projection.question.id, option.id)}><Text style={styles.optionText}>{option.text}</Text></Pressable>)}</View>
      {feedback ? <View style={styles.feedback} testID={runtimeSelectors.session.feedback(projection.question.id)}><Text style={feedback.kind === "correct" ? styles.correct : styles.incorrect} testID={runtimeSelectors.session.result(projection.question.id, feedback.kind)}>{t(feedback.kind === "correct" ? "Correct" : feedback.kind === "partial" ? "Partially correct" : "Incorrect")}</Text><Text style={styles.explanation} testID={runtimeSelectors.session.reason(projection.question.id)}>{t("Reason")}: {projection.question.explanation}</Text><Text style={styles.explanation} testID={runtimeSelectors.session.details(projection.question.id)}>{t("Details")}: {projection.question.watchOutFor}</Text></View> : null}
    </Card>
    {submitted ? <Button onPress={() => void next()} testID={runtimeSelectors.session.continue(projection.question.id)}>{t(projection.ordinal === projection.total ? "Finish session" : "Next question")}</Button> : <Button onPress={() => void submit()} testID={runtimeSelectors.session.submit(projection.question.id)}>{t("Submit answer")}</Button>}
    <Button onPress={() => void abandonCertificationSession().then(() => navigation.navigate(ROUTES.PRACTICE_HUB))} testID={runtimeSelectors.session.leave(projection.session.id)} variant="secondary">{t("Leave session")}</Button>
  </View></Screen>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({ screen: { gap: spacing.md }, loading: { ...typography.body, color: palette.textSecondary }, progress: { ...typography.small, color: palette.textMuted }, card: { gap: spacing.md }, domain: { ...typography.caption, color: palette.primary, textTransform: "uppercase" }, question: { ...typography.bodyStrong, color: palette.textPrimary }, options: { gap: spacing.sm }, option: { borderColor: palette.border, borderRadius: 12, borderWidth: 1, padding: spacing.md }, optionSelected: { borderColor: palette.primary, backgroundColor: palette.primarySoft }, optionText: { ...typography.body, color: palette.textPrimary }, feedback: { gap: spacing.sm }, correct: { ...typography.bodyStrong, color: palette.success }, incorrect: { ...typography.bodyStrong, color: palette.danger }, explanation: { ...typography.body, color: palette.textSecondary } });

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CertificationExamExpiredError, finalizeCertificationExam, getCertificationExamProjection, navigateCertificationExamTo, resumeExpectedCertificationExam, saveCertificationExamResponse, startCertificationExam, toggleCertificationExamFlag, type CertificationExamProjection } from "../../application/certification";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, Card, EmptyState, LoadingState, Screen, SettingsDialog } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { SimulationQuestionNavigator } from "../simulation/navigator/SimulationQuestionNavigator";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM>;

/** Canonical Cloud exam runner; navigation and responses are durably persisted through the shared lifecycle. */
export function ExamScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles); const { t } = useTranslation("common");
  const [projection, setProjection] = useState<CertificationExamProjection | null>(null); const [error, setError] = useState<string | null>(null); const [navigatorVisible, setNavigatorVisible] = useState(false); const [finishVisible, setFinishVisible] = useState(false);
  const refresh = async () => {
    try { setProjection(await getCertificationExamProjection()); }
    catch (cause) {
      if (cause instanceof CertificationExamExpiredError) { navigation.replace(ROUTES.RESULT, { sessionId: cause.sessionId }); return; }
      throw cause;
    }
  };
  useEffect(() => { let active = true; void (async () => {
    const expectedSessionId = route.params?.expectedSessionId;
    if (expectedSessionId) {
      try {
        const resumed = await resumeExpectedCertificationExam(expectedSessionId);
        if (!active) return;
        if (resumed.kind === "active_session_conflict") { setError("The expected Cloud exam is no longer the active session."); return; }
        setProjection(resumed.projection);
      } catch (cause) {
        if (!active) return;
        if (cause instanceof CertificationExamExpiredError) { navigation.replace(ROUTES.RESULT, { sessionId: cause.sessionId }); return; }
        setError(describeOperationalFailure(cause, "The expected Cloud exam is unavailable."));
      }
      return;
    }
    try { await refresh(); } catch { try { await startCertificationExam(); if (active) await refresh(); } catch (startCause) { if (active) setError(describeOperationalFailure(startCause, "Exam is unavailable.")); } }
  })(); return () => { active = false; }; }, [route.params?.expectedSessionId]);
  useEffect(() => {
    if (!projection) return;
    const interval = setInterval(() => { void refresh().catch((cause) => setError(describeOperationalFailure(cause, "Exam refresh failed."))); }, 1_000);
    return () => clearInterval(interval);
  }, [projection]);
  if (error) return <Screen><EmptyState title={t("Exam unavailable")} description={t(error)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (!projection) return <Screen><LoadingState title={t("Preparing exam simulation…")} /></Screen>;
  const deadline = projection.session.configurationSnapshot.timerDeadlineAt;
  if (typeof deadline !== "string") return <Screen><EmptyState title={t("Exam unavailable")} description={t("The immutable exam deadline is unavailable.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  const remainingMs = Math.max(0, Date.parse(deadline) - Date.parse(projection.now)); const remainingMinutes = Math.floor(remainingMs / 60_000); const remainingSeconds = Math.floor((remainingMs % 60_000) / 1_000);
  const selected = new Set(projection.response?.selectedOptionIds ?? []); const multiple = projection.question.type === "multiple";
  const select = async (id: string) => { const ids = multiple ? (selected.has(id) ? [...selected].filter((value) => value !== id) : [...selected, id]) : [id]; if (!ids.length) return; try { await saveCertificationExamResponse({ occurrenceId: projection.occurrenceId, response: { kind: "option_selection", selectedOptionIds: ids } }); await refresh(); } catch (cause) { setError(describeOperationalFailure(cause, "Answer could not be saved.")); } };
  const go = async (index: number): Promise<"navigated" | "incomplete_response" | "save_failed"> => { try { await navigateCertificationExamTo(index); await refresh(); return "navigated"; } catch (cause) { setError(describeOperationalFailure(cause, "Exam navigation failed.")); return "save_failed"; } };
  const toggleFlag = async () => { try { await toggleCertificationExamFlag(projection.occurrenceId); await refresh(); } catch (cause) { setError(describeOperationalFailure(cause, "Question flag could not be saved.")); } };
  const finish = async () => { try { navigation.replace(ROUTES.RESULT, { sessionId: await finalizeCertificationExam() }); } catch (cause) { setError(describeOperationalFailure(cause, "Exam finalization failed.")); } };
  return <Screen style={styles.screen}><View testID={runtimeSelectors.simulation.root(projection.session.id)}>
    <Text maxFontSizeMultiplier={2} style={styles.progress} testID={runtimeSelectors.session.counter(projection.session.id, projection.ordinal, projection.total)}>{t("Question")} {projection.ordinal} {t("of")} {projection.total}</Text><Text maxFontSizeMultiplier={2} style={styles.progress} testID={runtimeSelectors.session.timer(projection.session.id)}>{t("Time remaining")}: {remainingMinutes}:{String(remainingSeconds).padStart(2, "0")}</Text><Text maxFontSizeMultiplier={2} style={styles.domain}>{t(projection.question.domain.replaceAll("_", " "))}</Text>
    <Card style={styles.card}><Text maxFontSizeMultiplier={2} style={styles.question} testID={runtimeSelectors.simulation.question(projection.question.id)}>{projection.question.question}</Text><View style={styles.options}>{projection.question.options.map((option) => <Pressable key={option.id} accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityState={{ checked: selected.has(option.id) }} onPress={() => void select(option.id)} style={[styles.option, selected.has(option.id) && styles.selected]} testID={runtimeSelectors.simulation.option(projection.question.id, option.id)}><Text maxFontSizeMultiplier={2} style={styles.optionText}>{option.text}</Text></Pressable>)}</View></Card>
    <View style={styles.navigationActions}><Button onPress={() => void go(Math.max(0, projection.ordinal - 2))} disabled={projection.ordinal === 1} testID={runtimeSelectors.simulation.action(projection.session.id, "previous")} variant="secondary">{t("Previous")}</Button><Button onPress={() => void go(Math.min(projection.total - 1, projection.ordinal))} disabled={projection.ordinal === projection.total} testID={runtimeSelectors.simulation.action(projection.session.id, "next")} variant="secondary">{t("Next")}</Button></View>
    <View style={styles.examActions}><Button onPress={() => setNavigatorVisible(true)} testID={runtimeSelectors.simulation.action(projection.session.id, "navigator")} variant="secondary">{t("Question navigator")}</Button><Button onPress={() => void toggleFlag()} testID={runtimeSelectors.simulation.action(projection.session.id, "flag")} variant="secondary">{t(projection.flaggedOccurrenceIds.includes(projection.occurrenceId) ? "Remove flag" : "Flag question")}</Button></View>
    <Button onPress={() => setFinishVisible(true)} testID={runtimeSelectors.simulation.action(projection.session.id, "finish")}>{t("Finish exam")}</Button>
  </View>
  <SimulationQuestionNavigator onDismiss={() => setNavigatorVisible(false)} onOccurrencePress={(occurrenceId) => go(projection.session.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === occurrenceId))} positions={projection.session.itemOrder.map((occurrence, index) => ({ occurrenceId: occurrence.occurrenceId, state: index === projection.session.currentItemIndex ? "current" : projection.draft.responsesByOccurrenceId[occurrence.occurrenceId] ? "answered" : "unanswered", flagged: projection.flaggedOccurrenceIds.includes(occurrence.occurrenceId) }))} visible={navigatorVisible} />
  <SettingsDialog closeLabel={t("Continue simulation")} message={`${projection.total - Object.keys(projection.draft.responsesByOccurrenceId).length} ${t("unanswered")}. ${t("Unanswered questions receive zero points.")}`} onClose={() => setFinishVisible(false)} onPrimaryAction={() => { setFinishVisible(false); void finish(); }} primaryActionLabel={t("Finish exam")} secondaryActionLabel={t("Continue simulation")} title={t("Finish with unanswered questions?")} visible={finishVisible} />
  </Screen>;
}
const createStyles = (palette: AppColors) => StyleSheet.create({ screen: { gap: spacing.md }, progress: { ...typography.small, color: palette.textMuted }, domain: { ...typography.caption, color: palette.primary, textTransform: "uppercase" }, card: { gap: spacing.md }, question: { ...typography.bodyStrong, color: palette.textPrimary }, options: { gap: spacing.sm }, option: { borderColor: palette.border, borderRadius: 12, borderWidth: 1, padding: spacing.md }, selected: { backgroundColor: palette.primarySoft, borderColor: palette.primary }, optionText: { ...typography.body, color: palette.textPrimary }, navigationActions: { flexDirection: "row", gap: spacing.sm }, examActions: { gap: spacing.sm } });

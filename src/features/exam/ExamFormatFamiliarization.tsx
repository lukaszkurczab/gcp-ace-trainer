import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { getCertificationExamRules, type CertificationExamRules } from "../../application/certification";
import { Button, Screen } from "../../components";
import type { CanonicalQuestionResponse } from "../../content/canonical";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { ExamResponseControls, type ExamResponseRenderer } from "./ExamResponseControls";

// These unscored UI examples are independent from the canonical question bank.
const examples: readonly Readonly<{ type: string; prompt: string; renderer: ExamResponseRenderer; count?: number }>[] = [
  { type: "choice_single", prompt: "Choose a workspace for this demonstration.", renderer: { kind: "choice", options: [{ id: "desk", text: "Desk" }, { id: "studio", text: "Studio" }] } },
  { type: "choice_multiple", prompt: "Select two supplies for this demonstration.", count: 2, renderer: { kind: "choice", options: [{ id: "pen", text: "Pen" }, { id: "paper", text: "Paper" }, { id: "book", text: "Book" }] } },
  { type: "decision_matrix", prompt: "Choose an answer separately for each statement.", renderer: { kind: "complexity", dimensions: [{ id: "calendar", label: "A calendar can show dates.", values: [{ id: "true", text: "True" }, { id: "false", text: "False" }] }, { id: "clock", label: "A clock can show time.", values: [{ id: "yes", text: "Yes" }, { id: "no", text: "No" }] }] } },
];

/** No lifecycle calls: the timer and scored session begin only after Start/Skip. */
export function ExamFormatFamiliarization({ onStart, trackId }: Readonly<{ onStart: () => void; trackId: string }>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const [rules, setRules] = useState<CertificationExamRules | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    void getCertificationExamRules(trackId).then((value) => { if (live) setRules(value); }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [trackId]);
  const [showExamples, setShowExamples] = useState(false);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Readonly<Record<number, CanonicalQuestionResponse | null>>>({});
  const example = examples[index]!;
  const localizedRenderer: ExamResponseRenderer = {
    ...example.renderer,
    ...(example.renderer.options ? { options: example.renderer.options.map((option) => ({ ...option, text: t(option.text) })) } : {}),
    ...(example.renderer.dimensions ? { dimensions: example.renderer.dimensions.map((row) => ({ ...row, label: row.label ? t(row.label) : row.label, values: row.values.map((value) => ({ ...value, text: t(value.text) })) })) } : {}),
  };
  return <Screen edges={["top", "bottom"]}>
    <Text style={styles.title} maxFontSizeMultiplier={2}>{t("Before you begin")}</Text>
    <Text style={styles.text} maxFontSizeMultiplier={2}>{t("Patternly practice rules: one point per fully correct item; incomplete or incorrect items receive zero. The raw percentage is not an official scaled score or a prediction of passing.")}</Text>
    <Text style={styles.text} maxFontSizeMultiplier={2}>{rules ? t("Practice uses {{count}} items in {{minutes}} minutes. Format proportions and scoring are Patternly training choices.", { count: rules.questionCount, minutes: rules.durationMinutes }) : t(error ? "Exam rules could not be loaded. Return to Practice and try again." : "Loading exam rules…")}</Text>
    {showExamples ? <View style={styles.stack}>
      <Text style={styles.text} maxFontSizeMultiplier={2}>{t("These examples are unscored. The exam clock has not started. Change or clear your choices, leave an example incomplete, then return with Previous.")}</Text>
      <Text style={styles.text} maxFontSizeMultiplier={2}>{t(example.prompt)}</Text>
      <ExamResponseControls interactionType={example.type} itemId={`format-demo-${index}`} onChange={(response) => setResponses((current) => ({ ...current, [index]: response }))} renderer={localizedRenderer} requiredSelectionCount={example.count} response={responses[index] ?? null} />
      <View style={styles.actions}><Button disabled={index === 0} onPress={() => setIndex(index - 1)} variant="secondary">{t("Previous")}</Button><Button disabled={index === examples.length - 1} onPress={() => setIndex(index + 1)}>{t("Next")}</Button></View>
    </View> : <Button onPress={() => setShowExamples(true)} variant="secondary">{t("Try response formats")}</Button>}
    <Button disabled={!rules} onPress={onStart} testID="ccarp-start-timed-exam">{t(showExamples ? "Start timed exam" : "Skip examples and start")}</Button>
  </Screen>;
}
const createStyles = (palette: AppColors) => StyleSheet.create({
  title: { ...typography.heading, color: palette.textPrimary },
  text: { ...typography.body, color: palette.textPrimary },
  stack: { gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm },
});

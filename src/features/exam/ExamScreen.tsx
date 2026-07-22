import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { finalizeCertificationExam, getCertificationExamProjection, navigateCertificationExamTo, saveCertificationExamResponse, startCertificationExam, type CertificationExamProjection } from "../../application/certification";
import { Button, Card, EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.EXAM>;

/** Canonical 50-item Cloud exam runner; navigation and responses are durably persisted through the shared lifecycle. */
export function ExamScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles); const { t } = useAppPreferences();
  const [projection, setProjection] = useState<CertificationExamProjection | null>(null); const [error, setError] = useState<string | null>(null);
  const refresh = async () => setProjection(await getCertificationExamProjection());
  useEffect(() => { let active = true; void (async () => { try { await getCertificationExamProjection().catch(() => startCertificationExam()); if (active) await refresh(); } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Exam is unavailable."); } })(); return () => { active = false; }; }, []);
  if (error) return <Screen><EmptyState title={t("Exam unavailable")} description={t(error)} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (!projection) return <Screen><Text style={styles.loading}>{t("Preparing 50-question exam…")}</Text></Screen>;
  const selected = new Set(projection.response?.selectedOptionIds ?? []); const multiple = projection.question.type === "multiple";
  const select = async (id: string) => { const ids = multiple ? (selected.has(id) ? [...selected].filter((value) => value !== id) : [...selected, id]) : [id]; if (!ids.length) return; try { await saveCertificationExamResponse({ occurrenceId: projection.occurrenceId, response: { kind: "option_selection", selectedOptionIds: ids } }); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Answer could not be saved."); } };
  const go = async (index: number) => { try { await navigateCertificationExamTo(index); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Exam navigation failed."); } };
  const finish = async () => { try { await finalizeCertificationExam(); navigation.replace(ROUTES.RESULT, { sessionId: projection.session.id }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Exam finalization failed."); } };
  return <Screen style={styles.screen}>
    <Text style={styles.progress}>{t("Question")} {projection.ordinal} {t("of")} 50</Text><Text style={styles.domain}>{t(projection.question.domain.replaceAll("_", " "))}</Text>
    <Card style={styles.card}><Text style={styles.question}>{projection.question.question}</Text><View style={styles.options}>{projection.question.options.map((option) => <Pressable key={option.id} accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityState={{ checked: selected.has(option.id) }} onPress={() => void select(option.id)} style={[styles.option, selected.has(option.id) && styles.selected]}><Text style={styles.optionText}>{option.text}</Text></Pressable>)}</View></Card>
    <View style={styles.actions}><Button onPress={() => void go(Math.max(0, projection.ordinal - 2))} disabled={projection.ordinal === 1} variant="secondary">{t("Previous")}</Button><Button onPress={() => void go(Math.min(49, projection.ordinal))} disabled={projection.ordinal === 50} variant="secondary">{t("Next")}</Button></View>
    <Button onPress={() => void finish()}>{t("Finish exam")}</Button>
  </Screen>;
}
const createStyles = (palette: AppColors) => StyleSheet.create({ screen: { gap: spacing.md }, loading: { ...typography.body, color: palette.textSecondary }, progress: { ...typography.small, color: palette.textMuted }, domain: { ...typography.caption, color: palette.primary, textTransform: "uppercase" }, card: { gap: spacing.md }, question: { ...typography.bodyStrong, color: palette.textPrimary }, options: { gap: spacing.sm }, option: { borderColor: palette.border, borderRadius: 12, borderWidth: 1, padding: spacing.md }, selected: { backgroundColor: palette.primarySoft, borderColor: palette.primary }, optionText: { ...typography.body, color: palette.textPrimary }, actions: { flexDirection: "row", gap: spacing.sm } });

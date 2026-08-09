import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Button, Card, EmptyState, LoadingState, ProgressBar, Screen, SectionHeader } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { loadExamSummaries as getAttempts, loadReviewQueueItems as getReviewQueueItems } from "../../application/learningReadModels";
import { setQuestionNeedsReview } from "../../application/certification";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import type { CertificationAnswerViewModel, CertificationExamSummaryViewModel } from "../../tracks/certification";
import { radius, spacing, typography } from "../../theme";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { contentPackagePinsEqual } from "../../domain";


type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ANSWER_REVIEW>;
type ReviewFilter = "all" | "incorrect";
export function AnswerReviewScreen({ route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  const [attempt, setAttempt] = useState<CertificationExamSummaryViewModel | null>(null);
  const [hasLoadedReviewData, setHasLoadedReviewData] = useState(false);
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [updatingReviewIds, setUpdatingReviewIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ReviewFilter>(route.params?.initialFilter ?? "all");
  useFocusEffect(useCallback(() => { let active = true; setReviewError(null); setHasLoadedReviewData(false); void Promise.all([getAttempts(), getReviewQueueItems()]).then(([attempts, reviews]) => { if (!active) return; const selected = attempts.find((item) => item.id === route.params?.attemptId) ?? attempts[0] ?? null; setAttempt(selected); setReviewIds(new Set(reviews.value.filter((entry) => selected?.answers.some((answer) => answer.item.itemId === entry.sourceItem.itemId && answer.item.contentVersion === entry.sourceItem.contentVersion && contentPackagePinsEqual(answer.item.packagePin, entry.sourceItem.packagePin))).map((entry) => entry.sourceItem.itemId))); setHasLoadedReviewData(true); }).catch((error) => { if (active) { setReviewError(describeOperationalFailure(error, "Review data could not be loaded locally.")); setHasLoadedReviewData(true); } }); return () => { active = false; }; }, [route.params?.attemptId]));
  const answers = useMemo(() => !attempt ? [] : filter === "incorrect" ? attempt.answers.filter((answer) => !answer.isCorrect) : attempt.answers, [attempt, filter]);
  async function toggle(answer: CertificationAnswerViewModel) { const marked = !reviewIds.has(answer.questionId); setReviewError(null); setUpdatingReviewIds((current) => new Set(current).add(answer.questionId)); try { if (!attempt) throw new Error("The reviewed Certification session is unavailable."); await setQuestionNeedsReview({ question: answer.questionSnapshot, sourceAttemptId: answer.attemptId, sourceItem: answer.item, sourceSessionId: attempt.id }, marked); setReviewIds((current) => { const next = new Set(current); marked ? next.add(answer.questionId) : next.delete(answer.questionId); return next; }); } catch (error) { setReviewError(describeOperationalFailure(error, "The review mark could not be saved locally.")); } finally { setUpdatingReviewIds((current) => { const next = new Set(current); next.delete(answer.questionId); return next; }); } }
  if (reviewError) return <Screen><EmptyState title={t("Review unavailable")} description={t(reviewError)} /></Screen>;
  if (!hasLoadedReviewData) return <Screen><LoadingState title={t("Loading review…")} /></Screen>;
  return <Screen>{attempt ? <><Card><SectionHeader title={t("Answer Review")} subtitle={`${attempt.correctCount}/${attempt.questionCount} ${t("correct")} · ${attempt.scorePercent}%`} /><ProgressBar progress={attempt.scorePercent / 100} /><View style={styles.filterRow}><FilterChip active={filter === "all"} label={t("All")} onPress={() => setFilter("all")} tone="info" /><FilterChip active={filter === "incorrect"} label={t("Incorrect")} onPress={() => setFilter("incorrect")} tone="danger" /></View></Card>{answers.length ? <View style={styles.answerList}>{answers.map((answer) => <AnswerCard answer={answer} disabled={updatingReviewIds.has(answer.questionId)} key={answer.questionId} needsReview={reviewIds.has(answer.questionId)} onToggle={() => void toggle(answer)} />)}</View> : <Card><EmptyState title={t("No answers in this view")} description={t("Switch filters to review the full attempt.")} /></Card>}</> : <Card><EmptyState title={t("No attempt found")} description={t("Submit an exam before reviewing answers.")} /></Card>}</Screen>;
}
function AnswerCard({ answer, disabled, needsReview, onToggle }: { answer: CertificationAnswerViewModel; disabled: boolean; needsReview: boolean; onToggle: () => void }) {
  const styles = useThemedStyles(createStyles); const { t } = useAppPreferences(); const question = answer.questionSnapshot; return <Card variant={!answer.isAnswered || !answer.isCorrect ? "warning" : "default"}><SectionHeader title={`${t("Question")} ${answer.questionNumber}`} subtitle={t(answer.isAnswered ? answer.isCorrect ? "Correct" : "Incorrect" : "Unanswered")} action={<Badge label={t(needsReview ? "Needs Review" : answer.wasFlagged ? "Flagged" : answer.isCorrect ? "Correct" : "Review")} tone={needsReview ? "warning" : answer.isCorrect ? "success" : "danger"} />} /><Text style={styles.questionText}>{question.question}</Text><DiagnosticBlock label={t("Selected answer")} tone={answer.isCorrect ? "neutral" : "danger"} value={getOptionText(answer, answer.selectedOptionIds) || t("No answer selected.")} /><DiagnosticBlock label={t("Correct answer")} tone="success" value={getOptionText(answer, answer.correctOptionIds)} /><DiagnosticBlock label={t("Explanation")} value={question.feedback.reason} /><Button disabled={disabled} variant={needsReview ? "primary" : "secondary"} onPress={onToggle}>{t(needsReview ? "Marked Needs Review" : "Mark Needs Review")}</Button></Card>; }
function getOptionText(answer: CertificationAnswerViewModel, ids: readonly string[]) { const byId = new Map(answer.questionSnapshot.options.map((option) => [option.id, option.text])); return ids.map((id) => byId.get(id) ?? id).join(", "); }
function DiagnosticBlock({ label, tone = "neutral", value, children }: { label: string; tone?: "neutral" | "success" | "danger"; value?: string; children?: ReactNode }) {
  const styles = useThemedStyles(createStyles); return <View style={[styles.detailBlock, tone === "success" ? styles.successBlock : null, tone === "danger" ? styles.dangerBlock : null]}><Text style={styles.detailLabel}>{label}</Text>{value ? <Text style={styles.detailText}>{value}</Text> : children}</View>; }
function FilterChip({ active, label, onPress, tone }: { active: boolean; label: string; onPress: () => void; tone: "danger" | "info" }) {
  const styles = useThemedStyles(createStyles); return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.filterChip, active ? styles[`${tone}FilterChip`] : null, pressed ? styles.pressed : null]}><Text style={[styles.filterChipText, active ? styles.activeFilterChipText : null]}>{label}</Text></Pressable>; }
const createStyles = (palette: AppColors) => StyleSheet.create({ answerList: { gap: spacing.lg }, filterRow: { flexDirection: "row", gap: spacing.sm }, filterChip: { borderColor: palette.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, infoFilterChip: { backgroundColor: palette.infoSoft, borderColor: palette.info }, dangerFilterChip: { backgroundColor: palette.dangerSoft, borderColor: palette.danger }, filterChipText: { ...typography.caption, color: palette.textSecondary }, activeFilterChipText: { color: palette.textPrimary }, pressed: { opacity: 0.8 }, questionText: { ...typography.bodyStrong, color: palette.textPrimary }, detailBlock: { gap: spacing.xs, padding: spacing.md }, successBlock: { backgroundColor: palette.successSoft }, dangerBlock: { backgroundColor: palette.dangerSoft }, detailLabel: { ...typography.caption, color: palette.textSecondary }, detailText: { ...typography.body, color: palette.textPrimary } });

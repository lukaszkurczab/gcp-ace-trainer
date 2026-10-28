import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
export type StatementReviewRow = Readonly<{ explanation?: string; messages?: readonly Readonly<{ text: string }>[]; dimensionId: string; label: string; selectedValueIds: readonly string[]; correctValueIds: readonly string[]; values: readonly Readonly<{ valueId: string; text: string }>[] }>;
/** User choices and reference answer are separate, including an empty row. */
export function ExamStatementReview({ rows }: Readonly<{ rows: readonly StatementReviewRow[] }>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  return <View style={styles.stack}>{rows.map((row) => {
    const names = (ids: readonly string[]) => ids.map((id) => row.values.find((value) => value.valueId === id)?.text ?? id).join(", ");
    const correct = row.selectedValueIds.length === row.correctValueIds.length && row.selectedValueIds.every((id) => row.correctValueIds.includes(id));
    return <View key={row.dimensionId} style={styles.row}>
      <Text maxFontSizeMultiplier={2} style={styles.text}>{row.label}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.text}>{t("Your answer")}: {row.selectedValueIds.length ? names(row.selectedValueIds) : t("Unanswered")}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.text}>{t("Correct answer")}: {names(row.correctValueIds)}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.text}>{t(correct ? "Correct" : row.selectedValueIds.length ? "Incorrect" : "Unanswered")}</Text>
      {row.explanation ? <Text maxFontSizeMultiplier={2} style={styles.text}>{row.explanation}</Text> : null}
      {row.messages?.filter((message) => message.text !== row.explanation).map((message, index) => <Text key={index} maxFontSizeMultiplier={2} style={styles.text}>{message.text}</Text>)}
    </View>;
  })}</View>;
}
const createStyles = (palette: AppColors) => StyleSheet.create({ stack: { gap: spacing.lg }, row: { gap: spacing.sm }, text: { ...typography.body, color: palette.textPrimary } });

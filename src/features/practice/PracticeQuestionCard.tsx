import { DEFAULT_TRACK_QUESTION_PRESENTATION, isSupportedTrackQuestionPresentation, type TrackQuestionPresentation } from "../../domain/tracks/trackAdmission";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

type PracticeQuestionContent = Readonly<{ constraints?: readonly string[]; itemId: string; prompt: string }>;


export function PracticeQuestionCard({ question, presentation = DEFAULT_TRACK_QUESTION_PRESENTATION }: Readonly<{ question: PracticeQuestionContent; presentation?: TrackQuestionPresentation }>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  if (!isSupportedTrackQuestionPresentation(presentation)) return <Text accessibilityRole="alert" maxFontSizeMultiplier={2}>{t("Practice interaction unavailable")}</Text>;
  const variant = presentation.variant;
  return (
    <View style={styles.questionCard} testID={runtimeSelectors.session.question(question.itemId)}>
      <Text key={`label:${fontScale}`} maxFontSizeMultiplier={2} style={styles.questionLabel}>{t("Question")}</Text>
      <Text key={`prompt:${fontScale}`} maxFontSizeMultiplier={2} style={[styles.prompt, variant === "structuredCertificationPrompt" ? styles.structuredPrompt : null]}>{question.prompt}</Text>
      {presentation.constraints === "show" && question.constraints?.length ? (
        <View
          style={[styles.constraints, variant === "structuredCertificationPrompt" ? styles.structuredConstraints : null]}
          testID={variant === "structuredCertificationPrompt" ? `${runtimeSelectors.session.question(question.itemId)}:constraints` : undefined}
        >
          {variant === "structuredCertificationPrompt" ? <Text accessibilityRole="header" maxFontSizeMultiplier={2} style={styles.constraintsHeading}>{t("Key constraints")}</Text> : null}
          {question.constraints.map((constraint) => <Text key={`${fontScale}:${constraint}`} maxFontSizeMultiplier={2} style={styles.constraint}>• {constraint}</Text>)}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  constraint: { ...typography.small, color: palette.textSecondary },
  constraints: { gap: spacing.xs },
  constraintsHeading: { ...typography.caption, color: palette.textPrimary, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  questionLabel: { ...typography.caption, color: palette.primary, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  prompt: { color: palette.textPrimary, fontSize: 22, fontWeight: "600", letterSpacing: -0.3, lineHeight: 28 },
  questionCard: { gap: spacing.md },
  structuredConstraints: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  structuredPrompt: { fontSize: 20, fontWeight: "500", letterSpacing: -0.2, lineHeight: 28 },
});

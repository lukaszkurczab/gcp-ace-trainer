import { DEFAULT_TRACK_QUESTION_PRESENTATION, isSupportedTrackQuestionPresentation, type TrackQuestionPresentation } from "../../domain/tracks/trackAdmission";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

type PracticeQuestionContent = Readonly<{ itemId: string; prompt: string }>;

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
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  questionLabel: { ...typography.caption, color: palette.primary, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  prompt: { color: palette.textPrimary, fontSize: 22, fontWeight: "600", letterSpacing: -0.3, lineHeight: 28 },
  questionCard: { gap: spacing.md },
  structuredPrompt: { fontSize: 20, fontWeight: "500", letterSpacing: -0.2, lineHeight: 28 },
});

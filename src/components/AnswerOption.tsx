import { Pressable, StyleSheet, Text, View, useWindowDimensions, type AccessibilityState, type AccessibilityValue } from "react-native";

import { useThemedStyles } from "../preferences";
import { radius, spacing, typography } from "../theme";
import type { AppColors } from "../theme";

export type AnswerOptionState = "default" | "selected" | "correct" | "incorrect" | "omitted_correct" | "not_selected";

type AnswerOptionProps = Readonly<{
  accessibilityLabel: string;
  accessibilityRole: "checkbox" | "radio";
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
  disabled?: boolean;
  letter: string;
  onPress: () => void;
  state: AnswerOptionState;
  statusLabel?: string;
  testID?: string;
  text: string;
}>;

/** Canonical Figma Answer Option used by Practice, Simulation, and Review. */
export function AnswerOption({
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  accessibilityValue,
  disabled = false,
  letter,
  onPress,
  state,
  statusLabel,
  testID,
  text,
}: AnswerOptionProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const selected = state === "selected" || state === "correct" || state === "incorrect";
  const correctness = state === "correct" || state === "omitted_correct" ? styles.letterCorrect : state === "incorrect" ? styles.letterIncorrect : state === "selected" ? styles.letterSelected : null;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, checked: accessibilityState?.checked ?? selected, disabled }}
      accessibilityValue={accessibilityValue}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.option, stateStyle(state, styles), pressed && !disabled ? styles.pressed : null, disabled ? styles.locked : null]}
      testID={testID}
    >
      <View style={styles.letterBadge}>
        <Text key={`letter:${fontScale}`} maxFontSizeMultiplier={2} style={[styles.letterText, correctness]}>{letter}</Text>
      </View>
      <View style={styles.answerContent}>
        <Text key={`answer:${fontScale}`} maxFontSizeMultiplier={2} style={styles.text}>{text}</Text>
        {statusLabel ? (
          <View style={[styles.statusBadge, statusStyle(state, styles)]}>
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.statusIcon, statusTextStyle(state, styles)]}>{statusIcon(state)}</Text>
            <Text maxFontSizeMultiplier={2} style={[styles.statusText, statusTextStyle(state, styles)]}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function stateStyle(state: AnswerOptionState, styles: ReturnType<typeof createStyles>) {
  if (state === "correct") return styles.correct;
  if (state === "omitted_correct") return styles.omittedCorrect;
  if (state === "incorrect") return styles.incorrect;
  if (state === "selected") return styles.selected;
  if (state === "not_selected") return styles.notSelected;
  return styles.default;
}

function statusStyle(state: AnswerOptionState, styles: ReturnType<typeof createStyles>) {
  if (state === "correct" || state === "omitted_correct") return styles.statusCorrect;
  if (state === "incorrect") return styles.statusIncorrect;
  if (state === "selected") return styles.statusSelected;
  return styles.statusNeutral;
}

function statusTextStyle(state: AnswerOptionState, styles: ReturnType<typeof createStyles>) {
  if (state === "correct" || state === "omitted_correct") return styles.statusTextCorrect;
  if (state === "incorrect") return styles.statusTextIncorrect;
  if (state === "selected") return styles.statusTextSelected;
  return styles.statusTextNeutral;
}

function statusIcon(state: AnswerOptionState): string {
  if (state === "correct") return "✓";
  if (state === "incorrect") return "×";
  if (state === "omitted_correct") return "!";
  if (state === "selected") return "•";
  return "–";
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  answerContent: { alignItems: "flex-start", flex: 1, gap: spacing.sm },
  correct: { backgroundColor: palette.successSoft, borderColor: palette.success, borderWidth: 2 },
  default: { backgroundColor: palette.elevatedSurface, borderColor: palette.border },
  incorrect: { backgroundColor: palette.dangerSoft, borderColor: palette.danger, borderWidth: 2 },
  letterBadge: { alignItems: "center", backgroundColor: palette.border, borderRadius: radius.sm, justifyContent: "center", minHeight: 24, minWidth: 24, padding: spacing.xs },
  letterCorrect: { color: palette.success },
  letterIncorrect: { color: palette.danger },
  letterSelected: { color: palette.primary },
  letterText: { color: palette.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  locked: { opacity: 0.9 },
  notSelected: { backgroundColor: palette.elevatedSurface, borderColor: palette.borderStrong },
  omittedCorrect: { backgroundColor: palette.surface, borderColor: palette.success, borderStyle: "dashed", borderWidth: 2 },
  option: { alignItems: "center", borderRadius: radius.lg, borderWidth: 1.5, flexDirection: "row", gap: 14, minHeight: 54, padding: spacing.lg },
  pressed: { opacity: 0.82 },
  selected: { backgroundColor: palette.surface, borderColor: palette.primary },
  text: { ...typography.body, color: palette.textPrimary, flex: 1 },
  statusBadge: { alignItems: "center", alignSelf: "flex-start", borderRadius: radius.sm, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, maxWidth: "100%", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  statusCorrect: { backgroundColor: palette.successSoft, borderColor: palette.success },
  statusIcon: { fontSize: 12, fontWeight: "800", lineHeight: 16 },
  statusIncorrect: { backgroundColor: palette.dangerSoft, borderColor: palette.danger },
  statusNeutral: { backgroundColor: palette.elevatedSurface, borderColor: palette.borderStrong },
  statusSelected: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  statusText: { ...typography.small, flexShrink: 1, fontWeight: "700" },
  statusTextCorrect: { color: palette.success },
  statusTextIncorrect: { color: palette.danger },
  statusTextNeutral: { color: palette.textSecondary },
  statusTextSelected: { color: palette.primary },
});

import { Pressable, StyleSheet, Text, View, type AccessibilityState, type AccessibilityValue } from "react-native";

import { useThemedStyles } from "../preferences";
import { radius, spacing, typography } from "../theme";
import type { AppColors } from "../theme";

export type AnswerOptionState = "default" | "selected" | "correct" | "incorrect" | "omitted_correct";

type AnswerOptionProps = Readonly<{
  accessibilityLabel: string;
  accessibilityRole: "checkbox" | "radio";
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
  disabled?: boolean;
  letter: string;
  onPress: () => void;
  state: AnswerOptionState;
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
  testID,
  text,
}: AnswerOptionProps) {
  const styles = useThemedStyles(createStyles);
  const selected = state !== "default";
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
        <Text maxFontSizeMultiplier={2} style={[styles.letterText, correctness]}>{letter}</Text>
      </View>
      <Text maxFontSizeMultiplier={2} style={[styles.text, state === "correct" || state === "omitted_correct" || state === "incorrect" ? styles.feedbackText : null]}>{text}</Text>
    </Pressable>
  );
}

function stateStyle(state: AnswerOptionState, styles: ReturnType<typeof createStyles>) {
  if (state === "correct" || state === "omitted_correct") return styles.correct;
  if (state === "incorrect") return styles.incorrect;
  if (state === "selected") return styles.selected;
  return styles.default;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  correct: { backgroundColor: palette.success, borderColor: palette.success },
  default: { backgroundColor: palette.elevatedSurface, borderColor: palette.border },
  feedbackText: { color: palette.onPrimary },
  incorrect: { backgroundColor: palette.danger, borderColor: palette.danger },
  letterBadge: { alignItems: "center", backgroundColor: palette.border, borderRadius: radius.sm, justifyContent: "center", minHeight: 24, minWidth: 24, padding: spacing.xs },
  letterCorrect: { color: palette.success },
  letterIncorrect: { color: palette.danger },
  letterSelected: { color: palette.primary },
  letterText: { color: palette.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  locked: { opacity: 0.9 },
  option: { alignItems: "center", borderRadius: radius.lg, borderWidth: 1.5, flexDirection: "row", gap: 14, minHeight: 54, padding: spacing.lg },
  pressed: { opacity: 0.82 },
  selected: { backgroundColor: palette.surface, borderColor: palette.primary },
  text: { ...typography.body, color: palette.textPrimary, flex: 1 },
});

import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type AccessibilityState, type AccessibilityValue, type StyleProp, type TextStyle } from "react-native";

import { useThemedStyles } from "../preferences";
import { radius, spacing, typography } from "../theme";
import type { AppColors } from "../theme";
import { createOneTimeTextMinimumHeight, textMeasurementKey } from "./textLayoutHeight";

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
  const { fontScale, scale: physicalScale, width: windowWidth } = useWindowDimensions();
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
      <OptionTextLayout key={JSON.stringify([textMeasurementKey(text, windowWidth, fontScale, physicalScale), letter, state])} physicalScale={physicalScale} style={styles.text} text={text} />
    </Pressable>
  );
}

function OptionTextLayout({ physicalScale, style, text }: Readonly<{ physicalScale: number; style: StyleProp<TextStyle>; text: string }>) {
  const [minimumHeight, setMinimumHeight] = useState<number>();
  const [measureOnce] = useState(() => createOneTimeTextMinimumHeight(physicalScale));
  return <Text
    maxFontSizeMultiplier={2}
    onLayout={(event) => {
      const nextMinimumHeight = measureOnce(event.nativeEvent.layout.height);
      if (nextMinimumHeight !== undefined) setMinimumHeight(nextMinimumHeight);
    }}
    style={minimumHeight === undefined ? style : [style, { minHeight: minimumHeight }]}
  >{text}</Text>;
}

function stateStyle(state: AnswerOptionState, styles: ReturnType<typeof createStyles>) {
  if (state === "correct") return styles.correct;
  if (state === "omitted_correct") return styles.omittedCorrect;
  if (state === "incorrect") return styles.incorrect;
  if (state === "selected") return styles.selected;
  if (state === "not_selected") return styles.notSelected;
  return styles.default;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
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
});

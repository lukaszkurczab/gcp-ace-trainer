import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../theme";
import {
  complexityValueAccessibilityLabel,
  orderingMoveAccessibilityLabel,
} from "../algorithms/session/sessionAccessibility";
import { practiceOptionCorrectnessValue, type PracticeResponseControl } from "./practiceSessionPresentation";

type PracticeResponseControlsProps = Readonly<{
  control: PracticeResponseControl;
  editable: boolean;
  onChoicePress: (optionId: string) => void;
  onComplexityValuePress: (dimensionId: string, value: string) => void;
  onOrderingMove: (elementId: string, direction: "up" | "down") => void;
}>;

/** Controlled response renderer: ephemeral response values enter through props and commands only. */
export function PracticeResponseControls({
  control,
  editable,
  onChoicePress,
  onComplexityValuePress,
  onOrderingMove,
}: PracticeResponseControlsProps) {
  if (control.kind === "choice") {
    return (
      <View style={styles.stack}>
        {control.options.map((option) => (
          <ChoiceOption
            editable={editable}
            key={option.id}
            onPress={() => onChoicePress(option.id)}
            option={option}
            role={control.selectionMode === "single" ? "radio" : "checkbox"}
          />
        ))}
      </View>
    );
  }

  if (control.kind === "ordering") {
    return (
      <View style={styles.stack}>
        {control.elements.map((element, index) => (
          <View key={element.id} style={styles.orderRow}>
            <Text style={styles.orderIndex}>{index + 1}</Text>
            <Text style={styles.optionText}>{element.text}</Text>
            {editable ? (
              <View style={styles.orderActions}>
                <OrderingMove disabled={index === 0} direction="up" elementLabel={element.text} index={index} onPress={() => onOrderingMove(element.id, "up")} total={control.elements.length} />
                <OrderingMove disabled={index === control.elements.length - 1} direction="down" elementLabel={element.text} index={index} onPress={() => onOrderingMove(element.id, "down")} total={control.elements.length} />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {control.dimensions.map((dimension) => (
        <View key={dimension.id} style={styles.dimension}>
          <Text style={styles.dimensionTitle}>{humanizeDimension(dimension.id)}</Text>
          <View style={styles.valueGrid}>
            {dimension.values.map((value) => {
              const selected = dimension.selectedValue === value;
              return (
                <Pressable
                  accessibilityLabel={complexityValueAccessibilityLabel(humanizeDimension(dimension.id), value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: !editable }}
                  disabled={!editable}
                  key={value}
                  onPress={() => onComplexityValuePress(dimension.id, value)}
                  style={({ pressed }) => [styles.valueOption, selected ? styles.valueOptionSelected : null, pressed && editable ? styles.pressed : null, !editable ? styles.locked : null]}
                >
                  <Text style={[styles.valueText, selected ? styles.selectedText : null]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function ChoiceOption({ editable, onPress, option, role }: Readonly<{
  editable: boolean;
  onPress: () => void;
  option: Readonly<{ id: string; state: "neutral" | "selected" | "correct" | "incorrect" | "omitted_correct"; text: string }>;
  role: "checkbox" | "radio";
}>) {
  const selected = option.state === "selected" || option.state === "correct" || option.state === "incorrect";
  const correctness = practiceOptionCorrectnessValue(option.state);

  return (
    <Pressable
      accessibilityLabel={option.text}
      accessibilityRole={role}
      accessibilityState={{ checked: selected, disabled: !editable }}
      accessibilityValue={correctness ? { text: correctness } : undefined}
      disabled={!editable}
      onPress={onPress}
      style={({ pressed }) => [styles.choiceOption, choiceStateStyle(option.state), pressed && editable ? styles.pressed : null, !editable ? styles.locked : null]}
    >
      <View style={[styles.marker, selected ? styles.markerSelected : null, option.state === "correct" || option.state === "omitted_correct" ? styles.markerCorrect : null, option.state === "incorrect" ? styles.markerIncorrect : null]} />
      <Text style={styles.optionText}>{option.text}</Text>
    </Pressable>
  );
}

function OrderingMove({ direction, disabled, elementLabel, index, onPress, total }: Readonly<{
  direction: "up" | "down";
  disabled: boolean;
  elementLabel: string;
  index: number;
  onPress: () => void;
  total: number;
}>) {
  return (
    <Pressable
      accessibilityLabel={orderingMoveAccessibilityLabel(elementLabel, index, total, direction)}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.moveButton, disabled ? styles.moveButtonDisabled : null]}
    >
      <Text style={styles.moveText}>{direction === "up" ? "↑" : "↓"}</Text>
    </Pressable>
  );
}

function choiceStateStyle(state: "neutral" | "selected" | "correct" | "incorrect" | "omitted_correct") {
  if (state === "correct" || state === "omitted_correct") return styles.choiceCorrect;
  if (state === "incorrect") return styles.choiceIncorrect;
  if (state === "selected") return styles.choiceSelected;
  return undefined;
}

function humanizeDimension(value: string): string {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  choiceCorrect: { backgroundColor: colors.dark.successSoft, borderColor: colors.dark.success, borderWidth: 2 },
  choiceIncorrect: { backgroundColor: colors.dark.dangerSoft, borderColor: colors.dark.danger, borderWidth: 2 },
  choiceOption: { alignItems: "flex-start", backgroundColor: colors.dark.surface, borderColor: colors.dark.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: spacing.md, minHeight: 64, padding: spacing.md },
  choiceSelected: { backgroundColor: colors.dark.primarySoft, borderColor: colors.dark.primary, borderWidth: 2 },
  dimension: { gap: spacing.sm },
  dimensionTitle: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  locked: { opacity: 0.9 },
  marker: { borderColor: colors.dark.borderStrong, borderRadius: radius.pill, borderWidth: 2, height: 20, marginTop: spacing.xxs, width: 20 },
  markerCorrect: { backgroundColor: colors.dark.success, borderColor: colors.dark.success },
  markerIncorrect: { backgroundColor: colors.dark.danger, borderColor: colors.dark.danger },
  markerSelected: { backgroundColor: colors.dark.primary, borderColor: colors.dark.primary },
  moveButton: { alignItems: "center", borderColor: colors.dark.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: "center", minHeight: 48, minWidth: 48 },
  moveButtonDisabled: { opacity: 0.4 },
  moveText: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  optionText: { ...typography.body, color: colors.dark.textPrimary, flex: 1 },
  orderActions: { flexDirection: "row", flexShrink: 0, gap: spacing.xs },
  orderIndex: { ...typography.bodyStrong, color: colors.dark.accentPurple, minWidth: 20 },
  orderRow: { alignItems: "flex-start", backgroundColor: colors.dark.surface, borderColor: colors.dark.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, minHeight: 64, padding: spacing.md },
  pressed: { opacity: 0.82 },
  selectedText: { color: colors.dark.textPrimary },
  stack: { gap: spacing.md },
  valueGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  valueOption: { backgroundColor: colors.dark.surface, borderColor: colors.dark.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: "center", minHeight: 48, minWidth: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  valueOptionSelected: { backgroundColor: colors.dark.primarySoft, borderColor: colors.dark.primary, borderWidth: 2 },
  valueText: { ...typography.small, color: colors.dark.textSecondary },
});

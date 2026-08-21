import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnswerOption, type AnswerOptionState } from "../../components";
import { radius, spacing, typography } from "../../theme";
import {
  complexityValueAccessibilityLabel,
  orderingMoveAccessibilityLabel,
} from "../coding-interview/session/sessionAccessibility";
import { practiceOptionCorrectnessValue, type PracticeResponseControl } from "./practiceSessionPresentation";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";


type PracticeResponseControlsProps = Readonly<{
  control: PracticeResponseControl;
  editable: boolean;
  itemId?: string;
  onChoicePress: (optionId: string) => void;
  onComplexityValuePress: (dimensionId: string, value: string) => void;
  onOrderingMove: (elementId: string, direction: "up" | "down") => void;
}>;

/** Controlled response renderer: ephemeral response values enter through props and commands only. */
export function PracticeResponseControls({
  control,
  editable,
  itemId,
  onChoicePress,
  onComplexityValuePress,
  onOrderingMove,
}: PracticeResponseControlsProps) {
  const styles = useThemedStyles(createStyles);
  if (control.kind === "choice") {
    return (
      <View style={styles.stack}>
        {control.options.map((option, index) => (
          <ChoiceOption
            editable={editable}
            itemId={itemId}
            index={index}
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
          <View key={element.id} style={styles.orderRow} testID={itemId ? runtimeSelectors.session.option(itemId, element.id) : undefined}>
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
          <Text style={styles.dimensionTitle}>{dimension.label ?? humanizeDimension(dimension.id)}</Text>
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
                  testID={itemId ? runtimeSelectors.session.complexityValue(itemId, dimension.id, value) : undefined}
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

function ChoiceOption({ editable, index, itemId, onPress, option, role }: Readonly<{
  editable: boolean;
  index: number;
  itemId?: string;
  onPress: () => void;
  option: Readonly<{ id: string; state: "neutral" | "selected" | "correct" | "incorrect" | "omitted_correct"; text: string }>;
  role: "checkbox" | "radio";
}>) {
  const selected = option.state === "selected" || option.state === "correct" || option.state === "incorrect" || option.state === "omitted_correct";
  const correctness = practiceOptionCorrectnessValue(option.state);

  return <AnswerOption
    accessibilityLabel={option.text}
    accessibilityRole={role}
    accessibilityState={{ checked: selected, disabled: !editable }}
    accessibilityValue={correctness ? { text: correctness } : undefined}
    disabled={!editable}
    letter={String.fromCharCode(65 + index)}
    onPress={onPress}
    state={option.state === "neutral" ? "default" : option.state as AnswerOptionState}
    testID={itemId ? runtimeSelectors.session.option(itemId, option.id) : undefined}
    text={option.text}
  />;
}

function OrderingMove({ direction, disabled, elementLabel, index, onPress, total }: Readonly<{
  direction: "up" | "down";
  disabled: boolean;
  elementLabel: string;
  index: number;
  onPress: () => void;
  total: number;
}>) {
  const styles = useThemedStyles(createStyles);
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

function humanizeDimension(value: string): string {
  return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  dimension: { gap: spacing.sm },
  dimensionTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  locked: { opacity: 0.9 },
  moveButton: { alignItems: "center", borderColor: palette.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: "center", minHeight: 48, minWidth: 48 },
  moveButtonDisabled: { opacity: 0.4 },
  moveText: { ...typography.bodyStrong, color: palette.textPrimary },
  optionText: { ...typography.body, color: palette.textPrimary, flex: 1 },
  orderActions: { flexDirection: "row", flexShrink: 0, gap: spacing.xs },
  orderIndex: { ...typography.bodyStrong, color: palette.accentPurple, minWidth: 20 },
  orderRow: { alignItems: "flex-start", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, minHeight: 64, padding: spacing.md },
  pressed: { opacity: 0.82 },
  selectedText: { color: palette.textPrimary },
  stack: { gap: spacing.md },
  valueGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  valueOption: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: "center", minHeight: 48, minWidth: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  valueOptionSelected: { backgroundColor: palette.primarySoft, borderColor: palette.primary, borderWidth: 2 },
  valueText: { ...typography.small, color: palette.textSecondary },
});

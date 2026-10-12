import { createElement } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnswerOption, type AnswerOptionState } from "../../components";
import { radius, spacing, typography } from "../../theme";
import {
  complexityValueAccessibilityLabel,
  orderingMoveAccessibilityLabel,
} from "../coding-interview/session/sessionAccessibility";
import { practiceOptionCorrectnessValue, practiceOptionIsSelected, type PracticeChoiceControl, type PracticeComplexityControl, type PracticeOrderingControl, type PracticeResponseControl } from "./practiceSessionPresentation";
import { useThemedStyles } from "../../preferences";
import type { AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { PracticeDimensionValueButton } from "./PracticeDimensionValueButton";
import { createPracticeResponseRendererRegistry, PracticeResponseRendererHost, type PracticeResponseRenderer, type PracticeResponseRendererProps } from "./practiceResponseRendererRegistry";


type PracticeResponseControlsProps = PracticeResponseRendererProps & Readonly<{
  rendererBindings?: ReadonlyMap<string, PracticeResponseRenderer>;
}>;

export const builtinPracticeResponseRenderers = createPracticeResponseRendererRegistry([
  ["choice_single", renderChoice],
  ["choice_multiple", renderChoice],
  ["ordering", renderOrdering],
  ["complexity", renderDimensions],
  ["decision_matrix", renderDimensions],
]);

/** Controlled response renderer: ephemeral response values enter through props and commands only. */
export function PracticeResponseControls({
  control,
  editable,
  itemId,
  onChoicePress,
  onComplexityValuePress,
  onOrderingMove,
  interactionResponse,
  onInteractionResponseChange,
  rendererBindings,
}: PracticeResponseControlsProps) {
  return createElement(PracticeResponseRendererHost, { control, editable, itemId, interactionResponse, onChoicePress, onComplexityValuePress, onOrderingMove, onInteractionResponseChange, bindings: rendererBindings ?? builtinPracticeResponseRenderers });
}

function renderChoice(props: PracticeResponseRendererProps) {
  const { control, editable, itemId, onChoicePress } = props;
  const model = control.model as PracticeChoiceControl;
  if (control.interactionType !== "choice_single" && control.interactionType !== "choice_multiple" || !model || model.kind !== "choice") throw new Error("Choice response control does not match its interaction binding.");
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.stack}>
      {model.options.map((option, index) => (
        <ChoiceOption
          editable={editable}
          itemId={itemId}
          index={index}
          key={option.id}
          onPress={() => onChoicePress(option.id)}
          option={option}
          role={model.selectionMode === "single" ? "radio" : "checkbox"}
        />
      ))}
    </View>
  );
}

function renderOrdering(props: PracticeResponseRendererProps) {
  const { control, editable, itemId, onOrderingMove } = props;
  const model = control.model as PracticeOrderingControl;
  if (control.interactionType !== "ordering" || !model || model.kind !== "ordering") throw new Error("Ordering response control does not match its interaction binding.");
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.stack}>
      {model.elements.map((element, index) => (
        <View key={element.id} style={styles.orderRow} testID={itemId ? runtimeSelectors.session.option(itemId, element.id) : undefined}>
          <Text maxFontSizeMultiplier={2} style={styles.orderIndex}>{index + 1}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.optionText}>{element.text}</Text>
          {editable ? (
            <View style={styles.orderActions}>
              <OrderingMove disabled={index === 0} direction="up" elementLabel={element.text} index={index} onPress={() => onOrderingMove(element.id, "up")} total={model.elements.length} />
              <OrderingMove disabled={index === model.elements.length - 1} direction="down" elementLabel={element.text} index={index} onPress={() => onOrderingMove(element.id, "down")} total={model.elements.length} />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function renderDimensions(props: PracticeResponseRendererProps) {
  const { control, editable, itemId, onComplexityValuePress } = props;
  const model = control.model as PracticeComplexityControl;
  if (control.interactionType !== "complexity" && control.interactionType !== "decision_matrix" || !model || model.kind !== "complexity") throw new Error("Value response control does not match its interaction binding.");
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.stack}>
      {model.dimensions.map((dimension) => (
        <View key={dimension.id} style={styles.dimension}>
          <Text maxFontSizeMultiplier={2} style={styles.dimensionTitle}>{dimension.label ?? humanizeDimension(dimension.id)}</Text>
          <View style={styles.valueGrid}>
            {dimension.values.map((value) => {
              const selected = dimension.selectedValues?.includes(value.id) ?? false;
              return (
                <PracticeDimensionValueButton
                  PressableComponent={Pressable}
                  TextComponent={Text}
                  accessibilityLabel={complexityValueAccessibilityLabel(humanizeDimension(dimension.id), value.text)}
                  checked={selected}
                  editable={editable}
                  key={value.id}
                  onPress={() => onComplexityValuePress(dimension.id, value.id)}
                  style={({ pressed }: { pressed: boolean }) => [styles.valueOption, selected ? styles.valueOptionSelected : null, pressed && editable ? styles.pressed : null, !editable ? styles.locked : null]}
                  text={value.text}
                  testID={itemId ? runtimeSelectors.session.complexityValue(itemId, dimension.id, value.id) : undefined}
                  textStyle={[styles.valueText, selected ? styles.selectedText : null]}
                />
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
  option: Readonly<{ id: string; state: "neutral" | "selected" | "correct" | "incorrect" | "omitted_correct" | "not_selected"; text: string }>;
  role: "checkbox" | "radio";
}>) {
  const selected = practiceOptionIsSelected(option.state);
  const { t } = useTranslation("common");
  const correctness = practiceOptionCorrectnessValue(option.state);

  return <AnswerOption
    accessibilityLabel={correctness ? `${option.text}. ${t(correctness)}` : option.text}
    accessibilityRole={role}
    accessibilityState={{ checked: selected, disabled: !editable }}
    accessibilityValue={correctness ? { text: t(correctness) } : undefined}
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
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityLabel={orderingMoveAccessibilityLabel(elementLabel, index, total, direction, t)}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.moveButton, disabled ? styles.moveButtonDisabled : null]}
    >
      <Text maxFontSizeMultiplier={2} style={styles.moveText}>{direction === "up" ? "↑" : "↓"}</Text>
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

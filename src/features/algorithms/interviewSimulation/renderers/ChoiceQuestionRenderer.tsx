import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../../../theme";
import type { SimulationChoiceOption } from "../model";

type ChoiceQuestionRendererProps = {
  disabled?: boolean;
  multiple?: boolean;
  onChange: (optionId: string) => void;
  options: readonly SimulationChoiceOption[];
  selectedOptionIds: readonly string[];
};

export function ChoiceQuestionRenderer({
  disabled = false,
  multiple = false,
  onChange,
  options,
  selectedOptionIds,
}: ChoiceQuestionRendererProps) {
  const groupLabel = multiple ? "Select all answers that apply" : "Select one answer";

  return (
    <View accessibilityLabel={groupLabel} accessibilityRole={multiple ? "none" : "radiogroup"} style={styles.list}>
      {options.map((option) => {
        const isSelected = selectedOptionIds.includes(option.id);
        const accessibilityLabel = `${option.label}. ${option.text}. ${isSelected ? "Selected" : "Not selected"}.`;

        return (
          <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={multiple ? "checkbox" : "radio"}
            accessibilityState={{ checked: isSelected, disabled, selected: isSelected }}
            disabled={disabled}
            key={option.id}
            onPress={() => onChange(option.id)}
            style={({ pressed }) => [styles.option, isSelected ? styles.selected : null, disabled ? styles.disabled : null, pressed && !disabled ? styles.pressed : null]}
          >
            <View style={[multiple ? styles.checkbox : styles.radio, isSelected ? styles.selectedMarker : null]}>
              {isSelected ? <View style={multiple ? styles.checkboxFill : styles.radioFill} /> : null}
            </View>
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Text style={styles.optionText}>{option.text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  option: { alignItems: "center", backgroundColor: colors.dark.surface, borderColor: colors.dark.border, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selected: { backgroundColor: colors.dark.primarySoft, borderColor: colors.dark.primary },
  disabled: { opacity: 0.58 },
  pressed: { opacity: 0.8 },
  radio: { alignItems: "center", borderColor: colors.dark.textMuted, borderRadius: radius.pill, borderWidth: 1, height: 18, justifyContent: "center", width: 18 },
  checkbox: { alignItems: "center", borderColor: colors.dark.textMuted, borderRadius: radius.xs, borderWidth: 1, height: 18, justifyContent: "center", width: 18 },
  selectedMarker: { borderColor: colors.dark.primary },
  radioFill: { backgroundColor: colors.dark.primary, borderRadius: radius.pill, height: 10, width: 10 },
  checkboxFill: { backgroundColor: colors.dark.primary, borderRadius: 2, height: 10, width: 10 },
  optionLabel: { ...typography.caption, color: colors.dark.textMuted, width: 16 },
  optionText: { ...typography.small, color: colors.dark.textPrimary, flex: 1 },
});

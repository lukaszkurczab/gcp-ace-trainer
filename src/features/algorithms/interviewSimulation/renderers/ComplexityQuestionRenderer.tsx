import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../../../theme";
import type { SimulationComplexityDimension } from "../model";

type ComplexityQuestionRendererProps = {
  dimensions: readonly SimulationComplexityDimension[];
  disabled?: boolean;
  onChange: (dimensionId: "time" | "space", value: string) => void;
  selectedValues: Readonly<Partial<Record<"time" | "space", string>>>;
};

export function ComplexityQuestionRenderer({
  dimensions,
  disabled = false,
  onChange,
  selectedValues,
}: ComplexityQuestionRendererProps) {
  return (
    <View style={styles.list}>
      {dimensions.map((dimension) => (
        <View accessibilityLabel={`${dimension.label} complexity`} accessibilityRole="radiogroup" key={dimension.id} style={styles.dimension}>
          <Text accessibilityRole="header" style={styles.dimensionLabel}>{dimension.label} complexity</Text>
          <View style={styles.optionList}>
            {dimension.options.map((option) => {
              const isSelected = selectedValues[dimension.id] === option;

              return (
                <Pressable
                  accessibilityLabel={`${dimension.label} complexity: ${option}. ${isSelected ? "Selected" : "Not selected"}.`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected, disabled, selected: isSelected }}
                  disabled={disabled}
                  key={option}
                  onPress={() => onChange(dimension.id, option)}
                  style={({ pressed }) => [styles.option, isSelected ? styles.selected : null, disabled ? styles.disabled : null, pressed && !disabled ? styles.pressed : null]}
                >
                  <View style={[styles.radio, isSelected ? styles.selectedRadio : null]}>
                    {isSelected ? <View style={styles.radioFill} /> : null}
                  </View>
                  <Text style={styles.optionLabel}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  dimension: { gap: spacing.sm },
  dimensionLabel: { ...typography.bodyStrong, color: colors.dark.textPrimary },
  optionList: { gap: spacing.sm },
  option: { alignItems: "center", backgroundColor: colors.dark.surface, borderColor: colors.dark.border, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md },
  selected: { backgroundColor: colors.dark.primarySoft, borderColor: colors.dark.primary },
  radio: { alignItems: "center", borderColor: colors.dark.textMuted, borderRadius: radius.pill, borderWidth: 1, height: 18, justifyContent: "center", width: 18 },
  selectedRadio: { borderColor: colors.dark.primary },
  radioFill: { backgroundColor: colors.dark.primary, borderRadius: radius.pill, height: 10, width: 10 },
  optionLabel: { ...typography.small, color: colors.dark.textPrimary, flex: 1 },
  disabled: { opacity: 0.58 },
  pressed: { opacity: 0.8 },
});

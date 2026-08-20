import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ChoiceRow, Screen } from "../../components";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";

type PreferenceOption = Readonly<{
  detail: string;
  label: string;
  value: string;
}>;

type PreferenceSelectionScreenProps = Readonly<{
  currentValue: string;
  intro: string;
  onSelect: (value: string) => Promise<void>;
  options: readonly PreferenceOption[];
  sectionTitle: string;
}>;

export function PreferenceSelectionScreen({
  currentValue,
  intro,
  onSelect,
  options,
  sectionTitle,
}: PreferenceSelectionScreenProps) {
  const styles = useThemedStyles(createStyles);
  const [savingValue, setSavingValue] = useState<string | null>(null);

  async function select(value: string) {
    if (value === currentValue || savingValue !== null) return;
    setSavingValue(value);
    try {
      await onSelect(value);
    } finally {
      setSavingValue(null);
    }
  }

  return (
    <Screen>
      <Text style={styles.intro}>{intro}</Text>
      <View style={styles.choiceGroup} accessibilityRole="radiogroup" accessibilityLabel={sectionTitle}>
        {options.map((option) => {
          const selected = option.value === currentValue;
          return (
            <ChoiceRow
              detail={option.detail}
              key={option.value}
              onPress={() => { void select(option.value); }}
              selected={selected}
              testID={`preference-option-${option.value}`}
              title={option.label}
            />
          );
        })}
      </View>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  intro: { ...typography.small, color: palette.textSecondary },
  choiceGroup: { gap: spacing.sm },
});

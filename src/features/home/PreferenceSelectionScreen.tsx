import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ChoiceRow, Screen, ScreenHeader } from "../../components";
import { useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";

type PreferenceOption = Readonly<{
  appearancePreview?: "dark" | "light" | "system";
  detail: string;
  label: string;
  value: string;
}>;

type PreferenceSelectionScreenProps = Readonly<{
  currentValue: string;
  header?: Readonly<{ context: string; onBack: () => void; title: string }>;
  intro: string;
  onSelect: (value: string) => Promise<void>;
  options: readonly PreferenceOption[];
  sectionTitle: string;
}>;

export function PreferenceSelectionScreen({
  currentValue,
  header,
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
    <Screen edges={header ? ["top", "bottom"] : undefined}>
      {header ? (
        <ScreenHeader
          backAction={{ onPress: header.onBack }}
          context={header.context}
          contextTone="primary"
          description={intro}
          title={header.title}
        />
      ) : <Text style={styles.intro}>{intro}</Text>}
      <View style={styles.choiceGroup} accessibilityRole="radiogroup" accessibilityLabel={sectionTitle}>
        {options.map((option) => {
          const selected = option.value === currentValue;
          return (
            <ChoiceRow
              appearancePreview={option.appearancePreview}
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

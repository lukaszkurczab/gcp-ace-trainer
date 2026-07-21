import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ListRow, Screen, SettingsGroup } from "../../components";
import { useAppPreferences, useThemedStyles } from "../../preferences";
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
  const { locale } = useAppPreferences();
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

  const currentLabel = locale === "pl" ? "Wybrane" : "Current";

  return (
    <Screen>
      <Text style={styles.intro}>{intro}</Text>
      <SettingsGroup title={sectionTitle}>
        {options.map((option) => {
          const selected = option.value === currentValue;
          return (
            <ListRow
              detail={option.detail}
              key={option.value}
              onPress={() => { void select(option.value); }}
              title={option.label}
              trailing={selected ? <View style={styles.selected}><Text style={styles.selectedLabel}>{currentLabel}</Text></View> : undefined}
              variant="grouped"
            />
          );
        })}
      </SettingsGroup>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  intro: { ...typography.small, color: palette.textSecondary },
  selected: { backgroundColor: palette.primarySoft, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  selectedLabel: { ...typography.caption, color: palette.primary },
});

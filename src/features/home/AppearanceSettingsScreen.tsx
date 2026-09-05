import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences } from "../../preferences";
import type { AppearancePreference } from "../../application/appPreferences";
import { ChoiceRow, InfoBlock, Screen, ScreenHeader } from "../../components";
import { spacing } from "../../theme";

type AppearanceSettingsScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.APPEARANCE_SETTINGS>;

const options: readonly { detailKey: string; labelKey: string; value: AppearancePreference }[] = [
  { detailKey: "systemDetail", labelKey: "system", value: "system" },
  { detailKey: "lightDetail", labelKey: "light", value: "light" },
  { detailKey: "darkDetail", labelKey: "dark", value: "dark" },
];

export function AppearanceSettingsScreen({ navigation }: AppearanceSettingsScreenProps) {
  const preferences = useAppPreferences();
  const { t } = useTranslation("appearance");
  const [savingValue, setSavingValue] = useState<AppearancePreference | null>(null);
  const [saveError, setSaveError] = useState(false);
  const savingRef = useRef<AppearancePreference | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function select(value: AppearancePreference): Promise<void> {
    if (value === preferences.appearance || savingRef.current !== null) return;
    savingRef.current = value;
    if (mountedRef.current) {
      setSavingValue(value);
      setSaveError(false);
    }
    try {
      await preferences.setAppearance(value);
    } catch {
      if (mountedRef.current) setSaveError(true);
    } finally {
      savingRef.current = null;
      if (mountedRef.current) setSavingValue(null);
    }
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        backAction={{ onPress: () => navigation.goBack() }}
        context={t("settings")}
        contextTone="primary"
        description={t("intro")}
        title={t("appearance")}
      />
      {saveError ? <InfoBlock accessibilityAlert body={t("saveErrorDetail")} title={t("saveErrorTitle")} testID="appearance-save-error" tone="warning" /> : null}
      <View accessibilityLabel={t("options")} accessibilityRole="radiogroup" style={styles.choiceGroup}>
        {options.map((option) => (
          <ChoiceRow
            appearancePreview={option.value}
            detail={t(option.detailKey)}
            disabled={savingValue !== null}
            key={option.value}
            loading={savingValue === option.value}
            onPress={() => { void select(option.value); }}
            selected={preferences.appearance === option.value}
            testID={`preference-option-${option.value}`}
            title={t(option.labelKey)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  choiceGroup: {
    gap: spacing.sm,
  },
});

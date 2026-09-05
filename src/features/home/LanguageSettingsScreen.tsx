import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ChoiceRow, InfoBlock, Screen, ScreenHeader } from "../../components";
import type { LanguagePreference } from "../../application/appPreferences";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences } from "../../preferences";
import { spacing } from "../../theme";
import { LANGUAGE_SETTINGS_OPTIONS } from "./languageSettingsModel";

type LanguageSettingsScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.LANGUAGE_SETTINGS>;

export function LanguageSettingsScreen({ navigation }: LanguageSettingsScreenProps) {
  const preferences = useAppPreferences();
  const { t } = useTranslation("settings");
  const [savingValue, setSavingValue] = useState<LanguagePreference | null>(null);
  const [saveError, setSaveError] = useState(false);
  const savingRef = useRef<LanguagePreference | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function select(value: LanguagePreference): Promise<void> {
    if (value === preferences.language || savingRef.current !== null) return;
    savingRef.current = value;
    if (mountedRef.current) {
      setSavingValue(value);
      setSaveError(false);
    }
    try {
      await preferences.setLanguage(value);
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
        context={t("appSettings")}
        contextTone="primary"
        description={t("languageIntro")}
        title={t("language")}
      />
      {saveError ? <InfoBlock accessibilityAlert body={t("languageSaveErrorDetail")} title={t("languageSaveErrorTitle")} testID="language-save-error" tone="warning" /> : null}
      <View accessibilityLabel={t("languageOptions")} accessibilityRole="radiogroup" style={styles.choiceGroup}>
        {LANGUAGE_SETTINGS_OPTIONS.map((option) => (
          <ChoiceRow
            detail={t(option.detailKey)}
            disabled={savingValue !== null}
            key={option.value}
            loading={savingValue === option.value}
            onPress={() => { void select(option.value); }}
            selected={preferences.language === option.value}
            testID={`language-option-${option.value}`}
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

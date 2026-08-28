import { PreferenceSelectionScreen } from "./PreferenceSelectionScreen";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences } from "../../preferences";
import type { AppearancePreference } from "../../application/appPreferences";

type AppearanceSettingsScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.APPEARANCE_SETTINGS>;

const options: readonly { detailKey: string; labelKey: string; value: AppearancePreference }[] = [
  { detailKey: "systemDetail", labelKey: "system", value: "system" },
  { detailKey: "lightDetail", labelKey: "light", value: "light" },
  { detailKey: "darkDetail", labelKey: "dark", value: "dark" },
];

export function AppearanceSettingsScreen({ navigation }: AppearanceSettingsScreenProps) {
  const preferences = useAppPreferences();
  const { t } = useTranslation("appearance");
  return (
    <PreferenceSelectionScreen
      currentValue={preferences.appearance}
      header={{ context: t("settings"), onBack: () => navigation.goBack(), title: t("appearance") }}
      intro={t("intro")}
      onSelect={(value) => preferences.setAppearance(value as AppearancePreference)}
      options={options.map((option) => ({
        appearancePreview: option.value,
        detail: t(option.detailKey),
        label: t(option.labelKey),
        value: option.value,
      }))}
      sectionTitle={t("options")}
    />
  );
}

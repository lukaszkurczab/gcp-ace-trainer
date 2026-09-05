import { SettingsInformationScreen, type InformationSection } from "./SettingsInformationScreen";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";

type YourDataScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.YOUR_DATA>;

export function YourDataScreen({ navigation }: YourDataScreenProps) {
  const { t } = useTranslation("data");
  const text = {
  close: t("close"),
  data: t("data"),
  dataPrivacy: t("dataPrivacy"),
  infoBody: t("infoBody"),
  infoTitle: t("infoTitle"),
    sections: t("sections", { returnObjects: true }) as readonly InformationSection[],
  };
  return <SettingsInformationScreen closeLabel={text.close} infoBody={text.infoBody} infoTitle={text.infoTitle} screenHeader={{ context: text.data, onBack: () => navigation.goBack(), title: text.dataPrivacy }} sections={text.sections} />;
}

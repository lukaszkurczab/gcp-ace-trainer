import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

import { InfoBlock, PublicLinkRow, SettingsGroup } from "../../components";
import { readPublicLegalLinksFromRuntime } from "../../infrastructure/firebase/publicConfig";
import { SettingsInformationScreen, type InformationSection } from "./SettingsInformationScreen";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";

type LegalInformationScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.LEGAL_INFORMATION>;

export function LegalInformationScreen({ navigation }: LegalInformationScreenProps) {
  const { t } = useTranslation("legal");
  const text = {
  close: t("close"),
  infoBody: t("infoBody"),
  infoTitle: t("infoTitle"),
  legal: t("legal"),
  publicLinksTitle: t("publicLinksTitle"),
  publicLinksUnavailableTitle: t("publicLinksUnavailableTitle"),
  publicLinksUnconfiguredDescription: t("publicLinksUnconfiguredDescription"),
  publicLinksInvalidDescription: t("publicLinksInvalidDescription"),
  publicLinkOpenFailedTitle: t("publicLinkOpenFailedTitle"),
  publicLinkOpenFailedDescription: t("publicLinkOpenFailedDescription"),
  publicLinkUnavailableDetail: t("publicLinkUnavailableDetail"),
  privacyLink: t("privacyLink"),
  privacyLinkDetail: t("privacyLinkDetail"),
  termsLink: t("termsLink"),
  termsLinkDetail: t("termsLinkDetail"),
  supportLink: t("supportLink"),
  supportLinkDetail: t("supportLinkDetail"),
  publicDeletionLink: t("publicDeletionLink"),
  publicDeletionLinkDetail: t("publicDeletionLinkDetail"),
  settings: t("settings"),
    sections: t("sections", { returnObjects: true }) as readonly InformationSection[],
  };
  const publicLinks = readPublicLegalLinksFromRuntime();
  const [openFailure, setOpenFailure] = useState(false);
  const available = publicLinks.kind === "configured";
  const links = [
    { detail: available ? text.privacyLinkDetail : text.publicLinkUnavailableDetail, icon: "shield-check" as const, title: text.privacyLink, testID: "legal-link-privacy", url: available ? publicLinks.value.privacyUrl : null },
    { detail: available ? text.termsLinkDetail : text.publicLinkUnavailableDetail, icon: "book-open" as const, title: text.termsLink, testID: "legal-link-terms", url: available ? publicLinks.value.termsUrl : null },
    { detail: available ? text.supportLinkDetail : text.publicLinkUnavailableDetail, icon: "mail" as const, title: text.supportLink, testID: "legal-link-support", url: available ? publicLinks.value.supportUrl : null },
    { detail: available ? text.publicDeletionLinkDetail : text.publicLinkUnavailableDetail, icon: "trash" as const, title: text.publicDeletionLink, testID: "legal-link-public-deletion", url: available ? publicLinks.value.publicDeletionUrl : null },
  ];

  const openPublicLink = async (url: string) => {
    setOpenFailure(false);
    try {
      await Linking.openURL(url);
    } catch {
      setOpenFailure(true);
    }
  };

  const supplementalContent = (
    <SettingsGroup title={text.publicLinksTitle}>
      {available ? null : <InfoBlock body={publicLinks.reason === "invalid_public_environment" ? text.publicLinksInvalidDescription : text.publicLinksUnconfiguredDescription} title={text.publicLinksUnavailableTitle} testID="legal-links-unavailable" tone="warning" />}
      {openFailure ? <InfoBlock body={text.publicLinkOpenFailedDescription} title={text.publicLinkOpenFailedTitle} testID="legal-link-open-failed" tone="warning" /> : null}
      {links.map((link) => (
        <PublicLinkRow
          available={link.url !== null}
          detail={link.detail}
          icon={link.icon}
          key={link.testID}
          onPress={() => { if (link.url) void openPublicLink(link.url); }}
          testID={link.testID}
          title={link.title}
        />
      ))}
    </SettingsGroup>
  );

  return <SettingsInformationScreen closeLabel={text.close} infoBody={text.infoBody} infoTitle={text.infoTitle} screenHeader={{ context: text.settings, onBack: () => navigation.goBack(), title: text.legal }} sections={text.sections} supplementalContent={supplementalContent} />;
}

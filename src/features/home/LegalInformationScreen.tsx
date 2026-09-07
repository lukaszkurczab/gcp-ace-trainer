import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

import { Icon, IconTile, InfoBlock, ListRow, PublicLinkRow, SettingsBottomSheet, SettingsGroup } from "../../components";
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
  legalRequestsTitle: t("legalRequestsTitle"),
  complaint: t("complaint"),
  complaintDetail: t("complaintDetail"),
  withdrawal: t("withdrawal"),
  withdrawalDetail: t("withdrawalDetail"),
  dataRights: t("dataRights"),
  dataRightsDetail: t("dataRightsDetail"),
  suspensionAppeal: t("suspensionAppeal"),
  suspensionAppealDetail: t("suspensionAppealDetail"),
  settings: t("settings"),
    sections: t("sections", { returnObjects: true }) as readonly InformationSection[],
  };
  const publicLinks = readPublicLegalLinksFromRuntime();
  const [openFailure, setOpenFailure] = useState(false);
  const [dataRightsVisible, setDataRightsVisible] = useState(false);
  const available = publicLinks.kind === "configured";
  const publicDestinations = [
    { detail: available ? text.supportLinkDetail : text.publicLinkUnavailableDetail, icon: "mail" as const, title: text.supportLink, testID: "legal-link-support", url: available ? publicLinks.value.supportUrl : null },
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
      <ListRow detail={text.privacyLinkDetail} leading={<IconTile iconSize={20} name="shield-check" size={32} tone="settings" />} onPress={() => navigation.navigate(ROUTES.PRIVACY_POLICY)} testID="legal-link-privacy" title={text.privacyLink} trailing={<Icon name="chevron-right" size={20} />} variant="grouped" />
      <ListRow detail={text.termsLinkDetail} leading={<IconTile iconSize={20} name="book-open" size={32} tone="settings" />} onPress={() => navigation.navigate(ROUTES.TERMS_OF_SERVICE)} testID="legal-link-terms" title={text.termsLink} trailing={<Icon name="chevron-right" size={20} />} variant="grouped" />
      {publicDestinations.map((link) => (
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

  const legalRequestContent = (
    <SettingsGroup title={text.legalRequestsTitle}>
      <ListRow detail={text.complaintDetail} leading={<IconTile iconSize={20} name="alert-triangle" size={32} tone="settings" />} onPress={() => navigation.navigate(ROUTES.LEGAL_REQUESTS, { kind: "complaint" })} testID="legal-request-complaint" title={text.complaint} trailing={<Icon name="chevron-right" size={20} />} variant="grouped" />
      <ListRow detail={text.withdrawalDetail} leading={<IconTile iconSize={20} name="rotate-ccw" size={32} tone="settings" />} onPress={() => navigation.navigate(ROUTES.LEGAL_REQUESTS, { kind: "withdrawal" })} testID="legal-request-withdrawal" title={text.withdrawal} trailing={<Icon name="chevron-right" size={20} />} variant="grouped" />
      <ListRow detail={text.dataRightsDetail} leading={<IconTile iconSize={20} name="database" size={32} tone="settings" />} onPress={() => setDataRightsVisible(true)} testID="legal-request-data-rights" title={text.dataRights} trailing={<Icon name="chevron-right" size={20} />} variant="grouped" />
      <ListRow detail={text.suspensionAppealDetail} leading={<IconTile iconSize={20} name="shield-check" size={32} tone="settings" />} onPress={() => navigation.navigate(ROUTES.LEGAL_REQUESTS, { kind: "suspension_appeal" })} testID="legal-request-suspension-appeal" title={text.suspensionAppeal} trailing={<Icon name="chevron-right" size={20} />} variant="grouped" />
    </SettingsGroup>
  );

  return <><SettingsInformationScreen closeLabel={text.close} infoBody={text.infoBody} infoTitle={text.infoTitle} screenHeader={{ context: text.settings, onBack: () => navigation.goBack(), title: text.legal }} sections={text.sections} supplementalContent={<>{legalRequestContent}{supplementalContent}</>} /><SettingsBottomSheet closeLabel={text.close} intro={t("dataRightsIntro")} onClose={() => setDataRightsVisible(false)} title={text.dataRights} visible={dataRightsVisible}><SettingsGroup title={text.dataRights}><ListRow detail={t("privacyRequestsDetail")} leading={<IconTile name="shield-check" size={32} tone="settings" />} onPress={() => { setDataRightsVisible(false); navigation.navigate(ROUTES.PRIVACY_REQUESTS); }} testID="legal-data-rights-privacy" title={t("privacyRequestsTitle")} variant="grouped" /><ListRow detail={t("dataRecoveryDetail")} leading={<IconTile name="database" size={32} tone="settings" />} onPress={() => { setDataRightsVisible(false); navigation.navigate(ROUTES.LEGAL_REQUESTS, { kind: "data_recovery" }); }} testID="legal-data-rights-recovery" title={t("dataRecoveryTitle")} variant="grouped" /></SettingsGroup></SettingsBottomSheet></>;
}

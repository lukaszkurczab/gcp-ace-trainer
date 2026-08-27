import { useState } from "react";
import { Linking } from "react-native";

import { InfoBlock, PublicLinkRow, SettingsGroup } from "../../components";
import { readPublicLegalLinksFromRuntime } from "../../infrastructure/firebase/publicConfig";
import { SettingsInformationScreen, type InformationSection } from "./SettingsInformationScreen";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences } from "../../preferences";

const copy = {
  en: {
    close: "Close",
    infoBody: "Patternly is an independent learning tool. This screen explains the current privacy, security, and study-use boundaries.",
    infoTitle: "Privacy and study use",
    legal: "Legal information",
    publicLinksTitle: "Public legal links",
    publicLinksUnavailableTitle: "Public legal links unavailable",
    publicLinksUnconfiguredDescription: "This local build has no validated public environment, so privacy, terms, support, and public account-deletion links are disabled.",
    publicLinksInvalidDescription: "The public environment configuration is invalid, so privacy, terms, support, and public account-deletion links are disabled.",
    publicLinkOpenFailedTitle: "Public link unavailable",
    publicLinkOpenFailedDescription: "The configured public link could not be opened on this device.",
    publicLinkUnavailableDetail: "Unavailable in this local build.",
    privacyLink: "Privacy policy",
    privacyLinkDetail: "Open the configured public privacy policy.",
    termsLink: "Terms",
    termsLinkDetail: "Open the configured public terms.",
    supportLink: "Support",
    supportLinkDetail: "Open the configured public support destination.",
    publicDeletionLink: "Public account-deletion request",
    publicDeletionLinkDetail: "Open the configured public request path.",
    settings: "Settings",
    sections: [
      {
        title: "Privacy and security",
        topics: [
          {
            detailTitle: "Local storage and security",
            icon: "shield-check",
            summary: "Learning data stays in local app storage, with no encryption claim.",
            title: "Local storage",
            paragraphs: [
              "Patternly uses one canonical local storage boundary. Screens and learning runtimes do not access that storage directly.",
              "Local storage does not by itself guarantee encryption, protection on a compromised device, or irrecoverable deletion. Patternly does not describe the current local data as encrypted.",
            ],
          },
          {
            detailTitle: "Limits of protection",
            icon: "alert-triangle",
            summary: "Learning records are not tamper-proof credentials or official examination records.",
            title: "What this does not protect against",
            paragraphs: [
              "Patternly does not claim to protect data from an unlocked or compromised device, operating-system-level access, root or jailbreak access, backups, debug tooling, or forensic storage access.",
              "Consistency checks protect the app's own learning records from duplicated or partial outcomes. They do not provide anti-cheat protection or independent proof of competence.",
            ],
          },
        ],
      },
      {
        title: "Using Patternly",
        topics: [
          {
            detailTitle: "Practice evidence, not certification",
            icon: "book-open",
            summary: "Results are personal practice evidence, not official certification or exam results.",
            title: "Independent study use",
            paragraphs: [
              "Patternly content is for independent study. Learning results are personal practice evidence and are not tamper-proof credentials, official examination records, or independently verifiable proof of competence.",
              "Content review and validation support educational quality and lawful provenance. They do not make Patternly an official certification source or an endorsed training provider.",
            ],
          },
          {
            detailTitle: "Deletion and reset",
            icon: "trash",
            summary: "A verified learning-state reset removes supported local learning records; it cannot be undone.",
            title: "Reset limits",
            paragraphs: [
              "A learning-state reset logically removes supported canonical learning records such as sessions, attempts, review items, progress evidence, active drafts, and pending learning mutations where the storage contract permits it.",
              "It is not forensic secure erasure and cannot promise deletion from copies created before the current no-backup policy, operating-system copies outside the app's control, or flash-memory remnants. Non-learning preferences may remain unless a separately defined full reset exists.",
            ],
          },
        ],
      },
    ] satisfies readonly InformationSection[],
  },
  pl: {
    close: "Zamknij",
    infoBody: "Patternly jest niezależnym narzędziem do nauki. Ten ekran wyjaśnia obecne granice prywatności, bezpieczeństwa i korzystania z materiałów.",
    infoTitle: "Prywatność i korzystanie z materiałów",
    legal: "Informacje prawne",
    publicLinksTitle: "Publiczne linki prawne",
    publicLinksUnavailableTitle: "Publiczne linki prawne są niedostępne",
    publicLinksUnconfiguredDescription: "Ta lokalna wersja nie ma zweryfikowanego publicznego środowiska, więc linki do prywatności, warunków, pomocy i publicznego żądania usunięcia konta są wyłączone.",
    publicLinksInvalidDescription: "Konfiguracja publicznego środowiska jest nieprawidłowa, więc linki do prywatności, warunków, pomocy i publicznego żądania usunięcia konta są wyłączone.",
    publicLinkOpenFailedTitle: "Publiczny link jest niedostępny",
    publicLinkOpenFailedDescription: "Nie udało się otworzyć skonfigurowanego publicznego linku na tym urządzeniu.",
    publicLinkUnavailableDetail: "Niedostępne w tej lokalnej wersji.",
    privacyLink: "Polityka prywatności",
    privacyLinkDetail: "Otwórz skonfigurowaną publiczną politykę prywatności.",
    termsLink: "Warunki",
    termsLinkDetail: "Otwórz skonfigurowane publiczne warunki.",
    supportLink: "Pomoc",
    supportLinkDetail: "Otwórz skonfigurowane publiczne miejsce pomocy.",
    publicDeletionLink: "Publiczne żądanie usunięcia konta",
    publicDeletionLinkDetail: "Otwórz skonfigurowaną publiczną ścieżkę żądania.",
    settings: "Ustawienia",
    sections: [
      {
        title: "Prywatność i bezpieczeństwo",
        topics: [
          {
            detailTitle: "Lokalny zapis i bezpieczeństwo",
            icon: "shield-check",
            summary: "Dane o nauce pozostają w lokalnym zapisie aplikacji; nie deklarujemy szyfrowania.",
            title: "Lokalny zapis",
            paragraphs: [
              "Patternly używa jednej kanonicznej granicy lokalnego zapisu. Ekrany i runtime nauki nie odczytują tego zapisu bezpośrednio.",
              "Lokalny zapis sam w sobie nie gwarantuje szyfrowania, ochrony na przejętym urządzeniu ani nieodwracalnego usunięcia. Patternly nie opisuje obecnych danych lokalnych jako zaszyfrowanych.",
            ],
          },
          {
            detailTitle: "Granice ochrony",
            icon: "alert-triangle",
            summary: "Rekordy nauki nie są odpornymi na manipulację poświadczeniami ani oficjalnym wynikiem egzaminu.",
            title: "Przed czym to nie chroni",
            paragraphs: [
              "Patternly nie deklaruje ochrony danych przed odblokowanym lub przejętym urządzeniem, dostępem na poziomie systemu, rootem lub jailbreakiem, backupami, narzędziami debugowania ani analizą nośnika pamięci.",
              "Kontrole spójności chronią własne rekordy nauki aplikacji przed duplikatami i częściowymi wynikami. Nie stanowią ochrony przed oszustwem ani niezależnego dowodu kompetencji.",
            ],
          },
        ],
      },
      {
        title: "Korzystanie z Patternly",
        topics: [
          {
            detailTitle: "Nauka, nie certyfikacja",
            icon: "book-open",
            summary: "Wyniki są osobistym dowodem ćwiczeń, a nie oficjalnym wynikiem certyfikacji czy egzaminu.",
            title: "Niezależna nauka",
            paragraphs: [
              "Treści Patternly służą do niezależnej nauki. Wyniki są osobistym dowodem ćwiczeń, a nie odpornymi na manipulację poświadczeniami, oficjalnymi rekordami egzaminu ani niezależnie weryfikowalnym potwierdzeniem kompetencji.",
              "Przegląd i walidacja treści wspierają jakość edukacyjną oraz legalne pochodzenie. Nie czynią Patternly oficjalnym źródłem certyfikacji ani rekomendowanym dostawcą szkolenia.",
            ],
          },
          {
            detailTitle: "Usuwanie i reset",
            icon: "trash",
            summary: "Zweryfikowany reset stanu nauki usuwa obsługiwane lokalne rekordy i nie można go cofnąć.",
            title: "Granice resetu",
            paragraphs: [
              "Reset stanu nauki logicznie usuwa obsługiwane kanoniczne rekordy nauki, takie jak sesje, podejścia, elementy powtórek, dowody postępu, aktywne szkice i oczekujące mutacje nauki, gdy pozwala na to kontrakt zapisu.",
              "Nie jest to bezpieczne usuwanie forensyczne i nie może obiecywać usunięcia z kopii utworzonych przed obecną polityką bez backupu, kopii systemowych poza kontrolą aplikacji ani pozostałości w pamięci flash. Preferencje niezwiązane z nauką mogą pozostać, dopóki nie istnieje osobno zdefiniowany pełny reset.",
            ],
          },
        ],
      },
    ] satisfies readonly InformationSection[],
  },
} as const;

type LegalInformationScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.LEGAL_INFORMATION>;

export function LegalInformationScreen({ navigation }: LegalInformationScreenProps) {
  const { locale } = useAppPreferences();
  const text = copy[locale];
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

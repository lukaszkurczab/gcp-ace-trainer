import { SettingsInformationScreen, type InformationSection } from "./SettingsInformationScreen";
import { useAppPreferences } from "../../preferences";

const copy = {
  en: {
    close: "Close",
    infoBody: "Patternly is an independent learning tool. This screen explains the current privacy, security, and study-use boundaries.",
    infoTitle: "Privacy and study use",
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

export function LegalInformationScreen() {
  const { locale } = useAppPreferences();
  const text = copy[locale];
  return <SettingsInformationScreen closeLabel={text.close} infoBody={text.infoBody} infoTitle={text.infoTitle} sections={text.sections} />;
}

import { SettingsInformationScreen, type InformationSection } from "./SettingsInformationScreen";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences } from "../../preferences";

const copy = {
  en: {
    close: "Close",
    data: "Data",
    dataPrivacy: "Data & privacy",
    infoBody: "Patternly stores learning data locally on this device to run sessions, review progress, and recover one active session.",
    infoTitle: "Your learning data",
    sections: [
      {
        title: "Quick answers",
        topics: [
          {
            detailTitle: "What Patternly stores",
            icon: "database",
            summary: "Learning records and the settings needed to run the app.",
            title: "Stored locally",
            paragraphs: [
              "Patternly stores application settings, active and completed sessions, attempts, results, review items, progress evidence, recommendation inputs, and the one active-session draft required to resume safely.",
              "It also keeps the durable records required to verify writes and recover an interrupted learning operation.",
            ],
          },
          {
            detailTitle: "What Patternly does not require",
            icon: "shield-check",
            summary: "No account, identity profile, cloud history, or unrelated device data.",
            title: "Not collected",
            paragraphs: [
              "Patternly does not require an account, name, email address, authentication credentials, or an identity profile.",
              "It does not require location, contacts, photos, microphone, camera, health data, advertising identifiers, self-assessments, or synthetic readiness and mastery metrics.",
            ],
          },
          {
            detailTitle: "Account, sync, and deletion",
            icon: "user",
            summary: "Account binding is explicit and previewed before data moves.",
            title: "Account binding is explicit",
            paragraphs: [
              "Patternly exposes account entry only when the public environment, Firebase identity provider, and native App Check composition are explicitly configured. Creating or signing into an account does not automatically bind or upload local learning records.",
              "After an authenticated preview and your confirmation, Patternly can synchronize the current track and compact completed learning facts. Active sessions, drafts, positions, timers, and recovery journals stay on this device.",
            ],
          },
          {
            detailTitle: "Where learning data goes",
            icon: "cloud",
            summary: "Only the declared account-owned learning facts can sync.",
            title: "Explicit account sync",
            paragraphs: [
              "The sync allowlist contains the current track, terminal session summaries, completed-session results, attempts, and review-queue entries. Active sessions, drafts, current positions, timers, mutation journals, settings, and notification preferences never sync.",
              "A local commit is retained before remote acknowledgement. Pending, conflict, failure, and retry states remain visible; sign-out is blocked while unsynchronized data exists.",
            ],
          },
        ],
      },
      {
        title: "Keeping your data",
        topics: [
          {
            detailTitle: "Loss and recovery",
            icon: "alert-triangle",
            summary: "Account adoption preserves data only after explicit confirmation.",
            title: "Local-only limits",
            paragraphs: [
              "Uninstalling the app, losing or replacing the device, or resetting learning state may remove device-only data such as an active session or draft. Confirmed account-owned records can be restored through the explicit adoption flow.",
              "Patternly configures learning records to be excluded from automatic operating-system backups and device transfers. It offers no backup or restore path; copies outside the app's control cannot be guaranteed absent.",
            ],
          },
        ],
      },
    ] satisfies readonly InformationSection[],
  },
  pl: {
    close: "Zamknij",
    data: "Dane",
    dataPrivacy: "Dane i prywatność",
    infoBody: "Patternly zapisuje dane o nauce lokalnie na tym urządzeniu, aby prowadzić sesje, powtórki i bezpiecznie odzyskać jedną aktywną sesję.",
    infoTitle: "Twoje dane o nauce",
    sections: [
      {
        title: "Szybkie odpowiedzi",
        topics: [
          {
            detailTitle: "Co zapisuje Patternly",
            icon: "database",
            summary: "Rekordy nauki i ustawienia potrzebne do działania aplikacji.",
            title: "Zapisywane lokalnie",
            paragraphs: [
              "Patternly zapisuje ustawienia aplikacji, aktywne i ukończone sesje, podejścia, wyniki, elementy powtórek, dowody postępu, dane wejściowe rekomendacji oraz szkic jednej aktywnej sesji potrzebny do bezpiecznego wznowienia.",
              "Przechowuje również trwałe rekordy potrzebne do weryfikacji zapisów i odzyskania przerwanej operacji nauki.",
            ],
          },
          {
            detailTitle: "Czego Patternly nie wymaga",
            icon: "shield-check",
            summary: "Bez konta, profilu tożsamości, historii w chmurze i niepowiązanych danych urządzenia.",
            title: "Nie zbieramy",
            paragraphs: [
              "Patternly nie wymaga konta, imienia, adresu e-mail, danych logowania ani profilu tożsamości.",
              "Nie wymaga lokalizacji, kontaktów, zdjęć, mikrofonu, kamery, danych zdrowotnych, identyfikatorów reklamowych, samoocen ani syntetycznych metryk gotowości i opanowania materiału.",
            ],
          },
          {
            detailTitle: "Konto, synchronizacja i usunięcie",
            icon: "user",
            summary: "Powiązanie konta wymaga podglądu i potwierdzenia.",
            title: "Powiązanie konta jest jawne",
            paragraphs: [
              "Patternly pokazuje wejście do konta tylko wtedy, gdy jawnie skonfigurowano publiczne środowisko, dostawcę tożsamości Firebase i natywną konfigurację App Check. Utworzenie konta lub logowanie nie wiąże automatycznie lokalnych danych o nauce ani ich nie wysyła.",
              "Po uwierzytelnieniu i Twoim potwierdzeniu Patternly może synchronizować aktywny tor oraz zwarte fakty ukończonej nauki. Aktywne sesje, szkice, pozycje, timery i dzienniki odzyskiwania pozostają tylko na tym urządzeniu.",
            ],
          },
          {
            detailTitle: "Dokąd trafiają dane o nauce",
            icon: "cloud",
            summary: "Synchronizują się tylko zadeklarowane fakty danych konta.",
            title: "Jawna synchronizacja konta",
            paragraphs: [
              "Allowlista synchronizacji obejmuje aktywny tor, terminalne podsumowania sesji, wyniki ukończonych sesji, podejścia i wpisy kolejki powtórek. Aktywne sesje, szkice, pozycje, timery, dzienniki mutacji, ustawienia i powiadomienia nigdy nie są wysyłane.",
              "Lokalny zapis jest zachowany przed potwierdzeniem zdalnym. Oczekiwanie, konflikt, błąd i ponowienie są widoczne; wylogowanie blokują niesynchronizowane dane.",
            ],
          },
        ],
      },
      {
        title: "Przechowywanie danych",
        topics: [
          {
            detailTitle: "Utrata i odzyskiwanie",
            icon: "alert-triangle",
            summary: "Adopcja konta zachowuje dane dopiero po jawnym potwierdzeniu.",
            title: "Granice lokalnego zapisu",
            paragraphs: [
              "Odinstalowanie aplikacji, utrata lub wymiana urządzenia albo reset nauki mogą usunąć dane tylko urządzenia, takie jak aktywna sesja lub szkic. Potwierdzone rekordy konta mogą zostać odtworzone przez jawny przepływ adopcji.",
              "Patternly konfiguruje wykluczenie rekordów nauki z automatycznych backupów systemu i transferów między urządzeniami. Nie oferuje backupu ani przywracania; nie może zagwarantować braku kopii poza kontrolą aplikacji.",
            ],
          },
        ],
      },
    ] satisfies readonly InformationSection[],
  },
} as const;

type YourDataScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.YOUR_DATA>;

export function YourDataScreen({ navigation }: YourDataScreenProps) {
  const { locale } = useAppPreferences();
  const text = copy[locale];
  return <SettingsInformationScreen closeLabel={text.close} infoBody={text.infoBody} infoTitle={text.infoTitle} screenHeader={{ context: text.data, onBack: () => navigation.goBack(), title: text.dataPrivacy }} sections={text.sections} />;
}

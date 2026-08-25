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
            summary: "Account entry is separate from local learning and remote sync.",
            title: "Account binding is explicit",
            paragraphs: [
              "Patternly exposes account entry only when the public environment, Firebase identity provider, and native App Check composition are explicitly configured. Creating or signing into an account does not automatically bind or upload local learning records.",
              "Account deletion and cross-device synchronization are separate product surfaces and are not part of this account-entry slice. No local-only state claims that a remote account exists or has been deleted.",
            ],
          },
          {
            detailTitle: "Where learning data goes",
            icon: "cloud",
            summary: "Current learning records do not need a Patternly backend or cloud sync.",
            title: "No current sync",
            paragraphs: [
              "The current product does not transmit learning records, answers, scores, review evidence, simulation drafts, or recommendations to a Patternly backend.",
              "Analytics, remote backups, export, import, and cross-device restoration are not part of the current product contract.",
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
            summary: "There is no account-based recovery if the app or device is lost.",
            title: "Local-only limits",
            paragraphs: [
              "Uninstalling the app, losing or replacing the device, or resetting learning state may remove local learning data. Patternly cannot restore it through an account or cloud history.",
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
            summary: "Wejście do konta jest odrębne od lokalnej nauki i zdalnej synchronizacji.",
            title: "Powiązanie konta jest jawne",
            paragraphs: [
              "Patternly pokazuje wejście do konta tylko wtedy, gdy jawnie skonfigurowano publiczne środowisko, dostawcę tożsamości Firebase i natywną konfigurację App Check. Utworzenie konta lub logowanie nie wiąże automatycznie lokalnych danych o nauce ani ich nie wysyła.",
              "Usunięcie konta i synchronizacja między urządzeniami są odrębnymi powierzchniami produktu i nie należą do tego wycinka wejścia do konta. Żaden stan lokalny nie udaje istnienia ani usunięcia zdalnego konta.",
            ],
          },
          {
            detailTitle: "Dokąd trafiają dane o nauce",
            icon: "cloud",
            summary: "Obecne rekordy nauki nie potrzebują backendu Patternly ani synchronizacji z chmurą.",
            title: "Brak obecnej synchronizacji",
            paragraphs: [
              "Obecny produkt nie przesyła rekordów nauki, odpowiedzi, wyników, dowodów powtórek, szkiców symulacji ani rekomendacji do backendu Patternly.",
              "Analityka, zdalne backupy, eksport, import i przywracanie historii między urządzeniami nie są częścią obecnego kontraktu produktu.",
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
            summary: "Nie ma odzyskiwania opartego na koncie, gdy aplikacja lub urządzenie zostanie utracone.",
            title: "Granice lokalnego zapisu",
            paragraphs: [
              "Odinstalowanie aplikacji, utrata lub wymiana urządzenia albo reset stanu nauki mogą usunąć lokalne dane o nauce. Patternly nie może ich odtworzyć przez konto ani historię w chmurze.",
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

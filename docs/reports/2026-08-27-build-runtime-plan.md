# Kanoniczne tryby budowania aplikacji mobilnej

Stan na 2026-08-28. Dokument jest jednocześnie kontraktem operacyjnym i zapisem
wdrożenia. Stan repozytorium ma pierwszeństwo przed tym opisem.

## Cel i wynik

Jedynym źródłem konfiguracji Expo jest `app.config.js`, a każdy artefakt ma jeden
jawny tryb: `sandbox`, `smoke` albo `release`. Usunięto pluginy naprawiające
wygenerowane pliki Gradle i transformer zmieniający endpointy podczas bundlowania.
Lokalne buildy Android i iOS zostały potwierdzone na standardowym prebuildzie
Expo 57.

Konfiguracja repozytorium jest zakończona. Profil builda `sandbox` korzysta z
domyślnego środowiska zmiennych EAS `preview`, ponieważ własne środowisko o nazwie
`sandbox` wymaga płatnego planu EAS. `preview` zawiera dokładnie dziesięć
zatwierdzonych publicznych wartości sandbox; nie zawiera danych E2E ani duplikatów
natywnych plików Firebase. Konfiguracja została rozwiązana przez `eas env:exec`
i oficjalne `expo config --type public` bez lokalnego `.env`.
`release` pozostaje celowo niedostępny do czasu podania autorytatywnych wartości
produkcyjnych i konfiguracji poświadczeń sklepowych.

## Kontrakt trybów

| Tryb | Przeznaczenie | Sieć i usługi | Uruchamianie |
| --- | --- | --- | --- |
| `sandbox` | Wewnętrzny, samodzielny artefakt bez Metro i Expo Go | wyłącznie sandboxowe Firebase, API, linki i App Check; bez emulatorów i loopbacku | `eas build --profile sandbox --platform android|ios` |
| `smoke` | Lokalny build debug na Android Emulatorze lub iOS Simulatorze | lokalny backend i Firebase Auth Emulator; publiczne środowisko sandbox/production jest ignorowane | `npm run android` albo `npm run ios`; Metro przez `npm start` tylko gdy scenariusz go potrzebuje |
| `release` | Artefakt sklepowy | wyłącznie produkcyjne Firebase, API, linki i App Check; bez danych E2E | `eas build --profile release --platform android|ios` |

`sandbox` jest standardowym EAS internal distribution: Android tworzy APK, iOS
wewnętrzny artefakt podpisany przez EAS. Nazwa środowiska EAS `preview` jest
wyłącznie magazynem wartości dla profilu i nie zmienia runtime'u ani endpointów
`sandbox`. `smoke` nie ma profilu EAS i nie jest
kanałem dystrybucji. Lokalny debug może korzystać z development clienta, ale nie
zmienia to kontraktu samodzielnego builda `sandbox`, który powstaje jako Release
z osadzonym bundlem.

## Źródła prawdy i miejsce przechowywania

| Zakres | Zmienne / pliki | `sandbox` | `smoke` | `release` | Właściciel i miejsce |
| --- | --- | --- | --- | --- | --- |
| Tryb builda | `PATTERNLY_RUNTIME_MODE`, `EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE` | `sandbox` | domyślnie `smoke` w lokalnym debug | `release` | wartości profili w `eas.json`; publiczna wartość trafia do bundle |
| Publiczne Firebase i OAuth | `EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY`, `...APP_ID`, `...AUTH_DOMAIN`, `...PROJECT_ID`, `...GOOGLE_ANDROID_CLIENT_ID`, `...GOOGLE_IOS_CLIENT_ID`, `...GOOGLE_WEB_CLIENT_ID` | rejestracje sandbox z EAS `preview` | `.env.local`, obecne pliki natywne | rejestracje production | EAS environment dla buildów zdalnych; `.env.local` lokalnie; są publiczne, ale nie powinny być mieszane między środowiskami |
| Natywne Firebase | `GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICE_INFO_PLIST` | śledzone `google-services.json` i `GoogleService-Info.plist` | te same śledzone pliki sandbox | wymagane EAS file variables | jedna publiczna rejestracja sandbox w repo; EAS file variables wyłącznie dla produkcyjnego `release` |
| Publiczne endpointy | `EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT` | pełny obiekt JSON z `environment=sandbox` i HTTPS | nieustawione; runtime jawnie zwraca stan `unconfigured` | pełny obiekt JSON z `environment=production` i HTTPS | EAS environment; nie przechowywać drugiej kopii w kodzie |
| App Check | `EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER`, `...APPLE_PROVIDER` | `playIntegrity`, rekomendowane obecnie `deviceCheck` | `debug` do lokalnego uruchomienia | `playIntegrity` i zatwierdzony provider Apple | EAS environment lub `.env.local`; rejestracje providerów należą do Firebase/Apple/Google |
| Lokalne E2E | `EXPO_PUBLIC_PATTERNLY_BACKEND_E2E`, `...API_ORIGIN`, `...FIREBASE_AUTH_EMULATOR_ORIGIN`, `...E2E_EMAIL`, `...E2E_PASSWORD` | zabronione | wyłącznie `.env.local`; flaga musi mieć wartość `true`, a runtime musi być `__DEV__` + `smoke` | zabronione | nieśledzony `.env.local`; konto istnieje wyłącznie w lokalnym emulatorze, a wartości są widoczne w lokalnym bundle |
| Podpisywanie | bez własnych zmiennych keystore w aplikacji | EAS Credentials dla internal distribution | lokalne debug signing | EAS Credentials dla sklepów | EAS Credentials, nie Git i nie `EXPO_PUBLIC_*` |
| Sekrety serwera | service accounts, klucze prywatne, sekrety backendu/RevenueCat/App Store | nigdy w aplikacji | nigdy w aplikacji | nigdy w aplikacji | Secret Manager właściwego backendu lub bezpieczny magazyn operatora |

`.env.example` jest wyłącznie pustym, śledzonym kontraktem. Lokalny operator
kopiuje go do ignorowanego `.env.local`. `EXPO_PUBLIC_*` zawsze należy traktować
jako dane publiczne kompilowane do aplikacji. Nie wolno tam umieszczać kluczy
prywatnych ani danych prawdziwego użytkownika.

## Zachowanie fail-closed

- `app.config.js` odrzuca nieznany tryb, brak natywnych plików Firebase, brak
  publicznych identyfikatorów Firebase/OAuth i niespójność `sandbox`/`production`.
- Każdy zdalny artefakt wymaga `playIntegrity` na Androidzie oraz produkcyjnego
  providera Apple (`deviceCheck`, `appAttest` lub kontrolowany wariant App Attest
  z DeviceCheck). Provider `debug` jest dozwolony tylko w `smoke`.
- Pierwsze odczytanie konfiguracji przez EAS bez wskazanego profilu może działać
  jako neutralny `smoke`. Jest to konieczne, aby CLI odczytało `extra.eas.projectId`
  przed pobraniem zmiennych EAS. Wybrany profil zdalny nadal failuje przed
  prebuildem, gdy brakuje jego wartości.
- Runtime `smoke` nie przejmuje publicznych endpointów nawet wtedy, gdy zostały
  przypadkiem pozostawione w lokalnym shellu.
- Lokalne endpointy backendu i Auth Emulatora są dostępne tylko dla kombinacji
  `__DEV__`, `smoke` i `EXPO_PUBLIC_PATTERNLY_BACKEND_E2E=true`.

Play Integrity może obsługiwać aplikację dystrybuowaną poza Google Play, ale
wymaga odpowiedniego ustawienia odpowiedzi dla nierozpoznanej wersji w konsoli
App Check. Źródło: https://firebase.google.com/docs/app-check/android/play-integrity-provider

## Przyczyna problemów i usunięte ścieżki

1. `withAndroidSandboxVariant` oraz skrypty `android:sandbox*` tworzyły drugi,
   Android-only model artefaktu. Zastąpił je profil EAS `sandbox`.
2. `metro-sandbox-endpoint-transformer.js` przepisywał literały w bundle zamiast
   wybrać konfigurację przed bundlowaniem. Zastąpił go walidowany kontrakt trybu.
3. `withAndroidReleaseSigningBoundary` modyfikował wygenerowany Gradle, mimo że
   podpisywanie zdalne należy do EAS Credentials.
4. `withAndroidNdkVersion` wymuszał NDK 27.1 we wszystkich podprojektach i
   maskował lokalną, niepełną instalację NDK 27.0. Po przeniesieniu uszkodzonego
   katalogu SDK standardowy Gradle zainstalował właściwy NDK i zbudował aplikację.
5. Bezpośrednia zależność `@expo/config-plugins` tworzyła drugie źródło wersji;
   plugin prywatności używa teraz pakietu eksportowanego przez `expo`.

Usunięto również testy związane wyłącznie z trzema usuniętymi pluginami. Ich
obowiązki pokrywają testy kontraktu runtime i konfiguracji platform.
`withPrivacyBoundary` pozostaje, ponieważ wymusza rzeczywistą politykę prywatności
i backupu, której nie zastępuje sama konfiguracja builda. Oficjalny plugin
`expo-secure-store` ma wyłączone własne reguły backupu, więc nie istnieją dwa
konkurencyjne źródła tej polityki.

## Audyt zgodności paczek

Pakiety zostały wyrównane do Expo SDK 57 przez `expo install`: Expo 57.0.17,
React Native 0.86.3 oraz zgodne wersje `expo-auth-session`,
`expo-build-properties`, `expo-crypto`, `expo-notifications`,
`expo-secure-store`, `expo-system-ui` i `expo-updates`. `expo install --check`
nie zgłasza niezgodności, a Expo Doctor przechodzi 21/21 kontroli.

Bezpieczne `npm audit fix` zmniejszyło liczbę zgłoszeń z 20 do 14. Pozostało
13 ostrzeżeń moderate w łańcuchu narzędzi Expo/Xcode/uuid oraz jedno low dotyczące
development servera esbuild na Windows. Proponowane przez npm automatyczne
„naprawienie” wymagałoby niezgodnego downgrade'u Expo, dlatego `--force` zostało
odrzucone. Nie ma dowodu, że pozostawione zgłoszenia dotyczą kodu wykonywanego w
artefakcie mobilnym; pozostają jednak jawnym ryzykiem narzędziowym do obserwacji.

## Weryfikacja

| Kontrola | Wynik |
| --- | --- |
| `npm run typecheck` | zaliczona po aktualizacji paczek |
| `npm test` | 577/577 zaliczone |
| `npx expo install --check` | zależności zgodne |
| `npx expo-doctor` | 21/21 kontroli zaliczonych |
| `npx expo prebuild --clean --no-install` | Android i iOS zaliczone |
| Android `:app:assembleDebug` | BUILD SUCCESSFUL, 494 zadania |
| iOS `expo run:ios --no-bundler` | build, instalacja i otwarcie na iPhone 17 Simulator zaliczone; 0 błędów |
| `eas config --profile sandbox` z lokalnym, redaktowanym wejściem | Android i iOS rozwiązują tryb `sandbox`, internal distribution, kanał `sandbox`, EAS environment `preview`, natywne pliki Firebase i brak pluginów naprawczych |
| `eas env:exec preview` + `expo config --type public` bez lokalnego `.env` | runtime `sandbox`, oba śledzone pliki Firebase i brak pluginów naprawczych potwierdzone |
| EAS `env:list` | `preview`: 10/10 dozwolonych nazw, brak E2E i file variables; `production`: puste |
| `eas build:inspect --stage archive` | celowo zatrzymane przez `requireCommit: true`, ponieważ wspólne drzewo ma niezatwierdzone zmiany; nie obchodzono bramki i nie utworzono archiwum |

Po udanym buildzie wykonano czyszczenie wygenerowanych artefaktów. `gradlew clean`
usunął większość danych, ale zakończył się błędem kolejności czyszczenia CMake po
wcześniejszym usunięciu wygenerowanego katalogu codegen NitroModules. Nie jest to
błąd budowania i nie uzasadnia kolejnego pluginu naprawczego.

## Pozostałe operacje i ryzyka

1. Potwierdzić w konsoli Firebase konfigurację Play Integrity dla dystrybucji
   poza Play oraz DeviceCheck dla aktualnego identyfikatora iOS.
2. Po normalnym zatwierdzeniu zmian w Git i osobnej decyzji o wykorzystaniu limitu
   lub koszcie zdalnego buildu uruchomić oba buildy EAS `sandbox` i uruchomić
   otrzymane artefakty bez Metro. Sam zdalny artefakt nie został w ramach tej
   pracy zlecony.
3. Dla `release` uzyskać autorytatywne wartości produkcyjne, rejestracje App
   Check, EAS Credentials i dane sklepowe. Nie należy kopiować wartości sandbox.
4. Build iOS pokazuje dwa ostrzeżenia faz skryptowych z Expo Dev Launcher i
   React Native Firebase. Nie blokują kompilacji, ale powinny być ponownie
   ocenione przy buildzie `release`, gdzie development client nie uczestniczy.

## Walidacja planu

- Kanoniczny kontrakt trzech trybów: **0,90** — spójność 0,95; prostota 0,90;
  ryzyko 0,90; utrzymanie i testowalność 0,95.
- Wyrównanie paczek do Expo SDK 57: **0,92** — oficjalna macierz Expo i pełny
  prebuild/build ograniczają ryzyko; odrzucono wymuszony downgrade z `npm audit`.
- Dwuetapowa inicjalizacja EAS (neutralny odczyt project ID, następnie ścisła
  walidacja profilu): **0,90** — usuwa cykl inicjalizacji bez osłabienia wybranego
  artefaktu zdalnego.
- Wymaganie App Check również dla `sandbox`: **0,90** — usuwa niejawny stan bez
  ochrony, bez nowej ścieżki zgodności lub fallbacku.
- Mapowanie profilu `sandbox` na domyślne środowisko EAS `preview`: **0,92** —
  zachowuje jeden runtime i kanał sandbox bez płatnego, własnego środowiska.
  Odrzucone mapowanie na EAS `sandbox` otrzymało 0,55, ponieważ serwer nie pozwala
  zapisywać do niego zmiennych na obecnym planie.
- Jedna śledzona natywna rejestracja Firebase dla `smoke` i `sandbox`: **0,90** —
  pliki są publiczne, już należą do repo i umożliwiają lokalne rozwiązanie Expo.
  Duplikowanie ich jako `sensitive file` w EAS odrzucono na 0,60, ponieważ
  `eas config`/`env:exec` nie mogły ich materializować, a powstawały dwa źródła.

Każda wartość jest minimum z ocen spójności, prostoty, ryzyka oraz utrzymania,
nie średnią.

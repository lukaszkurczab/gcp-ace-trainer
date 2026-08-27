# MOB-012 — Android sandbox APK: handoff testu na urządzeniu fizycznym

Status: `OWNER TEST REQUIRED`
Data: `2026-08-26`
Werdykt QA: `PASS WITH GAPS`
Zakres: lokalny test standalone APK połączonego wyłącznie z sandboxem. Nie
obejmuje publikacji, Google Play, App Store, RevenueCat, produkcyjnego
keystore ani sekretów releasowych.

## Cel i granice

Ten dokument przekazuje właścicielowi odtwarzalny scenariusz instalacji i E2E
na fizycznym urządzeniu Android. Koordynator/worker nie ma dostępu do
urządzenia i nie wykonał instalacji, runtime E2E ani network handshake.

APK zawiera osadzony JavaScript, więc docelowy test standalone nie powinien
wymagać Metro, Expo, `expo start` ani `adb reverse`. Faktyczny cold start na
fizycznym urządzeniu bez Metro pozostaje jednak testem właściciela i nie jest
jeszcze zweryfikowany. Nie podmieniaj konfiguracji na produkcyjną i nie
zapisuj sekretów w repozytorium ani logach.

## 1. Artefakt i granica dowodów

### Aktualny artefakt po re-QA — jedyny cel instalacji

| Pole | Wartość |
| --- | --- |
| APK | `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/android/app/build/outputs/apk/sandbox/app-sandbox.apk` |
| APK SHA-256 | `90e35f20d147aed5345e02779df680486cc49bdb3d5cf3102d0f5e1740aa3f6f` |
| Wariant | `sandbox` |
| Application/package ID | `com.lkurczab.patternly` |
| Wersja | `0.1.0`, version code `1` |
| Firebase project | `patternly-app-sandbox` |
| Firebase Android app ID | `1:958691314582:android:04623582ba94e72be4ebb7` |
| Firebase Storage bucket | `patternly-app-sandbox.firebasestorage.app` |
| Bundlowany JS | `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/android/app/build/generated/assets/react/sandbox/index.android.bundle` |
| JS w APK | Tak: `assets/index.android.bundle` jest osadzony w APK |
| Standalone | Tak: APK zawiera `assets/index.android.bundle` oraz biblioteki `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` |
| `expo-updates` | Włączone i pozostaje włączone |
| Podpis / konfiguracja | Lokalny wariant `sandbox` używa debug signing w konfiguracji builda; certyfikat APK i APK Signature Scheme v2: `NOT VERIFIED` przez niezależne Artifact QA; bez release/produkcyjnego keystore |
| Build | `assembleSandbox` zakończony sukcesem po odświeżeniu nieaktualnego lokalnego stanu Gradle/Kotlin |
| QA verdict | `PASS WITH GAPS` |

### Poprzedni artefakt — historyczny i superseded

| Pole | Wartość |
| --- | --- |
| APK path | `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/android/app/build/outputs/apk/sandbox/app-sandbox.apk` |
| APK SHA-256 | `5615d9c26e8a938d41a683ec7bafaed8cded54232f150c70e53973b34d080739` |
| Status | `HISTORICAL / SUPERSEDED` — nie jest aktualnym artefaktem i nie jest celem preflightu ani instalacji |

`assembleRelease` nie było wykonywane. Nie użyto release secrets ani
release/produkcyjnego keystore i nie wykonano publikacji ani operacji u
providerów. Weryfikacja instalacji, cold startu, ikony, uruchomienia bez
Metro oraz backend handshake na fizycznym urządzeniu pozostaje po stronie
właściciela i jest niezweryfikowana.

Werdykt QA to `PASS WITH GAPS`: `Artifact QA = PASS` dotyczy wyłącznie bajtów
aktualnego artefaktu o powyższym SHA-256 i statycznych ustaleń re-QA. Nie
oznacza to pozytywnego testu instalacji, fizycznego urządzenia ani połączenia
sieciowego.

| Zakres | Wynik |
| --- | --- |
| `assembleSandbox`, standalone APK, manifest, osadzony JS, `expo-updates`, sandbox identity | `PASS` — re-QA |
| Konfiguracja podpisu lokalnego wariantu `sandbox` | `PASS` — debug signing skonfigurowany; certyfikat APK i APK Signature Scheme v2 `NOT VERIFIED` |
| Instalacja na fizycznym urządzeniu | `OWNER-RUN / NOT VERIFIED` |
| Cold launch na fizycznym urządzeniu | `OWNER-RUN / NOT VERIFIED` |
| Ikona aplikacji na urządzeniu | `OWNER-RUN / NOT VERIFIED` |
| Uruchomienie bez Metro | `OWNER-RUN / NOT VERIFIED` |
| Runtime E2E | `OWNER-RUN / NOT VERIFIED` |
| Backend/network handshake z sandboxem | `OWNER-RUN / NOT VERIFIED` |

Re-QA potwierdziło, że konfiguracja builda lokalnego wariantu `sandbox` używa
debug signing, ale niezależne Artifact QA nie zweryfikowało certyfikatu APK ani
APK Signature Scheme v2. Lokalne `apksigner`, `aapt` i `apkanalyzer` były
niedostępne, a `jarsigner` zgłosił APK jako unsigned; `jarsigner` nie weryfikuje
APK Signature Scheme v2. Wartości `CN=Android Debug` i `v2=true` są więc
wymaganiami do sprawdzenia przez właściciela, a nie niezależnie dowiedzionymi
faktami o aktualnym artefakcie.

Ten runbook nie składa żadnego twierdzenia o instalacji, uruchomieniu ani
działaniu runtime na fizycznym urządzeniu; te obszary pozostają
`OWNER-RUN / NOT VERIFIED`.

## 2. Wymagania po stronie właściciela

- Android SDK Platform-Tools z działającym `adb`;
- fizyczne urządzenie Android; artefakt deklaruje min SDK `28` i target SDK
  `36`;
- włączone USB debugging i zaakceptowana autoryzacja komputera;
- dokładnie jeden wpis ze stanem `device` w `adb devices -l`;
- sieć z urządzenia do sandboxowego Firebase/API dla kroków auth i sync;
- osobne testowe konto sandbox, tylko jeśli aktualny flow wymaga konta;
- plik APK o wskazanym SHA-256. Metro, port Expo i serwer developerski nie są
  wymagane.

## 3. Preflight, instalacja i uruchomienie

Wykonuj poniższe komendy lokalnie na komputerze właściciela. Zmienne
`PATTERNLY_*` są tylko sesyjnymi zmiennymi roboczymi.

### 3.1 Hash, bundled JS, package ID i podpis

```sh
cd /Users/lukaszkurczab/Desktop/Projects/Patternly/patternly

PATTERNLY_APK_PATH="/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/android/app/build/outputs/apk/sandbox/app-sandbox.apk"
PATTERNLY_EXPECTED_SHA256="90e35f20d147aed5345e02779df680486cc49bdb3d5cf3102d0f5e1740aa3f6f"

shasum -a 256 "$PATTERNLY_APK_PATH"
test "$(shasum -a 256 "$PATTERNLY_APK_PATH" | awk '{print $1}')" = "$PATTERNLY_EXPECTED_SHA256"

# Zastąp placeholdery ścieżkami z lokalnego Android SDK.
PATTERNLY_AAPT="<ANDROID_SDK>/build-tools/<VERSION>/aapt"
PATTERNLY_APKSIGNER="<ANDROID_SDK>/build-tools/<VERSION>/apksigner"

"$PATTERNLY_AAPT" dump badging "$PATTERNLY_APK_PATH" | grep -E '^(package:|sdkVersion:|targetSdkVersion:|native-code:|launchable-activity:)'
unzip -l "$PATTERNLY_APK_PATH" | grep 'assets/index.android.bundle'

# Lokalny apksigner jest wymagany; jarsigner nie zastępuje tej weryfikacji.
if [ ! -x "$PATTERNLY_APKSIGNER" ]; then
  echo "Brak lokalnego apksigner; zatrzymaj preflight."
  exit 1
fi
if ! "$PATTERNLY_APKSIGNER" verify --verbose --print-certs "$PATTERNLY_APK_PATH"; then
  echo "apksigner nie zweryfikował APK; zatrzymaj preflight."
  exit 1
fi
```

Oczekuj package `com.lkurczab.patternly`, SDK `28`, target SDK `36`, bundla,
ABI `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`, `Verifies`, v2 `true` oraz
certyfikatu `CN=Android Debug`. Są to wartości, które właściciel musi
potwierdzić lokalnym `apksigner`; jeśli wynik nie zawiera `Verifies`, v2 `true`
oraz oczekiwanego certyfikatu, albo hash, package, bundled JS lub podpis się nie
zgadza, zatrzymaj procedurę.

### 3.2 Wykrycie urządzenia i instalacja bez kasowania danych

```sh
adb devices -l
PATTERNLY_DEVICE_SERIAL="<serial z wiersza ze stanem device>"
adb -s "$PATTERNLY_DEVICE_SERIAL" get-state

# -r zachowuje dane aplikacji; -d dopuszcza downgrade versionCode.
adb -s "$PATTERNLY_DEVICE_SERIAL" install -r -d "$PATTERNLY_APK_PATH"

adb -s "$PATTERNLY_DEVICE_SERIAL" shell pm path com.lkurczab.patternly
adb -s "$PATTERNLY_DEVICE_SERIAL" shell dumpsys package com.lkurczab.patternly | grep -E 'versionName|versionCode|codePath'
```

Nie wykonuj automatycznie `adb uninstall`: usuwa dane urządzenia. Jeśli
instalacja zwróci `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, zatrzymaj się i nie
usuwaj starego pakietu bez świadomej decyzji właściciela o utracie danych.

### 3.3 Uruchomienie standalone APK

```sh
adb -s "$PATTERNLY_DEVICE_SERIAL" shell am force-stop com.lkurczab.patternly
adb -s "$PATTERNLY_DEVICE_SERIAL" shell monkey -p com.lkurczab.patternly -c android.intent.category.LAUNCHER 1
```

Nie uruchamiaj Metro/Expo i nie używaj `adb reverse`. Brak serwera
developerskiego jest warunkiem tego testu.

### 3.4 Logcat

Uruchom filtr podczas scenariusza i zakończ go `Ctrl-C` po zebraniu dowodu:

```sh
adb -s "$PATTERNLY_DEVICE_SERIAL" logcat -v threadtime | grep -Ei 'AndroidRuntime|ReactNativeJS|Firebase|Patternly|FATAL EXCEPTION|ANR|network|SSL|auth'
```

Przed przekazaniem logów usuń tokeny, e-maile, identyfikatory kont i inne dane
użytkownika. Logcat nie zastępuje wyniku widocznego w UI ani potwierdzenia
zapisu/odczytu danych.

## 4. Checklista owner-run E2E

Kroki oznaczone `NETWORK` wymagają połączenia urządzenia z sandboxem i są
`NOT RUN` przez koordynatora.

### Start i wejście

1. `COLD LAUNCH` — po `force-stop` uruchom aplikację. Splash/loading powinien
   przejść do pierwszego ekranu bez crasha, ANR, red screenu, bundle-load
   erroru, próby użycia Metro ani nieskończonego spinnera.
2. `GUEST/ONBOARDING` — na świeżym stanie przejdź wartość Patternly, wybór
   tracka i wejście jako lokalny guest. Pierwsza wartość edukacyjna nie powinna
   wymagać rejestracji ani Premium.
3. `AUTH/ONBOARDING — NETWORK` — jeśli aktualny zakres wymaga konta, użyj
   wyłącznie testowego konta sandbox. Sprawdź success, jawny błąd sieciowy i
   brak danych produkcyjnych.

### Główny flow i trwałość

4. `MAIN FLOW` — przejdź `Today` → `Practice`, wybierz dostępny darmowy node
   i uruchom sesję. Referencyjny scenariusz istnieje w
   `.maestro/algorithms-session-dry-run-regression.yaml`: track
   `coding-interview-dsa-problem-solving`, guided practice, pytanie,
   odpowiedź, feedback `Reason`/`Details`, kolejny krok.
5. `DURABLE LOCAL WRITE/READ` — odpowiedz na pytanie i sprawdź weryfikowalny
   odczyt stanu w aktywnej sesji, Progress albo Activity. Sam komunikat
   sukcesu bez widocznego rezultatu nie wystarcza.
6. `RESTART` — wymuś zatrzymanie i uruchom ponownie. Sprawdź zachowanie
   lokalnego session/pointer lub terminalnego wyniku zgodnie z kontraktem,
   bez cichego podstawienia innej sesji.

### Sandbox, offline i błędy

7. `SANDBOX HANDSHAKE — NETWORK` — przy działającej sieci wykonaj wymagany
   account/sync flow: auth sandbox, zapis, odczyt po restarcie i retry sync.
   Potwierdź w UI/logcat, że operacja dotyczy `patternly-app-sandbox`; sama
   obecność Firebase app ID nie jest dowodem handshake.
8. `OFFLINE` — odłącz sieć lub włącz tryb samolotowy. Zakres lokalny powinien
   działać, a operacje zdalne powinny pokazać jawny `offline`, `pending`,
   `unavailable` albo retry. Nie akceptuj fałszywego sukcesu.
9. `RECOVERY — NETWORK` — przywróć sieć i sprawdź retry/synchronizację bez
   duplikowania wpisów. Niedostępny sandbox oznacz jako `BLOCKED`.
10. `LOGCAT` — potwierdź brak `FATAL EXCEPTION`, `ANR`, bundle-load erroru,
    połączenia z Metro i nieoczekiwanej produkcyjnej konfiguracji.

## 5. Kryteria zatrzymania

Wpisz `BLOCKED` albo `FAIL` i zatrzymaj test, gdy:

- hash APK różni się od `90e35f20d147aed5345e02779df680486cc49bdb3d5cf3102d0f5e1740aa3f6f`;
- package ID, Firebase sandbox identity, bundled JS lub podpis są inne niż w
  sekcji artefaktu;
- urządzenie jest `unauthorized`/`offline`, instalacja wymaga kasowania danych
  albo występuje konflikt sygnatury;
- aplikacja żąda Metro, pokazuje bundle-load error, crash, ANR, red screen,
  blank screen lub nieskończony loading;
- UI/logcat wskazuje produkcję, dane produkcyjne albo backend inny niż sandbox;
- auth/API nie przechodzi, TLS/DNS jest niedostępny, handshake nie dochodzi do
  skutku lub zapis/odczyt nie jest weryfikowalny;
- offline state udaje sukces, gubi lokalny zapis albo recovery duplikuje dane;
- rozwiązanie wymaga release secret, produkcyjnego keystore, publikacji,
  App Store, Google Play lub RevenueCat.

Zapisz ostatni udany krok, dokładny komunikat, czas, model/OS i zanonimizowany
logcat. Nie obchodź blokady przez zmianę konfiguracji na produkcyjną.

## 6. Szablon raportu właściciela

Uzupełnij po teście. Serial urządzenia może być skrócony lub zanonimizowany.

```text
Data/czas:
Urządzenie/model:
Android/API:
APK path:
APK SHA-256:
Package/application ID:
Sieć: Wi-Fi / cellular / offline case:
Sandbox identity observed:

| Krok | Expected | Actual | Result (PASS/FAIL/BLOCKED/NOT RUN) | Network? | Evidence |
|---|---|---|---|---|---|
| Hash/package/signature preflight |  |  |  | No |  |
| Install |  |  |  | No |  |
| Cold launch/loading |  |  |  | No* |  |
| Guest/onboarding |  |  |  | No* |  |
| Auth/onboarding |  |  |  | Yes |  |
| Main learning flow |  |  |  | No/Yes |  |
| Local durable write/read |  |  |  | No |  |
| Restart/resume |  |  |  | No |  |
| Sandbox network handshake |  |  |  | Yes |  |
| Offline/error/recovery |  |  |  | Yes for recovery |  |
| Logcat review |  |  |  | No |  |

Blocking issue / stop reason:
Last successful step:
Sanitized logcat/screenshot evidence:
Owner conclusion: PASS / FAIL / BLOCKED
```

`No*` oznacza brak wymogu Metro/backendu dla lokalnego guest-first startu
zgodnie z kontraktem; faktyczny cold start bez Metro na fizycznym urządzeniu
pozostaje jednak `OWNER-RUN / NOT VERIFIED`. Jeśli aktualna implementacja
zatrzyma się na sandboxie, wpisz faktyczny wynik jako `NETWORK` i nie oznaczaj
go jako `PASS`.

## 7. Definition of done MOB-012

MOB-012 można zamknąć jako `PASS`, gdy właściciel:

1. potwierdzi hash i package ID przed instalacją;
2. zainstaluje APK bez Metro na fizycznym urządzeniu;
3. przejdzie cold launch, guest/onboarding, główny flow, trwałość danych,
   restart oraz offline/error recovery;
4. wykona i udokumentuje kroki `NETWORK` z sandboxem, jeśli są wymagane;
5. dołączy zanonimizowany raport, logcat i urządzenie/OS, a każdy `NOT RUN`
   lub `BLOCKED` pozostawi jawnie oznaczony.

Stan koordynatora pozostaje: `QA verdict = PASS WITH GAPS`; `Artifact QA =
PASS` dla aktualnego SHA, natomiast device install, cold launch, ikona,
uruchomienie bez Metro, runtime E2E i backend/network handshake =
`OWNER-RUN / NOT VERIFIED`.

## Źródła

- Kontrakt guest-first i głównych flow: [`03-navigation-and-flows.md`](../03-navigation-and-flows.md).
- Referencyjny scenariusz sesji: [`algorithms-session-dry-run-regression.yaml`](../../.maestro/algorithms-session-dry-run-regression.yaml).
- Konfiguracja wariantu sandbox: [`withAndroidSandboxVariant.js`](../../plugins/withAndroidSandboxVariant.js) i [`output-metadata.json`](../../android/app/build/outputs/apk/sandbox/output-metadata.json).
- Podstawa artefaktu: re-QA przekazane przez właściciela, 2026-08-26.

Podejście: jeden kanoniczny runbook w `docs/runbooks`, bez zmian kodu i bez
uruchamiania builda, Metro, emulatora, usług, sieci lub przeglądarki. Ocena
planowanego podejścia: `0.93/1.00` (minimum z kryteriów spójności, prostoty,
ryzyka i utrzymywalności).

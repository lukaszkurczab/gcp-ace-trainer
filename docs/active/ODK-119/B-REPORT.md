# ODK-119-GATE/B — wszystkie wejścia Premium

**Status:** **PASS WITH ISSUES** według końcowego niezależnego QA
**Data:** 25 września 2026
**Zakres:** aplikacja i weryfikacja istniejącego kontraktu backendu; bez wdrożenia i bez provider E2E

## Briefing

Cel: objąć jedną regułą uprawnienia wszystkie rzeczywiste wejścia do nowej sesji Premium i nowego pobrania, bez sprawdzania Free i bez wtórnego przerywania rozpoczętej sesji. Niezależna walidacja: **APPROVE**, zgodność 0,94; prostota 0,85; kontrola ryzyka 0,84; utrzymywalność 0,89; minimum **0,84**.

## Macierz wykonywalnych wejść

| Operacja | Rzeczywiste wejście | Właściciel decyzji | Dozwolone | Odmowa / unavailable | Trwała mutacja |
| --- | --- | --- | --- | --- | --- |
| Nowa sesja Free | trzy facade rodzin → `startTrainingSession` → `TrainingLifecycleUseCases.startSession` | lifecycle klasyfikuje cały przygotowany plan | Free bez odczytu entitlementu | nie dotyczy | `mutations.start` |
| Nowa sesja Premium, także z już zainstalowanego pakietu | te same facade i ten sam lifecycle | `premiumSessionAdmission.authorize` przed zapisem | świeże online `active/grace` lub potwierdzony cache tylko przy jawnym offline | `denied` / `unavailable`, bez `mutations.start` | dopiero po `allowed` |
| Nowe pobranie opublikowanego pakietu | `AccountSessionProvider.installPremiumNodePackage` → `installPremiumNodeOffer` → API package | backend `GET /v1/content/packages/:trackId/:nodeId` i świeży RevenueCat read | `active/grace` przed expiry | 403 dla stanu negatywnego, 503 dla niedostępnego; bajty nie są czytane | aktywacja lokalnego pointera dopiero po pobraniu i weryfikacji |
| Lokalny fixture smoke | ten sam account-owned installer, lokalny transport jawnie związany z ofertą smoke | brak backendowego download admission; późniejszy start nadal przechodzi Gate A | tylko jawna oferta smoke | Gate A odmawia lub zwraca unavailable | brak startu sesji przed `allowed` |
| Resume rozpoczętej sesji | `resumeActiveTrainingSession` / facade resume | brak ponownej Gate A zgodnie z kontraktem | wcześniej trwale rozpoczęta sesja | konflikt/tożsamość/recovery według lifecycle | brak nowego startu |

## Zmiana

- Usunięto nieużywane publiczne `TrainingLifecycleUseCases.prepareSession()`, które przygotowywało sesję poza Gate A.
- Usunięto nieużywane publiczne `installAuthenticatedNodePackage()`, które otwierało ogólny aplikacyjny ingress do downloadu poza jedyną ofertą Premium.
- Dodano kontrakt skanujący produkcyjne źródła. Każda rodzina uruchamia nową sesję przez `startTrainingSession`, tylko facade aplikacyjny wywołuje lifecycle `startSession`, a package download ma jeden account-owned ingress i jeden bezpośredni konsument `getContentPackage`.
- Backend nie wymagał zmiany: endpoint wykonuje świeży odczyt RevenueCat przed odczytem pakietu; istniejący test emulatora dowodzi `active/grace`, hold/expired/refunded, błędnych dat, unavailable/throw, App Check/Auth oraz braku odczytu bajtów po odmowie.

## Weryfikacja

- Aplikacja: kontrakt wejść, Gate A lifecycle, account admission i exact Premium route — **8/8 PASS**; szerszy zestaw lifecycle/account/oferta/Metro — **27/27 PASS**.
- `npm run typecheck` — PASS; `git diff --check` — PASS.
- Backend bez zmian: testy pakietu i klienta RevenueCat **16/16 PASS**. Pierwsze bezpośrednie uruchomienie testu emulatora nie miało zmiennych hostów i jawnie zakończyło się `firebase_emulator_suite_required`; powtórka z `FIRESTORE_EMULATOR_HOST=127.0.0.1:18081`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19099` i `GCLOUD_PROJECT=patternly-local` — **1/1 PASS**.
- Auth, Firestore, API `/ready` i Metro odpowiadały. Odczyt listy urządzeń nie powiódł się przez zerwane połączenie CoreSimulatorService; slice nie wymagał nowego dowodu UI i nie utworzono drugiego urządzenia.

## Granice

Brak realnego provider/store E2E, publikacji pakietu, cloud storage i wdrożenia. Lokalny fixture nie jest treścią Premium ani dowodem admission. Rozpoczęta sesja nie jest ponownie blokowana po późniejszej utracie uprawnienia; każda nowa sesja i każde nowe zdalne pobranie przechodzą właściwy punkt kontroli.

## Końcowe QA

Niezależne `qa-gate` wydało **PASS WITH ISSUES**. Wszystkie sześć kryteriów wejść, kolejności, izolacji smoke, usunięcia martwych API, adekwatności kontraktu i zgodności raportu jest spełnionych. QA uruchomiło aktualny target 10/10, typecheck i backend unit 16/16. Nie powtarzało testu emulatora, ponieważ `clearFirestore()` czyści współdzielony emulator; controller wykonał go wcześniej 1/1. Ryzyko rezydualne pozostaje wyłącznie w realnym RevenueCat/store E2E poza zakresem lokalnego B.

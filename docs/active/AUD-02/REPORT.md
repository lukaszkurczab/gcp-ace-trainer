# AUD-02 — lokalny baseline

**Status:** partial; pierwszy slice preflight zakończony, natywny odbiór i pozostałe bramki otwarte.
**Data:** 2026-09-22

## Kontynuacja 2026-09-23

- Briefing naprawy owning validatora niezależnie zatwierdzony przez `gpt-6-luna/high`: zgodność 0,95; prostota 0,98; ryzyko 0,90; utrzymywalność 0,94; minimum **0,90**. Briefing izolacji release-manifest fixture także zatwierdzony: 0,88; 0,82; 0,81; 0,84; minimum **0,81**.
- API lokalne nie działało na początku. Auth `127.0.0.1:19099` i Firestore `127.0.0.1:18081` odpowiadały; uruchomiono backend `npm run dev:smoke` z jawnie przypiętym projektem i emulatorami. `GET http://127.0.0.1:8080/ready` zwrócił `status=ready`, database/authentication/providerReader=true. API pozostawiono działające.
- `npm run recovery:check`: PASS, 369 active source files, 201 active test files, 1073 test cases.
- `scripts/releaseManifest.test.mjs`: początkowo 0/10 z powodu brakujących `readFile` i `join` importów w `patternly-content/scripts/review/content-approval.mjs`. Po ich dodaniu ujawniło fixture zależne od brudnych rzeczywistych checkoutów. Testy zmieniono tak, by używały tymczasowych clean Git clones bieżącego HEAD z tracked worktree diff; produkcyjny gate czystości pozostał bez zmian. Zestaw końcowo **10/10 PASS**, w tym dokładne HEAD/clean checks, ACC-02/OpenAPI, CLI create/verify oraz odmowa dirty candidate. Zmiany zawiera app test `scripts/releaseManifest.test.mjs` i content owner `scripts/review/content-approval.mjs`.
- Istniejący iPhone17 potwierdzony jako booted iOS26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`. Odczyt `simctl` i native build wymagały rozszerzonego dostępu, ponieważ ograniczony proces tracił CoreSimulatorService; bez rozszerzenia status był niestabilny. Oficjalne `npm run ios:smoke -- --device <UDID>` przeszedł preflight, zbudował `Patternly` (`Build Succeeded`, 0 errors, 2 ostrzeżenia skryptów Xcode), zainstalował dev client i otworzył go na tym samym urządzeniu. Metro załadował 1703 moduły JS. Bundle `com.lkurczab.patternly`, build `1`; bieżący mobile HEAD `428445185290d546fa6de6789a323a6711e48d80`. [Screenshot smoke](../../../evidence/aud-02/ios-smoke-2026-09-23.png), SHA-256 `9352d05b182b31618e5d4ec3c95161fa660a7df848ac9ed201dedff5d5075631`.
- Lokalne RC flow wskazują zgodne IDs length 10 i feedback-after-each-answer. Próba `.maestro/rc-algorithms-bootstrap.yaml` zatrzymała się po tapnięciu guest, bo app jawnie wykrywa istniejący postęp związany z innym kontem: „This device's progress belongs to another account. Sign in with the account that owns this saved progress. Your data remains saved on this device.” Dane pozostały nietknięte. [Screenshot blokady](../../../evidence/aud-02/ios-bootstrap-owner-blocked.png), SHA-256 `62bbc256502b5c64ddf4dec3f35b758238e43ac679c1cd2f2a3eca52e47cd896`. Dalsze testy sesji wymagają dostępu do właściwego konta albo osobnej zgody na wyczyszczenie wyłącznie danych testowych; nie zastępujemy problemu resetem.
- W porządku natywnym znaleziono i usunięto dwa puste katalogi ignorowane przez Git: `ios/Patternly 2` i `ios/Pods 2` (oba 0 B). Właściwe workspace/schemat/Pods pozostały bez zmian.
- AUD-02 pozostaje `partial`: build i lokalne bramki działają, ale dokładny driver-form values i RC session flow nie są odebrane z powodu zachowanego owner mismatch. Nie czyściliśmy konta ani danych.

## Briefing i ocena

- **Cel:** przed startem Expo wykryć brak wymaganej konfiguracji lokalnego klienta oraz niedostępne lub niegotowe usługi Auth/API.
- **Ustalenia:** launcher smoke sprawdzał tylko otwarty port Auth (`GET /` bez oceny odpowiedzi), choć Firebase Auth emulator udostępnia [udokumentowany endpoint konfiguracji](https://firebase.google.com/docs/reference/rest/auth) i backend ma `GET /ready`. Runtime Firebase wymaga siedmiu pól konfiguracji. Pola konta E2E są opcjonalne przy normalnym uruchomieniu; rzeczywisty `.env.smoke.local` pozostawia je puste. Bramka release manifest nadal wymaga czystych repozytoriów i dokładnego kandydata dziewięciu tracków.
- **Podejście:** tylko launcher i jego testy; fail przed Expo, sprawdzenie Auth config oraz ograniczone czasowo oczekiwanie na `/ready`. Bez zmiany produkcyjnego App Check i bez osłabienia release gate.
- **Walidacja niezależna:** `gpt-5.6-luna`, `max`. Pierwsza wersja briefingu odrzucona (minimum 0,72) przez nieustalony kontrakt odpowiedzi i ryzyko wyścigu startu. Po doprecyzowaniu endpointu i bounded polling: zgodność 0,96; prostota 0,90; ryzyko 0,89; utrzymywalność 0,94; minimum **0,89**, zaakceptowano. Rzeczywisty profil wykazał, że wymaganie konta E2E blokowałoby dopuszczalny start gościa, więc usunięto to wymaganie przed odbiorem.

## Wynik i weryfikacja

`runLocalProfile.mjs` wymaga pól konfiguracji Firebase i projektu `patternly-app-sandbox` tylko w smoke. Auth musi zwrócić poprawną konfigurację emulatora, API `/ready` musi potwierdzić `database`, `authentication` i `providerReader`; diagnostyka nie wypisuje sekretów. Sandbox nadal odrzuca lokalne override'y.

Niezależny QA (`gpt-5.6-luna`, `max`) potwierdził PASS dla preflight. Wskazał rozjazd starego kontraktu `/ready`: runtime zwracał `providerReader`, a OpenAPI i mobilny DTO nie. Drugi, ograniczony krok uzgodnił OpenAPI, wygenerowany artefakt, DTO i dwa testowe fixture z rzeczywistą odpowiedzią. Jego briefing niezależnie oceniono: zgodność 0,98; prostota 0,98; ryzyko 0,95; utrzymywalność 0,97; minimum **0,95**.

Kolejny przegląd ujawnił, że odpowiedź 503 `/ready` nadal miała w OpenAPI schemat ogólnego błędu, choć runtime zwraca `not_ready` z tymi samymi trzema checks. Ograniczona korekta używa dla dokładnie `GET /ready`/503 schematu readiness i zachowuje `ErrorEnvelope` dla innych błędów. Briefing niezależnie oceniono: zgodność 0,98; prostota 0,95; ryzyko 0,93; utrzymywalność 0,95; minimum **0,93**.
Niezależny QA (`gpt-5.6-luna`, `max`) ponownie zwrócił PASS dla zmiany 503 po kontroli runtime injection, schematu i wygenerowanego artefaktu.

- Testy launchera: **8/8 PASS**.
- Typecheck mobile i backendu: **PASS**.
- Rzeczywisty preflight na istniejącym lokalnym Auth19099/API8080/Firestore18081: **PASS** po korekcie opcjonalnych pól E2E.
- OpenAPI generate/check: **PASS**; 56 operacji zgodnych z runtime.
- OpenAPI contract tests: **22/22 PASS**, w tym iniekcja rzeczywistej odpowiedzi 503 i walidacja jej wobec wygenerowanego schematu.
- Testy klienta API: **23/23 PASS**; testy dwóch dotkniętych obszarów konta: **42/42 PASS**.
- `recovery:check`: **FAIL** — checker wykrywa aktywne ścieżki migracji identity v2 oraz ciągi `confidence`/`retentionPassedAt` występujące w warunkach odrzucenia starego formatu. Nie wyłączono bramki; wymagane rozróżnienie aktywnego kontraktu od komentarza i jawnego odrzucenia legacy keys.
- `releaseManifest.test.mjs`: **FAIL w hooku przed testami** — fixture korzysta z bieżących katalogów backend/content i słusznie odrzuca niezapisany backend jako brudny. Nie zmieniono czystej bramki produkcyjnej; izolacja fixture pozostaje do wykonania, a aktualny AWS wymaga nowego kandydata AWS-02.
- Istniejący symulator iPhone17/iOS26.4: `simctl` w ograniczonym środowisku początkowo nie miał dostępu do CoreSimulatorService; po uruchomieniu poza tym ograniczeniem wykryto jeden już booted iPhone17 i uruchomiono istniejącą instalację `com.lkurczab.patternly` (wersja 0.1.0, build 1). [Zrzut startu](../../../../evidence/aud-02/ios-iphone17-existing-build-launch.png), SHA-256 `d1b35ab802578efcbde53fc7b3a1cb0470cb2a9d9e175e09aa199e20f729870a`, pokazuje działający ekran Start i `LOCAL_OPERATION_FAILED` rekomendacji Coding (osobne AUD-13). **Nie potwierdzono** tożsamości JS/native z aktualnym source SHA ani pełnego flow; nie instalowano drugiej kopii i nie tworzono urządzenia.

## Pozostały AUD-02

Rozliczyć recovery checker bez ukrywania aktywnej migracji, odizolować release-manifest fixture od zmian w repozytoriach, zweryfikować aktualne flow RC i formularze sterownika, a następnie przypiąć aktualny JS/native build do source SHA na istniejącym iPhonie17. Czysta bramka kandydata wymaga AWS-02; obecny zielony preflight ani launch istniejącej instalacji jej nie zastępują.

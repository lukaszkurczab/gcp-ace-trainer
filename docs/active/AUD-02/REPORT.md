# AUD-02 — lokalny baseline

**Status:** partial; pierwszy slice preflight zakończony, natywny odbiór i pozostałe bramki otwarte.
**Data:** 2026-09-22

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

# ODK-E2E-078 — raport wdrożenia obsługi naruszeń danych

Data: 2026-09-07

Status: `FIXED_PENDING_RETEST`

## Wynik

Wdrożono minimalny operacyjny proces art. 33–34 RODO: szyfrowany rejestr incydentów, jawny zegar 72 godzin, ręczne decyzje administratora, wersjonowany eksport UODO, zawiadomienia osób przez zatwierdzony Google Workspace SMTP, retencję i legal hold oraz prosty panel administracyjny. Nie dodano ekranu mobilnego ani automatycznego zgłaszania do UODO.

## Zmiany

### Backend

- moduł `src/modules/security-incidents/` z trzema niezależnymi osiami klasyfikacji i decyzji;
- serwerowy, niezmienny `awarenessAt`, `containedAt`, deadline UTC `+72 h` oraz idempotentne przypomnienia 24/48/60/70 h;
- kompletna szyfrowana ocena: skala i kategorie danych, CIA, skutki, prawdopodobieństwo, dotkliwość, containment, remediation, prevention i postmortem;
- admin-only create/list/details/action oraz audytowany odczyt dokładnej wersji eksportu UODO;
- lista i append-only audit bez dowolnego tekstu oraz danych osobowych; szczegóły są odszyfrowywane dopiero przy audytowanym odczycie;
- expected revision, idempotentne dostawy, osiągalny `unknown`, ręczne reconcile i ochrona przed wyścigiem starej decyzji/snapshotu;
- zamknięcie wymaga kompletnej oceny, decyzji i wykonania wobec każdego wymaganego odbiorcy;
- sześć lat kalendarzowych dla zminimalizowanego rejestru/sekretu/audytu od zamknięcia, rok dla artefaktów, kaskadowy legal hold i audytowane zwolnienie;
- osobny cel SMTP dla zawiadomień incydentowych, fail-closed dla placeholdera i brak automatycznych ponowień;
- ścisły OpenAPI dla wszystkich 14 akcji i zagnieżdżonych DTO, CORS POST, TTL, indeksy i runbook operacyjny.

Główne pliki: `patternly-backend/src/modules/security-incidents/contracts.ts`, `patternly-backend/src/modules/security-incidents/store.ts`, `patternly-backend/src/api/app.ts`, `patternly-backend/src/api/openapi.ts`, `patternly-backend/src/infrastructure/email/smtpPrivacyEmailSender.ts`, `patternly-backend/config/firestore-ttl.json`, `patternly-backend/firestore.indexes.json`, `patternly-backend/docs/operations.md`.

### Panel administratora

- `patternly-web/src/components/SecurityIncidentsPanel.jsx` oparty na istniejącym panelu prywatności;
- lista pokazuje tylko klasyfikację, termin 72 godzin i backendowe `nextAction`;
- szczegóły są ładowane na żądanie i czyszczone przed kolejnym odczytem;
- formularze oceny, decyzji, eksportu/dowodu UODO, zawiadomień, reconcile, legal hold i zamknięcia są ukryte warstwowo;
- pobranie eksportu używa tokenu w nagłówku, Blob i sprzątania URL;
- konflikt lub niepewny zapis blokuje kolejne mutacje do udanego odświeżenia;
- pełny wynik POST/PATCH jest jawnie redukowany przed umieszczeniem w stanie listy.

Główne pliki: `patternly-web/src/components/SecurityIncidentsPanel.jsx`, `patternly-web/src/pages/AdminPage.jsx`, `patternly-web/admin.css`, `patternly-web/scripts/admin-behavior.test.mjs`.

## Discovery, design i ocena

- decyzje i podstawy: `ODK-E2E-078-DISCOVERY.md`;
- zaakceptowany minimalny projekt: `ODK-E2E-078-ADMIN-DESIGN.md`;
- ocena po wymaganym redesignie: spójność `0.92`, prostota `0.88`, kontrola ryzyka `0.83`, utrzymywalność `0.86`; minimum `0.83`, `APPROVE`;
- ocena projektu panelu: minimum `0.84`, `APPROVE`.

Pierwsza walidacja i trzy rundy QA wykryły luki techniczne. Zostały dopisane do rejestru jako `ODK-E2E-078.1`–`078.6`, naprawione i ponownie sprawdzone.

## Weryfikacja

Backend:

- pełny suite emulatorowy po poprawkach runtime: `81/81 PASS`;
- po końcowych, wąskich poprawkach `containedAt`, `nextAction` i OpenAPI: testy incydentów/kontraktów `PASS`, typecheck `PASS`, lint `PASS`, TTL `14 policies PASS`, OpenAPI generate/check `PASS`, frontend client check `PASS`, build `PASS`;
- niezależne QA backendu: `PASS`, bez pozostałych P1 w zweryfikowanym zakresie.

Web:

- admin behavior: `34/34 PASS` w finalnym niezależnym QA;
- admin config: `3/3 PASS`;
- build: `PASS`;
- niezależne QA web: `PASS`, bez P0/P1.

Kontroler odnotował jeden przejściowy przebieg admin behavior `33/34`, w którym niepowiązany test DSAR nie zobaczył przejścia `in_review → response_ready`; natychmiastowe niezależne ponowienie zakończyło się `34/34 PASS`, więc nie potwierdzono regresji ODK078.

## Ryzyka i retest

- wymagany jest ręczny drill niskiego i wysokiego ryzyka na środowisku testowym wraz ze sprawdzeniem realnego Google Workspace SMTP;
- alias kontaktowy pozostaje placeholderem i zgodnie z decyzją blokuje realną wysyłkę do czasu uzupełnienia;
- zgłoszenie UODO pozostaje celowo ręczne; system przygotowuje i identyfikuje dokładny eksport oraz zapisuje dowód;
- przypomnienia są materializowane przy operacyjnym odczycie/akcji, dlatego runbook wymaga regularnego sprawdzania kolejki; nie wdrożono osobnego schedulera;
- nie wdrożono binarnych uploadów; dowody są ograniczonymi, szyfrowanymi artefaktami tekstowymi/JSON.

## Następne zadanie

Zgodnie z kolejnością: `ODK-E2E-066` — ujednolicenie i weryfikacja retencji danych chmurowych.

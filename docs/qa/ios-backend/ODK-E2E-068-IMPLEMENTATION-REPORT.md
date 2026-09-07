# ODK-E2E-068 — raport wdrożenia

Data: 2026-09-06
Status: `FIXED_PENDING_RETEST`

## Zmiany

- Backend udostępnia uwierzytelniony `GET /v1/account-data/export` jako wersjonowany załącznik JSON.
- Eksport rozdziela dane przenośne od kontekstu konta, ma jawny manifest danych dołączonych i pominiętych oraz nie zapisuje payloadu.
- Obowiązuje świeże uwierzytelnienie do 300 sekund, sprawdzenie unieważnienia tokenu, transakcyjny limit per konto z `Retry-After`, pełne odrzucenie po przekroczeniu limitu bajtów i `Cache-Control: private, no-store` także dla 401.
- Audyt nie zawiera payloadu, tokenu, IP ani emaila. Retencję 30 dni egzekwują repozytoryjne polityki Firestore TTL; usunięcie konta natychmiast usuwa audyty i bucket limitu.
- Historia eksportów jest deterministyczna, malejąca po czasie, bez bieżącego eksportu i ograniczona do 100 wpisów.
- Kontekst raportów przechodzi przez wspólną allowlistę, więc dodatkowe pola legacy nie trafiają do eksportu.
- Klient mobilny ma typowany kontrakt eksportu i zachowuje `Retry-After` w błędzie 429.
- Zaakceptowany minimalistyczny ekran „Dane i prywatność” pokazuje jedną akcję dla konta albo jeden publiczny kanał pomocy dla gościa; rozszerzony zakres pozostaje za „Pokaż szczegóły”.
- Eksport jest walidowany przed zapisem, trafia wyłącznie do systemowego cache pod losową nazwą bez PII, otwiera natywny arkusz i jest usuwany po każdym wyniku; bootstrap ponawia czyszczenie osieroconych plików tylko dla własnego prefiksu.
- Eksport i udostępnianie są związane z aktywnym UID, generacją sesji, ekranem i jedną kolejką poleceń wrażliwych. Zmiana konta, wylogowanie lub opuszczenie ekranu odrzucają opóźniony wynik przed arkuszem.
- Ponowne uwierzytelnienie wykorzystuje istniejący przepływ hasła, Google lub Apple i wymaga ręcznego ponowienia eksportu. 401 unieważnionej sesji nie jest mylone z wymaganiem świeżego logowania.
- Dodano jawne stany 429 z odliczaniem, 413, offline, 5xx, błędnej odpowiedzi, niedostępnego arkusza, zapisu i cleanupu oraz komunikaty VoiceOver.

## Pliki

Backend:

- `src/modules/data-export/contracts.ts`
- `src/modules/data-export/store.ts`
- `src/api/app.ts`
- `src/api/openapi.ts`
- `src/infrastructure/firestore/paths.ts`
- `src/infrastructure/firestore/stores.ts`
- `src/config/environment.ts`
- `src/modules/content-reports/contracts.ts`
- `src/modules/content-reports/store.ts`
- `src/modules/account-lifecycle/store.ts`
- `config/firestore-ttl.json`
- `scripts/check-firestore-ttl.mjs`
- `scripts/apply-firestore-ttl.mjs`
- `firestore.indexes.json`
- `openapi/patternly-v1.json`
- `tests/dataExport.test.ts`
- `tests/firestore.emulator.test.ts`
- `docs/cloud-run-manual-deploy.md`
- `docs/operations.md`

Aplikacja:

- `package.json`
- `package-lock.json`
- `src/application/account/AccountSessionProvider.tsx`
- `src/application/account/accountDataExportService.ts`
- `src/application/account/accountDataExportService.test.ts`
- `src/application/account/accountDataExportFailure.test.ts`
- `src/application/bootstrap/applicationBootstrap.ts`
- `src/features/account/AccountSecurityScreen.tsx`
- `src/features/home/YourDataScreen.tsx`
- `src/components/ListRow.tsx`
- `src/infrastructure/clients/PatternlyApiClientAdapter.ts`
- `src/infrastructure/clients/patternlyApiClient.test.ts`
- `src/application/account/accountLifecycle.test.ts`
- `src/navigation/types.ts`
- `src/locales/{pl,en}/data.json`
- `src/locales/{pl,en}/settings.json`

## Weryfikacja

- backend emulator E2E na niezależnych portach: 59/59 PASS;
- backend lint, typecheck, TTL config check, OpenAPI check, frontend client check, build i `git diff --check`: PASS;
- aplikacja po wdrożeniu UI: typecheck PASS, pełny zestaw 827/827 PASS;
- focused eksport/API/prezentacja: 33/33 PASS;
- recovery inventory, content boundary, runtime privacy boundary i `git diff --check`: PASS;
- klient API po propagacji `Retry-After`: 8/8 PASS;
- niezależny re-review (`gpt-5.6-luna`, reasoning `max`): PASS; correctness 0,94, architecture 0,90, risk control 0,88, maintainability 0,89.
- pierwsze niezależne QA iOS (`gpt-5.6-luna`, reasoning `max`) wykryło race sesji, nieobsłużone błędy pliku/tokena/5xx, zbyt płytką walidację i copy providera; braki dopisano do zakresu technicznego i usunięto;
- końcowy re-review iOS (`gpt-5.6-luna`, reasoning `max`): `PASS_WITH_GAPS`; correctness 0,92, architecture 0,91, risk control 0,88, maintainability 0,88; jedyną luką jest niewykonana walidacja natywna;
- natywny build iOS podjął trzy próby; każda zatrzymała się w istniejącym skrypcie CocoaPods `[CP-User] Build ExpoModulesJSI xcframework` (`xcodebuild` 65), zanim można było uruchomić scenariusz share sheet/VoiceOver.

## Wynik

Backend, klient iOS, ekran konta/gościa oraz mechanizm bezpiecznego pliku są wdrożone i przechodzą weryfikację automatyczną. Status pozostaje `FIXED_PENDING_RETEST`, ponieważ lokalny błąd targetu `ExpoModulesJSI` uniemożliwił dowód natywnego arkusza, VoiceOver i układu 200% w symulatorze.

## Ryzyka i warunki wdrożenia

- Przed promocją każdego projektu GCP trzeba wykonać `npm run firestore:ttl:apply -- --project <project-id>` i potwierdzić aktywne polityki TTL.
- Backend i klient mobilny muszą zostać opublikowane jako zsynchronizowany zestaw; backendowe CI sprawdza wersję klienta pobraną z gałęzi zdalnej.
- Po naprawieniu toolchainu/targetu `ExpoModulesJSI` trzeba wykonać retest w symulatorze: konto i gość, password/Google/Apple recent-auth, share/cancel/error, 429, opuszczenie ekranu, restart cleanup, VoiceOver oraz 200% tekstu.
- `firestore:ttl:apply` nie został wykonany na projekcie chmurowym; pozostaje warunkiem promocji, nie lokalnej implementacji.

## Następne zadanie

Przejść do `ODK-E2E-077` zgodnie z kolejnością realizacji; retest urządzeniowy ODK068 pozostaje jawnie zapisanym gate’em przed wydaniem.

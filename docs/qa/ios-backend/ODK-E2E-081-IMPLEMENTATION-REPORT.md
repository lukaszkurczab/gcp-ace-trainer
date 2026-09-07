# ODK-E2E-081 — raport wdrożenia rekurencyjnego purge

Status: `PASS`

Data: 2026-09-07

## Zmiany

- dodano nie-HTTP, domyślnie odczytowy purger ograniczony do `contentReports`
  oraz dokładnych `contentReports/{reportId}/audit/{auditId}`;
- expired parent jest usuwany rekurencyjnie, a orphan audit wyłącznie w
  transakcji ponownie sprawdzającej ścieżkę, aktualny termin i brak parenta;
- pełne skany mają deterministyczną paginację, osobny limit usunięć i
  idempotentny retry;
- `complete` wymaga końcowego postcondition dla stałego cutoffu: brak due
  parenta, brak due exact orphana, brak nierozstrzygniętych rekordów i brak
  pozostałej pracy wynikającej z limitu;
- privacy/security/unknown paths są poza zakresem destrukcyjnym; TTL oraz ich
  własne lifecycle/legal-hold pozostają jedynymi ownerami retencji;
- runbook rozdziela ownership ODK081 od sync, account deletion,
  `deletionRequests`, privacy i security.

## Pliki

- `patternly-backend/src/modules/retention-purge/service.ts`
- `patternly-backend/scripts/retention-purge.ts`
- `patternly-backend/tests/retentionPurge.emulator.test.ts`
- `patternly-backend/tests/retentionPurgeCli.test.ts`
- `patternly-backend/docs/retention-runbook.md`
- `patternly-backend/docs/operations.md`
- `patternly-backend/package.json`
- `patternly-backend/tests/deployment.test.ts`

## Weryfikacja

- testy celowane retention/CLI: `11/11 PASS` w niezależnym QA;
- pełny suite backendu na emulatorach: `93/93 PASS`;
- lint, typecheck, kontrola 20 polityk TTL, OpenAPI, frontend client i build:
  `PASS`;
- `git diff --check`: `PASS`;
- niezależne QA po dwóch rundach poprawek: `PASS`, brak P0/P1;
- dry-run na `patternly-app-sandbox`: `complete=true`, `remainingDue=false`,
  `unresolved=0`, parenty i audyty `0`; nie użyto `--execute` i nie zmieniono
  danych chmurowych.

Lokalna dodatkowa próba uruchomienia drugiego kompletu emulatorów nie wystartowała,
ponieważ porty `19099` i `18081` były już zajęte przez działający zestaw
deweloperski. Nie zmienia to wyniku zweryfikowanego pełnego suite wykonanego
przez implementację i niezależne QA.

## Ryzyka i ograniczenia

- Firestore TTL pozostaje usługą asynchroniczną;
- końcowy postcondition opisuje obserwację dla stałego cutoffu, nie permanentną
  blokadę nowych zapisów;
- brakujące lub niepoprawne `expiresAt` powstałe po głównym skanie nie są
  automatycznie klasyfikowane w końcowym postchecku; prawidłowy runtime nie
  tworzy takich rekordów, a kolejny pełny przebieg oznaczy je jako unresolved;
- rozszerzenie purgera na privacy/security wymaga osobnego protokołu chroniącego
  legal hold i nie jest częścią ODK081.

## Blokery

Brak. Następne zadanie w kolejności: `ODK-E2E-064`.

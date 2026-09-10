# ODK-E2E-100 — raport implementacji

## Cel

Wdrożyć trwały, atomowy i ograniczony rozmiarem model synchronizacji danych konta
oraz adopcji danych gościa. Każdy rekord zachowuje pełną tożsamość
`recordType + recordId + trackId`. Batch ma stabilny identyfikator, fingerprint i
jawny błąd. Retry po restarcie nie może utracić danych ani udawać sukcesu.

Zakres nie obejmuje VoiceOver, provider/release gate’ów ODK-E2E-082–088 i 099 ani
zadań następczych.

## Ustalenia

- Briefing przed implementacją miał sekcje `Cel`, `Ustalenia`, `Podejście`.
- Niezależny validator `gpt-5.6-luna`, effort `max`, bez narzędzi, zaakceptował
  projekt przed zmianami.
- Ocena początkowa: cel/architektura 0,92, prostota 0,82, ryzyko 0,86,
  utrzymywalność 0,84. Każda wartość była powyżej progu 0,80.
- Pierwszy niezależny QA znalazł P1 w retry batcha po częściowym ACK. Został
  usunięty: batch w całości ACK-owany jest pomijany po restarcie, a kolejny batch
  używa bieżącej zapisanej rewizji i zachowuje stabilny `batchId`.
- Końcowy niezależny QA Luna/max: `APPROVE`, P0/P1/P2 brak. Oceny: cel 0,95,
  architektura 0,91, prostota 0,85, ryzyko 0,91, utrzymywalność 0,88.
- Stan bazowy frontendowego repozytorium przed zmianą: `27b91cd`, a backendowego:
  `158e08c`. W obu repozytoriach `main` i `origin/main` były zgodne przed pracą.

## Podejście

Frontend:

- Durable plan v3 przechowuje immutable payload, kolejność, fingerprint,
  mutation ID, high-watermark i status `pending/sent/acked`.
- `splitAccountSyncBatches` liczy kanoniczne bajty UTF-8 całego envelope’u do
  512 KiB. Goal i learning plan jednego tracka pozostają razem. Pojedynczy zbyt
  duży rekord lub grupa zwraca jawny błąd.
- Retry zachowuje plan, mutation ID i payload. ACK-owane batche nie są ponownie
  wysyłane z nową rewizją.
- Klucze i fingerprinty używają canonical-json-v1 oraz pełnej tożsamości tracka.

Backend:

- Sync v3 wymaga UUID urządzenia, canonical-json-v1, session ID, batch ID,
  planVersion i high-watermark. Idempotency jest związane z kontem i fingerprintem.
- Adopcja v3 zapisuje rekordy, chunki, decyzje, wyniki i markery w kolekcjach
  potomnych. Obowiązuje limit envelope’u, limit rekordów i limit batchy Firestore.
- Promocja używa ukrytej generacji, CAS i lease. Wygasły lease można odzyskać;
  aktywny lease blokuje konkurencyjną promocję. Status wymaga zgodnego urządzenia.
- Przekroczenia rozmiaru, konflikt rewizji, konflikt generacji, niezgodny device
  i collision fingerprintu są jawne. Nie dodano atrap ani fałszywego sukcesu.
- TTL obejmuje dane sync/adoption i generacje. `syncMetadata` pozostaje poza TTL;
  odzyskiwanie lease nie wymaga automatycznego usuwania metadanych.

Zmodyfikowane repozytoria:

- frontend: `src/application/account/accountDataService.ts`,
  `src/infrastructure/clients/PatternlyApiClientAdapter.ts`,
  `src/infrastructure/identity/canonicalSerialization.ts` wraz z testami,
  `src/storage/errors.ts`, `src/storage/repositories/accountDataRepository.ts`
  wraz z testami;
- backend: `src/infrastructure/identity/canonicalJson.ts`,
  `src/modules/users/adoptionTransfer.ts`, kontrakty i store progress, routing
  API/OpenAPI, ścieżki Firestore, TTL oraz testy emulatorowe i kontraktowe.

## Weryfikacja

- Frontend `npm run qa:static`: **PASS**, 1065/1065 testów; recovery, typecheck,
  content boundary i runtime privacy boundary: PASS.
- Backend `npm test` z emulatorami Auth/Firestore: **PASS**, 134/134.
- Backend typecheck, lint, build, OpenAPI generate/check, frontend client check,
  Firestore TTL check i `git diff --check`: **PASS**.
- Focused frontend retry/storage tests: **PASS**, 31/31 w końcowym QA; lokalny
  targeted run po poprawce: 52/52.
- Maestro finalny retest: **PASS**, flow `.maestro/odk-e2e-041-guest-account-goal.yaml`,
  urządzenie `Maestro_IOS_iPhone-17_26`, iOS 26.4, 4 screenshoty. Dowód był w:
  `artifacts/maestro-screen-capture/odk-e2e-100/2026-09-10T0345Z/`.
- VoiceOver: nie uruchamiano zgodnie z zakresem.

## Ograniczenia

Retest używał lokalnych emulatorów i lokalnego dev-clienta. Nie potwierdza
providerowych TTL, App Check, SMTP, RevenueCat, ASC ani fizycznego urządzenia.
Te bramki pozostają w osobnej kolejce.

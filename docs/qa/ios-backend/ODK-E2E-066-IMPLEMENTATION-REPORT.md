# ODK-E2E-066 — raport wdrożenia

Status: `PASS`

Data: 2026-09-07

## Ocena przed wdrożeniem

- dopasowanie i spójność: `0.96`;
- prostota: `0.92`;
- kontrola ryzyka: `0.96`;
- utrzymywalność: `0.91`;
- minimum: `0.91`, niezależna walidacja `APPROVE`.

## Zrealizowana część lokalna

Backend zapisuje termin usunięcia nowych `syncOperations` i `syncMutations`
30 dni od niezmiennego czasu ich skutecznego zastosowania. Ponowienie tej samej
operacji nie przesuwa terminu. Nowe audyty zmian statusu `contentReports`
dziedziczą dokładnie termin rodzica; klasyfikacja 30/180 dni pozostaje ustalana
raz przy utworzeniu, a odłączenie konta jej nie przedłuża.

Konfiguracja Firestore zawiera dokładnie 20 polityk TTL: wcześniejsze 14 oraz
`syncOperations`, `syncMutations`, `contentReports`, `deletionProofs`,
`accountDeletionOperations` i `deletedIdentities`. Historyczna kolekcja
`deletionRequests` nie otrzymała automatycznej polityki. Kanoniczną macierz,
legacy policy i odpowiedzialność ODK-E2E-081 zapisano w backendowym
`docs/retention-runbook.md`.

QA wykryło i usunięto rozbieżność: skrypt kontroli i skrypt wdrożeniowy odrzucają
teraz tak samo każde dodatkowe pole w definicji polityki.

## Zmienione pliki

- `patternly-backend/src/modules/progress/store.ts`;
- `patternly-backend/src/modules/content-reports/store.ts`;
- `patternly-backend/config/firestore-ttl.json`;
- `patternly-backend/scripts/check-firestore-ttl.mjs`;
- `patternly-backend/scripts/apply-firestore-ttl.mjs`;
- `patternly-backend/tests/deployment.test.ts`;
- `patternly-backend/tests/firestore.emulator.test.ts`;
- `patternly-backend/docs/retention-runbook.md`.

## Weryfikacja

- pełne testy backendu z emulatorami: `82/82 PASS`;
- niezależne ponowienie testu emulatorowego: `25/25 PASS`;
- `firestore:ttl:check`: `PASS`, dokładnie 20 polityk;
- testy chmurowo-bezpieczne: `6/6 PASS`;
- typecheck, lint, OpenAPI check, frontend client check i build: `PASS`;
- niezależne QA zachowania runtime: `PASS`;
- po korekcie wskazanej przez QA ponownie: TTL check, testy chmurowo-bezpieczne,
  typecheck i lint — `PASS`.

Emulator potwierdza kontrakt writerów i idempotencję, ale nie dowodzi działania
zarządzanej usługi TTL.

## Wykonana część chmurowa

Po precyzyjnej zgodzie PO w projekcie `patternly-app-sandbox`:

1. aktywowano dokładnie 20 zatwierdzonych polityk TTL — końcowy odczyt:
   `20 ACTIVE`;
2. włączono PITR — provider zwrócił `POINT_IN_TIME_RECOVERY_ENABLED` i
   `versionRetentionPeriod: 604800s`;
3. utworzono aktywny bucket `patternly-security` w `europe-central2` z retencją
   180 dni oraz sink `patternly-security-retention` ograniczony do usługi
   `patternly-backend-sandbox` i zdarzeń ostrzegawczych/błędów,
   `account_sync_rejected`, `request_failed` i odpowiedzi HTTP 401/403;
4. przed usunięciem ponownie potwierdzono, że istnieje dokładnie jeden wygasły
   rekord `deletionRequests`, usunięto go z precondition na `updateTime`,
   potwierdzono odpowiedź 404 dla dokumentu i agregacyjny licznik kolekcji 0.

Pierwsza próba aktywacji TTL została zablokowana przed wykonaniem przez mechanizm
bezpieczeństwa, więc nie zmieniła chmury. Po uzyskaniu precyzyjnej zgody operacje
wykonano. Początkowy sekwencyjny klient został przerwany po aktywacji pierwszej
polityki i zgłoszeniu drugiej; pozostałe polityki zgłoszono asynchronicznie, bez
duplikowania aktywnych operacji, a końcowy stan zweryfikowano jako 20/20 ACTIVE.

Zmienne Privacy uzupełniono prawdziwymi wartościami: logi 30/180 dni, sync 30
dni, raporty 30/180 dni, tombstone 45 dni, dowody usunięcia 3 lata, region
`europe-central2` oraz maksymalne 7-dniowe opóźnienie PITR bez dodatkowego
harmonogramu backupu. Mobile typecheck: `PASS`. Zgodnie z decyzją PO nie dodano
walidatorów, hashy ani testów dokumentów prawnych.

## Ryzyka i następny krok

Firestore TTL działa eventual, a PITR może opóźnić fizyczne zniknięcie danych z
historii do siedmiu dni. Bucket 180 dni oraz PITR mogą zwiększyć rachunek GCP.
ODK-E2E-066 spełnia warunki `FIXED_PENDING_RETEST`. Następne zadanie w kolejności
to ODK-E2E-081: dowód rekurencyjnego purge podkolekcji i historycznych orphanów.

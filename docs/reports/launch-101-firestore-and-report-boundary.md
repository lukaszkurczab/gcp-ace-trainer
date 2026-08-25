# Launch 101 — Firestore i granica prywatności zgłoszeń

Data: 2026-08-25  
Zakres: Task 1 z `docs/launch-completion-plan.md`

## Wynik

Backend produkcyjny korzysta wyłącznie z Cloud Firestore przez Firebase Admin SDK. Mobilna aplikacja nadal komunikuje się z danymi wyłącznie przez backend HTTP; nie dodano bezpośredniego dostępu mobilnego do Firestore, dual-write, adaptera PostgreSQL/Drizzle ani warstwy zgodności.

Zgłoszenia treści mają domyślnie granicę anonimową. Automatyczny kontekst nie zawiera PII ani odpowiedzi użytkownika. Powiązanie z kontem lub kontakt e-mail są zapisywane tylko po jawnym przekazaniu odpowiednich danych przez klienta.

## Zmienione obszary

### Backend

- Dodano klienta Firebase Admin/Firestore, ścieżki kolekcji, wartości Firestore, fabrykę store’ów oraz weryfikator App Check:
  - `src/infrastructure/firestore/client.ts`
  - `src/infrastructure/firestore/paths.ts`
  - `src/infrastructure/firestore/stores.ts`
  - `src/infrastructure/firestore/values.ts`
  - `src/infrastructure/firebase/appCheckVerifier.ts`
- Przepisano store’y użytkownika, urządzeń, postępu, entitlementów, dostępu do tracków, wersji treści i zgłoszeń na Firestore.
- Synchronizacja postępu używa transakcji Firestore: odczyt stanu, sprawdzenie `expectedVersion`, zapis nowej wersji oraz zapis klucza mutacji idempotencyjnej odbywają się w jednej transakcji.
- Tożsamość jest mapowana atomowo z Firebase Auth do dokumentu użytkownika i deterministycznego mapowania providera. Usunięcie konta tworzy tombstone, usuwa mapowania i kaskadowo usuwa dokument użytkownika z podkolekcjami.
- Endpoint zgłoszeń wymaga `X-Firebase-AppCheck`, dopuszcza opcjonalny bearer token i odrzuca jawne linkowanie konta bez uwierzytelnionej tożsamości.
- Anonimowe zgłoszenia są ograniczane backendowym limitem opartym o haszowany klucz żądania. W bucketach limitu nie jest przechowywany surowy adres IP ani inny surowy klucz.
- Dodano testy Firebase Emulator Suite w `tests/firestore.emulator.test.ts` oraz rzeczywiste wsparcie emulatora Auth/Firestore w `tests/support.ts`.
- Zaktualizowano OpenAPI i konfigurację Firebase/Firestore, w tym deny-all rules oraz TTL dla `contentReports.expiresAt` i `rateLimitBuckets.expiresAt`.

### Klient mobilny

- Klient HTTP przekazuje App Check przy tworzeniu zgłoszenia i zachowuje bearer token jako opcjonalny.
- Nie dodano importów ani ścieżek bezpośredniego dostępu mobilnego do Firestore.

### Usunięte artefakty PostgreSQL/Drizzle

Usunięto konfigurację Drizzle, migracje SQL i journal, klienta/schema/store’y bazy SQL, skrypt seedujący emulator i testy zależne od migracji lub pamięciowej implementacji poprzedniego store’a. Usunięto też `drizzle-orm`, `pg`, `@types/pg` i `drizzle-kit` z manifestu oraz lockfile, a skrypty SQL/seed z pipeline’u backendu.

## Kanoniczny model Firestore

| Dane | Lokalizacja | Własność / gwarancja |
|---|---|---|
| konto | `users/{userId}` | dokument tworzony atomowo z mapowaniem Firebase Auth |
| mapowanie tożsamości | `identityMappings/{sha256(provider:subject)}` | jeden stabilny użytkownik dla providera i subjectu |
| tombstone | `deletedIdentities/{sha256(provider:subject)}` | zablokowanie odtworzenia usuniętego konta |
| postęp i mutacje | `users/{userId}/progress/*`, `users/{userId}/syncMutations/*` | CAS i idempotencja w transakcji |
| dane konta | `users/{userId}/entitlements/*`, `trackAccess/*`, `devices/*` | dostęp wyłącznie przez backend |
| wersje treści | `contentVersions/*` | odczyt bieżącej wersji przez backend |
| zgłoszenie | `contentReports/{clientSubmissionId}` | klucz klienta zapewnia deduplikację |
| limit anonimowych zgłoszeń | `rateLimitBuckets/{sha256(secret:key)}` | licznik okna bez surowego klucza |

Zgłoszenie wygasa po 30 dniach, gdy jest anonimowe, i po 180 dniach, gdy zawiera jawnie podane dane identyfikujące. Usunięcie powiązania konta usuwa `accountId`; jawnie podany kontakt pozostaje odrębnym, świadomie podanym elementem retencji.

## Weryfikacja

- `npm run typecheck` w `patternly-backend` — PASS.
- `npm run lint` w `patternly-backend` — PASS.
- `npm run build` w `patternly-backend` — PASS.
- `npm run test:emulator` w `patternly-backend` — PASS, 9/9 testów.
- Testy emulatora obejmują: mapowanie tożsamości, CAS, idempotencję równoległej synchronizacji, wymaganie App Check, redakcję danych zgłoszenia, rate limit, usunięcie danych i tombstone.
- `npm run typecheck` w `patternly` — PASS.
- `npm test` w `patternly` — PASS, 594/594 testów.
- `PATTERNLY_FRONTEND_ROOT=../patternly npm run frontend:client:check` — PASS, 8 wersjonowanych ścieżek OpenAPI.
- `npm run openapi:generate` — PASS; wygenerowany dokument zawiera zmianę kontraktu App Check i granicy zgłoszeń.
- `npm run validate:content-boundary` — PASS.
- `npm run validate:runtime-privacy-boundary` — PASS.
- `git diff --check` w obu repozytoriach — PASS.
- Kontrola pozostałości `drizzle`, `postgres`, `DATABASE_URL` i `migrations` w aktywnym kodzie, testach i konfiguracji backendu — brak wyników.

`npm run openapi:check` jest skryptem porównującym wygenerowany plik z czystym `HEAD`; w bieżącym, celowo zmienionym drzewie roboczym wykrywa właśnie oczekiwaną zmianę OpenAPI. Zgodność generatora z klientem została zweryfikowana osobno przez `frontend:client:check`.
`npm run gate:contract-change -- HEAD` odmawia przyjęcia implementacji bez zmiany kanonicznego YAML i dodanego requirement ID. Nie zmieniono YAML ani nie dodano sztucznego requirementu, ponieważ Task 1 implementuje już zatwierdzone wymagania; ten gate jest więc udokumentowany jako nieadekwatny dla tej implementacyjnej zmiany.

## Obszary nieweryfikowane

- Nie zweryfikowano prawdziwego tokenu App Check z aplikacji wobec produkcyjnego projektu Firebase; emulator potwierdza odrzucenie braku tokenu i użycie rzeczywistego weryfikatora Admin SDK.
- Nie wykonano wdrożenia Cloud Run ani testu na produkcyjnym projekcie Firebase.
- Nie potwierdzono z poziomu repozytorium produkcyjnego PITR Firestore przez 7 dni, IAM, aktywacji TTL w projekcie ani ćwiczenia odtworzenia backupu.
- Nie implementowano UI konta, panelu administratora, płatności ani stron prawnych — pozostają poza Task 1.
- Nie dodano jeszcze publicznego endpointu orkiestrującego pełne usunięcie konta; backend ma atomowy prymityw usunięcia danych użytkownika i osobną operację odlinkowania zgłoszeń, które powinny zostać spięte w przepływie konta w kolejnym tasku.

## Pozostałe ryzyka operacyjne

- Produkcja musi ustawić silny `REPORT_RATE_LIMIT_HASH_SECRET`, zakres limitu i okno oraz skonfigurować TTL/PITR w projekcie Firebase.
- App Check musi być skonfigurowany dla identyfikatorów aplikacji używanych przez klienta; bez poprawnych tokenów zgłoszenia będą odrzucane.
- `recursiveDelete` może obejmować większy zestaw dokumentów i wymaga obserwowalnego, ponawialnego przepływu usuwania przy implementacji konta.
- Retencja zależy od poprawnego wdrożenia indeksów/TTL; sama konfiguracja repozytorium nie dowodzi aktywacji ustawień w projekcie produkcyjnym.

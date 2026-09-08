# ODK-E2E-056 — plan wdrożenia po decyzji PO

Status: ACCEPTED_PENDING_IMPLEMENTATION

PO zatwierdził wariant A po audycie zbiorczym. Plan może być użyty po dojściu do zadania zgodnie z kolejnością rejestru.

## Nowe ustalenie

Obecny ekran adopcji ma jeden wybór dla wszystkich konfliktów. To jest zbyt szerokie dla celu i planu wielu tracków. Wybór musi być osobny dla każdego tracka.

Rozszerzenie listy typów rekordów może też wysłać starej wersji aplikacji nieznany typ. Dlatego rozszerzenie wymaga jawnie wersjonowanego kontraktu. Rekomendowany jest protokół v2.

Klient v1 wysyła `protocolVersion: 1` i dostaje tylko pięć typów v1. Klient v2 wysyła `protocolVersion: 2` i może dostać `goal` oraz `learning_plan`. Backend wybiera allowlistę odpowiedzi z wersji żądania. Nie wolno zwrócić nowych typów klientowi v1.

Lokalny `AccountSyncState` ma kontrolowaną migrację 1→2. Migracja zachowuje account binding, acknowledged, outbox i pending confirmation v1. Snapshot v2 powstaje dopiero po zakończeniu bieżącej operacji v1. Nieznana wersja kończy się jawnym błędem.

## Zakres aplikacji

- dodać `protocolVersion` do odczytu, sync i adoption oraz `goal` i `learning_plan` do allowlisty v2;
- serializować jeden rekord każdego typu per track;
- walidować rekord przed materializacją;
- rozszerzyć preview o `conflictGroups: { groupId, trackId, conflictIds }[]`;
- zapisać trwałe `pendingConfirmation.groupChoices` i wynikowe rozstrzygnięcia;
- pokazać wybór lokalne/konto osobno dla każdego tracka;
- przebudować lokalne reminders po materializacji planu;
- nie synchronizować `notificationId` ani zgody systemowej.

Główne pliki:

- `src/storage/repositories/accountDataRepository.ts`
- `src/infrastructure/clients/PatternlyApiClientAdapter.ts`
- `src/application/account/accountDataService.ts`
- `src/application/account/AccountSessionProvider.tsx`
- `src/features/account/AccountEntryScreen.tsx`
- repozytoria przyszłego `LearningPlan` i obecnego Goal.

## Zakres backendu

- utrzymać osobne allowlisty typów v1 i v2;
- filtrować odczyt oraz preview według jawnej wersji żądania;
- objąć nowe typy fingerprintem, CAS, preview i idempotencją;
- zwracać konflikty per typ i track;
- dodać nowe typy do eksportu i usuwania konta.

Główne pliki:

- `src/modules/progress/contracts.ts`
- `src/modules/users/merge.ts`
- `src/modules/progress/store.ts`
- `src/api/openapi.ts`
- testy merge, progress storage, eksportu i usuwania.

## Testy akceptacyjne

- brak lokalnego celu: pobranie celu konta;
- brak celu konta: wysłanie lokalnego celu;
- identyczny cel: deduplikacja bez pytania;
- konflikt jednego tracka: jeden jawny wybór;
- konflikty dwóch tracków: dwa niezależne wybory;
- konflikt celu i planu tego samego tracka: jeden spójny wybór pary;
- błąd sieci: oba źródła pozostają;
- restart: powrót do tego samego preview i wyborów;
- stary klient: nie otrzymuje nieobsługiwanego rekordu;
- reminders: lokalny schedule odpowiada wybranemu planowi.

Ten plan nie jest autoryzacją implementacji. Czeka na decyzję PO.

## Atomowość wyboru

Preview tworzy stabilne `groupId = track:<trackId>` dla konfliktów `goal` i `learning_plan`. Grupa zawiera dokładne `conflictIds` obu rekordów. Jeden wybór grupy rozwija się do rozstrzygnięcia wszystkich tych ID. Backend odrzuca brak, duplikat albo różne strony w jednej grupie. Cel i plan nie mogą pochodzić z różnych źródeł.

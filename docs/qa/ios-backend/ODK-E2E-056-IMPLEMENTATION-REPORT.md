# ODK-E2E-056 — raport discovery

Status: ACCEPTED_PENDING_IMPLEMENTATION

## Decyzja PO po audycie zbiorczym

PO zatwierdził `056=A`: atomowy wybór lokalne albo konto per track dla pary cel i plan. Licznik wcześniejszych prób pozostaje 5/5. Zadanie pozostaje aktywne do implementacji i retestu.

## Wynik przygotowania

- Zbadano lokalny GoalRecord, account sync i adopcję danych.
- Potwierdzono, że cel i plan nie są synchronizowane.
- Przygotowano cztery warianty i rekomendację.
- Bez decyzji nie można zamknąć discovery ani projektować konfliktu.
- Niezależna walidacja `gpt-5.6-luna / max`: 0,94 / 0,91 / 0,88 / 0,92. Minimum 0,88. APPROVE.
- Inspekcja ekranu wykazała jeden globalny wybór dla wszystkich konfliktów. Przygotowano bezpieczniejszy wybór per track i plan protokołu sync v2.
- Końcowe QA wykryło brak źródła revision, lifecycle propozycji, negocjacji starego klienta i atomowości pary cel+plan. Dokumenty poprawiono.

## Sprawdzone pliki

- `src/domain/goals/goalContracts.ts`
- `src/storage/repositories/goalRepository.ts`
- `src/storage/repositories/accountDataRepository.ts`
- `src/application/account/accountDataService.ts`
- `src/storage/repositories/accountDataSync.test.ts`

## Testy i E2E

Nie zmieniono runtime. `accountDataSync.test.ts`: 8/8 PASS. Test potwierdza wersje, retry i tombstones obecnych rekordów. Nie obejmuje celu ani planu i właśnie potwierdza lukę. Nie uruchamiano nowego E2E.

## Bloker

PO musi zaakceptować rekomendowany wariant A z atomowym wyborem per track albo wskazać inną regułę z `ODK-E2E-056-DISCOVERY.md`. Po 5/5 próbach nie otrzymano odpowiedzi. Zadanie pozostaje w aktywnym rejestrze.

# ODK-E2E-026 — raport discovery

Status: BLOCKED

## Wynik przygotowania

- Zbadano wszystkie rodziny tracków i profile dostępnych pakietów.
- Zapisano facts-only model propozycji.
- Zapisano priorytet due review i exact-node pool.
- Zapisano przypadki brzegowe oraz zakaz fillerów.
- Przygotowano decyzje target date, ukończenia i shortfall.
- Dodano przykłady dla wszystkich typów celu i realnych ograniczeń pakietów.
- Powiązano decyzje PO z komunikatami i stanami ekranu propozycji `ODK-E2E-027`.
- Potwierdzono, że zestawy `goalType` w rodzinach tracków nie tworzą konfliktu. Zapisano pełne mapowanie daty.
- Zapisano migrację istniejących celów self-paced z datą bez cichej utraty danych.

## Sprawdzone obszary

- `src/domain/goals/goalContracts.ts`
- `src/domain/tracks/trackAdmission.ts`
- resolver i runtime pakietów treści;
- konfiguracje trybów Coding, Design i Certification;
- sesje, próby i kolejka review;
- testy długości, shortening, package pin i selekcji.

## Walidacja

Niezależny research i walidacja: `gpt-5.6-luna / max`.

Wynik briefu: 0,93 / 0,90 / 0,80 / 0,91. Minimum 0,80. APPROVE.

Niezależna kontrola modelu po korektach: PASS. Potwierdzono klucz due review, selektory runtime, długości sesji, osobną sesję review, znaczenie `targetDate`, referencje trwałych prób i `feedbackMode` dla Custom.

## Testy i E2E

Nie zmieniono runtime. Nie uruchamiano E2E. Discovery opiera się na zweryfikowanych profilach pakietów i istniejących testach kontraktów.

## Bloker

PO musi zatwierdzić semantykę target date, regułę ukończenia i zachowanie przy shortfall. Licznik: 5/5. Brak odpowiedzi. Zadanie pozostaje w aktywnym rejestrze jako `BLOCKED`.

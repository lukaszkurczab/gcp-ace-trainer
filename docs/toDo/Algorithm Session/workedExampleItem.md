# Algorithm Session — Worked Example item

## Do zmiany

### Utworzyć wariant itemu

Ten wariant służy do prowadzenia użytkownika przez rozwiązany przykład.

Nie powinien wyglądać jak quiz-first screen. To jest guided learning screen z checkpointem, a nie pełne pytanie testowe.

## Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/algorithm_session_worked_example

## Finalny układ

Od góry:

Header - wspólny header ekranu Algorithm Session.

Progress - pojedynczy progress aktualnej sesji.

Item type label:

- `WORKED EXAMPLE`

Title:

- `Worked Example`

Problem / context card - karta z treścią zadania.

Step cards - sekwencja krótkich kart prowadzących przez rozwiązanie:

### Step 1: Detect the signal

Wyjaśnia, jaki sygnał w treści zadania prowadzi do danego wzorca.

### Step 2: Choose the pattern

Pokazuje, dlaczego wybieramy konkretny pattern, np. hash map lookup.

### Step 3: Walk through the input

Pokazuje mini trace dla przykładowego inputu.

### Step 4: Confirm complexity

Pokazuje time / space complexity i krótkie uzasadnienie.

Checkpoint - małe pytanie aktywizujące użytkownika, np.:

`Why does the hash map reduce the time complexity?`

Primary CTA:

- `Continue`

## Feedback state

Jeśli checkpoint wymaga odpowiedzi, po odpowiedzi ekran pokazuje:

- krótki feedback
- poprawne reasoning
- link / CTA do kolejnego ćwiczenia

## Uwagi UX

Worked example powinien zmniejszać obciążenie poznawcze. Nie przeładowywać ekranu kodem.

Na mobile lepiej pokazywać 2–4 zwarte kroki niż długi opis.

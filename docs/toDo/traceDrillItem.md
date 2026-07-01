# Algorithm Session — Trace Drill item

## Do zmiany

### Utworzyć wariant itemu

Ten wariant służy do przewidywania kolejnego kroku algorytmu.

To nie jest zwykły quiz. Ekran musi pokazywać aktualny stan algorytmu w czytelny sposób.

## Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/algorithm_session_trace_drill

## Finalny układ

Od góry:

Header - wspólny header ekranu Algorithm Session.

Progress - pojedynczy progress aktualnej sesji.

Item type label:

- `TRACE DRILL`

Title:

- `Trace the Algorithm`

Input card - karta z inputem, np.:

- `nums = [2, 7, 11, 15]`
- `target = 9`

State card - karta z aktualnym stanem algorytmu:

- `i = 1`
- `current = 7`
- `complement = 2`
- `seen = { 2: 0 }`

State card może używać monospaced tokenów albo code-like chips, ale nie powinna wyglądać jak pełny edytor kodu.

Question:

`What happens next?`

Answer options - selectable cards:

- `Return [0, 1]`
- `Add 7 to the map`
- `Move the left pointer`
- `Sort the array`

Primary CTA:

- `Check Step`

## Feedback state

Po odpowiedzi ekran pokazuje:

- poprawny następny krok
- dlaczego ten krok wynika ze stanu algorytmu
- jaki byłby następny stan po wykonaniu kroku

Przykład:

- `The complement 2 is already in seen, so the algorithm can return [0, 1].`
- `No need to add 7 first because the pair has already been found.`

## Uwagi UX

To jeden z najważniejszych typów itemów dla zrozumienia mechaniki algorytmu.

Nie przeładowywać state card. Pokazywać tylko wartości potrzebne do decyzji.

# Algorithm Session — Solution Comparison item

## Do zmiany

### Zachować obecny układ tylko jako wariant

Obecny ekran z podejściami A/B może zostać wykorzystany jako podstawa dla `solution_comparison`, ale nie może być domyślnym wzorcem dla wszystkich itemów algorytmicznych.

## Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/algorithm_session_solution_comparison

## Finalny układ

Od góry:

Header - wspólny header ekranu Algorithm Session.

Progress - pojedynczy progress aktualnej sesji.

Item type label:

- `SOLUTION COMPARISON`

Title:

- `Compare Approaches`

Problem / context card - karta z treścią zadania.

Approach cards - dwa podejścia pokazane jako osobne karty albo przełączane segmenty:

### Approach A

Przykład:

- `Nested Loop`
- `Check every pair`
- `Time: O(n²)`
- `Space: O(1)`

### Approach B

Przykład:

- `Hash Map`
- `Store seen values`
- `Time: O(n)`
- `Space: O(n)`

Comparison question:

`Which approach scales better and why?`

Answer area - może zawierać:

- wybór najlepszego podejścia
- wybór uzasadnienia
- krótki comparison table

Primary CTA:

- `Check Comparison`

## Feedback state

Po odpowiedzi ekran pokazuje:

- które podejście jest lepsze dla danego problemu
- trade-off time vs space
- dlaczego approach A jest słabszy
- dlaczego approach B jest lepszy lub odwrotnie, jeśli kontekst tego wymaga

## Uwagi UX

Approach A / Approach B tabs są poprawne tylko tutaj. Nie kopiować tego wzorca do `strategy_choice`, `trace_drill` ani `edge_case_drill`.

# Algorithm Session screen

## Do zmiany

### Obecny ekran jest zbyt wąski

Aktualny design ekranu algorytmicznego zakłada, że każde pytanie ma strukturę porównania dwóch podejść:

- Approach A
- Approach B
- Check Answer

To pasuje tylko do wybranych typów itemów, głównie:

- `solution_comparison`
- częściowo `complexity_check`
- częściowo `strategy_choice`

Nie pasuje natomiast do pełnego modelu nauki algorytmicznej opisanego w dokumentach 14 i 16, gdzie występują różne typy ćwiczeń:

- `approach_primer`
- `worked_example`
- `trace_drill`
- `strategy_choice`
- `complexity_check`
- `solution_comparison`
- `edge_case_drill`

W późniejszym etapie mogą dojść:

- `subgoal_ordering`
- `pseudocode_parsons`
- `faded_solution`
- `independent_attempt`
- `interview_simulation_problem`

Dlatego ekran nie powinien być projektowany jako jeden sztywny layout pytania, tylko jako wspólny shell sesji z dynamiczną częścią zależną od typu itemu.

### Zmiana nazewnictwa

Obecna nazwa `Algorithm Drill Unified` jest myląca, ponieważ ekran nie jest unified dla całego systemu, tylko reprezentuje jeden typ pytania.

Docelowo używać:

- `Algorithm Session`
- `Algorithm Session Screen`
- `Algorithm Item Shell`

Unikać:

- `Algorithm Drill Unified`
- nazw sugerujących, że każdy item jest drill-only
- nazw sugerujących, że każde pytanie porównuje dwa podejścia

### Usunąć duplikację progressu

Na obecnym ekranie progress pojawia się dwa razy:

- `ITEM 12 OF 20`
- progress bar
- ponownie `ITEM 12 OF 20`
- ponownie progress bar

Docelowo progress ma występować tylko raz, w górnej części ekranu.

### Nie traktować Approach A / Approach B jako domyślnego wzorca

Tabs / segmenty `Approach A` i `Approach B` mogą zostać tylko w wariancie `solution_comparison`.

Nie powinny pojawiać się w:

- `approach_primer`
- `worked_example`
- `trace_drill`
- `strategy_choice`
- `complexity_check`
- `edge_case_drill`

## Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/algorithm_session_system

## Finalny układ

Od góry:

Header z nazwą aplikacji - Nawigacja. Zawiera branding Patternly, ikonę aplikacji oraz opcjonalny przycisk akcji po prawej stronie, np. przejście do mapy / roadmapy / menu sesji.

Progress - pojedyncza sekcja pokazująca postęp w aktualnej sesji:

- `ITEM 12 OF 20`
- cienki progress bar
- akcent violet / blue zgodny z design systemem Patternly

Item type label - mała etykieta określająca rodzaj ćwiczenia, np.:

- `STRATEGY CHOICE`
- `TRACE DRILL`
- `COMPLEXITY CHECK`
- `SOLUTION COMPARISON`
- `EDGE CASE DRILL`
- `WORKED EXAMPLE`
- `APPROACH PRIMER`

Title - główny tytuł itemu. Powinien komunikować zadanie użytkownika, np.:

- `Choose the Right Pattern`
- `Trace the Algorithm`
- `Complexity Check`
- `Compare Approaches`
- `Find Edge Cases`

Problem / context card - wspólna karta kontekstowa. Zawiera problem, input, statement albo krótkie założenia. Dopuszczalne są inline tokeny w stylu:

- `nums`
- `target`
- `O(n)`
- `left`
- `right`
- `seen`

Dynamic interaction area - główna część ekranu zmienna zależnie od typu itemu. Może zawierać:

- wybór strategii
- wybór złożoności
- porównanie podejść
- stan algorytmu
- listę edge cases
- kroki worked example
- explanation cards

Feedback / explanation area - sekcja pojawiająca się po odpowiedzi albo w trybie nauki. Pokazuje krótkie wyjaśnienie, nie tylko informację czy odpowiedź była poprawna.

Primary CTA - główny przycisk akcji, zależny od typu itemu:

- `Check Strategy`
- `Check Complexity`
- `Check Comparison`
- `Check Step`
- `Check Edge Cases`
- `Continue`
- `Try a Quick Check`

Nawigacja - dolna nawigacja pozwalająca przenosić się między ekranami aplikacji, uniwersalna dla całej aplikacji:

- Home
- Practice
- Analytics
- Profile

## Warianty itemów

Ekran `Algorithm Session` ma obsługiwać kilka wariantów itemów. Każdy wariant korzysta z tego samego shella, ale ma inną sekcję dynamiczną.

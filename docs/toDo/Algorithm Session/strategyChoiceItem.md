# Algorithm Session — Strategy Choice item

## Do zmiany

### Utworzyć wariant itemu

Ten wariant służy do nauki rozpoznawania właściwego podejścia do problemu.

Nie powinien wyglądać jak porównanie Approach A / Approach B. Użytkownik ma wybrać strategię na podstawie sygnałów w treści zadania.

## Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/algorithm_session_strategy_choice

## Finalny układ

Od góry:

Header - wspólny header ekranu Algorithm Session.

Progress - pojedynczy progress aktualnej sesji.

Item type label:

- `STRATEGY CHOICE`

Title:

- `Choose the Right Pattern`

Problem / context card - karta z treścią zadania. Przykład:

`Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to the target.`

W treści można wyróżnić tokeny:

- `nums`
- `target`

Question - pytanie główne:

`Which strategy fits this problem best?`

Answer options - lista dużych selectable cards:

- Hash Map Lookup
- Two Pointers
- Sliding Window
- Sorting

Każda opcja powinna zawierać krótką podpowiedź / signal hint, np.:

- Hash Map Lookup — `Need fast complement lookup`
- Two Pointers — `Works well when input is sorted`
- Sliding Window — `Useful for contiguous ranges`
- Sorting — `May change index relationships`

Primary CTA:

- `Check Strategy`

## Feedback state

Po sprawdzeniu odpowiedzi ekran pokazuje:

- czy odpowiedź była poprawna
- `Detected signal`
- dlaczego właściwa strategia pasuje
- dlaczego wybrana strategia pasuje lub nie pasuje
- dlaczego przynajmniej jedna kusząca alternatywa jest słabsza

Przykładowy feedback:

- `Key signal: for each number, we need to know whether its complement was seen before.`
- `Hash map fits because it gives average O(1) lookup.`
- `Two pointers would require sorted input and can break original indices unless handled carefully.`

## Uwagi UX

Ten wariant jest kluczowy dla ścieżki algorytmicznej, bo uczy rozpoznawania wzorca, a nie tylko wykonywania procedury.

Nie dodawać zbyt wielu strategii na raz. Dla mobile optymalnie 4 opcje.

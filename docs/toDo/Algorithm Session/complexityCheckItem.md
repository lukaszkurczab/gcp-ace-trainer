# Algorithm Session — Complexity Check item

## Do zmiany

### Utworzyć wariant itemu

Ten wariant służy do oceny złożoności czasowej i pamięciowej konkretnego podejścia.

Nie powinien używać układu Approach A / Approach B, jeśli pytanie dotyczy tylko jednego podejścia.

## Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/algorithm_session_complexity_check

## Finalny układ

Od góry:

Header - wspólny header ekranu Algorithm Session.

Progress - pojedynczy progress aktualnej sesji.

Item type label:

- `COMPLEXITY CHECK`

Title:

- `Complexity Check`

Problem / context card - karta z treścią zadania.

Approach summary card - krótki opis analizowanego podejścia, np.:

`Use a hash map to store previously seen values. For each number, check whether target - current exists in the map.`

Answer area - dwie sekcje wyboru:

### Time Complexity

Selectable pills/cards:

- `O(1)`
- `O(log n)`
- `O(n)`
- `O(n log n)`
- `O(n²)`

### Space Complexity

Selectable pills/cards:

- `O(1)`
- `O(log n)`
- `O(n)`
- `O(n log n)`
- `O(n²)`

Primary CTA:

- `Check Complexity`

## Feedback state

Po odpowiedzi ekran pokazuje:

- correct time complexity
- correct space complexity
- krótkie uzasadnienie

Przykład:

- `Time: O(n), because each element is visited once.`
- `Space: O(n), because in the worst case the hash map stores nearly all values.`

## Uwagi UX

Feedback nie może ograniczać się do pokazania poprawnych wartości. Użytkownik musi zobaczyć powód, ponieważ celem jest nauczenie analizy złożoności, a nie zgadywanie notacji.

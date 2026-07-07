# Arrays and strings — Indexed scan / boundary reasoning hardening

## Cel

Doprowadzić grupę **Indexed scan / boundary reasoning** do **34 aktywnych pytań**.

Ta grupa ma uczyć nie tylko „czytać `i - 1` bez crasha”, ale pełnego modelu:

- rozpoznanie lokalnego scanowania sąsiedztwa,
- dobór bezpiecznych granic pętli,
- diagnoza off-by-one na początku i końcu zakresu,
- śledzenie indeksu w przód, wstecz i po zakresie wewnętrznym,
- odróżnienie problemów o oryginalnym sąsiedztwie od sortowania, liczenia i all-pairs.

Nie dodajemy oznaczeń typu temporary/coverage/future. Każde pytanie ma być normalnym aktywnym elementem kanonicznej bazy.

---

## Docelowy rozkład atomów

Docelowo ta grupa powinna mieć 34 pytania:

| Atom                      | Docelowo | Rola                                                                                        |
| ------------------------- | -------: | ------------------------------------------------------------------------------------------- |
| `track_index_boundary`    |       14 | Bezpieczne zakresy indeksów dla `i - 1`, `i + 1`, offsetów i obu sąsiadów.                  |
| `recognize_adjacent_scan` |        8 | Rozpoznanie, że problem dotyczy lokalnych sąsiadów, nie globalnego reorder/count/all-pairs. |
| `diagnose_off_by_one`     |        7 | Diagnoza konkretnego błędu w kodzie, warunku, starcie, końcu albo refactorze.               |
| `trace_scan_index`        |        5 | Śledzenie kolejnego indeksu i zakresu pracy w konkretnym stanie pętli.                      |
| **Razem**                 |   **34** |                                                                                             |

Uwaga: `derive_time_complexity` i `derive_space_complexity` mogą występować jako secondary skill atoms, ale w tej grupie nie powinny dominować jako primary. Pytania complexity mają wzmacniać model scanowania, nie tworzyć osobny blok complexity.

---

## Co zmieniamy

Najważniejsza zmiana: część pytań ma teraz zły albo zbyt ogólny `primarySkillAtomId`. `track_index_boundary` jest używany jako worek na cały indexed-scan obszar. Trzeba przepiąć część pytań pod dokładniejsze atomy.

### Zmiany primary skill atom

| ID                                 | Obecnie                                                                    | Zmienić na                | Powód                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `alg-array-string-trace-index-001` | `track_index_boundary`                                                     | `trace_scan_index`        | Pytanie sprawdza następny krok trace’u, nie samo rozpoznanie boundary.                                        |
| `alg-prod-array-string-026`        | `diagnose_off_by_one` lub `track_index_boundary` zależnie od obecnego kodu | `diagnose_off_by_one`     | To diagnoza błędnego kodu z `i = 0` i `i <= s.length`.                                                        |
| `alg-prod-array-string-034`        | `track_index_boundary`                                                     | `diagnose_off_by_one`     | Pytanie diagnozuje konkretny unsafe inclusive end bound.                                                      |
| `alg-prod-array-string-035`        | `track_index_boundary`                                                     | `trace_scan_index`        | Użytkownik musi prześledzić, czy pętla w ogóle uruchamia się dla długości 0/1.                                |
| `alg-prod-array-string-040`        | `track_index_boundary`                                                     | `diagnose_off_by_one`     | To wybór testu ujawniającego boundary bug.                                                                    |
| `alg-prod-array-string-041`        | `track_index_boundary`                                                     | `diagnose_off_by_one`     | Analogicznie: test case dla end-boundary bug.                                                                 |
| `alg-prod-array-string-045`        | `track_index_boundary`                                                     | `diagnose_off_by_one`     | To diagnoza błędnego while loop, nie ogólny boundary atom.                                                    |
| `alg-prod-array-string-046`        | `track_index_boundary`                                                     | `diagnose_off_by_one`     | To refactor błędnego previous-neighbor loop.                                                                  |
| `alg-prod-array-string-047`        | `track_index_boundary`                                                     | `diagnose_off_by_one`     | To refactor błędnego next-neighbor loop.                                                                      |
| `alg-prod-array-string-050`        | `track_index_boundary`                                                     | `trace_scan_index`        | Pytanie testuje ruch po safe interior range.                                                                  |
| `alg-prod-array-string-013`        | `recognize_adjacent_scan`                                                  | zostawić                  | Dobre primary: sorting niszczy oryginalną adjacency.                                                          |
| `alg-prod-array-string-042`        | `track_index_boundary`                                                     | `recognize_adjacent_scan` | Główna decyzja: adjacent scan checks every pair once. Complexity jest secondary.                              |
| `alg-prod-array-string-017`        | `derive_time_complexity`                                                   | `recognize_adjacent_scan` | Pytanie mierzy koszt błędnego all-pairs rozwiązania dla lokalnej adjacency. Complexity powinno być secondary. |

---

## Co zostawiamy bez większych zmian

Te pytania są wartościowe i powinny zostać w tej grupie po ewentualnym doprecyzowaniu atomów secondary.

### Core boundary drills

- `alg-array-string-naming-001`
- `alg-array-string-edge-neighbor-001`
- `alg-prod-array-string-032`
- `alg-prod-array-string-033`
- `alg-prod-array-string-036`
- `alg-prod-array-string-037`
- `alg-prod-array-string-038`
- `alg-prod-array-string-039`
- `alg-prod-array-string-044`
- `alg-prod-array-string-048`
- `alg-prod-array-string-049`

### Common mistake / off-by-one drills

- `alg-prod-array-string-026`
- `alg-prod-array-string-034`
- `alg-prod-array-string-040`
- `alg-prod-array-string-041`
- `alg-prod-array-string-045`
- `alg-prod-array-string-046`
- `alg-prod-array-string-047`

### Trace drills

- `alg-array-string-trace-index-001`
- `alg-prod-array-string-035`
- `alg-prod-array-string-050`

### Adjacent scan recognition / anti-overengineering

- `alg-prod-array-string-001`
- `alg-prod-array-string-013`
- `alg-prod-array-string-017`
- `alg-prod-array-string-042`

---

## Co doprecyzować w istniejących pytaniach

### 1. Ujednolicić język „safe index” vs „valid pair”

W pytaniach boundary trzeba konsekwentnie rozróżniać:

- **safe current index** — indeks `i`, dla którego wszystkie odczyty w body są bezpieczne,
- **valid adjacent pair** — para, którą zadanie rzeczywiście chce sprawdzić,
- **loop condition** — warunek, który obejmuje wszystkie valid pairs i nie czyta poza zakresem.

Przykład dobrego stylu:

> The last safe current index is `arr.length - 2`, so `i < arr.length - 1` checks the final pair without reading past the end.

Tego stylu używać konsekwentnie w feedbackach.

---

### 2. Nie mieszać „bug in JS behavior” z modelem indeksowania

W JS `s[-1]` zwraca `undefined`, a nie rzuca wyjątek. W pytaniach nie należy pisać, że zawsze „crashuje”.

Lepsze sformułowania:

- „reads before the string”
- „invalid previous-neighbor read”
- „unsafe in this reasoning model”
- „outside the valid index range”

Unikać:

- „throws”
- „crashes”
- „runtime error”

chyba że konkretne pytanie dotyczy języka, który rzeczywiście rzuca błąd dla takiego odczytu.

---

### 3. Complexity pytania mają wzmacniać adjacency, nie być osobnym mini-kursem

Pytania:

- `alg-prod-array-string-001`
- `alg-prod-array-string-017`
- `alg-prod-array-string-042`

zostają w tej grupie, ale ich feedback powinien zawsze mówić, że complexity wynika z lokalnej adjacency:

- one pass,
- each adjacent pair once,
- no all-pairs,
- constant auxiliary state.

Nie dodawać tutaj rozbudowanych complexity tradeoffów. To należy do osobnego bloku complexity.

---

## Co dodajemy

Po usunięciu 3 pytań i zachowaniu/przemapowaniu istniejących pozycji grupa potrzebuje **9 nowych pytań**, żeby dojść do 34 aktywnych elementów.

Poniżej nie ma pełnego JSON-a. To spec dla człowieka, który ma dopisać pytania w istniejącym formacie.

---

### Add 1 — Recognize adjacent-pair traversal from wording

**Proponowane ID:** `alg-prod-array-string-051`  
**Type:** `approach_naming`  
**Primary atom:** `recognize_adjacent_scan`  
**Secondary atoms:** `track_index_boundary`  
**Difficulty:** `easy`

Prompt:

> A task asks you to inspect every neighboring pair in an array and count how many pairs match a condition. Which mechanics best describe the work?

Correct:

- single left-to-right scan
- compare current value with adjacent value
- protect the boundary at one end

Distractors:

- compare every pair of values
- sort the array first
- build a frequency table

Cel:

- Wzmocnić rozpoznanie „neighboring pair” jako local adjacency.
- To nie powinno być kolejne pytanie o sam warunek `i < length - 1`.

---

### Add 2 — Distinguish adjacent duplicate from duplicate anywhere

**Proponowane ID:** `alg-prod-array-string-052`  
**Type:** `solution_comparison`  
**Primary atom:** `recognize_adjacent_scan`  
**Secondary atoms:** `diagnose_order_destroying_transform`  
**Difficulty:** `medium`

Prompt:

> A task asks whether any value is equal to the value immediately next to it. Why is a frequency map not the direct solution?

Correct answer:

> A frequency map can detect repeated values anywhere, but it does not preserve whether the repeats are adjacent in the original order.

Distractors:

- frequency map is always slower than scanning
- frequency map cannot store numbers
- adjacency requires sorting first

Cel:

- Zamknąć lukę między „duplicate anywhere” i „adjacent duplicate”.
- To jest bardzo ważne, bo learnerzy często mylą duplicate detection z adjacent duplicate detection.

---

### Add 3 — Count number of adjacent pairs

**Proponowane ID:** `alg-prod-array-string-053`  
**Type:** `single_choice` albo `state_selection`  
**Primary atom:** `recognize_adjacent_scan`  
**Secondary atoms:** `track_index_boundary`  
**Difficulty:** `easy`

Prompt:

> An array has length `n`. A loop compares each element with the next element. How many adjacent pairs exist?

Correct:

> `n - 1` pairs, when `n > 0`.

Distractors:

- `n`
- `n + 1`
- `n * n`
- always 0 for boundary safety

Cel:

- Zbudować mentalny model liczby porównań.
- To pomaga później przy loop bounds i complexity.

Uwaga:

- Feedback musi wyjaśnić, że boundary-safe loop nie „traci” pary; po prostu nie używa ostatniego elementu jako current index dla `i + 1`.

---

### Add 4 — Trace next index in a next-neighbor scan

**Proponowane ID:** `alg-prod-array-string-054`  
**Type:** `trace_next_step`  
**Primary atom:** `trace_scan_index`  
**Secondary atoms:** `track_index_boundary`, `recognize_adjacent_scan`  
**Difficulty:** `easy`

Prompt:

> You scan a 6-element array with `i < arr.length - 1` and compare `arr[i]` with `arr[i + 1]`. You just processed `i = 2`. What is the next current index?

Correct:

> Move to `i = 3`.

Distractors:

- jump to `i = 5`
- stop because `i + 1` was already read
- move back to `i = 1`

Cel:

- Obecnie jest trace dla previous-neighbor scan. Brakuje analogicznego trace dla next-neighbor scan.

---

### Add 5 — Trace reverse scan movement without duplicating reverse boundary

**Proponowane ID:** `alg-prod-array-string-055`  
**Type:** `trace_next_step`  
**Primary atom:** `trace_scan_index`  
**Secondary atoms:** `diagnose_off_by_one`  
**Difficulty:** `medium`

Prompt:

> A reverse loop checks adjacent pairs by comparing `arr[i]` with `arr[i - 1]` and continues while `i > 0`. In a 5-element array, it just processed `i = 3`. What is the next safe current index?

Correct:

> Move to `i = 2`.

Distractors:

- move to `i = 4`
- stop because a previous value was read
- move to `i = 0`

Cel:

- Zachować reverse-scan coverage bez dokładania kolejnego czystego pytania o start/condition.
- Uczy ruchu indeksu, nie tylko boundary expression.

---

### Add 6 — Diagnose skipped final adjacent pair

**Proponowane ID:** `alg-prod-array-string-056`  
**Type:** `common_mistake_diagnosis`  
**Primary atom:** `diagnose_off_by_one`  
**Secondary atoms:** `track_index_boundary`, `recognize_adjacent_scan`  
**Difficulty:** `medium`

Prompt:

> A loop compares `arr[i]` with `arr[i + 1]`, but uses `i < arr.length - 2`. What bug does this create?

Correct:

> It is safe, but it skips the final valid adjacent pair.

Distractors:

- it reads past the end
- it compares every pair
- it requires a frequency map

Cel:

- Obecne pytania mocno ćwiczą „unsafe read”, ale mniej ćwiczą drugi typ boundary błędu: zbyt ostrożny warunek, który pomija valid work.

---

### Add 7 — Diagnose skipped first adjacent pair

**Proponowane ID:** `alg-prod-array-string-057`  
**Type:** `common_mistake_diagnosis`  
**Primary atom:** `diagnose_off_by_one`  
**Secondary atoms:** `track_index_boundary`, `recognize_adjacent_scan`  
**Difficulty:** `medium`

Prompt:

> A loop compares `arr[i]` with `arr[i + 1]`, but starts at `i = 1`. What work is skipped?

Correct:

> The adjacent pair at indexes 0 and 1 is skipped.

Distractors:

- the last pair is skipped
- the loop reads before the array
- every pair is still checked

Cel:

- Uczy, że boundary-safe nie znaczy complete.
- Dobrze kontrastuje z previous-neighbor access, gdzie start at 1 jest poprawny.

---

### Add 8 — Both-side neighbor scan on too-short input

**Proponowane ID:** `alg-prod-array-string-058`  
**Type:** `edge_case_drill`  
**Primary atom:** `track_index_boundary`  
**Secondary atoms:** `trace_scan_index`  
**Difficulty:** `medium`

Prompt:

> A loop needs to read both `arr[i - 1]` and `arr[i + 1]`. What should happen for an array of length 2?

Correct:

> There is no safe interior current index, so the loop should not run.

Distractors:

- process index 0
- process index 1
- process both indexes with guards removed
- sort first

Cel:

- Uzupełnia `alg-prod-array-string-049` i `050`.
- Obecnie jest range/interior trace, ale brakuje krótkiego inputu dla both-side neighbor.

---

### Add 9 — Identify all indexed expressions before choosing bounds

**Proponowane ID:** `alg-prod-array-string-059`  
**Type:** `approach_naming` albo `state_selection`  
**Primary atom:** `track_index_boundary`  
**Secondary atoms:** `diagnose_off_by_one`  
**Difficulty:** `medium`

Prompt:

> Before choosing loop bounds for a scan, what should you inspect in the loop body?

Correct:

> Every indexed expression, such as `i - 1`, `i`, and `i + 1`, because the safe range must satisfy all of them.

Distractors:

- only the array length
- only the first value
- only whether values are sorted
- only whether duplicates exist

Cel:

- Dodać metapoziom: najpierw lista indexed expressions, potem safe range.
- To dobrze spina pytania o previous, next, two-step i both-side reads.

---

## Stan po zmianach

Po wykonaniu powyższych zmian:

- Usunięte: 3 pytania.
- Zachowane/przemapowane: około 25 pytań z obecnej grupy.
- Dodane: 9 pytań.
- Finalnie: **34 pytania** w grupie Indexed scan / boundary reasoning.

Docelowy rozkład:

| Atom                      | Liczba |
| ------------------------- | -----: |
| `track_index_boundary`    |     14 |
| `recognize_adjacent_scan` |      8 |
| `diagnose_off_by_one`     |      7 |
| `trace_scan_index`        |      5 |
| **Razem**                 | **34** |

---

## Kryteria jakości dla tej grupy

Każde pytanie w tej grupie powinno przejść poniższy checklist.

### 1. Pytanie testuje jedną decyzję

Dobre:

- „Który warunek chroni `arr[i + 1]`?”
- „Co jest pomijane przez `i < arr.length - 2`?”
- „Dlaczego sorting psuje adjacency?”

Słabe:

- pytanie jednocześnie o sorting, complexity, edge case, refactor i test case.

---

### 2. Distraktory reprezentują realne błędy

Preferowane distraktory:

- sorting jako order-destroying transform,
- frequency map jako global multiplicity instead of local adjacency,
- all-pairs as over-solving,
- start/end off-by-one,
- safe but incomplete loop bounds.

Unikać losowych distraktorów, które nie wynikają z częstych błędów learnera.

---

### 3. Feedback rozdziela correctness od performance

Przykład:

> Sorting is not mainly wrong because it is slower. It is wrong because it changes the original neighbor relationships.

To jest ważny wzorzec dla całego bloku.

---

### 4. Boundary feedback wskazuje konkretny indeks

Feedback powinien mówić dokładnie, gdzie pojawia się problem:

- `i = 0` makes `s[i - 1]` read before the string.
- `i = arr.length - 1` makes `arr[i + 1]` read past the array.
- `i < arr.length - 2` stops too early and skips the final valid pair.

Unikać ogólnego „off by one error” bez trace’u.

---

## Kolejność pracy

1. Usunąć 3 wskazane pytania.
2. Przepiąć `primarySkillAtomId` według tabeli zmian.
3. Sprawdzić, czy `taxonomyRefs` zgadzają się z nowym primary atomem.
4. Dodać 9 nowych pytań.
5. Uruchomić walidację contentu.
6. Przejrzeć sesję 40 pytań i sprawdzić, czy grupa nie jest monotonna.
7. Dopiero po tym przejść do kolejnego bloku: frequency / multiplicity reasoning.

---

## Ryzyka

### Ryzyko 1: grupa nadal będzie zbyt monotonna

Jeżeli po dodaniu pytań sesja losuje zbyt dużo wariantów `i - 1` / `i + 1`, trzeba ograniczyć liczbę podobnych boundary drills w jednej sesji na poziomie selekcji, ale nie przez oznaczanie pytań jako tymczasowe.

### Ryzyko 2: atomy staną się zbyt drobne

Nie dodawać nowych atomów typu:

- `previous_neighbor_boundary`
- `next_neighbor_boundary`
- `reverse_scan_boundary`
- `two_step_offset_boundary`

To są warianty `track_index_boundary`, nie osobne atomy.

### Ryzyko 3: complexity zdominuje scan group

Jeżeli dodawane pytanie zaczyna uczyć głównie Big-O, przenieść je do complexity block albo ustawić complexity jako secondary, nie primary.

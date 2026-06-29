# 16 — LeetCode-like Learning System

## Status dokumentu

Ten dokument projektuje osobny system nauki dla **LeetCode-like / Algorithms Interview Track** w Patternly.

Dokument rozwija decyzje z:

- `14-learning-effectiveness-model.md`,
- `15-certification-track-learning-system.md`,
- `00-overview.md`,
- `01-product-definition.md`,
- `03-navigation-and-flows.md`,
- `04-data-model.md`,
- `07-content-guidelines.md`,
- `10-roadmap.md`,
- `12-testing-strategy.md`.

Zakres dokumentu jest celowo oddzielony od ścieżek certyfikacyjnych. Certyfikacje sprawdzają rozumienie domeny, usług, konfiguracji i scenariuszy. LeetCode-like learning sprawdza inny typ kompetencji: rozpoznanie struktury problemu, dobór strategii, analizę złożoności, edge cases i implementację.

## Decyzja nadrzędna

LeetCode-like track w Patternly nie powinien być bankiem zadań ani prostym katalogiem wzorców.

Powinien być **algorithmic problem-solving trainer**, którego celem jest nauczyć użytkownika przechodzenia przez pętlę:

```txt
zrozumienie problemu
  ↓
identyfikacja ograniczeń i sygnałów
  ↓
wybór podejścia
  ↓
uzasadnienie wyboru
  ↓
analiza złożoności
  ↓
przejście przez przykład / trace
  ↓
implementacja lub pseudokod
  ↓
test edge cases
  ↓
porównanie z alternatywami
  ↓
review słabych mechanizmów
```

W MVP Patternly nie musi być pełnym edytorem kodu. Może być skutecznym trenerem decyzji algorytmicznych, o ile wymaga aktywnej próby i zapisuje diagnostyczne dane o błędach.

---

# 1. Fundament badawczy dla LeetCode-like learning

## 1.1. Wniosek główny

Intuicja, że użytkownik powinien najpierw nauczyć się, **jak wyglądają poszczególne podejścia**, a dopiero potem **kiedy które stosować**, jest zasadniczo trafna.

Wymaga jednak doprecyzowania:

```txt
Nie: teoria podejścia → quiz z rozpoznawania

Lepiej:
mechanika podejścia
  ↓
trace na przykładzie
  ↓
subgoals / kroki rozwiązania
  ↓
częściowo uzupełnione rozwiązanie
  ↓
samodzielny wybór podejścia w podobnym problemie
  ↓
kontrast z podobnym, ale innym podejściem
  ↓
mieszane zadania bez jawnej etykiety wzorca
```

Powód: użytkownik może zapamiętać etykietę `sliding window`, ale nie zbudować modelu mentalnego, który pozwala odróżnić sliding window od two pointers, prefix sums albo hash map.

## 1.2. Worked examples i cognitive load

Badania nad worked examples i cognitive load theory wskazują, że początkujący uczą się skuteczniej, gdy najpierw widzą dobrze opisany przykład rozwiązania, zamiast od razu rozwiązywać pełny problem samodzielnie. Worked examples zmniejszają obciążenie poznawcze na etapie, gdy użytkownik nie ma jeszcze schematów w pamięci długotrwałej.

Implikacja dla Patternly:

- początkujący użytkownik nie powinien zaczynać od pełnego kodowania problemu,
- każdy nowy wzorzec powinien mieć `Approach Primer` i `Worked Example`,
- worked example musi być aktywne: użytkownik ma przewidywać kolejny krok, złożoność albo powód użycia struktury danych.

Źródła:

- Sweller / Renkl / cognitive load theory — worked-example effect.
- Atkinson, Derry, Renkl, Wortham — learning from examples.
- Renkl — faded worked examples i self-explanation.

## 1.3. Fading i expertise reversal

Worked examples tracą skuteczność, gdy użytkownik staje się bardziej zaawansowany. Wtedy pełne przykłady mogą być redundantne i spowalniać naukę. Dlatego system musi stopniowo wycofywać pomoc.

Implikacja:

```txt
novice:
  worked examples + trace + subgoals

beginner/intermediate:
  faded examples + partial pseudocode + strategy choice

intermediate:
  contrast practice + independent attempts

advanced:
  mixed practice + time/complexity pressure + solution comparison
```

Nie należy pokazywać każdemu użytkownikowi tej samej ścieżki z tą samą ilością teorii.

## 1.4. Subgoal labeling

Subgoal labeling polega na nazywaniu grup kroków w rozwiązaniu, np.:

```txt
1. Build frequency map
2. Scan and consume counts
3. Validate required condition
4. Return result
```

Badania nad subgoal labeling wskazują, że takie etykiety pomagają użytkownikom odróżnić strukturę rozwiązania od przypadkowych szczegółów konkretnego problemu. To jest szczególnie ważne w algorytmach, gdzie użytkownicy często zapamiętują rozwiązanie konkretnego zadania, ale nie przenoszą go na wariant.

Implikacja:

Każdy worked example i guided attempt powinien mieć subgoals. Subgoals nie są ozdobnikiem UI; są jednostką nauki.

## 1.5. Parsons problems i scaffolded coding

Badania z computing education pokazują, że Parsons problems — układanie pomieszanych fragmentów kodu lub pseudokodu — mogą działać jako pomost między czytaniem gotowego rozwiązania a samodzielnym pisaniem kodu. Nowsze prace pokazują też wartość faded Parsons i pseudocode Parsons jako scaffoldu dla zrozumienia struktury i wysokopoziomowego reasoning.

Implikacja dla Patternly:

W MVP warto dodać typ zadań:

```txt
pseudocode_ordering
code_block_ordering
subgoal_ordering
fill_missing_step
faded_solution
```

To może być lepsze mobilnie niż pełny edytor kodu, bo pozwala ćwiczyć konstrukcję rozwiązania bez dużego tarcia inputu na telefonie.

## 1.6. Computational thinking

Badania nad computational thinking wskazują, że poprawność problemów programistycznych jest powiązana z obecnością umiejętności takich jak:

- algorithmic thinking,
- abstraction,
- decomposition,
- evaluation,
- generalization.

W praktyce użytkownicy często mają problem nie tylko z kodem, ale z planem, rozbiciem problemu i oceną rozwiązania.

Implikacja:

Patternly powinno oceniać nie tylko `correct answer`, ale też:

- czy użytkownik poprawnie rozłożył problem,
- czy wybrał właściwy invariant,
- czy poprawnie ocenił constrainty,
- czy umie uogólnić rozwiązanie na wariant,
- czy sprawdził edge cases.

---

# 2. Jak dzielimy materiał

## 2.1. Problem z prostym podziałem po data structures

Nie należy dzielić materiału wyłącznie tak:

```txt
Arrays
Strings
Hash Maps
Trees
Graphs
Dynamic Programming
```

Taki podział jest przydatny, ale niewystarczający. Zadanie z tablicami może wymagać sliding window, prefix sums, sorting, binary search albo hash map. Z kolei dynamic programming może wystąpić na stringach, tablicach, grafach albo drzewach.

LeetCode-like learning wymaga podziału wielowymiarowego.

## 2.2. Docelowa struktura materiału

Dla LeetCode-like track używamy poziomów:

```txt
Algorithm Track
  ↓
Learning Stage
  ↓
Pattern Family
  ↓
Pattern Variant
  ↓
Problem Archetype
  ↓
Skill Atom
```

Dodatkowo każdy item powinien mieć tagi:

```txt
Data Structure
Input Shape
Constraint Signal
Decision Signal
Complexity Target
Implementation Risk
Mistake Type
Difficulty
Prerequisites
```

## 2.3. Algorithm Track

`Algorithm Track` to pełna ścieżka przygotowania do problem solvingu algorytmicznego.

Przykłady:

```txt
algorithms-interview-core
frontend-algorithms-interview
backend-algorithms-interview
faang-style-algorithms
```

W MVP rekomendowany jest jeden generyczny track:

```txt
algorithms-interview-core
```

Nie należy nazywać modelu `LeetCodeTrack` w kodzie domenowym, jeżeli aplikacja nie integruje się bezpośrednio z LeetCode. Lepsze nazwy:

```ts
type AlgorithmTrack = Track & {
  category: 'algorithmic_problem_solving';
  interviewFocus?: 'general' | 'frontend' | 'backend' | 'mobile' | 'competitive';
  contentVersion: ContentVersion;
};
```

## 2.4. Learning Stage

`Learning Stage` określa, jaki typ pracy poznawczej wykonuje użytkownik.

Rekomendowane etapy:

```txt
1. Foundations
2. Pattern Mechanics
3. Guided Application
4. Strategy Selection
5. Contrast Practice
6. Independent Attempt
7. Mixed Interview Practice
```

### 2.4.1. Foundations

Cel: użytkownik rozumie podstawowe pojęcia potrzebne do oceny rozwiązania.

Przykładowe obszary:

```txt
Big O
input size constraints
arrays and strings operations cost
hash map/set operations
recursion basics
call stack
sorting cost
space complexity basics
```

Tu nie chodzi jeszcze o wybór patternu. Chodzi o to, żeby użytkownik rozumiał, dlaczego O(n²) odpada przy `n = 100000`.

### 2.4.2. Pattern Mechanics

Cel: użytkownik rozumie, jak działa podejście.

Przykład dla sliding window:

```txt
- czym jest window,
- kiedy przesuwamy prawą granicę,
- kiedy przesuwamy lewą granicę,
- jaki invariant utrzymujemy,
- jakie dane aktualizujemy przy wejściu/wyjściu elementu,
- dlaczego każdy element jest przetwarzany ograniczoną liczbę razy,
- skąd bierze się O(n).
```

To jest etap zgodny z Twoją intuicją: najpierw uczymy mechaniki podejścia.

### 2.4.3. Guided Application

Cel: użytkownik stosuje znane podejście w problemie, który ma częściową strukturę.

Typowe itemy:

```txt
trace_next_step
fill_missing_condition
choose_invariant
complete_pseudocode
order_subgoals
explain_complexity
```

### 2.4.4. Strategy Selection

Cel: użytkownik wybiera podejście na podstawie sygnałów w problemie.

Przykładowe pytanie:

```txt
Dane: array of positive integers, target sum, find minimal length subarray.
Który kierunek jest najbardziej obiecujący?

A. Hash map
B. Sliding window
C. Backtracking
D. Sorting
```

Feedback nie może brzmieć tylko: `B is correct`. Musi wskazać sygnał:

```txt
Wszystkie wartości są dodatnie, więc suma okna rośnie po przesunięciu prawej granicy i maleje po przesunięciu lewej. To pozwala utrzymać invariant bez cofania się.
```

### 2.4.5. Contrast Practice

Cel: użytkownik odróżnia podobne podejścia.

Przykład:

```txt
sliding window vs prefix sums
sliding window vs two pointers
hash map vs sorting
dfs vs bfs
heap vs sorting
backtracking vs dynamic programming
greedy vs dynamic programming
binary search on index vs binary search on answer
```

To jest krytyczny etap. Bez niego użytkownik często uczy się „etykiet”, a nie decyzji.

### 2.4.6. Independent Attempt

Cel: użytkownik rozwiązuje problem bez jawnego wzorca i bez prowadzenia krok po kroku.

W MVP independent attempt może mieć formę:

```txt
- wybierz podejście,
- uzasadnij wybór,
- wskaż złożoność,
- ułóż pseudokod,
- wskaż edge cases,
- porównaj z alternatywą.
```

Pełny edytor kodu może być etapem późniejszym.

### 2.4.7. Mixed Interview Practice

Cel: użytkownik ćwiczy w warunkach podobnych do rozmowy technicznej.

Cechy:

```txt
- brak jawnej etykiety wzorca,
- mieszanie patternów,
- ograniczona liczba hintów,
- nacisk na reasoning,
- podsumowanie błędów po sesji,
- porównanie rozwiązania z alternatywami.
```

## 2.5. Pattern Family

`Pattern Family` to główna rodzina podejść.

Rekomendowany zestaw MVP:

```txt
brute_force_and_constraints
hash_map_and_set
two_pointers
sliding_window
prefix_sums
sorting_based
stack_and_monotonic_stack
binary_search
tree_traversal
graph_traversal
heap_priority_queue
backtracking
dynamic_programming_intro
greedy_intro
intervals
linked_list
```

Nie wszystkie muszą być dostępne w pierwszej wersji. MVP może zacząć od mniejszego zestawu:

```txt
complexity_basics
hash_map_and_set
two_pointers
sliding_window
prefix_sums
sorting_based
stack
binary_search
recursion_and_tree_traversal
```

## 2.6. Pattern Variant

`Pattern Variant` to konkretny wariant rodziny.

Przykład dla sliding window:

```txt
fixed_size_window
variable_size_positive_numbers
variable_size_frequency_constraint
longest_substring_without_repeat
at_most_k_distinct
minimum_window_covering_requirement
```

Przykład dla binary search:

```txt
classic_index_search
lower_bound_upper_bound
rotated_array_search
binary_search_on_answer
first_bad_version_style
```

Przykład dla dynamic programming:

```txt
one_dimensional_dp
choice_take_or_skip
grid_dp
subsequence_dp
knapsack_intro
state_compression_intro
```

## 2.7. Problem Archetype

`Problem Archetype` to typ problemu niezależny od konkretnego tekstu zadania.

Przykłady:

```txt
find_pair_with_condition
find_subarray_with_target
longest_substring_with_constraint
merge_overlapping_ranges
detect_cycle
shortest_path_unweighted
count_ways
maximize_value_under_constraint
validate_parentheses_or_structure
find_next_greater_element
```

To jest ważne, bo użytkownik ma uczyć się transferu, nie zapamiętywania tytułów problemów.

## 2.8. Skill Atom

`Skill Atom` to najmniejsza sensowna kompetencja możliwa do sprawdzenia.

Przykłady:

```txt
Rozpoznać, że O(n²) odpada przy n=100000.
Wyjaśnić, dlaczego hash map daje O(1) average lookup.
Utrzymać invariant okna w sliding window.
Rozpoznać, że negative numbers łamią prosty sliding window dla sumy.
Wskazać, kiedy BFS daje shortest path w grafie nieważonym.
Odróżnić DFS traversal od backtracking search.
Wybrać heap, gdy potrzebujemy dynamicznie utrzymywać top K.
Zdefiniować DP state dla problemu take/skip.
Odróżnić greedy choice od pełnego DP.
Wskazać edge case dla pustego inputu albo duplikatów.
```

Każdy `TrainingItem` powinien mieć jeden główny `Skill Atom` i maksymalnie dwa pomocnicze.

Jeżeli item sprawdza jednocześnie pattern, edge case, syntax, złożoność, DP state i implementację, to feedback będzie diagnostycznie słaby.

---

# 3. Typy jednostek contentu

## 3.1. Approach Primer

Krótka jednostka wyjaśniająca, jak działa podejście.

Struktura:

```txt
1. Kiedy podejście zwykle się pojawia
2. Mechanika krok po kroku
3. Invariant
4. Typowa złożoność
5. Minimalny pseudokod
6. Typowe pułapki
7. Mini aktywna próba
```

Nie projektować jako długiego artykułu.

## 3.2. Worked Example

Rozwiązany przykład z oznaczonymi subgoals.

Wymagane elementy:

```txt
problem statement
constraints
approach choice
subgoals
step-by-step trace
pseudocode
complexity
why not alternatives
common mistakes
```

Ważne: worked example powinien zawierać mikropytania, np.:

```txt
Co stanie się z left pointerem, jeżeli suma przekroczy target?
Jaka zmienna przechowuje invariant?
Dlaczego ten kod nie robi nested loop?
```

## 3.3. Trace Drill

Użytkownik przechodzi przez stan algorytmu na konkretnym inputcie.

Przykład:

```txt
Input: [2, 3, 1, 2, 4, 3], target = 7
Aktualne okno: [2, 3, 1, 2]
Suma: 8
Co powinno stać się dalej?
```

Trace Drill jest szczególnie ważny dla:

```txt
sliding window
two pointers
stack / monotonic stack
binary search
BFS / DFS
heap
DP table
```

## 3.4. Subgoal Ordering

Użytkownik układa kroki rozwiązania w poprawnej kolejności.

Przykład:

```txt
A. Return best result
B. Initialize frequency map
C. Scan right pointer through string
D. Shrink left pointer while constraint is violated
E. Update best answer
```

## 3.5. Pseudocode Parsons

Użytkownik układa pseudokod lub fragmenty kodu.

Warianty:

```txt
one_dimensional_ordering
two_dimensional_indentation
paired_distractors
unpaired_distractors
faded_blanks
```

MVP powinno zacząć od pseudokodu, nie pełnego syntax-heavy kodu.

## 3.6. Strategy Choice

Użytkownik wybiera podejście.

Wymagane dane:

```txt
selectedStrategy
expectedStrategy
acceptableStrategies
rejectedStrategies
reasonSignal
constraintSignal
```

Feedback musi wyjaśniać, dlaczego alternatywy są słabsze.

## 3.7. Complexity Check

Użytkownik określa time/space complexity rozwiązania.

Ważne: complexity check powinien dotyczyć konkretnego podejścia, nie abstrakcyjnej teorii.

Przykład:

```txt
Masz sliding window, w którym każdy pointer przesuwa się tylko w prawo.
Jaka jest złożoność czasowa?
```

## 3.8. Edge Case Drill

Użytkownik wskazuje przypadki brzegowe.

Przykłady:

```txt
empty array
single element
duplicates
negative numbers
all equal values
no valid answer
multiple valid answers
overflow risk
large input
cycle in graph
```

## 3.9. Solution Comparison

Użytkownik porównuje dwa podejścia.

Przykład:

```txt
Approach A: brute force O(n²)
Approach B: hash map O(n)

Które podejście jest lepsze dla n=100000 i dlaczego?
```

Ten typ itemu jest kluczowy dla przejścia z „znam pattern” do „rozumiem trade-off”.

## 3.10. Independent Attempt

W MVP nie musi oznaczać pełnego kodowania.

Minimalna forma:

```txt
1. wybierz approach,
2. wskaż constraint signal,
3. ułóż subgoals,
4. wskaż complexity,
5. wybierz edge cases,
6. porównaj z jedną alternatywą.
```

Docelowo można dodać pełny edytor kodu, ale nie jest konieczny do pierwszej wersji dydaktycznej.

---

# 4. Tryby sesji

## 4.1. Learn Approach

Cel: nauczyć mechaniki jednego podejścia.

Skład sesji:

```txt
1 Approach Primer
1 Worked Example
2 Trace Drills
1 Subgoal Ordering
1 Complexity Check
```

Nie mieszać patternów w tym trybie.

## 4.2. Guided Practice

Cel: zastosować znany pattern z pomocą.

Skład:

```txt
1 krótkie przypomnienie patternu
2 guided attempts
1 pseudocode Parsons
1 edge case drill
1 podsumowanie mistake types
```

## 4.3. Recognize Pattern

Cel: rozpoznać podejście na podstawie sygnałów problemu.

Skład:

```txt
5–8 krótkich problem statements
każdy wymaga wyboru approachu
feedback po każdym wyborze
na końcu lista sygnałów i błędnych intuicji
```

Nie pokazywać nazwy patternu przed odpowiedzią.

## 4.4. Contrast Practice

Cel: odróżnić podobne podejścia.

Przykładowa sesja:

```txt
sliding window vs prefix sums vs hash map
```

Skład:

```txt
2 strategy choice
2 solution comparison
1 edge case contrast
1 complexity comparison
```

To powinien być jeden z najważniejszych trybów w Patternly.

## 4.5. Weak Area Review

Cel: wrócić do konkretnych skill atoms i mistake types.

Skład generowany przez review queue:

```txt
1 item podobny do błędnego
1 item kontrastowy
1 item z tym samym mistake type
1 krótkie explanation recap
```

Nie powtarzać wyłącznie tego samego zadania.

## 4.6. Independent Practice

Cel: rozwiązać problem bez jawnej etykiety.

Minimalna struktura:

```txt
problem statement
constraints
choose approach
justify approach
build subgoals
complexity
edge cases
feedback
```

## 4.7. Interview Simulation

Cel: walidacja, nie główna nauka.

Cechy:

```txt
mixed problems
limited hints
reasoning-first
time awareness
post-session diagnostics
```

Nie powinno być dostępne jako główna ścieżka dla początkującego bez wcześniejszych foundations.

---

# 5. Adaptacja i rekomendacje

## 5.1. Model progresu

Nie mierzymy ogólnego `readiness`.

Mierzymy evidence dla konkretnych kompetencji:

```txt
PatternFamilyEvidence
PatternVariantEvidence
SkillAtomEvidence
ProblemArchetypeEvidence
MistakeTypeEvidence
```

Przykład:

```txt
sliding_window:
  mechanics: strong
  trace: medium
  recognition: weak
  contrast_with_prefix_sums: weak
  implementation: unknown
```

To jest znacznie bardziej użyteczne niż:

```txt
Sliding Window: 72%
```

## 5.2. Evidence levels

Rekomendowane poziomy:

```txt
none
exposed
explained
traced
guided
independent_same_pattern
contrast_success
mixed_success
needs_review
```

Nie są to poziomy liniowe dla całego tracka. Ten sam użytkownik może mieć:

```txt
hash_map.mechanics = mixed_success
hash_map.edge_cases = needs_review
sliding_window.mechanics = guided
sliding_window.recognition = needs_review
```

## 5.3. Reguły rekomendacji MVP

W MVP wystarczy deterministyczny ranking.

Priorytet następnej sesji:

```txt
priority =
  mistake_severity
+ repeated_mistake_bonus
+ exam/interview_importance
+ due_review_bonus
+ low_confidence_bonus
+ hint_usage_bonus
+ prerequisite_gap_bonus
- recent_success_penalty
```

W LeetCode-like track `mistake_severity` powinno traktować jako najcięższe:

```txt
wrong_approach
complexity_mismatch
invariant_missing
edge_case_missed
cannot_trace
cannot_explain_why
```

Mniej ciężkie:

```txt
minor_syntax_issue
small_pseudocode_order_issue
low_confidence_but_correct
```

## 5.4. Kiedy użytkownik przechodzi dalej

Użytkownik może przejść z `Pattern Mechanics` do `Strategy Selection`, jeżeli spełnia minimalne warunki:

```txt
- rozwiązał trace drill poprawnie,
- wskazał invariant lub główny mechanizm,
- poprawnie ocenił podstawową złożoność,
- nie użył hintu w ostatnim guided itemie.
```

Może przejść do `Contrast Practice`, jeżeli:

```txt
- ma co najmniej guided/independent evidence dla dwóch podobnych patternów,
- popełnia mniej błędów mechanicznych,
- zaczyna potrzebować rozróżniania, nie kolejnego przykładu tego samego.
```

Może przejść do `Mixed Interview Practice`, jeżeli:

```txt
- ma `contrast_success` dla kilku core patternów,
- poprawnie uzasadnia wybór approachu,
- nie ma powtarzalnego `complexity_mismatch` w podstawowych patternach.
```

---

# 6. Mistake taxonomy

## 6.1. Dlaczego mistake taxonomy jest krytyczna

W LeetCode-like learning błąd `wrong answer` jest za mało informacyjny.

Dwa błędne rozwiązania mogą wynikać z kompletnie innych problemów:

```txt
Użytkownik zna approach, ale źle obsługuje edge case.
Użytkownik nie zna approachu.
Użytkownik zna approach, ale nie rozumie invariant.
Użytkownik wybiera dobry approach, ale nie umie policzyć complexity.
Użytkownik rozwiązuje konkretny przykład, ale nie potrafi uogólnić.
```

## 6.2. Rekomendowane mistake types

```ts
type AlgorithmMistakeType =
  | 'wrong_approach'
  | 'brute_force_when_optimized_required'
  | 'complexity_mismatch'
  | 'constraint_ignored'
  | 'invariant_missing'
  | 'invariant_broken'
  | 'cannot_trace_algorithm'
  | 'subgoal_order_wrong'
  | 'data_structure_mismatch'
  | 'edge_case_missed'
  | 'off_by_one'
  | 'duplicate_handling_error'
  | 'negative_numbers_assumption_error'
  | 'empty_input_error'
  | 'recursion_base_case_missing'
  | 'state_definition_wrong'
  | 'transition_wrong'
  | 'visited_set_missing'
  | 'cycle_handling_error'
  | 'space_complexity_ignored'
  | 'solution_overfit_to_example'
  | 'cannot_explain_why'
  | 'hint_dependency';
```

## 6.3. Feedback per mistake type

Feedback powinien mieć strukturę:

```txt
1. Co wybrałeś / zrobiłeś
2. Co to mówi o Twoim modelu mentalnym
3. Jaki sygnał w problemie powinien zmienić decyzję
4. Jak wygląda poprawna reguła
5. Co ćwiczyć dalej
```

Przykład `negative_numbers_assumption_error`:

```txt
Wybrałeś prosty sliding window dla sumy subarray, ale input może zawierać liczby ujemne.
Przy liczbach ujemnych zwiększenie okna nie musi zwiększać sumy, a zmniejszenie okna nie musi jej zmniejszać.
To łamie monotoniczny invariant, na którym opiera się klasyczny sliding window.
Lepszy kierunek: prefix sums + hash map albo inny model zależny od celu zadania.
```

Przykład `complexity_mismatch`:

```txt
Twoje podejście sprawdza wszystkie pary, więc ma O(n²).
Dla n=100000 to jest zbyt wolne.
Sygnał: szukasz relacji między elementami, którą można sprawdzać podczas jednego przejścia.
Lepszy kierunek: hash map / set.
```

---

# 7. Dane domenowe

## 7.1. Taxonomy node

```ts
type AlgorithmTaxonomyAxis =
  | 'learning_stage'
  | 'pattern_family'
  | 'pattern_variant'
  | 'problem_archetype'
  | 'data_structure'
  | 'constraint_signal'
  | 'decision_signal'
  | 'implementation_risk'
  | 'mistake_type';

interface AlgorithmTaxonomyNode {
  id: string;
  axis: AlgorithmTaxonomyAxis;
  label: string;
  description?: string;
  parentId?: string;
  prerequisites?: string[];
  difficultyBand?: 'intro' | 'easy' | 'medium' | 'hard';
  contentVersion: string;
}
```

## 7.2. Algorithm Skill Atom

```ts
interface AlgorithmSkillAtom {
  id: string;
  trackId: string;
  label: string;
  description: string;
  primaryPatternFamilyId?: string;
  patternVariantIds?: string[];
  problemArchetypeIds?: string[];
  dataStructureIds?: string[];
  prerequisiteSkillAtomIds?: string[];
  mistakeTypes: AlgorithmMistakeType[];
  evidenceRequiredForProgression: EvidenceLevel[];
  contentVersion: string;
}
```

## 7.3. Training Item

```ts
type AlgorithmTrainingItemType =
  | 'approach_primer'
  | 'worked_example'
  | 'trace_drill'
  | 'subgoal_ordering'
  | 'pseudocode_parsons'
  | 'faded_solution'
  | 'strategy_choice'
  | 'complexity_check'
  | 'edge_case_drill'
  | 'solution_comparison'
  | 'independent_attempt'
  | 'interview_simulation_problem';

interface AlgorithmTrainingItem {
  id: string;
  trackId: string;
  type: AlgorithmTrainingItemType;
  title: string;
  prompt: string;
  constraints?: string[];
  inputExample?: unknown;
  expectedOutputExample?: unknown;
  primarySkillAtomId: string;
  secondarySkillAtomIds?: string[];
  taxonomyRefs: string[];
  expectedApproachIds?: string[];
  acceptableApproachIds?: string[];
  rejectedApproachIds?: string[];
  expectedTimeComplexity?: string;
  expectedSpaceComplexity?: string;
  subgoals?: AlgorithmSubgoal[];
  solution?: AlgorithmSolution;
  feedbackModel: AlgorithmFeedbackModel;
  difficulty: 'intro' | 'easy' | 'medium' | 'hard';
  contentVersion: string;
}
```

## 7.4. Attempt

```ts
interface AlgorithmAttempt {
  id: string;
  userId: string;
  sessionId: string;
  itemId: string;
  trackId: string;
  startedAt: string;
  completedAt?: string;

  selectedApproachIds?: string[];
  expectedApproachIds?: string[];
  selectedComplexity?: {
    time?: string;
    space?: string;
  };
  selectedSubgoalOrder?: string[];
  selectedEdgeCases?: string[];
  confidence?: 1 | 2 | 3 | 4 | 5;
  hintCount: number;
  firstAttemptCorrect?: boolean;
  finalCorrect?: boolean;
  partialScore?: number;

  mistakeTypes: AlgorithmMistakeType[];
  evidenceUpdates: EvidenceUpdate[];
}
```

## 7.5. Review Queue Item

```ts
interface AlgorithmReviewQueueItem {
  id: string;
  userId: string;
  trackId: string;
  sourceAttemptId: string;
  primarySkillAtomId: string;
  patternFamilyId?: string;
  patternVariantId?: string;
  problemArchetypeId?: string;
  mistakeType: AlgorithmMistakeType;
  dueAt: string;
  priority: number;
  reviewReason: string;
  recommendedItemTypes: AlgorithmTrainingItemType[];
  status: 'pending' | 'completed' | 'dismissed';
}
```

---

# 8. UI/UX implikacje

## 8.1. Home

Dla LeetCode-like track Home powinien pokazywać:

```txt
Track: Algorithms Interview Core
Current focus: Sliding Window Mechanics
Primary action: Continue practice
Secondary actions:
  - Learn approach
  - Recognize patterns
  - Review weak area
  - Mixed practice
```

Nie używać `Active track` dla wzorca. Track to cała ścieżka, np. `Algorithms Interview Core`. `Sliding Window Mechanics` to `Current focus`.

## 8.2. Practice Modes

Rekomendowane tryby na ekranie głównym tracka:

```txt
Learn Approach
Recognize Patterns
Guided Practice
Weak Area Review
Mixed Practice
Interview Simulation
```

Dla początkującego ukryć albo obniżyć wagę `Interview Simulation`.

## 8.3. Progress / Statistics

Nie pokazywać tylko `Performance by topic` jako procentu.

Lepsze sekcje:

```txt
Pattern mastery
Recognition accuracy
Complexity accuracy
Common mistake types
Weak contrasts
Review due
Recent improvements
```

Przykładowe karty:

```txt
Sliding Window
Mechanics: strong
Recognition: weak
Contrast with Prefix Sums: needs review
Common mistake: negative numbers assumption
```

```txt
Hash Map
Recognition: strong
Edge cases: medium
Common mistake: duplicate handling
```

## 8.4. Topic detail / Pattern detail

Po kliknięciu patternu użytkownik powinien widzieć:

```txt
- what this approach is for,
- mechanics status,
- recognition status,
- common mistake types,
- recent attempts,
- recommended next session,
- related contrasts,
- example problem archetypes.
```

Nie robić ekranu jako encyklopedii patternu. To ma być ekran decyzji treningowej.

## 8.5. Feedback screen

Feedback po itemie powinien być strukturalny:

```txt
Result
Your choice
Expected reasoning
Key signal
Complexity
Mistake type
Next practice
```

Przy `strategy_choice` feedback musi zawsze pokazywać:

```txt
why selected approach works/doesn't work
why expected approach fits
why at least one tempting alternative is weaker
```

## 8.6. Mobile-first ograniczenie

Pełne kodowanie na mobile jest trudne. Patternly może być wartościowe bez edytora kodu, jeśli skupi się na:

```txt
reasoning
trace
pseudocode
subgoal ordering
complexity
edge cases
strategy selection
```

Pełny kod można dodać później jako:

```txt
web mode
keyboard-friendly mode
desktop companion
external editor integration
```

---

# 9. Przykładowy flow: Sliding Window

## 9.1. Stage 1 — Approach Mechanics

```txt
Approach Primer: Sliding Window
Worked Example: Fixed-size max sum subarray
Trace Drill: move right pointer
Trace Drill: update sum after left leaves
Complexity Check: why O(n), not O(n*k)
```

## 9.2. Stage 2 — Guided Application

```txt
Guided problem: longest substring without repeating characters
Subgoal Ordering:
  - initialize set/map
  - move right pointer
  - shrink until valid
  - update best
Pseudocode Parsons
Edge Case Drill: empty string, all duplicates
```

## 9.3. Stage 3 — Strategy Selection

```txt
Problem A: positive integers, minimal subarray sum
Expected: sliding window

Problem B: integers can be negative, subarray sum equals k
Expected: prefix sums + hash map

Problem C: sorted array, pair sum
Expected: two pointers
```

## 9.4. Stage 4 — Contrast Practice

```txt
Contrast: Sliding Window vs Prefix Sums
Key signal:
  - monotonic window possible? sliding window
  - arbitrary negative values? prefix sums / hash map
```

## 9.5. Stage 5 — Independent Attempt

```txt
Problem statement without topic label
User chooses approach
User explains signal
User gives complexity
User selects edge cases
System gives diagnostic feedback
```

---

# 10. MVP rekomendacja

## 10.1. Nie zaczynać od pełnego LeetCode clone

Nie budować MVP jako:

```txt
lista problemów
  ↓
edytor kodu
  ↓
submit
  ↓
accepted / wrong answer
```

To jest drogie produktowo i słabe dydaktycznie, jeśli feedback nie tłumaczy reasoning.

## 10.2. Lepszy MVP

Zbudować MVP jako:

```txt
pattern learning system
  ↓
interactive reasoning items
  ↓
strategy choice
  ↓
complexity and edge case checks
  ↓
review queue
  ↓
contrast practice
```

Minimalne typy itemów dla MVP:

```txt
approach_primer
worked_example
trace_drill
strategy_choice
complexity_check
solution_comparison
edge_case_drill
```

Drugi etap MVP:

```txt
subgoal_ordering
pseudocode_parsons
faded_solution
```

Później:

```txt
independent_attempt
interview_simulation_problem
full_code_editor
```

## 10.3. Core MVP content pack

Minimalny content pack powinien obejmować:

```txt
Foundations:
  - Big O basics
  - input constraints
  - hash map/set operations
  - sorting cost
  - recursion/call stack basics

Pattern families:
  - brute force vs optimized
  - hash map/set
  - two pointers
  - sliding window
  - prefix sums
  - sorting-based approaches
  - stack
  - binary search
```

Każda pattern family powinna mieć:

```txt
1 Approach Primer
1 Worked Example
2 Trace Drills
2 Strategy Choice items
1 Complexity Check
1 Edge Case Drill
1 Contrast item
```

To daje niewielki, ale dydaktycznie spójny zestaw startowy.

---

# 11. Różnice względem Certification Track

| Obszar | Certification Track | LeetCode-like Track |
|---|---|---|
| Core skill | Decyzja domenowa/scenariuszowa | Dobór i wykonanie strategii algorytmicznej |
| Podział materiału | Domain → Competency → Topic → Skill Atom | Stage → Pattern Family → Variant → Archetype → Skill Atom |
| Główna jednostka UI | Current focus / Topic | Current focus / Pattern or Stage |
| Najważniejszy błąd | Błędna usługa/konfiguracja/dystraktor | Wrong approach / complexity / invariant / edge case |
| Review | Pojęcia, scenariusze, dystraktory | Pattern mechanics, recognition, contrasts, mistake types |
| Symulacja | Egzamin próbny | Interview simulation |
| Przykłady | Scenario explanation | Worked example, trace, pseudocode |
| Mobile feasibility | Bardzo dobra | Dobra bez pełnego edytora kodu, gorsza dla pełnego codingu |

---

# 12. Zmiany wymagane w istniejącej dokumentacji

## 12.1. `00-overview.md`

Dodać, że Patternly obsługuje co najmniej dwa różne modele dydaktyczne:

```txt
certification_learning
algorithmic_problem_solving
```

Nie traktować wszystkich tracków jako tego samego quiz systemu.

## 12.2. `01-product-definition.md`

Dodać osobną definicję wartości dla Algorithms Track:

```txt
Patternly pomaga użytkownikowi nauczyć się rozpoznawać, wybierać i uzasadniać podejścia algorytmiczne, zamiast wyłącznie rozwiązywać kolejne zadania.
```

## 12.3. `03-navigation-and-flows.md`

Dodać osobny flow:

```txt
Learn Approach → Guided Practice → Recognize Pattern → Contrast Practice → Independent Practice → Mixed Practice
```

Nie kopiować flow certyfikacyjnego 1:1.

## 12.4. `04-data-model.md`

Rozszerzyć model o:

```txt
AlgorithmTaxonomyNode
AlgorithmSkillAtom
AlgorithmTrainingItem
AlgorithmAttempt
AlgorithmReviewQueueItem
AlgorithmMistakeType
```

Jeżeli istnieje generyczny model `TrainingItem`, dodać specjalizację per `trackType`.

## 12.5. `07-content-guidelines.md`

Dodać osobne wytyczne tworzenia contentu algorytmicznego:

```txt
- każdy pattern musi mieć mechanics,
- każdy worked example musi mieć subgoals,
- każdy strategy item musi mieć signals,
- każdy feedback musi tłumaczyć alternatywy,
- każdy contrast item musi wskazywać warunek rozróżniający.
```

## 12.6. `10-roadmap.md`

Dodać etap po certyfikacjach lub równoległy discovery:

```txt
Algorithms Track MVP
  - taxonomy
  - core pattern pack
  - reasoning item types
  - review queue support
  - contrast practice
```

Nie zaczynać od pełnego code editor jako pierwszego milestone.

## 12.7. `12-testing-strategy.md`

Dodać testy jakości dydaktycznej:

```txt
- czy item ma jeden główny skill atom,
- czy feedback zawiera key signal,
- czy strategy choice ma tempting distractors,
- czy contrast item rzeczywiście rozróżnia podobne podejścia,
- czy complexity explanation pasuje do rozwiązania,
- czy review queue nie powtarza tylko identycznego itemu.
```

---

# 13. Ryzyka

## 13.1. Ryzyko: katalog patternów zamiast trenera

Jeśli aplikacja pokaże tylko listę patternów z opisami, użytkownik będzie czytał, ale niekoniecznie poprawi problem solving.

Mitigacja:

```txt
Każdy primer musi kończyć się aktywną próbą.
Każdy pattern musi mieć trace, strategy choice i contrast practice.
```

## 13.2. Ryzyko: zbyt wczesne mieszanie patternów

Interleaving bez podstaw może zwiększyć frustrację.

Mitigacja:

```txt
Najpierw mechanics i guided practice.
Dopiero potem contrast i mixed practice.
```

## 13.3. Ryzyko: fałszywa pewność po rozpoznaniu etykiety

Użytkownik może nauczyć się, że „substring = sliding window”, co jest błędnym skrótem.

Mitigacja:

```txt
Wprowadzać kontrprzykłady.
Wymagać wskazania constraint signal.
Pokazywać, kiedy pattern nie pasuje.
```

## 13.4. Ryzyko: mobile input friction

Pełne kodowanie na telefonie może być frustrujące.

Mitigacja:

```txt
MVP skupia się na reasoning, pseudocode, trace i subgoals.
Pełny coding jako etap późniejszy albo web companion.
```

## 13.5. Ryzyko: zbyt szeroki start contentowy

Za dużo patternów na start rozmyje jakość.

Mitigacja:

```txt
Zacząć od 6–8 core patternów.
Dopilnować jakości feedbacku i kontrastów.
Nie dodawać DP hard przed dopracowaniem podstaw.
```

---

# 14. Otwarta decyzja produktowa

Do późniejszego rozstrzygnięcia:

```txt
Czy Patternly ma docelowo umożliwiać pełne pisanie kodu?
```

Rekomendacja na teraz:

```txt
Nie zaczynać od pełnego edytora.
Zacząć od reasoning-first algorithm trainer.
```

Powód: największa wartość Patternly nie polega na byciu kolejnym miejscem do submitowania kodu, tylko na uczeniu decyzji, które prowadzą do poprawnego rozwiązania.

---

# 15. Źródła badawcze do dalszego utrzymania dokumentacji

Ten dokument opiera się na poniższych kierunkach badawczych:

- Worked-example effect / cognitive load theory — worked examples jako wsparcie początkowego nabywania złożonych umiejętności.
- Faded worked examples — stopniowe przejście od przykładu do samodzielnego rozwiązywania.
- Expertise reversal effect — pełne przykłady pomagają początkującym, ale mogą być redundantne dla zaawansowanych.
- Subgoal labeling — nazywanie kroków rozwiązania pomaga odróżniać strukturę od szczegółów powierzchniowych.
- Parsons problems — układanie fragmentów kodu/pseudokodu jako pomost między przykładem a samodzielnym kodowaniem.
- Computational thinking — algorithmic thinking, abstraction, decomposition, evaluation i generalization jako osobne komponenty problem solvingu.
- Retrieval practice, spacing, interleaving i diagnostic feedback — zgodnie z `14-learning-effectiveness-model.md`.

Przy późniejszej aktualizacji dokumentacji warto cytować bezpośrednio:

- Sweller, Renkl, Atkinson et al. — worked examples / cognitive load.
- Kalyuga et al. — expertise reversal.
- Morrison et al. / Margulieux et al. — subgoal labeling in programming.
- Ericson, Hou, Denny, Luxton-Reilly — Parsons problems in programming education.
- Benedetti, Alpizar-Chacon, Jeuring — computational thinking skills in introductory programming problem solving.

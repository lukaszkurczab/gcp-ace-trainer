# 12 — Testing Strategy

## Status dokumentu

Ten dokument definiuje strategię testowania dla local-first, wielotrackowej aplikacji treningowej.

Obowiązujący model produktu:

```txt
app → track → session mode → training item → attempt → feedback/result → progress
```

Testy nie mogą zakładać, że aplikacja jest wyłącznie quizem, symulatorem egzaminu albo bankiem pytań GCP. `Question` jest tylko jednym z możliwych typów `TrainingItem`.

## Cel testów

Testy mają chronić przed regresjami w miejscach, które decydują o wartości produktu:

1. wybór tracka i trybu sesji,
2. tworzenie sesji treningowej,
3. scoring różnych typów itemów,
4. zapis attemptów,
5. feedback i wynik sesji,
6. review queue,
7. progress per track i per taxonomy,
8. migracje storage,
9. poprawne rozdzielenie logiki wspólnej i track-specific.

Nie trzeba testować wszystkiego od pierwszego dnia. Od początku testowalna powinna być jednak logika domenowa, bo to ona zdecyduje, czy aplikacja nie zabetonuje się wokół jednego tracka.

## Co testujemy w pierwszej kolejności

Najwyższy priorytet:

1. kontrakty domenowe `Track`, `TrainingItem`, `TrainingSession`, `TrainingAttempt`, `UserProgress`,
2. `trackRegistry`,
3. scoring itemów single-choice i multiple-choice,
4. scoring itemów algorytmicznych typu strategy/pattern/complexity,
5. wynik sesji,
6. review queue,
7. progress per track,
8. migracje storage,
9. odporność na brak danych, uszkodzone dane i zmianę wersji contentu.

Niższy priorytet w pierwszym etapie:

- testy wizualne,
- rozbudowane testy komponentów,
- snapshoty ekranów,
- testy animacji,
- pełne end-to-end automation.

## Warstwy testów

### 1. Domain unit tests

Najważniejsza warstwa.

Powinna obejmować:

```txt
src/domain/tracks
src/domain/items
src/domain/sessions
src/domain/attempts
src/domain/scoring
src/domain/progress
src/domain/review
```

Przykładowe funkcje:

```ts
resolveTrackConfig()
createTrainingSession()
scoreTrainingItem()
scoreCloudQuestionItem()
scoreAlgorithmStrategyItem()
calculateSessionResult()
updateUserItemState()
updateTrackProgress()
getReviewQueue()
selectNextReviewItems()
```

Zasada: logika domenowa nie powinna wymagać Reacta, storage adaptera ani UI.

### 2. Track contract tests

Każdy track musi spełniać wspólny kontrakt.

Testy powinny sprawdzać, czy track dostarcza:

```ts
type TrackConfig = {
  id: string;
  label: string;
  supportedSessionModes: SessionMode[];
  taxonomy: TrackTaxonomy;
  contentPacks: ContentPackMetadata[];
  itemScoring: ItemScoringStrategy;
  progressRules: TrackProgressRules;
};
```

Minimalne testy:

- track ma stabilne `id`,
- track deklaruje co najmniej jeden `SessionMode`,
- track ma poprawną taxonomy,
- track content pack ma wersję,
- itemy odwołują się do istniejących taxonomy refs,
- scoring tracka obsługuje wszystkie zadeklarowane typy itemów.

### 3. Storage tests

Storage adapter powinien być testowany osobno od domeny.

Zakres:

- zapis i odczyt aktywnego tracka,
- zapis i odczyt sesji,
- zapis i odczyt attemptów,
- zapis i odczyt item state,
- zapis i odczyt review queue,
- zapis i odczyt progressu,
- brak danych,
- uszkodzone dane,
- reset learning data,
- reset all local data,
- schema version mismatch,
- content version mismatch.

Storage nie powinien kopiować całych bundlowanych content packów, jeśli wystarczy zapisać referencje:

```txt
trackId
itemId
contentVersion
sessionId
attemptId
```

### 4. Integration tests

Integration tests powinny sprawdzać pełny przepływ domenowy bez konieczności uruchamiania pełnej aplikacji.

Przykładowe scenariusze:

1. użytkownik wybiera track,
2. tworzy sesję,
3. odpowiada na item,
4. scoring generuje wynik,
5. attempt zapisuje się lokalnie,
6. item state zostaje zaktualizowany,
7. review queue otrzymuje wpis,
8. progress tracka zostaje przeliczony.

Test powinien działać zarówno dla `cloud-certification`, jak i `algorithms`.

### 5. Component tests

Nie są priorytetem w pierwszym kroku, ale warto je dodać dla komponentów, które zawierają istotną logikę interakcji.

Kandydaci:

- `TrackCard`,
- `TrackSwitcher`,
- `SessionModeCard`,
- `TrainingItemCard`,
- `ChoiceOption`,
- `FeedbackPanel`,
- `ReviewQueueCard`,
- `ProgressInsightCard`.

Nie testować przez snapshoty jako podstawową strategię. Snapshoty łatwo utrwalają zły design i dają małą wartość przy zmianach UI.

## Testy scoringu

### Single-choice correct

Użytkownik wybiera jedną poprawną odpowiedź.

Oczekiwane:

```txt
status = correct
score = 1
isCorrect = true
```

### Single-choice incorrect

Użytkownik wybiera błędną odpowiedź.

Oczekiwane:

```txt
status = incorrect
score = 0
isCorrect = false
```

### Multi-choice correct

Użytkownik wybiera dokładnie wszystkie poprawne odpowiedzi.

Oczekiwane:

```txt
status = correct
score = 1
isCorrect = true
```

### Multi-choice partially correct

Użytkownik wybiera tylko część poprawnych odpowiedzi.

Domyślna decyzja MVP:

```txt
status = partially_correct
score > 0
score < 1
isCorrect = false
```

Jeżeli track certyfikacyjny ma symulować egzamin, scoring egzaminacyjny może traktować partially correct jako `incorrect`, ale praktyka i feedback powinny nadal pokazywać częściową poprawność.

### Multi-choice with extra incorrect

Użytkownik wybiera wszystkie poprawne i jedną błędną.

Oczekiwane:

```txt
status = partially_correct albo incorrect
score < 1
isCorrect = false
```

Dokładna polityka musi być jawna w `scoringRules` tracka.

### Algorithm pattern identification

Użytkownik rozpoznaje właściwy pattern, np. `two_pointers`, `sliding_window`, `binary_search`.

Oczekiwane:

```txt
selectedPattern is compared with acceptedPatterns
feedback explains why the pattern fits constraints
mistakeType is set if selected strategy is wrong
```

### Algorithm strategy choice

Użytkownik wybiera najlepszą strategię spośród kilku podejść.

Oczekiwane:

```txt
bestStrategyId is matched
suboptimal but valid strategy may be partially_correct
brute force may be valid but low score when constraints require better complexity
feedback explains trade-offs
```

### Algorithm complexity analysis

Użytkownik wybiera albo wpisuje złożoność czasową i pamięciową.

Oczekiwane:

```txt
timeComplexity is validated
spaceComplexity is validated
feedback identifies wrong assumption
```

### Solution comparison

Użytkownik porównuje dwa podejścia i wybiera lepsze dla danych constraintów.

Oczekiwane:

```txt
selectedSolutionId is evaluated
feedback references constraints
mistakeType captures wrong optimization target if relevant
```

## Testy wyniku sesji

Sprawdzić:

- liczba itemów,
- liczba poprawnych,
- liczba błędnych,
- liczba częściowo poprawnych,
- liczba pominiętych,
- accuracy overall,
- score overall,
- wynik per taxonomy,
- czas sesji, jeśli mierzony,
- zachowanie przy przerwaniu sesji,
- zachowanie przy wznowieniu sesji.

Dla Cloud Certification:

- wynik per domain,
- słabe domeny,
- zachowanie trybu Exam bez natychmiastowego feedbacku.

Dla Algorithms:

- wynik per pattern,
- wynik per data structure,
- wynik per complexity category,
- najczęstsze mistake types,
- rozróżnienie błędu strategii od błędu szczegółu.

## Testy progressu

Sprawdzić:

- aktualizacja po nowej sesji,
- agregacja wielu sesji,
- progress per track,
- progress per taxonomy,
- weak areas,
- mastered areas,
- brak danych,
- dane po resecie,
- dane po migracji,
- dane po zmianie wersji contentu.

Progress powinien być cache’em możliwym do odtworzenia z attemptów. Testy powinny wykrywać sytuację, w której progress staje się źródłem prawdy niemożliwym do naprawienia.

## Testy review queue

Review queue powinna uwzględniać:

- błędne itemy,
- częściowo poprawne itemy,
- itemy oznaczone ręcznie,
- stare itemy wymagające powtórki,
- itemy z niską pewnością,
- itemy z powtarzalnym mistake type.

Dla Cloud Certification:

- pytania błędne trafiają do review,
- pytania z weak domain mają wyższy priorytet,
- pytania oznaczone ręcznie trafiają do review,
- item można oznaczyć jako opanowany.

Dla Algorithms:

- problem z błędnie rozpoznanym patternem trafia do review,
- problem z błędną złożonością trafia do review,
- powtarzający się `mistakeType` zwiększa priorytet,
- item można oznaczyć jako opanowany bez usuwania historii attemptów.

## Testy content packów

Każdy content pack powinien przejść walidację.

Sprawdzić:

- unikalne `itemId`,
- poprawny `trackId`,
- poprawny `contentVersion`,
- poprawny `itemType`,
- obecność wymaganych pól,
- brak pustych odpowiedzi,
- poprawność `correctOptionIds`,
- poprawność `taxonomyRefs`,
- brak referencji do nieistniejących taxonomy nodes,
- obecność feedbacku/explanation,
- brak nazw sugerujących oficjalną afiliację,
- brak treści skopiowanych z exam dumps, LeetCode lub editoriali.

Dla algorithms dodatkowo:

- obecność constraints,
- obecność accepted/best strategy,
- obecność complexity,
- obecność common mistakes,
- obecność explanation zależnego od constraints.

## Manual QA checklist

### Global navigation

- aplikacja pozwala wybrać track,
- aktywny track jest widoczny,
- można zmienić track,
- zmiana tracka nie miesza aktywnych sesji,
- Home pokazuje rekomendacje zgodne z aktywnym trackiem,
- Progress pokazuje dane globalne i per track.

### Cloud Certification — Practice

- można wystartować sesję Practice,
- item wyświetla się poprawnie,
- można wybrać odpowiedź,
- submit pokazuje feedback,
- poprawna odpowiedź jest widoczna,
- explanation jest widoczne,
- taxonomy/domain jest widoczne,
- można przejść dalej,
- sesja zapisuje wynik.

### Cloud Certification — Exam Simulation

- można wystartować exam,
- w trakcie nie ma natychmiastowego feedbacku,
- można wrócić do itemu, jeżeli flow to wspiera,
- wynik pokazuje się po submit,
- review odpowiedzi działa,
- wynik per domain jest logiczny.

### Algorithms — Pattern Drill

- można wystartować pattern drill,
- problem summary jest zrozumiały,
- constraints są widoczne,
- można wybrać pattern/strategię,
- feedback wyjaśnia, dlaczego pattern pasuje albo nie pasuje,
- complexity jest pokazana po odpowiedzi,
- common mistake jest pokazany, jeśli dotyczy,
- attempt zapisuje się w historii.

### Algorithms — Strategy Practice

- można porównać kilka podejść,
- aplikacja nie wymaga pełnego edytora kodu,
- feedback odnosi się do constraintów,
- suboptymalne podejście jest odróżnione od całkowicie błędnego,
- mistake type trafia do review/progress.

### Review

- błędny item trafia do kolejki,
- częściowo poprawny item trafia do kolejki,
- item oznaczony ręcznie trafia do kolejki,
- item można oznaczyć jako opanowany,
- pusta kolejka ma empty state,
- kolejka jest filtrowalna per track.

### Progress

- overall progress jest poprawny,
- progress per track jest poprawny,
- progress per taxonomy jest poprawny,
- weak areas są logiczne,
- ostatnia sesja jest widoczna,
- brak danych pokazuje poprawny empty state.

### Offline

- aplikacja działa bez internetu,
- content packi są dostępne offline,
- sesja zapisuje się lokalnie,
- zamknięcie i otwarcie aplikacji nie gubi danych,
- aktywny track zostaje zachowany,
- review queue zostaje zachowana,
- progress zostaje zachowany.

## Definicja minimalnej jakości MVP

MVP nie musi mieć pełnego pokrycia testami, ale nie może mieć nietestowanej logiki scoringu, progressu i review.

Minimalny zakres automatycznych testów:

```txt
resolveTrackConfig
createTrainingSession
scoreTrainingItem
calculateSessionResult
updateUserItemState
updateTrackProgress
getReviewQueue
migrateStorageState
validateContentPack
```

Minimalny zakres manual QA:

```txt
track selection
cloud certification practice
cloud certification exam simulation
algorithms pattern drill
algorithms strategy practice
review queue
progress per track
offline persistence
```

## Antywzorce testowania

Nie robić:

- testów wyłącznie pod `Question`,
- testów wyłącznie pod GCP,
- testów, które zakładają, że każdy item ma `correctAnswerId`,
- testów, które zakładają, że każda sesja jest egzaminem,
- snapshotów jako głównej strategii jakości,
- testów UI zamiast testów domeny,
- testów storage bez migracji,
- testów progressu bez danych z więcej niż jednego tracka,
- testów Algorithms jako pełnego online judge,
- testów zależnych od internetu w MVP local-first.

## Decyzje bazowe

1. Testujemy model wielotrackowy, nie jedną aplikację egzaminacyjną.
2. `TrainingItem` jest bazową jednostką testów, a `Question` tylko wariantem.
3. Scoring musi być rozszerzalny per item type.
4. Progress musi być liczony per track i per taxonomy.
5. Review queue musi działać dla błędnych pytań i błędnych strategii.
6. Storage musi przechowywać dane użytkownika, a nie duplikować bundlowane content packi.
7. Content packi muszą przechodzić walidację strukturalną i prawną.
8. Algorithms MVP testujemy jako pattern/strategy trainer, nie jako LeetCode clone.

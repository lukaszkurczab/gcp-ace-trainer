# 14 — Learning Effectiveness Model

## Status dokumentu

Ten dokument definiuje, jak Patternly powinno wykorzystywać mechanizmy uczenia potwierdzone w badaniach, bez zamieniania aplikacji w kurs, grę, dashboard analityczny albo fałszywy predyktor gotowości.

Dokument jest nadrzędną warstwą produktowo-dydaktyczną dla:

- `00-overview.md`,
- `01-product-definition.md`,
- `03-navigation-and-flows.md`,
- `04-data-model.md`,
- `05-design-system.md`,
- `07-content-guidelines.md`,
- `10-roadmap.md`,
- `12-testing-strategy.md`.

Najważniejsza korekta względem obecnej dokumentacji: Patternly nie powinno opierać się na ogólnych metrykach typu `readiness` albo `retention`, jeżeli nie są one jasno wyliczane z zachowań użytkownika. Aplikacja ma pokazywać konkretne sygnały diagnostyczne, nie syntetyczne poczucie gotowości.

## Decyzja produktowa

Patternly jest **adaptive practice trainer**, nie pasywną biblioteką materiałów i nie dashboardem postępu.

Core produktu powinien być projektowany wokół pętli:

```txt
diagnoza aktualnego stanu
  ↓
aktywna próba użytkownika
  ↓
feedback diagnostyczny
  ↓
korekta modelu mentalnego
  ↓
podobny problem lub wariant utrwalający
  ↓
powrót po czasie
  ↓
mieszanie tematów / wzorców
  ↓
kolejna rekomendowana sesja
```

Nie projektować głównej pętli jako:

```txt
materiał
  ↓
quiz
  ↓
wynik procentowy
  ↓
wykres
  ↓
ogólna rekomendacja
```

## Fundament badawczy

Patternly powinno wykorzystywać poniższe mechanizmy jako zasady projektowe.

| Mechanizm | Wniosek dla Patternly | Implikacja MVP |
|---|---|---|
| Retrieval practice / active recall | Użytkownik powinien najpierw sam próbować wydobyć odpowiedź, strategię albo wzorzec. | Każdy `TrainingItem` powinien wymagać aktywnej odpowiedzi przed pokazaniem wyjaśnienia. |
| Spaced practice | Powtórki powinny wracać po czasie, szczególnie dla błędów i słabych obszarów. | `ReviewQueueItem` musi mieć `dueAt`, `priority` i powód powrotu. |
| Interleaving | Po opanowaniu podstaw aplikacja powinna mieszać podobne typy problemów, żeby użytkownik uczył się rozróżniania. | Tryby `Mixed Practice` / `Weak Areas` powinny mieszać taxonomy nodes, nie tylko losować pytania. |
| Worked examples + fading | Początkujący potrzebują przykładów rozwiązanych, potem częściowo uzupełnionych, potem samodzielnych prób. | Content powinien wspierać itemy typu `worked_example`, `guided_attempt`, `independent_attempt`. |
| Diagnostic feedback | Feedback ma wyjaśniać błąd, regułę decyzyjną i sygnał rozpoznawczy na przyszłość. | `FeedbackPanel` nie może ograniczać się do `correct/incorrect`. |
| Error-driven learning | Powtarzalne błędy są jednym z najlepszych źródeł personalizacji. | Model attemptów powinien zapisywać `mistakeTypes`, `taxonomyRefs`, `selectedStrategy`, `expectedStrategy`. |
| Metacognitive calibration | Użytkownik powinien widzieć różnicę między „wydaje mi się, że umiem” a „rozwiązałem poprawnie bez pomocy”. | Zapisywać `confidence`, `hintUsage`, `firstAttemptScore`, ale nie tworzyć fałszywego `retention score`. |
| Learning analytics with caution | Dashboard sam w sobie zwykle nie uczy. Powinien prowadzić do decyzji. | Progress screen powinien kończyć się rekomendowaną akcją, nie tylko wykresem. |
| Conservative gamification | Punkty, streaki, badge i leaderboardy mogą zwiększać klikalność, ale nie muszą zwiększać uczenia. | Gamifikacja nie jest częścią core MVP. |

## Zasady projektowania nauki

### 1. Najpierw próba, potem wyjaśnienie

Każdy element treningowy powinien wymagać aktywnej odpowiedzi użytkownika zanim pokaże rozwiązanie.

Dopuszczalne formy aktywnej próby:

- wybór odpowiedzi,
- wybór wzorca,
- wybór strategii,
- wskazanie złożoności czasowej,
- wskazanie złożoności pamięciowej,
- rozpoznanie błędu w rozwiązaniu,
- porównanie dwóch podejść,
- samodzielna ocena pewności.

Nie traktować jako aktywnej próby:

- samo czytanie wyjaśnienia,
- przewijanie materiału,
- kliknięcie `Next`,
- obejrzenie przykładu bez odpowiedzi,
- zaznaczenie `I understand` bez sprawdzenia.

### 2. Feedback musi naprawiać model mentalny

Feedback powinien mieć stabilną strukturę:

```txt
1. Wynik próby
2. Co użytkownik wybrał lub założył
3. Dlaczego to jest poprawne / błędne / częściowe
4. Jaka reguła decyzyjna powinna zostać zapamiętana
5. Jaki sygnał rozpoznawczy zastosować następnym razem
6. Jaki typ błędu został wykryty
7. Co ćwiczyć dalej
```

Minimalny przykład dla Algorithms:

```txt
Wybrałeś brute force, ale ograniczenie n=100000 sprawia, że O(n²) odpada.
Kluczowy sygnał: musisz sprawdzać relację między elementami w trakcie jednego przejścia.
Lepszy kierunek: hash map albo sliding window, zależnie od tego, czy warunek dotyczy sumy, indeksów czy zakresu.
Typ błędu: complexity_mismatch.
Następna akcja: 3 krótkie zadania z rozpoznawania hash map vs sliding window.
```

Minimalny przykład dla Cloud Certification:

```txt
Wybrałeś rolę zbyt szeroką względem wymagania.
Pytanie wymaga najmniejszych wystarczających uprawnień, więc poprawna odpowiedź musi spełniać zasadę least privilege.
Kluczowy sygnał: użytkownik ma wykonać jedną operację, nie administrować całym zasobem.
Typ błędu: over-permissioning.
Następna akcja: review IAM permissions and predefined roles.
```

### 3. Review ma być planowane, nie tylko ręczne

Review powinno wynikać z danych o próbach użytkownika.

Element trafia do review, jeżeli wystąpi co najmniej jeden z warunków:

- odpowiedź błędna,
- odpowiedź częściowa,
- niski poziom pewności,
- użycie hintu,
- zły wzorzec / zła strategia,
- błąd w złożoności,
- powtarzalny błąd w danym taxonomy node,
- ręczne oznaczenie przez użytkownika,
- powrót po czasie dla wcześniej poprawnego, ale istotnego tematu.

Review nie powinno być listą „wszystkiego, co było źle”. Powinno być kolejką z priorytetami.

```txt
priority = severity + recurrence + recency + importance - recent_success
```

W MVP formuła może być prosta i deterministyczna. Nie potrzeba ML.

### 4. Spaced repetition ma działać na umiejętnościach, nie tylko na pytaniach

Patternly nie powinno powtarzać wyłącznie identycznych itemów. Przy technicznej nauce ważniejsze jest powtarzanie umiejętności i wzorców.

Przykład:

```txt
Użytkownik źle rozpoznał sliding window.
  ↓
Do review trafia konkretny item.
  ↓
Do weak area trafia taxonomy node: sliding_window.
  ↓
Kolejna sesja powinna zawierać:
    - 1 podobny problem,
    - 1 kontrastowy problem z two pointers,
    - 1 problem, gdzie sliding window nie pasuje.
```

To jest ważniejsze niż mechaniczne pokazanie tego samego pytania po 3 dniach.

### 5. Interleaving dopiero po podstawowej ekspozycji

Nie mieszać tematów zbyt wcześnie.

Rekomendowany model:

```txt
new topic
  ↓
blocked practice: 2–4 itemy z jednego wzorca / domeny
  ↓
guided practice: itemy z podpowiedziami i diagnostycznym feedbackiem
  ↓
contrast practice: podobne, ale różne wzorce / domeny
  ↓
interleaved practice: mieszana sesja bez jawnej etykiety tematu
```

Dla początkującego użytkownika losowe mieszanie problemów będzie frustrujące i może zwiększyć obciążenie poznawcze. Dla użytkownika średniego i zaawansowanego mieszanie jest kluczowe, bo uczy rozpoznawania, a nie tylko wykonywania znanej procedury.

### 6. Worked examples i fading w tracku algorytmicznym

Algorithms / LeetCode-style Track nie powinien zaczynać od pełnego kodowania na telefonie.

Lepszy progression:

```txt
worked_example
  ↓
pattern_identification
  ↓
strategy_choice
  ↓
complexity_analysis
  ↓
solution_comparison
  ↓
independent_attempt
```

W MVP można pominąć pełny edytor kodu, ale nie można pominąć logiki przejścia od przykładu do samodzielnej decyzji.

### 7. Progress screen ma prowadzić do decyzji

Progress nie jest cockpit'em statystycznym.

Każdy ekran postępu powinien odpowiedzieć na pytanie:

```txt
Co mam teraz zrobić?
```

Dopuszczalne sekcje:

- `Recommended next session`,
- `Weak areas`,
- `Performance by topic`,
- `Recent mistakes`,
- `Review due`,
- `Accuracy trend`,
- `Attempts by mode`.

Niedopuszczalne jako core:

- syntetyczny `readiness score`,
- syntetyczny `retention score`,
- ogólne `You are 82% ready`,
- streak jako główny element motywacji,
- ranking,
- badge za klikanie.

Jeżeli aplikacja używa słowa `readiness`, musi ono być opisowe i ostrożne, np.:

```txt
Practice signal
Track insight
Review priority
Evidence level
```

Nie:

```txt
Readiness: 82%
Retention: 74%
You are ready for the exam
You mastered this topic
```

## Tryby sesji wynikające z modelu nauki

### Practice

Cel: podstawowa aktywna praktyka z natychmiastowym feedbackiem.

Wymagania:

- krótkie sesje,
- feedback po każdej odpowiedzi,
- zapis typu błędu,
- aktualizacja item state,
- możliwość przejścia do review.

### Review

Cel: powrót do itemów, tematów i błędów, które wymagają korekty.

Wymagania:

- kolejka z `dueAt`,
- priorytet,
- powód review,
- możliwość oznaczenia jako `resolved`, ale tylko po poprawnej próbie,
- nie usuwać itemu z review wyłącznie po kliknięciu `I understand`.

### Pattern Drill

Cel: rozpoznawanie wzorców.

Wymagania:

- item pokazuje problem / sytuację,
- użytkownik wybiera pattern,
- feedback wyjaśnia sygnały rozpoznawcze,
- sesja może zawierać kontrastowe wzorce.

### Strategy Practice

Cel: wybór strategii rozwiązania.

Wymagania:

- użytkownik wybiera podejście,
- system porównuje podejście z optymalnym lub akceptowalnym,
- feedback pokazuje trade-off tylko wtedy, gdy jest potrzebny,
- nie dodawać osobnego pytania o trade-offy, jeżeli wystarczy podsumowanie po wyborze.

### Complexity Check

Cel: trening złożoności czasowej i pamięciowej.

Wymagania:

- użytkownik wybiera time complexity,
- użytkownik wybiera space complexity,
- feedback pokazuje źródło złożoności,
- złożoność jest zapisywana jako osobny wymiar wyniku.

### Weak Areas

Cel: sesja wygenerowana z danych o słabych obszarach.

Wymagania:

- źródłem są `WeakArea` i `ReviewQueueItem`,
- sesja nie może być losowa,
- użytkownik widzi powód rekomendacji,
- po sesji powód powinien zostać zaktualizowany.

### Exam / Timed Challenge

Cel: sprawdzenie pod presją czasu lub bez natychmiastowego feedbacku.

Wymagania:

- feedback dopiero po zakończeniu,
- wynik nie powinien być głównym mechanizmem nauki,
- po zakończeniu musi powstać lista konkretnych review actions.

Dla Cloud Certification można używać trybu exam-style. Dla Algorithms lepszy jest `Timed Challenge`, bez sugerowania, że aplikacja symuluje prawdziwy interview albo LeetCode contest.

## Model metryk

### Metryki preferowane

| Metryka | Znaczenie | Użycie w UI |
|---|---|---|
| `firstAttemptAccuracy` | Czy użytkownik rozpoznaje odpowiedź bez pomocy. | Performance by topic, Track detail. |
| `normalizedScore` | Wynik uwzględniający partial credit. | Trend i agregaty. |
| `mistakeTypeFrequency` | Jakie błędy wracają. | Weak areas, Review. |
| `strategySelectionAccuracy` | Czy użytkownik wybiera właściwe podejście. | Algorithms detail. |
| `complexityAccuracy` | Czy użytkownik rozumie time/space complexity. | Algorithms detail. |
| `hintUsageRate` | Czy poprawność zależy od pomocy. | Diagnostyka, nie ranking. |
| `repeatErrorAfterDelay` | Czy błąd wraca po czasie. | Review priority. |
| `taxonomyCoverage` | Czy użytkownik ćwiczył wystarczająco szeroko. | Track progress. |
| `recentTrend` | Czy ostatnie próby idą w dobrą stronę. | Progress summary. |
| `reviewDueCount` | Ile elementów wymaga powrotu. | Home, Review. |

### Metryki do usunięcia lub ukrycia

| Metryka | Decyzja | Powód |
|---|---|---|
| `readinessScore` | Nie używać jako procentu. | Tworzy fałszywą predykcję gotowości. |
| `retentionScore` | Nie używać jako procentu. | Bez kontrolowanego spaced review jest niemiarodajne. |
| `masteryPercent` | Unikać. | Sugeruje trwałe opanowanie. |
| `streak` | Poza core. | Może premiować klikanie zamiast nauki. |
| `leaderboardRank` | Poza zakresem. | Nie wspiera indywidualnej diagnostyki. |
| `badgeCount` | Poza core. | Motywacja zewnętrzna może odciągać od jakości treningu. |

### Zalecane nazewnictwo UI

Zamiast:

```txt
Readiness
Retention
Mastery
```

Używać:

```txt
Practice signal
Topic performance
Evidence level
Review priority
Recent accuracy
First-try accuracy
Mistake pattern
Needs review
Improving
Strong recently
Not enough data
```

## Aktualizacja modelu danych

### TrainingAttempt

Dodać lub utrzymać pola umożliwiające diagnostykę nauki.

```ts
type TrainingAttempt = {
  id: AttemptId;
  sessionId: SessionId;
  trackId: TrackId;
  itemId: TrainingItemId;

  startedAt: ISODateString;
  submittedAt: ISODateString;
  durationMs?: Milliseconds;

  answer: AttemptAnswer;
  result: AttemptResult;

  firstAttempt: boolean;
  usedHint: boolean;
  hintCount?: number;
  confidence?: ConfidenceLevel;

  normalizedScore: Percent;
  mistakeTypes: MistakeType[];
  taxonomyRefs: TaxonomyRef[];

  expectedPatternId?: string;
  selectedPatternId?: string;

  expectedStrategyId?: string;
  selectedStrategyId?: string;

  expectedTimeComplexity?: ComplexityClass;
  selectedTimeComplexity?: ComplexityClass;

  expectedSpaceComplexity?: ComplexityClass;
  selectedSpaceComplexity?: ComplexityClass;

  contentVersion: ContentVersion;
};
```

```ts
type ConfidenceLevel = 'low' | 'medium' | 'high';

type ComplexityClass =
  | 'O(1)'
  | 'O(log n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n^2)'
  | 'O(2^n)'
  | 'O(n!)'
  | 'other';
```

### UserItemState

Rozszerzyć `UserItemState` o sygnały uczenia.

```ts
type UserItemState = {
  trackId: TrackId;
  itemId: TrainingItemId;

  timesSeen: number;
  timesAttempted: number;
  timesCorrect: number;
  timesIncorrect: number;
  timesPartial: number;

  firstAttemptCorrectCount: number;
  hintUsageCount: number;

  lastSeenAt?: ISODateString;
  lastAttemptedAt?: ISODateString;
  lastCorrectAt?: ISODateString;
  lastIncorrectAt?: ISODateString;
  lastAttemptId?: AttemptId;

  lastNormalizedScore?: Percent;
  rollingNormalizedScore?: Percent;
  lastConfidence?: ConfidenceLevel;
  lastMistakeTypes?: MistakeType[];

  markedForReview: boolean;
  reviewDueAt?: ISODateString;
  reviewPriority?: number;

  resolvedAfterReviewCount: number;

  contentVersion: ContentVersion;
};
```

Usunąć lub nie eksponować jako core:

```ts
mastered: boolean;
```

Jeżeli `mastered` zostaje technicznie, nie komunikować go użytkownikowi jako trwałego opanowania. Lepiej traktować jako lokalny stan operacyjny, np. `temporarilyResolved`.

### ReviewQueueItem

Rozszerzyć `ReviewQueueItem`.

```ts
type ReviewQueueItem = {
  trackId: TrackId;
  itemId?: TrainingItemId;
  taxonomyRef?: TaxonomyRef;

  reason: ReviewReason;
  priority: number;
  dueAt: ISODateString;

  sourceAttemptIds: AttemptId[];
  recurrenceCount: number;

  createdAt: ISODateString;
  lastReviewedAt?: ISODateString;
  resolvedAt?: ISODateString;
};
```

```ts
type ReviewReason =
  | 'incorrect_answer'
  | 'partial_answer'
  | 'low_confidence'
  | 'hint_dependency'
  | 'marked_for_review'
  | 'weak_taxonomy_area'
  | 'wrong_pattern'
  | 'wrong_strategy'
  | 'complexity_error'
  | 'repeat_error_after_delay'
  | 'scheduled_retrieval';
```

### TrackProgress

Zastąpić `readiness` bardziej konkretnymi insightami.

```ts
type TrackProgress = {
  trackId: TrackId;

  totalSessions: number;
  totalAttempts: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalPartial: number;

  overallScore: Percent;
  overallAccuracy?: Percent;
  firstAttemptAccuracy?: Percent;

  byTaxonomy: Record<string, TaxonomyProgress>;
  weakAreas: WeakArea[];
  insights: ProgressInsight[];

  reviewDueCount: number;
  lastSessionId?: SessionId;
  lastPracticedAt?: ISODateString;
  updatedAt: ISODateString;
};
```

```ts
type ProgressInsight = {
  id: string;
  trackId: TrackId;
  type:
    | 'weak_area'
    | 'improving_area'
    | 'repeat_mistake'
    | 'hint_dependency'
    | 'complexity_gap'
    | 'low_coverage'
    | 'review_due'
    | 'not_enough_data';

  title: string;
  description: string;
  evidence: ProgressEvidence[];
  recommendedModeId?: SessionModeId;
  recommendedTaxonomyRef?: TaxonomyRef;
  priority: number;
};
```

```ts
type ProgressEvidence = {
  label: string;
  value: string | number;
  attemptIds?: AttemptId[];
  taxonomyRefs?: TaxonomyRef[];
};
```

### TaxonomyProgress

```ts
type TaxonomyProgress = {
  axisId: string;
  nodeId: string;

  attempted: number;
  correct: number;
  incorrect: number;
  partial: number;

  normalizedScore: Percent;
  firstAttemptAccuracy?: Percent;
  hintUsageRate?: Percent;
  repeatErrorCount?: number;

  lastPracticedAt?: ISODateString;
  reviewDueCount: number;
  evidenceLevel: EvidenceLevel;
};
```

```ts
type EvidenceLevel =
  | 'not_enough_data'
  | 'low'
  | 'medium'
  | 'high';
```

`EvidenceLevel` nie mówi, że użytkownik „umie”. Mówi tylko, jak dużo danych ma aplikacja, żeby cokolwiek sugerować.

## Aktualizacja ekranów

### Home

Home powinien pokazywać jedną główną akcję i jeden konkretny powód.

Przykład:

```txt
Continue practice
IAM policy conditions need review
You missed condition logic twice this week.
```

Nie:

```txt
You are 76% ready
Retention is improving
```

### Practice

Practice powinno dawać użytkownikowi kontrolę nad tym, czego chce się uczyć.

Wymagane:

- aktywny track,
- wybór trybu,
- możliwość wyboru topic/pattern/domain,
- rekomendacja jako propozycja, nie jedyna droga,
- jasny powód rekomendacji.

### Session Summary

Session Summary nie powinien być tylko wynikiem procentowym.

Minimalne sekcje:

```txt
Result
  - score
  - first-try accuracy
  - hint usage

What went wrong
  - mistake types
  - weak taxonomy areas

What to do next
  - recommended review
  - recommended session
```

### Progress

Progress powinien mieć dwa poziomy:

```txt
Progress Overview
  ↓
Performance by topic
  ↓
Topic Detail
  ↓
Recommended action
```

`Performance by topic` powinno pokazywać agregaty tematu, np.:

- attempts,
- first-try accuracy,
- recent accuracy,
- review due,
- most common mistake,
- evidence level.

Po tapnięciu tematu otwiera się `Topic Detail`.

### Topic Detail

Nowy ekran wymagany dla `Performance by topic`.

Struktura:

```txt
Topic Detail
  ↓
Topic header
  - title
  - short description
  - evidence level

Performance summary
  - first-try accuracy
  - recent accuracy
  - attempts
  - review due

Common mistakes
  - mistake type
  - count
  - short explanation

Recent attempts
  - last attempts in this topic

Recommended next action
  - start review
  - start focused practice
  - start contrast practice
```

Nie dodawać dużej liczby wykresów. Wykres jest dodatkiem, nie centrum decyzji.

### Settings

Settings nie powinno zawierać ustawień, które sugerują fałszywą precyzję uczenia.

Usunąć / nie dodawać:

- `difficulty balance`, jeżeli nie ma realnego algorytmu doboru trudności,
- `retention target`,
- `readiness target`,
- ustawień gamifikacji w MVP.

Dopuszczalne ustawienia:

- active tracks,
- default session length,
- feedback timing,
- daily reminder,
- reset learning data,
- content version,
- legal/source notes.

## Content guidelines

Każdy `TrainingItem` powinien mieć metadane wspierające feedback i diagnostykę.

```ts
type LearningMetadata = {
  taxonomyRefs: TaxonomyRef[];
  primarySkill: string;
  secondarySkills?: string[];
  expectedMistakeTypes?: MistakeType[];
  prerequisiteSkillIds?: string[];
  contrastWithSkillIds?: string[];
  recommendedFollowUpItemIds?: TrainingItemId[];
  difficulty: DifficultyLevel;
  cognitiveLoad: 'low' | 'medium' | 'high';
};
```

Dla Algorithms item powinien jasno określać:

- expected pattern,
- accepted alternative patterns,
- expected strategy,
- naive strategy,
- optimal strategy,
- time complexity,
- space complexity,
- typical traps,
- contrast cases.

Dla Cloud Certification item powinien jasno określać:

- domain,
- topic,
- service / concept,
- tested decision rule,
- least privilege / cost / availability / security signal,
- distractor explanations,
- common misconception.

## Algorytm rekomendacji MVP

Nie używać ML w MVP. Wystarczy deterministyczny scoring.

```txt
candidateScore =
  reviewDueWeight
  + weakAreaWeight
  + repeatMistakeWeight
  + lowCoverageWeight
  + recentFailureWeight
  + manualSelectionWeight
  - recentSuccessWeight
```

Przykładowe reguły:

```txt
incorrect answer         +3
partial answer           +2
low confidence           +1
used hint                +1
same mistake repeated    +3
review overdue           +2
not practiced recently   +1
correct twice recently   -2
manually selected topic  +2
```

Rekomendacja musi być wyjaśnialna w UI:

```txt
Recommended because you missed IAM condition logic twice and have 4 items due for review.
```

Nie:

```txt
Recommended by AI
```

## Definicja sukcesu produktu

Patternly jest skuteczne, jeżeli użytkownik:

- częściej odpowiada poprawnie za pierwszym razem,
- rzadziej powtarza ten sam typ błędu,
- potrafi rozpoznać właściwy wzorzec w nowym problemie,
- lepiej dobiera strategię,
- lepiej uzasadnia złożoność,
- wraca do słabych obszarów w odpowiednim czasie,
- wie, co ćwiczyć dalej.

Nie mierzyć sukcesu przez:

- liczbę ekranów,
- liczbę wykresów,
- liczbę badge'y,
- czas spędzony w aplikacji jako samodzielną metrykę,
- deklarowaną gotowość,
- ogólny retention score bez kontrolowanej definicji.

## Wpływ na istniejącą dokumentację

### `00-overview.md`

Zaktualizować język:

- `readiness helper` → `practice insight tool` albo `learning diagnostics tool`,
- dopisać, że głównym mechanizmem są active recall, diagnostic feedback, spaced review i pattern recognition,
- doprecyzować, że Progress ma prowadzić do decyzji, nie tylko pokazywać wynik.

### `01-product-definition.md`

Zaktualizować:

- `readiness insight` → `learning insight`,
- usunąć sugestie gotowości jako syntetycznego wyniku,
- dopisać definicję skuteczności: first-attempt accuracy, mistake recurrence, strategy selection, complexity accuracy.

### `03-navigation-and-flows.md`

Zaktualizować:

- `readiness / confidence` → `practice signals / evidence level`,
- dodać `Topic Detail` po tapnięciu w `Performance by topic`,
- dodać flow `Recommended next action` po każdym ekranie Progress.

### `04-data-model.md`

Zaktualizować:

- ograniczyć lub usunąć `ReadinessState`,
- dodać `ProgressInsight`, `EvidenceLevel`, `firstAttemptAccuracy`, `hintUsageRate`, `repeatErrorCount`,
- rozszerzyć `ReviewReason`,
- rozszerzyć `TrainingAttempt` o pola diagnostyczne.

### `05-design-system.md`

Zaktualizować:

- komponenty progressu powinny komunikować konkretne sygnały, nie syntetyczną gotowość,
- `ProgressInsightCard` powinien mieć zawsze `reason` i `recommended action`,
- unikać dużych score ringów dla metryk niepewnych.

### `07-content-guidelines.md`

Dodać:

- `LearningMetadata`,
- wymagane explanation structure,
- typy błędów,
- contrast cases,
- distractor explanations.

### `10-roadmap.md`

Dodać przed albo w ramach Phase 5:

```txt
Phase 4.5 — Learning Effectiveness Layer
```

Zakres:

- diagnostic attempt fields,
- review scheduler MVP,
- progress insights,
- Topic Detail,
- feedback templates,
- mistake taxonomy,
- deterministic recommendation rules.

### `12-testing-strategy.md`

Dodać testy:

- attempt zapisuje first attempt, hint usage i mistake types,
- błędny item trafia do review queue,
- powtarzalny błąd zwiększa priority,
- correct-after-review zmienia status review,
- ProgressInsight ma evidence i recommended action,
- topic detail liczy agregaty poprawnie.

## MVP acceptance criteria

MVP spełnia ten dokument, jeżeli:

- każda sesja zapisuje aktywną próbę użytkownika,
- feedback zawiera przyczynę, regułę decyzyjną i następny krok,
- review queue powstaje automatycznie z błędów i słabych obszarów,
- Progress pokazuje konkretne słabe obszary i rekomendowaną akcję,
- Performance by topic prowadzi do Topic Detail,
- aplikacja nie pokazuje procentowego `readiness` ani `retention`,
- recommendations są wyjaśnialne,
- content ma metadane do diagnostyki,
- Algorithms track mierzy pattern, strategy i complexity oddzielnie,
- Cloud Certification track mierzy domain/topic/concept i wyjaśnia dystraktory.

## Źródła badawcze

- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). *Improving Students’ Learning With Effective Learning Techniques: Promising Directions From Cognitive and Educational Psychology*. Psychological Science in the Public Interest. DOI: `10.1177/1529100612453266`.
- Roediger, H. L., & Karpicke, J. D. (2006). *Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention*. Psychological Science. DOI: `10.1111/j.1467-9280.2006.01693.x`.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). *Distributed practice in verbal recall tasks: A review and quantitative synthesis*. Psychological Bulletin. DOI: `10.1037/0033-2909.132.3.354`.
- Shute, V. J. (2008). *Focus on Formative Feedback*. Review of Educational Research. DOI: `10.3102/0034654307313795`.
- Atkinson, R. K., Derry, S. J., Renkl, A., & Wortham, D. (2000). *Learning From Examples: Instructional Principles From the Worked Examples Research*. Review of Educational Research. DOI: `10.3102/00346543070002181`.
- Choffin, B., Popineau, F., Bourda, Y., & Vie, J.-J. (2019). *DAS3H: Modeling Student Learning and Forgetting for Optimally Scheduling Distributed Practice of Skills*. arXiv: `1905.06873`.
- Kaliisa, R., Misiejuk, K., López-Pernas, S., Khalil, M., & Saqr, M. (2023). *Have Learning Analytics Dashboards Lived Up to the Hype? A Systematic Review of Impact on Students’ Achievement, Motivation, Participation and Attitude*. arXiv: `2312.15042`.
- Almeida, C., Kalinowski, M., Uchoa, A., & Feijo, B. (2023). *Negative Effects of Gamification in Education Software: Systematic Mapping and Practitioner Perceptions*. arXiv: `2305.08346`.

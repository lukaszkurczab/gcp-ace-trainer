# 11 — Implementation Guidelines

## Cel

Ten dokument opisuje praktyczne zasady implementacji dla wielotrackowej aplikacji treningowej.

Kod nie powinien być projektowany jako jednorazowa aplikacja do jednego egzaminu. Pierwsze tracki produktu to:

- `cloud-certification` — przygotowanie do certyfikacji technicznych, początkowo GCP ACE-style,
- `algorithms` — LeetCode-style / algorithmic problem-solving, ale bez kopiowania platformy LeetCode i bez online judge w MVP.

Implementacja musi wspierać wspólny model:

```txt
app → track → session mode → training item → attempt → feedback/result → progress
```

## Zasada nadrzędna

Nie zaczynać od typów i komponentów specyficznych dla GCP, egzaminu albo quizu.

Dobre centrum implementacji:

```txt
Track
SessionMode
TrainingItem
TrainingAttempt
TrainingSession
SessionResult
UserItemState
ReviewQueueItem
UserProgress
```

Złe centrum implementacji:

```txt
Question
QuizSession
ExamSession
UserAnswer
DomainProgress
GcpQuestion
AceExam
```

`Question` może istnieć jako wariant `TrainingItem`, ale nie jako root całej domeny.

---

## TypeScript

Używać silnych typów dla:

- tracków,
- trybów sesji,
- training itemów,
- attemptów,
- odpowiedzi użytkownika,
- scoringu,
- feedbacku,
- progressu,
- review queue,
- ustawień,
- storage,
- content packów.

Unikać `any`. Jeżeli typ nie jest jeszcze znany, zdefiniować roboczy typ domenowy i zawęzić go później.

Preferować union types dla różnic między trackami.

Przykład:

```ts
export type TrackId = 'cloud-certification' | 'algorithms';

export type SessionMode =
  | 'practice'
  | 'exam_simulation'
  | 'review'
  | 'pattern_drill'
  | 'strategy_practice'
  | 'timed_challenge';

export type TrainingItemType =
  | 'single_choice_question'
  | 'multiple_choice_question'
  | 'strategy_choice'
  | 'pattern_identification'
  | 'complexity_analysis'
  | 'solution_comparison'
  | 'mistake_review';
```

Dla pól zależnych od typu itemu używać discriminated unions:

```ts
export type TrainingItem =
  | CloudQuestionItem
  | AlgorithmStrategyItem
  | ComplexityAnalysisItem;
```

Nie dodawać pól opcjonalnych wszędzie tylko dlatego, że różne tracki mają różne potrzeby. To szybko prowadzi do modelu, którego nie da się walidować.

---

## Struktura katalogów

Preferowana struktura:

```txt
src/
  app/
    navigation/
    providers/
  components/
    base/
    training/
    feedback/
    progress/
  domain/
    tracks/
    sessions/
    training-items/
    attempts/
    scoring/
    feedback/
    progress/
    review/
  features/
    home/
    practice/
    session/
    review/
    progress/
    settings/
  tracks/
    cloud-certification/
      components/
      content/
      scoring/
      taxonomy/
    algorithms/
      components/
      content/
      scoring/
      taxonomy/
  storage/
    adapters/
    repositories/
    migrations/
  theme/
  utils/
```

Zasada:

- `domain/*` zawiera czystą logikę wspólną,
- `features/*` zawiera flow ekranów,
- `tracks/*` zawiera rozszerzenia per track,
- `components/base` nie zna tracków,
- `components/training` zna pojęcia treningowe, ale nie powinien znać GCP ani Algorithms,
- `storage` nie zna UI.

---

## Track registry

Zamiast ciężkiego plugin-systemu używać lekkiego rejestru tracków.

Przykład:

```ts
export interface TrackDefinition {
  id: TrackId;
  title: string;
  description: string;
  supportedSessionModes: SessionMode[];
  taxonomy: TrackTaxonomy;
  getInitialSessionMode: () => SessionMode;
  createSession: CreateSessionFn;
  scoreAttempt: ScoreAttemptFn;
  getFeedback: FeedbackFn;
}
```

Track registry powinien umożliwiać:

- wyświetlenie dostępnych tracków,
- wybór aktywnego tracka,
- utworzenie sesji dla tracka,
- scoring odpowiedzi,
- pobranie feedbacku,
- przeliczenie progressu.

Nie powinien robić:

- dynamicznego ładowania kodu w MVP,
- zewnętrznego marketplace tracków,
- skomplikowanego systemu pluginów,
- backendowego zarządzania contentem.

---

## Logika domenowa

Logika domenowa musi być czysta, deterministyczna i testowalna.

Dobre funkcje:

```ts
createTrainingSession(track, mode, itemPool, settings)
scoreTrainingAttempt(item, response)
calculateSessionResult(session, attempts)
updateUserItemState(previousState, attemptResult)
getReviewQueue(itemStates, attempts)
calculateTrackProgress(trackId, sessions, attempts, itemStates)
selectNextRecommendedSession(userProgress, activeTrack)
```

Funkcje dopuszczalne tylko jako warianty trackowe:

```ts
scoreCloudQuestionAttempt(item, response)
scoreAlgorithmStrategyAttempt(item, response)
calculateCloudDomainProgress(...)
calculateAlgorithmPatternProgress(...)
```

Cechy dobrej logiki domenowej:

- brak zależności od React,
- brak zależności od React Native,
- brak bezpośredniego storage,
- brak bezpośrednich efektów ubocznych,
- łatwa testowalność,
- deterministyczne wejście/wyjście,
- jawne wersjonowanie contentu, jeśli wynik zależy od content packa.

---

## Komponenty

Komponenty powinny być małe, jasno nazwane i neutralne względem tracków, chyba że świadomie są częścią `tracks/*`.

Dobre komponenty wspólne:

```txt
TrainingItemCard
ChoiceOption
SessionProgress
FeedbackPanel
ExplanationBlock
ProgressInsightCard
ReviewQueueCard
TrackCard
SessionModeCard
TaxonomyBadge
```

Dobre komponenty track-specific:

```txt
CloudServiceBadge
CloudScenarioCard
AlgorithmPatternBadge
ComplexitySummary
ApproachComparisonCard
```

Złe komponenty jako baza systemu:

```txt
QuestionCard
AnswerOption
DomainProgressCard
ExamResultCard
GcpQuestionScreen
LeetCodeProblemScreen
```

Te nazwy mogą istnieć lokalnie tylko wtedy, gdy są jednoznacznie ograniczone do konkretnego tracka. Nie powinny być fundamentem design systemu ani domeny.

---

## Ekrany i flow

Ekrany powinny wynikać z modelu:

```txt
track → session mode → training item → attempt → feedback → progress
```

Dobre nazwy ekranów:

```txt
HomeScreen
TrackSelectionScreen
PracticeScreen
SessionModeSelectionScreen
TrainingSessionScreen
TrainingItemScreen
SessionResultScreen
ReviewScreen
ProgressScreen
SettingsScreen
```

Nazwy do unikania jako główna architektura:

```txt
ExamScreen
QuizScreen
QuestionScreen
GcpHomeScreen
AcePracticeScreen
```

`ExamScreen` może istnieć jako ekran wewnętrzny dla `exam_simulation`, ale nie jako centrum aplikacji.

---

## Style

Nie stosować przypadkowych wartości inline.

Źle:

```tsx
<View style={{ padding: 17, backgroundColor: '#fafafa' }}>
```

Dobrze:

```tsx
<View style={{ padding: spacing.lg, backgroundColor: colors.background }}>
```

Jeszcze lepiej: użyć wspólnego komponentu:

```tsx
<Screen padding="lg" background="default">
```

Wartości takie jak kolory tracków powinny pochodzić z tokenów lub definicji tracka, nie z ekranów.

---

## Theme

Kolory, spacing, typografia i radii powinny pochodzić z `src/theme`.

Nie duplikować tokenów w ekranach.

Theme powinien zawierać:

- base colors,
- semantic colors,
- typography,
- spacing,
- radii,
- shadows/elevation,
- focus/pressed/disabled states,
- dark mode tokens,
- opcjonalne track accent tokens.

Track accent nie jest osobnym pełnym theme’em. To tylko akcent wizualny dla orientacji użytkownika.

---

## Storage

UI nie powinien bezpośrednio wywoływać storage engine.

Źle:

```ts
AsyncStorage.setItem('gcpAceTrainer:questions', JSON.stringify(data));
```

Dobrze:

```ts
trainingSessionRepository.saveSession(session);
userProgressRepository.saveProgress(progress);
reviewQueueRepository.saveQueue(queue);
```

Storage powinien zapisywać głównie dane użytkownika:

- selected track,
- session state,
- attempts,
- item states,
- progress,
- review queue,
- settings,
- content metadata.

Nie kopiować całych bundlowanych content packów do storage, jeżeli nie ma takiej potrzeby. Wystarczą referencje:

```txt
trackId
itemId
contentVersion
sessionId
attemptId
```

---

## Content packs

Content powinien być wersjonowany per track.

Przykładowa struktura:

```txt
data/
  tracks/
    cloud-certification/
      v1/
        items.json
        taxonomy.json
    algorithms/
      v1/
        items.json
        taxonomy.json
```

Każdy item powinien mieć:

- `id`,
- `trackId`,
- `type`,
- `contentVersion`,
- `taxonomyRefs`,
- `difficulty`,
- `prompt`,
- `acceptedResponse` lub `scoring`,
- `explanation` / `feedback`.

Nie zakładać, że każdy item ma:

- jedną poprawną odpowiedź,
- listę odpowiedzi A/B/C/D,
- domenę egzaminacyjną,
- wynik binarny `correct/incorrect`.

---

## Error handling

Storage może zawieść. Dane lokalne mogą być uszkodzone. Content pack może mieć niezgodną wersję. Attempt może odwoływać się do itemu, którego nie ma już w aktualnym content packu.

Minimalne zachowanie:

- try/catch w adapterach,
- walidacja danych z storage,
- fallback do defaultów,
- error state w UI,
- możliwość resetu danych treningowych,
- bezpieczne pominięcie uszkodzonego itemu,
- komunikat, że część danych mogła zostać pominięta po aktualizacji contentu.

Nie ukrywać błędów migracji przez ciche czyszczenie całego storage bez komunikatu.

---

## Nazewnictwo

Preferować nazwy domenowe zgodne z modelem wielotrackowym:

```txt
Track
TrackDefinition
SessionMode
TrainingItem
TrainingAttempt
TrainingSession
SessionResult
AttemptResponse
FeedbackPanel
UserItemState
ReviewQueueItem
TrackProgress
UserProgress
TaxonomyRef
ContentPack
```

Unikać nazw generycznych:

```txt
Item
Data
Record
Thing
Box
Stuff
```

Unikać nazw zamykających model na jeden track:

```txt
GcpQuestion
AceQuestion
QuizSession
ExamDomain
UserAnswer
QuestionState
LeetCodeProblem
CodeJudgeResult
```

Wyjątek: nazwy track-specific są dopuszczalne wewnątrz `tracks/cloud-certification/*` albo `tracks/algorithms/*`.

---

## Feature boundaries

Kod wspólny:

```txt
domain/sessions
domain/training-items
domain/attempts
domain/scoring
domain/progress
domain/review
features/session
features/practice
features/progress
```

Kod specyficzny dla tracków:

```txt
tracks/cloud-certification
tracks/algorithms
```

Nie mieszać logiki GCP w `features/practice`. `features/practice` powinno wiedzieć, że obsługuje sesję treningową, ale nie powinno znać domen GCP ani patternów algorytmicznych poza danymi przekazanymi przez track registry.

---

## Imports

Unikać głębokich, kruchych importów. Rozważyć aliasy:

```txt
@/components
@/features
@/domain
@/tracks
@/storage
@/theme
@/utils
```

Warto dodać barrel exports na granicach modułów, ale nie tworzyć jednego globalnego `index.ts`, który eksportuje wszystko.

---

## State management

Na MVP nie wprowadzać ciężkiego global state management bez potrzeby.

Wystarczy:

- lokalny state ekranów,
- custom hooks,
- storage adaptery,
- prosty context dla theme/settings,
- prosty context lub hook dla aktywnej sesji,
- repozytoria dla danych użytkownika.

Nie dodawać Redux/Zustand tylko dlatego, że projekt może kiedyś urosnąć.

Dodać global state dopiero wtedy, gdy pojawi się realny problem:

- wiele niezależnych ekranów edytuje tę samą aktywną sesję,
- synchronizacja online/offline wymaga kolejki zdarzeń,
- wiele tracków ładuje się dynamicznie,
- analytics/progress zaczynają wymagać event sourcingu.

---

## Performance

MVP nie powinno mieć ciężkich problemów wydajnościowych, ale uważać na:

- renderowanie dużych list training itemów,
- niepotrzebne przeliczanie progressu po każdym renderze,
- zapisywanie całych struktur po każdej drobnej zmianie,
- niekontrolowane re-rendery choice options,
- parsowanie dużych content packów przy każdym wejściu na ekran,
- generowanie review queue synchronicznie na dużym zbiorze danych.

Zasady:

- progress może być cache’em odtwarzalnym z attemptów,
- content packi ładować raz i cache’ować w pamięci,
- listy itemów renderować przez list components z wirtualizacją,
- scoring i selection logic trzymać poza UI,
- zapis attemptu powinien być mały i inkrementalny.

---

## Accessibility basics

Minimalnie:

- czytelne kontrasty,
- duże touch targets,
- niepoleganie wyłącznie na kolorze,
- jasne etykiety przycisków,
- przewidywalna kolejność elementów,
- screen reader labels dla wyborów odpowiedzi,
- informacja tekstowa dla stanu correct/incorrect/partial,
- dostępne focus states,
- brak blokowania treści wyłącznie animacją.

Dla Algorithms ważne jest też, żeby fragmenty pseudokodu, złożoności i porównania strategii były czytelne na małym ekranie.

---

## Testing

Testować przede wszystkim logikę domenową.

Priorytet testów:

1. Tworzenie sesji per track i mode.
2. Scoring attemptów.
3. Feedback dla różnych typów itemów.
4. Aktualizacja `UserItemState`.
5. Generowanie review queue.
6. Przeliczanie progressu.
7. Migracje storage.
8. Obsługa brakującego lub zmienionego contentu.

Przykładowe testy:

```ts
it('scores a cloud single choice item correctly', () => {});
it('scores an algorithm strategy item with partial feedback', () => {});
it('adds failed attempts to review queue', () => {});
it('does not require exam mode for algorithms track', () => {});
it('keeps attempts linked to contentVersion', () => {});
```

Nie opierać testów wyłącznie na snapshotach UI.

---

## MVP implementation order

Rekomendowana kolejność implementacji:

1. Typy domenowe: `Track`, `TrainingItem`, `TrainingSession`, `TrainingAttempt`, `Progress`.
2. Track registry.
3. Minimalne content packi dla `cloud-certification` i `algorithms`.
4. Storage repositories i migracje.
5. Session engine.
6. Wspólne komponenty treningowe.
7. Track selection i Home.
8. Practice flow dla obu tracków.
9. Feedback i session result.
10. Review queue.
11. Progress per track.
12. Exam simulation dla cloud-certification.
13. Timed challenge dla algorithms.

Nie zaczynać od pełnego Exam Mode, bo to ponownie ustawi produkt jako aplikację egzaminacyjną.

---

## Pull request checklist

Każda większa zmiana powinna odpowiedzieć:

- Czy kod używa modelu `track → session mode → training item → attempt → feedback → progress`?
- Czy logika domenowa jest poza UI?
- Czy typy są neutralne względem tracków?
- Czy GCP-specific kod nie wycieka poza `tracks/cloud-certification`?
- Czy Algorithms-specific kod nie wycieka poza `tracks/algorithms`?
- Czy UI używa design systemu?
- Czy storage idzie przez adapter/repository?
- Czy dodane modele są typowane?
- Czy attempt zapisuje `trackId`, `itemId` i `contentVersion`?
- Czy flow działa offline?
- Czy błąd ma sensowny empty/error state?
- Czy nie wprowadzamy backendu/auth bez ADR?
- Czy nie wprowadzamy online judge/code execution bez osobnej decyzji?
- Czy nie kopiujemy oficjalnych pytań egzaminacyjnych, LeetCode problemów ani editoriali?
- Czy nowy kod nie zakłada, że każdy item jest pytaniem A/B/C/D?

---

## Antywzorce implementacyjne

Unikać:

- budowania całej aplikacji wokół `Question`,
- traktowania `Exam Mode` jako głównego flow,
- zapisywania content packów jako danych użytkownika,
- mieszania logiki tracków w ekranach wspólnych,
- tworzenia pełnego plugin-systemu przed realną potrzebą,
- dodawania backendu tylko po to, żeby przechowywać lokalny progress,
- projektowania Algorithms jako pełnego LeetCode clone,
- dodawania code execution sandbox w MVP,
- używania nazw GCP jako nazw globalnych komponentów,
- liczenia progressu wyłącznie według domen egzaminacyjnych,
- binarnego feedbacku tam, gdzie potrzebny jest feedback częściowy lub strategiczny.

# 02 — Architecture

## Status dokumentu

Ten dokument definiuje architekturę aplikacji po zmianie modelu produktu z pojedynczego trenera egzaminacyjnego na **wielotrackową aplikację treningową**.

Najważniejsza decyzja architektoniczna: aplikacja nie może być zaprojektowana jako `quiz app` albo `exam app` z jednym typem pytania. GCP ACE i Algorithms / LeetCode-style są **trackami**, a Practice, Exam, Review, Pattern Drill i Strategy Practice są **trybami sesji**.

Architektura powinna wspierać model:

```txt
app
  ↓
track
  ↓
session mode
  ↓
training item
  ↓
attempt
  ↓
feedback / result
  ↓
progress
```

## Cel architektury

Architektura ma umożliwić szybkie zbudowanie MVP, ale bez zamknięcia produktu na jeden typ contentu.

Aplikacja ma być:

- local-first,
- offline-first,
- bez backendu w MVP,
- bez logowania w MVP,
- testowalna poza React Native,
- oparta o statyczne, wersjonowane paczki contentu,
- gotowa na wiele tracków,
- przygotowana na późniejszą synchronizację,
- odporna na mieszanie logiki UI, scoringu, sesji i storage.

Architektura nie powinna wymagać przebudowy aplikacji przy dodaniu kolejnego tracka, np. AWS, Azure, SQL, system design albo kolejnej ścieżki algorytmicznej.

## Najważniejsze założenia MVP

MVP zakłada dwa tracki:

1. **Cloud Certification Track**
   - pytania jednokrotnego i wielokrotnego wyboru,
   - domeny egzaminacyjne,
   - Practice Mode,
   - Exam Mode,
   - Review Mode,
   - progress według domen i tematów.

2. **Algorithms / LeetCode-style Track**
   - mini-problemy,
   - rozpoznawanie wzorców,
   - wybór strategii,
   - wybór struktury danych,
   - analiza złożoności,
   - Pattern Drill,
   - Strategy Practice,
   - Review Mode,
   - progress według wzorców i kategorii.

W MVP nie zakładamy:

- pełnego edytora kodu,
- wykonywania kodu,
- judge online,
- integracji z LeetCode,
- backendu,
- kont użytkownika,
- zdalnego zarządzania contentem.

## Stack

Rekomendowany stack:

```txt
Expo
React Native
TypeScript
React Navigation
MMKV albo AsyncStorage
lokalne JSON/TS jako źródło contentu
własny theme layer
testy jednostkowe dla logiki domenowej
```

### MMKV vs AsyncStorage

Na MVP wystarczy AsyncStorage, ale preferowane jest MMKV, jeżeli nie komplikuje setupu Expo.

Ważniejsze od wyboru biblioteki jest ukrycie storage za adapterami. Żaden ekran nie powinien bezpośrednio korzystać z `AsyncStorage`, `MMKV` ani przyszłego API synchronizacji.

## Warstwy aplikacji

```txt
App Shell
  ↓
Navigation Layer
  ↓
Feature Layer
  ↓
Track Layer
  ↓
Domain Logic Layer
  ↓
Storage Layer
  ↓
Static Content Layer
```

## App Shell

Odpowiada za uruchomienie aplikacji i globalne providery.

Zakres:

- inicjalizacja theme,
- inicjalizacja storage,
- załadowanie registry tracków,
- obsługa globalnych błędów,
- podstawowe app state,
- ewentualne migracje lokalnego storage.

App Shell nie powinien znać szczegółów typu:

- jak oceniane jest pytanie GCP,
- czym jest sliding window,
- jak liczony jest wynik Exam Mode,
- jak agregowany jest progres algorytmów.

## Navigation Layer

Navigation Layer odpowiada za routing między głównymi obszarami aplikacji.

Na poziomie nawigacji nie należy tworzyć osobnych aplikacji dla każdego tracka. Track powinien być parametrem kontekstu, a nie osobnym światem UI.

Przykładowy routing:

```txt
Root
  ├─ Home
  ├─ TrackSelector
  ├─ SessionSetup
  ├─ SessionRunner
  ├─ SessionSummary
  ├─ Review
  ├─ Progress
  └─ Settings
```

Ekrany `SessionRunner`, `Review` i `Progress` powinny przyjmować `trackId` oraz opcjonalnie `sessionModeId`, zamiast mieć twarde założenie, że użytkownik rozwiązuje quiz egzaminacyjny.

## Feature Layer

Feature Layer grupuje ekrany, hooki i komponenty funkcjonalne.

Rekomendowane główne feature'y:

```txt
features/
  home/
  track-selector/
  session-setup/
  session-runner/
  session-summary/
  review/
  progress/
  settings/
```

Feature'y powinny być możliwie track-agnostic. Oznacza to, że `session-runner` nie powinien być nazwany `quiz`, a `progress` nie powinien zakładać wyłącznie domen egzaminacyjnych.

### Czego unikać

Nie budować struktury:

```txt
features/
  quiz/
  exam/
  gcp/
```

jako głównej osi aplikacji.

Taka struktura szybko zamknie produkt na jeden track i jeden format contentu.

## Track Layer

Track Layer jest lekką warstwą konfiguracyjno-domenową, która pozwala dodawać różne ścieżki treningowe bez kopiowania całej aplikacji.

Nie chodzi o ciężki system pluginów. W MVP wystarczy statyczny `track registry` w TypeScript.

Każdy track powinien deklarować:

- `trackId`,
- nazwę i opis,
- dostępne tryby sesji,
- typy training itemów,
- taksonomię progresu,
- źródła contentu,
- sposób scoringu,
- sposób budowania feedbacku,
- sposób agregowania statystyk,
- rekomendacje następnej sesji.

Przykład koncepcyjny:

```ts
type TrackDefinition = {
  id: TrackId;
  title: string;
  description: string;
  sessionModes: SessionModeDefinition[];
  contentManifest: ContentManifest;
  scoreAttempt: ScoreAttemptFn;
  buildFeedback: BuildFeedbackFn;
  aggregateProgress: AggregateProgressFn;
  recommendNextSession: RecommendNextSessionFn;
};
```

### Cloud Certification Track

Deklaruje między innymi:

- domeny,
- tematy,
- pytania single-choice,
- pytania multiple-choice,
- Practice Mode,
- Exam Mode,
- Review Mode,
- scoring odpowiedzi,
- progress według domen.

### Algorithms Track

Deklaruje między innymi:

- wzorce rozwiązań,
- kategorie problemów,
- struktury danych,
- typy błędów,
- mini-problemy,
- Pattern Drill,
- Strategy Practice,
- opcjonalny Timed Challenge,
- scoring wyboru strategii,
- progress według wzorców i kategorii.

## Domain Logic Layer

Domain Logic Layer to czysta logika aplikacji. Powinna być testowalna bez React Native, bez storage i bez renderowania UI.

Zakres:

- tworzenie sesji,
- wybór training itemów,
- filtrowanie contentu,
- scoring attemptów,
- budowanie feedbacku,
- aktualizacja stanu sesji,
- wyliczanie summary sesji,
- agregacja progressu,
- dobór elementów do review,
- rekomendowanie kolejnej sesji.

Przykładowy podział domeny:

```txt
domain/
  tracks/
    trackModel.ts
    trackRegistry.ts
    trackCapabilities.ts

  content/
    contentModel.ts
    contentRepository.ts
    contentVersioning.ts

  training-items/
    trainingItemModel.ts
    itemFilters.ts
    itemSelection.ts

  sessions/
    sessionModel.ts
    sessionFactory.ts
    sessionReducer.ts
    sessionSummary.ts

  attempts/
    attemptModel.ts
    scoring.ts
    feedback.ts

  review/
    reviewModel.ts
    reviewSelector.ts
    reviewRules.ts

  progress/
    progressModel.ts
    progressCalculations.ts
    weakAreaDetection.ts

  recommendations/
    nextSession.ts
```

## Storage Layer

Storage Layer odpowiada za lokalny zapis i odczyt danych użytkownika.

Zakres storage:

- sesje,
- attempty,
- progress per track,
- ustawienia,
- statusy review,
- ostatnio wybrany track,
- wersje contentu, na których powstały wyniki.

Storage powinien być dostępny przez adaptery:

```txt
storage/
  storageClient.ts
  sessionStorage.ts
  attemptStorage.ts
  progressStorage.ts
  reviewStorage.ts
  settingsStorage.ts
  migrations.ts
```

UI i logika domenowa nie powinny operować bezpośrednio na implementacji storage.

Źle:

```tsx
await AsyncStorage.setItem('sessions', JSON.stringify(sessions));
```

Dobrze:

```tsx
await sessionStorage.saveSession(session);
```

## Static Content Layer

Static Content Layer przechowuje lokalne, wersjonowane paczki contentu.

Nie powinien być nazwany wyłącznie `questions`, bo Algorithms Track nie składa się wyłącznie z pytań egzaminacyjnych.

Rekomendowana struktura:

```txt
data/
  tracks/
    cloud-certification/
      manifest.ts
      domains.ts
      items.json
      references.ts

    algorithms/
      manifest.ts
      patterns.ts
      categories.ts
      items.json
      complexity.ts
```

Każdy content pack powinien mieć:

- `trackId`,
- `contentVersion`,
- `schemaVersion`,
- listę itemów,
- taksonomię,
- datę ostatniej aktualizacji,
- źródła lub notatki redakcyjne,
- informację o braku afiliacji, jeżeli dotyczy.

## Model typów domenowych

### TrackId

```ts
type TrackId = 'cloud-certification' | 'algorithms';
```

W przyszłości można dodać kolejne wartości bez zmiany modelu sesji.

### SessionModeId

```ts
type SessionModeId =
  | 'practice'
  | 'exam'
  | 'review'
  | 'pattern-drill'
  | 'strategy-practice'
  | 'timed-challenge'
  | 'weak-areas';
```

Nie każdy `SessionModeId` musi być dostępny w każdym tracku.

### TrainingItem

`TrainingItem` jest bazowym typem jednostki treningowej.

```ts
type TrainingItemBase = {
  id: string;
  trackId: TrackId;
  itemType: string;
  title?: string;
  prompt: string;
  tags: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  contentVersion: string;
};
```

Przykład dla Cloud Certification:

```ts
type CloudQuestionItem = TrainingItemBase & {
  itemType: 'single-choice' | 'multiple-choice';
  domainId: string;
  topicIds: string[];
  answers: AnswerOption[];
  correctAnswerIds: string[];
  explanation: string;
  distractorExplanations?: Record<string, string>;
};
```

Przykład dla Algorithms:

```ts
type AlgorithmStrategyItem = TrainingItemBase & {
  itemType: 'pattern-recognition' | 'strategy-choice' | 'complexity-analysis';
  categoryIds: string[];
  patternIds: string[];
  candidateStrategies: StrategyOption[];
  optimalStrategyId: string;
  naiveApproach?: string;
  optimalApproach: string;
  timeComplexity: string;
  spaceComplexity: string;
  pitfalls: string[];
};
```

### Attempt

`Attempt` opisuje próbę użytkownika. Powinien być generyczny, ale pozwalać na payload zależny od tracka i itemu.

```ts
type Attempt = {
  id: string;
  trackId: TrackId;
  sessionId: string;
  sessionModeId: SessionModeId;
  itemId: string;
  itemType: string;
  answerPayload: unknown;
  result: AttemptResult;
  createdAt: string;
  durationMs?: number;
  contentVersion: string;
};
```

Dla Cloud Certification `answerPayload` może zawierać `selectedAnswerIds`.

Dla Algorithms `answerPayload` może zawierać `selectedPatternId`, `selectedStrategyId`, `selectedComplexity` albo kombinację tych pól.

### AttemptResult

```ts
type AttemptResult = {
  status: 'correct' | 'partially-correct' | 'incorrect' | 'skipped';
  score: number;
  maxScore: number;
  weakAreaIds: string[];
  mistakeTypeIds?: string[];
};
```

## Session Engine

Session Engine jest wspólnym mechanizmem prowadzenia sesji.

Odpowiada za:

- utworzenie sesji,
- dobranie itemów,
- przejście do następnego itemu,
- zapis attemptu,
- wywołanie scoringu tracka,
- zapis feedbacku,
- zakończenie sesji,
- wygenerowanie summary.

Session Engine nie powinien wiedzieć, czy item jest pytaniem GCP, czy mini-problemem algorytmicznym. Powinien delegować scoring i feedback do definicji tracka.

Przepływ:

```txt
SessionSetup
  ↓
trackRegistry.get(trackId)
  ↓
contentRepository.getItems(trackId, filters)
  ↓
sessionFactory.create(track, mode, items)
  ↓
SessionRunner
  ↓
user attempt
  ↓
track.scoreAttempt(item, answerPayload)
  ↓
track.buildFeedback(item, result)
  ↓
sessionReducer.update(session, attempt, result)
  ↓
storage adapters
  ↓
progress aggregation
```

## Item Renderer

UI dla itemów powinno być oparte o registry rendererów.

Wspólny `SessionRunner` może obsłużyć:

- nagłówek sesji,
- progress sesji,
- przejścia między itemami,
- przyciski odpowiedzi,
- zapis attemptu,
- pokazanie feedbacku,
- zakończenie sesji.

Ale sposób renderowania konkretnego itemu może być różny.

Przykład:

```txt
itemRenderers/
  singleChoiceRenderer.tsx
  multipleChoiceRenderer.tsx
  patternRecognitionRenderer.tsx
  strategyChoiceRenderer.tsx
  complexityAnalysisRenderer.tsx
```

Nie należy kopiować całego `SessionRunner` dla każdego tracka, jeżeli różni się tylko treść itemu i rodzaj odpowiedzi.

## Feedback Architecture

Feedback musi być częścią domeny, a nie tylko tekstem renderowanym przez UI.

Dla Cloud Certification feedback obejmuje:

- czy odpowiedź była poprawna,
- poprawną odpowiedź,
- wyjaśnienie,
- wyjaśnienie dystraktorów,
- powiązane domeny i tematy.

Dla Algorithms feedback obejmuje:

- czy wybrany wzorzec lub strategia były trafne,
- optymalny wzorzec,
- uzasadnienie strategii,
- podejście naiwne,
- podejście optymalne,
- złożoność czasową,
- złożoność pamięciową,
- typowe pułapki.

## Progress Architecture

Progress musi być liczony per track. Nie należy mieszać wyników egzaminacyjnych i algorytmicznych w jedną globalną metrykę.

Wspólne metryki:

- liczba sesji,
- liczba attemptów,
- accuracy,
- ostatnia aktywność,
- elementy do review,
- słabe obszary.

Metryki Cloud Certification:

- accuracy per domain,
- accuracy per topic,
- wynik ostatniego Exam Mode,
- readiness jako wewnętrzna diagnoza.

Metryki Algorithms:

- accuracy per pattern,
- accuracy per category,
- najczęściej mylone wzorce,
- błędy w analizie złożoności,
- błędy w doborze struktury danych,
- skuteczność w Strategy Practice.

## Review Architecture

Review powinien wybierać elementy na podstawie danych z attemptów i progressu.

Źródła Review:

- błędne attempty,
- elementy pominięte,
- elementy oznaczone ręcznie,
- słabe domeny,
- słabe wzorce,
- powtarzalne typy błędów.

Review nie powinien być prostą historią odpowiedzi. Powinien być mechanizmem powrotu do słabych obszarów.

## Rekomendacje następnej sesji

W MVP rekomendacje mogą być proste i regułowe.

Przykłady:

- jeżeli użytkownik ma dużo błędów w domenie GCP, zaproponuj Practice z tej domeny,
- jeżeli użytkownik ma dużo błędów w `sliding-window`, zaproponuj Pattern Drill dla tego wzorca,
- jeżeli użytkownik ma dużo elementów do review, pokaż Review jako pierwszą akcję,
- jeżeli nie ma historii, zaproponuj krótki startowy trening w ostatnio wybranym tracku.

Nie jest potrzebny AI tutor ani backend rekomendacyjny w MVP.

## Struktura katalogów

Rekomendowana struktura:

```txt
src/
  app/
    AppRoot.tsx
    providers.tsx
    bootstrap.ts

  navigation/
    RootNavigator.tsx
    routes.ts
    routeParams.ts

  features/
    home/
      screens/
      components/
      hooks/

    track-selector/
      screens/
      components/

    session-setup/
      screens/
      components/
      hooks/

    session-runner/
      screens/
      components/
      item-renderers/
      hooks/

    session-summary/
      screens/
      components/

    review/
      screens/
      components/
      hooks/

    progress/
      screens/
      components/
      hooks/

    settings/
      screens/
      components/

  components/
    ui/
      Button.tsx
      Card.tsx
      Text.tsx
      Screen.tsx
      Badge.tsx
      Divider.tsx
      ProgressBar.tsx
      SegmentedControl.tsx

    feedback/
      EmptyState.tsx
      ErrorState.tsx
      LoadingState.tsx

  domain/
    tracks/
      trackModel.ts
      trackRegistry.ts
      trackCapabilities.ts

    content/
      contentModel.ts
      contentRepository.ts
      contentVersioning.ts

    training-items/
      trainingItemModel.ts
      itemFilters.ts
      itemSelection.ts

    sessions/
      sessionModel.ts
      sessionFactory.ts
      sessionReducer.ts
      sessionSummary.ts

    attempts/
      attemptModel.ts
      scoring.ts
      feedback.ts

    review/
      reviewModel.ts
      reviewSelector.ts
      reviewRules.ts

    progress/
      progressModel.ts
      progressCalculations.ts
      weakAreaDetection.ts

    recommendations/
      nextSession.ts

  tracks/
    cloud-certification/
      trackDefinition.ts
      scoring.ts
      feedback.ts
      progress.ts
      taxonomy.ts
      types.ts

    algorithms/
      trackDefinition.ts
      scoring.ts
      feedback.ts
      progress.ts
      taxonomy.ts
      types.ts

  data/
    tracks/
      cloud-certification/
        manifest.ts
        domains.ts
        items.json
        references.ts

      algorithms/
        manifest.ts
        patterns.ts
        categories.ts
        items.json
        complexity.ts

  storage/
    storageClient.ts
    sessionStorage.ts
    attemptStorage.ts
    progressStorage.ts
    reviewStorage.ts
    settingsStorage.ts
    migrations.ts

  theme/
    colors.ts
    typography.ts
    spacing.ts
    radii.ts
    shadows.ts
    theme.ts

  utils/
    date.ts
    array.ts
    math.ts
    ids.ts

  types/
    common.ts
```

## Zasady architektoniczne

### 1. Track-first, nie exam-first

Aplikacja powinna najpierw wiedzieć, w jakim tracku działa użytkownik, a dopiero potem wybierać tryb sesji.

Źle:

```txt
Home → Exam → Question
```

Dobrze:

```txt
Home → Track → Session Mode → Training Item
```

### 2. Training item zamiast question jako model bazowy

`question` może być typem itemu, ale nie powinno być nazwą bazowego modelu domenowego całej aplikacji.

Źle:

```ts
type Question = {
  id: string;
  answers: Answer[];
  correctAnswerId: string;
};
```

Dobrze:

```ts
type TrainingItem = CloudQuestionItem | AlgorithmStrategyItem;
```

### 3. Logika poza komponentami

Komponenty nie powinny decydować, czy odpowiedź jest poprawna.

Źle:

```tsx
const isCorrect = selectedId === question.correctAnswerId;
```

Dobrze:

```tsx
const result = track.scoreAttempt(item, answerPayload);
```

### 4. Storage przez adaptery

Ekrany i komponenty nie powinny znać implementacji storage.

Źle:

```tsx
await AsyncStorage.setItem('progress', JSON.stringify(progress));
```

Dobrze:

```tsx
await progressStorage.saveProgress(progress);
```

### 5. Content jest wersjonowany per track

Każdy track powinien mieć własny `contentVersion` i `schemaVersion`.

To pozwala później:

- migrować wyniki,
- oznaczać stare itemy jako deprecated,
- odróżnić stare attempty od nowych,
- aktualizować content bez utraty historii użytkownika,
- przygotować przyszłą synchronizację.

### 6. Feature isolation

Kod specyficzny dla tracka powinien trafić do `src/tracks/<trackId>`, a nie do wspólnych feature'ów.

Wspólne feature'y powinny wołać definicję tracka, a nie importować szczegóły GCP albo Algorithms bezpośrednio.

### 7. UI wspólne, renderery specyficzne

Wspólny `SessionRunner` jest właściwy, ale renderowanie konkretnych itemów może być specyficzne.

Nie należy tworzyć dwóch osobnych aplikacji:

- jednej dla GCP,
- drugiej dla Algorithms.

Lepiej mieć jeden shell i rozszerzalne renderery.

### 8. Brak backendu nie może przeciekać do domeny

Domena nie powinna zakładać, że dane zawsze pochodzą z lokalnego JSON-a albo AsyncStorage.

MVP może być lokalne, ale interfejsy powinny pozwolić później dodać remote sync.

## Przepływ danych

### Start aplikacji

```txt
AppRoot
  ↓
load settings
  ↓
load track registry
  ↓
load content manifests
  ↓
load local progress
  ↓
render Home
```

### Sesja treningowa

```txt
User selects track
  ↓
User selects session mode
  ↓
SessionSetup builds filters
  ↓
ContentRepository returns matching items
  ↓
SessionFactory creates session
  ↓
SessionRunner renders item
  ↓
User submits attempt
  ↓
Track scoring returns result
  ↓
Feedback is built
  ↓
Session state is updated
  ↓
Attempt is saved
  ↓
Progress is recalculated
  ↓
Summary / next item / review queue is updated
```

### Progress

```txt
Attempt history
  ↓
Track progress aggregator
  ↓
Track-specific weak areas
  ↓
Common progress summary
  ↓
Progress UI
```

## Przyszła synchronizacja

Jeżeli później pojawi się synchronizacja, nie powinna wymagać przebudowy UI ani logiki domenowej.

Docelowo storage można rozszerzyć z:

```txt
LocalStorageAdapter
```

na:

```txt
LocalStorageAdapter
  + RemoteSyncAdapter
  + ConflictResolution
```

Warunek: aplikacja od początku nie korzysta bezpośrednio z implementacji storage w ekranach.

Minimalne dane potrzebne do przyszłej synchronizacji:

- stabilne `id`,
- `createdAt`,
- `updatedAt`,
- `contentVersion`,
- `trackId`,
- `schemaVersion`,
- opcjonalnie `deletedAt` dla soft delete.

## Migracje

Migracje będą potrzebne dla:

- zmian modelu storage,
- zmian wersji contentu,
- zmian typów itemów,
- zmian progress aggregation,
- dodania nowych tracków.

MVP powinno mieć prosty mechanizm `storageVersion`, nawet jeżeli pierwsza wersja migracji nic nie robi.

## Testowanie architektury

Najważniejsze testy jednostkowe powinny dotyczyć domeny, nie UI.

Testować:

- `sessionFactory`,
- `sessionReducer`,
- scoring GCP,
- scoring Algorithms,
- agregację progressu per track,
- wybór elementów do review,
- rekomendacje następnej sesji,
- migracje storage,
- filtrowanie contentu.

Nie należy opierać jakości MVP wyłącznie na testach snapshotów komponentów.

## Decyzja: brak backendu w MVP

Backend nie jest potrzebny do:

- wyboru tracka,
- prowadzenia sesji,
- scoringu,
- feedbacku,
- liczenia progressu,
- review błędów,
- działania offline,
- lokalnego zapisu attemptów.

Backend może być potrzebny później do:

- synchronizacji,
- backupu,
- kont użytkownika,
- zdalnej aktualizacji contentu,
- płatności,
- panelu admina,
- eksperymentów A/B,
- telemetryki produktowej.

## Ryzyka architektoniczne

### Ryzyko 1: Zamknięcie modelu na `question`

Jeżeli bazowym typem będzie `Question`, Algorithms Track będzie sztucznie dopasowany do quizu.

Mitigacja: bazowym modelem jest `TrainingItem`, a pytanie egzaminacyjne jest jednym z typów itemu.

### Ryzyko 2: `Exam Mode` jako centrum aplikacji

Jeżeli architektura będzie budowana wokół Exam Mode, pozostałe tracki będą wyglądać jak dodatki.

Mitigacja: centrum architektury stanowi `Session Engine`, nie `Exam Engine`.

### Ryzyko 3: Zbyt ciężki plugin-system

Pełny system pluginów na MVP byłby overengineeringiem.

Mitigacja: użyć statycznego `trackRegistry` i zwykłych modułów TypeScript.

### Ryzyko 4: Brak granicy między contentem a logiką

Jeżeli content będzie zawierał niejawne reguły scoringu, trudno będzie testować aplikację.

Mitigacja: content przechowuje dane, a scoring jest w modułach tracka.

### Ryzyko 5: Storage bez wersjonowania

Bez wersji contentu i storage późniejsza aktualizacja itemów może zepsuć progress.

Mitigacja: zapisywać `contentVersion`, `schemaVersion` i `trackId` przy sesjach oraz attemptach.

## Antywzorce

Nie robić:

- `aceQuestions.json` jako centralnego źródła całej aplikacji,
- `Question` jako jedynego modelu domenowego,
- `QuizScreen` jako głównego runnera wszystkich sesji,
- osobnych, skopiowanych runnerów dla każdego tracka,
- scoringu w komponentach React,
- storage bez adapterów,
- progressu mieszanego globalnie dla GCP i Algorithms,
- kodu Algorithms w folderach GCP,
- wymuszania Exam Mode na tracku algorytmicznym,
- pełnego plugin-systemu przed realną potrzebą,
- backendu jako warunku działania MVP.

## Decyzje końcowe

1. Aplikacja jest architektonicznie wielotrackowa od MVP.
2. Bazowym modelem jest `TrainingItem`, nie `Question`.
3. Centrum logiki stanowi `Session Engine`, nie `Quiz Engine` ani `Exam Engine`.
4. Tracki są deklarowane przez lekki `trackRegistry`.
5. GCP i Algorithms mają własny scoring, feedback i progress aggregation.
6. UI korzysta ze wspólnych ekranów sesji, ale itemy mogą mieć własne renderery.
7. Storage jest lokalny, wersjonowany i ukryty za adapterami.
8. Backend, synchronizacja i judge online są poza MVP.

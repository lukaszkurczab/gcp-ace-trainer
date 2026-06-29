# 04 — Data Model

## Cel

Ten dokument definiuje model danych dla wielotrackowej aplikacji treningowej.

Najważniejsza decyzja: aplikacja nie może być modelowana jako zbiór `Question` i `QuizSession`. Bazowym modelem jest:

```txt
app → track → session mode → training item → attempt → feedback/result → progress
```

`Question` jest tylko jednym z wariantów `TrainingItem`, używanym głównie w tracku certyfikacyjnym. Track algorytmiczny potrzebuje innych typów itemów: rozpoznawania wzorca, wyboru strategii, analizy złożoności, porównania rozwiązań i review błędów.

Modele powinny być:

- proste,
- jawne,
- lokalne,
- łatwe do serializacji,
- stabilne ID-first,
- przygotowane na wiele tracków,
- niezależne od UI,
- niezależne od konkretnego storage,
- odporne na zmianę wersji contentu.

## Konwencje

```ts
type ISODateString = string;
type Milliseconds = number;
type Percent = number;

type TrackId = string;
type SessionModeId = string;
type TrainingItemId = string;
type AttemptId = string;
type SessionId = string;
type ContentVersion = string;
```

Daty zapisujemy jako ISO string. Nie zapisujemy obiektów `Date` w storage.

ID contentu musi być stabilne. Zmiana ID oznacza utratę powiązania z historią użytkownika.

## Track

`Track` reprezentuje ścieżkę nauki, nie tryb sesji.

```ts
type Track = {
  id: TrackId;
  slug: string;
  title: string;
  shortTitle?: string;
  description: string;

  category: TrackCategory;
  status: TrackStatus;

  defaultSessionModeId: SessionModeId;
  supportedSessionModeIds: SessionModeId[];

  taxonomy: TrackTaxonomy;
  contentManifest: ContentManifest;

  createdAt?: ISODateString;
  updatedAt?: ISODateString;
};
```

```ts
type TrackCategory =
  | 'cloud_certification'
  | 'algorithms'
  | 'system_design'
  | 'language'
  | 'other';

type TrackStatus = 'active' | 'draft' | 'archived';
```

### Przykładowe tracki MVP

```ts
const CLOUD_CERTIFICATION_TRACK_ID = 'cloud-gcp-ace';
const ALGORITHMS_TRACK_ID = 'algorithms-core';
```

W dokumentacji i kodzie nie należy zakładać, że istnieje tylko jeden track.

## SessionMode

`SessionMode` opisuje sposób pracy użytkownika w ramach tracka.

```ts
type SessionMode = {
  id: SessionModeId;
  trackId: TrackId;

  type: SessionModeType;
  title: string;
  description?: string;

  defaultSettings: SessionSettings;
  supportedItemTypes: TrainingItemType[];

  feedbackTiming: FeedbackTiming;
  scoringType: ScoringType;

  order?: number;
  enabled: boolean;
};
```

```ts
type SessionModeType =
  | 'practice'
  | 'exam_simulation'
  | 'review'
  | 'pattern_drill'
  | 'strategy_practice'
  | 'timed_challenge'
  | 'weak_areas';

type FeedbackTiming = 'immediate' | 'after_submit' | 'session_summary_only';

type ScoringType =
  | 'correctness'
  | 'partial_credit'
  | 'strategy_quality'
  | 'self_assessment'
  | 'mixed';
```

`Exam Simulation` nie powinien być globalnym trybem całej aplikacji. Jest trybem dostępnych dla tracków, które mają sensowny format egzaminacyjny.

## TrackTaxonomy

Taksonomia służy do grupowania contentu i progresu. Nie każdy track używa tych samych wymiarów.

```ts
type TrackTaxonomy = {
  primaryAxis: TaxonomyAxis;
  secondaryAxes?: TaxonomyAxis[];
};

type TaxonomyAxis = {
  id: string;
  label: string;
  type: TaxonomyAxisType;
  nodes: TaxonomyNode[];
};

type TaxonomyAxisType =
  | 'exam_domain'
  | 'topic'
  | 'concept'
  | 'algorithm_pattern'
  | 'data_structure'
  | 'difficulty'
  | 'mistake_type';

type TaxonomyNode = {
  id: string;
  label: string;
  description?: string;
  parentId?: string;
  weight?: number;
  order?: number;
};
```

### Cloud Certification taxonomy

```ts
type ExamDomain = TaxonomyNode & {
  weight?: number;
};
```

Przykładowe osie:

- domena egzaminacyjna,
- temat,
- usługa,
- trudność.

### Algorithms taxonomy

Przykładowe osie:

- pattern,
- struktura danych,
- kategoria problemu,
- trudność,
- typ błędu.

Przykładowe patterny:

```ts
type AlgorithmPattern =
  | 'two_pointers'
  | 'sliding_window'
  | 'hash_map'
  | 'binary_search'
  | 'dfs'
  | 'bfs'
  | 'dynamic_programming'
  | 'greedy'
  | 'backtracking'
  | 'heap'
  | 'prefix_sum'
  | 'graph_traversal';
```

## ContentManifest

Content powinien być wersjonowany per track.

```ts
type ContentManifest = {
  trackId: TrackId;
  version: ContentVersion;
  itemCount: number;

  source: ContentSource;
  generatedAt?: ISODateString;

  supportedItemTypes: TrainingItemType[];
  deprecatedItemIds?: TrainingItemId[];
};
```

```ts
type ContentSource = {
  type: 'local_static' | 'remote_static' | 'manual_import';
  label?: string;
};
```

W MVP zakładamy `local_static`.

## TrainingItem

`TrainingItem` to bazowy model jednostki treningowej.

```ts
type TrainingItem = {
  id: TrainingItemId;
  trackId: TrackId;

  type: TrainingItemType;
  title?: string;
  prompt: string;
  context?: string;

  difficulty?: Difficulty;
  taxonomyRefs: TaxonomyRef[];
  tags?: string[];

  estimatedTimeMs?: Milliseconds;

  explanation: ItemExplanation;
  references?: Reference[];

  version: ContentVersion;
  status: ContentItemStatus;
};
```

```ts
type TrainingItemType =
  | 'single_choice_question'
  | 'multiple_choice_question'
  | 'strategy_choice'
  | 'pattern_identification'
  | 'complexity_analysis'
  | 'solution_comparison'
  | 'mistake_review'
  | 'freeform_reflection';

type Difficulty = 'easy' | 'medium' | 'hard';

type ContentItemStatus = 'active' | 'deprecated' | 'draft';

type TaxonomyRef = {
  axisId: string;
  nodeId: string;
};
```

Nie należy używać `domainId` jako pola bazowego dla całej aplikacji. Domena egzaminacyjna jest tylko jednym typem `TaxonomyRef`.

## ItemExplanation

Wyjaśnienie jest częścią wartości edukacyjnej itemu.

```ts
type ItemExplanation = {
  summary: string;
  correct?: string;
  incorrect?: Record<string, string>;

  reasoning?: string;
  keyConcepts?: string[];
  commonMistakes?: string[];

  algorithmStrategy?: AlgorithmStrategyExplanation;
};
```

```ts
type AlgorithmStrategyExplanation = {
  intendedPattern?: AlgorithmPattern;
  whyThisPatternFits?: string;
  rejectedAlternatives?: RejectedStrategy[];
  complexity?: ComplexityAnalysis;
  implementationNotes?: string[];
};

type RejectedStrategy = {
  strategy: string;
  reason: string;
};

type ComplexityAnalysis = {
  time: string;
  space: string;
  explanation?: string;
};
```

Dla tracka certyfikacyjnego wystarczy `summary`, `correct`, `incorrect` i `keyConcepts`.

Dla tracka algorytmicznego kluczowe są `intendedPattern`, `whyThisPatternFits`, `rejectedAlternatives` i `complexity`.

## Reference

```ts
type Reference = {
  label: string;
  url?: string;
  type:
    | 'official_docs'
    | 'guide'
    | 'concept'
    | 'pricing'
    | 'language_docs'
    | 'internal_note'
    | 'other';
};
```

Dla contentu certyfikacyjnego preferowane są oficjalne źródła dokumentacyjne. Dla tracka algorytmicznego nie należy kopiować treści z platform typu LeetCode; można opisywać własne, oryginalne mini-problemy i ogólne wzorce algorytmiczne.

## ChoiceItem

Pytania jednokrotnego, wielokrotnego wyboru i wybór strategii mogą używać wspólnego modelu opcji.

```ts
type ChoiceItem = TrainingItem & {
  choices: AnswerChoice[];
  correctChoiceIds: string[];
};

type AnswerChoice = {
  id: string;
  text: string;
};
```

### CloudQuestionItem

```ts
type CloudQuestionItem = ChoiceItem & {
  trackId: 'cloud-gcp-ace';
  type: 'single_choice_question' | 'multiple_choice_question';
};
```

### AlgorithmStrategyItem

```ts
type AlgorithmStrategyItem = ChoiceItem & {
  trackId: 'algorithms-core';
  type: 'strategy_choice' | 'pattern_identification';

  problemShape?: ProblemShape;
  expectedPattern?: AlgorithmPattern;
  expectedDataStructures?: DataStructure[];
  expectedComplexity?: ComplexityAnalysis;
};
```

```ts
type ProblemShape = {
  inputDescription?: string;
  outputDescription?: string;
  constraints?: string[];
  examples?: ProblemExample[];
};

type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

type DataStructure =
  | 'array'
  | 'string'
  | 'hash_map'
  | 'set'
  | 'stack'
  | 'queue'
  | 'heap'
  | 'tree'
  | 'graph'
  | 'linked_list';
```

W MVP dla algorytmów nie zakładamy pełnego edytora kodu ani wykonywania kodu. Model ma wspierać przede wszystkim wybór strategii i rozpoznanie wzorca.

## Session

`Session` zastępuje `QuizSession` jako generyczny model sesji.

```ts
type TrainingSession = {
  id: SessionId;
  trackId: TrackId;
  modeId: SessionModeId;
  modeType: SessionModeType;

  status: SessionStatus;

  startedAt: ISODateString;
  completedAt?: ISODateString;
  abandonedAt?: ISODateString;

  itemIds: TrainingItemId[];
  currentItemIndex: number;

  attemptIds: AttemptId[];

  settings: SessionSettings;
  result?: SessionResult;

  contentVersion: ContentVersion;
};
```

```ts
type SessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';
```

## SessionSettings

```ts
type SessionSettings = {
  itemCount: number;

  taxonomyFilters?: TaxonomyRef[];
  difficulty?: Difficulty[];
  itemTypes?: TrainingItemType[];

  shuffleItems: boolean;
  shuffleChoices?: boolean;

  feedbackTiming: FeedbackTiming;

  timerEnabled?: boolean;
  timeLimitMs?: Milliseconds;

  includePreviouslyCorrect?: boolean;
  includeMarkedForReview?: boolean;
  weakAreasOnly?: boolean;
};
```

Dla `Exam Simulation` ustawienie `feedbackTiming` powinno być `session_summary_only`.

Dla `Pattern Drill` zwykle powinno być `immediate`.

## Attempt

`Attempt` opisuje pojedynczą próbę użytkownika wobec `TrainingItem`.

```ts
type TrainingAttempt = {
  id: AttemptId;
  sessionId: SessionId;
  trackId: TrackId;
  itemId: TrainingItemId;

  itemType: TrainingItemType;

  startedAt?: ISODateString;
  submittedAt: ISODateString;
  timeSpentMs?: Milliseconds;

  response: AttemptResponse;
  result: AttemptResult;

  confidence?: AnswerConfidence;
  markedForReview?: boolean;

  contentVersion: ContentVersion;
};
```

```ts
type AttemptResponse =
  | ChoiceAttemptResponse
  | ComplexityAttemptResponse
  | FreeformAttemptResponse
  | SelfAssessmentAttemptResponse;

type ChoiceAttemptResponse = {
  type: 'choice';
  selectedChoiceIds: string[];
};

type ComplexityAttemptResponse = {
  type: 'complexity';
  timeComplexity?: string;
  spaceComplexity?: string;
  selectedPatternId?: string;
};

type FreeformAttemptResponse = {
  type: 'freeform';
  text: string;
};

type SelfAssessmentAttemptResponse = {
  type: 'self_assessment';
  rating: 1 | 2 | 3 | 4 | 5;
  note?: string;
};
```

```ts
type AnswerConfidence = 'low' | 'medium' | 'high';
```

## AttemptResult

```ts
type AttemptResult = {
  status: AttemptStatus;
  score: number;
  maxScore: number;
  normalizedScore: Percent;

  isCorrect?: boolean;
  isPartiallyCorrect?: boolean;

  feedback: AttemptFeedback;

  mistakeTypes?: MistakeType[];
  affectedTaxonomyRefs?: TaxonomyRef[];
};
```

```ts
type AttemptStatus =
  | 'correct'
  | 'incorrect'
  | 'partial'
  | 'skipped'
  | 'self_assessed';

type AttemptFeedback = {
  summary: string;
  details?: string;
  correctChoiceIds?: string[];
  explanationRef?: TrainingItemId;
};

type MistakeType =
  | 'concept_gap'
  | 'misread_prompt'
  | 'wrong_pattern'
  | 'wrong_data_structure'
  | 'complexity_misjudgment'
  | 'overengineering'
  | 'security_misunderstanding'
  | 'service_confusion'
  | 'other';
```

Dla klasycznych pytań `isCorrect` jest istotne. Dla algorytmów równie ważne mogą być `wrong_pattern`, `complexity_misjudgment` i `overengineering`.

## SessionResult

```ts
type SessionResult = {
  sessionId: SessionId;
  trackId: TrackId;
  modeId: SessionModeId;

  totalItems: number;
  completedItems: number;
  skippedItems: number;

  score: number;
  maxScore: number;
  normalizedScore: Percent;

  accuracy?: Percent;
  averageTimePerItemMs?: Milliseconds;

  byTaxonomy: Record<string, TaxonomyScore>;
  mistakeSummary?: MistakeSummary;

  recommendedNextAction?: RecommendedNextAction;

  completedAt: ISODateString;
};
```

```ts
type TaxonomyScore = {
  axisId: string;
  nodeId: string;

  total: number;
  correct: number;
  incorrect: number;
  partial: number;

  normalizedScore: Percent;
};

type MistakeSummary = {
  byType: Partial<Record<MistakeType, number>>;
  topMistakeTypes: MistakeType[];
};

type RecommendedNextAction = {
  type:
    | 'continue_practice'
    | 'review_mistakes'
    | 'practice_weak_area'
    | 'try_exam_simulation'
    | 'repeat_pattern_drill';
  trackId: TrackId;
  modeId?: SessionModeId;
  reason: string;
  taxonomyRefs?: TaxonomyRef[];
};
```

## UserItemState

`UserItemState` zastępuje `UserQuestionState`.

```ts
type UserItemState = {
  trackId: TrackId;
  itemId: TrainingItemId;

  timesSeen: number;
  timesAttempted: number;
  timesCorrect: number;
  timesIncorrect: number;
  timesPartial: number;

  lastSeenAt?: ISODateString;
  lastAttemptedAt?: ISODateString;
  lastAttemptId?: AttemptId;

  lastNormalizedScore?: Percent;
  lastMistakeTypes?: MistakeType[];

  markedForReview: boolean;
  mastered: boolean;

  contentVersion: ContentVersion;
};
```

## ReviewQueueItem

Review nie powinno zakładać wyłącznie błędnych pytań egzaminacyjnych.

```ts
type ReviewQueueItem = {
  trackId: TrackId;
  itemId: TrainingItemId;

  reason: ReviewReason;
  priority: number;

  dueAt?: ISODateString;
  createdAt: ISODateString;
  lastReviewedAt?: ISODateString;
};
```

```ts
type ReviewReason =
  | 'incorrect_answer'
  | 'partial_answer'
  | 'low_confidence'
  | 'marked_for_review'
  | 'weak_taxonomy_area'
  | 'wrong_pattern'
  | 'complexity_error';
```

## UserProgress

Progress powinien istnieć per track i globalnie.

```ts
type UserProgress = {
  global: GlobalProgress;
  byTrack: Record<TrackId, TrackProgress>;
  updatedAt: ISODateString;
};
```

```ts
type GlobalProgress = {
  activeTrackId?: TrackId;
  totalSessions: number;
  totalAttempts: number;
  lastSessionId?: SessionId;
  lastPracticedAt?: ISODateString;
};
```

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

  byTaxonomy: Record<string, TaxonomyProgress>;

  readiness?: ReadinessState;
  weakAreas: WeakArea[];

  lastSessionId?: SessionId;
  lastPracticedAt?: ISODateString;
  updatedAt: ISODateString;
};
```

```ts
type TaxonomyProgress = {
  axisId: string;
  nodeId: string;

  attempted: number;
  correct: number;
  incorrect: number;
  partial: number;

  normalizedScore: Percent;
  readiness: ReadinessState;

  lastPracticedAt?: ISODateString;
};

type ReadinessState =
  | 'not_enough_data'
  | 'needs_work'
  | 'improving'
  | 'good'
  | 'strong';

type WeakArea = {
  taxonomyRef: TaxonomyRef;
  reason: string;
  priority: number;
  recommendedModeId?: SessionModeId;
};
```

Dla GCP `readiness` może być komunikowana jako gotowość wewnętrzna do tracka, nie gwarancja zdania egzaminu.

Dla algorytmów `readiness` oznacza stabilność rozpoznawania wzorca i strategii, nie gwarancję rozwiązania dowolnego zadania.

## LocalAppSettings

```ts
type LocalAppSettings = {
  activeTrackId?: TrackId;
  enabledTrackIds: TrackId[];

  defaultSessionSettingsByTrack: Record<TrackId, Partial<SessionSettings>>;

  themeMode: 'system' | 'light' | 'dark';

  hasCompletedOnboarding: boolean;
  onboardingVersion?: string;

  contentVersionsByTrack: Record<TrackId, ContentVersion>;

  createdAt: ISODateString;
  updatedAt: ISODateString;
};
```

Nie należy trzymać globalnych ustawień typu `defaultExamQuestionCount` bez powiązania z trackiem i trybem. To ponownie zamyka aplikację na egzamin.

## Persisted state

Minimalny lokalny stan MVP:

```ts
type PersistedAppState = {
  schemaVersion: number;

  settings: LocalAppSettings;

  sessions: Record<SessionId, TrainingSession>;
  attempts: Record<AttemptId, TrainingAttempt>;

  itemStates: Record<string, UserItemState>;
  reviewQueue: ReviewQueueItem[];

  progress: UserProgress;

  migrations?: MigrationState;
};
```

```ts
type MigrationState = {
  lastMigrationId?: string;
  migratedAt?: ISODateString;
};
```

Klucz dla `itemStates` powinien uwzględniać `trackId` i `itemId`, np.:

```ts
const itemStateKey = `${trackId}:${itemId}`;
```

## Przykład — Cloud Certification item

```json
{
  "id": "gcp-ace-iam-001",
  "trackId": "cloud-gcp-ace",
  "type": "single_choice_question",
  "prompt": "A developer needs read-only access to objects in a Cloud Storage bucket. Which access model should be used?",
  "difficulty": "medium",
  "taxonomyRefs": [
    { "axisId": "exam_domain", "nodeId": "security-and-iam" },
    { "axisId": "topic", "nodeId": "cloud-storage-iam" }
  ],
  "choices": [
    { "id": "a", "text": "Grant the user the Owner role on the project." },
    { "id": "b", "text": "Grant a storage read role scoped to the bucket or appropriate resource." },
    { "id": "c", "text": "Share a service account key with the developer." },
    { "id": "d", "text": "Disable uniform bucket-level access." }
  ],
  "correctChoiceIds": ["b"],
  "explanation": {
    "summary": "Use least privilege and scope access as narrowly as possible.",
    "correct": "A storage read role scoped to the appropriate resource grants the required access without excessive privileges.",
    "incorrect": {
      "a": "Owner is far broader than read-only access.",
      "c": "Sharing service account keys is unsafe and unnecessary.",
      "d": "This does not directly grant the required read access."
    },
    "keyConcepts": ["least privilege", "IAM", "Cloud Storage"]
  },
  "references": [
    {
      "label": "Cloud Storage access control",
      "url": "https://cloud.google.com/storage/docs/access-control",
      "type": "official_docs"
    }
  ],
  "tags": ["iam", "storage", "least-privilege"],
  "version": "1.0.0",
  "status": "active"
}
```

## Przykład — Algorithms item

```json
{
  "id": "alg-pattern-sliding-window-001",
  "trackId": "algorithms-core",
  "type": "pattern_identification",
  "title": "Longest subarray under a constraint",
  "prompt": "You are given an array of positive integers and a target value. Find the longest contiguous subarray whose sum is less than or equal to the target. Which strategy fits best?",
  "difficulty": "medium",
  "taxonomyRefs": [
    { "axisId": "algorithm_pattern", "nodeId": "sliding_window" },
    { "axisId": "data_structure", "nodeId": "array" }
  ],
  "problemShape": {
    "inputDescription": "Array of positive integers and a target sum.",
    "outputDescription": "Length of the longest valid contiguous subarray.",
    "constraints": ["All numbers are positive", "Contiguous subarray is required"]
  },
  "choices": [
    { "id": "a", "text": "Sort the array and use binary search." },
    { "id": "b", "text": "Use a sliding window with two pointers." },
    { "id": "c", "text": "Use DFS over all possible subarrays." },
    { "id": "d", "text": "Use dynamic programming over prefixes." }
  ],
  "correctChoiceIds": ["b"],
  "expectedPattern": "sliding_window",
  "expectedDataStructures": ["array"],
  "expectedComplexity": {
    "time": "O(n)",
    "space": "O(1)",
    "explanation": "Each pointer moves through the array at most once."
  },
  "explanation": {
    "summary": "Positive values and a contiguous range make sliding window the best fit.",
    "algorithmStrategy": {
      "intendedPattern": "sliding_window",
      "whyThisPatternFits": "The window can expand while the sum is valid and shrink when it exceeds the target because all values are positive.",
      "rejectedAlternatives": [
        {
          "strategy": "sorting",
          "reason": "Sorting destroys contiguity."
        },
        {
          "strategy": "DFS",
          "reason": "Brute-force exploration is unnecessary and inefficient."
        }
      ],
      "complexity": {
        "time": "O(n)",
        "space": "O(1)"
      }
    },
    "commonMistakes": ["Ignoring the contiguous requirement", "Using sorting when order matters"]
  },
  "tags": ["arrays", "two-pointers", "sliding-window"],
  "version": "1.0.0",
  "status": "active"
}
```

## Zasady modelowania

### 1. `TrainingItem` zamiast `Question`

Wspólny kod powinien operować na `TrainingItem`. `Question` może istnieć tylko jako wyspecjalizowany wariant dla tracka certyfikacyjnego.

Źle:

```ts
type QuizSession = {
  questionIds: string[];
};
```

Dobrze:

```ts
type TrainingSession = {
  itemIds: TrainingItemId[];
};
```

### 2. `taxonomyRefs` zamiast `domainId`

`domainId` jest zbyt wąskie. Dla GCP działa, ale dla algorytmów potrzebujemy patternów, struktur danych, typów błędów i kategorii.

### 3. `Attempt` zamiast `UserAnswer`

`UserAnswer` zakłada odpowiedź na pytanie. `Attempt` pozwala obsłużyć wybór odpowiedzi, wybór strategii, analizę złożoności i samoocenę.

### 4. Progress per track

Nie mieszać accuracy z GCP i Algorithms w jednym wyniku bez kontekstu. Globalny progress może agregować aktywność, ale diagnoza jakości musi być per track.

### 5. Content versioning

Każdy `TrainingItem`, `Session` i `Attempt` powinien znać `contentVersion`. Bez tego zmiany w bazie contentu mogą zepsuć interpretację historycznych wyników.

### 6. Deprecated zamiast usuwania

Usunięcie itemu bez migracji psuje historię użytkownika. Preferowane jest:

```ts
status: 'deprecated'
```

oraz ukrycie itemu przed nowymi sesjami.

### 7. Wyjaśnienia są wymagane

Item bez wyjaśnienia ma niską wartość edukacyjną. W MVP minimalne wymaganie:

- `explanation.summary`,
- dla choice itemów: informacja, dlaczego poprawna opcja jest poprawna,
- dla algorytmów: informacja, dlaczego dany wzorzec pasuje.

### 8. Brak lock-in na pełny code judge

Nie dodawać w MVP modeli typu:

```ts
testCases: TestCase[];
submittedCode: string;
executionResult: ExecutionResult;
```

To sugeruje pełne środowisko uruchamiania kodu. Można je dodać później jako osobny capability layer, ale nie jako fundament obecnego modelu.

## Antywzorce

### Antywzorzec: `Question` jako root model

Problem: utrwala myślenie, że cała aplikacja jest quizem.

Lepszy model: `TrainingItem` + warianty itemów.

### Antywzorzec: `ExamDomain` jako uniwersalny wymiar progresu

Problem: działa dla GCP, nie działa dla algorytmów.

Lepszy model: `TrackTaxonomy` i `TaxonomyRef`.

### Antywzorzec: globalne `accuracy` bez tracka

Problem: 80% w GCP i 80% w pattern drillu oznaczają różne rzeczy.

Lepszy model: `TrackProgress` i `TaxonomyProgress`.

### Antywzorzec: `LeetCodeProblem` jako kopia cudzej platformy

Problem: ryzyko prawne i produktowe; aplikacja nie ma kopiować LeetCode.

Lepszy model: własne, oryginalne mini-problemy i trening strategii.

### Antywzorzec: zbyt ciężki model pluginów

Problem: MVP potrzebuje rozszerzalności, nie platformy pluginowej.

Lepszy model: statyczny `Track`, `SessionMode`, `TrainingItem` i adaptery scoringu per track.

## Minimalny zakres implementacyjny MVP

Na start wystarczy zaimplementować:

```ts
Track
SessionMode
TrainingItem
ChoiceItem
TrainingSession
TrainingAttempt
SessionResult
UserItemState
ReviewQueueItem
UserProgress
LocalAppSettings
PersistedAppState
```

Warianty specjalistyczne można dodać stopniowo, ale nazwy i storage od początku powinny pozostać generyczne.

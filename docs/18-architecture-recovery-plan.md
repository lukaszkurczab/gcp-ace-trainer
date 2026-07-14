# 18 — Architecture Recovery Plan

## Status dokumentu

Ten dokument jest nowym, wykonawczym planem recovery Patternly. Zastępuje wcześniejszą wersję `18-architecture-recovery-plan.md` w całości.

Plan opiera się na:

- zatwierdzonych decyzjach D-001–D-038;
- zsynchronizowanych dokumentach `00–17`;
- finalnym kontrakcie reinsert wymagającym dwóch innych zatwierdzonych itemów;
- inspekcji aktualnego repozytorium `lukaszkurczab/gcp-ace-trainer`.

Dokumenty `00–17` opisują stan docelowy. Ten dokument opisuje kolejność przejścia od obecnego repozytorium do tego stanu.

Poprzednia wersja dokumentu 18 nie jest źródłem prawdy. W szczególności nie obowiązują jej założenia o:

- migracji starych danych;
- zachowaniu AsyncStorage;
- translatorach starych rekordów;
- compatibility layers;
- równoległych runtime'ach;
- opcjonalnym zachowaniu starej architektury.

---

# 1. Reguła nadrzędna recovery

## 1.1. Przenieś albo usuń

Jeżeli istniejącego modelu, rekordu, flow, modułu, storage pathu albo content contractu nie da się przenieść do nowej struktury bez zachowania przestarzałej semantyki, należy go usunąć.

Nie tworzymy:

- fallbacków;
- translatorów;
- compatibility adapters;
- dual reads;
- dual writes;
- równoległych session runnerów;
- równoległych storage engines;
- runtime mappingu starego payloadu na nowy;
- ukrytych default topiców;
- default itemów;
- default odpowiedzi;
- default wyników;
- generycznego feedbacku zastępującego authored content;
- trwałych flag `legacy`, `temporary`, `migration`, `fallback`, `deprecated`;
- historycznej kompatybilności dla danych przedprodukcyjnych.

Jawny błąd runtime jest ważnym sygnałem, że nieprzeniesiony fragment nadal istnieje. Nie wolno go ukrywać przez:

- zwrócenie pustej tablicy;
- wybranie domyślnego tracka;
- rozpoczęcie sesji na niepełnych danych;
- pominięcie niepoprawnego rekordu;
- kontynuowanie po nieudanym zapisie;
- odczyt starego key;
- użycie starego service;
- przejście do kolejnego itemu bez durable outcome;
- catch-and-continue bez jawnego stanu błędu.

## 1.2. Jeden właściciel

Po zakończeniu każdego etapu:

- jeden koncept ma jednego właściciela;
- replacement jest jedyną aktywną implementacją;
- zastąpiony path jest usunięty w tym samym etapie;
- nie istnieje „bezpieczna” stara ścieżka;
- testy sprawdzają brak starej ścieżki, nie tylko działanie nowej.

## 1.3. Brak kompatybilności danych

Patternly jest przed produkcyjnym wydaniem.

Recovery:

- usuwa stare dane AsyncStorage;
- nie migruje historycznych session, attemptów, review ani progressu;
- nie rekonstruuje starych explanations;
- nie zachowuje `AttemptSummary`;
- nie zachowuje `PracticeAnswerRecord`;
- nie zachowuje `ActiveExamSession`;
- nie mapuje starych item IDs;
- nie naprawia heurystycznie starych rekordów;
- nie utrzymuje kodu migracyjnego po cutover;
- nie przechowuje starego banku pytań w storage.

---

# 2. Hierarchia źródeł prawdy

| Obszar                   | Źródło                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Produkt i zakres         | `00-overview.md`, `01-product-definition.md`                                                                                                         |
| Architektura i ownership | `02-architecture.md`, `04-data-model.md`, `11-implementation-guidelines.md`                                                                          |
| Nawigacja                | `03-navigation-and-flows.md`                                                                                                                         |
| UI                       | `05-design-system.md`, `06-branding-and-style-direction.md`, `17-training-runtime-and-interaction-spec.md`                                           |
| Content                  | `07-content-guidelines.md`, `14-learning-effectiveness-model.md`, `15-certification-track-learning-system.md`, `16-leetcode-like-learning-system.md` |
| Storage                  | `08-storage-and-offline.md`, `09-security-and-privacy.md`                                                                                            |
| Testy                    | `12-testing-strategy.md`                                                                                                                             |
| Ryzyka                   | `13-risk-register.md`                                                                                                                                |
| Kolejność implementacji  | ten dokument                                                                                                                                         |

W przypadku konfliktu:

1. dokument 17 rozstrzyga runtime i interaction behavior;
2. dokumenty 02 i 04 rozstrzygają ownership oraz model danych;
3. dokument 08 rozstrzyga persistence;
4. dokumenty rodzinne 15 i 16 rozstrzygają family semantics;
5. aktualny kod jest dowodem bieżącego stanu, nie docelowego zachowania.

---

# 3. Potwierdzony stan repozytorium

## 3.1. Shared domain miesza rodziny i interakcje

Aktualny shared domain nadal zawiera globalne typy obejmujące jednocześnie:

- Certification;
- Algorithms;
- freeform i reflection;
- planowane, niewspierane interaction types;
- typy takie jak `full_code_editor`.

Potwierdzone ścieżki:

- `src/domain/training/trainingItem.ts`;
- `src/domain/training/trainingAttempt.ts`;
- `src/domain/training/trainingReview.ts`;
- `src/domain/tracks/types.ts`.

Obecne problemy:

- `TrainingItem` jest globalnym unionem concrete itemów;
- `TrainingItemType` jest centralnym katalogiem typów obu rodzin;
- `TrainingAttemptResponse` zawiera family-specific response variants;
- `TrainingAttemptResult` posiada konkurencyjne modele `correctness`, `partial_credit` i `mixed`;
- `TrainingAttempt` nadal zawiera `confidence`;
- `ReviewReason` nadal zawiera `low_confidence`;
- track ID jest zamkniętą unią dwóch konkretnych tracków;
- `SessionModeDefinition` utrzymuje starą klasyfikację trybów.

## 3.2. Algorithms screen jest god screenem

`src/features/algorithms/AlgorithmsSessionScreen.tsx` obecnie:

- czyta attempty;
- czyta review queue;
- wybiera itemy;
- tworzy sesję;
- zapisuje sesję;
- prowadzi odpowiedź;
- liczy submission;
- zapisuje attempt;
- aktualizuje review;
- finalizuje sesję;
- zapisuje completion;
- buduje summary;
- mapuje feedback;
- prowadzi timer;
- obsługuje navigation;
- renderuje choice, ordering i complexity.

Dodatkowe rozbieżności:

- sesja może rozpocząć się mimo problemów z odczytem storage;
- nieudany zapis sesji, attemptu, review lub completion nie blokuje flow;
- submit nie jest jednym durable journal operation;
- timer wynika z czasu ściennego od `startedAt`, nie z foreground activity;
- complexity używa zamkniętej listy wartości zdefiniowanej w ekranie;
- option order nie jest częścią canonical persisted session;
- route modes nie odpowiadają zatwierdzonym trybom;
- current screen tworzy własny summary action mapping.

## 3.3. PracticeSessionScreen wybiera cały runtime po trackId

`src/features/practice/PracticeSessionScreen.tsx` zawiera branch:

```ts
if (route.params.trackId === ALGORITHMS_TRACK_ID) {
  return <AlgorithmsSessionScreen ... />;
}

return <CloudPracticeSessionScreen ... />;
```

Cloud Practice:

- używa starego `Question`;
- używa osobnego `practiceService`;
- liczy correctness własną funkcją;
- nie korzysta z canonical partial classification;
- zapisuje `PracticeAnswerRecord`;
- używa Cloud write-through;
- posiada własny review pass;
- posiada własny summary;
- posiada własny top bar i feedback presentation;
- pokazuje tekstowe i ikonowe statusy niezgodne z finalnym UI contractem.

## 3.4. Certification Exam jest osobnym systemem

Potwierdzone ścieżki:

- `src/features/exam/ExamScreen.tsx`;
- `src/features/exam/examService.ts`;
- stare typy w `src/types`;
- stare persistence functions w `src/storage/localStorage.ts`.

Obecny exam:

- używa `ActiveExamSession`;
- używa starego question banku;
- zapisuje przez stare storage API;
- korzysta z globalnej `EXAM_DURATION_MINUTES`;
- utrwala Previous/Next/Flag niezależnie od konkretnej certyfikacji;
- używa osobnego `AttemptSummary`;
- używa osobnego result route;
- używa Cloud write-through;
- nie korzysta z `ExamExperienceProfile`;
- nie wykonuje final submit przez durable journal.

## 3.5. Storage ma dwa systemy

Repozytorium zawiera równolegle:

- `src/storage/localStorage.ts`;
- `src/storage/keys.ts`;
- `src/storage/storageCodec.ts`;
- `src/storage/repositories/*`.

`src/storage/index.ts` eksportuje jednocześnie `localStorage` i repositories.

`localStorage.ts`:

- importuje AsyncStorage;
- próbuje wiele keys;
- przy błędzie zwraca fallback value;
- wybiera default track;
- scala zapisany bank z default question bank;
- przechowuje stare `Question`;
- przechowuje `AttemptSummary`;
- przechowuje `PracticeAnswerRecord`;
- przechowuje `ActiveExamSession`;
- przechowuje stare review state.

`package.json`:

- zawiera `@react-native-async-storage/async-storage`;
- nie zawiera MMKV.

## 3.6. Content nie spełnia finalnego contractu

Algorithms:

- używa `AlgorithmQuestion`;
- `details` jest opcjonalne;
- distractor explanations są opcjonalne;
- option explanation jest opcjonalne;
- feedback zawiera authored `result`;
- feedback jest rozbity między `decisionSignal`, `mentalModelCorrection`, `nextAction` i inne pola;
- complexity model zawsze zakłada time i space;
- nie ma content-defined option set per dimension.

Certification:

- używa starego `Question`;
- ma pojedyncze `explanation`;
- ma opcjonalne `whyOthersAreWrong`;
- nie wymaga explanation dla każdej błędnej opcji;
- nie używa finalnego `AuthoredFeedback`.

## 3.7. Istnieją podstawowe skrypty QA

`package.json` zawiera:

- `typecheck`;
- `test`;
- `validate:questions`;
- `qa:static`.

Nie wolno jednak zakładać, że obecny CI:

- uruchamia wszystkie skrypty;
- blokuje merge;
- wykrywa import boundaries;
- wykrywa stare paths;
- pokrywa durable journal;
- pokrywa canonical mode contracts.

---

# 4. Stan docelowy

```txt
app composition
├── track registry
│   ├── Algorithms track instance
│   │   └── AlgorithmsFamilyRuntime
│   └── Certification track instances
│       └── CertificationFamilyRuntime
│
├── shared learning kernel
│   ├── session lifecycle
│   ├── immutable attempt envelope
│   ├── canonical result envelope
│   ├── review records and commands
│   ├── evidence contracts
│   └── repository interfaces
│
├── application layer
│   ├── start session
│   ├── submit outcome
│   ├── advance
│   ├── complete
│   ├── abandon
│   ├── resume
│   ├── review
│   └── dashboard/progress queries
│
├── track families
│   ├── algorithms
│   │   ├── item/response contracts
│   │   ├── interaction handlers
│   │   ├── selection and review policy
│   │   ├── scoring
│   │   ├── summary
│   │   └── renderers
│   └── certification
│       ├── item/response contracts
│       ├── practice and review policy
│       ├── exam profile behavior
│       ├── scoring
│       ├── summary
│       └── renderers
│
├── shared session shell
│   ├── lifecycle state
│   ├── timer
│   ├── counter
│   ├── progress
│   ├── bottom action
│   ├── errors
│   └── exit and resume
│
└── infrastructure
    └── MMKV client and canonical repositories
```

---

# 5. Bramy wymagane przed odpowiednimi etapami

## G-01 — Zatwierdzone projekty UI

Przed etapem zawierającym nowe UI muszą istnieć zatwierdzone referencje dla:

- canonical session shell;
- ordering: unanswered, answered, correct, partial, incorrect;
- complexity: unanswered, answered, correct, partial, incorrect;
- preparation failure;
- journal write failure;
- materialization failure;
- completion failure;
- exit confirmation;
- resumed session;
- shortened review disclosure;
- Algorithms summary;
- Certification summary;
- Exam navigator variants;
- Exam review;
- empty review.

Jeżeli referencja nie istnieje:

- prompt nie zleca Codexowi zaprojektowania ekranu;
- Codex zwraca blocker;
- etap UI nie jest ukończony.

## G-02 — Algorithms Interview Simulation profile

Przed implementacją Algorithms `Interview Simulation` należy zdefiniować:

- duration;
- item count;
- navigation policy;
- answer-change policy;
- timer behavior;
- completion behavior;
- post-session diagnostics;
- produktowe źródło tego profilu.

Nie wolno kopiować Certification `ExamExperienceProfile`, jeżeli Algorithms simulation ma inną semantykę.

## G-03 — Certification mode matrix

Przed implementacją Certification runtime należy ustalić exact contract dla:

- `Diagnostic Baseline`;
- `Focus Practice`;
- `Scenario Practice`;
- `Weak Area Review`;
- `Mixed Practice`;
- `Quick Review`;
- `Exam Simulation`.

Dla każdego trybu:

- supported lengths;
- default length;
- feedback timing;
- timer;
- item selection;
- review source;
- reinsert;
- entry points;
- summary action.

## G-04 — GCP ACE ExamExperienceProfile

Przed implementacją GCP ACE Exam Simulation należy zweryfikować aktualny oficjalny format:

- official source URL;
- checked date;
- guide version;
- duration;
- question count/range;
- navigation;
- answer changes;
- flagging;
- navigator;
- sections;
- timeout.

Nie wolno opierać profilu na pamięci, blogu ani zachowaniu innego egzaminu.

## G-05 — Corrupt canonical MMKV records

Nie blokuje recovery. Musi zostać zamknięte przed produkcyjnym wydaniem.

Polityka nie może heurystycznie zmieniać:

- response;
- score;
- classification;
- review reason;
- dueAt;
- evidence.

---

# 6. Kolejność etapów

```txt
0 → 1A → 1B → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
```

| Etap | Rezultat                                                                    |
| ---- | --------------------------------------------------------------------------- |
| 0    | działająca bramka recovery i pełny removal inventory                        |
| 1A   | Algorithms content jest dydaktycznie poprawny w jednym aktywnym schema      |
| 1B   | Certification content jest dydaktycznie poprawny w jednym aktywnym schema   |
| 2    | oba banki używają finalnych family-owned content contracts                  |
| 3    | istnieje jeden canonical kernel i jeden ownership model                     |
| 4    | istnieje wyłącznie MMKV, canonical repositories i durable journal           |
| 5    | Algorithms działa wyłącznie przez AlgorithmsFamilyRuntime                   |
| 6    | Certification i GCP ACE działają wyłącznie przez CertificationFamilyRuntime |
| 7    | obie rodziny używają jednego shared session shellu                          |
| 8    | Home, Practice, Progress, Review i navigation używają canonical queries     |
| 9    | stare pathy nie są osiągalne, a regresja jest blokowana                     |

Nie wolno pomijać etapów content remediation. Nowy runtime nie może utrwalić shallow explanations ani generować dydaktycznego fallbacku.

# Etap 1A — Algorithms content semantic remediation

## Cel

Naprawić wartość dydaktyczną całego aktywnego Algorithms banku przed zmianą jego schema.

## Uzasadnienie kolejności

Nowy runtime nie może:

- tłumaczyć starego feedback modelu;
- generować `Details`;
- akceptować brakujących distractor explanations;
- aktywować itemów niespełniających canonical contractu.

Najpierw naprawiamy semantykę contentu. Następnie Etap 2 wykonuje mechaniczny, atomowy schema cutover.

## Zakres

Wszystkie aktywne Algorithms mental units.

Kolejność:

1. units używane w aktywnym roadmap flow;
2. units o najwyższym ryzyku false heuristic;
3. contrasts i mistake diagnosis;
4. pozostałe foundations i mechanics.

## Metoda batchu

Jeden batch = jeden mental unit.

Każdy batch:

- zawiera exact replacement content;
- jest czytany item po itemie;
- nie jest generowany z ogólnego polecenia;
- przechodzi human editorial review;
- zachowuje jednoznaczny primary skill atom;
- poprawia prompt, options i answer razem, gdy są niespójne;
- nie dodaje statusu jakości;
- nie ukrywa itemów.

## Wymagany standard każdego itemu

- concise immediate Reason;
- complete mechanism explanation;
- zastosowanie do konkretnego problemu;
- correction rzeczywiście wybranego błędu;
- transfer rule albo counterexample, gdy potrzebny;
- explanation każdej błędnej opcji;
- poprawne constraints;
- poprawne preconditions;
- poprawny invariant i state;
- poprawne complexity derivation;
- brak false heuristic;
- brak unnecessary solution dump.

## Reguła schema

Etap 1A nie tworzy drugiego feedback schema.

Nie dodawać:

- `feedbackV2`;
- `newDetails`;
- feature flag;
- per-item migrated status;
- optional dual schema;
- runtime fallback.

Content pozostaje w jednym aktualnym Algorithms schema aż do atomowego cutoveru w Etapie 2.

## Wymagane usunięcia

Z aktywnego contentu usuwać lub zastępować:

- answer restatement;
- generic feedback;
- fałszywe heurystyki;
- opcje bez sensownego distractor explanation;
- sprzeczne correct answer;
- błędne complexity;
- niewłaściwe skill atom refs;
- duplicated items bez odrębnej wartości dydaktycznej.

## Testy

Po każdym batchu:

- question validator;
- targeted question tests;
- typecheck;
- duplicate ID checks;
- taxonomy ref checks;
- correct-answer consistency;
- human rubric record.

## Kryteria zakończenia

- każdy aktywny mental unit został zrecenzowany;
- każda błędna opcja ma wartościowe explanation;
- nie ma shallow answer-only explanation;
- nie ma aktywnego unreviewed itemu;
- content jest gotowy do mechanicznego schema cutover.

## Zakazane interpretacje

- nie używać Codexa do masowego wymyślania explanations;
- nie oznaczać części banku jako legacy lub pending;
- nie wyłączać słabych itemów zamiast je poprawić;
- nie wprowadzać równoległego schema.

## Stan repo po etapie

Algorithms runtime nadal używa bieżącego family schema, ale cały aktywny content spełnia docelową jakość semantyczną.

---

# Etap 1B — Certification content semantic remediation

## Cel

Naprawić cały aktywny Certification bank przed zmianą jego schema i runtime.

## Zakres

Batchowanie:

1. competency area;
2. topic w ramach competency;
3. service/configuration decision boundaries.

Dla każdego itemu:

- scenario requirement;
- relevant service/property;
- expected decision;
- selected wrong reasoning;
- transfer boundary;
- material trade-off;
- official source stability;
- legal/content integrity.

## Praca w obecnym schema

Bieżący `Question` pozwala wykorzystać:

- `explanation`;
- `whyOthersAreWrong`;
- `watchOutFor`;
- `examSignals`.

Etap 1B poprawia te pola semantycznie, bez tworzenia drugiego schema.

Nie dodawać:

- `CertificationQuestionV2`;
- dual bank;
- alternate manifest;
- migrated flag;
- runtime adapter.

## Wymagany standard

- `explanation` zawiera pełny mechanizm i zastosowanie;
- `whyOthersAreWrong` obejmuje każdą błędną opcję;
- `examSignals` wskazują rzeczywiste sygnały scenariusza;
- `watchOutFor` zawiera materialną granicę lub kontrprzykład;
- nie używać ogólnych twierdzeń:
  - „more secure”;
  - „more scalable”;
  - „serverless”;
  - „managed”;
  - „recommended”;
  - „best practice”;
    bez wyjaśnienia konkretnej właściwości i jej znaczenia;
- content opiera się na stabilnym oficjalnym źródle;
- volatile pricing/UI content jest usuwany albo dokładnie versioned w samym itemie.

## Wymagane usunięcia

- exam-dump wording;
- product-name recall bez decision boundary;
- answer-only explanation;
- niewyjaśnione dystraktory;
- szybko dezaktualizujące się pytania bez versioned source;
- duplicate items bez odrębnego skill objective.

## Testy

Po każdym batchu:

- question validator;
- option coverage;
- source review;
- domain/topic refs;
- human technical sign-off;
- human editorial sign-off;
- legal/content-integrity check.

## Kryteria zakończenia

- każdy aktywny competency/topic batch jest zrecenzowany;
- każda zła opcja ma meaningful explanation;
- content uczy decyzji, nie nazw produktów;
- żaden aktywny item nie wymaga generic runtime fallbacku;
- bank jest gotowy do mechanicznego schema cutover.

## Zakazane interpretacje

- nie tworzyć nowego schema równolegle;
- nie kopiować wording oficjalnych pytań egzaminacyjnych;
- nie zachowywać weak items jako „historyczne”;
- nie zlecać masowej poprawy bez exact reviewed replacements.

## Stan repo po etapie

Certification runtime nadal używa bieżącego `Question`, ale cały aktywny bank spełnia docelową jakość semantyczną.

---

# Etap 2 — Canonical family content contracts cutover

## Cel

Atomowo zastąpić stare Algorithms i Certification content schemas finalnymi family-owned contracts.

## Warunki wejścia

- Etapy 1A i 1B zakończone;
- wszystkie aktywne itemy mają kompletną treść;
- nie istnieje potrzeba runtime-generated feedback;
- mapping starych pól na finalne pola jest mechaniczny i jednoznaczny.

## Docelowe kontrakty

### Shared authored feedback shape

Semantyka równoważna:

```ts
type AuthoredFeedback = {
  reason: string;
  details: {
    explanation: string;
    distractorExplanations?: Readonly<Record<string, string>>;
    transferRule?: string;
  };
  mistakeTypes?: readonly string[];
};
```

Family contract może używać bardziej precyzyjnych nazw, ale:

- `reason` jest required;
- `details` jest required;
- `details.explanation` jest required;
- każda błędna opcja ma explanation;
- authored content nie zawiera runtime result;
- runtime nie generuje explanation.

### Algorithms

Finalne typy:

- choice;
- ordering;
- complexity;
- family taxonomy refs;
- content-defined complexity dimensions;
- content-defined values;
- accepted aliases;
- canonical order;
- authored feedback.

### Certification

Finalne typy:

- single choice;
- multiple choice;
- competency/topic/skill refs;
- scenario signals;
- source metadata;
- authored feedback;
- exam relevance metadata.

## Wymagane zmiany

1. Zastąpić `AlgorithmQuestionFeedback`.
2. Usunąć authored `result`.
3. Usunąć optional `details`.
4. Usunąć optional distractor coverage dla aktywnych choice items.
5. Zastąpić `Question` przez family-owned `CertificationQuestion`.
6. Przenieść `whyOthersAreWrong` do stable-ID distractor explanations.
7. Przenieść `examSignals` i `watchOutFor` do finalnego contractu bez utraty semantyki.
8. Zmienić wszystkie aktywne content files atomowo.
9. Zmienić manifests.
10. Zmienić validators.
11. Zmienić content tests.
12. Zmienić content resolvers.

## Wymagane usunięcia

- `src/types/question.ts` jako aktywny content model;
- stary `AlgorithmQuestionFeedback`;
- option-level optional explanation, jeżeli dubluje finalne distractor map;
- authored status/result;
- `answerFeedback`, `reasonSignal` i inne pola dublujące finalny feedback;
- old content adapters;
- dual manifests;
- fallback resolver;
- compatibility parser.

Jeżeli jakieś stare pole nie ma jednoznacznego finalnego znaczenia, usunąć je. Nie zachowywać „na przyszłość”.

## Testy

- wszystkie aktywne items przechodzą finalny validator;
- każda zła opcja posiada explanation;
- ordering ma co najmniej dwa elementy;
- complexity declares dimensions, values i aliases;
- no authored result;
- no optional Details;
- no unknown fields;
- no old content type imports;
- content manifest count;
- full `validate:questions`.

## Kryteria zakończenia

- istnieje jeden Algorithms content contract;
- istnieje jeden Certification content contract;
- każdy aktywny item spełnia finalny AuthoredFeedback;
- stare content types są usunięte;
- nie istnieje adapter starego banku;
- runtime może czytać wyłącznie finalne family items.

## Zakazane interpretacje

- nie pozostawiać obu schemas;
- nie tworzyć translatora;
- nie akceptować „tymczasowo” brakujących Details;
- nie zachowywać unknown fields;
- nie mapować błędnej treści automatycznie bez wcześniejszego review.

## Stan repo po etapie

Oba aktywne banki są finalne strukturalnie i dydaktycznie. Nie istnieje stary content schema.

---

# Etap 3 — Canonical learning kernel i domain ownership cutover

## Cel

Usunąć globalny model concrete itemów i wyników. Ustanowić jeden family-agnostic kernel i family-owned response semantics.

## Warunki wejścia

- Etap 2 zakończony;
- finalne content contracts istnieją;
- active content nie wymaga translatorów.

## Shared kernel

Kernel posiada wyłącznie:

- `TrackId`;
- `TrackFamilyId`;
- `ContentItemRef`;
- `TrainingSession`;
- `TrainingAttempt`;
- `AttemptResult`;
- `ReviewQueueEntry`;
- `LearningEvidence`;
- lifecycle commands/events;
- repository interfaces.

Kernel nie posiada:

- concrete item union;
- concrete response union;
- Algorithms taxonomy;
- Certification taxonomy;
- scoring rules;
- interaction renderer types;
- Exam profile behavior;
- mode semantics.

## Canonical result

Jeden envelope:

```ts
type AttemptResult = {
  kind: "correct" | "partial" | "incorrect";
  earnedPoints: number;
  maxPoints: number;
  components?: readonly AttemptResultComponent[];
};
```

Nazwy mogą zostać dopasowane, ale nie mogą pozostać równoległe modele `correctness`, `partial_credit` i `mixed`.

## Wymagane zmiany

- family-specific response pozostaje opaque dla kernelu;
- attempt zapisuje family response payload przez typed family boundary;
- track IDs są registry-resolved, nie zamkniętą unią dwóch wartości;
- review reasons są finalne i nie zawierają confidence;
- review przechowuje source item oraz taxonomy/skill evidence;
- session przechowuje requested/actual length;
- session przechowuje item order i option order;
- session przechowuje foreground time;
- composition root rejestruje family runtime i track instances;
- unknown family/track/item type kończy się explicit error.

## Wymagane usunięcia

- globalny `TrainingItem`;
- globalny `TrainingItemType` katalog concrete interactions;
- globalny response union zawierający family semantics;
- `TrainingAttemptConfidence`;
- `low_confidence`;
- `correctness`;
- `partial_credit`;
- `mixed` jako konkurencyjne result models;
- unsupported planned interaction types z aktywnego domain;
- adapters tłumaczące globalny item na family scorer;
- compatibility re-exports;
- stare `SessionModeType` i `FeedbackTiming`, jeżeli nie mapują się jednoznacznie na canonical modes;
- default track fallback.

Jeżeli obecny typ nie ma finalnego ownera, usunąć go.

## Integracja z istniejącymi flow

Aktywne screens/services muszą:

- kompilować się z canonical kernel;
- używać family-owned items;
- tworzyć canonical session/attempt/result/review;
- albo zostać usunięte, jeżeli nie da się ich przepiąć bez translatora.

Nie wolno zachować starego modelu tylko do czasu Etapu 5 lub 6.

## Testy

- kernel import boundaries;
- Algorithms i Certification nie importują się wzajemnie;
- registry resolution;
- unknown track/family fails;
- canonical result tests;
- review reason tests;
- session invariants;
- compile-time exhaustive family handlers;
- search potwierdzający usunięte symbole.

## Kryteria zakończenia

- kernel nie zna concrete item types;
- każdy aktywny item należy do jednej rodziny;
- attempt nie ma confidence;
- jeden result contract jest używany wszędzie;
- jeden session contract jest używany wszędzie;
- jeden review contract jest używany wszędzie;
- nie istnieje translator starego modelu.

## Zakazane interpretacje

- nie tworzyć `LegacyTrainingItem`;
- nie tworzyć `OldQuestionAdapter`;
- nie utrzymywać dwóch result unions;
- nie mapować starego response w runtime;
- nie oznaczać starego modelu jako deprecated;
- nie zostawiać re-exportów dla kompatybilności.

## Stan repo po etapie

Wszystkie aktywne flow korzystają z jednego canonical data modelu, nawet jeśli orchestration pozostaje jeszcze w obecnych screenach/services.

---

# Etap 4 — MMKV-only persistence i durable journal

## Cel

Usunąć cały stary storage system i zastąpić go jednym MMKV clientem, canonical repositories i durable mutation journal.

## Warunki wejścia

- Etap 3 zakończony;
- canonical session, attempt, result, review i evidence istnieją;
- nie ma wymogu zachowania starych danych.

## Zakres

- MMKV infrastructure client;
- canonical keys;
- session repository;
- attempt repository;
- review repository;
- active session repository;
- settings repository;
- journal repository;
- storage error model;
- app-start journal recovery;
- reset starego storage.

## Wymagane zmiany

1. Dodać MMKV dependency i native configuration.
2. Utworzyć jeden infrastructure client.
3. Zdefiniować canonical persisted records.
4. Zapisywać:
   - session przed pierwszym itemem;
   - item order;
   - shuffled option order;
   - active foreground time;
   - configuration snapshot;
   - content version;
   - immutable attempts;
   - two-level review evidence;
   - durable journal.
5. Wymusić jedną aktywną sesję.
6. Nie zapisywać current unsubmitted selection.
7. Wprowadzić journal:
   - deterministic outcome;
   - durable write;
   - materialization;
   - verification;
   - clear.
8. Na starcie:
   - usunąć stare AsyncStorage keys;
   - nie odczytywać ich;
   - nie migrować danych.

## Durable submit

```txt
validate and freeze response
→ build deterministic attempt/session/review outcome
→ persist journal
→ after journal success show feedback or transition
→ materialize canonical repositories
→ verify
→ clear journal
```

Feedback ani przejście nie mogą nastąpić przed journal durability.

## Wymagane usunięcia

- AsyncStorage dependency;
- każdy AsyncStorage import;
- `src/storage/localStorage.ts`;
- stare `keys.ts`;
- read-key fallback lists;
- fallback arguments;
- stary `storageCodec`;
- `Question` bank persistence;
- `AttemptSummary` persistence;
- `PracticeAnswerRecord` persistence;
- `ActiveExamSession` persistence;
- `QuestionReviewState`;
- Cloud write-through;
- dual repository/localStorage export;
- wszystkie stare keys;
- migration runners;
- record translators.

## Integracja z bieżącym runtime

Bieżące screens/services mogą w tym etapie korzystać z canonical repositories, ponieważ final application layer powstanie w Etapach 5 i 6.

Nie wolno:

- pozostawić starego storage jako fallback;
- utrzymać starego record shape;
- kontynuować flow po błędzie journal write;
- emitować komunikatu „session continues with available data”;
- tworzyć partial success.

Każdy aktywny flow musi:

- zapisać canonical record;
- pokazać explicit failure;
- albo zostać usunięty, jeżeli nie da się go poprawnie przepiąć.

## Testy

- MMKV repository CRUD;
- one active session;
- no unsubmitted response;
- item/option order;
- foreground timer;
- journal-before-feedback;
- idempotent retry;
- force-close recovery;
- failed journal write;
- failed materialization;
- reset old keys;
- zero AsyncStorage imports;
- zero old keys/APIs.

## Kryteria zakończenia

- package nie zawiera AsyncStorage;
- tylko infrastructure zna MMKV;
- istnieje jeden storage client;
- istnieje jeden repository set;
- stare dane są usuwane, nie migrowane;
- submit outcome jest journaled;
- żaden flow nie czyta starego schema;
- storage failure blokuje niebezpieczny postęp.

## Zakazane interpretacje

- nie tworzyć dual engine;
- nie zachowywać read fallback;
- nie migrować starych danych;
- nie naprawiać heurystycznie;
- nie pozostawiać starego API jako wrappera;
- nie przechodzić dalej po nieudanym journal write.

## Stan repo po etapie

Persistence jest finalne. Runtime orchestration może być jeszcze screen-driven, ale nie istnieje stary storage path.

---

# Etap 5 — AlgorithmsFamilyRuntime vertical cutover

## Cel

Przenieść Algorithms do jednego family runtime i application flow. Usunąć Algorithms god screen.

## Warunki wejścia

- Etapy 0–4 zakończone;
- G-01 zamknięte dla Algorithms UI;
- G-02 zamknięte przed implementacją Interview Simulation;
- finalne Algorithms content i repositories istnieją.

## Family runtime ownership

`AlgorithmsFamilyRuntime` posiada:

- canonical mode definitions;
- session selection;
- review composition;
- response completeness;
- scoring;
- feedback composition;
- reinsert;
- summary diagnosis;
- progress evidence;
- recommendation inputs;
- interaction handler registry.

## Application use cases

Wprowadzić:

- `startAlgorithmsSession`;
- `submitAlgorithmsResponse`;
- `advanceAlgorithmsSession`;
- `completeAlgorithmsSession`;
- `abandonAlgorithmsSession`;
- `resumeAlgorithmsSession`;
- `buildAlgorithmsSummary`.

Nazwy mogą się różnić, ale odpowiedzialność musi być jawna.

## Interaction handlers

Oddzielne handlers dla:

- choice;
- ordering;
- complexity.

Każdy handler zawiera:

- item contract;
- response contract;
- content validation;
- completeness;
- scoring;
- feedback mapping;
- renderer;
- accessibility contract;
- tests.

## Scoring

### Multiple choice

- exact full correct set: correct;
- non-empty proper correct subset without wrong: partial;
- any wrong selected option: incorrect, zero points.

### Ordering

- score adjacent relations;
- all: correct;
- some: partial;
- zero: incorrect.

### Complexity

- one point per declared dimension;
- content-defined values and aliases;
- no screen-global catalog.

## Review i reinsert

- two-level review;
- approved review triggers;
- due/session misses jako Weak Area Review sources;
- fill only compatible reviewed items;
- shorten if insufficient;
- reinsert only Guided Practice i Weak Area Review;
- maximum once;
- at least two other submitted items;
- skip if separation impossible;
- same-session correction does not resolve persistent review.

## Wymagane zmiany

- przenieść selection z ekranu;
- przenieść scoring z modelu/screena do handlers;
- przenieść review mutation;
- przenieść summary diagnosis;
- przenieść mode mapping;
- przenieść timer ownership do lifecycle state;
- UI korzysta z application state i commands;
- route przekazuje explicit canonical configuration;
- actual shortened length jest pokazane przed startem;
- storage errors są explicit states.

## Wymagane usunięcia

- orchestration z `AlgorithmsSessionScreen`;
- bezpośrednie repository imports w screenie;
- bezpośrednie session creation w screenie;
- bezpośrednie attempt writes w screenie;
- bezpośrednie review writes w screenie;
- bezpośrednie completion writes w screenie;
- hardcoded complexity choices;
- old mode IDs;
- old summary action mapping;
- catch-and-continue storage messages;
- stare Algorithms session model functions zastąpione przez runtime;
- duplicate scoring path.

Jeżeli `AlgorithmsSessionScreen` nie da się odchudzić bez pozostawienia starego runnera, usunąć go i zastąpić nową family screen composition.

## Testy

- pure runtime tests bez Reacta;
- start/submit/advance/complete;
- all canonical modes;
- shortened review;
- reinsert 0/1/2 separation;
- all scoring;
- journal failure;
- resume;
- abandon;
- option order;
- foreground timer;
- summary constraints;
- Details side-effect free;
- no old Algorithms orchestration imports.

## Kryteria zakończenia

- Algorithms lifecycle jest testowalny bez Reacta;
- screen jest presentation/composition;
- wszystkie modes używają jednego runtime;
- nie istnieje stary Algorithms runner;
- nie istnieje duplicate scoring;
- nie istnieje generic feedback fallback;
- Interview Simulation działa zgodnie z zatwierdzonym profilem albo etap nie jest ukończony.

## Zakazane interpretacje

- nie zostawiać starego runnera jako fallback;
- nie branchować po starym route mode;
- nie przenosić storage do custom hooka zamiast application layer;
- nie tworzyć handlera bez validatora i testów;
- nie ukrywać brakującego contentu.

## Stan repo po etapie

Algorithms działa wyłącznie przez `AlgorithmsFamilyRuntime`, canonical application use cases i MMKV repositories.

---

# Etap 6 — CertificationFamilyRuntime i GCP ACE cutover

## Cel

Zastąpić Cloud Practice i Exam jednym Certification family runtime. GCP ACE staje się track instance.

## Warunki wejścia

- Etapy 0–5 zakończone;
- G-01 zamknięte dla Certification UI;
- G-03 zamknięta;
- G-04 zamknięta;
- finalne Certification content i repositories istnieją.

## Certification family ownership

`CertificationFamilyRuntime` posiada:

- canonical mode matrix;
- competency/topic selection;
- choice completeness;
- practice scoring;
- review composition;
- ExamExperienceProfile behavior;
- exam selection;
- deadline;
- navigation;
- answer changes;
- flagging;
- section policy;
- timeout;
- final scoring;
- answer review;
- summary.

## GCP ACE track instance

Posiada:

- metadata;
- taxonomy;
- content manifest;
- content;
- blueprint;
- enabled modes;
- `ExamExperienceProfile`;
- official source metadata.

Nie posiada osobnego runnera.

## Practice

Migrować:

- `Focus Practice`;
- `Scenario Practice`;
- `Weak Area Review`;
- `Mixed Practice`;
- `Quick Review`;
- `Diagnostic Baseline`.

Practice korzysta z:

- canonical session;
- canonical attempt;
- canonical review;
- canonical feedback;
- canonical repositories;
- durable journal.

## Exam Simulation

- profile-driven;
- absolute deadline;
- no feedback before final submit;
- profile-specific navigation;
- profile-specific answer changes;
- profile-specific flagging;
- profile-specific navigator;
- profile-specific sections;
- unanswered warning;
- unanswered = incorrect + distinct diagnostic;
- binary correct count;
- partial diagnostic only;
- raw count;
- percentage;
- competency breakdown;
- missed-by-default answer review;
- idempotent timeout finalization;
- one active exam per track.

## Wymagane zmiany

- utworzyć Certification family application use cases;
- podłączyć GCP ACE content;
- podłączyć official ExamExperienceProfile;
- przenieść practice selection;
- przenieść exam selection;
- przenieść scoring;
- przenieść review;
- przenieść summary;
- przenieść deadline/resume;
- przenieść navigator behavior;
- używać canonical journal.

## Wymagane usunięcia

- `CloudPracticeSessionScreen`;
- branch po `trackId` wybierający cały screen;
- `practiceService`;
- `examService`;
- `ExamScreen` jako osobny runner;
- `ActiveExamSession`;
- `AttemptSummary`;
- `PracticeAnswerRecord`;
- `QuestionReviewState`;
- old scoring service;
- old exam generation path, jeżeli nie może zostać przeniesiony do family ownera;
- `EXAM_DURATION_MINUTES`;
- Cloud write-through;
- old result route model;
- old question bank persistence;
- old Cloud history reads;
- compatibility bridges.

Jeżeli istniejący exam component można wykorzystać wyłącznie przez zachowanie `ActiveExamSession`, usunąć component i zbudować renderer nad canonical session state.

## Testy

- wszystkie Certification modes;
- practice scoring;
- review;
- competency selection;
- GCP ACE profile validation;
- profile-specific navigation;
- answer changes;
- flagging;
- navigator;
- deadline;
- resume;
- timeout;
- unanswered;
- final journal commit;
- answer review;
- no official pass/fail;
- no old Cloud symbols/imports.

## Kryteria zakończenia

- GCP ACE jest Certification track instance;
- jedna rodzina obsługuje practice i exam;
- nie istnieje Cloud-specific runtime;
- nie istnieje osobny exam persistence path;
- nowa certyfikacja wymaga contentu, taxonomy, blueprint/config i profile, nie nowego runnera;
- stare Cloud models są usunięte.

## Zakazane interpretacje

- nie kopiować Cloud flow jako template nowej rodziny;
- nie zachowywać `Question` adaptera;
- nie zachowywać `ActiveExamSession`;
- nie inferować exam profile;
- nie stosować globalnej duration;
- nie zachowywać old result route jako fallback.

## Stan repo po etapie

Certification działa wyłącznie przez `CertificationFamilyRuntime`. GCP ACE nie posiada własnego runtime ani storage.

---

# Etap 7 — Shared session shell i family renderers

## Cel

Utworzyć jeden session shell dla obu rodzin. Shell obsługuje lifecycle i layout, a family renderers obsługują item semantics.

## Warunki wejścia

- Etapy 5 i 6 zakończone;
- obie rodziny używają canonical application commands;
- G-01 zamknięta dla wszystkich shell states.

## Shared shell posiada

- top bar;
- timer;
- counter;
- progress;
- scroll;
- bottom action panel;
- preparation;
- active unanswered;
- active answered;
- journal failure;
- materialization failure;
- completion failure;
- exit confirmation;
- resume;
- summary transition.

## Family renderer posiada

- prompt presentation;
- response controls;
- completeness presentation;
- answer visual mapping;
- Reason;
- Details;
- selected distractor composition;
- interaction-specific accessibility.

## Canonical UI

- timer po lewej;
- counter `1 OF 20` po prawej;
- brak Patternly w top barze;
- brak `Item`;
- brak close buttonu;
- correctness przez kolor;
- brak correctness icons/text przy odpowiedziach;
- Reason widoczne;
- Details collapsed;
- persistent bottom action;
- opening Details bez side effects.

Accessibility nie może polegać wyłącznie na kolorze, ale visible UI nie dodaje zakazanych status icons/text przy opcjach. Stan musi być dostępny przez accessibility labels/state.

## Wymagane zmiany

- zbudować shell nad canonical view state;
- zarejestrować family renderers;
- usunąć full-screen branching;
- wspólny timer wykorzystuje elapsed foreground albo absolute deadline;
- shell pokazuje exact error state;
- shell nie zna concrete item type union;
- shell nie zna track taxonomy.

## Wymagane usunięcia

- duplicate top bars;
- duplicate timers;
- duplicate counters;
- duplicate bottom panels;
- duplicate loading shells;
- duplicate feedback cards;
- generic `Feedback` heading;
- textual correctness labels przy options;
- icons poprawności;
- full-screen `if trackId`;
- shell-level scoring;
- shell-level repository access.

## Testy

- shell niezależny od family;
- renderer registry;
- all lifecycle states;
- timer variants;
- Details side effects;
- answer accessibility;
- missing renderer explicit error;
- no concrete family imports w shellu;
- screenshot comparisons do approved designs.

## Kryteria zakończenia

- jedna sesja UI obsługuje obie rodziny;
- dodanie interaction handlera nie modyfikuje shellu;
- dodanie track instance nie modyfikuje shellu;
- shell nie importuje concrete item union;
- nie istnieją stare pełne session screens.

## Zakazane interpretacje

- nie przenosić starego screen branch do registry wrappera;
- nie przenosić scoringu do shell hooka;
- nie dodawać generycznego renderer fallbacku;
- nie projektować brakującego state;
- nie zachowywać starego screen jako fallback.

## Stan repo po etapie

Jeden session shell prezentuje lifecycle. Rodziny dostarczają semantics i renderers.

---

# Etap 8 — Home, Practice, Progress, Review i navigation

## Cel

Przepiąć powierzchnie przekrojowe na canonical queries, registry i family recommendations.

## Warunki wejścia

- Etapy 3–7 zakończone;
- canonical evidence model istnieje;
- family runtime publikuje query contracts.

## Zakres

- Home;
- track selection;
- Practice Hub;
- mode setup;
- review;
- progress;
- topic detail;
- session summary actions;
- navigation;
- settings;
- active session resume.

## Wymagane zmiany

### Queries

Wprowadzić application queries:

- dashboard;
- active session;
- due review;
- family progress;
- topic/competency detail;
- deterministic recommendation;
- session-mode definitions.

### Evidence

Oddzielić:

- `evidenceVolume`;
- `learningStageEvidence`;
- `performanceSignals`.

Nie tworzyć jednego procentu.

### Recommendation

- deterministic;
- family-specific;
- Home prioritizes overdue review i repeated mistakes;
- manual choice wygrywa dla bieżącej sesji;
- zawsze podaje powód;
- bez `Recommended by AI`.

### Navigation

- explicit route params;
- canonical mode IDs;
- explicit review source;
- explicit errors dla unknown IDs;
- Continue / Abandon and start new;
- brak silent topic fallback.

## Wymagane usunięcia

- duplicate history loading;
- duplicate progress aggregations;
- old route modes;
- `Due Review` jako osobny mode;
- `Session Misses` jako osobny mode;
- default topic mapping;
- default track fallback;
- storage calls w screens;
- track-specific taxonomy parsing w generic screens;
- readiness/retention/mastery;
- confidence;
- AI recommendation copy;
- old Cloud history queries.

## Testy

- dashboard per family;
- recommendation reasons;
- manual override;
- due review priority;
- progress evidence thresholds;
- unknown route ID;
- active session choice;
- shortened review disclosure;
- mode setup;
- offline restart;
- navigation integration.

## Kryteria zakończenia

- Home i Practice Hub nie ładują dwóch historii;
- feature screens nie interpretują concrete taxonomy;
- session modes mają jedno źródło prawdy;
- review używa canonical queue;
- progress używa canonical evidence;
- unknown ID kończy się explicit error;
- nie istnieją stare navigation branches.

## Zakazane interpretacje

- nie implementować family recommendation w generic screen;
- nie maskować unknown ID default topicem;
- nie tworzyć osobnego history modelu dla tracka;
- nie pokazywać metric bez training action;
- nie blokować dostępu syntetycznym mastery threshold.

## Stan repo po etapie

Cross-family surfaces są cienkimi klientami application queries i registry contracts.

---

# Etap 9 — Final deletion, enforcement i hardening

## Cel

Usunąć każdy zastąpiony path, wymusić architekturę i potwierdzić jakość całego produktu.

## Warunki wejścia

- Etapy 0–8 zakończone;
- wszystkie canonical flows działają;
- G-01–G-04 zamknięte;
- G-05 zamknięta przed produkcyjnym wydaniem.

## Zakres

- dead-code cleanup;
- key cleanup;
- route cleanup;
- export cleanup;
- package cleanup;
- cycle detection;
- import boundaries;
- public API reduction;
- full integration;
- manual QA;
- screenshot QA;
- documentation-to-code review;
- final content audit.

## Wymagane działania

1. Search i usunięcie:
   - AsyncStorage;
   - `localStorage`;
   - old keys;
   - `Question`;
   - `AttemptSummary`;
   - `PracticeAnswerRecord`;
   - `ActiveExamSession`;
   - old `TrainingItem` union;
   - `TrainingAttemptConfidence`;
   - `low_confidence`;
   - `PracticeSessionScreen` old branch;
   - `AlgorithmsSessionScreen` old orchestration;
   - `ExamScreen` old runner;
   - `practiceService`;
   - `examService`;
   - Cloud write-through;
   - fallback/default branches;
   - old mode IDs;
   - generic feedback.
2. Włączyć blocking import-boundary checks.
3. Włączyć cycle detection.
4. Ograniczyć public exports.
5. Uruchomić pełne QA.
6. Zaktualizować dokumentację wyłącznie do finalnego repo evidence.
7. Wykonać finalny human content audit.

## Wymagane usunięcia

Każdy nieużywany:

- type;
- export;
- route;
- service;
- repository;
- key;
- fixture;
- test;
- component;
- design assumption;
- content adapter;
- fallback.

Nie pozostawiać martwego kodu „na przyszłość”.

## Testy

- full CI;
- typecheck;
- all unit;
- all integration;
- content validation;
- architecture boundaries;
- cycle detection;
- dead export checks;
- route checks;
- package dependency scan;
- manual mobile QA;
- screenshot comparison;
- force-close recovery;
- offline restart;
- documentation consistency;
- full active content review.

## Globalne kryteria zakończenia

Recovery jest zakończone wyłącznie, gdy:

- istnieje jeden canonical shared learning kernel;
- istnieje jeden session model;
- istnieje jeden attempt model;
- istnieje jeden result model;
- istnieje jedna review queue;
- istnieje jeden evidence model;
- istnieje jeden MMKV storage subsystem;
- nie istnieje AsyncStorage;
- nie istnieje historyczna migracja;
- nie istnieje compatibility adapter;
- nie istnieje globalny concrete item union;
- kernel nie importuje family;
- Algorithms działa przez jeden family runtime;
- Certification działa przez jeden family runtime;
- GCP ACE jest track instance;
- istnieje jeden shared session shell;
- screen nie posiada scoringu, review i persistence;
- unknown IDs nie mają fallbacku;
- missing content nie ma fallbacku;
- runtime failure jest jawny;
- wszystkie Algorithms items mają production-valid Details;
- wszystkie Certification items mają production-valid Details;
- wszystkie błędne options mają explanations;
- CI blokuje regresję;
- documentation odpowiada kodowi.

## Zakazane interpretacje

- nie kończyć recovery z martwym starym path'em;
- nie uznawać re-exportu za nieszkodliwy;
- nie zostawiać starego key;
- nie zostawiać starego testu;
- nie ukrywać błędu;
- nie kończyć bez manual i screenshot QA;
- nie odkładać active content defects.

## Stan repo po etapie

Repozytorium zawiera wyłącznie canonical architecture, canonical content, canonical storage i enforcement zapobiegający powrotowi konkurencyjnych ścieżek.

---

# 7. Dlaczego kolejność jest obowiązkowa

1. **Etap 0** tworzy wiarygodną bramkę i inventory.
2. **Etapy 1A–1B** poprawiają semantykę contentu bez dual schema.
3. **Etap 2** może dzięki temu wykonać atomowy schema cutover bez fallbacku.
4. **Etap 3** usuwa globalne domain unions dopiero, gdy family content contracts są finalne.
5. **Etap 4** buduje finalne persistence na finalnych data contracts.
6. **Etap 5** migruje Algorithms bez starego storage i bez starego content schema.
7. **Etap 6** migruje Certification i usuwa Cloud-specific runtime.
8. **Etap 7** tworzy shared shell dopiero, gdy obie rodziny mają canonical runtimes.
9. **Etap 8** przepina cross-family surfaces na realne query contracts.
10. **Etap 9** usuwa każdy pozostały path i blokuje regresję.

Zmiana kolejności może wymusić:

- adapter starego contentu;
- translator starego attemptu;
- dual storage;
- tymczasowy runner;
- ukryty fallback.

Takie rozwiązania są zabronione.

---

# 8. Format promptów w kroku 3

Każdy prompt naprawczy generowany dla Codexa musi zawierać:

1. `Objective`
2. `Why this stage exists`
3. `Current repository facts`
4. `Canonical source documents`
5. `Exact files in scope`
6. `Exact files out of scope`
7. `Final owner of every changed responsibility`
8. `Domain contracts`
9. `Content contracts`
10. `UI contract`
11. `State transitions`
12. `Scoring rules`
13. `Review rules`
14. `Reinsert rules`
15. `Persistence rules`
16. `Error behavior`
17. `Required deletions`
18. `Required positive tests`
19. `Required negative tests`
20. `Acceptance criteria`
21. `Forbidden interpretations`
22. `Required final report`

Każdy prompt musi zawierać regułę:

> If an existing model, record, flow, or module cannot be moved into the final structure without preserving obsolete semantics, delete it. Do not create a fallback, translator, compatibility adapter, dual path, or backward-compatible reader. A runtime failure is evidence of unfinished recovery and must remain explicit until the responsible path is fixed or removed.

Prompt nie jest gotowy, jeżeli Codex nadal musi zdecydować:

- kto jest ownerem;
- jaki model jest finalny;
- który path usunąć;
- jak klasyfikować wynik;
- kiedy tworzyć review;
- jak zapisać outcome;
- jak wygląda UI;
- co zrobić po błędzie;
- jakie testy dowodzą ukończenia.

## Final report Codexa

Każdy etap kończy raport:

- changed files;
- confirmed repository facts;
- final owners introduced;
- deleted files/symbols/paths;
- why each deletion was safe;
- tests executed;
- test results;
- negative checks executed;
- manual QA;
- design references used;
- unverified areas;
- remaining blockers;
- confirmation that no fallback/translator/compatibility path was added.

Codex nie może oznaczyć etapu jako zakończony, jeżeli:

- testów nie uruchomiono;
- design był brakujący;
- stary path pozostał;
- dodano compatibility bridge;
- runtime kontynuuje po niebezpiecznym błędzie;
- final owner jest niejednoznaczny.

---

# 9. Warunek rozpoczęcia kroku 3

Przechodzenie przez plan etap po etapie rozpoczyna się od Etapu 0.

Przed wygenerowaniem promptu dla danego etapu należy:

1. ponownie sprawdzić aktualny `main`;
2. potwierdzić, że poprzedni etap jest faktycznie wdrożony;
3. uruchomić lub odczytać wyniki wymaganych testów;
4. zaktualizować inventory starych paths;
5. sprawdzić wymagane gate'y;
6. wygenerować prompt oparty na aktualnym repo, nie na planowanym stanie;
7. nie zakładać, że wcześniejszy prompt został wdrożony poprawnie tylko na podstawie raportu Codexa.

Każdy etap jest osobnym zadaniem. Nie generować z góry promptów dla późniejszych etapów, ponieważ exact files i current repository facts zmienią się po każdym cutoverze.

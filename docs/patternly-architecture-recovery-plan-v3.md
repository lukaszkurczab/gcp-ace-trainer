# 18 — Architecture Recovery Plan v3

## Status dokumentu

Ten dokument zastępuje wcześniejszy `18-architecture-recovery-plan.md`.

Plan v3 uwzględnia:

- zatwierdzone dokumenty `00–17`;
- zasadę „przenieś albo usuń”;
- wykonane Etapy 0, 0E i 0F;
- jeden aktywny Algorithms response schema;
- zielony lokalny baseline;
- decyzję, że pełna poprawa jakości pytań nie blokuje recovery architektury;
- możliwość przeniesienia contentu do backendu;
- rozdzielenie kontraktu contentu, źródła contentu, publikacji oraz runtime resolution.

Dokumenty `00–17` opisują docelowe zachowanie produktu. Ten dokument opisuje kolejność wdrożenia.

---

# 1. Reguły nadrzędne

## 1.1. Przenieś albo usuń

Jeżeli istniejącego modelu, rekordu, flow, modułu albo storage pathu nie da się przenieść do finalnej struktury bez zachowania starej semantyki, należy go usunąć.

Nie tworzymy:

- fallbacków;
- translatorów;
- compatibility adapters;
- dual reads;
- dual writes;
- równoległych runnerów;
- równoległych storage engines;
- trwałych aliasów starych modeli;
- default topiców, itemów, odpowiedzi ani wyników;
- runtime-generated explanations;
- kompatybilności danych przedprodukcyjnych.

Jawny błąd runtime jest lepszy niż ukrycie niedokończonej migracji.

## 1.2. Jeden właściciel

Po zakończeniu każdego etapu:

- jeden koncept ma jednego ownera;
- replacement jest jedyną aktywną implementacją;
- stary path jest usunięty;
- nie istnieje ścieżka awaryjna do starego systemu;
- testy potwierdzają brak starego pathu.

## 1.3. Brak migracji starych danych

Patternly jest przed produkcyjnym wydaniem. Recovery:

- usuwa stare dane AsyncStorage;
- nie migruje historycznych sesji, attemptów, review ani progressu;
- nie rekonstruuje starych explanations;
- nie mapuje starych item IDs;
- nie przechowuje starego banku;
- nie utrzymuje kodu migracyjnego po cutoverze.

## 1.4. Content nie blokuje runtime recovery

Pełna poprawa jakości pytań jest ważna produktowo, ale nie jest warunkiem:

- budowy kernelu;
- budowy persistence;
- migracji family runtimes;
- budowy shared session shellu;
- przebudowy Home, Practice, Progress i Review.

W trakcie recovery naprawiamy tylko content, który:

- łamie schema;
- ma błędny correct answer;
- powoduje błędny scoring;
- ma nieprawidłowe ID;
- nie może zostać wyrenderowany;
- łamie review lub runtime contract.

Pełna poprawa Reason, Details, distractor explanations, transferu i redukcji powtórzeń zostaje przesunięta na późniejszy etap.

---

# 2. Hierarchia źródeł prawdy

| Obszar | Źródło |
|---|---|
| Produkt | `00-overview.md`, `01-product-definition.md` |
| Architektura | `02-architecture.md`, `04-data-model.md`, `11-implementation-guidelines.md` |
| Nawigacja | `03-navigation-and-flows.md` |
| UI | `05-design-system.md`, `06-branding-and-style-direction.md`, `17-training-runtime-and-interaction-spec.md` |
| Content | `07-content-guidelines.md`, `14-learning-effectiveness-model.md`, `15-certification-track-learning-system.md`, `16-leetcode-like-learning-system.md` |
| Storage | `08-storage-and-offline.md`, `09-security-and-privacy.md` |
| Testy | `12-testing-strategy.md` |
| Ryzyka | `13-risk-register.md` |
| Kolejność wdrożenia | ten dokument |

W przypadku konfliktu:

1. dokument 17 rozstrzyga runtime i interaction behavior;
2. dokumenty 02 i 04 rozstrzygają ownership i modele;
3. dokument 08 rozstrzyga persistence;
4. dokumenty 15 i 16 rozstrzygają family semantics;
5. aktualny kod jest dowodem obecnego stanu, nie docelowego stanu.

---

# 3. Wykonane etapy

## Etap 0 — Recovery baseline

Wykonano:

- jeden workflow QA dla PR i `main`;
- recovery inventory;
- dependency graph;
- design blockers;
- gates G-01–G-05;
- target contract fixtures;
- baseline report;
- documentation i inventory smoke.

## Etap 0E — Baseline stabilization

Domknięto:

- reinsert contract;
- `mixed-pattern-practice`;
- duplikat `ALGORITHM_CONTENT_VERSION`;
- uruchamianie validatora przez `node --import tsx`;
- pojedyncze wykonanie `qa:static`.

## Etap 0F — Algorithms response-schema normalization

Stan po etapie:

- 1692 aktywne Algorithms items;
- 1672 root choice items;
- 20 root ordering items;
- 0 root complexity items;
- zero `staticMicroChecks`;
- zero `correctOptionId`;
- zero `correctAnswerId`;
- zero starego `responseSpec`;
- jeden Algorithms content version owner;
- jeden Algorithms validator;
- jeden Algorithms manifest;
- brak translatora i runtime expansion.

59 niekonwertowalnych complexity checks usunięto, ponieważ nie miały authored selectable values ani accepted aliases.

---

# 4. Bieżący stan repozytorium

## 4.1. Shared domain nadal miesza rodziny

Nadal istnieją:

- globalny `TrainingItem`;
- globalny `TrainingItemType`;
- family-specific responses w shared domain;
- konkurencyjne result models;
- `confidence`;
- `low_confidence`;
- zamknięta unia dwóch track IDs;
- stara mode taxonomy.

## 4.2. AlgorithmsSessionScreen nadal jest god screenem

Ekran posiada selection, session creation, persistence, attempt creation, review mutation, completion, summary, feedback mapping, timer, navigation i rendering.

## 4.3. Cloud Practice nadal ma osobny runtime

`PracticeSessionScreen` wybiera cały ekran po `trackId`. Cloud Practice posiada własny model, service, scoring, review, historię i write-through.

## 4.4. Exam nadal jest osobnym systemem

Nadal istnieją `ExamScreen`, `examService`, `ActiveExamSession`, `AttemptSummary`, globalny czas egzaminu, osobny persistence path i osobny result route.

## 4.5. Storage nadal ma dwa systemy

Nadal istnieją równolegle:

- `localStorage.ts`;
- stare keys i codecs;
- repositories;
- AsyncStorage;
- Cloud-specific storage APIs.

## 4.6. Content jest nadal częścią aplikacji

Algorithms content jest statycznie importowany. Certification nadal używa starego `Question`. Walidacja jest silnie związana z folderami, importami i manifestami mobile repo.

---

# 5. Stan docelowy

```txt
application composition
├── track registry
│   ├── Algorithms track instance
│   │   └── AlgorithmsFamilyRuntime
│   └── Certification track instances
│       └── CertificationFamilyRuntime
├── shared learning kernel
│   ├── session lifecycle
│   ├── immutable attempt envelope
│   ├── canonical result envelope
│   ├── review commands
│   ├── evidence contracts
│   └── repository interfaces
├── application layer
│   ├── start
│   ├── submit
│   ├── advance
│   ├── complete
│   ├── abandon
│   ├── resume
│   ├── review
│   └── dashboard/progress queries
├── content boundary
│   ├── content contracts
│   ├── ContentSource
│   ├── published bank manifest
│   ├── boundary validation
│   ├── cache
│   └── explicit content errors
├── shared session shell
└── infrastructure
    ├── MMKV client
    ├── canonical repositories
    └── content cache
```

---

# 6. Content architecture principles

## 6.1. Cztery odpowiedzialności

### Content contract

Definiuje schema itemu, odpowiedzi, feedbacku, taxonomy refs, content version i manifest.

### Content source

Może być bundled, backendowy, fixture albo cache. Runtime nie może zależeć od konkretnego źródła.

### Publication validation

Odpowiada za pełną walidację banku, IDs, taxonomy refs, editorial checks, source metadata i release manifest. Docelowo może należeć do backendu lub osobnego pipeline’u.

### Runtime content resolution

Aplikacja pobiera published bank, waliduje payload na granicy, cache’uje go, rozwiązuje item po ID i pokazuje explicit error.

## 6.2. Czego nie rozwijamy teraz

Nie rozbudowujemy dalej:

- folder-aware validatorów w aplikacji;
- editorial QA całego banku w mobile repo;
- testów każdej treści jako części runtime recovery;
- masowej poprawy 1692 Algorithms items;
- masowej poprawy Certification banku.

## 6.3. Co aplikacja zawsze waliduje

- unknown item type;
- unsupported response contract;
- brak item ID;
- brak correct answer;
- duplicate option IDs;
- invalid ordering;
- invalid complexity contract;
- content version mismatch;
- track mismatch;
- missing item;
- unsupported payload.

---

# 7. Bramy

## G-01 — UI designs

Wymagane przed etapami UI: session shell, ordering, complexity, błędy persistence, resume, shortened review, summaries, exam navigator, exam review i empty review.

Codex nie projektuje brakujących ekranów.

## G-02 — Algorithms Interview Simulation profile

Wymaga decyzji o duration, item count, navigation, answer changes, timer, completion i diagnostics.

## G-03 — Certification mode matrix

Każdy tryb musi mieć exact lengths, feedback timing, timer, selection, review source, reinsert, entry point i summary action.

## G-04 — GCP ACE ExamExperienceProfile

Wymaga aktualnego oficjalnego źródła i potwierdzenia duration, question count, navigation, answer changes, flagging, navigator, sections i timeout.

## G-05 — Corrupt MMKV records

Musi zostać zamknięte przed wydaniem. Nie może heurystycznie zmieniać response, score, review, dueAt ani evidence.

## G-06 — Content delivery decision

Przed finalnym content cutover należy wybrać bundled, backend albo hybrid.

Nie blokuje kernelu ani family runtimes.

---

# 8. Nowa kolejność etapów

```txt
0 / 0E / 0F
→ 1 Canonical kernel
→ 2 MMKV and journal
→ 3 Algorithms runtime
→ 4 Certification runtime
→ 5 Shared shell
→ 6 Cross-family surfaces
→ 7 Content boundary
→ 8 Content delivery implementation
→ 9A Algorithms content remediation
→ 9B Certification content remediation
→ 10 Final hardening
```

---

# Etap 1 — Canonical learning kernel

## Cel

Usunąć globalny model concrete itemów i wyników. Utworzyć mały, family-agnostic kernel.

## Kernel posiada

- `TrackId`;
- `TrackFamilyId`;
- `ContentItemRef`;
- `TrainingSession`;
- `TrainingAttempt`;
- `AttemptResult`;
- `ReviewQueueEntry`;
- `LearningEvidence`;
- lifecycle commands;
- repository interfaces.

## Kernel nie posiada

- concrete item union;
- concrete response union;
- taxonomy rodzin;
- scoring rules;
- renderer types;
- mode semantics;
- exam behavior.

## Canonical result

```ts
type AttemptResult = {
  kind: "correct" | "partial" | "incorrect";
  earnedPoints: number;
  maxPoints: number;
  components?: readonly AttemptResultComponent[];
};
```

## Wymagane zmiany

- family response jest opaque dla kernelu;
- track resolved przez registry;
- review bez confidence;
- review przechowuje source item i taxonomy evidence;
- session przechowuje requested/actual length, item order, option order i foreground time;
- unknown IDs kończą się explicit error.

## Wymagane usunięcia

- globalny `TrainingItem`;
- globalny `TrainingItemType`;
- globalny concrete response union;
- `TrainingAttemptConfidence`;
- `low_confidence`;
- równoległe result models;
- unsupported future interaction types;
- compatibility re-exports;
- default track fallback.

## Content w tym etapie

Nie wykonujemy pełnego content cutoveru. Wymagamy family-owned item boundary i stabilnego `ContentItemRef`.

## Testy

- import boundaries;
- registry resolution;
- unknown IDs;
- result contract;
- review reasons;
- session invariants;
- family isolation;
- brak usuniętych symboli.

## Kryteria zakończenia

- kernel nie zna concrete items;
- jeden result, session, attempt i review contract;
- brak confidence;
- brak translatora.

---

# Etap 2 — MMKV-only persistence i durable journal

## Cel

Usunąć stary storage i wprowadzić jeden MMKV subsystem.

## Zakres

- MMKV client;
- canonical keys;
- session, attempt, review, active-session, settings i journal repositories;
- storage errors;
- recovery po force-close;
- reset starego storage.

## Wymagane zmiany

- session przed pierwszym itemem;
- item i option order;
- foreground time;
- config snapshot;
- content version;
- immutable attempts;
- review evidence;
- jedna aktywna sesja;
- brak unsubmitted selection persistence.

## Durable submit

```txt
validate and freeze
→ build deterministic outcome
→ persist journal
→ feedback or transition
→ materialize
→ verify
→ clear journal
```

## Wymagane usunięcia

- AsyncStorage;
- `localStorage.ts`;
- stare keys i codecs;
- read fallbacks;
- stare persistence models;
- Cloud write-through;
- migration runners;
- translators.

## Testy

- repository CRUD;
- one active session;
- no unsubmitted response;
- item/option order;
- foreground timer;
- journal-before-feedback;
- idempotency;
- force-close recovery;
- failed writes;
- zero AsyncStorage imports.

## Kryteria zakończenia

- tylko infrastructure zna MMKV;
- jeden client i repository set;
- brak starego storage;
- failed write blokuje postęp.

---

# Etap 3 — AlgorithmsFamilyRuntime

## Cel

Przenieść Algorithms do jednego family runtime i usunąć god screen.

## Runtime posiada

- modes;
- selection;
- response completeness;
- scoring;
- review;
- reinsert;
- summary;
- evidence;
- recommendations;
- handlers.

## Handlers

- choice;
- ordering;
- complexity.

## Scoring

- Multiple choice: exact full set = correct; właściwy podzbiór bez wrong option = partial; dowolna wrong option = incorrect i zero.
- Ordering: adjacent relations.
- Complexity: one point per declared dimension; content-defined values i aliases.

## Review i reinsert

- approved triggers;
- source item + taxonomy evidence;
- compatible fill only;
- shorten when needed;
- reinsert tylko Guided Practice i Weak Area Review;
- maximum once;
- minimum dwa inne submitted items;
- skip if impossible;
- same-session correction nie zamyka persistent review.

## Wymagane usunięcia

- orchestration z `AlgorithmsSessionScreen`;
- repository calls w screenie;
- writes i review mutation w screenie;
- hardcoded complexity choices;
- old modes;
- duplicate scoring;
- catch-and-continue.

## Content w tym etapie

Naprawiamy tylko itemy łamiące runtime, scoring albo renderer. Nie robimy pełnej poprawy jakości.

## Testy

- pure runtime;
- start/submit/advance/complete;
- all modes;
- shortened review;
- reinsert 0/1/2;
- scoring;
- journal failure;
- resume/abandon;
- timer;
- no old orchestration.

## Kryteria zakończenia

- lifecycle testowalny bez Reacta;
- screen jest presentation;
- jeden runtime;
- brak duplicate scoring i feedback fallbacku.

G-02 musi być zamknięte przed pełnym `Interview Simulation`.

---

# Etap 4 — CertificationFamilyRuntime i GCP ACE

## Cel

Zastąpić Cloud Practice i Exam jednym Certification runtime. GCP ACE staje się track instance.

## Runtime posiada

- mode matrix;
- competency/topic selection;
- practice scoring;
- review;
- ExamExperienceProfile;
- exam selection;
- deadline;
- navigation;
- answer changes;
- flagging;
- sections;
- timeout;
- result i answer review.

## Wymagane usunięcia

- `CloudPracticeSessionScreen`;
- branch po `trackId`;
- `practiceService`;
- `examService`;
- `ExamScreen` jako runner;
- stare exam/practice records;
- global exam duration;
- Cloud write-through;
- old result route;
- bridges.

## Content w tym etapie

Certification bank musi mieć stabilne IDs, jednoznaczne odpowiedzi i boundary validation. Nie musi jeszcze przejść pełnej redakcji.

## Testy

- wszystkie modes;
- practice scoring;
- review;
- competency selection;
- profile validation;
- navigation;
- answer changes;
- flagging;
- deadline/resume/timeout;
- final journal;
- no official pass/fail;
- no old Cloud imports.

## Kryteria zakończenia

- GCP ACE jest track instance;
- jedna rodzina obsługuje practice i exam;
- brak Cloud-specific runtime i osobnego exam storage.

G-03 i G-04 muszą być zamknięte.

---

# Etap 5 — Shared session shell

## Cel

Utworzyć jeden shell dla obu rodzin.

## Shell posiada

- top bar;
- timer;
- counter;
- progress;
- scroll;
- bottom action;
- preparation;
- unanswered/answered;
- persistence failures;
- exit/resume;
- summary transition.

## Family renderer posiada

- prompt;
- response controls;
- completeness;
- answer colors;
- Reason;
- Details;
- distractor composition;
- accessibility.

## Canonical UI

- timer po lewej;
- `1 OF 20` po prawej;
- brak Patternly, `Item` i close buttonu;
- correctness przez kolor;
- brak visible correctness icon/text przy options;
- Reason widoczne;
- Details collapsed;
- persistent bottom action;
- Details bez side effects.

## Wymagane usunięcia

- duplicate top bars, timers, counters, bottom panels i feedback cards;
- full-screen branching;
- shell scoring;
- shell repository access.

## Testy

- shell family-independent;
- renderer registry;
- all states;
- timer variants;
- Details no side effect;
- accessibility;
- screenshot comparison.

## Kryteria zakończenia

- jeden shell;
- family semantics poza shellem;
- brak starych pełnych session screens.

G-01 musi być zamknięte.

---

# Etap 6 — Home, Practice, Progress, Review i navigation

## Cel

Przepiąć powierzchnie przekrojowe na canonical queries.

## Queries

- dashboard;
- active session;
- due review;
- family progress;
- topic/competency detail;
- recommendation;
- session modes.

## Evidence

Rozdzielić `evidenceVolume`, `learningStageEvidence` i `performanceSignals`.

## Recommendation

- deterministic;
- family-specific;
- explained;
- due review i repeated mistakes mają priorytet;
- manual choice wygrywa;
- brak AI copy.

## Navigation

- explicit route params;
- canonical mode IDs;
- explicit review source;
- unknown ID error;
- Continue / Abandon and start new;
- brak silent fallback.

## Wymagane usunięcia

- duplicate history i progress;
- old route modes;
- Due Review i Session Misses jako modes;
- default topic i track;
- storage calls w screens;
- confidence, readiness, retention i mastery;
- old Cloud queries.

## Kryteria zakończenia

- feature screens nie interpretują taxonomy;
- modes mają jedno źródło;
- review używa canonical queue;
- progress używa canonical evidence;
- unknown IDs fail explicitly.

---

# Etap 7 — Content boundary extraction

## Cel

Oddzielić runtime od sposobu przechowywania contentu.

## Wprowadzić

```ts
interface ContentSource {
  getManifest(trackId: string): Promise<PublishedContentManifest>;
  getBank(trackId: string, version: string): Promise<PublishedContentBank>;
}
```

Nazwy mogą się różnić.

## Wprowadzić także

- `PublishedContentManifest`;
- `PublishedContentBank`;
- family item contracts;
- boundary validator;
- content resolver;
- content cache contract;
- explicit content errors.

## Runtime nie może

- importować konkretnych folderów contentu;
- wiedzieć, czy content jest bundled czy z backendu;
- używać fallback itemu;
- wybierać innej wersji po błędzie;
- naprawiać payloadu heurystycznie.

## Bundled source

Obecny content może być podłączony jako `BundledContentSource`. To adapter źródła, nie część domain.

## Walidacja w aplikacji

Zachować tylko boundary validation: schema, IDs, response contract, version, track match i manifest consistency.

## Kryteria zakończenia

- runtime zależy od `ContentSource`;
- bundled content jest jednym adapterem;
- brak source-specific logic w family runtime;
- brak fallback contentu.

---

# Etap 8 — Content delivery decision i implementacja

## Cel

Wybrać docelowy model: bundled, backend albo hybrid.

## Do rozstrzygnięcia

- source of truth;
- publication process;
- versioning;
- rollback;
- cache;
- offline;
- content expiration;
- integrity;
- atomic activation;
- old version removal;
- admin/editor workflow;
- source metadata;
- privacy i analytics boundary.

## Backend

Docelowy podział:

```txt
shared contracts
backend content service
publication validation
published bank storage
mobile ContentSource
local cache
```

Aplikacja nie kompiluje całego banku i nie wykonuje pełnego editorial QA.

## Bundled

Nadal używa `ContentSource`, generated published artifact i oddziela authoring od runtime banku.

## Kryteria zakończenia

- jedna architektura;
- jeden source of truth;
- jeden publication path;
- jeden runtime source;
- brak równoległego bundled/backend pathu.

G-06 musi być zamknięte.

---

# Etap 9A — Algorithms content quality remediation

## Cel

Poprawić dydaktyczną jakość Algorithms banku po ustabilizowaniu architektury contentu.

## Metoda

- jeden batch = jeden mental unit;
- audyt bez zmian;
- exact replacements;
- implementacja;
- human editorial review;
- publication validation;
- release banku.

## Standard

- concise Reason;
- complete Details;
- mechanism i application;
- correction selected error;
- transfer;
- distractor explanations;
- constraints, preconditions, invariant, state i complexity;
- brak false heuristics i answer-only feedbacku.

## Nie wolno

- masowo przepisywać pytań przez Codex;
- generować feedbacku z enumów;
- dodawać quality flags;
- ukrywać słabych itemów;
- zachowywać duplikatów dla countu.

## Kryteria zakończenia

- każdy aktywny mental unit zrecenzowany;
- każda zła opcja ma explanation;
- brak shallow feedback i false heuristics;
- human sign-off ukończony.

---

# Etap 9B — Certification content quality remediation

## Cel

Poprawić Certification bank po ustabilizowaniu architektury contentu.

## Batchowanie

- exam domain;
- competency;
- topic;
- service/configuration decision boundary.

## Standard

Każdy item wyjaśnia scenario requirement, relevant capability, limitation, expected decision, błędną alternatywę, trade-off, transfer boundary i source stability.

## Usunąć

- product-name recall;
- vague marketing claims;
- exam-dump wording;
- answer-only explanation;
- unversioned volatile facts;
- duplicates.

## Kryteria zakończenia

- production-valid feedback;
- distractor coverage;
- content uczy decyzji;
- źródła stabilne albo versioned;
- human sign-off ukończony.

---

# Etap 10 — Final deletion, enforcement i hardening

## Cel

Usunąć każdy zastąpiony path i zablokować regresję.

## Search i usunięcie

- AsyncStorage;
- `localStorage`;
- old keys;
- stare models i services;
- old session screens;
- Cloud write-through;
- old modes;
- default/fallback branches;
- direct authored-content imports w runtime;
- stare validators;
- stale tests;
- dead exports.

## Enforcement

- import boundaries;
- cycle detection;
- dead export checks;
- route checks;
- package scan;
- schema checks;
- runtime contract tests;
- content source tests;
- screenshot QA;
- manual QA;
- docs-to-code review.

## Globalne kryteria zakończenia

- jeden kernel, session, attempt, result, review i evidence model;
- jeden MMKV subsystem;
- jeden content source i publication path;
- brak AsyncStorage i compatibility adapters;
- brak globalnego concrete item union;
- Algorithms i Certification mają po jednym runtime;
- GCP ACE jest track instance;
- jeden shared shell;
- screen nie posiada scoringu, review ani persistence;
- runtime nie importuje authored content folders;
- unknown IDs i missing content fail explicitly;
- CI blokuje regresję;
- dokumentacja odpowiada kodowi.

Pełna content remediation jest wymagana do uznania produktu za content-complete, ale nie blokuje wcześniejszego recovery architektury.

---

# 9. Dlaczego ta kolejność jest właściwa

1. Etapy 0/0E/0F dały zielony baseline i jeden Algorithms response schema.
2. Kernel nie wymaga pełnego editorial review banku.
3. Persistence nie zależy od jakości Reason i Details.
4. Family runtimes potrzebują stabilnych response contracts, nie finalnej jakości wszystkich explanations.
5. Shared shell powstaje nad działającymi runtimes.
6. Cross-family queries korzystają z finalnych modeli.
7. Content boundary trzeba oddzielić przed decyzją bundled/backend.
8. Dopiero potem warto inwestować w pełną poprawę tysięcy itemów.
9. Content remediation po ustaleniu source of truth nie będzie pracą do wyrzucenia.
10. Final hardening usuwa stare paths i blokuje ich powrót.

---

# 10. Format promptów dla Codexa

Każdy prompt powinien zawierać:

1. Objective
2. Why this stage exists
3. Current repository facts
4. Canonical source documents
5. Exact files in scope
6. Exact files out of scope
7. Final owner
8. Domain contracts
9. Content boundary
10. UI contract
11. State transitions
12. Scoring
13. Review
14. Reinsert
15. Persistence
16. Error behavior
17. Required deletions
18. Positive tests
19. Negative tests
20. Acceptance criteria
21. Forbidden interpretations
22. Final report

Każdy prompt musi zawierać:

> If an existing model, record, flow, or module cannot be moved into the final structure without preserving obsolete semantics, delete it. Do not create a fallback, translator, compatibility adapter, dual path, or backward-compatible reader. A runtime failure is evidence of unfinished recovery and must remain explicit until the responsible path is fixed or removed.

Prompt nie jest gotowy, jeżeli Codex nadal musi zdecydować ownera, finalny model, usuwany path, scoring, review, persistence, error behavior albo testy zakończenia.

---

# 11. Warunek rozpoczęcia kolejnego etapu

Przed każdym promptem:

1. sprawdzić aktualny `main`;
2. potwierdzić poprzedni etap;
3. sprawdzić testy;
4. zaktualizować removal inventory;
5. sprawdzić gates;
6. przygotować prompt na podstawie aktualnego repo;
7. nie ufać wyłącznie raportowi Codexa.

Każdy etap jest osobnym zadaniem. Nie generować późniejszych promptów z góry.

Następny etap:

```txt
Etap 1 — Canonical learning kernel
```

# 10 — Roadmap

## Cel dokumentu

Roadmapa porządkuje kolejność prac nad aplikacją treningową i chroni MVP przed rozrostem.

Po zmianie kierunku produkt nie jest już pojedynczą aplikacją do jednego egzaminu. Roadmapa musi prowadzić do fundamentu wielotrackowego, który obsłuży co najmniej dwa pierwsze tracki:

- `cloud-certification` — przygotowanie do certyfikacji technicznych, pierwszy zakres: Google Cloud / ACE-style,
- `algorithms` — LeetCode-style / algorithmic problem solving, bez kopiowania LeetCode i bez pełnego online judge w MVP.

Roadmapa nie zakłada ciężkiego plugin systemu, backendu ani platformy kursowej. Celem jest local-first/offline-first aplikacja treningowa z lekkim modelem:

```txt
app → track → session mode → training item → attempt → feedback/result → progress
```

## Zasada prowadząca

Najpierw budujemy wspólny fundament:

- track registry,
- generyczny model training itemów,
- wspólny session engine,
- lokalny zapis attempts/progress/review,
- neutralny design system,
- podstawową nawigację wielotrackową.

Dopiero potem dokładamy konkretne tracki i tryby. Nie wolno zbudować najpierw aplikacji `GCP-only`, a później próbować „dokleić” Algorithms, bo to zabetonuje model danych, UI i storage wokół pytań egzaminacyjnych.

## Phase 0 — Documentation and Foundations

Cel:

- zamknąć fundament dokumentacji,
- ustalić wielotrackowy model produktu,
- ustalić architekturę bez overengineeringu,
- ustalić MVP dla pierwszych tracków,
- ustalić styl wizualny i branding neutralny względem GCP/LeetCode,
- przygotować modele danych,
- przygotować strukturę repo.

Deliverables:

- `00-overview.md`,
- `01-product-definition.md`,
- `02-architecture.md`,
- `03-navigation-and-flows.md`,
- `04-data-model.md`,
- `05-design-system.md`,
- `06-branding-and-style-direction.md`,
- `07-content-guidelines.md`,
- `08-storage-and-offline.md`,
- `09-security-and-privacy.md`,
- `10-roadmap.md`,
- ADR-y dla decyzji architektonicznych.

Status: in progress.

## Phase 1 — App Shell, Navigation and Design System

Cel:

- zbudować szkielet aplikacji,
- wdrożyć neutralny theme,
- wdrożyć komponenty bazowe,
- wdrożyć nawigację pod wiele tracków.

Zakres:

- Expo app shell,
- TypeScript strict setup,
- root navigation,
- tabs/stacks,
- `Home`,
- `Practice`,
- `Progress`,
- `Settings`,
- track selection flow,
- active track switcher,
- shared layout components,
- theme tokens,
- podstawowe komponenty:
  - `Screen`,
  - `Text`,
  - `Button`,
  - `Card`,
  - `Badge`,
  - `ProgressBar`,
  - `TrackCard`,
  - `SessionModeCard`,
  - `TrainingItemCard`,
  - `FeedbackPanel`.

Po tej fazie aplikacja może jeszcze nie mieć pełnych sesji, ale powinna mieć gotowy szkielet UX dla wyboru tracka i trybu.

## Phase 2 — Core Domain Model and Local Storage

Cel:

- wdrożyć wspólny model domenowy przed tworzeniem konkretnych sesji.

Zakres:

- `Track`,
- `TrackTaxonomy`,
- `SessionMode`,
- `TrainingItem`,
- `TrainingAttempt`,
- `TrainingSession`,
- `SessionResult`,
- `UserItemState`,
- `ReviewQueueItem`,
- `UserProgress`,
- local storage namespace,
- storage migrations,
- content metadata per track,
- basic repositories:
  - `trackRepository`,
  - `contentRepository`,
  - `sessionRepository`,
  - `attemptRepository`,
  - `progressRepository`,
  - `reviewRepository`.

Nie robić jeszcze:

- pełnego exam mode,
- backendu,
- synchronizacji cloud,
- admin panelu,
- edytora contentu w UI.

## Phase 3 — Static Content Packs MVP

Cel:

- przygotować minimalne lokalne paczki contentu dla pierwszych tracków.

Zakres wspólny:

- format `contentPack`,
- `contentVersion`,
- walidacja danych,
- taxonomy refs,
- content loader,
- fallback dla braku lub uszkodzenia danych,
- testy walidacji contentu.

Zakres `cloud-certification`:

- przykładowe `single_choice_question`,
- przykładowe `multiple_choice_question`,
- domeny / obszary tematyczne,
- explanation,
- source notes bez kopiowania oficjalnych pytań.

Zakres `algorithms`:

- przykładowe `pattern_identification`,
- przykładowe `strategy_choice`,
- przykładowe `complexity_analysis`,
- przykładowe `solution_comparison`,
- pattern taxonomy,
- data structure taxonomy,
- common mistake taxonomy.

Decyzja MVP:

Algorithms content nie jest pełną bazą zadań ani kopią LeetCode. Ma testować rozpoznanie wzorca, wybór strategii, złożoność i typowe błędy.

## Phase 4 — Practice Session Engine MVP

Cel:

- zbudować pierwszy pełny loop nauki działający dla obu tracków.

Zakres wspólny:

- session setup,
- item selection,
- item rendering przez typ,
- attempt capture,
- submit,
- immediate feedback,
- explanation,
- next item,
- local save,
- session summary,
- update item state,
- update review queue,
- update progress.

Zakres `cloud-certification`:

- practice mode dla pytań jednokrotnego i wielokrotnego wyboru,
- explanation po odpowiedzi,
- correctness scoring,
- taxonomy progress.

Zakres `algorithms`:

- pattern drill,
- strategy practice,
- complexity check,
- feedback oparty o strategię, nie tylko `correct/incorrect`,
- mistake tagging.

Po tej fazie aplikacja powinna mieć realną wartość użytkową bez trybu egzaminacyjnego.

## Phase 5 — Review and Progress MVP

Cel:

- dodać realną wartość diagnostyczną i powtarzalność nauki.

Zakres wspólny:

- missed items,
- marked items,
- review queue,
- weak taxonomy areas,
- recent sessions,
- accuracy / completion,
- progress per track,
- global progress overview,
- reset learning data.

Zakres `cloud-certification`:

- weak certification domains,
- incorrect question review,
- exam-readiness style summary bez obietnicy zdania egzaminu.

Zakres `algorithms`:

- weak patterns,
- recurring mistake types,
- strategy selection accuracy,
- complexity analysis accuracy,
- review by pattern/data structure.

## Phase 6 — Cloud Certification Exam Simulation MVP

Cel:

- dodać tryb sprawdzianu dla tracka certyfikacyjnego.

Zakres:

- exam setup,
- timed/untimed variant jeśli proste do wdrożenia,
- session without immediate feedback,
- progress in session,
- submit exam,
- score summary,
- answer review,
- domain breakdown,
- save exam session locally.

Ograniczenie:

Exam mode nie jest globalnym centrum aplikacji. Dotyczy głównie `cloud-certification`. Algorithms może mieć później `Timed Challenge`, ale nie musi dziedziczyć modelu egzaminu.

## Phase 7 — Algorithms Timed Challenge / Advanced Practice

Cel:

- rozszerzyć track algorytmiczny bez budowania pełnego IDE.

Zakres:

- timed challenge dla itemów strategicznych,
- mixed pattern session,
- stricter complexity review,
- compare approaches,
- recurring mistake insight,
- optional freeform reasoning prompt,
- optional self-assessment.

Poza zakresem tej fazy:

- online judge,
- wykonanie kodu,
- konto LeetCode,
- scraping zadań,
- automatyczne pobieranie editoriali,
- pełny code editor.

## Phase 8 — Polish and Hardening

Cel:

- stabilizacja MVP przed publikacją / pokazaniem portfolio.

Zakres:

- edge cases,
- storage migration tests,
- corrupted content handling,
- empty states,
- error states,
- reset local data,
- accessibility basics,
- performance pass,
- test coverage for scoring/session/progress logic,
- visual consistency pass,
- disclaimer visibility,
- content integrity review.

## Phase 9 — Optional Enhancements After MVP

Po MVP można rozważyć:

- export/import local backup,
- spaced repetition,
- confidence rating,
- better readiness score,
- remote content updates,
- optional cloud sync,
- notifications,
- AI-generated explanations with review,
- AI-assisted mistake summaries,
- additional certification tracks,
- additional algorithm packs,
- richer onboarding,
- dark mode jeśli nie został wdrożony wcześniej,
- lightweight admin/content authoring tools.

## Priorytet implementacji

Kolejność bazowa:

```txt
1. App shell
2. Theme and shared components
3. Track registry
4. Navigation with track selection
5. Core domain model
6. Local storage foundation
7. Static content pack format
8. Cloud certification sample content
9. Algorithms sample content
10. Shared practice session engine
11. Cloud practice renderer/scoring
12. Algorithms practice renderer/scoring
13. Attempts persistence
14. Review queue
15. Progress dashboard
16. Cloud exam simulation
17. Algorithms timed/advanced practice
18. Settings/reset
19. Hardening and tests
```

## Czego nie robić przed MVP

Nie robić:

- Firebase Auth,
- Firestore,
- custom backend,
- płatności,
- rankingów,
- admin panelu,
- AI tutor,
- importera contentu w UI,
- powiadomień,
- social features,
- rozbudowanego onboarding flow,
- pełnego plugin systemu,
- online judge,
- code execution sandbox,
- konta LeetCode/GitHub,
- scrapera zadań,
- kopiowania oficjalnych pytań egzaminacyjnych,
- kopiowania zadań lub editoriali LeetCode.

## Kryterium zakończenia MVP

MVP można uznać za gotowe, jeżeli:

- użytkownik może wybrać aktywny track,
- aplikacja obsługuje co najmniej `cloud-certification` i `algorithms`,
- użytkownik może uruchomić practice session w każdym z pierwszych tracków,
- training itemy są renderowane przez wspólny session engine,
- odpowiedzi/próby są zapisywane lokalnie,
- błędy trafiają do review,
- progress pokazuje słabe obszary per track,
- cloud certification ma działający exam simulation,
- algorithms ma działający pattern/strategy practice,
- UI jest spójny i neutralny względem tracków,
- aplikacja działa offline,
- reset danych działa,
- podstawowe flow nie gubi stanu po zamknięciu aplikacji,
- content nie narusza praw platform certyfikacyjnych ani codingowych.

## Antywzorce roadmapy

Unikać:

- budowania najpierw pełnej aplikacji GCP i późniejszego „doklejania” Algorithms,
- traktowania `Question` jako jedynej jednostki contentu,
- traktowania `Exam Mode` jako głównej osi produktu,
- odkładania track registry na później,
- budowania backendu przed sprawdzeniem local-first MVP,
- budowania online judge przed potwierdzeniem wartości pattern/strategy practice,
- projektowania osobnego design systemu per track,
- dodawania AI przed stabilnym modelem contentu i review,
- mierzenia sukcesu wyłącznie wynikiem egzaminu.

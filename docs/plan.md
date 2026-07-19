---
title: Patternly — zweryfikowany stan repozytoriów i skorygowany plan wykonania
status: PROPOSED_EXECUTION_PLAN_UPDATE
audit_date: 2026-07-19
application_repository: lukaszkurczab/gcp-ace-trainer
application_branch: main
application_audited_sha: 82b0c92805814264ea45fb6403fd3e31046b1d0a
content_repository: lukaszkurczab/patternly-content
content_branch: master
content_audited_sha: b424faa6d8c7209acb51ac23af812d08c31842dc
---

# 1. Decyzja wykonawcza

Dotychczasowy plan jest częściowo nieaktualny. Repozytoria poszły dalej niż przewidywała poprzednia sekwencja:

- istnieje i jest przypięty rzeczywisty artifact Algorithms `algorithms-core-0002`;
- istnieje kompletna infrastruktura publikacyjna w `patternly-content`;
- canonical Algorithms Practice i Interview Simulation zostały podłączone do routingu;
- dodano shared Algorithms session shell, facades, timer coordinator, testy i część screenshot evidence.

Nie oznacza to jednak, że Stage 3 można zamknąć przez samo uzupełnienie screenshotów.

Aktualny `main` ma trzy blokujące problemy kontraktowe:

1. **timer Interview Simulation nie jest podłączony do lifecycle aplikacji i nie uruchamia automatycznej finalizacji przy wyczerpaniu czasu;**
2. **Practice nie rozróżnia błędu przed trwałym journalem od błędu po logicznym commitcie, przez co może ponownie otworzyć odpowiedź po trwałym zapisaniu komendy;**
3. **Algorithms timer facade ponownie uzyskał bezpośredni dostęp do konkretnych repository implementations poza composition root.**

Dlatego aktywnym następnym zadaniem nie powinno być samo `S3-ALGORITHMS-VISUAL-QA-01`. Najpierw trzeba zamknąć regresję runtime i ownership, następnie wprowadzić typed operation projections, dopiero później wykonać pełne visual QA.

# 2. Zakres i ograniczenia audytu

Audyt obejmował aktualne zdalne branche:

```txt
gcp-ace-trainer/main
82b0c92805814264ea45fb6403fd3e31046b1d0a

patternly-content/master
b424faa6d8c7209acb51ac23af812d08c31842dc
```

Sprawdzono między innymi:

- najnowsze commity i różnice względem poprzednich punktów kontrolnych;
- `docs/plan.md`;
- application lifecycle i composition root;
- Algorithms family runtime i UI facades;
- Practice i Interview Simulation screens;
- foreground timer;
- mutation journal call path;
- architecture guard;
- aktualny UX/UI audit config;
- pinned content lock i generated bundled artifact;
- content track config, activation, przykładowe source batches i approval records;
- GitHub workflow definitions.

Ograniczenie audytu:

- w tej sesji nie wykonano lokalnie `npm ci`, `npm run qa:static`, Maestro ani natywnych buildów;
- z GitHub nie uzyskano statusów check-runs dla bieżących HEAD-ów;
- zielone wyniki zapisane w commit reports i `docs/plan.md` są dowodem repozytoryjnym, ale nie zostały tutaj niezależnie ponownie uruchomione.

W konsekwencji poniżej rozróżniono:

- **potwierdzony stan kodu**;
- **raportowany wynik testu**;
- **brak niezależnego dowodu wykonania**.

# 3. Potwierdzony stan repozytoriów

## 3.1. Dokumentacja i poprzednie etapy

| Obszar | Stan po audycie | Uzasadnienie |
|---|---|---|
| Stage 0 — canonical documentation | `VERIFIED`, ale tabela statusów w `docs/plan.md` jest stara | Plan nadal pokazuje `NEEDS_CORRECTION`, mimo że sekcja Stage 0 jest `VERIFIED`. |
| Stage 1 — repository delta audit | `DONE` | Audit istnieje i kolejne zadania były wykonywane na jego podstawie. |
| Stage 2 — kernel/persistence | historycznie `VERIFIED`, aktualnie ma regresję G-A | Jeden MMKV owner i journal pozostają, ale timer facade importuje konkretne repositories. |
| Baseline w `docs/plan.md` | `STALE` | Nagłówek nadal wskazuje `ac412949…`, a aktualny `main` to `82b0c928…`. |
| Sekcja „Forbidden immediate work until Stages 0 and 1…” | `STALE` | Oba etapy są zamknięte; zapis nie może nadal sterować aktywną kolejnością. |

## 3.2. Algorithms content

Potwierdzono:

- track-scoped bundled-content consumer;
- pinned producer commit `b424faa6…`;
- `contentVersion = algorithms-core-0002`;
- `taxonomyVersion = algorithms-taxonomy-v2`;
- immutable generated artifact w aplikacji;
- approval coverage i activation manifest;
- deklaracje wszystkich Algorithms modes;
- fixed 40-item Interview Simulation;
- 45-minutowy foreground countdown w track configuration;
- application lock do dokładnego producer SHA.

Klasyfikacja:

```txt
Algorithms artifact preparation: VERIFIED
Algorithms technical availability: AVAILABLE
Algorithms production editorial readiness: PARTIAL / REQUIRES MANUAL AUDIT
```

Powód ostatniego rozróżnienia: przykładowe approval records używają pola:

```txt
reviewer = product-owner-authorized-codex-review
```

To nie jest samo w sobie dowód ludzkiego editorial sign-off wymaganego przez canonical content contract. Stage 6 musi jawnie rozstrzygnąć, czy istnieje rzeczywista ręczna recenzja, kto ją wykonał i które exact fingerprints obejmuje.

Codex nie może na późniejszym etapie „naprawić” tego przez samodzielne zatwierdzanie pytań.

## 3.3. Algorithms runtime i UI

Potwierdzono:

- jeden aktualny Practice runner;
- jeden aktualny Interview Simulation runner;
- usunięty stary blocking screen;
- canonical routes w `RootNavigator`;
- shared `SessionShell`;
- Practice choice/ordering/complexity controls;
- simulation navigator i draft save;
- manual finish, leave, abandon i część finalization UI;
- partial Maestro evidence z realnego artifactu;
- approved design packet P-01…P-15 i S-01…S-29.

Klasyfikacja:

```txt
Algorithms route cutover: IMPLEMENTED
Algorithms runtime completeness: NEEDS_CORRECTION
Algorithms G-D: NEEDS_CORRECTION
Stage 3: NEEDS_CORRECTION
```

# 4. Najważniejsze odchylenia wykryte w aktualnym kodzie

## F-01 — foreground timer nie działa jako kompletny runtime

**Severity:** Critical  
**Gate:** G-P, G-L, G-D, G-Q

`AlgorithmsSimulationTimerFacade` ma poprawne primitives:

- initialize;
- restore;
- enter foreground;
- leave foreground;
- periodic checkpoint;
- projection;
- checkpoint przed draft save i finalization.

Natomiast `AlgorithmsInterviewSimulationScreen`:

- nie wywołuje `enterAlgorithmsSimulationForeground`;
- nie wywołuje `leaveAlgorithmsSimulationForeground`;
- nie reaguje na React Native `AppState`;
- nie odświeża projection timera podczas aktywnej pracy;
- nie wywołuje expiry checkpoint;
- nie ma ścieżki `remainingMs === 0 → exactly one automatic finalization`.

Skutek:

- wyświetlony countdown aktualizuje się tylko przy ponownym pobraniu projection, np. po save/navigation;
- active foreground segment może nie zostać uruchomiony;
- timer może pozostać statyczny;
- automatic timeout contract nie jest wykonany;
- screenshot expiry/frozen nie powinien być uznany za dowód runtime.

## F-02 — regresja ownership: timer facade importuje concrete repositories

**Severity:** High  
**Gate:** G-A, G-P

`src/application/algorithms/AlgorithmsSimulationTimerFacade.ts` importuje bezpośrednio:

```txt
getActiveForegroundTimer
saveActiveForegroundTimer
```

z `src/storage/repositories`.

To omija composition root. Repozytoria powinny być wstrzyknięte jako porty w:

```txt
src/application/bootstrap/trainingLifecycleComposition.ts
```

Obecny `checkRecoveryBaseline.mjs` nie wykrywa tego naruszenia, ponieważ sprawdza głównie feature presentation i MMKV import boundary, a nie bezpośrednie repository bindings w family-specific application facade.

## F-03 — Practice może ponownie otworzyć odpowiedź po trwałym journalu

**Severity:** Critical  
**Gate:** G-P, G-D, G-Q

Rzeczywisty commit path:

```txt
persist journal
→ materialize
→ verify
→ clear journal
```

jest wykonywany wewnątrz jednego `commitMutation()`.

`submitPracticeResponse()` zwraca tylko sukces albo ogólny `persistence_failure`.

`PracticeSessionScreen.submit()` dla każdego błędu:

- wraca do `unanswered`;
- zachowuje edytowalny local response;
- pokazuje, że odpowiedź nie została zapisana.

To jest poprawne wyłącznie wtedy, gdy journal **nie stał się trwały**.

Jeżeli błąd nastąpił po durable journal:

- odpowiedź jest logicznie committed;
- nie wolno jej edytować;
- nie wolno jej wysyłać ponownie;
- UI powinno wejść w `commit_pending.practice` lub recovery-required;
- feedback może pozostać dostępny, jeśli deterministic outcome jest już logicznie committed.

Obecny interfejs use case nie pozwala UI rozróżnić tych faz.

## F-04 — error states są klasyfikowane przez analizę tekstu

**Severity:** High  
**Gate:** G-C, G-D, G-Q

Simulation route klasyfikuje błędy na podstawie substringów:

```txt
"draft"
"version"
"fingerprint"
"40"
"pool"
"content"
```

Finalization failures są spłaszczone do jednego stringa.

To nie zapewnia kanonicznych, odrębnych stanów:

- stale draft revision;
- draft save failure;
- timer recovery failure;
- finalization journal failure;
- finalization materialization failure;
- finalization verification failure;
- missing draft;
- content-version mismatch;
- corrupt canonical state.

UI powinno renderować typed application projection, a nie dedukować stan z treści komunikatu.

## F-05 — UI lokalnie składa operation state zamiast renderować pełną application projection

**Severity:** High  
**Gate:** G-A, G-D

Practice i Simulation screens utrzymują lokalne:

- `phase`;
- `operation`;
- `failure`;
- `finalizationFailure`;
- `overlay`;
- logikę przejść pomiędzy nimi.

Ephemeral response selection może pozostać w UI. Natomiast trwałe fazy operacji, commit/recovery, freeze i finalization powinny pochodzić z application boundary.

Obecna konstrukcja utrudnia:

- crash recovery;
- poprawne odtworzenie stanu po restarcie;
- niezależne testowanie bez React;
- wierne renderowanie P-01…P-15 i S-01…S-29.

## F-06 — projection ponownie wykonuje scoring Practice

**Severity:** High  
**Gate:** G-A, G-L

`getAlgorithmsPracticeProjection()`:

- ładuje attempt;
- ponownie wywołuje `scoreAlgorithmQuestion`;
- ponownie komponuje authored feedback.

To tworzy drugi semantyczny path obok family runtime i nie potrafi wyświetlić feedbacku z durable journal przed pełną materializacją attemptu.

Projection powinno konsumować deterministic committed outcome albo family-owned feedback projection. Nie powinno ponownie podejmować decyzji scoringowej.

## F-07 — timer presentation i accessibility label są niespójne

**Severity:** Medium  
**Gate:** G-D

`SessionShell` zawsze buduje accessibility label:

```txt
Active time remaining ${timerLabel}
```

Practice przekazuje już pełny tekst:

```txt
Active time 00:00
```

co może dać semantykę w rodzaju:

```txt
Active time remaining Active time 00:00
```

Simulation przekazuje tylko `MM:SS`, mimo że visual contract oczekuje jawnego `Active time remaining`.

Potrzebny jest typowany model:

```ts
{
  visualText: string;
  accessibilityLabel: string;
  kind: "elapsed_foreground" | "remaining_foreground" | "absolute_deadline";
}
```

## F-08 — IDs i czas powstają poza kontrolowanymi portami

**Severity:** Medium  
**Gate:** G-Q

`algorithmsSessionFacade` używa:

- `Date.now()` do session ID;
- globalnego mutable sequence;
- `new Date().toISOString()` podczas draft mutation.

Testing contract wymaga kontrolowanych clocks i ID generation. Te zależności powinny wejść przez application composition.

## F-09 — aktywny UX/UI audit config jest historyczny i sprzeczny z aktualnym designem

**Severity:** High  
**Gate:** G-D, G-Q

`npm run audit:ux-ui:report` uruchamia wyłącznie walidator struktury konfiguracji.

Aktywna konfiguracja nadal oczekuje między innymi:

- `Close practice session`;
- `ITEM 1 OF 10`;
- Cloud Certification jako primary task;
- `Correct answer|Needs review`;
- nagłówka `Explanation`.

Te elementy są sprzeczne z approved Algorithms packet.

Wniosek:

```txt
audit:ux-ui:report PASS
```

oznacza obecnie tylko:

```txt
stara konfiguracja ma poprawny JSON i wskazuje istniejące pliki
```

Nie oznacza zgodności UI z canonical design.

## F-10 — plan repozytorium raportuje nieaktualny stan

**Severity:** Medium  
**Gate:** execution control

Do poprawy:

- baseline SHA;
- Stage 0 status;
- Algorithms UI status;
- Product surfaces status;
- aktywny next task;
- static QA count;
- historyczna sekcja „until Stages 0 and 1 are verified”.

## F-11 — brak niezależnego bieżącego CI evidence

**Severity:** Medium  
**Gate:** G-Q

Workflow `qa.yml` istnieje i zawiera:

- recovery QA;
- cross-repository Algorithms contract.

Nie uzyskano jednak statusów check-runs dla aktualnego app HEAD podczas tego audytu.

Plan nie może uznać najnowszego `main` za niezależnie zweryfikowany wyłącznie na podstawie narracji commita.

# 5. Skorygowana macierz etapów

| Etap / capability | Poprawna klasyfikacja teraz | Następna decyzja |
|---|---|---|
| Stage 0 — canonical docs | `VERIFIED` | Tylko popraw status i baseline planu. |
| Stage 1 — delta audit | `DONE` | Zachowaj jako historyczne evidence. |
| Stage 2 — kernel/persistence | `VERIFIED_WITH_REGRESSION` | Napraw F-02 przed zamknięciem Stage 3. |
| Algorithms content consumer | `VERIFIED` | Bez zmian kontraktu. |
| Algorithms artifact `core-0002` | `TECHNICALLY_AVAILABLE` | Nie myl z finalnym human editorial gate. |
| Algorithms mode selection/scoring | `PARTIAL / IMPLEMENTED` | Zweryfikuj po typed operation cutover. |
| Algorithms timer/runtime | `NEEDS_CORRECTION` | F-01 jest blockerem. |
| Algorithms Practice durability | `NEEDS_CORRECTION` | F-03 jest blockerem. |
| Algorithms UI route cutover | `IMPLEMENTED` | Nie usuwać; poprawić state ownership. |
| Algorithms visual QA | `PARTIAL` | Najpierw runtime, później harness i capture. |
| G-D Stage 3 | `NEEDS_CORRECTION` | Nie zamykać screenshotami obecnego błędnego runtime. |
| Stage 3 | `NEEDS_CORRECTION` | Aktywny pakiet korekcyjny poniżej. |
| Stage 4 Certification | `BLOCKED` | Nie rozpoczynać implementacji przed Stage 3 closure. |
| Stage 5 product surfaces | `NOT_ACTIVE / CURRENTLY_PARTIAL` | Re-audit po Stage 4. |
| Stage 6 production content | `PARTIAL` | Wymaga rzeczywistego human editorial audit. |
| Stage 7 release | `NOT_STARTED` | Po Stage 6. |

# 6. Zasady obowiązujące od tego momentu

## 6.1. Git

Dla aplikacji:

```txt
repo: lukaszkurczab/gcp-ace-trainer
branch: main
```

Dla contentu:

```txt
repo: lukaszkurczab/patternly-content
branch: master
```

Każdy task:

```bash
git checkout <main-or-master>
git pull --ff-only origin <main-or-master>
git status --short
```

- praca bezpośrednio na głównym branchu;
- bez task branchy;
- bez pull requestów;
- bez force push;
- bez rebase zdalnej historii;
- non-fast-forward albo niezwiązany dirty tree = `BLOCKED`.

## 6.2. Content boundary

Codex może:

- tworzyć folders, schemas, validators, builders, reports i CI;
- czytać pytania w celu walidacji struktury;
- raportować brakujące lub błędne pola;
- budować artifact z ręcznie dostarczonego source;
- przypinać exact artifact i checksum.

Codex nie może:

- pisać pytań;
- przepisywać promptów;
- poprawiać odpowiedzi;
- tworzyć Reason lub Details;
- tworzyć distractor explanations;
- zmieniać taxonomy intent pytania;
- deklarować human approval;
- automatycznie aktywować poprawnego subsetu;
- uzupełniać brakującej liczby pytań;
- duplikować contentu do fixed pool.

Brak pytań lub niedostateczny pool ma pozostać jawnym błędem.

## 6.3. Visual harness boundary

Dopuszczalny harness:

- jest test-only lub ma oddzielny audit entrypoint;
- nie jest importowany przez production `App.tsx` ani production navigator;
- używa realnego bundled contentu lub neutralnych projection fixtures bez tworzenia nowej treści edukacyjnej;
- nie zapisuje canonical user state;
- nie jest fallbackiem runtime;
- nie daje użytkownikowi produkcyjnemu dostępu do wymuszanych błędów.

# 7. Nowa kolejność wykonania

```txt
P0  WEP4-PLAN-REALIGN-01
P1  S3-RUNTIME-INTEGRITY-01
P2  S3-DURABILITY-PROJECTIONS-01
P3  S3-VISUAL-HARNESS-01
P4  S3-VISUAL-QA-02
P5  S3-CLOSURE-01

P6  S4-CERT-DELTA-AUDIT-01
P7  S4-CERT-CONTENT-CONTRACT-01
—   MANUAL CHECKPOINT C1: Certification questions and human approvals
P8  S4-CERT-RUNTIME-01
—   MANUAL CHECKPOINT C2: official-source ExamExperienceProfile
P9  S4-EXAM-RUNTIME-01
—   MANUAL CHECKPOINT C3: approved Certification UI references
P10 S4-CERT-UI-CUTOVER-01
P11 S4-CLOSURE-01

P12 S5-PRODUCT-DELTA-AUDIT-01
P13 S5-SHARED-SHELL-AND-SURFACES-01
P14 S5-CLOSURE-01

P15 S6-CONTENT-GOVERNANCE-AUDIT-01
—   MANUAL CHECKPOINT C4: human editorial corrections and sign-off
P16 S6-PRODUCTION-ACTIVATION-01
P17 S6-CLOSURE-01

P18 S7-SECURITY-PRIVACY-01
P19 S7-ACCESSIBILITY-NATIVE-QA-01
P20 S7-RELEASE-CLOSURE-01
```

Nie przygotowuj szczegółowej implementacji Stage 4 na podstawie obecnych nazw plików. P6 ma najpierw wykonać nowy audit po zamknięciu Stage 3.

# 8. Prompt-ready task specifications — najbliższe zadania

## P0 — WEP4-PLAN-REALIGN-01

```text
Pracuj bezpośrednio na main repozytorium lukaszkurczab/gcp-ace-trainer.

Oczekiwany minimalny punkt wejścia:
82b0c92805814264ea45fb6403fd3e31046b1d0a

To jest task docs-only. Nie zmieniaj src/**, tests/**, package.json, workflows ani content artifactu.

Cel:
zsynchronizować docs/plan.md z rzeczywistym stanem obu repozytoriów i zastąpić błędny active-next-task.

Wykonaj:

1. Zapisz rzeczywisty wejściowy SHA main.
2. Zaktualizuj repository baseline w docs/plan.md.
3. Dodaj locked content producer:
   - repo: lukaszkurczab/patternly-content
   - branch: master
   - commit: b424faa6d8c7209acb51ac23af812d08c31842dc
   - contentVersion: algorithms-core-0002
   - taxonomyVersion: algorithms-taxonomy-v2.
4. Popraw tabelę statusów:
   - canonical documentation = VERIFIED;
   - Stage 1 audit = DONE;
   - Stage 2 = VERIFIED_WITH_REGRESSION;
   - Algorithms content consumer = VERIFIED;
   - Algorithms artifact = TECHNICALLY_AVAILABLE;
   - Algorithms timer/runtime = NEEDS_CORRECTION;
   - Algorithms Practice durability = NEEDS_CORRECTION;
   - Algorithms UI route cutover = IMPLEMENTED;
   - G-D = NEEDS_CORRECTION;
   - Stage 3 = NEEDS_CORRECTION;
   - Stage 4 = BLOCKED.
5. Zapisz jako potwierdzone blockery:
   - foreground timer nie jest podłączony do focus/AppState i expiry finalization;
   - AlgorithmsSimulationTimerFacade importuje concrete repositories;
   - Practice nie rozróżnia pre-journal failure od committed recovery;
   - Simulation klasyfikuje błędy przez message substrings;
   - aktywny UX/UI audit config jest historyczny.
6. Ustaw ACTIVE NEXT TASK:
   S3-RUNTIME-INTEGRITY-01.
7. Usuń lub przenieś do sekcji historycznej zapis „Until Stages 0 and 1 are verified”.
8. Nie deklaruj aktualnego qa:static ani CI jako niezależnie zweryfikowanego bez nowego wykonania.
9. Zachowaj historyczne audit evidence bez przepisywania jego wniosków.

Commit:
docs(plan): realign execution plan to current runtime state

Push bezpośrednio do origin/main.
```

## P1 — S3-RUNTIME-INTEGRITY-01

```text
Pracuj bezpośrednio na main repozytorium lukaszkurczab/gcp-ace-trainer po P0.

Źródła:
docs/02, docs/04, docs/08, docs/11, docs/12, docs/17,
docs/designs/algorithms_stage3_ui/DESIGN.md,
aktualny docs/plan.md.

Cel:
naprawić Algorithms Interview Simulation timer runtime i regresję ownership przed dalszym visual QA.

Wymagania:

1. Usuń bezpośrednie importy concrete timer repositories z:
   src/application/algorithms/AlgorithmsSimulationTimerFacade.ts.
2. Zdefiniuj family-neutral lub application-owned timer repository port.
3. Podłącz concrete get/save timer wyłącznie w application composition root.
4. Composition root instaluje jeden Algorithms timer coordinator z wstrzykniętymi:
   - timer repository port;
   - lifecycle use cases;
   - monotonic clock;
   - wall clock;
   - scheduler;
   - idempotent expiry callback.
5. Screen może wysyłać sygnały focus/AppState, ale nie może:
   - inkrementować czasu;
   - zapisywać checkpointów;
   - samodzielnie wykrywać trwałego expiry;
   - posiadać authoritative timer state.
6. Podłącz:
   - foreground enter;
   - foreground leave;
   - active/inactive/background AppState;
   - periodic projection refresh;
   - force-close resume z ostatniego verified checkpoint.
7. Wyczerpanie czasu:
   - clamp do zero;
   - exactly one expiry transition;
   - checkpointForExpiry;
   - freeze latest verified durable draft revision;
   - manual i expiry używają tej samej finalization operation;
   - repeated zero notifications nie tworzą drugiej finalizacji.
8. Background i closed-app time nie zmniejszają Algorithms timer.
9. Timer recovery failure ma typed application failure i blokuje bez UI reconstruction.
10. Przenieś Date.now(), new Date() i session sequence z algorithmsSessionFacade do wstrzykiwanych clock/ID ports.
11. Dodaj architecture checks blokujące:
   - concrete repository imports w family/application runtime poza composition root;
   - direct timer persistence z presentation;
   - UI-owned countdown source.
12. Nie zmieniaj pytań ani artifactu.

Testy:

- foreground enter/leave;
- AppState transitions;
- periodic checkpoint;
- force-close before/after checkpoint;
- no background decrement;
- live projection refresh;
- exactly one expiry command;
- manual/expiry identical final outcome;
- timer recovery failure;
- direct-repository negative architecture test;
- deterministic clocks i IDs.

Uruchom:
npm run qa:static
npm run test:algorithms-cross-repo
npm run audit:ux-ui:report

Ostatni command nie jest G-D evidence; ma jedynie nadal przechodzić do czasu wymiany configu w P3.

Stage 3 pozostaje NEEDS_CORRECTION.

Commit:
refactor(algorithms-runtime): restore canonical timer ownership and expiry
```

## P2 — S3-DURABILITY-PROJECTIONS-01

```text
Pracuj bezpośrednio na main po P1.

Cel:
przenieść durable operation state z React screens do typed application projections i poprawnie rozróżnić journal, materialization, verification oraz recovery.

Practice:

1. Rozróżnij co najmniej:
   - unanswered;
   - submitting_before_journal;
   - submit_journal_failed;
   - commit_pending;
   - commit_materialization_failed;
   - commit_verification_failed;
   - feedback;
   - advancing;
   - advance_failed;
   - completed.
2. Po durable journal:
   - odpowiedź jest immutable;
   - ponowny submit jest niemożliwy;
   - recovery replayuje ten sam plan;
   - UI nie może wrócić do unanswered.
3. Błąd przed durable journal:
   - nie tworzy committed outcome;
   - local response może pozostać edytowalny;
   - safe re-submit jest dozwolony.
4. Nie spłaszczaj wszystkich etapów do persistence_failure.
5. Projection ma udostępniać deterministic feedback z committed outcome albo family-owned feedback composition.
6. Usuń ponowne scoring decision z getAlgorithmsPracticeProjection.

Simulation:

7. Rozróżnij typed states:
   - editable;
   - saving;
   - save_failed;
   - stale_revision;
   - frozen;
   - finalization_journal_pending;
   - finalization_journal_failed;
   - materializing;
   - materialization_failed;
   - verifying;
   - verification_failed;
   - recovery_required;
   - timer_recovery_failed;
   - missing_draft;
   - version_mismatch;
   - corrupt_state;
   - completed.
8. Usuń substring-based unavailableState().
9. UI nie może dedukować fazy po message prefix.
10. React może zachować tylko ephemeral local selection i presentation-only disclosure state.
11. Resume po restarcie odtwarza operation state z journal/session/draft, nie z lokalnego hook state.
12. Error projection zawiera:
    - operation;
    - durable state fact;
    - retry safety;
    - allowed action;
    - prohibited fallback fact.
13. Nie zmieniaj pytań ani content version.

Testy z failure injection:

- journal persistence failure;
- failure po journal durability;
- failure po każdym materialized write;
- verification failure;
- restart recovery;
- duplicate submit blocked;
- identical attempt/review IDs po retry;
- stale draft rejection;
- finalization never reopens editing;
- no result before verified finalization;
- UI mapping wszystkich typed states.

Zaktualizuj architecture checks tak, aby presentation nie tworzyło durable operation state.

Commit:
refactor(training-state): expose typed durable operation projections
```

## P3 — S3-VISUAL-HARNESS-01

```text
Pracuj bezpośrednio na main po P2.

Cel:
utworzyć sankcjonowany, całkowicie nieprodukcyjny harness do renderowania wszystkich approved Algorithms UI states i zastąpić historyczny UX/UI audit config.

Harness:

1. Nie może być importowany przez:
   - App.tsx;
   - production RootNavigator;
   - production composition root;
   - release entrypoint.
2. Użyj oddzielnego audit/test entrypointu albo test hosta.
3. Użyj:
   - realnego bundled Algorithms artifactu dla promptów i interaction shapes;
   - immutable application projection fixtures dla operation phases.
4. Nie twórz nowych pytań, fallback contentu ani substitute session.
5. Harness nie zapisuje canonical MMKV user state.
6. Harness nie może być dostępny w release buildzie.
7. Dodaj statyczny test production import graph potwierdzający izolację.

Pokryj:

- P-01…P-15;
- S-01…S-29;
- choice, ordering i complexity;
- partial response;
- long Details;
- all error/recovery variants;
- 40-position navigator;
- dynamic type fixtures;
- reduced-motion fixtures.

UX/UI config:

8. Zastąp aktywny historyczny config canonical Algorithms Stage 3 configiem.
9. Usuń aktywne oczekiwania:
   - Close practice session;
   - ITEM 1 OF 10;
   - Correct answer / Needs review;
   - Explanation heading;
   - Cloud Certification jako primary Algorithms flow.
10. Walidator configu ma odrzucać te historyczne selectors w aktywnym Stage 3 audit.
11. Każdy required state wskazuje konkretny flow lub jawny manual capture requirement.
12. audit:ux-ui:report ma walidować coverage packetu, nie tylko istnienie JSON-a.

Nie oznaczaj G-D jako VERIFIED.

Commit:
test(algorithms-ui): add isolated visual-state harness and canonical audit config
```

## P4 — S3-VISUAL-QA-02

```text
Pracuj bezpośrednio na main po P3.

Cel:
wykonać pełny visual, accessibility i mobile-interaction audit wdrożonego Stage 3.

Wykonaj:

1. Natywny development build z MMKV/Nitro.
2. iOS regular phone:
   - wszystkie P-01…P-15;
   - wszystkie S-01…S-29;
   - real happy path przez bundled artifact;
   - harness/fault path dla niedeterministycznych failures.
3. Android:
   - co najmniej wszystkie krytyczne runtime states;
   - Practice unanswered/submitting/commit recovery/feedback;
   - Simulation save failure/expiry/frozen/finalization recovery/result;
   - exit/abandon.
4. Screen reader:
   - timer kind;
   - current position;
   - selected/correct/incorrect/omitted;
   - saved versus unsaved;
   - current/answered/unanswered/frozen navigator.
5. Dynamic text:
   - minimum standard;
   - duży systemowy text size;
   - brak clipping i zasłaniania action bar.
6. Reduced motion.
7. Focus order, touch targets i ordering controls.
8. Screenshot comparison z approved packetem.
9. Zapisz:
   - environment;
   - build SHA;
   - device/platform;
   - flow;
   - screenshot path;
   - result;
   - intentional differences.
10. Napraw tylko realne UI defects zgodnie z approved design.
11. Nie zmieniaj runtime semantics bez osobnego blocker reportu.
12. Nie zmieniaj pytań.

Uruchom:
npm run qa:static
npm run test:algorithms-cross-repo
npm run audit:ux-ui
oraz canonical Android audit, jeżeli środowisko jest dostępne.

G-D nadal pozostaje NEEDS_CORRECTION do niezależnego P5.

Commit:
test(algorithms-ui): complete stage 3 visual and accessibility evidence
```

## P5 — S3-CLOSURE-01

```text
Pracuj bezpośrednio na main po P4.

To jest niezależny closure audit. Nie dodawaj nowych features.

Zweryfikuj aktualny pushed main przeciwko docs/00–13, docs/15–17 i approved Algorithms design.

Sprawdź:

- one active session;
- one lifecycle owner;
- one timer owner;
- one repository binding location;
- no UI-owned timer;
- no direct repository imports poza composition;
- exact seven Algorithms modes;
- exact entry mappings;
- conditional reinsert z trzema materialized attempts;
- fixed 40 unique simulation;
- active foreground countdown;
- automatic expiry exactly once;
- revisioned drafts;
- no flags;
- no pre-final feedback;
- unanswered semantics;
- journal/materialization/verification recovery;
- no duplicate submit;
- all P/S visual states;
- accessibility;
- no old runner/routes;
- content lock i cross-repo artifact;
- current QA workflows.

Uruchom pełny applicable suite oraz sprawdź pushed GitHub Actions.

Zaktualizuj docs/plan.md:

- G-C, G-A, G-P, G-L, G-D, G-Q;
- Stage 3 = VERIFIED tylko przy wszystkich PASS;
- w innym przypadku dokładnie jeden bounded next task;
- Stage 4 aktywuj wyłącznie przy Stage 3 VERIFIED.

Commit:
docs(plan): independently verify algorithms stage 3
```

# 9. Stage 4 — plan po zamknięciu Stage 3

## P6 — S4-CERT-DELTA-AUDIT-01

Audit-only. Ma ponownie sprawdzić aktualny kod, ponieważ historyczne Cloud screens, exam routes i track registration nadal istnieją, ale część dawnych runtime owners została usunięta.

Wymagany output:

- exact current path;
- current owner;
- legacy semantics;
- canonical Certification requirement;
- keep/move/rewrite/delete;
- content dependency;
- official profile dependency;
- design dependency;
- tests;
- blocker.

Obowiązkowo:

- sześć non-simulation modes;
- Exam Simulation;
- track registration `cloud-certification` versus final GCP instance identity;
- current ExamScreen/Result/Review routes;
- global defaults;
- content availability;
- official-source profile gaps;
- required Certification design states.

Bez zmian kodu produktu.

## P7 — S4-CERT-CONTENT-CONTRACT-01

Wykonaj tylko po audycie.

Może zmienić:

- `patternly-content/master`: folders, schemas, validators, builder, approval schema, artifact contract;
- `gcp-ace-trainer/main`: track-scoped consumer support.

Nie może:

- utworzyć ani zmienić pytań;
- zatwierdzić pytań;
- wypełnić banku;
- opublikować subsetu;
- użyć Algorithms contentu jako Certification fallback.

Brak Certification source ma pozostawić:

```txt
Certification unavailable
```

bez blokowania Algorithms.

## MANUAL CHECKPOINT C1

Użytkownik ręcznie:

- tworzy Certification questions;
- wkleja je do canonical source;
- poprawia accepted answers;
- tworzy Reason, Details i distractor explanations;
- zapisuje provenance;
- wykonuje human technical/editorial review;
- tworzy exact approval records.

Validator może nie przejść. To jest prawidłowy sygnał braku contentu.

## P8 — S4-CERT-RUNTIME-01

Dopiero z ustalonym kontraktem i test fixtures albo zatwierdzonym artifactem:

- jeden reusable CertificationFamilyRuntime;
- Diagnostic Baseline;
- Focus Practice;
- Scenario Practice;
- Weak Area Review;
- Mixed Practice;
- Quick Review;
- competency-first remediation;
- deterministic recommendations;
- no reinsert;
- no trackId branch w shared code.

## MANUAL CHECKPOINT C2 — ExamExperienceProfile

Przed Exam Simulation użytkownik dostarcza wersjonowany profil oparty wyłącznie na oficjalnym publicznym źródle:

- profile ID/version;
- source URL;
- checked date;
- guide version;
- duration;
- question count/range;
- navigation;
- answer changes;
- flagging;
- navigator;
- sections;
- section return;
- timeout.

Niejasna reguła blokuje faithful simulation. Codex nie zgaduje.

## P9 — S4-EXAM-RUNTIME-01

Implementacja profile-driven simulation:

- absolute deadline;
- profile-controlled state;
- revisioned draft;
- resume/timeout;
- finalization-only feedback;
- unanswered diagnostics;
- no official pass/fail.

## MANUAL CHECKPOINT C3 — approved Certification UI

Przed UI cutover musi powstać i zostać ręcznie zatwierdzony packet dla:

- sześciu practice modes;
- setup/shortening/fixed failure;
- exam navigation;
- save/recovery;
- flags/sections tylko gdy profile pozwala;
- deadline;
- unanswered warning;
- finalization;
- results/review;
- profile unavailable.

## P10 — S4-CERT-UI-CUTOVER-01

- canonical screens;
- profile-controlled controls;
- delete old Cloud runtime/screens/routes;
- no global exam defaults;
- no `trackId === ...` w shared shell;
- no fallback.

## P11 — S4-CLOSURE-01

Niezależne zamknięcie Stage 4.

# 10. Stage 5

## P12 — S5-PRODUCT-DELTA-AUDIT-01

Ponowny audit:

- Home;
- Practice;
- Progress;
- Review;
- Settings;
- bottom tabs;
- active session continue/abandon;
- reset;
- explicit unavailable states;
- remaining Algorithms-specific shell placement;
- stale track metadata;
- dead CTAs;
- fixture-backed paths.

## P13 — S5-SHARED-SHELL-AND-SURFACES-01

- przenieś finalny shell z Algorithms-specific path do shared family-neutral presentation;
- zachowaj family renderers;
- canonical Home recommendations;
- actionable Progress;
- review provenance;
- Settings privacy/reset;
- usuń fake account/gamification/banned metrics;
- wszystkie CTAs działają albo są jawnie unavailable.

## P14 — S5-CLOSURE-01

Route smoke, Maestro, screenshots i independent gate decision.

# 11. Stage 6 — produkcyjna jakość contentu

## P15 — S6-CONTENT-GOVERNANCE-AUDIT-01

Read-only dla treści pytań.

Sprawdź obie rodziny:

- every active item fingerprint;
- source batch;
- technical evidence;
- actual human reviewer;
- review date;
- defects/corrections;
- final disposition;
- activation coverage;
- manifest/version;
- fixed pools.

Obowiązkowo rozstrzygnij records z reviewerem:

```txt
product-owner-authorized-codex-review
```

Taki wpis nie zamyka human editorial gate bez osobnego ręcznego poświadczenia właściciela produktu.

Codex nie poprawia pytań.

## MANUAL CHECKPOINT C4

Użytkownik:

- poprawia content;
- wykonuje rzeczywisty human review;
- zastępuje lub uzupełnia approval records;
- zatwierdza exact fingerprints.

## P16 — S6-PRODUCTION-ACTIVATION-01

Codex wyłącznie:

- waliduje;
- buduje artifact;
- sprawdza pełną coverage;
- publikuje immutable release;
- przypina exact artifact w aplikacji.

Jeden brak blokuje artifact. Bez subsetu i fallbacku.

## P17 — S6-CLOSURE-01

Niezależne zamknięcie G-L content gate.

# 12. Stage 7

## P18 — S7-SECURITY-PRIVACY-01

- logs redaction;
- no unapproved network/telemetry;
- permissions inventory;
- backup policy;
- no unverified encryption claim;
- reset/deletion copy;
- secrets scan.

## P19 — S7-ACCESSIBILITY-NATIVE-QA-01

- iOS i Android development/release-compatible builds;
- MMKV/Nitro;
- startup/recovery;
- screen reader;
- dynamic type;
- reduced motion;
- contrast;
- Maestro critical flows;
- screenshot comparison.

## P20 — S7-RELEASE-CLOSURE-01

- wszystkie Critical/High risks;
- CI evidence;
- native evidence;
- content evidence;
- privacy evidence;
- final release checklist;
- brak `mostly complete`.

# 13. Independent Stage 3 closure audit — 2026-07-19

Audited pushed SHA: `a10678a`. The current worktree contains an uncommitted
audit-host repair, a CI checkout repair, and the rerun evidence recorded in
`audit/algorithms-ui/s3-audit-evidence-rerun.md`; none of it is pushed closure
evidence yet.

| Gate | Status | Evidence |
| --- | --- | --- |
| G-C | `PASS` | Typed durable-operation projections and their presentation mapping pass the static architecture and recovery suites. |
| G-A | `PASS` | Static architecture checks confirm one composition binding and no feature/track repository imports. |
| G-P | `PASS` | Local recovery, foreground-timer, finalization, revisioned-draft, and duplicate-submit suites pass. |
| G-L | `PASS` | Pinned artifact, seven declared modes, fixed 40 unique simulation, unanswered semantics, and delayed simulation feedback pass local contracts. |
| G-D | `PARTIAL` | The isolated host now renders and captures iOS P-01…P-12 from real surfaces and pinned-artifact projections. P-13…P-15, S-01…S-29, Android, assistive technology, settings, and packet comparison remain unverified. |
| G-Q | `FAIL` | Pushed GitHub Actions run 29687960595 failed because the content checkout dirtied the application tree. The sibling-checkout repair is locally tested but not pushed or green in GitHub Actions. |

The audit host now has its own Expo registration and Metro root. It renders the
real Practice and Simulation surfaces from pinned-artifact projections without
a production import edge or MMKV write path. The CI repair makes both QA jobs
use clean sibling application/content checkouts. Its focused static checks,
fixture test, TypeScript check, and diff check pass locally. A clean-worktree
cross-repository execution, pushed green CI, and the missing native evidence
are still required.

```txt
Stage 3 — NEEDS_CORRECTION
Stage 4 — BLOCKED
ACTIVE NEXT TASK — S3-CLOSURE-EVIDENCE-02
```

## S3-CLOSURE-EVIDENCE-02

Goal: commit and push the verified audit-host/CI repair; then obtain the one
remaining complete Stage 3 evidence packet from clean iOS and Android targets.

Scope: split Maestro capture into bounded P/S flows; capture all remaining
states and real bundled happy path; provision Android for required critical
states; verify VoiceOver/TalkBack labels, standard and large text, reduced
motion, focus/touch/order controls, and approved-packet screenshot comparison;
confirm the pushed GitHub Actions run is green.

Non-goals: lifecycle semantics, persistence, scoring, content, and Stage 4.

Acceptance: every P-01…P-15 and S-01…S-29 has a real screenshot and metadata;
the native host has no production import edge or MMKV mutation; Android
critical-state evidence exists; and the pushed CI run is green. Only then may
all six gates and Stage 3 be marked `VERIFIED`; Stage 4 stays blocked otherwise.

Verification: from a clean application checkout run `npm run qa:static`,
`npm run test:algorithms-cross-repo`, and `npm run audit:algorithms-ui:fixtures`;
then run native iOS/Android capture and screen-reader checks, and inspect the
GitHub Actions run for the pushed SHA.

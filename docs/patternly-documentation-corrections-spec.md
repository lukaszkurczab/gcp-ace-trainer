# Patternly — specyfikacja synchronizacji dokumentacji przed wygenerowaniem planu recovery

## 1. Cel kroku

Celem tego kroku jest doprowadzenie dokumentacji `00–17` do jednego, niesprzecznego stanu wynikającego z `patternly-approved-decisions.md`.

Ten krok:

- aktualizuje wyłącznie dokumentację źródłową;
- nie zmienia kodu, testów, contentu ani konfiguracji repozytorium;
- nie implementuje recovery;
- nie poprawia runtime;
- nie generuje jeszcze planu recovery;
- nie aktualizuje `18-architecture-recovery-plan.md`.

Po wdrożeniu i zweryfikowaniu tych zmian dokument `18` zostanie wygenerowany od nowa jako krok 2.

## 2. Hierarchia źródeł prawdy po synchronizacji

| Obszar | Dokument kanoniczny |
|---|---|
| Produkt i zakres | `00`, `01` |
| Architektura i ownership | `02`, `04`, `11` |
| Nawigacja i flow | `03` |
| UI i presentation contract | `05`, `06`, `17` |
| Content i explanations | `07`, `14`, `15`, `16` |
| Storage i offline | `08` |
| Security i privacy | `09` |
| Product roadmap | `10` |
| Testy | `12` |
| Ryzyka | `13` |
| Recovery plan | nowy `18`, generowany dopiero w kroku 2 |

`patternly-approved-decisions.md` jest wejściowym rejestrem zatwierdzonych decyzji. Po ich przeniesieniu dokumenty `00–17` mają być samowystarczalne.

## 3. Zasada nadrzędna recovery

Dokumentacja musi jawnie utrwalać następującą regułę:

> Jeżeli istniejącego modelu, danych lub flow nie da się przenieść do nowej kanonicznej struktury bez zachowania starej semantyki, należy je usunąć. Nie tworzymy fallbacków, translatorów, adapterów kompatybilnościowych ani równoległych ścieżek. Nie dbamy o backward compatibility dla przedprodukcyjnych danych i kontraktów. Jawny błąd runtime jest ważnym sygnałem, że pozostał nieprzeniesiony fragment systemu — nie problemem, który należy ukryć fallbackiem.

Konsekwencje:

- stary storage jest usuwany;
- stare dane lokalne są resetowane;
- nie tworzymy migracji historycznych;
- nie odczytujemy starego i nowego schematu równolegle;
- nie tłumaczymy starych itemów, attemptów ani wyników do nowego modelu;
- nie zachowujemy root `Question`, starych session runnerów ani write-through;
- unknown ID, unsupported payload i brak contentu kończą się jawnym błędem;
- testy mają wykrywać pozostałości starego systemu;
- nie dodajemy `legacy`, `deprecated`, `temporary`, `fallback` ani `compatibility` jako trwałych elementów architektury.

## 4. Zatwierdzone kontrakty przekrojowe

### 4.1. Algorithms modes

Kanoniczne tryby:

1. `Learn Approach`
2. `Guided Practice`
3. `Recognize Patterns`
4. `Contrast Practice`
5. `Weak Area Review`
6. `Independent Practice`
7. `Interview Simulation`

Mapowanie entry points:

| Entry point | Tryb |
|---|---|
| topic/default practice | `Guided Practice` |
| pattern recognition | `Recognize Patterns` |
| contrast | `Contrast Practice` |
| due queue | `Weak Area Review`, `source = due_queue` |
| session misses | `Weak Area Review`, `source = session_misses` |
| mixed practice | `Independent Practice` |
| timed validation | `Interview Simulation` |

`Due Review` i `Session Misses` nie są osobnymi trybami.

Macierz:

| Tryb | Default | Feedback | Timer | Reinsert |
|---|---:|---|---|---|
| Learn Approach | 10 | after each | elapsed foreground | no |
| Guided Practice | 20 | after each | elapsed foreground | yes |
| Recognize Patterns | 20 | after each | elapsed foreground | no |
| Contrast Practice | 20 | after each | elapsed foreground | no |
| Weak Area Review — due queue | 10 | after each | elapsed foreground | yes |
| Weak Area Review — session misses | 10 | after each | elapsed foreground | yes |
| Independent Practice | 20 | after each | elapsed foreground | no |
| Interview Simulation | 40 | session end | 45-minute foreground countdown | no |

Review sessions:

1. use due items or session misses;
2. fill only with reviewed items from the same mental category/competency;
3. shorten the session if the compatible pool is still too small;
4. show the actual length before start;
5. never fill with unrelated items, duplicate items, generic fallbacks or automatic taxonomy widening.

### 4.2. Scoring

#### Multiple choice

Practice:

- exact full correct set: `correct`;
- non-empty proper subset of correct set without any wrong option: `partial`;
- any wrong selected option: `incorrect`, zero points.

Exam:

- only `correct` increases correct count;
- partial remains diagnostic.

#### Ordering

Points are awarded for preserved correct adjacent relations.

For `A → B → C → D`, the scored relations are:

- `A` immediately before `B`;
- `B` immediately before `C`;
- `C` immediately before `D`.

`maxPoints = itemCount - 1`.

- all relations: `correct`;
- at least one but not all: `partial`;
- no relation: `incorrect`.

#### Complexity

- one point per checked dimension;
- item declares checked dimensions;
- item declares available and accepted complexity values;
- shared presets are allowed but are not a closed global catalog;
- equivalent notation requires explicit normalization or accepted aliases.

### 4.3. Review

Triggers may create or increase review:

- incorrect;
- partial;
- hint usage, only where hints exist;
- wrong pattern;
- wrong strategy;
- complexity error;
- repeated mistake;
- scheduled retrieval;
- weak taxonomy area;
- manual mark.

`confidence` does not exist and cannot be a review trigger.

Review is two-level:

```txt
source item reference
+
skill / competency / taxonomy evidence
```

Family runtime may select:

- exact item;
- reviewed variant;
- contrast item;
- repair item.

Resolution:

- minimum two successful reviews performed after their due dates;
- correction in the same session does not resolve the persistent review entry;
- early attempt before `dueAt` does not increment success;
- incorrect or partial resets consecutive success;
- family runtime may define deterministic intervals.

Reinsert:

- enabled only in `Guided Practice` and `Weak Area Review`;
- at most once;
- prefer a reviewed variant of the same mechanism;
- exact item is allowed when no reviewed variant exists;
- both attempts remain in diagnostics;
- reinsert success does not erase the original error or resolve persistent review.

### 4.4. Persistence and resume

- target engine: MMKV;
- only infrastructure imports MMKV;
- no AsyncStorage path remains after the storage stage;
- old data and keys are deleted;
- no historical migration or compatibility layer;
- no heuristic repair of old records;
- one active session maximum;
- session is persisted before first item;
- unsubmitted current selection is not persisted in immediate-feedback practice; Algorithms Interview Simulation persists editable drafts until finalization;
- item order and shuffled option order are persisted;
- practice timer stores foreground active time; Algorithms Interview Simulation resumes from persisted foreground time and uses `max(0, 45 minutes - activeForegroundMs)`, never a deadline or wall clock;
- abandoned sessions are not shown in history;
- completed attempts remain even when the active session is abandoned;
- content mismatch may prevent resume and must produce an explicit error.

Submit uses a hybrid durable-journal model:

1. validate and freeze response;
2. build deterministic outcome;
3. persist outcome to durable mutation journal;
4. only after journal success show feedback or advance;
5. materialize attempt/session/review from journal;
6. retries remain idempotent;
7. force-close recovery finishes the journaled operation.

### 4.5. Feedback and content

- `Reason`: short, immediate orientation;
- `Details`: collapsed, complete educational explanation;
- every wrong option in an active instructional choice item has authored explanation;
- Details presents one coherent narrative:
  - mechanism and application;
  - correction of the actual selected error;
  - transfer rule or counterexample when useful;
- no generic runtime-generated explanation;
- Algorithms remediation: one mental unit per batch;
- priority:
  1. active roadmap;
  2. highest false-heuristic risk;
  3. contrasts and mistake diagnosis;
  4. remaining foundations/mechanics;
- content is corrected in place;
- no history or backward-compatible versioning of incorrect explanations;
- active `contentVersion` may remain as a current bank identifier, not as a compatibility mechanism;
- each batch requires human editorial approval against the accepted rubric.

### 4.6. Certification and Exam Simulation

Canonical modes:

1. `Diagnostic Baseline`
2. `Focus Practice`
3. `Scenario Practice`
4. `Weak Area Review`
5. `Mixed Practice`
6. `Quick Review`
7. `Exam Simulation`

Every certification track declares a versioned `ExamExperienceProfile` based on an official public source.

Profile must define:

- source URL;
- date checked;
- exam guide/version when available;
- duration;
- question count or range;
- navigation policy;
- answer-change policy;
- flagging;
- navigator behavior;
- section behavior;
- timeout policy.

Patternly mirrors the real certification flow:

- if the official exam permits navigation/change/flagging, Patternly permits it;
- if it restricts them, Patternly applies the same restriction;
- deadline and question count come from the profile;
- no feedback before final submit;
- timeout performs idempotent final commit;
- unanswered are incorrect for score but remain a distinct diagnostic category;
- answer review defaults to missed, with access to all;
- result shows raw count, percentage and competency breakdown;
- no official-looking pass/fail unless explicitly labeled as an internal Patternly practice threshold;
- one active exam per track;
- absolute deadline survives background and force-close.

If official rules are unclear, the track cannot claim faithful simulation until manually resolved. Codex cannot infer the missing behavior.

### 4.7. Evidence, progress and recommendation

Remove `confidence`.

Separate:

1. `evidenceVolume`;
2. `learningStageEvidence`;
3. `performanceSignals`.

Do not reduce these to:

- readiness percentage;
- retention percentage;
- mastery percentage.

Progression:

- does not lock modes;
- influences recommendation and default focus;
- provides evidence and reason;
- user can select another mode.

Recommendations:

- deterministic;
- family-specific;
- manual choice wins for the current session;
- Home prioritizes overdue review and repeated mistakes;
- always explains why;
- never uses `Recommended by AI`.

Every visible metric must support a training decision.

## 5. File-by-file corrections

### `00-overview.md`

- Replace MVP framing with canonical product scope.
- Remove `readiness helper`.
- State that the current product is local-first and production-structured, not an MVP architecture.
- Add the no-fallback/no-translator/no-backward-compatibility rule.
- Reference the canonical Algorithms and Certification mode sets.
- Preserve that a full online judge is not required, but do not label the current architecture or content as temporary.

### `01-product-definition.md`

- Remove `readiness insight`, `exam readiness` and any readiness-as-diagnosis wording.
- Replace with evidence, performance signals, due review and recommended action.
- Replace old Algorithms mode names with the canonical seven modes.
- Add the canonical Certification mode list.
- Describe Exam Simulation as profile-driven per certification.
- Remove optional/defer-later language that lets implemented core behavior be hidden or postponed.
- Preserve product boundaries: not official exam software, not LeetCode clone.

### `02-architecture.md`

- Replace direct AsyncStorage references with MMKV in infrastructure and engine-neutral repository contracts elsewhere.
- Add explicit hard-deletion rule for old models and paths.
- State that runtime errors from unsupported old shapes are migration evidence and must not trigger fallback translation.
- Add `ExamExperienceProfile` ownership to certification track instance/family.
- Add two-level review ownership: source item reference plus family taxonomy evidence.
- Ensure kernel does not own session-mode semantics, concrete review reasons or exam-specific behavior.

### `03-navigation-and-flows.md`

- Replace old Algorithms modes and map current entry points.
- Define review-session shortening and actual-length presentation.
- Define count-up vs countdown timers.
- Remove readiness/confidence from Home, Progress, Topic Detail and summaries.
- Add canonical Certification modes.
- Replace one generic exam flow with profile-driven navigation.
- Add continue/abandon behavior for an existing active session.
- State that UI changes without approved designs are blockers, not invitations for Codex to design.

### `04-data-model.md`

Add/update models for:

- canonical Algorithms and Certification mode IDs/configuration;
- `requestedSessionLength` and actual selected item count;
- `SessionSource`, including `due_queue` and `session_misses`;
- content-defined complexity dimensions/options/accepted aliases;
- adjacency-based ordering result components;
- expanded review reasons without confidence;
- two-level review references/evidence;
- persisted item and shuffled-option order;
- durable mutation journal;
- one-active-session rule;
- `ExamExperienceProfile`;
- `evidenceVolume`, `learningStageEvidence`, `performanceSignals`.

Remove:

- content migration maps for preserving old items;
- deprecated-item compatibility;
- historical explanation version compatibility;
- confidence fields;
- old migration-result unions intended for legacy data.

Clarify:

- `contentVersion` identifies the active bank but does not require backward compatibility in the current pre-production recovery;
- invalid old data is reset, not translated.

### `05-design-system.md`

- Remove all readiness and confidence copy/examples.
- Replace old mode labels.
- Add timer count-up/countdown variants.
- Document review actual-length disclosure.
- Define ordering tap-to-build/tap-to-remove; drag-and-drop optional.
- Define two independent complexity controls with content-defined options.
- Define exam navigator primitives as profile-driven.
- Preserve answer colors without status icons/text.
- Add rule: no approved reference means implementation blocker.

### `06-branding-and-style-direction.md`

- Remove readiness slogans and terms.
- Replace with pattern recognition, focused practice, evidence and next-action language.
- Preserve non-affiliation and calm technical positioning.
- Do not use copy suggesting official certification readiness.

### `07-content-guidelines.md`

- Require authored explanation for every wrong option.
- Preserve coherent Details composition.
- Remove deprecated-content/backward-compatibility examples.
- State that incorrect explanations are replaced in place.
- Remove MVP labels.
- Remove confidence-related requirements.
- Add accepted batch-remediation order and quality rubric.
- State that Codex may apply exact reviewed replacements but may not invent mass explanation rewrites.

### `08-storage-and-offline.md`

This document requires a full conceptual rewrite.

Canonical contract:

- MMKV only;
- one storage client and repository set;
- no AsyncStorage fallback;
- no migration of old local data;
- full deletion/reset of old keys;
- no `CompletedMigration`, legacy readers or compatibility bridge;
- no deprecated item history support;
- durable mutation journal;
- hybrid commit behavior;
- one active session;
- persist session/item order/shuffled options;
- do not persist unsubmitted response in immediate-feedback practice; persist Algorithms Interview Simulation drafts;
- content mismatch blocks resume explicitly;
- abandoned sessions excluded from user history;
- canonical data corruption policy for future production records remains a separately documented pre-release decision.

### `09-security-and-privacy.md`

- Remove confidence from stored-data examples.
- Remove readiness wording.
- Replace AsyncStorage-specific language with MMKV infrastructure boundary.
- Clarify full reset of pre-production legacy data.
- Preserve local-first privacy and no unnecessary personal data.
- Add official-source metadata for ExamExperienceProfile without presenting Patternly as official software.

### `10-roadmap.md`

- Remove MVP phase plan and obsolete implementation sequence.
- Do not reproduce the recovery plan; reserve that for the future regenerated document 18.
- Present a product capability roadmap using canonical modes and systems.
- Remove confidence/readiness work.
- Add explanation remediation as a core capability.
- Add profile-driven Exam Simulation.
- Add MMKV as the canonical local storage direction.
- State that implementation ordering is governed by document 18 after it is regenerated.

### `11-implementation-guidelines.md`

Add the mandatory rule:

- migrate or delete;
- never translate old runtime shapes;
- never add fallback reads/default-topic mapping;
- never preserve old and new flow simultaneously;
- no backward compatibility for pre-production storage/content models;
- runtime failures expose unfinished migration work;
- fix the owner or delete the path instead of catching and substituting data.

Also:

- replace AsyncStorage examples with repository/MMKV boundary;
- prohibit Codex from designing missing UI;
- require exact design references;
- remove MVP and temporary-architecture language;
- preserve transparent errors instead of fallback defaults.

### `12-testing-strategy.md`

Replace obsolete tests with exact contracts for:

- canonical mode mapping;
- mode configuration;
- multiple-choice strict zero-on-error;
- ordering adjacency scoring;
- content-defined complexity dimensions/options;
- all review triggers except confidence;
- two-level review;
- review session shortening;
- reinsert in Guided Practice and Weak Area Review;
- two successful due reviews;
- hybrid journal commit;
- resume and option-order persistence;
- MMKV-only import boundary;
- full deletion of old keys/APIs;
- absence of migration translators/fallbacks;
- ExamExperienceProfile contract;
- profile-specific navigation/deadline;
- unanswered exam scoring;
- content remediation and distractor coverage;
- no confidence;
- evidence model separation;
- deterministic recommendations.

Remove:

- migration tests preserving old records;
- AsyncStorage dual-engine tests;
- optional scoring policies already decided;
- minimal-MVP testing language.

Add negative tests proving old paths fail rather than fallback.

### `13-risk-register.md`

Remove or rewrite risks based on:

- preserving old local data;
- migration compatibility;
- readiness/confidence;
- MVP scope.

Add/strengthen:

- silent fallback masks incomplete migration;
- translator/adapter becomes permanent second architecture;
- stale AsyncStorage path survives MMKV switch;
- exam profile drifts from official rules;
- weak explanations pass structural validation;
- review is filled with unrelated items;
- missing design is improvised by Codex;
- old item/session model remains reachable.

Mitigation must favor deletion and explicit runtime failure.

### `14-learning-effectiveness-model.md`

- Remove confidence collection and calibration.
- Hints exist only in explicit interactions.
- Update review triggers.
- Replace mixed readiness/evidence concepts with the approved three-part evidence model.
- Add canonical Algorithms modes.
- Add review-session shortening rule.
- Add no-lock progression rule.
- Preserve Reason/Details distinction.
- Remove MVP framing and stale data-model proposals.

### `15-certification-track-learning-system.md`

- Use the seven canonical Certification modes.
- Add complete `ExamExperienceProfile`.
- Make official source/date/version required.
- Remove confidence from attempts, review and recommendations.
- Update exam score, timeout, resume and answer-review behavior.
- Update review to two levels and expanded triggers.
- Apply distractor explanation requirement.
- Apply competency-then-topic remediation order.
- Remove backward content compatibility and MVP language.
- Do not claim official exam equivalence; say the simulation mirrors publicly documented format.

### `16-leetcode-like-learning-system.md`

- Use the seven canonical Algorithms modes.
- Add exact mode matrix.
- Map due queue/session misses as Weak Area Review sources.
- Add session shortening behavior.
- Add reinsert to Guided Practice and Weak Area Review only.
- Replace ordering scoring with adjacency relations.
- Make complexity options/dimensions content-defined.
- Remove confidence and confidence-related recommendations.
- Add approved summary constraints.
- Add remediation order and batch acceptance rubric.
- Remove duplicate/obsolete mode taxonomy and MVP labels.

### `17-training-runtime-and-interaction-spec.md`

This document receives the most exact behavioral changes:

- define canonical modes and configuration matrix;
- distinguish requested and actual session length;
- show actual review length before start;
- define review-shortening selection order;
- define count-up/countdown timer policy;
- replace ordering scoring with adjacent relations;
- replace fixed complexity catalog with content-defined dimensions/options;
- expand review triggers, remove confidence;
- define two-level review;
- enable reinsert only for Guided Practice and Weak Area Review;
- preserve max one reinsert and minimum separation;
- update durable-journal submit flow;
- update failure UI around journal persistence;
- add exact resume/abandon rules;
- add summary constraints;
- add profile-driven Certification Exam Simulation;
- define unanswered, timeout, answer review and resume;
- state that missing UI reference blocks UI implementation;
- add no-fallback/no-translator/no-backward-compatibility runtime rule.

### `18-architecture-recovery-plan.md`

Do not modify.

It is stale after the source documentation changes and will be regenerated from scratch in step 2.

## 6. Global cleanup

Across `00–17`:

- remove `MVP` as a label for current architecture, data model, runtime or quality bar;
- replace it with explicit current scope or product boundary;
- remove `confidence`;
- remove readiness/retention/mastery claims and copy;
- remove deprecated-content compatibility;
- remove historical data migration promises;
- remove AsyncStorage as an accepted target;
- remove open alternatives for decisions already approved;
- remove statements allowing Codex or implementation to infer missing product behavior;
- preserve only deliberate future capabilities that do not create placeholders in current architecture.

Do not remove legitimate statements that a capability is outside current product scope, but express this as a clear product boundary, not an MVP shortcut.

## 7. Acceptance criteria

The documentation-sync step is complete only when:

1. exactly `docs/00-*.md` through `docs/17-*.md` may change;
2. `docs/18-architecture-recovery-plan.md` has no diff;
3. no application code, tests, content or configuration changed;
4. all approved decisions are represented in canonical documents;
5. no document still proposes AsyncStorage as the target;
6. no document requires migration of old pre-production data;
7. no document contains confidence as an active product mechanism;
8. no document contains an open choice for approved scoring or review behavior;
9. canonical Algorithms and Certification modes are consistent everywhere;
10. Exam Simulation is profile-driven per certification;
11. no fallback, translator or backward-compatibility architecture is recommended;
12. runtime errors are described as explicit migration signals;
13. no stale readiness/retention/mastery copy remains;
14. Reason/Details and explanation-quality requirements remain intact;
15. Markdown links, headings and code fences are valid;
16. the final diff is reviewed semantically, not produced by blind search-and-replace.

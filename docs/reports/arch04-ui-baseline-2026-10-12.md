# Patternly UI audit — ARCH-04 interaction binding baseline

## Outcome

- Audit status: COMPLETE dla ograniczonego static baseline; pełna UI weryfikacja niewykonana.
- UI result: findings present.
- Scope/surface: pięć kontrolek sesji i adaptery feedbacku w mobile APP, bez audytu całego produktu/pytań.
- Evidence class: CODE_ONLY oraz real producer scorer probe; nie LIVE_UI.
- Source: APP321e575b96be8583a2fa443aab154a087769a531 baseline, CONTENTe57f32a743f8b8afbdf7fbddb215322239bceffa; późniejsze WIP nie są finalnym UI.
- Scenario: authored complexity dimension z kilkoma required stable IDs; device/theme/text size nieweryfikowane.
- Date:2026-10-12. Independent reviewer persist_design Luna High, root contract/source/probe reconciliation.

## User goal and contract

Użytkownik musi móc udzielić poprawnej odpowiedzi zgodnej z autorskim kontraktem, zachować wybrane wartości przy wznowieniu i otrzymać feedback dopiero po właściwej durable boundary. ARCH-04 zmienia ownership/binding, bez zmiany treści, scoringu, schema i admission. Jedyna kolejka pozostaje w PATTERNLY-WORKING-PLAN.md; poniższy finding należy do istniejącego ARCH-04, nie nowej kolejki.

## Sources and rule map

| Rule | Source | How checked | Result |
|---|---|---|---|
| UI renderuje deklarowane dimensions, values; answer/aliases ukryte | workspace docs05 Complexity interactions; docs17 §7 Complexity | source adapters + actual source question | FAIL: scalar adapter nie reprezentuje pełnego odpowiedzi-setu |
| Jeden vertical owner, extension bez closed union | docs11 Interaction handler; ARCH-04 spec | source baseline | FAIL jako potwierdzony zakres aktywnego refaktoru |
| Reason/complete Details i durable disclosure | docs17 §8; docs05 Feedback | CODE_ONLY family flow trace | PASS tylko source trace istniejących różnic Coding pendingJ vs Certification/Design materialized; runtime NOT_VERIFIED |
| Brand/visual grammar | docs06 Visual approval and handoff; docs05 response controls | istniejące checkbox/radio primitives | NOT_VERIFIED rendered; korekta existing selection contract, bez systemowego redesignu/nowej interaction grammar |
| A11y role/checked/editable dla set selection | docs05 semantics/accessibility; docs17 §20 | PracticeResponseControls | FAIL: radio dla exact-set dimension |
| Density/redundancy/copy/colour/contrast | checklist heuristics w zakresie renderingu | brak live/screenshot | NOT_VERIFIED; brak propozycji usuwania treści |

## Evidence and coverage

| Screen/state | Platform/theme/language/text size | Variant | Evidence | Status |
|---|---|---|---|---|
| Practice dimensions, selected/editable | mobile renderer source; pozostałe nieustalone | freqstate016 auxiliary_space O(1)+O(26) | CODE_ONLY + actual CONTENT scoreQuestion | FAIL scalar binding; brak live UI |
| Choice single/multiple/order | mobile source | empty/selected/locked | CODE_ONLY | bazowe invarianty zidentyfikowane; rendering NOT_VERIFIED |
| Resume/review/finalized | mobile source | wszystkie pięć typów | CODE_ONLY adapters/family flow | array loss potwierdzona w adapterach; nowy runtime NOT_VERIFIED |
| Large text/themes/device/a11y runtime | istniejący iPhone17 only, bez startu w tym audycie | risk-based później | brak | NOT_VERIFIED, VoiceOver poza bieżącym zakresem |

## Findings

### [P2] ARCH04-UI-01 — nie można zaznaczyć pełnej poprawnej odpowiedzi wymiaru

- Type/category: confirmed problem; state/learning interaction/accessibility.
- Location/state: PracticeResponseControls dimension value selection, lokalny stan i Coding/review adapters; mobile CODE_ONLY, theme/language nieustalone.
- Evidence: PracticeLocalResponse.selectedValuesByDimension i canonicalQuestionViewModel redukują do scalar; codingInterviewSessionFacade serializuje [value]; canonicalInteractionPresentation odtwarza [0]; PracticeResponseControls pokazuje radio i selectedValue.
- Rule: questionTypes readonly string[] + APP questionScoring dimension exact normalized set; CONTENT scripts/content/question-contract.mjs scoreDimensionResponse potwierdza ten sam kontrakt. docs05 Complexity controls render active declared contract; docs17 §7 scoring inputs pozostają ukryte.
- Impact/confidence: dla rzeczywistych itemów z wieloma wymaganymi wartościami użytkownik nie może otrzymać correct przez tę kontrolkę; high, source i real scorer zgodne. P2: zlokalizowany defekt funkcjonalny w podzbiorze, bez wykazanej utraty danych.
- Real probe: current source alg-arrays-frequency-state-016 auxiliary_space accepted/answer [O(1),O(26)], alias constant→O(1),fixed_alphabet→O(26). Node22 producer scoreQuestion: authored correct2/2; legal single-radio [O(1)] partial1/2. Jedna legalna wartość może być complete, ale partial; nie odrzucać jej jako malformed.
- Recommendation: fix state/behavior. Przenosić tablice stable IDs end-to-end; każda wartość independent toggle/checkbox. Nie wybierać cardinality na podstawie poprawnej odpowiedzi i nie scalać targets/aliases.
- Proposed layout: istniejący value grid/style, checkbox role/checked dla każdej wartości; bez nowej kopii, formuły ani obietnic.
- Preserve: selected values innych dimensions, immutable round-trip/resume/review, editablefalse, partial semantics, authored Reason/Details/messages/course, exact pin, failedJ/unknownD block i family disclosure.
- Acceptance: actual component callback→array→APP evaluation daje correct dla real authored set i partial dla legalnego singletonu; toggle jednego wymiaru nie zmienia innych; empty/duplicates/sparse/alias collision zachowują właściwe incomplete/invalid; frozen bez zmian. Pięć typów parity i exact durable round-trip.
- Confirmed dependencies: features/practice/{practiceSessionPresentation,canonicalQuestionViewModel,PracticeResponseControls}; application/{coding-interview/codingInterviewSessionFacade,canonical/canonicalInteractionPresentation}; content/canonical/{questionTypes,questionScoring}. Final vertical paths dopiero po refaktorze.

## Conflicts and limitations

| Limit | Scope | Consequence | Needed evidence |
|---|---|---|---|
| Source nie dowodzi rendering/touch/a11y runtime | mobile baseline | brak liveUI/VoiceOverPASS | matching component behavior i risk-based existing17 UI po bezpiecznym candidate entry |
| Handler availability vs family/mode admission | Design config/obecne artifact types | nie rozszerzać trybów przy rejestracji | zachowane negative admission tests |
| Durable feedback różni się między rodzinami | Coding vs Certification/Design | evaluator nie autoryzuje ujawnienia | failedJ/pending/materialized/finalized matching tests |

## Remediation within ARCH-04

Właściciel: sole writer persist_writer Luna High, etap interakcji po ARCH02/CONTENTbinding. Cel/scope: array state, handlers/facade/persistence/projections, existing checkbox semantic; bez scoring/content/schema changes. Niezależny scoped design review: fit0,96/simplicity0,88/risk0,91/maintenance0,90 minimum0,88. Root przyjmuje korektę w autoryzowanym ARCH-04; jest naprawą deklarowanego selection contract przez existing primitive, a nie znaczącą nową prezentacją wymagającą ponownego otwarcia Figma. Jeśli zakres stanie się nową interaction grammar, ponownie ocenić właściwy kontrakt przed zmianą.

Baseline do retestu: choice_single radio one; choice_multiple checkbox set; ordering full order/up/down/boundary disabled; complexity+decision_matrix independent dimension sets. Każdy typ: empty/incomplete, selected/editable, disabled/frozen, resume/review, submit/finalized. Nie traktować CODE_ONLY baseline jako pełnego UI odbioru. Nie zmieniono kodu UI ani danych użytkownika w tym audycie.

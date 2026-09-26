# Patternly UI audit — propozycja planu nauki

## Outcome

- Audit status: COMPLETE dla statycznego przeglądu jednego stanu; runtime i accessibility pozostają do odbioru.
- UI result: findings present.
- Scope: ekran aktywnej propozycji `LearningPlanProposalScreen`; stany loading, shortfall, błędy i zapisany plan sprawdzono tylko w kodzie.
- Surface: mobile app.
- Evidence class: SUPPLIED_SCREENSHOT + CODE_ONLY.
- Source identity: screenshot iPhone 17 z 26.09.2026 21:07; bieżący nieprzypięty working tree.
- Scenario and environment: iPhone 17 Simulator, dark, EN, standardowy tekst, Coding Interview, goal `prepare_for_an_interview`, bez target date, trzy dni.
- Report date: 2026-09-26.

## User goal and contract

Użytkownik ma zrozumieć proponowany plan, ewentualnie poprawić harmonogram i podjąć jedną główną decyzję: zaakceptować plan. Track, rodzaj celu, termin, dni, rozkład tygodnia oraz materialne ograniczenia planu muszą pozostać dostępne. Zgodnie z decyzją właściciela ekran ma usunąć nadmiarową pustą przestrzeń, używać naturalniejszego tytułu, nazwać kartę rodzajem celu, pozostawić `Accept plan` jako jedyne primary CTA, zmienić `Edit schedule` na secondary i usunąć dolne `Go back`.

## Sources and rule map

| Rule | Source and section | How checked | Result |
| --- | --- | --- | --- |
| Jasny cel i jedna dominująca następna decyzja | Owner decision; `docs/01-product-definition.md`, Surface ownership | Screenshot i kod footera | FAIL — `Edit schedule` i `Accept plan` mają równą wagę, a trzeci duży `Go back` konkuruje o przestrzeń. |
| Zwarta, czytelna hierarchia bez utraty touch targets | `docs/06-branding-and-style-direction.md`, Visual system | Screenshot, `Screen`, `AppShellHeader` | FAIL — top inset jest zastosowany przez dwa kontenery, a duży footer ogranicza widoczność planu. |
| Track pozostaje widoczny, gdy wpływa na treść | `docs/05-design-system.md`, Primary navigation | Screenshot i `PlanHeader` | PASS — `Coding Interview` pozostaje jawne. |
| Copy jest naturalne i niepowtarzalne | Owner decision; audit heuristic | Screenshot, locale i `GoalContext` | FAIL — `Your proposed rhythm`/subtitle brzmią jak opis generatora, a `Goal context` powtarza treść `Interview preparation`. |
| Nie usuwać ważnych konsekwencji i stanów | `LearningPlanProposalScreen` | Inspekcja wariantów ready/shortened/shortfall/error | NOT_VERIFIED — wymagany runtime wszystkich wariantów po zmianie. |
| Dynamic Type, VoiceOver i scroll | `docs/12-testing-strategy.md`; design-system accessibility contract | Brak runtime evidence | NOT_VERIFIED — screenshot pokazuje tylko standardowy tekst. |

## Evidence and coverage

| Screen/state | Platform | Theme | Language/text size | Variant | Evidence | Status and omission reason |
| --- | --- | --- | --- | --- | --- | --- |
| Proposal ready | iOS Simulator / iPhone 17 | dark | EN / standard | interview, no target, 3 days | supplied screenshot + code | Reviewed statically. |
| Proposal ready | iOS Simulator / iPhone 17 | light | PL/EN / standard + large | short/long goal and 1/7 days | none | NOT_VERIFIED; required after implementation. |
| Loading/stale/shortened/shortfall/failure | code only | unknown | locale-dependent | all | source inspection | NOT_VERIFIED visually. |
| Accepted plan | code only | unknown | locale-dependent | saved/reminders pending | source inspection | NOT_VERIFIED; footer is related but outside the exact owner decision unless shared changes affect it. |

## Findings

### P2 UI-26-11-F1 — podwójny top safe-area zabiera przestrzeń zadaniu

- Type: confirmed problem.
- Category: density-hierarchy.
- Location/state: proposal ready, iOS dark EN.
- Element and evidence: duży pusty pas nad nagłówkiem; `Screen edges={["top", "bottom"]}` otacza `AppShellHeader placement="stack"`, który sam renderuje `SafeAreaView edges={["top"]}`.
- Rule and source: owner decision oraz brand requirement compact hierarchy.
- User impact and confidence: mniej planu jest widoczne, a sticky footer szybciej zasłania kontekst / high.
- Priority: P2 — wyraźna degradacja czytelności bez utraty danych.
- Recommendation: remove duplicate top inset locally for this screen family; zachować jeden systemowy safe-area owner.
- Proposed layout: nagłówek zaczyna się bezpośrednio pod pojedynczym insetem urządzenia; bez ujemnych marginesów i bez redukcji touch targetów.
- Preserve: Dynamic Island clearance, scroll, header background, loading/error variants.
- Acceptance and retest: zmierzony pojedynczy safe-area na ready/loading/stale/shortfall w light/dark i screenshot iPhone 17.
- Confirmed code/component: `LearningPlanProposalScreen`, `Screen`, `AppShellHeader`.

### P2 UI-26-11-F2 — footer nie komunikuje jednej głównej decyzji

- Type: confirmed problem.
- Category: hierarchy / element-value.
- Location/state: proposal ready.
- Element and evidence: trzy pełnoszerokie przyciski; dwa primary (`Edit schedule`, `Accept plan`) i secondary `Go back`, podczas gdy nagłówek ma już Back.
- Rule and source: owner decision; audit heuristic — akcja zatwierdzenia jest celem ekranu, edycja jest alternatywą.
- User impact and confidence: niejasny następny krok, duży koszt przestrzeni i redundantna nawigacja / high.
- Priority: P2.
- Recommendation: retain `Accept plan` jako jedyne primary; zmienić `Edit schedule` na secondary; remove dolne `Go back`, zachowując Back w nagłówku.
- Proposed layout: dwie akcje w sticky footerze, secondary `Edit schedule` nad primary `Accept plan`.
- Preserve: loading/disabled podczas mutacji, testID, działanie editor/accept, nawigacja sprzętowa i gest Back.
- Acceptance and retest: jeden primary CTA; brak footerowego Back; oba działania wykonują dotychczasowe operacje; test rapid tap i VoiceOver order.
- Confirmed code/component: ready footer w `LearningPlanProposalScreen`; `AppShellHeader`.

### P2 UI-26-11-F3 — tytuł opisuje artefakt zamiast zadania użytkownika

- Type: confirmed problem + owner-approved copy direction.
- Category: interface language / redundancy.
- Location/state: proposal ready.
- Element and evidence: `Your proposed rhythm` oraz `A proposal based on your current goal`.
- Rule and source: owner decision; audit heuristic — ekran służy przeglądowi i akceptacji.
- User impact and confidence: formalne, generatorowe sformułowanie osłabia orientację i powtarza oczywisty status propozycji / high.
- Priority: P2.
- Recommendation: rewrite tytuł na `Review your learning plan` i remove subtitle.
- Proposed copy/layout: `Review your learning plan`, następnie zachowana karta tracku.
- Preserve: odrębne copy dla shortfall i accepted plan; nie przedstawiać propozycji jako zapisanej przed akceptacją.
- Acceptance and retest: ready/shortened używa nowego tytułu bez redundantnego subtitle; stale/shortfall/accepted zachowują prawdziwy stan.
- Confirmed code/component: `PlanHeader`, locale `learningPlan`.

### P3 UI-26-11-F4 — karta celu powtarza rodzaj celu

- Type: confirmed problem.
- Category: redundancy / interface language.
- Location/state: proposal ready.
- Element and evidence: karta `Goal context`, po której następuje osobna linia `Interview preparation`.
- Rule and source: owner decision; redundancy checklist.
- User impact and confidence: niejasna etykieta zajmuje miejsce, a właściwy rodzaj celu ma słabszą hierarchię / high.
- Priority: P3 — czytelność, bez blokowania zadania.
- Recommendation: replace tytuł `Goal context` przetłumaczoną wartością `GOAL_LABELS[outcome.goal.goalType]` i remove powtórzoną pierwszą linię.
- Proposed copy/layout: nagłówek `Interview preparation`; pod nim tylko target i dni.
- Preserve: dokładny typ celu, brak target date, wybrane dni oraz wszystkie siedem locale.
- Acceptance and retest: każdy goal type staje się tytułem bez duplikatu; długie DE/FR nie klipują tekstu przy 2× font scale.
- Confirmed code/component: `GoalContext`, `GOAL_LABELS`, locale `common`.

## Conflicts and limitations

| Conflict or limit | Exact sources/scope | Consequence for assessment | Evidence/test needed |
| --- | --- | --- | --- |
| Screenshot nie dowodzi scrollowania ani zachowania CTA | supplied screenshot | Nie można uznać flow za zepsute | Runtime edit/accept/back. |
| Oryginalny plik nie był dostępny pod podaną ścieżką | Desktop path | Brak pomiaru pikselowego z oryginału | Nowy screenshot/evidence po implementacji. |
| Wspólny header/footer obsługuje inne stany | `LearningPlanProposalScreen` | Lokalna poprawka nie może spłaszczyć shortfall/error/accepted | Macierz stanów oraz diff scope review. |
| Nowy tytuł wymaga lokalizacji | siedem locale | EN nie wystarcza do finalnego odbioru | I18N-01 review; wcześniej techniczny parity/typecheck. |

## Remediation tasks

### UI-26-11 Uporządkować przegląd propozycji planu

- Goal and scope: poprawić hierarchię wyłącznie aktywnej propozycji oraz bezpiecznie usunąć podwójny top inset we wszystkich stanach korzystających z tego samego nagłówka.
- Confirmed files/components: `src/features/home/LearningPlanProposalScreen.tsx`, `src/components/Screen.tsx`, `src/components/AppShellHeader.tsx`, `src/locales/*/learningPlan.json`, `src/locales/*/common.json`, `src/features/home/learningPlanProposalPresentation.test.ts`.
- Change: jeden safe-area owner; `Review your learning plan`; goal type jako card title bez duplikatu; secondary Edit, primary Accept, bez footerowego Back.
- Preserve / regression guards: track, target, days, schedule, FactCards, warning shortened/shortfall, errors, reminder result, mutation guards, header Back i platform navigation.
- Test: presentation assertions, locale parity/typecheck, ready/shortened/shortfall/loading/error, action behavior, Dynamic Type, VoiceOver, light/dark i screenshot iPhone 17.
- Completion condition: kryteria UI-26-11 spełnione, brak podwójnego insetu i jednoznaczne CTA, bez regresji danych lub stanów.
- Dependency/approval: decyzja właściciela jest wystarczająca; I18N-01 jest zależnością finalnego odbioru siedmiu tłumaczeń.

## Completion summary

Statyczny audyt wskazanego ekranu jest kompletny i potwierdza cztery problemy. Nie jest to pełna weryfikacja UI: rendering po zmianie, zachowanie przycisków, pozostałe stany, Light, PL i duży tekst pozostają do sprawdzenia podczas implementacji i niezależnego QA.

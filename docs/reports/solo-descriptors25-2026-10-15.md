# Prompt 25 / ARCH-06 — odbiór

15.10.2026 — **PASS: kod i celowane testy lokalne; niezależny QA gpt-6-luna high PASS.** Bez residualu25. Następny dopuszczalny prompt **26**, nieuruchomiony. Bez commitu/pusha, urządzeń, zmian usług ani publikacji.

## Wynik i granice zakresu

Istniejący `domain/tracks/trackAdmission.ts` jest jedynym ownerem deklaracji metadata Claude/GCP, list roadmap poza coding oraz konfiguracji istniejących wariantów Practice i pustego Progress. Application przekazuje config oraz gotowe label/description/emptyState; shared UI nie wybiera ich po provider ID. Coding zachowuje dynamiczny `ALGORITHM_ROADMAP`. `EXAM_DOMAIN_LABELS` jest projekcją tego samego ownera, pozostawioną dla rzeczywistych konsumentów exam/review przez `getDomainLabel`, bez drugiej deklaracji treści.

Renderer przyjmuje obsługiwany wariant po kontrakcie. Nieznany wariant daje lokalizowany unavailable, bez promptu/constraints/response controls; application odrzuca brak/niepoprawny config istniejącym `missing_content`. Testowy descriptor działa bez nowej gałęzi UI. Normalny Claude nie pokazuje hints ani Key constraints; constraints są usuwane przez projekcję i respektowane przez kartę. Exam zachowuje swój dotychczasowy default layout. Scroll focus pochodzi z config; diagnostyka pierwszego promptu została w callerze Certification.

Progress pobiera metadata dla własnego tracka; aktywność używa tracka danego rekordu. Brak/cross-track/niezadeklarowane ID daje jawne unavailable. Pusty stan jest projekcją, retained-review CTA wymaga zarówno config, jak i rzeczywistego reviewAction. Captured activityRecords trafiają do projekcji z istniejącego odczytu Home oraz bezpośredniego buildera; historia jest filtrowana do wybranego tracka. Przy braku action pozostaje Open Practice. Usunięto też specjalny bypass gotowości GCP i fallback etykiet GCP z Practice.

Usunięto produkcyjny `features/home/tabs/cloudProgressDomainMetadata.ts`, deklaracje roadmap z feature i zastąpione importy/gałęzie/fallbacki. Jego test pozostaje aktywną regresją nowego descriptora. Nie zmieniono scoringu/QLE, banków, source briefów, pakietów, pinów, storage ani usług; bez nowej taksonomii, Learning, frameworka hintów, cache lub rejestru.

QLE przekazane przez końcowy handoff właściciela w czacie `01a13520-0e88-7451-9552-aafcbb1dc6fe`: APP `9c9798a5`, CONTENT `71b0096`. ARCH-05/prompt24 był już odebrany — bez ponownego wykonania. [Odbiór24](solo-projections24-2026-10-15.md).

## Kryteria i weryfikacja

- Jeden owner: exact parity **8 list roadmap/kolejność + 11 authored tytułów/opisów** względem wejściowego WIP; EN/PL metadata entries i istniejące style zachowane.
- Rozszerzenie config: rzeczywiste funkcje PracticeSessionSurface/PracticeQuestionCard i ProgressTab wykonane przez istniejący controlled-function harness, dziewięć tracków, synthetic descriptor, provider-ID spoof, unknown variant, brak config/metadata i cross-track domeny.
- Rzeczywiste aplikacyjne projekcje wszystkich dziewięciu tracków oraz bezpośredni/captured Progress, retained Claude review obligation i exact question, bez zmiany due/scoring/pinów. Źródłowy hash briefów `1e042fde65d262ca752c9bf57de4ed906b179b9b5fe4ff8ddee97e6157bbfe63` pozostaje taki sam; nowe jawnie app-owned pole presentation jest wyłączone wyłącznie z serializacji source-brief fingerprint.
- Końcowy zestaw autora: **284/284 PASS**; dwie niezwiązane nazwy globalnego mutationArchitecture testu jawnie wyłączone po pierwotnym FAIL. Wcześniejsze poprawione błędy: niepełny fixture bez trackId, nadmierna asercja dostępności istniejącego GCP mapping i dawny test humanizacji unknown IDs. Nie obniżono AC: negative state odpowiada wymaganemu unavailable.
- Niezależny QA Luna High: pierwszy **FAIL** wykrył provider branch pustego Progress i GCP label leak w activity; obie poprawione, ponowny **PASS, 130/130**, typecheck i obie kontrole granic. Reviewers read-only, root jedyny writer.
- `npm run typecheck`, `npm run validate:content-boundary`, `npm run validate:runtime-privacy-boundary`, `git diff --check`: **PASS**.

Ocena początkowa: dopasowanie/prostota/ryzyko/utrzymywalność **0,94/0,90/0,88/0,92**. Niezależny design review Luna High: **0,88/0,86/0,84/0,90**. Po uzupełnieniu pominiętych ścieżek Progress: **0,86/0,82/0,82/0,86**, minimum0,82; jeden istniejący owner i gotowa projekcja, bez wpływu na trwałość lub evidence policy.

## Ograniczenia i istniejące ryzyko

To odbiór kodu i celowanych testów lokalnych. Controlled-function harness wykonuje faktyczne funkcje TS/JSX z kontrolowanymi zależnościami; **nie jest React/native mount, screenshot ani dowód układu na urządzeniu**. Bez build/smoke iOS/Android, hosted CI, pełnego npm test/qa:static, odbioru usług lub wydania. Dane/symulator nie były dotykane.

Pełne bramki repo pozostają czerwone poza tym pakietem: dwa testy `mutationArchitecture` (`mutation failure has one boundary owner and presentation cannot recreate durable state`; `features and track semantics cannot import storage or repository implementations`) wskazują persistence import w niezmienionym `PremiumPurchaseScreen.tsx`; `recovery:check` wskazuje test-only import w niezmienionym `terminalWireFixture.ts`. Byte-identical względem wejścia również sam checker; nie poprawiano ani nie maskowano ich w kodzie testów.

Obecny pakiet GCP używa `gcp-ace-standard-domain-*`, podczas gdy istniejące authored metadata obejmują cztery inne ID. Poprzedni renderer też zwracał dla tych wyników unavailable; zachowano to jawnie, bez aliasów/nowej taksonomii i bez przypisywania cudzych etykiet. Znane nazwane domeny GCP nadal zachowują exact copy.

[Manifest](solo-descriptors25-2026-10-15.json) zawiera własne ścieżki, hashe wejściowe/końcowe, zachowane WIP i piny, parity digests oraz komendy. Kanoniczny plan jest w workspace, nie odtworzono kopii w APP/docs. Brak następnego zadania, automatyzacji lub nowego wątku.

## Komendy odbioru

Końcowy zestaw autora (Node22.22.3, cwd patternly):

```sh
node --import tsx --test --test-skip-pattern='^(mutation failure has one boundary owner and presentation cannot recreate durable state|features and track semantics cannot import storage or repository implementations)$' src/features/practice/*.test.ts src/features/practice/trackPresentationRender.test.mjs src/features/home/tabs/cloudProgressDomainMetadata.test.ts src/features/home/tabs/progressProjection.test.ts src/features/home/tabs/progressOverallCredit.test.ts src/features/home/tabs/progressScheduleEntry.test.mjs src/features/home/tabs/trackProgressPresentation.test.mjs src/features/home/tabs/activityModel.test.ts src/features/home/goalContracts.test.ts src/features/home/soloUi22.test.mjs src/features/home/soloHome23.test.mjs src/application/homeShellProfileReadIntegration.test.ts src/features/exam/ExamScreen.navigation.test.ts src/features/exam/certificationPracticeReviewPresentation.test.ts src/application/certification/certificationFeedbackProjection.test.ts src/application/certification/singleCase.integration.test.ts src/application/certification/certificationPracticeReviewProjection.test.ts src/application/certification/certificationReviewCommands.test.ts src/application/canonical/canonicalPracticeChoiceOrderProjection.test.ts scripts/architectureBoundaries.test.ts scripts/mutationArchitecture.test.ts
```

Niezależny QA:

```sh
node --import tsx --test src/features/practice/trackPresentationRender.test.mjs src/features/practice/practiceQuestionPresentation.test.ts src/features/practice/practiceFlowModel.test.ts src/features/practice/practiceSessionConfig.test.ts src/features/home/tabs/trackProgressPresentation.test.mjs src/features/home/tabs/activityModel.test.ts src/features/home/tabs/progressProjection.test.ts src/features/home/tabs/cloudProgressDomainMetadata.test.ts src/features/home/soloUi22.test.mjs src/features/home/soloHome23.test.mjs src/features/home/goalContracts.test.ts src/application/homeShellProfileReadIntegration.test.ts
```

## Własne zmienione pliki

Pełna lista source/test/doc i ich wersji jest w manifeście; nie traktować całego istniejącego Git diff jako pakietu25. Wspólne WIP zmieniono wyłącznie w opisanych miejscach; pozostałe zachowano.

- `patternly/docs/specs/engineering/architecture.md`
- `patternly/src/application/certification/certificationFeedbackProjection.test.ts`
- `patternly/src/application/certification/certificationQuestionPresentation.ts`
- `patternly/src/application/certification/certificationSessionFacade.ts`
- `patternly/src/application/coding-interview/codingProgressProjection.ts`
- `patternly/src/application/learningPlan/progressProjectionContracts.ts`
- `patternly/src/application/learningPlan/progressReadProjection.ts`
- `patternly/src/constants/exam.ts`
- `patternly/src/domain/tracks/trackAdmission.ts`
- `patternly/src/features/exam/CertificationPracticeFeedbackPreview.tsx`
- `patternly/src/features/exam/ExamScreen.navigation.test.ts`
- `patternly/src/features/exam/ExamScreen.tsx`
- `patternly/src/features/home/HomeScreen.tsx`
- `patternly/src/features/home/goalContracts.test.ts`
- `patternly/src/features/home/tabs/ProgressTab.tsx`
- `patternly/src/features/home/tabs/activityModel.test.ts`
- `patternly/src/features/home/tabs/activityModel.ts`
- `patternly/src/features/home/tabs/cloudProgressDomainMetadata.test.ts`
- `patternly/src/features/home/tabs/cloudProgressDomainMetadata.ts` — usunięty
- `patternly/src/features/home/tabs/progressPlanSectionTestHarness.mjs`
- `patternly/src/features/home/tabs/progressProjection.test.ts`
- `patternly/src/features/home/tabs/progressScheduleEntry.test.mjs`
- `patternly/src/features/home/tabs/progressTabModel.ts`
- `patternly/src/features/home/tabs/trackProgressPresentation.test.mjs`
- `patternly/src/features/practice/CertificationPracticeSessionScreen.tsx`
- `patternly/src/features/practice/PracticeQuestionCard.tsx`
- `patternly/src/features/practice/PracticeSessionSurface.tsx`
- `patternly/src/features/practice/practiceFlowModel.ts`
- `patternly/src/features/practice/practiceQuestionPresentation.test.ts`
- `patternly/src/features/practice/practiceRouteGuards.test.ts`
- `patternly/src/features/practice/trackPresentationRender.test.mjs`
- `patternly/src/features/practice/trackRoadmapCatalog.ts`
- `patternly/docs/reports/solo-descriptors25-2026-10-15.json` i raport odbioru.
- `docs/PATTERNLY-WORKING-PLAN.md`, `.agent/WORKING_STATE.md` — jedyny plan i stan.

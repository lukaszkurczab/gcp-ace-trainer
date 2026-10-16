# Prompt28 / ARCH-08 — PARTIAL, 15.10.2026

**Checker: odebrany jako PASS WITH GAPS; cały wynik28: PARTIAL.** Niezależny design review i QA: gpt-6-luna high. Aktualne repo pozostaje RED: pięć ścieżek / trzy symbole w każdym wariancie TypeScript, iOS i Android, smoke/release. Nie wyciszono ich i nie uruchomiono kolejnego promptu. [Manifest, hashe i komendy](solo-boundaries28-2026-10-15.json).

## Cel, decyzja i zakres

Zastąpiono historyczne literal/name guards wspólnym sprawdzaniem istniejących granic ARCH-01/02/04/05/08 i findings F-01/02/04/06/08/11. Jeden writer; oddzielny Luna High review i QA. Ocena wykonawcy: dopasowanie0,94 / prostota0,86 / bezpieczeństwo0,93 / utrzymywalność0,88, minimum0,86. Review: minimum0,84. Nie zmieniono polityki produktu, banków, storage formatów, pinów ani ustawień usług. ARCH-07/27 pozostaje odebrany bez residualu; ARCH-03/05/06 i wcześniejszych zależności nie implementowano ponownie.

Probe przed narzędziem wykazał, że TS6 domyślnie wybiera ogólny trainingSessionIdentity.ts, a moduleSuffixes wybiera .native. Prawdziwy metro-resolver z metro.config.js wybrał .native na iOS/Android i właściwy disabled smoke root. Dlatego checker korzysta z TS config/resolver dla typów i rzeczywistego Metro dla runtime, zamiast własnej kolejności rozszerzeń. Osobny real probe zainstalowanego Expo resolvera aliasów potwierdził extensionless candidate; fixture chronią też native alias i pierwszeństwo rozszerzenia przed platformą.

Program TS ograniczono do lokalnych modułów aplikacji (bez ładowania całych bibliotek/banków do analizy symboli). Oryginalne opcje projektu służą rozwiązywaniu modułów; getExportsOfModule/getAliasedSymbol rozwiązują wybrane symbole i import-then-export oraz proste identity value aliases. Type traversal wybiera compiler-resolved binding użyty w type/heritage, także przy default+namespace, nie runtime-only sibling z tego samego barrela. Analiza obejmuje import/export, export-star/namespace, import type, import-type expression, dynamic import, literal require i import-equals. Nierozwiązywalny moduł lub aktywny niestatyczny load daje jawny błąd kategorii. Cycles nie zatrzymują traversal; legalny cycle nie staje się sam nowym zakazem.

Czysty kernel i envelope guards zachowują także pełną runtime zależność barrela, aby nie ukryć ładowania banków przez eksport innego symbolu. UI sprawdza wybrane pochodzenie symbolu i zatrzymuje legalną delegację na application command/projection, zamiast zakazywać całej osiągalności. Typ danych wystawiony przez legalny port jest dozwolony; bezpośredni forbidden type import i neutralny type barrel pozostają RED. Registry/config i metadata tracków mają legalne fixture, a konkretne banki/item semantics mają odrębny zakaz.

Jawne composition owners odpowiadają istniejącym canonical family bindings, Q13 receipt oraz smoke-only Certification fixture. Ich bramki pozostają w niezależnych testach. Wąski legalny binding profileStorageRepository→mmkvClient/getActiveStorageProfile jest portem odczytu lifecycle, nie dostępem do KV. Fixture dowodzi, że getKeyValueStorage przez ten sam barrel nadal jest RED. Nie ma globalnego baseline allowlist.

## Zweryfikowane stare zgłoszenia i korekty

- PremiumPurchaseScreen rzeczywiście importował capturePremiumPurchaseJournal z repozytorium i używał go przy składaniu coordinatora. Binding przeniesiono do application/account/premiumPurchaseComposition.ts, zachowując actor/profile lease, clock/epoch i istniejący coordinator. Oryginalny direct edge ma RED fixture, application composition GREEN, aktualny ekran ma odrębny GREEN check. Purchase/repository behavior tests nadal przechodzą.
- terminalWireFixture→journalTestSupport jest osiągalne tylko przez terminalAccountWire.test.ts. Recovery check teraz sprawdza import z runtime source osiągalnego od App w actual Metro matrix. Legalny test-only helper jest GREEN; dołączenie tego helpera do entrypointu ma RED fixture. Nie zmieniano journalTestSupport ani terminalWireFixture. recovery:check przechodzi.
- Certification result test już przed28 konsumował application maxPoints; nie przywracano UI scoring. Name-only zakaz zastąpiono resolved dependency checkiem. Dopiero celowane behavioral tests ujawniły stary harness wymagający usuniętego getCertificationMaximumPoints i obcinający application projection. Usunięto to wymaganie, przekazano pełną realną projekcję i zaktualizowano dawną opcjonalność exact-points failure do aktualnego jawnego unavailable. Osiem odrębnych testów zachowania (metryki, failure/fence, diagnostic route i case continuation) zachowano i odebrano. Kod ResultScreen nie był zmieniany w28.

Pierwszy traversal raportował sibling exports mimo wyboru legalnego symbolu; fixture wymusiły poprawkę do selected origins. Native fixture wykryły różnicę aliasu /tmp i realpath /private/tmp; normalizacja usunęła błąd rzeczywistego resolvera. QA wykryło traktowanie publicznych type contracts jak runtime implementation; dodano osobne RED/GREEN contracts. Pierwsze recovery uruchomienie zatrzymał ESM/CJS import TS z .mjs; użyto działającego w tym repo default interop. Nie obniżano asercji zachowania, nie ponawiano efektów zewnętrznych.

## Weryfikacja końcowa

| Sprawdzenie | Rzeczywisty wynik |
| --- | --- |
| Celowane fixture + dotknięci owners | **110/110 PASS**, w tym44 fixture; [pełny run](solo-boundaries28-2026-10-15/targeted.tap) |
| Architecture test matrix + mutationArchitecture | **1PASS/6FAIL**; Premium boundary PASS, pięć wariantów repo i mutation owner check RED z tym samym residualem; [pełny run](solo-boundaries28-2026-10-15/architecture.tap) |
| Typecheck | **PASS**, exit0; [log](solo-boundaries28-2026-10-15/typecheck.log) |
| recovery:check | **PASS**, reuse po ostatnich zmianach wyłącznie selected-symbol/type traversal (from/to/kind oraz App reachability bez zmian); [log](solo-boundaries28-2026-10-15/recovery.log) |
| Niezależny QA Luna High | **44/44 fixture PASS**, typecheck/recovery PASS, architecture:check exit1 /5 ścieżek w każdym wariancie; PASS WITH GAPS dla checkera, PARTIAL dla28 |
| WIP i diff |130 wcześniejszych istniejących plików WIP zgodnych hashami poza własnym zakresem; dotknięty wcześniejszy certification test zachowuje application-maxPoints correction. Diff/unused/refcheck PASS. |

44 fixture obejmuje direct/barrel/re-export/import-then-export/export-star/namespace/mixed imports, type import/type expression/type barrel/data contracts, transitive i kernel runtime sibling barrel, forbidden i legal cycles, cross-family/persistence oraz application helper, scorer/review mutation, domain-content→orchestration, envelope guards/item semantics, registry metadata, public raw keys, require/dynamic/nonliteral/unresolved loads, TS paths, iOS/Android native/platform/extension order, alias native, runtime test-support reachability, shared concrete family dispatch, closed lifecycle payload, value imports użyte w heritage, mixed type/runtime siblings, default+namespace oraz identity aliases bez uznawania ich za application wrapper. Każdy potwierdzony bieżący residual i oryginalny Premium edge mają nazwany odtwarzalny RED→repaired-owner GREEN fixture; fixture naprawy nie oznacza naprawy tych pozostałych produkcyjnych ownerów.

## Residual — nie naprawiany w tej sesji

Wszystkie poniższe naruszają istniejący **ARCH-04/05/F-06 UI delegates persistence, scoring and review mutation**. Repo-origin runtime value nie zyskuje application ownera przez sam re-export. To trzy underlying edges, pięć ścieżek z powodu wywołania Settings również przez Home.

1. `BackendDiagnosticsScreen.tsx:5 → application/account/accountDataService.ts:120 → storage/repositories/accountDataRepository.ts`, symbol **accountDataRecordFingerprint**. Potrzebna korekta ownera fingerprint command/identity contract, zachowująca odebrane bajty i konto/sync.
2. `SettingsTab.tsx:9 → application/premiumTesting.ts → storage/repositories/premiumTestingRepository.ts`, symbole **hasPremiumTestingAccess**, **setPremiumTestingAccess**; dodatkowo te same ścieżki od HomeScreen. Potrzebny rzeczywisty application query/command owner, z zachowaniem smoke/access/profile gates i zachowania zapisu.

Te produkcyjne owners pozostają bez zmian. Historyczny FAIL nie posłużył za dowód: pozostałe trzy symbole potwierdzono aktualnym grafem, źródłami i niezależnym QA. Zgodnie z warunkiem STOP nie poszerzano tego pakietu o ich refactor. Finalne GREEN28 wymaga ich odebranej naprawy i selektywnego ponowienia matching checker/owner checks. W planie pozostaje wyłącznie ten residual, nie drugi backlog.

## Zmienione pliki i usunięte kontrole

- `scripts/architecture/{dependencyGraph,checkBoundaries,dependencyGraph.test}.ts` — wspólny resolver/graf, reguły i44 fixture.
- `scripts/checkArchitecture.ts`, `package.json` — odtwarzalny runner i TS loader dla recovery, bez nowych dependencies/pinów.
- `scripts/{architectureBoundaries,mutationArchitecture}.test.ts` — zastąpione literal/name checks i stary lokalny persistence parser. Nie wymagają historycznych nazw klas/plików/scorera ani przypadkowych call names. Nie usunięto żadnego osobnego owner behavioral test file.
- `scripts/checkRecoveryBaseline.mjs` — tylko test-support reachability używa wspólnego grafu; pozostały recovery inventory zachowany.
- `src/application/account/premiumPurchaseComposition.ts`, `src/features/premium/PremiumPurchaseScreen.tsx` — application journal binding.
- `src/tracks/certification/certificationResultPresentation.test.ts` — resolved ResultScreen boundary.
- `src/features/exam/resultScorePresentation{.test.mjs,TestHarness.mjs}` — usunięte przestarzałe wymaganie ownera UI; aktualny projection/failure contract.
- Workspace `docs/PATTERNLY-WORKING-PLAN.md` i `.agent/WORKING_STATE.md` — jedyne plan/state. Nie utworzono kopii planu w patternly/docs; spec architecture.md i wcześniejszy WIP zachowane.

## Granice i przekazanie

To kontrola statycznych jawnych zależności, nie bundler/dead-code platform, dowód wykonania wszystkich branches, analiza wnętrza npm SDK ani native acceptance. Zainstalowany Expo alias resolver ma private API: upgrade SDK wymaga odtworzenia probe/fixture. Jawne composition roots mają uprawnienia roli całego wskazanego pliku: przyszły unrelated kod w nich wymaga review roli; obecne gating/bindings sprawdzono niezależnie. W przyszłości można zawęzić kontrolę do capabilities, jeżeli pojawi się realny przypadek; nie dodano teraz nowej platformy.

Kod narzędzia/fixture i celowane owner behavior: odebrane w opisanej granicy. Całość28/lokalny architecture GREEN: **nieodebrane**. Bez full npm test, qa:static, hosted CI/build, symulatora/native, usług, maili, publikacji, commit/push. Profil właściciela iPhone17 i dane nietknięte. Następny dopuszczalny zakres: **28 — wskazany residual**, nie29. Sesja kończy się po przekazaniu.

# Wydajność — kontrakty pomiaru i granice odbioru

> Porządki 16.10.2026: odnośniki do usuniętych raportów zastąpiono podsumowaniem ustaleń. Nie zachowano tu ich surowych dowodów; status i pozostały zakres określa jeden plan workspace.

Status i kolejność: [plan główny](/Users/lukaszkurczab/Desktop/Projects/Patternly/docs/PATTERNLY-WORKING-PLAN.md). Porównano aktualne źródła 07.10:  app e889b05, backend039f7f0. Stare liczby z audytu02.10 nie opisują dzisiejszego banku ani urządzenia; zachowano je na końcu wyłącznie jako kwalifikowany baseline uzasadniający taski. Opisy przyczyn dotyczą wskazanych baseline; późniejsze odbiory PERF-02–06 mają pierwszeństwo. Nie oznacza to, że odebrany problem nadal występuje w bieżącym kodzie. Pomiar jest określonym etapem zadania, nie poleceniem ponownego audytu całego repo.

## PERF-01 — eager content load

Status16.10: pomiar34 i optymalizacja35 odebrane lokalnie; poniższe AC opisują kontrakt zachowania, nie polecenie ponownego wdrożenia. Nowa optymalizacja wymaga nowego pomiaru i uzasadnienia.

Severity: P2.

Pliki: `src/content/canonical/{runtimeCatalog,questionCatalog}.ts`, `src/application/contentPackageRuntimeOwner.ts`, `src/content/application/ContentPreparationGate.tsx`; producer `patternly-content/scripts/build.mjs` i właściwe config/package contracts.

Bieżący runtimeCatalog statycznie importuje wszystkie9pełnych banków; owner verifyBundledPackages materializuje każdy track. Strukturę, stringify/hash i indeksy sprawdza przed gotowością. Claude845 zmienił dataset, więc dawny Node/Metro baseline nie jest aktualnym pomiarem startupu.

Pierwszy wynik: source-matched cold/warm guest/resume na istniejącym iPhone17 — osobno module evaluation, hash/validation, repository/recovery, first usable screen, heap i JS/HBC. Uzgodnić wymagany offline Free zakres, modes/interactions, discovery metadata i exact pins przed redukcją eager danych. Configured producer Free packages mają tylko package-binding acceptance, runtimeAdmission:not_granted; bezpośredni swap nie jest zatwierdzony.

AC: zmniejszona zbędna materializacja/pamięć i cold work na tym samym dataset/build envelope, przy pełnym Free offline, Premium gating, schema/hash/semantics oraz immutable session/review pins. Jedna content authority; żadnej cichej podmiany lub walidacji przeniesionej wyłącznie do builda. Konkretny reprezentacyjny kontrakt wymaga review; kolejność producer→artifact/lock→consumer. Nie obiecywać UX budgetu lub przyspieszenia na podstawie gzip.

Pomiar34 odebrany lokalnie16.10.2026, niezależny Luna High PASS WITH ISSUES: [zachowane ustalenia; dawny raport usunięty](../../../../docs/reports/current-audit.md), [zachowane ustalenia; dawny raport usunięty](../../../../docs/reports/current-audit.md). Trzy cold/warm/real Resume na zachowanym Debug binary i source-matched JS; existing account, bez profile switch/reset/reinstall. RN/prelude/root require, storage/recovery, content, layout/data readiness i heap oddzielone. Odpowiedź jest JS, nie HBC; native first paint, fresh Guest, pełne9track live offline i Release mają jawne granice. Pełny gate repo pozostaje czerwony poza wycinkiem34.

Wybrana optymalizacja35 **odebrana lokalnie16.10.2026**, niezależny Luna High PASS WITH ISSUES: [zachowane ustalenia; dawny raport usunięty](../../../../docs/reports/current-audit.md), [zachowane ustalenia; dawny raport usunięty](../../../../docs/reports/current-audit.md). Function-local Set exact obiektów w `validateProductModeConfigsAgainstArtifacts`, wpis po sukcesie: scan29→9, mediana tej samej native granicy233,858→68,865ms (−70,55%) na niezmienionym datasecie/native binary. Każda per-mode pool/requestedLength/Diagnostic/admission kontrola, runtime schema/hash/predecessor, Free nodes/interactions/discovery i immutable history/review pins pozostają. Świeże wywołanie ponownie waliduje obiekt. Bez trwałego cache, podmiany pakietów lub alternatywnej ścieżki runtime. Startup/warm/Resume i właściwe regresje odebrane w opisanym envelope; brak jednego Home layout timestampu i byte-preservation całego control, pełny live9track offline/Guest/Release/usługi pozostają poza tym dowodem. Nie ponawiać ani uruchamiać dalszych eager optymalizacji bez nowego konkretnego pomiaru i zakresu.

## PERF-02 — membership scan w Progress

Severity: P2.

Pliki: `src/features/home/tabs/progressTabModel.ts`, `ProgressTab.tsx`; shared `src/application/learningPlan/learningEvidenceProjection.ts`, `src/domain/learning/packageCompletionRule.ts` i istniejące progress tests.

Historyczny baseline: model wywołuje packageItems.find dla próby oraz packageItems.some w qualification; ProgressTab buduje go przy renderze. BIZQ-02 już dodało shared exact evidence i completion presentation — zachować je, nie przeliczać polityki w nowej projekcji.

Poprawka: jeden membership/node lookup w obrębie bieżącego odczytu i współdzielone uporządkowanie; bez durable cache, limitu historii ani blanket useMemo. AC: brak scanQdla każdej próby, zgodny model dla mixed tracks/versions i time ties, exact hash qualification, rolling window, due/repeated mistakes i recommendation bez zmian. Before/after A100/1k/10k i R0/100/1k na bieżącym banku; zmierzyć med/p95. Native/React proof tylko dla twierdzenia o UI latency. PERF-01 nie blokuje tego slice.

## PERF-03 — powtarzane Home snapshots

Severity: P2.

Pliki: `src/application/homePlanSnapshotReader.ts`, `src/storage/repositories/learningPlanInputSnapshot.ts`, `src/features/home/HomeScreen.tsx` i ich tests.

Historyczny baseline: read wywoływał readGeneration dwa razy; każda generation czyta inputs przed i po async sessions. learningInputsEqual/generationsEqual serializują facts. To aktualny profile/concurrent-change fence, nie martwy kod. Nie używać starego opisu dwóch osobnych attempts readers jako obecnej implementacji.

Pierwszy wynik: policzyć reads/guards/serialized characters default dependencies przy spójnych sessions i A100/1k/10k/R≤1k, plan/no-plan/active/no-active. Prześledzić istniejący storage scope i goal-plan snapshot contract; nie tworzyć drugiego ownera. Następnie review konkretnej optymalizacji, zachowującej protection podczas mutacji/profile switch. Usunięcie drugiego odczytu tylko dlatego, że JS jest jednowątkowy, nie jest zatwierdzonym projektem.

AC: mniej powtórnego parsowania/alokacji i czasu przy identycznych outcomes oraz fail-closed. Atomic goal+plan, due/timezone i freshness bez zmian; stale accept, invalid record, reset i profile cutover tests. Brak nowego trwałego źródła prawdy lub nieudowodnionego single-read success.

## PERF-04 — pełny readback journalu

Status: odebrane source/logical/local 12.10.2026, independent Luna High PASS. Decyzja, pomiary i weryfikacja (historyczny plik `perf04-journal-readback-2026-10-12.md` niedostępny), wyniki (historyczny plik `perf04-journal-readback-2026-10-12.json` niedostępny). Native macierz pozostaje w PERSIST-13; brak twierdzenia o MMKV durability/UI latency. Severity historyczne: P2.

Pliki: `src/application/learningMutations/mutationVerifier.ts`, `src/storage/repositories/{trainingAttemptRepository,trainingSessionRepository,reviewQueueRepository,mutationJournalRepository}.ts` i recovery tests.

W baseline verifier po pełnym integrity scan ponownie odczytywał wszystkie sessions/attempts/reviews przed sprawdzeniem writes. PERSIST-02/05/06/07 określa wymagane integrity/replay semantics i ma pierwszeństwo przed optymalizacją.

Pierwszy wynik: poprawny persisted journal fixture i pełny materialize→verify→clear przy A100/1k/10k oraz spójnych sessions/reviews. Rozstrzygnąć konkretną regułę unrelated corruption: obecny pełny scan blokuje na uszkodzonym niezwiązanym rekordzie; targeted read nie może cicho osłabić tego kontraktu. Decyzja po review: zachować blokadę na unrelated corruption i użyć jednego repository-owned pełnego validated snapshotu w obrębie każdego wywołania verifiera, także do sprawdzenia declared targets. Assert i verifier współdzielą canonical reader; Set usuwa kwadratowe wyszukiwanie fizycznych kluczy. Targeted-only pomijające unrelated records nie spełnia przyjętej reguły. Nie twierdzić O(1) przy globalnym indeksie; reset wymaga pełnego scope.

AC: mniej dużych unrelated reads przy identycznych postconditions, profile fences, revisions, immutable attempts i journal-first. Wszystkie writes/deletions verified przed clear; fault po write/readback i corrupt declared/unrelated/index daje uzgodniony wynik, zachowując journal przy błędzie. Bez durability debounce.

## PERF-05 — bounded backend paging

Status: odebrane source/local/hosted CI 13.10.2026, independent Luna High PASS. Decyzja, pomiar i weryfikacja (historyczny plik `perf05-bounded-paging-2026-10-12.md` niedostępny), wyniki (historyczny plik `perf05-bounded-paging-2026-10-12.json` niedostępny). Backend producer dostarczony przez [PR1](https://github.com/lukaszkurczab/patternly-backend/pull/1); cloud deployment i native acceptance osobno. Severity historyczne: P2.

Kanoniczny `FirestoreProgressStore.readPage` czyta najwyżej pageSize+1 progress documents w document-ID order oraz cztery metadata/account documents przez dwa świeże getAll. Default/max pageSize100; opaque tokenv2 wskazuje pierwszy niewysłany lookahead, jest związany z user/revision/generation i wymaga exact cursor. Pre/post-query guards obejmują autoryzację, revision/generation, metadata updateTime i promotion lease. Strict validation obejmuje lookahead. Usunięto pełny snapshot/sort/slice z GET/v1/progress; readSnapshot pozostaje potrzebny adopcji/transferowi. Mobile production runtime już pobiera wszystkie strony przed restore i nie wymagał zmiany.

AC: bounded page, pełny sweep O(N), bez braków/duplikatów; stale/invalid token, account/generation change i zapis między metadata/query/readback jawnie odrzucane. Rzeczywisty SDK/emulatorN100/1k/10k: identyczne pełne outputhash; N10k med109,1→7,6s, returned progress docs1M→10099. To nie cloud billing ani UI latency. Actual producer→mobile consumer→application restore zachowuje212records,6requests; wymagany gate jest wersjonowany w backendCI. Exact-head hostedCI38314307054SUCCESS, app qa:static2524PASS/0FAIL/5SKIP (dwie cudze offline próby poza sourcepackage). Lokalny monolityczny błąd emulatora zachowano w raporcie; standardowy Linux/Java21 fullgate przeszedł bez zmian timeoutów, skipów ani writepath.

## PERF-06 — okno Activity i Review

Status: odebrane 13.10.2026 w opisanym poniżej zakresie; bez ponawiania odbioru w prompt33. Historyczny raport jest niedostępny, a aktualne `ActivityView` i `MistakesReviewView` potwierdzają użycie `SectionList`.

Severity: P2.

Pliki: `src/features/home/ActivityScreen.tsx`, `src/features/review/MistakesReviewScreen.tsx`, `src/components/Screen.tsx` i istniejące model/navigation tests.

Historyczny baseline mapował wszystkie wiersze wewnątrz ScrollView. Kanoniczne ActivityView i MistakesReviewView używają teraz SectionList bez limitu historii; screen pozostaje właścicielem odczytu i operacji. Source, dopasowane ograniczone pomiary native, scroll/selection/return, normalne Activity/Review i zachowanie danych odebrane niezależnie 13.10.2026. Dowody i ograniczenia (historyczny plik `perf06-list-windowing-2026-10-13.md` niedostępny): sampled RSS maxima oraz natywne callback rates, bez twierdzenia o absolute peak/presented frames/hitches. Końcowe dostarczenie helpera62e73229 ma [exact-source CI38330733575](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38330733575) obu jobsSUCCESS; PERF06 odebrane w opisanym zakresie. Derived model Activity nie był wykazanym bottleneckiem.

Poprawka: windowing obecnego presentation layer, bez cap/usuwania historii. AC: mounted rows zależą od viewportu, nie od pełnego datasetu; zachowane date/DST/locale grouping, sort/ties/filter, selected details, scroll/return, due/upcoming/unavailable i semantyczne accessibility props. Na jednym iPhone17 porównać Activity50/500/1000 i Review100/1000: mounted rows/commits, JS long tasks, peak memory i frames. Scroll/remount nie traci stanu. Bez testów VoiceOver zgodnie z PO. Nie wymaga PERF-02/03.

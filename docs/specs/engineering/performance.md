# Wydajność — gotowe zakresy pracy

Status i kolejność: [plan główny](../../PATTERNLY-WORKING-PLAN.md). Porównano aktualne źródła 07.10:  app e889b05, backend039f7f0. Stare liczby z audytu02.10 nie opisują dzisiejszego banku ani urządzenia; zachowano je na końcu wyłącznie jako kwalifikowany baseline uzasadniający taski. Poniższe przyczyny kosztu nadal występują w kodzie. Pomiar jest określonym etapem zadania, nie poleceniem ponownego audytu całego repo.

## PERF-01 — eager content load

Severity: P2.

Pliki: `src/content/canonical/{runtimeCatalog,questionCatalog}.ts`, `src/application/contentPackageRuntimeOwner.ts`, `src/content/application/ContentPreparationGate.tsx`; producer `patternly-content/scripts/build.mjs` i właściwe config/package contracts.

Bieżący runtimeCatalog statycznie importuje wszystkie9pełnych banków; owner verifyBundledPackages materializuje każdy track. Strukturę, stringify/hash i indeksy sprawdza przed gotowością. Claude845 zmienił dataset, więc dawny Node/Metro baseline nie jest aktualnym pomiarem startupu.

Pierwszy wynik: source-matched cold/warm guest/resume na istniejącym iPhone17 — osobno module evaluation, hash/validation, repository/recovery, first usable screen, heap i JS/HBC. Uzgodnić wymagany offline Free zakres, modes/interactions, discovery metadata i exact pins przed redukcją eager danych. Configured producer Free packages mają tylko package-binding acceptance, runtimeAdmission:not_granted; bezpośredni swap nie jest zatwierdzony.

AC: zmniejszona zbędna materializacja/pamięć i cold work na tym samym dataset/build envelope, przy pełnym Free offline, Premium gating, schema/hash/semantics oraz immutable session/review pins. Jedna content authority; żadnej cichej podmiany lub walidacji przeniesionej wyłącznie do builda. Konkretny reprezentacyjny kontrakt wymaga review; kolejność producer→artifact/lock→consumer. Nie obiecywać UX budgetu lub przyspieszenia na podstawie gzip.

## PERF-02 — membership scan w Progress

Severity: P2.

Pliki: `src/features/home/tabs/progressTabModel.ts`, `ProgressTab.tsx`; shared `src/application/learningPlan/learningEvidenceProjection.ts`, `src/domain/learning/packageCompletionRule.ts` i istniejące progress tests.

Bieżący model nadal wywołuje packageItems.find dla próby oraz packageItems.some w qualification; ProgressTab buduje go przy renderze. BIZQ-02 już dodało shared exact evidence i completion presentation — zachować je, nie przeliczać polityki w nowej projekcji.

Poprawka: jeden membership/node lookup w obrębie bieżącego odczytu i współdzielone uporządkowanie; bez durable cache, limitu historii ani blanket useMemo. AC: brak scanQdla każdej próby, zgodny model dla mixed tracks/versions i time ties, exact hash qualification, rolling window, due/repeated mistakes i recommendation bez zmian. Before/after A100/1k/10k i R0/100/1k na bieżącym banku; zmierzyć med/p95. Native/React proof tylko dla twierdzenia o UI latency. PERF-01 nie blokuje tego slice.

## PERF-03 — powtarzane Home snapshots

Severity: P2.

Pliki: `src/application/homePlanSnapshotReader.ts`, `src/storage/repositories/learningPlanInputSnapshot.ts`, `src/features/home/HomeScreen.tsx` i ich tests.

Current read wywołuje readGeneration dwa razy; każda generation czyta inputs przed i po async sessions. learningInputsEqual/generationsEqual serializują facts. To aktualny profile/concurrent-change fence, nie martwy kod. Nie używać starego opisu dwóch osobnych attempts readers jako obecnej implementacji.

Pierwszy wynik: policzyć reads/guards/serialized characters default dependencies przy spójnych sessions i A100/1k/10k/R≤1k, plan/no-plan/active/no-active. Prześledzić istniejący storage scope i goal-plan snapshot contract; nie tworzyć drugiego ownera. Następnie review konkretnej optymalizacji, zachowującej protection podczas mutacji/profile switch. Usunięcie drugiego odczytu tylko dlatego, że JS jest jednowątkowy, nie jest zatwierdzonym projektem.

AC: mniej powtórnego parsowania/alokacji i czasu przy identycznych outcomes oraz fail-closed. Atomic goal+plan, due/timezone i freshness bez zmian; stale accept, invalid record, reset i profile cutover tests. Brak nowego trwałego źródła prawdy lub nieudowodnionego single-read success.

## PERF-04 — pełny readback journalu

Status: odebrane source/logical/local 12.10.2026, independent Luna High PASS. [Decyzja, pomiary i weryfikacja](../../reports/perf04-journal-readback-2026-10-12.md), [wyniki](../../reports/perf04-journal-readback-2026-10-12.json). Native macierz pozostaje w PERSIST-13; brak twierdzenia o MMKV durability/UI latency. Severity historyczne: P2.

Pliki: `src/application/learningMutations/mutationVerifier.ts`, `src/storage/repositories/{trainingAttemptRepository,trainingSessionRepository,reviewQueueRepository,mutationJournalRepository}.ts` i recovery tests.

W baseline verifier po pełnym integrity scan ponownie odczytywał wszystkie sessions/attempts/reviews przed sprawdzeniem writes. PERSIST-02/05/06/07 określa wymagane integrity/replay semantics i ma pierwszeństwo przed optymalizacją.

Pierwszy wynik: poprawny persisted journal fixture i pełny materialize→verify→clear przy A100/1k/10k oraz spójnych sessions/reviews. Rozstrzygnąć konkretną regułę unrelated corruption: obecny pełny scan blokuje na uszkodzonym niezwiązanym rekordzie; targeted read nie może cicho osłabić tego kontraktu. Decyzja po review: zachować blokadę na unrelated corruption i użyć jednego repository-owned pełnego validated snapshotu w obrębie każdego wywołania verifiera, także do sprawdzenia declared targets. Assert i verifier współdzielą canonical reader; Set usuwa kwadratowe wyszukiwanie fizycznych kluczy. Targeted-only pomijające unrelated records nie spełnia przyjętej reguły. Nie twierdzić O(1) przy globalnym indeksie; reset wymaga pełnego scope.

AC: mniej dużych unrelated reads przy identycznych postconditions, profile fences, revisions, immutable attempts i journal-first. Wszystkie writes/deletions verified przed clear; fault po write/readback i corrupt declared/unrelated/index daje uzgodniony wynik, zachowując journal przy błędzie. Bez durability debounce.

## PERF-05 — bounded backend paging

Status: odebrane source/local/hosted CI 13.10.2026, independent Luna High PASS. [Decyzja, pomiar i weryfikacja](../../reports/perf05-bounded-paging-2026-10-12.md), [wyniki](../../reports/perf05-bounded-paging-2026-10-12.json). Backend producer dostarczony przez [PR1](https://github.com/lukaszkurczab/patternly-backend/pull/1); cloud deployment i native acceptance osobno. Severity historyczne: P2.

Kanoniczny `FirestoreProgressStore.readPage` czyta najwyżej pageSize+1 progress documents w document-ID order oraz cztery metadata/account documents przez dwa świeże getAll. Default/max pageSize100; opaque tokenv2 wskazuje pierwszy niewysłany lookahead, jest związany z user/revision/generation i wymaga exact cursor. Pre/post-query guards obejmują autoryzację, revision/generation, metadata updateTime i promotion lease. Strict validation obejmuje lookahead. Usunięto pełny snapshot/sort/slice z GET/v1/progress; readSnapshot pozostaje potrzebny adopcji/transferowi. Mobile production runtime już pobiera wszystkie strony przed restore i nie wymagał zmiany.

AC: bounded page, pełny sweep O(N), bez braków/duplikatów; stale/invalid token, account/generation change i zapis między metadata/query/readback jawnie odrzucane. Rzeczywisty SDK/emulatorN100/1k/10k: identyczne pełne outputhash; N10k med109,1→7,6s, returned progress docs1M→10099. To nie cloud billing ani UI latency. Actual producer→mobile consumer→application restore zachowuje212records,6requests; wymagany gate jest wersjonowany w backendCI. Exact-head hostedCI38314307054SUCCESS, app qa:static2524PASS/0FAIL/5SKIP (dwie cudze offline próby poza sourcepackage). Lokalny monolityczny błąd emulatora zachowano w raporcie; standardowy Linux/Java21 fullgate przeszedł bez zmian timeoutów, skipów ani writepath.

## PERF-06 — okno Activity i Review

Severity: P2.

Pliki: `src/features/home/ActivityScreen.tsx`, `src/features/review/MistakesReviewScreen.tsx`, `src/components/Screen.tsx` i istniejące model/navigation tests.

Historyczny baseline mapował wszystkie wiersze wewnątrz ScrollView. Kanoniczne ActivityView i MistakesReviewView używają teraz SectionList bez limitu historii; screen pozostaje właścicielem odczytu i operacji. Source, dopasowane ograniczone pomiary native, scroll/selection/return, normalne Activity/Review i zachowanie danych odebrane niezależnie 13.10.2026. [Dowody i ograniczenia](../../reports/perf06-list-windowing-2026-10-13.md): sampled RSS maxima oraz natywne callback rates, bez twierdzenia o absolute peak/presented frames/hitches. Końcowe dostarczenie helpera62e73229 ma [exact-source CI38330733575](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38330733575) obu jobsSUCCESS; PERF06 odebrane w opisanym zakresie. Derived model Activity nie był wykazanym bottleneckiem.

Poprawka: windowing obecnego presentation layer, bez cap/usuwania historii. AC: mounted rows zależą od viewportu, nie od pełnego datasetu; zachowane date/DST/locale grouping, sort/ties/filter, selected details, scroll/return, due/upcoming/unavailable i semantyczne accessibility props. Na jednym iPhone17 porównać Activity50/500/1000 i Review100/1000: mounted rows/commits, JS long tasks, peak memory i frames. Scroll/remount nie traci stanu. Bez testów VoiceOver zgodnie z PO. Nie wymaga PERF-02/03.

## Historyczny baseline potrzebny do zadań

Audyt02.10: app `200f8504c48df020d19937cad788d3961eb4caf7`, backend `019e48e7d8e074c2e45d7f5ebb639a4ad394ae8f`. Pomiary host/Metro/in-memory opisują ten snapshot/dataset, nie aktualny native startup ani zaobserwowany jank. Przed/po wymagają obecnego source-matched envelope zgodnie z taskami powyżej. Zachowanie tych liczb nie tworzy osobnej kolejki.

### PERF-01

- **Scenariusz/baseline:** pierwsze wejście przez `ContentPreparationGate`. Dziewięć importowanych artefaktów: **16 077 pytań, 55 614 763 B / 53,04 MiB JSON**. `verifyBundledPackages` z nowym ownerem, już zaimportowane moduły: **243,61 / 321,61 ms**, n=7; ten sam owner **0,006 / 0,006 ms**, n=100. Osobny świeży proces z GC: import `runtimeCatalog` **210,69 ms**, heap **17,09→92,03 MiB (+74,94 MiB)**; import ownera +2,50 MiB, pierwsza weryfikacja **343,30 ms**, +1,59 MiB retained heap. To trzy fazy hosta, nie składniki zmierzonego natywnego launch. RSS po weryfikacji 262,34 MiB nie jest miarą live heap ani dowodem wycieku.
- **Bundle:** rzeczywisty Metro graf `App.tsx`, iOS, `dev:false`, `minify:true`, resolver `release`: **60 370 848 B JS**, **6 839 220 B gzip-9**, **38 104 479 B Hermes bytecode**. 1755 źródeł; dziewięć JSON to największe moduły (największy Frontend Design 11 063 542 B). Rozmiary źródeł z sourcemap nie są udziałami w minifikowanym wyjściu. Eksport grafu z wejścia App, nie podpisana aplikacja ani produkcyjny eksport Expo z legal/config. Brak dodatkowego pomiaru download/startup wynikającego z gzip.

### PERF-02

- **Scenariusz/dataset:** `buildProgressTabModel` wywołany bezpośrednio przez `ProgressTab` przy każdym renderze, Coding bank **Q=3404**, A=100/1000/10000, R=100/1000/1000 unikalnych review refs. n=7 bez osobnego warmup, te same syntetyczne rekordy i dokładne content pins.
- **Baseline:** z kolejką **1,71/6,23 → 23,45/23,99 → 527,52/546,19 ms**. Bez kolejki **0,97/1,30 → 17,01/17,73 → 517,94/524,78 ms**. Problem występuje również przy R=0, więc nie wynika z nierealnej kolejki 10k duplikatów. To czas czystej projekcji JS, nie commit React ani liczba dropped frames.

### PERF-03

- **Baseline/scenariusz:** `HomePlanSnapshotReader.read`, **brak planu i celu**, brak sesji, A=100/1000/10000, R=100/1000/1000, n=7: **3,10/4,83 → 26,32/27,52 → 205,73/225,19 ms**. Dependencies zwracają gotowe tablice; wynik **nie obejmuje MMKV/deserializacji ani całego Home**. Nawet ten no-plan branch prosi dwukrotnie o attempts, sessions i reviews oraz sprawdza całe generacje.

### PERF-04

- **Dowód/baseline:** `src/application/learningMutations/mutationVerifier.ts:6` bezwarunkowo pobiera wszystkie sessions/attempts/reviews, zanim sprawdzi zadeklarowane writes. Sam `getTrainingAttempts` (`src/storage/repositories/trainingAttemptRepository.ts:7`) dla A=100/1k/10k: **0,78/1,46 → 5,85/6,96 → 64,26/66,35 ms**, **101/1001/10001** synchronicznych odczytów, **111 450 / 1 117 586 / 11 291 369 znaków** envelope/index. Licznik używa JS `.length`, nie rzeczywistych bajtów MMKV. To zmierzony składnik i source-backed zbędne odczyty względem write set; **nie czas całego submit/recovery**. Historyczna próba syntetycznego całego verifiera nie przeszła integrity setup; jej czasu nie użyto. Aktualny poprawny persisted-journal baseline i porównanie pełnego recovery z12.10 znajdują się w [raporcie PERF-04](../../reports/perf04-journal-readback-2026-10-12.md); to dowód kodu/codecs nad adapterem pamięciowym, bez native durability/UI claim.

### PERF-05

- **Scenariusz/dataset:** klient `src/infrastructure/clients/PatternlyApiClientAdapter.ts:731-742` pobiera strony po 100 do końca. Backend `src/modules/progress/store.ts:290` robi nieograniczone collection `.get()` i mapowanie, a `src/api/app.ts:839-875` sortuje całość i szuka kursora dopiero później. N=10k i pageSize=100 daje **10k dokumentów na stronę / 1 mln przez 100 stron**, wyliczone z kodu, **nie zmierzone billing/read units**. CPU pełnego sweep ma powtórne sortowanie O(ceil(N/P) × N log N); niepomijane pełne odczyty dominują dodatkowo poza syntetycznym testem.
- **Baseline:** rzeczywista skompilowana trasa Fastify, adapter in-memory z 10k syntetycznych rekordów, bez Firestore/network: strona **24,18/36,82 ms**, 25 próbek po 5 warmup, odpowiedź **37 066 B**; pełny sweep **2963,56/3015,11 ms**, 5 próbek po 1 warmup, 100 stron/10k zwróconych rekordów. Wcześniejszy pojedynczy przebieg rozmiarów 100/1k/10k dawał 0,627/2,723/23,323 ms mediany; nie używać różnic między seriami jako regresji.

### PERF-06

- **Scenariusz/evidence:** `src/features/home/ActivityScreen.tsx:86-139`, `src/features/review/MistakesReviewScreen.tsx:90-95,167-213`, `src/components/Screen.tsx:44-58`. `.map` całych grup/list wewnątrz zwykłego `ScrollView`, bez windowingu. Activity nie ma limitu historii: przy 20 próbach/sesję A=100/1k/10k oznacza **5/50/500** wierszy, dalszy test 1000 sesji. Review deduplikuje exact refs, lecz Q do 3404 w tracku pozwala na 1000 unikalnych entries; dochodzą unavailable refs. Zmiana wyboru szczegółów ponownie przelicza/renderuje całą listę.
- **Baseline:** actual `buildActivityModel` dla fixture w kształcie istniejącego testu, 30 próbek po 5 warmup: **0,020/0,024; 0,193/0,218; 0,891/2,219; 1,847/3,277 ms** dla 5/50/500/1000 sesji; model oddał dokładnie tyle wierszy. Sam model jest tani. Liczba renderowanych elementów wynika z mapowania źródła i liczby wyników; **nie zmierzono mount/commit time ani jank React Native**. Podstawa taska to realistyczny brak granicy liczby montowanych wierszy, nie twierdzenie o dropach klatek.

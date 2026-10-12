# PERF-03 — kanoniczny snapshot Home, 12.10.2026

## Cel i ustalenia przed implementacją

Cel produktu: świeży i spójny wynik Home przy mniejszym ponownym odczycie/parsowaniu danych. Nie zmieniać atomic goal+plan, due/timezone, profile lease A→B→A, journal/corruption rejection ani immutable history. Zakres: homePlanSnapshotReader, istniejący canonical input snapshot i testy produkcyjnej kompozycji. Bez trwałego cache ani nowego revision ownera.

Aktualny readLearningPlanInputSnapshot synchronicznie czyta goal/plan/attempts/reviews/sessions/active, waliduje indexed active pointer, journal i scope. Home następnie ponownie pobiera active/session asynchronicznymi portami oraz cały snapshot przed i po tych awaitach. Dwie generacje i dodatkowe checks wokół exact package await i przed publikacją są rzeczywistymi fences.

Hipoteza: jawnie pełny kontrakt snapshotu (sessions i activeSession wymagane), jeden owner tych odczytów; usunąć osobne query ports Home i redundantny drugi odczyt w readGeneration. Zachować generational equality, final post-package read, final pre-publish guard i lease identity; nie uzasadniać zmiany samą jednowątkowością JS. Niezależny design review LunaHigh PASS przed implementacją (szczegóły poniżej). Ocena wstępna cel/architektura0,95/prostota0,92/ryzyko0,85/utrzymanie0,94, minimum0,85; decydują testy zmian przy await i pełna walidacja snapshotu u obecnego ownera.

Metoda: Node22, actual default Home dependencies i canonical codec nad MemoryKeyValueStorage; syntetyczne persisted rekordy, nie gotowe tablice dependencies. A100/1000/10000, R≤1000, plan/no-plan, active/no-active. Zliczyć getString, znaki odczytanych serialized envelopes, guards poprzez rzeczywistą walidację, czas med/p95; porównać exact fixture/output hash przed/po. Read characters to znaki JS string, nie bajty MMKV ani profiler alokacji. Brak native/UI latency claim. Oddzielnie fail-closed mutation/profile/journal/corrupt tests i wymagane gates. Rzeczywiste zabezpieczenia pozostają warunkiem odbioru, a nie sam spadek liczby odczytów.

Capability probe przed budową narzędzia: actual default reader + puste MemoryStorage zwraca none,40getString (journal12,goal4,plan4,attemptindex4,reviewindex4,sessionindex6,active6). Pierwsza próba szerszego fixture zakończyła się generic failure i nie dostarczyła pomiaru; zawężenie do startu sesji ustaliło session_start/missing_content. Source resolveForPreparation wymaga zgodności node z wybranym mode; first question nie ustanawia tej zgodności. Start z getMode(...).selection.nodeId przeszedł actual production lifecycle i canonical journal w testowym storage. Nie dotknięto urządzenia, prywatnych profili ani usług. Nie powtarzać pierwszego wyboru node ani osłabiać admission.

Niezależny design review LunaHigh PASS: cel0,94/architektura0,88/prostota0,90/ryzyko0,82/utrzymanie0,90, minimum0,82. Warunki: required complete snapshot, bez optionalfallback; zachować outer generations/post-package/source fences. Nie rozszerzać tego slice na ProposalCoordinator ani readHomeShellInputSnapshot. Pierwszy rozszerzony benchmark odrzucił fixture w goal_plan_fixture; normalizeLearningPlan wymaga co najmniej jednego slotu. Narzędzie poprawiono na sloty zgodne z preferredDays i executionPolicy, zamiast osłabiać walidację. Brak prawidłowego baseline z odrzuconej próby.

Baseline12wariantów ukończony; narrow freshness4/4 przed zmianą i5/5 po zmianie PASS. Typecheck wykrył kolizję nazwy publicznego licznika reads z private polem MemoryKeyValueStorage w narzędziu; licznik nazwano readCount, bez zmiany mierzonego kontraktu.

## Wynik implementacji i pomiar

CompleteLearningPlanInputSnapshot wymaga sessions/activeSession, zachowując optional proposal contract. Home korzysta z jednego synchronous validated ownera w każdej generacji; usunięto dodatkowe getActiveTrainingSession/getTrainingSessions ports, drugie readInputs wewnątrz generacji oraz używane wyłącznie przez te ścieżki unwrap/validate helpers i HomePlanReadFailure. Zewnętrzne dwie generacje nadal mają await/microtask granicę i pełne porównanie; post-package generation, prepublish input guard i HomeScreen fences pozostają. Production read failures już wcześniej były storage_error; usunięta prywatna klasa obsługiwała wyłącznie usunięte injected-query paths. Repo API sesji i HomeShell/ProposalCoordinator nie zmieniono. Reference check zastąpionych portów obejmuje wszystkie custom Home dependencies; integration fixtures korzystają z canonical ownera.

[Surowe wyniki liczbowe](perf03-home-snapshot-2026-10-12.json): 12/12 exact input/outputSHA zgodnych, każde wejście także niezmienione przez pomiar. Node22, n7/warm1, Coding3404 pytań; R0/100/1000 odpowiednio dla A100/1000/10000, S=A/10. Historia jest syntetyczną codec-valid historią nad MemoryStorage, nie zapisem wszystkich sesji wykonanych przez runtime; aktywna sesja powstała przez production startSession. Nie dowodzi poprawności każdego hipotetycznego historycznego mode/node. Typecheck działał podczas części aftermeasurement: wyniki czasu nie są izolowanym profilerem. Mniejsze plan-present warianty mają mieszane med/p95; nie twierdzimy, że każdy wariant przyspieszył. Przy dużej historii mediana spadła znacznie; powtarzalne reads/chars spadły we wszystkich wariantach. Pozostały koszt strict integrity reader i projectLearningEvidence nie jest naprawiany w tym slice.

| A | Plan | Active | med ms przed→po | p95 ms przed→po | getString przed→po | znaki przed→po |
| --- | --- | --- | --- | --- | --- | --- |
| 100 | False | False | 14.90→9.81 | 20.44→12.68 | 1000→476 | 669524→294702 |
| 100 | False | True | 12.97→7.86 | 16.75→11.38 | 1024→484 | 730496→315026 |
| 100 | True | False | 38.33→41.47 | 38.81→60.74 | 1738→952 | 1162599→595668 |
| 100 | True | True | 42.32→39.99 | 47.39→45.14 | 1778→968 | 1264219→636316 |
| 1000 | False | False | 170.47→106.18 | 177.97→116.08 | 10080→4836 | 6995528→3098424 |
| 1000 | False | True | 170.95→146.26 | 178.04→155.73 | 10104→4844 | 7056500→3118748 |
| 1000 | True | False | 449.71→490.45 | 568.53→524.62 | 17538→9672 | 12053466→6203112 |
| 1000 | True | True | 485.90→484.48 | 536.71→544.20 | 17578→9688 | 12155086→6243760 |
| 10000 | False | False | 6753.45→3158.15 | 7055.62→4229.76 | 100080→48036 | 70804866→31353486 |
| 10000 | False | True | 6740.44→3262.80 | 6887.07→3560.55 | 100104→48044 | 70865838→31373810 |
| 10000 | True | False | 13141.65→8022.55 | 13249.27→12120.68 | 174138→96072 | 121895004→62713236 |
| 10000 | True | True | 12858.30→7908.33 | 13199.61→8192.98 | 174178→96088 | 121996624→62753884 |

Walidacja strict guards faktycznie wykonywana przez default dependencies; narzędzie nie zlicza bezpośrednio wszystkich nested guard calls. Reads/chars są bezpośrednimi licznikami, bez claim o native MMKV bytes, heap allocations albo UI latency. Typecheck po zmianie nazwy licznika EXIT0, narrow5/5PASS. Pełny qa:static EXIT0:2526total/2521PASS/0FAIL/5SKIP,244177ms; recovery514sources/379testfiles/2408cases, typecheck/contentboundary/runtimeprivacyPASS. Private log artifacts/private/perf03-home-20261012/qa-static.log0700/0600. Final independent LunaHigh acceptance PASS: pełny kontrakt/fences,12hashpairs/stabilne7samples i derivedguardformulas potwierdzone. Localgate obejmuje zastane obce offline-account edits; dostarczany pakiet je wyklucza, exact-package hostedCI pozostaje osobnym dowodem. Bez build/install/reset/profile switch/device/external effects w PERF03.

Dodatkowy licznik guardów w JSON jest **wyprowadzony ze sprawdzonego call graph**, nie instrumentowany: A=attempts, R=reviews, S=terminal sessions, a=0/1 active. No-plan przed:4A+4R+6(S+a)+6a canonical evidence-record guards oraz2(S+a) legacy session-array guards; po:2A+2R+2(S+a)+2a. Plan przed:7A+7R+10(S+a)+10a oraz3(S+a) array guards; po:4A+4R+4(S+a)+4a. Excludes index/envelope/pointer-string i nested domain/projection guards. Powód: jeden canonical read wykonuje po jednym guardzie dla każdego rekordu attempt/review/indexed session oraz dodatkowy session guard dla active pointer; wycięte ports dodawały session+active read i array scan. Independent reviewer samodzielnie potwierdził call graph/formuły. Dla A10k/R1k/S1k/active: no-plan canonical evidence guards50012→24004 i array2002→0; plan87020→48008 i array3003→0. Nie zmienia to surowych pomiarów.


Source-package58ef26d54dda1d879f2529132e51bcf3b84e2c33 commit/pushSUCCESS. [Exact hostedCI38285793632](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38285793632) oba jobsSUCCESS:2524total/2519PASS/0FAIL/5SKIP, multi-trackcontracts3/3, generatednative/recovery/typecheck/contentboundary/runtimeprivacyPASS. Dwa testy mniej niż localworkingtree wynikają z wyłączonej foreignofflineaccount poprawki. Private exactlog artifacts/private/perf03-home-20261012/ci-38285793632.log0600. Receipt pozostaje lokalny do następnego sourcepackage, bez metadata-onlypush.

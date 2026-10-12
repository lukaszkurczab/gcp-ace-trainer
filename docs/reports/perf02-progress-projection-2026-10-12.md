# PERF-02 — projekcja Progress, 12.10.2026

## Cel, ustalenia i podejście przed implementacją

Cel produktu: zachować pełny model postępów i rekomendacji, usuwając zbędne przeszukiwanie banku dla każdej próby/powtórki. Zakres: progressTabModel, testy zachowania i odtwarzalny pomiar. PERF-01 nie blokuje tego zadania (specyfikacja performance.md). PERSIST-11 pozostaje otwarte z osobnym ograniczeniem integracji natywnej. Cudze lokalne poprawki offline AccountSessionProvider i jego testów pozostają poza zakresem; bez urządzenia, builda, resetu, zmian danych lub usług.

Źródła: buildInstalledPackageProgressTabModel używa find dla każdej próby; Coding kwalifikuje próby przez some, buildCanonicalProgressFacts skanuje nodeQuestions dla reviews i sortuje latest mimo użycia wyłącznie has/size. Evidence wielokrotnie sortuje te same uporządkowane już listy. Dotychczasowy historyczny benchmark nie zastępuje obecnego baseline.

Hipoteza: jeden Map questionId→summary w obrębie wywołania, współdzielony przez facts/qualification/evidence; jedna agregacja due per node przy identycznych predicates; membership Set bez sortowania w facts; jeden porządek answeredAt/id dla evidence, node windows przez slice i global trend z globalnej kolejności. Bez trwałego cache i nowej polityki nauki. Istniejące różnice qualifying predicates zachować; ich zmiana wymaga osobnego potwierdzonego defektu. Admitted question identities są unikalne, sprawdzić kontrakt przed użyciem mapy.

Ocena: cel/architektura0,96; prostota0,94; kontrola ryzyka0,90; utrzymywalność0,95; minimum0,90. Ryzyko: kolejność przy remisach, kwalifikacja mixed tracks/pins i latest windows. Niezależny design review Luna High przed zmianą modelu.

Weryfikacja: najpierw aktualny realmodel Node22 baseline Coding i FrontendDesign A100/1000/10000 × R0/100/1000, warmup3/n15, med/p95, hash wszystkich18wejść i wyjść; syntetyczne rekordy na rzeczywistych dopuszczonych pakietach, bez prywatnych danych. Następnie exact before/after output parity, testy mixedtrack/version/hash, ties, windows, due/manual/repeated, partial i unscored; typecheck i wymagane qa:static. Kryterium odbioru: mniejszy zmierzony CPU koszt projekcji i brak scanQ na każdą próbę/review przy niezmienionych outcomes i danych wejściowych. Brak twierdzenia o native/React latency, pamięci lub dropped frames. Odbiór PERF-02 nie zastępuje PERF-01/03–06 ani bramek wydania.

Próba narzędzia: top-level await w pliku TS odrzucony przez rzeczywisty tsx/CJS przed wykonaniem modelu; funkcja main odpowiada konfiguracji repo. Bez osłabienia testu.

Baseline ukończony Node22.22.3: CodingQ3404/A10k/R0,100,1000 median796,54/780,92/775,20ms; DesignQ1766/A10k median89,27/89,11/93,39ms. 18output/inputhash stabilne n15. Nowe testy zachowania3/3 przechodzą również na starym modelu. Unikalność questionId egzekwuje validateCanonicalArtifact w questionValidation.ts (duplicate identity odrzucane przed prepared discovery).

PERSIST-11: independent LunaHigh potwierdził brak wspieranej ścieżki app-owned C++ integracji bez CocoaPods lub ręcznej edycji explicit pbxproj. Brak synced folders. Compile wewnątrz NitroMmkv nie dowodzi consumer linkage ani thread safety. Nie dodano pustego seam/private header workaround; ograniczenie pozostaje w raporcie PERSIST-11.

## Zmiana i pomiar po implementacji

Jedna mapa admitted questionId→summary w każdym odczycie zastępuje find/some i jest przekazywana do facts/evidence. DueByNode inkrementuje każdy wpis według niezmienionego szerszego predykatu facts; główna kolejka i evidence nadal mają własne dokładniejsze filtry. PracticedIds używa wyłącznie membership; evidence sortuje raz po answeredAt/id, dzieli uporządkowane dane na node i pobiera okna przez slice. Globalny trend pochodzi z globalnej kolejności, nie z kolejności grup. Usunięto PackageProgressItem z rekonstruowaną taxonomy i nieosiągalnym fallbackiem oraz takeLatestAttempts wykonujący ponowny sort; refcheck wykazał wyłącznie lokalnych zastąpionych konsumentów. Admission odrzuca duplicate question identities, a persisted attempt index wymaga unikalnych IDs; nie rozszerzono kontraktu na nieprawidłowe duplikaty.

[Pełne próbki, piny i hashe](perf02-progress-projection-2026-10-12.json), Node22.22.3, warmup3/n15, syntetyczne dane na rzeczywistych pakietach. P95 to nearest-rank dla n15, czyli największa próbka; nie jest estymacją dużej populacji.

| Track / A10000 / R | mediana przed→po (ms) | p95 przed→po (ms) |
| --- | --- | --- |
| Coding / 0 | 796,54→10,89 | 980,62→13,65 |
| Coding / 100 | 780,92→7,02 | 903,02→8,06 |
| Coding / 1000 | 775,20→7,50 | 896,99→8,94 |
| Frontend Design / 0 | 89,27→2,70 | 135,40→3,51 |
| Frontend Design / 100 | 89,11→2,81 | 96,33→4,53 |
| Frontend Design / 1000 | 93,39→2,05 | 101,91→3,19 |

Wszystkie18input/outputhash identyczne before/after, wszystkie próbki deterministyczne. To potwierdza CPU projekcji, nie native/UI latency. Benchmark nie obejmuje storage I/O, weryfikacji contentu ani przyrostu pamięci. Wartości między R nie ustalają przyczyn zmian kosztu ani budżetu UX. GCP cloudProgress branch pozostaje bez zmian; instalowane inne tracks używają tej samej ogólnej mapy, z dotychczasowymi exact predicates.

Narrow tests22/22PASS po zmianie (cztery nowe i istniejące Progress suites); piąty test osobno dodany zgodnie z independentreview i obejmuje szerszy facts predicate. Typecheck EXIT0. Pełna qa:static EXIT0:2522total/2517PASS/0FAIL/5SKIP,243827ms; recovery/typecheck/contentboundary/runtimeprivacyPASS. Wszystkie pięć nowych testów zachowania objęte tym przebiegiem. Bieżące źródła lokalne zawierają także cudzą poprawkę offline-account; pełny lokalny wynik dotyczy tego drzewa. Te pliki nie należą do pakietu PERF-02; exact source-package hostedCI odbierze jego SHA oddzielnie.

Independent design LunaHigh PASS z warunkami, minimum0,90; warunki zachowane. Read-only acceptance już samodzielnie potwierdził18paritypairs, przeliczył36median i sourcehash after, pełna bramka przekazana do finalnego odbioru.

Jedyny nieudany test baseline miał błędne oczekiwanie etykiety Review due; aktualny getCurrentFocusStatus jawnie zwraca Needs remediation dla remediationDueCount>0. Skorygowano oczekiwanie przed zmianą modelu. Odczyt CI CH07 wymagał dostępu gh do cache poza workspace; ponowiony z właściwym uprawnieniem zakończył się sukcesem, bez zmiany testów lub efektów aplikacji.

## Odbiór lokalny

Final independent LunaHigh acceptance **PASS** po samodzielnym odczycie pełnego logu, źródeł, referencji i wyników. Reviewer przeliczył wszystkie36median/p95, potwierdził baselinehash==HEAD oraz afterhash==current source,18exactpairs, niezmienione distinctpredicates i entrycounts. Brak pozostałych referencji usuniętych helperów. PERF-02 odebrane w wymaganym zakresie projekcji CPU; usunięte z kolejki. Source-package push/exactCI pozostają sprawdzeniem dostarczenia, osobno od nativeUI/pozostałychPERF/PERSIST/GO.

Pakiet dostarczono na main jako `9e0f5691934fe80cc625ded8a88b240efe139bb1`. [Exact CI38282891666](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38282891666) oba jobs SUCCESS:2520total/2515PASS/0FAIL/5SKIP,contentcontracts3/3,generatednativePASS. Dwa dodatkowe testy obecne w lokalnym przebiegu należą do zachowanej, niewłączonej poprawki offline-account; exactCI weryfikuje wyłącznie dostarczony pakiet. Receipt nie wymaga metadata-only push; przenieść z następnym source-package.

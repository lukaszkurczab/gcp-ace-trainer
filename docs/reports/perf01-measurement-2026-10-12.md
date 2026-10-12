# PERF-01 — pomiar startupu, 12.10.2026

## Cel i ustalenia przed implementacją

Źródło: [PERF-01](../specs/engineering/performance.md), [plan](../PATTERNLY-WORKING-PLAN.md). Jeden obszar: rzeczywisty pomiar granic startupu/recovery, bez optymalizacji przed dowodem; późniejszą zawężoną korektę opisuje sekcja pomiaru. Baseline app `62cfaf2e2dc8c199d92f99ad28de9bcd4a3d6a22`, content `26198b7b1bce18048d97e07bfb7efe0f6e67c8b0`, backend `4d8efbd6cab8f8fc31d39970fd8e6abb1a0c45eb`, web `051fe5376d4781d3ec88ba0c41535b1d224ceb0b`. Zastane zmiany Markdown w app/content zachowane; główne normatywne docs pozostają w workspace.

Podejście: ograniczony ślad monotonicznych znaczników w RAM, wyłącznie `__DEV__` + smoke + jawne `EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE=1`. Zamknięte nazwy etapów, bez payloadów, identyfikatorów, błędów, danych profili i zapisu na urządzeniu. Instrumentacja obserwuje istniejące granice: dynamiczny require regular root, account/storage preparation, ContentPreparationGate, repository/recovery, walidacja/hash/indexy/katalog. Bez nowego ownera danych, zmian kolejności await, limitu 15 s ani resetu. Osobny Metro8082 w primary app, standardowy entry Expo; istniejący binary i iPhone17, bez instalacji/builda. Prywatne logi i snapshoty nie są artefaktem publicznym.

Weryfikacja pakietu: testy izolacji trace (off/release/sandbox, bounded buffer, nieudany zegar), właściwe istniejące testy bootstrap/catalog/diagnostics, typecheck i bramki repo; native odczyt ma wskazać actual entry/source, czasy etapów, wynik UI oraz dostępność pomiaru heap. Cold oznacza nowy proces aplikacji, warm oznacza powrót z tła bez restartu JS; żaden wynik debug Metro nie jest pomiarem finalnego release/HBC. Nie zastępujemy braku heap/HBC zerem. Zachowanie profili kontrolować kategoriami; bez login/reset/newGuest/adoption.

Wymagania produktu: pełne Free offline, Premium, exact pins/schema/hash/semantics i historia bez zmian. Odbiór tej części daje pomiar, nie zamknięcie całego PERF-01 (redukcja kosztu wymaga dowodu i osobnego konkretnego projektu). Bramki usług/fizycznego urządzenia/wydania pozostają w R/ODK.

Ocena podejścia root: cel/architektura 0,94; prostota 0,90; ryzyko 0,90; utrzymywalność 0,90; minimum 0,90. Powód: same obserwacje RAM, brak nowych storage kontraktów; bounded dev-only bridge. Niezależny review: Luna High, tylko projekt i QA, bez potomków/edycji. Ryzyko: narzut debug i instrumentacji; wyniki opisywać w tym envelope, bez uogólnienia na release. Pierwszy real probe: simctl sandbox odmówił XPC, odczyt z właściwymi uprawnieniami potwierdził istniejący booted iPhone17; Metro8081 zwraca zero inspector targets. Wolne miejsce 7,8 GiB; nie uruchamiamy builda ani równoległej ciężkiej kontroli.

## Zawężenie po rzeczywistym pomiarze

Dwa finalne cold baseline przy `CI=1` (bez watch/HMR), istniejący binary/Guest/dataset: katalog 6797/6571 ms; rekonstrukcja poprzedników (`structuredClone` + zmiany wyłącznie pól root + stringify) 2516/2332 ms; walidacja 1355/1337 ms; tworzenie track runtime 1864/1818 ms. Home data commit 11461/10863 ms od pierwszego znacznika dynamicznego require (nie od native launch). Warm: ten sam PID, inactive/background/active, bez ponownego katalogu/bootstrapu. N=2 nie ustanawia p95/SLO. Pierwsze próbne przebiegi z watch nie wchodzą do finalnego porównania; nakładka Refreshing uzasadniła zmianę warunków i powtórkę.

Najmniejsza hipoteza naprawy: zastąpić głębokie klonowanie poprzednika płytką kopią root. Kod zmienia tylko trzy pola root, a następnie serializuje/hashuje; nie modyfikuje zagnieżdżonych pytań. Zachować dokładne bajty poprzednika i wszystkie runtime hash checks, dziewięć pełnych banków, kolejność i immutable pins. Bez lazy loading, nowych pakietów, cache trwałego i zmian admission. Sprawdzić niezależnie exact bytes wszystkich dziewięciu rekonstrukcji względem dotychczasowego deep clone, brak mutacji źródeł i istniejące odmowy corrupt hash/cache retry. Następnie full qa:static i before/after native w identycznym envelope oraz ochronę danych.

Oceny root dla korekty: cel/architektura 0,96; prostota 0,97; ryzyko 0,92; utrzymywalność 0,95; minimum 0,92. Usuwa zbędną kopię całego drzewa przy edycji wyłącznie root; nie osłabia walidacji. Niezależny design review Luna High: PASS WITH ISSUES, cel 0,97 / architektura 0,96 / prostota 0,97 / ryzyko 0,94 / utrzymanie 0,95, minimum 0,94. Warunki: exact bytes dziewięciu poprzedników, brak mutacji, runtime hash checks i porównywalny native before/after. Test dodano i uruchomiono przed zmianą: 8/8 PASS na starym algorytmie. Cały PERF-01 nadal obejmuje inne koszty eager load/peak heap/release i pozostaje w planie; ta korekta ma osobny, mierzalny odbiór w ramach tego samego obszaru.

W trakcie pracy zastane poprawki dokumentacyjne zostały zapisane przez innego wykonawcę jako app `39e607fd` i content `58d7e8b`; zachowane bez cofania. Diff app `62cfaf2e..39e607fd` obejmuje wyłącznie 7 plików Markdown, content zmienia README. Nie zmieniło to źródeł/datasetu pomiaru.

## Wynik lokalny korekty

Usunięto zbędną głęboką kopię banków w rekonstrukcji historycznej tożsamości. Pozostała jedna kanoniczna ścieżka: płytka kopia root → te same trzy zmiany root → ta sama serializacja → obowiązkowy exact hash poprzednika. Wszystkie pełne banki, walidacja bieżących artefaktów, projekcje, Premium, Free offline i piny pozostają bez zmian. Jedyny pozostawiony deep clone w tym obszarze jest niezależnym wzorcem testowym, a nie alternatywnym runtime. Nie zmieniano timera, timeoutu 15 s, danych, producerów, locków ani zależności.

[Wyniki liczbowe i hashe receiptów](perf01-measurement-2026-10-12.json). Dwa cold before i dwa cold after, te same warunki, brak HMR:

| Pomiar | Before 1 / 2 | After 1 / 2 |
| --- | ---: | ---: |
| Dynamiczny require regular root | 3315 / 3343 ms | 3260 / 3175 ms |
| Katalog, cały build | 6797 / 6571 ms | 4387 / 4381 ms |
| Rekonstrukcja root poprzedników + stringify, 9 banków | 2516 / 2332 ms | 232 / 237 ms |
| Walidacja artefaktów, 9 banków | 1355 / 1337 ms | 1333 / 1321 ms |
| Budowanie runtime’ów ścieżek | 1864 / 1818 ms | 1787 / 1784 ms |
| Bieżąca skuteczna próba ContentPreparationGate | 6156 / 5875 ms | 4158 / 4148 ms |
| Home data React commit od pierwszego markera require | 11461 / 10863 ms | 9064 / 8510 ms |
| Obserwowany JS heap used, bez forced GC | 122236272 / 118516352 B | 93612464 / 97151400 B |

Mediana czasu katalogu spadła o **34,4%**, a Home data commit w tej mierzonej granicy o **21,3%**. To N=2 i debug/smoke; nie jest p95/SLO ani obietnica wydajności release. Heap to pojedyncza próbka po gotowości, bez porównania GC/peak/RSS; nie przypisujemy całej różnicy użycia pamięci samej korekcie. Koszty tabeli są zagnieżdżone — nie sumować ich jak niezależnych etapów. Dwie próby gate częściowo nakładają się przy przekazaniu profilu; numeric span koreluje begin/end/cancel. Oba finalne after cold osiągnęły ready, trace 196 wpisów, bez truncation. Recovery od wejścia fazy do verifying-content: pierwsze próby ~16 ms, końcowe ~4 ms. Bootstrapowe odtworzenie aktywnej sesji do ready: before ~12–13 ms, after ~19–20 ms. Nie naciskano Resume ani nie otwierano sesji, nie mierzono timera.

Warm before/after zachował odpowiednio PID54888/PID55520, te same trace events sprzed tła i nową sekwencję inactive/background/active; bez ponownej walidacji/katalogu/bootstrapu. Screenshoty final-cold1/2, after-cold1/2 i warm potwierdzają Home z aktywną sesją i widocznym przyciskiem Resume. `home_data_commit` oznacza załadowane dane po React commit, a screenshot późniejszą widoczność; nie jest to dokładny native first-paint timestamp ani timing animacji foreground.

### Envelope i provenance

- Istniejący iPhone17/iOS26.4, ten sam zainstalowany development binary, bez build/install/reinstall/reset. Binary SHA256 `fd53c0ea77a5ccbae54a3fa59783ef585b98d66eed6688ba191d6e8d33d0cdc7` przed/po. Nie kwalifikujemy go jako nowego release candidate.
- Node22.22.3, Hermes potwierdzony w rzeczywistym Runtime.evaluate. Własny primary Metro8082, `CI=1`, log potwierdza wyłączony watch/reload; standardowe `node_modules/expo/AppEntry`, smoke + trace=1, dev/lazy envelope. Potwierdzono właściwy app/device target i nowe correlation/Home/AppState markery z bieżących źródeł.
- Manifest i served-bundle preflight zachowano prywatnie. Serwowana odpowiedź dla udokumentowanego AppEntry request to tekstowy JS mimo transform.bytecode=1: before **68069217 B**, SHA256 `635b13303a9ddfec63729fba799f644af162bcc2d2a5df91a78a3fb3bbdb3bad`; after **68069324 B**, SHA256 `cb72c51af65c08389aa05bd5515eabf184b7cf1d7f01f2738c639a1ca5b1eb20`. To fingerprint odpowiedzi na ten request, nie dowód identyczności wszystkich lazy requests ani release HBC. Nie zmniejszano banku/bundle.
- Prywatny source envelope hashuje uporządkowane rows path+SHA256 dla wszystkich src + App/config/dependency locks. Before `89dfd5d3515e3b6d8cb78b0704f78392e3f2805172a689b9e645648d69781aa2`, after `c8011290686fe601f6e7b702243ae2f68fdf4107fc8bea1daf8422ac14686f02`. Jedyną zmianą źródeł między zmierzonymi wariantami są runtimeCatalog i jego test; produkcyjnie shallow root copy + komentarz. Dataset/locks/dependencies i konfiguracja są identyczne. Content lock SHA256 `dcf09fa757871f5a2c8eebb353ebcbf3b8a56df2a8f75340cff86b29b0d9f401`.
- Całkowita ocena bundle/Expo/App sprzed dynamicznego require, release HBC, native first paint i inne profile nie zostały zmierzone. Historyczny timeout z 08.10 nie wystąpił w tych finalnych przebiegach; pomiar wskazuje obecny koszt katalogu, nie ustanawia przyczyny tamtej próby.

### Ochrona danych i nieudane próby

Przed startem aplikacja nie działała; zapisano prywatny physical baseline38 plików i kopię obu MMKV. Po wszystkich cold/warm i zatrzymaniu własnej aplikacji: 38 plików; **oba MMKV byte-identical**, a więc wszystkie przechowywane w nich rekordy profili, postępu, ustawień, sesji/timerów, lifecycle i pakietów identyczne. Końcowy istniejący storage owner: inventory observed/complete, 12 profili, jeden Guest, 433 klucze, **0 nieklasyfikowanych kluczy**; kategorie learningProgress/settings/profileLifecycle/packagePointers/premiumCache/premiumTestRuntime i globalne są rozpoznane. Nie deklarujemy nowego odbioru encrypted/keychain recovery; nie zmieniano kluczy ani providerów.

Jedenaście zmienionych ścieżek physical: 3 SDK/network metadata (Firebase heartbeat, sqlite WAL/SHM HTTPStorages) oraz 8 usuniętych/utworzonych ścieżek SplashBoard snapshotów przy background/foreground (po 4 stare/nowe, nie osiem nowych danych profilu). Producer Firebase potwierdzony w `ios/Pods/FirebaseCoreInternal/.../StorageFactory.swift`; HTTP namespace i jego schema alt_services zostały sklasyfikowane w [poprzednim probe](persist11-probe-2026-10-12.md). SplashBoard jest cache obrazu sceny iOS; brak konsumentów tych namespace w appsrc. Nie ma niesklasyfikowanej zmienionej ścieżki. Pozostałe pliki identyczne. Nie twierdzimy whole-container equality. Dane i receipts pozostają prywatne 0700/0600 w `artifacts/private/perf01-20261012`.

Nieudane próby nie są PASS: simctl z sandboxa wymagał odczytu XPC z właściwymi uprawnieniami; pierwszy screenshot wymagał bezwzględnej ścieżki. CDP z Origin localhost nie odpowiadał, ponieważ guard Expo oczekiwał 127.0.0.1; poprawiony Origin zadziałał bez zmiany zabezpieczenia. Starszy helper eksportu wymaga IPv4, a listener był IPv6: census wykonano bezpośrednio przez istniejący initialized owner z poprawnym transportem, bez otwierania drugiego store. Prototype watch/HMR przebiegi wyłączono z finalnej tabeli. Collector działa read-only, ale jego bounded Runtime.evaluate zajmuje JS thread po zebraniu timingów; nie deklarujemy zerowego narzutu odczytu.

### Weryfikacja i pozostały zakres

- Test nowego kontraktu exact bytes/source immutability dla 9 banków: baseline 8/8 PASS; po shallow correction 8/8 PASS. Istniejąca odmowa złego ledger hash/cache retry zachowana.
- Trace/collector: 12/12 PASS; wcześniejsze celowane bootstrap/catalog/diagnostics 59/59 PASS przed korektą; finalne qa:static obejmuje je ponownie. Typecheck, recovery inventory, content boundary i privacy boundary: PASS wykonane lokalnie.
- Full qa:static, pierwsza próba: 2493 PASS / 10 FAIL / 5 SKIP. Dziewięć błędów to `listen EPERM 127.0.0.1` w sandboxowych mock HTTP/WS tests; dziesiąty to source-regex zakładający sąsiednie await bez instrumentacji. Test dostosowano do dokładnego try/finally, kolejności await i braku catch; runtime bez zmian. Narrow recovery surface 12/12 PASS i independent review tej korekty PASS. Ta test-only zmiana po pomiarze nie zmienia mierzonego runtime; zapisany source envelope opisuje moment pomiaru, nie późniejszy snapshot testów.
- Ponowienie full qa:static z dostępem loopback: **EXIT0, 2503 PASS / 0 FAIL / 5 SKIP**, 257026 ms. Recovery inventory514source/375tests/2392cases, typecheck, content boundary i privacy boundary PASS. Skips: cztery istniejące real HTTP/emulator recovery tests oraz opcjonalny lokalny artefakt CC04; nie są nowym odbiorem usług. Private log `qa-static-loopback.log`0600. `git diff --check` PASS.
- Niezależny końcowy source/metrics review Luna High: PASS WITH GAPS, jedynym brakującym warunkiem była pełna bramka; reviewer samodzielnie wykonał catalog/collector14/14 i przeliczył mediany. Osobny review poprawionego testu: PASS. Po odczycie końcowego wyniku, raportu, planu i handoffu reviewer wydał finalne **PASS**. Pozostałe ograniczenia pomiaru nie są przedstawione jako release acceptance. Nazwa etapu `predecessor_clone_stringify` pozostaje stała dla porównywalności before/after; obejmuje obecną kopię root i stringify, zgodnie z tabelą.

Lokalnie odebrano ten konkretny hotspot i odtwarzalny pomiar, nie cały PERF-01 ani SIM-READY/GO. Pozostają pozostałe koszty eager content/track runtimes, brakujące granice pomiaru PERF-01, PERF02–06 oraz wszystkie otwarte CH/PERSIST/R/ODK według jedynego planu. PERSIST11≤5s i native13 nie zostały zmienione ani odebrane przez te pomiary.

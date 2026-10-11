# PERSIST-11 — rozpoznanie i rzeczywisty probe capability

Status: NIEODEBRANE; natywny pomiar nie wykonany. Zatwierdzony limit5s nie został zmieniony. Source98ab5b48. Android/physical release evidence i końcowe native13 odrębne.

## Fakty i brakujący dowód

Domain foregroundTimerState interval15000/maxdrift1000; ForegroundSessionTimer checkpoint od14000ms. Fake scheduler facade test13,999ms→resume0 potwierdza nominalny logical gap, nie rzeczywisty Hermes loss. Composition używa performance.now (fallback Date.now) oraz setInterval1000. AppState/focus callbacks nie gwarantują wykonania przed abrupt kill/stall. Wyłącznie zmiana stałej na4s nie gwarantuje zatwierdzonych5s przy opóźnieniu JS; projekt takiej zmiany odrzucony min0,55. Bez implementacji/fake PASS.

Dokładnie brakujący pierwszy fakt: czy rzeczywisty Hermes na istniejącym binary wykonuje callbacks z opóźnieniem przy bounded6s synchronous stall i jak zachowuje performance.now/Date.now. To capability fact, nie recovery-loss acceptance. Dopiero po nim można zaprojektować isolated production timer/storage fixture z checkpoint→kill→coldread, background/closedtime zero, delays i save/read failures. Nie odtwarzać aktywności z czasu zamknięcia. Native independent scheduler wymaga material design review; nie wprowadzono nowego ownera.

## Bezpieczna przygotowana próba

Jeden istniejący iPhone17 UUID7F315654-3175-4F3C-BB24-B0263F59360C/iOS26.4, Booted. Fresh appcontainer88E6BF8E-AED3-4F70-BDDC-83AFA072BDEC, bundleE3AD78BE-5282-4BAC-8AA2-124160EF77F8. Brak procesu Patternly, obcy Metro8081/launcher96268/emulatory bez zmian. Ostatni canonical readback ma12profili/1Guest/activeS/T, więc zwykły start odrzucono jako sposób probe.

Przygotowano tymczasowy private probe-app wyłącznie React Native View/Text/AppRegistry main i no-storage instrumentation; bez importu appsrc/storage/account/lifecycle. Niezależny design APPROVE minimum0,84: cel0,95/arch0,91/prostota0,84/ryzyko0,92/utrzymanie0,86. Nie jest to review zgodności całegoP11.

Własny Metro8082 z istniejącymi zależnościami. Pierwsza próba z Nodewatcher FAIL EMFILE; druga z istniejącym Watchmanem uruchomiona. Listener localhost IPv6, dlatego początkowy curl127.0.0.1 odmówił połączenia; localhost zadziałał. Bundle wygenerowany:603moduły, probe.js; brak nazw RegularApplicationRoot/trainingLifecycle/mmkvClient/nodePackageStorage w bundle. To potwierdza przygotowane wejście, nie to, które devclient faktycznie uruchomi. Nie uruchomiono aplikacji, kill ani pomiaru; dane użytkownika nie były otwierane przez probe. Read-only private physical-file baseline38plików, bez dumpów payloadów.

## Blokada i następny krok

Automatyczny przegląd odrzucił simctl launch przed wykonaniem: alternate JS location nie dowodzi, że devclient nie uruchomi normalnego bootstrapu/lifecycle i nie zapisze aktywnej sesji/timera. Nie obchodzono rejection. AppDelegate ma także native initialization i backup-policy directory handling; bundleURL może pochodzić z bridge. Przygotowany isolated bundle nie dowodzi wszystkich zachowań istniejącego binary. Zadano jedno konkretne pytanie o zgodę na ten start, z opisem ryzyka, bez resetu/reinstalacji/profilechange; odpowiedź pending. Własny Metro44339/cwd private probe-app zatrzymany przez własną sesję po kontroli ownership; restart dopiero po odpowiedzi. Niezależny P12 kontynuowany.

Prywatne artifacts/private/persist11-202610120700/files0600: probe-app, bundler logs, generatedbundle i baseline hashes. Tymczasowe eksperymenty nie są dostarczonym narzędziem akceptacji; jeżeli produkcyjny probe będzie wymagany do kontynuacji, non-secret tooling zostanie wersjonowane w ramach odebranego pakietu. Nie publikować runtime data. Bez GO.

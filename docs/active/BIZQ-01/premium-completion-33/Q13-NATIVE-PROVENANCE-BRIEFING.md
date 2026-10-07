# Q13 — ograniczony odczyt natywnej wersji wykonania

Cel: potwierdzić wykonanie wbudowanego pakietu po rzeczywistym same-app install OOD23→24. Release smoke pozostawia Expo Updates enabled; sam hash bundle nie dowodzi wykonania tego bundle. Nie zmieniamy konfiguracji produktu.

Ustalenia źródłowe: Expo Updates AppController.isInitialized() jedynie sprawdza singleton. sharedInstance wymaga już zainicjalizowanego kontrolera. EnabledAppController.launchedUpdateId i embeddedUpdateId czytają UUID; embedded getter może odczytać własny bundled manifest i zapełnić in-memory cache, ale nie zapisuje database. Równość UUID jest algorytmem isEmbeddedLaunch w UpdatesModuleConstants. getConstantsForModule/toModuleConstantsMap są wykluczone, ponieważ materializują manifest. Debug ma DevLauncherAppController i nil embedded ID; nie dowodzi Release.

Podejście: po zakończeniu bieżącego UI, najmniejszy capability probe istniejącego Debug procesu przez lokalny LLDB. Attach, sprawdzenie initialized, guarded odczyt wyłącznie typu kontrolera i dwóch UUID/null, detach w finally. Prywatny raw output; receipt wyłącznie kategoria etapu, wartości UUID/null oraz wynik detach/process-running. Nigdy manifest, token, env, requestHeaders, storage ani setter/update/relaunch. Brak build/install do udowodnienia capability. Symbol/access failure kończy ten probe; nie interpretujemy nil Debug jako Release PASS.

Po PASS capability: dokładne już przyjęte Release smoke build/install dwóch admitted refs; analogous guarded EnabledAppController odczyt oraz equality wraz z manifestem build binding i stanem sesji. Odczyt Release nadal wymaga rzeczywistego PASS — Debug nie dowodzi obecności symboli Release. Trwałe lub niejasne attach/detach failure zatrzymuje dependent UI; resume/detach tylko własnego procesu. Krótkie wstrzymanie timera własnej sesji nie zmienia odpowiedzi, lecz należy odnotować.

Ocena root: fit .93, simplicity .88, risk .84, maintainability .88; minimum .84. Nie dodaje API/debug UI/logowania/config; wykorzystuje już istniejące natywne getters. Independent review przed attach. Propozycja nie oznacza runtime PASS.

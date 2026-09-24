# AUD-08/B2a1 — slot operacji i cofanie sesji

**Data:** 25.09.2026  
**Backend:** `patternly-backend/main` `1b0ea25`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS` po poprawkach.

`session/revoke` przekazuje oczekiwaną generację z żądania do magazynu. Transakcja przypisuje `users/{uid}.securityOperation` do rodzaju operacji, `operationId`, generacji, identyfikatora fence i czasu lease, zanim wywoła Firebase. Aktywne ponowienie tej samej operacji ma jawny stan „w toku”, inna operacja dostaje konflikt, a ukończona zwraca trwały wynik bez ponownego revoke. Po wygaśnięciu lease ten sam identyfikator może dostać nowy fence. Finalizacja sprawdza dokładnego właściciela, generację slotu i konta oraz stan operacji przed zapisem wyniku lub zwolnieniem slotu; spóźniony worker nie nadpisze nowszego. Podmioty Firebase są pobierane z mapowania w transakcji i nie są zapisywane w rekordzie operacji.

Wykonawca i niezależne QA potwierdzili typecheck, lint, build i OpenAPI 57 operacji. QA uruchomiło **6/6** skupionych testów na odizolowanym emulatorze, w tym brak/starość generacji przed providerem, konflikt i replay, awarię/retry, zmianę slotu podczas wywołania oraz mapowanie HTTP `401/409`. Testy zakończyły się kodem 0; wrapper Firebase zgłaszał błąd sprawdzenia aktualizacji po zakończeniu. Uzupełniono pełną listę błędów wejściowego guarda i trasy w OpenAPI; QA potwierdziło `PASS`. `git diff --check` bez uwag.

**Granica:** Firebase `revokeRefreshTokens` nie przyjmuje fence, więc już rozpoczętego wywołania nie można anulować. Fence chroni zapis wyniku i własność slotu. Obecne usuwanie konta nie używa jeszcze slotu; B2a1 nie zamyka wyścigu revoke/delete i nie może być uznane za gotowość do wydania. Nie wykonano wdrożenia.

**Ocena przed zmianą:** cel/architektura 0,92; prostota 0,83; ryzyko 0,81; utrzymywalność 0,86; minimum **0,81** dla lokalnego fundamentu.

Następny slice B1b4b dołączy start usuwania do slotu, atomowo ustawi `deleting` i podniesie generację przed providerem. Następnie trzeba związać claim paragonu webhooka z tą granicą, by rozstrzygnąć wyścig wysyłki e-maila.

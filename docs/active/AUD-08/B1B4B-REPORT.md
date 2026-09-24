# AUD-08/B1b4b — usuwanie konta we wspólnym slocie

**Data:** 25.09.2026  
**Backend:** `patternly-backend/main` `6c5566a`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS` po poprawkach.

Start usuwania w jednej transakcji sprawdza oczekiwaną generację, zapisuje operację i tożsamości, ustawia konto na `deleting`, podnosi generację i przejmuje `securityOperation` przed wywołaniem Firebase. Usuwanie ma pierwszeństwo przed rozpoczętym `session_revoke`; spóźnione cofnięcie sesji nie może zapisać wyniku ani zwolnić slotu. Inny identyfikator usuwania dostaje konflikt. Tę samą operację można wznowić przez identyfikator i sekret bez starej sesji; zły sekret nie ujawnia stanu.

Każda faza ma fence i lease. Sprzątanie danych wykonuje ograniczone transakcyjne partie, które sprawdzają właściciela w tym samym commicie. Obejmuje to raporty, dokumenty powiązane i zagnieżdżone podkolekcje. Dokument użytkownika jest usuwany na końcu. Po awarii w tym miejscu wznowienie weryfikuje mapowania i tombstones, kończy operację i udostępnia dowód usunięcia. Usunięto zdublowaną trasę `unlinkAccount` poza fence. OpenAPI opisuje konflikt `409`.

Niezależne QA wykryło i zweryfikowało naprawę dwóch blokujących błędów: trwałego utknięcia po usunięciu dokumentu użytkownika oraz mutacji starego wykonawcy po przejęciu lease. Testy na izolowanym emulatorze: pierwotnie 15/15, po poprawkach kierunkowe 4/4. Przypadek 401 raportów potwierdza przejście granicy partii 400 i zachowanie pozostałych pól. Typecheck, lint, build, OpenAPI oraz `git diff --check` przeszły. Wrapper Firebase CLI zgłaszał błąd sprawdzania aktualizacji po zakończeniu wewnętrznego procesu testowego kodem 0.

**Granica:** już rozpoczętych wywołań Firebase nie można anulować; fence chroni dalsze zapisy i fazy. Osobny wyścig wysyłki e-maila RevenueCat pozostaje w B1b4c. Nie wykonano wdrożenia.

**Ocena po poprawkach:** cel/architektura 0,92; prostota 0,84; ryzyko 0,86; utrzymywalność 0,85; minimum **0,84**.

Następny slice B1b4c określi i zaimplementuje koordynację claimu wysyłki e-maila z początkiem usuwania konta. Potem B1c sprawdzi gotowość Firebase initial/refresh i kontrakt wydania lokalnego.

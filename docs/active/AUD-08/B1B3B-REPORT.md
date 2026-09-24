# AUD-08/B1b3b — podgląd etapowego transferu

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `413acff`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS`.

Podgląd przekazuje oczekiwaną generację z żądania do magazynu. Rezerwacja, zapis wyniku i finalizacja sprawdzają aktywne konto i generację w swoich transakcjach; ponowienie gotowego podglądu sprawdza je przed zwróceniem danych. Zwykły zapis batch został zastąpiony ograniczoną transakcją. Obowiązujący limit całego transferu 512 KiB sprawia, że poprawny transfer daje najwyżej jeden rekord wyniku; transakcja końcowa weryfikuje jego deterministyczny odcisk albo poprawny przypadek bez rekordu, zanim oznaczy podgląd jako gotowy.

Wykonawca potwierdził typecheck, lint, build, OpenAPI 57 operacji i `git diff --check`. Niezależne QA uruchomiło **6/6** testów transferu na izolowanym emulatorze. Testy obejmują obrót przed rezerwacją (brak wyniku), obrót po zapisie wyniku przed finalizacją (`409`, bez gotowego podglądu), ponowienie gotowego podglądu ze starą generacją oraz pusty transfer: obrót przed finalizacją pozostawia `result_building` i zero rekordów, a ponowienie przy właściwej generacji kończy się stabilnym odciskiem. Emulator zamknięto; Firebase CLI zgłosił błąd sprawdzenia aktualizacji dopiero po poprawnym zakończeniu testów. Nie wykonano wdrożenia ani testu urządzeniowego.

**Ocena przed zmianą:** cel/architektura 0,94; prostota 0,88; ryzyko 0,85; utrzymywalność 0,88; minimum **0,85**. Po uwzględnieniu limitu jednego wyniku uproszczony projekt oceniono na minimum 0,94.

Następny slice B1b3c obejmuje zapis decyzji potwierdzającej transfer; B1b3d zastosowanie danych i status. Cały transfer nie jest jeszcze gotowy do uruchomienia ani wdrożenia.

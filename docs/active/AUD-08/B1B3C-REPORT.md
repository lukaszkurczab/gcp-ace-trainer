# AUD-08/B1b3c — decyzja etapowego transferu

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `470c283`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS` po poprawieniu testów ponowienia.

Trasa potwierdzenia przekazuje oczekiwaną generację uprawnień do magazynu. Transakcja blokująca odcisk decyzji sprawdza konto przed zapisem i przed ponowieniem. Każda partia do 200 wierszy decyzji osobno czyta konto, operację i deterministyczne dokumenty; sprawdza generację, odcisk i istniejące dane przed utworzeniem brakujących wierszy. Częściowy zapis pozostaje nieaktywny do pełnego zastosowania, a ponowienie tej samej decyzji z aktualną sesją uzupełnia brakujące części. Inna decyzja daje konflikt.

Wykonawca potwierdził typecheck, lint, build, OpenAPI 57 operacji, `git diff --check` i **8/8** testów transferu na izolowanym emulatorze `19101/18083`. Test 201 decyzji naprawdę przekracza granicę 200 wierszy: po obrocie przed drugą partią pozostaje dokładnie 200 wierszy, żądanie otrzymuje `409`, a ponowienie z nowym tokenem generacji 2 kończy komplet 202 wierszy. Mniejszy test sprawdza obrót po zablokowaniu decyzji, ponowienie z tokenem generacji 2, konflikt innej decyzji i odmowę dla starego tokenu generacji 1. Niezależne QA uruchomiło oba skupione testy (**2/2**) na osobnym emulatorze oraz potwierdziło typecheck, lint, OpenAPI i diff check. Wrapper Firebase zgłaszał błąd sprawdzenia aktualizacji po poprawnym wyniku testów; wspólnego emulatora nie czyszczono.

**Ocena przed zmianą:** cel/architektura 0,95; prostota 0,88; ryzyko 0,83; utrzymywalność 0,90; minimum **0,83**.

Następny slice B1b3d obejmuje zastosowanie transferu: zapis docelowych rekordów w partiach z kursorem i końcową promocję generacji. Dopiero po nim możliwy będzie pełny odbiór granicy transferu.

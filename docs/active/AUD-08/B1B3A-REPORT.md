# AUD-08/B1b3a — start, upload i seal transferu

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `3026185`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS` po poprawkach.

Start, przesyłanie części i obie transakcje zamykania transferu przyjmują oczekiwaną generację uprawnień z żądania i sprawdzają ją wraz z aktywnym stanem konta w tej samej transakcji co zapis. Kontrola obejmuje ponowienia i wczesne zwroty. Generacja postępu transferu pozostaje osobna. Obrót po guardzie daje `409 authorization_generation_conflict`, nieaktywne konto `401`, a stary token jest odrzucany przez guard. Opisy OpenAPI obejmują konflikt uprawnień bez przedstawiania niepełnej listy pozostałych konfliktów jako pełnej.

Wykonawca potwierdził typecheck, lint, OpenAPI 57 operacji, `git diff --check` i **4/4** skupionych testów na izolowanym emulatorze `19100/18082`, który zatrzymał po teście. Testy obejmują zwykły transfer z ponowieniami, rotację po guardzie bez zapisów operacji/części/metadanych oraz rotację **między dwiema transakcjami seal**: `409`, stan `sealing`, brak końcowego stempla. Niezależne QA przejrzało granice transakcji i ponownie uruchomiło typecheck, lint, OpenAPI i diff check; nie powtórzyło emulatora, ponieważ zestaw czyści Firestore i QA nie potwierdziło niezależnie wolnych portów. Błąd sprawdzenia aktualizacji przez wrapper Firebase pojawił się po zakończonym poprawnie skrypcie testowym.

**Ocena przed zmianą:** cel/architektura 0,93; prostota 0,86; ryzyko 0,84; utrzymywalność 0,88; minimum **0,84**.

Transfer nadal wymaga B1b3b podglądu i transakcyjnych partii wyników, B1b3c zapisu decyzji oraz B1b3d zastosowania danych i testu statusu. Ten fragment nie stanowi zgody na uruchomienie całego transferu ani wdrożenie.

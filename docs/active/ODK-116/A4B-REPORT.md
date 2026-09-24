# ODK-116/A4b — publiczne strony web

**Data:** 24.09.2026  
**Status:** done w zakresie konsumenta web; A4c wyrównanie ścieżek readiness pozostaje otwarte.  
**QA:** PASS.  
**Web main:** `10e3182`.

## Wynik

- Web buduje osobne strony marketingowe, Privacy i Terms. Stopka pobiera nazwę operatora oraz adresy Privacy, Terms i Support z jawnego artefaktu prawnego; usunięto zakodowaną nazwę sprzedawcy.
- Build wymaga jawnej ścieżki artefaktu i osobnego oczekiwanego fingerprintu z readiness. Sprawdza schemat, lokalizowane pola, dokumenty EN/PL, HTTPS i odmawia danych `testOnly` w trybie publikacyjnym.
- Lokalny test tworzy oznaczony artefakt przez rzeczywisty eksporter aplikacji i sprawdza oba dokumenty, obie lokalizacje, wersję, bezpieczny render tekstu, linki i brak publicznych tras `/admin*` oraz `/privacy-request*`.

## Dowód i ograniczenia

`npm run test:public-legal` 4/4, `npm run verify:local` oraz `git diff --check` przeszły. Niezależne QA: PASS po usunięciu wykrytej niezgodności struktury profilu (eksporter daje `{en, pl}`). Produkcyjny build bez artefaktu i z `testOnly` odmawia. Nie wykonano deployu ani buildu z rzeczywistymi danymi PO, ponieważ kanoniczny rekord zawiera placeholdery.

**Ocena fit przed implementacją:** cel i architektura 0,94; prostota 0,88; ryzyko 0,89; utrzymywalność 0,90; minimum **0,88**.

**Otwarte:** web wymaga dokładnych ścieżek HTTPS `/privacy` i `/terms`, zgodnych z jego stronami MPA. Aplikacyjna walidacja release sprawdza obecnie HTTPS i zgodność URL z publicEnvironment, lecz nie wymaga tych ścieżek. A4c powinno wykryć rozjazd już w app config i readiness przed eksportem.

# ODK-116/A4a2 — eksport publicznych dokumentów

**Data:** 24.09.2026  
**Status:** done w zakresie producenta; A4b (web) pozostaje otwarte.  
**QA:** PASS WITH GAPS.

## Wynik

- Szablony Privacy i Terms przyjmują zweryfikowany rekord jako argument, zachowując dotychczasowe eksporty dla aplikacji.
- `scripts/exportPublicLegal.mjs` czyta wyłącznie `config/public-legal.release.json`, waliduje schemat wydania i linki HTTPS, a dopiero potem zapisuje wersjonowany artefakt. Zawiera on `documentVersion`, wspólny z bramką wydania `sourceFingerprint`, publiczne dane operatora, linki i dokumenty EN/PL.
- Syntetyczny artefakt testowy jest jawnie oznaczony `testOnly: true`. Komenda produkcyjna nie przyjmuje zamiennego źródła.
- Obecny rekord zawiera placeholdery. Eksport kończy się błędem przed utworzeniem katalogu/pliku. Nie opublikowano fikcyjnych danych.

## Dowód i ograniczenia

`npm run typecheck`, 4 testy eksportera, 14 testów bramki wydania, `npm run validate:runtime-privacy-boundary`, `npm run check:legal-variables` i `git diff --check` przeszły. Niezależne QA potwierdziło granicę źródła i odmowę dla obecnego rekordu. QA wskazało, że pełny zapis produkcyjnego artefaktu i porównanie serializowanego wyniku z readiness będzie możliwe dopiero po dostarczeniu rzeczywistych danych PO. Test zachowania szablonu porównuje aktualny renderer z aktualnym eksportem aplikacji, nie z utrwalonym tekstem sprzed zmiany. Te luki nie zmieniają odmowy publikacji obecnego rekordu; trzeba je uwzględnić przy ODK-116-B.

**Ocena fit przed implementacją:** cel i architektura 0,95; prostota 0,91; ryzyko 0,86; utrzymywalność 0,92; minimum **0,86**.

**Następny krok:** A4b konsumuje ten format na webie i odrzuca `testOnly` podczas buildu publikacyjnego. Brak danych PO nie blokuje lokalnego kontraktu ani testowego buildu.

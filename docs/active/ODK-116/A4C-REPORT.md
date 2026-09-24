# ODK-116/A4c — zgodność adresów dokumentów

**Data:** 24.09.2026  
**Status:** done; A4 producent, web i readiness mają spójny kontrakt ścieżek.  
**QA:** PASS.

Wspólna schema wydania wymaga HTTPS oraz dokładnych ścieżek `/privacy` i `/terms`, bez query, fragmentu ani danych logowania w URL. Odrzuca również końcowe puste `?` i `#`. Support pozostaje adresem HTTPS. `app.config.js`, release gate i eksporter korzystają z tej samej schemy, więc niezgodny link zostaje wykryty przed eksportem; readiness zwraca ścieżkę konkretnego pola.

**Dowód:** testy schemy, eksportera, konfiguracji builda i readiness 41/41 PASS; `npm run typecheck` i `git diff --check` PASS. Niezależne QA: PASS. Lokalny fixture nadal działa. Produkcyjny build z prawdziwymi danymi PO pozostaje do sprawdzenia po uzupełnieniu kanonicznego rekordu.

**Ocena fit przed implementacją:** cel i architektura 0,90; prostota 0,85; ryzyko 0,82; utrzymywalność 0,90; minimum **0,82**.

**Następny krok:** odbiór środowiska testowego ODK-116-A bez danych PO oraz pakiet rzeczywistych danych do ODK-116-B.

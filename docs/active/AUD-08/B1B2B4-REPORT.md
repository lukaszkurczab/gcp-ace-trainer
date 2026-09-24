# AUD-08/B1b2b4 — granica generacji dla eksportu danych

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `cebdb08`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS`.

Eksport inicjowany przez konto przekazuje oczekiwaną generację z uwierzytelnionego żądania. Transakcja sprawdza aktywność i generację przed zapisem limitu, audytu i wznowienia. Każda późniejsza zmiana statusu audytu powtarza kontrolę; błąd uprawnień przy zapisie statusu nie jest pomijany. Po zebraniu danych odrębna transakcja tylko do odczytu sprawdza generację przed zwróceniem dokumentu. Obrót w trakcie eksportu daje `409` bez treści eksportu. Eksport wykonany przez administratora w ramach zweryfikowanego wniosku prywatności ma osobny jawny kontekst i zachowuje dotychczasowy przebieg.

Wykonawca potwierdził typecheck, lint, OpenAPI 57 operacji, `git diff --check` oraz po 7/7 testów `dataExport` i `privacyRequests` na izolowanym emulatorze. Niezależne QA uruchomiło oba zestawy na osobnych portach `28183/28189` z poprawnym lokalnym projektem: **14/14**. Testy potwierdzają konflikt przed zapisem audytu i limitu oraz podczas odczytu danych, bez zwrócenia treści eksportu; obejmują też administracyjne wykonanie wniosku. Emulatory testowe zatrzymano, wspólnych danych nie czyszczono. Nie wykonano wdrożenia ani testu urządzeniowego.

**Ocena przed zmianą:** cel/architektura 0,90; prostota 0,84; ryzyko 0,82; utrzymywalność 0,84; minimum **0,82**.

Następny slice B1b3 obejmuje etapowy transfer upload/seal/preview/confirm/apply. `session/revoke` pozostaje do wspólnego slotu operacji w B2, ponieważ wywołanie providera poza transakcją mogłoby cofnąć nową sesję po obrocie generacji.

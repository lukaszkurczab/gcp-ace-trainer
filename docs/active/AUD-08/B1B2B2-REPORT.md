# AUD-08/B1b2b2 — wnioski prywatności i audyt odczytu

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `ff2b9ec`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA; wskazane luki poprawione i potwierdzone.

Utworzenie wniosku prywatności przekazuje generację uprawnień z żądania. Jedna transakcja sprawdza aktywne konto i generację przed zapisem wniosku, sekretu i audytu. Odczyt dostępnej odpowiedzi sprawdza generację w transakcji audytu, zanim handler zwróci dane. Gdy odpowiedź nie jest dostępna, transakcja tylko do odczytu sprawdza konto i generację przed zwróceniem metadanych, bez tworzenia audytu. Rotacja po guardzie daje `409 authorization_generation_conflict`; nieaktywne konto `401 account_deleted`.

Wykonawca potwierdził typecheck, lint, OpenAPI dla 57 operacji, `git diff --check` i skupiony test na izolowanych portach emulatora `19199/18101`, które wyłączył po teście. Test obejmuje obrót przed zapisem wniosku (brak wniosku, sekretu i audytu), obrót przed odczytem dostępnej odpowiedzi (brak odpowiedzi i audytu), obrót przy niedostępnej odpowiedzi (brak metadanych i audytu) oraz poprawny odczyt z jednym audytem. Niezależne QA potwierdziło strukturę transakcji, typecheck, lint, OpenAPI i diff; nie powtórzyło emulatora z powodu zajętych domyślnych portów, których zestaw testowy nie mógł bezpiecznie wyczyścić. QA wykryło lukę niedostępnej odpowiedzi i nieprecyzyjny opis 409; obie poprawki zostały ponownie sprawdzone i potwierdzone przez QA.

**Ocena przed zmianą:** cel/architektura 0,90; prostota 0,88; ryzyko 0,84; utrzymywalność 0,88; minimum **0,84**.

Następny slice B1b2b3 obejmuje account legal/content-report create, a kolejny eksport danych z audytem, limitem i kontrolą przed odpowiedzią. `session/revoke` pozostaje do wspólnego slotu operacji z B2 ze względu na wywołanie providera poza transakcją.

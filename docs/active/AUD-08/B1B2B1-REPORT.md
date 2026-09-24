# AUD-08/B1b2b1 — wydawanie kodów odzyskiwania

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `b5d3631`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS` po poprawce kontraktu OpenAPI.

Trasa wydawania kodów przekazuje numer generacji uprawnień z uwierzytelnionego żądania do magazynu. Transakcja sprawdza aktywny stan konta i oczekiwaną generację **przed** usunięciem starych indeksów, utworzeniem nowych i zapisem metadanych. Obrót po guardzie daje `409 authorization_generation_conflict`, a nieaktywne konto `401 account_deleted`. Pozostał wymóg świeżego ponownego uwierzytelnienia i dokładnie dziesięć jednorazowych kodów.

Wykonawca potwierdził typecheck, lint, zgodność OpenAPI 57 operacji i dwa skupione testy w izolowanym emulatorze. Test wyścigu sprawdził, że stare indeksy i metadane pozostają bez zmian po odmowie oraz że nieaktywne konto nie dostaje nowych danych. Niezależne QA przejrzało granicę transakcji, uruchomiło skupiony test emulatora (1/1), typecheck, lint i OpenAPI. Wskazany przez QA brak `recent_reauthentication_required` w liście błędów OpenAPI uzupełniono; QA potwierdziło wynik `PASS`. Skrypt testów zakończył się powodzeniem; wrapper emulatora zgłosił problem sprzątania po teście. Tymczasowe emulatory zamknięto, wspólnego emulatora nie czyszczono. `git diff --check` bez uwag.

**Ocena przed zmianą:** cel/architektura 0,97; prostota 0,96; ryzyko 0,93; utrzymywalność 0,96; minimum **0,93**.

Następny slice B1b2b2 obejmuje privacy create/read-audit i pozostałe zwykłe zapisy według [macierzy](B1B0-ROUTE-MATRIX.md). `session/revoke` pozostaje otwarte: obecne wywołanie providera następuje poza transakcją i potrzebuje wspólnego slotu operacji z obrotem generacji. Samo końcowe sprawdzenie bazy nie chroniłoby nowej sesji przed spóźnionym revoke. Ten kontrakt należy wykonać wraz z B2, bez wdrożenia pośredniego rozwiązania.

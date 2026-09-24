# AUD-08/B1b2a — synchronizacja i jednorazowa adopcja

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `3b109c9`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS WITH ISSUES`.

## Wykonanie

`/v1/progress/sync` i `/v1/account-data/adoption/confirm` przekazują oczekiwaną generację uprawnień z uwierzytelnionego żądania do magazynu. Obie transakcje odczytują stan konta i porównują generację przed zapisem oraz przed zwróceniem wyniku wcześniejszej operacji. Po rotacji generacji zwracają `409 authorization_generation_conflict`, a nieaktywne konto otrzymuje `401 account_deleted`. Generacja postępu pozostaje osobnym pojęciem. Wspólna reguła generacji służy też dotychczasowym zapisom zgód i zakupów. Zaktualizowano logowanie odrzuceń i kontrakt OpenAPI.

## Weryfikacja

- Typecheck, lint, build i zgodność OpenAPI dla 57 operacji przeszły.
- Wykonawca sprawdził 8/8 skupionych testów emulatorowych oraz 1/1 test fixture'a na izolowanych portach. Dwa stare fixture'y tokenów dostosowano do wymaganego claimu, bez osłabiania guarda.
- Niezależne QA potwierdziło typecheck, lint, OpenAPI, `git diff --check` i 45/45 testów emulatorowych w trzech plikach. Skrypt testów zakończył się kodem 0; wrapper Firebase zwrócił kod 2 po testach przez niedostępne sprawdzenie aktualizacji i `~/.config`. Emulatory testowe zamknięto, wspólnego emulatora nie czyszczono.
- Testy obejmują świeży zapis i replay obu operacji po rotacji między guardem a transakcją, brak dodatkowych zapisów oraz nieaktywny stan konta.

**Pozostała uwaga QA:** nowe wywołania logowania i lista dopuszczonych kodów są obecne, lecz testy nie asercjonują treści logu. Nie blokuje to odbioru zachowania API. Nie wykonano testu urządzeniowego ani wdrożenia.

**Ocena przed zmianą:** cel/architektura 0,94; prostota 0,90; ryzyko 0,88; utrzymywalność 0,90; minimum **0,88**. Niezależny walidator zatwierdził zakres przed implementacją.

Następny slice B1b2b obejmuje pozostałe zwykłe zapisy i odczyty z efektem ubocznym według [macierzy](B1B0-ROUTE-MATRIX.md). B1b3 zabezpieczy transfer etapowy, B1b4 delete/webhook/admin, a B1c potwierdzi zachowanie claimu w pierwszym i odświeżonym tokenie Firebase oraz lokalną bramkę gotowości wydania. Recovery takeover pozostaje wyłączone do PASS B1c.

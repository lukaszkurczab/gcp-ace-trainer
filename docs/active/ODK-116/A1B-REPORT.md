# ODK-116/A1b — zgodność runtime z platformowym buildem

**Data:** 24.09.2026  
**Status:** done; korekta kontraktu A1.

A1 pozwalał jawnie budować iOS bez pól Androida i odwrotnie, ale parser konta nadal wymagał obu identyfikatorów Google, a składanie App Check wymagało dostawcy Androida także na iOS. Poprawny build mógł więc uruchomić aplikację bez dostępnego konta lub App Check.

Parser Firebase wymaga teraz podstawowych pól potrzebnych do konta. Identyfikatory OAuth są opcjonalne, weryfikowane osobno i udostępniane tylko wtedy, gdy mają poprawny format; brak lub wada identyfikatora drugiej platformy nie blokuje Firebase Auth. Akcje Google w ekranach wejścia i bezpieczeństwa zależą od identyfikatora aktywnej platformy. Składanie App Check obsługuje Apple-only, Android-only i oba zestawy; brak obu czyści dostawcę tokenu i zwraca `unavailable`. Zaktualizowano instrukcję lokalnego logowania, odróżniając wymagania launchera smoke od parsera runtime.

**Weryfikacja:** testy celowane konta i konfiguracji builda 47/47 PASS; `npm run typecheck`, obie walidacje boundary i `git diff --check` PASS. Niezależne QA `gpt-6-luna/high`: **PASS** po korekcie dokumentacji; potwierdzono osobne reguły launchera i runtime. Urządzenia nie resetowano ani nie instalowano ponownie. Testy App Check sprawdzają mapę konfiguracji i brak dostawcy; natywne wywołanie SDK na urządzeniu należy do integracyjnego odbioru.

**Ocena przed zmianą:** zgodność 0,93; architektura 0,88; prostota 0,86; kontrola ryzyka 0,83; utrzymywalność 0,87; minimum **0,83**. Niezależny walidator `gpt-6-luna/high` zaakceptował briefing; wykonawca `gpt-6-luna/high`.

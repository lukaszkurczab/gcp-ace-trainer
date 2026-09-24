# PROFILE-01/A — raport kontraktu

**Data:** 24.09.2026
**Status:** kontrakt `done`; implementacja `PROFILE-01/B–D` pozostaje otwarta.
**Model walidacji:** `gpt-6-luna/high`; briefing bez inspekcji repozytorium zgodnie z `AGENTS.md`.

## Cel, zmiana i podstawa

Uzgodniono kolejność startu, dostęp do guest/konta, trwałą blokadę po lokalnym wylogowaniu i odrębny stan zdalnego revoke. Kanoniczny [kontrakt](CONTRACT.md) dzieli implementację na B–D. Sprawdzono aktualne wejścia w `App.tsx`, `AppPreferencesProvider`, `ContentPreparationGate`, `mmkvClient`, `profileStorageRouter`, `AccountSessionProvider`, `canonicalRepositories` oraz backendowy `/v1/account/session/revoke`. Potwierdzono, że dzisiejszy start odczytuje wybrany scope przed Auth, a logout może być zatrzymany przez offline sync.

Pierwszy testowany wariant `localStartupGate` powielał dane rejestru profili i nie był podłączony do startu. Usunięto go bez commitu; nie uznajemy jego sześciu testów za dowód działania aplikacji. Rejestr profili pozostaje jedynym źródłem profile ID i account ID. W kontrakcie zapisano, że znacznik startu przechowuje wyłącznie metadane potrzebne do bramy dostępu i pending revoke.

## Walidacja i wynik

Niezależna walidacja briefingu `Cel / Ustalenia / Podejście` przez `gpt-6-luna/high`: architektura 0,90; prostota 0,82; ryzyko 0,83; utrzymywalność 0,85; minimum **0,82**, `approve` pod warunkiem braku drugiego rejestru profili. Warunek uwzględniono w kontrakcie. Wykonano statyczną inspekcję kolejności montowania i endpointu revoke; nie wykonano po zmianie testu mobilnego ani urządzeniowego, ponieważ slice A zmienia wyłącznie dokumentację.

**Następny task:** `PROFILE-01/B`. Dowód B musi wykazać, że konto z zapisanym `selectedProfileId` nie wywołuje odczytu swoich kluczy przed zgodnym Auth UID; samo pokazanie loginu nie wystarczy. Istniejący guest iPhone 17 pozostaje nienaruszony.

**Niezależne QA dokumentu:** `gpt-6-luna/high`, **PASS** po korekcie. Pierwszy przegląd wykrył brak operacji ponownego wyboru zachowanego guest ID i niedookreślone przeniesienie account-scoped `operationId` przed lock. Oba warunki dopisano do kontraktu, a ponowny przegląd potwierdził zakres i zależności bez fałszywej deklaracji wykonania kodu.

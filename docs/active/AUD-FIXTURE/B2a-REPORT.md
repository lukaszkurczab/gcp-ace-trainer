# AUD-FIXTURE/B2a — strzeżone przejście owner → guest

**Data:** 24.09.2026. **Status:** `done` dla polecenia w providerze; B2 pozostaje otwarte do B2b.

## Decyzja i zakres

Pierwsze dwie propozycje szerokiego B2 nie osiągnęły wymaganego minimum 0,8 (ryzyko odpowiednio 0,78 i 0,65). Wąski briefing B2a, zawierający dokładnie `Cel`, `Ustalenia`, `Podejście`, uzyskał w niezależnej ocenie: zgodność 0,90, prostota 0,84, ryzyko 0,82, utrzymywalność 0,85; minimum **0,82**. Zakres obejmuje wyłącznie provider i test polecenia. Nie uruchamia urządzenia i nie zmienia UI.

## Zmiana

`runOwnerPreservationGuestCommand` jest dostępne z kontekstu konta. Przed uzbrojeniem oracle sprawdza tryb DEV/smoke, stan `guestAccessBlocked`, profil `legacy_owner` oraz zakończoną inicjalizację Auth z pustą sesją. Po uzbrojeniu ponownie sprawdza profil, stan i Auth, a dopiero potem rozpoczyna istniejące przejście do nowego profilu guest. Zwykłe i strzeżone polecenie guest używają tej samej blokady na czas operacji. Odmowa lub błąd nie jest przedstawiany jako udana weryfikacja. Po rozpoczęciu przejścia wynik to wyłącznie `pending` i `armed`; oracle będzie weryfikowane w nowym procesie przez B2b.

## Weryfikacja i granice

Test zachowania polecenia: **5/5 PASS** (odmowa bez efektów, zablokowane uzbrojenie, ponowna kontrola i cleanup, blokada równoczesnego polecenia, prawdziwy stan `pending`, błąd przejścia). `npm run typecheck` i `git diff --check`: **PASS**. Niezależne QA `gpt-6-luna` high: **PASS WITH ISSUES** po poprawieniu wcześniejszego błędu weryfikacji przed restartem.

Uzbrojony wpis jest celowo zachowany po rozpoczęciu przejścia, także gdy samo przejście zgłosi błąd. B2b musi rozpoznać wpis po restarcie, zweryfikować go i zakończyć cykl przez cleanup własnego klucza; do tego czasu kolejne uzbrojenie jest blokowane. Test konkurencji użył dwóch strzeżonych wywołań; B2b ma również sprawdzić konkurencję zwykłego i strzeżonego polecenia. B2a nie stanowi dowodu niezmienności ownera na symulatorze.

# AUD-08/B1a — źródło generacji i wymiana sesji

**Data:** 24.09.2026  
**Odbiór:** niezależne QA `PASS WITH ISSUES`; pozostałe bramki należą do B1b/B1c, nie do tego slice.

## Zmiana

Backend tworzy nowe konto z `authorizationGeneration: 1`, `authorizationState: active` i `authorizationRotatedAtSeconds: 0`. Dla istniejącego aktywnego konta brak tych pól oznacza odpowiednio `1/active/0` tylko na czas migracji; wartości obecne, lecz niepoprawne, są odrzucane. Nowa trasa `POST /v1/account/session/exchange` wymaga App Check i poprawnego Firebase ID tokenu, sprawdza tombstone, stan konta i `auth_time > authorizationRotatedAtSeconds`, przypina generację w jednym odczycie i mintuje custom token dla **Firebase UID**, nie wewnętrznego ID konta. OpenAPI dopuszcza brak body zgodnie z klientem. Verifier zachowuje poprawny claim i odmawia niepoprawnego. Obecne recovery otrzymuje claim bieżącej generacji po sprawdzeniu stanu i tombstone, zachowując dotychczasowy revoke i bez obrotu generacji.

Aplikacja wymienia zwykłe sesje Email/Google/Apple przed `/me` przy logowaniu, rejestracji, wznowieniu i odświeżeniu tożsamości. Sesja już mająca poprawny claim, w tym odzyskana kodem, omija wymianę. Jeden helper chroni kolejność i UID/generację w trakcie asynchronicznego logowania; zdarzenie Firebase po wymianie nie rozpoczyna drugiego przygotowania profilu. Błąd bariery świeżości ma jawny ekran ponownego uwierzytelnienia z przejściem do logowania.

## Weryfikacja

- Backend: typecheck, lint, build, OpenAPI parity, pełny zestaw 189 testów i 55 testów skupionych według wykonawcy; po końcowych poprawkach ponownie przeszły test emulatora recovery (1/1) i exchange bez body (1/1), 22 testy OpenAPI, typecheck, lint i `openapi:check`. Użyto już działających lokalnych emulatorów; próba uruchomienia drugiego zestawu natrafiła na zajęte porty.
- Aplikacja: typecheck oraz 70 testów skupionych według wykonawcy. Niezależne QA wykonało 80 testów skupionych i potwierdziło kolejność wymiany, ominięcie dla recovery, ochronę przed ponownym zdarzeniem obserwatora i przerwanie po zmianie sesji.
- Oba repozytoria: `git diff --check` bez błędów. Niezależne QA potwierdziło zgodność backend/mobile i OpenAPI; nie mogło osobno uruchomić emulatora na zajętych portach, więc raport rozróżnia jego ocenę kodu od wyniku uruchomionego przez wykonawcę.

## Granica i następny krok

B1a **nie egzekwuje** claimu na wszystkich trasach i nie obraca generacji przy recovery. B1b zabezpieczy trasy i magazyny oraz propagację oczekiwanej generacji, a B1c sprawdzi realny Firebase ID token przy pierwszym `signInWithCustomToken` i po odświeżeniu, pełną macierz tras/zapisów, granicę `auth_time` oraz faktyczny kanał dystrybucji starszych instalacji. Dopiero po PASS B1c można włączyć brak fallbacku dla tokenu bez claimu, takeover recovery i usunąć obecne provider revoke. Na istniejącym iPhonie 17 nie wykonywano jeszcze urządzeniowego testu nowego przepływu; ten dowód należy do B1c/B4.

**Ocena podejścia przed zmianą:** cel/architektura 0,89; prostota 0,84; ryzyko 0,82; utrzymywalność 0,86; minimum **0,82**. Niezależny walidator zatwierdził etapowanie z bramką wdrożenia, ponieważ wcześniejszy jednoczesny cutover otrzymał minimum 0,68.

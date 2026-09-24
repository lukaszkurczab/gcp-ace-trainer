# AUD-FIXTURE/B2b — wynik oracle po restarcie i bezpieczna ścieżka smoke

**Data:** 24.09.2026. **Status:** kod `done`, atestacja owner→guest na urządzeniu `blocked` do przygotowania syntetycznego profilu ownera w B3.

## Decyzja przed zmianą

Niezależna pierwsza ocena briefingu dała minimum 0,72 z powodu nieokreślonej gwarancji współbieżności. Po doprecyzowaniu obu kolejności poleceń i warunku atestacji urządzenia oceny wyniosły: zgodność celu 0,93, architektura 0,90, prostota 0,84, ryzyko 0,82, utrzymywalność 0,86; minimum **0,82**.

## Zmiana i weryfikacja kodu

W trybie DEV/smoke ekran `guestAccessBlocked` udostępnia tylko strzeżoną akcję przejścia do guest; pierwotny przycisk jest zachowany poza smoke. Wynik `pending` oznacza uzbrojenie, nie weryfikację. Po starcie w profilu guest oracle odczytuje wpis, porównuje stan ownera, usuwa tylko własny klucz i pokazuje `unchanged`, `changed` lub `blocked`. Błąd cleanup daje `blocked`. Zwykłe i strzeżone polecenie guest korzystają z jednej blokady; testy obejmują obie kolejności. Implementacja oracle jest wybierana wyłącznie w bundle smoke.

Testy ukierunkowane po poprawce: **43 PASS** według niezależnego QA, `npm run typecheck` i `git diff --check` **PASS**. Bundle smoke/release: **2/2 PASS**; implementacja oracle nie trafia do release. Pierwsze QA dało **FAIL**, ponieważ zwykły przycisk smoke omijał oracle. Po zastąpieniu go strzeżoną akcją ponowne QA: **PASS WITH GAPS**.

## Urządzenie i granica dowodu

Jedyny iPhone 17 (`7F315654-3175-4F3C-BB24-B0263F59360C`) pozostał jedynym uruchomionym symulatorem. Maestro 2.10.0 wykonało odczytowy preflight i otworzyło ekran ustawień bez `clearState`. [Zrzut ustawień](evidence/b2b-guest-settings.png) pokazuje bieżący stan **Guest**. Nie było profilu `legacy_owner`, więc nie uruchomiono przejścia owner→guest ani nie wykonano atestacji zachowania ownera. Aplikację zamknięto na prośbę użytkownika bez usuwania danych. Natywny cykl SecureStore, wynik UI po restarcie i pełny Maestro E2E czekają na bezpieczny syntetyczny owner baseline w B3. Ten zrzut nie jest dowodem niezmienności ownera.

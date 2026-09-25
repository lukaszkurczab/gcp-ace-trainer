# PROFILE-02/C — jeden Gość i izolacja Guest/A/B

**Data:** 25.09.2026  
**Status:** `done`  
**Niezależne QA:** `gpt-6-luna/high`, **PASS** po domknięciu uwagi `contains/getAllKeys`.

## Wynik

Produkcja już spełniała kontrakt po PROFILE-02/A, więc C nie dodaje drugiej ścieżki runtime. Wzmocniony test kontraktowy zaczyna od pustego magazynu, tworzy dokładnie jednego Gościa i przechodzi Guest → konto A → Guest → konto B → Guest z ponownym otwieraniem routera. Dla każdego zakresu zapisuje `METADATA`, `ACTIVE_TRACK`, `SETTINGS` oraz unikalny klucz. Potwierdza dokładnie jeden profil Gościa i po jednym profilu kont A/B, zachowanie wartości po restartach, brak odczytów/zapisów na prefiksach obcych zakresów oraz izolację także przez `contains()` i `getAllKeys()`.

`PROFILE-02/B` pozostaje anulowane decyzją właściciela. Nie dodano selektora, migracji ani odzyskiwania kilku historycznych Gości. Istniejąca odmowa przy niejednoznacznym starym rejestrze pozostaje do usunięcia razem z syntetycznymi ścieżkami legacy w PROFILE-05; C nie promuje jej do wymagania produktu.

## Weryfikacja

- Router, MMKV i koordynacja startu: **56/56 PASS**.
- `npm run typecheck`, `validate:content-boundary`, `validate:runtime-privacy-boundary` i `git diff --check`: **PASS**.
- Pełny `npm test`: **1263/1268 PASS**. Pięć niepowiązanych niepowodzeń: nieaktualna tekstowa asercja retry-limit, licznik route shell 36 zamiast 35 oraz trzy bramki content-release (historyczny checkout ma inny SHA i dwa testy nie mają `PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA`). Żaden z tych testów nie dotyka routera lub izolacji profili.
- Istniejący iPhone 17 `7F315654-3175-4F3C-BB24-B0263F59360C`: Auth, Firestore, API 3/3 i Metro były dostępne. Maestro wybrało zachowanego Gościa, potwierdziło Home, wykonało `stopApp`/`launchApp` bez `clearState` i ponownie potwierdziło `patternly:content:ready` oraz `patternly:home:primary-action`. Końcową hierarchy i screenshot obejrzano; widoczny był Home, Coding Interview i zachowany postęp. Powtarzalny restart-only flow: [guest-restart.yaml](evidence/C/guest-restart.yaml).

Pierwszy przebieg urządzeniowy nie dotarł do Home, ponieważ dev-clientowy baner `Open debugger to view warnings` nakładał się dokładnie na przycisk Gościa i przejął tap. Hierarchy i prywatny screenshot to potwierdziły. Po warunkowym zamknięciu wyłącznie tego overlayu pojedyncze rzeczywiste kliknięcie Gościa oraz restart przeszły. Pierwszy złożony flow miał następnie techniczny FAIL tylko na próbie `takeScreenshot` do absolutnej ścieżki poza katalogiem runu; osobny capture flow z nazwą względną zakończył się w całości PASS. Prywatne logi i obrazy nie trafiły do repo.

## Granica dowodu

Maestro potwierdza powrót zachowanego Gościa i restart na jednym urządzeniu, nie pełne logowania A/B. Izolację A/B C dowodzi na rzeczywistym routerze i produkcyjnym wrapperze namespacingu nad pamięciowym nośnikiem. Pełne urządzeniowe A/B, adopcja i logout należą do PROFILE-03/04/06.

## Briefing

Pierwszy briefing odrzucono z minimum 0,72, ponieważ walidator błędnie potraktował wymagany push `main` jako deployment. Po doprecyzowaniu jawnej reguły właściciela i granicy nośnika testowego rewalidacja dała APPROVE: spójność 0,91; prostota 0,88; ryzyko 0,87; utrzymywalność 0,90; minimum **0,87**.

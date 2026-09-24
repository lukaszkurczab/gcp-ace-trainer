# AUD-FIXTURE/B1 — lokalny oracle zachowania ownera

**Data:** 24.09.2026

**Status:** `done` dla infrastruktury B1. Podłączenie do flow, Maestro i syntetyczne konta pozostają w B2/B3.

**Briefing i ocena przed zmianą:** pierwsza wersja została odrzucona (zgodność 0,86; prostota 0,68; ryzyko 0,64; utrzymywalność 0,70). Po zawężeniu modułu, doprecyzowaniu cyklu wpisu i rozdzieleniu buildów niezależna walidacja `gpt-6-luna` high oceniła: zgodność 0,88; prostota 0,82; ryzyko 0,84; utrzymywalność 0,81; minimum **0,81**. Implementacja: `gpt-6-luna` high ze względu na granice danych ownera i Metro.

## Zmiana

W buildzie smoke `ownerPreservationOracle` zapisuje losowo solony, wewnętrzny odcisk logicznego zakresu `legacy_owner` pod jednym osobnym kluczem SecureStore. Wpis ma wersję, stan, czas i kontrolę odczytu po zapisie; po restarcie może porównać ten sam zakres bez przełączenia na ownera. Wynik udostępniany aplikacji ogranicza się do `unchanged`, `changed` albo `blocked`. `arm()` wymaga aktywnego ownera, `verify()` wybranego guest; brak, korupcja, przedawnienie lub błąd odczytu daje `blocked`. Cleanup usuwa tylko własny wpis. Odczyt ownera przechodzi przez logiczny adapter, którego zapisy i usuwanie są zabronione.

Metro wybiera implementację i źródło oracle wyłącznie dla trybu smoke; sandbox, release i nieznany tryb otrzymują moduły wyłączone. Produkcyjny `mmkvClient` nie eksportuje odczytu ownera. Wpis SecureStore ma osobny `keychainService` i `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.

## Weryfikacja

- Testy routera i oracle: **13/13 PASS**, w tym `selectGuest` → ponowne otwarcie routera → porównanie, zmiana/dodanie/usunięcie wartości, niewłaściwy profil, brak/uszkodzenie/przedawnienie wpisu i błędy storage.
- Resolver Metro i rzeczywiste wąskie bundle smoke/release: **2/2 PASS**. Kod implementacji i klucz oracle występują w smoke, nie występują w bundle release.
- `npm run typecheck` oraz `git diff --check`: **PASS**.
- Niezależne QA (`gpt-6-luna` high): **PASS** po usunięciu produkcyjnego eksportu danych ownera, wymaganiu prawidłowego profilu i dodaniu testu rzeczywistego grafu bundla. QA wykonało własne testy **15/15** i typecheck.

## Granica i następne kroki

B1 nie uruchamiało symulatora, nie modyfikowało chronionego profilu ani emulatorów. Jest to lokalny oracle regresji, nie kryptograficzny dowód nienaruszalności. `AUD-FIXTURE/B2` podłącza preflight przed jakimkolwiek efektem ubocznym sesji/Auth, jawny wynik w UI wyłącznie smoke i flow Maestro na tym samym iPhonie 17 z `clearState: false`. `AUD-FIXTURE/B3` przygotuje własne konta i kontrolowane dane oraz cleanup tylko zasobów testowych.

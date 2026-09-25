# ODK-119-GATE/A — lokalna bramka nowej sesji Premium

**Status:** `done` / niezależne QA **PASS**  
**Zakres:** aplikacja lokalna; bez backendowego download admission, provider E2E i wdrożenia  
**Baseline:** `main` at `b4328b7c` plus zmiana A

## Wynik

- `TrainingLifecycleUseCases.startSession` jest jednym wspólnym punktem egzekwowania dostępu przed `mutations.start`.
- Cały przygotowany plan jest porównywany z kanonicznym `freeNodeId`. Plan wyłącznie Free nie odczytuje entitlementu; każdy późniejszy element Premium uruchamia bramkę.
- `AccountSessionProvider` pozostaje właścicielem bieżącego konta i świeżego odczytu. Trwałym źródłem offline pozostaje istniejący, związany z kontem cache Premium.
- Tylko jawne `isInternetReachable === false` może użyć cache. Online albo nieznana łączność wymaga świeżego odczytu; błąd, timeout lub wynik niejednoznaczny zwraca `unavailable` bez fallbacku do pozytywnego cache.
- Świeży negatywny wynik zastępuje cache i odmawia. Świeży pozytywny wynik może przywrócić dostęp.
- Odmowa i brak potwierdzenia mają odrębne błędy lifecycle oraz jawne komunikaty PL/EN: wybór bezpłatnego tematu albo ponowienie po połączeniu.

## Dowody

- Testy ukierunkowane controller: 30/30 PASS — domena cache, refresh queue, admission konta, centralny lifecycle, plan mieszany i komunikaty prezentacji.
- Szerszy przebieg konta/lifecycle: 46/46 PASS.
- Typecheck: PASS.
- Parsowanie zmienionych locale: PASS.
- `git diff --check`: PASS.
- Niezależne QA wykryło brak testu planu mieszanego i ogólny komunikat błędu. Po poprawkach retest 24/24 oraz kontrole statyczne przeszły; końcowy werdykt: **PASS**.

## Briefing i granice

Pierwszy briefing: 0,90 / 0,82 / 0,82 / 0,88. Po ustaleniu produkcyjnego mostu Luna High: zgodność/architektura `0,91`, prostota `0,82`, ryzyko `0,85`, utrzymywalność `0,86`; minimum `0,82` — APPROVE.

Slice A nie dowodzi rzeczywistej konfiguracji RevenueCat/sklepów, nie tworzy backendowego endpointu admission/download i nie aktywuje zdalnego pakietu. Te wejścia pozostają kolejno w AUD-04-B/C/D, ODK-119-GATE/B oraz providerowych bramkach wydania. Nie wykonano wdrożenia.

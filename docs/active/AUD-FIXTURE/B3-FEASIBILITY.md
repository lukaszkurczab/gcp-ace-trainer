# AUD-FIXTURE/B3 — wykonalność syntetycznego ownera na istniejącym iPhonie

**Data:** 24.09.2026. **Status:** rozpoznanie `done`; urządzeniowy `legacy_owner` `blocked` przy aktualnym stanie Guest.

**Ocena przed zmianą planu:** zgodność 0,95; architektura 0,94; prostota 0,92; ryzyko 0,90; utrzymywalność 0,93; minimum **0,90**. Korekta dokumentuje granicę faktycznego runtime, bez dodawania testowego bypassu do produktu.

## Dowód z kodu

`profileStorageRouter.ts` tworzy `legacy_owner` tylko podczas pierwszej migracji bez rejestru profili, przy istniejących danych kanonicznych i markerze `account_bound`. Świeża instalacja guest dostaje marker `guest` bez powiązania. Przy istniejącym rejestrze adopcja zwykłego `guest` promuje go do `account`; tylko historyczny `legacy_guest` może zostać `legacy_owner`. Obecny iPhone 17 pokazuje stan Guest w [odczytowym zrzucie Maestro](evidence/b2b-guest-settings.png). Nie ma wspieranej ścieżki UI, która utworzy na nim nowy syntetyczny `legacy_owner` bez resetu, nadpisania rejestru, dostępu do chronionego profilu lub drugiej instalacji.

In-memory test routera i oracle obejmuje syntetyczny marker ownera, wybór guest, ponowne otwarcie routera i sprawdzenie niezmienności (`profileStorageRouter.test.ts`, `ownerPreservationOracle.test.ts`). To jest dowód kontraktu kodu, nie natywnego przejścia na urządzeniu. Nie dodajemy powtórzonego testu ani fałszywego przycisku seedującego ownera.

Backend dopuszcza unikalny `projectId` w `createEmulatorContext`, lecz domyślne `clearFirestore()` usuwa całą bazę projektu `patternly-app-sandbox`. B3a może przygotować wyłącznie własne konta/dokumenty w osobnym projekcie i sprzątać tylko ich identyfikatory. Wspólnego helpera i pełnego emulatorowego zestawu testów nie należy używać do cleanupu B3a.

## Decyzja kolejki

Wydzielić B3a jako izolowany fixture backendowy i syntetyczne dane, a urządzeniowe B3b/B2b-device pozostawić zablokowane do uzyskania wspieranej ścieżki utworzenia lub wyboru syntetycznego `legacy_owner` na tym samym iPhonie bez naruszenia istniejących danych. Nie uznawać aktualnego Guest ani testów pamięciowych za atestację urządzeniową.

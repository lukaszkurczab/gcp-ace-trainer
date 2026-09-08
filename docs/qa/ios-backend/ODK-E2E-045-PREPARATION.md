# ODK-E2E-045 — przygotowanie headingów

Status: VERIFIED_CLOSED. Przygotowanie zachowane jako brief wdrożenia. Wynik opisuje osobny raport.

## Fakty

- Home i Practice używają `typography.title`: 28/34/700.
- Settings używa `ScreenHeader` title: 28/34/700.
- Progress używa 30/36/600. Pusty Progress nadpisuje heading na 24/29/700. Loading używa 30/36/600.
- Settings przekazuje `settingsDescription` w stanie gotowym i loading. Copy istnieje w EN i PL.
- Testy wiążą obecne wartości w `runtimeAuditabilitySurfaces.test.ts`, `loadingStateOwnership.test.ts` i `settingsPresentation.test.ts`.

## Najmniejsza spójna poprawka

Użyć istniejącego `typography.title` dla Progress we wszystkich stanach. Usunąć lokalny wariant pustego headingu. W Settings usunąć opis z ready i loading, modelu tekstu oraz EN/PL. Nie zmieniać odstępów, innych opisów ani górnego context z 042/043.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi. Zgodność 0,96; prostota 0,94; ryzyko 0,90; utrzymywalność 0,94. Minimum 0,90. Werdykt `APPROVE`.

## Bazowy dowód iOS

Maestro `2026-09-08_054500`: 14/14 `COMPLETED`. Obejrzano Home, Progress, Practice i Settings. EN, dark, standardowy tekst, Coding. Widoczny opis Settings potwierdza zakres. Przebieg nie zmienił danych. To dowód przed zmianą, nie retest wdrożenia.

## Wymagana weryfikacja po zmianie

Testy kontraktu i typecheck. Następnie EN/PL, zwykły i maksymalny tekst dla Home, Progress, Practice i Settings. Ready oraz osiągalne loading. Sprawdzić spójność 28/34/700, brak opisu Settings, brak pustej przestrzeni po opisie i brak regresji przewijania.

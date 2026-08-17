# FUI-001 — responsywny wybór długości sesji

## Stan

Implementacja została wypchnięta na `origin/main` w commicie `8daf59f`.

## Root cause

`PracticeSetupScreen` renderował trzy opcje długości sesji w jednym niezwijalnym wierszu. Przy szerokości 360 dp i Android font scale 1.5 wewnętrzna szerokość kafla była zbyt mała dla etykiety `QUESTIONS`, więc React Native łamał ją w środku słowa.

## Zmiana canonical

- `lengthGrid` dopuszcza zawijanie elementów;
- opcja ma minimalną szerokość 108 dp, dzięki czemu przy wąskim ekranie przechodzi do czytelnego układu wielowierszowego;
- poziomy padding został zmniejszony bez zmiany rozmiaru typografii;
- metadana ma jedną linię, więc nie może zostać złamana w środku słowa.

Nie dodano wyjątku Android, zmniejszania fontu, wielokropka ani drugiej implementacji komponentu.

## Weryfikacja

Przeszły:

- `npm run typecheck`
- `npm run gate:contract-change`
- `node --import tsx --test tests/visualShell.test.ts tests/maestroM1Guided10.test.ts tests/maestroM2Custom10AtSessionEnd.test.ts`
- `git diff --check`

Pozostaje do wykonania: Maestro na Android 360×800 dp z font scale 1.5 oraz standardowy checkpoint setup na Android/iOS. Bez tego nie deklaruję jeszcze zamknięcia wizualnego FUI-001.

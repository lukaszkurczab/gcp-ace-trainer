# ODK-E2E-021 — wdrożenie projektu Goal

Status: DONE. Wariant `020=3` wdrożono i zweryfikowano E2E.

## Decyzja PO

PO wybrał subtelny pionowy akcent przy nazwie tracka. Wcześniejszy licznik próśb pozostaje 5/5. Audyt nie zwiększył licznika.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi i bez inspekcji repozytorium: zgodność celu i architektury 0,96; prostota 0,92; ryzyko 0,86; utrzymywalność 0,93. Minimum 0,86. Wynik: APPROVE.

## Wdrożenie

- wspólny ekran Goal używa głównego nagłówka `Set learning rhythm for this track`;
- polski nagłówek brzmi `Ustaw rytm nauki dla tej ścieżki`;
- nazwa aktualnego tracka jest w elastycznej karcie z pionowym akcentem;
- długie nazwy zawijają się bez obcięcia;
- loading zachowuje tę samą hierarchię;
- nie zmieniono formularza, zapisu ani celu powrotu;
- nie dodano nowej ścieżki ani fallbacku dla nazw tracków.

## Weryfikacja

- testy celu i nawigacji: 36/36 PASS;
- typecheck: PASS;
- `npm run qa:static`: PASS, 891/891 testów, 0 błędów;
- content boundary i runtime privacy boundary: PASS;
- Maestro, wejście z Home: PASS;
- Maestro, wejście z Progress oraz Settings: PASS;
- EN/light i PL/dark: PASS;
- systemowy rozmiar tekstu `accessibility-large`: PASS;
- obejrzano pięć zrzutów. Karta, akcent i zawijanie są poprawne;
- VoiceOver pominięto na polecenie PO.

Pierwsze dwa przebiegi PL/dark zatrzymały błędne oczekiwanie testu, że zmiana języka tłumaczy nazwę pakietu. Kod poprawnie zachował kanoniczną nazwę `Backend System Design`. Po korekcie wyłącznie tymczasowego scenariusza przebieg zakończył się powodzeniem.

## Wynik

ODK-E2E-020 i ODK-E2E-021 są zakończone. Oba zadania usunięto z aktywnego rejestru. Następne zadanie według kolejności planu to ODK-E2E-024.

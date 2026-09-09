# ODK-E2E-033 — Progress plan

## Wynik

PASS.

Progress pokazuje jeden kanoniczny obraz planu. Widok zawiera ukończony zakres, wymagane i faktyczne tempo, prognozę, termin, status i dalszą akcję. Nie wylicza tych danych ponownie.

## Zakres zmiany

- Rozszerzono istniejący snapshot Home o wynik C3 i jawne guidance dla braku planu.
- Progress używa tego samego snapshotu i istniejącej prezentacji target date.
- Dodano jawne stany braku celu, wstrzymanego celu, braku planu, nieznanej reguły i błędu technicznego.
- Dodano status dnia, parametry następnej sesji i maksymalnie dwie akcje.
- Aktywna sesja ma pierwszeństwo. Progress nie proponuje wtedy uruchomienia kolejnej sesji.
- Ukończony cel nie tworzy odsyłacza z Progress do Progress.
- Dodano EN/PL, selektory runtime i układ dla dużego tekstu.

## Kanoniczne źródła

- `HomePlanSnapshotReader` pozostaje jedynym czytnikiem planu dla Home i Progress.
- `TargetDateGuidancePresentation` pozostaje właścicielem statusu, tekstu, faktów i akcji.
- C3 pozostaje właścicielem ukończonego zakresu.
- Pełna tożsamość tracka, planu, rewizji i pakietu jest sprawdzana fail-closed.

## Weryfikacja

- Niezależna walidacja briefu: APPROVE. Minimum: 0,81.
- Pełna bramka `qa:static`: PASS.
- Testy: 1023/1023 PASS.
- TypeScript: PASS.
- Content boundary: PASS.
- Runtime privacy boundary: PASS.
- `git diff --check`: PASS.
- Niezależny QA po poprawce: PASS.
- iOS Maestro na `Maestro_IOS_iPhone-17_26`, iOS 26.4: PASS.
- Widoczne selektory: `patternly:progress-plan:root` i `patternly:target-date-guidance:root:progress`.
- Kadr sprawdzono wizualnie. Nie ma kolizji, ucięć ani zbędnej drugiej akcji w badanym stanie.

VoiceOver pominięto zgodnie z decyzją właściciela. Provider i release gate’y ODK-E2E-082–088 oraz 099 pozostały poza zakresem.

## Ocena po wdrożeniu

- Dopasowanie do celu i architektury: 0,95. Progress korzysta z istniejących właścicieli danych i prezentacji.
- Prostota: 0,88. Dodano jeden mały model prezentacji bez drugiego czytnika planu.
- Ryzyko: 0,86. Pełna tożsamość jest sprawdzana, a niepewne stany są jawne.
- Utrzymywalność: 0,90. Kontrakty są typowane i mają testy zachowania.
- Wynik minimalny: 0,86.

## Ograniczenia

- Nieznana reguła C3 pokazuje jawny brak zakresu. Nie tworzy sztucznego procentu.
- ODK-E2E-034, ODK-E2E-054 i pełny przepływ ODK-E2E-035 pozostają osobnymi zadaniami.

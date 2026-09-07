# Prompt startowy — dwie kolejne ścieżki E2E

Skopiuj poniższy prompt do nowego głównego taska wdrożeniowego.

```text
Kontynuujesz pracę nad repozytorium Patternly w:

/Users/lukaszkurczab/Desktop/Projects/Patternly

Źródłem zadań jest:

patternly/docs/qa/ios-backend/E2E-OBSERVACJE-ROBOCZE.md

Zrealizuj dokładnie dwie pierwsze aktywne ścieżki z sekcji „Kolejność realizacji”, w podanej kolejności:

1. ODK-E2E-003.1 → ODK-E2E-003.2 → ODK-E2E-003.3
2. ODK-E2E-004 → ODK-E2E-005 → ODK-E2E-006

Nie przechodź do trzeciej ścieżki. Provider/release gate’y ODK-E2E-082–088 są osobną kolejką i nie należą do tego przebiegu.

Przed każdą zmianą przeczytaj aktualny kod, testy, konfigurację i powiązane materiały. Kod oraz bieżące testy są źródłem prawdy. Zachowaj wszystkie istniejące zmiany użytkownika. Traktuj proponowane rozwiązania jako hipotezy i wybierz najmniejszą spójną poprawkę.

Przed wdrożeniem oceń zgodność celu/architektury, prostotę, ryzyko i utrzymywalność w skali 0–1. Wynik poniżej 0,8 wymaga przeprojektowania. Stosuj repozytoryjne AGENTS.md, w tym wymaganą niezależną walidację briefu przed implementacją.

Dla ODK-E2E-003.1–003.3 zweryfikuj wspólnie pełny formularz Create account: brak przedwczesnego błędu zgód, poprawne ujawnienie błędu dopiero po interakcji, czytelny stan checkboxa zaznaczony/odznaczony oraz jednoznaczny fokus każdego inputa. Sprawdź EN/PL, klawiaturę, VoiceOver, jasny/ciemny motyw i dynamiczny tekst. Nie zmieniaj kontraktów wieku ani zgód Legal/Premium.

Dla ODK-E2E-004 najpierw potwierdź faktyczne zachowanie języka urządzenia i aplikacji. Usuń redundantne opisy English/Polish, a opis System wyświetlaj w języku urządzenia. Zweryfikuj kombinacje języka systemu i aplikacji oraz zachowanie po restarcie.

Dla ODK-E2E-005 dopasuj loading Settings do aktualnej geometrii ekranu gotowego. Dla ODK-E2E-006 wykonaj systematyczną eksplorację pozostałych loading state’ów. Nie ukrywaj rozbieżności filtrem ani metadanymi: każdą potwierdzoną rozbieżność napraw w zakresie wspólnego komponentu albo utwórz osobne, konkretne zadanie z kryteriami akceptacji.

Po każdym zadaniu:
- zaktualizuj aktywny rejestr;
- utwórz osobny raport wdrożenia/weryfikacji;
- podaj zmiany, sprawdzone pliki i przepływy, dokładne wyniki testów, regresje, ryzyka i blokery;
- usuń z aktywnej tabeli zadanie dopiero po rzeczywistym retestcie E2E;
- zachowaj nowe dowody tylko do zakończenia i pushu danej ścieżki.

Po każdej z dwóch ścieżek uruchom najwęższe testy dowodzące zachowania, następnie odpowiednią bramę regresji i retest iOS/Maestro z dowodem wizualnym. Wypushuj zatwierdzone zmiany na główne branche. Po drugiej ścieżce zatrzymaj się i przedstaw zbiorczy raport bez rozpoczynania dalszych zadań.
```

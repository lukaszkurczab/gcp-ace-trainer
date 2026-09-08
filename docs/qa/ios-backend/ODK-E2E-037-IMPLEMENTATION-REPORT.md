# ODK-E2E-037 — raport wdrożenia i weryfikacji

Status: DONE

## Wynik

Gość bez celu widzi na Home krótkie zaproszenie. Może ustawić cel albo wybrać „Not now”. Główna akcja nauki pozostaje dostępna.

Pominięcie jest trwałe i osobne dla każdego tracka. Zapis celu wraca do Home i ukrywa zaproszenie.

## Zmiany

- dodano lokalne repozytorium preferencji onboardingu;
- dodano warunki pokazania i obsługę błędu na Home;
- dodano powrót z Goal do Home;
- dodano copy EN i PL oraz stabilne selektory;
- dodano testy repozytorium, prezentacji i dużego tekstu;
- dodano przepływ Maestro dla gościa.

## Sprawdzone pliki i przepływy

Sprawdzono Home, Goal, nawigację, magazyn lokalny, tłumaczenia, selektory i przepływ Maestro. Sprawdzono też restart aplikacji oraz zmianę tracka.

## Walidacja briefu

Niezależna ocena: 0,95 / 0,86 / 0,93 / 0,91. Minimum 0,86. APPROVE.

## Testy

- pełna brama statyczna: 891/891;
- testy wąskie: 16/16;
- TypeScript: PASS;
- kontrola granic treści: PASS;
- kontrola prywatności runtime: PASS;
- Maestro iOS: PASS, jeden pełny przepływ.

## Retest wizualny

Sprawdzono pięć stanów: zaproszenie Coding, stan po pominięciu, zaproszenie Backend, Goal otwarty z Home i Home po zapisie. Układ jest czytelny. Tekst nie nachodzi na akcje. Główna akcja nauki pozostaje widoczna i aktywna.

Trzy wcześniejsze uruchomienia przerwały się przez przygotowanie harnessu: systemowe potwierdzenie linku, ekran odzyskiwania i niedozwoloną bezwzględną ścieżkę zrzutu. Nie wykazały regresji produktu.

## Ryzyka i blokery

Preferencja pominięcia należy do urządzenia. Nie jest synchronizowana i celowo przeżywa czyszczenie danych nauki. Istniejący stan niedostępnej sesji nadal może wyłączyć główną akcję. Onboarding tego nie zmienia.

Brak blokera dla ODK-E2E-037.

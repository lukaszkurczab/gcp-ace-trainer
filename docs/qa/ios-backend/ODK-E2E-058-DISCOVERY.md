# ODK-E2E-058 — discovery wersji, hashy i audytu dokumentów

Status: `WONT_FIX`

Data: 2026-09-07

## Decyzja właściciela produktu

Właściciel produktu jawnie ograniczył rozwiązanie do:

- jednego edytowalnego pliku `src/legal/legalVariables.ts`;
- dwóch dokumentów tekstowych EN/PL;
- dwóch ekranów służących do ich wyświetlania;
- mechanizmów technicznych wymaganych operacyjnie lub prawnie, np. retencji danych.

Wykluczono automatyczne walidatory, hashe i testy dokumentów. Decyzja ta
zastępuje wcześniejszy opis ODK-E2E-058 obejmujący kanonizację, SHA-256,
podpisywanie artefaktów i manifest akapitów.

## Stan repozytorium

- `src/legal/legalVariables.ts` jest pojedynczym miejscem edycji zmiennych i
  jawnie nie wykonuje walidacji runtime;
- `src/legal/termsOfService.ts` i `src/legal/privacyPolicy.ts` są prostymi
  szablonami tekstowymi korzystającymi z tych zmiennych;
- `documentVersion` i daty wejścia w życie pozostają edytowalnymi zmiennymi;
- ekrany mobilne wyświetlają gotowy tekst bez pipeline'u publikacji;
- nie istnieje produkcyjny pipeline podpisów, hashy ani manifestów dokumentów.

## Ocena przed zmianą

- zgodność z celem i architekturą: 0,99;
- prostota: 0,99;
- ryzyko: 0,97;
- utrzymywalność: 0,98;
- minimum: 0,97.

Najmniejszym spójnym rozwiązaniem jest zachowanie aktualnej implementacji i
zamknięcie zadania jako świadomie odrzuconego, zamiast dodawania równoległego
systemu publikacji sprzecznego z decyzją właściciela.

## Wynik

Nie dodano kodu. ODK-E2E-058 otrzymuje status `WONT_FIX` z powodu jawnej decyzji
produktowej. Brak hashy lub podpisanego manifestu nie będzie używany jako
zależność ani blocker kolejnych zadań. Ewentualny wymagany dowód akceptacji może
odwoływać się do jawnej wartości `documentVersion`, ale nie może przywracać
odrzuconych hashy, walidatorów ani testów dokumentów.

## Weryfikacja

- potwierdzono pojedynczy plik zmiennych oraz dwa tekstowe dokumenty EN/PL;
- przeszukano kod aplikacji pod kątem istniejącego rejestru akceptacji,
  wersjonowania i hashy dokumentów;
- nie uruchamiano testów, ponieważ nie zmieniono kodu wykonywalnego.

## Ryzyka i blokery

Przed publikacją nadal trzeba ręcznie uzupełnić wartości oznaczone
`TO BE COMPLETED`. Brak blokera implementacyjnego dla tej decyzji.

Następne zadanie: `ODK-E2E-074`.

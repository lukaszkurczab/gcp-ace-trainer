# ODK-E2E-074 — discovery dowodu wersji i zgody

Status: `WONT_FIX`

Data: 2026-09-07

## Wynik

ODK-E2E-074 jest wykonawczym duplikatem odrzuconej części ODK-E2E-058:
zakłada podpisany artefakt, hashe dokumentu i manifestu akapitów oraz testy
odrzucania starego lub ręcznego hasha. Właściciel produktu jawnie wykluczył te
mechanizmy, pozostawiając jeden plik zmiennych, dwa dokumenty tekstowe i dwa
ekrany.

Nie istnieje niezależny, zaakceptowany zakres ODK-E2E-074, który można wdrożyć
bez przywrócenia odrzuconej infrastruktury. Zadanie otrzymuje więc `WONT_FIX`.

## Ocena przed zmianą

- zgodność z celem i architekturą: 0,99;
- prostota: 0,99;
- ryzyko: 0,98;
- utrzymywalność: 0,98;
- minimum: 0,98.

## Zasada dla dalszych zadań

`documentVersion` pozostaje zwykłą, edytowalną zmienną dokumentu. Kolejne
zadania nie mogą traktować hashy, podpisów, manifestu akapitów ani testów
dokumentów jako zależności lub warunku ukończenia.

Jeżeli operacyjny przepływ rejestracji lub zakupu będzie wymagał zapisania faktu
akcji użytkownika, taki zapis należy zaprojektować wyłącznie w zakresie
rzeczywiście potrzebnym temu przepływowi i bez automatycznej walidacji treści
dokumentu.

## Weryfikacja

- porównano kryteria ODK-E2E-074 z ODK-E2E-058;
- potwierdzono, że oba zadania wymagają tego samego odrzuconego pipeline'u;
- nie zmieniono kodu wykonywalnego, więc nie uruchamiano testów aplikacji.

## Ryzyka i blokery

Brak blokera implementacyjnego. Ręczne uzupełnienie wersji i pozostałych
zmiennych nadal jest wymagane przed publikacją.

Następne zadanie: `ODK-E2E-062`.

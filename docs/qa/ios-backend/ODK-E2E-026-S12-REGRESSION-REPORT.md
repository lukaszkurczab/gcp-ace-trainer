# ODK-E2E-026 S12 — raport poprawki regresji

Data: 2026-09-08  
Status: `VERIFIED_CLOSED`

## Przyczyna

Reguła `truthful_to_eligible_count` używała stałego minimum `1`. Nie spełniało to decyzji PO `026S=S12`, która wymaga sensownej skróconej ścieżki zdefiniowanej przez pakiet.

## Poprawka

- Resolver wymaga dodatnich, unikalnych i ściśle rosnących `requestedLengths`.
- Zweryfikowany kontrakt wyprowadza `minimumActualLength` z najmniejszej jawnie wspieranej długości pakietu.
- Tylko `truthful_to_eligible_count` pozwala skrócić sesję do tego minimum.
- Inne polityki wymagają pełnej żądanej długości.
- Nie zmieniono podpisanych bajtów pakietów.

## Ocena briefu

- Cel i architektura: `0.95`
- Prostota: `0.92`
- Ryzyko: `0.86`
- Utrzymywalność: `0.93`
- Minimum: `0.86` — `APPROVE`

## Weryfikacja

- Niezależny QA: `PASS`, bez blockerów.
- Testy wąskie: `PASS`.
- `npm run qa:static`: `PASS`, 920/920 testów.
- Typecheck, content boundary i runtime privacy boundary: `PASS`.
- Maestro: nie dotyczy. Zmiana nie modyfikuje widocznego interfejsu ani ścieżki iOS.

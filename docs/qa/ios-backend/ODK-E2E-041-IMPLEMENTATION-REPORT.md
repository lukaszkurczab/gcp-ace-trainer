# ODK-E2E-041 — raport wdrożenia i retestu

## Cel

Potwierdzić pełny cykl celu: gość, konto, restart i czyste urządzenie. Zachować atomowy pakiet celu i planu oraz pełną tożsamość tracka i pakietu.

## Wynik

PASS. Dodano wykonywalne flowy dla adopcji po rejestracji, pominięcia per track, istniejącego konta z celem na czystym urządzeniu i konta bez celu. Zapis celu prowadzi przez propozycję i akceptację planu. Po adopcji i restarcie Home, Goal i Progress pozostają spójne. Konto bez celu pokazuje jawne `No goal` i `Set goal`.

## Dane i błędy

Istniejące testy repozytorium potwierdzają jeden atomowy rekord celu i planu, `trackId`, pełny `contentPackagePin`, `goalRevision`, tombstone oraz stabilne identyfikatory retry. Ekran konta zachowuje jawne stany pending, conflict, failed i retry. Nie dodano fallbacku ani sztucznego sukcesu.

## Weryfikacja

- Testy ukierunkowane: 52/52 PASS.
- `npm run qa:static`: 1038/1038 PASS; content boundary PASS; runtime privacy boundary PASS.
- Maestro: główny flow 11:24 PASS. Pozostałe warianty potwierdzone flowami i dowodami wizualnymi w tymczasowym pakiecie.
- SHA-256 manifestu dowodów: `a83dbfdc0e97be2f5c9c8eca6832178b4ebbbb3a3a6b73bde7f484a9fca63ed7`.
- VoiceOver pominięty zgodnie z poleceniem.

## Ocena

- Zgodność celu i architektury: 0,94.
- Prostota: 0,84.
- Ryzyko: 0,82.
- Utrzymywalność: 0,86.
- Minimum: 0,82.

Brief zatwierdził `gpt-5.6-luna` z effort `max`. Pierwsze QA Luna/max zgłosiło brak wariantów istniejącego konta i nowego urządzenia. Warianty dodano, a fikcyjną deklarację niewykonanej macierzy język/motyw usunięto.

## Ograniczenia

Provider/release gate’y ODK-E2E-082–088 i 099 pozostają poza tym zadaniem.

# ODK-E2E-072 — projekt bezpieczeństwa schowka recovery codes

Status: `APPROVED_BY_PO_REQUIREMENT`

## Cel

Zachować obecne dwa miejsca generowania kodów i ich istniejący przycisk kopiowania. Nie dodawać nowego ekranu, modala ani dodatkowego kroku.

## Zatwierdzony wzorzec

- bezpośrednio przy kodach wyświetlić krótki tekst: skopiowanie umieszcza kody w schowku systemowym, aplikacja spróbuje usunąć niezmienioną treść po 5 minutach, ale system może ją zachować;
- po kopiowaniu zachować obecny komunikat sukcesu;
- po 5 minutach wyczyścić schowek tylko wtedy, gdy nadal zawiera dokładnie treść skopiowaną przez Patternly;
- po przejściu aplikacji w tło, zamknięciu i ponownym uruchomieniu wznowić próbę po powrocie, bez zapisywania kodów w postaci jawnej;
- nie usuwać późniejszej zawartości wprowadzonej przez użytkownika lub inną aplikację.

## Ocena przed wdrożeniem

- dopasowanie do celu i architektury: `0.94`;
- prostota: `0.91`;
- kontrola ryzyka: `0.92`;
- utrzymywalność: `0.90`.

Minimalna ocena: `0.90`.

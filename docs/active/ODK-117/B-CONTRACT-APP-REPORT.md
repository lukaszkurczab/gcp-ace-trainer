# ODK-117/B-CONTRACT — raport aplikacji

**Status:** `done / niezależne QA PASS WITH ISSUES` (kwestia dokumentacyjna usunięta przed commitem).

## Cel i granica

Zaimplementowano siedem locale kontraktu prawnego na jawnych danych syntetycznych bez danych PO i bez wdrożenia. Produkcyjny rekord `config/public-legal.release.json`, eksport release i runtime aplikacji pozostają EN/PL. Nowe teksty DE/FR/ES/IT/ET są wyłącznie `testOnly`, mają `approvalStatus: UNAPPROVED` i nie stanowią aprobaty językowej ani prawnej.

Briefing `Cel / Ustalenia / Podejście` zatwierdził implementację przy ocenach: zgodność 0,88, prostota 0,86, ryzyko 0,82, utrzymywalność 0,85 (minimum 0,82).

## Wynik

- Schemat produkcyjny pozostaje `patternly-public-legal-export-v1`; release nadal wymaga EN/PL i odrzuca klucze/locale testowego draftu.
- Osobny builder testowy rozszerza wszystkie lokalizowane zmienne do `en/pl/de/fr/es/it/et` i generuje jawnie niezatwierdzony artefakt.
- Pełne drafty DE/FR/ES/IT/ET zachowują względem EN: 14 sekcji i 38 akapitów polityki, 22 sekcje i 65 akapitów warunków oraz identyczne zbiory tokenów interpolacji.
- Każde locale ma osobny moduł testowy; agregator jest jedynym wejściem eksportu testowego. Kod produkcyjnego runtime nie importuje draftów.
- Fingerprint obejmuje syntetyczne źródło i komplet draftów, dzięki czemu skrócenie lub zmiana treści zmienia kontraktowy artefakt.

## Weryfikacja

- `node --test --import tsx scripts/exportPublicLegal.test.mjs`: 4/4 PASS.
- `node --test --import tsx src/legal/legalVariablesSchema.test.ts`: 10/10 PASS (niezależne QA).
- `npm run check:legal-variables`: PASS, tryb `test`.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- Rzeczywisty siedmiojęzyczny artefakt w `/tmp` przeszedł hook producent–konsument web 2/2; osobno przeliczony fingerprint: `4fbdb23b7c87299261db79ade01a399ff9b1677a99f58c63a690d9864adbdb8c`.
- Niezależne QA: `PASS WITH ISSUES`; jedyną naprawialną kwestią były nieaktualne raporty aplikacji/web, poprawione przed commitem.

## Ograniczenia

`node scripts/releaseGate.mjs` nadal zwraca `not_ready`, ponieważ rzeczywiste pola EN/PL i linki wymagają danych ODK-116-B. To oczekiwana granica B-CONTRACT, nie dowód gotowości wydania. Nie wykonano wdrożenia ani zmiany backendu.

# ODK-E2E-080 — raport wdrożenia

Status: `FIXED_PENDING_RETEST`

## Wynik

Każdy gość korzysta z jednego istniejącego formularza raportu, bez pytania o wiek. Dwie krótkie informacje są widoczne od razu, a szczegółowy zakres transmisji i link do Polityki prywatności są rozwijane w tym samym arkuszu. Nie ma checkboxa ani osobnego kroku.

## Zmiany

- opis jest opcjonalny, ma limit 280 znaków, a brak opisu przyjmuje neutralną wartość;
- mobile i backend przed utrwaleniem odrzucają oczywisty e-mail, telefon, URL, hasło lub kod;
- konto, kontakt, odpowiedź i pełne wyjaśnienie nie są automatycznie dołączane;
- szczegóły wymieniają kategorię, opcjonalną notatkę, losowy identyfikator zgłoszenia, identyfikatory i wersję treści, ekran, język, wersję aplikacji, platformę, czas, token bezpieczeństwa oraz obsługę IP;
- surowy IP nie jest utrwalany; backend tworzy jednokierunkowy identyfikator wyłącznie do rate limitingu;
- zaakceptowany raport jest usuwany po potwierdzeniu, a niepotwierdzona lokalna kolejka wygasa po 30 dniach;
- Privacy Policy EN/PL opisuje cele, art. 6 ust. 1 lit. f, interes Administratora, prawo sprzeciwu oraz okres identyfikatora rate-limit przez edytowalną zmienną.

## Najważniejsze pliki

- `src/features/reports/ContentReportSheet.tsx`
- `src/domain/contentReportDescription.ts`
- `src/application/contentReports/contentReportService.ts`
- `src/storage/repositories/contentReportOutboxRepository.ts`
- `src/legal/legalVariables.ts`
- `src/legal/privacyPolicy.ts`
- `src/locales/en/common.json`, `src/locales/pl/common.json`
- backend: `src/modules/content-reports/contracts.ts`, `src/api/openapi.ts`

## Weryfikacja

- mobile pełny zestaw przed ostatnimi uzupełnieniami: 806/806 `PASS`;
- mobile focused po wszystkich zmianach: 18/18 `PASS`;
- mobile typecheck: `PASS`;
- mobile runtime privacy boundary: `PASS`;
- backend emulator po zmianie kontraktu: 54/54 `PASS`;
- backend contract: 3/3 `PASS`;
- backend lint, typecheck, build i OpenAPI check: `PASS`;
- `git diff --check` w obu repozytoriach: `PASS`;
- niezależny QA po poprawce rozjazdu `.edu`/`.gov`: `PASS`.
- finalny review prawny PL/UE po poprawkach: `APPROVE`, pewność 0,99.

## Ryzyka i warunki publikacji

- filtr wzorcowy ogranicza oczywiste przypadki, ale nie gwarantuje wykrycia każdego imienia, adresu ani odpowiedzi; dlatego ostrzeżenie pozostaje widoczne;
- przed publikacją trzeba uzupełnić prawdziwe wartości w `src/legal/legalVariables.ts`, w tym okres serwerowego okna rate-limit;
- aktywne TTL Firestore dla raportów i bucketów rate-limit pozostaje do dowodu w ODK-E2E-066;
- automatyczny przebieg zrzutów na symulatorze został przerwany przez niestabilność lokalnego CoreSimulator; pozostaje ponowny device retest, dlatego status to `FIXED_PENDING_RETEST`.

## Ocena po wdrożeniu

- dopasowanie do celu i architektury: 0,94;
- prostota: 0,91;
- ryzyko: 0,88;
- utrzymywalność: 0,91.

Rozwiązanie pozostaje jednym formularzem i jednym helperem walidacji po stronie aplikacji oraz analogiczną granicą backendu. Dodatkowy mechanizm retencji wykorzystuje istniejący bootstrap repozytoriów.

## Następne zadanie

`ODK-E2E-070` — discovery i projekt atomowej migracji MMKV do szyfrowanego magazynu.

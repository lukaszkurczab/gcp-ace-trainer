# AUD-14 — Your Data i Dynamic Type

**Status:** PASS
**Data:** 27 września 2026
**Urządzenie:** istniejący iPhone 17 Simulator, iOS 26.4, `7F315654-3175-4F3C-BB24-B0263F59360C`

## Ustalenie

Standardowy układ oraz cold launch przy `accessibility-extra-large` były poprawne, ale zmiana rozmiaru tekstu podczas działania aplikacji pozostawiała stare bounds natywnych tekstów w `InfoBlock` i `ListRow`. Przyczyną był brak obserwacji `fontScale` i odtworzenia tych natywnych węzłów po zmianie Dynamic Type.

## Zmiana

- `InfoBlock` obserwuje `fontScale` i odtwarza title/body po jego zmianie.
- `ListRow` robi to samo dla title/detail/meta.
- Zachowano copy, style, role i etykiety accessibility, akcje oraz limit dwóch linii tytułu.
- Dodano wąską regresję strukturalną dla wszystkich pięciu węzłów tekstowych i zachowanych kontraktów.

## Evidence

- Przed poprawką live `medium → accessibility-extra-large` pozostawiał standardowe bounds `InfoBlock` i wierszy; cold launch przy tym samym dużym rozmiarze renderował układ poprawnie.
- Po poprawce, bez cold launch, nagłówek zmienił bounds z `[20,142][382,174]` na `[20,142][382,210]`, a `InfoBlock` i wiersze przeliczyły wysokość. Screenshot prezentacji: `/private/tmp/aud14-live-large.png` (artefakt lokalny, nie dowód zachowania backendu).
- Maestro na tym samym urządzeniu potwierdziło przewijanie, `Data details → Close`, otwarcie potwierdzenia resetu i `Cancel` bez resetu oraz `Privacy requests → Go back` bez wysłania formularza.
- Po odbiorze przywrócono rozmiar tekstu `medium`. Nie utworzono urządzenia ani drugiej instalacji.

## Weryfikacja

- `node --import tsx --test src/preferences/settingsPresentation.test.ts src/features/home/yourDataPresentation.test.ts src/tracks/coding-interview/algorithmsSessionAccessibility.test.ts` — 41/41 PASS.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- Niezależne QA (`gpt-6-luna high`, `qa-gate`) — PASS; 26/26 niezależnych testów, typecheck i diff-check PASS.

## Ograniczenia

- Screenshot potwierdza wyłącznie layout. AUD-14 nie zmienia i nie deklaruje zachowania backendu.
- Nie wykonywano resetu danych ani wysłania privacy request; kryterium dotyczyło dostępności i poprawnego działania bezpiecznych wejść/anulowania.

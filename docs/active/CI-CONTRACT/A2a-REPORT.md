# CI-CONTRACT/A2a — źródłowe bramki contentu

**Data:** 24.09.2026

**Status:** `done` dla A2a po weryfikacji lokalnej i niezależnym QA; cały `CI-CONTRACT/A2` pozostaje `partial`.

**Ocena przed zmianą:** zgodność z celem i architekturą 0,90; prostota 0,85; ryzyko 0,82; utrzymywalność 0,86; minimum 0,82. Niezależna walidacja briefingu: `gpt-6-luna` high, 0,85. Implementacja: `gpt-6-luna` medium.

## Przyczyna i zmiana

Workflow content publishing i launch readiness wywoływały nieistniejące komendy walidacji źródeł. Zastąpiono je istniejącym `content:build-all` oraz `content:test` dla każdego ID tracku z kanonicznego katalogu. Build zapisuje wynik w katalogu tymczasowym runnera, więc nie zanieczyszcza checkoutu. Launch readiness zachowuje identyfikatory kroków, `continue-on-error` i końcową agregację wyników.

Nie zmieniono bramek candidate readiness, review packets ani manual release. Obecne workflow content publishing nadal zatrzyma się na brakujących komendach A2b. Draft kandydata nie jest dowodem admission.

## Weryfikacja

- Oba workflow parsują się jako YAML; `git diff --check` bez błędów.
- `content:build-all` utworzył dziewięć tracków poza checkoutem.
- `content:test` uruchomiony według kanonicznego katalogu zaliczył dziewięć tracków i 16 077 odpowiedzi.
- `tests/content-builder.test.mjs`: PASS 17/17, w tym negatywne przypadki brakującego i pustego źródła.
- Niezależne QA (`gpt-6-luna` high): **PASS WITH GAPS** dla A2a. Potwierdzono YAML, dziewięć artefaktów poza checkoutem, scoring wszystkich 16 077 odpowiedzi i zachowaną agregację launch readiness. `validateCatalog` wymaga dokładnie dziewięciu zaakceptowanych ID. Luka dotyczy otwartych bramek A2b, nie wyniku A2a.
- Hosted [content publishing run 35973400014](https://github.com/lukaszkurczab/patternly-content/actions/runs/35973400014): `npm test`, build dziewięciu tracków i scoring katalogu **SUCCESS**. Cały run **FAIL** na następnym, wciąż nieistniejącym `generate:candidate-readiness`; późniejsze kroki zostały pominięte.

## Następny krok

`CI-CONTRACT/A2b`: oprzeć candidate readiness, review packets i manual release na rzeczywistych kontraktach oraz dowodach. Nie oznaczać całego CI jako PASS po A2a. `CI-CONTRACT/A3` nadal wymaga rozstrzygnięcia źródła SHA bieżącego buildera.

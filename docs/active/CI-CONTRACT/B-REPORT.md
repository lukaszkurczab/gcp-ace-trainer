# CI-CONTRACT/B — obowiązkowe testy kandydata

**Status:** `done`  
**Zakres:** lokalny kontrakt exact-SHA; bez admission, publikacji i wdrożenia

## Wynik

- `patternly-content` uruchamia testy draft-v2, readiness-v2 i release-gate-v2
  w `npm test`; exact-SHA `launch-readiness` wykonuje ten gate i wymaga jego
  sukcesu w końcowym agregatorze. Nie dodano drugiej, równoległej bramki.
- Po A3 naprawiono integrację gate’u aplikacji: workflow odczytuje historyczny
  `producerCommit` z app release locka, checkoutuje go osobno i przekazuje
  aplikacji historyczny root, bieżący root oraz dokładny `content_commit`.
- Historyczny checkout ma kontrolę HEAD i czystości przed oraz po gate’ach. Jego
  resolution, checkout i wyniki są częścią fail-closed agregatora.
- Release lock, generated content, runtime i admission pozostały niezmienione.

## QA i weryfikacja

- Briefing: zgodność 0,96; prostota 0,87; ryzyko 0,84;
  utrzymywalność 0,90; minimum 0,84 — APPROVE.
- Niezależne QA: **PASS**.
- Test kontraktu workflow: 11/11 PASS, w tym mutacje historycznego locka,
  checkoutu, rootów, SHA, HEAD/clean i końcowego agregatora.
- `patternly-content npm test`: 67/67 PASS; trzy suite’y candidate wykonały się
  w tym przebiegu.
- Test app cross-repo: 3/3 PASS z historycznym HEAD `cc3efca…`, bieżącym
  `21707b6…` i pełnym oczekiwanym SHA. YAML i `git diff --check`: PASS.
- Pełne `npm run qa:static` zatrzymało się przed typecheck/testami na istniejącym
  `recovery:check`: cztery importy MMKV w `AccountSessionProvider`,
  `ProfileStoragePreparationGate`, `accountDataExportService` i
  `profileStoragePreparationContext`. Nie raportować pełnego `qa:static` jako
  PASS; problem jest poza diffem B i pozostaje jawną bramką repozytorium.

## Granice

B potwierdza obowiązkowość testów kandydata i wykonywalne okablowanie po A3.
Nie uruchamia hosted workflow, nie przyznaje admission i nie wdraża. Następny
slice `CI-CONTRACT/C` dotyczy właściwego przebiegu exact-SHA dla czterech repo.

# CI-CONTRACT/A3 — historyczny release lock i bieżący builder

**Status:** `done`  
**Zakres:** lokalne CI aplikacji; bez repinu, admission, publikacji i wdrożenia

## Wynik

- Workflow aplikacji utrzymuje osobny checkout dokładnego `producerCommit`
  zapisanego w historycznym `release.lock.json`.
- Drugi checkout pobiera bieżący `patternly-content/main`, rozpoznaje jego pełny
  SHA, zapisuje go w logu i przekazuje do testu jako niezależne oczekiwanie.
- Test historycznych artefaktów wymaga zgodności HEAD z lockiem. Testy
  bieżącego buildera wymagają pełnego oczekiwanego SHA i zgodności HEAD;
  brak zmiennej, błędny root lub niezgodne SHA nie mogą dać pozornego PASS.
- Historyczny release lock, wygenerowany content aplikacji, runtime i admission
  pozostały niezmienione.

## QA i weryfikacja

- Briefing: zgodność 0,96; prostota 0,88; ryzyko 0,94;
  utrzymywalność 0,90; minimum 0,88 — APPROVE.
- Pierwsze niezależne QA: **FAIL** — oczekiwany SHA był opcjonalny, a
  rozpoznany SHA nie był widoczny w logu workflow.
- Naprawa: bezwarunkowy kontrakt `PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA`
  w obu testach buildera oraz jawne logowanie rozpoznanego SHA.
- Końcowe niezależne QA: **PASS**.
- Test cross-repo: 3/3 PASS na osobnym historycznym checkoutcie
  `cc3efca88be7e01137f10ac69a0643f06b61a350` i bieżącym checkoutcie
  `21707b615341a6b44c8d5f933d44d9e18e7941b8`.
- Negatywne przypadki braku SHA, błędnego roota i niezgodnego SHA: FAIL zgodnie
  z kontraktem. `check:content-release`: PASS dla 9 tracków / 117 nodes /
  943 mental units / 16 077 pytań. Typecheck, parsowanie YAML i
  `git diff --check`: PASS.

## Granice

To jest naprawa lokalnej bramki QA. Nie przyznaje publishing/runtime admission,
nie zmienia app release locka i nie wykonuje wdrożenia. Kolejne slice’y
`CI-CONTRACT/B` i `CI-CONTRACT/C` pozostają oddzielne.

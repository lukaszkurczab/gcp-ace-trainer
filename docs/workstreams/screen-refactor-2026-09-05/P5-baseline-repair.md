# P5 — naprawa dwóch stale baseline assertions

## Wykonanie

- Model: `gpt-5.6-luna`
- Effort: `max`
- Worktree: `/private/tmp/patternly-activity-refactor`
- Zakres: wyłącznie testy; bez zmian production code, YAML, runnera i dependencies.
- Commit: brak; zmiany pozostawione w worktree do integracji.

Ocena przed korektą: spójność `0.95`, prostota `0.94`, ryzyko `0.93`, utrzymywalność `0.95`; minimum `0.93`.

## Fakty i decyzje

Baseline review potwierdził dwie awarie stale względem aktualnego kontraktu:

1. Orkiestracja egzaminu została przeniesiona do `examReadOwner`. `ExamScreen` przekazuje ownerowi `resumeExpected` i `start`, a owner rozdziela expected resume od start-on-miss. Test nie powinien szukać obu ścieżek w kodzie ekranu.
2. Bootstrap RC Algorithms ma obsługę gościa, oczekiwanie na shell, guard braku wybranego tracku i zagnieżdżony guarded `runFlow` dla zmiany tracku. Stary test wymagał płaskiej kolejności i licznika odpowiadającego wcześniejszemu YAML.

Korekta utrzymuje wymagania bezpieczeństwa: expected resume jest sprawdzany w ownerze, jego błąd nie uruchamia `start`, a start pozostaje wyłącznie w ścieżce nowego egzaminu po nieudanym initial read. Test YAML sprawdza kolejność readiness/guest/guard/selection/final card oraz wymusza retryTapIfNoChange i brak koordynatów.

## Zmienione pliki i referencje

- `scripts/mutationArchitecture.test.ts` — asercje wiring `ExamScreen` → `createExamReadOwner`, expected branch `resumeExpected` bez `start`, oraz start tylko w new-exam branch.
- `src/features/exam/examReadOwner.test.ts` — test zachowania: odrzucony expected resume zwraca jawny `unavailable` i nie wywołuje `start`.
- `src/tracks/coding-interview/rcAlgorithmsBootstrap.test.ts` — asercje faktycznej semantyki guarded/nested Maestro flow, guest handling i final readiness.
- `docs/workstreams/screen-refactor-2026-09-05/P5-baseline-repair.md` — ten raport.

Nie zmieniono `src/features/exam/examReadOwner.ts`, `src/features/exam/ExamScreen.tsx`, `.maestro/rc-algorithms-bootstrap.yaml`, runnera ani żadnego kodu P2. Zastane zmiany P2 w tym worktree pozostają bez modyfikacji.

## Weryfikacja

Wszystkie komendy uruchomiono z `/private/tmp/patternly-activity-refactor`.

Przed korektą odtworzenie baseline zakończyło się dwoma potwierdzonymi failures (`2/2`):

```text
node --import tsx --test --test-name-pattern 'Certification route handoffs|RC Algorithms bootstrap resets' scripts/mutationArchitecture.test.ts src/tracks/coding-interview/rcAlgorithmsBootstrap.test.ts
FAIL — 2/2; stale ExamScreen inline-resume regex i stale RC flow ordering/count assertions
```

Po korekcie:

```text
node --import tsx --test scripts/mutationArchitecture.test.ts src/tracks/coding-interview/rcAlgorithmsBootstrap.test.ts src/features/exam/examReadOwner.test.ts
PASS — 30/30

npm run typecheck
PASS — tsc --noEmit

git diff --check
PASS
```

Nie uruchamiano native, Metro ani pełnego `qa:static`; nie zmieniano produkcji. Test runnera Maestro nie był potrzebny do tej korekty structural/behavioral assertions.

## Ograniczenia

Test bootstrapu pozostaje kontraktem źródłowego YAML i nie zastępuje wykonania na urządzeniu. Native evidence i ewentualne failures runtime pozostają do końcowej integracji oraz P5 visual/flow QA kontrolera.

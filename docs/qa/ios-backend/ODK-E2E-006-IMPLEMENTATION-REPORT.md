# ODK-E2E-006 — eksploracja pozostałych loading state’ów

Data raportu: 2026-09-07
Status: `VERIFIED_CLOSED`.

## Ocena i metoda

- Wspólna walidacja briefu: `gpt-5.6-luna`, effort `max`; minimum **0,81 — APPROVE**.
- Źródłową inwentaryzację zamknięto testem porównującym wszystkie eksporty `*LoadingSkeleton` z jawną listą. Test wykrywa nowy lub usunięty loading owner zamiast ukrywać go filtrem/metadanymi.
- Przejrzano pending/ready/unavailable ownership, route-keyed reads, wspólny `SkeletonShape`, 20 eksportowanych skeleton owners oraz generyczne wejścia `LoadingState`.

## Macierz

Aktualny harness produkcyjnych eksportów przeszedł **22 prezentacje × 2 motywy = 44 screenshoty**: Home, Progress, Settings, Practice Hub, Practice Session, completing, auth status, simulation session/result, bootstrap, roadmap i narrow roadmap, goal, exam, practice/answer review oraz sześć wariantów setup. Dodatkowo Settings przeszedł AXXXL top/bottom. Dla pozostałych lokalnych owners (Activity, Algorithms scope, exam review/result, practice result, mistakes review) zweryfikowano ich jawne geometrie, pending branches i loaded ownership w bieżącym kodzie/testach oraz zestawiono z istniejącymi referencjami ekranów gotowych.

| Obszar | Zinwentaryzowane loading owners | Wynik |
|---|---|---|
| Bootstrap/session | Content bootstrap, Root session restore, Practice completing | Bez nowej rozbieżności |
| Home shell | Home, Progress, Settings | Settings naprawiony; Home/Progress bez nowej rozbieżności |
| Home routes | Activity, Goal cadence | Bez nowej rozbieżności |
| Practice | Practice Hub, Practice Session, Topic Roadmap, Practice Setup, Algorithms Scope, Algorithms Practice Review, Algorithms Practice Summary | Bez nowej rozbieżności |
| Exam/review | Exam, Exam Review, Exam Result, shared Answer Review, Mistakes Review | Bez nowej rozbieżności |
| Simulation | Simulation Session, Simulation Result | Bez nowej rozbieżności |

## Wynik

Potwierdzoną rozbieżnością był Settings: brak identity/action i niewłaściwe grupy/wymiary; została naprawiona w `ODK-E2E-005`. W pozostałych przeglądanych loading owners nie potwierdzono nowej konkretnej rozbieżności geometrii, więc nie utworzono sztucznego zadania następczego. Aktualny test inventory zabezpiecza kompletność listy przy dalszych zmianach.

- Testy celowane: **46/46**.
- `npm run qa:static`: recovery **352/159/845**, typecheck **pass**, testy **850/850**, content/runtime privacy boundaries **pass**.
- Retest Maestro: macierz **44/44 screenshot commands**, Settings AXXXL **2/2**, językowa macierz i restarty **pass**.
- Regresje, ryzyka i blokery: brak potwierdzonych regresji; izolowany harness dowodzi renderowania produkcyjnych komponentów, natomiast nie udaje deterministycznego przejścia każdego krótkiego pending branch w nawigacji produkcyjnej.

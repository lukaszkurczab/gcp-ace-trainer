# PROFILE-06/E — Home po nieodzyskanym planie

**Wynik:** DONE / lokalny runtime PASS; końcowe niezależne QA: **PASS**.

## Zmiana i przyczyna

Wybrana przez PO opcja 1 jest jedyną ścieżką produktu dla jednego separowalnego, niepoprawnego zdalnego `learning_plan`: aplikacja zachowuje poprawny track, cel i postęp, otwiera Home i pokazuje nieblokujący komunikat o konieczności utworzenia nowego planu. Incydent ma trwałą tożsamość, wersję zdalną i stan zamknięcia. Zwykły brak planu nie tworzy incydentu, a niepewna własność, fingerprint, wersja, duplikat albo niespójny goal nadal kończą się fail-closed.

Komunikat udostępnia `Create plan`, który otwiera kanoniczną propozycję planu, oraz `Dismiss`, którego stan przeżywa natywny restart. Nie powstaje pusty plan, tombstone ani ukryty fallback.

## Dowód urządzeniowy i zdalny

- Preflight: lokalne Auth `127.0.0.1:19099`, Firestore `127.0.0.1:18081`, API `127.0.0.1:8080` i Metro `[::1]:8081`; wyłącznie istniejący iPhone 17 `7F315654-3175-4F3C-BB24-B0263F59360C`.
- Izolowany fixture konta zawierał kanoniczny `active_track` v2, goal v3, ukończoną sesję i wynik v2, próbę v4 oraz celowo niepoprawny plan v9 (`schemaVersion: 99`).
- Home pokazał Coding Interview, `1 answered`, ostatnią sesję Practice oraz komunikat `Learning plan wasn’t recovered` z akcjami `Create plan` i `Dismiss`.
- Progress pokazał aktywny cel, `arrays_and_strings · Building evidence · 1 responses` i ukończoną aktywność Practice.
- `Create plan` otworzył `Your proposed rhythm` w stanie `ready`, z aktualnym celem i przyciskiem `Accept plan`; plan nie został zaakceptowany w tym dowodzie.
- Exact-account assert przed i po runtime zachował `accountRevision: 1`, wszystkie wersje, fingerprinty i `lastMutationId`; plan pozostał v9/schema 99 i `deleted !== true`.
- `Dismiss` usunął komunikat, a natywny restart zachował Home i stan zamknięcia.
- Backendowy fixture został wypchnięty na `main` jako `02686c5`, a twarda asercja oczekiwanej `accountRevision` jako `42b66c5`; po zebraniu dowodu exact cleanup usunął sześć rekordów fixture z aktywnej generacji.

Kadry: [Home z komunikatem i postępem](evidence/profile06-e-recovery-visible.png), [zachowany Progress](evidence/profile06-e-preserved-progress.png), [przejście do propozycji](evidence/profile06-e-create-plan-proposal.png), [Home po zamknięciu i restarcie](evidence/profile06-e-dismissed-after-restart.png). Hashe, flow i runtime opisuje [manifest](evidence/profile06-e.manifest.json). Surowe logi i dane logowania nie są artefaktem repo.

## Weryfikacja

- App targeted: **70/70 PASS** (`accountLifecycle`, `accountDataSync`, prezentacja recovery, selektory i parytet locale).
- Backend fixture: typecheck, lint i exact remote assert z wymuszoną `PROFILE06_E_EXPECTED_ACCOUNT_REVISION=1` — **PASS**.
- Maestro: Home recovery, Progress/goal/activity, CTA→proposal oraz dismissal/restart — **PASS**.
- Pierwsze QA wykryło brak pełnego dowodu postępu, CTA i exact before/after; po uzupełnieniu dało PASS WITH ISSUES dla niewymuszonej rewizji. Twarda asercja `accountRevision` i jawna para before/after zamknęły ostatnią lukę; końcowe re-QA: **PASS**.
- `git diff --check`: wykonywane przed commitem.
- Pełny app typecheck pozostaje niezależnie niezielony na równoległym, nieukończonym rozszerzeniu typów locale; pliki PROFILE-06/E nie wprowadzają nowej diagnostyki tego zakresu.
- Ocena przed zmianą: zgodność 0,84; prostota 0,82; kontrola ryzyka 0,81; utrzymywalność 0,84; minimum 0,81 — APPROVE. Ocena po wzmocnieniu dowodu: architektura 0,88; prostota 0,82; ryzyko 0,84; utrzymywalność 0,85.

## Ograniczenia

Dowód używa lokalnych emulatorów i development builda, nie produkcyjnych providerów. Toast Expo `Open debugger to view warnings` jest widoczny na kadrze Home jako jawny szum środowiska developerskiego, nie diagnostyka produktu. Fixture i jego cleanup są ograniczone do zanonimizowanego konta lokalnego.

# GATE-04 — pełne CI czterech repozytoriów

## Cel

Zamknąć EPIC-01 jednym powtarzalnym workflow CI, który dla jawnie podanych, dokładnych commitów `patternly`, `patternly-backend`, `patternly-content` i `patternly-web` odtwarza cztery checkouty, uruchamia ich kanoniczne bramki, tworzy i weryfikuje GATE-03 Candidate Release Manifest oraz przekazuje ten sam manifest do egzekwowanego launch gate. Wynik ma dowodzić dokładnego kandydata czterech SHA, a nie bieżących gałęzi.

## Ustalenia

- Aktywny `.github/workflows/launch-readiness.yml` przyjmuje tylko `application_commit` i `content_commit`, checkoutuje tylko te dwa repozytoria i uruchamia `releaseGate.mjs --enforce` bez wymaganego od GATE-03 manifestu; obecny workflow jest więc zawsze niekompletny wobec kontraktu czterech SHA.
- GATE-03 w `patternly` dostarcza kanoniczne `releaseManifest.mjs create|verify` i fail-closed `releaseGate.mjs --enforce --manifest ...` z czterema rootami. Manifest musi powstać poza worktrees po checkoutach i po operacjach, które mogłyby je zabrudzić.
- Kanoniczne lokalne bramki to: `patternly` — `npm run qa:static`; backend — `npm run ci` (wymaga Java 21 i Firebase CLI, a jego consumer check ma dostać dokładnie checkoutowane app/web); content — `npm test`, `npm run authoring:validate`, `npm run audit:aws-workbook-source`; web — `npm run verify:local`, `npm run test:admin-behavior`, `npm run test:admin-config`.
- Wszystkie cztery inputy muszą być wymagane, pełne, lowercase 40-znakowe SHA; każdy checkout musi wskazywać właściwy stały slug, `fetch-depth: 0`, osobny path oraz zostać porównany z inputem. Żaden aktywny `ref: main|master`, `github.sha` ani domyślny ruchomy ref nie może wyznaczać badanego kandydata.
- Workflow ma instalować zależności przez `npm ci`, zachować read-only permissions, nie używać sekretów ani produkcyjnych providerów, nie tworzyć fałszywego release evidence i nie zmieniać pytań/SIMP. Brak external/provider/PO evidence pozostaje prawidłowym blockerem launch gate, ale nie może uniemożliwić uploadu raportu i manifestu po niezerowym wyniku gate.
- Test kontraktu workflow musi odrzucać brak/zmianę któregoś inputu, repo/sluga/ref/path, brak exact-HEAD check, pominięty owning gate, manifest poza `runner.temp`, brak verify/przekazania do release gate, nieprzenośne ścieżki, ruchome refy i upload zależny od sukcesu.
- Repozytoria są czyste na początku. Nie znaleziono Graphify; bezpośredni workflow, testy, package scripts i raporty GATE-01–03 są właściwym evidence. Założenie: centralnym właścicielem orkiestracji pozostaje `patternly`; pozostałe repozytoria nie wymagają zmian, chyba że aktualny kod wykaże brak możliwości uruchomienia ich owning gate z czterech sibling checkoutów.

## Podejście

1. Zastąpić dwurepozytoryjny kontrakt w `launch-readiness.yml` jednym cztero-SHA workflow: najpierw walidacja inputów i dokładne checkouty, następnie toolchain/dependencies oraz kanoniczne owning gates aplikacji, backendu, contentu i webu.
2. Po wszystkich owning gates potwierdzić czystość i HEAD czterech checkoutów, utworzyć manifest w `${{ runner.temp }}`, zweryfikować go i uruchomić `releaseGate.mjs --enforce` z tym samym manifestem i czterema rootami. Zachować kod wyjścia gate po sprawdzeniu, że oba JSON-y istnieją i są poprawne.
3. Uploadować manifest i raport przez `if: always()` pod nazwami związanymi z czterema input SHA; nie commitować wygenerowanego manifestu ani raportu. Zastąpić stare asercje workflow silnym kontraktem czterech repozytoriów i dodać negatywne testy mutacyjne dowodzące fail-closed dla każdego elementu tożsamości i orkiestracji.
4. Uruchomić test workflow/GATE-03, pełny `qa:static`, walidację YAML lub równoważny parser, niezależne QA, minimalny `docs/qa/GATE-04-REPORT.md`, aktualizację głównego planu oraz commit/push. Nie deklarować pełnego zielonego launch readiness, jeśli jedynymi pozostałymi blockerami są celowo niezgromadzone external evidence.

Ocena: zgodność/architektura `0,94`; prostota `0,86`; ryzyko `0,88`; utrzymywalność `0,91`; minimum `0,86`. Największe ryzyka to koszt pełnego backendowego emulator gate, przypadkowe użycie ruchomego refa i artefakt niewiążący wszystkich czterech SHA; redukują je jeden centralny workflow, owning scripts, mutacyjne testy kontraktu oraz manifest GATE-03.

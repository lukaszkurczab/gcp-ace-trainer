# RELEASE-CONTRACT/A — kontrakt etapów

**Status:** `done`  
**QA:** `PASS` po domknięciu dokumentacji  
**Zakres:** lokalny kontrakt bramek; bez FREEZE, GO, publikacji i wdrożenia

## Wynik

Istniejący `scripts/releaseGate.mjs` pozostaje jedynym właścicielem raportu
readiness. Raport `patternly-launch-readiness-v2` zawiera aktywny etap i
skumulowane wyniki `local`, `freeze`, `go`. Zamknięty argument
`--stage local|freeze|go` wybiera etap, a `--enforce` zwraca błąd dokładnie
według jego blockerów. Istniejący hosted workflow wybiera jawnie `--stage go`.

| Etap | Wymagane | Celowo niewymagane |
| --- | --- | --- |
| `local` | czyste/odczytywalne źródła aplikacji i contentu, poprawny app lock, dziewięć tracków, aktualny candidate/readiness, techniczne i redakcyjne admission | prawdziwe dane prawne PO, release manifest, zewnętrzne evidence |
| `freeze` | wszystko z local oraz kompletne dane wydania, zweryfikowany manifest i `signing-and-builds` | provider/operations, store readiness, PO-GO, physical-device i Android manual |
| `go` | wszystko z freeze oraz security/privacy, provider/operations, store readiness, PO-GO i physical-device | Android manual nie jest wspólnym automatycznym blockerem |

Brak lub niepoprawna koperta evidence nadal failuje przez jeden istniejący
walidator. Etap jedynie ustala, od kiedy dany prawidłowo zweryfikowany rodzaj
dowodu jest wymagany; nie osłabia jego integralności ani powiązania z app SHA.

## Weryfikacja

- Briefing: zgodność 0,96; prostota 0,88; ryzyko 0,84;
  utrzymywalność 0,91; minimum 0,84 — APPROVE.
- Niezależny QA: początkowo `PASS WITH ISSUES` wyłącznie z powodu brakującego
  raportu/planu; po aktualizacji dokumentacji — `PASS`.
- QA: release gate, workflow contract i release manifest — 36/36 PASS.
- Kontrolowane przypadki: niepoprawny stage exit 1; enforced freeze na
  niegotowym stanie exit 1 i `not_ready`; mutacja workflow `go → freeze` FAIL.
- Recovery inventory, typecheck i `git diff --check` — PASS.

## Granice

A nie tworzy build identity ani nie rozszerza release manifestu — to zakres B.
Nie ustala polityki OTA — to zakres C. Nie zmienia też aktualnego stanu
readiness/admission i nie ogłasza SIM-READY, FREEZE ani GO.

# GATE-03 — acceptance packet

## Cel

Utworzyć jeden przenośny manifest kandydata release, który wiąże dokładne commity czterech repozytoriów (`patternly`, `patternly-backend`, `patternly-content`, `patternly-web`) z zaakceptowanym `candidateId`, dziewięcioma trackami oraz hashami kanonicznych kontraktów/evidence. Manifest ma być możliwy do skopiowania i zweryfikowania na czterech czystych checkoutach bez zależności od ścieżek maszyny autora. Nie zastępuje GATE-04 i nie twierdzi, że pełne CI czterech repozytoriów zostało wykonane.

## Ustalenia

- Bieżący release gate zna tylko application/content HEAD; workflow przyjmuje tylko dwa SHA. Backend i web nie są częścią tożsamości raportu, mimo że API i hosted-web boundary wpływają na kandydata.
- ACC-02 zapewnia jeden zweryfikowany Candidate Manifest v1, `candidateId`, dziewięć tracków oraz approval/readiness/admission. GATE-01 konsumuje owning validators, lecz raport zawiera lokalne bezwzględne ścieżki i nie stanowi samodzielnej tożsamości czterech repozytoriów.
- Manifest zawierający SHA repozytorium nie może być commitowany do tego samego repozytorium bez samoodwołania. Generator i walidator należą do `patternly`, ale wynik musi być zapisany w jawnej lokalizacji poza wszystkimi czterema worktrees; nie jest piątym źródłem prawdy ani aktywnym formatem w repo.
- Kanoniczna identity manifestu musi zawierać dokładnie cztery wpisy repozytoriów o stałych rolach i slugach, pełne lowercase commit SHA, content `candidateId` i posortowane dziewięć track IDs oraz przenośne referencje `{repositoryRole,path,sha256}` do Candidate Manifest, Candidate Readiness, application release lock i backend OpenAPI. `manifestId` jest SHA-256 kanonicznej identity bez `manifestId`.
- Walidacja ma sprawdzać czyste checkouty, zgodność HEAD z manifestem, dokładny zbiór czterech ról bez missing/extra/duplicate, brak absolute/path traversal/symlink escape, hash każdej referencji, owning ACC-02 validators, zgodność release lock/readiness/candidate oraz backend OpenAPI gate. Nie może akceptować legacy dwóch SHA, bieżącego HEAD zamiast zadeklarowanego SHA ani opcjonalnego braku backend/web.
- Negatywne testy obejmują missing/extra repository, stale/wrong SHA, dirty worktree, zły `manifestId`, absolute/traversal/symlink reference, zmieniony hash evidence, stale candidate/track scope, legacy two-SHA format i wynik zapisany wewnątrz worktree. Manifest i raport nie mogą zawierać lokalnych ścieżek absolutnych, sekretów ani fałszywego external/provider evidence.
- Zakres nie uruchamia ani nie przebudowuje CI repozytoriów, nie modyfikuje contentu/API/web produktu, nie tworzy provider/build/store/PO evidence i nie zmienia zakresu SIMP.

## Podejście

1. W `patternly` dodać jeden moduł kontraktu manifestu oraz CLI z rozdzielonymi trybami `create` i `verify`. CLI przyjmuje jawne cztery rooty oraz output poza worktrees; wynik używa wyłącznie stałych ról, slugów, relatywnych ścieżek, SHA-256 i kanonicznego JSON.
2. Podczas tworzenia i weryfikacji korzystać z istniejącego release gate/ACC-02 ownership zamiast kopiować walidatory. Zweryfikować dokładne cztery HEAD i czystość, Candidate Manifest/Readiness/release lock, hash backendowego OpenAPI oraz dziewięciotrackową tożsamość. Dodać manifest do raportu launch-readiness jako zweryfikowaną identity, bez uznawania brakujących providerów za sukces.
3. Dodać testy kontraktu i workflow-safe output dla wszystkich pozytywnych i negatywnych przypadków. Wygenerować realny manifest poza worktrees dla aktualnych czterech czystych checkoutów, zweryfikować go po przeniesieniu do innego katalogu i zachować jako niecommitowany artefakt workspace/evidence.
4. Uruchomić wąskie testy, pełny wymagany gate `patternly`, niezależne QA, zapisać raport, zaktualizować plan, commit/push. Ocena: zgodność/architektura `0,94`; prostota `0,86`; ryzyko `0,88`; utrzymywalność `0,91`; minimum `0,86`.

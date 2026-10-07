# FCA-AUDIT-COMPLETE — dokończenie oceny każdego pytania

Status i kolejność wyłącznie w [planie głównym](../../PATTERNLY-WORKING-PLAN.md). To zachowane niewykonane zadanie AUDIT3, odrębne od napraw już wykrytych problemów i od przyszłego narzędzia EPIC-09. Cleanup nie wykonuje audytu.

## Utrwalony stan i punkt rozpoczęcia

Odzyskano trwałe wejścia `patternly-content/evidence/business-quality/full-content-audit-2026-10-02/`: immutable inventory/manifest/rubric, komplet individual reviews, invalidation i verification/aggregation tooling. Baseline16077pytań pochodzi z przypiętego source02.10. Odczyt całych rekordów dał4236 ocen i11841PENDING, zero błędów strukturalnych; stare generated summary3703 było nieaktualne. Weryfikacja rekordów nie jest ponownym przeglądem semantyki.

Bieżący canonical source07.10 ma16622 pytań. `scripts/content-audit/reconcile.mjs` używa istniejącego inventory oraz zweryfikowanego ledgeru:2752 bieżące obiekty mają exact prior source review;13870 wymagają current reconciliation. Pełna lista wszystkich itemów/hashów/path/taxonomy i odniesień do starego wyniku jest w `current-source-binding.json`. Exact source match nie dowodzi aktualnych vendor facts ani niezmienionego runtime scoring.

**Pierwsza praca:** potwierdzić brak nowej delty źródła; użyć obecnego source binding; uzgodnić indywidualne current records z istniejących późniejszych odbiorów OOD24, Claude845 i BESD replacements, zanim rozpocznie się nowy review. Claude source-first ledger jest w content Git `4b0f1ff:docs/evidence/content-audits/2026-10-07-claude-current-review.jsonl`;943wiersze nie oznaczają943 lub845 automatycznie zaliczonych aktualnych pytań. Przyjąć tylko właściwy exact hash/subset z pełną rubryką. Nie wznawiać zamkniętych OOD remediation ani osobnego oglądania1413pytań bez wykazanego brakującego kryterium; istniejący odbiór ma zostać uzgodniony z wymaganiem audytu, nie mechanicznie zastąpiony PASS. BESD34 starych ID nie przenosi werdyktu na replacement ID.

## Wymagana indywidualna ocena

Każdy item osobno: learning objective; prompt/constraints/ambiguity; technical/factual correctness; answer/partial/zero/order/complexity/alias contract; każdy distractor; Reason; Details/mechanism; explanation każdego błędnego option ID; transfer; difficulty/cognitive load; semantic duplicate peers; originality/legal provenance; family-specific quality. Schemat i pola nie są PASS.

Certification/vendor facts wymagają aktualnych oficjalnych source URL, daty, konkretnego claim/result. Coding wymaga poprawnych invariants, applicability, granic, complexity i transfer. Nieczytane pytanie pozostaje PENDING; nie staje się BLOCKED_FACT_CHECK. Werdykty: PASS/FIX_MINOR/FIX_MAJOR/REMOVE/BLOCKED_FACT_CHECK, dokładnie jeden po pełnej ocenie.

## Ledger i zadania naprawcze

Current record wiąże track/family/contentVersion/node/unit/itemId/file/question hash, wszystkie13 wymiarów z konkretnym evidence, każdy distractor, scoring/interaction review, fact checks, duplicate peers, reviewer/date. Stare review pozostaje przy starej wersji; nowe binding przechowuje jego tożsamość i exact-hash match. Changed/missing/mismatched rekordy nie odzyskują coverage przez label lub batch.

Kontynuować deterministycznie pozostałe itemy i odświeżać machine-readable liczniki per track/verdict/defect. Brak samplingu, batch PASS, dziedziczenia werdyktu, regex-only oceny i mechanicznej akceptacji z validatora. Nowe findingi grupować według track/node/unit/defect ze wszystkimi exact ID; rozszerzać istniejący task zamiast tworzyć drugą kolejkę. Obecne [FCA zakresy](content-maintenance.md) zawierają158grup/2129 niezmienionych itemów z authored findingami.

Każda naprawa ma exact IDs/categories/problem/evidence/correction, official fact-check wymagania, forbidden changes, validation, ponowny item-level review, human-review handoff i version/manifest/admission/app-lock zależności. Nie naprawiać contentu podczas samego audytu; nie mass-rewrite, nie ukrywać słabych pytań i nie zmieniać runtime schema. Model verdict nie jest human editorial sign-off.

## Weryfikacja i AC

W content repo: `node evidence/business-quality/full-content-audit-2026-10-02/verify.mjs` odtwarza ignored baseline ledger/summary; `--require-complete` musi zwrócić2 dopóki baseline coverage jest nierówne. `aggregate.mjs` uruchamiać wyłącznie na tymczasowej kopii starego planu, bo jego baseline zawiera już rozwiązane findingi. Nigdy nie nadpisywać nim aktualnego planu.

`node scripts/content-audit/reconcile.mjs <output.json>` odtwarza source match/pending każdego bieżącego itemu. Po aktualizacji source/rubric/runtime/facts nowe potrzebne review nie może korzystać z niepasującego dowodu. Current coverage validator ma odrzucać duplicate/foreign/stale/partial-rubric records i błędne source identity oraz jawnie failować przy niepełnej coverage; istniejący baseline verifier jest wzorcem, nie dowodem aktualnej kompletności.

Końcowy odbiór: inventory i auditedCount dla uzgodnionego bieżącego zakresu są równe; zero PENDING/identity/validation errors; każdy item ma pełny wynik, per-track/per-verdict agregację i aktualne fact checks, wszystkie non-PASS przypisane do konkretnych remediation tasks. Wynik podaje source SHA/version, zakres, rzeczywiste liczniki i ograniczenie human sign-off. Brak aktualnego pełnego ledgeru nie może być zamknięty starym summary, zatwierdzeniem batcha, schema PASS ani usunięciem evidence.

# BIZQ-01 — Q14: Cel / Ustalenia / Podejście

## Cel

Zamknąć istniejącą lukę Q14: jedna syntetyczna, schema-valid single-choice z wyraźnie dłuższą poprawną opcją otrzymuje jakościowe ostrzeżenie w istniejącym reviewer workflow, pozostając poprawnym pytaniem ze scoringiem po option ID. To odbiór jednej ścieżki ostrzeżeń, nie pełny BIZQ-01. Główny obszar pozostaje01; source preflight N05 trwa read-only i nie jest porzucany. Zamknięcie wymaganego niezależnego kryterium nie czeka na pełny odczyt801 pytań.

## Ustalenia

[Spec01§5B i Q14](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md) już wymaga warning-only length heuristics. Nie dodajemy wymagań produktu. [Actual Q14 preflight](Q14-PREFLIGHT.md): console riskFlags nie ma length signal; OOD17 checker ma scoped comparative word-count predicate. Właściwy canonical source-review console i jego obecne testy to jedyne implementation files. Existing schema/scorer/admission/source proofs nie korzystają z tych riskFlags; outcome recording jest odrębną explicit operacją. Zmiana narzędzia nie zmienia pytań lub artefaktów, więc nie wymaga nowego contentVersion, candidate/admission ani consumer sync. Test console znajduje się w obowiązującym test:canonical.

## Podejście

Do riskFlags w `patternly-content/scripts/review/content-review-console.mjs` dodać bounded single-choice advisory `correct_option_sole_longest`: poprawna authored option ma więcej słów niż każda inna authored option. To istniejący porównawczy predicate OOD17, bez numeric cutoff, automatycznego defect/reject/approval, wpływu na scoring czy outcome. Obsłużyć tylko prawdziwy choice_single z istniejącym answer optionId i poprawnymi tekstami co najmniej dwóch opcji; malformed inputs nie mogą rzucać błędu przy risk scan ani zastępować schema validation. Tied longest nie otrzymuje tego konkretnego sygnału. Brak rozszerzenia na niejednoznaczny multi-choice lub ordering.

`patternly-content/tests/contentReviewConsole.test.mjs`: tiny temporary source tree zawierający wymagane9track roots przez real-shape istniejący fixture pattern. Jedna syntetyczna valid choice_single z długim keyed variant, zwykłymi krótkimi plausible distractors i zgodnymi feedback option IDs. Actual createContentReviewConsole/getItem/riskOnly potwierdzają warning i unreviewed, brak zapisu outcomes. Actual validateQuestion i scoreQuestion potwierdzają klucz oraz każdą błędną opcję w kolejności original/reversed. Negative kontrola tied-longest/long-wrong i non-single interaction nie otrzymuje tego flagu. Obecny test constraint-only list nie może utożsamiać wszystkich risks z author_instruction: zawęzić jego count do badanego sygnału, zachować wszystkie wcześniejsze assertion semantics.

Własność worker Luna High: wyłącznie riskFlags oraz wymieniony test. Inne prace/źródła/CH persistence fixes pozostają nietknięte; nie refaktorować recordOutcome/writeReviewStore. Root prowadzi briefing, actual verification, evidence i selective staging; niezależny reviewer Luna High ocenia design oraz acceptance. Nie tworzyć nowej kolejki. Working-docs preparation Q14 zakończone; po independent design PASS przejść do execution-loop implementacji w tym samym celu.

## Weryfikacja i ograniczenia

Najpierw meaningful focused RED dla synthetic warning, potem GREEN console + bizq01-source-slice. Obowiązujący full content test:canonical, bo console jest jego częścią i zmienia riskOnly discovery. Root sprawdza actual diff i source/proof/artifact preservation; independent QA actual workflow i negative controls. Bez nowych custom tools, mobile/runtime/browser/service changes. Powtarzanie appstatic/build9/admission dla identycznych pytań nie wnosi dowodu tego tooling zachowania; matching20 evidence reuse. Zwykły push zaakceptowanego spójnego pakietu, nie full01 lub release closure.

## Oceny podejścia 0–1

Fit0.92: istniejące Q14, jeden canonical reviewer path. Simplicity0.94: jeden guarded predicate i existing test entry point, bez new abstraction. Risk0.90: advisory-only, isolated fixtures i exact source preservation; UI risk filtering objęte regresją. Maintainability0.91: jasny warning label/guard, schema/scorer odrębne; scoped OOD17 history nie refaktorujemy. Minimum0.90≥0.8. Hipoteza podejścia do independent review, nie zatwierdzona semantyka pytań.

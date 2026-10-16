# Prompt 30 / M05 — historyczne stałe Claude, jedna partia

16.10.2026 — **PASS: kod i lokalny odbiór tej partii.** Pełne M05 pozostaje otwarte.

## Cel, zakres i podejście

Wykonano wyłącznie następną partię Claude z istniejącego zadania SOLO-CONTENT-01 w [kanonicznym planie workspace](../../../docs/PATTERNLY-WORKING-PLAN.md). Przeczytano obowiązujące AGENTS, bieżący stan, wskazane źródła i raport SIMP03, aktualny consumer, fixture, testy, package/config workflow oraz Git diff. Zależność29, BIZQ-05 i SIMP03 pozostają odebrane; nie ponawiano ich odbioru ani implementacji. Historyczny audyt13.10 pozostaje niedostępny zgodnie z planem; nie odtwarzano historii ani kopii planu w APP.

Ocena przed edycją: dopasowanie1,00 / prostota0,98 / kontrola ryzyka0,96 / utrzymywalność0,98; minimum0,96. Jeden statyczny moduł kontynuuje istniejący wzorzec evidence, bez loadera i nowej abstrakcji. Jedynym writerem był główny agent. Niezależny review podejścia **Luna High PASS**, przed zmianą produkcyjną; ocenił propozycję i kontrakt byte-first CC02/CC03, nie gotową implementację. Niezależne QA implementacji: **Luna High PASS (AC1–5)**; osobny świeży reviewer, read-only, bez delegowania dalej. Samodzielny test13/13 PASS, porównanie dokładnego bloku i publicznego API; końcowy readback planu/stanu/linków i zachowanego residualu AC5 PASS.

Zmiany względem zastanego WIP:

- CONTENT `evidence/migration-verifier/claude-historical.mjs`: jedyna produkcyjna definicja `CLAUDE_HISTORICAL_BASELINE`, `CLAUDE_CURRENT_BANK`, `CLAUDE_SUCCESSOR_BANK`, `CLAUDE_CC02_SUCCESSOR_EVIDENCE`. Initializery, wartości, hashe, kolejność kluczy i `Object.freeze` zachowane dokładnie.
- CONTENT `scripts/content/verify-migration.mjs`: import czterech bindingów oraz usunięcie zastąpionego bloku. Funkcje, reguły, schema-key arrays, API, AWS i `EXPECTED_CURRENT_PRODUCER_BANKS` bez zmian. Powiązanie tej ostatniej mapy z `CLAUDE_SUCCESSOR_BANK` zachowane. Consumer niezmieniony.
- CONTENT `tests/migration-evidence-claude.test.mjs`: utrwalony baseline accepted obu rzeczywistych wejść i mutacje właściwe dla kontraktu Claude. Test powstał i przeszedł przed edycją produkcyjną.
- CONTENT `package.json`: dopisanie wyłącznie nowego testu do `test:canonical`, z zachowaniem wcześniejszych wpisów/WIP.
- APP niniejszy raport; zaktualizowany istniejący wiersz M05 w kanonicznym planie i jeden bieżący stan.

Verifier16039→16004 linii (−35 netto); moduł evidence41 linii. Cztery stare deklaracje usunięte z verifiera; nie usuwano plików/historycznych proofów. Nie przeniesiono żadnej kolejnej partii.

## Faktyczne sprawdzenia

Komendy testowe wykonane z `patternly-content`, Node `v24.21.0`:

| Sprawdzenie | Wynik |
| --- | --- |
| `node --test tests/migration-evidence-claude.test.mjs` przed zmianą produkcji |13/13 PASS |
| Ta sama komenda po ekstrakcji |13/13 PASS; identyczne pełne fingerprinty i odmowy |
| `node --test --test-name-pattern='current -bizq02\|package policy\|current prompt\|Claude' tests/simp03-verifier.test.mjs` |4/4 PASS; istniejące testy accepted banków, polityki wersji, mutacji bieżących pytań i historycznego proofu Claude |
| `node --check` dla verifiera, nowego modułu i nowego testu |3/3 PASS |
| `git diff --check` w CONTENT |PASS |
| Exact-text/refcheck |4/4 identyczne initializery/freeze; po usunięciu wyłącznie nowego importu i przeniesionego bloku reszta verifiera byte-identical z wejściem; consumer byte-identical; jedna produkcyjna definicja każdej stałej |
| Runtime probe |4/4 eksporty modułu zamrożone i nadal prywatne w API verifiera; `verifyCanonicalContent === verifyMigration` |
| Ochrona zastanego WIP |188 ścieżek plikowych CONTENT10/APP178;186 identycznych bajtowo; verifier i package mają tylko zweryfikowany przyrost tej partii, zachowujący wcześniejsze zmiany |

Pełny accepted fingerprint przed/po (wyłączony tylko losowy `contentRoot`):

`396b2ef6f9dcc50222afeccf48d73b8a85082101a4b14c043298fd9ad828304f`

Pełny wynik rzeczywistego `verifyCandidateCurrentSource` przed/po:

`d368bc9b6f0993223b9109a7805597533f8cdffda0b8480e25aa9c31b71c43d1`

| Mutacja Claude | Identyczny kontrakt przed/po przez verifier i consumer |
| --- | --- |
| Zmieniony prompt historycznej baseline300 / bieżącego dla fixture banku918 |`HASH_MISMATCH` (2 przypadki) |
| Zmieniona historyczna / successor contentVersion |`EVIDENCE_VALUE` (2 przypadki) |
| Corrupt JSON historycznej baseline / successor canonical source |`INVALID_JSON` (2 przypadki) |
| Reverse canonical successor question array |`CANONICAL_ORDER` |
| Corrupt pinned CC02 coverage JSON |`HASH_MISMATCH`; hash bajtów sprawdzany przed parserem |
| Dopisana nowa linia w CC02 coverage / CC02 historical-before / CC03 question-baseline |`HASH_MISMATCH` (3 przypadki; JSON nadal poprawny) |
| Reverse historycznych baseline questions |Accepted, identyczne pełne wyniki obu wejść; porównanie zbiorów |

Łącznie11 mutacji odmowy i jedna mutacja accepted. Nie wymuszano innego kodu błędu niż rzeczywisty kontrakt. Po przywróceniu wejść test ponownie porównuje pełne wyniki obu wejść.

Hash odebranych plików CONTENT:

| Plik |SHA-256 |
| --- | --- |
| `scripts/content/verify-migration.mjs` |`74e19ca4b44d495b75aca19c784d8f7bf0d39fd0646e9653a9f62f211c12a474` |
| `evidence/migration-verifier/claude-historical.mjs` |`285a3b740b97c10e8b743991d4008a6baf6fef9ade0639d35bf123f7d1e64995` |
| `tests/migration-evidence-claude.test.mjs` |`9e06559fb5443686579d55d8f95a42c36b536bd3cb5ca34ab683bc2bacba786d` |
| Niezmieniony `scripts/review/candidate-manifest.mjs` |`dbe6934fdb966c30c8b811a6b48805dd22ff66d779299f3558e8b0eade631a3c` |

## Granice i przekazanie

Test wykorzystuje istniejący `copyCurrentMigrationFixture`: rzeczywiste osiem banków workspace i fixed historyczny Claude918 z commitu `58d7e8b918590abfe3cfa4da2594f1c12653f547`, wraz z wymaganymi proofami. Candidate manifest ładowany z rzeczywistego repo; wywołany rzeczywisty `verifyCandidateCurrentSource`, bez substytutu consumera. Historical counts932/16041 i counts958/16695 zachowane. Dowód dotyczy ekstrakcji i tego accepted wejścia migracji, nie całego obecnego kandydata ani wydania.

Nie uruchamiano pełnej suity, CI/build ani release workflow/gates; ich skutki i odbiór wydania pozostają osobne. Do tej lokalnej partii wystarczają test parity przez rzeczywiste wejścia, właściwa regresja i kontrola dokładnej ekstrakcji; żaden wymagany lokalny check nie został pominięty. Bez commit/push, urządzeń, usług, maili, publikacji, celu, automatyzacji lub nowego wątku. Prywatnych danych nie kopiowano do repo.

AC1–5 odebrane niezależnie; plan, bieżący stan, linki i zachowany residual sprawdzone w końcowym QA readback. Pozostałe partie M05 od AWS do OOD reason-amendment19a pozostają w jednym istniejącym zadaniu. Następny dopuszczalny: **prompt30 / AWS (`AWS_SAA_TARGETED_CORRECTIONS`) w NOWYM czacie**. Nie uruchomiono. Pełne M05 pozostaje otwarte.

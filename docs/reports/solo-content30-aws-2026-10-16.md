# Prompt 30 / M05 — historyczne stałe AWS, jedna partia

16.10.2026 — **PASS: kod i lokalny odbiór tej partii, niezależne QA AC1–5 PASS.** Pełne M05 pozostaje otwarte.

## Cel, zakres i podejście

Wykonano wyłącznie partię `AWS_SAA_TARGETED_CORRECTIONS` z istniejącego SOLO-CONTENT-01 w [jedynym planie workspace](../../../docs/PATTERNLY-WORKING-PLAN.md). Sprawdzono obowiązujące AGENTS, wiersz M05, bieżący stan, wskazane źródła/testy i raport Claude, rzeczywiste wejścia verifiera/consumera, referencje, konfigurację testów/workflow oraz Git diff. Zależność29, BIZQ-05, SIMP03 i Claude pozostają odebrane; bez ponawiania ich partii i bez odtwarzania historii/kopii planu w APP.

Przed edycją określono AC1–5: pełny accepted wynik verifiera i realnego consumera identyczny przed/po; te same odmowy changedhash/corrupt/order zgodne z AWS; jedna produkcyjna definicja bez zmian pinów/logiki/API; wszystkie pozostałe partie M05 zachowane. Ocena: dopasowanie1,00 / prostota0,99 / kontrola ryzyka0,97 / utrzymywalność0,99; minimum0,97. Jeden statyczny moduł kontynuuje istniejący wzorzec evidence bez nowej abstrakcji. Niezależny review podejścia **Luna High PASS**, przed edycją produkcji. Jedynym writerem był agent główny; osobny reviewer QA Luna High, read-only, wydał PASS AC1–5 po własnym teście8/8, porównaniu deklaracji oraz publicznego API i końcowym readback planu/stanu/linków.

Zmiany względem zastanego WIP:

- CONTENT `evidence/migration-verifier/aws-saa-targeted-corrections.mjs`: jedna produkcyjna definicja AWS. Dokładny initializer, wartości, piny, kolejność kluczy i 28 `questionIds`, oba `Object.freeze` zachowane.
- CONTENT `scripts/content/verify-migration.mjs`: import bindingu i usunięcie zastąpionej deklaracji. Reszta pliku identyczna z wejściem; `EXPECTED_CURRENT_PRODUCER_BANKS`, funkcje, reguły, schema-key arrays i publiczne API pozostają na miejscu. Consumer i inni konsumenci rekonstrukcji niezmienieni.
- CONTENT `tests/migration-evidence-aws.test.mjs`: baseline pełnego accepted wyniku obu rzeczywistych wejść, sześć odmów AWS oraz zaakceptowana zmiana kolejności wejściowej listy bezpośredniej rekonstrukcji. Test powstał i przeszedł przed edycją produkcyjną.
- CONTENT `package.json`: tylko dopisanie nowego testu do `test:canonical`, z zachowaniem wcześniejszego WIP.
- APP niniejszy dowód; aktualizacja jednego planu workspace i jednego bieżącego stanu.

Verifier16004→15981 linii (−23 netto); moduł24 linie, w tym23 linie przeniesionej deklaracji. Nie przeniesiono innych danych ani nie usuwano historycznych proofów. Brak loadera, schematu, publishera i zmian pinów.

## Baseline i rzeczywisty kontrakt AWS

Baseline ustalono przed zmianą produkcji, przez istniejący `copyCurrentMigrationFixture`, `verifyMigration` i rzeczywisty `verifyCandidateCurrentSource` z manifestem ładowanym z repo. Fixture kopiuje rzeczywiste osiem banków workspace i fixed historyczny Claude918 z `58d7e8b918590abfe3cfa4da2594f1c12653f547`. Sprawdzono proof AWS oraz hashe wszystkich12 jego kanonicznych `sourceFiles`, bez przepinania danych. Proof:

`6d1545d9de8438600acc338bb9a53227b57d86f76345b63c8f6b141491196745`

Pełny accepted fingerprint przed/po (wyłączony tylko losowy `contentRoot`):

`396b2ef6f9dcc50222afeccf48d73b8a85082101a4b14c043298fd9ad828304f`

Pełny wynik realnego consumera przed/po:

`d368bc9b6f0993223b9109a7805597533f8cdffda0b8480e25aa9c31b71c43d1`

Historyczne counts932/16041, accepted counts958/16695, dziewięć tracków i bieżące AWS2604 zachowane. Mutacje dobrano po odczycie kolejności walidacji i rzeczywistym probe baseline, zamiast zakładać kody błędów.

| Mutacja | Verifier i realny consumer przed/po | Bezpośrednia rekonstrukcja przed/po |
| --- | --- | --- |
| Dopisana nowa linia do pinned proofu |`HASH_MISMATCH` |`HASH_MISMATCH` |
| Corrupt pinned proof JSON |`HASH_MISMATCH` |`HASH_MISMATCH` |
| Reverse `proof.items` |`HASH_MISMATCH` |`HASH_MISMATCH` |
| Zmieniony prompt w kanonicznym AWS source |`HASH_MISMATCH` |`HASH_MISMATCH` |
| Corrupt canonical source JSON |`INVALID_JSON` |`HASH_MISMATCH` |
| Reverse canonical source question array |`CANONICAL_ORDER` |`HASH_MISMATCH` |
| Reverse in-memory `questions` |nie jest mutacją pliku |Accepted, identyczny pełny wynik rekonstrukcji |

Proof sprawdzany byte-first, więc przestawienie `items` nie dociera do walidacji semantycznej. W pełnym verifierze kanoniczny loader sprawdza JSON/porządek przed rekonstrukcją; bezpośrednia rekonstrukcja otrzymuje niezmienione pytania w pamięci i odrzuca zmienione bajty pliku przed parserem. Sortowanie przy hashowaniu i na wyjściu pozwala odwrócić wejściową listę w pamięci. Po przywróceniu plików test ponownie porównuje pełne wyniki wszystkich trzech wejść.

## Faktyczne sprawdzenia

Z `patternly-content`, Node `v22.22.3` (workflow używa Node22):

| Komenda / sprawdzenie | Wynik |
| --- | --- |
| `node --test tests/migration-evidence-aws.test.mjs` przed edycją produkcji |8/8 PASS |
| Ta sama komenda po ekstrakcji |8/8 PASS, identyczne pełne fingerprinty i odmowy |
| `node --test tests/saa-20261010-targeted-corrections.test.mjs` |2/2 PASS;28 korekt, scoring/build AWS, predecessor, drift i tampered proof |
| `node --test --test-name-pattern='current -bizq02\|package policy\|old 2,568-question AWS\|ODK-096' tests/simp03-verifier.test.mjs` |4/4 PASS; accepted banki, polityka wersji, stary AWS bank, ODK approval count/hash drift |
| `node --test tests/odk096-canonical-approval.test.mjs` |1/1 PASS; istniejący konsument rekonstrukcji i dokładne approval binding |
| `node --check` verifiera, nowego modułu i testu |3/3 PASS |
| `git diff --check` CONTENT |PASS |
| Exact-text/refcheck |Dokładna deklaracja/freeze/order; reszta verifiera identyczna z wejściem; jedna produkcyjna definicja; consumer bez zmian |
| Runtime probe |Jeden eksport modułu; obiekt i `questionIds` zamrożone; binding prywatny w API verifiera; `verifyCanonicalContent === verifyMigration` |
| Ochrona zastanego WIP |191 ścieżek,189 identycznych; tylko verifier/package mają zweryfikowany przyrost tej partii |

Pierwsza kontrola ochrony WIP użyła błędnej względnej ścieżki bazowej. Po zastąpieniu jej rzeczywistym absolutnym rootem potwierdzono powyższy wynik; nie zmieniano plików w odpowiedzi na ten błąd kontroli. Tymczasowy probe/snapshot służył ustaleniu baseline; odtwarzalny dowód zachowania jest wersjonowanym testem.

| Plik CONTENT |SHA-256 |
| --- | --- |
| `scripts/content/verify-migration.mjs` |`7f530a8f9d7e61f0793b0430778a11d291d7370be9dacafdb67cfd1a7dcfc2c8` |
| `evidence/migration-verifier/aws-saa-targeted-corrections.mjs` |`e3cdaf191044827a5c1316f8fdc42a579365e9972706f2f02ca82772f0055680` |
| `tests/migration-evidence-aws.test.mjs` |`8e1b2b6d032cd17fa7956973761a7252d552ee151c8f857b82a9bba3e5fb5e14` |
| Niezmieniony `scripts/review/candidate-manifest.mjs` |`dbe6934fdb966c30c8b811a6b48805dd22ff66d779299f3558e8b0eade631a3c` |

## Granice i przekazanie

To odbiór ekstrakcji AWS i wskazanego accepted wejścia migracji, nie pełnego obecnego kandydata ani wydania. Pozostałe banki są wejściami istniejącego fixture; nie ponawiano odbioru ich zakończonych partii. Inspekcja referencji potwierdziła również niezmienione użycie publicznej rekonstrukcji w `candidate-draft-v2.mjs`; nie uruchamiano jego pełnego build-all. Bez pełnej suity, CI, native ani release workflow/gates. Wymagane lokalne sprawdzenia tej ekstrakcji wymieniono powyżej; gates kandydata/publikacji pozostają oddzielne.

Lokalny odbiór i niezależne QA AC1–5 PASS, brak residualu tej ekstrakcji. Z istniejącego zadania M05 usunięto tylko AWS; końcowy readback planu/stanu/linków i pozostałych partii PASS. Wszystkie pozostałe partie zostają w istniejącym zadaniu, począwszy od bieżących banków `EXPECTED_CURRENT_PRODUCER_BANKS`. Następny dopuszczalny po PASS: **prompt30 / bieżące banki (`EXPECTED_CURRENT_PRODUCER_BANKS`) w NOWYM czacie**. Nie uruchomiono. Pełne M05 pozostaje otwarte.

Bez commit/push, operacji na urządzeniach/usługach/mailach, publikacji, celu, automatyzacji i nowego wątku. Cudzy WIP i prywatne dane zachowane; prywatnych danych nie przenoszono do repo. Sesja kończy się po tej jednej partii.

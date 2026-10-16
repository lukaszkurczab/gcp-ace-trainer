# Prompt 30 / M05 — EXPECTED_CURRENT_PRODUCER_BANKS, jedna partia

16.10.2026 — **PASS: kod i lokalny odbiór tej partii, niezależne QA AC1–5 PASS.** Pełne M05 pozostaje otwarte.

## Cel i zakres

Przeniesiono wyłącznie deklarację `EXPECTED_CURRENT_PRODUCER_BANKS` z CONTENT `scripts/content/verify-migration.mjs` do `evidence/migration-verifier/current-producer-banks.mjs`. Jedna produkcyjna definicja mapy, pięć wpisów w tej samej kolejności, identyczna kolejność kluczy, wartości i piny oraz wszystkie sześć `Object.freeze`. Nowy moduł importuje `CLAUDE_SUCCESSOR_BANK` z istniejącego `claude-historical.mjs`; wpis Claude nadal używa obu jego pól, bez kopiowania wartości. Verifier importuje mapę prywatnie. Pozostała treść verifiera identyczna z wejściem sesji; funkcje, reguły i schema-key arrays pozostają na miejscu. Publiczne API i alias `verifyCanonicalContent === verifyMigration` zachowane. Consumer niezmieniony.

Przeczytano obowiązujące AGENTS, M05 w [jedynym planie workspace](../../../docs/PATTERNLY-WORKING-PLAN.md), [bieżący stan](../../../.agent/WORKING_STATE.md), wskazane źródła, zależności, konsumentów, testy/config, workflow i zastany Git diff oraz [raport AWS](solo-content30-aws-2026-10-16.md). Zależność29, BIZQ-05, SIMP03, Claude i AWS pozostają odebrane; nie ponawiano ich partii. Bez ładowania całej historii i bez kopii planu w APP.

Przed edycją podano AC1–5: identyczne pełne accepted wyniki verifiera i realnego consumera, rzeczywiste odmowy changedhash/corrupt/order, jedno źródło z identycznym freeze/API/logiką i zależnością Claude, pozostałe partie M05 zachowane. Ocena dopasowanie1,00 / prostota0,99 / kontrola ryzyka0,97 / utrzymywalność0,99, minimum0,97. Jeden statyczny moduł według istniejącego wzorca evidence; bez loadera, schematu, publishera, compatibility layer, dodatkowych banków i usuwania historii. Niezależny review podejścia **gpt-6-luna high PASS przed edycją produkcji**. Agent główny jedynym writerem; niezależny reviewer implementacji **gpt-6-luna high**, read-only, według `qa-gate`: **PASS AC1–5**, własny test22/22 oraz niezależne porównanie deklaracji, API, rzeczywistych etapów odmowy i końcowy readback planu/stanu/linków/residualu.

Zmiany względem zastanego WIP:

- CONTENT nowy `evidence/migration-verifier/current-producer-banks.mjs` (24 linie, w tym23 przeniesionej deklaracji).
- CONTENT `scripts/content/verify-migration.mjs`: tylko import i usunięcie zastąpionej deklaracji;15981→15959 linii, −22 netto.
- CONTENT nowy `tests/migration-evidence-current-producer-banks.test.mjs`: odtwarzalny baseline/parity według istniejącego wzorca testowego.
- CONTENT `package.json`: tylko dopisanie testu do istniejącego `test:canonical`, bez zmiany wcześniejszego WIP.
- APP niniejszy raport; jeden plan i jeden bieżący stan workspace.

## Baseline i parity rzeczywistych wejść

Najpierw wykonano bezpieczny probe istniejącego `copyCurrentMigrationFixture`, rzeczywistego `verifyMigration` oraz `verifyCandidateCurrentSource` z manifestem ładowanym przez `loadCandidateManifest` z repo. Przed zmianą produkcji zapisano test i uruchomiono22/22 PASS. Po ekstrakcji ten sam test22/22 PASS. Pełne wyniki fingerprintowane z wyłączeniem wyłącznie losowego `contentRoot` verifiera:

| Wynik | SHA-256 przed i po |
| --- | --- |
| Cały accepted wynik verifiera | `396b2ef6f9dcc50222afeccf48d73b8a85082101a4b14c043298fd9ad828304f` |
| Cały wynik rzeczywistego `verifyCandidateCurrentSource` | `d368bc9b6f0993223b9109a7805597533f8cdffda0b8480e25aa9c31b71c43d1` |
| Tożsamości pięciu banków: `JSON.stringify` uporządkowanych par `[trackId,{questionCount,questionSetSha256}]` | `c586b504ceaf9b8ec17cec02757e1ebbba31338884fce0b534edce3991607590` |

Test czyta wszystkie kanoniczne pliki pięciu banków i oblicza tożsamości dokładnym leksykalnym komparatorem verifiera. Pierwszy pomocniczy probe użył `localeCompare`, dając inny diagnostyczny hash AWS; porównanie z rzeczywistym komparatorem wskazało błąd probe. Test używa właściwego komparatora i potwierdza wszystkie piny bez zmiany danych. Historyczne counts9/117/932/16041 i accepted9/117/958/16695 zachowane; real consumer zwraca te same pełne dziewięć rekordów.

| Bank | Count | Question set SHA-256 |
| --- | --- | --- |
| AWS |2604 |`f745d5ea27b753a3fae1143c079086fb2bab99dacfbb89a08744925030eeed42` |
| BESD |1569 |`46954940e5d7ef7517f2602e32899f4ffbcbff13e40e8c6409f8433e0e0dd9c9` |
| Claude |918 |`710b8550f3d09c20437912f045853fed596ec92c431c785a6fe42a0da0c5377c` |
| Coding |3404 |`cf941d1ea96f24110ea67dc7a112b2a1093848086ef5f14840ef0bf5da50d9ab` |
| OOD |1413 |`c92a9f04488efb4ef7a5fa8b3257495c21e6c62125123df8073141c60000b2d8` |

## Odmowy i znaczenie kolejności

Kolejność walidacji: secure root → canonical loader (parser, contract, identity, canonical question order) → BIZQ05 → rekonstrukcja AWS → `validateCurrentProducerBanks` → pozostałe evidence/proofy. Consumer najpierw waliduje manifest i deleguje do rzeczywistego verifiera. Mutacje wybrano dopiero po prześledzeniu kodu i potwierdzeniu faktycznych odmów baseline. Dokładne kanoniczne ścieżki wejściowe są wersjonowane w `sourcePaths` testu.

| Mutacja wykonana osobno dla każdego z pięciu banków | Wynik obu rzeczywistych wejść przed/po | Etap |
| --- | --- | --- |
| Zmiana promptu |`HASH_MISMATCH` |BESD/Claude/Coding/OOD: `validateCurrentProducerBanks`; AWS: wcześniejsza rekonstrukcja całego banku |
| Usunięcie ostatniego pytania z niepustej tablicy |`HASH_MISMATCH` |Te same etapy co prompt; bez podmiany pinów |
| Corrupt canonical JSON (`{`) |`INVALID_JSON` |Wcześniejszy parser canonical loadera |
| Reverse canonical question array |`CANONICAL_ORDER` |Wcześniejszy canonical loader |

Łącznie20 odmów dla obu wejść. Dla prompt/count test porównuje także dokładny komunikat, aby rozróżnić validator mapy od wcześniejszego AWS. Nie przypisuje parser/order mapie. Sama mapa hashuje listę po sortowaniu po `questionId`; kolejność jej wpisów zachowano dokładnie jako własność ekstrakcji, bez wymyślania reguły odmowy. Dodatkowo reverse `catalog.tracks` jest accepted z identycznymi pełnymi wynikami obu wejść. Po wszystkich mutacjach przywrócone bajty i ponownie porównane pełne wyniki accepted.

## Faktyczne sprawdzenia

Node `v22.9.0`, `/Users/lukaszkurczab/.nvm/versions/node/v22.9.0/bin/node`; workflow używa Node22. Domyślny host Node24 nie był runtime tych testów.

| Sprawdzenie z CONTENT | Wynik |
| --- | --- |
| `node --test tests/migration-evidence-current-producer-banks.test.mjs` przed produkcyjną edycją |22/22 PASS |
| Ta sama komenda po ekstrakcji |22/22 PASS |
| `node --test tests/simp03-verifier.test.mjs` |12/12 PASS; istniejące accepted/policy/drift, historical Claude/AWS, Coding, ODK, evidence i ścieżki |
| `node --check` verifiera, modułu i testu |3/3 PASS |
| `git diff --check` CONTENT i APP; whitespace nowych plików |PASS |
| Exact-text/rest-of-file/refcheck |Deklaracja dokładna, jedna definicja produkcyjna; reszta verifiera identyczna z wejściem |
| Runtime probe API/freeze/Claude |Osiem dotychczasowych eksportów verifiera; binding mapy prywatny; alias zachowany; moduł eksportuje tylko mapę; mapa i pięć wpisów zamrożone; zależność Claude zachowana |
| Ochrona WIP czterech repo |194 zastane ścieżki:192 byte-identical; jedynie verifier/package z dokładnie zweryfikowanym przyrostem tej partii |

Tymczasowy probe/snapshot służył ustaleniu baseline i ochronie WIP. Odtwarzalny test jest w repo i w `test:canonical`; brak dostarczonego nowego narzędzia. Pełne npm test/build-all/CI i gates wydania nie były wymagane ani uruchamiane dla tej ekstrakcji; workflow nie zastępuje wąskiego lokalnego odbioru i odwrotnie.

| CONTENT plik | SHA-256 po zmianie |
| --- | --- |
| `scripts/content/verify-migration.mjs` |`08187146bdf71cadc4555ccdbe77e083100fb25bb36bb24c9a5366df0d512f3b` |
| `evidence/migration-verifier/current-producer-banks.mjs` |`b7d8d72768ae4dd05dc71cf7a2223070c8ec5fc755af6abda0fc45a1722da601` |
| `tests/migration-evidence-current-producer-banks.test.mjs` |`3f96c3448e401b17732b4b58331c4a34510eb94df96bbc0771ab01171876f5ee` |
| Niezmieniony `scripts/review/candidate-manifest.mjs` |`dbe6934fdb966c30c8b811a6b48805dd22ff66d779299f3558e8b0eade631a3c` |

## Granice i przekazanie

Dowód dotyczy ekstrakcji jednej mapy i actual consumer na istniejącym accepted fixture: osiem rzeczywistych banków workspace oraz fixed historyczny Claude918 z `58d7e8b918590abfe3cfa4da2594f1c12653f547`. To nie odbiór całego obecnego kandydata ani wydania. AWS jest sprawdzany wcześniej przez istniejącą rekonstrukcję; nie twierdzimy, że jego mutacje bezpośrednio ćwiczą prywatny validator mapy. Dokładna ekstrakcja i zachowana logika potwierdzają zachowanie jego wpisu.

Brak residualu odebranej ekstrakcji. Z istniejącego zadania M05 usunięto wyłącznie bieżące banki; pozostałe17 partii zachowano dokładnie w tej samej kolejności, od BESD slice do OOD reason-amendment19a. Jeden plan workspace i jeden bieżący stan z linkiem do tego dowodu zaktualizowane; końcowy readback QA PASS. Następny dopuszczalny zakres: **prompt30 / BESD slice (`BIZQ01_PROOF`) w NOWYM czacie**, nieuruchomiony. Pełne M05 otwarte. Bez commit/push, urządzeń, usług, maili, publikacji, celu, automatyzacji i nowego wątku; cudzy WIP i prywatne dane zachowane.

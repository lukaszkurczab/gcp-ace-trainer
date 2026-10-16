# Prompt30 / M05 — BESD slice (`BIZQ01_PROOF`), jedna partia

16.10.2026 — **PASS: kod i lokalny odbiór tej partii, niezależne QA AC1–5 oraz końcowy readback PASS.** Pełne M05 pozostaje otwarte.

## Zakres i podejście

Wyłącznie deklarację `BIZQ01_PROOF` przeniesiono z CONTENT `scripts/content/verify-migration.mjs` do `evidence/migration-verifier/bizq01-besd-slice.mjs`: dokładnie27 linii, z dodaniem `export` w module. Zachowane wartości, piny, kolejność kluczy i dwóch wpisów `replacements`, cztery `Object.freeze`. Jedna produkcyjna definicja. Verifier importuje binding prywatnie; osiem dotychczasowych eksportów i alias `verifyCanonicalContent === verifyMigration` zachowane. Reszta verifiera identyczna z wejściem sesji;15959→15933 linie, −26 netto. Nowy moduł nie ma zależności. Funkcje, reguły, schema-key arrays, cohort14/cohort15 i wszystkie pozostałe stałe pozostają na miejscu. Consumer, proof JSON, pytania i piny niezmienione; bez loadera, schematu, publishera, compatibility layer i usuwania historii.

Przeczytano obowiązujące AGENTS, M05 w [jedynym planie workspace](../../../docs/PATTERNLY-WORKING-PLAN.md), [bieżący stan](../../../.agent/WORKING_STATE.md), wskazane źródła, zależności, wszystkie użycia stałej, testy/config/workflow i zastany Git diff oraz [dowód poprzedniej partii](solo-content30-current-producer-banks-2026-10-16.md). Zależność29, BIZQ-05, SIMP03, Claude, AWS i bieżące banki pozostają odebrane; bez ponawiania ich partii i bez ładowania całej historii.

Przed edycją określono cel, pliki, AC1–5 i najmniejsze sprawdzenia. Oceny: dopasowanie1,00 / prostota0,99 / kontrola ryzyka0,98 / utrzymywalność0,99; minimum0,98. Agent główny jedynym writerem. Niezależny read-only review podejścia **gpt-6-luna high PASS przed produkcyjną edycją**. Uwagi o rozróżnieniu etapów mutacji i kolejności kluczy uwzględnione na podstawie faktycznego baseline; current prompt odpada już w `validateCurrentProducerBanks`, whitespace B01 w cohort14. Review podejścia nie był odbiorem runtime. Użyto `execution-loop`; QA według `qa-gate`, osobny reviewer gpt-6-luna high, read-only.

Pliki tej partii:

- CONTENT `evidence/migration-verifier/bizq01-besd-slice.mjs` — jedyna definicja27 linii.
- CONTENT `scripts/content/verify-migration.mjs` — wyłącznie import i usunięcie zastąpionej deklaracji.
- CONTENT `tests/migration-evidence-bizq01-besd-slice.test.mjs` — odtwarzalny baseline/parity według istniejącego wzorca.
- CONTENT `package.json` — wyłącznie dopisanie tego testu w istniejącym `test:canonical`.
- APP niniejszy raport; jeden istniejący plan i jeden bieżący stan workspace, końcowy readback QA PASS.

## Łańcuch historyczny i baseline

Rzeczywista kolejność: secure root → canonical loader (parser, schema, tożsamość, canonical order) → BIZQ05 → AWS predecessor → `validateCurrentProducerBanks` → evidence → `loadBizq01ReplacementProof` → cohort15 → rekonstrukcja cohort14 → walidacja cohort14 → rekonstrukcja source01 → `validateBizq01Source01Proof`.

Cohort15 weryfikuje bieżący bank1569 i osiem źródeł B02–B09; zastępuje134 obiekty predecessorami, sprawdza odtworzone source14 bytes i pełny hash tracka. Cohort14 korzysta z predecessor canonical i obu nadal aktywnych B01 (rozłączne źródła względem cohort15), weryfikuje32 replacements, odtwarza posortowane source01 przez `canonicalJson`, wiąże je z `beforeSourceSha256`, umieszcza w mapie `predecessorSourceBytes` i przekazuje ją do `validateBizq01Source01Proof` jako `privateSourceBytesOverrides`. Source01 sprawdza historyczny bank o hashu `e4bdc6e7d213d03ad079d8c21b552fe89946e15a2ee99560512067c2c60c5d41`; przy kontroli source bytes wybiera override, zachowując sprawdzenia rzeczywistej ścieżki. Ten prywatny kontrakt i publiczne API są niezmienione.

| Źródło B01 | Aktywne bajty cohort14 | Historyczne source01 przez override |
| --- | --- | --- |
| BESD-N02-B01 | `f73d88f77618599892473b17848e9e01947277ab56304795343abaa188713a89` | `164b3221fe641c16353339c0ef99772793f8866e195ea3cff976a633344e7e6d` |
| BESD-N04-B01 | `95196e344ef05a68b1b0ee2a8c27271a753edda62ec64b0b31bf9ae58a67e223` | `b8d9874fe7ff4dbcecf05519857aa57e9b828ec1eb4ba37a7ff8f789e2829c15` |

Test potwierdza zgodność aktywnych bajtów z pinami cohort14, ich różnicę względem source01 oraz zgodność source01 pinów z `cohort14.beforeSourceSha256`. Istniejący wybrany test source-slice niezależnie rekonstruuje obie tablice poprzedników i potwierdza dokładne hashe. Pełny accepted verifier przechodzi rzeczywisty prywatny override i pełny łańcuch; nie udostępniano prywatnych funkcji do testu.

Najpierw bezpieczny probe istniejącego `copyCurrentMigrationFixture`, rzeczywistego verifiera i consumera, potem zapisanie testu i **baseline19/19 przed zmianą produkcyjną**. Po ekstrakcji ten sam test **19/19**. Pełne wyniki (wyłączony wyłącznie losowy `contentRoot` verifiera):

| Wynik | SHA-256 przed i po |
| --- | --- |
| `sha256(canonicalJson(stableAccepted))` — cały verifier | `396b2ef6f9dcc50222afeccf48d73b8a85082101a4b14c043298fd9ad828304f` |
| `sha256(canonicalJson(consumed))` — cały realny `verifyCandidateCurrentSource` | `d368bc9b6f0993223b9109a7805597533f8cdffda0b8480e25aa9c31b71c43d1` |

Consumer otrzymuje rzeczywisty manifest przez `loadCandidateManifest(root)` i rzeczywiście deleguje do verifiera. Pełne dziewięć rekordów consumera identyczne. Accepted counts9/117/958/16695, historical9/117/932/16041;168 par BESD, pierwsze dwie source01 w zachowanej kolejności. Tożsamość obecnego BESD1569: `46954940e5d7ef7517f2602e32899f4ffbcbff13e40e8c6409f8433e0e0dd9c9`, potwierdzona rzeczywistą walidacją mapy i cohort15.

## Mutacje i znaczenie kolejności

Każda odmowa wykonana przez oba rzeczywiste wejścia przed i po, z kontrolą kodu oraz komunikatu wskazującego etap; po mutacji przywracane oryginalne bajty. Łącznie17 odmów, jeden accepted reorder kluczy i test nadrzędny:19/19.

| Mutacja | Wynik | Rzeczywisty etap |
| --- | --- | --- |
| `items[i].beforeQuestion.prompt`, osobno oba wpisy | `HASH_MISMATCH` | source01 `assertCanonicalHash`: `beforeQuestion.canonicalQuestionSha256` |
| `items[i].beforeQuestion.questionId`, oba wpisy | `EVIDENCE_MEMBERSHIP` | source01 tożsamość historycznego obiektu |
| `items[i].sourceSha256`, oba wpisy | `EVIDENCE_VALUE` | source01 porównanie descriptor pair; przed czytaniem source bytes |
| `questionSetSha256` proofu | `EVIDENCE_VALUE` | source01 bounded batch identity |
| Reverse `manifest.items` | `EVIDENCE_VALUE` | source01 indeks0: `sourceFile` nie pasuje do `replacements[0]` |
| Corrupt JSON source01 proof (`{`) | `INVALID_JSON` | parser proofu w source01, bez byte-first pinu całego JSON |
| Zmiana promptu zachowanego replacementu w aktywnym B01, oba źródła | `HASH_MISMATCH` | wcześniejsze `validateCurrentProducerBanks`, przed łańcuchem BESD |
| Corrupt JSON aktywnego B01, oba źródła | `INVALID_JSON` | wcześniejszy canonical parser |
| Reverse tablicy pytań aktywnego B01, oba źródła | `CANONICAL_ORDER` | wcześniejszy canonical loader |
| Dopisanie newline do aktywnego B01, oba źródła | `HASH_MISMATCH` | wcześniejszy cohort14 fixed current source hash; semantyczny hash banku bez zmian |
| Odwrócenie kluczy JSON proofu rekurencyjnie, w tym `beforeQuestion`, bez zmiany tablic | accepted, pełne wyniki identyczne | kolejność kluczy proofu semantycznie nieistotna |

Nie utożsamiano pozycyjnego `manifest.items` z kolejnością kluczy JSON. Nie przypisano wcześniejszych odmów walidatorowi source01. Nie zmieniano danych ani pinów, aby uzyskać accepted.

## Faktyczne sprawdzenia i ochrona WIP

Runtime `/Users/lukaszkurczab/.nvm/versions/node/v22.9.0/bin/node` (`v22.9.0`), zgodny z Node22 workflow. Domyślny Node hosta nie był runtime testów.

| Sprawdzenie | Wynik |
| --- | --- |
| CONTENT `node --test tests/migration-evidence-bizq01-besd-slice.test.mjs` przed produkcją |19/19 PASS |
| Ta sama komenda po ekstrakcji |19/19 PASS |
| Wybrane istniejące testy BESD, komenda poniżej |9/9 PASS |
| `node --check` verifiera, modułu i testu |3/3 PASS |
| Exact-text względem zastanego verifiera/package |PASS: moduł = `export ` + dokładna deklaracja, po usunięciu nowego importu i dawnej deklaracji pozostały tekst identyczny; package tylko jeden nowy test |
| Runtime API/freeze i refcheck |PASS: osiem eksportów verifiera, binding prywatny, alias identyczny, moduł eksportuje wyłącznie stałą, cztery freeze, jedna produkcyjna definicja |
| `git diff --check` CONTENT i APP oraz whitespace nowych plików |PASS |
| Snapshot WIP czterech repo |197 zastanych ścieżek:191 byte-identical i cztery zachowane wcześniejsze usunięcia, tylko verifier/package z dokładnie zweryfikowanym przyrostem; wcześniejszy WIP zachowany |

Wybrana regresja z CONTENT:

```sh
node --test --test-name-pattern='accepts the real BIZQ-01 replacement proof|rejects changes to a current replacement and its frozen old object|accepts a policy-only BESD version|accepts the fixed two-unit cohort|accepts the fixed eight-unit cohort|requires both the new fixed proof|preserves the immutable cohort14 proof|BIZQ-01 cohort14 preserves source01 as the exact accepted predecessor' tests/bizq01-migration-proof.test.mjs tests/bizq01-besd-seed-cohort-14.test.mjs tests/bizq01-besd-cohort-15.test.mjs tests/bizq01-source-slice.test.mjs
```

| CONTENT plik | SHA-256 po zmianie |
| --- | --- |
| `scripts/content/verify-migration.mjs` | `5695ab7d519eebf49b86f9cdf2f3cd391bdccc34d07f8d13699066227df71e31` |
| `evidence/migration-verifier/bizq01-besd-slice.mjs` | `44d7252aebfcd99185d644e96fc337634d4b13fc7adbd4a8ba3a9c18406910da` |
| `tests/migration-evidence-bizq01-besd-slice.test.mjs` | `2f172b0cbe76250d15bd7ea0c6fdbe3da9bb1d8836dfee6b593b4f67b378598d` |
| Niezmieniony `scripts/review/candidate-manifest.mjs` | `dbe6934fdb966c30c8b811a6b48805dd22ff66d779299f3558e8b0eade631a3c` |
| Niezmieniony `evidence/business-quality/bizq-01-besd-slice-01.json` | `2fc130454e5511ef5ed8c3d14731551b2943c7e0c61757efb9829a67a28fa761` |

Probe/snapshot/logi tymczasowe służyły baseline i ochronie WIP; odtwarzalny test jest wersjonowany w repo i w `test:canonical`. Pełne npm test/build-all, CI, native/usługi i release gates nie były uruchamiane ani nie są wynikiem tej ekstrakcji. Nie ponawiano odebranych partii bez nowego defektu.

## QA i przekazanie

Niezależne read-only QA implementacji **gpt-6-luna high: AC1–5 PASS**, własny test19/19, własne exact-text/rest/package/API/chain/WIP i przegląd twierdzeń raportu. Bez blocking issue. Własny końcowy readback AC5 planu/stanu/linków/residualu PASS: tylko wiersz M05 zmieniony, dalsza część stanu od Zależność29 identyczna, wszystkie sprawdzone linki lokalne poprawne, dokładnie16 dalszych partii w tej samej kolejności. Nie tworzono nowej ani aktywnej kopii planu w APP; zastane historyczne snapshoty/fixture zachowano zgodnie z zakazem usuwania historii.

Granica dowodu: istniejący fixture z ośmioma rzeczywistymi bankami workspace i fixed historycznym Claude918 z `58d7e8b918590abfe3cfa4da2594f1c12653f547`. Odbiór ekstrakcji source01 i realnego consumera; nie całego obecnego kandydata ani wydania. Nie ma nowego defektu ani zmiany runtime kontraktu w tym zakresie; szersze przyjęcie kandydata i publikacja wymagają własnych istniejących gates.

W zaktualizowanym planie z residualu usunięto tylko BESD slice; pozostałe16 partii od BESD cohort14 do OOD reason-amendment19a pozostają jawnie w tym samym zadaniu M05. Następny dopuszczalny zakres w NOWYM czacie: **prompt30 / BESD cohort14 (`BIZQ01_BESD_COHORT14_PROOF`)**, nieuruchomiony. Pełne M05 otwarte. Bez celu, automatyzacji, nowego wątku, commit/push, urządzeń, usług, maili i publikacji. Prywatne dane zachowane.

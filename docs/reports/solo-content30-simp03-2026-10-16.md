# Prompt 30 / M05 — SIMP03 snapshot, jedna partia

16.10.2026 — **PASS: kod i lokalny odbiór tej partii. Pełne M05 pozostaje otwarte.**

## Cel i zakres

Pierwsza nieprzeniesiona partia wskazana w [kanonicznym planie](../../../docs/PATTERNLY-WORKING-PLAN.md) to pięć stałych SIMP03 snapshot. BIZQ-05 oraz zależność29/M09 są odebrane i pominięte bez ponawiania implementacji. Wskazany historyczny audyt13.10 nie istnieje; plan jawnie odnotowuje tę niedostępność. Podstawą zakresu były bieżące źródła, testy, konfiguracja, Git diff i stan, nie odtworzona historia.

Zmiana CONTENT względem wejściowego WIP:

- `evidence/migration-verifier/simp03-snapshot.mjs`: jedyna produkcyjna definicja `EXPECTED_GLOBAL_COUNTS`, `EXPECTED_GLOBAL_INTERACTIONS`, `EXPECTED_TRACK_COUNTS`, `EXPECTED_TRACK_INTERACTIONS`, `EXPECTED_ENVELOPE_COUNTS`; dokładnie zachowane wartości, kolejność kluczy i wszystkie `Object.freeze`.
- `scripts/content/verify-migration.mjs`: import powyższych, re-eksport tych samych dwóch publicznych bindingów, usunięcie dokładnie zastąpionych definicji. Reguły, funkcje, schema-key arrays i lokalne `INTERACTION_TYPES` niezmienione.
- `tests/migration-evidence-simp03.test.mjs`: pełne accepted fingerprinty przed/po i osiem mutacji przez oba rzeczywiste wejścia; zachowane także accepted zachowanie kolejności wierszy evidence.
- `package.json`: tylko dopisanie tego testu do istniejącego `test:canonical`, z zachowaniem wcześniejszych wpisów/WIP.

Przyczyna: dane jednego historycznego snapshotu można odczytać i utrzymywać bez wyszukiwania w długim verifierze. Nowy moduł ma48 linii; verifier16078→16039, krótszy o39 linii netto względem wejścia tej sesji. Bez loadera, nowego schematu, publishera, usuwania historii ani drugiej definicji pinów. Pięć zastąpionych deklaracji usunięto z verifiera; nie usunięto plików. Nie przeniesiono następnej partii Claude.

Pozostałe zmiany tej sesji: niniejszy dowód, istniejący wiersz M05 w jedynym planie i `.agent/WORKING_STATE.md`.

## Podejście i niezależny odbiór

Ocena przed zmianą: dopasowanie1,0 / prostota0,98 / ryzyko0,95 / utrzymywalność0,98; minimum0,95. Statyczny moduł ES kontynuuje odebrany wzorzec pilota i zachowuje API bez abstrakcji.

Niezależny design review: **Luna High PASS**, przed zmianą produkcyjną. Niezależne QA tej samej partii: **Luna High PASS**, read-only; reviewer samodzielnie uruchomił test partii10/10 oraz regresję18/18. Runtime probe potwierdził tożsamość dwóch publicznych bindingów i zamrożenie wszystkich map oraz per-track objects. Trzy pozostałe stałe pozostają prywatne w API verifiera. Reviewer porównał dokładne initializery z kopią wejściową i prześledził rzeczywistego consumera. Brak blockerów i residualu w tej partii.

## Weryfikacja

Node v22.22.3, CONTENT HEAD `420cdf237e6ca8f1d4cf84c3d70e38ba7896f292` plus zachowany WIP. Komendy uruchomiono w `patternly-content`:

| Sprawdzenie | Faktyczny wynik |
| --- | --- |
| `node --test tests/migration-evidence-simp03.test.mjs` przed ekstrakcją |10/10 PASS po korekcie błędnego założenia testu |
| Ta sama komenda po ekstrakcji |10/10 PASS, identyczne pełne fingerprinty |
| `node --test tests/simp03-verifier.test.mjs tests/simp03-phase-a.test.mjs` |18/18 PASS |
| Te dwie komendy, niezależny reviewer |10/10 i18/18 PASS |
| `node --check` dla verifiera, modułu evidence i nowego testu |PASS |
| `git diff --check` w CONTENT |PASS |
| Exact-text/refcheck |5/5 initializerów identyczne; po wyłączeniu wyłącznie przeniesionych bloków i import/re-export pozostały verifier byte-identical; consumer byte-identical; jedna produkcyjna definicja każdej stałej |
| Ochrona WIP |185 zastanych ścieżek: CONTENT8 / APP177;183 byte-identical, w dwóch dotkniętych plikach CONTENT zachowane wejściowe WIP i tylko zamierzony przyrost |

Pełny fingerprint accepted (pominięty tylko losowy `contentRoot`) przed i po:

`396b2ef6f9dcc50222afeccf48d73b8a85082101a4b14c043298fd9ad828304f`

Pełny fingerprint rzeczywistego `verifyCandidateCurrentSource` przed i po:

`d368bc9b6f0993223b9109a7805597533f8cdffda0b8480e25aa9c31b71c43d1`

| Mutacja | Identyczna odmowa przed/po, przez verifier i candidate consumer |
| --- | --- |
| Global counts / global interactions / track counts / track interactions / envelope counts (pięć osobnych przypadków) |`EVIDENCE_VALUE` |
| Changedhash: `projectionSha256` w historycznym wierszu AWS |`HASH_MISMATCH` |
| Corrupt: niepoprawny JSON migration manifest |`INVALID_JSON` |
| Order: reverse canonical GCP question array |`CANONICAL_ORDER` |

Reverse historycznych migration rows pozostaje accepted i daje dokładnie te same pełne wyniki obu wejść. Pierwszy baseline testu błędnie oczekiwał odmowy tej kolejności (`Missing expected rejection`); rzeczywisty probe i kod wykazały porównanie zbiorów. Skorygowano test do istniejącego zachowania i użyto canonical source order jako negatywnego przypadku. Produkcja była wtedy nietknięta; nie osłabiono AC. Reviewer skorygował też własny probe, który początkowo błędnie oczekiwał eksportowania trzech wcześniej prywatnych bindingów; poprawny probe zachowanego API przeszedł.

Hash plików po odbiorze:

| Plik CONTENT |SHA-256 |
| --- | --- |
| `scripts/content/verify-migration.mjs` |`f3974a0c60bfef780a699f0a1e13656e7c785b510c432a7d9447e88a9efa03f8` |
| `evidence/migration-verifier/simp03-snapshot.mjs` |`fb72b32a39099f0c7d95817633ec1812db27e87657cd90bfa54aad84615342e5` |
| `tests/migration-evidence-simp03.test.mjs` |`c8e798fcdbe2c8f2dbb043c9a71142222bc1de331e1a8438d08f46933472d4e1` |
| Niezmieniony `scripts/review/candidate-manifest.mjs` |`dbe6934fdb966c30c8b811a6b48805dd22ff66d779299f3558e8b0eade631a3c` |

## Granice i przekazanie

Test używa istniejącego `copyCurrentMigrationFixture`: rzeczywiste osiem banków z workspace oraz fixed Claude918 z commitu `58d7e8b918590abfe3cfa4da2594f1c12653f547`, wraz z wymaganymi historycznymi proofami. Dowodzi zachowania accepted wejścia tej migracji i rzeczywistego candidate consumera, nie odbioru całego obecnego kandydata ani wydania. Historyczne liczniki932/16041 i bieżące dla tego wejścia958/16695 pozostały identyczne. Piny i proof JSON nietknięte. Dotychczasowe syntetyczne fixture testowe nie są nowym produkcyjnym źródłem danych.

Bez pełnej suity, CI/build, urządzeń, usług, maili, publikacji, commit/push. Workflow release i wydanie nie były przedmiotem odbioru. Brak materialnego ryzyka pozostawionego w tej partii; dalszy rozmiar verifiera pozostaje residualem M05, jawnie zapisanym w jednym istniejącym zadaniu planu.

**Następny dopuszczalny: prompt30 / partia Claude w NOWYM czacie. Nie uruchomiono.** Ta sesja kończy jedną partię; nie zamyka pełnego M05.

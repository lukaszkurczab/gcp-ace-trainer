# Prompt30 — M05, pilot jednej partii

16.10.2026. Zakres: kod i lokalny odbiór wyłącznie `BIZQ05_GCP_RELATION_AMENDMENT`. Pełne M05 pozostaje otwarte w [jedynym planie](../../../docs/PATTERNLY-WORKING-PLAN.md). Zależność29 odebrana; bez jej powtarzania. Historyczny raport audytu13.10 niedostępny, zgodnie z planem; wybór partii opiera się na aktualnym kodzie.

## Cel, kontrakt i zakres

Pierwsza historyczna stała w kolejności źródła verifiera: 22 uporządkowane ID, cztery relacje, historyczny commit, ścieżki i hashe BIZQ-05 GCP. Przeniesiono dokładny 59-liniowy literal ze wszystkimi `Object.freeze` do `patternly-content/evidence/migration-verifier/bizq05-gcp-relation-amendment.mjs`. Verifier importuje tę jedną definicję; jego pozostałe bajty są niezmienione. JSON `evidence/business-quality/bizq-05-gcp-question-relations-01.json` pozostaje wejściem porównywanym z zaufanymi pinami, nie drugą definicją pinów. Nie zmieniano danych JSON, źródeł pytań, hashy, schematów, API, konsumentów ani kolejności walidacji.

AC: identyczny accepted wynik; identyczne odmowy changedhash/corrupt/order; rzeczywisty `verifyCandidateCurrentSource`; jeden zestaw zaufanych stałych; jawne pozostałe partie w M05. Odbiór lokalny tej partii nie oznacza odbioru całego M05, bieżącego release, usług ani wydania.

Ocena writer przed zmianą: dopasowanie0,95 / prostota0,98 / ryzyko0,94 / utrzymywalność0,96, minimum0,94. Niezależne design review Luna High: PASS, 0,96 / 0,91 / 0,88 / 0,93, minimum0,88. Moduł danych zachowuje dotychczasowy kontrakt bez loadera, nowego schematu i publishera. Uwaga review o jawnej liście residualu została uwzględniona w istniejącym wierszu M05.

Własne pliki:

- CONTENT `scripts/content/verify-migration.mjs`: tylko import i usunięcie zastąpionej stałej.
- CONTENT `evidence/migration-verifier/bizq05-gcp-relation-amendment.mjs`: jedyna definicja przeniesionych pinów.
- CONTENT `tests/migration-evidence-bizq05.test.mjs`: accepted plus siedem mutacji przez verifier i realnego consumera.
- CONTENT `package.json`: test w istniejącym `test:canonical`.
- APP ten raport; workspace `docs/PATTERNLY-WORKING-PLAN.md` i `.agent/WORKING_STATE.md`: odbiór pilota i residual.

## Weryfikacja

Node22.22.3. Nowy test uruchomiono przed ekstrakcją i po niej, z tym samym kodem testu. Pierwsza próba baseline ujawniła błędne przewidywanie dwóch kodów przez autora testu: corrupt source daje `INVALID_JSON` już w parserze canonical, odwrócona kolejność pytań daje `CANONICAL_ORDER`. Doprecyzowano oczekiwania przed jakąkolwiek zmianą produkcyjną; poprawny baseline8/8 oraz after8/8 PASS.

Komendy z CONTENT:

```sh
node --test tests/migration-evidence-bizq05.test.mjs
node --test --test-name-pattern='BIZQ-05 GCP historical relation amendment' tests/content-builder.test.mjs
node --check scripts/content/verify-migration.mjs
node --check evidence/migration-verifier/bizq05-gcp-relation-amendment.mjs
node --check tests/migration-evidence-bizq05.test.mjs
git diff --check
```

Istniejący test BIZQ-05:1/1 PASS; syntax/diff PASS. Nowy test sprawdza complete accepted wynik dla9 banków (16695 pytań, historyczne16041) i rzeczywisty consumer `verifyCandidateCurrentSource` z istniejącym manifestem wczytanym przez `loadCandidateManifest`. Każdą mutację wykonuje kolejno przez obie funkcje, w tymczasowym fixture; produkcyjne pliki nie są mutowane.

| Mutacja | Kod przed i po, oba wejścia |
| --- | --- |
| Zmieniony historyczny hash w proof | `EVIDENCE_VALUE` |
| Uszkodzony proof JSON | `INVALID_JSON` |
| Odwrócone questionIds w proof | `EVIDENCE_VALUE` |
| Odwrócone relations w proof | `EVIDENCE_VALUE` |
| Zmieniony prompt / hash źródła | `HASH_MISMATCH` |
| Uszkodzone bajty JSON źródła | `INVALID_JSON` |
| Odwrócona kolejność pytań źródła | `CANONICAL_ORDER` |

Identyczne skróty complete wyników przed/po: SHA256 z `canonicalJson` (dla verifiera usunięto tylko losowy `contentRoot`):

- verifier: `396b2ef6f9dcc50222afeccf48d73b8a85082101a4b14c043298fd9ad828304f`.
- candidate consumer: `d368bc9b6f0993223b9109a7805597533f8cdffda0b8480e25aa9c31b71c43d1`.

Oryginalny verifier SHA256 `30b528cd6639a9954fa9a8410a217bad7bc6dd211bd8e2949d20d43f87f7b6d5`, równy plikowi z CONTENT HEAD `420cdf237e6ca8f1d4cf84c3d70e38ba7896f292`. Kontrola dokładnego tekstu potwierdziła tylko removal/import oraz identyczny przeniesiony literal. Odtwarzanie baseline: w osobnym tymczasowym checkout tego HEAD uruchomić nowy dostarczony test przed przeniesieniem stałej; fixture helper już wersjonowany. Nie cofać aktywnego workspace.

Zachowane piny: proof bytes SHA256 `83d710aaca9b6a62124e888c52929bba769cad474867de85894a4bbd1ebf6c0f`; GCP source SHA256 `a12d404de3e440766e324784b60a3c225adaf0efe3e66313b36f1d985c17ab1b`. Refcheck: jedna definicja stałej w evidence. Zachowane bajty wszystkich180 zastanych ścieżek WIP (CONTENT4, APP176); bez przejmowania równoległej pracy GCP i aplikacji.

## Granice i korzyść

Test korzysta z istniejącego `copyCurrentMigrationFixture`: rzeczywiste GCP i pozostałe osiem banków z Claude przywróconym do zaakceptowanego918-question snapshot `58d7e8b918590abfe3cfa4da2594f1c12653f547`. To dowód tej historycznej partii i faktycznego consumera na zaakceptowanym wejściu, nie przyznanie zgodności nowszemu bankowi Claude ani całemu aktualnemu kandydatowi. Nie wykonywano pełnej suity, CI, build, native, usług, wydania, commit/push; wąski zakres obejmuje niezmienioną logikę i pełne accepted wejście verifiera. Test jest dodany do standardowej suity; jej uruchomienia nie deklarujemy.

Pilot oddziela59 linii statycznych pinów od logiki, zmniejsza verifier o59 linii i utrzymuje jedną definicję bez dodatkowej warstwy odczytu. Cały pakiet rośnie o regresję; korzyścią jest lokalizacja danych i ochrona kontraktu, nie rozwiązanie rozmiaru całego verifiera. To uzasadnia ostrożną kolejną partię, nie automatyczne przeniesienie pozostałych.

**PASS kod/lokalny jednej partii; niezależne QA Luna High PASS.** Reviewer samodzielnie uruchomił8/8 testów, syntax i diff checks oraz porównał literal z oryginałem; potwierdził oba identyczne fingerprinty. Brak materialnych uwag. Nie rozszerza to zakresu na pełne M05 ani wydanie. Następny dopuszczalny prompt30, nowy czat / SIMP03 snapshot; nieuruchomiony. Pozostałe partie wymieniono wyłącznie w istniejącym zadaniu M05. Bez drugiej partii w tej sesji.

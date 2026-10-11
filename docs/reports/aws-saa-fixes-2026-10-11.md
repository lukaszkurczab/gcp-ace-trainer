# AWS SAA — celowane naprawy 11.10.2026

Właściciel w aktywnej rozmowie 11.10.2026 autoryzował wykonanie i publikację dokładnych pakietów SAA-20261010-01…12 oraz istniejącego FCA-EDIT-658fa75523 przed pierwszym iOS. To wyjątek dla tych 28 ocenionych pytań; pełny audyt i pozostałe naprawy nadal mają kolejność z planu. Q13, cudze zmiany, Premium i konfiguracja usług są poza zakresem.

## Kontrakt i kolejność

Producer `patternly-content`: canonical JSON → istniejący builder → wersjonowany kandydat v2 dokładnego buildu → delegated Codex review/readiness → konsument. Consumer `patternly`: istniejący sync `--reviewed-candidate` dopuszcza zmianę treningową na podstawie dokładnego candidate/release/readiness → aktualny ledger training + artefakt v2 z niezmienioną polityką planowania → istniejący candidate release lock → runtime admission. Nie dodano schematu ani kolejki; historyczne approval i `release.lock.historical-0024.json` pozostają niezmienne. Dawne admission nie jest dowodem dla nowej treści.

Implementacja, integracja i publikacja: producer źródło i narzędzia; producer kandydat/review; consumer bundle/lock/testy; consumer commit dla runtime admission; producer świeże admission; publikacja commitów z kontrolą CI. Publikacja oznacza repozytoria źródeł i przypięty pakiet aplikacji; nie jest publikacją binarnego iOS w App Store. Wycofanie pakietu wymaga powrotu do dokładnych poprzednich źródeł/artefaktu/locka, nie cofania cudzych zmian.

Niezależny review projektu: Luna High, dopasowanie 0,88 / prostota 0,84 / ryzyko 0,81 / utrzymywalność 0,83 (minimum 0,81). Jawny dokładny kandydat chroni przed cichą zmianą treści; pozostałe banki zachowują aktualne opublikowane tożsamości. Q13 nie wymaga zmian runtime. Testy obejmują prawdziwy candidate/readiness, odrzucenie nieaktualnych dowodów oraz scoring i autorski feedback po przetasowaniu dla wszystkich 28 pytań.

Po równoległej publikacji Claude (producer `cac1836e`, app `3143bf49`) zachowano tamte źródła, artefakty, testy i dowody. Wspólne bieżące przypięcia odtworzono z połączonego źródła. Niezależny ponowny review Luna High zaakceptował użycie opublikowanej konwencji raw v2: dopasowanie 0,97 / architektura 0,96 / prostota 0,92 / ryzyko 0,90 / utrzymywalność 0,94; minimum 0,90. Usunięto przejściową projekcję kandydata v1 i dodatkowy przełącznik zatwierdzania, zachowując jeden mechanizm.

## Tożsamości i zakres

Dokładne pliki, before/after, zmienione pola, option IDs i aktualne źródła AWS są w producer `evidence/business-quality/saa-20261010-aws-targeted-corrections.md`; pełne obiekty przed/po oraz mapowanie są w sąsiednim `.json`. Naprawiono 28 pytań w 12 plikach, bez rozszerzania audytu całego banku. Żadne z tych 28 wystąpień nie było już naprawione na lokalnym baseline.

27 `questionId` zachowano. `aws-saa-c03-AWSSAA-N07-B05-005` wycofano na rzecz `aws-saa-c03-AWSSAA-N07-B05-005-saa20261011`, ponieważ nowy scenariusz sprawdza cutover, draining i niejednoznaczny ACK. Zmienione znaczeniowo dystraktory MQ mają nowe option IDs; poprawna odpowiedź pozostaje stable `A`, a jej pozycja w aplikacji jest przetasowywana.

- Commit napraw AWS: `c270a47cb06fb921d0014b7de039df1e30dfd7b1`; połączony canonical source: `ad40ab3c53229acb608ec74c4cccc4a54279c911`.
- Candidate: `8385357bf7dfd91d8f157a1e8adde737237b96d422f64dcea7e134e90d6a52bd`.
- Release: `patternly-candidate-ad40ab3c5322`.
- Questions: 2604; question-set SHA-256 `f745d5ea27b753a3fae1143c079086fb2bab99dacfbb89a08744925030eeed42`.
- Training v1 SHA-256 `590d669156c96fad48d8aa139ca53a93473d44bcf9ed8ffb0f8db8ffe78acd9c`; kandydat i release wiążą dokładne bajty raw v2.
- Raw v2 SHA-256 `350dc44eed14c7087bfdd79196d84d5ca16c606b449536f8c35078b4116a6fc6`.
- Raw v2: `aws-certified-solutions-architect-associate-authoring-v2026.10.11-saa-fixes-v1-bizq03-planning-v2`; pochodna tożsamość treningu dodaje istniejący suffix `-training`.

Niezależny semantic QA (Luna High, 11.10.2026): PASS wszystkich 28 poprawianych pytań, z aktualną dokumentacją AWS i pozytywnymi/negatywnymi przypadkami. Nie jest to semantyczny PASS pozostałych pytań banku.

## Stan

Niezależny odbiór źródeł Luna High na `444679a` względem opublikowanego `7ea9da2`: PASS. Wszystkie 12 plików AWS i proof JSON są byte-exact takie jak przy przeglądzie semantycznym `c270a47`; 28 mapowań before/after, 2604 unikalne pytania. Claude i osiem innych artefaktów są niezmienione względem aktualnego master.

Niezależny odbiór integracji Luna High: rzeczywisty test `tests/candidate-admission-current.integration.mjs` na Node 22.13.1, `PATTERNLY_ADMISSION_APP_ROOT=/private/tmp/patternly-saa-20261011`, PASS 1/1, exit 0. Test klonuje commit aplikacji i sprawdza udane admission oraz odrzucenie brudnych obu skryptów weryfikujących, zatwierdzonego tamper locka i tamper artefaktu AWS. Weryfikowany commit runtime aplikacji: `c1509bfa8192dd6c29cbdc717233a1365adb7346`. Właściwe admission zapisano przez `recordCandidateAdmissionV3` w producer `74c4a05`, a historyczne dowody pozostawiono.

Wykonane polecenia (Node 22.13.1; każde poniżej exit 0):

- `node node_modules/typescript/bin/tsc --noEmit` — po połączeniu kodu aplikacji.
- `node --import tsx --test --test-concurrency=1 scripts/syncBundledContentRelease.test.mjs` — 25/25.
- `node scripts/syncBundledContentRelease.mjs sync --content-root /private/tmp/patternly-content-saa-fixes --reviewed-candidate` — rzeczywisty approved candidate, 9/117/943/16622.
- `node scripts/candidateContentReleaseLock.mjs write` — przypięcie v3 bez modyfikacji historycznego locka.
- `node --import tsx --test --test-concurrency=1 src/application/canonical/canonicalChoiceFeedbackPresentation.test.ts src/content/contentReleaseCrossRepo.test.ts` — 12/12; właściwy bieżący SHA producenta i historyczny checkout; wszystkie AWS28 i zachowane Claude38, stable-ID scoring, autorski feedback, przed odpowiedzią brak answer/feedback, zmienna pozycja A.
- `node scripts/syncBundledContentRelease.mjs check --content-root /private/tmp/patternly-content-saa-fixes` — byte-exact parity.

Końcowy wynik: **PASS**. Pełne CI połączonego producenta [38157240322](https://github.com/lukaszkurczab/patternly-content/actions/runs/38157240322), commit `444679a`, przeszło 231/231 testów, build i scoring wszystkich dziewięciu banków, exact quarantine candidate, decision/readiness oraz Free-package controls. Bieżące źródło `ad40ab3` i kandydat pozostały niezmienione po tym CI; późniejsze commity zapisują admission i dokumentację.

- `node --import tsx --test --test-concurrency=1 scripts/candidateContentReleaseLock.test.mjs src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts` — PASS 29/29, exit 0.
- Producer `node --test tests/candidate-admission-v3.test.mjs tests/candidate-release-gate-v2.test.mjs` — PASS 8/8, exit 0 po zapisaniu nowego admission.
- Producer `node scripts/review/candidate-release-gate-v2.mjs` — exit 0, `RELEASE_READY` dla powyższego kandydata.
- `git diff --check` — exit 0 w obu izolowanych repozytoriach.

Niezależny końcowy QA Luna High: **PASS**, brak blokujących findings. `FCA-EDIT-658fa75523` zamknięto w istniejącym zapisie. Publikacja zgodnie z autoryzacją obejmuje producer `master` oraz aplikację `main`, bez force i bez publikacji binarnego iOS. Commit runtime jest dostępny jako [c1509bfa](https://github.com/lukaszkurczab/gcp-ace-trainer/commit/c1509bfa8192dd6c29cbdc717233a1365adb7346); źródłowy zapis końcowego odbioru i CI: [raport producenta](https://github.com/lukaszkurczab/patternly-content/blob/55e311e/evidence/business-quality/saa-20261010-aws-targeted-corrections.md).

Przejściowe próby na starym decision lub niespójnym lokalnym bundle były odrzucane; po odtworzeniu spójnego opublikowanego predecessor i świeżego decision wykonano powyższe udane sync/check. Przerwane lokalne pełne suite nie są liczone jako PASS. Zakres pozostaje 28 pytań: pozostały bank ma status semantycznego audytu PARTIAL. Oryginalne brudne workspace, Q13, natywne platformy i usługi nie były modyfikowane.

## Równoległa publikacja source-only FESD

Bezpośrednio przed pushem remote producer przesunął się do `3c0717fb714af8b4c022b2575258fe8bbc19cbef`: odrębne naprawy FESD N08, których owner celowo pozostawił app pin jako osobne zadanie. Zachowano te źródła/proof/testy w merge, bez dopuszczania FESD do aplikacji. Odebrany tuple AWS pozostaje dokładnie `ad40ab3` / candidate `8385357b…` / admission `74c4a05` / app `c1509bfa`; jego kandydat i admission nie zostały przebudowane z nieobjętym zleceniem FESD.

Dowód cross-repo 12/12 i sync/check dotyczy producenta `444679a` o canonical content snapshot `ad40ab3`, przed source-only FESD. Globalny app CI porównujący wszystkie dziewięć artefaktów z najnowszym `master` wykryje nowy FESD jako różnicę względem celowo zachowanego app pin. Nie osłabiono tego testu, nie zmieniono workflow i nie przypisano wcześniejszego PASS do późniejszego source HEAD. Jest to odrębna różnica source/published app FESD, a nie defekt odebranego pakietu AWS. Niezależny review potwierdził ważność dokładnego tuple AWS; po merge source-only potrzebny jest osobny wynik CI zintegrowanego producer HEAD.

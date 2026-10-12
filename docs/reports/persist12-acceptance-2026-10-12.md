# PERSIST-12 — integralność zainstalowanych pakietów

Status: zakończone — niezależny source/local/exact-CI PASS z ograniczeniami dowodu; native file-move durability pozostaje w odrębnym PERSIST-13. Native residual pozostaje PERSIST-13. Jedyna kolejka i stan pozostają w primary. Source base `98ab5b4850ca515a62954cc01a3cf88f8384b5a8`, sole writer persist_writer Luna High; independent design/QA persist_design Luna High, bez dalszych agentów. Root: dokumentacja/Git/runtime. Native file-move durability pozostaje PERSIST-13.

## Cel, ustalenia i podejście

Rozróżnić rzeczywisty brak pakietu od korupcji, nieobsługiwanego formatu, niezgodnej tożsamości i niedostępnego odczytu. Źródła: persistence.md PERSIST-12, workspace docs04 Content packages, docs08 Premium whole-node packages / Bootstrap and recovery / Required recovery rule, docs11 fail-closed package integrity, docs17 exact pins.

Potwierdzony mechanizm: storage read/parse/getActive zwracają null przy błędnych danych, listActive pomija rekordy, loader przekazuje skróconą listę. Owner zgłasza ExactContentArtifactUnavailableError, a bootstrap może wyświetlić stan z akcją porzucenia sesji. Nie wykazano błędnego scoringu. Rzeczywisty store→owner regression probe RED: 6/7 PASS, nowa asercja integralności FAIL; actual exact-unavailable zamiast storage-integrity. Pointer i artifact bytes pozostały identyczne. RED nie jest wynikiem naprawy.

Przyjęty projekt: zachować NodePackageStore API; null/[] tylko proven absence. Closed typed integrity error category corrupt/unsupported/identity_mismatch + safe stage; operational IO oddzielne unavailable. Strict inventory przed ready, bez silent fallback; installer preflight przed transport. Nie usuwać ani nadpisywać konfliktowych partial files; Pełny istniejący pakiet można ponownie użyć tylko po exact candidate equality/hash; niepełna para pozostaje jawnie zablokowana i zachowana. Niepewna aktywacja wymaga exact verified before/after albo explicit unknown, bez blind rollback. Bare identity odrzucić unsupported/preserve: tracked writer od introdukcji5de89e5b zapisuje versioned envelope; brak uzasadnionej dependency, docs08 zabrania compatibility branches bez niej. Bez nowego schema/key/store, auto-migration/redownload/index rebuild.

Niezależny design APPROVE: cel0,93/architektura0,91/prostota0,88/ryzyko0,89/utrzymanie0,87; min0,87. Review dotyczy projektu, nie runtime correctness. Cel/Ustalenia/Podejście/AC przedstawione przed START.

## Kryteria odbioru

| Kryterium | Weryfikacja wymagana | Stan |
|---|---|---|
| True absence odróżniona od zapisanej korupcji | Owner read/getActive/listActive, malformed JSON/schema/version/fields/hash/payload | Bounded source/local PASS |
| Exact identity, track/node/key, retained pins | Negative mapping/manifest/payload; valid previous version | Bounded source/local PASS |
| Missing artifact/manifest, oba moves | Partial-pair fault/retry, raw-byte equality | Bounded source/local PASS |
| Evidence zachowane przy retry/restart | Pointer/files exact przed/po; dwa nowe owners/bootstrapy | Bounded source/local PASS |
| Niepewna pointer activation jawna | Set-then-throw/readback failure; verified before/after albo typed unknown | Bounded source/local PASS |
| Zero transport przy uszkodzonej instalacji | Produkcyjny installer preflight + transport count0 | Bounded source/local PASS |
| Bootstrap i UI blokują korupcję bez abandon | Production owner/bootstrap, safe diagnostic/presentation tests | Bounded source/local PASS |
| Prawdziwy exact missing pozostaje odrębny | Existing absence/resume tests, bez current/bundled substitution | Bounded source/local PASS |
| Repo gates i niezależny QA | Targeted→TC→fullgate→exact hosted CI | Independent narrow PASS; fullgate PASS, independent full-log PASS; hosted CI pending |

## Bounded UI audit — stan integralności, CODE_ONLY

Audit status: PARTIAL (CODE_ONLY), UI result: source finding naprawiony i ponownie sprawdzony; native rendering NOT_VERIFIED. Mobile APP, source base98ab, bez live screenshots/build/runtime. Skill patternly-ui-audit wraz z brand map/checklist/template; nie jest to pełny audyt. Platform/theme/language/textsize rendering NOT_VERIFIED; VoiceOver wyłączone decyzją właściciela. Zakres: error state wynikający z stored package corruption, bez layout redesign.

Cel użytkownika: bezpiecznie wznowić exact zapisany materiał lub zrozumieć blokadę. Brak pakietu i uszkodzenie nie są tą samą sytuacją.

| Reguła | Źródło/metoda | Wynik |
|---|---|---|
| Korupcja nie oferuje porzucenia jako missing-content | docs08 Bootstrap; ContentPreparationGate content_identity_unavailable / owner RED | FAIL w bazie; source retest PASS |
| Komunikat nie obiecuje automatycznej naprawy/pobrania | docs06 Error and unavailable-state copy; premiumNodeOfferPresentation | Source/projection tests PASS |
| Stan i następny krok jawne | docs05 state ownership / docs06 voice; blocking branch Try again | Source/projection tests PASS |
| Redundancja/hierarchia/layout | Zmiana bounded state/presentation | NOT_APPLICABLE dla redesign |
| Native rendering/themes/large text/locales | Brak live scenariusza | NOT_VERIFIED, native13 |

### [P1] P12-UI-01 — Uszkodzony pakiet przedstawiany jako brak treści

Confirmed problem; kategoria state. ContentPreparationGate content_identity_unavailable udostępnia „Abandon unavailable session”. Store→owner RED i bootstrap mapping dowodzą źródłowej ścieżki, bez claimu live native. Docs08 wymaga jawnej integralności i blokady normalnej nawigacji do recovery; docs17 zabrania podmiany exact pinów. Użytkownik może porzucić aktywną sesję na podstawie błędnej diagnozy braku. Wysoka pewność source, P1 ze względu na skutek dla zachowanego postępu.

Fix state/behavior: propagować typed integrity do existing blocking surface; safe copy ma wyjaśniać, że zainstalowana treść nie może zostać zweryfikowana, bez obietnicy naprawy lub „download again”. Zachować exact learning facts/pins/bytes, retry odczytu i istniejące znaczenie true missing; bez nowego resetu/porzucenia dla korupcji. Retest: real store→owner→bootstrap daje blocking, UI operation branch nie ma destructive abandon; Premium transport0 i jawny błąd. Native rendering w13, nie dodatkowy gate tej implementacji.

## Wyniki, cleanup i ograniczenia

Oczekiwane: actual file scope/ref scan, targeted/TC/fullgate oraz niezależny QA i exact CI. Nie sumować narrow testów z pełnym gate. Nie deklarować native Expo move atomicity na podstawie memory ports. Cudze primary CC/learningplan/BESD/cleanup i stashe zachowane; source pracuje w jedynym checkoutcie. Bez GO.

## Wczesny niezależny source review

Persist_design Luna High, bez testów i bez final QA: potwierdził installer catch rewrapping typed storage integrity/unavailable (w tym effect unknown) do generic package_storage_failed. To ukrywa efekt pointer activation i może pokazać nieadekwatny retry. Writer otrzymał minimalną korektę preserve/rethrow obu typed errors i rzeczywisty installer-path regression. Root dodatkowo wskazał WIP boundaries: direct read/getActive missing referenced pair oraz świeże zastąpienie exact cache i odrzucenie starego deferred hydration. Nie są to jeszcze wyniki naprawy; final evidence po freeze.

Root potwierdził jeszcze touched activation CAS gap: wcześniejszy raw pointer czytany przed await file verification mógł nadpisać równoległą aktywację i zgubić nowy retained pin. Minimalna korekta w przyjętym projekcie: synchroniczny exact-raw compare bezpośrednio przed setString, mismatch bez zapisu/merge/rebase; deferred-read regression z aktywacją innej wersji. Wdrożenie/testy korekty w toku.

## Targeted checkpoint — przed freeze

Writer raportuje storage11/11 (negative persisted manifest/hash/schema/identity, partial files, I/O, deferred activation CAS), bootstrap19/19, recovery-gate source11/11, owner9/9, composition1/1, diagnostics17/17, Premium presentation2/2, runtime-package install10/10. Ostatni zestaw runtime był przed końcową macierzą testową; końcowy targeted rerun i TC jeszcze przed nami. To checkpoint writera, nie niezależny QA/fullgate. Fixture failures: pierwszy readback fault zniknął po jednym odczycie i drugi poprawnie zweryfikował after; test zmieniono na persistent fault przez próg readback, bez osłabienia production verification. Partial unreferenced file po move pozostaje jawnie unavailable przy retry, z exact zachowaniem evidence; bez automatycznego overwrite/repair.

## Freeze i końcowe wąskie sprawdzenia writera

Zamrożono20 source/test/locale files na98ab5b48. Writer: storage12/12, runtime-package10/10, owner9/9, composition1/1, bootstrap19/19, gate11/11, Premium presentation3/3, diagnostics17/17, locale4/4, Certification route1/1, Premium runtime2/2; końcowy TypeScript i diff-check PASS. Wyniki wąskie nie są sumą pełnego gate ani niezależnym odbiorem.

Ostatnia bounded korekta usuwa eager tworzenie root directory z adaptera Expo. Konstrukcja/odczyt/listowanie absent root nie zapisują danych; katalogi powstają dopiero przy write/move. Potwierdzono API lokalnego expo-file-system57.0.6 i test adaptera z injected filesystem; nie jest to pomiar natywnej trwałości. Niezależny reviewer otrzymał FREEZE i wykonuje odbiór.

Niezależny pierwszy narrow run po freeze:72/72PASS/0FAIL, Node22, pinned clean CONTENT3b0a3e8b; log `/private/tmp/patternly-persist12-independent.log`. Obejmuje storage/package installer/presentation/diagnostics/bootstrap/gate. Review wykazał jeszcze brak tłumaczenia nowego literalnego bootstrap reason: Gate renderował state.reason bez t(), a dwa klucze różniły się session/operation. Writer wykonuje minimalne ujednolicenie z istniejącymi P12 locale keys i tłumaczenie blocking reason; matching wcześniejsze dowody pozostają, affected projection zostanie ponownie sprawdzona.

## Niezależny odbiór po końcowym freeze

persist_design Luna High: **bounded source/local PASS**, brak dalszego konkretnego blockera. Pełny diff20files i realne ścieżki store→owner→bootstrap/installer/UI sprawdzone. Pierwszy narrow72/72PASS; affected copy batch51total/50PASS/1FAIL dotyczył wyłącznie stale exact-copy expectation w bootstrap teście. Po korekcie tylko tego literalu niezależny bootstrap19/19PASS; pozostałe32 affected tests przeszły wcześniej, źródła dla nich bez zmian. Nie sumować przebiegów. Wszystkie7 locale keys potwierdzone; diff-check PASS. Logi prywatne `/private/tmp/patternly-persist12-independent.log` i `/private/tmp/patternly-persist12-independent-bootstrap-final.log`.

P12-UI-01 source retest PASS: integralność blokuje przed resume, nie trafia do content_identity_unavailable/destructive abandon. Premium unknown nie oferuje effectful retry/free fallback, a copy nie obiecuje naprawy ani potwierdzonego zachowania danych przy unknown. Nowy bootstrap copy tłumaczony przez istniejące t() i zgodne klucze locale; fallback dynamic zachowany. Jest to source/wiring/projection evidence, bez live rendering.

Cleanup: usunięto legacy bare-pointer compatibility reader, silent null/skip dla zapisanej korupcji, blind pointer rollback, remove/overwrite partial final oraz eager root mkdir. Nowe typy i verifyInstalledPackages mają produkcyjnych konsumentów; ref scan dotkniętego zakresu nie wykazał zastąpionej martwej ścieżki. Signature NodePackageStore zachowana; legacy pointer jawnie unsupported, bez migratora. Pełny qa:static uruchomiony przez root na przypiętym clean CONTENT3b0a3e8b / historicalcc3efca8 / BACKEND4d8efbd6; wynik PASS (exit0).

## Pełna lokalna bramka

Root qa:static exit0 na zamrożonych źródłach:2409total/2405PASS/0FAIL/4SKIP; recovery487source/358testfiles/2295cases, Stage1PASS, TypeScript/content-boundary/runtime-privacy-boundaryPASS. Node22 i clean pinned CONTENT3b0a3e8b / historicalcc3efca8 / BACKEND4d8efbd6. Pełny log zachowany prywatnie `artifacts/private/persist12-20261012/patternly-persist12-fullgate.log`. Wykonanie wydłużone przez współdzielone obciążenie; read-only kontrola procesów potwierdzała postęp, bez zmiany concurrency/heap i bez zatrzymywania cudzych procesów. Niezależny persist_design Luna High przejrzał cały log i źródła/wejścia: **source + complete local qa:static PASS**. Cztery SKIP to istniejące HTTP/backend integration (recovery coordinator, revoke/ACK, concurrent consume, deletion/recovery); brak ukrytych failures. Hosted exact CI jeszcze niewykonane; native13 osobno.

Dostarczenie: przygotowany spójny pakiet20source/test/locale +5własnych dokumentów (w tym final09/10 metadata i przygotowanie11); zwykły commit/push i exact hosted CI są następnym krokiem. Bez danych prywatnych/node_modules/obcych CC lub BESD.

Dostarczono commit `81ec9aa01a904647c55005d8d48c9ccc47020936` zwykłym push main,25files (20source/test/locale +5owndocs). [Exact CI38182954305](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38182954305) w toku. Primary source/obce zmiany/stashe i12profili/Guest zachowane; metadane po CI zostaną przeniesione z kolejnym spójnym pakietem, bez metadata-only push.

## Końcowy odbiór dokładnego CI

[CI38182954305 SUCCESS obu jobs](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38182954305) na81ec9aa01a904647c55005d8d48c9ccc47020936:2409total/2405PASS/0FAIL/4SKIP,recovery487/358/2295,Stage1/TC/platform/content/privacyPASS,contracts3/3. Root oraz niezależny persist_design LunaHigh sprawdzili pełny log, dokładny HEAD i przypięte wejścia: final **source/local/exactCI PASS z ograniczeniami**, bez konkretnego blockera P12. Cztery istniejące HTTP/backend skips nie są dowodem tych scenariuszy. Pełny log zachowany prywatnie `artifacts/private/persist12-20261012/ci-38182954305-full.log`.

Równoległy upstream4e018fd10d62a60a26fa17581ec1d61f3f2989d2 zawiera81ec jako przodka. W czystym sole writer checkout wykonano FF bez primary reset/stash; P12source/test byte-identical i wszystkie P12keys zachowane w7locale. Merge CC05 jest poza dokładnym odbiorem81ec i ma własnego właściciela. Native13 pozostaje oddzielnie; P12 usunięto z jedynej kolejki. Końcowe metadata przenieść przy kolejnym spójnym pakiecie źródeł, bez metadata-only push. Dalej zatwierdzony probe P11; bez GO.

# Patternly — plan wykonawczy do komercyjnego launchu

_Audyt: 2026-08-23. To jest jedyny aktywny dokument kolejności prac i statusu. Zachowanie produktu definiują docs/canonical-product-contract.yaml, rejestr decyzji Product Ownera i dokumenty właścicielskie. Raporty, screenshoty i Git są wyłącznie dowodami._

## 1. Zasady pracy

- Statusy: done, partial, blocking, deferred, planned, unknown / needs evidence.
- Done wymaga dowodu na bieżącym canonical SHA albo niezmiennym artefakcie. Stary CI, raport lub screenshot nie wystarcza.
- Screenshot z symulatora nie jest Figma parity, signed buildem ani store approval; testy na fizycznym urządzeniu są poza obowiązkowym zakresem tego launchu.
- Bieżący connector channel wskazany przez właściciela: `ksxw21cw`; file `kZXD7cNBKUU7x0ceTHPFpR`, Patternly Library i Page 1 są punktami odniesienia do rewalidacji. Channel nie jest sam w sobie owner approval. Historyczne `76kzylrb` i `eon17bsz` nie mogą być traktowane jako bieżąca approval authority; explicit Product Owner approval dla scoped PKG-04A pozostaje związany z `wtk4hp8i` / board root `10:2`.
- Nie dodawać project ID, credentiali, sekretów, store/provider data ani release admission bez realnej autoryzacji i dowodu. Nie rozszerzać release locka ani nie relabelować historycznych package/release.
- Każdy slice implementacyjny używa apply_patch, focused tests, validatorów, canonical branch i exact-SHA CI; aktualizuje ten plan i jeden raport dowodowy.
- Każdy delegowany task implementacyjny, QA, research, review lub release używa wyłącznie gpt-5.6-luna z reasoning max. Trwałe wymaganie jest w AGENTS.md obu repo i należy je wpisać do raportu.

## 2. Potwierdzony baseline

| Obszar          | Fakt                                                                                                                                                                                                                                                                                                                                                        | Dowód i granica                                                                                                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App             | app source baseline: `992d5bb`; `origin/main` nie został zmieniony w tym tasku                                                                                                                                                                                                                                                                               | Current local `npm run qa:static` passed recovery inventory 284/114/556, 565/565 tests, typecheck, content-boundary, and runtime-privacy-boundary. Historical remote CI evidence is not current-head proof. |
| Content         | master i origin/master: 12b99c78e03ec6c58964d7f83d11d1b50af08467                                                                                                                                                                                                                                                                                            | Exact-SHA [CI 32388398769](https://github.com/lukaszkurczab/patternly-content/actions/runs/32388398769) success; lokalnie zmiana GOV-01 ma 143/143 testów, authoring 10/10 i 838 source JSON. Exact-SHA dla tej zmiany pending.                                     |
| Worktree        | App przed audytem miał user change .gitignore dodający .maestro.                                                                                                                                                                                                                                                                                            | Nie przypisywać go temu planowi. Plan i oba AGENTS.md są lokalnymi zmianami audytu.                                                                                                                                                                                 |
| Release gate    | `npm run release:gate` pozostaje `not_ready`.                                                                                                                                                                                                                                                                                                               | Lock i lokalne artefakty obejmują 8 tracków; otwarte są dirty app checkout, 6 external evidence, 8 human content approvals, 8 publishing admissions i 8 runtime admissions. `physical-device-matrix` jest opcjonalny i nie blokuje launchu.                         |
| Content lock    | App lock obejmuje dokładnie 8 tracków w `patternly-app-content-0020`, release `patternly-launch-2026-08-21-02`.                                                                                                                                                                                                                                             | Schema, provenance, package IDs i SHA są walidowane fail-closed; bieżący lock nie zastępuje human sign-off ani publishing/runtime admission.                                                                                                                        |
| Platform/EAS    | Expo 57.0.11 / React Native 0.86.2; iOS 16.4/iPhone-only; Android min 28, target/compile 36; portrait; Light/Dark/System.                                                                                                                                                                                                                                   | Production EAS ma requireCommit, autoIncrement i fail-closed signing. Plugin Androida wymaga czterech PATTERNLY*ANDROID_RELEASE*\*; credentials/project ID nie istnieją w repo.                                                                                     |
| AWS T1 audit    | 2 568 pozycji, 137 source JSON, 21 node; source audit przechodzi.                                                                                                                                                                                                                                                                                           | `audit:aws-workbook-source` przechodzi, ale `validate:track` kończy się SOURCE_COMMIT_UNAVAILABLE; wykryto także rozjazd wersji envelope oraz tylko 4 itemy Free-node i 20 itemów diagnostic-eligible.                                                              |
| Figma authority | Current connector session `ksxw21cw` zweryfikował file/page/library oraz Practice Hub `55:993`, Practice Setup `55:2172`, Practice preparing `68:549`, Practice Question Shell `68:569` / `68:603` / `68:637` / `68:719` / `68:844`, Home `55:445`, Progress `842:9563` / `842:10949`, Activity `842:11192` / `842:11410` / `842:11466`, Select Track `42:422` / `42:478` / `42:539` / `42:604` / `42:642` i shared Button `141:817`; design context i screenshoty są dostępne.                                                                                                                                                                                                                        | [DES-005 reconciliation](reports/launch-des-05-figma-parity-reconciliation-2026-08-23.md). Dostęp do connectora nie jest owner approval ani full parity; physical-device evidence jest opcjonalne i nie blokuje launchu.                                                              |
| Maestro         | Historyczne capture'y z SHA `19b6601` zostały wykonane na iOS 18.6 simulator; Debug visual-shell przeszedł 6/6 Dark i 6/6 Light, a embedded Release-compatible flow również 6/6 Dark i 6/6 Light. Current code SHA `992d5bb` nie ma świeżego capture'u. Read-only discovery znalazł sparowany iPhone 11, ale jest zablokowany (`kAMDMobileImageMounterDeviceLocked`), więc DDI services są niedostępne; Android nie ma urządzenia. | Historyczne capture'y mają Expo overlay; simulator nie jest signed distribution, a Figma, store/provider i owner approval nadal brak. Fizyczne urządzenie nie jest wymagane do tego launchu. [QA-02 report](reports/launch-qa-02-current-head-ios-simulator-2026-08-21.md) |

### Confirmed facts vs assumptions

**Potwierdzone:** wszystkie osiem tracków ma lokalny package/runtime path, Free package i deterministyczne artefakty release; Design Interview obsługuje choice, ordering i decision matrix. Żaden track nie ma publishing/runtime admission. Brak IAP/RevenueCat oraz realnego provider deployment. Figma authority/parity i owner approval pozostają zewnętrznymi bramami.

**Niepotwierdzone:** konto EAS/Apple/Play/RevenueCat/Firebase, domena/public deletion URL, Product Owner approval dla pełnego launch scope Figma, pełne parity states, signing/store approvals. Physical-device tests są opcjonalne i nie są warunkiem launchu. Właściciel osobiście potwierdził w aktywnej rozmowie 2026-08-20 zatwierdzenie dokładnych ośmiu manifestów contentu z source SHA e73c731; nie potwierdza to jednak nowych lub zmienionych future release manifests.

## 3. Status

| Obszar                                           | Status   | Stan / warunek przejścia                                                                                                                                                                                                                      |
| ------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract, Coding/Certification kernel, static CI | done     | Zachować jako regression sentinels.                                                                                                                                                                                                           |
| AWS source audit                                 | partial  | Audyt ukończony; realny contract/release/package nie istnieje.                                                                                                                                                                                |
| Eight launch tracks / local runtime              | partial  | Current lock, package resolver, family runtimes and local proofs exist for all eight; zero publishing/runtime admission.                                                                                                                      |
| Human content sign-off                           | done     | Owner manifest rozdziela human owner decision od agent-prepared records; local content suite 143/143 green, exact-SHA CI dla zmiany nadal pending.                                                                                            |
| Eight-track catalogue                            | partial  | Catalogue and lock have exactly eight tracks; every node is visible with the first Free node selectable and the rest explicitly locked. Admission remains open.                                                                               |
| Identity/sync/adoption/deletion                  | partial  | Server foundations and boundary tests exist; app client/provider vertical, deployment, signed-build and exact-SHA end-to-end proof remain open. [DATA-01/02 reconciliation](reports/launch-data-01-02-client-provider-boundary-2026-08-21.md) |
| Premium/delivery                                 | blocking | Brak StoreKit/Play, RevenueCat, backend entitlement i remote package delivery.                                                                                                                                                                |
| Company-grade UI                                 | partial  | Źródłowe slice'y Home, Practice, Progress, Activity, Settings i session/review istnieją, a current connector evidence obejmuje kolejne Practice nodes; brak jednego owner-bound scope, pełnego current-SHA pixel matrix oraz rozstrzygnięcia sprzecznych Figma/product-contract stanów. [DES-005 reconciliation](reports/launch-des-05-figma-parity-reconciliation-2026-08-23.md) |
| Ops/security/privacy                             | blocking | Kontrakt istnieje; provider, consent, retention, deployment/restore evidence nie.                                                                                                                                                             |
| Signing/store                                    | blocking | Boundary istnieje, signed candidates i store records nie. Testy fizycznego urządzenia nie są wymagane przez aktualny zakres launchu.                                                                                                          |

## 4. Gaps, sprzeczności i przestarzałe twierdzenia

1. Stary plan nazywał agent records human review verified, lecz schema/generator hard-code’uje codex/owner_authorized_agent. Właściciel osobiście potwierdził w aktywnej rozmowie 2026-08-20 zatwierdzenie dokładnych manifestów z 2026-08-17 / e73c731. Należy utrwalić to jako owner decision, ale nie relabelować istniejących agent records ani nie używać ich dla nowych source/release manifests.
2. Liczba 622 w starym handoffie jest nieaktualna: aktualne exact CI ma 624. Recovery check (618 cases) jest inną miarą.
3. Readiness ustawia humanReview approved mechanicznie, więc release gate zaniża prawdziwy risk.
4. Bieżący connector session wskazany przez właściciela to `ksxw21cw`; `76kzylrb` i `eon17bsz` są wcześniejszymi zapisami. Jedyna znaleziona explicit Product Owner approval dla scoped PKG-04A pozostaje związana z `wtk4hp8i` / board root `10:2`. Nadal brakuje owner-bound map dla bieżącego launch scope i external parity evidence dla bieżącego SHA; nie kopiować historycznych metryk ani traktować lokalnego screenshotu jako approval. Physical-device evidence jest opcjonalne.
5. GCP/AZ pins są historyczne względem current authoring. Dopuszczalny jest wyłącznie nowy immutable release, nigdy relabel.
6. Content readiness obejmuje source, validator, package i technical evidence dla ośmiu tracków; to nadal nie jest publishing admission, dopóki nie ma aktualnego human review i package admission dla każdego tracku.
7. Sześć obowiązkowych evidence/release JSON nie istnieje. Nie tworzyć pustych deklaracji; rekord powstaje tylko po realnym provider/store/signing action. `physical-device-matrix` może istnieć jako opcjonalny rekord, ale jego brak nie blokuje launchu.
8. Zewnętrzne bramy obejmują in-app i web account deletion, Data Safety/App Privacy, prawdziwe subscription records/testy oraz provider/trademark review. Android API 36 jest aktualny, ale nie zastępuje signed builda i Play proof.
9. Release lock jest teraz sprawdzany fail-closed po schema, wymaganych identyfikatorach, immutable SHA i exact release IDs dla wszystkich ośmiu tracków.
10. Gate wymaga teraz także clean application checkout; lokalne zmiany nie mogą być przedstawione jako exact-SHA release input.
11. Zwykłe QA nie uruchamiało enforced launch gate. Dodano osobny ręczny workflow `.github/workflows/launch-readiness.yml`, aby rozdzielić regresję od admission; workflow wymaga teraz jawnych `application_commit` i `content_commit`, waliduje oba checkouty, uruchamia content suite/authoring/AWS validators i zapisuje report po exact application SHA. Wynik exact-SHA tego workflow pozostaje pending do push/run; GitHub API jest obecnie dostępne read-only, ale workflow pozostaje lokalny i nie istnieje jeszcze zdalnie ([GOV-09](reports/launch-gov-09-current-ci-access-boundary-2026-08-21.md)).
12. External evidence ma teraz canonical v2 envelope bound to application HEAD i self-integral hash; to chroni integralność rekordu, ale nie zastępuje realnej autoryzacji, provider/store/Figma proof ani Product Owner GO. Physical-device evidence jest jawnie opcjonalne.
13. Live Figma node `55:993` nie może być kopiowany semantycznie bez reconciliacji: pokazuje `Independent Practice`, którego nie ma w zatwierdzonym Free profile, oraz nie pokazuje canonical `Custom Practice` row. [DES-005 reconciliation](reports/launch-des-05-figma-parity-reconciliation-2026-08-23.md) wiąże bezpieczne zmiany do geometrii z zachowaniem product truth.
14. Live Figma node `55:2172` pokazuje `Focus areas` i `Save settings`, ale obecny canonical Custom Practice ma explicit mental-unit, feedback timing i `Start session`; brak modelu focus-area/save. Nie dodawać tych stanów jako metadata ani fake implementation.
15. Istnieje kontraktowa sprzeczność: bieżący `canonical-product-contract.yaml` i runtime obsługują Custom `[10,20,40]`, natomiast `PO-059`, `PO-060` i PKG-04A opisują Free Custom jako dokładnie `10`. Przed zmianą semantics potrzebna jest jawna decyzja właściciela.
16. `bc09d63` zamknął bezpieczną geometrię Practice Hub, `65aeccd` zamknął bezpieczną geometrię Practice Setup, `256717e` domknął source-level geometrię Practice Summary względem `750:6235`, `cc7cdf5` dopasował kolejną bezpieczną warstwę Progress względem `842:9563`, `ee7dde1` dopasował metadata i separatory zagnieżdżonej Activity względem `842:11192`, `36ce521` dopasował source-level geometrię Home review-due względem `55:632` — nagłówek decyzji, rytm overview, mini-progress i hierarchię akcji, a `28ec843` dopasował Notification względem `92:865`, `92:889` i `92:914` — permission-card density oraz reminder-editor sheet rhythm. Te slice'y nie zmieniają trybów, route'ów, komend ani danych; w podsumowaniu usunięto wyłącznie nadmiarową prezentację `missed/points`, której nie ma w Figma, a w Progress/Activity nie dodano brakujących celów, effectiveness ani paginacji. Następny task semantyczny to owner-bound `DES-005-C`; dopiero po tej decyzji można zmieniać semantic contract Custom Practice.
17. `3ed145a` dopasował bezpieczną geometrię Coding Interview Simulation do live Figma `74:539`, `74:726`, `74:834` i shared Answer Option `248:2394`: progress track używa `surface/input`, navigator ma elevated 56 px cells oraz 12/16 labels bez ukrytej redukcji frozen opacity, a wspólny letter badge ma 12/16 semibold. Zmiana nie narusza semantyki sesji, footer ownership ani persistence. Focused 25/25 i pełny `qa:static` 559/559 przeszły; runtime pixel comparison pozostaje otwarte z powodu blokady capture tooling.
18. `a3e2937` domknął operation-footer geometry Simulation względem live Figma `74:834`, `74:879`, `74:968` i `74:992`: recoverable notices są teraz w istniejącym `SessionShell` footer przed canonicalnymi CTA, a wspólny action sheet ma 22/28 semibold heading i radius 14. Nie zmieniono lifecycle, command semantics ani persistence; usunięto wyłącznie starą notice placement z scrollowanej treści. Focused 28/28 i pełny `qa:static` 559/559 przeszły; runtime pixel evidence pozostaje otwarte.
19. `acd2201` domknął bezpieczną geometrię Settings względem live Figma `822:7687`: istniejące `SettingsGroup`/`ListRow`/`IconTile` zachowują canonicalne wiersze, a footer identity używa 13 px semibold / 11 px regular, gap 2 i jednego page-owned odstępu. Shared supporting text używa line-height 15.4. Nie dodano Figma-only account/sync/plan/cadence/help commands ani nie zmieniono route'ów, danych lub persistence. Focused Settings/Notification 10/10 i pełny `qa:static` 561/561 przeszły; runtime pixel evidence pozostaje otwarte.
20. `4314107` domknął radius live Figma `Operation Notice` (`68:1074`, `258:2847`) w obu istniejących ownerach Practice i Simulation: warning recovery surfaces używają 12 px zamiast 8 px. Nie zmieniono notice placement, retry/recovery commands, lifecycle ani persistence; focused Practice/Simulation 26/26 i pełny `qa:static` 561/561 przeszły. Runtime pixel evidence pozostaje otwarte.
21. Live Figma `842:11057` definiuje read-only ekran `Track Evidence`, ale żaden istniejący route nie jest jego ownerem. `TopicRoadmapScreen` i `ROUTES.TOPIC_ROADMAP` są osiągalne, lecz mają inną semantykę: wybór tematu do Practice, stany locked/current/selected i powrót do Practice Hub. Nie podmieniać tej ścieżki ani nie dodawać nowej wyłącznie na podstawie Figma; potrzebna jest jawna decyzja właściciela produktu o route graph, drill-downie i modelu evidence.
22. Live Figma `42:422`, `42:478` i `42:539` definiuje geometrię onboardingowego, powracającego i zmienionego wyboru tracku; `42:604` i `42:642` są osobnymi stanami błędów rejestracji, których obecny route graph nie potrafi osiągnąć. Commits `1c8a8cc` i `364a832` dopasowały bezpieczne stany selekcji, footer oraz dark ambient/topo layer, ale zachowały wszystkie osiem canonicalnych tracków, podczas gdy referencja pokazuje Coding/GCP, i nie dodały nieosiągalnych dialogów. To pozostaje `PARTIAL` z jawnym `CANONICAL_CONFLICT`/route gap, nie pełny `MATCHED`.
23. Live Figma `68:549` definiuje stan przygotowywania Practice z async-state card, statusem `LOADING`, tytułem/opisem i dolnym `Leave practice`. Commit `0a7e8c3` dopasował bezpieczną strukturę wizualną i copy w istniejącym ownerze `PreparingNotice`, usuwając starą, duplikującą się gałąź stylów. Dolny command pozostaje niezaimplementowany, bo przygotowywanie nie ma obecnie bezpiecznego ownera lifecycle/command; nie dodawać no-op ani nowego route state. To pozostaje `PARTIAL`, a nie `MATCHED`.
24. Live Figma `68:569` i `68:603` definiuje Practice Question Shell z akcjami przy dolnej krawędzi w stopce wysokości 228 px. Commit `86e32d9` dodał owner-bound `session` footer variant tylko do Practice, bez zmiany Simulation. Commit `7e9b200` dopasował centralną macierz pressed/disabled shared Button `141:817` bez lokalnych kolorów; fresh runtime pixel evidence nadal pozostaje otwarte.
25. Live Figma `68:637` (immediate feedback), `68:719` (details expanded) i `68:844` (final item) pokazuje feedback przez stan odpowiedzi, reason card i disclosure/details, bez osobnego widocznego napisu `Correct`/`Incorrect`/`Partial`. Commit `0341424` usunął redundantny result label, helper i nieużywaną translację; selector audytowy pozostał na widocznym reason panel. Geometria expanded details, pełne final-state porównanie i fresh runtime pixel evidence pozostają partial/blocking.
26. Figma `68:719` definiuje etykietę `REASON` jako 12/16 semibold oraz treść rich Details jako 13/20. Commit `536b19b` dopasował te wartości w istniejącym Practice feedback ownerze i współdzielonym rendererze dokumentu; nie zmieniono schematu bloków, copy, scoring ani Review semantics. Fresh runtime pixel evidence nadal pozostaje blocking.
27. Live Figma shared Button `141:817` definiuje osobne stany Default/Pressed/Disabled dla Primary, Secondary, Destructive i Ghost. Commit `7e9b200` mapuje tę macierz do centralnego `Button` z istniejącymi tokenami Light/Dark: warianty disabled mają osobne surface/border/label, Destructive pressed zachowuje canonical danger surface, a Ghost disabled zachowuje transparentną powierzchnię i 55% opacity label. `loading` dziedziczy Disabled jawnie przez istniejący `isDisabled`; nie zmieniono geometrii, komend, lifecycle ani persistence. Focused checks 31/31 i pełny `npm run qa:static` 564/564 przeszły; runtime pixel evidence i owner approval nadal są otwarte.
28. Live Figma `140:875` / `483:5328` oraz Light/Dark stress instances `830:7805` / `830:9045` definiują górny separator Bottom Navigation jako `surface/overlay` `#F1F5F9`, przy zachowaniu istniejącej geometrii 20×2 active indicator, 60/66 px item heights, 24 px icons, 4 px gap i 11/15.4 labels. Commit `e257af4` dopasował wyłącznie dark `navigation.border` do tego centralnego tokenu; light token już był zgodny. Nie zmieniono route'ów, tab labels, callbacks, accessibility ani safe-area handling. Focused checks 29/29 i pełny `npm run qa:static` 565/565 przeszły; runtime pixel evidence nadal pozostaje otwarte.
29. Live Figma Screen Header `140:881` definiuje wspólny odstęp kontenera `16 px` (`space/16`), odstęp wiersza back/context `8 px` (`space/8`) oraz muted description. Commit `2eb6c65` dopasował bazowy `ScreenHeader` do tych wartości i dodał sentinele źródłowe; istniejące Activity oraz Practice Setup zachowują jawne warianty owner-specific, ponieważ mają odrębne rytmy i kolory opisu w swoich referencjach. Nie zmieniono route'ów, komend, lifecycle, persistence ani accessibility. Focused checks 34/34 i pełny `npm run qa:static` 565/565 przeszły; runtime pixel evidence nadal pozostaje otwarte.
30. Live Figma Practice Hub row `232:1716` definiuje neutralny `surface/elevated` dla kafelka `32×32`, ikonę `24×24` i trailing slot `20 px`. Commit `6f8b0c6` dopasował te detale wyłącznie dla Coding Practice Hub: istniejący `settings` tone mapuje do neutralnego elevated surface, a inne rodziny zachowują własne tony ikon. Nie zmieniono nazw czterech canonicalnych trybów, route'ów, komend, lifecycle, persistence ani accessibility. Focused checks 34/34 i pełny `npm run qa:static` 565/565 przeszły; runtime pixel evidence nadal pozostaje otwarte.
31. Live Figma `Pattern / Screen Shell · Dark` `830:7457` definiuje `space/20` pomiędzy elementami scrollowanej treści. Commit `992d5bb` dopasował domyślny `Screen.content.gap` z `spacing.lg` do `spacing.xl`; istniejące compact oraz route-owned gap overrides pozostały bez zmian. Nie zmieniono paddingów, footerów, route'ów, komend, lifecycle, persistence ani accessibility. Focused shell checks 25/25 i pełny `npm run qa:static` 565/565 przeszły; runtime pixel evidence nadal pozostaje otwarte.

## 5. Architektura, retencja i lane’y

| Subsystem                             | Decyzja                                | Obowiązek                                                                                                                                   |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract, tests, Coding/Certification | KEEP / VERIFY                          | Rozszerzać przez generic contracts, utrzymać regression suite.                                                                              |
| Eight-track descriptors               | KEEP, nie eksponować                   | Nie są production registry ani permission.                                                                                                  |
| Design Interview                      | KEEP / VERIFY                          | Family interaction/package contract, runtime, rich scoring i recovery są lokalnie zaimplementowane; external admissions pozostają wymagane. |
| Current content lock/releases         | KEEP FROZEN                            | Cross-repo byte inputs; końcowy lock będzie nowy i atomiczny.                                                                               |
| Agent content approvals               | REWRITE                                | Real signer workflow; nie relabelować istniejących records.                                                                                 |
| Auth/server foundations               | KEEP / REWRITE vertical                | Domknąć one client–server lifecycle; wykryte stale/silent paths usuwać.                                                                     |
| Commerce/package delivery             | ADD                                    | Store → RevenueCat → backend → bounded device cache.                                                                                        |
| UI/brand                              | KEEP / REWRITE by approved vertical    | QA-A jest bazą, nie dowodem pełnego UI.                                                                                                     |
| Artifacts                             | KEEP minimal / DELETE proven duplicate | Usunięto 11 nieśledzonych, bezreferencyjnych Maestro dirs (~65 MB); immutable releases/provenance i cytowane QA-A zachować.                 |

    GOV-01 approval integrity ─┬─ CNT-01 AWS contract ────────────────┐
                               ├─ CNT-02 recut Coding/GCP/AI/AZ ──────┼─ CNT-04 release/sign-off ─┐
                               └─ RUN-01 Design contract ─ CNT-03 ────┘                            │
    DATA-01 identity ─ DATA-02 sync/deletion ─ COM-01 delivery ────────────────────────────────────┼─ CAT-01 eight-track lock
    DES-01 Figma scope ─ DES-02 system ─ DES-03/04 UI ─ QA-02 visual/simulator ────────────────────┤
    OPS-01 providers/public/legal ─ REL-01 signing/store ─ REL-02 beta/review ─ REL-03 GO ─────────┘

Nonvisual GOV/CNT/DATA work może biec równolegle z DES-01. UI nie może wyprzedzić właściwego approved Figma state. External gates nie blokują bezpiecznych lokalnych tasków, tylko finalne admission/GO.

## 6. Niezależne taski

### GOV-01 — prawdziwa semantyka content approval — partial

- **Cel:** uniemożliwić uznanie agent action za human sign-off.
- **Scope / non-goals:** schema, validator, readiness, review packet i testy content; nie oceniać pytań za człowieka ani nie nadawać admission.
- **Inputs:** obecne approval JSON, exact manifests oraz osobiste potwierdzenie właściciela z aktywnej rozmowy 2026-08-20 dla manifestów e73c731.
- **Acceptance:** owner decision trwałe wiąże realną osobę, source commit, manifest, datę i zakres; agent wyłącznie przygotowuje packet; brak świeżego podpisu dla nowego manifestu daje pending.
- **Verification / evidence:** negative tests self-approval, schema validation, npm test, exact CI; raport patternly-content/docs/reports/launch-gov-01-content-approval-integrity-YYYY-MM-DD.md.
- **Ryzyko / stop:** utrata traceability albo użycie starego potwierdzenia dla zmienionego source; nie retroaktywnie zmieniać historycznych agent records.
- **Stan 2026-08-21:** schema, validator, readiness, review packets, owner manifest i negative tests są zaimplementowane lokalnie; exact-SHA CI i canonical push pozostają do wykonania po autoryzacji external mutation.

### GOV-02 — higiena dokumentów i artefaktów — partial

- **Cel:** jeden aktywny plan i minimalne, cytowalne evidence.
- **Scope / non-goals:** docs/reports/artifacts references; nie usuwać immutable releases, locks, provenance, fixtures ani QA-A bez complete dependency scan.
- **Inputs:** git ls-files, inbound-reference scan, Git history; wykonane usunięcie 11 zero-reference ignored dirs.
- **Acceptance:** usuwany target ma exact path, zero inbound refs i zero runtime/test dependency; aktualne/cytowane evidence zostaje.
- **Verification / evidence:** rg inbound scan, relevant tests, git diff --check; raport docs/reports/launch-gov-02-evidence-retention-YYYY-MM-DD.md.
- **Ryzyko:** utrata audit/byte evidence; przy niepewności zachować.
- **Recheck 2026-08-21:** [evidence-retention recheck](reports/launch-gov-02-evidence-retention-recheck-2026-08-21.md) potwierdza brak dodatkowego udowodnionego dead path oraz koryguje dwa aktywne sformułowania, które traktowały physical smoke jako obowiązkowy. Historycznie usunięte ścieżki są nieobecne i bez live references; aktywne Maestro, current-head visual evidence, audyty, provenance i fixtures pozostają. Puste lokalne katalogi user-testing nie są śledzonym artefaktem. Testy fizycznego urządzenia nie są wymagane.

### CNT-01 — AWS publishing contract — blocking / owner decision required

- **Cel:** zamienić AWS source w walidowalny release candidate bez package substitute.
- **Scope / non-goals:** config/tracks, selector, closed Free profile, technical-evidence inputs, generator/validator; nie budować/admitować package przed upstream proof.
- **Inputs:** AWS source/registry/curriculum, app Certification modes, obecny SOURCE_COMMIT_UNAVAILABLE, [CNT-01 audit](../../patternly-content/docs/reports/launch-cnt-01-aws-contract-audit-2026-08-21.md).
- **Acceptance:** właściciel najpierw wybiera canonical content/taxonomy version oraz zatwierdza recut Free-node i diagnostic coverage; potem `validate:track` przechodzi z buildable source commit, Free node ma supported profile/selector i testy granic, a technical evidence wiąże wszystkie inputs. Nie zmieniać zatwierdzonego source ani manifestu przed tą decyzją.
- **Verification / evidence:** focused publishing tests, AWS audit, authoring validation, exact CI; raport patternly-content/docs/reports/launch-cnt-01-aws-contract-audit-YYYY-MM-DD.md.
- **Ryzyko:** skopiowanie GCP contractu, stale commit, unsupported mode.

### CNT-02 — recut Coding/GCP/AI-901/AZ-104 — planned

- **Cel:** po jednym fresh immutable release na track bez relabelu historycznych artefaktów.
- **Scope / non-goals:** source drift, provenance, technical evidence, full artifact, Free package; nie zmieniać app lock/runtime admission.
- **Inputs:** current sources oraz core-0018/AI901-0001/AZ104-0002/app lock.
- **Current preflight:** [CNT-02 publishing input preflight](../../patternly-content/docs/reports/launch-cnt-02-publishing-input-preflight-2026-08-21.md) confirms Coding and AZ-104 validation against existing technical inputs, while GCP still lacks a current canonical runtime/authoring contract. The historical GCP configuration was removed during the corrective curriculum recut and is incompatible with the current node, item IDs, and mode eligibility; it must not be restored or relabeled.
- **Acceptance:** exact source, new release ID/checksum, technical evidence i Free package per track; historyczny GCP/AZ pin nie jest presented as current.
- **Verification / evidence:** per-track validate/rebuild/checksum/content CI; cztery raporty launch-cnt-02-<track>-YYYY-MM-DD.md.
- **Ryzyko:** mutation package, app/content drift, full release udający Free proof.

### RUN-01 + CNT-03 — Design family runtime i Backend/OOD/Frontend — local implementation done / admission open

- **Cel:** jeden canonical Design runtime dla choice/ordering/decision matrix, następnie trzy independent releases.
- **Scope / non-goals:** schema, scoring, persistence, package validation, Backend representative proof, potem OOD/Frontend; nie używać choice-only fallback ani nie eksponować tracku przed admission.
- **Inputs:** trzy banks; Frontend ma 1 018 ordering i 147 decision-matrix; canonical session contract.
- **Current state:** the app has one canonical `design_interview` runtime for choice, ordering and decision-matrix interactions, with immutable package identity, scoring, persistence and recovery tests. Content and external admission still must prove the exact current artifacts; historical source-gap findings are not current approval.
- **Acceptance:** durable scoring/recovery/a11y dla każdego typu; każdy track ma full immutable release, Free package, technical evidence i real sign-off finalnego manifestu.
- **Verification / evidence:** unit/property/negative tests, cold relaunch, package checks, Maestro po Figma approval, exact CI; raporty launch-run-01-_ i launch-cnt-03-<track>-_.
- **Ryzyko:** abstraction ukrywająca różnicę scoringu; proxy interaction.

### CAT-01 — atomiczny osiem-trackowy admission/lock — local lock done / external admission open

- **Cel:** po kompletnym łańcuchu aktywować dokładnie osiem tracków.
- **Scope / non-goals:** generic resolver/catalogue/admission assertions i jeden fresh lock; lock ma już dokładnie osiem IDs, bez rozszerzania scope.
- **Inputs:** admitted full release + Free package + real sign-off dla każdego tracku i runtime proofs rodzin.
- **Acceptance:** lock ma dokładnie osiem IDs, byte-matches producer artifacts, app renderuje wyłącznie admitted tracks, failure explicit.
- **Verification / evidence:** cross-repo checksum, offline/cache/session-pin/eviction, launch:readiness --enforce, exact CI obu repo; raport launch-cat-01-eight-track-cutover-YYYY-MM-DD.md.
- **Ryzyko:** early lock expansion, stale package, partial catalogue/family leakage.

### DATA-01 — identity/provider-neutral lifecycle — partial; client/provider vertical open

- **Cel:** complete account lifecycle: email/password, Apple, Google, recovery codes, App Check i explicit outcomes.
- **Scope / non-goals:** app/server contract, environment schema, protected API, reauth/revocation; bez provider mutation/secrets.
- **Inputs:** canonical account contract i existing Firebase/server foundations.
- **Acceptance:** no anonymous/email merge/fake success; unconfigured fail-closed; every lifecycle transition ma explicit valid/duplicate/expired/offline/rate-limit/revoked/remote state.
- **Verification / evidence:** server-side auth/deletion/adoption boundary tests and local contract checks exist; app client integration, provider lifecycle, sensitive storage/log scan, signed builds and exact-SHA end-to-end CI remain open. [Current boundary reconciliation](reports/launch-data-01-02-client-provider-boundary-2026-08-21.md); final report launch-data-01-identity-vertical-YYYY-MM-DD.md.
- **Ryzyko:** token persistence, enumeration, retained account-wide session assumptions.
- **Stan 2026-08-21:** server tombstone/authentication/HTTP foundations are partially evidenced by [DATA-01 tombstone](reports/launch-data-001-lifecycle-tombstone-2026-08-20.md); the app has no account route or composed remote adapter. Do not copy the historical account design or add a provider fallback.

### DATA-02 — sync, adoption i deletion — partial; app orchestration open

- **Cel:** one local-first/outbox/account-dataset lifecycle z deterministic adoption i deletion proof.
- **Scope / non-goals:** journal/outbox/CAS/conflict/sign-out/tombstone/public possession link; nie obiecywać provider deletion przed execution.
- **Inputs:** DATA-01, device-only active-session rule, commercial deletion semantics.
- **Acceptance:** preview+confirm, no silent merge, device session never syncs; deletion wymaga reauth, verifies local+remote removal i exposes failure.
- **Verification / evidence:** server-side account dataset, adoption, device-only-field rejection and deletion tests exist; app outbox/adoption orchestration, provider drill, approved Figma states and signed builds remain open. Physical-device testing is optional. [Current boundary reconciliation](reports/launch-data-01-02-client-provider-boundary-2026-08-21.md); final report launch-data-02-sync-adoption-deletion-YYYY-MM-DD.md.
- **Ryzyko:** data loss/resurrection/subscription conflation.
- **Stan 2026-08-21:** [DATA-02 device-session boundary](reports/launch-data-002-device-session-remote-boundary-2026-08-20.md) is a completed hardening slice, not full mobile sync/adoption. DATA-02 depends on the DATA-01 client boundary and current approved Figma states.

### COM-01 — entitlement, purchase, restore i delivery — planned

- **Cel:** jeden monthly i annual Premium dla verified accountu, backend-authorized package delivery.
- **Scope / non-goals:** StoreKit/Play adapter, RevenueCat normalization, backend projection, 7-day bounded cache, restore/conflict/downgrade/signed URL; bez tworzenia store products/RevenueCat records lokalnie.
- **Inputs:** DATA-01/02, CAT-01 packages, commercial contract.
- **Acceptance:** guest nie kupuje/pobiera; authority = store → RevenueCat → backend → cache; explicit restore conflict; no per-question Firestore fetch; deletion nie udaje refund/cancel.
- **Verification / evidence:** adapter tests, provider integration po autoryzacji, cache/offline i signed sandbox purchase/restore evidence; raport launch-com-01-commercial-vertical-YYYY-MM-DD.md.
- **Ryzyko:** entitlement bypass, cross-account restore, stale cache, policy breach.

### DES-01 — live Figma authority i firmowy UX scope — partial

- **Cel:** per-vertical owner-approved Figma states zanim UI będzie przepisywane.
- **Scope / non-goals:** live nodes, owner approval, terminology/route/accessibility/motion mapping; agent nie projektuje ani nie self-approves.
- **Inputs:** file kZXD7cNBKUU7x0ceTHPFpR, current connector session `ksxw21cw`, existing refs, canonical Today/Practice/Progress/Settings/account/commercial rules, and scoped Product Owner approval `wtk4hp8i` only where explicitly recorded.
- **Acceptance:** UI slice ma node, owner, states, Light/Dark/large text/reduced motion i route mapping; stale references są retired/reconciled explicitly.
- **Verification / evidence:** live connector context/screenshot, owner sign-off, contract change-gate mapping; raport launch-des-01-current-figma-authority-YYYY-MM-DD.md.
- **Ryzyko:** generic UI lub stale Figma terminology.

### DES-02/03/04 — design system i wszystkie produktowe verticals — partial

- **Cel:** repo-owned tokens/primitives i approved UI dla guest/free core, runner/summary/progress/settings oraz account/premium/deletion/legal/support.
- **Scope / non-goals:** dev-only Storybook, assets/licensing, navigation, a11y/motion/haptics; tylko states zaimplementowane przez DATA/COM, bez fake CTAs/routes.
- **Inputs:** DES-01, CAT-01, DATA/COM.
- **Acceptance:** no internal family IDs/old aliases/fake metrics; 200% text, Dark/Light/System, screen reader/reduced motion; superseded component/path jest usunięty albo uzasadniony.
- **Verification / evidence:** component/state tests, production bundle exclusion, Maestro absolute output paths, visual diff node→screen/state; trzy raporty launch-des-02/03/04-\*.
- **Ryzyko:** polish over logic, old two-track branches, inaccessible controls.

### OPS-01 — provider, security i operations — planned / external gate

- **Cel:** minimum-privilege sandbox→production operation z public surfaces, consent, retention i restore.
- **Scope / non-goals:** Firebase/App Check/Auth/Firestore, Cloud Run digest deploy/IAM, domain/sender, PITR drill, Analytics/Crashlytics/reporting; bez mutation bez owner packet.
- **Inputs:** DATA/COM code, ops/privacy contract, authorized provider access.
- **Acceptance:** provider readback udowadnia app IDs, deployed revision, IAM, HTTPS origins, backup/restore/rollback; no key in repo; analytics/crash fail-closed until consent.
- **Verification / evidence:** provider API/CLI readback, health/API, IAM diff, restore drill, sanitized logs; raport launch-ops-01-provider-operations-YYYY-MM-DD.md.
- **Ryzyko:** overgrant/cost/secret leak/deleted-account resurrection.

### QA-01 — logic/security regression matrix — planned

- **Cel:** przetestować wszystkie canonical paths i failures, nie tylko happy path.
- **Scope / non-goals:** eight tracks/modes, package integrity, identity/data/commercial, offline/concurrency/abuse, MASVS storage/crypto/auth/network/platform/code/privacy; mock nie jest provider/device proof.
- **Inputs:** CAT/DATA/COM/DES code, current test suite i contract.
- **Acceptance:** matrix obejmuje guest/Free/Premium, every mode, active/relaunch/abandon/finalize/review, auth/recovery/reauth, adoption/conflict/sync, restore/downgrade/deletion/consent/report, corruption/eviction/offline/retry.
- **Verification / evidence:** CI-permitted qa:static, exact CI obu repo, real eight-track release CI; raport launch-qa-01-contract-security-matrix-YYYY-MM-DD.md.
- **Ryzyko:** green mocks, tests chroniące starą semantykę.

### QA-02 — Maestro, parity, a11y i performance; physical devices optional — partial

- **Cel:** dowieść finalnych signed candidates na iOS i Androidzie; fizyczne urządzenia nie są warunkiem akceptacji tego launchu.
- **Scope / non-goals:** simulators+phones, Dark/Light/System, 200% text, keyboard, screen reader, reduced motion, network/install/upgrade/restore; rozdzielać screenshot/parity/device/store evidence.
- **Inputs:** owner-bound approved nodes, current source SHA, signed builds when available, defined device/OS matrix, and [DES-005 reconciliation](reports/launch-des-05-figma-parity-reconciliation-2026-08-23.md).
- **Acceptance:** absolute outputs/manifests; node→screen/state review; simulator/release-compatible journey bez dev menu; performance/layout budgets mają measured result. Physical-device capture może zostać wykonany opcjonalnie, ale nie może blokować gate’a.
- **Verification / evidence:** previous current-head iOS simulator evidence obejmuje Debug Dark/Light oraz embedded Release-compatible Dark/Light, po 6/6 checkpointów; later source slices have focused tests and selected historical captures, but current Activity/Practice-route capture is blocked because `maestro` is unavailable and CoreSimulatorService refused the connection. Discovery previously confirmed paired physical iPhone 11, lecz blokada urządzenia (`kAMDMobileImageMounterDeviceLocked`) uniemożliwia DDI/build inspection, a Android nie jest podłączony. Signed distribution, screenshot/video/hierarchy acceptance i Figma parity nadal wymagają wykonania; physical iOS/Android pozostają opcjonalne; [raport QA-02](reports/launch-qa-02-current-head-ios-simulator-2026-08-21.md) oraz [DES-005 reconciliation](reports/launch-des-05-figma-parity-reconciliation-2026-08-23.md).
- **Ryzyko:** simulator-only confidence, visual match with wrong logic, missing a11y state.

### REL-01/02/03 — store packet, signed beta, review i GO/NO-GO — planned / external gate

- **Cel:** realne legal/privacy/store/signing inputs, signed TestFlight/Play candidates, beta/review oraz końcowa decyzja.
- **Scope / non-goals:** App Store Connect/Play, App Privacy/Data Safety, privacy/terms/support/deletion URLs, IAP metadata, provider/trademark review, EAS signing, TestFlight/internal→closed test; bez publikacji/mutacji bez osobnej autoryzacji.
- **Inputs:** OPS, COM, QA, final assets/copy, legal owner, authorized credentials.
- **Acceptance:** declarations odpowiadają realnym flows; deletion web resource działa; subscription terms/restore/management są poprawne; no implied provider affiliation; exact-SHA archive provenance; qualifying personal Play account ma 12 opted-in testers przez 14 dni; GO tylko przy zero blockers i explicit owner approval.
- **Verification / evidence:** store exports/readback, URL probes, legal/IP approval, EAS/build IDs/checksum, tester/review evidence, independent launch:readiness --enforce; raporty launch-rel-01/02/03-\*.
- **Ryzyko:** policy rejection, inaccurate privacy, signing leak, stale evidence.

## 7. Pierwsze kolejne zadanie

`DES-005-A` jest wykonane w `bc09d63`: geometria Practice Hub odpowiada
bezpiecznym faktom z live node `55:993`, a zatwierdzony PKG-04A mode truth
pozostaje bez zmian. Nie dodano Independent, Focus areas ani `Save settings`.

Bieżąca rewalidacja source slice `7a93ad4` przez kanał `ksxw21cw` potwierdziła
ten slice bez dodatkowego source diffu: Practice Hub jest zgodny z bezpieczną
geometrią Figma na poziomie source, a konflikt taxonomy pozostaje jawnie
canonicalny. Runtime pixel evidence nadal nie jest dostępne.

Commit `d4d0cfc` wykonał dodatkowy dead-code check: usunięto nieużywane
`DomainAccent` i `MetricCard` wraz z barrel exports oraz nieosiągalną gałąź
Practice Hub dla wykluczonych trybów scope. Usunięto też nieużywane parametry
`Exam.questionIndex` i symulacyjnego summary `completionKind`; summary nadal
czyta wyłącznie zweryfikowany durable result. Nie zmieniono żadnej komendy,
taksonomii ani reachable wizualnego stanu.

Commit `7a93ad4` skonsolidował identyczną wewnętrzną prezentację review
unavailable w repo-owned `ReviewUnavailableSurface`. Answer Review i
Simulation Review zachowują własne pozycjonowanie/shell oraz teksty stanu;
usunięto wyłącznie zduplikowaną geometrię ikony, tytułu i opisu.

Commit `d1483e9` skonsolidował powtarzalny przełącznik `Details` z Practice
Feedback i Answer Review/Simulation Review w repo-owned `DetailsDisclosure`.
Wspólny komponent posiada jedną geometrię Figma (minHeight 48, surface/border,
spacing, typografia, chevron) oraz wspólny kontrakt accessibility; lokalne
sekcje nadal zachowują własne separatory, padding i układ treści. Nie zmieniono
semantyki feedbacku, durable state ani selectorów runtime. Focused checks
przeszły 27/27, a pełny `npm run qa:static` przeszedł przy inventory
283/113/552 i 561/561 testach. Bieżący runtime pixel proof nadal nie jest
dostępny z powodu braku Maestro i odmowy połączenia CoreSimulatorService.

Commit `176e331` domknął kolejną bezpieczną geometrię Home względem live Figma
`55:445`: Overview renderuje separatory wyłącznie między metrykami, bez linii
po ostatnim wierszu, a `View activity` pozostaje tekstowym CTA bez chevronu.
Nie zmieniono danych, akcji, selectorów ani touch targetu. Focused Home/visual/
large-text checks przeszły 15/15, a pełny `npm run qa:static` przeszedł przy
inventory 283/113/552 i 561/561 testach. Runtime pixel proof bieżącego SHA
nadal nie jest dostępny.

Commit `8d32858` dopasował copy Recent activity do live Home `55:445` i `55:539`:
Figma pokazuje completion label (`Completed today` / `Completed yesterday`),
więc Home nie ujawnia już technicznego `attempt.result.kind`. Zachowano
durable attempt, datę dla starszych wpisów, action semantics i istniejący
Activity route. Dodano jawne tłumaczenia PL oraz test helpera. Focused checks
przeszły 19/19, a pełny `npm run qa:static` przeszedł przy inventory
283/113/552 i 562/562 testach. Runtime pixel proof bieżącego SHA nadal jest
niezweryfikowany.

Commit `b58042d` dopasował bezpieczną geometrię górnej części Progress względem
live Figma `842:9563`: etykieta `This week` i weekly card są jednym blokiem z
odstępem 10 px, dzięki czemu `Current focus` wraca na pozycję wynikającą z
referencji zamiast dziedziczyć 28 px root gap pomiędzy etykietą i kartą. Nie
dodano Figma-only goal, cadence ani effectiveness metrics i nie zmieniono
modelu, akcji, route'ów ani selectorów. Focused Progress/Home checks przeszły
29/29, a pełny `npm run qa:static` przeszedł przy inventory 283/113/553 i
562/562 testach. Runtime pixel proof bieżącego SHA nadal jest niezweryfikowany.

Commit `deb7b81` dopasował jawny empty state Progress względem live Figma
`842:10949`: przy `model.hasData === false` aplikacja pokazuje ikonę, komunikat
`No learning evidence yet`, opis oraz — wyłącznie dla Algorithms, gdzie model
ma już kanoniczną akcję — `Open Practice`. Usunięto z tego stanu pusty
`Current focus`, `Needs attention`, activity i evidence dashboard; nie dodano
syntetycznych celów, effectiveness ani trendów. Dodano brakujące tłumaczenia
PL. Focused Progress/Home checks przeszły 29/29, a pełny `npm run qa:static`
przeszedł przy inventory 283/113/553 i 562/562 testach. Runtime pixel proof
bieżącego SHA nadal jest niezweryfikowany.

Commit `6dd51f6` usunął kolejne mylące mapowanie z Progress: Algorithms nie
renderuje już `itemCoveragePercent` jako dużego procentu skuteczności. Karta
focus pokazuje istniejący `statusLabel` i `practicedLabel`; procent pozostaje
tylko dla tracków, których model dostarcza rzeczywiste `performanceScores`.
Nie zmieniono modelu ani nie dodano effectiveness metric. Focused
Progress/Home checks przeszły 29/29, a pełny `npm run qa:static` przeszedł przy
inventory 283/113/553 i 562/562 testach. Runtime pixel proof bieżącego SHA
nadal jest niezweryfikowany.

Commit `15f54c1` dopasował reachable Activity empty states względem live Figma
`842:11410` i `842:11466`: lokalny renderer ma ikonę aktywności, copy, `Open
Practice`, a dla filtrowanego braku danych także `Show all activity` i ten sam
practice command jako akcję drugorzędną. Wspólny `EmptyState` nadal obsługuje
wyłącznie unavailable/error. Nie zmieniono read modelu, route graph ani
persistence. Focused Activity/visual/loading checks przeszły 30/30, a pełny
`npm run qa:static` przeszedł przy inventory 283/113/553 i 562/562 testach.
Runtime pixel proof bieżącego SHA nadal jest niezweryfikowany.

W poprzednim audycie shared Button `141:817` pozostawał `PARTIAL`, ponieważ
macierz stanów i dziedziczenie `loading` wymagały rozstrzygnięcia. Commit
`7e9b200` rozwiązuje ten source-level gap centralnie przez istniejące tokeny
Light/Dark, bez lokalnych kolorów i bez mapowania między tematami. Aktualny
stan oraz granice runtime są zapisane w addendum poniżej.

## Addendum — Select Track state and geometry convergence

Commit `1c8a8cc` revalidated the current connector channel `ksxw21cw` against
live Figma nodes `42:422` (first choice), `42:478` (returning with the current
track), and `42:539` (returning after changing the track). The repository-owned
`SelectTrackScreen` now keeps the durable active track separate from the local
selection: onboarding retains the selected-track context and `Continue`, a
returning user with no change has no footer, and a returning user who changes
selection gets the Figma-shaped `Use this track` action. The existing
`AppShellHeader` also owns the compact 36 px back-navigation variant used by
the returning state.

The source geometry now follows the verified Figma contract for title rhythm,
29/35 title typography, 14/20 supporting copy, 12 px track-list gap, 20 px
card radius, 10 px card internal rhythm, 11/15.4 supporting labels, and the
sticky-footer spacing. All eight track registrations remain rendered because
the current registry and admission tests are canonical; Figma's two-card
Coding/GCP projection is therefore an explicit scope/canonical conflict, not
a reason to hide six runtime tracks.

Commit `364a832` adds the repo-owned `AmbientBackdrop` and the downloaded
Figma topography SVG to the shared `Screen` owner. The exact dark-mode glow
positions and four contour ellipses are now reused by Select Track and
Practice Hub; light mode remains solid because the current Figma authority
does not provide a light ambient variant.

This slice is still not marked `MATCHED`: Figma nodes `42:604` and `42:642`
define unknown/unadmitted registration-failure dialogs, but the current route
has no truthful registration-state input or owner for them. The eight-track
registry projection also remains a canonical scope conflict against Figma's
two-card projection. Runtime pixel proof is still unavailable because Maestro
is absent and CoreSimulatorService refuses simulator connections. Focused
ambient/Select Track/visual-shell checks passed 15/15; `npm run qa:static`
passed with recovery inventory 284/114/555, 564/564 tests, typecheck,
content-boundary, and runtime-privacy-boundary checks.

Bezpieczna, geometryczna część `DES-005-B` jest wykonana w `65aeccd`:
Practice Setup używa canonical compact `ChoiceRow`, header/footer variants i
segmented-control geometry z `55:2172`. Nie zmieniono długości sesji,
feedback timing, komendy `Start session` ani modelu focus areas.

Pierwszy kolejny task to `DES-005-C`: właściciel musi rozstrzygnąć owner-bound
channel oraz sprzeczność Custom `10` versus `10/20/40` przed jakąkolwiek zmianą
semantyczną Practice Setup. Semantic migration w `DES-005-B` pozostaje
zablokowany do czasu tej decyzji. Exact-SHA gate, fresh runtime pixel
comparison i Product Owner GO pozostają pending.

`256717e` domyka kolejną bezpieczną część podsumowania Practice względem live
node `750:6235`: typografia nagłówka, rytm metryk, wiersze outcome, notice
review i odstęp stopki są zgodne na poziomie źródła. Usunięto dodatkową linię
`correct · missed · points` oraz nieużywany wariant warning; scoring i review
pozostają bez zmian. Runtime pixel comparison nadal wymaga działającego
capture environment.

`45016a5` domyka source-level Answer Review slice względem live Figma
`81:538` / canonical instance `801:7299`: Review Shell ma dwukolumnową
stopkę, intrinsic-width filter tabs na `surface/input`, a Certification
Answer Review używa divider/spacing/disclosure z Figma bez dodatkowej etykiety
wyniku i obramowanego panelu Reason. Mutacja `Needs Review` pozostaje
kanonicznym zachowaniem i jest jawnie oznaczona jako `CANONICAL_CONFLICT`,
ponieważ zatwierdzone stany Figma nie pokazują tego kontrolera. `npm run
qa:static` przechodzi: 559/559 testów. Wspólny `ReviewFeedbackBlock` jest
używany przez Certification Answer Review i Simulation Review; immediate
Practice feedback pozostaje na osobnym kontrakcie Figma.

`621c4bd` domyka source-level Result unavailable slice względem live Figma
`82:538` / `801:7653`: Simulation Review używa pełnego content area bez
paddingu zwykłego review, a unavailable surface ma kanoniczne zakotwiczenie
185 px i szerokość 353 px. `npm run qa:static` przechodzi: 559/559 testów.
Świeże runtime pixel evidence dla tego stanu nadal pozostaje wymagane.

`92dcdc2` domyka kolejną bezpieczną geometrię stanu Simulation Navigator
`74:726`: Notice ma promień 12 px, a odstęp między Notice i pełno-wymiarowym
`Try again` wynosi 12 px, zgodnie z live Figma. Nie zmieniono retry command,
frozen-cell state, reduced-motion ani żadnej semantyki lifecycle. Focused
checks 17/17, typecheck oraz `npm run qa:static` przechodzą przy 561/561
testach i inventory 283/113/552. Runtime pixel comparison pozostaje
zablokowane przez brak Maestro/CoreSimulatorService.

## Addendum — Practice preparing-state convergence

Commit `0a7e8c3` revalidated live Figma node `68:549` (`06A · Preparing`)
against the canonical `PracticeSessionSurface` owner. `PreparingNotice` now
reuses the existing async-state card owner used by completion: 44 px status
icon, `LOADING` label, Figma-shaped title/description hierarchy, and the
reserved lower spacer are shared rather than maintained as a second preparing
card style. The description uses the canonical item terminology.

The Figma bottom `Leave practice` action remains intentionally unresolved.
The current preparing phase has no safe lifecycle command owner and the route
does not expose a truthful command input for it; adding a no-op or an invented
transition would create a fake state. The obsolete `preparing` and
`preparingTitle` styles were deleted. Focused session/accessibility/loading/
visual-shell checks passed 43/43; `npm run typecheck` and `git diff --check`
passed, and full `npm run qa:static` passed with recovery inventory 284/114/555,
564/564 tests, typecheck, content-boundary, and runtime-privacy-boundary
checks. Runtime pixel proof remains unavailable because Maestro is absent and
CoreSimulatorService refuses simulator connections.

## Addendum — Practice Question Shell footer convergence

Commit `86e32d9` revalidated live Figma nodes `68:569` (`06B · Single choice ·
Unanswered`) and `68:603` (`06C · Single choice · Selected · Immediate feedback
mode`) against the shared `SessionShell` owner. The Practice route now uses a
dedicated `session` footer variant: 228 px minimum height, bottom-aligned
actions, and an 8 px action gap, matching the Figma action-footer geometry.
Simulation continues to use its existing layout-specific footer path.

The shared disabled Button colors remain unresolved against `141:817` and were
not copied locally; they require one design-system token decision for all
Button variants. No command, state transition, persistence, or response
semantics changed. Focused shell/session checks passed 34/34; full
`npm run qa:static` passed with recovery inventory 284/114/555, 564/564 tests,
typecheck, content-boundary, and runtime-privacy-boundary checks. Runtime
pixel proof remains unavailable because Maestro is absent and
CoreSimulatorService refuses simulator connections.

## Addendum — Practice feedback surface convergence

Commit `0341424` revalidated live Figma nodes `68:637` (`06E · Immediate
feedback · Default`), `68:719` (`REF-06A · Details expanded`) and `68:844`
(`06F · Final item`) against the canonical `PracticeFeedbackBlock` owner.
Those references expose correctness through the canonical answer-option state
and the reason/details surfaces; they do not show a separate visible result
label. The redundant result label, its formatter, and its unused translation
were removed. The runtime result selector remains attached to the visible
reason panel so existing auditability does not require a second UI element.

No scoring, feedback, navigation, persistence, or command semantics changed.
Focused feedback/accessibility/session checks passed 34/34; full
`npm run qa:static` passed with recovery inventory 284/114/555, 564/564 tests,
typecheck, content-boundary, and runtime-privacy-boundary checks. The richer
expanded-details geometry and same-head runtime pixel proof remain open;
Maestro is absent and CoreSimulatorService refuses simulator connections.

## Addendum — Practice feedback typography convergence

Commit `536b19b` revalidated the live expanded-details reference `68:719` and
applied only its safe typography facts to the existing feedback owners:
`REASON` is now 12/16 semibold, while rich feedback paragraphs, headings, list
text, and callout text use 13/20. The shared document renderer remains the
canonical content-block owner; no content schema, authored copy, scoring,
navigation, persistence, or command semantics changed.

Focused feedback/accessibility/session checks passed 32/32; full
`npm run qa:static` passed with recovery inventory 284/114/555, 564/564 tests,
typecheck, content-boundary, and runtime-privacy-boundary checks. Same-head
runtime pixel proof remains unavailable because Maestro is absent and
CoreSimulatorService refuses simulator connections.

## Addendum — Shared Button state matrix convergence

Commit `7e9b200` revalidated live Figma shared Button `141:817` in connector
channel `ksxw21cw` and applied its Default/Pressed/Disabled matrix to the
canonical `src/components/Button.tsx` owner. Primary, Secondary, Destructive,
and Ghost now use variant-specific disabled surface, border, label, and
pressed-state mappings from the existing Light/Dark semantic palette. The
runtime `loading` state explicitly inherits the same disabled mapping through
the existing `isDisabled` contract, so no second loading appearance was
introduced.

No raw color literals, route, command, lifecycle, persistence, or accessibility
contract changed. The obsolete generic disabled style was removed rather than
kept as a competing path. Focused visual/accessibility checks passed 31/31;
full `npm run qa:static` passed with recovery inventory 284/114/555 and
564/564 tests, typecheck, content-boundary, and runtime-privacy-boundary.
Same-head runtime pixel proof and Product Owner approval remain open.

## Addendum — Bottom Navigation separator convergence

Commit `e257af4` revalidated the canonical Bottom Navigation authority
`140:875` / `483:5328` and its Light/Dark stress instances `830:7805` /
`830:9045` in connector channel `ksxw21cw`. The Figma `surface/overlay`
separator resolves to `#F1F5F9` in both themes; the dark repository token had
remained `#1E293B`, while the Light token was already aligned. The canonical
`BottomTabBar` continues to own the existing four destinations, active
indicator, item heights, icon sizing, caption metrics, pressed state,
accessibility roles, and safe-area padding.

Only the central dark `navigation.border` token changed. No route, label,
callback, lifecycle, persistence, or fallback path changed. Focused shell /
accessibility checks passed 29/29; full `npm run qa:static` passed with
recovery inventory 284/114/556 and 565/565 tests, typecheck,
content-boundary, and runtime-privacy-boundary. Same-head runtime pixel proof
and Product Owner approval remain open.

## Addendum — Screen Header base geometry convergence

Commit `2eb6c65` revalidated live Figma Screen Header `140:881` in connector
channel `ksxw21cw`. The shared reference uses `space/16` between the header
container sections, `space/8` between the back control and context title, a
44 px touch target with a 36 px visible outlined icon button, and muted
description text. The canonical `ScreenHeader` now uses `spacing.lg` for the
base container, `spacing.sm` for the base context row, and `palette.textMuted`
for the base description.

Existing Activity and Practice Setup owners retain explicit local overrides
for their already-established layout rhythm and description tone. No route,
command, lifecycle, persistence, or accessibility contract changed; no second
header implementation was introduced. Focused visual-shell checks passed
34/34; full `npm run qa:static` passed with recovery inventory 284/114/556 and
565/565 tests, typecheck, content-boundary, and runtime-privacy-boundary.
Same-head runtime pixel proof and Product Owner approval remain open.

## Addendum — Practice Hub row icon convergence

Commit `6f8b0c6` revalidated the live Figma row instance `232:1716` in
connector channel `ksxw21cw`. Its canonical row geometry uses a `32×32`
icon container with `radius/8`, `surface/elevated` background, a `24×24`
leading icon, and a `20 px` trailing icon slot. The Coding Practice Hub now
passes `iconSize={24}` to its existing `IconTile`, uses the existing
`settings` tone for enabled Coding rows so the icon tile resolves to the
neutral elevated palette, and renders the existing chevron at `20 px`.

This is a route-local visual correction. Certification and Design Interview
rows keep their existing tone mapping because those variants were not proven by
this Figma node. Canonical mode titles, icons, availability, route ownership,
commands, lifecycle, persistence, and accessibility remain unchanged. Focused
checks passed 34/34; full `npm run qa:static` passed with recovery inventory
284/114/556 and 565/565 tests, typecheck, content-boundary, and
runtime-privacy-boundary. Same-head runtime pixel proof and Product Owner
approval remain open.

## Addendum — Screen Shell spacing convergence

Commit `992d5bb` revalidated Figma `Pattern / Screen Shell · Dark` `830:7457`
in connector channel `ksxw21cw`. The canonical scroll-content pattern uses
`space/20` between its content blocks. The shared `src/components/Screen.tsx`
now maps the default `content.gap` to `spacing.xl` (`20 px`), while the
compact density remains `spacing.md` and route-owned overrides remain explicit
for screens with a specialized rhythm.

No padding, footer, route, command, lifecycle, persistence, accessibility, or
semantic contract changed. Focused shell checks passed 25/25; full
`npm run qa:static` passed with recovery inventory 284/114/556 and 565/565
tests, typecheck, content-boundary, and runtime-privacy-boundary. Same-head
runtime pixel proof and Product Owner approval remain open.

## 8. Kryterium końcowe

Nie oznaczać celu jako complete, dopóki aktualne canonical SHA obu repo, exact CI, osiem-trackowy release gate, real content sign-offs, provider/store/signing evidence, approved Figma parity, Maestro/simulator evidence oraz Product Owner GO nie potwierdzają pełnego celu. Signed physical-device matrix nie jest wymagany.

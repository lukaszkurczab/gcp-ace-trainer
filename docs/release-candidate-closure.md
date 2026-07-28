# Patternly — release-candidate closure

## 1. Cel

Ten plan prowadzi do jednego z dwóch stanów: `RC_VERIFIED`, gdy oba repozytoria
mają spójny, opublikowany offline bundle, pełny kontrakt i bieżące evidence
urządzeniowe; albo `BLOCKED`, gdy pozostaje konkretny, odtwarzalny blocker.
Po `RC_VERIFIED` rozpoczynamy kolejno: entitlement domain, subskrypcje,
enforcement darmowego pierwszego node’a, limity aktywnych tracków, restore
purchases, model English/Polish i kolejny Certification track.

Ten dokument jest jedynym źródłem kolejności prac RC.

Wykonanie jest prowadzone jako ciągły loop do `RC_VERIFIED`, a nie jako
mechaniczne odhaczanie tasków. Gdy bieżące source/test/evidence wykażą, że
task nie prowadzi do celu, jego zakres, zależności albo podział są zmieniane
w tym dokumencie przed następną implementacją.

## 2. Potwierdzony baseline

| Obszar | Potwierdzony stan |
| --- | --- |
| app | `https://github.com/lukaszkurczab/gcp-ace-trainer.git`, `main`, `25d79f832760add1a37aa7e2e79b3d4b1b4c711d`; worktree czysty po implementacji RC-017 2026-07-28 |
| content | `https://github.com/lukaszkurczab/patternly-content.git`, `master`, `9c6f594f4817602123f710124b4969b373d6eaa8`; worktree czysty i `origin/master` potwierdzony po RC-012 2026-07-28 |
| bundle aplikacji | `patternly-core-0013`, release source `b4a7e46527e03b03d1ccd1cec5ea260f5d772569`, z `algorithms-core-0006` (2,375 items) oraz `gcp-ace-0012` (360 items) |
| content lock | `integration/contracts/algorithms-content/content.lock.json` nadal wskazuje `b424faa6d8c7209acb51ac23af812d08c31842dc`, czyli inny commit niż bundle i bieżący head contentu |
| Algorithms | osiem user-facing trybów w kontrakcie; aktywny artefakt ma siedem content blueprintów, ponieważ `Custom Practice` jawnie używa blueprintu `Guided Practice` |
| Certification | sześć trybów practice jest zadeklarowanych jako available/verified w kontrakcie; `certification-exam-simulation` jest declared/unavailable/unverified |
| Certification runtime | canonical `certification-exam-simulation` jest jedyną nazwą symulacji i pozostaje explicitly unavailable; nie ma produkcyjnego `cloud-exam-simulation`, a obecny `src/features/exam/*` jest ścieżką do zastąpienia dopiero po RC-004–RC-007 |
| feedback contentu | Algorithms publikuje strukturalne `feedback`; Certification publikuje jeszcze `explanation`, `watchOutFor` i `whyOthersAreWrong`, bez ujednoliconego `Reason` + strukturalnego `Details` |
| CI app | `.github/workflows/qa.yml` uruchamia static gate i Algorithms-only pinned cross-repo round trip |
| CI content | zwykły workflow uruchamia architekturę i probe, ale nie wymusza validate/build obu realnych tracków; real release gate jest tylko manualny |
| device evidence | pakiet Algorithms P-01…P-15/S-01…S-29 jest oznaczony jako stale dla obu platform; brak bieżącego evidence VoiceOver/TalkBack, Dynamic Type/reduced motion i Certification |

Wykonane w tej iteracji szybkie QA: app `npm run qa:static` — PASS
(`RECOVERY_ACTIVE_TESTS=78`, `RECOVERY_TEST_CASES=345`); content `npm test`,
`npm run validate:real:algorithms` i `npm run validate:real:certification` —
PASS. `npm run verify:artifact` nie jest kompletną komendą bez wymaganego
`--artifact`; poprawna forma jest udokumentowana w
`docs/manual-publishing-handoff.md`.

## 3. Decyzje zamykające kontrakt

1. `canonical-product-contract.yaml` jest właścicielem nazw i dostępności
   trybów; runtime nie może utrzymywać drugiego Certification mode ID.
2. `Custom Practice` pozostaje odrębnym trybem Algorithms i mapuje się tylko
   na immutable `Guided Practice` blueprint — siedem blueprintów contentu nie
   oznacza brakującego ósmego poola.
3. Certification Exam Simulation ma stabilne ID
   `certification-exam-simulation`, track-owned `ExamExperienceProfile` z
   aktualnym publicznym źródłem oficjalnym i jeden wspólny lifecycle; nie
   zachowujemy `cloud-exam-simulation` ani osobnego exam runtime.
4. Immediate feedback wszystkich rodzin ma `Reason` i kompletne,
   strukturalne `Details`; istniejące Certification `explanation` nie jest
   równoległym kontraktem po cutoverze.
5. Aktywny release jest jedną immutable, wielo-trackową tożsamością. App lock
   musi wiązać release ID, producer SHA i checksums obu artefaktów, a nie
   niezależny Algorithms fixture commit.
6. Do czasu osobnego, uwierzytelnionego kontraktu backupu dane treningowe nie
   są automatycznie eksportowane ani backupowane przez platformę. Aplikacja
   nie deklaruje szyfrowania bez zweryfikowanej konfiguracji kluczy.
7. Stare urządzeniowe screenshoty nie są evidence RC, nawet gdy ich inventory
   i testy runnera przechodzą.

## 4. Mapa faz

| Faza | Taski | Efekt |
| --- | --- | --- |
| Authority | RC-002 | jeden Certification mode vocabulary |
| Certification | RC-003–RC-008 | profile-driven Exam Simulation w canonical lifecycle |
| Content & release | RC-009–RC-014 | kompletne feedback, pool gates, jedna release identity i CI |
| Privacy & trust | RC-015–RC-016 | minimalne permissions, jawna polityka backupu i redaction |
| Acceptance | RC-017–RC-020 | bieżące i niezależnie ocenione evidence iOS/Android/a11y/visual |
| Closure | RC-021 | binarny release evidence pack |

## 5. Kolejka atomowych tasków

## RC-002 — Ujednolicić Certification mode ID

**Cel:**  Zostawić tylko `certification-exam-simulation` jako siódmy Certification mode ID we wszystkich runtime boundaries.

**Repozytorium:**  `app/main`.

**Zależności:**  brak.

**Kanoniczny owner:**  `docs/canonical-product-contract.yaml` i `src/tracks/cloud-certification/domain/certificationModes.ts`.

**Potwierdzony stan obecny:**  Kontrakt deklaruje `certification-exam-simulation`, ale `certificationModes.ts` eksponuje enabled `cloud-exam-simulation`; `CERTIFICATION_PRACTICE_MODE_IDS` ma tylko sześć ID.

**Dokładny zakres:**  Zmienić registry i jego testy na dokładnie siedem canonical ID, bez oznaczania Exam Simulation jako enabled, zanim profile-backed implementation będzie gotowa.

**Poza zakresem:**  Nie implementować przygotowania ani UI symulacji.

**Stare ścieżki do usunięcia:**  `cloud-exam-simulation` i wszystkie jego runtime references.

**Design reference:**  `certification-exam-active-screen`, `certification-exam-question-navigator`, `certification-exam-operational-states`.

**Kryteria akceptacji:**  Jeden registry vocabulary zgadza się z kontraktem; legacy ID jest odrzucane; brak hidden enabled path do Exam Simulation.

**Weryfikacja:**  `npm run typecheck`; skoncentrowany test trybów Certification; `npm test`.

**Evidence:**  SHA, test output i `rg -n 'cloud-exam-simulation' src tests` bez produkcyjowych wyników.

**Ryzyka:**  Stare ekrany pozostają dopiero do RC-008, ale nie są już routable przez registry.

## RC-003 — Opublikować Certification Exam Experience Profile

**Cel:**  Dodać do immutable Certification artifact pełny, aktualny i walidowany profil egzaminu wraz z declared Exam Simulation mode.

**Repozytorium:**  `content/master`.

**Zależności:**  brak.

**Kanoniczny owner:**  `config/tracks/cloud-certification.json`, `schemas/publishing/` i `scripts/publishing/pipeline.mjs`.

**Potwierdzony stan obecny:**  `patternly-core-0013` zawiera `examExperienceProfile`, ale artefakt deklaruje tylko sześć non-simulation modes i nie udowadnia gotowości Exam Simulation release.

**Dokładny zakres:**  Zweryfikować aktualne oficjalne publiczne źródło, zapisać source URL, checked date, guide version, question count/range, duration, navigation, answer-change, flagging, navigator, section i auto-final-submit; wymusić je schematem i opublikować deklarację `certification-exam-simulation` tylko gdy profil i pool są kompletne.

**Poza zakresem:**  Nie dodawać pytań, chyba że walidator profilu udowodni konkretny niedobór unikalnego poola.

**Stare ścieżki do usunięcia:**  Niejawne albo niezwalidowane profile, które nie są częścią published artifact.

**Design reference:**  brak.

**Kryteria akceptacji:**  Artifact zawiera jeden profile ID z wszystkimi wymaganymi polami i oficjalnym źródłem; brak profilu, stale source date lub zbyt mały pool blokują build explicite.

**Weryfikacja:**  `npm run validate:real:certification`; `npm run build:real:certification`; `npm run verify:artifact -- --artifact <built-certification-artifact>`.

**Evidence:**  URL źródła, checked date, build report, artifact checksum i content SHA.

**Ryzyka:**  Zmiana oficjalnego guide’a między weryfikacją a publikacją wymaga ponownego wydania profilu.

## RC-004 — Przygotować Certification simulation przez shared lifecycle

**Cel:**  Tworzyć Certification Exam Simulation wyłącznie z published profile i zapisać jeden canonical active session przed pokazaniem pytania.

**Repozytorium:**  `app/main`.

**Zależności:**  RC-002, RC-003.

**Kanoniczny owner:**  `CertificationFamilyRuntime`, `TrainingLifecycleUseCases` i `src/content/application/validateBundledContent.ts`.

**Potwierdzony stan obecny:**  `CertificationFamilyRuntime` obsługuje sześć practice modes; stare `ExamScreen` jest niezależną ścieżką UI, a validator dopuszcza tylko enabled registry modes.

**Dokładny zakres:**  Wprowadzić profile-backed prepare command, immutable occurrence/option plan i explicit unavailable state dla missing profile/content, używając istniejącego one-active-session persistence boundary.

**Poza zakresem:**  Draft editing, timer, finalization i UI navigatora.

**Stare ścieżki do usunięcia:**  Przygotowanie sesji bez verified profile.

**Design reference:**  `certification-exam-active-screen`.

**Kryteria akceptacji:**  Start nie odsłania pytania przed trwałym zapisem; unknown profile i unavailable content kończą się typed unavailable state; plan jest deterministyczny i przypięty do content/profile version.

**Weryfikacja:**  Test application-level prepare/start; `npm run typecheck`; `npm test`.

**Evidence:**  SHA, test output oraz serialized configuration snapshot z profile reference.

**Ryzyka:**  RC-003 może uczciwie ujawnić brak poola i zablokować start.

## RC-005 — Utrwalić Certification draft i navigator

**Cel:**  Zapisywać odpowiedź, flagę i navigation change Certification simulation jako revisioned draft bez utraty niezapisanej zmiany.

**Repozytorium:**  `app/main`.

**Zależności:**  RC-004.

**Kanoniczny owner:**  `TrainingLifecycleUseCases`, `trainingSessionDraft` i certification family runtime.

**Potwierdzony stan obecny:**  `docs/03-navigation-and-flows.md` wymaga session-owned draft, lecz `src/features/exam/ExamScreen.tsx` pozostaje osobnym old-screen path.

**Dokładny zakres:**  Dodać certification-owned draft commands za wspólnym lifecycle portem, expected-revision protection, profile-controlled flagging/navigator oraz explicit save failure projection.

**Poza zakresem:**  Timer, expiry i wynik końcowy.

**Stare ścieżki do usunięcia:**  Lokalny UI state w starym ExamScreen jako owner odpowiedzi lub flag.

**Design reference:**  `certification-exam-question-navigator`.

**Kryteria akceptacji:**  Relaunch odzyskuje tylko potwierdzony draft; stale revision nie nadpisuje danych; brak uprawnienia profilu nie tworzy pola draftu.

**Weryfikacja:**  Focused durable-draft, concurrent-save i relaunch tests; `npm test`.

**Evidence:**  Test log oraz persisted draft fixture z revision history.

**Ryzyka:**  Błąd zapisu musi zachować ostatni verified projection, bez retry fallbacku.

## RC-006 — Zastosować Certification timer, resume i expiry

**Cel:**  Liczyć czas Exam Simulation zgodnie z profilem wyłącznie podczas foreground i finalizować expiry dokładnie raz.

**Repozytorium:**  `app/main`.

**Zależności:**  RC-004.

**Kanoniczny owner:**  `ForegroundSimulationTimer`, `TrainingLifecycleUseCases` i profil z RC-003.

**Potwierdzony stan obecny:**  Timer porty i force-close tests istnieją dla Algorithms; Certification profile-driven timer nie jest dostępny przez canonical mode.

**Dokładny zakres:**  Podłączyć profile duration, durable cadence, background checkpoint, resume drift i expiry finalization do wspólnego timer boundary.

**Poza zakresem:**  Draft response/navigator semantics i rendering final summary.

**Stare ścieżki do usunięcia:**  Timer state należący do starego exam UI.

**Design reference:**  `certification-exam-operational-states`.

**Kryteria akceptacji:**  Background time nie jest liczony; missing timer jest explicit recovery failure; manual finish i expiry używają tej samej finalization operation.

**Weryfikacja:**  Controlled-clock timer/force-close/expiry tests; `npm test`.

**Evidence:**  Test output z checkpoint count i declared drift bound.

**Ryzyka:**  Profil bez jawnej duration blokuje mode, zamiast przejmować global default.

## RC-007 — Sfinalizować Certification simulation i review

**Cel:**  Zapisać jeden immutable result i canonical review po manualnym finish albo expiry Certification simulation.

**Repozytorium:**  `app/main`.

**Zależności:**  RC-005, RC-006.

**Kanoniczny owner:**  `commitTrainingSessionFinalization`, Certification scoring i summary queries.

**Potwierdzony stan obecny:**  Stare `ResultScreen` i `ExamReviewScreen` budują Certification review obok canonical practice summary.

**Dokładny zakres:**  Zbudować profile-compliant finalization, unanswered accounting, scoring, immutable result, review projections i explicit finalization-recovery states w canonical shell.

**Poza zakresem:**  Usunięcie starych route/components następuje w RC-008.

**Stare ścieżki do usunięcia:**  Wynik lub review rekonstruowany z old-screen/UI state.

**Design reference:**  `certification-exam-operational-states`.

**Kryteria akceptacji:**  40-style profile plan kończy się jednym resultem, bez active session/draft; repeated finalization jest idempotentna; review odczytuje canonical attempts/result.

**Weryfikacja:**  Full lifecycle, recovery and summary/review query tests; `npm test`.

**Evidence:**  Test output i immutable result fixture.

**Ryzyka:**  Zgodność zakresu wyniku z profilem nie może być udawanym pass/fail result.

## RC-008 — Usunąć stary Certification exam runtime

**Cel:**  Usunąć równoległe ekrany, route’y i scoring ownerów zastąpione canonical Certification simulation.

**Repozytorium:**  `app/main`.

**Zależności:**  RC-007.

**Kanoniczny owner:**  `RootNavigator`, shared session shell i Certification family runtime.

**Potwierdzony stan obecny:**  `RootNavigator.tsx` importuje `ExamScreen`, `ExamReviewScreen` i `ResultScreen`; pliki używają odrębnego katalogu/flow.

**Dokładny zakres:**  Przepiąć pozostałe entry points na canonical routes, usunąć `src/features/exam/`, nieużywany `src/constants/exam.ts` i old scoring helpers tylko jeśli import graph potwierdza brak canonical ownera.

**Poza zakresem:**  Refaktor unrelated Certification practice.

**Stare ścieżki do usunięcia:**  `src/features/exam/ExamScreen.tsx`, `ExamReviewScreen.tsx`, `ResultScreen.tsx`, old routes/selectors i ich wyłączne testy.

**Design reference:**  `certification-exam-active-screen`.

**Kryteria akceptacji:**  Brak importów/route’ów/legacy mode IDs; każdy Certification session uses one lifecycle and summary/review owner.

**Weryfikacja:**  `rg -n 'ExamScreen|ExamReviewScreen|ResultScreen|cloud-exam-simulation' src tests`; `npm run typecheck`; `npm test`.

**Evidence:**  Import graph report, deleted-path diff i test output.

**Ryzyka:**  Usunięcie następuje wyłącznie po dowodzie, że RC-004–RC-007 pokrywają wszystkie dostępne zachowania.

## RC-009 — Ujednolicić Certification feedback contract

**Cel:**  Publikować i renderować Certification feedback jako authored `Reason` oraz strukturalne `Details` z wyjaśnieniami złych opcji.

**Repozytorium:**  `cross-repo`.

**Zależności:**  RC-003.

**Kanoniczny owner:**  `schemas/publishing/certification-manual-source.schema.json`, Certification content handler i `PracticeFeedbackBlock`.

**Potwierdzony stan obecny:**  `gcp-ace-0012` ma 360 choice items i `whyOthersAreWrong`, ale używa old fields `explanation` i `watchOutFor`; guidelines wymagają `Reason` oraz complete structured `Details`.

**Dokładny zakres:**  W content source zastąpić old feedback shape canonical structure, walidować kompletność każdego choice item, wydać immutable artifact, zsynchronizować bundle/lock i podłączyć jeden renderer bez translation fallback.

**Poza zakresem:**  Nie powiększać banku pytań, jeśli pool readiness go nie wymaga.

**Stare ścieżki do usunięcia:**  Learner-facing `explanation`/`watchOutFor` contract i renderer tych pól.

**Design reference:**  `shared-practice-flow-001`.

**Kryteria akceptacji:**  Każdy Certification item ma Reason, Details i wrong-option explanation; feedback jest niedostępny przed submit; app nie odczytuje old field names.

**Weryfikacja:**  Content validate/build/verify artifact, app focused feedback tests, `npm run test:algorithms-cross-repo` po synchronizacji.

**Evidence:**  Content/app SHA, artifact checksum, validator report i screenshot/text evidence jednego complete feedback state.

**Ryzyka:**  To cross-repo task; musi wykonać kolejność content → push/SHA → app bundle/lock → push/SHA.

## RC-010 — Wymusić mode-level pool readiness Certification

**Cel:**  Udowadniać machine-readably unikalny, profile-compatible pool dla każdego z siedmiu Certification modes.

**Repozytorium:**  `content/master`.

**Zależności:**  RC-003 wyłącznie dla siódmego, Simulation mode. Aktualnie zadeklarowane tryby mają niezależny, canonical readiness owner; kontrakt feedbacku RC-009 nie zmienia reguł doboru pooli.

**Kanoniczny owner:**  Certification track config i `scripts/publishing/pipeline.mjs`.

**Potwierdzony stan obecny:**  W toku. Producer commit `ba66c458e7141cf8164dc556efa0eaac5ad12ebb` wprowadza machine-readable `modeReadiness` dla każdego z sześciu aktualnie zadeklarowanych trybów: exact scope, requested lengths, shortening i required/available unique count. Każdy nowy declared mode bez własnego readiness ownera zatrzymuje walidację (`MISSING_MODE_READINESS_OWNER`); nie może zostać niejawnie dopisany do raportu.

**Dokładny zakres:**  Dodać deterministic readiness computation do validate/build report: required/available unique items, scope, shortening policy, profile constraints i result dla każdego declared mode. Dodać Simulation owner dopiero razem z zatwierdzoną polityką interakcji z RC-003.

**Poza zakresem:**  Nie tworzyć żadnego nowego pytania bez failing report wskazującego konkretny scope i exact deficit.

**Stare ścieżki do usunięcia:**  Bank-wide item count jako substytut mode-specific readiness.

**Design reference:**  brak.

**Kryteria akceptacji:**  Build failuje dla niedoboru, duplikatu, niezgodnego profilem lub silent scope widening; success report wiąże exact artifact checksum.

**Weryfikacja:**  `npm run validate:real:certification`; `npm run build:real:certification`; fixture tests for each failure mode.

**Evidence:**  Machine-readable readiness report i artifact checksum.

**Ryzyka:**  Genuine deficit staje się explicit content blocker, nie fillerm ani fallbackiem.

## RC-011 — Wymusić user-mode readiness Algorithms

**Cel:**  Weryfikować wszystkie osiem user-facing Algorithms modes z jawnym mapowaniem Custom Practice → Guided Practice.

**Repozytorium:**  `content/master`.

**Zależności:**  brak.

**Kanoniczny owner:**  `config/tracks/algorithms.json` i Algorithms publishing validation.

**Potwierdzony stan obecny:**  `algorithms-core-0006` ma siedem content blueprint IDs; application `getAlgorithmContentBlueprintModeId` mapuje Custom Practice do Guided Practice, a app test przygotowuje osiem modes.

**Dokładny zakres:**  Przenieść tę relację do producer-owned readiness report i testu, który sprawdza 10/20/40 Custom Practice oraz fixed 40 Interview Simulation bez fillerów/duplikatów.

**Poza zakresem:**  Nie dodawać eighth blueprint ani contentu bez failing pool report.

**Stare ścieżki do usunięcia:**  Implicit app-only assumption, że siedem blueprintów oznacza osiem user modes.

**Design reference:**  brak.

**Kryteria akceptacji:**  Report pokazuje osiem user modes, ich owner blueprint i exact counts; any missing map/content compatibility fails producer validation.

**Weryfikacja:**  `npm test`; `npm run validate:real:algorithms`; new publishing fixture tests. `build:real:algorithms` nie jest tu wykonywany, ponieważ aktualna wersja `algorithms-core-0006` jest już immutable. Realny build z nowym numerem wersji i checksumem należy wyłącznie do RC-013, po zamknięciu wszystkich zmian contentu.

**Evidence:**  Readiness report, source/evidence SHAs oraz wynik odmowy nadpisania istniejącej immutable wersji. Built checksum nowego release'u jest evidence RC-013.

**Ryzyka:**  Failing report determinuje ewentualny przyszły, konkretny content task.

## RC-012 — Usunąć niekanoniczne content ingress

**Cel:**  Usunąć pozostawione root `manifest.json` i `tracks/` bank manifests, które deklarują obsolete 0001 active banks mimo canonical manual-source pipeline.

**Repozytorium:**  `content/master`.

**Zależności:**  brak. Usunięcie nieosiągalnego ingressu nie zależy od polityki Certification simulation ani readiness innego tracku.

**Kanoniczny owner:**  `manual/source/`, `config/`, `schemas/publishing/` i `artifacts/releases/`.

**Potwierdzony stan obecny:**  VERIFIED 2026-07-28. Root `manifest.json` oraz oba `tracks/*/manifest.json` zostały usunięte po import-graph proof. `manual/source/` jest jedynym content ingress; test odrzuca ponowne dodanie usuniętych manifestów. Certification otrzymał także jawnie wywoływalną i przechodzącą technical evidence dla aktualnego sześciomode’owego kontraktu, bez aktywowania Simulation.

**Dokładny zakres:**  Usunąć unreachable 0001 manifests/banks and tests that treat them as active; zachować wyłącznie canonical manual source, immutable artifacts i explicit test fixtures.

**Poza zakresem:**  Nie zmieniać canonical source item contentu.

**Stare ścieżki do usunięcia:**  `manifest.json`, `tracks/algorithms/manifest.json`, `tracks/cloud-certification/manifest.json` oraz ich unreachable banks/references po import-graph proof.

**Design reference:**  brak.

**Kryteria akceptacji:**  Żaden publishing/runtime command nie czyta root/track manifests; żadna aktywna artifact identity nie wskazuje 0001; architecture tests cover absence.

**Weryfikacja:**  `rg -n 'tracks/.*manifest|algorithms-core-0001|gcp-ace-0001'`; `npm test`; real validate/build commands.

**Evidence:**  Reachability search, deleted-file diff i test output.

**Ryzyka:**  Przed usunięciem trzeba sprawdzić manual fixtures; test-only fixture may remain only under `tests/fixtures/`.

## RC-013 — Opublikować jedną multi-track release identity

**Cel:**  Zbudować z bieżącego content headu jedną immutable release i przypiąć app do jej ID, producer SHA oraz checksums obu tracków.

**Repozytorium:**  `cross-repo`.

**Zależności:**  RC-009, RC-010, RC-011, RC-012.

**Kanoniczny owner:**  content `artifacts/releases/<release-id>/release.json` oraz app `src/content/bundled/generatedArtifacts.ts` i integration lock.

**Potwierdzony stan obecny:**  Bundle `patternly-core-0013` wskazuje source `b4a7e46…`, app Algorithms lock `b424faa…`, a remote content head to `d3a4404…`.

**Dokładny zakres:**  Build/verify oba artifacts, publish new immutable multi-track release from clean `master`, record exact release manifest and update generated app bundle plus lock to that one identity.

**Poza zakresem:**  Remote delivery ani dynamic update contentu.

**Stare ścieżki do usunięcia:**  Algorithms-only lock semantics i stale producer commits that are not the active release identity.

**Design reference:**  brak.

**Kryteria akceptacji:**  App validates both checksums and exact producer SHA; mismatch between lock/release/bundle fails locally and in CI; no track becomes available by falling back to another artifact.

**Weryfikacja:**  Content validate/build/verify/publish commands; app `npm run sync:content-release`; `npm run qa:static`; `npm run test:algorithms-cross-repo` extended to both tracks.

**Evidence:**  Both pushed SHAs, release ID, release.json, checksums, lock diff and remote-head confirmation.

**Ryzyka:**  Obowiązuje kolejność content → validation/push/SHA → bundle/lock → app validation/push/SHA.

## RC-014 — Zmienić content CI w realny gate release

**Cel:**  Wymuszać na każdym change do canonical content source validate/build obu tracków i artifact verification.

**Repozytorium:**  `content/master`.

**Zależności:**  brak. Gate buduje izolowane kandydaty z canonical source i automatycznie obejmie późniejszy kontrakt RC-010; nie publikuje ani nie zastępuje immutable release'u.

**Kanoniczny owner:**  `.github/workflows/content-publishing.yml`.

**Potwierdzony stan obecny:**  VERIFIED 2026-07-28. Workflow uruchamia `npm ci`, pełny `npm test` oraz `ci-release-gate.mjs`. Gate waliduje, buduje do izolowanego katalogu i weryfikuje oba canonical track artifacts bez publikowania ani nadpisywania immutable wersji.

**Dokładny zakres:**  Zastąpić status-only probe realnymi validate/build/verify steps dla Algorithms i Certification oraz fail-fast artifacts w izolowanym katalogu CI.

**Poza zakresem:**  Nie publikować immutable release w każdym CI runie.

**Stare ścieżki do usunięcia:**  `ARTIFACT_STATUS=NOT_BUILT` jako pozorny release signal.

**Design reference:**  brak.

**Kryteria akceptacji:**  Pull request i push nie przechodzą, gdy real track validation/build artifact fails; workflow output nazwie track, checksum i failing rule.

**Weryfikacja:**  `npm test` 39/39 oraz `node scripts/publishing/ci-release-gate.mjs`: Algorithms `ff2869f43d52e690c8eb85a4bfbc1741e83e25e838d9e0c238f47b73eda5388e`, Certification `036b9bc371a339cba31383b7ed39eed8233b0fc72cd48b14b5b81bcf8a33e90d`.

**Evidence:**  Pushed producer commits `bb2bc89e4648bf2079a29cdeac63e1655bd36195` i `d84ece0aa0e7a2a72c143b94215509b045c17075`; workflow source and deterministic gate output name both tracks and their checksums. Zdalny workflow run pozostaje do potwierdzenia po zakończeniu GitHub Actions.

**Ryzyka:**  CI runtime rośnie, ale jest jedynym uczciwym gate’em dla active content.

## RC-015 — Rozszerzyć app CI na pełną release identity

**Cel:**  Zastąpić Algorithms-only cross-repo check walidacją aktywnego multi-track release i release-lock consistency.

**Repozytorium:**  `app/main`.

**Zależności:**  RC-014. Canonical lock i consumer verification działają dla aktywnego immutable release; RC-013 aktualizuje wyłącznie jego dane po publikacji finalnego release'u.

**Kanoniczny owner:**  `.github/workflows/qa.yml` i integration contract tests.

**Potwierdzony stan obecny:**  VERIFIED 2026-07-28. `content-release/release.lock.json` przypina producer commit, release ID, release source commit i checksums obu tracków. `qa.yml` checkoutuje ten producer commit dla recovery gate i dedicated multi-track job; aplikacja porównuje lock, producer `release.json`, SHA-256 artifact bytes i swój generated bundle.

**Dokładny zakres:**  Checkoutować one pinned producer SHA from release lock, verify release manifest/checksums obu tracków i uruchamiać consumer round trip dla całego generated bundle.

**Poza zakresem:**  Device tests w GitHub Actions.

**Stare ścieżki do usunięcia:**  Algorithms-only CI checkout/contract path.

**Design reference:**  brak.

**Kryteria akceptacji:**  CI fails for stale producer SHA, release ID mismatch, one-track omission, checksum mismatch or unsupported declared mode.

**Weryfikacja:**  `npm run test:content-release-cross-repo`; `npm run qa:static` PASS (recovery, typecheck, 168 tests, content boundary i runtime privacy boundary).

**Evidence:**  App `f3733a63ebc1dcae157fabf89ea95f4cf304d6e8`; immutable producer commit `d3a44041b923eae01ccabd6d9d5e5fa6c9ffe975`; release `patternly-core-0013`; checksums Algorithms `ff2869f43d52e690c8eb85a4bfbc1741e83e25e838d9e0c238f47b73eda5388e`, Certification `036b9bc371a339cba31383b7ed39eed8233b0fc72cd48b14b5b81bcf8a33e90d`.

**Ryzyka:**  Lock musi wskazywać exact immutable producer commit zawierający `release.json`; nie może używać bieżącego remote head jako substytutu historycznej release identity.

## RC-016 — Zamknąć privacy boundary local storage

**Cel:**  Zastosować minimalne platform permissions i explicit no-backup policy dla local learning data.

**Repozytorium:**  `app/main`.

**Zależności:**  brak.

**Kanoniczny owner:**  `docs/08-storage-and-offline.md`, `docs/09-security-and-privacy.md`, Android manifest i iOS native configuration.

**Potwierdzony stan obecny:**  Runtime test zakazuje network ingress, one MMKV client jest w `src/infrastructure/storage/mmkvClient.ts`, ale Android manifest nadal deklaruje `INTERNET`, `READ_EXTERNAL_STORAGE` i `WRITE_EXTERNAL_STORAGE`; backup policy nie jest enforced by native acceptance test.

**Dokładny zakres:**  Usunąć niepotrzebne storage/network permissions after native dependency proof, explicitly disable/exclude automatic backup for canonical records on both platforms and test resulting manifests/configuration.

**Poza zakresem:**  Nie deklarować encryption ani budować cloud backup.

**Stare ścieżki do usunięcia:**  Nieuzasadnione Android storage/network permissions i implicit platform-backup behavior.

**Design reference:**  brak.

**Kryteria akceptacji:**  Release manifest has only justified permissions; reset deletes canonical learning data while content/settings boundaries stay as documented; build evidence shows no automatic backup claim.

**Weryfikacja:**  Static native-manifest tests, iOS/Android build inspection, `npm run qa:static`.

**Evidence:**  Native config diff, build manifests and reset test output.

**Ryzyka:**  Any dependency that requires a permission must be demonstrated; it cannot retain permission by habit.

## RC-017 — Wymusić runtime redaction i offline boundary

**Cel:**  Uniemożliwić logowanie answer/draft contentu oraz każdą produkcyjną network path.

**Repozytorium:**  `app/main`.

**Zależności:**  RC-016.

**Kanoniczny owner:**  `docs/09-security-and-privacy.md`, `src/application/` and `scripts/checkRecoveryBaseline.mjs`.

**Potwierdzony stan obecny:**  VERIFIED 2026-07-28. `src/application/operationalDiagnostics.ts` jest jedyną projekcją caught operational failures dla learner UI: przekazuje finite category, nigdy raw error message ani payload. `validateRuntimePrivacyBoundary.mjs` blokuje raw operational messages, console diagnostics i network clients w produkcyjnym source; `qa:static` uruchamia tę bramkę. Test z wstrzykniętym answer/draft/session payloadem potwierdza redaction.

**Dokładny zakres:**  Centralnie zdefiniować dozwolone operational diagnostics, redaction of session IDs/answers/drafts/content payloads and static/runtime gate against console/network imports outside approved development audit code.

**Poza zakresem:**  Nie dodawać remote telemetry ani crash reporting.

**Stare ścieżki do usunięcia:**  Direct production `console` or networking calls that bypass the policy, if found.

**Design reference:**  brak.

**Kryteria akceptacji:**  Injected failure preserves actionable error category but not learner payload; production source cannot gain network client or raw logging without test failure.

**Weryfikacja:**  Focused redaction/boundary tests; `npm run recovery:check`; `npm run qa:static`.

**Evidence:**  Redacted log fixtures and gate output.

**Ryzyka:**  Diagnostics must remain useful; silent error suppression is forbidden.

## RC-018 — Zebrać iOS device acceptance

**Cel:**  Udowodnić na bieżącym app/content SHA wszystkie user-facing Algorithms i Certification flows na iOS.

**Repozytorium:**  `app/main` verification.

**Zależności:**  RC-008, RC-013, RC-015, RC-016, RC-017.

**Kanoniczny owner:**  `.audit/ux-ui/maestro/flows/`, iOS acceptance packet i current release lock.

**Potwierdzony stan obecny:**  44-state Algorithms iOS packet jest stale; historical report nie obejmuje Certification ani real interactive happy path.

**Dokładny zakres:**  Zaktualizować canonical flow inventory for current product, run on one explicit booted simulator/device, capture functional happy/recovery states for both families and publish provenance-bound manifest.

**Poza zakresem:**  Nie zmieniać runtime/product behavior to make a capture pass.

**Stare ścieżki do usunięcia:**  Stale iOS packet as RC evidence.

**Design reference:**  Exact reference per captured surface from canonical design registry.

**Kryteria akceptacji:**  Every supported mode, resume, expiry/finalization where applicable, summary/review and explicit unavailable state has current SHA-bound evidence; failures abort publication.

**Weryfikacja:**  `npm run audit:ux-ui -- --udid <booted-udid>` plus inventory/provenance validator and manual real-flow check.

**Evidence:**  Device metadata, app/content/release SHA, screenshot manifest, logs and failure-free capture report.

**Ryzyka:**  Missing device, simulator or native build is an explicit operational blocker.

## RC-019 — Zebrać Android device acceptance

**Cel:**  Udowodnić na bieżącym app/content SHA wszystkie user-facing Algorithms i Certification flows na Androidzie.

**Repozytorium:**  `app/main` verification.

**Zależności:**  RC-008, RC-013, RC-015, RC-016, RC-017.

**Kanoniczny owner:**  `.audit/ux-ui/maestro/flows/`, Android acceptance packet i current release lock.

**Potwierdzony stan obecny:**  Android 44-state Algorithms packet jest stale względem current executable provenance i nie obejmuje Certification.

**Dokładny zakres:**  Zaktualizować exact Android flow inventory, build/install current APK, run serial explicit-emulator capture and publish paired manifest/screenshots only after full success.

**Poza zakresem:**  No fallback emulator, alternate host or conditional selector path.

**Stare ścieżki do usunięcia:**  Stale Android packet as RC evidence.

**Design reference:**  Exact reference per captured surface from canonical design registry.

**Kryteria akceptacji:**  All supported flows and required failure states are captured with current app/content identity; APK hash equals installed artifact; packet publication is atomic.

**Weryfikacja:**  `npm run audit:ux-ui:android -- --serial <online-serial>` plus manifest/provenance validators and manual real-flow check.

**Evidence:**  Serial/device metadata, APK hash, app/content/release SHA, screenshots and runner report.

**Ryzyka:**  Missing online serial or failing flow is an explicit acceptance failure, not a skipped state.

## RC-020 — Zatwierdzić accessibility i visual QA

**Cel:**  Niezależnie ocenić bieżące iOS/Android captures względem zatwierdzonych design references i accessibility obligations.

**Repozytorium:**  `app/main` verification.

**Zależności:**  RC-018, RC-019.

**Kanoniczny owner:**  `docs/designs/README.md`, design registry, `src/features/algorithms/session/sessionAccessibility.ts` i acceptance packet.

**Potwierdzony stan obecny:**  Current report wymienia VoiceOver/TalkBack traversal, large text, reduced motion, focus order and touch targets as unverified; historical visual screenshots are marked pending/stale.

**Dokładny zakres:**  Inspect current captures and native assistive-tech runs; verify spoken labels/order, focus restoration, 48pt targets, Dynamic Type/Font Scale, reduced motion, contrast and no text overlap per screen state.

**Poza zakresem:**  Nie implementować visual fixes in this verification task; actionable failures become new atomic implementation tasks before rerun.

**Stare ścieżki do usunięcia:**  Stale/pending visual QA claims from active RC evidence.

**Design reference:**  Relevant approved ID for every audited screen; no unregistered screen is accepted.

**Kryteria akceptacji:**  Each capture has a pass/fail comparison, intentional deviation and platform accessibility result; no Critical/High finding remains open.

**Weryfikacja:**  Native VoiceOver/TalkBack traversal, platform text/motion settings, screenshot comparison checklist and manual contrast/touch-target review.

**Evidence:**  Signed audit report, current screenshots, device settings and issue ledger.

**Ryzyka:**  A finding is a real blocker until its separate repair and recapture complete.

## RC-021 — Złożyć finalny evidence pack RC

**Cel:**  Wydać binarną decyzję `RC_VERIFIED` albo `BLOCKED` dla exact pushed app/content heads.

**Repozytorium:**  `cross-repo` verification.

**Zależności:**  RC-015, RC-017, RC-018, RC-019, RC-020.

**Kanoniczny owner:**  `docs/release-candidate-closure.md` completion ledger i final evidence packet.

**Potwierdzony stan obecny:**  Nie ma evidence pack wiążącego current remote heads, multi-track release identity, CI and fresh device acceptance; prior plans/reporty są historical.

**Dokładny zakres:**  Ponownie sprawdzić clean worktrees, remote heads, release lock/checksums, CI runs, QA, device/a11y/visual packets i populate final gate only from exact artifacts.

**Poza zakresem:**  Nie naprawiać defectów ani nie uruchamiać post-RC monetization/localization work.

**Stare ścieżki do usunięcia:**  Claims `implemented but unverified`, stale evidence references and informal release status.

**Design reference:**  brak.

**Kryteria akceptacji:**  Wszystkie punkty Final RC gate są PASS dla exact SHAs; w przeciwnym przypadku status jest `BLOCKED` z reproducible command and owner.

**Weryfikacja:**  All task-specific commands plus `git status --short`, `git ls-remote origin refs/heads/main|master` and evidence checksum review.

**Evidence:**  Final SHA pair, release ID/checksums, CI URLs, exact command logs, manifests, screenshots and signed audits.

**Ryzyka:**  A new commit after acceptance invalidates SHA-bound evidence and requires targeted rerun.

## 6. Dependency graph

```yaml
tasks:
  RC-002: { dependsOn: [] }
  RC-003: { dependsOn: [] }
  RC-004: { dependsOn: [RC-002, RC-003] }
  RC-005: { dependsOn: [RC-004] }
  RC-006: { dependsOn: [RC-004] }
  RC-007: { dependsOn: [RC-005, RC-006] }
  RC-008: { dependsOn: [RC-007] }
  RC-009: { dependsOn: [RC-003] }
  RC-010: { dependsOn: [RC-003] }
  RC-011: { dependsOn: [] }
  RC-012: { dependsOn: [] }
  RC-013: { dependsOn: [RC-009, RC-010, RC-011, RC-012] }
  RC-014: { dependsOn: [] }
  RC-015: { dependsOn: [RC-014] }
  RC-016: { dependsOn: [] }
  RC-017: { dependsOn: [RC-016] }
  RC-018: { dependsOn: [RC-008, RC-013, RC-015, RC-016, RC-017] }
  RC-019: { dependsOn: [RC-008, RC-013, RC-015, RC-016, RC-017] }
  RC-020: { dependsOn: [RC-018, RC-019] }
  RC-021: { dependsOn: [RC-015, RC-017, RC-018, RC-019, RC-020] }
```

## 7. Loop execution rules

1. Wybierz najwęższy task prowadzący do `RC_VERIFIED`, którego zależności są
   `VERIFIED`; jeśli source/test/evidence ujawnią błędny plan, najpierw
   napraw zakres, zależności lub podział tasków.
2. Potwierdź remote URL, branch, clean worktree i starting SHA właściwego
   repozytorium przed zmianą.
3. Po zakończeniu i zapisaniu evidence kontynuuj następny gotowy task w tym
   samym loopie, aż do `RC_VERIFIED` albo konkretnego blokera wymagającego
   decyzji PO.
4. Dla `cross-repo` zawsze wykonaj: content/master → validation → commit/push
   → remote SHA → bundle/lock → app/main → validation → commit/push → remote
   SHA → release identity check.
5. Status zmienia się wyłącznie po pushu i potwierdzeniu remote SHA; task
   verification bez zmian może być `VERIFIED` dopiero po zapisaniu evidence.
6. Gdy wykonanie ujawni prawdziwy PO blocker, dodaj jeden plik do
   `docs/po-questions/` z opisem dylematu, options i recommendation; nie
   twórz takiego pliku dla kwestii rozstrzygniętej przez kontrakt lub jedyne
   sensowne rozwiązanie.
7. Nie twórz fallbacków, translatorów, compatibility paths, filler contentu
   ani artificial completion commits.

## 8. Completion ledger

| Task | Status | app SHA | content SHA | Verification | Evidence | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| RC-002 | VERIFIED | aab43eb6727f4223db09dec25b134bacdf65a954 | d3a44041b923eae01ccabd6d9d5e5fa6c9ffe975 | `npm run typecheck`; targeted Certification suite 34/34; `npm test` 374/374 | `origin/main` confirmed at `aab43eb6727f4223db09dec25b134bacdf65a954`; legacy-ID production search empty | — |
| RC-003 | BLOCKED | 3827a0a9c6f4fed89762a3d25e4518577b7e44f8 | d3a44041b923eae01ccabd6d9d5e5fa6c9ffe975 | Official-source review 2026-07-28 | [PO decision](po-questions/rc-003-certification-exam-interaction-policy.md) required: official sources omit interaction policy | PO decision on product-owned simulation policy |
| RC-004 | PENDING | — | — | — | — | — |
| RC-005 | PENDING | — | — | — | — | — |
| RC-006 | PENDING | — | — | — | — | — |
| RC-007 | PENDING | — | — | — | — | — |
| RC-008 | PENDING | — | — | — | — | — |
| RC-009 | PENDING | — | — | — | — | — |
| RC-010 | IN_PROGRESS | — | 5ad33da60f3a650e855ff51551831492a4512a7e | content `npm test` 41/41; `npm run validate:real:certification`; clean two-track gate PASS | Six active Certification modes have deterministic scope-level readiness; unowned declared mode is rejected | Simulation readiness owner and seventh-mode evidence await RC-003 PO decision |
| RC-011 | VERIFIED | 728e5d421aea6f889209eb1da56dfed31bb556f4 | 228a869feea1cfbdd700fc868ab050e1d8380233 | `npm test` 37/37; `npm run validate:real:algorithms` PASS; `npm run build:real:algorithms` correctly rejects overwrite of `algorithms-core-0006` | Producer source `a4d384f01d14fb1a69b8e3dc0d1f9e7b61f2e405`; immutable evidence `228a869feea1cfbdd700fc868ab050e1d8380233`; `origin/master` confirmed | New immutable build/checksum intentionally deferred to RC-013 |
| RC-012 | VERIFIED | 976042c15e6ab76a2e9b1c4b1a3154dead16fb10 | 9c6f594f4817602123f710124b4969b373d6eaa8 | content `npm test` 38/38; `npm run validate:real:algorithms`; `npm run validate:real:certification` PASS | `origin/master` confirmed at `9c6f594f4817602123f710124b4969b373d6eaa8`; deleted three unreachable manifests; certification evidence `65f360f…json` is tracked | New multi-track immutable build remains RC-013 after simulation and feedback contract work |
| RC-013 | PENDING | — | — | — | — | — |
| RC-014 | VERIFIED | — | d84ece0aa0e7a2a72c143b94215509b045c17075 | content `npm test` 39/39; clean `ci-release-gate.mjs` built and verified both isolated artifacts | `origin/master` confirmed at `d84ece0…`; workflow replaces `ARTIFACT_STATUS=NOT_BUILT` with deterministic two-track gate | Await GitHub Actions completion for the run URL; this does not block the implemented gate |
| RC-015 | VERIFIED | f3733a63ebc1dcae157fabf89ea95f4cf304d6e8 | d3a44041b923eae01ccabd6d9d5e5fa6c9ffe975 | `test:content-release-cross-repo`; `qa:static` PASS | One multi-track lock replaces the Algorithms-only lock and harness; validates release manifest, both artifact bytes/checksums and bundle availability | New final release will update lock data in RC-013 |
| RC-016 | VERIFIED | c10cbd80a607148233a98e48c7762e01ce65d700 | 228a869feea1cfbdd700fc868ab050e1d8380233 | `npm run typecheck`; `npm test` 375/375; Expo prebuild; Android release manifest merge PASS | Release manifest: only `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED` and signature-internal permission; Android root excluded for cloud/D2D; iOS MMKV directory marked before startup | Physical iOS/Android install and device evidence remain RC-018/RC-019 scope |
| RC-017 | VERIFIED | 25d79f832760add1a37aa7e2e79b3d4b1b4c711d | 228a869feea1cfbdd700fc868ab050e1d8380233 | `npm run qa:static`: recovery, typecheck, 376/376 tests, cross-repo contract, content boundary i runtime privacy boundary PASS | `origin/main` confirmed at `25d79f832760add1a37aa7e2e79b3d4b1b4c711d`; injected answer/draft/session payload is reduced to a finite operational code | Fresh device evidence remains RC-018/RC-019 scope |
| RC-018 | PENDING | — | — | — | — | — |
| RC-019 | PENDING | — | — | — | — | — |
| RC-020 | PENDING | — | — | — | — | — |
| RC-021 | PENDING | — | — | — | — | — |

## 9. Final RC gate

- [ ] Exact app and content remote heads are clean, pushed and recorded.
- [ ] One immutable multi-track release has a matching app bundle, lock and checksums.
- [ ] Algorithms eight user modes and Certification seven modes have passing, mode-level pool readiness.
- [ ] Certification Exam Simulation uses its published official-source profile through the one canonical lifecycle.
- [ ] No old Certification mode ID, old exam route, parallel runtime, synthetic metric or hidden content/storage fallback remains.
- [ ] Both real content builds, content CI, app CI and cross-repo contract pass on recorded heads.
- [ ] MMKV ownership, reset, permission, backup, offline and redaction boundaries are verified.
- [ ] Current iOS and Android functional evidence is published for all supported flows.
- [ ] Current visual/accessibility acceptance has no open Critical or High finding.
- [ ] RC-021 evidence pack concludes `RC_VERIFIED`; otherwise it records `BLOCKED` with a reproducible blocker.

## 10. Post-RC handoff

1. Entitlement domain.
2. Subscription integration.
3. Free-first-node enforcement.
4. Active-track limits.
5. Restore purchases.
6. English/Polish model.
7. Next Certification track.

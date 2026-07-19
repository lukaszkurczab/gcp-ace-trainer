# P6 — Certification delta audit

Data audytu: 2026-07-19  
Zakres: aktualny `main` `a10678a13fb7869e548b4156ed21605e6b6d9828`  
Tryb: audit-only — bez zmian w kodzie produktu, contentu lub runtime.

## Decyzja

Certification nie ma obecnie canonicalnego runtime'u ani aktywnego contentu. Track
`cloud-certification` jest nadal zarejestrowany, a w aplikacji pozostają historyczne
projekcje, konfiguracja setupu i trasy, ale jedyny rzeczywisty runner odrzuca ten
track jako niedostępny. Nie należy reaktywować tych ścieżek ani dopinać ich do
Algorithms runtime'u.

Stage 4 pozostaje `BLOCKED`: niezależnie od luk Certification, `docs/plan.md`
rejestruje Stage 3 jako `NEEDS_CORRECTION`, z jednym aktywnym zadaniem
`S3-AUDIT-EVIDENCE-RERUN-01`. P6 jest dokumentacją delta, nie aktywacją implementacji
Stage 4.

## Fakty potwierdzone w repozytorium

| Obszar | Exact current path | Current owner | Semantyka obecna | Decyzja |
| --- | --- | --- | --- | --- |
| Rejestracja tracku | `src/domain/tracks/trackRegistry.ts` | shared track registry | Aktywny `cloud-certification`, family `certification`, nazwa „Cloud Certification”. | `rewrite` po ustaleniu finalnej tożsamości instancji GCP; nie dodawać aliasu. |
| Wybór tracku | `src/features/home/SelectTrackScreen.tsx` → `src/application/learningReadModels.ts` | shared presentation/read model | Track można wybrać i zapisać jako aktywny. | `keep` tylko jako mechanizm wyboru; opis i CTA muszą później wynikać z finalnej instancji. |
| Hub i setup | `src/features/practice/PracticeHubScreen.tsx`, `PracticeSetupScreen.tsx`, `practiceFlowModel.ts`, `sessionConfig.ts` | historyczny, shared practice shell | Tworzy niekanoniczne mode IDs (`learn`, `drill`, `review`, `weakArea`, `practice`, `default`), globalną długość i feedback oraz statyczny cloud roadmap. CTAs są enabled. | `delete` podczas P10; zastąpić rendererem konfiguracji z `CertificationFamilyRuntime`, nie branchami po track ID. |
| Runner practice | `src/features/practice/PracticeSessionScreen.tsx` | Algorithms presentation / Algorithms facade | Każda konfiguracja, która nie jest Algorithms, pokazuje jawne „Certification Practice unavailable”; nie tworzy sesji ani substitute contentu. | `keep` jako aktualną barierę do czasu P10; nie rozbudowywać go o Certification. |
| Family content hook | `src/tracks/cloud-certification/contentFamilyHandler.ts`, `src/content/catalogRepository.ts` | content installation boundary | Handler umie zwalidować i zainstalować `PublishedCertificationBank`, lecz nie ma zainstalowanego certification artifactu. | `keep` i zweryfikować kontrakt w P7. |
| Historyczne practice use cases | `src/application/certificationPracticeUseCases.ts` | osobny historyczny application module | Losuje pytania, zapisuje odpowiedzi i ręczne review poza przyszłym family runtime; importuje bezpośrednio repositories. | `delete` po zastąpieniu P8/P10; nie przenosić 1:1. |
| Historyczny exam model | `src/constants/exam.ts`, `src/features/exam/examGeneration.ts`, `scoringService.ts`, `src/tracks/cloud-certification/certificationProjections.ts` | rozproszone feature/constants/track modules | Stały blueprint 50/120 min, proste score/projections i rekonstrukcja z katalogu. | `delete` po P9/P10; wyjątkiem może być czysta, zgodna z profilem logika, jeśli P9 ją przejmie i pokryje testem. |
| Exam routes | `src/navigation/RootNavigator.tsx`, `src/constants/routes.ts`, `src/navigation/types.ts` | production RootNavigator | `EXAM`, `EXAM_REVIEW`, `RESULT` są zarejestrowane, lecz wszystkie trzy ekrany pokazują `EmptyState`. Brak call site poza rejestracją; `PRACTICE_EXAM_CTA` jest tylko statyczną wartością modelu. | `delete` przy P10 i zastąpić canonicalnymi Certification routes dopiero po P9 oraz zatwierdzonym UI. |
| Progress, review i shell | `cloudCertificationProgressSelectors.ts`, `learningReadModels.ts`, `AnswerReviewScreen.tsx`, `ProgressTab.tsx`, `shellModel.ts` | historyczne projections/presentation | Odczytują hipotetyczne stare attempts; Home rekomenduje Cloud/IAM, review pokazuje Correct answer/Explanation i zapisuje ręczne review przez stary use case. | `rewrite` lub `delete` w P10 zależnie od aktualnego family projection; nie zachowywać tekstów ani modeli jako kompatybilności. |

### Dokładna ścieżka dostępna użytkownikowi dziś

```txt
SelectTrackScreen (wybór cloud-certification)
→ zapis active track
→ PracticeHubScreen / PracticeSetupScreen
→ buildPracticeSessionConfig(... mode = default lub stare ID)
→ PracticeSessionScreen
→ "Certification Practice unavailable"
```

Niezależna trasa `EXAM` jest osiągalna przez rejestr navigatora, ale renderuje
`ExamScreen` z komunikatem „Exam runtime unavailable”. `EXAM_REVIEW` i `RESULT`
odpowiednio renderują niedostępne review i wynik. To są jawne bariery, a nie
działający flow. Stare `ExamScreen`, `ExamReviewScreen` i `ResultScreen` nie mają
już właściciela lifecycle, timera, draftu ani finalizacji.

## Mode delta

Canonicalne źródła (`docs/03-navigation-and-flows.md`,
`docs/15-certification-track-learning-system.md`,
`docs/17-training-runtime-and-interaction-spec.md`) wymagają dokładnie sześciu
non-simulation modes i `Exam Simulation`:

| Canonical mode | Wymagany właściciel i semantyka | Stan obecny | Decyzja / zależność |
| --- | --- | --- | --- |
| Diagnostic Baseline | `CertificationFamilyRuntime`; 40 unikalnych, brak shortening/reinsert, elapsed foreground, feedback po trwałym submit. | Nie istnieje jako ID, konfiguracja ani flow. | `rewrite` w P8; requires track blueprint i zatwierdzony content. |
| Focus Practice | Family runtime; 10/20/40 w jednym topic, shortening tylko w tym topic. | Nie istnieje; `learn`/`drill` nie są odpowiednikiem. | `rewrite` w P8; requires topic/competency taxonomy i content. |
| Scenario Practice | Family runtime; 10/20/40 w jednej competency, tylko scenario-valid items. | Nie istnieje. | `rewrite` w P8; requires scenario metadata i content. |
| Weak Area Review | Family runtime; eligible review evidence, 10/20, bez reinsert. | Stare `weakArea` jest tylko route stringiem, bez runtime. | `rewrite` w P8; requires canonical review evidence/projection. |
| Mixed Practice | Family runtime; versioned mixed blueprint, unique interleaving, declared shortening. | Stare `practice` jest tylko route stringiem. | `rewrite` w P8; requires blueprint i content. |
| Quick Review | Family runtime; do 10 due items, bez wypełniania niedue/unrelated items. | Nie istnieje. | `rewrite` w P8; requires due-queue eligibility. |
| Exam Simulation | Track instance + versioned official-source `ExamExperienceProfile`; absolute deadline, no pre-final feedback, revisioned draft, idempotent finalization. | `cloud-exam-simulation` i stale 50-item helpers istnieją, lecz brak runtime/profile/content; route jest unavailable. | `rewrite` w P9 po C2; nie używać stałych globalnych. |

Stary `CERTIFICATION_MODES` ma tylko `cloud-practice`, `cloud-exam-simulation` i
`cloud-review`; wszystkie są `enabled`. To nie spełnia ani liczby, ani nazw, ani
kontraktu canonicalnych mode'ów. Nie można go rozszerzać przez dopisywanie aliasów:
P8 ma ustanowić jeden family-owned mode contract.

## Tożsamość tracku

Wiążąca decyzja produktu ustala pierwszą instancję Certification jako:

```txt
family ID: certification
track ID: gcp-ace
display name: Google Cloud Associate Cloud Engineer
```

`cloud-certification` jest historycznym ID. Właściwy cutover usunie je
jednorazowo; nie wolno tworzyć aliasu, translatora ID, mapowania
kompatybilności, dual registration ani fallbacku. P7 ma po odblokowaniu Stage 4
zapisać tę tożsamość w canonicalnym contractcie content/track. Nie jest to już
blokada decyzyjna P7; nadal nie jest to zgoda na uruchomienie P7 przed formalnym
zamknięciem Stage 3.

## Content dependency

`GENERATED_BUNDLED_CONTENT_RELEASE` zawiera wyłącznie artifact `algorithms`.
`validateBundledContent` dla każdego zarejestrowanego tracku bez artifactu publikuje
`missing_artifact`, a `getCertificationContentCatalog()` rzuca `ContentUnavailableError`
do czasu instalacji. Obecne testy Certification instalują ręcznie mały bank
`fixture`; nie dowodzą, że jakikolwiek Certification content jest bundled,
approved lub dostępny w release.

P7 musi dostarczyć tylko contract i walidatory do cross-repo producer/consumer:

- track-scoped manifest i immutable artifact dla finalnej GCP instance;
- exact approval coverage, provenance i schema validation;
- mode/blueprint declarations zgodne z sześcioma modes;
- validation, która pozostawia `Certification unavailable`, gdy source/approval
  nie istnieją, bez wpływu na Algorithms.

P7 nie może tworzyć, uzupełniać ani zmieniać pytań. Manual checkpoint C1 jest
blokadą na realną publikację contentu.

## Official-profile dependency i global defaults

Nie istnieje implementacja `ExamExperienceProfile` ani wartości
`sourceUrl`, `sourceCheckedAt` czy `examGuideVersion` w `src/` lub `tests/`.
Zamiast tego `src/constants/exam.ts` narzuca globalne `EXAM_BLUEPRINT`,
`EXAM_QUESTION_COUNT = 50` oraz `EXAM_DURATION_MINUTES = 120`; `examGeneration.ts`
i `questionBankStats.ts` od nich zależą. Taki model nie może reprezentować
track-instance-owned, official-source-backed profile i jest sprzeczny z docs/04,
15 i 17.

Przed P9 checkpoint C2 musi dostarczyć dla finalnej GCP instance: profile ID i
version, publiczny official source URL, checked date, guide version, duration,
question count/range, navigation, answer changes, flagging, navigator, sections,
section return oraz timeout. Niejasna reguła blokuje faithful simulation;
`EXAM_*` nie jest dopuszczalnym źródłem zastępczym.

## Design dependency

Nie ma zatwierdzonego Certification UI packetu. W `docs/designs/` istnieją dwa
historyczne pliki HTML o Cloud w nazwie (`cloud_question_unified_focus_lab_style`
i `topic_roadmap_cloud_certification_unified`), ale nie mają `DESIGN.md` ani
approval record. Jedyny znajdowany approved packet dotyczy Algorithms Stage 3,
więc nie może być source of truth dla Certification.

Manual checkpoint C3 musi zatwierdzić konkretny packet dla:

1. każdego z sześciu practice modes;
2. setupu, shortening i fixed preparation failure;
3. exam navigation;
4. save/recovery;
5. flagów i sections tylko gdy profile je dopuszcza;
6. deadline;
7. ostrzeżenia o unanswered;
8. finalization;
9. results/review;
10. profile unavailable.

Bez C3 P10 nie ma design authority do tworzenia lub dostosowywania tych ekranów.

## Testy: co istnieje, czego brakuje

| Status | Testy / dowód | Znaczenie |
| --- | --- | --- |
| `partial` | `tests/canonicalRegistry.test.ts` | Dowodzi tylko obecnej rejestracji `cloud-certification` → `certification`. |
| `partial` | `tests/certificationScoring.test.ts`, `certificationProgress.test.ts`, `examGeneration.test.ts`, `scoring.test.ts`, `analyticsProjections.test.ts` | Pokrywają historyczne scoring/projections na fixture content i stałych `EXAM_*`. Nie dowodzą canonicalnego runtime'u. |
| `partial` | `tests/homeProgressProjections.test.ts`, `shellModel.test.ts` | Utrwalają historyczne Cloud presentation models; po P10 powinny zostać zastąpione, nie rozszerzone. |
| `blocking` | Brak testu CertificationFamilyRuntime | Nie ma testu dla wszystkich sześciu configów, selection/shortening, deterministic recommendation, one active session i no reinsert. |
| `blocking` | Brak profile-driven simulation suite | Brak testów profilu, absolute deadline, revisioned draft, resume, timeout outside app, finalization exactly once, no pre-final feedback i unanswered diagnostics. |
| `blocking` | Brak Certification cross-repo artifact test | Brak dowodu immutable approved artifactu, content lock i explicit unavailable behavior dla tej rodziny. |
| `blocking` | Brak approved Certification visual/a11y packet | Brak testów/captures dla C3 states i mobile/a11y behavior. |

## Dead-code i stale-path check

Następujące elementy są obecnie reachability-visible, ale nie są canonicalnym
runtime'em: stare Cloud setup mode IDs, `cloudTopics`, Cloud rekomendacje Home,
globalne `EXAM_*`, `certificationPracticeUseCases`, Certification projections,
historyczne review UI oraz three unavailable exam routes. Nie są usuwane w P6,
bo P6 jest audit-only i P10 musi wykonać kontrolowany cutover po content/profile/
design gates. Ich pozostawienie jest uzasadnione wyłącznie jako jawnie
niedostępne zachowanie do tego czasu; nie wolno dodać fallbacku ani nowej ścieżki
kompatybilności.

## Blokery i kolejność

| Bloker | Właściciel / warunek zamknięcia | Następne działanie |
| --- | --- | --- |
| Stage 3 nie jest `VERIFIED` | `S3-AUDIT-EVIDENCE-RERUN-01`: pushed green CI i real native evidence P/S | Nie aktywować implementacji Stage 4. |
| Final GCP instance identity | `gcp-ace` / `Google Cloud Associate Cloud Engineer` jest ustalone | P7 zapisuje contract po formalnym odblokowaniu Stage 4; bez aliasu lub dual registration. |
| Brak Certification content artifactu i approval coverage | Manual C1 + content producer | P7 przygotowuje walidację; bez source wynik ma pozostać `Certification unavailable`. |
| Brak official `ExamExperienceProfile` | Manual C2 | Nie zaczynać P9 ani nie używać `EXAM_*`. |
| Brak approved Certification UI packetu | Manual C3 | Nie zaczynać P10. |

Po zamknięciu Stage 3 następnym bounded taskiem jest P7
`S4-CERT-CONTENT-CONTRACT-01`; potem C1, P8, C2, P9, C3 i P10. P7 przygotuje
wyłącznie canonical contract infrastructure: nie wymaga pytań, provenance,
approvals ani human sign-off i nie publikuje artifactu. Do checkpointu C1 brak
Certification source ma pozostawić jawne `Certification unavailable`, bez
wpływu na Algorithms. Nie ma podstaw do łączenia tych kroków ani do przywrócenia
starego Cloud runnera.

## Weryfikacja audytu

- `npm run typecheck` — PASS.
- `npm run validate:content-boundary` — PASS.
- `npm run qa:static` — zatrzymał się wyłącznie w teście cross-repo, który
  wymaga czystego checkoutu i poprawnie odrzucił niecommitowany raport P6:
  `DIRTY_INTEGRATION_INPUT: ?? audit/certification/p6-cert-delta-audit.md`.
  Przed tym punktem recovery check i typecheck przeszły, a test runner wykonał
  219 testów: 218 PASS, 1 oczekiwane odrzucenie brudnego wejścia. Nie jest to
  wynik o runtime Certification ani powód do zmiany testu.
- `git diff --check` — PASS.

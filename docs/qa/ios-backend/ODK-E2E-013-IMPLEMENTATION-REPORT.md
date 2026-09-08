# ODK-E2E-013 — limity pytań

Data: 2026-09-08. Status: DONE — E2E zweryfikowane. Baza app 49bfd45, main = origin/main. GitHub QA run 34172135438: SUCCESS (Recovery QA gate i Multi-track content release contract). Surowe dowody ścieżki 007–012 usunięto po pushu.

## Fakty i decyzja

Practice Setup czyta requestedLengths ze zweryfikowanego pakietu. Nie oblicza ich z całego banku. Każdy z 9 aktywnych pakietów zawiera jeden free node. Razem 1053 pytania. Poniższe liczby odczytano z aktualnych bajtów generatedFreeNodePackages, po rozpakowaniu payloadu gzip. Liczby dotyczą dostępności w aplikacji, nie planowanych slotów curriculum.

| Track | Free node | Pytania | Tryby i wybory przed zmianą |
| --- | --- | ---: | --- |
| coding-interview-dsa-problem-solving | complexity_and_constraints | 158 | coding-interview-learn-approach: 10; coding-interview-guided-practice: 10,20,40; coding-interview-custom-practice: 10; coding-interview-weak-area-review: 10,20 |
| backend-system-design-interview | requirements_capacity_and_architecture_decomposition | 145 | design-interview-learn-framework: 1,10; design-interview-tradeoff-practice: 1,10; design-interview-weak-area-review: 1,10 |
| object-oriented-design-interview | requirements_use_cases_domain_vocabulary_and_model_boundaries | 136 | design-interview-learn-framework: 1,10; design-interview-tradeoff-practice: 1,10; design-interview-weak-area-review: 1,10 |
| frontend-system-design-interview | requirements_user_journeys_constraints_and_frontend_decomposition | 150 | design-interview-learn-framework: 1,10; design-interview-tradeoff-practice: 1,10; design-interview-weak-area-review: 1,10 |
| google-cloud-associate-cloud-engineer | organization_projects_policies_services_quotas_and_assets | 136 | certification-diagnostic-baseline: 40; certification-focus-practice: 10,20,40; certification-weak-area-review: 10,20; certification-quick-review: 10 |
| aws-certified-solutions-architect-associate | aws_secure_architecture_foundations | 4 | certification-focus-practice: 4; certification-weak-area-review: 4; certification-quick-review: 4 |
| microsoft-azure-administrator-associate-az-104 | entra_identity_lifecycle_and_authentication | 132 | certification-focus-practice: 10,20,40; certification-weak-area-review: 10,20; certification-quick-review: 10 |
| microsoft-azure-ai-fundamentals-ai-901 | responsible_ai_model_foundations_and_deployment_choices | 144 | certification-focus-practice: 10,20,40; certification-weak-area-review: 10,20; certification-quick-review: 10 |
| claude-certified-architect-professional-certification | solution_design_and_architecture | 48 | certification-focus-practice: 10,20,40; certification-weak-area-review: 10,20; certification-quick-review: 10 |

## Poprawka DSA

Pierwsza hipoteza niezależnego przeglądu wskazała wejście Settings i tryb Learn. Odrzucono ją: retest z Practice → Custom Practice także pokazał wyłącznie 10. Ponadto zadanie 014 usuwa wejście Settings. Poprawka samej nawigacji nie rozwiązałaby problemu.

Practice Hub przekazuje topic.id; PracticeSessionScreen ustawia roadmapNodeId. Selektor pobiera cały free node (158 pytań). Profil Custom ma jednak [10] i opisuje wybór mental unit. Same mental units mają 18, 20, 20, 20, 18, 20, 20 i 22 pytania. Zwiększenie limitu bez uzgodnienia scope byłoby błędne.

Najmniejsza spójna zmiana: nowa wersja profilu i immutable pakietu Custom z [10,20,40], domyślnie 10, exact_free_node zgodnym z aktualnym UI. Oba tryby feedbacku pozostają. Historyczne piny zachowują stare zasady. Zmiana nie dodaje pytań ani nie omija walidacji treści.

Niezależna walidacja briefu: gpt-5.6-luna / max, bez narzędzi. Zgodność 0,94; prostota 0,86; ryzyko 0,84; utrzymywalność 0,90. Minimum 0,84, APPROVE. Inwentaryzacja: osobny przebieg gpt-5.6-luna / max. Kontroler zweryfikował rozbieżną hipotezę względem kodu i iOS.

## Dowody i testy

Bazowy Maestro 2026-09-08_020810: exit 0, otwarto Custom Practice i potwierdzono 10; obejrzano 013-dsa-before.png. Nie rozpoczęto sesji. iPhone 17/iOS 26.4, konto EN/dark.

Nowe testy przed aktualizacją pakietu: 11/13 PASS, 2 FAIL. Oczekiwane awarie potwierdzają brak 20/40 w obecnym profilu. Testy obejmują rzeczywistą selekcję unikalnych pytań i zachowanie obu feedbacków. Końcowe wyniki i E2E pozostają do wykonania.

## Osobne rozbieżności

AWS ma tylko 4 dostępne pytania. Prawidłowy limit 4 nie naprawia małej puli. Zadanie 096 ma rozbudować treść według jednostek mentalnych i celów nauki, bez atrap lub samych metadanych.

Trzy tracki Design mają 136–150 pytań, ale profile [1,10]. To osobny kontrakt producenta i runtime. Zadanie 097 ma ustalić i wdrożyć rzeczywisty wybór dłuższych sesji do 40 dla odpowiednich trybów. Nie przedstawia się tej rozbieżności jako naprawionej przez zmianę DSA.

Brak próśb PO: licznik 0. VoiceOver pominięto. Zadanie 013 pozostaje aktywne do końcowego retestu.

## Naprawa źródła pakietów

Pełny test producenta początkowo miał 2/13 PASS i 11 awarii ENOENT. Commit upstream 2c2138d usunął aktywnie wskazany release patternly-launch-2026-08-25-01. Przywrócono wyłącznie jego release.json oraz generated-bundled-content.mjs z producer pina dc02b8021d14f573d9a033f8f5f3117b45087438. Bajty sprawdzono względem Git: identyczne. Pozostałych usuniętych wydań nie przywracano. Są to kanoniczne dane wejściowe, nie tymczasowe dowody E2E.

Osobna walidacja briefu gpt-5.6-luna / max: zgodność 0,96, prostota 0,90, ryzyko 0,88, utrzymywalność 0,90; minimum 0,88, APPROVE. Podniesiono profileVersion do 2 w profilu, briefie tracka i jego kanonicznym rejestrze. Pierwszy przebieg po odtworzeniu release miał 7/13 PASS; 6 awarii wskazało pominięty rejestr wersji w track-briefs.mjs. Uzupełniono tę samą zmianę wersji. Wynik końcowy poniżej po wykonaniu.

Retest wejść wszystkich pozostałych 8 tracków: 2026-09-08_021747, exit 0. Obejrzano 8 screenshotów. Design pokazuje 1/10. Ekrany certyfikacyjne pokazują free node i niedostępne pozostałe node’y; osobny przebieg przewija do ich kontrolek długości. Żadnej sesji nie rozpoczęto.

## Końcowe testy producenta przed budową

`node --test tests/bundledFreeNode.test.mjs`: 13/13 PASS, 0 skipped, exit 0. Obejmuje sześć nowych sesji Custom (10/20/40 × oba feedbacki), granicę node, błędny feedback i historyczny pakiet 0004.

`node --test tests/trackBriefs.test.mjs tests/freeNodeInventory.test.mjs`: po korekcie 13/13 PASS, 0 skipped, exit 0. Pierwszy przebieg miał 12/13: generator czytał niekanoniczny, usunięty release przed walidacją pinu. Teraz odrzuca błędny releaseId przed odczytem. Późniejsza kontrola wersji, commita i checksum pozostała. Osobna walidacja briefu gpt-5.6-luna / max: 0,98 / 0,96 / 0,93 / 0,96; minimum 0,93, APPROVE.

Pełna lista 112 node’ów jest w ODK-E2E-013-ROADMAP-INVENTORY.md. Niezależny audyt gpt-5.6-luna / max potwierdził 9 current i 103 locked. Nie utożsamiono metadanych curriculum z dostępnością pytań.

## Niezależne QA źródeł implementacji

Data: 2026-09-08. Werdykt: **PASS dla źródeł; końcowy zapis artefaktu 0005 pozostaje do wykonania po commicie**. Przejrzano wyłącznie siedem wskazanych plików w `patternly-content`; nie czytano dużych restored release ani nie uruchamiano UI/usług.

- `profileVersion` 2 jest zgodny w profilu, track briefie i kanonicznym rejestrze; `profileId` pozostaje zachowany. `configurationVersion` 2, `custom-practice` `[10,20,40]` oraz `exact_free_node` są spójne z package version `0005`.
- Builder wybiera cały zamknięty `complexity_and_constraints` node, wymaga obu feedbacków, odrzuca mental-unit scope i nie dodaje fallbacku dla brakujących release. Walidacja istniejącego kodu nadal wymaga zamkniętego package-local inventory.
- Testy obejmują rzeczywiste długości 10/20/40, unikalne item IDs, oba feedbacki, obcy mental unit/feedback oraz historyczny package `0004`, który zachowuje poprzedni kontrakt mental-unit.
- Końcowy log `/private/tmp/patternly-path04/013-producer-final-tests.log` ma 13/13 PASS, 0 failed, 0 skipped; log został tylko odczytany, bez ponownego uruchamiania testu.

Ograniczenie: w `artifacts/bundled-free-nodes/coding-interview-dsa-problem-solving` obecny jest trwały artefakt `0004`, ale nie ma jeszcze `0005`, mimo że konfiguracja wskazuje `0005`. Test potwierdza generację in-memory i zapis immutable w tymczasowym fixture, nie obecność finalnego artefaktu w repo. Po zatwierdzeniu czystego commita źródeł trzeba wykonać builder `0005` i osobno zweryfikować jego manifest, profile version 2, scope oraz brak nadpisania. Working-tree zawiera także niezależną zmianę `scripts/product/free-node-inventory.mjs`; nie była częścią tego siedmio-plikowego audytu.

## Integracja pakietu i brama aplikacji

Źródła producenta zapisano w b21c745518076de5b69b9dbfd204314a8b23217e. Oficjalny builder utworzył immutable pakiet 0005, a walidator pakietu zakończył się exit 0. Manifest potwierdza 158 pytań, profileVersion 2 i Custom Practice 10/20/40 z exact_free_node. Artefakt zapisano w 88278fabd1b1c8bfe3e96c22dfe42dd76cb5cca6. Zamyka to ograniczenie wcześniejszego QA źródeł. Oba commity czekają na push pełnej ścieżki.

Aplikacja używa nowego pinu i oficjalnie wygenerowanego bundled runtime. Pakiet 0004 pozostaje jawnie retained dla zapisanych sesji. Nie zmieniono jego bajtów. Nowy Custom sprawdza granicę free node i odrzuca mentalUnitId. Wybór bez wskazanej długości przyjmuje default profilu; jawny wybór użytkownika zostaje zachowany. Usunięto wymuszony default 20 tylko z Practice Setup.

Dodatkowe walidacje briefu, każda gpt-5.6-luna / max, APPROVE:
- Default profilu: 0,98 / 0,96 / 0,93 / 0,97; minimum 0,93.
- Granica scope runtime: 0,98 / 0,95 / 0,91 / 0,96; minimum 0,91.
- Konkretne piny admission i aktualizacja testu resetu formularza: 0,98 / 0,95 / 0,92 / 0,96; minimum 0,92.

Końcowe testy zachowania aplikacji: 28/28 PASS, 0 skipped, exit 0. Pliki: practiceSessionConfig, contentPackageRuntime, contentPackageResolver, contentPackageRuntimeCutover, contentReleaseCrossRepo. Dodatkowo trackAdmission i practiceRouteGuards: 9/9 PASS.

Pierwsza pełna brama: 875/878 PASS. Trzy błędy dotyczyły starych oczekiwań: komunikatu dla długości 30, resetu formularza do 20 i poprzedniego pinu Coding. Poprawiono dokładne kontrakty testów i piny na zweryfikowane wartości producenta. Nie osłabiono bram admission.

Końcowe npm run qa:static: exit 0, **878/878 PASS**, 0 failed, 0 skipped. Typecheck, recovery inventory, content boundary i runtime privacy boundary: PASS.

Retest bazowy certyfikacji 2026-09-08_022707: pięć ekranów limitów obejrzano. GCP, AZ-104, AI-901 i Claude miały 10/20/40 z domyślnym 20; AWS miał 4. To stan przed poprawką defaultu.

Retest 2026-09-08_024611: iOS potwierdził default 10 oraz wybór 20 i 40. Obejrzano trzy obrazy kontrolek i ekran rzeczywistej sesji z licznikiem 1 of 40. Końcowa asercja Maestro nie przeszła, bo selektor zawierał numer starej sesji 1. Aplikacja poprawnie rozpoczęła nową sesję. Kontynuacja używa zmiennej tożsamości sesji i stałej asercji długości 40.

## Końcowe QA i ujawniony problem synchronizacji

Niezależny app QA gpt-5.6-luna / max: PASS WITH GAPS. Nie znalazł błędu produkcyjnego nowego wyboru długości, defaultu, scope ani pinów. Luka historycznego prepare została uzupełniona: stary pakiet 0004 przygotowuje 10 unikalnych pytań ze wskazanej jednostki mentalnej we właściwym free node. Brief: 0,99 / 0,98 / 0,95 / 0,98; minimum 0,95, APPROVE. contentPackageResolver: 7/7 PASS, exit 0. Integralność locka sprawdza oficjalny synchronizator; nie dodano testu dublującego ten skrypt.

Retest sesji 2026-09-08_024916: 13 poleceń COMPLETED, exit 0. Potwierdzono konfigurację 40, licznik pierwszego pytania, poprawną odpowiedź i wybrano End and view summary. Obejrzano dowody startu i odpowiedzi. Screenshot nazwany partial-summary uchwycił jeszcze poprzednią klatkę, więc nie jest dowodem wizualnym podsumowania. Następny flow znalazł i nacisnął właściwy przycisk powrotu z podsumowania.

Wcześniejsza kontynuacja 2026-09-08_024808: 3 COMPLETED, 1 FAILED; dokładny tekst 1 of 40 był zgrupowany w dostępności. Zastąpiono go istniejącym identyfikatorem licznika, bez zmiany aplikacji.

Po zapisie wyniku backend odrzucił synchronizację: POST 400, account_sync_rejected, invalid_request. Zadanie pozostaje IN_PROGRESS. Nie uznano samego startu sesji za pełny sukces E2E. Analiza dotyczy rozmiaru projekcji wyniku i kontraktu backendu.

Próby przejścia do niezależnych konfiguracji 2026-09-08_025010 i 025222 zatrzymał ekran Account recovery. W drugim przebiegu Go back wywołało GO_BACK was not handled. Osobny konkretny problem zapisano jako aktywne ODK-E2E-098. Nie wylogowywano konta i nie usuwano jego danych. Retest samych kontrolek przeniesiono na wcześniej utworzony osobny symulator gościa.

Retest 2026-09-08_025556 na osobnym symulatorze gościa EN/light: pięć konfiguracji certyfikacyjnych przeszło. Obejrzano wszystkie pięć screenshotów. GCP, AZ-104, AI-901 i Claude pokazują 10/20/40 z defaultem 10; AWS pokazuje prawdziwy limit 4.

Pełne npm test producenta: 155/158 PASS, 3 FAILED, 0 skipped. Błędy: contentApprovals — niezgodny commit akceptacji; contentWorkflowContract — source-only readiness zamiast verified; reviewPackets — pending zamiast approved. Pliki tych testów i wskazane evidence są identyczne względem 2c2138d. To istniejące rozbieżności bramy wydania. Zapisano osobne ODK-E2E-099 po produktach i bramach 082–088. Nie zmieniano danych akceptacji właściciela, aby uzyskać zielony test.

Dokładny wynik certyfikacji 2026-09-08_025556: 67 COMPLETED, 0 FAILED, exit 0.

Niezależna reprodukcja sync gpt-5.6-luna / max: training_session_result ma 1 579 znaków JSON. Przekracza limit training_session_summary: 65 789 dla abandoned i 65 790 dla completed przy limicie 65 536. conditionalReinsertSlots zajmuje 44 333 znaki. Backend schema wskazuje mutations[0].state: progress_state_too_large. Rozważana kompakcja wymaga jeszcze sprawdzenia planFingerprint i odtworzenia historii; sama zgodność isTrainingSession nie dowodzi bezpieczeństwa tej zmiany.

## Naprawa limitu backendu i zamknięcie

Kompakcję terminalnej sesji odrzucono: conditionalReinsertSlots należą do planFingerprint, a materializacja zapisałaby niepełny rekord kanoniczny. Zmieniono właściwy komponent odbierający pełny model. Backend ma jedną stałą MAX_SERIALIZED_JSON_UTF16_CODE_UNITS = 128 * 1024, używaną w progress/contracts.ts i users/merge.ts. Zachowano jednostkę JSON.stringify(state).length, kody błędów, limity liczby rekordów oraz limit całego HTTP requestu. Nie zmieniono danych sesji, pinu ani fingerprintu. Zbiorczy budżet batch/adoption ma osobne aktywne ODK-E2E-100.

Brief gpt-5.6-luna / max: 0,97 / 0,90 / 0,86 / 0,95; minimum 0,86, APPROVE. Implementacja delegowana gpt-5.6-luna / max. Końcowe niezależne QA kodu gpt-5.6-luna / max: PASS.

Trwała syntetyczna fixture regresyjna backendu powstała z rzeczywistego runtime pakietu 0005, bez konta i prywatnych danych. Przy identyfikatorze stosowanym przez aplikację ma 78 840 jednostek UTF-16, 40 pytań i 36 slotów. To plik wejściowy testu, nie tymczasowy dowód E2E. Wcześniejsza reprodukcja QA używała krótszego identyfikatora; rozmiar zależy także od długości tożsamości wystąpień.

Backend: progressContracts 3/3 PASS (pełna fixture, zachowanie payloadu, granica, Unicode, caps100/1000). merge + appObservability + progressStorage na izolowanym projekcie demo emulatora: 11/11 PASS, 0 skipped. Typecheck, lint, OpenAPI check, build i diff check: PASS. Nie wykonywano pełnego CI providerowego backendu. Restart lokalnego backendu zachował cztery istniejące klucze konfiguracji; emulator i dane konta nie były resetowane.

iOS Retry sync 2026-09-08_031930: backend POST200 i GET200, ekran Your account is ready. Flow miał3 COMPLETED/1FAILED, bo oczekiwał automatycznego Home zamiast przycisku Settings. Kontynuacja032146 potwierdziła gotowe konto i wejście Settings; 6COMPLETED/1FAILED przez otwarcie zachowanego ostrzeżenia098 po naciśnięciu dolnego obszaru i asercję nieużywanego home:root. Ostrzeżenie obejrzano i pozostaje udokumentowane w098.

Końcowy retest032327: 6COMPLETED, 0FAILED. Zamknięto panel diagnostyczny, otwarto Home i potwierdzono właściwe wejście zmiany tracka. Screenshot Home obejrzano: ostatnia sesja Custom Practice, 2 odpowiedzi łącznie z wcześniejszą sesją, brak błędu sync.

Niezależny od UI odczyt emulatora: terminalna sesja40, status abandoned, 78 844 jednostki JSON, 36 slotów, pakiet0005 i jedna zapisana próba. Osobny training_session_result nie powstaje dla abandoned: getAlgorithmsPracticeSummaryProjection odtwarza częściowe podsumowanie z sesji i prób. Zachowano ten kontrakt. Pierwsza kontrola pomocnicza błędnie oczekiwała osobnego rekordu wyniku; poprawiona kontrola zgodna z kodem: PASS.

ODK013 zakończono i usunięto z aktywnej tabeli po rzeczywistym E2E. Otwarte rozbieżności:096,097,098,099,100. Brak blokera PO; licznik0. Push app/backend nastąpi po pełnej ścieżce013–015. Dowody tymczasowe pozostają do jej pushu.

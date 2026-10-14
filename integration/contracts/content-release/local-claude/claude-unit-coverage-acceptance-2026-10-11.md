# CC-04 — pokrycie wymaganych jednostek egzaminacyjnych

11.10.2026. **CC-04 wdrożone lokalnie — niezależny odbiór PASS.** Aktywacja nowego pakietu w aplikacji pozostaje CC-05, bez publikacji.

## Kryteria i reguła

Claude otrzymuje `CompletionRule` V3, osiem pozostałych banków zachowuje V2. Każdy rozdział zachowuje minimum `max(20, ceil(4 × units / 20) × 20)` i przynajmniej 16 poprawnych z ostatnich 20 kwalifikujących prób. Dodatkowo każda z 53 wymaganych jednostek potrzebuje czterech różnych pytań, których ostatnia zatwierdzona odpowiedź jest poprawna. Powtórzenia nie zwiększają pokrycia, partial/incorrect odbierają zaliczenie tego pytania, późniejsza poprawna odpowiedź przywraca je. Kolejność rozstrzyga istniejące `answeredAt`, potem `attempt.id`; próby muszą pochodzić z dokładnego track/contentVersion/SHA i mieć trwałe zatwierdzenie.

Nie zapisujemy drugiej bazy postępu, nie usuwamy historii i nie przenosimy zaliczeń między wersjami. Cowork pozostaje osobnym `authored_not_runtime_admitted` suplementem kursowym; partner-only excluded. Zaliczenie oznacza spełnienie reguły ćwiczeń, bez obietnicy gotowości lub wyniku egzaminu.

Rozdział raportuje osobno V (brak wolumenu), C (brak poprawnych różnych pytań) i dolną granicę dalszej pracy `max(V,C)`. Ścieżka sumuje dolne granice rozdziałów. Jakość jest rzeczywistą jakością ostatnich 20 prób lub unknown, nigdy wnioskiem z zera wolumenu. V=0/C>0 pozostaje nieukończone i kieruje do brakujących jednostek. V=0/C=0 przy słabej jakości pozostaje nieukończone bez obietnicy konkretnej liczby prób do naprawy.

## Projekt i zakres

Niezależny przegląd Luna High: bazowy projekt fit 0,94 / simplicity 0,90 / risk 0,86 / maintainability 0,90, min 0,86. Reguła zawiera pełny jawny inventory jednostek w każdym rozdziale; walidacja producer/APP wymaga dokładnej zgodności z pytaniami i >=4 różnych questionIds na jednostkę. Minimalna różnica kontraktu: V3 zachowuje pola rozdziału V2 i dodaje `units: [{mentalUnitId,requiredCorrectQuestionCount:4}]`.

Preflight ujawnił rzeczywistą nieosiągalność: konfiguracja trybu, runtime, setup i sessionConfig ograniczały focus practice do D01, mimo pytań w pozostałych rozdziałach. Przyjęta korekta ma min 0,82 (fit 0,94 / simplicity 0,86 / risk 0,82 / maintainability 0,84): istniejący tryb i żądanie mentalUnitId z dokładnym pinem pakietu rozwiązuje jednostkę V3 do jej zweryfikowanego rozdziału. V2 i nieskopowany D01 zachowują zachowanie. Bieżąca kontrola Premium dla pytań spoza freeNode pozostaje właścicielem dostępu; Free nie zmniejsza wymaganej listy tematów. Przy braku dostępu UI ma jawnie pokazać blokadę, nie ukończenie.

Druga korekta dotyczy doboru: priorytet nietkniętych jednostek nie wystarcza po regresie już ćwiczonej jednostki. Istniejący selektor otrzymuje dokładne IDs pytań z brakującym dowodem; zachowuje pozostałą politykę fairness, bez drugiego schedulera. Resume ponownie sprawdza ten sam zakres i pin.

Ownership: cc04_core Luna High — evaluator, typy i walidacja APP; cc04_consumers Luna High — plany, postęp, dobór i istniejąca ścieżka ćwiczeń; root — producer, natywny podgląd tylko do odczytu, dokumentacja; cc04_review Luna High — niezależny projekt i odbiór, bez edycji.

Przegląd wykrył też konieczność zachowania tożsamości jednostki w kalendarzu: dwa tematy z jednym brakującym zaliczeniem każdy wymagają dwóch rzeczywistych sesji, a nie jednej wspólnej sesji rozdziału. Zatwierdzona korekta min 0,82 (fit 0,94 / simplicity 0,83 / risk 0,82 / maintainability 0,82): osobne legalne bloki jednostek, rzeczywiste dopełnienie sesji i koszt, z odjęciem ich wolumenu od pozostałego minimum rozdziału. `requiredResponses` pozostaje dolną granicą `max(V,C)`; `newResponses` i kalendarz opisują faktyczne pytania w sesjach. Weryfikacja tej korekty pozostaje poniżej; sam przegląd projektu nie jest dowodem poprawności runtime.

Prognoza pozostaje warunkowa: przyszłe poprawne odpowiedzi mogą zaspokoić brak pokrycia; nie są bieżącym zaliczeniem evaluatora. Aktywna sesja może uniknąć zdublowanego bloku tylko dla różnych pozostałych questionIds w dokładnej jednostce/pinie, które nie mają ostatniego poprawnego wyniku. Po zatwierdzeniu błędnej odpowiedzi C pozostaje i projekcja planuje dalszą legalną pracę. Słaba jakość ma ograniczony pierwszy blok ćwiczeń, lecz nieograniczoną/nieznaną pracę do poprawy wyniku.

Dodatkowe opcjonalne `PlanningSessionDemand.scopeRefs` zachowuje tożsamość pojedynczej jednostki w ephemeral projekcji/kalendarzu, bez kodowania jej w ID i bez migracji planu: fit 0,93 / simplicity 0,91 / risk 0,90 / maintainability 0,90, min 0,90.

## Dowody

CONTENT: 50/50 testów — course-links, CC-02 coverage, historyczny audyt, shared-contract, packageCompletionTransport. Transport sprawdza V3, wadliwy/zamieniony/niedostateczny inventory, zachowanie historycznych kandydatów V2 oraz dokładną zgodność natywnego fixture z finalnymi źródłami (53×4 rzeczywiste IDs). Validate/test 918 i build PASS. Finalny kandydat `.temp/cc04-final-dist`, SHA `12e6c8637b112af9e48ca870bb80d89f9db6ad7d1949c51efceb37572a6cd0bd`, wersja `ccarp-2026.10.11-capacity-v1-bizq02-v2-bizq03-planning-v2-cc02-v1-cc03-v1-cc04-v3`.

Pierwszy kandydat został poprawnie przyjęty przez walidację artefaktu, lecz pełny runtime catalog odrzucił niespójną politykę planowania: scope focus practice nadal opisywał tylko część jednostek. Naprawiono właściciela polityki w curriculum, zamiast usuwać ją z kandydata. Focus practice zawiera teraz 53 wymagane scope; tryby review zachowują dziewięć scope D01 i jawne unknown dla 44 pozostałych jednostek. Estymaty są authored, bez udawania obserwowanych danych.

Finalny kandydat przechodzi pełne `buildCanonicalRuntimeCatalog`; test runtime sprawdza przygotowanie i resume wszystkich 53 jednostek, priorytet brakujących pytań, rzeczywistą minimalną sesję czterech pytań oraz odrzucenie niezgodnego pinu, zakresu i inventory (3/3 PASS). Jednostki z pulą 4–9 pytań używają istniejących długości żądania 10/20/40, lecz rzeczywista sesja jest ograniczona pełną pulą tej jednostki. Priorytet brakujących pytań nie skraca sesji do jednego pytania; pozostałe miejsca wypełnia ta sama jednostka.

Dodatkowe przeglądy projektu: korekta minimalnej pojemności sesji min 0,83 (fit 0,93 / simplicity 0,84 / risk 0,84 / maintainability 0,83), korekta polityki planowania min 0,83 (0,93 / 0,87 / 0,84 / 0,83). Obie zachowują istniejący tryb i wspólną ścieżkę runtime, zamiast dodawać osobny scheduler lub niejawny fallback.

Natywny fixture używa rzeczywistego evaluatora, finalnych tożsamości jednostek/pytań oraz zatwierdzonych prób wyłącznie w pamięci. Stan kontrolny ma 260/260 prób, jakość każdego rozdziału >=80% i jedną brakującą poprawną odpowiedź w jednej jednostce; pozostaje nieukończony z C=1/minAdditional=1. Drugi spełnia pełny próg i jest ukończony. Testy tych stanów oraz istniejącego proposal fixture: 6/6 PASS. To dowód kontrolowanej ścieżki, nie zapisanej historii użytkownika ani aktywowanego nowego bundle.

iPhone 17, iOS 26.4, istniejące urządzenie, content_size large: pełny flow `.maestro/cc04-unit-coverage.yaml` PASS, oba screenshoty sprawdzone wizualnie. `.temp/cc04-native-final/2026-10-11_222257/.../takeScreenshot/cc04-missing-unit.png` pokazuje „Objective 6 — 3 of 4” i jeden temat wymagający ćwiczeń; `cc04-completed.png` pokazuje spełnioną regułę. Komunikaty są w pełni widoczne; toast ostrzeżeń developerskich zachodzi tylko na footer. Fixture counters pozostają 0, bez akceptacji/zapisu planu. To odbiór kontrolowanego fixture, nie persisted-history end-to-end.

Preflight natywny: pierwsza próba pozostała w wcześniejszym exam fixture, który miał pierwszeństwo renderowania; próba wyjścia bez uruchomienia aplikacji trafiła na ekran systemowy, a po launch aplikacja była już na Home. Zamiast powtarzać niepewną nawigację, finalny flow uruchamia fixture od zimnego startu; jego istniejący handler otrzymał `getInitialURL`, analogicznie do exam fixture. Nie resetowano danych ani aktywnej zapisanej sesji.

APP: root targeted core/canonical/fixture 30/30 PASS (w tym realny finalny kandydat, bez SKIP), admission lifecycle 13/13 PASS. Ten ostatni jest dowodem komponowanym: rzeczywisty runtime V3 rozwiązuje jednostki/pytania, a istniejące testy i źródła lifecycle potwierdzają kontrolę wszystkich itemów przed trwałym startem i przy resume; nie jest to nowy end-to-end Claude lifecycle test. Locale parity 4/4 PASS. Końcowa consumer integration: 152/152 PASS; `npm run typecheck` i `git diff --check` PASS. Zestaw obejmuje fullGoal workload, Home, calendar, Progress JSX/presentation, canonical runtime/selection, mode capacity, pace, guidance, proposal generator/presentation, next-session guard i locale parity. Niezależny finalny odbiór Luna High: **PASS**, 162/162 testów (17 plików, z nested subtests), 0 failed, niezależny typecheck i diff check exit 0. Nie znaleziono pozostałego defektu źródłowego. Końcowa korekta samego tekstu zastąpiła obietnicę przyszłej estymaty neutralnym komunikatem o jej niedostępności; presentation + locale parity ponownie PASS.

Przyjęte przypadki: C=2 w dwóch jednostkach oznacza dwie czteropytaniowe sesje (8 rzeczywistych odpowiedzi, M=2); V=20/C=20 nie znika po pięciu niezwiązanych powtórkach/aktywnej pracy; V=1/C=0 przy puli 4 ma rzeczywistą sesję 4 i dokładny koszt jednostki. Osobne testy obejmują jakość-only poza D01, V-only kontynuację i blokadę Premium, aktywną sesję Premium w V3, nieprawidłową późniejszą odpowiedź oraz zachowanie scopeRefs w kalendarzu. Estymator V3 testowany na zatwierdzonej regule nałożonej na API kanonicznego track; test finalnego artefaktu 918/53 jest osobnym dowodem powyżej.

Późniejsza korekta copy ExecutionSummary nie zmieniała sekcji Completion rule ani jej danych; natywne zdjęcia pozostają dowodem tej sekcji. Nowe komunikaty o nieznanym zakresie najbliższej sesji mają test presentation i parity, bez osobnego powtórzenia wizualnego całego ekranu. Usunięto dwa zastąpione i nieużywane klucze locale po sprawdzeniu wszystkich referencji; ostatnia parity 4/4 PASS.

## Jawna granica estymaty najbliższej sesji

Coordinator propozycji nie posiada wyniku weryfikacji Premium, a Home wybiera konkretną dostępną jednostkę na podstawie tego wyniku. Dlatego nieskopowana estymata V3 w trakcie nauki nie może uczciwie przedstawiać domyślnego D01 jako przyszłej sesji. Bez jednoznacznego zakresu zwraca `missing_scope_estimate`, a legalne opcje najbliższej sesji są puste. To jawny brak estymaty, nie brak pytań ani przećwiczalnego materiału. Pełny workload/kalendarz nadal zawiera legalne bloki wszystkich wymaganych jednostek; Home prowadzi do realnego tematu albo weryfikacji Premium. Aktywna sesja ma dokładne itemy i zachowuje estymatę pozostałej pracy. V2 i ukończone V3 zachowują dotychczasowe zachowanie.

Nie dodano niezweryfikowanego dostępu, nowego kontraktu billing ani migracji planu tylko po to, by wyświetlić liczbę. Przyszła estymata nowej sesji V3 wymaga przekazania tego samego wybranego zakresu/dostępu co rzeczywista akcja Home. Finalna korekta ma niezależnie oceniony projekt min 0,86 (fit 0,94 / simplicity 0,88 / risk 0,87 / maintainability 0,86); obejmuje także omitted/unknown completion, zachowując pierwszeństwo dokładnej aktywnej sesji. Wynik wykonanych testów zostaje zapisany w dowodach.

## Właściciele zmian i granice

- CONTENT: `content/catalog.json`, curriculum Claude i `scripts/content/question-contract.mjs` — reguła V3, pełny inventory oraz legalna polityka scope; `tests/packageCompletionTransport.test.mjs` — transport i zgodność finalnego źródła. Bank pytań i linki CC-02/03 pozostają podstawą bez ponownego redagowania w CC-04.
- APP: `packageCompletionRule.ts` oraz canonical contracts/validation — jeden evaluator V2/V3; canonical runtime/selector, productModeConfig, PracticeSetup/sessionConfig — osiągalne jednostki i ten sam zakres przy resume.
- APP: generator propozycji, evidence, Home snapshot, pace/next-session/full-goal projekcje i guidance — wspólne V/C/minAdditional, rzeczywiste legalne sesje i jawny dostęp Premium; Home/Progress presentation — pokrycie i tri-state jakości.
- Odbiór: versioned `.maestro/cc04-unit-coverage.yaml`, read-only fixture z 212 realnymi IDs, testy i siedem locale. Smoke-only otwieranie proposal fixture obsługuje także zimny start, analogicznie do istniejącego exam fixture.

Nie dodano drugiej bazy postępu ani nowej ścieżki płatności. V2 pozostaje potrzebne ośmiu bankom i istniejącym zapisanym propozycjom. Nie usuwano historii, aktywnej sesji ani niezwiązanych zmian PERSIST. Brak synchronizacji aktywnego bundle (845 pytań), commit/push i publikacji; aktywacja finalnego 918/V3 kandydata należy do CC-05.

## Odtworzenie konsumenckiej weryfikacji

W katalogu APP:

```sh
node --import tsx --test src/application/learningPlan/fullGoalWorkloadProjection.test.ts src/application/homeRequiredCoverageAction.test.ts src/domain/learning/planningCalendar.test.ts src/features/home/progressPlanPresentationModel.test.ts src/features/home/tabs/progressScheduleEntry.test.mjs src/features/home/learningPlanWorkloadPresentation.test.ts src/application/canonical/CanonicalTrainingRuntime.test.ts src/application/canonical/CanonicalTrainingSelection.test.ts src/content/canonical/productModeConfig.test.ts src/domain/learning/paceForecast.test.ts src/application/learningPlan/targetDateGuidancePresentation.test.ts src/domain/learning/learningPlanProposalGenerator.test.ts src/application/learningPlan/nextSessionTimeEstimate.test.ts src/features/home/learningPlanProposalPresentation.test.ts src/i18n/i18nLocaleParity.test.ts
npm run typecheck
```

Finalny artefakt tworzony jest istniejącym builderem CONTENT, tylko dla Claude, do `.temp/cc04-final-dist`; jego exact source pin podano powyżej. Opcjonalny probe rzeczywistego kandydata w `claudeCoverageReachability.test.ts` wykonano lokalnie bez SKIP; w czystym checkout bez tego kandydata pozostają samodzielne testy V3, a integrację źródła odtwarza CC-05.

# CC-05 — lokalny kandydat Claude

Status: **niezależny PASS lokalnego CC-05, z luką wyłącznie wydawniczą**. Zakres: lokalny odbiór i synchronizacja finalnych zmian CC-02/03/04, bez commitów, publikacji i zmiany formalnych admission/release approvals.

## Kryteria i korekta planu

Kandydat musi zachować exact zgodność źródło–artefakt–bundle: 918 pytań, 53 jednostki egzaminacyjne, siedem rozdziałów, reguła V3. Każde pytanie ma dokumentację oraz właściwy moduł/sekcję kursu z informacją o koncie. Cowork pozostaje osobnym suplementem `authored_not_runtime_admitted`; materiał partner-only jest wyłączony. Osiem pozostałych banków i ich tożsamości muszą pozostać niezmienione.

Istniejący sync wymaga czystego, zapisanego producer HEAD, buduje wszystkie banki, zakłada inventory 943/16622 i dopuszcza zmianę treningu wyłącznie przy niezmienionej liczbie pytań. Nie obsługuje rozszerzenia Claude 845→918. Najmniejsza spójna korekta to jawny lokalny tryb istniejącego narzędzia: budowa tylko Claude, fingerprint rzeczywistych wejść, exact zapis odbioru, kontrolowane scalenie z ośmioma bieżącymi artefaktami i atomowa wymiana kompletnego pakietu. Nie wykorzystuje zamrożonej zgody innego kandydata.

Niezależny przegląd projektu: dopasowanie 0,94; prostota 0,83; ryzyko 0,84; utrzymywalność 0,82; minimum **0,82**. Reviewer: Luna High, zakres read-only. Worker Luna High posiada wyłącznie narzędzie sync i jego testy; główny agent posiada test rzeczywistego bundle, aktualny inventory i dokumentację.

## Historia i granice

Nowy ledger musi odtwarzać nową projekcję treningową 918 pytań pod nowym pinem. Poprzednia tożsamość treningowa 845 pytań pozostaje w zapisie bazowym odbioru, a zapisane odpowiedzi nie są migrowane ani usuwane. Nie zaliczają pokrycia nowego materiału. Aktualne statystyki postępu filtrują dokładną wersję/SHA; lista aktywności korzysta z zapisanych terminalnych sesji i prób bez filtrowania do aktualnej wersji. Szczegóły lub wznowienie starej sesji wymagają zachowanego dokładnego pakietu; brak pakietu jest jawną niedostępnością, nie podmianą pytań.

CC-04 zachowuje jawne ograniczenie estymaty nowej sesji V3 bez ustalonego zakresu i dostępu. Nie wykonano pełnego ponownego audytu semantycznego wszystkich historycznych pytań ani testu aktualizacji na prywatnej historii użytkownika.

## Dowody

- Ponownie wykonano CONTENT validate/test dla Claude: 918 pytań, PASS.
- Ponownie wykonano pięć celowanych zestawów CONTENT (course links, CC02 coverage, historyczny audit, transport completion, shared contract): **50/50 PASS**, bez pominięć.
- Formalny CONTENT release gate zwrócił `RELEASE_READY` dla historycznego kandydata `f37ade5cdb98fb72cd0ef85fd2f1eb0c4e0f274f1c33e7a881b3333b95a2e7c7`, źródło `e74183a87a37192caf20b1cac1e33e54bb6d618f`. Nie jest to odbiór CC-05. Istniejący APP release lock wskazuje inny wcześniejszy kandydat `8385357bf7dfd91d8f157a1e8adde737237b96d422f64dcea7e134e90d6a52bd`; żaden z tych historycznych zapisów nie jest aktualizowany przez lokalny sync.
- Rzeczywista komenda lokalnego sync i ponowny `check` PASS: **9 / 117 / 958 / 16695**, SHA Claude `12e6c8637b112af9e48ca870bb80d89f9db6ad7d1949c51efceb37572a6cd0bd`. [Zapis odbioru](claude-local-candidate-2026-10-11.json) wiąże 159 wejść producenta, sześć dowodów i sześć formalnych pinów. Fingerprint źródeł: `a92a941f58f54d0697238e5876b67f70b42bd887dfbf504fa164063746d7c712`.
- Nowy pin treningowy: wersja artefaktu z sufiksem `-training`, SHA `8d8ad0751a0b30107aafa1d9dd7299123c9ed75f401745e918281f72eb166e10`, 918 pytań. Lock SHA `8d2c8a0ecac9f9e572b8f73e07ee6e3a84ec6ba94c5b166e85665e64b5c62d6d`; ledger SHA `ceedb404a32f40bdc03c8fb2d2baadcc8a86785383b643aef42205ccfce40ccf`.
- Osiem innych artefaktów, osiem wpisów ledger i sześć zamrożonych powiązań z tabeli poniżej: exact PASS po sync.
- Runtime/kontrakt: 39/40 testów pierwszego przebiegu PASS; jedyny błąd to stary test wymagający jednego linku w już zsynchronizowanym pytaniu. Po dodaniu oczekiwanego konkretnego modułu M1-S10: cały zestaw linków **7/7 PASS**. Pozostałe 33 wyniki pozostają ważne — ich kod/dane nie zmieniły się. Obejmują rzeczywisty bundle, scoring, pełny runtime, wszystkie 53 prepare/resume i regułę V3. Niezależny reviewer powtórzył test rzeczywistego bundle **2/2 PASS**, w tym zapis/odczyt historycznej próby 845 i brak zaliczenia/aliasu na nowy pakiet.
- Typecheck po sync: PASS. Istniejące modele aktywności/bootstrap: **30/30 PASS**; brak zmian ich implementacji.
- Narzędzie sync: **26/26 PASS**, także niezależnie; negatywne przypadki wersji, liczby pytań, fingerprintu i dowodów nie zmieniają targetu. Sprawdzono zachowanie ośmiu banków, idempotencję, nowy pin, zapis poprzedniego pina i odzyskanie przerwanej podmiany. Pierwsze przebiegi wykryły brak katalogu fixture oraz nieprawidłowe porównanie pól stats z całym identity; poprawiono je przed finalnym przebiegiem.
- Bieżący inventory w kanonicznym walidatorze i testach APP zaktualizowano do 958/16695; dawny 943/16622 ma osobną stałą baseline. `validateContentBoundary.mjs`: **PASS** po tej korekcie. Dodanie szóstego pina formalnej decyzji do zapisu odbioru zachowuje pierwotny snapshot bazowy 845, fingerprint źródeł, artefakt i sześć dowodów; nie regeneruje baseline z już zsynchronizowanego banku.

## Pozostałe bramki wydania

Formalny `runtimeAdmissionLaunchTracks.test.ts` **FAIL**: `Current bundled content differs from candidate artifact backend-system-design-interview.` To wcześniejsza niespójność formalnego kandydata z zachowanym zestawem APP; identyczność pozostałych ośmiu banków potwierdza, że CC-05 jej nie naprawia ani nie powoduje. Nowy Claude również nie ma formalnego admission. Nie zmieniono testu na selektywną zgodność, nie nadpisano approvals ani release locka, aby uzyskać pozorny PASS. Przed publikacją potrzebny jest spójny, odrębnie odebrany kandydat całego wydania.

Próba `test:content-release-cross-repo` najpierw nie miała właściwej konfiguracji historycznego checkoutu i current SHA. Ponowna próba z bieżącym root/SHA ujawniła różnice innych banków między źródłowym kandydatem i zachowanym APP oraz stary licznik inventory w teście. Aktualny licznik poprawiono; kontrakt zgodności całego wydania pozostaje ścisły. Ten test uruchomił dodatkowo builder wszystkich banków, **wbrew ograniczeniu planu CC-05**. Nie było to potrzebne do odbioru Claude; nie zmieniono źródeł ani ośmiu artefaktów APP i nie powtarzano tej budowy po rozpoznaniu przekroczenia zakresu. Nie raportujemy pełnego cross-repo gate jako PASS.

Lokalne kryteria CC-05 zamknięte: exact zapis odbioru, sync/check, runtime i zachowanie historii oraz niezależny przegląd PASS. Formalna gotowość do wydania pozostaje niepotwierdzona zgodnie z granicami opisanymi wyżej. Zmiany: narzędzie sync/test, trzy wygenerowane pliki (Claude/lock/ledger), aktualne liczniki i test linków, nowy test realnego bundle, zapis/raport odbioru i bieżący plan/stan. Nie usunięto żadnych ścieżek ani danych.

## Powtórzenie lokalnej kontroli

Z katalogu APP:

```sh
node scripts/syncBundledContentRelease.mjs check --local-reviewed-candidate docs/reports/claude-local-candidate-2026-10-11.json
node --test scripts/syncBundledContentRelease.test.mjs
node --import tsx --test src/content/claudeLocalCandidateAcceptance.test.ts src/content/canonical/runtimeCatalog.test.ts src/content/canonical/questionCore.test.ts
npm run typecheck
```

Zapis odbioru jest osobnym kontraktem lokalnym. Zmiana wejść producenta, artefaktu, raportów lub zamrożonych pinów unieważnia go. Nie należy regenerować go automatycznie tylko po to, żeby kontrola przeszła. Komenda `prepare-local-candidate --track claude-certified-architect-professional-certification` przygotowuje faktyczny opis do ponownego przeglądu, a `sync --local-reviewed-candidate …` wykonuje odebraną lokalną podmianę. Standardowa ścieżka release/admission nie otrzymuje w ten sposób nowej zgody.

## Zamrożone powiązania przed synchronizacją

| Plik | SHA-256 |
| --- | --- |
| `integration/contracts/content-release/release.lock.json` | `1d52a41653143be48b466fa64019a8815eae508624d741879dd5282831f429b7` |
| `../patternly-content/reports/candidate-reconciliation/AWS-02-DRAFT/candidate/manifest.json` | `a2bd5b04f746404ac1bdbc84e4d6faaa92ec3898b2dde806206c084b464efd8d` |
| `../patternly-content/reports/candidate-reconciliation/AWS-02-DRAFT/release/release.json` | `136e64ece078addc5bd82a40c9e49562c468554c979dc8c49aedbf3bc611db84` |
| `../patternly-content/evidence/readiness/current-candidate-readiness-v2.json` | `d5cb13affe3abfd98a5d441b7936e3baa1239dd33c8520f5e66759eb0c1741ea` |
| `../patternly-content/evidence/candidate-decisions/current-candidate-decision-v2.json` | `5192e0a23be8feca49caadca6778113d6a44a18637700dab491deeab024244a8` |
| `../patternly-content/evidence/admissions/candidate-admission-v3.json` | `ca9499ea8829b81ccd357fdbe9caead1bb01e4f3c3035946e1a4a26fb1e280fb` |

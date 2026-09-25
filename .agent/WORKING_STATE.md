# Patternly — stan pracy

## Cel i zasady

Realizować wszystkie zadania z [planu](../docs/PATTERNLY-WORKING-PLAN.md) w pętli, lokalnie i bez wdrożenia. Przed każdym zadaniem sprawdzać API, Metro i istniejący iPhone 17. Nie tworzyć drugiego urządzenia ani kopii aplikacji bez konkretnej potrzeby i nowego uzgodnienia. Ogłaszać nazwę i cel każdego użytego skilla. Każdy slice wymaga briefingu `Cel / Ustalenia / Podejście`, niezależnego QA, aktualizacji planu, commitu i push na `main` właściwych repozytoriów.

**Wiążące decyzje właściciela 25.09.2026 — potwierdzić w każdym briefingu:** Patternly nie ma realnych użytkowników ani danych produkcyjnych. Do pierwszego publicznego wydania kompatybilność wsteczna nie jest wymaganiem: usuwać legacy, migratory, adaptery, fallbacki, stare lokalne formaty i syntetyczne ścieżki zamiast je utrzymywać. Zmiany kontraktów wykonać spójnie we wszystkich dotkniętych repozytoriach; nadal obowiązują aktualne schema, bezpieczeństwo, integralność, realne kontrakty providerów i release evidence. `PROFILE-02/B` jest anulowane: aplikacja nie wybiera, nie odzyskuje i nie migruje wielu historycznych profili Gościa. Nie przywracać tego zakresu bez nowej decyzji właściciela. Odbiory Maestro wykonywać na istniejącym iPhonie 17; nie tworzyć drugiego urządzenia bez konkretnej potrzeby i nowego uzgodnienia.

## Repozytoria

| Repozytorium | Stan po CI-CONTRACT/C |
| --- | --- |
| `patternly` | Kod C `4830f36f`; bieżący diff zapisuje raport, plan i stan. |
| `patternly-backend` | Kod C `3c75955`; inventory obejmuje binarny package transport. |
| `patternly-content` | CI-CONTRACT/A2b wypchnięte na `master` jako `21707b6`. |
| `patternly-web` | Kod C `12c9557`; test Vite i launcher exact local gate naprawione. |

## CI-CONTRACT/A2b — wynik

- Status: **done / QA PASS**; content `21707b6`.
- Push/PR odtwarza exact draft/readiness i odrzuca niezgodne lub nieśledzone evidence.
- Acceptance v2 wiąże 9 Free-node packages z exact package SHA i zaakceptowanymi release artifacts; payload items są porównywane, a limity dekompresji blokują gzip bomb.
- Manual release kończy się oczekiwanym `RELEASE_BLOCKED` dla candidate `11d56baa…`; publishing/runtime nadal `not_granted`, brak deployu i zmiany app lock.
- Pełny content 67/67, gate 4/4, Free-node 9/9, migration 9/117/943/16 077, build/scoring 9/9, YAML i diff check — PASS.

## CI-CONTRACT/A3 — wynik

- Status: **done / QA PASS**.
- Historyczny release lock używa osobnego checkoutu dokładnego `producerCommit`; bieżący builder używa osobnego checkoutu `patternly-content/main`.
- Workflow rozpoznaje i loguje pełny SHA bieżącego checkoutu. Oba testy buildera wymagają tego SHA i porównują go z HEAD, więc brak konfiguracji nie daje pozornego PASS.
- Test cross-repo 3/3, negatywne brak/błąd SHA i root, `check:content-release` 9/117/943/16 077, typecheck, YAML i diff check — PASS.
- Pierwszy qa-gate wykrył opcjonalne SHA i brak logu; po poprawce końcowy niezależny QA: PASS.
- Briefing: 0,96 / 0,88 / 0,94 / 0,90, minimum 0,88 — APPROVE.
- Release lock, generated content, runtime i admission nie zostały zmienione; brak wdrożenia.

## CI-CONTRACT/B — wynik

- Status: **done / QA PASS**.
- `content-test-gate` uruchamia 67 testów contentu, w tym draft-v2, readiness-v2 i release-gate-v2, a końcowy agregator wymaga sukcesu.
- App gate używa osobnego historycznego checkoutu z release locka i exact-SHA bieżącego contentu; oba są sprawdzane przed i po gate’ach.
- Test kontraktu workflow 11/11, test cross-repo 3/3, content 67/67, YAML i diff check — PASS.
- Pełne `qa:static` nadal FAIL na istniejącym `recovery:check` dla czterech importów MMKV; nie jest raportowane jako PASS i nie wynika z diffu B.
- Briefing: 0,96 / 0,87 / 0,84 / 0,90, minimum 0,84 — APPROVE. Niezależny QA: PASS.
- Brak repinu, admission, publikacji i wdrożenia.

## AWS-02/CANDIDATE — wynik

- Status: **done / PASS WITH ISSUES**; exact candidate `11d56baa82f897482a6def37d2af6bd90977b855a2fd5ddcb151838c7108a5f1`.
- Decyzja `delegated_codex` według DEC-23 wiąże 9 tracków, source snapshot `79060003…`, release `617f2216…` i wszystkie hashe pytań/artefaktów.
- Readiness v2 zatwierdza wyłącznie kandydata. Publishing/runtime pozostają `not_granted`, app release lock bez zmian; historyczne v1 i human approval nietknięte.
- Pierwsze QA wykryło, że `git diff` pomija untracked JSON. Pełny guard ścieżek, trybów i Git blob IDs oraz izolowany test regresji naprawiły lukę; retest QA: PASS WITH ISSUES.
- Weryfikacja: targeted 2/2 i 1/1, pełny content 63/63, migration 9/117/943/16 077 z 36 dodatkami ODK-096, draft/readiness generators i diff check — PASS.
- Briefing: 0,94 / 0,84 / 0,84 / 0,84, minimum 0,84 — APPROVE.

## SIMP-05 — wynik

- Status: **done**; ponowna walidacja nie wykazała aktywnego równoległego formatu, adaptera ani fallbacku.
- Aplikacja konsumuje dziewięć artefaktów przez kanoniczny runtime; content ma jeden ingress, wspólny kontrakt i builder.
- Historyczny raport zatwierdzono w `08020ea` i celowo usunięto w `2623222`; nie przywrócono go jako drugiego aktywnego dokumentu.
- `patternly-content`: testy 60/60 i migration verifier PASS dla 9 tracków / 117 nodes / 943 mental units / 16 077 pytań.
- Briefing: 0,93 / 0,94 / 0,84 / 0,91, minimum 0,84 — APPROVE.
- Niezależne QA: PASS WITH ISSUES. `validateContentBoundary.mjs` i diff check
  przeszły; `checkRecoveryBaseline.mjs` wskazał cztery istniejące importy MMKV
  w obszarze konta, poza dokumentacyjnym diffem SIMP-05.
- Stare odwołania workflow do usuniętych generatorów i release gate zostały zastąpione rzeczywistymi bramkami A2b w `21707b6`.

## AUD-08/B1c — wynik

- Lokalny rezultat: **PASS WITH ISSUES** według niezależnego QA `gpt-6-luna/high`.
- Klient wymusza `getIdTokenResult(..., true)`, sprawdza UID przed i po odświeżeniu oraz odrzuca brakujący/błędny claim. `authorization_generation_stale` prowadzi do `account-reauthentication-required`.
- Backendowy test przypina generację 1, obraca konto do 2 przed zakończeniem mintu i potwierdza `401 authorization_generation_stale` na `/v1/me`.
- Izolowany Firebase JS SDK harness potwierdza claim po custom-token sign-in i force refresh oraz brak/błędny claim. Emulator nie dowodzi produkcyjnej walidacji podpisu.
- Maestro na istniejącym iPhonie 17, bez `clearState` i reinstalacji, potwierdziło oba selektory typed reauth po realnym bootstrapie. Pełne dane formularza sprawdzono przed submit w hierarchy i na prywatnym zrzucie. Zachowany profil Gościa nie został wyczyszczony ani przejęty.
- Macierz ponownie pokrywa 57/57 metod, ścieżek i profili. `legalRequests.confirmationStatus` jest kontynuacją doręczenia już zaakceptowanej trwałej sprawy; B1b4c nadal osobno czeka na decyzję PO o niejednoznacznym wyniku SMTP.
- Nie było wdrożenia. Starsze instalacje bez wymiany sesji mogą dostać 401 po przyszłym włączeniu egzekwowania claimu; wymaga to osobnej bramki dystrybucji.
- Recovery takeover i provider revoke nie zostały zmienione.

## AUD-16 — wynik

- Status: **done / niezależne QA PASS**; lokalnie, bez wdrożenia.
- EN i PL mieszczą pełną zgodę w dwóch liniach standardowego układu. PL brzmi: „Akceptuję Warunki korzystania i znam Politykę prywatności.”
- Oba linki, walidacja i boolean `acceptedTerms` pozostały zachowane. Etykieta dostępności checkboxa obejmuje pełną zgodę na Warunki i znajomość Polityki.
- Duży tekst rośnie do czterech linii bez obcięcia. Repozytoryjny flow Maestro przeszedł 1/1 na istniejącym iPhonie 17 bez `clearState`, reinstalacji i tworzenia konta.
- Testy ukierunkowane 33/33, typecheck i diff check — PASS. Prywatne zrzuty zostały obejrzane i nie trafiły do repozytorium.
- Briefing: 0,96 / 0,88 / 0,84 / 0,91, minimum 0,84 — APPROVE.

## ODK-119-GATE/A — wynik

- Status: **done / niezależne QA PASS**; lokalnie, bez provider E2E, download admission i wdrożenia.
- Centralny `startSession` sprawdza cały przygotowany plan względem kanonicznego Free node przed `mutations.start`; Free omija bramkę, każdy element Premium jej wymaga.
- `AccountSessionProvider` jest właścicielem świeżego odczytu i konta. Tylko jawne offline korzysta z istniejącego cache per konto; online/unknown wymaga fresh read, a błąd nigdy nie wraca do cache.
- Fresh negative zastępuje cache i odmawia; fresh positive przywraca dostęp. Expiry, refund, hold, mismatch i rollback pozostają fail-closed w kanonicznej domenie.
- Coding, Certification i Design pokazują PL/EN jawny następny krok: bezpłatny temat albo ponowienie po połączeniu.
- Targeted controller 30/30, szerszy 46/46, typecheck, locale JSON i diff check — PASS. QA wykryło i domknięto test planu mieszanego oraz komunikaty UX.
- Briefing po analizie mostu: 0,91 / 0,82 / 0,85 / 0,86, minimum 0,82 — APPROVE.

## AUD-04-B — wynik

- Status: **done / niezależne QA PASS**; backend `11f988e`, lokalnie i bez wdrożenia.
- Ścisły manifest `patternly-content-node-package-v1` wiąże identity, exact gzip bytes, bounded decompressed bytes, oba rozmiary i oba SHA-256. Payload pozostaje nieprzezroczysty; jego semantyka i kanonikalny producent należą do AUD-04-C.
- Publikacja zapisuje i ponownie weryfikuje niezmienne bajty, potem immutable manifest, a na końcu atomowo przełącza current pointer. Poprzednie wersje pozostają; przerwanie przed pointerem może zostawić wyłącznie nieaktywną sierotę.
- `GET /v1/content/packages/{trackId}/{nodeId}` wymaga App Check i bearer, sprawdza świeży RevenueCat entitlement przed jakimkolwiek odczytem pakietu i zwraca dokładne gzip bytes bez URI. Active/grace wymagają poprawnej przyszłej daty; odmowy nie ujawniają istnienia node.
- Lokalny filesystem adapter jest zabroniony w konfiguracji produkcyjnej. Cloud storage, realny artefakt Premium, mobile installer i deployment pozostają poza B.
- Pełny backend 233/233, targeted package 4/4, typecheck, lint, OpenAPI 58 operacji i diff check — PASS. Wcześniejszy pojedynczy błąd concurrency był przejściowy; kontrolowany pełny retest przeszedł.
- Briefing: 0,88 / 0,84 / 0,82 / 0,86, minimum 0,82 — APPROVE.

## AUD-04-C — wynik

- Status: **done / niezależne QA PASS WITH ISSUES**; aplikacja `5de89e5b`, backend metadata `77c4e4c`, bez wdrożenia.
- Transport używa istniejącego Auth/App Check, limitu 2 MiB i wymaganych nagłówków. Verifier sprawdza gzip, dokładne rozmiary, transport/artifact SHA, strict node payload, tożsamość, istniejący question contract oraz minimum app version; dekompresja ma limit 8 MiB.
- Expo DocumentDirectory zapisuje staging i content-addressed final z reread/verify; dopiero potem pojedynczy profile-scoped MMKV pointer aktywuje wersję. Historia exact refs pozostaje, a orphan bez pointera nie hydruje po restarcie.
- Ten sam `ContentPackageRuntimeOwner` obsługuje installed exact refs; pakiety nie trafiają do discovery ani nie definiują product modes. Cache jest izolowany A→B→A, podczas async hydration i podczas aktywnego profile transition.
- Targeted/architecture 35/35, content-boundary, typecheck i diff check — PASS; backend emulator 1/1 i OpenAPI 58 — PASS. Szeroki suite miał 1219 przejść i 11 failures: dwa związane z C naprawiono; pozostałe obejmowały istniejące release/legal/dirty-worktree oraz timeout Metro i nie są raportowane jako PASS.
- Ograniczenia QA: brak jeszcze wywołującego flow (właściciel D), brak native device proof dla adaptera oraz neutralny fixture nie jest admission Premium.

## AUD-04-D — done / PASS WITH ISSUES

- Status: **done / PASS WITH ISSUES** według końcowego niezależnego QA. Bazowy mieszany commit `9330fcef` nie był dowodem zakończenia; bieżący slice zawiera urządzeniowe poprawki i właściwy raport.
- Lokalna ścieżka smoke pokazuje jawną ofertę, instaluje exact pakiet i prowadzi przygotowanie przez wspólnego runtime ownera. Release/sandbox mają pustą mapę ofert; rzeczywiste bundle smoke/release potwierdziły fixture wyłącznie w smoke.
- Pierwszy QA wykrył utratę `nodeId` między route i lifecycle, która mogła wybrać Free i ominąć Gate A. Naprawa przenosi osobny jawny `nodeId`; integracyjna regresja sprawdza exact version/hash/pytanie, autoryzację przed mutacją oraz odmowę bez aktywnej sesji.
- Istniejący iPhone 17 osiągnął Home i wykonał smoke offer → exact install/preparation → Gate A. Obejrzany screenshot pokazuje `unavailable`, nie `denied`; brak mutacji dla `denied` i kolejność przed zapisem potwierdza test integracyjny.
- Poprawiono profil Metro, układ karty, rozdwojony alias z cichym fallbackiem oraz `Uint8Array` dla natywnego `expo-crypto`. Target 7/7, typecheck i diff check przechodzą. Pełny suite 1255/1258 ma trzy niezależne błędy cross-repo content. Neutralny fixture nie jest admission ani treścią Premium.

## ODK-119-GATE/B — done / PASS WITH ISSUES

- Jedynym wejściem nowej sesji jest `startTrainingSession` → `TrainingLifecycleUseCases.startSession`; jedynym aplikacyjnym wejściem downloadu jest account-owned `installPremiumNodePackage` → `installPremiumNodeOffer`.
- Usunięto nieużywane publiczne `prepareSession` i `installAuthenticatedNodePackage`, które utrzymywały przyszłe boczne wejścia. Kontrakt źródłowy pilnuje listy konsumentów.
- Backend bez zmian: świeży RevenueCat read poprzedza odczyt bajtów. App 8/8 i typecheck PASS; backend unit 16/16 oraz emulator 1/1 PASS po podaniu hostów. Bez wdrożenia i provider E2E.
- Briefing: 0,94 / 0,85 / 0,84 / 0,89, minimum 0,84 — APPROVE. Końcowe niezależne QA: PASS WITH ISSUES; ryzyko rezydualne to realny RevenueCat/store E2E poza lokalnym zakresem.

## ODK-117-A0 — wynik

- Status: **done / niezależne QA PASS**; wyłącznie dokumentacja, bez zmiany runtime lub locale.
- Mapa obejmuje zasoby EN/PL, konsumentów `t/translate`, lokalne presentery i walidacje, accessibility, alerty, powiadomienia wraz z Android channel name, formatowanie, metadane tracków, generated content, backend code → local copy, legal oraz natywne iOS/Android prompty.
- Pierwsze QA wykryło nieuprawniony status DONE i brak `practiceSessionExitCopy`/`Practice reminders`; drugie wykryło pominięcie `Info.plist`. Wszystkie luki zamknięto. Face ID prompt jest jawnie oznaczony jako potencjalny/stale, local-network prompt jako dev-only.
- Powtarzalny inventory scan mapuje pełne klasy plików-kandydatów; semantyczna klasyfikacja każdego string expression, AST guard i migracja pozostają A3. Istniejący parytet EN/PL 1/1 PASS; diff check PASS.

## ODK-117-A1 — wynik

- Status: **done / niezależne QA PASS WITH ISSUES**; lokalnie, bez wdrożenia i bez zmiany preferencji/profilu podczas dowodu.
- Kontrakt rozdziela siedem target locale od dostępnych EN/PL, zachowuje storage `system|en|pl`, jawnie zwraca powód tymczasowego EN i wyłącza ukryty fallback i18next.
- Fixture działa tylko w `__DEV__` + smoke i renderuje produkcyjny `LanguageSettingsScreen`; nie wykonuje komend konta ani zapisu preferencji.
- Na istniejącym iPhonie 17, przy `de-DE` i tekście `large`, terminalny flow Maestro potwierdził pełny komunikat System oraz opcje System/EN/PL. Screenshot i hierarchy obejrzano; EN pozostał selected. Potem przywrócono `pl-PL / pl_PL / large`.
- Testy 29/29, typecheck i diff check — PASS. Ograniczenie QA: hierarchy nie wystawia osobnego węzła radiogroup, choć role radio/selected są widoczne, a rola grupy jest w JSX i teście.
- Następny slice ODK-117: A2.

## ODK-117/B-CONTRACT — wynik

- Status: **done / niezależne QA PASS WITH ISSUES**, przy czym jedyną naprawialną kwestią były nieaktualne raporty, poprawione przed commitem.
- TestOnly/UNAPPROVED drafty DE/FR/ES/IT/ET zachowują pełną strukturę EN: 14/22 sekcje, 38/65 akapitów i identyczne tokeny interpolacji. Syntetyczne zmienne mają wszystkie siedem locale.
- Schema pozostaje `patternly-public-legal-export-v1`; stary artefakt EN/PL nadal działa. Produkcyjny app runtime/export nie importuje draftów, a web odrzuca artefakt `testOnly` w trybie production.
- Rzeczywisty artefakt app i niezależnie przeliczony fingerprint przeszły hook web 2/2; web testy 6/6 i `verify:local` PASS. App export 4/4, schema 10/10, legal variables, typecheck i diff check PASS.
- Release gate pozostaje `not_ready`: poza nieuzupełnionymi rzeczywistymi wartościami ODK-116-B bieżący lokalny wynik wskazuje też brudny worktree i brak pięciu wymaganych zewnętrznych evidence. B-CONTRACT nie jest dowodem gotowości wydania. Bez backend change i bez wdrożenia.

## WEB-03C/PREP — wynik po rewalidacji

- Status: **done / controller revalidation PASS**; lokalny `local-test`, bez publikacji. Pierwsze QA nie wykryło niejednoznacznego źródła manifestu; poprawkę odebrano ponownie po testach negatywnych.
- Web `prepare:web03c:local` wymaga czystych app/web HEAD przed i po buildzie, buduje i weryfikuje publiczny `dist`, zapisuje SHA-256 i rozmiary wszystkich 11 plików, toolchain, źródła oraz projekt/site `patternly-app-sandbox` i katalog `dist`. Brudne lub zmieniające się źródło oraz output wewnątrz repo są odrzucane. Manifest jest jawnie niewdrażalny.
- Lokalny publiczny preview zwraca 404 dla `/admin*` i `/privacy-request*`; test sprawdza też brak ich kodu w buildzie. Testowy artefakt prawny pochodzi z eksportera aplikacji i pozostaje syntetyczny.
- Firebase CLI nie potwierdziło dostępu: `projects:list` exit 2 z nieważnymi credentials. Zdalny release, deploy i rollback nie zostały wykonane. Produkcyjny build czeka na prawdziwe wartości ODK-116-B.
- Briefing po redesignie: 0,92 / 0,84 / 0,88 / 0,86; minimum 0,84, APPROVE. Procedura PUBLISH opisuje przyszłe klonowanie live do kanału rollback i z powrotem.
- Rewalidacja: testy bramki 2/2, `verify:local` i pełny PREP na czystych HEAD-ach PASS; kontrolowany dirty-tree run odmówił zapisu. Firebase access nadal FAIL, więc PUBLISH nie ruszył.

## Weryfikacja

- Aplikacja: testy ukierunkowane 44/44, typecheck i `git diff --check` — PASS.
- Backend: typecheck, `openapi:check` 57 operacji, test wyścigu 1/1 i `git diff --check` — PASS na poziomie testów wewnętrznych.
- Firebase JS SDK harness: 1/1 PASS na poziomie testu wewnętrznego.
- Oba wrappery Firebase CLI zwróciły kod 2 po zielonych testach dzieci, podczas końcowego update/MOTD config check. Nie raportować całych wrapperów jako PASS.
- Briefing przed wykonaniem: zgodność 0,92; prostota 0,88; ryzyko 0,82; utrzymywalność 0,90; minimum 0,82, APPROVE.

## CI-CONTRACT/C — wynik

- Status: **done / QA PASS WITH ISSUES**; lokalnie, bez hosted runu i wdrożenia.
- Exact kandydat: app `4830f36f`, backend `3c75955`, content `21707b6`, web `12c9557`; candidate `68524885…`, manifest `cccfcd78…`, create/verify PASS.
- App `qa:static`: 1252/1252 oraz wszystkie granice PASS. Backend: 233/233 emulator, OpenAPI 58, inventory 50, build PASS. Content: 67/67, build/scoring 9/9. Web: behavior 34/34, config i `verify:local` PASS.
- Firebase CLI zwraca kod 2 dopiero po zielonych testach i zamknięciu emulatorów podczas update/MOTD config; późniejsze backend gates wykonano osobno. Lokalny JDK 23 różni się od przypiętego JDK 21 workflow.
- Raport: [CI-CONTRACT/C](../docs/active/CI-CONTRACT/C-REPORT.md). Nowy kandydat wymaga ponownego exact-SHA runu przed FREEZE.

## RELEASE-CONTRACT/A — wynik

- Status: **done / niezależne QA PASS**; lokalnie, bez FREEZE, GO i wdrożenia.
- Jeden `releaseGate` i raport v2 mają zamknięte etapy local/FREEZE/GO. Local nie wymaga danych PO ani external evidence. FREEZE dodaje dane wydania, manifest i signing/builds, ale nie provider/store/PO/device. GO wymaga także physical-device.
- Hosted launch-readiness jawnie przekazuje `--stage go`; mutacja do freeze failuje test kontraktu.
- Release gate/workflow/manifest 36/36, recovery inventory, typecheck i diff check — PASS.
- Następny slice: RELEASE-CONTRACT/B — rozszerzenie istniejącego manifestu o app/content lock, iOS build, fingerprint niesekretnej konfiguracji i integralne evidence.

## RELEASE-CONTRACT/B — wynik

- Status: **done / niezależne QA PASS WITH ISSUES**; lokalnie, bez rzeczywistego builda, FREEZE, GO i wdrożenia.
- Manifest v2 wiąże cztery SHA i istniejące locki z dokładnym iOS buildem, fingerprintem zamkniętej publicznej konfiguracji oraz hashem istniejącej koperty `signing-and-builds`.
- Wspólny walidator evidence obsługuje manifest i release gate; dodatkowe pola konfiguracji (w tym sekret) oraz zmiana build/config/evidence failują.
- Hosted workflow wymaga jawnego niesekretnego JSON evidence i przekazuje jeden zewnętrzny katalog przez create, verify i release gate.
- Targeted 37/37; pełne qa:static 1254/1254 z historycznym/current content root; typecheck, recovery inventory, schema JSON, oba boundary checks i diff check — PASS. Pierwszy szeroki run bez wymaganych cross-repo env miał wyłącznie 3 błędy konfiguracji content roots, nie regresje kodu.
- Następny slice: RELEASE-CONTRACT/C — jedna polityka OTA i tożsamość faktycznie uruchomionego artefaktu.
- Granica QA: samohashowana koperta zapewnia integralność po związaniu, ale tekstowe `verifiedBy` nie dowodzi pochodzenia z EAS ani osoby. Rzeczywisty build i wiarygodność evidence muszą być potwierdzone przed FREEZE.

## RELEASE-CONTRACT/C — wynik

- Status: **done / niezależne QA PASS WITH ISSUES**; lokalnie, bez builda, publikacji OTA, FREEZE, GO i wdrożenia.
- Jedna polityka release: `embedded-only`; Expo Updates jest wyłączone dla release (`enabled=false`, `checkAutomatically=NEVER`), bez zmiany sandbox/smoke.
- Manifest wiąże politykę i fingerprint konfiguracji. Physical evidence wymaga receipt dokładnego manifestu, build ID, runtime, kanału i osadzonego artefaktu; każda rozbieżność failuje GO.
- Targeted 41/41; pełne qa:static 1256/1256 z przypiętymi content roots; oba boundary checks, schema JSON i diff check — PASS.
- Następny dostępny slice: OPS-PRODUCTION/A.
- Granica QA: self-hash receipt nie dowodzi fizycznego uruchomienia; rzeczywiste pochodzenie receipt i test urządzenia pozostają obowiązkowe przed GO.

## Otwarte decyzje i blokady

- `AUD-08/B1b4c` — `WAIT/PO`: po SMTP accepted i awarii przed zapisem retry może dać duplikat/późną wiadomość, a brak retry może pozbawić klienta potwierdzenia. Nie implementować polityki bez odpowiedzi.
- `CI-CONTRACT/A2b`, `A3`, `B` i `C` — done; C ma lokalny PASS WITH ISSUES, nie hosted PASS.
- `PROFILE-02/B` — cancelled by owner; bez selektora, migracji i odzyskiwania wielu historycznych Gości. Następny jest PROFILE-02/C.
- Brak wdrożenia jest granicą zakresu, nie defektem lokalnego B1c.

## AUD-11 — wynik

- Status: **done / niezależne QA PASS**; lokalnie, bez wdrożenia, reinstalacji i czyszczenia danych.
- Izolowana komenda działa tylko w `__DEV__` + smoke i ustawia wyłącznie prezentację `base` albo `retry-limit`; testy potwierdzają odrzucenie pozostałych środowisk i brak wywołań storage w handlerze.
- Obejrzano porównania przed/po PL i EN na tym samym iPhonie 17 przy tekście `large`. Historyczny widok odtworzono chwilowo z rodzica `488bdc17`, a finalny kod i `pl-PL / pl_PL / large` przywrócono.
- Pierwszy odczyt wykrył brak polskiego zdania o danych chmurowych; poprawiono EN/PL. Stan limitu ukrywa retry. Maestro potwierdziło anulowanie krótkiego tapnięcia bez wejścia w usuwanie.
- Targeted QA 31/31, controller 12/12, typecheck i diff check — PASS. Pełny suite 1262/1266 ma cztery niezależne błędy cross-repo/release na brudnym worktree/brakujących wejściach; nie jest raportowany jako pełny PASS.
- VoiceOver i rzeczywista utrata klucza nie były symulowane. Raport: [AUD-11](../docs/active/AUD-11/REPORT.md).

## AWS-02/ADMISSION — done / PASS WITH ISSUES

- Candidate `11d56baa…` ma osobny admission v3 dla zweryfikowanych lokalnych bajtów; granica `local_verified_artifacts_no_deployment` nie oznacza storage, backendu ani dystrybucji.
- App commit `1a375c99…` zawiera schema-v3 exact lock i runtime test dziewięciu tracków. Stary lock `patternly-app-content-0024` jest zachowany jako historyczny dowód.
- Content commit `23f46b2…` wiąże runtime evidence z app HEAD, lockami i testem; release gate zwraca `RELEASE_READY` dla exact candidate.
- App release manifest/readiness przestawiono z historycznego ACC-02 na aktualne candidate/readiness/admission. Ukierunkowane 30/30, runtime 1/1, typecheck i content 70/70 PASS.
- Pełny app suite: 1259/1262; trzy cross-repo wymagają jawnego historycznego checkoutu i expected current SHA, więc bez tych wejść failują zgodnie z kontraktem.
- Pierwsze QA wykryło brak porównania per-track `artifactSha256`; naprawiono binding do exact release i dodano negatywny test obcego poprawnie sformatowanego hasha. Re-QA PASS WITH ISSUES; końcowe etykiety ACC-02 usunięto.

## Następne działania

1. Wybrać następny dostępny slice z planu po zakończonym `AUD-11`; `B1b4c` nadal WAIT/PO.
2. `ODK-117/A1` jest odebrane; następny dostępny slice tej ścieżki to `ODK-117/A2`.
3. Dla nowego kandydata powtórzyć exact-SHA etap CI-CONTRACT przed FREEZE; bieżącego lokalnego C nie utożsamiać z hosted runem.
4. AWS-02/ADMISSION pozostaje osobnym późniejszym krokiem.
5. `PROFILE-02/B` jest anulowane decyzją właściciela. Tylko `B1b4c` nadal oczekuje na decyzję PO.

Pełny cel pozostaje aktywny, dopóki wszystkie zadania planu nie mają wymaganych dowodów.

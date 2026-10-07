# Bezpieczeństwo i prywatność — zakres pozostałych zadań

Status i kolejność należą wyłącznie do [planu głównego](../../PATTERNLY-WORKING-PLAN.md). Ten dokument precyzuje zadania; nie stanowi drugiej kolejki ani dowodu obecnego defektu.

Porównano źródła i testy 07.10.2026: app `e889b05d033d4cc4b7676d0ca3f224efc3fac115`, backend `039f7f000e701c4fbc69e18a1fb66528cbc5cdcb`, content `8bb27fa2bd4f1af58fb8c1b49e5314a1691bbb03`. Poniżej podano aktualną brakującą pracę i granicę dowodu. Nie trzeba odtwarzać audytu02.10 ani dawnych pakietów; zwykły preflight wykonawcy ma tylko wykryć późniejszą zmianę źródła. Historyczne probes/pomiary przytoczone w opisach nie są nowym native acceptance. CH-01–05 pozostają zakończone.


## SEC-01 — MEDIUM — Device-only auth persistence

**Potwierdzenie w bieżącym kodzie:** SecureAuthPersistence nadal wywołuje SecureStore get/set/delete bez jawnej device-only accessibility, obecnej w encryptedStorageNative. Kod do poprawki jest ustalony; actual restore/transfer proof należy do native acceptance.

- **Exact risk/data:** po iOS backup/transfer durable Firebase refresh token, UID/email/provider metadata mogą być przeniesione do innej instalacji, wbrew docs08/09. Wymaga dostępu do backup/restore; nie jest zdalnym auth bypass.
- **Pliki/config:** app `src/infrastructure/firebase/secureAuthPersistence.ts` (get/set/delete bez opcji), `src/infrastructure/firebase/firebaseAuthClient.ts`, `src/application/account/accountIdentityComposition.test.ts`, `src/infrastructure/firebase/firebaseAuthClient.test.ts`; wzorzec device-only w `src/infrastructure/storage/encryptedStorageNative.ts`.
- **Remediation:** jeden jawny device-only service/accessibility contract dla wszystkich auth reads/writes/deletes; uzgodnić namespace z SEC-03. Bez migratora nieopublikowanych historycznych instalacji. Zachować potrzebny refresh token i verified clear.
- **Test/manual proof i AC:** rekord używa native non-migrating accessibility; restart odtwarza bieżącą sesję, signout/deletion usuwa i weryfikuje brak; restore na innym urządzeniu nie odtwarza credential. Unit adapter options i lifecycle nie zastępują native item attribute/restore proof. Zwykły reset historii nie wylogowuje.
- **Privacy copy:** twierdzenie o wykluczeniu credentials z transferu zgodne z dowodem; bez obietnicy secure erase/wymazania starych backupów. **Platform:** iOS; sprawdzić brak regresji Android SecureStore. **Dependencies:** SEC-03 dla końcowych nazw, SEC-09B Android policy; native/provider dowód R04/R05.

## SEC-02 — MEDIUM — Minimalne provider profile

**Potwierdzenie w bieżącym kodzie:** firebaseAuthClient nadal żąda Apple FULL_NAME; persisted user/provider DTO zawiera displayName/photoURL/phoneNumber. Przed usunięciem sprawdzić konieczne Firebase restore/link/re-auth consumers; pola nie są automatycznie potrzebne dlatego, że zwrócił je SDK.

- **Exact risk/data:** Apple FULL_NAME i persisted displayName/photoURL/phoneNumber bez launch use case zwiększają zakres lokalnego profilu. Pole zwrócone przez providera nie staje się automatycznie potrzebnym rekordem produktu.
- **Pliki/config:** app `src/infrastructure/firebase/firebaseAuthClient.ts`, `src/infrastructure/firebase/secureAuthPersistence.ts`, ich identity tests, `plugins/withPrivacyBoundary.js` (Name declaration), właściwe privacy locale/template consumers z R01.
- **Remediation:** usunąć unused Apple scope i zbędne profile fields także w providerData; ustalić minimum na rzeczywistym Firebase restore/link/re-auth. Nie usuwać koniecznych UID/email/provider IDs/timestamps tylko na podstawie nazwy pola. Jeden persisted DTO, bez równoległego pełnego profilu.
- **Test/manual proof i AC:** synthetic provider z dodatkowymi polami nie utrwala ich; accepted serialized shape zamknięty; sign-in→restart→link/unlink/re-auth działa w R04. Brak przypadkowej utraty credentials i user-visible identity.
- **Privacy copy:** deklarować faktycznie przetwarzane identity fields; Name w manifest usunąć po potwierdzeniu braku innych konsumentów, nie samą zmianą etykiety maskować zbieranie. **Platform:** iOS/Android auth; bez nowego permission. **Dependencies:** wspólny adapter SEC-01, R01/R04.

## SEC-03 — MEDIUM — Izolacja środowisk w durable state

**Potwierdzenie w bieżącym kodzie:** app.config używa tych samych bundle/package IDs, a durable namespaces nie zawierają environment identity. Potwierdzono brak granicy w kodzie; cross-install A→B→A wymaga opisanej próby, nie jest dowodem cross-account backend access.

- **Exact risk/data:** sekwencyjny compatible-signed overinstall sandbox/release o tym samym bundle/package ID otwiera poprzednie keys/auth/profile/cache. Endpoint różni się bez trwałej granicy storage. Nie dowiedziono cross-account dostępu do backendu.
- **Pliki/config:** app `app.config.js`, `src/infrastructure/storage/encryptedStorageNative.ts`, `encryptedStorageBootstrap.ts`, `profileStorageRouter.ts`, `src/infrastructure/firebase/secureAuthPersistence.ts`, `src/infrastructure/security/recoveryOperationVault.ts`, package storage i purchases composition; powiązane provider IDs/config i config/storage tests.
- **Remediation:** jedna kanoniczna tożsamość środowiska; odrębne app/storage/key/auth/cache namespaces lub fail-closed fingerprint przed jakimkolwiek odczytem/użyciem obcego stanu. Wybrać najmniejszy spójny wariant po sprawdzeniu Keychain i provider callback identities. Bez niezależnych heurystyk w poszczególnych repozytoriach i bez kasowania obcych danych.
- **Test/manual proof i AC:** A→B→A sentinels w MMKV, auth, vault, registry i caches; B nigdy nie odczytuje/wysyła A, A zachowuje własne dane; mismatch jawny przed auth/sync. Test iOS overinstall oraz Android oddzielnie na jednym istniejącym urządzeniu naraz; nie tworzyć duplikatów simulatorów. Dowód config fingerprint dla R03.
- **Privacy copy:** środowiska nie przenoszą kont/progress mimo instalacji wariantu; brak obietnic wipe przy reinstall. **Platform:** bundle/package/schemes, Keychain i signing mogą wymagać provider config; zaplanować przed zmianą IDs. **Dependencies:** owner configuration, R03/R04/R05/R06; zakończyć przed final proof SEC-01/09.

## SEC-04 — MEDIUM — App Check na recovery ACK/status

**Potwierdzenie w bieżącym kodzie:** Backend recovery issue/status, issue/saved-ack i consume/ack nadal używa bearer zamiast wymaganej App Check+bearer bramki. Consume/status ma oddzielny App Check-only guard; nie dodawać go omyłkowo do listy trzech wyjątków.

- **Exact risk/data:** posiadacz ważnego bearer/operation ID wywołuje protected mobile recovery ACK/status bez poprawnej attestation. Trzy wyjątki naruszają mandatory gate docs09; Firebase auth i generation nadal obowiązują.
- **Pliki/config:** backend `src/api/app.ts` routes consume/ack, issue/status, issue/saved-ack i bearer guard; `src/api/openapi.ts`; `tests/openapiContracts.test.ts`; odpowiednie lifecycle route tests.
- **Remediation:** wspólny protected-mobile guard na wszystkich trzech routes; popraw OpenAPI i behavioral probe expectations. Nie osłabiać reauthentication, ownership, generation ani no-store.
- **Test/manual proof i AC:** missing/invalid/unavailable App Check × poprawny/niepoprawny bearer; odrzucenie przed store effect, valid tuple dochodzi do właściwego handlera; private/no-store dla status i błędów. Obecny synthetic test pozwalający 503 bez App Check nie jest pozytywnym security proof. Real provider pass/fail/unavailable w R04.
- **Privacy copy:** bez nowej deklaracji danych; unavailable/retry nie udaje sukcesu. **Platform:** backend, mobile iOS/Android clients; WWW nie otrzymuje nowego prywatnego kanału. **Dependencies:** brak dla local fix; R04 kończy provider proof.

## SEC-05 — MEDIUM — Compact terminal sync i zamknięty nested state

**Potwierdzenie w bieżącym kodzie:** Account sync nadal serializuje pełne terminal TrainingSession; backend nested state nadal jest z.record(z.unknown()). Jeden compact DTO/closed schema musi obejmować sync i adoption w obu repo. Nie stwierdzono uploadu active draft.

- **Exact risk/data:** obecny klient wysyła cały zakończony TrainingSession, w tym currentItemIndex, foreground timer, exact item/option order i conditional plan; backend z.record(unknown) może zaakceptować dodatkowy draft/journal. Nie stwierdzono wysyłania aktywnego draftu przez obecny UI. Approved terminal answers/results/review nadal należą do account sync.
- **Pliki/config:** app `src/storage/repositories/accountDataRepository.ts`, `src/application/account/accountDataService.ts`, `src/domain/learning/trainingSession.ts`, materialization/history consumers i account tests; backend `src/modules/progress/contracts.ts`, `store.ts`, `src/modules/users/merge.ts`, adoption schema/handler consumers, `tests/progressContracts.test.ts`, `tests/progressStorage.emulator.test.ts`; canonical docs04/08/17 dla dokładnej listy pól.
- **Remediation:** jedno jawne compact terminal wire DTO zamiast serializacji local model; zamknięte per-record schemas także adoption, zgodne z client projection i materialization. Przenieść tylko wymagane terminal facts/refs, bez position/timer/order/draft/journal. Usunąć zastąpione whole-session copy i permissive path. Zmiana backend/app ma wspólny contract/version rollout w preproduction, bez nieuzasadnionej compatibility warstwy.
- **Test/manual proof i AC:** exact outgoing payload bez zakazanych pól; każde supported record type ma positive fixture, unknown nested fields są odrzucone bez zapisu; sync/adoption/retry/idempotency/bootstrap/export oraz Activity/history/review zachowują wymagane facts. Emulator dowodzi no-write, unit parse sam nie wystarcza do tego AC. Nie zmieniać scoringu/question runtime schema.
- **Privacy copy:** approved answers nadal sync; brak claimu active-session sync ani ukrywania nadmiarowych danych nową etykietą. **Platform:** app i backend razem, bez nowego SDK/permission. **Dependencies:** koordynacja PERSIST-02 (index integrity) i PERF-05 (progress store), exact contract R03; nie wymaga ukończenia całego PERF przed lokalnymi testami.

## SEC-06 — LOW — Integralność lokalnej historii content review

**Potwierdzenie w bieżącym kodzie:** Console POST mutations nadal nie walidują Host/Origin/JSON content type mimo loopback binding. Guard ma objąć wszystkie mutations; samo server rejection nie dowodzi browser PNA/reachability.

- **Exact risk/data:** obcy request do działającego loopback servera zmienia outcomes.json/reviewer/note/outcome. Probe foreign Host/Origin + text/plain JSON →200/approved; browser local-network reachability jest niezweryfikowana. Nie znaleziono downstream consumer w admission/build; nie jest to dowód publikacji niezatwierdzonego banku.
- **Pliki/config:** content `scripts/review/content-review-console.mjs` (server, body parser, recordOutcome i batch mutations), `tests/contentReviewConsole.test.mjs`, wyłącznie odpowiadające local-console instructions.
- **Remediation:** strict Host/Origin i związanie mutation request z własnym UI, wymagany JSON content type; utrzymać loopback binding. Bez nowego cloud auth/remote DB. Objąć wszystkie mutation routes, nie tylko jeden button.
- **Test/manual proof i AC:** disposable fixtures: foreign/missing origin, foreign host, simple content types i nieuprawnione mutation methods nie zmieniają pliku; same-origin UI działa. Sprawdzić local browser workflow bez tokenów w URL/logach; wynik PNA/runtime udokumentować osobno od serwerowego guard.
- **Privacy copy:** brak zmiany learner policy; dokumentacja console opisuje lokalny use case. **Platform:** developer Node/browser, nie mobile. **Dependencies:** niezależne od mobile/backend release.

## SEC-07 — LOW — Retencja metadanych unieważniania sesji

**Potwierdzenie w bieżącym kodzie:** rekordy `sessionRevocationOperations` nie mają terminu wygaśnięcia. API przyjmuje UUID klienta. Rekord ze statusem `revoked` pozwala ponowić wydanie sesji zastępczej, gdy poprzednia próba wydania tokenu nie powiodła się. Po usunięciu rekordu ten sam UUID może zostać potraktowany jako nowa operacja i ponownie wywołać unieważnienie. Status `failed` jest obecnie ponawialny.

**Decyzja właściciela z 07.10.2026:** metadane operacji, której unieważnienie zostało potwierdzone jako zakończone, przechowywać przez 30 × 24 godziny od niezmiennego czasu zakończenia. Ponowienie nie przedłuża terminu. Operacje aktywne i nadal wymagające ponowienia nie wygasają arbitralnie. Jest to okres historii operacji; nie zmienia skuteczności unieważnienia ani okresu ważności tokenów. Decyzja nie jest potwierdzeniem implementacji ani zgodą na zastosowanie konfiguracji w chmurze.

- **Ryzyko i dane:** obecnie identyfikatory użytkownika, konta i operacji, generacja, status, czas i kod awarii mogą pozostawać przez cały okres istnienia konta. Nie wykazano wycieku tokenów ani masowego zdalnego ataku odmowy usługi. Usunięcie historii bez ochrony przed powtórzeniem starego żądania może wywołać nowy skutek zamiast zwrócić wynik dawnej operacji.
- **Pliki:** backend `src/modules/account-lifecycle/store.ts`, `contracts.ts`, `src/infrastructure/firestore/paths.ts`, `config/firestore-ttl.json`, `docs/retention-runbook.md` oraz testy cyklu konta i retencji w emulatorze.
- **Wymagana zmiana:** precyzyjnie sklasyfikować stany. `failed` pozostaje ponawialny i nie otrzymuje arbitralnego TTL. Dla potwierdzonego zakończenia utrwalić jednokrotnie `terminalAt` i `expiresAt = terminalAt + 30 × 24 godziny`. Przed wygaśnięciem zachować bezpieczne ponowienie wyniku, w tym wydanie sesji zastępczej po awarii wydania tokenu. Ponowienie nie zmienia czasu zakończenia ani terminu retencji.
- **Wymagana ochrona po usunięciu historii:** stary identyfikator nie może uruchomić operacji jako nowej ani automatycznie wydać dostępu. Wybrać i niezależnie przejrzeć najmniejszy spójny mechanizm rozpoznawania starych żądań po fizycznym usunięciu rekordu. Samo sprawdzanie `expiresAt` i TTL jest niewystarczające dla obecnego UUID. Wybór algorytmu pozostaje pracą wykonawczą; przechowywanie dodatkowych identyfikatorów dłużej niż 30 dni wymaga jawnego rozstrzygnięcia retencji tych danych. Nie dodawać przy okazji ograniczania częstości żądań ani drugiego właściciela operacji.
- **Testy i kryteria odbioru:** aktywna lub ponawialna operacja pozostaje; ponowienie przed wygaśnięciem jest idempotentne; błąd wydania tokenu po potwierdzonym unieważnieniu nie powtarza unieważnienia. Sprawdzić granicę 30 dni zarówno przy istniejącym wygasłym rekordzie, jak i po jego usunięciu. W obu przypadkach stare żądanie nie wykonuje nowego skutku, nie przywraca dostępu ani starej generacji. Nowa świadoma operacja jest odrębna od ponowienia starej. Ponowienia nie odsuwają retencji, a usunięcie konta obejmuje wymagane rekordy.
- **Prywatność i platforma:** zaktualizować harmonogram retencji i opis kopii PITR zgodnie z rzeczywistą konfiguracją. Termin logicznego wygaśnięcia i późniejsze fizyczne usunięcie przez Firestore TTL mają osobne dowody; nie obiecywać natychmiastowego bezpowrotnego wymazania. Testy w emulatorze, a rzeczywista konfiguracja chmurowa w R04.
- **Zależności:** okres został zatwierdzony. Przed wdrożeniem potrzebny jest projekt i niezależny przegląd ochrony starych identyfikatorów; korzystać z istniejącego właściciela retencji. Odbiór konfiguracji zewnętrznej pozostaje w R04.

## SEC-08 — LOW — RevenueCat production logs

**Potwierdzenie w bieżącym kodzie:** RevenueCat configure nadal nie ustawia redagującego log handlera. Native SDK output wymaga próby właściwej pinned wersji; kod app potwierdza lukę konfiguracji, nie wynik native capture.

- **Exact risk/data:** pinned SDK loguje transaction/product IDs oraz raw failure descriptions przez native INFO/warning i RN console handler. Wymaga lokalnego dostępu do logów lub udostępnienia diagnostyki; nie wykazano answer/draft logging.
- **Pliki/config:** app `src/infrastructure/purchases/index.ts`, `index.test.ts`, `scripts/validateRuntimePrivacyBoundary.mjs`; pinned react-native-purchases10.9.0 / RevenueCat5.87.1 logging chain (dependencies są przedmiotem dowodu, nie ręcznych zmian node_modules/Pods).
- **Remediation:** przed configure bezpieczny log handler/konfiguracja wspierana przez SDK, zamknięte diagnostic categories bez raw SDK strings. Zweryfikować native chain: samo obniżenie level do ERROR nie redaguje warning/error payload. Nie usuwać potrzebnego purchase SDK.
- **Test/manual proof i AC:** SDK callback z synthetic transaction ID/error nie wypisuje wartości; release-compatible purchase/restore/error/warning capture nie ma IDs/credentials/customer payloads; zachowane bezpieczne kategorie. App grep PASS nie zastępuje native output assertion.
- **Privacy copy:** nie obiecywać braku wszystkich system/store logs; opisać własne zminimalizowane diagnostics zgodnie z finalnym zachowaniem. **Platform:** obecnie iOS native gateway; ponowić gdy Android purchase implementation aktywna. **Dependencies:** pinned SDK, R04/R05 dla capture prawdziwego zakupu/błędu.

## SEC-09A — LOW — iOS backup poza MMKV

**Potwierdzenie w bieżącym kodzie:** Plugin wyklucza MMKV, lecz nie ustanawia policy dla content package files i RC preferences/identity. Zachować wymaganie per-location containment/readback i actual backup/restore.

- **Exact risk/data:** Documents/patternly-content-node-packages-v1 i RC identity/CustomerInfo preferences pozostają backup-eligible, mimo contract exclusion. Pakiety nie zawierają odpowiedzi; brak dowodu takeover lub aktywacji przywróconego pakietu bez pointera. RC large-item cache jest Library/Caches; nie przypisywać mu backupu.
- **Pliki/config:** app `plugins/withPrivacyBoundary.js`, `src/content/runtime/nodePackageStorage.ts`, `src/content/application/nodePackageStoreComposition.ts`, `src/infrastructure/purchases/index.ts` i wspierana native SDK integration. SDK evidence: DeviceCache/UserDefaults+Extensions (suite/legacy standard), RemoteConfigDiskCache/DiagnosticsFileHandler/DirectoryHelper (Application Support).
- **Remediation:** jedna jawna backup policy per rzeczywista location; wspierane SDK containment/wykluczenie preferences i wymaganych Application Support entries oraz package directory, z read-back dowodem. Nie zakładać że nazwa cache wyklucza backup. Nie używać RC.logOut jako naprawy — tworzy anonymous identity i nie usuwa backupu. Diagnostics nie są aktualnie włączone; nie dokładać ich.
- **Test/manual proof i AC:** package files i SDK identity/entitlement sentinels nie trafiają do backup/transfer; aplikacja po restarcie nadal instaluje/aktywuje pakiety i odczytuje autoryzowane entitlements. Dowód atrybutów/locations + platform-supported archive/restore; sama obecność pluginu nie zamyka taska. Restore mismatch jawny; PERSIST-12 obejmuje corrupt pointer semantics.
- **Privacy copy:** no-OS-backup claim obejmuje udowodnione lokalizacje; store/provider transaction retention osobno, bez wipe starych kopii. **Platform:** tylko iOS. **Dependencies:** SEC-03 namespace, koordynacja PERSIST-12, R04/R05 native proof.

## SEC-09B — LOW — Android backup/transfer domains

**Potwierdzenie w bieżącym kodzie:** Android plugin ustawia allowBackup=false i root-only exclusions. Brakuje domain-complete policy oraz final merged manifest/probe; brak claimów dla niesprawdzonych OEM.

- **Exact risk/data:** allowBackup=false + root-only XML nie wyklucza osobnych file/database/sharedpref/device/external traversal roots, jeśli OEM dopuszcza D2D mimo allowBackup=false. Potencjalny transfer app ciphertext i metadata; brak dowodu odczytu learning plaintext bez device-only key ani rzeczywistego OEM restore.
- **Pliki/config:** app `plugins/withPrivacyBoundary.js`, generowane `android/app/src/main/res/xml/backup_rules.xml` i `data_extraction_rules.xml`, AndroidManifest.xml; test generatora/policy.
- **Remediation:** jawne domain-complete wykluczenia cloud backup i device transfer dla wspieranych API, nadal allowBackup=false; objąć credential, MMKV, caches i direct-boot odpowiedniki zgodnie z faktycznym manifestem. Nie polegać na root path jako rekursywnym wildcard wszystkich domen.
- **Test/manual proof i AC:** XML valid dla target/min SDK; final merged manifest wskazuje właściwe reguły, każda używana domena wykluczona; supported backup/D2D probe nie odtwarza sentinels lub jawnie wykazuje wyłączenie mechanizmu przez OS. Sprawdzić key-loss fail-closed. Test na jednym urządzeniu/emulatorze naraz; nie deklarować wyników dla niesprawdzonych OEM.
- **Privacy copy:** ograniczenia OEM i odtwarzania nie mogą być zastąpione bezwarunkowym claimem z samego allowBackup=false. **Platform:** Android; nie blokuje wcześniejszego iOS SIM-READY. **Dependencies:** SEC-03, R06 końcowy proof.

## SEC-10 — LOW — Niepotrzebny Face ID purpose string

**Potwierdzenie w bieżącym kodzie:** SecureStore plugin config nie wyłącza faceIDPermission. Pierwszy konkretny dowód to clean prebuild/frozen Info.plist; usunięcie klucza dopiero po wspieranej konfiguracji, bez nowego biometrics flow.

- **Exact risk/data:** wygenerowany Info.plist zawiera domyślny NSFaceIDUsageDescription mimo braku requireAuthentication/use case. String nie uruchamia promptu i nie dowodzi pobrania biometrics.
- **Pliki/config:** app `app.config.js` SecureStore plugin, config validation/prebuild assertion, wynikowy iOS Info.plist.
- **Remediation:** wspierane wyłączenie faceIDPermission dla pluginu; nie wprowadzać nowej funkcji biometrics ani fikcyjnego disclosure.
- **Test/manual proof i AC:** clean prebuild i frozen plist bez klucza; auth/MMKV/recovery vault nadal działają bez biometrics, brak nowego entitlement. **Privacy copy:** brak unused purpose string; bez zmiany rzeczywiście używanych logowania/powiadomień. **Platform:** iOS. **Dependencies:** R03/R05 artifact proof; brak zależności implementacyjnej.

## Privacy acceptance istniejącego PERSIST-03 — finding SEC-11 MEDIUM

- **Exact risk/data:** po utracie indeksu reset zwraca success, lecz fizyczny terminal session record pozostaje. Probe na audytowanym pushed SHA potwierdził to niezależnie. Scenario wymaga niespójnego storage; nie wykazano ponownego pojawienia się danych w UI ani ich uploadu.
- **Owner/pliki/remediation:** PERSIST-03 i jego istniejące scope reset builder/clearers/materializer/verifier; `src/features/home/localReset.ts`, `src/storage/repositories/trainingSessionRepository.ts`, `trainingAttemptRepository.ts`, `reviewQueueRepository.ts`, `mutationJournalRepository.ts`, `src/application/learningMutations/mutationVerifier.ts`, guest/account reset tests. Nie tworzyć równoległego delete ownera. Exact reset targets, physical absence verification lub jawny fail-closed stan, bez usuwania obcych profili i bez odtwarzania indeksu na ślepo.
- **Test/manual proof i AC:** orphan session/attempt/review/result/archive/unavailable każdy osobno; index deletion/missing target, delete failure/no-op/write-then-error, restart/retry; user-visible success tylko po wymaganym verified absence. Preserve scope ustawień/celu/planu/identity/binding/report outbox. PERSIST-13 zapewnia native proof; pamięciowy probe nie dowodzi secure erase.
- **Privacy copy:** „historia usunięta” dopiero po weryfikacji całego scope; osobno local account reset i ponowny cloud sync. Bez obietnicy usunięcia OS backupów/secure erase. **Platform:** oba mobile; physical iOS R05, Android R06. **Dependencies:** istniejące PERSIST-02/03/13; ten wpis rozszerza acceptance, nie dodaje zadania implementacyjnego.

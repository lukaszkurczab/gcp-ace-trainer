# Bezpieczeństwo i prywatność — zakres pozostałych zadań

Status i kolejność należą wyłącznie do [planu głównego](../../PATTERNLY-WORKING-PLAN.md). Ten dokument precyzuje zadania; nie stanowi drugiej kolejki ani dowodu obecnego defektu.

Porównano źródła i testy 07.10.2026: app `e889b05d033d4cc4b7676d0ca3f224efc3fac115`, backend `039f7f000e701c4fbc69e18a1fb66528cbc5cdcb`, content `8bb27fa2bd4f1af58fb8c1b49e5314a1691bbb03`. Poniżej podano aktualną brakującą pracę i granicę dowodu. Nie trzeba odtwarzać audytu02.10 ani dawnych pakietów; zwykły preflight wykonawcy ma tylko wykryć późniejszą zmianę źródła. Historyczne probes/pomiary przytoczone w opisach nie są nowym native acceptance. CH-01–05 pozostają zakończone.


## SEC-01 — MEDIUM — Device-only auth persistence

**Stan 14.10.2026 / 08:** lokalna implementacja używa iOS `WHEN_UNLOCKED_THIS_DEVICE_ONLY` oraz `requireAuthentication:false` we wszystkich get/set/delete, ancillary, verified clear oraz inspect. Android zachowuje opcje Keystore bez iOS-only constant. Zachowuje domyślny service z SEC-03 (iOS `app`, Android `key_v1`), bez zmiany kluczy/migratora. [Dowód i granice 08](#przyjęty-kontrakt-i-dowód-08); rzeczywisty atrybut Keychain i restore/transfer pozostają R05.

- **Exact risk/data:** po iOS backup/transfer durable Firebase refresh token, UID/email/provider metadata mogą być przeniesione do innej instalacji, wbrew docs08/09. Wymaga dostępu do backup/restore; nie jest zdalnym auth bypass.
- **Pliki/config:** app `src/infrastructure/firebase/secureAuthPersistence.ts`, `src/infrastructure/firebase/firebaseAuthClient.ts`, ich adapter/SDK tests, `src/application/account/accountIdentityComposition.test.ts`; wzorzec device-only w `src/infrastructure/storage/encryptedStorageNative.ts`.
- **Remediation:** jeden jawny device-only service/accessibility contract dla wszystkich auth reads/writes/deletes; uzgodnić namespace z SEC-03. Bez migratora nieopublikowanych historycznych instalacji. Zachować potrzebny refresh token i verified clear.
- **Test/manual proof i AC:** rekord używa native non-migrating accessibility; restart odtwarza bieżącą sesję, signout/deletion usuwa i weryfikuje brak; restore na innym urządzeniu nie odtwarza credential. Unit adapter options i lifecycle nie zastępują native item attribute/restore proof. Zwykły reset historii nie wylogowuje.
- **Privacy copy:** twierdzenie o wykluczeniu credentials z transferu zgodne z dowodem; bez obietnicy secure erase/wymazania starych backupów. **Platform:** iOS; sprawdzić brak regresji Android SecureStore. **Dependencies:** SEC-03 dla końcowych nazw, SEC-09B Android policy; native/provider dowód R04/R05.

## SEC-02 — MEDIUM — Minimalne provider profile

**Stan 14.10.2026 / 08:** Apple żąda wyłącznie EMAIL; jeden persisted DTO odrzuca top/provider displayName/photoURL/phoneNumber. Restore/re-auth/link/unlink sprawdzono na rzeczywistym zainstalowanym SDK z testowym HTTP. Google Expo provider nadal wymusza profile scopes, więc manifest zachowuje Name; nie zastąpiono jego OAuth flow. [Dowód i granice 08](#przyjęty-kontrakt-i-dowód-08).

- **Exact risk/data:** Apple FULL_NAME i persisted displayName/photoURL/phoneNumber bez launch use case zwiększają zakres lokalnego profilu. Pole zwrócone przez providera nie staje się automatycznie potrzebnym rekordem produktu.
- **Pliki/config:** app `src/infrastructure/firebase/firebaseAuthClient.ts`, `src/infrastructure/firebase/secureAuthPersistence.ts`, ich identity tests, `plugins/withPrivacyBoundary.js` (Name declaration), właściwe privacy locale/template consumers z R01.
- **Remediation:** usunąć unused Apple scope i zbędne profile fields także w providerData; ustalić minimum na rzeczywistym Firebase restore/link/re-auth. Nie usuwać koniecznych UID/email/provider IDs/timestamps tylko na podstawie nazwy pola. Jeden persisted DTO, bez równoległego pełnego profilu.
- **Test/manual proof i AC:** synthetic provider z dodatkowymi polami nie utrwala ich; accepted serialized shape zamknięty; sign-in→restart→link/unlink/re-auth działa w R04. Brak przypadkowej utraty credentials i user-visible identity.
- **Privacy copy:** deklarować faktycznie przetwarzane identity fields; Name w manifest usunąć po potwierdzeniu braku innych konsumentów, nie samą zmianą etykiety maskować zbieranie. **Platform:** iOS/Android auth; bez nowego permission. **Dependencies:** wspólny adapter SEC-01, R01/R04.

### Przyjęty kontrakt i dowód 08

Zakres sesji: wyłącznie SEC-01/02/10. Punkt startu APP `f79d2fb0`, czysty Git; kod 07 był już w HEAD i nie został powtórnie implementowany. Bieżące polecenie właściciela dopuszcza ten niezależny lokalny wycinek mimo otwartego native residualu 07. Nie zmieniono globalnej blokady środowisk, provider IDs, signing, treści ani pinów.

Main jedynym writerem. Ocena podejścia: dopasowanie 0,95 / prostota 0,94 / kontrola ryzyka 0,87 / utrzymywalność 0,94, minimum 0,87. Niezależny design review `gpt-6-luna high`: przyjęty, oceny 0,92 / 0,90 / 0,82 / 0,86, **minimum 0,82**. Zachowany service zapobiega odcięciu istniejących credentials; opcje dotyczą dostępności, nie przeniesienia do nowego namespace. Bez biometrics i bez nowej abstrakcji providera. Pierwsze QA wykryło brak eksportu stałej Keychain na Androidzie: globalny numeric guard blokował auth. Poprawiono go na iOS-only; Android nie dostaje keychainAccessible, zawsze dostaje requireAuthentication:false. Testy wykonują rzeczywisty default loader z natywnym kształtem modułów obu platform, a brak stałej iOS nadal zamyka auth. To dowód adaptera, nie test urządzenia Android. Po korekcie powtórzono 12 testów auth/platform i typecheck; pozostałe 68+15 zachowują aktualność (nie zmieniono ich implementacji, zależności ani konfiguracji wykonania).

Jeden DTO nadal zachowuje UID, email, emailVerified, isAnonymous, providerData (providerId/uid/email), createdAt/lastLoginAt i refreshToken z expirationTime=0. Nie utrwala ID/access tokenów ani name/photo/phone, także po SDK merge linkowania. Lokalny SDK RN `@firebase/auth@1.13.4` `_fromJSON` przyjmuje brak tych trzech pól; aplikacja używa UID/email/provider IDs, nie profilu. `expo-auth-session` Google `minimumScopes` wymusza openid/userinfo.profile/userinfo.email przez `applyRequiredScopes`; samo podanie scopes nie usuwa profile. Dlatego `plugins/withPrivacyBoundary.js` i deklaracja Name pozostały bez zmian. Niemiecki szkic prywatności skorygowano wyłącznie w zdaniu o Apple EMAIL.

Weryfikacja 14.10.2026 (APP, Node 22.22.3):

```sh
node --import tsx --test src/infrastructure/firebase/secureAuthPersistence.test.ts src/infrastructure/firebase/secureAuthPersistenceSdk.test.ts src/infrastructure/firebase/firebaseAuthClient.test.ts scripts/platformConfig.test.ts
npm run typecheck
node --import tsx --test src/application/account/accountIdentityComposition.test.ts scripts/nativePrivacyBoundary.test.ts scripts/buildRuntimeConfiguration.test.ts src/infrastructure/storage/encryptedStorageNative.test.ts
node --import tsx --test src/infrastructure/security/recoveryOperationVault.test.ts src/legal/legalDocumentMap.test.ts src/legal/providerRegistrationDocuments.test.ts
node scripts/qa/checkAuthPrivacyPrebuild.mjs
npm run qa:static
npm run validate:content-boundary
npm run validate:runtime-privacy-boundary
git diff --check
```

**95/95 testów PASS, 0 SKIP** (12 auth/platform, 68 composition/config/privacy/storage wrapper, 15 vault/legal). Typecheck, content boundary, runtime privacy boundary i diff check PASS. SDK test korzysta z rzeczywistego Firebase: sign-in → zimne odtworzenie instancji i refresh bez trwałego ID tokena → re-auth → link → restart → unlink → signout → restart bez konta → sign-in → deletion. Zamknięty JSON sprawdzany po operacjach; transport HTTP i port SecureStore są testowe. Przed budową testu mały rzeczywisty probe SDK ustalił dwa endpointy restore (`token`, `accounts:lookup`), zamiast zakładać kontrakt mocka.

**Clean prebuild PASS:** wersjonowane `scripts/qa/checkAuthPrivacyPrebuild.mjs` generuje smoke iOS przez aktualny `createExpoConfig` i pluginy, `--no-install --clean --platform ios`, w katalogu tymczasowym; nie modyfikuje workspace `ios`. Końcowy `/tmp/patternly-auth-prebuild-UC429F/ios/Patternly/Info.plist` nie zawiera `NSFaceIDUsageDescription`, SHA256 `e0602c9762ecf2d79652258254810e72328a1636fd6326086ccc45817a0f4a68`. PrivacyInfo nadal ma Name, entitlements bez remote notification. To wygenerowany projekt smoke, nie skompilowany/frozen kandydat wydania; finalny artifact proof pozostaje R03/R05. Nie instalowano aplikacji, nie otwierano/resetowano simulatora, bez reinstall/newGuest i Androida.

**Granica repo gate:** `qa:static` zatrzymuje się na recovery inventory: istniejący `src/testing/terminalWireFixture.ts:2` importuje `journalTestSupport`. Import potwierdzono w bazowym HEAD, plik bez diffu. Pełnego npm test ani hosted CI nie uruchomiono; brak clean repo gate. Nie naprawiano obcego zakresu.

**Granice odbioru:** opcje adaptera i SDK lifecycle nie dowodzą atrybutu istniejącego Keychain item, transferu/backup restore ani działania rzeczywistych Apple/Google usług. Native residual 07 pozostaje osobno; R04 zachowuje provider sign-in/link/re-auth, **R05 przejmuje rzeczywiste Keychain attributes, device restore/transfer oraz frozen plist**. Android native proof według etapu po iOS. Brak obietnicy usunięcia dawnych backupów. Niezależny acceptance QA `gpt-6-luna high`: **PASS dla AC code/local**, **PASS WITH ISSUES** dla code/local slice z jawną nieodebraną bramką repo (wcześniejszy recovery inventory failure). QA powtórzyło focused 12, typecheck, diff; wcześniejsze 52 composition/platform/privacy i clean prebuild zachowują aktualność. Końcowy review planu/stanu/dowodów bez istotnych niespójności. R04/R05 są osobnymi odbiorami, nie domniemanym PASS.

Hashe implementacji i narzędzi przy powyższej weryfikacji:

```text
df9a7c1116e4d2cf683e227592a6d2515ecafc71c25980c8ea54e0e8087349c4 src/infrastructure/firebase/secureAuthPersistence.ts
6096cce8c2a897851451a39b7222a0ef38f592dd21787e59f527536cb3c8ac86 src/infrastructure/firebase/firebaseAuthClient.ts
b68ce2a8ba195e03dc88e4edf81d18c027f22cf74552950ddc1b8914f35c7fe1 app.config.js
4be5bdeb2af209d98da3b40c9fb51cc91e1e174adf2972140135cf30bf7b48fb plugins/withPrivacyBoundary.js (bez zmian)
a0968234b27dfaaf1cd994d48428b6157f2279d2674625e0bc327f5e8ad06123 src/infrastructure/firebase/secureAuthPersistenceSdk.test.ts
f11993ff14b19932b6aad0e43ed7024bf578a36ebe56982f8d27b553a5edc0fd scripts/qa/checkAuthPrivacyPrebuild.mjs
```

## SEC-03 — MEDIUM — Izolacja środowisk w durable state

**Stan 14.10.2026 / prompt 07: CODE PASS, całość PARTIAL.** Wdrożono jeden globalny fingerprint przed załadowaniem regular root. Native iOS uruchomił bieżący JS z Metro na istniejącym binary z legacy metadata i potwierdził blokadę; pełna sekwencja A→B→A i compatible overinstall pozostają residualem 07. Android pozostaje po iOS. Brak dowodu cross-account backend access.

- **Exact risk/data:** sekwencyjny compatible-signed overinstall sandbox/release o tym samym bundle/package ID otwiera poprzednie keys/auth/profile/cache. Endpoint różni się bez trwałej granicy storage. Nie dowiedziono cross-account dostępu do backendu.
- **Pliki/config:** app `app.config.js`, `src/infrastructure/storage/encryptedStorageNative.ts`, `encryptedStorageBootstrap.ts`, `profileStorageRouter.ts`, `src/infrastructure/firebase/secureAuthPersistence.ts`, `src/infrastructure/security/recoveryOperationVault.ts`, package storage i purchases composition; powiązane provider IDs/config i config/storage tests.
- **Remediation:** jedna kanoniczna tożsamość środowiska; odrębne app/storage/key/auth/cache namespaces lub fail-closed fingerprint przed jakimkolwiek odczytem/użyciem obcego stanu. Wybrać najmniejszy spójny wariant po sprawdzeniu Keychain i provider callback identities. Bez niezależnych heurystyk w poszczególnych repozytoriach i bez kasowania obcych danych.
- **Test/manual proof i AC:** A→B→A sentinels w MMKV, auth, vault, registry i caches; B nigdy nie odczytuje/wysyła A, A zachowuje własne dane; mismatch jawny przed auth/sync. Test iOS overinstall oraz Android oddzielnie na jednym istniejącym urządzeniu naraz; nie tworzyć duplikatów simulatorów. Dowód config fingerprint dla R03.
- **Privacy copy:** środowiska nie przenoszą kont/progress mimo instalacji wariantu; brak obietnic wipe przy reinstall. **Platform:** bundle/package/schemes, Keychain i signing mogą wymagać provider config; zaplanować przed zmianą IDs. **Dependencies:** owner configuration, R03/R04/R05/R06; zakończyć przed final proof SEC-01/09.

### Przyjęty kontrakt i dowód 07

Wybrano globalną blokadę, ponieważ namespace własnych repozytoriów nie obejmuje wszystkich lokalizacji SDK RevenueCat. `App.tsx` przekazuje loader do `EnvironmentGate`; regular root jest wymagany dopiero po `ready`. Przed tym punktem nie ładuje się preferencji/i18n, auth, storage, vault, synchronizacji, pakietów ani purchases. Izolowane fixture PERSIST-13/PERF-06 zachowują własne dotychczasowe granice, nie są alternatywnym wejściem do regularnej aplikacji.

`src/infrastructure/runtime/environmentIdentity.ts` jest jedynym właścicielem fingerprintu: SHA256 wersjonowanej tablicy runtime mode, znormalizowanego API origin, smoke Auth Emulator origin, Firebase project/app/auth domain i publicznego klucza aplikacji RevenueCat. Ten sam kod generuje `extra.patternlyEnvironmentFingerprint` w `app.config.js` i fingerprint runtime. Różnica między metadata artefaktu a runtime zatrzymuje start. Hasło/E2E user, numer builda, link pomocy i przełącznik checkout nie są tożsamością. Zmiana związanej konfiguracji świadomie blokuje dostęp; nie ma automatycznego przepisywania znacznika.

Znacznik `patternly.environment-fingerprint.v1` używa service `com.lkurczab.patternly.environment`; na iOS `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Zapisywane są wyłącznie `version:1` i digest. Adapter nie ma operacji delete. Mismatch/uszkodzenie/niedostępność pozostawia aplikację zamkniętą. Zapis wymaga exact read-back i ponownej inspekcji przed załadowaniem aplikacji. Żaden storage/purchases adapter nie otrzymał osobnej heurystyki środowiska.

**Decyzja właściciela w tej sesji:** brak znacznika wymaga jawnego przypisania istniejących danych do pokazanego środowiska/API/projektu Firebase. Jest to świadome potwierdzenie pochodzenia, nie kryptograficzny dowód dla historycznych danych. Nie przypisywać automatycznie na podstawie bieżącego builda. Właściciel potwierdził, że dane obecnego iPhone17 należą do **smoke**. Istniejącego znacznika nie można zmienić z ekranu przypisania. Utrata znacznika ponownie wymaga tej decyzji; stare buildy bez blokady i zmiana środowiska przez live Fast Refresh nie są objęte gwarancją zimnego startu nowych buildów.

Ocena main: dopasowanie 0,94 / prostota 0,91 / kontrola ryzyka 0,84 / utrzymywalność 0,93, minimum 0,84. Niezależny design review `gpt-6-luna high`: 0,91 / 0,88 / 0,82 / 0,90, minimum 0,82. Main jedynym writerem. Niezależne QA kodu: PASS; pełny lokalny odbiór PASS WITH ISSUES, bez native A→B→A. QA narzędzia wskazało dodatkową precondition zamknięcia wszystkich pięciu chronionych ownerów przed assign; została dodana. Nie zmieniono bundle/package/scheme, podpisu ani provider IDs, więc nie wykonano zmian callbacków/rejestracji.

Rzeczywiste lokalizacje i ograniczenia:

| Dane | Lokalizacja / granica |
| --- | --- |
| MMKV, profile/registry, lokalny cache | `Documents/mmkv/patternly-secure-a/b`; manifesty/klucze i registry controls w SecureStore service `com.lkurczab.patternly.encrypted-storage`. Na istniejącym iPhone17 obecny plik slotu a, brak legacy i slotu b. Odczytano tylko istnienie. |
| Firebase Auth | SecureStore domyślnego service; `patternly.auth.user` i hashed ancillary keys. Bez zmiany opcji auth (SEC-01 osobno). |
| Recovery vault | `patternly.security.recovery-operation.v1`, service `com.lkurczab.patternly.recovery-operation`. |
| Pakiety | `Documents/patternly-content-node-packages-v1`, obecny na iPhone17; odczytano tylko istnienie. Pointers w chronionym MMKV. |
| RevenueCat | Pinned Pod: `UserDefaults+Extensions.swift` wybiera standard defaults przy legacy appUserID albo suite `com.revenuecat.user_defaults`. `DeviceCache` używa też `Library/Caches/{bundleId}.revenuecat/device-cache`; `FileRepository` — `Library/Caches/RevenueCat`; `RemoteConfigDiskCache`/diagnostics używają Application Support, według `DirectoryHelper`. To powód globalnej blokady. Brak native sentinela zakupowego ani konfiguracji SDK w tej próbie. |

Odtwarzalny wąski gate (Node 22.22.3, APP HEAD przed zmianą `ea9e5d924a51f763dee64bd68777cd6782b2fb5f`):

```sh
node --import tsx --test src/infrastructure/runtime/*.test.ts scripts/buildRuntimeConfiguration.test.ts scripts/platformConfig.test.ts src/infrastructure/storage/encryptedStorageBootstrap.test.ts src/infrastructure/storage/encryptedStorageNative.test.ts src/infrastructure/firebase/secureAuthPersistence.test.ts src/infrastructure/security/recoveryOperationVault.test.ts src/storage/repositories/storageCutover.test.ts src/application/runtimeAuditability/persist13Entry.test.ts
npm run typecheck
npm run validate:content-boundary
npm run validate:runtime-privacy-boundary
git diff --check
```

Wynik main: **66/66 PASS, 0 SKIP**, pozostałe cztery kontrole PASS. W tym 10 nowych testów identity/guard/wykonywanego kodu App+Gate: A→B→A model, brak overwrite, błędy/corrupt/no-op/write-then-error/readback, single assignment, parity build/runtime oraz brak require regular root przed kontrolą i potwierdzeniem. Syntetyczny React scheduler/native ports nie dowodzą trwałości SDK/Keychain. QA niezależnie wykonało te 10 testów, typecheck, privacy boundary i diff check: PASS.

Wymagane `npm run qa:static` zatrzymało się na `recovery:check`: `runtime source imports test-only support: src/testing/terminalWireFixture.ts`. Potwierdzono ten sam import `journalTestSupport` w HEAD i brak diffu tego pliku; nie naprawiano poza zakresem. Pełne `npm test` nie zostało uruchomione po zatrzymaniu gate; nie ma claimu pełnego CI ani clean repo gate.

Native próba: jedno istniejące iPhone17 / iOS26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`, jedna istniejąca instalacja `com.lkurczab.patternly`. Lokalny Metro ze smoke profile, bez uruchamiania backendu, zmian usług zewnętrznych, resetu/reinstall/newGuest i przypisania znacznika. Pierwsze uruchomienie Metro w sandboxie: EMFILE; istniejący Watchman działa po uruchomieniu poza sandboxem, bez zmiany repo. Odczyt simctl poza sandboxem rozwiązał odmowę CoreSimulator. Wstępny probe ujawnił względne `verboseName`; wersjonowane narzędzie używa exact unique owner names i nie interpretuje braku ownera jako `false`.

```sh
node scripts/qa/probeEnvironmentGuardIos.mjs http://127.0.0.1:8081 inspect
```

Końcowy receipt z rzeczywistego Hermesa: `mode=smoke`, fingerprint `4d8001befde58a6e36643f99ab09bc29c4a6175337d33163105be15dfc69748e`, `configMatches=false`, `state=unassigned`, `rootInitialized=false`; `mmkvClient`, `firebaseAuthClient`, `recoveryOperationVault`, `purchases/index`, `nodePackageStorage` wszystkie `false`. Odczyt zainstalowanego `EXConstants.bundle/app.config` potwierdził **brak** nowego `extra.patternlyEnvironmentFingerprint`. To rzeczywisty dowód zamknięcia bieżącego JS z Metro na istniejącym binary z legacy metadata przed providerami, nie dowód A→B→A/overinstall ani natywnej retencji wszystkich kategorii. Narzędzie `inspect` czyta tylko nowy znacznik, nie otwiera chronionych ownerów; `assign` wymaga osobnej jawnej autoryzacji i exact oczekiwanego digestu, zgodnych metadata oraz wszystkich ownerów zamkniętych. W tej sesji `assign` nie uruchomiono. Własny Metro zatrzymano.

**Residual 07:** przygotować zgodny natywny artefakt bez zmiany IDs/signing, następnie kontrolowane jawne przypisanie smoke i zimne A→B→A/compatible overinstall z kategoriami MMKV/auth/vault/registry/cache/purchases, zachowaniem A i brakiem dostępu/wysyłki w B. Dotychczasowego klienta nie obchodzić podmianą metadata ani kasowaniem danych. Android proof pozostaje po iOS (prompt 54). Odbiór usług/backup/transfer/SEC-01 i wydania pozostaje osobno. Nie commitowano/pushowano częściowego pakietu.

Źródła objęte dowodem (SHA256; po review kodu i poprawce precondition narzędzia):

```text
4dad9a99a8fa4880f2e55ccd17e4e27e1f72c7106b3a61b5d0dfbce00ec8ef6f App.tsx
d516599997fee21d2dd1435fc5d921668580d9aafa349d87b830ca82cd27e0d0 app.config.js
a0c6f52ac3b3b2bd9f188596d4b92dbefa8f16b21f5d76897561f9bf3e06926a src/infrastructure/runtime/EnvironmentGate.tsx
70eb9d10d0c91e9281ba3971870c77df611bdb5e598affa4f2c9897249695c0c src/infrastructure/runtime/environmentIdentity.ts
90fcbef072a6c27692e9e8c647b24b5ea0370d0b6f6ea3d8b2adb62fc69a949d src/infrastructure/runtime/environmentGuard.ts
012a869566ba6ae5f1dc2ce496eb94763843c20699e26c4fe42ef2f724db7921 src/infrastructure/runtime/environmentIdentity.test.ts
62731801508fa26a9dac1080845b4b00a284ec1d6171e7ef9cded781208ad2ae src/infrastructure/runtime/environmentGuard.test.ts
7a321e35220c8d8ec095d55397b9f74054d30118008bf39bad1fa3924bc5ddce src/infrastructure/runtime/environmentEntry.test.ts
c628acb63696432df9c3f077d4b6880d346d73a02b0dc49c7fe7a7507ab8f797 scripts/qa/probeEnvironmentGuardIos.mjs
```

## SEC-04 — MEDIUM — App Check na recovery ACK/status

**Potwierdzenie w bieżącym kodzie:** Backend recovery issue/status, issue/saved-ack i consume/ack nadal używa bearer zamiast wymaganej App Check+bearer bramki. Consume/status ma oddzielny App Check-only guard; nie dodawać go omyłkowo do listy trzech wyjątków.

- **Exact risk/data:** posiadacz ważnego bearer/operation ID wywołuje protected mobile recovery ACK/status bez poprawnej attestation. Trzy wyjątki naruszają mandatory gate docs09; Firebase auth i generation nadal obowiązują.
- **Pliki/config:** backend `src/api/app.ts` routes consume/ack, issue/status, issue/saved-ack i bearer guard; `src/api/openapi.ts`; `tests/openapiContracts.test.ts`; odpowiednie lifecycle route tests.
- **Remediation:** wspólny protected-mobile guard na wszystkich trzech routes; popraw OpenAPI i behavioral probe expectations. Nie osłabiać reauthentication, ownership, generation ani no-store.
- **Test/manual proof i AC:** missing/invalid/unavailable App Check × poprawny/niepoprawny bearer; odrzucenie przed store effect, valid tuple dochodzi do właściwego handlera; private/no-store dla status i błędów. Obecny synthetic test pozwalający 503 bez App Check nie jest pozytywnym security proof. Real provider pass/fail/unavailable w R04.
- **Privacy copy:** bez nowej deklaracji danych; unavailable/retry nie udaje sukcesu. **Platform:** backend, mobile iOS/Android clients; WWW nie otrzymuje nowego prywatnego kanału. **Dependencies:** brak dla local fix; R04 kończy provider proof.

## SEC-05 — Compact terminal sync i zamknięty nested state — lokalnie odebrane

**14.10.2026 / prompt 04: PASS w ograniczonym zakresie kodu i kontraktu.** [Kontrakt, własne pliki, hashe, komendy i granice dowodu](../../../../patternly-backend/docs/terminal-account-wire.md). APP jawnie produkuje `terminal-session-v1`; sync, one-shot adoption i staged transfer mają wspólny zamknięty guard per-record, także po stronie klienta/materialization/eksportu. Nieznane nested fields są odrzucane bez zapisu. Stare whole-session payloady i kolejki nie są migrowane ani ponownie hashowane; jawna odmowa zachowuje dane i mutation IDs.

- **Terminal facts a aktywna sesja:** wire nie zawiera pozycji, active pointer, draftu, journala ani checkpointu timera. `durationMs` jest niezmiennym faktem terminalnym; adapter do istniejącego magazynu odtwarza długość i terminalny indeks bez tworzenia active pointer. Abandoned pozostaje abandoned i nie może być wznowione.
- **Korekta starej listy pól po końcowym QLE:** exact item/option order, configuration, conditional slots i review-source snapshots pozostają niezmiennym evidence planu, ponieważ hash oraz historyczny Coding/Review ich wymagają. Nie wolno usuwać ich pod ogólną etykietą „order/timer”, wyczyścić fingerprintu ani przeliczać historii. Zachowane first response, assistance/prior exposure i case exposure. Nie zmieniono question runtime schema, scoringu, content pins ani magazynu sesji.
- **Materialization/eksport:** siedem record types wraca przez sync/adoption/bootstrap/history/review/export. Eksport czyta kanoniczną aktywną generację progress; usunięto zastąpiony odczyt wyłącznie generation 0 i permissive parser. Supported closed plan z błędem domeny nadal przechodzi jawne quarantine/replacement; unsupported schema/unknown fields kończą się odmową.
- **Wykonane dowody:** APP 120/120; realny Auth/Firestore terminal-wire 52/52; fingerprint 5/5; po szerszym przebiegu wąska regresja privacy export/progressStorage 19/19. Niezależny review Luna high. Oba typechecki, lint i właściwe boundaries PASS.
- **Granice:** pełny backend `npm test` nie jest PASS (331 PASS / 4 FAIL / 10 SKIP); dwie istotne porażki sprawdzono ponownie w 19/19, token CLI przeszedł osobno, native piped-stdin TTY pozostaje poza wycinkiem. Nie odebrano hosted CI, rollout usług ani wydania. Dokładne szczegóły i odtwarzalne komendy w dowodzie. OpenAPI/HTTP transport pozostaje osobnym promptem 05; obecny inventory/generator PASS nie dowodzi closed nested OpenAPI.

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

**Stan 14.10.2026 / 08:** wspierane `faceIDPermission:false` w SecureStore plugin; clean prebuild smoke potwierdza końcowy Info.plist bez klucza, bez custom plist workaround. [Dowód i granice 08](#przyjęty-kontrakt-i-dowód-08); frozen release artifact osobno R03/R05.

- **Exact risk/data:** wygenerowany Info.plist zawiera domyślny NSFaceIDUsageDescription mimo braku requireAuthentication/use case. String nie uruchamia promptu i nie dowodzi pobrania biometrics.
- **Pliki/config:** app `app.config.js` SecureStore plugin, config validation/prebuild assertion, wynikowy iOS Info.plist.
- **Remediation:** wspierane wyłączenie faceIDPermission dla pluginu; nie wprowadzać nowej funkcji biometrics ani fikcyjnego disclosure.
- **Test/manual proof i AC:** clean prebuild i frozen plist bez klucza; auth/MMKV/recovery vault nadal działają bez biometrics, brak nowego entitlement. **Privacy copy:** brak unused purpose string; bez zmiany rzeczywiście używanych logowania/powiadomień. **Platform:** iOS. **Dependencies:** R03/R05 artifact proof; brak zależności implementacyjnej.

## Privacy acceptance istniejącego PERSIST-03 — finding SEC-11 MEDIUM

- **Exact risk/data:** po utracie indeksu reset zwraca success, lecz fizyczny terminal session record pozostaje. Probe na audytowanym pushed SHA potwierdził to niezależnie. Scenario wymaga niespójnego storage; nie wykazano ponownego pojawienia się danych w UI ani ich uploadu.
- **Owner/pliki/remediation:** PERSIST-03 i jego istniejące scope reset builder/clearers/materializer/verifier; `src/features/home/localReset.ts`, `src/storage/repositories/trainingSessionRepository.ts`, `trainingAttemptRepository.ts`, `reviewQueueRepository.ts`, `mutationJournalRepository.ts`, `src/application/learningMutations/mutationVerifier.ts`, guest/account reset tests. Nie tworzyć równoległego delete ownera. Exact reset targets, physical absence verification lub jawny fail-closed stan, bez usuwania obcych profili i bez odtwarzania indeksu na ślepo.
- **Test/manual proof i AC:** orphan session/attempt/review/result/archive/unavailable każdy osobno; index deletion/missing target, delete failure/no-op/write-then-error, restart/retry; user-visible success tylko po wymaganym verified absence. Preserve scope ustawień/celu/planu/identity/binding/report outbox. PERSIST-13 zapewnia native proof; pamięciowy probe nie dowodzi secure erase.
- **Privacy copy:** „historia usunięta” dopiero po weryfikacji całego scope; osobno local account reset i ponowny cloud sync. Bez obietnicy usunięcia OS backupów/secure erase. **Platform:** oba mobile; physical iOS R05, Android R06. **Dependencies:** istniejące PERSIST-02/03/13; ten wpis rozszerza acceptance, nie dodaje zadania implementacyjnego.

# AUD-04 — kontrakt i mapa właścicieli (krok A)

**Status:** krok A ukończony lokalnie; kroki B–D pozostają otwarte.  
**Data:** 23 września 2026  
**Zakres:** uzgodnienie istniejących właścicieli oraz kontraktu pakietu Premium. Bez zmian kodu, banków treści ani konfiguracji usług.

## Wynik

Zatwierdzony kierunek wykonawczy to jeden niezmienny pakiet całego node, weryfikowany i aktywowany przez istniejący runtime mobile. Reguły dostępu pozostają wyłącznie własnością ODK-119-GATE. Istniejący `/v1/content/versions` pozostaje discovery metadanych; nie służy do autoryzacji ani dostarczania płatnych bajtów.

Krok A spełnia kontraktowe AC: właściciele, tożsamość, proponowany endpoint i błędy, storage/version/active pointer, odzyskiwanie, retencja historii oraz granice implementacji zostały wskazane. Nie jest to odbiór funkcji Premium ani zgoda na rozpoczęcie kroków B–D bez ich wejść.

## Dowody obecnego stanu

- Mobile `src/content/canonical/runtimeCatalog.ts` statycznie importuje dziewięć pełnych artefaktów; `contentPackageRuntimeOwner.ts` rozwiązuje istniejące referencje przez jeden katalog wbudowany. To obecny runtime owner, który należy rozszerzyć. Obecny bundle zawiera wszystkie 16 077 pytań; docelowa granica Free/Premium nie istnieje.
- Mobile `src/content/canonical/productModeConfig.ts` jest właścicielem trybów. Pakiet nie może wnosić wykonywalnej logiki ani samodzielnie tworzyć trybów; płatny node nie może być oferowany przed dodaniem i walidacją konfiguracji aplikacji.
- `src/content/contracts/contentPackage.ts` definiuje typy, ale przeszukanie produkcyjnych referencji wykazało jedynie eksport/definicje, bez aktywnego runtime konsumenta. To nie jest istniejący installer ani aktywny kontrakt transportu. Nie wolno budować drugiej ścieżki obok `ContentPackageRuntimeOwner`.
- Mobile `content-lock.json` i sesyjne/review refs wiążą `trackId`, `contentVersion` i `artifactSha256`. Istniejący release lock w `integration/contracts/content-release/release.lock.json` jest osobną bramką wydania i nie należy go utożsamiać z indeksem runtime.
- Content `content/catalog.json` jest źródłem `contentVersion`; builder obecnie emituje pełny `patternly-content-artifact-v1` track. Brak dowodu istniejącego producenta pakietów node.
- Backend `/v1/entitlements` korzysta z `revenueCatEntitlementReader`; ODK-119-GATE zachowuje semantykę entitlementu. Backend `/v1/content/versions` wymaga `app_check_bearer`, zwraca `ContentVersionView` z `packageUri`, bez `nodeId`, bajtów pakietu ani sprawdzenia Premium. Nie znaleziono route pobierania ani adaptera prywatnego object storage.
- Faktyczna wartość i konfiguracja `packageUri` nie są w repo. Nie wiadomo, czy obecne obiekty są publiczne lub pobieralne bez autoryzacji; krok B musi to sprawdzić, zanim użyje jakiegokolwiek obecnego URI.
- `AccountForegroundRefreshSidecar` odświeża entitlement po wejściu konta, reconnect i powrocie do foreground. Cache offline jest powiązany z kontem i expiry. Sam refresh/cache nie stanowią bramki nowej sesji ani instalatora pakietu.

## Kontrakt docelowy

### Tożsamość i format

- Kanoniczna tożsamość artefaktu: `(trackId, nodeId, contentVersion, artifactSha256)`. `contentVersion` pochodzi z kanonicznego katalogu treści. `artifactSha256` obejmuje kanoniczny, nieskompresowany payload node.
- Transport ma osobne `packageSha256` liczone po skompresowanych bajtach oraz `packageFormat` (gzip). Nie wolno używać transportowego hasha jako zamiennika tożsamości kanonicznej.
- Proponowany manifest: `schemaVersion: patternly-content-node-package-v1`, `trackId`, `nodeId`, `contentVersion`, `artifactSha256`, `packageSha256`, `contentReleaseId`, `minimumAppVersion`, `packageFormat`. Dokładny schemat i kanonikalizacja hashy są do zatwierdzenia w implementacyjnym kontrakcie content/backend przed kodem.
- Pakiet zawiera tylko pytania i metadane jednego node według istniejącego kontraktu pytań. Tryby i zasady selekcji są własnością aplikacji. Jedna sesja Premium wskazuje jeden node; pakiety kompozytowe wymagałyby osobnej tożsamości i decyzji.

### Backend: autoryzacja, metadane i pobranie

- `/v1/entitlements` i reguła ODK-119-GATE pozostają jedynym źródłem decyzji o uprawnieniu. Download oraz przygotowanie nowej płatnej sesji muszą konsumować ten sam, świeży wynik. AUD-04 nie wprowadza własnego booleanu ani macierzy stanów.
- Zachować `/v1/content/versions` jako istniejące discovery metadanych, po sprawdzeniu, czy `packageUri` ujawnia osiągalny obiekt. To API nie może służyć jako dostęp do płatnych bajtów.
- Proponowane nowe API: `GET /v1/content/packages/{trackId}/{nodeId}` z `app_check_bearer`; backend rozwiązuje bieżący immutable manifest i autoryzuje Premium node przez ODK-119-GATE, a następnie strumieniuje pakiet. Nie zwraca stabilnego URI obiektu ani nie ufa klientowi w zakresie wersji lub entitlementu.
- Błędy: `400 invalid_request` dla niepoprawnego identyfikatora; `401` dla braku/niepoprawności uwierzytelnienia/App Check; `403 entitlement_required` dla braku prawa; `404 not_found` dla nieopublikowanego lub nieznanego node bez ujawniania prywatnego katalogu; `503 entitlement_unavailable` lub `package_unavailable` dla niedostępności zależności. Szczegółowy publiczny kontrakt błędów i nagłówków należy dopiąć w kroku B.
- Nieznane: provider/bucket, reguły IAM i wartości istniejących URI. Krok B ustala prywatny object store i dowodzi braku nieautoryzowanego odczytu; nie zakładać GCS ani signed URL bez dowodu i projektu TTL.

### Wersjonowanie, aktywacja i odzyskiwanie

- Content publikuje deterministyczny payload node i jego immutable manifest. Backend przechowuje manifest po pełnej tożsamości oraz mutable current pointer dla `(trackId,nodeId)`. Najpierw zapis i walidacja bajtów/manifestu, potem atomowa zmiana pointera. Rollback przywraca poprzedni pointer; nie modyfikuje artefaktu.
- Mobile pobiera do pliku tymczasowego, sprawdza transport SHA, dekompresuje, waliduje schemat, tożsamość, zakres jednego node i minimalną wersję aplikacji, po czym sprawdza `artifactSha256`. Dopiero wówczas atomowo aktywuje pakiet przez rename/pointer. Błąd, zły hash/schema lub przerwanie pozostawia dotychczasowy aktywny pakiet bez zmian.
- Nowa sesja przypina pełną tożsamość pakietu; jej aktywny runtime nie przeskakuje na nowy current pointer. Review/history rozwiązuje dokładny hash. Brak przypiętego artefaktu daje jawne `content_identity_unavailable`; zakaz fallbacku do „latest”. Zachować wersje używane przez istniejące sesje/historię.
- Istniejące wydania aplikacji zawierają pełne banki i mogły zapisać historyczne refs. Usunięcie Premium pytań z bundle jest zablokowane do czasu zaprojektowania, zaimplementowania i zweryfikowania migracji/retencji tych refs. Nie ma obecnie dowodu trwałego lokalnego archive store dla pełnych historycznych artefaktów.
- Wygaśnięcie entitlementu blokuje nowe pobrania i przygotowanie nowych płatnych sesji według ODK-119-GATE; nie kasuje lokalnych danych, nie zmienia przypiętej aktywnej sesji i nie pozbawia możliwości odczytu posiadanej historii.

## Właściciele i kolejność

| Obszar | Właściciel | Zakres |
| --- | --- | --- |
| Reguły dostępu | ODK-119-GATE / backend entitlement reader | Świeży wynik, odmowy, cache offline wg zatwierdzonej macierzy; bez duplikacji w AUD-04. |
| Produkcja treści | `patternly-content` canonical builder | Walidowany, deterministyczny node package, manifest/hash i fixture; bez zmian treści w kroku A. |
| Serwowanie i current pointer | `patternly-backend` content module/API | Prywatny object store, immutable manifest, atomowy pointer, entitlement gate i stream bytes. |
| Instalacja i runtime | `patternly` `ContentPackageRuntimeOwner` | Trwały staging, weryfikacja, atomowa aktywacja, dokładne history refs i bezpieczna migracja starego bundle. |
| Odkrywanie i przygotowanie | `patternly` roadmap/preparation | Widoczność płatnych node wyłącznie z aktywnym, zweryfikowanym pakietem i wynikiem ODK-119-GATE. |

Sekwencja: (1) AWS-01/02 wyznaczają dokładnego kandydata treści; (2) domknąć ODK-119-GATE; (3) content producer/schema i fixture; (4) AUD-04-B backend store/index/authorization/stream; (5) AUD-04-C mobile storage, verify, migration i pinned runtime; (6) AUD-04-D discovery/preparation. Odbiór aktywacji konkretnego AWS wymaga AWS-02; sam kontrakt A od niego nie zależy. Publikacja immutable artefaktów wyprzedza endpoint, kompatybilna aplikacja jest ostatnia. Rollback to zmiana current pointer, z zachowaniem starych bajtów i kompatybilnych tras.

## Ryzyka i bramki przed implementacją

1. **Potwierdzone:** obecny app bundle zawiera wszystkie 9 pełnych banków. Brak granicy Premium jest realny; nie twierdzimy, że nowa ścieżka już działa.
2. **Nieznana ekspozycja:** backend ujawnia `packageUri` zalogowanemu użytkownikowi, ale wartości i dostępność obiektów są poza repo. Krok B musi rozstrzygnąć to przed użyciem URI.
3. **Migracja historii:** obecne dokładne refs nie zawierają `nodeId` w krotce; node wynika z pytania artefaktu. Nowa node tożsamość musi pozostać zgodna z historycznymi refami albo dostarczyć odtwarzalną migrację. Retencja starych track artefaktów jest nieustalona i blokuje redukcję bundle.
4. **Storage:** brak potwierdzonego backend object store i mobile persistent package store. Wybór adapterów oraz zachowanie atomowe wymagają konkretnego projektu w krokach B/C.
5. **Tryby:** obecne tryby aplikacji kierują do Free nodes. Każdy płatny node wymaga aplikacyjnej konfiguracji i jej walidacji przed ofertą.

Nie potrzeba nowej decyzji PO do samego kontraktu. Jeśli kroki B/C wykażą konflikt między wymaganą retencją a rozmiarem aplikacji lub kosztami storage, zatrzymać zależną zmianę i przedstawić ograniczony wariant decyzyjny.

## Ocena przed implementacją

- Zgodność celu i architektury: **0,94** — wykorzystuje jeden runtime owner i istniejącego właściciela entitlementu; nie tworzy drugiego systemu.
- Prostota: **0,86** — oddziela kanoniczną tożsamość treści od hasha kompresji i rozdziela publikację od aktywacji; nie dodaje executable metadata.
- Ryzyko: **0,82** — istotne nierozstrzygnięte ryzyko migracji historii i ekspozycji `packageUri`; oba mają jawne bramki przed właściwymi zmianami.
- Utrzymywalność: **0,90** — immutable artefakty, jeden current pointer, jeden runtime owner i jeden entitlement authority; jawne error states i rollback.
- Minimum: **0,82**. Kontrakt jest wystarczająco spójny do kontynuacji AWS-01; produkcyjna implementacja wymaga briefingu/niezależnej walidacji i dokładnego wyboru storage oraz history migration.

## Weryfikacja i środowisko

- Dokumenty i kod źródłowy przejrzano w czterech repozytoriach; ich statusy były sprawdzone przed zmianą. Niezacommitowane zmiany istniejące w mobile/backend/content pozostawiono nietknięte.
- Podczas sprawdzenia API `127.0.0.1:8080/ready` nie odpowiadał. Firebase Auth `19099` odpowiadał `200 ready`; Firestore emulator `18081` odpowiadał `200 Ok`.
- Odczyt `simctl` zgłosił niedostępny CoreSimulatorService. Nie restartowano symulatora, nie uruchamiano aplikacji i nie zmieniano danych urządzenia.
- Nie uruchamiano testów: w kroku A nie zmieniono kodu, kontraktu wykonywalnego ani banków. Weryfikacja to inspekcja źródeł, dokumentów i kolejności zależności.

## Następny krok

Według kanonicznej kolejki następny jest **AWS-01** — związać zgodę PO z bieżącym dokładnym AWS, zinwentaryzować konsumentów i przygotować nowego kandydata bez zmiany historycznych evidence. Po AWS-02 oraz domknięciu ODK-119-GATE można rozpocząć AUD-04-B/C/D według powyższych bramek.

## Follow-up środowiska lokalnego — 23 września 2026

Po zgłoszeniu braku API/CoreSimulator uprawnienia diagnostyczne poza sandboxem wykazały, że Auth `19099` (PID `63238`) i Firestore `18081` (PID `63288`) nadal działały, a `8080` był wolny. Uruchomiono wyłącznie backendowy `npm run dev:smoke` z `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19099` i `FIRESTORE_EMULATOR_HOST=127.0.0.1:18081`; nie uruchamiano `firebase emulators:exec` i nie restartowano emulatorów. API na `127.0.0.1:8080/ready` zwróciło `200` z `database`, `authentication` i `providerReader` gotowymi; listener PID `99400`.

Wcześniejsza nieudana diagnostyka `simctl` była ograniczona sandboxem (`CoreSimulatorService connection became invalid`, brak uprawnień do logu). Po odczycie poza sandboxem launchd zgłosił aktywny wpis Mach service `com.apple.CoreSimulator.CoreSimulatorService`; `xcrun simctl list devices booted` widzi istniejący iPhone 17 `7F315654-3175-4F3C-BB24-B0263F59360C` jako `Booted`, a `get_app_container` potwierdziło instalację `com.lkurczab.patternly`. Ostatnie 10 minut logów CoreSimulatorService nie zawiera błędu/crash. Niczego nie restartowano, nie wyłączano, nie instalowano ponownie i nie resetowano; stan/dane urządzenia zachowano. Wniosek: w tej sesji nie wykazano awarii samego CoreSimulatorService — poprzedni błąd odczytu wynikał z ograniczeń sandboxa. Nie sprawdzano, czy UI aplikacji jest aktualnie na wierzchu, aby nie zmieniać stanu urządzenia.

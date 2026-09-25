# AUD-04-C — mobile node package install

**Status:** PASS WITH ISSUES według niezależnego QA; lokalnie, bez wdrożenia.  
**Zakres:** odbiór binarnego pakietu node z uwierzytelnionego API, weryfikacja, zapis immutable, aktywacja wskaźnikiem MMKV i rozwiązywanie dokładnych referencji w istniejącym `ContentPackageRuntimeOwner`.

## Wynik

Aplikacja ma wersjonowany payload `patternly-content-node-payload-v1` z dokładnym zestawem pól: tożsamość track/node/version/release i `items`. Każdy element przechodzi istniejący `validateQuestion`; payload nie może zawierać profili, trybów, selekcji ani dodatkowych pól. Track musi być zarejestrowany w aplikacji, a pytania muszą należeć do dokładnie wskazanego track/node.

`PatternlyApiClient.getContentPackage` używa tej samej bramki Firebase Auth/App Check co pozostałe `/v1` żądania. Czyta odpowiedź strumieniowo do limitu 2 MiB. Installer sprawdza status, typ `application/gzip` bez parametrów (po trim i normalizacji wielkości liter), dokładne `Content-Length`, wszystkie wymagane nagłówki, hash SHA-256 bajtów pakietu, limit 8 MiB po dekompresji, hash dokładnych zdekompresowanych bajtów, ścisły schemat i tożsamość payloadu oraz semver `minimumAppVersion` względem wersji aplikacji.

Pakiet używa istniejącego `ContentPackageRuntimeOwner`: zweryfikowane pytania są dostępne tylko po tożsamości exact artifact ref. Runtime dla pobranego node ma pusty zbiór trybów i nie trafia do discovery; istniejące `ProductModeConfig` nadal definiuje ofertę i tryby. Wersje historyczne pozostają zapisane i dokładna stara referencja działa po aktywacji nowszego pakietu.

## Storage i zachowanie przy awarii

- Bajty i strict manifest trafiają do `expo-file-system` pod `Paths.document`, w stagingu, a następnie do ścieżek content-addressed. Po stagingu bajty i manifest są odczytywane ponownie i weryfikowane; po przeniesieniu do finalnej ścieżki są ponownie odczytywane i weryfikowane przed aktywacją.
- Aktywny wskaźnik to jedna wartość w istniejącym, profile-scoped `getKeyValueStorage()` (MMKV). Wartość zawiera bieżącą oraz zachowane tożsamości wszystkich wcześniej aktywowanych wersji danego node. `listActive()` iteruje wyłącznie klucze tych wskaźników i weryfikuje ich manifest/bajty; pliki osierocone, które nigdy nie przeszły aktywacji, nie są hydratowane i nie stają się exact-resolvable po restarcie. Zapis aktywacji jest pojedynczym synchronicznym `setString`, po którym następuje read-back. Przy błędzie zapisu/read-back adapter przywraca poprzednią wartość. Nie twierdzimy, że `File.move` jest atomowe; partial/corrupt final może pozostać osierocony, a retry może go zastąpić wyłącznie wtedy, gdy nie wskazuje na niego aktywny wskaźnik. Poprawne historyczne final files są zachowywane.
- Transport i instalator są testowalne przez porty. Testy failure injection pokrywają przerwany download, błąd przeniesienia, ponowienie po partial final, uszkodzony read-back oraz odmowę zmiany wskaźnika. Test restartu potwierdza exact resolve dla aktywnej bieżącej i historycznej wersji oraz brak resolve dla zapisu immutable bez aktywacji i dla awarii aktywacji.
- Lokalny adapter przechowuje zdekompresowany kanoniczny payload, nie kopię gzip. Bajty w `Paths.document` nie są szyfrowane przez ten adapter. Backendowy gate pozostaje źródłem prawa do pobrania; pakiet nie zmienia odkrywania ani oferty.

## Zmiany

- `src/content/runtime/nodeContentPackage.ts` — payload i manifest strict, weryfikacja nagłówków/hashy/gzip/semver, installer, testowy store in-memory.
- `src/content/runtime/nodePackageStorage.ts` — czyste porty/adaptory plików i pointera, Expo DocumentDirectory, immutable retencja, reread i odzyskiwanie osieroconych final files.
- `src/content/application/nodePackageStoreComposition.ts` — composition profile-scoped MMKV i lazy active-package loader z profile identity.
- `src/content/application/nodePackageInstaller.ts` — composition z `PatternlyApiClient`, `contentHasher`, aktywnym profilem i istniejącym ownerem.
- `src/application/contentPackageRuntimeOwner.ts` — exact-only runtime, lazy hydration zachowanych pakietów bez discovery/preparation i installed cache izolowany profile scope; scope jest sprawdzany przed cache-hit oraz po async hydration.
- `src/infrastructure/clients/PatternlyApiClientAdapter.ts` — binarny endpoint `/v1/content/packages/{trackId}/{nodeId}`, Auth/App Check, deadline i bounded stream.
- `src/infrastructure/identity/contentHasher.ts` oraz `.native.ts` — SHA-256 dla surowych bajtów w Node i Expo Crypto.
- `scripts/validateContentBoundary.mjs` i `.test.mjs` — direct/global fetch guard bez fałszywego wykrywania property methods; bez zmiany allowlist.
- Testy modułów wyżej oraz `src/infrastructure/clients/patternlyApiClient.test.ts` i `src/application/account/accountLifecycle.test.ts`.

Nie zmieniano backendu, content buildera, bundled tracks, sesyjnych typów, reguł entitlementu ani product modes. Neutralne testowe pytanie nie jest opublikowaną treścią Premium ani dowodem jej admission.

## Weryfikacja

- Pierwszy pełny suite ujawnił dwa relewantne failures: `storageCutover` wykrył niedozwolony import `mmkvClient` z runtime store, a `validateContentBoundary` błędnie blokował istniejące `NetInfo.default.fetch()` jako globalny ingress. Zostały naprawione bez zmiany allowlist: MMKV composition jest w `content/application`, a validator dopasowuje wyłącznie bezpośrednie/globalne `fetch(`.
- Niezależne QA wykryło ponadto profile A→B cache leak i luki failure-injection: owner czyści installed cache/hydration przy zmianie/obserwacji zamkniętego scope, weryfikuje scope po async loaderze, a register fail-closed wymaga bieżącego scope. Testy pokrywają A→B→A lazy rehydration; restart używa nowego adapter store’a nad tymi samymi persisted portami; pointer rollback obejmuje throw po zapisie i mismatch read-back.
- QA2 ujawniło dodatkowo okno przejścia, w którym profile A pozostaje chwilowo zwrócony mimo aktywnej flagi transition, oraz zbyt szerokie wykluczanie wszystkich property `fetch`. Scope composition sprawdza teraz `isProfileTransitionActive()` przed odczytem ID i zwraca `null`, co czyści cache ownera; test potwierdza A/cache → transition przy nadal A (resolve fail) → B (wyłącznie B). Validator blokuje bare `fetch()` i `globalThis/window/self.fetch()`, ale akceptuje np. `NetInfo.default.fetch()`.
- Ukierunkowane testy razem z storage-cutover i profile-transition suite — **70/70 PASS**.
- `node scripts/validateContentBoundary.mjs` — **PASS**.
- `npm run typecheck` — **PASS**.
- `git diff --check` — **PASS**.
- Nie uruchamiano UI/Maestro: ta zmiana nie dodaje widoku ani przepływu discovery; odbiór UI pozostaje poza C.
- Nie wykonano wdrożenia.

## Ocena briefingu przed implementacją

Niezależny validator `gpt-6-luna` `high` zatwierdził pierwotny briefing po doprecyzowaniu limitów 2 MiB/8 MiB i dokładnego `application/gzip`; minimum: **0,82**. Briefing napraw boundary/profile-cache po QA został również niezależnie zatwierdzony przez `gpt-6-luna` `high`; minimum: **0,80**, po uwzględnieniu walidacji scope po async hydration i fail-closed rejestracji. Briefing QA2 uzyskał niezależne APPROVE `gpt-6-luna` `high`, minimum **0,87**.

- Zgodność/architektura: **0,90** — jeden istniejący owner i exact refs, bez drugiego runtime/discovery.
- Prostota: **0,83** — jeden transport, installer i pointer; dodatkowy zakres ogranicza się do uzgodnienia nagłówków między repozytoriami.
- Ryzyko: **0,82** — fail-closed limity/hash/write-reread-pointer i zachowana historia, z jawną bramką single-node schema/producenta.
- Utrzymywalność: **0,85** — wersjonowany kontrakt i immutable content-addressed bytes, bez równoległego runtime.

## Ograniczenia i następny krok

To jest lokalna zdolność instalacji i rozwiązywania exact refs. Nie dowodzi produkcji, publikacji ani dopuszczenia banku Premium; fixture jest neutralny. Nie powstaje oferta node ani wybór sesji z aktywnego wskaźnika. `AUD-04-D` pozostaje właścicielem discovery i preparation, a przyjęty producent content oraz cross-repo zgodność fixture wymagają odrębnego dowodu. Mobile nie wykonało rzeczywistego requestu do wdrożonego backendu, bo cała zmiana pozostaje lokalna.

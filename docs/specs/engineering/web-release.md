# WEB-PUBLISH — procedura dokładnego artefaktu

Status i kolejność: [plan główny](../../PATTERNLY-WORKING-PLAN.md), R01→R02. Bieżące narzędzia: `patternly-web/scripts/prepare-web03c-local.mjs`, `build-local.mjs`, `verify-local.mjs`; config `firebase.json` i `.firebaserc` wskazuje Hosting `patternly-app-sandbox`. Publiczny build nie zawiera admin/privacy intake; panel jest loopback PO tool z backend auth.

Lokalny przygotowujący runner wymaga czystych app/web przed i po buildzie, pinów HEAD i output manifestu poza repo. `npm run prepare:web03c:local -- /tmp/patternly-web-manifest.json` uruchamia `verify:local` i zapisuje hashes/rozmiary dist, Hosting config, legal source i lockfile. Synthetic local-test ma deployable:false; nie publikować go. Stare credentials i zdalne wyniki nie są wiedzą o obecnej sesji: przed PUBLISH potwierdzić wymagane konto/uprawnienia i current live release.

## PUBLISH i rollback


1. Po ODK-116-B przygotować prawdziwy, zatwierdzony artefakt prawny. Produkcyjny build musi odrzucić `testOnly`; sprawdzić prawdziwe publiczne linki, dane operatora i brak placeholderów. Użyć czystych, przypiętych SHA web i app oraz zapisać fingerprint artefaktu, manifest wszystkich bajtów `dist` i wynik testów.
2. Potwierdzić tożsamość konta Firebase, projekt `patternly-app-sandbox`, site, uprawnienia do Hosting i obecny release ID. Przed zmianą utworzyć jednorazowy kanał podglądu dla rollbacku i sklonować obecną wersję live poleceniem `firebase hosting:clone patternly-app-sandbox:live patternly-app-sandbox:<rollback-channel> --project patternly-app-sandbox`. Odczytać kanał, zapisać jego ID, release ID i wynik. Jeśli live nie ma poprzedniego release, zapisać ten fakt i sprawdzić `firebase hosting:disable --help` jako osobną procedurę awaryjnego zatrzymania serwowania; nie przedstawiać jej jako przywrócenia wersji.
3. W osobno autoryzowanym kroku opublikować wyłącznie Hosting z dokładnego sprawdzonego `dist`. Po publikacji porównać zdalne `/`, `/privacy`, `/terms` i ich zawartość z manifestem oraz sprawdzić zdalne 404 dla `/admin`, `/admin/`, `/admin.html`, `/privacy-request` i podrzędnej ścieżki. Zapisać nowy release ID, czas, projekt/site i wynik.
4. Jeżeli odbiór zawiedzie, zatrzymać dalszy rollout i sklonować zapisany kanał rollbacku z powrotem na live: `firebase hosting:clone patternly-app-sandbox:<rollback-channel> patternly-app-sandbox:live --project patternly-app-sandbox`. Potwierdzić nowy release ID, treść `/` i negatywne trasy. Gdy nie było poprzedniego release, wykonać uprzednio sprawdzoną procedurę awaryjnego zatrzymania serwowania, a nie pozorny rollback. Sama instrukcja nie jest dowodem, że rollback zadziałał.


Lokalne checks nie potwierdzają zdalnego deployu ani rollbacku. Zgoda na lokalne porządki nie autoryzuje tych operacji; stosować właściwą autoryzację dokładnego wydania.

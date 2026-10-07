# R02 / WEB-PUBLISH — witryna pod docelowym adresem

Status i kolejność: [plan główny](../../PATTERNLY-WORKING-PLAN.md). R02 korzysta z domeny ustalonej w [DOMAIN-MAIL-01](company-domain-mail.md) oraz finalnych danych R01. Właściciel wskazał `patternly.it` jako domenę docelową; podstawowy adres witryny to `https://patternly.it/`. Bieżące narzędzia: `patternly-web/scripts/prepare-web03c-local.mjs`, `build-local.mjs`, `verify-local.mjs`; config `firebase.json` i `.firebaserc` wskazuje Hosting `patternly-app-sandbox`. Publiczny build nie zawiera admin/privacy intake; panel jest loopback PO tool z backend auth.

Lokalny przygotowujący runner wymaga czystych app/web przed i po buildzie, pinów HEAD i output manifestu poza repo. `npm run prepare:web03c:local -- /tmp/patternly-web-manifest.json` uruchamia `verify:local` i zapisuje hashes/rozmiary dist, Hosting config, legal source i lockfile. Synthetic local-test ma deployable:false; nie publikować go. Stare credentials i zdalne wyniki nie są wiedzą o obecnej sesji: przed PUBLISH potwierdzić wymagane konto/uprawnienia i current live release.

## Domena, DNS i HTTPS

Odczyt z 07.10.2026: `patternly.it` zwraca `NXDOMAIN` w publicznych resolverach i u autorytatywnego serwera rejestru `.it`; nie potwierdzono aktywnej delegacji. Przed konfiguracją Hosting ustalić własność/rejestrację i dostęp do DNS. Ten wynik nie oznacza automatycznie, że domena jest wolna.

Celem jest rzeczywiście dostępna witryna pod `https://patternly.it/`, z działającymi `/privacy`, `/terms` oraz zatwierdzonym adresem pomocy. Publikacja na technicznym adresie Firebase lub sam zapis URL w konfiguracji nie zamykają zadania.

1. Sprawdzić bieżącą własność domeny, DNS, istniejące usługi oraz konfigurację Hosting. `firebase.json` i `.firebaserc` wskazują obecnie `patternly-app-sandbox`; nie traktować nazwy projektu jako decyzji o zmianie środowiska. Potwierdzić właściwy projekt/site i użyć istniejącej konfiguracji, jeśli odpowiada wydaniu. Narzędzie `scripts/prepare-web03c-local.mjs` wymusza ten site; jeżeli właściciel wybierze inny, zmienić razem konfigurację, sprawdzanie i instrukcje, bez obejścia testu.
2. Przygotować konkretny zestaw zmian do podłączenia `patternly.it` jako własnej domeny Hosting, według aktualnych wymagań dostawcy. Zapisać stan DNS przed zmianą i sposób odtworzenia. Zachować MX, TXT i pozostałe rekordy działającej poczty oraz innych usług; nie zmieniać całej strefy DNS bez potrzeby.
3. Po wykonaniu autoryzowanej konfiguracji potwierdzić weryfikację własności i wydanie ważnego certyfikatu TLS dla docelowego hosta. Sprawdzić rzeczywisty DNS i połączenie HTTPS spoza panelu dostawcy. Wybrać jeden kanoniczny host; jeżeli obsługiwany jest również `www.patternly.it`, ma prowadzić do tego samego serwisu lub przekierowywać do zatwierdzonego hosta bez pętli. Nie dodawać osobnej witryny z inną wersją treści.
4. Uzgodnić rzeczywiste publiczne URL w `patternly/config/public-legal.release.json`, eksporcie WWW i ich konsumentach. Nie wpisywać nieistniejącej ścieżki pomocy. Sprawdzić linki z aplikacji i witryny oraz usunąć zastąpione adresy robocze z publicznego wydania.
5. Odbiór po publikacji przeprowadzić na `patternly.it`, a także na każdym dodatkowym opublikowanym hoście. Sprawdzić `/`, `/privacy`, `/terms`, pomoc, certyfikat, uzgodnione przekierowania oraz zdalne odmowy tras administratora i zgłoszeń prywatnych. Reguły przekierowania domeny nie mogą udostępnić wyłączonych tras ani zastąpić ich testów.

Przygotowanie domeny i poczty może poprzedzać R01; finalny artefakt prawny i publikacja zależą od zatwierdzonych danych R01. Zmiany DNS i publikacja są odrębnymi operacjami zewnętrznymi: przygotować ich dokładny zakres i wykorzystać już udzieloną autoryzację, jeśli go obejmuje.

## PUBLISH i rollback


1. Po ODK-116-B przygotować prawdziwy, zatwierdzony artefakt prawny. Produkcyjny build musi odrzucić `testOnly`; sprawdzić prawdziwe publiczne linki, dane operatora i brak placeholderów. Użyć czystych, przypiętych SHA web i app oraz zapisać fingerprint artefaktu, manifest wszystkich bajtów `dist` i wynik testów.
2. Potwierdzić tożsamość konta Firebase, projekt `patternly-app-sandbox`, site, uprawnienia do Hosting i obecny release ID. Przed zmianą utworzyć jednorazowy kanał podglądu dla rollbacku i sklonować obecną wersję live poleceniem `firebase hosting:clone patternly-app-sandbox:live patternly-app-sandbox:<rollback-channel> --project patternly-app-sandbox`. Odczytać kanał, zapisać jego ID, release ID i wynik. Jeśli live nie ma poprzedniego release, zapisać ten fakt i sprawdzić `firebase hosting:disable --help` jako osobną procedurę awaryjnego zatrzymania serwowania; nie przedstawiać jej jako przywrócenia wersji.
3. W osobno autoryzowanym kroku opublikować wyłącznie Hosting z dokładnego sprawdzonego `dist`. Po publikacji pod `https://patternly.it/` porównać zdalne `/`, `/privacy`, `/terms` i ich zawartość z manifestem oraz sprawdzić zdalne 404 dla `/admin`, `/admin/`, `/admin.html`, `/privacy-request` i podrzędnej ścieżki. Zapisać nowy release ID, czas, projekt/site i wynik.
4. Jeżeli odbiór zawiedzie, zatrzymać dalszy rollout i sklonować zapisany kanał rollbacku z powrotem na live: `firebase hosting:clone patternly-app-sandbox:<rollback-channel> patternly-app-sandbox:live --project patternly-app-sandbox`. Potwierdzić nowy release ID, treść `/` i negatywne trasy. Gdy nie było poprzedniego release, wykonać uprzednio sprawdzoną procedurę awaryjnego zatrzymania serwowania, a nie pozorny rollback. Sama instrukcja nie jest dowodem, że rollback zadziałał.


Lokalne checks nie potwierdzają zdalnego deployu ani rollbacku. Zgoda na lokalne porządki nie autoryzuje tych operacji; stosować właściwą autoryzację dokładnego wydania.

## Kryteria zakończenia i kontynuacja

R02 jest zakończone po publikacji odebranego artefaktu pod zatwierdzoną domeną, sprawdzeniu realnych publicznych stron, HTTPS i niedozwolonych tras, zgodności kontaktów/linków oraz potwierdzeniu możliwości wycofania publikacji. Po zmianie DNS sprawdzić również działanie firmowej poczty z DOMAIN-MAIL-01. Dane logowania i prywatne manifesty pozostają poza repozytorium.

Kolejny agent ma sprawdzić aktualny stan domeny, Hosting, źródeł i autoryzacji, uznać poprawnie wykonane części i zaplanować wyłącznie pozostałe działania. Najpierw wykonać lokalną walidację oraz przygotować dokładny artefakt i zmiany DNS, potem przeprowadzić autoryzowane operacje zewnętrzne i ich odbiór. Brak domeny, dostępu lub danych R01 ma być konkretnie opisany; nie zastępować go pozorną publikacją na roboczym adresie.

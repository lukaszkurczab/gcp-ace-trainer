# Poprawki dokumentacji i audyt miejsca — 12.10.2026

## Wynik i zakres

Zaktualizowano dokumentację zgodnie z [audytem stanu projektu](project-state-audit-2026-10-12.md). Nie zmieniono kodu, konfiguracji aplikacji, pytań, locków treści ani zasad produktu. Sam audyt miejsca był tylko do odczytu. Po późniejszym poleceniu właściciela usunięto wyłącznie potwierdzony katalog testowy; wykonanie i pomiary opisuje sekcja „Autoryzowane sprzątanie” poniżej.

Dokumenty normatywne `00–13,15–17` pozostają rzeczywistymi plikami w głównym `docs` workspace, jako źródło prawdy dla całego projektu. Wstępne przeniesienie do aplikacji cofnięto po korekcie właściciela; sprawdzono wszystkie 17 plików i brak kopii w repo aplikacji. Plan, specyfikacje i handoff zachowują dotychczasowych właścicieli i odsyłacze. A1 pozostaje otwarte: główne dokumenty i narzędzia workspace nadal nie mają wspólnej historii Git. Ten pakiet nie ustala nowego repozytorium ani sposobu wersjonowania.

## Poprawki

| Obszar | Zmienione pliki i wynik |
| --- | --- |
| Normatywny kontrakt całego projektu | Workspace `docs/00,01,02,03,04,07,08,10,12,13`: Free dotyczy kwalifikujących się ścieżek Certification/Coding; wszystkie tryby Design oraz Exam i Coding Mock wymagają Premium. Pole deskryptora nie nadaje dostępu. Usunięto opis EN/PL-only; siedem opcji językowych jest zaimplementowanych, a jakość tłumaczeń i odbiory prawne pozostają osobno. Testy VoiceOver są wyłączone decyzją właściciela; semantyka dostępności pozostaje wymagana. |
| Historyczne diagnozy | `patternly/docs/specs/engineering/code-health.md`, `persistence.md`: oznaczono naprawione problemy jako historyczne, dodano rzeczywiste odbiory i pozostały zakres native. Zachowano kryteria odbioru, PERSIST-11 z limitem 5 s i PERSIST-13. Uaktualniono także PERSIST-01 według późniejszego odbioru. |
| Zakończone wzmianki FESD | Usunięto zbędne wzmianki z bieżącego planu/handoffu/zaleceń audytu i nieaktualne polecenie przyszłej zmiany pinu w specyfikacji BESD. Bieżące wersje wskazują locki i raport publikacji. Zachowano historyczne raporty, tożsamości treści i dowody wymagane do odtwarzania. Nie wykonano globalnego usunięcia identyfikatorów. |
| Plan i README | Plan odróżnia historyczne porównanie 16 622 pytań od obecnej walidacji strukturalnej 16 695; nie przelicza ocen indywidualnych. `patternly-content/README.md` pokazuje wymagane `--track` i tymczasowy katalog wyniku buildera. |
| Raport audytu | Oznaczono A2–A4 jako poprawione i zachowano historyczne ustalenia oraz ich granice. A1 i otwarte zakresy produktu nie zostały zamknięte przez zmianę dokumentacji. |

Podstawą zasad dostępu są decyzje w planie i `src/application/trainingLifecycle/premiumProductModePolicy.ts`; siedem języków potwierdzają `src/i18n.ts` i ekran ustawień. Sama obecność języków nie stanowi pełnego odbioru tłumaczeń. Nie zmieniono schematu `TrackDescriptor`, warunków ukończenia, punktacji, terminów ani kolejności odbiorów wydania.

## Miejsce — pomiar i kandydaci

Pomiar `du -sk` bez rozwijania symlinków: workspace około **5,56 GiB**, pasujące katalogi `/private/tmp/patternly*` około **4,52 GiB** plus około **40 MiB** bezpośrednich plików. `/tmp` i `/private/tmp` to ta sama lokalizacja, policzona raz. Pomiar wolnego miejsca na koniec sprawdzeń: około **6,08 GiB** (97% zajętości); może się zmieniać przez inne procesy. Nie jest to wynik sprzątania w tym zadaniu.

| Kandydat | Możliwy odzysk | Dowód / warunek |
| --- | ---: | --- |
| `/private/tmp/patternly-gate03-uA0o6b` — **usunięty po autoryzacji** | **1,78 GiB** | Potwierdzony osierocony fixture `scripts/releaseManifest.test.mjs`. Dokładne nazwy dzieci, testowe markery i SHA odpowiadają generatorowi; sześć repo jest czystych, bazowe SHA są dostępne. Test usuwa własny losowy katalog w `after`; kolejne wykonanie nie sprząta starszego katalogu. Nie ustalano przyczyny jego pozostawienia. Brak otwartych plików w pomiarze. Technicznie bezpieczny kandydat do kontrolowanego usunięcia po ponownym sprawdzeniu użycia. |
| `patternly/android/.gradle` | 34,8 MiB | Regenerowalny, ignorowany cache. Warunkowo: brak aktywnego Gradle i akceptacja ponownego pobrania/odtworzenia. |
| `patternly/.temp/cc03*`, `cc04*` | około 99 MiB | Warunkowo po potwierdzeniu, że potrzebne dowody zachowano. Nie usuwać całego `.temp`: zawiera prywatne credentials i materiały bieżącego konta smoke. |
| `/private/tmp/patternly-web-wip-build-final-20261012` | 676 KiB | Warunkowo. Raport WEB wskazuje dokładny przyjęty output; obecne `dist` różni się bajtowo. Istnieje kanoniczny build i zależności, lecz nie zweryfikowano identycznego odtworzenia. Mały zysk nie uzasadnia utraty jedynego dokładnego wyniku. |

### Zachować

- `.qa-private`: około **2,72 GiB**, wymagane archiwa i potwierdzenia poprzednich porządków.
- `/private/tmp/patternly-content-historical`: około **943 MiB**, zarejestrowany i wymagany historyczny producer testów.
- Trzy checkouty `patternly-release-gate-content-admitted-4lkzEe` (672 MiB), `patternly-release-gate-content-historical-admission-WlKLWA` (461 MiB) i `patternly-release-gate-app-admitted-F0JLyB` (123 MiB): zachować. Nazwy przypominają fixture, lecz obecne gałęzie/SHA nie odpowiadają generatorom. Mają odpowiednio 182/184/163 zmienione pliki śledzone i 265/190/931 nieśledzonych. To znacznie więcej niż zmiany markerów wykonywane przez test. Nie udowodniono odtwarzalności obecnej zawartości ani braku pracy użytkownika.
- Primary `node_modules` (aplikacja około 794 MiB, backend/web łącznie około 345 MiB) i Pods (około 203 MiB): potrzebne zależności lokalnej pracy.
- `patternly/artifacts`: około **473 MiB**, dowody bieżących odbiorów i otwartego Androida; `.expo`: około **12,3 MiB**, aktywny proces Expo miał otwarty log.
- Wersjonowane content evidence/artifacts/reports: około **254 MiB**. Są zależnościami testów, przyjętych wersji i niedokończonego audytu; nie są zbędne z racji wieku.
- Profile, credentials, cudze procesy/checkouty i nieprzejrzane prywatne dane.

Dokumentacja zajmuje pojedyncze MiB i nie jest dobrym źródłem odzysku. Backend/web/native build outputs to łącznie około 3,8 MiB; ich usunięcie nie rozwiąże problemu miejsca. Nie wykazano potrzeby kasowania dokumentów źródłowych ani historycznych dowodów.

## Weryfikacja i granice

Sprawdzenia dokumentacyjne PASS: 17 normatywnych plików jest w głównym `docs`, bez kopii w aplikacji; siedem nietkniętych dokumentów zachowuje pierwotne hashe. W 52 dokumentach sprawdzono 187 lokalnych celów Markdown — zero brakujących. Zmiany Git obejmują wyłącznie Markdown; backend i web pozostają czyste. Kontrola białych znaków i `git diff --check` w app/content: PASS. Źródła i istniejące raporty porównano przed poprawkami; nie powtarzano ciężkiego gate po zmianach samej dokumentacji. [Poprzedni audyt](project-state-audit-2026-10-12.md#weryfikacja) zawiera rzeczywiste wyniki testów i CI dla niezmienionego kodu; nie przedstawiamy ich jako nowego uruchomienia.

Audyt miejsca: rozmiary bloków, nazwy, daty, statusy i markery Git, generator fixture, dostępność SHA, referencje konsumentów i chwilowy odczyt otwartych uchwytów. Brak uchwytów sam nie dowodzi braku użycia; przed późniejszym usunięciem należy ponownie potwierdzić stan. Nie odczytywano prywatnych payloadów ani sekretów. Nie audytowano całego systemu ani wszystkich katalogów tymczasowych; nie uruchamiano nowych buildów/testów w celu odtworzenia artefaktów.

Prace pomocnicze: Luna High — porównanie specyfikacji z dowodami, metadane i provenance kandydatów; bez zmian kodu i bez usuwania. Nie przyjęto propozycji relokacji dokumentów po korekcie właściciela. Nie wprowadzono nowej bramki wydania ani arbitralnego minimalnego zapasu GB.

Końcowy niezależny przegląd spójności (Luna High): **PASS**, bez blokujących ustaleń. Potwierdzono zachowanie decyzji produktu, otwartych odbiorów, głównego `docs` jako źródła prawdy i ograniczeń audytu miejsca. Reviewer nie wykonywał testów ani usuwania.

## Autoryzowane sprzątanie — 12.10.2026

Po poleceniu właściciela „Oczyść to miejsce” usunięto wyłącznie `/private/tmp/patternly-gate03-uA0o6b`. Przed operacją ponownie potwierdzono dokładną ścieżkę (bez symlinka), właściciela i inode, dziewięć oczekiwanych katalogów, sześć czystych repozytoriów z tymi samymi SHA, dostępność historycznych commitów w primary oraz wyłącznie oczekiwane ignorowane zależności fixture. Sprawdzono brak otwartych plików i procesów z katalogiem roboczym w tym drzewie. Bezpośrednio przed usunięciem ponowiono kontrolę inode, SHA, statusów i otwartych plików.

Usunięte drzewo zajmowało **1 864 084 KiB (około 1,78 GiB)**. Dostępne miejsce przed: **6 347 568 KiB (6,05 GiB)**; po: **8 221 848 KiB (7,84 GiB)**. Zmiana odczytu wolnego miejsca wyniosła około 1,79 GiB; różnica względem rozmiaru drzewa może wynikać z równoległej aktywności systemu. Potwierdzono brak usuniętej ścieżki i obecność wymaganych archiwów, primary dependencies, historycznego producera oraz trzech chronionych checkoutów. Pozostałych kandydatów warunkowych nie usuwano. Kod, konfiguracja, treści, profile i dane urządzenia pozostały poza zakresem operacji. Nie uruchamiano testów ani buildów.

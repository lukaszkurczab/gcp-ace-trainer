# BIZQ-06 — Safari native preflight04

Root wykonał rzeczywisty flow na wyłącznie istniejącym iPhone17 `7F315654-3175-4F3C-BB24-B0263F59360C`, iOS26.4/Safari. Aktualny zbudowany web `a48afd3` odczytywano z localhost4173; nie zmieniono produkcyjnego kodu, app/content/locks/admission/Premium ani usług. Podgląd zawiera istniejący testowy artefakt prawny, nie dane wydaniowe. Build hashmanifest jest w BUILD.json.

## Wynik i granica

Zwykły rozmiar: końcowy flow `flow.yaml`, NORMAL.log i NORMAL-COMMANDS.json, exit0. Rzeczywiste wybory poprawnej i błędnej odpowiedzi, właściwy authored Reason, jawnie sprawdzony tekst pełnych Details, widoczny reset i stan braku linku do aplikacji. Root obejrzał pełne screenshoty; to ograniczony flow jednego przykładu Coding, nie wszystkich tracków/opcji.

Powiększenie: jedno dotknięcie natywnego większego A w menu Safari zwiększyło tekst i zmieniło jego zawijanie. ENLARGED-COMMANDS.json: wszystkie polecenia kończą się COMPLETED/bez błędu; rzeczywisty tekst Details po poprawnej i błędnej odpowiedzi, reset oraz kolejny wybór działają. screenshots/enlarged/ obejmują pełne Details i dostępne akcje. Nie odczytano wartości procentowej; nie nazywamy tego Safari200%, ustawieniem text-only ani pełną macierzą dużego tekstu. Chrome200% pozostaje odrębnym dowodem03. Zmianę Safari cofnięto jednym rzeczywistym Decrement, a screenshot przywróconego widoku wraca do poprzedniego zawijania tekstu. RESTORE.log i restore-final-ids.yaml dokumentują również cofnięcie omyłkowo włączonego Reader.

Nie wykonano VoiceOver ani odsłuchu/announcement/focus czytnika. Hierarchia Maestro służyła wyłącznie do zwykłych selektorów dotykowych Safari, nie jako zastępczy test VoiceOver. Dark to jedyny zadeklarowany motyw web; brak nowego theme/runtime/instalacji/resetu appdata.

## Próby odrzucone i korekty

- Narzędzie odczytu aplikacji zwróciło kernelerror. Zwykłe simctl/maestro wymagały zatwierdzonego dostępu do istniejącego symulatora; scoped approval umożliwił faktyczny odczyt, nie tworzono urządzenia.
- Standardowy Vitepreview odrzucił brak legalartifact. Odczyt istniejącego dist przez `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist` nie omija buildu ani nie zmienia legalconfig. Serwer służył tylko temu testowi i zostaje zamknięty.
- Wejście `/#session` przed utworzeniem ReactDOM pozostawiło stronę u góry; pierwsza asercja FAIL. Widoczny Try a question poprawnie prowadzi do demo. Nie deklarowano obsługi trwałego deep-linka kotwicy.
- Pierwszy flow exit0 nie sprawdzał tekstu Details, a screenshot pokazał stan zwinięty. INITIAL-PARTIAL.json zachowuje ten ograniczony wynik; wycofano twierdzenie o Details. Końcowy flow centruje kontrolkę i jawnie sprawdza tekst.
- Safari zwija toolbar podczas przewijania: brak PageFormatMenuButton był błędem sterowania, nie defektem Patternly. Odsłonięcie paska ujawniło inny układ menu; użycie dawnych współrzędnych35%,95% omyłkowo włączyło Reader. Następny test bez opcji FAIL (READER-FAILED.log), nie PASS. Rzeczywisty odczyt identyfikatorów umożliwił HideReaderViewButton oraz Decrement; Reader i jeden krok powiększenia cofnięto. Wersjonowany nowy size-probe.yaml używa Increment, ale ten wariant identyfikatora nie był wykonany w tym pakiecie; faktyczny pierwszy większy A jest w size-probe-historical.yaml. restore-size.yaml to poprawiony zwykły wariant bez Reader, również nie wykonywany łącznie; rzeczywisty cleanup jest w restore-final-ids.yaml/RESTORE.log.
- Kontrolka opcji poza widocznym obszarem zakończyła OFFSCREEN-FAILED.log; końcowy flow jawnie resetuje i centruje każdą dotykaną opcję. Nie osłabiono asercji ani nie zmieniono produktu dla narzędzia.

## Odbiór i następny krok

To weryfikacja istniejącego webu, bez implementacji wymagającej nowego architekturalnego briefu lub kontraktu. Obowiązujące W12/W13 i docs05 pozostają bez zmian. Niezależna LunaHigh ocenia dowody, nie sam raport. Nie zamykać całego BIZQ06: dodatkowy przykład/wybór celu, rzeczywisty CTA i uprawnienie publikacji pozostają osobnymi zależnościami. Następny niezależny preflight dotyczy nazwanego przykładu Certification w istniejącym kanonicznym Freepool, z oddzieleniem lokalnego build/test od uprawnienia marketingowej publikacji.

## Cleanup

Tymczasowy serwer4173 zakończony przez CtrlC, port wolny. SoleMetro36855 nadal localhost::1:8081/running. Istniejący Patternly przywrócono na pierwszy plan bez terminate/install/reset; screenshot pokazuje ten sam Progress/no evidence/0sessions/Edit schedule co przed testem, poza systemowym breadcrumb Safari. To dowód powrotu widoku, nie pełny porównawczy dowód MMKV/reminders/SDK. Nie używano edytora ani Save, nie uruchamiano sesji.

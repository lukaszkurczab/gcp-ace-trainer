# BIZQ-06 — widoczny fokus i weryfikacja zoomu03

Poprawiony wybrany przycisk odpowiedzi otrzymuje widoczny obrys przy nawigacji klawiaturą. Po wyjściu fokusu obrys znika; styl wyboru odpowiedzi pozostaje. Zmiana produkcyjna to jedna reguła `.choice-input:focus-visible + label` w web/styles.css. Usunięto też dwa nieużywane selektory `.query-context`, pozostałe po zastąpionym przykładzie SQL; wyszukiwanie źródeł i entrypointów wykazało brak konsumenta. Bez nowego stanu, handlera, runtime, konfiguracji usług, contentu, admission, Premium ani publikacji.

## Dowody

Root odtworzył rzeczywisty problem: w aktualnym zbudowanym Chrome wygląd wybranej opcji z fokusem i po jego utracie był identyczny. Nowy test przed zmianą CSS zakończył się FAIL na tej asercji (`/private/tmp/patternly-bizq06-keyboard03-red.log`). Obowiązujący kontrakt rozróżnienia focus/selected w docs05 był już zapisany; jego hash i cytat utrwalono przed implementacją w CONTRACT.json. Brief Cel/Ustalenia/Podejście minimum.91 i niezależny NO-TOOLS LunaHigh minimum.91 zaakceptowano przed CSS.

Po poprawce rzeczywisty zbudowany widok przeszedł 1/1 test: Tab, Spacja, ShiftTab i ArrowDown; poprawny/błędny feedback po stableID, Details, reset, obrys opcji z/bez wyboru i znikanie obrysu po utracie fokusu. Szerokości1440/390px oraz screenshoty keyboard-focus są w screenshots/. `npm run verify:local` PASS: aktualny build, kontrola wycinka contentu, istniejący fixture prawny i granice public/legal/admin. Root sprawdził pełny dwufile'owy diff i aktualne screenshoty; niezależna LunaHigh wykonała końcowy test i obejrzała wynik, PASS WITH ISSUES.

## Prawdziwy zoom Chrome200%

Najpierw minimalny probe świeżych usuwanych profili potwierdził mechanizm:100% daje outerWidth1440/innerWidth1440/CDPzoom1/scale1;200% daje outer1440/inner720/zoom2/scale1. Dopiero potem dodano etap rzeczywistej strony do wersjonowanego istniejącego testu. Ustawiana jest wyłącznie preferencja tymczasowego profilu Chrome; profil użytkownika i usługi nie są zmieniane. Oba konteksty testowe działają sekwencyjnie i są zamykane, profil usuwany.

Metoda opiera się na [kodzie właściciela zoomu Chromium](https://raw.githubusercontent.com/chromium/chromium/main/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc): preferencja partycji jest stosowana do mapy zoomu; klucz pustej partycji ma postać x. Rzeczywisty zainstalowany Chrome154.0.8037.95 potwierdził efekt, więc nie opieramy wyniku tylko na źródle tej implementacji. Test odrzuci niewłaściwy zoom/skalę; nie używa CSSinjection/deviceScale/pageScale jako substytutu.

Aktualna strona przy200% zachowuje keyboardfocus, Details/reset, czytelne opcje i komunikaty. Metryki: CSSviewport720×1756, zoom2/scale1, focusoutline solid2px; brak przekroczenia granic viewportu przez elementy DOM i zakresy tekstu, panel bez przepełnienia. Natywny screenshot CDP ma1440×3513 fizycznych pikseli, co test porównuje z metryką fizycznego viewportu. Root i reviewer obejrzeli pełny obraz. Dowody: screenshots/zoom200-details.png i zoom200-metrics.json. Nie jest to test ustawienia text-only ani iPhone/Safari/VoiceOver.

## Nieudane próby i ustalenia

Pierwszy odczyt neutralnego obramowania wykonano podczas CSStransition; kolejny probe czekał na rzeczywiste skończone animacje i dopiero on dowiódł defektu wybranego fokusu. Po poprawce test zakładał powrót ShiftTab do pierwszego radia; Chrome wraca wstecz do ostatniego niewybranego radia. Poprawiono wyłącznie test, aby sprawdzał przynależność do natywnej grupy oraz kolejne przesunięcia po jej rzeczywistej kolejności.

Nowa asercja rawdocumentscrollWidth wykazała1040 przyviewport720. Diagnostyka i niezależnaQA wykazały, że +320 pochodzi z zamierzonej dekoracji.hero::before/right-320 ukrywanej przez bodyoverflow-x:hidden; żaden element ani tekst nie wychodzi poza viewport. Zachowano ten pomiar w JSON, panel-widthguard i zastąpiono błędną asercję sprawdzeniem rzeczywistego contentu/tekstu. Nie zmieniono produkcyjnej dekoracji ani nie osłabiono kontroli treści. Logi: `/private/tmp/patternly-bizq06-zoom03-diagnostic.log`, `...-viewport-diagnostic.log`, `...-native-capture.log`.

Playwright element/page screenshot przy natywnym zoomie przycinał obraz do wymiaru CSS720×1756. Te obrazy nie dowodzą czytelności. Bezpośredni natywny captureCDP dał1440×3513, zgodny z fizycznym viewportem; końcowy test sprawdza te wymiary i dopiero ten obraz jest dowodem.

## Granica i następny krok

App/CLI/content/deps/locks bez zmian: ponowna pełna regresja aplikacji nie jest potrzebna. Reużyte rootqa1772total/1768PASS0FAIL4existingSKIP oraz exactappCI37123223723/crossrepo3. Późniejszy docs-only37124094732 ma potwierdzone oba joby SUCCESS; jego logów nie odczytano ponownie, więc nie przypisujemy mu nowych liczników. Nowa kontrola dotyczy faktycznie zmienionego webCSS i narzędzia. Cudzy plan/audyty/stashe zachowane, bez drugiego planu statusów.

FullBIZQ06 pozostaje otwarte: rzeczywisty kanał/CTA i uprawnienie publikacji, dodatkowe dopuszczone przykłady oraz pozostała macierz web. Następny bezpieczny preflight może sprawdzić Safari/duży tekst wyłącznie na istniejącym iPhone17 7F315654-3175-4F3C-BB24-B0263F59360C po potwierdzeniu braku kolizji z aktywną pracą; bez dodatkowego urządzenia/instalacji/VoiceOver. Gdy urządzenie jest zajęte, kontynuować niezależne źródła zamiast przestawiać jego właściciela.

## Push

Web commit `a48afd3852bf49cede22ebba9252ef95a1881ec4` zwyczajnie wypchnięty do main; HEAD/upstream zgodne. Obejmuje tylko styles.css i istniejący demo-site.browser.test.mjs. App commit tej dokumentacji jest checkpointem raportu, nie zmianą exportera/runtime ani nowym content admission.

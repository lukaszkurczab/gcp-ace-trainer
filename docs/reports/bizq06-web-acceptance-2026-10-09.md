# BIZQ-06 — lokalne demo i dostęp do aplikacji

Data: 09.10.2026. Źródło wymagań: [BIZQ-06](../specs/business-quality/06-BIZQ-06-DEMO-I-KONWERSJA-WEB.md), §4–10, W01–W18. Bieżący stan wyłącznie w [.agent/WORKING_STATE.md](../../.agent/WORKING_STATE.md), kolejka wyłącznie w [planie](../PATTERNLY-WORKING-PLAN.md).

## Wynik i zakres audytu

**Odbiór lokalny: independent PASS WITH ISSUES. Publiczna konwersja: OPEN — brak potwierdzonej dostępności App Store. Niczego nie opublikowano.** LIVE_UI: Chrome/Playwright, macOS, EN, 390×1000 i1440×1000; OSdark iOSlight. Web ma jeden istniejący ciemny motyw, bez przełącznika/auto-light; jasne ustawienie OS nie zmienia jego tokenów. W12 wymaga obsługiwanych motywów, nie ustanawia nowego motywu.

APP źródło7090b0bc, CONTENT0f4e691, WEB bazowy29790db; późniejszy diff opisany poniżej. Interakcja produkcyjnego weba jest rzeczywiście montowana w istniejącym Vite local-test. Dane prawne są jawnie syntetycznym APP-produced fixture testowym; te próby nie są odbiorem R01 ani działających kontaktów.

## Cel użytkownika i mapa flow

Wejście → jeden przykład Coding → wybór opcji bez wyniku → jawne Check answer → właściwe objaśnienie i opcjonalne pełne Details → Try again albo jawne wybranie innego przykładu AWS. Zmiana opcji po zatwierdzeniu usuwa poprzedni wynik/Details i wymaga ponownego Check. Zmiana celu czyści cały stan; ponowny wybór już aktywnego celu przenosi focus do tego samego pytania i zachowuje jego odpowiedź.

Hero/katalog prowadzą do istniejących sekcji albo dwóch właściwych przykładów; nie są odnośnikami pobrania. Przed i po demo: „Patternly is coming to the App Store. Download is not available yet.”. Wynik nie zapisuje postępu, nie jest diagnozą ani obietnicą gotowości. Bez TestFlight, listy oczekujących, trzeciego przykładu Design, sprzedaży webowej, nowego SDK lub endpointu.

## Źródła i kontrakt między repozytoriami

CONTENT jest właścicielem pytań i receiptów; APP canonical runtime/eksporter waliduje family, exact question, authored feedback, Details, ordinary Free pool, lock/release/admission/runtime receipt; WEB konsumuje tylko wygenerowany wycinek. Pytania nie są kopiowane do JSX ani ręcznie poprawiane w JSON.

| Cel | Question ID / ścieżka CONTENT | Content version / dopuszczenie |
| --- | --- | --- |
| Coding Interview | `alg-complexity-time-005`, `content/coding-interview-dsa-problem-solving/complexity_and_constraints/derive_time_complexity.json` | `coding-interview-dsa-problem-solving-authoring-v2026.10.02-bizq01-04` |
| AWS certification | `aws-saa-c03-architecture-001-odk096`, `content/aws-certified-solutions-architect-associate/aws_secure_architecture_foundations/architecture_review.json` | `aws-certified-solutions-architect-associate-authoring-v2026.09.21-odk096` |

Oba przykłady mają historyczne admission `946d3589abf9bfb205b382e7ebb9205786c3e42e18fe733c3607ad836a6a80a4`, APP `e889b05d033d4cc4b7676d0ca3f224efc3fac115`, CONTENT `8bb27fa2bd4f1af58fb8c1b49e5314a1691bbb03`, release `patternly-candidate-f00041eda3ca`; pełne skróty są w generated demo provenance. Rzeczywisty probe porównał całe obiekty obu pytań z dzisiejszym `contentPackageRuntimeOwner.resolveForDiscovery`: exact equality oraz bieżące family/Free pools PASS. Cały obecny track ma inną wersję/SHA (Coding bizq02-v2 zamiast historycznego bizq01-04); równość nieużywanego banku nie jest kryterium dwóch próbek. Historyczne artifact/lock/admission pozostają wzajemnie dokładne, provenance nie udaje aktualnego admission. Niezależny reviewer potwierdził tę granicę i wykonał test eksportera5/5 PASS. To nie dopuszcza całego aktualnego kandydata.

Domyślny current-source check rzeczywiście EXIT1 „Public demo artifact does not match the current app content lock.”: planningv2 draft nie może przejąć dawnego admission. Niezależny przegląd zatwierdził jawny, wersjonowany **lokalny** source mode z historycznymi Git objects i bieżącym cross-check. Domyślny production guard zostaje zamknięty; bez automatycznego fallbacku, zmian locków/admission ani claimu publikacji. Implementacja/merge: APP exporter → WEB jawny local build → wspólny test rzeczywistej granicy. Zmiana APP wyłącznie scripts/exportPublicDemo.mjs/.test.mjs: usunięto zastąpiony testowy checkout/uruchamianie starego eksportera, historia przechodzi przez ten sam obecny builder; brak zmian raw pytań/locków/admission. Actual Node22 exporter5/5/local read-only check/typecheck/diff PASS; WEB snapshot bez zmian. Deployment: osobny R01/R02/current admission; brak zgody i brak działania. Wycofanie lokalnej zmiany nie modyfikuje danych/treści ani zewnętrznego środowiska.

Design review: interakcja fit.95/simple.93/risk.85/maint.90; bounded source fit.92/simple.84/risk.86/maint.85 (minimum≥.8). Writerzy: WEB Luna medium, APP Luna high dla zależności; reviewer Luna high niezależny, bez dzieci.

## Dowody przed/po i pokrycie

Prywatne pliki `/private/tmp/patternly-bizq06-20261009/` (bez credentials/payloadów użytkowników):

- `before-mobile-neutral.png`, `before-mobile-selected-feedback.png`, `before-desktop-selected-feedback.png`: wybór natychmiast ujawniał Reason/Details/correctness, brak Submit. Potwierdzony W04 FAIL, naprawiony przez draft/submitted boundary.
- `after-390-dark-neutral.png`, `after-390-dark-coding-details.png`, `after-390-dark-aws-details.png`; analogiczne `after-1440-light-*`: root obejrzał pełne authored Details i dostępność, brak poziomego przepełnienia. Coding1/AWS4 pełne akapity; pre-submit state neutral/no-feedback i aria snapshot bez Reason.
- `after-live-observations.json`: oba przykłady/rozmiary, canvasrgb(12,19,36), externalRequests[]/nonGetRequests[], brak destination link w panelu.
- `after-mobile-track-anchor.png`: rzeczywisty wybór AWS zachowuje widoczną tożsamość: headerbottom65, topbarTop68.59, headingTop167.59; focus session-title. Overlay stickyheader w automatycznej wysokiej panelowej fotografii nie jest dowodem zasłonięcia po rzeczywistej nawigacji.

Pierwsza próba CUA nie uruchomiła kernel. Istniejący Chrome/Playwright działał po sandbox escalation; `.check()` ukrytego native input nie było prawidłową akcją użytkownika (interception/timeout). Kliknięcie widocznej label potwierdziło stan przed zmianą. Nie zmieniano strony ani limitów, by ukryć tę pomyłkę narzędzia.

## Macierz W01–W18

| Kryteria | Stan / dowód |
| --- | --- |
| W01 | LIVE_UI jeden przykład, Coding/AWS odpowiadają wybranemu celowi; pozostałe7 kart bez obietnicy demo. |
| W02–W05 | Mounted realChrome:24permutations na każdy przykład ×4 opcje, authored correct/wrong ID, pre-submit brak feedback/status/Details, jawne resubmit/reset/changetrack; PASS. Finalny built Chrome1/1 PASS, niezależny końcowy QA PASS WITH ISSUES. |
| W06 | Domyślna odmowa actual EXIT1; local history/current cross-check actual probePASS; jawny local mode i actual checkPASS. Bez losowego fallbacku. |
| W07 | Końcowe `npm run verify:local` i bounded bundle PASS; brak dopuszczenia aktualnego kandydata. |
| W08–W09 | Brak zweryfikowanego AppStoreURL; prawdziwa zapowiedź/no-download LIVE_UI PASS. W08 rzeczywisty kanał OPEN; nie traktować jako pełny lejek. |
| W10 | NOT_APPLICABLE: brak waitlisty, zgodnie z decyzją PO. |
| W11 | NOT_APPLICABLE w tym diff: brak sklepowego/deep linku i Premium preview; nie zmieniono mobilnych bramek. |
| W12 | LIVE_UI390/1440, stały obsługiwany dark przy OSlight/dark PASS; real200%zoom z built artifact PASS: Chrome154.0.8037.98, cssVisualViewport.zoom2/scale1/clientWidth720, native viewport1440; żadnych textOverflows/content elements poza viewport. |
| W13 | Semantyczne native radio/button/aria-live po submit/sourcePASS; finalny built keyboard/focus PASS: retainedsameactionbutton, Shift+Tab do Details przed action, radio arrowkeys/reset/changetrack; 2px solid focus ring także200%. VoiceOver wyłączone przez PO. |
| W14–W15 | Rzeczywisty public flow externalRequests[]/nonGET[]; brak public analytics w entry/importach; brak raportowania instalacji/zakupu. Finalny built network assertions PASS, brak runtime errors. |
| W16 | Zachowane zatwierdzone hero; brak claimu skuteczności/deadline guarantee/pełnego egzaminu. BIZQ03 odebrane osobno; nie dodano marketingowych obietnic. |
| W17 | Wyłącznie dwa ordinary Free przykłady; brak Design/Premium preview i pełnego trybu. |
| W18 | Lokalny server/build/Git nie są publikacją. Brak deploy/publish; R02 osobno. |

## Kanał dostępu, twierdzenia i pomiar

| Stan | Następna akcja | Status |
| --- | --- | --- |
| Brak potwierdzonej strony aplikacji/regionu | Zapowiedź App Store, eksploracja demo/katalogu; brak aktywnego download | Bieżący |
| Konkretna aplikacja dostępna w zatwierdzonym regionie | Dopiero po weryfikacji identity właściwy store link | Otwarta zależność |
| TestFlight / waitlista | Nie dodawać | Wykluczone przez PO |

Utrzymane twierdzenia: praktyka jednej decyzji, authored objaśnienie, katalog ścieżek, brak konta dla webdemo. Nieopublikowane: gotowość do egzaminu/interview, skuteczność/odsetek zdawalności/uplift, opinie/user counts, deadline guarantee, przeniesienie wyniku, instalacja/zakup. Copy nie zastępuje brakującego kanału dystrybucji.

Nie dodano analityki. Ewentualny przyszły zatwierdzony pomiar: demo_start, demo_submit, details_open, store_link_click; mianowniki odpowiednio zaczęte demo/zatwierdzone demo. Kliknięcie sklepu nie jest instalacją ani zakupem; przy obecnym braku linku wskaźnik N/A, nie fikcyjne zero lub dashboard. Brak raw answer/prompt/PII w nowych transmisjach, bo nowych transmisji nie ma. Realny uplift wymaga późniejszych danych i osobnej autoryzacji.

## Pozostałe odbiory

Finalny explicit-local exporter/build, bounded bundle i realbrowser200%/keyboard/network PASS; niezależny końcowy QA PASS WITH ISSUES. Nie zakończono publicznej konwersji, legal values, domeny/poczty, publikacji, usług/fizycznego iOS ani GO.

## Końcowe sprawdzenia i korekty testów

WEB `npm run verify:local` PASS: canonical local source check → Vite local-test build → bounded demo bundle → marketing/legal/route boundaries. Mounted Chrome1/1 PASS po finalnej zmianie jednego stale zamontowanego actionbutton (24permutations/sample ×4answers, option-ID feedback, pre-submit/reset/reselect/Details). Built Chrome `scripts/demo-site.browser.test.mjs`1/1 PASS:1440/390, native200%zoom, klawiatura/Coding→AWS→Coding, dokładne objaśnienia, brak runtimeerrors/externalrequests/mutations. Finalne obrazy `/private/tmp/patternly-bizq06-20261009/after-built/` (10panelPNG+zoom200-details.png+zoom200-metrics.json); root obejrzał także zoom200-details.

Pierwsza porażka built testu nie dowodziła utraty focusu: test błędnie oczekiwał Details po Tab z późniejszego actionbutton. Finalny test sprawdza rzeczywistą tożsamość focused DOMbutton i używa Shift+Tab zgodnie z kolejnością strony. Druga porażka zamknęła Details dodatkowym kliknięciem po keyboard-open; usunięto zbędną akcję. Nie osłabiano wymogu fullDetails/focus ani nie zmieniano kolejności produktu, by dopasować błędny test.

APP CI baseline nie checkoutuje WEB; dlatego test producenta sprawdza realne historyczne/currentcanonical dane bez wymagania sibling consumerfile, a exactWEBsnapshot/read-only/build granica jest rzeczywiście sprawdzana po stronie WEB. Nie dodano warunkowego SKIP, pustego fixture ani nowej zależności pipeline tylko dla testu.

## Niezależny odbiór końcowy

Luna high/read-only: PASS WITH ISSUES dla lokalnego zakresu, bez materialnego problemu implementacji. W01–W07/W09/W12–W17 PASS; W08 OPEN (potwierdzony App Store destination), W10/W11 N/A, W18 osobny R02 bez publikacji. Reviewer niezależnie wykonał finalny APP exporter5/5, jawny local source check, mountedChrome1/1 i builtChrome1/1 (390/1440/native200%zoom/keyboard/Details/reset/track switch/no external or mutating requests); obejrzał rzeczywiste mobile/desktopPNG. Całe verify:local PASS od wykonawcy, źródła i matching diff sprawdzone. Oczekiwane odmowy currentdraft zachowane. Po sandbox EPERM bez escalacji rzeczywista przeglądarka przeszła z właściwym dostępem; nie było to obejście bramki produktu.

Pełny outgoing APP6files/WEB8files skontrolowany przez root: tylko przypisany kod/dokumentacja, zero wykrytych credential patterns, brak generated content changes, przypadkowych build/temp/plikiużytkownika. Git/CI wynik zapisuje bieżący stan i plan; push nie publikuje strony.

# Audyt stanu projektu — 12.10.2026

Raport zachowuje stan zastany przed poprawkami dokumentacyjnymi. Zamknięcie A2–A4 i audyt miejsca: [poprawki dokumentacji i audyt miejsca](documentation-and-storage-audit-2026-10-12.md). A1 pozostaje otwarte: dokumentacja normatywna musi pozostać w głównym `docs` jako kontrakt całego projektu; nie ustalono jeszcze sposobu jej wersjonowania.

## Wynik i granica audytu

**Dalsza lokalna praca jest możliwa, z istotnymi zastrzeżeniami dotyczącymi dokumentacji i odtwarzalności workspace.** Nie znaleziono nowego potwierdzonego blokera kodu w zbadanym zakresie. Nie oznacza to pełnego odbioru aplikacji, bezpieczeństwa ani gotowości do publikacji iOS.

Cel: sprawdzić, czy po porządkach i równoległych pracach istnieje spójny punkt kontynuacji. Kryteria audytu: czyste i dostarczone źródła; zgodność kontraktów pomiędzy repozytoriami; wykonywalne kontrole; dostępna i niesprzeczna dokumentacja; jawny podział defektów, braków dowodu i bramek wydania. Audyt nie zmienia jedynej kolejki w [planie](../PATTERNLY-WORKING-PLAN.md).

Zakres: cztery repozytoria, nadrzędne dokumenty workspace, aktualny plan i handoff, istotne przepływy uruchomienia/persistence/account/content oraz konfiguracja CI. Bez zmian implementacji, instalacji, uruchamiania aplikacji na urządzeniu, zmian profili, publikacji ani odczytu wartości sekretów. Nie wykonano pełnego pentestu, przeglądu każdego pytania, ręcznej macierzy UI ani zewnętrznych odbiorów usług.

Kontroler badał aplikację i dokumentację; dwóch niezależnych wykonawców `gpt-6-luna`, high, badało odpowiednio backend/web i content. Ten drugi niezależnie sprawdził również istotne ustalenia dokumentacyjne. Bez dalszego delegowania.

## Punkt odniesienia

| Repozytorium | Zbadany HEAD | Stan przed raportem | Zdalna gałąź |
| --- | --- | --- | --- |
| app | `62cfaf2e2dc8c199d92f99ad28de9bcd4a3d6a22` | czyste, main | identyczna |
| backend | `4d8efbd6cab8f8fc31d39970fd8e6abb1a0c45eb` | czyste, main | identyczna |
| content | `26198b7b1bce18048d97e07bfb7efe0f6e67c8b0` | czyste, master | identyczna |
| web | `051fe5376d4781d3ec88ba0c41535b1d224ceb0b` | czyste, main | identyczna |

Zgodność remote potwierdzona przez `git ls-remote`, a nie tylko lokalne origin refs. W czterech primary brak stashów. Plan oraz handoff w katalogu workspace są poprawnymi linkami do jednego właściciela w app. Zachowane prywatne checkouty i archiwa nie zostały uznane za śmieci ani usunięte.

## Mapa przepływu i potwierdzone mocne strony

```text
App → regular root → przygotowanie storage/profilu/konta
    → bootstrap recovery → exact content → nawigacja
    → application/family runtime → journal → materialize/verify → MMKV
    → compact account sync → API → Firestore

content source → validator/builder → immutable artifact + release/admission
               → app locks + bundled catalog

app public legal/demo exports → public web
local admin entry pozostaje osobną powierzchnią
```

Bootstrap przeprowadza recovery przed strict active/content reads (`applicationBootstrap.ts`). Journal ma jeden canonical commit/recovery path, ponowną weryfikację przed clear oraz initial foreground timer w journalu startu. Wybrane wcześniej opisane defekty są rzeczywiście zastąpione w obecnych źródłach; nie należy otwierać ich na podstawie dawnych opisów.

Content migration potwierdza 9 ścieżek, 117 węzłów, 958 jednostek i 16 695 pytań. Release, app release lock i bundled lock są zgodne dla wszystkich dziewięciu ścieżek pod względem wersji, liczby pytań i hashy. Bieżące CC-05 admission przechodzi walidator. To dowód strukturalny i integracyjny, nie indywidualny odbiór jakości wszystkich pytań.

Backendowe OpenAPI odpowiada 76 operacjom runtime; checker klientów potwierdza 54 używane operacje. Web ma odrębne wejścia publiczne i lokalne. Aktualny plan uczciwie pozostawia native recovery, wydajność, usługi i wydanie otwarte.

## Ustalenia wymagające działania

### A1 — P1 / RISK / VERIFIED — nadrzędny kontrakt poza Git

**Dowód:** workspace `docs/00–13,15–17`, główny `Makefile` i `scripts/runPatternlyIos.mjs` znajdują się poza rootami wszystkich czterech repozytoriów. Workspace nie ma własnego `.git`; próba `git -C patternly ls-files ../Makefile` odrzuca ścieżkę poza repo. [Overview](../../../docs/00-overview.md#documentation-authority) nadaje tym dokumentom najwyższą rangę normatywną; plan również się na nie powołuje.

**Skutek:** standardowy clone i czysty status czterech repo nie odtwarzają całego kontraktu ani lokalnego sposobu uruchomienia. Zmiany wymagań mogą nie mieć wspólnej historii z implementacją. Nie twierdzimy, że nie istnieją inne kopie zapasowe.

**Dalsze działanie:** objąć jeden kanoniczny zestaw wymagań i potrzebnych narzędzi workspace wersjonowaniem oraz opisać odtworzenie workspace. Nie tworzyć równoległych kopii dokumentów. To pierwsza korekta odtwarzalności; nie blokuje każdej niezależnej zmiany w obecnym checkoutcie. Pewność wysoka.

### A2 — P2 / TECH_DEBT / RESOLVED — specyfikacje opisują naprawiony kod jako bieżący defekt

**Dowód w stanie zastanym:** [code-health.md:10,34](../specs/engineering/code-health.md) nadal opisuje zapis/migrację w getterach CH-06 oraz positional flags CH-08. Obecne `notificationSettingsRepository.ts:227–249` czyta current envelopes bez zapisu, a `AccountSessionProvider.tsx:1000–1035` korzysta z `AccountFinalizationOptions` i `executeAccountFinalization`. Odbiory: [CH-06](ch06-acceptance-2026-10-12.md), [CH-08](ch08-acceptance-2026-10-12.md). [Persistence, wiersz 65](../specs/engineering/persistence.md) opisuje brak ponownej weryfikacji przed clear, choć `recoverPendingMutation.ts:30–39` ją wykonuje. Podobnie PERSIST-14 opisuje brak initial timer, który obecnie znajduje się w `commitTrainingSessionStart.ts:17–22`.

**Skutek:** wykonawca może ponownie implementować odebrane zadanie lub błędnie uznać historyczny defekt za otwarty. Ostrzeżenie w nagłówkach specyfikacji częściowo ogranicza ryzyko, lecz nie usuwa sprzecznego sformułowania „Potwierdzenie w bieżącym kodzie”.

**Zamknięcie:** stare diagnozy oznaczono jako historyczne; wskazano aktualny pozostały zakres i raporty odbioru. Zachowano AC i native residual. Plan i handoff pozostają jedynymi źródłami kolejki/statusu.

### A3 — P2 / RISK / RESOLVED — sprzeczne wymagania Free/Premium oraz nieaktualny opis języków

**Dowód w stanie zastanym:** [overview:37,59](../../../docs/00-overview.md), [product-definition:24](../../../docs/01-product-definition.md) i [architecture:45,51](../../../docs/02-architecture.md) wymagają Free vertical/node dla każdego tracka. [Plan:15](../PATTERNLY-WORKING-PLAN.md) mówi, że cała rodzina Design wymaga Premium i nie ma darmowego węzła. `premiumProductModePolicy.ts:4–5` wymaga Premium dla wszystkich trybów Design. Ponadto overview:61 nazywa implementację EN/PL-only, podczas gdy `src/i18n.ts:92` i ustawienia języka zawierają siedem języków.

**Skutek:** dwa dokumenty mogą prowadzić do przeciwnych decyzji w tym samym flow Design. Opis języków może ponownie otworzyć zakończoną pracę. Siedem opcji i parity nie potwierdzają pełnej jakości tłumaczeń ani gotowości prawnej.

**Zamknięcie:** dokumenty uzgodniono z obowiązującą decyzją właściciela i potwierdzono jej realizację w polityce trybów Premium. Usunięto twierdzenie o luce EN/PL. Nie zmieniono zasad produktu ani nie zaliczono przez to odbioru jakości tłumaczeń.

### A4 — P3 / TECH_DEBT / RESOLVED — odsyłacz po usuniętym katalogu

**Stan zastany:** plan zawierał jeden odsyłacz do nieistniejącego checkoutu contentu. Raport źródłowy nadal istnieje w repozytorium contentu; nie utracono dowodu.

**Zamknięcie dokumentacyjne:** usunięto z bieżącego planu zakończoną wzmiankę i jej zbędny odsyłacz, zgodnie z zakresem wskazanym przez właściciela. Historyczne źródła, identyfikatory treści i dowody pozostają zachowane. Kontrola odsyłaczy po zmianie jest opisana w raporcie poprawek.

### A5 — P2 / RISK / VERIFIED — mały zapas miejsca dla ciężkich kontroli

**Dowód:** `df -h` pokazał około 7,6 GiB wolnego na początku i 4–5 GiB w trakcie kontroli; wolumen zapełniony w 97–98%. [Poprzedni odbiór](arch02-04-acceptance-2026-10-12.md) dokumentuje rzeczywisty ENOSPC w full gate. Testy releaseGate/releaseManifest tworzą tymczasowe checkouty; nie przypisujemy całej zmiany wolnego miejsca bieżącemu audytowi.

**Skutek:** kolejny build albo równoległa ciężka kontrola może przerwać weryfikację i zostawić niepełny wynik. To ryzyko operacyjne, nie nowy dowód błędu runtime.

**Dalsze działanie:** zachować jedną ciężką kontrolę naraz i odzyskiwać miejsce wyłącznie z potwierdzonych nieużywanych artefaktów z ustalonym właścicielem. Nie usuwać archiwów, potrzebnych historycznych producerów ani danych urządzenia na podstawie nazwy. Brak nowej arbitralnej bramki liczby GB. Pewność wysoka.

## Weryfikacja

| Kontrola | Wynik i granica |
| --- | --- |
| git status, branch/stash, ls-remote — cztery primary | PASS; czyste źródła, HEAD równy zdalnej gałęzi przed dodaniem raportu |
| app CI [38255330720](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38255330720), dokładny `62cfaf2e…` | SUCCESS; oba jobs, qa:static, clean generated-native contract i multi-track round-trip; status oraz kroki odczytane podczas audytu |
| backend CI [37876027614](https://github.com/lukaszkurczab/patternly-backend/actions/runs/37876027614), dokładny `4d8efbd6…` | SUCCESS; odczyt statusu w audycie, bez ponownego uruchomienia CI |
| content CI [38243212563](https://github.com/lukaszkurczab/patternly-content/actions/runs/38243212563), dokładny `26198b7…` | SUCCESS; odczyt statusu w audycie, bez ponownego uruchomienia CI |
| app lokalne `qa:static` | PASS, EXIT 0: 2495 wyników, 2490 PASS, 0 FAIL, 5 SKIP; recovery inventory, typecheck, content boundary i runtime privacy boundary PASS |
| backend lint, typecheck, firestore:ttl:check, openapi:check, frontend:client:check | PASS lokalnie |
| backend selektywne testy lokalne | 181 PASS / 185 wyników; trzy pliki nie startują bez emulatorów (`dataExport`, `privacyRequests`, `securityIncidents`); czwarty przypadek CLI nie ma dostępu do `/dev/tty` (EPERM w niezależnym minimalnym probe, również przy TTY). Nie jest to pełny lokalny PASS ani potwierdzony defekt produktu |
| content `verify:migration`, walidator bieżącego admission, porównanie trzech locków | PASS lokalnie; 9/117/958/16 695 i zgodne tuples |
| content lokalne `npm test` | anulowane po pierwszych sześciu przypadkach, aby nie nakładać ciężkich kontroli; nie liczyć jako PASS ani failure produktu |
| web test:public-legal, test:admin-config, test:prepare:web03c | PASS: odpowiednio 6, 3, 2 testy |
| web test:public-legal:producer | BLOCKED: wymaga artefaktu prawnego i osobnego fingerprintu; nie wygenerowano ich w tym audycie |
| web build/browser | UNVERIFIED świeżym wykonaniem; wcześniejsze dowody w [odbiorze WEB](web-wip-acceptance-2026-10-12.md); brak skonfigurowanego hosted CI |
| plan/handoff/specs — lokalne linki Markdown | 32 pliki, jeden brakujący cel (A4) |

App uruchomiono na Node 22.22.3 z `PATTERNLY_CONTENT_ROOT` i `PATTERNLY_CONTENT_CURRENT_ROOT` wskazującymi primary content, `PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA=26198b7b1bce18048d97e07bfb7efe0f6e67c8b0` oraz `PATTERNLY_CONTENT_HISTORICAL_ROOT=/private/tmp/patternly-content-historical` na `cc3efca88be7e01137f10ac69a0643f06b61a350`. Log bieżącego wykonania: `/private/tmp/patternly-current-state-audit-app.log`; jest materiałem tymczasowym, nie trwałym handoffem. Pominięcia nie są zaliczone jako PASS: cztery testy HTTP recovery wymagają środowiska, jeden dotyczy opcjonalnego artefaktu CC-04.

Narzędzia audytu: istniejące skrypty repo; pomocnicze odczyty Git, plików i krótkie sprawdzenie celów linków. Nie dostarczano nowego narzędzia weryfikacji ani nie zmieniano progów/testów. Nie odczytywano prywatnych payloadów profili. Sprawdzano stan usług GitHub, bez zmian zewnętrznych. Pobranie pełnego logu CI przez CLI było niedostępne z powodu zapisu cache poza sandboxem; status jobs/kroków odczytano przez API, a liczniki testów powyżej pochodzą z ukończonego lokalnego wykonania.

## Otwarte możliwości i granice bezpieczeństwa

**PERSIST-11 — znany defekt, PARTIAL/VERIFIED:** obecny interwał checkpointu wynosi 15 s (`foregroundTimerState.ts:21–22`), a checkpoint jest należny od około 14 s (`ForegroundSessionTimer.ts:47–49`). Zatwierdzony limit utraty wynosi 5 s. [Probe](persist11-probe-2026-10-12.md) potwierdził opóźnienie callbacku Hermes ponad 5 s, ale nie końcowy pomiar checkpoint→kill→resume. Naprawa/mechanizm i odbiór są nadal w planie; audyt ich nie zamknął.

**Native CH-07/PERSIST-13, PERF i przekrojowy AUD-06 — PARTIAL/UNVERIFIED:** kod i CI nie dowodzą zachowania wszystkich profili na urządzeniu, recovery po konkretnych przerwaniach, ograniczenia czasu ani pełnej macierzy UI. Rzeczywisty wcześniejszy timeout bootstrapu wymaga pomiaru według PERF-01. Nie uruchamiano symulatora ani nie zmieniano danych, aby „uzyskać zielony wynik”.

**Wydanie — PLANNED/BLOCKED według istniejących R/ODK:** dane prawne, domena/poczta, zamrożony kandydat, rzeczywiste usługi, fizyczny iPhone i decyzja GO pozostają odrębne. Pełny audyt pytań, EPIC-09 i Android zachowują zatwierdzony podział po iOS. Nie tworzono nowych kryteriów wydania.

**Cleanup:** nie ma dowodu, że pozostawione prywatne checkouty/archiwa są zbędne. Historyczna niejasność README content (brak `--track` w skróconej liście komend) została poprawiona dokumentacyjnie. Nie wykonano nowego usuwania ani przywracania stashów.

## Kolejność dalszej pracy

1. Zapewnić jedno wersjonowane źródło dokumentów normatywnych i wymaganych narzędzi workspace (A1).
2. A2–A4 zamknięto w ograniczonym pakiecie dokumentacyjnym wskazanym na początku raportu. Zachowano aktualne decyzje, kryteria i potrzebne dowody. Nie otwierać ponownie odebranych zakresów bez nowego defektu.
3. Kontynuować jedno rzeczywiste zadanie z planu: pomiar PERF-01, przygotowanie native odbioru CH-07 albo mechanizm PERSIST-11 zgodnie z jego zależnościami. Kontrole dobierać do zmiany, uwzględniając A5.
4. Dopiero po wymaganych lokalnych odbiorach realizować pozostałe R/ODK. Sam audyt i czysty Git nie stanowią GO.

Niezależny końcowy przegląd raportu: PASS po korekcie jednego odsyłacza w raporcie; reviewer potwierdził rozdzielenie PASS, pominięć, otwartych zadań i bramek wydania. Końcowa kontrola lokalnych odsyłaczy raportu: zero brakujących celów.

Pierwotny audyt dostarczył wyłącznie ten raport, bez zmian implementacji. Późniejsze autoryzowane poprawki dokumentacji opisuje raport wskazany na początku.

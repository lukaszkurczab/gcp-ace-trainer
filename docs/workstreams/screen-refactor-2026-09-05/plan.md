# Practice, Activity, Settings — dokument roboczy

Aktualizacja użytkownika po P0–P5: zakończono korektę Recent activity i konta/języka w Settings. Bieżący stan i nowe wyniki: [followup-progress-account.md](followup-progress-account.md). Poniższe wyniki opisują wcześniejszy etap P0–P5.

## Cel i stan
Kontrolowany refaktor trzech grup ekranów z równą wagą logiki i UX. Repo: `patternly`, punkt startowy `d4509b4`, czysty git status. Cel aktywny w zadaniu Codex. Brak zmian backendu/content, publikacji, migracji lub resetowania danych użytkownika.

Planowanie (working-docs) kończy się zatwierdzonym briefingiem; potem osobna faza wykonawcza controller/worker/QA w tym samym zadaniu. Wszystkie delegacje: **gpt-5.6-luna / max**, zgodnie z AGENTS.md (jawne odstępstwo od domyślnego routingu skill). Jeden agent zapisujący naraz. Walidator briefingu nie bada repozytorium.

## Dowody repozytorium
- `PracticeHubScreen`: trzy równoległe odczyty; osobne booleany/data/error, brak retry, błąd usuwa dolną nawigację. Roadmap i Setup powielają track+attempts oraz stan keyed pending/ready/unavailable. Odczyt zapisanej ścieżki także przy trackId z route.
- `PracticeSetupScreen`: dwa getMode, pierwszy może rzucić podczas renderu. Formularz inicjalizowany z route tylko przy mount. Pusta stała scenarioCompetencies mimo istniejącej gałęzi UI — sprawdzić profile zanim usuwać; nie dodawać fikcyjnych opcji.
- `practiceFlowModel`: profile runtime wyznaczają freeNode i dostępne tryby. Progres cert/design liczy wszystkie próby ścieżki i dzieli przez 50, co może mylić z opanowaniem; nie zmieniać curriculum, ocenić zakres dowodu dla bieżącego pakietu.
- `ActivityScreen`: brak cleanup/generation ochrony odczytu; retry nieobecny. `activityModel` grupuje daty UTC, `activityTime` pokazuje lokalne godziny; dateLabel składa angielski tekst i używa systemowego locale. `activityReadModels` ignoruje issues wyników sessions/attempts; pobiera result osobno dla każdej sesji.
- `NotificationSettingsScreen`/`useNotificationSettings`: odrzucone Promise z refresh/request/save/disable bez UI błędu, brak blokady równoległych zapisów, brak refresh po powrocie z system Settings. null permission wygląda jak undetermined. Wysokość time input 66 może ograniczać duży tekst.
- `SettingsTab`: ręczna mapa appearance obok tłumaczeń appearance, stałe Version 0.1.0 / Build 1. YourData i Legal mają unused locale. `SettingsInformationScreen` przechowuje cały przetłumaczony obiekt w stanie; wiersze bez jawnej affordancji dalszych informacji. `InfoBlock` i SettingsGroup to istniejące reusable komponenty.
- Testy: node:test + tsx, wiele testów statycznych regex geometrii oraz prawdziwe modele/storage/notification tests. Nie uznawać regex za wizualne QA.
- Historia: 4d257c0 zmienia testy loaderów, 3b8b82b kończy practice/review/account recovery, 07fcba9 upraszcza Activity/Home; zachować runtime selectors i aktualne kontrakty loaderów. docs/future-tasks opisuje osobne startup/account prace i historyczne 2 błędy bramki; aktualny baseline dopiero ustalić.
- Node >=22.13 <23; Expo 57 / RN 0.86 / React Navigation 7 / MMKV / Firebase native. Brak potrzeby zmiany zależności lub przejścia na Expo Router. Maestro obecne; simctl w sandboxie zgłasza błąd połączenia (do sprawdzenia z właściwymi uprawnieniami).

## Założenia i decyzje
Zachować motywy i hierarchię istniejących komponentów; poprawiać spacing, wrapping, czytelność i konkretne affordancje. EN/PL mają działać. Native smoke na dostępnym izolowanym runtime, bez kasowania obecnych danych. Nie odblokowywać płatnych/nieprzygotowanych treści ani rozszerzać banku pytań w tym zadaniu. Nie uznawać brakującego/nieczytelnego odczytu za pustą poprawną historię. Nie wprowadzać globalnego cache; wspólny hook wyłącznie dla trzech ekranów praktyki, z opcjonalnym odczytem reviews tylko tam gdzie potrzebny.

## Kontrakty
- Track route ma pierwszeństwo w Setup/Roadmap; odczyt i wynik związane z bieżącym żądaniem; brak aktualizacji po blur/unmount i brak stale display przy zmianie parametrów.
- Runtime profile jest autorytetem mode/topic/length. Nieobsługiwany route daje ekran unavailable z wyjściem, nie crash. Config sesji, reviewItemRefs, reviewSource, pin identity oraz persisted data bez migracji.
- Activity: terminal sessions, completed także bez odpowiedzi, abandoned tylko z committed attempt, active wykluczone. Canonical result/attempt fakta i kolejność chronologiczna; lokalny dzień i wybrany język w UI. Osobne wyniki sesji nie są automatycznie duplikatem — batch tylko gdy potwierdzone API/reuse.
- Notifications: istniejący scheduler i persystencja zachowane; UI jawnie loading/error/busy, brak podwójnych operacji, refresh po foreground, błędy nieudawane jako sukces.
- Informacje o danych/prawie bez zmiany obietnic prawnych; public links zachowują walidację i widoczny błąd. Appearance używa istniejącego providera i radio ChoiceRow.

## Ocena przed implementacją
Architektura/spójność 0.88 (ograniczone ownership, reuse 3 ekranów); prostota 0.90 (bez frameworka/cache); bezpieczeństwo ryzyka 0.84 (read/state refaktor, regresje route i async wymagają testów); utrzymywalność 0.88 (jeden odczyt practice, istniejące komponenty i locale). Minimum **0.84**. Poniżej 0.8: przeprojektować, nie wdrażać.

## Etapy / zadania
| ID | Stan | Cel, zakres i kryteria | Weryfikacja / ryzyko |
|---|---|---|---|
| P0 | done | Badanie, baseline, niezależna walidacja briefingu, zapis uwag i decyzji | brak kodu przed zgodą walidatora >=0.8 |
| P1 | done | PracticeHub/TopicRoadmap/PracticeSetup + lokalny hook/read-model i testy; deduplikacja odczytów, retry, spójna nawigacja błędu, walidacja route/mode i brak stale formularza. Poprawić mały ekran/duży tekst/wybór tematu. Usunąć tylko potwierdzone martwe ścieżki. | practiceFlowModel, sessionConfig, route/loading/large text testy; typecheck; ryzyko pin/tryb/route |
| P2 | done | ActivityScreen + application/activityReadModels + tabs/activityModel/Presentation/tests; lifecycle-safe odczyt, retry, jawne storage failure, poprawne lokalne daty/tłumaczenie, uporządkowane czytelne filtrowanie i historia | activity i storage testy, daty midnight/DST/PL, typecheck; zachować nawigację results |
| P3 | done | Notifications + hook + testy + EN/PL: stany error/loading/busy, lifecycle refresh, single-flight, czytelny formularz i błędy | notificationPreferences i nowe failure/foreground tests, presentation, typecheck; bez zmiany scheduler persistence |
| P4 | done | SettingsTab/Appearance/PreferenceSelection/YourData/Legal/SettingsInformation + InfoBlock/SettingsGroup tylko w razie potrzeby: jedna prezentacja appearance, prawdziwe metadane lub pominięcie niedostępnych, jasne linki/info, stabilny wybór tematu, cleanup unused | settings/publicLegalLinks/locales tests, typecheck; regresje innych odbiorców shared |
| P5 | done | Niezależny code QA, korekty, smoke i screenshoty praktyki/activity/settings w light/dark/dużym tekście. Pełne wymagane bramki i raport | qa:static; flow tests; jawne ograniczenia urządzenia/bramki |

Każdy etap: worker bada wskazane pliki/testy przed edycją; raportuje fakty, założenia, pliki, usunięte ścieżki/referencje, dokładne komendy/wyniki, ograniczenia i model/effort do `docs/workstreams/screen-refactor-2026-09-05/`. Wynik niejasny lub poszerzający scope wraca do kontrolera. Zakaz subdelegacji i edycji innych repozytoriów. Kontroler sprawdza diff i aktualizuje stan. Wizualne AC: czytelne CTA i selected/disabled, brak przycięć przy 200%, zachowane safe areas, kontrast obu motywów, błędy mają retry/wyjście.

## Komendy
Z katalogu patternly: `npm run qa:static`; `npm run typecheck`; `node --import tsx --test <wskazane pliki .test.ts/.test.mjs>`; `git diff --check`; `git diff --stat`. Inwentarz flow: `rg --files .maestro`. Natywna weryfikacja dopiero po identyfikacji działającego urządzenia/runtime; wyników nie zakładać.

## Wznowienie
Przeczytać plan oraz raporty etapów; sprawdzić git diff, aktywnego workera i ostatni log. Bieżący stan: wszystkie zmiany w głównym checkout, qa:static PASS 743/743. Końcowe artefakty/raport oraz ograniczenia w final-report.md i visual-evidence.md. Nie integrować ponownie izolowanych worktree: główny checkout ma dodatkowe końcowe korekty. Nie powtarzać zakończonych etapów bez nowej przesłanki.

## P0 — walidacja
2026-09-05, niezależny agent `brief_validation`, **gpt-5.6-luna/max**, tylko briefing w dokładnie trzech sekcjach Cel/Ustalenia/Podejście; bez narzędzi. Consistency .88, simplicity .84, risk/safety .82, maintainability .87; minimum **.82 — approval**. Uwzględniono: nie usuwać result reads bez batch API; issues nigdy fake empty; scheduler/persistence pozostają; niepełne native evidence ogranicza odbiór. P1 rozpoczęty przez `practice` (Luna/max), single writer. Dostęp simctl po eskalacji działa; booted C3477113-C193-4C0F-9125-FEC9E5A71181 i Metro 8081; pierwszy zrzut przedstawia onboarding gościa. Baseline qa:static log `/tmp/patternly-refactor-baseline.log` w toku.

Baseline: `npm run qa:static` wykonało recovery:check PASS, typecheck PASS, tests **712/714** (log baseline.log), a następne boundary komendy nie uruchomiły się przez `&&`. Zastane failures: scripts/mutationArchitecture.test.ts szuka inline resumeExpected/start w ExamScreen, który deleguje do examReadOwner (do aktualizacji dowodowej); src/tracks/coding-interview/rcAlgorithmsBootstrap.test.ts zakłada stary liniowy flow, aktualny YAML obsługuje guest/select-track i warunkowe nested runFlow. To testy kontraktów flow objętych końcowym sprawdzeniem; naprawa dopiero po potwierdzeniu aktualnych owner/flow, bez zmiany produkcji poza zakresem. Pierwszy capture Maestro wykonał tap gościa, screenshot command odrzucony przez nowy kontrakt ścieżki output; kolejne capture używają względnych nazw w output-dir. Dane nie resetowane.

Kontrola rozmiaru etapów: P1 dzielę na P1a (kanoniczny read/hook, 3 integracje loaderów, retry/lifecycle) i P1b (guardy route/mode/form oraz UX). P1a najpierw narrow tests/typecheck; P1b dopiero potem. W chwili podziału brak zmian kodu, więc brak częściowego rollbacku. P2 dodatkowo ma narrow entry do Activity w pustym Progress, potwierdzony brak native/code; szczegóły P2-brief.md. P3/P4 dodatkowe potwierdzone problemy i zakres w P3-P4-brief.md.

## Organizacja wykonania — izolacja
Aby nie blokować niezależnych P2/P3/P4 oczekiwaniem na P1, utworzono detached worktree HEAD d4509b4: `/private/tmp/patternly-activity-refactor` (agent activity) i `/private/tmp/patternly-settings-refactor` (agent settings). Jeden writer na worktree, brak równoległych zapisów tego samego checkout; integracja do głównego checkout sekwencyjna, po narrow testach. node_modules symlink do istniejących zależności, brak instalacji. Ta korekta zastępuje wcześniejsze zbyt szerokie 'jeden writer naraz' ograniczeniem **jeden writer na worktree**; nie zmienia kontraktów/AC zatwierdzonego briefingu. Ocena min .84 (izolacja usuwa ryzyko kolizji; integration diff+tests wymagane). P3 i P4 mają oddzielne testy/raporty nawet w jednym worktree. Wszystkie profile nadal Luna/max. P1 kontynuuje w głównym checkout.

P4 decyzja o uproszczeniu: PreferenceSelectionScreen ma jedynego odbiorcę AppearanceSettingsScreen (rg src; testy nie stanowią runtime reuse). Wchłonąć typed selection/busy/error do Appearance i usunąć wrapper po pełnym sprawdzeniu references. SettingsInformationScreen pozostaje dla dwóch rzeczywistych odbiorców. Ocena prostoty .92, ryzyka .86, pozostałe >=.88; minimum .86.

### P1a — done
Raport P1a.md: 48/48 focused tests, typecheck PASS, diff check PASS. Kontroler przejrzał diff/read hook i negative review testy; native Hub→Setup PASS. Usunięto duplikację loaderów trzech ekranów, explicit track omija stored read, reviews tylko Hub, retry/lifecycle keyed guard. P1b rozpoczęty jako osobny etap: guardy/form/UX; brak zmian progression/curriculum.

### P3 — partial (isolated implementation verified; integration pending)
Raport P3.md istnieje w settings worktree: typecheck PASS, 14/14 focused tests, diff PASS. Kontroler wykrył i zlecił poprawkę busy-refresh loading race (naprawiono skip startedWhileBusy) oraz StrictMode mounted reset. Jeszcze korekta permissionPending copy z Checking do not enabled. P4 w tym samym izolowanym worktree następuje po P3; końcowy QA/native pozostaje wymagany. Nie oznaczać głównego checkout jako mającego P3 przed sekwencyjną integracją.

### P2 — isolated verification done, integration pending
P2.md skopiowany do głównego repo. Focused 26/26, TZ Warszawa 24/24, TZ Nowy Jork 6/6, related static 40/40, typecheck/diff PASS. Kontroler przejrzał reader/owner, formatery i testy kanonicznego storage/DST. Następne bounded zadanie agenta activity w jego worktree: test-only P5 baseline repair zgodnie z baseline-review.md. Brak zmian production exam/YAML/runner. Integracja P2/P5 dopiero gdy P1b writer skończy.

### Integracja i QA — 09:34
P1b ukończone: P1b.md, 67/67 focused, typecheck/diff PASS. Pierwszy native Hub→Roadmap→Continue→Setup length/feedback PASS (practice-final-output/2026-09-05_093116). P3/P4 zintegrowano sekwencyjnie do głównego checkout przez git apply --check; tylko właściwe pliki i raporty, bez node_modules/starych kopii dokumentacji. QA settings i practice niezależnie w toku.

Niezależne QA P2/P5: początkowe FAIL, min .70. Przyjęte uwagi: pusty Progress musi zachować Open Practice także dla Cloud/installed, test bootstrap ma zachować kolejność scroll/timeout/tap, dodać test Progress local-week/DST. Korekta delegowana settings w activity worktree jako jedyny writer. Uwaga HomeTab dotyczy zastanej, niezmienionej prezentacji poza wskazanymi grupami — jawnie poza zakresem, bez rozszerzania całego Home. Uwaga route mapping: kod niezmieniony, native Algorithms result flow będzie dowodem; generic/simulation pozostają testami downstream i ograniczeniem renderer coverage.

### Zintegrowany checkout — 09:47
P2 i test-only P5 naprawy baseline zintegrowane sekwencyjnie przez git apply --check, także poprawki z P2-QA-corrections.md. Wszystkie P1–P4 implementation gotowe. QA settings min .80 warunkowo; dwie wskazane korekty accessibility wdrożono (P3-P4-accessibility-QA.md, 16/16 + typecheck/diff PASS), kontroler przejrzał opt-in InfoBlock i zachowanie disabled ListRow. Brak bezpośredniego renderer test hooka pozostaje ograniczeniem, nie uzasadnia dodatkowego frameworka/controller factory przy istniejących guard/application tests i native evidence.

Native: settings-final-output/2026-09-05_093341 PASS, reminder-keyboard-fixed-output/2026-09-05_093905 PASS z realną klawiaturą i błędem 29:00, large-final-output/2026-09-05_094045 PASS dla Hub/Roadmap/Setup/Settings/Appearance/Notifications/reminder. Przywrócono large/light. Zrzuty ustawień 09:33 przed końcową korektą copy YourData; nie traktować starego copy jako finalnego. qa:static zintegrowanego kodu w toku /tmp/patternly-refactor-final-qa.log.

### Bramka prywatności — korekta
Pierwsze zintegrowane qa:static: recovery/typecheck PASS, 742/742 tests PASS, content boundary PASS, runtime privacy boundary FAIL: practiceReadModel składa issue.message w Error. Mała korekta kontrolera wykorzystuje istniejący StorageReadError z issues jako cause, zamiast surowego tekstu. Ocena przed zmianą: spójność .95, prostota .95, bezpieczeństwo .92, utrzymywalność .95; min .92. Test sprawdza klasę i bezpieczny komunikat.

### P1 końcowa korekta ownership / route
Drugie qa:static zatrzymało się 741/742: zakaz storage imports z features. Czysty reader + test przeniesiono do src/application/practiceReadModels.ts/.test.ts; hook nadal w features. Brak równoległej/replaced implementacji. Niezależny QA potwierdził tę korektę, dodatkowo przyjęto odrzucenie jawnie wskazanego locked topic w Roadmap. Hub start korzysta z wyświetlanego primaryMode i nie narzuca długości10. Kontrakt dotyczy istniejących typowanych trybów runtime; automatyczne UI dla przyszłych nieznanych trybów nie jest celem. Ocena przed korektą .90/.92/.86/.90; min .86.

### Końcowa bramka
`npm run qa:static` PASS: recovery:check, typecheck, 743/743 tests, validate:content-boundary, validate:runtime-privacy-boundary. Log final-qa.log. Ostatnia aktualizacja testu cutover zastąpiła przestarzałą asercję inline trybu sprawdzeniem wszystkich zweryfikowanych profili (4/4 focused PASS). Nie osłabiono bramki. Final diff check PASS.

## Zakończenie
P0–P5 done. Niezależny końcowy P1/P2 PASS min .88; QA/restrykcje i przyjęte korekty w final-independent-QA.md. Pełna bramka PASS, native evidence ukończone, log/lista plików i raport zapisane. Wszystkie zmiany pozostają bez commita w głównym checkout. Symulator przywrócony do large/light; jedna lokalna zakończona sesja testowa zachowana.

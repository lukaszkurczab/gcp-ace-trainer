# BIZQ-01 — pierwszy niezależny slice: widoczność ryzyka w review

Data: 2026-10-02. Ten raport jest dowodem ograniczonego slice’u, nie drugą kolejką. Statusy BIZQ-01..06 wyłącznie w [kanonicznym planie](../../PATTERNLY-WORKING-PLAN.md). Pełny BIZQ-01 pozostaje partial.

## Checkpoint do dalszej pracy — 2026-10-02

Kontynuacja zapisuje istniejące specyfikacje, plan, instrukcje i ograniczony slice konsoli. Content commit `78ba999098ea12704b74fe9de2eecdf89578e885` zawiera dokładnie advisory warning, widoczność constraints, testy i instrukcje; pełny BIZQ-01 nadal partial. Fresh focused console/shared-contract/boundary: **28 PASS / 0 FAIL / 0 SKIP**; syntax i diff PASS. Kod/testy/probe/specyfikacje odpowiadają historycznym SOURCE-HASHES.json, więc wcześniejsze independent QA i full82 zachowują stosowalność. Jedyna późniejsza zmiana README to poprawny link GitHub do specyfikacji; nie przepisano historycznych hashów ani logów. Screenshot sprawdzony: wyłącznie console/source question, bez danych konta.

Poniższy preflight/ownership opisuje wcześniejszy moment prac. Mobile ACK/resume jest już odebrane i zarchiwizowane, iPhone17 jest zwolniony; dalszy BIZQ nie jest blokowany przez ten zakończony task. Aktualny handoff w `.agent/WORKING_STATE.md`, statusy nadal wyłącznie w kanonicznym planie. Checkpoint nie odbiera napraw banków, admission, iOS ani całego BIZQ.

## Zakres i kryteria

Cel: istniejąca lokalna Content Review Console wskazuje metainstrukcję w learner-visible constraints, pokazuje constraints w szczegółach i udostępnia sygnał przez istniejące list/riskOnly/item/API. Kryteria: realny BESD seed wykryty; case/whitespace i pięć interakcji; legalne wymagania/named worked example i feedback-only bez flagi; jedna flaga na pytanie; brak zapisu outcome/admission; realny UI pokazuje źródłowe constraints i warning. Nie naprawiamy banków ani app runtime w tym slice.

## Preflight i ownership

[PREFLIGHT.json](PREFLIGHT.json): app main `532869d1af6dcd0558c5376b569ed43e408e1316`, backend main `019e48e7d8e074c2e45d7f5ebb639a4ad394ae8f`, content master `0174e42fbe7634a54c1f5d87369063c7e01e8c7e`, web main `9585919b7d0c1a8396e6d255e49850e64e129d0e`. Odczyt ls-remote potwierdził HEAD=upstream w czterech repo; lokalne stashe app6/backend4/content2/web0 zachowane. App dirty: AGENTS, state/plan, raport i narzędzia/evidence AUD08; content dirty tylko AGENTS. Backend/web clean na wejściu. Pełne zastane statusy w preflight, bez sekretów.

Aktywny czat „Dokończ AUD-08-B3” jest właścicielem shared runtime/iPhone17 oraz WORKING_STATE. BIZQ nie uruchamia/nie zatrzymuje Metro, backendu, debuggera ani telefonu. WORKING_STATE nie jest edytowany — zapis BIZQ odkładamy do bezpiecznego momentu; obecny raport jest linkowany z jedynej kolejki. Plan otrzymał tylko nowe BIZQ rows/sekcję oraz zależność jakości przed komercyjną gotowością AUD06; aktywne AUD08 rows/next action zachowane. Nie wykonano stash/pop/reset/clean/switch/clone/worktree, commit/push, deploy ani publikacji.

## Reprodukcja i dokładny manifest

Seed BESD-N02-B01: `content/backend-system-design-interview/api_contracts_service_boundaries_and_request_flows/BESD-N02-B01.json` (16 IDs). Seed BESD-N04-B01: `content/backend-system-design-interview/caching_read_scaling_search_and_content_delivery/BESD-N04-B01.json` (18 IDs). Kontrola GCPACE-N01-B02: `content/google-cloud-associate-cloud-engineer/organization_projects_policies_services_quotas_and_assets/GCPACE-N01-B02.json` (18 IDs). Pełne IDs, constraints, prompt i answer w [CATALOG-SCAN.json](CATALOG-SCAN.json); to manifest odczytu, nie zmienianego batcha. Nie zmieniono żadnego item/option ID, objective, odpowiedzi, feedbacku ani authority/admission.

CONFIRMED: source constraints w obu BESD units zawierają „The primary decision is …”; console wcześniej flags=[] i pomijała constraints w detalu. `src/features/practice/canonicalQuestionViewModel.ts` kopiuje constraints, DesignInterviewPracticeScreen przekazuje je do PracticeQuestionCard, która renderuje je przed odpowiedzią. To dowód source wiring, nie wykonany test mobile. RED.log odtwarza brak warningu na aktualnym `besd-n04-b01-i002` (1 expected FAIL), a późniejszy focused run sprawdza ten sam item.

CONFIRMED, nadal nienaprawione: `besd-n04-b01-i002` wymaga atrybucji/trwałości audit record, natomiast answer/reason uczą cache placement. Brak decyzji o zmianie semantyki/ID w tym slice. GCP distractor/mechanism defects: NOT_REPRODUCED w ograniczonym odczycie shape/constraints — nie oznacza poprawności semantycznej. BIZQ-02 source preflight potwierdza completionState=unknown w LearningPlanProposalCoordinator i completion/forecast unknown w Home readerze; pełny snapshot/accept workflow pozostaje nieprzebadany.

## Zmiany

Przygotowanie wymagane przez user, odrębne od odbioru kodu: siedem specyfikacji przeniesiono jako niezmienione kopie do `patternly/docs/specs/business-quality/`; sześć pozycji i zależności dodano do istniejącego planu. Normatywne rozszerzenia wpisano przed kodem do wspólnych `docs/01-product-definition.md` (03/05/06), `04-data-model.md` (02), `07-content-guidelines.md` (01), `17-training-runtime-and-interaction-spec.md` (04). Pozostałe reguły niezmienione; numeric policy proposals nie stają się defaults. Wspólne dokumenty są poza czterema repo Git, pozostają lokalną kanoniczną dokumentacją.

Kod: `patternly-content/scripts/review/content-review-console.mjs` — w istniejącym riskFlags jeden anchored literal warning, wyłącznie constraints, i pole Constraints przez textContent w istniejącym detalu. `tests/contentReviewConsole.test.mjs` — regresja realnego seedu, małe schema-valid fixtures z realnych kształtów i istniejące HTTP API. `patternly-content/README.md` — kontrakt advisory. Nie dodano nowego pipeline/schema/statusu/runtime ownera ani martwej ścieżki. Nic nie usunięto; heurystyka nie zastępuje redakcji source.

## Briefing i review

Niezależny walidator `gpt-6-luna`, high, otrzymał dokładnie Cel/Ustalenia/Podejście, bez narzędzi/repo. Pierwszy brief odrzucony min .68 (shared state collision i zbyt szeroko połączone deliverables). Korekta rozdziela przygotowanie od slice i zachowuje shared ownership. Drugi brief: fit .95, simplicity .91, risk .83, maintainability .92, min .83; warunek pozostawienia WORKING_STATE został zastosowany. To akceptacja podejścia, nie QA kodu. Controller: fit .95, simplicity .94, risk .91, maintainability .95, min .91.

## Weryfikacja

- `node --test --test-name-pattern='current BESD constraint disclosure' tests/contentReviewConsole.test.mjs`: expected RED 0PASS/1FAIL przed fix.
- `node --test tests/contentReviewConsole.test.mjs tests/shared-contract.test.mjs tests/content-boundary.test.mjs`: 28PASS/0FAIL/0SKIP. FOCUSED.log. Testy uruchamiają realną console oraz loopback HTTP, nie mock warning helpera.
- `node --check scripts/review/content-review-console.mjs`: PASS.
- Realny Chromium/Playwright: [UI-EVIDENCE.json](UI-EVIDENCE.json), [CONSOLE.png](CONSOLE.png). Filtr track+mental unit+riskOnly → besd-n04-b01-i002 → source constraints + advisory flag widoczne, zero page errors. Przeglądarka app CUA dwukrotnie niedostępna (kernel exited); pierwszy sandbox Chromium odrzucony przez macOS bootstrap permissions. Własny bounded probe uruchomiono poza sandboxem po auto-review; tylko loopback i bez zapisów outcome. Pierwszy pełny zrzut obejmował za dużą listę; kolejny screenshot attempt zakończył się zamknięciem przeglądarki. Finalny probe czeka na initial load i filtr18 oraz zapisuje viewport1280×1000; final PASS. Wersjonowany [verify-console-ui.mjs](verify-console-ui.mjs) używa istniejącego Playwright z web repo, nie nowej zależności produkcyjnej.
- Skan przez existing createContentReviewConsole/listItems/catalog: 9 tracków, 943 mental units, 16077 pytań, 5 typów interakcji. 1569 warnings, wszystkie BESD; to narrow automatic warning, NIE 1569 niezależnie potwierdzonych usterek. Pozostałe zero warnings nie dowodzi jakości.
- PRESERVATION.json oraz PRESERVED-SOURCE-HASHES.json: 1382 hashów source/evidence/dist/schema/builder niezmienionych. Premium, sync, atomic goal-plan, reminders, jeden runtime i admission nietknięte kodem.
- Pełne `npm test`: 82PASS/0FAIL/0SKIP, exit0; CONTENT-SUITE.log. Niezależne source QA: PASS WITH ISSUES, gpt-6-luna high; własne28PASS/0FAIL i syntax PASS, źródłowe hashe i7spec copies zgodne. [QA.md](QA.md). Niezależny browser replay zablokowany przed stroną przez macOS bootstrap permissions; parent actual DOM+screenshot PASS pozostaje dowodem wykonania, nie własnym replay recenzenta. Nie wykonano typechecku app ani iOS; nie są dowodem tego narzędzia. VoiceOver nie testowano.

## Ograniczenia i następny bezpieczny krok

Nie przeprowadzono pełnego semantic sample do24/track, trzech before/after napraw źródła, shuffle/resume/scoring audytu, content build/lock update, admission ani mobile correctness/partial/Details/duży tekst/motywy. Bez tych dowodów BIZQ-01 nie jest zamknięte. Brak wpływu biznesowego lub pomiaru skuteczności edukacyjnej.

Następny slice: dokładny batch BESD-N02-B01/BESD-N04-B01 (manifest IDs już istnieje), ustalenie zamierzonej decyzji dla audit/cache konfliktu, źródła pierwotne i poprawa constraints/answer/feedback zgodnie z aktualną authority. Następnie source→validator→builder→artifact→app consumer/admission i iOS tylko na iPhone17 `7F315654-3175-4F3C-BB24-B0263F59360C` po zwolnieniu runtime AUD08. Nie chować źródłowych wad filtrem. Można nadal niezależnie przygotowywać manifest/redakcję bez zmian aktywnych locks i telefonu.

Finalny controller check: unchanged1382/1382, seven spec copies match, git diff --check app/content PASS. Własny serwer konsoli zatrzymany; wspólne usługi/telefon nietknięte. AUD08 dodał w trakcie własny artifact v17, zachowany. WORKING_STATE bez edycji BIZQ. Żaden kolejny slice nie został uruchomiony.

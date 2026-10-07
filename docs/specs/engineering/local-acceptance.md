# AUD-06 — lokalny odbiór i SIM-READY

Status i kolejność: [plan główny](../../PATTERNLY-WORKING-PLAN.md). SIM-READY jest wynikiem tego zadania. Nie ustanowiono go w dotychczasowych raportach.

## Macierz krytycznych przepływów

| Przepływ | Zachowany zakres i wymagany dowód delty |
| --- | --- |
| Entry/provider/signup/adoption/logout | Zachować przyjęty explicit adoption/cancel/cold/reentry. Odebrać wpływ bieżącej recovery/session identity na te przejścia; fixture login nie dowodzi realnego providera. |
| Gość: izolacja/reset/export | Zweryfikować guest-domain preservation podczas recovery i rzeczywisty reset/export po zmianach. Guest34 odebrany wyłącznie w zapisanym zakresie; nie rozszerza autoryzacji usuwania kont. |
| Practice/Review | Przyjęte pięć stanów/theme/storage oraz Result→Review→Result nie są otwartym refaktorem. Sprawdzić zmienioną interakcję z identity i konkretne BIZQ delta. |
| Cel/plan/progress | Atomic goal+accepted plan per track, conflict przy bezpiecznym wejściu, cold persistence i izolacja profili. Wymagany wpływ recovery/sync i pełne BIZQ-02/03; nie uznawać synthetic completionRule za politykę produktu. |
| Reminders | Device-local, bieżący track, gating planu i wybranych dni. Zachować przyjęty zakres; ponowić tylko zmienione zachowanie/BIZQ/CH-06 delta. |
| Legal consent/hub | Indywidualny Terms/Privacy consent, retry/cold/immutable adoption oraz osobno rzeczywista nawigacja lokalnego hubu. Consent proof nie dowodzi hub navigation. |
| Privacy request/export | Właściwy mobile path, generation fences, rzeczywisty export/recovery po account/session zmianach. Historyczny backend proof nie zastępuje mobile odbioru. |
| Operator/privacy | Zachować odebrany synthetic OPS-B4; rzeczywisty issuer i provider pozostają bramką wydania. |
| Recovery/ACK/resume | Pozostały native consume/persistence/restart, generation policy i pełne B2/B4 według [kontraktu](recovery-reissue.md). Nie wznawiać expired ISSUE/ACK bez reconciliation. |
| Content/locale | Dziewięć exact lock/admission tuples i siedem locale de/en/es/et/fr/it/pl. Parity/schema nie dowodzą indywidualnej jakości treści; wymagany scope BIZQ i FCA ma własne kryteria. |

Historyczna mapa odbioru i granic: app Git `e889b05d:docs/active/AUD-06/REPORT.md`; wcześniejsze przyjęte UI26-02B/AUD15/UI12/reminders mają podane tam commity. Jest to archiwum do ponownego użycia pasującego dowodu, nie plan równoległy ani nowy native PASS. Późniejsze odebrane slice'y BIZQ i Guest34 mają pierwszeństwo przed historycznym opisem ich braku.

## AUD-06-CHECK — frontend client scanner

Nieusunięta luka po CH-03: `PATTERNLY_FRONTEND_ROOT=../patternly npm run frontend:client:check` w backendzie nadal zgłasza 11 `frontend_missing_consumer_operation:…:web`. Konsumenci istnieją w `patternly-web/src/components/{PrivacyRequestsPanel,LegalRequestsPanel,SecurityIncidentsPanel}.jsx` przez `lifecycle.request`/`requestAdminJson`; scanner rozpoznaje inne formy wywołań.

Zakres: nauczyć istniejący scanner rozpoznawać używany wrapper i jego literalne operacje albo dostarczyć równoważny odtwarzalny proof przez obecny gate. Nie dodawać atrap wywołań ani usuwać operations z kontraktu dla GREEN. AC: 11 rzeczywistych consumer edges rozpoznane, usunięte/zmienione wywołanie daje RED w negative fixture, obowiązujący pre-promotion gate przechodzi. Zmiana produktu/endpoints dopiero dla wykazanego brakującego konsumenta.

## Kryteria SIM-READY

1. Cztery aktualne repo mają wymagane lokalne gates oraz niezależnie odebrany zakres funkcji możliwy do sprawdzenia lokalnie, z konkretną disposition jawnych decyzji PO. App: static/recovery/content cross-repo; backend: składniki `npm run ci` wraz z wymaganymi dedicated emulator gates; content: canonical/validation/migration/candidate; web: `npm run verify:local`. Sprawdzić obecne package scripts; skipped dedicated przypadek wymaga właściwego osobnego runu.
2. Macierz powyżej obejmuje każdy krytyczny flow, dziewięć tracków i siedem locale; źródło/build/runtime/dataset oraz ograniczenia dowodu są zapisane. Nie żądać nowego testu tylko z powodu nowego commitu; delta/source/config/dependency mają znaczenie.
3. Wszystkie lokalnie testowalne braki mają odbiór lub konkretną istniejącą decyzję właściciela. Nie tworzyć dodatkowych bramek z preferencji narzędzia. VoiceOver pozostaje wyłączony z testów.
4. Wynik wskazuje exact remaining provider/device cases, zatwierdzone ryzyka i przejście do R01–R08. Brak release danych/real provider/physical iPhone nie jest brakiem lokalnego dowodu; lokalna poprawność nie zastępuje tych późniejszych bramek.

Poza zakresem: publikacja, deploy, globalny reset danych, ponowny audyt całego repo bez konkretnej delty i ponowne wykonanie wszystkich przyjętych flow dla samych nowych SHA.

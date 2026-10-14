# Patternly — bieżący stan

14.10.2026 — **prompt 06 / SOLO-MAIL-01 (M10): PASS — lokalny odbiór purchase receipts. Niezależne QA: PASS WITH ISSUES, wyłącznie z jawnym ograniczeniem operacyjnym poza zakresem**. [Jedyny plan workspace](../../docs/PATTERNLY-WORKING-PLAN.md) usunął wyłącznie odebrany purchase zakres 06; zachował residual dormant legal/privacy i operacyjnego rozstrzygania unknown. Nie odtworzono kopii planu w APP. **Następny dopuszczalny prompt: 07**, nie uruchomiono go.

## Bieżący kontrakt i dowód

[Purchase receipt: kontrakt, pliki, odtwarzalne komendy, hashe źródeł, review i granice](../../patternly-backend/docs/purchase-receipt-delivery.md). Przed SMTP atomowo zapisany event/receipt i osobny deliveryAttempts/{claimId} z pełnym payloadem pending. Automatyczna nowa próba tylko po potwierdzonym failed; wygasły sending jest uzgadniany do unknown, nigdy przejmowany do resend. Claim/lease/aktywny user i pending attempt chronią finalizację. SMTP accepted i finalny zapis mają osobne granice błędów. Nieudany zapis unknown nie stanowi dowodu utrwalenia znacznika: pozostaje wcześniejszy pending, który blokuje kolejną wysyłkę. Stary claim daje jawny błąd, nie sukces.

Weryfikacja main: **34/34 PASS, 0 SKIP**, realny izolowany Auth/Firestore i rzeczywisty lokalny SMTP z zainstalowanym Nodemailer. Typecheck/lint/OpenAPI76/diff PASS. Niezależne design/QA **gpt-6-luna high**, main jedynym writerem; QA niezależnie wykonał końcowy gate **34/34, 0 SKIP** i SMTP **6/6**, sprawdził źródła, hashe, dokumentację i residual; nie znalazł blokera dla AC 06. Minimum projektu main 0,88, niezależny review 0,82. Pierwsze próby skorygowały nazwę testowego projektu i zamykanie współdzielonego klienta SDK; szczegóły w dowodzie.

Granice: fault injection wokół rzeczywistych zapisów store, bez rzeczywistej awarii infrastruktury. Lokalny accepted oznacza przyjęcie SMTP, nie dostarczenie do skrzynki. Unknown może pozostać nierozstrzygnięty: brak nowego endpointu/CLI operatora, potrzebne dane dostawcy i autoryzowana procedura operacyjna. Brak obietnicy exactly-once. Dormant legal/privacy pozostają wyłączone i wymagają naprawy przed uruchomieniem. Rzeczywisty SMTP/TLS/auth/sklep/RevenueCat, hosted CI, pełna suita i wydanie pozostają osobnymi odbiorami. Niczego nie wysłano zewnętrznie.

## Zachowane odbiory i prace

- **05 / M03:** [kontrakt HTTP409 i dowody](../../patternly-backend/docs/sync-conflict-http.md). Odebrany pakiet APP/BACKEND pozostaje niecommitowany, w tym sync hunk app.ts. Brak zmiany semantyki conflict/outbox w 06; nie powtarzano jego pełnego odbioru. Historyczny main: APP85+7, Auth/Firestore/HTTP34, route2, OpenAPI26, observability11; QA APP87/OpenAPI26/observability1. Hashe całego app.ts zmieniła teraz ścieżka maila; nie utożsamiać historycznego hasha z bieżącym plikiem.
- **04 / SEC-05:** [terminal-session-v1](../../patternly-backend/docs/terminal-account-wire.md). Bez zmian kontraktu/identity/provenance. Dawna pełna backend suita **331 PASS / 4 FAIL / 10 SKIP** pozostaje ograniczeniem, w tym native piped-stdin token_prompt_requires_tty; nowy wąski gate nie zastępuje pełnego CI.
- **03 / M01:** [sync receipty/TTL/replay](../../patternly-backend/docs/sync-mutation-receipts.md). Bez zmian retencji/replay; ochrona po utracie wszystkich świadków pozostaje SEC-07.
- **02 / ARCH-09:** [record-fingerprint-json-utf8-v1](../integration/contracts/record-fingerprint/README.md). Bez zmian SHA-256 UTF-8 i pinów.
- **QLE:** [kontrakt](../integration/contracts/content-release/local-claude/qle-v2-contract.md) / [acceptance](../integration/contracts/content-release/local-claude/qle-v2-acceptance.json). Odebrane, nie ponawiano 01: historyczne APP d042aa1c+9c9798a5, CONTENT71b0096; ccarp-2026.10.14-qle-v2-full-path-identity-v2, 972 pytań / 53 jednostki / 4 przypadki, SHA256 364ead796c19ee378e0ef7a5c47d80da69f0c3af694e2107d58ad6061f3ff80c. Exact-only bez regradingu; hints/Key constraints wyłączone. Osobisty odbiór/inne banki not_requested; publikacja not_granted. Blueprint PDF403/kompletność eksportu nadal ograniczeniami.

Start 06: APP 3fdff7bbfee2ae93e0baab1b6d9bde515001c4e0, BACKEND 1fea72c9f64d82f8bcd534d3624664629eaf7d51 + odebrany niecommitowany pakiet 05. Nowe delty 06 wymieniono w dowodzie. Nie zmieniono CONTENT/WEB, pinów, tożsamości konta/Premium, learning content ani cudzych prac. Brak raportu solo nadal rozlicza prompt 33; nie odtwarzano historii.

## Autoryzacje i STOP

Bez commit/push, resetu/reinstall/newGuest, operacji na urządzeniu, zmian usług/danych produkcyjnych, zewnętrznych maili i publikacji. Brak nowego celu, automatyzacji i czatu. Jedno istniejące iPhone17; Android zgodnie z etapem, urządzenia sekwencyjnie. Zwykłe commit/push tylko własnych odebranych pakietów według istniejącej zgody. **Ta sesja kończy 06; numer 07 jest wyłącznie przekazaniem kolejności.**

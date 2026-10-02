## Continuation v12c — complete local regression for fixed retention

Fixed30-day terminal retention remains unchanged from v12b production source. Shared test fixture now binds its Firebase project/issuer to the isolated runner's explicit project; malformed/empty overrides fail, absent override retains the historical direct-suite sandbox default. No-tools approval minimum0.90 and independent fixture review minimum0.91, focused6/6 and types PASS.

Fresh pinned gates: full backend303PASS/0FAIL/5dedicated leaf SKIP; recovery17/0/0; actual HTTP/Admin/Firebase SDK4/0/0; operator4/0/0; operator acceptance1/0/0. Lint/types/TTL34/OpenAPI76/frontend transport/build PASS. Independent evidence review confirms28producer and46consumer file hashes and all six log hashes. Logs and manifest are in evidence/B3/PRODUCER-REGRESSION-v12c-MANIFEST.json. Earlier missing-environment and mismatched-project failures remain preserved as failed harness runs.

This closes the local regression slice. SMTP family selection/verification, native acceptance, cloud index/TTL application and whole B2 acceptance remain pending; no whole-task commit/push/deploy.

# AUD-08-B2 — trwałe recovery/reissue

## Current continuation — approved retention30d slice

Fixed canonical 30-day history policy implemented independently of cipher key availability. Persisted ACK and actual supersession use terminalAt from the committing transaction attempt; expiry derives from that exact timestamp. Repeated ACK does not extend the clock. Active unfinished operations and result-expiry-only delivery_unconfirmed reissues have no operation TTL; ciphertext deadline remains separate. Orphan issue replacement resolves one unambiguous user/kind/code-generation match before writes; ambiguous generations fail conflict. Added composite Firestore index supports that lookup. Removed adjustable retention env/runtime field and corresponding fixtures/docs references; no compatibility path or guessed-time backfill. No shared Firestore writes, cloud index/TTL apply, deploy or whole B2 push.

Independent no-tools gpt-6-luna high APPROVE .88/.82/.81/.84 minimum .81; implementation gpt-6-luna high. Node22.22.3 typecheck/lint/focused21/TTL34/whitespace PASS. First required gate v12 failed16/1/0: new test incorrectly expected a recovery history row after completed account deletion purge. Test-only correction pauses actual deleteUser before purge, asserts supersession retention/result absence, then verifies full purge/late-remint fence. v12 FAIL retained. Fresh v12b required gate17/0/0 exit0 and isolated shutdown; post28/28 source matches. Independent gpt-6-luna high qa-gate PASS WITH ISSUES, own focused45/types/TTL34 PASS, pin/log/test review. New composite index must be deployed before cloud orphan lookup; cloud TTL not applied. Evidence: evidence/B3/RETENTION-v12b-MANIFEST.json. This supersedes historical retention-policy blockers only; SMTP scope and whole B2 remain partial.


Status: **IN PROGRESS**, nie odebrane i bez push runtime. A2 przyjęte w historii app `e55cf0a6`; istniejące B1 nie są przywracane.

## Preflight i granice

- Repo baseline: app `a4dc53e7f1715eb6d389da97fe1ffa762ceb4fc9`, backend `29165944d087486075c9ccd23657c5c2fb45a84c`, content `0174e42fbe7634a54c1f5d87369063c7e01e8c7e`, web `9585919b7d0c1a8396e6d255e49850e64e129d0e`. Stashes zachowane.
- Backend `/ready`: database/authentication/providerReader true; Metro status running. B2 testy nie korzystają z shared Auth19099/Firestore18081.
- OpenAPI/runtime58 i frontend transport50 parity PASS. Aktualne behavioral security probes22/22 PASS.
- Izolowany Auth19109/demo: rzeczywisty SDK initial i forced-refresh generation claim oraz missing/malformed guard1/1 PASS; to nie jest jeszcze backend-issued recovery token integration.
- Istniejące store/fence suites na izolowanych Auth19119/Firestore18119:83/83 PASS (firestore, export, progress, adoption, contentpackages). Przypięto jawnie zmienne adresów zarówno CLI, jak i child. Emulatory zatrzymane, shared backend ready nadal PASS.
- Pierwsze uruchomienie tej macierzy zostało odrzucone przez auto-review z powodu niejawnych zmiennych adresów; nic nie uruchomiono. Bezpieczna poprawiona wersja przeszła kontrolę i testy. Nie obchodzono odrzucenia.

## Implementacja ograniczonego slice

AEAD cipher + unit test w backendzie implementowane przez GPT-6 Luna medium; no-tools briefing GPT-6 Luna high APPROVE: consistency.95/simplicity.90/risk.87/maintainability.93, minimum.87. Wersjonowany oddzielny keyring, AES256GCM96bitIV128tag, AAD UID/operationId/kind/generation/keyVersion, failclosed. Focused6/6/typecheck/diff PASS; niezależne source QA GPT-6 Luna high PASS, własny run6/6. Store/API/environment wiring jest obecnie wdrożone w working tree; izolowana failure matrix jest rozbudowywana i nie została jeszcze uruchomiona. Abstrakcja ma dwóch dowiedzionych konsumentów (recovery token i reissue codes).

## Decyzja PO — tylko SMTP

Aktualny plan nie przypisuje decyzji SMTP do konkretnego providera/route. Najbliższy zakres: guest privacy verification code/resend. Inne rzeczywiste efekty: purchase receipt oraz legal/admin mail. Pytanie PO zawiera warianty guestprivacy (rekomendacja)/purchase/all; brak odpowiedzi nie oznacza zgody. Przykład: kod dostarczony przez SMTP, awaria przed utrwaleniem; jawny resend ma zachować historię i unieważnić poprzedni kod. Blokuje SMTP slice B2 i odpowiadający consumer/failure acceptance B3–B4, nie sam A2.

## Następne wymagane kroki

Dokończyć testy trwałego store/CAS, uruchomić izolowaną macierz recovery i regresje oraz wykonać niezależne QA całego producenta. Brief producenta i QA cipher są już zatwierdzone. Rzeczywisty backend custom token → Firebase SDK/refresh i pełna failure matrix są wymagane. B3 owns durable mobile proof/state/ACK/resume; nie deklarować gotowej aplikacji na podstawie backendu. Brak EAS/deploy lub sekretów w evidence.

## Zatwierdzony zakres producenta i kolejność

Backend jest właścicielem kontraktów Zod/OpenAPI i trwałego store; aplikacja jest konsumentem transportu/SDK (B3). Content i WWW pozostają poza A2. Implementacja: backend DTO/store/CAS/AEAD → API/key wiring/generowany OpenAPI → test rzeczywistego backend tokenu w SDK → B3 durable mobile → B4 failure matrix. Merge: producer B2 po własnym odbiorze i decyzjach PO, potem B3/B4; obecnie żaden B2 push. Release/deploy: dopiero wspólny backend/mobile odbiór oraz osobne bramki wydania. Rollback źródła nie cofa użytych kodów ani generacji; operacje wymagają status/reconciliation, żadnego resetu danych. Brak kompatybilności dla starych request bodies.

No-tools producer brief GPT-6 Luna high APPROVE: consistency.94/simplicity.86/risk.84/maintainability.88 minimum.84. Root `accountRecoveryOperations` zapewnia publiczny lookup po zastąpieniu indeksu kodów; oddzielne `accountRecoveryOperationResults` pozwala usuwać ciphertext bez kasowania minimalnej historii. Deletion rozszerza istniejący owned-query purge, nie dodaje drugiego rejestru. Recovery result zawiera firebaseUid osobno od backend userId.

Ownership: LunaHigh store/contracts/paths/dedicated isolated suite; LunaMedium API/OpenAPI/environment/key/TTL/wiring; root legacy meaningful regression tests i test-only environment. Moduł cipher zamrożony po QA. Domyślne stare requesty zastąpione w jednym końcowym source change, bez legacy fallback.

## Dodatkowa decyzja PO — terminal retention

A2 wymaga osobnej retencji minimalnej historii, lecz kanoniczna tabela jej nie definiuje dla recovery/reissue. PO otrzymał 30 dni od ACK/supersession (rekomendacja) /45/180. Brak odpowiedzi nie jest zgodą. Aktywna, niepotwierdzona próba ostatniego kodu pozostaje wznawialna po długim outage; ciphertext ma krótkie okno (recovery55min, reissue≤300s) i jest usuwany niezależnie od terminalnej historii. Runtime policy jest jawnie konfigurowana bez produkcyjnego defaultu; fixture30d nie ustanawia polityki. Blokuje końcową retencję/odbiór B2, nie implementację i lokalne testy.

Supplemental rateLimitBuckets TTL no-tools LunaHigh APPROVE: .96/.97/.95/.97 min.95. Existing reporter writes expiresAt≥activewindowend; new recovery bucket similarly. Sourceconfig/checker/docs added withinwiring, no cloudapply. Currentreportbehavior unchanged; no expiryfield means no TTL deletion. TerminalhistoryPO separate.

## Aktualny checkpoint implementacji producenta

API/key/env/TTL wiring frozen przez Luna medium: typecheck PASS; focused environment/local-smoke/observability/cipher 24/24; OpenAPI contracts23/23; runtime inventory62; TTL34; diff check PASS. Cztery nowe mobile consumer operations nie istnieją jeszcze w aplikacji: frontend parity gate FAIL pozostaje jawną zależnością B3, bez zmiany consumer scope ani pustych deklaracji dla zielonego wyniku. Store i macierz emulatorowa nadal WIP; brak końcowego runtime PASS.

Root dodał wymagany `test:recovery:emulator` do backend CI: demo project, Auth19119/Firestore18119, hub4419/log4519, port preflight, jawne piny env i SDK z checkoutu app o oczekiwanym SHA. Domyślny npm test jawnie pomija tę dedykowaną macierz; CI wykonuje ją osobno po instalacji zależności aplikacji. No-tools LunaHigh APPROVE .96/.91/.92/.94 min.91. Syntax/diff i aktualny backend typecheck PASS; samego runnera ani macierzy jeszcze nie wykonano.

## Izolowany runtime i znalezione korekty

Required producer runner v4 exit0: **15/15 PASS, zero skipped**. Rzeczywisty Firebase Admin custom token → Firebase SDK z app `a4dc53e7`, UID i authorizationGeneration initial/forcedrefresh; proof retry/provider failure; persisted fenced concurrent winner; samegen expiry/remint i freshcode takeover (także rotating); original300s reissue expiry zachowuje kody; live recovery blocks reissue; corruptedAEAD/no-runtime no effects; ACK wrongUID/gen/idempotent/status-expiry; ACK i validcurrentSDKsession delete podczas pausedremint; cleanup bez cipher. Projekt demo i izolowane19119/18119; brak realnego providera lub B3 mobile persistence/UI claim. CLI jest izolowane przez tymczasowe XDG_CONFIG_HOME (żadnych globalnych zmian).

Wcześniejszy run11/13 poprawił dwie niespójności harnessu (retry licznik mierzył inny adapter, nonexistentUID neutral404 vs existingwrongUID409). v2 13/13 miał CLI exit2 po poprawnych testach z powodu zapisu globalnych settings poza sandboxem; runner własny tempconfig naprawił wrapper, v3 exit0. HighQA wykryło status→ACK poexpiry i rootreview expiredrotatingtakeover/liverecovery→reissue; source/testskorygowane, v4 rozszerzone15/15 PASS.

Niezależne API/runner QA początkowo FAIL: trzy unmappederrors→500 i niepełny driftguard config. Root poprawił canonical409inprogress/503corruptedstate oraz exactportassignments/UIoff; APInegative+deploymentTTL11/11 PASS. Niezależne LunaHigh QA po poprawkach **PASS WITH ISSUES** dla boundedbackendproducer; brak odbioru całegoB2 (POpolicy/SMTP/consumer/cloudTTL osobne).

Full backend isolated npm test pierwszy run271PASS/1FAIL: deployment exact TTL list oczekiwał31 zamiastzatwierdzonych34. Uzgodniono dokładną listę i zachowano equality/count; focused deployment2PASS. Domyślny test jawnie SKIP dedykowany recovery suite, który został wykonany oddzielnie requiredgate. Final fullrepeat exit0 **272/272 PASS**; wymagany recovery suite wykonany oddzielnie15/15. Po ostatniej korekcie mappera błędów storedstate wykonano dodatkowo API/security/OpenAPI32/32 PASS; pierwszy fullrun nie był PASS. Shared backend `/ready` po testach PASS, Metro zatrzymane (ponowić preflight B3).

Dowody zachowane w `evidence/B2/`: final recovery-gate.log, backend-regression.log, api-guards.log, frontend-parity.log i SOURCE-PINS.json (HEAD oraz SHA256 uncommitted source). Fullregression poprzedza ostatnią ograniczoną korektę mappera storedstate; aktualne32focused cases obejmują tę korektę. Final źródłowy lint/typecheck/build/OpenAPI62/TTL34 po tej zmianie **PASS**. B3 może implementować A2 nad zamrożonym kontraktem producenta; nie wymaga rozstrzygnięcia niepowiązanego SMTP. Crossrepo parity wymaga rzeczywistego B3, a końcowy odbiór SMTP/retention nadal wymaga PO.

## Niezależny odbiór zakresu producenta

GPT-6 Luna high read-only verdict **PASS WITH ISSUES**, boundedbackendproducer only. Własny rerun API/OpenAPI32/32, typecheck/OpenAPI62/TTL34, runner syntax + missing/mismatchedSHA fail-before-start PASS; przegląd A2/store/dedicated15/full272 evidence. Pozostałe ograniczenia: runtimepolicy/key jawnie niekonfigurowane dla produkcji, cloudTTL apply bez wdrożenia, frontendB3 missing4/parityFAIL, SMTPPOscope i terminalretentionPO. Nie wybrano domyślnej polityki ani nie commit/push B2. Następny niezależny OPS-B2 odizolowany checkout baseline29165944; B2 working tree zachowany.

## Integracja po odebranym OPS-B2

Backend main `d56ffe07fc5d2b6d0b74daef01651bc796ed64f0`, pending A2 nadal dirty/NOT ACCEPTED. Jawny nowy backupstash `d32f85fb95a97e030f0c93c053305767f605f575` zachowany; hashes28files potwierdzone przedff,19 niepokrywającychsię files identyczne poapply. Trzyconflictsimports/package/operationcount rozwiązano bezutraty obu kontraktów; OpenAPIwygenerowany zmergedsource. Recoveryrunner zachowujeactualSDK/exactSHApreflight, korzysta zjednegocommonisolatedrunner/config, poprzednicfg bezrefsusunięto.

Po integracji required recovery15/15zeroSKIPexit0, operator4/4zeroSKIPexit0; static lint/typecheck/TTL34/OpenAPI76/build/diffPASS. Frontendparity nadal jawnie **FAIL4 brakująceconsumeroperations B3**: consumestatus/ACK oraz issuestatus/savedACK. Nie osłabiono checker ani nie dopisano atrap. Pełna integratedregression/independentmergeQA jeszcze w toku. POretention/SMTP nadal pending; brakodbioru całegoB2/pushu/deploy.

Integration final: full isolated **277 PASS / 0 FAIL / 4 reported OPS-test SKIP**, recovery dedicated suite jawniepominięta; osobne required gates recovery15/15 i OPS4/4 zeroSKIP PASS, CLIexit0. IndependentLunaHigh merge/runner **PASS**, własne60/60 oraz bad-SHA negativepreflight fail przedstartememulatora. Actualintegrationmanifest `docs/active/AUD-08/evidence/B2/INTEGRATION-PINS.json`; mergedsource staticTTL34/OpenAPI76 PASS. Frontend4missingconsumeroperations nadalFAIL, wholeAUD08B2pendingPO/B3/bezpushu. HistoricalB2sourcepins zachowane oddzielnie, nowemanifest jednoznacznieopisujemergedtree.

## Aktualizacja decyzji PO — rozmowa głosowa 2026-10-01

PO zatwierdził rekomendowane 30 dni minimalnej historii zakończonych operacji od ACK/supersession. Aktywne niezakończone operacje bez TTL, krótsza retencja ciphertext osobno. Wcześniejsze opisy braku decyzji retention są historyczne. Decyzja zapisana, finalne wiring/config/QA jeszcze niewykonane; bez deployu i wholeB2 acceptance. PO potwierdził także istniejący kontrakt UI: neutralne sprawdzenie skrzynki + jawny resend, bez komunikatu niepewności i bez automaticretry; nie przypisujemy tego jako zgody na rozszerzenie wszystkich rodzin SMTP. Zapis faktów: fit.98/simplicity.98/risk.99/maintainability.98 minimum.98.

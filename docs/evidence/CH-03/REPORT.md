# CH-03 — odebrane z istniejącą uwagą bramki repo

Backend odrzuca brakujące, null i nieznane enumy spraw prawnych i incydentów przed projekcją, przejściem stanu, audytem, przypomnieniem, eksportem lub wysyłką. Świeże odczyty transakcyjne również są sprawdzane. Uszkodzenie po wywołaniu SMTP zachowuje wcześniejszy pending, zamiast dopisywać failed/unknown. Poprawne wartości, wire API, revision/audit/domain semantics i zwykła obsługa błędów nadawcy zachowane.

Zakres:4sourcefiles contracts/stores i2dedicated emulator tests w backendzie; app tylko niniejsze dowody i własny receipt plan/state. Usunięto wskazane unchecked enum casts; nie dodano migracji, drugiego implementation ownera ani platformy walidacji. Przypomnienia czytają wszystkie należne dokumenty przed zapisami transakcji.

Odbiór: niezależny gpt-6-luna/high PASS WITH ISSUES; actualSDK5/5 + niezależne dodatkowe3/3. Controller final43/43,0skip (8SDKgroups+35contracts/OpenAPI/operator-route tests), Node22 typecheck/build/lint/syntax/diff PASS; OpenAPI76operations PASS. Hashe w ACCEPTED-SOURCE.json. [QA](QA.md), [przyjęte podejście](BRIEFING.md), [source inspection i korekty fixture](IMPLEMENTATION.md).

Uwaga: frontend:client:check pozostaje czerwony:11weboperations missing, byte-identical HEAD-scanner baseline/current wobec obecnych wrapperów web. Scanner/routes/wire/web bez zmian CH-03. Nie deklarujemy tej bramki ani release readiness jako PASS. GET safe500 internal_error, PATCH409 *_record_invalid; testowany production Fastify z actualFirestore oraz seam autoryzacji/nadawcy nie dowodzi realnego Auth/OIDC/SMTP.

Powtórzenie, wyłącznie po uzgodnieniu istniejącego emulatora18081 i z własnym projektem:

```sh
cd patternly-backend
FIREBASE_PROJECT_ID=demo-patternly-ch03 FIRESTORE_EMULATOR_HOST=127.0.0.1:18081 CH03_FIRESTORE_TESTS=1 /opt/homebrew/opt/node@22/bin/node --import tsx --test --test-concurrency=1 tests/ch03Acceptance.emulator.test.mjs tests/ch03StoredEnums.emulator.test.ts tests/legalRequestContracts.test.ts tests/securityIncidentContracts.test.ts tests/openapiContracts.test.ts tests/operatorRoutes.test.ts
```

Brak współbieżnych SDK runs, shared-project clear, Auth mutations, procesów/config/device changes, deploy lub publikacji. BIZQ N05 source/history/candidate/admission/consumer/demo zmiany zachowane. Rzeczywisty współdzielony zasób tooling: test admission kopiuje backend snapshot; koordynacja poinformowana o dirty delta i późniejszym odebranym commicie. App push nie może wyprzedzić odbioru lokalnych checkpointów BIZQ. Backend commit039f7f000e701c4fbc69e18a1fb66528cbc5cdcb wypchnięty zwykłym pushem; HEAD/upstream/actualorigin aligned, worktreeclean. Own docs commit/push koordynowany z lokalnymi checkpointami BIZQ.

Koordynacja publication/index rozstrzygnięta: BIZQ N05 independent finalPASS i app commit3cdb1c93; wskazany w live przebiegu wolny index po commicie. Własny docs receipt stosowany do świeżego HEAD, bez foreign appendix/state delta; zwykły app push dopiero po tej autoryzowanej granicy.

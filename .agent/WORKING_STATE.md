# Patternly — skrócony stan pracy

Cel wszystkich zadań pozostaje ACTIVE. Kanoniczny plan: `docs/PATTERNLY-WORKING-PLAN.md`. Brak dowodu wszystkich bramek nie oznacza ukończenia. Sprawdzaj HEAD/remote/dirty tree i rzeczywiste połączenia przed każdym zadaniem.

## Aktualny stan

- Backend main/push `e3a771b9c2a255be5aa1fdaa9cafca6b015e1704` (OPS-B3 ACCEPTED). App baseline przed commitem planu `9f0a510ddd9334ed3af8b5fd226e2d2947dc5e64`; content master `0174e42fbe7634a54c1f5d87369063c7e01e8c7e`, web main `9585919b7d0c1a8396e6d255e49850e64e129d0e`. Freshfetch wszystkich4 przed B3push: brak remoteahead.
- Następny OPS-B4: High no-tools briefing APPROVE .94/.88/.84/.88 minimum .84. RealFastify HTTP→trustedTLSproxy→canonicalCLI→actualFirestorestores; RS256/JWKS, AppCheck i e-mail wyraźnie fixtures, nie providery. Cztery rodziny intake/list/detail/action/result/audit +scope-deny/CAS/lostcommittedresponse. Nie powtarzać mutacji. Implementacja jeszcze nie rozpoczęta.
- Reuse isolated checkout `/private/tmp/patternly-backend-ops-b2`, detached e3a771b; node_modules symlink do istniejących dependencies, nie stage. Własne isolatedAuth19119/Firestore18119/hub4419/log4519 po testach zatrzymane. Nie resetować shared19099/18081.
- OPS-B3: independent LunaHigh QA54/54 PASS, native5/5 PASS (FD3+pipedstdin, hiddenTTY, cancel/lostresponse/CtrlC), full288PASS/0FAIL/4SKIP +requiredOPS4/4 zeroSKIP, static/consumer50 PASS. Test /dev/tty wymagał zatwierdzonego outside-sandbox; EPERM w sandboxie nie jest codefailure. Poprawione stdin/prompt split i ownedTTY cleanup. Finalsource9filehash w `docs/active/OPS-B3/evidence/SOURCE-PINS.json`; report/QA/logs tamże. RemoteCI e3 po pushu jeszcze niesprawdzone.
- OPS-B3 integracja: mainff/push, AUD-08-B2 zachowany. Backup27files `/private/tmp/aud08-b2-pre-ops-b3-integration`, jawny stash `a83361eba8048b5384cecdb412f466b6c6ed87de` retained (niepop). 25files exactoldhash; CI/package tylko dokładne przyjęte dodatki. IntegratedCLI23/23/typecheck/diff PASS. Nie jest to odbiór B2.

## AUD-08-B2/B3 — pozostające prace

- B2 producer jest lokalny, NIE ODEBRANY/bezcommitpush; oryginalnybackendmain dirty27files. Required isolatedAdmin→appSDK/failure15/15 PASS; poprzednia integratedfull277PASS/0FAIL +requiredOPS4PASS, staticTTL34/OpenAPI76 PASS; producerQA PASS WITH ISSUES, mergeQA60PASS. Consumer4missingB3operations FAIL celowo nieosłabiony. Szczegóły `docs/active/AUD-08/B2-REPORT.md` i evidence/B2.
- Zachowane wcześniejsze backup/stash `d32f85fb95a97e030f0c93c053305767f605f575`, `/private/tmp/aud08-b2-pre-ops-integration`; historyczne stashe nietknięte. Nie przywracać zamkniętych zadań na podstawie nazw stashów.
- A2 protocol `git show e55cf0a6:docs/active/AUD-08/A2-RECOVERY-PROTOCOL.md`: root durable operation registry+oddzielne AEADresults, sameID/proof resume bezgenerationbump, recovery55min/reissueoriginal300s recentreauth, activeunACK noTTL, ACKscrubcipher; no revokeRefreshTokens po custommint. Runtimekeyring/terminalretention explicit, brakproductiondefault.
- PO pytania otwarte: SMTP rodzina (rekomendacja guestprivacyverification; purchaseReceipt/allSMTP alternatywy), terminalhistoryretention30d ACK/supersession (45/180 alternatywy). Blokują finalB2/SMTPUIB4, nie A2mobile ani niezależneOPS. Brak odpowiedzi nie jest zgodą. Legal/release values/GO nadal według planu.
- Recovery runner wymaga `PATTERNLY_FRONTEND_EXPECTED_SHA` równemu faktycznemu40hex appHEAD oraz dependencies; używa wspólnego strictdemo/ports runnera, niekill/reset. Legacyfull ma fixedproject patternly-app-sandbox: jawne isolated parent+child env, nigdy domyślne npmtest przeciwshareddata.
- MobileB3 research only `docs/active/AUD-08/B3-REPORT.md`: rootSecureStorevault/coordinator niezależnyodprofili, persistID/proofbeforePOST, FirebaseUID/gen fence, sameUIDcoldACKbezsignin, mismatchexplicit/noACK, no customtokenpersist, sharedsavedACKUI. Adapter ma legacybody/fallback/memoryonlycodes; implementacja/native/Maestro niewykonana.

## Zakończone lokalnie — nie otwierać ponownie bez regresji

- UI-26-11 app `ff78a605c2a84bac17c1df9680e593d63626ba87`; UI-26-12 `058ae2a1103efdf3cbbc549d65069698c57b8a3f`; UI-26-02B app `654baa33a020e0f093f0fb243c2b2dbb19c40148`/backend `29165944d087486075c9ccd23657c5c2fb45a84c`. Evidence w historiiGit, activeusunięte. Fixture/provider granice zachowane.
- AUD-15 app `a4dc53e7f1715eb6d389da97fe1ffa762ceb4fc9`: source1498/1498, native lightstd222/222 +dark2×222/222/storageidentical, QA sourcePASS/nativePASSWITHISSUES tylko licznikfixture. Evidence archiveGit tegoSHA; VoiceOver excludedPO.
- OPS-B2 backend `d56ffe07fc5d2b6d0b74daef01651bc796ed64f0`/app9f0a510d; required4/full265/QA40 PASS. RemoteCI36800987246 SUCCESS d56; docs/active/OPS-B2. Canonical fourfamilyoperator +restrictedtriageDTOs/auditHMAC/CAS/idempotentincident; safelegal bezSMTP, ambiguousSMTPactionsfenced. Legacydevadmin provenwebconsumer retained.

## Środowisko i zasady wydania

Node22.22.3/Python3.13.1/OpenSSL3.6.3/FirebaseCLI15.19/Java23 local; testyTLS potrzebują22.19+, CI22.22.3. Istniejący iPhone17 `7F315654-3175-4F3C-BB24-B0263F59360C` iOS26.4, bez duplikatów. PoAUD15 GuestEN/SystemOSdark/standardlarge/Home, appterminated/MetroSTOPPED (sprawdzić przed mobilnymtaskiem). Sharedbackend8080 dotąd poprzednieźródło: proces nie dowodzi readiness nowegoB2. Androidemail/hasło RedmiNote11 działało w sandboxie; poprawka loading/signOutPending nieopublikowanaEAS, urządzenie było odłączone — aktualne ograniczenia w planie. Żaden OPS push nie jest deploy/EAS/GO/realprovider dowodem.

# Prompt15 residual — odbiór B4

15.10.2026 — **PASS wycinka15: kod i lokalny emulator/iOS smoke.** Niezależny design review i końcowy QA: `gpt-6-luna high`, PASS. Root jedynym writerem. Następny dopuszczalny prompt: **16**, nie uruchomiono. To domknięcie residualu [częściowego odbioru15](recovery15-2026-10-15.md), nie odbiór całego B4, usług ani wydania.

Cel/AC: stara generacja nie odzyskuje dostępu; wznowienie rozstrzyga rzeczywisty skutek exact-ID/secret przez status/proof zamiast guessed ACK; same-ID calls nie tworzą drugiego efektu; przerwania przed/po providerze, SDK i lokalnym ACK oraz restart zachowują niezwiązane profile i Gościa. Retencji recovery30dni nie powtarzano.

## Zmiana i niezależny review

Native wykrył dwa rzeczywiste defekty. Usunięto czteroliniowy success shortcut `finalizeExplicitAuthentication`: ten sam UID ze świeżym pending revoke przechodzi teraz przez istniejący admission/drain/SDK/ACK przed przygotowaniem profilu. Test zachowania obejmuje pending wykryty po wcześniejszym pustym snapshot i claim:null; wiring test zabezpiecza publiczną ścieżkę.

Po usunięciu użytkownika Auth cold start miał SDK=null i pozostawiał `remoteDeleted` z lokalnymi danymi. Dodano proof-only wznowienie zapisanej operacji z już wybranego, przygotowanego profilu konta. Czyta wyłącznie stały marker deletion bez publikowania profilu; public status wymaga exact ID/secret, a proof zgodnego operation/proof ID. Po sprawdzeniu aktualnego lease, niezmienionego markera i bindingu (gdy verified: account/profile/UID hash) tymczasowo otwiera tylko wybrany profil z odroczonym ready notification, invaliduje binding, wyłącza przypomnienia i używa istniejącej allowlisty cleanup. Zapisuje complete i zamyka scope. Offline, mismatch i niepewny cleanup zachowują marker/dane i istniejący stan retry `deletionPending` z user:null. Nie ma tu DELETE, nowego ID, logowania, wymiany tokena, skanowania ani przełączania profili. Czytnik canonical envelope używa istniejącego parsera. Prezentacja dopuszcza brak e-maila dla tego stanu.

Oceny zatwierdzonych materialnych korekt (dopasowanie/prostota/ryzyko/utrzymywalność): same-UID **0,98/0,94/0,91/0,95**, minimum0,91; proof-only **0,98/0,86/0,91/0,86**, minimum0,86. Niezależne QA źródeł, testów i późniejszych receipts nie znalazło blokującego defektu. Nie dodano alternatywnej implementacji cleanup ani produkcyjnych fault hooków.

## Dowody i granice przerwań

| Przypadek | Wynik i dowód |
| --- | --- |
| Replacement/reissue, generation mismatch, status/ACK | Reuse pasujących HTTP/SDK/unit dowodów [13 / SEC-07](../../../patternly-backend/docs/sec07-session-revocation-implementation.md) i [14](recovery14-2026-10-15.md); implementacja protokołu i piny niezmienione. Bez nowego native replacement claim. |
| Before/after Admin fault, same-ID concurrency, revoke before-send/lost HTTP200 | Reuse dokładnego zakresu [pierwszego15](recovery15-2026-10-15.md), w tym export/import Auth/Firestore. Caught exception/store recreate opisano oddzielnie od hard kill. |
| Hard backend kill po Admin revoke/delete, przed durable finalize | Nowy worker sygnalizuje IPC dopiero po await rzeczywistego Admin efektu, czeka; parent zabija wyłącznie tego child przez SIGKILL. Trwała faza/status nie zmienia się po kill, drugi same-ID nie przejmuje skutku przed lease; świeży store wznawia exact ID/secret po naturalnych2min (~121s), bez zmiany zegara/lease. Terminal replay, foreign fixture i stara generacja non-minting sprawdzone. |
| Native revoke po SDK przed Keychain completion ACK | Rzeczywisty SecureStore write port zatrzymany przed zapisem completed. SDK exactUID/gen2, durable pending/block; simctl terminate/launch PID8301→8604, po cold start exact completed, pending empty, authenticated/gen2. |
| Native deletion durable intent przed POST | Nowe jawnie autoryzowane lokalne konto testowe, osobny profil. Przed wysłaniem marker remotePending, serwer bez operacji; PID8604→9027, ten sam ID/secret, realne usunięcie Auth/user Firestore i terminal public proof. |
| Native deletion remote proof przed cleanup | HTTP200 proof zatrzymany przed przekazaniem aplikacji; marker remoteDeleted, dwa learning keys nadal obecne. PID9027→9429 ujawnił SDK-null defect; został naprawiony, a nie uznany za sukces. Po poprawce status/proof potwierdzane przy SDK=null i zamkniętym scope. |
| Native partial local cleanup i cold retry | W prawdziwym Hermesie fault po pierwszym rzeczywistym canonical remove zostawia1z2 learning keys i localCleanupPending. PID11084→11554, zwykły retry bez faultu daje complete/0learning/SDK=null z tym samym ID/secret/proof. Jednorazowy exception i następujący simctl restart są odrębne od backend SIGKILL. |
| Przywrócenie i ochrona owner14/Gościa | Powrót do owner14; PID11914 zwykły entrypoint bez QA preludium. 707/707 runtime src zgodne z workspace, brak różnic. 7learning records, sesja i próba, revision4, outbox/ACK hashes zachowane. Remote owner14 identyczny jak przed deletion fixture. Istniejący pusty Guest identyczny. |

Native: jeden istniejący iPhone17/iOS26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`, istniejąca instalacja `com.lkurczab.patternly.sec03`, fingerprint `3e5de394f227e8c43b51e2b38af4fc7d2407e1346c21f181b36749b31560db4b`. Wyłącznie lokalne Auth19099/Firestore18081/API8080 projektu zachowanego środowiska `patternly-app-sandbox`; backend hard-kill używa odrębnego `demo-patternly-b4-crash`19119/18119. Bez resetu/reinstall/newGuest. Zgoda właściciela w tym czacie dotyczyła tylko NOWEGO lokalnego fixture; owner14 nie usuwano, kody14 nietknięte.

## Weryfikacja

- Root finalny wąski zbiór **210/210 PASS, 0 SKIP**: bootstrap, identity composition, exchange, finalization, pending revocation, recovery coordinator, lifecycle, signed-out deletion recovery i obie prezentacje. Nowe proof-only testy12/12 obejmują brak/pasujący binding, offline/pending/mismatch, stale owner/marker, brak gotowego scope przed proof, brak ready notification, zachowanie obcych profili i retry po cleanup failure.
- Niezależne QA proof-only **105/105 PASS**, typecheck, targeted diff-check; końcowe niezależne QA receipts/backend SIGKILL/native validator **PASS**. Liczników nie sumować.
- Backend revoke **PASS** z `crash-tests.log`; ten sam run miał błąd wyłącznie testowej asercji deletion (`pending` zamiast rzeczywistego `remote_deleting`). Poprawiono oczekiwanie i ponowiono tylko deletion: **1/1 PASS** w `crash-deletion-rerun.log`. Nie deklarować pełnego pierwszego runu jako PASS.
- APP/backend typecheck, backend lint, content/runtime privacy boundaries, składnia nowych/zmienionych narzędzi QA, oba Git diff-check **PASS**. Nie wykonywano ponownie niezmienionych pełnych suit/retencji. `qa:static`, pełny npm test i CI nie mają nowego PASS; wcześniejszy niezwiązany `recovery:check` FAIL na imporcie terminalWireFixture zachowuje swoje granice.
- Własne emulatory zakończono z potwierdzonym **Export complete** do prywatnego `/private/tmp/patternly-recovery15-residual/emulator-export-final`; export/credentials tylko700/600. Własne API/Metro zatrzymane, inne procesy nietknięte. Zwykły entrypoint przywrócony; brak commit/push.

Pierwsze próby test harness ujawniły konieczność ponownego otwarcia routera po zmianie selected profile i liczenia zakodowanych kluczy fizycznych; poprawiono fixtures/asercje. Lokalny debugger używa localhost IPv6 z originem DevTools127.0.0.1 i wymaga gotowego SDK. Odczyt helpera fixture uruchamia się przez `--import tsx`. Żadna z tych korekt nie zmieniła pinów lub danych właściciela.

## Odtworzenie i zmienione pliki

[Sanitized manifest](recovery15-residual-2026-10-15-evidence.json) zawiera receipts, hashe źródeł/logów i operatorski zapis rzeczywistych PID z simctl. `pidMarker` jest pomocniczym dowodem nowego JS context, nie samodzielnym dowodem OS kill. Odczyt offline manifestu:

```sh
node scripts/qa/assertRecovery15ResidualEvidence.mjs docs/reports/recovery15-residual-2026-10-15-evidence.json
```

Backend (osobno, bez działających emulatorów na19119/18119):

```sh
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-23.jdk/Contents/Home PATH=/Library/Java/JavaVirtualMachines/temurin-23.jdk/Contents/Home/bin:$PATH node scripts/run-account-lifecycle-crash-tests.mjs
```

Pliki własnej delty residual: APP `AccountSessionProvider.tsx`, `accountDataService.ts`, `accountIdentityComposition.test.ts`, `signedOutDeletionRecovery.test.ts`, `accountBootstrap.test.ts`, `settingsAccountPresentation.ts`, `mmkvClient.ts`, `accountLifecycleRepository.ts`, `canonicalRecordCodec.ts`, `profileStorageRepository.ts`; QA `recoveryAccountIos.mjs`, `recoveryNativeFault.cjs`, nowe `recovery15Fixture.mjs`, `assertRecovery15ResidualEvidence.mjs`; backend nowe `accountLifecycleCrash.emulator.test.ts`, `fixtures/accountLifecycleCrashWorker.ts`, `run-account-lifecycle-crash-tests.mjs`; ten raport/manifest, B4 spec, jedyny workspace plan i bieżący stan. Cudze/poprzedsesji WIP14 i częściowego15 pozostawiono. Usunięto zastąpiony same-UID shortcut i eksperymentalny, nieużywany obserwator auth-persistence w QA prelude; nie usuwano innych ścieżek ani danych.

Odbiór jest lokalny. Native Guest był pusty; populated Guest/foreign profile preservation ma dowody testów realnego memory routera, bez rozszerzania native claim. Selected-only recovery celowo nie skanuje niewybranego profilu. Release/App Store, fizyczne urządzenie, produkcyjni providerzy/App Check, pełne tapowe UI E2E, SMTP, cloud TTL/indeksy pozostają odrębnymi odbiorami. Brak pozostałego residualu15; usługi w planie zachowano.

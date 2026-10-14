# AUTH-PROFILE-01 / M04 — prompt 10

14.10.2026 — **PASS kodu wycinka i wąskiego lokalnego iOS smoke.** Niezależne QA Luna High: **PASS WITH ISSUES** (znane błędy baseline poniżej). Nie jest to odbiór usług, pełnego CI, Androida ani wydania.

## Zakres i decyzja

Baseline APP `593f79d124093a11a3b6860eae70f82db8373a85`, czysty checkout na wejściu. Obowiązujące instrukcje APP, kanoniczny plan workspace i bieżący stan odczytane; plan potwierdza końcowy handoff QLE, bez kolizji w zmienianych plikach. Wynik09 pozostaje odebrany, nie wykonywano go od nowa. Wskazany historyczny `login-profile-architecture-audit-2026-10-08.md` jest niedostępny po porządkach; nie odtworzono go ani usuniętej kopii planu w APP.

Cel: wspólny właściciel restore/login, provider przekazujący stan i komendy, bez przebudowy wszystkich komend konta. AC: jeden admission/preparation/handoff; zachowane UID/generation/lease, oba dowody `/me`, recovery, odmowy i dane nauki. Journal/parser poza zakresem.

Przed edycją: dopasowanie/prostota/kontrola ryzyka/utrzymywalność `0,94/0,87/0,84/0,92`, minimum `0,84`. Niezależny design review Luna High: `0,90/0,82/0,82/0,84`, minimum `0,82`, PASS z doprecyzowaniem deduplikacji także podczas przygotowania i zachowania dwóch dowodów. Writer Luna High wdrożył admission; główny writer przejął ekstrakcję po jawnym handoffie. Później Luna High pisał wyłącznie testy; osobny reviewer Luna High wykonał niezależne QA. Jeden writer na obszar.

## Wynik kodu

- `src/application/bootstrap/accountBootstrap.ts`: jeden admission dla observera restore, jego pending-revoke wejścia i jawnego logowania; współdzielony promise według UID/generation utrzymywany do completion. Moduł przejmuje przygotowanie profilu, completion handoffu i reconciliation, wraz z typowanym stanem próby.
- `src/application/account/AccountSessionProvider.tsx`: cienkie wywołania modułu; stan, subskrypcja SDK/null/cancellation oraz istniejące komendy pozostają w providerze. `finalizeCurrent` jest przekazywaną komendą, ponieważ używają go też inne operacje konta. Zachowany preselection `/me` i późniejszy `/me` tej komendy z captured generation; nie zastąpiono jednego dowodu drugim.
- Usunięto zastąpione ciała przygotowania/completion/reconciliation z providera oraz oddzielne dreny restore/login. Nie ma drugiego runtime bootstrapu. Re-export `completeUnrecognizedPersistedAuthSignOut` zachowuje istniejących konsumentów testowych; implementacja jest jedna, w module.
- Ogrodzono stale prepare entry, powrót z recovery guardu/barrier resolution i guest-installation await; stara próba nie może wyczyścić nowszej generacji. Deduplikacja zachowuje diagnostykę dołączającego callbacku.
- QA wykryło nowy błąd kolejności: fresh control read mógł ujawnić revoke przy otwartym koncie. Poprawka zamyka aktywny profil konta **wewnątrz pierwszego admission przed drainem**; join nie zamyka profilu już aktywowanego przez wspólną próbę. Realny test memory storage sprawdza oba warunki.

Zmiany testów: `accountBootstrap.test.ts`, `accountCommandGuards.test.ts`, `accountIdentityComposition.test.ts`, `accountStartupDiagnosticWiring.test.ts`, `pendingSignInPresentation.test.ts`. Asercje źródłowe śledzą rzeczywistego właściciela i wiring; testy behawioralne wykonują eksportowane przygotowanie, completion oraz admission. Brak zmian pinów, usług, journal/parser, treści ani danych właściciela.

## Sprawdzenia

| Dowód | Wynik i granica |
| --- | --- |
| Nowy owner | Final `accountBootstrap.test.ts` **9/9 PASS**: join restore/login, drain failure/retry, switch podczas drainu/przygotowania, stale recovery guard/entry, nowe/powracające konto, offline/authoritative denial, prepared-profile completion, pre-drain close i join bez zamknięcia nowego profilu. |
| Account + bootstrap | **356/359 PASS**, trzy `accountLocalReset.test.ts` FAIL `account_data_record_invalid`. Dokładny baseline `git archive 593f79d1` z tymi samymi node_modules: **6/9 PASS, te same 3 FAIL**. To nie wynik pełnego `npm test`. Po końcowej korekcie kolejności ponowiono dotknięty zakres, nie całość dla samej zmiany źródła. |
| Niezależny QA | Końcowe **107/107 PASS**, `npm run typecheck` i `git diff --check` PASS. Reviewer sprawdził produkcyjne połączenie obu `/me`, recovery/denials, UID/generation/lease, completion oraz brak zastąpionych ścieżek. |
| Granice | `validate:content-boundary`, `validate:runtime-privacy-boundary` PASS. |
| Wymagany repo gate | `recovery:check` **FAILED** na istniejącym `src/testing/terminalWireFixture.ts` importującym test support; bez naprawy sąsiedniego zakresu. Nie deklarować `qa:static` ani pełnego hosted CI PASS. |
| iOS | Istniejący iPhone17/iOS26.4, SEC03-A `com.lkurczab.patternly.sec03` 0.1.0(1). Nowy JS, cold offline → Home/localOffline i publiczny `retrySessionRestore` → Home/localOffline, recovery idle: **PASS**. Realny SDK i storage, bez reset/reinstall/newGuest/nowych kont. |

Testy portów modelują backend i część komend; prepared-profile finalization port nie jest sam w sobie sieciowym dowodem drugiego `/me`. Ten kontrakt potwierdzają source wiring i istniejące testy identity/finalization. Native smoke obejmuje przywrócenie istniejącej wcześniej potwierdzonej tożsamości offline i Retry, nie nowe online logowanie/provider attestation. Android zgodnie z etapem nieuruchomiony. Historyczny odbiór09 online/sync nie jest nowym testem usług10. Settings/password re-auth residual14 pozostaje.

## Native preservation i reprodukcja

Baseline źródeł użytych przez Metro: **1071/1071 plików równych HEAD593f79d1**. Końcowe runtime źródła skopiowano do zachowanego prywatnego projektu SEC03; po smoke zmieniono wyłącznie dwa typy portów control na `Pick` używanych metod (bez zmiany kodu runtime). Taka korekta typów nie wymagała ponownego native smoke.

Receipts przed zmianą i po końcowym cold/Retry: ten sam fingerprint, konto/UID/profil, recovery idle, learning records (1 attempt i zakończona sesja), sync synced/revision4/ack4. Dokładna zgodność **wszystkich sześciu kategorii obu profili**, global i secure control, registry generation/checksum, binding present i journal/logout absent/clear. Konto:7 learning,3 lifecycle,1 package pointer,1 Premium cache,1 test-runtime; Gość pusty. Hash control slots zmienia istniejący begin/resolve identity-proof barrier; nie deklaruje się byte equality całego account/session control.

Wersjonowane odczyty i flow: `scripts/qa/readOfflineAccountIos.mjs`, `scripts/qa/flows/offline-account-cold-start-ios.yaml`. Polecenia: Node22 `node scripts/qa/readOfflineAccountIos.mjs http://localhost:8081 <environment-fingerprint>` oraz `maestro --device <existing-iPhone17-UDID> test scripts/qa/flows/offline-account-cold-start-ios.yaml`. Sam Retry był wywołaniem publicznej komendy z istniejącego contextu przez development debugger, po sprawdzeniu jednego aktora localOffline/recoveryidle i zainicjalizowanego modułu z trzema eksportami; nie udaje tapnięcia UI. Właściwy przypadek UI timeout/Retry i callback interleavings pozostają w testach providera. Porównanie receipts sprawdza equality pól actor/profile/recovery/learning/sync, registry, profileInventories/globalInventories/secureControl oraz stanów control; oddzielnie raportuje slotInventorySha256.

Prywatne surowe dowody: `/private/tmp/patternly-bootstrap10/`: `baseline-source.json`, `baseline-native.json`, `accepted-{cold,retry}-native.json`, `accepted-retry-command.json`, `accepted-native-comparison.json`, `maestro-accepted-{cold,retry}.log` i artefakty, `account-bootstrap-final.tap`, `baseline-reset.tap`, `typecheck-final.log`, `recovery-check.log`, boundary logs. Prywatny evaluator/start wrapper to tymczasowe eksperymenty istniejącego development runtime; dostarczone regresje są wersjonowanymi testami produkcyjnych funkcji, a odczyty/smoke używają powyższych istniejących narzędzi. Bez sekretów w raporcie/Git.

## Handoff

Kanoniczny plan workspace usuwa wyłącznie odebrane AUTH-PROFILE-01/M04. Stan bieżący odsyła tutaj i zachowuje granice09,14 oraz baseline gates. Następny dopuszczalny prompt **11**; nieuruchomiony. Bez celu, automatyzacji ani nowego wątku. Po smoke SEC03 i własne Metro zakończone; API/Auth/Firestore/SMTP/RevenueCat nie były uruchamiane ani zmieniane, retained export09 i prywatne kody nietknięte.

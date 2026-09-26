# PROFILE-06/D — logout offline, izolacja B i odzyskanie A

**Wynik:** DONE / lokalny runtime PASS; niezależne QA: **PASS WITH ISSUES**.

## Zmiana i przyczyna

Realny scenariusz A→logout offline→B→A ujawnił błąd `account_sync_state_invalid`. Walidator stanu synchronizacji sprawdzał każdy payload `syncPlan` osobno. `learning_plan` nie może być poprawnie zweryfikowany bez powiązanego `goal`, więc rzeczywista niewysłana para goal+plan A była odrzucana przed żądaniem sieciowym. Walidacja obejmuje teraz wszystkie payloady planu synchronizacji jako jeden kanoniczny pakiet. Nie dodano fallbacku ani osłabienia reguł goal-plan.

## Dowód

- Preflight: lokalne Auth `127.0.0.1:19099`, Firestore `127.0.0.1:18081`, API `127.0.0.1:8080` i Metro `[::1]:8081` były dostępne; użyto wyłącznie istniejącego iPhone'a 17 `7F315654-3175-4F3C-BB24-B0263F59360C`.
- Przy wyłączonym wyłącznie API zapisano lokalną zmianę goal+plan A. Logout natychmiast usunął Home, pokazał pending remote revoke i zachował ten stan przez natywny restart.
- Po wznowieniu API konto B otworzyło własny Home: `No goal is set`; `Open-ended` i `Continue plan` były nieobecne.
- Exact-account inspection przed i po wejściu B: A pozostało na revision 5 / 5 mutations / `active_track, goal, learning_plan`; B pozostało na revision 1 / 1 mutation / wyłącznie `active_track`. B nie wysłało ani nie wyczyściło outboxu A.
- Po ponownym logowaniu A: A przeszło do revision 7 / 7 mutations z tymi samymi trzema typami rekordów; B pozostało revision 1 / 1 mutation. Home A pokazało `Open-ended` i `Continue plan`, a natywny restart zachował stan.
- Test regresyjny buduje bound-account outbox z parą goal+learning_plan, wymaga obu payloadów w jednym `syncPlan`, kanonicznego stanu i trwałego reread.

Wybrane, bezpieczne kadry: [offline po restarcie](evidence/selected/profile06-d-offline-logout-pending-after-restart.png), [izolowane B](evidence/selected/profile06-d-account-b-isolated.png), [odzyskane A po restarcie](evidence/selected/profile06-d-account-a-recovered-after-restart.png). Zestaw liczników i konfiguracji opisuje [manifest](evidence/selected/profile06-d.manifest.json). Surowe logi oraz dane logowania nie są artefaktem repo.

## Weryfikacja

- Implementacja: `accountDataSync.test.ts` + `accountDataContract.test.ts` + `accountLifecycle.test.ts`: **50/50 PASS**.
- Niezależne QA: cztery właściwe pliki testowe **72/72 PASS**, `git diff --check` PASS i brak diagnostyki PROFILE-06/D w `src` lub `scripts`.
- Maestro: offline logout/restart, B isolation oraz A recovery/restart: **PASS**.
- `npm run typecheck`: **FAIL** wyłącznie na 20 istniejących błędach równoległego rozszerzenia locale; zmienione pliki D nie wprowadzają nowego błędu.
- Ocena przed zmianą: zgodność 0,93; prostota 0,84; kontrola ryzyka 0,82; utrzymywalność 0,86; minimum 0,82. Walidator Luna High: 0,95 / 0,85 / 0,82 / 0,88, bez redesignu.

## Ograniczenia

To jest lokalny dowód emulatorowy, nie produkcyjny provider E2E. `GET /v1/entitlements` zwraca oczekiwane 503 w profilu smoke bez RevenueCat i nie był przyczyną awarii danych konta. Prywatny inspector exact-account służył tylko do lokalnego odczytu; repo przechowuje wyłącznie zanonimizowane liczniki. Wybrane kadry zawierają toast deweloperski Expo „Open debugger to view warnings”; nie jest to diagnostyka produktu ani część ocenianego zachowania, ale pozostaje jawnym szumem dowodowym.

# Patternly — bieżący stan

14.10.2026 — **prompt 07 / SEC-03: PARTIAL; CODE PASS, pełny lokalny/native odbiór otwarty**. [Jedyny plan workspace](../../docs/PATTERNLY-WORKING-PLAN.md) zachowuje wyłącznie residual 07; nie odtworzono usuniętego planu APP. **Następny dopuszczalny zakres: 07 residual, nie 08.** Ta sesja jest zakończona, bez automatycznej kontynuacji.

## Kontrakt, decyzje i dowód

[SEC-03: przyjęty kontrakt, lokalizacje, komendy, hashe i native receipt](../../patternly/docs/specs/engineering/security-privacy.md#przyjęty-kontrakt-i-dowód-07). Jeden fingerprint runtime/API/Firebase/RevenueCat; ten sam generator dla app.config i runtime. App ładuje regular root dopiero po kontroli metadata oraz trwałego device-only znacznika. Mismatch/corrupt/unavailable/write-unconfirmed jawnie zamyka auth/storage/vault/cache/purchases/sync. Usunięto bezpośrednią ścieżkę załadowania regular root; istniejące adaptery/lokalizacje zachowane za wspólną blokadą. Bez per-module namespaces/heurystyk, delete/overwrite znacznika, zmian provider IDs/signing, treści i pinów.

**Decyzje właściciela z tej sesji:** historyczne dane bez znacznika wymagają jawnego przypisania do pokazanego środowiska, przed dostępem. Jest to attestation, nie dowód kryptograficzny pochodzenia. Dane istniejącego iPhone17 należą do **smoke**. Nie oznacza to zgody na reset/reinstall/newGuest. W tej sesji nie wykonano przypisania.

Main jedynym writerem; niezależny design/QA **gpt-6-luna high**. Minimum projektu main 0,84, design review 0,82. QA: CODE PASS; pełny lokalny PASS WITH ISSUES, bez claimu wydania. Dodatkowa precondition narzędzia native wymaga wszystkich pięciu protected ownerów zamkniętych przed assign; dodana, inspect powtórzony.

## Weryfikacja i granice

- **66/66 PASS, 0 SKIP**: identity/guard/App+Gate, config, encrypted bootstrap/native wrapper, secureAuth, vault, storage cutover/PERSIST fixture. Typecheck, content boundary, runtime privacy boundary i diff check PASS. Niezależne QA: nowe 10 testów, typecheck, privacy i diff PASS. VM/native port mocks nie dowodzą Keychain ani compatible overinstall.
- **qa:static zatrzymany:** recovery inventory odrzuca istniejący import journalTestSupport z src/testing/terminalWireFixture.ts. Ten sam import jest w bazowym HEAD, plik bez diffu; poza zakresem. Pełnego npm test i hosted CI nie uruchomiono; nie ma clean repo gate.
- **Rzeczywisty iOS probe:** istniejący iPhone17/iOS26.4, jedna instalacja com.lkurczab.patternly, Hermes. Runtime smoke fingerprint `4d8001befde58a6e36643f99ab09bc29c4a6175337d33163105be15dfc69748e`; configMatches=false, marker unassigned, regular root i wszystkie pięć protected ownerów uninitialized. EXConstants.bundle/app.config zainstalowanego klienta nie ma nowego fingerprintu. Próba wykonała bieżący JS z Metro na istniejącym binary z legacy metadata, nie stary zainstalowany JS. To native dowód blokady przed providerami, **nie A→B→A ani zachowania wszystkich kategorii przy overinstall**. Istnienie encrypted MMKV a i katalogu pakietów sprawdzone bez czytania payloadów. Brak zakupowego sentinela/konfiguracji RC.
- Zwykły sandbox blokował CoreSimulator/watchery Metro; read-only simctl i lokalny Metro poza sandboxem działały. Nie instalowano narzędzi, nie restartowano usług, nie zmieniano konfiguracji repo. Własny Metro zatrzymany. Native helper jest wersjonowany; jego assign nie uruchomiono. Nie odczytano chronionych ownerów z zablokowanej aplikacji.

**Residual 07:** przygotować zgodny artefakt natywny zawierający fingerprint w metadata, następnie jawne przypisanie smoke i pełne kontrolowane zimne A→B→A/compatible overinstall dla MMKV/auth/vault/registry/cache/purchases. B bez odczytu/wysyłki A, A zachowane. Bez podmiany metadata, kasowania danych i zmian IDs/signing dla wygody. Android proof pozostaje później (54, po iOS). Odbiór kodu, native, usług i wydania pozostają odrębne. Nie przechodzić do 08 przed domknięciem residualu.

## Zachowane odbiory

- **06 / M10:** [purchase receipts i granice operacyjne](../../patternly-backend/docs/purchase-receipt-delivery.md); lokalny PASS. Unknown nadal wymaga autoryzowanego rozstrzygnięcia operacyjnego; dormant legal/privacy pozostają residualem. Nie zmieniano backendu w 07.
- **05 / M03:** [HTTP409](../../patternly-backend/docs/sync-conflict-http.md). **04 / SEC-05:** [terminal-session-v1](../../patternly-backend/docs/terminal-account-wire.md). **03 / M01:** [sync receipts](../../patternly-backend/docs/sync-mutation-receipts.md). Nie ponawiano odbiorów ani nie zmieniano tych kontraktów.
- **02 / ARCH-09:** [fingerprint JSON UTF8](../../patternly/integration/contracts/record-fingerprint/README.md). **01 / QLE:** [kontrakt](../../patternly/integration/contracts/content-release/local-claude/qle-v2-contract.md) / [odbiór](../../patternly/integration/contracts/content-release/local-claude/qle-v2-acceptance.json). Odebrane; nie ponawiano. Właściciel/inne banki/publikacja nadal osobnymi decyzjami. Brak historycznego raportu solo pozostaje 33.

Start APP w tej sesji: `ea9e5d924a51f763dee64bd68777cd6782b2fb5f`, czysty status APP. Zmiany 07: App.tsx, app.config.js, runtime EnvironmentGate/identity/guard i trzy testy, scripts/qa/probeEnvironmentGuardIos.mjs, sekcja SEC-03, kanoniczny plan i ten stan. Wszystko pozostaje niecommitowane; brak push. Nie objęto cudzych zmian, nie modyfikowano BACKEND/CONTENT/WEB ani pinów. Bez celu, automatyzacji, nowego czatu, maili, zakupów, zmian usług zewnętrznych i publikacji. Jeden istniejący iPhone17; bez reset/reinstall/newGuest, Android sekwencyjnie według etapu.

# Patternly — bieżący stan

14.10.2026 — **07 / SEC-03 isolation: CODE/local iOS PASS**. [Odbiór i granice](../docs/specs/engineering/security-privacy.md#odbiór-pozostałego-07--niepuste-dane), [jedyny plan](../../docs/PATTERNLY-WORKING-PLAN.md). Main jedyny writer; niezależny design/QA **gpt-6-luna high: PASS WITH GAPS** dla izolacji, z osobnym recovery UX residualem. Ocena dopasowanie/prostota/ryzyko/utrzymywalność .92/.88/.84/.89, min .84. Produkcyjny kod i piny bez zmian; 1070 skopiowanych plików src oraz 10 hashy przygotowania zgodne z root. Bazowy Git `2b9ad73f`; zwykły commit/push tylko odebranego własnego pakietu na istniejącej zgodzie.

## Decyzja i rzeczywisty wynik

PO wybrał izolację danych konta/nauki/cache środowiska; anonimowe metadata SDK osobno po klasyfikacji. Poprzednie 13 profili/438 kluczy oraz HTTP/heartbeat pozostają odebrane. Odpowiedź **„Wyrażam zgodę”** autoryzowała exact jednorazowy wyjątek: bundle `com.lkurczab.patternly.sec03`, ten sam iPhone17, pusty marker/Gość, jedno lokalne konto/recovery/pakiet i RC Test Store configure/getCustomerInfo bez zakupu. Nie generalizować na reset/uninstall oryginalnego A, nowe konta/urządzenia/config usług/maile/publikację.

Test A: unassigned/root+5 owners false → assign once/readback ready → cold restart. Normalny smoke signup utworzył jedno konto Auth Emulator/backend gen1. Pakiet przez canonical installer: gzip448/artifact954 bajty, SHA cab88ae6…, 2 pliki/1 pointer/orphan0. RC przez actual adapter: configure/customerInfo success, SDK ID zgadza się z backend UUID (hash only), 11 plików/2 device-cache/identity present. Realny recovery coordinator po valid restore i empty-vault preflight: result_available/10 kodów/savedIntent=false; przerwano po persist wyniku, przed ACK. Bez fake records, retry lub ACK.

**Cold A→B→A:** B exact fp/config, mismatch, root i 5 owners false, native RC isConfigured=false. Wszystkie 15 wybranych plików (2 MMKV,2 pakietu,11 RC) oraz RC identity identyczne po B, powrotnym overinstall przed startem i po A. Powrotne A: exact fp/config/ready/root true; auth DTO/UID/backend/gen1/vault operation/status/hash/count i package inventory zgodne. Storage census kompletny: 2 profile/7 kluczy; registry/checksum/profile/global/physical oraz osobny `secureControl` (manifesty/obecność kluczy) bez zmian.

Profile:null jest oczekiwane dla unsaved issue (blocksProfilePreparation). Nie ACK-ować, by wymusić readiness. Aggregate hash odrębnego `control` (registry/binding/journal/logout) zmienił się w źródłowo przypisanym proof-binding lifecycle; brak before per-slot receipt, bez claimu control byte-equality. Oryginalne 3 MMKV/preferences i retained A artifact niezmienione. Aktualny original container UUID `47679AF5…` odczytany przez simctl; stary baseline UUID jest historyczny. Obie aplikacje zamknięte; test A retained/native config/signature PASS, Face ID purpose absent.

## Dowody, narzędzia i bezpieczny stan

Private run `/private/tmp/patternly-sec03-isolated-YtnYlk/attempt-2` (700; env/receipts600). Dokładna lista w spec: source/artifact receipts, first-inspect/assigned, package/RC/recovery, state i inventory A-before/after, B-blocked, cztery closed-storage snapshots, original-preserved-final, focused-tests.tap. Eksport emulatorów zachowany prywatnie: 1 Auth user/Firestore, metadata i 6 plików zweryfikowane (700/600). CLI zgłosiło Export complete, potem exit2 przy post-export update-check permission; bez ponowienia eksportu lub zmian systemowego config. `.local/admin` nie importowano/resetowano.

Własne Metro/API/emulatory zatrzymane; brak listenerów8081/8080/19099/18081. Jedyny istniejący iPhone17 nadal booted. Test A pozostaje installed/closed z vault przed ACK. DerivedData zawiera test B; do powrotu używać zweryfikowanego retained A, nie produktu cache.

Własny pakiet: `prepareSec03AccountStateIos.mjs` +test (package/revenuecat/recovery/observe/status), `inspectSec03SimulatorStorage.py`, exact dependency-prefix correction `probeEnvironmentGuardIos.mjs` +test, spec/stan/kanoniczny plan. **21/21 focused PASS,0SKIP**, Python AST/unsafe-root rejection, actual captures/SDK/source/signature checks oraz diff check PASS. Niezależne QA porównało actual receipts i źródłowy guard. Bez raw IDs/tokens/kodów/payloads w Git. Pending timeout/failure pozostaje obserwowalny; nie ponawiać efektów bez rozstrzygnięcia.

Nie powtarzano niezmienionych TS/full suit/prebuild. Wcześniejszy `recovery:check`/qa:static failure `terminalWireFixture.ts:2`/journalTestSupport nadal nieodebrany. Brak hosted CI/full repo/service/release PASS.

## Pozostałe granice i następny krok

[Recovery UI residual](../docs/specs/engineering/security-privacy.md#otwarta-usterka-recovery-ui): signup początkowo providerUnavailable przy realnym koncie, cold restore działa. Settings→Recovery/password re-auth: generation:null, `/me authorization_generation_required`, vault absent. Brak exact command-stage evidence; nie deklarować błędu server POST. Pozostaje w istniejącym AUD-08 B2/B4/prompt14, z bootstrap coordination10. Realny coordinator/storage07 PASS nie odbiera tego UX; bez produkcyjnej poprawki poza07.

[08 code/local](../docs/specs/engineering/security-privacy.md#przyjęty-kontrakt-i-dowód-08) nadal PASS. Opcje/hashe nie dowodzą transferu ani globalnego no-read/no-send. Provider/App Check/R04, physical Keychain/backup/restore/transfer/R05 i Android54 osobno. Pakiet fixture nie jest published transport.

**Następny dopuszczalny prompt:09. Nieuruchomiony.** Cel07 osiągnięty w uzgodnionych isolation AC. Bez nowych wątków/automatyzacji lub kontynuacji kolejnego promptu.

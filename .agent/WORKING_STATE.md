# Patternly — bieżący stan

14.10.2026 — **PASS kodu prompt10 i wąskiego lokalnego iOS smoke**; niezależne QA Luna High **PASS WITH ISSUES** ze względu na potwierdzone błędy baseline. [Dowód10](/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/docs/reports/auth-bootstrap10-2026-10-14.md), [jedyny plan](/Users/lukaszkurczab/Desktop/Projects/Patternly/docs/PATTERNLY-WORKING-PLAN.md). To odbiór wycinka AUTH-PROFILE-01/M04, nie pełnego CI/usług/wydania. Następny dopuszczalny prompt **11**, nieuruchomiony.

## Bieżąca architektura

Jeden `src/application/bootstrap/accountBootstrap.ts` prowadzi admission restore/login, przygotowanie profilu, completion handoffu i reconciliation. Provider przekazuje stan/komendy; `finalizeCurrent` pozostaje wspólną komendą również innych operacji konta. Oba `/me`, UID/generation/lease, recovery, odmowy i localOffline zachowane. Deduplikacja obejmuje drain/przygotowanie/completion; stale guard nie czyści nowszej próby. QA wykryło i odebrało zamknięcie aktywnego konta przed świeżym odczytem/drainem revoke, tylko w pierwszym admission, bez zamknięcia profilu przez join. Journal/parser i inne komendy konta bez przebudowy.

## Dowody i ograniczenia

Baseline10 APP `593f79d1`, czysty checkout; QLE zakończone według kanonicznego handoffu w planie, bez kolizji. Brak historycznego audytu08.10 nie otwiera odebranych prac. Design review Luna High min0,82; writer Luna High admission/testy, główny writer ekstrakcja po handoffie; niezależny reviewer Luna High. Jeden writer na obszar.

Końcowy owner9/9 i niezależny zakres107/107 PASS, typecheck/diff-check/content boundary/privacy boundary PASS. Account+bootstrap356/359; te same3 `accountLocalReset` błędy `account_data_record_invalid` odtworzone na dokładnym git archive593f79d1 z tymi samymi zależnościami (6/9). `recovery:check` FAILED na istniejącym test-support import `terminalWireFixture.ts`. Nie deklarować pełnego npm test, qa:static ani hosted CI PASS; nie zmieniano pinów.

Native10: istniejący iPhone17/iOS26.4, SEC03-A0.1.0(1), nowy JS; cold offline i publiczny retrySessionRestore → Home/localOffline/recoveryidle PASS. Wszystkie6kategorii obu profili/global/secure, registry, learning i sync zgodne z baseline; hash kontroli zmienia istniejący identity-proof barrier. Runtime moduł z3eksportami zainicjalizowany. Testy portów modelują backend; native obejmuje istniejącą wcześniej potwierdzoną tożsamość, nie nowe online logowanie/email/provider-policy. Ostatnia korekta typów portów nie zmienia runtime; dowodu native nie powtarzano dla samych typów. Android nieuruchomiony, po pierwszej premierze iOS.

Prywatne receipts/TAP/Maestro: `/private/tmp/patternly-bootstrap10/`, indeks w dowodzie10. Po smoke SEC03 i własne Metro zatrzymane; żadnych backendowych usług nie uruchamiano ani zmieniano. Bez reset/reinstall/newGuest/nowych kont, SMTP/publikacji/wydatków. Canonical plan usunął wyłącznie odebrany10; brak nowego backlogu/celu/wątku/automatyzacji.

## Zachowane wyniki i następny krok

09 pozostaje **PASS kod/lokalny iOS**, konto odblokowane i praktyka offline/restart/reconnect+sync odebrane: [dowód09](/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/docs/reports/auth-offline09-ios-2026-10-14.md). Retained export `/private/tmp/patternly-offline09-unblock-UvbZV3/emulator-export-after-approved-ack` i `.local/admin` nietknięte. Właściciel zatwierdził private save600+ACK; aktualne10kodów w ignorowanym `.temp/owner-recovery/offline09-local-account-replacement-codes.json`, nie oczekiwać ponownej zgody dla wykonanego ACK. Nie logować sekretów. 09 dowodzi canonical sync retry po reconnect, nie automatycznego NetInfo edge ani release/provider attestation.

07/08 granice pozostają w [security-privacy](/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/docs/specs/engineering/security-privacy.md). **Settings/password re-auth gen:null residual14 pozostaje**; bootstrap10 nie deklaruje jego naprawy. Następna sesja: wyłącznie prompt11 / SEC-04 według planu, bez automatycznego startu. Odbiór kodu, lokalny, usług i wydania są odrębne.

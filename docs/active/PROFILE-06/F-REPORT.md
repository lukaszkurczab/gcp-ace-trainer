# PROFILE-06/F — usunięcie izolowanego konta

Status: **done / niezależny qa-gate PASS WITH ISSUES**. Bez wdrożenia i bez danych produkcyjnych.

## Zakres i ocena

Pełna produkcyjna ścieżka iOS: świeże konto hasłowe, reautoryzacja, hold-to-delete, zdalne usunięcie, lokalne wylogowanie i niezależna kontrola Auth/Firestore. Jeden istniejący iPhone 17, lokalne emulatory i API; bez nowego urządzenia i bez globalnego czyszczenia emulatora.

Ocena przed korektą: dopasowanie 0,95; prostota 0,87; ryzyko 0,82; utrzymywalność 0,90; minimum 0,82. Niezależny briefing Luna High: APPROVE, minimum 0,82, pod warunkiem atomowego reauth → exchange → guard → grant i fail-closed.

## Wykryta przyczyna i korekta

Pierwsza realna próba zatrzymała się prawidłowo na `pendingSyncRequiresNetwork`; backend otrzymał dwa żądania 401. Reautoryzacja hasłem zastępowała przypięty token sesji zwykłym tokenem Firebase bez `authorizationGeneration`, po czym preflight synchronizacji deletion nie miał uprawnień.

`prepareDeletion` przywraca teraz sesję przez istniejące `ensureAccountSessionGeneration` po reautoryzacji, ale przed wydaniem jednorazowego grantu. UID, generacja koordynatora i aktywność grantu są ponownie sprawdzane po krokach asynchronicznych. Błąd exchange albo zmiana sesji nie wydaje grantu i nie rozpoczyna deletion. Nie dodano drugiej implementacji wymiany sesji.

## Dowód

- Lokalny backend: exchange 200, sync GET/POST 200, deletion POST 200 oraz odczyt statusu 200.
- Podpisany pre-snapshot wiązał exact Auth UID, account ID, dozwolone roots i baseline operation/proof. Asercja po UI wymagała dokładnie jednej nowej operacji oraz dokładnie jednego powiązanego proof i przeszła (`asserted: true`).
- Cleanup uruchomiono dopiero po asercji; usunął wyłącznie exact izolowany fixture (`cleaned: true`).
- Terminalny flow Maestro na istniejącym iPhonie 17: 3/3 PASS — widoczny jawny stan `account-remote-revoke-pending`, brak Home, zapisany bezpieczny screenshot.
- [Screenshot terminalny](evidence/selected/profile06-f-account-deleted-terminal.png) i [manifest](evidence/selected/profile06-f-account-deleted-terminal.manifest.json) nie zawierają danych logowania.
- Surowe nieśledzone logi Maestro zawierające testowe dane uwierzytelniające zostały usunięte po zachowaniu wybranego bezpiecznego dowodu i nie należą do repozytorium.

## Weryfikacja

- App targeted: `accountCommandGuards` + `accountSessionExchange` — 29/29 PASS w przebiegu implementacyjnym.
- `git diff --check` aplikacji: PASS.
- Pełny `npm run typecheck` aplikacji: FAIL na 20 istniejących błędach równoległego rozszerzania locale z `en|pl` do siedmiu języków; żaden błąd nie wskazuje zmienionych tu guardów ani exchange.
- Backend fixture: 10/10 PASS; lint, typecheck i diff check PASS. Testy negatywne i pozytywne obejmują podpis, zmianę manifestu, zero/wiele delt, niespójny proof i exact cleanup.
- Niezależny qa-gate: app account/session/Firebase 92/92 PASS, backend powyżej PASS, końcowy werdykt **PASS WITH ISSUES**.

## Ograniczenia i następny krok

Stan terminalny jawnie informuje o oczekującym server session revocation. Nie jest to pozorny sukces: Auth i dane konta zostały niezależnie potwierdzone jako usunięte, a Home jest niedostępny. Pochodzenie pozostałego markera revoke nie zostało w tym slice osobno rozstrzygnięte i pozostaje nieblokującym issue do ścieżki session/revoke. Produkcyjni providerzy i wdrożenie nie należą do lokalnego PROFILE-06/F.

PROFILE-06/E pozostaje zablokowane na decyzji PO o uczciwym UX częściowego odzyskania. Po przyjęciu F PROFILE-06 pozostaje `partial`, a wykonanie przechodzi do następnego niezależnego zadania planu.

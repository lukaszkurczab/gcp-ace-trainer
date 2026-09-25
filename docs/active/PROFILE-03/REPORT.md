# PROFILE-03 — raport

## Status

**DONE / niezależne QA PASS WITH ISSUES.** Implementacja i końcowy dowód Maestro po zmianie trwałego cleanupu są domknięte lokalnie. Bez wdrożenia.

Ocena przed zmianą po poprawionym niezależnym briefingu: zgodność 0,92; prostota 0,84; kontrola ryzyka 0,81; utrzymywalność 0,87; minimum 0,81 — APPROVE.

## Zmiana

- Backendowe `POST /v1/account/session/revoke` po trwałym revoke wydaje świeży custom token dla dokładnie jednego Firebase subjectu i tej samej generacji autoryzacji. Replay zakończonej operacji ponawia wyłącznie wydanie tokenu.
- Dokument operacji nie zawiera subjectu ani custom tokenu. Błąd mintu po revoke pozostawia operację jako `revoked`, dzięki czemu retry nie powtarza provider revoke.
- Klient waliduje dokładny `operationId`, niepusty token, ten sam UID, niezmieniony claim generacji i aktualność tokenu komendy po każdym await.
- Dopiero po tej walidacji zmienia dokładną parę pending w trwały receipt `completed` jedynego kanonicznego formatu v2. Format v1 jest odrzucany fail-closed zamiast migrowany; niejednoznaczny read-back pozostawia jednoznacznie pending albo exact completed, a kolejna zweryfikowana komenda usuwa stare receipts.
- Exact receipt usuwa scoped `ACCOUNT_SIGN_OUT` przed otwarciem profilu. Nieudany cleanup zamyka profil; udany sprawia, że kolejne wylogowanie dostaje nowe `operationId` zamiast replayu starego revoke.
- Lokalny logout nadal nie czeka na sieć, nie kasuje danych konta i nie wykonuje zdalnego wywołania.

## Weryfikacja

- Backend: pełny suite emulatorowy 234/234, typecheck, OpenAPI 58 operacji i `openapi:check` — PASS.
- Aplikacja: końcowy pakiet celowany tombstone/resume/startup/providera 90/90, wcześniejszy szerszy pakiet 121/121, typecheck i diff check — PASS.
- Pełny suite aplikacji: 1275/1280. Pięć znanych, niezależnych błędów pozostaje bez zmian: stara asercja tekstu retry-limit, liczba shelli 35→36, historyczny content-release SHA oraz dwa brakujące `PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA`.
- Test backendu pokrywa przerwanie po trwałym revoke i przed mintem: retry wydaje token bez drugiego revoke; zapis operacji nie zawiera tokenu ani subjectu.
- Testy aplikacji pokrywają zmianę generacji, zmianę komendy w trakcie await oraz usunięcie wyłącznie dokładnej pary UID/operation. Izolacja innego UID oraz fizycznych namespace’ów pozostaje pokryta przez PROFILE-02/C.

## Dowód iPhone 17

Istniejący iPhone 17 `7F315654-3175-4F3C-BB24-B0263F59360C`, bez `clearState`, reinstalacji i drugiego urządzenia:

1. Utworzono izolowane konto przez lokalny Auth/Firestore fixture; zachowany Gość nie został usunięty.
2. Przed każdym wysłaniem formularza hierarchy potwierdziło pełny email i hasło; prywatne zrzuty zostały obejrzane i nie trafiły do repozytorium.
3. Logout zamknął Home i pokazał `account-remote-revoke-pending`.
4. `stopApp`/`launchApp` zachował login + pending i nadal nie udostępnił Home.
5. Ponowne logowanie tego samego konta usunęło pending dopiero po zdalnym revoke i przywróciło Home z zachowanym trackiem `Coding Interview`.

Końcowy retest jedynego kanonicznego receipt v2/scoped cleanup został wykonany na świeżym izolowanym koncie utworzonym po zakończeniu pełnych testów emulatora. Przed submitami hierarchy porównało pełny email i hasło z fixture bez wypisywania wartości, a prywatne zrzuty zostały obejrzane. Po logout aplikacja pokazała `account-remote-revoke-pending` i nie udostępniała Home; natywny restart zachował pending. Logowanie tego samego konta rozliczyło revoke, usunęło oba stany pending i przywróciło Home z `Coding Interview`. Kolejny `stopApp`/`launchApp` ponownie pokazał Home i ten sam track, bez `account-remote-revoke-pending` oraz `account-sign-out-pending` — PASS.

Pierwsza próba końcowego retestu dała fałszywy negatyw `account-sign-out-pending`, ponieważ proces API uruchomiono o 12:26, a bieżące pliki backendu PROFILE-03 zmodyfikowano o 21:37. Po zatrzymaniu starego procesu i uruchomieniu aktualnego backendu z Auth `19099`, Firestore `18081` oraz `/ready` z trzema kontrolami `true` ten sam scenariusz przeszedł. Nie była to usterka implementacji.

Pierwszy prywatny flow użył omyłkowo obcego bundle ID `com.patternly.app`; log LaunchServices potwierdził brak takiej aplikacji. Właściwa, istniejąca instalacja `com.lkurczab.patternly` i jej dane pozostały nienaruszone. Restartowano wyłącznie ten sam symulator.

## Ograniczenia

- Brak wdrożenia i produkcyjnego provider E2E.
- Systemowy prompt Keychain oraz opcjonalny dev warning overlay nie należą do aplikacji; zostały obejrzane i zamknięte bez czyszczenia stanu.
- Dowody urządzeniowe pozostają prywatne w `/tmp`; repozytorium nie zawiera danych logowania, screenshotów ani logów formularza.
- Pełny suite aplikacji nadal ma pięć wcześniej sklasyfikowanych, niezależnych błędów; nie wykonano produkcyjnego provider E2E ani osobnego urządzeniowego scenariusza outbox/journal. Niezależne QA uznało je za nieblokujące dla zakresu PROFILE-03.

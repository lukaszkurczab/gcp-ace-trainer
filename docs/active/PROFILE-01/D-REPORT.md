# PROFILE-01/D — wylogowanie lokalne offline

**Data:** 24.09.2026
**Status:** `done` dla lokalnej blokady i jawnego pending revoke. Wykonanie zdalnego revoke oraz wznowienie sync/outbox pozostają w `PROFILE-03`.
**Niezależne QA:** `gpt-6-luna/high`, **PASS WITH GAPS** po poprawce kolejki Auth. Luki są opisane poniżej.

## Przyczyna i zmiana

Poprzednie wylogowanie najpierw synchronizowało dane, żądało zdalnego unieważnienia sesji i usuwało lokalną przestrzeń konta. Brak sieci mógł odmówić wylogowania, a dane konta były narażone na niepotrzebne czyszczenie. Nowa ścieżka zapisuje w SecureStore trwałą parę `UID/operationId` i status oczekującego revoke, sprawdza odczyt po zapisie, blokuje UI oraz scope, a następnie wykonuje lokalny Firebase sign-out bez żądania sieciowego. Dane konta, sesje nauki i outbox pozostają w przestrzeni konta.

Przy starcie bramka czyta kontrolny zapis przed przygotowaniem profilu. Ten sam UID z aktywną blokadą trafia do `signOutPending`; inny UID nie odziedzicza jego danych. Po potwierdzonym braku Auth blokada znika, lecz pending revoke pozostaje widoczne. Gdy zapis kontrolny przerwano po utworzeniu scoped `ACCOUNT_SIGN_OUT`, aplikacja sprawdza ten marker dopiero po zgodnym Auth i backendowym ID konta, odtwarza tę samą operację i nie uruchamia preferencji ani bootstrapu treści przed rozstrzygnięciem. Aktywacja account scope odracza powiadomienie odbiorców storage do końca tej kontroli.

Wylogowanie oraz obsługiwane przez aplikację logowanie/rejestracja email, Apple i Google korzystają ze wspólnej kolejki Auth. Zapobiega to wylogowaniu konta B przez niedokończoną operację konta A. Dawne funkcje `prepareAccountSignOut`, `completeRemoteRevokedSignOut` i nieużywane czyszczenie danych przy logout zostały usunięte; operacja usunięcia konta pozostaje odrębna. Ekran logowania pokazuje ostrzeżenie, że lokalne wylogowanie jest zakończone, a sesja serwera nadal oczekuje na unieważnienie.

## Weryfikacja

- Na początku pracy: istniejący iPhone 17, Maestro, Metro, lokalny Auth, Firestore i API `/ready` były dostępne. Gdy API przestało odpowiadać w trakcie pracy, zostało przywrócone z konfiguracją istniejących emulatorów.
- [Dowód Maestro](evidence/D/README.md): lokalne wylogowanie przy zatrzymanym API, ostrzeżenie pending na ekranie logowania i po zwykłym restarcie; po ponownym wyborze Gościa Home działało, także po kolejnym restarcie. Nie czyszczono stanu aplikacji ani symulatora.
- Testy sterowania logout, restartu, błędów zapisu, zgodności UID/operationId, kolejności przygotowania profilu, blokady odbiorców storage oraz wyścigu A→B: celowane przebiegi workerów i QA **PASS** (QA: 71/71; końcowe testy koordynacji/MMKV: 37/37; Settings: 22/22). `npm run typecheck`, `validate:content-boundary`, `validate:runtime-privacy-boundary` i `git diff --check`: **PASS**.
- Pełny `npm test` po zmianach: **1174/1178 PASS**. Cztery niepowodzenia odtwarzają wcześniejszy stan: launch readiness, dowód `ODK-E2E-041` i dwa testy `accountLocalReset` z `account_sync_state_invalid`. Ostatnia korekta zamieniła surowe porównanie tekstu wyjątku Gościa na typowany `ProfileStorageError`; jej 37 testów celowanych, typecheck i privacy boundary przeszły po pełnym przebiegu.

## Granica dowodu i ryzyka

Zdalne `/v1/account/session/revoke` nie jest wysyłane podczas lokalnego logout. Bezpieczne wznowienie tej operacji po ponownym Auth tego samego UID oraz wznowienie danych konta należy do `PROFILE-03`; `pending` nie jest zdalnym sukcesem. Jeśli jednocześnie zawiodą wszystkie trwałe zapisy zamiaru wylogowania i lokalny Firebase sign-out, żaden stan po restarcie nie może odtworzyć niewpisanego zamiaru. Bieżąca sesja jest wtedy zamknięta z jawnym błędem; tej skrajnej awarii nie oznaczamy jako gwarancji po restarcie.

Niezależne QA potwierdziło kolejność i serializację dla komend Auth aplikacji. Wywołania Auth spoza tej kolejki, w tym zewnętrzny konsument SDK, nie są objęte testem A→B. Pierwsze urządzeniowe kliknięcie powrotu do Gościa pozostało na loginie bez widocznego błędu; powtórzenie i restart zakończyły się poprawnym Home. Widoczny stan Gościa jest zachowany, ale ten przebieg nie porównuje wszystkich danych binarnie. Weryfikację pełnej izolacji i adopcji obejmują `PROFILE-02/04/06`.

**Ocena przed implementacją po korekcie podejścia:** zgodność/architektura 0,90; prostota 0,88; ryzyko 0,88; utrzymywalność 0,90; minimum **0,88**. Odrzucone pierwsze podejście miało minimum 0,63, bo nie rozstrzygało odtworzenia Auth tego samego UID; niezależna walidacja Luna High zaakceptowała dopiero trwały marker i blokadę startu.

# PROFILE-01 — kontrakt startu i dostępu do profilu

**Status:** kontrakt ustalony 24.09.2026; implementacja i odbiór `PROFILE-01` pozostają otwarte.
**Decyzja:** techniczny kontrakt Codex na podstawie §6.1 głównego planu; nie jest wynikiem testu urządzeniowego.

## Cel i potwierdzony stan

Po restarcie aplikacja ma odczytać dane konta tylko przy zgodnym Firebase Auth UID, zachować postęp gościa, odróżnić pierwsze uruchomienie od powrotu po wylogowaniu i pozwolić lokalnie wylogować się offline bez udawania zdalnego unieważnienia.

Stan wejściowy przed `PROFILE-01/B–D`: `App.tsx` montował `AppPreferencesProvider` → `ContentPreparationGate` → `PatternlyAccountProvider`. Preferencje inicjalizowały `mmkvClient`, który od razu wiązał zapisany `selectedProfileId` z aktywnym storage. Content bootstrap mógł czytać repozytoria i wznowić sesję nauki przed odtworzeniem Auth. Samo przekierowanie na ekran logowania ani zmiana kolejności dwóch providerów nie zabezpieczały odczytu profilu. Dawny `prepareAccountSignOut` synchronizował outbox, wywoływał `/v1/account/session/revoke` i usuwał lokalne dane; offline mógł odmówić wylogowania. Backend wymaga uwierzytelnienia, przyjmuje trwały `operationId` i może zwrócić `503 session_revocation_pending`.

## Kanoniczny kontrakt

1. Rejestr `profileStorageRouter` pozostaje jedynym źródłem profili, ich ID i wybranego scope. Osobny trwały znacznik startu przechowuje tylko: zakończenie pierwszego wyboru, lokalną blokadę po logout, powiązanie wybranego scope z Firebase UID potrzebne do kontroli dostępu oraz oczekującą operację zdalnego revoke (`UID`, `operationId`, status). Nie przechowuje tokenu ani hasła.
2. Start otwiera wyłącznie zaszyfrowaną bazę i metadane kontrolne. W starej instalacji obecny router może odczytać pojedynczy `GUEST_INSTALLATION` z dawnej przestrzeni jako konieczny marker migracji; nie odczytuje wtedy ustawień, postępu, sesji ani outboxa. Nie udostępnia profilu ani nie montuje preferencji, repozytoriów, content bootstrap lub lifecycle przed decyzją dostępu. Odtworzenie Firebase Auth i kontrola trwałej blokady następują przed aktywacją scope.
3. Pierwsza instalacja bez wcześniejszego wyboru prowadzi do welcome. Po jawnym logout, także po restarcie, prowadzi do loginu. Brak lub uszkodzenie znacznika przy istniejących danych nie jest dowodem świeżej instalacji; wymaga bezpiecznego stanu login/odzyskiwania bez otwarcia danych konta.
4. Guest może otworzyć tylko zachowany scope guest po jawnym wyborze albo ważnym zapisanym dostępie gościa. `PROFILE-01/B` dodaje minimalną operację ponownego wyboru istniejącego guest ID w rejestrze; obecne `selectGuest()` zawsze tworzy nowy profil i nie spełnia tego kontraktu. Szersze uporządkowanie wielu gości pozostaje w `PROFILE-02`. Konto może otworzyć wyłącznie scope powiązany z odtworzonym UID i potwierdzonym backendowym account ID. UID obcego konta, brak Auth, timeout lub błąd nie aktywują poprzedniego profilu konta.
5. Logout najpierw trwale zapisuje lokalną blokadę i zamyka dostęp do profilu oraz UI, zachowując dane konta, sesje nauki i outbox. Niepowodzenie sieciowe nie cofa lokalnej blokady. Firebase sign-out usuwa lokalne poświadczenie; jego błąd jest jawny i nie otwiera profilu. Zdalne revoke ma odrębny status oczekiwania i nie jest oznaczane jako sukces offline.
6. Oczekujące revoke może użyć tego samego `operationId` dopiero po ponownym Auth dokładnie tego samego UID. `operationId` jest dziś w scope konta: przed trwałym zamknięciem tego scope trzeba atomowo utrwalić powiązanie UID/operationId w niescoped znaczniku, sprawdzić zapis i dopiero odciąć dostęp. Przerwanie między tymi krokami nie może zgubić ani zdublować operacji. Inne konto nie wysyła starej operacji. Szczegółowe wznowienie sync/outbox oraz zdalnej operacji należy do `PROFILE-03`; `PROFILE-01` musi zostawić stan bezpieczny i jawnie oczekujący.

## Kolejność wykonania i dowód

| Slice | Wynik | Kryteria odbioru i weryfikacja |
| --- | --- | --- |
| `PROFILE-01/A` | Ten kontrakt, potwierdzone wejścia i ocena podejścia. | Niezależna walidacja Luna High; brak deklaracji implementacyjnego PASS. |
| `PROFILE-01/B` | Wewnętrzna granica: kontrolne otwarcie storage oddzielone od jawnej aktywacji profilu oraz minimalny ponowny wybór istniejącego guest ID. Dotychczasowy start pozostaje przejściowo aktywny do C. | Testy jednostkowe: prepare nie publikuje scoped client ani nie czyta danych profilu poza koniecznym legacy markerem; aktywacja wymaga istniejącego ID i rodzaju profilu; zachowany guest wraca do tych samych danych bez tworzenia nowego profilu; błąd zapisu/aktywacji pozostawia dostęp zamknięty. B nie jest runtime PASS izolacji. |
| `PROFILE-01/C` | Root startup coordinator, Auth i stan welcome/login/guest/account przed repozytoriami; usunięcie przejściowego eager-start. | Testy przejść, UID mismatch, restartu, błędu Auth i kolejności montowania; po restarcie z wybranym kontem nie ma odczytów scope przed zgodnym UID i tylko właściwy scope uruchamia content bootstrap. |
| `PROFILE-01/D` | Lokalna blokada/logout offline i jawne pending revoke. | Testy przerwania operacji, restartu, błędu Firebase sign-out, identycznego UID/operationId i braku sukcesu zdalnego offline; lokalny przepływ iOS/Maestro bez kasowania zachowanego guest. |

Nie uruchamiać `PROFILE-02` przed odbiorem B–D. `PROFILE-03` nadal odpowiada za zachowanie/wznowienie wszystkich danych konta i outboxa oraz wykonanie pending remote revoke po właściwym Auth.

**Ocena po korekcie:** zgodność/architektura 0,90; prostota 0,82; ryzyko 0,83; utrzymywalność 0,85; minimum **0,82**. Niezależna walidacja: `gpt-6-luna/high`, wyłącznie briefing `Cel / Ustalenia / Podejście`. Warunek walidacji: nie dublować rejestru profili w znaczniku startu.

**Ryzyka do weryfikacji w B–D:** preferencje i bootstrap przed Auth; zachowany `selectedProfileId` po logout; osierocony znacznik po błędzie zapisu; równoległy callback Auth; operacja revoke wymagająca ponownego Auth tego samego UID. Istniejący iPhone 17 z gościem pozostaje nienaruszony do kontrolowanego E2E.

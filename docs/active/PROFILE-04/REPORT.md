# PROFILE-04 — raport

## Status

**DONE / niezależne QA PASS WITH ISSUES.** Implementacja obu trwałych wyborów adopcji, naprawa odzyskania zakończonego profilu gościa i dowody na istniejącym iPhonie 17 są domknięte lokalnie. Bez wdrożenia.

Ocena zatwierdzonego podejścia: zgodność 0,90; prostota 0,84; kontrola ryzyka 0,81; utrzymywalność 0,87; minimum 0,81 — APPROVE.

## Zmiana

- `guestAdoptionChoice` jest wymaganym polem jednego kanonicznego `AccountSyncState`; brak pola albo wartość spoza `transfer|discard` są odrzucane fail-closed.
- Przełączenie na „nie zapisuj danych urządzenia” jest najpierw trwale zapisywane i odczytywane z projekcji providera. UI nie utrzymuje konkurencyjnego lokalnego źródła prawdy.
- Transfer i discard pozostają osobnymi, wznawialnymi operacjami. Discard nie buduje outboxu z danych gościa, zachowuje zatwierdzony plan przy błędzie pobrania i usuwa dane dopiero po przygotowaniu bezpiecznej materializacji konta.
- Po zakończonym transferze dokładnie wybrany modern guest z markerem `account_bound` może zostać awansowany do profilu dokładnie tego samego konta. Inny account ID, konkurencyjny profil albo brak dokładnego markera nie pozwalają na promocję.
- Promocja usuwa dawną klasyfikację guest bez kopiowania namespace'u. Następne jawne wejście jako gość może utworzyć dokładnie jeden nowy, niezależny profil.

## Weryfikacja automatyczna

- Pakiet kontraktu, lifecycle, kompozycji providera, startupu i routera: **134/134 PASS**.
- Pokryte przypadki obejmują: trwały odczyt obu wyborów; udany konfliktowy transfer z jawnym `keep_guest`, jednym potwierdzeniem adopcji i bez dodatkowego `syncProgress`; transfer przerwany offline, który ponawia dokładnie zapisany `operationId`, fingerprint i resolution; discard bez zdalnego zapisu; istniejące dane konta; błąd pobrania i retry; przerwania materializacji; aktywną sesję; konkurencyjne komendy; błędne dane zdalne; zmianę UID; dokładną promocję profilu i utworzenie jednego nowego gościa.
- `git diff --check` — PASS.
- Pełny typecheck jest obecnie blokowany wyłącznie przez równoległy, niezacommitowany zakres ODK-117 rozszerzający locale poza nadal typowane `en|pl`. Cztery diagnostyki pojawiają się w dotkniętym `AccountEntryScreen`, ale dotyczą wyłącznie przekazania poszerzonego przez ODK-117 unionu locale do niezmienionego kontraktu `en|pl`; pozostałe diagnostyki mają ten sam wzorzec w plikach poza PROFILE-04.

## Dowód iPhone 17

Użyto wyłącznie istniejącego iPhone'a 17 `7F315654-3175-4F3C-BB24-B0263F59360C`, bez tworzenia drugiego urządzenia.

### Transfer

1. Gość wybrał Backend System Design oraz zapisał cel i plan.
2. Po utworzeniu nowego konta wybór transferu pozostał zaznaczony po natywnym `stopApp`/`launchApp`.
3. Zatwierdzenie otworzyło Home z tym samym celem i planem; kolejny restart nie przywrócił `account-entry-choice`.
4. Firestore emulator zawierał trzy rekordy postępu, trzy idempotentne mutacje i jedną operację adopcji — bez duplikacji.
5. Po wylogowaniu dokładny profil zakończonej adopcji został odzyskany jako konto, a jawne „Continue without an account” utworzyło jeden nowy profil gościa. Restart zachował jego niezależny stan.

### Odrzucenie danych gościa

1. Świeży gość wybrał Coding Interview i zamknął zaproszenie do celu.
2. Po utworzeniu nowego konta przełącznik „Save to account” ustawiono na wyłączony.
3. Natywny restart ponownie pokazał `account-entry-choice` z `account-keep-progress-toggle checked=false`.
4. „Continue” pokazało jawne potwierdzenie „Remove device data”; zatwierdzenie zakończyło operację i usunęło ekran adopcji.
5. Kolejny natywny restart pokazał `patternly:content:ready` bez `account-entry-choice` — decyzja i jej zakończenie były trwałe.

Prywatne screenshoty Maestro zostały obejrzane, ale nie trafiają do repozytorium, ponieważ powstały w przepływie konta testowego. Systemowy prompt Keychain/AutoFill nie jest elementem Patternly ani kryterium odbioru.

## Ograniczenia

- Brak wdrożenia i produkcyjnego provider E2E; dowody używają lokalnych Auth, Firestore i API.
- Konfliktowy transfer i offline/retry mają bezpośredni dowód produkcyjnej ścieżki w testach `transfer applies an explicit guest conflict resolution once and completes durably` oraz `offline transfer retry reuses the durable confirmation and never uploads a duplicate guest snapshot`. Oba zatwierdzone wybory i restarty mają osobny dowód urządzeniowy; odtwarzalna końcowa część discard znajduje się w `evidence/discard-restart.yaml`.
- Równoległe zmiany ODK-117 nie należą do PROFILE-04 i nie są częścią jego commita.
- Nieblokujący residual QA: klientowy offline→retry używa produkcyjnej ścieżki i trwałego potwierdzenia, ale nie ma osobnego testu integracyjnego backendu dla wariantu „serwer zatwierdził adopcję, a odpowiedź zaginęła”.

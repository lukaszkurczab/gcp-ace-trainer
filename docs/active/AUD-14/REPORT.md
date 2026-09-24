# AUD-14 — czytelność „Twoje dane” przy dużej czcionce

**Status:** `blocking` — brak bezpiecznego wejścia do `YourDataScreen` z zachowanego stanu konta na istniejącym iPhonie 17
**Data:** 23 września 2026
**Repozytorium:** `patternly`

## Stan i dowody

- Pakiet zadania wskazuje ekran `YourDataScreen`, wspólne `InfoBlock` i `ListRow` oraz przejście `large` → `accessibility-large` podczas działania aplikacji.
- Zachowany screenshot `evidence/audit-2026-09-22/screenshots/ios-110-large-font-data-stable.png` pokazuje ucięte pionowo tytuły i opisy w ustawieniach oraz zachodzenie opisu `InfoBlock` na jego tytuł.
- Aktualny kod ma `ListRow.titleNumberOfLines = 2`, stałe line-height typografii i układ wiersza z `alignItems: "center"`; `InfoBlock` układa stałą ikonę obok tekstów o skalowanej czcionce i stałym line-height. To są podejrzane mechanizmy, ale screenshot statyczny nie rozstrzyga, który z nich powoduje awarię po zmianie skali.

## Próba wznowienia 23 września 2026

- Odczyt poza sandboxem potwierdził istniejący iPhone 17 `7F315654-3175-4F3C-BB24-B0263F59360C` jako Booted; zachowano go bez restartu.
- Pierwszy odczyt wykrył działające lokalne API (PID 99400, port 8080), Auth (PID 63238, port 19099) oraz Firestore (PID 63288, port 18081). Żadnej usługi nie uruchamiano ani nie zatrzymywano.
- Kolejny `simctl listapps` zakończył się `CoreSimulatorService connection became invalid`; hostowy odczyt powierzchni UI (`cua.getState`) dwukrotnie kończył się nieoczekiwanym wyjściem procesu z resetem kernela. Nie uzyskano bieżącego ekranu, stanu aplikacji ani ustawienia Dynamic Type.
- Istniejący flow `.maestro/screenshot-capture/05-settings-id-current-ios.yaml` zakłada już działającą nawigację Settings i tylko robi screenshot; nie otwiera bezpiecznie `YourDataScreen` ani nie zmienia skali. Inne dostępne flow powracają do Home lub są testami ścieżek konta/sesji. Nie uruchomiono ich, bo bieżący ekran i właściciel sesji są nieznane.
- Nie zmieniono aplikacji, urządzenia, skali, konta ani danych. Nie wykonano Maestro, ponieważ nie dało się zweryfikować bezpiecznego ekranu startowego.

## Diagnoza narzędzi poza sandboxem — 23 września 2026

- Powtórne `xcrun simctl list devices booted` poza sandboxem działa i pokazuje ten sam iPhone 17 jako Booted. Jeden `simctl listapps` także poza sandboxem zgłosił `CoreSimulatorService connection became invalid`, ale późniejsze listowanie urządzenia i `simctl io ... screenshot` zadziałały. Procesy `CoreSimulatorService` (PID 49114), `simdiskimaged` (49115), `Simulator.app` (54931) i `launchd_sim` dla wskazanego UDID (55293) działały. Nie ustalono, co spowodowało pojedyncze zerwanie połączenia; brak dowodu trwałej awarii usługi lub potrzeby restartu.
- W sandboxie `maestro --version` nie dochodziło do CLI: Java zgłaszała `Operation not permitted` przy próbie `setPosixFilePermissions` na `~/.maestro/deps/applesimutils`, mimo że plik należy do bieżącego użytkownika i ma bit wykonywania. Przyczyną tej konkretnej porażki jest odmowa dostępu sandboxa do cache w katalogu domowym, nie wykazany błąd właściciela/permisji pliku.
- Poza sandboxem `maestro --version` zwraca `2.10.0`; `maestro list-devices` wykrywa iPhone-17/iOS-26.4; `maestro hierarchy` kończy się kodem 0 i rozpoznaje ekran Patternly; `maestro check-syntax .maestro/screenshot-capture/05-settings-id-current-ios.yaml` zwraca `OK`. Dla Maestro potwierdzoną naprawą jest wykonanie poza sandboxem, który blokuje operację na cache. Dla `simctl` należy preferować wykonanie poza sandboxem; pojedynczy przejściowy błąd wystąpił również poza nim, więc jego przyczyna nie jest potwierdzona. Nie zmieniać praw cache ani nie restartować usług bez nowego dowodu.
- Odczyt hierarchii i screenshot bieżącego UI niezależnie potwierdzają ekran `Sign in` z komunikatem „Sign in with the account that owns this saved progress. Your data remains saved on this device.” To wyjaśnia, dlaczego nie można bezpiecznie kontynuować flow wymagającego ekranu Home/Settings. Nie wolno omijać tego przez inną sesję ani reset.
- Nie uruchomiono flow Maestro na urządzeniu: dostępne screenshot-flow zaczyna od tapnięcia Settings i zakłada już główną nawigację. Sam odczyt hierarchii i zrzut ekranu potwierdziły naprawę dostępu narzędziowego, nie odbiór AUD-14.

Blokada dostępu Maestro do cache w sandboxie została rozwiązana operacyjnie przez uruchomienie poza sandboxem, bez zmian uprawnień. Przejściowy błąd `simctl listapps` nie został wyjaśniony; kolejne odczyty potwierdziły działającą usługę. Pozostała blokada jest stanem aplikacji: bieżący ekran sign-in informuje o zapisanym postępie przypisanym do innego właściciela. Nie wprowadzono zmian wspólnych komponentów, bo brak zatwierdzonej, bezpiecznej drogi do `YourDataScreen` i reprodukcji. Wznowić po udostępnieniu właściwej sesji/fixture bez zmiany zachowanego konta ani danych.

## Niezależna ocena podejścia

Briefing-only walidator `gpt-6-luna` / `high` zatwierdził kierunek warunkowy: zgodność `0.95`, prostota `0.89`, akceptowalność ryzyka `0.86`, utrzymywalność `0.90`; minimum `0.86`. Nie inspekcjonował repozytorium. Ryzykiem jest szerszy wpływ zmiany wspólnych komponentów na inne ekrany.

Niezależny QA `gpt-6-luna` / `high`, na podstawie udostępnionych fragmentów raportu i planu: **PASS WITH GAPS**. Potwierdził zgodne rozdzielenie przyczyny Maestro w sandboxie od nieustalonego, przejściowego błędu `simctl`; gapem jest niewykonana reprodukcja na właściwym ekranie. Nie czytał samodzielnie plików ani nie wykonywał poleceń.

## Wymagany retest

Po uzyskaniu bezpiecznej sesji gościa lub innej zatwierdzonej drogi do `YourDataScreen` na tym samym iPhonie 17 odtworzyć cold launch i zmianę `large` → `accessibility-large`; sprawdzić PL/EN, pełne treści, scroll, powrót gestem i początkową skalę. Diagnostyka `simctl`/Maestro powinna być wywoływana poza sandboxem, gdy występuje odmowa dostępu do ich usług/cache. Dopiero po reprodukcji zidentyfikować mechanizm, wdrożyć minimalną poprawkę i zebrać porównywalne screenshoty Maestro. Nie zmieniać konta ani nie resetować danych/urządzenia.

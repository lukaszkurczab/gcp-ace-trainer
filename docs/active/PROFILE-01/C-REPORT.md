# PROFILE-01/C — start aplikacji po wyborze profilu

**Data:** 24.09.2026
**Status:** `done`; lokalna blokada wylogowania i pending revoke pozostają w `PROFILE-01/D`.
**Niezależne QA:** `gpt-6-luna/high`, **PASS** po końcowej kontroli, w tym po usunięciu eager adaptera.

## Przyczyna i zmiana

Dotychczas preferencje i bootstrap repozytoriów uruchamiały storage oraz treść przed rozstrzygnięciem dostępu do profilu. Start przebiega teraz przez przygotowanie zaszyfrowanego rejestru, odtworzenie Auth i wybór właściwego profilu; dopiero potem montuje bootstrap treści. Konto wymaga aktualnego Firebase UID oraz zgodnego ID konta z `/me`. Gość wymaga jawnego wyboru albo ważnych zapisanych znaczników dostępu. Świeża instalacja prowadzi do welcome, a powrót bez Auth do loginu. Stary eager adapter został usunięty; bootstrap repozytoriów wymaga już aktywnego profilu.

Na istniejącym iPhonie 17 znaleziono zgodny, niezwiązany z kontem znacznik Gościa z historycznym `localDatasetId` różnym od ID fizycznego zakresu. Router zachowuje oba identyfikatory i dane bez przepisywania, jeśli znacznik leży w zakresie wybranego Gościa, ma poprawny format, `accountId: null` i stan `guest` lub `adoption_pending`. Zakres odczytu i zapisu nadal wyznacza wyłącznie ID z rejestru. Błąd przejścia do Gościa pozostaje widoczny także po ponownym zamontowaniu ekranu logowania.

Zmiana obejmuje `App.tsx`, `AccountSessionProvider`, bramkę przygotowania profilu, `ContentPreparationGate`, nawigację, preferencje, router/MMKV, bootstrap repozytoriów, teksty błędów oraz powiązane testy. Nie resetowano ani nie usuwano aplikacji lub danych Gościa.

## Weryfikacja

- Przed pracą: lokalne Firebase Auth i Firestore, API `/ready`, Metro, istniejący iPhone 17 oraz Maestro działały i łączyły się.
- Natywny build iOS na tym samym iPhonie 17: **PASS**, bez odinstalowania aplikacji. Maestro potwierdził `patternly:content:ready` i ekran Home dla zachowanego Gościa; po pełnym zamknięciu i ponownym uruchomieniu aplikacji: **PASS**. Materiały Maestro są w `~/.maestro/tests/2026-09-24_145753` i kolejnych przebiegach `PROFILE-01/C preserved guest ready`.
- Test rozbieżnych ID potwierdza zachowanie zapisanych bajtów markera i danych profilu. Celowane testy routera/MMKV/koordynacji: **44/44 PASS**. Testy po usunięciu eager adaptera: **23/23 PASS**. Powiązane testy inventory/startu: **41/41 PASS**. Niezależne QA uruchomiło końcowy zestaw storage/bootstrap: **85/85 PASS**. Test wiązki Metro po aktualizacji fixture: **2/2 PASS**. `npm run typecheck` i `git diff --check`: **PASS**.
- Pełny `npm test` po zmianach: **1149/1153 PASS**, cztery istniejące niepowodzenia poza `PROFILE-01/C`: kontrakt launch readiness, test dowodów `ODK-E2E-041` oraz dwa przypadki `accountLocalReset`. Kontrakt launch readiness i `accountLocalReset` odtwarzają błędy także uruchomione oddzielnie. Trzy wcześniejsze błędy testów powiązanych ze startem usunięto; wszystkie ich kontrole są zielone.

## Granica dowodu i kolejny krok

Test urządzeniowy potwierdza zachowanego Gościa i restart. Sekwencja konta z backendowym `/me`, zmiana UID i odmowa bez Auth mają testy kodu/koordynatora; nie wykonano na tym urządzeniu logowania dwoma kontami. Pełne E2E izolacji profili należy do `PROFILE-06`. `PROFILE-01/D` ma trwale odciąć lokalny dostęp przy wylogowaniu offline i utrwalić oczekujące zdalne revoke.

**Ocena przed zmianami:** zgodność/architektura 0,90; prostota 0,83; ryzyko 0,82; utrzymywalność 0,85; minimum **0,82**. Korekta historycznego ID nie zmienia namespace ani danych, a odmowa markerów związanych z kontem pozostaje jawna.

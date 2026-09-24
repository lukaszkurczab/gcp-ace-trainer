# AUD-13 — raport postępu

**Status:** `blocking` — nieustalona przyczyna i brak bieżącego odbioru urządzeniowego  
**Data:** 2026-09-23

## Stan potwierdzony

Historyczny run A-16 wykazał `LOCAL_OPERATION_FAILED` po piątej odpowiedzi `alg-complexity-amortized-005:each_item_once`; „Restore session” nie wznowiło sesji. Po restarcie aplikacja zgłosiła błąd bootstrapu. Osobny run raportuje nieobsłużony `ForegroundSessionTimerRecoveryError: Periodic foreground timer checkpoint failed.` Szczegóły i historyczne screenshots/logi pozostają w [raporcie audytu](../../../../docs/PATTERNLY-AUDIT-2026-09-22.md#a-16--blokada-odpowiedzi-i-recovery-sesji-p1-aud-13).

## Przegląd bieżącego kodu

- `ForegroundSessionTimerFacade.startPeriodicCheckpoint` przechwytuje błąd callbacku, zapisuje go w `faults` i zatrzymuje timer.
- `requireTimer` odrzuca kolejne operacje dla sesji z takim błędem; dlatego późniejszy `checkpointForResponseSave` może zablokować submit. To możliwy łańcuch przyczynowy, ale historyczny log nie potwierdza, że timer zawiódł przed odpowiedzią nr 5.
- Commit odpowiedzi przechodzi przez `commitTrainingOutcome` → journal/materializer/verifier. Istniejące testy recovery obejmują awarie zapisu/odtworzenia journal, ale nie identyfikują przyczyny tego urządzeniowego przypadku.

## Próba kontynuacji — 23 września

- Lokalny API `127.0.0.1:8080/ready` odpowiada `ready`; listener PID 99400 działał przed próbą. Istniejący iPhone 17 (`7F315654-3175-4F3C-BB24-B0263F59360C`) był już `Booted`. Żaden proces ani urządzenie nie zostały uruchomione ponownie.
- Screenshot kontrolny przez `simctl io screenshot` pokazuje ekran Sign in, nie aktywną sesję Coding ani błąd bootstrapu. Maestro 2.10.0 jest dostępny. Historyczny flow `.maestro/m1-guided-10.yaml` **istnieje** wraz z `.maestro/m1-guided-10.expected-session.json`; uruchamia 10-pytaniową sesję Coding od Home i przechodzi przez dokładną piątą odpowiedź z A-16. Nie uruchomiono go, ponieważ bieżąca aplikacja jest na Sign in/owner mismatch i flow wymaga Home; dojście do Home wymagałoby zmiany konta lub workspace na zachowanym urządzeniu.
- Kontener aplikacji zawiera `Documents/mmkv/patternly-secure-a`; obecny lokalny kod pokazuje także owner mismatch po próbie rozpoczęcia nowego guest workspace. Nie ma potwierdzonej bezpiecznej, odwracalnej ścieżki diagnostycznego eksportu journal/timer z zachowaniem odpowiadającego mu Keychain. Nie wykonano sign-in/guest switch, odczytu/dekodowania/kopii secure storage, żadnego resetu ani instalacji.
- Próba podglądu istnienia logów z ostatnich 2 minut nie zwróciła bieżących zdarzeń `ForegroundSessionTimer`/`LOCAL_OPERATION_FAILED`; nie rozstrzyga to przyczyny historycznego A-16.

### Ponowna kontrola podczas kontynuacji

- `xcrun simctl list devices booted` poza sandboxem potwierdził ten sam iPhone 17 jako `Booted`; lokalne API `127.0.0.1:8080/ready` zwróciło `ready` (database/authentication/providerReader true). Auth `19099` i Firestore `18081` miały istniejące listenery. Nie uruchomiono, nie zrestartowano ani nie zatrzymano żadnej usługi lub urządzenia.
- Odczyt logów ostatnich 10 minut z procesu `Patternly` na tym urządzeniu nie zwrócił pasujących zdarzeń `ForegroundSessionTimer`, `LOCAL_OPERATION_FAILED` ani `journal`. Jest to brak świeżej reprodukcji, nie dowód przyczyny.
- Wcześniejsze stwierdzenie o braku `m1-guided-10.yaml` było błędne; QA niezależnie wskazał ten pominięty, hidden-directory flow. Bezpieczny wybór pozostaje jego nieuruchomienie w obecnym stanie sign-in/owner mismatch, gdyż flow rozpoczyna i zapisuje nową sesję po ekranie Home. Dostępne review flow zmieniają aktywny ekran ukończonej sesji, więc również nie zostały uruchomione. Ponieważ nie zmieniano UI ani kodu aplikacji, Maestro UI verification nie miało zastosowania.
- Nie wykonano odczytu ani eksportu encrypted MMKV/Keychain, przejścia przez sign-in/guest ani instalacji. Dalszy test wymaga dopasowanego fixture właścicielskiego lub bezpiecznej, zatwierdzonej ścieżki eksportu journal i timer state.

AUD-13 pozostaje `blocking`: zachowanej piątej odpowiedzi nie można bezpiecznie odtworzyć ani powiązać z odczytywalną diagnostyką w obecnym stanie urządzenia, mimo że API, Auth, Firestore i istniejący iPhone są dostępne. Wymagane odblokowanie to dostęp do właścicielskiego konta/fixture już przypiętego do tej instalacji albo jawnie zatwierdzona, bezpieczna procedura eksportu diagnostycznego obejmująca journal i stan timeru. W obu przypadkach najpierw zachować dowody; potem odtworzyć granice checkpoint → journal → materialization → projection i bootstrap, a naprawiać dopiero potwierdzoną przyczynę. Nie używać mocka timera jako dowodu błędu na urządzeniu. Po naprawie wymagany pozostaje pełny odbiór 10 odpowiedzi, feedback, summary, read-only review, resume/restart i kontrolowanej awarii zapisu.

Nie zmieniono przyczyny historycznego błędu: log timera pochodzi z osobnego runu, a zachowany log A-16 nie ustala, czy checkpoint zawiódł przed zapisem odpowiedzi piątej. Związek przyczynowy pozostaje niepotwierdzony.

## Kolejka

Kanoniczny root plan został zaktualizowany bezpośrednio. AUD-17 pozostaje zablokowane po trzech briefingach poniżej progu 0,8. AUD-13 pozostaje osobnym blockerem: flow i expected-session fixture istnieją, lecz odpowiadający im owner-bound stan nie jest dostępny na urządzeniu, a bezpieczna diagnostyka nie została ustalona. Bieżące usługi i iPhone są dostępne, ale to nie odtwarza incydentu. Zgodnie z kolejką następnym zadaniem jest AUD-08.

## Briefing / ocena

Briefing dla tej kontynuacji AUD-13: `gpt-6-luna/high`; zgodność **0,86**, prostota **0,91**, ryzyko **0,94**, utrzymywalność **0,85**; minimum **0,85** — zatwierdzono. Walidator oceniał tylko briefing. Niezależny QA raportu: `PASS WITH ISSUES`; ujawnił pominięty przez inventory plik hidden-directory flow `m1-guided-10.yaml` i jego expected-session fixture. Raport skorygowano zgodnie z ustaleniami QA.

## Weryfikacja i QA

Zmiana dotyczy raportu i planu, nie UI ani kodu runtime; nie uruchomiono flow Maestro, które mogłoby zmienić zachowaną sesję. Wykonano wyłącznie odczyt healthcheck, listenerów, listy booted devices i logów. Nie wykonywano testów wymagających zmiany zachowanego stanu. Niezależny QA raportu: `PASS WITH ISSUES`; po korekcie omyłkowego braku flow pozostała uwaga o doprecyzowaniu, że sam fixture istnieje, lecz nie jest dostępny w obecnym stanie urządzenia. Plan i raport poprawiono zgodnie z uwagami.

# AUD-05 — nawigacja i ścieżki niedostępnych trybów

**Status:** `blocking` — potwierdzony no-op poprawiony; pełny runtime odbiór czeka na istniejące środowisko  
**Data:** 23 września 2026  
**Repozytorium:** `patternly`  

## Ukończony zakres

`ExamScreen` jest zarejestrowany w `RootNavigator` i osiągalny z Practice Hub oraz z obsługi konfliktu aktywnej sesji. Jego widoczna akcja „Back” była no-op (`() => undefined`). Zastąpiłem ją istniejącym `goBackOrHome(navigation)`: zachowuje historię stosu, a przy direct entry wraca do Home. Tryb nadal pozostaje jawnie unavailable; nie dodano symulacji ani nowego egzaminu.

Test `src/features/exam/ExamScreen.navigation.test.ts` potwierdza podłączenie widocznej akcji do helpera, brak pustego callbacka i obie gałęzie helpera.

## Przegląd kodu pozostałych runnerów

Zwykłe Coding, Design oraz Certification session screeny zawierają listener `beforeRemove`, który zatrzymuje nawigację i kieruje do właściwego exit confirmation; ich widoczne nagłówki mają jawne akcje. Coding simulation ma akcje wyjścia/abandonment w powierzchni sesji i durable operation states. Source review nie rozstrzyga, czy iOS swipe, Android Back, szybkie wielokrotne tapnięcia, zapis odpowiedzi, timer i relaunch zachowują spójność w runtime.

`noop` przy wyłączonych akcjach „saving”, readonly controlach i skeletonie ma inną rolę; nie usuwano ich bez dowodu, że użytkownik widzi aktywną, bezczynnie wyglądającą akcję. Trasy unavailable exam i simulation pozostają kontrolowanymi błędami z akcją powrotu; bez testu direct entry wszystkich tras nie uznaję kontraktu za zamknięty.

## Niezależna ocena briefingu

Briefing tylko dla potwierdzonej poprawki Exam Back uzyskał: spójność `0.94`, prostota `0.97`, akceptowalność ryzyka `0.91`, utrzymywalność `0.94`; minimum `0.91`, zaakceptowany. Walidator nie przeglądał repozytorium. Zatwierdzenie obejmuje wyłącznie ten mały fix, nie pełny odbiór AUD-05.

## Weryfikacja

- `node --import tsx --test src/features/exam/ExamScreen.navigation.test.ts` — PASS, 1/1.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- Brak runtime reprodukcji: API `http://127.0.0.1:8080/ready` nie odpowiadało, a CoreSimulatorService zwracał niedostępność. Auth/Firestore emulatory na portach 19099/18081 pozostawiono działające. Nie restartowano API, emulatorów, iPhone’a 17 ani aplikacji i nie resetowano danych.

## Warunek odblokowania

Po udostępnieniu istniejącego iPhone 17/symulatora oraz API bez resetu stanu sprawdzić iOS button/swipe dla trzech runnerów; Android Back; exit cancel i leave/resume z zapisaną odpowiedzią i timerem; finish/result bez duplikatów; szybkie powtórne tapnięcia; direct entry oraz powrót z tras Exam i Simulation unavailable. Zebrać log i screenshot przed/po. Do tego czasu ryzyko native `beforeRemove` i zgodności gestów pozostaje hipotezą, nie potwierdzonym defektem.

## Ocena wąskiego fixu

Zgodność/architektura `0.94`, prostota `0.97`, akceptowalność ryzyka `0.91`, utrzymywalność `0.94`; minimum `0.91`. Naprawa korzysta z istniejącego wspólnego helpera. Bloker dotyczy niezmienionych runtime acceptance steps całego AUD-05, nie tej poprawki.

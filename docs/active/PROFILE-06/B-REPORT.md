# PROFILE-06/B — świeży Gość i restart

Status: **done / niezależny qa-gate PASS WITH ISSUES**. Lokalnie, bez wdrożenia.

## Zakres i podejście

Na jedynym uruchomionym iPhonie 17 wykonano dozwolony jednorazowy `clearState` na początku nowej macierzy. Produkcyjny flow utworzył jednego Gościa, wybrał Coding Interview, zapisał domyślny cel i zaakceptował plan. Następnie wykonał `stopApp` oraz `launchApp` bez czyszczenia stanu.

Ocena podejścia: dopasowanie 0,94; prostota 0,86; ryzyko 0,83; utrzymywalność 0,88; minimum 0,83.

## Dowód runtime

- Preflight: lokalne API, Auth emulator, Firestore, Metro i istniejący iPhone 17 — PASS.
- Maestro: 41 poleceń; 38 wykonanych poprawnie, trzy warunkowe zamknięcia debug overlay pominięte, bo overlay nie był widoczny.
- Przed restartem plan pokazywał Coding Interview oraz poniedziałek/środę/sobotę o 18:00, po 10 pytań.
- Home przed restartem pokazywał `Open-ended` i `Continue plan`.
- Po natywnym restarcie Home nadal pokazywał ten sam track i plan; nie pojawiły się Account Entry ani onboarding celu.
- [Plan przed restartem](evidence/selected/profile06-b-plan-before-restart.png), [Home po restarcie](evidence/selected/profile06-b-home-after-restart.png), [manifest](evidence/selected/profile06-b.manifest.json).

Manifest jawnie zapisuje, że runtime powstał z dirty worktree, oraz wiąże bazowy commit, hash całego patcha `src`, commit flow i SHA-256 screenshotów. Prywatne logi Maestro pozostały w `/tmp`; nie są dowodem repozytoryjnym i zawierają emulatorowe adresy testowe.

## Weryfikacja i QA

- Targeted repozytoria celu/planu/onboardingu/startupu: 35/35 PASS według niezależnego QA.
- Dodatkowy szerszy przebieg kontrolera: 55/56 PASS. Jedyny błąd to statyczny test `accountGoalJourneyE2E` oczekujący starej nazwy przypadku źródłowego; nie dotyczy runtime B i nie jest raportowany jako PASS.
- `git diff --check`: PASS.
- Niezależny qa-gate: **PASS WITH ISSUES**.

Issue nieblokujące: brak osobnej inspekcji hierarchy dostępności; odbiór opiera się na rzeczywistym flow, logu poleceń, pełnoekranowych screenshotach, kodzie konsumentów i targeted tests.

## Wynik

PROFILE-06/B jest zakończone. Jeden kanoniczny Gość zachowuje wybrany track, cel i plan przez natywny restart bez ponownego wejścia w Account Entry albo onboarding.

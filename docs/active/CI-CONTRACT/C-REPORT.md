# CI-CONTRACT/C — lokalny przebieg exact-SHA

**Status:** `done`  
**QA:** **PASS WITH ISSUES**  
**Zakres:** lokalny przebieg czterech repozytoriów; bez admission, publikacji i wdrożenia

## Dokładny kandydat

- application: `4830f36febdff686f8c422654fc467165c6e058e`
- backend: `3c759555b48e2c654bb450a0e9fb5956bbe5d72d`
- content: `21707b615341a6b44c8d5f933d44d9e18e7941b8`
- web: `12c9557cdb1e6534feb17f2a4920defab63c44d4`
- candidate ID: `68524885ebca4bfb2098a6f1afa80a65e4b68db2b2d8e529c11ab5d9fe14b2e6`
- manifest ID: `cccfcd7867a0e8af560c1ae92272ff8167ef10f7e6a350cf4a7e1c47a862a489`

Manifest utworzono poza repozytoriami i zweryfikowano ponownie względem czystych
HEAD-ów. Historyczny checkout contentu miał dokładnie
`cc3efca88be7e01137f10ac69a0643f06b61a350`.

## Naprawy wymagane przez przebieg

- Aplikacyjne warstwy konta używają jednego repozytoryjnego facade’u lifecycle
  storage zamiast importować implementację MMKV. `recovery:check` przechodzi.
- Przywrócono rzeczywiste testy atomowego goal+plan, tombstone i stabilnego
  mutation ID; usunięto dwa testy budujące niekanoniczny stan.
- Auth-only Firebase emulator z osobnym configiem nie jest już błędnie
  klasyfikowany jako ścieżka Firebase Hosting.
- Skończony Metro build test jawnie wyłącza zależność od per-user Watchman;
  oba bundle powstają w około 8 sekund zamiast kończyć się timeoutem 120 s.
- Runtime privacy odróżnia globalny `fetch` od `NetInfo.fetch()` i ma oba testy
  regresji.
- Backendowy inventory wiąże binarny `fetchImplementation(URL(...))` z metodą
  i ścieżką OpenAPI, więc obejmuje wszystkie 58 operacji, w tym package GET.
- Webowy test wywołuje funkcję konfiguracji Vite i dostarcza testowy artefakt
  prawny. Lokalny launcher honoruje tylko bezpieczne argumenty loopback/port,
  dzięki czemu workflow rzeczywiście startuje na `127.0.0.1:4173`.

## QA i weryfikacja

- Briefing: zgodność 0,96; prostota 0,83; ryzyko 0,86;
  utrzymywalność 0,88; minimum 0,83 — APPROVE.
- Aplikacja: `qa:static` PASS; 1252/1252, typecheck, recovery, content boundary
  i runtime privacy PASS. Cross-repo używał historycznego i bieżącego rootu
  oraz pełnego oczekiwanego SHA.
- Backend: lint, typecheck, TTL i 233/233 testów emulatorowych PASS;
  `openapi:check` 58 operacji, frontend inventory 50 użytych operacji i build
  PASS. Ukierunkowany negatywny test nowego inventory PASS.
- Content: 67/67, pełny build wszystkich dziewięciu tracków i test scoringu
  każdego tracku PASS.
- Web: admin behavior 34/34, admin config, build i `verify:local` PASS;
  lokalny serwer potwierdzony na `127.0.0.1:4173`.
- Manifest create/verify oraz czystość wszystkich czterech repozytoriów PASS.

## Pozostałe kwestie

- Lokalny Firebase CLI po zielonych 233/233 i poprawnym zamknięciu emulatorów
  dwukrotnie zwrócił kod 2 podczas własnej obsługi update/MOTD config. Dlatego
  całego wrappera `npm run ci` nie opisujemy jako PASS; wszystkie późniejsze
  owning gates wykonano i odebrano osobno.
- Workflow przypina JDK 21, natomiast lokalnie dostępne są JDK 23 i 11. Testy
  emulatorów przeszły na JDK 23; nie jest to dowód parytetu toolchainu hosted.
- Nie uruchamiano hosted workflow, admission, publikacji ani wdrożenia.

Te kwestie nie zmieniają wyniku lokalnego kontraktu i manifestu, lecz muszą
pozostać jawne przy przyszłej bramce wydania. Ponowny exact-SHA przebieg jest
wymagany dla nowego kandydata przed FREEZE.

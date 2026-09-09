# ODK-E2E-039 — raport wdrożenia

## Cel

Zachować cel i plan podczas przejścia gość → konto. Nie pokazywać zbędnego zaproszenia do celu. Zapewnić bezpieczny wybór danych urządzenia albo konta.

## Ustalenia

- Tombstone celu i planu jest pełnoprawnym stanem konfliktu.
- Discard ma trwały marker, kopię całej dozwolonej przestrzeni nauki oraz wznowienie po awarii.
- Lokalny zapis nauki i materializacja konta używają jednej kolejki.
- Stare potwierdzenie adopcji jest usuwane. Kolejna próba pobiera nowe preview.
- Zaproszenie do celu jest per track. Nie pojawia się dla istniejącego celu, aktywnej sesji ani niezdrowego stanu synchronizacji.
- VoiceOver pominięto zgodnie z zakresem.

## Podejście

- Backend nie ukrywa tombstone’ów celu i planu podczas preview oraz restore.
- Aplikacja zachowuje surową, allowlistowaną kopię lokalnych danych przed discardem. Po błędzie przywraca ją i weryfikuje.
- Destrukcyjny discard wymaga osobnego potwierdzenia.
- Nazwa ścieżki i nowe teksty mają wersje EN i PL.
- Konto bez celu dostaje nieblokujące zaproszenie. Odroczenie pozostaje trwałe per track.

## Ocena przed zmianą

- Dopasowanie celu i architektury: 0,94.
- Prostota: 0,84.
- Ryzyko: 0,82.
- Utrzymywalność: 0,87.
- Minimum: 0,82. Brief zaakceptowany.

Walidacja briefu: `gpt-5.6-luna`, effort `max`, bez narzędzi.

## Weryfikacja

- Aplikacja: `npm run qa:static` — 1034/1034 testów PASS; content boundary PASS; runtime privacy boundary PASS.
- Backend: lint, typecheck, 22 polityki TTL, OpenAPI, frontend client i build — PASS.
- Backend na emulatorach Auth i Firestore: 122/122 testów PASS.
- Testy celowane aplikacji: 47/47 PASS. Końcowy test lifecycle: 37/37 PASS.
- `git diff --check` w obu repozytoriach — PASS.
- Maestro iOS: zaproszenie gościa do celu oraz aktywna główna akcja — PASS.
- Dowód tymczasowy: `/tmp/odk-e2e-039-maestro/2026-09-09_083202/patternly-continue-goal/takeScreenshot/odk-e2e-039-guest-goal-invitation.png`.

## Niezależne QA

Model: `gpt-5.6-luna`. Effort: `max`.

Pierwsze dwa przeglądy wykryły luki P1 w rollbacku, starym preview i przeplotach lokalnych zapisów. Luki poprawiono i ponownie przetestowano.

Końcowy werdykt: PASS. Brak P0 i P1.

Nieblokujące P2 pozostają do pełnego retestu ODK-E2E-041: zgodność starego markera bez kopii, obcy identyfikator ścieżki oraz bardziej szczegółowe teksty wariantów konfliktu.

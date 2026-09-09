# ODK-E2E-092 — raport wdrożenia

## Wynik

Zmieniono obsługę błędu zajętego adresu w ekranie zmiany e-maila. Poprawne hasło i zajęty adres wskazują teraz pole nowego adresu. Błędne hasło nadal wskazuje pole hasła. Komunikaty EN i PL są neutralne i nie potwierdzają istnienia konta.

## Zakres

- Dodano kontekstowy błąd `emailUnavailable`.
- Tylko `requestEmailChange` mapuje dokładny kod `auth/email-already-in-use` na ten błąd.
- Globalny klasyfikator błędów konta pozostał bez zmian.
- Błąd `emailUnavailable` wskazuje `security-new-email`.
- Reautoryzacja nadal wskazuje `security-password`.
- Błędy operacyjne nadal używają ogólnego bloku błędu.
- Dodano neutralne komunikaty EN i PL.
- Dodano testy klasyfikacji, prezentacji i zachowania po edycji pól.

Nie dodano atrap, ukrytego sukcesu ani funkcji z późniejszych zadań.

## Ocena przed wdrożeniem

Niezależna walidacja briefu Luna/max:

- zgodność celu i architektury: 0,97
- prostota: 0,94
- ryzyko: 0,91
- utrzymywalność: 0,95
- minimum: 0,91

Wynik przekroczył próg 0,8.

## Weryfikacja statyczna

- Testy ukierunkowane: 32/32 PASS.
- `npm run qa:static`: 1052/1052 PASS.
- Typecheck: PASS.
- Recovery checks: PASS.
- Content boundary: PASS.
- Runtime privacy boundary: PASS.
- `git diff --check`: PASS.

## Niezależne QA

Pierwsze QA Luna/max nie znalazło P0 ani P1. Wskazało jeden brak P2: brak rzeczywistego testu dwóch kont oraz dowodu wizualnego EN/PL. Ten brak zamknięto retestem Maestro opisanym niżej.

Ocena pierwszego QA:

- zgodność: 0,96
- prostota: 0,93
- ryzyko: 0,88
- utrzymywalność: 0,91
- minimum: 0,88

Końcowe QA Luna/max po retestach: PASS. Brak P0, P1 i otwartych P2.

- zgodność: 0,98
- prostota: 0,94
- ryzyko: 0,95
- utrzymywalność: 0,93
- minimum: 0,93

## Maestro i dowód wizualny

Retest wykonano na iOS 26.4. Użyto prawdziwego konta A oraz istniejącego konta B w lokalnym emulatorze Firebase Auth.

Potwierdzono:

- EN: zajęty adres wskazuje pole nowego adresu, bez błędu hasła.
- EN: edycja hasła zachowuje błąd adresu.
- EN: edycja adresu usuwa błąd adresu.
- EN: błędne hasło wskazuje pole hasła, bez błędu adresu.
- PL: zajęty adres wskazuje pole nowego adresu, bez błędu hasła.
- PL: błędne hasło wskazuje pole hasła, bez błędu adresu.
- Żadna negatywna próba nie zmieniła adresu konta A.

Dowody: `artifacts/maestro-screen-capture/odk-e2e-092/2026-09-09-1837/`.

Stary proces backendu odrzucał jawne `protocolVersion`. Został zastąpiony procesem uruchomionym z bieżącego backendu `158e08c`. Emulatory Auth i Firestore oraz ich dane zostały zachowane. Nie wymagało to zmiany produktu.

VoiceOver pominięto zgodnie z poleceniem.

## Ograniczenia

Nie testowano providerów ani release gate’ów ODK-E2E-082–088 i 099. Pozostają osobną kolejką.

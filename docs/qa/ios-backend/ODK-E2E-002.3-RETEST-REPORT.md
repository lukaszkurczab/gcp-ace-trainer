# ODK-E2E-002.3 — retest ekranu Terms of Service

Status: `PASS`

Data: 2026-09-07

## Wynik

Na symulatorze iOS 26.4 potwierdzono obie wymagane ścieżki:

- Create account → Terms of Service → powrót do formularza rejestracji;
- Settings → Legal information → Terms → powrót do Legal information.

Treść jest wyświetlana jako prosty, przewijalny i zaznaczalny tekst ze
zmiennymi z `src/legal/legalVariables.ts`. Nie zmieniano UI ani dokumentu.

## Weryfikacja

- główne flow Maestro zakończone `PASS` dla obu wejść i obu powrotów;
- osobny checkpoint Settings → Terms zakończony `PASS`;
- symulator: `Maestro_IOS_iPhone-17_26`, iOS 26.4;
- bundle: `com.lkurczab.patternly`;
- pakiet dowodowy:
  `artifacts/maestro-screen-capture/legal-terms/2026-09-07-1115/`.

Pierwsze próby ujawniły wyłącznie wymagania fixture: po `clearState` pozostawał
klucz Keychain, więc użyto istniejącej jawnej ścieżki „Remove unavailable data”,
a świeży gość musiał wybrać track. Flow zapisuje oba kroki i jest powtarzalne.

## Ryzyka i blokery

Brak blokera dla ODK-E2E-002.3. Nie oceniano kompletności placeholderów treści;
ich uzupełnienie pozostaje osobnym obowiązkiem przed publikacją.

Następne zadanie: `ODK-E2E-002.4`.

# ODK-E2E-002.4 — retest ekranu Privacy Policy

Status: `PASS`

Data: 2026-09-07

## Wynik

Na symulatorze iOS 26.4 potwierdzono obie wymagane ścieżki:

- Create account → Privacy Policy → powrót do formularza rejestracji;
- Settings → Legal information → Privacy Policy → powrót do Legal information.

Treść jest wyświetlana jako prosty, przewijalny i zaznaczalny tekst ze
zmiennymi z `src/legal/legalVariables.ts`. Nie zmieniano UI ani dokumentu.

## Ocena przed zmianą

- zgodność z celem i architekturą: 0,98;
- prostota: 0,97;
- ryzyko: 0,95;
- utrzymywalność: 0,96;
- minimum: 0,95.

Zakres ograniczono do retestu i materiału dowodowego istniejącego,
zaakceptowanego ekranu.

## Weryfikacja

- główne flow Maestro zakończone `PASS` dla obu wejść i obu powrotów;
- checkpoint Create account → Privacy Policy zakończony `PASS`;
- checkpoint Settings → Privacy Policy zakończony `PASS`;
- symulator: `Maestro_IOS_iPhone-17_26`, iOS 26.4;
- bundle: `com.lkurczab.patternly`;
- oba zrzuty sprawdzono wizualnie;
- pakiet dowodowy:
  `artifacts/maestro-screen-capture/legal-privacy/2026-09-07-1135/`.

Pierwsza próba ujawniła wyłącznie wyścig w fixture: ekran odzyskiwania
zaszyfrowanych danych pojawiał się po natychmiastowym sprawdzeniu warunku.
Dodanie oczekiwania na zakończenie animacji ustabilizowało istniejącą jawną
ścieżkę „Remove unavailable data”.

## Ryzyka i blokery

Brak blokera dla ODK-E2E-002.4. Nie oceniano kompletności placeholderów treści;
ich uzupełnienie pozostaje osobnym obowiązkiem przed publikacją.

Następne zadanie: `ODK-E2E-058`.

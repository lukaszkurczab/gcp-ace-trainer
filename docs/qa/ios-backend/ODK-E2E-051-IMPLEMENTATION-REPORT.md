# ODK-E2E-051 — raport wdrożenia i weryfikacji

Status: VERIFIED_CLOSED

## Wynik

- `Hold to delete` jest ukryty przed poprawną weryfikacją.
- Błąd hasła pojawia się pod polem `Password`.
- Po weryfikacji pola i opisy znikają.
- Przycisk pokazuje postęp przez ciemnoczerwone wypełnienie.
- Wczesne puszczenie zeruje postęp.
- Pełne przytrzymanie usuwa konto.

## Zmienione pliki

- `src/features/account/AccountSecurityScreen.tsx`
- `src/features/account/accountSecurityFieldErrors.ts`
- `src/components/HoldToConfirmButton.tsx`
- `src/locales/en/settings.json`
- `src/locales/pl/settings.json`
- `src/features/account/accountSecurityDeletionPresentation.test.ts`
- `src/features/account/accountSecurityFieldErrors.test.ts`
- `src/components/holdToConfirmGesture.test.ts`

## Testy

- testy prezentacji, mapowania błędu i gestu: 24/24 PASS;
- TypeScript: PASS;
- recovery inventory: PASS, 357 plików źródłowych, 163 pliki testowe, 883 przypadki bazowe;
- pełny pakiet: 888/888 PASS;
- content boundary: PASS;
- runtime privacy boundary: PASS;
- `git diff --check`: PASS.

## Retest iOS

Artefakt: `/Users/lukaszkurczab/.maestro/tests/2026-09-08_074609/ODK050-051 delete account two-step flow resume`.

- urządzenie: `Patternly_QA_Delete_20260908`, iOS 26.4;
- wynik: 1/1 PASS w 45 s;
- użyto jednorazowego konta w lokalnym środowisku;
- sprawdzono ukrycie przycisku, błędne hasło, poprawne hasło, ukrycie pól, przerwanie gestu i pełne usunięcie;
- obejrzano 5 nowych zrzutów;
- ekran końcowy pokazuje `Sign in`, więc konto i sesja zostały usunięte.

## Regresje, ryzyka i blokery

- Nie znaleziono regresji zakresu.
- Mechanizm ważności autoryzacji, unieważnienie po wyjściu i blokada duplikatów pozostały bez zmian.
- Nie testowano providerów ani urządzenia fizycznego. Obejmuje je kolejka 082–088.
- VoiceOver pominięto zgodnie z zakresem.

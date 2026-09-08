# ODK-E2E-050 — projekt usuwania konta

Status: ACCEPTED_AND_VERIFIED

## Cel

Użytkownik ma rozumieć skutek usunięcia konta. Finalna decyzja ma wymagać świadomego gestu.

## Przepływ

1. Ekran pokazuje krótkie ostrzeżenie o nieodwracalności.
2. Tekst rozróżnia dane usuwane i zachowywane.
3. Pole ma nazwę `Password` / `Hasło`.
4. Przycisk `Confirm identity` / `Potwierdź tożsamość` jest aktywny po wpisaniu hasła.
5. Błędne hasło pokazuje błąd pod polem.
6. Poprawne hasło ukrywa ostrzeżenie, pole i pierwszy przycisk.
7. Zostaje tylko `Hold to delete` / `Przytrzymaj, aby usunąć`.
8. Ciemnoczerwone wypełnienie rośnie od lewej do prawej.
9. Wczesne puszczenie zeruje postęp.
10. Pełne przytrzymanie uruchamia usunięcie.
11. Błąd operacyjny zostaje pokazany jawnie. Można ponowić operację.
12. Wyjście z ekranu unieważnia przygotowane potwierdzenie.

## Stany

- początkowy: ostrzeżenie, hasło, potwierdzenie tożsamości;
- błąd hasła: komunikat przy polu;
- gotowy: tylko przycisk przytrzymania;
- przytrzymanie: rosnące wypełnienie;
- przerwanie: pusty przycisk w stanie gotowym;
- usuwanie: zablokowany przycisk i wskaźnik pracy;
- błąd usuwania: jawny stan ponowienia;
- sukces: ekran logowania.

## Dostępność i lokalizacja

- Widoczne copy jest krótkie w EN i PL.
- Ukryta wskazówka dostępności opisuje gest i jego anulowanie.
- Tekst może rosnąć do dwukrotnego rozmiaru.
- VoiceOver jest poza zakresem tego planu.

## Walidacja briefu

Niezależny `gpt-5.6-luna / max`, bez narzędzi:

- zgodność celu i architektury: 0,94;
- prostota: 0,92;
- ryzyko: 0,82;
- utrzymywalność: 0,90;
- minimum: 0,82;
- werdykt: APPROVE.

Projekt zachowuje istniejący kontrakt autoryzacji i usuwania. Zmienia tylko prezentację oraz mapowanie błędu hasła.

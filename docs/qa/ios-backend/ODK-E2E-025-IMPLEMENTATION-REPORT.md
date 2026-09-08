# ODK-E2E-025 — godziny przypomnień

Status: DONE. PO wybrał wariant 2. Licznik wcześniejszych próśb pozostaje 5/5.

## Decyzja

Checkbox włącza osobne godziny. Bez zaznaczenia jedna wspólna godzina obowiązuje we wszystkie dni aktywnego celu. Po zaznaczeniu każdy wybrany dzień ma własne pole czasu.

## Walidacja

Brief wdrożeniowy ocenił niezależny `gpt-5.6-luna / max`: zgodność 0,94; prostota 0,83; ryzyko 0,85; utrzymywalność 0,87. Minimum 0,83. APPROVE.

Pierwszy review kodu odrzucił zmianę z minimum 0,60. Wykrył zależność trybu osobnego od ukrytej godziny wspólnej, brak cleanupu po usunięciu aktywnego tracka, zbyt słabe recovery duplikatów i brak stanu celu bez dni. Wszystkie cztery problemy poprawiono.

Ponowny review: zgodność 0,94; prostota 0,84; ryzyko 0,84; utrzymywalność 0,88. Minimum 0,84. PASS.

## Wdrożenie

- kanoniczny rekord ma jawny tryb `same-time` albo `by-day`;
- każdy harmonogram dnia przechowuje własny czas;
- rekord oraz niedokończony journal ODK-E2E-024 migrują do wersji 2;
- tryb wspólny ma jedno źródło czasu, a tryb osobny kompletną listę dni celu;
- nowe dni dziedziczą czas pierwszego istniejącego dnia w kolejności pon.–niedz.; fallback to 20:00;
- usunięte dni i brak aktywnego tracka usuwają stare systemowe wpisy;
- recovery sprawdza rzeczywiste wpisy systemowe i utrwala każdy udany cleanup;
- ekran zachowuje oba szkice podczas przełączania, ale zapisuje tylko aktywny tryb;
- zamknięcie arkusza odrzuca niezapisany szkic;
- `no-days` jest jawnym, zablokowanym stanem;
- EN i PL mają ten sam kontrakt 60 kluczy.

## Weryfikacja

- wąska brama: 33/33 PASS;
- końcowy `npm run qa:static`: PASS;
- pełny zestaw: 910/910 PASS;
- typecheck, recovery, granica treści i prywatności runtime: PASS;
- Maestro PL/dark: tryb osobny, trzy pola, zapis, ponowne otwarcie i anulowanie szkicu: PASS;
- Maestro PL/dark: wielokrotne przełączanie zachowuje dwa szkice, a tryb wspólny 17:00 zapisuje się i otwiera ponownie: PASS;
- obejrzano cztery końcowe zrzuty. Układ jest czytelny i nie jest obcięty;
- VoiceOver pominięto zgodnie z decyzją PO.

## Wynik

ODK-E2E-025 usunięto z aktywnego rejestru. ODK-E2E-034 pozostaje zablokowane tylko przez ODK-E2E-029.

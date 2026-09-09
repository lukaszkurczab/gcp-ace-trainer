# ODK-E2E-089 — raport wdrożenia

## Wynik

Zadanie zakończone. Formularze konta pokazują błędy przy właściwych polach:

- różne nowe hasła przy `Powtórz nowe hasło`;
- zbyt słabe hasło przy `Nowe hasło`;
- błędne hasło dla kodów odzyskiwania przy `Obecne hasło`.

Błędy sieciowe, dostawcy i ponownego uwierzytelnienia pozostają w ogólnym `InfoBlock`. Edycja pola z błędem usuwa jego komunikat. Edycja innego pola zachowuje komunikat.

## Zmiany

- `accountSecurityFieldErrors.ts` jest jednym mapperem błędu na pole.
- `AccountSecurityScreen.tsx` renderuje istniejące teksty EN/PL przy polach.
- `AccountSessionProvider.tsx` zachowuje `invalidCredential` dla generowania kodów odzyskiwania.
- Starszy `AccountEntryScreen.tsx` nadal pokazuje ten błąd przy haśle.
- Dodano testy kontraktu warstwy sesji, mappera i prezentacji.

Nie zmieniono funkcji usuwania konta, zmiany e-maila, logowania ani resetu hasła.

## Weryfikacja

- brief: niezależna Luna/max — `APPROVE`, minimum `0,91`;
- testy ukierunkowane: `9/9 PASS`;
- `npm run qa:static`: `1049/1049 PASS`;
- `validate:content-boundary`: `PASS`;
- `validate:runtime-privacy-boundary`: `PASS`;
- niezależne QA po pierwszym przebiegu: dwa P2; oba poprawiono;
- Maestro iOS 26.4: finalny przebieg EN/PL — `PASS`;
- VoiceOver: pominięty zgodnie z decyzją właściciela.

## Dowód wizualny

Pakiet tymczasowy: `artifacts/maestro-screen-capture/odk-e2e-089/2026-09-09-1625`.

Zawiera osiem pełnych kadrów. Pokazują mismatch, słabe hasło, błędne hasło kodów odzyskiwania oraz zachowanie po edycji pól.

## Ocena

- zgodność celu i architektury: `0,95`;
- prostota: `0,95`;
- ryzyko: `0,91`;
- utrzymywalność: `0,95`;
- minimum: `0,91`.

## Ograniczenia

Retest wykonano na jednym symulatorze, w ciemnym motywie i przy największym skonfigurowanym rozmiarze tekstu. Zakres ODK-E2E-089 nie wymagał zmiany danych planu ani tożsamości tracka i pakietu. Te kontrakty pozostały nietknięte.

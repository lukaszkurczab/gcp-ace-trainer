# PROFILE-03 — kontrakt wylogowania offline i wznowienia sesji

## Cel

Wylogowanie natychmiast zamyka lokalny profil konta i usuwa lokalną sesję Firebase również bez sieci. Dane konta, sesje nauki, outbox, journal i markery wznowienia pozostają zaszyfrowane pod profilem konta. Zdalne unieważnienie sesji jest osobną, trwałą operacją i nie może być przedstawione jako zakończone przed rzeczywistym potwierdzeniem backendu.

## Kanoniczny przebieg

1. Aplikacja zapisuje dokładną parę `uid + operationId`, zamyka scope konta i wykonuje lokalny Firebase sign-out.
2. Restart bez Auth pozostaje na logowaniu; profil konta nie jest otwierany.
3. Ponowne Auth tego samego UID, przy nadal zamkniętym scope, uzyskuje przypięty `authorizationGeneration = G` i wznawia dokładną operację revoke.
4. Backend idempotentnie unieważnia refresh tokens, finalizuje operację bez utrwalania subjectu ani tokenu i zwraca świeży custom token dla tego samego subjectu z claimem `G`.
5. Aplikacja przyjmuje wynik tylko przy zgodnym `operationId`, UID, claimie `G` i nadal aktualnym tokenie komendy. Dopiero wtedy usuwa dokładny marker pending i może otworzyć profil konta.

Każda zmiana UID/generacji, błąd wydania tokenu lub przerwanie przed lokalnym completion pozostawia marker pending i scope zamknięty. Po próbie completion trwały zapis musi zawierać albo dokładny pending, albo dokładny tombstone `completed`; niejednoznaczny odczyt nie otwiera profilu. Replay zakończonej operacji może ponownie wydać token, ale nie powtarza provider revoke. Token zastępczy istnieje wyłącznie w odpowiedzi; nie jest logowany ani zapisywany w Firestore.

## Granice

- To nie jest usunięcie konta ani lokalnych danych.
- Inne UID nie może usunąć markera, otworzyć profilu ani wysłać outboxa poprzedniego konta.
- Brak wdrożenia. Zmiana backendu jest producentem kontraktu i musi zostać wypchnięta przed konsumentem aplikacji.

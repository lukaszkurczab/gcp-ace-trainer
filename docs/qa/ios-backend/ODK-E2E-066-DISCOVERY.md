# ODK-E2E-066 — discovery retencji, TTL, backupu i PITR

Status: `IMPLEMENTED_AND_CLOUD_VERIFIED`

Data: 2026-09-07

## Stan chmury — odczyt bez zmian

Docelowy projekt wynikający z konfiguracji repozytorium: `patternly-app-sandbox`.

- jedyna baza: `(default)`, Firestore Native, edycja Standard;
- region: `europe-central2`;
- ochrona przed usunięciem bazy: aktywna;
- PITR: wyłączony; bieżąca retencja wersji wynosi 1 godzinę;
- aktywne polityki Firestore TTL: `0`;
- backupy: `0`; harmonogramy backupów: `0`;
- Cloud Logging `_Default`: 30 dni;
- Cloud Logging `_Required`: 400 dni, bucket zablokowany przez dostawcę;
- brak osobnego bucketu 180 dni dla logów bezpieczeństwa.

Agregacyjne odczyty bez pobierania treści wykazały:

- `deletionRequests`: 1 historyczny rekord;
- `deletionProofs`: 2, z czego 0 po terminie;
- `deletedIdentities`: 2, z czego 0 po terminie;
- `accountDeletionOperations`: 2, z czego 0 po terminie;
- pozostałe sprawdzone kolekcje raportów, DSAR i incydentów: 0 rekordów.

Historyczny `deletionRequests` wygasł 2026-08-25. Odczytano wyłącznie nazwy pól i czasy: rekord zawiera m.in. `emailHash`, `tokenHash`, surowy `userId`, `operationId` i `proofId`. Runtime i lokalny model tej kolekcji już nie używają.

## Stan repozytorium

Repozytorium definiuje 14 polityk TTL dla eksportów, DSAR, incydentów i collection group `audit`, lecz żadna nie jest aktywna w chmurze.

Brakujące klasy:

- ukończone `syncOperations` i `syncMutations`: brak `expiresAt` i TTL 30 dni;
- `contentReports`: kod ustawia 30/180 dni, brak polityki TTL;
- `deletionProofs`: kod ustawia 3 lata, brak polityki TTL;
- `accountDeletionOperations`: kod ustawia 3 lata po ukończeniu, brak polityki TTL;
- `deletedIdentities`: kod ustawia 45 dni, brak polityki TTL;
- `contentReports/{id}/audit`: brak własnego expiry; rekurencyjny przypadek pozostaje również przedmiotem ODK-E2E-081.

Dokumentacja zakłada siedmiodniowy PITR, ale stan chmury temu przeczy. Publiczne zmienne dla retencji logów i opóźnienia usunięcia z backupu nadal są placeholderami.

## Minimalny wariant rekomendowany

1. Uzupełnić kod i testy brakujących `expiresAt` oraz repozytoryjne polityki TTL.
2. Ustawić 30 dni dla zakończonych sync operations, 30/180 dni dla raportów, 45 dni dla tombstones oraz 3 lata dla proofów i zakończonych operacji usunięcia.
3. Utrzymać operacyjne logi w `_Default` przez 30 dni, a logi bezpieczeństwa skierować do osobnego bucketu z retencją 180 dni.
4. Włączyć siedmiodniowy PITR bez dodatkowych długoterminowych harmonogramów backupu; polityka prywatności powinna uczciwie podawać maksymalnie siedmiodniowe opóźnienie fizycznego usunięcia z PITR.
5. Aktywować komplet polityk TTL dopiero po teście i porównaniu planu z chmurą.
6. Usunąć pojedynczy, wygasły i nieużywany `deletionRequests` po osobnej zgodzie właściciela; nie zachowywać surowego `userId` tylko dla historii.
7. ODK-E2E-081 pozostaje odpowiedzialne za dowód rekurencyjnego usuwania podkolekcji po wygaśnięciu rodzica.

## Ocena

- dopasowanie do celu i architektury: `0.94`;
- prostota: `0.86`;
- kontrola ryzyka: `0.90`;
- utrzymywalność: `0.91`;
- minimum: `0.86`.

## Decyzja wymagana

Włączenie TTL uruchamia przyszłe automatyczne usuwanie, usunięcie historycznego rekordu jest nieodwracalne, a PITR i osobny bucket logów mogą zwiększyć koszt chmury. Z tego powodu działania chmurowe są wstrzymane do jawnej zgody PO; lokalne przygotowanie kodu może ruszyć po zatwierdzeniu tego wariantu.

PO zaakceptował rekomendowany wariant 2026-09-07, a część repozytoryjna została
wdrożona i zweryfikowana. Mechanizm wykonawczy odrzucił jednak ogólną zgodę jako
niewystarczająco precyzyjną dla nieodwracalnego TTL i trwałego usunięcia danych.
Pozostaje wymagana ponowna autoryzacja wymieniająca dokładnie cztery operacje
chmurowe opisane w raporcie wdrożenia.

## Rozstrzygnięcie

PO udzielił precyzyjnej zgody po przedstawieniu szacunku kosztów. 2026-09-07
wykonano i zweryfikowano cały zatwierdzony wariant: 20/20 polityk TTL jest
`ACTIVE`, PITR ma 7 dni, bucket bezpieczeństwa ma 180 dni i aktywny sink, a
ponowny odczyt agregacyjny historycznej kolekcji `deletionRequests` zwrócił 0.
Sekcja powyżej zachowuje historię decyzji, ale nie jest już blokerem.

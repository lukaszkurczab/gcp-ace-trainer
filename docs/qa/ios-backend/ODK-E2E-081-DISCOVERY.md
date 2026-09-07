# ODK-E2E-081 — discovery rekurencyjnego purge

Status: `IMPLEMENTED_AND_CLOUD_VERIFIED`

Data: 2026-09-07

## Stan potwierdzony

Firestore TTL nie usuwa podkolekcji razem z dokumentem nadrzędnym. Backend
tworzy podkolekcje `audit` pod `contentReports`, `privacyRequests` i
`securityIncidents`; drzewo użytkownika ma osobną, istniejącą ścieżkę
`recursiveDelete` oraz postcondition przez `listCollections`.

Po ODK-E2E-066 wszystkie nowe audyty mają własne `expiresAt`, a współdzielona
polityka collection-group `audit` jest aktywna w chmurze. Audyt raportu treści
dziedziczy dokładnie niezmienny termin parenta, więc raw `actorId` podlega temu
samemu limitowi 30/180 dni. Audyty privacy używają pseudonimu, a audyty
incydentów uwzględniają legal hold.

Agregacyjna inwentaryzacja `patternly-app-sandbox` po zakończeniu ODK-E2E-066:

- `contentReports`: 0;
- `privacyRequests`: 0;
- `securityIncidents`: 0;
- collection group `audit`: 0.

Nie ma danych historycznych ani niejednoznacznego legal hold wymagającego
decyzji PO lub migracji.

## Rozważone warianty

Sam TTL dziecka ostatecznie usuwa audyt, ale pozostawia możliwe przejściowe okno
orphan i nie daje deterministycznego testu przerwania/retry. Ogólny purger dla
wszystkich rodzin byłby ryzykowny: `recursiveDelete` incydentu może ścigać się z
retroaktywnym legal hold i nie obsługuje precondition całego drzewa.

Wybrany minimalny wariant:

1. ciągłą egzekucję wszystkich nowych audytów pozostawić aktywnemu TTL;
2. dodać kontrolowany, bounded i idempotentny purger wyłącznie dla
   `contentReports` oraz dokładnych `contentReports/{id}/audit/{id}`;
3. expired parent usuwać rekurencyjnie, a expired orphan audit bezpośrednio
   dopiero po potwierdzeniu braku parenta;
4. nieznaną ścieżkę, brak/niepoprawny termin, wyczerpany budżet lub pozostały
   rekord raportować jako niepełny wynik bez usuwania i bez ujawniania ID;
5. udostępnić nie-HTTP CLI: dry-run domyślnie, execute tylko po jawnym
   `--execute`, bez możliwości rozszerzenia allowlisty;
6. privacy/security pozostawić wyłącznie mechanizmom TTL i atomowym kontraktom
   lifecycle/hold.

## Kryteria testowe

- expired report z audit znika rekurencyjnie;
- orphan audit po wcześniej usuniętym parencie znika tylko dla dokładnej ścieżki;
- mały budżet daje `complete=false`, a retry kończy pracę idempotentnie;
- brak due orphanów jest sprawdzanym postcondition, nie liczbą prób;
- unexpired, legal-hold, privacy/security/user/unknown oraz niepoprawne rekordy
  nie są usuwane;
- `actorId` nie żyje dłużej niż kwalifikacja audytu do usunięcia;
- CLI nie wypisuje ścieżek, identyfikatorów, aktorów ani surowych błędów.

## Ocena przed wdrożeniem

- dopasowanie do celu i architektury: `0.97`;
- prostota: `0.95`;
- kontrola ryzyka: `0.94`;
- utrzymywalność: `0.94`;
- minimum: `0.94`, niezależna walidacja `APPROVE`.

## Ryzyka i blokery

Fizyczne usuwanie TTL pozostaje asynchroniczne. Kontrolowany purger nie może
być rozszerzony na security incidents bez osobnego protokołu wykluczającego
wyścig z legal hold. W aktualnym zakresie nie ma blokera ani decyzji PO.

# ODK-E2E-068 — discovery eksportu i przenoszenia danych

Data: 2026-09-06
Status: `APPROVED_FOR_IMPLEMENTATION`

## Stan repozytorium

- Backend nie ma endpointu ani store’u eksportu.
- Uwierzytelnione dane konta są rozproszone między dokumentem `users/{userId}`, mapowaniem tożsamości, podkolekcjami `progress`, `devices`, `trackAccess`, `syncMetadata`, `syncOperations`, `syncMutations`, `security` oraz globalnymi raportami treści powiązanymi przez `accountId`.
- Istniejący `GET /v1/me` i `GET /v1/progress` nie tworzą kompletnego, maszynowo czytelnego eksportu, nie mają audytu eksportu i nie opisują pominięć.
- Mobilny ekran `YourDataScreen` jest wyłącznie informacyjny. Repo nie ma biblioteki ani kanonicznego przepływu zapisu/udostępnienia pobranego pliku.
- No-backup dla danych lokalnych i osobny proces adopcji konta pozostają bez zmian.

## Wymagania prawne przyjęte do projektu

- Art. 20 RODO obejmuje dane dotyczące osoby, które dostarczyła administratorowi, przetwarzane automatycznie na podstawie zgody lub umowy, w formacie ustrukturyzowanym, powszechnie używanym i maszynowo czytelnym.
- Prawo do przenoszenia nie może naruszać praw i wolności innych osób.
- Art. 15 ma szerszy zakres dostępu niż sama przenośność; pełny lifecycle i informacje art. 15 pozostają w następnym `ODK-E2E-077`, ale ODK-068 nie może ukrywać danych należących do użytkownika.
- Tożsamość żądającego musi być zweryfikowana. Dla zalogowanego konta stosujemy token Firebase i świeże uwierzytelnienie; dla gościa bez identyfikatora konta działa kanał kontaktowy z Privacy Policy, bez tworzenia dodatkowej tożsamości wyłącznie na potrzeby żądania.

Źródła: oficjalny tekst RODO EUR-Lex (art. 12, 15 i 20) oraz wytyczne dotyczące przenoszenia danych opublikowane przez UODO.

## Proponowany minimalny kontrakt backendu

`GET /v1/account-data/export`

- wymaga ważnego Firebase ID token, istniejącego użytkownika i świeżego uwierzytelnienia (maks. 5 minut, zgodnie z istniejącą granicą operacji wrażliwych);
- zwraca bezpośrednio `application/json; charset=utf-8` oraz bezpieczny `Content-Disposition: attachment`;
- nie tworzy tymczasowej kopii eksportu w Cloud Storage ani Firestore;
- ustawia `Cache-Control: private, no-store` i nie przekazuje payloadu do logów ani telemetry;
- ma `schemaVersion`, `exportedAt`, identyfikator eksportu, opis zakresu i stabilne sekcje danych;
- serializuje timestampy do ISO 8601 i nie zwraca wartości Firestore-specyficznych;
- limituje żądania per uwierzytelnione konto w transakcyjnym oknie odpornym na równoległość; odpowiedź 429 zawiera `Retry-After`;
- odrzuca snapshot przekraczający jawny limit rozmiaru zamiast zwracać ucięty lub częściowy eksport;
- zapisuje minimalny audyt: kryptograficznie losowy exportId, userId, czas, status, schemaVersion, zakres i expiry audytu 30 dni; sam eksport nie jest przechowywany, a audit nie zawiera payloadu, tokenu, IP ani emaila.

Firebase verifier pozostaje kanonicznym właścicielem sprawdzenia podpisu, issuer, audience i expiry. Endpoint dodatkowo wymaga `auth_time` nie starszego niż 300 sekund; test emulatorowy obejmuje token unieważniony oraz konto usunięte.

## Zakres eksportu

Sekcje są rozdzielone, aby nie utożsamiać art. 20 z pełnym art. 15:

### Portable — dane dostarczone przez użytkownika lub powstałe z jego aktywności

1. profil konta i bezpieczna projekcja tożsamości: provider, email, stan weryfikacji, createdAt; bez surowego provider subject;
2. wszystkie synchronizowane rekordy `progress` wraz z ich stanem, wersją i czasami;
3. raporty treści świadomie powiązane z kontem, łącznie z treścią użytkownika i statusem.

### Account context — osobny, jawnie nazwany dodatek, nieprzedstawiany jako art. 20

1. ustawienia dostępu do ścieżek i entitlementy konta;
2. platforma, wersja aplikacji i czasy urządzeń, bez device key/hash;
3. wyłącznie user-visible metadane synchronizacji potrzebne do zrozumienia stanu danych; surowe wewnętrzne mutacje i operacje pozostają poza portable snapshot;
4. historia wykonanych eksportów w okresie retencji.

Jawne pominięcia w manifeście odpowiedzi:

- tokeny Firebase/App Check, sekrety operacji, recovery codes i ich hashe;
- klucze szyfrowania, pseudonimizacji oraz wewnętrzne bucket keys;
- dane innych użytkowników i niepowiązane anonimowe raporty;
- treść banku pytań i inne dane produktu, które nie są danymi osobowymi użytkownika;
- wewnętrzne zabezpieczenia, jeśli ujawnienie osłabiłoby bezpieczeństwo; sama kategoria pominięcia i powód pozostają widoczne.
- surowe wewnętrzne journale synchronizacji, identyfikatory bucketów i dane techniczne bez wartości dla użytkownika; pełny dostęp/DSAR realizuje `ODK-E2E-077`.

## Podział wdrożenia

### 068-A — backend export store i kontrakt

- jeden store agregujący jawnie wymienione kolekcje;
- deterministyczna projekcja JSON i jawny manifest included/omitted;
- brak odczytu przez client-provided userId.

### 068-B — auth, recent-auth, rate limit i audit

- endpoint chroniony istniejącą tożsamością requestu;
- transakcyjny limit i `Retry-After`;
- audit bez payloadu z expiry 30 dni;
- logi tylko z correlationId/exportId i bez danych osobowych.

### 068-C — OpenAPI i testy emulatorowe

- test pełnego datasetu, izolacji drugiego użytkownika i referencji zagnieżdżonych, timestampów, tokenu unieważnionego, recent-auth, równoległego limitu, cache headers, redakcji logów, audytu, pominięć i przekroczenia rozmiaru;
- OpenAPI zgodne z runtime.

### 068-D — projekt iOS do akceptacji

- istniejący ekran „Twoje dane”; krótka informacja, jedna akcja „Pobierz dane konta” tylko dla konta oraz link/kanał dla gościa;
- stany: wymagane logowanie/ponowne uwierzytelnienie, przygotowanie, zapis/udostępnienie, błąd i limit;
- bez implementacji UI przed akceptacją PO.

## Ocena przed walidacją

- dopasowanie celu/architektury: 0,90 — wykorzystuje istniejącą tożsamość i jedno źródło Firestore;
- prostota: 0,84 — synchroniczny JSON bez kolejki i Cloud Storage;
- kontrola ryzyka: 0,86 — recent-auth, brak client userId, jawne pominięcia, brak trwałej kopii payloadu;
- utrzymywalność: 0,87 — jeden kontrakt eksportu i jawna lista kolekcji.

Nie ma jeszcze podstaw do implementacji UI. Backend może zostać wdrożony po niezależnej walidacji briefu.

## Walidacja briefu

Pierwsza niezależna walidacja (`gpt-5.6-luna`, reasoning `max`) odrzuciła brief: dopasowanie 0,76, prostota 0,82, kontrola ryzyka 0,70, utrzymywalność 0,78. Po rozdzieleniu portability od szerszego account context, doprecyzowaniu recent-auth, revocation, limitu rozmiaru, retencji, logów i kanału gościa wykonano rewalidację.

Druga niezależna walidacja (`gpt-5.6-luna`, reasoning `max`) zaakceptowała brief: dopasowanie 0,93, prostota 0,86, kontrola ryzyka 0,95, utrzymywalność 0,89. Backend dopuszczono do implementacji; UI pozostaje zależne od zaakceptowanego zadania designerskiego.

# ODK-119 — kontrakt wykonawczy przed zmianą runtime

**Status:** briefing zaakceptowany do ograniczonego slice backendu przez `gpt-5.6-luna/max` (minimum 0,81); brak zmian runtime ODK-119 i brak dowodu konfiguracji providerów.

## Cel

Jedynym źródłem uprawnienia Premium jest RevenueCat. Dostęp offline może trwać wyłącznie do ostatniej daty wygaśnięcia potwierdzonej przez RevenueCat dla bieżącego konta; aplikacja nie dodaje siedmiu ani trzech dni. Po skutecznym odświeżeniu stan online zastępuje cache. Cofnięcie zegara wymaga odświeżenia online.

## Ustalenia z kodu i dokumentacji

- Domena ma nieużywany w runtime predykat `verifiedAt + 7 dni`. `GET /v1/entitlements` działa pod App Check i bearer, ale aplikacja woła go tylko z diagnostyki. Nie istnieją cache uprawnienia ani bramka Premium w przygotowaniu sesji. Purchase/restore pokazują wynik SDK bez odświeżenia backendu.
- Backend przechowuje projekcję webhooka z datą wygaśnięcia. `BILLING_ISSUE` ignoruje; reconciler online jest stubem. Sklepy i RevenueCat nie są dostępne do realnego testu w tym checkoutcie.
- Dokumentacja RevenueCat mówi, że grace zachowuje uprawnienie, `BILLING_ISSUE` może nieść `grace_period_expiration_at_ms`, a status klienta/subskrypcji można odczytać przez API. Ta data jest faktem providera, a nie czasem wyliczanym przez Patternly.

Źródła kontraktu providera: [RevenueCat Billing Issues & Grace Periods](https://www.revenuecat.com/docs/subscription-guidance/how-grace-periods-work), [Common Webhook Flows](https://www.revenuecat.com/docs/integrations/webhooks/event-flows), [Developer API v2 Customer Resources](https://www.revenuecat.com/docs/api-v2/customer/resources). Identyfikator produktu API v2 jest wewnętrzny; przed kodem trzeba rozstrzygnąć mapowanie do sklepowego `REVENUECAT_PRODUCT_ID` i paginację odpowiedzi.

**Wynik discovery dla pierwszego slice:** [RevenueCat REST API v1 `GET /subscribers/{app_user_id}`](https://www.revenuecat.com/docs/api-v1/customers) zwraca `request_date_ms`, entitlement pod kluczem `premium` z `product_identifier`, `expires_date` i `grace_period_expires_date`, a `subscriptions` jest kluczowane sklepowym identyfikatorem produktu i zawiera `billing_issues_detected_at`, `grace_period_expires_date`, `refunded_at`, `store` oraz `is_sandbox`. Dzięki temu backend może porównać dokładny istniejący `REVENUECAT_PRODUCT_ID` bez mapowania wewnętrznego ID v2. Endpoint może utworzyć pustego klienta, gdy go nie ma; wywoływać go tylko dla zweryfikowanego konta Patternly. Wymaga serwerowego klucza API tylko do odczytu, którego obecna konfiguracja nie zawiera. Brak pola lub niezgodna para entitlement/subskrypcja daje negatywny albo jawnie niedostępny stan według tabeli, bez domyślania się grace.

## Kontrakt stanów

Jeden skonfigurowany produkt miesięczny i entitlement `premium` dla jednego zweryfikowanego konta Patternly. Dostęp do **nowej** płatnej sesji lub pakietu przysługuje tylko stanom `active` albo `grace`, gdy źródło jest potwierdzonym stanem RevenueCat, produkt i konto się zgadzają, a `now < effectiveExpiresAt`. `grace` używa wyłącznie daty końca grace zwróconej przez RevenueCat. `expired`, `revoked`, `refunded`, account hold/billing retry poza grace, brak/nieznany stan, brak daty wygaśnięcia lub niezgodny produkt odmawiają dostępu. Anulowanie samego odnowienia nie cofa dostępu przed potwierdzoną datą wygaśnięcia. Rozpoczęta wcześniej sesja może się zakończyć; nowej nie wolno rozpocząć.

| Stan z RevenueCat | Wymagane fakty | Nowa sesja / pobranie |
| --- | --- | --- |
| `active`, odnawia się | Dokładnie jeden pasujący produkt i entitlement; `providerExpiresAt` w przyszłości | Tak do `providerExpiresAt` |
| `active`, anulowano przyszłe odnowienie | Jak wyżej; anulowanie nie jest wygaśnięciem | Tak do `providerExpiresAt` |
| `in_grace_period` | Aktywny entitlement, pasujący produkt i osobne `providerGraceExpiresAt` w przyszłości | Tak do `providerGraceExpiresAt` |
| `in_billing_retry` / account hold poza grace | Brak potwierdzonego aktywnego grace | Nie |
| `expired`, `revoked`, `refunded`, brak entitlement | Dowolna data historyczna | Nie |
| Nieznany/konflikt, więcej niż jedna pasująca aktywna subskrypcja, brak daty, błędne konto lub produkt | Brak jednoznacznego potwierdzenia | Nie; jawny stan unavailable |

`BILLING_ISSUE` jest sygnałem do odświeżenia. Sam event nie nadaje grace. Data `grace_period_expiration_at_ms` może zostać zapisana jako dowód providera, lecz dostęp `grace` powstaje dopiero po świeżym odczycie aktualnego stanu RevenueCat. Brak pola nigdy nie wydłuża uprawnienia. Dzięki temu `BILLING_ISSUE` w hold i `BILLING_ISSUE` w grace mają odrębne decyzje.

Backend zapisuje podpisany webhook jako historyczny dowód dostawcy, lecz po połączeniu wykonuje świeży odczyt RevenueCat przed oznaczeniem odpowiedzi jako `fresh`. Jeśli klucz API lub provider jest niedostępny, zwraca jawny stan `unavailable`/503 i nie podmienia cache pozytywnym wynikiem. Nie wolno przedstawiać samego wyniku SDK purchase/restore jako potwierdzonego uprawnienia. `BILLING_ISSUE` z datą grace pozostaje sygnałem do odświeżenia, nie samodzielnym przyznaniem dostępu. `CANCELLATION` z błędem rozliczenia nie skraca potwierdzonego grace; późniejsze `EXPIRATION` lub refund/revoke cofa dostęp. Konflikt kolejności uruchamia odczyt providera albo jawnie odmawia nowego dostępu.

Świeżość oznacza odpowiedź API RevenueCat otrzymaną **podczas bieżącego** żądania backendu dla zweryfikowanego konta i dokładnie skonfigurowanego produktu/entitlementu. Backend zwraca stan wraz z `serverObservedAt` ustawionym po odpowiedzi providera; danych z webhooka nie oznacza `fresh`. Wymagany jest sekret API z uprawnieniem tylko do odczytu klienta. Brak klucza, błąd/timeout/rate limit lub niejednoznaczna odpowiedź daje `503` i nie aktualizuje cache. Przeglądarkowy ani mobilny klient nie dostaje sekretu. Po reconnect bieżący odczyt providera, także negatywny, zastępuje wcześniejszy cache. `GET /v1/entitlements` pozostaje pod App Check i bearer.

Webhooki pozostają idempotentne po `(appId, environment, eventId)`. Dla jednego konta/produktu projekcja akceptuje tylko rosnącą parę `(event_timestamp_ms, eventId)`; przy równym czasie `eventId` daje deterministyczny tie-break. Event starszy nie nadpisuje nowszego, w szczególności nie przywraca Premium po późniejszym refund/revoke/expiry. Gdy `BILLING_ISSUE`, `CANCELLATION` i `RENEWAL` nie dają jednoznacznego bieżącego porządku, projekcja webhooka oznacza konieczność odczytu providera; do tego czasu nowy dostęp online jest niedostępny. Zmiana konta (transfer) odwołuje stare powiązanie, a nowy właściciel wymaga odczytu własnego identyfikatora RevenueCat. Webhook nigdy nie służy jako świeża odpowiedź online.

## Cache i czas

Cache zawiera wyłącznie świeży wynik backendu po odczycie RevenueCat. Połączenie uruchamia odświeżenie na starcie, foreground, powrocie sieci, zakupie i restore; udana negatywna odpowiedź natychmiast zastępuje pozytywny cache. Nieudane odświeżenie pokazuje jawny brak potwierdzenia.

Precyzyjnie: cache przechowuje `accountId`, `productId`, `entitlementId`, `state`, `providerExpiresAt`, opcjonalne `providerGraceExpiresAt`, `serverObservedAt` oraz `maxObservedWallTime`. Po świeżej odpowiedzi `maxObservedWallTime = max(Date.now(), serverObservedAt)`. Przed każdą offline decyzją zapisuje `max(maxObservedWallTime, Date.now())`; gdy bieżący czas ścienny jest mniejszy od wcześniej zapisanego maksimum, dostęp offline jest blokowany do świeżej odpowiedzi (także po restarcie). Do oceny daty wygaśnięcia używa tego samego bieżącego czasu UTC. Brak cache lub daty wygaśnięcia nie daje dostępu; przesunięcie zegara w przód może tylko odmówić wcześniej. Odświeżenie online może pokazać aktualny dostęp mimo złego zegara urządzenia, lecz offline pozostaje zamknięty, dopóki urządzenie nie ma poprawnego czasu i nowego potwierdzenia. Po wylogowaniu/usunięciu konto traci cache; inne konto nie odczytuje poprzedniego.

Cache służy **tylko gdy urządzenie ma potwierdzony stan offline**. Odpowiedź backendu `503` przy działającym połączeniu oznacza unavailable dla nowych płatnych operacji; nie uruchamia cichego fallbacku do cache. Nierozpoznany błąd sieci również nie daje dostępu. Sukces odczytu z negatywnym stanem od razu zastępuje cache. Granica TTL jest ścisła: `now < providerExpiresAt` albo, wyłącznie dla potwierdzonego `grace`, `now < providerGraceExpiresAt`.

## Bramka i macierz akceptacji

Brak cache, niezgodne konto/produkt, nieznany stan, expiry, rollback, potwierdzony refund/revoke/hold: nowa sesja i nowy download są niedostępne, z jawną drogą Free/ponowienia. Poprawny `active` lub `grace` przed datą: istniejący zweryfikowany pakiet pozwala na nową sesję offline. Potwierdzony stan negatywny po reconnect wygrywa od razu. Zakup/restore pozostaje `pending verification` do świeżego wyniku backendu. Aktywna sesja kończy się zgodnie z lokalnym kontraktem mimo późniejszej utraty Premium.

## Kolejność i granice dowodów

1. Backend: jawny stan providera, grace, negatywne stany i odczyt online z testami webhook ordering, idempotencji, wielu zdarzeń oraz błędów API.
2. Aplikacja: typowana odpowiedź, cache per konto, czas/rollback, odświeżenie i realna bramka przy wszystkich wejściach w Premium; testy offline/online i zmiany konta.
3. Dokumenty 03/08/09/10/12/13, macierz testów i raport QA.

Sklepowe ustawienie 3 dni grace na Apple i Google, rzeczywisty produkt/cena, RevenueCat i provider E2E pozostają otwartą bramką ODK-085/119. Nie przyznawać pełnego `done` na podstawie mocków. Przed zmianą aplikacji ustalić właściciela bramki pakietu w obecnym runtime.

Dowód providera musi obejmować active, anulowanie bez wygaśnięcia, grace, expiry, refund/revoke, hold bez grace, brak daty i kolejność webhooków, z tym samym kontem i SKU na obu platformach. Konfigurację 3 dni potwierdzają zrzuty/eksport obu konsol, a timeline RevenueCat pokazuje daty; żadnego z tych dowodów nie daje lokalny mock.

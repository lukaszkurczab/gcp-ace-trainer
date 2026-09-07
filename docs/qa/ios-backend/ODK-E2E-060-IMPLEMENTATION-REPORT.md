# ODK-E2E-060 — raport wdrożenia

Data: 2026-09-07

Status: `FIXED_PENDING_RETEST`

## Wynik

Wdrożono cztery zatwierdzone kanały spraw konsumenckich dla konta i gościa: reklamację, odstąpienie, ustawowe odzyskanie danych nieosobowych oraz odwołanie od zawieszenia. Każde przyjęte zgłoszenie otrzymuje numer sprawy i potwierdzenie e-mail na trwałym nośniku. Reklamacja ma termin odpowiedzi 14 dni, a zamknięta sprawa retencję 6 lat, z jawną blokadą prawną.

Potwierdzony zakup początkowy jest wiązany z jedną aktywną, piętnastominutową próbą zakupu i dokładnym `transaction_id` RevenueCat. Uprawnienie nie jest nadawane dla niepowiązanego zakupu. Po webhooku wysyłane jest idempotentne potwierdzenie zawierające cenę storefrontu, okres i odnowienie, produkt, transakcję, wersję Regulaminu oraz zapis żądania natychmiastowego startu. Błąd dostawy pozostaje retryable i nie jest przedstawiany jako sukces.

## Zmiany

- Aplikacja: dokładnie cztery wejścia w Legal Information, wspólny krótki ekran zgłoszenia, statusy spraw, kanał gościa chroniony App Check oraz rozdzielenie wniosków RODO od odzyskania danych nieosobowych.
- Backend: kontrakty i magazyn `legal-requests`, potwierdzenia SMTP, kolejka administratora, revision guard, pseudonimizowany audyt operatora, publiczny limit 5 zgłoszeń na godzinę i eksport spraw powiązanych z kontem.
- Zakup: jedna aktywna próba, atomowe zużycie przez webhook, trwały rekord potwierdzenia i ponowienie dostawy po duplikacie webhooka.
- Panel WWW: minimalna kolejka z lazy-load szczegółów, odpowiedzią, zamknięciem i ustawieniem/zwolnieniem legal hold.
- Retencja: polityki TTL dla `legalRequests` i `legalRequestRateLimits`; audyt dziedziczy wygaśnięcie zamkniętej sprawy.
- API i operacje: OpenAPI, instrukcja retencji i zgodność klienta mobilnego.

Najważniejsze pliki:

- `src/features/home/LegalInformationScreen.tsx`
- `src/features/home/LegalRequestsScreen.tsx`
- `src/infrastructure/clients/PatternlyApiClientAdapter.ts`
- `src/legal/legalVariables.ts`
- `../patternly-backend/src/modules/legal-requests/contracts.ts`
- `../patternly-backend/src/modules/legal-requests/store.ts`
- `../patternly-backend/src/modules/billing/revenuecatWebhookStore.ts`
- `../patternly-backend/src/infrastructure/email/smtpPrivacyEmailSender.ts`
- `../patternly-backend/src/api/app.ts`
- `../patternly-backend/src/api/openapi.ts`
- `../patternly-backend/config/firestore-ttl.json`
- `../patternly-web/src/components/LegalRequestsPanel.jsx`

## Weryfikacja

- Backend pełny suite na emulatorach Firebase: `109/109 PASS`.
- Backend końcowy retest zmienionych ścieżek: `33/33 PASS`.
- Po niezależnym review poprawiono rozdzielenie entitlementu od dostawy receipt oraz atomowy claim wysyłki; końcowy emulator RevenueCat `5/5 PASS`, niezależne QA `PASS` z confidence `0,98`.
- Backend: lint, typecheck, build, OpenAPI check, frontend-client check i TTL check (`22` polityki) — `PASS`.
- Mobile: typecheck — `PASS`; pełny suite — `847/847 PASS`; ukierunkowane testy kanałów prawnych klienta/UI/provider — `45/45 PASS`.
- Panel WWW: produkcyjny build — `PASS`; testy zachowania administratora — `35/35 PASS`.
- Test dokumentów prawnych, hashe i walidatory dokumentów nie zostały dodane zgodnie z jawną decyzją product ownera.

## Ocena rozwiązania

- zgodność celu i architektury: `0,95` — odrębny lifecycle spraw konsumenckich nie miesza terminów z RODO;
- prostota: `0,88` — jeden ekran mobilny, jedna kolejka i jedna maszyna stanów;
- ryzyko: `0,87` — zapis, odpowiedź i potwierdzenie zakupu zawodzą jawnie, a operacje są idempotentne lub chronione rewizją;
- utrzymywalność: `0,92` — wspólne kontrakty statusów, jeden magazyn i jawne polityki TTL.

## Ryzyka i retest

- Produkcyjny zakup pozostaje poprawnie zablokowany do czasu uzupełnienia prawdziwych wartości operatora/SKU/ceny i konfiguracji RevenueCat/SMTP.
- `FIXED_PENDING_RETEST` oznacza konieczność końcowego testu z rzeczywistym App Store sandbox, webhookiem RevenueCat i dostawą przez docelową skrzynkę Google Workspace; nie jest to brak implementacji lokalnej.
- Końcowa zgodność całego przepływu jest zakresem ODK-E2E-061, a pełna zgodność prywatności — ODK-E2E-075.

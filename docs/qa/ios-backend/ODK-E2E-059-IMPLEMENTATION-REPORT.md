# ODK-E2E-059 — raport wdrożenia zgodnego checkoutu Premium

## Wynik

Status: `FIXED_PENDING_RETEST`.

Wdrożono miesięczny, automatycznie odnawiany zakup Premium przez App Store z ceną pobieraną ze storefrontu, bez triala i z natychmiastowym startem wyłącznie po osobnym żądaniu użytkownika. Checkout jest domyślnie wyłączony do czasu uzupełnienia danych handlowych oraz konfiguracji App Store i RevenueCat.

## Zmiany

- dodano natywny adapter RevenueCat dla iOS, miesięczne SKU, zakup, restore i przejście do zarządzania subskrypcją;
- dodano krótki ekran oferty z rozwijanymi szczegółami, ceną storefrontu i niedomyślnym żądaniem natychmiastowego startu;
- rejestracja hasłem, Apple i Google wymaga potwierdzenia pełnoletności oraz aktualnej wersji Terms, bez blokowania nauki gościnnej;
- backend zapisuje wersjonowaną akceptację Terms i niezmienne potwierdzenie przed zakupem;
- zapis prawny i potwierdzenie zakupu są objęte eksportem danych oraz rekurencyjnym usunięciem konta;
- konfiguracja prywatności iOS deklaruje historię zakupów bez śledzenia;
- dodano synchroniczną blokadę wielokrotnego wywołania zakupu i kontrolę zmiany konta przed otwarciem StoreKit;
- surowe błędy dostawcy nie są przekazywane do warstwy prezentacji;
- `premiumCheckoutEnabled` w `src/legal/legalVariables.ts` pozostaje `false`, dopóki oferta nie jest kompletna.

## Główne pliki

- `src/legal/legalVariables.ts`
- `src/infrastructure/purchases/index.ts`
- `src/features/premium/PremiumPurchaseScreen.tsx`
- `src/application/account/AccountSessionProvider.tsx`
- `src/infrastructure/clients/patternlyBackendClient.ts`
- `plugins/withPrivacyBoundary.js`
- `app.config.js`, `.env.example`, `package.json`, `package-lock.json`
- backend: `src/domain/userStore.ts`, `src/api/routes.ts`, `src/services/dataExportService.ts`, `openapi/patternly.yaml`

## Weryfikacja

- frontend: typecheck `PASS`;
- frontend: runtime privacy boundary `PASS`;
- frontend: testy `844/844 PASS`;
- frontend: content boundary `PASS`;
- backend na emulatorach Auth + Firestore: `102/102 PASS`;
- iOS Simulator arm64, Debug, bez podpisu: `BUILD SUCCEEDED`, w grafie zależności obecne `RNPurchases`, `PurchasesHybridCommon` i `RevenueCat`;
- niezależny review: fail-closed checkout `PASS`; blokada duplikacji i zmiany sesji `PASS`.

## Ocena przed wdrożeniem

- dopasowanie do celu i architektury: 0,96;
- prostota: 0,89;
- ryzyko: 0,86;
- utrzymywalność: 0,94.

## Ryzyka i ograniczenia

- Prawdziwy zakup, anulowanie, odnowienie, zmiana ceny i restore wymagają docelowego produktu App Store, klucza RevenueCat oraz konta sandbox; nie zostały zasymulowane jako fałszywy sukces.
- Przed włączeniem `premiumCheckoutEnabled` trzeba uzupełnić co najmniej zakres usługi i dane operatora w `src/legal/legalVariables.ts`, utworzyć produkt `com.lkurczab.patternly.premium.monthly` i skonfigurować odpowiadającą ofertę RevenueCat.
- Trwałe potwierdzenie po potwierdzonym webhooku nie należy do operacji przed zakupem. Zostało jawnie przeniesione do następnego zadania `ODK-E2E-060`, które ma dostarczyć identyfikator transakcji oraz zapis żądania natychmiastowego startu na trwałym nośniku.
- Automatyczne testy ekranu nie wykonują StoreKit; ostateczny dowód pozostaje retestem sandbox E2E w `ODK-E2E-061`.

## Następne zadanie

`ODK-E2E-060` — kanały prawne i idempotentne potwierdzenie transakcyjne po webhooku.

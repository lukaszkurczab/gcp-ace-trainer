# ODK-E2E-069 — raport wykonania

Status: `WONT_FIX` — zastąpione decyzją product ownera

Data: 2026-09-06

## Wynik

Publiczny kanał usuwania konta został wycofany. Jedynym kanałem pozostaje istniejące usuwanie w uwierzytelnionej aplikacji z reautoryzacją, świadomym potwierdzeniem, wznowieniem po błędzie i dowodem wykonania. Endpointy publicznego odczytu dowodu oraz statusu pozostają, ponieważ są potrzebne aplikacji po usunięciu tożsamości Firebase.

Google Workspace SMTP Relay został podłączony wyłącznie jako dostawca wiadomości dla publicznych wniosków DSAR z ODK-E2E-077. Wiadomości są tekstowe, a konfiguracja jest wymagana w produkcji i podawana przez zmienne środowiskowe; hasło ma pochodzić z Secret Manager.

## Zmiany

- usunięto publiczne endpointy inicjowania i potwierdzania usunięcia konta, ich kontrakty, logikę, kolekcję i kody diagnostyczne;
- usunięto `publicDeletionUrl`, metody klienta, link i copy z aplikacji oraz fixture konfiguracji wydaniowej;
- zachowano operację in-app, status i dowód potrzebne do bezpiecznego wznowienia;
- zaktualizowano Terms i Privacy, aby wskazywały usuwanie z poziomu aplikacji;
- dodano produkcyjną kompozycję SMTP dla DSAR, konfigurację Google Workspace i dokumentację wdrożeniową;
- odświeżono OpenAPI i sprawdzono zgodność klienta mobilnego;
- zaktualizowano zależności bez zmian łamiących zgodność; usunięto wykrytą podatność wysoką w `fast-uri`.

## Najważniejsze pliki

- backend: `src/api/app.ts`, `src/modules/account-lifecycle/store.ts`, `src/modules/account-lifecycle/contracts.ts`, `src/config/environment.ts`, `src/index.ts`, `src/infrastructure/email/smtpPrivacyEmailSender.ts`, `src/api/openapi.ts`, `openapi/patternly-v1.json`;
- aplikacja: `src/infrastructure/clients/PatternlyApiClientAdapter.ts`, `src/infrastructure/clients/publicEnvironment.ts`, `src/infrastructure/firebase/publicConfig.ts`, `src/features/home/LegalInformationScreen.tsx`, `src/legal/privacyPolicy.ts`, `src/legal/termsOfService.ts`, `src/legal/legalVariables.ts`;
- operacje: `.env.example`, `docs/operations.md`, `docs/cloud-run-manual-deploy.md`, `docs/decision-register.md`.

## Weryfikacja

- backend lint, typecheck, build, TTL check, OpenAPI check i mobile-client contract check: PASS;
- backend testy cloud: 6/6 PASS;
- backend pełny zestaw z emulatorami Firebase: 70/70 PASS;
- SMTP: 3/3 PASS;
- aplikacja typecheck: PASS;
- aplikacja testy konfiguracji, klienta i in-app account lifecycle: 70/70 PASS;
- web build: PASS;
- niezależny QA: PASS, bez P0/P1;
- `git diff --check`: PASS po zakończeniu zmian.

## Ryzyka i ograniczenia

- produkcyjne dane Google Workspace (`SMTP_USERNAME`, `SMTP_PASSWORD`, adres nadawcy) pozostają wartościami do uzupełnienia przed wdrożeniem;
- repozytorium nie potwierdza, czy kolekcja `deletionRequests` kiedykolwiek powstała w chmurze. Jej kontrola i ewentualne usunięcie zostały dopisane do ODK-E2E-066, ponieważ wymagają polityki retencji i świadomego działania na danych;
- audyt zależności pozostawia sześć podatności umiarkowanych w łańcuchu `firebase-admin`/Google Cloud. Dostępna automatyczna naprawa proponuje niepoprawny downgrade z ryzykiem łamiącej zmiany, dlatego nie zastosowano `--force`.

## Ocena rozwiązania

- dopasowanie do celu i architektury: `0.95`;
- prostota: `0.94`;
- kontrola ryzyka: `0.93`;
- utrzymywalność: `0.92`.

Minimalna ocena: `0.92`.

## Następne zadanie

`ODK-E2E-072` — bezpieczeństwo schowka recovery codes.

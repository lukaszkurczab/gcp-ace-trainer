# ODK-E2E-064 — raport wdrożenia manifestu prywatności

Status: `PASS_PENDING_FINAL_ARTIFACT_RETEST`

Data: 2026-09-07

## Zmiany

- istniejący plugin `withPrivacyBoundary` jest jednym kanonicznym źródłem
  generowanego `PrivacyInfo.xcprivacy`;
- manifest zachowuje required-reason APIs i deklaruje osiem kategorii obecnej
  aplikacji: Name, Email Address, User ID, Device ID, Other User Content,
  Customer Support, Product Interaction i Other Diagnostic Data;
- wszystkie kategorie mają `Linked = true`, `Tracking = false` i cel
  `App Functionality`; globalny tracking jest wyłączony, bez tracking domains;
- Purchase History, Analytics i Advertising nie są deklarowane, ponieważ nie
  istnieją w bieżącym kodzie ani SDK;
- finalna transformacja usuwa `aps-environment` i `remote-notification`, ale
  zachowuje Sign in with Apple oraz lokalne przypomnienia;
- dodano krótką, ręczną macierz odpowiedzi App Store Connect.

## Pliki

- `plugins/withPrivacyBoundary.js`
- `scripts/nativePrivacyBoundary.test.ts`
- `docs/qa/ios-backend/ODK-E2E-064-DISCOVERY.md`
- `docs/qa/ios-backend/ODK-E2E-064-APP-STORE-DISCLOSURE.md`
- `docs/qa/ios-backend/E2E-OBSERVACJE-ROBOCZE.md`

## Weryfikacja

- testy pluginu: `4/4 PASS` w implementacji oraz rozszerzone niezależne
  kontrole kontraktowe `6/6 PASS`;
- pełny `qa:static`: `839/839 PASS`;
- typecheck, content boundary i runtime privacy boundary: `PASS`;
- czysty tymczasowy `expo prebuild --no-install --clean --platform ios`:
  `PASS`;
- `plutil` dla manifestu, Info.plist i entitlements: `PASS`;
- dokładnie jeden file reference, build file i wpis resources dla manifestu;
  ponowny prebuild bez clean nie tworzy duplikatów;
- niezależne QA `gpt-5.6-luna`, reasoning `max`: `PASS`, brak P0/P1;
- `git diff --check`: `PASS`.

## Ryzyka i blokery retestu

- bieżący artefakt nie ma jeszcze checkoutu StoreKit/RevenueCat, więc
  `Purchase History = No` opisuje wyłącznie aktualny kod;
- po ODK063 i ODK059 trzeba ponownie zbadać kod i SDK, zbudować finalny archive,
  wygenerować Xcode Privacy Report i ręcznie potwierdzić App Store Connect dla
  tego samego czystego SHA;
- istniejący ignorowany katalog `ios/` może zawierać stary wygenerowany stan;
  release musi zaczynać się od czystego prebuilda;
- pliki `docs/qa/` są ignorowane i wymagają jawnego uwzględnienia, jeśli mają
  stać się wersjonowanym release evidence.

Brak blokera dla przejścia do następnego zadania. Następne w kolejności:
`ODK-E2E-002.3`.

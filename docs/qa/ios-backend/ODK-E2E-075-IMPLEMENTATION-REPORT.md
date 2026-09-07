# ODK-E2E-075 — końcowy gate zgodności prywatności

Data weryfikacji: 2026-09-07
Status: `FIXED_PENDING_RETEST`

## Wynik

Lokalny runtime, konfiguracja repozytorium i automatyczne testy zgodności prywatności przechodzą. W ramach gate'u usunięto rozbieżność między faktycznym użyciem RevenueCat a opisem w Privacy Policy oraz macierzą App Store Connect.

Zadanie nie jest jednak całkowicie zamknięte. Odczyt aktywnej konfiguracji GCP sandbox wykazał 20 z 22 wymaganych polityk TTL. Brakuje TTL dla `legalRequests` i `legalRequestRateLimits`. Ponadto nie wykonano jeszcze finalnego raportu prywatności z archiwum Xcode ani testów na prawdziwych usługach App Store, RevenueCat, App Check i SMTP. Produkcyjne zmienne prawne nadal wymagają prawdziwych danych operatora, procesorów, regionów i transferów.

## Ocena rozwiązania przed zmianą

Pierwsza propozycja została odrzucona po niezależnej walidacji, ponieważ sam manifest repozytorium nie dowodzi aktywnej konfiguracji providera, a plan nie rozdzielał wystarczająco źródeł dowodów i odpowiedzialności za ręczne zatwierdzenie.

Po przeprojektowaniu:

- zgodność celu i architektury: `0,91`;
- prostota: `0,85`;
- ryzyko: `0,92`;
- utrzymywalność: `0,86`.

Minimalna ocena wynosi `0,85`, więc rozwiązanie spełnia próg `0,8`.

## Macierz zgodności

| Obszar | Dowód lokalny lub sandbox | Wynik | Pozostały gate |
| --- | --- | --- | --- |
| Privacy Policy EN/PL | Tekst korzysta ze zmiennych `src/legal/legalVariables.ts`; opisuje brak reklamowego/cross-app trackingu oraz odrębnie RevenueCat jako procesora historii zakupów dla subskrypcji i analityki zakupowej | PASS lokalny | Uzupełnić prawdziwe dane operatora, procesorów, odbiorców, regionów i transferów przed publikacją |
| Manifest prywatności iOS | `plugins/withPrivacyBoundary.js` i `scripts/nativePrivacyBoundary.test.ts`; Purchase History: linked, bez trackingu, App Functionality + Analytics | PASS lokalny | Wygenerować finalne archiwum i sprawdzić Xcode Privacy Report dla tego samego commita i builda |
| App Store disclosures | Macierz ODK-E2E-064 została uzgodniona z bieżącym manifestem i dokumentacją RevenueCat | PASS jako instrukcja wydania | Ręcznie porównać i zapisać formularz App Store Connect dla finalnego builda |
| Dane lokalne | Testy storage, sesji, danych konta i schowka recovery codes | PASS lokalny | Test na fizycznym urządzeniu i finalnym buildzie |
| Dane chmurowe i synchronizacja | Testy emulatora backendu, eksportu, usunięcia i żądań prawnych | PASS lokalny | Test na prawdziwym projekcie i kontach testowych |
| Procesorzy, regiony i transfery | Zmienne oraz tekst prawny mają jawne pola konfiguracyjne | PASS strukturalny | Wprowadzić i zatwierdzić prawdziwe wartości oraz dokumenty poza repozytorium |
| RevenueCat | Runtime i manifest ujawniają historię zakupów; opis Privacy został poprawiony | PASS lokalny | App Store sandbox, prawdziwy projekt RevenueCat i webhook |
| Retencja i TTL w repozytorium | Konfiguracja zawiera 22 polityki; test kontraktu TTL: 22/22 | PASS lokalny | — |
| Retencja i TTL w GCP sandbox | Odczyt tylko do odczytu: 20 polityk w stanie ACTIVE | BLOCKED_PROVIDER | Po osobnej autoryzacji wdrożyć i potwierdzić TTL dla `legalRequests` i `legalRequestRateLimits`; wymagane 22/22 ACTIVE |
| PITR i logi | Istniejący dowód providera: PITR 7 dni, logi operacyjne 30 dni, bucket/sink bezpieczeństwa 180 dni, region `europe-central2` | PASS sandbox według raportu ODK-E2E-066 | Ponownie potwierdzić przed wydaniem produkcyjnym |
| Eksport danych | Kontrakty backend/mobile i testy emulatora | PASS lokalny | Test end-to-end z prawdziwym backendem i dostarczeniem wiadomości |
| Delete account | Przepływ odbywa się w aplikacji; testy lifecycle i backendu obejmują usunięcie | PASS lokalny | Test na fizycznym urządzeniu z prawdziwym kontem; nie obiecywać odzyskania usuniętego postępu |
| Content reports | Ekrany, endpointy i testy surface/backend | PASS lokalny | App Check positive/negative oraz prawdziwy transport |
| Schowek recovery codes | Automatyczne czyszczenie i testy granicy schowka | PASS lokalny | Test systemowego schowka na fizycznym urządzeniu |
| App Check | Konfiguracja i lokalne kontrakty wejściowe są testowane | PASS lokalny | Prawdziwa atestacja: poprawny token, brak tokenu i niepoprawny token na publicznych endpointach |
| Prawa użytkownika | Reklamacja, odstąpienie, odwołanie, eksport i usunięcie mają przepływy runtime | PASS lokalny | Prawdziwy SMTP/Google Workspace, backend i ręczne potwierdzenie SLA/retencji |

## Wprowadzone poprawki

- `src/legal/privacyPolicy.ts`: usunięto zbyt szerokie stwierdzenie o braku zewnętrznej analityki. Tekst EN/PL rozróżnia teraz brak reklamowego i cross-app trackingu od przetwarzania historii zakupów przez RevenueCat na potrzeby subskrypcji i analityki zakupowej.
- `docs/qa/ios-backend/ODK-E2E-064-APP-STORE-DISCLOSURE.md`: macierz App Store Connect została uzgodniona z aktualnym manifestem — 9 kategorii, Purchase History jako linked, bez trackingu, cele App Functionality i Analytics.
- `docs/qa/ios-backend/E2E-OBSERVACJE-ROBOCZE.md`: status i obowiązkowe provider gate'y są zapisane jawnie.

Nie dodano hashy, podpisów, manifestów dokumentów prawnych, walidatorów ani testów samych tekstów prawnych.

## Wykonana weryfikacja

- mobile `npm run qa:static`: `847/847 PASS`, wraz z typecheck oraz testami granic privacy, recovery i content reports;
- skupiony zestaw Legal/Premium/Privacy: `79/79 PASS`;
- backend emulator: `110/110 PASS`;
- backend lint, typecheck, kontrakt TTL (`22/22`), OpenAPI, klient frontendowy i build: PASS;
- panel administratora: build PASS, testy zachowania `35/35 PASS`, testy konfiguracji `3/3 PASS`;
- odczyt GCP sandbox: `20/22 ACTIVE`; brak `legalRequests` i `legalRequestRateLimits`;
- oficjalna dokumentacja RevenueCat potwierdza wymaganie ujawnienia Purchase History oraz celów App Functionality i Analytics.

## Regresje

W ODK-E2E-061 wykryto wyścig w panelu obsługi spraw prawnych: operator mógł zacząć wpisywać odpowiedź podczas trwającej mutacji statusu, a późny snapshot usuwał tekst. Pola odpowiedzi i legal hold są teraz blokowane na czas mutacji. Końcowy przebieg panelu: `35/35 PASS`.

W ODK-E2E-075 wykryto rozbieżność opisu Privacy i macierzy ASC względem faktycznego użycia RevenueCat. Oba dokumenty robocze uzgodniono z runtime i manifestem.

## Obowiązkowy provider gate

Przed oznaczeniem zadania jako zamknięte należy:

1. Uzupełnić prawdziwe dane administratora, kontaktów, procesorów, odbiorców, regionów, transferów i RevenueCat oraz zweryfikować umowy pozostające poza repozytorium.
2. Po osobnej autoryzacji wdrożyć dwie brakujące polityki TTL i potwierdzić `22/22 ACTIVE` w docelowym GCP.
3. Zbudować czyste archiwum z konkretnego commita, zachować Xcode Privacy Report i porównać go z manifestem.
4. Dla tego samego builda ręcznie potwierdzić App Store Connect disclosures.
5. Wykonać App Check positive/negative: poprawny, brakujący i niepoprawny token na publicznych endpointach content report, legal request i privacy request.
6. Przetestować prawdziwe App Store sandbox/RevenueCat (zakup, anulowanie, restore, refund i zmiana ceny), SMTP/Google Workspace, eksport, usunięcie konta i schowek recovery codes na urządzeniu.

Zmiana SDK, konfiguracji RevenueCat lub manifestu prywatności wymaga ponownego przeglądu całej macierzy. Do spełnienia powyższych warunków status pozostaje `FIXED_PENDING_RETEST`.

## Następne zadanie

Brak. Zgodnie z zakresem prac zatrzymano się po ODK-E2E-075.

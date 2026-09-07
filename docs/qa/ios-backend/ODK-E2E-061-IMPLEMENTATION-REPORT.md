# ODK-E2E-061 — końcowy gate Legal/Premium

Data: 2026-09-07

Status: `FIXED_PENDING_RETEST`

## Wynik

Lokalny runtime Legal/Premium jest spójny z zatwierdzonym modelem produktu:
gość może uczyć się bez konta, samodzielna rejestracja i Premium wymagają
potwierdzenia wieku 18+, Polityka prywatności nie jest przedstawiana jako
zgoda, a miesięczny zakup bez triala wymaga osobnego żądania natychmiastowego
startu. Niepełna konfiguracja blokuje zdalny build lub sam checkout zamiast
udawać dostępność.

Nie zamknięto gate'u jako pełny PASS. Prawdziwy lifecycle App Store,
RevenueCat i Google Workspace SMTP wymaga providerowego retestu na docelowej
konfiguracji.

## Ocena przed zmianą

- zgodność celu i architektury: `0,94`;
- prostota: `0,92`;
- kontrola ryzyka: `0,88`;
- utrzymywalność: `0,91`;
- minimum: `0,88`.

Niezależna walidacja briefu: `gpt-5.6-luna`, reasoning `max`, `APPROVE`,
minimum `0,84`. Zalecono osobną macierz wyników lokalnych i providerowych.

## Macierz zgodności

| Wariant | Dowód lokalny | Wynik | Provider gate |
| --- | --- | --- | --- |
| EN/PL | osobne ekrany i copy locale; wspólna wersja Terms; locale zapisane w potwierdzeniu przed zakupem | PASS | sprawdzić ten sam build w obu locale |
| gość | nauka bez konta; publiczne kanały spraw chronione App Check | PASS | realny App Check i SMTP |
| konto i 18+ | niedomyślny checkbox łączy oświadczenie wieku z Terms; backend przyjmuje wyłącznie `minimumAgeConfirmed: 18` | PASS | Apple/Google/password na buildzie sandbox |
| osoba poniżej 18 lat | brak procesu opiekuna; bez potwierdzenia nie powstaje konto ani zakup; tryb gościa pozostaje | PASS | ręczny przebieg na urządzeniu |
| brak akceptacji Terms | rejestracja i potwierdzenie przed zakupem zawodzą jawnie | PASS | ręczny przebieg na urządzeniu |
| brak żądania natychmiastowego startu | CTA zakupu jest wyłączone; checkbox nie jest wstępnie zaznaczony | PASS | ręczny przebieg StoreKit |
| niepełna konfiguracja | zdalny prebuild wymaga Firebase, RevenueCat i produkcyjnego App Check; checkout pozostaje wyłączony przez `premiumCheckoutEnabled=false`; backend production wymaga RevenueCat i SMTP | PASS, fail-closed | uzupełnić prawdziwe wartości bez zmiany kodu |
| oferta | adapter dopuszcza wyłącznie właściwe SKU, `P1M`, auto-renewable, bez intro price i discounts; cena pochodzi ze storefrontu | PASS | potwierdzić SKU/cenę/podatki w App Store sandbox |
| zakup i anulowanie | anulowanie StoreKit ma osobny wynik; potwierdzenie przed zakupem jest związane z kontem i pojedynczą aktywną próbą | PASS lokalny | prawdziwy zakup i cancel sheet |
| restore | osobna akcja; backendowy transfer przenosi projekcję atomowo i bez replay | PASS lokalny | restore na drugim urządzeniu/konto sandbox |
| refund i wygaśnięcie | webhook odbiera dostęp dopiero na terminalnym zdarzeniu; refund/customer-support expiration i replay/out-of-order są idempotentne | PASS lokalny | rzeczywisty refund providerowy |
| zmiana ceny/produktu | bieżąca cena jest odczytywana ze storefrontu; `PRODUCT_CHANGE` nie fabrykuje zmiany entitlementu | PASS lokalny | App Store price-consent/product-change |
| trwałe potwierdzenie | zakup jest wiązany z dokładną transakcją i żądaniem natychmiastowego startu; SMTP wysyła idempotentny tekstowy receipt | PASS lokalny | webhook RevenueCat + docelowa skrzynka SMTP |
| reklamacja | konto i gość, termin 14 dni, odpowiedź i 6 lat retencji od zamknięcia | PASS | docelowy SMTP i operacyjna skrzynka |
| odstąpienie | osobny rodzaj sprawy, bez wymaganego uzasadnienia | PASS | docelowy SMTP |
| odzyskanie danych nieosobowych | osobny kanał; implementacja nie obiecuje niepustego zakresu ani odzyskania usuniętego postępu | PASS | docelowy SMTP |
| odwołanie | kanał przyjmuje odwołanie bez tworzenia pozornego runtime zawieszeń | PASS | docelowy SMTP; realna sprawa tylko jeśli zawieszenie faktycznie wystąpi |
| Delete account | wyłącznie przepływ in-app; reautoryzacja, wznowienie, lokalny cleanup i zdalny dowód; nie anuluje subskrypcji App Store | PASS lokalny | konto sandbox z aktywną subskrypcją |

Porównano wykonywalne zachowanie z Terms i Privacy. Nie utworzono testów,
hashy, podpisów, manifestów ani walidatorów dokumentów prawnych.

## Znaleziona i naprawiona regresja

Pełny test panelu ujawnił wyścig w sprawie konsumenckiej: podczas mutacji
`received -> in_review` pole odpowiedzi pozostawało edytowalne, ale późniejszy
snapshot serwera resetował wpisany tekst. `LegalRequestsPanel` blokuje teraz
pola odpowiedzi i uzasadnienia legal hold na czas zapisu, tak jak przyciski.
Ponowienie potwierdziło cały lifecycle reklamacji.

Zmieniony plik produkcyjny:

- `patternly-web/src/components/LegalRequestsPanel.jsx`.

## Weryfikacja

- aplikacja `npm run qa:static`: `847/847 PASS`, typecheck, recovery inventory,
  content boundary i runtime privacy boundary `PASS`;
- aplikacja — ukierunkowany gate konta, deletion, purchase, App Check,
  recovery-code clipboard, raportów i manifestu: `79/79 PASS`;
- backend na emulatorach Auth + Firestore: `110/110 PASS`;
- backend lint, typecheck, TTL (`22` polityki), OpenAPI, zgodność klienta i
  build: `PASS`;
- panel WWW: build `PASS`, admin behavior po poprawce `35/35 PASS`, admin
  config `3/3 PASS`;
- wcześniejsze pierwsze uruchomienie panelu: `34/35`, potwierdziło naprawiony
  wyścig Legal; kolejne uruchomienie po poprawce miało niezależny przejściowy
  timing failure DSAR `34/35`, a końcowe pełne ponowienie `35/35 PASS`;
- próby bez uprawnienia do lokalnych portów zostały odrzucone przez sandbox i
  nie są liczone jako wynik testów.

## Dokładny provider gate

Na jednym docelowym buildzie i koncie App Store sandbox trzeba wykonać:

1. EN i PL; password, Apple i Google; gość oraz konto; brak potwierdzenia 18+
   i brak żądania natychmiastowego startu.
2. Zakup właściwego miesięcznego SKU bez triala, anulowanie arkusza zakupu,
   wyłączenie odnowienia, restore, wygaśnięcie, refund oraz zmianę ceny/produktu.
3. Dla każdego zdarzenia potwierdzić webhook RevenueCat, projekcję konta,
   zachowanie dostępu i brak podwójnego przetworzenia.
4. Potwierdzić receipt oraz odbiór reklamacji, odstąpienia, odzyskania danych i
   odwołania przez docelowy Google Workspace SMTP.
5. Usunąć konto w aplikacji i potwierdzić lokalne/chmurowe skutki oraz to, że
   subskrypcja App Store nie została automatycznie anulowana.

Do czasu tego przebiegu status pozostaje `FIXED_PENDING_RETEST`.

## Następne zadanie

`ODK-E2E-075` — końcowy gate zgodności prywatności. Nie przechodzić dalej.

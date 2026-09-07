# ODK-E2E-062 — discovery lokalizacji i storefrontów

Status: `WONT_FIX`

Data: 2026-09-07

## Decyzje wiążące

Właściciel produktu zatwierdził sprzedaż miesięcznej, automatycznie odnawianej
usługi przez App Store w Polsce i pozostałych krajach UE oraz polecił trzymać
ceny, dane operatora i identyfikator produktu jako zmienne w
`src/legal/legalVariables.ts`.

Jednocześnie odrzucono rozbudowaną infrastrukturę dokumentów. Opisana w
ODK-E2E-062 osobna konfiguracja każdego kraju/storefrontu, generowanie wariantów
i walidatory odrzucające konfigurację byłyby kolejną równoległą warstwą
konfiguracji, sprzeczną z tym uproszczeniem.

## Stan repozytorium

- wszystkie wymagane pola oferty, operatora, merchant of record, ADR i
  terytoriów istnieją jako wartości EN/PL w `src/legal/legalVariables.ts`;
- oba dokumenty pobierają te wartości bezpośrednio z tego pliku;
- nie ma jeszcze SDK StoreKit/RevenueCat ani produkcyjnego checkoutu;
- zatem aplikacja nie ma jeszcze rzeczywistego produktu App Store, z którego
  można pobrać cenę właściwą dla bieżącego storefrontu.

## Ocena przed zmianą

- zgodność z celem i architekturą: 0,97;
- prostota: 0,98;
- ryzyko: 0,91;
- utrzymywalność: 0,97;
- minimum: 0,91.

## Wynik

ODK-E2E-062 w pierwotnym kształcie otrzymuje `WONT_FIX`. Nie dodano macierzy
krajów, generatorów, fallbacków ani walidatorów.

Minimalny obowiązujący kontrakt dla późniejszego ODK-E2E-059 jest następujący:

- dokument opisuje model sprzedaży i korzysta z zaakceptowanych zmiennych;
- checkout pokazuje lokalną cenę z podatkami zwróconą przez produkt App Store,
  a nie cenę wybraną na podstawie ręcznej tabeli krajów w aplikacji;
- brak możliwego do pobrania produktu lub ceny ma jawnie uniemożliwić zakup;
- dane operatora i opis relacji Apple–Operator zostaną ręcznie uzupełnione w
  `legalVariables.ts` przed publikacją.

Nie jest to implementacja checkoutu; ten zakres pozostaje w ODK-E2E-059 po
wdrożeniu lifecycle RevenueCat w ODK-E2E-063.

## Weryfikacja

- przejrzano dokumenty, zmienne i zatwierdzony projekt ODK-E2E-057;
- potwierdzono brak produkcyjnego SDK zakupu i produktu/SKU;
- nie zmieniono kodu wykonywalnego, więc nie uruchamiano testów aplikacji.

## Ryzyka i blokery

Zakup pozostaje niedostępny do czasu skonfigurowania App Store/RevenueCat i
uzupełnienia prawdziwych wartości. Nie blokuje to zamknięcia zbędnej macierzy
storefrontów, lecz jest zależnością ODK-E2E-063 i ODK-E2E-059.

Następne zadanie: `ODK-E2E-063`.

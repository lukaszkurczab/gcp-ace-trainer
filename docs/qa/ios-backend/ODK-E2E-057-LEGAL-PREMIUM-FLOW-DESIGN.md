# ODK-E2E-057 — minimalny projekt przepływu Legal/Premium

Status: `APPROVED`

Decyzja PO 2026-09-06: Premium jest aktywne od pierwszego wydania jako miesięczna, automatycznie odnawiana usługa cyfrowa, uruchamiana natychmiast po zakupie, bez okresu próbnego, sprzedawana w Polsce i pozostałych krajach UE przez App Store. Cena, dane operatora i identyfikator produktu pozostają zmiennymi w `src/legal/legalVariables.ts`.

## Stan zastany

- Rejestracja ma jeden checkbox łączący akceptację Warunków i Polityki Prywatności. Dokumenty otwierają się wewnątrz aplikacji.
- Tryb gościa działa bez konta.
- Produkcyjny zakup Premium nie istnieje. Repozytorium ma wyłącznie model uprawnienia, endpoint odczytu i przełącznik testowy.
- Nie istnieją SKU, paywall, zakup, trial, przywracanie zakupów ani zarządzanie subskrypcją.
- Nie istnieją operacyjne ścieżki reklamacji konsumenckiej, odstąpienia, żądania danych i odwołania od zawieszenia. Zgłoszenie błędu treści nie jest reklamacją.
- Dane operatora, sprzedawcy, oferty i kanałów prawnych pozostają edytowalnymi placeholderami w `src/legal/legalVariables.ts`.

## Minimalny projekt

### 1. Rejestracja konta

- Konto samodzielne pozostaje 18+, zgodnie z decyzją PO z 2026-09-05; nauka gościnna pozostaje dostępna bez konta.
- Jedyny wymagany, domyślnie wyłączony checkbox: „Mam co najmniej 18 lat i akceptuję Warunki świadczenia usług”. „Warunki świadczenia usług” jest linkiem do dokumentu.
- Polityka Prywatności jest osobnym linkiem z informacją „Przeczytaj, jak przetwarzamy Twoje dane”; nie jest przedstawiana jako zgoda.
- Brak checkboxów marketingowych, dopóki aplikacja nie prowadzi takiego przetwarzania.
- Przycisk utworzenia konta jest niedostępny do czasu złożenia wymaganego oświadczenia.

### 2. Premium

Premium ma aktywne wejście od pierwszego wydania. Zakup pozostaje niedostępny, dopóki wymagane zmienne oferty i integracja płatności nie są uzupełnione. Jeden przewijalny ekran przed zakupem pokazuje:

- nazwę i zakres usługi;
- cenę łączną z podatkami, okres rozliczeniowy oraz cenę i termin automatycznego odnowienia;
- warunki triala albo jasny brak triala;
- sprzedawcę/merchant of record, metodę i moment obciążenia;
- sposób anulowania i informację, że usunięcie konta nie anuluje subskrypcji;
- osobny, domyślnie wyłączony checkbox żądania natychmiastowego rozpoczęcia usługi z informacją o proporcjonalnym rozliczeniu po odstąpieniu;
- końcowy przycisk „Kup za {cena}” / „Zamawiam i płacę”, nigdy ogólne „Kontynuuj”.

Nie dodajemy checkboxa utraty prawa odstąpienia, jeśli Premium jest ciągłą usługą cyfrową. Taki checkbox jest potrzebny dopiero wtedy, gdy oferta obejmie odrębnie dostarczaną treść cyfrową bez nośnika.

### 3. Obsługa po zakupie

- „Zarządzaj subskrypcją” otwiera systemowy kanał sklepu i wyjaśnia, że zatrzymuje przyszłe odnowienie, a nie usuwa konta.
- „Przywróć zakupy” jest niezależną akcją i nie kupuje ani nie odnawia subskrypcji.
- Potwierdzenie zakupu i oświadczenia o natychmiastowym starcie trafia na trwały nośnik po zakupie.

### 4. Kanały prawne

Ekran Legal information otrzymuje cztery rozróżnialne wejścia, bez checkboxów:

1. Reklamacja usługi — niezależna od 14-dniowego odstąpienia.
2. Odstąpienie od umowy — bez obowiązkowego uzasadnienia.
3. Prawa do danych — wybór żądania RODO.
4. Odwołanie od zawieszenia — niezależne od reklamacji.

Każda ścieżka pokazuje skutek, kanał kontaktu i potwierdzenie odbioru. Implementacja operacyjna należy do ODK-E2E-060.

## Zatwierdzona decyzja checkoutu

- Miesięczna, automatycznie odnawiana usługa cyfrowa.
- Dostęp rozpoczyna się natychmiast po zakupie na odrębne żądanie użytkownika.
- Brak okresu próbnego i brak odrębnej jednorazowej dostawy treści cyfrowej.
- Sprzedaż przez App Store w Polsce i pozostałych krajach UE.
- Cena początkowa z podatkami, cena odnowienia z podatkami, dane operatora i identyfikator produktu są zmiennymi do uzupełnienia w `src/legal/legalVariables.ts`.

## Ocena rozwiązania

- Dopasowanie do celu i architektury: 0,96 — wykorzystuje istniejące ekrany i nie udaje nieistniejącego checkoutu.
- Prostota: 0,95 — trzy istotne decyzje użytkownika, bez zbędnych zgód i nowych abstrakcji.
- Ryzyko: 0,90 — pozostaje zależność od decyzji handlowych, App Store i trwałego potwierdzenia.
- Utrzymywalność: 0,94 — dane zmienne pozostają w jednym istniejącym pliku.

## Weryfikacja discovery

- Przegląd implementacji rejestracji, dokumentów, routingu, modelu entitlementu, klienta API i testowego przełącznika Premium.
- Niezależna inwentaryzacja techniczna: brak produkcyjnego checkoutu, SKU, restore i kanałów prawnych.
- Niezależny review prawny PL/UE po decyzji PO: `APPROVE` 0,97. Warunkiem wydania jest cena brutto z aktualnego storefrontu Apple oraz zgodny z umową opis relacji Apple–Operator; realizacja należy do ODK-E2E-062.
- Niezależny QA: `PASS`; ceny, dane operatora i identyfikator są zmiennymi używanymi w obu wersjach Terms, bez pozostałości pól triala i ogólnego opisu ceny.
- `npm run typecheck`: `PASS`.
- `git diff --check`: `PASS`.
- Nie zmieniono kodu produkcyjnego i nie dodano testów dokumentów.

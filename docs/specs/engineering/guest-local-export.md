# GUEST-EXPORT-01 — lokalny eksport danych Gościa

Status i kolejność określa [plan główny](../../PATTERNLY-WORKING-PLAN.md). Zadanie jest przed pierwszym wydaniem iOS. Wynika z korekty właściciela z 07.10: Gość ma lokalne dane i nie musi podawać e-maila ani potwierdzać tożsamości, aby je pobrać. Ten dokument opisuje zmianę do wykonania; nie potwierdza jej implementacji.

## Problem i dowody w repozytorium

W aplikacji `src/features/home/yourDataPresentation.ts`, funkcja `getYourDataPresentation`, wybiera dla stanu `guest` akcję `guestPrivacy`. `YourDataScreen.tsx` kieruje tę akcję do `PRIVACY_REQUESTS`. `PrivacyRequestsScreen.tsx` otwiera wtedy `GuestPrivacyRequestsScreen`, który wymaga wpisania e-maila i wywołuje backendowy proces weryfikacji kodu.

Istniejąca akcja eksportu w `YourDataScreen.tsx` działa tylko dla `authenticated`. Polecenie `exportAccountData` w `src/application/account/AccountSessionProvider.tsx` wymaga klienta uwierzytelniania i API, pobiera dane konta z serwera, a potem przekazuje je do systemowego udostępnienia. `accountDataExportService.ts` waliduje format `account-data-export-v1` z kontekstem konta. Nie jest to lokalny eksport Gościa. Test `yourDataPresentation.test.ts` utrwala obecną akcję mailową dla Gościa.

Normatywne dokumenty workspace `docs/01-product-definition.md` oraz `docs/08-storage-and-offline.md` określają lokalny profil i dane nauki Gościa. Dokumenty 01 i 09 dopuszczają osobne zgłoszenia o danych powstałych przez funkcje sieciowe; nie oznacza to, że lokalne dane nauki są na serwerze. Obecny główny widok nie zapewnia żądanego eksportu.

## Docelowe zachowanie i odpowiedzialności

Aktywny Gość wybiera eksport w „Your data”. Aplikacja odczytuje dane wyłącznie jego bieżącego lokalnego profilu, tworzy poprawny plik JSON i przekazuje go do systemowego udostępnienia lub zapisu. Funkcja działa bez sieci, konfiguracji Firebase, App Check, backendu, e-maila i kodu weryfikacyjnego. To odczyt i eksport; nie rejestruje konta, nie uruchamia adopcji ani synchronizacji.

Koordynacja należy do warstwy aplikacyjnej. Dane odczytują kanoniczni właściciele repozytoriów; ekran nie importuje MMKV i nie wykonuje surowego zrzutu całego magazynu. Wykorzystać istniejące mechanizmy zapisu pliku i udostępnienia tam, gdzie mają właściwy kontrakt. Nie udawać danych konta, aby przejść walidator eksportu konta.

Przed implementacją zinwentaryzować pola eksportu i przypisać je do producentów. Zakres obejmuje dostępne lokalne dane użytkownika: próby i wyniki, postęp i kolejkę powtórek, cele i zaakceptowane plany oraz ustawienia. Uwzględnić rzeczywiście utrwalony stan aktywnej sesji i szkicu, jeżeli istnieje. Manifest pliku ma jawnie opisywać zawarte kategorie oraz uzasadnione pominięcia. Nie dołączać danych innych kont i profili, sekretów, tokenów, kodów odzyskiwania, dzienników infrastruktury ani całych banków pytań i cache jako danych użytkownika.

Odczyt musi być spójny i związany z tożsamością bieżącego profilu. Zmiana Gościa na konto, przełączenie profilu albo konkurencyjna zmiana danych nie może doprowadzić do udostępnienia mieszanego lub obcego pliku. Użyć obecnych mechanizmów spójnego odczytu i kontroli rewizji. Jeśli trwająca mutacja lub uszkodzone dane uniemożliwiają wiarygodny odczyt, pokazać konkretny stan niedostępności lub możliwość ponowienia; nie raportować sukcesu z pustymi danymi.

## Zakres zmiany i usunięcia zastąpionej ścieżki

- Zmienić wybór głównej akcji Gościa w `yourDataPresentation.ts` i jej wykonanie w `YourDataScreen.tsx` na lokalny eksport. Oddzielić ją od eksportu konta wymagającego serwera i od formularza zgłoszenia sieciowego.
- Dodać brakującą koordynację odczytu i eksportu w istniejącej warstwie aplikacyjnej, po sprawdzeniu aktualnych repozytoriów profilu i danych. Lokalny profil Gościa, a nie sesja Firebase, określa właściciela danych.
- Dostosować walidację formatu i współdzielenie obsługi pliku tylko w zakresie rzeczywistego ponownego użycia. Nie tworzyć drugiego magazynu postępu, backendowego endpointu eksportu Gościa ani trwałej kopii eksportowanych danych.
- Usunąć skierowanie lokalnego eksportu do kodów mailowych oraz testy i teksty utrwalające ten błąd. Uzgodnić teksty we wszystkich siedmiu wersjach językowych.
- Zachować istniejącą ochronę osobnych zgłoszeń o danych serwerowych oraz procesy konta, zakupu i odzyskiwania. Sprawdzić odnośniki, trasy i konsumentów przed usunięciem jakiegokolwiek modułu; nazwa `GuestPrivacyRequestsScreen` sama nie jest dowodem nieużywanego kodu.

## Weryfikacja i kryteria odbioru

Wymagane testy zachowania: eksport rzeczywistego lokalnego zestawu Gościa, poprawna struktura JSON, pusty nowy profil, dostępne ustawienia i aktywna sesja, brak zmiany danych przez eksport oraz jawny manifest zakresu. Testy eksportu konta nadal muszą przechodzić.

Wymagane testy negatywne: brak sieci i klientów uwierzytelniania/API nie blokuje eksportu; brak wywołań backendu i SMTP; inne konto lub stary Gość nie trafia do pliku; przełączenie profilu lub zmiana rewizji przed udostępnieniem nie ujawnia danych; uszkodzony rekord, awaria pliku, anulowanie i niedostępne udostępnienie dają właściwy wynik. Plik tymczasowy ma właściciela, jest sprzątany po operacji, a pozostałości po przerwaniu obsługuje istniejący mechanizm startu bez usuwania cudzych plików. Wybrana przez użytkownika kopia zapisana poza aplikacją pozostaje zgodnie z działaniem systemowego udostępnienia.

Na jednym istniejącym symulatorze iPhone 17 wykonać eksport Gościa offline bez logowania i e-maila, wybrać rzeczywisty zapis lub udostępnienie i sprawdzić zawartość pliku względem danych wejściowych. Potwierdzić zachowanie danych źródłowych, brak cudzych profili i brak mailowego formularza na głównej ścieżce eksportu. Dodatkowy odbiór finalnej wersji na fizycznym urządzeniu należy do właściwego zakresu ODK-E2E-088; nie zastępuje testu lokalnego.

Zadanie jest wykonane, gdy aktywny Gość może lokalnie wyeksportować swoje dane zgodnie z manifestem, bez podawania adresu i uwierzytelniania, a izolacja, spójność, błędy i sprzątanie mają rzeczywiste dowody. Samo przemianowanie przycisku albo atrapowy JSON nie spełnia odbioru.

## Zależności, ryzyka i granice

Wykorzystać aktualnych właścicieli profilu, danych nauki, sesji i szkiców oraz istniejący kontrakt systemowego udostępnienia. Wynik jest wymagany w odpowiednim zakresie AUD-06. Braki integralności ujawnione podczas prac powiązać z właściwymi zadaniami PERSIST, bez zamieniania eksportu w ogólną przebudowę persistence.

Główne ryzyka to ujawnienie danych innego profilu i niespójny odczyt podczas mutacji. Najmniejsza korekta obejmuje lokalną operację eksportu, główną akcję UI, kontrakt pliku i dowody tego zachowania. Poza zakresem są import kopii do aplikacji, zmiana adopcji lub synchronizacji, usuwanie danych serwerowych, wdrożenia, nowe kanały mailowe i przebudowa całego procesu zgłoszeń prywatności.

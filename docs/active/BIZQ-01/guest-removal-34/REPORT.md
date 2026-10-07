# BIZQ-01: usunięcie lokalnego Guest — raport

**Stan na 7 października 2026 r.** Implementacja usunięcia konkretnego, lokalnego profilu Guest została wykonana, a jej ograniczone kryteria akceptacji przeszły niezależny przegląd. Ten pakiet domyka wyłącznie swój zakres; nie oznacza pełnej akceptacji BIZQ-01 ani gotowości wydania.

## Implementacja

Transakcja tworzy nowy profil Guest, zapisuje trwały dziennik operacji, aktualizuje oba naprzemienne wpisy rejestru przed usunięciem kluczy starego profilu, a następnie weryfikuje stan chroniony. Odzyskiwanie zachowuje monotoniczny etap `cleanup`: po przerwaniu nie cofa dziennika do wcześniejszego etapu ani nie tworzy kolejnego profilu zastępczego. Testy obejmują ponowne przerwanie podczas sprzątania i ochronę pozostałych profili oraz stanu globalnego.

## Ograniczona akceptacja

Niezależne QA zaakceptowało jednorazową operację na iPhonie 17 oraz odczyt po zwykłym, zimnym uruchomieniu. Usunięto **84 klucze** dokładnie wskazanego Guest. Po uruchomieniu jego stary fizyczny prefiks miał **0 kluczy**; oba prawidłowe wpisy rejestru pomijały stary profil i wskazywały ten sam nowy Guest; dziennik operacji był pusty. Zachowano dziewięć kont oraz porównane hashe stanu kont, stanu globalnego i kontroli wylogowania, wraz z sześcioma oczekującymi parami. Nowy Guest miał trzy wartości metadanych, zero rekordów i brak aktywnej sesji lub pozostałości canary. Szczegóły: [wynik usunięcia](./STAGE2-NATIVE-REMOVAL.json), [wynik po zimnym uruchomieniu](./STAGE2-NATIVE-POST-COLD.json) i [niezależne QA storage](./STAGE2-NATIVE-QA.json).

Osobne, ograniczone QA interfejsu potwierdziło zwykłe pierwsze uruchomienie nowego Guest, wybór ścieżki OOD, kontynuację i powrót do Home bez rozpoczęcia sesji ani otwarcia pytania. W pierwszej próbie akcję Continue zasłaniał komunikat developerski; zaktualizowany przebieg zamykał widoczny toast przed kontynuacją i zakończył się powodzeniem. To pojedyncza ścieżka na jednym symulatorze, nie pełny audyt UI, dostępności, motywów ani rozmiarów tekstu. [Raport QA UI](./STAGE2-POST-COLD-HOME-UI-QA.json) i [przebieg](./post-cold-home.yaml).

Weryfikacja statyczna pakietu aplikacji wykazała 1915 zaliczonych kontroli z 1919; pozostałe cztery to istniejące pominięcia. Kontrole wykonano na faktycznie konsumowanym content `cf119c3` z historycznym `cc3efca`, nie na nieopublikowanym foreign producer `4b0f1ff`. Końcowy odczytowy helper sprawdzający stary prefiks przeszedł później testy ukierunkowane, `typecheck` i `recovery:check`. Te kontrole nie są dowodem skuteczności edukacyjnej.

## Granice wyniku

To **bounded acceptance** zakresu lokalnego usunięcia Guest i opisanej kontynuacji do Home. **Pełna akceptacja Q13/BIZQ-01 pozostaje otwarta**; pakiet nie dowodzi całkowitego wymazania całego magazynu ani historycznej kompletności wszystkich danych poza porównanymi kategoriami. **Gotowość release również pozostaje otwarta.** Nie zmierzono skuteczności edukacyjnej.

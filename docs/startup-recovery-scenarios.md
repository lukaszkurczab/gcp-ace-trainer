# Scenariusze uruchamiania i odzyskiwania konta

Data analizy: 2026-09-04. To macierz oczekiwanego zachowania i weryfikacji; opis scenariusza nie oznacza, że został wykonany na urządzeniu.

`App.tsx` umieszcza `ContentPreparationGate` przed nawigacją i providerem konta. Przygotowanie danych lokalnych poprzedza więc odtwarzanie logowania. Sam powrót z tła nie montuje ponownie tych komponentów i nie powinien wyświetlać ekranów startowych od nowa.

| Scenariusz | Oczekiwany ekran i tekst | Akcja i przejście | Obserwacja / granica czasu |
| --- | --- | --- | --- |
| Cold start, poprawne dane | „Preparing content…” oraz opis aktualnej fazy | Bez CTA podczas pracy; po przygotowaniu odtworzenie konta lub wejście do aplikacji | `patternly:content:preparing:opening-storage`; 15 s na cały bootstrap |
| Otwieranie magazynu | „Opening local learning data…” | Dalej do odzyskiwania stanu | Wspólny limit 15 s, bez sztucznego minimalnego opóźnienia |
| Odzyskiwanie dziennika | „Checking saved learning state…” | Dalej dopiero po odzyskaniu spójności | `patternly:content:preparing:recovering-learning-state`; nie kasować dziennika w celu ominięcia błędu |
| Weryfikacja pakietów | „Verifying installed learning content…” | Dalej po poprawnej walidacji | `patternly:content:preparing:verifying-content` |
| Relaunch z zapisaną sesją nauki | „Restoring your active session…” pod nagłówkiem przygotowania treści | Odtworzenie sesji i jej zegara; następnie logowania | `patternly:content:preparing:resuming-session`; wspólny limit 15 s |
| Zwykły powrót z tła | Bieżący ekran aplikacji | Bez ponownego pełnoekranowego bootstrapu | Osobno od relaunch procesu; sprawdzić wznowienie zegara |
| Brak lub niepoprawny pakiet | „Application unavailable” i zredagowany kod przyczyny | Retry uruchamia przygotowanie od początku | `patternly:content:unavailable`; bez ukrywania brakującej treści |
| Timeout przygotowania | „Application unavailable” z informacją o fazie przekroczenia limitu | Retry wraca do `opening-storage` | Po 15 s; spóźniony wynik nie zastępuje stanu końcowego |
| Development audit reset | Przygotowanie od `opening-storage` | Gotowość dopiero po zakończeniu ponownego bootstrapu | Listener `patternly:content:audit-command-listener:ready`, wynik `patternly:content:ready-after-audit-reset`; reset tylko izolowanych danych testowych |
| Zapisane logowanie Google | „Restoring session” / „Checking saved sign-in.” | Jeden przebieg finalizacji i właściwe konto | Rozróżnić zapis Firebase, pozyskanie tokenu, `/v1/me` i synchronizację danych |
| Brak odpowiedzi inicjalizacji Firebase | Jawny komunikat o nieukończonym odtworzeniu sesji | Retry ponawia obserwację, odłączając poprzedniego obserwatora; zachować zapis użytkownika | Limit inicjalizacji 15 s; nie utożsamiać ponownej obserwacji z ponowną inicjalizacją wewnętrznego singletonu Firebase |
| Zachowany dostęp gościa przy danych konta | Komunikat o powiązaniu postępów i przycisk logowania | Dostęp do formularza bez możliwości wejścia jako gość | Potwierdzono na istniejącej instalacji symulatora: `account_bound` i zachowany grant; bez resetu danych |
| Brak zapisanego logowania | Krótkie odtwarzanie, następnie ekran logowania albo wcześniej wybrany tryb gościa | Bez automatycznego tworzenia konta | Nie wymuszać widoczności krótkich faz przez opóźnienia |
| Network flapping w trakcie odtwarzania | Przygotowanie lokalne pozostaje niezależne od sieci; konto kończy się sukcesem albo jawnym stanem odzyskiwania | Ponowienie po odzyskaniu sieci; zachować zapis sesji i lokalny postęp | Nie zakładać automatycznego listenera sieci; testować token, HTTP oraz odczyt body osobno |
| Offline przy synchronizacji | Jeden komunikat o lokalnie zapisanych zmianach | Retry; wyjście respektuje niesynchronizowane dane | `account-sync-pending`, `account-sync-retry`; błąd sieci nie może oznaczać pustego konta |
| Dane urządzenia należą do innego konta | Jeden komunikat o niezgodnym powiązaniu konta | Powrót do logowania właściwego konta; bez synchronizacji do nowego UID | Zachować binding i dataset, nie przepisywać właściciela |
| Konflikt rewizji lub rekordu | Jeden komunikat o konflikcie | Jawna instrukcja rozwiązania; nie obiecywać nieistniejącego wyboru wersji | Zachować outbox i dane serwera; zwykłe ponowienie tej samej rewizji nie rozwiązuje konfliktu |
| Wylogowanie lub zmiana UID podczas odpowiedzi | Aktualny stan nowej generacji sesji | Spóźniona odpowiedź nie przywraca poprzedniego konta | Testować odpowiedź przed i po odczycie `/v1/me` |

## Reguły wizualne

Ekrany startowe mają jeden komunikat, opis rzeczywistej fazy i jeden wskaźnik oczekiwania. Brak procentów lub symulowanego postępu. Treść i działania odzyskiwania muszą pozostawać dostępne przy dużej czcionce i na małym ekranie. Retry jest główną akcją dla ponawialnego stanu, wyjście z konta pozostaje odrębną akcją. Błąd działania nie może tworzyć drugiego nagłówka opisującego tę samą awarię.

## Historia i ograniczenia dowodów

Wejściowe zmiany zapisano w `artifacts/account-startup/2026-09-04/entry.diff` katalogu nadrzędnego. Historia zawiera rozbudowany branded skeleton przygotowania treści oraz kompaktowy loader odtwarzania logowania. Lokalne zmiany obecne przed tą sesją upraszczały przygotowanie treści do wspólnego `LoadingState` i dodawały logo. Zachowanie tego kierunku nie jest dowodem identyczności z zaakceptowanym wcześniej zrzutem.

## Kontrole urządzeniowe

- Realne Google OAuth: pierwsze logowanie, zamknięcie procesu, ponowne uruchomienie, odświeżenie tokenu i przerwanie sieci. Wymaga konta testowego i właściwego środowiska; sam test adaptera nie weryfikuje ekranu zgody Google.
- Potwierdzenie kodu błędu zgłoszonego starego konta. Nie przypisywać konkretnej przyczyny wyłącznie na podstawie ogólnego nagłówka „Account sync needs attention”.
- Jasny/ciemny motyw, mały ekran, duża czcionka i czytnik ekranu dla przygotowania, odtwarzania oraz każdego komunikatu odzyskiwania.
- Audit reset, uszkodzone treści i trwały timeout wykonywać na izolowanej instalacji. Nie resetować danych właściciela do uzyskania zrzutu.
- Przerwana operacja serwerowa: timeout klienta nie cofa zapisu na serwerze. Zweryfikować ponowienie z tą samą identyfikacją mutacji, bez duplikacji lub utraty postępu.

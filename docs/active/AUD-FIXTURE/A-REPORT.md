# AUD-FIXTURE/A — granice bezpiecznego fixture

**Data:** 24.09.2026

**Status:** `done` dla inventory i granic A, z otwartą wykonalnością atestacji urządzenia. B zaczyna się od bramki go/no-go przed przejściem guest na iPhonie.

**Ocena przed zmianą dokumentacji:** zgodność z celem i architekturą 0,94; prostota 0,92; ryzyko 0,84; utrzymywalność 0,90; minimum 0,84. Projekt wykorzystuje istniejący router profili i izolację emulatora, bez nowej aktywnej ścieżki danych w produkcji. Ryzyko 0,84 obejmuje brak gotowej atestacji urządzeniowej; nie jest to twierdzenie, że jest już wykonalna.

## Ustalony stan i granice

- Na istniejącym iPhonie 17 jest zachowany lokalny profil przypisany do innego konta. Nie znamy jego danych logowania. AUD-17 potwierdził tylko ekran Account Entry przez Maestro, bez przełączenia na guest; obecny plik `.maestro/account-register-e2e.yaml` zaczyna od `clearState: true` i nie nadaje się do tego urządzenia.
- Dane lokalne są w szyfrowanym MMKV (`patternly-secure-a/b`), a materiał kluczy i manifest w iOS Keychain. Publiczny interfejs aplikacji udostępnia profilowany storage i operacje przejścia profilu, lecz nie ma bezpiecznego eksportu ani seedowania natywnego stanu do testów. Nie czytamy surowego kontenera, Keychain ani sekretów ownera.
- `profileStorageRouter.test.ts` ma już syntetyczny legacy owner: zapisuje snapshot bajtów, wybiera odizolowany guest, zapisuje po restarcie i sprawdza niezmienność wartości ownera oraz jego wybór po dokładnym powrocie. Jest to dowód kontraktu routera **w pamięci**, nie dowód zachowania konkretnego urządzenia.
- Backendowe `tests/support.ts` używa wspólnego projektu `patternly-app-sandbox`; `clearFirestore()` usuwa wszystkie dokumenty jego domyślnej bazy. Tego helpera nie wolno uruchamiać wobec już działającego współdzielonego emulatora. Wzorzec z `progressStorage.emulator.test.ts` używa odrębnego projektu i usuwa tylko utworzone `users/<uid>`; `createEmulatorContext` przyjmuje osobny `projectId`.

## Najmniejszy kontrakt dla B

1. Utworzyć wyłącznie własne syntetyczne konta Auth i stany pod unikalną przestrzenią testową. Zapisać identyfikatory zasobów utworzonych podczas próby; cleanup usuwa dokładnie te identyfikatory także po błędzie. Nie używać globalnego Firestore/Auth resetu ani lokalnego admin dataset.
2. Na tym samym iPhonie 17 korzystać z istniejącego przełączania profili. Zaczynać od jawnie nowego scope guest, bez `clearState` i bez zapisu testowych odpowiedzi do chronionego legacy ownera. W tym scope przygotować syntetycznego ownera, sesję, odpowiedzi i review przez rzeczywiste ścieżki produktu; szczegóły UI sprawdzić Maestro przed seedowaniem.
3. **Bramka go/no-go przed przejściem guest na urządzeniu:** B najpierw poza urządzeniem, na syntetycznych danych, ustala i sprawdza lokalny, testowy interfejs zwracający wyłącznie wynik `unchanged/changed` dla chronionego markera ownera przed i po przejściu guest. Musi on działać po restarcie, nie ujawniać wartości, hasha ani sekretu, i nie trafiać do produkcyjnego buildu. To projektowany wariant, nie istniejąca implementacja ani potwierdzona wykonalność. Gdy nie da się go bezpiecznie zrealizować, B zatrzymuje przejście guest na urządzeniu i dokumentuje blocker. Po pozytywnej kontroli wolno wykonać minimalne zapisy rejestru przejścia i wyłącznie nowego scope guest; żaden zapis nie może trafić do chronionego ownera. Test routera nadal daje jedynie dowód pamięciowy; nie opierać się na surowym odczycie MMKV/Keychain i nie żądać danych logowania chronionego ownera.
4. Wszystkie przepływy Maestro dla tego urządzenia używają `clearState: false`. Przed cleanup odróżnić własny scope/konto od zastanego. Jeśli bezpieczna atestacja lub wejście w testowy scope nie są możliwe, B zatrzymuje działania na urządzeniu i zapisuje konkretny brak; nie resetuje go.

## Weryfikacja i ograniczenie

Odczytano wskazane implementacje, testy i raporty; `xcrun simctl list devices booted` potwierdził jeden istniejący iPhone 17 (`7F315654-3175-4F3C-BB24-B0263F59360C`). A nie uruchamiało Maestro ani nie zmieniało urządzenia, kont, emulatorów czy danych. W B wykonać ograniczone testy routera, kont/cleanup w izolowanym projekcie, a następnie UI na tym urządzeniu. Testy produkcyjnego ownera pozostają niewykonane.

**Niezależne QA:** `gpt-6-luna` high, **PASS WITH GAPS**. Potwierdziło źródła i granice, ale wskazało brak gotowej metody atestacji natywnego ownera. Powyższa bramka B zapisuje ten brak i warunek zatrzymania; A nie jest dowodem urządzeniowym.

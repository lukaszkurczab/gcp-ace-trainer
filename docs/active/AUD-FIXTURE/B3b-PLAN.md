# AUD-FIXTURE/B3b — syntetyczny legacy owner na odrębnym iPhonie 17

**Data:** 24.09.2026. **Status:** zatwierdzony do wykonania.

## Cel i decyzja

Domknąć B3b i urządzeniową część B2b: uzyskać dowód, że syntetyczny `legacy_owner` przechodzi przez rzeczywistą migrację natywnego storage, a po strzeżonym przejściu do Guest i natywnym restarcie oracle zwraca `unchanged`. Istniejący iPhone 17 z profilem Guest pozostaje wyłączony i nienaruszony. Użytkownik dopuścił nową instancję, jeśli jest potrzebna; sama świeża instalacja tworzy Guest, więc najpierw trzeba przygotować ścieżkę syntetycznego `legacy_owner`.

**Ocena przed implementacją:** niezależny `gpt-6-luna` high odrzucił pierwszą wersję (minimum 0,70, niejednoznaczny dowód po restarcie). Po korekcie: zgodność 0,95; prostota 0,82; ryzyko 0,85; utrzymywalność 0,85; minimum **0,82**.

## Zakres plików i kolejność

1. W `mmkvClient.ts` przed `openEncryptedStorage` wywołać moduł fixture wybrany przez Metro wyłącznie dla jawnie włączonego builda DEV/smoke. W `metro.config.js` skierować pozostałe buildy do pustej implementacji. Produkcyjne API storage nie udostępni mutowalnego ownera.
2. W smoke-only module sprawdzić brak legacy/encrypted MMKV, manifestu i rootów profili przed zapisem. Przy istniejących danych odmówić bez resetu. Na świeżej instancji zapisać i odczytać kontrolnie poprawne kanoniczne rekordy metadata, `account_bound` installation, guest access i active track do plaintext legacy MMKV; następnie pozwolić istniejącej migracji zaszyfrować i otworzyć profil. Własny znacznik ma zapobiegać ponownemu seedowi po restarcie i nie może maskować częściowej próby.
3. Dodać testy: świeży seed, odmowa dla zastanych danych, błąd zapisu/odczytu, idempotencja po restarcie oraz graf bundle smoke/release. Uruchomić typecheck i kontrolę diff.
4. Dopiero po zaliczeniu kodu i QA utworzyć osobny iPhone 17. Poprzedni pozostaje wyłączony. Uruchomić aplikację smoke z jawną flagą fixture i lokalnymi usługami, bez `clearState` w Maestro. Udokumentować build/source SHA, początkowy ekran blokady ownera, strzeżone przejście, nowy proces Guest i widoczny wynik oracle `unchanged` **po** natywnym restarcie. Osobno sprawdzić zapis Guest i jego przetrwanie restartu. Zachować zrzuty i wyniki.

## Granice odbioru

Brak `unchanged` po restarcie oznacza otwarte B2b-device. Ten przebieg dowodzi niezmienności ownera na granicy przejścia; późniejszy zapis Guest/restart dowodzi jego izolowanej trwałości, lecz nie jest kolejną atestacją ownera. Powrót do konta ownera i adopcja są zakresem AUD-17. Nie usuwać ani nie resetować istniejącego urządzenia, nie używać wspólnego backendowego `clearFirestore()` i nie nazywać testów pamięciowych dowodem iOS.

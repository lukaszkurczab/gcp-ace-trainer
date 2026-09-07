# ODK-E2E-070 — discovery szyfrowanego MMKV

Status: `APPROVED_FOR_IMPLEMENTATION`

## Cel i granice

Celem jest zaszyfrowanie kanonicznych danych nauki i kolejek lokalnych kluczem urządzenia, bez utraty istniejącego store, z odzyskiwalną migracją i jawnym stanem utraty klucza. Ten dokument przygotowuje projekt; nie wdraża kodu.

## Potwierdzone fakty z repozytorium

| Obszar | Status | Dowód |
|---|---|---|
| Jedna instancja danych | `done` | `mmkvClient.ts` tworzy wyłącznie `createMMKV({ id: "patternly" })`. |
| Szyfrowanie MMKV | `planned` | Brak `encryptionKey`; biblioteka 4.3.2 udostępnia AES-128/AES-256 i `encrypt`. |
| Klucz urządzenia | `partial` | `expo-secure-store` jest zależnością i chroni Firebase refresh token, lecz nie istnieje klucz MMKV. |
| Granica dostępu | `done` | Tylko `mmkvClient.ts` importuje `react-native-mmkv`; repozytoria używają wspólnego portu. |
| Bootstrap | `done` | `openCanonicalRepositories` jest pierwszym krokiem liniowego bootstrapu i może blokować aplikację przed odczytem danych. |
| Backup | `done` dla bieżących plików | iOS wyklucza katalog Documents/mmkv; Android wyklucza root z backupu i transferu urządzenia. |
| Migracja szyfrowania | `planned` | Brak manifestu migracji, aktywnego slotu, weryfikacji kopii i recovery. |
| Utrata klucza | `blocking` | Brak decyzji, czy wolno wyczyścić niedostępne dane lokalne oraz kiedy odtworzyć kopię konta z chmury. |

## Inwentaryzacja danych

Jeden namespace `patternly:canonical:v1:` zawiera metadane, tożsamość instalacji i gościa, wybraną ścieżkę, sesje i drafty, timery, próby, wyniki, kolejkę powtórek, ustawienia i cele, journal mutacji, stan synchronizacji/wylogowania/usunięcia oraz content-report outbox. Firebase Auth jest osobno w SecureStore i nie należy do migracji MMKV.

## Odrzucony wariant: rekey w miejscu

Wywołanie `encrypt` na istniejącym `patternly` jest krótkie, ale awaria między zapisaniem klucza/markera w SecureStore i `reKey` tworzy stan niejednoznaczny: przy restarcie nie wiadomo bezpiecznie, czy plik jest jeszcze plaintextem, czy już wymaga klucza. Kryterium zadania wymaga przerwania i wznowienia migracji bez ryzyka utraty spójnych danych, więc ten wariant nie jest rekomendowany.

## Rekomendowany projekt: dwa sloty i manifest SecureStore

1. Klucze AES-256 są losowane na urządzeniu i przechowywane w SecureStore z dostępnością `WHEN_UNLOCKED_THIS_DEVICE_ONLY`; nie są synchronizowane ani objęte transferem urządzenia.
2. SecureStore przechowuje dwa naprzemienne rekordy manifestu. Każdy zawiera monotoniczną generację, checksum, aktywny slot, wersje kluczy, slot kwarantanny, niezmienny commitment transferu i etap. Zapis trafia do starszego rekordu, po czym jest odczytywany i sprawdzany; poprawny rekord o najwyższej generacji wygrywa. Brak poprawnego rekordu blokuje bez heurystycznego wyboru slotu.
3. Pierwsza migracja otwiera legacy `patternly` bez klucza jako źródło i nowy slot jako zaszyfrowany cel.
4. Kopiuje wszystkie klucze i wartości z posortowanego snapshotu, zapisuje marker kompletności poza namespace’em użytkownika oraz porównuje pełny zestaw kluczy, bajty wartości i digest. Bootstrap utrzymuje wyłączność zapisu; rotacja odbywa się wyłącznie przy zimnym starcie, zanim powstaną inni writerzy.
5. Maszyna stanów ma przejścia `building → verified → active_reopen_pending → active_quarantine_pending → quarantine_verified → cleanup_pending → complete`. Każde przejście jest idempotentne, a źródło pozostaje autorytatywne do `verified`.
6. Po commit aktywny target jest jeszcze w tym samym bootstrapie trimowany, zwalnia cache, ponownie otwierany z kluczem i weryfikowany pełnym snapshotem przed `ready`. Historyczny digest służy tylko jako commitment tego transferu i nie jest później porównywany ze zmienianymi danymi użytkownika.
7. Legacy plaintext przed `ready` jest szyfrowany osobnym kluczem kwarantanny. Manifest wskazuje slot, generację i wersję tego klucza. Kwarantanna jest ponownie otwierana i porównywana z commitmentem transferu. Brak klucza lub błąd weryfikacji blokuje bez cichego usunięcia.

Odrzucony „rekey w miejscu” oznacza użycie przekształconego legacy jako nowego magazynu kanonicznego. Jednorazowe zaszyfrowanie nieaktywnego legacy osobnym kluczem po pełnym commit nowego slotu jest natomiast zatwierdzonym etapem kwarantanny z punktu 7; marker jest zapisywany przed `encrypt`, a restart rozpoznaje `isEncrypted` i weryfikuje całość kluczem kwarantanny przed zmianą manifestu.
8. Na następnym cold-starcie sprawdzane są możliwość otwarcia aktywnego slotu oraz niezmienny marker/generacja/commitment zakończonego transferu — nie historyczny digest zmiennych danych. Dopiero wtedy kwarantanna jest czyszczona i trimowana, a jej klucz usuwany.
9. Przerwanie przed przełączeniem pozostawia źródło prawdą i odbudowuje częściowy target od początku. Checkpointy per rekord nie są potrzebne: writerzy nie działają, źródło pozostaje kompletne, a deterministyczna pełna recopy jest bezpieczna.
10. Rotacja używa tego samego A/B między szyfrowanymi slotami; stary slot i klucz są usuwane dopiero po reopen targetu przed `ready` i sprawdzeniu commitmentu na następnym cold-starcie.
11. Kopia i digest przebiegają w kolejności kluczy z pamięcią ograniczoną do bieżącej wartości. Nie ma sztucznego limitu danych; test urządzeniowy mierzy czas największego realistycznego store’u.
12. Repozytoria nadal widzą jeden `KeyValueStorage`; orkiestracja pozostaje w infrastrukturze storage i bootstrapie.

Manifesty A/B, klucze slotów i klucz kwarantanny mają rozdzielone nazwy SecureStore. Marker kompletności slotu nie należy do `patternly:canonical:v1:`. Macierz backup/reinstall obejmuje aktywny slot, oba manifesty, wszystkie klucze i kwarantannę.

`quarantine_verified` wolno zapisać dopiero po pełnej weryfikacji zaszyfrowanej kwarantanny oraz namespace-scoped clear/trim plaintextu. Jeśli proces przerwie się po clear, lecz przed zapisaniem etapu, restart rozpoznaje poprawny marker kwarantanny i kontynuuje — nie próbuje kopiować z wyczyszczonego źródła. Brak wszystkich artefaktów oznacza świeżą instalację i pozwala utworzyć pusty zaszyfrowany store; brak manifestu przy istniejącym slocie lub kluczu zawsze oznacza `storage_manifest_corrupt`.

## Jawne stany błędów

- `secure_store_unavailable`: aplikacja nie otwiera MMKV i nie tworzy plaintextowego fallbacku;
- `encrypted_storage_unavailable`: klucz istnieje, ale slot nie daje się otworzyć lub zweryfikować;
- `encrypted_storage_key_missing`: zaszyfrowany aktywny slot istnieje, ale brak klucza;
- `storage_migration_incomplete`: źródło lub cel nie przechodzi weryfikacji; bootstrap pozostaje blokujący i nie usuwa jedynej poprawnej kopii;
- `storage_manifest_corrupt`: manifest nie przechodzi ścisłej walidacji lub read-backu; żaden slot nie jest wybierany heurystycznie;
- `secure_store_temporarily_unavailable`: retry bez zmian; nie jest traktowane jako utrata klucza;
- `legacy_cleanup_failed`: zaszyfrowany cel jest aktywny, lecz aplikacja nie przechodzi do `ready`, dopóki plaintext nie zostanie usunięty.

Nie ma generowania nowego klucza ani pustego store jako ukrytego fallbacku, gdy istnieją oznaki wcześniejszego zaszyfrowanego magazynu.

## Decyzja wymagana od Product Ownera

Utrata klucza SecureStore przy istniejącym zaszyfrowanym slocie jest nieodwracalna kryptograficznie. Dla konta może jednocześnie istnieć potwierdzony stan w chmurze oraz lokalne, jeszcze niewysłane sesje/journale. Automatyczne wyczyszczenie rozstrzyga konflikt destrukcyjnie i może utracić jedyną kopię; automatyczne odtworzenie chmury może ukryć tę utratę.

Rekomendacja: stan blokujący z jasnym komunikatem i dwiema jawnymi czynnościami:

- `Spróbuj ponownie` — bez zmian danych;
- `Usuń niedostępne dane z tego urządzenia` — po osobnym potwierdzeniu. Dla konta po usunięciu uruchomić zwykły, jawny restore/adoption wyłącznie z potwierdzonych danych chmurowych; dla gościa rozpocząć pusty lokalny zbiór. Nigdy nie sugerować, że niewysłane dane zostały odzyskane.

Ta decyzja wymaga zgody PO, ponieważ obejmuje destrukcyjne działanie i możliwy konflikt danych lokalnych z chmurowymi.

Decyzja PO 2026-09-06: zatwierdzono rekomendowany wariant z bezpiecznym retry oraz dwustopniowym, świadomym usunięciem niedostępnych danych. Dla konta wolno następnie odtworzyć wyłącznie dane wcześniej potwierdzone w chmurze; dla gościa powstaje pusty zbiór.

## Projekt stanu odzyskiwania do zatwierdzenia

Obecny `ContentPreparationGate` już ma pełnoekranowy stan `Application unavailable` z pojedynczym `Retry`. Należy go rozszerzyć wyłącznie dla typowanego `encrypted_storage_key_missing`; pozostałe błędy nadal pokazują zwykłe retry.

Rekomendowany, minimalny wariant:

- tytuł: `Nie można otworzyć danych na tym urządzeniu`;
- opis: `Brakuje klucza chroniącego lokalne dane. Spróbuj ponownie. Jeśli klucza nie da się odzyskać, możesz usunąć niedostępne dane z tego urządzenia.`;
- akcja główna: `Spróbuj ponownie` — ponawia SecureStore/bootstrap bez zapisu i usuwania;
- akcja drugorzędna destrukcyjna: `Usuń niedostępne dane`;
- po wybraniu usunięcia ten sam ekran pokazuje krótkie potwierdzenie: `Niewysłane sesje i postęp gościa zostaną bezpowrotnie utracone. Dane konta zapisane wcześniej w chmurze pozostaną.` oraz akcje `Anuluj` i `Usuń dane z urządzenia`.

Nie powstaje nowa trasa ani wieloetapowy kreator. Istniejący `clearPatternlyLocalHistory` nie może zostać użyty: wymaga czytelnego store i celowo zachowuje część rekordów. Potrzebna jest osobna storage-level operacja usuwająca oba sloty MMKV, legacy/kwarantannę, manifesty i klucze dopiero po potwierdzeniu. Firebase Auth w osobnym SecureStore pozostaje; po utworzeniu świeżego szyfrowanego store konto przechodzi istniejący jawny proces materializacji potwierdzonych danych chmurowych. Gość rozpoczyna pusty zbiór.

Wariant bez destrukcyjnej akcji pozostawia wyłącznie `Spróbuj ponownie`. Jest bezpieczniejszy przed przypadkowym usunięciem, lecz po rzeczywistej utracie klucza aplikacja pozostaje trwale zablokowana i wymaga odinstalowania lub wsparcia operacyjnego.

## Zadania implementacyjne po decyzji

### 070-A — port i manifest bezpiecznego klucza

- Cel: kanoniczny port SecureStore, losowy klucz AES-256 i wersjonowany manifest migracji.
- Non-goals: migracja danych i UI recovery.
- AC: brak klucza w MMKV/logach; `THIS_DEVICE_ONLY`; brak fallbacku; błędy są typowane.
- Weryfikacja: unit test generacji, ponownego odczytu, awarii get/set i niezgodnego manifestu.
- Raport: sekcja 070-A w raporcie wdrożenia.

### 070-B — atomowa migracja legacy do szyfrowanego slotu

- Cel: copy–verify–switch–purge przed otwarciem repozytoriów.
- Non-goals: rotacja i recovery UI.
- AC: pełny stary store zachowany; przerwanie na każdym etapie jest wznawialne; target jest ponownie otwarty i w pełni zweryfikowany przed `ready`; plaintext jest zaszyfrowany i zweryfikowany jako kwarantanna przed `ready`; kolejny cold-start sprawdza commitment zamiast historycznego snapshotu zmiennych danych; niezgodność nie kasuje jedynej poprawnej kopii.
- Weryfikacja: pełna inwentaryzacja kluczy, failure injection na zapisie/weryfikacji/switch/cleanup, restart po każdym punkcie.
- Raport: sekcja 070-B.

### 070-C — rotacja A/B

- Cel: zmiana klucza bez rekey w miejscu.
- Non-goals: automatyczny harmonogram rotacji.
- AC: zweryfikowany target przed switch; stary slot i klucz usuwane dopiero po switch; restart w każdym etapie bez utraty.
- Weryfikacja: rotacja pełnego store, błędny nowy klucz, przerwanie, ponowienie i cleanup.
- Raport: sekcja 070-C.

### 070-D — jawne odzyskiwanie po utracie klucza

- Cel: wdrożyć wariant zatwierdzony przez PO.
- Non-goals: obietnica odzyskania niewysłanych danych.
- AC: brak automatycznego resetu; retry nie zmienia danych; destrukcja wymaga potwierdzenia; konto i gość mają prawdziwe następstwa.
- Weryfikacja: utrata klucza z pustym/pełnym store, guest/account, dane zsynchronizowane i pending journal.
- Raport: sekcja 070-D oraz dowód zaakceptowanego projektu UI.

### 070-E — backup, reinstall i dowód urządzeniowy

- Cel: potwierdzić politykę na iOS/Android oraz zachowanie reinstall/transfer.
- Non-goals: cloud backup aplikacji.
- AC: store i klucz nie migrują na nowe urządzenie; reinstall nie otwiera starego slotu bez klucza; deklaracje Privacy są zgodne.
- Weryfikacja: prebuild diff, native build, symulator/urządzenie, backup/restore tam gdzie narzędzia pozwalają.
- Raport: sekcja 070-E.

## Ocena projektu

- dopasowanie do celu i architektury: 0,94 — zachowuje jedną granicę storage i liniowy bootstrap;
- prostota: 0,80 — dwa sloty, dwa małe manifesty, formalne stany i kwarantanna są większe od rekey, ale każdy element zamyka konkretne okno utraty, power-loss lub plaintextu;
- ryzyko: 0,86 — najważniejsze ryzyko destrukcji pozostaje za jawną decyzją i potwierdzeniem;
- utrzymywalność: 0,88 — ten sam protokół obsługuje pierwszą migrację i późniejszą rotację.

Finalny wynik autora: 0,80. Pierwsza walidacja dała 0,60, druga 0,74. Projekt skorygowano o dwa manifesty odporne na częściowy zapis, reopen i pełną weryfikację targetu przed `ready`, osobno weryfikowaną kwarantannę oraz niezmienny commitment, który nie koliduje z późniejszymi zapisami użytkownika.

Końcowa niezależna walidacja briefu: `APPROVE`, wynik 0,82 (spójność 0,88; prostota 0,82; kontrola ryzyka 0,83; utrzymywalność 0,85). Walidację wykonał `gpt-5.6-luna`, reasoning effort `max`, wyłącznie na podstawie briefu. Obowiązkowe warunki walidatora dotyczące kolejności `quarantine_verified` i rozróżnienia świeżej instalacji od uszkodzonego manifestu zostały wpisane powyżej. Pozostaje decyzja PO przed implementacją.

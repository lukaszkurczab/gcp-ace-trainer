# ODK-E2E-068-D — projekt iOS eksportu danych

Data: 2026-09-06
Status: `APPROVED`

## Cel

Umożliwić pobranie danych konta albo znalezienie kanału realizacji praw bez przebudowy istniejącego ekranu „Dane i prywatność”.

## Źródło wizualne

Projekt rozwija istniejący `YourDataScreen` i jego kanoniczny `SettingsInformationScreen`: zachowuje nagłówek, `InfoBlock`, grupowane wiersze oraz arkusz szczegółów. Nie dodaje nowej trasy, kreatora, karty marketingowej ani drugiego systemu komponentów.

## Hierarchia informacji

Na pierwszym miejscu, bez ukrywania:

1. krótki `InfoBlock`: dane nauki są lokalne; po zalogowaniu zsynchronizowane dane konta można pobrać;
2. jedna sekcja „Twoje prawa” bez dodatkowego opisu;
3. dla zalogowanego konta jeden wiersz „Pobierz dane konta” z krótkim opisem „Plik JSON z danymi konta i synchronizowaną nauką”;
4. dla gościa jeden wiersz „Poproś o pomoc w sprawie danych” otwierający zadeklarowany kanał prywatności.

Za istniejącym arkuszem „Szczegóły” pozostają:

- dokładny zakres eksportu i pominięcia;
- informacja o formacie JSON;
- wyjaśnienie, że dane tylko na urządzeniu nie są częścią eksportu konta;
- informacja o limicie i potrzebie ponownego uwierzytelnienia.

## Interakcja konta

- Backend uznaje uwierzytelnienie za świeże przez dokładnie 300 sekund od `auth_time` tokenu Firebase.
- Naciśnięcie „Pobierz dane konta” najpierw próbuje eksportu. Odpowiedź `recent_reauthentication_required` otwiera istniejący przepływ uwierzytelnienia dla aktywnego providera; nie dodajemy formularza hasła do ekranu danych.
- Po poprawnym ponownym uwierzytelnieniu użytkownik wraca do „Dane i prywatność” i sam ponawia eksport. Aplikacja nie wykonuje eksportu automatycznie po powrocie.
- W trakcie wiersz jest zablokowany i pokazuje „Przygotowywanie…”.
- Po pobraniu aplikacja zapisuje plik wyłącznie w systemowym katalogu cache, który nie jest objęty backupem aplikacji, i natychmiast otwiera systemowy arkusz udostępniania/zapisu.
- Nazwa pliku zawiera losowy identyfikator eksportu, nie email ani identyfikator użytkownika. Treść i ścieżka nie są logowane ani zapisywane w telemetry.
- Po zamknięciu, anulowaniu lub błędzie arkusza kopia tymczasowa jest usuwana w `finally`. Przy każdym starcie aplikacja usuwa osierocone pliki eksportu z własnym prefiksem, co domyka force-kill/crash bez dotykania innych plików cache.
- 429 pokazuje czas pozostały do ponowienia i blokuje ponowienie do końca tego czasu. 413, offline, 5xx, niepoprawna odpowiedź, błąd uwierzytelnienia i niedostępny/błędny arkusz systemowy mają jawne, krótkie komunikaty bez pozornego sukcesu. Ponowienie jest zawsze ręczne.

## Interakcja gościa

- Gość nie widzi nieaktywnego przycisku eksportu konta.
- Wiersz kontaktowy otwiera skonfigurowany publiczny `supportUrl`, który jest kanałem obsługi spraw dotyczących prywatności do czasu uzupełnienia docelowego `privacyEmail`; nie zakłada konta, nie przesyła identyfikatora konta i nie sprawdza, czy adres istnieje w systemie.
- Jeśli publiczny kanał nie jest skonfigurowany, ekran jawnie informuje o jego niedostępności zamiast otwierać placeholder lub deklarować wysłanie żądania.
- Szczegóły wyjaśniają, że dane zapisane wyłącznie na urządzeniu można usunąć lokalnie, a szersze żądanie można wysłać kanałem prywatności.

## Copy robocze

PL:

- `Pobierz dane konta`
- `Plik JSON z danymi konta i synchronizowaną nauką`
- `Poproś o pomoc w sprawie danych`
- `Skontaktuj się z nami bez zakładania konta`

EN:

- `Download account data`
- `A JSON file with your account and synced learning data`
- `Request help with your data`
- `Contact us without creating an account`

## Dostępność

- Jeden cel dotykowy na wiersz, bez ikon wymagających osobnej interpretacji.
- Status przygotowania i błędy są tekstowe oraz ogłaszane przez accessibility live region.
- Układ korzysta z istniejącego zachowania dla dużego tekstu i nie umieszcza treści w tooltipie zależnym od hover.
- Test obejmuje kolejność fokusu oraz komunikaty VoiceOver dla stanów: bezczynny, przygotowywanie, wymagane ponowne logowanie, gotowy arkusz, 429, offline, 5xx, niepoprawny eksport i błąd arkusza, także przy 200% tekstu.

## Kryteria techniczne pliku

- Eksport nigdy nie trafia do Documents, MMKV ani SecureStore; jedyną lokalną kopią aplikacji jest krótkotrwały plik w cache wymagany przez systemowy arkusz.
- Cleanup jest idempotentny, ograniczony do prefiksu `patternly-account-data-` i działa zarówno w `finally`, jak i podczas bootstrapu.
- Przed otwarciem arkusza aplikacja weryfikuje `schemaVersion`, `exportId` i podstawowy kształt sekcji; nie zapisuje ani nie udostępnia odpowiedzi błędnej lub częściowej.
- Niedostępność systemowego share/save sheet jest jawnym stanem `sharingUnavailable`; aplikacja usuwa plik i nie pokazuje sukcesu.

## Ocena po korekcie walidacji

- dopasowanie celu/architektury: 0,94 — rozszerza istniejący ekran i klient API;
- prostota: 0,93 — jedna sekcja, jedna akcja zależna od stanu konta, jeden arkusz szczegółów;
- kontrola ryzyka: 0,91 — próg 300 s, jawny powrót do auth, cache bez backupu, cleanup `finally` i bootstrap, walidacja odpowiedzi oraz pełna macierz błędów;
- utrzymywalność: 0,91 — istniejące komponenty i bez nowej trasy.

Pierwsza niezależna walidacja (`gpt-5.6-luna`, reasoning `max`) odrzuciła brief z powodu kontroli ryzyka 0,74. Powyższa korekta domyka wskazany cykl życia pliku, recent-auth, kanał gościa, błędy i dostępność. Implementacja może rozpocząć się dopiero po ponownej walidacji i akceptacji product ownera.

## Rewalidacja

Poprawiony brief został niezależnie zaakceptowany (`gpt-5.6-luna`, reasoning `max`): dopasowanie 0,97, prostota 0,85, kontrola ryzyka 0,94, utrzymywalność 0,93. Werdykt: `APPROVE`. Jedynym pozostałym warunkiem rozpoczęcia implementacji UI jest akceptacja product ownera.

Product owner zaakceptował ten wariant 2026-09-06. Implementacja ma zachować powyższy minimalny zakres bez dodawania nowej trasy, kreatora ani dodatkowych warstw prezentacyjnych.

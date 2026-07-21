# Settings — plan recompozycji

## Cel i granice decyzji

**Cel:** przywrócić skanowalny, sekcyjny układ Settings, bez sekcji „Nauka”, oraz zapewnić, że każdy wiersz jest klikalny i kończy się działaniem albo celowym błędem diagnostycznym.

Zakres obejmuje ekran Settings, jego nawigację, preferencje aplikacji, lokalne powiadomienia i dokumenty informacyjne. W obecnej fazie tworzenia niezaimplementowane wejścia mają kończyć się celowym błędem diagnostycznym. Nie obejmuje budowy kont, synchronizacji ani systemu płatności.

## Potwierdzone fakty

- Aktualny ekran ma trzy grupy i trzy pozycje informacyjne lub ustawienia: język, wygląd oraz dane lokalne (`src/features/home/tabs/SettingsTab.tsx`).
- Poprzedni ekran miał właściwą hierarchię: nagłówek, status danych oraz cztery grupy: nauka, aplikacja, dane i prywatność, konto i pomoc (`git show HEAD:src/features/home/tabs/SettingsTab.tsx`).
- Język i wygląd są obecnie prawdziwymi, trwałymi preferencjami; są zapisane lokalnie i stosowane w aplikacji (`src/preferences/AppPreferencesProvider.tsx`, `src/storage/repositories/settingsRepository.ts`).
- `expo-notifications` jest zainstalowane wraz z pluginem Expo; lokalne przypomnienie ma natywny adapter, trwałe ustawienie i kontrakt zastępowania pojedynczego harmonogramu (`package.json`, `app.json`, `src/infrastructure/notifications/`, `src/application/notificationPreferences.ts`).
- Fitaly potwierdza wzorzec dla tego obszaru: Settings jest indeksem z krótkim kontekstem i sekcjami, a wybór języka oraz powiadomienia prowadzą do osobnych ekranów (`/Users/lukaszkurczab/Desktop/Projects/Fitaly/fitaly/src/feature/UserProfile/screens/AppSettingsScreen.tsx`, `LanguageScreen.tsx`, `NotificationsScreen.tsx`).
- Kontrakt prywatności wymaga jasnego objaśnienia danych lokalnych, braku konta/synchronizacji i konsekwencji resetu; nie pozwala składać niezweryfikowanych deklaracji (`docs/09-security-and-privacy.md`).

## Stan

| Obszar | Stan | Dowód / wniosek |
| --- | --- | --- |
| Sekcyjny układ Settings i kontrakt kliknięcia | implemented | Używa wzorca Fitaly: krótki kontekst, sekcje i siedem klikalnych wierszy. Pięć ustawień prowadzi do pełnych ekranów; wyłącznie feedback i subskrypcja celowo rzucają błąd do czasu powstania ich integracji. |
| Język interfejsu | done | Preferencja `system/en/pl` jest trwała i użyta przez UI. |
| Wygląd System/Jasny/Ciemny | done | Preferencja jest trwała i steruje motywem całej aplikacji. |
| Powiadomienia i codzienny reminder | implemented / native verification pending | Natywne uprawnienie, trwały harmonogram, zmiana godziny i anulowanie są zaimplementowane oraz pokryte testami kontraktu; pozostaje test na uruchomionym iOS i Androidzie. |
| Informacja o danych i prywatności | implemented | Ekran „Twoje dane” wyjaśnia lokalny zakres danych, brak konta i synchronizacji oraz granice utraty danych. |
| Dokumenty prawne | implemented | Ekran „Informacje prawne” udostępnia lokalnie zakres prywatności, ograniczenia ochrony, status ćwiczeń i granice resetu. |
| Feedback | blocking | Brak ustalonego kanału odbioru lub adresu wsparcia. |
| Subskrypcja | deferred | Brak modelu billingowego; nie wolno prezentować martwego zarządzania subskrypcją. |
| Dźwięk | deferred | Nie jest planowany jako funkcja produktu. |
| Globalna długość sesji i priorytet review | deferred | Własność należy do konfiguracji konkretnej sesji lub trybu; globalne ustawienie wprowadzałoby sprzeczny drugi model. |
| Reset historii | deferred | Właściciel produktu uznał go za zbędny w Settings; kontrakt resetu pozostaje w repozytorium jako osobna funkcja produktu. |

## Docelowa architektura informacji

Zachowujemy układ z wieloma krótkimi, klikalnymi wierszami, bez sekcji „Nauka” i bez dużej karty-profilu „Patternly local workspace”.

1. **Wygląd**
   - `Wygląd` → osobny ekran z wyborem System / Jasny / Ciemny.

2. **Preferencje**
   - `Język` → osobny ekran z wyborem System / English / Polski.
   - `Powiadomienia` → osobny ekran z systemową zgodą, stanem oraz godziną lub wyłączeniem codziennego przypomnienia.

3. **Dane i prywatność**
   - `Twoje dane` → lokalny widok wyjaśniający aktualny kontrakt danych.
   - `Informacje prawne` → lokalny widok z prawdziwą treścią dotyczącą danych lokalnych oraz zastrzeżeniem o nieoficjalnym charakterze ćwiczeń.
   - Status problemu z zapisem pozostaje widoczny warunkowo, jako stan awaryjny, a nie zwykła opcja.

4. **Pomoc i konto**
   - `Wyślij opinię` → po wdrożeniu: działający kanał kontaktu; wcześniej: celowy błąd diagnostyczny.
   - `Subskrypcja` → po wdrożeniu: billing i przywracanie zakupu; wcześniej: celowy błąd diagnostyczny.

### Kontrakt kliknięcia dla niedostępnych funkcji

Każdy wiersz pozostaje aktywny. Gdy funkcja nie ma jeszcze ownera lub infrastruktury, kliknięcie rzuca celowy, nieobsłużony wyjątek diagnostyczny w rodzaju `SETTINGS_FEATURE_NOT_IMPLEMENTED: feedback`. Komunikat musi zawierać stabilny identyfikator funkcji i brakującego ownera lub integrację. Jest to świadomie przyjęty stan developmentu: nie maskuje luki i zatrzymuje test/manualny przebieg dokładnie w miejscu braku funkcji.

## Zadania gotowe do implementacji

### S01 — Przywrócenie hierarchii i kontraktu kliknięcia Settings

- **Cel:** odtworzyć sekcyjny układ Settings bez „Nauki”, zwiększyć liczbę opcji i zagwarantować obsługę tapnięcia dla każdej z nich.
- **Zakres:** `SettingsTab`, osobne grupy Wygląd, Preferencje, Dane i prywatność, Pomoc i konto; język, wygląd i powiadomienia jako zwarte wiersze prowadzące do pełnych ekranów; celowy wyjątek diagnostyczny dla funkcji oczekujących na S02/S04.
- **Poza zakresem:** implementacja powiadomień, billing, kanał feedbacku, globalne parametry sesji.
- **Wejścia:** obecny provider preferencji, kontrakt prywatności oraz nazwy stabilnych błędów diagnostycznych.
- **Kryteria akceptacji:** cztery sekcje są obecne; nie ma sekcji Nauka; każdy wiersz jest klikalny; działające opcje zmieniają stan; pozostałe celowo rzucają opisowy błąd z identyfikatorem funkcji; język i wygląd pozostają trwałe.
- **Weryfikacja:** test wszystkich siedmiu wierszy: trwała zmiana dla języka i wyglądu, przejście do ustawień powiadomień albo oczekiwany błąd diagnostyczny; typecheck, screenshot i ręczny test na iOS/Android.
- **Ryzyko:** inline selektory pogarszają skanowalność i różnią się od wzorca Fitaly; każdy działający wybór ma własny ekran szczegółów.
- **Raport:** krótki przed/po z czterema zrzutami sekcji.

### S02 — Powiadomienia i codzienne przypomnienie

- **Cel:** dodać jeden faktycznie działający ekran ustawień powiadomień, który obejmuje wymagane ustawienie przypomnienia.
- **Kontrakt kompletności:** wiersz `Powiadomienia` prowadzi do ekranu z całą ścieżką: uprawnienie, zapis preferencji, jeden harmonogram, zmiana godziny i anulowanie. Przed tym punktem pozostaje na celowym błędzie `SETTINGS_FEATURE_NOT_IMPLEMENTED`; nie ma makiety, fallbacku ani częściowej wersji UI.
- **Zakres:** lokalne powiadomienia, obsługa zgody systemowej, trwała preferencja włączenia, wybór godziny przypomnienia, anulowanie przy wyłączeniu oraz jawny stan odmowy zgody na jednym ekranie.
- **Poza zakresem:** zdalne powiadomienia, telemetryka, automatyczne ustalanie częstotliwości, konto.
- **Wejścia:** decyzja o pakiecie powiadomień zgodnym z Expo/RN oraz polityka copy dla odmowy zgody.
- **Kryteria akceptacji:** zgoda jest żądana dopiero po działaniu użytkownika; włączone przypomnienie ma dokładnie jeden harmonogram; wyłączenie go usuwa harmonogram; odmowa jest czytelna i nie udaje włączonego stanu.
- **Weryfikacja:** testy adaptera harmonogramu i testy integracyjne na obu platformach, w tym odmowa zgody i zmiana godziny.
- **Ryzyko:** różnice uprawnień i harmonogramów iOS/Android; nie można uznać tego zadania za ukończone bez testu na urządzeniu/symulatorze.
- **Raport:** dowód stanu uprawnień i harmonogramu na obu platformach.

### Wynik S01 — partial

- Usunięto sekcję „Nauka”.
- Użyto czterech sekcji i siedmiu klikalnych wierszy.
- Język i wygląd zachowują trwałe, działające ustawienia na osobnych ekranach, zgodnych z modelem Fitaly.
- Dane i informacje prawne otwierają pełne lokalne ekrany; feedback i subskrypcja rzucają celowy błąd `SETTINGS_FEATURE_NOT_IMPLEMENTED` z identyfikatorem funkcji i brakującą integracją.
- Typecheck i testy trwałości preferencji oraz kontraktu błędów przeszły.
- Native screenshot/manual crash verification pozostaje niewykonane bez podłączonego urządzenia lub symulatora.

### Wynik S02 — implemented / native verification pending

- Zainstalowano `expo-notifications` i dodano jego plugin do konfiguracji Expo.
- Wiersz `Powiadomienia` otwiera osobny ekran. Ten ekran odczytuje oraz żąda prawdziwego uprawnienia systemowego; na Androidzie najpierw tworzy kanał wymagany przez Android 13+.
- Ekran ma model Fitaly: stan uprawnienia jest widocznym blokiem informacyjnym, preferencja przypomnienia jest jednym wierszem, a wybór godziny odbywa się w bottom sheecie.
- Ten sam ekran zapisuje godzinę i identyfikator wyłącznie po utworzeniu natywnego harmonogramu. Zmiana godziny tworzy nowe przypomnienie i usuwa stare; wyłączenie usuwa harmonogram i zapis.
- Odmowa uprawnienia jest jawnym stanem systemu i nie tworzy harmonogramu. Błąd API systemowego, harmonogramu albo zapisu nie jest przechwytywany ani zastępowany stanem lokalnym.
- Po odmowie wywołanej przez użytkownika ekran pokazuje modal z realnym przejściem do ustawień urządzenia; nie udaje pomyślnego włączenia funkcji.
- Testy jednostkowe pokrywają format godziny, zgodę, pojedynczy harmonogram, zastąpienie, odmowę i wyłączenie. Pozostaje test natywny na uruchomionym iOS oraz Androidzie.

### Wynik S03 — implemented

- Dodano dwa lokalne ekrany: „Twoje dane” i „Informacje prawne”. Każdy ma blok kontekstu, grupy klikalnych tematów i szczegóły w przewijalnym bottom sheecie — zgodnie z wzorcem Fitaly dla ekranów Settings.
- Publiczne twierdzenia wynikają z `docs/09-security-and-privacy.md`: dane nauki są lokalne, produkt nie wymaga konta ani bieżącej synchronizacji, a usunięcie aplikacji, reset lub utrata urządzenia mogą skutkować utratą danych.
- Informacje prawne opisują wyłącznie potwierdzony zakres: brak deklaracji o szyfrowaniu, braku backupów, odporności na kompromitację urządzenia albo bezpiecznym usuwaniu śledczym. Ćwiczenia są niezależną nauką, nie oficjalnym certyfikatem.
- Nie dodano zewnętrznych linków, kont, synchronizacji, exportu ani warunków subskrypcji, ponieważ nie istnieje dla nich potwierdzony kontrakt produktu.
- Typecheck i testy kontraktu ustawień przechodzą; pozostaje ręczna kontrola wizualna na iOS i Androidzie.

### S04 — Feedback i subskrypcja po ustaleniu integracji

- **Cel:** dodać faktyczne wejścia do pomocy i subskrypcji, gdy istnieje ich właściciel i mechanizm.
- **Zakres:** zależnie od decyzji: kanał feedbacku oraz billing/restore purchases.
- **Poza zakresem:** atrapy, martwe przyciski, formularz bez odbiorcy, lokalny status subskrypcji bez źródła prawdy.
- **Blokada:** potrzebny kanał odbioru feedbacku; subskrypcja wymaga decyzji o dostawcy billingowym i katalogu produktów.

## Następne zadanie

**S04 — Feedback i subskrypcja po ustaleniu integracji.** To jedyne pozostałe ustawienia, które celowo kończą się błędem: bez realnego kanału odbioru feedbacku i dostawcy billingowego aplikacja nie może prezentować pozornej funkcji.

## Wymagane decyzje właściciela przed S04

1. Jaki jest docelowy kanał feedbacku (adres e-mail, formularz, system zgłoszeń)?
2. Jaki dostawca oraz model produktów obsłuży subskrypcję?

## Nieweryfikowane obszary

- Dołączony screenshot nie był dostępny w systemie plików podczas planowania; porównanie wizualne opiera się na wersji poprzedniego ekranu z historii Git.
- Nie ma jeszcze dowodu zachowania powiadomień na uruchomionym iOS oraz Androidzie; istnieją testy kontraktu aplikacyjnego, ale nie zastępują testu urządzeniowego.

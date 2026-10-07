# Patternly — bieżący stan pracy

Aktualizacja: 07.10.2026. [Plan główny](../docs/PATTERNLY-WORKING-PLAN.md) jest jedyną kolejką i źródłem statusów. Zawiera prace przed pierwszym wydaniem iOS oraz po nim. Decyzją właściciela Android, EPIC-09, dokończenie pełnego audytu contentu i jego poprawki należą do drugiej kolejki.

Katalog główny workspace nie jest repozytorium Git. Cztery repozytoria mają osobne historie; bieżące SHA odczytaj z Git. Porównanie techniczne, na którym oparto konsolidację, używało: app `e889b05d`, backend `039f7f0`, content `8bb27fa` i web `effdf506`. Późniejsze commity porządkowe nie są nowym audytem implementacji.

## Zachowane dane i wykonane porządki

Pozostawiono jeden plan, jeden stan pracy i szczegółowe specyfikacje zadań. Usunięto dawne raporty, zrzuty ekranu, nieużywane dowody i artefakty oraz 29 scenariuszy Maestro. Zachowano 32 scenariusze YAML i dwa pliki JSON używane przez testy. Przeniesiono 38 niezmienionych plików wejściowych testów do `src/content/__fixtures__/release-acceptance/`.

Zachowano aktualne wejścia pakietów, dopuszczenia treści i migracji, zależności, środowiska natywne oraz dane użytkowników. Usunięto 20 nieaktualnych rejestracji worktree i nieużywany katalog `.pnpm-store` z katalogu głównego. Nie zmieniano schowków Git: app — 6, backend — 4, content — 2, web — 0. Katalogu `.temp` nie było w workspace.

Zachowano pozostałe zadania wszystkich sześciu audytów, pełne ustalenia i kryteria ARCH oraz osobne zakresy AUD-08, AUD-06 i ODK-E2E-082–088/099. Odzyskano indywidualne dane niedokończonego audytu contentu. Dawne podsumowanie z liczbą 3 703 było nieaktualne: weryfikator odczytał 4 236 ocen z 16 077 pytań, przy 11 841 nieocenionych pytaniach i bez błędów strukturalnych.

Obecny bank ma 16 622 pytania. Porównanie źródeł wskazało 2 752 pytania o treści identycznej z wcześniej ocenioną; pozostałe 13 870 wymaga przypisania właściwych późniejszych ocen albo nowego przeglądu. Zgodność treści nie jest aktualnym zatwierdzeniem jakości. Zachowane zadania naprawcze obejmują 158 grup i 2 129 pytań z niezmienionymi, potwierdzonymi problemami. Rozwiązane zakresy OOD, Claude, zastępstw BESD i punktacji pozostają zamknięte. Nie potwierdzono pełnej oceny obecnego banku, pełnego zatwierdzenia redakcyjnego przez człowieka ani skuteczności nauki.

## Stan aplikacji i otwarte odbiory

Wdrożono OOD 24, objaśnienia z pakietu 33 i operację Gościa 34. Bieżący bank Claude ma 845 pytań. Przywrócono dokładną parę katalogu i przypięcia wersji 24 po niedokończonym eksperymencie wersji 23.

Q13 pozostaje otwarte. Poprzednie próby kończyły się przed rozpoczęciem sesji, więc nie dowiodły ani poprawnego wznowienia, ani jego usterki. Dawne prywatne manifesty i checkouty nie istnieją. [Specyfikacja Q13](../docs/specs/engineering/q13-package-update.md) wymaga rozpoczęcia od małego rzeczywistego testu dostępności środowiska.

Operacja 34 usunęła 84 klucze oryginalnego Gościa, zachowała dziewięć kont, rejestr i stan wylogowania oraz utworzyła nowego Gościa. Historyczny test pierwszego uruchomienia do Home nie obejmował sesji i odpowiedzi. Porządki nie upoważniają do usunięcia kolejnych danych.

CH-01–05 pozostają zakończone. Pełny odbiór BIZQ-01–06, `SIM-READY` i wydanie nie są zakończone. AUD-06-CHECK dotyczy błędnego zgłaszania braku konsumentów 11 operacji web; rzeczywiste wywołania istnieją w kodzie.

## Dowody z weryfikacji porządków

Poniższe wyniki pochodzą z wcześniejszej weryfikacji porządków. Korekta języka i podział kolejek nie zmienia implementacji i sama nie jest nowym testem zachowania aplikacji.

- Testy kanonicznego contentu: 200/200 poprawnych. Celowane testy aplikacji: 128/128 poprawnych. Kontrola typów, bazowego zakresu odzyskiwania, granic treści i prywatności środowiska wykonania zakończona poprawnie. Potwierdzono dziewięć przypięć darmowych pakietów.
- Spis odzyskiwania obejmuje 453 pliki źródłowe, 321 plików testowych i 1 801 przypadków. Wszystkie 38 przeniesionych plików zachowało identyczne bajty i skróty. Niezależnie sprawdzono skróty źródeł 158 grup FCA oraz odnośniki specyfikacji.
- Weryfikator audytu z `--require-complete` poprawnie zwraca kod 2 przy niepełnym audycie. Narzędzie porównania aktualnych źródeł dało identyczny wynik przy powtórzeniu pełnego uruchomienia. Test z nieśledzonym plikiem źródłowym poprawnie odmówił zapisu wyniku.
- Pełne uruchomienie aplikacji obejmowało 1 921 testów: 1 904 przeszły, 13 nie przeszło z błędem `ENOBUFS` podczas buforowania dużych różnic binarnych, a cztery pominięto zgodnie z dedykowanym zakresem. Powtórzenie wszystkich 13 przypadków `releaseManifest` w czystym drzewie zakończyło się 13/13 poprawnymi wynikami, bez pominięć. Łącznie potwierdzono 1 917 poprawnych wyników w tych uruchomieniach; nie pozostaje nierozwiązana porażka związana z porządkami.
- Testy między repozytoriami: 3/3 poprawnych z pełnym SHA contentu. Pierwsza próba ze skróconym SHA została prawidłowo odrzucona. Sprawdzenie kandydata i migracji 16 622 pytań zakończone poprawnie. Dowód dopuszczenia w aplikacji odświeżano rzeczywistym testem dla bieżącego SHA; skróty treści i tożsamość kandydata pozostały niezmienione.

Niezależny odbiór poprzednich porządków potwierdził zachowanie zakresu zadań i rekordów audytu. Commity są lokalne; źródła backendu nie zostały zmienione. Nie wykonano w ramach porządków odbiorów natywnych, usług zewnętrznych, sklepów, wdrożenia ani publikacji. Szczegółowe logi pojedynczych uruchomień są tymczasowe.

## Weryfikacja uporządkowanego planu

Sprawdzono dokładnie dwie tabele, obecność zachowanych grup zadań i identyfikatorów wydania, uzgodniony zakres po wydaniu oraz odnośniki w zmienionych dokumentach. Niezależny przegląd różnic potwierdził zachowanie zakresu, zależności i kryteriów bez dodawania nowej ogólnej bramki publikacji. Ta korekta dotyczy dokumentacji; nie zmienia kodu aplikacji ani treści pytań.

## Zapisane decyzje właściciela z 07.10

- BIZQ-03: jedna diagnoza na początku, potem praktyka, dla ścieżek obsługujących diagnozę.
- BIZQ-02: osobne progi ukończenia dla każdej ścieżki. Minimum prób, rozmiar ruchomego okna i próg poprawności wymagają przygotowania i zatwierdzenia; wartości testowe nie są domyślne.
- BIZQ-04: 7 × 24 godziny od pierwszego kwalifikowanego sukcesu do następnego sprawdzenia, liczone od `answeredAt`. Pozostałe proponowane odstępy nadal wymagają rozstrzygnięcia.
- BIZQ-06: docelowo App Store. Przed publikacją zapowiedź bez aktywnego przycisku pobrania; przejście do sklepu dopiero po potwierdzeniu właściwego linku i dostępności.
- AUD-08: kod potwierdzający adres Gościa przy zgłoszeniu dotyczącym jego danych. Jawne ponowienie tworzy nową próbę i kod oraz unieważnia poprzedni; brak automatycznego ponowienia niepewnej wysyłki. Maile zakupowe, prawne i administracyjne pozostają w osobnych procesach.
- PERSIST-11: maksymalnie 5 sekund utraty aktywnego czasu po nagłym zamknięciu i wznowieniu. Limit wymaga implementacji i pomiaru; nie zmienia absolutnego terminu egzaminu.
- SEC-07: 30 × 24 godziny metadanych potwierdzonego zakończenia, od niezmiennego czasu zakończenia, bez przedłużania przez ponowienia. Aktywne i nadal ponawialne operacje nie wygasają arbitralnie. Projekt musi chronić przed ponownym wykonaniem starego żądania po usunięciu historii; obecny UUID i samo TTL nie zapewniają tej ochrony.

Ustalenia zapisano przy zadaniach w planie i specyfikacjach. Niezależny przegląd pierwszych sześciu decyzji potwierdził ich zgodność z odpowiedziami właściciela. Przegląd SEC-07 wykazał wymaganą ochronę starych żądań, włączoną jawnie do zakresu zadania. Jest to przegląd decyzji i dokumentacji, a nie odbiór implementacji. Nie zatwierdzono wdrożeń ani wydania. Końcowy przegląd zapisu SEC-07 potwierdził zachowanie tych ograniczeń. Sprawdzono odnośniki w dziewięciu zmienionych dokumentach, dwie tabele planu i obecność zachowanych grup zadań. Ocena tej aktualizacji: zgodność z celem i architekturą 0,95; prostota 0,90; kontrola ryzyka 0,85; utrzymywalność 0,90; minimum 0,85. Ryzyko SEC-07 pozostaje jawnie przypisane do wymaganego projektu ochrony starych żądań; decyzja o retencji nie zastępuje tego projektu. Pozostają konkretne liczby progów oraz pozostałe proponowane parametry harmonogramu.

## Następny krok

Dokończyć Q13 według planu i jego specyfikacji. Nie przywracać dawnej infrastruktury testowej bez sprawdzenia wymaganych wejść. Pozostałe zadania kontynuować w przypisanej kolejce; przeniesienie po wydaniu nie oznacza ich wykonania.

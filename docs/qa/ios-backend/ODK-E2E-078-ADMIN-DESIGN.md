# ODK-E2E-078 — zatwierdzony projekt panelu administracyjnego

Status: `APPROVED`

Data: 2026-09-07

## Założenie

Panel rozszerza istniejący ekran administratora bez nowej nawigacji, modali ani systemu wizualnego. Na pierwszym planie pokazuje wyłącznie informację potrzebną do reakcji; dane wrażliwe są pobierane i audytowane dopiero po otwarciu szczegółów. Brak zmian w aplikacji mobilnej.

## Lista

Nagłówek: `BEZPIECZEŃSTWO` / `Incydenty bezpieczeństwa` oraz krótka informacja, że lista zawiera klasyfikację, termin 72 godzin i najpilniejsze działanie.

Każdy wiersz pokazuje tylko:

- klasyfikację: do oceny, naruszenie potwierdzone albo brak naruszenia;
- termin 72 godzin: nierozpoczęty, pozostały czas albo stan po terminie;
- jedno najpilniejsze działanie wyliczone z read modelu;
- przycisk `Otwórz szczegóły`.

Lista nie pokazuje tytułu, opisu, identyfikatora, adresatów, powodów decyzji ani treści zawiadomień.

## Szczegóły

Szczegóły są prezentowane inline w tym samym układzie co istniejący panel DSAR. Sekcje występują w kolejności:

1. czasy — utworzenie, świadomość, termin 72 godzin, aktualizacja i zamknięcie;
2. opis i wersjonowana ocena — domyślnie zwinięte;
3. trzy osie decyzji — klasyfikacja, UODO i osoby; każda zmiana wymaga uzasadnienia;
4. eksport UODO — przygotowanie artefaktu oraz ręczne zapisanie kanału, referencji i dowodu; stałe copy: `System nie wysyła zgłoszeń do UODO.`;
5. zawiadomienie osób — przygotowanie zamrożonej treści i osobna jawna wysyłka, adresaci niewyświetlani ponownie;
6. blokada retencji — ustawienie albo zwolnienie z uzasadnieniem;
7. historia — domyślnie zwinięta, bez surowych danych osobowych.

Sekcje opisowe i operacyjne używają natywnego `details`, aby formularze nie przeciążały widoku.

## Stany bezpieczeństwa i dostępność

- przed nowym odczytem poprzednie szczegóły są usuwane ze stanu UI;
- konflikt rewizji blokuje dalsze zapisy do czasu udanego odświeżenia;
- wynik wysyłki `unknown` jest opisany jako wymagający ręcznego sprawdzenia, bez sugerowania sukcesu;
- daty korzystają z elementu `time` i nie są rozróżniane samym kolorem;
- region szczegółów ma własną etykietę, a formularze jawne etykiety pól;
- `nextAction` pochodzi z jednego, testowanego read modelu;
- etykieta pobrania eksportu pojawia się wyłącznie wtedy, gdy backend udostępnia rzeczywisty artefakt.

## Ocena niezależna

- spójność: `0.93`;
- prostota: `0.88`;
- kontrola ryzyka: `0.84`;
- utrzymywalność: `0.89`.

Minimum: `0.84`, werdykt `APPROVE`.

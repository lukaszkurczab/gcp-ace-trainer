# Practice Hub screen

## Do zmiany

### Usunąć draft track

Na przekroju całej aplikacji usunąć wszystkie wzmianki o "draft". Aplikacja jest w fazie rozwoju, więc naturalnie wszystko jest draftem, jednak nie ma potrzeby tego komunikować, chciałbym widzieć finalną wersję.

### Utworzenie

Aktualnie nie widzę ekranu w drzewie nawigacji. Najpewniej należy go utworzyć. Ekran ten ma być centrum rozpoczynania nauki (start, ustawienie, statystyki, powtórki)

### Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/practice_hub_unified

### Finalny układ

Od góry:

Header z nazwą aplikacji - Nawigacja. Zawiera back button pozwalający wrócić na poprzedni ekran.

Next topic - Zawiera informację o aktualnie wybranym rozdziale (topic) oraz daje opcje jego zmiany. Naciśnięcia na "Change topic" przenosi na Topic roadmap screen.

Continue/start practice - główny kafelek na ekranie. Powinien zawierać nazwę aktualnie przerabianego tematu, przycisk start session, oraz manage settings.

- start session rozpoczyna nową sesję treningową przenosząc na ekran z pytaniami (to powinien być wspólny ekran dla wszystkich ścieżek w różnych wariantach, wykorzystaj mapę)
- manage session przenosi na ekran pozwalający dostosować ustawienia sesji treningowej (Practice setup screen)

Other practice modes - sekcja pozwalająca rozpocząć sesję treningową z predefiniowanymi ustawieniami:

- learn - sesja zawierająca wyjaśnienia po każdym pytaniu, oraz dająca wskazówki jak rozwiązywać poszczególne rodzaje zadań
- drill - sesja z wielokrotnie przeplatającymi się zadaniami tego samego typu z obecnego rozdziału, ale w różnych wariantach
- Review - wyświetla losowe pytania z ukończonych rozdziałów
- weak area - wyświetla pytania z zagadnień które użytkownikowi idą słabo z tej ścieżki
- practice - rozpoczyna testowy egzamin (niedostępne na razie dla ścieżki algorytmicznej)

Statistics - kafelek z podstawowymi statystykami dla wybranej ścieżki, pozwalający przejść po naciśnięciu "More stats" na ekran ze szczegółowymi statystykami (Statistics screen)

Nawigacja - nawigacja pozwalająca przenosić się między ekranami aplikacji, uniwersalna dla całej aplikacji

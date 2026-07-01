# Select Track screen

## Do zmiany

### Usunąć draft track

Na przekroju całej aplikacji usunąć wszystkie wzmianki o "draft". Aplikacja jest w fazie rozwoju, więc naturalnie wszystko jest draftem, jednak nie ma potrzeby tego komunikować, chciałbym widzieć finalną wersję.

### Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/select_track

### Finalny układ

Od góry:

Header z nazwą aplikacji - Nawigacja. Zawiera back button pozwalający wrócić na poprzedni ekran.

Choose track - Sekja pozwalająca zmienić obecną ścieżkę. Aktualnie zawiera tylko dwie opcje (Cloud Certification oraz Algorithm Patterns). Tile ze ścieżkami powinny zawierać nazwę, opis i zależnie od tego czy ścieżka została rozpoczęta:

- jeśli została rozpoczęta zawiera progress (liczba + pod spodem fill bar), następny temat, oraz przycisk Select/Continue
- jeśli nie została jeszcze rozpoczęta text button view track, oraz przycisk Start track

Nawigacja - nawigacja pozwalająca przenosić się między ekranami aplikacji, uniwersalna dla całej aplikacji

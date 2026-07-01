# Home screen

## Do zmiany

### Usunąć draft track

Na przekroju całej aplikacji usunąć wszystkie wzmianki o "draft". Aplikacja jest w fazie rozwoju, więc naturalnie wszystko jest draftem, jednak nie ma potrzeby tego komunikować, chciałbym widzieć finalną wersję.

### Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/home_choice_enabled

### Finalny układ

Od góry:

Header z nazwą aplikacji - czysto ozdobny element, na innych ekranach pełni funkcję nawigacji.

Active track - Zawiera informację o aktualnie wybranej ścieżce (track) oraz daje opcje jej zmiany. Wymaga zmiany słownictwa (current focus -> currect track i change focus -> change track). Naciśnięcia na "Change track" przenosi na Select track screen.

Continue learning - główny kafelek na ekranie. Wyświetla nazwę aktualnie wykonywanego rozdziały (topic) oraz umożliwa rozpoczęcie nauki. Naciśnięcie Start learning (lub continue learning, jeśli user wykonał już jakieś ćwiczenia w tej ścieżce) powoduje przeniesienie na Practice Hub.

Recommended today - sekcja zawierająca alternatywne sposoby rozpoczęcia nauki. Wyświetla się tylko jeśli user wykonał już jakieś zadania w tej ścieżce. W zakładce "Recommended today" w ścieżce algorytmicznej powinny być takie same sekcje jak w cloudowej (Review, weak area, practice). Claudowa też wymaga poprawy, bo aktualnie jest mało czytelna i posiada zbędny element. Powinna zawierać:

- Review - wyświetla losowe pytania z ukończonych rozdziałów
- weak area - wyświetla pytania z zagadnień które użytkownikowi idą słabo z tej ścieżki
- practice - rozpoczyna testowy egzamin (niedostępne na razie dla ścieżki algorytmicznej)

Nawigacja - nawigacja pozwalająca przenosić się między ekranami aplikacji, uniwersalna dla całej aplikacji

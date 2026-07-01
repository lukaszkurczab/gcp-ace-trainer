# Home screen

## Do zmiany

### Usunąć draft track

Na przekroju całej aplikacji usunąć wszystkie wzmianki o "draft". Aplikacja jest w fazie rozwoju, więc naturalnie wszystko jest draftem, jednak nie ma potrzeby tego komunikować, chciałbym widzieć finalną wersję.

### Design

/Users/lukaszkurczab/Desktop/Projects/GCP/docs/designs/practice_setup

### Finalny układ

Od góry:

Header z nazwą aplikacji - Nawigacja. Zawiera back button pozwalający wrócić na poprzedni ekran.

Session length - pozwala ustawić długość sesji (ilość pytań). 3 warianty:

- 10 pytań
- 20 pytań
- 40 pytań

Feedback mode - pozwala ustawić kiedy użytkownik będzie otrzymywał feedback

- After each answer - użytkownik otrzymuje feedback na temat pytania po każdym pytaniu (poprawność odpowiedzi, jeśli zła to dlaczego)
- At session end - użytkownik nie wie czy dobrze odpowiada, na koniec sesji dostaje zbiorczą informacje i może przejrzeć na które pytania odpowiedział dobrze, na które źle i dlaczego

Review behavior - ustawienie dostępne jeśli user wybrał feedback po każdej odpowiedzi. Na koniec sessji użytkownik dostaje podobne, lub to samo pytanie do tego na które źle odpowiedział żeby mógł się poprawić. Te dodatkowe pytania nie są wliczane do statystyk

Start session - główny przycisk na ekranie, pozwala rozpocząć sesję (przenosi na wspólny ekran dla wszystkich ścieżek w różnych wariantach, wykorzystaj mapę)

Back - cofa na poprzedni ekran

Nawigacja - nawigacja pozwalająca przenosić się między ekranami aplikacji, uniwersalna dla całej aplikacji

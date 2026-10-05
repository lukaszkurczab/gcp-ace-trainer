# BIZQ-01 — kolejność odpowiedzi w rzeczywistej praktyce

Status: niezależny odbiór Luna High PASS i root acceptance zakończone; zwykły push w toku. Cały BIZQ-01 pozostaje `partial`, N08/N09 pozostają nieaktywne.

Runtime przygotowywał i zapisywał kolejność opcji dla wystąpienia pytania, ale fasady Design Interview i Certification przekazywały surową kolejność źródłową do adaptera UI. [Preflight](ROOT-SESSION-CHOICE-PRESENTATION-PREFLIGHT.json) odtworzył różnicę w 9/10 przygotowanych pytań dla obu ścieżek. Wymaganie istnieje w kanonicznym kontrakcie runtime; [briefing](SESSION-CHOICE-PRESENTATION-BRIEFING.md) i [niezależny design PASS](SESSION-CHOICE-PRESENTATION-DESIGN-QA.md) zatwierdziły jedną wspólną projekcję, minimum ocen 0,87.

Zmiany:

- `canonicalOptionOrder.ts`: projekcja zweryfikowanej, zapisanej kolejności; brak lub błędny plan daje jawny błąd. Pytania bez choice zachowują dokładny obiekt i deklarowaną kolejność.
- `designInterviewSessionFacade.ts` i `certificationSessionFacade.ts`: stosują tę projekcję bezpośrednio po rozwiązaniu aktualnego wystąpienia. Certification nadal usuwa odpowiedź, feedback i explanations przed ekspozycją UI.
- `canonicalPracticeChoiceOrderProjection.test.ts`: rzeczywiste katalogi, fasady i produkcyjny adapter UI; ponowne renderowanie, correct/wrong submit i ponowne związanie pamięci, stabilne ID/feedback, source immutability, single/multiple choice i niepoprawne plany.

Nie dodano shuffle, schematu, właściciela persistence ani reguły admission. Dotychczasowy generator i walidator kolejności są nadal potrzebne; nie zastąpiono innych ścieżek. Coding używa już zapisanej kolejności, a Design Simulation ma odrębny profil freeform.

[Dokładne sprawdzenia root i hashe](ROOT-SESSION-CHOICE-IMPLEMENTATION-CHECKS.json): regresja RED 0/2, następnie GREEN 4/4. Bramka `qa:static` po korekcie typów: recovery/typecheck PASS, 1872 PASS, 3 FAIL, 4 istniejące SKIP. Trzy błędy cross-repo wynikały z pominięcia przez root wymaganych zmiennych środowiska. [Ponowienie tych trzech testów](SESSION-CHOICE-PRESENTATION-CROSS-REPO.log), ze wskazaniem istniejącego historycznego checkoutu i aktualnego producer SHA, dało 3/3 PASS. [Content i runtime privacy boundaries](SESSION-CHOICE-PRESENTATION-BOUNDARIES.log) PASS. Łącznie dopasowane aktualne wyniki: 1875 PASS, 0 FAIL, 4 SKIP; nie deklarujemy świeżego pełnego zielonego przebiegu. Pierwszy TYPEFAIL oraz pełny log z trzema błędami zachowano.

[Preservation](ROOT-SESSION-CHOICE-PRESERVATION.json) potwierdza 935 nietkniętych plików content, 15 niezmienionych historycznych dowodów, locki aplikacji równe HEAD i czysty tracked producer. Źródła pytań, admission, demosy, konfiguracja usług i runtime danych użytkownika nie zostały zmienione. Cudzy appendix planu i footer stanu pozostają poza stagingiem.

Testy fasad korzystają z pamięci i syntetycznego portu admission. Nie dowodzą prawdziwego profilu Premium, renderowania native ani przerwania transakcji przed ACK; ponowne związanie następuje po zakończonym submit. Nie wykonano deployu, publikacji ani zakupów. Pełny odbiór BIZQ-01 oraz gotowość wydaniowa pozostają osobne.

[Niezależny odbiór Luna High](SESSION-CHOICE-PRESENTATION-IMPLEMENTATION-QA.md): 24/24 focused i typecheck PASS. [Root acceptance](ROOT-SESSION-CHOICE-ACCEPTANCE.json) sprawdza aktualne powiązania i podaje przenośną komendę z rzeczywistą małą literą `designInterviewChoiceFeedback.test.ts`. Historyczny reproducer otrzymał guard trzech pierwotnych źródeł, aby nie deklarował dawnego błędu na naprawionych fasadach; końcowy typecheck PASS.

Następnie zwykły push tego pakietu, następnie kontynuacja semantic/identity N08–N09, cross324vs1089 i wspólnej migracji/admission z synchronizacją konsumentów. Push nie uzasadnia zmiany głównego obszaru.

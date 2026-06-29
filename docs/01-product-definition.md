# 01 — Product Definition

## Status dokumentu

Ten dokument definiuje produkt z perspektywy użytkownika, problemów, person, zakresu MVP i kryteriów sukcesu.

Najważniejsza decyzja: aplikacja nie jest pojedynczym trenerem egzaminacyjnym dla GCP ACE. Jest **wielotrackową aplikacją treningową** dla technicznej nauki. Nazwa produktu to **Patternly**. GCP ACE jest pierwszym trackiem certyfikacyjnym, a Algorithms / LeetCode-style jest drugim trackiem problem-solvingowym.

W dokumentacji nie należy traktować `Practice`, `Exam` i `Review` jako jedynych trybów produktu. To są tryby sesji. Różne tracki mogą mieć różne tryby i różny typ jednostki treningowej.

## Cel produktu

Celem Patternly jest ułatwienie regularnego, praktycznego treningu technicznych umiejętności przez krótkie sesje, szybki feedback, wyjaśnienia, analizę błędów i diagnostykę postępu. Produkt ma pomagać użytkownikowi rozpoznawać wzorce i słabe obszary, a nie tylko przechodzić przez większą liczbę pytań lub zadań.

Produkt startuje od dwóch ścieżek:

1. **Cloud Certification Track**  
   Przygotowanie do Google Cloud Associate Cloud Engineer przez pytania, domeny egzaminacyjne, Practice Mode, Exam Mode, Review i progres według domen.

2. **Algorithms / LeetCode-style Track**  
   Trening rozwiązywania problemów algorytmicznych przez rozpoznawanie wzorców, dobór strategii, analizę złożoności, porównywanie podejść i review błędów koncepcyjnych.

Aplikacja nie powinna być pasywną bazą pytań ani katalogiem zadań. Jej wartość wynika z pętli treningowej:

```txt
wybór tracka
  ↓
wybór trybu sesji
  ↓
training item
  ↓
attempt użytkownika
  ↓
feedback / wynik / analiza
  ↓
wyjaśnienie decyzji
  ↓
zapis błędu lub słabego obszaru
  ↓
review
  ↓
diagnoza postępu
  ↓
kolejna rekomendowana sesja
```

## Pozycjonowanie produktu

**Patternly** jest osobistym laboratorium technicznego treningu. Produkt powinien być bliżej narzędzia pracy niż kursu, gry albo katalogu pytań.

Pozycjonowanie produktowe:

```txt
focused technical practice
pattern recognition
mistake review
readiness insight
short deliberate sessions
```

Produkt nie powinien być pozycjonowany jako:

```txt
official exam simulator
LeetCode replacement
full coding interview platform
course marketplace
gamified learning app
AI tutor without content control
```

## Główna obietnica produktu

Aplikacja ma pomóc użytkownikowi odpowiedzieć na cztery pytania:

1. **Co powinienem ćwiczyć teraz?**
2. **Gdzie mam największe luki?**
3. **Dlaczego moja odpowiedź, strategia albo założenie było poprawne lub błędne?**
4. **Co powinienem rozpoznać następnym razem szybciej: domenę, koncept, wzorzec, strukturę danych albo typ pułapki?**

Dla tracka certyfikacyjnego aplikacja pomaga ocenić gotowość w obrębie domen i tematów egzaminacyjnych. Nie gwarantuje zdania egzaminu.

Dla tracka algorytmicznego aplikacja pomaga poprawić rozpoznawanie wzorców i dobór strategii. Nie zastępuje pełnego środowiska programistycznego ani judge online.

## Model produktu

Produkt powinien być modelowany jako:

```txt
app
  ↓
track
  ↓
session mode
  ↓
training item
  ↓
attempt
  ↓
feedback
  ↓
progress
```

### Track

`Track` oznacza obszar nauki.

W MVP zakładamy dwa tracki:

- `cloud-certification`,
- `algorithms`.

Track odpowiada za:

- typ contentu,
- kategorie postępu,
- dostępne tryby sesji,
- typ feedbacku,
- sposób liczenia słabych obszarów.

### Session mode

`Session mode` oznacza sposób przeprowadzenia sesji w obrębie tracka.

Przykłady:

- Practice,
- Exam,
- Review,
- Pattern Drill,
- Strategy Practice,
- Timed Challenge,
- Weak Areas.

Nie każdy tryb musi istnieć w każdym tracku.

### Training item

`Training item` to ogólna jednostka nauki.

W Cloud Certification Track może to być:

- pytanie jednokrotnego wyboru,
- pytanie wielokrotnego wyboru,
- scenariusz techniczny,
- pytanie domenowe.

W Algorithms Track może to być:

- mini-problem,
- opis problemu do sklasyfikowania,
- wybór optymalnej strategii,
- analiza złożoności,
- porównanie rozwiązania naiwnego i optymalnego,
- pytanie o właściwą strukturę danych,
- rozpoznanie wzorca, np. sliding window, two pointers, BFS/DFS, binary search, dynamic programming.

Nie należy projektować produktu tak, jakby każdy `training item` był wyłącznie pytaniem egzaminacyjnym.

## Persony główne

### 1. Technical Certification Candidate

Osoba techniczna przygotowująca się do egzaminu certyfikacyjnego, początkowo GCP ACE.

Cechy:

- zna podstawy developmentu, DevOps albo chmury,
- chce trenować praktycznie,
- potrzebuje pytań przypisanych do domen i tematów,
- chce widzieć słabe obszary,
- potrzebuje wyjaśnień poprawnych i błędnych odpowiedzi,
- korzysta z telefonu w krótkich sesjach,
- nie chce przechodzić przez długie kursy przy każdej powtórce.

### 2. Algorithmic Problem Solver

Osoba przygotowująca się do rozwiązywania problemów algorytmicznych, np. pod rozmowy techniczne albo regularny trening LeetCode-style.

Cechy:

- zna podstawy programowania,
- często nie wie, od którego wzorca zacząć,
- myli podobne strategie, np. sliding window vs two pointers vs prefix sum,
- potrzebuje zrozumieć, dlaczego dane podejście jest optymalne,
- chce ćwiczyć rozpoznawanie typu problemu przed pisaniem kodu,
- potrzebuje analizy złożoności i typowych pułapek,
- korzysta z telefonu raczej do treningu koncepcyjnego niż do pełnego kodowania.

### 3. Returning Micro-session Learner

Wspólna persona użytkowania dla obu tracków.

Cechy:

- wraca do aplikacji na krótkie sesje,
- chce szybko kontynuować ostatni kontekst,
- oczekuje małego tarcia,
- potrzebuje offline-first,
- nie chce rozbudowanego onboardingu,
- potrzebuje jasnej informacji, co zrobić teraz.

## Potrzeby użytkownika

### Potrzeby wspólne

Użytkownik potrzebuje:

- szybkiego startu sesji,
- jasnego wyboru tracka,
- prostego wyboru trybu treningu,
- czytelnego feedbacku,
- wyjaśnień po odpowiedzi lub po sesji,
- review błędów,
- informacji o słabych obszarach,
- spokojnego UI bez rozpraszaczy,
- działania offline,
- lokalnego zapisu postępu bez konta.

### Potrzeby wynikające z kierunku Focus Lab

Użytkownik potrzebuje interfejsu, który nie walczy o uwagę. Ekrany nie powinny pokazywać wszystkich możliwych danych naraz.

Zasady produktowe dla ekranów:

- jeden dominujący cel na ekran,
- jedna główna akcja,
- maksymalnie kilka widocznych metryk na pierwszym poziomie,
- szczegóły w drill-down, nie na dashboardzie,
- krótkie komunikaty zamiast opisowych bloków tekstu,
- wyraźna hierarchia: aktualna sesja > review > postęp > pozostałe dane,
- mniej kart, większe odstępy, mocniejszy kontrast aktywnych elementów.

### Potrzeby Cloud Certification Track

Użytkownik potrzebuje:

- pytań przypisanych do domen egzaminacyjnych,
- Practice Mode z natychmiastowym feedbackiem,
- Exam Mode bez feedbacku w trakcie sesji,
- wyniku po zakończeniu sesji,
- analizy domen i tematów,
- informacji prawnej, że aplikacja nie jest oficjalnym produktem Google i nie zawiera prawdziwych pytań egzaminacyjnych.

### Potrzeby Algorithms / LeetCode-style Track

Użytkownik potrzebuje:

- zadań przypisanych do wzorców i kategorii problemów,
- treningu rozpoznawania wzorca,
- wyboru strategii rozwiązania,
- porównania podejścia naiwnego i optymalnego,
- analizy złożoności czasowej i pamięciowej,
- listy typowych błędów,
- review problemów, w których źle rozpoznał wzorzec albo dobrał złą strategię,
- informacji prawnej, że aplikacja nie kopiuje treści z LeetCode ani nie jest oficjalnie powiązana z żadną platformą.

## Problemy, które rozwiązujemy

### Problem 1: Użytkownik nie wie, gdzie ma luki

Sama liczba poprawnych odpowiedzi nie wystarczy. Użytkownik musi widzieć słabe obszary per track:

- domeny i tematy w tracku certyfikacyjnym,
- wzorce, kategorie i typy błędów w tracku algorytmicznym.

### Problem 2: Użytkownik zapamiętuje odpowiedzi, ale nie rozumie decyzji

Bez wyjaśnień użytkownik może poprawiać wynik przez pamięć albo zgadywanie. Produkt musi tłumaczyć:

- dlaczego odpowiedź jest poprawna,
- dlaczego dystraktory są błędne,
- dlaczego wybrana strategia działa,
- dlaczego inne podejście jest mniej optymalne,
- jakie założenie użytkownik przeoczył.

### Problem 3: Brak systematycznego review

Błędy muszą wracać do użytkownika. Review nie powinno być prostą listą historii. Powinno obejmować:

- błędne odpowiedzi,
- ręcznie oznaczone elementy,
- słabe domeny,
- źle rozpoznane wzorce,
- powtarzalne typy pomyłek.

### Problem 4: Zbyt duże tarcie blokuje regularność

MVP powinno umożliwiać start treningu możliwie szybko. Logowanie, konfiguracja, onboarding, synchronizacja i ciężkie wykresy są mniej ważne niż stabilna pętla treningowa.

### Problem 5: Jeden model pytań nie pasuje do obu tracków

Pytanie egzaminacyjne i problem algorytmiczny nie są tym samym typem contentu. Wspólny musi być szkielet treningu, a nie format jednostki.

Dlatego produkt potrzebuje generycznego modelu `training item`, a nie modelu zamkniętego na `question`.

### Problem 6: Ryzyko złego pozycjonowania prawnego i brandingowego

Produkt nie może sprawiać wrażenia oficjalnego symulatora egzaminu, kopii LeetCode ani źródła prawdziwych pytań. Content i copy muszą być niezależne, edukacyjne i kontrolowane.

## Zakres funkcjonalny MVP

### Home

Ekran startowy pokazujący:

- ostatnio używany track,
- skrót postępu per track,
- rekomendowaną następną sesję,
- liczbę elementów do review,
- ostatnią sesję,
- szybkie akcje zależne od tracka.

Home nie powinien być zaprojektowany wyłącznie pod domeny GCP ani wyłącznie pod egzamin.

### Track Selector

Ekran lub sekcja wyboru ścieżki:

- Cloud Certification,
- Algorithms.

Track Selector powinien jasno komunikować różnicę między trackami:

- certyfikacja = domeny, pytania, exam readiness,
- algorytmy = wzorce, strategie, złożoność, problem solving.

### Practice / Drill

Wspólny wzorzec trybu treningowego z natychmiastowym feedbackiem.

Dla Cloud Certification:

- pytanie,
- odpowiedź,
- feedback,
- wyjaśnienie,
- zapis wyniku w domenie.

Dla Algorithms:

- mini-problem albo opis sytuacji,
- wybór wzorca lub strategii,
- feedback,
- analiza rozwiązania,
- złożoność,
- typowe pułapki,
- zapis wyniku w kategorii problemu.

### Exam Mode

Tryb sprawdzianu dla tracka certyfikacyjnego.

Zakres:

- pytania bez natychmiastowego feedbacku,
- wynik po zakończeniu,
- summary sesji,
- review odpowiedzi po sesji,
- analiza domen.

`Exam Mode` nie powinien być wymuszany jako główny tryb dla tracka algorytmicznego.

### Strategy Practice / Pattern Drill

Tryb specyficzny dla Algorithms Track.

Zakres:

- rozpoznanie wzorca rozwiązania,
- wybór struktury danych,
- wybór strategii,
- analiza złożoności,
- porównanie rozwiązań,
- krótkie wyjaśnienie optymalnego podejścia.

Pełne pisanie kodu i uruchamianie testów nie są wymagane w MVP.

### Timed Challenge

Opcjonalny, lekki tryb sprawdzający dla Algorithms Track.

W MVP może istnieć jako prosty challenge bez edytora kodu:

- kilka mini-problemów,
- limit czasu,
- wynik po zakończeniu,
- podsumowanie błędnych wzorców.

Jeżeli złożoność implementacyjna rośnie, ten tryb można przesunąć poza MVP bez szkody dla core loopa.

### Review Mode

Tryb powtórki dla obu tracków.

Zakres wspólny:

- błędne elementy,
- elementy oznaczone ręcznie,
- elementy ze słabych obszarów,
- możliwość oznaczenia jako opanowane,
- aktualizacja statystyk po ponownym rozwiązaniu.

Dla Cloud Certification review bazuje głównie na domenach, tematach i odpowiedziach.

Dla Algorithms review bazuje głównie na wzorcach, strategiach, strukturach danych i typach błędów.

### Progress

Ekran diagnostyczny pokazujący postęp per track.

Zakres wspólny:

- liczba ukończonych sesji,
- accuracy per track,
- trend ostatnich wyników,
- lista słabych obszarów,
- liczba elementów do review.

Dla Cloud Certification:

- accuracy per domain,
- słabe domeny,
- wynik ostatniego Exam Mode,
- readiness jako wewnętrzna diagnoza, nie gwarancja zdania.

Dla Algorithms:

- accuracy per pattern,
- accuracy per category,
- najczęściej mylone wzorce,
- problemy z analizą złożoności,
- typowe błędy użytkownika.

### Settings

Minimalne ustawienia:

- reset danych lokalnych,
- preferencje sesji,
- informacje o źródłach treści,
- informacje prawne,
- disclaimer o braku afiliacji z Google, LeetCode lub innymi platformami,
- wersja contentu.

## Poza zakresem MVP

Poza MVP pozostają:

- konta użytkownika,
- logowanie,
- synchronizacja,
- backup w chmurze,
- płatności,
- plan nauki oparty o kalendarz,
- AI tutor,
- społeczność,
- ranking,
- achievementy,
- import zewnętrznych pytań lub problemów przez UI,
- panel administratora,
- web dashboard,
- pełny edytor kodu,
- judge online,
- wykonywanie kodu w aplikacji,
- integracje z LeetCode, HackerRank, Codeforces lub podobnymi platformami,
- kopiowanie treści problemów z zewnętrznych platform,
- oficjalna symulacja egzaminu 1:1,
- obietnica zdania egzaminu albo sukcesu rekrutacyjnego.

## Kryteria sukcesu MVP

MVP jest sensowne, jeżeli użytkownik może:

1. otworzyć aplikację bez konta,
2. wybrać track,
3. rozpocząć właściwy typ sesji dla tracka,
4. rozwiązać kilka `training items`,
5. otrzymać feedback,
6. zobaczyć wyjaśnienie,
7. wrócić do błędów,
8. sprawdzić słabe obszary,
9. kontynuować naukę bez internetu,
10. zrozumieć, co powinien ćwiczyć dalej.

### Kryteria sukcesu Cloud Certification Track

Track certyfikacyjny jest gotowy, jeżeli użytkownik może:

1. rozpocząć Practice Mode,
2. filtrować pytania według domeny albo tematu,
3. zobaczyć feedback po pytaniu,
4. przeczytać wyjaśnienie poprawnej odpowiedzi i dystraktorów,
5. ukończyć Exam Mode,
6. zobaczyć wynik po zakończeniu,
7. zobaczyć słabe domeny,
8. wrócić do błędnych pytań w Review Mode.

### Kryteria sukcesu Algorithms Track

Track algorytmiczny jest gotowy, jeżeli użytkownik może:

1. rozpocząć Pattern Drill albo Strategy Practice,
2. dostać krótki problem albo opis sytuacji,
3. wybrać wzorzec, strukturę danych lub strategię,
4. zobaczyć, czy wybór był trafny,
5. przeczytać analizę rozwiązania,
6. porównać podejście naiwne i optymalne,
7. zobaczyć złożoność czasową i pamięciową,
8. wrócić do źle rozpoznanych wzorców w Review Mode,
9. sprawdzić progres według kategorii problemów.

## Decyzje produktowe

### 1. Track nie jest tym samym co tryb sesji

GCP i Algorithms są trackami. Practice, Exam, Review, Pattern Drill i Strategy Practice są trybami sesji.

To rozróżnienie jest ważne, bo chroni produkt przed chaosem nawigacyjnym i modelem danych zamkniętym na jeden typ contentu.

### 2. Algorithms Track ma być strategy-first

W MVP track algorytmiczny powinien koncentrować się na:

- rozpoznawaniu wzorca,
- wyborze strategii,
- analizie złożoności,
- typowych pułapkach,
- review błędów koncepcyjnych.

Pełne kodowanie na telefonie jest ryzykowne UX-owo i technicznie. Może być etapem późniejszym, ale nie powinno blokować pierwszej wersji.

### 3. Progress musi być per track

Nie należy mieszać wyników certyfikacyjnych z algorytmicznymi w jedną globalną metrykę gotowości.

Globalny Home może pokazywać skrót, ale właściwa diagnostyka musi być rozdzielona per track.

### 4. Content jest częścią produktu

Bez dobrych wyjaśnień aplikacja staje się quizem. Każdy `training item` powinien mieć wystarczający feedback, aby użytkownik rozumiał decyzję, a nie tylko znał wynik.

### 5. MVP ma być offline-first i lokalne

Brak konta, backendu i synchronizacji jest świadomą decyzją produktową na start. Wartość MVP ma wynikać z jakości treningu, nie z infrastruktury.

### 6. Patternly ma być Focus Lab, nie content feedem

Kierunek stylistyczny Focus Lab oznacza, że produkt powinien projektować skupienie, a nie eksponować całą zawartość aplikacji na pierwszym ekranie.

W praktyce:

- Home nie jest raportem ze wszystkiego,
- ekran sesji nie jest dokumentacją problemu,
- Progress nie jest centrum analitycznym,
- Review nie jest archiwum historii,
- Library nie jest głównym sposobem używania aplikacji.

Każdy ekran powinien mieć jeden dominujący powód istnienia.

## Antywzorce produktowe

Nie robić:

- dokumentacji i UI zamkniętych na `Patternly`,
- modelu danych opartego wyłącznie o `question`,
- Home zaprojektowanego wyłącznie pod domeny GCP,
- `Exam Mode` jako centralnego trybu dla całej aplikacji,
- kopiowania problemów z LeetCode,
- komunikacji sugerującej oficjalną afiliację z Google albo LeetCode,
- pytań bez wyjaśnień,
- problemów algorytmicznych bez analizy strategii i złożoności,
- wyników bez podziału na domeny, wzorce albo kategorie,
- gamifikacji przed stabilnym core loopem,
- logowania bez realnej potrzeby,
- social features,
- „AI magic” bez kontroli jakości contentu,
- pełnego edytora kodu jako wymogu MVP,
- ekranów przeładowanych kartami, metrykami i długimi blokami tekstu,
- layoutów udających oficjalne materiały Google, LeetCode lub innej platformy.

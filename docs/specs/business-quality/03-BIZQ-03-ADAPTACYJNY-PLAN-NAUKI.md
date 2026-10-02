# BIZQ-03 — adaptacyjny plan pod zakres, czas i termin

**Priorytet:** P1  
**Główne repo:** aplikacja + content; backend wyłącznie jako konsument koniecznej zmiany kontraktu sync  
**Zależności odbioru:** BIZQ-02, BIZQ-04, BIZQ-05 oraz naprawione pytania z BIZQ-01  
**Cel:** zastąpić powielanie domyślnej sesji propozycją uzasadnioną realnym materiałem, dowodami, powtórkami, dostępnością i datą celu.  
**Dokument wspólny:** [00 — plan BIZQ](00-PATTERNLY-BIZQ-PLAN-ROBOCZY.md).

## 1. Granica zadania

Docelowy planner nie ma odpowiedzieć „ile pytań mieści się do daty”, ale „jaką pracę warto wykonać w dostępnym czasie i czy założony zakres jest realistyczny”. Jest deterministyczny, działa offline i podaje powód rekomendacji.

Nie buduj systemu ML, modelu mastery, codziennego LLM coacha ani probabilistycznego przewidywania zdawalności. Nie zmieniaj istniejącej reguły ukończenia pakietu. Nie licz całego banku pytań jako obowiązkowego programu. Nie twórz nowego centralnego silnika sesji ani drugiego harmonogramu reminders.

**Wszystkie reguły planowania poniżej są docelową zmianą BIZQ.** Obecny kod i parametry muszą zostać odczytane przed implementacją. Nową semantykę wpisz do właściwego kanonicznego kontraktu i jego testów, nie tylko do komentarzy w generatorze.

## 2. Pojęcia, które muszą pozostać oddzielone

| Pojęcie | Właściciel / znaczenie |
| --- | --- |
| Cel | Typ przygotowania, wybrany zakres, termin lub own pace. |
| Dostępność | Dni i minuty, które użytkownik rzeczywiście przeznacza na ten plan. |
| Stan ukończenia pakietu | Istniejący evaluator minimum prób + ruchomego okna; nie jest nową definicją wiedzy. |
| Dowody edukacyjne | Z BIZQ-02/04/05: próby, etapy, pokrycie, błędy, due review, nowe przykłady. |
| Propozycja planu | Nowa, niezaakceptowana wersja rekomendowanej pracy i wykonalności. |
| Zaakceptowany plan | Stan zapisany i synchronizowany atomowo z celem. |
| Dzisiejsza rekomendacja | Odczyt wynikający z planu/dowodów w granicach jego kontraktu; nie potajemna modyfikacja zaakceptowanego planu. |
| Plan aktywnej sesji | Utrwalone occurrence/item/option order; nie zmienia się po nowych odpowiedziach. |
| Przypomnienia | Lokalny dla urządzenia harmonogram, osobny od prognozy i propozycji. |

Nazwa wyniku generatora `ready` oznacza poprawną propozycję techniczną, nie „learner is ready”. Nie mieszaj tych znaczeń w copy i testach.

## 3. Dane wejściowe

### 3.1. Fakty od użytkownika

Użyj obecnego modelu celu. Zachowaj rodzaje dat opisane w aktualnym planie R1: wydarzenie dla egzaminu/rozmowy, termin dla foundations, checkpoint dla refresh, brak daty dla own pace.

Plan wymaga jawnych dni nauki i dostępnych minut. Jeżeli dotychczasowy ekran zapisuje jedynie długość sesji lub „light/regular/intensive”, nie traktuj tego jak potwierdzonej liczby minut. Rozszerz istniejący flow minimalnym, zgodnym z brandem wyborem dostępności i pokaż założenie przed akceptacją. Nie twórz drugiego onboardingu celu.

Jasno określ, czy budżet dotyczy jednego tracka, czy całej nauki. Nie licz tych samych 20 minut jako pełnego budżetu dla dwóch równoległych tracków. Gdy obecny model jest wyłącznie per-track, zachowaj tę granicę i pokaż użytkownikowi, że wpisuje czas dla tego tracka. Globalny optymalizator wielu tracków nie jest wymagany; potwierdzony wspólny budżet wymaga jawnego podziału, nie podwójnego zużycia.

### 3.2. Fakty z pakietu

Wykorzystaj istniejącą taxonomy, mental units, blueprinty trybów, uprawnienia, regułę ukończenia, accepted shortening paths i profile symulacji. Dla każdego potrzebnego elementu ustal istniejącego producenta i konsumenta.

Brakujące dane nie mogą zostać odgadnięte z liczby plików, długości JSON-a ani kolejności `modes[0]`. Najmniejsze uzasadnione rozszerzenie blueprintu planowania może zawierać:

- zakres jednostek/decyzji właściwy dla wybranego celu;
- priorytet i relacje konieczne do zaproponowania kolejnej pracy;
- dozwolone tryby i ich realne długości;
- autorski szacunek czasu dla danej klasy pracy/trybu;
- jawne warianty ograniczenia zakresu, jeżeli pakiet je dopuszcza;
- wersję polityki interpretacji dowodów i kosztu.

To metadane mające konkretnego konsumenta — planner. Nie dodawaj osobnego schematu contentu, drugiej taxonomy, kolejnego manifestu pytań ani nowych „statusów gotowości”. Brak potrzebnego pola ma być jawnie wskazany w raporcie kontraktu.

### 3.3. Fakty z nauki

Pobierz spójny snapshot z BIZQ-02: profil, track, pakiet, cel/plan, kwalifikujące próby, review i obecny stan sesji. Dołącz obsługiwane dowody etapów, nowych przykładów i rzeczywisty foreground time.

Wyświetlenie pytania nie jest wykonaniem pracy. Rozwinięcie Details nie jest sukcesem ani mastery. Nieutrwalona odpowiedź i draft symulacji nie są ukończonymi próbami. Zachowaj rzeczywiste zasady finalization.

## 4. Model pozostałej pracy

### 4.1. Trzy grupy użytkowe

1. **Nowy materiał / dalsza praktyka:** nieobjęte lub słabo zbadane decyzje w zadeklarowanym zakresie, dobierane według etapów nauki i istniejących reguł.
2. **Naprawa i utrwalanie:** rzeczywiste błędy i due obligations z BIZQ-04. Natychmiastowa naprawa i retrieval po czasie są odrębnymi celami.
3. **Sprawdzenie nowych przykładów:** dozwolona diagnoza/mixed practice/transfer/symulacja z BIZQ-05, w granicach uprawnień i profilu trybu.

Wewnętrzna reprezentacja może rozróżniać więcej powodów, ale UI nie powinno pokazywać technicznej taxonomy jako serii kart.

### 4.2. Co jest jednostką pracy

Jednostka planowania to konkretna potrzeba edukacyjna albo blok sesji, a nie każdy niewidziany item. Używaj `mentalUnitId`, stage i rzeczywistych review references. Dobierz ograniczoną liczbę zgodnych pytań do tej potrzeby. Nie generuj celu „przerób wszystkie 752 pytania”.

Wersjonowana polityka ma jawnie określać, jakie dowody uzasadniają następny blok. W pierwszej implementacji wykorzystaj istniejące rekomendacje etapowe; nie dodawaj ukrytego mastery score ani własnego progu „3 poprawne = opanowane”. Gdy w pakiecie brak podstaw do wyliczenia pełnej pozostałej pracy, planuj kolejny uzasadniony etap i pokaż niepewność horyzontu.

### 4.3. Unikanie podwójnego liczenia

Jedna planowana próba może realizować kilka potrzeb: zwiększyć kwalifikujący wolumen i sprawdzić konkretny mental unit. Jej koszt liczysz raz. Prawdziwa powtórka ma dodatkowo własny termin i zasady kwalifikacji; nie zaliczaj zwykłej praktyki jako review tylko po to, by zmniejszyć backlog.

Najprostszy model to planowane bloki z referencjami do pokrywanych potrzeb. `effort(block)` sumujesz po unikalnych blokach, nie po każdej krawędzi do potrzeby. Kontroluj duplikaty source-item, review-entry i work-unit. Prognozowana rezerwa review jest resztą po odjęciu już zaplanowanych rzeczywistych obligations, nie drugim naliczeniem tych samych pozycji.

### 4.4. Znana praca i niepewna praca

Rozróżnij:

- znane obowiązki, np. konkretne due entries i wymagane bloki w zadeklarowanym zakresie;
- planowaną, oszacowaną pracę edukacyjną;
- niepewną dodatkową pracę wynikającą z możliwych błędów i jakości ruchomego okna.

Jeżeli minimum prób jest osiągnięte, ale jakość nadal za niska, planner może zaproponować kolejny ograniczony blok naprawczy i późniejszy check. Nie może wyznaczyć gwarantowanej liczby poprawnych przyszłych odpowiedzi ani uznać pozostałej pracy za zero.

Zmiana kontentu/zakresu może zwiększyć wymagany nakład. Nie „naprawiaj” tego usunięciem dawnych błędów z historii ani przeliczeniem nieporównywalnych wersji na siłę.

## 5. Szacunek czasu

### 5.1. Początek bez historii

Użyj jawnej, wersjonowanej estymaty autorskiej odpowiedniej dla trybu/rodzaju zadania. Estymata ma obejmować rozwiązywanie i typowe czytanie feedbacku w danym trybie. Nie dodawaj kosztu Details po raz drugi, jeśli już mieści się w obserwowanym foreground time.

Nie ustanawiaj globalnego `1 pytanie = 1 minuta`. Pytanie definicyjne, trace algorytmu i scenariusz architektoniczny nie muszą mieć tego samego kosztu. Brak estymaty to `estimate unavailable` albo jawnie ograniczony plan, nie zero minut lub ukryte 60 sekund.

Szacunki autorskie są hipotezami do kalibracji, nie gwarancją czasu rozwiązania. W rekordzie/projekcji zachowaj źródło estymaty: `authored` albo `observed`, liczbę obserwacji i wersję metody — wykorzystując istniejące pola, gdzie to możliwe.

### 5.2. Kalibracja na rzeczywistych sesjach

Najpierw zweryfikuj semantykę istniejącego zegara. Nie dziel wall-clock od startu do końca sesji przez liczbę pytań; pobyt w tle lub wielogodzinna przerwa nie jest nauką.

Dla porównywalnych sesji użyj odpornej statystyki, np. mediany czasu foreground na rozwiązaną occurrence. W pierwszej wersji można przyjąć politykę: minimum 5 porównywalnych zakończonych sesji i 20 rozwiązań; okno maksymalnie 10 ostatnich takich sesji. To proponowane parametry startowe produktu, wymagające zapisania w polityce i testach, nie wiedza o optymalnej liczbie obserwacji.

Nie kalibruj osobno na samych poprawnych lub najszybszych odpowiedziach — zaniżyłoby to koszt nauki. Nie przenoś tempa prostego trybu certyfikacyjnego na Design Interview. Dla mieszanego materiału stosuj istniejące szczegółowe dane czasu albo pozostaw klasową estymatę autorską z niepewnością; nie przypisuj całego kosztu wszystkim itemom jednocześnie.

Bardzo wolne sesje mogą być rzeczywistym czytaniem, a bardzo szybkie zgadywaniem. Odporna estymacja czasu nie może zmieniać wyniku nauki ani tworzyć diagnozy umiejętności z szybkości. Nie potrzebujesz nowej telemetrii serwerowej.

## 6. Kalendarz i wykonalność

### 6.1. Dostępna pojemność

Dla kwalifikujących się lokalnych dni nauki:

```text
C = suma minut faktycznie dostępnych w dniach do granicy celu
```

Dni wyznaczaj w strefie użytkownika przez semantykę lokalnej daty, nie dzielenie różnicy timestampów przez 24 godziny. Uwzględnij dni tygodnia, wyłączenia już obsługiwane przez aplikację, niezużyty dzisiejszy budżet i zmianę strefy.

Czas już wykonany dzisiaj zmniejsza dostępną pojemność, ale nie liczy się drugi raz jako przyszła praca. Nie odejmuj czasu innego tracka, jeśli budżety są jawnie oddzielne; przy wspólnym budżecie odejmuj go raz na poziomie tego budżetu.

**Granica daty:** termin/checkpoint z samą datą obejmuje tę lokalną datę do końca dnia, o ile aktualny kontrakt nie stanowi inaczej. Wydarzenie z godziną kończy planowanie przed godziną wydarzenia. Dla wydarzenia z samą datą nie zakładaj dostępnego pełnego dnia egzaminu — pokaż jawne założenie i zaplanuj pracę do poprzedniego dnia. Jest to proponowane doprecyzowanie BIZQ; zapisz je w kontrakcie i UI przed wdrożeniem.

Own pace nie otrzymuje sztucznego deadline'u. Generuje następne uzasadnione działania w zadeklarowanym rytmie. Przeszły termin nie skutkuje ujemną liczbą pytań ani automatyczną zmianą celu.

### 6.2. Oszacowana praca

```text
R = czas nowych/dalszych bloków
  + czas realnych review/remediation obligations
  + uzasadniona rezerwa przyszłego review
  + czas zaplanowanych checks
```

To suma pracy bez duplikatów. Rezerwa przyszłego review jest prognozą, nie wpisem do kolejki. Nie twórz fikcyjnych prób, błędów ani `dueAt`. Wyznacz ją z obecnej polityki review, planowanych ekspozycji i — przy wystarczających danych — zaobserwowanej potrzeby powtórek. Bez danych użyj jawnej wersjonowanej rezerwy określonej w blueprintcie. Nie narzucaj na stałe każdemu użytkownikowi „20% sesji to review”.

Wynik powinien umieć odróżnić znane minimum, centralną estymatę i niepewną górną granicę. Nie muszą to być trzy liczby na ekranie; mogą być polami domenowymi wspierającymi uczciwą komunikację. Przedział nie jest statystycznym 95% confidence interval.

### 6.3. Stany decyzji

| Stan semantyczny | Warunek | Komunikat/akcja |
| --- | --- | --- |
| Wykonalny według estymaty | Zakres i koszt są określone, plan mieści się w zadeklarowanym czasie | Propozycja planu z estymatą i ograniczeniem, nie gwarancja zdania. |
| Niedobór czasu | Znana konieczna praca lub ograniczenia terminów nie mieszczą się w pojemności | Pokaż różnicę i konkretne dozwolone zmiany. |
| Niepewna pełna estymata | Jakość/zakres/tempo uniemożliwiają oszacowanie całego przygotowania | Zaplanuj kolejny etap, pokaż ograniczenie i kiedy wynik zostanie przeliczony. |
| Brak kontraktu | Brakuje potrzebnej reguły, blueprintu lub metadanych | Jawny brak; nie „zero pozostałej pracy”. |
| Own pace | Brak terminu | Brak shortfall względem daty; następna użyteczna praca. |
| Dostęp/pakiet blokuje | Nie ma prawa lub prawidłowego contentu do zaproponowanego działania | Prawdziwy stan dostępu/contentu, nie problem z czasem. |

Wykonalność czasowa i spełnienie reguły nauki to dwie osie. Użytkownik może mieć dość czasu, ale nie mieć jeszcze dowodów jakości. Może też spełnić regułę pakietu, lecz nadal chcieć utrwalać do wydarzenia.

### 6.4. Przykład liczbowy do testów

Fixture A ma 360 minut nowej/dalszej pracy, 90 minut review i 30 minut checks; razem 480 minut. Przy 12 dniach po 20 minut pojemność to 240 minut. Niedobór wynosi 240 minut, a równomierne tempo wymagane dla estymaty to 40 minut na dostępny dzień. Planner nie może uznać celu za mieszczący się w 20 minutach tylko dlatego, że zaproponował 10 pytań.

Fixture B: ten sam nakład, 24 dni po 20 minut — mieści się nominalnie, bez rezerwy dodatkowej. Fixture C: 30 dni po 20 minut — zapas 120 minut może pomieścić rzeczywiste powtórki/niepewność; nie trzeba zwiększać liczby nowych pytań tylko po to, by zapełnić każdy dzień.

Liczby nie są estymatą realnego tracka. Każdy test ma jawny blueprint i fake clock.

## 7. Generator planu — najmniejszy spójny algorytm

### 7.1. Kolejność obliczeń

```text
1. Waliduj spójny snapshot, cel, uprawnienia i dostępny pakiet.
2. W razie aktywnej sesji zachowaj jej plan; uwzględnij continue/finish.
3. Zbuduj rzeczywiste potrzeby pracy na podstawie evidence i review.
4. Usuń duplikaty kosztu i rozdziel pracę znaną od niepewnej.
5. Oszacuj koszty z jawnego źródła, zgodnie z trybem i materiałem.
6. Zbuduj lokalny kalendarz oraz pojemność do granicy celu.
7. Rozmieść review z zachowaniem jego dueAt; nie przesuwaj go wstecz.
8. Zaplanuj uzasadnione nowe/dalsze bloki i checks w dostępnych dniach.
9. Sprawdź wykonalność całej estymaty, uprawnienia i dostępność pul.
10. Zbuduj propozycję + powody + różnicę wobec zaakceptowanego planu.
11. Przed akceptacją ponownie sprawdź identity i wykonaj istniejącą atomową mutację.
```

Do obliczeń nie potrzeba wyboru wszystkich konkretnych pytań na kilka miesięcy. Plan nauki może zawierać scope/mode/length i koszt; właściwy komplet occurrence/item/option order powstaje dopiero przy kanonicznym przygotowaniu sesji. Po rozpoczęciu sesji pozostaje niezmienny.

### 7.2. Priorytety

Wykorzystaj family policy: aktywna sesja, pilne due/remediation i powtarzalne błędy, brakujące etapy w ważnym zakresie, a następnie odpowiednie checks. Tie-break ma być stabilny, np. due date, istniejący priorytet celu, niższe pokrycie, stabilny ID.

Nie wybieraj automatycznie pierwszego noda ani `modes[0]`. Priorytety mają być zależne od celu i danych, ale bez branchy po konkretnym trackId w shared kernel.

Gdy backlog review pochłania całą pojemność, pokaż to uczciwie. Nie zwiększaj samowolnie budżetu ani nie przesuwaj due wstecz; nie kasuj też maintenance, żeby ukryć zaległość. Użytkownik zachowuje manualny wybór innej dozwolonej sesji. Plan ma ujawnić kompromis, nie wymusić nieskończoną pułapkę powtórek.

### 7.3. Dobór dziennej intensywności

Nie wykorzystuj zawsze maksymalnego budżetu na nowe pytania. Rozdziel pozostałą oszacowaną pracę proporcjonalnie do pozostałej dostępności, z pierwszeństwem realnie zapadających terminów review i wymaganych okien checks. Bliski termin może wymagać pełnego budżetu; odległy — mniejszych sesji i dni powtórkowych.

Przykładowy wskaźnik roboczy przed kwantyzacją do długości sesji:

```text
cel minut na dzień ≈ pozostała oszacowana praca ×
                    dostępność danego dnia / pozostała dostępność
```

To narzędzie rozłożenia pracy, nie nowy dowód wiedzy. Przy niedoborze ogranicz plan do zadeklarowanej pojemności i pokaż nieobsłużony zakres. Nie dopasowuj wyniku przez ciche usunięcie wymagań.

### 7.4. Legalne rozmiary sesji

Wybieraj wyłącznie długości obsługiwane przez aktualny tryb/pakiet, np. 10/20/40 tam, gdzie rzeczywiście są dozwolone. Nie uruchamiaj 13 pytań, bo taki wynik wyszedł z dzielenia minut. Nie skracaj fixed diagnostic ani symulacji ze względu na budżet.

Dopuszczone skrócenie review przy małej kompatybilnej puli nadal pokazuje realną długość. Brak treści nie jest powodem do uzupełnienia sesji obcym materiałem. Quick Review bez due items nie jest uniwersalnym sposobem zapełnienia małego okna.

Gdy żaden dozwolony blok nie mieści się w budżecie, pokaż realny koszt i istniejące dozwolone akcje. Można wykorzystać resume tej samej sesji w kolejnych oknach, jeżeli aktualny tryb na to pozwala i plan jawnie reprezentuje kontynuację, nie kilka nowych sesji. Tryb z absolutnym czasem egzaminu nie może zostać sztucznie rozłożony na dni. Użytkownik może świadomie zwiększyć budżet; planner nie robi tego za niego.

Szacunek czasu nie jest timerem odcinającym pytanie. Nie przerywaj odpowiedzi w połowie po wykorzystaniu minut. Rzeczywiste przekroczenie kosztu zasila następną estymację.

## 8. Kiedy i jak plan się zmienia

Przelicz propozycję po ukończonej pracy, nowych due obligations, powrocie po przerwie, zmianie daty/dni/minut, zmianie zakresu/pakietu, uprawnień i rozwiązaniu konfliktu sync. Użyj istniejących safe entry points; nie pokazuj nowego dialogu po każdej odpowiedzi.

Można na bieżąco odświeżać read-only forecast oraz dozwoloną rekomendację wewnątrz zaakceptowanego zakresu. Zmiana utrwalonych dni, czasu, zakresu lub zobowiązań planu wymaga nowej propozycji/rewizji i istniejącej akceptacji. Nie przebudowuj obecnego modelu sync na „elastyczną intencję” tylko dla wygody — wykorzystaj istniejący owner.

Pokaż krótką różnicę: np. więcej review, mniej nowego materiału, potrzebne dodatkowe minuty albo nierealny zakres. Po odmowie pozostaje dotychczasowa atomowa para cel+plan; realna prognoza może nadal pokazywać niedobór. Po akceptacji synchronizuj całą parę, a lokalne reminders aktualizuj w ich własnym workflow.

Opuszczony dzień nie tworzy reguły „jutro dwa razy więcej”. Rozdziel pracę po pozostałych dostępnych dniach. Jeśli to nie wystarcza, pokaż shortfall.

Zmiana deadline'u nie przyspiesza biologicznego upływu czasu: planner nie skraca `dueAt`, nie zalicza wcześniejszych odpowiedzi jako retention i nie obiecuje sprawdzenia trwałości, którego nie da się wykonać przed wydarzeniem.

## 9. UI i komunikaty

Najpierw dopasuj istniejący ekran propozycji i Home. Preferowany zakres: jedna główna akcja, krótki nakład, powód i dostęp do szczegółów. Nie pokazuj wszystkich wewnętrznych pól w nowych kartach.

Przykładowe znaczenia copy do przygotowania w obowiązujących locale:

- „Today: review access policies, then continue networking. About 20 minutes.”
- „You have 12 study days left. This plan is estimated to need about 40 minutes per study day.”
- „Your time budget covers only part of this plan. Change your time, scope or target date.”
- „We can plan your next step, but need more practice results to estimate the full workload.”

To przykłady intencji, nie nakaz wklejenia długiego tekstu. Nie używaj „AI optimized”, „ready in 12 days”, readiness percentage ani technicznych nazw `minimumAttemptCount` w interfejsie.

Przy skróceniu zakresu wolno oferować tylko realną, dopuszczoną ścieżkę pakietu. Wyraźnie nazwij wyłączone obszary; nie nazywaj częściowego zakresu pełnym przygotowaniem do egzaminu. Przy braku takiej ścieżki oferuj tylko dostępne realne zmiany, nie wymyślony „essential mode”.

## 10. Obowiązkowa macierz testów

| ID | Scenariusz | Oczekiwany wynik |
| --- | --- | --- |
| A01 | Identyczne dane, termin za 7 i za 60 dni | Różny rozkład nakładu lub jawny shortfall; nie identyczne 10 pytań niezależnie od celu. |
| A02 | 480 min pracy, 240 min pojemności | Jawny niedobór 240 min przy zadanych fixture; nie przepełniony plan oznaczony wykonalnym. |
| A03 | Nowy użytkownik bez historii czasu | Jawna estymata autorska albo brak estymaty; nie globalne 60 sekund. |
| A04 | Doświadczenie w jednym obszarze, brak innych | Plan zmienia zakres, a nie tylko liczbę pytań. |
| A05 | Minimum prób spełnione, próg jakości nie | Następny uzasadniony etap + niepewność; nie „gotowe”. |
| A06 | Dużo czasu i mało nowego materiału | Review/checks w prawdziwych terminach, brak fillerów. |
| A07 | Duży backlog review | Uczciwy podział i shortfall; nie zgubione entries ani nieskończone nowe sesje. |
| A08 | Dzień opuszczony | Replan w pozostałym budżecie, bez automatycznego podwojenia jutra. |
| A09 | Own pace | Brak deadline'u i karzących komunikatów; działają kolejne rekomendacje. |
| A10 | Termin dzisiaj/wczoraj/brak dni nauki | Jawny przypadek graniczny, bez dzielenia przez zero lub ujemnej pracy. |
| A11 | Zmiana DST w Europe/Warsaw, 25.10.2026 | Lokalny dzień jest liczony raz; brak arbitralnego założenia 24h dla każdej doby. |
| A12 | Zmiana strefy i granica dnia | Identity/refresh poprawne; bez znikania lub dublowania slotów. |
| A13 | Minimum trybu dłuższe niż budżet | Dozwolona kontynuacja lub jawny brak dopasowania; nie nielegalna długość. |
| A14 | Fixed diagnostic/symulacja | Zachowane długości, feedback i timer; planner nie „ścina” egzaminu. |
| A15 | Due za tydzień, deadline jutro | Brak przyspieszonego zaliczenia retention; ograniczenie jawne. |
| A16 | Jedna próba realizuje wolumen i coverage | Czas policzony raz, evidence zgodnie z każdą właściwą semantyką. |
| A17 | Dwa tracki i wspólne 20 minut | Brak podwójnego użycia pojemności lub jawnie rozdzielony budżet. |
| A18 | Oferta Premium w planie Free | Brak przygotowania/nawigacji obchodzącej bramkę; zakres dostępności jawny. |
| A19 | Aktywna sesja podczas przeliczenia | Brak zmiany occurrence/option order i brak przerywania. |
| A20 | Zmiana celu/dowodów tuż przed accept | Stale proposal nie nadpisuje nowszej pary. |
| A21 | Offline→restart→sync conflict | Ten sam lokalny wynik, konflikt rozwiązywany w safe point. |
| A22 | Odrzucona aktualizacja planu | Stary zaakceptowany plan pozostaje, forecast nie kłamie o wykonalności. |
| A23 | Scheduler reminders fail po accept | Stan planu i powiadomień rozdzielony, bez pozornej aktywacji. |
| A24 | Niepoprawne/missing metadata | Jawny problem konkretnego kontraktu, bez fallback mode/item/rule. |

Test A11 używa danych kontrolowanego kalendarza, nie sieci ani realnego oczekiwania na zmianę czasu. Sprawdź aktualny runtime timezone contract. Przy parametrach kosztu testuj zero/NaN/ujemne wartości, przekroczenia zakresu dat i brak wystarczających obserwacji.

## 11. Etapy i odbiór

Wykonuj kolejno: kontrakt i fixtures → model pracy → czas/kalendarz → generator i feasibility → integracja proposal/accept/sync → UI i regresja. Nie twórz wszystkich warstw naraz bez sprawdzenia, czy istniejący moduł już posiada daną odpowiedzialność.

Odbiór wymaga co najmniej dwóch rzeczywistych rodzin materiału o odmiennym charakterze zadań, np. Coding Interview i Certification; Design Interview również przechodzi test dostępu i konfiguracji. Pełna końcowa macierz pokrywa wszystkie aktualnie oferowane tracki w zakresie zgodności danych wejściowych.

Pokaż na iOS trzy wersje planu dla tego samego tracka: nowy użytkownik, powracający z review oraz bliski niewykonalny termin. Każdy plan musi prowadzić do rzeczywistej zgodnej sesji, nie karty z fixture. Syntetyczne profile są dopuszczalne jako dane testu, ale używają prawdziwego runtime i zatwierdzonego contentu.

Raport zawiera algorytm i wersję polityki, pochodzenie kosztów, listę braków metadata, różnice planów, testy, identity/sync evidence i ograniczenia prognozy. Brak danych od użytkowników oznacza, że trafność estymat nie została jeszcze empirycznie potwierdzona; nie blokuje technicznego odbioru, ale blokuje claim o udowodnionej skuteczności.

## 12. Prompt wykonawczy dla Codex

```text
Wykonaj BIZQ-03 zgodnie z tą specyfikacją i dokumentem 00. Nie buduj nowego
runtime, modelu mastery ani LLM planera. Przed kodem odczytaj realny obecny
kontrakt celu, planu, completion, uprawnień, sync i reminders.

Po preflight i wymaganym briefingu ustal minimalny data contract planowania.
Wykorzystaj wyniki BIZQ-02/04/05. Nie zastępuj ich fixture w odbiorze końcowym.
Nowy model ma planować pracę nad decyzjami/mental units i realne powtórki,
a nie dzielić wszystkich niewidzianych pytań przez dni do terminu.

Rozdziel znany nakład, estymatę i niepewną dalszą pracę. Zachowaj aktualną
regułę completion; minimum prób przy niespełnionej jakości nie oznacza końca.
Czas szacuj z jawnego blueprintu, potem z porównywalnego foreground time,
bez traktowania szybkości jako kompetencji i bez podwójnego kosztu feedbacku.

Generuj plan z lokalnego kalendarza i potwierdzonych minut. Zachowaj dueAt,
dołącz rzeczywiste review i checks, unikaj podwójnego liczenia. Dobieraj
wyłącznie legalne tryby/długości. Pokaż shortfall, kiedy pracy nie da się
zmieścić; nie przyspieszaj retention ani nie zmieniaj samowolnie dostępności.
Own pace nie ma daty. Płatne tryby pozostają płatne.

Przeliczenie forecast nie nadpisuje zaakceptowanego planu. Materialna zmiana
ma przejść przez propozycję, stale check i atomowe goal+plan accept/sync.
Reminders pozostają lokalne; aktywna sesja nie zmienia planu occurrence.

Wdrażaj etapami z testami A01–A24, następnie prawdziwym iOS flow. Używaj
aktualnego brandu i komponentów; bez VoiceOver tests, deploy i publikacji.
Raportuj dokładne polityki, źródła estymat, testy, ograniczenia, realne
różnice planów oraz niezależny odbiór. Nie deklaruj skuteczności edukacyjnej
ani gotowości egzaminacyjnej na podstawie symulowanych danych.
```
